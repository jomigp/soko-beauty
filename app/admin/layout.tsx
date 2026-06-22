"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Package, Settings, LayoutDashboard, ArrowLeft } from "lucide-react";
import { cn } from "@/components/Button";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLogin) {
      setLoading(false);
      return;
    }
    // Lightweight check: try to fetch the store setting (server will 401 if no session)
    fetch("/api/admin/me")
      .then((r) => {
        if (r.status === 401) router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Verificando sesión…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-nav-sticky border-b border-outline-variant/30 glass-panel">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Ver Tienda
            </Link>
            <span className="font-label-caps text-label-caps text-primary">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              router.push("/admin/login");
            }}
            className="inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-site flex-col gap-lg px-margin-mobile py-lg md:flex-row md:px-margin-desktop">
        <nav aria-label="Admin" className="md:w-56">
          <ul className="flex gap-2 overflow-x-auto md:flex-col">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 font-label-caps text-label-caps transition-colors",
                      active
                        ? "bg-primary-fixed/30 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
