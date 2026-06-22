import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "soko-admin-session";
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets a signed httpOnly cookie on success.
 *
 * NOTE: This is MVP-grade auth (single shared password). For production,
 * migrate to Supabase Auth (magic link or email/password per user).
 */
export async function POST(request: Request) {
  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurado en el servidor." },
      { status: 500 }
    );
  }
  if (body.password !== expected) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
