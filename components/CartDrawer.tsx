"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "./CartContext";
import { DualPrice } from "./DualPrice";
import { Button } from "./Button";
import { cn } from "./Button";

interface CartDrawerProps {
  tasaBcv: number;
}

/**
 * CartDrawer — slide-in drawer (right side) showing the current cart.
 * Glassmorphism backdrop. Closes on backdrop click and Escape key.
 */
export function CartDrawer({ tasaBcv }: CartDrawerProps) {
  const { items, isOpen, close, setQty, remove, subtotalUsd } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-drawer-backdrop transition-opacity duration-200",
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      )}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar carrito"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-outline-variant/30 bg-surface-container-lowest shadow-xl transition-transform duration-300 ease-out-quart",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-outline-variant/30 px-margin-mobile py-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Tu Carrito
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
              <ShoppingBag className="h-10 w-10" aria-hidden="true" />
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Tu carrito está vacío
            </p>
            <Button variant="secondary" onClick={close}>
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-margin-mobile py-4">
              {items.map((item) => (
                <li
                  key={item.product_id}
                  className="flex gap-3 border-b border-outline-variant/20 py-3 last:border-b-0"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-surface-container-low">
                    <Image
                      src={item.image ?? "/images/placeholder.png"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      {item.brand}
                    </span>
                    <Link
                      href={`/productos/${item.slug ?? ""}`}
                      className="line-clamp-1 font-body-md text-body-md font-medium text-on-surface"
                      onClick={close}
                    >
                      {item.name}
                    </Link>
                    <div className="mt-1">
                      <DualPrice
                        priceUsd={item.unit_price_usd * item.qty}
                        tasaBcv={tasaBcv}
                        size="sm"
                      />
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-outline-variant">
                        <button
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() => setQty(item.product_id, item.qty - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          aria-label={`Cantidad: ${item.qty}`}
                          className="min-w-8 px-2 text-center font-body-sm text-body-sm text-on-surface"
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar cantidad"
                          onClick={() => setQty(item.product_id, item.qty + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-on-surface"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.name}`}
                        onClick={() => remove(item.product_id)}
                        className="inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-outline-variant/30 px-margin-mobile py-4">
              <div className="mb-3 flex justify-between font-body-md text-body-md text-on-surface">
                <span>Subtotal (precio BCV)</span>
                <span className="font-price-primary text-price-primary text-primary">
                  ${subtotalUsd.toFixed(2)}
                </span>
              </div>
              <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
                El envío y el método de pago se confirman en el siguiente paso.
              </p>
              <Link href="/carrito" onClick={close}>
                <Button variant="primary" size="lg" fullWidth>
                  Ir al Checkout
                </Button>
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
