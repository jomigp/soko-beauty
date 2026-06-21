import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soko Beauty | Glass Skin Awaits",
  description:
    "Skincare coreano (K-beauty) en Valencia, Venezuela. Envíos a todo el país. Pago en USD o bolívares.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sokobeauty.ve"
  ),
  openGraph: {
    title: "Soko Beauty | Glass Skin Awaits",
    description:
      "Skincare coreano premium en Valencia, Venezuela. Pide por WhatsApp.",
    type: "website",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soko Beauty | Glass Skin Awaits",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf9f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${bodoni.variable} ${geist.variable}`}>
      <body className="min-h-screen bg-background text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
