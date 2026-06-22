"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { StoreSetting, PaymentMethodConfig } from "@/lib/database.types";

export default function AdminConfiguracionPage() {
  const [store, setStore] = useState<StoreSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/productos");
      // We don't have a dedicated GET /api/admin/configuracion yet; for MVP,
      // fetch from public endpoint which is gated by RLS only (anon-readable).
      const r2 = await fetch("/api/store/setting");
      if (r2.ok) {
        const data = await r2.json();
        setStore(data.store);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "No se pudo guardar.");
    }
    setSaving(false);
  }

  function updateMethod(idx: number, patch: Partial<PaymentMethodConfig>) {
    if (!store) return;
    const next = [...store.payment_methods];
    next[idx] = { ...next[idx], ...patch };
    setStore({ ...store, payment_methods: next });
  }

  function addMethod() {
    if (!store) return;
    setStore({
      ...store,
      payment_methods: [
        ...store.payment_methods,
        {
          key: `nuevo_${Date.now()}`,
          label: "Nuevo método",
          currency: "VES",
          rate: "bcv",
          is_active: true,
        },
      ],
    });
  }

  function removeMethod(idx: number) {
    if (!store) return;
    setStore({
      ...store,
      payment_methods: store.payment_methods.filter((_, i) => i !== idx),
    });
  }

  if (!store) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Cargando…
      </p>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h1 className="font-headline-sm text-headline-sm text-on-surface">
        Configuración
      </h1>

      <section className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <h2 className="font-label-caps text-label-caps text-on-surface-variant">
          Tasas de Cambio
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Se actualizan automáticamente desde{" "}
          <code className="rounded bg-surface-container-low px-1">
            calcu.arepatecnologica.com
          </code>
          . Edita manualmente solo si la API falla.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Tasa BCV (USD)"
            type="number"
            step="0.01"
            min="0"
            value={store.tasa_bcv}
            onChange={(e) =>
              setStore({ ...store, tasa_bcv: parseFloat(e.target.value || "0") })
            }
          />
          <Input
            label="Tasa Paralelo (USD)"
            type="number"
            step="0.01"
            min="0"
            value={store.tasa_usdt}
            onChange={(e) =>
              setStore({ ...store, tasa_usdt: parseFloat(e.target.value || "0") })
            }
            hint="Usada para calcular el descuento al pagar en USD."
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <h2 className="font-label-caps text-label-caps text-on-surface-variant">
          Tienda
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Número de WhatsApp (con código de país, sin +)"
            value={store.whatsapp_number}
            onChange={(e) =>
              setStore({ ...store, whatsapp_number: e.target.value })
            }
            hint="Ej: 584244273062"
          />
          <Input
            label="RIF"
            value={store.business_rif ?? ""}
            onChange={(e) =>
              setStore({ ...store, business_rif: e.target.value || null })
            }
            placeholder="J-12345678-9"
          />
          <Input
            label="Dirección de la tienda"
            value={store.business_address ?? ""}
            onChange={(e) =>
              setStore({ ...store, business_address: e.target.value || null })
            }
          />
          <Input
            label="Costo delivery Valencia (USD)"
            type="number"
            step="0.01"
            min="0"
            value={store.local_delivery_cost_usd}
            onChange={(e) =>
              setStore({
                ...store,
                local_delivery_cost_usd: parseFloat(e.target.value || "0"),
              })
            }
          />
        </div>
        <Input
          label="Nota retiro en tienda"
          value={store.store_pickup_note ?? ""}
          onChange={(e) =>
            setStore({ ...store, store_pickup_note: e.target.value || null })
          }
        />
        <Input
          label="Nota envío nacional"
          value={store.national_shipping_note ?? ""}
          onChange={(e) =>
            setStore({ ...store, national_shipping_note: e.target.value || null })
          }
        />
      </section>

      <section className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Métodos de Pago
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addMethod}
            leadingIcon={<Plus className="h-4 w-4" />}
          >
            Añadir Método
          </Button>
        </div>
        <ul className="space-y-3">
          {store.payment_methods.map((m, idx) => (
            <li
              key={m.key}
              className="rounded-md border border-outline-variant/30 p-3"
            >
              <div className="grid gap-3 md:grid-cols-4">
                <Input
                  label="Key"
                  value={m.key}
                  onChange={(e) => updateMethod(idx, { key: e.target.value })}
                />
                <Input
                  label="Etiqueta visible"
                  value={m.label}
                  onChange={(e) => updateMethod(idx, { label: e.target.value })}
                />
                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Moneda
                  </span>
                  <select
                    value={m.currency}
                    onChange={(e) =>
                      updateMethod(idx, {
                        currency: e.target.value as "VES" | "USD",
                      })
                    }
                    className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md"
                  >
                    <option value="VES">VES (Bolívares)</option>
                    <option value="USD">USD (Dólar)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Tasa
                  </span>
                  <select
                    value={m.rate}
                    onChange={(e) =>
                      updateMethod(idx, {
                        rate: e.target.value as "bcv" | "usdt",
                      })
                    }
                    className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md"
                  >
                    <option value="bcv">BCV</option>
                    <option value="usdt">Paralelo</option>
                  </select>
                </label>
                <Input
                  label="Ajuste (%)"
                  type="number"
                  step="0.1"
                  value={m.adjustment_pct ?? 0}
                  onChange={(e) =>
                    updateMethod(idx, {
                      adjustment_pct: parseFloat(e.target.value || "0"),
                    })
                  }
                  hint="Ej: 5 = +5%, -3 = -3% (descuento extra)"
                />
                <label className="flex items-center gap-2 self-end pb-2 font-body-md text-body-md">
                  <input
                    type="checkbox"
                    checked={m.is_active !== false}
                    onChange={(e) =>
                      updateMethod(idx, { is_active: e.target.checked })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  Activo
                </label>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeMethod(idx)}
                    aria-label="Eliminar método"
                    className="inline-flex h-10 w-10 items-center justify-center rounded text-on-surface-variant hover:bg-error-container hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <div>
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            Proveedor de IA (Generador de Rutinas)
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Elige qué modelo de IA arma las rutinas en la página /rutina.
            Las API keys se configuran en Vercel (env vars), no aquí.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Proveedor
            </span>
            <select
              value={store.ai_provider}
              onChange={(e) =>
                setStore({
                  ...store,
                  ai_provider: e.target.value as "gemini" | "deepseek" | "openai",
                })
              }
              className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md"
            >
              <option value="gemini">Google Gemini (gratis con AI Studio)</option>
              <option value="deepseek">DeepSeek (créditos gratis al registrarse)</option>
              <option value="openai">OpenAI (pagado, gpt-4o-mini desde $0.15/1M tokens)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Modelo
            </span>
            <select
              value={store.ai_model}
              onChange={(e) => setStore({ ...store, ai_model: e.target.value })}
              className="h-12 rounded-md border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md"
            >
              {store.ai_provider === "gemini" && (
                <>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (recomendado)</option>
                  <option value="gemini-3-flash">gemini-3-flash</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </>
              )}
              {store.ai_provider === "deepseek" && (
                <>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (más lento pero más capaz)</option>
                </>
              )}
              {store.ai_provider === "openai" && (
                <>
                  <option value="gpt-4o-mini">gpt-4o-mini (más barato)</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4.1">gpt-4.1</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo (legacy)</option>
                </>
              )}
            </select>
          </label>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          💡 Las API keys (<code className="rounded bg-surface-container-low px-1">GEMINI_API_KEY</code>,{" "}
          <code className="rounded bg-surface-container-low px-1">DEEPSEEK_API_KEY</code>,{" "}
          <code className="rounded bg-surface-container-low px-1">OPENAI_API_KEY</code>) se configuran en Vercel → Settings → Environment Variables.
          El sistema usa la que coincida con tu proveedor aquí seleccionado.
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-error bg-error-container p-3 font-body-sm text-body-sm text-error"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          leadingIcon={<Save className="h-4 w-4" />}
        >
          Guardar Cambios
        </Button>
        {saved && (
          <span className="font-body-sm text-body-sm text-tertiary-container">
            ✓ Guardado
          </span>
        )}
      </div>
    </form>
  );
}
