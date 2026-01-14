-- =====================================================
-- MIGRATION SAFE - Ignora erros de objetos já existentes
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- Criar tabela workspaces se não existir
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON public.workspaces(owner_user_id);

-- Criar tabela workspace_settings se não existir
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

-- Criar tabela entitlements se não existir
CREATE TABLE IF NOT EXISTS public.entitlements (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lifetime_access boolean NOT NULL DEFAULT false,
  abacate_billing_id text,
  abacate_status text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Adicionar workspace_id nas tabelas existentes (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.audit_logs ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_links' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.app_links ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rulesets' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.rulesets ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_docs' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.legal_docs ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'digital_certs' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.digital_certs ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- BPO Clients
CREATE TABLE IF NOT EXISTS public.bpo_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bpo_clients_workspace_idx ON public.bpo_clients(workspace_id);

-- BPO Tasks
CREATE TABLE IF NOT EXISTS public.bpo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.bpo_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  due_date date,
  assigned_to text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bpo_tasks_workspace_idx ON public.bpo_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS bpo_tasks_client_idx ON public.bpo_tasks(client_id);
CREATE INDEX IF NOT EXISTS bpo_tasks_status_idx ON public.bpo_tasks(status);

-- Home recados (se não existir)
CREATE TABLE IF NOT EXISTS public.home_recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES (com DROP IF EXISTS para evitar erros)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpo_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_recados ENABLE ROW LEVEL SECURITY;

-- Dropar policies existentes e recriar
DROP POLICY IF EXISTS "workspace_owner_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_owner_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_owner_insert" ON public.workspaces;

CREATE POLICY "workspace_owner_select" ON public.workspaces
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "workspace_owner_update" ON public.workspaces
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "workspace_owner_insert" ON public.workspaces
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- Workspace Settings policies
DROP POLICY IF EXISTS "settings_via_workspace" ON public.workspace_settings;
CREATE POLICY "settings_via_workspace" ON public.workspace_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
  );

-- Entitlements policies
DROP POLICY IF EXISTS "entitlements_via_workspace" ON public.entitlements;
CREATE POLICY "entitlements_via_workspace" ON public.entitlements
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
  );

-- BPO Clients policies
DROP POLICY IF EXISTS "bpo_clients_via_workspace" ON public.bpo_clients;
CREATE POLICY "bpo_clients_via_workspace" ON public.bpo_clients
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
  );

-- BPO Tasks policies
DROP POLICY IF EXISTS "bpo_tasks_via_workspace" ON public.bpo_tasks;
CREATE POLICY "bpo_tasks_via_workspace" ON public.bpo_tasks
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
  );

-- RuleSets select policy (evita reavaliar auth.uid por linha)
DROP POLICY IF EXISTS "rulesets_select_auth" ON public.rulesets;
CREATE POLICY "rulesets_select_auth" ON public.rulesets
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- Home recados policies
DROP POLICY IF EXISTS "home_recados_select_auth" ON public.home_recados;
DROP POLICY IF EXISTS "home_recados_admin_insert" ON public.home_recados;
DROP POLICY IF EXISTS "home_recados_admin_update" ON public.home_recados;
DROP POLICY IF EXISTS "home_recados_admin_delete" ON public.home_recados;

CREATE POLICY "home_recados_select_auth" ON public.home_recados
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "home_recados_admin_insert" ON public.home_recados
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "home_recados_admin_update" ON public.home_recados
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "home_recados_admin_delete" ON public.home_recados
  FOR DELETE USING (public.is_admin());

-- Audit logs: evitar policy permissiva
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (actor_user_id = auth.uid());

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Criar buckets (ignora se já existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-logos', 'workspace-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('home-recados', 'home-recados', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "workspace_logos_upload" ON storage.objects;
DROP POLICY IF EXISTS "workspace_logos_read" ON storage.objects;

CREATE POLICY "workspace_logos_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'workspace-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "workspace_logos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'workspace-logos');

-- =====================================================
-- SECURITY: search_path fix para funcoes
-- =====================================================
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_legalizacao() SET search_path = public;

-- =====================================================
-- DONE!
-- =====================================================
SELECT 'Migration completed successfully!' as status;
