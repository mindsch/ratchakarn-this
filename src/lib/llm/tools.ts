import type { ChatMsg, ProviderConfig } from "./providers";
import { checkResponse, generationParams, LlmError, truncatedError } from "./providers";
import type { McpClient, McpTool } from "./mcp";

export interface ToolBinding {
  client: McpClient;
  tool: McpTool;
}

export type ToolEvent = { kind: "call"; name: string; args: string } | { kind: "result"; name: string; text: string };

/**
 * Non-streaming tool loop for OpenAI-compatible endpoints. Every call is reported through onEvent so the
 * UI can show the user what a tool did. Max 5 rounds.
 */
export async function chatWithTools(
  cfg: ProviderConfig,
  system: string,
  messages: ChatMsg[],
  tools: ToolBinding[],
  onEvent: (e: ToolEvent) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (cfg.kind !== "openai") throw new LlmError("เครื่องมือ MCP ใช้ได้กับผู้ให้บริการแบบ OpenAI-compatible ในรุ่นนี้");
  const byName = new Map(tools.map((t) => [t.tool.name, t]));
  const defs = tools.map((t) => ({
    type: "function",
    function: { name: t.tool.name, description: t.tool.description ?? "", parameters: t.tool.inputSchema ?? { type: "object", properties: {} } },
  }));
  const convo: any[] = [{ role: "system", content: system }, ...messages];
  for (let round = 0; round < 5; round++) {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify({ model: cfg.model, ...generationParams(cfg), messages: convo, tools: defs }),
    });
    await checkResponse(res);
    const choice = (await res.json()).choices?.[0];
    if (choice?.finish_reason === "length") throw truncatedError();
    const msg = choice?.message;
    if (!msg) throw new LlmError("ไม่มีคำตอบ");
    const calls = msg.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;
    if (!calls?.length) return msg.content ?? "";
    convo.push(msg);
    for (const c of calls) {
      onEvent({ kind: "call", name: c.function.name, args: c.function.arguments });
      let out: string;
      try {
        const b = byName.get(c.function.name);
        out = b ? await b.client.call(c.function.name, JSON.parse(c.function.arguments || "{}")) : "ERROR: unknown tool";
      } catch (e) {
        out = `ERROR: ${(e as Error).message}`;
      }
      onEvent({ kind: "result", name: c.function.name, text: out.slice(0, 1500) });
      convo.push({ role: "tool", tool_call_id: c.id, content: out });
    }
  }
  throw new LlmError("เรียกเครื่องมือเกินจำนวนรอบที่กำหนด");
}
