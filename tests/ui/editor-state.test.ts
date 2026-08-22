import { describe, expect, it } from 'vitest';
import { calculateDocument } from '../../src/domain/calculation/calculate';
import { validateDocumentSchema } from '../../src/domain/document/schema';
import { createInitialDocument } from '../../src/ui/editor/create-initial-document';
import {
  addLineItem,
  checkTaxInvoiceEligibility,
  removeLineItem,
  setBlockVisibility,
  setDocumentType,
  toggleWhtBasisItem,
  updateAdjustments,
  updateBusinessProfile,
  updateCustomerProfile,
  updateDocumentHeader,
  updateLineItem,
  updateTermsAndNotes,
} from '../../src/ui/editor/editor-state';

describe('Editor State & Initial Document', () => {
  it('1. initial document conforms to current schema version and passes domain validation', () => {
    const doc = createInitialDocument();
    const schemaValidation = validateDocumentSchema(doc);
    expect(schemaValidation.ok).toBe(true);

    const calcResult = calculateDocument(doc);
    expect(calcResult.ok).toBe(true);
    if (calcResult.ok) {
      expect(calcResult.value.subtotal).toBe(0);
      expect(calcResult.value.netPayable).toBe(0);
      expect(calcResult.value.vatAmount).toBe(0);
    }
  });

  it('2. changing entity type does not change VAT status', () => {
    let doc = createInitialDocument();
    expect(doc.business.entityType).toBe('individual');
    expect(doc.business.vatStatus).toBe('not_registered');

    // Update entity type to juristic_person
    doc = updateBusinessProfile(doc, { entityType: 'juristic_person' });
    expect(doc.business.entityType).toBe('juristic_person');
    expect(doc.business.vatStatus).toBe('not_registered');

    // Switch VAT status to registered
    doc = updateBusinessProfile(doc, { vatStatus: 'registered' });
    expect(doc.business.vatStatus).toBe('registered');

    // Switch entity type back to individual
    doc = updateBusinessProfile(doc, { entityType: 'individual' });
    expect(doc.business.entityType).toBe('individual');
    expect(doc.business.vatStatus).toBe('registered');
  });

  it('3. disabling VAT registration prevents VAT-enabled editor state from remaining effective', () => {
    let doc = createInitialDocument();
    doc = updateLineItem(doc, doc.items[0].id, { unitPrice: 1000, description: 'Service' });
    // Enable VAT registration and turn on VAT
    doc = updateBusinessProfile(doc, { vatStatus: 'registered' });
    doc = updateAdjustments(doc, { vat: { enabled: true } });
    expect(doc.adjustments.vat.enabled).toBe(true);

    let calc = calculateDocument(doc);
    expect(calc.ok).toBe(true);
    if (calc.ok) {
      expect(calc.value.vatAmount).toBe(70);
      expect(calc.value.netPayable).toBe(1070);
    }

    // Now switch VAT status back to not_registered
    doc = updateBusinessProfile(doc, { vatStatus: 'not_registered' });
    expect(doc.business.vatStatus).toBe('not_registered');
    expect(doc.adjustments.vat.enabled).toBe(false);

    calc = calculateDocument(doc);
    expect(calc.ok).toBe(true);
    if (calc.ok) {
      expect(calc.value.vatAmount).toBe(0);
      expect(calc.value.netPayable).toBe(1000);
    }
  });

  it('4. add/remove/update line item preserves unique stable IDs', () => {
    let doc = createInitialDocument();
    const firstItemId = doc.items[0].id;
    expect(firstItemId).toBeDefined();

    // Add a second item
    doc = addLineItem(doc, { description: 'Item 2', unitPrice: 500, quantity: 2 });
    expect(doc.items.length).toBe(2);
    const secondItemId = doc.items[1].id;
    expect(secondItemId).not.toBe(firstItemId);

    // Update second item
    doc = updateLineItem(doc, secondItemId, { unitPrice: 600 });
    expect(doc.items[1].unitPrice).toBe(600);
    expect(doc.items[1].id).toBe(secondItemId);

    // Remove first item
    doc = removeLineItem(doc, firstItemId);
    expect(doc.items.length).toBe(1);
    expect(doc.items[0].id).toBe(secondItemId);
  });

  it('5. hide/show a block preserves its stored data', () => {
    let doc = createInitialDocument();
    doc = updateTermsAndNotes(doc, { notes: 'Secret note that should stay intact' });
    expect(doc.notes).toBe('Secret note that should stay intact');
    expect(doc.blocks.notes).toBe(true);

    // Hide notes block
    doc = setBlockVisibility(doc, 'notes', false);
    expect(doc.blocks.notes).toBe(false);
    expect(doc.notes).toBe('Secret note that should stay intact');

    // Show notes block again
    doc = setBlockVisibility(doc, 'notes', true);
    expect(doc.blocks.notes).toBe(true);
    expect(doc.notes).toBe('Secret note that should stay intact');
  });

  it('6. WHT eligible-line selection uses existing line IDs and cleans references when a line is removed', () => {
    let doc = createInitialDocument();
    doc = updateLineItem(doc, doc.items[0].id, { unitPrice: 1000, description: 'Base service' });
    doc = addLineItem(doc, { description: 'Service Fee', unitPrice: 2000, quantity: 1 });
    const item2Id = doc.items[1].id;

    // Enable WHT and select item2 for WHT basis
    doc = updateAdjustments(doc, { wht: { enabled: true, ratePercent: 3, basisLineItemIds: [] } });
    doc = toggleWhtBasisItem(doc, item2Id);
    expect(doc.adjustments.wht.basisLineItemIds).toEqual([item2Id]);

    // Calculate document with WHT
    let calc = calculateDocument(doc);
    expect(calc.ok).toBe(true);
    if (calc.ok) {
      // Subtotal = 1000 + 2000 = 3000
      // WHT basis = 2000, WHT 3% = 60
      // Net payable = 3000 - 60 = 2940
      expect(calc.value.subtotal).toBe(3000);
      expect(calc.value.whtBasisAmount).toBe(2000);
      expect(calc.value.whtAmount).toBe(60);
      expect(calc.value.netPayable).toBe(2940);
    }

    // Removing item2 cleans up basisLineItemIds
    doc = removeLineItem(doc, item2Id);
    expect(doc.items.length).toBe(1);
    expect(doc.adjustments.wht.basisLineItemIds).not.toContain(item2Id);
    expect(doc.adjustments.wht.basisLineItemIds).toEqual([]);

    calc = calculateDocument(doc);
    expect(calc.ok).toBe(true);
    if (calc.ok) {
      expect(calc.value.whtBasisAmount).toBe(0);
      expect(calc.value.whtAmount).toBe(0);
      expect(calc.value.netPayable).toBe(1000);
    }
  });

  it('7. Tax Invoice eligibility fails closed when requirements are unsatisfied', () => {
    let doc = createInitialDocument();

    // Default doc: individual, not_registered -> ineligible
    let eligibility = checkTaxInvoiceEligibility(doc);
    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reasons.length).toBeGreaterThan(0);

    // Attempting to setDocumentType to tax_invoice fails closed (stays quotation)
    doc = setDocumentType(doc, 'tax_invoice');
    expect(doc.documentType).toBe('quotation');

    // Satisfy all requirements:
    doc = updateBusinessProfile(doc, {
      vatStatus: 'registered',
      taxId: '1234567890123',
      branchType: 'head_office',
    });
    doc = updateAdjustments(doc, { vat: { enabled: true } });

    eligibility = checkTaxInvoiceEligibility(doc);
    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.reasons).toEqual([]);

    // Now setting document type succeeds
    doc = setDocumentType(doc, 'tax_invoice');
    expect(doc.documentType).toBe('tax_invoice');

    // If business branchType is 'branch' without branchNumber, becomes ineligible
    doc = updateBusinessProfile(doc, { branchType: 'branch', branchNumber: '' });
    eligibility = checkTaxInvoiceEligibility(doc);
    expect(eligibility.isEligible).toBe(false);
  });

  it('8. updateCustomerProfile and updateDocumentHeader update fields immutably', () => {
    let doc = createInitialDocument();
    doc = updateCustomerProfile(doc, {
      displayName: 'Acme Corp',
      taxId: '9876543210123',
      address: '456 Business Park Rd',
    });
    expect(doc.customer.displayName).toBe('Acme Corp');
    expect(doc.customer.taxId).toBe('9876543210123');

    doc = updateDocumentHeader(doc, {
      documentNumber: 'INV-2026-001',
      issueDate: '2026-08-22',
      dueDate: '2026-09-22',
    });
    expect(doc.documentNumber).toBe('INV-2026-001');
    expect(doc.dueDate).toBe('2026-09-22');
  });

  it('9. ignores unknown WHT basis ids in editor state helpers', () => {
    const doc = createInitialDocument();
    const next = toggleWhtBasisItem(doc, 'missing-line-id');
    expect(next).toBe(doc);
    expect(next.adjustments.wht.basisLineItemIds).toEqual([]);
  });

  it('10. default state uses explicit placeholders and does not invent tax/payment facts', () => {
    const doc = createInitialDocument();
    expect(doc.business.displayName).toMatch(/^\[/);
    expect(doc.customer.displayName).toMatch(/^\[/);
    expect(doc.business.branchType).toBeUndefined();
    expect(doc.customer.branchType).toBeUndefined();
    expect(doc.payment.instructions).toBeUndefined();
    expect(doc.items[0].unitPrice).toBe(0);
  });
});
