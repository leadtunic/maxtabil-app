# Arquitetura Atual - Maxtabil (VPS + Dokploy + PostgreSQL)

## Visao geral
A aplicacao e uma SPA React (Vite + TypeScript) hospedada em VPS, com deploy
via Dokploy e backend proprio. O banco e PostgreSQL puro, sem Supabase.
Autenticacao e sessao sao gerenciadas pelo Better Auth no backend.
Fluxo principal:
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
   - Auth via Better Auth (email/senha e/ou OAuth).
   - Allowlist por email via backend (consulta `allowed_emails` no Postgres).
2) Onboarding
   - Cria workspace se nao existir.
   - Atualiza `workspace_settings` e opcionalmente upload de logo.
3) Paywall
   - Chama endpoint da API `billing_create_lifetime`.
   - Redireciona para URL de pagamento (PIX).
4) App
   - AppShell faz o gate:
     - se nao autenticado -> `/login`
     - se onboarding incompleto -> `/onboarding`
     - se sem acesso pago -> `/paywall`

## Backend (API + PostgreSQL)
### Auth
- Better Auth com sessoes e cookies HTTP-only.
- OAuth (Google) e email/senha configurados no backend.
- Allowlist: `public.allowed_emails` (checado no backend).

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
- RLS opcional nas tabelas principais.
- Isolamento multi-tenant garantido pelo backend via `workspace_id`.

### Storage
- Armazenamento via S3/MinIO ou filesystem com URLs assinadas.

## API/Worker (substitui Edge Functions)
- `billing_create_lifetime`: cria cobranca AbacatePay (PIX).
- `abacatepay_webhook`: recebe atualizacoes de pagamento.
- Rotinas administrativas ficam no backend (sem Edge Functions).

Variaveis usadas no backend (exemplos):
- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (ou equivalente do Better Auth)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `ABACATEPAY_API_KEY`
- `APP_BASE_URL`

## Integracao de pagamento (AbacatePay)
- O frontend chama o endpoint da API `billing_create_lifetime`.
- A API cria a cobranca e retorna `paymentUrl`.
- Webhook atualiza `entitlements` e `audit_logs`.

## Analytics
- PostHog com envs `VITE_PUBLIC_POSTHOG_KEY` e `VITE_PUBLIC_POSTHOG_HOST`.
- Eventos principais: login, signup, onboarding.

## Deploy (Dokploy)
- Deploy via Dokploy (Nixpacks).
- Servicos: frontend (Vite build + preview ou Nginx), backend API, PostgreSQL.
- Reverse proxy e TLS gerenciados no Dokploy.

## Ambientes
Frontend (build-time):
- `VITE_API_BASE_URL`
- `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST` (opcional)

Backend (runtime):
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `ABACATEPAY_API_KEY`
- `APP_BASE_URL`

Recomendado:
- Instancias separadas (dev/prod) no Dokploy.
- Variaveis separadas por ambiente.
