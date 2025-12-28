# Plano de Arquitetura e Implementacao da Intranet ESCOFER (MVP)

## 1. Objetivo e escopo
- Entregar uma intranet moderna com login obrigatorio, dois modulos (Financeiro e DP) e console Admin.
- MVP: apenas perfil Administrador usa, mas RBAC completo e deny by default ja modelados.
- Simuladores deterministicos e explicaveis, com RuleSets versionados e auditaveis.
- Geracao de PDFs corporativos server-side para cada simulacao.
- Projeto 110% tipado: sem uso de Any, tipagem estrita no front e no backend.

## 2. Decisoes e trade-offs (stack)
- Frontend: Next.js (App Router) + TypeScript (strict) + Tailwind + shadcn/ui.
- Backend: FastAPI (Python 3.12) + Pydantic v2 + SQLAlchemy 2.0 (typing nativo) + Alembic.
- Validacao: Zod no front e Pydantic no backend (duplicada por seguranca).
- Banco: Postgres (Supabase/Neon).
- Auth: FastAPI + JWT em cookie HttpOnly + convites por email (Resend/SES); trade-off: precisa de provedor de email.
- PDFs: HTML -> PDF com Playwright (python); trade-off: maior uso de CPU, mitigado com cache e rate limit.

## 3. Requisito de tipagem ("110% tipado")
- TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Python: `from __future__ import annotations`, `mypy --strict` e/ou `pyright --strict`.
- SQLAlchemy: usar `Mapped[...]` e `mapped_column` tipados.
- Pydantic: schemas tipados para request/response em todas as rotas.
- Politica: sem `Any` em codigo de negocio; excecoes apenas em bordas (ex.: JSON bruto), sempre com validacao.

## 4. C4 (texto)
### 4.1. Contexto
- Usuario interno -> Intranet ESCOFER (UI) -> API FastAPI -> Banco + Servico de PDF.

### 4.2. Containers
- Web App (Next.js): UI, App Shell, formularios, resultados.
- API (FastAPI): autenticacao, RBAC, admin, simulacoes, PDF.
- Pricing Engine (lib Python): calculos deterministas.
- PDF Service (Python): render HTML + converter para PDF.
- DB Postgres: usuarios, roles, rulesets, simulacoes, auditoria.

### 4.3. Componentes
- Auth (FastAPI + JWT em cookie).
- RBAC (policies centralizadas em /app/policies).
- Admin Console (usuarios, links, rulesets, auditoria).
- RuleSet Manager (versionamento e ativacao).
- Modulos (Financeiro, DP).

## 5. Fluxos ASCII
### 5.1. Entrada sem login
```
[User] -> /intranet -> (middleware auth) -> /login -> autentica -> /app/home
```

### 5.2. Admin cria usuario
```
Admin -> /app/admin/usuarios -> Criar -> gera convite -> usuario ativa -> login
```

### 5.3. Simulacao + PDF (por modulo)
```
Form -> validar -> calcular (engine) -> mostrar total/breakdown -> gerar PDF (server) -> baixar
```

## 6. Modelo de dados (SQLAlchemy 2.0)
```py
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True)
    status: Mapped[str] = mapped_column(String)  # ACTIVE | DISABLED
    created_at: Mapped[datetime] = mapped_column(DateTime)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    roles: Mapped[list[UserRole]] = relationship(back_populates="user")

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    key: Mapped[str] = mapped_column(String, unique=True)  # ADMIN, FISCAL_CONTABIL, FINANCEIRO, LEGALIZACAO, CERT_DIG, DP
    name: Mapped[str] = mapped_column(String)
    users: Mapped[list[UserRole]] = relationship(back_populates="role")
    permissions: Mapped[list[RolePermission]] = relationship(back_populates="role")

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    role_id: Mapped[str] = mapped_column(String, ForeignKey("roles.id"), primary_key=True)
    user: Mapped[User] = relationship(back_populates="roles")
    role: Mapped[Role] = relationship(back_populates="users")

class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    key: Mapped[str] = mapped_column(String, unique=True)  # MANAGE_USERS, MANAGE_LINKS, VIEW_FIN_SIM, RUN_FIN_SIM, VIEW_DP_SIM, RUN_DP_SIM, MANAGE_RULESETS, VIEW_AUDIT
    name: Mapped[str] = mapped_column(String)
    roles: Mapped[list[RolePermission]] = relationship(back_populates="permission")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id: Mapped[str] = mapped_column(String, ForeignKey("roles.id"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(String, ForeignKey("permissions.id"), primary_key=True)
    role: Mapped[Role] = relationship(back_populates="permissions")
    permission: Mapped[Permission] = relationship(back_populates="roles")

class LinkItem(Base):
    __tablename__ = "links"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    url: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    order: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class RuleSet(Base):
    __tablename__ = "rulesets"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String)  # HONORARIOS | RESCISAO | FERIAS
    version: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    payload: Mapped[dict] = mapped_column(JSON)
    created_by: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime)

class Simulation(Base):
    __tablename__ = "simulations"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String)
    inputs: Mapped[dict] = mapped_column(JSON)
    outputs: Mapped[dict] = mapped_column(JSON)
    breakdown: Mapped[dict] = mapped_column(JSON)
    ruleset_id: Mapped[str] = mapped_column(String)
    created_by: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_user_id: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str] = mapped_column(String)
    metadata: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime)

class Invite(Base):
    __tablename__ = "invites"
    token: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String)
    role_preset: Mapped[str] = mapped_column(String)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```

## 7. RBAC e autorizacao
- Deny by default: se a permissao nao existir, negar acesso.
- Politicas centralizadas em `app/policies` e usadas por dependencias do FastAPI.

Pseudo-codigo (Python):
```py
from fastapi import Depends, HTTPException, status
from .deps import get_current_user

PermissionKey = str

def require_permission(permission: PermissionKey):
    def _guard(user = Depends(get_current_user)):
        if permission not in user.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return user
    return _guard

@router.post("/admin/users")
def create_user(payload: CreateUserIn, user = Depends(require_permission("MANAGE_USERS"))):
    ...
```

## 8. Engine de calculo (deterministico)
- Engine como biblioteca interna em `app/engine`.
- Cada funcao recebe inputs validados + ruleset ativo.
- Retorna total + breakdown padronizado.

Pseudo-codigo:
```py
from dataclasses import dataclass

@dataclass(frozen=True)
class BreakdownItem:
    label: str
    base: float
    formula_text: str
    amount: float
    sign: str  # "+" | "-"

@dataclass(frozen=True)
class CalcResult:
    total: float
    breakdown: list[BreakdownItem]

def calculate_honorarios(inputs: HonorariosInput, ruleset: RuleSet) -> CalcResult:
    # regras deterministicas baseadas no ruleset
    return CalcResult(total=total, breakdown=breakdown)
```

## 9. Contratos e payloads (API)
### 9.1. Auth
- POST `/api/auth/login`
```json
{ "email": "admin@escofer.com", "password": "***" }
```
- POST `/api/auth/logout`
- POST `/api/auth/invite/accept`

### 9.2. Admin
- POST `/api/admin/users`
```json
{ "name": "Joao", "email": "joao@escofer.com", "roles": ["ADMIN"] }
```
- PATCH `/api/admin/users/:id`
```json
{ "status": "DISABLED", "roles": ["ADMIN"] }
```
- GET/POST/PATCH `/api/admin/links`
- GET/POST/PATCH `/api/admin/rulesets`
- GET `/api/admin/audit?from=...&to=...&actor=...`

### 9.3. Simulacoes
- POST `/api/simulations`
```json
{ "type": "HONORARIOS", "inputs": { "faturamento": 100000, "regime": "SIMPLES" } }
```
Resposta:
```json
{ "simulationId": "sim_123", "outputs": { "total": 1800 }, "breakdown": [ ... ], "ruleSetVersion": 3 }
```
- POST `/api/simulations/:id/pdf`
```json
{ "format": "A4" }
```

## 10. PDF Service
- Templates HTML separados por tipo: `honorarios.html`, `rescisao.html`, `ferias.html`.
- Inclusao obrigatoria: cabecalho, rodape, data/hora, identificador da simulacao, "Premissas e Limitacoes".
- Geracao server-side com Playwright (python); cache por `simulationId`.
- Rate limit por usuario para evitar abuso.

## 11. UX e navegacao
- Login obrigatorio antes de qualquer rota protegida.
- App Shell: Sidebar + Topbar + area de conteudo.
- Home do Admin: cards dos modulos + painel Administracao.
- Formularios em cards, validacao inline, mascaras monetarias.
- Resultado em tempo real + tabela de breakdown.
- Acessibilidade: foco visivel, teclado, aria-labels, contraste minimo.

Mapa do site:
```
/login
/app
  /home
  /financeiro/honorarios
  /dp/rescisao
  /dp/ferias
  /admin/usuarios
  /admin/links
  /admin/regras
  /admin/auditoria
```

## 12. RuleSets (versionamento e configuracao)
- RuleSet ativo por tipo (HONORARIOS, RESCISAO, FERIAS).
- Ao criar novo RuleSet: incrementa versao e marca como ativo (desativa anterior).
- Payload JSON com parametros de calculo (exemplo):
```json
{
  "baseMin": 500,
  "fatorRegime": { "SIMPLES": 1.0, "LUCRO_PRESUMIDO": 1.2, "LUCRO_REAL": 1.5 },
  "adicionalFuncionario": 30
}
```

## 13. Auditoria e observabilidade
- AuditLog para acao admin (criar usuario, alterar ruleset, gerar PDF).
- Logs estruturados com contexto: actor, entityType, entityId, metadata.
- Dashboard simples em /admin/auditoria.

## 14. Plano de implementacao (MVP)
1) Setup do backend FastAPI (auth, RBAC, tipagem estrita) + setup do frontend Next.js.
2) Console Admin: CRUD usuarios + atribuir role ADMIN.
3) Admin Links: CRUD + categorias + visibilidade por role.
4) Engine + UI Simulador Honorarios + PDF.
5) Engine + UI Rescisao/Ferias + PDFs.
6) RuleSets versionados + auditoria.

## 15. Disclaimers obrigatorios
- UI e PDFs devem incluir aviso: "Valores estimados para simulacao; nao substitui calculo oficial".
- Guardar regra usada (RuleSet version) em cada simulacao.
