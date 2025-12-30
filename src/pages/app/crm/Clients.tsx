import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crmClients, clientPlanLabel, clientStatusLabel } from "@/lib/crm";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const formatCurrency = (valueCents?: number) => {
  if (!valueCents) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueCents / 100);
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(value);

export default function CrmClients() {
  const [search, setSearch] = useState("");
  const filteredClients = useMemo(() => {
    return crmClients.filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Carteira ativa e contratos em acompanhamento.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Buscar clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="text-right">BI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                  <TableCell>{clientPlanLabel[client.plan]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border/60">
                      {clientStatusLabel[client.contractStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(client.monthlyFeeCents)}</TableCell>
                  <TableCell>{formatDate(client.startAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/crm/clients/${client.id}/bi`}>Ver BI</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
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
