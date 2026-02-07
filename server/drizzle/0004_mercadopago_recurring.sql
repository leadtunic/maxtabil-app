ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id text;
--> statement-breakpoint
ALTER TABLE public.entitlements
  ADD COLUMN IF NOT EXISTS mercadopago_status text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS entitlements_mp_preapproval_idx
  ON public.entitlements(mercadopago_preapproval_id);
