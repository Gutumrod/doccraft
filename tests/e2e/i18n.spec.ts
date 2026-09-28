import { expect, test } from './test-fixtures';

const thaiScript = /[\u0E00-\u0E7F]/;

test('English UI uses the saved cookie and leaves generated documents in their existing language', async ({ page }) => {
  await page.context().addCookies([{ name: 'doccraft_locale', value: 'en', url: 'http://127.0.0.1:3005' }]);
  await page.addInitScript(() => window.localStorage.removeItem('doccraft_document_locale'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('language-toggle')).toHaveText('ไทย');
  await expect(page.locator('[data-document-output="true"]')).toContainText('ใบเสนอราคา');
  await page.getByTestId('document-language-select').selectOption('en');
  await expect(page.locator('[data-document-output="true"]')).toContainText('QUOTATION');
  await expect(page.locator('[data-document-output="true"]')).toContainText('Subtotal:');

  const uiText = await page.locator('body').evaluate((body) => {
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-document-output="true"], [data-testid="language-toggle"], input, textarea, select, script, style, noscript').forEach((element) => element.remove());
    return clone.innerText;
  });
  expect(uiText).not.toMatch(thaiScript);
  await page.getByTestId('language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.getByTestId('language-toggle')).toHaveText('EN');
  await expect(page.locator('[data-document-output="true"]')).toContainText('QUOTATION');
  expect(await page.evaluate(() => document.cookie)).toContain('doccraft_locale=th');
});

test('Thai is the default locale when no preference cookie is present', async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => window.localStorage.removeItem('doccraft_document_locale'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.getByTestId('language-toggle')).toHaveText('EN');
  expect(await page.evaluate(() => document.cookie)).toContain('doccraft_locale=th');
});
