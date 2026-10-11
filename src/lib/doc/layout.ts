import { DOC_TYPES, type DocData } from "./types";

/**
 * Layout profiles. These are agency GUIDELINES (common practice), not regulation text.
 * Numbers for "common" come from a university's printing manual that follows สารบรรณ convention
 * (see docs/decisions/2026-10-10-0001-ratchakarn-this-v1/references.md). Edit here to correct them.
 */
export interface LayoutProfile {
  id: string;
  label: string;
  note: string;
  marginsCm: { top: number; bottom: number; left: number; right: number };
  fontFamily: string;
  fontPt: number;
  indentCm: number;
  garudaExternalCm: number;
  garudaMemoCm: number;
  memoTitlePt: number;
  memoLabelPt: number;
  speedPt: number;
  /** left start of the เรื่อง/คำลงท้าย axis, measured from the left margin (page centre ≈ half of text width) */
  centreAxisCm: number;
  signatureRegionCm: number;
  signatureBlankLines: number;
}

export const PROFILES: Record<string, LayoutProfile> = {
  common: {
    id: "common",
    label: "แนวปฏิบัติที่นิยม (ตามคู่มือพิมพ์หนังสือราชการ)",
    note: "ขอบ ซ้าย 3 / ขวา 2 / บน 1.5 / ล่าง 2 ซม. ตัวอักษร TH Sarabun New 16 พอยต์ ตราครุฑ 3 ซม. (บันทึกข้อความ 1.5 ซม.)",
    marginsCm: { top: 1.5, bottom: 2, left: 3, right: 2 },
    fontFamily: "TH Sarabun New",
    fontPt: 16,
    indentCm: 2.5,
    garudaExternalCm: 3,
    garudaMemoCm: 1.5,
    memoTitlePt: 29,
    memoLabelPt: 20,
    speedPt: 32,
    centreAxisCm: 8,
    signatureRegionCm: 3.5,
    signatureBlankLines: 3,
  },
  dopa: {
    id: "dopa",
    label: "แบบกรมการปกครอง (ขอบบน 2 ซม. ย่อหน้า 1.25 ซม.)",
    note: "TH SarabunIT๙ 16 พอยต์ ขอบ บน 2 / ซ้าย 3 / ขวา 2 / ล่าง 2 ซม. ย่อหน้า 1.25 ซม.",
    marginsCm: { top: 2, bottom: 2, left: 3, right: 2 },
    fontFamily: "TH SarabunIT๙",
    fontPt: 16,
    indentCm: 1.25,
    garudaExternalCm: 3,
    garudaMemoCm: 1.5,
    memoTitlePt: 29,
    memoLabelPt: 20,
    speedPt: 32,
    centreAxisCm: 8,
    signatureRegionCm: 3.5,
    signatureBlankLines: 3,
  },
};

export interface RenderOptions {
  profile: LayoutProfile;
  thaiDigits: boolean;
  /** data URL of an image the user supplied for the ครุฑ slot (never bundled) */
  garudaImage?: { dataUrl: string; widthPx: number; heightPx: number } | null;
  showSlotHint: boolean;
}

export interface Run {
  text: string;
  bold?: boolean;
  sizePt?: number;
  color?: string;
  underline?: boolean;
}

export type Block =
  | { k: "garuda"; heightCm: number; align: "center" | "left" }
  | {
      k: "p";
      runs: Run[];
      align?: "left" | "center" | "right" | "justify";
      leftCm?: number;
      firstLineCm?: number;
      beforePt?: number;
      afterPt?: number;
      exactPt?: number;
      borderBottom?: boolean;
      keepNext?: boolean;
    }
  | { k: "cols"; leftCm: number; left: Block[]; right: Block[] }
  | { k: "gap"; pt: number }
  | { k: "rule" };

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
export const toThaiDigits = (s: string) => s.replace(/[0-9]/g, (d) => THAI_DIGITS[+d]);

const HEADING_LINES = new Set(["คำขอท้ายฟ้อง", "คำขอท้ายคำร้อง", "คำขอ", "รายการพยานบุคคล", "รายการพยานเอกสาร", "พยานบุคคล", "พยานเอกสาร"]);

function txt(t: string, o: Omit<Run, "text"> = {}): Run[] {
  return [{ text: t, ...o }];
}

function bodyBlocks(d: DocData, pf: LayoutProfile): Block[] {
  const out: Block[] = [];
  for (const para of d.body) {
    const single = para.trim();
    if (HEADING_LINES.has(single)) {
      out.push({ k: "p", runs: txt(single, { bold: true }), align: "center", beforePt: 12, afterPt: 6, keepNext: true });
      continue;
    }
    // each line is its own paragraph so numbered items/lists survive; first line carries the indent
    for (const line of para.split("\n")) {
      const l = line.trim();
      if (!l) continue;
      out.push({ k: "p", runs: txt(l), align: "justify", firstLineCm: pf.indentCm, beforePt: 0 });
    }
  }
  return out;
}

function signatureBlocks(d: DocData, pf: LayoutProfile, opts: { closing?: boolean; blankLines?: number }): Block[] {
  const out: Block[] = [];
  const region = pf.signatureRegionCm;
  const closing = (d.foot["คำลงท้าย"] ?? "").trim();
  if (opts.closing && closing) {
    out.push({ k: "gap", pt: 12 });
    out.push({ k: "p", runs: txt(closing), align: "center", leftCm: region, keepNext: true });
  }
  out.push({ k: "gap", pt: (opts.blankLines ?? pf.signatureBlankLines) * 20 });
  const name = (d.foot["ลงชื่อ"] ?? "").trim();
  const pos = (d.foot["ตำแหน่ง"] ?? "").trim();
  if (name) out.push({ k: "p", runs: txt(name), align: "center", leftCm: region, keepNext: true });
  for (const line of pos.split(/\s*\|\s*/).filter(Boolean)) {
    out.push({ k: "p", runs: txt(line), align: "center", leftCm: region });
  }
  return out;
}

function ownerBlocks(d: DocData): Block[] {
  const owner = (d.foot["ส่วนราชการเจ้าของเรื่อง"] ?? "").trim();
  const tel = (d.foot["โทร"] ?? "").trim();
  const out: Block[] = [];
  if (!owner && !tel) return out;
  out.push({ k: "gap", pt: 16 });
  for (const line of owner.split(/\s*\|\s*/).filter(Boolean)) out.push({ k: "p", runs: txt(line), align: "left" });
  if (tel) out.push({ k: "p", runs: txt(/^โทร/.test(tel) ? tel : `โทร. ${tel}`), align: "left" });
  return out;
}

const labelLine = (label: string, value: string, before = 6): Block => ({
  k: "p",
  runs: [{ text: `${label} `, bold: false }, { text: value }],
  align: "left",
  beforePt: before,
  firstLineCm: 0,
});

function letter(d: DocData, pf: LayoutProfile): Block[] {
  const h = d.head;
  const out: Block[] = [];
  if (h["ชั้นความเร็ว"]?.trim()) {
    out.push({ k: "p", runs: txt(h["ชั้นความเร็ว"].trim(), { bold: true, sizePt: pf.speedPt, color: "C00000" }), align: "left" });
  }
  out.push({ k: "garuda", heightCm: pf.garudaExternalCm, align: "center" });
  out.push({
    k: "cols",
    leftCm: pf.centreAxisCm,
    left: [{ k: "p", runs: txt(`ที่ ${h["ที่"] ?? "[ระบุ]"}`), align: "left" }],
    right: (h["ส่วนราชการ"] ?? "[ระบุชื่อและที่อยู่ส่วนราชการ]")
      .split(/\s*\|\s*/)
      .filter(Boolean)
      .map<Block>((l) => ({ k: "p", runs: txt(l), align: "left" })),
  });
  out.push({ k: "p", runs: txt(h["วันที่"] ?? "[ระบุวันที่]"), align: "left", leftCm: pf.centreAxisCm });
  out.push(labelLine("เรื่อง", h["เรื่อง"] ?? "[ระบุ]", 6));
  out.push(labelLine("เรียน", h["เรียน"] ?? "[ระบุ]", 6));
  if (h["อ้างถึง"]?.trim()) out.push(labelLine("อ้างถึง", h["อ้างถึง"], 6));
  if (h["สิ่งที่ส่งมาด้วย"]?.trim()) out.push(labelLine("สิ่งที่ส่งมาด้วย", h["สิ่งที่ส่งมาด้วย"], 6));
  out.push({ k: "gap", pt: 8 });
  out.push(...bodyBlocks(d, pf));
  out.push(...signatureBlocks(d, pf, { closing: true, blankLines: 2 }));
  out.push(...ownerBlocks(d));
  return out;
}

function memo(d: DocData, pf: LayoutProfile): Block[] {
  const h = d.head;
  const lab = pf.memoLabelPt;
  const out: Block[] = [];
  if (h["ชั้นความเร็ว"]?.trim()) {
    out.push({ k: "p", runs: txt(h["ชั้นความเร็ว"].trim(), { bold: true, sizePt: pf.speedPt, color: "C00000" }), align: "left" });
  }
  out.push({
    k: "cols",
    leftCm: pf.garudaMemoCm + 1,
    left: [{ k: "garuda", heightCm: pf.garudaMemoCm, align: "left" }],
    right: [
      {
        k: "p",
        runs: txt("บันทึกข้อความ", { bold: true, sizePt: pf.memoTitlePt }),
        align: "center",
        exactPt: 35,
        leftCm: 0,
      },
    ],
  });
  out.push({
    k: "p",
    runs: [{ text: "ส่วนราชการ ", bold: true, sizePt: lab }, { text: h["ส่วนราชการ"] ?? "[ระบุส่วนงาน]" }],
    borderBottom: true,
    align: "left",
    beforePt: 4,
  });
  out.push({
    k: "p",
    runs: [
      { text: "ที่ ", bold: true, sizePt: lab },
      { text: `${h["ที่"] ?? "[ระบุ]"}          ` },
      { text: "วันที่ ", bold: true, sizePt: lab },
      { text: h["วันที่"] ?? "[ระบุวันที่]" },
    ],
    borderBottom: true,
    align: "left",
  });
  out.push({
    k: "p",
    runs: [{ text: "เรื่อง ", bold: true, sizePt: lab }, { text: h["เรื่อง"] ?? "[ระบุ]" }],
    borderBottom: true,
    align: "left",
  });
  out.push({ k: "p", runs: [{ text: "เรียน " }, { text: h["เรียน"] ?? "[ระบุ]" }], align: "left", beforePt: 12 });
  out.push({ k: "gap", pt: 6 });
  out.push(...bodyBlocks(d, pf));
  out.push(...signatureBlocks(d, { ...pf, signatureRegionCm: pf.centreAxisCm }, { blankLines: 4 }));
  return out;
}

function petition(d: DocData, pf: LayoutProfile): Block[] {
  const h = d.head;
  const out: Block[] = [];
  out.push({ k: "p", runs: txt(`เขียนที่ ${h["เขียนที่"] ?? "[ระบุ]"}`), align: "right" });
  out.push({ k: "p", runs: txt(h["วันที่"] ?? "[ระบุวันที่]"), align: "right" });
  out.push(labelLine("เรื่อง", h["เรื่อง"] ?? "[ระบุ]", 10));
  out.push(labelLine("เรียน", h["เรียน"] ?? "[ระบุ]", 6));
  if (h["อ้างถึง"]?.trim()) out.push(labelLine("อ้างถึง", h["อ้างถึง"], 6));
  if (h["สิ่งที่ส่งมาด้วย"]?.trim()) out.push(labelLine("สิ่งที่ส่งมาด้วย", h["สิ่งที่ส่งมาด้วย"], 6));
  out.push({ k: "gap", pt: 8 });
  out.push(...bodyBlocks(d, pf));
  out.push(...signatureBlocks(d, pf, { closing: true }));
  const tel = (d.foot["โทร"] ?? "").trim();
  if (tel) out.push({ k: "p", runs: txt(/^โทร/.test(tel) ? tel : `โทร. ${tel}`), align: "left", beforePt: 12 });
  return out;
}

function orderLike(d: DocData, pf: LayoutProfile): Block[] {
  const h = d.head;
  const t = d.type;
  const out: Block[] = [{ k: "garuda", heightCm: pf.garudaExternalCm, align: "center" }];
  if (t === "หนังสือรับรอง") {
    out.push({ k: "p", runs: txt(`ที่ ${h["ที่"] ?? "[ระบุ]"}`), align: "left" });
    out.push({ k: "p", runs: txt("หนังสือรับรอง", { bold: true, sizePt: 20 }), align: "center", beforePt: 8, afterPt: 8 });
    if (h["ส่วนราชการ"]?.trim()) out.push({ k: "p", runs: txt(h["ส่วนราชการ"]), align: "center", afterPt: 8 });
  } else {
    const word = t === "คำสั่ง" ? "คำสั่ง" : "ประกาศ";
    out.push({ k: "p", runs: txt(`${word} ${h["ส่วนราชการ"] ?? "[ระบุหน่วยงาน]"}`, { bold: true, sizePt: 18 }), align: "center", beforePt: 4 });
    if (t === "คำสั่ง") out.push({ k: "p", runs: txt(`ที่ ${h["ที่"] ?? "[ระบุ]"}`), align: "center" });
    out.push({ k: "p", runs: txt(`เรื่อง ${h["เรื่อง"] ?? "[ระบุ]"}`, { bold: true }), align: "center", beforePt: 4 });
    out.push({ k: "rule" });
  }
  out.push({ k: "gap", pt: 12 });
  out.push(...bodyBlocks(d, pf));
  out.push({ k: "gap", pt: 12 });
  const date = h["วันที่"] ?? "[ระบุวันที่]";
  const closeWord = t === "คำสั่ง" ? "สั่ง ณ วันที่" : t === "ประกาศ" ? "ประกาศ ณ วันที่" : "ให้ไว้ ณ วันที่";
  out.push({ k: "p", runs: txt(`${closeWord} ${date}`), align: "left", leftCm: t === "คำสั่ง" ? 5 : pf.centreAxisCm });
  out.push(...signatureBlocks(d, pf, { blankLines: 3 }));
  return out;
}

function court(d: DocData, pf: LayoutProfile): Block[] {
  const h = d.head;
  const out: Block[] = [];
  const titles: Record<string, string> = {
    คำฟ้องคดีแรงงาน: "คำฟ้องคดีแรงงาน",
    บัญชีพยาน: "บัญชีระบุพยาน",
    คำร้องคดีแรงงาน: "คำร้อง",
  };
  if (d.type === "คำฟ้องคดีแรงงาน") out.push({ k: "p", runs: txt("(รง.๑)", { sizePt: 14 }), align: "left" });
  out.push({ k: "p", runs: txt(titles[d.type] ?? d.type, { bold: true, sizePt: 20 }), align: "center", beforePt: 4, afterPt: 8 });
  out.push({
    k: "p",
    runs: txt(`คดีหมายเลขดำที่ ${h["คดีหมายเลขดำที่"]?.trim() || "............./............"}`),
    align: "right",
  });
  out.push({ k: "p", runs: txt(h["ศาล"] ?? "ศาลแรงงาน[ระบุ]"), align: "center", beforePt: 6 });
  out.push({ k: "p", runs: txt(`วันที่ ${h["วันที่"] ?? "[ระบุวันที่]"}`), align: "right", afterPt: 8 });
  if (d.type === "คำร้องคดีแรงงาน") {
    out.push(labelLine("เรื่อง", h["เรื่อง"] ?? "[ระบุ]", 4));
    out.push(labelLine("เรียน", h["เรียน"] ?? h["ศาล"] ?? "[ระบุ]", 4));
  }
  const side = (name: string, role: string): Block => ({
    k: "cols",
    leftCm: 11,
    left: [{ k: "p", runs: txt(name || "[ระบุ]"), align: "left" }],
    right: [{ k: "p", runs: txt(role), align: "left" }],
  });
  out.push(side(h["โจทก์"] ?? "", "โจทก์"));
  out.push(side(h["จำเลย"] ?? "", "จำเลย"));
  if (h["ผู้ฟ้อง"]?.trim()) out.push({ k: "p", runs: txt(h["ผู้ฟ้อง"]), align: "justify", firstLineCm: pf.indentCm, beforePt: 10 });
  if (h["ขอยื่นฟ้อง"]?.trim()) out.push({ k: "p", runs: txt(`ขอยื่นฟ้อง ${h["ขอยื่นฟ้อง"]}`), align: "justify", firstLineCm: pf.indentCm });
  if (d.type === "คำฟ้องคดีแรงงาน")
    out.push({ k: "p", runs: txt("หมายเหตุ ข้าพเจ้าทราบกำหนดวันเวลานัดและคำสั่งศาลแล้ว", { sizePt: 14 }), align: "left", beforePt: 8 });
  out.push({ k: "gap", pt: 8 });
  out.push(...bodyBlocks(d, pf));
  out.push(...signatureBlocks(d, pf, { blankLines: 3 }));
  out.push({
    k: "p",
    runs: txt("ร่างเบื้องต้น ผู้ใช้ต้องตรวจทานและปรึกษาทนายความก่อนยื่นศาล", { sizePt: 12, color: "7F7F7F" }),
    align: "left",
    beforePt: 18,
  });
  return out;
}

const hasGarudaBlock = (blocks: Block[]): boolean =>
  blocks.some((b) => b.k === "garuda" || (b.k === "cols" && (hasGarudaBlock(b.left) || hasGarudaBlock(b.right))));

export function buildBlocks(d: DocData, opts: RenderOptions): Block[] {
  const def = DOC_TYPES[d.type];
  const pf = opts.profile;
  let blocks: Block[];
  switch (def?.family) {
    case "memo":
      blocks = memo(d, pf);
      break;
    case "petition":
      blocks = petition(d, pf);
      break;
    case "order":
    case "announce":
    case "cert":
      blocks = orderLike(d, pf);
      break;
    case "court":
      blocks = court(d, pf);
      break;
    default:
      blocks = letter(d, pf);
  }
  // Some families (petitions and court forms) do not normally reserve a Garuda
  // slot. When the user explicitly supplies and enables an image, add a real
  // header block so the shared export control works for every document type.
  if (opts.garudaImage && !hasGarudaBlock(blocks)) {
    blocks = [{ k: "garuda", heightCm: pf.garudaExternalCm, align: "center" }, ...blocks];
  }
  return opts.thaiDigits ? mapText(blocks, toThaiDigits) : blocks;
}

function mapText(blocks: Block[], f: (s: string) => string): Block[] {
  return blocks.map((b) => {
    if (b.k === "p") return { ...b, runs: b.runs.map((r) => ({ ...r, text: f(r.text) })) };
    if (b.k === "cols") return { ...b, left: mapText(b.left, f), right: mapText(b.right, f) };
    return b;
  });
}

export const SLOT_HINT = "(วางตราครุฑที่นี่)";
