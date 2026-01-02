import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

// Pages
import Login from "./pages/Login";
import Home from "./pages/app/Home";
import SimuladorHonorarios from "./pages/app/financeiro/SimuladorHonorarios";
import FinanceiroWorkspace from "./pages/app/financeiro/Workspace";
import DepartamentoPessoal from "./pages/app/dp/DepartamentoPessoal";
import DepartamentoPessoalWorkspace from "./pages/app/dp/Workspace";
import FiscalContabil from "./pages/app/fiscal-contabil/FiscalContabil";
import FiscalContabilWorkspace from "./pages/app/fiscal-contabil/Workspace";
import Legalizacao from "./pages/app/legalizacao/Legalizacao";
import LegalizacaoWorkspace from "./pages/app/legalizacao/Workspace";
import CertificadoDigital from "./pages/app/certificado-digital/CertificadoDigital";
import CertificadoDigitalWorkspace from "./pages/app/certificado-digital/Workspace";
import AdminUsuarios from "./pages/app/admin/AdminUsuarios";
import AdminLinks from "./pages/app/admin/AdminLinks";
import AdminRegras from "./pages/app/admin/AdminRegras";
import AdminAuditoria from "./pages/app/admin/AdminAuditoria";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="financeiro/honorarios" element={<SimuladorHonorarios />} />
              <Route path="financeiro/workspace" element={<FinanceiroWorkspace />} />
              <Route path="dp" element={<DepartamentoPessoal />} />
              <Route path="dp/rescisao" element={<DepartamentoPessoal defaultTab="rescisao" />} />
              <Route path="dp/ferias" element={<DepartamentoPessoal defaultTab="ferias" />} />
              <Route path="dp/workspace" element={<DepartamentoPessoalWorkspace />} />
              <Route path="fiscal-contabil" element={<FiscalContabil />} />
              <Route path="fiscal-contabil/workspace" element={<FiscalContabilWorkspace />} />
              <Route path="legalizacao" element={<Legalizacao />} />
              <Route path="legalizacao/workspace" element={<LegalizacaoWorkspace />} />
              <Route
                path="certificado-digital"
                element={<Navigate to="/app/certificado-digital/vencimentos" replace />}
              />
              <Route path="certificado-digital/vencimentos" element={<CertificadoDigital />} />
              <Route path="certificado-digital/workspace" element={<CertificadoDigitalWorkspace />} />
              <Route path="admin/usuarios" element={<AdminUsuarios />} />
              <Route path="admin/links" element={<AdminLinks />} />
              <Route path="admin/regras" element={<AdminRegras />} />
              <Route path="admin/auditoria" element={<AdminAuditoria />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
