/**
 * lib/store.ts — In-memory snapshot of the StoreSetting row.
 *
 * In a real Next.js + Vercel app this would be fetched per-request or
 * cached with revalidate. For the MVP scaffold we expose a typed
 * default + a way to override it from the admin panel.
 */

import type { StoreSetting as T } from "@/lib/database.types";

const DEFAULT_STORE: T = {
  id: 1,
  tasa_bcv: 612,
  tasa_usdt: 800,
  rates_updated_at: new Date(0).toISOString(),
  whatsapp_number: "584244273062",
  business_rif: null,
  business_address: null,
  local_delivery_cost_usd: 3,
  store_pickup_note: "Retiro en tienda, Valencia.",
  national_shipping_note: "Envío nacional (MRW/Zoom/Tealca), se coordina por WhatsApp.",
  payment_methods: [
    { key: "pago_movil", label: "Pago Móvil", currency: "VES", rate: "bcv", is_active: true },
    { key: "transferencia", label: "Transferencia", currency: "VES", rate: "bcv", is_active: true },
    { key: "zelle", label: "Zelle", currency: "USD", rate: "usdt", is_active: true },
    { key: "usdt", label: "USDT (Binance)", currency: "USD", rate: "usdt", is_active: true },
    { key: "efectivo_usd", label: "Efectivo USD", currency: "USD", rate: "usdt", is_active: true },
  ],
};

export type StoreSetting = T;
export function getDefaultStore(): StoreSetting {
  return DEFAULT_STORE;
}
