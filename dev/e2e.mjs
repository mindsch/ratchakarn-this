// Run: (once) mkdir -p /tmp/rk-e2e && cd /tmp/rk-e2e && npm i puppeteer-core@23.11.1; then NODE_PATH=/tmp/rk-e2e/node_modules node dev/e2e.mjs (needs npx vite --port 5173 and node scripts/mock-server.mjs). Screenshots land next to this file.
// E2E click-through of build-0002 against the dev server (5173) and mock LLM (8787).
import puppeteer from "puppeteer-core";
const OUT = new URL(".", import.meta.url).pathname;
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const log = [];
const errors = [];

async function page(width, { mock = true } = {}) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: width < 500 ? 844 : 1000, deviceScaleFactor: 1 });
  p.on("console", (m) => m.type() === "error" && errors.push(`[${width}] console: ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`[${width}] pageerror: ${e.message}`));
  await p.evaluateOnNewDocument((mock) => {
    localStorage.setItem("ratchakarn.firstrun.v1", "1");
    if (mock) {
      localStorage.setItem("ratchakarn.settings.v1", JSON.stringify({ presetId: "custom", kind: "openai", baseUrl: "http://localhost:8787/v1", model: "mock", rememberKey: true, mcp: [] }));
      localStorage.setItem("ratchakarn.apikey.v1", "mock-key");
    }
  }, mock);
  return p;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function click(p, text, { exact = false } = {}) {
  const ok = await p.evaluate(
    (text, exact) => {
      const els = [...document.querySelectorAll("button, a, [role=radio], [role=tab], [role=switch]")].filter((e) => e.offsetParent !== null);
      const el = els.find((e) => (exact ? e.textContent.trim() === text : e.textContent.includes(text)));
      if (!el) return false;
      el.click();
      return true;
    },
    text,
    exact,
  );
  log.push(`${ok ? "✓" : "✗"} click "${text}"`);
  await wait(400);
  return ok;
}
async function shot(p, name, full = true) {
  await wait(300);
  await p.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
  log.push(`  shot ${name}`);
}
const text = (p) => p.evaluate(() => document.body.innerText);

// ---------- Format flow ----------
{
  const p = await page(1440);
  await p.goto("http://localhost:5173/#/format", { waitUntil: "networkidle0" });
  await click(p, "ใช้ข้อความตัวอย่าง");
  await click(p, "จัดเข้าช่อง");
  await shot(p, "F02");
  const before = await p.evaluate(() => document.querySelector(".rk-page")?.innerText ?? "");
  await click(p, "ให้ AI ตรวจทั้งฉบับ");
  await wait(2500);
  await shot(p, "F03");
  const t3 = await text(p);
  log.push(`  F03 shows rejected suggestion text? ${t3.includes("ข้อความที่ไม่มีในเอกสาร")}`);
  const mid = await p.evaluate(() => document.querySelector(".rk-page")?.innerText ?? "");
  log.push(`  paper unchanged before accepting: ${before === mid}`);
  await click(p, "ใช้ข้อเสนอ", { exact: true });
  const after = await p.evaluate(() => document.querySelector(".rk-page")?.innerText ?? "");
  log.push(`  paper changed after accepting: ${before !== after}`);
  await shot(p, "F03-accepted");
  await click(p, "ไปออกเอกสาร");
  await shot(p, "F04");
  await click(p, "ดาวน์โหลด DOCX");
  await wait(1500);
  await shot(p, "F04-done", false);
  await p.close();
}
// ---------- Format mobile ----------
{
  const p = await page(390);
  await p.goto("http://localhost:5173/#/format", { waitUntil: "networkidle0" });
  await click(p, "ใช้ข้อความตัวอย่าง");
  await click(p, "จัดเข้าช่อง");
  await shot(p, "M-F02");
  await click(p, "ตัวอย่าง A4");
  await shot(p, "M-F02-paper");
  await p.close();
}
// ---------- Draft flow ----------
{
  const p = await page(1440);
  await p.goto("http://localhost:5173/#/draft", { waitUntil: "networkidle0" });
  await shot(p, "D01");
  await click(p, "ต่อไป");
  await shot(p, "D02");
  await click(p, "เปิดกล่องเล่าเรื่อง");
  await shot(p, "D02-brief", false);
  await click(p, "ไปออกเอกสาร");
  await shot(p, "D03");
  await click(p, "กลับไปแก้");
  await click(p, "เปลี่ยนชนิด");
  await click(p, "ศาลแรงงาน");
  await shot(p, "D01-C");
  await click(p, "ต่อไป");
  await shot(p, "D02-C");
  await p.close();
}
{
  const p = await page(390);
  await p.goto("http://localhost:5173/#/draft", { waitUntil: "networkidle0" });
  await click(p, "ต่อไป");
  await shot(p, "M-D02");
  await p.close();
}
// ---------- Chat ----------
{
  const p = await page(1440);
  await p.goto("http://localhost:5173/#/chat", { waitUntil: "networkidle0" });
  await p.type("textarea", "พรุ่งนี้ขอลาไปหาหมอนะครับ");
  await click(p, "แปลง", { exact: true });
  await wait(2500);
  await shot(p, "C01");
  await click(p, "ส่งไปจัดรูปแบบ");
  await shot(p, "C01-handoff", false);
  log.push(`  hand-off route: ${await p.evaluate(() => location.hash)}`);
  await p.close();
}
{
  const p = await page(1440, { mock: false });
  await p.goto("http://localhost:5173/#/chat", { waitUntil: "networkidle0" });
  await shot(p, "C02", false);
  await p.close();
}
{
  const p = await page(390);
  await p.goto("http://localhost:5173/#/chat", { waitUntil: "networkidle0" });
  await shot(p, "M-C01", false);
  await p.close();
}
// ---------- Settings + XP ----------
{
  const p = await page(1440);
  await p.goto("http://localhost:5173/#/settings", { waitUntil: "networkidle0" });
  await click(p, "ทดสอบการเชื่อมต่อ");
  await wait(2000);
  await p.evaluate(() => document.querySelector("[role=switch]")?.click());
  await wait(500);
  log.push(`  data-theme after toggle: ${await p.evaluate(() => document.documentElement.dataset.theme)}`);
  await shot(p, "S03");
  await p.reload({ waitUntil: "networkidle0" });
  log.push(`  data-theme after reload: ${await p.evaluate(() => document.documentElement.dataset.theme)}`);
  await p.goto("http://localhost:5173/#/draft", { waitUntil: "networkidle0" });
  await click(p, "ศาลแรงงาน");
  await click(p, "ต่อไป");
  await shot(p, "D02-C-xp");
  await p.close();
}
{
  const p = await page(390);
  await p.goto("http://localhost:5173/#/settings", { waitUntil: "networkidle0" });
  await shot(p, "M-S01");
  await p.goto("http://localhost:5173/#/prompts", { waitUntil: "networkidle0" });
  await shot(p, "M-P01");
  await p.close();
}

await browser.close();
console.log(log.join("\n"));
console.log("\nERRORS:\n" + (errors.join("\n") || "none"));
