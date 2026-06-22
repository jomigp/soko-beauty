"use client";

import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "./CartContext";
import { cn } from "./Button";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda" },
  { href: "/soporte", label: "Soporte" },
];

/**
 * TopBar — fixed sticky header. Glassmorphism on scroll. Mobile shows
 * a hamburger (Fase 2), desktop shows nav links.
 */
export function TopBar() {
  const { open, totalQty } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-nav-sticky h-16 border-b border-outline-variant/20 glass-panel"
      )}
    >
      <div className="mx-auto flex h-full max-w-site items-center justify-between px-margin-mobile md:px-margin-desktop">
        <button
          type="button"
          aria-label="Menú"
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary transition-transform active:scale-90 md:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <Link href="/" aria-label="Ir al inicio" className="md:ml-0">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Navegación" className="hidden md:block">
          <ul className="flex items-center gap-lg">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          onClick={open}
          aria-label={`Carrito (${totalQty} ${totalQty === 1 ? "producto" : "productos"})`}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-primary transition-transform active:scale-90"
        >
          <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          {totalQty > 0 && (
            <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-on-primary">
              {totalQty}
            </span>
          )}
        </button>
      </div>
      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          className="absolute left-0 right-0 top-16 border-b border-outline-variant/30 bg-surface-container-lowest shadow-md md:hidden"
          role="menu"
        >
          <ul className="flex flex-col px-margin-mobile py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 font-label-caps text-label-caps text-on-surface transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
