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

type SectorGoal = {
  sectorId: string;
  title: string;
  goalLabel: string;
  goalValue: string;
  progress: number;
  highlight: string;
  meta: { label: string; value: string }[];
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

const sectorGoals: SectorGoal[] = [
  {
    sectorId: "financeiro",
    title: "Financeiro",
    goalLabel: "Meta de honorarios",
    goalValue: "R$ 320k",
    progress: 72,
    highlight: "+12% vs. ultimo mes",
    meta: [
      { label: "Receitas recorrentes", value: "R$ 210k" },
      { label: "Boletos pendentes", value: "18" },
    ],
  },
  {
    sectorId: "bpo",
    title: "BPO Financeiro",
    goalLabel: "SLA de entregas",
    goalValue: "94%",
    progress: 84,
    highlight: "5 clientes em alerta",
    meta: [
      { label: "Tarefas concluidas", value: "312" },
      { label: "Atrasos criticos", value: "4" },
    ],
  },
  {
    sectorId: "dp",
    title: "Departamento Pessoal",
    goalLabel: "Prazos de folha",
    goalValue: "100%",
    progress: 91,
    highlight: "2 rescisões pendentes",
    meta: [
      { label: "Ferias processadas", value: "28" },
      { label: "Rescisões no mes", value: "6" },
    ],
  },
  {
    sectorId: "fiscal",
    title: "Fiscal / Contabil",
    goalLabel: "Compliance DAS",
    goalValue: "98%",
    progress: 88,
    highlight: "1 empresa em risco",
    meta: [
      { label: "Fator R valido", value: "86%" },
      { label: "Guias emitidas", value: "142" },
    ],
  },
  {
    sectorId: "legalizacao",
    title: "Legalizacao",
    goalLabel: "Processos ativos",
    goalValue: "47",
    progress: 63,
    highlight: "8 vencimentos proximos",
    meta: [
      { label: "Alvaras em dia", value: "92%" },
      { label: "Protocolos abertos", value: "14" },
    ],
  },
  {
    sectorId: "certificado",
    title: "Certificado Digital",
    goalLabel: "Renovacoes concluídas",
    goalValue: "76%",
    progress: 76,
    highlight: "11 vencem em 30 dias",
    meta: [
      { label: "Certificados ativos", value: "128" },
      { label: "Renovacoes semana", value: "9" },
    ],
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

      <Card>
        <CardHeader>
          <CardTitle>Metas por setor</CardTitle>
          <CardDescription>
            Acompanhe metas individuais e indicadores-chave de cada area.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sectorGoals
            .filter((goal) => {
              const sector = sectors.find((item) => item.id === goal.sectorId);
              return sector ? hasModule(sector.moduleKey) : false;
            })
            .map((goal) => (
              <div
                key={goal.sectorId}
                className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{goal.goalLabel}</p>
                    <p className="text-xl font-semibold">{goal.goalValue}</p>
                  </div>
                  <Badge variant="outline">{goal.title}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <Progress value={goal.progress} />
                  <p className="text-xs text-muted-foreground">{goal.highlight}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  {goal.meta.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p>{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
