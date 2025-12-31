import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useActiveRuleSet } from "@/hooks/use-active-ruleset";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Scale, BarChart3 } from "lucide-react";
import type { RuleSet } from "@/types";

type SimplesAnnex = "I" | "II" | "III" | "IV" | "V";

interface SimplesBand {
  min: number;
  max: number;
  aliquota_nominal: number;
  deducao: number;
}

interface SimplesPayload {
  tables: Record<SimplesAnnex, SimplesBand[]>;
}

interface FatorRPayload {
  threshold: number;
  annex_if_ge: string;
  annex_if_lt: string;
}

export default function FiscalContabil() {
  const [rbt12, setRbt12] = useState("");
  const [folha, setFolha] = useState("");
  const [dasAnnex, setDasAnnex] = useState<SimplesAnnex | "AUTO">("AUTO");
  const [dasRbt12, setDasRbt12] = useState("");
  const [dasRpa, setDasRpa] = useState("");
  const [compareAnnex, setCompareAnnex] = useState<SimplesAnnex>("III");
  const [compareRbt12, setCompareRbt12] = useState("");
  const [compareRpa, setCompareRpa] = useState("");
  const [ruleSetOld, setRuleSetOld] = useState<string>("");
  const [ruleSetNew, setRuleSetNew] = useState<string>("");

  const fatorRQuery = useActiveRuleSet("FATOR_R");
  const simplesQuery = useActiveRuleSet("SIMPLES_DAS");

  const { data: simplesRuleSets } = useQuery({
    queryKey: ["rulesets", "simples_das", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rulesets")
        .select("*")
        .eq("simulator_key", "SIMPLES_DAS")
        .order("version", { ascending: false });
      if (error) throw error;
      return data as RuleSet[];
    },
  });

  const parseCurrency = (value: string) =>
    parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatPercent = (value: number) =>
    `${(value * 100).toFixed(2).replace(".", ",")}%`;

  const fatorPayload = (fatorRQuery.data?.payload ?? {}) as FatorRPayload;
  const simplesPayload = (simplesQuery.data?.payload ?? {}) as SimplesPayload;

  const fatorR = useMemo(() => {
    const receita = parseCurrency(rbt12);
    const folhaTotal = parseCurrency(folha);
    if (!receita) return 0;
    return folhaTotal / receita;
  }, [folha, rbt12]);

  const fatorRStatus = fatorR >= (fatorPayload.threshold ?? 0.28)
    ? fatorPayload.annex_if_ge ?? "III"
    : fatorPayload.annex_if_lt ?? "V";

  const computeSimples = (payload: SimplesPayload, annex: SimplesAnnex, rbt: number, rpa: number) => {
    const bands = payload.tables?.[annex] ?? [];
    const band =
      bands.find((item) => rbt >= item.min && rbt <= item.max) || bands[bands.length - 1];

    if (!band || !rbt) {
      return null;
    }

    const aliquotaEfetiva = (rbt * band.aliquota_nominal - band.deducao) / rbt;
    const das = rpa * aliquotaEfetiva;

    return {
      band,
      aliquotaEfetiva,
      das,
    };
  };

  const dasAnnexResolved: SimplesAnnex = dasAnnex === "AUTO"
    ? (fatorRStatus as SimplesAnnex)
    : dasAnnex;

  const dasResult = useMemo(() => {
    const rbt = parseCurrency(dasRbt12);
    const rpa = parseCurrency(dasRpa);
    if (!rbt || !rpa) return null;
    return computeSimples(simplesPayload, dasAnnexResolved, rbt, rpa);
  }, [dasAnnexResolved, dasRbt12, dasRpa, simplesPayload]);

  const compareResult = useMemo(() => {
    const rbt = parseCurrency(compareRbt12);
    const rpa = parseCurrency(compareRpa);
    if (!rbt || !rpa) return null;

    const oldPayload = simplesRuleSets?.find((rs) => rs.id === ruleSetOld)?.payload as SimplesPayload | undefined;
    const newPayload = simplesRuleSets?.find((rs) => rs.id === ruleSetNew)?.payload as SimplesPayload | undefined;
    if (!oldPayload || !newPayload) return null;

    const oldCalc = computeSimples(oldPayload, compareAnnex, rbt, rpa);
    const newCalc = computeSimples(newPayload, compareAnnex, rbt, rpa);
    if (!oldCalc || !newCalc) return null;

    return { oldCalc, newCalc };
  }, [compareAnnex, compareRbt12, compareRpa, ruleSetNew, ruleSetOld, simplesRuleSets]);

  const delta = compareResult
    ? compareResult.newCalc.das - compareResult.oldCalc.das
    : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Fiscal/Contábil</h1>
        <p className="text-muted-foreground">
          Simuladores de Fator R e DAS do Simples Nacional.
        </p>
      </div>

      <Tabs defaultValue="fator-r">
        <TabsList>
          <TabsTrigger value="fator-r">Fator R</TabsTrigger>
          <TabsTrigger value="das">DAS Simples</TabsTrigger>
          <TabsTrigger value="comparador">Simples Antigo x Novo</TabsTrigger>
        </TabsList>

        <TabsContent value="fator-r">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="w-4 h-4" /> Fator R
              </CardTitle>
              <CardDescription>
                Calcule o enquadramento do anexo com base na folha dos últimos 12 meses.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rbt12">Receita bruta (RBT12)</Label>
                  <Input id="rbt12" value={rbt12} onChange={(e) => setRbt12(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folha">Folha de pagamento (12 meses)</Label>
                  <Input id="folha" value={folha} onChange={(e) => setFolha(e.target.value)} />
                </div>
                {fatorRQuery.data?.isFallback && (
                  <Badge variant="outline">Usando parâmetros padrão (sem RuleSet ativo)</Badge>
                )}
              </div>
              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardDescription>Fator R</CardDescription>
                    <CardTitle className="text-3xl">{formatPercent(fatorR)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-success/10 text-success">
                      Enquadrável no Anexo {fatorRStatus}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Limite atual: {(fatorPayload.threshold ?? 0.28) * 100}%.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="das">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-4 h-4" /> DAS Simples Nacional
              </CardTitle>
              <CardDescription>
                Calcule alíquota efetiva e valor estimado do DAS.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Anexo</Label>
                  <Select value={dasAnnex} onValueChange={(value) => setDasAnnex(value as SimplesAnnex | "AUTO")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Auto (Fator R)</SelectItem>
                      <SelectItem value="I">Anexo I</SelectItem>
                      <SelectItem value="II">Anexo II</SelectItem>
                      <SelectItem value="III">Anexo III</SelectItem>
                      <SelectItem value="IV">Anexo IV</SelectItem>
                      <SelectItem value="V">Anexo V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RBT12 (12 meses)</Label>
                  <Input value={dasRbt12} onChange={(e) => setDasRbt12(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>RPA (mês atual)</Label>
                  <Input value={dasRpa} onChange={(e) => setDasRpa(e.target.value)} />
                </div>
                {simplesQuery.data?.isFallback && (
                  <Badge variant="outline">Usando tabela padrão (sem RuleSet ativo)</Badge>
                )}
              </div>
              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardDescription>Resultado</CardDescription>
                    <CardTitle className="text-2xl">
                      {dasResult ? formatCurrency(dasResult.das) : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div>
                      Anexo aplicado: <strong>{dasAnnexResolved}</strong>
                    </div>
                    <div>
                      Faixa: {dasResult ? formatPercent(dasResult.band.aliquota_nominal) : "—"}
                    </div>
                    <div>
                      Dedução: {dasResult ? formatCurrency(dasResult.band.deducao) : "—"}
                    </div>
                    <div>
                      Alíquota efetiva: {dasResult ? formatPercent(dasResult.aliquotaEfetiva) : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparador">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-4 h-4" /> Simples Antigo x Novo
              </CardTitle>
              <CardDescription>
                Compare dois RuleSets do SIMPLES_DAS com os mesmos inputs.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>RuleSet Antigo</Label>
                  <Select value={ruleSetOld} onValueChange={setRuleSetOld}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {simplesRuleSets?.map((ruleSet) => (
                        <SelectItem key={ruleSet.id} value={ruleSet.id}>
                          {ruleSet.name} (v{ruleSet.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RuleSet Novo</Label>
                  <Select value={ruleSetNew} onValueChange={setRuleSetNew}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {simplesRuleSets?.map((ruleSet) => (
                        <SelectItem key={ruleSet.id} value={ruleSet.id}>
                          {ruleSet.name} (v{ruleSet.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anexo</Label>
                  <Select value={compareAnnex} onValueChange={(value) => setCompareAnnex(value as SimplesAnnex)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">Anexo I</SelectItem>
                      <SelectItem value="II">Anexo II</SelectItem>
                      <SelectItem value="III">Anexo III</SelectItem>
                      <SelectItem value="IV">Anexo IV</SelectItem>
                      <SelectItem value="V">Anexo V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RBT12</Label>
                  <Input value={compareRbt12} onChange={(e) => setCompareRbt12(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>RPA</Label>
                  <Input value={compareRpa} onChange={(e) => setCompareRpa(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardDescription>Comparativo</CardDescription>
                    <CardTitle className="text-2xl">
                      {compareResult ? formatCurrency(delta) : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>DAS Antigo</span>
                      <strong>{compareResult ? formatCurrency(compareResult.oldCalc.das) : "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>DAS Novo</span>
                      <strong>{compareResult ? formatCurrency(compareResult.newCalc.das) : "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Delta (%)</span>
                      <strong>
                        {compareResult && compareResult.oldCalc.das
                          ? formatPercent(delta / compareResult.oldCalc.das)
                          : "—"}
                      </strong>
                    </div>
                    <Button variant="outline" size="sm" disabled={!compareResult}>
                      Gerar relatório
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
