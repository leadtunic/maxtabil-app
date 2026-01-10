import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  BarChart3,
  FileText,
  ClipboardList,
  Shield,
  Settings,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

const GUIDE_STORAGE_KEY = "app_guide_dismissed";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Bem-vindo ao Painel!",
    description:
      "Este é o seu painel de gestão para escritórios contábeis. Aqui você encontra simuladores, controles de vencimentos e ferramentas de BPO financeiro.",
    icon: CheckCircle,
  },
  {
    title: "Financeiro",
    description:
      "No módulo Financeiro você pode simular honorários contábeis com base no faturamento, regime tributário e número de funcionários do cliente.",
    icon: Calculator,
  },
  {
    title: "BPO Financeiro",
    description:
      "Gerencie clientes e tarefas de BPO financeiro. Acompanhe prazos, prioridades e o progresso das entregas.",
    icon: BarChart3,
  },
  {
    title: "Departamento Pessoal",
    description:
      "Simuladores de rescisão e férias para calcular verbas trabalhistas com precisão.",
    icon: FileText,
  },
  {
    title: "Fiscal/Contábil",
    description:
      "Calcule o Fator R, alíquota do DAS e compare regimes tributários do Simples Nacional.",
    icon: ClipboardList,
  },
  {
    title: "Legalização e Certificados",
    description:
      "Controle vencimentos de CNDs, Alvará, Bombeiro, Vigilância Sanitária e Certificados Digitais A1/A3.",
    icon: Shield,
  },
  {
    title: "Configurações",
    description:
      "Personalize seu escritório: altere o nome, faça upload da sua logo e escolha quais módulos aparecem no menu.",
    icon: Settings,
  },
];

interface GuideDialogProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function GuideDialog({ forceOpen, onClose }: GuideDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen);
      return;
    }

    const dismissed = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    }
    setOpen(false);
    setCurrentStep(0);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>{step.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step.description}
              </motion.span>
            </AnimatePresence>
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {GUIDE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(v === true)}
            />
            <Label htmlFor="dont-show" className="text-sm text-muted-foreground">
              Não mostrar novamente
            </Label>
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrev}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                "Começar"
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manually trigger the guide
export function useGuide() {
  const [showGuide, setShowGuide] = useState(false);

  const openGuide = () => setShowGuide(true);
  const closeGuide = () => setShowGuide(false);
  const resetGuide = () => localStorage.removeItem(GUIDE_STORAGE_KEY);

  return { showGuide, openGuide, closeGuide, resetGuide };
}
