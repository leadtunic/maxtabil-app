import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getAllowedRoutes, type RouteKey } from "@/lib/authorization";

export function useAuthorization() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const allowedRoutes = useMemo(() => getAllowedRoutes(role), [role]);

  const canAccess = (routeKey: RouteKey) => canAccessRoute(role, routeKey);

  return {
    role,
    allowedRoutes,
    canAccess,
  };
}
