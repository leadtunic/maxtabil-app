import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthorization } from "@/hooks/use-authorization";
import { getRouteKeyFromPath } from "@/lib/authorization";
import { useEffect } from "react";
import { toast } from "sonner";
import { PasswordChangeDialog } from "@/components/auth/PasswordChangeDialog";

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccess } = useAuthorization();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const routeKey = getRouteKeyFromPath(location.pathname);
    if (routeKey && !canAccess(routeKey)) {
      toast.error("Sem permissão para acessar este módulo.");
      navigate("/app", { replace: true });
    }
  }, [canAccess, isAuthenticated, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppTopbar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <PasswordChangeDialog />
    </SidebarProvider>
  );
}
