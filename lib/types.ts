/**
 * Domain types for Soko Beauty.
 *
 * Single source of truth for shapes that flow through the pricing engine,
 * the WhatsApp message, and the Supabase schema.
 */

export type Currency = "VES" | "USD";
export type RateKind = "bcv" | "usdt";

export interface PaymentMethod {
  /** Stable identifier, e.g. "pago_movil", "zelle", "usdt" */
  key: string;
  /** Display label shown to the customer, e.g. "Pago Móvil" */
  label: string;
  currency: Currency;
  /** Which rate to convert against: BCV (for VES) or USDT (for USD) */
  rate: RateKind;
  /**
   * Optional adjustment in percent (e.g. 5 means +5%, -3 means -3%).
   * Applied to the final amount in the method's currency.
   */
  adjustment_pct?: number;
  is_active?: boolean;
}

export interface Rates {
  tasa_bcv: number;
  /** Parallel rate. From calcu.arepatecnologica.com = Paralelo. */
  tasa_usdt: number;
  /** BCV EUR rate. Optional — not used by the multi-tasa engine today. */
  tasa_eur?: number;
  /** ISO timestamp of when these rates were last fetched/updated */
  updated_at?: string;
}

export interface DeliveryOption {
  key: "local_delivery" | "store_pickup" | "national_shipping";
  label: string;
  /** Extra cost in USD. For local_delivery; 0 for pickup. */
  extra_usd: number;
  note?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  brand: string;
  unit_price_usd: number;
  qty: number;
}

export interface CustomerInfo {
  nombre: string;
  telefono: string;
  direccion?: string;
  notas?: string;
}

export interface OrderTotals {
  /** Subtotal in USD at BCV reference (sum of unit_price_usd × qty) */
  subtotal_usd: number;
  /** Delivery cost in USD (0 for pickup) */
  delivery_usd: number;
  /** Total before delivery, in USD reference */
  base_total_usd: number;
  /** Final amount in the method's currency, after all conversions and adjustments */
  final_amount: number;
  final_currency: Currency;
  /** Equivalent in VES at BCV (for reference) */
  final_ves: number;
  /** Savings % vs paying in VES at BCV (positive = cheaper to pay in USD) */
  savings_pct: number;
  /** Frozen rates at the moment of calculation */
  rates: Rates;
}
