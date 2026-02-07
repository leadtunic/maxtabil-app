import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProceduralGroundBackground from "@/components/ui/animated-pattern-cloud";
import {
  Calculator,
  FileText,
  ClipboardList,
  Shield,
  Award,
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Users,
  Settings,
  Palette,
  Database,
  Lock,
  Clock,
  Zap,
  Target,
  Layers,
  PieChart,
  TrendingUp,
  Calendar,
  Bell,
  FileCheck,
} from "lucide-react";

const MODULES_DETAILED = [
  {
    icon: Calculator,
    title: "Financeiro - Honorários",
    description: "Simulador de honorários contábeis com regras configuráveis",
    features: [
      "Tabela de honorários por tipo de empresa (MEI, ME, EPP, etc.)",
      "Cálculo automático baseado em faturamento e número de funcionários",
      "Regras personalizáveis por escritório",
      "Histórico de simulações realizadas",
      "Exportação de propostas em PDF",
    ],
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Financeiro - BPO",
    description: "Gestão completa de clientes e tarefas de BPO financeiro",
    features: [
      "Dashboard com visão geral de todos os clientes",
      "Controle de tarefas recorrentes (conciliação, pagamentos, etc.)",
      "Alertas de vencimentos e pendências",
      "Métricas de produtividade por analista",
      "Integração com calendário de obrigações",
    ],
    color: "cyan",
  },
  {
    icon: FileText,
    title: "Fiscal/Contábil",
    description: "Simuladores fiscais para tomada de decisão",
    features: [
      "Simulador de Fator R (Anexo III vs Anexo V)",
      "Calculadora de alíquota efetiva do DAS",
      "Comparador de regimes tributários (Simples x Lucro Presumido x Real)",
      "Projeções de impostos com base em faturamento",
      "Relatórios comparativos para apresentar ao cliente",
    ],
    color: "purple",
  },
  {
    icon: Users,
    title: "Departamento Pessoal",
    description: "Simuladores trabalhistas precisos",
    features: [
      "Simulador de férias (com terço constitucional)",
      "Simulador de rescisão (todos os tipos de desligamento)",
      "Cálculo de 13º salário proporcional",
      "Simulador de horas extras e adicional noturno",
      "Histórico de simulações por funcionário",
    ],
    color: "green",
  },
  {
    icon: ClipboardList,
    title: "Legalização",
    description: "Controle centralizado de documentos e certidões",
    features: [
      "Painel de CNDs (Federal, Estadual, Municipal, FGTS)",
      "Controle de Alvará de Funcionamento",
      "Acompanhamento de Licença Sanitária",
      "Gestão de Auto de Vistoria do Bombeiro (AVCB)",
      "Alertas automáticos de vencimento",
    ],
    color: "orange",
  },
  {
    icon: Award,
    title: "Certificado Digital",
    description: "Gestão de certificados A1 e A3",
    features: [
      "Cadastro de todos os certificados dos clientes",
      "Alertas de vencimento com antecedência configurável",
      "Diferenciação entre A1 (arquivo) e A3 (token/cartão)",
      "Histórico de renovações",
      "Relatório de certificados a vencer",
    ],
    color: "pink",
  },
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Cadastro Rápido",
    description: "Crie sua conta em segundos usando e-mail ou Google. Sem burocracia.",
    icon: Zap,
  },
  {
    step: 2,
    title: "Configure seu Workspace",
    description: "Dê um nome ao seu escritório, faça upload da logo e escolha as cores.",
    icon: Palette,
  },
  {
    step: 3,
    title: "Selecione os Módulos",
    description: "Ative apenas os módulos que fazem sentido para seu escritório.",
    icon: Layers,
  },
  {
    step: 4,
    title: "Assinatura Recorrente no Cartão",
    description: "Pague R$ 997,00 uma única vez e tenha acesso vitalício.",
    icon: Target,
  },
  {
    step: 5,
    title: "Comece a Usar",
    description: "Acesso imediato a todos os recursos. Sem período de trial.",
    icon: CheckCircle,
  },
];

const SECURITY_FEATURES = [
  {
    icon: Database,
    title: "Multi-tenant Isolado",
    description: "Cada escritório tem seu próprio workspace com dados completamente separados. Impossível acessar dados de outro cliente.",
  },
  {
    icon: Lock,
    title: "Row Level Security (RLS)",
    description: "Políticas de segurança no nível do banco de dados garantem que cada query só retorna dados do seu workspace.",
  },
  {
    icon: Shield,
    title: "Autenticação Segura",
    description: "Login via e-mail com verificação ou Google OAuth. Senhas nunca são armazenadas em texto plano.",
  },
  {
    icon: FileCheck,
    title: "Auditoria Completa",
    description: "Todas as ações são registradas com timestamp, usuário e detalhes. Compliance-ready.",
  },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Economia de Tempo",
    description: "Automatize cálculos repetitivos e reduza erros manuais em até 80%.",
  },
  {
    icon: TrendingUp,
    title: "Profissionalismo",
    description: "Apresente propostas e simulações com a identidade visual do seu escritório.",
  },
  {
    icon: Calendar,
    title: "Nunca Esqueça",
    description: "Alertas automáticos de vencimentos de CNDs, certificados e obrigações.",
  },
  {
    icon: PieChart,
    title: "Decisões Baseadas em Dados",
    description: "Relatórios e métricas para entender a operação do seu escritório.",
  },
  {
    icon: Bell,
    title: "Notificações Inteligentes",
    description: "Receba alertas sobre pendências e ações necessárias.",
  },
  {
    icon: Settings,
    title: "Totalmente Configurável",
    description: "Adapte regras, tabelas e parâmetros às necessidades do seu escritório.",
  },
];

function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`py-16 md:py-24 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

export default function ComoFunciona() {
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
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Section className="pt-32 md:pt-40">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20">
            Guia Completo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 mb-6 leading-tight tracking-tight">
            Como o Maxtabil transforma a operação do seu escritório
          </h1>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
            Um painel único com todas as ferramentas que seu escritório contábil precisa.
            Conheça cada módulo em detalhes e entenda como podemos ajudar.
          </p>
        </div>
      </Section>

      {/* Workflow */}
      <Section className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Do cadastro ao uso em 5 passos
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Processo simples e direto. Você estará usando em menos de 10 minutos.
          </p>
        </div>

        <div className="relative">
          {/* Linha conectora */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2" />
          
          <div className="grid md:grid-cols-5 gap-8">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-zinc-950 border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-400">
                  {step.step}
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Módulos Detalhados */}
      <Section id="modulos" className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Módulos em Detalhes
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Cada módulo foi pensado para resolver problemas reais do dia a dia de escritórios contábeis.
          </p>
        </div>

        <div className="space-y-8">
          {MODULES_DETAILED.map((module, index) => (
            <Card key={module.title} className="bg-zinc-900/70 backdrop-blur-sm border-zinc-800 overflow-hidden">
              <div className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                <div className="md:w-1/3 p-6 flex items-center justify-center bg-zinc-800/30">
                  <div className="w-24 h-24 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <module.icon className="h-12 w-12 text-blue-500" />
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-zinc-100">{module.title}</CardTitle>
                    <p className="text-zinc-400 mt-1">{module.description}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-2">
                      {module.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-zinc-300">
                          <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Segurança */}
      <Section className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Segurança de Nível Enterprise
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Seus dados e os dados dos seus clientes protegidos com as melhores práticas do mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {SECURITY_FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-zinc-900/70 backdrop-blur-sm border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100 mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-400">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Benefícios */}
      <Section className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Por que escolher o Maxtabil?
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Benefícios reais que impactam o dia a dia do seu escritório.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title} className="bg-zinc-900/70 backdrop-blur-sm border-zinc-800 hover:border-blue-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{benefit.title}</h3>
                <p className="text-sm text-zinc-400">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA Final */}
      <Section className="relative">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-zinc-400 mb-8">
            Assinatura de R$ 997,00 via cartão de crédito com renovação automática no Mercado Pago.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login?tab=signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Criar minha conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/#preco">
              <Button size="lg" variant="outline" className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800">
                Ver preço
              </Button>
            </Link>
          </div>
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
