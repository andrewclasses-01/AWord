// TRAIN RUSH 1ap (14/10/2026) — MÀN iPAD cho FIGHT 1 MÀN. Thầy chốt (bản phác thiet-ke-fight-1-man.html): iPad thấy CẢNH 2D của RIÊNG đội
// mình — tàu + khinh khí cầu + thùng, chạy khớp màn lớn; chạm quả trên iPad = quả đó nổ trên màn lớn (gửi "pop:<số>").
// Vị trí ngang = vị trí THẾ GIỚI tính từ giữa màn lớn (camX) ⇒ canh thả trên iPad = canh trên màn lớn; phóng to quanh toa chờ (chữ to).
// Giữa 2 lần game gửi trạng thái (~20/giây) iPad tự đẩy tiếp theo vận tốc (máy quay, tàu, khinh khí cầu) ⇒ chạy mượt.
//   mountTrainPad(el, { signal, team, onLeave }) ⇒ { destroy() }   (bàn thử: pad-1ap.html?t=0|1)
import { createPadClient } from "./tr-padlink-1ap.js";

const FONT = '"Baloo 2", system-ui, sans-serif';
const TEAM = [{ name: "TEAM 1", css: "#e2402f", dark: "#8f1f14", box: "#9c3424", frame: "#b0281a", env: "#e0796c", eng: "#8f1d14" },
  { name: "TEAM 2", css: "#2f7fe2", dark: "#143f8f", box: "#35608f", frame: "#1f5fb8", env: "#7aa6e6", eng: "#1d3f7a" }];
const BS = 0.84;   // tỉ lệ khinh khí cầu của game

function wrapFit(ctx, text, maxW, maxH, maxPx, minPx, weight = 800) {
  for (let px = maxPx; px >= minPx; px -= 2) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    const words = String(text).split(/\s+/), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    if (lines.length * px * 1.08 <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) return { lines, px };
  }
  // không vừa ⇒ vẫn NGẮT DÒNG ở cỡ nhỏ nhất (không để một dòng dài tràn ngoài bảng)
  ctx.font = `${weight} ${minPx}px ${FONT}`;
  const words = String(text).split(/\s+/), lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  return { lines, px: minPx };
}
const drawLines = (ctx, f, cx, cy) => { const n = f.lines.length; f.lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (n - 1) / 2) * f.px * 1.08)); };

const CSS = `.trp { position: fixed; inset: 0; z-index: 1; background: #120c07; touch-action: none; user-select: none; -webkit-user-select: none; }
.trp-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
.trp-ov { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(20, 10, 4, .72); }
.trp-ov[hidden], .trp-back[hidden] { display: none; }
.trp-card { text-align: center; padding: 22px 34px; border-radius: 18px; background: linear-gradient(#f3e2bf, #e2c996); color: #3a1f0e; border: 4px solid #7a4a22; max-width: 80vw; }
.trp-big { display: block; font: 400 clamp(26px, 5vw, 46px) Rye, serif; color: #6b2a12; }
.trp-small { margin: 8px 0 0; font: 700 clamp(15px, 2.4vw, 20px) "Baloo 2", system-ui, sans-serif; }
.trp-back { position: absolute; left: 10px; bottom: 10px; width: 46px; height: 46px; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); background: rgba(0,0,0,.45); color: #fff; font: 800 26px "Baloo 2", system-ui, sans-serif; cursor: pointer; z-index: 2; }`;
function ensureCss() {
  if (document.getElementById("trp-css")) return;
  const st = document.createElement("style"); st.id = "trp-css"; st.textContent = CSS; document.head.append(st);
  if (![...document.querySelectorAll("link[href*='fonts.googleapis']")].some(l => /Rye/.test(l.href))) {   // phông Rye + Baloo 2 (trang iPad AWord chưa nạp Rye)
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Rye&display=swap"; document.head.append(l);
  }
}   // tự mang CSS (AWord pad.html dùng chung)
export function mountTrainPad(el, { signal, team, onLeave = null, onBack = null }) {   // onBack: nút ‹ về màn chọn đội (AWord pad.html)
  ensureCss();
  const T = TEAM[team ? 1 : 0];
  el.innerHTML = `<div class="trp">
    <canvas class="trp-cv"></canvas>
    <div class="trp-ov" hidden><div class="trp-card"><b class="trp-big"></b><p class="trp-small"></p></div></div>
    <button class="trp-back" title="Choose team" hidden>‹</button>
  </div>`;
  if (onBack) { const bk = el.querySelector(".trp-back"); bk.hidden = false; bk.addEventListener("click", () => onBack()); }
  const cv = el.querySelector(".trp-cv"), ctx = cv.getContext("2d"), ov = el.querySelector(".trp-ov");
  let L = null, St = null, link = { s: "connecting", rtt: 0 }, dead = false, raf = 0, last = 0, flash = null, popped = new Set(), endEv = "";
  // ---- tiếng nhỏ + rung (Web Audio — mở sau lần chạm đầu)
  let ac = null;
  const beep = (f, d = 0.12, type = "sine", g = 0.18) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.setValueAtTime(g, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { /* */ } };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* */ } };

  const client = createPadClient({ signal, team: team ? 1 : 0,
    onState: s => { link = s; },
    onLayout: d => { L = d; },
    onInfo: d => { if (d.mode && d.x === undefined) { St = { ...(St || {}), mode: d.mode, ph: d.ph }; return; } St = { ...d, at: performance.now() }; popped = new Set([...popped].filter(id => d.b && d.b.some(b => b[0] === id))); },
    onEvent: e => {
      if (e === "ok") { flash = { c: "rgba(80,220,120,", t: performance.now() }; beep(880, 0.15); beep(1320, 0.18, "sine", 0.12); buzz(40); }
      else if (e === "wrong") { flash = { c: "rgba(255,80,60,", t: performance.now() }; beep(180, 0.25, "square", 0.12); buzz([60, 40, 60]); }
      else if (e === "done") { beep(660, 0.2); beep(990, 0.3); buzz(80); }
      else if (e === "out") { beep(140, 0.5, "sawtooth", 0.14); buzz(300); }
      else if (e === "win" || e === "lose" || e === "draw") endEv = e;
    } });

  function fit() {
    const r = el.querySelector(".trp").getBoundingClientRect(), pr = Math.min(2, window.devicePixelRatio || 1);   // đo chính màn iPad (phủ cả màn) — ô chứa AWord #pad cao 0
    cv.width = Math.max(320, Math.round(r.width * pr)); cv.height = Math.max(240, Math.round(r.height * pr));
  }
  fit();
  window.addEventListener("resize", fit);

  // vị trí hiện tại (đẩy tiếp theo vận tốc kể từ lần nhận trạng thái)
  function now() {
    if (!St || St.x == null) return null;
    const dt = Math.min(0.25, (performance.now() - St.at) / 1000) * (St.ps ? 0 : 1);
    return { cx: St.cx + St.cv * dt, x: St.x + St.tv * dt, bdx: (St.cv - St.bv) * dt };
  }
  let hits = [];
  function draw() {
    const W = cv.width, H = cv.height, k = W / 1024;
    ctx.clearRect(0, 0, W, H);
    // trời + đất
    const head = 64 * k, gy = H - 64 * k;
    const sky = ctx.createLinearGradient(0, head, 0, gy); sky.addColorStop(0, "#f4c58e"); sky.addColorStop(1, "#e79a62");
    ctx.fillStyle = sky; ctx.fillRect(0, head, W, gy - head);
    ctx.fillStyle = "#b4643c"; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = "#6f5a48"; ctx.fillRect(0, gy, W, 14 * k); ctx.fillStyle = "#9a9aa0"; ctx.fillRect(0, gy - 3 * k, W, 4 * k);
    hits = [];
    const P = now();
    if (L && P) {
      const ppu = (gy - head - 16 * k) / ((L.lanes[2] || 12) + 1.7 - L.rail);
      const X = wx => W / 2 + (wx - P.cx) * ppu, Y = wy => gy - (wy - L.rail) * ppu;
      const box = (x0, x1, y0, y1, col) => { ctx.fillStyle = col; ctx.fillRect(X(x0), Y(y1), (x1 - x0) * ppu, (y1 - y0) * ppu); };
      // tàu (gốc = tâm đầu máy)
      if (St.st !== "gone" && St.st !== "attract" && St.st !== "ready") {
        const ox = P.x, roof = L.roof;
        box(ox - L.eng / 2, ox + L.eng / 2, L.rail + 0.3, L.rail + 2.2, T.eng);
        box(ox - L.eng * 0.45, ox - L.eng * 0.1, L.rail + 1.6, roof + 0.2, "#2a1a10");
        box(ox + L.eng * 0.28, ox + L.eng * 0.36, L.rail + 2.0, roof + 0.4, "#1d1d20");
        const tx = ox - L.eng / 2 - L.gap - L.ten / 2; box(tx - L.ten / 2, tx + L.ten / 2, L.rail + 0.3, L.rail + 1.7, T.eng);
        const filled = St.f || "";
        let ai = 0, waitIdx = filled.indexOf("0");
        for (const [type, lx, len, def, pruned] of L.cars) {
          const cx = ox + lx;
          if (type !== "a") { if (!pruned) box(cx - len / 2, cx + len / 2, L.rail + 0.3, roof - 0.05, type === "p" ? "#2c4a3c" : "#2c2c2e"); continue; }
          const idx = ai++; if (pruned) continue;
          const x0 = X(cx - len / 2), x1 = X(cx + len / 2);
          box(cx - len / 2, cx + len / 2, L.rail + 0.3, roof, T.box);
          const by0 = Y(roof - 0.25), by1 = Y(L.rail + 0.6);
          ctx.fillStyle = T.frame; ctx.fillRect(x0 + 3 * k, by0, x1 - x0 - 6 * k, by1 - by0);
          ctx.fillStyle = "#fbf3df"; ctx.fillRect(x0 + 7 * k, by0 + 4 * k, x1 - x0 - 14 * k, by1 - by0 - 8 * k);
          ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          drawLines(ctx, wrapFit(ctx, def, x1 - x0 - 24 * k, by1 - by0 - 14 * k, 40 * k, 12 * k, 700), (x0 + x1) / 2, (by0 + by1) / 2);
          if (filled[idx] === "1") { const cw = 2.9 * 0.74 * ppu, ch = 1.5 * 0.74 * ppu; ctx.fillStyle = "#b27a45"; ctx.fillRect((x0 + x1) / 2 - cw / 2, Y(roof) - ch, cw, ch); ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 3 * k; ctx.strokeRect((x0 + x1) / 2 - cw / 2, Y(roof) - ch, cw, ch); }
          if (idx === waitIdx && St.st === "play") { ctx.strokeStyle = "#ffd34d"; ctx.lineWidth = 6 * k; ctx.strokeRect(x0 - 3 * k, Y(roof) - 6 * k, x1 - x0 + 6 * k, gy - Y(roof) + 6 * k); }
        }
      }
      // thùng đang rơi
      for (const [x, y, word, kicked] of St.c || []) {
        if (kicked) continue;
        const cw = 2.9 * 0.74 * ppu, ch = 1.5 * 0.74 * ppu, sx = X(x), sy = Y(y);
        ctx.fillStyle = "#b27a45"; ctx.fillRect(sx - cw / 2, sy - ch / 2, cw, ch); ctx.strokeStyle = "#6b4426"; ctx.lineWidth = 3 * k; ctx.strokeRect(sx - cw / 2, sy - ch / 2, cw, ch);
        ctx.fillStyle = "#fff3da"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; drawLines(ctx, wrapFit(ctx, word, cw - 8 * k, ch - 6 * k, 30 * k, 10 * k), sx, sy);
      }
      // khinh khí cầu (của đội mình)
      for (const [id, x, y, word, bonus] of St.b || []) {
        if (popped.has(id)) continue;
        const sx = X(x + P.bdx), sy = Y(y), rx = 3.4 * BS * ppu, ry = 1.3 * BS * ppu;
        ctx.fillStyle = bonus ? (bonus === "time" ? "#3f9cff" : bonus === "points" ? "#f2b726" : "#a45cff") : T.env;
        ctx.beginPath(); ctx.ellipse(sx, sy, bonus ? ry * 1.1 : rx, bonus ? ry * 1.3 : ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = T.dark; ctx.lineWidth = 3 * k; ctx.stroke();
        ctx.fillStyle = "#4d2f1a"; ctx.fillRect(sx - 0.7 * BS * ppu, sy + 1.25 * BS * ppu, 1.4 * BS * ppu, 0.45 * BS * ppu);
        if (!bonus) {
          const bw = 5.2 * BS * ppu, bh = 1.26 * BS * ppu;
          ctx.fillStyle = "#fbf3df"; ctx.beginPath(); ctx.roundRect(sx - bw / 2, sy - bh / 2, bw, bh, 10 * k); ctx.fill(); ctx.strokeStyle = "#3a1f0e"; ctx.lineWidth = 3 * k; ctx.stroke();
          ctx.fillStyle = "#2a1608"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; drawLines(ctx, wrapFit(ctx, word, bw - 16 * k, bh - 6 * k, 46 * k, 12 * k), sx, sy + 2 * k);
        } else { ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(34 * k)}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(bonus === "x2" ? "×2" : bonus === "time" ? "+10s" : "+10", sx, sy); }
        hits.push({ id, x: sx, y: sy, rx: rx * 1.1, ry: ry * 1.7 });
      }
    }
    // đầu thanh: đội · điểm · thanh giờ
    ctx.fillStyle = T.css; ctx.fillRect(0, 0, W, head);
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.font = `800 ${Math.round(32 * k)}px ${FONT}`;
    ctx.textAlign = "left"; ctx.fillText(T.name, 22 * k, head / 2);
    ctx.textAlign = "right"; ctx.fillText(String(St ? St.sc : 0), W - 22 * k, head / 2);
    ctx.textAlign = "center"; ctx.font = `700 ${Math.round(22 * k)}px ${FONT}`;
    const msg = !St ? "" : St.out ? "TIME'S UP — your train is out" : St.st === "play" ? (St.lvn ? `LEVEL ${St.lvn} · tap a balloon to drop its box` : "Tap a balloon to drop its box") : St.st === "clear" || St.st === "gone" ? "✓ Train full — wait for the other team" : "";
    ctx.fillText(msg, W / 2, head / 2);
    if (St && St.tt) {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, head, W, 10 * k);
      ctx.fillStyle = St.out ? "#ff7b6b" : "#ffd34d"; ctx.fillRect(0, head, W * Math.max(0, Math.min(1, St.tl / St.tt)), 10 * k);
    }
    // đèn nối
    const s = link.s; ctx.fillStyle = s === "on" ? "#5dff7a" : s === "relay" ? "#ffd34d" : "#ffa04d";
    ctx.beginPath(); ctx.arc(W - 14 * k, H - 14 * k, 7 * k, 0, Math.PI * 2); ctx.fill();
    if (flash) { const a = 1 - (performance.now() - flash.t) / 450; if (a <= 0) flash = null; else { ctx.fillStyle = flash.c + (0.35 * a) + ")"; ctx.fillRect(0, head, W, H - head); } }
  }
  function overlay() {
    let big = "", small = "";
    const s = link.s;
    if (s === "nogame") { big = "Waiting for the game"; small = "Open TRAIN RUSH ▸ Mode ▸ Fight on the big screen."; }
    else if (s === "taken") { big = `${T.name} already has an iPad`; small = "Choose the other team, or wait — this iPad joins when the other one leaves."; }
    else if (s === "kicked") { big = "Another iPad took this team"; small = "Tap to take it back."; }
    else if (s === "connecting" && !St) { big = "Connecting…"; small = ""; }
    else if (St && St.mode === "off") { big = "iPad is OFF"; small = "The teacher turned iPads off — play on the big screen."; }
    else if (St && (St.ph === "start" || St.ph === "intro" || St.ph === "count" || St.ph === "load")) { big = St.ph === "count" ? "Get ready…" : "Waiting for START"; small = `You are ${T.name}.`; }
    else if (St && St.ph === "over") { big = endEv === "win" ? "YOU WIN!" : endEv === "lose" ? "GOOD TRY!" : endEv === "draw" ? "DRAW!" : "GAME OVER"; small = `${T.name}: ${St.sc} points`; }
    ov.hidden = !big;
    if (big) { ov.querySelector(".trp-big").textContent = big; ov.querySelector(".trp-small").textContent = small; }
  }
  function loop(ts) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    draw(); overlay();
  }
  raf = requestAnimationFrame(loop);
  cv.addEventListener("pointerdown", e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
    const h = hits.find(q => ((x - q.x) / q.rx) ** 2 + ((y - q.y) / q.ry) ** 2 <= 1);
    if (!h || !St || St.st !== "play" || St.mode === "off") return;
    if (client.send("pop:" + h.id)) { popped.add(h.id); beep(520, 0.08, "triangle", 0.14); buzz(15); }
  });
  ov.addEventListener("click", () => { if (link.s === "kicked") client.reconnect(); });
  return {
    get state() { return { link, St, L }; },
    get hits() { return hits; },   // bàn thử: vùng chạm khinh khí cầu (toạ độ canvas)
    tap(id) { const h = hits.find(q => q.id === id); if (!h) return false; const r = cv.getBoundingClientRect();   // bàn thử: chạm THẬT (pointerdown) vào giữa quả
      cv.dispatchEvent(new PointerEvent("pointerdown", { clientX: r.left + h.x / cv.width * r.width, clientY: r.top + h.y / cv.height * r.height, bubbles: true })); return true; },
    destroy() { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", fit); client.destroy(); el.innerHTML = ""; if (onLeave) onLeave(); },
  };
}
