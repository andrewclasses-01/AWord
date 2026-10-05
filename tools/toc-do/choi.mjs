import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const ds = fs.readdirSync('src/templates').filter(t => fs.existsSync(`src/templates/${t}/test.html`));
const br = process.argv[2] === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
let khac = 0;
for (const t of ds) {
  const kq = {};
  for (const [ten, port] of [['goc', 7706], ['gon', 7707]]) {
    const p = await br.newPage({ viewport: { width: 1280, height: 800 } });
    const loi = new Set();
    p.on('pageerror', e => loi.add('PE ' + e.message.slice(0, 80)));
    p.on('console', m => { if (m.type() === 'error' && !/WebGL|Failed to load resource|AudioContext|play\(\)|NotAllowed|autoplay/i.test(m.text())) loi.add('CE ' + m.text().slice(0, 80)); });
    await p.goto(`http://localhost:${port}/templates/${t}/test.html`).catch(() => {});
    await p.waitForTimeout(2500);
    // START / PLAY
    await p.evaluate(() => { const b = [...document.querySelectorAll('button,[role=button]')].find(x => /start|play/i.test(x.textContent) && x.offsetParent); b && b.click(); }).catch(() => {});
    await p.waitForTimeout(3000);
    // bấm ngẫu nhiên (hạt cố định) các nút/ô đang hiện trong vùng chơi
    await p.evaluate(async () => {
      let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < 15; i++) {
        const c = [...document.querySelectorAll('.aw-playarea button, .aw-playarea [class*=answer], .aw-playarea [class*=tile], .aw-playarea [class*=card], .aw-playarea [class*=opt]')].filter(x => x.offsetParent);
        if (!c.length) break;
        const el = c[Math.floor(r() * c.length)];
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); el.click();
        await new Promise(z => setTimeout(z, 250));
      }
    }).catch(e => loi.add('EVAL ' + e.message.slice(0, 60)));
    await p.waitForTimeout(1500);
    kq[ten] = [...loi].sort();
    await p.close();
  }
  const same = JSON.stringify(kq.goc) === JSON.stringify(kq.gon);
  if (!same) khac++;
  console.log((same ? 'OK  ' : 'KHAC') + ' ' + t.padEnd(16) + ' loi ' + kq.goc.length + '/' + kq.gon.length + (same && !kq.goc.length ? '' : '\n   goc: ' + kq.goc.join(' | ') + '\n   gon: ' + kq.gon.join(' | ')));
}
console.log(process.argv[2] || 'chrome', 'KHAC', khac, '/', ds.length);
await br.close();
