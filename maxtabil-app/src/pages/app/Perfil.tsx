import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Perfil() {
  const { user, updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Informe a nova senha.");
      return;
    }

    setIsSaving(true);
    const result = await updatePassword(newPassword.trim());
    if (result.success) {
      toast.success("Senha atualizada com sucesso.");
      setNewPassword("");
    } else {
      toast.error("Falha ao atualizar senha.", { description: result.error });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">Confira seus dados e atualize sua senha.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>Dados da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{user?.name || "Usuário"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium">{user?.email || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Perfil</span>
              <span className="font-medium">{user?.role || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atualizar senha</CardTitle>
            <CardDescription>Troque sua senha com segurança</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={isSaving}>
              <Lock className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Atualizar senha"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
