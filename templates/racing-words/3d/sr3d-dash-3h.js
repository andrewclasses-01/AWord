// SPEED RUN mẫu 3h — = sr3d-dash-3g.js + thầy chọn trong thiet-ke-vo-lang-ateam.html (15/10): KIỂU A "LED đặc" chữ nhỏ hơn bản phác một chút (13 → 11),
//   góc nối đáy phẳng ↔ cung BO TRÒN (ngoài 12, trong 8 — cung bo tiếp xúc chính xác cả đường thẳng và cung lớn). id chữ ATEAM mang tiền tố "srwg" để lõi đổi id theo đội.
// ---- gốc 3g ----
// SPEED RUN mẫu 3g — = sr3d-dash-3e.js + VÔ LĂNG ĐÁY PHẲNG (vành chữ D, 3 chấu, mặt hub viền bạc) theo ảnh Thrustmaster T248 thầy gửi 15/10/2026.
// SPEED RUN mẫu 3e — HÌNH VẼ TAP-LÔ DÙNG CHUNG cho màn lớn và iPad (15/10/2026), thay sr3d-dash-3d.js. Thầy (15/10):
//   · VỆT SÁNG tay vô lăng làm lại: dải sáng MỀM, viền nhoè, bề ngang ≈ 2/3 độ dày vành (vành 22 ⇒ lõi 14,5), 2 đầu mờ dần; màu ĐỘI (đội 1 xanh dương,
//     đội 2 cam) + 1 đường bóng nhạt ở giữa cho mềm; quầng rất nhẹ quanh.
//   · Bàn đạp: GA dài lên phía trên (thanh kim loại chỉ còn ~1/3), PHANH dài hơn chút; cả 2 HẸP hơn (viewBox 60 × 150, mặt đạp rộng 52).
//   · Nút tên lửa: 2 ô (.sr-slot) chứa 2 quả SONG SONG — chính quả trong ô bay lên khi bắn, quả mới từ dưới nạp lên (lõi điều khiển).

// vành chữ D có BO GÓC: cung lớn R + đoạn phẳng y = yf + cung bo f tiếp xúc cả hai (tâm bo cách tâm vô lăng R − f)
function dRim(R, yf, f) {
  const C = 100, d = Math.sqrt((R - f) ** 2 - (yf - f - C) ** 2), k = R / (R - f);
  const cL = [C - d, yf - f], cR = [C + d, yf - f], tL = [C + (cL[0] - C) * k, C + (cL[1] - C) * k], tR = [C + (cR[0] - C) * k, C + (cR[1] - C) * k];
  const p = v => v.map(n => n.toFixed(2)).join(" ");
  return `M${p([C - d, yf])} L${p([C + d, yf])} A${f} ${f} 0 0 0 ${p(tR)} A${R} ${R} 0 1 0 ${p(tL)} A${f} ${f} 0 0 0 ${p([C - d, yf])} Z`;
}
const RIM_O = dRim(92, 170, 12), RIM_I = dRim(70, 146, 8);
const AT = `x="100" y="158.6" text-anchor="middle" dominant-baseline="central" font-family="Exo 2" font-style="italic" font-weight="900" font-size="11" letter-spacing="2.3"`;
const P = (a, r) => [(100 + r * Math.cos(a)).toFixed(1), (100 + r * Math.sin(a)).toFixed(1)];
const arc = (a0, a1, r) => { const [x0, y0] = P(a0, r), [x1, y1] = P(a1, r); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; };
const R = 81, LA = arc(Math.PI * .75, Math.PI * 1.25, R), RA = arc(-Math.PI * .25, Math.PI * .25, R);
const Y0 = 100 - R * Math.SQRT1_2 - 4, Y1 = 100 + R * Math.SQRT1_2 + 4;
const grad = (id, col, peak) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${Y0}" x2="0" y2="${Y1}">
    <stop offset="0" style="stop-color:${col};stop-opacity:0"/><stop offset=".22" style="stop-color:${col};stop-opacity:${peak * .7}"/>
    <stop offset=".5" style="stop-color:${col};stop-opacity:${peak}"/><stop offset=".78" style="stop-color:${col};stop-opacity:${peak * .7}"/><stop offset="1" style="stop-color:${col};stop-opacity:0"/></linearGradient>`;
const GLOW = d => `<g class="wg ${d === LA ? "wl" : "wr"}">
    <path d="${d}" fill="none" stroke="url(#srwgh)" stroke-width="24" filter="url(#srwgb6)"/>
    <path d="${d}" fill="none" stroke="url(#srwgc)" stroke-width="14.5" filter="url(#srwgb2)"/>
    <path d="${d}" fill="none" stroke="url(#srwgw)" stroke-width="4.5" filter="url(#srwgb2)"/></g>`;
export const WHEEL_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true" overflow="visible">
  <defs><linearGradient id="srwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f48"/><stop offset=".5" stop-color="#16191e"/><stop offset="1" stop-color="#0b0d10"/></linearGradient>
    ${grad("srwgh", "var(--team)", 0.38)}${grad("srwgc", "var(--team)", 1)}${grad("srwgw", "color-mix(in srgb, var(--team) 35%, white)", 0.75)}
    <filter id="srwgb6" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="srwgb2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>
  <!-- 3g: vành chữ D (ĐÁY PHẲNG) kiểu Thrustmaster T248 — mép trên tròn r 92, đáy phẳng y 170; lỗ trong r 70, đáy phẳng y 146 -->
  <path d="${RIM_O} ${RIM_I}" fill="url(#srwg)" fill-rule="evenodd" stroke="#4a515c" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="${RIM_I}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1.2"/>
  ${GLOW(LA)}${GLOW(RA)}
  <path d="M93 8.3 h14 v20 h-14 Z" fill="var(--team)"/>
  <!-- 3 chấu: trái, phải (ngang) + dưới (xuống đáy phẳng), mặt hub viền bạc quanh màn hình -->
  <path d="M23 92 L48 86 L48 130 L27 136 Q22 114 23 92 Z" fill="#1a1d22" stroke="#3a414b" stroke-width="1.2"/>
  <path d="M177 92 L152 86 L152 130 L173 136 Q178 114 177 92 Z" fill="#1a1d22" stroke="#3a414b" stroke-width="1.2"/>
  <path d="M24 93 L47 87.5" stroke="#aeb6c0" stroke-width="1.6" stroke-linecap="round"/><path d="M176 93 L153 87.5" stroke="#aeb6c0" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M78 122 L122 122 L128 146 L72 146 Z" fill="#1a1d22" stroke="#3a414b" stroke-width="1.2"/>
  <rect x="44" y="44" width="112" height="80" rx="14" fill="#121519" stroke="#9aa2ad" stroke-width="2"/>
  <rect x="47" y="47" width="106" height="74" rx="11" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
  <circle cx="34" cy="102" r="4.2" fill="#3b82f6"/><circle cx="35" cy="118" r="4.2" fill="#c8262b"/>
  <circle cx="166" cy="102" r="4.2" fill="#16a06a"/><circle cx="165" cy="118" r="4.2" fill="#e8b21c"/>
  <circle cx="100" cy="134" r="5" fill="var(--team)" stroke="#9aa2ad" stroke-width="1.2"/>
  <!-- 3h: chữ ATEAM LED màu đội trên đoạn phẳng (kiểu A: rãnh tối khắc chìm + chữ nghiêng đặc màu đội + lõi trắng nóng + quầng sáng) -->
  <defs><filter id="srwgat" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <rect x="66" y="151.6" width="68" height="14" rx="7" fill="#07090c" stroke="rgba(255,255,255,.08)" stroke-width=".8"/>
  <text ${AT} fill="var(--team)" filter="url(#srwgat)">ATEAM</text>
  <text ${AT} fill="color-mix(in srgb, var(--team) 35%, white)" opacity=".75">ATEAM</text>
</svg>`;

const ribs = (x, w, y0, y1, step, h) => { let s = ""; for (let y = y0; y <= y1; y += step) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#07080a"/><rect x="${x}" y="${y + h}" width="${w}" height="1" fill="rgba(255,255,255,.10)"/>`; return s; };
const DEFS = `<linearGradient id="srpm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5058"/><stop offset=".5" stop-color="#c3c9d1"/><stop offset="1" stop-color="#3e444c"/></linearGradient>
  <linearGradient id="srrub" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e3239"/><stop offset="1" stop-color="#121418"/></linearGradient>`;
const BRACKET = `<g class="fx"><rect x="17" y="0" width="26" height="9" rx="2" fill="#1d2025" stroke="#4d545e"/><rect x="22" y="7" width="16" height="9" rx="2" fill="url(#srpm)"/>
  <circle cx="30" cy="12" r="3.2" fill="#2a2e34" stroke="#9aa2ad" stroke-width="1.2"/></g>`;
const ARM = y1 => `<path d="M26.5 12 H33.5 L34.2 ${y1} H25.8 Z" fill="url(#srpm)"/>`;
const bolts = (y0, y1) => `<circle cx="10" cy="${y0}" r="1.7" fill="#8f97a2"/><circle cx="50" cy="${y0}" r="1.7" fill="#8f97a2"/><circle cx="10" cy="${y1}" r="1.7" fill="#8f97a2"/><circle cx="50" cy="${y1}" r="1.7" fill="#8f97a2"/>`;

// GA: thanh kim loại lộ ~16 (3d: ~50) ⇒ mặt đạp cao 115 · PHANH: mặt đạp cao 76 (3d: 60) · cả 2 rộng 52
export const GAS_SVG = `<svg viewBox="0 0 60 150" aria-hidden="true" class="sr-pedal-svg">
  <defs>${DEFS}<clipPath id="srgasclip"><rect x="4" y="30" width="52" height="116" rx="10"/></clipPath></defs>
  <g class="mv" style="transform-origin:30px 12px">
    ${ARM(36)}
    <rect x="4" y="30" width="52" height="116" rx="10" fill="url(#srrub)" stroke="url(#srpm)" stroke-width="2.4"/>
    <g clip-path="url(#srgasclip)"><rect class="sr-nfill" x="0" y="30" width="60" height="120"/></g>
    ${ribs(11, 38, 38, 136, 8, 3.4)}${bolts(37, 139)}
  </g>
  ${BRACKET}
</svg>`;
export const BRAKE_SVG = `<svg viewBox="0 0 60 150" aria-hidden="true" class="sr-pedal-svg">
  <defs>${DEFS}</defs>
  <g class="mv" style="transform-origin:30px 12px">
    ${ARM(58)}
    <rect x="4" y="52" width="52" height="78" rx="10" fill="url(#srrub)" stroke="#c43a32" stroke-width="2.4"/>
    ${ribs(11, 38, 60, 120, 8, 3.4)}${bolts(59, 123)}
  </g>
  ${BRACKET}
</svg>`;

const MS_PATH = `<path d="M12 1.2c1.15 1.05 1.75 2.6 1.75 4.4V15.6l2.35 2.6v2.2l-2.35-.95V20.6h-3.5v-1.15l-2.35.95v-2.2l2.35-2.6V5.6c0-1.8.6-3.35 1.75-4.4z" fill="currentColor"/><rect x="10.25" y="7.2" width="3.5" height="1.6" fill="rgba(0,0,0,.35)"/>`;
export const MS_ICON = `<svg viewBox="0 0 24 24">${MS_PATH}</svg>`;
const SLOT_ICON = `<svg viewBox="5 0 14 30">${MS_PATH}<path class="fl" d="M10.4 21 Q12 29.5 13.6 21 Z" fill="#ffb347"/></svg>`;     // 1 quả + lửa đuôi (lửa chỉ hiện khi bay)
export const FIRE_ICON = `<span class="sr-slot" data-s="0">${SLOT_ICON}</span><span class="sr-slot" data-s="1">${SLOT_ICON}</span>`;   // 2 ô SONG SONG
export const FLY_HTML = "";
export const reserveHTML = n => `${MS_ICON.repeat(Math.min(4, Math.max(0, n)))}${n > 4 ? `<b>+${n - 4}</b>` : ""}`;
