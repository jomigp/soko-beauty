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
