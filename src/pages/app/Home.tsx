import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Calculator,
  FileText,
  CalendarDays,
  Users,
  Link2,
  Settings,
  ClipboardList,
  ArrowRight,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FramerCarousel, items as defaultRecadoItems, type CarouselItem } from "@/components/ui/framer-carousel";

const moduleCards = [
  {
    title: "Simulador de Honorários",
    description: "Calcule honorários contábeis baseados no faturamento e regime tributário.",
    icon: Calculator,
    href: "/app/financeiro/honorarios",
    color: "bg-accent/10 text-accent-foreground",
    iconColor: "text-accent",
    category: "Financeiro",
  },
  {
    title: "Simulador de Rescisão",
    description: "Calcule verbas rescisórias para diferentes tipos de desligamento.",
    icon: FileText,
    href: "/app/dp/rescisao",
    color: "bg-info/10 text-info-foreground",
    iconColor: "text-info",
    category: "DP",
  },
  {
    title: "Simulador de Férias",
    description: "Calcule valores de férias com ou sem abono pecuniário.",
    icon: CalendarDays,
    href: "/app/dp/ferias",
    color: "bg-success/10 text-success-foreground",
    iconColor: "text-success",
    category: "DP",
  },
];

const adminCards = [
  {
    title: "Usuários",
    description: "Gerenciar usuários e permissões",
    icon: Users,
    href: "/app/admin/usuarios",
  },
  {
    title: "Links",
    description: "Gerenciar links úteis",
    icon: Link2,
    href: "/app/admin/links",
  },
  {
    title: "Regras",
    description: "Gerenciar regras de cálculo",
    icon: Settings,
    href: "/app/admin/regras",
  },
  {
    title: "Auditoria",
    description: "Visualizar logs de auditoria",
    icon: ClipboardList,
    href: "/app/admin/auditoria",
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

export default function Home() {
  const { user, hasRole } = useAuth();
  const [recadoItems, setRecadoItems] = useState<CarouselItem[]>(defaultRecadoItems);
  const isAdmin = hasRole("ADMIN");
  const storageKey = "escofer.recados.carousel";
  const maxRecadoImages = 3;
  const maxImageSizeMb = 2;
  const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as CarouselItem[];
      if (Array.isArray(parsed)) {
        setRecadoItems(parsed.slice(0, maxRecadoImages));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(recadoItems.slice(0, maxRecadoImages))
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [recadoItems, storageKey, maxRecadoImages]);

  const handleUploadRecado = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    const remainingSlots = Math.max(0, maxRecadoImages - recadoItems.length);
    if (!remainingSlots) {
      toast.error(`Limite de ${maxRecadoImages} imagens atingido.`);
      event.target.value = "";
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
      event.target.value = "";
      return;
    }

    const readers = filesToProcess.map(
      (file, index) =>
        new Promise<CarouselItem>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: Date.now() + index,
              url: reader.result as string,
              title: file.name || `Recado ${recadoItems.length + index + 1}`,
            });
          };
          reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
          reader.readAsDataURL(file);
        })
    );

    Promise.allSettled(readers).then((results) => {
      const newItems = results
        .filter((result): result is PromiseFulfilledResult<CarouselItem> => result.status === "fulfilled")
        .map((result) => result.value);

      if (newItems.length) {
        setRecadoItems((prev) => [...prev, ...newItems].slice(0, maxRecadoImages));
        toast.success("Recado(s) adicionados.");
      }

      if (results.some((result) => result.status === "rejected")) {
        toast.error("Não foi possível carregar todas as imagens.");
      }
    });

    event.target.value = "";
  };

  const handleRemoveRecado = (id: number) => {
    setRecadoItems((prev) => prev.filter((item) => item.id !== id));
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
          Olá, {user?.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Acesse os módulos disponíveis na intranet.
        </p>
      </motion.div>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recados em Imagem</h2>
            <p className="text-sm text-muted-foreground">
              Comunicados visuais para toda a equipe. O carrossel troca automaticamente a cada
              8 segundos.
            </p>
          </div>
          {isAdmin && (
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Administrador
            </div>
          )}
        </div>

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
                        onClick={() => handleRemoveRecado(item.id)}
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

      {/* Simulators Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Simuladores</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {moduleCards.map((card) => (
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

      {/* Admin Section */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Administração</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {adminCards.map((card) => (
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

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Os valores apresentados nos simuladores são estimados e não substituem o cálculo oficial.
          Consulte o departamento responsável para valores definitivos.
        </p>
      </div>
    </div>
  );
}
