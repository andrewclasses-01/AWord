// Đo AWord trên WebKit (nhân Safari) + Chrome qua máy chủ chậm. node do-trinh-duyet.mjs <gốc http://localhost:PORT> [webkit,chrome] [duongdan,...]
import { webkit, chromium } from 'playwright';
const GOC = process.argv[2];
const TD = (process.argv[3] || 'webkit,chrome').split(',');
const DUONG = (process.argv[4] || '/,/play.html?g=rf6crd').split(',');

const SAN_SANG = () => {
  const boot = !!document.querySelector('.aw-boot');
  const w = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, { acceptNode: n => { const p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return 2; return /Loading/.test(n.nodeValue) ? 1 : 3; } });
  const chu = (document.body && document.body.innerText || '').trim().length;
  return !boot && !w.nextNode() && chu > 20;
};

async function mot(ctx, url) {
  await fetch(GOC + '/__reset');
  const page = await ctx.newPage();
  if (process.env.CHAN) await page.route(/firestore\.googleapis\.com|firebasestorage/, r => { const q = r.request(); const ghi = q.method() !== 'GET' && !/Listen|runQuery|batchGet|runAggregationQuery/.test(q.url()); return ghi ? r.abort() : r.continue(); });
  page.on('request', q => { if (/firestore|firebasestorage/.test(q.url()) && q.method() !== 'GET' && !/Listen|runQuery|batchGet|runAggregationQuery/.test(q.url())) console.log('!! LUOT GHI', q.method(), q.url().slice(0,90)); });
  const t0 = Date.now();
  await page.goto(GOC + url, { waitUntil: 'commit' });
  let xong = null;
  for (let i = 0; i < 600; i++) { await page.waitForTimeout(100); try { if (await page.evaluate(SAN_SANG)) { xong = Date.now() - t0; break; } } catch { } }
  const fcp = await page.evaluate(() => { const e = performance.getEntriesByName('first-contentful-paint')[0]; return e ? Math.round(e.startTime) : null; }).catch(() => null);
  await page.waitForTimeout(1500);
  const log = await (await fetch(GOC + '/__log')).json();
  await page.close();
  const dem = {}; let b = 0, n200 = 0, n304 = 0;
  for (const x of log) { if (x.s === 200) { n200++; b += x.b; dem[x.u] = (dem[x.u] || 0) + 1; } if (x.s === 304) n304++; }
  const trung = Object.entries(dem).filter(([, c]) => c > 1);
  return { xong_ms: xong, fcp, luot_200: n200, luot_304: n304, kb: Math.round(b / 1024), file_tai_trung: trung.length, luot_thua: trung.reduce((s, [, c]) => s + c - 1, 0), vd: trung.slice(0, 3).map(([u, c]) => u.replace(/^.*\//, '') + '×' + c).join(' ') };
}

for (const td of TD) {
  const browser = td === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
  for (const url of DUONG) {
    const ctx = await browser.newContext({ viewport: { width: 834, height: 1194 }, deviceScaleFactor: 2, hasTouch: true });
    const a = await mot(ctx, url);
    const b2 = await mot(ctx, url);
    console.log(td.padEnd(7), url.padEnd(22), 'LẦN ĐẦU', JSON.stringify(a));
    console.log(td.padEnd(7), url.padEnd(22), 'MỞ LẠI ', JSON.stringify(b2));
    await ctx.close();
  }
  await browser.close();
}
