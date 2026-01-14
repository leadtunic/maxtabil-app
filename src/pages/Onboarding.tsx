import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { track, AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedCard } from "@/components/ui/animated-card";
import ProceduralGroundBackground from "@/components/ui/animated-pattern-cloud";
import { toast } from "sonner";
import { Loader2, Upload, Building2 } from "lucide-react";
import type { ModuleKey } from "@/types/supabase";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string; full_name?: string };
};

type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseAuthResponse = {
  data: { user: AuthUser | null };
  error: { message: string } | null;
};

const AVAILABLE_MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: "financeiro", label: "Financeiro - Honorários", description: "Simulador de honorários contábeis" },
  { key: "financeiro_bpo", label: "Financeiro - BPO", description: "Gestão de clientes e tarefas de BPO financeiro" },
  { key: "dp", label: "Departamento Pessoal", description: "Simuladores de férias e rescisão" },
  { key: "fiscal_contabil", label: "Fiscal/Contábil", description: "Fator R, DAS e comparador de regimes" },
  { key: "legalizacao", label: "Legalização", description: "Controle de CNDs, Bombeiro, Sanitária, Alvará" },
  { key: "certificado_digital", label: "Certificado Digital", description: "Controle de vencimentos de certificados" },
  { key: "admin", label: "Administração", description: "Regras de cálculo, links e auditoria" },
];

function generateSlug(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { workspace, refreshWorkspace, isAuthenticated, isLoading: authLoading } = useAuth();
  
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

  const normalizeEnabledModules = (modules: Record<ModuleKey, boolean>) => ({
    ...modules,
    admin: true,
  });
  const requestTimeoutMs = 10000;

  const withTimeout = async <T,>(promise: PromiseLike<T>, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout ao ${label}. Tente novamente.`));
      }, requestTimeoutMs);
    });

    try {
      return await Promise.race([Promise.resolve(promise), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    if (workspace?.name) {
      setWorkspaceName(workspace.name);
    }
    if (workspace?.logo_path && !logoPreview) {
      setLogoPreview(`/api/storage/workspace-logos/${workspace.logo_path}`);
    }
  }, [workspace?.name, workspace?.logo_path, logoPreview]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
    if (key === "admin") {
      return;
    }
    setEnabledModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      let activeWorkspace = workspace;
      if (!activeWorkspace) {
        const userResponse = (await withTimeout(
          supabase.auth.getUser(),
          "carregar usuário"
        )) as SupabaseAuthResponse;
        const user = userResponse.data?.user;
        if (!user) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }

        const { data: existingWs, error: existingWsError } = (await withTimeout(
          supabase
            .from("workspaces")
            .select("*")
            .eq("owner_user_id", user.id)
            .single(),
          "buscar workspace"
        )) as SupabaseResponse<{
          id: string;
          name: string;
          logo_path?: string | null;
        }>;

        if (existingWsError || !existingWs) {
          const email = user.email || "user@example.com";
          const displayName =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            email.split("@")[0];

          const { data: newWs, error: createError } = (await withTimeout(
            supabase
              .from("workspaces")
              .insert({
                owner_user_id: user.id,
                name: String(displayName),
                slug: generateSlug(email),
              })
              .select()
              .single(),
            "criar workspace"
          )) as SupabaseResponse<{
            id: string;
            name: string;
            logo_path?: string | null;
          }>;

          if (createError || !newWs) {
            throw createError || new Error("Não foi possível criar o workspace.");
          }

          await withTimeout(
            supabase.from("entitlements").upsert({
              workspace_id: newWs.id,
              lifetime_access: false,
            }),
            "criar entitlement"
          );

          activeWorkspace = newWs;
        } else {
          activeWorkspace = existingWs;
        }
      }

      if (!activeWorkspace) {
        throw new Error("Workspace não encontrado. Recarregue a página.");
      }

      const ensuredWorkspace = activeWorkspace;
      let logoPath: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${ensuredWorkspace.id}/logo.${fileExt}`;
        
        const { error: uploadError } = (await withTimeout(
          supabase.storage.from("workspace-logos").upload(fileName, logoFile, { upsert: true }),
          "enviar a logo"
        )) as SupabaseResponse<{ path: string }>;

        if (uploadError) {
          throw uploadError;
        } else {
          logoPath = fileName;
        }
      }

      // Update workspace name and logo
      const { error: workspaceError } = (await withTimeout(
        supabase
          .from("workspaces")
          .update({
            name: workspaceName,
            ...(logoPath && { logo_path: logoPath }),
          })
          .eq("id", ensuredWorkspace.id),
        "atualizar o escritório"
      )) as SupabaseResponse<{
        id: string;
        name: string;
        logo_path?: string | null;
      }>;
        
      if (workspaceError) {
        throw workspaceError;
      }

      // Update settings
      const normalizedModules = normalizeEnabledModules(enabledModules);
      const { error: settingsError } = (await withTimeout(
        supabase
          .from("workspace_settings")
          .upsert(
            {
              workspace_id: ensuredWorkspace.id,
              enabled_modules: normalizedModules,
              completed_onboarding: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "workspace_id" }
          ),
        "salvar configurações"
      )) as SupabaseResponse<{ workspace_id: string }>;
        
      if (settingsError) {
        throw settingsError;
      }

      track(AnalyticsEvents.ONBOARDING_COMPLETED, {
        modules_enabled: Object.entries(normalizedModules)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(","),
      });

      await withTimeout(refreshWorkspace(), "recarregar o workspace");
      
      toast.success("Configuração concluída!");
      navigate("/paywall");
    } catch (error) {
      console.error("Onboarding error:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar configurações", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <ProceduralGroundBackground />
      
      <div className="w-full max-w-xl">
        <AnimatedCard className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo do escritório"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-blue-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">Configure seu Escritório</h1>
            <p className="text-white/60">
              {step === 1 ? "Informações básicas" : "Escolha os módulos"}
            </p>
          </div>

          <div className="space-y-4 text-white">
            {step === 1 && (
              <div className="space-y-5">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
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

                <div className="space-y-2">
                  {AVAILABLE_MODULES.map((module) => {
                    const isAdmin = module.key === "admin";
                    return (
                      <div
                        key={module.key}
                        className={`flex items-start gap-3 p-2 rounded-lg bg-white/5 transition-colors ${
                          isAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-white/10"
                        }`}
                        onClick={isAdmin ? undefined : () => toggleModule(module.key)}
                      >
                        <Checkbox
                          checked={enabledModules[module.key]}
                          onCheckedChange={isAdmin ? undefined : () => toggleModule(module.key)}
                          className="mt-0.5"
                          disabled={isAdmin}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{module.label}</p>
                          <p className="text-xs text-white/50">{module.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
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
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
