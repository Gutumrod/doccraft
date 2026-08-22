import type { DocCraftDocument } from '../document/types';
import { invalid, issue, valid, type ValidationIssue, type ValidationResult } from '../validation/result';

function isNonBlank(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateVatChargeEligibility(
  document: DocCraftDocument,
): ValidationResult<DocCraftDocument> {
  if (document.adjustments.vat.enabled && document.business.vatStatus !== 'registered') {
    return invalid([
      issue(
        'vat_charge_not_allowed',
        'adjustments.vat.enabled',
        'VAT can only be charged by a VAT-registered business profile.',
      ),
    ]);
  }

  return valid(document);
}

export function validateTaxInvoiceEligibility(
  document: DocCraftDocument,
): ValidationResult<DocCraftDocument> {
  if (document.documentType !== 'tax_invoice') return valid(document);

  const errors: ValidationIssue[] = [];
  if (document.business.vatStatus !== 'registered') {
    errors.push(issue('tax_invoice_requires_vat_registration', 'business.vatStatus', 'Tax Invoice requires a VAT-registered business profile.'));
  }
  if (!document.adjustments.vat.enabled) {
    errors.push(issue('tax_invoice_requires_vat', 'adjustments.vat.enabled', 'Tax Invoice must have VAT enabled.'));
  }
  if (!isNonBlank(document.business.taxId)) {
    errors.push(issue('tax_invoice_tax_id_required', 'business.taxId', 'Business tax id is required for Tax Invoice.'));
  }
  if (!document.business.branchType) {
    errors.push(issue('tax_invoice_branch_type_required', 'business.branchType', 'Business branch type is required for Tax Invoice.'));
  }
  if (document.business.branchType === 'branch' && !isNonBlank(document.business.branchNumber)) {
    errors.push(issue('tax_invoice_branch_number_required', 'business.branchNumber', 'Branch number is required for a branch Tax Invoice.'));
  }

  return errors.length > 0 ? invalid(errors) : valid(document);
}
