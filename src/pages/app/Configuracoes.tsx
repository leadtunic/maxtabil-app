import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, apiUpload, buildApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, Settings, Building2, Lock, ShieldCheck, Paintbrush } from "lucide-react";
import type { ModuleKey, Workspace, WorkspaceSettings } from "@/types/supabase";
import AdminUsuarios from "@/pages/app/admin/AdminUsuarios";
import AdminLinks from "@/pages/app/admin/AdminLinks";
import AdminRegras from "@/pages/app/admin/AdminRegras";
import AdminAuditoria from "@/pages/app/admin/AdminAuditoria";

type UploadResponse = {
  path?: string;
};

const AVAILABLE_MODULES: { key: ModuleKey; label: string }[] = [
  { key: "financeiro", label: "Financeiro - Honorários" },
  { key: "financeiro_bpo", label: "Financeiro - BPO" },
  { key: "dp", label: "Departamento Pessoal" },
  { key: "fiscal_contabil", label: "Fiscal/Contábil" },
  { key: "legalizacao", label: "Legalização" },
  { key: "certificado_digital", label: "Certificado Digital" },
  { key: "admin", label: "Administração" },
];

export default function Configuracoes() {
  const { workspace, settings, refreshWorkspace, hasModule } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get("module") as ModuleKey | null;
  const moduleContext = AVAILABLE_MODULES.find((module) => module.key === moduleParam) ?? null;

  const normalizeEnabledModules = (modules?: Record<ModuleKey, boolean>) => ({
    financeiro: true,
    financeiro_bpo: true,
    dp: true,
    fiscal_contabil: true,
    legalizacao: true,
    certificado_digital: true,
    ...(modules ?? {}),
    admin: true,
  });

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Record<ModuleKey, boolean>>(
    normalizeEnabledModules(settings?.enabled_modules as Record<ModuleKey, boolean> | undefined)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState(() => ({
    sidebarStart: localStorage.getItem("mt.sidebarStart") ?? "#0F172A",
    sidebarEnd: localStorage.getItem("mt.sidebarEnd") ?? "#0B1220",
    sidebarAccent: localStorage.getItem("mt.sidebarAccent") ?? "#1D4ED8",
    textOnSidebar: localStorage.getItem("mt.sidebarText") ?? "#E2E8F0",
  }));

  useEffect(() => {
    if (workspace?.name) {
      setWorkspaceName(workspace.name);
    }
  }, [workspace?.name]);

  useEffect(() => {
    if (workspace?.logo_path && !logoPreview) {
      setLogoPreview(buildApiUrl(`/api/storage/workspace-logos/${workspace.logo_path}`));
    }
  }, [workspace?.logo_path, logoPreview]);

  useEffect(() => {
    if (settings?.enabled_modules) {
      setEnabledModules(
        normalizeEnabledModules(settings.enabled_modules as Record<ModuleKey, boolean>)
      );
    }
  }, [settings?.enabled_modules]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--mt-sidebar-start", branding.sidebarStart);
    root.style.setProperty("--mt-sidebar-end", branding.sidebarEnd);
    root.style.setProperty("--mt-sidebar-accent", branding.sidebarAccent);
    root.style.setProperty("--mt-sidebar-text", branding.textOnSidebar);
    localStorage.setItem("mt.sidebarStart", branding.sidebarStart);
    localStorage.setItem("mt.sidebarEnd", branding.sidebarEnd);
    localStorage.setItem("mt.sidebarAccent", branding.sidebarAccent);
    localStorage.setItem("mt.sidebarText", branding.textOnSidebar);
  }, [branding]);

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

  const handleSave = async () => {
    if (!workspace) {
      toast.error("Workspace não carregado. Recarregue a página.");
      return;
    }

    if (!workspaceName.trim()) {
      toast.error("Informe o nome do escritório.");
      return;
    }

    setIsSaving(true);

    try {
      let logoPath = workspace.logo_path ?? null;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const upload = await apiUpload<UploadResponse>("/api/storage/workspace-logos", formData);
        if (upload?.path) {
          logoPath = upload.path;
        }
      }

      await apiRequest<Workspace>("/api/workspace", {
        method: "PUT",
        body: {
          name: workspaceName.trim(),
          logoPath,
        },
      });

      await apiRequest<WorkspaceSettings>("/api/workspace/settings", {
        method: "PUT",
        body: {
          enabledModules: normalizeEnabledModules(enabledModules),
          completedOnboarding: settings?.completed_onboarding ?? false,
        },
      });

      await refreshWorkspace();
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Save error:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar configurações", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize seu escritório
        </p>
        {moduleContext && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            Você está ajustando o workspace do módulo <strong>{moduleContext.label}</strong>.
            Essas configurações são globais do escritório.
          </div>
        )}
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
        {hasModule("admin") && (
          <TabsTrigger value="admin">Administração</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações do Escritório */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações do Escritório
                </CardTitle>
                <CardDescription>
                  Nome e identidade visual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Escritório</Label>
                  <Input
                    id="name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Meu Escritório"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview || workspace?.logo_path ? (
                      <img
                        src={logoPreview || buildApiUrl(`/api/storage/workspace-logos/${workspace?.logo_path}`)}
                        alt="Logo"
                        className="w-16 h-16 object-contain rounded-lg bg-slate-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Módulos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Módulos Ativos
                </CardTitle>
                <CardDescription>
                  Controle quais módulos estão disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {AVAILABLE_MODULES.map((module) => {
                    const isAdmin = module.key === "admin";
                    return (
                      <div
                        key={module.key}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                          isAdmin ? "cursor-not-allowed opacity-70" : "hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{module.label}</p>
                          {isAdmin && (
                            <p className="text-xs text-muted-foreground">Sempre habilitado</p>
                          )}
                        </div>
                        <Checkbox
                          checked={enabledModules[module.key]}
                          onCheckedChange={isAdmin ? undefined : () => toggleModule(module.key)}
                          disabled={isAdmin}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="personalizacao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Personalização da Plataforma
              </CardTitle>
              <CardDescription>
                Ajuste as cores principais para deixar o painel com a sua identidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sidebar - cor inicial</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={branding.sidebarStart}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarStart: e.target.value }))
                      }
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={branding.sidebarStart}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarStart: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sidebar - cor final</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={branding.sidebarEnd}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarEnd: e.target.value }))
                      }
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={branding.sidebarEnd}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarEnd: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sidebar - cor de destaque</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={branding.sidebarAccent}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarAccent: e.target.value }))
                      }
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={branding.sidebarAccent}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, sidebarAccent: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Texto da sidebar</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={branding.textOnSidebar}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, textOnSidebar: e.target.value }))
                      }
                      className="h-10 w-16 p-1"
                    />
                    <Input
                      value={branding.textOnSidebar}
                      onChange={(e) =>
                        setBranding((prev) => ({ ...prev, textOnSidebar: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-4">
                <p className="text-sm text-muted-foreground mb-3">Prévia da sidebar</p>
                <div
                  className="rounded-xl px-4 py-6 text-sm font-medium shadow-inner"
                  style={{
                    background: `linear-gradient(180deg, ${branding.sidebarStart}, ${branding.sidebarEnd})`,
                    color: branding.textOnSidebar,
                  }}
                >
                  <div className="mb-4 text-xs uppercase tracking-[0.2em] opacity-70">
                    Maxtabil
                  </div>
                  <div className="space-y-2">
                    <div
                      className="rounded-md px-3 py-2"
                      style={{ backgroundColor: `${branding.sidebarAccent}33` }}
                    >
                      Dashboard
                    </div>
                    <div className="rounded-md px-3 py-2 opacity-80">Financeiro</div>
                    <div className="rounded-md px-3 py-2 opacity-80">Administração</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasModule("admin") && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Administração
                </CardTitle>
                <CardDescription>
                  Gerencie usuários, links, regras e auditoria direto nas configurações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="usuarios" className="space-y-6">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                    <TabsTrigger value="regras">Regras</TabsTrigger>
                    <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
                  </TabsList>

                  <TabsContent value="usuarios">
                    <AdminUsuarios />
                  </TabsContent>
                  <TabsContent value="links">
                    <AdminLinks />
                  </TabsContent>
                  <TabsContent value="regras">
                    <AdminRegras />
                  </TabsContent>
                  <TabsContent value="auditoria">
                    <AdminAuditoria />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
