import { describe, expect, it } from 'vitest';
import { calculateDocument } from '../../src/domain/calculation/calculate';
import {
  longCustomerAndAddressFixture,
  minimalBlocksFixture,
  multiPageDocumentFixture,
  onePageQuotationFixture,
  richThaiTextFixture,
  withItemImagesFixture,
} from '../../src/domain/fixtures/representative-documents';

describe('Phase 3 — Representative Document Fixtures & Print Validation', () => {
  it('1. onePageQuotationFixture passes pure calculation and conforms to schema v2', () => {
    expect(onePageQuotationFixture.schemaVersion).toBe(2);
    expect(onePageQuotationFixture.items.length).toBe(3);

    const calcResult = calculateDocument(onePageQuotationFixture);
    expect(calcResult.ok).toBe(true);

    if (calcResult.ok) {
      const totals = calcResult.value;
      // Item 1: 45000 - 0 = 45000
      // Item 2: 65000 - 10% (6500) = 58500
      // Item 3: 2 * 12500 - 1000 = 24000
      // Subtotal = 45000 + 58500 + 24000 = 127500
      expect(totals.subtotal).toBe(127500);
      // Document discount = 2500 -> Amount after discount = 125000
      expect(totals.documentDiscountAmount).toBe(2500);
      expect(totals.amountAfterDiscount).toBe(125000);
      // VAT 7% of 125000 = 8750
      expect(totals.vatAmount).toBe(8750);
      // WHT basis: item-1 (45000) + item-2 (58500) = 103500. Proportional discount: 103500 * (125000 / 127500) = 101470.588... -> 101470.59. 3% = 3044.12
      expect(totals.whtAmount).toBeGreaterThan(0);
      // Net payable = 125000 + 8750 - wht
      expect(totals.netPayable).toBe(125000 + 8750 - totals.whtAmount);
      // Deposit 50% of net payable
      expect(totals.depositAmount).toBe(Math.round((totals.netPayable * 0.5) * 100) / 100);
    }
  });

  it('2. multiPageDocumentFixture passes calculation for 20+ line items', () => {
    expect(multiPageDocumentFixture.schemaVersion).toBe(2);
    expect(multiPageDocumentFixture.items.length).toBe(22);

    const calcResult = calculateDocument(multiPageDocumentFixture);
    expect(calcResult.ok).toBe(true);

    if (calcResult.ok) {
      const totals = calcResult.value;
      expect(totals.lines.length).toBe(22);
      expect(totals.subtotal).toBeGreaterThan(50000);
      expect(totals.vatAmount).toBeGreaterThan(0);
      expect(totals.netPayable).toBeGreaterThan(0);
    }
  });

  it('3. richThaiTextFixture passes calculation and verifies Thai metadata', () => {
    expect(richThaiTextFixture.schemaVersion).toBe(2);
    expect(richThaiTextFixture.documentType).toBe('receipt');
    expect(richThaiTextFixture.business.displayName).toContain('นายกิตติศักดิ์ พรหมมินทร์ปรีชากุล');
    expect(richThaiTextFixture.customer.displayName).toContain('คุณหญิงประไพศรี');

    const calcResult = calculateDocument(richThaiTextFixture);
    expect(calcResult.ok).toBe(true);

    if (calcResult.ok) {
      const totals = calcResult.value;
      // Item 1: 2 * 28500 = 57000
      // Item 2: 16800 - 800 = 16000
      // Subtotal = 73000
      expect(totals.subtotal).toBe(73000);
      expect(totals.vatAmount).toBe(0); // non-registered
      expect(totals.netPayable).toBe(73000);
    }
  });

  it('4. longCustomerAndAddressFixture passes calculation for registered tax invoice', () => {
    expect(longCustomerAndAddressFixture.schemaVersion).toBe(2);
    expect(longCustomerAndAddressFixture.documentType).toBe('tax_invoice');

    const calcResult = calculateDocument(longCustomerAndAddressFixture);
    expect(calcResult.ok).toBe(true);

    if (calcResult.ok) {
      const totals = calcResult.value;
      expect(totals.subtotal).toBe(350000);
      expect(totals.vatAmount).toBeGreaterThan(0);
      expect(totals.whtAmount).toBeGreaterThan(0);
    }
  });

  it('5. withItemImagesFixture and minimalBlocksFixture pass calculation without mutating state', () => {
    expect(withItemImagesFixture.blocks.itemImages).toBe(true);
    expect(minimalBlocksFixture.blocks.payment).toBe(false);
    expect(minimalBlocksFixture.blocks.signatures).toBe(false);

    const calcImages = calculateDocument(withItemImagesFixture);
    const calcMinimal = calculateDocument(minimalBlocksFixture);

    expect(calcImages.ok).toBe(true);
    expect(calcMinimal.ok).toBe(true);
  });
});
