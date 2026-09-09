import { chromium } from '@playwright/test';

const target = process.env.DC01_URL || 'https://dc01.wstera.com';
const targetUrl = new URL(target);
const canonicalHost = targetUrl.host;
const browsers = [
  ['chrome', 'chrome'],
  ['edge', 'msedge'],
];

function assertSecurityHeaders(headers, label) {
  const csp = headers['content-security-policy'] || '';
  if (!csp.includes("script-src-attr 'none'")) throw new Error(`${label}: CSP missing script-src-attr 'none'`);
  if (csp.includes("script-src 'self' 'unsafe-inline'")) throw new Error(`${label}: CSP broadly allows inline scripts`);
  if (!csp.includes("'sha256-")) throw new Error(`${label}: CSP missing generated inline-script hashes`);
  if (!csp.includes("frame-ancestors 'none'")) throw new Error(`${label}: CSP missing frame-ancestors 'none'`);
  if (!csp.includes("connect-src 'self'")) throw new Error(`${label}: CSP missing connect-src 'self'`);
  if (!(headers['strict-transport-security'] || '').includes('max-age=')) throw new Error(`${label}: HSTS missing`);
  if ((headers['x-content-type-options'] || '').toLowerCase() !== 'nosniff') throw new Error(`${label}: nosniff missing`);
  if ((headers['x-frame-options'] || '').toUpperCase() !== 'DENY') throw new Error(`${label}: X-Frame-Options DENY missing`);
  if (!(headers['x-robots-tag'] || '').includes('noindex')) throw new Error(`${label}: X-Robots-Tag noindex missing`);
}

const httpTarget = new URL(target);
httpTarget.protocol = 'http:';
const redirectResponse = await fetch(httpTarget, { redirect: 'manual' });
if (redirectResponse.status !== 308) throw new Error(`transport: expected HTTP 308, got ${redirectResponse.status}`);
const redirectLocation = redirectResponse.headers.get('location');
if (!redirectLocation || new URL(redirectLocation).protocol !== 'https:' || new URL(redirectLocation).host !== canonicalHost) {
  throw new Error(`transport: invalid HTTPS redirect target: ${redirectLocation || 'missing'}`);
}

for (const [label, channel] of browsers) {
  const browser = await chromium.launch({ channel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const thirdPartyResponses = new Set();
  const blockedThirdParty = new Set();

  page.on('response', (response) => {
    const host = new URL(response.url()).host;
    if (host && host !== canonicalHost) thirdPartyResponses.add(host);
  });
  page.on('requestfailed', (request) => {
    const host = new URL(request.url()).host;
    const reason = request.failure()?.errorText || 'failed';
    if (host && host !== canonicalHost) blockedThirdParty.add(`${host}:${reason}`);
  });

  const response = await page.goto(target, { waitUntil: 'networkidle' });
  if (!response || response.status() !== 200) throw new Error(`${label}: expected HTTP 200`);
  if (response.url().startsWith('http://')) throw new Error(`${label}: insecure final navigation URL`);
  assertSecurityHeaders(await response.allHeaders(), label);
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
