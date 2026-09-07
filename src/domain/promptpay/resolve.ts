import type { CalculationTotals } from '../calculation/types';
import { issue } from '../validation/result';
import { buildPromptPayPayload, formatPromptPayAmount, normalizePromptPayIdentifier } from './payload';
import type { PromptPayConfig, PromptPayResolution } from './types';

function resolveAmount(config: PromptPayConfig, totals: CalculationTotals): number | undefined {
  if (config.amountMode === 'none') return undefined;
  return config.amountMode === 'deposit' ? totals.depositAmount : totals.netPayable;
}

export function resolvePromptPay(
  config: PromptPayConfig,
  totals: CalculationTotals,
): PromptPayResolution {
  const normalizedIdentifier = normalizePromptPayIdentifier(config.identifierType, config.identifier);
  if (!normalizedIdentifier) {
    return {
      ok: false,
      errors: [issue('invalid_promptpay_identifier', 'payment.promptPay.identifier', 'PromptPay identifier is invalid for the selected type.')],
    };
  }

  const amount = resolveAmount(config, totals);
  if (amount !== undefined && !formatPromptPayAmount(amount)) {
    return {
      ok: false,
      errors: [issue('invalid_promptpay_amount', 'payment.promptPay.amountMode', 'PromptPay amount must be finite, greater than zero, and fit the Thai QR amount field.')],
    };
  }

  return {
    ok: true,
    value: {
      payload: buildPromptPayPayload(config.identifierType, normalizedIdentifier, amount),
      normalizedIdentifier,
      amount,
    },
    errors: [],
  };
}
