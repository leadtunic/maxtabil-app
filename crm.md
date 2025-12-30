PROMPT PARA CODEX — IMPLEMENTAR SETOR “CRM” NA INTRANET (LEADS WHATSAPP + AGENTE IA + PIPELINE + BI)

Contexto
- Já existe uma intranet com FRONTEND pronto (assumir Next.js + TypeScript + Tailwind/shadcn, mas adaptar se necessário).
- Precisamos criar um novo “Setor CRM” dentro da intranet, com backend + banco + integrações.
- Origem principal de leads: anúncios Meta (Instagram/Facebook) “Click to WhatsApp”, onde o usuário inicia conversa. O agente de IA atende e qualifica.
- Requisitos críticos:
  1) O lead inicia a conversa pelo WhatsApp (opt-in implícito via click-to-chat). O sistema não deve fazer disparo frio.
  2) O agente deve ser “humano” na escrita, porém SEM mentir: sempre se identificar como assistente virtual.
  3) Todos os dados (leads, conversas, qualificação, clientes ativos) ficam registrados no CRM.
  4) Após qualificação, lead é encaminhado ao setor de vendas (pipeline/kanban + regras de roteamento).
  5) Adicionar BI por cliente (dashboards de métricas e recomendações estratégicas).
  6) Integração WhatsApp: implementar Cloud API oficial como padrão; suportar providers opcionais (Z-API/Evolution QR) via feature flag, desativados por padrão.

Assunções técnicas (se o projeto não for assim, adaptar mantendo o escopo)
- Next.js App Router (ou equivalente) para frontend e rotas de API.
- Banco: Postgres (Supabase ou Postgres “puro” via Docker).
- ORM: Prisma.
- Fila/Jobs: opcional (BullMQ + Redis) para processar webhooks de forma resiliente (recomendado).
- Autenticação intranet: já existe; integrar permissões (Admin, Vendas, Operação/CS, Leitura).

Entrega esperada
1) Um módulo CRM completo (UI + API + DB + integrações).
2) Um módulo “WhatsApp Gateway” (provider oficial Cloud API + abstração para outros).
3) Um “AI Conversation Orchestrator” (estado de conversa, prompts, ferramentas, persistência, handoff).
4) BI por cliente e BI do funil.
5) Páginas, rotas, migrations, seeds e documentação README (setup local + env vars + checklist).

────────────────────────────────────────────────────────
PARTE A — MODELAGEM DE DADOS (Prisma)
Criar schema Prisma com entidades mínimas:

- User (já existe) — apenas referenciar.
- Lead
  - id, createdAt, updatedAt
  - source: 'META_ADS' | 'ORGANIC' | 'REFERRAL' | 'IMPORT'
  - sourceMeta: json (utm, campaign, adset, ad, refCode extraído do texto etc.)
  - status: 'NEW' | 'IN_QUALIFICATION' | 'MQL' | 'SQL' | 'DISQUALIFIED' | 'CLIENT'
  - tier: 'A'|'B'|'C'|'D' (opcional, calculado)
  - companyName (nullable)
  - phoneE164 (unique)
  - email (nullable)
  - cnpj (nullable)
  - cnae (nullable)
  - city, state (nullable)
  - tags: string[]
  - score: int (0-100)
  - ownerSalesUserId (nullable)
  - lastContactAt, nextFollowUpAt (nullable)

- Consent
  - id, leadId
  - channel: 'WHATSAPP'
  - status: 'GRANTED'|'REVOKED'
  - evidenceType: 'INBOUND_MESSAGE'|'FORM'|'OTHER'
  - evidence: json (messageId, snippet, timestamp, ref, etc.)
  - createdAt

- Conversation
  - id, leadId
  - channel: 'WHATSAPP'
  - provider: 'CLOUD_API'|'ZAPI'|'EVOLUTION'
  - providerInstanceId (nullable)
  - status: 'OPEN'|'WAITING_USER'|'WAITING_AGENT'|'HANDOFF'|'CLOSED'
  - state: json (state machine do agente: etapaAtual, slots coletados, etc.)
  - lastMessageAt

- Message
  - id, conversationId
  - direction: 'IN'|'OUT'
  - kind: 'TEXT'|'IMAGE'|'AUDIO'|'SYSTEM'
  - bodyText (nullable)
  - raw: json (payload completo)
  - providerMessageId (nullable)
  - createdAt

- Deal (Pipeline)
  - id, leadId
  - stage: 'NEW'|'QUALIFYING'|'SCHEDULED'|'PROPOSAL'|'NEGOTIATION'|'WON'|'LOST'
  - valueCents (nullable)
  - probability (0-100)
  - assignedToUserId (nullable)
  - closeReason (nullable)
  - createdAt, updatedAt

- Task
  - id, leadId (nullable), dealId (nullable)
  - type: 'CALL'|'WHATSAPP'|'EMAIL'|'MEETING'|'DOCS'
  - title, dueAt, doneAt (nullable)
  - assignedToUserId (nullable)

- Client
  - id, leadId (unique)  // quando vira cliente
  - contractStatus: 'ACTIVE'|'PAUSED'|'CANCELLED'
  - plan: 'MEI'|'SIMPLES'|'PRESUMIDO'|'REAL'|'CUSTOM'
  - monthlyFeeCents (nullable)
  - startAt, endAt (nullable)

- ClientBI (Insights)
  - id, clientId
  - period (YYYY-MM) ou dateRange
  - metrics: json (kpis: tempo_resposta, conversões, pendências, etc.)
  - recommendations: json (texto do agente BI com ações sugeridas)
  - createdAt

- AuditLog
  - id, actorUserId (nullable), actorSystem ('AGENT'|'WEBHOOK' etc.)
  - action, entity, entityId, metadata json, createdAt

Rodar migrations, seed básico com stages do pipeline.

────────────────────────────────────────────────────────
PARTE B — BACKEND/API (Next.js Route Handlers ou Express integrado)
Criar rotas REST internas (protegidas por auth da intranet) e rotas públicas só para webhooks:

1) CRM (privado)
- GET /api/crm/leads?status=&q=&owner=&source=&dateRange=
- POST /api/crm/leads (criar manual/import)
- GET /api/crm/leads/:id
- PATCH /api/crm/leads/:id (tags, owner, status, etc.)
- POST /api/crm/leads/:id/convert-to-client (gera Client, muda status)
- GET /api/crm/conversations?leadId=
- GET /api/crm/deals
- PATCH /api/crm/deals/:id
- POST /api/crm/tasks
- PATCH /api/crm/tasks/:id

2) BI (privado)
- GET /api/crm/bi/overview (funil, conversões, tempo resposta, etc.)
- GET /api/crm/bi/client/:clientId (dashboard + histórico)
- POST /api/crm/bi/client/:clientId/generate (gera insights via IA sob demanda)

3) WhatsApp Webhooks (público, com verificação de assinatura quando aplicável)
- GET /api/whatsapp/webhook (verificação “hub.challenge” quando for Cloud API)
- POST /api/whatsapp/webhook (recebe eventos de mensagem/status)
Regras:
- Responder 200 rápido; processar evento de forma idempotente (dedupe por providerMessageId).
- Se usar Cloud API: verificar X-Hub-Signature-256 com APP_SECRET quando presente; caso inválido, 401. (Implementar util de verificação HMAC SHA256 e ler raw body.)
- Se usar Z-API/Evolution: validar segredo próprio (ex.: header X-Webhook-Secret).

4) Endpoint interno para o agente (privado por API key do sistema)
- POST /api/agent/qualify (chamado pelo orquestrador quando necessário)
Proteção:
- Header: X-CRM-AGENT-KEY = env(CRM_AGENT_API_KEY)

────────────────────────────────────────────────────────
PARTE C — “WHATSAPP GATEWAY” COM PROVIDERS
Criar uma camada /lib/whatsapp/providers:

Interface:
- sendText(toE164, text, context): retorna providerMessageId
- sendInteractive(toE164, payload)
- parseWebhook(req): retorna lista normalizada de eventos {type:'message', from, to, text, messageId, timestamp, raw}
- getConnectionStatus(): 'CONNECTED'|'DISCONNECTED'
- (Opcional) getQrCode(): base64 PNG / string (somente para providers QR)
- name: 'CLOUD_API'|'ZAPI'|'EVOLUTION'

Provider padrão: CloudApiProvider
- Env:
  - WHATSAPP_PROVIDER='CLOUD_API'
  - META_WA_PHONE_NUMBER_ID
  - META_WA_ACCESS_TOKEN
  - META_APP_SECRET
  - META_WEBHOOK_VERIFY_TOKEN
  - META_GRAPH_BASE_URL (default https://graph.facebook.com)
  - META_GRAPH_VERSION (default v20.0, mas configurável)

Implementar:
- sendText usando POST {META_GRAPH_BASE_URL}/{META_GRAPH_VERSION}/{PHONE_NUMBER_ID}/messages com bearer token.
- webhook verify: GET retorna hub.challenge se hub.verify_token confere.
- signature: validar X-Hub-Signature-256 quando presente.

Providers opcionais (feature-flag, desativados por padrão):
- ZApiProvider (WHATSAPP_PROVIDER='ZAPI')
  - Implementar métodos mínimos:
    - getQrCode ou phone-code via endpoint documentado da Z-API (guardar instance/token em env)
    - parseWebhook via JSON recebido
    - sendText via endpoint de envio da Z-API (se não houver certeza do path, criar adapter configurável por env e documentar claramente)
  - Env: ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_BASE_URL, ZAPI_WEBHOOK_SECRET
- EvolutionProvider (WHATSAPP_PROVIDER='EVOLUTION')
  - Implementar getQrCode via “Instance Connect” (retorna QR)
  - Env: EVOLUTION_BASE_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, EVOLUTION_WEBHOOK_SECRET

IMPORTANTE:
- Deixar claro no README que Cloud API é o modo recomendado e oficial.
- Providers QR devem ficar atrás de feature flag e aviso de risco.

────────────────────────────────────────────────────────
PARTE D — ORQUESTRADOR DO AGENTE IA (WhatsApp → IA → CRM → Vendas)
Criar um serviço /lib/agent/orchestrator.ts que:
1) Recebe evento normalizado de mensagem inbound.
2) Resolve/Cria Lead pelo phoneE164.
3) Cria/atualiza Consent:
   - Se conversa foi iniciada pelo usuário (inbound), gravar Consent GRANTED com evidence INBOUND_MESSAGE.
4) Cria/atualiza Conversation + Message (persistir raw).
5) Executa “state machine” de qualificação:
   - Etapas (exemplo):
     S0: Boas-vindas + confirmar objetivo (contabilidade) + permissão para 3-5 perguntas rápidas
     S1: Tipo de empresa / CNPJ / cidade (se não tiver)
     S2: Regime (MEI/Simples/Presumido/Real / não sabe)
     S3: Faixa de faturamento (faixas), nº funcionários, volume de notas (baixo/médio/alto)
     S4: Dor principal + urgência
     S5: Encaminhar para vendas (SQL) ou orientar e encerrar (MQL/DISQUALIFIED)
   - Armazenar slots no conversation.state

6) Chamar o LLM para gerar resposta “humana” com regras:
   - Sempre se identificar como assistente virtual (“Sou a assistente virtual da [Empresa]…”).
   - Linguagem natural, cordial, objetiva, sem soar robótica.
   - Mensagens curtas (WhatsApp), 1 pergunta por vez quando necessário.
   - Confirmar entendimento, resumir, propor próximo passo.
   - Se o usuário pedir humano: criar handoff (Conversation.status=HANDOFF) e notificar fila de vendas.

7) Atualizar Lead:
   - status: NEW → IN_QUALIFICATION → MQL/SQL
   - score e tier (heurística simples):
     - “Lucro Real” ou multi-filial → tier D
     - “Presumido” ou alta complexidade → tier C
     - “Simples com funcionários” → tier B
     - “MEI/baixo volume” → tier A
   - criar Deal automaticamente quando virar MQL/SQL.

8) Encaminhamento para Vendas:
   - Regra de roteamento:
     - tier A → fila Inside Sales
     - tier B/C → fila Consultiva
     - tier D → Especialista
   - Implementar round-robin por usuários com role=SALES e “queueTag”.

9) “Human-like” sem risco:
   - Não inventar informações.
   - Não prometer preço fechado sem dados.
   - Se houver dados faltantes, pedir.
   - Opt-out: se usuário enviar “PARAR”, marcar Consent REVOKED e encerrar com confirmação.

Implementar prompts do LLM:
- System Prompt: persona do agente + regras (transparência, curto, amigável, objetivo, coleta slots).
- Tooling: permitir que o agente chame funções internas:
  - crm.updateLead(...)
  - crm.createTask(...)
  - crm.createDeal(...)
  - crm.handoffToSales(...)
Mas essas “tools” são chamadas pelo ORQUESTRADOR, não pelo WhatsApp diretamente.

LLM Provider:
- Criar uma camada /lib/llm com suporte a OpenAI-compatible API:
  - LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
- Timeout + retry + logging
- Guardrail: limitar tamanho, remover dados sensíveis indevidos, etc.

────────────────────────────────────────────────────────
PARTE E — FRONTEND (SETOR CRM NA INTRANET)
Adicionar item no menu lateral: “CRM”.

Páginas:
1) /crm/dashboard
   - KPIs: leads novos (7d), em qualificação, SQL, propostas, wins, tempo médio de resposta
   - Gráficos simples (conversões por etapa, origem)
2) /crm/leads
   - tabela com filtros (status, owner, origem, período, busca)
   - quick actions: atribuir vendedor, mudar status, criar tarefa
3) /crm/leads/[id]
   - perfil do lead (dados + tags + score + tier)
   - timeline da conversa (mensagens)
   - painel de qualificação (slots coletados)
   - botão “Handoff p/ Vendas” + criar Deal
4) /crm/pipeline
   - kanban (Deal.stage) com drag-and-drop
5) /crm/clients
   - lista de clientes ativos
6) /crm/clients/[id]/bi
   - BI do cliente (métricas + recomendações + histórico)
   - botão “Gerar Insights (IA)” (chama API /bi/client/:id/generate)

UI:
- Usar shadcn/ui (Table, Badge, Tabs, Dialog, Card).
- “Chat Viewer” estilo WhatsApp (bolhas IN/OUT).
- Estados vazios e loading.

────────────────────────────────────────────────────────
PARTE F — META ADS / CLICK-TO-WHATSAPP (Rastreio)
Como o usuário vem do anúncio:
- O anúncio abre WhatsApp (click-to-chat). O texto pode vir pré-preenchido.
- Implementar parsing do primeiro inbound:
  - Se a mensagem contiver um token (ex.: “REF:XXXX” ou “CAMP:YYYY”), salvar em lead.sourceMeta.
  - Não depender disso (usuário pode apagar). Se ausente, sourceMeta.refCode=null.

Criar util para gerar o texto recomendado para o anúncio (para o time de marketing usar):
- Ex.: “Olá! Vim pelo anúncio e quero falar com a contabilidade. REF: {{campaign_code}}”
Documentar no README.

────────────────────────────────────────────────────────
PARTE G — SEGURANÇA, COMPLIANCE E RESILIÊNCIA
- Nunca iniciar conversa outbound para contatos que não mandaram mensagem primeiro (neste MVP).
- Respeitar opt-out (“PARAR”).
- Rate limit por número (anti-loop).
- Idempotência: não duplicar mensagens.
- Logs: AuditLog para ações relevantes (handoff, status, conversão, geração de BI).
- Webhooks: exigir HTTPS em produção e verificação de assinatura quando aplicável.

────────────────────────────────────────────────────────
PARTE H — TESTES E DOCUMENTAÇÃO
- Criar testes unitários:
  - state machine de qualificação (entradas → próxima etapa)
  - parsing de webhook payload (mock)
  - dedupe idempotente
- Criar /docs/CRM.md explicando:
  - setup local (Postgres + env)
  - como configurar webhooks
  - como validar assinatura
  - como usar o CRM na intranet (guia rápido)
  - como o agente decide MQL/SQL e handoff

Setup local (recomendado):
- docker-compose: postgres + redis (opcional)
- prisma migrate dev
- npm run dev

Aceite (Definition of Done)
- Receber mensagem inbound (simulada) cria Lead + Conversation + Message.
- Agente responde e coleta pelo menos 5 campos (regime, faturamento faixa, funcionários, volume notas, dor).
- Lead muda status para MQL/SQL conforme regras e cria Deal automaticamente.
- Pipeline exibe e permite mover etapas.
- BI por cliente: página renderiza e endpoint gera “recommendations” via IA.
- Logs e auditoria criados para handoff e conversão.
- Provider Cloud API implementado com webhooks + envio.
- Providers QR existem como módulo opcional desativado por env flag, sem quebrar build.

IMPORTANTE: não remover funcionalidades existentes da intranet; apenas adicionar o setor CRM.
