export const VAT_RATE_PERCENT = 7;

export type EntityType = 'individual' | 'juristic_person';
export type VatStatus = 'not_registered' | 'registered';
export type BranchType = 'head_office' | 'branch';

export interface BusinessProfile {
  entityType: EntityType;
  vatStatus: VatStatus;
  displayName: string;
  taxId?: string;
  address: string;
  branchType?: BranchType;
  branchNumber?: string;
}

export interface VatConfig {
  enabled: boolean;
}
