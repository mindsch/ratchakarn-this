// Single source for the joke themes (decision 0003). Mirrors the Figma Tokens/Dimensions modes in file RyaDjrolWmaXIVR4G6z26c.
// `node scripts/gen-themes.mjs` writes src/styles/themes.generated.css (primitives + per-theme token overrides).
// Component rules that tokens cannot express live by hand in src/styles/themes.css.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** New primitives (Figma Primitives collection, code syntax var(--<name with / → ->)). Existing primitives are referenced by name only. */
export const NEW_PRIMITIVES = {
  "xp/canvas": "#2F62C0", "xp/ink": "#111111", "xp/text-muted": "#4A4A4A", "xp/text-subtle": "#5E5E5E",
  "xp/balloon": "#FFFFE1", "xp/danger-bg": "#FDE3E0", "xp/border-blue": "#003C74", "xp/field-border": "#7F9DB9", "xp/close": "#E0472A",
  "teak/50": "#F9F1E1", "teak/100": "#F2E4CC", "teak/200": "#E8D3B8", "teak/300": "#D9B898", "teak/400": "#C49470", "teak/500": "#A8744A",
  "teak/600": "#8A5A33", "teak/700": "#6E4526", "teak/800": "#53321B", "teak/900": "#3A2212", "teak/950": "#231409", "teak/ink": "#2A1A0E", "teak/link": "#7F3A10",
  "cream/50": "#FFFBF0", "cream/100": "#FBF3DC", "cream/200": "#F3E6C4", "cream/300": "#E8D5A6",
  "gold/300": "#F2D36B", "gold/400": "#E7BC3A", "gold/500": "#CFA02A", "gold/600": "#A97E1C", "gold/700": "#7F5E15", "gold/warn-bg": "#FBEFC2", "gold/warn-text": "#5B430E",
  "vermilion/50": "#F6DDD8", "vermilion/600": "#B3261E", "vermilion/700": "#8E2318",
  "moss/50": "#EAF0DC", "moss/700": "#3F5E22",
  "indigo/50": "#E1E8EE", "indigo/600": "#2F4F6B", "indigo/700": "#24425A",
  "aibrand/25": "#EFF4FD", "aibrand/50": "#EEF3FF", "aibrand/100": "#D7E5FC", "aibrand/200": "#B3CBF0", "aibrand/300": "#8EB2E9", "aibrand/400": "#357DF0",
  "aibrand/500": "#0052FF", "aibrand/600": "#0047DC", "aibrand/700": "#0038B6", "aibrand/800": "#002D92", "aibrand/900": "#082762",
  "aiaccent/cyan": "#00B4FF", "aiaccent/mint": "#56FFC6", "aiaccent/mint-50": "#EEFFF9", "aiaccent/lime": "#C5EC67", "aiaccent/violet": "#905EFF",
  "aigray/50": "#FDFDFD", "aigray/100": "#F9F9F9", "aigray/200": "#F3F3F3", "aigray/300": "#F1F1F1", "aigray/400": "#E4E4E4", "aigray/500": "#B9B9B9",
  "aigray/600": "#989898", "aigray/700": "#686868", "aigray/800": "#4B4B4B", "aigray/900": "#1E1E1E",
  "aistatus/success-50": "#ECFDF3", "aistatus/success-500": "#17B26A", "aistatus/success-700": "#067647",
  "aistatus/warning-50": "#FFF4E6", "aistatus/warning-500": "#FF8C05", "aistatus/warning-800": "#8C4D03",
  "aistatus/error-50": "#FEF3F2", "aistatus/error-500": "#F04438", "aistatus/error-700": "#B42318", "aistatus/error-800": "#912018",
  "aistatus/info-700": "#204B90",
  "aibrand/shadow": "#0052FF2E",
};

/** Token type for tokens the file does not have yet (name → [type, scopes]). */
export const NEW_TOKENS = {
  "text/title": ["COLOR", ["TEXT_FILL"]],
  "nav/bg": ["COLOR", ["FRAME_FILL", "SHAPE_FILL"]], "nav/text": ["COLOR", ["TEXT_FILL"]],
  "nav/selected-bg": ["COLOR", ["FRAME_FILL", "SHAPE_FILL"]], "nav/selected-text": ["COLOR", ["TEXT_FILL"]], "nav/border": ["COLOR", ["STROKE_COLOR"]],
  "font/ui": ["STRING", ["FONT_FAMILY"]], "font/display": ["STRING", ["FONT_FAMILY"]], "font/logo": ["STRING", ["FONT_FAMILY"]],
  "chrome/shadow/x": ["FLOAT", ["EFFECT_FLOAT"]],
};

const PLEX = '"IBM Plex Sans Thai", "IBM Plex Sans", system-ui, sans-serif';

/** Tokens collection modes. Values: primitive name (existing or new) | number | boolean | string. */
export const TOKENS = {
  Standard: { // only the tokens that are new; existing ones keep their current values
    "text/title": "grey/900", "nav/bg": "white", "nav/text": "grey/600", "nav/selected-bg": "xpblue/50", "nav/selected-text": "xpblue/600", "nav/border": "grey/150",
    "font/ui": PLEX, "font/display": PLEX, "font/logo": '"Trirong", serif', "chrome/shadow/x": 3,
  },
  XP: {
    "bg/default": "xp/canvas", "bg/subtle": "beige/200", "bg/inverse": "xpblue/900", "bg/desk": "beige/200",
    "surface/default": "beige/100", "surface/muted": "beige/50", "surface/raised": "beige/100", "surface/selected": "xpblue/100",
    "text/default": "xp/ink", "text/muted": "xp/text-muted", "text/subtle": "xp/text-subtle", "text/inverse": "white", "text/on-primary": "white", "text/link": "xpblue/600", "text/danger": "red/700", "text/title": "white",
    "border/default": "xp/field-border", "border/subtle": "beige/300", "border/strong": "xp/border-blue", "border/focus": "xpblue/600", "border/danger": "red/600",
    "action/primary/bg": "xpblue/600", "action/primary/bg-pressed": "xpblue/700", "action/primary/text": "white",
    "action/secondary/bg": "beige/50", "action/secondary/text": "xp/ink", "action/secondary/border": "xp/border-blue",
    "action/ghost/text": "xp/text-muted", "action/tertiary/bg": "beige/200", "action/tertiary/text": "xp/ink",
    "action/accent/bg": "xp/balloon", "action/accent/text": "xp/ink", "action/disabled/bg": "beige/200", "action/disabled/text": "beige/600",
    "action/danger/bg": "red/600", "action/danger/bg-pressed": "red/700", "action/danger/text": "white",
    "feedback/success/bg": "xpgreen/50", "feedback/success/text": "xpgreen/800", "feedback/success/icon": "xpgreen/600",
    "feedback/warning/bg": "xp/balloon", "feedback/warning/text": "xp/ink", "feedback/warning/icon": "yellow/600",
    "feedback/danger/bg": "xp/danger-bg", "feedback/danger/text": "red/700", "feedback/danger/icon": "red/600",
    "feedback/info/bg": "xpblue/50", "feedback/info/text": "xpblue/800", "feedback/info/icon": "xpblue/600",
    "brand/stamp": "red/600", "brand/wink": "xp/balloon", "brand/ink": "xpblue/900", "brand/paper": "white",
    "nav/bg": "xpblue/600", "nav/text": "white", "nav/selected-bg": "xpblue/700", "nav/selected-text": "white", "nav/border": "xpblue/900",
    "chrome/titlebar/bg": "xpblue/600", "chrome/titlebar/text": "white", "chrome/window/bg": "beige/100", "chrome/window/border": "xpblue/600",
    "chrome/window/control-bg": "xpblue/500", "chrome/window/control-border": "white",
    "chrome/button/bg": "beige/50", "chrome/button/border": "xp/border-blue", "chrome/button/text": "xp/ink",
    "chrome/progress/fill": "xpgreen/500", "chrome/progress/track": "white",
    "chrome/titlebar/gradient": true, "chrome/progress/segmented": true, "chrome/progress/smooth": false,
    "chrome/shadow/color": "black-45", "chrome/shadow/x": 2, "chrome/shadow/offset": 3, "chrome/shadow/blur": 8, "chrome/window/radius": 8,
    "font/ui": 'Tahoma, "Noto Sans Thai", sans-serif', "font/display": '"Trebuchet MS", Tahoma, "Noto Sans Thai", sans-serif', "font/logo": '"Trebuchet MS", Tahoma, "Noto Sans Thai", sans-serif',
  },
  Gov: {
    "bg/default": "cream/200", "bg/subtle": "teak/100", "bg/inverse": "teak/900", "bg/desk": "teak/200",
    "surface/default": "cream/50", "surface/muted": "cream/100", "surface/raised": "cream/50", "surface/selected": "teak/100",
    "text/default": "teak/ink", "text/muted": "teak/700", "text/subtle": "teak/600", "text/inverse": "cream/50", "text/on-primary": "cream/50", "text/link": "teak/link", "text/danger": "vermilion/700", "text/title": "teak/950",
    "border/default": "teak/300", "border/subtle": "cream/300", "border/strong": "teak/800", "border/focus": "teak/800", "border/danger": "vermilion/600",
    "action/primary/bg": "teak/800", "action/primary/bg-pressed": "teak/900", "action/primary/text": "cream/50",
    "action/secondary/bg": "cream/50", "action/secondary/text": "teak/900", "action/secondary/border": "teak/800",
    "action/ghost/text": "teak/700", "action/tertiary/bg": "teak/100", "action/tertiary/text": "teak/900",
    "action/accent/bg": "gold/400", "action/accent/text": "teak/950", "action/disabled/bg": "teak/100", "action/disabled/text": "teak/400",
    "action/danger/bg": "vermilion/600", "action/danger/bg-pressed": "vermilion/700", "action/danger/text": "cream/50",
    "feedback/success/bg": "moss/50", "feedback/success/text": "moss/700", "feedback/success/icon": "moss/700",
    "feedback/warning/bg": "gold/warn-bg", "feedback/warning/text": "gold/warn-text", "feedback/warning/icon": "gold/600",
    "feedback/danger/bg": "vermilion/50", "feedback/danger/text": "vermilion/700", "feedback/danger/icon": "vermilion/600",
    "feedback/info/bg": "indigo/50", "feedback/info/text": "indigo/700", "feedback/info/icon": "indigo/600",
    "brand/stamp": "vermilion/600", "brand/wink": "gold/400", "brand/ink": "teak/950", "brand/paper": "white",
    "nav/bg": "teak/900", "nav/text": "cream/100", "nav/selected-bg": "gold/400", "nav/selected-text": "teak/950", "nav/border": "gold/400",
    "chrome/titlebar/bg": "teak/800", "chrome/titlebar/text": "cream/50", "chrome/window/bg": "cream/50", "chrome/window/border": "teak/800",
    "chrome/window/control-bg": "teak/800", "chrome/window/control-border": "gold/400",
    "chrome/button/bg": "cream/50", "chrome/button/border": "teak/800", "chrome/button/text": "teak/900",
    "chrome/progress/fill": "gold/400", "chrome/progress/track": "teak/100",
    "chrome/titlebar/gradient": false, "chrome/progress/segmented": false, "chrome/progress/smooth": true,
    "chrome/shadow/color": "teak/900", "chrome/shadow/x": 3, "chrome/shadow/offset": 3, "chrome/shadow/blur": 0, "chrome/window/radius": 2,
    "font/ui": 'Sarabun, "Noto Sans Thai", sans-serif', "font/display": 'Trirong, Sarabun, serif', "font/logo": 'Trirong, Sarabun, serif',
  },
  "AI Pass": {
    "bg/default": "aigray/200", "bg/subtle": "aigray/300", "bg/inverse": "aigray/900", "bg/desk": "aibrand/100",
    "surface/default": "white", "surface/muted": "aigray/100", "surface/raised": "white", "surface/selected": "aibrand/50",
    "text/default": "aigray/900", "text/muted": "aigray/800", "text/subtle": "aigray/700", "text/inverse": "white", "text/on-primary": "white", "text/link": "aibrand/600", "text/danger": "aistatus/error-700", "text/title": "aigray/900",
    "border/default": "aigray/500", "border/subtle": "aigray/300", "border/strong": "aigray/900", "border/focus": "aibrand/500", "border/danger": "aistatus/error-500",
    "action/primary/bg": "aibrand/500", "action/primary/bg-pressed": "aibrand/600", "action/primary/text": "white",
    "action/secondary/bg": "white", "action/secondary/text": "aigray/900", "action/secondary/border": "aigray/500",
    "action/ghost/text": "aigray/800", "action/tertiary/bg": "aibrand/50", "action/tertiary/text": "aibrand/600",
    "action/accent/bg": "aiaccent/mint", "action/accent/text": "aigray/900", "action/disabled/bg": "aigray/300", "action/disabled/text": "aigray/600",
    "action/danger/bg": "aistatus/error-700", "action/danger/bg-pressed": "aistatus/error-800", "action/danger/text": "white",
    "feedback/success/bg": "aistatus/success-50", "feedback/success/text": "aistatus/success-700", "feedback/success/icon": "aistatus/success-500",
    "feedback/warning/bg": "aistatus/warning-50", "feedback/warning/text": "aistatus/warning-800", "feedback/warning/icon": "aistatus/warning-500",
    "feedback/danger/bg": "aistatus/error-50", "feedback/danger/text": "aistatus/error-700", "feedback/danger/icon": "aistatus/error-500",
    "feedback/info/bg": "aibrand/100", "feedback/info/text": "aistatus/info-700", "feedback/info/icon": "aibrand/400",
    "brand/stamp": "aistatus/error-700", "brand/wink": "aiaccent/mint", "brand/ink": "aibrand/900", "brand/paper": "white",
    "nav/bg": "white", "nav/text": "aigray/900", "nav/selected-bg": "aibrand/500", "nav/selected-text": "white", "nav/border": "aigray/400",
    "chrome/titlebar/bg": "aibrand/700", "chrome/titlebar/text": "white", "chrome/window/bg": "white", "chrome/window/border": "aibrand/500",
    "chrome/window/control-bg": "aibrand/500", "chrome/window/control-border": "white",
    "chrome/button/bg": "white", "chrome/button/border": "aibrand/500", "chrome/button/text": "aibrand/600",
    "chrome/progress/fill": "aibrand/500", "chrome/progress/track": "aibrand/100",
    "chrome/titlebar/gradient": true, "chrome/progress/segmented": false, "chrome/progress/smooth": true,
    "chrome/shadow/color": "aibrand/shadow", "chrome/shadow/x": 0, "chrome/shadow/offset": 10, "chrome/shadow/blur": 28, "chrome/window/radius": 16,
    "font/ui": '"Noto Sans Thai Looped", "Noto Sans Thai", sans-serif', "font/display": '"Noto Sans Thai Looped", "Noto Sans Thai", sans-serif', "font/logo": '"Noto Sans Thai Looped", "Noto Sans Thai", sans-serif',
  },
};

/** Dimensions collection: radius per mode, as radius/<n> aliases. */
export const NEW_RADII = [2, 3];
export const RADII = {
  Standard: { "radius/pill": "full" },
  XP: { "radius/control": 3, "radius/card": 8, "radius/overlay": 8, "radius/tag": 3, "radius/pill": 3 },
  Gov: { "radius/control": 4, "radius/card": 6, "radius/overlay": 8, "radius/tag": 2, "radius/pill": 4 },
  "AI Pass": { "radius/control": 10, "radius/card": 16, "radius/overlay": 24, "radius/tag": 6, "radius/pill": "full" },
};

const THEME_ATTR = { XP: "xp", Gov: "gov", "AI Pass": "aipass" };
const FLOAT = new Set(["chrome/shadow/x", "chrome/shadow/offset", "chrome/shadow/blur", "chrome/window/radius"]);
const BOOL = new Set(["chrome/titlebar/gradient", "chrome/progress/segmented", "chrome/progress/smooth"]);
const cssName = (n) => (n.startsWith("chrome/shadow/") || n === "chrome/window/radius" || BOOL.has(n) || n.startsWith("font/") ? "--" : "--color-") + n.replace(/\//g, "-");
const prim = (n) => `var(--${n.replace(/\//g, "-")})`;
const cssValue = (n, v) => (typeof v === "boolean" ? (v ? "1" : "0") : typeof v === "number" ? `${v}px` : FLOAT.has(n) ? `${v}px` : n.startsWith("font/") ? v : prim(v));
const radiusVal = (v) => (v === "full" ? "var(--radius-full)" : `var(--radius-${v})`);

function block(sel, tokens, radii) {
  const lines = Object.entries(tokens).map(([n, v]) => `  ${cssName(n)}: ${cssValue(n, v)};`);
  for (const [n, v] of Object.entries(radii)) lines.push(`  --${n.replace("/", "-")}: ${radiusVal(v)};`);
  return `${sel} {\n${lines.join("\n")}\n}\n`;
}

export function css() {
  const out = ["/* Generated by scripts/gen-themes.mjs from the same data as Figma file RyaDjrolWmaXIVR4G6z26c (Tokens + Dimensions modes). Do not edit by hand. */\n"];
  const roots = Object.entries(NEW_PRIMITIVES).map(([n, hex]) => `  --${n.replace(/\//g, "-")}: ${hex};`);
  roots.push(...NEW_RADII.map((r) => `  --radius-${r}: ${r}px;`));
  out.push(`:root {\n${roots.join("\n")}\n}\n`);
  out.push(block(":root", TOKENS.Standard, RADII.Standard));
  for (const [mode, attr] of Object.entries(THEME_ATTR)) out.push(block(`[data-theme="${attr}"]`, TOKENS[mode], RADII[mode]));
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(new URL("../src/styles/themes.generated.css", import.meta.url), css());
  console.log("wrote src/styles/themes.generated.css");
}
