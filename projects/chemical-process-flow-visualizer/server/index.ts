import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { handleGenerateHttp, handleModelsHttp } from './http';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT) || 4173;
const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (url.pathname === '/api/generate') {
    await handleGenerateHttp(request, response, false);
    return;
  }
  if (url.pathname === '/api/models') {
    await handleModelsHttp(request, response);
    return;
  }
  const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  let filePath = resolve(join(root, requested));
  if (!filePath.startsWith(`${root}${sep}`) && filePath !== join(root, 'index.html')) {
    response.statusCode = 403;
    response.end('Forbidden');
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) filePath = join(root, 'index.html');
  response.setHeader('Content-Type', mimeTypes[extname(filePath)] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Process Flow Visualizer: http://127.0.0.1:${port}`);
});
