import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import type { ModuleKey } from "@/types/supabase";

interface WorkspacePlaceholderProps {
  title: string;
  moduleKey?: ModuleKey;
}

export default function WorkspacePlaceholder({ title, moduleKey }: WorkspacePlaceholderProps) {
  const configUrl = moduleKey ? `/app/configuracoes?module=${moduleKey}` : "/app/configuracoes";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">Aguardando Links</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Links do Workspace
          </CardTitle>
          <CardDescription>
            Assim que os links estiverem configurados, eles aparecerão aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={configUrl}>Ir para Configurações</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
