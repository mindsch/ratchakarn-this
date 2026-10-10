import { useCallback, useEffect, useState } from "react";
import type { ProviderKind } from "./llm/providers";

export interface McpEntry {
  url: string;
  authorization: string;
}

export interface Settings {
  presetId: string;
  kind: ProviderKind;
  baseUrl: string;
  model: string;
  apiKey: string;
  rememberKey: boolean;
  mcp: McpEntry[];
}

const KEY = "ratchakarn.settings.v1";
const KEY_SECRET = "ratchakarn.apikey.v1";

const DEFAULTS: Settings = {
  presetId: "typhoon",
  kind: "openai",
  baseUrl: "https://api.opentyphoon.ai/v1",
  model: "",
  apiKey: "",
  rememberKey: false,
  mcp: [],
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function load(): Settings {
  const stored = safe(() => JSON.parse(localStorage.getItem(KEY) ?? "null"), null) as Partial<Settings> | null;
  const s = { ...DEFAULTS, ...(stored ?? {}) };
  const secret = safe(() => sessionStorage.getItem(KEY_SECRET) ?? localStorage.getItem(KEY_SECRET) ?? "", "");
  return { ...s, apiKey: secret };
}

/** Settings live in the browser. The API key goes to sessionStorage unless the user opts into localStorage. */
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(load);
  useEffect(() => {
    const { apiKey, ...rest } = s;
    safe(() => localStorage.setItem(KEY, JSON.stringify(rest)), undefined);
    safe(() => {
      sessionStorage.setItem(KEY_SECRET, apiKey);
      if (s.rememberKey) localStorage.setItem(KEY_SECRET, apiKey);
      else localStorage.removeItem(KEY_SECRET);
    }, undefined);
  }, [s]);
  const update = useCallback((patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch })), []);
  return [s, update];
}
