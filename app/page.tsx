import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { GlowChip } from "@/components/GlowChip";
import { Logo } from "@/components/Logo";
import { DualPrice } from "@/components/DualPrice";
import {
  getActiveProducts,
  getCategories,
  getFeaturedProducts,
} from "@/lib/supabase-queries";
import { getRates } from "@/lib/rates";

export const revalidate = 300; // 5 min

export default async function HomePage() {
  // Fetch in parallel
  const [featured, allProducts, categories, ratesResult] = await Promise.all([
    getFeaturedProducts(4),
    getActiveProducts(),
    getCategories(),
    getRates(),
  ]);
  const rates = ratesResult.rates;

  const routineSteps = categories.filter((c) => c.type === "routine_step");
  const concerns = categories.filter((c) => c.type === "concern");
  const heroProduct = featured[0] ?? allProducts[0];

  return (
    <main className="min-h-screen bg-background pb-32 pt-16 md:pb-24 md:pt-24">
      {/* HERO */}
      <section className="relative px-margin-mobile md:px-margin-desktop">
        <div className="mx-auto grid max-w-site gap-lg md:grid-cols-2 md:items-center">
          <div>
            <p className="font-label-caps text-label-caps text-primary">
              Skincare Coreano · Valencia, VE
            </p>
            <h1 className="mt-3 font-display-lg text-display-lg-mobile text-on-surface md:text-display-lg">
              Glass Skin <em className="not-italic text-primary">Awaits</em>.
            </h1>
            <p className="mt-6 max-w-prose font-body-lg text-on-surface-variant">
              Skincare coreano premium, curado para ti. Pide por WhatsApp, paga
              en USD o bolívares, recibe donde estés.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/productos">
                <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  Ver Catálogo
                </Button>
              </Link>
              <Link href="/soporte">
                <Button variant="secondary" size="lg">
                  ¿Cómo Pido?
                </Button>
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-6 font-body-sm text-body-sm text-on-surface-variant">
              <li className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                Delivery en Valencia
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Productos originales
              </li>
              <li className="inline-flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
                Atención por WhatsApp
              </li>
            </ul>
          </div>
          {heroProduct && (
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md shadow-glow-lg">
              <Image
                src={heroProduct.images?.[0] ?? "/images/placeholder.png"}
                alt={heroProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain"
              />
              <div className="absolute bottom-md left-md right-md rounded-xl glass-panel p-md">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {heroProduct.brand}
                </p>
                <p className="mt-1 line-clamp-1 font-body-md text-body-md font-medium text-on-surface">
                  {heroProduct.name}
                </p>
                <div className="mt-2">
                  <DualPrice priceUsd={heroProduct.price_usd} tasaBcv={rates.tasa_bcv} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SHOP BY STEP */}
      {routineSteps.length > 0 && (
        <section className="mt-20 px-margin-mobile md:px-margin-desktop">
          <div className="mx-auto max-w-site">
            <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
              Compra por Paso
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Sigue la rutina coreana de 10 pasos, o empieza con lo esencial.
            </p>
            <ul className="hide-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
              {routineSteps.map((step) => (
                <li key={step.id} className="flex-shrink-0">
                  <Link href={`/productos?paso=${step.slug}`}>
                    <GlowChip>{step.name}</GlowChip>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mt-20 px-margin-mobile md:px-margin-desktop">
          <div className="mx-auto max-w-site">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
                  Featured Glow
                </h2>
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  Los favoritos de la comunidad.
                </p>
              </div>
              <Link
                href="/productos"
                className="hidden font-label-caps text-label-caps text-primary hover:underline md:inline-flex"
              >
                Ver todo →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-gutter md:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} tasaBcv={rates.tasa_bcv} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONCERNS */}
      {concerns.length > 0 && (
        <section className="mt-20 px-margin-mobile md:px-margin-desktop">
          <div className="mx-auto max-w-site">
            <h2 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
              Atiende tu Necesidad
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {concerns.map((concern) => (
                <li key={concern.id}>
                  <Link
                    href={`/productos?necesidad=${concern.slug}`}
                    className="flex h-32 flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md transition-all hover:border-primary hover:shadow-glow"
                  >
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="font-body-md text-body-md font-medium text-on-surface">
                      {concern.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FOOTER NOTE */}
      <footer className="mt-24 border-t border-outline-variant/30 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="mx-auto flex max-w-site flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <Logo size="sm" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Valencia, Venezuela ·{" "}
            <a
              href="https://wa.me/584244273062"
              className="text-primary underline-offset-2 hover:underline"
            >
              WhatsApp 0424-4273062
            </a>
            {" · "}
            <a
              href="https://instagram.com/sokobeauty_ve"
              className="text-primary underline-offset-2 hover:underline"
            >
              @sokobeauty_ve
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
