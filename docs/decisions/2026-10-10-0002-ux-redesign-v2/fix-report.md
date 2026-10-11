# Fix report: build 0002

Date: 2026-10-11

## What changed

### AI reliability and error handling

- Added explicit generation limits for Chat, Draft, prefill, and whole-document checking instead of relying on short provider defaults.
- Added conservative temperature and Typhoon repetition settings for structured/document work.
- Detects output truncation for OpenAI-compatible, Anthropic, and Gemini responses, including the MCP/tool-call path.
- Distinguishes invalid/expired credentials (401/403), quota/rate limit (429), provider outage (5xx), network/CORS failure, empty output, and truncated output in Thai user-facing copy.
- Connection success is now attached to a fingerprint of the exact provider, URL, model, and key state that was tested; changing any of them clears the visible success state.

### Provider switching and credential retention

- Added a browser-local profile per provider for API kind, base URL, model, and key.
- Switching providers saves the current profile and restores the selected provider's previous profile, so switching back does not require re-entering its key.
- Default key retention is session-only. Enabling “จำคีย์ไว้ในเบราว์เซอร์นี้” persists provider-scoped keys; disabling it removes persistent keys while preserving the current tab's session copies.
- Added a visible current provider/model summary below the provider choices.
- Kept a compatibility fallback for the previous single-key storage entry.

### First-run setup

- Removed the implicit close caused by typing the first key character.
- Always shows the model field and uses provider-aware readiness, allowing keyless Ollama.
- Failed setup remains visible after reload unless the user explicitly dismisses it.
- Added initial focus, focus trapping, Escape handling, and focus restoration.

### Format safety

- Changing document type after sorting now opens a confirmation that names the work that will be reset: edited fields, skips, and unplaced-text decisions.
- Cancel leaves the current type and edits untouched; confirm reparses from the original source.

### Draft and court documents

- Added ข้าม / เลิกข้าม to normal fact rows and inline fill-in-the-sentence facts.
- Skipped facts are excluded from assembly and render as `[ระบุ...]`.
- Added `คดีหมายเลขดำที่` to court draft metadata. A new filing can explicitly skip it; existing matters can enter the number.
- Forced court AI/export banners to standard formal copy and styling even when global XP mode is on.

### Export

- Removed visible Garuda instruction text from browser preview, DOCX, and export smoke tests while keeping the reserved blank layout space.
- Added an explicit “ใส่ตราครุฑในเอกสาร” toggle for every document type. The PNG/JPG picker is always visible on the shared export step for both ร่างเอกสาร and จัดรูปแบบ; selecting a file automatically enables it. Turning it off removes it without discarding the browser-held image, and turning it back on restores it.
- Fixed the renderer, not only the UI: court and generic-petition layouts previously had no Garuda block, so an accepted upload could not appear. When the user explicitly enables an image, any layout family without a built-in slot now receives a centered Garuda header block.
- Replaced the fake upload label/invisible overlay with a real visible file input. Selecting a file turns the switch on immediately, selecting the same file again works, and unreadable/wrong-format files show an explicit error instead of silently leaving the control off.
- Native-picker verification covered the full court Draft path (`คำฟ้องคดีแรงงาน`) and the Format path, including preview insertion and embedded DOCX media.
- Added a persistent warning beside the control: the Garuda is legally protected, must only be used by an authorized person/agency for an allowed document, and users should check the applicable rules and consult legal counsel before real use.
- Updated DOCX creator/description metadata to `แปลเป็นราชการ`.
- Confirmed XP state is not an input to document block or DOCX generation, so it cannot alter generated document content.

### Mobile and accessibility

- Reserved enough bottom space for the tallest current fixed mobile action bar.
- Raised sampled interactive targets to at least 44 px: buttons, small buttons on mobile, provider chips, mobile nav, inputs, segmented controls, toggles, nav logo/actions, and banner/popup close controls.
- Added reusable focus management to popups and drawers.
- Added accessible names to shared field inputs.
- Replaced `overflow-wrap:anywhere` on Thai content with language-aware normal wrapping.

### Housekeeping

- Added an SVG favicon to remove the console 404.
- Replaced the old Thai product name in README and generated DOCX metadata.

## Optional product/UI decisions taken

These choices were not blockers, so the implementation used conservative defaults:

1. **Provider keys survive switching:** yes, scoped per provider. They live only for the browser session unless the user explicitly enables “remember”. This preserves convenience without silently increasing persistence.
2. **Current model visibility:** show a compact `Provider · model` summary near the provider controls. Empty models are shown as not selected rather than guessed.
3. **Format type changes:** require confirmation only when the type actually changes. The dialog is explicit because the operation is intentionally destructive.
4. **Court black-case number:** make it a visible required fact with an explicit skip path. This supports existing cases without inventing a number for new filings.
5. **Court under XP mode:** court-specific banners and copy stay Standard. XP remains available elsewhere, but court screens never use joke wording or XP chrome.
6. **Quota vs truncation:** present them as different failures. HTTP 429 means provider/account limit; a successful response ending because of token length means the model output was cut off.
7. **Mobile action bar:** reserve 240 px rather than dynamically resizing the document viewport. This is predictable for the current two- and three-button bars and avoids content being hidden.
8. **Thai wrapping:** prefer natural Thai/browser line breaking. Very long unbroken technical tokens may scroll or occupy extra width rather than forcing arbitrary breaks inside Thai words.
9. **Garuda image:** never bundle or silently insert an official emblem. Users must supply their own PNG/JPEG and accept responsibility after seeing the legal-use warning. The feature is available for every exported type, including court drafts, because the user explicitly chose user control plus a stronger consult-a-lawyer warning instead of a hard block.

## Verification

See [test-report.md](./test-report.md) for the command results, end-to-end evidence, resolved defect table, and residual manual checks.

No real API key is included in this file, the test report, screenshots, or repository source.
