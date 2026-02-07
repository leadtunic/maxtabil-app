import { useEffect, useMemo, useState, useRef } from "react";
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
  const [elapsed, setElapsed] = useState(0);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.2,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        color: ["#7CFFB2", "#8AB4FF", "#F9D976", "#FF8FAB", "#A78BFA"][index % 5],
      })),
    []
  );

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
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    poll(); // Initial poll

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [hasLifetimeAccess, navigate, refreshWorkspace]);

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1324] via-[#0A0F1E] to-[#0E1B3A] p-4 overflow-hidden relative">
        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(360px) rotate(360deg); opacity: 0; }
          }
          @keyframes halo-pulse {
            0% { transform: scale(0.96); opacity: 0.55; }
            100% { transform: scale(1.08); opacity: 0.2; }
          }
          @keyframes sheen {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl animate-[halo-pulse_2.6s_ease-in-out_infinite_alternate]" />
          <div className="absolute bottom-10 right-12 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl animate-[halo-pulse_3s_ease-in-out_infinite_alternate]" />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size * 0.6,
                background: piece.color,
                transform: `rotate(${piece.rotate}deg)`,
                animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
              }}
            />
          ))}
        </div>

        <Card className="w-full max-w-lg bg-white/5 border-white/10 text-white text-center backdrop-blur-sm">
          <CardContent className="pt-10 pb-10 px-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 shadow-[0_0_0_8px_rgba(16,185,129,0.08)]">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado</h2>
            <p className="text-white/70 mb-6">
              Sua assinatura do Maxtabil está ativa e seu acesso completo já foi liberado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left text-sm text-white/70">
              {[
                "Onboarding premium liberado",
                "Ambiente seguro e dedicado",
                "Acesso contínuo com renovação automática",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
            <Button
              onClick={() => navigate("/app")}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
            >
              Entrar no Painel
            </Button>
            <p className="mt-3 text-xs text-white/50">
              Redirecionando automaticamente…
            </p>
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
            <h2 className="text-2xl font-bold mb-2">Confirmação em andamento</h2>
            <p className="text-white/60 mb-6">
              Estamos finalizando a confirmação do pagamento. Assim que aprovado, seu acesso é liberado automaticamente.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70 mb-6">
              A confirmação da assinatura pode levar alguns minutos para atualizar. Você receberá uma confirmação assim que concluir.
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  startTimeRef.current = Date.now();
                  setElapsed(0);
                  setStatus("polling");
                }}
                variant="outline"
              >
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
      <Card className="w-full max-w-lg bg-white/5 border-white/10 text-white text-center">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Aguardando confirmação</h2>
          <p className="text-white/60 mb-6">
            Monitorando seu pagamento em tempo real.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 mb-4">
            Tempo decorrido: <span className="font-semibold text-white">{elapsed}s</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[sheen_2s_linear_infinite] bg-gradient-to-r from-emerald-400/20 via-emerald-400/60 to-cyan-400/20" />
          </div>
          <p className="mt-4 text-xs text-white/50">
            Aprovação confirmada? Você será redirecionado automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
