import { webkit, chromium } from 'playwright';
const G='http://localhost:7702';
for (const [ten, br] of [['webkit', await webkit.launch()], ['chrome', await chromium.launch({channel:'chrome'})]]) {
  for (const f of ['A','B','C']) {
    const ctx = await br.newContext();
    const kq=[];
    for (let lan=1; lan<=2; lan++) {
      await fetch(G+'/__reset'); const p = await ctx.newPage(); await p.goto(G+'/'+f+'.html'); await p.waitForTimeout(800); await p.close();
      const log = await (await fetch(G+'/__log')).json();
      kq.push(log.filter(x=>!/html/.test(x.u)).map(x=>x.u.slice(1)+':'+x.s).join(' '));
    }
    console.log(ten, f, '| lan1:', kq[0], '| lan2:', kq[1]||'(cache het)');
    await ctx.close();
  }
  await br.close();
}
