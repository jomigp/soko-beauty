import type { ReactNode } from "react";
import { cn } from "./Button";

interface GlowChipProps {
  children: ReactNode;
  active?: boolean;
  variant?: "default" | "primary" | "tertiary" | "outline";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}

const VARIANT_STYLES = {
  default:
    "bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary",
  primary:
    "bg-primary-fixed/30 text-primary border border-transparent",
  tertiary:
    "bg-tertiary-fixed/30 text-tertiary-container border border-transparent",
  outline:
    "bg-transparent text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary",
} as const;

/**
 * GlowChip — pill-shaped chip with a faint gradient background at low opacity.
 * Used for category filters and badges.
 */
export function GlowChip({
  children,
  active = false,
  variant = "default",
  onClick,
  type = "button",
  className,
  ariaLabel,
}: GlowChipProps) {
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 font-body-sm text-body-sm transition-colors";
  const variantStyle = active ? VARIANT_STYLES.primary : VARIANT_STYLES[variant];
  if (onClick) {
    return (
      <button
        type={type}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={cn(baseStyles, variantStyle, className)}
      >
        {children}
      </button>
    );
  }
  return <span className={cn(baseStyles, variantStyle, className)}>{children}</span>;
}
