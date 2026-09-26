// Canonical public host first; dc01.wstera.com is the legacy code host kept for compatibility.
// Each host upgrades to HTTPS on itself; cross-host redirects are a separate decision.
const ALLOWED_HOSTS = new Set(['doccraft.wstera.com', 'dc01.wstera.com']);

const httpRedirectWorker = {
  async fetch(request) {
    const url = new URL(request.url);
    if (!ALLOWED_HOSTS.has(url.hostname) || url.protocol !== 'http:') {
      return new Response('Not Found', { status: 404 });
    }
    url.protocol = 'https:';
    return new Response(null, {
      status: 301,
      headers: { Location: url.toString(), 'Cache-Control': 'no-store' },
    });
  },
};

export default httpRedirectWorker;
