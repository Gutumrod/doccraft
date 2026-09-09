import { readFile } from 'node:fs/promises';
import httpRedirectWorker from '../worker/http-redirect.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const redirected = await httpRedirectWorker.fetch(
  new Request('http://dc01.wstera.com/path?q=1&x=2'),
);
assert(redirected.status === 308, `expected 308, got ${redirected.status}`);
assert(
  redirected.headers.get('location') === 'https://dc01.wstera.com/path?q=1&x=2',
  'HTTPS redirect did not preserve canonical host/path/query',
);

const httpsBypass = await httpRedirectWorker.fetch(
  new Request('https://dc01.wstera.com/'),
);
assert(httpsBypass.status === 404, 'redirect Worker must not serve HTTPS content');

const wrongHost = await httpRedirectWorker.fetch(
  new Request('http://example.com/'),
);
assert(wrongHost.status === 404, 'non-canonical host must fail closed');
const headersFile = await readFile(new URL('../out/_headers', import.meta.url), 'utf8');
for (const required of [
  "Strict-Transport-Security: max-age=",
  "script-src-attr 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self'",
  'X-Content-Type-Options: nosniff',
  'X-Frame-Options: DENY',
  'X-Robots-Tag: noindex',
]) {
  assert(headersFile.includes(required), `out/_headers missing ${required}`);
}
assert(!headersFile.includes("script-src 'self' 'unsafe-inline'"), 'generated CSP must not allow inline scripts broadly');
assert(headersFile.includes("'sha256-"), 'generated CSP is missing inline-script hashes');

console.log('SECURITY_BOUNDARY_SELFTEST_PASS');
