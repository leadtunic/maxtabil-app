import type {
  ClientContractStatus,
  ClientPlan,
  CrmClient,
  CrmDeal,
  CrmLead,
  CrmMessage,
  DealStage,
  LeadSource,
  LeadStatus,
  LeadTier,
} from "@/types";

export const leadStatusConfig: Record<LeadStatus, { label: string; className: string }> = {
  NEW: { label: "Novo", className: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_QUALIFICATION: { label: "Qualificando", className: "bg-amber-100 text-amber-800 border-amber-200" },
  MQL: { label: "MQL", className: "bg-sky-100 text-sky-700 border-sky-200" },
  SQL: { label: "SQL", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DISQUALIFIED: { label: "Descartado", className: "bg-rose-100 text-rose-700 border-rose-200" },
  CLIENT: { label: "Cliente", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

export const leadTierLabel: Record<LeadTier, string> = {
  A: "Tier A",
  B: "Tier B",
  C: "Tier C",
  D: "Tier D",
};

export const leadSourceLabel: Record<LeadSource, string> = {
  META_ADS: "Meta Ads",
  ORGANIC: "Orgânico",
  REFERRAL: "Indicação",
  IMPORT: "Importado",
};

export const dealStageConfig: Record<DealStage, { label: string; className: string }> = {
  NEW: { label: "Novo", className: "bg-slate-100 text-slate-700 border-slate-200" },
  QUALIFYING: { label: "Qualificando", className: "bg-amber-100 text-amber-800 border-amber-200" },
  SCHEDULED: { label: "Agendado", className: "bg-sky-100 text-sky-700 border-sky-200" },
  PROPOSAL: { label: "Proposta", className: "bg-violet-100 text-violet-700 border-violet-200" },
  NEGOTIATION: { label: "Negociação", className: "bg-orange-100 text-orange-700 border-orange-200" },
  WON: { label: "Ganho", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  LOST: { label: "Perdido", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export const clientStatusLabel: Record<ClientContractStatus, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

export const clientPlanLabel: Record<ClientPlan, string> = {
  MEI: "MEI",
  SIMPLES: "Simples Nacional",
  PRESUMIDO: "Lucro Presumido",
  REAL: "Lucro Real",
  CUSTOM: "Personalizado",
};

export const crmLeads: CrmLead[] = [
  {
    id: "lead_001",
    name: "Ana Costa",
    companyName: "AC Moda LTDA",
    phoneE164: "+5511999990001",
    email: "ana@acmoda.com.br",
    city: "São Paulo",
    state: "SP",
    source: "META_ADS",
    status: "IN_QUALIFICATION",
    tier: "B",
    tags: ["Moda", "Simples"],
    score: 68,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-11-01T09:20:00"),
    lastContactAt: new Date("2024-11-04T16:10:00"),
    nextFollowUpAt: new Date("2024-11-06T11:00:00"),
  },
  {
    id: "lead_002",
    name: "Bruno Pereira",
    companyName: "BP Transportes",
    phoneE164: "+5511988880002",
    email: "bruno@bptransportes.com.br",
    city: "Campinas",
    state: "SP",
    source: "REFERRAL",
    status: "SQL",
    tier: "C",
    tags: ["Logística", "Presumido"],
    score: 84,
    owner: "Renato Alves",
    createdAt: new Date("2024-10-22T10:40:00"),
    lastContactAt: new Date("2024-11-03T13:05:00"),
    nextFollowUpAt: new Date("2024-11-07T09:00:00"),
  },
  {
    id: "lead_003",
    name: "Carla Menezes",
    companyName: "CM Studio",
    phoneE164: "+5511977770003",
    email: "carla@cmstudio.com.br",
    city: "Santos",
    state: "SP",
    source: "ORGANIC",
    status: "MQL",
    tier: "A",
    tags: ["Criativo", "MEI"],
    score: 52,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-10-29T14:15:00"),
    lastContactAt: new Date("2024-11-02T09:45:00"),
  },
  {
    id: "lead_004",
    name: "Diego França",
    companyName: "DF Agro",
    phoneE164: "+5511966660004",
    email: "diego@dfagro.com.br",
    city: "Ribeirão Preto",
    state: "SP",
    source: "META_ADS",
    status: "NEW",
    tags: ["Agro", "Inbound"],
    score: 41,
    createdAt: new Date("2024-11-04T08:50:00"),
    lastContactAt: new Date("2024-11-04T09:05:00"),
  },
  {
    id: "lead_005",
    name: "Elaine Ferreira",
    companyName: "EF Arquitetura",
    phoneE164: "+5511955550005",
    email: "elaine@efarquitetura.com.br",
    city: "Sorocaba",
    state: "SP",
    source: "META_ADS",
    status: "DISQUALIFIED",
    tags: ["Preço", "Sem urgência"],
    score: 22,
    owner: "Renato Alves",
    createdAt: new Date("2024-10-18T11:35:00"),
    lastContactAt: new Date("2024-10-20T15:10:00"),
  },
  {
    id: "lead_006",
    name: "Felipe Rocha",
    companyName: "FR Consultoria",
    phoneE164: "+5511944440006",
    email: "felipe@frconsultoria.com.br",
    city: "São Paulo",
    state: "SP",
    source: "ORGANIC",
    status: "CLIENT",
    tier: "B",
    tags: ["Serviços", "Simples"],
    score: 78,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-09-12T10:10:00"),
    lastContactAt: new Date("2024-11-01T17:40:00"),
  },
];

export const crmDeals: CrmDeal[] = [
  {
    id: "deal_001",
    leadId: "lead_004",
    stage: "NEW",
    valueCents: 980000,
    probability: 25,
    owner: "Equipe Inside Sales",
    createdAt: new Date("2024-11-04T10:20:00"),
  },
  {
    id: "deal_002",
    leadId: "lead_003",
    stage: "PROPOSAL",
    valueCents: 1450000,
    probability: 55,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-10-30T16:00:00"),
  },
  {
    id: "deal_003",
    leadId: "lead_002",
    stage: "NEGOTIATION",
    valueCents: 3200000,
    probability: 70,
    owner: "Renato Alves",
    createdAt: new Date("2024-10-25T13:10:00"),
  },
  {
    id: "deal_004",
    leadId: "lead_001",
    stage: "QUALIFYING",
    valueCents: 1100000,
    probability: 40,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-11-01T10:00:00"),
  },
  {
    id: "deal_005",
    leadId: "lead_006",
    stage: "WON",
    valueCents: 2500000,
    probability: 100,
    owner: "Fernanda Lima",
    createdAt: new Date("2024-09-30T15:00:00"),
  },
  {
    id: "deal_006",
    leadId: "lead_005",
    stage: "LOST",
    valueCents: 900000,
    probability: 0,
    owner: "Renato Alves",
    createdAt: new Date("2024-10-20T14:00:00"),
  },
];

export const crmClients: CrmClient[] = [
  {
    id: "client_001",
    leadId: "lead_006",
    name: "FR Consultoria",
    plan: "SIMPLES",
    contractStatus: "ACTIVE",
    monthlyFeeCents: 480000,
    startAt: new Date("2024-10-01T00:00:00"),
  },
  {
    id: "client_002",
    leadId: "lead_002",
    name: "BP Transportes",
    plan: "PRESUMIDO",
    contractStatus: "PAUSED",
    monthlyFeeCents: 720000,
    startAt: new Date("2024-06-15T00:00:00"),
  },
  {
    id: "client_003",
    leadId: "lead_001",
    name: "AC Moda LTDA",
    plan: "MEI",
    contractStatus: "ACTIVE",
    monthlyFeeCents: 320000,
    startAt: new Date("2024-11-05T00:00:00"),
  },
];

export const crmMessagesByLead: Record<string, CrmMessage[]> = {
  lead_001: [
    {
      id: "msg_001",
      direction: "IN",
      bodyText: "Oi! Vi o anúncio e quero saber como funciona a contabilidade pra e-commerce.",
      createdAt: new Date("2024-11-04T16:10:00"),
    },
    {
      id: "msg_002",
      direction: "OUT",
      bodyText:
        "Olá, Ana! Sou a assistente virtual da ESCOFER. Posso te fazer algumas perguntas rápidas para entender sua operação?",
      createdAt: new Date("2024-11-04T16:11:00"),
    },
    {
      id: "msg_003",
      direction: "IN",
      bodyText: "Claro, pode sim.",
      createdAt: new Date("2024-11-04T16:12:00"),
    },
    {
      id: "msg_004",
      direction: "OUT",
      bodyText: "Qual é o regime tributário atual da sua empresa? MEI, Simples ou outro?",
      createdAt: new Date("2024-11-04T16:13:00"),
    },
    {
      id: "msg_005",
      direction: "IN",
      bodyText: "Estamos no Simples Nacional.",
      createdAt: new Date("2024-11-04T16:14:00"),
    },
    {
      id: "msg_006",
      direction: "OUT",
      bodyText:
        "Perfeito! E qual a faixa de faturamento mensal? Isso ajuda a definir o melhor plano.",
      createdAt: new Date("2024-11-04T16:15:00"),
    },
  ],
  lead_002: [
    {
      id: "msg_007",
      direction: "IN",
      bodyText: "Oi, fui indicado pelo Carlos e gostaria de uma proposta.",
      createdAt: new Date("2024-11-03T13:05:00"),
    },
    {
      id: "msg_008",
      direction: "OUT",
      bodyText:
        "Olá, Bruno! Sou a assistente virtual da ESCOFER. Vamos alinhar alguns detalhes para preparar a proposta?",
      createdAt: new Date("2024-11-03T13:06:00"),
    },
  ],
};

export const crmLeadQualification: Record<string, Record<string, string>> = {
  lead_001: {
    Regime: "Simples Nacional",
    Faturamento: "R$ 80 mil/mês",
    Funcionários: "8",
    Notas: "Médio",
    Dor: "Conciliação de marketplace",
  },
  lead_002: {
    Regime: "Lucro Presumido",
    Faturamento: "R$ 320 mil/mês",
    Funcionários: "22",
    Notas: "Alto",
    Dor: "Gestão fiscal de filiais",
  },
  lead_003: {
    Regime: "MEI",
    Faturamento: "R$ 18 mil/mês",
    Funcionários: "2",
    Notas: "Baixo",
    Dor: "Guia e obrigações mensais",
  },
};

export const crmClientBi: Record<
  string,
  {
    updatedAt: Date;
    kpis: { label: string; value: string; helper: string }[];
    history: { month: string; conversions: number; responseMinutes: number; backlog: number }[];
    recommendations: string[];
  }
> = {
  client_001: {
    updatedAt: new Date("2024-11-04T09:30:00"),
    kpis: [
      { label: "Tempo médio de resposta", value: "12 min", helper: "Meta: < 15 min" },
      { label: "Conversão MQL → SQL", value: "28%", helper: "+4% vs mês anterior" },
      { label: "Pendências abertas", value: "3", helper: "2 em fiscal, 1 em DP" },
      { label: "Satisfação do cliente", value: "4,7/5", helper: "Últimos 30 dias" },
    ],
    history: [
      { month: "Jul", conversions: 18, responseMinutes: 22, backlog: 6 },
      { month: "Ago", conversions: 21, responseMinutes: 18, backlog: 5 },
      { month: "Set", conversions: 24, responseMinutes: 16, backlog: 4 },
      { month: "Out", conversions: 28, responseMinutes: 12, backlog: 3 },
    ],
    recommendations: [
      "Automatizar follow-up em leads MQL que ficaram 48h sem retorno.",
      "Revisar rotina de conciliação de marketplace para reduzir retrabalho.",
      "Priorizar atendimento de notas fiscais com prazo na próxima semana.",
    ],
  },
  client_002: {
    updatedAt: new Date("2024-10-28T15:10:00"),
    kpis: [
      { label: "Tempo médio de resposta", value: "24 min", helper: "Meta: < 20 min" },
      { label: "Conversão MQL → SQL", value: "19%", helper: "-3% vs mês anterior" },
      { label: "Pendências abertas", value: "6", helper: "Fiscal e folha" },
      { label: "Satisfação do cliente", value: "4,2/5", helper: "Últimos 30 dias" },
    ],
    history: [
      { month: "Jul", conversions: 15, responseMinutes: 28, backlog: 7 },
      { month: "Ago", conversions: 17, responseMinutes: 26, backlog: 6 },
      { month: "Set", conversions: 16, responseMinutes: 25, backlog: 6 },
      { month: "Out", conversions: 19, responseMinutes: 24, backlog: 6 },
    ],
    recommendations: [
      "Alinhar agenda de reuniões mensais com o cliente para reduzir pendências.",
      "Criar checklist fixo para filiais com maior volume de notas fiscais.",
    ],
  },
};
