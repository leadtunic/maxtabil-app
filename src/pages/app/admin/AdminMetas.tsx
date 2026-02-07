import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Target, Plus, Search, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { GoalMetricType, GoalSector, SectorGoal } from "@/types";

const sectors: Array<{ value: GoalSector; label: string }> = [
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "DP", label: "Departamento Pessoal" },
  { value: "FISCAL_CONTABIL", label: "Fiscal/Contábil" },
  { value: "LEGALIZACAO", label: "Legalização" },
  { value: "CERTIFICADO_DIGITAL", label: "Certificado Digital" },
  { value: "ADMIN", label: "Administração" },
  { value: "GERAL", label: "Geral" },
];

const metricTypes: Array<{ value: GoalMetricType; label: string }> = [
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "DEMANDAS", label: "Demandas" },
];

type GoalFormState = {
  sector: GoalSector;
  metric_type: GoalMetricType;
  target_value: string;
  achieved_value: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
};

const defaultFormState: GoalFormState = {
  sector: "FINANCEIRO",
  metric_type: "FINANCEIRO",
  target_value: "",
  achieved_value: "",
  period_start: "",
  period_end: "",
  is_active: true,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const parsePtBrCurrency = (value: string) => {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPtBrCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const amount = Number(digits || "0") / 100;
  return currencyFormatter.format(amount);
};

const toDisplayValue = (goal: SectorGoal, field: "target" | "achieved") => {
  const value = field === "target" ? goal.target_value : goal.achieved_value;
  if (goal.metric_type === "FINANCEIRO") {
    return currencyFormatter.format(Number(value));
  }
  return Number(value).toLocaleString("pt-BR");
};

export default function AdminMetas() {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [metricTypeFilter, setMetricTypeFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SectorGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormState>(defaultFormState);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sector_goals_admin"],
    queryFn: async () => apiRequest<SectorGoal[]>("/api/admin/metas"),
  });

  const goals = data ?? [];

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const normalized = search.trim().toLowerCase();
      const matchesSearch =
        !normalized ||
        goal.sector.toLowerCase().includes(normalized) ||
        goal.metric_type.toLowerCase().includes(normalized);
      const matchesSector = sectorFilter === "ALL" || goal.sector === sectorFilter;
      const matchesType = metricTypeFilter === "ALL" || goal.metric_type === metricTypeFilter;
      return matchesSearch && matchesSector && matchesType;
    });
  }, [goals, metricTypeFilter, search, sectorFilter]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData(defaultFormState);
  };

  const validateForm = () => {
    if (!formData.period_start || !formData.period_end) {
      toast.error("Período obrigatório.");
      return false;
    }

    const target =
      formData.metric_type === "FINANCEIRO"
        ? parsePtBrCurrency(formData.target_value)
        : Number(formData.target_value);

    if (!Number.isFinite(target) || target <= 0) {
      toast.error("A meta deve ser maior que zero.");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const targetValue =
      formData.metric_type === "FINANCEIRO"
        ? parsePtBrCurrency(formData.target_value)
        : Number(formData.target_value || "0");

    const achievedValue =
      formData.metric_type === "FINANCEIRO"
        ? parsePtBrCurrency(formData.achieved_value)
        : Number(formData.achieved_value || "0");

    return {
      sector: formData.sector,
      metricType: formData.metric_type,
      targetValue,
      achievedValue: Number.isFinite(achievedValue) ? achievedValue : 0,
      periodStart: formData.period_start,
      periodEnd: formData.period_end,
      isActive: formData.is_active,
    };
  };

  const handleSaveGoal = async () => {
    if (!validateForm()) return;

    try {
      if (editingGoal) {
        const updated = await apiRequest<SectorGoal>(`/api/admin/metas/${editingGoal.id}`, {
          method: "PUT",
          body: buildPayload(),
        });

        await logAudit("GOAL_UPDATED", "sector_goals", updated.id, {
          sector: updated.sector,
          metric_type: updated.metric_type,
        });
        toast.success("Meta atualizada.");
      } else {
        const inserted = await apiRequest<SectorGoal>("/api/admin/metas", {
          method: "POST",
          body: buildPayload(),
        });

        await logAudit("GOAL_CREATED", "sector_goals", inserted.id, {
          sector: inserted.sector,
          metric_type: inserted.metric_type,
        });
        toast.success("Meta criada.");
      }

      handleCloseDialog();
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar meta.";
      toast.error(message || "Erro ao salvar meta.");
    }
  };

  const handleEditGoal = (goal: SectorGoal) => {
    setEditingGoal(goal);
    setFormData({
      sector: goal.sector,
      metric_type: goal.metric_type,
      target_value:
        goal.metric_type === "FINANCEIRO"
          ? currencyFormatter.format(Number(goal.target_value))
          : String(goal.target_value),
      achieved_value:
        goal.metric_type === "FINANCEIRO"
          ? currencyFormatter.format(Number(goal.achieved_value || 0))
          : String(goal.achieved_value || 0),
      period_start: goal.period_start,
      period_end: goal.period_end,
      is_active: goal.is_active,
    });
    setIsDialogOpen(true);
  };

  const toggleGoalStatus = async (goal: SectorGoal) => {
    try {
      await apiRequest<SectorGoal>(`/api/admin/metas/${goal.id}/toggle-active`, {
        method: "POST",
        body: { isActive: !goal.is_active },
      });
      await logAudit("GOAL_UPDATED", "sector_goals", goal.id, {
        is_active: !goal.is_active,
      });
      toast.success(`Meta ${goal.is_active ? "desativada" : "ativada"}.`);
      refetch();
    } catch (error) {
      toast.error("Não foi possível atualizar o status da meta.");
    }
  };

  const deleteGoal = async (goal: SectorGoal) => {
    try {
      await apiRequest(`/api/admin/metas/${goal.id}`, { method: "DELETE" });
      await logAudit("GOAL_DELETED", "sector_goals", goal.id, {
        sector: goal.sector,
        metric_type: goal.metric_type,
      });
      toast.success("Meta excluída.");
      refetch();
    } catch (error) {
      toast.error("Não foi possível excluir a meta.");
    }
  };

  const handleMetricTypeChange = (value: GoalMetricType) => {
    setFormData((prev) => ({
      ...prev,
      metric_type: value,
      target_value: "",
      achieved_value: "",
    }));
  };

  const handleMoneyFieldChange = (field: "target_value" | "achieved_value", rawValue: string) => {
    setFormData((prev) => ({ ...prev, [field]: formatPtBrCurrencyInput(rawValue) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas</h1>
          <p className="text-muted-foreground">Gerencie metas por setor e tipo.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription>
              Configure setor, tipo de métrica, período e valores da meta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select
                value={formData.sector}
                onValueChange={(value: GoalSector) =>
                  setFormData((prev) => ({ ...prev, sector: value }))
                }
              >
                <SelectTrigger id="sector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric_type">Tipo de métrica</Label>
              <Select value={formData.metric_type} onValueChange={handleMetricTypeChange}>
                <SelectTrigger id="metric_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_value">Meta</Label>
                {formData.metric_type === "FINANCEIRO" ? (
                  <Input
                    id="target_value"
                    value={formData.target_value}
                    onChange={(e) => handleMoneyFieldChange("target_value", e.target.value)}
                    placeholder="R$ 0,00"
                  />
                ) : (
                  <Input
                    id="target_value"
                    type="number"
                    min={0}
                    value={formData.target_value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_value: e.target.value }))}
                    placeholder="0"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="achieved_value">Alcançado</Label>
                {formData.metric_type === "FINANCEIRO" ? (
                  <Input
                    id="achieved_value"
                    value={formData.achieved_value}
                    onChange={(e) => handleMoneyFieldChange("achieved_value", e.target.value)}
                    placeholder="R$ 0,00"
                  />
                ) : (
                  <Input
                    id="achieved_value"
                    type="number"
                    min={0}
                    value={formData.achieved_value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, achieved_value: e.target.value }))}
                    placeholder="0"
                  />
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period_start">Início do período</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData((prev) => ({ ...prev, period_start: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">Fim do período</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData((prev) => ({ ...prev, period_end: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Meta ativa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal}>{editingGoal ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-base">Metas cadastradas</CardTitle>
            <CardDescription>
              Apenas metas ativas aparecem no dashboard.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por setor ou tipo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filtrar setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os setores</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={metricTypeFilter} onValueChange={setMetricTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  {metricTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Alcançado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredGoals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma meta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-medium">{sectors.find((s) => s.value === goal.sector)?.label ?? goal.sector}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {metricTypes.find((m) => m.value === goal.metric_type)?.label ?? goal.metric_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{toDisplayValue(goal, "target")}</TableCell>
                      <TableCell>{toDisplayValue(goal, "achieved")}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(goal.period_start).toLocaleDateString("pt-BR")} até {" "}
                          {new Date(goal.period_end).toLocaleDateString("pt-BR")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={goal.is_active ? "default" : "secondary"}>
                          {goal.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditGoal(goal)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleGoalStatus(goal)}>
                              {goal.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteGoal(goal)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
