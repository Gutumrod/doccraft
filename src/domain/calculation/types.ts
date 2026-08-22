import type { ValidationResult } from '../validation/result';

export interface CalculatedLine {
  id: string;
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CalculationTotals {
  lines: CalculatedLine[];
  subtotal: number;
  documentDiscountAmount: number;
  amountAfterDiscount: number;
  vatRatePercent: number;
  vatAmount: number;
  whtBasisAmount: number;
  whtRatePercent: number;
  whtAmount: number;
  netPayable: number;
  depositAmount: number;
}

export type CalculationResult = ValidationResult<CalculationTotals>;
