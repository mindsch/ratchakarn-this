# แปลเป็นราชการ · Ratchakarn-this

**ภาษาไทย** (ด้านล่าง) · [**English**](#english)

เขียนภาษาราชการ ร่างหนังสือราชการ และออกเป็น DOCX/PDF ที่พิมพ์ใช้ได้จริง
Turn plain text (Thai, English, any language) into Thai ราชการ register, draft official Thai documents, and export them as DOCX/PDF.

Born at a "stupid hackathon", meant to be genuinely useful. **Bring your own AI**: nothing here costs the author money, and your API key never leaves your browser.

> ⚠️ **ข้อสงวนสิทธิ์ / Disclaimer.** ผลลัพธ์จาก AI อาจผิดพลาด ผู้ใช้เป็นผู้รับผิดชอบต่อผลของการใช้ทั้งหมด โครงการไม่รับรองว่าหน่วยงานหรือศาลใดจะยอมรับเอกสาร
> เอกสารด้านกฎหมาย/ศาลเป็น **ร่างเบื้องต้นเท่านั้น ไม่ใช่คำปรึกษากฎหมาย โปรดอ่านทบทวนและปรึกษาทนายความก่อนใช้จริง**
> AI output can be wrong. You are responsible for what you do with it. Court/legal drafts are first drafts only; read them and consult a lawyer.

## สิ่งที่ทำได้ / What it does

| แท็บ | ทำอะไร |
|---|---|
| **แชต** | แปลงข้อความเป็นภาษาราชการ (มี "ปุ่มหมุนความราชการ" 0–4 ตั้งแต่ใช้จริงจนถึงล้อเล่น), ร่างเอกสาร, จัดรูปแบบข้อความที่มีอยู่, ร่างเอกสารศาลแรงงาน (สัมภาษณ์ข้อเท็จจริงก่อน ไม่แต่งเอง) |
| **ออกเอกสาร** | วางข้อความ/กรอกฟอร์ม → DOCX หรือ PDF ตามรูปแบบหนังสือราชการ **ไม่ต้องใช้แชตหรือคีย์ใดๆ** |
| **พรอมต์** | ก๊อปพรอมต์ไปใช้กับ ChatGPT / Claude / Gemini / โมเดลไทย แล้วนำผลมาวางที่ "ออกเอกสาร" |

เอกสารที่รองรับ: หนังสือภายนอก (ขอ เชิญ ตอบ ปฏิเสธ ขอบคุณ ฯลฯ), บันทึกข้อความ, คำร้อง, หนังสือรับรอง, คำสั่ง, ประกาศ, และชุดศาลแรงงาน (คำฟ้อง, บัญชีระบุพยาน, คำร้อง)

## ใช้งาน / Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ — host anywhere (Vercel, Cloudflare Pages, GitHub Pages)
```

ในแท็บแชต กด ⚙ ตั้งค่าโมเดล แล้วเลือกผู้ให้บริการ (OpenAI-compatible / Anthropic / Gemini) ใส่ Base URL ชื่อโมเดล และคีย์ของคุณเอง
ตัวอย่าง: Typhoon, Ollama ในเครื่อง, OpenRouter, ThaiLLM, OpenAI, Claude, Gemini (ค่าที่ตั้งไว้เป็นข้อเสนอเริ่มต้น **ยังไม่ได้ทดสอบกับบริการจริง** ตรวจ URL และชื่อโมเดลกับเอกสารของผู้ให้บริการ) ช่องชื่อโมเดลมีรายการแนะนำให้เลือก (ตรวจเมื่อ 2026-10-12) หรือเลือก "อื่นๆ" เพื่อพิมพ์เอง

หมายเหตุ CORS: ผู้ให้บริการบางรายไม่อนุญาตให้เรียกจากเบราว์เซอร์โดยตรง ใช้ผู้ให้บริการอื่น หรือรันโมเดลในเครื่อง (Ollama ต้องตั้ง `OLLAMA_ORIGINS`)

### MCP (ทดลอง)
เพิ่มเซิร์ฟเวอร์ MCP แบบ remote (Streamable HTTP) ในตั้งค่า ใช้ได้กับ OpenAI-compatible เท่านั้นในรุ่นนี้ ทุกการเรียกเครื่องมือแสดงในแชต เซิร์ฟเวอร์ต้องเปิด CORS

## พรอมต์ (ใช้ได้กับ AI ทุกตัว)

ต้นทางอยู่ที่ [`prompts/`](prompts/) แล้ว `npm run prompts` คอมไพล์เป็น
- `public/prompts/ratchakarn-all.md` ฉบับรวม · `ratchakarn-convert.md` ฉบับสั้นสำหรับโมเดลเล็ก · `ratchakarn-draft.md` · `ratchakarn-court-labour.md`
- `src/generated/prompts.ts` ที่เว็บใช้เป็น system prompt

พรอมต์ในเว็บกับพรอมต์ที่ก๊อปไปใช้จึงมาจากแหล่งเดียวกัน แก้ไฟล์ใน `prompts/` ที่เดียว

## หลักการออกแบบ

- **โมเดลเขียนถ้อยคำ โค้ดจัดหน้า** โมเดลให้ผลลัพธ์ตามแม่แบบข้อความ ([`prompts/output-template.md`](prompts/output-template.md)) ส่วนตัวจัดหน้า DOCX/PDF เป็นโค้ดที่คาดเดาได้ ([`src/lib/doc/`](src/lib/doc/))
- **ตัวเลขการจัดหน้าเป็นแนวปฏิบัติ ไม่ใช่ข้อบังคับ** ค่าอยู่ใน [`src/lib/doc/layout.ts`](src/lib/doc/layout.ts) มีหลายโปรไฟล์ แก้เพิ่มได้ (A4, TH Sarabun New 16 พอยต์, ขอบ ซ้าย 3 / ขวา 2 / บน 1.5 / ล่าง 2 ซม. ฯลฯ)
- **ตราเอกสาร (ตราครุฑ / โลโก้บริษัท)**: เราไม่ได้ให้ภาพตราครุฑมา (เป็นเครื่องหมายที่กฎหมายคุ้มครอง) เอกสารเว้นช่องไว้ให้วางเอง หรืออัปโหลดภาพที่คุณมีสิทธิ์ใช้ (ภาพอยู่ในเบราว์เซอร์ ไม่ถูกส่งไปไหน) ตรวจสอบสิทธิ์การใช้เอง
- **ไม่แต่งข้อเท็จจริง** ช่องที่ไม่มีข้อมูลเป็น `[ระบุ...]`
- ศาล: **ศาลแรงงานเท่านั้น** ตอนนี้ อิงแบบฟอร์มตัวอย่างที่ศาลแรงงานเผยแพร่ ศาลอื่นจะเพิ่มเมื่อมีแบบฟอร์มของศาลนั้น

ฟอนต์: DOCX ใช้ TH Sarabun New ติดตั้งในเครื่องก่อน (ฟอนต์ฟรี) หน้า PDF เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์ และปิดหัว/ท้ายกระดาษ

## โครงสร้าง

```
prompts/            ต้นทางพรอมต์ (core, modes, doctypes, output-template, disclaimer)
scripts/            build-prompts.mjs, smoke-export.ts (ทดสอบส่งออก), mock-server.mjs (เซิร์ฟเวอร์ปลอมไว้ทดสอบ UI)
src/lib/doc/        โครงเอกสาร, parser แม่แบบ, โปรไฟล์จัดหน้า, ตัวสร้าง DOCX และ HTML/PDF
src/lib/llm/        providers (OpenAI-compatible / Anthropic / Gemini), presets, MCP client
src/pages/          หน้าแชต, ร่างเอกสาร, จัดรูปแบบ, ออกเอกสาร, พรอมต์, ตั้งค่า
src/ui/             คอมโพเนนต์พื้นฐาน (NavBar ฯลฯ)
src/styles/         โทเคนสีและธีม
docs/decisions/     บันทึกการตัดสินใจและแผน
```

ทดสอบ: `npx tsx scripts/smoke-export.ts ./out` สร้างไฟล์ DOCX ทุกชนิดจากตัวอย่าง · `node scripts/mock-server.mjs` เปิดโมเดลปลอมและ MCP ปลอมที่ `localhost:8787` ไว้ลอง UI โดยไม่ต้องมีคีย์

## ข้อจำกัดที่ทราบ

- ยังไม่ได้ทดสอบกับโมเดลจริง (ไม่มีการวัดคุณภาพภาษาราชการ) — มีแผนทำชุดประเมินเล็กๆ
- ตำแหน่งบรรทัด ที่/วันที่/เรื่อง/เรียน ฯลฯ เป็นค่าประมาณจากคู่มือหน่วยงานหนึ่ง ยังไม่เทียบกับแบบทางการ
- รูปแบบเอกสารศาลแรงงานอิงแบบฟอร์มที่อ่านได้เพียงฉบับเดียว (คำฟ้องค่าจ้าง) ยังไม่ตรวจฟอนต์และระยะจริงของแบบฟอร์มศาล
- ไม่มีหนังสือประทับตรา, รายงานการประชุม, ศาลอื่น
- MCP: OpenAI-compatible เท่านั้น
- PDF ใช้การพิมพ์ของเบราว์เซอร์

## อนาคต

ปรับจูนโมเดลจริง (Typhoon / Qwen) จากพรอมต์ ชุดประเมิน และคู่ข้อความ→ราชการ ที่สะสมไว้ · OCR ตัวอย่างหนังสือ · ศาลอื่น · หนังสือประทับตรา/รายงานประชุม

## สัญญาอนุญาต

MIT — ดู [LICENSE](LICENSE) · ผู้เขียนไม่รับผิดชอบต่อผลของการใช้งาน

## การมีส่วนร่วม

สาขา `main` ถูกป้องกันไว้ ห้าม push ตรง ให้แตกสาขาแล้วเปิด pull request ดู [CONTRIBUTING.md](CONTRIBUTING.md)

---

<a id="english"></a>

# English

**Ratchakarn-this**: write in Thai official register (ภาษาราชการ), draft official Thai documents, and export print-ready DOCX/PDF.

Turn plain text (Thai, English, any language) into the formal register used in Thai government letters, draft official documents, and export them in the standard layout.

Born at a "stupid hackathon", meant to be genuinely useful. **Bring your own AI**: nothing here costs the author money, and your API key never leaves your browser.

> ⚠️ **Disclaimer.** AI output can be wrong. You are responsible for everything you do with it. The project does not guarantee that any agency or court will accept a document.
> Court and legal documents are **first drafts only, not legal advice. Read them carefully and consult a lawyer before real use.**

## What it does

| Tab | What it does |
|---|---|
| **Chat** (แชต) | Converts text into ราชการ register (a "formality dial" from 0 to 4, from practical to joke-level), drafts documents, reformats existing text, and drafts Labour Court documents (it interviews you for the facts first and never invents them) |
| **Export** (ออกเอกสาร) | Paste text or fill in a form, then get DOCX or PDF in official letter layout. **No chat and no API key needed.** |
| **Prompts** (พรอมต์) | Copy the prompts into ChatGPT / Claude / Gemini / a Thai model, then paste the result back into "Export" |

Supported documents: external letters (request, invitation, reply, decline, thanks, etc.), internal memos (บันทึกข้อความ), petitions (คำร้อง), certificates (หนังสือรับรอง), orders (คำสั่ง), announcements (ประกาศ), and a Labour Court set (complaint, witness list, motions).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ — host anywhere (Vercel, Cloudflare Pages, GitHub Pages)
```

In the Chat tab, open ⚙ model settings, pick a provider (OpenAI-compatible / Anthropic / Gemini), and enter the Base URL, model name, and your own key.
Examples: Typhoon, local Ollama, OpenRouter, ThaiLLM, OpenAI, Claude, Gemini. The presets are starting suggestions and have **not been tested against the live services**, so check the URL and model name against each provider's docs. The model field offers a list of suggestions (checked 2026-10-12), or choose "Other" to type your own.

CORS note: some providers do not allow calls straight from a browser. Use another provider or run a local model (Ollama needs `OLLAMA_ORIGINS` set).

### MCP (experimental)
Add a remote MCP server (Streamable HTTP) in Settings. In this version it works with OpenAI-compatible providers only. Every tool call is shown in the chat. The server must enable CORS.

## Prompts (work with any AI)

The source lives in [`prompts/`](prompts/). `npm run prompts` compiles it into:
- `public/prompts/ratchakarn-all.md` (combined), `ratchakarn-convert.md` (short, for small models), `ratchakarn-draft.md`, `ratchakarn-court-labour.md`
- `src/generated/prompts.ts`, which the web app uses as its system prompt

The prompts in the app and the prompts you copy come from the same source. Edit only the files in `prompts/`.

## Design principles

- **The model writes the wording, code does the layout.** The model outputs a text template ([`prompts/output-template.md`](prompts/output-template.md)); DOCX/PDF layout is predictable code ([`src/lib/doc/`](src/lib/doc/)).
- **Layout numbers are convention, not law.** Values live in [`src/lib/doc/layout.ts`](src/lib/doc/layout.ts) as several profiles you can extend (A4, TH Sarabun New 16 pt, margins left 3 / right 2 / top 1.5 / bottom 2 cm, etc.).
- **Emblem (Garuda / company logo):** we do not ship the Garuda image because it is a legally protected mark. Documents leave a blank slot for you to fill, or you can upload an image you have the right to use (it stays in your browser and is sent nowhere). Checking usage rights is your responsibility.
- **No invented facts.** Missing information appears as `[ระบุ...]` ("specify...").
- Courts: **Labour Court only** for now, based on sample forms the Labour Court publishes. Other courts will be added when their forms are available.

Fonts: DOCX uses TH Sarabun New, so install it first (it is free). For PDF, choose "Save as PDF" in the print dialog and turn off headers and footers.

## Structure

```
prompts/            prompt sources (core, modes, doctypes, output-template, disclaimer)
scripts/            build-prompts.mjs, smoke-export.ts (export test), mock-server.mjs (fake server for UI testing)
src/lib/doc/        document model, template parser, layout profiles, DOCX and HTML/PDF builders
src/lib/llm/        providers (OpenAI-compatible / Anthropic / Gemini), presets, MCP client
src/pages/          Chat, Draft, Format, Export, Prompts, Settings pages
src/ui/             base components (NavBar etc.)
src/styles/         color tokens and themes
docs/decisions/     decision records and plans
```

Testing: `npx tsx scripts/smoke-export.ts ./out` generates every DOCX type from samples. `node scripts/mock-server.mjs` starts a fake model and fake MCP server at `localhost:8787` so you can try the UI without a key.

## Known limitations

- Not yet tested against real models (the quality of the ราชการ language is unmeasured); a small evaluation set is planned.
- Positions of the ที่ / date / subject / "Dear" lines are estimates from one agency's manual and have not been checked against an official form.
- The Labour Court layout follows the only form that could be read (a wage complaint); the court form's actual fonts and spacing are unverified.
- No sealed letters (หนังสือประทับตรา), meeting minutes, or other courts.
- MCP: OpenAI-compatible only.
- PDF uses the browser's print function.

## Roadmap

Fine-tune a real model (Typhoon / Qwen) from the prompts, an evaluation set, and the collected text→ราชการ pairs · OCR of sample letters · other courts · sealed letters and meeting minutes.

## Contributing

`main` is protected: no direct pushes. Create a branch and open a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE). The author is not liable for how the tool is used.
