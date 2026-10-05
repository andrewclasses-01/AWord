// STAR LOOT 2q — GIAO DIỆN iPAD (05/10/2026). Chỉ có D-pad + nút bom, KHÔNG câu hỏi (thầy: "iPad chỉ việc mở D-pad").
//   mountPadUI(mount, { team, send, onBack }) ⇒ { setState({ s, rtt }) }
//   mountPadChooser(mount, { onPick, extra }) — màn CHỌN ĐỘI (thầy: "iPad bấm nút iPad của AWord thì mở trang và chọn 1 trong 2 đội").
//   • Thầy (05/10): "Thiết kế toàn bộ màn hình iPad là D-pad đang sử dụng của game, nút bom để ở góc trên bên phải, xa xa khu D-pad,
//     D-pad to chiếm cả màn hình cũng được" ⇒ đúng D-pad RING của game (4 múi vành khăn SVG, mũi tên tam giác, viền xanh;
//     đội B ngả cam như trong game) phóng gần kín chiều cao màn; bom tròn riêng ở góc trên phải.
//   • Vùng bấm = cả GÓC PHẦN TƯ theo góc so với tâm (ngón trẻ con chạm lệch vẫn ăn), trừ vòng tâm nhỏ. pointerdown, nhiều ngón cùng lúc.
//   • touch-action:none · chặn phóng to / chọn chữ / menu giữ lâu · giữ màn sáng (Wake Lock).
import { TEAM_META } from "./mc3d-padlink-2q.js";

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#05040c;overscroll-behavior:none}
.sp,.spc{position:fixed;inset:0;font-family:"Baloo 2",system-ui,sans-serif;color:#e2e8f0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
  background:radial-gradient(120% 90% at 30% 20%,#1a1440 0%,#07060f 60%,#020208 100%)}
.sp{touch-action:none}
.sp-ring{position:absolute;top:50%;left:50%;width:min(94vh,86vw);height:min(94vh,86vw);transform:translate(-50%,-50%);touch-action:none}
@media (orientation:landscape){.sp-ring{left:calc(50% - 6vw)}}
@media (orientation:portrait){.sp-ring{top:56%}}
.sp-ring svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 1.2vmin 2.4vmin rgba(0,0,0,.55))}
.sp-ring .s,.spc-b .s{fill:rgba(14,20,48,.92);stroke:rgba(125,211,252,.85);stroke-width:2.2;stroke-linejoin:round;transition:fill .07s}
.sp-ring .a,.spc-b .a{fill:#e0f2fe}
.sp-ring .w.is-on .s{fill:#0ea5e9;stroke:#e0f2fe}
.sp-ring .w.is-on .a{fill:#fff}
.sp-ring .hubc,.spc-b .hubc{fill:rgba(14,20,48,.6);stroke:rgba(125,211,252,.45);stroke-width:1.5}
.sp-ring .hubt{fill:var(--tc);font:800 22px "Baloo 2",system-ui,sans-serif;letter-spacing:1px}
.sp.is-b .sp-ring svg{filter:hue-rotate(165deg) saturate(1.3) drop-shadow(0 1.2vmin 2.4vmin rgba(0,0,0,.55))}
.sp.is-b .sp-ring .hubt{fill:#38bdf8}
.sp-bomb{position:absolute;top:max(3vmin,env(safe-area-inset-top));right:max(3vmin,env(safe-area-inset-right));width:min(24vmin,230px);aspect-ratio:1;border:0;padding:0;border-radius:50%;cursor:pointer;
  display:grid;place-items:center;background:radial-gradient(circle at 40% 35%,#4a2a16,#1c0f08 75%);box-shadow:inset 0 0 0 4px #fbbf24,0 0 3vmin rgba(251,191,36,.35),0 1.2vmin 2.4vmin rgba(0,0,0,.55);transition:transform .07s}
.sp-bomb svg{width:58%;height:58%;color:#fff7ed;overflow:visible}
.sp-bomb.is-on{transform:scale(.92);background:radial-gradient(circle,#7c3a12,#3b1a0a)}
.sp-top{position:absolute;left:max(2.4vmin,env(safe-area-inset-left));top:max(2.4vmin,env(safe-area-inset-top));display:flex;align-items:center;gap:1.4vmin;pointer-events:none}
.sp-back{pointer-events:auto;width:max(44px,5.6vmin);height:max(44px,5.6vmin);border-radius:50%;border:1px solid rgba(140,210,255,.4);background:rgba(255,255,255,.06);color:#cbd5e1;
  display:grid;place-items:center;cursor:pointer;padding:0}
.sp-back svg{width:55%;height:55%}
.sp-team{font-weight:800;font-size:max(22px,3.2vmin);letter-spacing:.1em;color:var(--tc)}
.sp-st{display:flex;align-items:center;gap:.8vmin;font-weight:700;font-size:max(16px,2.2vmin);color:#cbd5e1}
.sp-st i{width:max(11px,1.4vmin);height:max(11px,1.4vmin);border-radius:50%;background:#64748b}
.sp[data-s="on"] .sp-st i{background:#4ade80;box-shadow:0 0 12px #4ade80}
.sp[data-s="relay"] .sp-st i{background:#facc15}
.sp[data-s="connecting"] .sp-st i,.sp[data-s="nogame"] .sp-st i{animation:spb 1s steps(2) infinite}
@keyframes spb{50%{opacity:.2}}
.sp-rtt{font:600 max(13px,1.6vmin) ui-monospace,Consolas,monospace;color:#94a3b8}
.sp-msg{position:absolute;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));text-align:center;font-size:max(15px,2vmin);color:#94a3b8;pointer-events:none}
.sp[data-s="on"] .sp-msg{display:none}
/* màn chọn đội */
.spc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4vmin;padding:4vmin;box-sizing:border-box}
.spc h1{margin:0;font-size:max(30px,5vmin);letter-spacing:.12em;color:#fde68a}
.spc p{margin:0;font-size:max(17px,2.4vmin);color:#94a3b8}
.spc-row{display:flex;gap:5vmin;flex-wrap:wrap;justify-content:center}
.spc-b{width:min(38vmin,380px);aspect-ratio:1;border-radius:4vmin;border:3px solid var(--tc);background:rgba(255,255,255,.04);color:var(--tc);cursor:pointer;padding:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vmin;font:800 max(26px,4.4vmin) "Baloo 2",system-ui,sans-serif;letter-spacing:.1em;
  box-shadow:0 0 4vmin color-mix(in srgb,var(--tc) 30%,transparent)}
.spc-b svg{width:46%;height:46%}
.spc-b.is-b svg{filter:hue-rotate(165deg) saturate(1.3)}
.spc-b:active{transform:scale(.96)}
.spc-x{font-size:max(15px,2vmin);color:#94a3b8}
.spc-x a{color:#7dd3fc}
`;
const P = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(2)).join(" ");
const DIRS = { u: -90, r: 0, d: 90, l: 180 };
// Ring giống hệt game (mc3d-2q ringSVG): 4 múi vành khăn tách nhau + mũi tên tam giác. Tâm để trống (bom ra góc), ghi chữ đội.
function ringSVG(label) {
  const RO = 97, RI = 30, H = 42;
  const sector = a => `M ${P(RO, a - H)} A ${RO} ${RO} 0 0 1 ${P(RO, a + H)} L ${P(RI, a + H)} A ${RI} ${RI} 0 0 0 ${P(RI, a - H)} Z`;
  const arrow = a => `M ${P(80, a)} L ${P(56, a - 14)} L ${P(56, a + 14)} Z`;
  return `<svg viewBox="-100 -100 200 200">${Object.entries(DIRS).map(([k, a]) => `<g class="w" data-d="${k}"><path class="s" d="${sector(a)}"/><path class="a" d="${arrow(a)}"/></g>`).join("")}
    <circle class="hubc" r="24"/>${label ? `<text class="hubt" text-anchor="middle" dominant-baseline="central">${label}</text>` : ""}</svg>`;
}
const BOMB = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.6" fill="currentColor"/><path d="M17.3 6.7l1.3-1.3" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M19.2 4.8c.4-.7 1.1-1 1.8-.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="21.6" cy="3.2" r="1.2" fill="#fbbf24"/><path d="M7.8 9.9a4.6 4.6 0 0 1 3.1-2.9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const TXT = { on: "Connected", relay: "Connected (slow)", connecting: "Connecting…", nogame: "Waiting for the game" };
const MSG = { relay: "No direct link on this Wi-Fi — moves go the slow way.", connecting: "Linking to STAR LOOT… (if this stays, open the iPad panel on the big screen)", nogame: "Open STAR LOOT on the big screen — this iPad links by itself." };
let styled = false;
function style() { if (styled) return; styled = true; const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); }
function noGestures(root) { ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false })); }

export function mountPadUI(mount, { team, send, onBack }) {
  style();
  const t = team ? 1 : 0, m = TEAM_META[t];
  mount.innerHTML = `<div class="sp${t ? " is-b" : ""}" style="--tc:${m.color}" data-s="nogame">
    <div class="sp-ring">${ringSVG(t ? "B" : "A")}</div>
    <button class="sp-bomb" aria-label="Bomb">${BOMB}</button>
    <div class="sp-top">${onBack ? `<button class="sp-back" aria-label="Choose team">${BACK}</button>` : ""}<b class="sp-team">${m.name}</b><span class="sp-st"><i></i><span></span></span><span class="sp-rtt"></span></div>
    <div class="sp-msg"></div></div>`;
  const root = mount.firstElementChild, ring = root.querySelector(".sp-ring"), bomb = root.querySelector(".sp-bomb");
  const flash = (el, ms) => { el.classList.add("is-on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("is-on"), ms); };
  ring.addEventListener("pointerdown", e => {                 // cả góc phần tư theo GÓC so với tâm; vòng tâm (≈ 24/100 bán kính) bỏ qua
    e.preventDefault();
    const r = ring.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return;
    const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : (dy > 0 ? "d" : "u");
    send(k); flash(ring.querySelector(`.w[data-d="${k}"]`), 150);
  });
  bomb.addEventListener("pointerdown", e => { e.preventDefault(); send("bomb"); flash(bomb, 160); });
  root.querySelector(".sp-back")?.addEventListener("click", () => onBack());
  noGestures(root);
  let lock = null;   // giữ màn sáng
  const keep = async () => { if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* */ } };
  keep(); document.addEventListener("visibilitychange", keep); root.addEventListener("pointerdown", keep, { once: true });
  return {
    setState({ s, rtt }) {
      root.dataset.s = s;
      root.querySelector(".sp-st > span").textContent = TXT[s] || "";
      root.querySelector(".sp-rtt").textContent = s === "on" && rtt ? rtt + " ms" : "";
      root.querySelector(".sp-msg").textContent = MSG[s] || "";
    },
  };
}

// màn chọn đội: onPick(0|1) · extra = HTML thêm dưới cùng (vd. link màn câu hỏi Rocket Race của AWord)
export function mountPadChooser(mount, { onPick, extra = "" }) {
  style();
  mount.innerHTML = `<div class="spc"><h1>STAR LOOT · iPad D-pad</h1><p>Choose this iPad's team</p>
    <div class="spc-row">${[0, 1].map(t => `<button class="spc-b${t ? " is-b" : ""}" data-t="${t}" style="--tc:${TEAM_META[t].color}">${ringSVG("")}${TEAM_META[t].name}</button>`).join("")}</div>
    <p class="spc-x">Single mode: choose TEAM A.${extra ? " " + extra : ""}</p></div>`;
  mount.querySelectorAll(".spc-b").forEach(b => b.addEventListener("click", () => onPick(+b.dataset.t)));
  noGestures(mount.firstElementChild);
}
