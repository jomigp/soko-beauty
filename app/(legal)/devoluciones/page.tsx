import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Devoluciones · Soko Beauty",
  description: "Política de devoluciones de Soko Beauty.",
};

export default function DevolucionesPage() {
  return (
    <main className="min-h-screen bg-background px-margin-mobile pb-32 pt-20 md:px-margin-desktop md:pb-24">
      <article className="prose-body mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-label-caps text-label-caps text-primary hover:underline"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          Devoluciones
        </h1>
        <section className="mt-8 space-y-6 font-body-md text-body-md text-on-surface-variant">
          <p>
            Queremos que quedes feliz con tu pedido. Si algo no salió bien,
            escríbenos por WhatsApp y lo resolvemos.
          </p>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              Aceptamos devolución si:
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>El producto llegó dañado.</li>
              <li>
                Recibiste un producto equivocado al que pediste.
              </li>
              <li>
                El producto tiene un defecto de fábrica verifiable.
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              No aceptamos devolución si:
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>El producto fue abierto o usado.</li>
              <li>Pasaron más de 7 días desde la entrega.</li>
              <li>Es un cambio de opinión o de tonalidad.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              Cómo proceder:
            </h2>
            <ol className="mt-2 list-decimal space-y-2 pl-6">
              <li>
                Escríbenos por WhatsApp al{" "}
                <a
                  href="https://wa.me/584244273062"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  0424-4273062
                </a>{" "}
                con tu número de pedido y una foto del problema.
              </li>
              <li>
                Te respondemos en menos de 24 horas con la solución
                (cambio, nota de crédito o reembolso).
              </li>
              <li>
                Si es cambio, recogemos el producto en tu dirección sin costo.
              </li>
            </ol>
          </div>
        </section>
      </article>
    </main>
  );
}
