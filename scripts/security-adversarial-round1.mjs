import { createHash } from 'node:crypto';

const BASE = 'https://dc01.wstera.com';
const HTTP = 'http://dc01.wstera.com';

async function probe(label, url, init = {}) {
  try {
    const response = await fetch(url, { redirect: 'manual', ...init });
    const body = init.method === 'HEAD' ? '' : await response.text();
    const result = {
      label,
      status: response.status,
      location: response.headers.get('location'),
      allowOrigin: response.headers.get('access-control-allow-origin'),
      hsts: response.headers.get('strict-transport-security'),
      csp: response.headers.get('content-security-policy'),
      hash: createHash('sha256').update(body).digest('hex').slice(0, 16),
      bytes: Buffer.byteLength(body),
    };
    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.log(JSON.stringify({ label, error: String(error) }));
    return null;
  }
}

const results = [];
results.push(await probe('http-root', `${HTTP}/`));
results.push(await probe('http-static', `${HTTP}/_next/static/chunks/10qtd36fop5p8.js`));
results.push(await probe('http-path-query', `${HTTP}/a/b?x=1&y=2`));
results.push(await probe('http-xfh-poison', `${HTTP}/poison?x=1`, {
  headers: {
    'X-Forwarded-Host': 'evil.example',
    'X-Forwarded-Proto': 'https',
    'X-Original-URL': 'https://evil.example/owned',
  },
}));

const paths = [
  '/.env',
  '/.git/config',
  '/package.json',
  '/wrangler.jsonc',
  '/worker/security-gateway.mjs',
  '/%2e%2e/%2e%2e/etc/passwd',
  '/..%2f..%2fpackage.json',
  '/%252e%252e%252fpackage.json',
  '//evil.example/',
  '/%2f%2fevil.example/',
  '/%5cevil.example/',
];
for (const path of paths) results.push(await probe(`path:${path}`, `${BASE}${path}`));
for (const method of ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
  results.push(await probe(`method:${method}`, `${BASE}/`, { method }));
}
results.push(await probe('method-override-get', `${BASE}/`, {
  headers: {
    'X-HTTP-Method-Override': 'DELETE',
    'X-Method-Override': 'DELETE',
  },
}));
results.push(await probe('cors-evil-origin', `${BASE}/`, {
  headers: { Origin: 'https://evil.example' },
}));
results.push(await probe('poison-https', `${BASE}/`, {
  headers: {
    'X-Forwarded-Host': 'evil.example',
    'X-Forwarded-Proto': 'http',
    'X-Original-Host': 'evil.example',
    'X-Rewrite-URL': '/owned',
  },
}));
const cleanA = await probe('cache-clean-a', `${BASE}/?cacheprobe=1`);
const poison = await probe('cache-poison-attempt', `${BASE}/?cacheprobe=1`, {
  headers: { 'X-Forwarded-Host': 'evil.example', 'X-Original-URL': '/owned' },
});
const cleanB = await probe('cache-clean-b', `${BASE}/?cacheprobe=1`);
const findings = [];
const byLabel = new Map(results.filter(Boolean).map((r) => [r.label, r]));
for (const label of ['http-root', 'http-static', 'http-path-query', 'http-xfh-poison']) {
  const r = byLabel.get(label);
  if (!r || r.status !== 308 || !r.location?.startsWith('https://dc01.wstera.com/')) {
    findings.push(`HIGH transport redirect failure: ${label}`);
  }
  if (r?.location?.includes('evil.example')) findings.push(`HIGH host-header redirect poisoning: ${label}`);
}
for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
  if (byLabel.get(`method:${method}`)?.status !== 405) findings.push(`HIGH method bypass: ${method}`);
}
const cors = byLabel.get('cors-evil-origin');
if (cors?.allowOrigin === '*' || cors?.allowOrigin === 'https://evil.example') findings.push('MEDIUM permissive CORS');
if (cleanA && poison && cleanB && (cleanA.hash !== poison.hash || cleanA.hash !== cleanB.hash)) {
  findings.push('HIGH cache/header poisoning changed response body');
}
for (const r of results.filter(Boolean)) {
  if (r.location && /^https?:\/\/evil\.example/i.test(r.location)) findings.push(`HIGH open redirect: ${r.label}`);
}
console.log(`ROUND1_EDGE_FINDINGS=${JSON.stringify([...new Set(findings)])}`);
console.log(findings.length === 0 ? 'ROUND1_EDGE_PASS' : 'ROUND1_EDGE_REVIEW_REQUIRED');
