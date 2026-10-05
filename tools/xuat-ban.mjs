// ============================================================
// xuat-ban.mjs — DỰNG BẢN XUẤT BẢN THU GỌN (Đợt 482, 05/10/2026)
//
// VÌ SAO: mã AWord đầy chú thích tiếng Việt ⇒ trang chủ phải tải 837 KB (nén) JS+CSS; thu gọn
// (esbuild minify TỪNG FILE, không gộp, không đổi tên/đường dẫn) còn ~219 KB ⇒ iPad wifi lớp tải nhanh ~4 lần.
// MÃ NGUỒN TRONG REPO GIỮ NGUYÊN — chỉ bản đưa lên GitHub Pages là bản thu gọn
// (.github/workflows/xuat-ban.yml chạy file này mỗi lần push main).
//
// Chạy tay: node tools/xuat-ban.mjs [thư_mục_ra=_site]   (cần `npm i esbuild` ở đâu đó trong đường tìm module)
//
// LUẬT:
// - Chép MỌI file (trừ .git/.github/node_modules/_site) — giữ nguyên cấu trúc, CNAME, .nojekyll.
// - .js/.mjs/.css: esbuild `transform` minify, KHÔNG đặt format/target ⇒ không đổi cú pháp, không đổi tên biến
//   cấp cao nhất (script thường dùng biến toàn cục vẫn an toàn), import/export giữ nguyên.
//   Bỏ qua: *.min.js, mọi thứ trong vendor/ (đã thu gọn sẵn / thư viện ngoài), scratch/, _backup/, tools/, docs/.
//   Thu gọn LỖI ⇒ giữ bản gốc + ghi cảnh báo (không bao giờ làm hỏng bản xuất bản vì một file).
//   Bản thu gọn TO HƠN bản gốc ⇒ giữ bản gốc.
// - build.json ở gốc: { sha, luc, thuGon, giuNguyen, loi[], nguon{ "đường/dẫn": sha256 của file NGUỒN (đã chuẩn LF) } }
//   ⇒ KIỂM BẢN LIVE: `python tools/kiem-live.py` (so build.json live với HEAD), KHÔNG so băm file .js/.css trực tiếp nữa.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { transform } from 'esbuild';

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RA = path.resolve(GOC, process.argv[2] || '_site');
const BO_QUA_THU_MUC = new Set(['.git', '.github', 'node_modules', '_site']);
const KHONG_THU_GON = /(^|\/)(vendor|scratch|_backup|tools|docs)\//;

let sha = process.env.GITHUB_SHA || '';
if (!sha) { try { sha = execSync('git rev-parse HEAD', { cwd: GOC }).toString().trim(); } catch { sha = '?'; } }

const nguon = {}, loi = [];
let thuGon = 0, giuNguyen = 0, truoc = 0, sau = 0;

function* duyet(thuMuc, tuongDoi = '') {
  for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    if (BO_QUA_THU_MUC.has(e.name) && !tuongDoi) continue;
    const td = tuongDoi ? tuongDoi + '/' + e.name : e.name;
    const p = path.join(thuMuc, e.name);
    if (e.isDirectory()) yield* duyet(p, td);
    else if (e.isFile()) yield [p, td];
  }
}

if (fs.existsSync(RA)) fs.rmSync(RA, { recursive: true, force: true });
for (const [p, td] of duyet(GOC)) {
  const dich = path.join(RA, td);
  fs.mkdirSync(path.dirname(dich), { recursive: true });
  const buf = fs.readFileSync(p);
  const laMa = /\.(m?js|css)$/i.test(td);
  if (!laMa || KHONG_THU_GON.test(td) || /\.min\.(js|css)$/i.test(td)) { fs.writeFileSync(dich, buf); continue; }
  const src = buf.toString('utf8');
  nguon[td] = crypto.createHash('sha256').update(src.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);
  try {
    const out = (await transform(src, { loader: /\.css$/i.test(td) ? 'css' : 'js', minify: true, legalComments: 'none', charset: 'utf8' })).code;
    if (out.length >= buf.length) { fs.writeFileSync(dich, buf); giuNguyen++; continue; }
    fs.writeFileSync(dich, out); thuGon++; truoc += buf.length; sau += Buffer.byteLength(out);
  } catch (e) {
    fs.writeFileSync(dich, buf); giuNguyen++;
    loi.push(td + ': ' + String(e.message || e).split('\n')[0].slice(0, 160));
  }
}
fs.writeFileSync(path.join(RA, 'build.json'), JSON.stringify({ sha, luc: new Date().toISOString(), thuGon, giuNguyen, loi, nguon }, null, 0));
console.log(`xuat-ban: ${thuGon} file thu gọn (${Math.round(truoc / 1024)} KB → ${Math.round(sau / 1024)} KB), ${giuNguyen} giữ nguyên, ${loi.length} lỗi → ${RA}`);
for (const l of loi) console.log('  ⚠️ ' + l);
