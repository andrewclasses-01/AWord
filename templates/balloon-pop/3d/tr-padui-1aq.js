// TRAIN RUSH 1aq (14/10/2026) — MÀN iPAD KIỂU A "MIỀN TÂY HOÀNG HÔN". Thầy duyệt bản phác thiet-ke-ipad-1aq.html (3 kiểu) ⇒ chọn A,
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
import { createPadClient } from "./tr-padlink-1ap.js";

const TEAM = [
  { name: "TEAM 1", main: "#d8392a", dark: "#7c1a10", env: ["#f2a092", "#d4513f", "#9a2b1f"], eng: "#8f1d14" },
  { name: "TEAM 2", main: "#2a72d8", dark: "#123d80", env: ["#a9c8f5", "#3f7fd6", "#1f4c94"], eng: "#1d3f7a" }];
const BW = 4.2, BH = 1.4;            // cỡ khinh khí cầu trên iPad (đơn vị thế giới) — to hơn màn lớn cho dễ đọc / dễ chạm
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
  const D = {
    k: 1, W: 1024, H: 768,
    rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); },
    wrapFit(text, maxW, maxH, maxPx, minPx, weight = 800, font = "Baloo 2") {
      const fit = px => { ctx.font = `${weight} ${px}px "${font}"`; const words = String(text).split(/\s+/), lines = []; let cur = "";
        for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
        if (cur) lines.push(cur); return lines; };
      for (let px = Math.round(maxPx); px >= minPx; px -= 1) { const lines = fit(px); if (lines.length * px * 1.05 <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) return { lines, px }; }
      return { lines: fit(minPx), px: minPx };   // không vừa ⇒ vẫn NGẮT DÒNG ở cỡ nhỏ nhất
    },
    lines(f, cx, cy) { const n = f.lines.length; f.lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (n - 1) / 2) * f.px * 1.05)); },
    // thẻ bảng truy nã giữa màn
    card(top, big, small, o = {}) {
      const { W, H, k } = D;
      if (o.dim !== false) { ctx.fillStyle = "rgba(20,10,4,.55)"; ctx.fillRect(0, top, W, H - top); }
      const cw = Math.min(W * 0.74, 660 * k), ch = (o.h || 230) * k, cx = W / 2 - cw / 2, cy = top + (H - top) / 2 - ch / 2;
      const g = ctx.createLinearGradient(0, cy, 0, cy + ch); g.addColorStop(0, "#f6e6c2"); g.addColorStop(1, "#e2c48e");
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
  const cv = el.querySelector(".trp-cv"), ctx = cv.getContext("2d"), D = painter(ctx);
  let L = null, St = null, link = { s: "connecting", rtt: 0 }, dead = false, raf = 0, last = 0, flash = null, popped = new Set(), endEv = "";
  let W = 1024, H = 768, k = 1, ppu = 50, HEAD = 84, GY = 600, P = null, t = 0;
  const fx = [], smoke = []; let smokeT = 0;
  // ---- tiếng nhỏ + rung (Web Audio — mở sau lần chạm đầu)
  let ac = null;
  const beep = (f, d = 0.12, type = "sine", g = 0.18) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.setValueAtTime(g, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { /* */ } };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* */ } };
  const roofX = () => (P ? P.cx : 0);

  const client = createPadClient({ signal, team: team ? 1 : 0,
    onState: s => { link = s; },
    onLayout: d => { L = d; },
    onInfo: d => { if (d.mode && d.x === undefined) { St = { ...(St || {}), mode: d.mode, ph: d.ph }; return; } St = { ...d, at: performance.now() }; popped = new Set([...popped].filter(id => d.b && d.b.some(b => b[0] === id))); },
    onEvent: e => {
      if (e === "ok") { flash = { ok: true, t: 0 }; fx.push({ type: "ok", x: roofX(), y: (L ? L.roof : 3.8) + 2.4, t: 0, text: "+5" }); beep(880, 0.15); beep(1320, 0.18, "sine", 0.12); buzz(40); }
      else if (e === "wrong") { flash = { ok: false, t: 0 }; fx.push({ type: "bad", x: roofX(), y: (L ? L.roof : 3.8) + 2.4, t: 0, text: "✗" }); beep(180, 0.25, "square", 0.12); buzz([60, 40, 60]); }
      else if (e === "done") { beep(660, 0.2); beep(990, 0.3); buzz(80); }
      else if (e === "out") { beep(140, 0.5, "sawtooth", 0.14); buzz(300); }
      else if (e === "win" || e === "lose" || e === "draw") endEv = e;
    } });

  function fit() {
    const r = el.querySelector(".trp").getBoundingClientRect(), pr = Math.min(2, window.devicePixelRatio || 1);   // đo chính màn iPad (phủ cả màn) — ô chứa AWord #pad cao 0
    W = cv.width = Math.max(320, Math.round(r.width * pr)); H = cv.height = Math.max(240, Math.round(r.height * pr));
    k = Math.min(W / 1024, H / 700); HEAD = 84 * k; D.W = W; D.H = H; D.k = k;
  }
  fit();
  window.addEventListener("resize", fit);

  // vị trí hiện tại (đẩy tiếp theo vận tốc kể từ lần nhận trạng thái)
  function now() {
    if (!St || St.x == null) return St && St.cx != null ? { cx: St.cx, x: null, bdx: 0 } : null;
    const dt = Math.min(0.25, (performance.now() - St.at) / 1000) * (St.ps ? 0 : 1);
    return { cx: St.cx + St.cv * dt, x: St.x + St.tv * dt, bdx: (St.cv - St.bv) * dt };
  }
  const X = wx => W / 2 + (wx - P.cx) * ppu, Y = wy => GY - (wy - rail()) * ppu;
  const rail = () => (L ? L.rail : 0.62), roof = () => (L ? L.roof : 3.82);

  // ---------------------------------------------------------------- nền
  function backdrop() {
    const hz = Y(roof() + 0.9), cx = P ? P.cx : 0;
    const sg = ctx.createLinearGradient(0, HEAD, 0, hz);
    sg.addColorStop(0, "#e7895c"); sg.addColorStop(0.6, "#f5b97a"); sg.addColorStop(1, "#fbe0ae");
    ctx.fillStyle = sg; ctx.fillRect(0, HEAD, W, hz - HEAD);
    const sx = W * 0.78, sy = hz - 70 * k, gl = ctx.createRadialGradient(sx, sy, 10 * k, sx, sy, 160 * k);
    gl.addColorStop(0, "rgba(255,245,200,.9)"); gl.addColorStop(0.3, "rgba(255,220,150,.35)"); gl.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = gl; ctx.fillRect(sx - 160 * k, sy - 160 * k, 320 * k, 320 * k);
    ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.arc(sx, sy, 34 * k, 0, 7); ctx.fill();
    const layer = (par, col, hBase, hAmp, flat) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= W + 8; x += 8 * k) {
        const wx = cx * par + (x - W / 2) / ppu;
        let h = hBase + hAmp * (0.5 + 0.3 * Math.sin(wx * 0.21) + 0.2 * Math.sin(wx * 0.53 + 1.3));
        if (flat) { const m = Math.sin(wx * 0.17 + 0.4); h = m > 0.35 ? hBase + hAmp * 1.15 : m > 0.1 ? hBase + hAmp * (0.3 + (m - 0.1) * 3.4) : hBase + hAmp * 0.3 * (0.6 + 0.4 * Math.sin(wx * 0.9)); }
        ctx.lineTo(x, hz - h * ppu);
      }
      ctx.lineTo(W, hz); ctx.closePath(); ctx.fill();
    };
    layer(0.08, "#c97a5e", 1.4, 2.6, true);
    layer(0.18, "#a65a3f", 0.5, 1.5, false);
    const gg = ctx.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, "#d99660"); gg.addColorStop(1, "#c27445");
    ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
    for (let i = -6; i < 8; i++) {
      const base = Math.floor(cx * 0.6 / 4) + i, wx = base * 4 + hash(base) * 3, x = W / 2 + (wx - cx * 0.6) * ppu;
      const y = hz + (8 * k + hash(base + 7) * (Y(rail() + 0.6) - hz - 18 * k));
      if (hash(base + 3) < 0.25) cactus(x, y, (16 + hash(base) * 12) * k); else bush(x, y, (7 + hash(base + 1) * 8) * k);
    }
  }
  function bush(x, y, r) { ctx.fillStyle = "#7a6a3a"; for (const [dx, dy, s] of [[0, 0, 1], [-0.8, 0.2, 0.7], [0.8, 0.25, 0.75]]) { ctx.beginPath(); ctx.ellipse(x + dx * r, y - r * 0.6 + dy * r, r * s, r * s * 0.7, 0, 0, 7); ctx.fill(); } }
  function cactus(x, y, h) {
    ctx.strokeStyle = "#4f6a3a"; ctx.lineCap = "round"; ctx.lineWidth = h * 0.22;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h);
    ctx.moveTo(x, y - h * 0.45); ctx.lineTo(x - h * 0.3, y - h * 0.45); ctx.lineTo(x - h * 0.3, y - h * 0.75);
    ctx.moveTo(x, y - h * 0.6); ctx.lineTo(x + h * 0.28, y - h * 0.6); ctx.lineTo(x + h * 0.28, y - h * 0.85); ctx.stroke();
  }
  function track() {
    const by = Y(rail()), half = W / 2 / ppu;
    ctx.fillStyle = "#7d6a5a"; ctx.fillRect(0, by - 2 * k, W, 18 * k);
    ctx.fillStyle = "#4a3020"; const tw = 0.25 * ppu, step = 0.9;
    for (let wx = Math.floor((P.cx - half) / step) * step; wx < P.cx + half + 1; wx += step) ctx.fillRect(X(wx) - tw / 2, by + 1 * k, tw, 9 * k);
    ctx.fillStyle = "#d9d4cc"; ctx.fillRect(0, by - 4 * k, W, 5 * k);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(0, by + 1 * k, W, 2 * k);
    ctx.fillStyle = "#a85e37"; ctx.fillRect(0, by + 16 * k, W, H - by - 16 * k);
    ctx.strokeStyle = "#6d5b2c"; ctx.lineWidth = 2 * k;
    for (let i = -4; i < 16; i++) {
      const base = Math.floor(P.cx * 1.25 / 2.2) + i, wx = base * 2.2 + hash(base + 11) * 1.6, x = W / 2 + (wx - P.cx * 1.25) * ppu, y = by + 26 * k + hash(base + 5) * (H - by - 30 * k);
      for (let j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + j * 3 * k, y - 10 * k, x + j * 5 * k, y - (14 + hash(base + j) * 10) * k); ctx.stroke(); }
    }
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
    const bg = ctx.createLinearGradient(0, by0, 0, by1); bg.addColorStop(0, shade(T.eng, 0.35)); bg.addColorStop(0.45, T.eng); bg.addColorStop(1, shade(T.eng, -0.45));
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
      const g = ctx.createLinearGradient(0, Y(RF), 0, Y(R0 + 0.9)); g.addColorStop(0, "#3e6a4f"); g.addColorStop(1, "#2a4a38");
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
    const g = ctx.createLinearGradient(0, Y(RF), 0, Y(R0 + 0.95)); g.addColorStop(0, "#8a5a32"); g.addColorStop(1, "#5c3a1e");
    ctx.fillStyle = g; D.rr(x0, Y(RF), x1 - x0, Y(R0 + 0.95) - Y(RF), 5 * k); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1.5 * k;
    for (let i = 1; i < 5; i++) { const yy = Y(R0 + 0.95 + (RF - R0 - 0.95) * i / 5); ctx.beginPath(); ctx.moveTo(x0 + 3 * k, yy); ctx.lineTo(x1 - 3 * k, yy); ctx.stroke(); }
    const bx0 = x0 + 0.22 * u, bx1 = x1 - 0.22 * u, by0 = Y(RF - 0.18), by1 = Y(R0 + 1.15);
    ctx.fillStyle = T.main; D.rr(bx0, by0, bx1 - bx0, by1 - by0, 8 * k); ctx.fill();
    ctx.fillStyle = "#fdf6e3"; D.rr(bx0 + 5 * k, by0 + 5 * k, bx1 - bx0 - 10 * k, by1 - by0 - 10 * k, 6 * k); ctx.fill();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    D.lines(D.wrapFit(def, bx1 - bx0 - 26 * k, by1 - by0 - 18 * k, 34 * k, 12 * k, 700), (bx0 + bx1) / 2, (by0 + by1) / 2 + 1 * k);
    if (isWait) waitMark(x0, x1, Y(RF), Y(R0 + 0.9));
  }
  function waitMark(x0, x1, top, bot) {
    const p = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.save(); ctx.shadowColor = "#ffd34d"; ctx.shadowBlur = (14 + 10 * p) * k;
    ctx.strokeStyle = `rgba(255,214,77,${0.75 + 0.25 * p})`; ctx.lineWidth = 5 * k; D.rr(x0 - 5 * k, top - 6 * k, x1 - x0 + 10 * k, bot - top + 12 * k, 10 * k); ctx.stroke(); ctx.restore();
    const cx = (x0 + x1) / 2, ay = top - (22 + 8 * Math.abs(Math.sin(t * 4))) * k;
    ctx.fillStyle = "#ffd34d"; ctx.strokeStyle = "#7a4a10"; ctx.lineWidth = 2.5 * k;
    ctx.beginPath(); ctx.moveTo(cx - 16 * k, ay - 14 * k); ctx.lineTo(cx + 16 * k, ay - 14 * k); ctx.lineTo(cx, ay + 6 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function crate(x, y, word, rot) {
    const u = ppu, w = CRW * u, h = CR * u;
    ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(-(rot || 0));
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, "#d8a266"); g.addColorStop(1, "#a8723e");
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 3 * k; ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = 2 * k; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff7e6"; D.rr(-w * 0.42, -h * 0.26, w * 0.84, h * 0.52, 5 * k); ctx.fill();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; D.lines(D.wrapFit(word, w * 0.78, h * 0.46, 26 * k, 9 * k), 0, 1 * k);
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
    const g = ctx.createLinearGradient(0, sy - ry, 0, sy + ry); g.addColorStop(0, l); g.addColorStop(0.45, m); g.addColorStop(1, d);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1.5 * k;
    for (const f of [-0.6, -0.2, 0.2, 0.6]) { ctx.beginPath(); ctx.ellipse(sx, sy, rx * Math.abs(f) + 1, ry, 0, f < 0 ? Math.PI / 2 : -Math.PI / 2, f < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(sx - rx * 0.25, sy - ry * 0.55, rx * 0.45, ry * 0.18, -0.08, 0, 7); ctx.fill();
    const lw = rx * 1.55, lh = ry * 1.02;
    ctx.fillStyle = "#fdf6e3"; D.rr(sx - lw / 2, sy - lh / 2, lw, lh, lh / 2.4); ctx.fill(); ctx.strokeStyle = shade(d, -0.3); ctx.lineWidth = 2.5 * k; ctx.stroke();
    ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; D.lines(D.wrapFit(word, lw - 18 * k, lh - 6 * k, 44 * k, 12 * k), sx, sy + 2 * k);
    hits.push({ id, x: sx, y: sy, rx: rx * 1.08, ry: ry * 1.5 });
  }
  function effects(dt) {
    for (const s of smoke) { s.t += dt; s.x += s.vx * dt; s.y += 1.1 * dt; }
    for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].t > 2.4) smoke.splice(i, 1);
    for (const s of smoke) { const a = Math.max(0, 0.42 * (1 - s.t / 2.4)), r = (s.s + s.t * 0.32) * ppu * 0.7; ctx.fillStyle = `rgba(235,230,225,${a})`; ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), r, 0, 7); ctx.fill(); }
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
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#6b3d1f"); g.addColorStop(1, "#3e220f"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
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
    ctx.clearRect(0, 0, W, H);
    const lanes = L && L.lanes ? L.lanes : [7.2, 8.6, 10.0];
    ppu = (H - HEAD) / ((lanes[2] + BH / 2 + 0.7) - (rail() - 1.5)); GY = H - 1.5 * ppu;
    hits = [];
    P = now() || { cx: P ? P.cx : 0, x: null, bdx: 0 };
    backdrop(); track();
    const st = St ? St.st : "", ph = St ? St.ph : "";
    const live = St && (ph === "play" || ph === "countup" || ph === "between" || ph === "over");
    if (live && L && P.x != null && st !== "gone" && st !== "attract" && st !== "ready") {
      for (const [id, x, y, word, bonus] of St.b || []) if (!popped.has(id)) blimp(id, x + P.bdx, y, word, bonus);
      const ox = P.x, filled = St.f || "", waitIdx = filled.indexOf("0");
      // khói ống khói (toạ độ thế giới)
      smokeT -= dt; if (smokeT <= 0) { smokeT = 0.11; smoke.push({ x: ox + L.eng * 0.33, y: roof() + 0.9, t: 0, vx: (St.tv || 0) - 2.4, s: 0.35 + Math.random() * 0.2 }); }
      let ai = 0;
      for (const [type, lx, len, def, pruned] of L.cars) {
        if (type !== "a") { if (!pruned) car(type, ox + lx, len, def, false); continue; }
        const idx = ai++; if (pruned) continue;
        car("a", ox + lx, len, def, idx === waitIdx && st === "play" && !St.out);
      }
      tender(ox - L.eng / 2 - L.gap - L.ten / 2); engine(ox);
      if (St.out) { ctx.fillStyle = "rgba(60,60,70,.45)"; ctx.fillRect(0, Y(roof() + 1.2), W, Y(rail() - 0.3) - Y(roof() + 1.2)); }
      for (const [x, y, word, kicked, rot] of St.c || []) if (!kicked) crate(x, y, word, rot);
    } else if (live && St) for (const [id, x, y, word, bonus] of St.b || []) if (!popped.has(id)) blimp(id, x + P.bdx, y, word, bonus);
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
      const tx = "Tap the balloon with the RIGHT word — its box drops onto the glowing car ▼";
      ctx.font = `700 ${Math.round(17 * k)}px "Baloo 2"`; const tw = ctx.measureText(tx).width + 30 * k;
      ctx.fillStyle = "rgba(62,34,15,.78)"; D.rr(W / 2 - tw / 2, H - 40 * k, tw, 30 * k, 15 * k); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tx, W / 2, H - 25 * k);
    }
  }
  function loop(ts) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    draw(dt);
  }
  raf = requestAnimationFrame(loop);
  cv.addEventListener("pointerdown", e => {
    if (link.s === "kicked") { client.reconnect(); return; }
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
    const h = hits.find(q => ((x - q.x) / q.rx) ** 2 + ((y - q.y) / q.ry) ** 2 <= 1);
    if (!h || !St || St.st !== "play" || St.mode === "off") return;
    if (client.send("pop:" + h.id)) {
      popped.add(h.id); beep(520, 0.08, "triangle", 0.14); buzz(15);
      const b = (St.b || []).find(q => q[0] === h.id); if (b) fx.push({ type: "pop", x: b[1] + (P ? P.bdx : 0), y: b[2], t: 0, parts: Array.from({ length: 14 }, (_, i) => ({ a: i / 14 * 6.28, v: 2 + Math.random() * 3 })) });
    }
  });
  return {
    get state() { return { link, St, L }; },
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
  function fit() { const r = el.querySelector(".trp").getBoundingClientRect(), pr = Math.min(2, window.devicePixelRatio || 1); W = cv.width = Math.max(320, Math.round(r.width * pr)); H = cv.height = Math.max(240, Math.round(r.height * pr)); k = Math.min(W / 1024, H / 700); D.W = W; D.H = H; D.k = k; }
  fit(); window.addEventListener("resize", fit);
  function miniEngine(cx, cy, w, t) {
    const tm = TEAM[t], u = w / 6.4, x0 = cx - w / 2;
    for (const [dx, r] of [[1.0, 0.62], [2.3, 0.62], [4.4, 0.4], [5.4, 0.4]]) D.wheel(x0 + dx * u, cy + 1.25 * u - r * u + 0.62 * u, r * u, performance.now() / 600 / r);
    ctx.fillStyle = "#2a2220"; ctx.fillRect(x0 + 0.2 * u, cy + 0.45 * u, 5.8 * u, 0.3 * u);
    const bg = ctx.createLinearGradient(0, cy - 0.9 * u, 0, cy + 0.45 * u); bg.addColorStop(0, shade(tm.eng, 0.4)); bg.addColorStop(0.45, shade(tm.eng, 0.1)); bg.addColorStop(1, shade(tm.eng, -0.45));
    ctx.fillStyle = bg; D.rr(x0 + 2.1 * u, cy - 0.9 * u, 3.9 * u, 1.35 * u, 0.6 * u); ctx.fill();
    ctx.fillStyle = "#c9a25a"; for (const f of [2.6, 3.6, 4.6]) ctx.fillRect(x0 + f * u, cy - 0.9 * u, 3 * k, 1.35 * u);
    ctx.fillStyle = "#1c1c1f"; ctx.beginPath(); ctx.moveTo(x0 + 4.9 * u, cy - 0.9 * u); ctx.lineTo(x0 + 4.6 * u, cy - 2.1 * u); ctx.lineTo(x0 + 5.6 * u, cy - 2.1 * u); ctx.lineTo(x0 + 5.3 * u, cy - 0.9 * u); ctx.fill();
    ctx.fillStyle = shade(tm.eng, -0.15); ctx.fillRect(x0 + 0.2 * u, cy - 1.9 * u, 2.0 * u, 2.35 * u);
    ctx.fillStyle = "#1c1410"; D.rr(x0, cy - 2.1 * u, 2.4 * u, 0.3 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#ffe9b8"; D.rr(x0 + 0.55 * u, cy - 1.55 * u, 1.3 * u, 0.85 * u, 4 * k); ctx.fill();
    ctx.fillStyle = "#ffe08a"; D.rr(x0 + 5.95 * u, cy - 0.7 * u, 0.4 * u, 0.35 * u, 3 * k); ctx.fill();
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#e7895c"); g.addColorStop(0.55, "#f5b97a"); g.addColorStop(0.56, "#c27445"); g.addColorStop(1, "#8a4a28");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
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
  function loop() { if (dead) return; raf = requestAnimationFrame(loop); draw(); }
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
