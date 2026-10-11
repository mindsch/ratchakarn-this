// Tests for src/lib/doc/check.ts. Run: npx tsx scripts/test-check.ts
import type { CheckSuggestion } from "../src/lib/ai";
import { applyAll, applySuggestion, invariantHolds, sameDoc, validSuggestions } from "../src/lib/doc/check";
import { SAMPLES } from "../src/lib/doc/samples";
import { docStateFromBlob } from "../src/lib/doc/sort";

let failed = 0;
const ok = (c: boolean, msg: string) => { if (!c) { failed++; console.error("FAIL", msg); } };

for (const [type, raw] of Object.entries(SAMPLES)) {
  const base = docStateFromBlob(raw);
  ok(sameDoc(applyAll(base, []).doc, base.doc), `${type}: nothing accepted -> identical`);
  // every field's first 3 chars as a fake suggestion
  const sugg: CheckSuggestion[] = [];
  for (const [k, v] of Object.entries(base.doc.head)) if (v.length > 4) sugg.push({ kind: "สะกดคำ", field: `head:${k}`, original: v.slice(0, 3), suggestion: "XYZ" });
  if (base.doc.body[0]) sugg.push({ kind: "ภาษาราชการ", field: "body", original: base.doc.body[0].slice(2, 8), suggestion: "QQQ" });
  const valid = validSuggestions(base.doc, sugg);
  ok(valid.length === sugg.length, `${type}: valid ${valid.length}/${sugg.length}`);
  // accept one at a time: only that field changes
  for (const s of valid) {
    const r = applySuggestion(base, s);
    ok(r.ok, `${type}: apply ${s.field}`);
    ok(invariantHolds(base, r.state, [s]), `${type}: invariant ${s.field}`);
    const changed = (["head", "foot"] as const).flatMap((p) => Object.keys(base.doc[p]).filter((k) => base.doc[p][k] !== r.state.doc[p][k]));
    ok(changed.length + (JSON.stringify(base.doc.body) !== JSON.stringify(r.state.doc.body) ? 1 : 0) === 1, `${type}: exactly one field changed for ${s.field}`);
  }
  ok(!invariantHolds(base, applyAll(base, valid), []) || valid.length === 0, `${type}: applying changes doc`);
}

const base = docStateFromBlob(SAMPLES["หนังสือภายนอก"]);
// rejections
const bad: CheckSuggestion[] = [
  { kind: "x", field: "head:เรื่อง", original: "ข้อความที่ไม่มีอยู่", suggestion: "a" },
  { kind: "x", field: "body", original: "ไม่มีในเนื้อหาแน่นอน", suggestion: "a" },
  { kind: "x", field: "head:ไม่มีช่องนี้", original: "ก", suggestion: "a" },
  { kind: "x", field: "bogus", original: "ก", suggestion: "a" },
];
ok(validSuggestions(base.doc, bad).length === 0, "bad suggestions rejected");
for (const s of bad) {
  const r = applySuggestion(base, s);
  ok(!r.ok && sameDoc(r.state.doc, base.doc), `bad apply leaves doc identical: ${s.field}`);
}
ok(validSuggestions(base.doc, "nope").length === 0, "non-array");
// advisory kept, not applicable
const adv: CheckSuggestion = { kind: "ข้อมูลขาด", field: "head:ที่", original: "", suggestion: "ใส่เลขที่หนังสือ" };
ok(validSuggestions(base.doc, [adv]).length === 1, "advisory kept");
ok(!applySuggestion(base, adv).ok, "advisory not applicable");
// the field is not touched by a suggestion for another field
const s1: CheckSuggestion = { kind: "x", field: "head:เรื่อง", original: "ขอความร่วมมือ", suggestion: "ขอความอนุเคราะห์" };
const r1 = applySuggestion(base, s1);
ok(r1.state.doc.head["เรื่อง"] === "ขอความอนุเคราะห์ในการจัดสัมมนาเชิงปฏิบัติการ", "replace exact substring: " + r1.state.doc.head["เรื่อง"]);
ok(JSON.stringify(r1.state.doc.body) === JSON.stringify(base.doc.body), "body untouched");
// undo = re-derive from base
ok(sameDoc(applyAll(base, []).doc, base.doc), "undo restores");

if (failed) { console.error(failed, "failed"); process.exit(1); }
console.log("check: all passed");
