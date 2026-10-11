// One-shot AI helpers for the two in-app AI actions (AI ช่วยร่าง, AI ตรวจทั้งฉบับ) and the brief pre-fill.
// AI is optional everywhere: callers must offer "ไม่มีคีย์? คัดลอกพรอมต์แทน" when aiReady() is false.
import { streamChat } from "./llm/providers";
import type { Settings } from "./settings";

export const aiReady = (s: Settings) => !!(s.model.trim() && s.baseUrl.trim() && (s.apiKey.trim() || s.presetId === "ollama"));

/** Send one user message with a system prompt and return the whole reply. Throws LlmError on failure. */
export async function runAi(s: Settings, system: string, user: string, signal?: AbortSignal): Promise<string> {
  const cfg = {
    kind: s.kind,
    baseUrl: s.baseUrl,
    apiKey: s.apiKey,
    model: s.model,
    maxTokens: 2048,
    temperature: 0.1,
    repetitionPenalty: s.presetId === "typhoon" ? 1.05 : undefined,
  };
  let out = "";
  for await (const chunk of streamChat(cfg, system, [{ role: "user", content: user }], signal)) out += chunk;
  return out;
}

/** Pull the first JSON value out of a reply (fenced ```json block or bare). Returns null if none parses. */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [fenced?.[1], text.slice(text.search(/[[{]/))].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim()) as T;
    } catch {
      /* try next */
    }
  }
  return null;
}

/* ---------- Contracts (prompts/modes/*.md must produce exactly these) ---------- */

/** SYSTEM_PROMPTS.check — AI ตรวจทั้งฉบับ. Reply: a JSON array of suggestions only; never the whole letter. */
export interface CheckSuggestion {
  /** short Thai label, e.g. "สะกดคำ", "คำลงท้าย", "วันที่ พ.ศ.", "ข้อมูลขาด", "ภาษาราชการ" */
  kind: string;
  /** field key, e.g. "head:วันที่", "foot:คำลงท้าย", "body" */
  field: string;
  /** exact substring of that field's current text ("" when the field is empty/missing) */
  original: string;
  /** replacement text; for "ข้อมูลขาด" a question/hint for the user instead */
  suggestion: string;
  note?: string;
}

/** SYSTEM_PROMPTS.prefill — brief → facts. Reply: JSON object {slot: value | null}; null when the brief doesn't say. Never invent. */
export type PrefillResult = Record<string, string | null>;

/** SYSTEM_PROMPTS.draftBody — AI ช่วยร่าง. Reply: body paragraphs as plain text separated by blank lines; keep [ระบุ...] for missing facts. */
export type DraftBodyResult = string;
