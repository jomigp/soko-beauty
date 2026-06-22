"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";

function EnviadoInner() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (url && !autoOpened) {
      // Open the WhatsApp URL in a new tab and mark as auto-opened
      window.open(url, "_blank", "noopener,noreferrer");
      setAutoOpened(true);
    }
  }, [url, autoOpened]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-margin-mobile">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-tertiary-fixed/40 text-tertiary-container">
          <Check className="h-12 w-12" aria-hidden="true" />
        </div>
        <h1 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          ¡Pedido Enviado!
        </h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          Tu pedido se acaba de enviar a nuestro WhatsApp. Te responderemos
          en breve para confirmar el pago y coordinar la entrega.
        </p>
        {url && (
          <div className="mt-8">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leadingIcon={<MessageCircle className="h-5 w-5" />}
                trailingIcon={<ArrowRight className="h-4 w-4" />}
              >
                Abrir WhatsApp
              </Button>
            </a>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              ¿No se abrió? Toca el botón otra vez.
            </p>
          </div>
        )}
        <div className="mt-8">
          <Link
            href="/productos"
            className="font-label-caps text-label-caps text-primary hover:underline"
          >
            Seguir Comprando →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function EnviadoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Cargando…
          </p>
        </main>
      }
    >
      <EnviadoInner />
    </Suspense>
  );
}
