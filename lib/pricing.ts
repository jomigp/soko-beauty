/**
 * lib/pricing.ts — THE pricing engine of Soko Beauty.
 *
 * Single source of truth for how a USD catalog price becomes a final
 * amount in the customer's chosen currency/method. Used by:
 *   - Product page (dual-price display)
 *   - Cart (running total)
 *   - Checkout (live recalculation when method changes)
 *   - WhatsApp message (frozen final amount)
 *
 * DO NOT duplicate this math anywhere else. If you need a price, call
 * these functions. If a calculation seems off, fix it HERE and the
 * whole site updates.
 *
 * Core formula (from the master document §5):
 *   valor_bs  = precio_usd × tasa_bcv
 *   VES method  → monto = valor_bs                       (at BCV)
 *   USD method  → monto = valor_bs / tasa_usdt           (at paralelo)
 *   + optional adjustment_pct applied to the final amount
 */

import type {
  CartItem,
  Currency,
  CustomerInfo,
  DeliveryOption,
  OrderTotals,
  PaymentMethod,
  Rates,
} from "./types";

/* ============================================================
   Validation
   ============================================================ */

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

function assertPositiveRates(rates: Rates): void {
  if (!Number.isFinite(rates.tasa_bcv) || rates.tasa_bcv <= 0) {
    throw new PricingError(
      `tasa_bcv must be a positive number, got ${rates.tasa_bcv}`
    );
  }
  if (!Number.isFinite(rates.tasa_usdt) || rates.tasa_usdt <= 0) {
    throw new PricingError(
      `tasa_usdt must be a positive number, got ${rates.tasa_usdt}`
    );
  }
}

/* ============================================================
   Per-product pricing
   ============================================================ */

export interface PriceLine {
  /** Canonical value in VES at BCV (always computed, used for display) */
  valor_bs: number;
  /** Final amount in the method's currency (after rate + adjustment) */
  monto_a_pagar: number;
  final_currency: Currency;
  /** Equivalent USD at USDT (only filled for USD methods) */
  monto_usd: number;
}

/**
 * Compute the price of a single product for a given payment method.
 * Mirrors the formula in the master document §5 exactly.
 */
export function calculateLinePrice(
  price_usd: number,
  method: PaymentMethod,
  rates: Rates
): PriceLine {
  assertPositiveRates(rates);

  if (!Number.isFinite(price_usd) || price_usd < 0) {
    throw new PricingError(
      `price_usd must be a non-negative number, got ${price_usd}`
    );
  }

  const valor_bs = price_usd * rates.tasa_bcv;
  const adjustment = (method.adjustment_pct ?? 0) / 100;

  if (method.currency === "VES") {
    // Pay in Bs at BCV
    if (method.rate !== "bcv") {
      throw new PricingError(
        `VES method "${method.key}" must use rate=bcv, got ${method.rate}`
      );
    }
    const monto_a_pagar = valor_bs * (1 + adjustment);
    return {
      valor_bs,
      monto_a_pagar: round2(monto_a_pagar),
      final_currency: "VES",
      monto_usd: round2(monto_a_pagar / rates.tasa_bcv),
    };
  }

  // USD method → pay at paralelo (USDT)
  if (method.rate !== "usdt") {
    throw new PricingError(
      `USD method "${method.key}" must use rate=usdt, got ${method.rate}`
    );
  }
  const monto_usd = valor_bs / rates.tasa_usdt;
  const monto_a_pagar = monto_usd * (1 + adjustment);
  return {
    valor_bs,
    monto_a_pagar: round2(monto_a_pagar),
    final_currency: "USD",
    monto_usd: round2(monto_a_pagar),
  };
}

/* ============================================================
   Cart totals
   ============================================================ */

/**
 * Sum the unit prices (at BCV reference) of every cart line.
 * This is the "precio BCV" subtotal shown to the customer.
 */
export function subtotalUsd(cart: CartItem[]): number {
  return round2(
    cart.reduce((sum, item) => sum + item.unit_price_usd * item.qty, 0)
  );
}

export interface CalculateOptions {
  cart: CartItem[];
  method: PaymentMethod;
  delivery: DeliveryOption;
  rates: Rates;
}

/**
 * Compute the full order total in the customer's chosen method.
 * Returns the breakdown used by the cart UI and the WhatsApp message.
 */
export function calculateOrderTotals({
  cart,
  method,
  delivery,
  rates,
}: CalculateOptions): OrderTotals {
  assertPositiveRates(rates);

  const sub = subtotalUsd(cart);
  const delivery_usd = delivery.extra_usd;
  const base_total_usd = round2(sub + delivery_usd);

  // Compute each line for the chosen method, then add the delivery line
  // at BCV (delivery cost is fixed in USD per the design).
  let final_amount: number;
  if (method.currency === "VES") {
    const cartTotalBs = cart.reduce((sum, item) => {
      const line = calculateLinePrice(
        item.unit_price_usd * item.qty,
        method,
        rates
      );
      return sum + line.monto_a_pagar;
    }, 0);
    const deliveryBs = delivery_usd * rates.tasa_bcv;
    final_amount = round2(cartTotalBs + deliveryBs);
  } else {
    const cartTotalUsd = cart.reduce((sum, item) => {
      const line = calculateLinePrice(
        item.unit_price_usd * item.qty,
        method,
        rates
      );
      return sum + line.monto_a_pagar;
    }, 0);
    // Delivery added in USD directly (no extra conversion; it's a flat USD fee)
    final_amount = round2(cartTotalUsd + delivery_usd);
  }

  // Reference: how much would it cost in VES at BCV if paying in Bs?
  const total_ves_at_bcv = round2(base_total_usd * rates.tasa_bcv);
  // What the customer actually pays in VES equivalent
  const final_ves =
    method.currency === "VES"
      ? final_amount
      : round2(final_amount * rates.tasa_usdt);

  // Savings %: how much cheaper the chosen method is vs paying in VES at BCV
  // Positive number means "you save X% by paying in USD at paralelo".
  const savings_pct = round4(
    1 - rates.tasa_bcv / rates.tasa_usdt
  );

  return {
    subtotal_usd: sub,
    delivery_usd,
    base_total_usd,
    final_amount,
    final_currency: method.currency,
    final_ves,
    savings_pct: Number((savings_pct * 100).toFixed(2)),
    rates: { ...rates },
  };
}

/* ============================================================
   Helpers
   ============================================================ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Validate a customer info payload before sending the WhatsApp message.
 * Returns an array of human-readable errors; empty means OK.
 */
export function validateCustomer(
  c: Partial<CustomerInfo>
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!c.nombre || c.nombre.trim().length < 2) {
    errors.push("Indícanos tu nombre.");
  }
  const phoneDigits = (c.telefono ?? "").replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    errors.push("El teléfono debe tener al menos 10 dígitos.");
  }
  return errors.length === 0
    ? { ok: true }
    : { ok: false, errors };
}
