# Arquitetura Atual - Maxtabil

## Visao geral
A aplicacao e uma SPA React (Vite + TypeScript) com Supabase como backend
(Auth, DB, Storage e Edge Functions). O fluxo principal e:
login -> onboarding -> paywall -> app.

## Estrutura do repositorio
- `src/`: app principal Vite (codigo fonte).
- `public/`: assets estaticos.
- `supabase/`: migrations, policies e edge functions.
- `maxtabil-app/`: copia/variante da app (nao usada pelos scripts da raiz).
- `frontend/`: artefato legado (build Next.js).
- `dist/`: build gerado.

## Frontend (Vite + React + TS)
- Entry: `src/main.tsx` -> `src/App.tsx`.
- UI: Tailwind + shadcn/ui em `src/components/ui`.
- Roteamento: `react-router-dom`.
- Layout: `src/components/layout/AppShell.tsx` (sidebar + topbar).
- Estado global: `src/contexts/AuthContext.tsx` (sessao, workspace, paywall).
- Analytics: PostHog (opcional).

## Fluxos principais
1) Login
   - Auth via Supabase.
   - Allowlist por email usando RPC `is_email_allowed` (tabela `allowed_emails`).
2) Onboarding
   - Cria workspace se nao existir.
   - Atualiza `workspace_settings` e opcionalmente upload de logo.
3) Paywall
   - Chama Edge Function `billing_create_lifetime`.
   - Redireciona para URL de pagamento (PIX).
4) App
   - AppShell faz o gate:
     - se nao autenticado -> `/login`
     - se onboarding incompleto -> `/onboarding`
     - se sem acesso pago -> `/paywall`

## Backend (Supabase)
### Auth
- Supabase Auth (email/password, OAuth).
- Allowlist: `public.allowed_emails` + funcao `public.is_email_allowed`.

### Banco de dados (tabelas principais)
- `profiles`: perfis e roles.
- `workspaces`: organizacao do escritorio.
- `workspace_settings`: modulos habilitados + onboarding.
- `entitlements`: acesso pago (lifetime).
- `bpo_clients`, `bpo_tasks`: BPO financeiro.
- `rulesets`: regras dos simuladores.
- `app_links`, `audit_logs`: links e auditoria.
- `legal_docs`, `digital_certs`: documentos e certificados.
- `home_recados`: cards da home.

### RLS e Policies
- RLS ativo nas tabelas principais.
- Policies por `auth.uid()` e por role (`is_admin`, `is_legalizacao`).

### Storage
- Buckets: `workspace-logos`, `home-recados`.
- Policies de upload/leitura em `storage.objects`.

## Edge Functions (Supabase)
Em `supabase/functions/`:
- `billing_create_lifetime`: cria cobranca AbacatePay (PIX).
- `abacatepay_webhook`: recebe atualizacoes de pagamento.
- `admin_*`: rotinas administrativas (criar/resetar/disable user).

Variaveis usadas nas functions (exemplos):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ABACATEPAY_API_KEY`
- `APP_BASE_URL`

## Integracao de pagamento (AbacatePay)
- O frontend chama a Edge Function `billing_create_lifetime`.
- A function cria a cobranca e retorna `paymentUrl`.
- Webhook atualiza `entitlements` e `audit_logs`.

## Analytics
- PostHog com envs `VITE_PUBLIC_POSTHOG_KEY` e `VITE_PUBLIC_POSTHOG_HOST`.
- Eventos principais: login, signup, onboarding.

## CI/CD
GitHub Actions:
- `CI`: lint + build em PR e push.
- `Vercel Deploy`: preview em PR e producao em push.

Secrets necessarios no GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Ambientes
Env local:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DEV_BYPASS_AUTH` (dev)
- `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST` (opcional)

Recomendado:
- Projetos Supabase separados para dev e prod.
- Variaveis separadas no Vercel.
