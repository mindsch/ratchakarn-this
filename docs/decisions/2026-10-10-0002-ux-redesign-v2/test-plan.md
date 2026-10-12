# Test plan: build 0002 (แปลเป็นราชการ / Ratchakarn-this)

You are testing a rewritten web app. You did not build it. Your job is to **find and report problems**, not to fix them (fix only if the user asks). Write your findings to `docs/decisions/2026-10-10-0002-ux-redesign-v2/test-report.md` (format at the end).

## 0. What the app is
A Thai web app (Vite + React + TS, runs in the browser, no backend) that helps people write Thai government-style documents (ภาษาราชการ) and export DOCX/PDF. Users bring their own AI key (BYOK); **everything except the AI buttons must work with no key**.

Pages (hash routes):
| Route | Page | What it does |
|---|---|---|
| `#/chat` | แชท | Converts casual text into ภาษาราชการ, with a 0–4 "ความราชการ" dial. Needs AI. |
| `#/draft` | ร่างเอกสาร | Pick a document type + purpose → fill-in-the-blank facts form → export. Includes 3 labour-court (ศาลแรงงาน) types. |
| `#/format` | จัดรูปแบบ | Paste an existing letter → **code** (not AI) sorts it into fields → optional AI check (suggestions only) → export. |
| `#/prompts` | พรอมต์ใช้กับ AI อื่น | Copy-paste prompts for use in ChatGPT/Claude/Gemini. |
| `#/settings` | ตั้งค่า | AI provider, key, model; the "โหมด XP replica" toggle (a joke theme for banners/pop-ups only). |

Both ร่างเอกสาร and จัดรูปแบบ end in the same step 3, ออกเอกสาร (export).

Design source: Figma file `RyaDjrolWmaXIVR4G6z26c`; node ids per screen are in `handoff.md` §0 in this folder. Product rules: `decision.md` and `handoff.md` §1–§2, §7 in this folder.

## 1. Setup
- Branch `build-0002`. `npm install` if needed.
- Dev server: `npx vite --port 5173`.
- Mock AI (OpenAI-compatible, no key needed): `node scripts/mock-server.mjs` → base URL `http://localhost:8787/v1`, model `mock`. It answers the check/prefill prompts with JSON, including one deliberately invalid suggestion.
- Screenshots: `scripts/shot.sh <route> <out.png> [width] [height] [mock]` (headless Chrome; width ≤ 500 renders a phone-width iframe via `dev/app.html`; dismisses the first-run dialog; `mock=1` points AI at the mock).
- Click-through script: `dev/e2e.mjs` (install `puppeteer-core@23.11.1` outside the repo, see its first line). Extend it for your cases, or drive Chrome yourself.
- Automated checks, all expected to pass: `npx tsc --noEmit`, `npm run build`, `npx tsx scripts/test-sort.ts`, `npx tsx scripts/test-check.ts`, `npx tsx scripts/test-templates.ts`, `npx tsx scripts/smoke-export.ts /tmp/rk-out`.
- **Real model:** the user tests with **Typhoon** (preset "Typhoon", base URL `https://api.opentyphoon.ai/v1`). Ask the user for a key if you need one. **Never write a real API key into any file, log, screenshot or the report.**
- Storage keys you may inspect or clear in DevTools: `ratchakarn.settings.v1` (localStorage, settings without key), `ratchakarn.apikey.v1` (sessionStorage by default; also localStorage when "จำคีย์" is on), `ratchakarn.xp.v1`, `ratchakarn.firstrun.v1`.

## 2. Priority 1: AI provider settings (user-reported bug)
**Reported by the user:** with Typhoon selected, the key and model "go to Ollama and other stuff". Treat this as a family of bugs, not one. Test every path that reads or writes settings; for each, record what is shown in the UI **and** what is in storage.

Code to read first: `src/lib/settings.ts`, `src/lib/llm/presets.ts`, `src/pages/settings/index.tsx`, `src/pages/settings/shared.tsx`, `src/lib/app.tsx` (`hasKey`), `src/lib/ai.ts` (`aiReady`, `runAi`), `src/pages/chat/index.tsx`.

| ID | Scenario | Expected |
|---|---|---|
| S1 | Fresh profile (clear storage). First-run dialog: pick Typhoon, paste a key, "บันทึกและทดสอบ". | Stored preset = typhoon, base URL = Typhoon's, model = a Typhoon model (or the one typed), key saved. Dialog closes only on success. Nothing points at Ollama or another provider. |
| S2 | Settings page: switch provider chips in order Typhoon → Ollama → OpenAI → Claude → Gemini → กำหนดเอง → Typhoon. Watch the base URL, model, key, "API type" (under ขั้นสูง) after each click. | Each provider shows its own base URL/type/default model. Decide and report: does the key from one provider leak into another? Does a model name typed for Typhoon stay when switching to Ollama? Does switching back restore Typhoon's values? |
| S3 | Set Typhoon + key + model, reload the page. | Same provider, URL, model; key present (if "จำคีย์" off, key survives reload in the same tab via sessionStorage, not after closing the tab). |
| S4 | Same as S3 but open a new tab / close and reopen. | Key gone unless "จำคีย์ไว้ในเบราว์เซอร์นี้" is on. With it on, key persists. Turning it off removes it from localStorage. |
| S5 | First-run dialog and Settings page both edit settings. Do S1 in the dialog, then open Settings. Then change in Settings and check nothing reverts. | One source of truth; no stale values. |
| S6 | "ทดสอบการเชื่อมต่อ" with: correct key; wrong key; wrong base URL; empty model; Ollama (no key) with Ollama not running. | Clear Thai result each time; uses the values currently on screen (not old saved ones); status tag ("เชื่อมต่อแล้ว" / "ยังไม่ได้ตั้งค่า") matches reality. |
| S7 | After S1, use each AI action: แชท แปลง, จัดรูปแบบ "ให้ AI ตรวจทั้งฉบับ", ร่างเอกสาร "ให้ AI เติมช่อง" and "AI ช่วยร่างเนื้อหา". Use DevTools Network to see the request URL, model and Authorization header (mask the key in notes). | Every request goes to the selected provider with the selected model and key. |
| S8 | No key at all (skip first-run). | Every page usable; AI buttons disabled or explained; "ไม่มีคีย์? คัดลอกพรอมต์แทน" goes to the พรอมต์ page. Ollama preset counts as ready without a key: check that this doesn't wrongly enable AI elsewhere when another preset is selected. |
| S9 | Provider "กำหนดเอง" (custom) with the mock server: `http://localhost:8787/v1`, model `mock`. | All AI paths work against the mock. |

## 3. Priority 2: core flows (no key)
### จัดรูปแบบ (`#/format`)
- F1. "ใช้ข้อความตัวอย่าง" → "จัดเข้าช่อง": fields filled correctly; paper preview on the right matches; missing fields show red `[ระบุ...]` on the preview only.
- F2. Paste each sample in `src/lib/doc/samples.ts` and at least 5 messy real-world letters of your own (no labels, mixed order, extra lines, phone numbers, English text, a court-style text). **No word of the input may be lost or changed**: every chunk ends up in a field or in the "ข้อความที่ยังไม่ได้จัด" tray.
- F3. Tray: "จัดเข้าช่อง ▾" moves the chunk to the chosen field; "ไม่ใช้" removes it from the tray but does not change other fields; "ดูต้นฉบับทั้งหมด" shows the exact original.
- F4. ข้าม / เลิกข้าม; edit a field; status line counts ("จัดเข้าช่องแล้ว x จาก y · ขาด n ช่อง") stay correct.
- F5. Paste the `===RATCHAKARN-DOC===` template output by an external AI (see `prompts/output-template.md`): parsed exactly.
- F6. Document type select (if shown): changing it re-maps fields sensibly.
### ร่างเอกสาร (`#/draft`)
- D1. Every type × purpose: the "ข้อมูลที่ต้องเตรียม" list matches the form; the fill-in sentence assembles the body word for word; blanks become `[ระบุ…]`.
- D2. Header/footer rows; วันที่ defaults to today in Thai (พ.ศ.).
- D3. Court types (คำฟ้องคดีแรงงาน, บัญชีพยาน, คำร้องคดีแรงงาน): add/remove timeline and claim rows; timeline ordered by date; disclaimer present on D01 and export; **no jokes anywhere on court screens**.
- D4. Switch type/purpose after filling: data loss is acceptable only if the user is warned; report what happens.
- D5. Go to export and back ("← กลับไปแก้"): data kept.
### ออกเอกสาร (both flows)
- E1. DOCX downloads and **opens in Word / LibreOffice** with correct layout (Thai font TH Sarabun New 16pt, margins per chosen profile, ครุฑ slot left empty).
- E2. "บันทึกเป็น PDF" opens the print view; print to PDF looks like the preview.
- E3. Every page-layout profile option changes the output.
- E4. Upload your own image for the ครุฑ slot: it appears in preview and DOCX. The app must never ship a ครุฑ image itself.
- E5. Remaining `[ระบุ...]` count in "ก่อนใช้งานจริง" matches the document; skipped fields print `[ระบุ...]`; the preview's red colour does **not** appear in the DOCX/PDF.
- E6. Success/error Banner appears after export.

## 4. Priority 3: AI features (mock first, then real Typhoon)
- A1. AI ตรวจทั้งฉบับ (format): suggestions list shows; **the document is byte-identical until a suggestion is accepted** (compare preview text before/after); accepting changes only that field; "คงต้นฉบับ" is the default; "เลิกทำ" restores; a suggestion whose original text isn't in the document is rejected (the mock sends one). With real Typhoon: is the reply valid JSON in the contract (`src/lib/ai.ts` `CheckSuggestion`)? Are `original` strings exact? Record failure rate over ~5 runs.
- A2. "← กลับ" from suggestions: report whether accepted suggestions are lost (known behaviour) and whether that is surprising.
- A3. Prefill (draft "ให้ AI เติมช่อง"): fills only empty slots, only with facts stated in the brief; never overwrites user input; never invents (give a brief missing dates/places and check they stay empty).
- A4. AI ช่วยร่างเนื้อหา: body stays formal, keeps `[ระบุ...]` for missing facts, invents nothing; "ใช้เนื้อหาตามช่องกรอก" reverts.
- A5. แชท: all 5 dial levels; levels 3–4 show the "เพื่อความบันเทิง" note; streaming; stop button; Ctrl/Cmd+Enter; copy; "ส่งไปจัดรูปแบบ →" lands on จัดรูปแบบ **step 1 (วาง)** with the text filled.
- A6. Errors: wrong key, network off, provider CORS block, rate limit. Each shows a calm Thai message; nothing crashes; the page stays usable.
- A7. Loading pop-ups use the right copy (Standard vs XP, see `src/lib/copy.ts`).

## 5. Priority 4: XP mode, design rules, mobile
- X1. Toggle "โหมด XP replica" in Settings: a confirmation banner appears; reload keeps it; only banners, pop-ups and progress bars change. Cards, buttons, forms, nav do not.
- X2. With XP on, export the same document as with XP off: the DOCX/PDF must be identical (diff the `document.xml` inside the DOCX zip).
- X3. Court pages with XP on: nothing changes.
- V1. Compare each page with its Figma frame (node ids in `handoff.md` §0; new pages: P01 `58:2689`, C01 `58:3926`, S01 `58:809`, court D01-C `58:634`, D02-C `58:3587`; mobile M-F01..04 `60:2588`, `60:2625`, `60:2739`, `60:2837`). Known gaps, don't re-report: F01 desktop paste card centred and missing the "วางมาจากไหนก็ได้" side card; พรอมต์ page empty grid slot after the ศาลแรงงาน card.
- V2. Rules: grey page; white cards; **beige only behind the A4 paper**; no Sarabun font outside the paper; pixel font only on letter-only tags (never numbers); Thai words never broken mid-word.
- M1. At 390px: every page and step, no horizontal scroll, bottom action bar doesn't cover content, "ช่องเอกสาร | ตัวอย่าง A4" switch works, tap targets ≥ 44px (top-bar pill and gear are known to be 36px).
- K1. Keyboard: tab through each page; focus ring visible; Escape closes the prompt drawer and dialogs; toggles and radios usable by keyboard.

## 6. Priority 5: other
- N1. Hash routes: reload on each route keeps the page; browser back/forward works. Known: draft state is lost on reload.
- N2. Console: one 404 resource error was seen on a desktop page; identify which file.
- P1. พรอมต์ page: copy works; drawer shows full text, size, download; sizes match `public/prompts/*.md`; the old name "ราชการนี้" appears nowhere in the UI or prompts (`grep -r "ราชการนี้" src prompts public`).
- P2. Paste a copied prompt into a real AI, use it, bring the `===RATCHAKARN-DOC===` result back into จัดรูปแบบ: it parses.

## 7. Report format (`test-report.md`)
Start with a 5-line summary (what passed, the worst problems). Then one row per finding:

| ID | Area | Steps to reproduce | Expected | Actual | Severity (blocker / major / minor / cosmetic) | Evidence (screenshot path, storage dump with key masked) | Suspected file |

Then a list of test IDs you could not run and why. Keep screenshots under `dev/test-shots/` (not committed). Do not commit anything; do not change code unless the user asks.
