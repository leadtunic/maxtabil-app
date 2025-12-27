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
import { FileText, FileDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { TipoRescisao, BreakdownItem } from "@/types";

interface FormData {
  salarioBase: string;
  dataAdmissao: string;
  dataDemissao: string;
  tipoRescisao: TipoRescisao;
  saldoFerias: string;
  decimoTerceiroProporcional: boolean;
  avisoPrevioTrabalhado: boolean;
  fgtsDepositado: string;
}

const initialFormData: FormData = {
  salarioBase: "",
  dataAdmissao: "",
  dataDemissao: "",
  tipoRescisao: "SEM_JUSTA_CAUSA",
  saldoFerias: "0",
  decimoTerceiroProporcional: true,
  avisoPrevioTrabalhado: false,
  fgtsDepositado: "",
};

const tipoRescisaoLabels: Record<TipoRescisao, string> = {
  SEM_JUSTA_CAUSA: "Sem Justa Causa",
  COM_JUSTA_CAUSA: "Com Justa Causa",
  PEDIDO_DEMISSAO: "Pedido de Demissão",
  ACORDO_MUTUO: "Acordo Mútuo",
};

export default function SimuladorRescisao() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<{ total: number; breakdown: BreakdownItem[] } | null>(null);
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

  const calculateRescisao = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const salario = parseCurrency(formData.salarioBase);
      const admissao = new Date(formData.dataAdmissao);
      const demissao = new Date(formData.dataDemissao);
      const mesesTrabalhados = Math.floor(
        (demissao.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const anosTrabalhados = Math.floor(mesesTrabalhados / 12);
      const fgts = parseCurrency(formData.fgtsDepositado);
      const diasFerias = parseInt(formData.saldoFerias) || 0;

      const breakdown: BreakdownItem[] = [];
      let total = 0;

      // Saldo de Salário (proporcional ao mês)
      const diasNoMes = demissao.getDate();
      const saldoSalario = (salario / 30) * diasNoMes;
      breakdown.push({
        label: "Saldo de Salário",
        base: diasNoMes,
        formulaText: `${diasNoMes} dias × (${formatCurrency(salario)} ÷ 30)`,
        amount: saldoSalario,
        sign: "+",
      });
      total += saldoSalario;

      // 13º Proporcional
      if (formData.decimoTerceiroProporcional && formData.tipoRescisao !== "COM_JUSTA_CAUSA") {
        const mesesAno = demissao.getMonth() + 1;
        const decimoTerceiro = (salario / 12) * mesesAno;
        breakdown.push({
          label: "13º Proporcional",
          base: mesesAno,
          formulaText: `${mesesAno} meses × (${formatCurrency(salario)} ÷ 12)`,
          amount: decimoTerceiro,
          sign: "+",
        });
        total += decimoTerceiro;
      }

      // Férias + 1/3
      if (diasFerias > 0) {
        const valorFerias = (salario / 30) * diasFerias;
        const tercoFerias = valorFerias / 3;
        breakdown.push({
          label: "Férias Vencidas",
          base: diasFerias,
          formulaText: `${diasFerias} dias × (${formatCurrency(salario)} ÷ 30)`,
          amount: valorFerias,
          sign: "+",
        });
        breakdown.push({
          label: "1/3 Constitucional",
          base: valorFerias,
          formulaText: `${formatCurrency(valorFerias)} ÷ 3`,
          amount: tercoFerias,
          sign: "+",
        });
        total += valorFerias + tercoFerias;
      }

      // Aviso Prévio
      if (!formData.avisoPrevioTrabalhado && formData.tipoRescisao === "SEM_JUSTA_CAUSA") {
        const diasAviso = 30 + anosTrabalhados * 3;
        const avisoIndenizado = (salario / 30) * Math.min(diasAviso, 90);
        breakdown.push({
          label: "Aviso Prévio Indenizado",
          base: Math.min(diasAviso, 90),
          formulaText: `${Math.min(diasAviso, 90)} dias × (${formatCurrency(salario)} ÷ 30)`,
          amount: avisoIndenizado,
          sign: "+",
        });
        total += avisoIndenizado;
      }

      // Multa FGTS
      if (formData.tipoRescisao === "SEM_JUSTA_CAUSA") {
        const multaFgts = fgts * 0.4;
        breakdown.push({
          label: "Multa 40% FGTS",
          base: fgts,
          formulaText: `40% × ${formatCurrency(fgts)}`,
          amount: multaFgts,
          sign: "+",
        });
        total += multaFgts;
      } else if (formData.tipoRescisao === "ACORDO_MUTUO") {
        const multaFgts = fgts * 0.2;
        breakdown.push({
          label: "Multa 20% FGTS (Acordo)",
          base: fgts,
          formulaText: `20% × ${formatCurrency(fgts)}`,
          amount: multaFgts,
          sign: "+",
        });
        total += multaFgts;
      }

      setResult({ total, breakdown });
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
    setTimeout(() => {
      toast.success("PDF gerado!", { description: "simulacao-rescisao.pdf" });
    }, 1500);
  };

  const isFormValid =
    parseCurrency(formData.salarioBase) > 0 &&
    formData.dataAdmissao &&
    formData.dataDemissao &&
    new Date(formData.dataDemissao) > new Date(formData.dataAdmissao);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">DP</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Simulador de Rescisão</h1>
        <p className="text-muted-foreground">
          Calcule as verbas rescisórias para diferentes tipos de desligamento.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Colaborador</CardTitle>
            <CardDescription>Informe os dados para o cálculo rescisório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salario">Salário Base</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admissao">Data Admissão</Label>
                <Input
                  id="admissao"
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dataAdmissao: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demissao">Data Demissão</Label>
                <Input
                  id="demissao"
                  type="date"
                  value={formData.dataDemissao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dataDemissao: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Rescisão</Label>
              <Select
                value={formData.tipoRescisao}
                onValueChange={(value: TipoRescisao) =>
                  setFormData((prev) => ({ ...prev, tipoRescisao: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoRescisaoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ferias">Dias Férias Vencidas</Label>
                <Input
                  id="ferias"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.saldoFerias}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, saldoFerias: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fgts">FGTS Depositado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="fgts"
                    value={formData.fgtsDepositado}
                    onChange={(e) => handleCurrencyInput("fgtsDepositado", e.target.value)}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="decimo">13º Proporcional</Label>
                <Switch
                  id="decimo"
                  checked={formData.decimoTerceiroProporcional}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, decimoTerceiroProporcional: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="aviso">Aviso Prévio Trabalhado</Label>
                <Switch
                  id="aviso"
                  checked={formData.avisoPrevioTrabalhado}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, avisoPrevioTrabalhado: checked }))
                  }
                />
              </div>
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
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Resultado</CardTitle>
                      <CardDescription>Verbas rescisórias estimadas</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                    <p className="text-sm text-muted-foreground mb-1">Total a Receber</p>
                    <p className="text-3xl font-bold text-info">
                      {formatCurrency(result.total)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Detalhamento</p>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Verba</TableHead>
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

                  <p className="text-xs text-muted-foreground">
                    RuleSet v2 • {tipoRescisaoLabels[formData.tipoRescisao]}
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
            ⚠️ <strong>Premissas e Limitações:</strong> Os valores apresentados são estimados.
            Verbas adicionais como horas extras, comissões e benefícios não estão incluídas.
            Consulte o DP para cálculo oficial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
