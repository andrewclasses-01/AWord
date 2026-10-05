import { chromium } from 'playwright';
const br = await chromium.launch({ channel: 'chrome' });
for (const [ten, port] of [['CU ', 7711], ['MOI', 7712]]) {
  const p = await br.newPage({ viewport: { width: 1194, height: 834 } });
  const loi = []; p.on('pageerror', e => loi.push(e.message.slice(0, 80)));
  await p.goto(`http://localhost:${port}/thu.html?r=results`);
  const dem = () => p.evaluate(() => document.querySelectorAll('.aw-card-asg').length);
  const coBai146 = () => p.evaluate(() => [...document.querySelectorAll('.aw-card-asg')].some(c => /Bai giao 146(\D|$)/.test(c.innerText)));
  await p.waitForFunction(() => document.querySelectorAll('.aw-card-asg').length === 147, null, { timeout: 30000 });
  const n0 = await dem();
  const t0 = Date.now();
  await p.click('.aw-fm-crumbs >> text=Result');
  await p.waitForTimeout(50);
  await p.waitForFunction(() => document.querySelectorAll('.aw-card-asg').length === 147, null, { timeout: 30000 });
  const veLai = Date.now() - t0;
  // vào thùng rác 1 bài bằng CHÍNH module của trang rồi vẽ lại qua breadcrumb
  await p.evaluate(async () => { const m = await import('./core/assignments.js'); await m.trashAssignment('C146'); });
  await p.click('.aw-fm-crumbs >> text=Result');
  await p.waitForTimeout(50);
  await p.waitForFunction(() => document.querySelectorAll('.aw-card-asg').length === 146, null, { timeout: 15000 }).catch(() => loi.push('KHONG VE 146'));
  const n1 = await dem(); const con = await coBai146();
  console.log(ten, `| Results: ${n0} bài · vẽ lại ${veLai} ms · sau khi xoá C146: ${n1} bài, còn thấy C146: ${con}`, loi.length ? '| ' + loi.join(' / ') : '| ok');
  await p.close();
}
await br.close();
