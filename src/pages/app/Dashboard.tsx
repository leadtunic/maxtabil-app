import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

type SectorCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  moduleKey: string;
  icon: typeof BarChart3;
};

const sectors: SectorCard[] = [
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Acompanhe honorarios, simuladores e performance de receita.",
    href: "/app/financeiro/honorarios",
    moduleKey: "financeiro",
    icon: TrendingUp,
  },
  {
    id: "bpo",
    title: "BPO Financeiro",
    description: "Monitore clientes, tarefas e SLAs do time financeiro.",
    href: "/app/financeiro/bpo",
    moduleKey: "financeiro_bpo",
    icon: ClipboardList,
  },
  {
    id: "dp",
    title: "Departamento Pessoal",
    description: "Metas de prazos, rescisao e ferias em um unico lugar.",
    href: "/app/dp",
    moduleKey: "dp",
    icon: Users,
  },
  {
    id: "fiscal",
    title: "Fiscal / Contabil",
    description: "Indicadores de DAS, fator R e compliance fiscal.",
    href: "/app/fiscal-contabil",
    moduleKey: "fiscal_contabil",
    icon: BarChart3,
  },
  {
    id: "legalizacao",
    title: "Legalizacao",
    description: "Controle de vencimentos e status de legalizacao.",
    href: "/app/legalizacao",
    moduleKey: "legalizacao",
    icon: CalendarCheck,
  },
  {
    id: "certificado",
    title: "Certificado Digital",
    description: "Renovacoes e riscos criticos sob controle.",
    href: "/app/certificado-digital",
    moduleKey: "certificado_digital",
    icon: ShieldCheck,
  },
];

const kpis = [
  {
    label: "Metas concluidas",
    value: "78%",
    trend: "+6% esta semana",
    progress: 78,
  },
  {
    label: "Pendencias criticas",
    value: "3",
    trend: "-2 vs. semana anterior",
    progress: 35,
  },
  {
    label: "Clientes ativos",
    value: "124",
    trend: "+8 novos",
    progress: 62,
  },
];

export default function Dashboard() {
  const { hasModule, workspace } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Visao integrada dos BIs e metas dos setores
              {workspace?.name ? ` · ${workspace.name}` : ""}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Atualizado em tempo real</Badge>
          <Badge variant="outline">Dados interligados por workspace</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-medium">{kpi.label}</CardTitle>
              <CardDescription>{kpi.trend}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-semibold">{kpi.value}</div>
              <Progress value={kpi.progress} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setores conectados</CardTitle>
          <CardDescription>
            Explore os BIs especificos de cada area e acompanhe metas em conjunto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sectors
            .filter((sector) => hasModule(sector.moduleKey))
            .map((sector) => (
              <div
                key={sector.id}
                className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <sector.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{sector.title}</p>
                    <p className="text-xs text-muted-foreground">{sector.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Metas compartilhadas
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={sector.href}>Abrir</Link>
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
