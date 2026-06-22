import { NextResponse } from "next/server";
import { supabaseBrowser } from "@/lib/supabase";

/**
 * GET /api/rutina/productos?slugs=a,b,c
 * Returns the products that match the given slugs, used by the
 * /rutina page to render the recommended routine.
 *
 * Public (no auth) because the slugs themselves are not sensitive.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugsParam = url.searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }
  const supabase = supabaseBrowser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("product")
    .select("*")
    .in("slug", slugs);
  if (error) {
    return NextResponse.json(
      { error: error.message, products: [] },
      { status: 500 }
    );
  }
  return NextResponse.json({ products: data ?? [] });
}
