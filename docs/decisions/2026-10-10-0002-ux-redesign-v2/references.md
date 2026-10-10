# References for 0002

## Figma
- **Project file** (new, 2026-10-10): https://www.figma.com/design/RyaDjrolWmaXIVR4G6z26c — key `RyaDjrolWmaXIVR4G6z26c`
  - 🔎 Research page `2:2`: problems, 17 Mobbin reference screens in 5 themes, principles.
  - 🏷 Brand page `2:3`: **Brand v1** `11:2` (the refined direction), plus kept explorations Direction 1 `5:2`, Direction 2 `5:177`, Direction 3 `5:352`, Direction 3R `8:2`.
  - 🧩 Components page `2:5`: library frame `14:2`; review frames `15:101` (Standard vs XP replica) and `17:265` (Check step assembled).
  - Variable collections: Primitives, Tokens (Standard / XP replica), Dimensions.
- **Taazo** `rkw5L0yw3oxiT9D04kOVNA`: read-only reference for file structure (pages Cover/Brand/Foundations/Components; variables Primitives → Tokens → Dimensions; EN/HI text styles). Do not write to it.
- **Kibou Study design draft** `dWAIJflb2TqEFab77OFTmv` (node `46:2`): working-style reference (Read me note, M01-style names, DRAFT/REFERENCE prefixes, bound variables).

## Mobbin (web unless noted)
Prompt page: [Buffer](https://mobbin.com/screens/393982da-c3a9-4e20-a5c8-0578807c1e5e), [Browserbase](https://mobbin.com/screens/2b59f1d8-3937-4a55-842e-970626c4c85d), [n8n](https://mobbin.com/screens/608ce04f-d1ed-4cb0-897f-6fdbbd785f8f), [Gemini Gems](https://mobbin.com/flows/d24db1c9-144d-4f83-a299-892120a9bdf0).
Ask for what is missing: [Deel](https://mobbin.com/screens/14397653-8147-46e8-ac32-39a1f18a92a4), [Zillow](https://mobbin.com/screens/fc464b6c-8a92-46a9-89ce-afab79c85773), [Gumloop](https://mobbin.com/screens/a0c0e7b0-88bb-4a89-904a-d88ee892a8dd), [Unify](https://mobbin.com/screens/ca1f0060-e1ab-4ba2-98f9-6a9789f2afc4), [WRITER](https://mobbin.com/screens/e76f9d41-87ea-4045-9748-002c4b0002a2).
AI edits shown as diffs: [Semrush](https://mobbin.com/screens/ed82aafc-c4dc-442d-87fc-359f7347f940), [Notion](https://mobbin.com/flows/6463d199-92a5-4dc1-a19b-14a462c90ccb), [Zoho CRM](https://mobbin.com/flows/f39e7849-d16b-407b-823e-22322ed438fe), [Codecademy](https://mobbin.com/screens/3db54285-08df-44c3-a226-cf3e168b5e85).
BYOK setup: [Braintrust](https://mobbin.com/screens/60155437-91dd-49ac-9ddd-b39b6bf4805a), [Vercel AI Gateway](https://mobbin.com/screens/6cf10946-059f-4b49-b0b6-392d4b8e9863).
Steps and preview: [Deel certificate](https://mobbin.com/screens/d7e5de8a-703c-4a33-a4ad-f13fe2e40f12), [Resend](https://mobbin.com/screens/91fa40ac-7866-4079-b42b-fcc2c7bea086).
Retro (iOS), Poolsuite FM: [player](https://mobbin.com/screens/ba63a238-8c6e-4ec0-8a24-0ad76f4eb201), [newsroom](https://mobbin.com/screens/30dc4229-b583-4646-877d-6939f3e761d4), [mixtapes](https://mobbin.com/screens/6c583994-d8bc-4d72-be3c-b5cb22a76db6), [member form](https://mobbin.com/screens/aaffd71e-a7ce-4037-9ef5-c0479e6cc5c0). Takeaways: cream paper, hard black borders, black label strips with spaced caps (read like government-form headers), ID-card motif.

## Stupid Hackathon X (retro theme)
- https://stupid.hackathon.in.th/x/ — "Y2X", a Windows XP desktop with fake system dialogs (Frutiger Aero), deadpan system-message copy.
- Values taken from its stylesheet: XP blue `#0046D5` / `#316AC5`, dark blue `#0F3F8F`, beige `#ECE9D8`, desktop `#3A6EA5`, yellow `#FFD60A`, title-bar gradient (`#0997ff → #0053ee → #0050ee → #06f → #0997ff`), segmented green progress. Fonts: Tahoma / Trebuchet stack (not in Figma; replaced by IBM Plex Sans Thai).
- Their logo and assets are not used.

## Code read
- `src/App.tsx` (3 tabs), `src/components/Chat.tsx` (4 modes in one chat, dial, ⚙ chip, marker hand-off), `src/components/CopyPrompt.tsx` (4 variants, 22-row textarea).
- `prompts/modes/format.md` (tells the model to re-emit the letter and then list what changed).
- `src/lib/doc/types.ts` (`DocTypeDef`, `headKeys` / `footKeys`, court types), `prompts/doctypes/letters.md` (purpose formulas: เชิญ, ขออนุมัติ, ขอความร่วมมือ, ปฏิเสธ…).
- `scripts/build-prompts.mjs` (how prompts compile into `public/prompts/*.md` and `src/generated/prompts.ts`).
