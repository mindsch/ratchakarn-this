export interface DocData {
  type: string;
  head: Record<string, string>;
  body: string[];
  foot: Record<string, string>;
}

export type Family = "letter" | "memo" | "petition" | "order" | "announce" | "cert" | "court";

export interface DocTypeDef {
  label: string;
  family: Family;
  headKeys: string[];
  footKeys: string[];
  /** shown in the form, in this order */
  hints?: Record<string, string>;
}

const LETTER_HEAD = ["ชั้นความเร็ว", "ที่", "ส่วนราชการ", "วันที่", "เรื่อง", "เรียน", "อ้างถึง", "สิ่งที่ส่งมาด้วย"];
const LETTER_FOOT = ["คำลงท้าย", "ลงชื่อ", "ตำแหน่ง", "ส่วนราชการเจ้าของเรื่อง", "โทร"];
const COURT_HEAD = ["ศาล", "คดีหมายเลขดำที่", "วันที่", "โจทก์", "จำเลย", "ผู้ฟ้อง", "ขอยื่นฟ้อง"];
const COURT_FOOT = ["ลงชื่อ", "ตำแหน่ง"];

export const DOC_TYPES: Record<string, DocTypeDef> = {
  หนังสือภายนอก: { label: "หนังสือภายนอก", family: "letter", headKeys: LETTER_HEAD, footKeys: LETTER_FOOT },
  บันทึกข้อความ: {
    label: "บันทึกข้อความ",
    family: "memo",
    headKeys: ["ชั้นความเร็ว", "ส่วนราชการ", "ที่", "วันที่", "เรื่อง", "เรียน"],
    footKeys: ["ลงชื่อ", "ตำแหน่ง"],
  },
  คำร้อง: {
    label: "คำร้อง (ประชาชน)",
    family: "petition",
    headKeys: ["เขียนที่", "วันที่", "เรื่อง", "เรียน", "อ้างถึง", "สิ่งที่ส่งมาด้วย"],
    footKeys: ["คำลงท้าย", "ลงชื่อ", "ตำแหน่ง", "โทร"],
  },
  หนังสือรับรอง: {
    label: "หนังสือรับรอง",
    family: "cert",
    headKeys: ["ที่", "ส่วนราชการ", "วันที่"],
    footKeys: ["ลงชื่อ", "ตำแหน่ง"],
  },
  คำสั่ง: {
    label: "คำสั่ง",
    family: "order",
    headKeys: ["ส่วนราชการ", "ที่", "เรื่อง", "วันที่"],
    footKeys: ["ลงชื่อ", "ตำแหน่ง"],
  },
  ประกาศ: {
    label: "ประกาศ",
    family: "announce",
    headKeys: ["ส่วนราชการ", "เรื่อง", "วันที่"],
    footKeys: ["ลงชื่อ", "ตำแหน่ง"],
  },
  คำฟ้องคดีแรงงาน: { label: "คำฟ้องคดีแรงงาน (ศาลแรงงาน)", family: "court", headKeys: COURT_HEAD, footKeys: COURT_FOOT },
  บัญชีพยาน: { label: "บัญชีระบุพยาน (ศาลแรงงาน)", family: "court", headKeys: COURT_HEAD.filter((k) => k !== "ขอยื่นฟ้อง"), footKeys: COURT_FOOT },
  คำร้องคดีแรงงาน: {
    label: "คำร้องในคดีแรงงาน (ศาลแรงงาน)",
    family: "court",
    headKeys: ["ศาล", "คดีหมายเลขดำที่", "วันที่", "โจทก์", "จำเลย", "เรื่อง", "เรียน"],
    footKeys: COURT_FOOT,
  },
};

export const COURT_TYPES = ["คำฟ้องคดีแรงงาน", "บัญชีพยาน", "คำร้องคดีแรงงาน"];
export const isCourt = (type: string) => DOC_TYPES[type]?.family === "court";

export const DEFAULT_TYPE = "หนังสือภายนอก";
