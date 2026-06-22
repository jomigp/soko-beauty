import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { loadStoreRates } from "@/lib/rates";

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await request.json()) as any;
  const supabase = supabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("store_setting")
    .update({ ...body, rates_updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Bust the in-memory rates cache so the change is live
  if (data?.tasa_bcv && data?.tasa_usdt) {
    loadStoreRates({
      tasa_bcv: data.tasa_bcv,
      tasa_usdt: data.tasa_usdt,
      updated_at: data.rates_updated_at,
    });
  }
  return NextResponse.json({ store: data });
}
