# 🚀 Setup de Supabase para Soko Beauty

Guía paso a paso para crear la base de datos y conectarla al proyecto.
Tiempo estimado: **10–15 minutos**.

---

## 1. Crear cuenta y proyecto

1. Ve a https://supabase.com y crea una cuenta (o inicia sesión con GitHub — más rápido).
2. Click en **"New Project"**.
3. Rellena:
   - **Name:** `soko-beauty`
   - **Database Password:** genera una fuerte y **guárdala en un password manager** (no la vas a necesitar a menudo, pero si la pierdes hay que resetear).
   - **Region:** `South America (São Paulo)` ← la más cercana a Venezuela, igual que la región de Vercel.
   - **Plan:** Free (suficiente para MVP; si llegas a 500 MB de imágenes o 2 GB de tráfico, subes a Pro).
4. Click **"Create new project"**. Tarda 1–2 minutos en aprovisionar.

---

## 2. Obtener las claves de API

Una vez creado:

1. Ve a **Settings → API** (icono de engranaje en la barra lateral).
2. Copia estos tres valores:

| Variable | Dónde está | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" arriba del todo | Pública, va al browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sección "Project API keys" → `anon` `public` | Pública, va al browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Misma sección → `service_role` | ⚠️ **SECRETO** — solo server |

3. Pégalos en tu `.env.local` (archivo que vas a crear de `.env.local.template`).

---

## 3. Correr el schema SQL

Esto crea las tablas, índices, RLS, el seed del singleton `store_setting`, y el bucket de Storage para imágenes de productos.

1. En la barra lateral: **SQL Editor** (icono `</>`).
2. Click **"New query"**.
3. Abre el archivo local `supabase/schema.sql` y **copia todo su contenido** al editor.
4. Click **"Run"** (o Ctrl+Enter). Debería decir `Success. No rows returned` — eso es bueno, no es un error.

**Qué se acaba de crear:**

- Tabla `product` (id, slug, name, brand, price_usd, badge, skin_concern[], routine_step, key_ingredients, usage_steps, in_stock, is_featured, images[], sort_order).
- Tabla `category` (id, slug, name, type: routine_step|concern).
- Tabla `store_setting` con **una sola fila** (id=1), pre-cargada con:
  - `tasa_bcv = 612`, `tasa_usdt = 800` (los del ejemplo del doc maestro).
  - `whatsapp_number = 584244273062`.
  - `local_delivery_cost_usd = 3`.
  - 5 métodos de pago activos (Pago Móvil, Transferencia, Zelle, USDT, Efectivo USD).
- **Row-Level Security activado** con política de lectura pública. El cliente del browser **solo lee**, nunca escribe.
- Bucket de Storage `product-images` (público para lectura).

---

## 4. Verificar que todo quedó bien

En la barra lateral **Table Editor**, deberías ver:

- `product` (vacía, OK)
- `category` (vacía, OK)
- `store_setting` (1 fila con los datos seed)

Y en **Storage** → Buckets: `product-images`.

---

## 5. (Opcional) Cargar datos de prueba

Si quieres probar el sitio con productos ficticios antes de que el dueño cargue los reales:

1. Vuelve a **SQL Editor → New query**.
2. Corre esto:

```sql
-- Categorías
insert into category (slug, name, type, sort_order) values
  ('limpiador', 'Limpiador', 'routine_step', 1),
  ('tonico', 'Tónico', 'routine_step', 2),
  ('esencia', 'Esencia', 'routine_step', 3),
  ('serum', 'Sérum', 'routine_step', 4),
  ('hidratante', 'Hidratante', 'routine_step', 6),
  ('protector-solar', 'Protector Solar', 'routine_step', 7),
  ('hidratacion', 'Hidratación', 'concern', 1),
  ('acne', 'Acné', 'concern', 2),
  ('brillo', 'Brillo', 'concern', 3),
  ('antiedad', 'Antiedad', 'concern', 4);

-- Producto de prueba (mismo del ejemplo $20)
insert into product (
  slug, name, brand, description, price_usd, badge,
  skin_concern, skin_type, routine_step,
  key_ingredients, usage_steps,
  in_stock, is_featured, images, sort_order
) values (
  'cosrx-snail-mucin-essence',
  'Sérum Snail Mucin 96% Power Essence',
  'COSRX',
  'Esencia facial con 96% de mucina de caracol para reparar e hidratar la barrera cutánea.',
  20.00,
  'best_seller',
  array['hidratacion','brillo'],
  array['seca','sensible','mixta'],
  'esencia',
  '[{"name":"Snail Mucin","pct":96,"role":"Repair & Hydrate"}]'::jsonb,
  '[{"title":"Após la limpieza","detail":"Aplicar 2-3 gotas sobre el rostro limpio."},{"title":"Doble uso","detail":"Se puede usar como esencia y como sérum."}]'::jsonb,
  true,
  true,
  array['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800'],
  1
);
```

3. Click **Run**. Debería decir `Success. 11 rows affected` (10 categorías + 1 producto).

---

## 6. Subir imágenes de productos (cuando estén listas)

Tienes dos caminos:

**A. Panel admin del propio Supabase (rápido para pocas fotos):**
1. **Storage** → bucket `product-images` → **Upload file**.
2. Arrastra las fotos.
3. Click derecho sobre la imagen subida → **Copy URL**.
4. Pega esa URL en el campo `images[]` del producto (en **Table Editor** → `product`).

**B. Directamente desde el mini-panel `/admin`** (cuando lo construyamos en Sprint 6.b): arrastrar y subir, sin tocar la web de Supabase.

**Importante:** las imágenes deben estar optimizadas antes de subir. Tamaño ideal: **800×800 px o 1000×1000 px**, formato WebP o JPG comprimido a <200 KB. La home de Venezuela va a cargar esto por 4G — cada KB cuenta.

---

## 7. Variables de entorno finales

Tu `.env.local` debería verse así (con tus valores reales, **no** estos placeholders):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_WHATSAPP_NUMBER=584244273062
NEXT_PUBLIC_SITE_URL=https://sokobeauty.ve
DOLARVZLA_API_KEY=
ADMIN_PASSWORD=una-clave-segura-aqui
```

---

## 8. Probar la conexión en local

```bash
cd /workspace/soko-beauty
npm run dev
```

Abre http://localhost:3000 — debería verse la home (placeholder todavía, pero la página renderiza). El log de Next.js **no debería** quejarse de "Missing Supabase env vars".

Para verificar que la BD responde, después de Sprint 2 (cuando el catálogo lea de Supabase), el grid debería mostrar el producto de prueba.

---

## 9. Checklist pre-producción (cuando vayas a deploy)

- [ ] Cambiar `NEXT_PUBLIC_SITE_URL` al dominio real.
- [ ] Generar una `ADMIN_PASSWORD` fuerte (o migrar a Supabase Auth).
- [ ] Confirmar la región del proyecto Supabase (ya viene `sa-east-1` si elegiste São Paulo).
- [ ] Revisar las políticas de RLS: solo lectura pública está OK, pero si activas escritura pública sin querer, **cualquier visitante puede modificar productos**.
- [ ] Activar **Daily backups** en Supabase Dashboard → Settings → Database (en plan Free solo hay backups manuales; en Pro son automáticos).

---

**¿Quieres que te ayude con alguno de estos pasos ahora?** Puedo:
- Generar el `.env.local` listo para que pegues tus claves
- Correr los inserts de prueba yo mismo si me las pasas
- Cualquier cosa que te trabe
