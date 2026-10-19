// RACING WORDS mẫu 5b (19/10/2026) = padui-5a + thầy: "cần và đế cần xấu ⇒ bỏ; tay điều khiển LƠ LỬNG giữa, coi như gắn vào 1 cái cần có trục VUÔNG GÓC với tay điều khiển
//   (đâm thẳng vào màn) · ANDREW STUDIO nhỏ + thấp hơn · NEAR / FAR chỉ là icon TIẾN / LÙI to đẹp, không chữ".
//   Vô lăng to hơn (≤ 58 % bề ngang), tâm giữa vùng lái; sau trục có ĐẦU CẦN tròn nhìn thẳng (vòng kim loại + lõi tối + quầng tím) co / giãn theo đẩy kéo ⇒ cảm giác sâu.
//   Đẩy ra = vô lăng lùi xa (nhỏ lại + ngả), kéo về = lại gần (to ra). NEAR = 2 mũi tên LÊN (tiến lại gần xe) · FAR = 2 mũi tên XUỐNG (lùi xa), nhấn ⇒ mũi tên chạy.
// ---- gốc 5a ----
// RACING WORDS mẫu 5a (19/10/2026) — BẢNG LÁI DRONE MỚI kiểu "A · AERO YOKE" (thầy chọn ở thiet-ke-4z-ban-lai-drone.html) + thầy chỉnh:
//   · CHÂN cần lái CỐ ĐỊNH như cần lái thật: hộp chân đế + ống xếp cao su đứng yên dưới đáy; chỉ VÔ LĂNG lăn trái / phải và bị đẩy ra / kéo về (chúc / ngóc),
//     cột lái nối từ chân đế lên trục vô lăng dài / ngắn theo đẩy kéo — không bao giờ lăn theo vô lăng.
//   · hàng cuối có dòng ANDREW STUDIO nhỏ, kim loại + quầng tím.
//   · thẻ đạn có VÒNG HỒI CHIÊU thật + mờ khi thiếu pin (game gửi thêm thời gian chờ từng loại + cờ "đạn đang bay" — padlink-5a).
//   Logic lái giữ nguyên padui-4x: nghiêng iPad 4 hướng (tư thế vô lăng = 0, LEVEL) · kéo ngón trên vùng cần lái = ngắm · NEAR / FAR giữ = dời drone · chạm thẻ = chọn đạn · FIRE.
//   Kích thước theo bề ngang màn (cqw) như trang thiết kế ⇒ iPad 4:3 / 16:10 đều cân.
import { mountPadApp, mountPadChooser } from "./sr3d-padui-4x.js";
import { TEAM_META, DRONE_META } from "./sr3d-padlink-5a.js";
import { icon as ICON } from "./rw-icons-4x.js";
export { mountPadApp, mountPadChooser };

const AMMO = [{ k: "heart", t: "HEART", c: "#ff63c3", cost: 0.40, cd: 4 }, { k: "boost", t: "BOOST", c: "#2ee6c9", cost: 0.25, cd: 3 }, { k: "missile", t: "MISSILE", c: "#ff2020", cost: 0.35, cd: 3 }];
const MODE_T = { neutral: "NEUTRAL", losing: "HELPS THE LOSING TEAM", team: "TEAM DRONE" };
const TXT = { on: "CONNECTED", relay: "SLOW LINK — RECONNECTING", connecting: "CONNECTING…", nogame: "WAITING FOR THE GAME", taken: "DRONE TAKEN" };
const CSS = `
.dq{position:fixed;inset:0;container-type:inline-size;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;color:#e9edf6;font-family:"Exo 2",system-ui,sans-serif;
  background:radial-gradient(90vw 60vw at 50% 30%,#1b1f2b,#0a0c12 70%);--dc:#b07cff;--ac:#ff63c3;--r:0;--p:0}
.dq::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.018) 0 .5vw,transparent .5vw 1vw);pointer-events:none}
.dq-in{position:absolute;inset:0;display:grid;grid-template-rows:9.5cqw 1fr 12.5cqw;gap:1.5cqw;
  padding:max(1.6cqw,env(safe-area-inset-top)) max(2cqw,env(safe-area-inset-right)) max(1.4cqw,env(safe-area-inset-bottom)) max(2cqw,env(safe-area-inset-left))}
.dq-bar{display:flex;align-items:center;gap:1.6cqw;min-width:0}
.dq-back,.dq-chip{background:#1a1f2b;border:.15cqw solid rgba(255,255,255,.1);color:#fff;cursor:pointer}
.dq-back{width:5.4cqw;height:5.4cqw;border-radius:1.4cqw;font:900 2.3cqw "Exo 2";flex:none}
.dq-ttl{display:flex;flex-direction:column;gap:.5cqw;line-height:1}
.dq-ttl b{font:italic 900 3.6cqw "Exo 2";letter-spacing:.1em;color:var(--dc);text-shadow:0 0 2cqw color-mix(in srgb,var(--dc) 45%,transparent)}
.dq-ttl small{font:800 1.25cqw "Exo 2";letter-spacing:.18em;color:#8e9bb0}
.dq-st{display:flex;align-items:center;gap:.7cqw;font:700 1.3cqw "Exo 2";letter-spacing:.08em;color:#8e9bb0;white-space:nowrap}
.dq-st i{width:1cqw;height:1cqw;border-radius:50%;background:#555;flex:none}
.dq[data-s=on] .dq-st i{background:#38d39f;box-shadow:0 0 1cqw #38d39f}.dq[data-s=relay] .dq-st i,.dq[data-s=connecting] .dq-st i{background:#f5c542;box-shadow:0 0 1cqw #f5c542}
.dq-sp{flex:1}
.dq-chip{font:900 1.3cqw "Exo 2";letter-spacing:.14em;padding:.9cqw 1.4cqw;border-radius:1cqw}
.dq-chip.on{background:color-mix(in srgb,var(--dc) 30%,#1a1f2b);border-color:var(--dc)}
.dq:not(.tilting) .dq-level{display:none}
.dq-bat{width:22cqw;display:flex;flex-direction:column;gap:.6cqw;font:800 1.2cqw "Exo 2";letter-spacing:.16em;color:#8e9bb0}
.dq-bat div{display:flex;justify-content:space-between}.dq-bat b{color:#fff}
.dq-bat i{display:block;height:1cqw;border-radius:1cqw;overflow:hidden;background:rgba(255,255,255,.1)}
.dq-bat em{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7c4dff,var(--dc));box-shadow:0 0 1cqw var(--dc);transform-origin:0 50%;transition:transform .3s linear}
.dq-bat.low em{background:linear-gradient(90deg,#ff3b30,#ff8a3d);box-shadow:0 0 1cqw #ff3b30}
.dq-mid{display:grid;grid-template-columns:21cqw 1fr 21cqw;gap:1.8cqw;min-height:0}
.dq-ammo{display:flex;flex-direction:column;gap:1.2cqw;min-height:0}
.dq-a{flex:1;position:relative;display:flex;align-items:center;gap:1.4cqw;padding:0 1.6cqw;border-radius:1.8cqw;cursor:pointer;text-align:left;
  background:linear-gradient(180deg,#171c27,#10141c);border:.18cqw solid rgba(255,255,255,.07);color:#dfe6f2;font:italic 900 1.9cqw "Exo 2";letter-spacing:.1em;
  transition:transform .22s cubic-bezier(.22,.9,.3,1),background .25s,border-color .25s,box-shadow .25s,opacity .25s}
.dq-a .ic{position:relative;width:6cqw;height:6cqw;display:grid;place-items:center;font-size:3.3cqw;flex:none}
.dq-a .ic::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(var(--c) calc((1 - var(--cd,0)) * 360deg),rgba(255,255,255,.08) 0);
  -webkit-mask:radial-gradient(circle,transparent 62%,#000 64%);mask:radial-gradient(circle,transparent 62%,#000 64%)}
.dq-a .nm{display:flex;flex-direction:column;gap:.4cqw}.dq-a .nm small{font:700 1.1cqw "Exo 2";font-style:normal;letter-spacing:.14em;opacity:.65}
.dq-a.on{transform:translateX(.6cqw);border-color:var(--c);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 22%,#141924),#10141c);
  box-shadow:0 0 2.4cqw color-mix(in srgb,var(--c) 30%,transparent),0 0 0 .1cqw var(--c) inset}
.dq-a.wait .nm small{opacity:1;color:#f5c542}.dq-a.off{opacity:.28}
.dq-pad{position:relative;min-height:0;cursor:grab;touch-action:none}
.dq-lock{position:absolute;top:.4cqw;left:0;right:0;text-align:center;font:italic 900 1.5cqw "Exo 2";letter-spacing:.16em;color:#9fb0c6;white-space:nowrap;z-index:3;pointer-events:none}
/* 5b: VÔ LĂNG LƠ LỬNG giữa vùng lái, gắn vào cần có trục vuông góc màn (chỉ thấy đầu cần tròn phía sau trục) */
.dq-colend{position:absolute;left:50%;top:52%;width:15cqw;height:15cqw;border-radius:50%;z-index:1;pointer-events:none;will-change:transform;
  transform:translate(-50%,-50%) scale(calc(1 - var(--p) * .1));background:radial-gradient(circle,#05070b 0 34%,#3a4150 36%,#14171e 52%,#2a2f3a 60%,transparent 62%);
  box-shadow:0 0 5cqw color-mix(in srgb,var(--dc) 30%,transparent)}
.dq-colend::after{content:"";position:absolute;inset:16%;border-radius:50%;border:.2cqw solid color-mix(in srgb,var(--dc) 55%,transparent);box-shadow:0 0 1.4cqw color-mix(in srgb,var(--dc) 45%,transparent) inset}
.dq-wheel{position:absolute;left:50%;top:52%;width:min(98%,58cqw);z-index:2;pointer-events:none;will-change:transform;
  transform:translate(-50%,-50%) perspective(70cqw) rotateX(calc(var(--p) * 18deg)) rotateZ(calc(var(--r) * 30deg)) scale(calc(1 - var(--p) * .08))}
.dq-wheel svg{display:block;width:100%;height:auto;overflow:visible}
.dq-pad::after{content:"";position:absolute;left:50%;bottom:4%;width:40cqw;height:5cqw;transform:translateX(-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--dc) 28%,transparent),transparent);filter:blur(1cqw);z-index:0}
.dq-fire{position:relative;border:0;border-radius:2.4cqw;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8cqw;color:#fff;
  background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--ac) 60%,#2a0d16),#13060a 75%);
  box-shadow:0 0 0 .25cqw var(--ac) inset,0 0 3cqw color-mix(in srgb,var(--ac) 45%,transparent);transition:transform .12s,opacity .25s,filter .25s}
.dq-fire b{font:italic 900 4.6cqw "Exo 2";letter-spacing:.12em}
.dq-fire small{font:800 1.25cqw "Exo 2";letter-spacing:.14em;color:color-mix(in srgb,var(--ac) 55%,#fff);text-align:center;padding:0 1cqw}
.dq-fire:active,.dq-fire.hit{transform:scale(.96)}
.dq-fire.dim{opacity:.45;filter:saturate(.4)}
.dq-bot{display:grid;grid-template-columns:21cqw 1fr 21cqw;gap:1.8cqw;align-items:stretch}
.dq-ped{border-radius:1.8cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4cqw;cursor:pointer;
  background:linear-gradient(180deg,#171c27,#0f131b);border:.18cqw solid rgba(255,255,255,.08);color:#dfe6f2;font:italic 900 2.2cqw "Exo 2";letter-spacing:.1em;transition:background .15s,border-color .15s}
.dq-ped svg{width:8.4cqw;height:8.4cqw;overflow:visible;filter:drop-shadow(0 0 .8cqw color-mix(in srgb,var(--dc) 70%,transparent))}
.dq-ped .c1,.dq-ped .c2{transition:transform .25s cubic-bezier(.22,.9,.3,1),opacity .25s}
.dq-near.down .c1{transform:translateY(-6px)}.dq-near.down .c2{transform:translateY(-12px)}.dq-far.down .c1{transform:translateY(6px)}.dq-far.down .c2{transform:translateY(12px)}
.dq-ped.down svg{filter:drop-shadow(0 0 1.4cqw var(--dc))}
.dq-ped.down{background:color-mix(in srgb,var(--dc) 30%,#171c27);border-color:var(--dc)}
.dq-mid2{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:.6cqw;min-width:0;padding-top:1.4cqw}
.dq-read{font:700 1.3cqw "Chakra Petch","Exo 2",sans-serif;letter-spacing:.1em;color:#9fb0c6;text-align:center;line-height:1.45;white-space:nowrap}
.dq-read b{color:#fff;font-weight:700}
/* ANDREW STUDIO — nhỏ, chữ kim loại + quầng tím, 2 vạch mảnh 2 bên, hình thoi giữa */
.dq-brand{display:flex;align-items:center;gap:.8cqw;margin-bottom:.1cqw}
.dq-brand i{display:block;width:4cqw;height:.12cqw;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--dc) 80%,#fff))}
.dq-brand i:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--dc) 80%,#fff),transparent)}
.dq-brand span{font:italic 900 1.05cqw "Exo 2";letter-spacing:.5em;padding-left:.55em;white-space:nowrap;
  background:linear-gradient(180deg,#ffffff 0%,#eef1f6 42%,#b4bdcc 56%,#ffffff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 .7cqw color-mix(in srgb,var(--dc) 55%,transparent))}
.dq-brand span em{font-style:inherit;background:linear-gradient(180deg,#e2d1ff,var(--dc) 60%,#6f3df0);-webkit-background-clip:text;background-clip:text;color:transparent}
.dq-brand b{width:.6cqw;height:.6cqw;transform:rotate(45deg);background:var(--dc);box-shadow:0 0 1cqw var(--dc);flex:none}
.dq-off{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,12,18,.94);font:italic 900 3cqw "Exo 2";color:#8e9bb0;text-align:center;padding:4cqw;z-index:9}
.dq[data-on="0"] .dq-off{display:flex}
`;
let styled = false;
function style() { if (styled) return; styled = true; const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); }
const noGestures = root => ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false }));

// vô lăng (không có cột) — hub ở giữa khung nhìn (300, 170 trong viewBox 0 25 600 290); id tiền tố "dqA-" (chỉ 1 bản trên trang)
const WHEEL = `<svg viewBox="0 25 600 290" aria-hidden="true">
  <defs>
    <linearGradient id="dqA-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6272"/><stop offset=".45" stop-color="#2a2f3a"/><stop offset="1" stop-color="#14171e"/></linearGradient>
    <linearGradient id="dqA-grip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0f14"/><stop offset=".45" stop-color="#2b303b"/><stop offset="1" stop-color="#0b0d11"/></linearGradient>
    <radialGradient id="dqA-hub" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#3a4150"/><stop offset="1" stop-color="#0e1117"/></radialGradient>
    <linearGradient id="dqA-glow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b07cff" stop-opacity="0"/><stop offset=".5" stop-color="#b07cff"/><stop offset="1" stop-color="#b07cff" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M118 150 Q300 118 482 150 L482 206 Q300 180 118 206 Z" fill="url(#dqA-metal)" stroke="#0a0c10" stroke-width="3"/>
  <path d="M140 156 Q300 130 460 156" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
  <rect x="150" y="168" width="300" height="4" rx="2" fill="url(#dqA-glow)"/>
  ${[1, -1].map(sx => `<g${sx < 0 ? ' transform="translate(600 0) scale(-1 1)"' : ""}>
    <path d="M150 150 C150 108 136 66 108 46 C90 33 66 42 66 66 L66 246 C66 286 104 300 134 280 C148 270 152 254 152 236 Z" fill="url(#dqA-grip)" stroke="#07080b" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M72 ${96 + i * 22} Q100 ${90 + i * 22} 146 ${98 + i * 22}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3"/>`).join("")}
    <path d="M78 70 C82 54 96 48 106 56" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="3" stroke-linecap="round"/>
    <rect x="84" y="40" width="26" height="14" rx="5" transform="rotate(-28 97 47)" fill="${sx > 0 ? "#ff2a2a" : "#f5c542"}" stroke="#07080b" stroke-width="2"/>
    <circle cx="132" cy="196" r="7" fill="#262b35" stroke="#07080b" stroke-width="2"/></g>`).join("")}
  <circle cx="300" cy="170" r="64" fill="url(#dqA-hub)" stroke="#07080b" stroke-width="4"/>
  <circle class="dq-ring" cx="300" cy="170" r="56" fill="none" stroke="#b07cff" stroke-opacity=".6" stroke-width="2"/>
  <rect x="258" y="146" width="84" height="40" rx="8" fill="#05070b" stroke="rgba(176,124,255,.5)" stroke-width="1.5"/>
  <text x="300" y="164" text-anchor="middle" font-family="Chakra Petch, Exo 2, sans-serif" font-weight="700" font-size="13" fill="#b07cff" letter-spacing="2">DRONE</text>
  <text class="dq-yr" x="300" y="180" text-anchor="middle" font-family="Chakra Petch, Exo 2, sans-serif" font-weight="600" font-size="11" fill="#cfd6e2">0° · 0°</text>
  <circle cx="276" cy="205" r="6" fill="#38d39f"/><circle cx="300" cy="210" r="6" fill="#f5c542"/><circle cx="324" cy="205" r="6" fill="#ff5a5a"/>
</svg>`;
/** Bảng lái drone AERO YOKE. Trả { setState, setDrone, tiltDebug, state } (giống padui-4x) */
export function mountDroneApp(mount, { client, onBack }) {
  style();
  mount.innerHTML = `<div class="dq" data-s="connecting" data-on="1"><div class="dq-in">
    <div class="dq-bar"><button type="button" class="dq-back" aria-label="Back">◀</button>
      <div class="dq-ttl"><b>DRONE</b><small class="dq-mode">NEUTRAL</small></div>
      <div class="dq-st"><i></i><span>CONNECTING…</span><em class="dq-rtt" style="font-style:normal"></em></div><div class="dq-sp"></div>
      <button type="button" class="dq-chip dq-tilt">TILT</button><button type="button" class="dq-chip dq-level">LEVEL</button>
      <div class="dq-bat"><div><span>BATTERY</span><b class="dq-batn">100 %</b></div><i><em></em></i></div></div>
    <div class="dq-mid">
      <div class="dq-ammo">${AMMO.map((a, k) => `<button type="button" class="dq-a" data-k="${k}" style="--c:${a.c}"><span class="ic">${ICON(a.k)}</span><span class="nm">${a.t}<small>${Math.round(a.cost * 100)} % · ${a.cd} s</small></span></button>`).join("")}</div>
      <div class="dq-pad"><div class="dq-lock">AIM ON THE ROAD</div><div class="dq-colend"></div><div class="dq-wheel">${WHEEL}</div></div>
      <button type="button" class="dq-fire"><b>FIRE</b><small></small></button>
    </div>
    <div class="dq-bot"><button type="button" class="dq-ped dq-near" aria-label="Drone closer"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="c2" d="M14 34 L32 16 L50 34" stroke="var(--dc)" stroke-width="7" opacity=".55"/><path class="c1" d="M14 48 L32 30 L50 48" stroke="var(--dc)" stroke-width="7"/><path class="c1" d="M14 48 L32 30 L50 48" stroke="#fff" stroke-width="2" opacity=".85"/></g></svg></button>
      <div class="dq-mid2"><div class="dq-read">STEER <b class="dq-rr">0°</b> &nbsp;·&nbsp; AIM <b class="dq-rp">0°</b><br><span class="dq-ttx">DRAG THE YOKE OR TILT THE iPAD</span></div>
        <div class="dq-brand"><i></i><b></b><span>ANDREW <em>STUDIO</em></span><b></b><i></i></div></div>
      <button type="button" class="dq-ped dq-far" aria-label="Drone back"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="c2" d="M14 30 L32 48 L50 30" stroke="var(--dc)" stroke-width="7" opacity=".55"/><path class="c1" d="M14 16 L32 34 L50 16" stroke="var(--dc)" stroke-width="7"/><path class="c1" d="M14 16 L32 34 L50 16" stroke="#fff" stroke-width="2" opacity=".85"/></g></svg></button></div>
    <div class="dq-off">The drone is OFF on the big screen.<br>Turn it on in ⚙ Settings ▸ Drone.</div>
  </div></div>`;
  const root = mount.firstElementChild, $ = s => root.querySelector(s);
  const pad = $(".dq-pad"), fireB = $(".dq-fire"), cards = [...root.querySelectorAll(".dq-a")], lockEl = $(".dq-lock"), ttx = $(".dq-ttx");
  let sel = 0, ammoOn = [true, true, true], lock = -1, joy = null, jx = 0, jy = 0, near = false, far = false, tiltOn = false, tiltX = 0, info = null;
  const CD = [0, 0, 0]; let air = false, bat = 1, phase = "";   // 5a: thời gian chờ còn lại (giây, tự đếm lùi giữa 2 tin) · đạn đang bay · pin
  const TL = { ref: null, gl: null, phi: 0, debug: null, ev: 0, th: 0, th0: 25, zs: 0, flat: false, dbgP: null };
  const Y = { r: 0, p: 0 };   // 5a: tư thế vô lăng (êm)
  function fireTxt() {
    const a = AMMO[sel]; if (!a) return "";
    if (phase && phase !== "race") return "WAIT FOR THE RACE";
    if (air) return "SHOT IN THE AIR";
    if (CD[sel] > 0.05) return `${a.t} · READY IN ${Math.ceil(CD[sel])} s`;
    if (bat < a.cost - 1e-6) return "LOW BATTERY";
    return a.t + (lock >= 0 ? " → " + TEAM_META[lock].name : " → ROAD");
  }
  function paintSel() {
    cards.forEach((c, k) => { c.classList.toggle("on", k === sel); c.classList.toggle("off", !ammoOn[k]); });
    root.style.setProperty("--ac", AMMO[sel] ? AMMO[sel].c : "#ffffff");
  }
  cards.forEach((c, k) => c.addEventListener("pointerdown", e => { e.preventDefault(); if (!ammoOn[k]) return; sel = k; paintSel(); client.send("d" + k); }));
  fireB.addEventListener("pointerdown", e => { e.preventDefault(); fireB.classList.add("hit"); setTimeout(() => fireB.classList.remove("hit"), 140); client.send("fire"); });
  // kéo ngón trên vùng cần lái = cần điều khiển tương đối (tối đa 12 % bề ngang)
  const R = () => innerWidth * 0.12;
  pad.addEventListener("pointerdown", e => { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (x) { /* */ } joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; pad.style.cursor = "grabbing"; });
  pad.addEventListener("pointermove", e => { if (!joy || e.pointerId !== joy.id) return; const r = R(); jx = Math.max(-1, Math.min(1, (e.clientX - joy.x) / r)); jy = Math.max(-1, Math.min(1, (e.clientY - joy.y) / r)); });
  const up = e => { if (joy && e.pointerId === joy.id) { joy = null; jx = jy = 0; pad.style.cursor = ""; } };
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => pad.addEventListener(n, up));
  const hold = (el, f) => { el.addEventListener("pointerdown", e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } f(true); el.classList.add("down"); }); ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => el.addEventListener(n, () => { f(false); el.classList.remove("down"); })); };
  hold($(".dq-near"), v => { near = v; }); hold($(".dq-far"), v => { far = v; });
  // nghiêng iPad (giữ nguyên 4u): tư thế vô lăng ô tô ~25° = 0 · xoay = ngang · ngả ra xa / kéo về = xa / gần
  const landscape = () => { const o = screen.orientation && screen.orientation.type; return o ? o.startsWith("landscape") : innerWidth > innerHeight; };
  const onMotion = e => {
    if (TL.debug != null) return;
    const g = e.accelerationIncludingGravity; if (!g || g.x == null) return; TL.ev++;
    const gz = g.z || 0;
    TL.gl = TL.gl ? { x: TL.gl.x + (g.x - TL.gl.x) * 0.4, y: TL.gl.y + (g.y - TL.gl.y) * 0.4, z: TL.gl.z + (gz - TL.gl.z) * 0.4 } : { x: g.x, y: g.y, z: gz };
    const m3 = Math.hypot(TL.gl.x, TL.gl.y, TL.gl.z);
    if (m3 > 4) { if (!TL.zs) TL.zs = Math.abs(TL.gl.z) / m3 > 0.12 ? Math.sign(TL.gl.z) : -1; TL.th = Math.asin(Math.max(-1, Math.min(1, TL.zs * TL.gl.z / m3))) * 180 / Math.PI; }
    const m = Math.hypot(TL.gl.x, TL.gl.y); TL.flat = m3 > 4 && m / m3 < 0.5; if (m < 1) return;
    if (!TL.ref && m > 4) { const v = landscape() ? TL.gl.x : TL.gl.y; TL.ref = landscape() ? { x: Math.sign(v) || 1, y: 0 } : { x: 0, y: Math.sign(v) || 1 }; }
    if (!TL.ref) return;
    const nx = TL.gl.x / m, ny = TL.gl.y / m; TL.phi = Math.atan2(TL.ref.x * ny - TL.ref.y * nx, TL.ref.x * nx + TL.ref.y * ny) * 180 / Math.PI;
  };
  const relevel = () => { TL.ref = null; };
  window.addEventListener("orientationchange", relevel); if (screen.orientation) screen.orientation.addEventListener("change", relevel);
  let msgT = 0; const say = t => { ttx.textContent = t; msgT = 2.5; };   // 5a: báo lỗi nghiêng vào dòng chữ (4x ghi đè cả khối ⇒ mất phần tử)
  async function tiltToggle() {
    if (!tiltOn) {
      try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function" && (await DeviceMotionEvent.requestPermission()) !== "granted") { say("ALLOW MOTION IN SAFARI"); return; } }
      catch (e) { say("TILT NEEDS HTTPS"); return; }
      window.addEventListener("devicemotion", onMotion); TL.ref = null; TL.zs = 0;
    } else window.removeEventListener("devicemotion", onMotion);
    tiltOn = !tiltOn; $(".dq-tilt").classList.toggle("on", tiltOn); $(".dq-tilt").textContent = tiltOn ? "TILT ON" : "TILT"; root.classList.toggle("tilting", tiltOn);
    try { localStorage.setItem("rwdrone.tilt", tiltOn ? "1" : "0"); } catch (e) { /* */ }
  }
  $(".dq-tilt").addEventListener("click", tiltToggle);
  $(".dq-level").addEventListener("click", () => { TL.ref = null; TL.th0 = TL.dbgP != null ? 25 : Math.max(-10, Math.min(60, TL.th)); try { localStorage.setItem("rwdrone.th0", String(TL.th0)); } catch (e) { /* */ } say("LEVEL SET"); });
  try { const v = parseFloat(localStorage.getItem("rwdrone.th0")); if (isFinite(v)) TL.th0 = v; } catch (e) { /* */ }
  try { if (localStorage.getItem("rwdrone.tilt") === "1" && !(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function")) tiltToggle(); } catch (e) { /* */ }
  const yr = root.querySelector(".dq-yr"), rr = $(".dq-rr"), rp = $(".dq-rp"), fsm = fireB.querySelector("small");
  let raf = 0, last = performance.now(), txtK = "", fK = "";
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const d = TL.debug != null ? TL.debug : TL.phi;
    tiltX = tiltOn && !TL.flat ? (Math.abs(d) < 3 ? 0 : Math.max(-1, Math.min(1, (d - Math.sign(d) * 3) / 19))) : 0;
    const dp = (TL.dbgP != null ? TL.dbgP + TL.th0 : TL.th) - TL.th0;
    const tiltY = tiltOn ? (Math.abs(dp) < 4 ? 0 : Math.max(-1, Math.min(1, (dp - Math.sign(dp) * 4) / 14))) : 0;
    const sx = joy ? jx : tiltX, fv = far ? 1 : 0, nv = near ? 1 : 0, py = joy ? -jy : tiltY;
    client.drive(sx, fv, nv, py, tiltOn && !joy);
    // 5a: VÔ LĂNG theo tay lái (êm) — lăn ±30°, đẩy / kéo ±18° + nhích lên / xuống; cột tự dài / ngắn, chân đế đứng yên
    const e = 1 - Math.exp(-dt * 10); Y.r += (sx - Y.r) * e; Y.p += (py - Y.p) * e;
    root.style.setProperty("--r", Y.r.toFixed(4)); root.style.setProperty("--p", Y.p.toFixed(4));
    const rd = Math.round(Y.r * 30), pd = Math.round(Y.p * 18);
    const k1 = rd + "|" + pd; if (k1 !== txtK) { txtK = k1; rr.textContent = rd + "°"; rp.textContent = pd + "°"; yr.textContent = `${rd}° · ${pd}°`; }
    if (msgT > 0) msgT -= dt;
    else { const tx = tiltOn ? (TL.flat ? "HOLD IT UP" : !tiltX && !tiltY ? "STEADY" : (tiltY > 0 ? "FAR " : tiltY < 0 ? "NEAR " : "") + (tiltX < 0 ? "◀" : tiltX > 0 ? "▶" : "")) : joy ? "AIMING" : "DRAG THE YOKE OR TILT THE iPAD";
      if (ttx.textContent !== tx) ttx.textContent = tx; }
    // 5a: hồi chiêu + pin trên thẻ đạn, chữ FIRE
    for (let k = 0; k < 3; k++) { if (CD[k] > 0) CD[k] = Math.max(0, CD[k] - dt);
      const c = cards[k], f = (CD[k] / AMMO[k].cd).toFixed(3); if (c.style.getPropertyValue("--cd") !== f) c.style.setProperty("--cd", f);
      const w = CD[k] > 0.05 || bat < AMMO[k].cost - 1e-6; if (c.classList.contains("wait") !== w) c.classList.toggle("wait", w);
      const sm = c.querySelector("small"), st = CD[k] > 0.05 ? `READY IN ${Math.ceil(CD[k])} s` : bat < AMMO[k].cost - 1e-6 ? "LOW BATTERY" : `${Math.round(AMMO[k].cost * 100)} % · ${AMMO[k].cd} s`;
      if (sm.textContent !== st) sm.textContent = st; }
    const ft = fireTxt(); if (ft !== fK) { fK = ft; fsm.textContent = ft; }
    const dim = (phase && phase !== "race") || air || CD[sel] > 0.05 || bat < (AMMO[sel] ? AMMO[sel].cost : 0) - 1e-6; if (fireB.classList.contains("dim") !== dim) fireB.classList.toggle("dim", dim);
  }
  raf = requestAnimationFrame(loop);
  $(".dq-back").addEventListener("click", () => { cancelAnimationFrame(raf); window.removeEventListener("devicemotion", onMotion); onBack && onBack(); });
  noGestures(root);
  let wl = null; const keep = async () => { if (wl || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { wl = await navigator.wakeLock.request("screen"); wl.addEventListener("release", () => { wl = null; }); } catch (e) { /* */ } };
  keep(); document.addEventListener("visibilitychange", keep);
  paintSel();
  return {
    setState({ s, rtt }) { root.dataset.s = s; $(".dq-st span").textContent = TXT[s] || ""; $(".dq-rtt").textContent = s === "on" && rtt ? " · " + rtt + " ms" : ""; },
    setDrone(j) {
      info = j; root.dataset.on = j.on ? "1" : "0"; phase = j.phase || ""; bat = Math.max(0, Math.min(1, j.bat));
      ammoOn = j.ammo; if (j.sel >= 0 && j.sel !== sel) sel = j.sel; lock = j.lock;
      if (Array.isArray(j.cd)) j.cd.forEach((v, k) => { CD[k] = Math.max(0, +v || 0); });   // 5a
      air = !!j.air;
      const dc = j.mode === "team" ? TEAM_META[j.team].color : DRONE_META.color; root.style.setProperty("--dc", dc);
      const ring = root.querySelector(".dq-ring"); if (ring) ring.setAttribute("stroke", dc);
      $(".dq-mode").textContent = j.mode === "team" ? TEAM_META[j.team].name + " DRONE" : MODE_T[j.mode] || "";
      $(".dq-bat em").style.transform = `scaleX(${bat.toFixed(3)})`; $(".dq-batn").textContent = Math.round(bat * 100) + " %"; $(".dq-bat").classList.toggle("low", bat < 0.25);
      lockEl.textContent = lock >= 0 ? "IN SIGHT · " + TEAM_META[lock].name : "AIM ON THE ROAD"; lockEl.style.color = lock >= 0 ? TEAM_META[lock].color : "";
      paintSel();
    },
    tiltDebug(deg, pdeg) { TL.debug = deg; TL.dbgP = pdeg == null ? null : pdeg; if (!tiltOn && deg != null) { tiltOn = true; $(".dq-tilt").classList.add("on"); $(".dq-tilt").textContent = "TILT ON"; root.classList.add("tilting"); } },
    get state() { return { sel, jx, jy, tiltOn, phi: TL.phi, th: TL.th, th0: TL.th0, flat: TL.flat, ev: TL.ev, info, cd: [...CD], air, yoke: { ...Y } }; },
  };
}
