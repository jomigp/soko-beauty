"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Phone,
  MapPin,
  Truck,
  Store,
  Send,
  Check,
} from "lucide-react";
import { useCart } from "@/components/CartContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { DualPrice } from "@/components/DualPrice";
import { calculateOrderTotals } from "@/lib/pricing";
import { buildWhatsappMessage } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/money";
import { getRates } from "@/lib/rates";
import { getStoreSetting } from "@/lib/supabase-queries";
import type { DeliveryOption, PaymentMethod, Rates } from "@/lib/types";
import type { StoreSetting as StoreSettingType } from "@/lib/database.types";

export default function CartPage() {
  const router = useRouter();
  const { items, setQty, remove, clear, subtotalUsd } = useCart();
  const [store, setStore] = useState<StoreSettingType | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  const [deliveryKey, setDeliveryKey] = useState<"local_delivery" | "store_pickup" | "national_shipping">("local_delivery");
  const [methodKey, setMethodKey] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([getStoreSetting(), getRates()]);
      setStore(s);
      setRates(r.rates);
      // default to first active payment method
      const firstActive = (s?.payment_methods ?? []).find((p) => p.is_active);
      if (firstActive) setMethodKey(firstActive.key);
    })();
  }, []);

  const deliveryOptions: DeliveryOption[] = useMemo(
    () => [
      {
        key: "local_delivery",
        label: "Delivery Valencia",
        extra_usd: store?.local_delivery_cost_usd ?? 3,
        note: "Same day en el área metropolitana de Valencia.",
      },
      {
        key: "store_pickup",
        label: "Retiro en tienda",
        extra_usd: 0,
        note: store?.store_pickup_note ?? "El Viñedo, Valencia.",
      },
      {
        key: "national_shipping",
        label: "Envío nacional (MRW / Zoom / Tealca)",
        extra_usd: 0,
        note:
          store?.national_shipping_note ??
          "Costo se confirma por WhatsApp tras validar la dirección.",
      },
    ],
    [store]
  );

  const delivery = deliveryOptions.find((d) => d.key === deliveryKey)!;
  const method = useMemo<PaymentMethod | null>(() => {
    if (!store || !methodKey) return null;
    return store.payment_methods.find((m) => m.key === methodKey) ?? null;
  }, [store, methodKey]);

  // Recompute totals live
  const totals = useMemo(() => {
    if (!method || !rates) return null;
    try {
      return calculateOrderTotals({
        cart: items,
        method,
        delivery,
        rates: { tasa_bcv: rates.tasa_bcv, tasa_usdt: rates.tasa_usdt },
      });
    } catch {
      return null;
    }
  }, [items, method, delivery, rates]);

  if (items.length === 0) {
    return (
      <main className="flex items-center justify-center bg-background px-margin-mobile">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
            <ShoppingBag className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="font-headline-md text-headline-sm text-on-surface">
            Tu carrito está vacío
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Explora el catálogo y añade tus productos favoritos.
          </p>
          <div className="mt-6">
            <Link href="/productos">
              <Button variant="primary" size="lg">
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleSend() {
    if (!method || !totals || !store || !rates) return;
    const result = buildWhatsappMessage({
      cart: items,
      method,
      delivery,
      customer: { nombre, telefono, direccion, notas },
      store: {
        tasa_bcv: store.tasa_bcv,
        tasa_usdt: store.tasa_usdt,
        whatsapp_number: store.whatsapp_number,
        business_rif: store.business_rif,
      },
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSending(true);
    // Persist the cart for confirmation page (visual only; cart lives in WA)
    try {
      sessionStorage.setItem("soko-last-order", result.message);
    } catch {
      // ignore
    }
    // Clear the cart and navigate to the confirmation
    clear();
    router.push(`/pedido/enviado?url=${encodeURIComponent(result.url)}`);
  }

  if (!store || !rates) {
    return (
      <main className="flex items-center justify-center bg-background">
        <p className="font-body-md text-body-md text-on-surface-variant">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop">
        <Link
          href="/productos"
          className="mb-4 inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Seguir Comprando
        </Link>
        <h1 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          Tu Carrito
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {items.length} producto{items.length === 1 ? "" : "s"}
        </p>

        {/* Items */}
        <ul className="mt-6 divide-y divide-outline-variant/20">
          {items.map((item) => (
            <li key={item.product_id} className="flex gap-3 py-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-surface-container-low">
                <Image
                  src={item.image ?? "/images/placeholder.png"}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  {item.brand}
                </span>
                <span className="line-clamp-1 font-body-md text-body-md font-medium text-on-surface">
                  {item.name}
                </span>
                <DualPrice
                  priceUsd={item.unit_price_usd}
                  tasaBcv={rates.tasa_bcv}
                  size="sm"
                />
                <div className="mt-auto flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setQty(item.product_id, item.qty - 1)}
                      aria-label="Disminuir"
                      className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 px-2 text-center font-body-sm text-body-sm">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(item.product_id, item.qty + 1)}
                      aria-label="Aumentar"
                      className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.product_id)}
                    aria-label="Eliminar"
                    className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Delivery */}
        <section className="mt-8">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Método de Entrega
          </h2>
          <ul className="mt-3 grid gap-2">
            {deliveryOptions.map((d) => {
              const selected = deliveryKey === d.key;
              return (
                <li key={d.key}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-md transition-all ${
                      selected
                        ? "border-primary bg-primary-fixed/10"
                        : "border-outline-variant/30 bg-surface-container-lowest"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={d.key}
                      checked={selected}
                      onChange={() => setDeliveryKey(d.key)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-primary" : "border-outline"
                      }`}
                    >
                      {selected && (
                        <span className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </span>
                    {d.key === "local_delivery" && (
                      <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                    {d.key === "store_pickup" && (
                      <Store className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                    {d.key === "national_shipping" && (
                      <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {d.label}
                        </span>
                        <span className="font-price-reference text-price-reference text-on-surface-variant">
                          {d.extra_usd > 0
                            ? `+${formatMoney(d.extra_usd, "USD")}`
                            : "GRATIS"}
                        </span>
                      </div>
                      {d.note && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {d.note}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Payment Method */}
        <section className="mt-8">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Método de Pago
          </h2>
          <ul className="mt-3 grid gap-2">
            {store.payment_methods
              .filter((m) => m.is_active !== false)
              .map((m) => {
                const selected = methodKey === m.key;
                // Compute live preview for this method
                let preview = "";
                if (rates) {
                  try {
                    const t = calculateOrderTotals({
                      cart: items,
                      method: m,
                      delivery,
                      rates: { tasa_bcv: rates.tasa_bcv, tasa_usdt: rates.tasa_usdt },
                    });
                    preview = `${formatMoney(t.final_amount, t.final_currency)}`;
                    if (t.savings_pct > 0 && t.final_currency === "USD") {
                      preview += ` · ahorras ${t.savings_pct.toFixed(2).replace(/\.00$/, "")}%`;
                    }
                  } catch {
                    // ignore
                  }
                }
                return (
                  <li key={m.key}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-md transition-all ${
                        selected
                          ? "border-primary bg-primary-fixed/10"
                          : "border-outline-variant/30 bg-surface-container-lowest"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.key}
                        checked={selected}
                        onChange={() => setMethodKey(m.key)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-primary" : "border-outline"
                        }`}
                      >
                        {selected && (
                          <span className="h-3 w-3 rounded-full bg-primary" />
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-body-md text-body-md font-medium text-on-surface">
                            {m.label}
                          </span>
                          {m.currency === "USD" && totals?.savings_pct ? (
                            <span className="rounded-full bg-tertiary-fixed/40 px-2 py-0.5 font-label-caps text-label-caps text-tertiary-container">
                              AHORRA {totals.savings_pct.toFixed(0)}%
                            </span>
                          ) : null}
                        </div>
                        {preview && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {preview}
                          </p>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
          </ul>
        </section>

        {/* Customer info */}
        <section className="mt-8">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Tus Datos
          </h2>
          <div className="mt-3 grid gap-4">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
              error={errors.find((e) => e.includes("nombre"))}
            />
            <Input
              label="WhatsApp"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              autoComplete="tel"
              leadingIcon={<Phone className="h-4 w-4" />}
              hint="Te contactaremos por aquí para confirmar el pedido."
              error={errors.find((e) => e.includes("teléfono"))}
            />
            {deliveryKey !== "store_pickup" && (
              <Input
                label={
                  deliveryKey === "national_shipping"
                    ? "Dirección de envío (ciudad, estado)"
                    : "Dirección de entrega"
                }
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                leadingIcon={<MapPin className="h-4 w-4" />}
              />
            )}
            <Input
              label="Notas (opcional)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              hint="Ej: horario preferido, color, referencia."
            />
          </div>
        </section>

        {/* Summary */}
        <section className="mt-8 rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Resumen
          </h2>
          <dl className="mt-3 space-y-2 font-body-md text-body-md text-on-surface">
            <div className="flex justify-between">
              <dt>Subtotal (precio BCV)</dt>
              <dd className="font-price-primary text-price-primary text-primary">
                {formatMoney(subtotalUsd, "USD")}
              </dd>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>Envío</dt>
              <dd>
                {delivery.extra_usd > 0
                  ? `+${formatMoney(delivery.extra_usd, "USD")}`
                  : "GRATIS"}
              </dd>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>Tasa BCV</dt>
              <dd>{rates.tasa_bcv.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <dt>Tasa paralelo</dt>
              <dd>{rates.tasa_usdt.toFixed(2)}</dd>
            </div>
            <div className="mt-3 border-t border-outline-variant/20 pt-3">
              <div className="flex items-end justify-between">
                <span className="font-body-lg text-body-lg font-semibold">
                  Total a Pagar
                </span>
                {totals ? (
                  <div className="text-right">
                    <div className="font-price-primary text-price-primary text-primary">
                      {formatMoney(totals.final_amount, totals.final_currency)}
                    </div>
                    {totals.final_currency === "USD" && (
                      <div className="font-price-reference text-price-reference text-outline">
                        equiv. {formatMoney(totals.final_ves, "VES")}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Selecciona un método de pago
                  </span>
                )}
              </div>
            </div>
          </dl>
        </section>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-error bg-error-container p-3 font-body-sm text-body-sm text-error"
          >
            <ul>
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSend}
            disabled={!method || !totals || sending}
            loading={sending}
            leadingIcon={<Send className="h-5 w-5" />}
          >
            Enviar Pedido por WhatsApp
          </Button>
          <p className="mt-3 text-center font-body-sm text-body-sm text-on-surface-variant">
            Tu pedido se enviará al WhatsApp de Soko Beauty. No procesamos
            pagos aquí — el cobro y la entrega se coordinan por chat.
          </p>
        </div>
      </div>
    </main>
  );
}
