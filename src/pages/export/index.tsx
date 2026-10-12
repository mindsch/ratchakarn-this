// Shared step 3 (ออกเอกสาร) for จัดรูปแบบ and ร่างเอกสาร. Design: Figma F04 32:427, mobile M-F04 60:2837.
import { useMemo, useState, type ReactNode } from "react";
import { Disclaimer } from "../../components/Disclaimer";
import { chrome } from "../../lib/copy";
import { finalDoc, useApp } from "../../lib/app";
import { buildDocx } from "../../lib/doc/docx";
import { printHtml } from "../../lib/doc/html";
import { buildBlocks, PROFILES, type RenderOptions } from "../../lib/doc/layout";
import { isCourt } from "../../lib/doc/types";
import { Banner, Button, Card, OptionRow, PageHeader, Paper, Segmented, StatusTag, Toggle } from "../../ui";
import "./export.css";

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function printDoc(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const w = iframe.contentWindow!;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(async () => {
    try {
      await (w.document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    } catch {
      /* ignore */
    }
    w.focus();
    w.print();
    setTimeout(() => iframe.remove(), 3000);
  }, 400);
}

const countPlaceholders = (d: ReturnType<typeof finalDoc>) => (JSON.stringify([d.head, d.body, d.foot]).match(/\[ระบุ[^\]]*\]/g) ?? []).length;

function ChecklistRow({ title, hint, tag, extra }: { title: ReactNode; hint: ReactNode; tag: ReactNode; extra?: ReactNode }) {
  return (
    <div className="xp-check">
      <div className="xp-check-text">
        <span className="xp-check-title">{title}</span>
        <span className="xp-check-hint">{hint}</span>
        {extra}
      </div>
      {tag}
    </div>
  );
}

export function ExportStep({ onBack, stepper }: { onBack: () => void; stepper?: ReactNode }) {
  const { docState, xp } = useApp();
  const [profileId, setProfileId] = useState("common");
  const [thaiDigits, setThaiDigits] = useState(false);
  const [useGaruda, setUseGaruda] = useState(false);
  const [garuda, setGaruda] = useState<RenderOptions["garudaImage"]>(null);
  const [garudaError, setGarudaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | "err" | null>(null);
  const [view, setView] = useState<"work" | "paper">("work");

  const doc = useMemo(() => finalDoc(docState), [docState]);
  const court = isCourt(doc.type);
  const opts: RenderOptions = useMemo(
    () => ({ profile: PROFILES[profileId], thaiDigits, garudaImage: !useGaruda ? null : garuda, showSlotHint: false }),
    [profileId, thaiDigits, garuda, useGaruda],
  );
  const left = countPlaceholders(doc);
  const title = `${doc.type}${doc.head["เรื่อง"] ? " " + doc.head["เรื่อง"] : ""}`.slice(0, 80);
  const profile = PROFILES[profileId];

  const onDocx = async () => {
    setBusy(true);
    setDone(null);
    try {
      download(await buildDocx(buildBlocks(doc, opts), opts, title), `${doc.type}.docx`);
      setDone("ok");
    } catch {
      setDone("err");
    } finally {
      setBusy(false);
    }
  };
  const onPdf = () => {
    setDone(null);
    try {
      printDoc(printHtml(buildBlocks(doc, opts), opts, title));
      setDone("ok");
    } catch {
      setDone("err");
    }
  };
  const onGaruda = (f?: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setGarudaError("รองรับเฉพาะไฟล์ PNG หรือ JPG");
      return;
    }
    setUseGaruda(true);
    setGarudaError(null);
    const r = new FileReader();
    r.onerror = () => setGarudaError("อ่านไฟล์ภาพไม่ได้ กรุณาลองไฟล์อื่น");
    r.onload = () => {
      const dataUrl = String(r.result);
      const img = new Image();
      img.onload = () => {
        setGaruda({ dataUrl, widthPx: img.naturalWidth, heightPx: img.naturalHeight });
      };
      img.onerror = () => setGarudaError("ไฟล์นี้ไม่ใช่ภาพ PNG/JPG ที่เปิดได้ กรุณาลองไฟล์อื่น");
      img.src = dataUrl;
    };
    r.readAsDataURL(f);
  };

  const status = (
    <>
      ตรวจแล้ว · {left > 0 ? <strong className="xp-danger">ขาด {left} ช่อง</strong> : <strong>ครบทุกช่อง</strong>} · ออกเอกสารได้เลย ช่องที่ว่างจะเป็น [ระบุ...] ในไฟล์
    </>
  );

  return (
    <div className="page">
      <PageHeader stepper={stepper} title="พร้อมออกเอกสาร" status={status} />
      <div className="show-mobile">
        <Segmented
          label="มุมมอง"
          value={view}
          onChange={setView}
          options={[
            { value: "work", label: "ช่องเอกสาร" },
            { value: "paper", label: "ตัวอย่าง A4" },
          ]}
        />
      </div>
      <div className="cols">
        <div className={`work ${view === "paper" ? "hide-mobile" : ""}`}>
          {court && <Disclaimer legal />}
          <Card title="รูปแบบหน้ากระดาษ" count={`เลือก 1 จาก ${Object.keys(PROFILES).length}`}>
            <div role="radiogroup" aria-label="รูปแบบหน้ากระดาษ" className="xp-opts">
              {Object.values(PROFILES).map((p) => (
                <OptionRow key={p.id} title={p.label} hint={p.note} selected={p.id === profileId} onSelect={() => setProfileId(p.id)} />
              ))}
            </div>
            <div className="xp-digits">
              <span>ใช้เลขไทย</span>
              <Toggle checked={thaiDigits} onChange={setThaiDigits} label="ใช้เลขไทย" />
            </div>
            <p className="xp-note">เป็นแนวปฏิบัติที่นิยม ไม่ใช่ข้อบังคับ ตรวจกับหน่วยงานของคุณ</p>
          </Card>
          <Card title="ก่อนใช้งานจริง" count="3 เรื่อง">
            <div className="rows">
              <ChecklistRow
                title="ตราเอกสาร"
                hint="ใส่ตราโลโก้บริษัท หรือ ตราครุฑ ใช้ได้ทั้งเอกสารจากร่างเอกสารและจัดรูปแบบในขั้นออกเอกสาร ภาพอยู่ในเบราว์เซอร์นี้เท่านั้น"
                tag={<Toggle checked={useGaruda} onChange={setUseGaruda} label="ใส่ตราในเอกสาร" />}
                extra={
                  <>
                    <span className="xp-upload">
                      <StatusTag tone={garudaError ? "danger" : useGaruda && garuda ? "success" : useGaruda ? "warning" : "info"}>
                        {garudaError ? "ไฟล์ใช้ไม่ได้" : useGaruda && garuda ? "พร้อมใช้" : useGaruda ? "กำลังอ่านภาพ" : "เว้นว่าง"}
                      </StatusTag>
                      <input
                        className="input xp-file-input"
                        type="file"
                        accept="image/png,image/jpeg"
                        aria-label="เลือกไฟล์ภาพตราเอกสาร PNG หรือ JPG"
                        onChange={(e) => {
                          onGaruda(e.currentTarget.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                      {useGaruda && garuda && (
                        <Button variant="ghost" size="sm" onClick={() => { setGaruda(null); setUseGaruda(false); setGarudaError(null); }}>
                          เอาภาพออก
                        </Button>
                      )}
                    </span>
                    {garudaError && <p className="t-body-s danger" role="alert">{garudaError}</p>}
                    <p className="xp-legal-note" role="note">
                      <strong>โปรดใช้ด้วยความระมัดระวัง:</strong> ตราครุฑเป็นเครื่องหมายที่กฎหมายคุ้มครอง ควรใช้เฉพาะเมื่อคุณหรือหน่วยงานมีสิทธิ์
                      และเอกสารประเภทนั้นอนุญาตให้ใช้{court ? " โดยเฉพาะเอกสารที่จะยื่นต่อศาลไม่ควรใส่ตราครุฑเองโดยไม่ได้รับคำแนะนำ" : ""}
                      โปรดตรวจระเบียบที่เกี่ยวข้องและปรึกษาฝ่ายกฎหมายหรือทนายความก่อนนำเอกสารไปใช้หรือส่งจริง
                    </p>
                  </>
                }
              />
              <ChecklistRow title="ฟอนต์" hint={`ติดตั้ง ${profile.fontFamily} ก่อนเปิดไฟล์ DOCX ไม่เช่นนั้นโปรแกรมจะใช้ฟอนต์อื่นแทน`} tag={<StatusTag tone="neutral">DOCX</StatusTag>} />
              <ChecklistRow
                title="ช่อง [ระบุ...]"
                hint={left > 0 ? "ยังว่างอยู่ จะขึ้นเป็น [ระบุ...] ในไฟล์ แก้ใน Word ได้" : "กรอกครบแล้ว"}
                tag={left > 0 ? <StatusTag tone="warning">เหลือ {left}</StatusTag> : <StatusTag tone="success">ครบ</StatusTag>}
              />
            </div>
            <p className="xp-note">
              PDF: เลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์ และปิด “หัวกระดาษและท้ายกระดาษ” (ขอบ ซ้าย {profile.marginsCm.left} / ขวา {profile.marginsCm.right} / บน {profile.marginsCm.top} / ล่าง {profile.marginsCm.bottom} ซม.)
            </p>
          </Card>
          {done && (
            <Banner tone={done === "ok" ? "success" : "danger"} onClose={() => setDone(null)} standard={court}>
              {chrome(done === "ok" ? "exportDone" : "exportError", xp && !court)}
            </Banner>
          )}
          <div className="actions sticky-mobile">
            <Button variant="ghost" onClick={onBack}>
              ← กลับไปแก้
            </Button>
            <div className="right">
              <Button variant="secondary" onClick={onPdf}>
                บันทึกเป็น PDF
              </Button>
              <Button variant="primary" onClick={onDocx} disabled={busy}>
                ดาวน์โหลด DOCX
              </Button>
            </div>
          </div>
          {!court && <p className="xp-note">ใช้ด้วยความรับผิดชอบของผู้ใช้เอง ตรวจทานเอกสารก่อนยื่นหรือส่งทุกครั้ง</p>}
        </div>
        <div className={view === "work" ? "hide-mobile" : ""}>
          <Paper
            doc={doc}
            options={opts}
            caption={`ตัวอย่าง A4 · ${useGaruda && garuda ? "ใส่ภาพตราแล้ว" : "ตราเว้นว่าง"} · สีแดง = ยังขาด (ตอนพิมพ์เป็นสีดำ)`}
          />
        </div>
      </div>
    </div>
  );
}
