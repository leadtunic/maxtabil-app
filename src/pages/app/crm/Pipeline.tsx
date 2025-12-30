import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { crmDeals, crmLeads, dealStageConfig } from "@/lib/crm";
import type { DealStage } from "@/types";

const formatCurrency = (valueCents?: number) => {
  if (!valueCents) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueCents / 100);
};

const stages: DealStage[] = [
  "NEW",
  "QUALIFYING",
  "SCHEDULED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const leadsById = new Map(crmLeads.map((lead) => [lead.id, lead]));

export default function CrmPipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline de Vendas</h1>
        <p className="text-muted-foreground">Organize oportunidades e acompanhe o funil.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Kanban do funil</CardTitle>
          <CardDescription>
            Acompanhe as etapas do pipeline comercial. Arraste e solte em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {stages.map((stage) => {
              const stageDeals = crmDeals.filter((deal) => deal.stage === stage);
              const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.valueCents ?? 0), 0);
              return (
                <Card key={stage} className="border-border/60 bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">{dealStageConfig[stage].label}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {stageDeals.length} negócio(s) • {formatCurrency(totalValue)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageDeals.map((deal) => {
                      const lead = leadsById.get(deal.leadId);
                      return (
                        <div key={deal.id} className="rounded-lg border border-border/60 bg-background p-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{lead?.name ?? "Lead"}</p>
                            <p className="text-xs text-muted-foreground">{lead?.companyName ?? "Sem empresa"}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <Badge variant="outline" className="border-border/60">
                              {deal.probability}% chance
                            </Badge>
                            <span className="font-medium text-foreground">
                              {formatCurrency(deal.valueCents)}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {deal.owner ?? "Sem responsável"}
                          </p>
                        </div>
                      );
                    })}
                    {stageDeals.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                        Sem oportunidades nesta etapa.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
