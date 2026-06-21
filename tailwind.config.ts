import type { Config } from "tailwindcss";

/**
 * Soko Beauty — Design System (from luminous_k_beauty_system/DESIGN.md)
 *
 * Hex values kept verbatim from the design for visual fidelity.
 * The OKLCH equivalents live in app/globals.css as CSS variables
 * (per impeccable skill: prefer OKLCH for any new color additions).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand
        primary: "#ad0089",
        "on-primary": "#ffffff",
        "primary-container": "#d800ac",
        "primary-fixed": "#ffd8ec",
        "primary-fixed-dim": "#ffaede",
        "inverse-primary": "#ffaede",
        "on-primary-fixed": "#3b002d",
        "on-primary-fixed-variant": "#87006b",
        "on-primary-container": "#fffbff",
        "surface-tint": "#b1008d",

        // Secondary
        secondary: "#4b52be",
        "on-secondary": "#ffffff",
        "secondary-container": "#868efd",
        "secondary-fixed": "#e0e0ff",
        "secondary-fixed-dim": "#bec2ff",
        "on-secondary-fixed": "#00016d",
        "on-secondary-fixed-variant": "#3138a4",
        "on-secondary-container": "#171d8f",

        // Tertiary (mint — "In stock" / discounts)
        tertiary: "#006a44",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#008657",
        "tertiary-fixed": "#75fbb8",
        "tertiary-fixed-dim": "#55de9e",
        "on-tertiary-fixed": "#002112",
        "on-tertiary-fixed-variant": "#005233",
        "on-tertiary-container": "#f6fff6",

        // Surfaces
        background: "#fdf9f6",
        "on-background": "#1c1b1a",
        surface: "#fdf9f6",
        "surface-dim": "#ddd9d6",
        "surface-bright": "#fdf9f6",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f7f3f0",
        "surface-container": "#f1edea",
        "surface-container-high": "#ebe7e5",
        "surface-container-highest": "#e5e2df",
        "surface-variant": "#e5e2df",
        "on-surface": "#1c1b1a",
        "on-surface-variant": "#583f4e",
        "inverse-surface": "#31302f",
        "inverse-on-surface": "#f4f0ed",

        // Borders
        outline: "#8c6f7f",
        "outline-variant": "#dfbdcf",

        // Status
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        base: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "48px",
        gutter: "16px",
        "margin-mobile": "20px",
        "margin-desktop": "80px",
      },
      fontFamily: {
        "display-lg": ["var(--font-bodoni)", "Bodoni Moda", "serif"],
        "headline-md": ["var(--font-bodoni)", "Bodoni Moda", "serif"],
        "headline-sm": ["var(--font-bodoni)", "Bodoni Moda", "serif"],
        "body-lg": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "body-md": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "body-sm": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "price-primary": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "price-reference": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
        "label-caps": ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": [
          "48px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-lg-mobile": [
          "36px",
          { lineHeight: "1.2", fontWeight: "700" },
        ],
        "headline-md": [
          "32px",
          { lineHeight: "1.2", fontWeight: "600" },
        ],
        "headline-sm": [
          "24px",
          { lineHeight: "1.3", fontWeight: "600" },
        ],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "price-primary": [
          "20px",
          { lineHeight: "1", letterSpacing: "0.02em", fontWeight: "600" },
        ],
        "price-reference": ["14px", { lineHeight: "1", fontWeight: "400" }],
        "label-caps": [
          "12px",
          { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "600" },
        ],
      },
      maxWidth: {
        site: "1440px",
        prose: "65ch",
      },
      boxShadow: {
        // The "Glow Effect" — tinted dispersion shadow
        glow: "0 4px 20px rgba(173, 0, 137, 0.15), 0 2px 4px rgba(0, 0, 0, 0.05)",
        "glow-lg":
          "0 8px 32px rgba(173, 0, 137, 0.18), 0 4px 8px rgba(0, 0, 0, 0.05)",
        "glow-active":
          "0 8px 24px rgba(173, 0, 137, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05)",
      },
      transitionTimingFunction: {
        // Per impeccable: ease-out exponential; no bounce
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      backgroundImage: {
        // The "Luminous Core" gradient — used sparingly per design system
        "soko-glow":
          "linear-gradient(135deg, #ff00cc 0%, #7a82f0 60%, #ff8a8a 100%)",
        "soko-cta": "linear-gradient(135deg, #ad0089 0%, #4b52be 100%)",
      },
      zIndex: {
        // Per impeccable: semantic scale, no arbitrary 9999
        nav: "30",
        "nav-sticky": "40",
        "drawer-backdrop": "50",
        drawer: "60",
        "modal-backdrop": "70",
        modal: "80",
        toast: "90",
        tooltip: "100",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
