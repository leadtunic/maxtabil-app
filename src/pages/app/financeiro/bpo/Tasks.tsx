import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
      const { data: clientsData } = await supabase
        .from("bpo_clients")
        .select("id, name")
        .eq("workspace_id", workspace.id)
        .eq("is_active", true)
        .order("name");

      setClients(clientsData || []);

      // Fetch tasks with client info
      const { data: tasksData, error } = await supabase
        .from("bpo_tasks")
        .select("*, bpo_clients(id, name)")
        .eq("workspace_id", workspace.id)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
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
        completed_at:
          formData.status === "concluido" ? new Date().toISOString() : null,
      };

      if (editingTask) {
        const { error } = await withTimeout(
          supabase
            .from("bpo_tasks")
            .update({
              ...taskData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingTask.id),
          "salvar a tarefa"
        );

        if (error) throw error;
        toast.success("Tarefa atualizada!");
      } else {
        const { error } = await withTimeout(
          supabase.from("bpo_tasks").insert({
            workspace_id: workspace.id,
            ...taskData,
          }),
          "salvar a tarefa"
        );

        if (error) throw error;
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
      const { error } = await supabase
        .from("bpo_tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Tarefa excluída!");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const markAsCompleted = async (task: BpoTask) => {
    try {
      const { error } = await supabase
        .from("bpo_tasks")
        .update({
          status: "concluido",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Tarefas BPO
          </h1>
          <p className="text-muted-foreground">
            Gerencie as tarefas de BPO financeiro
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
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
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
