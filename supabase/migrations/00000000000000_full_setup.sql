-- =====================================================
-- FULL SETUP (CONSOLIDATED)
-- Combines current schema, RLS, functions, and policies
-- =====================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =====================================================
-- CORE TABLES (AUTH-RELATED)
-- =====================================================
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

alter table public.app_links
  add column if not exists sector text not null default 'GERAL';

alter table public.app_links
  add column if not exists clicks integer not null default 0;

create index if not exists app_links_active_idx on public.app_links(is_active);
create index if not exists app_links_order_idx on public.app_links(sort_order);
create index if not exists app_links_sector_idx on public.app_links(sector);
create index if not exists idx_app_links_clicks on public.app_links(clicks desc);

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

-- =====================================================
-- MULTI-TENANT TABLES
-- =====================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_user_id);

create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  enabled_modules jsonb not null default '{
    "financeiro": true,
    "financeiro_bpo": true,
    "dp": true,
    "fiscal_contabil": true,
    "legalizacao": true,
    "certificado_digital": true,
    "admin": true
  }'::jsonb,
  completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  lifetime_access boolean not null default false,
  abacate_billing_id text,
  abacate_status text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bpo_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  document text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bpo_clients
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.bpo_clients
  add column if not exists contact_name text;
alter table public.bpo_clients
  add column if not exists contact_email text;
alter table public.bpo_clients
  add column if not exists contact_phone text;
alter table public.bpo_clients
  add column if not exists notes text;
alter table public.bpo_clients
  add column if not exists updated_at timestamptz not null default now();

create index if not exists bpo_clients_workspace_idx on public.bpo_clients(workspace_id);

create table if not exists public.bpo_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.bpo_clients(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  due_date date,
  assigned_to text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bpo_tasks
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.bpo_tasks
  add column if not exists description text;
alter table public.bpo_tasks
  add column if not exists assigned_to text;
alter table public.bpo_tasks
  add column if not exists completed_at timestamptz;
alter table public.bpo_tasks
  add column if not exists updated_at timestamptz not null default now();

create index if not exists bpo_tasks_workspace_idx on public.bpo_tasks(workspace_id);
create index if not exists bpo_tasks_client_idx on public.bpo_tasks(client_id);
create index if not exists bpo_tasks_status_idx on public.bpo_tasks(status);

create table if not exists public.home_recados (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_recados_active_idx on public.home_recados(is_active);
create index if not exists home_recados_sort_idx on public.home_recados(sort_order);

-- =====================================================
-- ADD workspace_id TO EXISTING TABLES
-- =====================================================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'audit_logs' and column_name = 'workspace_id') then
    alter table public.audit_logs add column workspace_id uuid references public.workspaces(id) on delete set null;
    create index if not exists audit_logs_workspace_idx on public.audit_logs(workspace_id);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'app_links' and column_name = 'workspace_id') then
    alter table public.app_links add column workspace_id uuid references public.workspaces(id) on delete cascade;
    create index if not exists app_links_workspace_idx on public.app_links(workspace_id);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'rulesets' and column_name = 'workspace_id') then
    alter table public.rulesets add column workspace_id uuid references public.workspaces(id) on delete cascade;
    create index if not exists rulesets_workspace_idx on public.rulesets(workspace_id);
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'legal_docs' and column_name = 'workspace_id') then
    alter table public.legal_docs add column workspace_id uuid references public.workspaces(id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'digital_certs' and column_name = 'workspace_id') then
    alter table public.digital_certs add column workspace_id uuid references public.workspaces(id) on delete cascade;
  end if;
end $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create or replace function public.increment_link_clicks(link_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.app_links
  set clicks = clicks + 1
  where id = link_id;
end;
$$;

grant execute on function public.increment_link_clicks(uuid) to authenticated;

create or replace function public.prune_audit_logs()
returns void
language sql
security definer
as $$
  delete from public.audit_logs
  where created_at < now() - interval '30 days';
$$;

create table if not exists public.allowed_emails (
  email text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_email_allowed(email_input text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_emails
    where lower(email) = lower(email_input)
      and is_active = true
  );
$$;

grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- =====================================================
-- TRIGGERS
-- =====================================================
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists app_links_set_updated_at on public.app_links;
create trigger app_links_set_updated_at
before update on public.app_links
for each row execute function public.set_updated_at();

drop trigger if exists rulesets_set_updated_at on public.rulesets;
create trigger rulesets_set_updated_at
before update on public.rulesets
for each row execute function public.set_updated_at();

drop trigger if exists legal_docs_set_updated_at on public.legal_docs;
create trigger legal_docs_set_updated_at
before update on public.legal_docs
for each row execute function public.set_updated_at();

drop trigger if exists digital_certs_set_updated_at on public.digital_certs;
create trigger digital_certs_set_updated_at
before update on public.digital_certs
for each row execute function public.set_updated_at();

drop trigger if exists home_recados_set_updated_at on public.home_recados;
create trigger home_recados_set_updated_at
before update on public.home_recados
for each row execute function public.set_updated_at();

-- =====================================================
-- CRON (AUDIT LOGS RETENTION)
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      create extension if not exists pg_cron with schema extensions;
    exception
      when insufficient_privilege then
        null;
    end;
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'prune_audit_logs_daily') then
      perform cron.schedule(
        'prune_audit_logs_daily',
        '0 3 * * *',
        $job$select public.prune_audit_logs();$job$
      );
    end if;
  end if;
end $$;

-- =====================================================
-- RLS ENABLE
-- =====================================================
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_links enable row level security;
alter table public.rulesets enable row level security;
alter table public.legal_docs enable row level security;
alter table public.digital_certs enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.entitlements enable row level security;
alter table public.bpo_clients enable row level security;
alter table public.bpo_tasks enable row level security;
alter table public.home_recados enable row level security;
alter table public.allowed_emails enable row level security;

-- =====================================================
-- POLICIES
-- =====================================================
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_insert_admin on public.profiles;

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

drop policy if exists audit_logs_select_admin on public.audit_logs;
drop policy if exists audit_logs_insert_auth on public.audit_logs;
drop policy if exists audit_logs_insert on public.audit_logs;

create policy audit_logs_select_admin on public.audit_logs
  for select using (public.is_admin());

create policy audit_logs_insert on public.audit_logs
  for insert with check (actor_user_id = auth.uid());

drop policy if exists app_links_select_active on public.app_links;
drop policy if exists app_links_admin_insert on public.app_links;
drop policy if exists app_links_admin_update on public.app_links;
drop policy if exists app_links_admin_delete on public.app_links;

create policy app_links_select_active on public.app_links
  for select using (is_active = true or public.is_admin());

create policy app_links_admin_insert on public.app_links
  for insert with check (public.is_admin());

create policy app_links_admin_update on public.app_links
  for update using (public.is_admin())
  with check (public.is_admin());

create policy app_links_admin_delete on public.app_links
  for delete using (public.is_admin());

drop policy if exists rulesets_select_auth on public.rulesets;
drop policy if exists rulesets_admin_insert on public.rulesets;
drop policy if exists rulesets_admin_update on public.rulesets;
drop policy if exists rulesets_admin_delete on public.rulesets;

create policy rulesets_select_auth on public.rulesets
  for select using ((select auth.uid()) is not null);

create policy rulesets_admin_insert on public.rulesets
  for insert with check (public.is_admin());

create policy rulesets_admin_update on public.rulesets
  for update using (public.is_admin())
  with check (public.is_admin());

create policy rulesets_admin_delete on public.rulesets
  for delete using (public.is_admin());

drop policy if exists legal_docs_select on public.legal_docs;
drop policy if exists legal_docs_insert on public.legal_docs;
drop policy if exists legal_docs_update on public.legal_docs;
drop policy if exists legal_docs_delete on public.legal_docs;

create policy legal_docs_select on public.legal_docs
  for select using (public.is_legalizacao());

create policy legal_docs_insert on public.legal_docs
  for insert with check (public.is_legalizacao());

create policy legal_docs_update on public.legal_docs
  for update using (public.is_legalizacao())
  with check (public.is_legalizacao());

create policy legal_docs_delete on public.legal_docs
  for delete using (public.is_legalizacao());

drop policy if exists digital_certs_select on public.digital_certs;
drop policy if exists digital_certs_insert on public.digital_certs;
drop policy if exists digital_certs_update on public.digital_certs;
drop policy if exists digital_certs_delete on public.digital_certs;

create policy digital_certs_select on public.digital_certs
  for select using (public.is_legalizacao());

create policy digital_certs_insert on public.digital_certs
  for insert with check (public.is_legalizacao());

create policy digital_certs_update on public.digital_certs
  for update using (public.is_legalizacao())
  with check (public.is_legalizacao());

create policy digital_certs_delete on public.digital_certs
  for delete using (public.is_legalizacao());

drop policy if exists workspace_owner_select on public.workspaces;
drop policy if exists workspace_owner_update on public.workspaces;
drop policy if exists workspace_owner_insert on public.workspaces;

create policy workspace_owner_select on public.workspaces
  for select using (owner_user_id = auth.uid());

create policy workspace_owner_update on public.workspaces
  for update using (owner_user_id = auth.uid());

create policy workspace_owner_insert on public.workspaces
  for insert with check (owner_user_id = auth.uid());

drop policy if exists settings_via_workspace on public.workspace_settings;
create policy settings_via_workspace on public.workspace_settings
  for all using (
    workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  );

drop policy if exists entitlements_via_workspace on public.entitlements;
create policy entitlements_via_workspace on public.entitlements
  for all using (
    workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  );

drop policy if exists bpo_clients_via_workspace on public.bpo_clients;
create policy bpo_clients_via_workspace on public.bpo_clients
  for all using (
    workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  );

drop policy if exists bpo_tasks_via_workspace on public.bpo_tasks;
create policy bpo_tasks_via_workspace on public.bpo_tasks
  for all using (
    workspace_id in (select id from public.workspaces where owner_user_id = auth.uid())
  );

drop policy if exists home_recados_select_auth on public.home_recados;
drop policy if exists home_recados_admin_insert on public.home_recados;
drop policy if exists home_recados_admin_update on public.home_recados;
drop policy if exists home_recados_admin_delete on public.home_recados;

create policy home_recados_select_auth on public.home_recados
  for select using (is_active = true or public.is_admin());

create policy home_recados_admin_insert on public.home_recados
  for insert with check (public.is_admin());

create policy home_recados_admin_update on public.home_recados
  for update using (public.is_admin())
  with check (public.is_admin());

create policy home_recados_admin_delete on public.home_recados
  for delete using (public.is_admin());

-- =====================================================
-- STORAGE BUCKETS + POLICIES
-- =====================================================
insert into storage.buckets (id, name, public)
values ('workspace-logos', 'workspace-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('home-recados', 'home-recados', true)
on conflict (id) do nothing;

drop policy if exists workspace_logos_upload on storage.objects;
drop policy if exists workspace_logos_read on storage.objects;

create policy workspace_logos_upload on storage.objects
  for insert with check (bucket_id = 'workspace-logos' and auth.uid() is not null);

create policy workspace_logos_read on storage.objects
  for select using (bucket_id = 'workspace-logos');

-- =====================================================
-- FUNCTION SEARCH_PATH SAFETY
-- =====================================================
alter function public.set_updated_at() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.is_legalizacao() set search_path = public;

-- =====================================================
-- SEED RULESETS
-- =====================================================
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

-- =====================================================
-- DONE
-- =====================================================
select 'Full setup completed successfully.' as status;
