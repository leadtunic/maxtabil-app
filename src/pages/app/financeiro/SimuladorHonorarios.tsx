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
import { Calculator, FileDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { RegimeTributario, SegmentoEmpresa, BreakdownItem } from "@/types";

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

const regimePercentual: Record<RegimeTributario, number> = {
  SIMPLES: 0.012,
  LUCRO_PRESUMIDO: 0.016,
  LUCRO_REAL: 0.021,
};

const fatorSegmento: Record<SegmentoEmpresa, number> = {
  COMERCIO: 1.0,
  PRESTADOR: 1.1,
  INDUSTRIA: 1.2,
};

export default function SimuladorHonorarios() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

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

  const calculateHonorarios = () => {
    setIsCalculating(true);

    // Simulate API call delay
    setTimeout(() => {
      const faturamento = parseCurrency(formData.faturamento);
      const funcionarios = parseInt(formData.numFuncionarios) || 0;
      const percRegime = regimePercentual[formData.regime];

      // Mock ruleset values
      const baseMin = 450;
      const adicFuncionario = 40;
      const descontoSistemaFinanceiro = 0.05;
      const descontoPontoEletronico = 0.05;

      const valorBase = Math.max(baseMin, faturamento * percRegime);
      const ajusteSegmento = valorBase * (fatorSegmento[formData.segmento] - 1);
      const valorFuncionarios = funcionarios * adicFuncionario;
      const subtotal = valorBase + ajusteSegmento + valorFuncionarios;
      const valorSistemaFinanceiro = formData.sistemaFinanceiro
        ? subtotal * descontoSistemaFinanceiro
        : 0;
      const valorPontoEletronico = formData.pontoEletronico ? subtotal * descontoPontoEletronico : 0;
      const total = subtotal - valorSistemaFinanceiro - valorPontoEletronico;
      const totalAnual = total * 12;
      const createdAt = new Date();
      const simulationId = `sim-${createdAt.getTime().toString(36)}`;

      const breakdown: BreakdownItem[] = [
        {
          label: "Valor Base",
          base: faturamento,
          formulaText: `MAX(${formatCurrency(baseMin)}, ${(percRegime * 100).toFixed(1)}% × Faturamento)`,
          amount: valorBase,
          sign: "+",
        },
        {
          label: `Ajuste ${segmentoLabels[formData.segmento]}`,
          base: valorBase,
          formulaText: `Valor Base × ${(fatorSegmento[formData.segmento] - 1) * 100}%`,
          amount: ajusteSegmento,
          sign: "+",
        },
        {
          label: "Adicional Funcionários",
          base: funcionarios,
          formulaText: `${funcionarios} × ${formatCurrency(adicFuncionario)}`,
          amount: valorFuncionarios,
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
    toast.info("Gerando PDF...", { description: "O download iniciará em breve." });
    // Mock PDF generation
    setTimeout(() => {
      toast.success("PDF gerado!", { description: "simulacao-honorarios.pdf" });
    }, 1500);
  };

  const isFormValid =
    parseCurrency(formData.faturamento) > 0 &&
    formData.numFuncionarios.trim() !== "" &&
    parseInt(formData.numFuncionarios) >= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Financeiro</Badge>
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
