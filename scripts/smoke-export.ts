// Smoke test: build every sample as DOCX with the real renderer and write them to the given directory.
import { writeFileSync, mkdirSync } from "node:fs";
import { buildDocx } from "../src/lib/doc/docx";
import { buildBlocks, PROFILES } from "../src/lib/doc/layout";
import { parseDoc, serializeDoc } from "../src/lib/doc/parse";
import { SAMPLES } from "../src/lib/doc/samples";

const out = process.argv[2] ?? "./out";
mkdirSync(out, { recursive: true });
let failed = 0;
for (const [type, raw] of Object.entries(SAMPLES)) {
  const doc = parseDoc(raw);
  if (doc.type !== type) { console.error("type mismatch", type, doc.type); failed++; }
  // round trip
  const again = parseDoc(serializeDoc(doc));
  const norm = (d: typeof doc) => JSON.stringify([d.type, Object.entries(d.head).sort(), d.body, Object.entries(d.foot).sort()]);
  if (norm(again) !== norm(doc)) { console.error("round trip differs", type); failed++; }
  const opts = { profile: PROFILES.common, thaiDigits: false, garudaImage: null, showSlotHint: false };
  const blob = await buildDocx(buildBlocks(doc, opts), opts, type);
  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync(`${out}/${type}.docx`, buf);
  console.log(type, buf.length, "bytes", "head:", Object.keys(doc.head).length, "body:", doc.body.length);
}
// AI-style fenced output with surrounding chatter
const chatty = "นี่คือร่างครับ\n```\n" + SAMPLES["หนังสือภายนอก"] + "\n```\nตรวจก่อนใช้นะครับ";
const c = parseDoc(chatty);
if (c.type !== "หนังสือภายนอก" || !c.head["เรื่อง"] || c.body.length < 2) { console.error("fenced parse failed", c); failed++; }
process.exit(failed ? 1 : 0);
