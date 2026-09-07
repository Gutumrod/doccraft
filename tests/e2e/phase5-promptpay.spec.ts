import { expect, test } from '@playwright/test';

test.describe('Phase 5 — PromptPay Document QR E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('valid mobile PromptPay renders QR and remains printable', async ({ page }) => {
    const firstRow = page.locator('[data-testid^="item-row-"]').first();
    await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');
    await page.getByTestId('input-promptpay-enabled').check();
    await page.getByTestId('input-promptpay-identifier').fill('081-234-5678');
    await page.getByTestId('select-promptpay-amount-mode').selectOption('net_payable');

    await expect(page.getByTestId('preview-promptpay-qr')).toBeVisible();
    await expect(page.getByTestId('preview-promptpay-qr')).toContainText('0812345678');
    await expect(page.getByTestId('preview-promptpay-qr')).toContainText('1,000.00');
    await expect(page.getByTestId('btn-print-document')).toBeEnabled();
  });
  test('invalid PromptPay target fails closed and disables print', async ({ page }) => {
    await page.getByTestId('input-promptpay-enabled').check();
    await page.getByTestId('input-promptpay-identifier').fill('021234567');

    await expect(page.getByTestId('preview-promptpay-qr')).toHaveCount(0);
    await expect(page.getByTestId('global-validation-alert')).toContainText('PromptPay identifier is invalid');
    await expect(page.getByTestId('btn-print-document')).toBeDisabled();
  });

  test('PromptPay configuration survives autosave and refresh', async ({ page }) => {
    await page.getByTestId('input-promptpay-enabled').check();
    await page.getByTestId('select-promptpay-identifier-type').selectOption('national_id_tax_id');
    await page.getByTestId('input-promptpay-identifier').fill('1234567890123');
    await page.getByTestId('select-promptpay-amount-mode').selectOption('none');
    await expect(page.getByTestId('preview-promptpay-qr')).toBeVisible();
    await page.waitForTimeout(250);

    await page.reload();
    await expect(page.getByTestId('input-promptpay-enabled')).toBeChecked();
    await expect(page.getByTestId('select-promptpay-identifier-type')).toHaveValue('national_id_tax_id');
    await expect(page.getByTestId('input-promptpay-identifier')).toHaveValue('1234567890123');
    await expect(page.getByTestId('preview-promptpay-qr')).toBeVisible();
  });
});
