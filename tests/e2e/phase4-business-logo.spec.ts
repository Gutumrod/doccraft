import { expect, test, type Page } from '@playwright/test';

const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function attachLogo(page: Page, name = 'business-logo.png', mimeType = 'image/png') {
  await page.getByTestId('input-business-logo').setInputFiles({
    name,
    mimeType,
    buffer: Buffer.from(TRANSPARENT_PNG_BASE64, 'base64'),
  });
  await expect(page.getByTestId('preview-business-logo')).toBeVisible();
  await expect(page.getByTestId('preview-business-logo')).toHaveAttribute('src', /^data:image\/(webp|jpeg);base64,/);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

test.describe('Phase 4.1 — business logo branding E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('upload -> failed replacement preserves logo -> hide/show -> refresh -> print controls hidden', async ({ page }) => {
    await page.getByTestId('select-fixture').selectOption('one-page');

    await attachLogo(page);
    const acceptedSrc = await page.getByTestId('preview-business-logo').getAttribute('src');
    expect(acceptedSrc).toMatch(/^data:image\/(webp|jpeg);base64,/);

    await page.getByTestId('input-business-logo').setInputFiles({
      name: 'not-a-logo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image', 'utf-8'),
    });
    await expect(page.getByTestId('business-logo-error')).toBeVisible();
    await expect(page.getByTestId('business-logo-error')).toContainText('JPEG, PNG หรือ WebP');
    await expect(page.getByTestId('preview-business-logo')).toHaveAttribute('src', acceptedSrc ?? '');

    await page.getByTestId('toggle-block-businessLogo').click();
    await expect(page.getByTestId('preview-business-logo')).toHaveCount(0);
    await expect(page.getByTestId('business-logo-editor')).toHaveCount(0);
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      if (!raw) return false;
      const envelope = JSON.parse(raw);
      return envelope.document.blocks.businessLogo === false
        && typeof envelope.document.branding?.logo?.dataUrl === 'string';
    });
    const hiddenDraft = await page.evaluate(() => JSON.parse(window.localStorage.getItem('doccraft_current_draft_v1') ?? '{}'));
    expect(hiddenDraft.document.branding.logo.dataUrl).toBe(acceptedSrc);
    expect(hiddenDraft.document.blocks.businessLogo).toBe(false);

    await page.getByTestId('toggle-block-businessLogo').click();
    await expect(page.getByTestId('preview-business-logo')).toHaveAttribute('src', acceptedSrc ?? '');

    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      if (!raw) return false;
      const envelope = JSON.parse(raw);
      return envelope.schemaVersion === 3
        && envelope.document.schemaVersion === 3
        && envelope.document.blocks.businessLogo === true
        && typeof envelope.document.branding?.logo?.dataUrl === 'string';
    });

    await page.reload();
    await expect(page.getByTestId('preview-business-logo')).toHaveAttribute('src', acceptedSrc ?? '');

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('preview-business-logo')).toBeVisible();
    const logoBounds = await page.getByTestId('preview-business-logo').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(logoBounds.height).toBeGreaterThanOrEqual(36);
    expect(logoBounds.height).toBeLessThanOrEqual(42);
    expect(logoBounds.width).toBeLessThanOrEqual(162);

    const removeDisplay = await page.getByTestId('btn-remove-business-logo').evaluate((element) => getComputedStyle(element).display);
    expect(removeDisplay).toBe('none');
    const uploadDisplay = await page.getByTestId('input-business-logo').evaluate((element) => getComputedStyle(element).display);
    expect(uploadDisplay).toBe('none');
  });

  test('no-logo and transparent-source preview/print layouts avoid horizontal overflow', async ({ page }) => {
    await page.getByTestId('select-fixture').selectOption('one-page');
    await expect(page.getByTestId('preview-business-logo')).toHaveCount(0);
    await expect(page.getByTestId('preview-block-business')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('select-fixture').selectOption('long-customer');
    await attachLogo(page, 'transparent-logo.png', 'image/png');
    await expect(page.getByTestId('preview-block-business')).toContainText(
      'บริษัท สยามเอนเตอร์ไพรส์อินโนเวชั่นเน็ตเวิร์กแอนด์เทคโนโลยีซิสเต็มส์โกลบอลจำกัด',
    );
    await expectNoHorizontalOverflow(page);

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('preview-business-logo')).toBeVisible();
    const printOverflow = await page.getByTestId('document-preview-container').evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(printOverflow.scrollWidth).toBeLessThanOrEqual(printOverflow.clientWidth + 2);
    const printBounds = await page.getByTestId('preview-business-logo').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(printBounds.height).toBeGreaterThanOrEqual(36);
    expect(printBounds.height).toBeLessThanOrEqual(42);
    expect(printBounds.width).toBeLessThanOrEqual(162);
  });
});
