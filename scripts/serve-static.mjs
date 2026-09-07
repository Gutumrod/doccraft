import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd(), 'out');
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : 3005;
const host = '127.0.0.1';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid --port value.');
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function isInsideRoot(filePath) {
  const rel = relative(root, filePath);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${host}`).pathname);
    let filePath = resolve(root, `.${pathname}`);
    if (!isInsideRoot(filePath)) {
      response.writeHead(400).end('Bad request');
      return;
    }

    let fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) {
      filePath = join(filePath, 'index.html');
      fileStat = await stat(filePath).catch(() => null);
    }

    if (!fileStat?.isFile()) {
      filePath = join(root, '404.html');
      fileStat = await stat(filePath).catch(() => null);
      response.statusCode = 404;
    }

    if (!fileStat?.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    const contentType = contentTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream';
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable');
    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`DocCraft static server: http://${host}:${port}`);
});
