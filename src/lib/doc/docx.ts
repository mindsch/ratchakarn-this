import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";
import type { Block, RenderOptions, Run } from "./layout";
import { SLOT_HINT } from "./layout";

const CM = 567; // twips per cm
const A4 = { width: 11906, height: 16838 };

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE } as const;

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; type: "png" | "jpg" } {
  const [head, b64] = dataUrl.split(",");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, type: /jpe?g/i.test(head) ? "jpg" : "png" };
}

const align = (a?: string) =>
  a === "center" ? AlignmentType.CENTER : a === "right" ? AlignmentType.RIGHT : a === "justify" ? AlignmentType.THAI_DISTRIBUTE : AlignmentType.LEFT;

function run(r: Run, opts: RenderOptions): TextRun {
  const pt = r.sizePt ?? opts.profile.fontPt;
  const f = opts.profile.fontFamily;
  return new TextRun({
    text: r.text,
    font: { ascii: f, hAnsi: f, cs: f, eastAsia: f },
    size: pt * 2,
    sizeComplexScript: pt * 2,
    bold: r.bold,
    boldComplexScript: r.bold,
    color: r.color,
    underline: r.underline ? {} : undefined,
  });
}

function toDocx(b: Block, opts: RenderOptions, widthTwips: number): (Paragraph | Table)[] {
  const pf = opts.profile;
  switch (b.k) {
    case "gap":
      return [new Paragraph({ spacing: { line: Math.max(20, Math.round(b.pt * 20)), lineRule: LineRuleType.EXACT }, children: [] })];
    case "rule":
      return [
        new Paragraph({
          spacing: { before: 80, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
          children: [],
        }),
      ];
    case "garuda": {
      const heightTw = Math.round(b.heightCm * CM);
      const img = opts.garudaImage;
      const children: ParagraphChild[] = [];
      if (img) {
        const { bytes, type } = dataUrlToBytes(img.dataUrl);
        const hPx = Math.round(b.heightCm * 37.795);
        const wPx = Math.round((hPx * img.widthPx) / img.heightPx);
        children.push(new ImageRun({ type, data: bytes, transformation: { width: wPx, height: hPx } }));
      } else if (opts.showSlotHint) {
        children.push(run({ text: SLOT_HINT, sizePt: 10, color: "A0A0A0" }, opts));
      }
      return [
        new Paragraph({
          alignment: b.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: img ? { before: 0, after: 0 } : { line: heightTw, lineRule: LineRuleType.EXACT },
          children,
        }),
      ];
    }
    case "cols": {
      const left = Math.round(b.leftCm * CM);
      const right = widthTwips - left;
      const cell = (blocks: Block[], w: number) => {
        const paras = blocks.flatMap((x) => toDocx(x, opts, w)).filter((x): x is Paragraph => x instanceof Paragraph);
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          borders: NO_BORDERS,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: paras.length ? paras : [new Paragraph({ children: [] })],
        });
      };
      return [
        new Table({
          width: { size: widthTwips, type: WidthType.DXA },
          columnWidths: [left, right],
          borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
          rows: [new TableRow({ children: [cell(b.left, left), cell(b.right, right)] })],
        }),
      ];
    }
    case "p": {
      return [
        new Paragraph({
          alignment: align(b.align),
          keepNext: b.keepNext,
          indent: {
            left: b.leftCm ? Math.round(b.leftCm * CM) : undefined,
            firstLine: b.firstLineCm ? Math.round(b.firstLineCm * CM) : undefined,
          },
          spacing: {
            before: b.beforePt ? b.beforePt * 20 : 0,
            after: b.afterPt ? b.afterPt * 20 : 0,
            ...(b.exactPt ? { line: b.exactPt * 20, lineRule: LineRuleType.EXACT } : {}),
          },
          border: b.borderBottom ? { bottom: { style: BorderStyle.DOTTED, size: 6, color: "000000", space: 1 } } : undefined,
          children: b.runs.map((r) => run(r, opts)),
        }),
      ];
    }
  }
}

export async function buildDocx(blocks: Block[], opts: RenderOptions, title: string): Promise<Blob> {
  const m = opts.profile.marginsCm;
  const widthTwips = A4.width - Math.round((m.left + m.right) * CM);
  const f = opts.profile.fontFamily;
  const doc = new Document({
    title,
    creator: "ราชการนี้ (Ratchakarn-this)",
    description: "ร่างเอกสาร สร้างโดย ราชการนี้ ผู้ใช้ต้องตรวจทานก่อนใช้จริง",
    styles: {
      default: {
        document: {
          run: { font: { ascii: f, hAnsi: f, cs: f, eastAsia: f }, size: opts.profile.fontPt * 2, sizeComplexScript: opts.profile.fontPt * 2 },
          paragraph: { spacing: { line: 240, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4.width, height: A4.height },
            margin: {
              top: Math.round(m.top * CM),
              bottom: Math.round(m.bottom * CM),
              left: Math.round(m.left * CM),
              right: Math.round(m.right * CM),
            },
          },
        },
        children: blocks.flatMap((b) => toDocx(b, opts, widthTwips)),
      },
    ],
  });
  return Packer.toBlob(doc);
}
