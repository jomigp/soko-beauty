"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Sparkles, HelpCircle, ShoppingCart } from "lucide-react";
import { cn } from "./Button";
import { useCart } from "./CartContext";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  disabled?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/productos", label: "Tienda", icon: ShoppingBag },
  { href: "/rutina", label: "Rutina", icon: Sparkles },
  { href: "/carrito", label: "Carrito", icon: ShoppingCart },
  { href: "/soporte", label: "Soporte", icon: HelpCircle },
];

/**
 * BottomNav — mobile-only sticky bottom navigation.
 * 5 tabs: Inicio, Tienda, Rutina (Fase 2), Carrito, Soporte.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-nav-sticky border-t border-outline-variant/30 glass-panel pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                aria-current={active ? "page" : undefined}
                onClick={(e) => item.disabled && e.preventDefault()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-3 font-label-caps text-label-caps transition-colors",
                  active ? "text-primary" : "text-on-surface-variant",
                  item.disabled && "cursor-not-allowed opacity-40"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
                {item.href === "/carrito" && cartCount > 0 && (
                  <span
                    aria-label={`${cartCount} ${cartCount === 1 ? "producto" : "productos"} en el carrito`}
                    className="absolute right-3 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-on-primary"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
