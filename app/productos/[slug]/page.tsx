import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Beaker, ListChecks } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DualPrice } from "@/components/DualPrice";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import {
  getProductBySlug,
  getRelatedProducts,
  getActiveProducts,
} from "@/lib/supabase-queries";
import { getRates } from "@/lib/rates";
import type { Product } from "@/lib/database.types";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado · Soko Beauty" };
  return {
    title: `${product.name} · Soko Beauty`,
    description: product.description ?? `${product.brand} — ${product.name}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, ratesResult, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getRates(),
    getActiveProducts(),
  ]);
  if (!product) notFound();
  const rates = ratesResult.rates;
  const related = (await getRelatedProducts(product)).slice(0, 4);

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-site px-margin-mobile md:px-margin-desktop">
        <Link
          href="/productos"
          className="mb-4 inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
        <div className="grid gap-lg md:grid-cols-2">
          {/* Gallery */}
          <div className="flex flex-col gap-sm">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md">
              {product.badge && (
                <div className="absolute left-3 top-3 z-10">
                  <Badge kind={product.badge} />
                </div>
              )}
              <Image
                src={product.images?.[0] ?? "/images/placeholder.png"}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <ul className="grid grid-cols-4 gap-sm">
                {product.images.slice(1, 5).map((img, i) => (
                  <li
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md border border-outline-variant/30 bg-surface-container-low"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - imagen ${i + 2}`}
                      fill
                      sizes="120px"
                      className="object-contain"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {product.brand}
            </span>
            <h1 className="mt-2 font-headline-md text-headline-sm text-on-surface md:text-headline-md">
              {product.name}
            </h1>
            <div className="mt-4">
              <DualPrice priceUsd={product.price_usd} tasaBcv={rates.tasa_bcv} size="lg" />
            </div>
            {(product.skin_concern?.length ?? 0) > 0 && (
              <ul className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                {(product.skin_concern ?? []).map((c) => (
                  <li key={c} className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 font-body-sm text-body-sm text-on-surface-variant">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {product.description && (
              <p className="mt-6 max-w-prose font-body-md text-body-md text-on-surface-variant">
                {product.description}
              </p>
            )}

            {/* Key Ingredients */}
            {(product.key_ingredients?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h2 className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
                  <Beaker className="h-4 w-4" aria-hidden="true" />
                  Ingredientes Clave
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(product.key_ingredients ?? []).map((ing, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-outline-variant/30 bg-surface-container-low p-3"
                    >
                      <p className="font-body-md text-body-md font-medium text-on-surface">
                        {ing.name}
                        {ing.pct ? ` ${ing.pct}%` : ""}
                      </p>
                      {ing.role && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {ing.role}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* How to Use */}
            {(product.usage_steps?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h2 className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                  Cómo Usar
                </h2>
                <ol className="mt-3 space-y-3">
                  {(product.usage_steps ?? []).map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-fixed/30 font-label-caps text-label-caps text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-body-md text-body-md font-medium text-on-surface">
                          {step.title}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Add to cart */}
            <div className="mt-10">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
              También te puede gustar
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-gutter md:grid-cols-4">
              {related.map((p: Product) => (
                <ProductCard key={p.id} product={p} tasaBcv={rates.tasa_bcv} />
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
