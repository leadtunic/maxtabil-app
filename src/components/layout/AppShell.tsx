import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthorization } from "@/hooks/use-authorization";
import { getRouteKeyFromPath } from "@/lib/authorization";
import { toast } from "sonner";
import { useEffect } from "react";

// Set to true to bypass auth checks for development or test mode
const DEV_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
const TEST_BYPASS_AUTH = import.meta.env.MODE === "test" && import.meta.env.VITE_TEST_BYPASS_AUTH === "true";
const BYPASS_AUTH = DEV_BYPASS_AUTH || TEST_BYPASS_AUTH;

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAuthorization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Allow bypassing auth in development
  if (!BYPASS_AUTH && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (BYPASS_AUTH || !isAuthenticated) return;
    const routeKey = getRouteKeyFromPath(location.pathname);
    if (routeKey && !canAccess(routeKey)) {
      toast.error("Você não tem permissão para acessar esta área.");
      navigate("/app", { replace: true });
    }
  }, [BYPASS_AUTH, isAuthenticated, location.pathname, canAccess, navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-mesh">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppTopbar />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
