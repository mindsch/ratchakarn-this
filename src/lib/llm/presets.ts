import type { ProviderKind } from "./providers";

export interface Preset {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  modelHint: string;
  /** shown in the UI; honest about what we have and have not tested */
  note: string;
  free?: boolean;
}

/**
 * Suggested starting points, NOT tested by us yet. Endpoints and model names change: check the provider's docs.
 */
export const PRESETS: Preset[] = [
  {
    id: "thaillm",
    label: "ThaiLLM (โครงการแห่งชาติ — ทดลองใช้ฟรี)",
    kind: "openai",
    baseUrl: "",
    modelHint: "ดูชื่อโมเดลและ URL ที่ playground.thaillm.or.th",
    note: "ประกาศว่าเข้ากันได้กับ OpenAI SDK และฟรีช่วงเปิดตัว (จำกัด 5 คำขอ/วินาที) ข้อมูลมาจากบทความภายนอก ต้องตรวจ URL เอง และผู้ให้บริการอาจไม่เปิด CORS",
    free: true,
  },
  {
    id: "typhoon",
    label: "Typhoon (SCB 10X)",
    kind: "openai",
    baseUrl: "https://api.opentyphoon.ai/v1",
    modelHint: "เช่น typhoon-v2.5-30b-a3b-instruct (ชื่ออาจเปลี่ยน)",
    note: "โมเดลไทย แนะนำลองเป็นอันดับแรกสำหรับภาษาราชการ ตรวจ URL/ชื่อโมเดลกับเอกสารของผู้ให้บริการ",
  },
  {
    id: "ollama",
    label: "Ollama ในเครื่อง (ไม่ต้องมีคีย์)",
    kind: "openai",
    baseUrl: "http://localhost:11434/v1",
    modelHint: "ชื่อโมเดลที่ ollama pull ไว้ เช่น Typhoon 2.5 4B (GGUF) หรือ Qwen3",
    note: "ข้อมูลไม่ออกจากเครื่อง ต้องตั้ง OLLAMA_ORIGINS ให้อนุญาตเว็บนี้",
    free: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    modelHint: "เช่น google/gemini-2.5-flash หรือโมเดลใดๆ ใน OpenRouter",
    note: "คีย์เดียวใช้ได้หลายโมเดล รองรับการเรียกจากเบราว์เซอร์",
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelHint: "เช่น gpt-4o-mini",
    note: "โมเดลชั้นนำ ภาษาไทยดี",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    modelHint: "เช่น claude-sonnet-5-5 หรือ claude-haiku-5-5",
    note: "ภาษาไทยดีมาก ทำตามแม่แบบผลลัพธ์ได้เสถียร",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    modelHint: "เช่น gemini-2.5-flash",
    note: "มีโควตาฟรีบางส่วน",
    free: true,
  },
  {
    id: "custom",
    label: "กำหนดเอง (OpenAI-compatible)",
    kind: "openai",
    baseUrl: "",
    modelHint: "ชื่อโมเดล",
    note: "ใช้กับ vLLM, LM Studio, Groq, หรือ gateway ของคุณเอง",
  },
];
