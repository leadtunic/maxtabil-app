import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Search, Download, Filter, User, Settings, FileText, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AuditLog } from "@/types";

const actionIcons: Record<string, React.ElementType> = {
  USER_CREATED: User,
  USER_UPDATED: User,
  LINK_CREATED: Link2,
  LINK_UPDATED: Link2,
  RULESET_CREATED: Settings,
  RULESET_ACTIVATED: Settings,
  SIMULATION_RUN: FileText,
  PDF_GENERATED: FileText,
};

const actionLabels: Record<string, string> = {
  USER_CREATED: "Usuário criado",
  USER_UPDATED: "Usuário atualizado",
  LINK_CREATED: "Link criado",
  LINK_UPDATED: "Link atualizado",
  RULESET_CREATED: "RuleSet criado",
  RULESET_ACTIVATED: "RuleSet ativado",
  SIMULATION_RUN: "Simulação executada",
  PDF_GENERATED: "PDF gerado",
};

const mockAuditLogs: AuditLog[] = [
  {
    id: "log_1",
    actorUserId: "usr_001",
    actorName: "Administrador ESCOFER",
    action: "USER_CREATED",
    entityType: "User",
    entityId: "usr_002",
    metadata: { email: "maria.silva@escofer.com.br" },
    createdAt: new Date("2024-12-27T10:30:00"),
  },
  {
    id: "log_2",
    actorUserId: "usr_001",
    actorName: "Administrador ESCOFER",
    action: "RULESET_ACTIVATED",
    entityType: "RuleSet",
    entityId: "rs_1",
    metadata: { type: "HONORARIOS", version: 3 },
    createdAt: new Date("2024-12-26T14:15:00"),
  },
  {
    id: "log_3",
    actorUserId: "usr_002",
    actorName: "Maria Silva",
    action: "SIMULATION_RUN",
    entityType: "Simulation",
    entityId: "sim_001",
    metadata: { type: "HONORARIOS", total: 1850.0 },
    createdAt: new Date("2024-12-26T11:45:00"),
  },
  {
    id: "log_4",
    actorUserId: "usr_002",
    actorName: "Maria Silva",
    action: "PDF_GENERATED",
    entityType: "Simulation",
    entityId: "sim_001",
    metadata: { type: "HONORARIOS" },
    createdAt: new Date("2024-12-26T11:46:00"),
  },
  {
    id: "log_5",
    actorUserId: "usr_001",
    actorName: "Administrador ESCOFER",
    action: "LINK_CREATED",
    entityType: "Link",
    entityId: "lnk_5",
    metadata: { title: "Simples Nacional" },
    createdAt: new Date("2024-12-25T09:20:00"),
  },
];

export default function AdminAuditoria() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && log.createdAt >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && log.createdAt <= new Date(dateTo + "T23:59:59");
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("pt-BR", {
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
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
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
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">De:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Até:</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
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
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const Icon = actionIcons[log.action] || ClipboardList;
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">{log.actorName}</span>
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
                            {log.entityType}{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {log.entityId}
                            </code>
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata).slice(0, 50)}
                            {JSON.stringify(log.metadata).length > 50 && "..."}
                          </code>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>Mostrando {filteredLogs.length} de {logs.length} registros</p>
            <p>Logs mantidos por 90 dias</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
