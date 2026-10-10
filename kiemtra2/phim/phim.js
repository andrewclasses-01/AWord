// Phim hoạt hình "Tom's Sunday Picnic" — bài kiểm tra TRÍ NHỚ (lớp 3–4). BẢN 2 (10/10/2026): vẽ lại toàn bộ.
// Nhân vật: Tom (mũ ĐỎ) · Robert anh trai (áo phông VÀNG, cao hơn Tom một cái đầu) · chó Max (NÂU) · Mom (cảnh cuối).
// Chỉ HTML/SVG/CSS/JS + giọng thầy Andrew (mp3 từng câu) + nhạc nền Incompetech + tiếng động THẬT (Wikimedia Commons, xem GHI CONG.md).
// Dùng: import { taoPhim } from './phim/phim.js';
//   const p = taoPhim(khung, { tu: 0, onCanh(i){}, onXong(){} });
//   await p.san();                  // tải xong mọi mp3
//   nút.onclick = () => p.chay();   // PHẢI gọi từ cú bấm (để trình duyệt cho phát tiếng)
//   p.dung() / p.tiep()             // tạm dừng khi ẩn tab / chạy tiếp
//   p.huy()                         // dừng hẳn + dọn
// KHÔNG có nút điều khiển nào trên phim (không tua, không dừng, không bỏ qua).
// File này được ghép từ phim2-tam/src/*.js (a-nhanvat, b-dovat, c-canh, d-trinhphat).
import { GIONG } from './du-lieu.js';

export const SO_CANH = 12;
const DUOI = 3.2;                 // màn kết "The End" sau cảnh cuối (giây)
const NHAC_GHI_CONG = 'Music: "Wallpaper" — Kevin MacLeod (incompetech.com), CC BY 4.0';
const TIENG_GHI_CONG = 'Sound effects: Wikimedia Commons — Amada44 (CC BY-SA 3.0) · Jonathon Jongsma / xeno-canto (CC BY-SA 3.0) · Gravity Sound (CC BY 4.0) · Work With Sounds / Technical Museum of Slovenia (CC BY 4.0) · ezwa, gradha (public domain) — see credits';
const NHAC_TO = 0.16, NHAC_NHO = 0.06;   // nhạc khi không lời / khi đang đọc

const url = (p) => new URL(p, import.meta.url).href;

// ───────────────────────── tiện ích ─────────────────────────
const kep = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const tron = (x) => { x = kep(x); return x * x * (3 - 2 * x); };
const em = (x) => { x = kep(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const raNhanh = (x) => { x = kep(x); return 1 - Math.pow(1 - x, 3); };
const bat = (x) => { x = kep(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const noi = (a, b, x) => a + (b - a) * x;
const doan = (t, a, b) => em((t - a) / (b - a));      // 0→1 mượt trong [a,b]
const n1 = (v) => (Math.round(v * 10) / 10).toString();
function dat(el, x, y, s = 1, lat = false, xoay = 0) {
  if (!el) return;
  el.setAttribute('transform', `translate(${n1(x)} ${n1(y)})` + (xoay ? ` rotate(${n1(xoay)})` : '') + ` scale(${(lat ? -s : s).toFixed(3)} ${s.toFixed(3)})`);
}
function mo(el, o) { if (el) el.setAttribute('opacity', kep(o).toFixed(3)); }
function quay(el, a, cx = 0, cy = 0) { if (el) el.setAttribute('transform', cx || cy ? `rotate(${n1(a)} ${cx} ${cy})` : `rotate(${n1(a)})`); }
// bong bóng/vật bật ra lúc a, tắt lúc b
function bung(el, x, y, t, a, b = 1e9, s = 1) {
  if (!el) return;
  const vao = t < a ? 0 : bat((t - a) / 0.4); const ra = t < b ? 1 : 1 - kep((t - b) / 0.3);
  const k = Math.max(0.001, vao * ra);
  dat(el, x, y, s * k); mo(el, t < a ? 0 : ra);
}
const khop = (k, x, y, ben) => `<g transform="translate(${x} ${y})"><g data-k="${k}">${ben}</g></g>`;
const VN = (c, w = 2.4) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FONT = "'Baloo 2',system-ui,sans-serif";

// ───────────────────────── bảng màu dùng chung (một <defs> cho cả phim) ─────────────────────────
const lg = (id, stops, x2 = 0, y2 = 1, x1 = 0, y1 = 0) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const DEFS = `<defs>
${rg('pDa', [[0, '#ffeadb'], [0.62, '#f9cba8'], [1, '#eaa983']], 0.4, 0.36, 0.7)}
${lg('pDaL', [[0, '#ffe6d3'], [0.55, '#f8c9a6'], [1, '#e7a983']], 1, 0)}
${rg('pMu', [[0, '#ff7a68'], [0.55, '#e3342a'], [1, '#a51a15']], 0.36, 0.3, 0.75)}
${lg('pMuV', [[0, '#e0322a'], [1, '#8c1510']])}
${lg('pAoT', [[0, '#ffffff'], [0.6, '#eff3f8'], [1, '#cdd6e2']], 1, 1)}
${lg('pQT', [[0, '#dcb983'], [1, '#b08852']], 1, 0)}
${rg('pAoR', [[0, '#ffe680'], [0.55, '#ffcd2e'], [1, '#e9a40f']], 0.36, 0.28, 0.8)}
${lg('pAoRL', [[0, '#ffe36e'], [1, '#f0ae17']], 1, 0)}
${lg('pJean', [[0, '#55668a'], [1, '#2a3550']], 1, 0)}
${lg('pTocT', [[0, '#93603a'], [1, '#56331a']], 1, 1)}
${lg('pTocR', [[0, '#6a442a'], [1, '#2b180b']], 1, 1)}
${lg('pGiayT', [[0, '#40537d'], [1, '#1f2b45']], 0, 1)}
${lg('pGiayR', [[0, '#ffffff'], [1, '#c6cdd8']], 0, 1)}
${rg('pNau', [[0, '#d08f50'], [0.6, '#a9652f'], [1, '#7a431e']], 0.42, 0.3, 0.8)}
${lg('pNauL', [[0, '#bd7b40'], [1, '#86491f']], 1, 0)}
${lg('pNauX', [[0, '#93592b'], [1, '#633414']], 1, 0)}
${lg('pNauD', [[0, '#80492a'], [1, '#4a2711']], 1, 1)}
${lg('pKem', [[0, '#fdeed6'], [1, '#e6c393']], 0, 1)}
${rg('pBong', [[0, '#1d1a28', 0.42], [0.6, '#1d1a28', 0.18], [1, '#1d1a28', 0]])}
${rg('pMa', [[0, '#ff8d8d', 0.55], [1, '#ff8d8d', 0]])}
${rg('pMat', [[0, '#8f5a33'], [1, '#3a1f0e']], 0.45, 0.4, 0.6)}
${rg('pBalo', [[0, '#62a8ff'], [0.6, '#2f7ff0'], [1, '#1a52b3']], 0.35, 0.3, 0.8)}
${lg('pBaloT', [[0, '#2c74e0'], [1, '#1b4ca3']], 0, 1)}
${lg('pVay', [[0, '#a96fd0'], [1, '#6a3a90']], 1, 1)}
${lg('pTocM', [[0, '#71442a'], [1, '#3b2012']], 1, 1)}
${rg('pVit', [[0, '#ffffff'], [0.6, '#f0f3f7'], [1, '#c8d1dd']], 0.4, 0.3, 0.8)}
${lg('pCam', [[0, '#ffb840'], [1, '#ef840c']], 0, 1)}
${rg('pChim', [[0, '#9cf27a'], [0.55, '#45c445'], [1, '#22862c']], 0.4, 0.3, 0.8)}
${lg('pBanh', [[0, '#fff6e6'], [1, '#f1d6a6']], 0, 1)}
${lg('pVo', [[0, '#e3a663'], [1, '#b8742f']], 0, 1)}
${rg('pSang', [[0, '#fffbe8', 0.95], [0.4, '#fff3b0', 0.55], [1, '#fff3b0', 0]])}
${rg('pSangT', [[0, '#ffffff', 0.9], [1, '#ffffff', 0]])}
${lg('pChai', [[0, '#f4fbff', 0.9], [0.5, '#ffffff', 0.55], [1, '#cfe6f5', 0.9]], 1, 0)}
${lg('pNuocCam', [[0, '#ffc15a'], [1, '#f08a0c']], 1, 0)}
${lg('pGo', [[0, '#b98256'], [1, '#8a5a35']], 0, 1)}
${lg('pThan', [[0, '#9b6a44'], [0.5, '#80532f'], [1, '#5f3a1e']], 1, 0)}
${rg('pLa1', [[0, '#8fd36a'], [0.7, '#56a844'], [1, '#3b8a35']], 0.4, 0.3, 0.8)}
${rg('pLa2', [[0, '#6fbd57'], [1, '#2f7a33']], 0.4, 0.3, 0.8)}
${lg('pBui', [[0, '#79c45c'], [1, '#3f8f3c']], 0, 1)}
${lg('pMay', [[0, '#ffffff'], [0.7, '#f4f8fc'], [1, '#d7e3ef']], 0, 1)}
${lg('pMayX', [[0, '#a7b2c2'], [1, '#6f7c90']], 0, 1)}
</defs>`;

// ───────────────────────── khuôn mặt dùng chung ─────────────────────────
function mat1(cx, cy, rx, ry) {   // một mắt nhìn sang phải (hướng nhân vật đang quay)
  const r = ry * 0.6;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="#3a2416" stroke-width="1.5"/>
  <circle cx="${cx + 2}" cy="${cy + 1}" r="${r}" fill="url(#pMat)"/><circle cx="${cx + 2.4}" cy="${cy + 1.3}" r="${ry * 0.3}" fill="#170b04"/>
  <circle cx="${cx - 0.4}" cy="${cy - ry * 0.28}" r="${ry * 0.21}" fill="#fff"/><circle cx="${cx + 4}" cy="${cy + ry * 0.36}" r="${ry * 0.1}" fill="#fff" opacity=".85"/>
  <path d="M${cx - rx - 1.2} ${cy - ry * 0.3} C${cx - rx * 0.6} ${cy - ry - 2.6} ${cx + rx * 0.6} ${cy - ry - 2.6} ${cx + rx + 1.4} ${cy - ry * 0.42}" fill="none" stroke="#2a170c" stroke-width="2.8" stroke-linecap="round"/>`;
}
function banTay(y, ot, s = 1) {   // bàn tay (gốc = cổ tay)
  return `<g transform="translate(0 ${y}) scale(${s})"><path d="M-7 -4 C-9.6 4 -8.6 11 -2 13 C5 14.4 9.6 9 8.6 1 C8 -4 5 -7 0 -7 C-3 -7 -5.5 -6.5 -7 -4 Z" fill="url(#pDa)" ${VN(ot, 2.1)}/>
  <path d="M6.2 -2.6 C10.4 -4.6 13 -0.6 10.2 3.4 C9 4.8 7.6 5 6.6 4.4" fill="url(#pDa)" ${VN(ot, 2)}/></g>`;
}
const miengCuoi = (k, x, y, w = 20) => `<g data-k="${k}-m0"><path d="M${x - w / 2} ${y - 3} C${x - w / 4} ${y + 3.6} ${x + w / 4} ${y + 3.6} ${x + w / 2} ${y - 4}" fill="none" stroke="#7a3b2a" stroke-width="2.8" stroke-linecap="round"/></g>
  <g data-k="${k}-m1" opacity="0"><path d="M${x - w / 2 - 1} ${y - 5} C${x - w / 2 + 2} ${y + 10} ${x + w / 2 - 2} ${y + 11} ${x + w / 2 + 2} ${y - 6} C${x + 4} ${y - 2} ${x - 4} ${y - 2} ${x - w / 2 - 1} ${y - 5} Z" fill="#7d2a26" stroke="#561b18" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M${x - w / 2 + 1.6} ${y - 4} C${x - 3} ${y - 1.6} ${x + 3} ${y - 1.6} ${x + w / 2 - 0.6} ${y - 4.6} L${x + w / 2 - 1.4} ${y - 1.6} C${x + 3} ${y + 0.4} ${x - 3} ${y + 0.4} ${x - w / 2 + 2.4} ${y - 1.4} Z" fill="#fff"/>
    <path d="M${x - 5} ${y + 6} C${x - 2} ${y + 3} ${x + 4} ${y + 3} ${x + 6} ${y + 6} C${x + 3} ${y + 8.5} ${x - 2} ${y + 8.5} ${x - 5} ${y + 6} Z" fill="#ff8a8a"/></g>
  <g data-k="${k}-m2" opacity="0"><ellipse cx="${x + 1}" cy="${y + 1}" rx="4.6" ry="5.8" fill="#7d2a26" stroke="#561b18" stroke-width="1.4"/></g>`;

// ───────────────────────── TOM (8 tuổi, mũ đỏ; gốc = giữa hai bàn chân, cao ~300) ─────────────────────────
function tom(k, o = {}) {
  const ot = '#c58d6a'; const sl = VN(ot, 2.3);
  const chan = (s, x) => khop(`${k}-h${s}`, x, -98,
    `<path d="M-12 -6 C-13 8 -12.4 18 -11.4 26 L11.4 26 C12.4 18 13 8 12 -6 Z" fill="url(#pQT)" ${VN('#8f6a3a', 2.1)}/>
     <path d="M-8.5 24 C-9 32 -8.5 40 -7.5 47 L7.5 47 C8.5 40 9 32 8.5 24 Z" fill="url(#pDaL)" ${sl}/>` +
    khop(`${k}-k${s}`, 0, 45, `<path d="M-7.5 -2 C-7.8 12 -7 26 -6.2 36 L6.2 36 C7 26 7.8 12 7.5 -2 C7.5 -11.4 -7.5 -11.4 -7.5 -2 Z" fill="url(#pDaL)" ${sl}/>
      <path d="M-6.9 28 L6.9 28 L6.7 39 L-6.7 39 Z" fill="#f5f7fb" ${VN('#b9c2cf', 1.7)}/>
      <path d="M-10 37 C-11 33 0 31 7 33 C15 35 22 38 23 44 C23.5 48 20 50 15 50 L-9 50 C-12.5 50 -13 40 -10 37 Z" fill="url(#pGiayT)" ${VN('#18213a', 2.1)}/>
      <path d="M-12.2 46.4 L23.5 46.4 C23 49 21 51 16 51 L-9.5 51 C-12 51 -12.6 49 -12.2 46.4 Z" fill="#f2f4f8"/>
      <path d="M3 35.6 L8.6 39.6 M6.6 34.4 L12 38.4" stroke="#f2f4f8" stroke-width="1.8" stroke-linecap="round"/>`));
  const tay = (s, x) => khop(`${k}-s${s}`, x, -172,
    `<path d="M-8 8 C-8.6 20 -8 30 -7.2 40 L7.2 40 C8 30 8.6 20 8 8 Z" fill="url(#pDaL)" ${sl}/>
     <path d="M-13 -9 C-15 3 -14.5 14 -12.5 22 C-4 25 4 25 12.5 22 C14.5 14 15 3 13 -9 C5 -14 -5 -14 -13 -9 Z" fill="url(#pAoT)"/>
     <path d="${s === 'r' ? 'M10 -12 C14.6 -6 15 3 14.5 10 C14 16 13.5 19 12.5 22 C4 25 -4 25 -12.5 22' : 'M-10 -12 C-14.6 -6 -15 3 -14.5 10 C-14 16 -13.5 19 -12.5 22 C-4 25 4 25 12.5 22'}" fill="none" ${VN('#a9b5c5', 2.1)}/>
     <path d="M-12.4 19.4 C-4 22.6 4 22.6 12.4 19.4" fill="none" stroke="#e2392f" stroke-width="3.2" stroke-linecap="round"/>` +
    khop(`${k}-e${s}`, 0, 38, `<path d="M-7.2 -2 C-7.4 10 -6.8 20 -6.2 28 L6.2 28 C6.8 20 7.4 10 7.2 -2 C7.2 -11.0 -7.2 -11.0 -7.2 -2 Z" fill="url(#pDaL)" ${sl}/>` + banTay(31, ot) + `<g transform="translate(0 31)">${(s === 'r' ? o.camR : o.camL) || ''}</g>`));
  const balo = o.balo ? `<g data-k="${k}-balo"><path d="M-62 -178 C-70 -176 -73 -160 -72 -140 C-71 -122 -68 -108 -60 -104 C-50 -101 -38 -104 -34 -110 L-34 -176 C-40 -182 -54 -182 -62 -178 Z" fill="url(#pBalo)" ${VN('#123a85', 2.3)}/>
      <path d="M-70 -150 C-62 -146 -50 -146 -38 -150 L-38 -124 C-50 -120 -62 -120 -70 -124 Z" fill="url(#pBaloT)" ${VN('#123a85', 1.8)}/>
      <path d="M-66 -170 C-58 -175 -46 -175 -38 -170" fill="none" stroke="#9cc8ff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/></g>` : '';
  const quai = o.balo ? `<path d="M-26 -181 C-30 -160 -30 -136 -26 -112" fill="none" stroke="#1d56b8" stroke-width="7" stroke-linecap="round"/><path d="M-26 -181 C-30 -160 -30 -136 -26 -112" fill="none" stroke="#3d8bff" stroke-width="3.4" stroke-linecap="round"/>` : '';
  const than = `<path d="M-30 -117 C-31 -106 -31.5 -96 -31 -86 C-16 -82 16 -82 31 -86 C31.5 -96 31 -106 30 -117 C10 -112 -10 -112 -30 -117 Z" fill="url(#pQT)" ${VN('#8f6a3a', 2.1)}/>
    <path d="M0 -112 L0 -92" stroke="#9c7746" stroke-width="2" stroke-linecap="round"/>
    <path d="M-27 -183 C-37 -181 -41 -172 -40.5 -160 C-40 -142 -37.5 -122 -36 -104 C-13 -98.5 13 -98.5 36 -104 C37.5 -122 40 -142 40.5 -160 C41 -172 37 -181 27 -183 C15 -176.5 -15 -176.5 -27 -183 Z" fill="url(#pAoT)" ${VN('#a9b5c5', 2.3)}/>
    <path d="M-35.6 -112 C-12 -106 12 -106 35.6 -112 L36 -104 C13 -98.5 -13 -98.5 -36 -104 Z" fill="#c9d3e0" opacity=".75"/>
    <path d="M-15.5 -180.5 C-9 -171 9 -171 15.5 -180.5" fill="none" stroke="#e2392f" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M-19 -150 C-21 -138 -20 -126 -17 -116 M25 -160 C28 -146 27 -132 23 -120" fill="none" stroke="#c6d0dd" stroke-width="2" stroke-linecap="round"/>`;
  const dau = khop(`${k}-dau`, 0, -182, `<g transform="translate(0 182)">
    <path d="M-8.5 -194 L-8 -177 C-3 -174 3 -174 8 -177 L8.5 -194 Z" fill="#e3a27c"/>
    <path d="M-38 -232 C-41 -218 -36 -204 -28 -198 C-31 -212 -31 -224 -28 -236 Z" fill="url(#pTocT)"/>
    <path d="M-38 -238 C-39 -266 -18 -282 6 -282 C31 -282 47 -265 46 -239 C45.5 -212 29 -190 5 -190 C-19 -190 -37 -209 -38 -238 Z" fill="url(#pDa)" ${VN(ot, 2.4)}/>
    <path d="M-30 -214 C-22 -198 -8 -191 6 -191" fill="none" stroke="#eaa983" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <path d="M-35 -242 C-45 -244 -49 -230 -43 -222 C-40 -218 -36 -218 -34 -221 Z" fill="url(#pDa)" ${VN(ot, 2.1)}/>
    <path d="M-39.5 -236 C-43 -234 -43 -228 -40.4 -225.6" fill="none" stroke="${ot}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M-40 -250 C-46 -238 -45 -226 -40 -219 C-39 -228 -36 -238 -30 -246 Z" fill="url(#pTocT)"/>
    <path d="M10 -251 C13 -244 19 -241 25 -244 C27 -240 33 -239 37 -244 C40 -241 44 -242 45 -247 L42 -254 Z" fill="url(#pTocT)"/>
    <ellipse cx="-8" cy="-212" rx="8.5" ry="5.2" fill="url(#pMa)"/><ellipse cx="32" cy="-212" rx="7" ry="5" fill="url(#pMa)"/>
    <g data-k="${k}-mat" data-cy="-229">${mat1(-5, -229, 7.4, 9.6)}${mat1(23, -229, 8.4, 10)}</g>
    <g data-k="${k}-may"><path d="M-14 -246 C-9 -250 -2 -250 2 -247 M15 -247 C20 -251 28 -251 33 -247" fill="none" stroke="#5a361c" stroke-width="3.3" stroke-linecap="round"/></g>
    <path d="M31 -222 C35.4 -218 35 -214.6 30 -214" fill="none" stroke="#cf8d69" stroke-width="2.4" stroke-linecap="round"/>
    ${miengCuoi(k, 17, -203, 19)}
    <g data-k="${k}-mu">
      <path d="M-43 -247 C-45 -280 -20 -299 8 -299 C36 -299 53 -281 50 -250 C40 -257 18 -260 2 -259 C-16 -258 -32 -254 -43 -247 Z" fill="url(#pMu)" ${VN('#8e1612', 2.3)}/>
      <path d="M-43 -247 C-32 -254 -16 -258 2 -259 C18 -260 40 -257 50 -250 L50.4 -244.6 C38 -250.6 18 -253.6 2 -253 C-16 -252 -32 -248.6 -43.4 -241.6 Z" fill="#b51f19" ${VN('#8e1612', 1.8)}/>
      <path d="M8 -299 C3 -282 1 -270 2 -259 M8 -299 C24 -286 32 -272 34 -256" fill="none" stroke="#a11a15" stroke-width="1.8" opacity=".7"/>
      <path d="M-30 -268 C-24 -284 -8 -292 6 -292" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".32"/>
      <path d="M33 -254 C51 -259 76 -258 89 -250 C92 -246 88 -241 79 -241 C64 -242 46 -244 27 -245 Z" fill="url(#pMuV)" ${VN('#7a130f', 2.2)}/>
      <path d="M40 -251 C56 -254 72 -253 84 -248" fill="none" stroke="#ff8a7a" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      <circle cx="8" cy="-299" r="4.4" fill="#e3342a" ${VN('#8e1612', 1.8)}/>
    </g></g>`);
  return `<g data-k="${k}"><ellipse data-k="${k}-bong" cx="0" cy="0" rx="58" ry="9" fill="url(#pBong)"/><g data-k="${k}-than">
    ${tay('l', -31)}${chan('l', -12)}${chan('r', 12)}${balo}${than}${quai}${dau}${tay('r', 31)}${o.them || ''}
  </g></g>`;
}

// ───────────────────────── ROBERT (anh trai, áo phông vàng; cao ~412 — hơn Tom một cái đầu) ─────────────────────────
function robert(k, o = {}) {
  const ot = '#c58d6a'; const sl = VN(ot, 2.3);
  const chan = (s, x) => khop(`${k}-h${s}`, x, -164,
    `<path d="M-16 -6 C-17 20 -15.4 50 -13 80 L13 80 C15.4 50 17 20 16 -6 Z" fill="url(#pJean)" ${VN('#1b2336', 2.2)}/>
     <path d="M-4 10 C-5 30 -4 50 -3 70" fill="none" stroke="#6e81a6" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>` +
    khop(`${k}-k${s}`, 0, 78, `<path d="M-13 -2 C-13 24 -12 50 -11.2 70 L11.2 70 C12 50 13 24 13 -2 C13.0 -18.2 -13.0 -18.2 -13.0 -2 Z" fill="url(#pJean)" ${VN('#1b2336', 2.2)}/>
      <path d="M-12 63 L12 63 L11.8 71 L-11.8 71 Z" fill="#5d7099" ${VN('#1b2336', 1.6)}/>
      <path d="M-13 68 C-14 64 0 62 9 64 C19 66 27 70 28 77 C28.5 81 25 83 19 83 L-12 83 C-16 83 -16.5 72 -13 68 Z" fill="url(#pGiayR)" ${VN('#8792a3', 2.1)}/>
      <path d="M-15.2 79 L28.4 79 C28 82 25 84 19 84 L-12 84 C-15 84 -15.6 82 -15.2 79 Z" fill="#d3d9e2"/>
      <path d="M2 70 C8 70 14 72 19 75.5" fill="none" stroke="#6b7a94" stroke-width="2.4" stroke-linecap="round"/>`));
  const tay = (s, x) => khop(`${k}-s${s}`, x, -283,
    `<path d="M-10 18 C-10.6 34 -10 50 -8.8 64 L8.8 64 C10 50 10.6 34 10 18 Z" fill="url(#pDaL)" ${sl}/>
     <path d="M-15 -10 C-17.5 6 -17 20 -15 30 C-5 33.5 5 33.5 15 30 C17 20 17.5 6 15 -10 C6 -16 -6 -16 -15 -10 Z" fill="url(#pAoRL)"/>
     <path d="${s === 'r' ? 'M11 -14 C16.6 -8 17.6 4 17 14 C16.6 22 16 26 15 30 C5 33.5 -5 33.5 -15 30' : 'M-11 -14 C-16.6 -8 -17.6 4 -17 14 C-16.6 22 -16 26 -15 30 C-5 33.5 5 33.5 15 30'}" fill="none" ${VN('#c98a0c', 2.2)}/>
     <path d="M-14.6 26.6 C-5 30 5 30 14.6 26.6" fill="none" stroke="#e5a50f" stroke-width="2.6" stroke-linecap="round"/>` +
    khop(`${k}-e${s}`, 0, 62, `<path d="M-8.8 -2 C-9 16 -8.4 32 -7.6 46 L7.6 46 C8.4 32 9 16 8.8 -2 C8.8 -13.0 -8.8 -13.0 -8.8 -2 Z" fill="url(#pDaL)" ${sl}/>` + banTay(50, ot, 1.24) + `<g transform="translate(0 50)">${(s === 'r' ? o.camR : o.camL) || ''}</g>`));
  const than = `<path d="M-39 -182 C-40 -168 -40.5 -156 -40 -146 C-20 -141 20 -141 40 -146 C40.5 -156 40 -168 39 -182 C14 -177 -14 -177 -39 -182 Z" fill="url(#pJean)" ${VN('#1b2336', 2.2)}/>
    <path d="M-39.4 -176 C-14 -171 14 -171 39.4 -176" fill="none" stroke="#3e2a1c" stroke-width="5"/>
    <path d="M-34 -295 C-47 -293 -52 -282 -51.5 -268 C-51 -238 -47 -200 -45 -168 C-15 -162 15 -162 45 -168 C47 -200 51 -238 51.5 -268 C52 -282 47 -293 34 -295 C20 -288 -20 -288 -34 -295 Z" fill="url(#pAoR)" ${VN('#c98a0c', 2.4)}/>
    <path d="M-44.4 -178 C-15 -172 15 -172 44.4 -178 L45 -168 C15 -162 -15 -162 -45 -168 Z" fill="#e9a812" opacity=".75"/>
    <path d="M-19 -292 C-10 -279 10 -279 19 -292" fill="none" stroke="#e3a20e" stroke-width="5" stroke-linecap="round"/>
    <path d="M-24 -250 C-27 -232 -26 -210 -22 -190 M30 -262 C34 -240 33 -214 28 -196" fill="none" stroke="#efb21b" stroke-width="2.2" stroke-linecap="round"/>
    <g data-k="${k}-bong-ao" opacity="0"><path d="M-30 -290 L-10 -290 L-40 -170 L-60 -170 Z" fill="#fff" opacity=".55"/></g>`;
  const dau = khop(`${k}-dau`, 0, -292, `<g transform="translate(0 292)">
    <path d="M-9.5 -306 L-9 -289 C-3 -286 3 -286 9 -289 L9.5 -306 Z" fill="#e3a27c"/>
    <path d="M-40 -352 C-41 -382 -19 -400 6 -400 C32 -400 48 -382 47 -352 C46.5 -326 34 -298 6 -298 C-20 -298 -39 -322 -40 -352 Z" fill="url(#pDa)" ${VN(ot, 2.4)}/>
    <path d="M-32 -322 C-24 -306 -10 -299 6 -299" fill="none" stroke="#eaa983" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <path d="M-37 -356 C-47 -358 -51 -344 -45 -336 C-42 -332 -38 -332 -36 -335 Z" fill="url(#pDa)" ${VN(ot, 2.1)}/>
    <path d="M-41.5 -350 C-45 -348 -45 -342 -42.4 -339.6" fill="none" stroke="${ot}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M-44 -356 C-50 -392 -22 -415 8 -413 C38 -412 57 -394 52 -364 C47 -377 35 -384 23 -383 C29 -376 29 -368 25 -362 C15 -376 -1 -381 -15 -375 C-25 -371 -31 -363 -34 -350 C-37 -347 -42 -347 -44 -356 Z" fill="url(#pTocR)" ${VN('#21120a', 1.8)}/>
    <path d="M-36 -352 C-38 -342 -36 -334 -32 -330 L-30.5 -350 Z" fill="url(#pTocR)"/>
    <path d="M-26 -398 C-10 -407 12 -407 30 -399" fill="none" stroke="#9a6a45" stroke-width="3" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="-8" cy="-326" rx="8" ry="5" fill="url(#pMa)" opacity=".7"/><ellipse cx="32" cy="-326" rx="6.6" ry="4.6" fill="url(#pMa)" opacity=".7"/>
    <g data-k="${k}-mat" data-cy="-343">${mat1(-5, -343, 7, 9)}${mat1(23, -343, 8, 9.4)}</g>
    <g data-k="${k}-may"><path d="M-15 -359 C-9 -364 -1 -364 3 -360 M14 -360 C20 -365 29 -365 34 -360" fill="none" stroke="#2b180b" stroke-width="3.8" stroke-linecap="round"/></g>
    <path d="M31 -336 C36 -331 35.6 -327.6 30 -327" fill="none" stroke="#cf8d69" stroke-width="2.5" stroke-linecap="round"/>
    ${miengCuoi(k, 17, -315, 21)}
  </g>`);
  return `<g data-k="${k}"><ellipse data-k="${k}-bong" cx="0" cy="0" rx="64" ry="10" fill="url(#pBong)"/><g data-k="${k}-than">
    ${tay('l', -40)}${chan('l', -17)}${chan('r', 17)}${than}${dau}${tay('r', 40)}${o.them || ''}
  </g></g>`;
}

// ───────────────────────── MAX (chó nâu; nhìn ngang, quay phải; gốc = mặt đất dưới thân) ─────────────────────────
function max(k, o = {}) {
  const ov = '#5e3417';
  const chan = (n, x, y, g) => {   // n: ta/tx = chân trước (gần/xa), sa/sx = chân sau
    const sau = n[0] === 's';
    const tren = sau ? 'M-20 -18 C-24 4 -16 26 -7 40 L8 38 C15 22 20 2 16 -20 Z' : 'M-14 -14 C-15.5 6 -12 24 -8.4 42 L8.4 42 C11 24 13.5 6 13 -14 Z';
    const vTren = sau ? 'M-20 -12 C-23 6 -16 26 -7 40 M8 38 C15 22 19 6 17 -10' : 'M-14.6 -6 C-15 10 -12 26 -8.4 42 M8.4 42 C11 26 13.6 10 13.4 -6';
    return khop(`${k}-${n}`, x, y, `<path d="${tren}" fill="url(#${g})"/><path d="${vTren}" fill="none" ${VN(ov, 2.1)}/>` +
      khop(`${k}-${n}g`, sau ? 1 : 0, 40, `<path d="${sau ? 'M-7.6 -4 C-8.6 10 -7 22 -6.4 32 L6.4 32 C7 22 8.4 10 8 -4 Z' : 'M-8.4 -4 C-8.4 10 -7.4 22 -6.6 32 L6.6 32 C7.4 22 8.4 10 8.4 -4 Z'}" fill="url(#${g})"/>
        <path d="${sau ? 'M-7.6 0 C-8.4 12 -7 22 -6.4 32 M6.4 32 C7 22 8.2 12 8 0' : 'M-8.4 0 C-8.4 12 -7.4 22 -6.6 32 M6.6 32 C7.4 22 8.4 12 8.4 0'}" fill="none" ${VN(ov, 2.1)}/>
        <path d="M-9 29 C-10.5 36 -5 40.5 4 40.5 C12.6 40.5 17 37 15.4 32.4 C13.4 29 1 28 -9 29 Z" fill="url(#pKem)" ${VN('#9c7650', 1.9)}/>
        <path d="M5 35 L5.5 40 M10 34.5 L10.6 39.5" stroke="#b08a60" stroke-width="1.4" stroke-linecap="round"/>`));
  };
  const banh = `<g data-k="${k}-banh" opacity="0"><g transform="translate(150 -118) rotate(14) scale(.4)">${banhMi()}</g></g>`;
  return `<g data-k="${k}"><ellipse data-k="${k}-bong" cx="0" cy="0" rx="104" ry="11" fill="url(#pBong)"/><g data-k="${k}-than">
    ${chan('tx', 30, -86, 'pNauX')}${chan('sx', -64, -88, 'pNauX')}
    ${khop(`${k}-duoi`, -78, -108, `<path d="M2 2 C-12 -6 -24 -22 -28 -42 C-30 -52 -24 -58 -19 -52 C-16 -36 -8 -20 8 -8 Z" fill="url(#pNau)" ${VN(ov, 2.1)}/>
       <path d="M-28 -42 C-30 -52 -24 -58 -19 -52 Q-22 -49 -21 -46 Q-25 -46 -27 -40 Z" fill="url(#pKem)"/>`)}
    <g data-k="${k}-minh">
    <path d="M-80 -98 C-83 -124 -56 -138 -22 -136 C12 -134 42 -138 62 -128 C84 -116 86 -88 72 -74 C54 -60 20 -66 -10 -66 C-42 -66 -77 -68 -80 -98 Z" fill="url(#pNau)" ${VN(ov, 2.4)}/>
    <path d="M-30 -69 C-10 -65 20 -65 46 -71 C40 -77 10 -79 -30 -77 Z" fill="url(#pKem)" opacity=".9"/>
    <path d="M44 -124 C66 -120 82 -104 78 -86 C74 -72 60 -66 46 -70 C56 -86 56 -108 44 -124 Z" fill="url(#pKem)"/>
    <path d="M52 -73 Q56 -65 58 -62 Q60 -68 62 -70 Q64 -63 66 -60 Q68 -66 70 -69 Q73 -64 75 -64 Q76 -69 75 -76 Z" fill="url(#pKem)" ${VN('#c9a271', 1.3)}/>
    <path d="M-44 -133 q4 -7 8 -2 q4 -7 8 -1 M2 -134 q4 -6 8 -1" fill="none" stroke="${ov}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
    <path d="M-84 -100 C-86 -122 -66 -130 -48 -122 C-34 -114 -32 -92 -40 -78 C-50 -66 -78 -72 -84 -100 Z" fill="url(#pNau)" ${VN(ov, 2)}/>
    <path d="M-74 -112 C-68 -120 -58 -122 -50 -118" fill="none" stroke="#e0a468" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <path d="M54 -132 C62 -118 70 -108 82 -104 L86 -112 C74 -116 66 -126 62 -138 Z" fill="#2f3542" ${VN('#1a1d25', 1.6)}/>
    <circle cx="79" cy="-102" r="5.2" fill="#f2c14e" ${VN('#a67c1a', 1.4)}/>
    </g>
    ${chan('ta', 46, -84, 'pNauL')}${chan('sa', -52, -86, 'pNauL')}
    ${khop(`${k}-dau`, 64, -130, `<g transform="translate(-64 130)">
      <path d="M70 -186 C58 -190 50 -176 54 -160 C56 -152 62 -150 66 -156 Z" fill="url(#pNauD)"/>
      <path d="M52 -152 C49 -182 70 -198 96 -197 C119 -196 131 -181 132 -165 C146 -163 160 -155 161 -142 C161 -128 147 -120 129 -121 C117 -113 97 -111 81 -116 C63 -122 54 -135 52 -152 Z" fill="url(#pNau)" ${VN(ov, 2.4)}/>
      <path d="M116 -163 C134 -164 156 -156 159 -143 C160 -130 146 -123 128 -123 C118 -132 113 -150 116 -163 Z" fill="url(#pKem)"/>
      <path d="M84 -117 Q88 -110 92 -111 Q93 -116 97 -113 Q100 -109 104 -112" fill="none" stroke="${ov}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M80 -195 C82 -204 88 -206 90 -199 C92 -206 98 -206 99 -197" fill="url(#pNau)" ${VN(ov, 1.8)}/>
      <g data-k="${k}-m0"><path d="M128 -127 C135 -122 144 -122 151 -128" fill="none" stroke="${ov}" stroke-width="2.4" stroke-linecap="round"/></g>
      <g data-k="${k}-m1" opacity="0"><path d="M126 -131 C131 -110 151 -110 157 -133 C147 -127 136 -127 126 -131 Z" fill="#5a1d1a" ${VN('#3d1210', 1.6)}/>
        <path d="M134 -121 C133 -104 147 -101 149 -118 Z" fill="#ff7f8f" ${VN('#c4505e', 1.4)}/></g>
      <path d="M147 -160 C155 -162 162 -157 161 -150 C160 -145 152 -144 147 -148 C144 -151 144 -157 147 -160 Z" fill="#241510"/>
      <ellipse cx="152" cy="-156" rx="3.2" ry="1.8" fill="#fff" opacity=".55"/>
      <g data-k="${k}-mat" data-cy="-168"><ellipse cx="104" cy="-168" rx="7.6" ry="8.6" fill="#24140a"/><circle cx="101.6" cy="-171" r="2.8" fill="#fff"/><circle cx="107" cy="-164.6" r="1.2" fill="#fff" opacity=".8"/></g>
      <path d="M93 -182 C99 -187 108 -187 114 -181" fill="none" stroke="${ov}" stroke-width="3" stroke-linecap="round"/>
      ${banh}
      ${khop(`${k}-tai`, 78, -190, `<path d="M0 0 C-14 1 -22 16 -20 38 C-19 50 -10 55 -3 47 C3 34 7 16 6 2 Z" fill="url(#pNauD)" ${VN('#3d1f0c', 2.1)}/>
        <path d="M-6 8 C-12 18 -14 30 -12 40" fill="none" stroke="#9a5a33" stroke-width="2" stroke-linecap="round" opacity=".6"/>`)}
    </g>`)}
  </g></g>`;
}

// ───────────────────────── MOM (cảnh cuối) ─────────────────────────
function me(k) {
  const ot = '#c58d6a'; const sl = VN(ot, 2.3);
  const tay = (s, x) => khop(`${k}-s${s}`, x, -290,
    `<path d="M-8 6 C-8.6 26 -8 46 -7 62 L7 62 C8 46 8.6 26 8 6 Z" fill="url(#pDaL)" ${sl}/>
     <path d="M-14 -8 C-16 4 -15.6 12 -14 20 C-5 23 5 23 14 20 C15.6 12 16 4 14 -8 C6 -14 -6 -14 -14 -8 Z" fill="url(#pVay)"/>
     <path d="${s === 'r' ? 'M10 -12 C15 -6 16 6 15.4 12 C15 16 14.6 18 14 20 C5 23 -5 23 -14 20' : 'M-10 -12 C-15 -6 -16 6 -15.4 12 C-15 16 -14.6 18 -14 20 C-5 23 5 23 14 20'}" fill="none" ${VN('#4f2a6c', 2)}/>` +
    khop(`${k}-e${s}`, 0, 60, `<path d="M-7 -2 C-7.3 14 -6.8 28 -6 42 L6 42 C6.8 28 7.3 14 7 -2 C7.0 -10.8 -7.0 -10.8 -7.0 -2 Z" fill="url(#pDaL)" ${sl}/>` + banTay(46, ot, 1.12)));
  const chan = (x) => `<path d="M${x - 8} -112 C${x - 8.5} -80 ${x - 7.5} -40 ${x - 6.5} -14 L${x + 6.5} -14 C${x + 7.5} -40 ${x + 8.5} -80 ${x + 8} -112 Z" fill="url(#pDaL)" ${sl}/>
    <path d="M${x - 9} -16 C${x - 10} -20 ${x + 4} -21 ${x + 12} -18 C${x + 20} -15 ${x + 24} -10 ${x + 23} -5 C${x + 22} -1 ${x + 18} 0 ${x + 12} 0 L${x - 8} 0 C${x - 12} 0 ${x - 12} -12 ${x - 9} -16 Z" fill="#7a3f5e" ${VN('#4a2238', 2)}/>`;
  return `<g data-k="${k}"><ellipse cx="0" cy="0" rx="60" ry="10" fill="url(#pBong)"/><g data-k="${k}-than">
    ${tay('l', -36)}${chan(-14)}${chan(14)}
    <path d="M-30 -302 C-42 -300 -46 -288 -45 -272 C-44 -250 -40 -232 -40 -214 C-52 -180 -62 -146 -66 -112 C-30 -100 30 -100 66 -112 C62 -146 52 -180 40 -214 C40 -232 44 -250 45 -272 C46 -288 42 -300 30 -302 C18 -294 -18 -294 -30 -302 Z" fill="url(#pVay)" ${VN('#4f2a6c', 2.4)}/>
    <path d="M-40 -214 C-14 -206 14 -206 40 -214" fill="none" stroke="#5a2f7d" stroke-width="4"/>
    <path d="M-30 -190 C-36 -160 -42 -136 -46 -112 M10 -196 C12 -164 14 -138 16 -108" fill="none" stroke="#8c58b3" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M-16 -299 C-8 -288 8 -288 16 -299" fill="#f9cba8" stroke="#4f2a6c" stroke-width="2"/>
    ${khop(`${k}-dau`, 0, -300, `<g transform="translate(0 300)">
      <path d="M-8.5 -314 L-8 -296 C-3 -293 3 -293 8 -296 L8.5 -314 Z" fill="#e3a27c"/>
      <circle cx="-28" cy="-404" r="24" fill="url(#pTocM)" ${VN('#2c170c', 1.8)}/>
      <path d="M-38 -360 C-39 -390 -18 -406 6 -406 C31 -406 46 -390 45 -362 C44.5 -336 30 -312 5 -312 C-20 -312 -37 -332 -38 -360 Z" fill="url(#pDa)" ${VN(ot, 2.4)}/>
      <path d="M-44 -356 C-50 -394 -20 -414 8 -412 C38 -411 54 -392 48 -364 C40 -384 22 -392 4 -386 C-10 -382 -24 -380 -32 -366 C-34 -350 -38 -336 -36 -322 C-44 -332 -45 -344 -44 -356 Z" fill="url(#pTocM)" ${VN('#2c170c', 1.8)}/>
      <ellipse cx="-8" cy="-336" rx="8" ry="5" fill="url(#pMa)"/><ellipse cx="31" cy="-336" rx="6.6" ry="4.6" fill="url(#pMa)"/>
      <g data-k="${k}-mat" data-cy="-354">${mat1(-4, -354, 7, 9)}${mat1(23, -354, 7.8, 9.2)}
        <path d="M-12 -364 L-15 -367 M30 -365 L33 -368" stroke="#2a170c" stroke-width="2" stroke-linecap="round"/></g>
      <path d="M-13 -370 C-8 -374 -1 -374 3 -371 M14 -371 C19 -375 27 -375 32 -371" fill="none" stroke="#3b2012" stroke-width="3" stroke-linecap="round"/>
      <path d="M30 -347 C34.4 -343 34 -339.6 29 -339" fill="none" stroke="#cf8d69" stroke-width="2.3" stroke-linecap="round"/>
      ${miengCuoi(k, 16, -326, 19)}
    </g>`)}
    ${tay('r', 36)}
  </g></g>`;
}

// ───────────────────────── vịt trắng (2 con), chim xanh lá ─────────────────────────
function vit(k) {
  const ov = '#8e9aab';
  const hinh = `<path d="M-60 -6 C-66 -30 -40 -44 -10 -40 C10 -38 24 -36 34 -44 C30 -64 40 -82 58 -82 C76 -82 84 -68 80 -54 C78 -46 72 -40 66 -36 C70 -20 60 0 30 4 C0 8 -50 8 -60 -6 Z" fill="url(#pVit)" ${VN(ov, 2.2)}/>
    <path d="M-60 -8 C-72 -14 -77 -26 -71 -33 C-65 -25 -58 -21 -50 -19 Z" fill="url(#pVit)" ${VN(ov, 2)}/>
    <path d="M-38 -24 C-20 -42 14 -40 28 -24 C10 -13 -20 -12 -38 -24 Z" fill="#e3e9f1" ${VN('#a3aebd', 1.8)}/>
    <path d="M-26 -24 C-14 -30 0 -30 12 -24 M-20 -19 C-8 -23 4 -23 16 -19" fill="none" stroke="#b9c3d0" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M77 -66 C89 -69 100 -64 103 -57 C97 -52 86 -52 77 -55 Z" fill="url(#pCam)" ${VN('#b8600a', 1.8)}/>
    <path d="M79 -59 C86 -58 93 -58 101 -58.6" fill="none" stroke="#b8600a" stroke-width="1.4"/>`;
  return `<g data-k="${k}"><g transform="translate(0 6) scale(1 -.7)" opacity=".22">${hinh}</g>
    <g data-k="${k}-nhun">${hinh}
    <g data-k="${k}-mat" data-cy="-66"><circle cx="64" cy="-66" r="4.4" fill="#1e140c"/><circle cx="62.8" cy="-67.6" r="1.5" fill="#fff"/></g>
    <g data-k="${k}-mo" opacity="0"><path d="M77 -57 C88 -52 97 -48 101 -44 C92 -44 84 -47 77 -53 Z" fill="#ef840c" ${VN('#b8600a', 1.6)}/></g></g>
    <path d="M-70 4 C-30 10 30 10 72 2" fill="none" stroke="#e8f6ff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  </g>`;
}
function chim(k) {   // chim nhỏ màu xanh lá (quay trái)
  const ov = '#1d6b26';
  return `<g data-k="${k}"><g data-k="${k}-nhun">
    <path d="M24 6 L58 22 L52 10 L60 4 Z" fill="#2c9a35" ${VN(ov, 1.8)}/>
    <path d="M30 4 C34 -20 14 -36 -6 -34 C-22 -32 -32 -20 -30 -4 C-28 14 -10 24 6 22 C20 20 28 14 30 4 Z" fill="url(#pChim)" ${VN(ov, 2.2)}/>
    <path d="M-22 6 C-16 18 0 22 12 16 C4 10 -10 6 -22 6 Z" fill="#c9f5b0" opacity=".9"/>
    <g data-k="${k}-canh"><path d="M20 -12 C10 -28 -10 -20 -6 -2 C2 8 18 6 24 -2 Z" fill="#2f9f3a" ${VN(ov, 1.8)}/>
      <path d="M16 -8 C10 -14 2 -14 -2 -6 M18 -2 C12 -6 4 -6 0 0" fill="none" stroke="#7fdc6a" stroke-width="1.4" stroke-linecap="round"/></g>
    <circle cx="-14" cy="-36" r="19" fill="url(#pChim)" ${VN(ov, 2.2)}/>
    <path d="M-20 -52 C-18 -60 -10 -60 -9 -53" fill="#45c445" ${VN(ov, 1.6)}/>
    <g data-k="${k}-mo0"><path d="M-31 -40 L-46 -34 L-31 -30 Z" fill="#ffa21f" ${VN('#b8600a', 1.6)}/></g>
    <g data-k="${k}-mo1" opacity="0"><path d="M-31 -42 L-47 -42 L-32 -36 Z M-31 -32 L-46 -27 L-31 -29 Z" fill="#ffa21f" ${VN('#b8600a', 1.6)}/></g>
    <g data-k="${k}-mat" data-cy="-39"><circle cx="-20" cy="-39" r="4.6" fill="#140c06"/><circle cx="-21.4" cy="-40.8" r="1.6" fill="#fff"/></g>
    <path d="M-4 20 L-6 30 M8 20 L8 30" stroke="#d9862a" stroke-width="3" stroke-linecap="round"/>
  </g></g>`;
}

// ───────────────────────── tư thế (khớp quay theo độ; dương = quay ngược về sau) ─────────────────────────
// p: {hl,kl,hr,kr, sl,el,sr,er, y, ng (nghiêng thân), dau, mat (0 nhắm–1 mở), mieng (0 cười,1 cười to,2 "o"), may}
function tuThe(e, k, p) {
  for (const j of ['hl', 'kl', 'hr', 'kr', 'sl', 'el', 'sr', 'er']) if (p[j] != null) quay(e[`${k}-${j}`], p[j]);
  const th = e[`${k}-than`]; if (th) th.setAttribute('transform', `translate(0 ${n1(p.y || 0)}) rotate(${n1(p.ng || 0)} 0 ${p.goc || -100})`);
  if (e[`${k}-dau`]) quay(e[`${k}-dau`], p.dau || 0);
  const m = e[`${k}-mat`]; if (m) { const s = p.mat == null ? 1 : Math.max(0.08, p.mat); m.setAttribute('transform', s >= 0.999 ? '' : `translate(0 ${m.dataset.cy}) scale(1 ${s.toFixed(2)}) translate(0 ${-m.dataset.cy})`); }
  const mi = p.mieng || 0; for (let i = 0; i < 3; i++) mo(e[`${k}-m${i}`], i === mi ? 1 : 0);
  const mv = e[`${k}-may`]; if (mv) mv.setAttribute('transform', `translate(0 ${n1(-(p.may || 0))})`);
}
// chớp mắt tự nhiên: 0.13 s mỗi ~3.6 s (lệch theo nhân vật)
const chop = (t, lech = 0) => { const x = (t + lech) % 3.7; return x < 0.13 ? Math.abs(x - 0.065) / 0.065 : 1; };
// chu kỳ đi bộ / chạy: ph = pha (radian); a = biên độ (1 đi, 1.5 chạy)
function diBo(ph, a = 1, chay = false) {
  const s = Math.sin(ph), c = Math.cos(ph);
  const h = (chay ? 34 : 24) * a, kq = chay ? 70 : 42;
  const hl = -h * s, hr = h * s;
  const kl = 4 + kq * Math.pow(Math.max(0, -c), 1.2), kr = 4 + kq * Math.pow(Math.max(0, c), 1.2);
  const sa = (chay ? 46 : 22) * a;
  return { hl, kl, hr, kr, sl: sa * s, el: chay ? -80 : -12 - 10 * Math.max(0, s), sr: -sa * s, er: chay ? -80 : -12 - 10 * Math.max(0, -s), y: -(chay ? 9 : 4) * Math.abs(c) + (chay ? 4 : 1.5), ng: chay ? 9 : 2 };
}
const DUNG = { hl: 0, kl: 0, hr: 0, kr: 0, sl: 4, el: -8, sr: -4, er: -8, y: 0, ng: 0 };
// chó: đi/chạy (pha theo quãng đường)
function choDi(e, k, ph, chay = false) {
  const s = Math.sin(ph), c = Math.cos(ph); const A = chay ? 38 : 22;
  const chanX = (n, p) => { const ss = Math.sin(p), cc = Math.cos(p); quay(e[`${k}-${n}`], -A * ss); quay(e[`${k}-${n}g`], (chay ? 40 : 22) * Math.max(0, cc) * (n[0] === 's' ? -1 : 1)); };
  if (chay) { chanX('ta', ph); chanX('tx', ph + 0.5); chanX('sa', ph + Math.PI); chanX('sx', ph + Math.PI + 0.5); }
  else { chanX('ta', ph); chanX('sx', ph); chanX('tx', ph + Math.PI); chanX('sa', ph + Math.PI); }
  const th = e[`${k}-than`]; if (th) th.setAttribute('transform', `translate(0 ${n1(-(chay ? 10 : 3) * Math.abs(c))}) rotate(${n1(chay ? 4 * s : 0)} 0 -100)`);
}
function choDung(e, k) { for (const n of ['ta', 'tx', 'sa', 'sx']) { quay(e[`${k}-${n}`], 0); quay(e[`${k}-${n}g`], 0); } const th = e[`${k}-than`]; if (th) th.setAttribute('transform', ''); }
function choNam(e, k) {   // nằm sấp, chân duỗi về trước
  for (const n of ['ta', 'tx']) { quay(e[`${k}-${n}`], -78); quay(e[`${k}-${n}g`], -8); }
  for (const n of ['sa', 'sx']) { quay(e[`${k}-${n}`], -70); quay(e[`${k}-${n}g`], 140); }
  const th = e[`${k}-than`]; if (th) th.setAttribute('transform', 'translate(0 46)');
}
function choVay(e, k, t, nhanh = 1) {   // vẫy đuôi + tai đung đưa
  quay(e[`${k}-duoi`], Math.sin(t * 15 * nhanh) * 22 - 6);
  quay(e[`${k}-tai`], Math.sin(t * 7 + 1) * 6);
}

// ───────────────────────── đồ vật ─────────────────────────
function banhMi(x = 0, y = 0, s = 1) {   // một miếng sandwich tam giác (gốc = giữa đáy)
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="46" rx="74" ry="7" fill="#1d1a28" opacity=".14"/>
    <path d="M-64 30 L64 30 C68 30 70 34 68 38 C66 42 62 44 56 44 L-56 44 C-62 44 -66 42 -68 38 C-70 34 -68 30 -64 30 Z" fill="url(#pBanh)" ${VN('#c48544', 3)}/>
    <path d="M-66 22 L66 22 L62 31 L-62 31 Z" fill="#ffe08a" ${VN('#e0b23c', 1.6)}/>
    <path d="M-30 31 L-26 37 L-22 31 Z M20 31 L25 38 L30 31 Z" fill="#ffe08a"/>
    <path d="M-71 12 Q-61 23 -50 14 Q-40 24 -30 14 Q-20 24 -10 14 Q0 24 10 14 Q20 24 30 14 Q40 24 50 14 Q61 23 71 12 L67 25 L-67 25 Z" fill="#86d35a" ${VN('#4f9a33', 1.6)}/>
    <path d="M-66 6 C-68 10 -64 13 -58 13 L58 13 C64 13 68 10 66 6 L6 -58 C3 -62 -3 -62 -6 -58 Z" fill="url(#pBanh)" ${VN('#c48544', 3.4)}/>
    <path d="M-50 4 L-2 -46 M-34 2 L-4 -30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <circle cx="10" cy="-12" r="1.6" fill="#e6c48f"/><circle cx="-14" cy="-2" r="1.4" fill="#e6c48f"/><circle cx="24" cy="2" r="1.5" fill="#e6c48f"/>
  </g>`;
}
function chaiNuoc(x = 0, y = 0, s = 1) {  // chai nước cam (gốc = đáy chai, cao ~240)
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="66" ry="9" fill="#1d1a28" opacity=".16"/>
    <path d="M-17 -232 L17 -232 L19 -206 L-19 -206 Z" fill="#ff9a1a" ${VN('#b8600a', 2.2)}/>
    <path d="M-15 -226 L15 -226 M-16 -219 L16 -219 M-17 -212 L17 -212" stroke="#d97706" stroke-width="1.6"/>
    <path d="M-18 -206 L18 -206 L22 -176 C56 -160 60 -134 60 -114 L60 -16 C60 -4 52 0 42 0 L-42 0 C-52 0 -60 -4 -60 -16 L-60 -114 C-60 -134 -56 -160 -22 -176 Z" fill="url(#pChai)" ${VN('#8fb3c9', 2.4)}/>
    <path d="M-52 -128 C-52 -146 -36 -160 -18 -166 L18 -166 C36 -160 52 -146 52 -128 L52 -18 C52 -10 46 -7 40 -7 L-40 -7 C-46 -7 -52 -10 -52 -18 Z" fill="url(#pNuocCam)"/>
    <path d="M-52 -128 C-30 -122 30 -122 52 -128" fill="none" stroke="#ffd690" stroke-width="2.4" opacity=".8"/>
    <rect x="-60" y="-110" width="120" height="62" rx="8" fill="#fffaf0" ${VN('#c9a56a', 2)}/>
    <circle cx="-34" cy="-79" r="15" fill="url(#pCam)" ${VN('#b8600a', 1.8)}/>
    <path d="M-34 -94 C-30 -102 -22 -104 -16 -100 C-22 -96 -28 -94 -34 -94 Z" fill="#5fbf4a"/>
    <path d="M-40 -84 C-38 -88 -34 -89 -31 -87" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <text x="16" y="-70" font-family="${FONT}" font-weight="800" font-size="27" text-anchor="middle" fill="#e46f0a">JUICE</text>
    <path d="M-44 -150 C-48 -120 -48 -60 -46 -24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".5"/>
  </g>`;
}
function coc(x, y, s = 1) {   // cốc nước cam
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="1" rx="26" ry="5" fill="#1d1a28" opacity=".15"/>
    <path d="M-22 -54 L22 -54 L17 -2 C17 1 14 2 11 2 L-11 2 C-14 2 -17 1 -17 -2 Z" fill="url(#pChai)" ${VN('#8fb3c9', 2)}/>
    <path d="M-19.5 -36 L19.5 -36 L16 -4 L-16 -4 Z" fill="url(#pNuocCam)"/>
    <ellipse cx="0" cy="-36" rx="19.5" ry="3" fill="#ffd28a"/><ellipse cx="0" cy="-54" rx="22" ry="4" fill="none" stroke="#8fb3c9" stroke-width="2"/>
    <path d="M-14 -48 L-11 -10" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g>`;
}
function baloTo(k) {   // ba lô xanh dương cỡ lớn (cảnh 5) — gốc = giữa đáy; nắp = ${k}-nap
  return `<g data-k="${k}">
    <ellipse cx="0" cy="4" rx="170" ry="18" fill="url(#pBong)"/>
    <path d="M-110 -250 C-140 -360 140 -360 110 -250" fill="none" stroke="#123a85" stroke-width="24" stroke-linecap="round"/>
    <path d="M-110 -250 C-140 -360 140 -360 110 -250" fill="none" stroke="#2f7ff0" stroke-width="14" stroke-linecap="round"/>
    <path d="M-150 -40 C-158 -150 -150 -250 -110 -282 C-60 -316 60 -316 110 -282 C150 -250 158 -150 150 -40 C148 -12 130 0 100 0 L-100 0 C-130 0 -148 -12 -150 -40 Z" fill="url(#pBalo)" ${VN('#123a85', 3.6)}/>
    <path d="M-104 -130 C-104 -150 -90 -160 -70 -160 L70 -160 C90 -160 104 -150 104 -130 L104 -44 C104 -24 90 -16 70 -16 L-70 -16 C-90 -16 -104 -24 -104 -44 Z" fill="url(#pBaloT)" ${VN('#123a85', 3)}/>
    <path d="M-90 -130 C-60 -138 60 -138 90 -130" fill="none" stroke="#123a85" stroke-width="3" stroke-dasharray="7 6"/>
    <rect x="-22" y="-148" width="44" height="12" rx="6" fill="#d7e6ff" ${VN('#123a85', 1.8)}/>
    <path d="M-120 -220 C-110 -250 -80 -270 -40 -276" fill="none" stroke="#9cc8ff" stroke-width="7" stroke-linecap="round" opacity=".6"/>
    <path d="M-150 -90 C-156 -60 -154 -40 -150 -36" fill="none" stroke="#0f3373" stroke-width="5" opacity=".5"/>
    <g data-k="${k}-nap"><path d="M-148 -214 C-150 -262 -120 -300 -70 -306 L70 -306 C120 -300 150 -262 148 -214 C100 -190 -100 -190 -148 -214 Z" fill="#2a74e4" ${VN('#123a85', 3.4)}/>
      <path d="M-120 -230 C-60 -214 60 -214 120 -230" fill="none" stroke="#123a85" stroke-width="2.6" stroke-dasharray="7 6"/>
      <rect x="-14" y="-212" width="28" height="36" rx="8" fill="#e8eef8" ${VN('#123a85', 2.4)}/></g>
  </g>`;
}
function banhKem(k) {   // bánh sinh nhật 8 nến (gốc = giữa đáy đĩa)
  const nen = [-96, -70, -44, -16, 16, 44, 70, 96].map((cx, i) => {
    const cy = -160 + Math.abs(cx) * 0.06 + (i % 2 ? 4 : 0);
    const mau = ['#9ad0ff', '#ffb3c7', '#c9b3ff', '#ffd2a1'][i % 4];
    return `<g transform="translate(${cx} ${cy})"><rect x="-5.5" y="-46" width="11" height="48" rx="4" fill="${mau}" ${VN('#7d6a8a', 1.6)}/>
      <path d="M-5.5 -36 L5.5 -42 M-5.5 -22 L5.5 -28 M-5.5 -8 L5.5 -14" stroke="#fff" stroke-width="3" opacity=".9"/>
      <path d="M0 -46 L0 -52" stroke="#3b3049" stroke-width="2"/>
      <g data-k="${k}-lua${i}" opacity="0"><circle cx="0" cy="-62" r="20" fill="url(#pSang)"/>
        <g class="lua"><path d="M0 -76 C7 -66 8 -58 0 -52 C-8 -58 -7 -66 0 -76 Z" fill="#ffb627"/><path d="M0 -69 C3.4 -63 3.6 -58 0 -55 C-3.6 -58 -3.4 -63 0 -69 Z" fill="#fff6c2"/></g></g></g>`;
  }).join('');
  return `<g data-k="${k}">
    <ellipse cx="0" cy="0" rx="170" ry="26" fill="#f5f7fb" ${VN('#b7c1cf', 2.4)}/>
    <path d="M-140 -14 L-140 -132 C-140 -150 -80 -162 0 -162 C80 -162 140 -150 140 -132 L140 -14 C140 4 80 14 0 14 C-80 14 -140 4 -140 -14 Z" fill="#fff1e6" ${VN('#d6a98c', 2.6)}/>
    <path d="M-140 -60 C-80 -46 80 -46 140 -60 L140 -14 C140 4 80 14 0 14 C-80 14 -140 4 -140 -14 Z" fill="#ffc9d9" ${VN('#d6a98c', 2.2)}/>
    <path d="M-140 -132 C-140 -112 -128 -104 -122 -96 C-116 -88 -110 -100 -108 -112 C-100 -96 -92 -84 -84 -98 C-80 -106 -76 -110 -70 -106 C-64 -92 -56 -86 -50 -100 C-44 -110 -36 -112 -30 -102 C-24 -90 -16 -90 -12 -104 C-6 -112 4 -112 8 -100 C14 -88 22 -90 26 -104 C30 -112 40 -112 44 -100 C50 -86 58 -90 62 -104 C66 -112 76 -110 80 -98 C86 -86 96 -92 100 -106 C104 -112 112 -110 116 -98 C122 -88 132 -100 140 -132 C140 -150 80 -162 0 -162 C-80 -162 -140 -150 -140 -132 Z" fill="#fffaf5" ${VN('#e0bfae', 2)}/>
    <path d="M-110 -150 C-60 -158 60 -158 110 -150" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    ${[-110, -70, -30, 10, 50, 90].map((x) => `<circle cx="${x}" cy="-34" r="7" fill="#fff" opacity=".9"/>`).join('')}
    ${nen}
  </g>`;
}
function lich(k) {   // lịch để bàn — chỉ một chữ SUNDAY (không số)
  return `<g data-k="${k}">
    <path d="M-200 150 L-170 -140 L170 -140 L200 150 Z" fill="#000" opacity=".12" transform="translate(14 18)"/>
    <rect x="-200" y="-170" width="400" height="330" rx="24" fill="#fffdf8" ${VN('#9a8fae', 3)}/>
    <path d="M-200 -146 C-200 -160 -190 -170 -176 -170 L176 -170 C190 -170 200 -160 200 -146 L200 -70 L-200 -70 Z" fill="#7b5cc4" ${VN('#4e3787', 3)}/>
    <path d="M-180 -152 C-100 -160 100 -160 180 -152" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>
    ${[-130, -65, 0, 65, 130].map((cx) => `<rect x="${cx - 8}" y="-196" width="16" height="50" rx="8" fill="url(#pMayX)" ${VN('#4b5363', 2)}/>`).join('')}
    <text x="0" y="62" font-family="${FONT}" font-weight="800" font-size="98" text-anchor="middle" fill="#3b3049" letter-spacing="2">SUNDAY</text>
    <path d="M-150 112 L150 112" stroke="#ece6f5" stroke-width="7" stroke-linecap="round"/>
    <path d="M-110 136 L110 136" stroke="#ece6f5" stroke-width="7" stroke-linecap="round"/>
  </g>`;
}
function matTroi(k, nong = false) {   // mặt trời rực (không mặt người)
  return `<g data-k="${k}">
    <circle r="330" fill="url(#pSang)" opacity="${nong ? 0.9 : 0.6}"/>
    <g data-k="${k}-tia"><g class="xoay">${Array.from({ length: 14 }, (_, i) => `<path d="M-14 -150 L0 -${nong ? 300 : 240} L14 -150 Z" fill="#fff3b0" opacity=".45" transform="rotate(${i * 360 / 14})"/>`).join('')}</g></g>
    <circle r="118" fill="${nong ? '#ffcf3f' : '#fff0a0'}" opacity=".55"/>
    <circle r="96" fill="${nong ? '#ffd84a' : '#fff6c6'}"/>
    <circle r="80" fill="${nong ? '#fff2a8' : '#fffbe6'}"/>
  </g>`;
}
function may(k, x, y, s = 1, xam = false) {   // mây tích (gradient trắng → xanh nhạt ở đáy)
  return `<g data-k="${k}" transform="translate(${x} ${y}) scale(${s})">
    <path d="M-150 40 C-190 40 -196 4 -164 -6 C-170 -40 -128 -60 -96 -40 C-86 -84 -26 -98 4 -62 C30 -96 92 -86 100 -40 C134 -52 170 -26 158 6 C192 10 190 40 152 40 Z" fill="url(#${xam ? 'pMayX' : 'pMay'})" opacity="${xam ? 0.96 : 0.97}"/>
    <path d="M-150 40 C-120 26 -60 30 -20 36 C30 26 100 26 152 40 Z" fill="${xam ? '#5e6a7d' : '#c9d9ea'}" opacity=".5"/>
  </g>`;
}
function blob(cx, cy, r, n = 9, lech = 0, phong = 1.14) {   // khối tán lá có mép vỏ sò (mượt, không lởm chởm)
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = lech + (i / n) * Math.PI * 2; const rr = r * (1 + 0.06 * Math.sin(i * 2.7 + lech * 5));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92;
    if (i === 0) { d += `M${n1(x)} ${n1(y)}`; continue; }
    const am = lech + ((i - 0.5) / n) * Math.PI * 2;
    d += ` Q${n1(cx + Math.cos(am) * r * phong)} ${n1(cy + Math.sin(am) * r * phong * 0.92)} ${n1(x)} ${n1(y)}`;
  }
  return d + ' Z';
}
function cay(k, x, y, s = 1, canh = false) {   // cây lớn — gốc = chân thân; tán đung đưa = ${k}-tan
  const tan = [[-130, -420, 120], [120, -430, 125], [0, -520, 145], [-190, -330, 90], [190, -340, 92], [0, -390, 130]];
  return `<g data-k="${k}" transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="220" ry="26" fill="url(#pBong)"/>
    <path d="M-44 4 C-30 -6 -26 -60 -26 -140 C-26 -220 -30 -280 -40 -340 L40 -340 C30 -280 26 -220 26 -140 C26 -60 30 -6 44 4 Z" fill="url(#pThan)" ${VN('#4a2c16', 2.6)}/>
    <path d="M-10 -40 C-14 -100 -12 -160 -16 -220 M8 -70 C12 -130 10 -200 14 -260" fill="none" stroke="#4a2c16" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
    <path d="M-24 -250 C-60 -290 -100 -300 -140 -310 M20 -240 C60 -280 100 -300 150 -320" fill="none" stroke="#5f3a1e" stroke-width="16" stroke-linecap="round"/>
    ${canh ? `<path d="M-20 -262 C-150 -272 -290 -262 -440 -240" fill="none" stroke="#4a2c16" stroke-width="22" stroke-linecap="round"/><path d="M-20 -262 C-150 -272 -290 -262 -440 -240" fill="none" stroke="#8a5a35" stroke-width="15" stroke-linecap="round"/>
      <path d="M-330 -258 C-350 -282 -372 -290 -390 -288" fill="none" stroke="#5f3a1e" stroke-width="8" stroke-linecap="round"/>
      <path d="M-430 -242 C-444 -256 -460 -256 -468 -246 C-460 -238 -444 -236 -430 -242 Z M-386 -288 C-392 -304 -404 -308 -414 -304 C-408 -294 -396 -288 -386 -288 Z M-300 -262 C-306 -278 -318 -282 -328 -278 C-322 -268 -310 -262 -300 -262 Z" fill="#5fae48"/>` : ''}
    <g data-k="${k}-tan">
      ${tan.map(([cx, cy, r], i) => `<path d="${blob(cx, cy + 20, r, 10, i * 0.7)}" fill="url(#pLa2)"/>`).join('')}
      ${tan.map(([cx, cy, r], i) => `<path d="${blob(cx - 8, cy, r * 0.9, 10, i * 0.9 + 0.3)}" fill="url(#pLa1)"/>`).join('')}
      ${[[-150, -450, 40], [90, -470, 44], [-30, -560, 50], [170, -380, 30]].map(([cx, cy, r], i) => `<path d="${blob(cx, cy, r, 7, i)}" fill="#a9e27e" opacity=".55"/>`).join('')}
      ${[[-60, -340], [60, -330], [-180, -300], [150, -310], [0, -300]].map(([cx, cy]) => `<path d="${blob(cx, cy, 36, 7, cx)}" fill="#2e7631" opacity=".55"/>`).join('')}
    </g>
  </g>`;
}
function bui(x, y, s = 1, mau = 0) {   // bụi cây
  const c = mau ? ['#4f9a44', '#6cbc55', '#9bd877'] : ['#3f8c3d', '#5aab4a', '#8dcf6b'];
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="120" ry="14" fill="url(#pBong)"/>
    <path d="${blob(-50, -36, 50, 8, 0.2)}" fill="${c[0]}"/><path d="${blob(36, -46, 62, 9, 1)}" fill="${c[0]}"/>
    <path d="${blob(-46, -42, 42, 8, 0.6)}" fill="${c[1]}"/><path d="${blob(30, -54, 52, 9, 1.4)}" fill="${c[1]}"/>
    <path d="${blob(16, -78, 22, 6, 2)}" fill="${c[2]}" opacity=".7"/><path d="${blob(-60, -60, 16, 6, 3)}" fill="${c[2]}" opacity=".7"/>
    <path d="M-100 0 L100 0 C80 -12 -80 -12 -100 0 Z" fill="${c[0]}"/></g>`;
}
function bui2(x, y, s = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${blob(0, -30, 40, 8, 0.4)}" fill="#4f9a44"/><path d="${blob(-6, -36, 30, 7, 1)}" fill="#76c25b"/></g>`; }
function coLa(x, y, s = 1, mau = '#4f9a3a', mau2 = '#7cc95b') {   // một khóm cỏ (lá cong mượt)
  const la = [[-18, -40, -26], [-8, -58, -10], [2, -66, 4], [12, -52, 18], [22, -38, 30], [-26, -26, -40], [30, -24, 44]];
  return `<g transform="translate(${x} ${y}) scale(${s})">${la.map(([bx, h, lean], i) => `<path d="M${bx - 4} 0 C${bx - 3} ${h * 0.5} ${bx + lean * 0.4} ${h * 0.85} ${bx + lean * 0.5} ${h} C${bx + lean * 0.2} ${h * 0.7} ${bx + 3} ${h * 0.4} ${bx + 4} 0 Z" fill="${i % 2 ? mau : mau2}"/>`).join('')}</g>`;
}
function hoa(x, y, s = 1, mau = '#ffffff') {   // hoa nhỏ
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-2 -10 2 -20 0 -30" fill="none" stroke="#4f9a3a" stroke-width="2.4" stroke-linecap="round"/>
    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-38" rx="4.4" ry="7.4" fill="${mau}" transform="rotate(${a} 0 -32)"/>`).join('')}<circle cx="0" cy="-32" r="3.6" fill="#ffc94a"/></g>`;
}
function thamCo(y0, n, seed, mau, mau2, s = 1, x0 = -100, x1 = 1700) {   // dải cỏ tiền cảnh
  let o = ''; for (let i = 0; i < n; i++) { const x = x0 + ((i * 137 + seed * 53) % (x1 - x0)); const yy = y0 + ((i * 29 + seed) % 40); o += coLa(x, yy, s * (0.7 + ((i * 7) % 5) / 10), mau, mau2); }
  return o;
}
function hoaRai(y0, n, seed, x0 = 0, x1 = 1600, s = 0.8) {
  let o = ''; for (let i = 0; i < n; i++) { const x = x0 + ((i * 211 + seed * 71) % (x1 - x0)); const yy = y0 + ((i * 37 + seed) % 50); o += hoa(x, yy, s * (0.8 + ((i * 3) % 4) / 10), i % 3 ? '#ffffff' : '#e6d4ff'); }
  return o;
}
function doi(d, mau1, mau2, id) { return `<defs>${lg(id, [[0, mau1], [1, mau2]])}</defs><path d="${d}" fill="url(#${id})"/>`; }
function lapLanh(k, s = 1) {   // ngôi sao lấp lánh 4 cánh
  return `<g data-k="${k}" opacity="0"><g transform="scale(${s})"><circle r="26" fill="url(#pSangT)" opacity=".8"/>
    <path d="M0 -30 C3 -8 8 -3 30 0 C8 3 3 8 0 30 C-3 8 -8 3 -30 0 C-8 -3 -3 -8 0 -30 Z" fill="#fff"/></g></g>`;
}
function vongSang(k, r, mau = '#fff6b0', vien = false) {   // vầng sáng làm nổi chi tiết đang được kể (đặt SAU vật; vien = chỉ viền, đặt trên vật)
  if (vien) return `<g data-k="${k}" opacity="0"><circle r="${r}" fill="none" stroke="#fff" stroke-width="16" opacity=".35"/><circle r="${r}" fill="none" stroke="${mau}" stroke-width="5" stroke-dasharray="20 14"/></g>`;
  return `<g data-k="${k}" opacity="0"><circle r="${r}" fill="url(#pSang)"/><circle r="${r * 0.82}" fill="none" stroke="${mau}" stroke-width="5" opacity=".7"/></g>`;
}
function loi(k, chu, w = 260, h = 96, duoi = 'trai', co = 52) {   // bong bóng lời (gốc = mũi nhọn)
  const dx = duoi === 'trai' ? -30 : -w + 30;
  return `<g data-k="${k}" opacity="0"><g transform="translate(${dx} ${-h - 26})">
    <rect x="4" y="8" width="${w}" height="${h}" rx="${h / 2}" fill="#1d1a28" opacity=".14"/>
    <path d="M${duoi === 'trai' ? 46 : w - 46} ${h - 4} L${duoi === 'trai' ? 30 : w - 30} ${h + 26} L${duoi === 'trai' ? 76 : w - 76} ${h - 4} Z" fill="#fff" stroke="#3b3049" stroke-width="3.4" stroke-linejoin="round"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" stroke="#3b3049" stroke-width="3.4"/>
    <path d="M${duoi === 'trai' ? 44 : w - 78} ${h - 3} L${duoi === 'trai' ? 78 : w - 44} ${h - 3}" stroke="#fff" stroke-width="5"/>
    <text x="${w / 2}" y="${h / 2 + co * 0.36}" font-family="${FONT}" font-weight="800" font-size="${co}" text-anchor="middle" fill="#3b3049">${chu}</text>
  </g></g>`;
}
function hoTrongNgan(k, x, y) {   // giọt mồ hôi (hình giọt nước)
  return `<g data-k="${k}" opacity="0" transform="translate(${x} ${y})"><path d="M0 -14 C6 -4 9 2 9 6 C9 11 5 14 0 14 C-5 14 -9 11 -9 6 C-9 2 -6 -4 0 -14 Z" fill="#bfe6ff" stroke="#5aa9e6" stroke-width="2"/><ellipse cx="-3" cy="5" rx="2" ry="3" fill="#fff"/></g>`;
}

// ───────────────────────── máy quay + lớp thị sai ─────────────────────────
// Mỗi cảnh có 5 lớp: L0 trời · L1 xa · L2 giữa · L3 chính (nhân vật, mặt đất) · L4 tiền cảnh
const TS = [0.06, 0.22, 0.5, 1, 1.3];
function cam(e, cx = 0, cy = 0, z = 1) {
  for (let i = 0; i < 5; i++) {
    const L = e['L' + i]; if (!L) continue; const f = TS[i]; const zz = 1 + (z - 1) * (0.3 + 0.7 * f);
    L.setAttribute('transform', `translate(800 450) scale(${zz.toFixed(4)}) translate(${n1(-800 - cx * f)} ${n1(-450 - cy * f)})`);
  }
}
function kf(t, ds) {   // khung hình khoá máy quay: [[t, cx, cy, z], …] — nội suy mượt
  if (t <= ds[0][0]) return ds[0].slice(1);
  for (let i = 1; i < ds.length; i++) if (t < ds[i][0]) { const a = ds[i - 1], b = ds[i]; const x = em((t - a[0]) / (b[0] - a[0])); return [noi(a[1], b[1], x), noi(a[2], b[2], x), noi(a[3], b[3], x)]; }
  return ds[ds.length - 1].slice(1);
}
// ngắm: điểm (px,py) của thế giới hiện ở (sx,sy) trên màn với độ phóng z
const N = (px, py, z = 1, sx = 800, sy = 400) => [px - 800 - (sx - 800) / z, py - 450 - (sy - 450) / z, z];
const lop5 = (L0, L1, L2, L3, L4 = '') => `<g data-k="L0">${L0}</g><g data-k="L1">${L1}</g><g data-k="L2">${L2}</g><g data-k="L3">${L3}</g><g data-k="L4">${L4}</g>`;
const troi = (id, c) => `<defs>${lg(id, c.map((m, i) => [i / (c.length - 1), m]))}</defs><rect x="-600" y="-500" width="2800" height="1500" fill="url(#${id})"/>`;
const NGOI_T = { hl: -118, kl: 100, hr: -110, kr: 94, sl: 10, el: -40, sr: -10, er: -40, y: 72, ng: 0 };
const NGOI_R = { hl: -118, kl: 100, hr: -110, kr: 94, sl: 10, el: -40, sr: -10, er: -40, y: 124, ng: 0 };
// đặt một nhân vật người: vị trí + tư thế + chớp mắt
function nguoi(e, k, x, y, s, lat, p, t, lech = 0) { dat(e[k], x, y, s, lat); tuThe(e, k, { ...p, mat: p.mat != null ? p.mat : chop(t, lech) }); }
// đi từ x0→x1 trong [a,b]: trả về {x, ph, dang}
function diTu(t, a, b, x0, x1, buoc, s = 1) {
  const p = doan(t, a, b); const x = noi(x0, x1, p); return { x, ph: (Math.abs(x - x0) / s) / buoc * Math.PI * 2, dang: t > a && t < b && Math.abs(x1 - x0) > 1 };
}
function poseDi(d, chay = false, them = {}) { return d.dang ? { ...diBo(d.ph, 1, chay), ...them } : { ...DUNG, ...them }; }

function tiaNang(id, sx, sy, n = 7) {   // tia nắng mềm toả từ mặt trời
  return `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${sx}" cy="${sy}" r="1500"><stop offset="0" stop-color="#fffbe0" stop-opacity=".55"/><stop offset=".55" stop-color="#fff6d0" stop-opacity=".16"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></radialGradient></defs>
  <g>${Array.from({ length: n }, (_, i) => { const a = 1.75 + i * 0.22 + (i % 2) * 0.05; const w = 0.035 + (i % 3) * 0.012; const P = (b) => `${n1(sx + Math.cos(b) * 1700)} ${n1(sy + Math.sin(b) * 1700)}`; return `<path d="M${sx} ${sy} L${P(a - w)} L${P(a + w)} Z" fill="url(#${id})"/>`; }).join('')}</g>`;
}
// ───────────────────────── phông: sân nhà (cảnh 1–3) ─────────────────────────
function nenSan(id, voiBan = false) {
  const L0 = troi(id + 't', ['#5fb6ef', '#a9dcf7', '#e4f5ff', '#fff3dc']) +
    `<circle cx="1380" cy="70" r="360" fill="url(#pSang)" opacity=".55"/><circle cx="1380" cy="70" r="70" fill="#fffbe6" opacity=".9"/>` +
    tiaNang(id + 'tn', 1380, 70) + may('m1', 260, 150, 0.95) + may('m2', 980, 100, 0.7) + may('m3', 1700, 180, 0.8);
  const L1 = doi('M-600 600 C-200 470 200 500 520 525 C860 552 1180 470 1520 485 C1800 497 2050 520 2300 540 L2300 1000 L-600 1000 Z', '#bfe0c2', '#a7d2a8', id + 'h1') +
    [[-300, 520, 60], [-120, 505, 70], [80, 512, 56], [1250, 470, 64], [1420, 478, 76], [1620, 490, 60], [1900, 505, 70]].map(([x, y, r]) => `<path d="${blob(x, y, r, 8, x * 0.01)}" fill="#97c79a" opacity=".9"/>`).join('') +
    doi('M-600 640 C-100 575 400 600 800 610 C1200 620 1600 580 2300 610 L2300 1000 L-600 1000 Z', '#9fd08d', '#86c174', id + 'h2');
  const rao = Array.from({ length: 30 }, (_, i) => { const x = -420 + i * 82; return `<path d="M${x - 15} 612 L${x - 15} 530 L${x} 512 L${x + 15} 530 L${x + 15} 612 Z" fill="#fbfaf6" stroke="#c9c2b4" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x - 9} 600 L${x - 9} 536" stroke="#e6e0d3" stroke-width="3"/>`; }).join('');
  const co = Array.from({ length: 10 }, (_, i) => { const x = -400 + i * 260; return `<path d="M${x} 400 L${x + 22} 448 L${x + 44} 404" fill="${['#ffd0dc', '#d9ccff', '#fff', '#ffdcb8'][i % 4]}" stroke="#c6b8c9" stroke-width="1.6" stroke-linejoin="round"/>`; }).join('');
  const L2 = bui(-260, 560, 1.2) + bui(1700, 560, 1.3) + cay('cay1', -40, 600, 0.82) + cay('cay2', 1580, 610, 0.72) +
    `<path d="M-460 548 L2100 548 M-460 584 L2100 584" stroke="#e8e2d6" stroke-width="10"/><path d="M-460 548 L2100 548 M-460 584 L2100 584" stroke="#c9c2b4" stroke-width="2" opacity=".6"/>` + rao +
    `<path d="M-160 380 C200 430 560 440 820 420 C1080 400 1400 410 1700 380" fill="none" stroke="#9b8a7a" stroke-width="2.4"/>` +
    `<g transform="translate(0 0)">${Array.from({ length: 14 }, (_, i) => { const x = -120 + i * 130; const y = 380 + Math.sin((i / 13) * Math.PI) * 48; return `<path d="M${x} ${y} L${x + 26} ${y + 52} L${x + 50} ${y + 2}" fill="${['#ffd0dc', '#d9ccff', '#ffffff', '#ffdcb8'][i % 4]}" stroke="#c6b8c9" stroke-width="1.6" stroke-linejoin="round"/>`; }).join('')}</g>` + (co ? '' : '');
  const L3 = `<defs>${lg(id + 'c', [[0, '#a6db7a'], [0.4, '#8fcd66'], [1, '#6fb34f']])}</defs>
    <path d="M-700 612 C-200 600 400 596 800 600 C1200 604 1800 598 2400 610 L2400 1100 L-700 1100 Z" fill="url(#${id}c)"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-700 + i * 560} 1100 L${-500 + i * 560} 610 L${-280 + i * 560} 610 L${-200 + i * 560} 1100 Z" fill="#ffffff" opacity=".05"/>`).join('')}
    ${thamCo(600, 40, 3, '#6fb34f', '#93cf6b', 0.6, -600, 2200)}${hoaRai(640, 14, 2, -400, 2000, 0.7)}
    ${voiBan ? `<g transform="translate(1000 712) scale(.8)"><ellipse cx="0" cy="8" rx="230" ry="24" fill="url(#pBong)"/>
      <path d="M-120 -40 L-132 6 M120 -40 L132 6 M-40 -40 L-46 10 M40 -40 L46 10" stroke="#6b4426" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="0" cy="-66" rx="200" ry="30" fill="url(#pGo)" ${VN('#5d3b22', 2.4)}/>
      <path d="M-206 -70 C-208 -50 -204 -34 -196 -24 Q-180 -12 -164 -22 Q-148 -10 -132 -20 Q-116 -8 -100 -18 Q-84 -6 -66 -16 Q-50 -4 -32 -14 Q-16 -2 0 -12 Q16 -2 32 -14 Q50 -4 66 -16 Q84 -6 100 -18 Q116 -8 132 -20 Q148 -10 164 -22 Q180 -12 196 -24 C204 -34 208 -50 206 -70 C150 -46 -150 -46 -206 -70 Z" fill="#fffdfa" ${VN('#cfc3d8', 2.2)}/>
      <path d="M-150 -50 C-152 -40 -150 -30 -146 -20 M-60 -44 C-62 -34 -61 -24 -58 -14 M40 -44 C42 -34 41 -24 38 -14 M140 -50 C142 -40 140 -30 136 -20" fill="none" stroke="#e7dcef" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="0" cy="-70" rx="206" ry="32" fill="#fffdfa" ${VN('#cfc3d8', 2.2)}/>
      <ellipse cx="0" cy="-70" rx="150" ry="20" fill="none" stroke="#efe6f5" stroke-width="5"/></g>` : ''}`;
  const L4 = thamCo(860, 26, 7, '#3f8a3a', '#5fae48', 1.3, -500, 2100) + bui(-120, 940, 1.6) + bui(1720, 950, 1.7, 1);
  return { L0, L1, L2, L3, L4 };
}
function gioThoi(e, t, keys = ['cay1', 'cay2']) {   // lá cây đung đưa + mây trôi
  keys.forEach((k, i) => { const el = e[k + '-tan']; if (el) el.setAttribute('transform', `rotate(${n1(Math.sin(t * 0.9 + i * 1.7) * 1.4)} 0 -300)`); });
  ['m1', 'm2', 'm3', 'm4'].forEach((k, i) => { const el = e[k]; if (!el) return; if (!el.__g) el.__g = el.getAttribute('transform'); el.setAttribute('transform', `translate(${n1(t * (6 + i * 2))} 0) ` + el.__g); });
}

// ───────────────────────── phông: công viên ─────────────────────────
function nenCongVien(id, o = {}) {
  const sky = o.mua ? ['#7d8da3', '#9fb0c4', '#c3cfdc', '#d9e1ea'] : ['#4faeea', '#97d4f6', '#d8f1ff', '#fff1d2'];
  const L0 = troi(id + 't', sky) + (o.mua ? '' : `<circle cx="${o.mtx || 1320}" cy="${o.mty || 120}" r="420" fill="url(#pSang)" opacity=".5"/>` + tiaNang(id + 'tn', o.mtx || 1320, o.mty || 120)) +
    may('m1', 200, 150, 1, !!o.mua) + may('m2', 900, 90, 0.75, !!o.mua) + may('m3', 1600, 170, 0.9, !!o.mua) + (o.mua ? may('m4', 560, 60, 1.3, true) : '');
  const nha = Array.from({ length: 16 }, (_, i) => { const x = -400 + i * 170; const h = 90 + ((i * 53) % 110); return `<rect x="${x}" y="${560 - h}" width="${120 + (i % 3) * 20}" height="${h + 20}" rx="6" fill="${o.mua ? '#9aa8b8' : '#b9d3e6'}" opacity=".75"/>`; }).join('');
  const L1 = nha + doi('M-600 560 C-200 520 200 530 600 545 C1000 560 1400 520 1800 530 C2100 540 2300 550 2400 560 L2400 1000 L-600 1000 Z', o.mua ? '#8fa79a' : '#a9d3a8', o.mua ? '#7e9a8b' : '#94c693', id + 'h') +
    Array.from({ length: 22 }, (_, i) => { const x = -500 + i * 140; const r = 50 + ((i * 31) % 30); return `<path d="${blob(x, 548 - r * 0.4, r, 8, i)}" fill="${o.mua ? '#6f8f7a' : '#7fbb7c'}"/>`; }).join('');
  const L2 = (o.cayGiua || '') + bui(-200, 640, 1.1) + bui(400, 630, 0.8, 1) + bui(1250, 636, 0.9) + bui(1900, 640, 1.2, 1) + bui(2500, 640, 1.1);
  const dat0 = o.mua ? ['#7fa86e', '#6a955c', '#557f4b'] : ['#a4d874', '#8bc863', '#6aad4d'];
  const L3 = `<defs>${lg(id + 'c', dat0.map((c, i) => [i / 2, c]))}${lg(id + 'd', o.mua ? [[0, '#b3aea3'], [1, '#8f8a80']] : [[0, '#f0dfbf'], [1, '#dcc59b']])}</defs>
    <path d="M-700 640 C-200 628 400 622 800 628 C1300 634 2000 620 3200 636 L3200 1100 L-700 1100 Z" fill="url(#${id}c)"/>
    ${o.duong !== false ? `<path d="M-700 730 C-200 712 400 706 900 712 C1500 718 2400 704 3200 714 L3200 800 C2400 792 1500 806 900 800 C400 794 -200 800 -700 812 Z" fill="url(#${id}d)"/>
    <path d="M-700 730 C-200 712 400 706 900 712 C1500 718 2400 704 3200 714" fill="none" stroke="${o.mua ? '#6d685f' : '#c9ae80'}" stroke-width="3" opacity=".6"/>` : ''}
    ${thamCo(626, 54, 5, o.mua ? '#557f4b' : '#6aad4d', o.mua ? '#6f9a5f' : '#93cf6b', 0.55, -600, 3000)}${o.mua ? '' : hoaRai(660, 18, 4, -400, 2900, 0.65)}
    ${o.chinh || ''}`;
  const L4 = (o.tien || '') + (o.coTien === false ? '' : thamCo(870, 30, 9, o.mua ? '#3f6a3a' : '#3f8a3a', o.mua ? '#577f4c' : '#5fae48', 1.35, -500, 3200));
  return { L0, L1, L2, L3, L4 };
}

// ───────────────────────── trạm xe buýt có MÁI ─────────────────────────
function tramXe(k) {   // gốc = giữa chân trạm; rộng 600; phần dưới mái: x −290…290, y −300…0
  return `<g data-k="${k}">
    <ellipse cx="0" cy="8" rx="330" ry="22" fill="url(#pBong)"/>
    <path d="M-280 -298 L280 -298 L280 -30 L-280 -30 Z" fill="#cfe6f5" opacity=".38"/>
    <path d="M-280 -298 L280 -298 L280 -30 L-280 -30 Z" fill="none" stroke="#7b8796" stroke-width="5"/>
    <path d="M-80 -298 L-80 -30 M120 -298 L120 -30" stroke="#7b8796" stroke-width="4"/>
    <path d="M-250 -280 L-160 -60 M-220 -280 L-140 -90 M150 -280 L230 -80" stroke="#ffffff" stroke-width="6" opacity=".35" stroke-linecap="round"/>
    <path d="M-200 -110 L200 -110 L196 -96 L-196 -96 Z" fill="url(#pGo)" ${VN('#5d3b22', 2)}/><path d="M-200 -126 L200 -126 L196 -112 L-196 -112 Z" fill="url(#pGo)" ${VN('#5d3b22', 2)}/>
    <path d="M-170 -96 L-170 0 M170 -96 L170 0" stroke="#5c6878" stroke-width="10" stroke-linecap="round"/>
    ${[-290, 290].map((x) => `<rect x="${x - 9}" y="-318" width="18" height="320" rx="6" fill="url(#pMayX)" ${VN('#3e4756', 2)}/>`).join('')}
    <path d="M-330 -318 L330 -318 L344 -296 L-344 -296 Z" fill="#3c5268" ${VN('#243344', 2.4)}/>
    <path d="M-318 -338 C-120 -350 120 -350 318 -338 L330 -318 L-330 -318 Z" fill="#567592" ${VN('#243344', 2.4)}/>
    <path d="M-300 -340 C-110 -351 110 -351 300 -340" fill="none" stroke="#9fc0dc" stroke-width="3" opacity=".7"/>
    <path d="M-344 -296 L344 -296 L344 -290 L-344 -290 Z" fill="#243344"/>
    <g transform="translate(0 -372)"><rect x="-128" y="-30" width="256" height="58" rx="12" fill="#2b3a52" ${VN('#18212f', 2.4)}/>
      <rect x="-120" y="-23" width="240" height="44" rx="8" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>
      <text x="0" y="13" font-family="${FONT}" font-weight="800" font-size="38" text-anchor="middle" fill="#fff" letter-spacing="2">BUS STOP</text>
      <path d="M-40 28 L-40 40 M40 28 L40 40" stroke="#3e4756" stroke-width="6"/></g>
  </g>`;
}
const VUNG_TRAM = (x, y) => `M${x - 300} ${y - 296} L${x + 300} ${y - 296} L${x + 300} ${y + 30} L${x - 300} ${y + 30} Z`;

// ───────────────────────── xe buýt số 7 (nhìn ngang, đầu xe bên phải) ─────────────────────────
function xeBuyt(k) {
  const cuaSo = [-360, -250, -140, -30].map((x) => `<rect x="${x}" y="-300" width="96" height="112" rx="14" fill="url(#xeKinh)" ${VN('#1d2a3d', 3)}/>
    <path d="M${x + 14} -290 L${x + 44} -196" stroke="#fff" stroke-width="10" opacity=".14" stroke-linecap="round"/>`).join('');
  const banh = (n, x) => `<g transform="translate(${x} -46)"><circle r="62" fill="#1e222b"/><g data-k="${k}-${n}"><circle r="48" fill="#2d323d"/><circle r="30" fill="url(#pMayX)" ${VN('#3e4756', 2)}/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${n1(Math.cos(a * Math.PI / 180) * 19)}" cy="${n1(Math.sin(a * Math.PI / 180) * 19)}" r="3.6" fill="#e6e9ef"/>`).join('')}<circle r="8" fill="#e6e9ef"/></g></g>`;
  return `<g data-k="${k}"><defs>${lg('xeKinh', [[0, '#3b5371'], [1, '#6f8faf']])}${lg('xeThan', [[0, '#ffffff'], [0.7, '#eef0f6'], [1, '#cfd4df']])}${lg('xeTim', [[0, '#8a5ad6'], [1, '#5b39a8']])}</defs>
    <ellipse cx="0" cy="6" rx="460" ry="24" fill="url(#pBong)"/>
    <g data-k="${k}-than">
    <path d="M-410 -310 C-410 -330 -396 -342 -374 -342 L330 -342 C372 -342 396 -320 404 -280 L420 -120 C422 -96 418 -70 400 -62 L-396 -62 C-406 -62 -410 -72 -410 -84 Z" fill="url(#xeThan)" ${VN('#7d8597', 3)}/>
    <rect x="-300" y="-366" width="220" height="28" rx="10" fill="#d8dce6" ${VN('#7d8597', 2.4)}/>
    <path d="M-410 -168 L410 -168 L414 -132 L-410 -132 Z" fill="url(#xeTim)"/>
    <path d="M-410 -110 L416 -110 L420 -84 C420 -70 412 -62 400 -62 L-396 -62 C-406 -62 -410 -72 -410 -84 Z" fill="#454b5a"/>
    <path d="M-330 -62 C-330 -128 -170 -128 -170 -62 Z M180 -62 C180 -128 340 -128 340 -62 Z" fill="#2a2e38"/>
    ${cuaSo}
    <g data-k="${k}-khach" opacity="0">
      <g transform="translate(-196 -186) scale(.42)"><g transform="translate(0 182)"><path d="M-38 -238 C-39 -266 -18 -282 6 -282 C31 -282 47 -265 46 -239 C45.5 -212 29 -190 5 -190 C-19 -190 -37 -209 -38 -238 Z" fill="url(#pDa)"/>
        <path d="M-43 -247 C-45 -280 -20 -299 8 -299 C36 -299 53 -281 50 -250 C40 -257 18 -260 2 -259 C-16 -258 -32 -254 -43 -247 Z" fill="url(#pMu)"/><path d="M33 -254 C51 -259 76 -258 89 -250 C92 -246 88 -241 79 -241 C64 -242 46 -244 27 -245 Z" fill="url(#pMuV)"/>
        ${mat1(-5, -229, 7.4, 9.6)}${mat1(23, -229, 8.4, 10)}<path d="M8 -206 C13 -199 21 -199 26 -207" fill="none" stroke="#7a3b2a" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M-40 -194 C-40 -180 40 -180 40 -194 L44 -150 L-44 -150 Z" fill="url(#pAoT)"/></g></g>
      <g transform="translate(-88 -186) scale(.42)"><g transform="translate(0 300)"><path d="M-40 -352 C-41 -382 -19 -400 6 -400 C32 -400 48 -382 47 -352 C46.5 -326 34 -298 6 -298 C-20 -298 -39 -322 -40 -352 Z" fill="url(#pDa)"/>
        <path d="M-44 -356 C-50 -392 -22 -415 8 -413 C38 -412 57 -394 52 -364 C47 -377 35 -384 23 -383 C29 -376 29 -368 25 -362 C15 -376 -1 -381 -15 -375 C-25 -371 -31 -363 -34 -350 C-37 -347 -42 -347 -44 -356 Z" fill="url(#pTocR)"/>
        ${mat1(-5, -343, 7, 9)}${mat1(23, -343, 8, 9.4)}<path d="M8 -318 C13 -311 21 -311 26 -319" fill="none" stroke="#7a3b2a" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M-44 -300 C-44 -286 44 -286 44 -300 L50 -250 L-50 -250 Z" fill="url(#pAoR)"/></g></g>
      <g transform="translate(10 -200) scale(.5)"><g transform="translate(-100 150)"><path d="M70 -186 C58 -190 50 -176 54 -160 C56 -152 62 -150 66 -156 Z" fill="url(#pNauD)"/>
        <path d="M52 -152 C49 -182 70 -198 96 -197 C119 -196 131 -181 132 -165 C146 -163 160 -155 161 -142 C161 -128 147 -120 129 -121 C117 -113 97 -111 81 -116 C63 -122 54 -135 52 -152 Z" fill="url(#pNau)"/>
        <path d="M116 -163 C134 -164 156 -156 159 -143 C160 -130 146 -123 128 -123 C118 -132 113 -150 116 -163 Z" fill="url(#pKem)"/>
        <path d="M147 -160 C155 -162 162 -157 161 -150 C160 -145 152 -144 147 -148 C144 -151 144 -157 147 -160 Z" fill="#241510"/><ellipse cx="104" cy="-168" rx="7.6" ry="8.6" fill="#24140a"/><circle cx="101.6" cy="-171" r="2.8" fill="#fff"/>
        <path d="M78 -190 C64 -189 56 -174 58 -152 C59 -140 68 -135 75 -143 C81 -156 85 -174 84 -188 Z" fill="url(#pNauD)"/></g></g>
    </g>
    <g transform="translate(-25 -116)"><circle r="53" fill="#fff" ${VN('#5b39a8', 5)}/><circle r="45" fill="none" stroke="#e6defa" stroke-width="3"/>
      <text x="0" y="35" font-family="${FONT}" font-weight="800" font-size="102" text-anchor="middle" fill="#5b39a8">7</text></g>
    <rect x="90" y="-316" width="96" height="236" rx="10" fill="#2a3446" ${VN('#1d2a3d', 3)}/>
    <g data-k="${k}-cua1"><rect x="94" y="-312" width="44" height="228" rx="8" fill="url(#xeKinh)" ${VN('#1d2a3d', 2.4)}/><path d="M104 -300 L120 -240" stroke="#fff" stroke-width="8" opacity=".16" stroke-linecap="round"/></g>
    <g data-k="${k}-cua2"><rect x="140" y="-312" width="44" height="228" rx="8" fill="url(#xeKinh)" ${VN('#1d2a3d', 2.4)}/><path d="M150 -300 L166 -240" stroke="#fff" stroke-width="8" opacity=".16" stroke-linecap="round"/></g>
    <path d="M210 -300 L330 -300 C368 -300 388 -282 394 -250 L404 -168 L210 -168 Z" fill="url(#xeKinh)" ${VN('#1d2a3d', 3)}/>
    <path d="M226 -290 L282 -176 M262 -290 L310 -196" stroke="#fff" stroke-width="10" opacity=".16" stroke-linecap="round"/>
    <rect x="206" y="-336" width="150" height="34" rx="8" fill="#141821" ${VN('#0b0d12', 2)}/>
    <text x="281" y="-307" font-family="${FONT}" font-weight="800" font-size="36" text-anchor="middle" fill="#ffb627">7</text>
    <circle cx="281" cy="-319" r="22" fill="#ffb627" opacity=".14"/>
    <path d="M404 -252 L428 -256 L432 -214 L410 -212" fill="none" stroke="#2a2e38" stroke-width="6" stroke-linecap="round"/>
    <path d="M396 -108 C406 -110 414 -104 414 -96 C414 -88 406 -84 398 -86 Z" fill="#fff6c8" ${VN('#9a8f6a', 2)}/>
    <rect x="-414" y="-130" width="12" height="30" rx="4" fill="#e04a3a"/>
    </g>
    <g data-k="${k}-den" opacity=".85"><path d="M410 -100 L760 -150 L760 -40 Z" fill="url(#pSangT)" opacity=".45"/><circle cx="410" cy="-97" r="40" fill="url(#pSang)"/></g>
    ${banh('b1', -250)}${banh('b2', 260)}
  </g>`;
}

// ───────────────────────── 12 cảnh ─────────────────────────
// kb = kịch bản: số = nghỉ (giây); 'c-k' = câu c-k; {s:'tên tiếng', o: lệch giây, w:[câu, chữ], d: dài|'het', v: âm lượng}
const C = [];
const BUOC_T = 150, BUOC_R = 230, BUOC_M = 210;   // độ dài một chu kỳ bước (đơn vị nội bộ) — chân không trượt

// 1 — This is Tom. Tom is eight years old. He has a red cap.
C.push({
  kb: [1.6, '0-0', 0.5, '0-1', 1.1, '0-2', 1.7],
  ve() {
    const n = nenSan('c0', true);
    return lop5(n.L0, n.L1, n.L2, n.L3 + `<g transform="translate(1000 656) scale(.74)">${banhKem('banh')}</g>` + lapLanh('s0', 1.2) + lapLanh('s1', 0.9) + lapLanh('s2', 1) +
      vongSang('sang', 70) + tom('tom') + lapLanh('s3', 1.1) + lapLanh('s4', 0.8), n.L4);
  },
  len(t, M, D, W, e) {
    const d = diTu(t, 0, 2.8, -160, 560, BUOC_T);
    const tv = M['0-0'] + 0.2, vay = t > tv && t < tv + 1.6;
    const p = poseDi(d, false, vay ? { sr: -150 + Math.sin((t - tv) * 12) * 16, er: -20 } : {});
    const te = W('0-1', 'eight'); const tc = W('0-2', 'red');
    if (t > tc && t < tc + 1.4) { p.sr = -160 * tron((t - tc) / 0.3) * (1 - tron((t - tc - 1.0) / 0.4)); p.er = -60 * tron((t - tc) / 0.3); }
    nguoi(e, 'tom', d.x, 720, 1.05, false, { ...p, dau: d.dang ? 0 : 2, mieng: t > M['0-1'] && t < M['0-1'] + 2.2 ? 1 : 0 }, t);
    for (let i = 0; i < 8; i++) { mo(e['banh-lua' + i], t > te + i * 0.11 ? 1 : 0); }
    bung(e.s0, 912, 470, t, te + 0.5, M['0-2']); bung(e.s1, 1092, 460, t, te + 0.75, M['0-2']); bung(e.s2, 1000, 420, t, te + 1, M['0-2']);
    const capY = 720 - 1.05 * 280; bung(e.sang, d.x + 12, capY, t, tc, D - 0.2, 1.5); bung(e.s3, d.x - 70, capY - 50, t, tc + 0.15, D - 0.2); bung(e.s4, d.x + 110, capY - 20, t, tc + 0.3, D - 0.2);
    const [cx, cy, z] = kf(t, [[0, ...N(700, 470, 1.0, 800, 450)], [2.8, ...N(760, 480, 1.03, 800, 450)], [te - 0.3, ...N(760, 480, 1.03, 800, 450)], [te + 0.8, ...N(960, 560, 1.28, 800, 400)], [M['0-2'] - 0.1, ...N(960, 560, 1.28, 800, 400)], [M['0-2'] + 0.9, ...N(590, 500, 1.5, 800, 380)], [D, ...N(590, 500, 1.55, 800, 380)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 2 — This is Robert. Robert is Tom's brother. He has a yellow T-shirt.
C.push({
  kb: [1.5, '1-0', 0.5, '1-1', 1.0, '1-2', 1.8],
  ve() {
    const n = nenSan('c1');
    return lop5(n.L0, n.L1, n.L2, n.L3 + vongSang('sang', 120) + tom('tom') + robert('rob') + lapLanh('s1', 1) + lapLanh('s2', 0.8) + lapLanh('s3', 1.1), n.L4);
  },
  len(t, M, D, W, e) {
    const d = diTu(t, 0.1, 2.9, 1820, 800, BUOC_R);
    const tb = W('1-1', 'brother'); const hf = t > tb - 0.25 && t < tb + 1.2; const hk = hf ? tron((t - tb + 0.25) / 0.35) * (1 - tron((t - tb - 0.8) / 0.4)) : 0;
    const tv = W('1-2', 'yellow');
    // Robert: đi vào, quay về phía Tom (trái); đập tay; rồi chống nạnh khoe áo vàng
    let pr = poseDi(d);
    if (!d.dang) {
      pr = { ...DUNG };
      if (hk > 0) { pr.sr = noi(-4, -48, hk); pr.er = noi(-8, -12, hk); }
      if (t > tv - 0.1) { const a = tron((t - tv + 0.1) / 0.4); pr.sl = 38 * a; pr.el = -64 * a; pr.sr = -38 * a; pr.er = 64 * a; }
    }
    const pt = { ...DUNG, dau: hk ? -4 : 0, mieng: hk > 0.3 ? 1 : 0 };
    if (hk > 0) { pt.sr = noi(-4, -80, hk); pt.er = noi(-8, -10, hk); }
    nguoi(e, 'tom', 560, 720, 1.05, false, pt, t, 0.9);
    nguoi(e, 'rob', d.x, 720, 1.05, true, { ...pr, mieng: (t > tv && t < tv + 1.8) || hk > 0.3 ? 1 : 0 }, t, 0.3);
    const tr = W('1-0', 'robert'); bung(e.sang, 800, 720 - 1.05 * 230, t, tv, D - 0.2, 1.4);
    const ao = e['rob-bong-ao']; if (ao) { const a = kep((t - tv - 0.2) / 0.9); ao.setAttribute('transform', `translate(${n1(noi(0, 120, a))} 0)`); mo(ao, a > 0 && a < 1 ? Math.sin(a * Math.PI) : 0); }
    bung(e.s1, 690, 380, t, tv + 0.1, D - 0.2); bung(e.s2, 920, 420, t, tv + 0.3, D - 0.2); bung(e.s3, 860, 300, t, tv + 0.5, D - 0.2);
    const [cx, cy, z] = kf(t, [[0, ...N(900, 470, 1.0, 800, 450)], [2.9, ...N(720, 500, 1.06, 800, 440)], [tr, ...N(720, 500, 1.06, 800, 440)], [M['1-1'] + 0.4, ...N(680, 500, 1.12, 800, 430)], [tv - 0.2, ...N(680, 500, 1.12, 800, 430)], [tv + 0.8, ...N(740, 480, 1.22, 800, 420)], [D, ...N(745, 480, 1.24, 800, 420)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 3 — Tom and Robert have a dog. His name is Max. Max is brown. "Woof! Woof!"
C.push({
  kb: [1.0, '2-0', 0.4, '2-1', 0.4, '2-2', 0.5, '2-3', { s: 'woof2', o: 0.1 }, 2.0],
  ve() {
    const n = nenSan('c2');
    return lop5(n.L0, n.L1, n.L2, n.L3 + tom('tom') + robert('rob') + vongSang('sang', 170, '#ffe2b0') + max('max') + lapLanh('s1', 1) + lapLanh('s2', 0.8) + loi('gau', 'Woof! Woof!', 320, 96, 'phai', 50), n.L4);
  },
  len(t, M, D, W, e) {
    const tw = M['2-3'] + GIONG.cau['2-3'].d + 0.1;   // tiếng sủa thật
    const x0 = 1850, x1 = 1060; const p = doan(t, 0.2, 2.6); const x = noi(x0, x1, p); const dang = t > 0.2 && t < 2.6;
    const sua = t > tw && t < tw + 1.4; const nh = sua ? Math.abs(Math.sin((t - tw) * 5.2)) : 0;
    dat(e.max, x, 724 - nh * 26, 1.0, true);
    if (dang) choDi(e, 'max', (x0 - x) / 1.0 / BUOC_M * Math.PI * 2, true); else choDung(e, 'max');
    choVay(e, 'max', t, dang ? 1.4 : 1);
    quay(e['max-dau'], sua ? -14 * nh : Math.sin(t * 2) * 3);
    mo(e['max-m1'], sua && nh > 0.4 ? 1 : 0); mo(e['max-m0'], sua && nh > 0.4 ? 0 : 1);
    const mm = e['max-mat']; if (mm) mm.setAttribute('transform', chop(t, 0.5) < 1 ? `translate(0 -168) scale(1 ${chop(t, 0.5).toFixed(2)}) translate(0 168)` : '');
    nguoi(e, 'tom', 430, 720, 1.0, false, { ...DUNG, dau: 4, mieng: t > tw ? 1 : 0, sr: t > tw ? -40 : -4 }, t, 0.2);
    nguoi(e, 'rob', 680, 720, 1.0, false, { ...DUNG, dau: 3, mieng: t > M['2-1'] ? 1 : 0 }, t, 1.4);
    const tb = W('2-2', 'brown'); bung(e.sang, x - 10, 620, t, tb, tw);
    bung(e.s1, x - 150, 530, t, tb + 0.1, tw); bung(e.s2, x + 140, 560, t, tb + 0.3, tw);
    bung(e.gau, x + 30, 470 - nh * 26, t, tw, D - 0.2);
    const [cx, cy, z] = kf(t, [[0, ...N(900, 470, 1.0, 800, 450)], [2.6, ...N(820, 480, 1.02, 800, 450)], [M['2-1'], ...N(820, 480, 1.04, 800, 450)], [tb + 0.4, ...N(980, 590, 1.28, 800, 430)], [D, ...N(990, 590, 1.32, 800, 430)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 4 — It is Sunday. The sun is hot. Tom, Robert and Max go to the park.
C.push({
  kb: [0.9, '3-0', 0.7, '3-1', 1.0, '3-2', 3.0],
  ve() {
    const cong = `<g transform="translate(1780 640)"><ellipse cx="0" cy="10" rx="260" ry="20" fill="url(#pBong)"/>
      <rect x="-210" y="-290" width="34" height="300" rx="8" fill="url(#pGo)" ${VN('#5d3b22', 2.4)}/><rect x="176" y="-290" width="34" height="300" rx="8" fill="url(#pGo)" ${VN('#5d3b22', 2.4)}/>
      <path d="M-236 -300 C-80 -340 80 -340 236 -300 L236 -250 C80 -290 -80 -290 -236 -250 Z" fill="url(#pGo)" ${VN('#5d3b22', 2.6)}/>
      <rect x="-120" y="-312" width="240" height="70" rx="14" fill="#2f6f3a" ${VN('#1d4523', 2.4)}/>
      <text x="0" y="-262" font-family="${FONT}" font-weight="800" font-size="50" text-anchor="middle" fill="#fff" letter-spacing="3">PARK</text></g>`;
    const n = nenCongVien('c3', { mtx: 1180, mty: 130, chinh: cong + max('max') + tom('tom', { balo: true }) + robert('rob') + hoTrongNgan('mh', 0, 0), cayGiua: cay('cay1', 300, 640, 0.6) + cay('cay2', 2300, 640, 0.66) });
    return lop5(n.L0 + `<g transform="translate(1180 130)">${matTroi('troi', true)}</g>`, n.L1, n.L2, n.L3 + `<g data-k="nong" opacity="0">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${i * 300 - 100} 690 q18 -24 0 -48 q-18 -24 0 -48 q18 -24 0 -48" fill="none" stroke="#fff6d0" stroke-width="9" stroke-linecap="round" opacity=".7"/>`).join('')}</g>`, n.L4) +
      `<g data-k="the"><g>${lich('lich')}</g></g>`;
  },
  len(t, M, D, W, e) {
    // lịch
    const vl = bat((t - 0.1) / 0.7) * (t > 0.1 ? 1 : 0); const ra = tron((t - M['3-1'] + 0.1) / 0.5);
    dat(e.the, 800, noi(1200, 390, Math.min(1, vl)) - 900 * ra, 1 + 0.05 * Math.sin(Math.max(0, t - M['3-0']) * 6) * (t < M['3-1'] && t > M['3-0'] ? 1 : 0), false, noi(-4, 2, Math.min(1, vl)));
    mo(e.the, t < M['3-1'] + 0.6 ? 1 : 0);
    const ts = W('3-1', 'hot'); const nong = tron((t - ts + 0.2) / 0.8);
    dat(e.troi, 0, 0, 0.8 + 0.45 * nong + 0.03 * Math.sin(t * 4) * nong); mo(e.nong, nong * (0.6 + 0.4 * Math.sin(t * 3))); dat(e.nong, 0, -((t * 30) % 48));
    // đi tới công viên
    const tg = M['3-2'] + 0.3; const ddi = (x0, x1) => diTu(t, tg, D + 0.6, x0, x1, BUOC_T, 1);
    const dT = ddi(260, 1550), dR = diTu(t, tg, D + 0.6, 80, 1370, BUOC_R, 1), xM = noi(470, 1760, doan(t, tg, D + 0.6));
    const lau = t > ts && t < ts + 1.6 && !dT.dang;   // Tom lau mồ hôi
    nguoi(e, 'tom', dT.x, 730, 0.95, false, lau ? { ...DUNG, sr: -150, er: -70, dau: -4 } : poseDi(dT, false, { mieng: dT.dang ? 1 : 0 }), t, 0.1);
    nguoi(e, 'rob', dR.x, 730, 0.95, false, dT.dang ? poseDi(dR) : { ...DUNG, sl: lau ? 160 : 4, el: lau ? -30 : -8 }, t, 1.1);
    dat(e.max, xM, 732, 0.88, false); if (dT.dang) choDi(e, 'max', (xM - 470) / 0.88 / BUOC_M * Math.PI * 2); else choDung(e, 'max'); choVay(e, 'max', t);
    const mh = e.mh; if (mh) { const a = kep((t - ts) / 1.3); dat(mh, dT.x + 50 + 10 * a, 730 - 0.95 * 250 + 60 * a, 1.2); mo(mh, a > 0 && a < 1 ? 1 - a * a : 0); }
    const [cx, cy, z] = kf(t, [[0, ...N(800, 460, 1.0, 800, 450)], [ts - 0.6, ...N(800, 460, 1.0, 800, 450)], [ts + 0.3, ...N(760, 400, 1.06, 800, 480)], [tg, ...N(760, 400, 1.06, 800, 480)], [tg + 1.6, ...N(1000, 480, 1.0, 800, 450)], [D, ...N(1640, 480, 1.0, 800, 450)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 5 — Tom has a blue backpack. In the backpack, there are three sandwiches and a bottle of orange juice.
C.push({
  kb: [0.8, '4-0', 0.9, '4-1', 2.8],
  ve() {
    const tham = `<g transform="translate(980 770) scale(.9 1)"><path d="M-430 -60 L430 -60 L500 50 L-500 50 Z" fill="#f6f1fb" ${VN('#c9bcd9', 2.4)}/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${-430 + i * 96} -60 L${-382 + i * 96} -60 L${-444 + i * 111 + 55} 50 L${-500 + i * 111 + 55} 50 Z" fill="#cdb6ec" opacity=".55"/>`).join('')}
      <path d="M-464 -6 L464 -6 L478 16 L-478 16 Z" fill="#cdb6ec" opacity=".45"/></g>`;
    const n = nenCongVien('c4', { duong: false, chinh: tham + tom('tom', { balo: false }) + vongSang('sang', 230, '#bcd8ff') + `<g transform="translate(560 752) scale(.62)">${baloTo('balo')}</g>` +
      `<g data-k="b1">${banhMi()}</g><g data-k="b2">${banhMi()}</g><g data-k="b3">${banhMi()}</g><g data-k="chai">${chaiNuoc()}</g>` + lapLanh('s1', 1) + lapLanh('s2', 1) + lapLanh('s3', 1) + lapLanh('s4', 1.2),
      cayGiua: cay('cay1', 120, 640, 0.7) + cay('cay2', 1500, 640, 0.62) });
    return lop5(n.L0, n.L1, n.L2, n.L3, n.L4);
  },
  len(t, M, D, W, e) {
    const tb = W('4-0', 'blue'); const nay = t > tb && t < tb + 1 ? Math.abs(Math.sin((t - tb) * 9)) * 22 * (1 - (t - tb)) : 0;
    nguoi(e, 'tom', 330, 752, 1.0, false, { ...DUNG, sr: t > M['4-0'] && t < M['4-1'] + 0.5 ? -70 : -4, er: -10, mieng: t > tb ? 1 : 0, dau: 3 }, t);
    const b = e.balo; if (b) b.setAttribute('transform', `translate(0 ${n1(-nay)})`);
    bung(e.sang, 560, 652, t, tb, M['4-1'] + 0.4, 0.62);
    const tm = M['4-1'] + 0.15; const a = 118 * bat((t - tm) / 0.7) * (t > tm ? 1 : 0); quay(e['balo-nap'], a, 148, -214);
    const t3 = W('4-1', 'three'); const tc = W('4-1', 'bottle');
    const bay = (el, a0, x, y, s, k) => {
      if (t < a0) { mo(el, 0); return; } const p = kep((t - a0) / 0.6); const q = tron(p);
      dat(el, noi(560, x, q), noi(580, y, q) - Math.sin(p * Math.PI) * 150, noi(0.2, s, q), false, noi(-30, 0, q)); mo(el, 1);
      bung(e[k], x, y - 70, t, a0 + 0.55, a0 + 1.2, 0.7);
    };
    bay(e.b1, t3, 790, 724, 0.72, 's1'); bay(e.b2, t3 + 0.42, 930, 724, 0.72, 's2'); bay(e.b3, t3 + 0.84, 1070, 724, 0.72, 's3'); bay(e.chai, tc, 1220, 768, 0.66, 's4');
    const [cx, cy, z] = kf(t, [[0, ...N(700, 560, 1.12, 800, 440)], [tb + 0.5, ...N(520, 600, 1.3, 800, 430)], [t3 - 0.2, ...N(560, 600, 1.28, 800, 430)], [tc + 0.4, ...N(850, 640, 1.22, 800, 430)], [D, ...N(860, 640, 1.24, 800, 430)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 6 — In the park, there is a big lake. Two ducks swim in the lake. "Quack! Quack!"
C.push({
  kb: [1.1, '5-0', 0.5, '5-1', 0.6, '5-2', { s: 'quack', o: 0.15 }, { s: 'quack', o: 1.0, v: 0.9 }, 2.0],
  ve() {
    const ho = `<defs>${lg('c5n', [[0, '#7cc6ec'], [0.5, '#4fa6db'], [1, '#2f7fbf']])}${lg('c5p', [[0, '#9fd8f5', 0], [0.5, '#e8f7ff', 0.5], [1, '#9fd8f5', 0]], 1, 0)}</defs>
      <path d="M-300 610 C100 590 500 586 900 590 C1300 594 1700 590 2000 604 C2060 680 1960 800 1600 830 C1200 860 400 860 0 830 C-260 810 -340 700 -300 610 Z" fill="#cfe3b5"/>
      <path d="M-260 620 C100 602 500 598 900 602 C1300 606 1680 602 1960 614 C2000 690 1900 790 1580 812 C1200 840 420 840 20 812 C-220 794 -300 700 -260 620 Z" fill="url(#c5n)"/>
      ${Array.from({ length: 22 }, (_, i) => { const x = -300 + i * 110; const r = 40 + ((i * 31) % 26); return `<path d="${blob(x, 622 + r * 0.35, r, 8, i)}" fill="#3f7f6a" opacity=".16" transform="translate(0 ${n1(1244 + r * 0.7)}) scale(1 -1)"/>`; }).join('')}
      <path d="M-200 640 C400 626 1300 628 1900 640" fill="none" stroke="#2f6f8f" stroke-width="10" opacity=".25"/>
      ${Array.from({ length: 7 }, (_, i) => `<path d="M${-100 + i * 300} ${660 + (i % 3) * 40} L${100 + i * 300} ${660 + (i % 3) * 40}" stroke="url(#c5p)" stroke-width="5" stroke-linecap="round"/>`).join('')}
      ${[[-150, 625], [1700, 628], [1860, 640]].map(([x, y]) => `<g transform="translate(${x} ${y})">${coLa(0, 0, 1.3, '#4f8f3a', '#6fae4d')}${coLa(26, 6, 1.1, '#4f8f3a', '#6fae4d')}</g>`).join('')}
      <g data-k="g1"><ellipse rx="90" ry="12" fill="none" stroke="#e8f7ff" stroke-width="3"/></g><g data-k="g2"><ellipse rx="90" ry="12" fill="none" stroke="#e8f7ff" stroke-width="3"/></g>
      <g data-k="g3"><ellipse rx="90" ry="12" fill="none" stroke="#e8f7ff" stroke-width="3"/></g><g data-k="g4"><ellipse rx="90" ry="12" fill="none" stroke="#e8f7ff" stroke-width="3"/></g>`;
    const bo = `<path d="M-500 900 L-500 790 C-300 770 0 776 400 800 C500 808 560 840 600 900 Z" fill="#8cc463"/>${thamCo(780, 14, 2, '#5d9d43', '#86c25d', 0.9, -400, 520)}`;
    const n = nenCongVien('c5', { duong: false, chinh: ho + vongSang('sa1', 120) + vongSang('sa2', 120) + vit('v1') + vit('v2') + bo + max('max') + tom('tom', { balo: true }) + robert('rob') + loi('q1', 'Quack!', 210, 86, 'trai', 46) + loi('q2', 'Quack!', 210, 86, 'phai', 46),
      cayGiua: cay('cay1', 1700, 610, 0.5) + cay('cay2', -200, 615, 0.55) });
    return lop5(n.L0, n.L1, n.L2, n.L3, n.L4);
  },
  len(t, M, D, W, e) {
    const x1 = 780 + 110 * Math.sin(t * 0.32), x2 = 1260 + 90 * Math.sin(t * 0.32 + 2.4);
    const h1 = Math.cos(t * 0.32) > 0, h2 = Math.cos(t * 0.32 + 2.4) > 0;
    dat(e.v1, x1, 690 + Math.sin(t * 1.7) * 2, 0.9, !h1); dat(e.v2, x2, 735 + Math.sin(t * 1.5 + 1) * 2, 0.95, !h2);
    const tq = M['5-2'] + GIONG.cau['5-2'].d;   // tiếng vịt thật
    const keu = (a) => t > a && t < a + 1.3;
    [['v1', tq + 0.15], ['v2', tq + 1.0]].forEach(([k, a]) => { const on = keu(a) && Math.sin((t - a) * 14) > 0; mo(e[k + '-mo'], on ? 1 : 0); const nh = e[k + '-nhun']; if (nh) nh.setAttribute('transform', `translate(0 ${n1(Math.sin(t * 2 + (k === 'v1' ? 0 : 1)) * 2 - (keu(a) ? 4 : 0))}) rotate(${keu(a) ? -6 : 0} 0 0)`); });
    const rr = (k, x, y, ph) => { const f = (t * 0.6 + ph) % 1; dat(e[k], x, y, 0.6 + f * 0.9); mo(e[k], (1 - f) * 0.8); };
    rr('g1', x1, 692, 0); rr('g2', x1, 692, 0.5); rr('g3', x2, 737, 0.2); rr('g4', x2, 737, 0.7);
    const t2 = W('5-1', 'two'); bung(e.sa1, x1, 640, t, t2, M['5-2']); bung(e.sa2, x2, 685, t, t2 + 0.3, M['5-2']);
    bung(e.q1, x1 + 40, 600, t, tq + 0.15, D - 0.2); bung(e.q2, x2 - 30, 640, t, tq + 1.0, D - 0.2);
    nguoi(e, 'tom', 230, 820, 0.78, false, { ...DUNG, sr: t > t2 && t < t2 + 2 ? -110 : -4, er: -10, dau: -3, mieng: t > tq ? 1 : 0 }, t);
    nguoi(e, 'rob', 400, 822, 0.78, false, { ...DUNG, dau: -2, mieng: t > tq + 0.5 ? 1 : 0 }, t, 1.2);
    dat(e.max, 60, 826, 0.72, false); choDung(e, 'max'); choVay(e, 'max', t);
    const [cx, cy, z] = kf(t, [[0, ...N(700, 480, 1.0, 800, 450)], [M['5-1'], ...N(900, 560, 1.06, 800, 450)], [D, ...N(1000, 600, 1.12, 800, 450)]]);
    cam(e, cx, cy, z); gioThoi(e, t);
  },
});
// 7 — Robert sees a bird in a tree. The bird is green. "Tweet! Tweet!"
C.push({
  kb: [1.0, '6-0', 0.5, '6-1', 0.6, '6-2', { s: 'tweet', o: 0.1 }, { s: 'tweet', o: 0.75 }, 1.9],
  ve() {
    const not = `<g data-k="not" opacity="0"><text x="0" y="0" font-family="${FONT}" font-weight="800" font-size="64" fill="#3b3049">♪</text><text x="46" y="-38" font-family="${FONT}" font-weight="800" font-size="52" fill="#3b3049">♫</text></g>`;
    const n = nenCongVien('c6', { chinh: cay('cayTo', 1240, 720, 1.05, true) + max('max') + tom('tom', { balo: true }) + robert('rob') + vongSang('sang', 80, '#d8ffc0') + chim('chim') + not + loi('tw', 'Tweet! Tweet!', 330, 92, 'phai', 48),
      cayGiua: cay('cay1', 200, 640, 0.6) });
    return lop5(n.L0, n.L1, n.L2, n.L3, n.L4);
  },
  len(t, M, D, W, e) {
    const tb = M['6-0'] + 0.3; const chi = doan(t, tb, tb + 0.5);
    nguoi(e, 'tom', 330, 740, 0.95, false, { ...DUNG, dau: t > tb + 0.6 ? -8 : 0, mieng: t > M['6-2'] ? 1 : 0 }, t);
    nguoi(e, 'rob', 530, 740, 0.95, false, { ...DUNG, sr: noi(-4, -140, chi), er: noi(-8, 10, chi), dau: noi(0, -12, chi), mieng: chi > 0.5 ? 1 : 0 }, t, 0.6);
    dat(e.max, 120, 744, 0.86, false); choDung(e, 'max'); choVay(e, 'max', t); quay(e['max-dau'], t > tb + 0.8 ? -16 : 0);
    // chim bay vào, đậu trên cành
    const bx0 = 1900, by0 = 80, bx1 = 806, by1 = 720 - 1.05 * 247 - 36; const p = doan(t, 0.1, M['6-0'] + 0.2);
    const tw = M['6-2'] + GIONG.cau['6-2'].d; const hot = (a) => t > a && t < a + 0.6;
    const nhay = (hot(tw + 0.1) || hot(tw + 0.75)) ? Math.abs(Math.sin((t - tw) * 14)) * 8 : 0;
    dat(e.chim, noi(bx0, bx1, p), noi(by0, by1, p) - Math.sin(p * Math.PI) * 80 - nhay, 1.25, false);
    quay(e['chim-canh'], p < 1 ? Math.sin(t * 34) * 50 : 0, 4, -6);
    const mo1 = (hot(tw + 0.1) || hot(tw + 0.75)) && Math.sin((t - tw) * 26) > 0; mo(e['chim-mo1'], mo1 ? 1 : 0); mo(e['chim-mo0'], mo1 ? 0 : 1);
    const tg = W('6-1', 'green'); bung(e.sang, bx1, by1 - 10, t, tg, tw);
    bung(e.not, bx1 - 80, by1 - 70 - ((t * 30) % 30), t, tw + 0.15, D - 0.2); bung(e.tw, bx1 - 30, by1 - 60, t, tw + 0.1, D - 0.2);
    const tt = e['cayTo-tan']; if (tt) tt.setAttribute('transform', `rotate(${n1(Math.sin(t * 0.8) * 0.8)} 0 -300)`);
    const [cx, cy, z] = kf(t, [[0, ...N(820, 470, 1.0, 800, 450)], [tb, ...N(820, 470, 1.0, 800, 450)], [tg - 0.2, ...N(760, 440, 1.3, 800, 380)], [D, ...N(770, 435, 1.36, 800, 380)]]);
    cam(e, cx, cy, z); gioThoi(e, t, ['cay1']);
  },
});
// 8 + 9 — dã ngoại dưới gốc cây
function nenPicnic(id) {
  const tham = `<g transform="translate(830 790)"><path d="M-470 -80 L470 -80 L560 60 L-560 60 Z" fill="#f7f2fc" ${VN('#c9bcd9', 2.4)}/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${-470 + i * 94} -80 L${-423 + i * 94} -80 L${-560 + i * 112 + 56} 60 L${-560 + i * 112} 60 Z" fill="#cdb6ec" opacity=".55"/>`).join('')}
    <path d="M-500 -34 L500 -34 L520 -6 L-520 -6 Z M-540 20 L540 20 L552 40 L-552 40 Z" fill="#cdb6ec" opacity=".45"/></g>`;
  const dia = `<g transform="translate(830 744)"><ellipse cx="0" cy="0" rx="78" ry="18" fill="#fff" ${VN('#b7c1cf', 2.4)}/><ellipse cx="0" cy="-2" rx="58" ry="11" fill="none" stroke="#e3e8ef" stroke-width="3"/></g>`;
  return nenCongVien(id, { duong: false, chinh: cay('cayTo', 840, 680, 1.1) + tham + dia, cayGiua: cay('cay1', 1600, 640, 0.6) + cay('cay2', -100, 640, 0.6) });
}
const CAM = (k) => `<g data-k="${k}-cb" transform="translate(6 -4) rotate(-20) scale(.32)">${banhMi()}</g><g data-k="${k}-cc" opacity="0"><g transform="translate(2 8) rotate(-10) scale(.9)">${coc(0, 26)}</g></g>`;
C.push({
  kb: [0.9, '7-0', 0.6, '7-1', 2.4],
  ve() {
    const n = nenPicnic('c7');
    return lop5(n.L0, n.L1, n.L2, n.L3 + `<g data-k="dia">${banhMi(830, 714, 0.42)}</g>` + chaiNuoc(910, 742, 0.36) +
      tom('tom', { balo: false, camR: CAM('tom') }) + robert('rob', { camR: CAM('rob') }) + max('max'), n.L4);
  },
  len(t, M, D, W, e) {
    const ta = M['7-1']; const td = W('7-1', 'drink');
    const an = (lech) => { const x = (t - ta - lech); return x > 0 && t < td - 0.2 ? Math.pow(Math.max(0, Math.sin(x * 3.4)), 0.7) : 0; };
    const uong = (lech) => tron((t - td - lech) / 0.45) * (1 - tron((t - td - lech - 1.7) / 0.4));
    const tay = (a, u) => ({ sr: noi(noi(-40, -118, a), -128, u), er: noi(noi(-60, -84, a), -70, u) });
    const pT = { ...NGOI_T, ...tay(an(0), uong(0)), dau: -5 * uong(0), mieng: an(0) > 0.6 || uong(0) > 0.5 ? 2 : 0 };
    const pR = { ...NGOI_R, ...tay(an(0.5), uong(0.3)), dau: -5 * uong(0.3), mieng: an(0.5) > 0.6 || uong(0.3) > 0.5 ? 2 : 0 };
    for (const k of ['tom', 'rob']) { const uo = t > td - 0.1; mo(e[k + '-cb'], uo ? 0 : 1); mo(e[k + '-cc'], uo ? 1 : 0); }
    nguoi(e, 'tom', 620, 760, 1.0, false, pT, t);
    nguoi(e, 'rob', 1050, 760, 1.0, true, pR, t, 1.3);
    dat(e.max, 1360, 800, 0.86, true); choNam(e, 'max'); choVay(e, 'max', t, 0.6); quay(e['max-dau'], 8 + Math.sin(t * 1.5) * 3);
    const [cx, cy, z] = kf(t, [[0, ...N(860, 520, 1.0, 800, 450)], [M['7-1'], ...N(840, 590, 1.1, 800, 430)], [D, ...N(840, 590, 1.15, 800, 420)]]);
    cam(e, cx, cy, z); gioThoi(e, t, ['cayTo', 'cay1', 'cay2']);
  },
});
// 9 — Oh no! Max takes a sandwich and runs away! Tom and Robert laugh.
C.push({
  kb: [0.8, '8-0', 0.4, '8-1', 0.6, '8-2', 2.2],
  ve() {
    const n = nenPicnic('c8');
    return lop5(n.L0, n.L1, n.L2, n.L3 + `<g data-k="dia">${banhMi(830, 714, 0.42)}</g>` + chaiNuoc(910, 742, 0.36) +
      tom('tom', { camR: CAM('tom') }) + robert('rob', { camR: CAM('rob') }) + max('max') +
      `<g data-k="bui" opacity="0">${[0, 1, 2].map((i) => `<circle cx="${i * 44}" cy="${-i * 6}" r="${24 - i * 5}" fill="#efe6d3" opacity=".9"/>`).join('')}</g>` +
      loi('ohno', 'Oh no!', 220, 90, 'trai', 50) + loi('h1', 'Ha ha!', 200, 84, 'phai', 46) + loi('h2', 'Ha ha!', 200, 84, 'trai', 46), n.L4);
  },
  len(t, M, D, W, e) {
    const tl = 0.1, tg = M['8-1'] + 0.5, tc = M['8-1'] + 1.0;
    let x = noi(1360, 990, doan(t, tl, tg)); const huongTrai = t < tc;
    if (t > tc) x = noi(990, 2100, Math.pow(kep((t - tc) / 1.8), 1.5));
    const dang = (t > tl && t < tg) || t > tc;
    dat(e.max, x, 800, 0.86, huongTrai);
    if (dang) choDi(e, 'max', x / 0.86 / BUOC_M * Math.PI * 2, t > tc); else choDung(e, 'max');
    choVay(e, 'max', t, t > tc ? 1.6 : 1); quay(e['max-dau'], t > tg - 0.3 && t < tc ? 18 : 0);
    mo(e.dia, t < tg ? 1 : 0); mo(e['max-banh'], t >= tg ? 1 : 0);
    mo(e.bui, t > tc && t < tc + 2 ? 1 : 0); dat(e.bui, x - 140, 796, 0.6 + 0.4 * ((t * 3) % 1));
    const ngac = t > M['8-0'] - 0.2 && t < M['8-2'];
    const cuoi = t > M['8-2'] ? Math.abs(Math.sin((t - M['8-2']) * 9)) : 0;
    const pT = { ...NGOI_T, sr: -40, er: -60, sl: 30, el: -50, mieng: ngac ? 2 : (t > M['8-2'] ? 1 : 0), may: ngac ? 5 : 0, y: NGOI_T.y - cuoi * 6, ng: -cuoi * 4, dau: ngac ? 6 : -cuoi * 6 };
    const pR = { ...NGOI_R, sr: t > M['8-2'] ? -24 : -40, er: t > M['8-2'] ? -96 : -60, sl: 30, el: -50, mieng: ngac ? 2 : (t > M['8-2'] ? 1 : 0), may: ngac ? 5 : 0, y: NGOI_R.y - cuoi * 5, ng: -cuoi * 3, dau: ngac ? 6 : -cuoi * 5 };
    nguoi(e, 'tom', 620, 760, 1.0, false, pT, t);
    nguoi(e, 'rob', 1050, 760, 1.0, true, pR, t, 1.3);
    bung(e.ohno, 700, 420, t, M['8-0'], M['8-1'] + 0.4);
    bung(e.h1, 600, 450, t, M['8-2'] + 0.1, D - 0.2); bung(e.h2, 1070, 330, t, M['8-2'] + 0.4, D - 0.2);
    const [cx, cy, z] = kf(t, [[0, ...N(980, 600, 1.1, 800, 430)], [tg, ...N(960, 620, 1.16, 800, 430)], [tc + 1, ...N(1100, 600, 1.04, 800, 440)], [M['8-2'] + 0.4, ...N(840, 580, 1.14, 800, 420)], [D, ...N(840, 580, 1.17, 800, 420)]]);
    cam(e, cx, cy, z); gioThoi(e, t, ['cayTo', 'cay1', 'cay2']);
  },
});
// 10 — Then it rains. Splash! Splash! Tom, Robert and Max run to the bus stop.
const TRAM_X = 2000, TRAM_Y = 740;
function giotMua(n, w, seed = 1, dai = 46) {
  return Array.from({ length: n }, (_, i) => { const x = ((i * 157 + seed * 31) % w) - 100; const d = ((i * 37) % 70) / 100; const y = -((i * 89) % 900);
    return `<line class="giot" style="animation-delay:-${d}s" x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + dai}" stroke="#eaf4ff" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>`; }).join('');
}
C.push({
  kb: [0.7, '9-0', { s: 'mua', o: -0.6, d: 'het' }, 0.6, '9-1', { s: 'splash1', w: ['9-1', 0] }, { s: 'splash2', w: ['9-1', 1] }, 0.6, '9-2', 2.9],
  ve() {
    const vung = [[520, 760, 120], [980, 776, 100], [1500, 766, 110], [1800, 782, 90]].map(([x, y, r], i) => `<g transform="translate(${x} ${y})"><ellipse rx="${r}" ry="${r * 0.16}" fill="#9db6cc" opacity=".9"/><ellipse rx="${r * 0.8}" ry="${r * 0.1}" fill="#c9dbea" opacity=".7"/>
      <g data-k="vg${i}"><ellipse rx="${r * 0.4}" ry="${r * 0.07}" fill="none" stroke="#eef6ff" stroke-width="3"/></g></g>`).join('');
    const te = [[520, 760], [980, 776]].map(([x, y], i) => `<g data-k="te${i}" opacity="0" transform="translate(${x} ${y})"><path d="M-46 0 C-60 -40 -66 -60 -64 -80 M-20 -4 C-24 -50 -24 -70 -18 -96 M18 -4 C22 -50 24 -70 20 -96 M46 0 C60 -40 66 -60 64 -80" fill="none" stroke="#dcecfa" stroke-width="7" stroke-linecap="round"/>
      <circle cx="-64" cy="-90" r="7" fill="#dcecfa"/><circle cx="-18" cy="-106" r="8" fill="#dcecfa"/><circle cx="20" cy="-106" r="8" fill="#dcecfa"/><circle cx="64" cy="-90" r="7" fill="#dcecfa"/></g>`).join('');
    const n = nenCongVien('c9', { mua: true, chinh: vung + `<g transform="translate(${TRAM_X} ${TRAM_Y})">${tramXe('tram')}</g>` + max('max') + tom('tom', { balo: true }) + robert('rob') + te + loi('spl', 'Splash! Splash!', 360, 92, 'trai', 48) +
      `<defs><clipPath id="c9kep"><path clip-rule="evenodd" d="M-1000 -1200 L4200 -1200 L4200 1400 L-1000 1400 Z ${VUNG_TRAM(TRAM_X, TRAM_Y)}"/></clipPath></defs>
       <g clip-path="url(#c9kep)" data-k="muaHop" opacity="0"><g data-k="muaDich">${giotMua(104, 1900, 1, 52)}</g></g>
       <g data-k="nho">${[-260, -150, -40, 70, 180, 290].map((x, i) => `<line class="giot2" style="animation-delay:-${(i * 0.23).toFixed(2)}s" x1="${TRAM_X + x}" y1="${TRAM_Y - 290}" x2="${TRAM_X + x}" y2="${TRAM_Y - 270}" stroke="#eaf4ff" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>`,
      cayGiua: cay('cay1', 300, 640, 0.62) + cay('cay2', 1500, 640, 0.6) });
    const toi = `<rect data-k="toi" x="-600" y="-500" width="2800" height="1500" fill="#40526b" opacity="0"/>`;
    // phiên bản trời nắng (trước khi mưa) phủ lên rồi mờ dần
    return lop5(n.L0 + troi('c9s', ['#4faeea', '#97d4f6', '#d8f1ff', '#fff1d2']).replace('<rect', '<rect data-k="nang"') + `<circle data-k="nang2" cx="1320" cy="120" r="420" fill="url(#pSang)" opacity=".5"/>` + may('m5', 300, 160, 0.9) + may('m6', 1200, 110, 0.8) + toi, n.L1, n.L2, n.L3, n.L4);
  },
  len(t, M, D, W, e) {
    const tr = M['9-0'];
    const u = doan(t, tr - 0.6, tr + 1.4);
    mo(e.nang, 1 - u); mo(e.nang2, 0.5 * (1 - u)); mo(e.m5, 1 - u); mo(e.m6, 1 - u); mo(e.toi, 0.25 * u); mo(e.muaHop, u); mo(e.nho, u);
    const ts = M['9-1'];
    [0, 1].forEach((i) => { const a = W('9-1', i) + 0.05; const p = kep((t - a) / 0.5); const el = e['te' + i]; if (el) { mo(el, p > 0 && p < 1 ? 1 - p * 0.7 : 0); el.setAttribute('transform', `translate(${i ? 980 : 520} ${i ? 776 : 760}) scale(${n1(0.4 + p * 0.8)} ${n1(0.3 + p)})`); } });
    for (let i = 0; i < 4; i++) { const el = e['vg' + i]; if (!el) continue; const f = (t * 1.3 + i * 0.37) % 1; el.setAttribute('transform', `scale(${n1(0.4 + f * 1.5)})`); mo(el, u * (1 - f)); }
    bung(e.spl, 560, 600, t, ts, M['9-2']);
    const tg = M['9-2'] + 0.25, tden = D - 0.7;
    const dT = diTu(t, tg, tden, 600, TRAM_X - 60, BUOC_T * 1.3, 0.95), dR = diTu(t, tg, tden, 400, TRAM_X + 120, BUOC_R * 1.3, 0.95);
    const xM = noi(200, TRAM_X - 220, doan(t, tg, tden));
    const ngUp = t > tr && t < tg ? -10 : 0;
    nguoi(e, 'tom', dT.x, TRAM_Y, 0.95, false, dT.dang ? { ...diBo(dT.ph, 1, true), mieng: 1 } : { ...DUNG, dau: ngUp, sr: t > tr + 0.4 && t < tg ? -170 : -4, er: -40, mieng: t > tr && t < tg ? 2 : 0 }, t);
    nguoi(e, 'rob', dR.x, TRAM_Y, 0.95, false, dR.dang ? { ...diBo(dR.ph, 1, true), mieng: 1 } : { ...DUNG, dau: ngUp, mieng: t > tr && t < tg ? 2 : 1 }, t, 1.1);
    dat(e.max, xM, TRAM_Y + 4, 0.86, false); if (t > tg && t < tden) choDi(e, 'max', xM / 0.86 / BUOC_M * Math.PI * 2, true); else choDung(e, 'max'); choVay(e, 'max', t, 1.2);
    const [cx, cy, z] = kf(t, [[0, ...N(760, 480, 1.0, 800, 450)], [tr + 0.6, ...N(760, 400, 1.04, 800, 450)], [ts + 0.2, ...N(720, 560, 1.12, 800, 430)], [tg, ...N(720, 560, 1.12, 800, 430)], [tden, ...N(2000, 520, 1.0, 800, 430)], [D, ...N(2000, 520, 1.05, 800, 430)]]);
    cam(e, cx, cy, z);
    const md = e.muaDich; if (md) md.setAttribute('transform', `translate(${n1(cx)} ${n1(cy)})`);
    gioThoi(e, t * 1.6);
  },
});
// 11 — They go home by bus. It is bus number seven.
C.push({
  kb: [{ s: 'xemay', o: 0 }, { s: 'mua', o: 0, d: 'het', v: 0.45 }, { s: 'coi', o: 2.0 }, { s: 'cua', o: 2.9 }, 3.0, '10-0', 1.0, '10-1', 3.6],
  ve() {
    const duong = `<defs>${lg('c10r', [[0, '#5b6474'], [1, '#3e4552']])}${lg('c10v', [[0, '#9aa4b2'], [1, '#7c8694']])}</defs>
      <path d="M-600 760 L2400 760 L2400 1100 L-600 1100 Z" fill="url(#c10r)"/><path d="M-600 742 L2400 742 L2400 766 L-600 766 Z" fill="url(#c10v)"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${-500 + i * 220}" y="860" width="120" height="12" rx="6" fill="#d6dbe3" opacity=".75"/>`).join('')}
      ${[[300, 820, 140], [1100, 840, 120], [1700, 812, 110]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.12}" fill="#8b98aa" opacity=".6"/>`).join('')}
      <path d="M-600 800 C0 805 800 795 2400 805" stroke="#7d8899" stroke-width="2" opacity=".5" fill="none"/>`;
    const n = nenCongVien('c10', { mua: true, duong: false, coTien: false, chinh: duong + `<g transform="translate(1260 744)">${tramXe('tram')}</g>` + xeBuyt('xe') + max('max') + tom('tom', { balo: true }) + robert('rob') + vongSang('sang', 70, '#fff', true) + lapLanh('s1', 1.2) +
      `<defs><clipPath id="c10kep"><path clip-rule="evenodd" d="M-1000 -1200 L4200 -1200 L4200 1400 L-1000 1400 Z ${VUNG_TRAM(1260, 744)}"/></clipPath></defs><g clip-path="url(#c10kep)" data-k="muaHop"><g data-k="muaDich" opacity=".6">${giotMua(60, 1900, 3, 44)}</g></g>`, cayGiua: cay('cay1', 200, 640, 0.6) });
    return lop5(n.L0 + `<rect x="-600" y="-500" width="2800" height="1500" fill="#40526b" opacity=".18"/>`, n.L1, n.L2, n.L3, n.L4);
  },
  len(t, M, D, W, e) {
    const tDung = 2.8, tDi = D - 2.8;
    let x = noi(-580, 700, 1 - Math.pow(1 - kep(t / tDung), 3));
    if (t > tDi) x = noi(700, 2500, Math.pow(kep((t - tDi) / 2.8), 2));
    dat(e.xe, x, 790, 1);
    const gq = (t < tDung ? (1 - Math.pow(1 - kep(t / tDung), 3)) * 1280 : 1280) + (t > tDi ? Math.pow(kep((t - tDi) / 2.8), 2) * 1800 : 0);
    quay(e['xe-b1'], gq / 62 * 57.3); quay(e['xe-b2'], gq / 62 * 57.3);
    const rung = (t < tDung || t > tDi) ? Math.sin(t * 40) * 1.2 : Math.sin(t * 30) * 0.4; const th = e['xe-than']; if (th) th.setAttribute('transform', `translate(0 ${n1(rung)})`);
    const mc = doan(t, 3.0, 3.6) * (1 - doan(t, M['10-1'] - 0.2, M['10-1'] + 0.4));
    dat(e['xe-cua1'], -40 * mc, 0); dat(e['xe-cua2'], 40 * mc, 0);
    // lên xe: đi về phía cửa (trái), mờ dần khi vào
    const tl = 3.5; const dT = diTu(t, tl, tl + 1.6, 1240, 840, BUOC_T, 0.85), dR = diTu(t, tl + 0.35, tl + 2.1, 1390, 840, BUOC_R, 0.85);
    const xM = noi(1150, 840, doan(t, tl - 0.2, tl + 1.0));
    nguoi(e, 'tom', dT.x, 744, 0.85, true, poseDi(dT, false, { mieng: 1 }), t);
    nguoi(e, 'rob', dR.x, 744, 0.85, true, poseDi(dR, false, { mieng: 1 }), t, 1);
    dat(e.max, xM, 748, 0.8, true); if (t > tl - 0.2 && t < tl + 1.0) choDi(e, 'max', xM / 0.8 / BUOC_M * Math.PI * 2); else choDung(e, 'max'); choVay(e, 'max', t);
    mo(e.max, 1 - doan(t, tl + 0.7, tl + 1.0)); mo(e.tom, 1 - doan(t, tl + 1.3, tl + 1.6)); mo(e.rob, 1 - doan(t, tl + 1.8, tl + 2.1));
    mo(e['xe-khach'], doan(t, tl + 2.0, tl + 2.6));
    const t7 = W('10-1', 'seven'); bung(e.sang, x - 25, 790 - 116, t, t7 - 0.1, tDi); bung(e.s1, x + 40, 790 - 180, t, t7 + 0.2, tDi);
    const [cx, cy, z] = kf(t, [[0, ...N(760, 520, 1.0, 800, 450)], [tDung, ...N(860, 520, 1.0, 800, 450)], [M['10-1'] - 0.3, ...N(860, 520, 1.0, 800, 450)], [t7 + 0.3, ...N(700, 620, 1.5, 800, 400)], [tDi + 0.2, ...N(700, 620, 1.5, 800, 400)], [D, ...N(1200, 520, 1.04, 800, 450)]]);
    cam(e, cx, cy, z);
    const md = e.muaDich; if (md) md.setAttribute('transform', `translate(${n1(cx)} ${n1(cy)})`);
  },
});
// 12 — Mom says, "Welcome home!" Max is happy. "Woof!"
C.push({
  kb: [0.6, { s: 'chuong', o: 0 }, 1.6, '11-0', 0.35, '11-1', 0.6, '11-2', 0.4, '11-3', { s: 'woof1', o: 0.15 }, 2.4],
  ve() {
    const L0 = `<defs>${lg('c11w', [[0, '#f9dfbf'], [1, '#efc597']])}${lg('c11s', [[0, '#3c3a78'], [0.45, '#b45c8a'], [0.8, '#f59a5a'], [1, '#ffd08a']])}${lg('c11f', [[0, '#b77a4c'], [1, '#8a5532']])}${rg('c11l', [[0, '#ffe7a8', 0.9], [0.45, '#ffcf70', 0.38], [1, '#ffcf70', 0]])}</defs>
      <rect x="-600" y="-500" width="2800" height="1500" fill="url(#c11w)"/>
      ${Array.from({ length: 30 }, (_, i) => `<rect x="${-500 + i * 90}" y="-200" width="4" height="900" fill="#e9b886" opacity=".35"/>`).join('')}`;
    const L1 = `<rect x="-600" y="560" width="2800" height="180" fill="#c98f63"/><rect x="-600" y="556" width="2800" height="12" fill="#a8714a"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${-520 + i * 180}" y="590" width="140" height="120" rx="6" fill="none" stroke="#a8714a" stroke-width="3" opacity=".6"/>`).join('')}
      <g transform="translate(600 150)"><rect x="-10" y="-10" width="300" height="320" rx="10" fill="#fff6ea" ${VN('#9b6a44', 3)}/><rect x="6" y="6" width="268" height="288" fill="url(#c11s)"/>
        <circle cx="200" cy="230" r="34" fill="#ffd38a" opacity=".9"/>
        <path d="M6 250 L50 222 L80 240 L120 210 L170 250 L220 226 L274 252 L274 294 L6 294 Z" fill="#3a2f55"/>
        ${[[60, 70], [150, 40], [230, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".9"/>`).join('')}
        <path d="M140 6 L140 294 M6 150 L274 150" stroke="#fff6ea" stroke-width="10"/>
        <path d="M-40 -24 C-30 120 -40 260 -50 340 L40 340 C20 240 30 100 20 -24 Z" fill="#c25b52" ${VN('#8a3a34', 2)}/><path d="M320 -24 C310 120 320 260 330 340 L240 340 C260 240 250 100 260 -24 Z" fill="#c25b52" ${VN('#8a3a34', 2)}/>
        <rect x="-60" y="-34" width="400" height="16" rx="8" fill="#7a4a2c"/></g>
      <g transform="translate(1060 230)"><rect x="-74" y="-60" width="148" height="120" rx="6" fill="#7a4a2c"/><rect x="-62" y="-48" width="124" height="96" fill="#bfe0f2"/><path d="M-62 48 L-20 0 L10 26 L40 -6 L62 20 L62 48 Z" fill="#6fae58"/><circle cx="34" cy="-20" r="10" fill="#fff3b0"/></g>
      <g transform="translate(150 740)"><circle cx="0" cy="-400" r="300" fill="url(#c11l)"/><path d="M-6 0 L-6 -360 L6 -360 L6 0 Z" fill="#5d4636"/><ellipse cx="0" cy="0" rx="60" ry="12" fill="#5d4636"/>
        <path d="M-70 -350 L70 -350 L46 -440 L-46 -440 Z" fill="#fff0c8" ${VN('#c9a46a', 2.4)}/></g>`;
    const L3 = `<path d="M-600 740 L2400 740 L2400 1100 L-600 1100 Z" fill="url(#c11f)"/>
      ${Array.from({ length: 22 }, (_, i) => `<path d="M${-500 + i * 140} 740 L${-1100 + i * 200} 1100" stroke="#7a4a2c" stroke-width="3" opacity=".5"/>`).join('')}
      <ellipse cx="760" cy="830" rx="520" ry="64" fill="#7d5aa6" opacity=".55"/><ellipse cx="760" cy="830" rx="470" ry="50" fill="none" stroke="#f3d9a8" stroke-width="5" opacity=".6"/>
      <g transform="translate(1330 740)"><rect x="-120" y="-460" width="240" height="460" fill="url(#c11s)"/>
        <path d="M-120 -40 L-60 -60 L0 -40 L60 -64 L120 -40 L120 0 L-120 0 Z" fill="#3a2f55"/>
        <rect x="-136" y="-476" width="272" height="476" rx="6" fill="none" stroke="#f6e7d0" stroke-width="22"/>
        <g data-k="cua"><rect x="-120" y="-460" width="240" height="460" fill="url(#pGo)" ${VN('#5d3b22', 3)}/><rect x="-90" y="-420" width="180" height="170" rx="10" fill="none" stroke="#6b4426" stroke-width="5"/><rect x="-90" y="-210" width="180" height="170" rx="10" fill="none" stroke="#6b4426" stroke-width="5"/><circle cx="-90" cy="-230" r="10" fill="#f2c14e" ${VN('#a67c1a', 2)}/></g></g>` +
      me('me') + max('max') + tom('tom', { balo: true }) + robert('rob') + loi('wh', 'Welcome home!', 410, 96, 'trai', 54) + loi('wf', 'Woof!', 180, 84, 'phai', 48);
    const L4 = `<rect x="-600" y="-500" width="2800" height="1500" fill="url(#c11l)" opacity=".0"/>`;
    return lop5(L0, L1, '', L3, L4);
  },
  len(t, M, D, W, e) {
    const mc = doan(t, 0.5, 1.4); const cua = e.cua; if (cua) cua.setAttribute('transform', `translate(120 0) scale(${(1 - 0.86 * mc).toFixed(3)} 1) translate(-120 0)`);
    const vao = (a, b, x0, x1, buoc, s) => diTu(t, a, b, x0, x1, buoc, s);
    const dM = vao(1.2, 2.8, 1400, 820, BUOC_M, 0.9), dT = vao(1.6, 3.6, 1340, 1000, BUOC_T, 1.0), dR = vao(1.9, 4.0, 1360, 1190, BUOC_R, 1.0);
    const th = M['11-2'] + 0.1; const nhay = t > th ? Math.abs(Math.sin((t - th) * 6.5)) * 70 : 0;
    dat(e.max, dM.x, 760 - nhay, 0.9, true); if (dM.dang) choDi(e, 'max', dM.ph, true); else choDung(e, 'max'); choVay(e, 'max', t, t > th ? 2 : 1);
    mo(e['max-m1'], t > th ? 1 : 0); mo(e['max-m0'], t > th ? 0 : 1); quay(e['max-dau'], t > th ? -10 : 0);
    nguoi(e, 'tom', dT.x, 760, 1.0, true, poseDi(dT, false, { mieng: t > M['11-1'] ? 1 : 0 }), t);
    nguoi(e, 'rob', dR.x, 760, 1.0, true, poseDi(dR, false, { mieng: t > M['11-1'] ? 1 : 0, ...(t > M['11-3'] ? { sr: -150, er: -10 } : {}) }), t, 1);
    const vay = t > M['11-0'] ? Math.sin(t * 7) * 14 : 0; const mo2 = doan(t, M['11-0'] - 0.3, M['11-0'] + 0.3);
    nguoi(e, 'me', 470, 760, 1.0, false, { ...DUNG, sl: noi(4, 100, mo2), el: noi(-8, -20, mo2), sr: noi(-4, -150, mo2) + vay, er: -20, mieng: t > M['11-1'] - 0.1 ? 1 : 0, dau: 4 }, t, 0.7);
    for (const k of ['tom', 'rob', 'max']) { const el = e[k]; if (el) mo(el, t > 1.2 ? 1 : 0); }
    bung(e.wh, 520, 330, t, M['11-1'], D - 0.2); bung(e.wf, dM.x - 40, 540 - nhay, t, M['11-3'] + 0.1, D - 0.2);
    const [cx, cy, z] = kf(t, [[0, ...N(1000, 480, 1.0, 800, 450)], [2.4, ...N(880, 500, 1.04, 800, 430)], [M['11-1'], ...N(780, 500, 1.1, 800, 420)], [D, ...N(790, 500, 1.14, 800, 420)]]);
    cam(e, cx, cy, z);
  },
});

// ───────────────────────── lịch chạy (tính từ độ dài từng câu) ─────────────────────────
const CHU = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function xayLich() {
  const ds = []; let T = 0;
  C.forEach((c, i) => {
    let t = 0; const M = {}; const cau = []; const tieng = [];
    const W = (id, w) => { const g = GIONG.cau[id]; const k = typeof w === 'number' ? w : g.t.split(/\s+/).findIndex((x) => CHU(x) === CHU(w)); return M[id] + (g.w[k] != null ? g.w[k] : 0); };
    for (const b of c.kb) {
      if (typeof b === 'number') t += b;
      else if (typeof b === 'string') { M[b] = t; cau.push({ id: b, a: t }); t += GIONG.cau[b].d; }
      else tieng.push({ s: b.s, a: (b.w ? W(b.w[0], b.w[1]) : t) + (b.o || 0), d: b.d, v: b.v });
    }
    for (const x of tieng) if (x.d === 'het') x.d = t - x.a;
    ds.push({ i, a: T, D: t, M, W, cau, tieng });
    T += t;
  });
  return { ds, het: T };
}
const LICH = xayLich();
export const TONG_GIAY = Math.round((LICH.het + DUOI) * 10) / 10;

// ───────────────────────── tiếng động THẬT (mp3 trong tieng/, nguồn: GHI CONG.md) ─────────────────────────
const TIENG = {
  woof2: { f: 'cho-sua-2', v: 0.9 }, woof1: { f: 'cho-sua-1', v: 0.9 }, quack: { f: 'vit-keu', v: 0.85 }, tweet: { f: 'chim-hot', v: 0.75 },
  mua: { f: 'mua', v: 0.36, lap: true }, splash1: { f: 'te-nuoc-1', v: 0.8 }, splash2: { f: 'te-nuoc-2', v: 0.8 },
  xemay: { f: 'xe-may', v: 0.38 }, coi: { f: 'xe-coi', v: 0.55 }, cua: { f: 'xe-cua', v: 0.6 }, chuong: { f: 'chuong-cua', v: 0.55 },
};

// ───────────────────────── CSS (một lần) ─────────────────────────
function napCss() {
  if (document.getElementById('phim-css')) return;
  const f = (w) => `@font-face{font-family:'Baloo 2';font-style:normal;font-weight:${w};font-display:swap;src:url(${url(`../../core/assets/fonts/baloo-2-${w}.woff2`)}) format('woff2')}`;
  const s = document.createElement('style'); s.id = 'phim-css';
  s.textContent = f(600) + f(700) + f(800) + `
.phim-khung{position:relative;width:100%;height:100%;overflow:hidden;background:#141020;user-select:none;-webkit-user-select:none;contain:strict}
.phim-san{position:absolute;left:50%;top:50%;width:1600px;height:900px;transform-origin:0 0;overflow:hidden;background:#bfe9ff;pointer-events:none}
.phim-defs{position:absolute;width:0;height:0;overflow:hidden}
.phim-lop{position:absolute;inset:0}.phim-lop svg{width:100%;height:100%;display:block}
.phim-vien{position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 46%,rgba(0,0,0,0) 62%,rgba(20,14,30,.30) 100%)}
.phim-hat{position:absolute;inset:-20px;opacity:.035;background-size:180px 180px;animation:pc-hat .5s steps(4) infinite}
.phim-phude{position:absolute;left:0;right:0;bottom:24px;margin:0 auto;width:fit-content;max-width:1500px;box-sizing:border-box;padding:10px 40px 14px;border-radius:44px;background:rgba(255,255,255,.94);
  box-shadow:0 10px 30px rgba(20,14,30,.25);border:4px solid #3b3049;font:800 62px/1.14 'Baloo 2',system-ui,sans-serif;color:#3b3049;text-align:center;white-space:normal;transition:opacity .25s;opacity:0}
.phim-phude.hien{opacity:1}
.phim-phude span{display:inline-block;padding:0 6px;border-radius:16px;color:#7a7389;transition:color .12s,background .12s,transform .12s}
.phim-phude span.da{color:#3b3049}
.phim-phude span.dang{color:#fff;background:#ff7a1a;transform:translateY(-3px) scale(1.06)}
.phim-ket{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(255,250,236,.96),rgba(255,236,206,.94));opacity:0;transition:opacity .8s}
.phim-ket.hien{opacity:1}
.phim-ket b{font:800 150px/1 'Baloo 2',system-ui,sans-serif;color:#3b3049;text-shadow:0 8px 0 #ffd23f}
.phim-ket small{margin-top:46px;font:600 40px/1 'Baloo 2',system-ui,sans-serif;letter-spacing:.32em;padding-left:.32em;color:#8a7f99}
.phim-ket small span{display:inline-block;opacity:0;transform:translateY(14px)}
.phim-ket.hien small span{animation:phim-chu .7s cubic-bezier(.22,.9,.3,1) forwards}
@keyframes phim-chu{to{opacity:1;transform:none}}
.phim-san .xoay{transform-box:fill-box;transform-origin:50% 50%;animation:pc-xoay 40s linear infinite}
.phim-san .lua{transform-box:fill-box;transform-origin:50% 100%;animation:pc-lua .45s ease-in-out infinite alternate}
.phim-san .giot{animation:pc-mua .62s linear infinite}
.phim-san .giot2{animation:pc-nho .5s linear infinite}
.phim-khung.dung *,.phim-khung.dung *::before{animation-play-state:paused!important}
@keyframes pc-xoay{to{transform:rotate(360deg)}}
@keyframes pc-lua{from{transform:scale(.86,.94)}to{transform:scale(1.08,1.1)}}
@keyframes pc-mua{from{transform:translate(0,-80px)}to{transform:translate(-120px,1000px)}}
@keyframes pc-nho{from{transform:translate(0,0);opacity:1}to{transform:translate(0,300px);opacity:.2}}
@keyframes pc-hat{0%{background-position:0 0}25%{background-position:-60px 40px}50%{background-position:30px -70px}75%{background-position:-90px -20px}100%{background-position:0 0}}
`;
  document.head.appendChild(s);
}
function anhHat() {   // ảnh hạt nhiễu nhỏ (vân phim) — vẽ một lần bằng canvas
  try {
    const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'); const d = g.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c.toDataURL('image/png');
  } catch (e) { return ''; }
}

// ───────────────────────── trình phát ─────────────────────────
export function taoPhim(container, opts = {}) {
  napCss();
  const tu = Math.max(0, Math.min(SO_CANH - 1, opts.tu | 0));
  const khung = document.createElement('div'); khung.className = 'phim-khung';
  const san = document.createElement('div'); san.className = 'phim-san';
  const defs = document.createElement('div'); defs.className = 'phim-defs';
  defs.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">${DEFS}</svg>`;
  const vien = document.createElement('div'); vien.className = 'phim-vien';
  const hat = document.createElement('div'); hat.className = 'phim-hat'; const ah = anhHat(); if (ah) hat.style.backgroundImage = `url(${ah})`;
  const phude = document.createElement('div'); phude.className = 'phim-phude';
  const ket = document.createElement('div'); ket.className = 'phim-ket';
  // 10/10 thầy: bỏ chữ ghi công dưới The End, thay bằng dòng ANDREW CLASSES (ghi công nhạc + tiếng động nằm ở GHI CONG.md)
  ket.innerHTML = `<b>The End</b><small>${'ANDREW CLASSES'.split('').map((c, k) => `<span style="animation-delay:${(0.25 + k * 0.06).toFixed(2)}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</small>`;
  san.append(defs, vien, hat, phude, ket); khung.append(san); container.appendChild(khung);
  // chặn mọi thao tác trên phim (không tua, không dừng)
  for (const ev of ['click', 'dblclick', 'contextmenu', 'pointerdown', 'keydown']) khung.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });

  const coGian = () => { const w = khung.clientWidth, h = khung.clientHeight; const k = Math.min(w / 1600, h / 900) || 0.001; san.style.transform = `scale(${k}) translate(-50%,-50%)`; };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(coGian) : null; ro ? ro.observe(khung) : window.addEventListener('resize', coGian); coGian();

  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const tong = ctx.createGain(); tong.gain.value = 1; tong.connect(ctx.destination);
  const kenhGiong = ctx.createGain(); kenhGiong.gain.value = 1; kenhGiong.connect(tong);
  const kenhNhac = ctx.createGain(); kenhNhac.gain.value = 0; kenhNhac.connect(tong);
  const kenhTieng = ctx.createGain(); kenhTieng.gain.value = 0.9; kenhTieng.connect(tong);
  const bo = {}; const boTieng = {}; let nhacBuf = null;
  const taiMot = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); const ab = await r.arrayBuffer(); return new Promise((ok, loi) => { const p = ctx.decodeAudioData(ab, ok, loi); if (p && p.then) p.then(ok, loi); }); };
  const pSan = Promise.all([
    ...Object.keys(GIONG.cau).map(async (id) => { try { bo[id] = await taiMot(url('giong/' + id + '.mp3')); } catch (e) { console.warn('[phim] thiếu giọng', id, e); } }),
    ...Object.entries(TIENG).map(async ([k, v]) => { try { boTieng[k] = await taiMot(url('tieng/' + v.f + '.mp3')); } catch (e) { console.warn('[phim] thiếu tiếng', k, e); } }),
    (async () => { try { nhacBuf = await taiMot(url('nhac/wallpaper.mp3')); } catch (e) { console.warn('[phim] thiếu nhạc', e); } })(),
    (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("800 50px 'Baloo 2'"), document.fonts.load("600 30px 'Baloo 2'")]).catch(() => {}) : null,
  ]).then(() => true);

  let goc = null;           // giờ phim = ctx.currentTime - goc
  let raf = 0, tim = 0, dangChay = false, dangDung = false, xong = false, daHuy = false;
  let canhHien = -1; let lopHien = null; const nguon = [];
  const batDau = LICH.ds[tu].a;
  const gioPhim = () => (goc == null ? batDau : Math.max(batDau, ctx.currentTime - goc));
  const CHUYEN = 1.0;   // chuyển cảnh: lau mềm (mặt nạ dải mờ quét trái → phải) 1 s

  function dungLop(i) {
    const c = C[i]; const d = document.createElement('div'); d.className = 'phim-lop';
    d.innerHTML = `<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${c.ve()}</svg>`;
    const e = {}; d.querySelectorAll('[data-k]').forEach((x) => { e[x.getAttribute('data-k')] = x; });
    san.insertBefore(d, vien);
    return { i, d, e };
  }
  let cauHien = null;
  function veChu(id) {
    if (cauHien === id) return;
    cauHien = id;
    if (!id) { phude.classList.remove('hien'); return; }
    phude.innerHTML = GIONG.cau[id].t.split(/\s+/).map((w) => `<span>${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');
    phude.classList.add('hien');
  }
  function khung1(T) {
    if (T >= LICH.het) { // màn kết
      ket.classList.add('hien'); veChu(null);
      if (lopHien) { const L = LICH.ds[SO_CANH - 1]; try { C[SO_CANH - 1].len(L.D, L.M, L.D, L.W, lopHien.e); } catch (e) { /* bỏ qua */ } }
      return;
    }
    let i = 0; while (i < SO_CANH - 1 && T >= LICH.ds[i + 1].a) i++;
    const L = LICH.ds[i]; const t = T - L.a;
    if (i !== canhHien) {
      const cu = lopHien; if (cu && cu.cu) { cu.cu.d.remove(); cu.cu = null; }
      lopHien = dungLop(i); canhHien = i; lopHien.d.style.opacity = cu && cu.i === i - 1 ? '0' : '1';
      if (cu && cu.i !== i - 1) { cu.d.remove(); lopHien.cu = null; } else lopHien.cu = cu;
      cauHien = undefined; veChu(null);
      try { opts.onCanh && opts.onCanh(i); } catch (e) { console.error(e); }
    }
    if (lopHien.cu) {
      const o = em(t / CHUYEN); const st = lopHien.d.style;
      if (o >= 1) { lopHien.cu.d.remove(); lopHien.cu = null; st.opacity = '1'; st.webkitMaskImage = st.maskImage = ''; }
      else { const a = (o * 140 - 30).toFixed(1); const m = `linear-gradient(100deg,#000 ${a}%,rgba(0,0,0,0) ${(+a + 30).toFixed(1)}%)`; st.opacity = '1'; st.webkitMaskImage = m; st.maskImage = m; }
    }
    try { C[i].len(t, L.M, L.D, L.W, lopHien.e); } catch (e) { console.error('[phim] cảnh', i, e); }
    // phụ đề + chữ đang đọc
    let cau = null; for (const c of L.cau) if (t >= c.a - 0.05) cau = c;
    veChu(cau ? cau.id : null);
    if (cau) {
      const g = GIONG.cau[cau.id]; const tt = t - cau.a; const sp = phude.children;
      let k = -1; for (let j = 0; j < g.w.length; j++) if (tt >= g.w[j] - 0.04) k = j;
      const het = tt > g.d - 0.1;
      for (let j = 0; j < sp.length; j++) { const cls = het || j < k ? 'da' : j === k ? 'dang' : ''; if (sp[j].className !== cls) sp[j].className = cls; }
    }
  }
  function vong() {
    if (daHuy) return;
    const T = gioPhim();
    khung1(T);
    if (!xong && T >= LICH.het + DUOI) {
      xong = true; dangChay = false; dungVong();
      try { opts.onXong && opts.onXong(); } catch (e) { console.error(e); }
      return;
    }
    raf = requestAnimationFrame(vong);
  }
  function dungVong() { cancelAnimationFrame(raf); clearInterval(tim); raf = 0; tim = 0; }

  function phatTieng(ten, w, d, v = 1) {
    const buf = boTieng[ten]; const cf = TIENG[ten]; if (!buf || !cf) return;
    const s = ctx.createBufferSource(); s.buffer = buf; const g = ctx.createGain(); const to = cf.v * v;
    if (d != null && d > 0) {   // tiếng nền (mưa, máy xe): vào/ra mềm, lặp nếu cần
      if (cf.lap || d > buf.duration) { s.loop = true; s.loopStart = 1; s.loopEnd = buf.duration - 1; }
      g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(to, w + Math.min(1.2, d / 3));
      g.gain.setValueAtTime(to, w + Math.max(0.1, d - 1.2)); g.gain.linearRampToValueAtTime(0.0001, w + d + 0.2);
      s.start(w); s.stop(w + d + 0.3);
    } else { g.gain.value = to; s.start(w); }
    s.connect(g).connect(kenhTieng); nguon.push(s);
  }
  function lenLich() {
    const g0 = ctx.currentTime + 0.12; goc = g0 - batDau;
    const at = (T) => goc + T;
    const phat = (buf, T, ra) => { if (!buf) return; const s = ctx.createBufferSource(); s.buffer = buf; s.connect(ra); s.start(Math.max(ctx.currentTime, at(T))); nguon.push(s); };
    const ng = kenhNhac.gain; ng.setValueAtTime(0, g0); ng.linearRampToValueAtTime(NHAC_TO, g0 + 1.2);
    for (const L of LICH.ds) {
      if (L.i < tu) continue;
      for (const c of L.cau) {
        const T = L.a + c.a; phat(bo[c.id], T, kenhGiong);
        const d = GIONG.cau[c.id].d;
        ng.setTargetAtTime(NHAC_NHO, Math.max(g0 + 1.3, at(T) - 0.15), 0.08);
        ng.setTargetAtTime(NHAC_TO, Math.max(g0 + 1.4, at(T + d) + 0.1), 0.45);
      }
      for (const x of L.tieng) { const w = at(L.a + x.a); if (w < ctx.currentTime - 0.05) continue; phatTieng(x.s, Math.max(ctx.currentTime, w), x.d, x.v); }
    }
    ng.setTargetAtTime(0.0001, at(LICH.het + DUOI - 1.6), 0.5);
    if (nhacBuf) {
      const s = ctx.createBufferSource(); s.buffer = nhacBuf; s.loop = true;
      s.loopStart = 0.7; s.loopEnd = Math.max(5, nhacBuf.duration - 3.6);
      const vong = s.loopEnd - s.loopStart; const off = s.loopStart + (batDau % vong);
      s.connect(kenhNhac); s.start(g0, off); s.stop(at(LICH.het + DUOI + 0.5)); nguon.push(s);
    }
  }

  // khung hình đầu tiên (chưa chạy): cảnh "tu" ở giây 0
  khung1(batDau);

  const api = {
    san: () => pSan,
    chay() {
      if (dangChay || xong || daHuy) return pSan;
      dangChay = true; const pr = ctx.resume();   // gọi ngay trong cú bấm
      return Promise.all([pSan, pr]).then(() => {
        if (daHuy) return;
        lenLich(); dangDung = false; khung.classList.remove('dung');
        raf = requestAnimationFrame(vong);
        tim = setInterval(() => { if (document.hidden && !dangDung && !xong) { const T = gioPhim(); khung1(T); if (T >= LICH.het + DUOI) vong(); } }, 250);
      });
    },
    dung() {
      if (!dangChay || dangDung || xong) return;
      dangDung = true; khung.classList.add('dung'); ctx.suspend().catch(() => {});
    },
    tiep() {
      if (!dangChay || !dangDung || xong) return;
      dangDung = false; khung.classList.remove('dung'); ctx.resume().catch(() => {});
      if (!raf) raf = requestAnimationFrame(vong);
    },
    huy() {
      if (daHuy) return; daHuy = true; dungVong();
      for (const s of nguon) { try { s.stop(); } catch (e) { /* đã dừng */ } }
      try { ctx.close(); } catch (e) { /* bỏ qua */ }
      if (ro) ro.disconnect(); else window.removeEventListener('resize', coGian);
      khung.remove();
    },
    canh: () => canhHien,
    _gio: gioPhim,   // chỉ để kiểm thử
    _ve: (T) => { if (!dangChay) khung1(T); },   // chỉ để kiểm thử: vẽ khung hình ở giây T (khi chưa chạy)
    _lich: LICH,
  };
  return api;
}
