# References for 0001

Full notes: `notes/2026-10-10-research.md`.

## Layout numbers (Silpakorn Univ. Faculty of Architecture, updated 22 Jan 2567; local copies were pulled in scratch, re-download from the URLs)
- Common: TH Sarabun New 16 pt normal, line spacing single, margins top 1.5 / bottom 2 / left 3 / right 2 cm, justify to both margins, page number top-centre 15 pt hidden on page 1, at least 3 lines of body on the signing page.
- หนังสือภายนอก (archform_02): ครุฑ 3 cm, ~1.5 cm from top edge, centred; "ที่" and agency address align with letters S/Y of the emblem; date centred/under "U"; ชั้นความเร็ว/ความลับ 32 pt; เรื่อง/เรียน/อ้างถึง/สิ่งที่ส่งมาด้วย spaced 1 line + 6 pt before; body indent 2.5 cm; คำลงท้าย centred on the emblem axis, 1 line + 12 pt after last body line; ลงชื่อ 2 blank lines below; ตำแหน่ง centred under name.
- บันทึกข้อความ (archform_01): ครุฑ 1.5 cm top-left; "บันทึกข้อความ" bold 29 pt, exactly 35 pt line; ส่วนงาน/ที่/วันที่/เรื่อง bold 20 pt with dotted leaders; เรียน and body 16 pt; signature 4 blank lines below body, name starts at page centre.
- คำสั่ง (archform_03): ครุฑ 3 cm; "สั่ง ณ วันที่" indented 5 cm; ลงชื่อ 3 blank lines below; overflow lines marked with "..." bottom right.
- DOPA manual (different purpose, performance-evaluation docs): A4 80 g, TH SarabunIT๙ 16, margins T2 / L3 / R2 / B2, indent 1.25 cm. **Conflicts with the above** on top margin and indent, so config must allow per-agency profiles.
- Sources: arch.su.ac.th archform_01/02/03_manual_6701.pdf; multi.dopa.go.th official_letter upload; opsmoac.go.th; ocac.go.th.

## Writing rules
- opsmoac.go.th "เทคนิคการเขียนหนังสือราชการ" — richest source (openers ด้วย/เนื่องจาก/ตามที่, closers by purpose, pronouns, word strength, recipes: ขอบคุณ/ปฏิเสธ/ตักเตือน/เชิญ/ขอความร่วมมือ/ขอความช่วยเหลือ).
- ocac.go.th (สศร.) manual: 6 types, flow, urgency classes.

## Example/template pages (to scrape or download)
- dndpho.org page of ตัวอย่างหนังสือราชการ lists .docx templates and .pdf samples for หนังสือภายนอก, ภายใน, คำสั่ง, ประกาศ (attachments, need direct download — page text had no letter content).
- Scanned PDF bangphueng.go.th and image-based slides รรกสร.com need OCR (Typhoon OCR).

## Court
- ป.วิ.พ. ม.172: คำฟ้องต้องเป็นหนังสือ, ระบุสภาพแห่งข้อหา, คำขอบังคับ, ข้ออ้างที่อาศัยเป็นหลักแห่งข้อหา, แจ้งชัด; ม.171 applies same to คำร้องขอ; ม.18 court may accept/reject; ม.4(1) venue = defendant's domicile or where the cause arose.
- Typical structure (general knowledge, to be checked against "ประมวลตัวอย่างคำฟ้อง คำร้อง คำขอ คำให้การ…" books): header → numbered facts → คำขอท้ายฟ้อง ("ขอศาลออกหมายเรียกจำเลย… และบังคับจำเลยตามคำขอ") → signature → witness and document lists.
- Thai court paper/font requirements: not found for any court. For the labour court only the forms exist (below).

### Labour court templates (ศาลแรงงานภาค 8 ภูเก็ต) — chosen first court
Index page: https://lbphkc.coj.go.th/th/content/category/detail/id/35/cid/8415/iid/136135 ("แก้ไขลงในแบบฟอร์ม" — edit these Word forms). Files are .doc under `https://lbphkc.coj.go.th/th/file/get/file/<id>.doc`; each complaint has a paired บัญชีพยาน.
- Complaints: ค่าจ้างอย่างเดียว (…160358); บอกกล่าวล่วงหน้า (…160351); ค่าชดเชย+ค่าจ้าง (…160243); บอกกล่าว+ค่าชดเชย (…160236, …160228, …160219); ค่าเสียหายอย่างเดียว (…160211); ลูกจ้างฟ้องเพิกถอน (…155923); นายจ้างฟ้องเพิกถอน (…155916); ให้ปฏิบัติตามคำสั่งพนักงานตรวจ (…145421); เพิกถอนคำวินิจฉัย (…155902, …155851).
- คำร้อง: ขอดำเนินคดีตนเอง, ขอส่งหมายสองแห่ง, ขอยื่นบัญชีระบุพยานเพิ่มเติม, ขออนุญาตดำเนินกระบวนพิจารณา, ขอถอนฟ้อง, ขอคัดถ่ายเอกสาร, ขอหมายตั้งเจ้าพนักงานบังคับคดี, ขอเฉลี่ยทรัพย์, ขอรับเงิน, ขออนุญาตฟ้องคดี ณ ภูมิลำเนา.
- Read so far: only the ค่าจ้างอย่างเดียว template (converted with macOS `textutil`; Thai text readable, FORMTEXT fields = fill-ins). Local copy was in scratch, re-download for the build. The other templates, and the court's contact (lbphkc@coj.go.th, 25 ถ.ดำรง ต.ตลาดใหญ่ อ.เมือง ภูเก็ต) are not yet used.

## Legal flags
- ครุฑ: พ.ร.บ.เครื่องหมายครุฑพ่าห์ พ.ศ. 2534 and (ฉบับที่ 2) พ.ศ. 2535 exist (cited in a Khaosod case report); text unread. Related: พ.ร.บ.เครื่องหมายราชการ พ.ศ. 2482.
