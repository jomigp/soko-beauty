import type { MetadataRoute } from "next";
import { getActiveProducts, getCategories } from "@/lib/supabase-queries";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sokobeauty.ve";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/soporte`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/devoluciones`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/productos/${p.slug}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  // category filter URLs
  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((c) => [
    {
      url: `${SITE}/productos?paso=${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE}/productos?necesidad=${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ]);
  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
