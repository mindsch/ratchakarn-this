# Shape: how 0002 moved

**Planned:** 2026-10-10

Scope changed several times during the discussion. What each reversal was, so nobody re-opens it by accident.

1. **Format flow.** Started as "review the text, ask for what is missing, AI opt-in". Became "paste a blob, code sorts it into form boxes, user can move chunks, AI check is optional". The model never regenerates the body.
2. **AI helpers.** Started as three (ช่วยร่าง, ช่วยถาม, ตรวจทั้งฉบับ) plus a per-row "ให้ AI ช่วยถาม" button in the checklist. Ended as two in the app (ช่วยร่าง, ตรวจทั้งฉบับ). ช่วยถาม became the fact form; the per-row and header AI buttons were dropped because AI cannot supply facts. ช่วยถาม survives only as an external prompt card.
3. **Brand.** Three directions were drawn (calm / loud / hybrid). The user chose the hybrid (Direction 3), asked to add retro from the Stupid Hackathon X site and Poolsuite FM (Direction 3R), then refined: Direction 3 stays the base, retro only as subtle touches on banners and pop-ups, the XP joke becomes an opt-in "โหมด XP replica" toggle in Settings, no desktop welcome screen, logo from Direction 1.
4. **Court.** Was a chat mode, then a separate mode, then folded into ร่างเอกสาร as document types. A court row in the Settings mock was removed ("we should not ดูหมิ่นศาล"); the toggle is just "โหมด XP replica".
5. **XP replica implementation.** Planned as a component variant, then built as a Tokens mode with boolean tokens (gradient, smooth/segmented progress) plus shadow and radius tokens, so one set of components serves both modes.
6. **Foundations page.** Was about to be built; the user asked to hold it. Variables and styles exist in the file but have no documentation page yet.
7. **Order of work.** Started as "Format first"; with the new IA the first screen is the shared form + A4 workspace.
