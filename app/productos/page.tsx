"use client";

import { useMemo, useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { GlowChip } from "@/components/GlowChip";
import { Input } from "@/components/Input";
import { getActiveProducts, getCategories } from "@/lib/supabase-queries";
import { getRates } from "@/lib/rates";
import type { Category, Product } from "@/lib/database.types";
import { useCart } from "@/components/CartContext";

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const initialPaso = searchParams.get("paso") ?? null;
  const initialNecesidad = searchParams.get("necesidad") ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasaBcv, setTasaBcv] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [selectedPaso, setSelectedPaso] = useState<string | null>(initialPaso);
  const [selectedNecesidad, setSelectedNecesidad] = useState<string | null>(initialNecesidad);
  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prods, cats, rates] = await Promise.all([
        getActiveProducts(),
        getCategories(),
        getRates(),
      ]);
      if (cancelled) return;
      setProducts(prods);
      setCategories(cats);
      setTasaBcv(rates.rates.tasa_bcv);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const routineSteps = useMemo(
    () => categories.filter((c) => c.type === "routine_step"),
    [categories]
  );
  const concerns = useMemo(
    () => categories.filter((c) => c.type === "concern"),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedPaso && p.routine_step !== selectedPaso) return false;
      if (
        selectedNecesidad &&
        !(p.skin_concern ?? []).includes(selectedNecesidad)
      )
        return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, selectedPaso, selectedNecesidad]);

  return (
    <main className="bg-background px-margin-mobile md:px-margin-desktop">
      <div className="mx-auto max-w-site">
        <header>
          <h1 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
            Catálogo
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {products.length === 0
              ? "Cargando productos…"
              : `${filtered.length} de ${products.length} producto${products.length === 1 ? "" : "s"}`}
          </p>
        </header>

        <div className="sticky top-20 z-nav -mx-margin-mobile mt-4 border-b border-outline-variant/30 bg-background/90 px-margin-mobile py-3 backdrop-blur-md md:-mx-margin-desktop md:px-margin-desktop">
          <Input
            type="search"
            placeholder="Buscar por nombre o marca…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
            aria-label="Buscar productos"
          />
          {routineSteps.length > 0 && (
            <ul className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <li className="flex-shrink-0">
                <GlowChip
                  active={!selectedPaso}
                  onClick={() => setSelectedPaso(null)}
                >
                  Todos
                </GlowChip>
              </li>
              {routineSteps.map((step) => (
                <li key={step.id} className="flex-shrink-0">
                  <GlowChip
                    active={selectedPaso === step.slug}
                    onClick={() =>
                      setSelectedPaso(selectedPaso === step.slug ? null : step.slug)
                    }
                  >
                    {step.name}
                  </GlowChip>
                </li>
              ))}
            </ul>
          )}
          {concerns.length > 0 && (
            <ul className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              <li className="flex-shrink-0">
                <GlowChip
                  variant="outline"
                  active={!selectedNecesidad}
                  onClick={() => setSelectedNecesidad(null)}
                >
                  Todas las necesidades
                </GlowChip>
              </li>
              {concerns.map((c) => (
                <li key={c.id} className="flex-shrink-0">
                  <GlowChip
                    variant="outline"
                    active={selectedNecesidad === c.slug}
                    onClick={() =>
                      setSelectedNecesidad(
                        selectedNecesidad === c.slug ? null : c.slug
                      )
                    }
                  >
                    {c.name}
                  </GlowChip>
                </li>
              ))}
            </ul>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12 text-center font-body-md text-body-md text-on-surface-variant">
            No encontramos productos con esos filtros.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tasaBcv={tasaBcv}
                onQuickAdd={(p) =>
                  add({
                    product_id: p.id,
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand,
                    unit_price_usd: p.price_usd,
                    image: p.images?.[0],
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
