import { chromium } from '@playwright/test';

const TARGET = 'https://dc01.wstera.com';
const STORAGE_KEY = 'doccraft_current_draft_v1';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const evilRequests = [];
const evilResponses = [];
const failedRequests = [];
const pageErrors = [];
page.on('request', (request) => {
  if (request.url().includes('evil.example')) evilRequests.push(request.url());
});
page.on('response', (response) => {
  if (response.url().includes('evil.example')) evilResponses.push(response.url());
});
page.on('requestfailed', (request) => {
  if (request.url().includes('evil.example')) {
    failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  }
});
page.on('pageerror', (error) => pageErrors.push(String(error)));

await page.goto(TARGET, { waitUntil: 'networkidle' });
await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
await page.reload({ waitUntil: 'networkidle' });
const payload = '<img src="https://evil.example/x" onerror="window.__dc01xss=1"><svg onload="window.__dc01xss=2"></svg><script>window.__dc01xss=3</script>';
await page.getByTestId('input-biz-name').fill(payload);
await page.getByTestId('input-biz-address').fill(payload);
await page.getByTestId('input-cust-name').fill(payload);
await page.getByTestId('input-cust-address').fill(payload);
await page.getByTestId('input-doc-terms').fill(payload);
await page.getByTestId('input-doc-notes').fill(payload);
await page.locator('[data-testid^="input-item-desc-"]').first().fill(payload);
await page.waitForTimeout(600);

const xssState = await page.evaluate(() => ({
  flag: globalThis.__dc01xss ?? null,
  evilImages: document.querySelectorAll('img[src*="evil.example"]').length,
  injectedSvgHandlers: document.querySelectorAll('svg[onload]').length,
  bodyContainsLiteral: document.body.innerText.includes('<script>window.__dc01xss=3</script>'),
}));
console.log('XSS_STATE=' + JSON.stringify(xssState));
if (xssState.flag !== null || xssState.evilImages !== 0 || xssState.injectedSvgHandlers !== 0) {
  throw new Error('HIGH: user-field XSS/HTML injection executed or produced executable DOM');
}
if (!xssState.bodyContainsLiteral) throw new Error('Unexpected: payload was not preserved as inert text');
if (evilResponses.length > 0) throw new Error('HIGH: user-field payload caused successful external response');
await page.waitForTimeout(700);
const savedPayload = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
if (!savedPayload || !savedPayload.includes('evil.example')) {
  throw new Error('Unexpected: XSS payload was not persisted for stored-XSS validation');
}
await page.reload({ waitUntil: 'networkidle' });
const storedXssState = await page.evaluate(() => ({
  flag: globalThis.__dc01xss ?? null,
  evilImages: document.querySelectorAll('img[src*="evil.example"]').length,
  injectedSvgHandlers: document.querySelectorAll('svg[onload]').length,
  businessValue: document.querySelector('[data-testid="input-biz-name"]')?.value || '',
}));
console.log('STORED_XSS_STATE=' + JSON.stringify(storedXssState));
if (storedXssState.flag !== null || storedXssState.evilImages !== 0 || storedXssState.injectedSvgHandlers !== 0) {
  throw new Error('HIGH: stored XSS executed after local persistence reload');
}
if (!storedXssState.businessValue.includes('evil.example')) {
  throw new Error('Unexpected: stored payload did not survive reload for validation');
}

await page.evaluate((key) => localStorage.setItem(key, '{"broken":'), STORAGE_KEY);
await page.reload({ waitUntil: 'networkidle' });
if ((await page.title()) !== 'DocCraft') throw new Error('HIGH: malformed LocalStorage payload crashed app shell');
console.log('MALFORMED_STORAGE_APP_SURVIVED=true');
const protoPayload = JSON.stringify({
  storageFormatVersion: 1,
  schemaVersion: 4,
  savedAt: new Date().toISOString(),
  document: { ['__proto__']: { polluted: 'yes' }, constructor: { prototype: { polluted2: 'yes' } } },
});
await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, protoPayload]);
await page.reload({ waitUntil: 'networkidle' });
const pollution = await page.evaluate(() => ({
  polluted: ({}).polluted ?? null,
  polluted2: ({}).polluted2 ?? null,
  title: document.title,
}));
console.log('PROTOTYPE_POLLUTION=' + JSON.stringify(pollution));
if (pollution.polluted !== null || pollution.polluted2 !== null) {
  throw new Error('HIGH: prototype pollution observed from persisted payload');
}

await page.evaluate(() => {
  const img = document.createElement('img');
  img.id = 'dc01-csp-img-probe';
  img.src = 'https://evil.example/csp-image.png';
  document.body.appendChild(img);
  const script = document.createElement('script');
  script.id = 'dc01-csp-script-probe';
  script.src = 'https://evil.example/csp-script.js';
  document.body.appendChild(script);
});
await page.waitForTimeout(900);
if (evilResponses.length > 0) throw new Error('HIGH: CSP allowed successful external exfiltration resource');
console.log('CSP_EVIL_REQUESTS=' + JSON.stringify(evilRequests));
console.log('CSP_FAILED_REQUESTS=' + JSON.stringify(failedRequests));
await page.getByTestId('input-import-file').setInputFiles({
  name: 'oversize.json',
  mimeType: 'application/json',
  buffer: Buffer.alloc(16 * 1024 * 1024 + 1, 0x78),
});
await page.waitForTimeout(200);
const importError = await page.getByTestId('import-error-alert').textContent();
console.log('OVERSIZE_JSON_ERROR=' + JSON.stringify(importError));
if (!importError?.includes('16 MiB')) throw new Error('HIGH: oversized JSON import was not rejected before parsing');

await page.getByTestId('input-business-logo').setInputFiles({
  name: 'oversize.png',
  mimeType: 'image/png',
  buffer: Buffer.alloc(8 * 1024 * 1024 + 1, 0x00),
});
await page.waitForTimeout(200);
const logoError = await page.getByTestId('business-logo-error').textContent();
console.log('OVERSIZE_LOGO_ERROR=' + JSON.stringify(logoError));
if (!logoError?.includes('8 MiB')) throw new Error('HIGH: oversized logo source was not rejected');

const imageToggle = page.getByTestId('toggle-block-itemImages');
await imageToggle.click();
const itemImageInput = page.locator('[data-testid^="input-item-image-"]').first();
await itemImageInput.setInputFiles({
  name: 'oversize.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.alloc(12 * 1024 * 1024 + 1, 0x00),
});
await page.waitForTimeout(200);
const itemError = await page.locator('[data-testid^="item-image-error-"]').first().textContent();
console.log('OVERSIZE_ITEM_IMAGE_ERROR=' + JSON.stringify(itemError));
if (!itemError?.includes('12 MiB')) throw new Error('HIGH: oversized item image source was not rejected');

const attackerPage = await context.newPage();
const frameConsole = [];
attackerPage.on('console', (message) => frameConsole.push(message.text()));
attackerPage.on('pageerror', (error) => frameConsole.push(String(error)));
await attackerPage.setContent(`<html><body><iframe id="victim" src="${TARGET}/"></iframe></body></html>`);
await attackerPage.waitForTimeout(1200);
const frameUrls = attackerPage.frames().map((frame) => frame.url());
console.log('FRAME_URLS=' + JSON.stringify(frameUrls));
console.log('FRAME_CONSOLE=' + JSON.stringify(frameConsole));
const frameBlocked = frameConsole.some((line) => /frame-ancestors|x-frame-options|refused to display|refused to frame/i.test(line)) ||
  !frameUrls.some((url) => url === `${TARGET}/` || url === TARGET);
if (!frameBlocked) throw new Error('HIGH: clickjacking framing was not demonstrably blocked');

await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
console.log('PAGE_ERRORS=' + JSON.stringify(pageErrors));
if (pageErrors.length > 0) throw new Error('HIGH: unexpected browser pageerror observed during adversarial production flow');
console.log('EVIL_RESPONSES=' + JSON.stringify(evilResponses));
console.log('ROUND1_BROWSER_PASS');
await browser.close();
