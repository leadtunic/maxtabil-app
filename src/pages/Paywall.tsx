import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CreditCard, Check, Shield, Zap, Clock } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import ProceduralGroundBackground from "@/components/ui/animated-pattern-cloud";

const LIFETIME_PRICE = 997;
const LIFETIME_PRICE_FORMATTED = "R$ 997,00";

const FEATURES = [
  "Acesso vitalício ao painel",
  "Todos os módulos inclusos",
  "Atualizações futuras",
  "Suporte por e-mail",
  "Dados isolados e seguros",
  "Auditoria completa",
];

export default function Paywall() {
  const { workspace, hasLifetimeAccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cellphone, setCellphone] = useState("");
  const [taxId, setTaxId] = useState("");

  const handleCheckout = async () => {
    if (!workspace) {
      toast.error("Workspace não encontrado");
      return;
    }

    const normalizedPhone = cellphone.replace(/\D/g, "");
    if (!normalizedPhone) {
      toast.error("Informe um telefone para continuar");
      return;
    }
    const normalizedTaxId = taxId.replace(/\D/g, "");
    if (!normalizedTaxId) {
      toast.error("Informe um CPF/CNPJ para continuar");
      return;
    }

    setIsLoading(true);
    track(AnalyticsEvents.CHECKOUT_STARTED, { price: LIFETIME_PRICE });

    try {
      const responsePayload = await apiRequest<{ paymentUrl?: string }>(
        "/api/billing/lifetime",
        {
          method: "POST",
          body: { cellphone: normalizedPhone, taxId: normalizedTaxId },
        }
      );
      const paymentUrl = responsePayload?.paymentUrl;

      if (!paymentUrl) {
        throw new Error("URL de pagamento não recebida");
      }

      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      const message = error instanceof Error ? error.message : "Erro ao iniciar pagamento.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasLifetimeAccess) {
    // Already paid - redirect handled by AppShell
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ProceduralGroundBackground />
        <AnimatedCard className="w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Acesso Liberado!</h2>
          <p className="text-white/60">Você já possui acesso vitalício.</p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = "/app"}>
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
          <h1 className="text-3xl font-bold text-white mb-2">Libere seu Acesso</h1>
          <p className="text-white/60">
            Pagamento único via PIX. Acesso vitalício garantido.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pricing Card */}
          <AnimatedCard className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">PAGAMENTO ÚNICO</span>
              </div>
              <h2 className="text-4xl font-bold text-white">{LIFETIME_PRICE_FORMATTED}</h2>
              <p className="text-white/60 mt-1">
                Acesso vitalício - pague uma vez, use para sempre
              </p>
            </div>
            
            <div className="space-y-6">
              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                size="lg"
                className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar com PIX
                  </>
                )}
              </Button>

              <Input
                value={cellphone}
                onChange={(event) => setCellphone(event.target.value)}
                placeholder="Telefone (DDD + número)"
                inputMode="tel"
                className="h-12"
              />

              <Input
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                placeholder="CPF ou CNPJ"
                inputMode="numeric"
                className="h-12"
              />

              <p className="text-xs text-center text-white/40">
                Pagamento processado por AbacatePay. Ambiente seguro.
              </p>
            </div>
          </AnimatedCard>

          {/* Benefits Card */}
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
                  <h3 className="font-medium text-white mb-1">Sem Mensalidade</h3>
                  <p className="text-sm text-white/60">
                    Pagamento único. Sem surpresas, sem cobranças recorrentes.
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
