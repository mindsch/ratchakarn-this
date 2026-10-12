// Settings (S01 58:809, XP on S03 58:901) and the first-run AI setup dialog (S02 58:998).
import { useRef, useState } from "react";
import { aiReady } from "../../lib/ai";
import { useApp } from "../../lib/app";
import { chrome } from "../../lib/copy";
import { PRESETS } from "../../lib/llm/presets";
import { McpClient, type McpTool } from "../../lib/llm/mcp";
import { mcpCache } from "../../lib/mcpCache";
import { Banner, Button, Card, PageHeader, Segmented, StatusTag, TextInput, useDialogFocus } from "../../ui";
import { THEMES } from "../../lib/theme";
import { connectionFingerprint, ModelPicker, ProviderChips, useConnectionTest } from "./shared";
import "./settings.css";

// Lines from prompts/disclaimer.md, minus the court line (no court row in this version).
const ABOUT = [
  "ผลลัพธ์จากปัญญาประดิษฐ์อาจผิดพลาดหรือไม่ครบถ้วน โปรดตรวจทานก่อนใช้ทุกครั้ง",
  "ผู้ใช้เป็นผู้รับผิดชอบต่อผลของการนำไปใช้ทั้งหมด โครงการนี้ไม่รับรองความถูกต้อง ความเหมาะสม หรือการที่หน่วยงานใดหรือศาลใดจะยอมรับเอกสาร",
  "ตราครุฑเป็นเครื่องหมายที่กฎหมายคุ้มครอง แปลเป็นราชการ ไม่ได้ให้ภาพตราครุฑมา ผู้ใช้ต้องตรวจสอบสิทธิ์การใช้เองก่อนวางตราลงในเอกสาร",
];

function Advanced() {
  const { settings, updateSettings } = useApp();
  const [status, setStatus] = useState<Record<number, string>>({});
  const test = async (i: number) => {
    const m = settings.mcp[i];
    setStatus((s) => ({ ...s, [i]: "กำลังเชื่อมต่อ..." }));
    try {
      const client = new McpClient({ url: m.url, headers: m.authorization ? { Authorization: m.authorization } : undefined });
      const tools: McpTool[] = await client.connect();
      mcpCache.set(m.url + "|" + m.authorization, { client, tools });
      setStatus((s) => ({ ...s, [i]: `เชื่อมต่อแล้ว พบเครื่องมือ ${tools.length} รายการ: ${tools.map((t) => t.name).join(", ")}` }));
    } catch (e) {
      setStatus((s) => ({ ...s, [i]: `ล้มเหลว: ${(e as Error).message} (เซิร์ฟเวอร์ต้องเปิด CORS)` }));
    }
  };
  const setMcp = (i: number, p: Partial<{ url: string; authorization: string }>) => updateSettings({ mcp: settings.mcp.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <details className="adv">
      <summary>ขั้นสูง</summary>
      <div className="stack" style={{ marginTop: 12 }}>
        <label className="field">
          <span className="field-label">ประเภท API</span>
          <select className="select" value={settings.kind} onChange={(e) => updateSettings({ kind: e.target.value as typeof settings.kind })}>
            <option value="openai">OpenAI-compatible</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </label>
        <div>
          <h4 className="t-label-m">เครื่องมือ MCP (ทดลอง)</h4>
          <p className="t-body-s muted">เพิ่มเซิร์ฟเวอร์ MCP แบบ remote (Streamable HTTP) ใช้กับ OpenAI-compatible เท่านั้น ทุกการเรียกเครื่องมือจะแสดงในแชท</p>
        </div>
        {settings.mcp.map((m, i) => (
          <div key={i} className="mcp-row">
            <TextInput value={m.url} onChange={(e) => setMcp(i, { url: e.target.value })} placeholder="https://example.com/mcp" aria-label="URL ของ MCP" />
            <TextInput value={m.authorization} onChange={(e) => setMcp(i, { authorization: e.target.value })} placeholder="Authorization (ถ้ามี) เช่น Bearer xxx" type="password" autoComplete="off" aria-label="Authorization" />
            <div className="row">
              <Button size="sm" onClick={() => test(i)}>เชื่อมต่อ/ทดสอบ</Button>
              <Button size="sm" variant="ghost" onClick={() => updateSettings({ mcp: settings.mcp.filter((_, j) => j !== i) })}>ลบ</Button>
            </div>
            {status[i] && <p className="t-body-s muted">{status[i]}</p>}
          </div>
        ))}
        <div>
          <Button size="sm" onClick={() => updateSettings({ mcp: [...settings.mcp, { url: "", authorization: "" }] })}>+ เพิ่มเซิร์ฟเวอร์ MCP</Button>
        </div>
      </div>
    </details>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, theme, setTheme } = useApp();
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [test, runTest] = useConnectionTest();
  const preset = PRESETS.find((p) => p.id === settings.presetId);
  const ready = aiReady(settings);
  const fingerprint = connectionFingerprint(settings);
  const currentTest = test.fingerprint === fingerprint;
  const connected = ready && test.state === "ok" && currentTest;

  return (
    <div className="page">
      <div className="set-col">
        <PageHeader title="ตั้งค่า" status="เก็บในเบราว์เซอร์นี้ และใช้ได้ทันที" />

        <Card title="AI ของคุณ" right={<StatusTag tone={connected ? "success" : "neutral"}>{connected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้ตั้งค่า"}</StatusTag>}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="field-label">ผู้ให้บริการ</span>
            <ProviderChips settings={settings} update={updateSettings} />
          </div>
          <div className="key-row">
            <TextInput
              label="API key"
              type={show ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder={settings.presetId === "ollama" ? "Ollama ไม่ต้องใส่คีย์" : "วางคีย์ที่นี่"}
              autoComplete="off"
            />
            <Button onClick={() => setShow((v) => !v)}>{show ? "ซ่อน" : "แสดง"}</Button>
          </div>
          <div className="grid2">
            <TextInput label="Base URL" value={settings.baseUrl} onChange={(e) => updateSettings({ baseUrl: e.target.value })} placeholder="https://.../v1" />
            <ModelPicker settings={settings} update={updateSettings} />
          </div>
          <label className="check-row">
            <input type="checkbox" checked={settings.rememberKey} onChange={(e) => updateSettings({ rememberKey: e.target.checked })} />
            จำคีย์ไว้ในเบราว์เซอร์นี้
          </label>
          <hr className="hr" />
          <div className="row test-row" style={{ gap: 16 }}>
            <Button onClick={() => runTest(settings)} disabled={!ready || test.state === "busy"}>
              {test.state === "busy" ? "กำลังทดสอบ…" : "ทดสอบการเชื่อมต่อ"}
            </Button>
            <span className="t-body-s muted">คีย์ส่งตรงไปยังผู้ให้บริการที่คุณเลือก ไม่ผ่านเซิร์ฟเวอร์ของโครงการ</span>
          </div>
          {test.msg && currentTest && (
            <p className={"test-result " + (test.state === "ok" ? "ok" : "danger")} role="status">
              {test.msg}
            </p>
          )}
          <hr className="hr" />
          <Advanced />
        </Card>

        <Card title="การแสดงผล">
          <div>
            <div className="t-label-m">ธีม</div>
            <div className="t-body-s muted">เปลี่ยนหน้าตาเว็บเป็นเรื่องสนุก ไม่แตะเอกสารที่ส่งออก</div>
          </div>
          <Segmented
            label="ธีม"
            options={THEMES.map((t) => ({ value: t.id, label: t.label }))}
            value={theme}
            onChange={(v) => {
              setTheme(v);
              setSaved(true);
            }}
          />
          {saved && (
            <Banner tone="success" onClose={() => setSaved(false)}>
              {chrome("saved", theme === "xp")}
            </Banner>
          )}
        </Card>

        <Card title="เกี่ยวกับ">
          <div className="about-lines">
            {ABOUT.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- First-run AI setup (S02) ---------- */
const FIRST_KEY = "ratchakarn.firstrun.v1";
const dismissed = () => {
  try {
    return localStorage.getItem(FIRST_KEY) === "1";
  } catch {
    return false;
  }
};

/** Shown once when AI is not ready; "ข้ามไปก่อน" dismisses it for good. Never on the settings page. */
export function FirstRunDialog() {
  const { route, settings, updateSettings, go } = useApp();
  const [gone, setGone] = useState(dismissed);
  const [test, runTest] = useConnectionTest();
  const [model, setModel] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  const close = () => {
    try {
      localStorage.setItem(FIRST_KEY, "1");
    } catch {
      /* private mode: dismissed for this tab only */
    }
    setGone(true);
  };
  const open = !gone && route !== "settings";
  useDialogFocus(open, dialog, close);

  if (!open) return null;
  const needModel = !settings.model.trim();
  const save = async () => {
    if (needModel) {
      setModel(true);
      return;
    }
    if (await runTest(settings)) close();
  };

  return (
    <div className="scrim">
      <div ref={dialog} className="dialog" role="dialog" aria-modal="true" aria-labelledby="fr-title" tabIndex={-1}>
        <div>
          <h2 id="fr-title" className="t-h-m">ตั้งค่า AI ก่อนเริ่มใช้</h2>
          <p className="muted">ใส่คีย์เพื่อใช้ปุ่ม AI ช่วยร่างและ AI ตรวจทั้งฉบับ</p>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label">ผู้ให้บริการ</span>
          <ProviderChips settings={settings} update={updateSettings} />
        </div>
        <TextInput label="API key" type="password" autoComplete="off" value={settings.apiKey} onChange={(e) => updateSettings({ apiKey: e.target.value })} placeholder={settings.presetId === "ollama" ? "Ollama ไม่ต้องใส่คีย์" : "วางคีย์ที่นี่"} />
        <ModelPicker settings={settings} update={updateSettings} error={model && needModel ? "ใส่ชื่อโมเดลก่อน" : undefined} />
        <p className="t-body-s muted">คีย์เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ส่งตรงไปยังผู้ให้บริการ ไม่ผ่านเซิร์ฟเวอร์ของโครงการ</p>
        {test.state === "fail" && <p className="t-body-s danger" role="alert">{test.msg} <button type="button" className="link" onClick={() => { close(); go("settings"); }}>ไปหน้าตั้งค่า</button></p>}
        <div className="spread">
          <Button variant="secondary" onClick={close}>ข้ามไปก่อน</Button>
          <Button variant="primary" onClick={save} disabled={!aiReady(settings) || test.state === "busy"}>
            {test.state === "busy" ? "กำลังทดสอบ…" : "บันทึกและทดสอบ"}
          </Button>
        </div>
        <p className="t-body-s muted">ข้ามได้เลย ทุกอย่างยกเว้น AI ใช้ได้โดยไม่ต้องมีคีย์ แก้ภายหลังได้ที่ปุ่มตั้งค่า</p>
      </div>
    </div>
  );
}
