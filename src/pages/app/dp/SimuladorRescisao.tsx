import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileDown, FileText, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { BreakdownItem } from "@/types";
import { useActiveRuleSet } from "@/hooks/use-active-ruleset";
import { getDefaultPayload } from "@/lib/rulesets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  salarioBase: string;
  incluirFerias: boolean;
  incluirDecimoTerceiro: boolean;
  faltasMes: string;
  anosServico: string;
  tipoRescisao: "SEM_JUSTA_CAUSA" | "ACORDO";
}

interface SimulationResult {
  total: number;
  breakdown: BreakdownItem[];
  createdAt: Date;
  inputs: {
    salarioBase: number;
    incluirFerias: boolean;
    incluirDecimoTerceiro: boolean;
    faltasMes: number;
    anosServico: number;
    tipoRescisao: "SEM_JUSTA_CAUSA" | "ACORDO";
  };
}

const initialFormData: FormData = {
  salarioBase: "",
  incluirFerias: false,
  incluirDecimoTerceiro: false,
  faltasMes: "0",
  anosServico: "0",
  tipoRescisao: "SEM_JUSTA_CAUSA",
};

interface RescisaoPayload {
  multaFgts: number;
  multaAcordo: number;
  diasAvisoPrevioBase: number;
  diasAvisoPrevioPorAno: number;
}

export default function SimuladorRescisao() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const rulesetQuery = useActiveRuleSet("RESCISAO");
  const payload = (rulesetQuery.data?.payload ??
    getDefaultPayload("RESCISAO")) as RescisaoPayload;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d.,-]/g, "");
    if (!cleaned) return 0;
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma > lastDot) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const normalized = cleaned.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatDateTime = (value: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(value);
  };

  const formatYesNo = (value: boolean): string => (value ? "Sim" : "Não");

  const handleCurrencyInput = (field: keyof FormData, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const formatted = numericValue
      ? (parseInt(numericValue, 10) / 100).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";
    setFormData((prev) => ({ ...prev, [field]: formatted }));
  };

  const buildReportHtml = (payload: SimulationResult) => {
    const breakdownRows = payload.breakdown
      .map(
        (item) => `
          <tr>
            <td>
              <div class="item-title">${item.label}</div>
              <div class="item-meta">${item.formulaText}</div>
            </td>
            <td class="amount ${item.sign === "-" ? "neg" : ""}">
              ${item.sign === "-" ? "-" : ""}${formatCurrency(item.amount)}
            </td>
          </tr>
        `
      )
      .join("");

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório de Simulação - Rescisão</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px 40px;
        font-family: "Georgia", "Times New Roman", serif;
        color: #0f172a;
        background: #ffffff;
      }
      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
      }
      .eyebrow {
        font-size: 11px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #64748b;
      }
      h1 {
        margin: 8px 0 4px;
        font-size: 20px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .meta {
        font-size: 12px;
        color: #475569;
      }
      .tag {
        border: 1px solid #0f172a;
        padding: 6px 12px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      h2 {
        margin: 20px 0 8px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #1f2937;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .simple th,
      .simple td {
        text-align: left;
        font-size: 13px;
        padding: 6px 0;
      }
      .simple th {
        color: #475569;
        font-weight: 600;
        width: 40%;
      }
      .detail th,
      .detail td {
        border-top: 1px solid #e2e8f0;
        padding: 10px 0;
        font-size: 13px;
        vertical-align: top;
      }
      .detail th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #64748b;
      }
      .item-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .item-meta {
        font-size: 12px;
        color: #64748b;
      }
      .amount {
        text-align: right;
        font-weight: 600;
        white-space: nowrap;
      }
      .amount.neg {
        color: #b91c1c;
      }
      .total {
        margin-top: 20px;
        border: 1px solid #0f172a;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 600;
      }
      .footer {
        margin-top: 24px;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="eyebrow">Departamento Pessoal</div>
        <h1>Relatório de Simulação - Rescisão</h1>
        <div class="meta">Gerado em ${formatDateTime(payload.createdAt)}</div>
      </div>
      <div class="tag">Simulação Simplificada</div>
    </div>

    <h2>Dados informados</h2>
    <table class="simple">
      <tr>
        <th>Salário base</th>
        <td>${formatCurrency(payload.inputs.salarioBase)}</td>
      </tr>
      <tr>
        <th>Férias</th>
        <td>${formatYesNo(payload.inputs.incluirFerias)}</td>
      </tr>
      <tr>
        <th>13º salário</th>
        <td>${formatYesNo(payload.inputs.incluirDecimoTerceiro)}</td>
      </tr>
      <tr>
        <th>Faltas no mês</th>
        <td>${payload.inputs.faltasMes}</td>
      </tr>
      <tr>
        <th>Anos de serviço</th>
        <td>${payload.inputs.anosServico}</td>
      </tr>
      <tr>
        <th>Tipo de rescisão</th>
        <td>${payload.inputs.tipoRescisao === "ACORDO" ? "Acordo" : "Sem justa causa"}</td>
      </tr>
    </table>

    <h2>Detalhamento</h2>
    <table class="detail">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${breakdownRows}
      </tbody>
    </table>

    <div class="total">
      <span>Total estimado</span>
      <span>${formatCurrency(payload.total)}</span>
    </div>

    <div class="footer">
      Relatório para fins informativos. Valores podem variar conforme regras internas e convenções coletivas.
    </div>
  </body>
</html>`;
  };

  const calculateRescisao = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const salario = parseCurrency(formData.salarioBase);
      const faltas = Math.max(parseInt(formData.faltasMes, 10) || 0, 0);
      const anosServico = Math.max(parseInt(formData.anosServico, 10) || 0, 0);
      const valorDiario = salario / 30;
      const descontoFaltas = faltas * valorDiario;
      const avisoDias = payload.diasAvisoPrevioBase + anosServico * payload.diasAvisoPrevioPorAno;
      const avisoValor = avisoDias > 0 ? valorDiario * avisoDias : 0;

      const breakdown: BreakdownItem[] = [];
      let total = 0;

      breakdown.push({
        label: "Salário base do mês",
        base: salario,
        formulaText: "Salário informado",
        amount: salario,
        sign: "+",
      });
      total += salario;

      if (faltas > 0) {
        breakdown.push({
          label: "Desconto por faltas",
          base: faltas,
          formulaText: `${faltas} faltas × (${formatCurrency(salario)} ÷ 30)`,
          amount: descontoFaltas,
          sign: "-",
        });
        total -= descontoFaltas;
      }

      if (formData.incluirFerias) {
        breakdown.push({
          label: "Férias",
          base: salario,
          formulaText: "Salário informado",
          amount: salario,
          sign: "+",
        });
        breakdown.push({
          label: "1/3 Constitucional",
          base: salario,
          formulaText: `${formatCurrency(salario)} ÷ 3`,
          amount: salario / 3,
          sign: "+",
        });
        total += salario + salario / 3;
      }

      if (formData.incluirDecimoTerceiro) {
        breakdown.push({
          label: "13º Salário",
          base: salario,
          formulaText: "Salário informado",
          amount: salario,
          sign: "+",
        });
        total += salario;
      }

      if (avisoValor > 0) {
        breakdown.push({
          label: "Aviso prévio",
          base: avisoDias,
          formulaText: `${avisoDias} dias × (${formatCurrency(salario)} ÷ 30)`,
          amount: avisoValor,
          sign: "+",
        });
        total += avisoValor;
      }

      const multaPercent =
        formData.tipoRescisao === "ACORDO" ? payload.multaAcordo : payload.multaFgts;
      const multaValor = salario * multaPercent;
      if (multaValor > 0) {
        breakdown.push({
          label: "Multa FGTS",
          base: multaPercent,
          formulaText: `${(multaPercent * 100).toFixed(0)}% × ${formatCurrency(salario)}`,
          amount: multaValor,
          sign: "+",
        });
        total += multaValor;
      }

      setResult({
        total,
        breakdown,
        createdAt: new Date(),
        inputs: {
          salarioBase: salario,
          incluirFerias: formData.incluirFerias,
          incluirDecimoTerceiro: formData.incluirDecimoTerceiro,
          faltasMes: faltas,
          anosServico,
          tipoRescisao: formData.tipoRescisao,
        },
      });
      setIsCalculating(false);
      toast.success("Simulação calculada com sucesso!");
    }, 600);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult(null);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const reportWindow = window.open("", "_blank", "width=980,height=720");
    if (!reportWindow) {
      toast.error("Não foi possível abrir o relatório.", {
        description: "Permita pop-ups para gerar o PDF.",
      });
      return;
    }
    reportWindow.document.open();
    reportWindow.document.write(buildReportHtml(result));
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    toast.info("Relatório aberto. Use \"Salvar como PDF\" no diálogo de impressão.");
  };

  const faltasValue = parseInt(formData.faltasMes, 10);
  const anosValue = parseInt(formData.anosServico, 10);
  const isFormValid =
    parseCurrency(formData.salarioBase) > 0 &&
    !Number.isNaN(faltasValue) &&
    faltasValue >= 0 &&
    !Number.isNaN(anosValue) &&
    anosValue >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">DP</Badge>
          {rulesetQuery.data?.isFallback && (
            <Badge variant="outline" className="text-xs">RuleSet padrão</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">Simulador de Rescisão</h1>
        <p className="text-muted-foreground">
          Simule um cálculo simplificado de rescisão com salário, férias, 13º e faltas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Dados da Simulação</CardTitle>
            <CardDescription>Informe as variáveis básicas do desligamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salario">Salário Base Mensal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id="salario"
                  value={formData.salarioBase}
                  onChange={(e) => handleCurrencyInput("salarioBase", e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <div>
                  <Label htmlFor="ferias">Incluir Férias</Label>
                  <p className="text-xs text-muted-foreground">Somar férias + 1/3 constitucional</p>
                </div>
                <Switch
                  id="ferias"
                  checked={formData.incluirFerias}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, incluirFerias: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <div>
                  <Label htmlFor="decimo">Incluir 13º Salário</Label>
                  <p className="text-xs text-muted-foreground">Adicionar um salário ao total</p>
                </div>
                <Switch
                  id="decimo"
                  checked={formData.incluirDecimoTerceiro}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, incluirDecimoTerceiro: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faltas">Faltas no Mês</Label>
              <Input
                id="faltas"
                type="number"
                min="0"
                value={formData.faltasMes}
                onChange={(e) => setFormData((prev) => ({ ...prev, faltasMes: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Cada falta desconta 1/30 do salário mensal.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anos">Anos de serviço</Label>
              <Input
                id="anos"
                type="number"
                min="0"
                value={formData.anosServico}
                onChange={(e) => setFormData((prev) => ({ ...prev, anosServico: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Usado para calcular dias de aviso prévio.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de rescisão</Label>
              <Select
                value={formData.tipoRescisao}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipoRescisao: value as FormData["tipoRescisao"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEM_JUSTA_CAUSA">Sem justa causa</SelectItem>
                  <SelectItem value="ACORDO">Acordo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button
                onClick={calculateRescisao}
                disabled={!isFormValid || isCalculating}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="h-full relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Resultado</CardTitle>
                      <CardDescription>Total estimado da rescisão</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Estimado</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(result.total)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Resumo
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Férias: {formatYesNo(result.inputs.incluirFerias)}
                        </Badge>
                        <Badge variant="secondary">
                          13º: {formatYesNo(result.inputs.incluirDecimoTerceiro)}
                        </Badge>
                        <Badge variant="outline">Faltas: {result.inputs.faltasMes}</Badge>
                        <Badge variant="outline">Anos: {result.inputs.anosServico}</Badge>
                        <Badge variant="outline">
                          Tipo: {result.inputs.tipoRescisao === "ACORDO" ? "Acordo" : "Sem justa causa"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Salário</span>
                          <span className="font-medium">
                            {formatCurrency(result.inputs.salarioBase)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Gerado em</span>
                          <span className="font-medium">{formatDateTime(result.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Observações
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Simulação focada em salário, férias, 13º e faltas. Outras verbas não
                        entram neste cálculo simplificado.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Detalhamento</p>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.breakdown.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{item.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.formulaText}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono text-sm ${
                                  item.sign === "-" ? "text-destructive" : ""
                                }`}
                              >
                                {item.sign === "-" ? "−" : ""}
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">RuleSet simplificado v1</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Preencha os dados e clique em calcular
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-3">
          <p className="text-xs text-warning-foreground">
            ⚠️ <strong>Premissas e Limitações:</strong> Simulação simplificada e estimativa.
            Não inclui verbas como horas extras, adicionais, comissões ou descontos legais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
