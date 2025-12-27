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
export type TipoRescisao = 
  | "SEM_JUSTA_CAUSA" 
  | "COM_JUSTA_CAUSA" 
  | "PEDIDO_DEMISSAO" 
  | "ACORDO_MUTUO";

export interface RescisaoInput {
  salarioBase: number;
  dataAdmissao: Date;
  dataDemissao: Date;
  tipoRescisao: TipoRescisao;
  saldoFerias: number;
  decimoTerceiroProporcional: boolean;
  avisoPrevioTrabalhado: boolean;
  fgtsDepositado: number;
}

// Férias
export interface FeriasInput {
  salarioBase: number;
  diasFerias: number;
  abonoPecuniario: boolean;
  dependentes: number;
  adicionaisPercent: number;
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
