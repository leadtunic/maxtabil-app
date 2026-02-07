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
import { cn } from "@/lib/utils";
import { useAuthorization } from "@/hooks/use-authorization";
import type { RouteKey } from "@/lib/authorization";

const mainNav = [
  { title: "Início", url: "/app", icon: Home },
  { title: "Dashboard", url: "/app/dashboard", icon: BarChart3 },
];

const moduleSections = [
  {
    key: "financeiro",
    title: "Financeiro",
    icon: Calculator,
    items: [
      { title: "Simulador Honorários", url: "/app/financeiro/honorarios", icon: Calculator },
      { title: "Workspace", url: "/app/financeiro/workspace", icon: Link2 },
      { title: "BPO Financeiro", url: "/app/financeiro/bpo", icon: BarChart3 },
    ],
  },
  {
    key: "dp",
    title: "Departamento Pessoal",
    icon: Users,
    items: [
      { title: "Simuladores DP", url: "/app/dp", icon: FileText },
      { title: "Workspace", url: "/app/dp/workspace", icon: Link2 },
    ],
  },
  {
    key: "fiscal-contabil",
    title: "Fiscal/Contábil",
    icon: ClipboardList,
    items: [
      { title: "Fator R e DAS", url: "/app/fiscal-contabil", icon: ClipboardList },
      { title: "Workspace", url: "/app/fiscal-contabil/workspace", icon: Link2 },
    ],
  },
  {
    key: "legalizacao",
    title: "Legalização",
    icon: FileText,
    items: [
      { title: "Vencimentos", url: "/app/legalizacao", icon: FileText },
      { title: "Workspace", url: "/app/legalizacao/workspace", icon: Link2 },
    ],
  },
  {
    key: "certificado-digital",
    title: "Certificado Digital",
    icon: Shield,
    items: [
      { title: "Vencimentos", url: "/app/certificado-digital", icon: Shield },
      { title: "Workspace", url: "/app/certificado-digital/workspace", icon: Link2 },
    ],
  },
  {
    key: "admin",
    title: "Administração",
    icon: Shield,
    items: [
      { title: "Usuários", url: "/app/admin/usuarios", icon: Users },
      { title: "Links", url: "/app/admin/links", icon: Link2 },
      { title: "Regras", url: "/app/admin/regras", icon: Settings },
      { title: "Auditoria", url: "/app/admin/auditoria", icon: ClipboardList },
    ],
  },
];

const configNav = [{ title: "Configurações", url: "/app/configuracoes", icon: Settings }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { canAccess } = useAuthorization();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    moduleSections.reduce((acc, section) => {
      acc[section.key] = location.pathname.includes(section.key);
      return acc;
    }, {} as Record<string, boolean>)
  );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full w-full flex-col">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sidebar-accent/70 flex items-center justify-center">
              <img src="/logo.svg" alt="ESCOFER" className="h-6 w-6 object-contain" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <p className="text-sm font-semibold text-sidebar-foreground">ESCOFER</p>
                <p className="text-xs text-sidebar-foreground/70">Intranet</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2 scrollbar-thin">
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

          {moduleSections.map((section) => {
            if (!canAccess(section.key as RouteKey)) return null;

            return (
              <SidebarGroup key={section.key}>
                <Collapsible
                  open={openSections[section.key]}
                  onOpenChange={(value) =>
                    setOpenSections((prev) => ({ ...prev, [section.key]: value }))
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                      <span className="flex items-center gap-2">
                        <section.icon className="w-4 h-4" />
                        {!collapsed && section.title}
                      </span>
                      {!collapsed && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            openSections[section.key] && "rotate-180"
                          )}
                        />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-4">
                        {section.items.map((item) => (
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
            );
          })}

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
    </Sidebar>
  );
}
