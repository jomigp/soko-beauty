"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/database.types";

const EMPTY_PRODUCT: Partial<Product> = {
  slug: "",
  name: "",
  brand: "",
  description: "",
  price_usd: 0,
  badge: null,
  skin_concern: [],
  skin_type: [],
  routine_step: null,
  in_stock: true,
  is_featured: false,
  images: [],
  sort_order: 0,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/productos");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? "/api/admin/productos"
      : `/api/admin/productos/${editing.id}`;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "No se pudo guardar.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto? No se puede deshacer.")) return;
    const res = await fetch(`/api/admin/productos/${id}`, {
      method: "DELETE",
    });
    if (res.ok) await refresh();
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">
            {editing.id ? "Editar Producto" : "Nuevo Producto"}
          </h1>
          <button
            onClick={() => setEditing(null)}
            aria-label="Cancelar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Slug (URL)"
              value={editing.slug ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, slug: e.target.value })
              }
              required
              hint="Sin espacios, minúsculas. Ej: cosrx-snail-mucin"
            />
            <Input
              label="Nombre"
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              required
            />
            <Input
              label="Marca"
              value={editing.brand ?? ""}
              onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              required
            />
            <Input
              label="Precio (USD)"
              type="number"
              step="0.01"
              min="0"
              value={editing.price_usd ?? 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  price_usd: parseFloat(e.target.value || "0"),
                })
              }
              required
            />
            <Input
              label="Paso de rutina"
              value={editing.routine_step ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, routine_step: e.target.value || null })
              }
              hint="Ej: limpiador, tonico, esencia, serum, hidratante, spf"
            />
            <Input
              label="Orden"
              type="number"
              value={editing.sort_order ?? 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  sort_order: parseInt(e.target.value || "0", 10),
                })
              }
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant">
              Descripción
            </label>
            <textarea
              value={editing.description ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              rows={3}
              className="mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>
          <Input
            label="URLs de imágenes (una por línea)"
            value={(editing.images ?? []).join("\n")}
            onChange={(e) =>
              setEditing({
                ...editing,
                images: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            hint="Sube primero las imágenes a Supabase Storage y pega las URLs aquí."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Necesidades (separadas por coma)"
              value={(editing.skin_concern ?? []).join(", ")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  skin_concern: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              hint="Ej: hidratacion, brillo, acne, antiedad"
            />
            <Input
              label="Tipos de piel (separados por coma)"
              value={(editing.skin_type ?? []).join(", ")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  skin_type: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              hint="Ej: seca, grasa, mixta, sensible"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 font-body-md text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={editing.in_stock ?? true}
                onChange={(e) =>
                  setEditing({ ...editing, in_stock: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              En stock
            </label>
            <label className="inline-flex items-center gap-2 font-body-md text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={editing.is_featured ?? false}
                onChange={(e) =>
                  setEditing({ ...editing, is_featured: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              Destacado (aparece en la home)
            </label>
            <label className="inline-flex items-center gap-2 font-body-md text-body-md text-on-surface">
              <span>Badge:</span>
              <select
                value={editing.badge ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    badge: (e.target.value || null) as Product["badge"],
                  })
                }
                className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 font-body-sm text-body-sm"
              >
                <option value="">Ninguno</option>
                <option value="best_seller">Best Seller</option>
                <option value="new">Nuevo</option>
              </select>
            </label>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-error bg-error-container p-3 font-body-sm text-body-sm text-error"
            >
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              leadingIcon={<Save className="h-4 w-4" />}
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-headline-sm text-headline-sm text-on-surface">
          Productos
        </h1>
        <Button
          variant="primary"
          size="md"
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setEditing({ ...EMPTY_PRODUCT })}
        >
          Nuevo Producto
        </Button>
      </div>
      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Cargando…
        </p>
      ) : products.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Aún no hay productos. Crea el primero.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Imagen</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Marca</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-outline-variant/20 font-body-md text-body-md"
                >
                  <td className="px-3 py-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-surface-container-low">
                      <Image
                        src={p.images?.[0] ?? "/images/placeholder.png"}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-on-surface-variant">{p.brand}</td>
                  <td className="px-3 py-2 text-right font-price-primary text-price-primary text-primary">
                    {formatMoney(p.price_usd, "USD")}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.in_stock ? (
                      <Badge kind="in_stock" />
                    ) : (
                      <Badge kind="out_of_stock" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        aria-label="Editar"
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label="Eliminar"
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-error-container hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
