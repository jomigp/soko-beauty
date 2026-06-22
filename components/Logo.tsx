/**
 * components/Logo.tsx — Wordmark for Soko Beauty.
 *
 * "SOKO" en mayúsculas, "Beauty" en cursiva. Un solo color de marca
 * (sin gradiente, sin punto decorativo). Tipografía Bodoni Moda —
 * serif de alto contraste, elegante.
 *
 * Por qué sin gradiente: el skill impeccable prohíbe gradient text
 * ("Decorative, never meaningful. Use a single solid color").
 * Por qué sin punto: el usuario lo pidió explícitamente.
 *
 * Uso:
 *   <Logo size="md" />      // header (default)
 *   <Logo size="sm" />      // compact (drawer, footer)
 *   <Logo size="lg" />      // hero / loading
 */

import { clsx } from "clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** "light" usa el color sobre fondos oscuros. "dark" sobre claros. */
  tone?: "light" | "dark";
}

const SIZES = {
  sm: { sokoPx: 22, beautyPx: 20, height: 32 },
  md: { sokoPx: 36, beautyPx: 32, height: 48 },
  lg: { sokoPx: 56, beautyPx: 48, height: 72 },
  xl: { sokoPx: 88, beautyPx: 76, height: 112 },
} as const;

const COLORS = {
  dark: "#ad0089",  // brand primary, on light backgrounds
  light: "#ffd8ec", // primary-fixed, on dark backgrounds
} as const;

const FONT_STACK =
  "var(--font-bodoni), 'Bodoni Moda', 'Playfair Display', Georgia, serif";

export function Logo({ size = "md", className, tone = "dark" }: LogoProps) {
  const { sokoPx, beautyPx, height } = SIZES[size];
  const color = COLORS[tone];

  return (
    <span
      className={clsx("inline-flex items-baseline leading-none", className)}
      style={{ height }}
      aria-label="Soko Beauty"
    >
      <span
        style={{
          fontFamily: FONT_STACK,
          color,
          fontStyle: "normal",
          fontWeight: 800,
          fontSize: sokoPx,
          letterSpacing: "-0.025em",
          lineHeight: 1,
          // Optical adjustment: caps in Bodoni sit on the baseline
          // cleanly, so we keep them aligned to it.
          paddingBottom: sokoPx * 0.08,
        }}
      >
        SOKO
      </span>
      <span
        style={{
          fontFamily: FONT_STACK,
          color,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: beautyPx,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginLeft: sokoPx * 0.22,
          paddingBottom: sokoPx * 0.08,
        }}
      >
        Beauty
      </span>
    </span>
  );
}
