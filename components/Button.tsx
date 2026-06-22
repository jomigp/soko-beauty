import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * cn — utility to merge Tailwind class names safely.
 * (Same as shadcn/ui's helper; inlined to avoid a dependency on @/lib/utils.)
 */
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "full";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-soko-cta text-on-primary hover:shadow-glow active:scale-[0.98] disabled:opacity-50",
  secondary:
    "bg-transparent text-on-surface border border-outline-variant hover:border-primary hover:text-primary active:scale-[0.98] disabled:opacity-50",
  ghost:
    "bg-transparent text-on-surface hover:bg-surface-container-low active:scale-[0.98] disabled:opacity-50",
  destructive:
    "bg-error text-on-error hover:opacity-90 active:scale-[0.98] disabled:opacity-50",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-4 text-label-caps",
  md: "h-11 px-6 text-label-caps",
  lg: "h-12 px-8 text-body-sm",
  full: "h-12 w-full px-6 text-body-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  className,
  children,
  fullWidth,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-label-caps text-label-caps transition-all duration-200 ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

export { cn };
