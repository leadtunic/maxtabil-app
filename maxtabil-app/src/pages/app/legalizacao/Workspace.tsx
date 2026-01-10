import { LinksSection } from "@/components/links/LinksSection";

export default function LegalizacaoWorkspace() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Legalização</h1>
        <p className="text-muted-foreground">Workspace do setor de legalização.</p>
      </div>
      <LinksSection sector="LEGALIZACAO" />
    </div>
  );
}
