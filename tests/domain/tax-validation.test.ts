import { describe, expect, it } from 'vitest';
import { validateTaxInvoiceEligibility, validateVatChargeEligibility } from '../../src/domain/tax/validation';
import type { EntityType, VatStatus } from '../../src/domain/tax/types';
import { makeDocument } from './helpers';

const profileMatrix: Array<[EntityType, VatStatus, boolean]> = [
  ['individual', 'not_registered', false],
  ['individual', 'registered', true],
  ['juristic_person', 'not_registered', false],
  ['juristic_person', 'registered', true],
];

describe('VAT state independence', () => {
  it.each(profileMatrix)('%s + %s has VAT charge eligibility = %s', (entityType, vatStatus, allowed) => {
    const document = makeDocument();
    document.business.entityType = entityType;
    document.business.vatStatus = vatStatus;
    document.adjustments.vat.enabled = true;

    expect(validateVatChargeEligibility(document).ok).toBe(allowed);
  });
});

describe('tax invoice eligibility', () => {
  it.each(['individual', 'juristic_person'] as const)('allows VAT-registered %s with required fields', (entityType) => {
    const document = makeDocument();
    document.documentType = 'tax_invoice';
    document.business.entityType = entityType;
    document.business.vatStatus = 'registered';
    document.adjustments.vat.enabled = true;

    expect(validateTaxInvoiceEligibility(document).ok).toBe(true);
  });

  it('locks tax invoice for a non-registered business', () => {
    const document = makeDocument();
    document.documentType = 'tax_invoice';
    document.adjustments.vat.enabled = true;

    const result = validateTaxInvoiceEligibility(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain('tax_invoice_requires_vat_registration');
  });

  it.each([
    ['taxId', 'tax_invoice_tax_id_required'],
    ['branchType', 'tax_invoice_branch_type_required'],
  ] as const)('requires %s', (field, code) => {
    const document = makeDocument();
    document.documentType = 'tax_invoice';
    document.business.vatStatus = 'registered';
    document.adjustments.vat.enabled = true;
    document.business[field] = undefined;

    const result = validateTaxInvoiceEligibility(document);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((error) => error.code)).toContain(code);
  });

  it('requires branch number when branch type is branch', () => {
    const document = makeDocument();
    document.documentType = 'tax_invoice';
    document.business.vatStatus = 'registered';
    document.adjustments.vat.enabled = true;
    document.business.branchType = 'branch';
    document.business.branchNumber = '';

    expect(validateTaxInvoiceEligibility(document).ok).toBe(false);
  });
});
