# 0003 — Joke themes (XP / ราชการไทย / TH-AI Passport)

**Status:** Built 2026-10-12, not committed. Default look verified unchanged (see "What got built"). See `plan.md`.
**Date:** 2026-10-12
**Supersedes:** the chrome-only `[data-theme="xp"]` / "โหมด XP replica" from 0002 (XP becomes one of four full themes). Everything else in 0002 stands.

## Context
The app ships one look (Deel-style grey canvas, white cards, ink buttons) plus a chrome-only XP replica for banners and pop-ups. The user wants three more full re-skins as a joke the visitor can toggle: Windows XP, ราชการไทย (brown / cream / yellow, Sarabun, Traditional Thai feel), and TH-AI Passport (blue and tokens from aipass.go.th).

## Decision
- Four themes: `standard` (the original look, no overrides), `xp`, `gov`, `aipass`. Set by `data-theme` on `<html>`, saved in localStorage, defaulting to `standard`.
- Each non-default theme is a token override of the existing semantic layer in `src/styles/tokens.css` (same names), plus a small set of component rules where a token cannot express the look (XP bevel, gov double-rule frame, AI Pass brand panel).
- The brand spec is `brand-themes.html` in this folder (approved). Its token objects are the source for both the CSS and the Figma variables.
- The A4 paper is never re-themed. Exported DOCX/PDF are identical in every theme.
- No ครุฑ emblem, Windows logo or Bliss photo, AI Pass logo or wordmark. Only colour, type, shape.
- Figma: add the three themes as modes on the existing Tokens collection in file `RyaDjrolWmaXIVR4G6z26c`, with new primitive scales as needed, so the Figma file and the CSS stay one system.
- Choices taken for the three open questions in the spec (the user did not override them): XP canvas is flat Luna blue; AI Pass canvas is flat grey with the gradient only on banners and the export-done card; gov uses Trirong on page titles only.

## Reasoning
Overriding the semantic tokens means no page code changes per theme and a new theme later is one block. The toggle lives only in Settings (ตั้งค่า), so the nav stays exactly as it was; a nav button was tried and removed at the user's request.

## Alternatives considered
- Per-theme stylesheets swapped at runtime: more files, drift from the token layer.
- Theme only in settings: the joke is lost if nobody finds it.
- Re-theming the A4 paper: rejected, it would put the document's correctness at risk.

## Open questions
- Whether to add optional XP/gov microcopy ("Start", ที่ / วันที่ / เรียน). Not in this build.
- Real-browser Tahoma/Trebuchet fallback on non-Mac/Windows machines (falls back to Noto Sans Thai).

## Next step
Build per `plan.md`.

## What got built
Figma (file `RyaDjrolWmaXIVR4G6z26c`):
- Tokens collection: modes Standard (unchanged), XP (was "XP replica", now a full theme), Gov, AI Pass. 10 new tokens (`text/title`, `nav/*`, `font/*`, `chrome/shadow/x`); all 80 tokens have a value in every mode.
- Primitives: +79 (xp, teak, cream, gold, vermilion, moss, indigo, aibrand, aiaccent, aigray, aistatus), 138 → 217.
- Dimensions collection: modes Standard (was "Value"), XP, Gov, AI Pass; radius control/card/overlay/tag/pill per mode; new `radius/2`, `radius/3`, `radius/pill`.

Code:
- `scripts/gen-themes.mjs`: the one data source; writes `src/styles/themes.generated.css`. Figma was filled from the same object.
- `src/styles/themes.generated.css` (new): primitives, per-theme token overrides, standard values for the new tokens.
- `src/styles/themes.css` (new, by hand): component rules per theme (XP bevel/dotted focus/gradient chrome, gov double-rule cards and gold nav rule, AI Pass float shadows and brand-panel title bars). All scoped to `[data-theme=...]`.
- `src/styles/tokens.css`: removed the chrome-only `[data-theme="xp"]` block.
- `src/styles/ui.css`: fonts, nav, pill radius, logo font, banner/window shadow now read the new tokens; XP-only rules moved to themes.css; 
- `src/lib/theme.ts` (new): theme list, load/save, migrates the old `ratchakarn.xp.v1` flag to `xp`.
- `src/lib/app.tsx`: `useTheme`; context exposes `theme`, `setTheme`, and keeps `xp = theme === "xp"` so `chrome()` jokes are unchanged. `setXp` removed.
- `src/main.tsx`: imports the new CSS, sets the saved theme before first paint.
- `src/pages/settings/index.tsx`: the XP toggle became a four-option ธีม control (works on mobile).
- `index.html`: Noto Sans Thai, Noto Sans Thai Looped, Sarabun 500/600, Trirong 600 added to the font request.

Verification:
- Default theme vs the pre-change build (restored from HEAD): chat, draft, format, prompts at 1440 and 390 are pixel-identical with 0 computed-style differences on every element. Settings differs only by the new picker; the nav is unchanged.
- `tsc --noEmit` clean; `vite build` succeeds. No page errors in any theme.
- Not verified: the pop-up window and banner chrome in gov/aipass beyond the settings banner, and DOCX/PDF export byte-equality across themes (paper CSS does not read themed tokens, but I did not export).
