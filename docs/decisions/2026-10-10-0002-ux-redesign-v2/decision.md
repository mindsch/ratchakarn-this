# 0002 — UX redesign v2 (brand, components, flows)

**Status:** Confirmed. Figma design is partly built: research + taste pass, brand v1, 23 v2 components, 6 v2 desktop screens (F02 is being refined in a separate hi-fi session). The code rewrite has not started; see `handoff.md` for the build session.
**Date:** 2026-10-10
**Supersedes:** the UI/flow parts of 0001 (tabs, chat-for-everything, Format as a chat mode, Court as a chat mode). The prompt pack, BYOK providers, deterministic DOCX/PDF export and disclaimers in 0001 stand.

## Context
v1 (0001) was a first pass and its UX is weak. Problems, from reading `App.tsx`, `Chat.tsx`, `CopyPrompt.tsx` and `prompts/modes/format.md`:

Raised by the user:
- **Open prompt is one blob.** The พรอมต์ tab has four variants as chips; "ฉบับรวม" is about 49 KB in a 22-row textarea. A user cannot tell which prompt does what, what to copy, or where to paste. "Bring the result back" lives in an intro paragraph and quotes the raw marker `===RATCHAKARN-DOC===`.
- **จัดรูปแบบ regenerates the text.** Format is a chat mode: the text goes to the model by default and the model re-emits the whole letter. It can drift from the user's words, and nobody says what is missing before export. Needed: review first, ask for missing info, AI is opt-in, AI must never change the user's content.

Found while reviewing:
- The pipeline (write → check → export) is invisible; the hand-off button only appears if the model emits the marker block.
- No API key is a dead end: the chat looks ready and errors only on send.
- The 0–4 joke dial and ศาลแรงงาน drafting share one chip row and one chat.
- Everything is a chat, though only Draft and Court are conversational.

Working method (the user's): Mobbin research → put it in Figma → agree the brand together → build components → hi-fi in Figma → only then rewrite the code. Taazo (`rkw5L0yw3oxiT9D04kOVNA`) is a read-only reference for file structure; Kibou (`dWAIJflb2TqEFab77OFTmv`) shows the working style (Read me note, M01-style frame names, DRAFT/REFERENCE prefixes, everything bound to variables).

## Decision

### 1. Information architecture
Four items in the top bar: **แชท · ร่างเอกสาร · จัดรูปแบบ · พรอมต์**. Settings (AI key, โหมด XP replica) is separate.
- **แชท** = the ภาษาราชการ converter with the 0–4 dial (the former แปลงภาษา).
- **ร่างเอกสาร** = no text yet; the user needs a draft. Court drafts (ศาลแรงงาน) are document types inside it, not a separate mode.
- **จัดรูปแบบ** = the user already has text and needs it formatted.
- **พรอมต์** = copy-prompt library for people using their own AI.
- **ออกเอกสาร is no longer a tab.** It is the last step of ร่างเอกสาร and จัดรูปแบบ.

### 2. ร่างเอกสาร: a fact form, not a chat
1. Pick type and purpose (for example หนังสือภายนอก → เชิญ, or a court draft).
2. Fill the facts. Fields come from the purpose's formula slots (`prompts/doctypes/letters.md`) and from `DocTypeDef.headKeys/footKeys` (`src/lib/doc/types.ts`). Each field has a plain-language question, an example and **ข้าม** (leaves `[ระบุ...]`). An optional "เล่าให้ AI ฟังคร่าวๆ" box lets AI pre-fill the fields; the form stays the source of truth and the user edits it.
3. Shared workspace: form boxes beside a live A4 preview. The body is assembled from the facts; "AI ช่วยร่าง" can write it up as polished prose.
4. Export (DOCX/PDF).
Court drafts use the same form with their own sections (ผู้ฟ้อง, นายจ้าง, ข้อเท็จจริงตามลำดับเวลา, ค่าเสียหาย). AI never invents facts.

### 3. จัดรูปแบบ: blob into boxes, code first
1. Paste a blob. This is also the single entry for text that comes back from an external AI (it replaces pasting the marker into ออกเอกสาร).
2. **Code, not AI**, sorts the blob into the form boxes (ที่, วันที่, เรื่อง, เรียน, เนื้อหา, ผู้ลงชื่อ…), showing the original beside the boxes with the assigned chunk highlighted. The user can drag chunks between boxes or click a box to reassign.
3. A checklist "ข้อมูลที่ยังขาด" lists missing facts. Each row is an input plus ข้าม.
4. Optional **AI ตรวจทั้งฉบับ** returns suggestion cards (missing info, spelling, วันที่ พ.ศ., คำลงท้าย). Each card has Accept and Keep original; keep original is the default. Code verifies the body is unchanged unless the user accepts a card.
5. Export.
AI is off by default in this flow.

### 4. AI helpers
Two in the app:
- **AI ช่วยร่าง**: from a short brief and/or the facts, drafts into the form boxes. Missing facts stay `[ระบุ...]`.
- **AI ตรวจทั้งฉบับ**: reads the whole document and returns suggestion cards only.

Dropped from the app:
- **AI ช่วยถาม as a chat.** The fact form replaces it, works without a key, and is faster for court-style facts. It remains as a prompt card in พรอมต์ for users who want to interview in ChatGPT/Claude.
- **Per-row "ให้ AI ช่วยถาม"** on checklist rows, and any AI button on the checklist header. AI cannot supply facts like วันที่, สถานที่, ผู้ลงชื่อ; only the user can.

Every in-app AI button carries "ไม่มีคีย์? คัดลอกพรอมต์แทน". พรอมต์ cards: แปลงภาษา, ช่วยร่าง, ช่วยถาม (external interview), ตรวจ & จัดรูปแบบ, plus "ฉบับรวม" demoted to an Advanced card, with a 3-step strip (Copy → Paste in your AI → Bring the result back) and a "ดูพรอมต์ทั้งหมด" drawer. The format prompt needs its own file and must stop telling the model to re-emit the letter.

### 5. Brand: "Calm with a joke"
- **Base: Direction 3.** Paper `#F6F5F2`, surface `#FFFFFF`, navy ink `#1B2A41`, muted `#5E6878`, line `#DEDBD2`, stamp red `#C8372D`, mint `#B8E6DC`, pink `#F9D9D6`, wink yellow `#FFD84D`. Radius 8 (buttons) to 12 (cards), hairlines.
- **Subtle retro, only on banners and pop-ups:** black title strip, 1.5–2px border, hard 3px shadow, pixel-font tag. Buttons, forms and cards stay calm.
- **XP replica mode:** opt-in toggle in Settings, labelled just "โหมด XP replica". It swaps the chrome tokens: XP blue `#0046D5` gradient title bar, beige `#ECE9D8` window body, segmented green progress, soft XP shadow, 8px window radius, and deadpan system-message copy. Palette values come from the Stupid Hackathon X stylesheet.
- **Rules:** jokes live only in chrome copy (banners, pop-ups, loading), never in generated documents. No desktop welcome screen. No court row in Settings.
- **Logo: Direction 1.** Red ring with ๛, Trirong wordmark **แปลเป็นราชการ** + "Ratchakarn-this". (Thai name changed from ราชการนี้ on 2026-10-10.)
- **Type:** IBM Plex Sans Thai (UI, `TH/`), IBM Plex Sans (`EN/`), **Sarabun only on the paper** (`Doc/`), Pixelify Sans for letters-only micro-tags and never for numbers (`Pixel/`), Trirong (logo only, `Logo/`).

### 6. Figma file and components (done)
File: `RyaDjrolWmaXIVR4G6z26c` (Starter team). Pages: Cover, 🔎 Research, 🏷 Brand, 🎨 Foundations (empty, deferred), 🧩 Components, 🖥 Screens · Hi-fi (empty).
- **Variables:** Primitives (124), Tokens (64; modes **Standard** and **XP replica**), Dimensions (23); scopes and WEB code syntax set. Chrome tokens drive XP mode, including three boolean tokens (title-bar gradient, smooth progress, segmented progress) and shadow/radius tokens, so XP mode needs no separate component variants.
- **Styles:** 26 text styles, 3 effect styles.
- **Components (15):** Logo Mark, Logo Lockup, Button, Input, Chip, Tab, Toggle, Tag, WinButton, Progress, Banner, Pop-up, StepItem, Stepper, ChecklistRow, PromptCard. Review frames show Standard vs XP replica and an assembled Check step.
- **Explorations kept as-is** on the Brand page for reference: Directions 1, 2, 3 and 3R, and the Brand v1 board (left of Direction 1).

### 7. Device and order
Desktop (1440) first, then mobile (390) for the Format flow. Screen order (design order, not feature importance): shared workspace (form + A4 + export) → จัดรูปแบบ → ร่างเอกสาร → พรอมต์ → แชท → Settings and AI setup (key, "skip for now", โหมด XP replica).

## Reasoning
- Code first, AI second: parsing, checklist, layout and the fact form are deterministic, so the tool works with no key and the user's words cannot drift.
- AI can only ask or suggest; facts come from the user. A form shows everything needed at once, where a chat hides the list.
- Both modes converge on one workspace, so the pipeline is visible and export is never an optional button.
- One prompt per outcome, named by outcome, answers "what do I copy and where do I paste it".
- XP mode as a token mode (with boolean tokens) keeps one set of components; Standard stays calm and trustworthy for court and official drafts.
- Direction 3 as base keeps a safe home for the fun dial; the retro stays on chrome, which is where the hackathon theme reads without hurting trust.

## Alternatives considered
- Keep an in-app AI ช่วยถาม chat: rejected; slower, hides what is needed, and a per-row AI button implies AI can supply facts.
- Three tabs (แชต / ออกเอกสาร / พรอมต์) as today: rejected; the pipeline stays invisible.
- Direction 1 (serif, no humour) or Direction 2 (loud): rejected; too dry, or damaging to trust in official drafts.
- Full XP desktop welcome screen: rejected by the user.
- XP replica as component variants: replaced by token modes plus boolean tokens.
- A separate Court mode and a court row in Settings: rejected; court drafts are document types and must not be joked about.
- Foundations page now: deferred until requested.

## Open questions
- Drag-and-drop chunk reassignment in จัดรูปแบบ: confirm feasibility for v1, or fall back to click-to-assign.
- Body phrase templates per purpose do not exist as code yet (they live only in the prompts). The rewrite needs short templates for the common purposes; until then AI ช่วยร่าง writes the body.
- No Thai pixel font in Figma; Pixelify Sans only covers Latin tags. The ๛ glyph in Trirong renders as a small swirl at small sizes.
- Figma tools were signed in as `sasi_cha60@tbs.tu.ac.th`, not the user's Git email; confirm this is the intended account for the file.
- Mobile layouts and the Foundations page are not started.

## Next step
Design the remaining desktop screens (พรอมต์ page with drawer, แชท, Settings and first-run AI setup, court document types in the D flow), then mobile for the Format flow, then revise hi-fi with the user. Code rewrite only when the user says "go build 0002"; `plan.md` lists the ordered tasks.

## Update: taste pass and v2 (2026-10-10, later)
User feedback: the first screens looked like AI-generated UI, fonts were inconsistent (Sarabun outside the paper), pixel-font numbers were unreadable, and the Thai name should be แปลเป็นราชการ.
- Research page › **Taste pass** lists the tells in v1 (container soup, rainbow status, circle stepper, pills, no hero, retro in name only, font leaks) and 8 Mobbin references (Bonsai fill-in form and editor, Contractbook, Square, Upwork, Basecamp, Substack, Deel).
- v1 components and screens were **archived, not deleted**, to `🗄 Archived · v1 components & screens`. v2 components were rebuilt on the 🧩 page with the new rules: radius 4, hairline rows, flat banner with the tone only on a tiny tag, text stepper, paper with hard shadow, 2px ink rule under the nav, label strips, fill-in sentences for the draft form.
- v2 screens: F01, F02 (pilot), F03, F04, D01, D02. The user judged F02 "still sloppy but closer" and will run a separate higher-fidelity pass on F02; the rest follow its direction afterwards.
- Dropped components: Chip, ProviderTile, OptionCard, FieldBox, SuggestionCard, StepItem (replaced by FieldRow, SuggestionRow, text Stepper, OptionRow). Drawer and PromptCard will be rebuilt when the พรอมต์ page is designed.

## What got built (Figma, first pass, superseded by the update above)
File `RyaDjrolWmaXIVR4G6z26c`. No repo code changed yet.
- **Components page (24 sets/components):** Logo Mark, Logo Lockup, Button, Input, Chip, Tab, Toggle, Tag, WinButton, Progress, Banner, Pop-up, StepItem, Stepper, ChecklistRow, PromptCard, plus this round's NavItem, NavBar, FieldBox, SourceChunk, SuggestionCard, DocPreview (A4), BriefBox, ProviderTile, Drawer, OptionCard. ChecklistRow no longer has the AI button (input + ข้าม only).
- **Screens · Hi-fi (desktop 1440), all from component instances:**
  - จัดรูปแบบ: F01 วาง, F02 ตรวจ (original chunks | form boxes | A4), F03 AI suggestions (opt-in), F04 ออกเอกสาร.
  - ร่างเอกสาร: D01 pick type + purpose, D02 fact form + brief box + live A4.
  - Both modes use a three-step stepper: Format = วาง → ตรวจ → ออกเอกสาร; Draft = เลือกชนิด → กรอกข้อมูล → ออกเอกสาร.
- **Not yet designed:** พรอมต์ page, แชท, Settings and AI setup, court-type variants of D01/D02, mobile, Foundations page.

## Update: foundations v3, Deel base (2026-10-10, later)
User feedback: the cream page background made everything look like AI slop; switch to a Deel style and keep beige only for the area behind the paper. Rebuilt in Figma (variables kept their IDs, so components stay bound):
- Grey canvas + white cards + near-black ink actions (Deel). New `grey/*` ramp; old `neutral/*` renamed `warm/*` and used only by `bg/desk` (the bed under the A4).
- New tokens: `bg/desk`, `surface/raised`, `surface/selected`, `border/subtle`, `action/tertiary/*`; semantic radius `radius/{control 8, card 12, overlay 16, tag 6, paper 0}`; effect styles Shadow/Paper, Shadow/Overlay, Shadow/Focus ring.
- Headings SemiBold (36/28/22/18), labels Medium. Navy only in the logo; Standard chrome uses grey/900.
- Supersedes in §5 Brand: "Paper #F6F5F2" as page background, radius 4, and "no pills" (tags now radius 6 tinted with a dot). Retro on banners/pop-ups and XP replica are unchanged.
- Foundations page `2:4` (frame `43:2`) documents all of it. **Components and screens are not restyled yet**; that is the next pass, once the user approves the foundations.
