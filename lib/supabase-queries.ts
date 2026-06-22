/**
 * lib/supabase-queries.ts — server-side data fetchers for the public site.
 *
 * These run in Server Components (read-only). Uses the anon client because
 * all public reads go through the "for select" RLS policies.
 */

import { supabaseBrowser } from "./supabase";
import type { Category, Product, StoreSetting } from "./database.types";

/* ============================================================
   Store setting (singleton)
   ============================================================ */

export async function getStoreSetting(): Promise<StoreSetting | null> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("store_setting")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("[getStoreSetting]", error);
    return null;
  }
  return data;
}

/* ============================================================
   Products
   ============================================================ */

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("in_stock", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getActiveProducts]", error);
    return [];
  }
  return data ?? [];
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("in_stock", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[getFeaturedProducts]", error);
    return [];
  }
  return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[getProductBySlug]", error);
    return null;
  }
  return data;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const supabase = supabaseBrowser();
  let query = supabase
    .from("product")
    .select("*")
    .eq("in_stock", true)
    .neq("id", product.id)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (product.routine_step) {
    query = query.eq("routine_step", product.routine_step);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[getRelatedProducts]", error);
    return [];
  }
  return data ?? [];
}

/* ============================================================
   Categories
   ============================================================ */

export async function getCategories(): Promise<Category[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("category")
    .select("*")
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[getCategories]", error);
    return [];
  }
  return data ?? [];
}
