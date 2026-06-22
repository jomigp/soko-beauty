"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, DollarSign, MessageCircle, TrendingUp, ArrowRight } from "lucide-react";
import { getActiveProducts, getStoreSetting } from "@/lib/supabase-queries";
import { getRates } from "@/lib/rates";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/Button";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalProducts: number;
    inStock: number;
    featured: number;
    whatsapp: string;
    tasaBcv: number;
    tasaUsdt: number;
    ratesUpdated: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [products, store, rates] = await Promise.all([
        getActiveProducts(),
        getStoreSetting(),
        getRates(),
      ]);
      setStats({
        totalProducts: products.length,
        inStock: products.filter((p) => p.in_stock).length,
        featured: products.filter((p) => p.is_featured).length,
        whatsapp: store?.whatsapp_number ?? "—",
        tasaBcv: rates.rates.tasa_bcv,
        tasaUsdt: rates.rates.tasa_usdt,
        ratesUpdated: rates.rates.updated_at ?? "",
      });
    })();
  }, []);

  if (!stats) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Cargando…</p>;
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-md text-headline-sm md:text-headline-md text-on-surface">
          Resumen
        </h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Vista general de la tienda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-md md:grid-cols-4">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Productos activos"
          value={stats.totalProducts.toString()}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Destacados"
          value={stats.featured.toString()}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Tasa BCV"
          value={stats.tasaBcv.toFixed(2)}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Tasa paralelo"
          value={stats.tasaUsdt.toFixed(2)}
        />
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <h2 className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
          <MessageCircle className="h-4 w-4" />
          WhatsApp configurado
        </h2>
        <p className="mt-2 font-body-md text-body-md text-on-surface">
          {stats.whatsapp}
        </p>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          {formatMoney(parseFloat(stats.whatsapp || "0"), "USD")}{" "}
          <span className="text-on-surface-variant/60">
            (los pedidos llegan a este número)
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/admin/productos">
          <Button variant="primary" size="md" trailingIcon={<ArrowRight className="h-4 w-4" />}>
            Gestionar Productos
          </Button>
        </Link>
        <Link href="/admin/configuracion">
          <Button variant="secondary" size="md">
            Configuración de Tienda
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 font-label-caps text-label-caps text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">{value}</p>
    </div>
  );
}
