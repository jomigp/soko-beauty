import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "soko-admin-session";

/** Returns true if the request has a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

/** Helper for API routes: returns a 401 NextResponse or null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
