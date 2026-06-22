import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad · Soko Beauty",
  description: "Cómo Soko Beauty maneja tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-background px-margin-mobile md:px-margin-desktop">
      <article className="prose-body mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-label-caps text-label-caps text-primary hover:underline"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          Política de Privacidad
        </h1>
        <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
          Última actualización: junio 2026
        </p>
        <section className="mt-8 space-y-6 font-body-md text-body-md text-on-surface-variant">
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              1. Datos que recopilamos
            </h2>
            <p className="mt-2">
              Cuando haces un pedido, recopilamos: tu nombre, número de
              WhatsApp, dirección de envío (si aplica), y el detalle de tu
              pedido. Estos datos llegan a nuestro WhatsApp como un mensaje y
              NO se guardan en nuestra base de datos de clientes (v1).
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              2. Cookies y almacenamiento local
            </h2>
            <p className="mt-2">
              Guardamos el contenido de tu carrito en el almacenamiento local
              de tu navegador (localStorage) para que no se pierda si recargas
              la página. No usamos cookies de seguimiento, ni píxeles de
              Facebook/Google, ni analytics de terceros.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              3. Pagos
            </h2>
            <p className="mt-2">
              No procesamos pagos en línea. Toda transacción ocurre dentro de
              WhatsApp, fuera de este sitio. No guardamos datos de tarjetas,
              cuentas bancarias ni billeteras digitales.
            </p>
          </div>
          <div>
            <h2 className="font-label-caps text-label-caps text-on-surface">
              4. Tus derechos
            </h2>
            <p className="mt-2">
              Puedes pedirnos en cualquier momento que eliminemos tus datos de
              nuestras conversaciones de WhatsApp y registros internos.
              Escríbenos a{" "}
              <a
                href="https://wa.me/584244273062"
                className="text-primary underline-offset-2 hover:underline"
              >
                0424-4273062
              </a>
              .
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
