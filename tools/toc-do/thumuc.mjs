import { chromium, webkit } from 'playwright';
const td = process.argv[2] || 'chrome';
const br = td === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
for (const [ten, port] of [['CU ', 7711], ['MOI', 7712]]) {
  const p = await br.newPage({ viewport: { width: 1194, height: 834 } });
  const loi = []; p.on('pageerror', e => loi.push(e.message.slice(0, 80)));
  await p.goto(`http://localhost:${port}/thu.html?r=activities`);
  await p.waitForSelector('text=Lop A', { timeout: 20000 });
  const mo = async () => {
    const t0 = Date.now();
    await p.click('text=Lop A');
    await p.waitForFunction(() => document.querySelectorAll('.aw-card-act').length >= 30, null, { timeout: 20000 });
    const the = Date.now() - t0;
    await p.waitForFunction(() => document.querySelectorAll('.aw-newdot').length > 0, null, { timeout: 15000 }).catch(() => {});
    const cham = Date.now() - t0;
    const n = await p.evaluate(() => document.querySelectorAll('.aw-card-act .aw-newdot').length);
    return `thẻ act ${the} ms · chấm đỏ ${cham} ms (${n} chấm)`;
  };
  const l1 = await mo();
  await p.click('text=Activities').catch(() => p.goBack());
  await p.waitForSelector('text=Lop A');
  const l2 = await mo();
  // Results: lần đầu + lần hai
  const res = async () => { const t0 = Date.now(); await p.goto(`http://localhost:${port}/thu.html?r=results`); await p.waitForFunction(() => document.querySelectorAll('.aw-card').length >= 100, null, { timeout: 30000 }).catch(() => {}); return Date.now() - t0; };
  const tai = await p.evaluate(() => globalThis.__soLanTaiBG || 0);
  console.log(td, ten, '| mở thư mục lần 1:', l1, '| lần 2:', l2, '| lượt tải bài giao:', tai, loi.length ? '| LỖI ' + loi : '');
  await p.close();
}
await br.close();
