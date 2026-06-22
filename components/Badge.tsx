import { cn } from "./Button";

type BadgeKind = "best_seller" | "new" | "in_stock" | "out_of_stock";

const BADGE_STYLES: Record<BadgeKind, { label: string; className: string }> = {
  best_seller: {
    label: "BEST SELLER",
    className:
      "bg-surface/80 backdrop-blur-sm text-primary border border-outline-variant/30",
  },
  new: {
    label: "NUEVO",
    className:
      "bg-primary-fixed text-on-primary-fixed border border-transparent",
  },
  in_stock: {
    label: "EN STOCK",
    className:
      "bg-tertiary-fixed/40 text-tertiary-container border border-transparent",
  },
  out_of_stock: {
    label: "AGOTADO",
    className: "bg-surface-container-high text-on-surface-variant border border-outline-variant",
  },
};

export function Badge({
  kind,
  className,
}: {
  kind: BadgeKind;
  className?: string;
}) {
  const { label, className: style } = BADGE_STYLES[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 font-label-caps text-label-caps",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
