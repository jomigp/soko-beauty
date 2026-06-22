/**
 * components/Logo.tsx — Wordmark logo for Soko Beauty.
 *
 * "SOKO" en mayúsculas + "Beauty" en case normal, con un punto
 * fucsia como acento. Mismo gradiente Luminous Core.
 */

import { clsx } from "clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  height?: number;
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: { fontSize: 20, height: 28, accentR: 2 },
  md: { fontSize: 30, height: 40, accentR: 3 },
  lg: { fontSize: 42, height: 56, accentR: 4.5 },
} as const;

export function Logo({
  size = "md",
  height,
  showTagline = false,
  className,
}: LogoProps) {
  const { fontSize, height: defaultHeight, accentR } = SIZES[size];
  const finalHeight = height ?? defaultHeight;
  const viewBoxWidth = 220 * (fontSize / 28);
  const viewBoxHeight = 60 * (fontSize / 28);

  return (
    <span
      className={clsx("inline-flex items-baseline gap-2", className)}
      aria-label="Soko Beauty"
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        height={finalHeight}
        role="img"
        aria-hidden="true"
        className="select-none"
      >
        <defs>
          <linearGradient id="soko-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff00cc" />
            <stop offset="100%" stopColor="#ff66b2" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y={fontSize * 0.85}
          fontFamily='"Bodoni Moda", serif'
          fontSize={fontSize}
          fontWeight={700}
          fill="url(#soko-gradient)"
          letterSpacing="-0.5"
        >
          <tspan fontWeight={800}>SOKO</tspan>
          <tspan dx="6" fontWeight={500} fontStyle="italic">Beauty</tspan>
        </text>
        <circle
          cx={viewBoxWidth - 8}
          cy={fontSize * 0.15}
          r={accentR}
          fill="#ff00cc"
          opacity={0.8}
        />
      </svg>
      {showTagline && (
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          Glass Skin Awaits
        </span>
      )}
    </span>
  );
}
