import { useEffect, useRef, useState } from "react";
import { runAi } from "../../lib/ai";
import { PRESETS } from "../../lib/llm/presets";
import { LlmError } from "../../lib/llm/providers";
import { providerPatch, type Settings } from "../../lib/settings";
import { TextInput } from "../../ui";

const SHORT: Record<string, string> = { thaillm: "ThaiLLM", typhoon: "Typhoon", ollama: "Ollama", openrouter: "OpenRouter", openai: "OpenAI", anthropic: "Claude", gemini: "Gemini", custom: "กำหนดเอง" };

export function ProviderChips({ settings, update }: { settings: Settings; update: (p: Partial<Settings>) => void }) {
  const preset = PRESETS.find((p) => p.id === settings.presetId);
  return (
    <>
      <div className="chips" role="radiogroup" aria-label="ผู้ให้บริการ">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === settings.presetId}
            className={"pchip" + (p.id === settings.presetId ? " on" : "")}
            onClick={() => {
              if (p.id === settings.presetId) return;
              update(providerPatch(settings, p));
            }}
          >
            {SHORT[p.id] ?? p.label}
          </button>
        ))}
      </div>
      <p className="current-provider" aria-live="polite">
        กำลังใช้ <strong>{SHORT[settings.presetId] ?? preset?.label ?? settings.presetId}</strong>
        {settings.model.trim() ? <> · โมเดล <strong>{settings.model}</strong></> : <> · <strong>ยังไม่ได้เลือกโมเดล</strong></>}
      </p>
      {preset && <p className="t-body-s muted">{preset.note}</p>}
    </>
  );
}

export const connectionFingerprint = (s: Settings) => [s.presetId, s.kind, s.baseUrl.trim(), s.model.trim(), s.apiKey].join("\u0000");

export type TestState = { state: "idle" | "busy" | "ok" | "fail"; msg?: string; fingerprint?: string };

/** A tiny real request, so "เชื่อมต่อแล้ว" means something. */
export function useConnectionTest() {
  const [t, setT] = useState<TestState>({ state: "idle" });
  const ac = useRef<AbortController | null>(null);
  const run = async (s: Settings): Promise<boolean> => {
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setT({ state: "busy" });
    const timer = setTimeout(() => c.abort(), 20000);
    try {
      const out = await runAi(s, "ตอบสั้นที่สุด", "ตอบว่า OK", c.signal);
      if (!out.trim()) {
        setT({ state: "fail", fingerprint: connectionFingerprint(s), msg: "เชื่อมต่อได้ แต่โมเดลตอบว่างเปล่า กรุณาตรวจชื่อโมเดลแล้วลองใหม่" });
        return false;
      }
      setT({ state: "ok", fingerprint: connectionFingerprint(s), msg: "เชื่อมต่อได้ โมเดลตอบกลับแล้ว" });
      return true;
    } catch (e) {
      const m = (e as Error).name === "AbortError" ? "ไม่ตอบกลับภายใน 20 วินาที" : e instanceof LlmError ? e.message : `${(e as Error).message}`;
      setT({ state: "fail", fingerprint: connectionFingerprint(s), msg: `เชื่อมต่อไม่สำเร็จ: ${m}` });
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
  return [t, run] as const;
}

const CUSTOM_MODEL = "__custom";

/** Dropdown of suggested models for the provider, plus a typed name for anything else. */
export function ModelPicker({ settings, update, error }: { settings: Settings; update: (patch: Partial<Settings>) => void; error?: string }) {
  const preset = PRESETS.find((p) => p.id === settings.presetId);
  const models = preset?.models ?? [];
  const [typing, setTyping] = useState(false);
  useEffect(() => setTyping(false), [settings.presetId]);
  const custom = models.length === 0 || typing || (settings.model !== "" && !models.includes(settings.model));
  return (
    <div className="stack" style={{ gap: 8 }}>
      {models.length > 0 && (
        <label className="field">
          <span className="field-label">ชื่อโมเดล</span>
          <select
            className="input"
            value={custom ? CUSTOM_MODEL : settings.model}
            onChange={(e) => {
              if (e.target.value === CUSTOM_MODEL) {
                setTyping(true);
                update({ model: "" });
              } else {
                setTyping(false);
                update({ model: e.target.value });
              }
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={CUSTOM_MODEL}>อื่นๆ (พิมพ์ชื่อเอง)</option>
          </select>
        </label>
      )}
      {custom && (
        <TextInput
          label={models.length === 0 ? "ชื่อโมเดล" : undefined}
          aria-label="ชื่อโมเดล"
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
          placeholder={preset?.modelHint}
          error={error}
        />
      )}
    </div>
  );
}
