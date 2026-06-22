-- ============================================================
-- Soko Beauty — TODO EN UNO (schema + seed + migraciones)
-- Corre esto UNA SOLA VEZ en Supabase → SQL Editor → Run
-- Idempotente: si ya corriste parte, no rompe nada.
-- ============================================================

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

-- ============================================================
-- Seed: 6 productos de ejemplo + 13 categorías
-- ============================================================

-- ============================================================
-- Soko Beauty — Seed de productos de ejemplo
-- --------------------------------------------------------
-- 6 productos + categorías (pasos de rutina + necesidades)
-- Precios en USD como REFERENCIA (precio BCV).
-- El cliente siempre paga a la tasa del momento en WhatsApp.
--
-- ⚠️  IMPORTANTE: estos precios son EJEMPLO. Ajusta en /admin
--     o reemplaza los valores en este SQL antes de correrlo.
-- ============================================================

-- 1) Categorías (pasos de rutina)
insert into category (slug, name, type, sort_order) values
  ('limpiador',       'Limpiador',        'routine_step', 1),
  ('tonico',          'Tónico',           'routine_step', 2),
  ('esencia',         'Esencia',          'routine_step', 3),
  ('serum',           'Sérum',            'routine_step', 4),
  ('hidratante',      'Hidratante',       'routine_step', 5),
  ('mascarilla',      'Mascarilla',       'routine_step', 6),
  ('protector-solar', 'Protector Solar',  'routine_step', 7)
on conflict (slug) do nothing;

-- 1b) Necesidades / concerns
insert into category (slug, name, type, sort_order) values
  ('hidratacion', 'Hidratación', 'concern', 1),
  ('calmante',    'Calmante',    'concern', 2),
  ('brillo',      'Control de Brillo', 'concern', 3),
  ('antiedad',    'Antiedad',    'concern', 4),
  ('acne',        'Acné',        'concern', 5),
  ('proteccion',  'Protección Solar', 'concern', 6)
on conflict (slug) do nothing;

-- 2) Productos
insert into product (
  slug, name, brand, description, price_usd, badge,
  skin_concern, routine_step, in_stock, is_featured,
  sort_order, images
) values
  (
    'celinox-retinal-shot-tightening-booster',
    'Retinal Shot Tightening Booster',
    'Celinox',
    'Sérum antiedad premium con Retinal 0,1% (vitamina A estabilizada), Matrixyl 3000 3% y Pantenol 1%. Para piel firme, luminosa y con menos líneas finas. Uso nocturno. 15 ml.',
    32.00, 'new',
    array['antiedad'],
    'serum',
    true, true, 1, array[]::text[]
  ),
  (
    'cosrx-low-ph-good-morning-gel-cleanser',
    'Low pH Good Morning Gel Cleanser',
    'COSRX',
    'Gel limpiador facial suave con pH bajo (~5) que respeta la barrera cutánea. Con extractos botánicos calmantes, no reseca. Ideal mañana y noche. 150 ml.',
    14.00, null,
    array['hidratacion','calmante'],
    'limpiador',
    true, true, 2, array[]::text[]
  ),
  (
    'beauty-of-joseon-matte-sun-stick-mugwort-camelia',
    'Matte Sun Stick: Mugwort + Camellia',
    'Beauty of Joseon',
    'Protector solar en barra SPF50+ PA++++ con acabado mate seco. Con artemisa (mugwort) y camelia, calma la piel mientras controla el brillo. Reaplicable sobre maquillaje. 19 g.',
    20.00, 'best_seller',
    array['brillo','calmante'],
    'protector-solar',
    true, true, 3, array[]::text[]
  ),
  (
    'beauty-of-joseon-relief-sun-rice-probiotics',
    'Relief Sun: Rice + Probiotics',
    'Beauty of Joseon',
    'Protector solar químico SPF50+ PA++++ con extracto de arroz y probióticos. Textura ligera, acabado luminoso natural, no deja residuos blancos. Hidrata mientras protege. 50 ml.',
    18.00, null,
    array['hidratacion','proteccion'],
    'protector-solar',
    true, true, 4, array[]::text[]
  ),
  (
    'skin1004-madagascar-centella-hyalu-cica-water-fit-sun-serum-twin-pack',
    'Madagascar Centella Hyalu-Cica Water-Fit Sun Serum (Twin Pack)',
    'SKIN1004',
    'Pack doble de sérum solar SPF50+ PA++++ con Centella asiática de Madagascar y ácido hialurónico. Acabado acuoso, super ligero, sin residuos. Ideal piel grasa/mixta. 50 ml × 2.',
    36.00, null,
    array['hidratacion','calmante','proteccion'],
    'protector-solar',
    true, true, 5, array[]::text[]
  ),
  (
    'tocobo-cotton-soft-sun-stick',
    'Cotton Soft Sun Stick',
    'TOCOBO',
    'Protector solar en barra SPF50 PA++++ con textura algodonada. Alta protección, acabado mate natural, no obstruye poros. Reaplicable fácil, viaja en el bolso. 19 g.',
    17.00, null,
    array['brillo','proteccion'],
    'protector-solar',
    true, false, 6, array[]::text[]
  )
on conflict (slug) do nothing;

-- 3) Verificar
select slug, name, brand, price_usd, in_stock, is_featured
from product
order by sort_order;
