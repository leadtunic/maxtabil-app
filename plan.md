PROMPT PARA CODEX — ESCOFER INTRANET (BASEADO NO ZIP ATUAL) — MVP SaaS ESCALÁVEL, 100% TIPADO, SEM CRM

Você está trabalhando no repositório Vite + React + TypeScript que está no ZIP “escofer 2.zip”.
Estrutura observada (pontos relevantes):
- App principal na raiz com `src/` e `vite.config.ts`.
- Supabase já existe em `src/lib/supabase.ts` e AuthContext em `src/contexts/AuthContext.tsx`.
- Rotas definidas em `src/App.tsx` (atualmente importando páginas que NÃO existem no ZIP).
- Sidebar e guarda de permissão por “roles” em:
  - `src/lib/authorization.ts`
  - `src/hooks/use-authorization.ts`
  - `src/components/layout/AppShell.tsx`
  - `src/components/layout/AppSidebar.tsx`
- Tipos em `src/types/index.ts` (inclui CRM, que deve ser removido do MVP).
- Migrations e edge functions existentes em `supabase/migrations/*` e `supabase/functions/admin_*` (fluxo de subusuários/admin deve ser REMOVIDO do MVP).
- Existe `src/pages/Login.tsx`, `src/pages/app/Home.tsx`, `src/pages/NotFound.tsx`. Muitas páginas importadas em `App.tsx` não existem e devem ser criadas/ajustadas.

OBJETIVO (MVP):
1) Transformar o projeto em um SaaS multi-escritório (multi-tenant) escalável, com:
   - Login por Google (OAuth) OU email+senha (Supabase Auth)
   - SEM feature de criar subusuários neste MVP
   - Um “workspace/escritório” por usuário (owner) no MVP
2) Paywall com pagamento ÚNICO via PIX (acesso vitalício) usando AbacatePay:
   - Criar cobrança PIX (ONE_TIME) e redirecionar para URL de pagamento
   - Webhook AbacatePay atualiza entitlement (lifetime_access=true) no workspace
   - App bloqueia acesso ao /app enquanto não estiver pago (exceto /onboarding e /paywall)
3) Personalização por escritório:
   - Upload de logo PNG para Supabase Storage e exibição na Sidebar/Topbar/Login
   - Seleção de módulos disponíveis no onboarding (nem todo escritório usa todos os setores)
4) Analytics com PostHog:
   - Capturar pageviews, login, início de checkout, pagamento confirmado, uso por módulo
5) “100% tipado”:
   - Ativar strict TS e ajustar o código para compilar sem `any` implícito, com tipos de Supabase bem definidos
6) Funcionalidades por setor (sem CRM):
   - Financeiro: manter Simulador de Honorários (já referenciado por hooks/rulesets), adicionar NOVA sub-funcionalidade “BPO” completa (estrutura + telas + DB)
   - Fiscal/Contábil: Fator R, Alíquota do DAS, Simulação Simples Antigo vs Novo (comparador de RuleSets)
   - Legalização: Controle de CND + vencimentos (Bombeiro, Sanitária, Alvará)
   - Certificado Digital: controle de vencimentos
   - Admin: “Regras de Cálculo” (RuleSets) deve funcionar corretamente; Auditoria deve existir; “Usuários” deve ser removido do MVP.

REQUISITOS IMPORTANTES:
- REMOVER CRM do plano e do código (rotas, sidebar, tipos, mocks, etc.).
- Remover a criação/gestão de subusuários do MVP (rotas/admin_usuarios, edge functions admin_* podem ser deletadas ou marcadas como deprecated e não referenciadas).
- Multi-tenant no banco: todas as entidades devem ter `workspace_id` e RLS deve garantir que o owner só veja seus dados.
- Performance RLS: onde usar `auth.uid()` dentro de policies, aplicar padrão `(select auth.uid())` quando fizer sentido.
- Padronizar env vars via Vite: usar `.env.local` e `.env.example` (não commitar secrets).
- O projeto deve buildar (`npm run build`) e rodar (`npm run dev`) após as mudanças.

====================================================================================================
ETAPA A — ENV + TIPAGEM + DEPENDÊNCIAS
1) Atualizar `.env.example` e documentar variáveis:
   - VITE_SUPABASE_URL=
   - VITE_SUPABASE_PUBLISHABLE_KEY=
   - VITE_POSTHOG_KEY=
   - VITE_POSTHOG_HOST= (default https://app.posthog.com)
   - VITE_APP_BASE_URL= (ex.: https://seuapp.com) usado p/ returnUrl/completionUrl
   - (NÃO VITE) ABACATEPAY_API_KEY= (somente em Edge Function env)
   - (NÃO VITE) ABACATEPAY_WEBHOOK_SECRET=
   - (NÃO VITE) ABACATEPAY_WEBHOOK_PUBLIC_HMAC_KEY= (se aplicável)
   - (NÃO VITE) SUPABASE_SERVICE_ROLE_KEY= (somente Edge Functions)
   Criar/usar `.env.local` no dev. Garantir que `.env` NÃO é trackeado (já está no .gitignore).

2) Adicionar dependências:
   - posthog-js
   - (opcional) zod já existe, usar para validações
   - manter stack shadcn/ui existente

3) Tornar TS 100% tipado:
   - Em `tsconfig.app.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true` (ajustar o necessário para compilar).
   - Em `tsconfig.json`: remover overrides que desligam strict.
   - Ajustar código onde quebrar (sem “as any” indiscriminado). Preferir tipos explícitos.

4) Tipos do Supabase:
   - Criar `src/types/supabase.ts` com interface `Database` cobrindo as tabelas do MVP (workspaces, workspace_settings, entitlements, rulesets, active_ruleset, audit_logs, app_links, legal_documents, digital_certificates, bpo_*).
   - Refatorar `src/lib/supabase.ts` para:
     `createClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true } })`
   - Tipar retornos nas queries React Query.

====================================================================================================
ETAPA B — BANCO (SUPABASE) MULTI-TENANT + ENTITLEMENT + MÓDULOS
Criar uma NOVA migration em `supabase/migrations/YYYYMMDDHHMMSS_multitenant_mvp.sql` que:
1) Cria tabela `workspaces`:
   - id uuid pk default gen_random_uuid()
   - owner_user_id uuid not null
   - name text not null
   - slug text unique not null
   - logo_path text null (storage path)
   - created_at timestamptz default now()
   Índices em owner_user_id e slug.

2) Cria tabela `workspace_settings`:
   - workspace_id uuid pk references workspaces(id) on delete cascade
   - enabled_modules jsonb not null default '{}'
     Exemplo: { "financeiro": true, "financeiro_bpo": true, "dp": true, "fiscal_contabil": true, "legalizacao": true, "certificado_digital": true, "admin": true }
   - completed_onboarding boolean not null default false
   - created_at timestamptz default now()
   - updated_at timestamptz default now()

3) Cria tabela `entitlements` (acesso vitalício):
   - workspace_id uuid pk references workspaces(id) on delete cascade
   - lifetime_access boolean not null default false
   - lifetime_paid_at timestamptz null
   - abacate_billing_id text null
   - abacate_status text null
   - updated_at timestamptz default now()

4) Auditoria multi-tenant:
   - Alterar `audit_logs` para adicionar `workspace_id uuid` (backfill/nullable -> depois not null).
   - Atualizar função `logAudit` no frontend para enviar workspace_id (pegar do contexto).

5) RuleSets multi-tenant:
   - Alterar `rulesets` e `active_ruleset` para adicionar `workspace_id uuid`.
   - Ajustar constraints e policies para filtrar por workspace.

6) Links e Home Recados multi-tenant (se usados):
   - `app_links`: adicionar `workspace_id uuid`.
   - `home_recados`: adicionar `workspace_id uuid`.
   - Storage buckets: criar bucket `workspace-logos` (privado) e manter `home-recados` se necessário.

7) Legalização + Certificado Digital:
   - Criar tabelas:
     a) `legal_documents`:
        - id uuid pk
        - workspace_id uuid not null
        - type text not null  (CND | BOMBEIRO | SANITARIA | ALVARA)
        - issuer text null
        - number text null
        - issued_at date null
        - expires_at date not null
        - status text not null default 'ACTIVE' (ACTIVE | EXPIRED | RENEWING)
        - notes text null
        - attachment_path text null
        - created_at timestamptz default now()
     b) `digital_certificates`:
        - id uuid pk
        - workspace_id uuid not null
        - name text not null
        - provider text null
        - type text null (A1 | A3 | eCNPJ | eCPF etc)
        - expires_at date not null
        - owner text null
        - attachment_path text null
        - created_at timestamptz default now()

8) Financeiro BPO:
   - Criar tabelas:
     a) `bpo_clients`:
        - id uuid pk
        - workspace_id uuid not null
        - name text not null
        - document text null (CNPJ/CPF)
        - segment text null
        - monthly_fee numeric null
        - is_active boolean default true
        - created_at timestamptz default now()
     b) `bpo_tasks`:
        - id uuid pk
        - workspace_id uuid not null
        - client_id uuid references bpo_clients(id) on delete cascade
        - title text not null
        - category text not null (ex: CONTAS_PAGAR | CONTAS_RECEBER | CONCILIACAO | RELATORIOS | FECHAMENTO)
        - due_date date not null
        - status text not null default 'OPEN' (OPEN | IN_PROGRESS | DONE | LATE)
        - priority text default 'MEDIUM' (LOW|MEDIUM|HIGH)
        - created_at timestamptz default now()
     c) `bpo_sla_rules`:
        - workspace_id uuid pk
        - default_due_days int not null default 2
        - late_after_hours int not null default 24
        - updated_at timestamptz default now()

9) RLS (Row Level Security):
   - Habilitar RLS nas novas tabelas e atualizar antigas.
   - Política padrão: usuário autenticado só pode SELECT/INSERT/UPDATE/DELETE em linhas cujo workspace_id pertence ao workspace onde owner_user_id = auth.uid().
   - Para tabelas sem workspace_id (idealmente nenhuma no MVP), não permitir acesso.
   - Remover dependência de roles (ADMIN/FINANCEIRO etc) para o MVP.

10) Backfill / compatibilidade:
   - Se existirem dados em `profiles`, manter tabela mas o app não deve depender dela para permissões.
   - App deve criar workspace automaticamente no primeiro login.

====================================================================================================
ETAPA C — EDGE FUNCTIONS (SUPABASE) PARA ABACATEPAY
Criar duas Edge Functions novas em `supabase/functions/`:

1) `supabase/functions/billing_create_lifetime/index.ts`
   Responsabilidade:
   - Requer usuário autenticado (validar JWT).
   - Determinar workspace atual do usuário (owner_user_id = auth.uid()).
   - Criar cobrança AbacatePay via:
     POST https://api.abacatepay.com/v1/billing/create
     Authorization: Bearer ABACATEPAY_API_KEY
     Body:
       frequency: "ONE_TIME"
       methods: ["PIX"]
       products: [{ externalId: "lifetime", name: "Acesso Vitalício ESCOFER Intranet", description: "...", quantity: 1, price: LIFETIME_PRICE_CENTS }]
       returnUrl: `${VITE_APP_BASE_URL}/paywall`
       completionUrl: `${VITE_APP_BASE_URL}/billing/completed`
       customer: { name, email, taxId? } (usar dados disponíveis)
       externalId: `${workspace_id}:${auth.uid()}:${timestamp}`
       metadata: { workspace_id, user_id }
   - Persistir em `entitlements`:
     abacate_billing_id, abacate_status="PENDING", updated_at
   - Retornar JSON: { paymentUrl, billingId }

   Preço recomendado para MVP: LIFETIME_PRICE_CENTS = 99700 (R$ 997,00)

2) `supabase/functions/abacatepay_webhook/index.ts`
   Responsabilidade:
   - Endpoint público POST.
   - Validar `webhookSecret` via query param e comparar com ABACATEPAY_WEBHOOK_SECRET.
   - Validar assinatura HMAC-SHA256 do corpo bruto com header `X-Webhook-Signature` (usar timingSafeEqual).
   - Se evento for `billing.paid`, extrair billing.id e metadata.workspace_id (ou localizar por abacate_billing_id).
   - Atualizar `entitlements`:
     lifetime_access=true, lifetime_paid_at=now(), abacate_status="PAID", updated_at=now()
   - Registrar auditoria e/ou tabela `billing_events` (opcional) com payload bruto para debugging.

Observação:
- Nunca expor ABACATEPAY_API_KEY no frontend (somente edge function env).

====================================================================================================
ETAPA D — AUTH + WORKSPACE CONTEXT + GATES (ONBOARDING/PAYWALL)
1) Refatorar `src/contexts/AuthContext.tsx`:
   - Remover dependência obrigatória de `profiles` e role-based permissions.
   - Novo estado no contexto:
     - session/user (supabase)
     - workspace (id, name, slug, logo_path)
     - settings (enabled_modules, completed_onboarding)
     - entitlement (lifetime_access)
     - flags: isLoading, isAuthenticated
   - Após login (email+senha ou Google):
     a) Buscar workspace do owner_user_id = user.id
     b) Se não existir, criar (slug derivado do email/empresa) + criar workspace_settings + entitlements
     c) Carregar settings + entitlement
   - Expor helpers:
     - refreshWorkspace()
     - hasModule(moduleKey)
     - ensureReady() (carrega workspace + gates)

2) Login:
   - Em `src/pages/Login.tsx`:
     - Remover restrição de domínio @escofer.com.br
     - Adicionar botão “Entrar com Google” chamando `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`
     - Manter email+senha (login) e adicionar fluxo mínimo de “criar conta” (signUp) com confirmação (se necessário).
     - Logo e textos devem ser neutros (produto SaaS), não “intranet corporativa ESCOFER”.
     - Se workspace já tiver logo_path, usar logo do workspace (fallback padrão).

3) Gates:
   - Criar páginas:
     - `src/pages/Onboarding.tsx` (route /onboarding)
     - `src/pages/Paywall.tsx` (route /paywall)
     - `src/pages/BillingCompleted.tsx` (route /billing/completed)
   - Atualizar `src/components/layout/AppShell.tsx`:
     - Se !auth: redirect /login
     - Se auth e !settings.completed_onboarding: redirect /onboarding
     - Se onboarding ok e !entitlement.lifetime_access: redirect /paywall
     - Somente então renderiza layout.
   - `BillingCompleted`:
     - Mostrar “Pagamento em processamento” e poll (a cada 3s por até 60s) buscando entitlements
     - Quando lifetime_access=true, redirecionar /app e toast de sucesso

4) Remover autorização por role:
   - Deletar ou refatorar:
     - `src/lib/authorization.ts`
     - `src/hooks/use-authorization.ts`
   - Substituir por `hasModule()` baseado em workspace_settings.enabled_modules
   - Atualizar `AppSidebar.tsx` e `Home.tsx` para mostrar somente módulos habilitados.

====================================================================================================
ETAPA E — POSTHOG ANALYTICS
1) Criar `src/lib/analytics.ts`:
   - initPosthog() usando VITE_POSTHOG_KEY e VITE_POSTHOG_HOST
   - identify(user.id, { email, workspace_id })
   - track(event, props)
2) Em `src/main.tsx` ou `src/App.tsx`:
   - Inicializar PostHog uma vez
   - Track pageviews no change de rota (react-router useLocation)
3) Eventos mínimos:
   - auth_login_success
   - onboarding_completed
   - paywall_opened
   - checkout_started (ao chamar billing_create_lifetime)
   - billing_paid (quando detectar entitlement ativo)
   - module_opened (financeiro, bpo, fiscal_contabil, legalizacao, certificado_digital, admin)
   - simulator_run (honorarios, fator_r, das, comparador_simples)

====================================================================================================
ETAPA F — ROTAS E PÁGINAS (CRIAR O QUE NÃO EXISTE)
1) Atualizar `src/App.tsx` para refletir apenas páginas reais e MVP sem CRM:
   Rotas:
   - /login
   - /onboarding
   - /paywall
   - /billing/completed
   - /app (AppShell)
     - index: Home
     - /app/financeiro/honorarios
     - /app/financeiro/bpo (dashboard)
     - /app/financeiro/bpo/clients
     - /app/financeiro/bpo/tasks
     - /app/fiscal-contabil (com tabs: fator-r, das, comparador)
     - /app/legalizacao (lista/CRUD de documentos e vencimentos)
     - /app/certificado-digital (lista/CRUD de vencimentos)
     - /app/admin/regras (RuleSets)
     - /app/admin/links
     - /app/admin/auditoria
     - /app/configuracoes (workspace: logo, módulos, guia, etc.)
   Remover completamente rotas /app/crm/* e /app/admin/usuarios.

2) Criar as páginas faltantes em `src/pages/app/...`:
   - `src/pages/app/financeiro/SimuladorHonorarios.tsx`
     * Usar RuleSet HONORARIOS (buscar do DB; fallback default de `src/lib/rulesets.ts`)
     * Calcular honorário e gerar resumo
     * Logar auditoria e track analytics
   - `src/pages/app/financeiro/bpo/*` (Dashboard, Clients, Tasks)
     * CRUD com React Query + Supabase
     * Dashboard simples: tarefas abertas, atrasadas, vencendo em X dias, por cliente
   - `src/pages/app/fiscal-contabil/FiscalContabil.tsx`
     * Tabs:
       - Fator R: recebe RBT12 e Folha12, calcula ratio e anexo (RuleSet FATOR_R)
       - DAS: recebe RBT12 e RPA, escolhe anexo (I..V), calcula alíquota efetiva e DAS (RuleSet SIMPLES_DAS)
       - Comparador: compara dois ruleSets (versões) e mostra diferença (tabela)
   - `src/pages/app/legalizacao/Legalizacao.tsx`
     * CRUD `legal_documents` + destaque vencidos + filtro por tipo
   - `src/pages/app/certificado-digital/CertificadoDigital.tsx`
     * CRUD `digital_certificates` + alertas (30/15/7 dias)
   - Admin:
     * `src/pages/app/admin/AdminRegras.tsx`:
       - LISTA ruleSets por key e versão
       - Criar nova versão (payload JSON validado por zod schemas de `src/lib/rulesets.ts`)
       - Setar versão ativa (update em active_ruleset)
       - Esse módulo hoje “não funciona”: corrigir o fluxo completo (CRUD + ativo + validação + feedback)
     * `src/pages/app/admin/AdminLinks.tsx`:
       - CRUD `app_links` por workspace
     * `src/pages/app/admin/AdminAuditoria.tsx`:
       - Listar audit_logs do workspace com filtros (data, ação, entidade)
   - Configurações:
     * `src/pages/app/Configuracoes.tsx`:
       - Upload logo (storage workspace-logos)
       - Selecionar módulos habilitados (update workspace_settings.enabled_modules)
       - Resetar/abrir Guia de Uso (tour)

3) Atualizar `src/pages/app/Home.tsx`:
   - Remover card de CRM
   - Inserir cards por módulo habilitado (incluindo BPO)
   - Ajustar “recados” para ser por workspace (workspace_id) e apenas owner pode gerenciar (não por role)

4) Atualizar `src/components/layout/AppSidebar.tsx`:
   - Remover seção CRM
   - Remover “Usuários”
   - Renderizar itens baseado em `hasModule()`
   - Exibir logo do workspace (signed URL) com fallback em `/logoescof.png`

====================================================================================================
ETAPA G — GUIA DE USO (POP-UP)
1) Criar componente `src/components/guide/GuideDialog.tsx`:
   - Modal com passos por módulo (texto curto + links)
   - Botão “Não mostrar novamente”
2) Persistência:
   - No MVP, usar `localStorage` com chave `guide_seen::<workspace_id>::<module>`
   - (Opcional) sincronizar em tabela `workspace_guide_state`
3) Mostrar automaticamente ao entrar no módulo pela primeira vez e permitir abrir manualmente pelo Topbar (“Ajuda”).

====================================================================================================
ETAPA H — LIMPEZA: REMOVER CRM + SUBUSUÁRIOS
1) Remover do frontend:
   - Rotas /app/crm/*
   - `src/lib/crm.ts` (se existir)
   - Tipos CRM em `src/types/index.ts`
   - Menus/links CRM em Home e Sidebar
2) Remover do MVP:
   - Rotas e páginas AdminUsuarios
   - Calls e UI de “criar usuário”
3) Edge functions admin_*:
   - Podem ser deletadas OU mantidas mas não referenciadas (preferência: deletar e limpar).
4) Ajustar `src/types/index.ts`:
   - Remover qualquer tipo de CRM
   - Revisar tipos para refletir DB novo (workspace, settings, entitlements, bpo, legal docs, certs)

====================================================================================================
CRITÉRIOS DE ACEITE (DEVE PASSAR)
- `npm run build` sem erros TypeScript (strict true).
- Login com Google e email+senha funcionando.
- Primeiro login cria workspace + settings + entitlement automaticamente.
- Onboarding obrigatório (nome, módulos, logo opcional). Após concluir, app segue para paywall.
- Paywall cria cobrança PIX via Edge Function, redireciona para URL.
- Webhook AbacatePay marca entitlement como pago e libera acesso.
- Sidebar/Home exibem apenas módulos habilitados.
- Admin/Regras CRUD de RuleSets funciona (criar versão, validar payload, setar ativo, simuladores usam o ativo).
- BPO (clients + tasks) CRUD funciona e respeita workspace_id.
- Legalização e Certificado Digital CRUD e alertas de vencimento funcionam.
- PostHog capturando eventos básicos e pageviews.
- CRM inexistente no build (sem rotas, sem menu, sem tipos).

ENTREGÁVEIS
- Código implementado + migrations novas + edge functions novas.
- Ajustes de rotas e páginas criadas.
- Atualização de `.env.example` e doc mínima no README com setup local (Supabase + env + webhooks).

# CODEX PROMPT — Criar Landing Page moderna e corporativa (Vite + React + Tailwind + shadcn/ui)

Contexto:
- Projeto atual: Vite + React + TS + Tailwind + shadcn/ui.
- Já existem rotas /login e /app.
- Precisamos de uma landing pública em `/` (sem CRM).
- A landing deve ser moderna, corporativa, responsiva e com animações discretas.
- Deve direcionar conversão para /login (onboarding depois). 
- Integrar analytics (PostHog) para cliques em CTAs (se já existir `src/lib/analytics.ts`, use; senão crie).

## 1) Rotas
1. Em `src/App.tsx`, adicionar rota pública:
   - `/` -> `src/pages/Landing.tsx`
2. Se o usuário estiver autenticado e já tiver entitlement ativo, opcionalmente:
   - manter landing acessível, mas mostrar CTA “Ir para o painel”
   - NÃO forçar redirect automático (evita bloquear marketing).

## 2) Criar `src/pages/Landing.tsx`
Implementar as seções:
- Header fixo com logo do produto + anchors (Produto, Módulos, Como funciona, Preço, Segurança, FAQ)
- Hero (headline/subheadline/CTAs + bullets)
- Seção “O que você resolve” (cards)
- Seção “Módulos” (grid de cards com ícones lucide-react)
- “Como funciona” (4 steps)
- “Segurança e Governança” (cards com textos)
- “Preço” (1 card: Acesso Vitalício via PIX – preço configurável em constante)
- FAQ (Accordion shadcn/ui)
- Footer

Diretrizes de estilo:
- Visual corporativo: fundo claro com seções alternadas, bordas suaves, sombras leves, tipografia forte.
- Use Tailwind e shadcn (Card, Button, Badge, Accordion, Separator).
- Adicione animações discretas com framer-motion (fade/slide) apenas em entradas de seção.
- Mobile-first: header com menu colapsável (Sheet/Drawer shadcn) no mobile.

## 3) Componentes auxiliares
Criar componentes se necessário:
- `src/components/landing/LandingHeader.tsx`
- `src/components/landing/Section.tsx` (container com padding e id para anchors)
- `src/components/landing/PricingCard.tsx`
- `src/components/landing/FAQ.tsx`

## 4) Copy (usar exatamente ou muito próximo)
Headline:
- "A operação do seu escritório, centralizada e padronizada."

Subheadline:
- "Simuladores fiscais e trabalhistas, BPO financeiro e controle de vencimentos em um painel único. Personalize módulos e identidade do seu escritório em minutos."

Bullets:
- "Setup rápido"
- "Módulos sob medida"
- "Auditoria e rastreabilidade"
- "Acesso vitalício via PIX"

Módulos:
- Financeiro (Honorários)
- Financeiro (BPO)
- Fiscal/Contábil (Fator R, DAS, Comparador)
- DP (Férias e Rescisão)
- Legalização (CND, Bombeiro, Sanitária, Alvará)
- Certificado Digital (Vencimentos)

Pricing:
- Título: "Acesso Vitalício"
- Sub: "Pagamento único via PIX"
- Itens:
  - "Acesso vitalício ao painel"
  - "Módulos configuráveis por escritório"
  - "Auditoria e dados estruturados"
- CTA: "Começar agora" -> /login
- Exibir preço em constante `LIFETIME_PRICE = 997`

FAQ:
- "Posso escolher apenas alguns módulos?" -> sim, no onboarding.
- "Posso usar minha própria logo?" -> sim, upload na configuração inicial.
- "O pagamento é recorrente?" -> não, é pagamento único via PIX.
- "Meus dados ficam isolados?" -> sim, por workspace/escritório com políticas de acesso.

## 5) Analytics (PostHog)
- Capturar eventos:
  - `landing_cta_click` com props { cta: "primary"|"secondary"|"login"|"pricing" }
  - `landing_section_view` opcional
Se existir `track()` em `src/lib/analytics.ts`, usar. Se não existir, criar wrapper.

## 6) SEO básico
- Atualizar `index.html`:
  - title, meta description, og:title, og:description
- Opcional: adicionar favicon e social image (placeholders em `public/`).

## 7) Remover CRM do UI
- Garantir que não existe nenhum item de CRM na landing nem no menu.
- Se existirem imports/tipos de CRM no projeto, não usar aqui.

Entrega:
- Landing acessível em `/`
- Responsiva e com aparência corporativa
- CTAs funcionando e rastreados
- Build sem erros TypeScript

MÓDULOS ADICIONAIS (além do Core):
- Operação:
  - Agenda de Obrigações e Prazos (calendário + tarefas por cliente + alertas)
  - Checklists Operacionais por Cliente (fechamentos mensais por setor)
  - Motor de Alertas e Notificações (in-app e e-mail; regras por módulo)
- Gestão:
  - Painel de Indicadores do Escritório (pendências, vencimentos, volume BPO)
  - Base de Cálculo e Tabelas do Escritório (parâmetros versionáveis usados pelos simuladores)
- Documentos:
  - Central de Documentos e Evidências (storage por cliente com tags e busca)
Observação: “Portal do Cliente” fica como P2 (não implementar no MVP).
