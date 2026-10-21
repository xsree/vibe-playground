// 只使用 Node.js 标准库，不需要 npm install。
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const root = path.join(__dirname, 'codex-gpt-6-astra-medium');
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/main.js', ['main.js', 'text/javascript; charset=utf-8']],
]);
for (const [name] of files.values()) {
  if (!fs.existsSync(path.join(root, name))) {
    console.error(`缺少作品文件：${name}`);
    process.exit(1);
  }
}
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }
  let route;
  try { route = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400); return response.end(); }
  const entry = files.get(route);
  if (!entry) { response.writeHead(404); return response.end('Not found'); }
  fs.readFile(path.join(root, entry[0]), (error, data) => {
    if (error) { response.writeHead(500); return response.end('Unable to read file'); }
    response.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') server.listen(0, '127.0.0.1');
  else { console.error(error.message); process.exitCode = 1; }
});
server.on('listening', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`\n已启动：${url}\n仅本机可访问。按 Ctrl+C 或关闭此窗口停止服务。\n首次加载需联网获取 Three.js。\n`);
  if (process.platform === 'win32' && !process.argv.includes('--no-open')) {
    execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], error => {
      if (error) console.log('请在浏览器中打开上方地址。');
    });
  }
});
server.listen(8766, '127.0.0.1');
process.on('SIGINT', () => { server.close(); process.exit(0); });
