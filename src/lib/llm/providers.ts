export type ProviderKind = "openai" | "anthropic" | "gemini";

export interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
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

async function check(res: Response) {
  if (res.ok) return;
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 400);
  } catch {
    /* ignore */
  }
  throw new LlmError(`ผู้ให้บริการตอบ ${res.status}${detail ? `: ${detail}` : ""}`);
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
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      await check(res);
      for await (const data of sseLines(res)) {
        if (data === "[DONE]") return;
        try {
          const t = JSON.parse(data).choices?.[0]?.delta?.content;
          if (t) yield t as string;
        } catch {
          /* keep-alive */
        }
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
        body: JSON.stringify({ model: cfg.model, max_tokens: 4096, stream: true, system, messages }),
      });
      await check(res);
      for await (const data of sseLines(res)) {
        try {
          const j = JSON.parse(data);
          if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text as string;
        } catch {
          /* ignore */
        }
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
          }),
        },
      );
      await check(res);
      for await (const data of sseLines(res)) {
        try {
          const parts = JSON.parse(data).candidates?.[0]?.content?.parts ?? [];
          for (const p of parts) if (p.text) yield p.text as string;
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    networkHint(e);
  }
}
