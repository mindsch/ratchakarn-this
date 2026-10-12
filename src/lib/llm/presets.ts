import type { ProviderKind } from "./providers";

export interface Preset {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  modelHint: string;
  /** suggested model names offered in a dropdown; the user can always type another */
  models: string[];
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
    models: [],
    note: "ประกาศว่าเข้ากันได้กับ OpenAI SDK และฟรีช่วงเปิดตัว (จำกัด 5 คำขอ/วินาที) ข้อมูลมาจากบทความภายนอก ต้องตรวจ URL เอง และผู้ให้บริการอาจไม่เปิด CORS",
    free: true,
  },
  {
    id: "typhoon",
    label: "Typhoon (SCB 10X)",
    kind: "openai",
    baseUrl: "https://api.opentyphoon.ai/v1",
    modelHint: "เช่น typhoon-v2.5-30b-a3b-instruct (ชื่ออาจเปลี่ยน)",
    models: ["typhoon-v2.5-30b-a3b-instruct", "typhoon-v2.1-12b-instruct"],
    note: "โมเดลไทย แนะนำลองเป็นอันดับแรกสำหรับภาษาราชการ ตรวจ URL/ชื่อโมเดลกับเอกสารของผู้ให้บริการ",
  },
  {
    id: "ollama",
    label: "Ollama ในเครื่อง (ไม่ต้องมีคีย์)",
    kind: "openai",
    baseUrl: "http://localhost:11434/v1",
    modelHint: "ชื่อโมเดลที่ ollama pull ไว้ เช่น qwen3.8:27b หรือ gemma4:12b",
    models: ["qwen3.8:27b", "qwen3.6:35b", "qwen3.6:27b", "qwen3.5:9b", "qwen3.5:4b", "gemma4:31b", "gemma4:26b", "gemma4:12b", "gemma4:e4b", "gemma4:e2b", "gpt-oss:120b", "gpt-oss:20b", "granite4.2:30b", "granite4.2:8b", "granite4.2:3b", "nemotron-3.5-lightning:30b", "mistral-small3.2:24b", "llama3.3:70b", "llama3.1:8b"],
    note: "ข้อมูลไม่ออกจากเครื่อง ต้องตั้ง OLLAMA_ORIGINS ให้อนุญาตเว็บนี้",
    free: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    modelHint: "เช่น google/gemini-3.8-flash หรือโมเดลใดๆ ใน OpenRouter",
    models: ["google/gemini-3.8-flash", "google/gemini-3.6-flash", "google/gemini-3.5-flash-lite", "openai/gpt-6.1-sol", "openai/gpt-6-luna", "anthropic/claude-sonnet-5.5", "anthropic/claude-haiku-5.5", "anthropic/claude-opus-5.5", "qwen/qwen3.8-flash", "qwen/qwen3.8-27b", "qwen/qwen3.8-max-0902", "deepseek/deepseek-v4.1-flash", "deepseek/deepseek-v4-pro-0813", "x-ai/grok-4.7", "moonshotai/kimi-k3", "z-ai/glm-5.3", "minimax/minimax-m3", "mistralai/mistral-large-4-0", "mistralai/mistral-small-2603", "meta-llama/llama-4-maverick", "meta-llama/llama-3.3-70b-instruct", "nvidia/nemotron-3-super-120b-a12b"],
    note: "คีย์เดียวใช้ได้หลายโมเดล รองรับการเรียกจากเบราว์เซอร์",
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    modelHint: "เช่น gpt-6.1-sol",
    models: ["gpt-6.1-sol", "gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5.2", "gpt-5.1", "gpt-5", "gpt-5-mini", "gpt-5-nano"],
    note: "โมเดลชั้นนำ ภาษาไทยดี",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    modelHint: "เช่น claude-sonnet-5-5 หรือ claude-haiku-5-5",
    models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
    note: "ภาษาไทยดีมาก ทำตามแม่แบบผลลัพธ์ได้เสถียร",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    modelHint: "เช่น gemini-3.8-flash",
    models: ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
    note: "มีโควตาฟรีบางส่วน",
    free: true,
  },
  {
    id: "custom",
    label: "กำหนดเอง (OpenAI-compatible)",
    kind: "openai",
    baseUrl: "",
    modelHint: "ชื่อโมเดล",
    models: [],
    note: "ใช้กับ vLLM, LM Studio, Groq, หรือ gateway ของคุณเอง",
  },
];
