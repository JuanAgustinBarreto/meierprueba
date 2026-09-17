# Meier Distribuciones · Panel de administrador — Puesta en marcha

Esto conecta tu catálogo actual con un panel de administrador moderno que recibe los
pedidos en tiempo real, permite gestionar productos (alta/baja/modificación) y generar
reportes en PDF.

## Arquitectura (resumen)

```
Catálogo (tu sitio actual)  →  Supabase (base de datos)  →  Panel de administrador
      ↓ (a la vez)
   WhatsApp
```

Cuando un cliente confirma un pedido: se guarda en la base de datos **y** se abre WhatsApp,
al mismo tiempo. El panel de administrador está escuchando esa base de datos en vivo, así
que el pedido nuevo aparece solo, sin recargar la página.

## Pasos

### 1. Crear el proyecto en Supabase (gratis)
1. Entrá a https://supabase.com → **New project**.
2. Elegí un nombre (ej. `meier-distribuciones`) y una contraseña para la base (guardala).
3. Esperá ~2 minutos a que se cree.

### 2. Cargar el esquema de base de datos
1. Abrí **SQL Editor** → **New query**.
2. Pegá todo el contenido de `1-supabase-schema.sql` y apretá **Run**.
3. Esto crea las tablas `productos`, `pedidos`, `pedido_items` y las reglas de seguridad.

### 3. Crear tu usuario de administrador
1. Andá a **Authentication → Users → Add user**.
2. Cargá tu email y una contraseña. Con eso vas a entrar al panel.
   (Podés agregar más usuarios acá si más adelante suman empleados.)

### 4. Obtener las claves de conexión
1. Andá a **Project Settings → API**.
2. Copiá el **Project URL** y la **anon public key**.

### 5. Configurar el panel de administrador
1. Abrí `admin-dashboard.html` con un editor de texto.
2. Reemplazá al principio del `<script>`:
   ```js
   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   const SUPABASE_ANON_KEY = "TU-ANON-KEY-PUBLICA";
   ```
3. Guardalo.

### 6. Publicar el panel
El panel es un único archivo HTML. Opciones simples:
- **Vercel**: creá un proyecto nuevo (separado del catálogo) solo con este archivo como `index.html`, y deployalo. Te va a quedar algo como `panel-meier.vercel.app`.
- O simplemente abrilo localmente / subilo a cualquier hosting estático.

Importante: es un panel **privado** — no lo enlaces desde el sitio público. Guardá el link
para vos y quien administre.

### 7. Migrar tus productos del `.json` actual
Seguí el paso 3 de `2-integracion-catalogo.md` para pasar tu `productos.json` a la tabla
`productos` de Supabase.

### 8. Conectar el catálogo para que guarde el pedido
Seguí `2-integracion-catalogo.md` completo: agrega el guardado en base de datos justo antes
de abrir WhatsApp, y (opcional pero recomendado) hace que el catálogo lea los productos
desde Supabase en vez del `.json`, para que el ABM del panel se refleje ahí solo.

## Qué incluye el panel

- **Resumen**: pedidos de hoy, facturación del día, pendientes, alertas de stock bajo.
- **Pedidos**: lista en vivo (aparecen apenas se confirman), filtro por estado, detalle con
  items, cambio de estado (nuevo → en proceso → entregado/cancelado), sonido y aviso visual
  ante pedido nuevo.
- **Productos**: alta, baja, modificación (ABM completo), búsqueda, control de stock y
  visibilidad en el catálogo.
- **Reportes**: PDF de ventas por rango de fechas, PDF de stock actual con alerta de stock
  bajo.

## Si querés que te deje la integración exacta con tu código

Como no tengo acceso al código fuente de tu proyecto en Vercel (solo veo la página ya
renderizada), el fragmento de `2-integracion-catalogo.md` es genérico. Si me pasás el
archivo o la función donde armás el pedido y el link de WhatsApp, te dejo el cambio ya
adaptado línea por línea.
