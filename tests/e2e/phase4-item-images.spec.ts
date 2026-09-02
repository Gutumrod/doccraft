import { expect, test, type Download, type Page } from '@playwright/test';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function attachPng(page: Page, itemId: string) {
  await page.getByTestId(`input-item-image-${itemId}`).setInputFiles({
    name: `${itemId}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  });
  await expect(page.getByTestId(`preview-item-image-${itemId}`)).toBeVisible();
}

async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

test.describe('Phase 4 remediation — item image persistence pipeline E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByTestId('select-fixture').selectOption('one-page');
    await page.getByTestId('toggle-block-itemImages').click();
  });

  test('attach -> persist -> reload -> export/import -> targeted remove -> print', async ({ page }) => {
    await attachPng(page, 'item-1');
    await attachPng(page, 'item-2');

    const firstSrc = await page.getByTestId('preview-item-image-item-1').getAttribute('src');
    expect(firstSrc).toMatch(/^data:image\/(webp|jpeg);base64,/);

    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('doccraft_current_draft_v1');
      if (!raw) return false;
      const envelope = JSON.parse(raw);
      return envelope.schemaVersion === 2
        && envelope.document.schemaVersion === 2
        && typeof envelope.document.items?.[0]?.image?.dataUrl === 'string'
        && typeof envelope.document.items?.[1]?.image?.dataUrl === 'string';
    });

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('doccraft_current_draft_v1') ?? '{}'));
    expect(stored.schemaVersion).toBe(2);
    expect(stored.document.items[0].image.width).toBeLessThanOrEqual(960);
    expect(stored.document.items[0].image.height).toBeLessThanOrEqual(960);

    await page.reload();
    await expect(page.getByTestId('preview-item-image-item-1')).toBeVisible();
    await expect(page.getByTestId('preview-item-image-item-2')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').dispatchEvent('click');
    const exportedJson = await readDownload(await downloadPromise);
    const exported = JSON.parse(exportedJson);
    expect(exported.schemaVersion).toBe(2);
    expect(exported.document.items[0].image.dataUrl).toMatch(/^data:image\/(webp|jpeg);base64,/);

    await page.getByTestId('btn-new-document').click();
    await expect(page.getByTestId('preview-item-image-item-1')).toHaveCount(0);
    await page.getByTestId('input-import-file').setInputFiles({
      name: 'image-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedJson, 'utf-8'),
    });
    await expect(page.getByTestId('preview-item-image-item-1')).toBeVisible();
    await expect(page.getByTestId('preview-item-image-item-2')).toBeVisible();

    await page.getByTestId('btn-remove-item-image-item-1').click();
    await expect(page.getByTestId('preview-item-image-item-1')).toHaveCount(0);
    await expect(page.getByTestId('preview-item-image-item-2')).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('preview-item-image-item-2')).toBeVisible();
    const removeDisplay = await page.getByTestId('btn-remove-item-image-item-2').evaluate((element) => getComputedStyle(element).display);
    expect(removeDisplay).toBe('none');

    await page.emulateMedia({ media: 'screen' });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  });

  test('unsupported replacement shows inline error and preserves previous image', async ({ page }) => {
    await attachPng(page, 'item-1');
    const beforeSrc = await page.getByTestId('preview-item-image-item-1').getAttribute('src');

    await page.getByTestId('input-item-image-item-1').setInputFiles({
      name: 'unsupported.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image', 'utf-8'),
    });

    await expect(page.getByTestId('item-image-error-item-1')).toBeVisible();
    await expect(page.getByTestId('item-image-error-item-1')).toContainText('JPEG, PNG หรือ WebP');
    await expect(page.getByTestId('preview-item-image-item-1')).toHaveAttribute('src', beforeSrc ?? '');
  });

  test('quota failure keeps accepted image/editor state and JSON export available', async ({ page }) => {
    await attachPng(page, 'item-1');
    const beforeSrc = await page.getByTestId('preview-item-image-item-1').getAttribute('src');

    await page.evaluate(() => {
      Storage.prototype.setItem = function setItemQuotaFailure() {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      };
    });
    await page.getByTestId('input-doc-number').fill('QT-IMAGE-QUOTA');

    await expect(page.getByTestId('storage-notice-alert')).toBeVisible();
    await expect(page.getByTestId('preview-doc-number')).toHaveText('QT-IMAGE-QUOTA');
    await expect(page.getByTestId('preview-item-image-item-1')).toHaveAttribute('src', beforeSrc ?? '');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-export-json').dispatchEvent('click');
    const exportedJson = await readDownload(await downloadPromise);
    const exported = JSON.parse(exportedJson);
    expect(exported.document.documentNumber).toBe('QT-IMAGE-QUOTA');
    expect(exported.document.items[0].image.dataUrl).toBe(beforeSrc);
  });
});
