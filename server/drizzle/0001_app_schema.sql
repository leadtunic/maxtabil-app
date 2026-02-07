CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON public.workspaces(owner_user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enabled_modules jsonb NOT NULL DEFAULT '{
    "financeiro": true,
    "financeiro_bpo": true,
    "dp": true,
    "fiscal_contabil": true,
    "legalizacao": true,
    "certificado_digital": true,
    "admin": true
  }'::jsonb,
  completed_onboarding boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.entitlements (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lifetime_access boolean NOT NULL DEFAULT false,
  lifetime_paid_at timestamptz,
  abacate_billing_id text,
  abacate_status text,
  mercadopago_preapproval_id text,
  mercadopago_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS lifetime_paid_at timestamptz;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN','FINANCEIRO','DP','FISCAL_CONTABIL','LEGALIZACAO_CERT')),
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profiles_active_idx ON public.profiles(is_active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE SET NULL,
  actor_user_id uuid NULL,
  actor_email text NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_email);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_logs_workspace_idx ON public.audit_logs(workspace_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.app_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  sector text NOT NULL DEFAULT 'GERAL',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS app_links_active_idx ON public.app_links(is_active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS app_links_order_idx ON public.app_links(sort_order);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS app_links_sector_idx ON public.app_links(sector);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS app_links_workspace_idx ON public.app_links(workspace_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_app_links_clicks ON public.app_links(clicks DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.rulesets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  simulator_key text NOT NULL CHECK (simulator_key IN ('HONORARIOS','RESCISAO','FERIAS','FATOR_R','SIMPLES_DAS')),
  name text NOT NULL,
  version int NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS rulesets_simulator_idx ON public.rulesets(simulator_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS rulesets_workspace_idx ON public.rulesets(workspace_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS rulesets_active_idx ON public.rulesets(simulator_key) WHERE is_active;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.legal_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  cnpj text NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('CND','BOMBEIRO_AVCB','SANITARIA','ALVARA')),
  issue_date date NULL,
  expiry_date date NOT NULL,
  notes text NULL,
  attachment_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS legal_docs_expiry_idx ON public.legal_docs(expiry_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS legal_docs_type_idx ON public.legal_docs(doc_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.digital_certs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  cnpj text NULL,
  cert_type text NOT NULL,
  provider text NULL,
  expiry_date date NOT NULL,
  notes text NULL,
  attachment_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS digital_certs_expiry_idx ON public.digital_certs(expiry_date);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.bpo_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text NULL,
  contact_name text NULL,
  contact_email text NULL,
  contact_phone text NULL,
  notes text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS bpo_clients_workspace_idx ON public.bpo_clients(workspace_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.bpo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.bpo_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  category text NOT NULL DEFAULT 'OUTROS',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  due_date date NULL,
  assigned_to text NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS bpo_tasks_workspace_idx ON public.bpo_tasks(workspace_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS bpo_tasks_client_idx ON public.bpo_tasks(client_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS bpo_tasks_status_idx ON public.bpo_tasks(status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.home_recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL REFERENCES public."user"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS home_recados_active_idx ON public.home_recados(is_active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS home_recados_sort_idx ON public.home_recados(sort_order);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
