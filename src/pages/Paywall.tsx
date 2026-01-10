import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CreditCard, Check, Shield, Zap, Clock } from "lucide-react";

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

  const handleCheckout = async () => {
    if (!workspace) {
      toast.error("Workspace não encontrado");
      return;
    }

    setIsLoading(true);
    track(AnalyticsEvents.CHECKOUT_STARTED, { price: LIFETIME_PRICE });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await supabase.functions.invoke("billing_create_lifetime", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { paymentUrl } = response.data;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("URL de pagamento não recebida");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasLifetimeAccess) {
    // Already paid - redirect handled by AppShell
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white text-center">
          <CardContent className="pt-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Liberado!</h2>
            <p className="text-white/60">Você já possui acesso vitalício.</p>
            <Button className="mt-6" onClick={() => window.location.href = "/app"}>
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Libere seu Acesso</h1>
          <p className="text-white/60">
            Pagamento único via PIX. Acesso vitalício garantido.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pricing Card */}
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">PAGAMENTO ÚNICO</span>
              </div>
              <CardTitle className="text-4xl font-bold">{LIFETIME_PRICE_FORMATTED}</CardTitle>
              <CardDescription className="text-white/60">
                Acesso vitalício - pague uma vez, use para sempre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                className="w-full text-lg py-6"
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

              <p className="text-xs text-center text-white/40">
                Pagamento processado por AbacatePay. Ambiente seguro.
              </p>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Por que escolher nosso painel?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Produtividade</h3>
                  <p className="text-sm text-white/60">
                    Simuladores e ferramentas que economizam horas do seu dia.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Segurança</h3>
                  <p className="text-sm text-white/60">
                    Seus dados isolados com políticas de acesso granulares.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Sem Mensalidade</h3>
                  <p className="text-sm text-white/60">
                    Pagamento único. Sem surpresas, sem cobranças recorrentes.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  Precisa de ajuda? Entre em contato pelo e-mail{" "}
                  <a href="mailto:suporte@example.com" className="text-primary hover:underline">
                    suporte@example.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
