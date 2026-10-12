# 0003 plan — joke themes

Source of truth for values: `scripts/gen-themes.mjs` (derived from the `vars` objects in `brand-themes.html`). It fills both Figma and `themes.generated.css`.

## A. Figma (file `RyaDjrolWmaXIVR4G6z26c`)
1. Inspect existing collections (Primitives / Tokens / Dimensions) and their modes.
2. Primitives: add scales that do not exist yet. Gov: `teak`, `cream`, `gold`, plus vermilion / moss / indigo steps. AI Pass: `aipass-brand` (25–900 from the site), `aipass-accent` (cyan, mint, lime, violet), `aipass-gray`, status steps. XP reuses `xpblue`, `xpgreen`, `beige`; add `balloon` and close-red.
3. Tokens collection: add modes **XP**, **Gov**, **AI Pass** next to the existing **Standard** (the old "XP replica" mode is renamed **XP**). Every semantic token (`color/bg/*`, `surface/*`, `text/*`, `border/*`, `action/*`, `feedback/*`, `chrome/*`, `brand/*`) aliases a primitive per mode.
4. Dimensions collection: add the same modes for `radius/control|card|overlay|tag`; font family strings as STRING variables.
5. Verify by reading the variables back (counts per mode, no unbound aliases).

## B. App
1. `src/styles/themes.css` (new): `[data-theme="xp"|"gov"|"aipass"]` blocks overriding the semantic tokens, plus theme-only component rules (XP bevel + dotted focus + gradient title bar + segmented progress; gov double-rule card frame + gold nav rule + stronger focus; AI Pass brand-panel title bar + float shadow). Import after `tokens.css` in `src/main.tsx`.
2. `src/styles/tokens.css`: delete the chrome-only `[data-theme="xp"]` block (superseded); add the few new semantic tokens the themes need (`--font-ui`, `--font-display`, `--font-logo`, `--color-text-title`, `--radius-pill`, `--chrome-shadow-x`, nav tokens; these live in `themes.generated.css`).
3. `src/styles/ui.css`: read the new tokens instead of hardcoded values (body font, `.logo-word` font, nav background, `.nav-item.on`, `.pill`, card border/shadow, `.window-title` gradient, `.progress`); remove the `[data-theme="xp"]` rules that moved to themes.css.
4. `index.html`: add Noto Sans Thai, Noto Sans Thai Looped, Sarabun 500/600, Trirong 600 to the Google Fonts request.
5. `src/lib/app.tsx`: replace `useXpMode` with `useTheme` (`standard|xp|gov|aipass`, localStorage `ratchakarn.theme.v1`, migrate old `ratchakarn.xp.v1 === "1"` to `xp`, set `document.documentElement.dataset.theme`). Context exposes `theme`, `setTheme`, and keeps `xp = theme === "xp"` so `chrome()` copy callers are unchanged.
6. `src/pages/settings/index.tsx`: a four-option segmented control (ธีม) in settings replacing the XP toggle. No nav button.
7. A4 paper: assert nothing in `.paper-frame` / `.rk-page` reads a themed token other than the desk behind it.

## C. Verify
- `npm run typecheck` and `npm run build`.
- Screenshot every route (chat, draft, format, export, prompts, settings) in all four themes at 1440 and 390; check alignment, contrast and that the paper is identical.
- Export a DOCX in each theme and compare bytes of `document.xml`.
