import type { Block, RenderOptions, Run } from "./layout";
import { SLOT_HINT } from "./layout";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function runHtml(r: Run, basePt: number): string {
  const st: string[] = [];
  if (r.bold) st.push("font-weight:700");
  if (r.sizePt && r.sizePt !== basePt) st.push(`font-size:${r.sizePt}pt`);
  if (r.color) st.push(`color:#${r.color}`);
  if (r.underline) st.push("text-decoration:underline");
  const t = esc(r.text).replace(/ {2,}/g, (m) => "&nbsp;".repeat(m.length));
  return st.length ? `<span style="${st.join(";")}">${t}</span>` : t;
}

function blockHtml(b: Block, opts: RenderOptions, preview: boolean): string {
  const pf = opts.profile;
  switch (b.k) {
    case "gap":
      return `<div style="height:${b.pt}pt"></div>`;
    case "rule":
      return `<div style="border-bottom:1px solid #000;margin:4pt 0"></div>`;
    case "garuda": {
      const justify = b.align === "center" ? "center" : "flex-start";
      const img = opts.garudaImage;
      const inner = img
        ? `<img src="${img.dataUrl}" style="height:${b.heightCm}cm;width:auto" alt="">`
        : preview && opts.showSlotHint
          ? `<span class="slot-hint">${SLOT_HINT}</span>`
          : "";
      return `<div style="height:${b.heightCm}cm;display:flex;justify-content:${justify};align-items:center">${inner}</div>`;
    }
    case "cols":
      return `<div style="display:flex;align-items:flex-start"><div style="width:${b.leftCm}cm;flex:none">${b.left
        .map((x) => blockHtml(x, opts, preview))
        .join("")}</div><div style="flex:1">${b.right.map((x) => blockHtml(x, opts, preview)).join("")}</div></div>`;
    case "p": {
      const st: string[] = [];
      st.push(`text-align:${b.align ?? "left"}`);
      if (b.leftCm) st.push(`margin-left:${b.leftCm}cm`);
      if (b.firstLineCm) st.push(`text-indent:${b.firstLineCm}cm`);
      if (b.beforePt) st.push(`margin-top:${b.beforePt}pt`);
      if (b.afterPt) st.push(`margin-bottom:${b.afterPt}pt`);
      if (b.exactPt) st.push(`line-height:${b.exactPt}pt`);
      if (b.borderBottom) st.push("border-bottom:1px dotted #000");
      const html = b.runs.map((r) => runHtml(r, pf.fontPt)).join("") || "&nbsp;";
      return `<p style="${st.join(";")}">${html}</p>`;
    }
  }
}

export function renderInner(blocks: Block[], opts: RenderOptions, preview: boolean): string {
  return blocks.map((b) => blockHtml(b, opts, preview)).join("\n");
}

const FONT_STACK = (family: string) => `'${family}','TH Sarabun New','THSarabunNew','TH SarabunPSK','Sarabun',sans-serif`;

export function pageCss(opts: RenderOptions): string {
  const pf = opts.profile;
  return `
  .rk-page{font-family:${FONT_STACK(pf.fontFamily)};font-size:${pf.fontPt}pt;line-height:1.2;color:#000;background:#fff;text-align:left}
  .rk-page p{margin:0;word-break:normal;overflow-wrap:break-word;text-align-last:auto}
  .rk-page p[style*="justify"]{text-justify:inter-character}
  `;
}

/** Full standalone HTML for printing to PDF through the browser (exact cm margins via @page). */
export function printHtml(blocks: Block[], opts: RenderOptions, title: string): string {
  const m = opts.profile.marginsCm;
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:${m.top}cm ${m.right}cm ${m.bottom}cm ${m.left}cm}
html,body{margin:0;padding:0;background:#fff}
${pageCss(opts)}
.slot-hint{display:none}
</style></head><body><div class="rk-page">${renderInner(blocks, opts, false)}</div></body></html>`;
}
