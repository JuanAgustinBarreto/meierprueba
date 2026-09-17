# Cómo conectar tu catálogo (meier-distribuciones.vercel.app) con la base de datos

Hoy tu botón "Enviar Pedido por WhatsApp" arma el link de `wa.me` y listo. Para que el pedido
**también** quede guardado (y le llegue en el momento al panel), hay que agregar un paso justo
antes de abrir WhatsApp: guardar el pedido en Supabase.

## 1) Agregá el cliente de Supabase a tu sitio

En el `<head>` de tu HTML (o el archivo raíz si es un proyecto Next.js/React), agregá:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const sb = window.supabase.createClient(
    "https://TU-PROYECTO.supabase.co",
    "TU-ANON-KEY-PUBLICA"
  );
</script>
```

(Las mismas `SUPABASE_URL` y `SUPABASE_ANON_KEY` que usaste en `admin-dashboard.html`. La
`anon key` es pública y segura de exponer en el frontend: las políticas de seguridad ya
configuradas en el paso 1 del SQL son las que protegen los datos.)

Si tu sitio está hecho con React/Next.js, instalá el paquete en vez del script:
```bash
npm install @supabase/supabase-js
```
```js
import { createClient } from '@supabase/supabase-js'
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

## 2) Guardá el pedido antes de abrir WhatsApp

Buscá la función que se ejecuta cuando el cliente aprieta **"Enviar Pedido por WhatsApp"**
(donde hoy arma el texto del mensaje). Justo antes de hacer `window.open(linkWhatsapp)`,
agregá algo así:

```js
async function confirmarPedido(datosCliente, carrito, totalCarrito) {
  // 1. Guardar el pedido en la base
  const { data: pedido, error } = await sb
    .from('pedidos')
    .insert({
      cliente_nombre: datosCliente.nombre,
      cliente_apellido: datosCliente.apellido,
      cliente_direccion: datosCliente.direccion,
      cliente_telefono: datosCliente.telefono,
      cliente_email: datosCliente.email || null,
      total: totalCarrito,
      estado: 'nuevo'
    })
    .select()
    .single();

  if (error) {
    console.error('No se pudo registrar el pedido:', error);
    // igual dejamos continuar el flujo de WhatsApp para no trabar la venta
  } else {
    // 2. Guardar los items del pedido
    const items = carrito.map(item => ({
      pedido_id: pedido.id,
      producto_id: item.id || null,
      nombre_producto: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad
    }));
    await sb.from('pedido_items').insert(items);
  }

  // 3. Recién ahora abrir WhatsApp, como ya lo hacías
  const mensaje = armarMensajeWhatsapp(datosCliente, carrito, totalCarrito);
  window.open(`https://wa.me/3435423041?text=${encodeURIComponent(mensaje)}`, '_blank');
}
```

Ajustá los nombres de campos (`datosCliente.nombre`, `item.precio`, etc.) a como se llamen
las variables reales en tu código — mandame el fragmento de tu checkout si querés que te
deje la integración exacta, línea por línea.

## 3) Migrá tus productos del `.json` a Supabase

Si tenés algo como `productos.json` con un array de productos, podés importarlo todo de una:

1. Andá a Supabase → **Table Editor** → tabla `productos` → botón **Insert** → **Import data from CSV** (convertí tu JSON a CSV rápido, o pedime que te lo convierta).
2. O, más prolijo, corré este script una sola vez desde tu compu (Node.js):

```js
import { createClient } from '@supabase/supabase-js'
import productos from './productos.json' assert { type: 'json' }

const sb = createClient('https://TU-PROYECTO.supabase.co', 'TU-SERVICE-ROLE-KEY') // usar la service_role acá, NO la anon

const filas = productos.map(p => ({
  nombre: p.nombre,
  categoria: p.categoria,
  marca: p.marca,
  precio: p.precio,
  stock: p.stock ?? 0,
  imagen_url: p.imagen,
  activo: true
}))

const { error } = await sb.from('productos').insert(filas)
console.log(error || `Listo, se importaron ${filas.length} productos`)
```

## 4) Hacé que el catálogo lea productos desde Supabase (en vez del .json)

Donde hoy hacés `fetch('/productos.json')`, reemplazá por:

```js
const { data: productos } = await sb.from('productos').select('*').eq('activo', true);
```

Así, cuando edites o des de baja un producto desde el panel de administrador, el catálogo
público se actualiza solo — sin tocar ningún archivo ni volver a deployar.
