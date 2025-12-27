import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, Check, Eye, History } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { RuleSet, RuleSetType } from "@/types";

const ruleSetTypes: Record<RuleSetType, string> = {
  HONORARIOS: "Honorários Contábeis",
  RESCISAO: "Rescisão Trabalhista",
  FERIAS: "Férias",
};

const mockRuleSets: RuleSet[] = [
  {
    id: "rs_1",
    type: "HONORARIOS",
    version: 3,
    isActive: true,
    payload: {
      baseMin: 600,
      percFaturamento: 0.018,
      adicFuncionario: 35,
      adicSocio: 50,
      percMovimentacao: 0.005,
      fatorRegime: { SIMPLES: 1.0, LUCRO_PRESUMIDO: 1.35, LUCRO_REAL: 1.8 },
    },
    createdBy: "admin@escofer.com.br",
    createdAt: new Date("2024-12-01"),
  },
  {
    id: "rs_2",
    type: "HONORARIOS",
    version: 2,
    isActive: false,
    payload: {
      baseMin: 500,
      percFaturamento: 0.015,
      adicFuncionario: 30,
      adicSocio: 40,
      percMovimentacao: 0.004,
      fatorRegime: { SIMPLES: 1.0, LUCRO_PRESUMIDO: 1.3, LUCRO_REAL: 1.7 },
    },
    createdBy: "admin@escofer.com.br",
    createdAt: new Date("2024-06-15"),
  },
  {
    id: "rs_3",
    type: "RESCISAO",
    version: 2,
    isActive: true,
    payload: { multaFgts: 0.4, multaAcordo: 0.2, diasAvisoPrevioBase: 30, diasAvisoPrevioPorAno: 3 },
    createdBy: "admin@escofer.com.br",
    createdAt: new Date("2024-10-20"),
  },
  {
    id: "rs_4",
    type: "FERIAS",
    version: 1,
    isActive: true,
    payload: { tercoConstitucional: true, limiteDiasAbono: 10 },
    createdBy: "admin@escofer.com.br",
    createdAt: new Date("2024-08-01"),
  },
];

export default function AdminRegras() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>(mockRuleSets);
  const [typeFilter, setTypeFilter] = useState<RuleSetType | "ALL">("ALL");
  const [viewingRuleSet, setViewingRuleSet] = useState<RuleSet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRuleSetType, setNewRuleSetType] = useState<RuleSetType>("HONORARIOS");
  const [newPayload, setNewPayload] = useState("");

  const filteredRuleSets = ruleSets.filter((rs) => {
    return typeFilter === "ALL" || rs.type === typeFilter;
  });

  // Group by type and show active version first
  const groupedRuleSets = filteredRuleSets.reduce((acc, rs) => {
    if (!acc[rs.type]) acc[rs.type] = [];
    acc[rs.type].push(rs);
    return acc;
  }, {} as Record<string, RuleSet[]>);

  const handleCreateRuleSet = () => {
    try {
      const payload = JSON.parse(newPayload);
      const existingOfType = ruleSets.filter((rs) => rs.type === newRuleSetType);
      const maxVersion = Math.max(...existingOfType.map((rs) => rs.version), 0);

      const newRuleSet: RuleSet = {
        id: `rs_${Date.now()}`,
        type: newRuleSetType,
        version: maxVersion + 1,
        isActive: false,
        payload,
        createdBy: "admin@escofer.com.br",
        createdAt: new Date(),
      };

      setRuleSets((prev) => [newRuleSet, ...prev]);
      setIsCreateDialogOpen(false);
      setNewPayload("");
      toast.success(`RuleSet v${newRuleSet.version} criado`, {
        description: "Ative para usar nas simulações",
      });
    } catch {
      toast.error("JSON inválido", { description: "Verifique a sintaxe do payload" });
    }
  };

  const activateRuleSet = (ruleSetId: string, type: RuleSetType) => {
    setRuleSets((prev) =>
      prev.map((rs) =>
        rs.type === type
          ? { ...rs, isActive: rs.id === ruleSetId }
          : rs
      )
    );
    toast.success("RuleSet ativado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Regras de Cálculo</h1>
          <p className="text-muted-foreground">Gerencie os RuleSets dos simuladores</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Versão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Versão</DialogTitle>
              <DialogDescription>
                Defina os parâmetros do novo RuleSet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Simulador</Label>
                <Select
                  value={newRuleSetType}
                  onValueChange={(value: RuleSetType) => setNewRuleSetType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ruleSetTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={newPayload}
                  onChange={(e) => setNewPayload(e.target.value)}
                  placeholder='{ "baseMin": 600, "percFaturamento": 0.018 }'
                  className="font-mono text-sm h-48"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRuleSet}>Criar Versão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={(value: RuleSetType | "ALL") => setTypeFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Tipos</SelectItem>
            {Object.entries(ruleSetTypes).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedRuleSets).map(([type, rules]) => (
          <Card key={type}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {ruleSetTypes[type as RuleSetType]}
                    </CardTitle>
                    <CardDescription>
                      {rules.length} versão(ões) disponível(is)
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <History className="w-3 h-3 mr-1" />
                  {rules.length} versões
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Por</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules
                      .sort((a, b) => b.version - a.version)
                      .map((rs) => (
                        <motion.tr
                          key={rs.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <span className="font-mono font-medium">v{rs.version}</span>
                          </TableCell>
                          <TableCell>
                            {rs.isActive ? (
                              <Badge className="bg-success/10 text-success hover:bg-success/20">
                                <Check className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {rs.createdAt.toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {rs.createdBy}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingRuleSet(rs)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!rs.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => activateRuleSet(rs.id, rs.type)}
                                >
                                  Ativar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View RuleSet Dialog */}
      <Dialog open={!!viewingRuleSet} onOpenChange={(open) => !open && setViewingRuleSet(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewingRuleSet && ruleSetTypes[viewingRuleSet.type]} - v{viewingRuleSet?.version}
            </DialogTitle>
            <DialogDescription>
              Parâmetros de cálculo desta versão
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-auto max-h-96">
              {viewingRuleSet && JSON.stringify(viewingRuleSet.payload, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRuleSet(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
