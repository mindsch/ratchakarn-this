import { useEffect, useRef, useState } from "react";
import { SYSTEM_PROMPTS } from "../generated/prompts";
import { LlmError, streamChat, type ChatMsg } from "../lib/llm/providers";
import { McpClient } from "../lib/llm/mcp";
import { chatWithTools, type ToolBinding } from "../lib/llm/tools";
import { mcpCache } from "../lib/mcpCache";
import type { Settings } from "../lib/settings";
import { Disclaimer } from "./Disclaimer";

type ModeId = "convert" | "draft" | "format" | "court";

const MODES: Record<ModeId, { label: string; hint: string; starters: string[] }> = {
  convert: {
    label: "แปลงภาษา",
    hint: "วางข้อความธรรมดา (ไทย/อังกฤษ/ภาษาไหนก็ได้) แล้วแปลงเป็นภาษาราชการ",
    starters: ["พรุ่งนี้ขอลาไปหาหมอนะครับ ไม่สบายมาก", "Please send me the report by Friday, we are running late.", "ใครเอาปากกาไปอีกแล้ว เอามาคืนด้วย"],
  },
  draft: {
    label: "ร่างเอกสาร",
    hint: "บอกว่าต้องการเอกสารอะไร ระบบจะถามข้อมูลที่ขาดแล้วร่างให้ พร้อมส่งต่อไปออกเป็น DOCX/PDF",
    starters: ["อยากทำหนังสือเชิญวิทยากรมาบรรยาย", "ขอร้องเรียนเรื่องถนนหน้าบ้านชำรุดถึงเทศบาล", "ทำบันทึกข้อความขออนุมัติเดินทางไปราชการ"],
  },
  format: {
    label: "จัดรูปแบบ",
    hint: "วางข้อความหรือ markdown ที่เขียนไว้แล้ว ระบบจะจัดเข้ารูปแบบหนังสือราชการโดยไม่เขียนเนื้อหาใหม่",
    starters: [],
  },
  court: {
    label: "ศาลแรงงาน (ร่าง)",
    hint: "ร่างคำฟ้อง บัญชีพยาน คำร้อง ในคดีแรงงาน โดยถามข้อเท็จจริงก่อน (ศาลอื่นยังไม่รองรับ)",
    starters: ["นายจ้างค้างจ่ายค่าจ้างผม 2 เดือน อยากฟ้องศาลแรงงาน", "ถูกเลิกจ้างโดยไม่บอกล่วงหน้า"],
  },
};

const DIAL = ["0 ราชการเป๊ะ", "1 สุภาพราชการ", "2 ราชการจัดเต็ม", "3 ราชการเว่อร์", "4 ข้ามจักรวาล (ขำๆ)"];

interface UiMsg {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
}

interface Props {
  settings: Settings;
  openSettings: () => void;
  sendToExport: (text: string) => void;
}

async function bindings(settings: Settings): Promise<ToolBinding[]> {
  const out: ToolBinding[] = [];
  for (const m of settings.mcp) {
    if (!m.url) continue;
    const key = m.url + "|" + m.authorization;
    let hit = mcpCache.get(key);
    if (!hit) {
      const client = new McpClient({ url: m.url, headers: m.authorization ? { Authorization: m.authorization } : undefined });
      hit = { client, tools: await client.connect() };
      mcpCache.set(key, hit);
    }
    for (const tool of hit.tools) out.push({ client: hit.client, tool });
  }
  return out;
}

export function Chat({ settings, openSettings, sendToExport }: Props) {
  const [mode, setMode] = useState<ModeId>("convert");
  const [dial, setDial] = useState(1);
  const [msgs, setMsgs] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const ready = settings.model.trim() && settings.baseUrl.trim() && (settings.apiKey.trim() || settings.presetId === "ollama");

  const switchMode = (m: ModeId) => {
    setMode(m);
    setMsgs([]);
    setError("");
  };

  const send = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || busy) return;
    setError("");
    if (!ready) {
      setError("ตั้งค่าโมเดลก่อน (กดปุ่ม ⚙ ตั้งค่าโมเดล) หรือใช้แท็บ “พรอมต์” ไปวางใน ChatGPT / Claude / Gemini");
      return;
    }
    const content = mode === "convert" ? `[ระดับความราชการ: ${DIAL[dial]}]\n${text}` : text;
    const history: UiMsg[] = [...msgs, { role: "user", content: text }];
    const apiMsgs: ChatMsg[] = [...msgs.map((m) => ({ role: m.role, content: m.content })), { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ac = new AbortController();
    abort.current = ac;
    const cfg = { kind: settings.kind, baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model };
    const setLast = (fn: (m: UiMsg) => UiMsg) => setMsgs((cur) => cur.map((m, i) => (i === cur.length - 1 ? fn(m) : m)));
    try {
      const tools = settings.kind === "openai" && settings.mcp.some((m) => m.url) ? await bindings(settings) : [];
      if (tools.length) {
        const answer = await chatWithTools(
          cfg,
          SYSTEM_PROMPTS[mode],
          apiMsgs,
          tools,
          (e) =>
            setLast((m) => ({
              ...m,
              tools: [...(m.tools ?? []), e.kind === "call" ? `เรียกเครื่องมือ ${e.name}(${e.args})` : `ผลลัพธ์ ${e.name}: ${e.text}`],
            })),
          ac.signal,
        );
        setLast((m) => ({ ...m, content: answer }));
      } else {
        let acc = "";
        for await (const chunk of streamChat(cfg, SYSTEM_PROMPTS[mode], apiMsgs, ac.signal)) {
          acc += chunk;
          setLast((m) => ({ ...m, content: acc }));
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof LlmError ? e.message : `เกิดข้อผิดพลาด: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  const m = MODES[mode];
  return (
    <div className="chat">
      <div className="modes">
        {(Object.keys(MODES) as ModeId[]).map((id) => (
          <button key={id} className={"chip" + (id === mode ? " on" : "")} onClick={() => switchMode(id)}>
            {MODES[id].label}
          </button>
        ))}
        <button className="chip gear" onClick={openSettings}>
          ⚙ ตั้งค่าโมเดล {ready ? `(${settings.model})` : "(ยังไม่ได้ตั้งค่า)"}
        </button>
      </div>
      <Disclaimer legal={mode === "court"} />
      <p className="muted">{m.hint}</p>

      {mode === "convert" && (
        <div className="dial">
          <label>
            ปุ่มหมุนความราชการ: <strong>{DIAL[dial]}</strong>
          </label>
          <input type="range" min={0} max={4} value={dial} onChange={(e) => setDial(+e.target.value)} />
          {dial >= 3 && <span className="muted small">ระดับนี้ใช้เพื่อความบันเทิง ไม่เหมาะกับเอกสารจริง</span>}
        </div>
      )}

      <div className="log">
        {msgs.length === 0 && (
          <div className="empty">
            {m.starters.length > 0 && <p className="muted">ลองเริ่มจาก:</p>}
            {m.starters.map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((x, i) => (
          <div key={i} className={"msg " + x.role}>
            <div className="who">{x.role === "user" ? "คุณ" : "ราชการนี้"}</div>
            {x.tools?.map((t, j) => (
              <div key={j} className="tool">
                {t}
              </div>
            ))}
            <div className="text">{x.content || (busy && i === msgs.length - 1 ? "…" : "")}</div>
            {x.role === "assistant" && x.content && (
              <div className="row">
                <button className="btn ghost small" onClick={() => navigator.clipboard.writeText(x.content)}>
                  คัดลอก
                </button>
                {x.content.includes("===RATCHAKARN-DOC===") && (
                  <button className="btn small" onClick={() => sendToExport(x.content)}>
                    ส่งไปออกเอกสาร DOCX/PDF →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className="banner banner-err">{error}</div>}
      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          placeholder={mode === "format" ? "วางข้อความหรือ markdown ที่ต้องการจัดรูปแบบ" : "พิมพ์ที่นี่ (Ctrl/⌘ + Enter เพื่อส่ง)"}
          rows={4}
        />
        <div className="row">
          {busy ? (
            <button className="btn" onClick={() => abort.current?.abort()}>
              หยุด
            </button>
          ) : (
            <button className="btn primary" onClick={() => send()} disabled={!input.trim()}>
              ส่ง
            </button>
          )}
          {msgs.length > 0 && !busy && (
            <button className="btn ghost" onClick={() => setMsgs([])}>
              เริ่มใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
