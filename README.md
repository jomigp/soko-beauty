# Soko Beauty

Tienda de skincare coreano (K-beauty) en Valencia, Venezuela. Catálogo rápido,
carrito, pago multi-tasa, pedido por WhatsApp.

**Repo:** https://github.com/jomigp/soko-beauty
**Manual de la tienda:** [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) (español, para la dueña)
**Setup de Supabase:** [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
**Documento maestro:** `SOKO_BEAUTY_MASTER.md` (en la raíz del proyecto de diseño)

## Stack

- **Next.js 16.2.9** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 3.4** con los tokens de `luminous_k_beauty_system/DESIGN.md`
- **shadcn/ui** (filosofía, sin instalar la lib completa)
- **Supabase** (Postgres + Storage) — sin Prisma
- **Vercel** (hosting)
- **Vitest** (30 tests, motor multi-tasa + parser de calcu.arepatecnologica.com)
- **next/font** (Bodoni Moda + Geist)
- Sin pasarela de pago, sin cuentas de cliente, sin tabla de pedidos

## Estructura

```
/app
  /                       → home (hero + shop-by-step + featured + concerns)
  /productos              → catálogo con filtros (paso + necesidad + búsqueda)
  /productos/[slug]       → ficha de producto
  /carrito                → carrito + checkout (delivery + método de pago + WhatsApp)
  /pedido/enviado         → confirmación (auto-abre WhatsApp)
  /soporte                → 5 pasos para pedir + contacto
  /(legal)                → /terminos, /privacidad, /devoluciones
  /admin                  → mini-panel (login + dashboard + productos + config)
  /api                    → endpoints (admin + store/setting)
  /sitemap.xml            → dinámico (productos + categorías)
  /robots.txt             → disallow /admin y /api
/components
  Button, Input, DualPrice, GlowChip, Badge, ProductCard, CartDrawer,
  CartContext (provider + hook), AddToCartButton, TopBar, BottomNav,
  WhatsAppButton, Logo (SVG con gradiente Luminous Core)
/lib
  pricing.ts          ⭐ motor multi-tasa (single source of truth)
  rates.ts            ⭐ calcu.arepatecnologica.com + caché + fallback
  whatsapp.ts         ⭐ constructor del mensaje de WhatsApp
  money.ts              formato USD/Bs
  supabase.ts           cliente browser + admin (con stub resiliente)
  supabase-queries.ts   fetchers server-side para RSC
  database.types.ts     tipos del schema
  types.ts              tipos del dominio
  admin-auth.ts         gate de /admin
  store.ts              snapshot default de StoreSetting
/tests
  pricing.test.ts     ⭐ 18 tests — incluye caso $20/612/800 del doc maestro
  rates.test.ts       ⭐ 12 tests — parser de calcu + fallbacks + errores
/supabase
  schema.sql           product / category / store_setting + RLS + storage
ADMIN_GUIDE.md          manual de usuario en español (para la clienta)
SUPABASE_SETUP.md       guía paso a paso para crear el proyecto en Supabase
vercel.json             deploy config (región gru1 + CSP + HSTS + headers)
.env.local.template     todas las env vars con placeholders
```

## Estado

✅ **MVP completo.** Todo el documento maestro (Sprint 0–7) implementado:

| Sprint | Estado |
|---|---|
| 0 — Setup | ✅ Next.js 16.2.9 + TS + Tailwind + tokens + fonts |
| 1 — Componentes | ✅ Button, Input, DualPrice, GlowChip, Badge, ProductCard, etc. |
| 2 — Home + Catálogo | ✅ Con datos reales de Supabase |
| 3 — Ficha de producto | ✅ Galería, ingredientes, how-to, relacionados |
| 4 — Pricing engine | ✅ Motor multi-tasa + tests (30/30 verde) |
| 5 — Carrito + Checkout | ✅ Recálculo en vivo + WhatsApp send |
| 6 — Admin + config | ✅ Login, dashboard, productos, configuración |
| 7 — Legal + SEO + polish | ✅ Términos, privacidad, devoluciones, sitemap, robots |

## Scripts

```bash
npm install
npm run dev            # dev server en http://localhost:3000
npm run test           # 30 tests (Vitest)
npm run typecheck      # tsc --noEmit
npm run build          # build de producción
```

## Variables de entorno

Copia `.env.local.template` a `.env.local` y rellena los valores.

## Seguridad

- ✅ Next.js 16.2.9 (parchea CVE-2025-66478 + acumulado de CVEs 15.x)
- ✅ React 19 stable
- ✅ `npm audit`: 0 vulnerabilidades
- ✅ CSP estricto en `vercel.json` (allowlist de fonts, supabase, calcu, wa.me)
- ✅ HSTS habilitado
- ✅ RLS en Supabase (lectura pública, escritura solo con service-role)
- ✅ Admin protegido por cookie httpOnly + 8h session
- ✅ `prefers-reduced-motion` respetado

## Pendiente del dueño (ver §16 del doc maestro)

1. RIF del negocio (ya hay campo en `store_setting`, se llena desde `/admin/configuracion`)
2. Lista real de productos (se cargan desde `/admin/productos` o directo en Supabase)
3. Confirmar métodos de pago activos
4. Confirmar costos de entrega definitivos
5. Decisión de redondeo en Bs
6. *(Opcional)* segundo provider de tasas
