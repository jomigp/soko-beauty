/**
 * Tests for the multi-tasa pricing engine.
 *
 * The headline test (the one called out in the master document §5) is
 * `MASTER_DOC_CASE_$20_612_800`. If that ever fails, the whole business
 * is broken. Keep it green.
 */

import { describe, expect, it } from "vitest";
import {
  calculateLinePrice,
  calculateOrderTotals,
  PricingError,
  subtotalUsd,
  validateCustomer,
} from "@/lib/pricing";
import type {
  CartItem,
  DeliveryOption,
  PaymentMethod,
  Rates,
} from "@/lib/types";

const rates: Rates = { tasa_bcv: 612, tasa_usdt: 800 };

const pagoMovil: PaymentMethod = {
  key: "pago_movil",
  label: "Pago Móvil",
  currency: "VES",
  rate: "bcv",
};

const usdt: PaymentMethod = {
  key: "usdt",
  label: "USDT",
  currency: "USD",
  rate: "usdt",
};

const zelle: PaymentMethod = {
  key: "zelle",
  label: "Zelle",
  currency: "USD",
  rate: "usdt",
};

const pickup: DeliveryOption = {
  key: "store_pickup",
  label: "Retiro en tienda",
  extra_usd: 0,
};

const localDelivery: DeliveryOption = {
  key: "local_delivery",
  label: "Delivery Valencia",
  extra_usd: 3,
};

describe("calculateLinePrice — single product", () => {
  it("MASTER_DOC_CASE_$20_612_800 → VES 12.240, USD $15,30, ahorro 23,5%", () => {
    // The exact case the master document demands we validate against.
    const vesLine = calculateLinePrice(20, pagoMovil, rates);
    expect(vesLine.valor_bs).toBe(12240);
    expect(vesLine.monto_a_pagar).toBe(12240);
    expect(vesLine.final_currency).toBe("VES");

    const usdLine = calculateLinePrice(20, usdt, rates);
    expect(usdLine.valor_bs).toBe(12240);
    expect(usdLine.monto_a_pagar).toBe(15.3);
    expect(usdLine.final_currency).toBe("USD");
  });

  it("savings_pct = 1 − bcv/usdt → 23.5%", () => {
    // 1 - 612/800 = 0.235 = 23.5%
    const pct = 1 - rates.tasa_bcv / rates.tasa_usdt;
    expect(pct).toBeCloseTo(0.235, 4);
    expect((pct * 100).toFixed(2)).toBe("23.50");
  });

  it("Pago Móvil (VES) at $18 → 11.016 Bs", () => {
    const line = calculateLinePrice(18, pagoMovil, rates);
    expect(line.monto_a_pagar).toBe(11016);
  });

  it("Zelle (USD) at $18 → $13,77 (rounded)", () => {
    // 18 × 612 = 11016; 11016 / 800 = 13.77
    const line = calculateLinePrice(18, zelle, rates);
    expect(line.monto_a_pagar).toBe(13.77);
  });

  it("applies a positive adjustment_pct to USD method", () => {
    const usdtPlus5: PaymentMethod = { ...usdt, adjustment_pct: 5 };
    // 15.30 × 1.05 = 16.065 → 16.07
    const line = calculateLinePrice(20, usdtPlus5, rates);
    expect(line.monto_a_pagar).toBe(16.07);
  });

  it("applies a negative adjustment_pct to USD method (extra discount)", () => {
    const usdtMinus3: PaymentMethod = { ...usdt, adjustment_pct: -3 };
    // 15.30 × 0.97 = 14.841 → 14.84
    const line = calculateLinePrice(20, usdtMinus3, rates);
    expect(line.monto_a_pagar).toBe(14.84);
  });

  it("throws when rate is missing/invalid", () => {
    const badVes: PaymentMethod = { ...pagoMovil, rate: "usdt" };
    expect(() => calculateLinePrice(20, badVes, rates)).toThrow(PricingError);

    const badUsd: PaymentMethod = { ...usdt, rate: "bcv" };
    expect(() => calculateLinePrice(20, badUsd, rates)).toThrow(PricingError);
  });

  it("throws on non-positive rates", () => {
    expect(() => calculateLinePrice(20, pagoMovil, { tasa_bcv: 0, tasa_usdt: 800 })).toThrow(PricingError);
    expect(() => calculateLinePrice(20, pagoMovil, { tasa_bcv: 612, tasa_usdt: -1 })).toThrow(PricingError);
  });

  it("throws on negative price_usd", () => {
    expect(() => calculateLinePrice(-1, pagoMovil, rates)).toThrow(PricingError);
  });
});

describe("subtotalUsd", () => {
  const cart: CartItem[] = [
    { product_id: "1", name: "Sérum", brand: "A", unit_price_usd: 18, qty: 2 },
    { product_id: "2", name: "SPF", brand: "B", unit_price_usd: 12, qty: 1 },
  ];

  it("sums unit_price_usd × qty → $48", () => {
    expect(subtotalUsd(cart)).toBe(48);
  });
});

describe("calculateOrderTotals — cart + delivery + method", () => {
  const cart: CartItem[] = [
    { product_id: "1", name: "Sérum", brand: "A", unit_price_usd: 18, qty: 2 },
    { product_id: "2", name: "SPF", brand: "B", unit_price_usd: 12, qty: 1 },
  ];

  it("with Pago Móvil + pickup → 29.376 Bs", () => {
    // 48 × 612 = 29.376 Bs
    const t = calculateOrderTotals({
      cart,
      method: pagoMovil,
      delivery: pickup,
      rates,
    });
    expect(t.subtotal_usd).toBe(48);
    expect(t.delivery_usd).toBe(0);
    expect(t.base_total_usd).toBe(48);
    expect(t.final_amount).toBe(29376);
    expect(t.final_currency).toBe("VES");
    expect(t.savings_pct).toBe(23.5);
  });

  it("with USDT + pickup → $36,72 (≈ 23,5% cheaper)", () => {
    // 48 × 612 / 800 = 36.72 USD
    const t = calculateOrderTotals({
      cart,
      method: usdt,
      delivery: pickup,
      rates,
    });
    expect(t.final_amount).toBe(36.72);
    expect(t.final_currency).toBe("USD");
  });

  it("with USDT + local delivery ($3) → $39,72", () => {
    const t = calculateOrderTotals({
      cart,
      method: usdt,
      delivery: localDelivery,
      rates,
    });
    expect(t.subtotal_usd).toBe(48);
    expect(t.delivery_usd).toBe(3);
    expect(t.final_amount).toBe(39.72);
  });

  it("with Pago Móvil + local delivery → subtotal_bs + delivery×bcv = 29.376 + 1.836 = 31.212 Bs", () => {
    const t = calculateOrderTotals({
      cart,
      method: pagoMovil,
      delivery: localDelivery,
      rates,
    });
    expect(t.final_amount).toBe(31212);
  });

  it("freezes rates in the returned totals (mutation safety)", () => {
    const liveRates: Rates = { ...rates };
    const t = calculateOrderTotals({
      cart,
      method: pagoMovil,
      delivery: pickup,
      rates: liveRates,
    });
    liveRates.tasa_bcv = 999; // mutate after the call
    expect(t.rates.tasa_bcv).toBe(612); // unchanged
  });
});

describe("validateCustomer", () => {
  it("accepts a valid name and phone", () => {
    expect(validateCustomer({ nombre: "Ana", telefono: "0424-1234567" })).toEqual({ ok: true });
  });

  it("rejects empty or short names", () => {
    expect(validateCustomer({ nombre: "A", telefono: "04241234567" })).toEqual({
      ok: false,
      errors: expect.arrayContaining(["Indícanos tu nombre."]),
    });
  });

  it("rejects phones with fewer than 10 digits", () => {
    expect(validateCustomer({ nombre: "Ana", telefono: "12345" })).toEqual({
      ok: false,
      errors: expect.arrayContaining(["El teléfono debe tener al menos 10 dígitos."]),
    });
  });
});
