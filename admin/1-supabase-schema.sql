-- ============================================================
-- MEIER DISTRIBUCIONES · Esquema de base de datos (Supabase/Postgres)
-- Ejecutar esto en: Supabase → tu proyecto → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PRODUCTOS (reemplaza el .json actual)
-- ------------------------------------------------------------
create table if not exists productos (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  categoria    text,
  marca        text,
  precio       numeric(12,2) not null default 0,
  stock        integer not null default 0,
  stock_min    integer not null default 5,       -- para alertas de "stock bajo"
  imagen_url   text,
  activo       boolean not null default true,     -- si es false, no aparece en el catálogo
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PEDIDOS (lo que llega desde el catálogo)
-- ------------------------------------------------------------
create table if not exists pedidos (
  id                 uuid primary key default gen_random_uuid(),
  numero             serial,                       -- número correlativo lindo para mostrar (#1, #2...)
  cliente_nombre     text not null,
  cliente_apellido   text,
  cliente_direccion  text,
  cliente_telefono   text,
  cliente_email      text,
  total              numeric(12,2) not null default 0,
  estado             text not null default 'nuevo', -- nuevo | en_proceso | entregado | cancelado
  notas              text,
  created_at         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ITEMS DE CADA PEDIDO
-- ------------------------------------------------------------
create table if not exists pedido_items (
  id                uuid primary key default gen_random_uuid(),
  pedido_id         uuid references pedidos(id) on delete cascade,
  producto_id       uuid references productos(id) on delete set null,
  nombre_producto   text not null,
  cantidad          integer not null,
  precio_unitario   numeric(12,2) not null,
  subtotal          numeric(12,2) not null
);

create index if not exists idx_pedido_items_pedido on pedido_items(pedido_id);
create index if not exists idx_pedidos_created on pedidos(created_at desc);
create index if not exists idx_productos_activo on productos(activo);

-- ------------------------------------------------------------
-- SEGURIDAD (Row Level Security)
-- El catálogo público (sin login) puede: leer productos activos y crear pedidos.
-- El panel de admin (con login) puede: todo.
-- ------------------------------------------------------------
alter table productos     enable row level security;
alter table pedidos       enable row level security;
alter table pedido_items  enable row level security;

-- Catálogo público: leer productos
create policy "public_select_productos" on productos
  for select using (true);

-- Catálogo público: crear pedidos e items (checkout sin login)
create policy "public_insert_pedidos" on pedidos
  for insert with check (true);

create policy "public_insert_items" on pedido_items
  for insert with check (true);

-- Admin autenticado: control total
create policy "admin_all_productos" on productos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_select_pedidos" on pedidos
  for select using (auth.role() = 'authenticated');

create policy "admin_update_pedidos" on pedidos
  for update using (auth.role() = 'authenticated');

create policy "admin_delete_pedidos" on pedidos
  for delete using (auth.role() = 'authenticated');

create policy "admin_select_items" on pedido_items
  for select using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- TIEMPO REAL: para que el dashboard reciba el pedido apenas se crea
-- ------------------------------------------------------------
alter publication supabase_realtime add table pedidos;
alter publication supabase_realtime add table pedido_items;

-- ------------------------------------------------------------
-- Trigger para mantener updated_at en productos
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_productos_updated on productos;
create trigger trg_productos_updated
  before update on productos
  for each row execute function set_updated_at();
