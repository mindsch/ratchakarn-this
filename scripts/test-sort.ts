// Tests for src/lib/doc/sort.ts. Run: npx tsx scripts/test-sort.ts
import { parseDoc } from "../src/lib/doc/parse";
import { SAMPLES } from "../src/lib/doc/samples";
import { fieldKeys, sortBlob } from "../src/lib/doc/sort";

let failed = 0;
const ok = (c: boolean, msg: string) => { if (!c) { failed++; console.error("FAIL", msg); } };
const strip = (s: string) => s.replace(/\s+/g, "");

/** no word lost: every non-blank line (minus its label) must appear in the output */
function noLoss(name: string, raw: string) {
  const r = sortBlob(raw);
  const out = strip([...Object.values(r.doc.head), ...r.doc.body, ...Object.values(r.doc.foot), ...r.unplaced.map((u) => u.text)].join(""));
  const titles = /^(บันทึกข้อความ|คำร้อง)$/;
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || /^(ชนิด|---|===|```)/.test(t) || titles.test(t)) continue;
    const body = strip(t.replace(/^(ชนิด|[^:：\s]{1,30})\s*[:：]\s*/, "").replace(/^(วันที่|ที่|เรื่อง|เรียน|อ้างถึง|สิ่งที่ส่งมาด้วย|ส่วนราชการ|ตำแหน่ง|ลงชื่อ)\s+/, ""));
    if (body && !out.replace(/\|/g, "").includes(body.replace(/\|/g, ""))) ok(false, `${name}: lost text "${t}"`);
  }
}

for (const [type, raw] of Object.entries(SAMPLES)) {
  const r = sortBlob(raw);
  const p = parseDoc(raw);
  ok(r.doc.type === type, `${type}: type ${r.doc.type}`);
  ok(JSON.stringify(r.doc.body) === JSON.stringify(p.body), `${type}: body differs`);
  for (const [k, v] of Object.entries(p.head)) if (v.trim()) ok(r.doc.head[k] === v, `${type}: head ${k}`);
  for (const [k, v] of Object.entries(p.foot)) if (v.trim()) ok(r.doc.foot[k] === v, `${type}: foot ${k}`);
  ok(r.unplaced.length === 0, `${type}: unplaced ${r.unplaced.length}`);
  ok(Object.keys(r.status).length === fieldKeys(type).length, `${type}: status keys`);
  noLoss(type, raw);
}

const A = `สำนักงานเขตตัวอย่าง
ถนนตัวอย่าง กรุงเทพมหานคร 10000
ที่ กท 0123/456
5 กันยายน 2569
เรื่อง ขอเชิญประชุม
เรียน ผู้อำนวยการโรงเรียนตัวอย่าง
อ้างถึง หนังสือที่ ศธ 0001/1
สิ่งที่ส่งมาด้วย กำหนดการ 1 ฉบับ

ด้วยสำนักงานเขตตัวอย่างจะจัดประชุมเรื่องการเตรียมความพร้อม ในวันที่ 20 กันยายน 2569

จึงเรียนมาเพื่อโปรดทราบ

ขอแสดงความนับถือ

(นายสมชาย ใจดี)
ผู้อำนวยการสำนักงานเขตตัวอย่าง
กลุ่มงานบริหารทั่วไป
โทร. 02-123-4567`;
{
  const r = sortBlob(A);
  ok(r.doc.type === "หนังสือภายนอก", "A type");
  ok(r.doc.head["ที่"] === "กท 0123/456", "A ที่: " + r.doc.head["ที่"]);
  ok(r.doc.head["วันที่"] === "5 กันยายน 2569", "A วันที่");
  ok(r.doc.head["เรื่อง"] === "ขอเชิญประชุม", "A เรื่อง");
  ok(r.doc.head["เรียน"] === "ผู้อำนวยการโรงเรียนตัวอย่าง", "A เรียน");
  ok(r.doc.head["อ้างถึง"] === "หนังสือที่ ศธ 0001/1", "A อ้างถึง");
  ok(r.doc.head["สิ่งที่ส่งมาด้วย"] === "กำหนดการ 1 ฉบับ", "A ส่งมาด้วย");
  ok(r.doc.head["ส่วนราชการ"] === "สำนักงานเขตตัวอย่าง | ถนนตัวอย่าง กรุงเทพมหานคร 10000", "A ส่วนราชการ: " + r.doc.head["ส่วนราชการ"]);
  ok(r.doc.body.length === 2, "A body paras " + r.doc.body.length);
  ok(r.doc.foot["คำลงท้าย"] === "ขอแสดงความนับถือ", "A closing");
  ok(r.doc.foot["ลงชื่อ"] === "(นายสมชาย ใจดี)", "A signer");
  ok(r.doc.foot["ตำแหน่ง"] === "ผู้อำนวยการสำนักงานเขตตัวอย่าง", "A position");
  ok(r.doc.foot["โทร"] === "โทร. 02-123-4567", "A phone");
  ok(r.unplaced.length === 1 && r.unplaced[0].guess === "foot:ส่วนราชการเจ้าของเรื่อง", "A unplaced " + JSON.stringify(r.unplaced));
  noLoss("A", A);
}

const B = `ด้วยข้าพเจ้ามีความประสงค์จะขอลาพักผ่อนประจำปี
ตั้งแต่วันที่ 1 ถึง 5 พฤศจิกายน 2569
จึงเรียนมาเพื่อโปรดพิจารณา
ขอแสดงความเคารพ
(นางสาวสมหญิง รักดี)
นักวิชาการศึกษา
โทร 081-111-2222
อีเมล somying@example.com`;
{
  const r = sortBlob(B);
  ok(r.doc.body.length === 3, "B body lines as paragraphs " + r.doc.body.length);
  ok(r.doc.foot["คำลงท้าย"] === "ขอแสดงความเคารพ", "B closing");
  ok(r.doc.foot["โทร"] === "โทร 081-111-2222", "B phone");
  ok(r.doc.foot["ตำแหน่ง"] === "นักวิชาการศึกษา", "B position");
  ok(r.unplaced.some((u) => u.text.startsWith("อีเมล")), "B email unplaced");
  noLoss("B", B);
}

const C = `บันทึกข้อความ
ส่วนราชการ กลุ่มงานบุคคล สำนักงานตัวอย่าง โทร. 1234
ที่ ศธ 0001/22
วันที่ 3 ต.ค. 2569
เรื่อง ขออนุมัติเดินทางไปราชการ
เรียน ผู้อำนวยการสำนักงานตัวอย่าง

ด้วยข้าพเจ้ามีความประสงค์จะเดินทางไปราชการ ณ จังหวัดเชียงใหม่

จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ

(นายมานะ ตั้งใจ)
หัวหน้ากลุ่มงานบุคคล`;
{
  const r = sortBlob(C);
  ok(r.doc.type === "บันทึกข้อความ", "C type " + r.doc.type);
  ok(r.doc.head["ส่วนราชการ"]?.startsWith("กลุ่มงานบุคคล"), "C ส่วนราชการ");
  ok(r.doc.head["ที่"] === "ศธ 0001/22", "C ที่");
  ok(r.doc.head["วันที่"] === "3 ต.ค. 2569", "C date");
  ok(r.doc.body.length === 2, "C body " + r.doc.body.length);
  ok(r.doc.foot["ลงชื่อ"] === "(นายมานะ ตั้งใจ)", "C signer (no closing line)");
  noLoss("C", C);
}

const D = `เรื่อง ขอบคุณ
เรียน คุณสมชาย
ขอบคุณสำหรับความช่วยเหลือ
ขอบคุณอีกครั้ง
ลงชื่อ สมศรี
ตำแหน่ง ครู`;
{
  const r = sortBlob(D);
  ok(r.doc.head["เรื่อง"] === "ขอบคุณ" && r.doc.head["เรียน"] === "คุณสมชาย", "D head");
  ok(r.doc.body.length === 2, "D body " + r.doc.body.length);
  ok(r.doc.foot["ลงชื่อ"] === "สมศรี" && r.doc.foot["ตำแหน่ง"] === "ครู", "D foot");
  noLoss("D", D);
}

// empty / whitespace blob must not throw
ok(sortBlob("").doc.body.length === 0, "empty");
ok(sortBlob("   \n\n").doc.body.length === 0, "blank");

if (failed) { console.error(failed, "failed"); process.exit(1); }
console.log("sort: all passed");
