import { expect, test } from './test-fixtures';

test.describe('Phase 6 — Public Pilot release readiness', () => {
  test('publishes the local-first Public Pilot notice and real support entry point', async ({ page }) => {
    await page.goto('/');

    const notice = page.getByTestId('public-pilot-notice');
    await expect(notice).toBeVisible();
    await notice.locator('summary').click();
    await expect(notice).toContainText('ยังไม่มี Cloud Backup');
    await expect(notice).toContainText('ตัวแอป DocCraft รอบนี้ไม่ส่ง analytics/telemetry');
    await expect(notice).toContainText('operational logs');
    await expect(notice).toContainText('ไม่ได้ยืนยันว่าได้รับเงินจริงแล้ว');

    const support = notice.getByRole('link', { name: 'DocCraft GitHub Issues' });
    await expect(support).toHaveAttribute('href', 'https://github.com/Gutumrod/doccraft/issues');
  });

  test('does not contact third-party telemetry during the core page load', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1') externalRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(externalRequests).toEqual([]);
  });

  test('keeps Public Pilot operational notice out of printed documents', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('public-pilot-notice')).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('public-pilot-notice')).toBeHidden();
    await expect(page.getByTestId('document-preview-container')).toBeVisible();
  });
});
