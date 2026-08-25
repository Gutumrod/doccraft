import { expect, test } from '@playwright/test';

test.describe('Phase 4 — Local Persistence + JSON Backup E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('1. autosave & refresh restores current draft accurately', async ({ page }) => {
    // 1. Fill document fields
    const docNumberInput = page.getByTestId('input-doc-number');
    await docNumberInput.fill('QT-AUTO-2026');

    const bizNameInput = page.getByTestId('input-biz-name');
    await bizNameInput.fill('บริษัท ออโต้เซฟ คอร์ปอเรชั่น จำกัด');

    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('8500');

    // Wait until draft is persisted in localStorage
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      return raw && raw.includes('QT-AUTO-2026') && raw.includes('8500');
    });

    // 2. Reload the page
    await page.reload();

    // 3. Verify restored fields in editor and preview
    await expect(page.getByTestId('input-doc-number')).toHaveValue('QT-AUTO-2026');
    await expect(page.getByTestId('input-biz-name')).toHaveValue('บริษัท ออโต้เซฟ คอร์ปอเรชั่น จำกัด');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-AUTO-2026');
    await expect(page.getByTestId('preview-block-business')).toContainText('บริษัท ออโต้เซฟ คอร์ปอเรชั่น จำกัด');
    await expect(page.getByTestId('summary-subtotal')).toContainText('8,500.00');
  });

  test('2. empty document number restores accurately on refresh with validation error and print disabled', async ({ page }) => {
    // 1. Clear document number to empty string
    const docNumberInput = page.getByTestId('input-doc-number');
    await docNumberInput.fill('');

    // Validation alert shown and print disabled
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();

    // Wait until draft is saved into localStorage with empty document number
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      return raw && raw.includes('"documentNumber":""');
    });

    // 2. Refresh page
    await page.reload();

    // 3. Exact empty documentNumber restored without falling back to default QT-0001
    await expect(page.getByTestId('input-doc-number')).toHaveValue('');
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();
    await expect(page.getByTestId('btn-preview-print')).toBeDisabled();
  });

  test('3. empty issue date restores accurately on refresh with validation error and print disabled', async ({ page }) => {
    // 1. Clear issue date to empty string
    const issueDateInput = page.getByTestId('input-issue-date');
    await issueDateInput.fill('');

    // Validation alert shown and print disabled
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();

    // Wait until draft is saved into localStorage with empty issueDate
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      return raw && raw.includes('"issueDate":""');
    });

    // 2. Refresh page
    await page.reload();

    // 3. Exact empty issueDate restored
    await expect(page.getByTestId('input-issue-date')).toHaveValue('');
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();
    await expect(page.getByTestId('btn-preview-print')).toBeDisabled();
  });

  test('4. in-progress tax invoice draft restores on refresh with validation errors visible and print disabled', async ({ page }) => {
    // 1. Select long-customer fixture (which is a valid registered Tax Invoice)
    await page.getByTestId('select-fixture').selectOption('long-customer');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('TAX-2026-9901');
    await expect(page.getByTestId('btn-print-document')).toBeEnabled();

    // 2. Make it temporarily invalid by clearing business tax ID
    const taxIdInput = page.getByTestId('input-biz-taxid');
    await taxIdInput.fill('');

    // Verification: validation alert is shown, print button disabled
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();

    // Wait until in-progress draft is saved into storage
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      return raw && raw.includes('TAX-2026-9901') && !raw.includes('0107560000123');
    });

    // 3. Refresh page
    await page.reload();

    // 4. In-progress draft must be restored accurately without losing user work
    await expect(page.getByTestId('input-doc-number')).toHaveValue('TAX-2026-9901');
    await expect(page.getByTestId('input-biz-taxid')).toHaveValue('');

    // Domain validation error must still be visible and print must remain fail-closed
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();
    await expect(page.getByTestId('btn-preview-print')).toBeDisabled();
  });

  test('5. export JSON -> reset state -> import JSON round-trip reproduces document', async ({ page }) => {
    // 1. Select one-page fixture
    await page.getByTestId('select-fixture').selectOption('one-page');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-2026-0001');

    // 2. Trigger Export JSON
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('doccraft-QT-2026-0001');

    // Read exported file content
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const exportedJson = Buffer.concat(chunks).toString('utf-8');
    const parsedEnvelope = JSON.parse(exportedJson);
    expect(parsedEnvelope.app).toBe('DocCraft');
    expect(parsedEnvelope.schemaVersion).toBe(2);

    // 3. Reset document state via New Document button
    await page.getByTestId('btn-new-document').click();
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-0001');

    // 4. Import the exported JSON file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-import-json').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedJson, 'utf-8'),
    });

    // 5. Verify restored document matches original export
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-2026-0001');
    await expect(page.getByTestId('preview-block-business')).toContainText('บริษัท สยาม คราฟต์ โซลูชั่นส์ จำกัด');
    await expect(page.getByTestId('summary-subtotal')).toContainText('127,500.00');
  });

  test('6. backup round-trip for in-progress domain-invalid draft restores draft, shows errors, and blocks print', async ({ page }) => {
    // 1. Select long-customer (Tax Invoice) and make it invalid by clearing business tax ID
    await page.getByTestId('select-fixture').selectOption('long-customer');
    const taxIdInput = page.getByTestId('input-biz-taxid');
    await taxIdInput.fill('');
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();

    // 2. Export in-progress draft
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').click();
    const download = await downloadPromise;

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const exportedJson = Buffer.concat(chunks).toString('utf-8');

    // 3. Reset to fresh document
    await page.getByTestId('btn-new-document').click();
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-0001');

    // 4. Import in-progress backup
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-import-json').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'in-progress-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedJson, 'utf-8'),
    });

    // 5. Document restored, validation error visible, and print disabled
    await expect(page.getByTestId('preview-doc-number')).toHaveText('TAX-2026-9901');
    await expect(page.getByTestId('input-biz-taxid')).toHaveValue('');
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();
    await expect(page.getByTestId('btn-preview-print')).toBeDisabled();
  });

  test('7. corrupted or invalid JSON import is rejected and preserves previous document state', async ({ page }) => {
    // 1. Setup specific doc number
    await page.getByTestId('input-doc-number').fill('QT-PRESERVED-123');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-PRESERVED-123');

    // 2. Attempt import of corrupted JSON
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-import-json').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'corrupted.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ "broken": "bad json ...', 'utf-8'),
    });

    // 3. Error alert should be visible
    await expect(page.getByTestId('import-error-alert')).toBeVisible();
    await expect(page.getByTestId('import-error-alert')).toContainText('นำเข้าไฟล์ไม่สำเร็จ');

    // 4. Previous document state MUST be preserved
    await expect(page.getByTestId('input-doc-number')).toHaveValue('QT-PRESERVED-123');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-PRESERVED-123');
  });

  test('8. duplicate line-item IDs from untrusted backup are rejected and current state is preserved', async ({ page }) => {
    await page.getByTestId('select-fixture').selectOption('one-page');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const envelope = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    envelope.document.items = [
      { ...envelope.document.items[0], id: 'dup-id', description: 'row one' },
      { ...envelope.document.items[0], id: 'dup-id', description: 'row two' },
    ];

    await page.getByTestId('input-doc-number').fill('QT-PRESERVE-IDENTITY');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('btn-import-json').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'duplicate-id.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(envelope), 'utf-8'),
    });

    await expect(page.getByTestId('import-error-alert')).toBeVisible();
    await expect(page.getByTestId('input-doc-number')).toHaveValue('QT-PRESERVE-IDENTITY');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-PRESERVE-IDENTITY');
    await expect(page.locator('[data-testid="input-item-desc-dup-id"]')).toHaveCount(0);
  });

  test('9. simulated storage quota error surfaces notice while editor and export remain operational', async ({ page }) => {
    // Mock localStorage.setItem to throw QuotaExceededError
    await page.addInitScript(() => {
      window.localStorage.setItem = () => {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      };
    });

    await page.goto('/');

    // Edit form fields
    await page.getByTestId('input-doc-number').fill('QT-QUOTA-TEST');
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('3000');

    // Storage failure alert should be displayed
    await expect(page.getByTestId('storage-notice-alert')).toBeVisible();
    await expect(page.getByTestId('storage-notice-alert')).toContainText('ไม่สามารถบันทึกข้อมูลลงในเบราว์เซอร์ได้');

    // Editor and preview calculations must continue working
    await expect(page.getByTestId('summary-subtotal')).toContainText('3,000.00');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-QUOTA-TEST');

    // JSON export must still work even when storage save fails
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('doccraft-QT-QUOTA-TEST');
  });

  test('10. responsive viewports render cleanly with persistence controls without overflow', async ({ page }) => {
    // 375px mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Mobile export button in bottom bar triggers export
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-mobile-export').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('doccraft-');
  });

  test('11. Phase 3 print output strictly hides all persistence and backup UI controls', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });

    // Verify all backup / storage UI is hidden in print
    const btnExportDisplay = await page.getByTestId('btn-export-json').evaluate((el) => window.getComputedStyle(el).display);
    expect(btnExportDisplay).toBe('none');

    const btnImportDisplay = await page.getByTestId('btn-import-json').evaluate((el) => window.getComputedStyle(el).display);
    expect(btnImportDisplay).toBe('none');

    const btnNewDisplay = await page.getByTestId('btn-new-document').evaluate((el) => window.getComputedStyle(el).display);
    expect(btnNewDisplay).toBe('none');

    // Verify document preview remains visible
    const previewContainer = page.getByTestId('document-preview-container');
    await expect(previewContainer).toBeVisible();
  });
});
