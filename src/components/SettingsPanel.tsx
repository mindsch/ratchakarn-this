import { useState } from "react";
import { PRESETS } from "../lib/llm/presets";
import { McpClient, type McpTool } from "../lib/llm/mcp";
import type { Settings } from "../lib/settings";
import { mcpCache } from "../lib/mcpCache";

interface Props {
  settings: Settings;
  update: (p: Partial<Settings>) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, update, onClose }: Props) {
  const preset = PRESETS.find((p) => p.id === settings.presetId) ?? PRESETS[PRESETS.length - 1];
  const [mcpStatus, setMcpStatus] = useState<Record<number, string>>({});

  const pick = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    update({ presetId: id, kind: p.kind, baseUrl: p.baseUrl });
  };

  const testMcp = async (i: number) => {
    const m = settings.mcp[i];
    setMcpStatus((s) => ({ ...s, [i]: "กำลังเชื่อมต่อ..." }));
    try {
      const client = new McpClient({ url: m.url, headers: m.authorization ? { Authorization: m.authorization } : undefined });
      const tools: McpTool[] = await client.connect();
      mcpCache.set(m.url + "|" + m.authorization, { client, tools });
      setMcpStatus((s) => ({ ...s, [i]: `เชื่อมต่อแล้ว พบเครื่องมือ ${tools.length} รายการ: ${tools.map((t) => t.name).join(", ")}` }));
    } catch (e) {
      setMcpStatus((s) => ({ ...s, [i]: `ล้มเหลว: ${(e as Error).message} (เซิร์ฟเวอร์ต้องเปิด CORS)` }));
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>ตั้งค่าโมเดล</h2>
          <button className="btn ghost" onClick={onClose}>
            ปิด
          </button>
        </div>
        <p className="muted">
          คีย์ของคุณเก็บไว้ในเบราว์เซอร์นี้เท่านั้น และถูกส่งตรงไปยังผู้ให้บริการที่คุณเลือก ไม่ผ่านเซิร์ฟเวอร์ของโครงการ
        </p>

        <label>ผู้ให้บริการ</label>
        <select value={settings.presetId} onChange={(e) => pick(e.target.value)}>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="muted small">{preset.note}</p>

        <label>ประเภท API</label>
        <select value={settings.kind} onChange={(e) => update({ kind: e.target.value as Settings["kind"] })}>
          <option value="openai">OpenAI-compatible</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
        </select>

        <label>Base URL</label>
        <input value={settings.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} placeholder="https://.../v1" />

        <label>ชื่อโมเดล</label>
        <input value={settings.model} onChange={(e) => update({ model: e.target.value })} placeholder={preset.modelHint} />

        <label>API key</label>
        <input type="password" value={settings.apiKey} onChange={(e) => update({ apiKey: e.target.value })} placeholder="ถ้าใช้ Ollama ไม่ต้องใส่" autoComplete="off" />
        <label className="check">
          <input type="checkbox" checked={settings.rememberKey} onChange={(e) => update({ rememberKey: e.target.checked })} />
          จำคีย์ไว้ในเครื่องนี้ (ไม่เลือก = ลบเมื่อปิดแท็บ)
        </label>

        <h3>เครื่องมือ MCP (ทดลอง)</h3>
        <p className="muted small">
          เพิ่มเซิร์ฟเวอร์ MCP แบบ remote (Streamable HTTP) ได้ ใช้ได้กับ OpenAI-compatible เท่านั้นในรุ่นนี้ ทุกการเรียกเครื่องมือจะแสดงในแชต
        </p>
        {settings.mcp.map((m, i) => (
          <div key={i} className="mcp-row">
            <input
              value={m.url}
              onChange={(e) => update({ mcp: settings.mcp.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
              placeholder="https://example.com/mcp"
            />
            <input
              value={m.authorization}
              onChange={(e) => update({ mcp: settings.mcp.map((x, j) => (j === i ? { ...x, authorization: e.target.value } : x)) })}
              placeholder="Authorization (ถ้ามี) เช่น Bearer xxx"
              type="password"
              autoComplete="off"
            />
            <div className="row">
              <button className="btn" onClick={() => testMcp(i)}>
                เชื่อมต่อ/ทดสอบ
              </button>
              <button className="btn ghost" onClick={() => update({ mcp: settings.mcp.filter((_, j) => j !== i) })}>
                ลบ
              </button>
            </div>
            {mcpStatus[i] && <p className="muted small">{mcpStatus[i]}</p>}
          </div>
        ))}
        <button className="btn" onClick={() => update({ mcp: [...settings.mcp, { url: "", authorization: "" }] })}>
          + เพิ่มเซิร์ฟเวอร์ MCP
        </button>
      </div>
    </div>
  );
}
