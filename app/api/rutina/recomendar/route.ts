import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getActiveProducts, getCategories } from "@/lib/supabase-queries";
import { getProvider } from "@/lib/ai/providers";
import type { Product } from "@/lib/database.types";
import type { AIProviderKey } from "@/lib/ai/providers";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * POST /api/rutina/recomendar
 *
 * Body: {
 *   skin_type, concerns, age_range, time_of_day, experience
 * }
 *
 * Rate limit: 3 generations per client (hashed IP) per day.
 * Friendly errors: the `error` field is always customer-safe copy;
 * technical details are only returned in dev mode under `technical`.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ============================================================
   Rate limit
   ============================================================ */

const DAILY_LIMIT = 3;
const SALT = process.env.ROUTINE_SALT ?? "soko-beauty-2026-mvp-salt";

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(SALT + ":" + ip)
    .digest("hex")
    .slice(0, 32);
}

function todayUtc(): string {
  // YYYY-MM-DD in UTC. Using UTC day boundary so the reset time
  // is consistent across time zones (rate limit at 00:00 UTC).
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   Friendly errors
   ============================================================ */

type ErrorCode =
  | "NO_PRODUCTS"
  | "NO_API_KEY"
  | "RATE_LIMIT"
  | "PROVIDER_ERROR"
  | "PARSE_ERROR"
  | "NO_MATCH"
  | "BAD_REQUEST";

const FRIENDLY: Record<ErrorCode, string> = {
  NO_PRODUCTS:
    "Estamos preparando rutinas personalizadas para ti. Vuelve pronto 💜",
  NO_API_KEY:
    "Nuestro generador de rutinas con IA está descansando un momento. Vuelve en unas horas 💜",
  RATE_LIMIT:
    "Ya alcanzaste tus 3 rutinas de hoy. Vuelve mañana para más recomendaciones ✨",
  PROVIDER_ERROR:
    "Tuvimos un problema generando tu rutina. Intenta de nuevo en unos minutos 💜",
  PARSE_ERROR:
    "Tuvimos un problema procesando tu rutina. Intenta de nuevo 💜",
  NO_MATCH:
    "No encontramos productos en nuestro catálogo que coincidan con tu perfil. Prueba cambiar el tipo de piel o las preocupaciones 💜",
  BAD_REQUEST:
    "Por favor completa todas las preguntas para poder crear tu rutina 💜",
};

function errorResponse(
  code: ErrorCode,
  technical: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      error: FRIENDLY[code],
      ...(process.env.NODE_ENV === "development" ? { technical } : {}),
    },
    { status }
  );
}

/* ============================================================
   Routine builder
   ============================================================ */

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

/* ============================================================
   Handlers
   ============================================================ */

async function loadStoreConfig() {
  const supabase = supabaseBrowser();
  const { data } = await supabase
    .from("store_setting")
    .select("ai_provider, ai_model")
    .eq("id", 1)
    .maybeSingle();
  return data as { ai_provider?: string; ai_model?: string } | null;
}

async function incrementAndCheckLimit(ipHash: string): Promise<number> {
  const supabase = supabaseBrowser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("increment_routine_query", {
    p_ip_hash: ipHash,
    p_day: todayUtc(),
  });
  if (error) {
    console.error("[rate-limit] rpc error:", error);
    return 0; // fail open — better UX than blocking
  }
  return typeof data === "number" ? data : 0;
}

export async function POST(request: Request) {
  let body: RoutineRequest;
  try {
    body = (await request.json()) as RoutineRequest;
  } catch {
    return errorResponse(
      "BAD_REQUEST",
      "Invalid JSON body",
      400
    );
  }

  // Basic validation
  if (!body.skin_type || !body.age_range || !body.experience || !body.time_of_day) {
    return errorResponse(
      "BAD_REQUEST",
      "Missing required fields: skin_type, age_range, experience, time_of_day",
      400
    );
  }

  // Rate limit check (atomic via RPC)
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const count = await incrementAndCheckLimit(ipHash);
  if (count > DAILY_LIMIT) {
    return errorResponse(
      "RATE_LIMIT",
      `IP ${ipHash} exceeded ${DAILY_LIMIT}/day (count=${count})`,
      429
    );
  }

  // Fetch catalog + concern labels + store config in parallel
  const [products, categories, storeCfg] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    loadStoreConfig(),
  ]);

  if (products.length === 0) {
    return errorResponse(
      "NO_PRODUCTS",
      "store_setting has 0 active products",
      503
    );
  }

  // Pick provider + model from store config (with safe fallbacks)
  const providerKey = (storeCfg?.ai_provider as AIProviderKey) ?? "gemini";
  const model = storeCfg?.ai_model ?? "gemini-3.5-flash";
  const provider = getProvider(providerKey);

  if (!provider.isConfigured()) {
    return errorResponse(
      "NO_API_KEY",
      `Provider ${providerKey} is selected but its API key env var is not set`,
      503
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
    return errorResponse(
      "PROVIDER_ERROR",
      err instanceof Error ? err.message : "unknown",
      502
    );
  }

  // Parse + sanitize
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return errorResponse(
      "PARSE_ERROR",
      `Model returned non-JSON: ${rawText.slice(0, 200)}`,
      502
    );
  }

  const routine = sanitizeRoutine(parsed, products);

  if (routine.morning.length === 0 && routine.evening.length === 0) {
    return errorResponse(
      "NO_MATCH",
      "All AI-suggested slugs were filtered out",
      404
    );
  }

  return NextResponse.json({
    ok: true,
    routine,
    provider: provider.name,
    model,
    /* include remaining quota so the client can show it */
    quota: {
      used: count,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - count),
    },
  });
}
