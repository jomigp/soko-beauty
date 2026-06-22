import { NextResponse } from "next/server";
import { getActiveProducts, getCategories } from "@/lib/supabase-queries";
import type { Product } from "@/lib/database.types";

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
 * Response: {
 *   ok: true,
 *   routine: {
 *     morning: [{ step, product_slug, reason }],
 *     evening: [{ step, product_slug, reason }],
 *     tips: string[],
 *     summary: string
 *   }
 * }
 *
 * Uses Google Gemini 2.0 Flash (free tier, 15 RPM, 1500 RPD).
 * The catalog is the source of truth — the AI can only recommend
 * products that exist in the database.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30; // seconds — Gemini responses can take 5–15s

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

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

/** Validate that every product_slug returned by Gemini actually exists in the catalog. */
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
      ? (result.tips as unknown[]).filter((t) => typeof t === "string").map((t) => String(t).slice(0, 200))
      : [],
    summary:
      typeof result.summary === "string"
        ? result.summary.slice(0, 400)
        : "Rutina personalizada para tu tipo de piel.",
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El generador de rutinas con IA no está configurado. Pídele a tu equipo técnico que añada la variable GEMINI_API_KEY en Vercel (es gratis, ver https://aistudio.google.com/app/apikey).",
        code: "NO_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: RoutineRequest;
  try {
    body = (await request.json()) as RoutineRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  // Fetch catalog + concern labels in parallel
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
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

  const concernLabels: Record<string, string> = {};
  for (const c of categories) {
    if (c.type === "concern") concernLabels[c.slug] = c.name;
  }

  const userPrompt = buildUserPrompt(body, products, concernLabels);

  // Call Gemini
  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo conectar con la IA: ${err instanceof Error ? err.message : "error de red"}`,
        code: "NETWORK",
      },
      { status: 502 }
    );
  }

  if (!geminiRes.ok) {
    const text = await geminiRes.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        error: `La IA respondió con error ${geminiRes.status}: ${text.slice(0, 200)}`,
        code: "GEMINI_ERROR",
      },
      { status: 502 }
    );
  }

  const geminiData = (await geminiRes.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return NextResponse.json(
      {
        ok: false,
        error: "La IA no devolvió contenido. Intenta de nuevo.",
        code: "EMPTY_RESPONSE",
      },
      { status: 502 }
    );
  }

  // Parse + sanitize
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Sometimes Gemini wraps JSON in markdown fences; strip them.
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    try {
      parsed = JSON.parse(stripped);
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

  return NextResponse.json({ ok: true, routine });
}
