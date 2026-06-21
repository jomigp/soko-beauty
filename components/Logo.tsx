/**
 * components/Logo.tsx — Wordmark logo for Soko Beauty.
 *
 * SVG that mirrors the brand profile image: Bodoni Moda wordmark with
 * the Luminous Core gradient (fuchsia → coral) and a small accent dot.
 * Used in the header, footer, and the brand profile.
 */

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: { fontSize: 20, height: 28 },
  md: { fontSize: 28, height: 36 },
  lg: { fontSize: 40, height: 52 },
} as const;

export function Logo({ size = "md", showTagline = false, className = "" }: LogoProps) {
  const { fontSize, height } = SIZES[size];
  return (
    <span
      className={`inline-flex items-baseline gap-2 ${className}`}
      aria-label="Soko Beauty"
    >
      <svg
        viewBox="0 0 220 60"
        height={height}
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
          y={fontSize}
          fontFamily='"Bodoni Moda", serif'
          fontSize={fontSize}
          fontWeight={700}
          fill="url(#soko-gradient)"
          letterSpacing="-0.5"
        >
          Soko Beauty
        </text>
        <circle cx={fontSize * 4.6} cy={fontSize * 0.32} r={fontSize * 0.09} fill="#ff00cc" opacity={0.7} />
      </svg>
      {showTagline && (
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          Glass Skin Awaits
        </span>
      )}
    </span>
  );
}
