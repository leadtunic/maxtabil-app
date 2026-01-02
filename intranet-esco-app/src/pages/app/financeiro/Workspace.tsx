import { LinksSection } from "@/components/links/LinksSection";

export default function FinanceiroWorkspace() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">Workspace do setor financeiro.</p>
      </div>
      <LinksSection sector="FINANCEIRO" />
    </div>
  );
}
