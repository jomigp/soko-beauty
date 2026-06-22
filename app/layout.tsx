import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { getRates } from "@/lib/rates";
import { WhatsAppButton } from "@/components/WhatsAppButton";

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
    "Skincare coreano (K-beauty) en Valencia, Venezuela. Pide por WhatsApp, paga en USD o bolívares, recibe donde estés.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://soko-beauty.ve"
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch rates on the server so the client can use them in the cart.
  // If the API is down, we still render — the cart falls back to defaults.
  const ratesResult = await getRates();
  const tasaBcv = ratesResult.rates.tasa_bcv;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584244273062";

  return (
    <html lang="es" className={`${bodoni.variable} ${geist.variable}`}>
      <body className="min-h-screen bg-background text-on-background antialiased">
        <CartProvider>
          <TopBar />
          {children}
          <CartDrawer tasaBcv={tasaBcv} />
          <BottomNav />
          <WhatsAppButton phone={whatsapp} variant="floating" />
        </CartProvider>
      </body>
    </html>
  );
}
