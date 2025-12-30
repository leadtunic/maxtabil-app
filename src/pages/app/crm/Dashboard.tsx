import { differenceInDays } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { crmDeals, crmLeads, leadSourceLabel, leadStatusConfig } from "@/lib/crm";
import { ArrowDownRight, ArrowUpRight, MessageCircle, Target, Timer, Users } from "lucide-react";
import type { LeadSource } from "@/types";

const responseTimeSeries = [
  { day: "Seg", minutes: 18 },
  { day: "Ter", minutes: 16 },
  { day: "Qua", minutes: 14 },
  { day: "Qui", minutes: 12 },
  { day: "Sex", minutes: 10 },
  { day: "Sáb", minutes: 9 },
  { day: "Dom", minutes: 11 },
];

const sourceColors = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

export default function CrmDashboard() {
  const now = new Date();
  const newLeads = crmLeads.filter((lead) => differenceInDays(now, lead.createdAt) <= 7).length;
  const inQualification = crmLeads.filter((lead) => lead.status === "IN_QUALIFICATION").length;
  const sqlLeads = crmLeads.filter((lead) => lead.status === "SQL").length;
  const proposals = crmDeals.filter((deal) => deal.stage === "PROPOSAL").length;
  const wins = crmDeals.filter((deal) => deal.stage === "WON").length;

  const sourceData = (Object.keys(leadSourceLabel) as LeadSource[]).map((source) => ({
    name: leadSourceLabel[source],
    value: crmLeads.filter((lead) => lead.source === source).length,
  }));

  const funnelData = [
    { stage: leadStatusConfig.NEW.label, value: crmLeads.filter((lead) => lead.status === "NEW").length },
    {
      stage: leadStatusConfig.IN_QUALIFICATION.label,
      value: crmLeads.filter((lead) => lead.status === "IN_QUALIFICATION").length,
    },
    { stage: leadStatusConfig.MQL.label, value: crmLeads.filter((lead) => lead.status === "MQL").length },
    { stage: leadStatusConfig.SQL.label, value: crmLeads.filter((lead) => lead.status === "SQL").length },
    { stage: "Proposta", value: proposals },
    { stage: "Wins", value: wins },
  ];

  const kpis = [
    {
      label: "Leads novos (7d)",
      value: newLeads,
      trend: "+12%",
      helper: "Meta Ads 61%",
      icon: Users,
      tone: "text-sky-600",
      positive: true,
    },
    {
      label: "Em qualificação",
      value: inQualification,
      trend: "-4%",
      helper: "Últimas 48h",
      icon: MessageCircle,
      tone: "text-amber-600",
      positive: false,
    },
    {
      label: "SQL ativos",
      value: sqlLeads,
      trend: "+8%",
      helper: "Prontos p/ vendas",
      icon: Target,
      tone: "text-emerald-600",
      positive: true,
    },
    {
      label: "Tempo médio resposta",
      value: "12 min",
      trend: "-2 min",
      helper: "Meta: < 15 min",
      icon: Timer,
      tone: "text-indigo-600",
      positive: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">CRM • Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da operação de leads, conversões e atendimento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.positive ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={kpi.label} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
                </div>
                <CardTitle className="text-2xl font-semibold">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon className={`h-3 w-3 ${kpi.positive ? "text-emerald-500" : "text-rose-500"}`} />
                  <span className={kpi.positive ? "text-emerald-600" : "text-rose-600"}>{kpi.trend}</span>
                </div>
                <span>{kpi.helper}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversões por etapa</CardTitle>
            <CardDescription>Distribuição do funil nas últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full aspect-auto"
              config={{
                value: { label: "Leads", color: "hsl(var(--primary))" },
              }}
            >
              <BarChart data={funnelData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Origem dos leads</CardTitle>
            <CardDescription>Participação por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[260px] w-full aspect-auto"
              config={{
                value: { label: "Leads", color: "hsl(var(--primary))" },
              }}
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={entry.name} fill={sourceColors[index % sourceColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap gap-2">
              {sourceData.map((entry, index) => (
                <Badge
                  key={entry.name}
                  variant="outline"
                  className="border border-border/60 bg-background text-foreground"
                  style={{ borderColor: sourceColors[index % sourceColors.length] }}
                >
                  {entry.name}: {entry.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tempo médio de resposta</CardTitle>
            <CardDescription>Minutos até a primeira resposta (últimos 7 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[240px] w-full aspect-auto"
              config={{
                minutes: { label: "Minutos", color: "hsl(var(--info))" },
              }}
            >
              <LineChart data={responseTimeSeries} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--info))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas rápidos</CardTitle>
            <CardDescription>Ações recomendadas para hoje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/60 p-3">
              4 leads SQL aguardando retorno há mais de 24h.
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              2 follow-ups pendentes para leads vindos de Meta Ads.
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              1 cliente em risco com SLA de resposta acima da meta.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
