import { NextResponse } from "next/server";
import { getActiveProducts, getCategories } from "@/lib/supabase-queries";
import { getProvider } from "@/lib/ai/providers";
import type { Product } from "@/lib/database.types";
import type { AIProviderKey } from "@/lib/ai/providers";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * POST /api/rutina/recomendar
 *
 * Body: {
 *   skin_type: "seca" | "grasa" | "mixta" | "sensible",
 *   concerns: string[]   // e.g. ["hidratacion", "acne"]
 *   age_range: "18-25" | "26-35" | "36-45" | "46+",
 *   time_of_day: "mañana" | "noche" | "ambos",
 *   experience: "principiante" | "intermedio" | "avanzado"
 * }
 *
 * Response: { ok: true, routine: {...}, provider: "gemini", model: "..." }
 *
 * The provider is read from the store_setting row (ai_provider, ai_model),
 * so the owner can switch from /admin/configuracion without redeploying.
 * API keys stay in env vars (never in the DB).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RoutineRequest {
  skin_type?: string;
  concerns?: string[];
  age_range?: string;
  time_of_day?: string;
  experience?: string;
}

interface RoutineStep {
  step: string;
  product_slug: string;
  reason: string;
}

interface Routine {
  morning: RoutineStep[];
  evening: RoutineStep[];
  tips: string[];
  summary: string;
}

const SYSTEM_PROMPT = `Eres una asesora experta en skincare coreano (K-beauty) para la tienda Soko Beauty en Venezuela.
Tu trabajo: recomendar una rutina personalizada usando SOLO los productos del catálogo que te paso.
Nunca inventes productos. Si un producto del catálogo no encaja, no lo incluyas.
Responde SIEMPRE en español, con tono cálido y profesional (no médico, no prometiendo curar nada).
Prioriza: limpieza → hidratación → protección solar.`;

function buildUserPrompt(
  answers: RoutineRequest,
  catalog: Product[],
  concernLabels: Record<string, string>
): string {
  const cat = catalog
    .map(
      (p) =>
        `- slug: ${p.slug} | ${p.brand} — ${p.name} | $${p.price_usd} | paso: ${p.routine_step ?? "—"} | necesidades: ${(p.skin_concern ?? []).join(",") || "—"}`
    )
    .join("\n");

  const concerns = (answers.concerns ?? [])
    .map((c) => concernLabels[c] ?? c)
    .join(", ");

  return `
PERFIL DEL CLIENTE:
- Tipo de piel: ${answers.skin_type ?? "no especificado"}
- Preocupaciones: ${concerns || "ninguna en particular"}
- Edad: ${answers.age_range ?? "no especificada"}
- Momento de la rutina: ${answers.time_of_day ?? "ambos"}
- Experiencia con K-beauty: ${answers.experience ?? "principiante"}

CATÁLOGO DISPONIBLE (úsalo como única fuente de productos):
${cat}

INSTRUCCIONES:
1. Recomienda una rutina con productos SOLO del catálogo de arriba.
2. Si la respuesta es para "mañana" o "ambos", incluye una sección "morning".
3. Si la respuesta es para "noche" o "ambos", incluye una sección "evening".
4. Cada paso debe tener: nombre del paso (Limpiador, Tónico, Esencia, Sérum, Hidratante, Protector Solar, etc.), slug EXACTO del producto del catálogo, y una razón breve (1 frase) de por qué le sirve.
5. Máximo 3-4 productos por momento (no satures).
6. Incluye 2-3 tips prácticos al final.
7. Termina con un "summary" de 1-2 frases resumiendo la rutina.

FORMATO DE SALIDA — JSON estricto, sin texto adicional, sin markdown:
{
  "morning": [{"step": "...", "product_slug": "...", "reason": "..."}],
  "evening": [{"step": "...", "product_slug": "...", "reason": "..."}],
  "tips": ["...", "..."],
  "summary": "..."
}

Si el catálogo no tiene productos suficientes para una rutina completa, devuelve solo los que puedas recomendar y ajusta el summary para explicar la limitación amablemente.
`.trim();
}

function sanitizeRoutine(raw: unknown, catalog: Product[]): Routine {
  const slugs = new Set(catalog.map((p) => p.slug));
  const result = (raw ?? {}) as Partial<Routine>;
  const filtered = (arr: unknown): RoutineStep[] => {
    if (!Array.isArray(arr)) return [];
    return (arr as RoutineStep[])
      .filter(
        (s) =>
          s &&
          typeof s.product_slug === "string" &&
          typeof s.step === "string" &&
          typeof s.reason === "string" &&
          slugs.has(s.product_slug)
      )
      .map((s) => ({
        step: s.step.slice(0, 60),
        product_slug: s.product_slug,
        reason: s.reason.slice(0, 240),
      }));
  };
  return {
    morning: filtered(result.morning).slice(0, 5),
    evening: filtered(result.evening).slice(0, 5),
    tips: Array.isArray(result.tips)
      ? (result.tips as unknown[])
          .filter((t) => typeof t === "string")
          .map((t) => String(t).slice(0, 200))
      : [],
    summary:
      typeof result.summary === "string"
        ? result.summary.slice(0, 400)
        : "Rutina personalizada para tu tipo de piel.",
  };
}

async function loadStoreConfig() {
  const supabase = supabaseBrowser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("store_setting")
    .select("ai_provider, ai_model")
    .eq("id", 1)
    .maybeSingle();
  return data as { ai_provider?: string; ai_model?: string } | null;
}

export async function POST(request: Request) {
  let body: RoutineRequest;
  try {
    body = (await request.json()) as RoutineRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  // Fetch catalog + concern labels + store config in parallel
  const [products, categories, storeCfg] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    loadStoreConfig(),
  ]);

  if (products.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No hay productos en el catálogo todavía. Añade productos desde /admin/productos antes de generar rutinas.",
        code: "NO_PRODUCTS",
      },
      { status: 503 }
    );
  }

  // Pick provider + model from store config (with safe fallbacks)
  const providerKey = (storeCfg?.ai_provider as AIProviderKey) ?? "gemini";
  const model = storeCfg?.ai_model ?? "gemini-3.5-flash";
  const provider = getProvider(providerKey);

  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El generador de rutinas con IA no está configurado. Tu tienda está usando " +
          provider.name +
          " pero falta la API key. Pídele a tu equipo técnico que añada la variable " +
          envKeyFor(providerKey) +
          " en Vercel.",
        code: "NO_API_KEY",
      },
      { status: 503 }
    );
  }

  const concernLabels: Record<string, string> = {};
  for (const c of categories) {
    if (c.type === "concern") concernLabels[c.slug] = c.name;
  }

  const userPrompt = buildUserPrompt(body, products, concernLabels);

  let rawText: string;
  try {
    rawText = await provider.generateJSON({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      model,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `La IA (${provider.name}) respondió con error: ${
          err instanceof Error ? err.message : "desconocido"
        }`,
        code: "PROVIDER_ERROR",
      },
      { status: 502 }
    );
  }

  // Parse + sanitize
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "La IA devolvió una respuesta no-JSON. Intenta de nuevo.",
        code: "PARSE_ERROR",
      },
      { status: 502 }
    );
  }

  const routine = sanitizeRoutine(parsed, products);

  if (routine.morning.length === 0 && routine.evening.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "La IA no encontró productos en el catálogo que coincidan con tu perfil. Prueba cambiar el tipo de piel o las preocupaciones.",
        code: "NO_MATCH",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    routine,
    provider: provider.name,
    model,
  });
}

function envKeyFor(provider: AIProviderKey): string {
  return {
    gemini: "GEMINI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    openai: "OPENAI_API_KEY",
  }[provider];
}
