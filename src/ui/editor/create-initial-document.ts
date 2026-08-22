import type { DocCraftDocument } from '../../domain/document/types';
import { CURRENT_SCHEMA_VERSION } from '../../domain/document/schema';

export function createInitialDocument(): DocCraftDocument {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const isoStr = now.toISOString();

  return {
    id: `doc-${Date.now()}`,
    documentType: 'quotation',
    documentNumber: 'QT-0001',
    issueDate: dateStr,
    dueDate: dateStr,
    business: {
      entityType: 'individual',
      vatStatus: 'not_registered',
      displayName: '[กรอกชื่อกิจการ / ผู้ประกอบการ]',
      taxId: '',
      address: '[กรอกที่อยู่กิจการ]',
      branchType: undefined,
      branchNumber: '',
    },
    customer: {
      displayName: '[กรอกชื่อลูกค้า / ผู้ว่าจ้าง]',
      taxId: '',
      address: '[กรอกที่อยู่ลูกค้า]',
      branchType: undefined,
      branchNumber: '',
    },
    items: [
      {
        id: 'item-1',
        description: '[กรอกรายการสินค้า / บริการ]',
        quantity: 1,
        unitPrice: 0,
        discount: { mode: 'none' },
      },
    ],
    adjustments: {
      documentDiscount: { mode: 'none' },
      vat: { enabled: false },
      wht: {
        enabled: false,
        ratePercent: 3,
        basisLineItemIds: [],
      },
      deposit: { mode: 'none' },
    },
    payment: {},
    blocks: {
      business: true,
      customer: true,
      items: true,
      itemImages: false,
      adjustments: true,
      payment: true,
      terms: true,
      notes: true,
      signatures: true,
    },
    terms: undefined,
    notes: undefined,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: isoStr,
    updatedAt: isoStr,
  };
}
