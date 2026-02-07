CREATE TABLE IF NOT EXISTS public.sector_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sector text NOT NULL CHECK (
    sector IN (
      'FINANCEIRO',
      'DP',
      'FISCAL_CONTABIL',
      'LEGALIZACAO',
      'CERTIFICADO_DIGITAL',
      'ADMIN',
      'GERAL'
    )
  ),
  metric_type text NOT NULL CHECK (metric_type IN ('FINANCEIRO', 'DEMANDAS')),
  target_value numeric(14,2) NOT NULL,
  achieved_value numeric(14,2) NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sector_goals_workspace_idx
  ON public.sector_goals(workspace_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sector_goals_active_idx
  ON public.sector_goals(is_active);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sector_goals_sector_idx
  ON public.sector_goals(sector);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sector_goals_metric_type_idx
  ON public.sector_goals(metric_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sector_goals_period_end_idx
  ON public.sector_goals(period_end DESC);
