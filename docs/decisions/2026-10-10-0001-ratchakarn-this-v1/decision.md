# 0001 — Ratchakarn-this v1

**Status:** Built (v1, 2026-10-10), not yet tested against a real model
**Date:** 2026-10-10
**Supersedes:** none

## Context
Hackathon project ("stupid hackathon", deadline **2026-10-11**) that should also be genuinely usable: turn any language into Thai ราชการ register, build ราชการ documents, draft court documents as a first draft, and format existing text into correct หนังสือราชการ layout for printing. Must work without the author paying for AI: users bring their own key/endpoint, or copy a prompt into Gemini/Claude/ChatGPT/etc. Open-sourced on GitHub. Research: `notes/2026-10-10-research.md` and `references.md`.

## Decision

### 1. One prompt pack is the source of truth
`prompts/` holds: core system prompt, mode modules (แปลงภาษา, ร่างหนังสือ, ศาล-draft, จัดรูปแบบ), and a doc-type library (phrases, closers, structure per type). A build script compiles it into (a) one copy-paste prompt per target (generic / Claude / Gemini / ChatGPT / Thai models), (b) the system prompts the web app loads. Web app and copy-paste prompt cannot drift.

### 2. The model writes words, code does layout
The model returns **structured JSON per document type** (schema-validated); a deterministic renderer produces **DOCX and PDF**. Layout is never left to the model.

**Chat and export are two separate tools.** The export page works with no chat and no API key. Ways in:
1. Fill a form (fields per document type).
2. Paste text in our simple template format (markdown-like, `ที่:`, `เรื่อง:`, `เรียน:`, body paragraphs) or the JSON; parsed deterministically.
3. Paste output from *any* AI: the copy-paste prompt tells Gemini/Claude/ChatGPT to answer in exactly that template, so users paste the result straight into the export page.
4. Optional "จัดรูปแบบ" button: if the user has plugged in a model, it maps arbitrary pasted text/markdown/docx text into the template. Export itself never depends on it.

### 3. Web app: static-first, BYOK
Next.js (or Vite) + React + Vercel AI SDK + a docx library. Keys in `sessionStorage` (localStorage opt-in), calls go browser → provider. Providers: OpenAI-compatible (`baseURL` configurable: ThaiLLM free API, Typhoon API, OpenRouter, Ollama, vLLM, Groq), Anthropic, Gemini. Remote MCP servers (Streamable HTTP) added in settings; every tool call shown to the user. Optional stateless pass-through proxy for endpoints without CORS (never logs keys). MIT licence.

**Suggested models, not locked in.** Settings has presets the user can pick or replace with anything: ThaiLLM free API (OpenThaiGPT / Pathumma), Typhoon 2.5 (30B-A3B hosted, or 4B GGUF locally via Ollama), and frontier models (Claude, Gemini, GPT) for best quality. Preset notes are "known/likely to work" and get updated from our own eval results; none of these has been tested by us yet.

### 4. Modes in v1 (deadline: tomorrow)
Order of work: (1) system prompt/pack usable in any chat AI, (2) web chat, (3) DOCX/PDF export.
- **แปลงภาษา** converter with a **joke dial** from ราชการจริงจัง to เวอร์วัง.
- **Document builder**, 4–5 types first: หนังสือภายนอก (ขอ / เชิญ / ตอบ / ปฏิเสธ via the doc-type library), บันทึกข้อความ, คำร้อง (public), plus 1–2 of หนังสือรับรอง / คำสั่ง / ประกาศ.
- **Court mode (draft), labour court (ศาลแรงงาน) only at first.** Other courts later, each only after we have that court's own forms. Interview-first: the model asks for ข้อเท็จจริง (parties, dates, wage, position, amounts owed, what was demanded, evidence) one cluster at a time, **never invents facts or law citations**, leaves marked blanks `[…]`, then fills a schema and renders in the court's own structure. Second priority after the three above.
  - Basis: the labour court's published fill-in templates (Phuket, Region 8). The wages template (รง.๑) runs: title "คำฟ้องคดีแรงงาน" → คดีหมายเลขดำที่ …/ปี → ศาลแรงงานภาค … → วันที่/เดือน/พุทธศักราช → โจทก์/จำเลย → "ข้าพเจ้า … อายุ … เลขประจำตัวประชาชน … อยู่บ้านเลขที่ … ขอยื่นฟ้อง … จำเลย … มีข้อความตามที่จะกล่าวต่อไปนี้" → หมายเหตุ (acknowledges hearing dates) → ข้อ ๑. checkbox list of which law/contract was breached, then narrative (employer's business, hire date, position, wage, resignation, unpaid periods, total in numerals and words, demanded) → closing "ขอบารมีศาลเป็นที่พึ่ง ควรมิควรแล้วแต่จะโปรด" → คำขอท้ายฟ้อง, signature, plus a paired บัญชีพยาน.
  - First set: the 12 complaint variants collapse into ~6 schemas (ค่าจ้างอย่างเดียว, บอกกล่าวล่วงหน้า, ค่าชดเชย+ค่าจ้าง, ค่าเสียหาย, เพิกถอนคำวินิจฉัย / คำสั่งพนักงานตรวจแรงงาน, …) and 10 คำร้อง types (e.g. ขอดำเนินคดีตนเอง, ขอถอนฟ้อง, ขอคัดถ่ายเอกสาร, ขอบัญชีระบุพยานเพิ่มเติม), all with templates listed in `references.md`.
  - Privacy: these forms hold ID numbers and addresses; UI warns that text goes to the model provider the user chose, and the prompt tells the model to use placeholders unless the user insists.

### 5. Disclaimers (non-negotiable, in prompt, UI and exported file footer notes)
- Court/legal output: "ร่างเบื้องต้นเท่านั้น ควรอ่านทบทวนและปรึกษาทนายความก่อนใช้จริง" shown in chat, before export, and in the prompt pack.
- General: use at your own risk; the project makes no guarantee of correctness or acceptance by any agency or court; the user is responsible for effects of use.

### 6. Layout: agency guidelines, not regulation
Use the numbers in `references.md` (A4, TH Sarabun New/PSK 16 pt, margins L3 / R2 / T1.5 / B2 cm, ครุฑ 3 cm for ภายนอก/คำสั่ง and 1.5 cm for บันทึกข้อความ, indent 2.5 cm, 29 pt bold "บันทึกข้อความ", etc.). The user confirmed there is **no regulation text** fixing these; they are agency guidelines (our source is one university's manual following สารบรรณ convention). So we label them "มาตรฐานที่นิยมใช้ / common practice" in the UI, not "official", and the renderer keeps them in a config file with named profiles (default plus per-agency overrides such as the DOPA variant).

### 7. Garuda: leave the slot, user pastes it
We never ship the ครุฑ image (the เครื่องหมายครุฑพ่าห์ is statute-protected; Act text still unread). The generated DOCX/PDF reserves an empty, correctly sized and positioned slot (3 cm or 1.5 cm, at the position in `references.md`) with a faint placeholder note outside the print area or a removable text box, and the user pastes their own ครุฑ into it. An optional "upload image" field puts the user's own file in the slot (done in-browser, never uploaded). The legal warning shows next to that field.

### 8. Fine-tuning
Real weight fine-tuning (Typhoon 2.5 4B / Qwen3-class) is wanted but **not in the 2026-10-11 scope**. v1 collects what it needs: the prompt pack, an eval set, and curated (input → ราชการ output) pairs. Revisit as 0002 after the hackathon.

## Reasoning
- Two outputs from one source avoids maintaining the web prompt and the copy-paste prompt separately.
- LLMs are unreliable at precise layout; the print-and-use goal needs exact margins, fonts, indents, so code owns layout.
- BYOK + static hosting means zero ongoing cost, and ThaiLLM's free OpenAI-compatible endpoint gives non-paying users a Thai-capable default.
- Interview-first for court mode answers "ask ข้อเท็จจริง or just format": both, but facts first, because an invented fact in a pleading is worse than a blank.
- Shipping in a day means three things done well rather than ten half-done.

## Alternatives considered
- Model also writes the layout (HTML/DOCX directly) — faster to start, but inconsistent and not print-correct.
- Backend proxy with our own key — costs money, defeats the BYOK goal.
- Fine-tune first — can't fit one day, and has no eval set to measure against yet.
- Court mode as format-only — rejected: users need help figuring out which facts a pleading needs.
- Bundling the ครุฑ — rejected pending legal read.

## Open questions
- ThaiLLM API: confirm endpoint, auth, model names, and limits by calling it (source was a vendor blog).
- Typhoon 2.5 licence (not stated on the Hugging Face collection page).
- Exact positions of ที่ / วันที่ / เรื่อง / เรียน / อ้างถึง / สิ่งที่ส่งมาด้วย for the DOCX (Silpakorn manual aligns them to ครุฑ letters; need template DOCX/PDF from the sources in `references.md`).
- Labour court: the templates are legacy-encoded .doc form-fillable files; the page states no paper/font/copies/fees rules. Match the template look (convert .doc → PDF in LibreOffice/Word to copy layout, fonts, spacing). Confirm filing rules with the court (lbphkc@coj.go.th) or its other pages. Other courts: do later, one at a time, from each court's own forms.
- Layout numbers are guidelines only (no regulation text exists, per the user), so present them as common practice with selectable profiles.
- เครื่องหมายครุฑพ่าห์ Act: read 2026-10-10 (see references.md). Key point is ม.13: using the garuda without the right, to make others believe you have it, is an offence (up to 1 year / 6,000 baht). Still unread: the royal decree under ม.7 (who may use it) and the 1992 amendment. Until then the app keeps its current stance (no bundled image, empty slot, user supplies image and is warned) and the upload should carry a clear "only if you are entitled to use it" warning, ideally a required confirmation.
- Hosting choice (Vercel vs Cloudflare) and repo name/licence file.

## Next step
When the user says "go build 0001": write `plan.md` (ordered tasks), then build in the order prompt pack → web chat → DOCX/PDF export → court mode.

## What got built
Plan: `plan.md`. Everything below is in the repo root.

- `prompts/` (core, 4 modes, 2 doctype files, output-template, disclaimer) + `scripts/build-prompts.mjs` → `public/prompts/*.md` (4 copy-paste prompts) and `src/generated/prompts.ts`.
- `src/lib/doc/`: `types.ts` (9 document types), `parse.ts` (paste-in template parser/serializer, accepts fenced AI output), `layout.ts` (layout profiles `common` and `dopa`, block builder for letter / memo / petition / order / announcement / certificate / labour-court), `docx.ts` (DOCX), `html.ts` (preview + print-to-PDF), `samples.ts`.
- `src/lib/llm/`: `providers.ts` (OpenAI-compatible, Anthropic, Gemini streaming over `fetch`), `presets.ts`, `mcp.ts` (minimal Streamable-HTTP client), `tools.ts` (OpenAI-compatible tool loop).
- `src/components/`: Chat (4 modes, joke dial 0-4, send-to-export), Export (form + paste + preview + DOCX + PDF + profile + Thai digits + optional garuda upload), CopyPrompt, SettingsPanel (presets, key in sessionStorage by default, MCP list), Disclaimer.
- `README.md`, `LICENSE` (MIT), `scripts/smoke-export.ts`, `scripts/mock-server.mjs`.

### Deviations from the decision
- No Vercel AI SDK: raw `fetch` + SSE for the three provider kinds (fewer dependencies, same coverage).
- No pass-through CORS proxy yet; the UI explains CORS failures instead.
- MCP works for OpenAI-compatible providers only (non-streaming tool loop).
- Labour court: complaint (รง.๑ style), บัญชีพยาน and one generic คำร้อง schema, not the ~6 complaint variants and 10 petition types; the interview prompt covers the wage / notice / severance / damages cases.
- หนังสือประทับตรา and รายงานการประชุม not rendered.

### Verified
- `npm run build` and `tsc --noEmit` pass.
- All 5 sample documents render to DOCX, open with macOS `textutil` and read back with the right Thai text; parse/serialize round trip holds; fenced AI output with surrounding chatter parses.
- Chat streaming and the MCP tool loop work against `scripts/mock-server.mjs` (a fake OpenAI endpoint and fake MCP server). Preview of a หนังสือภายนอก looked right in the browser.

### NOT verified
- No real model has been called: no check of Thai quality, of whether models follow the output template, or of the preset URLs/model names (Typhoon, ThaiLLM, etc.).
- Print-to-PDF dialog flow and DOCX in Word were not tested (only textutil and the HTML preview).
- Layout positions are approximations of the university manual; labour-court look not matched to the court's own .doc (fonts and spacing unread).
- Thai-font fallback: if TH Sarabun New is not installed, the preview uses Google's Sarabun and Word substitutes.
