import { useRef, useState } from "react";
import { runAi } from "../../lib/ai";
import { PRESETS } from "../../lib/llm/presets";
import { LlmError } from "../../lib/llm/providers";
import type { Settings } from "../../lib/settings";

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
            onClick={() => update({ presetId: p.id, kind: p.kind, baseUrl: p.baseUrl })}
          >
            {SHORT[p.id] ?? p.label}
          </button>
        ))}
      </div>
      {preset && <p className="t-body-s muted">{preset.note}</p>}
    </>
  );
}

export type TestState = { state: "idle" | "busy" | "ok" | "fail"; msg?: string };

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
      setT({ state: "ok", msg: out.trim() ? "เชื่อมต่อได้ โมเดลตอบกลับแล้ว" : "เชื่อมต่อได้ แต่โมเดลตอบว่างเปล่า ลองตรวจชื่อโมเดล" });
      return true;
    } catch (e) {
      const m = (e as Error).name === "AbortError" ? "ไม่ตอบกลับภายใน 20 วินาที" : e instanceof LlmError ? e.message : `${(e as Error).message}`;
      setT({ state: "fail", msg: `เชื่อมต่อไม่สำเร็จ: ${m}` });
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
  return [t, run] as const;
}
