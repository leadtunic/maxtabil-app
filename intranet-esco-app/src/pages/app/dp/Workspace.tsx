import { LinksSection } from "@/components/links/LinksSection";

export default function DepartamentoPessoalWorkspace() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Departamento Pessoal</h1>
        <p className="text-muted-foreground">Workspace do setor de DP.</p>
      </div>
      <LinksSection sector="DP" />
    </div>
  );
}
