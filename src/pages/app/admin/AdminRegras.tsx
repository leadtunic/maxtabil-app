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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Copy, Pencil, Eye, Settings, Trash2 } from "lucide-react";
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

type HonorariosPayload = {
  baseMin: number;
  regimePercentual: {
    SIMPLES: number;
    LUCRO_PRESUMIDO: number;
    LUCRO_REAL: number;
  };
  fatorSegmento: {
    COMERCIO: number;
    PRESTADOR: number;
    INDUSTRIA: number;
  };
  adicFuncionario: number;
  descontoSistemaFinanceiro: number;
  descontoPontoEletronico: number;
};

type RescisaoPayload = {
  multaFgts: number;
  multaAcordo: number;
  diasAvisoPrevioBase: number;
  diasAvisoPrevioPorAno: number;
};

type FeriasPayload = {
  tercoConstitucional: boolean;
  limiteDiasAbono: number;
};

type FatorRPayload = {
  threshold: number;
  annex_if_ge: string;
  annex_if_lt: string;
};

type SimplesAnnex = "I" | "II" | "III" | "IV" | "V";

type SimplesBand = {
  min: number;
  max: number;
  aliquota_nominal: number;
  deducao: number;
};

type SimplesPayload = {
  tables: Record<SimplesAnnex, SimplesBand[]>;
};

export default function AdminRegras() {
  const [activeKey, setActiveKey] = useState<RuleSetKey>("HONORARIOS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSet | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [payloadDraft, setPayloadDraft] = useState<Record<string, unknown>>({});
  const [payloadJsonError, setPayloadJsonError] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);

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

  const annexes: SimplesAnnex[] = ["I", "II", "III", "IV", "V"];

  const clonePayload = (payload: Record<string, unknown>) => {
    return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const updatePayload = (updater: (draft: Record<string, unknown>) => void) => {
    setPayloadDraft((prev) => {
      const next = clonePayload(prev);
      updater(next);
      return next;
    });
  };

  const handlePayloadTextChange = (value: string) => {
    setPayloadText(value);
    if (!advancedMode) return;
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      setPayloadDraft(parsed);
      setPayloadJsonError(null);
    } catch {
      setPayloadJsonError("JSON inválido. Verifique a sintaxe.");
    }
  };

  const handleAdvancedModeChange = (checked: boolean) => {
    if (checked) {
      setPayloadText(JSON.stringify(payloadDraft, null, 2));
      setPayloadJsonError(null);
      setAdvancedMode(true);
      return;
    }

    try {
      const parsed = JSON.parse(payloadText) as Record<string, unknown>;
      setPayloadDraft(parsed);
      setPayloadJsonError(null);
      setAdvancedMode(false);
    } catch {
      toast.error("JSON inválido", { description: "Corrija o JSON antes de voltar ao modo guiado." });
    }
  };

  const handleSimplesBandChange = (
    annex: SimplesAnnex,
    index: number,
    field: keyof SimplesBand,
    value: number,
  ) => {
    updatePayload((draft) => {
      const payload = draft as SimplesPayload;
      if (!payload.tables) {
        payload.tables = { I: [], II: [], III: [], IV: [], V: [] };
      }
      const bands = payload.tables[annex] ?? [];
      const current = bands[index] ?? { min: 0, max: 0, aliquota_nominal: 0, deducao: 0 };
      bands[index] = { ...current, [field]: value };
      payload.tables[annex] = bands;
    });
  };

  const handleAddSimplesBand = (annex: SimplesAnnex) => {
    updatePayload((draft) => {
      const payload = draft as SimplesPayload;
      if (!payload.tables) {
        payload.tables = { I: [], II: [], III: [], IV: [], V: [] };
      }
      const bands = payload.tables[annex] ?? [];
      const lastMax = bands.length ? bands[bands.length - 1].max : 0;
      const nextMin = Number.isFinite(lastMax) ? Number((lastMax + 0.01).toFixed(2)) : 0;
      const nextMax = Number.isFinite(lastMax) ? Number((lastMax + 1).toFixed(2)) : 0;
      bands.push({ min: nextMin, max: nextMax, aliquota_nominal: 0, deducao: 0 });
      payload.tables[annex] = bands;
    });
  };

  const handleRemoveSimplesBand = (annex: SimplesAnnex, index: number) => {
    updatePayload((draft) => {
      const payload = draft as SimplesPayload;
      const bands = payload.tables?.[annex];
      if (!bands || bands.length <= 1) return;
      bands.splice(index, 1);
      payload.tables[annex] = bands;
    });
  };

  const renderCurrencyInput = (
    value: number,
    onChange: (value: number) => void,
    placeholder = "0,00",
  ) => (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
        R$
      </span>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(parseNumber(event.target.value))}
        className="pl-10"
        placeholder={placeholder}
      />
    </div>
  );

  const renderPercentInput = (value: number, onChange: (value: number) => void) => {
    const percentValue = Number.isFinite(value) ? value * 100 : 0;
    return (
      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={Number.isFinite(percentValue) ? percentValue : ""}
          onChange={(event) => onChange(parseNumber(event.target.value) / 100)}
          className="pr-8"
          placeholder="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
          %
        </span>
      </div>
    );
  };

  const renderGuidedEditor = () => {
    if (activeKey === "HONORARIOS") {
      const payload = payloadDraft as HonorariosPayload;
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Base mínima (R$)</Label>
            {renderCurrencyInput(payload.baseMin ?? 0, (value) =>
              updatePayload((draft) => {
                (draft as HonorariosPayload).baseMin = value;
              })
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Regime Simples (%)</Label>
              {renderPercentInput(payload.regimePercentual?.SIMPLES ?? 0, (value) =>
                updatePayload((draft) => {
                  const next = draft as HonorariosPayload;
                  next.regimePercentual = next.regimePercentual ?? {
                    SIMPLES: 0,
                    LUCRO_PRESUMIDO: 0,
                    LUCRO_REAL: 0,
                  };
                  next.regimePercentual.SIMPLES = value;
                })
              )}
            </div>
            <div className="space-y-2">
              <Label>Regime Lucro Presumido (%)</Label>
              {renderPercentInput(payload.regimePercentual?.LUCRO_PRESUMIDO ?? 0, (value) =>
                updatePayload((draft) => {
                  const next = draft as HonorariosPayload;
                  next.regimePercentual = next.regimePercentual ?? {
                    SIMPLES: 0,
                    LUCRO_PRESUMIDO: 0,
                    LUCRO_REAL: 0,
                  };
                  next.regimePercentual.LUCRO_PRESUMIDO = value;
                })
              )}
            </div>
            <div className="space-y-2">
              <Label>Regime Lucro Real (%)</Label>
              {renderPercentInput(payload.regimePercentual?.LUCRO_REAL ?? 0, (value) =>
                updatePayload((draft) => {
                  const next = draft as HonorariosPayload;
                  next.regimePercentual = next.regimePercentual ?? {
                    SIMPLES: 0,
                    LUCRO_PRESUMIDO: 0,
                    LUCRO_REAL: 0,
                  };
                  next.regimePercentual.LUCRO_REAL = value;
                })
              )}
            </div>
            <div className="space-y-2">
              <Label>Adicional por funcionário (R$)</Label>
              {renderCurrencyInput(payload.adicFuncionario ?? 0, (value) =>
                updatePayload((draft) => {
                  (draft as HonorariosPayload).adicFuncionario = value;
                })
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Fator Comércio</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payload.fatorSegmento?.COMERCIO ?? 0}
                onChange={(event) =>
                  updatePayload((draft) => {
                    const next = draft as HonorariosPayload;
                    next.fatorSegmento = next.fatorSegmento ?? {
                      COMERCIO: 0,
                      PRESTADOR: 0,
                      INDUSTRIA: 0,
                    };
                    next.fatorSegmento.COMERCIO = parseNumber(event.target.value);
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fator Prestador</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payload.fatorSegmento?.PRESTADOR ?? 0}
                onChange={(event) =>
                  updatePayload((draft) => {
                    const next = draft as HonorariosPayload;
                    next.fatorSegmento = next.fatorSegmento ?? {
                      COMERCIO: 0,
                      PRESTADOR: 0,
                      INDUSTRIA: 0,
                    };
                    next.fatorSegmento.PRESTADOR = parseNumber(event.target.value);
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fator Indústria</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payload.fatorSegmento?.INDUSTRIA ?? 0}
                onChange={(event) =>
                  updatePayload((draft) => {
                    const next = draft as HonorariosPayload;
                    next.fatorSegmento = next.fatorSegmento ?? {
                      COMERCIO: 0,
                      PRESTADOR: 0,
                      INDUSTRIA: 0,
                    };
                    next.fatorSegmento.INDUSTRIA = parseNumber(event.target.value);
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Desconto Sistema Financeiro (%)</Label>
              {renderPercentInput(payload.descontoSistemaFinanceiro ?? 0, (value) =>
                updatePayload((draft) => {
                  (draft as HonorariosPayload).descontoSistemaFinanceiro = value;
                })
              )}
            </div>
            <div className="space-y-2">
              <Label>Desconto Ponto Eletrônico (%)</Label>
              {renderPercentInput(payload.descontoPontoEletronico ?? 0, (value) =>
                updatePayload((draft) => {
                  (draft as HonorariosPayload).descontoPontoEletronico = value;
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeKey === "RESCISAO") {
      const payload = payloadDraft as RescisaoPayload;
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Multa FGTS (%)</Label>
            {renderPercentInput(payload.multaFgts ?? 0, (value) =>
              updatePayload((draft) => {
                (draft as RescisaoPayload).multaFgts = value;
              })
            )}
          </div>
          <div className="space-y-2">
            <Label>Multa Acordo (%)</Label>
            {renderPercentInput(payload.multaAcordo ?? 0, (value) =>
              updatePayload((draft) => {
                (draft as RescisaoPayload).multaAcordo = value;
              })
            )}
          </div>
          <div className="space-y-2">
            <Label>Dias aviso prévio (base)</Label>
            <Input
              type="number"
              min="0"
              value={payload.diasAvisoPrevioBase ?? 0}
              onChange={(event) =>
                updatePayload((draft) => {
                  (draft as RescisaoPayload).diasAvisoPrevioBase = parseNumber(event.target.value);
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Dias por ano de serviço</Label>
            <Input
              type="number"
              min="0"
              value={payload.diasAvisoPrevioPorAno ?? 0}
              onChange={(event) =>
                updatePayload((draft) => {
                  (draft as RescisaoPayload).diasAvisoPrevioPorAno = parseNumber(event.target.value);
                })
              }
            />
          </div>
        </div>
      );
    }

    if (activeKey === "FERIAS") {
      const payload = payloadDraft as FeriasPayload;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <div>
              <Label htmlFor="terco-constitucional">Incluir 1/3 constitucional</Label>
              <p className="text-xs text-muted-foreground">
                Habilita o adicional automático nas férias.
              </p>
            </div>
            <Switch
              id="terco-constitucional"
              checked={payload.tercoConstitucional ?? true}
              onCheckedChange={(checked) =>
                updatePayload((draft) => {
                  (draft as FeriasPayload).tercoConstitucional = checked;
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Limite de dias de abono</Label>
            <Input
              type="number"
              min="0"
              value={payload.limiteDiasAbono ?? 0}
              onChange={(event) =>
                updatePayload((draft) => {
                  (draft as FeriasPayload).limiteDiasAbono = parseNumber(event.target.value);
                })
              }
            />
          </div>
        </div>
      );
    }

    if (activeKey === "FATOR_R") {
      const payload = payloadDraft as FatorRPayload;
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Threshold (%)</Label>
            {renderPercentInput(payload.threshold ?? 0, (value) =>
              updatePayload((draft) => {
                (draft as FatorRPayload).threshold = value;
              })
            )}
          </div>
          <div className="space-y-2">
            <Label>Anexo se ≥ threshold</Label>
            <Select
              value={payload.annex_if_ge ?? "III"}
              onValueChange={(value) =>
                updatePayload((draft) => {
                  (draft as FatorRPayload).annex_if_ge = value;
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {annexes.map((annex) => (
                  <SelectItem key={annex} value={annex}>
                    Anexo {annex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Anexo se &lt; threshold</Label>
            <Select
              value={payload.annex_if_lt ?? "V"}
              onValueChange={(value) =>
                updatePayload((draft) => {
                  (draft as FatorRPayload).annex_if_lt = value;
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {annexes.map((annex) => (
                  <SelectItem key={annex} value={annex}>
                    Anexo {annex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (activeKey === "SIMPLES_DAS") {
      const payload = payloadDraft as SimplesPayload;
      return (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Edite as faixas de cada anexo. Alíquota é percentual (%).
          </div>
          <Accordion type="multiple" className="rounded-lg border border-border/60">
            {annexes.map((annex) => {
              const bands = payload.tables?.[annex] ?? [];
              return (
                <AccordionItem key={annex} value={annex}>
                  <AccordionTrigger className="px-4">Anexo {annex}</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Faixa</TableHead>
                            <TableHead>Min (R$)</TableHead>
                            <TableHead>Max (R$)</TableHead>
                            <TableHead>Alíquota (%)</TableHead>
                            <TableHead>Dedução (R$)</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bands.length ? (
                            bands.map((band, index) => (
                              <TableRow key={`${annex}-${index}`}>
                                <TableCell className="text-sm text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={Number.isFinite(band.min) ? band.min : ""}
                                    onChange={(event) =>
                                      handleSimplesBandChange(
                                        annex,
                                        index,
                                        "min",
                                        parseNumber(event.target.value),
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={Number.isFinite(band.max) ? band.max : ""}
                                    onChange={(event) =>
                                      handleSimplesBandChange(
                                        annex,
                                        index,
                                        "max",
                                        parseNumber(event.target.value),
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      Number.isFinite(band.aliquota_nominal)
                                        ? band.aliquota_nominal * 100
                                        : ""
                                    }
                                    onChange={(event) =>
                                      handleSimplesBandChange(
                                        annex,
                                        index,
                                        "aliquota_nominal",
                                        parseNumber(event.target.value) / 100,
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={Number.isFinite(band.deducao) ? band.deducao : ""}
                                    onChange={(event) =>
                                      handleSimplesBandChange(
                                        annex,
                                        index,
                                        "deducao",
                                        parseNumber(event.target.value),
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSimplesBand(annex, index)}
                                    disabled={bands.length <= 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                                Nenhuma faixa cadastrada.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSimplesBand(annex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar faixa
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      );
    }

    return null;
  };

  const openCreateDialog = () => {
    const defaultPayload = JSON.parse(
      JSON.stringify(getDefaultPayload(activeKey)),
    ) as Record<string, unknown>;
    setDialogMode("create");
    setEditingRuleSet(null);
    setRuleName("");
    setPayloadDraft(defaultPayload);
    setPayloadText(JSON.stringify(defaultPayload, null, 2));
    setPayloadJsonError(null);
    setAdvancedMode(false);
    setDialogOpen(true);
  };

  const openEditDialog = (ruleSet: RuleSet) => {
    const payloadCopy = JSON.parse(JSON.stringify(ruleSet.payload)) as Record<string, unknown>;
    setDialogMode("edit");
    setEditingRuleSet(ruleSet);
    setRuleName(ruleSet.name);
    setPayloadDraft(payloadCopy);
    setPayloadText(JSON.stringify(payloadCopy, null, 2));
    setPayloadJsonError(null);
    setAdvancedMode(false);
    setDialogOpen(true);
  };

  const openCloneDialog = (ruleSet: RuleSet) => {
    const payloadCopy = JSON.parse(JSON.stringify(ruleSet.payload)) as Record<string, unknown>;
    setDialogMode("clone");
    setEditingRuleSet(ruleSet);
    setRuleName(`${ruleSet.name} (Clone)`);
    setPayloadDraft(payloadCopy);
    setPayloadText(JSON.stringify(payloadCopy, null, 2));
    setPayloadJsonError(null);
    setAdvancedMode(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    let parsed: Record<string, unknown>;
    if (advancedMode) {
      if (payloadJsonError) {
        toast.error("JSON inválido", { description: "Verifique a sintaxe do payload." });
        return;
      }
      try {
        parsed = JSON.parse(payloadText);
      } catch {
        toast.error("JSON inválido", { description: "Verifique a sintaxe do payload." });
        return;
      }
    } else {
      parsed = payloadDraft;
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
        <DialogContent className="max-w-5xl">
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
                Modo avançado (JSON)
              </div>
              <Switch checked={advancedMode} onCheckedChange={handleAdvancedModeChange} />
            </div>
            {advancedMode ? (
              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={payloadText}
                  onChange={(event) => handlePayloadTextChange(event.target.value)}
                  className="font-mono text-sm h-56"
                />
                {payloadJsonError && (
                  <p className="text-xs text-destructive">{payloadJsonError}</p>
                )}
              </div>
            ) : (
              renderGuidedEditor()
            )}
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
