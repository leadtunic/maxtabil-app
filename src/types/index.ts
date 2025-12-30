// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  lastLoginAt?: Date;
  roles: Role[];
}

export interface Role {
  id: string;
  key: RoleKey;
  name: string;
}

export type RoleKey = 
  | "ADMIN" 
  | "FISCAL_CONTABIL" 
  | "FINANCEIRO" 
  | "LEGALIZACAO" 
  | "CERT_DIG" 
  | "DP";

export type PermissionKey =
  | "MANAGE_USERS"
  | "MANAGE_LINKS"
  | "VIEW_FIN_SIM"
  | "RUN_FIN_SIM"
  | "VIEW_DP_SIM"
  | "RUN_DP_SIM"
  | "MANAGE_RULESETS"
  | "VIEW_AUDIT";

// Links
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  order: number;
  isActive: boolean;
}

// RuleSets
export interface RuleSet {
  id: string;
  type: RuleSetType;
  version: number;
  isActive: boolean;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

export type RuleSetType = "HONORARIOS" | "RESCISAO" | "FERIAS";

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
  type: RuleSetType;
  inputs: Record<string, unknown>;
  outputs: { total: number };
  breakdown: BreakdownItem[];
  rulesetId: string;
  createdBy: string;
  createdAt: Date;
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
}

// Férias
export interface FeriasInput {
  salarioBase: number;
}

// Audit
export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// Invite
export interface Invite {
  token: string;
  email: string;
  rolePreset: RoleKey;
  expiresAt: Date;
  acceptedAt?: Date;
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
