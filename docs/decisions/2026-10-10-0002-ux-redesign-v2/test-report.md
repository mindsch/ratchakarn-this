# Test report: build 0002

Date: 2026-10-11
Status: **release candidate passes automated and principal browser flows; no known blocker or major defect remains**

## Result summary

- TypeScript, production build, sorting/check/template tests, and five real DOCX smoke exports pass.
- Browser flows pass for Settings, first run, provider switching, Format, Draft, court Draft, Export, Prompts drawer, Chat handoff, XP persistence, and the 390 px mobile layout.
- A real Typhoon connection, Chat conversion, Draft prefill, Draft body generation, and whole-document check pass with the user-entered test key.
- Typhoon whole-document check now returns usable suggestions. Accept changes the preview; undo restores the exact pre-accept text.
- No API key was read from request headers, printed, saved to a report, or written into repository files.

## Prioritized defects and disposition

| Priority | ID | Defect | Result |
|---|---|---|---|
| P1 | A1-01 | Typhoon check responses were truncated at the provider's short default output limit, but the UI reported only invalid JSON. | **Fixed and browser-verified.** Requests now set output limits and low-variance generation options; provider truncation, 401/403, 429, 5xx, network, and empty-response cases have distinct messages. Real check returned four suggestions. |
| P1 | S1-01 | First-run setup closed after the first key character. | **Fixed and browser-verified.** It closes only after explicit skip or a successful save/test. |
| P1 | S2-01 | Switching providers mixed one provider's key/model with another provider. | **Fixed and browser-verified.** Each provider restores its own key, URL, API kind, and model. |
| P1 | F6-01 | Changing Format document type silently discarded field edits, skips, and tray decisions. | **Fixed and browser-verified.** A destructive-change confirmation explains exactly what will be reset; cancel preserves work. |
| P1 | M1-01 | Mobile fixed action bars covered the last page content. | **Fixed and browser-verified at 390 px.** The page reserves 240 px below content; sampled Draft/Export action bars were 137–189 px. |
| P2 | D1-01 | Draft fact slots lacked explicit ข้าม / เลิกข้าม controls. | **Fixed and browser-verified.** Section and inline sentence facts can be skipped and render `[ระบุ...]`. |
| P2 | D3-01 | Court drafts could not capture `คดีหมายเลขดำที่`. | **Fixed and browser-verified.** The field appears in court forms and can be explicitly skipped when a new case has no number yet. |
| P2 | X3-01 | Court export banners used XP joke copy/style when XP mode was on. | **Fixed and browser-verified.** Court banners force standard copy and standard chrome tokens. |
| P2 | K1-01 | First-run dialogs and prompt drawers did not move or trap keyboard focus. | **Fixed and browser-verified.** Focus enters the overlay, Tab/Shift+Tab wrap, Escape closes where allowed, and focus is restored. |
| P2 | S8-01 | Ollama could not complete first-run setup without an API key. | **Fixed and browser-verified.** Readiness uses the provider-aware rule. |
| P2 | S6-01 | Settings could display a stale or never-tested “connected” state. | **Fixed and browser-verified.** Success is tied to the exact provider/base URL/model/key fingerprint that passed. |
| P2 | E1-01 | DOCX exported visible `(วางตราครุฑที่นี่)` text when no image was uploaded. | **Fixed and XML-verified.** The reserved space stays blank; the placeholder string is absent from `document.xml`. |
| P1 | E4-01 | The Garuda control accepted a file but petition and court renderers had no Garuda block; its fake label/invisible input was fragile; the picker was too easy to miss; and court Draft types were hard-blocked. | **Fixed and browser/DOCX-verified.** A visible native PNG/JPG input immediately enables the switch, reports decode errors, and supports reselection; layouts without a native slot receive a header block; the toggle controls preview/export; court drafts show a stronger consult-a-lawyer warning. |
| P2 | M1-02 | Several mobile controls were below the 44 px tap-target requirement. | **Fixed and browser-measured.** Buttons, mobile nav, provider chips, inputs, segmented controls, toggles, banner close controls, logo, and prompt/settings actions meet the target in sampled screens. |
| P3 | N2-01 | Missing favicon caused a console 404. | **Fixed and browser-verified.** SVG favicon added; fresh console pass has zero errors. |
| P3 | V1-01 | Thai text used `overflow-wrap:anywhere`, allowing visually awkward mid-word breaks. | **Fixed.** Thai content now uses normal language-aware wrapping. |
| P3 | B1-01 | README and DOCX metadata still used the old Thai product name. | **Fixed.** Updated to `แปลเป็นราชการ`. |

## Verification executed

### Automated

- `./node_modules/.bin/tsc --noEmit` — pass
- `npm run build` — pass; non-blocking bundle warning remains (main JS about 792 kB minified / 245 kB gzip)
- `npx tsx scripts/test-sort.ts` — pass
- `npx tsx scripts/test-check.ts` — pass
- `npx tsx scripts/test-templates.ts` — pass, 20 templates
- `npx tsx scripts/smoke-export.ts` — pass for หนังสือภายนอก, บันทึกข้อความ, คำร้อง, คำฟ้องคดีแรงงาน, บัญชีพยาน
- DOCX XML inspection — expected TH Sarabun New font and page margins present; Garuda instruction text absent

### Browser / end-to-end

- First-run dialog stays open while entering settings; model is always visible; Ollama is keyless; focus enters and stays inside the dialog.
- Provider round trip Typhoon → Ollama → Typhoon restores separate synthetic model/key state. Session-only and “remember in this browser” behavior both pass.
- Real Typhoon connection, Chat, Draft prefill, Draft body generation, and Format AI check pass.
- AI suggestion accept changes preview; undo restores byte-identical paper text.
- Draft court flow exposes the black-case field and four explicit skip controls in the sampled witness-list form; skip/undo and placeholder rendering pass.
- Garuda flow verified through the real native picker in both Format and court Draft export: selecting a PNG immediately enables the switch, shows `พร้อมใช้`, and inserts the image in preview. Toggle off/on removes and restores it; the downloaded DOCX contains the uploaded PNG under `word/media/`. Invalid/undecodable files now produce an explicit error.
- Court DOCX export under XP mode shows standard `ส่งออกเรียบร้อย` copy and standard white/ink hard-shadow styling.
- Prompt drawer focus enters the drawer, wraps from last to first control, and closes with Escape.
- At 390 px, sampled screens have `scrollWidth === clientWidth`; fixed action bars do not cover the end of content; sampled interactive targets meet 44 px after the fixes.
- Fresh browser console pass: zero errors.

## Residual risks / environment-only checks

These are not known application failures, but they need a human desktop environment or account-side fault injection:

- Open generated DOCX files in Microsoft Word and LibreOffice for final visual sign-off on pagination, installed-font fallback, and image rendering.
- Use the OS print dialog to save PDF and compare exact pagination across browsers.
- Force a real provider 429/quota failure and a real browser CORS failure. The response-status branches are implemented, but intentionally exhausting an account quota was not attempted.
- Perform pixel-level comparison against every cited Figma frame. Functional responsive checks passed; this report is not a full visual-regression baseline.
- Run prompt round trips in each external AI product; generated prompt assets were rebuilt and inspected locally, but external products were not controlled from this test run.
- The real Typhoon reviewer made one debatable semantic suggestion inferred from a document header. Suggestions remain non-destructive and require explicit acceptance; this is model-quality risk, not state corruption.

## Release assessment

No open P0/P1/P2 code defect was found after the final rerun. The remaining bundle-size warning is a performance follow-up, not a correctness blocker. Release after the Word/PDF visual sign-off if exact office-suite pagination is part of the acceptance bar.
