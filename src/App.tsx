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
import SimuladorRescisao from "./pages/app/dp/SimuladorRescisao";
import SimuladorFerias from "./pages/app/dp/SimuladorFerias";
import FiscalContabil from "./pages/app/fiscal-contabil/FiscalContabil";
import Legalizacao from "./pages/app/legalizacao/Legalizacao";
import CertificadoDigital from "./pages/app/certificado-digital/CertificadoDigital";
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
              <Route path="dp/rescisao" element={<SimuladorRescisao />} />
              <Route path="dp/ferias" element={<SimuladorFerias />} />
              <Route path="fiscal-contabil" element={<FiscalContabil />} />
              <Route path="legalizacao" element={<Legalizacao />} />
              <Route path="certificado-digital" element={<CertificadoDigital />} />
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
