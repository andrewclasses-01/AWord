// RACING WORDS mẫu 4v (19/10/2026) = padui-4u + NEAR / FAR = DỜI DRONE (NEAR tiến lại gần xe · FAR lùi xa) · ô lái kéo DỌC = tâm xa / gần (gửi như chúc) · chữ IN SIGHT thay LOCK.
// RACING WORDS mẫu 4u (19/10/2026) = padui-4l + LÁI NGHIÊNG 4 HƯỚNG (thầy: "di chuyển iPad theo các hướng ⇒ drone nghiêng + tâm ngắm đổi chỗ"):
//   cầm iPad như VÔ LĂNG Ô TÔ (màn ngả ra sau ~25°) = tư thế 0 ⇒ tâm đứng yên · xoay trái / phải = tâm sang trái / phải · ngả mép trên RA XA = tâm ra xa · kéo mép trên VỀ = tâm lại gần.
//   Nghiêng càng nhiều tâm chạy càng nhanh (vùng chết 3–4°, hết cỡ 22° ngang / 18° chúc). Nút LEVEL = lấy tư thế đang cầm làm tư thế 0. Vòng nhỏ có chấm = hướng đang nghiêng.
//   Gửi client.drive(ngang, FAR, NEAR, chúc, đang nghiêng) — padlink-4u.
// RACING WORDS mẫu 4l (19/10/2026) — iPAD THỨ 3 = BẢNG LÁI DRONE (thiết kế thiet-ke-4k-drone-v2.html mục 5) + màn chọn vai 3 nút (TEAM 1 · TEAM 2 · DRONE).
//   iPad đội vẫn dùng mountPadApp của 4j (xuất lại ở đây). Bảng drone, kiểu phẳng:
//   · trên: ◀ về · DRONE + chế độ · trạng thái nối + độ trễ · nút TILT (bật / tắt nghiêng) · thanh pin
//   · trái: 3 thẻ đạn HEART / BOOST / MISSILE (chạm = chọn, gửi "d0..d2"; đạn bị tắt ở màn lớn ⇒ mờ)
//   · giữa: Ô LÁI TÂM — kéo ngón tay: ngang = tâm trái / phải, dọc = xa / gần (cần điều khiển tương đối, buông = đứng yên); dòng khoá "LOCK · TEAM 2"
//   · phải: nút FIRE to, màu đạn đang chọn
//   · dưới: NEAR (chỗ phanh) · FAR (chỗ ga) như iPad xe. Nghiêng iPad (cầm ngang như vô lăng) = tâm trái / phải.
//   Gửi qua client.drive(ngang, xa, gần) — cùng khung "s:" của xe; game đọc ngang là tốc độ dời tâm.
import { mountPadApp as mountTeamApp } from "./sr3d-padui-4j.js";
import { TEAM_META, DRONE_META } from "./sr3d-padlink-4u.js";   /* 4u */

export const mountPadApp = mountTeamApp;
const AMMO = [{ k: "heart", t: "HEART", c: "#ff5fa2", i: "❤" }, { k: "boost", t: "BOOST", c: "#2ee6c9", i: "⚡" }, { k: "missile", t: "MISSILE", c: "#ff4d5e", i: "▲" }];
const MODE_T = { neutral: "NEUTRAL", losing: "HELPS THE LOSING TEAM", team: "TEAM DRONE" };
const TXT = { on: "Connected", relay: "SLOW link — reconnecting…", connecting: "Connecting…", nogame: "Waiting for the game", taken: "Drone taken" };
const CSS = `
.dp{position:fixed;inset:0;background:#0b0f15;color:#e7eef8;font-family:"Exo 2",system-ui,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;overflow:hidden;
  display:grid;grid-template-rows:auto 1fr auto;gap:1.6vmin;padding:max(1.6vmin,env(safe-area-inset-top)) max(2vmin,env(safe-area-inset-right)) max(1.6vmin,env(safe-area-inset-bottom)) max(2vmin,env(safe-area-inset-left));--dc:#b07cff;--ac:#ff5fa2}
.dp-top{display:flex;align-items:center;gap:1.6vmin}
.dp-back{width:6vmin;height:6vmin;border-radius:1.4vmin;border:0;background:#1a222e;color:#fff;font:900 3vmin "Exo 2"}
.dp-name{font:italic 900 4.4vmin/1 "Exo 2";letter-spacing:.12em;color:var(--dc)}
.dp-mode{font:800 1.9vmin "Exo 2";letter-spacing:.14em;color:#8d9bb0}
.dp-st{display:flex;align-items:center;gap:.8vmin;font:700 1.9vmin "Exo 2";color:#8d9bb0}
.dp-st i{width:1.4vmin;height:1.4vmin;border-radius:50%;background:#555}
.dp[data-s=on] .dp-st i{background:#38d39f}.dp[data-s=relay] .dp-st i{background:#f5c542}.dp[data-s=connecting] .dp-st i{background:#f5c542}
.dp-tilt{margin-left:auto;font:900 1.9vmin "Exo 2";letter-spacing:.1em;color:#cfd6e2;background:#1a222e;border:.3vmin solid rgba(255,255,255,.14);border-radius:1.2vmin;padding:1.1vmin 1.8vmin}
.dp-tilt.on{background:color-mix(in srgb,var(--dc) 28%,#1a222e);border-color:var(--dc);color:#fff}
.dp-bat{width:26vmin;display:flex;flex-direction:column;gap:.6vmin;font:800 1.6vmin "Exo 2";letter-spacing:.14em;color:#8d9bb0}
.dp-bat i{display:block;height:1.2vmin;border-radius:1vmin;background:rgba(255,255,255,.12);overflow:hidden}.dp-bat em{display:block;height:100%;background:var(--dc);transform-origin:0 50%;transition:transform .25s linear}
.dp-mid{display:grid;grid-template-columns:30vmin 1fr 30vmin;gap:2vmin;min-height:0}
.dp-ammo{display:grid;grid-template-rows:repeat(3,1fr);gap:1.4vmin}
.dp-a{display:flex;align-items:center;gap:1.6vmin;padding:0 2vmin;border-radius:2.2vmin;border:.3vmin solid rgba(255,255,255,.1);background:#16202b;color:#fff;font:italic 900 3.4vmin "Exo 2";text-align:left}
.dp-a b{font-style:normal;font-size:4.6vmin;color:var(--c);width:5vmin;text-align:center}
.dp-a.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 18%,#16202b)}
.dp-a.off{opacity:.3}
.dp-pad{position:relative;border-radius:2.6vmin;background:#121a24;border:.3vmin solid rgba(176,124,255,.3);overflow:hidden;touch-action:none}
.dp-pad::before{content:"";position:absolute;left:50%;top:8%;bottom:8%;width:.3vmin;background:rgba(255,255,255,.08)}
.dp-pad::after{content:"";position:absolute;top:50%;left:8%;right:8%;height:.3vmin;background:rgba(255,255,255,.08)}
.dp-knob{position:absolute;left:50%;top:50%;width:13vmin;height:13vmin;margin:-6.5vmin 0 0 -6.5vmin;border-radius:50%;border:.5vmin solid var(--ac);background:color-mix(in srgb,var(--ac) 14%,transparent);will-change:transform}
.dp-knob::before,.dp-knob::after{content:"";position:absolute;background:var(--ac);border-radius:.3vmin}
.dp-knob::before{left:50%;top:-2vmin;bottom:-2vmin;width:.5vmin;margin-left:-.25vmin}.dp-knob::after{top:50%;left:-2vmin;right:-2vmin;height:.5vmin;margin-top:-.25vmin}
.dp-lock{position:absolute;left:0;right:0;top:2.4vmin;text-align:center;font:italic 900 2.6vmin "Exo 2";letter-spacing:.08em;pointer-events:none}
.dp-hint{position:absolute;left:0;right:0;bottom:2vmin;text-align:center;font:700 1.7vmin "Exo 2";color:#8d9bb0;pointer-events:none}
.dp-fire{border-radius:2.6vmin;border:.4vmin solid var(--ac);background:color-mix(in srgb,var(--ac) 16%,#121a24);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1vmin}
.dp-fire b{font:italic 900 7vmin/1 "Exo 2"}.dp-fire small{font:800 2vmin "Exo 2";letter-spacing:.1em;color:var(--ac)}
.dp-fire:active,.dp-fire.hit{transform:scale(.96);background:color-mix(in srgb,var(--ac) 32%,#121a24)}
.dp-fire.dim{opacity:.4}
.dp-bot{display:flex;justify-content:space-between;align-items:flex-end;gap:2vmin}
.dp-ped{width:30vmin;height:15vmin;border-radius:2.4vmin;border:.3vmin solid rgba(255,255,255,.12);background:#1a222e;color:#fff;font:italic 900 3.4vmin "Exo 2";display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4vmin}
.dp-ped small{font:700 1.6vmin "Exo 2";font-style:normal;color:#8d9bb0}
.dp-ped.down{background:color-mix(in srgb,var(--dc) 30%,#1a222e);border-color:var(--dc)}
.dp-tiltv{flex:1;display:flex;align-items:center;justify-content:center;gap:1.6vmin;font:800 2vmin "Exo 2";letter-spacing:.1em;color:#8d9bb0;align-self:center}
.dp-tring{position:relative;width:9vmin;height:9vmin;border-radius:50%;border:.3vmin solid rgba(255,255,255,.18);flex:none}.dp-tring:before,.dp-tring:after{content:"";position:absolute;background:rgba(255,255,255,.12)}
.dp-tring:before{left:50%;top:10%;bottom:10%;width:.2vmin}.dp-tring:after{top:50%;left:10%;right:10%;height:.2vmin}
.dp-tdot{position:absolute;left:50%;top:50%;width:2.2vmin;height:2.2vmin;margin:-1.1vmin;border-radius:50%;background:var(--ac);box-shadow:0 0 1.6vmin var(--ac)}
.dp-level{font:900 1.7vmin "Exo 2";letter-spacing:.1em;color:#cfd6e2;background:#1a222e;border:.3vmin solid rgba(255,255,255,.14);border-radius:1.2vmin;padding:1vmin 1.4vmin}
.dp:not(.tilting) .dp-tring,.dp:not(.tilting) .dp-level{display:none}
.dp-off{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(11,15,21,.92);font:italic 900 4vmin "Exo 2";color:#8d9bb0;text-align:center;padding:4vmin}
.dp[data-on="0"] .dp-off{display:flex}
.ipc-b.ipc-d{--tc:#b07cff}
`;
let styled = false;
function style() { if (styled) return; styled = true; const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); }
const noGestures = root => ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false }));

/** Màn chọn vai: TEAM 1 · TEAM 2 · DRONE. setBusy([b0, b1, b2]) */
export function mountPadChooser(mount, { onPick }) {
  style();
  // dùng lại kiểu .ipc của padui-4j (đã chèn CSS khi mountPadApp chạy lần đầu) ⇒ ở đây tự vẽ, kiểu riêng gọn
  mount.innerHTML = `<div class="dp" style="grid-template-rows:auto auto 1fr;justify-items:center;text-align:center">
    <div class="dp-name" style="margin-top:6vmin">RACING WORDS · iPad</div><div class="dp-mode" style="margin-top:1vmin">CHOOSE THIS iPAD'S ROLE</div>
    <div style="display:flex;gap:2.4vmin;margin-top:5vmin;align-self:start;flex-wrap:wrap;justify-content:center">
      ${[...TEAM_META, DRONE_META].map((m, t) => `<button type="button" class="dp-role" data-t="${t}" style="--c:${m.color};width:28vmin;height:20vmin;border-radius:2.6vmin;border:.4vmin solid var(--c);background:color-mix(in srgb,var(--c) 14%,#121a24);color:#fff;font:italic 900 4.4vmin 'Exo 2';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1vmin">${m.name}<small style="font:700 1.7vmin 'Exo 2';font-style:normal;color:#cfd6e2">${t === 2 ? "fly the drone" : "drive / answer"}</small></button>`).join("")}
    </div><p class="dp-msg" style="font:700 2vmin 'Exo 2';color:#f5c542;min-height:3vmin"></p></div>`;
  let busy = [false, false, false];
  const msg = mount.querySelector(".dp-msg");
  mount.querySelectorAll(".dp-role").forEach(b => b.addEventListener("click", () => {
    const t = +b.dataset.t, nm = t === 2 ? DRONE_META.name : TEAM_META[t].name;
    if (busy[t]) { msg.textContent = nm + " already has an iPad."; return; }
    onPick(t);
  }));
  noGestures(mount.firstElementChild);
  return {
    setBusy(b) {
      busy = [0, 1, 2].map(k => !!(b && b[k]));
      mount.querySelectorAll(".dp-role").forEach(el => { const t = +el.dataset.t; el.style.opacity = busy[t] ? ".35" : ""; el.querySelector("small").textContent = busy[t] ? "iPad already connected" : t === 2 ? "fly the drone" : "drive / answer"; });
      if (!busy.some(Boolean)) msg.textContent = "";
    }
  };
}

/** Bảng lái drone. Trả { setState, setDrone, tiltDebug, state } */
export function mountDroneApp(mount, { client, onBack }) {
  style();
  mount.innerHTML = `<div class="dp" data-s="connecting" data-on="1">
    <div class="dp-top"><button type="button" class="dp-back" aria-label="Back">◀</button>
      <div><div class="dp-name">DRONE</div><div class="dp-mode"></div></div>
      <div class="dp-st"><i></i><span>Connecting…</span><em class="dp-rtt"></em></div>
      <button type="button" class="dp-tilt">TILT</button>
      <div class="dp-bat"><span>BATTERY <b class="dp-batn">100 %</b></span><i><em></em></i></div></div>
    <div class="dp-mid">
      <div class="dp-ammo">${AMMO.map((a, k) => `<button type="button" class="dp-a" data-k="${k}" style="--c:${a.c}"><b>${a.i}</b>${a.t}</button>`).join("")}</div>
      <div class="dp-pad"><div class="dp-lock">AIM ON THE ROAD</div><div class="dp-knob"></div><div class="dp-hint">Drag to move the aim · left / right · far / near</div></div>
      <button type="button" class="dp-fire"><b>FIRE</b><small></small></button>
    </div>
    <div class="dp-bot"><button type="button" class="dp-ped dp-near">▲ NEAR<small>drone closer</small></button><div class="dp-tiltv"><div class="dp-tring"><i class="dp-tdot"></i></div><span class="dp-ttx"></span><button type="button" class="dp-level">LEVEL</button></div><button type="button" class="dp-ped dp-far">FAR ▼<small>drone back</small></button></div>
    <div class="dp-off">The drone is OFF on the big screen.<br>Turn it on in ⚙ Settings ▸ Drone.</div>
  </div>`;
  const root = mount.firstElementChild, $ = s => root.querySelector(s);
  const pad = $(".dp-pad"), knob = $(".dp-knob"), fireB = $(".dp-fire"), cards = [...root.querySelectorAll(".dp-a")], lockEl = $(".dp-lock");
  let sel = 0, ammoOn = [true, true, true], lock = -1, joy = null, jx = 0, jy = 0, near = false, far = false, tiltOn = false, tiltX = 0, info = null;
  const TL = { ref: null, gl: null, phi: 0, debug: null, ev: 0, th: 0, th0: 25, zs: 0, flat: false, dbgP: null };   // 4u: th = góc ngả màn (°, + = ngả ra sau) · th0 = tư thế 0 (vô lăng ô tô ~25°) · zs = dấu trục z
  function paintSel() {
    cards.forEach((c, k) => { c.classList.toggle("on", k === sel); c.classList.toggle("off", !ammoOn[k]); });
    root.style.setProperty("--ac", AMMO[sel] ? AMMO[sel].c : "#ffffff");
    fireB.querySelector("small").textContent = AMMO[sel] ? AMMO[sel].t + (lock >= 0 ? " → " + TEAM_META[lock].name : " → ROAD") : "";
  }
  cards.forEach((c, k) => c.addEventListener("pointerdown", e => { e.preventDefault(); if (!ammoOn[k]) return; sel = k; paintSel(); client.send("d" + k); }));
  fireB.addEventListener("pointerdown", e => { e.preventDefault(); fireB.classList.add("hit"); setTimeout(() => fireB.classList.remove("hit"), 140); client.send("fire"); });
  // ô lái tâm: cần điều khiển tương đối (lệch từ chỗ đặt ngón, tối đa 12 vmin)
  const R = () => Math.min(innerWidth, innerHeight) * 0.12;
  pad.addEventListener("pointerdown", e => { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (x) { /* */ } joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  pad.addEventListener("pointermove", e => { if (!joy || e.pointerId !== joy.id) return; const r = R(); jx = Math.max(-1, Math.min(1, (e.clientX - joy.x) / r)); jy = Math.max(-1, Math.min(1, (e.clientY - joy.y) / r)); });
  const up = e => { if (joy && e.pointerId === joy.id) { joy = null; jx = jy = 0; } };
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => pad.addEventListener(n, up));
  const hold = (el, f) => { el.addEventListener("pointerdown", e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } f(true); el.classList.add("down"); }); ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => el.addEventListener(n, () => { f(false); el.classList.remove("down"); })); };
  hold($(".dp-near"), v => { near = v; }); hold($(".dp-far"), v => { far = v; });
  // nghiêng: cầm ngang như vô lăng — góc so với trục trọng lực lúc bắt đầu (mốc tự lấy), ±22° = hết cỡ, vùng chết 3°
  const landscape = () => { const o = screen.orientation && screen.orientation.type; return o ? o.startsWith("landscape") : innerWidth > innerHeight; };
  const onMotion = e => {
    if (TL.debug != null) return;
    const g = e.accelerationIncludingGravity; if (!g || g.x == null) return; TL.ev++;
    const gz = g.z || 0;
    TL.gl = TL.gl ? { x: TL.gl.x + (g.x - TL.gl.x) * 0.4, y: TL.gl.y + (g.y - TL.gl.y) * 0.4, z: TL.gl.z + (gz - TL.gl.z) * 0.4 } : { x: g.x, y: g.y, z: gz };
    // 4u: góc NGẢ màn = asin(z / |g|). Dấu z khác nhau giữa máy ⇒ lấy lúc bật: coi tư thế đang cầm là màn NGỬA (như vô lăng) ⇒ th dương
    const m3 = Math.hypot(TL.gl.x, TL.gl.y, TL.gl.z);
    if (m3 > 4) { if (!TL.zs) TL.zs = Math.abs(TL.gl.z) / m3 > 0.12 ? Math.sign(TL.gl.z) : -1; TL.th = Math.asin(Math.max(-1, Math.min(1, TL.zs * TL.gl.z / m3))) * 180 / Math.PI; }
    const m = Math.hypot(TL.gl.x, TL.gl.y); TL.flat = m3 > 4 && m / m3 < 0.5; if (m < 1) return;   // gần nằm phẳng (ngả > 60°) ⇒ góc vô lăng nhiễu ⇒ tạm ngưng lái ngang
    if (!TL.ref && m > 4) { const v = landscape() ? TL.gl.x : TL.gl.y; TL.ref = landscape() ? { x: Math.sign(v) || 1, y: 0 } : { x: 0, y: Math.sign(v) || 1 }; }
    if (!TL.ref) return;
    const nx = TL.gl.x / m, ny = TL.gl.y / m; TL.phi = Math.atan2(TL.ref.x * ny - TL.ref.y * nx, TL.ref.x * nx + TL.ref.y * ny) * 180 / Math.PI;
  };
  const relevel = () => { TL.ref = null; };
  window.addEventListener("orientationchange", relevel); if (screen.orientation) screen.orientation.addEventListener("change", relevel);
  async function tiltToggle() {
    if (!tiltOn) {
      try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function" && (await DeviceMotionEvent.requestPermission()) !== "granted") { $(".dp-tiltv").textContent = "ALLOW MOTION IN SAFARI"; return; } }
      catch (e) { $(".dp-tiltv").textContent = "TILT NEEDS HTTPS"; return; }
      window.addEventListener("devicemotion", onMotion); TL.ref = null; TL.zs = 0;
    } else window.removeEventListener("devicemotion", onMotion);
    tiltOn = !tiltOn; $(".dp-tilt").classList.toggle("on", tiltOn); root.classList.toggle("tilting", tiltOn); try { localStorage.setItem("rwdrone.tilt", tiltOn ? "1" : "0"); } catch (e) { /* */ }
  }
  $(".dp-tilt").addEventListener("click", tiltToggle);
  // 4u: LEVEL — tư thế đang cầm thành tư thế 0 (cả xoay lẫn ngả)
  $(".dp-level").addEventListener("click", () => { TL.ref = null; TL.th0 = TL.dbgP != null ? 25 : Math.max(-10, Math.min(60, TL.th)); try { localStorage.setItem("rwdrone.th0", String(TL.th0)); } catch (e) { /* */ } });
  try { const v = parseFloat(localStorage.getItem("rwdrone.th0")); if (isFinite(v)) TL.th0 = v; } catch (e) { /* */ }
  try { if (localStorage.getItem("rwdrone.tilt") === "1" && !(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function")) tiltToggle(); } catch (e) { /* */ }
  // vòng gửi: ngang = cần (ưu tiên) hoặc nghiêng · xa / gần = cần dọc hoặc bàn đạp
  let raf = 0, kx = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const d = TL.debug != null ? TL.debug : TL.phi;
    tiltX = tiltOn && !TL.flat ? (Math.abs(d) < 3 ? 0 : Math.max(-1, Math.min(1, (d - Math.sign(d) * 3) / 19))) : 0;
    const dp = (TL.dbgP != null ? TL.dbgP + TL.th0 : TL.th) - TL.th0;                              // 4u: + = ngả mép trên ra xa (tâm ra xa)
    const tiltY = tiltOn ? (Math.abs(dp) < 4 ? 0 : Math.max(-1, Math.min(1, (dp - Math.sign(dp) * 4) / 14))) : 0;
    const sx = joy ? jx : tiltX, fv = far ? 1 : 0, nv = near ? 1 : 0, py = joy ? -jy : tiltY;   // 4v: NEAR / FAR chỉ dời drone · kéo dọc = tâm xa / gần
    const k = sx.toFixed(2); if (k !== kx) { kx = k; knob.style.transform = `translate(${(jx * R()).toFixed(1)}px, ${(jy * R()).toFixed(1)}px)`; }
    if (!joy) knob.style.transform = "translate(0,0)";
    { const tx = !tiltOn ? "" : TL.flat ? "HOLD IT UP" : !tiltX && !tiltY ? "STEADY" : (tiltY > 0 ? "FAR " : tiltY < 0 ? "NEAR " : "") + (tiltX < 0 ? "◀" : tiltX > 0 ? "▶" : "");
      const tt = $(".dp-ttx"); if (tt.textContent !== tx) tt.textContent = tx;
      if (tiltOn) $(".dp-tdot").style.transform = `translate(${(tiltX * 3.4).toFixed(2)}vmin, ${(-tiltY * 3.4).toFixed(2)}vmin)`; }   // 4u: chấm trong vòng = hướng đang nghiêng
    client.drive(sx, fv, nv, py, tiltOn && !joy);
  }
  raf = requestAnimationFrame(loop);
  $(".dp-back").addEventListener("click", () => { cancelAnimationFrame(raf); window.removeEventListener("devicemotion", onMotion); onBack && onBack(); });
  noGestures(root);
  let wl = null; const keep = async () => { if (wl || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { wl = await navigator.wakeLock.request("screen"); wl.addEventListener("release", () => { wl = null; }); } catch (e) { /* */ } };
  keep(); document.addEventListener("visibilitychange", keep);
  paintSel();
  return {
    setState({ s, rtt }) { root.dataset.s = s; $(".dp-st span").textContent = TXT[s] || ""; $(".dp-rtt").textContent = s === "on" && rtt ? " · " + rtt + " ms" : ""; },
    setDrone(j) {
      info = j; root.dataset.on = j.on ? "1" : "0";
      ammoOn = j.ammo; if (j.sel >= 0 && j.sel !== sel) sel = j.sel; lock = j.lock;
      root.style.setProperty("--dc", j.mode === "team" ? TEAM_META[j.team].color : DRONE_META.color);
      $(".dp-mode").textContent = j.mode === "team" ? TEAM_META[j.team].name + " DRONE" : MODE_T[j.mode] || "";
      $(".dp-bat em").style.transform = `scaleX(${Math.max(0, Math.min(1, j.bat)).toFixed(3)})`; $(".dp-batn").textContent = Math.round(j.bat * 100) + " %";
      lockEl.textContent = lock >= 0 ? "IN SIGHT · " + TEAM_META[lock].name : "AIM ON THE ROAD"; lockEl.style.color = lock >= 0 ? TEAM_META[lock].color : "";
      fireB.classList.toggle("dim", j.phase !== "race");
      paintSel();
    },
    tiltDebug(deg, pdeg) { TL.debug = deg; TL.dbgP = pdeg == null ? null : pdeg; if (!tiltOn && deg != null) { tiltOn = true; $(".dp-tilt").classList.add("on"); root.classList.add("tilting"); } },   // 4u: + góc ngả giả (so với tư thế 0)
    get state() { return { sel, jx, jy, tiltOn, phi: TL.phi, th: TL.th, th0: TL.th0, flat: TL.flat, ev: TL.ev, info }; },
  };
}
