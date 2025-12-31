import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { getDefaultPayload, validateRuleSetPayload } from "@/lib/rulesets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, CheckCircle2, Copy, Pencil, Eye, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { RuleSet, RuleSetKey } from "@/types";

const ruleSetLabels: Record<RuleSetKey, string> = {
  HONORARIOS: "Honorários Contábeis",
  RESCISAO: "Rescisão Trabalhista",
  FERIAS: "Férias",
  FATOR_R: "Fator R",
  SIMPLES_DAS: "DAS Simples Nacional",
};

const simulatorKeys: RuleSetKey[] = [
  "HONORARIOS",
  "RESCISAO",
  "FERIAS",
  "FATOR_R",
  "SIMPLES_DAS",
];

type DialogMode = "create" | "edit" | "clone";

export default function AdminRegras() {
  const [activeKey, setActiveKey] = useState<RuleSetKey>("HONORARIOS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSet | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [advancedMode, setAdvancedMode] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rulesets"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("rulesets")
        .select("*")
        .order("simulator_key", { ascending: true })
        .order("version", { ascending: false });

      if (error) throw error;
      return rows as RuleSet[];
    },
  });

  const ruleSets = data ?? [];

  const rulesByKey = useMemo(() => {
    return simulatorKeys.reduce<Record<RuleSetKey, RuleSet[]>>((acc, key) => {
      acc[key] = ruleSets.filter((rs) => rs.simulator_key === key);
      return acc;
    }, {} as Record<RuleSetKey, RuleSet[]>);
  }, [ruleSets]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingRuleSet(null);
    setRuleName("");
    setPayloadText(JSON.stringify(getDefaultPayload(activeKey), null, 2));
    setAdvancedMode(true);
    setDialogOpen(true);
  };

  const openEditDialog = (ruleSet: RuleSet) => {
    setDialogMode("edit");
    setEditingRuleSet(ruleSet);
    setRuleName(ruleSet.name);
    setPayloadText(JSON.stringify(ruleSet.payload, null, 2));
    setAdvancedMode(true);
    setDialogOpen(true);
  };

  const openCloneDialog = (ruleSet: RuleSet) => {
    setDialogMode("clone");
    setEditingRuleSet(ruleSet);
    setRuleName(`${ruleSet.name} (Clone)`);
    setPayloadText(JSON.stringify(ruleSet.payload, null, 2));
    setAdvancedMode(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      toast.error("JSON inválido", { description: "Verifique a sintaxe do payload." });
      return;
    }

    const validation = validateRuleSetPayload(activeKey, parsed);
    if (!validation.success) {
      toast.error("Payload incompatível com o simulador.");
      return;
    }

    if (dialogMode === "edit" && editingRuleSet) {
      const { error } = await supabase
        .from("rulesets")
        .update({
          name: ruleName || editingRuleSet.name,
          payload: parsed,
        })
        .eq("id", editingRuleSet.id);

      if (error) {
        toast.error("Não foi possível atualizar.");
        return;
      }

      await logAudit("RULESET_UPDATED", "rulesets", editingRuleSet.id, {
        simulator_key: activeKey,
      });
      toast.success("RuleSet atualizado.");
      setDialogOpen(false);
      refetch();
      return;
    }

    const existing = rulesByKey[activeKey] ?? [];
    const maxVersion = existing.length ? Math.max(...existing.map((rs) => rs.version)) : 0;
    const version = maxVersion + 1;

    const { data: inserted, error } = await supabase
      .from("rulesets")
      .insert({
        simulator_key: activeKey,
        name: ruleName || `Versão ${version}`,
        version,
        is_active: false,
        payload: parsed,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Não foi possível criar o RuleSet.");
      return;
    }

    await logAudit("RULESET_CREATED", "rulesets", inserted?.id ?? null, {
      simulator_key: activeKey,
      version,
    });
    toast.success("RuleSet criado.");
    setDialogOpen(false);
    refetch();
  };

  const handleActivate = async (ruleSet: RuleSet) => {
    const { error: deactivateError } = await supabase
      .from("rulesets")
      .update({ is_active: false })
      .eq("simulator_key", ruleSet.simulator_key);

    if (deactivateError) {
      toast.error("Não foi possível desativar versões anteriores.");
      return;
    }

    const { error: activateError } = await supabase
      .from("rulesets")
      .update({ is_active: true })
      .eq("id", ruleSet.id);

    if (activateError) {
      toast.error("Não foi possível ativar.");
      return;
    }

    await logAudit("RULESET_ACTIVATED", "rulesets", ruleSet.id, {
      simulator_key: ruleSet.simulator_key,
      version: ruleSet.version,
    });
    toast.success("RuleSet ativado.");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Regras de Cálculo</h1>
          <p className="text-muted-foreground">Gerencie os RuleSets dos simuladores</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Versão
        </Button>
      </div>

      <Tabs value={activeKey} onValueChange={(value) => setActiveKey(value as RuleSetKey)}>
        <TabsList className="flex flex-wrap">
          {simulatorKeys.map((key) => (
            <TabsTrigger key={key} value={key}>
              {ruleSetLabels[key]}
            </TabsTrigger>
          ))}
        </TabsList>
        {simulatorKeys.map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{ruleSetLabels[key]}</CardTitle>
                <CardDescription>Histórico de versões do simulador.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versão</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : rulesByKey[key]?.length ? (
                        rulesByKey[key].map((ruleSet) => (
                          <motion.tr
                            key={ruleSet.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">v{ruleSet.version}</TableCell>
                            <TableCell>{ruleSet.name}</TableCell>
                            <TableCell>
                              {ruleSet.is_active ? (
                                <Badge className="bg-success/10 text-success">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(ruleSet.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {!ruleSet.is_active && (
                                  <Button size="sm" variant="outline" onClick={() => handleActivate(ruleSet)}>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Ativar
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => openEditDialog(ruleSet)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => openCloneDialog(ruleSet)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => openEditDialog(ruleSet)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum RuleSet encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Editar RuleSet" : dialogMode === "clone" ? "Clonar RuleSet" : "Criar RuleSet"}
            </DialogTitle>
            <DialogDescription>
              {ruleSetLabels[activeKey]} • configure os parâmetros do simulador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
                placeholder="Ex: Versão 1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="w-4 h-4" />
                Modo avançado
              </div>
              <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
            </div>
            <div className="space-y-2">
              <Label>Payload (JSON)</Label>
              <Textarea
                value={payloadText}
                onChange={(event) => setPayloadText(event.target.value)}
                className="font-mono text-sm h-56"
                readOnly={!advancedMode}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {dialogMode === "edit" ? "Salvar alterações" : "Salvar RuleSet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
