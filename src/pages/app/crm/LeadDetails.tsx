import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { crmLeadQualification, crmLeads, crmMessagesByLead, leadStatusConfig, leadTierLabel } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { ArrowLeft, Handshake, MessageSquare, Phone, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);

export default function CrmLeadDetails() {
  const { id } = useParams<{ id: string }>();
  const lead = crmLeads.find((item) => item.id === id);

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/app/crm/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Leads
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Lead não encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const messages = crmMessagesByLead[lead.id] ?? [];
  const qualification = crmLeadQualification[lead.id] ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="px-0">
            <Link to="/app/crm/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Leads
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
            <Badge className={`border ${leadStatusConfig[lead.status].className}`}>
              {leadStatusConfig[lead.status].label}
            </Badge>
            {lead.tier && (
              <Badge variant="outline" className="border-border/60">
                {leadTierLabel[lead.tier]}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{lead.companyName ?? "Empresa não informada"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              toast.success("Handoff solicitado", { description: "Lead encaminhado para vendas." })
            }
          >
            <Handshake className="mr-2 h-4 w-4" />
            Handoff p/ Vendas
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Tarefa criada", { description: "Follow-up em aberto." })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar tarefa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Conversa (WhatsApp)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.direction === "IN" ? "justify-start" : "justify-end")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] space-y-1 rounded-lg px-3 py-2 text-sm shadow-sm",
                        message.direction === "IN"
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      <p>{message.bodyText}</p>
                      <p
                        className={cn(
                          "text-[11px]",
                          message.direction === "IN"
                            ? "text-muted-foreground/80"
                            : "text-primary-foreground/70"
                        )}
                      >
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Nenhuma mensagem registrada ainda.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {lead.phoneE164}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium">{lead.email ?? "Não informado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Localização</p>
              <p className="font-medium">
                {lead.city ? `${lead.city} • ${lead.state}` : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium">{lead.owner ?? "Fila automática"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Último contato</p>
              <p className="font-medium">{formatDateTime(lead.lastContactAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-border/60">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.keys(qualification).length === 0 && (
              <p className="text-muted-foreground">Sem dados de qualificação ainda.</p>
            )}
            {Object.entries(qualification).map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
