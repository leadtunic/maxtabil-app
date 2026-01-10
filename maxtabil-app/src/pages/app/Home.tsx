import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Calculator,
  FileText,
  Users,
  Link2,
  Settings,
  ClipboardList,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAuthorization } from "@/hooks/use-authorization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { LinkItem, LinkSector } from "@/types";

const moduleCards = [
  {
    title: "Simulador de Honorários",
    description: "Calcule honorários contábeis baseados no faturamento e regime tributário.",
    icon: Calculator,
    href: "/app/financeiro/honorarios",
    color: "bg-accent/10 text-accent-foreground",
    iconColor: "text-accent",
    category: "Financeiro",
    routeKey: "financeiro",
  },
  {
    title: "Simuladores DP",
    description: "Rescisão e férias em um único painel com abas.",
    icon: FileText,
    href: "/app/dp",
    color: "bg-info/10 text-info-foreground",
    iconColor: "text-info",
    category: "DP",
    routeKey: "dp",
  },
];

const adminCards = [
  {
    title: "Usuários",
    description: "Gerenciar usuários e permissões",
    icon: Users,
    href: "/app/admin/usuarios",
    routeKey: "admin",
  },
  {
    title: "Links",
    description: "Gerenciar links úteis",
    icon: Link2,
    href: "/app/admin/links",
    routeKey: "admin",
  },
  {
    title: "Regras",
    description: "Gerenciar regras de cálculo",
    icon: Settings,
    href: "/app/admin/regras",
    routeKey: "admin",
  },
  {
    title: "Auditoria",
    description: "Visualizar logs de auditoria",
    icon: ClipboardList,
    href: "/app/admin/auditoria",
    routeKey: "admin",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const sectorLabels: Record<LinkSector, string> = {
  GERAL: "Geral",
  FINANCEIRO: "Financeiro",
  DP: "Departamento Pessoal",
  FISCAL_CONTABIL: "Fiscal/Contábil",
  LEGALIZACAO: "Legalização",
  CERTIFICADO_DIGITAL: "Certificado Digital",
  ADMIN: "Administração",
};

export default function Home() {
  const { user } = useAuth();
  const { canAccess } = useAuthorization();
  const isAdmin = canAccess("admin");
  const visibleModuleCards = moduleCards.filter((card) => canAccess(card.routeKey));
  const visibleAdminCards = adminCards.filter((card) => canAccess(card.routeKey));
  const { data: linksData } = useQuery({
    queryKey: ["app_links", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_links")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LinkItem[];
    },
  });

  const visibleLinks = (linksData ?? []).filter((link) => {
    if (!link.is_active) return false;
    if (link.sector === "GERAL") return true;
    if (link.sector === "ADMIN") return canAccess("admin");
    if (link.sector === "FINANCEIRO") return canAccess("financeiro");
    if (link.sector === "DP") return canAccess("dp");
    if (link.sector === "FISCAL_CONTABIL") return canAccess("fiscal-contabil");
    if (link.sector === "LEGALIZACAO") return canAccess("legalizacao");
    if (link.sector === "CERTIFICADO_DIGITAL") return canAccess("certificado-digital");
    return false;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Acesse os módulos disponíveis na intranet.
        </p>
      </motion.div>

      {/* Simulators Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Simuladores</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {visibleModuleCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Link to={card.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group cursor-pointer border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {card.category}
                      </span>
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Acessar
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {visibleLinks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Links Úteis</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleLinks.map((link) => (
              <Button
                key={link.id}
                asChild
                variant="outline"
                className="h-auto w-full justify-between gap-4 px-4 py-3"
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{link.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{sectorLabels[link.sector]}</Badge>
                        <Badge variant="outline">{link.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Admin Section */}
      {isAdmin && (
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Administração</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleAdminCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Link to={card.href}>
                <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer border-border/50 hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <card.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {card.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Os valores apresentados nos simuladores são estimados e não substituem o cálculo oficial.
          Consulte o departamento responsável para valores definitivos.
        </p>
      </div>
    </div>
  );
}
