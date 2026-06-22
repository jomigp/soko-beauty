import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Soko Beauty",
  description: "Términos y condiciones de uso de la tienda Soko Beauty.",
};

export default function TerminosPage() {
  return (
    <main className="bg-background px-margin-mobile md:px-margin-desktop">
      <article className="prose-body mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-label-caps text-label-caps text-primary hover:underline"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          Términos y Condiciones
        </h1>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          Última actualización: junio 2026
        </p>
        <section className="mt-8 space-y-6 font-body-md text-body-md text-on-surface-variant">
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              1. Aceptación
            </h2>
            <p className="mt-2">
              Al usar soko-beauty-sigma.vercel.app aceptas estos términos. Si no estás de
              acuerdo, no uses el sitio.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              2. Productos y precios
            </h2>
            <p className="mt-2">
              Todos los precios están en USD (dólares estadounidenses) como
              referencia. El pago se coordina por WhatsApp en USD o bolívares a
              la tasa vigente al momento del pedido. Las tasas mostradas se
              actualizan automáticamente desde calcu.arepatecnologica.com y
              pueden variar al momento del pago final.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              3. Pedidos
            </h2>
            <p className="mt-2">
              Los pedidos se confirman únicamente por WhatsApp. No procesamos
              pagos en línea. La tienda se reserva el derecho de cancelar
              pedidos por falta de stock, error en el precio o sospecha de
              fraude.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              4. Envíos
            </h2>
            <p className="mt-2">
              Hacemos delivery en el área metropolitana de Valencia y envíos
              nacionales via MRW / Zoom / Tealca. El costo del envío nacional
              se cotiza por WhatsApp tras confirmar la dirección.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              5. Devoluciones
            </h2>
            <p className="mt-2">
              Aceptamos devoluciones por producto dañado o defectuoso dentro
              de los 7 días siguientes a la entrega. El producto debe estar
              sin abrir y en su empaque original. No se aceptan devoluciones
              por cambio de opinión.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              6. Propiedad intelectual
            </h2>
            <p className="mt-2">
              Las marcas y nombres de productos son propiedad de sus
              respectivos dueños. El contenido del sitio (textos, fotos,
              código) es de Soko Beauty.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              7. Contacto
            </h2>
            <p className="mt-2">
              WhatsApp{" "}
              <a
                href="https://wa.me/584244273062"
                className="text-primary underline-offset-2 hover:underline"
              >
                0424-4273062
              </a>{" "}
              · Instagram{" "}
              <a
                href="https://instagram.com/sokobeauty_ve"
                className="text-primary underline-offset-2 hover:underline"
              >
                @sokobeauty_ve
              </a>
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
