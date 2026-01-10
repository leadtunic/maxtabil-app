import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Calculator, FileDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { RegimeTributario, SegmentoEmpresa, BreakdownItem } from "@/types";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useActiveRuleSet } from "@/hooks/use-active-ruleset";
import { getDefaultPayload } from "@/lib/rulesets";

interface FormData {
  faturamento: string;
  regime: RegimeTributario;
  segmento: SegmentoEmpresa;
  numFuncionarios: string;
  sistemaFinanceiro: boolean;
  pontoEletronico: boolean;
}

interface SimulationResult {
  total: number;
  totalAnual: number;
  breakdown: BreakdownItem[];
  simulationId: string;
  createdAt: Date;
  inputs: {
    faturamento: number;
    regime: RegimeTributario;
    segmento: SegmentoEmpresa;
    numFuncionarios: number;
    sistemaFinanceiro: boolean;
    pontoEletronico: boolean;
  };
}

type HonorarioInputs = SimulationResult["inputs"];

const initialFormData: FormData = {
  faturamento: "",
  regime: "SIMPLES",
  segmento: "COMERCIO",
  numFuncionarios: "",
  sistemaFinanceiro: false,
  pontoEletronico: false,
};

const regimeLabels: Record<RegimeTributario, string> = {
  SIMPLES: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
};

const segmentoLabels: Record<SegmentoEmpresa, string> = {
  COMERCIO: "Comércio",
  PRESTADOR: "Prestador de Serviços",
  INDUSTRIA: "Indústria",
};

interface HonorariosPayload {
  baseMin: number;
  regimePercentual: Record<RegimeTributario, number>;
  fatorSegmento: Record<SegmentoEmpresa, number>;
  adicFuncionario: number;
  descontoSistemaFinanceiro: number;
  descontoPontoEletronico: number;
}

const projectionScenarios = [
  { key: "conservador", label: "Conservador", annualGrowth: 0, color: "hsl(var(--warning))" },
  { key: "base", label: "Base", annualGrowth: 0.2, color: "hsl(var(--primary))" },
  { key: "agressivo", label: "Agressivo", annualGrowth: 0.4, color: "hsl(var(--success))" },
] as const;

const percentBands = [
  { label: "Abaixo de 2%", max: 2 },
  { label: "2% a 3%", max: 3 },
  { label: "Acima de 3%", max: Infinity },
];

const baseHoursBySegment: Record<SegmentoEmpresa, number> = {
  COMERCIO: 6,
  PRESTADOR: 7.5,
  INDUSTRIA: 9,
};

const regimeMultipliers: Record<RegimeTributario, number> = {
  SIMPLES: 1,
  LUCRO_PRESUMIDO: 1.15,
  LUCRO_REAL: 1.3,
};

const calculateHonorario = (inputs: HonorarioInputs, payload: HonorariosPayload) => {
  const percRegime = payload.regimePercentual[inputs.regime];
  const valorBase = Math.max(payload.baseMin, inputs.faturamento * percRegime);
  const ajusteSegmento = valorBase * (payload.fatorSegmento[inputs.segmento] - 1);
  const valorFuncionarios = inputs.numFuncionarios * payload.adicFuncionario;
  const subtotal = valorBase + ajusteSegmento + valorFuncionarios;
  const descontoSistema = inputs.sistemaFinanceiro ? subtotal * payload.descontoSistemaFinanceiro : 0;
  const descontoPonto = inputs.pontoEletronico ? subtotal * payload.descontoPontoEletronico : 0;
  const total = subtotal - descontoSistema - descontoPonto;

  return {
    percRegime,
    valorBase,
    ajusteSegmento,
    valorFuncionarios,
    subtotal,
    descontoSistema,
    descontoPonto,
    total,
  };
};

export default function SimuladorHonorarios() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const rulesetQuery = useActiveRuleSet("HONORARIOS");
  const honorariosPayload = (rulesetQuery.data?.payload ??
    getDefaultPayload("HONORARIOS")) as HonorariosPayload;
  const {
    baseMin,
    regimePercentual,
    fatorSegmento,
    adicFuncionario,
    descontoSistemaFinanceiro,
    descontoPontoEletronico,
  } = honorariosPayload;

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

  const formatYesNo = (value: boolean): string => (value ? "Sim" : "Não");

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
    <title>Relatório de Simulação - Honorários</title>
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
        <div class="eyebrow">Financeiro</div>
        <h1>Relatório de Simulação - Honorários</h1>
        <div class="meta">Gerado em ${formatDateTime(payload.createdAt)}</div>
        <div class="meta">${payload.simulationId}</div>
      </div>
      <div class="tag">Simulação Financeira</div>
    </div>

    <h2>Dados informados</h2>
    <table class="simple">
      <tr>
        <th>Faturamento mensal</th>
        <td>${formatCurrency(payload.inputs.faturamento)}</td>
      </tr>
      <tr>
        <th>Regime tributário</th>
        <td>${regimeLabels[payload.inputs.regime]}</td>
      </tr>
      <tr>
        <th>Segmento</th>
        <td>${segmentoLabels[payload.inputs.segmento]}</td>
      </tr>
      <tr>
        <th>Nº funcionários</th>
        <td>${payload.inputs.numFuncionarios}</td>
      </tr>
      <tr>
        <th>Sistema financeiro</th>
        <td>${formatYesNo(payload.inputs.sistemaFinanceiro)}</td>
      </tr>
      <tr>
        <th>Ponto eletrônico</th>
        <td>${formatYesNo(payload.inputs.pontoEletronico)}</td>
      </tr>
    </table>

    <h2>Resumo</h2>
    <table class="simple">
      <tr>
        <th>Honorário mensal</th>
        <td>${formatCurrency(payload.total)}</td>
      </tr>
      <tr>
        <th>Estimativa anual</th>
        <td>${formatCurrency(payload.totalAnual)}</td>
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
      <span>Total mensal estimado</span>
      <span>${formatCurrency(payload.total)}</span>
    </div>

    <div class="footer">
      Relatório para fins informativos. Os valores podem variar conforme regras internas e políticas comerciais.
    </div>
  </body>
</html>`;
  };

  const calculateHonorarios = () => {
    setIsCalculating(true);

    // Simulate API call delay
    setTimeout(() => {
      const faturamento = parseCurrency(formData.faturamento);
      const funcionarios = parseInt(formData.numFuncionarios) || 0;
      const calcInputs: HonorarioInputs = {
        faturamento,
        regime: formData.regime,
        segmento: formData.segmento,
        numFuncionarios: funcionarios,
        sistemaFinanceiro: formData.sistemaFinanceiro,
        pontoEletronico: formData.pontoEletronico,
      };
      const detalhes = calculateHonorario(calcInputs, honorariosPayload);
      const total = detalhes.total;
      const totalAnual = total * 12;
      const createdAt = new Date();
      const simulationId = `sim-${createdAt.getTime().toString(36)}`;
      const valorSistemaFinanceiro = detalhes.descontoSistema;
      const valorPontoEletronico = detalhes.descontoPonto;
      const subtotal = detalhes.subtotal;

      const breakdown: BreakdownItem[] = [
        {
          label: "Valor Base",
          base: faturamento,
          formulaText: `MAX(${formatCurrency(baseMin)}, ${(detalhes.percRegime * 100).toFixed(1)}% × Faturamento)`,
          amount: detalhes.valorBase,
          sign: "+",
        },
        {
          label: `Ajuste ${segmentoLabels[formData.segmento]}`,
          base: detalhes.valorBase,
          formulaText: `Valor Base × ${(fatorSegmento[formData.segmento] - 1) * 100}%`,
          amount: detalhes.ajusteSegmento,
          sign: "+",
        },
        {
          label: "Adicional Funcionários",
          base: funcionarios,
          formulaText: `${funcionarios} × ${formatCurrency(adicFuncionario)}`,
          amount: detalhes.valorFuncionarios,
          sign: "+",
        },
      ];

      if (formData.sistemaFinanceiro) {
        breakdown.push({
          label: "Desconto Sistema Financeiro",
          base: subtotal,
          formulaText: `5% × ${formatCurrency(subtotal)}`,
          amount: valorSistemaFinanceiro,
          sign: "-",
        });
      }

      if (formData.pontoEletronico) {
        breakdown.push({
          label: "Desconto Ponto Eletrônico",
          base: subtotal,
          formulaText: `5% × ${formatCurrency(subtotal)}`,
          amount: valorPontoEletronico,
          sign: "-",
        });
      }

      setResult({
        total,
        totalAnual,
        breakdown,
        createdAt,
        simulationId,
        inputs: {
          faturamento,
          regime: formData.regime,
          segmento: formData.segmento,
          numFuncionarios: funcionarios,
          sistemaFinanceiro: formData.sistemaFinanceiro,
          pontoEletronico: formData.pontoEletronico,
        },
      });
      setIsCalculating(false);
      toast.success("Simulação calculada com sucesso!");
    }, 800);
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

  const isFormValid =
    parseCurrency(formData.faturamento) > 0 &&
    formData.numFuncionarios.trim() !== "" &&
    parseInt(formData.numFuncionarios) >= 0;

  const honorarioDetails = result ? calculateHonorario(result.inputs, honorariosPayload) : null;

  const projectionData = result
    ? Array.from({ length: 12 }, (_, index) => {
        const month = `M${index + 1}`;
        const entry: Record<string, number | string> = { month };
        let faturamentoBase = result.inputs.faturamento;
        let honorarioBase = result.total;

        projectionScenarios.forEach((scenario) => {
          const monthlyRate = Math.pow(1 + scenario.annualGrowth, 1 / 12) - 1;
          const faturamento = result.inputs.faturamento * Math.pow(1 + monthlyRate, index);
          const total = calculateHonorario({ ...result.inputs, faturamento }, honorariosPayload).total;
          entry[scenario.key] = total;

          if (scenario.key === "base") {
            faturamentoBase = faturamento;
            honorarioBase = total;
          }
        });

        entry.faturamentoBase = faturamentoBase;
        entry.percentBase = (honorarioBase / Math.max(faturamentoBase, 1)) * 100;
        return entry;
      })
    : [];

  const projectionTotals = projectionScenarios.map((scenario) => ({
    key: scenario.key,
    label: scenario.label,
    total: projectionData.reduce((sum, item) => sum + Number(item[scenario.key] ?? 0), 0),
  }));

  const percentNow = result
    ? (result.total / Math.max(result.inputs.faturamento, 1)) * 100
    : 0;
  const percentBand = percentBands.find((band) => percentNow <= band.max)?.label ?? "Acima de 3%";

  const faturamentoVirada = result
    ? baseMin / regimePercentual[result.inputs.regime]
    : 0;
  const gapVirada = result ? faturamentoVirada - result.inputs.faturamento : 0;
  const progressoVirada = result && faturamentoVirada > 0
    ? Math.min(100, (result.inputs.faturamento / faturamentoVirada) * 100)
    : 0;

  const sensitivityRevenues = [25000, 30000, 35000, 40000, 50000];
  const sensitivityEmployees = [1, 3, 5, 10];
  const sensitivityValues = result
    ? sensitivityRevenues.map((revenue) =>
        sensitivityEmployees.map((employees) =>
          calculateHonorario(
            { ...result.inputs, faturamento: revenue, numFuncionarios: employees },
            honorariosPayload,
          ).total
        )
      )
    : [];
  const flatSensitivity = sensitivityValues.flat();
  const minSensitivity = flatSensitivity.length ? Math.min(...flatSensitivity) : 0;
  const maxSensitivity = flatSensitivity.length ? Math.max(...flatSensitivity) : 0;

  const baseScenarioChart = projectionData.map((entry) => ({
    month: entry.month as string,
    percent: Number(entry.percentBase ?? 0),
    base: Number(entry.base ?? 0),
  }));

  const structureIndex = result
    ? Number(result.inputs.sistemaFinanceiro) + Number(result.inputs.pontoEletronico)
    : 0;
  const structureLabel =
    structureIndex === 0
      ? "Estrutura básica"
      : structureIndex === 1
        ? "Estrutura intermediária"
        : "Estrutura robusta";

  const estimatedHours = result
    ? baseHoursBySegment[result.inputs.segmento] * regimeMultipliers[result.inputs.regime] +
      result.inputs.numFuncionarios * 0.35
    : 0;
  const averageMrr =
    projectionData.length > 0
      ? projectionData.reduce((sum, item) => sum + Number(item.base ?? 0), 0) / projectionData.length
      : 0;
  const month12Mrr = projectionData.length > 0 ? Number(projectionData[11].base ?? 0) : 0;
  const clientesPorAnalista = estimatedHours > 0 ? Math.max(1, Math.floor(160 / estimatedHours)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Financeiro</Badge>
          {rulesetQuery.data?.isFallback && (
            <Badge variant="outline" className="text-xs">
              RuleSet padrão
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">Simulador de Honorários</h1>
        <p className="text-muted-foreground">
          Calcule os honorários com base em faturamento, regime, segmento e estrutura da empresa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
            <CardDescription>Informe os dados para calcular o honorário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faturamento">Faturamento Mensal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id="faturamento"
                  value={formData.faturamento}
                  onChange={(e) => handleCurrencyInput("faturamento", e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime">Regime Tributário</Label>
              <Select
                value={formData.regime}
                onValueChange={(value: RegimeTributario) =>
                  setFormData((prev) => ({ ...prev, regime: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                  <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                  <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento">Segmento</Label>
              <Select
                value={formData.segmento}
                onValueChange={(value: SegmentoEmpresa) =>
                  setFormData((prev) => ({ ...prev, segmento: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMERCIO">Comércio</SelectItem>
                  <SelectItem value="PRESTADOR">Prestador de Serviços</SelectItem>
                  <SelectItem value="INDUSTRIA">Indústria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcionarios">Nº Funcionários</Label>
              <Input
                id="funcionarios"
                type="number"
                min="0"
                value={formData.numFuncionarios}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, numFuncionarios: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sistema">Sistema Financeiro</Label>
                <Switch
                  id="sistema"
                  checked={formData.sistemaFinanceiro}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, sistemaFinanceiro: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ponto">Ponto Eletrônico</Label>
                <Switch
                  id="ponto"
                  checked={formData.pontoEletronico}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, pontoEletronico: checked }))
                  }
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              <Button
                onClick={calculateHonorarios}
                disabled={!isFormValid || isCalculating}
                className="flex-1"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? "Calculando..." : "Calcular"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Resultado</CardTitle>
                      <CardDescription>Valor estimado do honorário</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Honorário Mensal</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(result.total)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Resumo da Empresa
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{regimeLabels[result.inputs.regime]}</Badge>
                        <Badge variant="secondary">{segmentoLabels[result.inputs.segmento]}</Badge>
                        {result.inputs.sistemaFinanceiro && (
                          <Badge variant="outline">Sistema Financeiro</Badge>
                        )}
                        {result.inputs.pontoEletronico && (
                          <Badge variant="outline">Ponto Eletrônico</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Faturamento</span>
                          <span className="font-medium">
                            {formatCurrency(result.inputs.faturamento)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Funcionários</span>
                          <span className="font-medium">{result.inputs.numFuncionarios}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Estimativa Anual
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {formatCurrency(result.totalAnual)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        12x o honorário mensal estimado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.simulationId} • {formatDateTime(result.createdAt)}
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
                              <TableCell className="text-right font-mono text-sm">
                                {item.sign === "+" ? "" : "-"}
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    RuleSet v1 • Valores estimados para simulação
                  </p>
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
                  <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Preencha os dados e clique em calcular
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {result && honorarioDetails && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">BI do simulador de honorários</h2>
            <p className="text-sm text-muted-foreground">
              Seis painéis para previsibilidade, reajustes e capacidade.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>BI 1 • Projeção do Honorário (12 meses)</CardTitle>
                    <CardDescription>
                      Cenários de crescimento do faturamento mantendo a equipe atual.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {projectionTotals.map((item) => (
                      <Badge key={item.key} variant="outline" className="border-border/60">
                        {item.label}: {formatCurrency(item.total)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-[260px] w-full aspect-auto"
                  config={projectionScenarios.reduce<Record<string, { label: string; color: string }>>(
                    (acc, scenario) => {
                      acc[scenario.key] = { label: scenario.label, color: scenario.color };
                      return acc;
                    },
                    {},
                  )}
                >
                  <LineChart data={projectionData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                    {projectionScenarios.map((scenario) => (
                      <Line
                        key={scenario.key}
                        type="monotone"
                        dataKey={scenario.key}
                        stroke={scenario.color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>BI 2 • Gatilhos de Reajuste</CardTitle>
                <CardDescription>Quando o mínimo deixa de aplicar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Faturamento de virada</span>
                  <span className="font-medium">{formatCurrency(faturamentoVirada)}</span>
                </div>
                <Progress value={progressoVirada} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {gapVirada > 0
                      ? `Faltam ${formatCurrency(gapVirada)} para sair do mínimo.`
                      : `Acima do gatilho em ${formatCurrency(Math.abs(gapVirada))}.`}
                  </span>
                  <span>{progressoVirada.toFixed(0)}%</span>
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                  Cada funcionário adicional aumenta {formatCurrency(adicFuncionario)} por mês.
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>BI 3 • Sensibilidade (Faturamento × Funcionários)</CardTitle>
                <CardDescription>Impacto direto na variação do honorário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Faturamento</TableHead>
                        {sensitivityEmployees.map((employees) => (
                          <TableHead key={employees} className="text-right">
                            {employees} func.
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sensitivityRevenues.map((revenue, rowIndex) => (
                        <TableRow key={revenue}>
                          <TableCell className="font-medium">
                            {formatCurrency(revenue)}
                          </TableCell>
                          {sensitivityEmployees.map((employees, colIndex) => {
                            const value = sensitivityValues[rowIndex]?.[colIndex] ?? 0;
                            const ratio =
                              maxSensitivity === minSensitivity
                                ? 0.2
                                : (value - minSensitivity) / (maxSensitivity - minSensitivity);
                            const backgroundOpacity = 0.08 + ratio * 0.2;
                            return (
                              <TableCell
                                key={`${revenue}-${employees}`}
                                className="text-right font-medium"
                                style={{
                                  backgroundColor: `hsl(var(--primary) / ${backgroundOpacity})`,
                                }}
                              >
                                {formatCurrency(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Considera regime, segmento e ferramentas atuais.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>BI 4 • Honorário como % do Faturamento</CardTitle>
                <CardDescription>Tendência no cenário base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Percentual atual</p>
                    <p className="text-lg font-semibold">{percentNow.toFixed(2)}%</p>
                  </div>
                  <Badge variant="outline" className="border-border/60">
                    {percentBand}
                  </Badge>
                </div>
                <ChartContainer
                  className="h-[220px] w-full aspect-auto"
                  config={{
                    percent: { label: "Percentual", color: "hsl(var(--info))" },
                  }}
                >
                  <LineChart data={baseScenarioChart} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(2)}%`}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="percent"
                      stroke="hsl(var(--info))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-border/60">Abaixo de 2%</Badge>
                  <Badge variant="outline" className="border-border/60">2% a 3%</Badge>
                  <Badge variant="outline" className="border-border/60">Acima de 3%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>BI 5 • Impacto das Ferramentas</CardTitle>
                <CardDescription>Estrutura operacional e desconto estimado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border/60">
                    Índice {structureIndex}/2
                  </Badge>
                  <span className="text-muted-foreground">{structureLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["Sem ferramentas", "1 ferramenta", "2 ferramentas"].map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-md border p-2 text-center ${
                        index <= structureIndex ? "border-primary/40 bg-primary/10" : "border-border/60 bg-muted/30"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                  Descontos ativos: {formatCurrency(honorarioDetails.descontoSistema + honorarioDetails.descontoPonto)}.
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>BI 6 • Previsão de Capacidade</CardTitle>
                  <Badge variant="outline" className="border-border/60">Interno</Badge>
                </div>
                <CardDescription>MRR previsto e esforço estimado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">MRR médio (12m)</p>
                    <p className="text-lg font-semibold">{formatCurrency(averageMrr)}</p>
                    <p className="text-xs text-muted-foreground">
                      Mês 12: {formatCurrency(month12Mrr)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Horas estimadas / mês</p>
                    <p className="text-lg font-semibold">{estimatedHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">
                      Capacidade ~{clientesPorAnalista} cliente(s) similares/analista.
                    </p>
                  </div>
                </div>
                <ChartContainer
                  className="h-[200px] w-full aspect-auto"
                  config={{
                    base: { label: "MRR Base", color: "hsl(var(--primary))" },
                  }}
                >
                  <BarChart data={projectionData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Bar dataKey="base" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-3">
          <p className="text-xs text-warning-foreground">
            ⚠️ <strong>Premissas e Limitações:</strong> Os valores apresentados são estimados com base
            no RuleSet vigente e não substituem o cálculo oficial. Consulte o departamento financeiro
            para proposta formal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
