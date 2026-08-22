import type { DiscountConfig, DocCraftDocument } from '../document/types';
import { validateDocumentSchema } from '../document/schema';
import { VAT_RATE_PERCENT } from '../tax/types';
import { validateTaxInvoiceEligibility, validateVatChargeEligibility } from '../tax/validation';
import { invalid, issue, valid, type ValidationIssue } from '../validation/result';
import { roundMoney, sumMoney } from './rounding';
import type { CalculatedLine, CalculationResult } from './types';

function calculateDiscountAmount(baseAmount: number, discount: DiscountConfig): number {
  if (discount.mode === 'none') return 0;
  if (discount.mode === 'fixed') return roundMoney(discount.value);
  return roundMoney((baseAmount * discount.value) / 100);
}

function collectDomainErrors(document: DocCraftDocument): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const schema = validateDocumentSchema(document);
  const vat = validateVatChargeEligibility(document);
  const taxInvoice = validateTaxInvoiceEligibility(document);

  if (!schema.ok) errors.push(...schema.errors);
  if (!vat.ok) errors.push(...vat.errors);
  if (!taxInvoice.ok) errors.push(...taxInvoice.errors);

  return errors;
}

function validateAdjustmentConfigs(document: DocCraftDocument): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const { wht, deposit } = document.adjustments;

  if (wht.enabled) {
    if (!Number.isFinite(wht.ratePercent) || wht.ratePercent < 0 || wht.ratePercent > 100) {
      errors.push(issue('invalid_wht_rate', 'adjustments.wht.ratePercent', 'WHT rate must be finite and between 0 and 100.'));
    }

    const knownIds = new Set(document.items.map((item) => item.id));
    const seenBasisIds = new Set<string>();
    wht.basisLineItemIds.forEach((id, index) => {
      if (!knownIds.has(id)) {
        errors.push(issue('unknown_wht_basis_item', `adjustments.wht.basisLineItemIds.${index}`, 'WHT basis item must reference an existing line item.'));
      }
      if (seenBasisIds.has(id)) {
        errors.push(issue('duplicate_wht_basis_item', `adjustments.wht.basisLineItemIds.${index}`, 'WHT basis item ids must be unique.'));
      }
      seenBasisIds.add(id);
    });
  }

  if (deposit.mode !== 'none') {
    if (!Number.isFinite(deposit.value) || deposit.value < 0) {
      errors.push(issue('invalid_deposit', 'adjustments.deposit.value', 'Deposit must be finite and non-negative.'));
    } else if (deposit.mode === 'percent' && deposit.value > 100) {
      errors.push(issue('deposit_percent_out_of_range', 'adjustments.deposit.value', 'Deposit percent cannot exceed 100.'));
    }
  }

  return errors;
}

export function calculateDocument(document: DocCraftDocument): CalculationResult {
  const errors = [...collectDomainErrors(document), ...validateAdjustmentConfigs(document)];
  if (errors.length > 0) return invalid(errors);

  const lines: CalculatedLine[] = document.items.map((item, index) => {
    const baseAmount = roundMoney(item.quantity * item.unitPrice);
    const discountAmount = calculateDiscountAmount(baseAmount, item.discount);

    if (discountAmount > baseAmount) {
      errors.push(issue('line_discount_exceeds_base', `items.${index}.discount`, 'Line discount cannot exceed the line base amount.'));
    }

    return {
      id: item.id,
      baseAmount,
      discountAmount,
      totalAmount: roundMoney(baseAmount - discountAmount),
    };
  });

  if (errors.length > 0) return invalid(errors);

  const subtotal = sumMoney(lines.map((line) => line.totalAmount));
  const documentDiscountAmount = calculateDiscountAmount(
    subtotal,
    document.adjustments.documentDiscount,
  );

  if (documentDiscountAmount > subtotal) {
    return invalid([issue('document_discount_exceeds_subtotal', 'adjustments.documentDiscount', 'Document discount cannot exceed subtotal.')]);
  }

  const amountAfterDiscount = roundMoney(subtotal - documentDiscountAmount);
  const vatAmount = document.adjustments.vat.enabled
    ? roundMoney((amountAfterDiscount * VAT_RATE_PERCENT) / 100)
    : 0;

  const whtBasisIds = document.adjustments.wht.enabled
    ? new Set(document.adjustments.wht.basisLineItemIds)
    : new Set<string>();
  const whtBasisAmount = sumMoney(
    lines.filter((line) => whtBasisIds.has(line.id)).map((line) => line.totalAmount),
  );
  const whtRatePercent = document.adjustments.wht.enabled
    ? document.adjustments.wht.ratePercent
    : 0;
  const whtAmount = document.adjustments.wht.enabled
    ? roundMoney((whtBasisAmount * whtRatePercent) / 100)
    : 0;

  const payableBeforeWht = roundMoney(amountAfterDiscount + vatAmount);
  if (whtAmount > payableBeforeWht) {
    return invalid([issue('wht_exceeds_payable', 'adjustments.wht', 'WHT cannot exceed the payable amount before WHT.')]);
  }

  const netPayable = roundMoney(payableBeforeWht - whtAmount);
  const deposit = document.adjustments.deposit;
  const depositAmount = deposit.mode === 'none'
    ? 0
    : deposit.mode === 'fixed'
      ? roundMoney(deposit.value)
      : roundMoney((netPayable * deposit.value) / 100);

  if (depositAmount > netPayable) {
    return invalid([issue('deposit_exceeds_net_payable', 'adjustments.deposit', 'Deposit cannot exceed net payable.')]);
  }

  return valid({
    lines,
    subtotal,
    documentDiscountAmount,
    amountAfterDiscount,
    vatRatePercent: document.adjustments.vat.enabled ? VAT_RATE_PERCENT : 0,
    vatAmount,
    whtBasisAmount,
    whtRatePercent,
    whtAmount,
    netPayable,
    depositAmount,
  });
}

