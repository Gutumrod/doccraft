import {
  CURRENT_SCHEMA_VERSION,
  DOCUMENT_TYPES,
  type BlockVisibility,
  type DepositConfig,
  type DiscountConfig,
  type DocCraftDocument,
  type LineItem,
} from '../domain/document/types';
import type { BranchType, EntityType, VatStatus } from '../domain/tax/types';
import { validateItemImageStructure } from '../image/item-image';
import { createPersistenceError } from './errors';
import type { PersistenceResult } from './types';

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function isBoolean(val: unknown): val is boolean {
  return typeof val === 'boolean';
}

function validateDiscount(raw: unknown, path: string): PersistenceResult<DiscountConfig> {
  if (!isObject(raw)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path} must be an object`) };
  }
  if (raw.mode === 'none') {
    return { ok: true, value: { mode: 'none' } };
  }
  if (raw.mode === 'percent' || raw.mode === 'fixed') {
    if (!isNumber(raw.value)) {
      return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.value must be a finite number`) };
    }
    return { ok: true, value: { mode: raw.mode, value: raw.value } };
  }
  return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.mode must be 'none', 'percent', or 'fixed'`) };
}

function validateDeposit(raw: unknown, path: string): PersistenceResult<DepositConfig> {
  if (!isObject(raw)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path} must be an object`) };
  }
  if (raw.mode === 'none') {
    return { ok: true, value: { mode: 'none' } };
  }
  if (raw.mode === 'percent' || raw.mode === 'fixed') {
    if (!isNumber(raw.value)) {
      return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.value must be a finite number`) };
    }
    return { ok: true, value: { mode: raw.mode, value: raw.value } };
  }
  return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.mode must be 'none', 'percent', or 'fixed'`) };
}

function validateLineItem(raw: unknown, index: number): PersistenceResult<LineItem> {
  const path = `items[${index}]`;
  if (!isObject(raw)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path} must be an object`) };
  }
  if (!isString(raw.id) || !raw.id.trim()) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.id must be a non-empty string`) };
  }
  if (!isString(raw.description)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.description must be a string`) };
  }
  if (!isNumber(raw.quantity)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.quantity must be a finite number`) };
  }
  if (!isNumber(raw.unitPrice)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.unitPrice must be a finite number`) };
  }
  const discountRes = validateDiscount(raw.discount, `${path}.discount`);
  if (!discountRes.ok) return discountRes;

  let image;
  if (raw.image !== undefined) {
    const imageRes = validateItemImageStructure(raw.image);
    if (!imageRes.ok) {
      return {
        ok: false,
        error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `${path}.image: ${imageRes.message}`),
      };
    }
    image = imageRes.value;
  }

  return {
    ok: true,
    value: {
      id: raw.id,
      description: raw.description,
      quantity: raw.quantity,
      unitPrice: raw.unitPrice,
      discount: discountRes.value,
      image,
    },
  };
}

function validateBlockVisibility(raw: unknown): PersistenceResult<BlockVisibility> {
  if (!isObject(raw)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'blocks must be an object') };
  }
  const requiredKeys: (keyof BlockVisibility)[] = [
    'business',
    'customer',
    'items',
    'itemImages',
    'adjustments',
    'payment',
    'terms',
    'notes',
    'signatures',
  ];

  for (const k of requiredKeys) {
    if (!isBoolean(raw[k])) {
      return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `blocks.${k} must be boolean`) };
    }
  }

  return {
    ok: true,
    value: {
      business: raw.business as boolean,
      customer: raw.customer as boolean,
      items: raw.items as boolean,
      itemImages: raw.itemImages as boolean,
      adjustments: raw.adjustments as boolean,
      payment: raw.payment as boolean,
      terms: raw.terms as boolean,
      notes: raw.notes as boolean,
      signatures: raw.signatures as boolean,
    },
  };
}

export function validateCanonicalDocument(raw: unknown): PersistenceResult<DocCraftDocument> {
  if (!isObject(raw)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'Document payload must be an object') };
  }

  // 1. Root primitive fields — validate types, allow empty editable strings
  if (!isString(raw.id) || !raw.id.trim()) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'id must be a non-empty string') };
  }
  if (!DOCUMENT_TYPES.includes(raw.documentType as (typeof DOCUMENT_TYPES)[number])) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `Invalid documentType: ${String(raw.documentType)}`) };
  }
  if (!isString(raw.documentNumber)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'documentNumber must be a string') };
  }
  if (!isString(raw.issueDate)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'issueDate must be a string') };
  }
  if (raw.dueDate !== undefined && !isString(raw.dueDate)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'dueDate must be a string if provided') };
  }
  if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: createPersistenceError(
        'UNSUPPORTED_SCHEMA_VERSION',
        `Document schemaVersion must be ${CURRENT_SCHEMA_VERSION}, received: ${String(raw.schemaVersion)}`
      ),
    };
  }

  // 2. Timestamps — strictly required, must not be synthesized
  if (!isString(raw.createdAt) || !raw.createdAt.trim()) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'createdAt must be a non-empty string') };
  }
  if (!isString(raw.updatedAt) || !raw.updatedAt.trim()) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'updatedAt must be a non-empty string') };
  }

  // 3. Business profile
  if (!isObject(raw.business)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'business must be an object') };
  }
  const entityType = raw.business.entityType;
  if (entityType !== 'individual' && entityType !== 'juristic_person') {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', "business.entityType must be 'individual' or 'juristic_person'") };
  }
  const vatStatus = raw.business.vatStatus;
  if (vatStatus !== 'not_registered' && vatStatus !== 'registered') {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', "business.vatStatus must be 'not_registered' or 'registered'") };
  }
  if (!isString(raw.business.displayName)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'business.displayName must be a string') };
  }
  if (!isString(raw.business.address)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'business.address must be a string') };
  }
  if (raw.business.taxId !== undefined && !isString(raw.business.taxId)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'business.taxId must be a string if provided') };
  }
  if (raw.business.branchType !== undefined && raw.business.branchType !== 'head_office' && raw.business.branchType !== 'branch') {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', "business.branchType must be 'head_office' or 'branch'") };
  }
  if (raw.business.branchNumber !== undefined && !isString(raw.business.branchNumber)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'business.branchNumber must be a string if provided') };
  }

  // 4. Customer profile
  if (!isObject(raw.customer)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'customer must be an object') };
  }
  if (!isString(raw.customer.displayName)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'customer.displayName must be a string') };
  }
  if (!isString(raw.customer.address)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'customer.address must be a string') };
  }
  if (raw.customer.taxId !== undefined && !isString(raw.customer.taxId)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'customer.taxId must be a string if provided') };
  }
  if (raw.customer.branchType !== undefined && raw.customer.branchType !== 'head_office' && raw.customer.branchType !== 'branch') {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', "customer.branchType must be 'head_office' or 'branch'") };
  }
  if (raw.customer.branchNumber !== undefined && !isString(raw.customer.branchNumber)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'customer.branchNumber must be a string if provided') };
  }

  // 5. Line items — preserve editable values, but enforce editor-state identity invariants.
  if (!Array.isArray(raw.items)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'items must be an array') };
  }
  if (raw.items.length === 0) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'items must contain at least one line item') };
  }

  const validatedItems: LineItem[] = [];
  const itemIds = new Set<string>();
  for (let i = 0; i < raw.items.length; i++) {
    const itemRes = validateLineItem(raw.items[i], i);
    if (!itemRes.ok) return itemRes;
    if (itemIds.has(itemRes.value.id)) {
      return {
        ok: false,
        error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `items[${i}].id duplicates an existing line item id`),
      };
    }
    itemIds.add(itemRes.value.id);
    validatedItems.push(itemRes.value);
  }

  // 6. Adjustments
  if (!isObject(raw.adjustments)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'adjustments must be an object') };
  }
  const docDiscountRes = validateDiscount(raw.adjustments.documentDiscount, 'adjustments.documentDiscount');
  if (!docDiscountRes.ok) return docDiscountRes;

  if (!isObject(raw.adjustments.vat) || !isBoolean(raw.adjustments.vat.enabled)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'adjustments.vat.enabled must be boolean') };
  }
  if (
    !isObject(raw.adjustments.wht) ||
    !isBoolean(raw.adjustments.wht.enabled) ||
    !isNumber(raw.adjustments.wht.ratePercent) ||
    !Array.isArray(raw.adjustments.wht.basisLineItemIds)
  ) {
    return {
      ok: false,
      error: createPersistenceError(
        'INVALID_DOCUMENT_STRUCTURE',
        'adjustments.wht must have enabled (boolean), ratePercent (finite number), basisLineItemIds (string[])'
      ),
    };
  }
  const whtBasisIds = new Set<string>();
  for (const bId of raw.adjustments.wht.basisLineItemIds) {
    if (!isString(bId)) {
      return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'adjustments.wht.basisLineItemIds must only contain strings') };
    }
    if (!itemIds.has(bId)) {
      return {
        ok: false,
        error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `adjustments.wht.basisLineItemIds references unknown line item id: ${bId}`),
      };
    }
    if (whtBasisIds.has(bId)) {
      return {
        ok: false,
        error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', `adjustments.wht.basisLineItemIds contains duplicate line item id: ${bId}`),
      };
    }
    whtBasisIds.add(bId);
  }

  const depositRes = validateDeposit(raw.adjustments.deposit, 'adjustments.deposit');
  if (!depositRes.ok) return depositRes;

  // 7. Payment
  if (!isObject(raw.payment)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'payment must be an object') };
  }
  if (raw.payment.instructions !== undefined && !isString(raw.payment.instructions)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'payment.instructions must be a string if provided') };
  }

  // 8. Blocks
  const blocksRes = validateBlockVisibility(raw.blocks);
  if (!blocksRes.ok) return blocksRes;

  // 9. Terms & Notes
  if (raw.terms !== undefined && !isString(raw.terms)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'terms must be a string if provided') };
  }
  if (raw.notes !== undefined && !isString(raw.notes)) {
    return { ok: false, error: createPersistenceError('INVALID_DOCUMENT_STRUCTURE', 'notes must be a string if provided') };
  }

  const doc: DocCraftDocument = {
    id: raw.id,
    documentType: raw.documentType as (typeof DOCUMENT_TYPES)[number],
    documentNumber: raw.documentNumber,
    issueDate: raw.issueDate,
    dueDate: raw.dueDate,
    business: {
      entityType: entityType as EntityType,
      vatStatus: vatStatus as VatStatus,
      displayName: raw.business.displayName,
      taxId: raw.business.taxId,
      address: raw.business.address,
      branchType: raw.business.branchType as BranchType | undefined,
      branchNumber: raw.business.branchNumber,
    },
    customer: {
      displayName: raw.customer.displayName,
      taxId: raw.customer.taxId,
      address: raw.customer.address,
      branchType: raw.customer.branchType as BranchType | undefined,
      branchNumber: raw.customer.branchNumber,
    },
    items: validatedItems,
    adjustments: {
      documentDiscount: docDiscountRes.value,
      vat: { enabled: raw.adjustments.vat.enabled },
      wht: {
        enabled: raw.adjustments.wht.enabled,
        ratePercent: raw.adjustments.wht.ratePercent,
        basisLineItemIds: raw.adjustments.wht.basisLineItemIds as string[],
      },
      deposit: depositRes.value,
    },
    payment: {
      instructions: raw.payment.instructions,
    },
    blocks: blocksRes.value,
    terms: raw.terms,
    notes: raw.notes,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return {
    ok: true,
    value: doc,
  };
}
