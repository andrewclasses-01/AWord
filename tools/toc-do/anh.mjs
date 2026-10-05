import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const ds = ['/', '/play.html?g=rf6crd', ...fs.readdirSync('src/templates').filter(t => fs.existsSync(`src/templates/${t}/test.html`) && !/rocket|balloon|maze|speaking$/.test(t)).map(t => `/templates/${t}/test.html`)];
const br = process.argv[2] === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
fs.mkdirSync('anh', { recursive: true });
let xau = 0;
for (const u of ds) {
  const img = {};
  for (const port of [7706, 7707]) {
    const ctx = await br.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { Math.random = (() => { let s = 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); });
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}${u}`).catch(() => {});
    await p.waitForTimeout(3500);
    img[port] = PNG.sync.read(await p.screenshot({ animations: 'disabled' }));
    await ctx.close();
  }
  const { width, height } = img[7706];
  const diff = new PNG({ width, height });
  const n = pixelmatch(img[7706].data, img[7707].data, diff.data, width, height, { threshold: 0.1 });
  const pct = (n / (width * height) * 100).toFixed(2);
  if (n > 0) { xau++; fs.writeFileSync(`anh/${u.replace(/\W+/g, '_')}-diff.png`, PNG.sync.write(diff)); fs.writeFileSync(`anh/${u.replace(/\W+/g, '_')}-goc.png`, PNG.sync.write(img[7706])); fs.writeFileSync(`anh/${u.replace(/\W+/g, '_')}-gon.png`, PNG.sync.write(img[7707])); }
  console.log((n ? 'LECH ' : 'KHOP ') + u.padEnd(40) + ' ' + n + ' px (' + pct + '%)');
}
console.log(process.argv[2] || 'chrome', 'lech', xau, '/', ds.length);
await br.close();
