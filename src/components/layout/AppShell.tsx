import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";

// Set to true to bypass auth checks for development
const DEV_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

export function AppShell() {
  const { isAuthenticated, isLoading, completedOnboarding, hasLifetimeAccess } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Allow bypassing auth in development
  if (!DEV_BYPASS_AUTH) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    // Redirect to onboarding if not completed
    if (!completedOnboarding && location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }

    // Redirect to paywall if onboarding done but not paid
    if (completedOnboarding && !hasLifetimeAccess && location.pathname !== "/paywall") {
      return <Navigate to="/paywall" replace />;
    }
  }

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
