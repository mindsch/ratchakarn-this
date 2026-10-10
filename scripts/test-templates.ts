// Run: npx tsx scripts/test-templates.ts  (exit 1 on failure)
import { allSlots, allTemplates, assembleDoc, blank, defaultMeta, progress, type Input, type Row, type Template } from "../src/lib/doc/templates";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error("FAIL", msg);
};
const ok = (cond: boolean, msg: string) => cond || fail(msg);

const sampleRow = (list: Template["sections"][number]["list"] & {}, n: number): Row =>
  Object.fromEntries(list.cols.map((c) => [c.key, c.date ? `2026-0${n}-1${n}` : `${c.label}${n}`]));

function emptyInput(t: Template): Input {
  return { values: {}, lists: {}, meta: defaultMeta(t.type) };
}
function filledInput(t: Template): Input {
  const values = Object.fromEntries(allSlots(t).map((s) => [s.key, `ตัวอย่าง${s.key}`]));
  const lists: Record<string, Row[]> = {};
  for (const sec of t.sections) if (sec.list) lists[sec.list.key] = [sampleRow(sec.list, 3), sampleRow(sec.list, 1)];
  return { values, lists, meta: { ...defaultMeta(t.type), ...Object.fromEntries(t.metaFields.map((m) => [m.key, defaultMeta(t.type)[m.key] || `ตัวอย่าง${m.key}`])) } };
}

const templates = allTemplates();
ok(templates.length >= 12, `expected many templates, got ${templates.length}`);

for (const t of templates) {
  const label = `${t.type}/${t.id}`;
  // all empty: every bracket is a [ระบุ…] blank, and the body has at least one
  const e = assembleDoc(t, emptyInput(t));
  const eText = e.body.join("\n");
  const eBrackets = eText.match(/\[[^\]]*\]/g) ?? [];
  ok(e.body.length > 0, `${label}: empty body is empty`);
  ok(eBrackets.length > 0, `${label}: empty input shows no blanks`);
  ok(eBrackets.every((b) => b.startsWith("[ระบุ")), `${label}: non-blank bracket in ${eBrackets.join(" ")}`);
  ok(!/undefined|null|\{|\}/.test(eText), `${label}: leaked token in empty body`);
  for (const s of allSlots(t)) if (t.sentence?.flat().some((p) => typeof p !== "string" && "slot" in p && p.slot === s.key))
    ok(eText.includes(blank(s.short)), `${label}: blank for ${s.key} missing`);

  // all filled: no brackets left in body or derived head/foot
  const f = filledInput(t);
  const d = assembleDoc(t, f);
  const all = [...d.body, ...Object.values(d.head), ...Object.values(d.foot)].join("\n");
  ok(!/[[\]]/.test(all), `${label}: bracket left after filling: ${all.match(/\[[^\]]*\]/g)?.join(" ")}`);
  ok(!/undefined|null/.test(all), `${label}: leaked token when filled`);
  for (const s of allSlots(t)) {
    const used = t.sentence ? t.sentence.flat().some((p) => typeof p !== "string" && "slot" in p && p.slot === s.key) : true;
    ok(!used || all.includes(`ตัวอย่าง${s.key}`), `${label}: slot ${s.key} unused in body`);
  }
  const p = progress(t, f);
  ok(p.done === p.total, `${label}: filled progress ${p.done}/${p.total}`);
  const pe = progress(t, emptyInput(t));
  ok(pe.done < pe.total, `${label}: empty progress should be incomplete`);
}

// court timeline in date order (input given out of order, plus an undated row that must come last)
const sue = templates.find((t) => t.type === "คำฟ้องคดีแรงงาน")!;
const i = filledInput(sue);
i.lists.events = [
  { date: "2026-03-01", event: "เหตุสาม" },
  { date: "", event: "เหตุไม่มีวัน" },
  { date: "2025-12-01", event: "เหตุหนึ่ง" },
  { date: "2026-01-15", event: "เหตุสอง" },
];
const body = assembleDoc(sue, i).body.join("\n");
const order = ["เหตุหนึ่ง", "เหตุสอง", "เหตุสาม", "เหตุไม่มีวัน"].map((x) => body.indexOf(x));
ok(order.every((x) => x >= 0) && order.every((x, k) => k === 0 || x > order[k - 1]), `timeline not in date order: ${order.join(",")}`);
ok(body.includes("1 ธันวาคม 2568"), "date should render in Thai พ.ศ.");
ok(/ข้อ ๒\. เมื่อวันที่ 1 ธันวาคม 2568 เหตุหนึ่ง/.test(body), "first timeline item should be ข้อ ๒");

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log(`ok: ${templates.length} templates`);
