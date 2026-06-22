import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Truck, CreditCard, Package } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "Soporte · Soko Beauty",
  description: "Cómo pedir, pagar y recibir tu pedido en Soko Beauty.",
};

export default function SoportePage() {
  const whatsapp = "584244273062";
  return (
    <main className="bg-background px-margin-mobile md:px-margin-desktop">
      <div className="prose-body mx-auto max-w-3xl">
        <h1 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          ¿Cómo pedir?
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Hacer un pedido en Soko Beauty toma menos de 2 minutos.
        </p>

        <ol className="mt-8 space-y-6">
          <Step
            icon={<Package className="h-5 w-5" />}
            title="1. Explora el catálogo"
            description="Ve a Tienda, usa los filtros (paso de rutina, necesidad, piel) o busca por nombre/marca."
          />
          <Step
            icon={<MessageCircle className="h-5 w-5" />}
            title="2. Añade al carrito"
            description="Toca 'Añadir' en cualquier producto. Ajusta cantidades desde el ícono del carrito arriba a la derecha."
          />
          <Step
            icon={<Truck className="h-5 w-5" />}
            title="3. Elige entrega"
            description="Delivery Valencia (mismo día), retiro en tienda, o envío nacional (MRW/Zoom/Tealca)."
          />
          <Step
            icon={<CreditCard className="h-5 w-5" />}
            title="4. Elige método de pago"
            description="Pago Móvil, Transferencia, Zelle, USDT o efectivo. El precio se recalcula en vivo según la tasa del día."
          />
          <Step
            icon={<MessageCircle className="h-5 w-5" />}
            title="5. Envía por WhatsApp"
            description="Al confirmar, se abre WhatsApp con tu pedido pre-armado. Te respondemos para coordinar el pago y la entrega."
          />
        </ol>

        <div className="mt-12 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">
            ¿Dudas? Escríbenos directo
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface">
            Estamos disponibles de lunes a sábado, 9am a 7pm.
          </p>
          <div className="mt-4">
            <WhatsAppButton
              phone={whatsapp}
              label="Abrir WhatsApp"
              variant="inline"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link
            href="/terminos"
            className="rounded-md border border-outline-variant/30 p-md transition-colors hover:border-primary"
          >
            <h3 className="font-label-caps text-label-caps text-on-surface">
              Términos y Condiciones
            </h3>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Lee las reglas de uso de la tienda.
            </p>
          </Link>
          <Link
            href="/privacidad"
            className="rounded-md border border-outline-variant/30 p-md transition-colors hover:border-primary"
          >
            <h3 className="font-label-caps text-label-caps text-on-surface">
              Política de Privacidad
            </h3>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Cómo manejamos tus datos.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

function Step({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
        {icon}
      </span>
      <div>
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">
          {title}
        </h3>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {description}
        </p>
      </div>
    </li>
  );
}
