# Plan for 0002 (ordered; code tasks wait for "go build 0002")

## A. Remaining design (Figma, `RyaDjrolWmaXIVR4G6z26c`)
1. พรอมต์ page: PromptCard grid (แปลงภาษา, ช่วยร่าง, ช่วยถาม (external interview), ตรวจ & จัดรูปแบบ, Advanced ฉบับรวม), 3-step strip, Drawer with the full prompt.
2. แชท screen (ภาษาราชการ converter with the 0–4 dial; dial uses the yellow wink style only here).
3. Settings + first-run AI setup: provider tiles, key field with the "stays in this browser" line, "skip for now", โหมด XP replica toggle (label only).
4. Court types: D01 with ศาลแรงงาน selected (disclaimer banner), D02 with court sections (ผู้ฟ้อง, นายจ้าง, ข้อเท็จจริงตามลำดับเวลา, ค่าเสียหาย).
5. Mobile (390) for the Format flow, then Draft.
6. Foundations page (when the user asks).
7. Review hi-fi with the user; revise.

## B. Code rewrite (after A is approved)
Files and changes to be refined when this section starts:
1. `src/styles.css`: replace with tokens (CSS variables from the Figma Tokens collection, two themes: standard and `data-theme="xp"`), IBM Plex Sans Thai / Sarabun / Pixelify Sans / Trirong.
2. `src/App.tsx`: four-item nav (แชท, ร่างเอกสาร, จัดรูปแบบ, พรอมต์), Settings entry, shared document state (`DocData`) across Draft and Format.
3. New `src/components/`: NavBar, Stepper, FieldBox, SourceChunk, SuggestionCard, DocPreview, BriefBox, ProviderTile, OptionCard, Drawer, Banner, Popup, Progress.
4. `src/lib/doc/parse.ts`: blob → boxes sorter returning chunk spans per field (for highlighting and reassigning); keep deterministic.
5. `src/lib/doc/`: per-purpose body phrase templates for the common purposes (เชิญ, ขออนุมัติ, ขอความร่วมมือ, ขอบคุณ, ปฏิเสธ, ติดตาม, ร้องเรียน, นำส่ง), driven by `DocTypeDef` and `prompts/doctypes/letters.md`.
6. Invariant check: after AI ตรวจทั้งฉบับ, the body text must be unchanged unless a suggestion is accepted.
7. `prompts/`: new `modes/check.md` (suggestions only, never re-emit the letter), `modes/format.md` rewritten, `modes/interview.md` for the external ช่วยถาม prompt; update `scripts/build-prompts.mjs` and the copy-prompt cards.
8. `src/components/Chat.tsx`: reduce to the converter with the dial; remove Draft/Format/Court modes from the chat.
9. Settings: model/key (existing `SettingsPanel`), plus the โหมด XP replica toggle persisted in localStorage; XP mode never applies to generated documents.
10. Smoke: `scripts/smoke-export.ts` still passes; add a test for blob → boxes on the sample letters.
