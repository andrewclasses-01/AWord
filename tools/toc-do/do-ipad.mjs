// Đo tải trang AWord giả lập iPad: CPU chậm N lần + mạng wifi lớp; chặn mọi lượt GHI Firestore.
// node do-ipad.mjs <url> [cpu=4] [lan=3] [mang=wifi|4g|none]
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2];
const CPU = +(process.argv[3] || 4);
const LAN = +(process.argv[4] || 3);
const MANG = process.argv[5] || 'wifi';
const NET = { wifi: { latency: 40, down: 10e6 / 8, up: 5e6 / 8 }, '4g': { latency: 120, down: 6e6 / 8, up: 2e6 / 8 }, none: null }[MANG];
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(tmpdir(), 'doipad-'));
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--window-size=1024,768', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const cho = new Map(); const nghe = [];
async function ketNoi() {
  for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find(t => t.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(200); }
  throw new Error('khong ket noi duoc chrome');
}
const goi = (method, params = {}) => new Promise((ok, loi) => { const i = ++id; cho.set(i, { ok, loi }); ws.send(JSON.stringify({ id: i, method, params })); });

ws = new WebSocket(await ketNoi());
await new Promise(r => ws.onopen = r);
let reqs = new Map(), log = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && cho.has(m.id)) { const c = cho.get(m.id); cho.delete(m.id); m.error ? c.loi(new Error(m.error.message)) : c.ok(m.result); return; }
  if (m.method === 'Fetch.requestPaused') {
    const r = m.params.request; const ghi = r.method !== 'GET' && !/Listen|runQuery|batchGet|runAggregationQuery/.test(r.url) && !/appcheck|recaptcha|securetoken|identitytoolkit/.test(r.url);
    if (ghi) { log.push('CHAN GHI ' + r.method + ' ' + r.url.slice(0, 100)); goi('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' }).catch(()=>{}); }
    else goi('Fetch.continueRequest', { requestId: m.params.requestId }).catch(()=>{});
  }
  if (m.method === 'Network.responseReceived') { const x = reqs.get(m.params.requestId) || {}; x.url = m.params.response.url; x.status = m.params.response.status; x.fromCache = m.params.response.fromDiskCache || m.params.response.fromMemoryCache; reqs.set(m.params.requestId, x); }
  if (m.method === 'Network.loadingFinished') { const x = reqs.get(m.params.requestId) || {}; x.bytes = m.params.encodedDataLength; reqs.set(m.params.requestId, x); }
};
await goi('Page.enable'); await goi('Network.enable'); await goi('Runtime.enable'); await goi('Performance.enable');
await goi('Fetch.enable', { patterns: [{ urlPattern: '*firestore.googleapis.com*' }, { urlPattern: '*firebasestorage*' }] });
await goi('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await goi('Emulation.setTouchEmulationEnabled', { enabled: true });
await goi('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
await goi('Emulation.setCPUThrottlingRate', { rate: CPU });
if (NET) await goi('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down, uploadThroughput: NET.up });

// Mốc "dùng được": màn chờ .aw-boot biến mất VÀ có chữ hiện trên trang
const DO = `(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = (performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime;
  return { fcp: Math.round(fcp||0), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), boot: !!document.querySelector('.aw-boot'), chu: (document.body.innerText||'').trim().slice(0,60).replace(/\\s+/g,' '), now: Math.round(performance.now()) }; })()`;

for (let lan = 1; lan <= LAN; lan++) {
  reqs = new Map();
  if (lan === 1) { await goi('Network.clearBrowserCache'); }
  // lần 2: tải lại trong 10 phút (cache còn hạn) · lần 3: giả như đã quá 10 phút (bắt hỏi lại máy chủ mọi file)
  const t0 = Date.now();
  await goi('Page.navigate', { url: lan === 3 ? url : url });
  let xong = null, r;
  for (let i = 0; i < 600; i++) { await sleep(100); try { r = (await goi('Runtime.evaluate', { expression: DO, returnByValue: true })).result.value; } catch { continue; } if (r && r.load > 0 && !r.boot && r.chu.length > 3 && !/Loading/i.test(r.chu)) { xong = r.now; break; } }
  await sleep(2500);
  const met = Object.fromEntries((await goi('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const ds = [...reqs.values()].filter(x => x.url);
  const tu = (re) => ds.filter(x => re.test(x.url));
  const kb = a => Math.round(a.reduce((s, x) => s + (x.bytes || 0), 0) / 1024);
  console.log(JSON.stringify({ lan, cpu: CPU + 'x', mang: MANG, dung_duoc_ms: xong, fcp: r && r.fcp, dcl: r && r.dcl, load: r && r.load, chu: r && r.chu,
    so_file: ds.length, kb_tai: kb(ds), file_304: ds.filter(x => x.status === 304).length, tu_cache: ds.filter(x => x.fromCache).length,
    js: `${tu(/\.m?js(\?|$)/).length} file ${kb(tu(/\.m?js(\?|$)/))}KB`, script_s: +(met.ScriptDuration || 0).toFixed(2), task_s: +(met.TaskDuration || 0).toFixed(2), layout_s: +(met.LayoutDuration || 0).toFixed(2) }));
  if (lan === 2) {
    // lần 3 = giả "quá 10 phút": xoá cache bộ nhớ, ép trình duyệt hỏi lại (max-age hết hạn) bằng cách tua đồng hồ cache không được ⇒ dùng Network.setBypassServiceWorker + header no-cache cho tài liệu chính không giống thật; thay vào đó đo bằng cách tắt cache bộ nhớ và gửi If-None-Match: mô phỏng gần nhất = Cache-Control: max-age=0
    await goi('Network.setExtraHTTPHeaders', { headers: { 'Cache-Control': 'max-age=0' } });
  }
}
if (log.length) console.log(log.slice(0, 5).join('\n'));
ws.close(); ch.kill();
