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

export default function BpoDashboard() {
  const { workspace } = useAuth();
  const [stats, setStats] = useState<BpoDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">BPO Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral das tarefas e clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/financeiro/bpo/clients">
            <Button variant="outline" size="sm">
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

      {/* Alerts */}
      {stats && stats.overdueTasks > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Você tem <span className="font-mono">{stats.overdueTasks}</span> tarefa{stats.overdueTasks > 1 ? "s" : ""} em atraso
              </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
