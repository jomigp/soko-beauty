/**
 * components/Logo.tsx — Wordmark logo for Soko Beauty.
 *
 * SVG that mirrors the brand profile image: Bodoni Moda wordmark with
 * the Luminous Core gradient (fuchsia → coral) and a small accent dot.
 * Used in the header, footer, and the brand profile.
 *
 * Sizing options:
 *   - size="sm"  (28px)  — admin chips, compact contexts
 *   - size="md"  (40px)  — desktop header
 *   - size="lg"  (56px)  — hero contexts
 *   - height=N   — explicit pixel override (takes precedence over size)
 */

import { clsx } from "clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  height?: number;
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: { fontSize: 20, height: 28 },
  md: { fontSize: 30, height: 40 },
  lg: { fontSize: 42, height: 56 },
} as const;

export function Logo({
  size = "md",
  height,
  showTagline = false,
  className,
}: LogoProps) {
  const { fontSize, height: defaultHeight } = SIZES[size];
  const finalHeight = height ?? defaultHeight;
  // Scale the viewBox proportionally to the font size
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
          Soko Beauty
        </text>
        <circle
          cx={viewBoxWidth - 10}
          cy={fontSize * 0.18}
          r={fontSize * 0.085}
          fill="#ff00cc"
          opacity={0.7}
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
