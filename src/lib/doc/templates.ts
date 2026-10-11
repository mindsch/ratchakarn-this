// ร่างเอกสาร: per type -> purposes -> slots, fill-in sentences and body assembly.
// The body is assembled word for word from the facts the user typed. A blank slot becomes `[ระบุ<short>]`; nothing is invented.
// Formulas come from prompts/doctypes/letters.md, other.md and prompts/modes/court.md.
import { DOC_TYPES, isCourt, type DocData } from "./types";

/* ---------- Types ---------- */
export interface Slot {
  key: string;
  /** shown in the "ข้อมูลที่ต้องเตรียม" list */
  question: string;
  /** used inside the blank: [ระบุ<short>] */
  short: string;
  /** input placeholder */
  example: string;
}
export type Part = string | { slot: string } | { head: string };
export type Row = Record<string, string>;
export interface ListCol {
  key: string;
  label: string;
  hint: string;
  date?: boolean;
}
export interface ListDef {
  key: string;
  title: string;
  addLabel: string;
  cols: ListCol[];
  sortByDate?: boolean;
}
export interface Section {
  title: string;
  slots: Slot[];
  list?: ListDef;
}
export interface MetaField {
  key: string;
  group: "head" | "foot";
  label: string;
  hint: string;
  optional?: boolean;
  /** not shown as a row; only used as a default (e.g. คำลงท้าย) */
  hidden?: boolean;
}
export interface Input {
  values: Record<string, string>;
  lists: Record<string, Row[]>;
  /** header/footer fields typed by the user: ที่, วันที่, ลงชื่อ (name only), ตำแหน่ง, ... */
  meta: Record<string, string>;
}
export interface Assembled {
  head: Record<string, string>;
  body: string[];
  foot: Record<string, string>;
}
export interface Template {
  type: string;
  id: string;
  title: string;
  hint: string;
  isCourt: boolean;
  sections: Section[];
  /** fill-in sentence paragraphs (letters); courts use sections instead */
  sentence?: Part[][];
  metaFields: MetaField[];
  assemble(i: Input): Assembled;
}

/* ---------- Helpers ---------- */
export const blank = (short: string) => `[ระบุ${short}]`;
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const thaiDate = (d: Date) => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
export const todayThai = () => thaiDate(new Date());
/** "2025-12-01" -> "1 ธันวาคม 2568"; "" when not a valid date */
export function isoToThai(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "";
  const mo = Number(m[2]) - 1;
  if (mo < 0 || mo > 11) return "";
  return `${Number(m[3])} ${THAI_MONTHS[mo]} ${Number(m[1]) + 543}`;
}
export const thaiNum = (n: number) => String(n).replace(/\d/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[Number(d)]);

const val = (v: Record<string, string>, k: string) => (v[k] ?? "").trim();

/** The doc type's slots in one flat list (letters: one section; courts: several). */
export const allSlots = (t: Template) => t.sections.flatMap((s) => s.slots);
const slotMap = (t: Template) => Object.fromEntries(allSlots(t).map((s) => [s.key, s]));

function renderParts(parts: Part[], i: Input, slots: Record<string, Slot>): string {
  return parts
    .map((p) => {
      if (typeof p === "string") return p;
      if ("slot" in p) return val(i.values, p.slot) || blank(slots[p.slot]?.short ?? "ข้อมูล");
      return val(i.meta, p.head) || blank(p.head);
    })
    .join("")
    .replace(/ {2,}/g, " ")
    .trim();
}

/* ---------- Letter-family purposes ---------- */
interface Purpose {
  id: string;
  title: string;
  hint: string;
  subject: Part[];
  slots: Slot[];
  /** slot key used for เรียน (when the type has one) */
  recipient: string;
  paragraphs: Part[][];
  /** สิ่งที่ส่งมาด้วย, only when every slot in it is filled */
  attach?: { parts: Part[]; needs: string[] };
}
const s = (key: string, question: string, short: string, example: string): Slot => ({ key, question, short, example });
const S = (key: string): Part => ({ slot: key });
const TO = s("to", "ส่งถึงใคร (ตำแหน่งหรือหน่วยงาน)", "ผู้รับ", "ผู้อำนวยการสำนักงานตัวอย่างจังหวัด");

const INVITE: Purpose = {
  id: "เชิญ",
  title: "เชิญ",
  hint: "วิทยากร กรรมการ ประชุม",
  subject: ["ขอเชิญ", S("task")],
  recipient: "invitee",
  slots: [
    s("org", "ใครเป็นผู้เชิญ", "ผู้เชิญ", "บริษัท ตัวอย่าง จำกัด"),
    s("invitee", "เชิญใคร", "ผู้ได้รับเชิญ", "ผู้อำนวยการสำนักงานใหญ่"),
    s("task", "เชิญมาทำอะไร", "สิ่งที่เชิญ", "เป็นวิทยากรบรรยายเรื่อง การจัดการเอกสาร"),
    s("when", "วัน เวลา", "วันที่และเวลา", "5 ธันวาคม 2569 เวลา 09.00 น."),
    s("where", "สถานที่", "สถานที่", "ห้องประชุมใหญ่ ชั้น 3"),
    s("reason", "เหตุผลที่เชิญท่านนี้", "เหตุผลที่เชิญท่านนี้", "ท่านมีประสบการณ์ด้านนี้โดยตรง"),
  ],
  paragraphs: [
    ["ด้วย", S("org"), " ประสงค์จะขอเชิญ", S("invitee"), " ", S("task"), " ในวันที่ ", S("when"), " ณ ", S("where"), " เนื่องจาก", S("reason")],
    ["จึงเรียนมาเพื่อขอเรียนเชิญ และขอขอบคุณมา ณ โอกาสนี้"],
  ],
};

const APPROVE: Purpose = {
  id: "ขออนุมัติ",
  title: "ขออนุมัติ",
  hint: "ขอความเห็นชอบ ขออนุญาต",
  subject: ["ขออนุมัติ", S("request")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ขอ (หน่วยงานหรือชื่อ)", "ผู้ขอ", "กลุ่มงานบริหารทั่วไป"),
    s("request", "ขออนุมัติอะไร", "สิ่งที่ขออนุมัติ", "จัดซื้อวัสดุสำนักงาน"),
    s("reason", "เหตุผลความจำเป็น", "เหตุผล", "วัสดุเดิมใกล้หมดและต้องใช้ในการปฏิบัติงาน"),
    s("detail", "รายละเอียด เช่น จำนวน วงเงิน กำหนดเวลา", "รายละเอียด", "จำนวน 20 รายการ วงเงินไม่เกิน 15,000 บาท"),
  ],
  paragraphs: [
    ["ด้วย", S("org"), " มีความประสงค์ขออนุมัติ", S("request"), " เนื่องจาก", S("reason")],
    ["ทั้งนี้ มีรายละเอียดดังนี้ ", S("detail")],
    ["จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ จะขอบคุณยิ่ง"],
  ],
};

const COOPERATE: Purpose = {
  id: "ขอความร่วมมือ",
  title: "ขอความร่วมมือ",
  hint: "ครวญ · ออด · มัด",
  subject: ["ขอความร่วมมือ", S("ask")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ขอ", "ผู้ขอ", "สำนักงานตัวอย่าง"),
    s("why", "สาเหตุที่ต้องขอความร่วมมือ (ครวญ)", "สาเหตุ", "จะจัดสัมมนาเชิงปฏิบัติการเพื่อพัฒนาความรู้ของเจ้าหน้าที่"),
    s("ask", "ขอให้ทำอะไร (มัด)", "สิ่งที่ขอให้ทำ", "ส่งเจ้าหน้าที่เข้าร่วมสัมมนา จำนวน 2 คน"),
    s("benefit", "ผู้รับสำคัญอย่างไร หรือได้ประโยชน์อะไร (ออด)", "ความสำคัญหรือประโยชน์", "ท่านมีบทบาทโดยตรงต่อการปฏิบัติงานด้านนี้"),
  ],
  paragraphs: [
    ["ด้วย", S("org"), " ", S("why")],
    ["ในการนี้ จึงขอความอนุเคราะห์ท่านโปรด", S("ask"), " เนื่องจาก", S("benefit")],
    ["จึงเรียนมาเพื่อขอได้โปรดให้ความร่วมมือ และขอขอบคุณมา ณ โอกาสนี้"],
  ],
};

const THANKS: Purpose = {
  id: "ขอบคุณ",
  title: "ขอบคุณ",
  hint: "อ้างถึงความช่วยเหลือที่ได้รับ",
  subject: ["ขอบคุณ", S("help")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ขอบคุณ", "ผู้ขอบคุณ", "สำนักงานตัวอย่าง"),
    s("help", "ได้รับความช่วยเหลืออะไร", "ความช่วยเหลือที่ได้รับ", "การสนับสนุนวิทยากรบรรยาย"),
    s("when", "เมื่อไร หรือในโอกาสใด", "เมื่อไร", "วันที่ 5 ธันวาคม 2569"),
    s("value", "ช่วยให้เกิดผลดีอย่างไร", "ผลดีที่เกิดขึ้น", "ผู้เข้าร่วมได้รับความรู้ไปใช้ในการปฏิบัติงานจริง"),
  ],
  paragraphs: [
    ["ตามที่", S("to"), " ได้ให้ความอนุเคราะห์", S("help"), " เมื่อ", S("when"), " นั้น"],
    [S("org"), " ขอขอบคุณในความอนุเคราะห์ดังกล่าว ซึ่ง", S("value")],
    ["จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้"],
  ],
};

const DECLINE: Purpose = {
  id: "ปฏิเสธ",
  title: "ปฏิเสธ",
  hint: "นุ่มนวล ให้ความหวังโอกาสหน้า",
  subject: ["การ", S("request")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ตอบ", "ผู้ตอบ", "สำนักงานตัวอย่าง"),
    s("request", "คำขอเดิมที่จะปฏิเสธ", "คำขอเดิม", "ขอให้จัดส่งวิทยากร"),
    s("reason", "เหตุผลที่ปฏิเสธ", "เหตุผล", "ช่วงเวลาดังกล่าวมีภารกิจเร่งด่วนที่ไม่อาจเลื่อนได้"),
    s("later", "ข้อเสนอหรือโอกาสหน้า (ถ้ามี)", "โอกาสหน้า", "หากมีโอกาสในคราวต่อไป ยินดีให้ความร่วมมือ"),
  ],
  paragraphs: [
    ["ตามที่", S("to"), " ขอ", S("request"), " นั้น ", S("org"), " ขอขอบคุณที่ไว้วางใจ"],
    ["อย่างไรก็ตาม เนื่องจาก", S("reason"), " จึงขออภัยที่ไม่อาจดำเนินการตามที่ขอได้ในครั้งนี้"],
    ["ทั้งนี้ ", S("later")],
    ["จึงเรียนมาเพื่อโปรดทราบ"],
  ],
};

const FOLLOW: Purpose = {
  id: "ติดตาม",
  title: "ติดตาม",
  hint: "เตือนเรื่องที่ค้างอยู่",
  subject: ["ขอติดตาม", S("what")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ติดตาม", "ผู้ติดตาม", "สำนักงานตัวอย่าง"),
    s("ref", "หนังสือเดิม (ที่ วันที่ เรื่อง)", "หนังสือเดิม", "ที่ บต 045/2569 ลงวันที่ 3 ตุลาคม 2569 เรื่อง ขอข้อมูลผู้เข้าอบรม"),
    s("what", "สิ่งที่ยังไม่ได้รับ", "สิ่งที่ยังไม่ได้รับ", "รายชื่อผู้เข้าอบรม"),
    s("deadline", "ขอให้ดำเนินการภายในเมื่อไร", "กำหนดเวลา", "15 ธันวาคม 2569"),
  ],
  paragraphs: [
    ["ตามที่", S("org"), " ได้มีหนังสือ ", S("ref"), " ขอให้ส่ง", S("what"), " นั้น"],
    ["บัดนี้เวลาได้ล่วงเลยมาแล้ว แต่ยังไม่ได้รับการดำเนินการดังกล่าว จึงขอให้ดำเนินการภายในวันที่ ", S("deadline")],
    ["จึงขอเรียนเตือนมาเพื่อโปรดดำเนินการ"],
  ],
};

const COMPLAIN: Purpose = {
  id: "ร้องเรียน",
  title: "ร้องเรียน",
  hint: "เล่าข้อเท็จจริงตามลำดับเวลา",
  subject: ["ขอให้ตรวจสอบ", S("what")],
  recipient: "to",
  slots: [
    TO,
    s("who", "ผู้เขียนคือใคร (ชื่อ ที่อยู่)", "ผู้ร้อง", "นายสมชาย ตัวอย่าง อยู่บ้านเลขที่ 12 ตำบลตัวอย่าง"),
    s("when", "เกิดขึ้นเมื่อไร", "วันที่เกิดเหตุ", "1 ธันวาคม 2569"),
    s("where", "ที่ไหน", "สถานที่", "ถนนตัวอย่าง หน้าตลาด"),
    s("what", "เกิดอะไรขึ้น (ใคร ทำอะไร)", "เหตุการณ์", "ไฟฟ้าสาธารณะชำรุดและไม่ได้รับการซ่อม"),
    s("impact", "ส่งผลกระทบอย่างไร", "ผลกระทบ", "ประชาชนสัญจรลำบากและเสี่ยงต่ออันตราย"),
    s("ask", "ขอให้ตรวจสอบหรือแก้ไขอะไร", "สิ่งที่ขอให้ทำ", "ส่งเจ้าหน้าที่ตรวจสอบและแก้ไขโดยเร็ว"),
  ],
  paragraphs: [
    ["ข้าพเจ้า ", S("who"), " ขอเรียนว่า เมื่อวันที่ ", S("when"), " ณ ", S("where"), " ", S("what")],
    ["เหตุการณ์ดังกล่าวทำให้", S("impact")],
    ["ข้าพเจ้าจึงขอความอนุเคราะห์ท่านโปรด", S("ask")],
    ["จึงเรียนมาเพื่อโปรดพิจารณา"],
  ],
};

const SEND: Purpose = {
  id: "นำส่ง",
  title: "นำส่ง",
  hint: "แจ้งว่าส่งอะไรไป",
  subject: ["ส่ง", S("items")],
  recipient: "to",
  slots: [
    TO,
    s("org", "ใครเป็นผู้ส่ง", "ผู้ส่ง", "สำนักงานตัวอย่าง"),
    s("why", "ส่งเพราะเหตุใด", "เหตุที่ส่ง", "ได้ดำเนินการตามที่ขอเรียบร้อยแล้ว"),
    s("items", "ส่งอะไรไป", "สิ่งที่ส่ง", "รายงานผลการดำเนินงาน"),
    s("count", "จำนวนเท่าใด", "จำนวน", "1 ชุด"),
    s("action", "ต้องการให้ผู้รับทำอย่างไร", "สิ่งที่ขอให้ทำ", "โปรดตรวจสอบและแจ้งผลให้ทราบ"),
  ],
  paragraphs: [
    ["ด้วย", S("org"), " ", S("why"), " จึงขอนำส่ง", S("items"), " จำนวน ", S("count"), " มาพร้อมหนังสือนี้"],
    ["ทั้งนี้ ขอให้", S("action")],
    ["จึงเรียนมาเพื่อโปรดพิจารณา"],
  ],
  attach: { parts: [S("items"), " จำนวน ", S("count")], needs: ["items", "count"] },
};

const HELP: Purpose = {
  id: "ขอความช่วยเหลือ",
  title: "ขอความช่วยเหลือ",
  hint: "ขอให้ตรวจสอบหรือช่วยเหลือ",
  subject: ["ขอความอนุเคราะห์", S("ask")],
  recipient: "to",
  slots: [
    TO,
    s("who", "ผู้เขียนคือใคร (ชื่อ ที่อยู่)", "ผู้ร้อง", "นางสาวสมหญิง ตัวอย่าง อยู่บ้านเลขที่ 5 ตำบลตัวอย่าง"),
    s("problem", "เรื่องที่เกิดขึ้นและความจำเป็น", "เรื่องที่เกิดขึ้น", "ท่อระบายน้ำหน้าบ้านอุดตันมาตั้งแต่วันที่ 1 พฤศจิกายน 2569 น้ำท่วมขังทุกครั้งที่ฝนตก"),
    s("ask", "ขอให้ทำอะไร", "สิ่งที่ขอให้ทำ", "ส่งเจ้าหน้าที่มาตรวจสอบและแก้ไข"),
  ],
  paragraphs: [
    ["ข้าพเจ้า ", S("who"), " ขอเรียนว่า ", S("problem")],
    ["ข้าพเจ้าจึงขอความอนุเคราะห์ท่านโปรด", S("ask")],
    ["จึงเรียนมาเพื่อโปรดพิจารณา"],
  ],
};

const CERTIFY: Purpose = {
  id: "รับรองการทำงาน",
  title: "รับรองการทำงาน",
  hint: "รับรองว่าบุคคลปฏิบัติงานจริง",
  subject: ["รับรองการปฏิบัติงานของ", S("person")],
  recipient: "person",
  slots: [
    s("person", "รับรองใคร (ชื่อ-นามสกุล)", "ชื่อผู้ได้รับการรับรอง", "นายสมชาย ตัวอย่าง"),
    s("position", "ตำแหน่ง", "ตำแหน่ง", "เจ้าพนักงานธุรการ"),
    s("since", "ปฏิบัติงานตั้งแต่เมื่อไร", "วันที่เริ่มงาน", "1 มกราคม 2566"),
    s("usage", "ออกให้เพื่อใช้ทำอะไร", "วัตถุประสงค์", "ประกอบการขอสินเชื่อ"),
  ],
  paragraphs: [
    ["หนังสือรับรองฉบับนี้ให้ไว้เพื่อรับรองว่า ", S("person"), " ปฏิบัติงานในตำแหน่ง ", S("position"), " ตั้งแต่วันที่ ", S("since"), " จนถึงปัจจุบัน"],
    ["ให้ไว้เพื่อ", S("usage")],
    ["ให้ไว้ ณ วันที่ ", { head: "วันที่" }],
  ],
};

const ORDER: Purpose = {
  id: "แต่งตั้งคณะทำงาน",
  title: "แต่งตั้งคณะทำงาน",
  hint: "สั่งตั้งคณะหรือมอบหมายหน้าที่",
  subject: ["แต่งตั้ง", S("committee")],
  recipient: "committee",
  slots: [
    s("reason", "ออกคำสั่งเพราะเหตุใด", "เหตุที่ออกคำสั่ง", "เพื่อให้การจัดงานเป็นไปด้วยความเรียบร้อย"),
    s("committee", "ตั้งคณะอะไร", "ชื่อคณะ", "คณะทำงานจัดสัมมนาเชิงปฏิบัติการ"),
    s("members", "ใครบ้าง ทำหน้าที่อะไร", "รายชื่อและหน้าที่", "นายสมชาย ตัวอย่าง ประธาน นางสมหญิง ตัวอย่าง เลขานุการ"),
    s("from", "มีผลตั้งแต่เมื่อไร", "วันที่มีผล", "1 ธันวาคม 2569"),
  ],
  paragraphs: [
    ["ด้วย", S("reason"), " จึงมีคำสั่งดังต่อไปนี้"],
    ["ข้อ ๑ ให้แต่งตั้ง", S("committee"), " ประกอบด้วย ", S("members")],
    ["ทั้งนี้ ตั้งแต่วันที่ ", S("from"), " เป็นต้นไป"],
    ["สั่ง ณ วันที่ ", { head: "วันที่" }],
  ],
};

const ANNOUNCE: Purpose = {
  id: "ประกาศทั่วไป",
  title: "ประกาศทั่วไป",
  hint: "แจ้งให้ทราบโดยทั่วกัน",
  subject: [S("topic")],
  recipient: "topic",
  slots: [
    s("topic", "ประกาศเรื่องอะไร", "เรื่องที่ประกาศ", "ปิดทำการเนื่องในวันหยุดราชการ"),
    s("reason", "เหตุที่ประกาศ", "เหตุที่ประกาศ", "เนื่องในวันหยุดราชการตามประกาศของทางราชการ"),
    s("content", "ข้อความที่ต้องการประกาศ", "ข้อความประกาศ", "สำนักงานจะปิดทำการ และเปิดทำการตามปกติในวันทำการถัดไป"),
    s("when", "มีผลเมื่อไร", "วันที่มีผล", "10 ธันวาคม 2569"),
  ],
  paragraphs: [
    ["ด้วย", S("reason"), " จึงขอประกาศให้ทราบว่า ", S("content"), " ตั้งแต่วันที่ ", S("when")],
    ["จึงประกาศมาเพื่อทราบโดยทั่วกัน"],
    ["ประกาศ ณ วันที่ ", { head: "วันที่" }],
  ],
};

const LETTER_PURPOSES = [INVITE, APPROVE, COOPERATE, THANKS, DECLINE, FOLLOW, COMPLAIN, SEND];
const PURPOSES: Record<string, Purpose[]> = {
  หนังสือภายนอก: LETTER_PURPOSES,
  บันทึกข้อความ: [APPROVE, INVITE, SEND, FOLLOW],
  คำร้อง: [COMPLAIN, HELP],
  หนังสือรับรอง: [CERTIFY],
  คำสั่ง: [ORDER],
  ประกาศ: [ANNOUNCE],
};

/* ---------- Header and footer fields ---------- */
function metaFieldsFor(type: string): MetaField[] {
  const def = DOC_TYPES[type];
  const f: MetaField[] = [];
  const hk = def?.headKeys ?? [];
  if (hk.includes("ที่")) f.push({ key: "ที่", group: "head", label: "ที่", hint: "เลขที่หนังสือ เช่น บต 001/2569" });
  if (hk.includes("เขียนที่")) f.push({ key: "เขียนที่", group: "head", label: "เขียนที่", hint: "สถานที่เขียน เช่น ตำบลตัวอย่าง อำเภอตัวอย่าง" });
  if (hk.includes("ส่วนราชการ")) f.push({ key: "ส่วนราชการ", group: "head", label: "ส่วนราชการ", hint: "ชื่อหน่วยงานผู้ออกหนังสือ" });
  f.push({ key: "วันที่", group: "head", label: "วันที่", hint: "เช่น 5 ธันวาคม 2569" });
  f.push({ key: "ลงชื่อ", group: "foot", label: "ผู้ลงชื่อ", hint: "ชื่อ-นามสกุลผู้ลงนาม" });
  f.push({ key: "ตำแหน่ง", group: "foot", label: "ตำแหน่ง", hint: "เช่น กรรมการผู้จัดการ" });
  if (def?.footKeys.includes("โทร")) f.push({ key: "โทร", group: "foot", label: "โทร", hint: "เบอร์ติดต่อ (ไม่บังคับ)", optional: true });
  if (def?.footKeys.includes("คำลงท้าย")) f.push({ key: "คำลงท้าย", group: "foot", label: "คำลงท้าย", hint: "", hidden: true });
  return f;
}

/** Defaults for header/footer fields; today's date in พ.ศ. */
export function defaultMeta(type: string): Record<string, string> {
  const m: Record<string, string> = { วันที่: todayThai() };
  if (DOC_TYPES[type]?.footKeys.includes("คำลงท้าย")) m["คำลงท้าย"] = "ขอแสดงความนับถือ";
  if (type === "คำร้อง") m["ตำแหน่ง"] = "ผู้ร้อง";
  if (isCourt(type)) m["ตำแหน่ง"] = type === "คำร้องคดีแรงงาน" ? "ผู้ร้อง" : "โจทก์";
  return m;
}

function letterTemplate(type: string, p: Purpose): Template {
  const metaFields = metaFieldsFor(type);
  const def = DOC_TYPES[type];
  const t: Template = {
    type,
    id: p.id,
    title: p.title,
    hint: p.hint,
    isCourt: false,
    sections: [{ title: "ข้อเท็จจริง", slots: p.slots }],
    sentence: p.paragraphs,
    metaFields,
    assemble(i) {
      const sl = slotMap(t);
      const body = p.paragraphs.map((para) => renderParts(para, i, sl));
      const head: Record<string, string> = {};
      for (const f of metaFields.filter((m) => m.group === "head")) head[f.key] = val(i.meta, f.key);
      const subjectOverride = val(i.meta, "เรื่อง");
      if (def.headKeys.includes("เรื่อง")) head["เรื่อง"] = subjectOverride || renderParts(p.subject, i, sl);
      if (def.headKeys.includes("เรียน")) head["เรียน"] = val(i.values, p.recipient);
      if (p.attach && def.headKeys.includes("สิ่งที่ส่งมาด้วย") && p.attach.needs.every((k) => val(i.values, k))) {
        head["สิ่งที่ส่งมาด้วย"] = renderParts(p.attach.parts, i, sl);
      }
      const foot: Record<string, string> = {};
      if (def.footKeys.includes("คำลงท้าย")) foot["คำลงท้าย"] = val(i.meta, "คำลงท้าย");
      const name = val(i.meta, "ลงชื่อ");
      foot["ลงชื่อ"] = name ? `(${name})` : "";
      foot["ตำแหน่ง"] = val(i.meta, "ตำแหน่ง");
      if (val(i.meta, "โทร")) foot["โทร"] = val(i.meta, "โทร");
      return { head, body, foot };
    },
  };
  return t;
}

/* ---------- Labour court (ศาลแรงงาน) ---------- */
const COURT_SLOT = s("court", "ยื่นต่อศาลแรงงานไหน (ภาค หรือจังหวัด)", "ศาลที่ยื่น", "ศาลแรงงานกลาง");
const PLAINTIFF = s("pName", "ชื่อ-นามสกุลผู้ฟ้อง (โจทก์)", "ชื่อโจทก์", "นายสมชาย ตัวอย่าง");
const DEFENDANT = s("dName", "ชื่อนายจ้างหรือบริษัท (จำเลย)", "ชื่อจำเลย", "บริษัท ตัวอย่าง จำกัด");
const MY_AGE = s("pAge", "อายุ", "อายุ", "35");
const MY_ID = s("pId", "เลขประจำตัวประชาชน 13 หลัก", "เลขประจำตัวประชาชน", "1-2345-67890-12-3");
const MY_ADDR = s("pAddr", "ที่อยู่ปัจจุบัน", "ที่อยู่โจทก์", "บ้านเลขที่ 12 ถนนตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร");
const MY_TEL = s("pTel", "โทรศัพท์", "โทรศัพท์", "081-234-5678");
const DEF_ADDR = s("dAddr", "ที่ตั้งสถานประกอบการ", "ที่อยู่จำเลย", "เลขที่ 99 ถนนตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร");

const EVENTS: ListDef = {
  key: "events",
  title: "ข้อเท็จจริงตามลำดับเวลา",
  addLabel: "เพิ่มรายการตามลำดับเวลา",
  sortByDate: true,
  cols: [
    { key: "date", label: "วันที่", hint: "", date: true },
    { key: "event", label: "เกิดอะไรขึ้น", hint: "เกิดอะไรขึ้น เช่น ลาออก เลิกจ้าง ทวงถาม" },
  ],
};
const CLAIMS: ListDef = {
  key: "claims",
  title: "ค่าเสียหาย / คำขอ",
  addLabel: "เพิ่มรายการ",
  cols: [
    { key: "item", label: "รายการ", hint: "ประเภท เช่น ค่าจ้างค้างจ่าย ค่าชดเชย" },
    { key: "amount", label: "จำนวนเงิน", hint: "เช่น 45,000 บาท" },
  ],
};
const WITNESS: ListDef = {
  key: "people",
  title: "พยานบุคคล",
  addLabel: "เพิ่มพยานบุคคล",
  cols: [
    { key: "name", label: "ชื่อพยาน", hint: "ชื่อ-นามสกุล" },
    { key: "issue", label: "นำสืบเรื่อง", hint: "ประเด็นที่นำสืบ" },
  ],
};
const DOCS: ListDef = {
  key: "docs",
  title: "พยานเอกสาร",
  addLabel: "เพิ่มพยานเอกสาร",
  cols: [
    { key: "name", label: "เอกสาร", hint: "เช่น สัญญาจ้าง สลิปเงินเดือน" },
    { key: "issue", label: "นำสืบเรื่อง", hint: "ประเด็นที่นำสืบ" },
  ],
};

const cell = (r: Row, k: string, short: string) => (r[k] ?? "").trim() || blank(short);
const hasAny = (r: Row) => Object.values(r).some((v) => (v ?? "").trim());
/** Rows with something in them; when none, one empty row so a blank line still shows. */
const liveRows = (rows: Row[] | undefined): Row[] => {
  const live = (rows ?? []).filter(hasAny);
  return live.length ? live : [{}];
};
/** Date order; rows without a date keep their place after the dated ones. */
export function sortByDate(rows: Row[]): Row[] {
  const dated = rows.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? "")).sort((a, b) => a.date.localeCompare(b.date));
  const undated = rows.filter((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ""));
  return [...dated, ...undated];
}

function courtBase(i: Input, sl: Record<string, Slot>, kind: "ฟ้อง" | "พยาน" | "ร้อง"): Assembled {
  const v = (k: string) => val(i.values, k);
  const head: Record<string, string> = {
    ศาล: v("court") || blank(sl.court.short),
    คดีหมายเลขดำที่: val(i.meta, "คดีหมายเลขดำที่"),
    วันที่: val(i.meta, "วันที่"),
    โจทก์: v("pName"),
    จำเลย: v("dName"),
  };
  const name = kind === "ร้อง" ? v("requester") : v("pName");
  const foot = { ลงชื่อ: name ? `(${name})` : "", ตำแหน่ง: val(i.meta, "ตำแหน่ง") };
  return { head, body: [], foot };
}

function courtMeta(): MetaField[] {
  return [
    { key: "คดีหมายเลขดำที่", group: "head", label: "คดีหมายเลขดำที่", hint: "เช่น ล1234/2569 · ถ้ายังไม่มีให้กดข้าม" },
    { key: "วันที่", group: "head", label: "วันที่", hint: "เช่น 5 ธันวาคม 2569" },
  ];
}

const COURT_SUE: Template = (() => {
  const sections: Section[] = [
    { title: "ศาลที่ยื่น", slots: [COURT_SLOT] },
    { title: "ผู้ฟ้อง (โจทก์)", slots: [PLAINTIFF, MY_AGE, MY_ID, MY_ADDR, MY_TEL] },
    { title: "นายจ้าง (จำเลย)", slots: [DEFENDANT, DEF_ADDR] },
    {
      title: "การจ้างงาน",
      slots: [
        s("start", "วันที่เริ่มงาน", "วันที่เริ่มงาน", "1 มกราคม 2566"),
        s("position", "ตำแหน่ง", "ตำแหน่ง", "พนักงานขาย"),
        s("wage", "อัตราค่าจ้างและงวดที่จ่าย", "อัตราค่าจ้าง", "เดือนละ 15,000 บาท จ่ายทุกสิ้นเดือน"),
      ],
    },
    { title: EVENTS.title, slots: [], list: EVENTS },
    { title: CLAIMS.title, slots: [], list: CLAIMS },
  ];
  const t: Template = {
    type: "คำฟ้องคดีแรงงาน",
    id: "คำฟ้องคดีแรงงาน",
    title: "คำฟ้องคดีแรงงาน",
    hint: "ลูกจ้างฟ้องนายจ้าง เช่น ค่าจ้างค้างจ่าย ค่าชดเชย",
    isCourt: true,
    sections,
    metaFields: courtMeta(),
    assemble(i) {
      const sl = slotMap(t);
      const v = (k: string) => val(i.values, k) || blank(sl[k].short);
      const out = courtBase(i, sl, "ฟ้อง");
      out.head["ผู้ฟ้อง"] = `ข้าพเจ้า ${v("pName")} อายุ ${v("pAge")} ปี เลขประจำตัวประชาชน ${v("pId")} อยู่บ้านเลขที่ ${v("pAddr")} โทรศัพท์ ${v("pTel")}`;
      out.head["ขอยื่นฟ้อง"] = `${v("dName")} ตั้งอยู่ที่ ${v("dAddr")} มีข้อความตามที่จะกล่าวต่อไปนี้`;
      const body: string[] = [];
      let n = 1;
      body.push(`ข้อ ${thaiNum(n++)}. จำเลยเป็นนายจ้างของโจทก์ โจทก์เริ่มทำงานกับจำเลยเมื่อวันที่ ${v("start")} ตำแหน่ง ${v("position")} ได้รับค่าจ้าง${v("wage")}`);
      for (const r of sortByDate(liveRows(i.lists.events))) {
        const d = isoToThai(r.date ?? "") || blank("วันที่");
        body.push(`ข้อ ${thaiNum(n++)}. เมื่อวันที่ ${d} ${cell(r, "event", "เหตุการณ์")}`);
      }
      body.push("โจทก์ไม่มีหนทางอื่นใดที่จะบังคับจำเลยได้ จึงต้องนำคดีมาฟ้องต่อศาลเพื่อขอบารมีศาลเป็นที่พึ่ง ควรมิควรแล้วแต่จะโปรด");
      body.push("คำขอท้ายฟ้อง");
      const claims = liveRows(i.lists.claims);
      body.push(
        ["ขอให้ศาลพิพากษาบังคับจำเลยชำระเงินแก่โจทก์ ดังนี้", ...claims.map((r, k) => `(${thaiNum(k + 1)}) ${cell(r, "item", "รายการ")} จำนวน ${cell(r, "amount", "จำนวนเงิน")}`)].join("\n"),
      );
      out.body = body;
      return out;
    },
  };
  return t;
})();

const COURT_WITNESS: Template = (() => {
  const sections: Section[] = [
    { title: "ศาลและคู่ความ", slots: [COURT_SLOT, PLAINTIFF, DEFENDANT] },
    { title: WITNESS.title, slots: [], list: WITNESS },
    { title: DOCS.title, slots: [], list: DOCS },
  ];
  const t: Template = {
    type: "บัญชีพยาน",
    id: "บัญชีพยาน",
    title: "บัญชีระบุพยาน",
    hint: "รายการพยานบุคคลและพยานเอกสาร",
    isCourt: true,
    sections,
    metaFields: courtMeta(),
    assemble(i) {
      const sl = slotMap(t);
      const out = courtBase(i, sl, "พยาน");
      const lines = (rows: Row[] | undefined, nameShort: string) =>
        liveRows(rows)
          .map((r, k) => `${thaiNum(k + 1)}. ${cell(r, "name", nameShort)} เพื่อนำสืบ${cell(r, "issue", "ประเด็นที่นำสืบ")}`)
          .join("\n");
      out.body = ["โจทก์ขอยื่นบัญชีระบุพยานต่อศาล ดังต่อไปนี้", "รายการพยานบุคคล", lines(i.lists.people, "ชื่อพยาน"), "รายการพยานเอกสาร", lines(i.lists.docs, "ชื่อเอกสาร")];
      return out;
    },
  };
  return t;
})();

const COURT_MOTION: Template = (() => {
  const sections: Section[] = [
    { title: "ศาลและคู่ความ", slots: [COURT_SLOT, PLAINTIFF, DEFENDANT, s("requester", "ผู้ร้องคือใคร (ชื่อ-นามสกุล)", "ชื่อผู้ร้อง", "นายสมชาย ตัวอย่าง")] },
    {
      title: "เรื่องที่ร้อง",
      slots: [
        s("subject", "ร้องเรื่องอะไร (เรื่อง)", "เรื่องที่ร้อง", "ขอถอนฟ้อง"),
        s("reason", "เหตุที่ต้องร้อง", "เหตุที่ต้องร้อง", "ได้ตกลงกับจำเลยและจำเลยได้ชำระเงินครบถ้วนแล้ว"),
        s("request", "ขอให้ศาลทำอะไร", "สิ่งที่ขอให้ศาลทำ", "อนุญาตให้ถอนฟ้องและจำหน่ายคดีออกจากสารบบความ"),
      ],
    },
  ];
  const t: Template = {
    type: "คำร้องคดีแรงงาน",
    id: "คำร้องคดีแรงงาน",
    title: "คำร้องในคดีแรงงาน",
    hint: "เช่น ขอถอนฟ้อง ขอคัดถ่ายเอกสาร ขอยื่นพยานเพิ่ม",
    isCourt: true,
    sections,
    metaFields: courtMeta(),
    assemble(i) {
      const sl = slotMap(t);
      const v = (k: string) => val(i.values, k) || blank(sl[k].short);
      const out = courtBase(i, sl, "ร้อง");
      out.head["เรื่อง"] = val(i.values, "subject");
      out.head["เรียน"] = val(i.values, "court");
      out.body = [`ข้าพเจ้า ${v("requester")} ขอเรียนต่อศาลว่า ${v("reason")}`, `ข้าพเจ้าจึงขอศาลได้โปรด${v("request")}`];
      return out;
    },
  };
  return t;
})();

const COURT_TEMPLATES: Record<string, Template> = {
  คำฟ้องคดีแรงงาน: COURT_SUE,
  บัญชีพยาน: COURT_WITNESS,
  คำร้องคดีแรงงาน: COURT_MOTION,
};

/* ---------- Public API ---------- */
/** Purposes (or, for ศาลแรงงาน, the three document types) offered after choosing a type tab. */
export function purposesOf(type: string): { id: string; title: string; hint: string }[] {
  if (isCourt(type)) return Object.values(COURT_TEMPLATES).map((t) => ({ id: t.id, title: t.title, hint: t.hint }));
  return (PURPOSES[type] ?? []).map((p) => ({ id: p.id, title: p.title, hint: p.hint }));
}

const cache = new Map<string, Template>();
export function getTemplate(type: string, purposeId: string): Template {
  const key = `${type}/${purposeId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let t: Template | undefined;
  if (isCourt(type)) t = COURT_TEMPLATES[type];
  else {
    const p = PURPOSES[type]?.find((x) => x.id === purposeId) ?? PURPOSES[type]?.[0];
    if (p) t = letterTemplate(type, p);
  }
  if (!t) throw new Error(`no template for ${key}`);
  cache.set(key, t);
  return t;
}

/** Every (type, purpose) pair, for tests. */
export const allTemplates = (): Template[] =>
  Object.keys(DOC_TYPES).flatMap((type) => (isCourt(type) ? [getTemplate(type, type)] : (PURPOSES[type] ?? []).map((p) => getTemplate(type, p.id))));

export function assembleDoc(t: Template, i: Input): DocData {
  const a = t.assemble(i);
  return { type: t.type, head: a.head, body: a.body, foot: a.foot };
}

/* ---------- Progress ---------- */
export interface Progress {
  done: number;
  total: number;
  /** per section: [done, total] */
  sections: [number, number][];
}
const rowFilled = (t: Template, list: ListDef, r: Row) => list.cols.every((c) => (r[c.key] ?? "").trim());
export function progress(t: Template, i: Input): Progress {
  const sections = t.sections.map((sec): [number, number] => {
    if (sec.list) {
      const rows = (i.lists[sec.list.key] ?? []).filter(hasAny);
      const filled = rows.filter((r) => rowFilled(t, sec.list!, r)).length;
      // at least one row is expected; an unfinished row counts as one missing unit
      const total = Math.max(1, rows.length);
      return [filled, total];
    }
    const filled = sec.slots.filter((x) => val(i.values, x.key)).length;
    return [filled, sec.slots.length];
  });
  const meta = t.metaFields.filter((f) => !f.optional && !f.hidden);
  const metaDone = meta.filter((f) => val(i.meta, f.key)).length;
  const done = sections.reduce((a, x) => a + x[0], 0) + metaDone;
  const total = sections.reduce((a, x) => a + x[1], 0) + meta.length;
  return { done, total, sections };
}

/** Sentence slots only (used by AI helpers). */
export const slotsOf = (t: Template) => allSlots(t);
