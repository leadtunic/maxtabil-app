import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { trackPageview } from "@/lib/analytics";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Paywall from "./pages/Paywall";
import BillingCompleted from "./pages/BillingCompleted";
import NotFound from "./pages/NotFound";

// App Pages
import Home from "./pages/app/Home";
import SimuladorHonorarios from "./pages/app/financeiro/SimuladorHonorarios";
import BpoDashboard from "./pages/app/financeiro/bpo/Dashboard";
import BpoClients from "./pages/app/financeiro/bpo/Clients";
import BpoTasks from "./pages/app/financeiro/bpo/Tasks";
import DepartamentoPessoal from "./pages/app/dp/DepartamentoPessoal";
import FiscalContabil from "./pages/app/fiscal-contabil/FiscalContabil";
import Legalizacao from "./pages/app/legalizacao/Legalizacao";
import CertificadoDigital from "./pages/app/certificado-digital/CertificadoDigital";
import AdminUsuarios from "./pages/app/admin/AdminUsuarios";
import AdminLinks from "./pages/app/admin/AdminLinks";
import AdminRegras from "./pages/app/admin/AdminRegras";
import AdminAuditoria from "./pages/app/admin/AdminAuditoria";
import Configuracoes from "./pages/app/Configuracoes";

const queryClient = new QueryClient();

function PageViewTracker() {
  const location = useLocation();
  
  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);
  
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageViewTracker />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/paywall" element={<Paywall />} />
            <Route path="/billing/completed" element={<BillingCompleted />} />
            
            {/* Protected App Routes */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Home />} />
              
              {/* Financeiro */}
              <Route path="financeiro/honorarios" element={<SimuladorHonorarios />} />
              <Route path="financeiro/bpo" element={<BpoDashboard />} />
              <Route path="financeiro/bpo/clients" element={<BpoClients />} />
              <Route path="financeiro/bpo/tasks" element={<BpoTasks />} />
              <Route
                path="financeiro/workspace"
                element={<Navigate to="/app/configuracoes?module=financeiro" replace />}
              />
              
              {/* DP */}
              <Route path="dp" element={<DepartamentoPessoal />} />
              <Route path="dp/rescisao" element={<DepartamentoPessoal defaultTab="rescisao" />} />
              <Route path="dp/ferias" element={<DepartamentoPessoal defaultTab="ferias" />} />
              <Route
                path="dp/workspace"
                element={<Navigate to="/app/configuracoes?module=dp" replace />}
              />
              
              {/* Fiscal/Contábil */}
              <Route path="fiscal-contabil" element={<FiscalContabil />} />
              <Route
                path="fiscal-contabil/workspace"
                element={<Navigate to="/app/configuracoes?module=fiscal_contabil" replace />}
              />
              
              {/* Legalização */}
              <Route path="legalizacao" element={<Legalizacao />} />
              <Route
                path="legalizacao/workspace"
                element={<Navigate to="/app/configuracoes?module=legalizacao" replace />}
              />
              
              {/* Certificado Digital */}
              <Route path="certificado-digital" element={<CertificadoDigital />} />
              <Route
                path="certificado-digital/workspace"
                element={<Navigate to="/app/configuracoes?module=certificado_digital" replace />}
              />
              
              {/* Admin */}
              <Route path="admin/usuarios" element={<AdminUsuarios />} />
              <Route path="admin/links" element={<AdminLinks />} />
              <Route path="admin/regras" element={<AdminRegras />} />
              <Route path="admin/auditoria" element={<AdminAuditoria />} />
              
              {/* Configurações */}
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>

            {/* Redirects for old routes */}
            <Route path="/app/certificado-digital/vencimentos" element={<Navigate to="/app/certificado-digital" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
