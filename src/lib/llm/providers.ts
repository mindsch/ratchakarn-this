export type ProviderKind = "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  /** OpenAI-compatible extension supported by Typhoon and some local gateways. */
  repetitionPenalty?: number;
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export class LlmError extends Error {}

async function* sseLines(res: Response): AsyncGenerator<string> {
  if (!res.body) throw new LlmError("ไม่มีข้อมูลตอบกลับ");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, "");
      buf = buf.slice(i + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
  if (buf.startsWith("data:")) yield buf.slice(5).trim();
}

export async function checkResponse(res: Response) {
  if (res.ok) return;
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 400);
  } catch {
    /* ignore */
  }
  if (res.status === 401 || res.status === 403) throw new LlmError("คีย์ API ไม่ถูกต้อง ไม่มีสิทธิ์ใช้โมเดลนี้ หรือคีย์หมดอายุ");
  if (res.status === 429) throw new LlmError("ถึงขีดจำกัดการใช้งานของผู้ให้บริการแล้ว กรุณารอสักครู่หรือตรวจโควตา");
  if (res.status >= 500) throw new LlmError(`ผู้ให้บริการขัดข้องชั่วคราว (${res.status}) กรุณาลองใหม่`);
  throw new LlmError(`ผู้ให้บริการตอบ ${res.status}${detail ? `: ${detail}` : ""}`);
}

export const truncatedError = () =>
  new LlmError("คำตอบจาก AI ยาวเกินขีดจำกัดและถูกตัดก่อนจบ จึงยังประมวลผลไม่ได้ กรุณาลองอีกครั้งหรือลดความยาวเอกสาร");

export function generationParams(cfg: ProviderConfig): Record<string, number> {
  return {
    ...(cfg.maxTokens ? { max_tokens: cfg.maxTokens } : {}),
    ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
    ...(cfg.repetitionPenalty !== undefined ? { repetition_penalty: cfg.repetitionPenalty } : {}),
  };
}

function networkHint(e: unknown): never {
  if (e instanceof LlmError) throw e;
  if ((e as Error)?.name === "AbortError") throw e;
  throw new LlmError(
    "เชื่อมต่อไม่ได้ อาจเป็นเพราะ URL ผิด คีย์ผิด หรือผู้ให้บริการไม่อนุญาตการเรียกจากเบราว์เซอร์ (CORS) ลองใช้ผู้ให้บริการอื่น หรือรันโมเดลในเครื่อง",
  );
}

export async function* streamChat(
  cfg: ProviderConfig,
  system: string,
  messages: ChatMsg[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  try {
    if (cfg.kind === "openai") {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
        body: JSON.stringify({
          model: cfg.model,
          stream: true,
          ...generationParams(cfg),
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      await checkResponse(res);
      for await (const data of sseLines(res)) {
        if (data === "[DONE]") return;
        let j: any;
        try {
          j = JSON.parse(data);
        } catch {
          /* keep-alive */
          continue;
        }
        const choice = j.choices?.[0];
        const t = choice?.delta?.content;
        if (t) yield t as string;
        if (choice?.finish_reason === "length") throw truncatedError();
      }
    } else if (cfg.kind === "anthropic") {
      const res = await fetch(`${(cfg.baseUrl || "https://api.anthropic.com").replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: cfg.model, max_tokens: cfg.maxTokens ?? 4096, temperature: cfg.temperature, stream: true, system, messages }),
      });
      await checkResponse(res);
      for await (const data of sseLines(res)) {
        let j: any;
        try {
          j = JSON.parse(data);
        } catch {
          /* ignore */
          continue;
        }
        if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text as string;
        if (j.type === "message_delta" && j.delta?.stop_reason === "max_tokens") throw truncatedError();
      }
    } else {
      const base = (cfg.baseUrl || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
      const res = await fetch(
        `${base}/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.apiKey)}`,
        {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            generationConfig: { maxOutputTokens: cfg.maxTokens, temperature: cfg.temperature },
          }),
        },
      );
      await checkResponse(res);
      for await (const data of sseLines(res)) {
        let j: any;
        try {
          j = JSON.parse(data);
        } catch {
          /* ignore */
          continue;
        }
        const candidate = j.candidates?.[0];
        for (const p of candidate?.content?.parts ?? []) if (p.text) yield p.text as string;
        if (candidate?.finishReason === "MAX_TOKENS") throw truncatedError();
      }
    }
  } catch (e) {
    networkHint(e);
  }
}
