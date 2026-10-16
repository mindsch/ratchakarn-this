# Contributing / การมีส่วนร่วม

## Rules

- `main` is protected. No direct pushes, no force pushes, no deleting it.
- Work on a branch (`feat/...`, `fix/...`, `docs/...`) and open a pull request into `main`.
- Only the maintainer ([CODEOWNERS](.github/CODEOWNERS)) merges pull requests. Contributors cannot merge, even their own.
- Conversations on the pull request must be resolved, and `npm run build` (typecheck + build) should pass before you ask for review.
- Never commit API keys or `.env` files. Keys stay in the browser.

## Before you open a PR

```bash
npm install
npm run build
```

If you touched `prompts/`, run `npm run prompts` and check the output. Prompt wording changes should say which document type they affect.

## Legal and court content

Court and legal templates are drafts. Cite the public form you based a change on. Do not add the Garuda emblem or any other protected mark to the repo.

---

## กติกา

- สาขา `main` ถูกป้องกัน ห้าม push ตรง ห้าม force push ห้ามลบ
- ทำงานในสาขาแยก (`feat/...`, `fix/...`, `docs/...`) แล้วเปิด pull request เข้า `main`
- มีเฉพาะผู้ดูแล ([CODEOWNERS](.github/CODEOWNERS)) ที่ merge PR ได้ ผู้ร่วมพัฒนา merge เองไม่ได้
- ต้องแก้ทุกการสนทนาใน PR ให้เสร็จ และ `npm run build` ควรผ่านก่อนขอรีวิว
- ห้าม commit API key หรือไฟล์ `.env` คีย์อยู่ในเบราว์เซอร์เท่านั้น
- เนื้อหาศาลและกฎหมายเป็นร่างเท่านั้น ระบุแบบฟอร์มสาธารณะที่ใช้อ้างอิง และห้ามเพิ่มตราครุฑหรือเครื่องหมายที่กฎหมายคุ้มครอง
