/**
 * lib/money.ts — Money formatting utilities.
 *
 * Venezuela context:
 *   - USD always shows as `$X.XX` (decimal point, two digits).
 *   - VES (Bs) defaults to two decimals (matching typical POS displays),
 *     but the system supports an `int: true` option for whole-Bs rounding
 *     (a decision the owner has not made yet — see §16 of the master doc).
 */

import type { Currency } from "./types";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdNoCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const vesTwo = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const vesInt = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface FormatOptions {
  /** For VES: round to whole Bs (no decimals). Defaults to false. */
  int?: boolean;
  /** For USD: hide the cents. Defaults to false. */
  noCents?: boolean;
}

export function formatMoney(
  amount: number,
  currency: Currency,
  options: FormatOptions = {}
): string {
  if (!Number.isFinite(amount)) return "—";
  if (currency === "USD") {
    return options.noCents ? usdNoCents.format(amount) : usdFormatter.format(amount);
  }
  const f = options.int ? vesInt : vesTwo;
  return `Bs ${f.format(amount)}`;
}

/** Compact dual-price string: "$20,00  ·  Bs 12.240" */
export function formatDualPrice(
  amountUsd: number,
  amountBs: number,
  options: FormatOptions = {}
): string {
  return `${formatMoney(amountUsd, "USD", options)} · ${formatMoney(amountBs, "VES", options)}`;
}

/** Savings % from a USD method vs VES at BCV (positive = savings). */
export function formatSavings(savings_pct: number): string {
  if (savings_pct <= 0) return "";
  return `Ahorras ${savings_pct.toFixed(2).replace(/\.00$/, "")}%`;
}
