import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ClipboardList,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Filter,
  CalendarClock,
  Activity,
  LayoutGrid,
  List,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

type TaskStatus = "pendente" | "em_andamento" | "concluido" | "cancelado";
type TaskPriority = "baixa" | "media" | "alta" | "urgente";
type TaskCategory =
  | "CONTAS_PAGAR"
  | "CONTAS_RECEBER"
  | "CONCILIACAO"
  | "RELATORIOS"
  | "FECHAMENTO"
  | "OUTROS";

interface BpoClient {
  id: string;
  name: string;
}

interface BpoTask {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  bpo_clients?: BpoClient;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "CONTAS_PAGAR", label: "Contas a pagar" },
  { value: "CONTAS_RECEBER", label: "Contas a receber" },
  { value: "CONCILIACAO", label: "Conciliação" },
  { value: "RELATORIOS", label: "Relatórios" },
  { value: "FECHAMENTO", label: "Fechamento" },
  { value: "OUTROS", label: "Outros" },
];

const STATUS_BADGE_VARIANT: Record<TaskStatus, "default" | "secondary" | "outline"> = {
  pendente: "outline",
  em_andamento: "default",
  concluido: "secondary",
  cancelado: "secondary",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  baixa: "text-slate-500",
  media: "text-blue-500",
  alta: "text-orange-500",
  urgente: "text-red-500",
};

export default function BpoTasks() {
  const { workspace } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<BpoTask[]>([]);
  const [clients, setClients] = useState<BpoClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BpoTask | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const requestTimeoutMs = 15000;

  const withTimeout = async <T,>(promise: PromiseLike<T>, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout ao ${label}. Tente novamente.`));
      }, requestTimeoutMs);
    });

    try {
      return await Promise.race([Promise.resolve(promise), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };
  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    description: "",
    category: "OUTROS" as TaskCategory,
    status: "pendente" as TaskStatus,
    priority: "media" as TaskPriority,
    due_date: "",
    assigned_to: "",
  });

  const fetchData = async () => {
    if (!workspace) return;

    try {
      // Fetch clients
      const clientsData = await apiRequest<BpoClient[]>(
        "/api/bpo/clients?activeOnly=true"
      );

      setClients(clientsData || []);

      // Fetch tasks with client info
      const tasksData = await apiRequest<BpoTask[]>("/api/bpo/tasks");
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspace]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openNewDialog();
      searchParams.delete("action");
      setSearchParams(searchParams);
    }
    if (searchParams.get("filter") === "overdue") {
      setStatusFilter("pendente");
      searchParams.delete("filter");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const openNewDialog = () => {
    setEditingTask(null);
    setFormData({
      client_id: "",
      title: "",
      description: "",
      category: "OUTROS",
      status: "pendente",
      priority: "media",
      due_date: "",
      assigned_to: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: BpoTask) => {
    setEditingTask(task);
    setFormData({
      client_id: task.client_id,
      title: task.title,
      description: task.description || "",
      category: task.category || "OUTROS",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assigned_to: task.assigned_to || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!workspace || !formData.title.trim() || !formData.client_id) {
      toast.error("Título e cliente são obrigatórios");
      return;
    }
    if (!formData.due_date) {
      toast.error("Data de vencimento é obrigatória");
      return;
    }

    setIsSaving(true);

    try {
      const taskData = {
        client_id: formData.client_id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
      };

      if (editingTask) {
        await withTimeout(
          apiRequest(`/api/bpo/tasks/${editingTask.id}`, {
            method: "PUT",
            body: taskData,
          }),
          "salvar a tarefa"
        );

        toast.success("Tarefa atualizada!");
      } else {
        await withTimeout(
          apiRequest("/api/bpo/tasks", {
            method: "POST",
            body: taskData,
          }),
          "salvar a tarefa"
        );

        toast.success("Tarefa criada!");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar tarefa", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (task: BpoTask) => {
    if (!confirm(`Tem certeza que deseja excluir "${task.title}"?`)) return;

    try {
      await apiRequest(`/api/bpo/tasks/${task.id}`, { method: "DELETE" });
      toast.success("Tarefa excluída!");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const markAsCompleted = async (task: BpoTask) => {
    try {
      await apiRequest(`/api/bpo/tasks/${task.id}/complete`, { method: "POST" });
      toast.success("Tarefa concluída!");
      fetchData();
    } catch (error) {
      console.error("Complete error:", error);
      toast.error("Erro ao concluir tarefa");
    }
  };

  const isOverdue = (task: BpoTask) => {
    if (!task.due_date || task.status === "concluido" || task.status === "cancelado")
      return false;
    return new Date(task.due_date) < new Date();
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.bpo_clients?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tasksByStatus = STATUS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = filteredTasks.filter((task) => task.status === option.value);
    return acc;
  }, {} as Record<TaskStatus, BpoTask[]>);

  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((task) => task.status === "pendente").length;
  const inProgressCount = tasks.filter((task) => task.status === "em_andamento").length;
  const completedCount = tasks.filter((task) => task.status === "concluido").length;
  const overdueCount = tasks.filter((task) => isOverdue(task)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            BPO Financeiro
          </div>
          <h1 className="mt-2 text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Tarefas BPO
          </h1>
          <p className="text-muted-foreground">
            Fluxo de execução, prioridades e prazos por cliente
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{totalTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Em andamento</CardDescription>
            <CardTitle className="text-2xl">{inProgressCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Concluídas</CardDescription>
            <CardTitle className="text-2xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Em atraso</CardDescription>
            <CardTitle className="text-2xl text-red-500">{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Lista de Tarefas</CardTitle>
              <CardDescription>
                {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-border px-1 py-1 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-3 w-3 mr-1" />
                  Lista
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Kanban
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-52"
                />
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-full px-2 py-1 ${statusFilter === "all" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Todas
                </button>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`rounded-full px-2 py-1 ${statusFilter === opt.value ? "bg-primary/10 text-primary" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Tente outros filtros"
                  : "Crie sua primeira tarefa"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              )}
            </div>
          ) : (
            viewMode === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className={isOverdue(task) ? "bg-red-50" : undefined}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {task.title}
                            {isOverdue(task) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            {task.category
                              ? CATEGORY_OPTIONS.find((o) => o.value === task.category)?.label
                              : "Sem categoria"}
                          </div>
                        </TableCell>
                        <TableCell>{task.bpo_clients?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE_VARIANT[task.status]}>
                            {STATUS_OPTIONS.find((o) => o.value === task.status)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={PRIORITY_COLORS[task.priority]}>
                            {PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.due_date
                            ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                          {task.due_date && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="h-3 w-3" />
                              {isOverdue(task) ? "Atrasada" : "No prazo"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {task.status !== "concluido" && (
                                <DropdownMenuItem onClick={() => markAsCompleted(task)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Concluída
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(task)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-4">
                {STATUS_OPTIONS.map((status) => {
                  const columnTasks = tasksByStatus[status.value];
                  return (
                    <div
                      key={status.value}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={STATUS_BADGE_VARIANT[status.value]}>
                            {status.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {columnTasks.length}
                          </span>
                        </div>
                        {status.value === "pendente" && (
                          <Button size="icon" variant="ghost" onClick={openNewDialog}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 space-y-3">
                        {columnTasks.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                            Sem tarefas aqui
                          </div>
                        ) : (
                          columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-border/60 bg-background p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{task.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {task.bpo_clients?.name || "Sem cliente"}
                                  </p>
                                </div>
                                {isOverdue(task) && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-muted px-2 py-1">
                                  {CATEGORY_OPTIONS.find((o) => o.value === task.category)?.label ||
                                    "Sem categoria"}
                                </span>
                                <span className={`font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                  {PRIORITY_OPTIONS.find((o) => o.value === task.priority)?.label}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {task.due_date
                                    ? format(new Date(task.due_date), "dd/MM", { locale: ptBR })
                                    : "Sem vencimento"}
                                </span>
                                <div className="flex items-center gap-1">
                                  {task.status !== "concluido" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => markAsCompleted(task)}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Concluir
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditDialog(task)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? "Atualize as informações da tarefa"
                : "Preencha os dados da nova tarefa"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => setFormData({ ...formData, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Conciliação bancária"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da tarefa..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as TaskCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v as TaskPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Responsável</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
