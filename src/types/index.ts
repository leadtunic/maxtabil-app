// User & Auth Types
export type RoleKey =
  | "ADMIN"
  | "FINANCEIRO"
  | "DP"
  | "FISCAL_CONTABIL"
  | "LEGALIZACAO_CERT";

export interface Profile {
  user_id: string;
  email: string;
  display_name: string;
  role: RoleKey;
  is_active: boolean;
  must_change_password: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  isActive: boolean;
  mustChangePassword: boolean;
}

// Links
export type LinkSector =
  | "GERAL"
  | "FINANCEIRO"
  | "DP"
  | "FISCAL_CONTABIL"
  | "LEGALIZACAO"
  | "CERTIFICADO_DIGITAL"
  | "ADMIN";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  sector: LinkSector;
  is_active: boolean;
  sort_order: number;
  clicks?: number; // Optional until migration is applied
  updated_at?: string;
}

// RuleSets
export interface RuleSet {
  id: string;
  simulator_key: RuleSetKey;
  name: string;
  version: number;
  is_active: boolean;
  payload: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type RuleSetKey =
  | "HONORARIOS"
  | "RESCISAO"
  | "FERIAS"
  | "FATOR_R"
  | "SIMPLES_DAS";

// Simulations
export interface BreakdownItem {
  label: string;
  base: number;
  formulaText: string;
  amount: number;
  sign: "+" | "-";
}

export interface Simulation {
  id: string;
  type: RuleSetKey;
  inputs: Record<string, unknown>;
  outputs: { total: number };
  breakdown: BreakdownItem[];
  rulesetId: string;
  createdBy: string;
  createdAt: string;
}

// Honorários
export type RegimeTributario = "SIMPLES" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";

export type SegmentoEmpresa = "COMERCIO" | "PRESTADOR" | "INDUSTRIA";

export interface HonorariosInput {
  faturamento: number;
  regime: RegimeTributario;
  segmento: SegmentoEmpresa;
  numFuncionarios: number;
  sistemaFinanceiro: boolean;
  pontoEletronico: boolean;
}

// Rescisão
export interface RescisaoInput {
  salarioBase: number;
  incluirFerias: boolean;
  incluirDecimoTerceiro: boolean;
  faltasMes: number;
  anosServico: number;
  tipoRescisao: "SEM_JUSTA_CAUSA" | "ACORDO";
}

// Férias
export interface FeriasInput {
  salarioBase: number;
}

// Audit
export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Invite
export interface Invite {
  token: string;
  email: string;
  rolePreset: RoleKey;
  expiresAt: string;
  acceptedAt?: string;
}

// Legalizacao
export type LegalDocType = "CND" | "BOMBEIRO_AVCB" | "SANITARIA" | "ALVARA";

export interface LegalDoc {
  id: string;
  client_name: string;
  cnpj?: string | null;
  doc_type: LegalDocType;
  issue_date?: string | null;
  expiry_date: string;
  notes?: string | null;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Certificado Digital
export interface DigitalCert {
  id: string;
  client_name: string;
  cnpj?: string | null;
  cert_type: string;
  provider?: string | null;
  expiry_date: string;
  notes?: string | null;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
}

// CRM
export type LeadSource = "META_ADS" | "ORGANIC" | "REFERRAL" | "IMPORT";
export type LeadStatus = "NEW" | "IN_QUALIFICATION" | "MQL" | "SQL" | "DISQUALIFIED" | "CLIENT";
export type LeadTier = "A" | "B" | "C" | "D";

export interface CrmLead {
  id: string;
  name: string;
  companyName?: string;
  phoneE164: string;
  email?: string;
  city?: string;
  state?: string;
  source: LeadSource;
  status: LeadStatus;
  tier?: LeadTier;
  tags: string[];
  score: number;
  owner?: string;
  createdAt: Date;
  lastContactAt: Date;
  nextFollowUpAt?: Date;
}

export type ConversationStatus = "OPEN" | "WAITING_USER" | "WAITING_AGENT" | "HANDOFF" | "CLOSED";
export type MessageDirection = "IN" | "OUT";

export interface CrmMessage {
  id: string;
  direction: MessageDirection;
  bodyText: string;
  createdAt: Date;
}

export interface CrmConversation {
  id: string;
  leadId: string;
  status: ConversationStatus;
  messages: CrmMessage[];
}

export type DealStage =
  | "NEW"
  | "QUALIFYING"
  | "SCHEDULED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface CrmDeal {
  id: string;
  leadId: string;
  stage: DealStage;
  valueCents?: number;
  probability: number;
  owner?: string;
  createdAt: Date;
}

export type ClientContractStatus = "ACTIVE" | "PAUSED" | "CANCELLED";
export type ClientPlan = "MEI" | "SIMPLES" | "PRESUMIDO" | "REAL" | "CUSTOM";

export interface CrmClient {
  id: string;
  leadId: string;
  name: string;
  plan: ClientPlan;
  contractStatus: ClientContractStatus;
  monthlyFeeCents?: number;
  startAt: Date;
}
