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
  CalendarDays,
  Shield,
  ChevronDown,
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

const mainNav = [
  { title: "Início", url: "/app", icon: Home },
];

const financeiroNav = [
  { title: "Simulador Honorários", url: "/app/financeiro/honorarios", icon: Calculator },
];

const dpNav = [
  { title: "Simulador Rescisão", url: "/app/dp/rescisao", icon: FileText },
  { title: "Simulador Férias", url: "/app/dp/ferias", icon: CalendarDays },
];

const fiscalNav = [
  { title: "Painel (Teste)", url: "/app/fiscal-contabil", icon: ClipboardList },
];

const legalizacaoNav = [
  { title: "Painel (Teste)", url: "/app/legalizacao", icon: FileText },
];

const certDigNav = [
  { title: "Painel (Teste)", url: "/app/certificado-digital", icon: Shield },
];

const adminNav = [
  { title: "Usuários", url: "/app/admin/usuarios", icon: Users },
  { title: "Links", url: "/app/admin/links", icon: Link2 },
  { title: "Regras", url: "/app/admin/regras", icon: Settings },
  { title: "Auditoria", url: "/app/admin/auditoria", icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  
  const [financeiroOpen, setFinanceiroOpen] = useState(
    location.pathname.startsWith("/app/financeiro")
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src="/logoescof.png"
                  alt="ESCOFER"
                  className="w-7 h-7 object-contain"
                />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-bold text-sidebar-accent-foreground text-lg tracking-tight">
                    ESCOFER
                  </h1>
                  <p className="text-xs text-sidebar-foreground/70">Intranet</p>
                </div>
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

        {/* Financeiro */}
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

        {/* DP */}
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

        {/* Departamentos adicionais */}
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

        {/* Admin */}
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
          </SidebarContent>
        </div>
      </BeamsBackground>
    </Sidebar>
  );
}
