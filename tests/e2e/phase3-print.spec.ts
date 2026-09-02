import { expect, test } from '@playwright/test';

test.describe('Phase 3 — A4 Preview + Native Print E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. print button invokes window.print() natively', async ({ page }) => {
    // Fill a valid price first so document is valid
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    // Spy on window.print
    await page.evaluate(() => {
      const win = window as unknown as { __printed: boolean; print: () => void };
      win.__printed = false;
      win.print = () => {
        win.__printed = true;
      };
    });

    const printBtn = page.getByTestId('btn-print-document');
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toBeEnabled();
    await printBtn.click();

    const wasPrinted = await page.evaluate(() => {
      const win = window as unknown as { __printed: boolean };
      return win.__printed;
    });
    expect(wasPrinted).toBe(true);
  });

  test('2. preview-embedded and mobile print buttons also invoke window.print()', async ({ page }) => {
    // Fill a valid price first so document is valid
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    // Desktop preview print button
    await page.evaluate(() => {
      const win = window as unknown as { __printedCount: number; print: () => void };
      win.__printedCount = 0;
      win.print = () => {
        win.__printedCount = (win.__printedCount || 0) + 1;
      };
    });

    const previewPrintBtn = page.getByTestId('btn-preview-print');
    await expect(previewPrintBtn).toBeVisible();
    await expect(previewPrintBtn).toBeEnabled();
    await previewPrintBtn.click();

    let count = await page.evaluate(() => {
      const win = window as unknown as { __printedCount: number };
      return win.__printedCount;
    });
    expect(count).toBe(1);

    // Mobile view print button
    await page.setViewportSize({ width: 375, height: 667 });
    const mobilePrintBtn = page.getByTestId('btn-mobile-print');
    await expect(mobilePrintBtn).toBeVisible();
    await expect(mobilePrintBtn).toBeEnabled();
    await mobilePrintBtn.click();

    count = await page.evaluate(() => {
      const win = window as unknown as { __printedCount: number };
      return win.__printedCount;
    });
    expect(count).toBe(2);
  });

  test('3. print media emulation hides editor chrome and preserves A4 document preview', async ({ page }) => {
    // Switch to print media
    await page.emulateMedia({ media: 'print' });

    // Verify non-document UI is hidden under print styles
    const headerDisplay = await page.locator('header').evaluate((el) => window.getComputedStyle(el).display);
    expect(headerDisplay).toBe('none');

    const editorPaneDisplay = await page.locator('.editor-pane').evaluate((el) => window.getComputedStyle(el).display);
    expect(editorPaneDisplay).toBe('none');

    const mobileBarDisplay = await page.locator('.mobile-bottom-bar').evaluate((el) => window.getComputedStyle(el).display);
    expect(mobileBarDisplay).toBe('none');

    // Verify preview container is visible
    const previewContainer = page.getByTestId('document-preview-container');
    await expect(previewContainer).toBeVisible();

    const previewDisplay = await previewContainer.evaluate((el) => window.getComputedStyle(el).display);
    expect(previewDisplay).not.toBe('none');

    // Screen-only slate background must never leak into native print output.
    const appShellBackground = await page.locator('.doccraft-app-shell').evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(appShellBackground).toBe('rgb(255, 255, 255)');
    const previewBackground = await previewContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(previewBackground).toBe('rgb(255, 255, 255)');

    // Switch back to screen
    await page.emulateMedia({ media: 'screen' });
    const headerDisplayScreen = await page.locator('header').evaluate((el) => window.getComputedStyle(el).display);
    expect(headerDisplayScreen).not.toBe('none');
  });

  test('4. representative one-page quotation fixture renders complete document structure', async ({ page }) => {
    // Select one-page fixture
    await page.getByTestId('select-fixture').selectOption('one-page');

    // Verify document type and header
    const preview = page.getByTestId('document-preview-container');
    await expect(preview).toContainText('ใบเสนอราคา');
    await expect(preview).toContainText('QUOTATION');
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-2026-0001');

    // Verify business & customer details
    await expect(page.getByTestId('preview-block-business')).toContainText('บริษัท สยาม คราฟต์ โซลูชั่นส์ จำกัด');
    await expect(page.getByTestId('preview-block-business')).toContainText('0105559012345');
    await expect(page.getByTestId('preview-block-customer')).toContainText('บริษัท นวัตกรรมดิจิทัล สากล จำกัด');
    await expect(page.getByTestId('preview-block-customer')).toContainText('สาขา 00002');

    // Verify 3 line items
    const rows = preview.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('ออกแบบระบบและสถาปัตยกรรมซอฟต์แวร์');

    // Verify summary, payment, terms, notes, signatures
    await expect(page.getByTestId('preview-block-adjustments')).toContainText('127,500.00 ฿');
    await expect(page.getByTestId('preview-block-adjustments')).toContainText('ภาษีมูลค่าเพิ่ม (VAT 7%)');
    await expect(page.getByTestId('preview-block-adjustments')).toContainText('เงินมัดจำ (Deposit)');
    await expect(page.getByTestId('preview-block-payment')).toContainText('KBANK');
    await expect(page.getByTestId('preview-block-terms')).toContainText('ใบเสนอราคานี้มีผลบังคับใช้ 30 วัน');
    await expect(page.getByTestId('preview-block-notes')).toContainText('4-6 สัปดาห์');
    await expect(page.getByTestId('preview-block-signatures')).toContainText('ผู้มีอำนาจลงนาม');
    // Keep the representative one-page fixture within a conservative A4 print-height budget.
    // Native Chrome/Edge Print Preview remains the final acceptance gate.
    await page.emulateMedia({ media: 'print' });
    const printHeight = await preview.evaluate((el) => el.getBoundingClientRect().height);
    expect(printHeight).toBeLessThanOrEqual(1000);
    await page.emulateMedia({ media: 'screen' });
  });

  test('5. representative multi-page fixture contains all 22 rows with break-avoid rules', async ({ page }) => {
    // Select multi-page fixture
    await page.getByTestId('select-fixture').selectOption('multi-page');

    const preview = page.getByTestId('document-preview-container');
    await expect(preview).toContainText('ใบแจ้งหนี้');
    await expect(preview).toContainText('INVOICE');

    // Verify 22 item rows rendered
    const rows = preview.locator('tbody tr');
    await expect(rows).toHaveCount(22);

    // Verify break-avoid styling is applied to rows
    const firstRowHasAvoidBreak = await rows.first().evaluate((el) => el.classList.contains('print-avoid-break'));
    expect(firstRowHasAvoidBreak).toBe(true);

    // Verify table headers use table-header-group
    const theadDisplay = await preview.locator('thead').evaluate((el) => window.getComputedStyle(el).display);
    expect(theadDisplay).toBe('table-header-group');
  });

  test('6. Thai text and long customer/address strings render cleanly without layout overflow', async ({ page }) => {
    // 1. Rich Thai text fixture
    await page.getByTestId('select-fixture').selectOption('thai-text');
    const preview = page.getByTestId('document-preview-container');
    await expect(preview).toContainText('ใบเสร็จรับเงิน');
    await expect(preview).toContainText('นายกิตติศักดิ์ พรหมมินทร์ปรีชากุล');
    await expect(preview).toContainText('คุณหญิงประไพศรี วรเวชชานนท์ประเสริฐสุข');

    // 2. Long customer & address fixture
    await page.getByTestId('select-fixture').selectOption('long-customer');
    await expect(preview).toContainText('ใบกำกับภาษี');
    await expect(preview).toContainText('บริษัท สยามเอนเตอร์ไพรส์อินโนเวชั่นเน็ตเวิร์กแอนด์เทคโนโลยีซิสเต็มส์โกลบอลจำกัด (มหาชน)');
    await expect(preview).toContainText('บริษัท ซูเปอร์พรีเมียมโกลบอลโลจิสติกส์อินเตอร์เนชั่นแนลเทรดดิ้งแอนด์ทรานสปอร์ตเตชั่นเซอร์วิสเซส');

    // Check no horizontal document blowout
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('7. optional blocks toggle in preview and render accurately', async ({ page }) => {
    // 1. Minimal blocks fixture (customer, payment, terms, signatures turned off)
    await page.getByTestId('select-fixture').selectOption('minimal');
    await expect(page.getByTestId('preview-block-business')).toBeVisible();
    await expect(page.getByTestId('preview-block-customer')).toHaveCount(0);
    await expect(page.getByTestId('preview-block-payment')).toHaveCount(0);
    await expect(page.getByTestId('preview-block-terms')).toHaveCount(0);
    await expect(page.getByTestId('preview-block-signatures')).toHaveCount(0);

    // 2. With item images fixture
    await page.getByTestId('select-fixture').selectOption('with-images');
    await expect(page.getByTestId('preview-item-image-item-1')).toBeVisible();
    await expect(page.getByTestId('preview-item-image-item-1')).toHaveAttribute(
      'src',
      /^data:image\/(jpeg|webp);base64,/
    );
  });

  test('8. 375px mobile and 768px tablet force document preview visible in print media even from Editor tab', async ({ page }) => {
    // Test on 375px mobile while on Editor tab (activeTab === 'editor')
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('tab-switch-editor')).toHaveClass(/bg-white/);

    // Switch to print media while on mobile Editor tab
    await page.emulateMedia({ media: 'print' });

    // The document preview container must be visible in print media
    const previewContainerMobile = page.getByTestId('document-preview-container');
    const previewDisplayMobile = await previewContainerMobile.evaluate((el) => window.getComputedStyle(el).display);
    expect(previewDisplayMobile).toBe('block');

    // Non-document chrome must remain hidden
    const editorDisplayMobile = await page.locator('.editor-pane').evaluate((el) => window.getComputedStyle(el).display);
    expect(editorDisplayMobile).toBe('none');

    // Reset back to screen
    await page.emulateMedia({ media: 'screen' });

    // Test on 768px tablet while on Editor tab
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.emulateMedia({ media: 'print' });

    const previewContainerTablet = page.getByTestId('document-preview-container');
    const previewDisplayTablet = await previewContainerTablet.evaluate((el) => window.getComputedStyle(el).display);
    expect(previewDisplayTablet).toBe('block');
  });

  test('9. fail-closed printing: invalid document disables print controls and blocks window.print()', async ({ page }) => {
    // 1. Setup a valid Tax Invoice
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');

    await page.getByTestId('business-vat-registered').click();
    await page.getByTestId('input-biz-taxid').fill('0105559999999');
    await page.getByTestId('toggle-vat').click();
    await page.getByTestId('biz-branch-subbranch').click();
    await page.getByTestId('input-biz-branch-number').fill('00001');

    const taxInvoiceBtn = page.getByTestId('doc-type-tax_invoice');
    await expect(taxInvoiceBtn).toBeEnabled();
    await taxInvoiceBtn.click();

    // Verify document is valid and print button is enabled
    const desktopPrintBtn = page.getByTestId('btn-print-document');
    const previewPrintBtn = page.getByTestId('btn-preview-print');
    await expect(desktopPrintBtn).toBeEnabled();
    await expect(previewPrintBtn).toBeEnabled();

    // Setup print spy
    await page.evaluate(() => {
      const win = window as unknown as { __printed: boolean; print: () => void };
      win.__printed = false;
      win.print = () => {
        win.__printed = true;
      };
    });

    // 2. Make the document invalid after tax_invoice selection (e.g. clear branch number)
    await page.getByTestId('input-biz-branch-number').fill('');

    // Global validation alert appears
    await expect(page.getByTestId('global-validation-alert')).toBeVisible();

    // 3. Confirm all print buttons are disabled
    await expect(desktopPrintBtn).toBeDisabled();
    await expect(previewPrintBtn).toBeDisabled();

    // 4. Force click on disabled print button or trigger handlePrint
    await previewPrintBtn.click({ force: true });

    // Assert window.print was NOT invoked
    const wasPrinted = await page.evaluate(() => {
      const win = window as unknown as { __printed: boolean };
      return win.__printed;
    });
    expect(wasPrinted).toBe(false);
  });
});
