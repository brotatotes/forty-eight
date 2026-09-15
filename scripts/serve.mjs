import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SERVE_DIR || '.');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json', '.mp4':'video/mp4', '.webm':'video/webm', '.png':'image/png', '.webp':'image/webp', '.vtt':'text/vtt; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-store', 'Accept-Ranges':'bytes' };
    let start = 0, end = body.length - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, body.length - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      } else { start = -1; }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= body.length || end < start) {
        res.writeHead(416, {...headers, 'Content-Range':`bytes */${body.length}`}).end(); return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${body.length}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    res.writeHead(status, headers).end(req.method === 'HEAD' ? undefined : body.subarray(start,end + 1));
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Tidepost serving on http://127.0.0.1:${port}`));
