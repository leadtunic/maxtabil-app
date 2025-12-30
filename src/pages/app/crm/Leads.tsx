import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { crmLeads, leadSourceLabel, leadStatusConfig } from "@/lib/crm";
import { MoreHorizontal, Phone, Plus, Search, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { LeadSource, LeadStatus } from "@/types";

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);

export default function CrmLeads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "ALL">("ALL");

  const filteredLeads = useMemo(() => {
    return crmLeads.filter((lead) => {
      const matchesSearch = [lead.name, lead.companyName ?? "", lead.phoneE164]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "ALL" || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [search, statusFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">
            Acompanhe conversas, status e atribuições do time comercial.
          </p>
        </div>
        <Button onClick={() => toast.info("Em breve", { description: "Cadastro manual de lead." })}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filtros rápidos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa ou telefone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(leadStatusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as LeadSource | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as origens</SelectItem>
              {Object.entries(leadSourceLabel).map(([source, label]) => (
                <SelectItem key={source} value={source}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Último contato</TableHead>
                <TableHead>Próximo follow-up</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link to={`/app/crm/leads/${lead.id}`} className="font-medium text-foreground hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{lead.companyName ?? "Sem empresa cadastrada"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phoneE164}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${leadStatusConfig[lead.status].className}`}>
                      {leadStatusConfig[lead.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{leadSourceLabel[lead.source]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border/60">
                      {lead.score}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.owner ?? "Fila automática"}</TableCell>
                  <TableCell>{formatDateTime(lead.lastContactAt)}</TableCell>
                  <TableCell>{lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Atribuir vendedor", { description: lead.name })}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Atribuir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Criar tarefa", { description: lead.name })}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Criar tarefa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Iniciar ligação", { description: lead.phoneE164 })}>
                          <Phone className="mr-2 h-4 w-4" />
                          Ligar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum lead encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
