// Dev tool: a fake OpenAI-compatible endpoint + a fake remote MCP server, for testing the UI without any API key.
//   node scripts/mock-server.mjs   → http://localhost:8787/v1  (model "mock")  and  http://localhost:8787/mcp
import { createServer } from "node:http";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};
const readBody = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b ? JSON.parse(b) : {})); });
const json = (res, code, obj, extra = {}) => { res.writeHead(code, { "Content-Type": "application/json", ...CORS, ...extra }); res.end(JSON.stringify(obj)); };

createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  const body = await readBody(req);
  if (req.url === "/mcp") {
    if (body.method === "initialize") return json(res, 200, { jsonrpc: "2.0", id: body.id, result: { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "mock", version: "1" } } }, { "Mcp-Session-Id": "s1" });
    if (body.method === "notifications/initialized") { res.writeHead(202, CORS); return res.end(); }
    if (body.method === "tools/list") return json(res, 200, { jsonrpc: "2.0", id: body.id, result: { tools: [{ name: "lookup_agency", description: "Look up an agency address", inputSchema: { type: "object", properties: { name: { type: "string" } } } }] } });
    if (body.method === "tools/call") return json(res, 200, { jsonrpc: "2.0", id: body.id, result: { content: [{ type: "text", text: `ที่อยู่ของ ${body.params.arguments.name}: ถนนตัวอย่าง กรุงเทพฯ 10000` }] } });
    return json(res, 404, { error: "x" });
  }
  if (req.url === "/v1/chat/completions") {
    const msgs = body.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (body.tools?.length && last.role === "user") {
      return json(res, 200, { choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "lookup_agency", arguments: JSON.stringify({ name: "เทศบาลตัวอย่าง" }) } }] } }] });
    }
    let override = null;
    const sys = String(msgs[0]?.content ?? "");
    const user = String(last.content ?? "");
    // AI ตรวจทั้งฉบับ (prompts/modes/check.md): JSON suggestions only, built from the user's own text so `original` matches.
    if (sys.includes("\"original\"") && sys.includes("\"field\"")) {
      const subj = user.match(/^เรื่อง[:：]\s*(.+)$/m)?.[1]?.trim();
      const out = [
        ...(subj ? [{ kind: "ภาษาราชการ", field: "head:เรื่อง", original: subj, suggestion: subj.replace(/^ขอ/, "ขอเรียน"), note: "mock" }] : []),
        { kind: "ข้อมูลขาด", field: "head:ที่", original: "", suggestion: "เลขที่หนังสือคืออะไร" },
        { kind: "สะกดคำ", field: "body", original: "ข้อความที่ไม่มีในเอกสาร", suggestion: "x", note: "must be rejected by the invariant" },
      ];
      override = "```json\n" + JSON.stringify(out) + "\n```";
    }
    // เติมช่องจากเรื่องเล่า (prompts/modes/prefill.md): JSON object, unknown slots null.
    if (sys.includes("เติมช่องจากเรื่องเล่า")) override = "```json\n{}\n```";
    const answer = override ?? (last.role === "tool" ? `ได้รับข้อมูลจากเครื่องมือแล้ว: ${last.content}` : `[mock รับระบบพรอมต์ ${msgs[0].content.length} ตัวอักษร] ขอเรียนว่า ${String(last.content).split("\n").pop()} จึงเรียนมาเพื่อโปรดทราบ`);
    if (!body.stream) return json(res, 200, { choices: [{ message: { role: "assistant", content: answer } }] });
    res.writeHead(200, { "Content-Type": "text/event-stream", ...CORS });
    for (const piece of answer.match(/.{1,6}/gs)) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }
  json(res, 404, { error: "not found" });
}).listen(8787, () => console.log("mock on http://localhost:8787  (/v1/chat/completions, /mcp)"));
