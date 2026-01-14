-- Allowed emails allowlist (pre-login check)
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_email_allowed(email_input text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_emails
    WHERE lower(email) = lower(email_input)
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO anon, authenticated;
