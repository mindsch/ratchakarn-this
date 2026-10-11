// Deterministic blob -> fields sorter for จัดรูปแบบ. Code only, no AI. Never rewrites the user's words:
// every value is a verbatim slice of the blob (labels like "เรื่อง" / "เรียน" are stripped because the renderer adds them).
import type { DocState, FieldKey, FieldStatus, Span, Unplaced } from "../app";
import { parseDoc } from "./parse";
import { DEFAULT_TYPE, DOC_TYPES, type DocData } from "./types";

export interface SortResult {
  doc: DocData;
  status: Record<FieldKey, FieldStatus>;
  sources: Record<FieldKey, Span[]>;
  unplaced: Unplaced[];
}

/** Fields that may stay empty without counting as missing. */
export const OPTIONAL_KEYS = new Set(["ชั้นความเร็ว", "อ้างถึง", "สิ่งที่ส่งมาด้วย", "ส่วนราชการเจ้าของเรื่อง", "โทร", "คดีหมายเลขดำที่", "ผู้ฟ้อง", "ขอยื่นฟ้อง"]);
export const isOptionalField = (key: FieldKey) => key !== "body" && OPTIONAL_KEYS.has(key.replace(/^(head|foot):/, ""));

/** All field keys of a type in display order: head keys, body, foot keys. */
export function fieldKeys(type: string): FieldKey[] {
  const def = DOC_TYPES[type] ?? DOC_TYPES[DEFAULT_TYPE];
  return [...def.headKeys.map((k) => `head:${k}`), "body", ...def.footKeys.map((k) => `foot:${k}`)];
}

export const fieldLabel = (key: FieldKey) => (key === "body" ? "เนื้อหา" : key.replace(/^(head|foot):/, ""));

export function getField(doc: DocData, key: FieldKey): string {
  if (key === "body") return doc.body.join("\n\n");
  return (key.startsWith("head:") ? doc.head : doc.foot)[key.slice(5)] ?? "";
}

/** Returns a new DocData with one field replaced. Empty optional fields are dropped so they do not print as [ระบุ...]. */
export function setField(doc: DocData, key: FieldKey, value: string): DocData {
  if (key === "body") return { ...doc, body: value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) };
  const part = key.startsWith("head:") ? "head" : "foot";
  const next = { ...doc[part] };
  if (!value.trim() && isOptionalField(key)) delete next[key.slice(5)];
  else next[key.slice(5)] = value;
  return { ...doc, [part]: next };
}

/** status for every key of the doc's type, from its content */
export function computeStatus(doc: DocData, prev: Record<FieldKey, FieldStatus> = {}): Record<FieldKey, FieldStatus> {
  const out: Record<FieldKey, FieldStatus> = {};
  for (const k of fieldKeys(doc.type)) {
    if (prev[k] === "skipped" && !getField(doc, k).trim()) out[k] = "skipped";
    else out[k] = getField(doc, k).trim() ? "filled" : "empty";
  }
  return out;
}

/** blank required fields and doc.body; used for the "ขาด n ช่อง" status line */
export function missingKeys(doc: DocData, status: Record<FieldKey, FieldStatus>): FieldKey[] {
  return fieldKeys(doc.type).filter((k) => !isOptionalField(k) && (status[k] ?? "empty") !== "filled");
}

/** Doc with every required-but-empty field present as "" so Paper/export show [ระบุ...]. */
export function withRequiredSlots(doc: DocData): DocData {
  const def = DOC_TYPES[doc.type] ?? DOC_TYPES[DEFAULT_TYPE];
  const head = { ...doc.head };
  const foot = { ...doc.foot };
  for (const k of def.headKeys) if (!(k in head) && !OPTIONAL_KEYS.has(k)) head[k] = "";
  for (const k of def.footKeys) if (!(k in foot) && !OPTIONAL_KEYS.has(k)) foot[k] = "";
  // keep the type's key order
  const order = (keys: string[], src: Record<string, string>) => {
    const o: Record<string, string> = {};
    for (const k of keys) if (k in src) o[k] = src[k];
    for (const k of Object.keys(src)) if (!(k in o)) o[k] = src[k];
    return o;
  };
  return { ...doc, head: order(def.headKeys, head), foot: order(def.footKeys, foot) };
}

/* ---------------- detectors ---------------- */
const MONTH = "(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.)";
const DIGITS = "[0-9๐-๙]";
const DATE_BARE = new RegExp(`^${DIGITS}{1,2}\\s*${MONTH}\\s*(?:พ\\.ศ\\.\\s*)?${DIGITS}{4}$`);
const CLOSING = /^(ขอแสดงความนับถืออย่างยิ่ง|ขอแสดงความนับถือ|ขอแสดงความเคารพอย่างยิ่ง|ขอแสดงความเคารพ|ด้วยความเคารพอย่างยิ่ง|ด้วยความเคารพ|ขอแสดงความขอบคุณ|ขอแสดงความนับถือและขอบคุณ)$/;
const PAREN_NAME = /^[(（].{2,80}[)）]$/;
const POSITION = /ผู้อำนวยการ|หัวหน้า|นายก|ปลัด|ผู้ว่า|อธิบดี|เจ้าพนักงาน|นักวิชาการ|ประธาน|รอง|เลขานุการ|ผู้จัดการ|ครู|อาจารย์|นายอำเภอ|กำนัน|ผู้ใหญ่บ้าน|ผู้ร้อง|โจทก์|จำเลย|เจ้าหน้าที่|ผู้บริหาร|ผู้แทน/;
const PHONE = /^(โทร\.?|โทรศัพท์|โทรสาร|Tel\.?)\s*[:：]?\s*\S/i;
const OWNER_UNIT = /^(กลุ่มงาน|ฝ่าย|ส่วน|งาน|กอง|ศูนย์)\S*/;
const ORG = /^(สำนักงาน|สำนัก|กรม|กระทรวง|องค์การ|องค์กร|เทศบาล|อำเภอ|จังหวัด|โรงเรียน|มหาวิทยาลัย|วิทยาลัย|โรงพยาบาล|สถาบัน|ศาล|เขต|ถนน|ซอย|เลขที่|กรุงเทพ|[0-9๐-๙]+\s*(หมู่|ถนน|ซอย|ม\.))/;

function detectType(raw: string, labelled?: string): string {
  if (labelled && DOC_TYPES[labelled]) return labelled;
  const head = raw.slice(0, 400);
  if (/คำฟ้อง/.test(head) && /ศาล/.test(raw)) return "คำฟ้องคดีแรงงาน";
  if (/บัญชีระบุพยาน/.test(head)) return "บัญชีพยาน";
  if (/^\s*บันทึกข้อความ/m.test(head)) return "บันทึกข้อความ";
  if (/^\s*คำร้อง\s*$/m.test(head)) return "คำร้อง";
  return DEFAULT_TYPE;
}

interface Line {
  text: string;
  start: number;
  end: number;
}
function splitLines(raw: string): Line[] {
  const out: Line[] = [];
  let pos = 0;
  for (const seg of raw.split("\n")) {
    const text = seg.replace(/\r$/, "");
    const lead = text.length - text.trimStart().length;
    out.push({ text: text.trim(), start: pos + lead, end: pos + lead + text.trim().length });
    pos += seg.length + 1;
  }
  return out;
}

export const isTemplateBlob = (raw: string) => /===RATCHAKARN-DOC===/.test(raw);

/** forceType: the user picked the document type by hand (plain letters only). */
export function sortBlob(raw: string, forceType?: string): SortResult {
  const result = isTemplateBlob(raw) ? sortTemplate(raw) : sortPlain(raw, forceType);
  const doc = result.doc;
  return { ...result, doc: withoutEmptyOptional(doc), status: computeStatus(doc) };
}

function withoutEmptyOptional(doc: DocData): DocData {
  const prune = (src: Record<string, string>) => Object.fromEntries(Object.entries(src).filter(([k, v]) => v.trim() || !OPTIONAL_KEYS.has(k)));
  return { ...doc, head: prune(doc.head), foot: prune(doc.foot) };
}

/* ---- the ===RATCHAKARN-DOC=== template: parseDoc does the work, we locate the sources ---- */
function sortTemplate(raw: string): Omit<SortResult, "status"> & { status?: never } {
  const doc = parseDoc(raw);
  const def = DOC_TYPES[doc.type] ?? DOC_TYPES[DEFAULT_TYPE];
  const sources: Record<FieldKey, Span[]> = {};
  const unplaced: Unplaced[] = [];
  const locate = (key: FieldKey, v: string) => {
    const first = v.split(" | ")[0].trim();
    if (!first) return;
    const i = raw.indexOf(first);
    if (i >= 0) sources[key] = [{ start: i, end: i + first.length }];
  };
  const keep = (part: "head" | "foot", keys: string[]) => {
    for (const [k, v] of Object.entries(doc[part])) {
      if (keys.includes(k)) locate(`${part}:${k}`, v);
      else if (v.trim()) {
        const i = raw.indexOf(v.split(" | ")[0]);
        unplaced.push({ text: `${k}: ${v}`, span: { start: Math.max(i, 0), end: Math.max(i, 0) + v.length }, guess: undefined });
        delete doc[part][k];
      }
    }
  };
  keep("head", def.headKeys);
  keep("foot", def.footKeys);
  doc.body.forEach((p, n) => {
    const i = raw.indexOf(p.split("\n")[0]);
    if (i >= 0) (sources.body ??= []).push({ start: i, end: i + p.length });
    void n;
  });
  return { doc, sources, unplaced };
}

/* ---- plain letters ---- */
function sortPlain(raw: string, forceType?: string): Omit<SortResult, "status"> & { status?: never } {
  const text = raw.replace(/\r\n?/g, "\n");
  const lines = splitLines(text);
  const labelled = text.match(/^\s*ชนิด\s*[:：]\s*(.+)$/m)?.[1]?.trim();
  const type = forceType && DOC_TYPES[forceType] ? forceType : detectType(text, labelled);
  const def = DOC_TYPES[type];
  const doc: DocData = { type, head: {}, body: [], foot: {} };
  const sources: Record<FieldKey, Span[]> = {};
  const unplaced: Unplaced[] = [];

  const put = (key: FieldKey, value: string, l: Line, join = " | ") => {
    const part = key.startsWith("head:") ? doc.head : doc.foot;
    const k = key.slice(5);
    if (k in part && part[k].trim()) {
      // second value for a taken field: only ส่วนราชการ accumulates lines, anything else goes to the tray
      if (k === "ส่วนราชการ") part[k] += join + value;
      else {
        unplaced.push({ text: l.text, span: { start: l.start, end: l.end }, guess: key });
        return;
      }
    } else part[k] = value;
    (sources[key] ??= []).push({ start: l.start, end: l.end });
  };
  const hasKey = (key: FieldKey) => key.startsWith("head:") ? def.headKeys.includes(key.slice(5)) : def.footKeys.includes(key.slice(5));
  const taken = (key: FieldKey) => !!(key.startsWith("head:") ? doc.head : doc.foot)[key.slice(5)]?.trim();

  // longest labels first so "สิ่งที่ส่งมาด้วย" wins over "ที่"
  const labelKeys = [...def.headKeys.map((k) => ["head", k] as const), ...def.footKeys.map((k) => ["foot", k] as const)].sort((a, b) => b[1].length - a[1].length);
  const headLabelRe = (k: string) => new RegExp(`^${k}\\s*[:：]\\s*(.*)$|^${k}\\s+(\\S.*)$`);

  const bodyLines: Line[] = [];
  const nonBlank = lines.filter((l) => l.text);
  const lastFew = new Set(nonBlank.slice(-5).map((l) => l.start));
  const footStartIdx = lines.findIndex((l) => CLOSING.test(l.text) || /^ลงชื่อ\s*[:：]?\s*\S/.test(l.text) || (PAREN_NAME.test(l.text) && lastFew.has(l.start)));
  let headSeen = false;
  let bodyStarted = false;
  let afterSigner = false;
  let sawClosingOrFoot = false;
  const orgPending: Line[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.text) continue;
    if (l.text === "---" || /^```/.test(l.text) || /^={3,}/.test(l.text)) continue;

    // title line of a memo / petition
    if (!headSeen && !bodyStarted && (l.text === type || l.text === def.label || /^(บันทึกข้อความ|คำร้อง|คำฟ้อง)$/.test(l.text))) {
      (sources["type"] ??= []).push({ start: l.start, end: l.end });
      continue;
    }

    // closing + signer zone (everything from the closing line down)
    if (i >= (footStartIdx === -1 ? Infinity : footStartIdx) || sawClosingOrFoot) {
      sawClosingOrFoot = true;
      if (CLOSING.test(l.text) && !taken("foot:คำลงท้าย")) {
        put("foot:คำลงท้าย", l.text, l);
        continue;
      }
      const m = l.text.match(/^ลงชื่อ\s*[:：]?\s*(.*)$/);
      if (m && m[1] && !taken("foot:ลงชื่อ")) {
        put("foot:ลงชื่อ", m[1], l);
        afterSigner = true;
        continue;
      }
      if (PAREN_NAME.test(l.text) && !taken("foot:ลงชื่อ")) {
        put("foot:ลงชื่อ", l.text, l);
        afterSigner = true;
        continue;
      }
      const pm = l.text.match(/^ตำแหน่ง\s*[:：]?\s*(\S.*)$/);
      if (pm && hasKey("foot:ตำแหน่ง") && !taken("foot:ตำแหน่ง")) {
        put("foot:ตำแหน่ง", pm[1], l);
        continue;
      }
      if (PHONE.test(l.text) && hasKey("foot:โทร")) {
        if (!taken("foot:โทร")) put("foot:โทร", l.text, l);
        else unplaced.push({ text: l.text, span: { start: l.start, end: l.end }, guess: "foot:โทร" });
        continue;
      }
      if (afterSigner && !taken("foot:ตำแหน่ง") && (POSITION.test(l.text) || l.text.length <= 60) && hasKey("foot:ตำแหน่ง") && !OWNER_UNIT.test(l.text)) {
        put("foot:ตำแหน่ง", l.text, l);
        continue;
      }
      const guess: FieldKey | undefined = OWNER_UNIT.test(l.text) && hasKey("foot:ส่วนราชการเจ้าของเรื่อง") ? "foot:ส่วนราชการเจ้าของเรื่อง" : POSITION.test(l.text) && hasKey("foot:ตำแหน่ง") ? "foot:ตำแหน่ง" : undefined;
      unplaced.push({ text: l.text, span: { start: l.start, end: l.end }, guess });
      continue;
    }

    // head zone (until the first free-text line after a head field)
    if (!bodyStarted) {
      let hit = false;
      for (const [part, k] of labelKeys) {
        if (part !== "head") continue;
        if (k === "ที่" && !/^ที่\s*[:：]?\s*(\S*[/0-9๐-๙\[]\S*|[ก-ฮ]+\s*[0-9๐-๙\[]\S*)/.test(l.text)) continue;
        const m = l.text.match(headLabelRe(k));
        if (!m) continue;
        const value = (m[1] ?? m[2] ?? "").trim();
        if (taken(`head:${k}`)) continue;
        put(`head:${k}`, value, l);
        headSeen = true;
        hit = true;
        break;
      }
      if (hit) continue;
      if (hasKey("head:วันที่") && !taken("head:วันที่") && (DATE_BARE.test(l.text) || (/^วันที่\s/.test(l.text) && DATE_BARE.test(l.text.replace(/^วันที่\s*/, ""))))) {
        put("head:วันที่", l.text.replace(/^วันที่\s*/, ""), l);
        headSeen = true;
        continue;
      }
      if (!headSeen) {
        // lines above the first head field: ส่วนราชการ (org/address lines)
        if (hasKey("head:ส่วนราชการ") && orgPending.length < 4 && (ORG.test(l.text) || orgPending.length > 0 || l.text.length < 60) && !/[ๆ]$/.test(l.text) && l.text.length < 80) {
          orgPending.push(l);
          continue;
        }
        bodyStarted = true;
      } else {
        bodyStarted = true;
      }
    }
    bodyLines.push(l);
  }

  // flush org lines: they only count as ส่วนราชการ when a head field followed; otherwise they are body text
  if (headSeen && orgPending.length) {
    for (const l of orgPending) put("head:ส่วนราชการ", l.text, l);
  } else if (orgPending.length) {
    bodyLines.unshift(...orgPending);
  }

  // body paragraphs: blank line = new paragraph; with no blank lines every line is a paragraph
  const paras: { text: string; span: Span }[] = [];
  let cur: Line[] = [];
  const flush = () => {
    if (!cur.length) return;
    paras.push({ text: cur.map((c) => c.text).join("\n"), span: { start: cur[0].start, end: cur[cur.length - 1].end } });
    cur = [];
  };
  const gapBetween = (a: Line, b: Line) => lines.slice(lines.indexOf(a) + 1, lines.indexOf(b)).some((x) => !x.text);
  const hasBlank = bodyLines.some((l, i) => i > 0 && gapBetween(bodyLines[i - 1], l));
  bodyLines.forEach((l, i) => {
    if (!hasBlank || (i > 0 && gapBetween(bodyLines[i - 1], l))) flush();
    cur.push(l);
  });
  flush();
  doc.body = paras.map((p) => p.text);
  if (paras.length) sources.body = paras.map((p) => p.span);

  return { doc, sources, unplaced: unplaced.sort((a, b) => a.span.start - b.span.start) };
}

/** Build the DocState for a blob (keeps the raw text so "ดูต้นฉบับทั้งหมด" works). */
export function docStateFromBlob(raw: string, forceType?: string): DocState {
  const r = sortBlob(raw, forceType);
  return { doc: withRequiredSlots(r.doc), status: r.status, raw, sources: r.sources, unplaced: r.unplaced, origin: "format" };
}
