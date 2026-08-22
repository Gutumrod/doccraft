import { DOCUMENT_TYPES, type DiscountConfig, type DocCraftDocument } from './types';
import { invalid, issue, valid, type ValidationIssue, type ValidationResult } from '../validation/result';

export const CURRENT_SCHEMA_VERSION = 1;

function isNonBlank(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateDiscount(
  discount: DiscountConfig,
  path: string,
  errors: ValidationIssue[],
): void {
  if (discount.mode === 'none') return;

  if (!Number.isFinite(discount.value)) {
    errors.push(issue('invalid_number', `${path}.value`, 'Discount value must be finite.'));
    return;
  }

  if (discount.value < 0) {
    errors.push(issue('negative_discount', `${path}.value`, 'Discount cannot be negative.'));
  }

  if (discount.mode === 'percent' && discount.value > 100) {
    errors.push(issue('discount_percent_out_of_range', `${path}.value`, 'Percent discount cannot exceed 100.'));
  }
}

export function validateDocumentSchema(document: DocCraftDocument): ValidationResult<DocCraftDocument> {
  const errors: ValidationIssue[] = [];

  if (document.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    errors.push(issue('unsupported_schema_version', 'schemaVersion', `Expected schema version ${CURRENT_SCHEMA_VERSION}.`));
  }

  if (!DOCUMENT_TYPES.includes(document.documentType)) {
    errors.push(issue('invalid_document_type', 'documentType', 'Unsupported document type.'));
  }

  if (!isNonBlank(document.id)) errors.push(issue('required', 'id', 'Document id is required.'));
  if (!isNonBlank(document.documentNumber)) errors.push(issue('required', 'documentNumber', 'Document number is required.'));
  if (!isNonBlank(document.issueDate)) errors.push(issue('required', 'issueDate', 'Issue date is required.'));
  if (!isNonBlank(document.createdAt)) errors.push(issue('required', 'createdAt', 'Created timestamp is required.'));
  if (!isNonBlank(document.updatedAt)) errors.push(issue('required', 'updatedAt', 'Updated timestamp is required.'));

  if (!['individual', 'juristic_person'].includes(document.business.entityType)) {
    errors.push(issue('invalid_entity_type', 'business.entityType', 'Unsupported entity type.'));
  }
  if (!['not_registered', 'registered'].includes(document.business.vatStatus)) {
    errors.push(issue('invalid_vat_status', 'business.vatStatus', 'Unsupported VAT status.'));
  }

  if (!isNonBlank(document.business.displayName)) errors.push(issue('required', 'business.displayName', 'Business display name is required.'));
  if (!isNonBlank(document.business.address)) errors.push(issue('required', 'business.address', 'Business address is required.'));
  if (!isNonBlank(document.customer.displayName)) errors.push(issue('required', 'customer.displayName', 'Customer display name is required.'));
  if (!isNonBlank(document.customer.address)) errors.push(issue('required', 'customer.address', 'Customer address is required.'));

  if (document.items.length === 0) {
    errors.push(issue('items_required', 'items', 'At least one line item is required.'));
  }

  const itemIds = new Set<string>();
  document.items.forEach((item, index) => {
    const path = `items.${index}`;
    if (!isNonBlank(item.id)) errors.push(issue('required', `${path}.id`, 'Line item id is required.'));
    if (itemIds.has(item.id)) errors.push(issue('duplicate_line_item_id', `${path}.id`, 'Line item ids must be unique.'));
    itemIds.add(item.id);

    if (!isNonBlank(item.description)) errors.push(issue('required', `${path}.description`, 'Description is required.'));
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      errors.push(issue('invalid_quantity', `${path}.quantity`, 'Quantity must be finite and greater than zero.'));
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      errors.push(issue('invalid_unit_price', `${path}.unitPrice`, 'Unit price must be finite and non-negative.'));
    }
    validateDiscount(item.discount, `${path}.discount`, errors);
  });

  validateDiscount(document.adjustments.documentDiscount, 'adjustments.documentDiscount', errors);

  return errors.length > 0 ? invalid(errors) : valid(document);
}
