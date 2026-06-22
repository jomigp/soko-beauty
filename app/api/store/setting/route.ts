import { NextResponse } from "next/server";
import { getStoreSetting } from "@/lib/supabase-queries";

export async function GET() {
  const store = await getStoreSetting();
  if (!store) {
    return NextResponse.json({ error: "No store setting" }, { status: 404 });
  }
  return NextResponse.json({ store });
}
