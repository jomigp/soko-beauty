/**
 * Tests for the calcu.arepatecnologica.com provider.
 *
 * The parser is the highest-risk piece of the rate pipeline: if it
 * returns the wrong number, every cart, every checkout, every WhatsApp
 * message is wrong. We test the real live response shape, captured on
 * 2026-06-22 from https://calcu.arepatecnologica.com/.
 */

import { describe, expect, it } from "vitest";
import { parseCalcuResponse } from "@/lib/rates";

// Real response shape (captured 2026-06-22 from the live API).
const SAMPLE = {
  nombre: "API BCV Venezuela",
  descripcion:
    "Tasas de cambio del Dólar y Euro oficial del BCV, más el Dólar Paralelo",
  tasas: [
    {
      moneda: "USD",
      nombre: "Dólar Oficial",
      fuente: "BCV",
      compra: null,
      venta: 612.43,
      promedio: 612.43,
      valorCompleto: 612.4332,
      fechaActualizacion: "2026-06-21T23:34:38.828Z",
      fechaVigencia: "2026-06-21T00:00:00.000Z",
    },
    {
      moneda: "USD",
      nombre: "Dólar Paralelo",
      fuente: "Monitor",
      compra: null,
      venta: null,
      promedio: 784.8,
      valorCompleto: null,
      fechaActualizacion: "2026-06-21T21:01:12.187Z",
      fechaVigencia: "2026-06-22T00:00:00.000Z",
    },
    {
      moneda: "EUR",
      nombre: "Euro Oficial",
      fuente: "BCV",
      compra: null,
      venta: 702.42,
      promedio: 702.42,
      valorCompleto: 702.4241344,
      fechaActualizacion: "2026-06-21T23:34:38.828Z",
      fechaVigencia: "2026-06-21T00:00:00.000Z",
    },
  ],
  ultimaActualizacion: "2026-06-22T00:10:30.729Z",
  fuentes: {
    oficial: "https://www.bcv.org.ve/",
    paralelo: "https://ve.dolarapi.com/",
  },
};

describe("parseCalcuResponse — owner-confirmed provider", () => {
  it("extracts tasa_bcv from the BCV USD entry", () => {
    const rates = parseCalcuResponse(SAMPLE);
    expect(rates.tasa_bcv).toBe(612.43);
  });

  it("extracts tasa_usdt from the Monitor (Paralelo) entry", () => {
    const rates = parseCalcuResponse(SAMPLE);
    expect(rates.tasa_usdt).toBe(784.8);
  });

  it("extracts tasa_eur from the BCV EUR entry", () => {
    const rates = parseCalcuResponse(SAMPLE);
    expect(rates.tasa_eur).toBe(702.42);
  });

  it("propagates ultimaActualizacion as updated_at", () => {
    const rates = parseCalcuResponse(SAMPLE);
    expect(rates.updated_at).toBe("2026-06-22T00:10:30.729Z");
  });

  it("falls back to venta when promedio is missing", () => {
    const noPromedio = {
      ...SAMPLE,
      tasas: [
        { ...SAMPLE.tasas[0], promedio: null }, // BCV USD only has venta
        SAMPLE.tasas[1],                       // keep paralelo intact
        SAMPLE.tasas[2],                       // keep EUR intact
      ],
    };
    const rates = parseCalcuResponse(noPromedio);
    expect(rates.tasa_bcv).toBe(612.43);
  });

  it("falls back to valorCompleto when both promedio and venta are null", () => {
    const onlyValorCompleto = {
      ...SAMPLE,
      tasas: [
        {
          ...SAMPLE.tasas[0],
          promedio: null,
          venta: null,
          valorCompleto: 612.4332,
        },
        SAMPLE.tasas[1], // keep paralelo intact
        SAMPLE.tasas[2], // keep EUR intact
      ],
    };
    const rates = parseCalcuResponse(onlyValorCompleto);
    expect(rates.tasa_bcv).toBe(612.4332);
  });

  it("falls back to Paralelo detection by name when fuente ≠ 'Monitor'", () => {
    const monitorAlt = {
      ...SAMPLE,
      tasas: [
        SAMPLE.tasas[0], // BCV USD
        { ...SAMPLE.tasas[1], fuente: "Otro" }, // paralelo but fuente changed
        SAMPLE.tasas[2], // BCV EUR
      ],
    };
    const rates = parseCalcuResponse(monitorAlt);
    expect(rates.tasa_usdt).toBe(784.8);
  });

  it("throws when BCV USD is missing", () => {
    const noBcv = { ...SAMPLE, tasas: [SAMPLE.tasas[1], SAMPLE.tasas[2]] };
    expect(() => parseCalcuResponse(noBcv)).toThrow(/missing required rates/);
  });

  it("throws when Paralelo is missing", () => {
    const noParalelo = { ...SAMPLE, tasas: [SAMPLE.tasas[0], SAMPLE.tasas[2]] };
    expect(() => parseCalcuResponse(noParalelo)).toThrow(/missing required rates/);
  });

  it("throws on non-positive rates (data corruption guard)", () => {
    const corrupted = {
      ...SAMPLE,
      tasas: [
        { ...SAMPLE.tasas[0], promedio: -1 }, // BCV USD corrupted to negative
        SAMPLE.tasas[1],
        SAMPLE.tasas[2],
      ],
    };
    expect(() => parseCalcuResponse(corrupted)).toThrow(/non-positive rates/);
  });

  it("throws when 'tasas' array is missing", () => {
    expect(() => parseCalcuResponse({} as never)).toThrow(/missing 'tasas'/);
  });

  it("lives the real pipeline: $20 at the live rates gives ~$15.61 USD", () => {
    // End-to-end sanity: with these live rates, paying $20 in USD via
    // paralelo should save us about 21.9% vs paying in Bs at BCV.
    const rates = parseCalcuResponse(SAMPLE);
    const valor_bs = 20 * rates.tasa_bcv; // 12248.6 Bs
    const monto_usd = valor_bs / rates.tasa_usdt; // ~15.61 USD
    const savings = 1 - rates.tasa_bcv / rates.tasa_usdt;
    expect(monto_usd).toBeCloseTo(15.61, 1);
    expect(savings).toBeCloseTo(0.2196, 3); // ~21.96%
  });
});
