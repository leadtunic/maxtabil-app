import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { crmClientBi, crmClients, clientPlanLabel, clientStatusLabel } from "@/lib/crm";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

export default function CrmClientBI() {
  const { id } = useParams<{ id: string }>();
  const client = crmClients.find((item) => item.id === id);
  const biData = id ? crmClientBi[id] : undefined;

  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/app/crm/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Cliente não encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="px-0">
            <Link to="/app/crm/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="border-border/60">
              {clientPlanLabel[client.plan]}
            </Badge>
            <Badge variant="outline" className="border-border/60">
              {clientStatusLabel[client.contractStatus]}
            </Badge>
          </div>
        </div>
        <Button
          onClick={() =>
            toast.success("Insights gerados", {
              description: "Relatório atualizado com recomendações estratégicas.",
            })
          }
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar Insights (IA)
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resumo BI</CardTitle>
            <p className="text-sm text-muted-foreground">
              Atualizado em {biData ? formatDateTime(biData.updatedAt) : "—"}
            </p>
          </div>
          <Bot className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(biData?.kpis ?? []).map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-border/60 p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-xl font-semibold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.helper}</p>
            </div>
          ))}
          {!biData && (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground md:col-span-4">
              BI ainda não gerado para este cliente.
            </div>
          )}
        </CardContent>
      </Card>

      {biData && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Conversões e backlog</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[240px] w-full aspect-auto"
                config={{
                  conversions: { label: "Conversões", color: "hsl(var(--primary))" },
                  backlog: { label: "Backlog", color: "hsl(var(--warning))" },
                }}
              >
                <BarChart data={biData.history} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="conversions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="backlog" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tempo de resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[240px] w-full aspect-auto"
                config={{
                  responseMinutes: { label: "Minutos", color: "hsl(var(--info))" },
                }}
              >
                <LineChart data={biData.history} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="responseMinutes"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recomendações estratégicas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {biData.recommendations.map((item, index) => (
                <div key={item} className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">#{index + 1}</span> {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
