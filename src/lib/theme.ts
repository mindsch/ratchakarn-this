// Joke themes (decision 0003). `standard` is the original look and applies no overrides.
export type Theme = "standard" | "xp" | "gov" | "aipass";

export const THEMES: { id: Theme; label: string }[] = [
  { id: "standard", label: "ปกติ" },
  { id: "xp", label: "วินโดว์ XP" },
  { id: "gov", label: "ราชการไทย" },
  { id: "aipass", label: "TH-AI Passport" },
];

const KEY = "ratchakarn.theme.v1";
const LEGACY_XP_KEY = "ratchakarn.xp.v1";

const isTheme = (v: unknown): v is Theme => THEMES.some((t) => t.id === v);

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (isTheme(saved)) return saved;
    // The earlier "โหมด XP replica" switch maps to the XP theme.
    return localStorage.getItem(LEGACY_XP_KEY) === "1" ? "xp" : "standard";
  } catch {
    return "standard";
  }
}

export function saveTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: the theme lasts for this tab only */
  }
}
