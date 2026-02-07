import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProceduralGroundBackground from "@/components/ui/animated-pattern-cloud";
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
  Award,
  Building2,
  CheckCircle,
  ArrowRight,
  Menu,
  BarChart3,
  Users,
} from "lucide-react";
import { useState } from "react";

const LIFETIME_PRICE = 997;

const NAV_LINKS = [
  { label: "Módulos", href: "#modulos" },
  { label: "Como funciona", href: "/como-funciona" },
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
  { step: "3", title: "Faça sua assinatura", description: "Assine com cartão e mantenha acesso ativo" },
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
    answer: "Sim. A cobrança é recorrente no cartão de crédito para manter o acesso ativo ao painel.",
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
    <div className="min-h-screen text-zinc-100 relative">
      <ProceduralGroundBackground />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-500" />
            <span className="font-semibold text-lg text-zinc-100">Maxtabil</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-150"
                >
                  {link.label}
                </a>
              )
            ))}
            <Link to="/login">
              <Button 
                variant="outline" 
                className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => handleCtaClick("login")}
              >
                Entrar
              </Button>
            </Link>
          </nav>

          {/* Mobile Nav */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-zinc-950/95 backdrop-blur-xl border-zinc-800">
              <nav className="flex flex-col gap-4 mt-8">
                {NAV_LINKS.map((link) => (
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      {link.label}
                    </a>
                  )
                ))}
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleCtaClick("login")}>
                    Entrar
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <Section className="pt-32 md:pt-40 relative overflow-hidden">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/15">
            Assinatura recorrente no cartão
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-100 mb-6 leading-tight tracking-tight">
            A operação do seu escritório, centralizada e padronizada.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
            Simuladores fiscais e trabalhistas, BPO financeiro e controle de vencimentos em um painel único.
            Personalize módulos e identidade do seu escritório em minutos.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/login?tab=signup">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleCtaClick("primary")}
              >
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#modulos">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => handleCtaClick("secondary")}
              >
                Ver módulos
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Setup rápido
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Módulos sob medida
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Auditoria e rastreabilidade
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Acesso contínuo via assinatura
            </span>
          </div>
        </div>
      </Section>

      {/* Módulos */}
      <Section id="modulos" className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Módulos para cada setor
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Escolha os módulos que fazem sentido para o seu escritório. Ative e desative quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module, i) => (
            <div
              key={module.title}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <Card className="h-full bg-zinc-900/70 backdrop-blur-sm border-zinc-800 hover:border-blue-500/30 transition-colors duration-200">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <module.icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg text-zinc-100">{module.title}</CardTitle>
                  <CardDescription className="text-zinc-400">{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </Section>

      {/* Como funciona */}
      <Section id="como-funciona" className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Como funciona
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Comece a usar em menos de 5 minutos. Sem complicação.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={step.step}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA para página detalhada */}
        <div className="text-center mt-12">
          <Link to="/como-funciona">
            <Button 
              variant="outline" 
              size="lg"
              className="border-blue-500/50 bg-transparent text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            >
              Ver detalhes completos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* Preço */}
      <Section id="preco" className="relative">
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-blue-500/50 bg-zinc-900/80 backdrop-blur-sm shadow-2xl shadow-blue-500/10">
            <CardHeader className="text-center pb-2">
              <Badge className="w-fit mx-auto mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
                Assinatura
              </Badge>
              <CardTitle className="text-4xl font-bold text-zinc-100 font-mono">
                R$ {LIFETIME_PRICE.toLocaleString("pt-BR")},00
              </CardTitle>
              <CardDescription className="text-base text-zinc-400">
                Assinatura recorrente com renovação automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator className="bg-zinc-800" />
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>Acesso completo enquanto a assinatura estiver ativa</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>Módulos configuráveis por escritório</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>Auditoria e dados estruturados</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>Atualizações futuras incluídas</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>Suporte por e-mail</span>
                </li>
              </ul>
              <Link to="/login?tab=signup" className="block">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  size="lg" 
                  onClick={() => handleCtaClick("pricing")}
                >
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-center text-zinc-500">
                Pagamento seguro via Mercado Pago
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-4 rounded-lg mb-2">
                <AccordionTrigger className="text-left text-zinc-100 hover:text-zinc-100 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Footer */}
      <footer className="relative bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-500" />
              <span className="font-semibold text-zinc-100">Maxtabil</span>
            </div>
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
