// แชท: the ภาษาราชการ converter with the 0-4 dial. Design: Figma C01 58:3926, C02 58:4034.
import { useEffect, useRef, useState } from "react";
import { SYSTEM_PROMPTS } from "../../generated/prompts";
import { aiReady } from "../../lib/ai";
import { emptyDoc, useApp } from "../../lib/app";
import { McpClient } from "../../lib/llm/mcp";
import { LlmError, streamChat, type ChatMsg } from "../../lib/llm/providers";
import { chatWithTools, type ToolBinding } from "../../lib/llm/tools";
import { mcpCache } from "../../lib/mcpCache";
import type { Settings } from "../../lib/settings";
import { Button, Card, PageHeader, Segmented, Sparkle, StatusTag } from "../../ui";
import "./chat.css";

const DIAL = ["ราชการเป๊ะ", "สุภาพราชการ", "ราชการจัดเต็ม", "ราชการเว่อร์", "ข้ามจักรวาล (ขำๆ)"];
const dialLabel = (n: number) => `${n} ${DIAL[n]}`;
const STARTERS = ["พรุ่งนี้ขอลาไปหาหมอนะครับ ไม่สบายมาก", "Please send me the report by Friday, we are running late.", "ใครเอาปากกาไปอีกแล้ว เอามาคืนด้วย"];
const TIPS = [
  "วางข้อความได้ทุกภาษา ไทย อังกฤษ หรือปนกัน",
  "ระดับ 1 เหมาะกับงานจริงส่วนใหญ่ ระดับ 3–4 ไว้ขำๆ",
  "ตรวจชื่อ วันที่ และตัวเลขทุกครั้งก่อนนำไปใช้",
  "กด “ส่งไปจัดรูปแบบ” เพื่อวางลงเอกสารต่อได้เลย",
];

interface UiMsg {
  role: "user" | "assistant";
  content: string;
  level: number;
  tools?: string[];
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

export function ChatPage() {
  const { go, settings, setDocState } = useApp();
  const [dial, setDial] = useState(1);
  const [msgs, setMsgs] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const ready = aiReady(settings);

  useEffect(() => {
    if (msgs.length) endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || !ready) return;
    setError("");
    const apiMsgs: ChatMsg[] = [
      ...msgs.map((m) => ({ role: m.role, content: m.role === "user" ? `[ระดับความราชการ: ${dialLabel(m.level)}]\n${m.content}` : m.content })),
      { role: "user", content: `[ระดับความราชการ: ${dialLabel(dial)}]\n${text}` },
    ];
    setMsgs([...msgs, { role: "user", content: text, level: dial }, { role: "assistant", content: "", level: dial }]);
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
          SYSTEM_PROMPTS.convert,
          apiMsgs,
          tools,
          (e) => setLast((m) => ({ ...m, tools: [...(m.tools ?? []), e.kind === "call" ? `เรียกเครื่องมือ ${e.name}(${e.args})` : `ผลลัพธ์ ${e.name}: ${e.text}`] })),
          ac.signal,
        );
        setLast((m) => ({ ...m, content: answer }));
      } else {
        let acc = "";
        for await (const chunk of streamChat(cfg, SYSTEM_PROMPTS.convert, apiMsgs, ac.signal)) {
          acc += chunk;
          setLast((m) => ({ ...m, content: acc }));
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof LlmError ? e.message : `เกิดข้อผิดพลาด: ${(e as Error).message}`);
    } finally {
      // drop an assistant bubble that never received text
      setMsgs((cur) => (cur.length && cur[cur.length - 1].role === "assistant" && !cur[cur.length - 1].content ? cur.slice(0, -1) : cur));
      setBusy(false);
      abort.current = null;
    }
  };

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  const toFormat = (text: string) => {
    setDocState({ ...emptyDoc(), raw: text });
    go("format");
  };

  return (
    <div className="page">
      <div className="chat-title">
        <PageHeader title="แปลงเป็นภาษาราชการ" status="วางข้อความธรรมดา เลือกระดับความราชการ แล้วกดแปลง ระดับ 1 เหมาะกับงานจริง" />
      </div>
      <div className="chat-cols">
        <div className="chat-main">
          <div className="thread" aria-live="polite">
            {!ready && (
              <Card title="ยังไม่ได้ตั้งค่า AI">
                <p className="muted">ใส่คีย์ AI เพื่อแปลงในหน้านี้ หรือคัดลอกพรอมต์ไปวางใน AI ที่คุณใช้อยู่ ส่วนอื่นของแอปใช้ได้โดยไม่ต้องมีคีย์</p>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => go("settings")}>ใส่คีย์ AI</Button>
                  <Button variant="ghost" onClick={() => go("prompts")}>ไม่มีคีย์? คัดลอกพรอมต์แทน</Button>
                </div>
                <div className="starters">
                  <span className="field-label">ลองเริ่มจาก</span>
                  {STARTERS.map((s) => (
                    <button key={s} type="button" className="starter" onClick={() => setInput(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            {ready && msgs.length === 0 && (
              <Card title="ลองเริ่มจาก">
                <div className="starters">
                  {STARTERS.map((s) => (
                    <button key={s} type="button" className="starter" onClick={() => setInput(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="umsg">
                  <div className="bubble">{m.content}</div>
                  <span className="t-caption muted">ระดับ {dialLabel(m.level).replace(" ", " · ")}</span>
                </div>
              ) : (
                <Card key={i} className="amsg">
                  <div className="a-head">
                    <span className="a-who">
                      <Sparkle size={14} /> แปลเป็นราชการ
                    </span>
                    <StatusTag tone="neutral" dot={false}>
                      ระดับ {dialLabel(m.level).replace(" ", " · ")}
                    </StatusTag>
                  </div>
                  {m.tools?.map((t, j) => (
                    <div key={j} className="tool">
                      {t}
                    </div>
                  ))}
                  <div className="a-text">{m.content || (busy && i === msgs.length - 1 ? "กำลังแปล…" : "")}</div>
                  {m.content && !(busy && i === msgs.length - 1) && (
                    <div className="a-foot">
                      <Button size="sm" variant="secondary" onClick={() => copy(i, m.content)}>
                        {copied === i ? "คัดลอกแล้ว" : "คัดลอก"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toFormat(m.content)}>
                        ส่งไปจัดรูปแบบ →
                      </Button>
                    </div>
                  )}
                </Card>
              ),
            )}
            {error && (
              <Card className="err-card">
                <p role="alert" className="danger">{error}</p>
                <p className="t-body-s muted">ตรวจคีย์ Base URL และชื่อโมเดลในหน้าตั้งค่า แล้วลองอีกครั้ง</p>
              </Card>
            )}
            <div ref={endRef} />
          </div>

          <Card className="composer-card">
            <div className="spread">
              <h3 className="t-label-m">ปุ่มหมุนความราชการ</h3>
              <span className="t-body-s muted">ค่าเริ่มต้น ระดับ 1</span>
            </div>
            <div className="dial"><Segmented label="ปุ่มหมุนความราชการ" value={String(dial)} onChange={(v) => setDial(+v)} options={DIAL.map((l, i) => ({ value: String(i), label: dialLabel(i) }))} /></div>
            {dial >= 3 && <p className="t-body-s muted">ระดับนี้ใช้เพื่อความบันเทิง ไม่เหมาะกับเอกสารจริง</p>}
            <textarea
              className="textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="วางหรือพิมพ์ข้อความที่ต้องการแปลง"
              aria-label="ข้อความที่ต้องการแปลง"
              rows={3}
            />
            <div className="spread">
              <span className="t-body-s muted hide-mobile">กด Ctrl + Enter เพื่อส่ง</span>
              <div className="row">
                {msgs.length > 0 && !busy && (
                  <Button variant="ghost" onClick={() => { setMsgs([]); setError(""); }}>
                    เริ่มใหม่
                  </Button>
                )}
                {busy ? (
                  <Button variant="secondary" onClick={() => abort.current?.abort()}>
                    หยุด
                  </Button>
                ) : (
                  <Button variant="primary" onClick={send} disabled={!input.trim() || !ready} title={!ready ? "ตั้งค่า AI ก่อน" : undefined}>
                    แปลง
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        <aside className="tips">
          <Card title="เคล็ดลับ">
            <ul>
              {TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
