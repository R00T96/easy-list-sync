-- Create shopping_items table for syncing
create extension if not exists pgcrypto;

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id text not null,
  text text not null,
  qty integer not null default 1,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- Indexes for performance
create index if not exists idx_shopping_items_list_id on public.shopping_items (list_id);
create index if not exists idx_shopping_items_updated_at on public.shopping_items (updated_at);

-- Enable Row Level Security
alter table public.shopping_items enable row level security;

-- Public access policies (no auth yet). Note: consider tightening once auth is added.
create policy if not exists "Public can read shopping items"
  on public.shopping_items for select
  using (true);

create policy if not exists "Public can insert shopping items"
  on public.shopping_items for insert
  with check (true);

create policy if not exists "Public can update shopping items"
  on public.shopping_items for update
  using (true)
  with check (true);

create policy if not exists "Public can delete shopping items"
  on public.shopping_items for delete
  using (true);