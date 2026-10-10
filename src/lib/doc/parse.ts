import { DEFAULT_TYPE, DOC_TYPES, type DocData } from "./types";

const KEY_RE = /^([^:：\n|]{1,30})[:：]\s*(.*)$/;

/** Parse the paste-in template. Accepts the fenced block from a chat AI, with or without the markers. */
export function parseDoc(raw: string): DocData {
  let text = raw.replace(/\r\n?/g, "\n");
  const m = text.match(/===RATCHAKARN-DOC===([\s\S]*?)(?:===END===|$)/);
  if (m) text = m[1];
  text = text
    .split("\n")
    .filter((l) => !/^\s*```/.test(l))
    .join("\n")
    .trim();

  const lines = text.split("\n");
  const firstSep = lines.findIndex((l) => /^\s*---+\s*$/.test(l));
  const doc: DocData = { type: DEFAULT_TYPE, head: {}, body: [], foot: {} };

  const headLines = firstSep === -1 ? lines.filter((l) => KEY_RE.test(l.trim()) && looksLikeHeader(l)) : lines.slice(0, firstSep);
  let bodyLines: string[] = [];
  let footLines: string[] = [];
  if (firstSep === -1) {
    bodyLines = lines.filter((l) => !headLines.includes(l));
  } else {
    const rest = lines.slice(firstSep + 1);
    const secondSep = rest.findIndex((l) => /^\s*---+\s*$/.test(l));
    if (secondSep === -1) bodyLines = rest;
    else {
      bodyLines = rest.slice(0, secondSep);
      footLines = rest.slice(secondSep + 1);
    }
  }

  parseKeys(headLines, doc.head);
  parseKeys(footLines, doc.foot);
  if (doc.head["ชนิด"]) {
    doc.type = doc.head["ชนิด"].trim();
    delete doc.head["ชนิด"];
  }
  if (!DOC_TYPES[doc.type]) doc.type = guessType(doc.type);

  doc.body = bodyLines
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return doc;
}

function looksLikeHeader(line: string) {
  const k = line.split(/[:：]/)[0].trim();
  return ["ชนิด", "ที่", "วันที่", "เรื่อง", "เรียน", "ส่วนราชการ", "ศาล", "โจทก์", "จำเลย"].includes(k);
}

function guessType(t: string): string {
  const hit = Object.keys(DOC_TYPES).find((k) => t.includes(k));
  return hit ?? DEFAULT_TYPE;
}

function parseKeys(lines: string[], out: Record<string, string>) {
  let last = "";
  for (const line of lines) {
    const m = line.trim().match(KEY_RE);
    if (m && !/^\s/.test(line)) {
      last = m[1].trim();
      out[last] = m[2].trim();
    } else if (last && line.trim()) {
      out[last] = (out[last] ? out[last] + " | " : "") + line.trim();
    }
  }
}

export function serializeDoc(d: DocData): string {
  const def = DOC_TYPES[d.type];
  const headKeys = def ? def.headKeys : Object.keys(d.head);
  const footKeys = def ? def.footKeys : Object.keys(d.foot);
  const kv = (keys: string[], src: Record<string, string>) =>
    [...keys, ...Object.keys(src).filter((k) => !keys.includes(k))]
      .filter((k) => k in src || keys.includes(k))
      .map((k) => `${k}: ${src[k] ?? ""}`)
      .join("\n");
  return [
    "===RATCHAKARN-DOC===",
    `ชนิด: ${d.type}`,
    kv(headKeys, d.head),
    "---",
    d.body.join("\n\n"),
    "---",
    kv(footKeys, d.foot),
    "===END===",
  ].join("\n");
}
