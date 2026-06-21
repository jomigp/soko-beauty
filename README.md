# Soko Beauty

Tienda de skincare coreano (K-beauty) en Valencia, Venezuela. Catálogo rápido,
carrito, pago multi-tasa, pedido por WhatsApp.

> Documento maestro: ver el archivo `SOKO_BEAUTY_MASTER.md` que acompaña al
> zip de diseño `stitch_soko_beauty_frontend_design.zip`. Este README es
> el estado del proyecto sprint a sprint.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 3.4** con los tokens de `luminous_k_beauty_system/DESIGN.md`
- **shadcn/ui** (filosofía; instalación on-demand)
- **Supabase** (Postgres + Storage). Cliente directo, sin Prisma.
- **Vercel** para hosting
- **Vitest** para tests del motor de precios
- Sin pasarela de pago, sin cuentas de cliente, sin tabla de pedidos

## Estructura

```
/
├── app/                    # Rutas (App Router)
│   ├── globals.css         # Tokens OKLCH, glass/glow utilities, reduced-motion
│   ├── layout.tsx          # Fuentes (Bodoni Moda + Geist) + metadata
│   └── page.tsx            # Home (placeholder hasta Sprint 2)
├── components/             # Componentes reutilizables
│   └── Logo.tsx
├── lib/                    # Lógica de negocio (single source of truth)
│   ├── pricing.ts          # ⭐ Motor multi-tasa
│   ├── rates.ts            # Proveedor de tasas (DolarVZLA + caché + fallback)
│   ├── whatsapp.ts         # Constructor del mensaje de WhatsApp
│   ├── money.ts            # Formato USD / Bs
│   ├── supabase.ts         # Cliente browser + admin
│   ├── database.types.ts   # Tipos del schema
│   ├── store.ts            # Snapshot default de StoreSetting
│   └── types.ts            # Tipos del dominio
├── tests/
│   └── pricing.test.ts     # ⭐ Incluye el caso $20/612/800 del doc maestro
├── supabase/
│   └── schema.sql          # Tablas product / category / store_setting + RLS
├── tailwind.config.ts      # Tokens del sistema de diseño
└── .env.example
```

## Estado por sprint

- ✅ **Sprint 0** — Setup (Next.js 15, TS, Tailwind con tokens, fuentes, Vitest)
- ✅ **Sprint 4.a** — `lib/pricing.ts` con tests (caso $20/612/800 verde)
- ✅ **Sprint 4.b** — `lib/rates.ts` (DolarVZLA + caché + fallback)
- ✅ **Sprint 4.c** — `lib/whatsapp.ts` (constructor del mensaje)
- ✅ **Sprint 4.d** — `lib/money.ts` (formato)
- ✅ **Sprint 6.a** — `supabase/schema.sql` (product / category / store_setting + RLS)
- ⏳ **Sprint 1** — Componentes base (Button, Input, DualPrice, GlowChip, ProductCard, BottomNav, WhatsAppButton)
- ⏳ **Sprint 2** — Home + Catálogo (port desde los HTMLs `_updated_logo`)
- ⏳ **Sprint 3** — Ficha de producto
- ⏳ **Sprint 5** — Carrito (drawer) + Checkout + envío WhatsApp
- ⏳ **Sprint 6.b** — Mini-panel admin (protegido)
- ⏳ **Sprint 7** — Traducción al español, páginas legales, SEO, deploy

## Scripts

```bash
npm install            # instalar dependencias
npm run dev            # dev server en http://localhost:3000
npm run test           # corre los tests (Vitest)
npm run test:watch     # tests en watch mode
npm run typecheck      # tsc --noEmit
npm run build          # build de producción
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. Los únicos
obligatorios para arrancar son los de Supabase.

## Diseño y skills aplicadas

- **impeccable** — OKLCH para nuevos colores, contraste ≥4.5:1 en body,
  `text-wrap: balance` en h1, glassmorphism solo donde el diseño lo pide
  (nav / drawer), cards ≤16px radius, `prefers-reduced-motion` respetado,
  sin `border:1px` + `shadow>16px` (codex defect), sin gradient text.
- **taste** — §0 brief inference aplicado; §2 stack correcto (shadcn +
  Tailwind); §8 dark-mode ready; §14 hard pre-flight antes de cada sprint.
- **emil-kowal** — vocabulary de motion reservada para microinteracciones
  (drawer, hover de cards, carrito). Build → review.

## Pendiente del dueño (ver §16 del documento maestro)

1. RIF del negocio
2. Lista real de productos (nombre, marca, precio USD, ingredientes, fotos)
3. Métodos de pago a activar y su `adjustment_pct` si aplica
4. Costos de entrega definitivos
5. Decisión de redondeo en Bs (entero vs decimales)
6. *(Opcional)* endpoint del API de Arepa Tecnológica
