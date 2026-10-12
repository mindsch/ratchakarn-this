import { useCallback, useEffect, useState } from "react";
import type { ProviderKind } from "./llm/providers";
import { PRESETS } from "./llm/presets";

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
const KEY_PROFILES = "ratchakarn.provider-profiles.v1";
const KEY_SECRET_PREFIX = `${KEY_SECRET}.`;

interface ProviderProfile {
  kind: ProviderKind;
  baseUrl: string;
  model: string;
}

const DEFAULTS: Settings = {
  presetId: "typhoon",
  kind: "openai",
  baseUrl: "https://api.opentyphoon.ai/v1",
  model: "typhoon-v2.5-30b-a3b-instruct",
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

const secretKey = (presetId: string) => `${KEY_SECRET_PREFIX}${presetId}`;

function profiles(): Record<string, ProviderProfile> {
  return safe(() => JSON.parse(localStorage.getItem(KEY_PROFILES) ?? "{}"), {});
}

function readSecret(presetId: string): string {
  return safe(
    () =>
      sessionStorage.getItem(secretKey(presetId)) ??
      localStorage.getItem(secretKey(presetId)) ??
      // One-time compatibility with the original single-provider storage key.
      sessionStorage.getItem(KEY_SECRET) ??
      localStorage.getItem(KEY_SECRET) ??
      "",
    "",
  );
}

function removePersistentSecrets() {
  safe(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_SECRET_PREFIX)) localStorage.removeItem(key);
    }
    localStorage.removeItem(KEY_SECRET);
  }, undefined);
}

function persistProvider(s: Settings) {
  safe(() => {
    const next = { ...profiles(), [s.presetId]: { kind: s.kind, baseUrl: s.baseUrl, model: s.model } };
    localStorage.setItem(KEY_PROFILES, JSON.stringify(next));
  }, undefined);
  // Session storage is the privacy-preserving fallback. Keep it independent from
  // localStorage so quota/private-mode failures cannot discard the tab-only key.
  safe(() => {
    const scoped = secretKey(s.presetId);
    if (s.apiKey) sessionStorage.setItem(scoped, s.apiKey);
    else sessionStorage.removeItem(scoped);
    sessionStorage.removeItem(KEY_SECRET);
  }, undefined);
  safe(() => {
    const scoped = secretKey(s.presetId);
    if (s.rememberKey && s.apiKey) localStorage.setItem(scoped, s.apiKey);
    else if (s.rememberKey) localStorage.removeItem(scoped);
    if (s.rememberKey) localStorage.removeItem(KEY_SECRET);
    else removePersistentSecrets();
  }, undefined);
}

/** Save the current provider and restore the target provider without mixing credentials or models. */
export function providerPatch(
  current: Settings,
  target: { id: string; kind: ProviderKind; baseUrl: string },
): Partial<Settings> {
  persistProvider(current);
  const saved = profiles()[target.id];
  return {
    presetId: target.id,
    kind: saved?.kind ?? target.kind,
    baseUrl: saved?.baseUrl ?? target.baseUrl,
    model: saved?.model ?? PRESETS.find((x) => x.id === target.id)?.models[0] ?? "",
    apiKey: readSecret(target.id),
  };
}

function load(): Settings {
  const stored = safe(() => JSON.parse(localStorage.getItem(KEY) ?? "null"), null) as Partial<Settings> | null;
  const s = { ...DEFAULTS, ...(stored ?? {}) };
  const secret = readSecret(s.presetId);
  return { ...s, apiKey: secret };
}

/** Settings live in the browser. The API key goes to sessionStorage unless the user opts into localStorage. */
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(load);
  useEffect(() => {
    const { apiKey, ...rest } = s;
    safe(() => localStorage.setItem(KEY, JSON.stringify(rest)), undefined);
    persistProvider(s);
  }, [s]);
  const update = useCallback((patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch })), []);
  return [s, update];
}
