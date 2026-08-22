import { describe, expect, it } from 'vitest';
import { calculateDocument } from '../../src/domain/calculation/calculate';
import { makeDocument } from './helpers';

function expectCalculated(document = makeDocument()) {
  const result = calculateDocument(document);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.value;
}

describe('calculation pipeline', () => {
  it('calculates line and document discounts in order', () => {
    const document = makeDocument();
    document.items[0].discount = { mode: 'percent', value: 10 };
    document.adjustments.documentDiscount = { mode: 'fixed', value: 30 };

    const totals = expectCalculated(document);

    expect(totals.lines[0]).toMatchObject({ baseAmount: 200, discountAmount: 20, totalAmount: 180 });
    expect(totals.subtotal).toBe(180);
    expect(totals.documentDiscountAmount).toBe(30);
    expect(totals.amountAfterDiscount).toBe(150);
    expect(totals.netPayable).toBe(150);
  });

  it('calculates VAT only for an enabled VAT-registered profile', () => {
    const document = makeDocument();
    document.business.vatStatus = 'registered';
    document.adjustments.vat.enabled = true;
    document.adjustments.documentDiscount = { mode: 'fixed', value: 50 };

    const totals = expectCalculated(document);

    expect(totals.amountAfterDiscount).toBe(150);
    expect(totals.vatRatePercent).toBe(7);
    expect(totals.vatAmount).toBe(10.5);
    expect(totals.netPayable).toBe(160.5);
  });

  it('uses only explicit WHT basis line items', () => {
    const document = makeDocument();
    document.items.push({
      id: 'line-2',
      description: 'Second service',
      quantity: 1,
      unitPrice: 100,
      discount: { mode: 'none' },
    });
    document.adjustments.wht = { enabled: true, ratePercent: 3, basisLineItemIds: ['line-2'] };

    const totals = expectCalculated(document);

    expect(totals.subtotal).toBe(300);
    expect(totals.whtBasisAmount).toBe(100);
    expect(totals.whtAmount).toBe(3);
    expect(totals.netPayable).toBe(297);
  });

  it('applies document discount proportionally to the explicit WHT basis', () => {
    const document = makeDocument();
    document.items.push({
      id: 'line-2',
      description: 'Second service',
      quantity: 1,
      unitPrice: 200,
      discount: { mode: 'none' },
    });
    document.adjustments.documentDiscount = { mode: 'fixed', value: 100 };
    document.adjustments.wht = { enabled: true, ratePercent: 3, basisLineItemIds: ['line-1'] };

    const totals = expectCalculated(document);

    expect(totals.subtotal).toBe(400);
    expect(totals.amountAfterDiscount).toBe(300);
    expect(totals.whtBasisAmount).toBe(150);
    expect(totals.whtAmount).toBe(4.5);
    expect(totals.netPayable).toBe(295.5);
  });

  it('allows enabled WHT with a zero explicit basis', () => {
    const document = makeDocument();
    document.adjustments.wht = { enabled: true, ratePercent: 3, basisLineItemIds: [] };

    const totals = expectCalculated(document);

    expect(totals.whtBasisAmount).toBe(0);
    expect(totals.whtAmount).toBe(0);
    expect(totals.netPayable).toBe(200);
  });

  it.each([
    [{ mode: 'percent', value: 25 } as const, 50],
    [{ mode: 'fixed', value: 40 } as const, 40],
    [{ mode: 'none' } as const, 0],
  ])('calculates deposit mode %#', (deposit, expected) => {
    const document = makeDocument();
    document.adjustments.deposit = deposit;

    expect(expectCalculated(document).depositAmount).toBe(expected);
  });

  it('handles discounts, VAT, WHT, and deposit together', () => {
    const document = makeDocument();
    document.items[0].discount = { mode: 'percent', value: 10 };
    document.items.push({
      id: 'line-2',
      description: 'Material',
      quantity: 1,
      unitPrice: 100,
      discount: { mode: 'none' },
    });
    document.business.vatStatus = 'registered';
    document.adjustments.documentDiscount = { mode: 'percent', value: 10 };
    document.adjustments.vat.enabled = true;
    document.adjustments.wht = { enabled: true, ratePercent: 3, basisLineItemIds: ['line-1'] };
    document.adjustments.deposit = { mode: 'percent', value: 25 };

    const totals = expectCalculated(document);

    expect(totals.subtotal).toBe(280);
    expect(totals.documentDiscountAmount).toBe(28);
    expect(totals.amountAfterDiscount).toBe(252);
    expect(totals.vatAmount).toBe(17.64);
    expect(totals.whtBasisAmount).toBe(162);
    expect(totals.whtAmount).toBe(4.86);
    expect(totals.netPayable).toBe(264.78);
    expect(totals.depositAmount).toBe(66.2);
  });

  it('does not mutate the input document', () => {
    const document = makeDocument();
    const before = structuredClone(document);

    calculateDocument(document);

    expect(document).toEqual(before);
  });
});

describe('calculation validation', () => {
  it('rejects line discount greater than line base', () => {
    const document = makeDocument();
    document.items[0].discount = { mode: 'fixed', value: 201 };

    const result = calculateDocument(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('line_discount_exceeds_base');
  });

  it('rejects document discount greater than subtotal', () => {
    const document = makeDocument();
    document.adjustments.documentDiscount = { mode: 'fixed', value: 201 };

    const result = calculateDocument(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('document_discount_exceeds_subtotal');
  });

  it('rejects VAT charging by a non-registered profile', () => {
    const document = makeDocument();
    document.adjustments.vat.enabled = true;

    const result = calculateDocument(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('vat_charge_not_allowed');
  });

  it('rejects unknown or duplicate WHT basis items', () => {
    const document = makeDocument();
    document.adjustments.wht = {
      enabled: true,
      ratePercent: 3,
      basisLineItemIds: ['line-1', 'line-1', 'missing'],
    };

    const result = calculateDocument(document);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const codes = result.errors.map((error) => error.code);
      expect(codes).toContain('duplicate_wht_basis_item');
      expect(codes).toContain('unknown_wht_basis_item');
    }
  });

  it('rejects invalid WHT rate and oversized fixed deposit', () => {
    const invalidRate = makeDocument();
    invalidRate.adjustments.wht.enabled = true;
    invalidRate.adjustments.wht.ratePercent = Number.NaN;
    expect(calculateDocument(invalidRate).ok).toBe(false);

    const oversizedDeposit = makeDocument();
    oversizedDeposit.adjustments.deposit = { mode: 'fixed', value: 201 };
    const result = calculateDocument(oversizedDeposit);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('deposit_exceeds_net_payable');
  });
});

describe('disabled adjustment isolation', () => {
  it('ignores stale WHT basis and rate while WHT is disabled', () => {
    const document = makeDocument();
    document.adjustments.wht = {
      enabled: false,
      ratePercent: Number.NaN,
      basisLineItemIds: ['missing-line'],
    };

    const result = calculateDocument(document);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.whtAmount).toBe(0);
      expect(result.value.netPayable).toBe(200);
    }
  });
});
