// ร่างเอกสาร: เลือกชนิด -> กรอกข้อมูล -> ออกเอกสาร. Figma D01 32:532, D02 32:686, court D01-C 58:634 / D02-C 58:3587.
import { useMemo, useRef, useState } from "react";
import { aiReady, extractJson, runAi, type PrefillResult } from "../../lib/ai";
import { chrome } from "../../lib/copy";
import { finalDoc, useApp, type DocState, type FieldKey, type FieldStatus } from "../../lib/app";
import { SYSTEM_PROMPTS } from "../../generated/prompts";
import { DOC_TYPES, isCourt, COURT_TYPES } from "../../lib/doc/types";
import {
  allSlots,
  assembleDoc,
  defaultMeta,
  getTemplate,
  isoToThai,
  progress,
  purposesOf,
  type Input,
  type ListDef,
  type Part,
  type Row,
  type Template,
} from "../../lib/doc/templates";
import { Banner, Button, Card, FieldRow, OptionRow, PageHeader, Paper, Segmented, Sparkle, Stepper, StatusTag, Tabs, TextArea } from "../../ui";
import { ExportStep } from "../export";
import "./draft.css";

const LABELS: [string, string, string] = ["เลือกชนิด", "กรอกข้อมูล", "ออกเอกสาร"];
const COURT_TAB = "ศาลแรงงาน";
const TABS = [...Object.keys(DOC_TYPES).filter((t) => !isCourt(t)), COURT_TAB];
const tabLabel = (t: string) => (t === COURT_TAB ? COURT_TAB : DOC_TYPES[t].label.replace(/ \(.*\)$/, ""));

/* ---------- Draft data kept per (type, purpose) ---------- */
interface Draft {
  values: Record<string, string>;
  lists: Record<string, Row[]>;
  meta: Record<string, string>;
  skipped: Record<string, boolean>;
  /** AI-polished body and the facts it was written from */
  aiBody?: string[];
  aiFacts?: string;
}
const newDraft = (type: string): Draft => ({ values: {}, lists: {}, meta: defaultMeta(type), skipped: {} });

interface Saved {
  type: string;
  purposeId: string;
  step: 1 | 2 | 3;
  drafts: Record<string, Draft>;
}
// survives switching tabs (the page unmounts) but not a reload
let saved: Saved = { type: "หนังสือภายนอก", purposeId: "เชิญ", step: 1, drafts: {} };

const factsKey = (d: Draft) => JSON.stringify([d.values, d.lists]);
const inputOf = (d: Draft): Input => ({
  values: d.values,
  lists: d.lists,
  meta: Object.fromEntries(Object.entries(d.meta).filter(([k]) => !d.skipped[k])),
});
const emptyRows = (l: ListDef): Row[] => [Object.fromEntries(l.cols.map((c) => [c.key, ""]))];

/* ---------- Page ---------- */
export function DraftPage() {
  const { go, settings, xp, setDocState } = useApp();
  const [type, setType] = useState(saved.type);
  const [purposeId, setPurposeId] = useState(saved.purposeId);
  const [step, setStepRaw] = useState<1 | 2 | 3>(saved.step === 3 ? 2 : saved.step);
  const [drafts, setDrafts] = useState(saved.drafts);
  const [view, setView] = useState<"form" | "paper">("form");
  const court = isCourt(type);
  const t = getTemplate(type, purposeId);
  const key = `${type}/${t.id}`;
  const draft = drafts[key] ?? newDraft(type);
  saved = { type, purposeId, step, drafts };

  const setStep = (s: 1 | 2 | 3) => {
    setStepRaw(s);
    window.scrollTo(0, 0);
  };
  const patch = (fn: (d: Draft) => Draft) => setDrafts((all) => ({ ...all, [key]: fn(all[key] ?? newDraft(type)) }));

  const stepper = <Stepper labels={LABELS} step={step} />;

  /* ----- the assembled document ----- */
  const input = inputOf(draft);
  const assembled = useMemo(() => assembleDoc(t, input), [t, draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const aiActive = !!draft.aiBody;
  const stale = aiActive && draft.aiFacts !== factsKey(draft);
  const doc = aiActive ? { ...assembled, body: draft.aiBody! } : assembled;
  const docState: DocState = useMemo(() => {
    const status: Record<FieldKey, FieldStatus> = {};
    for (const [k, v] of Object.entries(doc.head)) status[`head:${k}`] = draft.skipped[k] ? "skipped" : v.trim() ? "filled" : "empty";
    for (const [k, v] of Object.entries(doc.foot)) status[`foot:${k}`] = draft.skipped[k] ? "skipped" : v.trim() ? "filled" : "empty";
    return { doc, status, origin: "draft" };
  }, [doc, draft.skipped]);
  const paperDoc = useMemo(() => finalDoc(docState), [docState]);

  if (step === 3) {
    return <ExportStep onBack={() => setStep(2)} stepper={stepper} />;
  }

  /* ----- step 1 ----- */
  if (step === 1) {
    const tab = court ? COURT_TAB : type;
    const options = purposesOf(type);
    const prepare = court
      ? t.sections.map((sec) => sec.title)
      : [...t.sections.flatMap((sec) => sec.slots.map((x) => x.question)), "ผู้ลงชื่อและตำแหน่ง"];
    const pickTab = (v: string) => {
      const nt = v === COURT_TAB ? COURT_TYPES[0] : v;
      setType(nt);
      setPurposeId(purposesOf(nt)[0].id);
    };
    return (
      <div className="page">
        <PageHeader stepper={stepper} title="จะร่างเอกสารอะไร?" status="เลือกชนิดเอกสารและวัตถุประสงค์ · ข้ามได้และใช้ได้โดยไม่ต้องมีคีย์ AI" />
        <div className="cols side">
          <div className="work">
            <Card title="ชนิดเอกสาร" count={`${TABS.length} ชนิด`}>
              <Tabs items={TABS.map((x) => ({ value: x, label: tabLabel(x) }))} value={tab} onChange={pickTab} />
            </Card>
            <Card title={court ? "เอกสารที่จะร่าง" : "วัตถุประสงค์"} count={`${options.length} แบบ`}>
              <div className="d-opts" role="radiogroup" aria-label={court ? "เอกสารที่จะร่าง" : "วัตถุประสงค์"}>
                {options.map((o) =>
                  court ? (
                    <OptionRow key={o.id} title={o.title} hint={o.hint} selected={type === o.id} onSelect={() => { setType(o.id); setPurposeId(o.id); }} />
                  ) : (
                    <OptionRow key={o.id} title={o.title} hint={o.hint} selected={t.id === o.id} onSelect={() => setPurposeId(o.id)} />
                  ),
                )}
              </div>
            </Card>
            <div className="actions">
              <span />
              <Button variant="primary" onClick={() => setStep(2)}>
                ต่อไป: กรอกข้อมูล →
              </Button>
            </div>
          </div>
          <div className="work">
            <Card title={`ข้อมูลที่ต้องเตรียมสำหรับ “${t.title}”`} count={`${prepare.length} ข้อ`}>
              <ol className="d-prep">
                {prepare.map((q, i) => (
                  <li key={q}>
                    <span className="n">{i + 1}</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </Card>
            {court && <CourtNote />}
          </div>
        </div>
      </div>
    );
  }

  /* ----- step 2 ----- */
  const prog = progress(t, input);
  const missing = prog.total - prog.done;
  const title = court ? `ร่าง${t.title}` : `${DOC_TYPES[type].label.replace(/ \(.*\)$/, "")} · ${t.title}`;
  const status = (
    <>
      กรอกแล้ว {prog.done} จาก {prog.total} ·{" "}
      {missing > 0 ? <strong className="danger" style={{ fontWeight: 600 }}>ขาด {missing} ช่อง</strong> : <strong style={{ fontWeight: 600 }}>ครบแล้ว</strong>} · ช่องที่ข้ามจะเป็น [ระบุ...] ในเอกสาร
    </>
  );

  const setValue = (k: string, v: string) => patch((d) => ({ ...d, values: { ...d.values, [k]: v } }));
  const setMeta = (k: string, v: string) => patch((d) => ({ ...d, meta: { ...d.meta, [k]: v } }));
  const setSkip = (k: string, on: boolean) => patch((d) => ({ ...d, skipped: { ...d.skipped, [k]: on } }));
  const setRows = (l: ListDef, rows: Row[]) => patch((d) => ({ ...d, lists: { ...d.lists, [l.key]: rows } }));

  const subjectKey = DOC_TYPES[type].headKeys.includes("เรื่อง") && !court;
  const derivedSubject = subjectKey ? (assembleDoc(t, { ...input, meta: { ...input.meta, เรื่อง: "" } }).head["เรื่อง"] ?? "") : "";

  return (
    <div className="page">
      <PageHeader stepper={stepper} title={title} status={status} />
      <div className="cols">
        <div className="work">
          <div className="show-mobile">
            <Segmented
              label="มุมมอง"
              value={view}
              onChange={setView}
              options={[
                { value: "form", label: "ข้อมูล" },
                { value: "paper", label: "ตัวอย่าง A4" },
              ]}
            />
          </div>
          <div className={view === "paper" ? "work hide-mobile" : "work"}>
            <AiPrefill t={t} court={court} values={draft.values} onFill={(v) =>
                patch((d) => {
                  const values = { ...d.values };
                  for (const [k, x] of Object.entries(v)) if (!(values[k] ?? "").trim()) values[k] = x;
                  return { ...d, values };
                })
              } />
            {t.sentence ? (
              <Card title="ข้อเท็จจริง" count={`ขาด ${prog.sections[0][1] - prog.sections[0][0]} จาก ${prog.sections[0][1]}`}>
                <div className="d-sent">
                  {t.sentence.map((para, i) => (
                    <p key={i}>
                      {para.map((p, j) => (
                        <PartView key={j} part={p} t={t} values={draft.values} onChange={setValue} />
                      ))}
                    </p>
                  ))}
                  <p className="hint">แบบ “{t.title}” · ช่องเส้นแดงยังว่าง</p>
                </div>
              </Card>
            ) : (
              t.sections.map((sec, si) => (
                <Card key={sec.title} title={sec.title} count={`ขาด ${prog.sections[si][1] - prog.sections[si][0]} จาก ${prog.sections[si][1]}`}>
                  <div className="rows">
                    {sec.slots.map((x) => (
                      <FieldRow key={x.key} label={x.question.replace(/ \(.*\)$/, "")} value={draft.values[x.key] ?? ""} status={(draft.values[x.key] ?? "").trim() ? "filled" : "empty"} hint={x.example} onChange={(v) => setValue(x.key, v)} />
                    ))}
                  </div>
                  {sec.list && <ListEditor list={sec.list} rows={draft.lists[sec.list.key] ?? emptyRows(sec.list)} onChange={(r) => setRows(sec.list!, r)} />}
                </Card>
              ))
            )}
            <Card title={court ? "วันที่ยื่น" : "หัวและท้ายหนังสือ"} count={(() => { const m = t.metaFields.filter((f) => !f.optional && !f.hidden); const miss = m.filter((f) => draft.skipped[f.key] || !(draft.meta[f.key] ?? "").trim()).length; return `ขาด ${miss} จาก ${m.length}`; })()}>
              <div className="rows">
                {subjectKey && (
                  <FieldRow label="เรื่อง" value={draft.meta["เรื่อง"] ?? ""} status="filled" hint={derivedSubject} onChange={(v) => setMeta("เรื่อง", v)} />
                )}
                {t.metaFields
                  .filter((f) => !f.hidden)
                  .map((f) => {
                    const v = draft.meta[f.key] ?? "";
                    const st: FieldStatus = f.optional ? "filled" : draft.skipped[f.key] ? "skipped" : v.trim() ? "filled" : "empty";
                    return (
                      <FieldRow
                        key={f.key}
                        label={f.label}
                        value={v}
                        status={st}
                        hint={f.hint}
                        onChange={(x) => setMeta(f.key, x)}
                        onSkip={f.optional ? undefined : () => setSkip(f.key, true)}
                        onUnskip={() => setSkip(f.key, false)}
                      />
                    );
                  })}
              </div>
            </Card>
            <AiBody
              t={t}
              court={court}
              draft={draft}
              assembled={assembled}
              stale={stale}
              onApply={(body) => patch((d) => ({ ...d, aiBody: body, aiFacts: factsKey(d) }))}
              onUndo={() => patch((d) => ({ ...d, aiBody: undefined, aiFacts: undefined }))}
              onBack={() => setStep(1)}
              onNext={() => {
                setDocState(docState);
                setStep(3);
              }}
              xp={xp}
              go={go}
              settings={settings}
            />
          </div>
        </div>
        <div className={view === "form" ? "hide-mobile" : undefined}>
          <Paper
            doc={paperDoc}
            caption={court ? "ตัวอย่างโดยประมาณ · ร่างเบื้องต้น ไม่ใช่คำปรึกษากฎหมาย ควรปรึกษาทนายความหรือสอบถามศาลแรงงานก่อนยื่นจริง · สีแดง = ยังขาด" : "ตัวอย่าง A4 · เนื้อหาประกอบจากข้อเท็จจริงด้วยแม่แบบ ไม่ใช่ AI · สีแดง = ยังขาด"}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */
function CourtNote() {
  return (
    <Card className="d-note" title="ก่อนยื่นจริง" right={<StatusTag tone="warning">ร่างเบื้องต้น</StatusTag>}>
      <p className="t-body-m">นี่เป็นร่างเบื้องต้นเท่านั้น ไม่ใช่คำปรึกษากฎหมาย โปรดอ่านทบทวนและปรึกษาทนายความ หรือสอบถามศาลแรงงานก่อนยื่นจริง</p>
      <p className="t-body-s muted">แบบนี้ร่างสำหรับลูกจ้างที่ฟ้องนายจ้าง ถ้าเป็นกรณีอื่นให้ปรึกษาทนายความหรือขอแบบฟอร์มจากศาล</p>
      <p className="t-body-s muted">ข้อมูลส่วนตัว เช่น เลขบัตรประชาชน ที่อยู่ จะถูกส่งไปยังผู้ให้บริการ AI ที่คุณเลือกเมื่อใช้ปุ่ม AI ปล่อยช่องว่างไว้แล้วกรอกเองในไฟล์ภายหลังได้</p>
    </Card>
  );
}

function PartView({ part, t, values, onChange }: { part: Part; t: Template; values: Record<string, string>; onChange: (k: string, v: string) => void }) {
  if (typeof part === "string") return <>{part}</>;
  if ("head" in part) return <span className="muted">{`{${part.head}}`}</span>;
  const slot = allSlots(t).find((s) => s.key === part.slot);
  if (!slot) return null;
  const v = values[slot.key] ?? "";
  const w = Math.max(8, (v || slot.short).length * 0.8 + 2);
  return (
    <input
      className={"blank-in" + (v.trim() ? "" : " miss")}
      value={v}
      placeholder={slot.short}
      aria-label={slot.question}
      style={{ width: `${w}ch` }}
      onChange={(e) => onChange(slot.key, e.target.value)}
    />
  );
}

function ListEditor({ list, rows, onChange }: { list: ListDef; rows: Row[]; onChange: (r: Row[]) => void }) {
  const tpl = list.cols.map((c) => (c.date ? "170px" : "minmax(0,1fr)")).join(" ");
  const set = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <div className="rows">
        {rows.map((r, i) => {
          const done = list.cols.every((c) => (r[c.key] ?? "").trim());
          return (
            <div className="lrow" key={i}>
              <div className="lrow-fields" style={{ gridTemplateColumns: tpl }}>
                {list.cols.map((c) =>
                  c.date ? (
                    <input key={c.key} type="date" className="input" aria-label={c.label} value={r[c.key] ?? ""} onChange={(e) => set(i, c.key, e.target.value)} />
                  ) : (
                    <input key={c.key} className="input" aria-label={c.label} placeholder={c.hint} value={r[c.key] ?? ""} onChange={(e) => set(i, c.key, e.target.value)} />
                  ),
                )}
              </div>
              <span className="row" style={{ gap: 4 }}>
                {!done && <span className="frow-actions">ยังขาด</span>}
                {rows.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="ลบรายการ">
                    ลบ
                  </Button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onChange([...rows, ...emptyRows(list)])}>
        + {list.addLabel}
      </Button>
      {list.sortByDate && <p className="sub-label">เรียงตามวันที่ให้อัตโนมัติในเอกสาร{rows.some((r) => r.date) ? ` · เริ่มจาก ${isoToThai([...rows].map((r) => r.date).filter(Boolean).sort()[0] ?? "")}` : ""}</p>}
    </div>
  );
}

function AiPrefill({ t, court, values, onFill }: { t: Template; court: boolean; values: Record<string, string>; onFill: (v: Record<string, string>) => void }) {
  const { settings, go, xp } = useApp();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "warning" | "danger"; text: string } | null>(null);
  const ready = aiReady(settings);
  const abort = useRef<AbortController | null>(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    abort.current = new AbortController();
    try {
      const slots = allSlots(t).filter((s) => !(values[s.key] ?? "").trim());
      const ask = Object.fromEntries(slots.map((s) => [s.key, s.question]));
      const reply = await runAi(
        settings,
        SYSTEM_PROMPTS.prefill,
        `เรื่องเล่า:\n${brief.trim()}\n\nช่องที่ต้องเติม (key: คำถาม) ตอบเป็น JSON object {key: ค่า หรือ null}:\n${JSON.stringify(ask, null, 2)}`,
        abort.current.signal,
      );
      const res = extractJson<PrefillResult>(reply);
      if (!res) return setMsg({ tone: "warning", text: "อ่านคำตอบของ AI ไม่ได้ ลองใหม่ หรือกรอกเอง" });
      const out: Record<string, string> = {};
      for (const s of slots) {
        const v = res[s.key];
        if (typeof v === "string" && v.trim()) out[s.key] = v.trim();
      }
      const n = Object.keys(out).length;
      onFill(out);
      setMsg(n ? { tone: "info", text: `AI เติมให้ ${n} ช่อง ตรวจทานก่อนไปต่อ ช่องที่เรื่องเล่าไม่ได้บอกยังว่างอยู่` } : { tone: "warning", text: "เรื่องเล่าไม่มีข้อมูลที่ตรงกับช่องว่าง" });
    } catch (e) {
      setMsg({ tone: "danger", text: `AI ตอบไม่สำเร็จ: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="ai-row">
        <Sparkle size={22} />
        <div className="grow">
          <span className="t-label-m">มีเรื่องเล่าคร่าวๆ? ให้ AI เติมช่องว่างให้</span>
          <span className="t-body-s muted">ไม่บังคับ · AI เติมเฉพาะสิ่งที่คุณเล่า ไม่แต่งข้อเท็จจริงเพิ่ม</span>
        </div>
        <Button variant="tertiary" size="sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "ปิดกล่องเล่าเรื่อง" : "เปิดกล่องเล่าเรื่อง"}
        </Button>
      </div>
      {open && (
        <div className="ai-open">
          <TextArea label="เล่าให้ฟังคร่าวๆ" placeholder="เล่าเป็นภาษาพูดได้ เช่น ใคร ทำอะไร เมื่อไร ที่ไหน" value={brief} onChange={(e) => setBrief(e.target.value)} style={{ minHeight: 96 }} />
          {court && <p className="t-body-s muted">ข้อมูลส่วนตัวในเรื่องเล่าจะถูกส่งไปยังผู้ให้บริการ AI ที่คุณเลือก</p>}
          <div className="actions">
            <Button variant="secondary" disabled={!ready || busy || !brief.trim()} onClick={run}>
              <Sparkle size={14} />
              {busy ? chrome("loading", xp && !court) : "ให้ AI เติมช่อง"}
            </Button>
            {!ready && (
              <Button variant="ghost" onClick={() => go("prompts")}>
                ไม่มีคีย์? คัดลอกพรอมต์แทน
              </Button>
            )}
          </div>
          {msg && <Banner tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Banner>}
        </div>
      )}
    </section>
  );
}

function AiBody(props: {
  t: Template;
  court: boolean;
  draft: Draft;
  assembled: { head: Record<string, string>; body: string[] };
  stale: boolean;
  onApply: (body: string[]) => void;
  onUndo: () => void;
  onBack: () => void;
  onNext: () => void;
  xp: boolean;
  go: (r: "prompts") => void;
  settings: ReturnType<typeof useApp>["settings"];
}) {
  const { t, court, draft, assembled, stale, onApply, onUndo, onBack, onNext, xp, go, settings } = props;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "info" | "warning" | "danger"; text: string } | null>(null);
  const ready = aiReady(settings);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const facts = allSlots(t)
        .map((s) => `- ${s.question}: ${(draft.values[s.key] ?? "").trim() || "[ระบุ...]"}`)
        .join("\n");
      const user = [
        `ชนิดเอกสาร: ${t.type}${court ? " (ศาลแรงงาน ร่างเบื้องต้น)" : ""}`,
        `วัตถุประสงค์: ${t.title}`,
        assembled.head["เรื่อง"] ? `เรื่อง: ${assembled.head["เรื่อง"]}` : "",
        `ข้อเท็จจริงที่ผู้ใช้ให้ (ช่องที่ว่างให้คง [ระบุ...] ไว้ ห้ามเพิ่มข้อเท็จจริง):\n${facts}`,
        `ร่างตั้งต้นที่ประกอบจากข้อเท็จจริง (ปรับสำนวนให้เป็นภาษาราชการ คงเนื้อหา ตัวเลข ชื่อ วันที่ และบรรทัดหัวข้อ เช่น คำขอท้ายฟ้อง ไว้ตามเดิม):\n${assembled.body.join("\n\n")}`,
        "ตอบเป็นย่อหน้าเนื้อหาเท่านั้น คั่นย่อหน้าด้วยบรรทัดว่าง",
      ]
        .filter(Boolean)
        .join("\n\n");
      const reply = await runAi(settings, SYSTEM_PROMPTS.draftBody, user);
      const body = reply
        .replace(/```[a-z]*/g, "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (!body.length) return setMsg({ tone: "warning", text: "AI ไม่ได้ส่งเนื้อหากลับมา ลองใหม่" });
      onApply(body);
      setMsg({ tone: "info", text: "AI ปรับเนื้อหาแล้ว ตรวจทานก่อนออกเอกสาร กดย้อนกลับได้" });
    } catch (e) {
      setMsg({ tone: "danger", text: `AI ตอบไม่สำเร็จ: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {draft.aiBody && (
        <div className="undo-line">
          <StatusTag tone="info">เนื้อหาที่ AI ปรับ</StatusTag>
          {stale && <span>คุณแก้ข้อมูลหลังจาก AI ร่าง เนื้อหาในเอกสารยังเป็นฉบับ AI</span>}
          <Button variant="ghost" size="sm" onClick={onUndo}>
            ใช้เนื้อหาตามช่องกรอก
          </Button>
        </div>
      )}
      {msg && <Banner tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Banner>}
      <div className="actions sticky-mobile d-actions">
        <Button variant="ghost" onClick={onBack}>
          ← เปลี่ยนชนิด
        </Button>
        <div className="right">
          {!ready && (
            <Button variant="ghost" onClick={() => go("prompts")} className="hide-mobile">
              ไม่มีคีย์? คัดลอกพรอมต์แทน
            </Button>
          )}
          <Button variant="secondary" disabled={!ready || busy} onClick={run}>
            <Sparkle size={14} />
            {busy ? chrome("loading", xp && !court) : "AI ช่วยร่างเนื้อหา"}
          </Button>
          <Button variant="primary" onClick={onNext}>
            ไปออกเอกสาร →
          </Button>
        </div>
      </div>
      {!ready && (
        <div className="show-mobile">
          <Button variant="ghost" onClick={() => go("prompts")}>
            ไม่มีคีย์? คัดลอกพรอมต์แทน
          </Button>
        </div>
      )}
    </>
  );
}
