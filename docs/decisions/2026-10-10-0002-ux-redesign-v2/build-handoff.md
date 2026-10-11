# Build 0002: state and what to do next (2026-10-10, end of session)

The user said "go build 0002" and made Claude (Opus) the manager. The code rewrite is **mostly built and verified, but not reviewed in screenshots yet and not committed**. Branch: `build-0002` (created from `main`; nothing committed; commit only when the user asks). Design source: Figma `RyaDjrolWmaXIVR4G6z26c` (node ids in `handoff.md` §0).

## What exists
| Area | Files | Built by |
|---|---|---|
| Tokens (generated from Figma variables), base + component CSS incl. mobile rules | `src/styles/tokens.css`, `src/styles/ui.css` | manager |
| Shared components (Button, Card, StatusTag, Stepper, PageHeader, FieldRow, inputs, Toggle, Segmented, OptionRow, Tabs, Banner, Popup, Progress, Drawer, Paper, icons) + NavBar | `src/ui/index.tsx`, `src/ui/NavBar.tsx` | manager |
| App state: hash routes, settings, XP mode (`ratchakarn.xp.v1`), shared `DocState` + `finalDoc` | `src/lib/app.tsx`, `src/App.tsx` | manager |
| AI helpers + output contracts (check / prefill / draftBody) | `src/lib/ai.ts` | manager |
| Standard vs XP chrome copy | `src/lib/copy.ts` | manager |
| จัดรูปแบบ (วาง → ตรวจ → AI suggestions) + shared ออกเอกสาร step | `src/pages/format/`, `src/pages/export/`, `src/lib/doc/sort.ts`, `src/lib/doc/check.ts` | Sonnet agent |
| ร่างเอกสาร (D01/D02 + 3 labour-court types), purpose templates | `src/pages/draft/`, `src/lib/doc/templates.ts` | Sonnet agent |
| Prompt pack (renamed to แปลเป็นราชการ; new check/prefill/draft-body/interview; format no longer re-emits), build script, พรอมต์ page + drawer | `prompts/**`, `scripts/build-prompts.mjs`, `src/generated/`, `public/prompts/`, `src/pages/prompts/` | Sonnet agent |
| แชท converter (0–4 dial), Settings, first-run AI dialog | `src/pages/chat/`, `src/pages/settings/` | Sonnet agent |
| Removed v1 | `src/components/{Chat,CopyPrompt,Export,SettingsPanel}.tsx`, `src/styles.css` (Disclaimer kept, restyled as a calm `.note`) | manager |

## Verified (all passing at end of session)
- `npx tsc --noEmit`, `npm run build`.
- `npx tsx scripts/test-sort.ts`, `test-check.ts`, `test-templates.ts`, `scripts/smoke-export.ts /tmp/rk-out`.
- E2E click-through `dev/e2e.mjs` (real headless Chrome + `scripts/mock-server.mjs`, which now answers the check/prefill contracts):
  - Format: sample → sort → AI check → paper unchanged until a suggestion is accepted, changes after; the bogus suggestion (original not in doc) is rejected; → export → DOCX click.
  - Draft: D01 → D02 → brief box → export → back → ศาลแรงงาน D01-C → D02-C.
  - Chat: convert via mock streams; "ส่งไปจัดรูปแบบ" goes to `#/format` with the text.
  - Settings: connection test; XP toggle sets `data-theme="xp"` and survives reload.
  - Mobile 390: M-F02 (+ A4 switch), M-D02, chat, settings, prompts.
  - Console: one 404 resource error on a 1440 page (not identified yet).

## Do next (in order)
1. **Look at the E2E screenshots** (re-run `dev/e2e.mjs`; images land in `dev/`, delete them after) against the Figma frames, desktop and 390. Fix visual gaps. Known ones:
   - F01 วาง (desktop): paste card is centred while the title is left-aligned, and the "วางมาจากไหนก็ได้" side card from F01 is missing. Use `.cols.side` like the Figma.
   - พรอมต์ page: the extra ศาลแรงงาน card leaves an empty grid slot. Make the odd last card span both columns, or pair it with ฉบับรวม.
   - Find the 404 (check the Network tab / vite log; likely a favicon or an image path).
2. Check court screens with XP on (`D02-C-xp.png`): nothing on court pages may change with XP.
3. **Run with a real model** (Typhoon or Claude key in Settings): AI ตรวจทั้งฉบับ returns valid `CheckSuggestion[]` JSON; prefill fills only stated facts; AI ช่วยร่าง keeps `[ระบุ...]`. Tune `prompts/modes/check.md`, `prefill.md`, `draft-body.md` (then `npm run prompts`). This is the biggest unknown; v1 was never run against a real model either.
4. Open the downloaded DOCX in Word and try "บันทึกเป็น PDF" (print) once; neither was checked by eye.
5. Docs: rename ราชการนี้ → แปลเป็นราชการ in `README.md` and `docs/README.md`; describe the new pages, `dev/` tools and tests; mark `decision.md` "What got built" for 0002.
6. Ask the user to review, then commit on `build-0002` (end the message with the Co-Authored-By line) and open a PR if they want.

## Open decisions for the user (from agents' reports)
- Court forms assume employee-sues-employer (stated in the "ก่อนยื่นจริง" card); court paper layout and disclaimer wording are approximations of the labour court's own templates.
- F04 page-layout options come from the real `PROFILES` in `layout.ts` (the Figma's invented "แบบกะทัดรัด" was not used).
- ร่างเอกสาร adds editable เรื่อง and ส่วนราชการ rows not in the Figma.
- AI body text in ร่างเอกสาร stays after editing facts; "ใช้เนื้อหาตามช่องกรอก" reverts it.
- Draft state survives tab switches but not a reload. Money amounts are not converted to Thai words.
- AI prefill fills flat slots only (not court timeline/claim rows).
- In แชท, "แปลง" is disabled without a key (the notice offers ใส่คีย์ AI / คัดลอกพรอมต์แทน).

## Dev tools
- `npx vite --port 5173` (dev server), `node scripts/mock-server.mjs` (fake OpenAI-compatible LLM on :8787 incl. check/prefill JSON).
- `scripts/shot.sh <route> <out.png> [width] [height] [mock]`: headless Chrome via `dev/app.html` (phone-width iframe for width ≤ 500; dismisses first-run; `mock=1` points AI at the mock).
- `dev/e2e.mjs`: click-through (install `puppeteer-core` outside the repo, see its first line).
