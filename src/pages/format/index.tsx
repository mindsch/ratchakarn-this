// จัดรูปแบบ (Format): paste -> code sorts into fields -> optional AI check -> Export. Design: F01 32:158, F02 31:2, F03 32:233, mobile M-F01..04.
// Code sorts (src/lib/doc/sort.ts); AI only proposes (src/lib/doc/check.ts). Text changes only by user edits or accepted suggestions.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SYSTEM_PROMPTS } from "../../generated/prompts";
import { aiReady, extractJson, runAi, type CheckSuggestion } from "../../lib/ai";
import { chrome } from "../../lib/copy";
import { finalDoc, useApp, type DocState, type FieldKey } from "../../lib/app";
import { applyAll, isAdvisory, validSuggestions } from "../../lib/doc/check";
import { serializeDoc } from "../../lib/doc/parse";
import { computeStatus, docStateFromBlob, fieldKeys, fieldLabel, getField, isOptionalField, isTemplateBlob, missingKeys, setField, withRequiredSlots } from "../../lib/doc/sort";
import { DOC_TYPES, isCourt } from "../../lib/doc/types";
import { Banner, Button, Card, FieldRow, PageHeader, Paper, Popup, Progress, Segmented, Sparkle, Stepper, TextArea } from "../../ui";
import { ExportStep } from "../export";
import "./format.css";

type Step = "paste" | "check" | "ai" | "export";
const LABELS: [string, string, string] = ["วาง", "ตรวจ", "ออกเอกสาร"];
const STEP_NO: Record<Step, 1 | 2 | 3> = { paste: 1, check: 2, ai: 2, export: 3 };

const SAMPLE_PLAIN = `สำนักงานตัวอย่าง
ถนนตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10000
ที่ ตย 0123/456
5 กันยายน 2569
เรื่อง ขอเชิญประชุมเชิงปฏิบัติการ
เรียน ผู้อำนวยการโรงเรียนตัวอย่าง
อ้างถึง หนังสือที่ ตย 0001/1
สิ่งที่ส่งมาด้วย กำหนดการ 1 ฉบับ

ด้วยสำนักงานตัวอย่างจะจัดประชุมเชิงปฏิบัติการ ในวันที่ 20 กันยายน 2569 ณ ห้องประชุมใหญ่

จึงเรียนมาเพื่อโปรดทราบ

ขอแสดงความนับถือ

(นายสมชาย ใจดี)
ผู้อำนวยการสำนักงานตัวอย่าง
กลุ่มงานบริหารทั่วไป
โทร. 02-123-4567`;

const GUESS_LABEL: Record<string, string> = { "foot:โทร": "ผู้ติดต่อ · โทร." };
const guessText = (g?: FieldKey) => (g ? `น่าจะเป็น: ${GUESS_LABEL[g] ?? fieldLabel(g)}` : "ยังเดาไม่ได้ว่าเป็นช่องไหน");

/** work column + paper; on mobile a switch picks one */
function Workspace({ work, paper, caption }: { work: ReactNode; paper: DocState; caption?: ReactNode }) {
  const [view, setView] = useState<"work" | "paper">("work");
  return (
    <>
      <div className="show-mobile">
        <Segmented label="มุมมอง" value={view} onChange={setView} options={[{ value: "work", label: "ช่องเอกสาร" }, { value: "paper", label: "ตัวอย่าง A4" }]} />
      </div>
      <div className="cols">
        <div className={`work ${view === "paper" ? "hide-mobile" : ""}`}>{work}</div>
        <div className={view === "work" ? "hide-mobile" : ""}>
          <Paper doc={finalDoc(paper)} caption={caption ?? "ตัวอย่าง A4 · สีแดง = ยังขาด (ตอนพิมพ์เป็นสีดำ)"} />
        </div>
      </div>
    </>
  );
}

export function FormatPage() {
  const { docState, setDocState, settings, hasKey, xp, go } = useApp();
  const resumed = docState.origin === "format" && !!docState.sources && !!docState.raw;
  const [step, setStep] = useState<Step>(resumed ? "check" : "paste");
  const [text, setText] = useState(docState.raw ?? "");
  const [bodyText, setBodyText] = useState(() => getField(docState.doc, "body"));
  const [showRaw, setShowRaw] = useState(false);
  const [choosing, setChoosing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI check
  const [base, setBase] = useState<DocState | null>(null);
  const [sugg, setSugg] = useState<CheckSuggestion[]>([]);
  const [decision, setDecision] = useState<Record<number, "accept" | "keep">>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading) return;
    setProgress(0.05);
    const t = setInterval(() => setProgress((p) => Math.min(0.9, p + 0.04)), 400);
    return () => clearInterval(t);
  }, [loading]);

  const stepper = <Stepper labels={LABELS} step={STEP_NO[step]} />;

  /* ---------- 1 วาง ---------- */
  const sortNow = (forceType?: string) => {
    const next = docStateFromBlob(text, forceType);
    setDocState(next);
    setBodyText(getField(next.doc, "body"));
    setChoosing(null);
    setStep("check");
  };

  if (step === "paste") {
    return (
      <div className="page">
        <PageHeader stepper={stepper} title="วางข้อความที่มีอยู่แล้ว" status="วางหนังสือที่เขียนไว้แล้ว ระบบจัดเข้าช่องให้โดยไม่แก้คำของคุณ ใช้ได้โดยไม่ต้องมีคีย์ AI" />
        <div className="cols single">
          <div className="work">
            <Card>
              <div className="fm-paste">
                <TextArea label="ข้อความหนังสือ" value={text} onChange={(e) => setText(e.target.value)} placeholder="วางข้อความทั้งฉบับที่นี่ จะมีหัวเรื่อง เนื้อหา และคำลงท้ายปนกันก็ได้" spellCheck={false} />
              </div>
            </Card>
            <div className="actions sticky-mobile">
              <Button variant="ghost" onClick={() => setText(SAMPLE_PLAIN)}>
                ใช้ข้อความตัวอย่าง
              </Button>
              <div className="right">
                <Button variant="primary" disabled={!text.trim()} onClick={() => sortNow()}>
                  จัดเข้าช่อง →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 3 ออกเอกสาร ---------- */
  if (step === "export") return <ExportStep stepper={stepper} onBack={() => setStep("check")} />;

  /* ---------- 2 ตรวจ: edit helpers ---------- */
  const commit = (doc: ReturnType<typeof setField>, patch?: Partial<DocState>) =>
    setDocState((s) => {
      const d = withRequiredSlots(doc);
      return { ...s, ...patch, doc: d, status: computeStatus(d, s.status) };
    });
  const edit = (key: FieldKey, v: string) => {
    if (key === "body") setBodyText(v);
    commit(setField(docState.doc, key, v));
  };
  const skip = (key: FieldKey) => setDocState((s) => ({ ...s, status: { ...s.status, [key]: "skipped" } }));
  const unskip = (key: FieldKey) => setDocState((s) => ({ ...s, status: { ...s.status, [key]: "empty" } }));
  const assign = (idx: number, key: FieldKey) => {
    const u = docState.unplaced?.[idx];
    if (!u) return;
    const cur = getField(docState.doc, key);
    const sep = key === "body" ? "\n\n" : key === "head:ส่วนราชการ" ? " | " : " ";
    const v = cur.trim() ? cur + sep + u.text : u.text;
    if (key === "body") setBodyText(v);
    commit(setField(docState.doc, key, v), {
      unplaced: (docState.unplaced ?? []).filter((_, i) => i !== idx),
      sources: { ...docState.sources, [key]: [...(docState.sources?.[key] ?? []), u.span] },
    });
    setChoosing(null);
  };
  const dropChunk = (idx: number) => {
    setDocState((s) => ({ ...s, unplaced: (s.unplaced ?? []).filter((_, i) => i !== idx) }));
    setChoosing(null);
  };

  const type = docState.doc.type;
  const keys = fieldKeys(type);
  const miss = missingKeys(docState.doc, docState.status);
  const required = keys.filter((k) => !isOptionalField(k));
  const unplaced = docState.unplaced ?? [];

  /* ---------- AI ตรวจทั้งฉบับ ---------- */
  const startAi = async () => {
    setError(null);
    setLoading(true);
    const ctl = new AbortController();
    abort.current = ctl;
    const snapshot = docState;
    try {
      const reply = await runAi(settings, SYSTEM_PROMPTS.check, serializeDoc(snapshot.doc), ctl.signal);
      const parsed = extractJson<unknown>(reply);
      const list = Array.isArray(parsed) ? parsed : (parsed as { suggestions?: unknown } | null)?.suggestions;
      if (!Array.isArray(list)) throw new Error("ไม่พบรายการข้อเสนอในคำตอบของ AI");
      setBase(snapshot);
      setSugg(validSuggestions(snapshot.doc, list));
      setDecision({});
      setStep("ai");
    } catch (e) {
      if (!ctl.signal.aborted) setError(e instanceof Error ? e.message : "ตรวจไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadingPopup = loading && (
    <Popup
      title={chrome("loading", xp)}
      actions={
        <Button variant="secondary" size="sm" onClick={() => abort.current?.abort()}>
          ยกเลิก
        </Button>
      }
    >
      <div className="fm-loading">
        <span>AI กำลังอ่านทั้งฉบับ ข้อความจะไม่ถูกแก้จนกว่าคุณจะกดใช้ข้อเสนอ</span>
        <Progress value={progress} />
      </div>
    </Popup>
  );

  /* ---------- F03 ข้อเสนอจาก AI ---------- */
  if (step === "ai" && base) {
    const accepted = sugg.filter((_, i) => decision[i] === "accept");
    const applied = applyAll(base, accepted);
    const open = sugg.filter((s, i) => !isAdvisory(s) && !decision[i]).length;
    const finish = (keepAll: boolean) => {
      const final = keepAll ? base : applied;
      setDocState({ ...final, status: computeStatus(final.doc, final.status) });
      setBodyText(getField(final.doc, "body"));
      setStep("export");
    };
    return (
      <div className="page">
        <PageHeader
          stepper={stepper}
          title="ข้อเสนอจาก AI"
          status={
            <>
              AI พบ {sugg.length} ข้อ · <strong>ใช้แล้ว {accepted.length} ข้อ</strong> · รอเลือก {open} ข้อ · เนื้อหาไม่ถูกแก้จนกว่าคุณจะกดใช้ข้อเสนอ
            </>
          }
        />
        <Workspace
          paper={applied}
          caption="ตัวอย่างอัปเดตเมื่อคุณกด “ใช้ข้อเสนอ”"
          work={
            <>
              <Card title="ข้อเสนอจาก AI" count={`${sugg.length} ข้อ`}>
                {sugg.length === 0 && <p className="fm-muted">AI ไม่พบจุดที่ควรแก้ ข้อความของคุณยังเหมือนเดิมทุกตัวอักษร</p>}
                <div className="rows">
                  {sugg.map((s, i) => {
                    const d = decision[i];
                    return (
                      <div className="fm-sug" key={i}>
                        <div className="fm-sug-top">
                          <span className="fm-sug-kind">{s.kind}</span>
                          <span className="fm-sug-where">{fieldLabel(s.field)}</span>
                        </div>
                        {isAdvisory(s) ? (
                          <>
                            <span>{s.suggestion}</span>
                            <span className="fm-muted">ข้อแนะนำ ไม่มีข้อความให้แทนที่</span>
                          </>
                        ) : (
                          <>
                            <span className="fm-orig">
                              {s.original}
                            </span>
                            <span className="fm-new" style={d === "accept" ? { textDecoration: "none" } : undefined}>
                              {s.suggestion}
                            </span>
                            {s.note && <span className="fm-muted">{s.note}</span>}
                            {d === "accept" ? (
                              <span className="fm-done">
                                ใช้ข้อเสนอแล้ว
                                <Button variant="ghost" size="sm" onClick={() => setDecision((x) => ({ ...x, [i]: "keep" }))}>
                                  เลิกทำ
                                </Button>
                              </span>
                            ) : (
                              <span className="fm-sug-btns">
                                <Button variant="secondary" size="sm" onClick={() => setDecision((x) => ({ ...x, [i]: "accept" }))}>
                                  ใช้ข้อเสนอ
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDecision((x) => ({ ...x, [i]: "keep" }))} aria-pressed={d === "keep"}>
                                  {d === "keep" ? "คงต้นฉบับแล้ว" : "คงต้นฉบับ"}
                                </Button>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
              <div className="actions sticky-mobile">
                <Button variant="ghost" onClick={() => setStep("check")}>
                  ← กลับ
                </Button>
                <div className="right">
                  <Button variant="ghost" onClick={() => finish(true)}>
                    คงต้นฉบับทั้งหมด
                  </Button>
                  <Button variant="primary" onClick={() => finish(false)}>
                    ไปออกเอกสาร →
                  </Button>
                </div>
              </div>
            </>
          }
        />
      </div>
    );
  }

  /* ---------- F02 ตรวจ ---------- */
  const status = (
    <>
      จัดเข้าช่องแล้ว {required.length - miss.length} จาก {required.length}
      {miss.length > 0 && (
        <>
          {" "}
          · <strong className="fm-strong-danger">ขาด {miss.length} ช่อง</strong>
        </>
      )}
      {unplaced.length > 0 && <> · มีข้อความที่ยังไม่ได้จัด {unplaced.length} ส่วน</>} · ข้อความของคุณไม่ถูกแก้
    </>
  );

  const rowFor = (key: FieldKey) => {
    const st = docState.status[key] ?? "empty";
    const optional = isOptionalField(key);
    const body = key === "body";
    return (
      <FieldRow
        key={key}
        label={fieldLabel(key)}
        value={body ? bodyText : getField(docState.doc, key)}
        status={optional && st === "empty" ? "filled" : st}
        hint={optional ? "ไม่บังคับ" : body ? "พิมพ์เนื้อหา เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่" : undefined}
        block={body}
        onChange={(v) => edit(key, v)}
        onSkip={optional ? undefined : () => skip(key)}
        onUnskip={() => unskip(key)}
      />
    );
  };

  return (
    <div className="page">
      <PageHeader stepper={stepper} title="ตรวจช่องเอกสาร" status={status} />
      {error && (
        <Banner tone="danger" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}
      {isCourt(type) && <p className="fm-muted">เอกสารศาล: ตรวจทานกับทนายความก่อนยื่นจริง</p>}
      <Workspace
        paper={docState}
        work={
          <>
            <Card
              title="ช่องเอกสาร"
              right={
                isTemplateBlob(docState.raw ?? "") ? undefined : (
                  <select className="input select fm-select" aria-label="ชนิดเอกสาร" value={type} onChange={(e) => sortNow(e.target.value)}>
                    {Object.entries(DOC_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                )
              }
            >
              <div className="rows">{keys.map(rowFor)}</div>
            </Card>
            {unplaced.length > 0 && (
              <Card title={`ข้อความที่ยังไม่ได้จัด (${unplaced.length})`}>
                <div className="rows">
                  {unplaced.map((u, i) => (
                    <div className="fm-tray-item" key={`${u.span.start}-${i}`}>
                      <span className="fm-tray-text">{u.text}</span>
                      <span className="fm-tray-guess">{guessText(u.guess)}</span>
                      <div className="fm-tray-actions">
                        <Button variant="secondary" size="sm" onClick={() => setChoosing(choosing === i ? null : i)} aria-expanded={choosing === i}>
                          จัดเข้าช่อง ▾
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => dropChunk(i)}>
                          ไม่ใช้
                        </Button>
                      </div>
                      {choosing === i && (
                        <div className="fm-choose" role="menu">
                          {[...(u.guess && keys.includes(u.guess) ? [u.guess] : []), ...keys.filter((k) => k !== u.guess)].map((k) => (
                            <Button key={k} variant="tertiary" size="sm" role="menuitem" onClick={() => assign(i, k)}>
                              {fieldLabel(k)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowRaw((v) => !v)} aria-expanded={showRaw}>
                {showRaw ? "ซ่อนต้นฉบับ" : "ดูต้นฉบับทั้งหมด"}
              </Button>
            </div>
            {showRaw && (
              <Card title="ต้นฉบับที่วางไว้">
                <div className="fm-raw">{docState.raw}</div>
              </Card>
            )}
            <div className="actions sticky-mobile">
              <Button variant="ghost" onClick={() => setStep("paste")}>
                ← กลับ
              </Button>
              <div className="right">
                <Button variant="ghost" onClick={() => go("prompts")}>
                  ไม่มีคีย์? คัดลอกพรอมต์แทน
                </Button>
                <Button variant="secondary" disabled={!aiReady(settings)} onClick={startAi} title={hasKey ? undefined : "ใส่คีย์ AI ที่ตั้งค่าก่อน"}>
                  <Sparkle /> ให้ AI ตรวจทั้งฉบับ
                </Button>
                <Button variant="primary" onClick={() => setStep("export")}>
                  ไปออกเอกสาร →
                </Button>
              </div>
            </div>
          </>
        }
      />
      {loadingPopup}
    </div>
  );
}
