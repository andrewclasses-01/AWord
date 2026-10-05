import { webkit, chromium } from 'playwright';
import fs from 'node:fs';
const ds = fs.readdirSync('src/templates').filter(t => fs.existsSync(`src/templates/${t}/test.html`)).map(t => `/templates/${t}/test.html`);
ds.push('/', '/play.html?g=rf6crd', '/?g=werewolf', '/?g=mybeat', '/kiemtra.html', '/source.html');
const td = process.argv[2] || 'chrome';
const br = td === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
let khac = 0;
for (const u of ds) {
  const kq = {};
  for (const [ten, port] of [['goc', 7706], ['gon', 7707]]) {
    const p = await br.newPage({ viewport: { width: 1280, height: 800 } });
    const loi = [];
    p.on('pageerror', e => loi.push('PE ' + String(e.message).slice(0, 90)));
    p.on('console', m => { if (m.type() === 'error') loi.push('CE ' + m.text().replace(/localhost:\d+/g, 'H').slice(0, 90)); });
    try { await p.goto(`http://localhost:${port}${u}`, { timeout: 20000 }); } catch (e) { loi.push('GOTO ' + e.message.slice(0, 60)); }
    await p.waitForTimeout(4000);
    const nut = await p.evaluate(() => document.querySelectorAll('button').length).catch(() => -1);
    const chu = await p.evaluate(() => (document.body.innerText || '').length).catch(() => -1);
    kq[ten] = { loi: [...new Set(loi)].sort(), nut, chu };
    await p.close();
  }
  const same = JSON.stringify(kq.goc.loi) === JSON.stringify(kq.gon.loi) && kq.goc.nut === kq.gon.nut;
  if (!same) khac++;
  console.log((same ? 'OK  ' : 'KHAC') + ' ' + u.padEnd(40) + ` nut ${kq.goc.nut}/${kq.gon.nut} chu ${kq.goc.chu}/${kq.gon.chu} loi ${kq.goc.loi.length}/${kq.gon.loi.length}` + (same ? '' : '\n     goc: ' + kq.goc.loi.join(' | ') + '\n     gon: ' + kq.gon.loi.join(' | ')));
}
console.log(td, 'KHAC:', khac, '/', ds.length);
await br.close();
