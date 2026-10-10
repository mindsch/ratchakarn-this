import { useState } from "react";
import { Button, Card, Drawer, PageHeader, Sparkle, StatusTag } from "../../ui";
import { useApp } from "../../lib/app";
import { COPY_PROMPTS } from "../../generated/prompts";
import "./prompts.css";

type Key = keyof typeof COPY_PROMPTS;
const ORDER: Key[] = ["convert", "draft", "interview", "checkFormat", "court"];

const bytes = (t: string) => new TextEncoder().encode(t).length;
const kb = (t: string) => `${(bytes(t) / 1024).toFixed(bytes(t) < 10240 ? 1 : 0)} KB`;
const chars = (t: string) => t.length.toLocaleString("en-US");

function useCopy() {
  const [done, setDone] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(key);
    setTimeout(() => setDone((d) => (d === key ? null : d)), 1800);
  };
  return { done, copy };
}

function download(file: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  a.download = file;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function PromptsPage() {
  const { go } = useApp();
  const { done, copy } = useCopy();
  const [open, setOpen] = useState<Key | null>(null);

  const card = (k: Key, wide = false) => {
    const p = COPY_PROMPTS[k];
    return (
      <Card
        key={k}
        className={"pcard" + (wide ? " wide" : "")}
        title={p.label}
        right={k === "interview" ? <StatusTag tone="info" dot={false}>ใช้ใน AI อื่นเท่านั้น</StatusTag> : k === "all" ? <StatusTag tone="neutral" dot={false}>ขั้นสูง</StatusTag> : undefined}
      >
        <p className="t-body-m">{p.desc}</p>
        <p className="t-body-s muted pcard-paste">
          <span className="subtle">วางใน</span> {p.pasteInto}
        </p>
        <div className="pcard-foot">
          <div className="pcard-actions">
            <Button variant="secondary" onClick={() => copy(k, p.text)}>
              {done === k ? "คัดลอกแล้ว" : k === "all" ? "คัดลอกฉบับรวม" : "คัดลอกพรอมต์"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(k)}>ดูพรอมต์</Button>
          </div>
          <span className="t-body-s muted">{kb(p.text)}</span>
        </div>
      </Card>
    );
  };

  const cur = open ? COPY_PROMPTS[open] : null;

  return (
    <div className="page prompts-page">
      <PageHeader title="คลังพรอมต์" status="คัดลอกไปวางใน ChatGPT, Gemini, Claude หรือ Typhoon ได้เลย ไม่ต้องมีคีย์ AI ในเว็บนี้" />

      <Card title="ใช้พรอมต์ 3 ขั้นตอน" right={<span className="t-body-s muted">ทำครั้งเดียวต่อพรอมต์</span>}>
        <ol className="psteps">
          <li><span className="pnum">1</span><div><b>คัดลอก</b><p className="t-body-s muted">กดคัดลอกพรอมต์ที่ตรงกับงานของคุณ</p></div></li>
          <li><span className="pnum">2</span><div><b>วางใน AI ของคุณ <Sparkle size={14} /></b><p className="t-body-s muted">วางเป็นคำสั่งแรก หรือใน Project / Gem / Custom GPT แล้วพิมพ์งานต่อ</p></div></li>
          <li><span className="pnum">3</span><div><b>นำผลลัพธ์กลับมา</b><p className="t-body-s muted">วางผลลัพธ์ที่ขึ้นต้นด้วย ===RATCHAKARN-DOC=== ในหน้าจัดรูปแบบ เพื่อออกเป็น DOCX/PDF</p><button type="button" className="plink" onClick={() => go("format")}>ไปที่จัดรูปแบบ</button></div></li>
        </ol>
      </Card>

      <div className="pgrid">{ORDER.map((k) => card(k))}</div>
      {card("all", true)}

      {cur && open && (
        <PromptDrawer k={open} onClose={() => setOpen(null)} copied={done === open} onCopy={() => copy(open, cur.text)} />
      )}
    </div>
  );
}

function PromptDrawer({ k, onClose, copied, onCopy }: { k: Key; onClose: () => void; copied: boolean; onCopy: () => void }) {
  const p = COPY_PROMPTS[k];
  return (
    <Drawer open onClose={onClose} label={`พรอมต์ ${p.label}`}>
      <div className="pdrawer-head">
        <div>
          <h2 className="t-h-m">{p.label}</h2>
          <p className="t-body-s muted">{p.file} · {kb(p.text)} · {chars(p.text)} อักขระ</p>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label="ปิด">ปิด</Button>
      </div>
      <p className="t-body-s muted" style={{ margin: 0 }}>คัดลอกไปวางใน AI ของคุณ: {p.pasteInto}</p>
      <pre className="pdrawer-text" tabIndex={0}>{p.text}</pre>
      <div className="pdrawer-foot">
        <Button variant="primary" onClick={onCopy}>{copied ? "คัดลอกแล้ว" : "คัดลอกพรอมต์"}</Button>
        <Button variant="secondary" onClick={() => download(p.file, p.text)}>ดาวน์โหลด .md</Button>
      </div>
    </Drawer>
  );
}
