import { z } from "zod";
import type { RuleSetKey } from "@/types";

const honorariosSchema = z.object({
  baseMin: z.number().nonnegative(),
  regimePercentual: z.object({
    SIMPLES: z.number().nonnegative(),
    LUCRO_PRESUMIDO: z.number().nonnegative(),
    LUCRO_REAL: z.number().nonnegative(),
  }),
  fatorSegmento: z.object({
    COMERCIO: z.number().nonnegative(),
    PRESTADOR: z.number().nonnegative(),
    INDUSTRIA: z.number().nonnegative(),
  }),
  adicFuncionario: z.number().nonnegative(),
  descontoSistemaFinanceiro: z.number().min(0).max(1),
  descontoPontoEletronico: z.number().min(0).max(1),
});

const rescisaoSchema = z.object({
  multaFgts: z.number().min(0).max(1),
  multaAcordo: z.number().min(0).max(1),
  diasAvisoPrevioBase: z.number().nonnegative(),
  diasAvisoPrevioPorAno: z.number().nonnegative(),
});

const feriasSchema = z.object({
  tercoConstitucional: z.boolean(),
  limiteDiasAbono: z.number().nonnegative(),
});

const fatorRSchema = z.object({
  threshold: z.number().min(0).max(1),
  annex_if_ge: z.string(),
  annex_if_lt: z.string(),
});

const simplesBandSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  aliquota_nominal: z.number().nonnegative(),
  deducao: z.number().nonnegative(),
});

const simplesDasSchema = z.object({
  tables: z.object({
    I: z.array(simplesBandSchema),
    II: z.array(simplesBandSchema),
    III: z.array(simplesBandSchema),
    IV: z.array(simplesBandSchema),
    V: z.array(simplesBandSchema),
  }),
});

export const ruleSetSchemas: Record<RuleSetKey, z.ZodSchema> = {
  HONORARIOS: honorariosSchema,
  RESCISAO: rescisaoSchema,
  FERIAS: feriasSchema,
  FATOR_R: fatorRSchema,
  SIMPLES_DAS: simplesDasSchema,
};

export const defaultRuleSetPayloads: Record<RuleSetKey, Record<string, unknown>> = {
  HONORARIOS: {
    baseMin: 450,
    regimePercentual: {
      SIMPLES: 0.012,
      LUCRO_PRESUMIDO: 0.016,
      LUCRO_REAL: 0.021,
    },
    fatorSegmento: {
      COMERCIO: 1.0,
      PRESTADOR: 1.1,
      INDUSTRIA: 1.2,
    },
    adicFuncionario: 40,
    descontoSistemaFinanceiro: 0.05,
    descontoPontoEletronico: 0.05,
  },
  RESCISAO: {
    multaFgts: 0.4,
    multaAcordo: 0.2,
    diasAvisoPrevioBase: 30,
    diasAvisoPrevioPorAno: 3,
  },
  FERIAS: {
    tercoConstitucional: true,
    limiteDiasAbono: 10,
  },
  FATOR_R: {
    threshold: 0.28,
    annex_if_ge: "III",
    annex_if_lt: "V",
  },
  SIMPLES_DAS: {
    tables: {
      I: [
        { min: 0, max: 180000, aliquota_nominal: 0.04, deducao: 0 },
        { min: 180000.01, max: 360000, aliquota_nominal: 0.073, deducao: 5940 },
        { min: 360000.01, max: 720000, aliquota_nominal: 0.095, deducao: 13860 },
        { min: 720000.01, max: 1800000, aliquota_nominal: 0.107, deducao: 22500 },
        { min: 1800000.01, max: 3600000, aliquota_nominal: 0.143, deducao: 87300 },
        { min: 3600000.01, max: 4800000, aliquota_nominal: 0.19, deducao: 378000 },
      ],
      II: [
        { min: 0, max: 180000, aliquota_nominal: 0.045, deducao: 0 },
        { min: 180000.01, max: 360000, aliquota_nominal: 0.078, deducao: 5940 },
        { min: 360000.01, max: 720000, aliquota_nominal: 0.1, deducao: 13860 },
        { min: 720000.01, max: 1800000, aliquota_nominal: 0.112, deducao: 22500 },
        { min: 1800000.01, max: 3600000, aliquota_nominal: 0.147, deducao: 85500 },
        { min: 3600000.01, max: 4800000, aliquota_nominal: 0.3, deducao: 720000 },
      ],
      III: [
        { min: 0, max: 180000, aliquota_nominal: 0.06, deducao: 0 },
        { min: 180000.01, max: 360000, aliquota_nominal: 0.112, deducao: 9360 },
        { min: 360000.01, max: 720000, aliquota_nominal: 0.135, deducao: 17640 },
        { min: 720000.01, max: 1800000, aliquota_nominal: 0.16, deducao: 35640 },
        { min: 1800000.01, max: 3600000, aliquota_nominal: 0.21, deducao: 125640 },
        { min: 3600000.01, max: 4800000, aliquota_nominal: 0.33, deducao: 648000 },
      ],
      IV: [
        { min: 0, max: 180000, aliquota_nominal: 0.045, deducao: 0 },
        { min: 180000.01, max: 360000, aliquota_nominal: 0.09, deducao: 8100 },
        { min: 360000.01, max: 720000, aliquota_nominal: 0.102, deducao: 12420 },
        { min: 720000.01, max: 1800000, aliquota_nominal: 0.14, deducao: 39780 },
        { min: 1800000.01, max: 3600000, aliquota_nominal: 0.22, deducao: 183780 },
        { min: 3600000.01, max: 4800000, aliquota_nominal: 0.33, deducao: 828000 },
      ],
      V: [
        { min: 0, max: 180000, aliquota_nominal: 0.155, deducao: 0 },
        { min: 180000.01, max: 360000, aliquota_nominal: 0.18, deducao: 4500 },
        { min: 360000.01, max: 720000, aliquota_nominal: 0.195, deducao: 9900 },
        { min: 720000.01, max: 1800000, aliquota_nominal: 0.205, deducao: 17100 },
        { min: 1800000.01, max: 3600000, aliquota_nominal: 0.23, deducao: 62100 },
        { min: 3600000.01, max: 4800000, aliquota_nominal: 0.305, deducao: 540000 },
      ],
    },
  },
};

export function getDefaultPayload(key: RuleSetKey) {
  return defaultRuleSetPayloads[key];
}

export function validateRuleSetPayload(key: RuleSetKey, payload: unknown) {
  return ruleSetSchemas[key].safeParse(payload);
}
