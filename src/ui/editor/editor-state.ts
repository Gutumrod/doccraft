import type {
  AdjustmentConfig,
  BlockVisibility,
  BrandingConfig,
  BusinessLogo,
  CustomerProfile,
  DocCraftDocument,
  DocumentType,
  LineItem,
  PaymentConfig,
} from '../../domain/document/types';
import type { BusinessProfile } from '../../domain/tax/types';
import { validateTaxInvoiceEligibility } from '../../domain/tax/validation';

const DOCUMENT_NUMBER_PREFIXES: Record<DocumentType, string> = {
  quotation: 'QT',
  invoice: 'INV',
  receipt: 'RC',
  work_order: 'WO',
  tax_invoice: 'TAX',
};

const MANAGED_DOCUMENT_NUMBER_PATTERN = /^(QT|INV|RC|WO|TAX)-(.+)$/;

function syncManagedDocumentNumber(documentNumber: string, documentType: DocumentType): string {
  const match = MANAGED_DOCUMENT_NUMBER_PATTERN.exec(documentNumber);
  if (!match) return documentNumber;
  return `${DOCUMENT_NUMBER_PREFIXES[documentType]}-${match[2]}`;
}

export function updateDocumentHeader(
  doc: DocCraftDocument,
  patch: Partial<Pick<DocCraftDocument, 'documentNumber' | 'issueDate' | 'dueDate'>>,
): DocCraftDocument {
  return {
    ...doc,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function updateBusinessProfile(
  doc: DocCraftDocument,
  patch: Partial<BusinessProfile>,
): DocCraftDocument {
  const nextBusiness: BusinessProfile = {
    ...doc.business,
    ...patch,
  };

  // Invariant: Switching vatStatus to 'not_registered' must disable VAT charge
  let nextAdjustments = doc.adjustments;
  if (patch.vatStatus === 'not_registered' && doc.adjustments.vat.enabled) {
    nextAdjustments = {
      ...doc.adjustments,
      vat: { enabled: false },
    };
  }

  // If document is tax_invoice but VAT was removed/deregistered, revert or keep for validation
  let nextDocType = doc.documentType;
  if (patch.vatStatus === 'not_registered' && doc.documentType === 'tax_invoice') {
    nextDocType = 'invoice';
  }

  return {
    ...doc,
    documentType: nextDocType,
    documentNumber:
      nextDocType === doc.documentType
        ? doc.documentNumber
        : syncManagedDocumentNumber(doc.documentNumber, nextDocType),
    business: nextBusiness,
    adjustments: nextAdjustments,
    updatedAt: new Date().toISOString(),
  };
}

export function updateCustomerProfile(
  doc: DocCraftDocument,
  patch: Partial<CustomerProfile>,
): DocCraftDocument {
  return {
    ...doc,
    customer: {
      ...doc.customer,
      ...patch,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updateBusinessLogo(
  doc: DocCraftDocument,
  logo: BusinessLogo | undefined,
): DocCraftDocument {
  const nextBranding: BrandingConfig =
    logo === undefined ? {} : { logo };

  return {
    ...doc,
    branding: nextBranding,
    updatedAt: new Date().toISOString(),
  };
}

let itemCounter = 1;
export function generateLineItemId(): string {
  itemCounter += 1;
  return `item-${Date.now()}-${itemCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addLineItem(
  doc: DocCraftDocument,
  initial?: Partial<Omit<LineItem, 'id'>>,
): DocCraftDocument {
  const newItem: LineItem = {
    id: generateLineItemId(),
    description: initial?.description ?? `บริการ / สินค้ารายการที่ ${doc.items.length + 1}`,
    quantity: initial?.quantity ?? 1,
    unitPrice: initial?.unitPrice ?? 0,
    discount: initial?.discount ?? { mode: 'none' },
    image: initial?.image,
  };

  return {
    ...doc,
    items: [...doc.items, newItem],
    updatedAt: new Date().toISOString(),
  };
}

export function removeLineItem(doc: DocCraftDocument, itemId: string): DocCraftDocument {
  // Filter out the line item
  const nextItems = doc.items.filter((item) => item.id !== itemId);

  // Invariant: Clean up WHT basis line IDs if the removed item was referenced
  const nextBasisIds = doc.adjustments.wht.basisLineItemIds.filter((id) => id !== itemId);

  const nextAdjustments: AdjustmentConfig = {
    ...doc.adjustments,
    wht: {
      ...doc.adjustments.wht,
      basisLineItemIds: nextBasisIds,
    },
  };

  return {
    ...doc,
    items: nextItems,
    adjustments: nextAdjustments,
    updatedAt: new Date().toISOString(),
  };
}

export function updateLineItem(
  doc: DocCraftDocument,
  itemId: string,
  patch: Partial<Omit<LineItem, 'id'>>,
): DocCraftDocument {
  const nextItems = doc.items.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      ...patch,
    };
  });

  return {
    ...doc,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

export function updateAdjustments(
  doc: DocCraftDocument,
  patch: Partial<AdjustmentConfig>,
): DocCraftDocument {
  const nextAdjustments: AdjustmentConfig = {
    ...doc.adjustments,
    ...patch,
  };

  // Invariant: If VAT is disabled while documentType is tax_invoice, fail-closed / switch to invoice
  let nextDocType = doc.documentType;
  if (patch.vat && !patch.vat.enabled && doc.documentType === 'tax_invoice') {
    nextDocType = 'invoice';
  }

  return {
    ...doc,
    documentType: nextDocType,
    documentNumber:
      nextDocType === doc.documentType
        ? doc.documentNumber
        : syncManagedDocumentNumber(doc.documentNumber, nextDocType),
    adjustments: nextAdjustments,
    updatedAt: new Date().toISOString(),
  };
}

export function toggleWhtBasisItem(doc: DocCraftDocument, itemId: string): DocCraftDocument {
  if (!doc.items.some((item) => item.id === itemId)) return doc;

  const currentBasis = new Set(doc.adjustments.wht.basisLineItemIds);
  if (currentBasis.has(itemId)) {
    currentBasis.delete(itemId);
  } else {
    currentBasis.add(itemId);
  }

  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      wht: {
        ...doc.adjustments.wht,
        basisLineItemIds: Array.from(currentBasis),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updatePayment(
  doc: DocCraftDocument,
  patch: Partial<PaymentConfig>,
): DocCraftDocument {
  return {
    ...doc,
    payment: {
      ...doc.payment,
      ...patch,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updateTermsAndNotes(
  doc: DocCraftDocument,
  patch: { terms?: string; notes?: string },
): DocCraftDocument {
  return {
    ...doc,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function setBlockVisibility(
  doc: DocCraftDocument,
  block: keyof BlockVisibility,
  visible: boolean,
): DocCraftDocument {
  // Invariant: Hiding a block changes visibility only and NEVER deletes underlying data
  return {
    ...doc,
    blocks: {
      ...doc.blocks,
      [block]: visible,
    },
    updatedAt: new Date().toISOString(),
  };
}

export interface TaxInvoiceEligibility {
  isEligible: boolean;
  reasons: string[];
}

export function checkTaxInvoiceEligibility(doc: DocCraftDocument): TaxInvoiceEligibility {
  const result = validateTaxInvoiceEligibility({
    ...doc,
    documentType: 'tax_invoice',
  });

  return result.ok
    ? { isEligible: true, reasons: [] }
    : { isEligible: false, reasons: result.errors.map((error) => error.message) };
}

export function setDocumentType(
  doc: DocCraftDocument,
  documentType: DocumentType,
): DocCraftDocument {
  if (documentType === 'tax_invoice') {
    const eligibility = checkTaxInvoiceEligibility(doc);
    if (!eligibility.isEligible) {
      // Invariant: tax invoice selection must fail closed
      return doc;
    }
  }

  return {
    ...doc,
    documentType,
    documentNumber: syncManagedDocumentNumber(doc.documentNumber, documentType),
    updatedAt: new Date().toISOString(),
  };
}
