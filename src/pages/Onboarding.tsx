import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, Building2, CheckCircle } from "lucide-react";
import type { ModuleKey } from "@/types/supabase";

const AVAILABLE_MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: "financeiro", label: "Financeiro - Honorários", description: "Simulador de honorários contábeis" },
  { key: "financeiro_bpo", label: "Financeiro - BPO", description: "Gestão de clientes e tarefas de BPO financeiro" },
  { key: "dp", label: "Departamento Pessoal", description: "Simuladores de férias e rescisão" },
  { key: "fiscal_contabil", label: "Fiscal/Contábil", description: "Fator R, DAS e comparador de regimes" },
  { key: "legalizacao", label: "Legalização", description: "Controle de CNDs, Bombeiro, Sanitária, Alvará" },
  { key: "certificado_digital", label: "Certificado Digital", description: "Controle de vencimentos de certificados" },
  { key: "admin", label: "Administração", description: "Regras de cálculo, links e auditoria" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { workspace, refreshWorkspace } = useAuth();
  
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Record<ModuleKey, boolean>>({
    financeiro: true,
    financeiro_bpo: true,
    dp: true,
    fiscal_contabil: true,
    legalizacao: true,
    certificado_digital: true,
    admin: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleModule = (key: ModuleKey) => {
    setEnabledModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleComplete = async () => {
    if (!workspace) return;
    
    setIsLoading(true);

    try {
      let logoPath: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${workspace.id}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("workspace-logos")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          toast.error("Erro ao enviar logo, mas continuando...");
        } else {
          logoPath = fileName;
        }
      }

      // Update workspace name and logo
      await supabase
        .from("workspaces")
        .update({
          name: workspaceName,
          ...(logoPath && { logo_path: logoPath }),
        })
        .eq("id", workspace.id);

      // Update settings
      await supabase
        .from("workspace_settings")
        .update({
          enabled_modules: enabledModules,
          completed_onboarding: true,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspace.id);

      track(AnalyticsEvents.ONBOARDING_COMPLETED, {
        modules_enabled: Object.entries(enabledModules)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(","),
      });

      await refreshWorkspace();
      
      toast.success("Configuração concluída!");
      navigate("/paywall");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/5 border-white/10 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configure seu Escritório</CardTitle>
          <CardDescription className="text-white/60">
            {step === 1 ? "Informações básicas" : "Escolha os módulos"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Escritório</Label>
                <Input
                  id="name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Meu Escritório Contábil"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo (opcional)</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-contain rounded-lg bg-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="bg-white/5 border-white/10"
                    />
                    <p className="text-xs text-white/40 mt-1">PNG, JPG ou WebP até 2MB</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!workspaceName.trim()}
                className="w-full"
              >
                Próximo
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-white/60">
                Selecione os módulos que deseja habilitar. Você pode alterar isso depois.
              </p>

              <div className="space-y-3">
                {AVAILABLE_MODULES.map((module) => (
                  <div
                    key={module.key}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => toggleModule(module.key)}
                  >
                    <Checkbox
                      checked={enabledModules[module.key]}
                      onCheckedChange={() => toggleModule(module.key)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{module.label}</p>
                      <p className="text-sm text-white/50">{module.description}</p>
                    </div>
                    {enabledModules[module.key] && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Concluir"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
