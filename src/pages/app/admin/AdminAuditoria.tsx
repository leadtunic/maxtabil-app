import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Search, Filter, User, Settings, FileText, Link2, KeyRound, Target } from "lucide-react";
import { motion } from "framer-motion";
import type { AuditLog } from "@/types";

const actionIcons: Record<string, React.ElementType> = {
  USER_CREATED: User,
  USER_UPDATED: User,
  USER_DISABLED: User,
  USER_DELETED: User,
  PASSWORD_RESET: KeyRound,
  LINK_CREATED: Link2,
  LINK_UPDATED: Link2,
  RULESET_CREATED: Settings,
  RULESET_UPDATED: Settings,
  RULESET_ACTIVATED: Settings,
  LEGAL_DOC_UPSERT: FileText,
  LEGAL_DOC_DELETED: FileText,
  DIGITAL_CERT_UPSERT: FileText,
  DIGITAL_CERT_DELETED: FileText,
  SIMULATION_RUN: FileText,
  LOGIN_SUCCESS: KeyRound,
  GOAL_CREATED: Target,
  GOAL_UPDATED: Target,
  GOAL_DELETED: Target,
};

const actionLabels: Record<string, string> = {
  USER_CREATED: "Usuário criado",
  USER_UPDATED: "Usuário atualizado",
  USER_DISABLED: "Usuário desativado",
  USER_DELETED: "Usuário excluído",
  PASSWORD_RESET: "Senha resetada",
  LINK_CREATED: "Link criado",
  LINK_UPDATED: "Link atualizado",
  RULESET_CREATED: "RuleSet criado",
  RULESET_UPDATED: "RuleSet atualizado",
  RULESET_ACTIVATED: "RuleSet ativado",
  LEGAL_DOC_UPSERT: "Documento atualizado",
  LEGAL_DOC_DELETED: "Documento removido",
  DIGITAL_CERT_UPSERT: "Certificado atualizado",
  DIGITAL_CERT_DELETED: "Certificado removido",
  SIMULATION_RUN: "Simulação executada",
  LOGIN_SUCCESS: "Login realizado",
  GOAL_CREATED: "Meta criada",
  GOAL_UPDATED: "Meta atualizada",
  GOAL_DELETED: "Meta excluída",
};

const pageSize = 15;

export default function AdminAuditoria() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["audit_logs", search, actionFilter, entityFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (actionFilter !== "ALL") {
        params.set("action", actionFilter);
      }
      if (entityFilter !== "ALL") {
        params.set("entity", entityFilter);
      }

      return apiRequest<{ rows: AuditLog[]; count: number }>(
        `/api/audit/logs?${params.toString()}`
      );
    },
  });

  const logs = data?.rows ?? [];
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.count ?? 0) / pageSize)),
    [data?.count],
  );

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
          <p className="text-muted-foreground">Histórico de ações na intranet</p>
          <p className="text-xs text-muted-foreground">
            Registros ficam disponíveis por 30 dias e são removidos automaticamente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ator ou entidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Ações</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Entidades</SelectItem>
                  <SelectItem value="profiles">Usuários</SelectItem>
                  <SelectItem value="app_links">Links</SelectItem>
                  <SelectItem value="rulesets">RuleSets</SelectItem>
                  <SelectItem value="legal_docs">Legalização</SelectItem>
                  <SelectItem value="digital_certs">Certificados</SelectItem>
                  <SelectItem value="sector_goals">Metas</SelectItem>
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
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const Icon = actionIcons[log.action] || ClipboardList;
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">{log.actor_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            <Icon className="w-3 h-3 mr-1" />
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {log.entity_type}{" "}
                            {log.entity_id && (
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {log.entity_id}
                              </code>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            Ver JSON
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })
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

      <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Metadata</DialogTitle>
          </DialogHeader>
          <pre className="rounded-md bg-muted p-4 text-xs overflow-auto">
{selectedLog ? JSON.stringify(selectedLog.metadata, null, 2) : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
