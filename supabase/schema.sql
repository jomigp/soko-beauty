-- ============================================================
-- Soko Beauty — Supabase schema (MVP)
-- --------------------------------------------------------
-- Run this in the Supabase SQL editor on a fresh project.
-- Mirrors the shapes in lib/database.types.ts.
-- ============================================================

-- ---------- ENUMS ----------
create type badge_kind as enum ('best_seller', 'new');
create type category_type as enum ('routine_step', 'concern');

-- ---------- TABLES ----------
create table product (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  description text,
  price_usd numeric(10, 2) not null check (price_usd >= 0),
  badge badge_kind,
  skin_concern text[] default '{}',
  skin_type text[] default '{}',
  routine_step text,
  key_ingredients jsonb default '[]',
  usage_steps jsonb default '[]',
  in_stock boolean not null default true,
  is_featured boolean not null default false,
  images text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_slug_idx on product (slug);
create index product_featured_idx on product (is_featured, sort_order);
create index product_routine_step_idx on product (routine_step);
create index product_in_stock_idx on product (in_stock);

create table category (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type category_type not null,
  sort_order integer not null default 0
);

create index category_type_idx on category (type, sort_order);

-- Single-row config table; we keep `id = 1` as a singleton.
create table store_setting (
  id integer primary key default 1 check (id = 1),
  tasa_bcv numeric(12, 4) not null check (tasa_bcv > 0),
  tasa_usdt numeric(12, 4) not null check (tasa_usdt > 0),
  rates_updated_at timestamptz not null default now(),
  whatsapp_number text not null,
  business_rif text,
  business_address text,
  local_delivery_cost_usd numeric(10, 2) not null default 0,
  store_pickup_note text,
  national_shipping_note text,
  payment_methods jsonb not null default '[]'
);

-- Seed the singleton row with the example from the master document §5
insert into store_setting (
  tasa_bcv, tasa_usdt, whatsapp_number,
  local_delivery_cost_usd, payment_methods
) values (
  612, 800, '584244273062', 3,
  '[
    {"key":"pago_movil","label":"Pago Móvil","currency":"VES","rate":"bcv","is_active":true},
    {"key":"transferencia","label":"Transferencia","currency":"VES","rate":"bcv","is_active":true},
    {"key":"zelle","label":"Zelle","currency":"USD","rate":"usdt","is_active":true},
    {"key":"usdt","label":"USDT (Binance)","currency":"USD","rate":"usdt","is_active":true},
    {"key":"efectivo_usd","label":"Efectivo USD","currency":"USD","rate":"usdt","is_active":true}
  ]'::jsonb
);

-- ---------- ROW-LEVEL SECURITY ----------
alter table product enable row level security;
alter table category enable row level security;
alter table store_setting enable row level security;

-- Public read access (the site is a catalog)
create policy "product: public read" on product
  for select using (true);

create policy "category: public read" on category
  for select using (true);

create policy "store_setting: public read" on store_setting
  for select using (true);

-- Writes are only allowed via the service-role key (server-side / admin).
-- No anon write policies → the public client cannot modify data.

-- ---------- STORAGE ----------
-- Bucket: `product-images` (public read).
-- Upload only via service-role (admin panel).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product-images: public read" on storage.objects
  for select using (bucket_id = 'product-images');
