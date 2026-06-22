import Link from "next/link";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-margin-mobile">
      <div className="max-w-md text-center">
        <p className="font-display-lg text-display-lg-mobile text-primary">
          404
        </p>
        <h1 className="mt-2 font-headline-sm text-headline-sm text-on-surface">
          No encontramos esa página
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Es posible que el producto se haya agotado o que el enlace esté
          mal escrito.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md">
              Ir al Inicio
            </Button>
          </Link>
          <Link href="/productos">
            <Button variant="secondary" size="md">
              Ver Catálogo
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
