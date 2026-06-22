/**
 * lib/rates.ts — Exchange-rate provider with caching and graceful fallback.
 *
 * Owner-confirmed provider (master document §6, see also message 2026-06-22):
 *   https://calcu.arepatecnologica.com/
 *   No API key, CORS open, JSON. Returns BCV (USD + EUR) and Paralelo (USD).
 *   Source upstream: https://www.bcv.org.ve/ + https://ve.dolarapi.com/
 *
 * Design:
 *   - Pluggable: a `RateProvider` interface. The default implementation is
 *     `calcuArepaProvider`. Other providers (DolarVZLA, etc.) can be
 *     implemented by hand if needed.
 *   - The web NEVER goes without a rate: on fetch failure, return the
 *     last-good rates from the in-memory cache, and surface a soft
 *     `stale: true` flag so the UI can show a discreet "tasas de ayer".
 *   - Cache TTL defaults to 30 min. Configurable per provider.
 *
 * Field mapping in our engine:
 *   tasa_bcv  = BCV official USD (from calcu "Dólar Oficial / fuente=BCV")
 *   tasa_usdt = Paralelo USD (from calcu "Dólar Paralelo / fuente=Monitor")
 *               (The owner confirmed Paralelo ≈ USDT for the discount calc.)
 *   tasa_eur  = BCV official EUR (exposed for future use, not in the
 *               multi-tasa engine today).
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
   calcu.arepatecnologica.com — owner-confirmed default
   ============================================================ */

interface CalcuResponse {
  nombre: string;
  descripcion: string;
  tasas: Array<{
    moneda: "USD" | "EUR" | string;
    nombre: string;
    fuente: "BCV" | "Monitor" | string;
    compra: number | null;
    venta: number | null;
    promedio: number | null;
    valorCompleto: number | null;
    fechaActualizacion: string;
    fechaVigencia: string;
  }>;
  ultimaActualizacion: string;
  fuentes: { oficial: string; paralelo: string };
}

const DEFAULT_CALCU_URL = "https://calcu.arepatecnologica.com/";

export const calcuArepaProvider: RateProvider = {
  name: "calcu.arepatecnologica.com",
  async fetch(): Promise<Rates> {
    const url = process.env.RATES_API_URL || DEFAULT_CALCU_URL;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Next.js fetch cache: revalidate every 30 min
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      throw new Error(`calcu.arepatecnologica.com request failed: ${res.status}`);
    }
    const data = (await res.json()) as CalcuResponse;
    const rates = parseCalcuResponse(data);
    return rates;
  },
};

/**
 * Parse the calcu.arepatecnologica.com response into our `Rates` shape.
 * Exported for unit testing.
 *
 * Identification rules:
 *   - tasa_bcv  = entry with `fuente === "BCV"` AND `moneda === "USD"`
 *   - tasa_usdt = entry with `fuente === "Monitor"` (or "Paralelo" in `nombre`)
 *   - tasa_eur  = entry with `fuente === "BCV"` AND `moneda === "EUR"`
 *
 * Precedence for the number itself: `promedio` > `venta` > `compra` > `valorCompleto`.
 */
export function parseCalcuResponse(data: CalcuResponse): Rates {
  if (!data?.tasas || !Array.isArray(data.tasas)) {
    throw new Error("calcu: response missing 'tasas' array");
  }

  const find = (predicate: (t: CalcuResponse["tasas"][number]) => boolean) =>
    data.tasas.find(predicate);

  const pickNumber = (t?: CalcuResponse["tasas"][number]): number | undefined => {
    if (!t) return undefined;
    return (
      t.promedio ??
      t.venta ??
      t.compra ??
      t.valorCompleto ??
      undefined
    );
  };

  const bcv = find((t) => t.fuente === "BCV" && t.moneda === "USD");
  const paralelo =
    find((t) => t.fuente === "Monitor") ??
    find((t) => /paralelo/i.test(t.nombre));
  const eur = find((t) => t.fuente === "BCV" && t.moneda === "EUR");

  const tasa_bcv = pickNumber(bcv);
  const tasa_usdt = pickNumber(paralelo);
  const tasa_eur = pickNumber(eur);

  if (!tasa_bcv || !tasa_usdt) {
    throw new Error(
      `calcu: missing required rates (bcv=${tasa_bcv}, paralelo=${tasa_usdt})`
    );
  }
  if (tasa_bcv <= 0 || tasa_usdt <= 0) {
    throw new Error(
      `calcu: non-positive rates (bcv=${tasa_bcv}, paralelo=${tasa_usdt})`
    );
  }

  return {
    tasa_bcv,
    tasa_usdt,
    tasa_eur: tasa_eur || undefined,
    updated_at: data.ultimaActualizacion ?? new Date().toISOString(),
  };
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
  const provider = options.provider ?? calcuArepaProvider;
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
  } catch {
    if (cached) {
      // Soft-fail: serve last-good, mark stale
      return { rates: cached.rates, stale: true, source: provider.name };
    }
    // No cache at all — last-resort hardcoded rates from the master doc §5.
    // The owner should never reach this; the admin panel also seeds rates.
    return {
      rates: {
        tasa_bcv: 612,
        tasa_usdt: 800,
        updated_at: new Date(0).toISOString(),
      },
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
