Plano de Arquitetura — VPS com Dokploy + PostgreSQL puro

Objetivo
- Migrar do Supabase para uma VPS gerenciada com Dokploy, usando PostgreSQL direto.
- Manter o frontend Vite e os fluxos principais (login, onboarding, paywall, app).
- Controlar deploy, dados e custos com stack auto-hospedada.

Arquitetura-alvo (alto nivel)
- VPS com Dokploy (Docker, reverse proxy, TLS).
- Servicos:
  - Frontend: build Vite servido por container web (ex.: Nginx).
  - API: backend dedicado (Node/Bun) com endpoints REST para auth e dominio.
  - PostgreSQL: banco principal com volumes persistentes.
  - Worker/Jobs: tarefas assincronas (webhooks, emails, rotinas).
  - Storage (opcional): MinIO (S3 compatível) para arquivos.
- Integracoes externas: AbacatePay, PostHog.

Substituicoes do Supabase
- Auth: implementar auth proprio (JWT + refresh) e OAuth (Google) via Auth.js/Lucia.
- Edge Functions: migrar para endpoints na API e/ou worker.
- RLS: aplicar multi-tenant por workspace_id no backend e/ou policies no Postgres.
- Storage: mover para MinIO ou filesystem com abstração de storage.
- Realtime (se necessario): WebSocket/SSE no backend.

Banco de dados (PostgreSQL puro)
- Schema: migrar tabelas atuais (migrations SQL existentes).
- Migrations: padronizar (drizzle/prisma/knex) ou manter SQL puro.
- Backups: pg_dump diario + retencao (testar restore).

Deploy com Dokploy
1) Criar projeto no Dokploy e conectar ao repositorio.
2) Definir Dockerfiles (frontend e api) e healthchecks.
3) Provisionar Postgres com volume persistente e usuario dedicado.
4) Configurar dominios e TLS automatico.
5) Definir secrets/vars: DB_URL, APP_BASE_URL, ABACATEPAY_API_KEY, etc.
6) Pipeline: build -> migrate -> deploy.

Plano de migracao
1) Mapear dependencias de Supabase no frontend e no backend atual.
2) Exportar schema/dados do Supabase (pg_dump).
3) Subir Postgres na VPS e importar dados.
4) Implementar API substituta (auth, workspace, paywall, webhooks).
5) Atualizar frontend para consumir API HTTP (remover supabase client).
6) Validar fluxos criticos: login, onboarding, paywall, CRUD.
7) Cutover: ajustar DNS, monitorar logs e metricas.

Checklist de seguranca
- TLS obrigatorio em todos os dominios.
- Segredos apenas via Dokploy.
- Roles minimas no Postgres.
- Backups e restore testados.

Observabilidade
- Logs centralizados no Dokploy.
- Health checks e uptime.
- Alertas para falhas de webhook e jobs.
