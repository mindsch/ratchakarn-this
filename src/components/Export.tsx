import { useEffect, useMemo, useRef, useState } from "react";
import { buildDocx } from "../lib/doc/docx";
import { printHtml, renderInner, pageCss } from "../lib/doc/html";
import { buildBlocks, PROFILES, type RenderOptions } from "../lib/doc/layout";
import { parseDoc, serializeDoc } from "../lib/doc/parse";
import { SAMPLES } from "../lib/doc/samples";
import { DOC_TYPES, isCourt } from "../lib/doc/types";
import { Disclaimer } from "./Disclaimer";

interface Props {
  raw: string;
  setRaw: (s: string) => void;
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function Export({ raw, setRaw }: Props) {
  const [profileId, setProfileId] = useState("common");
  const [thaiDigits, setThaiDigits] = useState(false);
  const [showSlotHint, setShowSlotHint] = useState(true);
  const [garuda, setGaruda] = useState<RenderOptions["garudaImage"]>(null);
  const [showForm, setShowForm] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.6);
  const wrap = useRef<HTMLDivElement>(null);

  const doc = useMemo(() => parseDoc(raw), [raw]);
  const def = DOC_TYPES[doc.type];
  const opts: RenderOptions = useMemo(
    () => ({ profile: PROFILES[profileId], thaiDigits, garudaImage: garuda, showSlotHint }),
    [profileId, thaiDigits, garuda, showSlotHint],
  );
  const blocks = useMemo(() => buildBlocks(doc, opts), [doc, opts]);
  const inner = useMemo(() => renderInner(blocks, opts, true), [blocks, opts]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 8) / (21 * 37.795))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setType = (t: string) => {
    const sample = SAMPLES[t];
    if (sample) setRaw(sample);
    else setRaw(serializeDoc({ type: t, head: {}, body: ["[ระบุเนื้อหา]"], foot: {} }));
  };
  const editHead = (k: string, v: string) => setRaw(serializeDoc({ ...doc, head: { ...doc.head, [k]: v } }));
  const editFoot = (k: string, v: string) => setRaw(serializeDoc({ ...doc, foot: { ...doc.foot, [k]: v } }));
  const editBody = (v: string) =>
    setRaw(serializeDoc({ ...doc, body: v.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) }));

  const m = PROFILES[profileId].marginsCm;
  const title = `${doc.type}${doc.head["เรื่อง"] ? " " + doc.head["เรื่อง"] : ""}`.slice(0, 80);

  const onDocx = async () => {
    setBusy(true);
    try {
      download(await buildDocx(blocks, opts, title), `${doc.type}.docx`);
    } finally {
      setBusy(false);
    }
  };

  const onPdf = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    const w = iframe.contentWindow!;
    w.document.open();
    w.document.write(printHtml(blocks, opts, title));
    w.document.close();
    const go = async () => {
      try {
        await (w.document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
      } catch {
        /* ignore */
      }
      w.focus();
      w.print();
      setTimeout(() => iframe.remove(), 3000);
    };
    setTimeout(go, 400);
  };

  const onGaruda = (f?: File | null) => {
    if (!f) return setGaruda(null);
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result);
      const img = new Image();
      img.onload = () => setGaruda({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight });
      img.src = dataUrl;
    };
    r.readAsDataURL(f);
  };

  return (
    <div className="export">
      <Disclaimer legal={isCourt(doc.type)} />
      <div className="export-grid">
        <section className="panel">
          <h2>1. ใส่เนื้อหา</h2>
          <p className="muted small">
            หน้านี้ใช้ได้โดยไม่ต้องใช้แชตหรือคีย์ใดๆ วางข้อความในแม่แบบด้านล่าง (จะจาก AI ตัวไหนก็ได้ที่ใช้พรอมต์ของเรา) หรือกรอกทีละช่อง
          </p>
          <label>ชนิดเอกสาร</label>
          <select value={doc.type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(DOC_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button className="btn small" onClick={() => setShowForm(!showForm)}>
            {showForm ? "ซ่อนแบบฟอร์ม" : "แสดงแบบฟอร์มกรอกทีละช่อง"}
          </button>

          {showForm && def && (
            <div className="form">
              {def.headKeys.map((k) => (
                <div key={k}>
                  <label>{k}</label>
                  <input value={doc.head[k] ?? ""} onChange={(e) => editHead(k, e.target.value)} />
                </div>
              ))}
              <label>เนื้อหา (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)</label>
              <textarea rows={10} value={doc.body.join("\n\n")} onChange={(e) => editBody(e.target.value)} />
              {def.footKeys.map((k) => (
                <div key={k}>
                  <label>{k}</label>
                  <input value={doc.foot[k] ?? ""} onChange={(e) => editFoot(k, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <label>แม่แบบข้อความ (วางจาก AI หรือแก้โดยตรงได้)</label>
          <textarea className="mono" rows={12} value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} />
        </section>

        <section className="panel">
          <h2>2. ตั้งค่าและส่งออก</h2>
          <label>รูปแบบหน้ากระดาษ</label>
          <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
            {Object.values(PROFILES).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="muted small">
            {PROFILES[profileId].note} — เป็นแนวปฏิบัติที่นิยม ไม่ใช่ข้อบังคับ ตรวจกับหน่วยงานของคุณ
          </p>
          <label className="check">
            <input type="checkbox" checked={thaiDigits} onChange={(e) => setThaiDigits(e.target.checked)} />
            ใช้เลขไทย
          </label>

          <div className="garuda-box">
            <strong>ตราครุฑ</strong>
            <p className="muted small">
              ตราครุฑเป็นเครื่องหมายที่กฎหมายคุ้มครอง เราไม่ได้ให้ภาพมา เอกสารจะเว้นช่องไว้ให้ ({isCourt(doc.type) ? "เอกสารศาลไม่ใช้ตราครุฑ" : "สูง 3 ซม. บันทึกข้อความ 1.5 ซม."})
              คุณวางตราเองใน Word หรืออัปโหลดภาพที่คุณมีสิทธิ์ใช้ด้านล่าง (ภาพอยู่ในเบราว์เซอร์ ไม่ถูกอัปโหลดไปไหน) คุณต้องตรวจสอบสิทธิ์การใช้ตราเอง
            </p>
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => onGaruda(e.target.files?.[0])} />
            {garuda && (
              <button className="btn ghost small" onClick={() => setGaruda(null)}>
                เอาภาพออก
              </button>
            )}
            <label className="check">
              <input type="checkbox" checked={showSlotHint} onChange={(e) => setShowSlotHint(e.target.checked)} />
              แสดงข้อความ “(วางตราครุฑที่นี่)” ในไฟล์ DOCX และตัวอย่าง
            </label>
          </div>

          <div className="row wrap">
            <button className="btn primary" onClick={onDocx} disabled={busy}>
              ดาวน์โหลด DOCX
            </button>
            <button className="btn primary" onClick={onPdf}>
              พิมพ์ / บันทึกเป็น PDF
            </button>
          </div>
          <p className="muted small">
            DOCX ใช้ฟอนต์ <strong>{PROFILES[profileId].fontFamily}</strong> ติดตั้งฟอนต์นี้ในเครื่องก่อน ไม่เช่นนั้นโปรแกรมจะใช้ฟอนต์อื่นแทน PDF: เลือก “บันทึกเป็น PDF”
            ในหน้าต่างพิมพ์ และปิด “หัวกระดาษและท้ายกระดาษ” (ขอบหน้า ซ้าย {m.left} / ขวา {m.right} / บน {m.top} / ล่าง {m.bottom} ซม.)
          </p>
          <p className="muted small">ใช้ด้วยความรับผิดชอบของผู้ใช้เอง ตรวจทานเอกสารก่อนยื่นหรือส่งทุกครั้ง</p>
        </section>

        <section className="panel preview">
          <h2>ตัวอย่าง</h2>
          <div className="paper-wrap" ref={wrap}>
            <style>{pageCss(opts)}</style>
            <div className="paper-scale" style={{ transform: `scale(${scale})`, height: `${29.7 * 37.795 * scale}px` }}>
              <div
                className="paper rk-page"
                style={{ padding: `${m.top}cm ${m.right}cm ${m.bottom}cm ${m.left}cm` }}
                dangerouslySetInnerHTML={{ __html: inner }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
