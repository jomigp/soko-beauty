# 📖 Manual de Usuario — Soko Beauty

**Para la dueña de la tienda** · Cómo gestionar productos, precios, tasas y pedidos en tu tienda online.

> Este manual asume que ya creaste el proyecto en Supabase, conectaste Vercel, y configuraste las variables de entorno. Si no lo hiciste, pídele a tu equipo técnico que complete primero el archivo `SUPABASE_SETUP.md`.

---

## 🔑 Tu día a día: 3 tareas que vas a hacer todo el tiempo

1. **Añadir o actualizar productos** (cuando llegue mercancía nueva o cambien precios).
2. **Revisar las tasas de cambio** (BCV y paralelo) y ajustarlas si la API falla.
3. **Gestionar métodos de pago y costos de envío** (cuando agregues Zelle, cambies el delivery, etc.).

Todo se hace desde el **panel de administración**.

---

## 🚪 Cómo entrar al panel

1. Abre en tu navegador: **https://TU-DOMINIO.vercel.app/admin**
2. Te va a pedir una contraseña. Es la que tu equipo técnico configuró en la variable `ADMIN_PASSWORD` de Vercel.
3. Una vez dentro, verás 3 secciones en la barra lateral:
   - **Resumen** — vista general con cantidad de productos, tasas actuales, WhatsApp configurado.
   - **Productos** — gestionar tu catálogo.
   - **Configuración** — tasas, métodos de pago, datos de la tienda.

La sesión dura 8 horas. Cuando salgas (botón "Salir" arriba a la derecha), tienes que volver a ingresar.

---

## 🛍️ Cómo añadir un producto nuevo

1. Entra a **Productos** en la barra lateral.
2. Click en **"Nuevo Producto"** (esquina superior derecha).
3. Llena el formulario:

| Campo | Qué poner | Ejemplo |
|---|---|---|
| **Slug** | La URL del producto. Sin espacios, solo minúsculas y guiones. | `cosrx-snail-mucin-essence` |
| **Nombre** | El nombre del producto tal como quieres que aparezca. | `Sérum Snail Mucin 96% Power Essence` |
| **Marca** | La marca del producto. | `COSRX` |
| **Precio (USD)** | El precio en dólares. Este es el precio BCV de referencia. | `20.00` |
| **Paso de rutina** | Opcional. Si pertenece a un paso de la rutina coreana. | `esencia` |
| **Orden** | Opcional. Número que define el orden de aparición (menor = primero). | `1` |
| **Descripción** | Texto libre sobre el producto. | `Esencia facial con 96% de mucina de caracol para reparar la barrera cutánea.` |
| **URLs de imágenes** | Una URL por línea. Primero sube la imagen a Supabase Storage. | `https://xxx.supabase.co/storage/v1/object/public/product-images/snail.jpg` |
| **Necesidades** | Lista separada por comas. | `hidratacion, brillo, acne` |
| **Tipos de piel** | Lista separada por comas. | `seca, mixta, sensible` |
| **En stock** | Marcado = visible en la tienda. | ✓ |
| **Destacado** | Marcado = aparece en la home. | (opcional) |
| **Badge** | Opcional: "Best Seller" o "Nuevo". | (opcional) |

4. Click **"Guardar"**.

### Cómo subir una imagen de producto

Las imágenes NO se suben desde el panel. Se suben directo a Supabase Storage:

1. Ve a https://supabase.com → tu proyecto → **Storage** (menú izquierdo) → bucket **product-images**.
2. Click **"Upload file"** y arrastra tu imagen.
3. **Importante:** antes de subir, optimízala a **800×800 px o 1000×1000 px**, en formato WebP o JPG comprimido a menos de 200 KB. Esto es clave para que la página cargue rápido en 4G en Venezuela.
4. Click derecho sobre la imagen subida → **"Copy URL"**.
5. Pega esa URL en el campo "URLs de imágenes" del producto (una por línea si tienes varias).

### Cómo editar un producto existente

1. En la lista de **Productos**, busca el producto.
2. Click en el ícono de **lápiz** (✏️) a la derecha.
3. Modifica lo que necesites.
4. **"Guardar"**.

### Cómo eliminar un producto

1. En la lista, click en el ícono de **papelera** (🗑️).
2. Confirma. **Esto no se puede deshacer** — el producto desaparece de la tienda inmediatamente.

> 💡 Si solo quieres que deje de venderse pero no perderlo, desmarca "En stock" en lugar de eliminarlo.

---

## 💵 Cómo gestionar las tasas de cambio

Las tasas se actualizan **solas** desde `calcu.arepatecnologica.com` (BCV, paralelo, euro). Normalmente no tienes que tocarlas.

**Cuándo SÍ tocarlas:** si la API está caída y los precios se ven mal.

1. Entra a **Configuración**.
2. En la sección "Tasas de Cambio", edita los dos campos:
   - **Tasa BCV (USD)** — el valor oficial del BCV.
   - **Tasa Paralelo (USD)** — el valor del dólar paralelo (EnParalelo / Monitor).
3. Click **"Guardar Cambios"**.

> ⚠️ El "ahorro" que ven los clientes al pagar en USD se calcula como `1 - BCV/Paralelo`. Si BCV = 612 y Paralelo = 785, el ahorro es 22%. No necesitas calcularlo tú — el sistema lo hace.

---

## 💳 Cómo gestionar métodos de pago

1. Entra a **Configuración** → sección "Métodos de Pago".
2. Verás una lista de los métodos activos. Cada uno tiene:
   - **Key** — identificador interno, no lo cambies a menos que sepas lo que haces.
   - **Etiqueta visible** — lo que ve el cliente (ej: "Pago Móvil", "Zelle").
   - **Moneda** — VES o USD.
   - **Tasa** — BCV (para bolívares) o Paralelo (para dólares).
   - **Ajuste (%)** — opcional. Positivo = recargo, negativo = descuento extra.
   - **Activo** — desmárcalo para ocultar el método sin eliminarlo.

3. Para **añadir un método nuevo** (ej: Binance USDT): click **"Añadir Método"**, completa los campos.
4. Para **eliminar un método**: click en el ícono de papelera a la derecha del método.
5. **"Guardar Cambios"** al terminar.

> 💡 **Recomendación:** mantén solo los métodos que realmente usas. Métodos inactivos o confusos solo le dan fricción al cliente.

---

## 🚚 Cómo cambiar costos de envío y datos de la tienda

En **Configuración** → sección "Tienda":

| Campo | Qué hace |
|---|---|
| **Número de WhatsApp** | El número que recibe los pedidos. SIEMPRE con código de país, sin "+". Ej: `584244273062`. |
| **RIF** | Aparece al final del mensaje de WhatsApp. Ej: `J-12345678-9`. |
| **Dirección de la tienda** | Tu dirección física. Aparece en la sección "Retiro en tienda". |
| **Costo delivery Valencia (USD)** | Lo que se suma al total cuando el cliente elige delivery. |
| **Nota retiro en tienda** | Mensaje que ve el cliente cuando elige retirar (horario, referencia). |
| **Nota envío nacional** | Mensaje para envío nacional (couriers que usas, "se coordina por WhatsApp"). |

Click **"Guardar Cambios"** cuando termines.

---

## 📱 Cómo llegan los pedidos

**Los pedidos no se guardan en la web.** Llegan directamente a tu WhatsApp como un mensaje de texto, con este formato:

```
🧴 NUEVO PEDIDO — Soko Beauty

👤 Cliente: María Pérez   📱 0424-1234567

🛒 Productos:
• 2 x Sérum Vitamina C — $36,00
• 1 x Protector Solar SPF50 — $12,00
Subtotal (precio BCV): *$48,00*

🚚 Entrega: Delivery Valencia (+$3,00)
🏦 Tasas: BCV 612.43 · USDT 784.8

💳 Método elegido: USDT
👉 TOTAL A PAGAR: $39,02   (equiv. Bs 30.630,94)   _Ahorras 22%_

📍 Av. Cabriales, Valencia
📝 Notas: Por favor entregar después de las 4pm
```

Tu trabajo es:

1. **Leer el pedido** y responderle al cliente por WhatsApp.
2. **Coordinar el pago** (los datos de Pago Móvil / Zelle / etc. NO se publican en la web por seguridad — se los das al cliente por chat cuando confirmen el pedido).
3. **Coordinar la entrega** (o el retiro en tienda).
4. **Si eligió envío nacional**, pedirle la dirección completa y cotizar el envío con MRW / Zoom / Tealca.

> 💡 **Tip:** Ten una respuesta plantilla lista en WhatsApp Business con los datos de tus cuentas (Pago Móvil, Zelle, Binance). Así solo llenas el monto.

---

## 🛠️ Problemas comunes

### "La página se ve raro / sin estilos"
Borra el caché del navegador (Ctrl+Shift+R) o prueba en una ventana de incógnito. Si persiste, escríbele a tu equipo técnico.

### "Los precios están en 0 / 612 / raros"
La API de tasas falló. Ve a **Configuración** y edita las tasas manualmente. Si pasa seguido, avísale a tu equipo técnico para que revisen la API de `calcu.arepatecnologica.com`.

### "Un cliente dice que no le llegó el pedido"
Revisa tu WhatsApp — el pedido llega como mensaje. Si no está, pregúntale al cliente si le salió la pantalla de "¡Pedido Enviado!" y si le dio click al botón de WhatsApp. Si dice que sí pero no le llegó nada, escríbele a tu equipo técnico.

### "Quiero cambiar la contraseña del panel"
Pídele a tu equipo técnico que cambie la variable `ADMIN_PASSWORD` en Vercel (Settings → Environment Variables). El cambio aplica al próximo deploy.

### "Quiero agregar un nuevo método de pago"
**Configuración** → "Métodos de Pago" → **"Añadir Método"**. Llena los campos. **Guardar Cambios**.

---

## 📊 Resumen — dónde está cada cosa

| Necesito... | Voy a... |
|---|---|
| Añadir un producto | Productos → Nuevo Producto |
| Cambiar precio | Productos → Lápiz del producto |
| Marcar como agotado | Productos → Lápiz → desmarcar "En stock" |
| Cambiar las tasas de cambio | Configuración → Tasas de Cambio |
| Activar / desactivar métodos de pago | Configuración → Métodos de Pago |
| Cambiar el número de WhatsApp | Configuración → Tienda |
| Cambiar el costo de delivery | Configuración → Tienda |
| Ver cuánto tengo en stock | Productos (la columna "Estado" muestra "En stock" / "Agotado") |
| Salir del panel | Botón "Salir" arriba a la derecha |

---

## ⚠️ Lo que el panel NO hace (todavía)

- ❌ Ver historial de pedidos — los pedidos viven en WhatsApp.
- ❌ Notificaciones de pedidos nuevos — tienes que abrir WhatsApp.
- ❌ Múltiples usuarios / empleados con login propio — solo hay una contraseña compartida.
- ❌ Cobro en línea — el cliente paga por WhatsApp.
- ❌ Reseñas de productos.
- ❌ Cupones de descuento.

Todo eso es **Fase 2**, después del lanzamiento.

---

## 🆘 Si algo no funciona

1. **Revisa este manual** — el 90% de las tareas están aquí.
2. **Borra caché del navegador** (Ctrl+Shift+R / Cmd+Shift+R).
3. **Pídele ayuda a tu equipo técnico** con:
   - Una **captura de pantalla** del error.
   - **Qué estabas haciendo** cuando pasó.
   - **Qué navegador** usas (Chrome, Safari, etc.).

---

*Manual v1 — Soko Beauty · Junio 2026 · Para dudas técnicas, contacta al equipo que te construyó la tienda.*
