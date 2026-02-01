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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Building,
  Loader2,
  Filter,
  Sparkles,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  CalendarClock,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface BpoClient {
  id: string;
  workspace_id: string;
  name: string;
  document: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BpoTimelineTask {
  id: string;
  title: string;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  category: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function BpoClients() {
  const { workspace } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [clients, setClients] = useState<BpoClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<BpoClient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineClient, setTimelineClient] = useState<BpoClient | null>(null);
  const [timelineItems, setTimelineItems] = useState<BpoTimelineTask[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
    is_active: true,
  });

  const fetchClients = async () => {
    if (!workspace) return;

    try {
      const data = await apiRequest<BpoClient[]>("/api/bpo/clients");
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [workspace]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openNewDialog();
      searchParams.delete("action");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const openNewDialog = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      document: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: BpoClient) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document: client.document || "",
      contact_name: client.contact_name || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
      notes: client.notes || "",
      is_active: client.is_active,
    });
    setIsDialogOpen(true);
  };

  const openTimeline = async (client: BpoClient) => {
    setTimelineClient(client);
    setIsTimelineOpen(true);
    setTimelineLoading(true);

    try {
      const data = await apiRequest<BpoTimelineTask[]>(
        `/api/bpo/clients/${client.id}/timeline`
      );
      setTimelineItems(data || []);
    } catch (error) {
      console.error("Timeline error:", error);
      toast.error("Erro ao carregar timeline");
      setTimelineItems([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workspace || !formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSaving(true);

    try {
      if (editingClient) {
        // Update existing
        await apiRequest(`/api/bpo/clients/${editingClient.id}`, {
          method: "PUT",
          body: {
            name: formData.name,
            document: formData.document || null,
            contact_name: formData.contact_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            notes: formData.notes || null,
            is_active: formData.is_active,
          },
        });
        toast.success("Cliente atualizado!");
      } else {
        // Create new
        await apiRequest("/api/bpo/clients", {
          method: "POST",
          body: {
            name: formData.name,
            document: formData.document || null,
            contact_name: formData.contact_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            notes: formData.notes || null,
            is_active: formData.is_active,
          },
        });
        toast.success("Cliente criado!");
      }

      setIsDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client: BpoClient) => {
    if (!confirm(`Tem certeza que deseja excluir "${client.name}"?`)) return;

    try {
      await apiRequest(`/api/bpo/clients/${client.id}`, { method: "DELETE" });
      toast.success("Cliente excluído!");
      fetchClients();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.document?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? client.is_active : !client.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((client) => client.is_active).length;
  const inactiveClients = totalClients - activeClients;
  const withContact = clients.filter(
    (client) => client.contact_email || client.contact_phone
  ).length;

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
            <Users className="h-6 w-6" />
            Clientes BPO
          </h1>
          <p className="text-muted-foreground">
            Visão completa dos clientes, contatos e status operacional
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Total de clientes</CardDescription>
            <CardTitle className="text-2xl">{totalClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-2xl">{activeClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Inativos</CardDescription>
            <CardTitle className="text-2xl">{inactiveClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Com contato cadastrado</CardDescription>
            <CardTitle className="text-2xl">{withContact}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-full px-2 py-1 ${statusFilter === "all" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`rounded-full px-2 py-1 ${statusFilter === "active" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Ativos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`rounded-full px-2 py-1 ${statusFilter === "inactive" ? "bg-primary/10 text-primary" : ""}`}
                >
                  Inativos
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Tente outra busca" : "Cadastre seu primeiro cliente"}
              </p>
              {!searchQuery && (
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.document || "Sem documento"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{client.contact_name || "Contato não informado"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {client.contact_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.contact_phone}
                              </span>
                            )}
                            {client.contact_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.contact_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTimeline(client)}>
                              <Clock className="h-4 w-4 mr-2" />
                              Ver timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(client)}
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
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Atualize as informações do cliente"
                : "Preencha os dados do novo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CNPJ/CPF</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o cliente..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Cliente ativo</Label>
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

      <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Timeline do Cliente</DialogTitle>
            <DialogDescription>
              {timelineClient?.name || "Cliente selecionado"}
            </DialogDescription>
          </DialogHeader>

          {timelineLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
              Nenhuma tarefa encontrada para este cliente.
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {timelineItems.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-2xl border border-border/60 bg-muted/30 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {task.category && <span>{task.category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {task.status === "concluido" ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Concluída
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                        {task.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
