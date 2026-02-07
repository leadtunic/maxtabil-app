import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getAllowedRoutes, type RouteKey } from "@/lib/authorization";
import type { ModuleKey } from "@/types/supabase";

const routeToModule: Partial<Record<RouteKey, ModuleKey>> = {
  financeiro: "financeiro",
  dp: "dp",
  "fiscal-contabil": "fiscal_contabil",
  legalizacao: "legalizacao",
  "certificado-digital": "certificado_digital",
  admin: "admin",
};

export function useAuthorization() {
  const { user, settings } = useAuth();
  const role = (user as { role?: string } | null)?.role ?? null;
  const enabledModules = settings?.enabled_modules ?? null;

  const allowedRoutes = useMemo(() => {
    if (role) return getAllowedRoutes(role);

    // Legacy fallback: when role is not available in session payload,
    // use workspace enabled modules to keep navigation functional.
    const fallback = new Set<RouteKey>(["home"]);
    (Object.keys(routeToModule) as RouteKey[]).forEach((routeKey) => {
      const moduleKey = routeToModule[routeKey];
      if (!moduleKey) return;
      if (!enabledModules || enabledModules[moduleKey] === true) {
        fallback.add(routeKey);
      }
    });
    return fallback;
  }, [role, enabledModules]);

  const canAccess = (routeKey: RouteKey) => {
    if (role) return canAccessRoute(role, routeKey);
    return allowedRoutes.has(routeKey);
  };

  return {
    role,
    allowedRoutes,
    canAccess,
  };
}
