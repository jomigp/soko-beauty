/**
 * lib/supabase.ts — Supabase client.
 *
 * Two clients:
 *   - supabaseBrowser(): uses the anon key, safe for the public client.
 *   - supabaseAdmin(): uses the service-role key, ONLY on the server.
 *     Never expose this to the browser.
 *
 * We deliberately do NOT use Prisma. The Supabase JS client + the
 * `StoreSetting` table (with a single row) is enough for the MVP.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

export function supabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() must not run in the browser.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin env vars missing: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
