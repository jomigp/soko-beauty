/**
 * Home — placeholder until Sprint 2 ports the Stitch design.
 * Renders the brand identity so the foundation is verifiable on first run.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen px-margin-mobile md:px-margin-desktop">
      <section className="mx-auto max-w-site py-24 md:py-48">
        <p className="font-label-caps text-label-caps text-primary">
          Soko Beauty · Glass Skin Awaits
        </p>
        <h1 className="mt-6 font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
          Skincare coreano, glass skin incluido.
        </h1>
        <p className="mt-8 max-w-prose font-body-lg text-on-surface-variant">
          Tienda en línea de K-beauty en Valencia, Venezuela. Pide por
          WhatsApp, paga en USD o bolívares, recibe donde estés.
        </p>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <a
            href="/productos"
            className="inline-flex h-12 items-center justify-center rounded-md bg-soko-cta px-8 font-label-caps text-label-caps text-on-primary transition-shadow duration-200 ease-out-quart glow-shadow"
          >
            Ver Catálogo
          </a>
          <a
            href="/carrito"
            className="inline-flex h-12 items-center justify-center rounded-md border border-outline-variant bg-transparent px-8 font-label-caps text-label-caps text-on-surface"
          >
            Mi Carrito
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-site border-t border-outline-variant py-12">
        <p className="font-body-sm text-on-surface-variant">
          Soko Beauty — Valencia, Venezuela ·{" "}
          <a
            href="https://wa.me/584244273062"
            className="text-primary underline-offset-2 hover:underline"
          >
            WhatsApp 0424-4273062
          </a>
        </p>
      </section>
    </main>
  );
}
