import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (await isAdmin()) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
