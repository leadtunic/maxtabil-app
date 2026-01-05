import { useEffect, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Calculator,
  FileText,
  Users,
  Link2,
  Settings,
  ClipboardList,
  ArrowRight,
  ImagePlus,
  Trash2,
  MessageCircle,
  ExternalLink,
  Scale,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { FramerCarousel, type CarouselItem } from "@/components/ui/framer-carousel";
import { useAuthorization } from "@/hooks/use-authorization";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, trackLinkClick } from "@/lib/supabase";
import type { LinkItem, LinkSector } from "@/types";

const moduleCards = [
  {
    title: "Fator R",
    description: "Calculadora do Fator R para enquadramento no Simples Nacional.",
    icon: Scale,
    href: "/app/fiscal-contabil?tab=fator-r",
    color: "bg-primary/10 text-primary-foreground",
    iconColor: "text-primary",
    category: "Fiscal",
    routeKey: "fiscal-contabil" as const,
  },
  {
    title: "DAS Simples Nacional",
    description: "Calcule alíquota efetiva e valor estimado do DAS.",
    icon: Calculator,
    href: "/app/fiscal-contabil?tab=das",
    color: "bg-primary/10 text-primary-foreground",
    iconColor: "text-primary",
    category: "Fiscal",
    routeKey: "fiscal-contabil" as const,
  },
  {
    title: "Comparador Simples",
    description: "Compare dois RuleSets do Simples Nacional.",
    icon: BarChart3,
    href: "/app/fiscal-contabil?tab=comparador",
    color: "bg-primary/10 text-primary-foreground",
    iconColor: "text-primary",
    category: "Fiscal",
    routeKey: "fiscal-contabil" as const,
  },
  {
    title: "Simulador de Honorários",
    description: "Calcule honorários contábeis baseados no faturamento e regime tributário.",
    icon: Calculator,
    href: "/app/financeiro/honorarios",
    color: "bg-accent/10 text-accent-foreground",
    iconColor: "text-accent",
    category: "Financeiro",
    routeKey: "financeiro" as const,
  },
  {
    title: "Simuladores DP",
    description: "Rescisão e férias em um único painel com abas.",
    icon: FileText,
    href: "/app/dp",
    color: "bg-info/10 text-info-foreground",
    iconColor: "text-info",
    category: "DP",
    routeKey: "dp" as const,
  },
  {
    title: "CRM",
    description: "Acompanhe leads, conversas e pipeline de vendas.",
    icon: MessageCircle,
    href: "/app/crm/dashboard",
    color: "bg-primary/10 text-primary-foreground",
    iconColor: "text-primary",
    category: "CRM",
    routeKey: "crm" as const,
  },
];

const adminCards = [
  {
    title: "Usuários",
    description: "Gerenciar usuários e permissões",
    icon: Users,
    href: "/app/admin/usuarios",
    routeKey: "admin" as const,
  },
  {
    title: "Links",
    description: "Gerenciar links úteis",
    icon: Link2,
    href: "/app/admin/links",
    routeKey: "admin" as const,
  },
  {
    title: "Regras",
    description: "Gerenciar regras de cálculo",
    icon: Settings,
    href: "/app/admin/regras",
    routeKey: "admin" as const,
  },
  {
    title: "Auditoria",
    description: "Visualizar logs de auditoria",
    icon: ClipboardList,
    href: "/app/admin/auditoria",
    routeKey: "admin" as const,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const sectorLabels: Record<LinkSector, string> = {
  GERAL: "Geral",
  FINANCEIRO: "Financeiro",
  DP: "Departamento Pessoal",
  FISCAL_CONTABIL: "Fiscal/Contábil",
  LEGALIZACAO: "Legalização",
  CERTIFICADO_DIGITAL: "Certificado Digital",
  ADMIN: "Administração",
};

type HomeRecadoRow = {
  id: string;
  title: string;
  image_path: string;
  created_at: string;
};

export default function Home() {
  const { user } = useAuth();
  const { canAccess } = useAuthorization();
  const queryClient = useQueryClient();
  const isAdmin = canAccess("admin");
  const recadoBucket = "home-recados";
  const maxRecadoImages = 3;
  const maxImageSizeMb = 2;
  const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;
  const signedUrlExpiresIn = 60 * 60 * 12;
  const getRecadoFileId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  // Get first name or email prefix as fallback
  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const firstName = displayName.split(" ")[0];

  const { data: recadoItems = [], isError: recadosError } = useQuery({
    queryKey: ["home_recados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_recados")
        .select("id,title,image_path,created_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(maxRecadoImages);

      if (error) throw error;

      const rows = (data ?? []) as HomeRecadoRow[];
      if (!rows.length) return [] as CarouselItem[];

      const signedItems = await Promise.all(
        rows.map(async (row) => {
          const { data: signedData, error: signedError } = await supabase.storage
            .from(recadoBucket)
            .createSignedUrl(row.image_path, signedUrlExpiresIn);

          if (signedError || !signedData?.signedUrl) {
            throw signedError ?? new Error("Falha ao gerar URL de recado.");
          }

          return {
            id: row.id,
            url: signedData.signedUrl,
            title: row.title,
            storagePath: row.image_path,
          } satisfies CarouselItem;
        })
      );

      return signedItems;
    },
  });

  useEffect(() => {
    if (recadosError) {
      toast.error("Não foi possível carregar os recados.");
    }
  }, [recadosError]);

  const handleUploadRecado = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    if (!isAdmin) {
      toast.error("Você não tem permissão para enviar recados.");
      input.value = "";
      return;
    }

    const { count, error: countError } = await supabase
      .from("home_recados")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    if (countError) {
      toast.error("Não foi possível validar o limite de recados.");
      input.value = "";
      return;
    }

    const existingCount = count ?? recadoItems.length;
    const remainingSlots = Math.max(0, maxRecadoImages - existingCount);
    if (!remainingSlots) {
      toast.error(`Limite de ${maxRecadoImages} imagens atingido.`);
      input.value = "";
      return;
    }

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    const sizeOkFiles = validFiles.filter((file) => file.size <= maxImageSizeBytes);
    if (validFiles.length !== files.length) {
      toast.error("Envie apenas arquivos de imagem.");
    }
    if (sizeOkFiles.length !== validFiles.length) {
      toast.error(`Algumas imagens excedem ${maxImageSizeMb}MB e foram ignoradas.`);
    }

    const filesToProcess = sizeOkFiles.slice(0, remainingSlots);
    if (!filesToProcess.length) {
      input.value = "";
      return;
    }

    const results = await Promise.allSettled(
      filesToProcess.map(async (file, index) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `recados/${getRecadoFileId()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(recadoBucket)
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("home_recados").insert({
          title: file.name || `Recado ${existingCount + index + 1}`,
          image_path: filePath,
          created_by: user?.id ?? null,
        });

        if (insertError) {
          await supabase.storage.from(recadoBucket).remove([filePath]);
          throw insertError;
        }
      })
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    if (successCount) {
      toast.success(`${successCount} recado(s) adicionado(s).`);
      await queryClient.invalidateQueries({ queryKey: ["home_recados"] });
    }

    if (results.some((result) => result.status === "rejected")) {
      toast.error("Alguns recados não puderam ser enviados.");
    }

    input.value = "";
  };

  const handleRemoveRecado = async (id: string, storagePath?: string) => {
    if (!isAdmin) {
      toast.error("Você não tem permissão para remover recados.");
      return;
    }

    const { error: deleteError } = await supabase.from("home_recados").delete().eq("id", id);
    if (deleteError) {
      toast.error("Não foi possível remover o recado.");
      return;
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from(recadoBucket).remove([storagePath]);
      if (storageError) {
        toast.error("Recado removido, mas não foi possível apagar a imagem.");
      }
    }

    toast.success("Recado removido.");
    await queryClient.invalidateQueries({ queryKey: ["home_recados"] });
  };

  const visibleModuleCards = moduleCards.filter((card) => canAccess(card.routeKey));
  const visibleAdminCards = adminCards.filter((card) => canAccess(card.routeKey));
  const { data: linksData } = useQuery({
    queryKey: ["app_links", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_links")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LinkItem[];
    },
  });

  const visibleLinks = (linksData ?? []).filter((link) => {
    if (!link.is_active) return false;
    if (link.sector === "GERAL") return true;
    if (link.sector === "ADMIN") return canAccess("admin");
    if (link.sector === "FINANCEIRO") return canAccess("financeiro");
    if (link.sector === "DP") return canAccess("dp");
    if (link.sector === "FISCAL_CONTABIL") return canAccess("fiscal-contabil");
    if (link.sector === "LEGALIZACAO") return canAccess("legalizacao");
    if (link.sector === "CERTIFICADO_DIGITAL") return canAccess("certificado-digital");
    return false;
  });

  const handleLinkClick = async (link: LinkItem) => {
    if (link.id) {
      await trackLinkClick(link.id);
    }
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo(a), <span className="gradient-text">{firstName}</span>! 👋
        </h1>
        <p className="text-muted-foreground">
          Acesse os sistemas e ferramentas disponíveis para o seu departamento.
        </p>
      </motion.div>

      {(recadoItems.length > 0 || isAdmin) && (
        <section className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Administrador
              </div>
            </div>
          )}

        <Card className="border-border/60">
          <CardContent className="p-0">
            <FramerCarousel items={recadoItems} autoPlayMs={8000} />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Gerenciar recados</CardTitle>
              <CardDescription>
                Envie imagens (máximo 3) ou remova recados existentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadRecado}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImagePlus className="h-4 w-4" />
                  JPG/PNG até {maxImageSizeMb}MB. Tamanho recomendado 1200×600.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recadoItems.map((item) => (
                  <div key={item.id} className="relative overflow-hidden rounded-xl border">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-28 w-full object-cover"
                    />
                    <div className="absolute right-2 top-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => void handleRemoveRecado(item.id, item.storagePath)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                      {item.title}
                    </div>
                  </div>
                ))}
                {recadoItems.length < maxRecadoImages && (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                    Espaço disponível para novo recado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
      )}

      {/* Modules Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Sistemas e Ferramentas</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {visibleModuleCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Link to={card.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group cursor-pointer border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {card.category}
                      </span>
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Acessar
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {visibleLinks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Links Úteis</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleLinks.map((link) => (
              <a
                key={link.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link);
                }}
                href={link.url}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-2.5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{link.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {sectorLabels[link.sector]}
                      </Badge>
                      {link.clicks !== undefined && link.clicks > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {link.clicks} {link.clicks === 1 ? "clique" : "cliques"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </section>
      )}

      {visibleAdminCards.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Painel Administrativo</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleAdminCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Link to={card.href}>
                <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer border-border/50 hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <card.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {card.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
      )}
    </div>
  );
}
