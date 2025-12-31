import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, FileDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { BreakdownItem } from "@/types";
import { useActiveRuleSet } from "@/hooks/use-active-ruleset";
import { getDefaultPayload } from "@/lib/rulesets";

interface FormData {
  salarioBase: string;
  diasAbono: string;
}

interface SimulationResult {
  total: number;
  breakdown: BreakdownItem[];
  createdAt: Date;
  inputs: {
    salarioBase: number;
    diasAbono: number;
  };
}

const initialFormData: FormData = {
  salarioBase: "",
  diasAbono: "0",
};

interface FeriasPayload {
  tercoConstitucional: boolean;
  limiteDiasAbono: number;
}

export default function SimuladorFerias() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const rulesetQuery = useActiveRuleSet("FERIAS");
  const payload = (rulesetQuery.data?.payload ??
    getDefaultPayload("FERIAS")) as FeriasPayload;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  };

  const formatDateTime = (value: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(value);
  };

  const handleCurrencyInput = (field: keyof FormData, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const formatted = numericValue
      ? (parseInt(numericValue) / 100).toLocaleString("pt-BR", {
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
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `
      )
      .join("");

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório de Simulação - Férias</title>
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
        <h1>Relatório de Simulação - Férias</h1>
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
        <th>Abono</th>
        <td>${payload.inputs.diasAbono} dias</td>
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
      Relatório para fins informativos. Considere políticas internas e acordos coletivos.
    </div>
  </body>
</html>`;
  };

  const calculateFerias = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const salario = parseCurrency(formData.salarioBase);
      const diasAbono = Math.max(parseInt(formData.diasAbono, 10) || 0, 0);
      const diasAbonoLimitado = Math.min(diasAbono, payload.limiteDiasAbono);
      const valorDiario = salario / 30;
      const valorAbono = diasAbonoLimitado > 0 ? valorDiario * diasAbonoLimitado : 0;
      const tercoConstitucional = payload.tercoConstitucional ? salario / 3 : 0;

      const breakdown: BreakdownItem[] = [
        {
          label: "Férias (30 dias)",
          base: salario,
          formulaText: "Salário informado",
          amount: salario,
          sign: "+",
        },
      ];

      if (payload.tercoConstitucional) {
        breakdown.push({
          label: "1/3 Constitucional",
          base: salario,
          formulaText: `${formatCurrency(salario)} ÷ 3`,
          amount: tercoConstitucional,
          sign: "+",
        });
      }

      if (valorAbono > 0) {
        breakdown.push({
          label: "Abono pecuniário",
          base: diasAbonoLimitado,
          formulaText: `${diasAbonoLimitado} dias × (${formatCurrency(salario)} ÷ 30)`,
          amount: valorAbono,
          sign: "+",
        });
      }

      const total = salario + tercoConstitucional + valorAbono;

      setResult({
        total,
        breakdown,
        createdAt: new Date(),
        inputs: {
          salarioBase: salario,
          diasAbono: diasAbonoLimitado,
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

  const diasAbonoValue = parseInt(formData.diasAbono, 10);
  const isFormValid =
    parseCurrency(formData.salarioBase) > 0 &&
    !Number.isNaN(diasAbonoValue) &&
    diasAbonoValue >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">DP</Badge>
          {rulesetQuery.data?.isFallback && (
            <Badge variant="outline" className="text-xs">RuleSet padrão</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">Simulador de Férias</h1>
        <p className="text-muted-foreground">
          Simule o valor de férias com base no salário e no adicional de 1/3.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Dados da Simulação</CardTitle>
            <CardDescription>Informe o salário mensal do colaborador</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="abono">Dias de abono</Label>
              <Input
                id="abono"
                type="number"
                min="0"
                value={formData.diasAbono}
                onChange={(e) => setFormData((prev) => ({ ...prev, diasAbono: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Limite atual: {payload.limiteDiasAbono} dias.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 p-3 text-xs text-muted-foreground">
              O cálculo considera 30 dias de férias
              {payload.tercoConstitucional ? " + 1/3 constitucional" : ""}.
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button
                onClick={calculateFerias}
                disabled={!isFormValid || isCalculating}
                className="flex-1"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
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
                <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-success/10 blur-2xl" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Resultado</CardTitle>
                      <CardDescription>Valor estimado das férias</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Estimado</p>
                    <p className="text-3xl font-bold text-success">
                      {formatCurrency(result.total)}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Resumo</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Salário</span>
                        <span className="font-medium">
                          {formatCurrency(result.inputs.salarioBase)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Abono</span>
                        <span className="font-medium">{result.inputs.diasAbono} dias</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gerado em</span>
                        <span className="font-medium">{formatDateTime(result.createdAt)}</span>
                      </div>
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
                              <TableCell className="text-right font-mono text-sm">
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
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
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
            ⚠️ <strong>Premissas e Limitações:</strong> Simulação simplificada, sem descontos legais
            e sem adicionais específicos. Consulte o DP para valores oficiais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
