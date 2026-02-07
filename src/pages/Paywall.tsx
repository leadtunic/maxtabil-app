import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CreditCard, Check, Shield, Zap, Clock } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import ProceduralGroundBackground from "@/components/ui/animated-pattern-cloud";

const PLAN_PRICE = 997;
const PLAN_PRICE_FORMATTED = "R$ 997,00";

const FEATURES = [
  "Acesso completo ao painel",
  "Todos os módulos inclusos",
  "Atualizações futuras",
  "Suporte por e-mail",
  "Dados isolados e seguros",
  "Auditoria completa",
];

export default function Paywall() {
  const navigate = useNavigate();
  const { workspace, hasLifetimeAccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [identificationType, setIdentificationType] = useState<"CPF" | "CNPJ">("CPF");

  const handleCheckout = async () => {
    if (!workspace) {
      toast.error("Workspace não encontrado");
      return;
    }

    const normalizedCardNumber = cardNumber.replace(/\D/g, "");
    const normalizedSecurityCode = securityCode.replace(/\D/g, "");
    const normalizedIdentificationNumber = identificationNumber.replace(/\D/g, "");

    if (!cardholderName.trim()) {
      toast.error("Informe o nome do titular.");
      return;
    }
    if (normalizedCardNumber.length < 13) {
      toast.error("Número de cartão inválido.");
      return;
    }
    if (!expirationMonth.trim() || !expirationYear.trim()) {
      toast.error("Informe mês e ano de validade.");
      return;
    }
    if (normalizedSecurityCode.length < 3) {
      toast.error("Código de segurança inválido.");
      return;
    }
    if (!normalizedIdentificationNumber) {
      toast.error("Informe CPF/CNPJ do titular.");
      return;
    }

    setIsLoading(true);
    track(AnalyticsEvents.CHECKOUT_STARTED, { price: PLAN_PRICE, gateway: "mercadopago" });

    try {
      const responsePayload = await apiRequest<{ initPoint?: string }>("/api/billing/lifetime", {
        method: "POST",
        body: {
          cardholderName: cardholderName.trim(),
          cardNumber: normalizedCardNumber,
          expirationMonth: expirationMonth.trim(),
          expirationYear: expirationYear.trim(),
          securityCode: normalizedSecurityCode,
          identificationType,
          identificationNumber: normalizedIdentificationNumber,
        },
      });

      if (responsePayload?.initPoint) {
        window.location.href = responsePayload.initPoint;
        return;
      }

      navigate("/billing/completed");
    } catch (error) {
      console.error("Checkout error:", error);
      const message = error instanceof Error ? error.message : "Erro ao iniciar assinatura.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasLifetimeAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ProceduralGroundBackground />
        <AnimatedCard className="w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Acesso Liberado!</h2>
          <p className="text-white/60">Seu acesso já está ativo.</p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => (window.location.href = "/app")}>
            Ir para o Painel
          </Button>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <ProceduralGroundBackground />
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Assine o Maxtabil</h1>
          <p className="text-white/60">Cobrança recorrente no cartão de crédito via Mercado Pago.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <AnimatedCard className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">ASSINATURA RECORRENTE</span>
              </div>
              <h2 className="text-4xl font-bold text-white">{PLAN_PRICE_FORMATTED}</h2>
              <p className="text-white/60 mt-1">Valor por período de assinatura.</p>
            </div>

            <div className="space-y-4">
              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Input
                value={cardholderName}
                onChange={(event) => setCardholderName(event.target.value)}
                placeholder="Nome do titular"
                className="h-12"
              />

              <Input
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="Número do cartão"
                inputMode="numeric"
                className="h-12"
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  value={expirationMonth}
                  onChange={(event) => setExpirationMonth(event.target.value)}
                  placeholder="MM"
                  inputMode="numeric"
                  className="h-12"
                />
                <Input
                  value={expirationYear}
                  onChange={(event) => setExpirationYear(event.target.value)}
                  placeholder="AAAA"
                  inputMode="numeric"
                  className="h-12"
                />
                <Input
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value)}
                  placeholder="CVV"
                  inputMode="numeric"
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={identificationType === "CPF" ? "default" : "outline"}
                  onClick={() => setIdentificationType("CPF")}
                  className="h-12"
                >
                  CPF
                </Button>
                <Button
                  type="button"
                  variant={identificationType === "CNPJ" ? "default" : "outline"}
                  onClick={() => setIdentificationType("CNPJ")}
                  className="h-12"
                >
                  CNPJ
                </Button>
                <Input
                  value={identificationNumber}
                  onChange={(event) => setIdentificationNumber(event.target.value)}
                  placeholder={`${identificationType} do titular`}
                  inputMode="numeric"
                  className="h-12 col-span-1"
                />
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                size="lg"
                className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando assinatura...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Assinar com Cartão
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-white/40">
                Pagamento processado por Mercado Pago. Ambiente seguro.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Por que escolher nosso painel?</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Produtividade</h3>
                  <p className="text-sm text-white/60">
                    Simuladores e ferramentas que economizam horas do seu dia.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Segurança</h3>
                  <p className="text-sm text-white/60">
                    Seus dados isolados com políticas de acesso granulares.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Recorrência automática</h3>
                  <p className="text-sm text-white/60">
                    Cobrança recorrente no cartão para manter seu acesso sempre ativo.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <p className="text-sm text-white/60">
                  Precisa de ajuda? Entre em contato pelo e-mail{" "}
                  <a href="mailto:suporte@example.com" className="text-blue-400 hover:underline">
                    suporte@example.com
                  </a>
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
