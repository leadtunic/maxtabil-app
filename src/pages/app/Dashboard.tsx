import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import type { Database } from "@/types/supabase";

type SectorGoalRow = Database["public"]["Tables"]["sector_goals"]["Row"];

type GoalUnit = "currency" | "percent" | "count";

type SectorGoal = {
  sectorKey: string;
  label: string;
  goalLabel: string;
  targetValue: number;
  currentValue: number;
  unit: GoalUnit;
  periodEnd?: string | null;
};

type ChartGoal = SectorGoal & {
  progress: number;
};

const taskPerformance = [
  { week: "Sem 1", planned: 120, completed: 112 },
  { week: "Sem 2", planned: 135, completed: 129 },
  { week: "Sem 3", planned: 142, completed: 136 },
  { week: "Sem 4", planned: 150, completed: 146 },
];

const backlogBySector = [
  { sector: "Financeiro", em_dia: 28, alerta: 9, critico: 4 },
  { sector: "BPO", em_dia: 34, alerta: 12, critico: 6 },
  { sector: "DP", em_dia: 19, alerta: 7, critico: 2 },
  { sector: "Fiscal", em_dia: 22, alerta: 5, critico: 1 },
  { sector: "Legalização", em_dia: 16, alerta: 6, critico: 3 },
  { sector: "Certificado", em_dia: 12, alerta: 4, critico: 1 },
];

const leadTimeDistribution = [
  { range: "0-2d", days: 1, value: 42 },
  { range: "3-5d", days: 4, value: 58 },
  { range: "6-8d", days: 7, value: 33 },
  { range: "9-12d", days: 10, value: 18 },
];

const reworkRate = [
  { week: "Sem 1", retrabalho: 6.2 },
  { week: "Sem 2", retrabalho: 5.4 },
  { week: "Sem 3", retrabalho: 4.1 },
  { week: "Sem 4", retrabalho: 3.6 },
];

const prioritySplit = [
  { name: "Alta", value: 38 },
  { name: "Média", value: 44 },
  { name: "Baixa", value: 18 },
];

const sectorLabels: Record<string, string> = {
  financeiro: "Financeiro",
  bpo: "BPO Financeiro",
  dp: "Departamento Pessoal",
  fiscal_contabil: "Fiscal/Contábil",
  legalizacao: "Legalização",
  certificado_digital: "Certificado Digital",
};

const sectorOrder = [
  "financeiro",
  "bpo",
  "dp",
  "fiscal_contabil",
  "legalizacao",
  "certificado_digital",
];

const defaultGoals: SectorGoal[] = [
  {
    sectorKey: "financeiro",
    label: sectorLabels.financeiro,
    goalLabel: "Receita sob gestão",
    targetValue: 320000,
    currentValue: 248000,
    unit: "currency",
  },
  {
    sectorKey: "bpo",
    label: sectorLabels.bpo,
    goalLabel: "SLA de entregas",
    targetValue: 95,
    currentValue: 87,
    unit: "percent",
  },
  {
    sectorKey: "dp",
    label: sectorLabels.dp,
    goalLabel: "Prazos de folha",
    targetValue: 100,
    currentValue: 92,
    unit: "percent",
  },
  {
    sectorKey: "fiscal_contabil",
    label: sectorLabels.fiscal_contabil,
    goalLabel: "Compliance DAS",
    targetValue: 98,
    currentValue: 90,
    unit: "percent",
  },
  {
    sectorKey: "legalizacao",
    label: sectorLabels.legalizacao,
    goalLabel: "Processos ativos",
    targetValue: 52,
    currentValue: 36,
    unit: "count",
  },
  {
    sectorKey: "certificado_digital",
    label: sectorLabels.certificado_digital,
    goalLabel: "Renovações concluídas",
    targetValue: 80,
    currentValue: 64,
    unit: "percent",
  },
];

const priorityColors = ["#60A5FA", "#FBBF24", "#F87171"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const formatGoalValue = (value: number, unit: GoalUnit) => {
  if (unit === "currency") return formatCurrency(value);
  if (unit === "percent") return `${Math.round(value)}%`;
  return value.toLocaleString("pt-BR");
};

const formatGoalProgress = (current: number, target: number) => {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
};

function useSectorGoals() {
  return useQuery({
    queryKey: ["sector-goals"],
    queryFn: async () => {
      if (!supabase) return [] as SectorGoalRow[];
      const { data, error } = await supabase
        .from("sector_goals")
        .select("*")
        .eq("is_active", true)
        .order("period_end", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default function Dashboard() {
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const { data: sectorGoalsData = [] } = useSectorGoals();

  const goalsBySector = useMemo<ChartGoal[]>(() => {
    const fallbackMap = new Map<string, SectorGoal>();
    defaultGoals.forEach((goal) => fallbackMap.set(goal.sectorKey, goal));

    const latestBySector = new Map<string, SectorGoalRow>();
    sectorGoalsData.forEach((row) => {
      if (!latestBySector.has(row.sector_key)) {
        latestBySector.set(row.sector_key, row);
      }
    });

    latestBySector.forEach((row) => {
      const unit = (row.unit || "count") as GoalUnit;
      const targetValue = row.target_value ?? 0;
      const currentValue = row.current_value ?? 0;
      const goalLabel = row.goal_label || "Meta do setor";
      const label = sectorLabels[row.sector_key] || row.sector_key;

      fallbackMap.set(row.sector_key, {
        sectorKey: row.sector_key,
        label,
        goalLabel,
        targetValue,
        currentValue,
        unit,
        periodEnd: row.period_end,
      });
    });

    return sectorOrder
      .map((key) => fallbackMap.get(key))
      .filter(Boolean)
      .map((goal) => ({
        ...goal!,
        progress: formatGoalProgress(goal!.currentValue, goal!.targetValue),
      }));
  }, [sectorGoalsData]);

  const plannedTotal = taskPerformance.reduce((acc, item) => acc + item.planned, 0);
  const completedTotal = taskPerformance.reduce((acc, item) => acc + item.completed, 0);
  const onTime = completedTotal;
  const late = Math.max(0, plannedTotal - completedTotal);

  const leadTimeAverage = useMemo(() => {
    const total = leadTimeDistribution.reduce((acc, item) => acc + item.value, 0);
    if (!total) return 0;
    const weighted = leadTimeDistribution.reduce((acc, item) => acc + item.days * item.value, 0);
    return Math.round(weighted / total);
  }, []);

  const goalProgressAvg = goalsBySector.length
    ? goalsBySector.reduce((acc, goal) => acc + goal.progress, 0) / goalsBySector.length
    : 0;
  const demandProgress = plannedTotal ? (completedTotal / plannedTotal) * 100 : 0;
  const overallProgress = Math.round(demandProgress * 0.6 + goalProgressAvg * 0.4);

  const handleOpenFullscreen = (id: string) => {
    setFullscreenId(id);
  };

  const handleExitFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    setFullscreenId(null);
  };

  useEffect(() => {
    const element = fullscreenRef.current;
    if (!element || !fullscreenId) return;

    if (element.requestFullscreen) {
      void element.requestFullscreen();
    }
  }, [fullscreenId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenId(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const isCelebration = useMemo(() => {
    if (!fullscreenId) return false;
    if (fullscreenId === "overall") return overallProgress >= 100;
    if (fullscreenId.startsWith("meta-")) {
      const sectorKey = fullscreenId.replace("meta-", "");
      const goal = goalsBySector.find((item) => item.sectorKey === sectorKey);
      return goal ? goal.progress >= 100 : false;
    }
    return false;
  }, [fullscreenId, goalsBySector, overallProgress]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.6 + Math.random() * 1.2,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        color: ["#7CFFB2", "#8AB4FF", "#F9D976", "#FF8FAB", "#A78BFA"][index % 5],
      })),
    []
  );

  const balloonPieces = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, index) => ({
        id: index,
        left: 10 + index * 15,
        delay: index * 0.2,
        color: ["#60A5FA", "#34D399", "#FBBF24", "#F472B6"][index % 4],
      })),
    []
  );

  const goalsChartData = goalsBySector.map((goal) => ({
    sector: goal.label,
    meta: goal.targetValue,
    realizado: goal.currentValue,
  }));

  const overallGoalData = [
    { name: "Atingido", value: Math.min(overallProgress, 100) },
    { name: "Restante", value: Math.max(0, 100 - overallProgress) },
  ];

  const weeklyChartConfig = {
    planned: { label: "Planejado", color: "hsl(var(--chart-1))" },
    completed: { label: "Concluído", color: "hsl(var(--chart-2))" },
  } as const;

  const backlogChartConfig = {
    em_dia: { label: "Em dia", color: "hsl(var(--chart-2))" },
    alerta: { label: "Alerta", color: "hsl(var(--chart-4))" },
    critico: { label: "Crítico", color: "hsl(var(--chart-5))" },
  } as const;

  const goalChartConfig = {
    meta: { label: "Meta", color: "hsl(var(--chart-1))" },
    realizado: { label: "Realizado", color: "hsl(var(--chart-3))" },
  } as const;

  const leadTimeConfig = {
    value: { label: "Volume", color: "hsl(var(--chart-2))" },
  } as const;

  const reworkConfig = {
    retrabalho: { label: "Retrabalho", color: "hsl(var(--chart-4))" },
  } as const;

  const renderFullscreenContent = () => {
    if (!fullscreenId) return null;

    if (fullscreenId.startsWith("meta-")) {
      const sectorKey = fullscreenId.replace("meta-", "");
      const goal = goalsBySector.find((item) => item.sectorKey === sectorKey);
      if (!goal) return null;

      return (
        <Card className="w-full max-w-3xl bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-white">Meta • {goal.label}</CardTitle>
            <CardDescription className="text-white/70">{goal.goalLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-white">
              <span className="text-3xl font-semibold">
                {formatGoalValue(goal.currentValue, goal.unit)}
              </span>
              <Badge variant="outline" className="border-white/30 text-white/70">
                {formatGoalValue(goal.targetValue, goal.unit)}
              </Badge>
            </div>
            <Progress value={goal.progress} className="h-2" />
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Progresso</span>
              <span>{goal.progress}%</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (fullscreenId === "weekly") {
      return (
        <ChartContainer className="h-[360px] w-full" config={weeklyChartConfig}>
          <LineChart data={taskPerformance} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="planned" stroke="var(--color-planned)" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="var(--color-completed)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "backlog") {
      return (
        <ChartContainer className="h-[360px] w-full" config={backlogChartConfig}>
          <BarChart data={backlogBySector} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="sector" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
            <Bar dataKey="em_dia" stackId="a" fill="var(--color-em_dia)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="alerta" stackId="a" fill="var(--color-alerta)" />
            <Bar dataKey="critico" stackId="a" fill="var(--color-critico)" radius={[0, 0, 4, 4]} />
          </BarChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "goals") {
      return (
        <ChartContainer className="h-[360px] w-full" config={goalChartConfig}>
          <BarChart data={goalsChartData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="sector" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? value.toLocaleString("pt-BR") : value
                  }
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
            <Bar dataKey="meta" fill="var(--color-meta)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" fill="var(--color-realizado)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "overall") {
      return (
        <ChartContainer className="h-[360px] w-full" config={{ atingido: { label: "Atingido" } }}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={overallGoalData}
              dataKey="value"
              nameKey="name"
              innerRadius={80}
              outerRadius={130}
              paddingAngle={4}
            >
              {overallGoalData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={index === 0 ? "hsl(var(--chart-2))" : "hsl(var(--muted))"}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "leadtime") {
      return (
        <ChartContainer className="h-[360px] w-full" config={leadTimeConfig}>
          <BarChart data={leadTimeDistribution} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="range" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "quality") {
      return (
        <ChartContainer className="h-[360px] w-full" config={reworkConfig}>
          <AreaChart data={reworkRate} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="rework" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-retrabalho)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-retrabalho)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="retrabalho" stroke="var(--color-retrabalho)" fill="url(#rework)" />
          </AreaChart>
        </ChartContainer>
      );
    }

    if (fullscreenId === "priority") {
      return (
        <ChartContainer className="h-[360px] w-full" config={{}}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={prioritySplit}
              dataKey="value"
              nameKey="name"
              innerRadius={80}
              outerRadius={130}
            >
              {prioritySplit.map((entry, index) => (
                <Cell key={entry.name} fill={priorityColors[index]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              BI de desempenho, metas e saúde operacional das tarefas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Atualizado hoje</Badge>
          <Badge variant="outline">Últimos 30 dias</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-medium">Tarefas no prazo</CardTitle>
            <CardDescription>{onTime.toLocaleString("pt-BR")} entregas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold">{onTime}</div>
            <Progress value={(onTime / plannedTotal) * 100} />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-medium">Atrasadas</CardTitle>
            <CardDescription>{late.toLocaleString("pt-BR")} pendências</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold">{late}</div>
            <Progress value={(late / plannedTotal) * 100} />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-medium">Tempo médio</CardTitle>
            <CardDescription>lead time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold">{leadTimeAverage} dias</div>
            <Progress value={Math.min(100, (leadTimeAverage / 12) * 100)} />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-medium">Meta geral cumprida</CardTitle>
            <CardDescription>operações e financeiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold">{overallProgress}%</div>
            <Progress value={overallProgress} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Metas por setor</CardTitle>
            <CardDescription>Fluxo diário de metas operacionais e financeiras.</CardDescription>
          </div>
          <Badge variant="outline" className="border-border/60">
            {goalsBySector.length} setores ativos
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goalsBySector.map((goal) => (
            <div
              key={goal.sectorKey}
              className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{goal.goalLabel}</p>
                  <p className="text-lg font-semibold">
                    {formatGoalValue(goal.currentValue, goal.unit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta: {formatGoalValue(goal.targetValue, goal.unit)}
                  </p>
                </div>
                <Badge variant="outline" className="border-border/60">
                  {goal.label}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <Progress value={goal.progress} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso do setor</span>
                  <span>{goal.progress}%</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarCheck className="h-4 w-4" />
                  Último ciclo
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenFullscreen(`meta-${goal.sectorKey}`)}
                >
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Maximizar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Desempenho semanal</CardTitle>
              <CardDescription>Planejado x concluído na operação.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("weekly")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[260px] w-full" config={weeklyChartConfig}>
              <LineChart data={taskPerformance} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="planned" stroke="var(--color-planned)" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Backlog por setor</CardTitle>
              <CardDescription>Fila de tarefas e criticidade por área.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("backlog")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[260px] w-full" config={backlogChartConfig}>
              <BarChart data={backlogBySector} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="sector" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                <Bar dataKey="em_dia" stackId="a" fill="var(--color-em_dia)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alerta" stackId="a" fill="var(--color-alerta)" />
                <Bar dataKey="critico" stackId="a" fill="var(--color-critico)" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Metas por setor</CardTitle>
              <CardDescription>Meta x realizado nos últimos 30 dias.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("goals")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[260px] w-full" config={goalChartConfig}>
              <BarChart data={goalsChartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="sector" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number" ? value.toLocaleString("pt-BR") : value
                      }
                    />
                  }
                />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                <Bar dataKey="meta" fill="var(--color-meta)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" fill="var(--color-realizado)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Meta geral</CardTitle>
              <CardDescription>Saúde do conjunto de setores.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("overall")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer className="h-[260px] w-full" config={{}}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={overallGoalData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {overallGoalData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={index === 0 ? "hsl(var(--chart-2))" : "hsl(var(--muted))"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Lead time das tarefas</CardTitle>
              <CardDescription>Distribuição por faixa de dias.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("leadtime")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[260px] w-full" config={leadTimeConfig}>
              <BarChart data={leadTimeDistribution} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Qualidade e prioridades</CardTitle>
              <CardDescription>Retrabalho e divisão de prioridades.</CardDescription>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleOpenFullscreen("quality")}
>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ChartContainer className="h-[220px] w-full" config={reworkConfig}>
              <AreaChart data={reworkRate} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="reworkSmall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-retrabalho)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-retrabalho)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="retrabalho" stroke="var(--color-retrabalho)" fill="url(#reworkSmall)" />
              </AreaChart>
            </ChartContainer>

            <div className="flex h-[220px] items-center justify-center">
              <ChartContainer className="h-[220px] w-full" config={{}}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={prioritySplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {prioritySplit.map((entry, index) => (
                      <Cell key={entry.name} fill={priorityColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {fullscreenId && (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1324] text-white"
        >
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
              15% { opacity: 1; }
              100% { transform: translateY(360px) rotate(360deg); opacity: 0; }
            }
            @keyframes float {
              0% { transform: translateY(0px); opacity: 0.8; }
              100% { transform: translateY(-120px); opacity: 0; }
            }
          `}</style>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1c2b4a_0%,#0B1324_55%,#05070f_100%)]" />
          <div className="absolute top-8 left-8 flex items-center gap-2 text-white/80">
            <Sparkles className="h-5 w-5 text-blue-300" />
            <span className="text-sm font-semibold tracking-wide">ESCOFER</span>
          </div>

          {isCelebration && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                {confettiPieces.map((piece) => (
                  <span
                    key={piece.id}
                    className="absolute top-0 rounded-sm"
                    style={{
                      left: `${piece.left}%`,
                      width: piece.size,
                      height: piece.size * 0.6,
                      background: piece.color,
                      transform: `rotate(${piece.rotate}deg)`,
                      animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
                    }}
                  />
                ))}
              </div>
              <div className="absolute bottom-4 left-0 right-0 pointer-events-none">
                {balloonPieces.map((balloon) => (
                  <div
                    key={balloon.id}
                    className="absolute"
                    style={{
                      left: `${balloon.left}%`,
                      animation: `float 3s ease-in ${balloon.delay}s infinite`,
                    }}
                  >
                    <div
                      className="h-10 w-8 rounded-full"
                      style={{ backgroundColor: balloon.color }}
                    />
                    <div className="mx-auto h-8 w-[2px] bg-white/30" />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6 px-6">
            <div className="flex items-center gap-3">
              {isCelebration ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              ) : (
                <BarChart3 className="h-6 w-6 text-blue-300" />
              )}
              <h2 className="text-xl font-semibold">
                {isCelebration ? "Meta atingida" : "Modo fullscreen"}
              </h2>
            </div>
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              {renderFullscreenContent()}
            </div>
            <Button variant="secondary" onClick={handleExitFullscreen}>
              <Minimize2 className="mr-2 h-4 w-4" />
              Sair do fullscreen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
