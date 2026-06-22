/**
 * Tests for /api/rutina/recomendar's rate limit + error mapping.
 *
 * The handler is exported as POST in route.ts. We test the rate-limit
 * helper behavior by mocking the Supabase RPC and the request headers.
 *
 * Limitation: we don't import the route directly (Next.js route modules
 * aren't test-friendly in Vitest without a server harness). Instead we
 * replicate the exact logic to verify the algorithm is correct.
 */

import { describe, expect, it } from "vitest";
import { createHash } from "crypto";

const SALT = "soko-beauty-2026-mvp-salt";
const DAILY_LIMIT = 3;

function getClientIp(headers: Record<string, string>): string {
  const xff = headers["x-forwarded-for"];
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers["x-real-ip"];
  if (realIp) return realIp;
  const cfIp = headers["cf-connecting-ip"];
  if (cfIp) return cfIp;
  return "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(SALT + ":" + ip)
    .digest("hex")
    .slice(0, 32);
}

describe("rate limit — IP extraction", () => {
  it("reads first IP from x-forwarded-for", () => {
    expect(getClientIp({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })).toBe("1.2.3.4");
  });

  it("trims whitespace from forwarded IP", () => {
    expect(getClientIp({ "x-forwarded-for": "  9.9.9.9  , 8.8.8.8" })).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip when xff is missing", () => {
    expect(getClientIp({ "x-real-ip": "10.0.0.1" })).toBe("10.0.0.1");
  });

  it("falls back to cf-connecting-ip", () => {
    expect(getClientIp({ "cf-connecting-ip": "1.1.1.1" })).toBe("1.1.1.1");
  });

  it("returns 'unknown' when no IP header is present", () => {
    expect(getClientIp({})).toBe("unknown");
  });
});

describe("rate limit — IP hashing", () => {
  it("produces a deterministic 32-char hash", () => {
    const h = hashIp("1.2.3.4");
    expect(h).toHaveLength(32);
    expect(h).toBe(hashIp("1.2.3.4")); // same input → same hash
  });

  it("different IPs produce different hashes", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("1.2.3.5"));
  });

  it("uses salt so two installations with the same IP differ", () => {
    const a = createHash("sha256")
      .update("salt-A:1.2.3.4")
      .digest("hex")
      .slice(0, 32);
    const b = createHash("sha256")
      .update("salt-B:1.2.3.4")
      .digest("hex")
      .slice(0, 32);
    expect(a).not.toBe(b);
  });
});

describe("rate limit — counter logic", () => {
  /**
   * Simulates the Supabase RPC behavior with an in-memory map.
   * Returns the new count after incrementing.
   */
  function rpcIncrement(
    map: Map<string, number>,
    ipHash: string,
    day: string
  ): number {
    const key = `${ipHash}:${day}`;
    const next = (map.get(key) ?? 0) + 1;
    map.set(key, next);
    return next;
  }

  it("allows the first 3 requests, blocks the 4th", () => {
    const map = new Map<string, number>();
    const day = "2026-06-22";
    const ip = hashIp("1.2.3.4");
    expect(rpcIncrement(map, ip, day)).toBe(1);
    expect(rpcIncrement(map, ip, day)).toBe(2);
    expect(rpcIncrement(map, ip, day)).toBe(3);
    // 4th is over the limit
    const c4 = rpcIncrement(map, ip, day);
    expect(c4).toBe(4);
    expect(c4 > DAILY_LIMIT).toBe(true);
  });

  it("different IPs are tracked independently", () => {
    const map = new Map<string, number>();
    const day = "2026-06-22";
    const ipA = hashIp("1.1.1.1");
    const ipB = hashIp("2.2.2.2");
    // IP A uses all 3
    rpcIncrement(map, ipA, day);
    rpcIncrement(map, ipA, day);
    rpcIncrement(map, ipA, day);
    // IP B is still at 0
    expect(rpcIncrement(map, ipB, day)).toBe(1);
  });

  it("different days are tracked independently", () => {
    const map = new Map<string, number>();
    const ip = hashIp("3.3.3.3");
    rpcIncrement(map, ip, "2026-06-22");
    rpcIncrement(map, ip, "2026-06-22");
    rpcIncrement(map, ip, "2026-06-22");
    // New day → fresh quota
    expect(rpcIncrement(map, ip, "2026-06-23")).toBe(1);
  });
});

describe("friendly error copy — never leaks technical details", () => {
  // Mirrors the FRIENDLY map from the API route
  const FRIENDLY: Record<string, string> = {
    NO_PRODUCTS: "Estamos preparando rutinas personalizadas para ti. Vuelve pronto 💜",
    NO_API_KEY: "Nuestro generador de rutinas con IA está descansando un momento. Vuelve en unas horas 💜",
    RATE_LIMIT: "Ya alcanzaste tus 3 rutinas de hoy. Vuelve mañana para más recomendaciones ✨",
    PROVIDER_ERROR: "Tuvimos un problema generando tu rutina. Intenta de nuevo en unos minutos 💜",
    PARSE_ERROR: "Tuvimos un problema procesando tu rutina. Intenta de nuevo 💜",
    NO_MATCH: "No encontramos productos en nuestro catálogo que coincidan con tu perfil. Prueba cambiar el tipo de piel o las preocupaciones 💜",
    BAD_REQUEST: "Por favor completa todas las preguntas para poder crear tu rutina 💜",
  };

  for (const [code, msg] of Object.entries(FRIENDLY)) {
    it(`${code} is customer-safe`, () => {
      // Must not mention internal concepts
      const forbidden = [
        "admin",
        "API key",
        "API",
        "Supabase",
        "Vercel",
        "env var",
        "Vercel",
        "stack",
        "exception",
        "throw",
        "/api",
        "RPC",
        "rate limit",
        "exceeded",
      ];
      for (const word of forbidden) {
        expect(msg.toLowerCase()).not.toContain(word.toLowerCase());
      }
    });
  }
});
