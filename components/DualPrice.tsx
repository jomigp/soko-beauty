import { formatMoney } from "@/lib/money";
import { cn } from "./Button";

interface DualPriceProps {
  priceUsd: number;
  tasaBcv: number;
  /** Optional: highlight when there's a meaningful savings to show. */
  emphasizeUsd?: boolean;
  /** Optional: size variant. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * DualPrice — the mandatory dual-scale price display (USD primary, Bs reference).
 * Mirrors the design's "Dual-Price Badge" component.
 */
export function DualPrice({
  priceUsd,
  tasaBcv,
  emphasizeUsd = true,
  size = "md",
  className,
}: DualPriceProps) {
  const valorBs = priceUsd * tasaBcv;
  const usdSize =
    size === "lg"
      ? "text-[24px] leading-[1] tracking-[0.02em] font-semibold"
      : size === "sm"
        ? "text-body-md leading-[1] tracking-[0.02em] font-semibold"
        : "text-price-primary"; // 20px
  const bsSize =
    size === "lg"
      ? "text-body-md"
      : size === "sm"
        ? "text-[12px]"
        : "text-price-reference"; // 14px

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-price-primary",
          usdSize,
          emphasizeUsd ? "text-primary" : "text-on-surface"
        )}
      >
        {formatMoney(priceUsd, "USD")}
      </span>
      <span
        className={cn("font-price-reference text-outline", bsSize)}
        aria-label="Precio de referencia en bolívares"
      >
        Bs {formatMoney(valorBs, "VES", { int: false })}
      </span>
    </div>
  );
}
