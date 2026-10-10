// Minimal MCP client over Streamable HTTP (JSON-RPC via POST). Enough for tools/list and tools/call.
// The server must allow CORS for browser calls. Header values are user-supplied (e.g. Authorization).

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpServerConfig {
  url: string;
  headers?: Record<string, string>;
}

let rpcId = 1;

async function parseResponse(res: Response, id: number): Promise<any> {
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) {
    const text = await res.text();
    for (const line of text.split("\n")) {
      if (!line.startsWith("data:")) continue;
      try {
        const j = JSON.parse(line.slice(5).trim());
        if (j.id === id) return j;
      } catch {
        /* skip */
      }
    }
    throw new Error("MCP: ไม่พบคำตอบในสตรีม");
  }
  return res.json();
}

export class McpClient {
  private session?: string;
  constructor(private cfg: McpServerConfig) {}

  private async rpc(method: string, params?: unknown, notify = false) {
    const id = notify ? undefined : rpcId++;
    const res = await fetch(this.cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(this.session ? { "Mcp-Session-Id": this.session } : {}),
        ...(this.cfg.headers ?? {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", ...(id !== undefined ? { id } : {}), method, params }),
    });
    const sid = res.headers.get("Mcp-Session-Id");
    if (sid) this.session = sid;
    if (!res.ok) throw new Error(`MCP ${method}: HTTP ${res.status}`);
    if (notify) return null;
    const j = await parseResponse(res, id!);
    if (j.error) throw new Error(`MCP ${method}: ${j.error.message ?? "error"}`);
    return j.result;
  }

  async connect(): Promise<McpTool[]> {
    await this.rpc("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "ratchakarn-this", version: "0.1.0" },
    });
    await this.rpc("notifications/initialized", undefined, true);
    const r = await this.rpc("tools/list", {});
    return (r?.tools ?? []) as McpTool[];
  }

  async call(name: string, args: unknown): Promise<string> {
    const r = await this.rpc("tools/call", { name, arguments: args });
    const parts = (r?.content ?? []) as Array<{ type: string; text?: string }>;
    const text = parts.map((p) => (p.type === "text" ? p.text : `[${p.type}]`)).join("\n");
    return r?.isError ? `ERROR: ${text}` : text;
  }
}
