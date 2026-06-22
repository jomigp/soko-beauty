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

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Public Supabase client. Safe on server and client.
 * - If env vars are missing (e.g. at build time without secrets), returns
 *   a no-op stub that always resolves to empty results, so pages can
 *   still render during prerender. At runtime, real env vars are set and
 *   the real client is used.
 */
export function supabaseBrowser(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return createEmptyStub() as unknown as SupabaseClient<Database>;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

export function supabaseAdmin(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() must not run in the browser.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return createEmptyStub() as unknown as SupabaseClient<Database>;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function createEmptyStub() {
  const emptyPromise = Promise.resolve({ data: [], error: null, count: 0 });
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any, reject: any) => emptyPromise.then(resolve, reject),
  };
  return {
    from: () => builder,
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
