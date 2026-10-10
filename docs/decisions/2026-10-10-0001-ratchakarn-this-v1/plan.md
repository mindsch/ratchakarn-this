# Plan for 0001 (ordered)

Stack: Vite + React + TypeScript, `docx` for DOCX, browser print (`@page` in cm) for PDF, raw `fetch` + SSE for model calls (replaces the Vercel AI SDK in the decision: fewer deps, same provider coverage). Deviations get listed in decision.md "What got built".

1. **Scaffold** — `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `LICENSE` (MIT), `README.md`.
2. **Prompt pack** (`prompts/`) — `core.md`, `modes/{convert,draft,court,format}.md`, `doctypes/*.md` (phrases, closers, structure), `output-template.md` (the paste-into-export template), `disclaimer.md`. `scripts/build-prompts.mjs` compiles → `public/prompts/*.md` (copy-paste, per target) and `src/generated/prompts.ts` (used by the app).
3. **Doc model + export** (`src/lib/doc/`) — types/fields per document type, template parser/serializer, layout profiles (config), DOCX renderer, HTML print renderer, empty ครุฑ slot with optional user image.
4. **Chat** (`src/lib/llm/`, `src/components/Chat`) — providers (OpenAI-compatible, Anthropic, Gemini), presets with suggested models, streaming, modes + joke dial, "send to export" from an answer, settings stored in the browser.
5. **App shell** — tabs: Chat / Export / Copy prompt. Disclaimers. Thai UI.
6. **Court mode** — labour court schemas (wage complaint first, บัญชีพยาน, a few คำร้อง), interview prompt, renderer.
7. **MCP (minimal)** — remote Streamable-HTTP client, `tools/list` + `tools/call`, OpenAI-compatible tool loop, tool calls shown to the user.
8. **Verify** — typecheck, build, run dev server, test export, check DOCX opens, screenshot the UI.
