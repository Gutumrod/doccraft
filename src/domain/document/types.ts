import type { BusinessProfile, VatConfig } from '../tax/types';

export const DOCUMENT_TYPES = [
  'quotation',
  'invoice',
  'receipt',
  'work_order',
  'tax_invoice',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface CustomerProfile {
  displayName: string;
  taxId?: string;
  address: string;
  branchType?: 'head_office' | 'branch';
  branchNumber?: string;
}

export type DiscountConfig =
  | { mode: 'none' }
  | { mode: 'percent'; value: number }
  | { mode: 'fixed'; value: number };

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: DiscountConfig;
}

export interface WhtConfig {
  enabled: boolean;
  ratePercent: number;
  basisLineItemIds: string[];
}

export type DepositConfig =
  | { mode: 'none' }
  | { mode: 'percent'; value: number }
  | { mode: 'fixed'; value: number };

export interface AdjustmentConfig {
  documentDiscount: DiscountConfig;
  vat: VatConfig;
  wht: WhtConfig;
  deposit: DepositConfig;
}

export interface PaymentConfig {
  instructions?: string;
}

export interface BlockVisibility {
  business: boolean;
  customer: boolean;
  items: boolean;
  itemImages: boolean;
  adjustments: boolean;
  payment: boolean;
  terms: boolean;
  notes: boolean;
  signatures: boolean;
}

export interface DocCraftDocument {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  business: BusinessProfile;
  customer: CustomerProfile;
  items: LineItem[];
  adjustments: AdjustmentConfig;
  payment: PaymentConfig;
  blocks: BlockVisibility;
  terms?: string;
  notes?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}
