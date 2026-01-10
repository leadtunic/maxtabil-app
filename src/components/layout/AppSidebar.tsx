import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Home,
  Calculator,
  Users,
  Link2,
  Settings,
  FileText,
  ClipboardList,
  Shield,
  BarChart3,
  ChevronDown,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { BeamsBackground } from "@/components/ui/beams-background";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const mainNav = [
  { title: "Início", url: "/app", icon: Home },
];

const financeiroNav = [
  { title: "Simulador Honorários", url: "/app/financeiro/honorarios", icon: Calculator },
  { title: "Workspace", url: "/app/financeiro/workspace", icon: Link2 },
];

const bpoNav = [
  { title: "Dashboard", url: "/app/financeiro/bpo", icon: BarChart3 },
  { title: "Clientes", url: "/app/financeiro/bpo/clients", icon: Building2 },
  { title: "Tarefas", url: "/app/financeiro/bpo/tasks", icon: ClipboardList },
];

const dpNav = [
  { title: "Simuladores DP", url: "/app/dp", icon: FileText },
  { title: "Workspace", url: "/app/dp/workspace", icon: Link2 },
];

const fiscalNav = [
  { title: "Fator R e DAS", url: "/app/fiscal-contabil", icon: ClipboardList },
  { title: "Workspace", url: "/app/fiscal-contabil/workspace", icon: Link2 },
];

const legalizacaoNav = [
  { title: "Vencimentos", url: "/app/legalizacao", icon: FileText },
  { title: "Workspace", url: "/app/legalizacao/workspace", icon: Link2 },
];

const certDigNav = [
  { title: "Vencimentos", url: "/app/certificado-digital/vencimentos", icon: Shield },
  { title: "Workspace", url: "/app/certificado-digital/workspace", icon: Link2 },
];

const adminNav = [
  { title: "Usuários", url: "/app/admin/usuarios", icon: Users },
  { title: "Links", url: "/app/admin/links", icon: Link2 },
  { title: "Regras", url: "/app/admin/regras", icon: Settings },
  { title: "Auditoria", url: "/app/admin/auditoria", icon: ClipboardList },
];

const configNav = [
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasModule, workspace } = useAuth();
  
  const [financeiroOpen, setFinanceiroOpen] = useState(
    location.pathname.startsWith("/app/financeiro") && !location.pathname.includes("/bpo")
  );
  const [bpoOpen, setBpoOpen] = useState(
    location.pathname.includes("/bpo")
  );
  const [dpOpen, setDpOpen] = useState(
    location.pathname.startsWith("/app/dp")
  );
  const [fiscalOpen, setFiscalOpen] = useState(
    location.pathname.startsWith("/app/fiscal-contabil")
  );
  const [legalizacaoOpen, setLegalizacaoOpen] = useState(
    location.pathname.startsWith("/app/legalizacao")
  );
  const [certDigOpen, setCertDigOpen] = useState(
    location.pathname.startsWith("/app/certificado-digital")
  );
  const [adminOpen, setAdminOpen] = useState(
    location.pathname.startsWith("/app/admin")
  );

  // Get workspace logo URL
  const getLogoUrl = () => {
    if (workspace?.logo_path) {
      // Use Supabase storage URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}/storage/v1/object/public/workspace-logos/${workspace.logo_path}`;
    }
    return "/logoescof.png";
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <BeamsBackground
        fit="parent"
        intensity="medium"
        className="min-h-0 h-full w-full bg-sidebar"
        contentClassName="relative z-10 h-full w-full items-start justify-start"
      >
        <div className="flex h-full w-full flex-col">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center">
                <img
                  src={getLogoUrl()}
                  alt={workspace?.name || "Logo"}
                  className="w-[140px] h-auto object-contain max-h-16"
                />
              </div>
              {!collapsed && workspace?.name && (
                <p className="text-sm font-semibold text-sidebar-foreground/80 truncate max-w-full">
                  {workspace.name}
                </p>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            "hover:bg-sidebar-accent"
                          )}
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Financeiro - Honorários */}
            {hasModule("financeiro") && (
              <SidebarGroup>
                <Collapsible open={financeiroOpen} onOpenChange={setFinanceiroOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        {!collapsed && "Financeiro"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            financeiroOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {financeiroNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Financeiro - BPO */}
            {hasModule("financeiro_bpo") && (
              <SidebarGroup>
                <Collapsible open={bpoOpen} onOpenChange={setBpoOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {!collapsed && "BPO Financeiro"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            bpoOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {bpoNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* DP */}
            {hasModule("dp") && (
              <SidebarGroup>
                <Collapsible open={dpOpen} onOpenChange={setDpOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {!collapsed && "Departamento Pessoal"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            dpOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {dpNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Fiscal/Contábil */}
            {hasModule("fiscal_contabil") && (
              <SidebarGroup>
                <Collapsible open={fiscalOpen} onOpenChange={setFiscalOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        {!collapsed && "Fiscal/Contábil"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            fiscalOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {fiscalNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Legalização */}
            {hasModule("legalizacao") && (
              <SidebarGroup>
                <Collapsible open={legalizacaoOpen} onOpenChange={setLegalizacaoOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {!collapsed && "Legalização"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            legalizacaoOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {legalizacaoNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Certificado Digital */}
            {hasModule("certificado_digital") && (
              <SidebarGroup>
                <Collapsible open={certDigOpen} onOpenChange={setCertDigOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {!collapsed && "Certificado Digital"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            certDigOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {certDigNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Admin */}
            {hasModule("admin") && (
              <SidebarGroup>
                <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {!collapsed && "Administração"}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            adminOpen && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {adminNav.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                              >
                                <item.icon className="w-4 h-4" />
                                {!collapsed && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Configurações - sempre visível */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {configNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            "hover:bg-sidebar-accent"
                          )}
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </div>
      </BeamsBackground>
    </Sidebar>
  );
}
