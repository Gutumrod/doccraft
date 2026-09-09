const CANONICAL_HOST = 'dc01.wstera.com';

const httpRedirectWorker = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== CANONICAL_HOST || url.protocol !== 'http:') {
      return new Response('Not Found', { status: 404 });
    }
    url.protocol = 'https:';
    return new Response(null, {
      status: 308,
      headers: { Location: url.toString(), 'Cache-Control': 'no-store' },
    });
  },
};

export default httpRedirectWorker;
