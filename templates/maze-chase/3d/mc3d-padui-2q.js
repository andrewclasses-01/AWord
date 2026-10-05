// STAR LOOT 2q — GIAO DIỆN D-PAD TRÊN iPAD (05/10/2026). Chỉ có D-pad + nút bom, KHÔNG câu hỏi (thầy: "iPad chỉ việc mở D-pad").
//   mountPadUI(mount, { team, send }) ⇒ { setState({ s, rtt }) }
//   • iPad nằm ngang: D-pad to bên TRÁI, BOM bên PHẢI (như tay cầm). Dọc: D-pad trên, bom dưới.
//   • pointerdown (không đợi click) · nhiều ngón cùng lúc · touch-action:none · chặn phóng to / chọn chữ / menu giữ lâu.
//   • Giữ màn hình sáng (Wake Lock — iPad tự khoá ~2 phút khi không ai chạm, nhưng ở đây em bấm liên tục nên chủ yếu phòng lúc chờ).
import { TEAM_META } from "./mc3d-padlink-2q.js";

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#05040c;overscroll-behavior:none}
.sp{position:fixed;inset:0;display:grid;grid-template-rows:auto 1fr;font-family:"Baloo 2",system-ui,sans-serif;color:#e2e8f0;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;
  background:radial-gradient(120% 90% at 30% 20%,#1a1440 0%,#07060f 60%,#020208 100%)}
.sp-top{display:flex;align-items:center;gap:14px;padding:max(10px,env(safe-area-inset-top)) 20px 10px;border-bottom:2px solid var(--tc);background:rgba(0,0,0,.35)}
.sp-team{font-weight:800;font-size:max(24px,3.6vmin);letter-spacing:.1em;color:var(--tc)}
.sp-st{display:flex;align-items:center;gap:8px;font-weight:700;font-size:max(18px,2.6vmin);margin-left:auto}
.sp-st i{width:1.6vmin;height:1.6vmin;min-width:12px;min-height:12px;border-radius:50%;background:#64748b}
.sp[data-s="on"] .sp-st i{background:#4ade80;box-shadow:0 0 12px #4ade80}
.sp[data-s="relay"] .sp-st i{background:#facc15}
.sp[data-s="connecting"] .sp-st i,.sp[data-s="nogame"] .sp-st i{animation:spb 1s steps(2) infinite}
@keyframes spb{50%{opacity:.2}}
.sp-rtt{font:600 max(14px,1.8vmin) ui-monospace,Consolas,monospace;color:#94a3b8;min-width:64px;text-align:right}
.sp-main{display:flex;align-items:center;justify-content:space-around;gap:4vmin;padding:3vmin 5vmin max(3vmin,env(safe-area-inset-bottom))}
@media (orientation:portrait){.sp-main{flex-direction:column}}
.sp-pad{position:relative;width:min(78vmin,620px);aspect-ratio:1;display:grid;grid-template:1fr 1fr 1fr/1fr 1fr 1fr;gap:1.6vmin}
.sp-b{border:0;margin:0;padding:0;border-radius:3.2vmin;font:inherit;color:#e0f2fe;cursor:pointer;display:grid;place-items:center;
  background:linear-gradient(180deg,rgba(56,189,248,.28),rgba(30,64,175,.32));box-shadow:inset 0 0 0 2px rgba(125,211,252,.55),0 1vmin 3vmin rgba(0,0,0,.5);
  transition:transform .06s,background .06s}
.sp-b svg{width:46%;height:46%;fill:currentColor}
.sp-b.is-on{transform:scale(.94);background:linear-gradient(180deg,#38bdf8,#0369a1);color:#fff;box-shadow:inset 0 0 0 3px #e0f2fe,0 0 4vmin rgba(56,189,248,.8)}
.sp-u{grid-area:1/2}.sp-l{grid-area:2/1}.sp-r{grid-area:2/3}.sp-d{grid-area:3/2}
.sp-hub{grid-area:2/2;border-radius:50%;background:rgba(125,211,252,.08);box-shadow:inset 0 0 0 2px rgba(125,211,252,.25)}
.sp-bomb{width:min(40vmin,320px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7f1d1d,#3b0a0a 70%);
  box-shadow:inset 0 0 0 3px rgba(248,113,113,.7),0 1.2vmin 4vmin rgba(0,0,0,.6);color:#fecaca}
.sp-bomb svg{width:52%;height:52%}
.sp-bomb.is-on{background:radial-gradient(circle at 35% 30%,#ef4444,#7f1d1d 75%);color:#fff;box-shadow:inset 0 0 0 4px #fee2e2,0 0 5vmin rgba(239,68,68,.85)}
.sp-msg{position:fixed;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));text-align:center;font-size:max(16px,2.2vmin);color:#94a3b8;pointer-events:none}
.sp[data-s="on"] .sp-msg{display:none}
`;
const ARROW = { u: "M12 4 21 18H3z", d: "M12 20 3 6h18z", l: "M4 12 18 3v18z", r: "M20 12 6 21V3z" };
const BOMB = '<svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="7.6" fill="currentColor"/><path d="M16.3 7.7l1.6-1.6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><circle cx="20" cy="4" r="1.6" fill="#fbbf24"/></svg>';
const TXT = { on: "Connected", relay: "Connected (slow)", connecting: "Connecting…", nogame: "Waiting for the game" };
const MSG = { relay: "No direct link on this Wi-Fi — moves go the slow way.", connecting: "Linking to STAR LOOT… (if this stays, open the iPad panel on the big screen)", nogame: "Open STAR LOOT on the big screen — this iPad links by itself." };

export function mountPadUI(mount, { team, send }) {
  const st = document.createElement("style"); st.textContent = CSS; document.head.append(st);
  const m = TEAM_META[team ? 1 : 0];
  mount.innerHTML = `<div class="sp" style="--tc:${m.color}" data-s="nogame">
    <div class="sp-top"><b class="sp-team">${team ? m.name : "TEAM A · PLAYER"}</b><span class="sp-st"><i></i><span></span></span><span class="sp-rtt"></span></div>
    <div class="sp-main">
      <div class="sp-pad">${["u", "l", "r", "d"].map(k => `<button class="sp-b sp-${k}" data-k="${k}"><svg viewBox="0 0 24 24"><path d="${ARROW[k]}"/></svg></button>`).join("")}<i class="sp-hub"></i></div>
      <button class="sp-b sp-bomb" data-k="bomb">${BOMB}</button>
    </div><div class="sp-msg"></div></div>`;
  const root = mount.firstElementChild;
  root.querySelectorAll("[data-k]").forEach(b => {
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      send(b.dataset.k);
      b.classList.add("is-on"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("is-on"), 150);
    });
  });
  ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  // giữ màn sáng
  let lock = null;
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
