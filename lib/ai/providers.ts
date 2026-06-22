/**
 * lib/ai/providers.ts — Multi-provider AI abstraction.
 *
 * Same shape as `lib/rates.ts`: a `RateProvider` interface with multiple
 * implementations, picked dynamically based on the store's config.
 *
 * The store_setting row stores `ai_provider` and `ai_model` so the owner
 * can switch providers and pick a model from /admin/configuracion.
 * API keys are environment-only (never stored in the DB).
 *
 * Free-tier friendly:
 *   - Gemini 3.5 Flash   — free with Google AI Studio account, ~15 RPM
 *   - DeepSeek Chat      — free credits for new accounts, OpenAI-compatible
 *   - OpenAI gpt-4o-mini — paid but cheap (~$0.15 / 1M input tokens)
 *   - OpenAI gpt-4.1-mini — paid, cheaper, smarter
 *
 * Env vars (set in Vercel):
 *   GEMINI_API_KEY
 *   DEEPSEEK_API_KEY
 *   OPENAI_API_KEY
 */

export type AIProviderKey = "gemini" | "deepseek" | "openai";

export interface AIProvider {
  /** Display name in admin UI. */
  name: string;
  /** Available models in the admin dropdown (newest first). */
  models: string[];
  /** Default model when this provider is selected. */
  defaultModel: string;
  /** True if the env var for this provider is set. */
  isConfigured: () => boolean;
  /**
   * Call the model and return a JSON string.
   * The provider must request JSON output and return ONLY JSON text
   * (no markdown fences). Throws on hard failure.
   */
  generateJSON: (input: GenerateInput) => Promise<string>;
}

export interface GenerateInput {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/* ============================================================
   Gemini
   ============================================================ */

interface GeminiPart {
  text: string;
}
interface GeminiContent {
  role: "user" | "model" | "system";
  parts: GeminiPart[];
}
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
}

const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";

export const geminiProvider: AIProvider = {
  name: "Google Gemini",
  models: [
    "gemini-3.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ],
  defaultModel: GEMINI_DEFAULT_MODEL,
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  async generateJSON({ system, user, model, temperature, maxOutputTokens }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no está configurada");
    const useModel = model ?? GEMINI_DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent`;
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxOutputTokens ?? 2048,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini no devolvió contenido");
    return stripJsonFences(text);
  },
};

/* ============================================================
   OpenAI-compatible (DeepSeek + OpenAI)
   ============================================================ */

interface OpenAIResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  input: GenerateInput,
  model: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxOutputTokens ?? 2048,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${baseUrl} ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as OpenAIResponse;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${baseUrl} no devolvió contenido`);
  return stripJsonFences(text);
}

export const deepseekProvider: AIProvider = {
  name: "DeepSeek",
  models: ["deepseek-chat", "deepseek-reasoner"],
  defaultModel: "deepseek-chat",
  isConfigured: () => Boolean(process.env.DEEPSEEK_API_KEY),
  async generateJSON(input) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY no está configurada");
    return callOpenAICompatible(
      "https://api.deepseek.com/v1",
      apiKey,
      input,
      input.model ?? "deepseek-chat"
    );
  },
};

export const openaiProvider: AIProvider = {
  name: "OpenAI",
  models: [
    "gpt-4.1-mini",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4o",
    "gpt-3.5-turbo",
  ],
  defaultModel: "gpt-4.1-mini",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generateJSON(input) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY no está configurada");
    return callOpenAICompatible(
      "https://api.openai.com/v1",
      apiKey,
      input,
      input.model ?? "gpt-4o-mini"
    );
  },
};

/* ============================================================
   Registry + helpers
   ============================================================ */

export const providers: Record<AIProviderKey, AIProvider> = {
  gemini: geminiProvider,
  deepseek: deepseekProvider,
  openai: openaiProvider,
};

export function getProvider(key: AIProviderKey | string): AIProvider {
  const k = (key as AIProviderKey) in providers ? (key as AIProviderKey) : "gemini";
  return providers[k];
}

/** Returns the configured provider that has its API key set, or null. */
export function getFirstConfiguredProvider(): AIProvider | null {
  for (const key of Object.keys(providers) as AIProviderKey[]) {
    if (providers[key].isConfigured()) return providers[key];
  }
  return null;
}

/** Strip markdown code fences (some models wrap JSON in ```json ... ```). */
function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
