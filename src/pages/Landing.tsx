import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { track, AnalyticsEvents } from "@/lib/analytics";
import {
  Calculator,
  FileText,
  ClipboardList,
  Shield,
  Award,
  Building2,
  CheckCircle,
  ArrowRight,
  Menu,
  Lock,
  BarChart3,
  Users,
} from "lucide-react";
import { useState } from "react";

const LIFETIME_PRICE = 997;

const NAV_LINKS = [
  { label: "Módulos", href: "#modulos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Preço", href: "#preco" },
  { label: "FAQ", href: "#faq" },
];

const MODULES = [
  { icon: Calculator, title: "Financeiro - Honorários", description: "Simulador de honorários contábeis com regras configuráveis" },
  { icon: BarChart3, title: "Financeiro - BPO", description: "Gestão de clientes e tarefas de BPO financeiro" },
  { icon: FileText, title: "Fiscal/Contábil", description: "Fator R, alíquota do DAS e comparador de regimes" },
  { icon: Users, title: "Departamento Pessoal", description: "Simuladores de férias e rescisão" },
  { icon: ClipboardList, title: "Legalização", description: "Controle de CNDs, Bombeiro, Sanitária, Alvará" },
  { icon: Award, title: "Certificado Digital", description: "Controle de vencimentos de certificados A1/A3" },
];

const STEPS = [
  { step: "1", title: "Crie sua conta", description: "Cadastre-se com e-mail ou Google em segundos" },
  { step: "2", title: "Configure seu escritório", description: "Escolha os módulos e personalize com sua logo" },
  { step: "3", title: "Faça o pagamento único", description: "Pague via PIX e tenha acesso vitalício" },
  { step: "4", title: "Comece a usar", description: "Acesse todos os recursos imediatamente" },
];

const FAQ_ITEMS = [
  {
    question: "Posso escolher apenas alguns módulos?",
    answer: "Sim! Durante o onboarding você seleciona quais módulos deseja habilitar. Você pode alterar essa configuração a qualquer momento nas configurações do seu escritório.",
  },
  {
    question: "Posso usar minha própria logo?",
    answer: "Sim! Durante a configuração inicial ou nas configurações do seu escritório, você pode fazer upload da logo do seu escritório que será exibida em todo o painel.",
  },
  {
    question: "O pagamento é recorrente?",
    answer: "Não! O pagamento é único via PIX. Uma vez pago, você tem acesso vitalício ao painel e todas as atualizações futuras.",
  },
  {
    question: "Meus dados ficam isolados?",
    answer: "Sim! Cada escritório tem seu próprio workspace com dados completamente isolados. Utilizamos políticas de segurança granulares para garantir que apenas você acesse seus dados.",
  },
];

function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`py-16 md:py-24 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCtaClick = (cta: string) => {
    track(AnalyticsEvents.LANDING_CTA_CLICK, { cta });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Maxtabil" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link to="/login">
              <Button onClick={() => handleCtaClick("login")}>Entrar</Button>
            </Link>
          </nav>

          {/* Mobile Nav */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full mt-4" onClick={() => handleCtaClick("login")}>
                    Entrar
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <Section className="pt-32 md:pt-40 bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6">
              Pagamento único via PIX
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              A operação do seu escritório, centralizada e padronizada.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Simuladores fiscais e trabalhistas, BPO financeiro e controle de vencimentos em um painel único.
              Personalize módulos e identidade do seu escritório em minutos.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" onClick={() => handleCtaClick("primary")}>
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#modulos">
                <Button size="lg" variant="outline" onClick={() => handleCtaClick("secondary")}>
                  Ver módulos
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Setup rápido
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Módulos sob medida
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Auditoria e rastreabilidade
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Acesso vitalício via PIX
              </span>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Módulos */}
      <Section id="modulos" className="bg-slate-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Módulos para cada setor
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Escolha os módulos que fazem sentido para o seu escritório. Ative e desative quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Como funciona */}
      <Section id="como-funciona">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Como funciona
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Comece a usar em menos de 5 minutos. Sem complicação.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Segurança */}
      <Section className="bg-slate-900 text-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Segurança e Governança
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Seus dados protegidos com as melhores práticas do mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Dados Isolados</h3>
            <p className="text-sm text-slate-400">
              Cada escritório tem seu workspace com dados completamente isolados.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Políticas de Acesso</h3>
            <p className="text-sm text-slate-400">
              Controle granular de quem pode acessar cada funcionalidade.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="font-semibold mb-2">Auditoria Completa</h3>
            <p className="text-sm text-slate-400">
              Registro de todas as ações para compliance e rastreabilidade.
            </p>
          </div>
        </div>
      </Section>

      {/* Preço */}
      <Section id="preco" className="bg-slate-50">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center pb-2">
                <Badge className="w-fit mx-auto mb-4">Pagamento único</Badge>
                <CardTitle className="text-4xl font-bold">
                  R$ {LIFETIME_PRICE.toLocaleString("pt-BR")},00
                </CardTitle>
                <CardDescription className="text-base">
                  Acesso vitalício - pague uma vez, use para sempre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Separator />
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Acesso vitalício ao painel</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Módulos configuráveis por escritório</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Auditoria e dados estruturados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Atualizações futuras incluídas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Suporte por e-mail</span>
                  </li>
                </ul>
                <Link to="/login" className="block">
                  <Button className="w-full" size="lg" onClick={() => handleCtaClick("pricing")}>
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-slate-500">
                  Pagamento seguro via PIX
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Painel de Gestão</span>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
