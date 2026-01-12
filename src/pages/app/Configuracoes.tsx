import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Upload, Settings, Building2 } from "lucide-react";
import type { ModuleKey } from "@/types/supabase";

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
  const { workspace, settings, refreshWorkspace } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get("module") as ModuleKey | null;
  const moduleContext = AVAILABLE_MODULES.find((module) => module.key === moduleParam) ?? null;
  
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Record<ModuleKey, boolean>>(
    (settings?.enabled_modules as Record<ModuleKey, boolean>) || {
      financeiro: true,
      financeiro_bpo: true,
      dp: true,
      fiscal_contabil: true,
      legalizacao: true,
      certificado_digital: true,
      admin: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!workspace) return;
    
    setIsSaving(true);

    try {
      let logoPath = workspace.logo_path;

      // Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${workspace.id}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("workspace-logos")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          toast.error("Erro ao enviar logo");
        } else {
          logoPath = fileName;
        }
      }

      // Update workspace
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
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspace.id);

      await refreshWorkspace();
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar configurações");
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
                    src={logoPreview || `/api/storage/workspace-logos/${workspace?.logo_path}`}
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
            <CardTitle>Módulos Habilitados</CardTitle>
            <CardDescription>
              Escolha quais módulos aparecem no menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AVAILABLE_MODULES.map((module) => (
                <div
                  key={module.key}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    moduleContext?.key === module.key
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => toggleModule(module.key)}
                >
                  <Checkbox
                    checked={enabledModules[module.key]}
                    onCheckedChange={() => toggleModule(module.key)}
                  />
                  <span>{module.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
}
