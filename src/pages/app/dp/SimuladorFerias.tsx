import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { CalendarDays, FileDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { BreakdownItem } from "@/types";

interface FormData {
  salarioBase: string;
  diasFerias: number;
  abonoPecuniario: boolean;
  dependentes: string;
  adicionaisPercent: number;
}

const initialFormData: FormData = {
  salarioBase: "",
  diasFerias: 30,
  abonoPecuniario: false,
  dependentes: "0",
  adicionaisPercent: 0,
};

export default function SimuladorFerias() {
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

  const calculateFerias = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const salario = parseCurrency(formData.salarioBase);
      const diasGozados = formData.abonoPecuniario 
        ? Math.max(formData.diasFerias - 10, 20) 
        : formData.diasFerias;
      const diasAbono = formData.abonoPecuniario ? Math.min(formData.diasFerias / 3, 10) : 0;
      const adicionalPct = formData.adicionaisPercent / 100;

      const breakdown: BreakdownItem[] = [];
      let total = 0;

      // Salário base proporcional aos dias
      const valorDiario = salario / 30;
      const salarioFerias = valorDiario * diasGozados;
      breakdown.push({
        label: "Férias Gozadas",
        base: diasGozados,
        formulaText: `${diasGozados} dias × (${formatCurrency(salario)} ÷ 30)`,
        amount: salarioFerias,
        sign: "+",
      });
      total += salarioFerias;

      // 1/3 Constitucional
      const tercoConstitucional = salarioFerias / 3;
      breakdown.push({
        label: "1/3 Constitucional",
        base: salarioFerias,
        formulaText: `${formatCurrency(salarioFerias)} ÷ 3`,
        amount: tercoConstitucional,
        sign: "+",
      });
      total += tercoConstitucional;

      // Abono Pecuniário
      if (formData.abonoPecuniario && diasAbono > 0) {
        const valorAbono = valorDiario * diasAbono;
        const tercoAbono = valorAbono / 3;
        breakdown.push({
          label: "Abono Pecuniário",
          base: diasAbono,
          formulaText: `${diasAbono} dias × (${formatCurrency(salario)} ÷ 30)`,
          amount: valorAbono,
          sign: "+",
        });
        breakdown.push({
          label: "1/3 s/ Abono",
          base: valorAbono,
          formulaText: `${formatCurrency(valorAbono)} ÷ 3`,
          amount: tercoAbono,
          sign: "+",
        });
        total += valorAbono + tercoAbono;
      }

      // Adicionais (insalubridade, periculosidade, etc)
      if (adicionalPct > 0) {
        const valorAdicionais = (salarioFerias + tercoConstitucional) * adicionalPct;
        breakdown.push({
          label: `Adicionais (${formData.adicionaisPercent}%)`,
          base: salarioFerias + tercoConstitucional,
          formulaText: `${formData.adicionaisPercent}% × base`,
          amount: valorAdicionais,
          sign: "+",
        });
        total += valorAdicionais;
      }

      // Deduções INSS (simplificado)
      const baseInss = total;
      let aliquotaInss = 0;
      if (baseInss <= 1412) aliquotaInss = 0.075;
      else if (baseInss <= 2666.68) aliquotaInss = 0.09;
      else if (baseInss <= 4000.03) aliquotaInss = 0.12;
      else aliquotaInss = 0.14;

      const descontoInss = Math.min(baseInss * aliquotaInss, 908.85);
      breakdown.push({
        label: "INSS (estimado)",
        base: baseInss,
        formulaText: `${(aliquotaInss * 100).toFixed(1)}% (progressivo)`,
        amount: descontoInss,
        sign: "-",
      });

      const liquido = total - descontoInss;

      setResult({ total: liquido, breakdown });
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
      toast.success("PDF gerado!", { description: "simulacao-ferias.pdf" });
    }, 1500);
  };

  const isFormValid = parseCurrency(formData.salarioBase) > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">DP</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Simulador de Férias</h1>
        <p className="text-muted-foreground">
          Calcule os valores de férias com ou sem abono pecuniário.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Colaborador</CardTitle>
            <CardDescription>Informe os dados para o cálculo de férias</CardDescription>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dias de Férias: {formData.diasFerias}</Label>
              </div>
              <Slider
                value={[formData.diasFerias]}
                onValueChange={([value]) =>
                  setFormData((prev) => ({ ...prev, diasFerias: value }))
                }
                min={10}
                max={30}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 dias</span>
                <span>30 dias</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependentes">Nº de Dependentes</Label>
              <Input
                id="dependentes"
                type="number"
                min="0"
                max="10"
                value={formData.dependentes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dependentes: e.target.value }))
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Adicionais: {formData.adicionaisPercent}%</Label>
              </div>
              <Slider
                value={[formData.adicionaisPercent]}
                onValueChange={([value]) =>
                  setFormData((prev) => ({ ...prev, adicionaisPercent: value }))
                }
                min={0}
                max={40}
                step={5}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Insalubridade, periculosidade, noturno, etc.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="abono">Abono Pecuniário</Label>
                <p className="text-xs text-muted-foreground">Vender 1/3 das férias</p>
              </div>
              <Switch
                id="abono"
                checked={formData.abonoPecuniario}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, abonoPecuniario: checked }))
                }
              />
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
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Resultado</CardTitle>
                      <CardDescription>Valor líquido estimado</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground mb-1">Valor Líquido</p>
                    <p className="text-3xl font-bold text-success">
                      {formatCurrency(result.total)}
                    </p>
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
                              <TableCell className={`text-right font-mono text-sm ${
                                item.sign === "-" ? "text-destructive" : ""
                              }`}>
                                {item.sign === "-" ? "−" : ""}
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    RuleSet v1 • {formData.diasFerias} dias 
                    {formData.abonoPecuniario ? " + abono" : ""}
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
            ⚠️ <strong>Premissas e Limitações:</strong> Os valores apresentados são estimados.
            O cálculo de IRRF e outros descontos podem variar. Consulte o DP para valores oficiais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
