// AI ตรวจทั้งฉบับ: suggestions are applied only by replacing their exact `original` substring in their own field.
// The document is always derived as applyAll(base, accepted), so with nothing accepted it is the base, byte for byte.
import type { DocState } from "../app";
import type { CheckSuggestion } from "../ai";
import { getField, setField } from "./sort";
import type { DocData } from "./types";

/** Advisory suggestions (e.g. ข้อมูลขาด) have no original text and are shown as notes only. */
export const isAdvisory = (s: CheckSuggestion) => !s.original;

function findInField(doc: DocData, field: string, original: string): { para?: number } | null {
  if (!original) return null;
  if (field === "body") {
    const i = doc.body.findIndex((p) => p.includes(original));
    return i >= 0 ? { para: i } : null;
  }
  return getField(doc, field).includes(original) ? {} : null;
}

/** Keep only suggestions that are well formed and whose `original` really occurs in the field. Advisories are kept. */
export function validSuggestions(doc: DocData, list: unknown): CheckSuggestion[] {
  if (!Array.isArray(list)) return [];
  return list.filter((s): s is CheckSuggestion => {
    if (!s || typeof s !== "object") return false;
    const x = s as Partial<CheckSuggestion>;
    if (typeof x.field !== "string" || typeof x.original !== "string" || typeof x.suggestion !== "string" || typeof x.kind !== "string") return false;
    if (!/^(head:|foot:)|^body$/.test(x.field)) return false;
    if (x.original === "") return true;
    return !!findInField(doc, x.field, x.original);
  });
}

export interface ApplyResult {
  state: DocState;
  ok: boolean;
  reason?: "advisory" | "not-found" | "same";
}

/** Replace the first exact occurrence of s.original inside its field. Anything else is rejected and the state is returned unchanged. */
export function applySuggestion(state: DocState, s: CheckSuggestion): ApplyResult {
  if (!s.original) return { state, ok: false, reason: "advisory" };
  if (s.original === s.suggestion) return { state, ok: false, reason: "same" };
  const hit = findInField(state.doc, s.field, s.original);
  if (!hit) return { state, ok: false, reason: "not-found" };
  const swap = (t: string) => t.replace(s.original, () => s.suggestion);
  let doc: DocData;
  if (s.field === "body") {
    const body = state.doc.body.map((p, i) => (i === hit.para ? swap(p) : p));
    doc = { ...state.doc, body };
  } else doc = setField(state.doc, s.field, swap(getField(state.doc, s.field)));
  return { state: { ...state, doc }, ok: true };
}

/** base + the accepted suggestions, in list order. Rejected ones are skipped. */
export function applyAll(base: DocState, accepted: CheckSuggestion[]): DocState {
  return accepted.reduce((st, s) => applySuggestion(st, s).state, base);
}

const fieldsOf = (d: DocData) => JSON.stringify([d.type, Object.entries(d.head), d.body, Object.entries(d.foot)]);

/** Invariant: `after` equals `before` with exactly the `accepted` suggestions applied (nothing else changed). */
export function invariantHolds(before: DocState, after: DocState, accepted: CheckSuggestion[]): boolean {
  return fieldsOf(applyAll(before, accepted).doc) === fieldsOf(after.doc);
}

export const sameDoc = (a: DocData, b: DocData) => fieldsOf(a) === fieldsOf(b);
