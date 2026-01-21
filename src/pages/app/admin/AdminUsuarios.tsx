import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, MoreHorizontal, ShieldCheck, RefreshCcw, Trash2, UserX, UserCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Profile, RoleKey } from "@/types";

const roleLabels: Record<RoleKey, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  DP: "Departamento Pessoal",
  FISCAL_CONTABIL: "Fiscal/Contábil",
  LEGALIZACAO_CERT: "Legalização/Certificado",
};

const pageSize = 10;

export default function AdminUsuarios() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({
    display_name: "",
    email: "",
    role: "FINANCEIRO" as RoleKey,
    password: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profiles", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const response = await apiRequest<{ rows: Profile[]; count: number }>(
        `/api/admin/users?${params.toString()}`
      );

      return { rows: response.rows ?? [], count: response.count ?? 0 };
    },
  });

  const profiles = data?.rows ?? [];
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.count ?? 0) / pageSize)),
    [data?.count],
  );

  const handleCreateUser = async () => {
    if (!newUser.display_name || !newUser.email || !newUser.password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await apiRequest("/api/admin/users", {
        method: "POST",
        body: {
          email: newUser.email,
          password: newUser.password,
          display_name: newUser.display_name,
          role: newUser.role,
        },
      });
    } catch (error) {
      toast.error("Falha ao criar usuário.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    toast.success("Usuário criado com sucesso!");
    setIsDialogOpen(false);
    setNewUser({ display_name: "", email: "", role: "FINANCEIRO", password: "" });
    refetch();
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) {
      toast.error("Informe a nova senha.");
      return;
    }

    try {
      await apiRequest(`/api/admin/users/${resetTarget.user_id}/reset-password`, {
        method: "POST",
        body: { new_password: newPassword },
      });
    } catch (error) {
      toast.error("Falha ao resetar senha.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    toast.success("Senha resetada e troca obrigatória ativada.");
    setResetTarget(null);
    setNewPassword("");
  };

  const handleDisableUser = async (profile: Profile) => {
    try {
      await apiRequest(`/api/admin/users/${profile.user_id}/disable`, {
        method: "POST",
      });
    } catch (error) {
      toast.error("Não foi possível desativar.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    toast.success("Usuário desativado.");
    refetch();
  };

  const handleEnableUser = async (profile: Profile) => {
    try {
      await apiRequest(`/api/admin/users/${profile.user_id}/enable`, {
        method: "POST",
      });
      toast.success("Usuário ativado.");
      refetch();
    } catch (error) {
      toast.error("Não foi possível ativar.", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;

    try {
      await apiRequest(`/api/admin/users/${confirmDelete.user_id}`, {
        method: "DELETE",
      });
    } catch (error) {
      toast.error("Não foi possível excluir.", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    toast.success("Usuário excluído.");
    setConfirmDelete(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários da intranet</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar usuário</DialogTitle>
            <DialogDescription>Defina o perfil e a senha inicial do colaborador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={newUser.display_name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Nome do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: RoleKey) => setNewUser((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>Criar usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onOpenChange={() => setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>
              Informe a nova senha. O usuário será forçado a trocar no próximo login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reset-password">Nova senha</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>Atualizar senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o usuário permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "ALL" | "ACTIVE" | "DISABLED") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="DISABLED">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <motion.tr
                      key={profile.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={profile.role === "ADMIN" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {profile.role === "ADMIN" && <ShieldCheck className="w-3 h-3 mr-1" />}
                          {roleLabels[profile.role]}
                        </Badge>
                        {profile.must_change_password && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Troca pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={profile.is_active ? "default" : "secondary"}
                          className={
                            profile.is_active ? "bg-success/10 text-success hover:bg-success/20" : ""
                          }
                        >
                          {profile.is_active ? "Ativo" : "Inativo"}
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
                            <DropdownMenuItem onClick={() => setResetTarget(profile)}>
                              <RefreshCcw className="w-4 h-4 mr-2" />
                              Resetar senha
                            </DropdownMenuItem>
                            {profile.is_active ? (
                              <DropdownMenuItem onClick={() => handleDisableUser(profile)}>
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleEnableUser(profile)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmDelete(profile)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
