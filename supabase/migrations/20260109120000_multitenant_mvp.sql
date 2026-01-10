-- Multi-tenant MVP Migration
-- Adds workspaces, settings, entitlements, and multi-tenant support

-- =============================================
-- 1. WORKSPACES
-- =============================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_path text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON public.workspaces(owner_user_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON public.workspaces(slug);

-- =============================================
-- 2. WORKSPACE SETTINGS
-- =============================================
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

-- =============================================
-- 3. ENTITLEMENTS (Lifetime Access)
-- =============================================
CREATE TABLE IF NOT EXISTS public.entitlements (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lifetime_access boolean NOT NULL DEFAULT false,
  lifetime_paid_at timestamptz NULL,
  abacate_billing_id text NULL,
  abacate_status text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 4. ADD workspace_id TO EXISTING TABLES
-- =============================================

-- Audit Logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audit_logs_workspace_idx ON public.audit_logs(workspace_id);

-- RuleSets
ALTER TABLE public.rulesets 
ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS rulesets_workspace_idx ON public.rulesets(workspace_id);

-- App Links
ALTER TABLE public.app_links 
ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS app_links_workspace_idx ON public.app_links(workspace_id);

-- Home Recados (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'home_recados') THEN
    ALTER TABLE public.home_recados 
    ADD COLUMN IF NOT EXISTS workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS home_recados_workspace_idx ON public.home_recados(workspace_id);
  END IF;
END $$;

-- =============================================
-- 5. LEGAL DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('CND', 'BOMBEIRO', 'SANITARIA', 'ALVARA')),
  issuer text NULL,
  number text NULL,
  issued_at date NULL,
  expires_at date NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'RENEWING')),
  notes text NULL,
  attachment_path text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_documents_workspace_idx ON public.legal_documents(workspace_id);
CREATE INDEX IF NOT EXISTS legal_documents_expires_idx ON public.legal_documents(expires_at);
CREATE INDEX IF NOT EXISTS legal_documents_type_idx ON public.legal_documents(type);
CREATE INDEX IF NOT EXISTS legal_documents_status_idx ON public.legal_documents(status);

-- =============================================
-- 6. DIGITAL CERTIFICATES
-- =============================================
CREATE TABLE IF NOT EXISTS public.digital_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NULL,
  type text NULL,
  expires_at date NOT NULL,
  owner text NULL,
  attachment_path text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_certificates_workspace_idx ON public.digital_certificates(workspace_id);
CREATE INDEX IF NOT EXISTS digital_certificates_expires_idx ON public.digital_certificates(expires_at);

-- =============================================
-- 7. BPO CLIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.bpo_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text NULL,
  segment text NULL,
  monthly_fee numeric NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bpo_clients_workspace_idx ON public.bpo_clients(workspace_id);
CREATE INDEX IF NOT EXISTS bpo_clients_active_idx ON public.bpo_clients(is_active);

-- =============================================
-- 8. BPO TASKS
-- =============================================
CREATE TABLE IF NOT EXISTS public.bpo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.bpo_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('CONTAS_PAGAR', 'CONTAS_RECEBER', 'CONCILIACAO', 'RELATORIOS', 'FECHAMENTO', 'OUTROS')),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'DONE', 'LATE')),
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bpo_tasks_workspace_idx ON public.bpo_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS bpo_tasks_client_idx ON public.bpo_tasks(client_id);
CREATE INDEX IF NOT EXISTS bpo_tasks_status_idx ON public.bpo_tasks(status);
CREATE INDEX IF NOT EXISTS bpo_tasks_due_idx ON public.bpo_tasks(due_date);

-- =============================================
-- 9. BPO SLA RULES
-- =============================================
CREATE TABLE IF NOT EXISTS public.bpo_sla_rules (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  default_due_days int NOT NULL DEFAULT 2,
  late_after_hours int NOT NULL DEFAULT 24,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 10. STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-logos', 'workspace-logos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-certificates', 'digital-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpo_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpo_sla_rules ENABLE ROW LEVEL SECURITY;

-- Workspaces: owner can do everything
CREATE POLICY "workspace_owner_select" ON public.workspaces
  FOR SELECT USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "workspace_owner_insert" ON public.workspaces
  FOR INSERT WITH CHECK (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "workspace_owner_update" ON public.workspaces
  FOR UPDATE USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "workspace_owner_delete" ON public.workspaces
  FOR DELETE USING (owner_user_id = (SELECT auth.uid()));

-- Workspace Settings: owner via workspace
CREATE POLICY "settings_owner_all" ON public.workspace_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- Entitlements: owner via workspace
CREATE POLICY "entitlements_owner_all" ON public.entitlements
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- Legal Documents: owner via workspace
CREATE POLICY "legal_docs_owner_all" ON public.legal_documents
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- Digital Certificates: owner via workspace
CREATE POLICY "digital_certs_owner_all" ON public.digital_certificates
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- BPO Clients: owner via workspace
CREATE POLICY "bpo_clients_owner_all" ON public.bpo_clients
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- BPO Tasks: owner via workspace
CREATE POLICY "bpo_tasks_owner_all" ON public.bpo_tasks
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- BPO SLA Rules: owner via workspace
CREATE POLICY "bpo_sla_owner_all" ON public.bpo_sla_rules
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- Audit Logs: owner via workspace (select only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_owner_select" ON public.audit_logs
  FOR SELECT USING (
    workspace_id IS NULL OR 
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RuleSets: owner via workspace
ALTER TABLE public.rulesets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rulesets_owner_all" ON public.rulesets
  FOR ALL USING (
    workspace_id IS NULL OR 
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- App Links: owner via workspace
ALTER TABLE public.app_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_links_owner_all" ON public.app_links
  FOR ALL USING (
    workspace_id IS NULL OR 
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid()))
  );

-- Storage policies for workspace-logos bucket
CREATE POLICY "workspace_logos_owner_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-logos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
));

CREATE POLICY "workspace_logos_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'workspace-logos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
));

CREATE POLICY "workspace_logos_owner_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'workspace-logos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
));

CREATE POLICY "workspace_logos_owner_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'workspace-logos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
));

-- =============================================
-- 12. TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER set_workspace_settings_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_bpo_sla_rules_updated_at
  BEFORE UPDATE ON public.bpo_sla_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
