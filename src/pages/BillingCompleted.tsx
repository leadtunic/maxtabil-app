import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const MAX_POLL_TIME = 60000; // 60 seconds
const POLL_INTERVAL = 3000; // 3 seconds

export default function BillingCompleted() {
  const navigate = useNavigate();
  const { refreshWorkspace, hasLifetimeAccess } = useAuth();
  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (hasLifetimeAccess) {
      setStatus("success");
      track(AnalyticsEvents.BILLING_PAID);
      toast.success("Pagamento confirmado! Bem-vindo!");
      setTimeout(() => navigate("/app"), 2000);
      return;
    }

    const poll = async () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      if (elapsed >= MAX_POLL_TIME) {
        setStatus("timeout");
        return;
      }

      await refreshWorkspace();
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    poll(); // Initial poll

    return () => clearInterval(interval);
  }, [hasLifetimeAccess, navigate, refreshWorkspace]);

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
            <p className="text-white/60 mb-6">
              Seu acesso vitalício foi ativado com sucesso.
            </p>
            <Button onClick={() => navigate("/app")} size="lg">
              Acessar o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Aguardando Confirmação</h2>
            <p className="text-white/60 mb-6">
              O pagamento ainda está sendo processado. Isso pode levar alguns minutos.
              <br />
              Você receberá um e-mail quando for confirmado.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => {
                startTimeRef.current = Date.now();
                setStatus("polling");
              }} variant="outline">
                Verificar Novamente
              </Button>
              <Button onClick={() => navigate("/paywall")} variant="ghost">
                Voltar ao Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Polling state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white text-center">
        <CardContent className="pt-8 pb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Processando Pagamento</h2>
          <p className="text-white/60 mb-4">
            Aguarde enquanto confirmamos seu pagamento...
          </p>
          <p className="text-sm text-white/40">
            Isso geralmente leva menos de 1 minuto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
