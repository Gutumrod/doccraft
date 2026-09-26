import { readFile } from 'node:fs/promises';
import httpRedirectWorker from '../worker/http-redirect.mjs';
import { getHttpRedirectContractError } from './http-redirect-contract.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Canonical host first, then the legacy compatibility host.
for (const host of ['doccraft.wstera.com', 'dc01.wstera.com']) {
  const redirected = await httpRedirectWorker.fetch(
    new Request(`http://${host}/path?q=1&x=2`),
  );
  assert(redirected.status === 301, `${host}: expected 301, got ${redirected.status}`);
  assert(
    redirected.headers.get('location') === `https://${host}/path?q=1&x=2`,
    `${host}: HTTPS redirect did not preserve host/path/query`,
  );
  assert(
    getHttpRedirectContractError(redirected.status, redirected.headers.get('location'), `http://${host}/path?q=1&x=2`) === null,
    `${host}: redirect does not satisfy the transport contract`,
  );

  const httpsBypass = await httpRedirectWorker.fetch(new Request(`https://${host}/`));
  assert(httpsBypass.status === 404, `${host}: redirect Worker must not serve HTTPS content`);
}

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
