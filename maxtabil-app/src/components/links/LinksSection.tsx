import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link2 } from "lucide-react";
import type { LinkItem, LinkSector } from "@/types";

interface LinksSectionProps {
  sector: LinkSector;
  title?: string;
  description?: string;
}

const sectorLabels: Record<LinkSector, string> = {
  GERAL: "Geral",
  FINANCEIRO: "Financeiro",
  DP: "Departamento Pessoal",
  FISCAL_CONTABIL: "Fiscal/Contábil",
  LEGALIZACAO: "Legalização",
  CERTIFICADO_DIGITAL: "Certificado Digital",
  ADMIN: "Administração",
};

const normalizeSector = (value?: string | null): LinkSector | null => {
  if (!value) return "GERAL";
  const normalized = value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_");

  if (normalized in sectorLabels) {
    return normalized as LinkSector;
  }

  if (normalized === "DEPARTAMENTO_PESSOAL" || normalized === "DEPARTAMENTO") {
    return "DP";
  }

  if (normalized === "FISCAL_CONTABIL") {
    return "FISCAL_CONTABIL";
  }

  if (normalized === "LEGALIZACAO_CERT") {
    return "CERTIFICADO_DIGITAL";
  }

  return null;
};

export function LinksSection({
  sector,
  title = "Workspace",
  description = "Links e ferramentas do setor.",
}: LinksSectionProps) {
  const { data } = useQuery({
    queryKey: ["app_links", "sector", sector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_links")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LinkItem[];
    },
  });

  const visibleLinks = useMemo(() => {
    return (data ?? []).filter((link) => {
      if (!link.is_active) return false;
      const linkSector = normalizeSector(link.sector) ?? "GERAL";
      return linkSector === "GERAL" || linkSector === sector;
    });
  }, [data, sector]);

  if (!visibleLinks.length) {
    return (
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          Nenhum link cadastrado para este setor.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLinks.map((link) => {
          const linkSector = (link.sector ?? "GERAL") as LinkSector;
          return (
            <Button
              key={link.id}
              asChild
              variant="outline"
              className="h-auto w-full justify-between gap-4 px-4 py-3"
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{link.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{sectorLabels[linkSector]}</Badge>
                      <Badge variant="outline">{link.category}</Badge>
                    </div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
