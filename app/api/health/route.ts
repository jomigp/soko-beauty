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
 *   2. Check `supabase.configured` — if false, env vars missing in Vercel
 *   3. Check `tables.product` — if "missing", schema not run in Supabase
 *   4. Check `tables.product.rowCount` — if 0, seed not run
 */
export const dynamic = "force-dynamic";

interface TableStatus {
  exists: boolean;
  rowCount: number | null;
  error: string | null;
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const configured = Boolean(supabaseUrl && supabaseKey);

  const tables: Record<string, TableStatus> = {
    product: { exists: false, rowCount: null, error: null },
    category: { exists: false, rowCount: null, error: null },
    store_setting: { exists: false, rowCount: null, error: null },
    routine_query: { exists: false, rowCount: null, error: null },
  };

  if (configured) {
    const supabase = supabaseBrowser();
    // Probe each table with a cheap count. If the table doesn't exist,
    // Supabase returns an error code 42P01.
    for (const tableName of Object.keys(tables)) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });
        if (error) {
          tables[tableName] = {
            exists: !error.message.includes("does not exist"),
            rowCount: null,
            error: error.message,
          };
        } else {
          tables[tableName] = {
            exists: true,
            rowCount: count,
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
    }
  }

  const allOk =
    configured &&
    Object.values(tables).every((t) => t.exists && (t.rowCount ?? 0) >= 0);

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        // Don't leak the actual URL/key, just whether they're set
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
      hints: buildHints(configured, tables),
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function buildHints(
  configured: boolean,
  tables: Record<string, TableStatus>
): string[] {
  const hints: string[] = [];
  if (!configured) {
    hints.push(
      "NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas en Vercel. Settings → Environment Variables."
    );
  }
  for (const [name, t] of Object.entries(tables)) {
    if (!t.exists) {
      hints.push(
        `La tabla "${name}" no existe en Supabase. Corre supabase/SETUP_TODO_EN_UNO.sql en el SQL Editor.`
      );
    } else if (t.rowCount === 0) {
      hints.push(
        `La tabla "${name}" existe pero está vacía. Revisa el seed (seed-productos-ejemplo.sql).`
      );
    }
  }
  if (hints.length === 0) {
    hints.push("Todo en orden. Si /productos sigue vacío, hard refresh (Ctrl+Shift+R).");
  }
  return hints;
}
