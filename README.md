# ESCOFER Intranet Frontend

## Visao geral
Aplicacao front-end da intranet ESCOFER, feita com Vite + React + TypeScript e
componentes shadcn/ui. O repositorio contem duas apps com estrutura semelhante:
a app na raiz e a app em `intranet-esco-app/`.

## Apps no repositorio
- `./` (raiz): app principal Vite.
- `./intranet-esco-app/`: app secundaria com estrutura equivalente.

Ambas usam a mesma porta por padrao (`8080`). Rode apenas uma por vez ou ajuste
o `port` no `vite.config.ts`.

## Estrutura (visao macro)
```
/
  src/                       # codigo da app raiz
    components/              # UI, layout e NavLink
    contexts/                # AuthContext
    hooks/                   # hooks utilitarios
    lib/                     # utils e helpers
    pages/                   # telas e rotas
    types/                   # tipos de dominio
  public/                    # assets estaticos
  intranet-esco-app/         # segunda app (estrutura similar)
  vite.config.ts             # alias e configuracao do dev server
  tailwind.config.ts         # tema e tokens
  components.json            # shadcn/ui config
```

## Arquitetura da aplicacao
- Entrada: `src/main.tsx` cria o root React e renderiza `src/App.tsx`.
- Providers globais (em `src/App.tsx`):
  - `QueryClientProvider` (React Query).
  - `TooltipProvider`, `Toaster` e `Sonner` (UI de feedback).
  - `AuthProvider` (contexto de autenticacao).
- Roteamento: `react-router-dom` com `AppShell` em `/app` e `Outlet`.
- Layout:
  - `src/components/layout/AppShell.tsx` compoe sidebar + topbar + conteudo.
  - `src/components/layout/AppSidebar.tsx` define o menu por dominio.
- Estado e logica:
  - Formularios e simuladores usam estado local (React `useState`).
  - Tipos de dominio ficam em `src/types/index.ts`.
- UI:
  - Componentes base em `src/components/ui` (shadcn/ui + Radix).
  - `cn` em `src/lib/utils.ts` padroniza classes Tailwind.

## Rotas principais (App.tsx)
- `/login`: tela de login.
- `/app`:
  - `/financeiro/honorarios` (simulador de honorarios).
  - `/dp/rescisao` e `/dp/ferias`.
  - `/fiscal-contabil`, `/legalizacao`, `/certificado-digital`.
  - `/admin/usuarios`, `/admin/links`, `/admin/regras`, `/admin/auditoria`.
- `*`: `NotFound`.

## Autenticacao e permissoes
`src/contexts/AuthContext.tsx` implementa autenticacao mock:
- Aceita email `@escofer.com.br` e senha com 6+ caracteres.
- `hasRole` libera acesso por role (ADMIN tem acesso total).

## Simuladores e PDF
Simuladores calculam valores localmente e exibem detalhamento.
Relatorios em PDF usam `window.print()` em uma nova janela; o navegador pode
pedir permissao de pop-up.

## Configuracoes relevantes
- Alias `@` aponta para `./src` (definido em `vite.config.ts`).
- Porta do dev server: `8080` (Vite).
- Estilos: Tailwind em `src/index.css` e tokens em `tailwind.config.ts`.

## Requisitos
- Node.js 18+
- npm

## Rodar localmente (app raiz)
```sh
npm install
npm run dev
```
Abra `http://localhost:8080`.

## Rodar localmente (intranet-esco-app)
```sh
cd intranet-esco-app
npm install
npm run dev
```

## Scripts (em cada app)
- `npm run dev`: servidor de desenvolvimento
- `npm run build`: build de producao
- `npm run preview`: preview do build
- `npm run lint`: lint do projeto
# maxtabil-app
