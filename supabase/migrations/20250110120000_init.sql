create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null check (role in ('ADMIN','FINANCEIRO','DP','FISCAL_CONTABIL','LEGALIZACAO_CERT')),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_active_idx on public.profiles(is_active);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null,
  actor_email text null,
  action text not null,
  entity_type text not null,
  entity_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_email);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at);

create table if not exists public.app_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text not null default 'Geral',
  is_active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists app_links_active_idx on public.app_links(is_active);
create index if not exists app_links_order_idx on public.app_links(sort_order);

create table if not exists public.rulesets (
  id uuid primary key default gen_random_uuid(),
  simulator_key text not null check (simulator_key in ('HONORARIOS','RESCISAO','FERIAS','FATOR_R','SIMPLES_DAS')),
  name text not null,
  version int not null,
  is_active boolean not null default false,
  payload jsonb not null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (simulator_key, version)
);

create unique index if not exists rulesets_active_idx
  on public.rulesets(simulator_key)
  where is_active;

create table if not exists public.legal_docs (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  cnpj text null,
  doc_type text not null check (doc_type in ('CND','BOMBEIRO_AVCB','SANITARIA','ALVARA')),
  issue_date date null,
  expiry_date date not null,
  notes text null,
  attachment_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legal_docs_expiry_idx on public.legal_docs(expiry_date);
create index if not exists legal_docs_type_idx on public.legal_docs(doc_type);

create table if not exists public.digital_certs (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  cnpj text null,
  cert_type text not null,
  provider text null,
  expiry_date date not null,
  notes text null,
  attachment_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists digital_certs_expiry_idx on public.digital_certs(expiry_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger app_links_set_updated_at
before update on public.app_links
for each row execute function public.set_updated_at();

create trigger rulesets_set_updated_at
before update on public.rulesets
for each row execute function public.set_updated_at();

create trigger legal_docs_set_updated_at
before update on public.legal_docs
for each row execute function public.set_updated_at();

create trigger digital_certs_set_updated_at
before update on public.digital_certs
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'ADMIN'
      and p.is_active = true
  );
$$;

create or replace function public.is_legalizacao()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('ADMIN','LEGALIZACAO_CERT')
      and p.is_active = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_links enable row level security;
alter table public.rulesets enable row level security;
alter table public.legal_docs enable row level security;
alter table public.digital_certs enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

create policy profiles_insert_admin on public.profiles
  for insert with check (public.is_admin());

create policy audit_logs_select_admin on public.audit_logs
  for select using (public.is_admin());

create policy audit_logs_insert_auth on public.audit_logs
  for insert with check (auth.uid() is not null);

create policy app_links_select_active on public.app_links
  for select using (is_active = true or public.is_admin());

create policy app_links_admin_insert on public.app_links
  for insert with check (public.is_admin());

create policy app_links_admin_update on public.app_links
  for update using (public.is_admin())
  with check (public.is_admin());

create policy app_links_admin_delete on public.app_links
  for delete using (public.is_admin());

create policy rulesets_select_auth on public.rulesets
  for select using (auth.uid() is not null);

create policy rulesets_admin_insert on public.rulesets
  for insert with check (public.is_admin());

create policy rulesets_admin_update on public.rulesets
  for update using (public.is_admin())
  with check (public.is_admin());

create policy rulesets_admin_delete on public.rulesets
  for delete using (public.is_admin());

create policy legal_docs_select on public.legal_docs
  for select using (public.is_legalizacao());

create policy legal_docs_insert on public.legal_docs
  for insert with check (public.is_legalizacao());

create policy legal_docs_update on public.legal_docs
  for update using (public.is_legalizacao())
  with check (public.is_legalizacao());

create policy legal_docs_delete on public.legal_docs
  for delete using (public.is_legalizacao());

create policy digital_certs_select on public.digital_certs
  for select using (public.is_legalizacao());

create policy digital_certs_insert on public.digital_certs
  for insert with check (public.is_legalizacao());

create policy digital_certs_update on public.digital_certs
  for update using (public.is_legalizacao())
  with check (public.is_legalizacao());

create policy digital_certs_delete on public.digital_certs
  for delete using (public.is_legalizacao());

insert into public.rulesets (simulator_key, name, version, is_active, payload)
values
  (
    'HONORARIOS',
    'Versao inicial',
    1,
    true,
    jsonb_build_object(
      'baseMin', 450,
      'regimePercentual', jsonb_build_object(
        'SIMPLES', 0.012,
        'LUCRO_PRESUMIDO', 0.016,
        'LUCRO_REAL', 0.021
      ),
      'fatorSegmento', jsonb_build_object(
        'COMERCIO', 1.0,
        'PRESTADOR', 1.1,
        'INDUSTRIA', 1.2
      ),
      'adicFuncionario', 40,
      'descontoSistemaFinanceiro', 0.05,
      'descontoPontoEletronico', 0.05
    )
  ),
  (
    'RESCISAO',
    'Versao inicial',
    1,
    true,
    jsonb_build_object(
      'multaFgts', 0.4,
      'multaAcordo', 0.2,
      'diasAvisoPrevioBase', 30,
      'diasAvisoPrevioPorAno', 3
    )
  ),
  (
    'FERIAS',
    'Versao inicial',
    1,
    true,
    jsonb_build_object(
      'tercoConstitucional', true,
      'limiteDiasAbono', 10
    )
  ),
  (
    'FATOR_R',
    'Versao inicial',
    1,
    true,
    jsonb_build_object(
      'threshold', 0.28,
      'annex_if_ge', 'III',
      'annex_if_lt', 'V'
    )
  ),
  (
    'SIMPLES_DAS',
    'Versao inicial',
    1,
    true,
    jsonb_build_object(
      'tables', jsonb_build_object(
        'I', jsonb_build_array(
          jsonb_build_object('min', 0, 'max', 180000, 'aliquota_nominal', 0.04, 'deducao', 0),
          jsonb_build_object('min', 180000.01, 'max', 360000, 'aliquota_nominal', 0.073, 'deducao', 5940),
          jsonb_build_object('min', 360000.01, 'max', 720000, 'aliquota_nominal', 0.095, 'deducao', 13860),
          jsonb_build_object('min', 720000.01, 'max', 1800000, 'aliquota_nominal', 0.107, 'deducao', 22500),
          jsonb_build_object('min', 1800000.01, 'max', 3600000, 'aliquota_nominal', 0.143, 'deducao', 87300),
          jsonb_build_object('min', 3600000.01, 'max', 4800000, 'aliquota_nominal', 0.19, 'deducao', 378000)
        ),
        'II', jsonb_build_array(
          jsonb_build_object('min', 0, 'max', 180000, 'aliquota_nominal', 0.045, 'deducao', 0),
          jsonb_build_object('min', 180000.01, 'max', 360000, 'aliquota_nominal', 0.078, 'deducao', 5940),
          jsonb_build_object('min', 360000.01, 'max', 720000, 'aliquota_nominal', 0.1, 'deducao', 13860),
          jsonb_build_object('min', 720000.01, 'max', 1800000, 'aliquota_nominal', 0.112, 'deducao', 22500),
          jsonb_build_object('min', 1800000.01, 'max', 3600000, 'aliquota_nominal', 0.147, 'deducao', 85500),
          jsonb_build_object('min', 3600000.01, 'max', 4800000, 'aliquota_nominal', 0.3, 'deducao', 720000)
        ),
        'III', jsonb_build_array(
          jsonb_build_object('min', 0, 'max', 180000, 'aliquota_nominal', 0.06, 'deducao', 0),
          jsonb_build_object('min', 180000.01, 'max', 360000, 'aliquota_nominal', 0.112, 'deducao', 9360),
          jsonb_build_object('min', 360000.01, 'max', 720000, 'aliquota_nominal', 0.135, 'deducao', 17640),
          jsonb_build_object('min', 720000.01, 'max', 1800000, 'aliquota_nominal', 0.16, 'deducao', 35640),
          jsonb_build_object('min', 1800000.01, 'max', 3600000, 'aliquota_nominal', 0.21, 'deducao', 125640),
          jsonb_build_object('min', 3600000.01, 'max', 4800000, 'aliquota_nominal', 0.33, 'deducao', 648000)
        ),
        'IV', jsonb_build_array(
          jsonb_build_object('min', 0, 'max', 180000, 'aliquota_nominal', 0.045, 'deducao', 0),
          jsonb_build_object('min', 180000.01, 'max', 360000, 'aliquota_nominal', 0.09, 'deducao', 8100),
          jsonb_build_object('min', 360000.01, 'max', 720000, 'aliquota_nominal', 0.102, 'deducao', 12420),
          jsonb_build_object('min', 720000.01, 'max', 1800000, 'aliquota_nominal', 0.14, 'deducao', 39780),
          jsonb_build_object('min', 1800000.01, 'max', 3600000, 'aliquota_nominal', 0.22, 'deducao', 183780),
          jsonb_build_object('min', 3600000.01, 'max', 4800000, 'aliquota_nominal', 0.33, 'deducao', 828000)
        ),
        'V', jsonb_build_array(
          jsonb_build_object('min', 0, 'max', 180000, 'aliquota_nominal', 0.155, 'deducao', 0),
          jsonb_build_object('min', 180000.01, 'max', 360000, 'aliquota_nominal', 0.18, 'deducao', 4500),
          jsonb_build_object('min', 360000.01, 'max', 720000, 'aliquota_nominal', 0.195, 'deducao', 9900),
          jsonb_build_object('min', 720000.01, 'max', 1800000, 'aliquota_nominal', 0.205, 'deducao', 17100),
          jsonb_build_object('min', 1800000.01, 'max', 3600000, 'aliquota_nominal', 0.23, 'deducao', 62100),
          jsonb_build_object('min', 3600000.01, 'max', 4800000, 'aliquota_nominal', 0.305, 'deducao', 540000)
        )
      )
    )
  )
on conflict do nothing;
