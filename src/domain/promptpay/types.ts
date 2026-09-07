import type { ValidationIssue } from '../validation/result';

export const PROMPTPAY_IDENTIFIER_TYPES = ['mobile', 'national_id_tax_id'] as const;
export type PromptPayIdentifierType = (typeof PROMPTPAY_IDENTIFIER_TYPES)[number];

export const PROMPTPAY_AMOUNT_MODES = ['none', 'deposit', 'net_payable'] as const;
export type PromptPayAmountMode = (typeof PROMPTPAY_AMOUNT_MODES)[number];

export interface PromptPayConfig {
  enabled: boolean;
  identifierType: PromptPayIdentifierType;
  identifier: string;
  amountMode: PromptPayAmountMode;
}

export interface ResolvedPromptPay {
  payload: string;
  normalizedIdentifier: string;
  amount?: number;
}

export type PromptPayResolution =
  | { ok: true; value: ResolvedPromptPay; errors: [] }
  | { ok: false; errors: ValidationIssue[] };
