// TRAIN RUSH 1ax (18/10/2026) — thầy: "iPad vẫn giật, máy bay (khinh khí cầu) + hộp giật; có hộp rơi xuống đường rồi lại nảy lên; cảnh sau không cần
//   đẹp — một màu cam trơn". Thầy chốt: 30 khung, nền cam trơn, GIỮ ray + tà vẹt, bỏ khói, thùng rơi đất mờ dần. Đã làm:
//   (1) 30 khung/giây ĐÚNG NHỊP: 1av đặt 25 ⇒ ngưỡng 38 ms ⇒ màn 60 Hz chỉ vẽ mỗi 3 khung = 20 khung/giây (Chế độ nguồn điện thấp rAF 30 Hz ⇒ 15);
//       30 là ước của 60 / 120 / 30 Hz ⇒ mỗi khung cách đều.
//   (2) Nền = MỘT màu cam trơn tô cả canvas (canvas { alpha: false }) — bỏ trời chuyển màu, mặt trời, 2 lớp núi, bụi, xương rồng, đất chuyển màu,
//       nền đá, cỏ tiền cảnh. Giữ ray + tà vẹt (thấy tàu chạy). Bỏ khói ống khói.
//   (3) Khinh khí cầu: game gửi baseY + pha + đà đầu màn ⇒ iPad tự tính bập bềnh theo giờ game và đẩy tiếp đúng tốc độ riêng từng quả
//       (1av: bập bềnh nhảy bậc 30 lần/giây, 2 quả đầu màn bay nhanh hơn dự đoán ⇒ răng cưa).
//   (4) Thùng: NỘI SUY giữa 2 tin (trễ DELAY 0,08 s), toạ độ tính THEO TÀU (thùng nằm trên tàu dính tàu, không trễ). 1av ĐOÁN TIẾP theo trọng lực
//       không biết mặt đỡ ⇒ Wi-Fi khựng là thùng lún qua nóc toa/xuống đất rồi tin mới kéo NGƯỢC LÊN = "nảy"; còn kẹp ở nóc − 2 nên thùng dưới đất lơ lửng.
//   (5) Thùng LẠC (game gửi g = 2: không trên tàu, thấp hơn nóc toa): chỉ được đi XUỐNG, ghim mặt ray, chạm đất thì mờ dần 0,5 s rồi ẩn — game hất
//       thùng nằm trên ray sang lề (vy 2,4 + đi theo chiều sâu z): màn lớn thấy trượt ra lề, iPad 2D chỉ thấy phần NẢY LÊN ⇒ không vẽ phần đó.
//   (6) Bố cục chữ (wrapFit) nhớ lại theo (chữ, khung) — 1av dò cỡ chữ lại MỖI khung cho mỗi toa / thùng / quả. Xoá nhớ khi phông nạp xong.
//   (7) Kênh tr-padlink-1ax: tin trạng thái đi kênh không xếp hàng (1 gói rơi không chặn cả hàng); tin game mới (giờ game lùi > 2 s) ⇒ nhận lại từ đầu.
// TRAIN RUSH 1av (14/10/2026) — thầy: "iPad nóng — trên iPad không cần mượt" ⇒ GIẢM TẢI (đo AWord scratch/dot523-tr.html, khung 1024×768 ×2):
//   1as–1au vẽ lại cả màn 60 khung/giây ở độ nét ×2 (2048×1536) và mỗi khung TẠO LẠI ~17 gradient ⇒ ~17 ms/khung NGAY TRÊN MÁY TÍNH MẠNH
//   (ghi lệnh 2 ms, phần tô điểm ảnh 15,6 ms; bỏ gradient còn 9,7). Nay: (1) PAD_FPS = 25 khung/giây khi đang chơi, IDLE_FPS = 8 khi màn đứng
//   (chờ START / thẻ thông báo / chưa nối) — hoạt cảnh theo dt nên chỉ thưa khung, không chậm lại; (2) độ nét tối đa PR_MAX = 1,5 (Retina ×2 ⇒
//   ít hơn 44 % điểm ảnh); (3) gradient TẠO MỘT LẦN rồi dùng lại (D.lg / D.rg nhớ theo toạ độ + màu; khinh khí cầu vẽ quanh gốc toạ độ riêng
//   để gradient không đổi khi quả bập bềnh); (4) màn chọn đội 10 khung/giây. Giao diện y hệt 1au.
// TRAIN RUSH 1au (14/10/2026) — thầy: "iPad hiển thị được ít quá" ⇒ (1) THU NHỎ: bề ngang thấy VIS = 40 đơn vị (1as chỉ ~19 — khung chỉ khớp theo
//   chiều cao) ⇒ thấy toa đáp án đang chờ + nửa toa đáp án kế phía sau ở mép trái (cách 2 toa phụ ~18 đơn vị, đúng như màn lớn); bảng định nghĩa phủ kín hông toa (như màn lớn) để chữ đủ to; (2) toa chưa đầy ĐẦU TIÊN
//   (≈ giữa màn lớn = camX) đặt ở FOC = 46 % ⇒ từ mép phải (khinh khí cầu hiện ra) tới toa đó ~22 đơn vị (1as ~9) — kịp đọc chữ; (3) đoàn tàu vẽ Y HỆT
//   màn lớn (toa phụ, toa than…) và KHÔNG có khung vàng + mũi tên ▼ trên toa (thầy bỏ). Vùng trời dãn dọc cho khinh khí cầu to, cách nhau rõ.
// TRAIN RUSH 1as (14/10/2026) — = 1ar + LÀM MƯỢT CHỖ NỐI: tin mới tới mà vị trí đoán lệch vị trí đang vẽ ⇒ không nhảy, bù phần lệch rồi
//   tan dần trong ~0,12 s; Wi-Fi khựng tới 0,6 s vẫn đoán tiếp (1ar dừng ở 0,25 s ⇒ đứng hình rồi nhảy) (theo từng vật: máy quay, tàu, mỗi khinh khí cầu, mỗi thùng — game 1as gửi số hiệu thùng); game gửi 30 tin/giây.
// ---- 1ar (14/10/2026) — = 1aq + hết giật (ghi chú 1ar bên dưới). ---- 1aq: MÀN iPAD KIỂU A "MIỀN TÂY HOÀNG HÔN". Thầy duyệt bản phác thiet-ke-ipad-1aq.html (3 kiểu) ⇒ chọn A,
// dặn: bánh xe phải quay ĐÚNG CHIỀU (tàu chạy sang phải ⇒ bánh quay xuôi chiều kim đồng hồ).
//   • Cảnh 2D của RIÊNG đội mình: trời chiều + núi đỏ 2 lớp thị sai + bụi/xương rồng + đường ray tà vẹt + cỏ tiền cảnh; đầu máy hơi nước vẽ
//     chi tiết (nồi hơi, ống khói, đèn, gạt bò, buồng lái, bánh có nan + thanh truyền), toa than LV.n, toa hàng gỗ có bảng định nghĩa viền
//     màu đội, toa khách cửa sổ + người, khinh khí cầu vỏ vải màu đội + băng tên, thùng gỗ chéo; toa đang chờ sáng vàng + mũi tên ▼.
//   • Thanh đầu gỗ: huy hiệu đội · tên đội (Rye) · LEVEL k / n + thanh giờ · điểm đội bạn · điểm mình (bảng giấy).
//   • Thẻ thông báo kiểu bảng truy nã: chờ START, đếm 3-2-1, hết giờ OUT, kết thúc (2 điểm), iPad tắt, đội đã có iPad, chờ game…
//     Dải thông báo trên cảnh (không che quả): tàu đầy chờ đội kia · màn xong +thưởng giờ · màn kế.
//   • Vị trí ngang = vị trí THẾ GIỚI tính từ giữa màn lớn (camX) ⇒ canh thả trên iPad = canh trên màn lớn. Giữa 2 trạng thái iPad tự đẩy tiếp.
//   mountTrainPad(el, { signal, team, onLeave, onBack }) ⇒ { state, hits, tap(id), destroy() }
//   mountTrainChooser(el, { cur, onPick }) ⇒ { setBusy([b0, b1]), note(text), destroy() } — màn CHỌN ĐỘI cùng kiểu (AWord pad.html)
// ---- 1ar (14/10/2026) thầy thử iPad thật: "giật giật, hộp nằm trên tàu rồi vẫn giật 2 bên theo chiều ngang". Nguyên nhân (code, không phải hạ tầng):
//   (1) thùng vẽ ở vị trí của tin cuối, KHÔNG đẩy tiếp theo vận tốc, trong khi máy quay iPad đẩy tiếp ⇒ giữa 2 tin (50 ms) thùng trôi lùi
//       ~0,2 đơn vị (~12 px) rồi giật về ⇒ răng cưa 20 lần/giây; tin đến trễ (Wi-Fi) ⇒ giật mạnh hơn. Nay game gửi vận tốc thùng, iPad đẩy tiếp.
//   (2) mọi thứ đẩy tiếp tính từ LÚC TIN TỚI ⇒ tin tới không đều (Wi-Fi 30–150 ms) làm cả cảnh nhảy. Nay game gửi giờ game `t`, iPad ước giờ game
//       (đường bao trên của độ lệch giờ — tin tới sớm nhất = ít trễ nhất) ⇒ vị trí tính theo giờ game, không lệ thuộc lúc tin tới.
//   (3) bỏ shadowBlur (đắt trên Safari iPad) ở khung toa chờ; chạm 3 lần góc phải dưới ⇒ bảng đo: FPS · thời gian vẽ · nhịp tin · trễ mạng.
import { createPadClient } from "./tr-padlink-1ax.js";

const TEAM = [
  { name: "TEAM 1", main: "#d8392a", dark: "#7c1a10", env: ["#f2a092", "#d4513f", "#9a2b1f"], eng: "#8f1d14" },
  { name: "TEAM 2", main: "#2a72d8", dark: "#123d80", env: ["#a9c8f5", "#3f7fd6", "#1f4c94"], eng: "#1d3f7a" }];
const BW = 6.0, BH = 2.0, VIS = 40, FOC = 0.46;
const PAD_FPS = 30, IDLE_FPS = 8, CHOOSER_FPS = 10, PR_MAX = 1.5;   // 1ax: 25 ⇒ 30 (ước của 60/120/30 Hz — 25 thật ra chỉ ra 20 khung/giây)
const BG = "#ec9a5c", DELAY = 0.08;   // 1ax: nền cam trơn · thùng vẽ trễ 0,08 s (≈ 2,4 tin) để luôn có 2 tin kẹp hai bên mà nội suy   // 1av: giảm tải (iPad nóng)   // 1au: khinh khí cầu to hơn 1as (4,2 × 1,4) — khung thu nhỏ ⇒ chữ vẫn đọc rõ   // 1au: VIS bề ngang thấy (đơn vị) · FOC chỗ đặt camX (toa mở đầu tiên) tính từ trái
           // cỡ khinh khí cầu trên iPad (đơn vị thế giới) — to hơn màn lớn cho dễ đọc / dễ chạm
const CRW = 2.9 * 0.86, CR = 1.5 * 0.86;   // thùng (bp3d-1aq DUO_TS)

const CSS = `.trp { position: fixed; inset: 0; z-index: 1; background: #120c07; touch-action: none; user-select: none; -webkit-user-select: none; }
.trp-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
.trp-back { position: absolute; left: 10px; bottom: 10px; width: 46px; height: 46px; border-radius: 50%; border: 2px solid rgba(255,230,180,.7); background: rgba(62,34,15,.75); color: #ffe9b8; font: 800 26px "Baloo 2", system-ui, sans-serif; cursor: pointer; z-index: 2; }
.trp-back[hidden] { display: none; }`;
function ensureCss() {
  if (!document.getElementById("trp-css-1aq")) { const st = document.createElement("style"); st.id = "trp-css-1aq"; st.textContent = CSS; document.head.append(st); }
  if (![...document.querySelectorAll("link[href*='fonts.googleapis']")].some(l => /Rye/.test(l.href))) {   // phông Rye + Baloo 2 (trang iPad AWord chưa nạp Rye)
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Rye&display=swap"; document.head.append(l);
  }
}
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; } return `rgb(${r | 0},${g | 0},${b | 0})`; }
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

// bộ vẽ dùng chung (màn chơi + màn chọn đội)
function painter(ctx) {
  const GC = new Map();   // 1av: gradient dùng lại giữa các khung (khoá = toạ độ làm tròn + màu)
  const grad = (key, make) => { let g = GC.get(key); if (!g) { if (GC.size > 400) GC.clear(); g = make(); GC.set(key, g); } return g; };
  const WC = new Map();   // 1ax: bố cục chữ đã dò (khoá = chữ + khung + cỡ) — phông nạp xong thì đo lại
  try { document.fonts && document.fonts.addEventListener("loadingdone", () => WC.clear()); } catch (e) { /* */ }
  const D = {
    k: 1, W: 1024, H: 768,
    lg(x0, y0, x1, y1, stops) { return grad("l" + [x0, y0, x1, y1].map(Math.round).join(",") + stops.join(), () => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => g.addColorStop(p, c)); return g; }); },
    rg(x0, y0, r0, x1, y1, r1, stops) { return grad("r" + [x0, y0, r0, x1, y1, r1].map(Math.round).join(",") + stops.join(), () => { const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([p, c]) => g.addColorStop(p, c)); return g; }); },
    rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); },
    wrapFit(text, maxW, maxH, maxPx, minPx, weight = 800, font = "Baloo 2", lh = 1.05) {   // 1ax: nhớ kết quả (vẫn đặt ctx.font như bản dò — nơi gọi dựa vào đó)
      const key = text + "|" + [maxW, maxH, maxPx, minPx].map(v => Math.round(v * 2)).join(",") + "|" + weight + font + lh;
      let r = WC.get(key);
      if (!r) { if (WC.size > 600) WC.clear(); r = D.wrapFit0(text, maxW, maxH, maxPx, minPx, weight, font, lh); WC.set(key, r); }
      ctx.font = `${weight} ${r.px}px "${font}"`;
      return r;
    },
    wrapFit0(text, maxW, maxH, maxPx, minPx, weight = 800, font = "Baloo 2", lh = 1.05) {   // 1au: lh = khoảng dòng (Baloo cao chữ ~1,15 cỡ)
      const fit = px => { ctx.font = `${weight} ${px}px "${font}"`; const words = String(text).split(/\s+/), lines = []; let cur = "";
        for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
        if (cur) lines.push(cur); return lines; };
      for (let px = Math.round(maxPx); px >= minPx; px -= 1) { const lines = fit(px); if (lines.length * px * lh <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) return { lines, px, lh }; }
      return { lines: fit(minPx), px: minPx, lh };   // không vừa ⇒ vẫn NGẮT DÒNG ở cỡ nhỏ nhất
    },
    lines(f, cx, cy) { const n = f.lines.length, g = f.px * (f.lh || 1.05); f.lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (n - 1) / 2) * g)); },
    // thẻ bảng truy nã giữa màn
    card(top, big, small, o = {}) {
      const { W, H, k } = D;
      if (o.dim !== false) { ctx.fillStyle = "rgba(20,10,4,.55)"; ctx.fillRect(0, top, W, H - top); }
      const cw = Math.min(W * 0.74, 660 * k), ch = (o.h || 230) * k, cx = W / 2 - cw / 2, cy = top + (H - top) / 2 - ch / 2;
      const g = D.lg(0, cy, 0, cy + ch, [[0, "#f6e6c2"], [1, "#e2c48e"]]);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 24 * k; ctx.fillStyle = g; D.rr(cx, cy, cw, ch, 10 * k); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "#7a4a22"; ctx.lineWidth = 5 * k; D.rr(cx + 8 * k, cy + 8 * k, cw - 16 * k, ch - 16 * k, 6 * k); ctx.stroke();
      ctx.fillStyle = "#7a4a22"; for (const [x, y] of [[cx + 20 * k, cy + 20 * k], [cx + cw - 20 * k, cy + 20 * k], [cx + 20 * k, cy + ch - 20 * k], [cx + cw - 20 * k, cy + ch - 20 * k]]) { ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.fill(); }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = o.col || "#6b2a12";
      const bf = D.wrapFit(big, cw - 70 * k, ch * 0.42, (o.bigPx || 48) * k, 22 * k, 400, "Rye"); ctx.font = `400 ${bf.px}px Rye`;
      D.lines(bf, W / 2, cy + ch * (o.bigY || (small ? 0.38 : 0.5)));
      if (small) { ctx.fillStyle = "#3a1f0e"; D.lines(D.wrapFit(small, cw - 70 * k, ch * 0.34, 24 * k, 14 * k, 700), W / 2, cy + ch * 0.72); }
      return { cx, cy, cw, ch };
    },
    // dải thông báo trên cảnh (không che quả)
    banner(top, text, sub) {
      const { W, k } = D, bw = Math.min(W * 0.8, 740 * k), bh = 96 * k, bx = W / 2 - bw / 2, by = top + 22 * k;
      ctx.fillStyle = "rgba(62,34,15,.9)"; D.rr(bx, by, bw, bh, 12 * k); ctx.fill(); ctx.strokeStyle = "#c9a25a"; ctx.lineWidth = 3 * k; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffe08a"; const f = D.wrapFit(text, bw - 40 * k, 44 * k, 34 * k, 18 * k, 400, "Rye"); ctx.font = `400 ${f.px}px Rye`; D.lines(f, W / 2, by + bh * 0.38);
      if (sub) { ctx.fillStyle = "#f3d9a8"; const s = D.wrapFit(sub, bw - 40 * k, 26 * k, 19 * k, 12 * k, 700); ctx.font = `700 ${s.px}px "Baloo 2"`; D.lines(s, W / 2, by + bh * 0.76); }
    },
    wheel(cx, cy, r, ang) {
      ctx.fillStyle = "#222226"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.strokeStyle = "#b08d4a"; ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, 7); ctx.stroke();
      ctx.lineWidth = Math.max(1, r * 0.1);
      for (let i = 0; i < 6; i++) { const a = ang + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); ctx.stroke(); }
      ctx.fillStyle = "#c9a25a"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, 7); ctx.fill();
    },
  };
  return D;
}

export function mountTrainPad(el, { signal, team, onLeave = null, onBack = null }) {   // onBack: nút ‹ về màn chọn đội (AWord pad.html)
  ensureCss();
  const T = TEAM[team ? 1 : 0], O = TEAM[team ? 0 : 1];
  el.innerHTML = `<div class="trp"><canvas class="trp-cv"></canvas><button class="trp-back" title="Choose team" hidden>‹</button></div>`;
  if (onBack) { const bk = el.querySelector(".trp-back"); bk.hidden = false; bk.addEventListener("click", () => onBack()); }
  const cv = el.querySelector(".trp-cv"), ctx = cv.getContext("2d", { alpha: false }), D = painter(ctx);   // 1ax: canvas đục (nền tô kín)
  let clk = null; const stat = { on: false, gaps: [], lastAt: 0, frames: 0, fps: 0, fpsT: 0, drawMs: 0, taps: [] };   // 1ar
  let L = null, St = null, link = { s: "connecting", rtt: 0 }, dead = false, raf = 0, last = 0, flash = null, popped = new Set(), endEv = "";
  let W = 1024, H = 768, k = 1, ppu = 50, HEAD = 84, GY = 600, P = null, t = 0;
  const fx = [];   // 1ax: bỏ khói
  const hist = [], lost = new Map();   // 1ax: các tin gần nhất (nội suy thùng) · thùng lạc: id ⇒ { minY, landAt, rot }
  // ---- tiếng nhỏ + rung (Web Audio — mở sau lần chạm đầu)
  let ac = null;
  const beep = (f, d = 0.12, type = "sine", g = 0.18) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.setValueAtTime(g, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { /* */ } };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* */ } };
  const roofX = () => (P ? P.cx : 0);

  function onInfo(d) {
      if (d.mode && d.x === undefined) { St = { ...(St || {}), mode: d.mode, ph: d.ph }; return; }
      if (St && St.t != null && d.t != null && d.t < St.t) {
        if (d.t > St.t - 2) return;   // 1as: tin cũ tới muộn ⇒ bỏ
        St = null; clk = null; hist.length = 0; lost.clear(); sm.clear();   // 1ax: giờ game lùi hẳn = trận / trang game MỚI ⇒ nhận lại từ đầu (1av: bỏ mọi tin tới khi giờ vượt mốc cũ)
      }
      const nowS = performance.now() / 1000;
      const before = clk != null ? predict(St, nowS + clk) : null;   // 1as: vị trí đang vẽ (theo tin cũ)
      if (d.t != null) {   // 1ar: độ lệch giờ game − giờ iPad; lấy đường bao trên (tin ít trễ nhất), trôi chậm xuống để theo kịp lệch đồng hồ
        const off = d.t - nowS;
        if (clk == null || off > clk || off < clk - 1.5) clk = off; else clk += (off - clk) * 0.01;
      }
      if (stat.lastAt) { const g = (nowS - stat.lastAt) * 1000; stat.gaps.push(g); if (stat.gaps.length > 60) stat.gaps.shift(); }
      stat.lastAt = nowS;
      St = { ...d, at: performance.now() };
      if (d.t != null && d.x != null) {   // 1ax: lưu tin cho nội suy thùng (toạ độ theo tàu)
        hist.push({ t: d.t, x: d.x, tv: d.tv || 0, ps: d.ps, c: new Map((d.c || []).map(e => [e[7], e])) });
        if (hist.length > 12) hist.shift();
      }
      if (before && clk != null) {   // 1as: phần lệch giữa tin cũ và tin mới ⇒ cộng vào độ bù, tan dần khi vẽ
        const after = predict(St, nowS + clk), keep = new Map();
        for (const [key, n] of after) {
          const o = before.get(key); if (!o) continue;
          const pv = sm.get(key) || [0, 0], ox = pv[0] + o[0] - n[0], oy = pv[1] + o[1] - n[1];
          if (Math.abs(ox) < 1.5 && Math.abs(oy) < 1.5) keep.set(key, [ox, oy]);   // lệch lớn = dịch chuyển thật (màn mới…) ⇒ không bù
        }
        sm.clear(); for (const [key, v] of keep) sm.set(key, v);
      }
      popped = new Set([...popped].filter(id => d.b && d.b.some(b => b[0] === id)));
  }
  function onEvent(e) {
      if (e === "ok") { flash = { ok: true, t: 0 }; fx.push({ type: "ok", x: roofX(), y: (L ? L.roof : 3.8) + 2.4, t: 0, text: "+5" }); beep(880, 0.15); beep(1320, 0.18, "sine", 0.12); buzz(40); }
      else if (e === "wrong") { flash = { ok: false, t: 0 }; fx.push({ type: "bad", x: roofX(), y: (L ? L.roof : 3.8) + 2.4, t: 0, text: "✗" }); beep(180, 0.25, "square", 0.12); buzz([60, 40, 60]); }
      else if (e === "done") { beep(660, 0.2); beep(990, 0.3); buzz(80); }
      else if (e === "out") { beep(140, 0.5, "sawtooth", 0.14); buzz(300); }
      else if (e === "win" || e === "lose" || e === "draw") endEv = e;
  }
  const client = createPadClient({ signal, team: team ? 1 : 0,
    onState: s => { link = s; },
    onLayout: d => { L = d; },
    onInfo: d => { if (window.__trpadLag > 0) setTimeout(() => onInfo(d), Math.random() * window.__trpadLag); else onInfo(d); },   // bàn thử: window.__trpadLag = giả lập Wi-Fi trễ thất thường (ms)
    onEvent });

  function fit() {
    const r = el.querySelector(".trp").getBoundingClientRect(), pr = Math.min(PR_MAX, window.devicePixelRatio || 1);   // 1av: tối đa 1,5 (iPad ×2 ⇒ ít hơn 44 % điểm ảnh) · đo chính màn iPad (phủ cả màn) — ô chứa AWord #pad cao 0
    W = cv.width = Math.max(320, Math.round(r.width * pr)); H = cv.height = Math.max(240, Math.round(r.height * pr));
    k = Math.min(W / 1024, H / 700); HEAD = 84 * k; D.W = W; D.H = H; D.k = k;
  }
  fit();
  window.addEventListener("resize", fit);

  // 1as: đoán vị trí mọi vật của trạng thái s ở giờ game g (để đo phần lệch khi tin mới tới) — 1ax: thùng không còn ở đây (nội suy, xem crateView)
  const sm = new Map(), Z0 = [0, 0], so = key => sm.get(key) || Z0;
  // 1ax: vị trí khinh khí cầu b (của tin s) sau dt giây: trôi (cv − bv) + đà đầu màn tắt dần e^(−0,55 t) như game; bập bềnh theo giờ game g
  function bpos(s, b, dt) {
    const bo = b[7] || 0, x = b[1] + (s.cv - s.bv) * dt - (bo ? bo * (1 - Math.exp(-0.55 * dt)) / 0.55 : 0);
    return [x, b[5] != null ? b[5] + Math.sin((s.t + dt) * 1.3 + b[6]) * 0.22 : b[2]];
  }
  function predict(s, g) {
    const out = new Map(); if (!s || s.cx == null || s.t == null) return out;
    const dt = Math.max(0, Math.min(0.6, g - s.t)) * (s.ps ? 0 : 1);
    out.set("cam", [s.cx + s.cv * dt, 0]);
    if (s.x != null) out.set("tr", [s.x + s.tv * dt, 0]);
    for (const b of s.b || []) out.set("b" + b[0], bpos(s, b, dt));
    return out;
  }
  // 1ax: THÙNG = nội suy giữa 2 tin kẹp giờ (giờ game hiện tại − DELAY), toạ độ x tính theo đầu máy (ox = vị trí tàu đang vẽ) ⇒ thùng trên tàu dính tàu.
  //   Không bao giờ đoán tiếp theo trọng lực (1av: lún qua nóc rồi bật lên). Hết tin (Wi-Fi khựng) ⇒ giữ tin cuối, chỉ trôi ngang ≤ 0,1 s.
  //   Thùng lạc (g = 2): chỉ đi xuống, ghim mặt ray, chạm đất ⇒ mờ dần 0,5 s.
  const angLerp = (a, b, f) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * f; };
  function crateView(ox) {
    const out = []; if (!hist.length) return out;
    const nowP = performance.now() / 1000, g = clk != null ? nowP + clk - DELAY : hist[hist.length - 1].t;
    let j = hist.length - 1; while (j >= 0 && hist[j].t > g) j--;
    let s0, s1 = null, f = 0, ex = 0;
    if (j < 0) s0 = hist[0];
    else if (j === hist.length - 1) { s0 = hist[j]; ex = s0.ps ? 0 : Math.min(0.1, g - s0.t); }
    else { s0 = hist[j]; s1 = hist[j + 1]; f = Math.max(0, Math.min(1, (g - s0.t) / Math.max(1e-3, s1.t - s0.t))); }
    const floor = rail() + CR / 2, seen = new Set();
    for (const [id, e0] of s0.c) {
      const e1 = s1 ? s1.c.get(id) : null, e = e1 || e0;
      if (e[3]) continue;   // bị văng khỏi toa ⇒ ẩn (như 1av)
      seen.add(id);
      let xr, y, rot;
      if (e1) { xr = (e0[0] - s0.x) + ((e1[0] - s1.x) - (e0[0] - s0.x)) * f; y = e0[1] + (e1[1] - e0[1]) * f; rot = angLerp(e0[4] || 0, e1[4] || 0, f); }
      else { xr = e0[0] - s0.x + ((e0[5] || 0) - s0.tv) * ex; y = e0[1]; rot = e0[4] || 0; }
      let a = 1;
      if (e[8] === 2) {
        let L2 = lost.get(id); if (!L2) { L2 = { minY: Infinity, landAt: 0, at: nowP, rot }; lost.set(id, L2); }
        y = Math.max(floor, Math.min(L2.minY, y)); L2.minY = y;
        if (!L2.landAt && (y <= floor + 0.02 || nowP - L2.at > 1.2)) { L2.landAt = nowP; L2.rot = rot; }
        if (L2.landAt) { rot = L2.rot; a = 1 - (nowP - L2.landAt - 0.15) / 0.5; if (a <= 0) continue; a = Math.min(1, a); }
      }
      out.push({ id, x: ox + xr, y, word: e[2], rot, a });
    }
    if (lost.size > 60) for (const id of [...lost.keys()]) if (!seen.has(id)) lost.delete(id);
    return out;
  }
  // vị trí hiện tại (đẩy tiếp theo vận tốc kể từ lần nhận trạng thái)
  function now() {
    if (!St || St.x == null) return St && St.cx != null ? { cx: St.cx, x: null, bdx: 0, dt: 0 } : null;
    const dt = Math.max(0, Math.min(0.6, St.t != null && clk != null ? performance.now() / 1000 + clk - St.t : (performance.now() - St.at) / 1000)) * (St.ps ? 0 : 1);   // 1ar: theo giờ game
    return { cx: St.cx + St.cv * dt, x: St.x + St.tv * dt, bdx: (St.cv - St.bv) * dt, dt };
  }
  const X = wx => W * FOC + (wx - P.cx) * ppu;
  // 1au: trên đáy làn khinh khí cầu (SB) dãn dọc SK lần — khung thu nhỏ theo bề ngang để dư chiều cao ⇒ dồn cho vùng trời (quả to, cách nhau rõ)
  let SB = 7.6, SK = 1;
  const Y = wy => (wy <= SB ? GY - (wy - rail()) * ppu : GY - (SB - rail()) * ppu - (wy - SB) * ppu * SK);
  const rail = () => (L ? L.rail : 0.62), roof = () => (L ? L.roof : 3.82);

  // ---------------------------------------------------------------- nền — 1ax: cam trơn (tô trong draw) + chỉ còn ray và tà vẹt
  function track() {
    const by = Y(rail()), lw = W * FOC / ppu, rw = W * (1 - FOC) / ppu;
    ctx.fillStyle = "#4a3020"; const tw = 0.25 * ppu, step = 0.9;
    for (let wx = Math.floor((P.cx - lw) / step) * step; wx < P.cx + rw + 1; wx += step) ctx.fillRect(X(wx) - tw / 2, by + 1 * k, tw, 9 * k);
    ctx.fillStyle = "#d9d4cc"; ctx.fillRect(0, by - 4 * k, W, 5 * k);
  }

  // ---------------------------------------------------------------- tàu (gốc = tâm đầu máy). Bánh: tàu sang phải ⇒ góc TĂNG theo x (xuôi kim đồng hồ)
  function engine(ox) {
    const u = ppu, R0 = rail(), RF = roof(), ENG = L.eng;
    ctx.fillStyle = "#2a2220"; ctx.fillRect(X(ox - ENG / 2), Y(R0 + 1.05), ENG * u, 0.35 * u);
    for (const [dx, r] of [[-0.3, 0.62], [0.05, 0.62], [0.35, 0.36], [0.44, 0.36]]) D.wheel(X(ox + dx * ENG), Y(R0 + r), r * u, ox / r);
    const ang = ox / 0.62;
    ctx.strokeStyle = "#8a8f96"; ctx.lineWidth = 4 * k; ctx.beginPath();
    ctx.moveTo(X(ox - 0.3 * ENG) + Math.cos(ang) * 0.35 * u, Y(R0 + 0.62) + Math.sin(ang) * 0.35 * u); ctx.lineTo(X(ox + 0.05 * ENG) + Math.cos(ang) * 0.35 * u, Y(R0 + 0.62) + Math.sin(ang) * 0.35 * u); ctx.stroke();
    const bx0 = X(ox - ENG * 0.18), bx1 = X(ox + ENG * 0.47), by0 = Y(R0 + 2.55), by1 = Y(R0 + 1.35);
    const bg = D.lg(0, by0, 0, by1, [[0, shade(T.eng, 0.35)], [0.45, T.eng], [1, shade(T.eng, -0.45)]]);
    ctx.fillStyle = bg; D.rr(bx0, by0, bx1 - bx0, by1 - by0, (by1 - by0) / 2.2); ctx.fill();
    ctx.fillStyle = "#c9a25a"; for (const f of [0.05, 0.25, 0.45]) ctx.fillRect(X(ox + ENG * f) - 2 * k, by0, 4 * k, by1 - by0);
    ctx.fillStyle = "#1d1d20"; D.rr(bx1 - 6 * k, by0 + 3 * k, 14 * k, by1 - by0 - 6 * k, 6 * k); ctx.fill();
    const cx = X(ox + ENG * 0.33);
    ctx.fillStyle = "#1c1c1f"; ctx.beginPath(); ctx.moveTo(cx - 0.16 * u, by0); ctx.lineTo(cx - 0.42 * u, Y(RF + 0.75)); ctx.lineTo(cx + 0.42 * u, Y(RF + 0.75)); ctx.lineTo(cx + 0.16 * u, by0); ctx.fill();
    ctx.fillStyle = "#c9a25a"; ctx.fillRect(cx - 0.45 * u, Y(RF + 0.8), 0.9 * u, 0.12 * u);
    ctx.beginPath(); ctx.ellipse(X(ox + ENG * 0.1), by0, 0.32 * u, 0.3 * u, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#ffe08a"; D.rr(X(ox + ENG * 0.43), Y(R0 + 3.0), 0.35 * u, 0.32 * u, 3 * k); ctx.fill(); ctx.fillStyle = "#3a2a1a"; ctx.fillRect(X(ox + ENG * 0.43), Y(R0 + 2.68), 0.35 * u, 0.1 * u);
    ctx.fillStyle = T.main; ctx.beginPath(); ctx.moveTo(X(ox + ENG * 0.47), Y(R0 + 1.05)); ctx.lineTo(X(ox + ENG * 0.6), Y(R0 + 0.15)); ctx.lineTo(X(ox + ENG * 0.47), Y(R0 + 0.15)); ctx.fill();
    const cb0 = X(ox - ENG * 0.5), cb1 = X(ox - ENG * 0.16);
    ctx.fillStyle = shade(T.eng, -0.15); ctx.fillRect(cb0, Y(RF), cb1 - cb0, Y(R0 + 1.05) - Y(RF));
    ctx.fillStyle = "#1c1410"; D.rr(cb0 - 0.15 * u, Y(RF + 0.25), cb1 - cb0 + 0.3 * u, 0.28 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#ffe9b8"; D.rr(cb0 + 0.25 * u, Y(RF - 0.35), cb1 - cb0 - 0.5 * u, 0.85 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#c9a25a"; ctx.font = `800 ${Math.round(0.36 * u)}px "Baloo 2"`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("#" + (team ? 2 : 1), (cb0 + cb1) / 2, Y(R0 + 1.6));
  }
  function tender(x) {
    const u = ppu, R0 = rail(), TEN = L.ten, x0 = X(x - TEN / 2), x1 = X(x + TEN / 2);
    for (const dx of [-0.28, 0.28]) D.wheel(X(x + dx * TEN), Y(R0 + 0.4), 0.4 * u, x / 0.4);
    ctx.fillStyle = shade(T.eng, -0.1); D.rr(x0, Y(R0 + 2.35), x1 - x0, Y(R0 + 0.75) - Y(R0 + 2.35), 5 * k); ctx.fill();
    ctx.fillStyle = "#1a1a1c"; ctx.beginPath(); ctx.moveTo(x0 + 3 * k, Y(R0 + 2.35));
    for (let i = 0; i <= 6; i++) ctx.lineTo(x0 + (x1 - x0) * i / 6, Y(R0 + 2.55 + 0.18 * Math.sin(i * 2.1)));
    ctx.lineTo(x1 - 3 * k, Y(R0 + 2.35)); ctx.fill();
    ctx.fillStyle = "#e9c97a"; ctx.font = `800 ${Math.round(0.42 * u)}px "Baloo 2"`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("LV." + ((St && St.lvn) || (L.lv + 1) || 1), (x0 + x1) / 2, Y(R0 + 1.55));
  }
  function car(type, cx, len, def, isWait) {
    const u = ppu, R0 = rail(), RF = roof(), x0 = X(cx - len / 2), x1 = X(cx + len / 2);
    for (const dx of [-0.36, -0.22, 0.22, 0.36]) D.wheel(X(cx + dx * len), Y(R0 + 0.36), 0.36 * u, cx / 0.36);
    ctx.fillStyle = "#2a2220"; ctx.fillRect(x0, Y(R0 + 0.95), x1 - x0, 0.25 * u);
    if (type === "p") {   // toa khách
      const g = D.lg(0, Y(RF), 0, Y(R0 + 0.9), [[0, "#3e6a4f"], [1, "#2a4a38"]]);
      ctx.fillStyle = g; D.rr(x0, Y(RF - 0.05), x1 - x0, Y(R0 + 0.95) - Y(RF - 0.05), 6 * k); ctx.fill();
      ctx.fillStyle = "#1c1410"; D.rr(x0 - 4 * k, Y(RF + 0.25), x1 - x0 + 8 * k, 0.3 * u, 6 * k); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const wx = x0 + (x1 - x0) * (0.1 + i * 0.18); ctx.fillStyle = "#ffe9b8"; D.rr(wx, Y(RF - 0.5), (x1 - x0) * 0.12, 0.9 * u, 4 * k); ctx.fill();
        ctx.fillStyle = "#5a3a22"; ctx.beginPath(); ctx.arc(wx + (x1 - x0) * 0.06, Y(RF - 1.05), 0.17 * u, 0, 7); ctx.fill();
      }
      return;
    }
    if (type === "c") {   // toa than
      ctx.fillStyle = "#3a2c22"; D.rr(x0, Y(R0 + 2.3), x1 - x0, Y(R0 + 0.95) - Y(R0 + 2.3), 5 * k); ctx.fill();
      ctx.fillStyle = "#151517"; ctx.beginPath(); ctx.moveTo(x0 + 3 * k, Y(R0 + 2.3));
      for (let i = 0; i <= 8; i++) ctx.lineTo(x0 + (x1 - x0) * i / 8, Y(R0 + 2.55 + 0.2 * Math.sin(i * 2.3)));
      ctx.lineTo(x1 - 3 * k, Y(R0 + 2.3)); ctx.fill();
      return;
    }
    const g = D.lg(0, Y(RF), 0, Y(R0 + 0.95), [[0, "#8a5a32"], [1, "#5c3a1e"]]);
    ctx.fillStyle = g; D.rr(x0, Y(RF), x1 - x0, Y(R0 + 0.95) - Y(RF), 5 * k); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1.5 * k;
    for (let i = 1; i < 5; i++) { const yy = Y(R0 + 0.95 + (RF - R0 - 0.95) * i / 5); ctx.beginPath(); ctx.moveTo(x0 + 3 * k, yy); ctx.lineTo(x1 - 3 * k, yy); ctx.stroke(); }
    // 1au: bảng PHỦ KÍN hông toa như màn lớn (1as chỉ cao 1,9 đv ⇒ khung thu nhỏ thì chữ bé tí); viền theo cỡ toa
    const bx0 = x0 + 0.1 * u, bx1 = x1 - 0.1 * u, by0 = Y(RF - 0.06), by1 = Y(R0 + 1.0), fw = Math.max(2 * k, 0.13 * u);
    ctx.fillStyle = T.main; D.rr(bx0, by0, bx1 - bx0, by1 - by0, 0.22 * u); ctx.fill();
    ctx.fillStyle = "#fdf6e3"; D.rr(bx0 + fw, by0 + fw, bx1 - bx0 - 2 * fw, by1 - by0 - 2 * fw, 0.16 * u); ctx.fill();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // 1au: khung thu nhỏ ⇒ lề + cỡ tối thiểu theo CỠ TOA (cỡ tối thiểu cố định 12·k lớn hơn ô bảng ⇒ chữ tràn viền đỏ); khoảng dòng thật của Baloo 1,15
    const ip = fw, pd = Math.max(1.5 * k, 0.08 * u);
    const df = D.wrapFit(def, bx1 - bx0 - 2 * ip - 2 * pd, by1 - by0 - 2 * ip - 2 * pd, 34 * k, Math.max(5, 0.16 * u), 700, "Baloo 2", 1.15);
    ctx.font = `700 ${df.px}px "Baloo 2"`; D.lines(df, (bx0 + bx1) / 2, (by0 + by1) / 2 + df.px * 0.06);
    if (isWait) waitMark(x0, x1, Y(RF), Y(R0 + 0.9));
  }
  function waitMark(x0, x1, top, bot) {
    const p = 0.5 + 0.5 * Math.sin(t * 6);
    D.rr(x0 - 5 * k, top - 6 * k, x1 - x0 + 10 * k, bot - top + 12 * k, 10 * k);   // 1ar: quầng sáng = nét to mờ (shadowBlur đắt trên iPad)
    ctx.strokeStyle = `rgba(255,214,77,${0.18 + 0.14 * p})`; ctx.lineWidth = (14 + 8 * p) * k; ctx.stroke();
    ctx.strokeStyle = `rgba(255,214,77,${0.75 + 0.25 * p})`; ctx.lineWidth = 5 * k; ctx.stroke();
    const cx = (x0 + x1) / 2, ay = top - (22 + 8 * Math.abs(Math.sin(t * 4))) * k;
    ctx.fillStyle = "#ffd34d"; ctx.strokeStyle = "#7a4a10"; ctx.lineWidth = 2.5 * k;
    ctx.beginPath(); ctx.moveTo(cx - 16 * k, ay - 14 * k); ctx.lineTo(cx + 16 * k, ay - 14 * k); ctx.lineTo(cx, ay + 6 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function crate(x, y, word, rot, a = 1) {   // 1ax: a = độ đục (thùng lạc mờ dần)
    const u = ppu, w = CRW * u, h = CR * u;
    ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(-(rot || 0)); ctx.globalAlpha = a;
    const g = D.lg(0, -h / 2, 0, h / 2, [[0, "#d8a266"], [1, "#a8723e"]]);
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 3 * k; ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = 2 * k; ctx.globalAlpha = 0.35 * a; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.stroke(); ctx.globalAlpha = a;
    ctx.fillStyle = "#fff7e6"; D.rr(-w * 0.42, -h * 0.26, w * 0.84, h * 0.52, 5 * k); ctx.fill();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; D.lines(D.wrapFit(word, w * 0.78, h * 0.46, 26 * k, Math.max(5, 0.14 * u), 800, "Baloo 2", 1.15), 0, 1 * k);   // 1au: cỡ tối thiểu theo cỡ thùng
    ctx.restore();
  }
  let hits = [];
  function blimp(id, x, y, word, bonus) {
    const u = ppu, sx = X(x), sy = Y(y), rx = BW / 2 * u, ry = BH / 2 * u;
    if (bonus) {   // quả thưởng: bóng tròn + biểu tượng
      const col = bonus === "time" ? "#3f9cff" : bonus === "points" ? "#f2b726" : "#a45cff", r = ry * 1.25;
      ctx.strokeStyle = "rgba(60,40,20,.6)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(sx, sy + r); ctx.quadraticCurveTo(sx + 8 * k, sy + r + 20 * k, sx, sy + r + 36 * k); ctx.stroke();
      const g = ctx.createRadialGradient(sx - r * 0.35, sy - r * 0.35, r * 0.1, sx, sy, r); g.addColorStop(0, shade(col, 0.5)); g.addColorStop(1, shade(col, -0.25));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(r * 0.8)}px "Baloo 2"`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(bonus === "x2" ? "×2" : bonus === "time" ? "+10s" : "+10", sx, sy + 2 * k);
      hits.push({ id, x: sx, y: sy, rx: r * 1.2, ry: r * 1.3 });
      return;
    }
    const [l, m, d] = T.env;
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.moveTo(sx + rx * 0.7, sy - ry * 0.2); ctx.lineTo(sx + rx * 1.12, sy - ry * 1.05); ctx.lineTo(sx + rx * 1.12, sy - ry * 0.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx + rx * 0.7, sy + ry * 0.2); ctx.lineTo(sx + rx * 1.12, sy + ry * 1.05); ctx.lineTo(sx + rx * 1.12, sy + ry * 0.1); ctx.fill();
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(sx - rx * 0.25, sy + ry * 0.85); ctx.lineTo(sx - rx * 0.15, sy + ry * 1.35); ctx.moveTo(sx + rx * 0.25, sy + ry * 0.85); ctx.lineTo(sx + rx * 0.15, sy + ry * 1.35); ctx.stroke();
    ctx.fillStyle = "#5a3a1e"; D.rr(sx - rx * 0.2, sy + ry * 1.3, rx * 0.4, ry * 0.42, 3 * k); ctx.fill();
    const g = D.lg(0, -ry, 0, ry, [[0, l], [0.45, m], [1, d]]);   // 1av: gradient quanh gốc riêng ⇒ dùng lại dù quả bập bềnh
    ctx.save(); ctx.translate(sx, sy); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1.5 * k;
    for (const f of [-0.6, -0.2, 0.2, 0.6]) { ctx.beginPath(); ctx.ellipse(sx, sy, rx * Math.abs(f) + 1, ry, 0, f < 0 ? Math.PI / 2 : -Math.PI / 2, f < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(sx - rx * 0.25, sy - ry * 0.55, rx * 0.45, ry * 0.18, -0.08, 0, 7); ctx.fill();
    const lw = rx * 1.55, lh = ry * 1.02;
    ctx.fillStyle = "#fdf6e3"; D.rr(sx - lw / 2, sy - lh / 2, lw, lh, lh / 2.4); ctx.fill(); ctx.strokeStyle = shade(d, -0.3); ctx.lineWidth = 2.5 * k; ctx.stroke();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; D.lines(D.wrapFit(word, lw - 18 * k, lh - 6 * k, 44 * k, 12 * k), sx, sy + 2 * k);
    hits.push({ id, x: sx, y: sy, rx: rx * 1.08, ry: ry * 1.5 });
  }
  function effects(dt) {
    for (const f of fx) f.t += dt;
    for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > 1.2) fx.splice(i, 1);
    for (const f of fx) {
      const sx = X(f.x), sy = Y(f.y);
      if (f.type === "pop") {
        if (f.t < 0.6) for (const p of f.parts) { const d = p.v * f.t * ppu * 0.6; ctx.fillStyle = `rgba(255,${200 - f.t * 100 | 0},90,${1 - f.t / 0.6})`; ctx.beginPath(); ctx.arc(sx + Math.cos(p.a) * d, sy + Math.sin(p.a) * d, 4 * k, 0, 7); ctx.fill(); }
      } else {
        ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2); ctx.font = `400 ${Math.round(54 * k)}px Rye`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.lineWidth = 6 * k; ctx.strokeStyle = "rgba(40,20,10,.8)"; ctx.strokeText(f.text, sx, sy - f.t * 60 * k);
        ctx.fillStyle = f.type === "ok" ? "#6dff8e" : "#ff6a5a"; ctx.fillText(f.text, sx, sy - f.t * 60 * k); ctx.globalAlpha = 1;
      }
    }
    if (flash) { flash.t += dt; const a = 1 - flash.t / 0.45; if (a <= 0) flash = null; else { ctx.fillStyle = flash.ok ? `rgba(80,230,120,${0.22 * a})` : `rgba(255,70,50,${0.28 * a})`; ctx.fillRect(0, HEAD, W, H - HEAD); } }
  }

  // ---------------------------------------------------------------- thanh đầu
  function header() {
    const h = HEAD, tt = St && St.tt ? St.tt : 0, f = tt ? Math.max(0, Math.min(1, St.tl / tt)) : 0, out = St && St.out;
    ctx.fillStyle = D.lg(0, 0, 0, h, [[0, "#6b3d1f"], [1, "#3e220f"]]); ctx.fillRect(0, 0, W, h);
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 10 * k + i * h / 6); ctx.bezierCurveTo(W * 0.3, 4 * k + i * h / 6, W * 0.6, 16 * k + i * h / 6, W, 8 * k + i * h / 6); ctx.stroke(); }
    ctx.fillStyle = "#c9a25a"; ctx.fillRect(0, h - 4 * k, W, 4 * k);
    const pad = 20 * k;
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillStyle = T.main; ctx.beginPath(); ctx.arc(pad + 26 * k, h / 2, 24 * k, 0, 7); ctx.fill(); ctx.strokeStyle = "#e9c97a"; ctx.lineWidth = 3 * k; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(26 * k)}px "Baloo 2"`; ctx.fillText(team ? 2 : 1, pad + 26 * k, h / 2 + 2 * k);
    ctx.textAlign = "left"; ctx.font = `400 ${Math.round(30 * k)}px Rye`; ctx.fillText(T.name, pad + 60 * k, h / 2 + 2 * k);
    // giữa: LEVEL + thanh giờ
    const bw = W * 0.34, bx = W / 2 - bw / 2, bh = 22 * k, byy = h / 2 + 4 * k;
    ctx.textAlign = "center"; ctx.fillStyle = "#f3d9a8"; ctx.font = `700 ${Math.round(17 * k)}px "Baloo 2"`;
    const lvn = St && St.lvn ? St.lvn : 0, lvc = St && St.lvc ? St.lvc : 0;
    if (lvn) ctx.fillText(lvc ? `LEVEL ${lvn} / ${lvc}` : `LEVEL ${lvn}`, W / 2, tt ? byy - 20 * k : h / 2);
    if (tt) {
      ctx.fillStyle = "rgba(0,0,0,.35)"; D.rr(bx, byy - bh / 2 + 6 * k, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = out ? "#ff7b6b" : f < 0.2 ? "#ff9f43" : "#ffd34d"; if (f > 0) { D.rr(bx + 3 * k, byy - bh / 2 + 9 * k, (bw - 6 * k) * f, bh - 6 * k, (bh - 6 * k) / 2); ctx.fill(); }
      ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(16 * k)}px "Baloo 2"`; ctx.fillText(out ? "OUT" : fmt(St.tl), W / 2, byy + 7 * k);
    }
    // phải: điểm mình (bảng giấy) + điểm đội bạn
    const sx = W - pad;
    ctx.fillStyle = "#f6e7c4"; D.rr(sx - 112 * k, h / 2 - 26 * k, 112 * k, 52 * k, 10 * k); ctx.fill(); ctx.strokeStyle = "#c9a25a"; ctx.lineWidth = 3 * k; ctx.stroke();
    ctx.fillStyle = "#5a1e0e"; ctx.font = `400 ${Math.round(34 * k)}px Rye`; ctx.textAlign = "center"; ctx.fillText(St ? St.sc || 0 : 0, sx - 56 * k, h / 2 + 3 * k);
    if (St && St.os != null) { ctx.textAlign = "right"; ctx.font = `700 ${Math.round(15 * k)}px "Baloo 2"`; ctx.fillStyle = "#e9c97a"; ctx.fillText(`${O.name} · ${St.os}`, sx - 124 * k, h / 2 + 3 * k); }
    // đèn nối
    const s = link.s; ctx.fillStyle = s === "on" ? "#5dff7a" : s === "relay" ? "#ffd34d" : "#ffa04d";
    ctx.beginPath(); ctx.arc(W - 12 * k, H - 12 * k, 6 * k, 0, 7); ctx.fill();
  }

  // ---------------------------------------------------------------- khung
  function draw(dt) {
    t += dt;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);   // 1ax: nền cam trơn (canvas đục — không cần xoá)
    const lanes = L && L.lanes ? L.lanes : [7.2, 8.6, 10.0];
    const span = (lanes[2] + BH / 2 + 0.7) - (rail() - 1.5);
    ppu = Math.min((H - HEAD) / span, W / VIS);                         // 1au: khớp bề ngang VIS (thường hẹp hơn chiều cao)
    GY = H - 1.6 * ppu - 46 * k;   // chừa dải nhắc ở đáy (không đè bánh xe)
    SB = lanes[0] - 0.4;                                                // dưới SB (tàu, chồng thùng) tỉ lệ thật
    const skyTop = lanes[2] + BH / 2 + 0.5, room = (GY - (SB - rail()) * ppu) - (HEAD + 10 * k);
    SK = Math.max(1, Math.min(4, room / ((skyTop - SB) * ppu)));
    hits = [];
    { const f = Math.exp(-dt / 0.12); for (const v of sm.values()) { v[0] *= f; v[1] *= f; } }   // 1as: độ bù tan dần
    const P0 = now(); if (P0) P0.cx += so("cam")[0];
    P = P0 || { cx: P ? P.cx : 0, x: null, bdx: 0, dt: 0 };
    track();
    const st = St ? St.st : "", ph = St ? St.ph : "";
    const live = St && (ph === "play" || ph === "countup" || ph === "between" || ph === "over");
    if (live && L && P.x != null && st !== "gone" && st !== "attract" && st !== "ready") {
      for (const b of St.b || []) if (!popped.has(b[0])) { const o = so("b" + b[0]), p = bpos(St, b, P.dt); blimp(b[0], p[0] + o[0], p[1] + o[1], b[3], b[4]); }   // 1ax: tốc độ + bập bềnh riêng từng quả
      const ox = P.x + so("tr")[0];
      let ai = 0;
      for (const [type, lx, len, def, pruned] of L.cars) {
        if (type !== "a") { if (!pruned) car(type, ox + lx, len, def, false); continue; }
        const idx = ai++; if (pruned) continue;
        car("a", ox + lx, len, def, false);   // 1au: thầy bỏ khung vàng + ▼ trên toa
      }
      tender(ox - L.eng / 2 - L.gap - L.ten / 2); engine(ox);
      if (St.out) { ctx.fillStyle = "rgba(60,60,70,.45)"; ctx.fillRect(0, Y(roof() + 1.2), W, Y(rail() - 0.3) - Y(roof() + 1.2)); }
      for (const v of crateView(ox)) crate(v.x, v.y, v.word, v.rot, v.a);   // 1ax: nội suy theo tàu (thay đoán tiếp theo trọng lực)
    } else if (live && St) for (const b of St.b || []) if (!popped.has(b[0])) { const o = so("b" + b[0]), p = bpos(St, b, P.dt); blimp(b[0], p[0] + o[0], p[1] + o[1], b[3], b[4]); }
    effects(dt);
    header();
    // lời nhắc / dải / thẻ theo trạng thái
    const top = HEAD, s = link.s;
    let shown = false;
    const card = (a, b, o) => { D.card(top, a, b, o); shown = true; };
    if (s === "nogame") card("Waiting for the game", "Open TRAIN RUSH ▸ Mode ▸ Fight on the big screen.");
    else if (s === "taken") card(`${T.name} has an iPad`, "Another iPad is already playing for this team. Choose the other team, or wait until that iPad leaves.", { bigPx: 40 });
    else if (s === "kicked") card("Another iPad took this team", "Tap here to take it back.", { bigPx: 40 });
    else if (s === "connecting" && !St) card("Connecting…", "");
    else if (St && St.mode === "off") card("iPads are OFF", "The teacher is using the big screen only. Look up and play together!");
    else if (St && (ph === "start" || ph === "intro" || ph === "load")) card("GET READY!", `You are ${T.name}. Wait for the teacher to press START on the big screen.`);
    else if (St && ph === "count") card(St.cd ? String(St.cd) : "GO!", "", { bigPx: 150, h: 260 });
    else if (St && ph === "over") {
      const me = St.sc || 0, them = St.os || 0;
      const c = D.card(top, endEv === "win" ? "YOU WIN!" : endEv === "lose" ? "GOOD TRY!" : endEv === "draw" ? "DRAW!" : "GAME OVER", "", { h: 300, bigPx: 64, bigY: 0.3 }); shown = true;
      ctx.font = `800 ${Math.round(34 * k)}px "Baloo 2"`; ctx.textAlign = "center";
      [[T.name, me, T.main], [O.name, them, O.main]].forEach(([n, v, col], i) => { ctx.fillStyle = col; ctx.fillText(`${n}   ${v}`, W / 2, c.cy + c.ch * (0.62 + i * 0.17)); });
    } else if (St && St.out && ph === "play") card("TIME'S UP!", `Your train is out. Watch ${O.name} finish this level — then the game ends.`);
    else if (St && ph === "countup") D.banner(top, "LEVEL COMPLETE!", St.bn > 0 ? `Time bonus +${St.bn}` : "Counting the time bonus…");
    else if (St && ph === "between") D.banner(top, `GET READY — LEVEL ${(St.lvn || 1) + 1}`, "New trains are coming!");
    else if (St && ph === "play" && (st === "clear" || st === "gone")) D.banner(top, "TRAIN FULL! ✓", `Bonus time saved: ${fmt(St.tl || 0)} · waiting for ${O.name} to finish…`);
    if (!shown && St && ph === "play" && st === "play" && !St.out) {
      const tx = "Tap the balloon with the RIGHT word when it is above its car";
      ctx.font = `700 ${Math.round(17 * k)}px "Baloo 2"`; const tw = ctx.measureText(tx).width + 30 * k;
      ctx.fillStyle = "rgba(62,34,15,.78)"; D.rr(W / 2 - tw / 2, H - 40 * k, tw, 30 * k, 15 * k); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tx, W / 2, H - 25 * k);
    }
  }
  // 1av: màn ĐỨNG (chưa nối / chờ START / đếm / thẻ kết thúc / iPad tắt / tạm dừng) ⇒ IDLE_FPS; đang chơi ⇒ PAD_FPS
  const idle = () => !St || St.ps || St.mode === "off" || !(St.ph === "play" || St.ph === "countup" || St.ph === "between") || link.s !== "on" && link.s !== "relay";
  let nextAt = 0;
  function loop(ts) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    if (ts < last) { last = ts; nextAt = 0; }   // giờ lùi (không xảy ra với rAF thật) ⇒ không để vòng vẽ đứng hẳn / dt âm
    // 1ax: lịch vẽ theo MỐC (nextAt += khoảng) thay vì "cách khung trước ≥ khoảng" — màn 60/120/30 Hz ra đúng 30 đều; màn tần số lẻ (83/144 Hz) vẫn đủ 30/giây
    const iv = 1000 / (idle() && !fx.length && !flash ? IDLE_FPS : PAD_FPS);
    if (nextAt && ts < nextAt - 2) return;
    nextAt = nextAt && ts - nextAt < iv ? nextAt + iv : ts + iv;
    const dt = last ? Math.min(0.15, (ts - last) / 1000) : 0; last = ts;
    const t0 = performance.now(); draw(dt); const ms = performance.now() - t0;
    stat.drawMs += (ms - stat.drawMs) * 0.1; stat.frames++;
    if (ts - stat.fpsT >= 1000) { stat.fps = Math.round(stat.frames * 1000 / (ts - stat.fpsT || 1000)); stat.frames = 0; stat.fpsT = ts; }
    if (stat.on) statBox();
  }
  raf = requestAnimationFrame(loop);
  function statBox() {   // 1ar: bảng đo (chạm 3 lần góc phải dưới)
    const g = stat.gaps, avg = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0, mx = g.length ? Math.max(...g) : 0;
    const cs = client.state || {};   // 1ax: + kênh trạng thái đang dùng ("st" = không xếp hàng)
    const lines = [`FPS ${stat.fps} · draw ${stat.drawMs.toFixed(1)} ms`, `msg every ${avg.toFixed(0)} ms (max ${mx.toFixed(0)})`, `link ${link.s} · ping ${Math.round(link.rtt || 0)} ms · ${cs.st === "open" ? "st" : "pad"}`];
    ctx.font = `700 ${Math.round(15 * k)}px "Baloo 2"`; const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20 * k, h = lines.length * 20 * k + 12 * k;
    ctx.fillStyle = "rgba(0,0,0,.72)"; D.rr(W - w - 28 * k, H - h - 28 * k, w, h, 8 * k); ctx.fill();
    ctx.fillStyle = "#9dff9d"; ctx.textAlign = "left"; ctx.textBaseline = "top"; lines.forEach((l, i) => ctx.fillText(l, W - w - 18 * k, H - h - 22 * k + i * 20 * k));
  }
  cv.addEventListener("pointerdown", e => {
    if (link.s === "kicked") { client.reconnect(); return; }
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
    if (x > W - 90 * k && y > H - 90 * k) {   // 1ar: chạm 3 lần trong 1,2 s ⇒ bật/tắt bảng đo
      const n = performance.now(); stat.taps = stat.taps.filter(q => n - q < 1200); stat.taps.push(n);
      if (stat.taps.length >= 3) { stat.on = !stat.on; stat.taps = []; }
      return;
    }
    const h = hits.find(q => ((x - q.x) / q.rx) ** 2 + ((y - q.y) / q.ry) ** 2 <= 1);
    if (!h || !St || St.st !== "play" || St.mode === "off") return;
    if (client.send("pop:" + h.id)) {
      popped.add(h.id); beep(520, 0.08, "triangle", 0.14); buzz(15);
      const b = (St.b || []).find(q => q[0] === h.id); if (b) fx.push({ type: "pop", x: b[1] + (P ? P.bdx : 0), y: b[2], t: 0, parts: Array.from({ length: 14 }, (_, i) => ({ a: i / 14 * 6.28, v: 2 + Math.random() * 3 })) });
    }
  });
  return {
    get state() { return { link, St, L, clk, stat, sm, hist, lost, crates: P && P.x != null ? crateView(P.x + so("tr")[0]) : [] }; },   // 1ax: + thùng đang vẽ (bàn thử)
    get hits() { return hits; },   // bàn thử: vùng chạm khinh khí cầu (toạ độ canvas)
    tap(id) { const h = hits.find(q => q.id === id); if (!h) return false; const r = cv.getBoundingClientRect();   // bàn thử: chạm THẬT (pointerdown) vào giữa quả
      cv.dispatchEvent(new PointerEvent("pointerdown", { clientX: r.left + h.x / cv.width * r.width, clientY: r.top + h.y / cv.height * r.height, bubbles: true })); return true; },
    step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) draw(dt); },   // bàn thử (khung ẩn ⇒ rAF đứng)
    destroy() { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", fit); client.destroy(); el.innerHTML = ""; if (onLeave) onLeave(); },
  };
}

// ================================================================ MÀN CHỌN ĐỘI (cùng kiểu A) — AWord pad.html + pad-1aq.html
export function mountTrainChooser(el, { cur = null, onPick }) {
  ensureCss();
  el.innerHTML = `<div class="trp"><canvas class="trp-cv"></canvas></div>`;
  const cv = el.querySelector(".trp-cv"), ctx = cv.getContext("2d"), D = painter(ctx);
  let W = 1024, H = 768, k = 1, busy = [0, 0], msg = "", dead = false, raf = 0, boxes = [];
  function fit() { const r = el.querySelector(".trp").getBoundingClientRect(), pr = Math.min(PR_MAX, window.devicePixelRatio || 1); W = cv.width = Math.max(320, Math.round(r.width * pr)); H = cv.height = Math.max(240, Math.round(r.height * pr)); k = Math.min(W / 1024, H / 700); D.W = W; D.H = H; D.k = k; }
  fit(); window.addEventListener("resize", fit);
  function miniEngine(cx, cy, w, t) {
    const tm = TEAM[t], u = w / 6.4, x0 = cx - w / 2;
    for (const [dx, r] of [[1.0, 0.62], [2.3, 0.62], [4.4, 0.4], [5.4, 0.4]]) D.wheel(x0 + dx * u, cy + 1.25 * u - r * u + 0.62 * u, r * u, performance.now() / 600 / r);
    ctx.fillStyle = "#2a2220"; ctx.fillRect(x0 + 0.2 * u, cy + 0.45 * u, 5.8 * u, 0.3 * u);
    const bg = D.lg(0, cy - 0.9 * u, 0, cy + 0.45 * u, [[0, shade(tm.eng, 0.4)], [0.45, shade(tm.eng, 0.1)], [1, shade(tm.eng, -0.45)]]);
    ctx.fillStyle = bg; D.rr(x0 + 2.1 * u, cy - 0.9 * u, 3.9 * u, 1.35 * u, 0.6 * u); ctx.fill();
    ctx.fillStyle = "#c9a25a"; for (const f of [2.6, 3.6, 4.6]) ctx.fillRect(x0 + f * u, cy - 0.9 * u, 3 * k, 1.35 * u);
    ctx.fillStyle = "#1c1c1f"; ctx.beginPath(); ctx.moveTo(x0 + 4.9 * u, cy - 0.9 * u); ctx.lineTo(x0 + 4.6 * u, cy - 2.1 * u); ctx.lineTo(x0 + 5.6 * u, cy - 2.1 * u); ctx.lineTo(x0 + 5.3 * u, cy - 0.9 * u); ctx.fill();
    ctx.fillStyle = shade(tm.eng, -0.15); ctx.fillRect(x0 + 0.2 * u, cy - 1.9 * u, 2.0 * u, 2.35 * u);
    ctx.fillStyle = "#1c1410"; D.rr(x0, cy - 2.1 * u, 2.4 * u, 0.3 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#ffe9b8"; D.rr(x0 + 0.55 * u, cy - 1.55 * u, 1.3 * u, 0.85 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#ffe08a"; D.rr(x0 + 5.95 * u, cy - 0.7 * u, 0.4 * u, 0.35 * u, 3 * k); ctx.fill();
  }
  function draw() {
    ctx.fillStyle = D.lg(0, 0, 0, H, [[0, "#e7895c"], [0.55, "#f5b97a"], [0.56, "#c27445"], [1, "#8a4a28"]]); ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#5a1e0e"; ctx.font = `400 ${Math.round(68 * k)}px Rye`; ctx.fillText("TRAIN RUSH", W / 2, 100 * k);
    ctx.font = `700 ${Math.round(26 * k)}px "Baloo 2"`; ctx.fillStyle = "#5a2a10"; ctx.fillText("CHOOSE YOUR TEAM", W / 2, 158 * k);
    const bw = Math.min(W * 0.38, 420 * k), bh = Math.min(H * 0.52, 380 * k), gap = W * 0.06, by = 200 * k;
    boxes = [];
    [0, 1].forEach(t => {
      const tm = TEAM[t], bx = W / 2 - bw - gap / 2 + t * (bw + gap);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 18 * k; ctx.shadowOffsetY = 6 * k;
      ctx.fillStyle = tm.main; D.rr(bx, by, bw, bh, 18 * k); ctx.fill(); ctx.restore();
      ctx.strokeStyle = t === cur ? "#fff3c4" : "#e9c97a"; ctx.lineWidth = (t === cur ? 7 : 4) * k; D.rr(bx + 10 * k, by + 10 * k, bw - 20 * k, bh - 20 * k, 10 * k); ctx.stroke();
      miniEngine(bx + bw / 2, by + bh * 0.4, bw * 0.6, t);
      ctx.fillStyle = "#fff"; ctx.font = `400 ${Math.round(40 * k)}px Rye`; ctx.fillText(tm.name, bx + bw / 2, by + bh * 0.74);
      ctx.font = `700 ${Math.round(18 * k)}px "Baloo 2"`; ctx.fillStyle = busy[t] ? "#ffe08a" : "rgba(255,255,255,.9)";
      ctx.fillText(busy[t] ? "● iPad already connected" : t === 0 ? "near track · red train" : "far track · blue train", bx + bw / 2, by + bh * 0.87);
      boxes.push({ t, x: bx, y: by, w: bw, h: bh });
    });
    ctx.font = `600 ${Math.round(17 * k)}px "Baloo 2"`; ctx.fillStyle = msg ? "#ffe08a" : "#f6e6c4";
    ctx.fillText(msg || "This iPad remembers its team. Change it any time with ‹ on the train screen.", W / 2, by + bh + 40 * k);
  }
  let lastC = 0;
  function loop(ts) { if (dead) return; raf = requestAnimationFrame(loop); if (ts - lastC < 1000 / CHOOSER_FPS - 2) return; lastC = ts; draw(); }   // 1av: 10 khung/giây
  raf = requestAnimationFrame(loop);
  cv.addEventListener("pointerdown", e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    const b = boxes.find(q => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h); if (!b) return;
    if (busy[b.t] && b.t !== cur) { msg = TEAM[b.t].name + " already has an iPad connected. Choose the other team."; return; }
    onPick(b.t);
  });
  return {
    setBusy(b) { busy = [b && b[0] ? 1 : 0, b && b[1] ? 1 : 0]; },
    note(text) { msg = text || ""; },
    pick(t) { onPick(t); },   // bàn thử
    destroy() { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", fit); el.innerHTML = ""; },
  };
}
