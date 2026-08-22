import { expect, test } from '@playwright/test';

test.describe('Phase 2 — DocCraft Editor + Modular Blocks E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. create/edit a normal quotation from the default state', async ({ page }) => {
    // Check initial title and default doc type
    await expect(page.locator('header h1')).toContainText('DocCraft');
    const docNumberInput = page.getByTestId('input-doc-number');
    await expect(docNumberInput).toHaveValue('QT-0001');

    // Change document number
    await docNumberInput.fill('QT-2026-9999');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-2026-9999');

    // Change business name
    const bizNameInput = page.getByTestId('input-biz-name');
    await bizNameInput.fill('สยามดีไซน์ สตูดิโอ');

    // Change customer name
    const custNameInput = page.getByTestId('input-cust-name');
    await custNameInput.fill('บริษัท ผู้ว่าจ้างชั้นนำ จำกัด');

    // Verify preview reflects changes
    await expect(page.getByTestId('preview-block-business')).toContainText('สยามดีไซน์ สตูดิโอ');
    await expect(page.getByTestId('preview-block-customer')).toContainText('บริษัท ผู้ว่าจ้างชั้นนำ จำกัด');
  });

  test('2. add a second line, apply discount and see live totals update', async ({ page }) => {
    // Start from an explicit zero-value placeholder, then enter a real amount.
    await expect(page.getByTestId('summary-subtotal')).toContainText('0.00');
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');
    await expect(page.getByTestId('summary-subtotal')).toContainText('1,000.00');

    // Add a second line item
    await page.getByTestId('btn-add-item').click();
    const rows = page.locator('[data-testid^="item-row-"]');
    await expect(rows).toHaveCount(2);

    // Fill second line price to 2000
    const secondRow = rows.nth(1);
    const priceInput = secondRow.locator('[data-testid^="input-item-price-"]');
    await priceInput.fill('2000');

    // Subtotal should now be 1000 + 2000 = 3000
    await expect(page.getByTestId('summary-subtotal')).toContainText('3,000.00');

    // Apply document-level discount 10%
    await page.getByTestId('select-doc-discount-mode').selectOption('percent');
    await page.getByTestId('input-doc-discount-val').fill('10');

    // Discount 10% of 3000 = 300 -> Net = 2700
    await expect(page.getByTestId('summary-doc-discount')).toContainText('300.00');
    await expect(page.getByTestId('summary-net-payable')).toContainText('2,700.00');
  });

  test('3. VAT-registered flow can enable VAT and exposes eligible Tax Invoice path', async ({ page }) => {
    const taxInvoiceBtn = page.getByTestId('doc-type-tax_invoice');

    // Initially disabled because tax-invoice requirements are incomplete.
    await expect(taxInvoiceBtn).toBeDisabled();

    // Give the document a real taxable amount.
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    // Register VAT and fill tax ID.
    await page.getByTestId('business-vat-registered').click();
    await page.getByTestId('input-biz-taxid').fill('0105559999999');

    // Enable VAT 7%.
    await page.getByTestId('toggle-vat').click();

    // Selecting branch must not invent a branch number; Tax Invoice stays locked.
    await page.getByTestId('biz-branch-subbranch').click();
    await expect(taxInvoiceBtn).toBeDisabled();
    await page.getByTestId('input-biz-branch-number').fill('00001');

    // Tax invoice should now be enabled/clickable.
    await expect(taxInvoiceBtn).toBeEnabled();
    await taxInvoiceBtn.click();

    await expect(page.getByTestId('document-preview-container')).toContainText('ใบกำกับภาษี');
    await expect(page.getByTestId('document-preview-container')).toContainText('TAX INVOICE');
    await expect(page.getByTestId('summary-vat-amount')).toContainText('70.00');
  });

  test('4. non-registered flow cannot present a valid Tax Invoice state', async ({ page }) => {
    const taxInvoiceBtn = page.getByTestId('doc-type-tax_invoice');

    // Non registered -> Tax Invoice button is disabled
    await expect(page.getByTestId('business-vat-not-registered')).toHaveClass(/border-indigo-600/);
    await expect(taxInvoiceBtn).toBeDisabled();

    // VAT toggle is also disabled
    await expect(page.getByTestId('toggle-vat')).toBeDisabled();
  });

  test('5. WHT eligible-line control changes calculated WHT basis/amount', async ({ page }) => {
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    // Add second line (price 2000)
    await page.getByTestId('btn-add-item').click();
    const rows = page.locator('[data-testid^="item-row-"]');
    await rows.nth(1).locator('[data-testid^="input-item-price-"]').fill('2000');

    // Enable WHT
    await page.getByTestId('toggle-wht').click();
    await page.getByTestId('input-wht-rate').fill('3');

    // Initially no lines selected -> WHT basis is 0
    await expect(page.getByTestId('summary-net-payable')).toContainText('3,000.00');

    // Select second line for WHT (line 2 price is 2000)
    const checkboxes = page.locator('[data-testid^="wht-line-checkbox-"]');
    await checkboxes.nth(1).check();

    // WHT = 3% of 2000 = 60 -> Net payable = 3000 - 60 = 2940
    await expect(page.getByTestId('summary-wht-amount')).toContainText('60.00');
    await expect(page.getByTestId('summary-net-payable')).toContainText('2,940.00');
  });

  test('6. block hide → show preserves the field value entered before hiding', async ({ page }) => {
    // Fill custom terms text
    const termsInput = page.getByTestId('input-doc-terms');
    const customTerms = 'ข้อตกลงพิเศษสำหรับการทดสอบระบบ Phase 2';
    await termsInput.fill(customTerms);

    // Verify in preview
    await expect(page.getByTestId('preview-block-terms')).toContainText(customTerms);

    // Hide terms block
    await page.getByTestId('toggle-block-terms').click();
    await expect(page.getByTestId('preview-block-terms')).toHaveCount(0);

    // Show terms block again
    await page.getByTestId('toggle-block-terms').click();
    await expect(page.getByTestId('preview-block-terms')).toHaveCount(1);
    await expect(page.getByTestId('preview-block-terms')).toContainText(customTerms);
    await expect(page.getByTestId('input-doc-terms')).toHaveValue(customTerms);
  });

  test('7. 375px phone completes representative editor flow without horizontal blocking overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify compact switcher is visible
    await expect(page.getByTestId('tab-switch-editor')).toBeVisible();
    await expect(page.getByTestId('tab-switch-preview')).toBeVisible();

    // Check that there is no horizontal page overflow (scrollWidth <= clientWidth + tolerance)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Edit form on mobile and enter an explicit amount.
    await page.getByTestId('input-doc-number').fill('QT-M-001');
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    // Switch to preview tab
    await page.getByTestId('tab-switch-preview').click();
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-M-001');

    // Mobile sticky footer displays payable amount
    await expect(page.getByTestId('mobile-net-payable')).toContainText('1,000.00');
  });

  test('8. representative 768px tablet uses compact Editor/Preview switcher', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // In tablet mode (<1024px), tab switcher should be visible
    await expect(page.getByTestId('tab-switch-editor')).toBeVisible();
    await expect(page.getByTestId('tab-switch-preview')).toBeVisible();

    // Switch to Preview and back to Editor
    await page.getByTestId('tab-switch-preview').click();
    await expect(page.getByTestId('document-preview-container')).toBeVisible();

    await page.getByTestId('tab-switch-editor').click();
    await expect(page.getByTestId('input-doc-number')).toBeVisible();
  });

  test('9. >=1024px desktop renders editor + preview simultaneously', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });

    // Compact switcher should be hidden on desktop
    await expect(page.getByTestId('tab-switch-editor')).toBeHidden();

    // Both editor controls and live preview must be simultaneously visible
    await expect(page.getByTestId('input-doc-number')).toBeVisible();
    await expect(page.getByTestId('document-preview-container')).toBeVisible();
  });
});
