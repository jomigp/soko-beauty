/**
 * lib/whatsapp.ts — Build the WhatsApp deep-link and message.
 *
 * The single place where the order summary is composed. The business
 * owner reads this in WhatsApp to process the order, so it must be
 * exact: frozen rates, clear method, clear total, all lines.
 *
 * Deep-link: https://wa.me/<phone>?text=<encoded-message>
 *   - The phone must be digits only, no "+" or spaces.
 *   - The text is encoded with encodeURIComponent (handles emoji, ñ, etc).
 */

import { formatMoney } from "./money";
import { calculateOrderTotals, validateCustomer } from "./pricing";
import type {
  CartItem,
  CustomerInfo,
  DeliveryOption,
  PaymentMethod,
} from "./types";
import type { StoreSetting } from "./database.types";

export interface BuildMessageInput {
  cart: CartItem[];
  method: PaymentMethod;
  delivery: DeliveryOption;
  customer: Partial<CustomerInfo>;
  store: Pick<
    StoreSetting,
    "tasa_bcv" | "tasa_usdt" | "whatsapp_number" | "business_rif"
  >;
}

export interface BuildMessageResult {
  ok: true;
  url: string;
  message: string;
}

export interface BuildMessageError {
  ok: false;
  errors: string[];
}

export function buildWhatsappMessage(
  input: BuildMessageInput
): BuildMessageResult | BuildMessageError {
  const { cart, method, delivery, customer, store } = input;

  // 1. Validate customer
  const v = validateCustomer(customer);
  if (!v.ok) return { ok: false, errors: v.errors };

  // 2. Validate cart
  if (cart.length === 0) {
    return { ok: false, errors: ["El carrito está vacío."] };
  }

  // 3. Validate store
  const phone = (store.whatsapp_number ?? "").replace(/\D/g, "");
  if (phone.length < 10) {
    return {
      ok: false,
      errors: ["Número de WhatsApp de la tienda no configurado."],
    };
  }

  // 4. Compute totals (this also validates the rates)
  let totals;
  try {
    totals = calculateOrderTotals({
      cart,
      method,
      delivery,
      rates: { tasa_bcv: store.tasa_bcv, tasa_usdt: store.tasa_usdt },
    });
  } catch (err) {
    return {
      ok: false,
      errors: [
        err instanceof Error ? err.message : "Error al calcular el total.",
      ],
    };
  }

  // 5. Compose the message
  const lines: string[] = [];
  lines.push("🧴 *NUEVO PEDIDO — Soko Beauty*");
  lines.push("");

  lines.push(
    `👤 Cliente: ${customer.nombre!.trim()}   📱 ${customer.telefono!.trim()}`
  );
  lines.push("");

  lines.push("🛒 *Productos:*");
  for (const item of cart) {
    const lineTotal = item.unit_price_usd * item.qty;
    lines.push(
      `• ${item.qty} x ${item.name} — ${formatMoney(lineTotal, "USD")}`
    );
  }
  lines.push(
    `Subtotal (precio BCV): *${formatMoney(totals.subtotal_usd, "USD")}*`
  );
  if (totals.delivery_usd > 0) {
    lines.push(
      `🚚 Entrega: ${delivery.label} (+${formatMoney(totals.delivery_usd, "USD")})`
    );
  } else {
    lines.push(`🚚 Entrega: ${delivery.label}`);
  }
  lines.push(
    `🏦 Tasas: BCV ${totals.rates.tasa_bcv} · USDT ${totals.rates.tasa_usdt}`
  );
  lines.push("");

  lines.push(`💳 *Método elegido: ${method.label}*`);
  if (totals.final_currency === "USD" && totals.savings_pct > 0) {
    lines.push(
      `👉 *TOTAL A PAGAR: ${formatMoney(totals.final_amount, "USD")}*` +
        `   (equiv. ${formatMoney(totals.final_ves, "VES")})` +
        `   _Ahorras ${totals.savings_pct.toFixed(2).replace(/\.00$/, "")}%_`
    );
  } else {
    lines.push(
      `👉 *TOTAL A PAGAR: ${formatMoney(totals.final_amount, "VES")}*`
    );
  }
  lines.push("");

  if (delivery.key === "store_pickup") {
    lines.push("📍 Retiro en tienda");
  } else if (customer.direccion && customer.direccion.trim()) {
    lines.push(`📍 ${customer.direccion.trim()}`);
  }
  if (customer.notas && customer.notas.trim()) {
    lines.push(`📝 Notas: ${customer.notas.trim()}`);
  }
  if (store.business_rif) {
    lines.push("");
    lines.push(`_RIF: ${store.business_rif}_`);
  }

  const message = lines.join("\n");
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return { ok: true, url, message };
}
