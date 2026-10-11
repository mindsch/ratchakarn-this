// App-wide state: route, settings (BYOK), โหมด XP replica, and the shared document (Draft and Format both end in Export).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DocData } from "./doc/types";
import { DEFAULT_TYPE } from "./doc/types";
import { useSettings, type Settings } from "./settings";

export type Route = "chat" | "draft" | "format" | "prompts" | "settings";
const ROUTES: Route[] = ["chat", "draft", "format", "prompts", "settings"];

/* ---------- Document state ---------- */
/** Field keys: "head:<key>", "foot:<key>", or "body". */
export type FieldKey = string;
export type FieldStatus = "filled" | "empty" | "skipped";
export interface Span {
  start: number;
  end: number;
}
export interface Unplaced {
  text: string;
  span: Span;
  /** a code-made guess of the field, e.g. "foot:โทร" */
  guess?: FieldKey;
}
export interface DocState {
  doc: DocData;
  /** per-field status; fields not listed count as filled when they have text */
  status: Record<FieldKey, FieldStatus>;
  /** original pasted blob (จัดรูปแบบ) */
  raw?: string;
  /** where each field came from in `raw` */
  sources?: Record<FieldKey, Span[]>;
  /** chunks of `raw` code could not place */
  unplaced?: Unplaced[];
  /** which flow built this document, so Export's back button goes the right way */
  origin?: "format" | "draft";
}

export const PLACEHOLDER = "[ระบุ...]";
export const emptyDoc = (type = DEFAULT_TYPE): DocState => ({ doc: { type, head: {}, body: [], foot: {} }, status: {} });

/** The document as it will be exported: skipped or empty fields become [ระบุ...]. */
export function finalDoc(s: DocState): DocData {
  const fill = (part: "head" | "foot", src: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(src).map(([k, v]) => {
        const st = s.status[`${part}:${k}`];
        return [k, st === "skipped" || st === "empty" || !v.trim() ? PLACEHOLDER : v];
      }),
    );
  const bodySt = s.status.body;
  return {
    ...s.doc,
    head: fill("head", s.doc.head),
    foot: fill("foot", s.doc.foot),
    body: bodySt === "skipped" || !s.doc.body.length ? [PLACEHOLDER] : s.doc.body,
  };
}

/* ---------- โหมด XP replica (chrome only, persisted) ---------- */
const XP_KEY = "ratchakarn.xp.v1";
function useXpMode(): [boolean, (v: boolean) => void] {
  const [xp, setXp] = useState(() => {
    try {
      return localStorage.getItem(XP_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = xp ? "xp" : "standard";
    try {
      localStorage.setItem(XP_KEY, xp ? "1" : "0");
    } catch {
      /* private mode: setting lasts for this tab only */
    }
  }, [xp]);
  return [xp, setXp];
}

/* ---------- Route (hash, so reload keeps the page) ---------- */
function readRoute(): Route {
  const r = location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(r) ? r : "chat";
}

interface AppCtx {
  route: Route;
  go: (r: Route) => void;
  settings: Settings;
  updateSettings: (p: Partial<Settings>) => void;
  hasKey: boolean;
  xp: boolean;
  setXp: (v: boolean) => void;
  docState: DocState;
  setDocState: (s: DocState | ((p: DocState) => DocState)) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(readRoute);
  const [settings, updateSettings] = useSettings();
  const [xp, setXp] = useXpMode();
  const [docState, setDocState] = useState<DocState>(() => emptyDoc());

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((r: Route) => {
    location.hash = `/${r}`;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(
    () => ({ route, go, settings, updateSettings, hasKey: !!settings.apiKey.trim(), xp, setXp, docState, setDocState }),
    [route, go, settings, updateSettings, xp, setXp, docState],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
