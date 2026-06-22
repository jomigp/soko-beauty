-- ============================================================
-- Soko Beauty — Supabase schema (MVP)
-- --------------------------------------------------------
-- Run this in the Supabase SQL editor on a fresh project.
-- Mirrors the shapes in lib/database.types.ts.
-- ============================================================

-- ---------- ENUMS ----------
do $$ begin
  create type badge_kind as enum ('best_seller', 'new');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type category_type as enum ('routine_step', 'concern');
exception when duplicate_object then null;
end $$;

-- ---------- TABLES ----------
create table if not exists product (
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

create table if not exists category (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type category_type not null,
  sort_order integer not null default 0
);

create index category_type_idx on category (type, sort_order);

-- Single-row config table; we keep `id = 1` as a singleton.
create table if not exists store_setting (
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
  payment_methods jsonb not null default '[]',
  ai_provider text not null default 'gemini',
  ai_model text not null default 'gemini-3.5-flash'
);

-- Seed the singleton row with the example from the master document §5
insert into store_setting (
  tasa_bcv, tasa_usdt, whatsapp_number,
  local_delivery_cost_usd, payment_methods,
  ai_provider, ai_model
) values (
  612, 800, '584244273062', 0,
  '[
    {"key":"pago_movil","label":"Pago Móvil","currency":"VES","rate":"bcv","is_active":true},
    {"key":"transferencia","label":"Transferencia","currency":"VES","rate":"bcv","is_active":true},
    {"key":"zelle","label":"Zelle","currency":"USD","rate":"usdt","is_active":true},
    {"key":"usdt","label":"USDT (Binance)","currency":"USD","rate":"usdt","is_active":true},
    {"key":"efectivo_usd","label":"Efectivo USD","currency":"USD","rate":"usdt","is_active":true}
  ]'::jsonb,
  'gemini',
  'gemini-3.5-flash'
)
on conflict (id) do nothing;

-- ---------- ROW-LEVEL SECURITY ----------
alter table product enable row level security;
alter table category enable row level security;
alter table store_setting enable row level security;

-- Public read access (the site is a catalog)
do $$ begin
  create policy "product: public read" on product
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "category: public read" on category
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "store_setting: public read" on store_setting
    for select using (true);
exception when duplicate_object then null;
end $$;

-- Writes are only allowed via the service-role key (server-side / admin).
-- No anon write policies → the public client cannot modify data.

-- ---------- STORAGE ----------
-- Bucket: `product-images` (public read).
-- Upload only via service-role (admin panel).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

do $$ begin
  create policy "product-images: public read" on storage.objects
    for select using (bucket_id = 'product-images');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Migrations for existing databases (idempotent)
-- If you already ran an earlier version of this schema, these
-- statements add the new columns safely.
-- ============================================================

alter table store_setting
  add column if not exists ai_provider text not null default 'gemini',
  add column if not exists ai_model text not null default 'gemini-3.5-flash';

alter table store_setting
  alter column local_delivery_cost_usd set default 0;

-- ============================================================
-- Rate limit para /api/rutina/recomendar
-- 3 generaciones de rutina por cliente (IP hasheada) por día.
-- Sobrevive cold starts de Vercel serverless.
-- ============================================================

create table if not exists routine_query (
  ip_hash text not null,
  day date not null,
  count int not null default 0,
  last_at timestamptz not null default now(),
  primary key (ip_hash, day)
);

alter table routine_query enable row level security;

-- atomic increment + return new count
create or replace function increment_routine_query(
  p_ip_hash text,
  p_day date
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into routine_query (ip_hash, day, count, last_at)
    values (p_ip_hash, p_day, 1, now())
  on conflict (ip_hash, day) do update
    set count = routine_query.count + 1,
        last_at = now()
  returning count into new_count;
  return new_count;
end; $$;

grant execute on function increment_routine_query(text, date) to anon, authenticated;
