import type { RoleKey } from "@/types";

export type RouteKey =
  | "home"
  | "financeiro"
  | "dp"
  | "fiscal-contabil"
  | "legalizacao"
  | "certificado-digital"
  | "admin"
  | "crm";

const roleAccess: Record<RoleKey, RouteKey[]> = {
  ADMIN: [
    "home",
    "financeiro",
    "dp",
    "fiscal-contabil",
    "legalizacao",
    "certificado-digital",
    "admin",
    "crm",
  ],
  FINANCEIRO: ["home", "financeiro"],
  DP: ["home", "dp"],
  FISCAL_CONTABIL: ["home", "fiscal-contabil"],
  LEGALIZACAO_CERT: ["home", "legalizacao", "certificado-digital"],
};

export function getAllowedRoutes(role?: RoleKey | null): Set<RouteKey> {
  if (!role) return new Set();
  return new Set(roleAccess[role]);
}

export function canAccessRoute(role: RoleKey | null | undefined, routeKey: RouteKey): boolean {
  if (!role) return false;
  return roleAccess[role].includes(routeKey);
}

const routeMatchers: Array<{ key: RouteKey; test: (pathname: string) => boolean }> = [
  { key: "financeiro", test: (path) => path.startsWith("/app/financeiro") },
  { key: "dp", test: (path) => path.startsWith("/app/dp") },
  { key: "fiscal-contabil", test: (path) => path.startsWith("/app/fiscal-contabil") },
  { key: "legalizacao", test: (path) => path.startsWith("/app/legalizacao") },
  { key: "certificado-digital", test: (path) => path.startsWith("/app/certificado-digital") },
  { key: "admin", test: (path) => path.startsWith("/app/admin") },
  { key: "crm", test: (path) => path.startsWith("/app/crm") },
  { key: "home", test: (path) => path === "/app" || path === "/app/" },
];

export function getRouteKeyFromPath(pathname: string): RouteKey | null {
  const match = routeMatchers.find((matcher) => matcher.test(pathname));
  return match ? match.key : null;
}
