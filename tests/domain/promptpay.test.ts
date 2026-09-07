import { describe, expect, it } from 'vitest';
import { buildPromptPayPayload, normalizePromptPayIdentifier } from '../../src/domain/promptpay/payload';
import { resolvePromptPay } from '../../src/domain/promptpay/resolve';
import type { CalculationTotals } from '../../src/domain/calculation/types';

const TOTALS: CalculationTotals = {
  lines: [],
  subtotal: 1000,
  documentDiscountAmount: 0,
  amountAfterDiscount: 1000,
  vatRatePercent: 0,
  vatAmount: 0,
  whtBasisAmount: 0,
  whtRatePercent: 0,
  whtAmount: 0,
  netPayable: 1000,
  depositAmount: 500,
};

describe('Phase 5 â€” PromptPay domain', () => {
  it('matches a known static mobile PromptPay payload + CRC vector', () => {
    const payload = buildPromptPayPayload('mobile', '0812345678');
    expect(payload).toBe('00020101021129370016A0000006770101110113006681234567853037645802TH6304823E');
  });
  it('matches a known dynamic mobile payload and CRC vector', () => {
    const payload = buildPromptPayPayload('mobile', '0812345678', 100);
    expect(payload).toBe('00020101021229370016A0000006770101110113006681234567853037645406100.005802TH6304F142');
  });

  it('normalizes supported identifier formats', () => {
    expect(normalizePromptPayIdentifier('mobile', '081-234-5678')).toBe('0812345678');
    expect(normalizePromptPayIdentifier('mobile', '+66812345678')).toBe('0812345678');
    expect(normalizePromptPayIdentifier('national_id_tax_id', '1-1017-00230-70-8')).toBe('1101700230708');
  });

  it('rejects malformed identifiers', () => {
    expect(normalizePromptPayIdentifier('mobile', '021234567')).toBeNull();
    expect(normalizePromptPayIdentifier('national_id_tax_id', '123456789012')).toBeNull();
  });
  it('resolves every amount mode', () => {
    const base = { enabled: true, identifierType: 'mobile' as const, identifier: '0812345678' };
    const none = resolvePromptPay({ ...base, amountMode: 'none' }, TOTALS);
    const deposit = resolvePromptPay({ ...base, amountMode: 'deposit' }, TOTALS);
    const net = resolvePromptPay({ ...base, amountMode: 'net_payable' }, TOTALS);

    expect(none.ok && none.value.amount).toBeUndefined();
    expect(deposit.ok && deposit.value.amount).toBe(500);
    expect(net.ok && net.value.amount).toBe(1000);
  });

  it('fails closed when a selected amount resolves to zero', () => {
    const result = resolvePromptPay(
      { enabled: true, identifierType: 'mobile', identifier: '0812345678', amountMode: 'deposit' },
      { ...TOTALS, depositAmount: 0 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.code).toBe('invalid_promptpay_amount');
  });

  it('fails closed before scientific notation can enter the EMV amount field', () => {
    const result = resolvePromptPay(
      { enabled: true, identifierType: 'mobile', identifier: '0812345678', amountMode: 'net_payable' },
      { ...TOTALS, netPayable: 1e21 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.code).toBe('invalid_promptpay_amount');
    expect(() => buildPromptPayPayload('mobile', '0812345678', 1e21)).toThrow(RangeError);
  });

  it('fails closed when a positive source amount rounds to 0.00', () => {
    const result = resolvePromptPay(
      { enabled: true, identifierType: 'mobile', identifier: '0812345678', amountMode: 'deposit' },
      { ...TOTALS, depositAmount: 0.004 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.code).toBe('invalid_promptpay_amount');
  });
});
