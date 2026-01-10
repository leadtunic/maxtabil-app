import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { SidebarProvider } from "@/components/ui/sidebar";

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
