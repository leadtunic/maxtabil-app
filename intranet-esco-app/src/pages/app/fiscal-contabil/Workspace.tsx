import { LinksSection } from "@/components/links/LinksSection";

export default function FiscalContabilWorkspace() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Fiscal/Contábil</h1>
        <p className="text-muted-foreground">Workspace do setor fiscal e contábil.</p>
      </div>
      <LinksSection sector="FISCAL_CONTABIL" />
    </div>
  );
}
