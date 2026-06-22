import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import { DualPrice } from "./DualPrice";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { cn } from "./Button";
import type { Product } from "@/lib/database.types";

interface ProductCardProps {
  product: Product;
  tasaBcv: number;
  onQuickAdd?: (product: Product) => void;
  className?: string;
}

/**
 * ProductCard — centerpiece of the UI.
 * Mirrors the design: white card, badge top-left, image, brand label,
 * name, dual price, quick-add button. Hover = "Glow" effect.
 */
export function ProductCard({
  product,
  tasaBcv,
  onQuickAdd,
  className,
}: ProductCardProps) {
  const inStock = product.in_stock;
  const cover = product.images?.[0] ?? "/images/placeholder.png";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest transition-all duration-300 ease-out-quart hover:shadow-glow",
        !inStock && "opacity-60",
        className
      )}
    >
      <Link
        href={`/productos/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-container-low p-sm"
        aria-label={`Ver ${product.name}`}
      >
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.badge === "best_seller" && <Badge kind="best_seller" />}
          {product.badge === "new" && <Badge kind="new" />}
        </div>
        {!inStock && (
          <div className="absolute right-2 top-2 z-10">
            <Badge kind="out_of_stock" />
          </div>
        )}
        <Image
          src={cover}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain transition-transform duration-500 ease-out-quart group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-sm">
        <span className="mb-1 font-label-caps text-label-caps text-on-surface-variant">
          {product.brand}
        </span>
        <h3 className="mb-2 line-clamp-2 font-body-md text-body-md font-medium leading-tight text-on-surface">
          <Link href={`/productos/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="mt-auto">
          <DualPrice priceUsd={product.price_usd} tasaBcv={tasaBcv} className="mb-2" />
          {inStock ? (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                onQuickAdd?.(product);
              }}
              leadingIcon={<Plus className="h-4 w-4" />}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              Añadir
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              disabled
              leadingIcon={<ShoppingCart className="h-4 w-4" />}
            >
              Agotado
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
