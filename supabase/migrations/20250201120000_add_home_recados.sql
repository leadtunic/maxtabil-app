create table if not exists public.home_recados (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_recados_active_idx on public.home_recados(is_active);
create index if not exists home_recados_sort_idx on public.home_recados(sort_order);

create trigger home_recados_set_updated_at
before update on public.home_recados
for each row execute function public.set_updated_at();

alter table public.home_recados enable row level security;

create policy home_recados_select_auth on public.home_recados
  for select using (is_active = true or public.is_admin());

create policy home_recados_admin_insert on public.home_recados
  for insert with check (public.is_admin());

create policy home_recados_admin_update on public.home_recados
  for update using (public.is_admin())
  with check (public.is_admin());

create policy home_recados_admin_delete on public.home_recados
  for delete using (public.is_admin());

-- Storage (bucket/policies) must be created with supabase_admin/postgres.
