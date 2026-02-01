ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    role IN (
      'ADMIN',
      'FINANCEIRO',
      'DP',
      'FISCAL_CONTABIL',
      'LEGALIZACAO_CERT',
      'FINANCEIRO_SENIOR',
      'FINANCEIRO_JUNIOR',
      'VENDEDOR_SENIOR',
      'VENDEDOR_JUNIOR',
      'COMPRADOR'
    )
  );

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE public.workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE public.workspace_members
  ADD CONSTRAINT workspace_members_role_check CHECK (
    role IN (
      'ADMIN',
      'FINANCEIRO',
      'DP',
      'FISCAL_CONTABIL',
      'LEGALIZACAO_CERT',
      'FINANCEIRO_SENIOR',
      'FINANCEIRO_JUNIOR',
      'VENDEDOR_SENIOR',
      'VENDEDOR_JUNIOR',
      'COMPRADOR'
    )
  );

CREATE INDEX IF NOT EXISTS workspace_members_user_idx
  ON public.workspace_members(user_id);
