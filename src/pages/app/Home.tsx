import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

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
  const { user } = useAuth();

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
