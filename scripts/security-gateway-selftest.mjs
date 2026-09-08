import securityGateway from '../worker/security-gateway.mjs';

const env = {
  ASSETS: {
    async fetch(request) {
      return new Response(`asset:${new URL(request.url).pathname}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    },
  },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const insecure = await securityGateway.fetch(
  new Request('http://dc01.wstera.com/path?q=1'),
  env,
);
assert(insecure.status === 308, `expected 308, got ${insecure.status}`);
assert(
  insecure.headers.get('location') === 'https://dc01.wstera.com/path?q=1',
  'HTTPS redirect did not preserve path/query',
);

const wrongHost = await securityGateway.fetch(
  new Request('https://example.com/'),
  env,
);
assert(wrongHost.status === 404, 'non-canonical host must fail closed');

const post = await securityGateway.fetch(
  new Request('https://dc01.wstera.com/', { method: 'POST' }),
  env,
);
assert(post.status === 405, 'non-GET/HEAD method must be rejected');

const secure = await securityGateway.fetch(
  new Request('https://dc01.wstera.com/'),
  env,
);
assert(secure.status === 200, 'secure asset request must pass through');
assert(
  (secure.headers.get('strict-transport-security') || '').includes('max-age='),
  'HSTS missing',
);
assert(
  (secure.headers.get('content-security-policy') || '').includes("script-src-attr 'none'"),
  'CSP script-src-attr guard missing',
);
assert(
  (secure.headers.get('x-robots-tag') || '').includes('noindex'),
  'noindex header missing',
);

console.log('SECURITY_GATEWAY_SELFTEST_PASS');
