import { chromium } from '@playwright/test';

const target = process.env.DC01_URL || 'https://dc01.wstera.com';
const browsers = [
  ['chrome', 'chrome'],
  ['edge', 'msedge'],
];

for (const [label, channel] of browsers) {
  const browser = await chromium.launch({ channel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const thirdPartyResponses = new Set();
  const blockedThirdParty = new Set();

  page.on('response', (response) => {
    const host = new URL(response.url()).host;
    if (host && host !== 'dc01.wstera.com') thirdPartyResponses.add(host);
  });
  page.on('requestfailed', (request) => {
    const host = new URL(request.url()).host;
    const reason = request.failure()?.errorText || 'failed';
    if (host && host !== 'dc01.wstera.com') blockedThirdParty.add(`${host}:${reason}`);
  });

  const response = await page.goto(target, { waitUntil: 'networkidle' });
  if (!response || response.status() !== 200) throw new Error(`${label}: expected HTTP 200`);
  if ((await page.title()) !== 'DocCraft') throw new Error(`${label}: wrong document title`);

  const pilotNotice = page.getByTestId('public-pilot-notice');
  if (!(await pilotNotice.isVisible())) throw new Error(`${label}: Public Pilot notice not visible`);

  const firstRow = page.locator('[data-testid^="item-row-"]').first();
  await firstRow.locator('[data-testid^="input-item-price-"]').fill('1000');
  await page.getByTestId('input-promptpay-enabled').check();
  await page.getByTestId('input-promptpay-identifier').fill('081-234-5678');
  await page.getByTestId('select-promptpay-amount-mode').selectOption('net_payable');

  const qr = page.getByTestId('preview-promptpay-qr');
  if (!(await qr.isVisible())) throw new Error(`${label}: PromptPay QR not visible`);
  if (!((await qr.textContent()) || '').includes('1,000.00')) {
    throw new Error(`${label}: PromptPay amount mismatch`);
  }

  await page.waitForTimeout(250);
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await page.getByTestId('input-promptpay-enabled').isChecked())) {
    throw new Error(`${label}: local persistence failed after reload`);
  }

  await page.emulateMedia({ media: 'print' });
  const noticeDisplay = await page.getByTestId('public-pilot-notice').evaluate((el) => getComputedStyle(el).display);
  if (noticeDisplay !== 'none') throw new Error(`${label}: pilot notice leaks into print`);
  if (!(await page.getByTestId('document-preview-container').isVisible())) {
    throw new Error(`${label}: print preview document is not visible`);
  }
  if (thirdPartyResponses.size > 0) {
    throw new Error(`${label}: successful third-party responses: ${[...thirdPartyResponses].join(', ')}`);
  }

  console.log(
    `${label.toUpperCase()} PASS status=200 title=DocCraft promptpay=ok persistence=ok print-media=ok ` +
    `third-party-responses=none blocked=${[...blockedThirdParty].join(',') || 'none'}`
  );
  await browser.close();
}

console.log(`PRODUCTION_SMOKE_PASS ${target}`);
