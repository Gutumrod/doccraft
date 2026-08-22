import type { DocCraftDocument } from '../../src/domain/document/types';
import { CURRENT_SCHEMA_VERSION } from '../../src/domain/document/schema';

export function makeDocument(): DocCraftDocument {
  return {
    id: 'doc-1',
    documentType: 'quotation',
    documentNumber: 'QT-001',
    issueDate: '2026-08-22',
    dueDate: '2026-08-29',
    business: {
      entityType: 'individual',
      vatStatus: 'not_registered',
      displayName: 'Demo Business',
      taxId: '1234567890123',
      address: 'Bangkok',
      branchType: 'head_office',
    },
    customer: {
      displayName: 'Demo Customer',
      address: 'Bangkok',
    },
    items: [
      {
        id: 'line-1',
        description: 'Service',
        quantity: 2,
        unitPrice: 100,
        discount: { mode: 'none' },
      },
    ],
    adjustments: {
      documentDiscount: { mode: 'none' },
      vat: { enabled: false },
      wht: { enabled: false, ratePercent: 3, basisLineItemIds: [] },
      deposit: { mode: 'none' },
    },
    payment: {},
    blocks: {
      business: true,
      customer: true,
      items: true,
      itemImages: true,
      adjustments: true,
      payment: true,
      terms: true,
      notes: true,
      signatures: true,
    },
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  };
}
