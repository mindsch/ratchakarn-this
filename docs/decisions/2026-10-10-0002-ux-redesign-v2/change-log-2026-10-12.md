# Change log: 2026-10-12

Small follow-up changes to build 0002, made after the fix report. Not committed yet. Typecheck (`tsc --noEmit`) passes; not exercised in a browser or against a real model.

## 1. ตราเอกสาร (export step)

File: `src/pages/export/index.tsx`

- Checklist row "ตราครุฑ" renamed **ตราเอกสาร**, so a company logo fits as well as the Garuda emblem.
- Row hint now reads: "ใส่ตราโลโก้บริษัท หรือ ตราครุฑ ใช้ได้ทั้งเอกสารจากร่างเอกสารและจัดรูปแบบในขั้นออกเอกสาร ภาพอยู่ในเบราว์เซอร์นี้เท่านั้น"
- Toggle label: "ใส่ตราในเอกสาร" (was "ใส่ตราครุฑในเอกสาร").
- File input aria-label: "เลือกไฟล์ภาพตราเอกสาร PNG หรือ JPG".
- Preview caption: "ใส่ภาพตราแล้ว" / "ตราเว้นว่าง".
- **Deliberately unchanged:** the legal warning, disclaimer, settings "about" text, `SLOT_HINT`, layout notes and prompts. They refer to the Garuda emblem specifically (a legally protected mark), so they keep the word ตราครุฑ.

## 2. Model picker (ตั้งค่า / first-run setup)

Files: `src/pages/settings/shared.tsx`, `src/pages/settings/index.tsx`, `src/lib/llm/presets.ts`, `src/lib/settings.ts`

- New `ModelPicker` component replaces the plain model text box on the settings page and in the first-run dialog.
  - A dropdown lists suggested models for the selected provider, plus "อื่นๆ (พิมพ์ชื่อเอง)", which shows a text box for any other name.
  - A saved model that is not in the suggestions is shown in the text box.
  - Providers with no suggestions (ThaiLLM, กำหนดเอง) stay a plain text input.
  - The "ใส่ชื่อโมเดลก่อน" error is still passed through in the first-run dialog.
- `Preset` gained a `models: string[]` field.
- Prefill: switching provider selects that provider's first suggested model unless a model was already saved for it (`providerPatch` in `settings.ts`). `DEFAULTS` now starts on `typhoon-v2.5-30b-a3b-instruct`.

## 3. Model lists refreshed (checked 2026-10-12)

Names change often; re-check before relying on them.

| Provider | Suggested models | Source checked |
|---|---|---|
| Typhoon | `typhoon-v2.5-30b-a3b-instruct`, `typhoon-v2.1-12b-instruct` | docs.opentyphoon.ai (v2.5 still latest) |
| OpenAI | `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol/terra/luna`, `gpt-5.5`, `gpt-5.4` (+`-mini`, `-nano`), `gpt-5.2`, `gpt-5.1`, `gpt-5` (+`-mini`, `-nano`) | OpenAI models page for the GPT-6 ids; older ids confirmed on OpenRouter's live list (not on OpenAI's page). `-pro` and codex variants left out. |
| Gemini | `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`, `gemini-3-flash-preview`, `gemini-2.5-pro/flash/flash-lite` | ai.google.dev models page. No stable Pro; 2.5 models have restricted access and a third-party source says they shut down 2026-10-16. |
| OpenRouter | 22 ids across Google, OpenAI, Anthropic, Qwen, DeepSeek, xAI (`grok-4.7`), Moonshot (`kimi-k3`), Z.ai (`glm-5.3`), MiniMax (`minimax-m3`), Mistral, Meta (`llama-4-maverick`, `llama-3.3-70b-instruct`), NVIDIA | OpenRouter live `/api/v1/models`; list is in `presets.ts` |
| Ollama | 19 tags: qwen3.8/3.6/3.5, gemma4 (e2b to 31b), gpt-oss (20b, 120b), granite4.2, nemotron-3.5-lightning, mistral-small3.2, llama3.3/3.1 | ollama.com library pages; each tag seen on its model page. Large ones need a lot of RAM/VRAM. |
| Claude | `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` | unchanged |
| ThaiLLM / กำหนดเอง | none (text input) | no public model list found for ThaiLLM; check playground.thaillm.or.th |

Input hints (`modelHint`) were updated to match.

## Open points

- Model names are hard-coded and will go stale; a "last checked" date in settings was suggested, not built.
- Existing saved settings keep their model; only new/unsaved providers get the prefill.

## Status

Committed on build-0002 in `10a29bd` together with the 0003 joke themes, then pushed. Lists later expanded: OpenAI 16, Gemini 9, Ollama 19, OpenRouter 22 models (see `src/lib/llm/presets.ts`).
