import { useState } from "react";
import { COPY_PROMPTS } from "../generated/prompts";

type Key = keyof typeof COPY_PROMPTS;

export function CopyPrompt() {
  const [key, setKey] = useState<Key>("all");
  const [copied, setCopied] = useState(false);
  const p = COPY_PROMPTS[key];

  const copy = async () => {
    await navigator.clipboard.writeText(p.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const dl = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([p.text], { type: "text/markdown;charset=utf-8" }));
    a.download = p.file;
    a.click();
  };

  return (
    <div className="copyprompt">
      <h2>พรอมต์สำหรับนำไปใช้กับ AI ของคุณเอง</h2>
      <p className="muted">
        ไม่ต้องใช้เว็บนี้ก็ได้ ก๊อปพรอมต์ไปวางใน ChatGPT, Claude, Gemini, หรือโมเดลไทย (Typhoon, OpenThaiGPT ฯลฯ) แล้วใช้งานได้เหมือนกัน เมื่อ AI ให้เอกสารเป็นบล็อก
        ===RATCHAKARN-DOC=== ให้นำไปวางที่แท็บ “ออกเอกสาร” เพื่อได้ DOCX/PDF
      </p>
      <div className="modes">
        {(Object.keys(COPY_PROMPTS) as Key[]).map((k) => (
          <button key={k} className={"chip" + (k === key ? " on" : "")} onClick={() => setKey(k)}>
            {COPY_PROMPTS[k].label}
          </button>
        ))}
      </div>
      <div className="row wrap">
        <button className="btn primary" onClick={copy}>
          {copied ? "คัดลอกแล้ว ✓" : "คัดลอกพรอมต์"}
        </button>
        <button className="btn" onClick={dl}>
          ดาวน์โหลด .md
        </button>
        <span className="muted small">{p.text.length.toLocaleString()} ตัวอักษร</span>
      </div>
      <details open>
        <summary>วิธีใช้</summary>
        <ul>
          <li>
            <strong>ChatGPT</strong>: สร้าง Project หรือ Custom GPT แล้ววางในช่อง Instructions (ช่อง Custom Instructions ทั่วไปสั้นเกินไป ให้วางเป็นข้อความแรกของแชตแทน)
          </li>
          <li>
            <strong>Claude</strong>: สร้าง Project แล้ววางใน Project instructions หรือวางเป็นข้อความแรก
          </li>
          <li>
            <strong>Gemini</strong>: สร้าง Gem แล้ววางใน Instructions หรือวางเป็นข้อความแรก
          </li>
          <li>
            <strong>โมเดลไทย / โมเดลเล็ก</strong>: ใช้ฉบับ “แปลงภาษาอย่างเดียว (สั้น)” วางเป็น system prompt หรือข้อความแรก
          </li>
          <li>หลังวางพรอมต์ พิมพ์ชื่อโหมด เช่น “แปลงภาษา ระดับ 1” หรือ “ร่างเอกสาร” แล้ววางข้อความของคุณ</li>
        </ul>
      </details>
      <textarea className="mono" readOnly rows={22} value={p.text} />
    </div>
  );
}
