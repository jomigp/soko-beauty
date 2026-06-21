/**
 * lib/rates.ts — Exchange-rate provider with caching and graceful fallback.
 *
 * Design (from master document §6):
 *   - Pluggable: a `RateProvider` interface, with a default implementation
 *     using DolarVZLA. Future providers (e.g. Arepa Tecnológica) plug in
 *     by implementing the same interface.
 *   - The web NEVER goes without a rate: on fetch failure, return the
 *     last-good rates from the in-memory cache, and surface a soft
 *     `stale: true` flag so the UI can show a discreet "tasas de ayer".
 *   - Cache TTL defaults to 30 min. Configurable per provider.
 *
 * BCV: `https://rates.dolarvzla.com/public/exchange-rates` (no key)
 * USDT: `https://api.dolarvzla.com/v1/exchange-rates/usdt-binance`
 *       (requires `DOLARVZLA_API_KEY` header `x-dolarvzla-key`).
 *
 * The store may also pre-load rates via the admin panel; in that case
 * `loadStoreRates()` is called first to seed the cache.
 */

import type { Rates } from "./types";

export interface RateProvider {
  /** Human-readable provider name for the admin UI / footer */
  name: string;
  /** Fetch the latest rates. Throws on hard failure. */
  fetch(): Promise<Rates>;
}

interface CacheEntry {
  rates: Rates;
  fetchedAt: number;
  source: string;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 min
const cache = new Map<string, CacheEntry>();

/* ============================================================
   DolarVZLA — default provider
   ============================================================ */

interface DolarVzlaResponse {
  // The actual shape varies; we accept several common fields.
  usd?: { value?: number; price?: number; rate?: number };
  bcv?: { value?: number; price?: number; rate?: number };
  usdt?: { value?: number; price?: number; rate?: number };
  // Some endpoints return a flat object keyed by currency
  [key: string]: unknown;
}

export const dolarVzlaProvider: RateProvider = {
  name: "DolarVZLA",
  async fetch(): Promise<Rates> {
    const bcvUrl = process.env.RATES_BCV_URL ??
      "https://rates.dolarvzla.com/public/exchange-rates";
    const usdtUrl = process.env.RATES_USDT_URL ??
      "https://api.dolarvzla.com/v1/exchange-rates/usdt-binance";
    const apiKey = process.env.DOLARVZLA_API_KEY ?? "";

    // BCV
    const bcvHeaders: HeadersInit = { Accept: "application/json" };
    const bcvRes = await fetch(bcvUrl, {
      headers: bcvHeaders,
      // Next.js fetch cache: revalidate every 30 min
      next: { revalidate: 1800 },
    });
    if (!bcvRes.ok) {
      throw new Error(`DolarVZLA BCV request failed: ${bcvRes.status}`);
    }
    const bcvData = (await bcvRes.json()) as DolarVzlaResponse;
    const tasa_bcv = pickNumber(bcvData, ["bcv", "usd"]) ??
      pickNumber(bcvData, ["bcv.value", "usd.value", "bcv.price", "usd.price"]);

    // USDT
    const usdtHeaders: HeadersInit = {
      Accept: "application/json",
      ...(apiKey ? { "x-dolarvzla-key": apiKey } : {}),
    };
    const usdtRes = await fetch(usdtUrl, {
      headers: usdtHeaders,
      next: { revalidate: 1800 },
    });
    if (!usdtRes.ok) {
      throw new Error(`DolarVZLA USDT request failed: ${usdtRes.status}`);
    }
    const usdtData = (await usdtRes.json()) as DolarVzlaResponse;
    const tasa_usdt = pickNumber(usdtData, ["usdt", "binance", "usdt-binance"]);

    if (!tasa_bcv || !tasa_usdt) {
      throw new Error(
        `Could not parse DolarVZLA response: bcv=${tasa_bcv}, usdt=${tasa_usdt}`
      );
    }
    return {
      tasa_bcv,
      tasa_usdt,
      updated_at: new Date().toISOString(),
    };
  },
};

function pickNumber(
  obj: Record<string, unknown>,
  paths: string[]
): number | undefined {
  for (const p of paths) {
    const v = obj[p];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v && typeof v === "object") {
      const inner = v as Record<string, unknown>;
      for (const k of ["value", "price", "rate", "amount"]) {
        const n = inner[k];
        if (typeof n === "number" && Number.isFinite(n)) return n;
      }
    }
  }
  return undefined;
}

/* ============================================================
   Public API
   ============================================================ */

export interface GetRatesOptions {
  provider?: RateProvider;
  /** Force a network fetch, bypassing the cache. */
  force?: boolean;
  /** Cache TTL in ms. Defaults to 30 min. */
  ttlMs?: number;
}

export interface RatesResult {
  rates: Rates;
  /** True when the cache served a result past the TTL. */
  stale: boolean;
  source: string;
}

/**
 * Fetch the latest rates with cache + fallback. Never throws: on hard
 * failure it returns the last-good cached rates and flags `stale: true`.
 */
export async function getRates(
  options: GetRatesOptions = {}
): Promise<RatesResult> {
  const provider = options.provider ?? dolarVzlaProvider;
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  const cached = cache.get(provider.name);

  if (!options.force && cached && now - cached.fetchedAt < ttlMs) {
    return { rates: cached.rates, stale: false, source: provider.name };
  }

  try {
    const fresh = await provider.fetch();
    cache.set(provider.name, {
      rates: fresh,
      fetchedAt: now,
      source: provider.name,
    });
    return { rates: fresh, stale: false, source: provider.name };
  } catch (err) {
    if (cached) {
      // Soft-fail: serve last-good, mark stale
      return { rates: cached.rates, stale: true, source: provider.name };
    }
    // No cache at all — last-resort hardcoded rates from §5 example.
    // The owner should never reach this; the admin panel also seeds rates.
    return {
      rates: { tasa_bcv: 612, tasa_usdt: 800, updated_at: new Date(0).toISOString() },
      stale: true,
      source: "fallback",
    };
  }
}

/**
 * Seed the cache from the admin panel (e.g. when the owner manually
 * edits rates). Always overwrites.
 */
export function loadStoreRates(rates: Rates, provider = "manual"): void {
  cache.set(provider, {
    rates,
    fetchedAt: Date.now(),
    source: provider,
  });
}
