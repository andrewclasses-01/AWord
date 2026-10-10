// Phim hoạt hình "Tom's Sunday Picnic" — bài kiểm tra TRÍ NHỚ (lớp 3–4).
// Chỉ HTML/SVG/CSS/JS + giọng thầy Andrew (mp3 từng câu) + nhạc nền Incompetech + tiếng động tổng hợp bằng WebAudio.
// Dùng: import { taoPhim } from './phim/phim.js';
//   const p = taoPhim(khung, { tu: 0, onCanh(i){}, onXong(){} });
//   await p.san();            // tải xong mọi mp3
//   nút.onclick = () => p.chay();   // PHẢI gọi từ cú bấm (để trình duyệt cho phát tiếng)
//   p.dung() / p.tiep()       // tạm dừng khi ẩn tab / chạy tiếp
//   p.huy()                   // dừng hẳn + dọn
// KHÔNG có nút điều khiển nào trên phim (không tua, không dừng, không bỏ qua).
import { GIONG } from './du-lieu.js';

export const SO_CANH = 12;
const DUOI = 1.5;                 // màn kết "The End" sau cảnh cuối (giây)
const NHAC_TEN = 'Wallpaper';
const NHAC_GHI_CONG = 'Music: "Wallpaper" — Kevin MacLeod (incompetech.com), CC BY 4.0';
const NHAC_TO = 0.16, NHAC_NHO = 0.06;   // nhạc khi không lời / khi đang đọc

const url = (p) => new URL(p, import.meta.url).href;

// ───────────────────────── tiện ích ─────────────────────────
const kep = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const tron = (x) => { x = kep(x); return x * x * (3 - 2 * x); };
const bat = (x) => { x = kep(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const noi = (a, b, x) => a + (b - a) * x;
const doan = (t, a, b) => tron((t - a) / (b - a));      // 0→1 mượt trong [a,b]
function dat(el, x, y, s = 1, lat = false, xoay = 0) {
  if (!el) return;
  el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})` + (xoay ? ` rotate(${xoay.toFixed(1)})` : '') + ` scale(${(lat ? -s : s).toFixed(3)} ${s.toFixed(3)})`);
}
function mo(el, o) { if (el) el.setAttribute('opacity', kep(o).toFixed(3)); }
// bong bóng/vật bật ra lúc a, tắt lúc b
function bung(el, x, y, t, a, b = 1e9, s = 1) {
  if (!el) return;
  const vao = t < a ? 0 : bat((t - a) / 0.35); const ra = t < b ? 1 : 1 - kep((t - b) / 0.3);
  const k = Math.max(0.001, vao * ra);
  dat(el, x, y, s * k); mo(el, t < a ? 0 : ra);
}
const lop = (el, ten, co) => { if (el) el.classList.toggle(ten, !!co); };

// ───────────────────────── màu ─────────────────────────
const VIEN = '#3b3049', DA = '#ffd9b8', MA = '#ffb4b4';
const DO_MU = '#e53935', VANG = '#ffd23f', NAU = '#a5642e', NAU_DAM = '#6e3c17', XANH_BALO = '#2f7ff0', XANH_CHIM = '#62d84e';
const SW = 'stroke="' + VIEN + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';

// ───────────────────────── nhân vật (gốc = giữa hai bàn chân) ─────────────────────────
function mat(cy, dx = 0) {
  return `<g class="chop"><ellipse cx="${-22 + dx}" cy="${cy}" rx="7.5" ry="9.5" fill="${VIEN}"/><ellipse cx="${24 + dx}" cy="${cy}" rx="7.5" ry="9.5" fill="${VIEN}"/>
  <circle cx="${-19.5 + dx}" cy="${cy - 3.5}" r="2.6" fill="#fff"/><circle cx="${26.5 + dx}" cy="${cy - 3.5}" r="2.6" fill="#fff"/></g>
  <ellipse cx="${-42 + dx}" cy="${cy + 22}" rx="12" ry="7" fill="${MA}" opacity=".8"/><ellipse cx="${46 + dx}" cy="${cy + 22}" rx="12" ry="7" fill="${MA}" opacity=".8"/>
  <path d="M${-16 + dx} ${cy + 28} Q${4 + dx} ${cy + 46} ${24 + dx} ${cy + 28}" fill="none" ${SW}/>`;
}
function chan(x, y, h, mau, giay, cls) {
  return `<g class="${cls}"><rect x="${x}" y="${y}" width="22" height="${h}" rx="11" fill="${mau}" ${SW}/>
  <ellipse cx="${x + 11 + 6}" cy="${y + h - 4}" rx="20" ry="10" fill="${giay}" ${SW}/></g>`;
}
function tay(x, y, mauAo, cls) {
  return `<g class="${cls}"><rect x="${x}" y="${y}" width="22" height="92" rx="11" fill="${mauAo}" ${SW}/>
  <circle cx="${x + 11}" cy="${y + 96}" r="13" fill="${DA}" ${SW}/></g>`;
}
function tom(k, o = {}) {
  const ao = '#ffffff', quan = '#5a6378';
  const balo = o.balo ? `<rect x="-64" y="-252" width="128" height="118" rx="26" fill="${XANH_BALO}" ${SW}/>` : '';
  const quai = o.balo ? `<rect x="-36" y="-252" width="14" height="70" rx="6" fill="${XANH_BALO}" ${SW}/><rect x="22" y="-252" width="14" height="70" rx="6" fill="${XANH_BALO}" ${SW}/>` : '';
  const chanH = o.ngoi
    ? `<g><rect x="-40" y="-40" width="34" height="34" rx="14" fill="${DA}" ${SW}/><rect x="6" y="-40" width="34" height="34" rx="14" fill="${DA}" ${SW}/>
       <ellipse cx="-23" cy="-8" rx="21" ry="12" fill="${VIEN}"/><ellipse cx="23" cy="-8" rx="21" ry="12" fill="${VIEN}"/></g>`
    : chan(-36, -118, 112, DA, VIEN, 'ca') + chan(14, -118, 112, DA, VIEN, 'cb');
  const dy = o.ngoi ? 95 : 0;
  return `<g data-k="${k}"><g class="nv"><g class="than">${chanH}<g transform="translate(0 ${dy})">
    ${balo}
    <rect x="-44" y="-162" width="88" height="56" rx="14" fill="${quan}" ${SW}/>
    ${tay(-72, -244, ao, 'ta')}${tay(50, -244, ao, 'tb')}
    <rect x="-52" y="-254" width="104" height="104" rx="32" fill="${ao}" ${SW}/>
    ${quai}
    <circle cx="-66" cy="-318" r="15" fill="${DA}" ${SW}/><circle cx="66" cy="-318" r="15" fill="${DA}" ${SW}/>
    <circle cx="0" cy="-318" r="68" fill="${DA}" ${SW}/>
    <path d="M-66 -330 Q-62 -300 -50 -296 L-48 -330 Z M66 -330 Q62 -300 50 -296 L48 -330 Z" fill="#4a2f1f"/>
    ${mat(-312)}
    <g class="mu"><path d="M-74 -328 Q-74 -408 0 -410 Q74 -408 74 -328 Z" fill="${DO_MU}" ${SW}/>
      <path d="M38 -334 Q118 -340 136 -322 Q96 -310 34 -318 Z" fill="${DO_MU}" ${SW}/>
      <path d="M-30 -404 Q-18 -360 -22 -330 M30 -404 Q18 -360 22 -330" fill="none" stroke="#b71c1c" stroke-width="4" opacity=".55"/>
      <circle cx="0" cy="-411" r="9" fill="${DO_MU}" ${SW}/></g>
    ${o.them || ''}
  </g></g></g></g>`;
}
function mai(k, o = {}) {
  const toc = '#2a2238';
  const chanH = o.ngoi
    ? `<g><rect x="-38" y="-40" width="32" height="34" rx="14" fill="${DA}" ${SW}/><rect x="6" y="-40" width="32" height="34" rx="14" fill="${DA}" ${SW}/>
       <ellipse cx="-22" cy="-8" rx="19" ry="11" fill="${VIEN}"/><ellipse cx="22" cy="-8" rx="19" ry="11" fill="${VIEN}"/></g>`
    : chan(-32, -112, 106, DA, VIEN, 'ca') + chan(10, -112, 106, DA, VIEN, 'cb');
  const dy = o.ngoi ? 80 : 0;
  return `<g data-k="${k}"><g class="nv"><g class="than">${chanH}<g transform="translate(0 ${dy})">
    <circle cx="-80" cy="-300" r="30" fill="${toc}" ${SW}/><circle cx="80" cy="-300" r="30" fill="${toc}" ${SW}/>
    ${tay(-66, -236, DA, 'ta')}${tay(44, -236, DA, 'tb')}
    <g class="vay"><path d="M-34 -250 L34 -250 L84 -104 Q0 -88 -84 -104 Z" fill="${VANG}" ${SW}/>
      <path d="M-70 -122 Q0 -108 70 -122" fill="none" stroke="#e8a900" stroke-width="5"/>
      <circle cx="-42" cy="-236" r="20" fill="${VANG}" ${SW}/><circle cx="42" cy="-236" r="20" fill="${VANG}" ${SW}/></g>
    <circle cx="0" cy="-306" r="66" fill="${DA}" ${SW}/>
    <path d="M-68 -300 Q-74 -380 0 -378 Q74 -380 68 -300 Q56 -350 20 -348 Q0 -330 -24 -350 Q-58 -346 -68 -300 Z" fill="${toc}" ${SW}/>
    <circle cx="-62" cy="-322" r="7" fill="#fff" ${SW}/><circle cx="62" cy="-322" r="7" fill="#fff" ${SW}/>
    ${mat(-296)}
    ${o.them || ''}
  </g></g></g></g>`;
}
function max(k, o = {}) {
  const banh = `<g data-k="${k}-banh" opacity="0">${banhMi(0, 0, 0.55)}</g>`;
  const dy = o.ngoi ? 14 : 0;
  return `<g data-k="${k}"><g class="nv"><g class="than">
    <g class="duoi"><path d="M-96 -100 Q-130 -120 -138 -168" fill="none" stroke="${VIEN}" stroke-width="22" stroke-linecap="round"/>
      <path d="M-96 -100 Q-130 -120 -138 -168" fill="none" stroke="${NAU}" stroke-width="12" stroke-linecap="round"/></g>
    ${o.ngoi ? `<ellipse cx="-50" cy="-24" rx="40" ry="24" fill="${NAU}" ${SW}/>` : `<g class="ca"><rect x="-78" y="-80" width="24" height="76" rx="12" fill="${NAU}" ${SW}/></g><g class="cb"><rect x="-46" y="-80" width="24" height="76" rx="12" fill="${NAU_DAM}" ${SW}/></g>`}
    <g class="cb"><rect x="34" y="-80" width="24" height="76" rx="12" fill="${NAU_DAM}" ${SW}/></g><g class="ca"><rect x="62" y="-80" width="24" height="76" rx="12" fill="${NAU}" ${SW}/></g>
    <g transform="translate(0 ${dy})"><ellipse cx="-6" cy="-98" rx="102" ry="48" fill="${NAU}" ${SW}/>
    <g class="dau"><circle cx="92" cy="-150" r="52" fill="${NAU}" ${SW}/>
      <path d="M62 -192 Q30 -186 34 -132 Q50 -120 64 -146 Z" fill="${NAU_DAM}" ${SW}/>
      <ellipse cx="132" cy="-132" rx="34" ry="24" fill="#e0b07a" ${SW}/>
      <ellipse cx="160" cy="-140" rx="11" ry="9" fill="${VIEN}"/>
      <circle cx="102" cy="-164" r="8" fill="${VIEN}"/><circle cx="104.5" cy="-167" r="2.6" fill="#fff"/>
      <path d="M128 -116 Q140 -106 152 -116" fill="none" ${SW}/>
      <g data-k="${k}-luoi" opacity="${o.luoi ? 1 : 0}"><path d="M134 -112 Q140 -88 150 -112 Z" fill="#ff7b9c" ${SW}/></g>
      <g transform="translate(160 -112)">${banh}</g></g></g>
  </g></g></g>`;
}
function me(k) {
  const vay = '#a25ad6';
  return `<g data-k="${k}"><g class="nv"><g class="than">
    ${chan(-34, -100, 96, DA, VIEN, 'ca')}${chan(12, -100, 96, DA, VIEN, 'cb')}
    <circle cx="0" cy="-418" r="36" fill="#6b3e26" ${SW}/>
    <g class="ta"><rect x="-80" y="-310" width="24" height="120" rx="12" fill="${DA}" ${SW}/><circle cx="-68" cy="-186" r="14" fill="${DA}" ${SW}/></g>
    <g data-k="${k}-tayvay"><rect x="58" y="-310" width="24" height="120" rx="12" fill="${DA}" ${SW}/><circle cx="70" cy="-186" r="14" fill="${DA}" ${SW}/></g>
    <path d="M-40 -320 L40 -320 L96 -92 Q0 -76 -96 -92 Z" fill="${vay}" ${SW}/>
    <path d="M-24 -322 Q0 -296 24 -322" fill="#f2d6ff" ${SW}/>
    <circle cx="0" cy="-366" r="64" fill="${DA}" ${SW}/>
    <path d="M-66 -356 Q-70 -432 0 -432 Q70 -432 66 -356 Q50 -404 0 -400 Q-50 -404 -66 -356 Z" fill="#6b3e26" ${SW}/>
    ${mat(-356)}
  </g></g></g>`;
}
function vit(k) {
  return `<g data-k="${k}"><g class="nhunvit">
    <path d="M-70 -10 Q-80 -60 -20 -58 L30 -58 Q60 -70 70 -100 Q90 -110 96 -86 Q94 -40 70 -10 Z" fill="#fff" ${SW}/>
    <path d="M-40 -40 Q-10 -60 20 -38 Q-6 -24 -40 -40 Z" fill="#e8eef5" ${SW}/>
    <circle cx="72" cy="-112" r="30" fill="#fff" ${SW}/>
    <path d="M96 -112 L128 -104 Q120 -92 96 -96 Z" fill="#ff9d1c" ${SW}/>
    <circle cx="80" cy="-118" r="6" fill="${VIEN}"/>
    <path d="M-84 -8 L84 -8" stroke="#2e9bd6" stroke-width="8" stroke-linecap="round" opacity=".55"/>
  </g></g>`;
}
function chim(k) {
  return `<g data-k="${k}"><g class="nhunchim">
    <path d="M-44 0 L-84 -10 L-80 14 Z" fill="#3fa92f" ${SW}/>
    <ellipse cx="0" cy="0" rx="48" ry="38" fill="${XANH_CHIM}" ${SW}/>
    <ellipse cx="10" cy="12" rx="26" ry="18" fill="#c8f7b8"/>
    <g data-k="${k}-canh"><path d="M-22 -10 Q-6 -46 22 -10 Q0 6 -22 -10 Z" fill="#3fa92f" ${SW}/></g>
    <circle cx="34" cy="-30" r="28" fill="${XANH_CHIM}" ${SW}/>
    <path d="M58 -36 L82 -28 L58 -20 Z" fill="#ffb21c" ${SW}/>
    <circle cx="42" cy="-36" r="5.5" fill="${VIEN}"/><circle cx="43.5" cy="-38" r="1.8" fill="#fff"/>
    <path d="M-6 36 L-6 48 M12 36 L12 48" stroke="#ff9d1c" stroke-width="5" stroke-linecap="round"/>
  </g></g>`;
}
function banhMi(x, y, s = 1) {   // một chiếc bánh sandwich tam giác
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 40 L70 40 L0 -62 Z" fill="#d9a35f" ${SW}/>
    <path d="M-58 32 L58 32 L0 -50 Z" fill="#f7dca4"/>
    <path d="M-74 44 Q-60 30 -46 44 Q-32 30 -18 44 Q-4 30 10 44 Q24 30 38 44 Q52 30 66 44 L74 52 L-74 52 Z" fill="#6cc24a" ${SW}/>
    <rect x="-74" y="50" width="148" height="14" rx="6" fill="#f48fb1" ${SW}/>
    <path d="M-74 64 L74 64 L74 76 Q0 84 -74 76 Z" fill="#d9a35f" ${SW}/>
  </g>`;
}
function chaiNuoc(x, y, s = 1) {  // chai nước cam (gốc = đáy chai)
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-20" y="-250" width="40" height="30" rx="8" fill="#ffffff" ${SW}/>
    <path d="M-18 -222 L18 -222 L22 -180 Q60 -160 60 -120 L60 -16 Q60 0 44 0 L-44 0 Q-60 0 -60 -16 L-60 -120 Q-60 -160 -22 -180 Z" fill="#e9f6ff" ${SW}/>
    <path d="M-52 -130 L52 -130 L52 -18 Q52 -8 42 -8 L-42 -8 Q-52 -8 -52 -18 Z" fill="#ff9a1a"/>
    <rect x="-60" y="-112" width="120" height="58" rx="6" fill="#fff" ${SW}/>
    <circle cx="-38" cy="-83" r="13" fill="#ff8f00" ${SW}/><path d="M-38 -96 Q-32 -106 -24 -102" fill="none" stroke="#3fa92f" stroke-width="5" stroke-linecap="round"/>
    <text x="14" y="-73" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="27" text-anchor="middle" fill="${VIEN}">JUICE</text>
  </g>`;
}
function coc(x, y) { return `<g transform="translate(${x} ${y})"><path d="M-22 -50 L22 -50 L16 0 L-16 0 Z" fill="#e9f6ff" ${SW}/><path d="M-19 -32 L19 -32 L16 -4 L-16 -4 Z" fill="#ff9a1a"/></g>`; }

// ───────────────────────── phông nền ─────────────────────────
function may(k, x, y, s = 1, mau = '#fff') {
  return `<g data-k="${k}" transform="translate(${x} ${y}) scale(${s})"><path d="M-90 30 Q-120 30 -116 4 Q-112 -24 -80 -20 Q-70 -60 -26 -56 Q0 -90 40 -64 Q80 -76 90 -36 Q126 -34 120 0 Q118 30 86 30 Z" fill="${mau}" opacity=".95"/></g>`;
}
function troi(mau1 = '#9fdcff', mau2 = '#e9f8ff') {
  return `<defs><linearGradient id="gtroi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mau1}"/><stop offset="1" stop-color="${mau2}"/></linearGradient></defs>
  <rect x="0" y="0" width="1600" height="900" fill="url(#gtroi)"/>`;
}
function co(y = 690, mau = '#8fd46a') {
  return `<path d="M0 ${y} Q400 ${y - 40} 800 ${y} T1600 ${y} L1600 900 L0 900 Z" fill="${mau}"/>
  <path d="M0 ${y + 40} Q400 ${y + 10} 800 ${y + 40} T1600 ${y + 40} L1600 900 L0 900 Z" fill="#7cc657"/>`;
}
function bui(x, y, s = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-40" cy="0" r="40" fill="#6dbb4c"/><circle cx="10" cy="-20" r="50" fill="#79c95a"/><circle cx="60" cy="2" r="38" fill="#6dbb4c"/></g>`; }
function cay(x, y, s = 1, canh = false) {  // cây: gốc tại (x,y)
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-34 0 Q-26 -200 -20 -330 L20 -330 Q26 -200 34 0 Z" fill="#9a6a3c" ${SW}/>
    ${canh ? `<path d="M-14 -250 Q-150 -270 -330 -262" fill="none" stroke="${VIEN}" stroke-width="30" stroke-linecap="round"/><path d="M-14 -250 Q-150 -270 -330 -262" fill="none" stroke="#9a6a3c" stroke-width="18" stroke-linecap="round"/>` : ''}
    <circle cx="-110" cy="-400" r="120" fill="#46a843" ${SW}/><circle cx="110" cy="-400" r="120" fill="#46a843" ${SW}/>
    <circle cx="0" cy="-500" r="140" fill="#52b64d" ${SW}/><circle cx="0" cy="-370" r="110" fill="#52b64d"/>
  </g>`;
}
const SAO = (k, x, y, s = 1) => `<g data-k="${k}" opacity="0" transform="translate(${x} ${y})"><path d="M0 -${30 * s} L${8 * s} -${8 * s} L${30 * s} 0 L${8 * s} ${8 * s} L0 ${30 * s} L-${8 * s} ${8 * s} L-${30 * s} 0 L-${8 * s} -${8 * s} Z" fill="#fff6a8" stroke="#ffb300" stroke-width="3"/></g>`;
function bong(k, chu, w = 260, h = 100, duoi = 'trai', co = 54) {   // bong bóng lời (gốc = mũi nhọn)
  const dx = duoi === 'trai' ? 40 : -w + 40;
  return `<g data-k="${k}" opacity="0"><g transform="translate(${dx} ${-h - 30})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" ${SW}/>
    <path d="M${duoi === 'trai' ? 30 : w - 30} ${h - 3} L${duoi === 'trai' ? -40 : w + 40} ${h + 30} L${duoi === 'trai' ? 60 : w - 60} ${h - 3} Z" fill="#fff" ${SW}/>
    <rect x="${duoi === 'trai' ? 26 : w - 64}" y="${h - 8}" width="38" height="10" fill="#fff"/>
    <text x="${w / 2}" y="${h / 2 + co * 0.36}" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="${co}" text-anchor="middle" fill="${VIEN}">${chu}</text>
  </g></g>`;
}
function vongSang(k, x, y, r) { return `<g data-k="${k}" opacity="0" transform="translate(${x} ${y})"><circle r="${r}" fill="none" stroke="#fff36b" stroke-width="12" stroke-dasharray="18 16"/></g>`; }

// ───────────────────────── 12 cảnh ─────────────────────────
// kb = kịch bản: số = nghỉ (giây); 'c-k' = câu c-k; {s:'tên tiếng', o: lệch giây, w:[câu, chỉ số chữ], d: dài, giu: giây giữ lại}
const C = [];
// 1 — This is Tom.
C.push({
  kb: [1.5, '0-0', 0.5, '0-1', 0.9, '0-2', 1.3],
  ve: () => troi() + may('m1', 300, 150, 1) + may('m2', 1150, 110, 0.8) + co() + bui(150, 700, 1) + bui(1450, 700, 1.1) +
    `<g data-k="banh"><g transform="translate(0 0)">
      <rect x="-150" y="-20" width="300" height="24" rx="10" fill="#c58b55" ${SW}/><rect x="-120" y="0" width="22" height="90" fill="#c58b55" ${SW}/><rect x="98" y="0" width="22" height="90" fill="#c58b55" ${SW}/>
      <rect x="-125" y="-110" width="250" height="92" rx="20" fill="#ffc6dc" ${SW}/><path d="M-125 -84 Q-100 -60 -75 -84 Q-50 -60 -25 -84 Q0 -60 25 -84 Q50 -60 75 -84 Q100 -60 125 -84" fill="none" stroke="#fff" stroke-width="10"/>
      ${[-105, -75, -45, -15, 15, 45, 75, 105].map((cx) => `<rect x="${cx - 6}" y="-160" width="12" height="52" rx="5" fill="#fff" ${SW}/><path d="M${cx} -194 Q${cx + 12} -176 ${cx} -166 Q${cx - 12} -176 ${cx} -194 Z" fill="#ffcf33" stroke="#ff9800" stroke-width="3" class="lua"/>`).join('')}
    </g></g>` + tom('tom') + vongSang('sang', 0, 0, 92) + SAO('s1', 0, 0) + SAO('s2', 0, 0, 0.7),
  len(t, M, D, W, e) {
    const x = noi(-200, 620, doan(t, 0, 2.2)); dat(e.tom, x, 700, 0.85); lop(e.tom, 'di', t < 2.2);
    bung(e.banh, 1120, 590, t, W('0-1', 'eight'), 1e9, 1);
    const tc = W('0-2', 'red'); bung(e.sang, x + 6, 700 - 0.85 * 372, t, tc, 1e9, 1);
    bung(e.s1, x - 90, 700 - 0.85 * 420, t, tc + 0.15); bung(e.s2, x + 120, 700 - 0.85 * 380, t, tc + 0.3);
    const nay = t > tc && t < tc + 1.2 ? Math.sin((t - tc) * 10) * 10 * (1 - (t - tc) / 1.2) : 0;
    e.tom.querySelector('.mu').setAttribute('transform', `translate(0 ${-Math.abs(nay)})`);
    dat(e.m1, 300 + t * 6, 150); dat(e.m2, 1150 - t * 4, 110, 0.8);
  },
});
// 2 — This is Mai.
C.push({
  kb: [1.4, '1-0', 0.5, '1-1', 0.8, '1-2', 1.3],
  ve: () => troi() + may('m1', 380, 140, 0.9) + may('m2', 1250, 120, 0.8) + co() + bui(1460, 700, 1.1) + bui(120, 700, 0.9) +
    tom('tom') + mai('mai') + `<g data-k="tim" opacity="0"><path d="M0 30 C-60 -10 -40 -60 0 -30 C40 -60 60 -10 0 30 Z" fill="#ff6b8b" ${SW}/></g>` +
    SAO('s1', 0, 0) + SAO('s2', 0, 0, 0.8) + SAO('s3', 0, 0, 0.6),
  len(t, M, D, W, e) {
    dat(e.tom, 470, 700, 0.85);
    const x = noi(1800, 980, doan(t, 0, 2.0)); dat(e.mai, x, 700, 0.85, false); lop(e.mai, 'di', t < 2.0);
    bung(e.tim, 725, 400, t, W('1-1', 'sister'), M['1-2'] + 0.2);
    const tv = W('1-2', 'yellow');
    const xoay = t > tv && t < tv + 1.6 ? Math.sin((t - tv) * 9) * (1 - (t - tv) / 1.6) : 0;
    const vay = e.mai.querySelector('.vay'); vay.setAttribute('transform', `translate(0 -170) scale(${(1 + 0.12 * Math.abs(xoay)).toFixed(3)} 1) translate(0 170)`);
    bung(e.s1, x - 110, 560, t, tv); bung(e.s2, x + 110, 590, t, tv + 0.2); bung(e.s3, x + 80, 470, t, tv + 0.4);
    dat(e.m1, 380 + t * 6, 140, 0.9); dat(e.m2, 1250 - t * 5, 120, 0.8);
  },
});
// 3 — Max the dog.
C.push({
  kb: [0.9, '2-0', 0.4, '2-1', 0.4, '2-2', 0.5, '2-3', { s: 'woof', o: 0.25 }, { s: 'woof', o: 0.75 }, 1.6],
  ve: () => troi() + may('m1', 260, 160, 0.9) + may('m2', 1100, 120, 1) + co() + bui(1480, 700, 1) +
    tom('tom') + mai('mai') + max('max') + vongSang('sang', 0, 0, 150) + bong('gau', 'Woof! Woof!', 330, 100, 'trai', 50) + SAO('s1', 0, 0) + SAO('s2', 0, 0, 0.7),
  len(t, M, D, W, e) {
    dat(e.tom, 360, 700, 0.85); dat(e.mai, 640, 700, 0.85);
    const x = noi(1850, 1080, doan(t, 0.2, 2.6)); const chay = t < 2.6;
    const tw = M['2-3'] + 0.2; const nhay = t > tw && t < tw + 1.6 ? Math.abs(Math.sin((t - tw) * 7.9)) * 60 : 0;
    dat(e.max, x, 700 - nhay, 1.05, true); lop(e.max, 'di', chay); lop(e.max, 'chay', chay);
    const tb = W('2-2', 'brown'); bung(e.sang, x - 10, 590, t, tb, M['2-3']);
    bung(e.s1, x - 140, 520, t, tb + 0.1, M['2-3']); bung(e.s2, x + 120, 480, t, tb + 0.3, M['2-3']);
    bung(e.gau, x - 90, 480 - nhay, t, M['2-3'], D - 0.4);
    mo(e['max-luoi'], t > M['2-3'] ? 1 : 0);
    dat(e.m1, 260 + t * 6, 160, 0.9); dat(e.m2, 1100 - t * 4, 120);
  },
});
// 4 — Sunday, hot sun, go to the park.
C.push({
  kb: [0.8, '3-0', 0.6, '3-1', 0.8, '3-2', 2.6],
  ve: () => troi('#8fd3ff', '#fff3d6') + may('m1', 760, 120, 0.8) + co() +
    `<g data-k="lich"><g transform="translate(0 0)">
      <rect x="-190" y="-170" width="380" height="360" rx="26" fill="#fff" ${SW}/>
      <path d="M-190 -144 Q-190 -170 -164 -170 L164 -170 Q190 -170 190 -144 L190 -60 L-190 -60 Z" fill="#7e57c2" ${SW}/>
      ${[-120, -60, 0, 60, 120].map((cx) => `<rect x="${cx - 8}" y="-196" width="16" height="50" rx="8" fill="#cfd5e3" ${SW}/>`).join('')}
      <text x="0" y="80" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="92" text-anchor="middle" fill="${VIEN}">SUNDAY</text>
      <path d="M-120 130 L120 130" stroke="#e3e6ef" stroke-width="8" stroke-linecap="round"/>
    </g></g>
    <g data-k="mattroi"><g class="xoay"><g>${Array.from({ length: 12 }, (_, i) => `<rect x="-12" y="-190" width="24" height="60" rx="12" fill="#ffb300" transform="rotate(${i * 30})"/>`).join('')}</g></g>
      <circle r="115" fill="#ffd23f" stroke="#ffb300" stroke-width="8"/>
      <ellipse cx="-38" cy="-12" rx="10" ry="13" fill="${VIEN}"/><ellipse cx="38" cy="-12" rx="10" ry="13" fill="${VIEN}"/>
      <ellipse cx="-62" cy="22" rx="16" ry="9" fill="#ff9a6b" opacity=".8"/><ellipse cx="62" cy="22" rx="16" ry="9" fill="#ff9a6b" opacity=".8"/>
      <path d="M-30 30 Q0 58 30 30" fill="none" ${SW}/></g>
    <g data-k="nong" opacity="0">${[0, 1, 2].map((i) => `<path d="M${-60 + i * 60} 0 q15 -20 0 -40 q-15 -20 0 -40 q15 -20 0 -40" fill="none" stroke="#ff9800" stroke-width="7" stroke-linecap="round" opacity=".7"/>`).join('')}</g>
    <g data-k="congvien"><g transform="translate(0 0)"><rect x="-10" y="-200" width="20" height="200" fill="#9a6a3c" ${SW}/>
      <rect x="-120" y="-250" width="240" height="90" rx="18" fill="#c58b55" ${SW}/>
      <text x="0" y="-188" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="62" text-anchor="middle" fill="#fff">PARK</text></g></g>
    ${cay(1500, 700, 0.55)}` + max('max') + mai('mai') + tom('tom', { balo: true }),
  len(t, M, D, W, e) {
    const lv = bat((t - 0.1) / 0.8); dat(e.lich, noi(-300, 300, kep(lv, 0, 1.2)), 300, 1);
    const ts = W('3-1', 'sun'); const ss = 0.75 + 0.35 * bat((t - ts) / 0.6) * (t > ts ? 1 : 0) + (t > ts ? 0.04 * Math.sin(t * 5) : 0);
    dat(e.mattroi, 1330, 190, ss); mo(e.nong, t > ts + 0.4 ? 1 : 0); dat(e.nong, 1330, 470 + ((t * 30) % 20), 1);
    const tg = M['3-2'] + 0.6; const p = doan(t, tg, D - 0.3); const di = t > tg && t < D - 0.3;
    dat(e.congvien, 1310, 700, 1);
    dat(e.tom, noi(620, 1700, p), 700, 0.72); dat(e.mai, noi(820, 1900, p), 700, 0.72); dat(e.max, noi(960, 2060, p), 700, 0.8);
    ['tom', 'mai', 'max'].forEach((k) => lop(e[k], 'di', di));
    dat(e.m1, 760 + t * 5, 120, 0.8);
  },
});
// 5 — blue backpack: 3 sandwiches + 1 bottle of orange juice.
C.push({
  kb: [0.7, '4-0', 0.8, '4-1',
    { s: 'pop', w: ['4-1', 'three'] }, { s: 'pop', w: ['4-1', 'three'], o: 0.45 }, { s: 'pop', w: ['4-1', 'three'], o: 0.9 }, { s: 'pop', w: ['4-1', 'bottle'] }, 2.6],
  ve: () => troi() + may('m1', 300, 120, 0.8) + co(720) + bui(1480, 720, 1) +
    tom('tom') +
    `<g data-k="balo"><g>
      <path d="M-120 -260 Q-150 -380 0 -390 Q150 -380 120 -260" fill="none" stroke="${VIEN}" stroke-width="26"/><path d="M-120 -260 Q-150 -380 0 -390 Q150 -380 120 -260" fill="none" stroke="#1f5fc4" stroke-width="14"/>
      <rect x="-150" y="-290" width="300" height="290" rx="50" fill="${XANH_BALO}" ${SW}/>
      <rect x="-100" y="-130" width="200" height="110" rx="26" fill="#1f66c9" ${SW}/>
      <rect x="-30" y="-110" width="60" height="16" rx="8" fill="#9cc8ff"/>
      <g data-k="nap"><path d="M-150 -240 Q-150 -300 -90 -300 L90 -300 Q150 -300 150 -240 L150 -200 Q0 -170 -150 -200 Z" fill="#2a70db" ${SW}/>
        <rect x="-16" y="-206" width="32" height="34" rx="8" fill="#ffd23f" ${SW}/></g>
    </g></g>
    ${vongSang('sang', 0, 0, 200)}
    <g data-k="b1">${banhMi(0, 0, 1)}</g><g data-k="b2">${banhMi(0, 0, 1)}</g><g data-k="b3">${banhMi(0, 0, 1)}</g><g data-k="chai">${chaiNuoc(0, 0, 1)}</g>`,
  len(t, M, D, W, e) {
    dat(e.tom, 260, 720, 0.95);
    const tb = W('4-0', 'blue'); const nay = t > tb && t < tb + 1 ? Math.abs(Math.sin((t - tb) * 9)) * 20 * (1 - (t - tb)) : 0;
    dat(e.balo, 860, 720 - nay, 1); bung(e.sang, 860, 570, t, tb, M['4-1'] + 0.3);
    const tm = M['4-1'] + 0.1; const a = -115 * bat((t - tm) / 0.6) * (t > tm ? 1 : 0);
    e.nap.setAttribute('transform', `rotate(${a.toFixed(1)} -150 -240)`);
    const t3 = W('4-1', 'three'); const tc = W('4-1', 'bottle');
    const ra = (el, a0, x, y, s) => {
      const p = kep((t - a0) / 0.55); if (t < a0) { mo(el, 0); return; }
      const xx = noi(860, x, tron(p)); const yy = noi(470, y, tron(p)) - Math.sin(p * Math.PI) * 140;
      dat(el, xx, yy, noi(0.3, s, tron(p))); mo(el, 1);
    };
    ra(e.b1, t3, 560, 230, 1.05); ra(e.b2, t3 + 0.45, 860, 200, 1.05); ra(e.b3, t3 + 0.9, 1160, 230, 1.05); ra(e.chai, tc, 1400, 420, 1.15);
    dat(e.m1, 300 + t * 5, 120, 0.8);
  },
});
// 6 — big lake, two ducks.
C.push({
  kb: [0.8, '5-0', 0.5, '5-1', 0.6, '5-2', { s: 'quack', o: 0.2 }, { s: 'quack', o: 0.75, p: 1.12 }, 1.6],
  ve: () => troi() + may('m1', 420, 130, 0.9) + may('m2', 1250, 100, 0.7) + co(600) + bui(1500, 610, 0.9) + bui(80, 610, 0.8) +
    `<ellipse cx="960" cy="640" rx="600" ry="150" fill="#5fc4f2" ${SW}/><ellipse cx="960" cy="650" rx="540" ry="118" fill="#7fd3f7"/>
     <g data-k="gon1"><ellipse rx="70" ry="10" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/></g><g data-k="gon2"><ellipse rx="70" ry="10" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/></g>` +
    vit('v1') + vit('v2') + tom('tom', { balo: true }) + mai('mai') + max('max') +
    bong('q1', 'Quack!', 220, 90, 'trai', 48) + bong('q2', 'Quack!', 220, 90, 'phai', 48),
  len(t, M, D, W, e) {
    dat(e.tom, 240, 770, 0.62); dat(e.mai, 375, 770, 0.62); dat(e.max, 40, 770, 0.62);
    const sang = (k) => (t > W('5-1', 'two') && t < W('5-1', 'two') + 1.4 ? 1 + 0.15 * Math.abs(Math.sin((t - W('5-1', 'two')) * 7)) : 1);
    const x1 = 820 + 170 * Math.sin(t * 0.45); const x2 = 1180 + 140 * Math.sin(t * 0.45 + 2.2);
    const v1 = Math.cos(t * 0.45) > 0; const v2 = Math.cos(t * 0.45 + 2.2) > 0;
    dat(e.v1, x1, 650, 1.05 * sang(), !v1); dat(e.v2, x2, 690, 1.05 * sang(), !v2);
    dat(e.gon1, x1, 652, 1 + 0.3 * ((t * 0.8) % 1)); mo(e.gon1, 1 - ((t * 0.8) % 1));
    dat(e.gon2, x2, 692, 1 + 0.3 * ((t * 0.8 + 0.5) % 1)); mo(e.gon2, 1 - ((t * 0.8 + 0.5) % 1));
    const tq = M['5-2']; bung(e.q1, x1 + 60, 520, t, tq + 0.2, D - 0.3); bung(e.q2, x2 - 60, 560, t, tq + 0.75, D - 0.3);
    dat(e.m1, 420 + t * 6, 130, 0.9); dat(e.m2, 1250 - t * 4, 100, 0.7);
  },
});
// 7 — green bird in a tree.
C.push({
  kb: [0.9, '6-0', 0.5, '6-1', 0.6, '6-2', { s: 'tweet', o: 0.2 }, { s: 'tweet', o: 0.8 }, 1.6],
  ve: () => troi() + may('m1', 380, 130, 0.9) + co() + cay(1280, 700, 1, true) +
    chim('chim') + vongSang('sang', 0, 0, 90) + tom('tom', { balo: true }) + mai('mai') + max('max') +
    `<g data-k="not" opacity="0"><text x="0" y="0" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="70" fill="${VIEN}">♪</text><text x="50" y="-40" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="56" fill="${VIEN}">♫</text></g>` +
    bong('tw', 'Tweet! Tweet!', 340, 96, 'phai', 50),
  len(t, M, D, W, e) {
    dat(e.tom, 330, 700, 0.8); dat(e.max, 130, 700, 0.85); dat(e.mai, 640, 700, 0.85);
    const ta = e.mai.querySelector('.tb'); ta.setAttribute('transform', `rotate(${(-140 * doan(t, M['6-0'] + 0.4, M['6-0'] + 0.9)).toFixed(1)})`);
    const p = doan(t, 0.1, M['6-0'] + 0.4); const bx = noi(200, 960, p), by = noi(-80, 432, p) - Math.sin(p * Math.PI) * 60;
    const tw = M['6-2']; const hop = t > tw && t < D ? Math.abs(Math.sin((t - tw) * 6)) * 22 : 0;
    dat(e.chim, bx, by - hop, 1.35, false); mo(e.chim, 1);
    e['chim-canh'].setAttribute('transform', p < 1 ? `rotate(${(Math.sin(t * 30) * 40).toFixed(1)} 0 -10)` : '');
    const tg = W('6-1', 'green'); bung(e.sang, 965, 425, t, tg, M['6-2'] + 0.2, 1);
    bung(e.not, 1010, 330 + ((t * 40) % 30), t, tw + 0.2, D - 0.3); bung(e.tw, 920, 360, t, tw + 0.1, D - 0.3);
    dat(e.m1, 380 + t * 6, 130, 0.9);
  },
});
// 8 — sit under the tree, eat & drink.
const picnic = () => troi() + may('m1', 300, 120, 0.8) + co() + cay(930, 660, 1.0) + bui(150, 700, 1) +
  `<path d="M560 640 L1360 640 L1440 770 L480 770 Z" fill="#fff" ${SW}/>
   ${Array.from({ length: 8 }, (_, i) => `<path d="M${560 + i * 100} 640 L${610 + i * 100} 640 L${590 + i * 120} 770 L${530 + i * 120} 770 Z" fill="#b68ee6" opacity=".75"/>`).join('')}
   <ellipse cx="1110" cy="712" rx="70" ry="18" fill="#fff" ${SW}/>`;
C.push({
  kb: [0.8, '7-0', 0.5, '7-1', { s: 'nhai', o: 0.2 }, 1.8],
  ve: () => picnic() + `<g data-k="dia">${banhMi(1110, 680, 0.5)}</g>` + chaiNuoc(1260, 735, 0.42) + coc(1310, 745) + coc(940, 745) +
    tom('tom', { ngoi: true }) + mai('mai', { ngoi: true }) + max('max', { ngoi: true }) +
    `<g data-k="bt">${banhMi(0, 0, 0.42)}</g><g data-k="bm">${banhMi(0, 0, 0.42)}</g>`,
  len(t, M, D, W, e) {
    dat(e.tom, 760, 735, 0.75); dat(e.mai, 1010, 735, 0.75); dat(e.max, 1440, 740, 0.75, true);
    const an = M['7-1']; const nhai = (o) => (t > an + o ? Math.max(0, Math.sin((t - an - o) * 4)) * 26 : 0);
    dat(e.bt, 760 + 78, 735 - 0.75 * 120 - nhai(0) * 1.6, 1); dat(e.bm, 1010 + 74, 735 - 0.75 * 110 - nhai(0.6) * 1.6, 1);
    dat(e.m1, 900 + t * 5, 120, 0.8);
  },
});
// 9 — Max takes a sandwich and runs away; Tom and Mai laugh.
C.push({
  kb: [0.7, '8-0', 0.4, '8-1', { s: 'whoosh', o: 0.6 }, 0.5, '8-2', { s: 'cuoi', o: 0.2 }, 1.6],
  ve: () => picnic() + `<g data-k="dia">${banhMi(1110, 680, 0.5)}</g>` + chaiNuoc(1260, 735, 0.42) + coc(1310, 745) + coc(940, 745) +
    tom('tom', { ngoi: true }) + mai('mai', { ngoi: true }) + max('max') +
    `<g data-k="bt">${banhMi(0, 0, 0.42)}</g><g data-k="bm">${banhMi(0, 0, 0.42)}</g>` +
    `<g data-k="bui" opacity="0">${[0, 1, 2].map((i) => `<circle cx="${-i * 50}" cy="${-i * 8}" r="${26 - i * 5}" fill="#e6dccb" ${SW}/>`).join('')}</g>` +
    bong('ohno', 'Oh no!', 240, 96, 'trai', 52) + bong('h1', 'Ha ha!', 220, 90, 'phai', 48) + bong('h2', 'Ha ha!', 220, 90, 'trai', 48),
  len(t, M, D, W, e) {
    const cuoi = t > M['8-2'] ? Math.abs(Math.sin((t - M['8-2']) * 8)) * 14 : 0;
    dat(e.tom, 760, 735 - cuoi, 0.75); dat(e.mai, 1010, 735 - cuoi * 0.8, 0.75);
    dat(e.bt, 838, 735 - 0.75 * 120 - cuoi, 1); dat(e.bm, 1084, 735 - 0.75 * 110 - cuoi * 0.8, 1);
    // Max đi tới đĩa, ngoạm bánh, rồi chạy vụt sang phải
    const tl = M['8-0'] + 0.2, tg = M['8-1'] + 0.3, tc = M['8-1'] + 0.7;
    let x = noi(1440, 1215, doan(t, tl, tg)); const lat = t < tc;
    if (t > tc) x = noi(1215, 2000, kep((t - tc) / 1.6) ** 1.6);
    dat(e.max, x, 745, 0.8, lat); lop(e.max, 'di', (t > tl && t < tg) || t > tc); lop(e.max, 'chay', t > tc);
    mo(e.dia, t < tg ? 1 : 0); mo(e['max-banh'], t >= tg ? 1 : 0); mo(e['max-luoi'], 0);
    mo(e.bui, t > tc && t < tc + 1.8 ? 1 : 0); dat(e.bui, x - 120, 735, 0.6 + 0.4 * ((t * 3) % 1));
    bung(e.ohno, 840, 420, t, M['8-0'], M['8-1'] + 0.2);
    bung(e.h1, 720, 470, t, M['8-2'] + 0.1, D - 0.2); bung(e.h2, 1050, 460, t, M['8-2'] + 0.4, D - 0.2);
    dat(e.m1, 900 + t * 5, 120, 0.8);
  },
});
// 10 — rain, run to the bus stop.
C.push({
  kb: [0.6, '9-0', { s: 'mua', o: 0, d: 'het' }, 0.6, '9-1', { s: 'splash', w: ['9-1', 0] }, { s: 'splash', w: ['9-1', 1] }, 0.6, '9-2', 2.4],
  ve: () => troi('#9fb3c8', '#dfe7ef') + `<rect data-k="toi" x="0" y="0" width="1600" height="900" fill="#55657a" opacity="0"/>` +
    may('m1', 300, 140, 1.3, '#8796ab') + may('m2', 800, 110, 1.5, '#7b8aa0') + may('m3', 1300, 150, 1.3, '#8796ab') + co(690, '#7fbf62') +
    `<g data-k="tram"><g><rect x="-10" y="-330" width="20" height="330" fill="#7a8494" ${SW}/>
      <rect x="-130" y="-420" width="260" height="96" rx="18" fill="#fff" ${SW}/>
      <text x="0" y="-356" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="54" text-anchor="middle" fill="${VIEN}">BUS STOP</text></g></g>` +
    `<g data-k="vung"><ellipse cx="560" cy="770" rx="110" ry="20" fill="#9fc6e6" ${SW}/><ellipse cx="1000" cy="790" rx="90" ry="16" fill="#9fc6e6" ${SW}/></g>` +
    `<g data-k="te" opacity="0">${[[560, 760], [1000, 780]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-40 0 L-70 -50 M0 -6 L0 -70 M40 0 L70 -50" stroke="#5aa9e6" stroke-width="9" stroke-linecap="round"/></g>`).join('')}</g>` +
    max('max') + mai('mai') + tom('tom', { balo: true }) +
    `<g data-k="mua" opacity="0">${Array.from({ length: 110 }, (_, i) => { const x = (i * 157) % 1700 - 50; const d = ((i * 37) % 70) / 100; return `<line class="giot" style="animation-delay:-${d}s" x1="${x}" y1="-40" x2="${x - 14}" y2="10" stroke="#e8f4ff" stroke-width="5" stroke-linecap="round"/>`; }).join('')}</g>` +
    bong('spl', 'Splash! Splash!', 380, 96, 'trai', 50),
  len(t, M, D, W, e) {
    const tr = M['9-0']; mo(e.toi, 0.35 * doan(t, tr - 0.5, tr + 1)); mo(e.mua, doan(t, tr + 0.2, tr + 1));
    dat(e.m1, 300 + t * 8, 140, 1.3); dat(e.m2, 800 - t * 5, 110, 1.5); dat(e.m3, 1300 + t * 4, 150, 1.3);
    const ts = M['9-1']; mo(e.te, t > ts && t < ts + 2 ? Math.abs(Math.sin((t - ts) * 4)) : 0);
    bung(e.spl, 620, 600, t, ts, M['9-2']);
    const tg = M['9-2'] + 0.4; const p = doan(t, tg, tg + 3); const chay = t > tg && t < tg + 3;
    dat(e.tram, 1420, 700, 1);
    dat(e.tom, noi(260, 1160, p), 700, 0.72); dat(e.mai, noi(110, 1290, p), 700, 0.72); dat(e.max, noi(-80, 1000, p), 700, 0.78);
    ['tom', 'mai', 'max'].forEach((k) => { lop(e[k], 'di', chay); lop(e[k], 'chay', chay); });
  },
});
// 11 — bus number seven.
C.push({
  kb: [{ s: 'xe', o: 0, d: 'het' }, 1.0, '10-0', { s: 'coi', o: 0.4 }, 0.8, '10-1', 0.3, { s: 'coi', o: 0.4 }, 3.2],
  ve: () => troi('#a8dcff', '#eef9ff') + may('m1', 400, 140, 0.9) + may('m2', 1200, 120, 0.8) +
    `<rect x="0" y="560" width="1600" height="340" fill="#8fd46a"/><rect x="0" y="640" width="1600" height="150" fill="#6f7685"/>
     ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 200 + 30}" y="708" width="110" height="14" rx="7" fill="#e9ecf2"/>`).join('')}` +
    `<g data-k="tram"><g><rect x="-10" y="-330" width="20" height="330" fill="#7a8494" ${SW}/><rect x="-130" y="-420" width="260" height="96" rx="18" fill="#fff" ${SW}/>
      <text x="0" y="-356" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="54" text-anchor="middle" fill="${VIEN}">BUS STOP</text></g></g>` +
    max('max') + mai('mai') + tom('tom', { balo: true }) +
    `<g data-k="xe"><g class="xenhun">
      <rect x="-380" y="-330" width="760" height="280" rx="46" fill="#fff6e3" ${SW}/>
      <rect x="-380" y="-150" width="760" height="40" fill="#7e57c2"/>
      <rect x="-380" y="-330" width="760" height="280" rx="46" fill="none" ${SW}/>
      ${[-330, -220, -110].map((x) => `<rect x="${x}" y="-290" width="90" height="100" rx="16" fill="#bfe3ff" ${SW}/>`).join('')}
      <g data-k="khach" opacity="0">
        <g transform="translate(-285 -205) scale(.33)"><circle cx="0" cy="-60" r="66" fill="${DA}" ${SW}/>${mat(-55)}<path d="M-72 -70 Q-72 -150 0 -152 Q72 -150 72 -70 Z" fill="${DO_MU}" ${SW}/></g>
        <g transform="translate(-175 -205) scale(.33)"><circle cx="-76" cy="-60" r="28" fill="#2a2238" ${SW}/><circle cx="76" cy="-60" r="28" fill="#2a2238" ${SW}/><circle cx="0" cy="-60" r="64" fill="${DA}" ${SW}/>${mat(-55)}<path d="M-66 -54 Q-72 -134 0 -132 Q72 -134 66 -54 Q56 -104 0 -100 Q-56 -104 -66 -54 Z" fill="#2a2238"/></g>
        <g transform="translate(-65 -215) scale(.42)"><circle cx="0" cy="-30" r="52" fill="${NAU}" ${SW}/><ellipse cx="36" cy="-14" rx="30" ry="20" fill="#e0b07a" ${SW}/><ellipse cx="62" cy="-20" rx="10" ry="8" fill="${VIEN}"/><circle cx="10" cy="-44" r="7" fill="${VIEN}"/><path d="M-30 -72 Q-60 -66 -56 -12 Q-40 0 -26 -26 Z" fill="${NAU_DAM}" ${SW}/></g>
      </g>
      <circle cx="90" cy="-235" r="78" fill="#fff" ${SW}/>
      <text x="90" y="-196" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="130" text-anchor="middle" fill="#d23d2d">7</text>
      <rect x="210" y="-300" width="150" height="170" rx="22" fill="#bfe3ff" ${SW}/>
      <rect x="230" y="-322" width="110" height="64" rx="14" fill="${VIEN}"/>
      <text x="285" y="-272" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="60" text-anchor="middle" fill="#ffd23f">7</text>
      <rect x="350" y="-110" width="40" height="36" rx="12" fill="#ffe27a" ${SW}/>
    </g>
    <g transform="translate(-230 -40)"><g class="banh"><circle r="56" fill="${VIEN}"/><circle r="24" fill="#d5d9e2"/><rect x="-5" y="-50" width="10" height="100" fill="#8c93a3"/></g></g>
    <g transform="translate(230 -40)"><g class="banh"><circle r="56" fill="${VIEN}"/><circle r="24" fill="#d5d9e2"/><rect x="-5" y="-50" width="10" height="100" fill="#8c93a3"/></g></g>
    </g>` + vongSang('sang', 0, 0, 100) + bong('bip', 'Beep! Beep!', 300, 92, 'phai', 48),
  len(t, M, D, W, e) {
    // xe chạy vào (0→2.6 s) dừng giữa màn, khách lên, rồi chạy đi cuối cảnh
    const tDi = D - 2.6; let x = noi(-500, 760, 1 - Math.pow(1 - kep(t / 2.6), 3));
    if (t > tDi) x = noi(760, 2200, Math.pow(kep((t - tDi) / 2.4), 2));
    dat(e.xe, x, 720, 1); lop(e.xe, 'chayxe', t < 2.6 || t > tDi);
    dat(e.tram, 1440, 640, 0.9);
    const tl = 2.8; const p = doan(t, tl, tl + 1.4); const len = t > tl + 1.4;
    dat(e.tom, noi(1260, 1120, p), 650, 0.6, p > 0 && p < 1); dat(e.mai, noi(1360, 1120, p), 650, 0.6, p > 0 && p < 1); dat(e.max, noi(1180, 1100, p), 650, 0.65, true);
    ['tom', 'mai', 'max'].forEach((k) => { lop(e[k], 'di', p > 0 && p < 1); mo(e[k], len ? 0 : 1 - doan(t, tl + 1.0, tl + 1.4)); });
    mo(e.khach, len ? 1 : 0);
    bung(e.sang, x + 90, 720 - 235, t, W('10-1', 'seven'), tDi);
    const tc1 = M['10-0'] + 0.4; bung(e.bip, x + 330, 420, t, tc1, tc1 + 1.3);
    dat(e.m1, 400 + t * 6, 140, 0.9); dat(e.m2, 1200 - t * 4, 120, 0.8);
  },
});
// 12 — Welcome home!
C.push({
  kb: [1.5, '11-0', 0.35, '11-1', 0.6, '11-2', 0.4, '11-3', { s: 'woof', o: 0.25 }, 1.6],
  ve: () => troi('#ffd9a8', '#fff3e0') + may('m1', 400, 130, 0.9) + co() +
    `<g transform="translate(1180 700)">
      <rect x="-300" y="-430" width="600" height="430" fill="#ffe3d6" ${SW}/>
      <path d="M-350 -420 L0 -640 L350 -420 Z" fill="#5c6b8a" ${SW}/>
      <rect x="-240" y="-330" width="130" height="120" rx="14" fill="#bfe3ff" ${SW}/><path d="M-175 -330 L-175 -210 M-240 -270 L-110 -270" stroke="${VIEN}" stroke-width="5"/>
      <rect x="-80" y="-300" width="170" height="300" rx="16" fill="#fff8e6" ${SW}/>
    </g>` + me('me') +
    `<g transform="translate(1180 700)"><g data-k="cua"><rect x="-80" y="-300" width="170" height="300" rx="16" fill="#b07a54" ${SW}/><circle cx="60" cy="-150" r="10" fill="#ffd23f" ${SW}/></g></g>` +
    tom('tom', { balo: true }) + mai('mai') + max('max') +
    bong('wh', 'Welcome home!', 420, 100, 'phai', 54) + bong('wf', 'Woof!', 200, 90, 'trai', 50) +
    `<g data-k="tim1" opacity="0"><path d="M0 30 C-60 -10 -40 -60 0 -30 C40 -60 60 -10 0 30 Z" fill="#ff6b8b" ${SW}/></g><g data-k="tim2" opacity="0"><path d="M0 30 C-60 -10 -40 -60 0 -30 C40 -60 60 -10 0 30 Z" fill="#ff6b8b" ${SW}/></g>`,
  len(t, M, D, W, e) {
    const mc = doan(t, 0.2, 1.0); e.cua.setAttribute('transform', `translate(-80 0) scale(${(1 - 0.85 * mc).toFixed(3)} 1) translate(80 0)`);
    dat(e.me, 1185, 690, 0.78); mo(e.me, mc);
    const vay = t > M['11-0'] ? Math.sin(t * 8) * 18 : 0; e['me-tayvay'].setAttribute('transform', `rotate(${(-150 + vay).toFixed(1)} 70 -305)`);
    const p = doan(t, 0, 2.2);
    dat(e.tom, noi(-200, 380, p), 700, 0.8); dat(e.mai, noi(-380, 600, p), 700, 0.8);
    ['tom', 'mai', 'max'].forEach((k) => lop(e[k], 'di', t < 2.2));
    const th = M['11-2'] + 0.2; const nhay = t > th ? Math.abs(Math.sin((t - th) * 7.5)) * 55 : 0;
    dat(e.max, noi(-520, 800, p), 700 - nhay, 0.85); mo(e['max-luoi'], t > th ? 1 : 0);
    bung(e.wh, 1120, 330, t, M['11-1'], D - 0.2);
    bung(e.tim1, 740, 470 - ((t * 60) % 80), t, th + 0.1, D); bung(e.tim2, 870, 430 - ((t * 60 + 40) % 80), t, th + 0.4, D, 0.7);
    bung(e.wf, 905, 540 - nhay, t, M['11-3'], D);
    dat(e.m1, 400 + t * 6, 130, 0.9);
  },
});

// ───────────────────────── lịch chạy (tính từ độ dài từng câu) ─────────────────────────
const CHU = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function xayLich() {
  const ds = []; let T = 0;
  C.forEach((c, i) => {
    let t = 0; const M = {}; const cau = []; const tieng = [];
    const W = (id, w) => { const g = GIONG.cau[id]; const k = typeof w === 'number' ? w : g.t.split(/\s+/).findIndex((x) => CHU(x) === w); return M[id] + (g.w[k] != null ? g.w[k] : 0); };
    for (const b of c.kb) {
      if (typeof b === 'number') t += b;
      else if (typeof b === 'string') { M[b] = t; cau.push({ id: b, a: t }); t += GIONG.cau[b].d; }
      else tieng.push({ s: b.s, a: (b.w ? W(b.w[0], b.w[1]) : t) + (b.o || 0), d: b.d, p: b.p });
    }
    for (const x of tieng) if (x.d === 'het') x.d = t - x.a;
    ds.push({ i, a: T, D: t, M, W, cau, tieng });
    T += t;
  });
  return { ds, het: T };
}
const LICH = xayLich();
export const TONG_GIAY = Math.round((LICH.het + DUOI) * 10) / 10;

// ───────────────────────── tiếng động (WebAudio) ─────────────────────────
function nhieu(ctx, giay) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * giay), ctx.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function bao(ctx, ra, w, a, peak, len, curve = 0.02) {
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(peak, w + a);
  g.gain.setTargetAtTime(0.0001, w + a + len * 0.4, curve + len * 0.2); g.connect(ra); return g;
}
const TIENG = {
  woof(ctx, ra, w) {
    for (const [o, f0] of [[0, 1], [0.27, 0.92]]) {
      const t = w + o; const os = ctx.createOscillator(); os.type = 'sawtooth';
      os.frequency.setValueAtTime(240 * f0, t); os.frequency.linearRampToValueAtTime(520 * f0, t + 0.035); os.frequency.exponentialRampToValueAtTime(170 * f0, t + 0.17);
      const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 1.2;
      const g = bao(ctx, ra, t, 0.012, 0.9, 0.16, 0.015); os.connect(lp).connect(g); os.start(t); os.stop(t + 0.35);
      const n = ctx.createBufferSource(); n.buffer = ctx._nhieu; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8;
      const g2 = bao(ctx, ra, t, 0.005, 0.35, 0.06, 0.01); n.connect(bp).connect(g2); n.start(t, Math.random()); n.stop(t + 0.2);
    }
  },
  quack(ctx, ra, w, p = 1) {
    for (const o of [0, 0.3]) {
      const t = w + o; const os = ctx.createOscillator(); os.type = 'sawtooth';
      os.frequency.setValueAtTime(330 * p, t); os.frequency.linearRampToValueAtTime(280 * p, t + 0.2);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 38; const lg = ctx.createGain(); lg.gain.value = 18; lfo.connect(lg).connect(os.frequency);
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.setValueAtTime(1300, t); f1.frequency.linearRampToValueAtTime(900, t + 0.2); f1.Q.value = 4;
      const g = bao(ctx, ra, t, 0.02, 1.6, 0.18, 0.02); os.connect(f1).connect(g); os.start(t); os.stop(t + 0.4); lfo.start(t); lfo.stop(t + 0.4);
    }
  },
  tweet(ctx, ra, w) {
    for (const o of [0, 0.13, 0.26, 0.5, 0.63]) {
      const t = w + o; const os = ctx.createOscillator(); os.type = 'sine';
      os.frequency.setValueAtTime(2600, t); os.frequency.exponentialRampToValueAtTime(4300, t + 0.05); os.frequency.exponentialRampToValueAtTime(3000, t + 0.09);
      const g = bao(ctx, ra, t, 0.008, 0.32, 0.07, 0.01); os.connect(g); os.start(t); os.stop(t + 0.2);
    }
  },
  pop(ctx, ra, w) {
    const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(500, w); os.frequency.exponentialRampToValueAtTime(1100, w + 0.08);
    const g = bao(ctx, ra, w, 0.005, 0.45, 0.08, 0.02); os.connect(g); os.start(w); os.stop(w + 0.3);
  },
  whoosh(ctx, ra, w, d = 0.6) {
    const n = ctx.createBufferSource(); n.buffer = ctx._nhieu; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(350, w); bp.frequency.exponentialRampToValueAtTime(2400, w + d * 0.5); bp.frequency.exponentialRampToValueAtTime(500, w + d);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(0.35, w + d * 0.45); g.gain.linearRampToValueAtTime(0.0001, w + d);
    n.connect(bp).connect(g).connect(ra); n.start(w, Math.random()); n.stop(w + d + 0.05);
  },
  nhe(ctx, ra, w) { TIENG.whoosh(ctx, ra, w, 0.5); },   // chuyển cảnh (nhỏ hơn: xem âm lượng bên dưới)
  nhai(ctx, ra, w) {
    for (let i = 0; i < 4; i++) {
      const t = w + i * 0.32; const n = ctx.createBufferSource(); n.buffer = ctx._nhieu; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 2;
      const g = bao(ctx, ra, t, 0.004, 0.18, 0.05, 0.01); n.connect(bp).connect(g); n.start(t, Math.random()); n.stop(t + 0.12);
    }
  },
  cuoi(ctx, ra, w) {   // tiếng "ha ha" vui (nốt đi xuống)
    [660, 590, 520, 470].forEach((f, i) => {
      const t = w + i * 0.16; const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.setValueAtTime(f, t); os.frequency.linearRampToValueAtTime(f * 0.9, t + 0.1);
      const g = bao(ctx, ra, t, 0.01, 0.25, 0.09, 0.02); os.connect(g); os.start(t); os.stop(t + 0.25);
    });
  },
  mua(ctx, ra, w, d) {
    const n = ctx.createBufferSource(); n.buffer = ctx._nhieu; n.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(0.22, w + 1.2); g.gain.setValueAtTime(0.22, w + d - 1.2); g.gain.linearRampToValueAtTime(0.0001, w + d + 0.3);
    n.connect(hp).connect(lp).connect(g).connect(ra); n.start(w); n.stop(w + d + 0.4);
    for (let i = 0; i < d * 7; i++) {   // giọt lộp độp
      const t = w + 0.8 + Math.random() * (d - 1); const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(1800 + Math.random() * 1600, t); os.frequency.exponentialRampToValueAtTime(700, t + 0.04);
      const gg = bao(ctx, ra, t, 0.002, 0.05, 0.03, 0.005); os.connect(gg); os.start(t); os.stop(t + 0.1);
    }
  },
  splash(ctx, ra, w) {
    const n = ctx.createBufferSource(); n.buffer = ctx._nhieu; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(2600, w); bp.frequency.exponentialRampToValueAtTime(450, w + 0.45);
    const g = bao(ctx, ra, w, 0.01, 0.9, 0.35, 0.03); n.connect(bp).connect(g); n.start(w, Math.random()); n.stop(w + 0.8);
    const os = ctx.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(300, w); os.frequency.exponentialRampToValueAtTime(90, w + 0.2);
    const g2 = bao(ctx, ra, w, 0.005, 0.35, 0.12, 0.02); os.connect(g2); os.start(w); os.stop(w + 0.4);
  },
  xe(ctx, ra, w, d) {   // tiếng máy xe buýt
    const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(48, w);
    os.frequency.linearRampToValueAtTime(38, w + 2.6); os.frequency.setValueAtTime(38, w + d - 2.8); os.frequency.linearRampToValueAtTime(62, w + d);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = 0.35; lfo.connect(lg);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(0.5, w + 1.2); g.gain.linearRampToValueAtTime(0.28, w + 2.8);
    g.gain.setValueAtTime(0.28, w + d - 2.8); g.gain.linearRampToValueAtTime(0.5, w + d - 1.4); g.gain.linearRampToValueAtTime(0.0001, w + d + 0.2);
    lg.connect(g.gain); os.connect(lp).connect(g).connect(ra); os.start(w); os.stop(w + d + 0.3); lfo.start(w); lfo.stop(w + d + 0.3);
  },
  coi(ctx, ra, w) {   // còi "bíp bíp"
    for (const o of [0, 0.42]) {
      const t = w + o;
      for (const f of [392, 494]) {
        const os = ctx.createOscillator(); os.type = 'square'; os.frequency.value = f;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.setValueAtTime(0.16, t + 0.28); g.gain.linearRampToValueAtTime(0.0001, t + 0.33);
        os.connect(lp).connect(g).connect(ra); os.start(t); os.stop(t + 0.4);
      }
    }
  },
};
const TO_TIENG = { woof: 0.9, quack: 0.8, tweet: 0.9, pop: 0.6, whoosh: 0.6, nhe: 0.22, nhai: 0.8, cuoi: 0.7, mua: 0.8, splash: 0.9, xe: 0.7, coi: 0.9 };

// ───────────────────────── CSS (một lần) ─────────────────────────
function napCss() {
  if (document.getElementById('phim-css')) return;
  const f = (w) => `@font-face{font-family:'Baloo 2';font-style:normal;font-weight:${w};font-display:swap;src:url(${url(`../../core/assets/fonts/baloo-2-${w}.woff2`)}) format('woff2')}`;
  const s = document.createElement('style'); s.id = 'phim-css';
  s.textContent = f(600) + f(700) + f(800) + `
.phim-khung{position:relative;width:100%;height:100%;overflow:hidden;background:#141020;user-select:none;-webkit-user-select:none;contain:strict}
.phim-san{position:absolute;left:50%;top:50%;width:1600px;height:900px;transform-origin:0 0;overflow:hidden;background:#bfe9ff;pointer-events:none}
.phim-lop{position:absolute;inset:0}.phim-lop svg{width:100%;height:100%;display:block}
.phim-phude{position:absolute;left:0;right:0;bottom:22px;margin:0 auto;width:fit-content;max-width:1500px;box-sizing:border-box;padding:10px 40px 14px;border-radius:44px;background:rgba(255,255,255,.93);
  box-shadow:0 8px 0 rgba(59,48,73,.18);border:5px solid #3b3049;font:800 62px/1.14 'Baloo 2',system-ui,sans-serif;color:#3b3049;text-align:center;white-space:normal;transition:opacity .25s;opacity:0}
.phim-phude.hien{opacity:1}
.phim-phude span{display:inline-block;padding:0 6px;border-radius:16px;color:#7a7389;transition:color .12s,background .12s,transform .12s}
.phim-phude span.da{color:#3b3049}
.phim-phude span.dang{color:#fff;background:#ff7a1a;transform:translateY(-3px) scale(1.06)}
.phim-ket{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,248,230,.9);opacity:0;transition:opacity .6s}
.phim-ket.hien{opacity:1}
.phim-ket b{font:800 150px/1 'Baloo 2',system-ui,sans-serif;color:#3b3049;text-shadow:0 8px 0 #ffd23f}
.phim-ket small{margin-top:40px;font:600 30px/1.3 'Baloo 2',system-ui,sans-serif;color:#5a5268}
.phim-san .ca,.phim-san .cb,.phim-san .ta,.phim-san .tb{transform-box:fill-box;transform-origin:50% 0}
.phim-san .di .ca{animation:pc-lac .42s ease-in-out infinite alternate}.phim-san .di .cb{animation:pc-lac .42s ease-in-out infinite alternate-reverse}
.phim-san .di .ta{animation:pc-lac2 .42s ease-in-out infinite alternate-reverse}.phim-san .di .tb{animation:pc-lac2 .42s ease-in-out infinite alternate}
.phim-san .di .than{animation:pc-nhun .21s ease-in-out infinite alternate}
.phim-san .chay .ca,.phim-san .chay .cb,.phim-san .chay .ta,.phim-san .chay .tb{animation-duration:.24s}.phim-san .chay .than{animation-duration:.12s}
.phim-san .nv{animation:pc-tho 2.6s ease-in-out infinite}
.phim-san .chop{transform-box:fill-box;transform-origin:50% 50%;animation:pc-chop 4.2s infinite}
.phim-san .duoi{transform-box:fill-box;transform-origin:0% 100%;animation:pc-vay .28s ease-in-out infinite alternate}
.phim-san .nhunvit{animation:pc-tho 1.8s ease-in-out infinite}.phim-san .nhunchim{animation:pc-tho 1.2s ease-in-out infinite}
.phim-san .xoay{animation:pc-xoay 18s linear infinite}
.phim-san .lua{transform-box:fill-box;transform-origin:50% 100%;animation:pc-lua .5s ease-in-out infinite alternate}
.phim-san .banh{animation:pc-xoay .9s linear infinite;animation-play-state:paused}
.phim-san .chayxe .banh{animation-play-state:running}.phim-san .chayxe .xenhun{animation:pc-nhun .2s ease-in-out infinite alternate}
.phim-san .giot{animation:pc-mua .7s linear infinite}
.phim-khung.dung *,.phim-khung.dung *::before{animation-play-state:paused!important}
@keyframes pc-lac{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}
@keyframes pc-lac2{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
@keyframes pc-nhun{from{transform:translateY(0)}to{transform:translateY(-8px)}}
@keyframes pc-tho{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pc-chop{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes pc-vay{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}
@keyframes pc-xoay{to{transform:rotate(360deg)}}
@keyframes pc-lua{from{transform:scale(.85,1)}to{transform:scale(1.1,1.12)}}
@keyframes pc-mua{from{transform:translate(0,-60px)}to{transform:translate(-90px,980px)}}
`;
  document.head.appendChild(s);
}

// ───────────────────────── trình phát ─────────────────────────
export function taoPhim(container, opts = {}) {
  napCss();
  const tu = Math.max(0, Math.min(SO_CANH - 1, opts.tu | 0));
  const khung = document.createElement('div'); khung.className = 'phim-khung';
  const san = document.createElement('div'); san.className = 'phim-san';
  const phude = document.createElement('div'); phude.className = 'phim-phude';
  const ket = document.createElement('div'); ket.className = 'phim-ket';
  ket.innerHTML = `<b>The End</b><small>${NHAC_GHI_CONG}</small>`;
  san.append(phude, ket); khung.append(san); container.appendChild(khung);
  // chặn mọi thao tác trên phim (không tua, không dừng)
  for (const ev of ['click', 'dblclick', 'contextmenu', 'pointerdown', 'keydown']) khung.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });

  const coGian = () => { const w = khung.clientWidth, h = khung.clientHeight; const k = Math.min(w / 1600, h / 900) || 0.001; san.style.transform = `scale(${k}) translate(-50%,-50%)`; };
  // scale trước rồi translate(-50%) theo khung 1600×900 ⇒ đặt tâm sân khấu đúng giữa khung
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(coGian) : null; ro ? ro.observe(khung) : window.addEventListener('resize', coGian); coGian();

  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC(); ctx._nhieu = nhieu(ctx, 2);
  const tong = ctx.createGain(); tong.gain.value = 1; tong.connect(ctx.destination);
  const kenhGiong = ctx.createGain(); kenhGiong.gain.value = 1; kenhGiong.connect(tong);
  const kenhNhac = ctx.createGain(); kenhNhac.gain.value = 0; kenhNhac.connect(tong);
  const kenhTieng = ctx.createGain(); kenhTieng.gain.value = 0.8; kenhTieng.connect(tong);
  const bo = {}; let nhacBuf = null;
  const taiMot = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return ctx.decodeAudioData(await r.arrayBuffer()); };
  const pSan = Promise.all([
    ...Object.keys(GIONG.cau).map(async (id) => { try { bo[id] = await taiMot(url('giong/' + id + '.mp3')); } catch (e) { console.warn('[phim] thiếu giọng', id, e); } }),
    (async () => { try { nhacBuf = await taiMot(url('nhac/wallpaper.mp3')); } catch (e) { console.warn('[phim] thiếu nhạc', e); } })(),
    (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("800 50px 'Baloo 2'"), document.fonts.load("600 30px 'Baloo 2'")]).catch(() => {}) : null,
  ]).then(() => true);

  let goc = null;           // film time = ctx.currentTime - goc
  let raf = 0, tim = 0, dangChay = false, dangDung = false, xong = false, daHuy = false;
  let canhHien = -1; let lopHien = null; const nguon = [];
  const batDau = LICH.ds[tu].a;
  const gioPhim = () => (goc == null ? batDau : Math.max(batDau, ctx.currentTime - goc));

  function dungLop(i) {
    const c = C[i]; const d = document.createElement('div'); d.className = 'phim-lop';
    d.innerHTML = `<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${c.ve()}</svg>`;
    const e = {}; d.querySelectorAll('[data-k]').forEach((x) => { e[x.getAttribute('data-k')] = x; });
    san.insertBefore(d, phude);
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
      if (lopHien) { const L = LICH.ds[SO_CANH - 1]; C[SO_CANH - 1].len(L.D, L.M, L.D, L.W, lopHien.e); }
      return;
    }
    let i = 0; while (i < SO_CANH - 1 && T >= LICH.ds[i + 1].a) i++;
    const L = LICH.ds[i]; const t = T - L.a;
    if (i !== canhHien) {
      const cu = lopHien; lopHien = dungLop(i); canhHien = i; lopHien.d.style.opacity = cu ? '0' : '1';
      lopHien.cu = cu; cauHien = undefined; veChu(null);
      try { opts.onCanh && opts.onCanh(i); } catch (e) { console.error(e); }
    }
    // chuyển cảnh mờ dần 0.6 s
    if (lopHien.cu) {
      const o = kep(t / 0.6); lopHien.d.style.opacity = String(o);
      if (o >= 1) { lopHien.cu.d.remove(); lopHien.cu = null; }
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

  function lenLich() {
    const g0 = ctx.currentTime + 0.12; goc = g0 - batDau;
    const at = (T) => goc + T;
    const phat = (buf, T, ra, toi = 0) => { if (!buf) return; const s = ctx.createBufferSource(); s.buffer = buf; s.connect(ra); s.start(Math.max(ctx.currentTime, at(T)), toi); nguon.push(s); };
    // giọng + nhạc né giọng
    const ng = kenhNhac.gain; ng.setValueAtTime(0, g0); ng.linearRampToValueAtTime(NHAC_TO, g0 + 1.2);
    for (const L of LICH.ds) {
      if (L.i < tu) continue;
      if (L.i > tu) TIENG.nhe(ctx, ganTo('nhe'), at(L.a));
      for (const c of L.cau) {
        const T = L.a + c.a; phat(bo[c.id], T, kenhGiong);
        const d = GIONG.cau[c.id].d;
        ng.setTargetAtTime(NHAC_NHO, Math.max(g0 + 1.3, at(T) - 0.15), 0.08);
        ng.setTargetAtTime(NHAC_TO, Math.max(g0 + 1.4, at(T + d) + 0.1), 0.45);
      }
      for (const x of L.tieng) { const w = at(L.a + x.a); if (w < ctx.currentTime) continue; TIENG[x.s](ctx, ganTo(x.s), w, x.d != null ? x.d : x.p); }
    }
    ng.setTargetAtTime(0.0001, at(LICH.het - 0.6), 0.5);
    if (nhacBuf) {
      const s = ctx.createBufferSource(); s.buffer = nhacBuf; s.loop = true;
      s.loopStart = 0.7; s.loopEnd = Math.max(5, nhacBuf.duration - 3.6);
      const vong = s.loopEnd - s.loopStart; const off = s.loopStart + (batDau % vong);
      s.connect(kenhNhac); s.start(g0, off); s.stop(at(LICH.het + DUOI + 0.5)); nguon.push(s);
    }
  }
  function ganTo(ten) { const g = ctx.createGain(); g.gain.value = TO_TIENG[ten] != null ? TO_TIENG[ten] : 0.7; g.connect(kenhTieng); return g; }

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
