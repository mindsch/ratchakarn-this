# Handoff: building 0002 in code (for the build session)

Read first: `decision.md` (what and why), this file (how and where), `plan.md` (older task list; this file supersedes section B). The code rewrite starts only when the user says "go build 0002".

## 0. State of the design (Figma file `RyaDjrolWmaXIVR4G6z26c`)
Use the Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) on these nodes; do not guess values.
| What | Where |
|---|---|
| Components (v2, 23 sets) | page 🧩 Components `2:5` |
| Screens v2 desktop 1440 | page 🖥 Screens · Hi-fi `2:6`: F01 `32:158`, **F02 `31:2` (pilot)**, F03 `32:233`, F04 `32:427`, D01 `32:532`, D02 `32:686` |
| Brand v1 board (palette, logo, type, modes, Settings toggle) | page 🏷 Brand `2:3`, node `11:2` |
| Research + Taste pass (why v1 looked AI-made, the moves) | page 🔎 Research `2:2`, Taste pass `26:2` |
| Old v1 components/screens | page 🗄 Archived `26:1018` (do not build from these) |

**F02 is being refined in a separate session** (a higher-fidelity pass). Build the structure from F02/F01/F03/F04/D01/D02 now, but re-read F02 before styling the shared workspace. If F02 changed, the refined version wins and the other screens should be brought in line.

**F02 audit pass (2026-10-10, Opus): F02 `31:2` is now the reference.** Old F02 archived as `38:1505` on the Archived page. What was wrong and what changed, so the same moves can be applied to F01, F03, F04, D01, D02:

| Tell (why it read as AI-made) | Fix applied |
|---|---|
| Three boxed columns of equal weight; the "original" panel repeated the field values word for word | Removed the original panel. One work column (776) + the paper (520), gap 64. The original is one click away ("ดูต้นฉบับทั้งหมด"); only text code could **not** place is shown, in a "ข้อความที่ยังไม่ได้จัด (n)" tray under the form, with a guess label ("น่าจะเป็น: ผู้ติดต่อ · โทร."), "จัดเข้าช่อง ▾" and "ไม่ใช้". *Deviation from decision §3 ("original beside the boxes"); the user should confirm.* |
| Missing state said three times (WARN banner + 5/7 + red "ขาด" per row) | No banner. One status line under the title: "จัดเข้าช่องแล้ว 5 จาก 7 · **ขาด 2 ช่อง** · …". Banners are for events (AI done, error), not standing state. |
| Explanatory subtitle describing the UI | Replaced by that status line. |
| Empty field was underlined grey "[ระบุ...]", which doesn't look typeable | FieldRow Empty = real input box (white, 1px border, radius 4) with a per-row **Hint** prop (new: `Hint`), red 6px dot before the label, "ข้าม" on the right. Focused row uses `border/focus` 2px. |
| Grip dots on filled rows (nothing to drag) | Removed from FieldRow Filled. |
| Skipped row was a dead "ข้ามแล้ว" label | "ข้ามไว้" + ghost "เลิกข้าม" (undo). |
| Actions 400px below the work, at the page bottom | Footer (rule + actions) sits at the end of the work column. |
| Secondary button 3px taller than Primary/Ghost | Fixed in Button (1.5 stroke ate padding). |
| Paper didn't look like a real หนังสือภายนอก: date on the ที่ line, signature flush right, no paragraph indent | DocPreview: margins 3cm left / 2cm right at scale, date on its own line from the centre (no "วันที่" prefix), indented paragraph (2.5cm), closing + signature centred from the middle, signature space, 60px ครุฑ slot. `[ระบุ...]` shown in `text/danger` on the preview only (caption says it prints black). |
| "✓" in the stepper rendered from a fallback font (IBM Plex Sans has no U+2713) | Stepper uses a vector check. **In code use an inline SVG, not the character.** |
| Thai words broken mid-word in Figma ("วิทยากรบรรย/าย") | Figma copy uses U+200B between words. **Code must not store ZWSP**; browsers segment Thai themselves. |

Rules to carry over: one column of work + the paper; never show the same data twice; state lives in one line of text, not banners; inputs look like inputs; actions follow the work; Sarabun only on the paper. Component changes (FieldRow, DocPreview, Stepper, Button, SourceChunk padding) already flow into the other screens, but **check D02, F03, F04 after the change**: DocPreview's date moved into a new "Date line" frame, so per-screen Date overrides may have reset to the default.

**D02 `32:686` is the second v3 reference (2026-10-10).** Same layout as F02 (work column 752 + paper on the `bg/desk` bed). Order in the work column: a slim optional AI row ("มีเรื่องเล่าคร่าวๆ? ให้ AI เติมช่องว่างให้", tertiary "เปิดกล่องเล่าเรื่อง"; it expands to BriefBox) → **ข้อเท็จจริง** card (fill-in sentence, "ขาด 3 จาก 6") → **หัวและท้ายหนังสือ** card (ที่, วันที่, ผู้ลงชื่อ, ตำแหน่ง) → actions. The paper body is assembled word for word from the sentence; blanks show as red `[ระบุ...]`. หนังสือภายนอก dates carry no "วันที่" prefix. F01 `32:158`, F03 `32:233`, F04 `32:427`, D01 `32:532` were brought to v3 on 2026-10-10 (old copies on the Archived page). F04 layout-profile copy ("แบบกะทัดรัด", margin values) was invented by the design pass and needs the user's check. Still v2 inside components: OptionRow (radius 4, 1.5px ink selected border), Tab (underline), SuggestionRow; restyle in the components pass. New components: **Status tag** `53:55` (Tone Success/Warning/Danger/Info/Neutral) and **Color token** `52:40` (Foundations docs). Stepper done tick is green (`feedback/success/icon`); upcoming steps use `text/muted`.

**New v3 screens (2026-10-10, Sonnet subagents, checked by Opus):** พรอมต์ P01 `58:2689` (library: 3-step card, 4 outcome cards, ฉบับรวม advanced) + P02 `58:2824` (prompt drawer); แชท C01 `58:3926` (converter with 5-stop dial segmented control, hand-off "ส่งไปจัดรูปแบบ →") + C02 `58:4034` (no key: notice with ใส่คีย์ AI / คัดลอกพรอมต์แทน, starters); Settings S01 `58:809`, first-run AI setup S02 `58:998`, XP on S03 `58:901`; court D01-C `58:634`, D02-C `58:3587`. NavBar has a new variant **Active=Settings** (no tab highlighted). User must verify: court paper layout + disclaimer wording (approximated), prompt sizes for ช่วยถาม/ตรวจ (no files yet), invented chat sample copy. Prompt files still say the old name ราชการนี้ (rename in the build).
**Mobile (390) Format flow (2026-10-10):** M-F01 `60:2588`, M-F02 `60:2625`, M-F03 `60:2739`, M-F04 `60:2837` (row y=7200). Pattern: top bar (logo, "พรอมต์" sparkle pill, gear) → tool switch strip (NavItem pills) → content padding 16 → a "ช่องเอกสาร | ตัวอย่าง A4" segmented switch instead of side-by-side paper → sticky bottom action bar (primary full width). Known gaps: FieldRow keeps label-left on mobile (needs a stacked variant in code: label above input under ~480px); top-bar pill/gear are 36px (give them 44px hit areas in code).
**Components pass v3 (2026-10-10):** Button radius/control 8 + Secondary 1px; OptionRow 1px default, selected = 1px ink; BriefBox = card (no strip); Input radius/control + Shadow/Focus ring on focus; Tag Neutral = tinted; SuggestionRow diff (Open: original struck muted + suggestion underlined; Accepted: original struck; Kept: suggestion struck); PanelStrip renamed DEPRECATED. Retro components (Banner, Pop-up, WinButton, Tag Chrome) unchanged on purpose.

**Not designed yet (do not invent):** พรอมต์ page + drawer, แชท (converter with dial), Settings + first-run AI setup, court variants of D01/D02, all mobile, Foundations page. For these, restyle the existing v1 UI with the tokens only and ask the user before adding new layouts.

## 1. Product decisions to implement
- Name: Thai **แปลเป็นราชการ**, English **Ratchakarn-this**. (Old Thai name ราชการนี้ is retired; replace in `index.html`, header, README, prompts' titles.)
- Nav (updated 2026-10-10): logo | divider | "ผู้ช่วยเขียนหนังสือราชการ" on the left; **แชท · ร่างเอกสาร · จัดรูปแบบ centred**; right: outline pill with a sparkle "พรอมต์ใช้กับ AI อื่น" and solid ink pill "ตั้งค่า / ใส่คีย์ AI". Selected item = bold (`TH/Label M Strong`) on a light-blue pill (`feedback/info/bg`, `text/link`), a deliberate TH AI Passport (aipass.go.th) joke; it lives only in the nav, the page stays plain grey (a sky-gradient hero was tried and rejected). ออกเอกสาร is step 3 of the two flows, not a tab.
- แชท = the ภาษาราชการ converter with the 0–4 dial. Court (ศาลแรงงาน) = document types inside ร่างเอกสาร.
- Both flows use a 3-step text stepper. Format: วาง → ตรวจ → ออกเอกสาร. Draft: เลือกชนิด → กรอกข้อมูล → ออกเอกสาร.
- **จัดรูปแบบ**: paste blob → **code** (not AI) sorts it into field rows and shows the original as margin-note chunks (assigned = solid rule, unassigned = dashed) → user fixes/skips → optional **AI ตรวจทั้งฉบับ** returns suggestion rows (original struck through, suggestion underlined; Accept / Keep original; keep is the default) → export. The body must stay byte-identical unless a suggestion is accepted; add a code check.
- **ร่างเอกสาร**: pick type + purpose (D01) → fact form (D02) = **fill-in sentences** (the purpose's formula with inline blanks) plus a small header/footer field list; optional brief box ("เล่าให้ AI ฟังคร่าวๆ") lets AI pre-fill blanks; body is assembled from facts by per-purpose phrase templates (to write); **AI ช่วยร่าง** can polish the body. Blank facts stay `[ระบุ...]`. AI never invents facts.
- AI in the app: only **AI ช่วยร่าง** and **AI ตรวจทั้งฉบับ**. No in-app ช่วยถาม chat; no AI button on rows or on the checklist. Every AI button has "ไม่มีคีย์? คัดลอกพรอมต์แทน". The interview survives only as a prompt card in พรอมต์.
- Everything except AI works with no key.
- **โหมด XP replica**: Settings toggle, label only. Persist in localStorage. It swaps chrome tokens only (banners, pop-ups, loading); it never touches the generated document. No court row, no desktop welcome screen.

## 2. Visual rules (foundations v3, Deel base, 2026-10-10; supersedes the taste-pass cream/ink-box rules)
Source of truth: page 🎨 Foundations `2:4`, frame `43:2` (read-me rules, surfaces, tokens, type, spacing, radius, elevation, modes).
- **Canvas is grey** (`bg/default` #F6F6F7). Content sits in **white cards** (`surface/default`, `radius/card` 12), no border, no shadow. Hairline rows inside cards use `border/subtle`.
- **Beige only under the paper**: `bg/desk` (warm/100 #EDEBE5) is the bed the A4 sits on (doc preview, export). Never page background, never inside cards. The paper is white (`brand/paper`) with `Shadow/Paper` (soft), radius 0.
- **Ink near-black** (grey/900 #1B1B1F) for text and the primary button; secondary = white + 1px ink border; tertiary = grey fill (`action/tertiary`). Navy (`brand/ink`) only in the logo; stamp red only in the logo and danger.
- Radius by role: `radius/control` 8 (buttons, inputs), `radius/card` 12, `radius/overlay` 16, `radius/tag` 6, `radius/paper` 0.
- Status = soft tinted tag with a dot (`feedback/*/bg` + `icon`). No full-row colour fills, no rainbow.
- Headings are SemiBold (Display 36, L 28, M 22, S 18); labels Medium; body 17/15/13 at 150% line height for Thai.
- **Retro stays only on banners and pop-ups** (ink title strip, `Shadow/Hard 3`, pixel tag). XP replica swaps chrome tokens only. Overlays in Standard use `Shadow/Overlay`.
- Stepper is text with a drawn check (SVG in code, not the ✓ character).
- **Fonts:** IBM Plex Sans Thai for all UI (TH), IBM Plex Sans (EN), **Sarabun only on the paper**, Pixelify Sans only for letters-only micro-tags, **never for numbers**, Trirong only in the logo wordmark.
- **Components are not yet restyled to v3** (PanelStrip black strips, hard paper shadow, radius 4 are still v2). Do not build them as they look now; wait for the component pass.

## 3. Tokens → code
Figma variables (collections Primitives / Tokens / Dimensions) carry WEB code syntax; generate `src/styles/tokens.css` from them (`get_variable_defs`), same names:
- Primitives: `--grey-{0,25,50,100,150,200,300,400,500,600,700,800,900,950}` (UI base), `--warm-*` (renamed from `neutral-*`; desk under the paper only), `--navy-*` (logo), `--red-*`, `--yellow-*`, `--green-*`, `--xpblue-*`, `--xpgreen-*`, `--beige-*` (XP), legacy `--mint-*`, `--pink-*`, `--desk-*`.
- Semantic: `--color-bg-{default,subtle,inverse,desk}`, `--color-surface-{default,muted,raised,selected}`, `--color-text-{default,muted,subtle,inverse,on-primary,link,danger}`, `--color-border-{default,subtle,strong,focus,danger}`, `--color-action-{primary,secondary,tertiary,ghost,accent,disabled,danger}-*`, `--color-feedback-{success,warning,danger,info}-{bg,text,icon}`, `--color-brand-{stamp,wink,ink,paper}`.
- **Chrome tokens differ by mode** (`:root` = Standard, `[data-theme="xp"]` = XP replica): `--color-chrome-titlebar-bg` (grey-900 | xpblue-600), `-titlebar-text`, `-window-bg` (white | beige-100), `-window-border` (grey-900 | xpblue-600), `-window-control-bg/-border`, `-button-bg/-border/-text`, `-progress-fill` (grey-900 | xpgreen-500), `-progress-track`, `--chrome-shadow-offset` (3 | 2), `--chrome-shadow-blur` (0 | 8), `--chrome-shadow-color`, `--chrome-window-radius` (6 | 8). Booleans: `chrome-titlebar-gradient`, `chrome-progress-segmented` (XP only), `chrome-progress-smooth` (Standard only).
- Dimensions: `--space-{0,2,4,8,12,16,20,24,32,40,48,64}`, `--radius-{0,4,6,8,10,12,16,24,full}`, semantic `--radius-{control,card,overlay,tag,paper}`, `--stroke-{1,2}`.
- Effects: Shadow/Paper, Shadow/Overlay, Shadow/Focus ring, Shadow/Hard 2/3 (retro chrome), Shadow/XP window.
- Fonts via Google Fonts (IBM Plex Sans Thai, IBM Plex Sans, Sarabun, Pixelify Sans, Trirong) or self-hosted; DOCX/PDF keep TH Sarabun New as in 0001.

## 4. Component → code map
Build these as React components, props mirroring the Figma component properties:
NavBar(active) · NavItem · Stepper(step, labels) · PanelStrip(title, right) · Button(variant, size, disabled) · Input(state, label, helper) · Tab · Toggle · Tag(kind) · Banner(tone, message) · Pop-up(kind, title, message) · WinButton · Progress · FieldRow(size, state, label, value; Empty shows ขาด + ข้าม, Filled shows a drag grip) · SourceChunk(tone, text) · SuggestionRow(state, kind, where, original, suggestion) · DocPreview (render the real document HTML from `src/lib/doc/html.ts` at 0.65 scale on the paper) · BriefBox · OptionRow(state, title, hint) · ChecklistRow(kind, label) · InlineField(state, value).

## 5. Ordered tasks
1. Tokens + theming (`src/styles/`), fonts, `data-theme` switch, Settings toggle persistence.
2. Shared components above, with a small dev page that renders every state in Standard and XP.
3. App shell: new `App.tsx` with the four modes + Settings; shared `DocState` (`DocData` + per-field status filled/empty/skipped + source spans).
4. Format flow F01–F04. Extend `src/lib/doc/parse.ts` to return per-field spans and unassigned chunks; reassign by click first (drag later); live paper preview; AI check optional with the invariant check.
5. Draft flow D01–D02. Config per type/purpose (slots from `prompts/doctypes/letters.md`, fields from `DocTypeDef`), sentence templates, body assembly, optional AI ช่วยร่าง.
6. Prompts: `modes/check.md` (suggestions only, never re-emit the letter), rewrite `modes/format.md`, `modes/interview.md` (external ช่วยถาม), per-outcome copy-prompt files; update `scripts/build-prompts.mjs`. พรอมต์ page: simple list until designed.
7. แชท: reduce `Chat.tsx` to the converter with the dial; retheme only.
8. Rename and README/docs; keep `scripts/smoke-export.ts` passing; add a test for blob → fields on the sample letters.

## 6. Copy (Standard vs XP replica)
Loading: "กำลังตรวจเอกสาร…" vs "กำลังเสนอเรื่องผ่านหัวหน้างาน…". Missing field: "ยังไม่มีเลขที่หนังสือ" vs "ไม่พบเลขที่หนังสือ กรุณาอย่าตกใจ". Done: "ส่งออกเรียบร้อย" vs "ประทับตราเรียบร้อย". Error: "ส่งออกไม่สำเร็จ ลองอีกครั้ง" vs "ส่งออกไม่สำเร็จ หัวหน้าไม่อนุมัติ ลองใหม่อีกครั้ง". Generated documents never change with the mode.

## 7. Acceptance checks
- No key: paste → sort → fix → export works; draft form → export works.
- Body text identical before/after AI check unless a suggestion was accepted (test).
- No Sarabun outside the paper; no pixel font on numbers; Thai text never cut mid-word in real browsers.
- Toggling โหมด XP replica changes only banners, pop-ups, progress; reload keeps the setting.
- Court drafts show the disclaimer and are unaffected by XP mode.

## 8. Open questions for the user
- Drag-and-drop reassignment in v1, or click-to-assign only?
- Which purposes get phrase templates in v1 (suggest เชิญ, ขออนุมัติ, ขอบคุณ, ปฏิเสธ first)?
- Hosting fonts: Google Fonts or self-hosted?
- Figma tools were signed in as `sasi_cha60@tbs.tu.ac.th`; confirm the account owns the file.
