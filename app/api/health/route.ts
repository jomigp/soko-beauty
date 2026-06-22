import { NextResponse } from "next/server";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * GET /api/health
 *
 * Returns a diagnostic snapshot of the Soko Beauty environment.
 * Safe to call from the browser (no secrets leaked).
 *
 * Use it to debug "why are products not showing":
 *   1. Visit https://soko-beauty-sigma.vercel.app/api/health
 *   2. Check `env.supabase.configured` — if false, env vars missing in Vercel
 *   3. Check `tables.product.exists` — if false, schema not run in Supabase
 *   4. Check `tables.product.rowCount` — if 0, seed not run
 *   5. Check `productSamples` — actual products in the DB (proves the seed)
 */
export const dynamic = "force-dynamic";

interface TableStatus {
  exists: boolean;
  rowCount: number | null;
  error: string | null;
}

interface ProductSample {
  slug: string;
  name: string;
  brand: string;
  price_usd: number;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const configured = Boolean(supabaseUrl && supabaseKey);

  const tableNames = ["product", "category", "store_setting", "routine_query"];
  const tables: Record<string, TableStatus> = Object.fromEntries(
    tableNames.map((n) => [n, { exists: false, rowCount: null, error: null }])
  );

  let productSamples: ProductSample[] = [];
  let storeSetting: Record<string, unknown> | null = null;

  if (configured) {
    const supabase = supabaseBrowser();

    // Probe each table. We fetch a small sample (up to 1000 rows) and
    // report the actual count. `head: true` was unreliable across
    // Supabase JS client versions, so we count what we get.
    await Promise.all(
      tableNames.map(async (tableName) => {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("id")
            .limit(1000);
          if (error) {
            tables[tableName] = {
              exists: !error.message.toLowerCase().includes("does not exist"),
              rowCount: null,
              error: error.message,
            };
          } else {
            tables[tableName] = {
              exists: true,
              rowCount: data?.length ?? 0,
              error: null,
            };
          }
        } catch (e) {
          tables[tableName] = {
            exists: false,
            rowCount: null,
            error: e instanceof Error ? e.message : "unknown",
          };
        }
      })
    );

    // Fetch a few product names so the user can verify the seed.
    if (tables.product.exists) {
      const { data } = await supabase
        .from("product")
        .select("slug, name, brand, price_usd")
        .eq("in_stock", true)
        .order("sort_order", { ascending: true })
        .limit(5);
      productSamples = (data ?? []) as ProductSample[];
    }

    // Read the store_setting singleton (AI config, rates, delivery).
    if (tables.store_setting.exists) {
      const { data } = await supabase
        .from("store_setting")
        .select(
          "tasa_bcv, tasa_usdt, whatsapp_number, ai_provider, ai_model, local_delivery_cost_usd"
        )
        .eq("id", 1)
        .maybeSingle();
      storeSetting = (data ?? null) as Record<string, unknown> | null;
    }
  }

  const allOk =
    configured &&
    Object.values(tables).every((t) => t.exists) &&
    (tables.product.rowCount ?? 0) > 0;

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        supabase: {
          configured,
          url: supabaseUrl ? `${supabaseUrl.slice(0, 30)}…` : null,
        },
        ai: {
          gemini: Boolean(process.env.GEMINI_API_KEY),
          deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
          openai: Boolean(process.env.OPENAI_API_KEY),
        },
      },
      tables,
      productSamples,
      storeSetting,
      hints: buildHints(configured, tables, productSamples),
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function buildHints(
  configured: boolean,
  tables: Record<string, TableStatus>,
  productSamples: ProductSample[]
): string[] {
  const hints: string[] = [];
  if (!configured) {
    hints.push(
      "NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas en Vercel. Settings → Environment Variables."
    );
  }

  // Detect the PostgREST schema-cache issue specifically.
  // Symptom: tables exist in DB but PostgREST returns
  // "Could not find the table 'public.X' in the schema cache".
  const schemaCacheIssue = Object.values(tables).some(
    (t) => t.exists && t.error?.toLowerCase().includes("schema cache")
  );

  for (const [name, t] of Object.entries(tables)) {
    if (!t.exists && !t.error) {
      hints.push(
        `La tabla "${name}" no existe. Corre supabase/SETUP_TODO_EN_UNO.sql en Supabase SQL Editor.`
      );
    } else if (t.error?.toLowerCase().includes("schema cache")) {
      // Surface the fix for the schema cache issue only once
      if (name === "product") {
        hints.push(
          "⚠️ Schema cache de PostgREST está desactualizado. En Supabase SQL Editor corre: NOTIFY pgrst, 'reload schema'; — luego refresca /api/health."
        );
      }
    } else if (t.rowCount === 0 && name !== "routine_query") {
      hints.push(
        `La tabla "${name}" existe pero está vacía. Revisa el seed (seed-productos-ejemplo.sql).`
      );
    }
  }

  if (
    tables.product.exists &&
    (tables.product.rowCount ?? 0) > 0 &&
    productSamples.length === 0
  ) {
    hints.push(
      "Hay productos en la BD pero ninguno con in_stock=true. Marca 'En stock' en /admin/productos."
    );
  }

  // If the user previously hit the 'type already exists' error on
  // SETUP_TODO_EN_UNO.sql, the seed never ran — product table is empty
  // even if the table itself exists.
  if (
    tables.product.exists &&
    tables.product.rowCount === 0 &&
    !schemaCacheIssue
  ) {
    hints.push(
      "📦 La tabla 'product' está vacía. Tu primer intento de correr SETUP_TODO_EN_UNO.sql falló en la línea 3 (type already exists) y el seed nunca se insertó. Re-corre el archivo completo en Supabase SQL Editor — la versión actual es idempotente, no se romperá."
    );
  }

  if (hints.length === 0) {
    hints.push(
      "Todo en orden. Si /productos sigue vacío, hard refresh (Ctrl+Shift+R) o prueba en ventana incógnito."
    );
  }
  return hints;
}
