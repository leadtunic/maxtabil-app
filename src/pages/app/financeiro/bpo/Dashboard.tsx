import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  Gauge,
  ArrowUpRight,
} from "lucide-react";

interface BpoDashboardStats {
  totalClients: number;
  activeClients: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksCompletedThisMonth: number;
}

interface BpoInsights {
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  monthlyCompleted: { month: string; count: number }[];
  overdueByPriority: { priority: string; count: number }[];
}

export default function BpoDashboard() {
  const { workspace } = useAuth();
  const [stats, setStats] = useState<BpoDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<BpoInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!workspace) return;

      try {
        const data = await apiRequest<BpoDashboardStats>("/api/bpo/summary");
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [workspace]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!workspace) return;

      try {
        const data = await apiRequest<BpoInsights>("/api/bpo/insights");
        setInsights(data);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchInsights();
  }, [workspace]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const completionRate = stats?.totalTasks
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const maxStatusCount = Math.max(...(insights?.byStatus.map((item) => item.count) || [1]));
  const maxCategoryCount = Math.max(
    ...(insights?.byCategory.map((item) => item.count) || [1])
  );
  const maxMonthCount = Math.max(
    ...(insights?.monthlyCompleted.map((item) => item.count) || [1])
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#121A2B] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
              <Sparkles className="h-4 w-4" />
              Centro BPO Financeiro
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Painel executivo BPO</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Monitoramento em tempo real de clientes, tarefas e metas. Tudo conectado para
              decisões rápidas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/financeiro/bpo/clients">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </Button>
            </Link>
            <Link to="/app/financeiro/bpo/tasks">
              <Button size="sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                Tarefas
              </Button>
            </Link>
            <Link to="/app/financeiro/workspace">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <Target className="h-4 w-4 mr-2" />
                Workspace
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/60">Clientes ativos</p>
            <p className="mt-1 text-2xl font-semibold">{stats?.activeClients || 0}</p>
            <p className="text-xs text-white/50">Base total: {stats?.totalClients || 0}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/60">Tarefas críticas</p>
            <p className="mt-1 text-2xl font-semibold">{stats?.overdueTasks || 0}</p>
            <p className="text-xs text-white/50">Pendentes: {stats?.pendingTasks || 0}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/60">Taxa de conclusão</p>
            <p className="mt-1 text-2xl font-semibold">{completionRate}%</p>
            <p className="text-xs text-white/50">
              Concluídas no mês: {stats?.tasksCompletedThisMonth || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards - Using MetricGrid and MetricCard */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Clientes Ativos"
          value={stats?.activeClients || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Tarefas Pendentes"
          value={stats?.pendingTasks || 0}
          delta={stats?.overdueTasks ? { value: `${stats.overdueTasks} em atraso`, positive: false } : undefined}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Concluídas no Mês"
          value={stats?.tasksCompletedThisMonth || 0}
          icon={<CheckCircle className="h-4 w-4 text-success" />}
        />
        <MetricCard
          label="Taxa de Conclusão"
          value={`${completionRate}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </MetricGrid>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Performance mensal
            </CardTitle>
            <CardDescription>Produtividade do time e volume de entregas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Fechamentos", value: "86%", color: "bg-emerald-500" },
                { label: "Conciliacoes", value: "72%", color: "bg-sky-500" },
                { label: "Relatorios", value: "64%", color: "bg-indigo-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-2xl font-semibold">{item.value}</span>
                    <span className="text-xs text-emerald-600">+3%</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Meta de SLA do mês</p>
                  <p className="text-xs text-muted-foreground">Acompanhamento integrado por cliente</p>
                </div>
                <Badge variant="secondary">Meta 90%</Badge>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-muted">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {stats && stats.overdueTasks > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertCircle className="h-6 w-6 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Você tem <span className="font-mono">{stats.overdueTasks}</span> tarefa{stats.overdueTasks > 1 ? "s" : ""} em atraso
                  </p>
                  <p className="text-xs text-muted-foreground">Priorize para manter o SLA.</p>
                </div>
                <Link to="/app/financeiro/bpo/tasks?filter=overdue">
                  <Button variant="outline" size="sm">
                    Ver tarefas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Operacoes em foco</CardTitle>
              <CardDescription>Alertas e proximas prioridades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "Clientes sem fechamento", detail: "5 clientes aguardando conciliacao", badge: "Atenção" },
                { title: "Relatorios pendentes", detail: "3 relatorios com prazo hoje", badge: "Hoje" },
                { title: "Auditoria interna", detail: "Revisao semanal em andamento", badge: "Programado" },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge variant="outline">{item.badge}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Insights operacionais</CardTitle>
            <CardDescription>Distribuição e metas por status e categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">Status das tarefas</p>
              {(insightsLoading || !insights) && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
              )}
              {!insightsLoading && insights && insights.byStatus.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              )}
              {!insightsLoading &&
                insights?.byStatus.map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.status}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">Categorias em foco</p>
              {(insightsLoading || !insights) && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
              )}
              {!insightsLoading &&
                insights?.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-sky-500"
                          style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas e tendência</CardTitle>
            <CardDescription>Entregas dos últimos meses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-6 items-end gap-2">
              {(insightsLoading || !insights) &&
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              {!insightsLoading &&
                insights?.monthlyCompleted.map((item) => (
                  <div key={item.month} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-3 rounded-full bg-muted">
                      <div
                        className="w-3 rounded-full bg-indigo-500"
                        style={{ height: `${(item.count / maxMonthCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.month}</span>
                  </div>
                ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">Atrasos por prioridade</p>
              {(insightsLoading || !insights) && <Skeleton className="h-10" />}
              {!insightsLoading &&
                insights?.overdueByPriority.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between text-sm">
                    <span>{item.priority}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para as funções mais usadas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/app/financeiro/bpo/clients?action=new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Cadastrar novo cliente
              </Button>
            </Link>
            <Link to="/app/financeiro/bpo/tasks?action=new">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="h-4 w-4 mr-2" />
                Criar nova tarefa
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Tarefas</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="outline">Pendente</Badge>
              </span>
              <span className="font-medium">{stats?.pendingTasks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="default">Em Andamento</Badge>
              </span>
              <span className="font-medium">
                {(stats?.totalTasks || 0) - (stats?.pendingTasks || 0) - (stats?.completedTasks || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Concluído
                </Badge>
              </span>
              <span className="font-medium">{stats?.completedTasks || 0}</span>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Meta semanal
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                74% atingido
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
