// Máy chủ tĩnh giả GitHub Pages + mạng chậm dùng chung (đếm từng lượt tải + byte gửi đi).
// node may-chu-cham.mjs <thư mục> <cổng> [kbps=3000] [tre_ms=50]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const ROOT = process.argv[2], PORT = +process.argv[3];
const BPS = (+(process.argv[4] || 3000)) * 1000 / 8, TRE = +(process.argv[5] || 50);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary' };
let log = [];
// "đường ống" dùng chung: mỗi khúc 16 KB phải chờ tới lượt theo băng thông tổng
let ongRanh = 0;
function choBangThong(n) { const now = Date.now(); const bd = Math.max(now, ongRanh); ongRanh = bd + n / BPS * 1000; return new Promise(r => setTimeout(r, ongRanh - now)); }
const cache = new Map();
function docFile(p) {
  const st = fs.statSync(p);
  const c = cache.get(p);
  if (c && c.mtime === st.mtimeMs) return c;
  const raw = fs.readFileSync(p);
  const etag = '"' + crypto.createHash('md5').update(raw).digest('hex').slice(0, 16) + '"';
  const ext = path.extname(p).toLowerCase();
  const gz = /\.(html|js|mjs|css|json|svg|webmanifest)$/.test(ext) ? zlib.gzipSync(raw, { level: 6 }) : null;
  const v = { raw, gz, etag, ext, mtime: st.mtimeMs };
  cache.set(p, v); return v;
}
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__log') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(log)); return; }
  if (u.pathname === '/__reset') { log = []; res.end('ok'); return; }
  let p = path.join(ROOT, decodeURIComponent(u.pathname));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch { }
  await new Promise(r => setTimeout(r, TRE));
  let f; try { f = docFile(p); } catch { res.statusCode = 404; res.end('404'); log.push({ u: u.pathname, s: 404, b: 3, t: Date.now() }); return; }
  res.setHeader('Cache-Control', 'max-age=600');
  res.setHeader('ETag', f.etag);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('Content-Type', MIME[f.ext] || 'application/octet-stream');
  if (req.headers['if-none-match'] === f.etag) { res.statusCode = 304; res.end(); log.push({ u: u.pathname + u.search, s: 304, b: 0, t: Date.now() }); return; }
  const gz = f.gz && /gzip/.test(req.headers['accept-encoding'] || '');
  const body = gz ? f.gz : f.raw;
  if (gz) res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Content-Length', body.length);
  const t0 = Date.now();
  for (let i = 0; i < body.length; i += 16384) {
    const k = body.subarray(i, i + 16384);
    await choBangThong(k.length);
    if (!res.write(k)) await new Promise(r => res.once('drain', r));
  }
  res.end();
  log.push({ u: u.pathname + u.search, s: 200, b: body.length, ms: Date.now() - t0, t: Date.now() });
}).listen(PORT, () => console.log('nghe', PORT, 'kbps', BPS * 8 / 1000));
