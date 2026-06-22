/**
 * lib/database.types.ts — TypeScript shape of the Supabase schema.
 *
 * The canonical schema lives in supabase/schema.sql. These types are
 * hand-written to match it (small surface, easier to read than the
 * generated mess). Keep them in sync if you change the schema.
 *
 * Columns are optional in selects (Supabase returns nulls / undefined
 * for missing ones); required only on inserts.
 */

import type { Currency, RateKind } from "./types";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string | null;
  price_usd: number;
  badge: "best_seller" | "new" | null;
  skin_concern: string[] | null;
  skin_type: string[] | null;
  routine_step: string | null;
  key_ingredients:
    | { name: string; pct?: number; role?: string }[]
    | null;
  usage_steps: { title: string; detail: string }[] | null;
  in_stock: boolean;
  is_featured: boolean;
  images: string[];
  sort_order: number;
  created_at: string;
}

export type StoreSetting = {
  id: number;
  tasa_bcv: number;
  tasa_usdt: number;
  rates_updated_at: string;
  whatsapp_number: string;
  business_rif: string | null;
  business_address: string | null;
  local_delivery_cost_usd: number;
  store_pickup_note: string | null;
  national_shipping_note: string | null;
  payment_methods: PaymentMethodConfig[];
  ai_provider: "gemini" | "deepseek" | "openai";
  ai_model: string;
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  type: "routine_step" | "concern";
  sort_order: number;
}

export interface PaymentMethodConfig {
  key: string;
  label: string;
  currency: Currency;
  rate: RateKind;
  adjustment_pct?: number;
  is_active?: boolean;
}

type StoreSettingRow = {
  id: number;
  tasa_bcv: number;
  tasa_usdt: number;
  rates_updated_at: string;
  whatsapp_number: string;
  business_rif: string | null;
  business_address: string | null;
  local_delivery_cost_usd: number;
  store_pickup_note: string | null;
  national_shipping_note: string | null;
  payment_methods: PaymentMethodConfig[];
  ai_provider: "gemini" | "deepseek" | "openai";
  ai_model: string;
};

type StoreSettingInsert = Omit<StoreSettingRow, "id">;

type StoreSettingUpdate = Partial<{
  tasa_bcv: number;
  tasa_usdt: number;
  rates_updated_at: string;
  whatsapp_number: string;
  business_rif: string | null;
  business_address: string | null;
  local_delivery_cost_usd: number;
  store_pickup_note: string | null;
  national_shipping_note: string | null;
  payment_methods: PaymentMethodConfig[];
  ai_provider: "gemini" | "deepseek" | "openai";
  ai_model: string;
}>;

export interface Database {
  public: {
    Tables: {
      product: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Product>;
      };
      category: {
        Row: Category;
        Insert: Omit<Category, "id"> & { id?: string };
        Update: Partial<Category>;
      };
      store_setting: {
        Row: StoreSettingRow;
        Insert: StoreSettingInsert;
        Update: StoreSettingUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_routine_query: {
        Args: { p_ip_hash: string; p_day: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
}
