// RACING WORDS — màn iPad mẫu 3m = sr3d-padui-3h.js, chỉ đổi tên game hiển thị.
// SPEED RUN mẫu 3h — MÀN iPAD (15/10/2026) = padui-3g + vô lăng ATEAM LED (sr3d-dash-3h.js).
// ---- gốc 3g ----
// SPEED RUN mẫu 3g — MÀN iPAD (15/10/2026) = padui-3e + thầy chọn bố cục B (thiet-ke-ipad-dua.html): GA sát mép TRÁI, PHANH sát mép PHẢI (đúng chỗ 2 ngón cái),
//   vô lăng ĐÁY PHẲNG (dash-3g) ở giữa có khoảng trống lớn 2 bên, tên lửa góc trên phải trên phanh. Đơn vị vw/vh = màn iPad (Safari đã trừ thanh trạng thái).
// ---- gốc 3e ----
// SPEED RUN mẫu 3e — MÀN iPAD (15/10/2026) = padui-3d + hình dash-3e (bàn đạp hẹp/dài, vệt sáng vô lăng mới) + nút tên lửa 2 ô: chính quả trong nút bay,
//   quả chờ thụt xuống + quả mới trồi lên nạp vào (như game) · vô lăng chỉ nhận bấm trong vòng tròn.
// ---- gốc 3d ----
// SPEED RUN mẫu 3d — MÀN iPAD (15/10/2026) = padui-3c + bỏ chữ dưới bàn đạp (bàn đạp dài hết), hình từ sr3d-dash-3h.js (bàn đạp rộng bằng nhau,
//   cung vô lăng mờ 2 đầu, nút tên lửa 2 quả song song).
// ---- gốc 3c ----
// SPEED RUN mẫu 3c — MÀN iPAD (15/10/2026) = padui-3b + vô lăng sáng 1 cung 1/4 bên đang bấm, bàn đạp treo (chỉ phần dưới lún),
//   nút tên lửa chỉ icon 2 quả chéo (bấm ⇒ 1 quả vút lên trong nút) + tên lửa chờ dựng đứng ≤ 4 + "+x" — hình từ sr3d-dash-3h.js (y hệt game).
// ---- gốc 3b ----
// SPEED RUN mẫu 3b — MÀN iPAD theo 3 CHẾ ĐỘ (15/10/2026). Chế độ do MÀN LỚN chọn (nút iPad trong hàng nút) và gửi sang ("m:").
//   0 TẮT        — iPad chỉ báo "iPad is off".
//   1 TRẢ LỜI    — iPad hiện CÂU HỎI + 4 nút đáp án (màn lớn chỉ hiện đáp án); bấm ⇒ "a:<k>:<số câu>"; tô đúng/sai theo kết quả game gửi lại.
//   2 ĐUA        — iPad = tap-lô Y HỆT game: bàn đạp GA (trái) · VÔ LĂNG (giữ nửa trái/phải để lái, sáng màu đội) · bàn đạp PHANH (phải)
//                  + nút TÊN LỬA (thầy: "thêm một nút tên lửa ở một chỗ phù hợp"): góc TRÊN PHẢI, ngay trên bàn đạp phanh — ngón cái phải
//                  trượt lên là tới, không lẫn với bàn đạp; số quả + 3 ống hiện trên nút. Màn vô lăng: km/h + 4 ô năng lượng + thanh Nitro (như game).
//   mountPadApp(mount, { team, client, onBack }) ⇒ { setState, setInfo, setMode, setQ } · mountPadChooser(mount, { onPick })
import { TEAM_META } from "./sr3d-padlink-3e.js";
import { WHEEL_SVG, GAS_SVG, BRAKE_SVG, FIRE_ICON, FLY_HTML, reserveHTML } from "./sr3d-dash-3h.js";

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#05060a;overscroll-behavior:none}
.ip,.ipc{position:fixed;inset:0;font-family:"Exo 2",system-ui,sans-serif;color:#e2e8f0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;
  background:radial-gradient(120% 90% at 50% 0%,#18233a 0%,#07090f 60%,#030408 100%)}
.ip::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;box-shadow:inset 0 0 18vmin rgba(255,30,20,.9)}
.ip[data-alarm="1"]::after{animation:ipa .5s ease-in-out infinite alternate}
.ip[data-alarm="2"]::after{animation:ipa .15s ease-in-out infinite alternate}
@keyframes ipa{from{opacity:.2}to{opacity:.95}}
.ip-top{position:absolute;left:max(2.4vmin,env(safe-area-inset-left));top:max(2.4vmin,env(safe-area-inset-top));display:flex;align-items:center;gap:1.4vmin;z-index:3}
.ip-back{width:max(44px,5.6vmin);height:max(44px,5.6vmin);border-radius:50%;border:1px solid rgba(140,210,255,.4);background:rgba(255,255,255,.06);color:#cbd5e1;display:grid;place-items:center;cursor:pointer;padding:0}
.ip-back svg{width:55%;height:55%}
.ip-team{font:italic 900 max(22px,3.4vmin) "Exo 2",sans-serif;letter-spacing:.1em;color:var(--tc)}
.ip-st{display:flex;align-items:center;gap:.8vmin;font-weight:700;font-size:max(15px,2vmin);color:#cbd5e1}
.ip-st i{width:max(11px,1.4vmin);height:max(11px,1.4vmin);border-radius:50%;background:#64748b}
.ip[data-s="on"] .ip-st i{background:#4ade80;box-shadow:0 0 12px #4ade80}
.ip[data-s="relay"] .ip-st i{background:#facc15}
.ip[data-s="connecting"] .ip-st i,.ip[data-s="nogame"] .ip-st i{animation:ipb 1s steps(2) infinite}
@keyframes ipb{50%{opacity:.2}}
.ip-rtt{font:600 max(13px,1.6vmin) ui-monospace,Consolas,monospace;color:#94a3b8}
.ip-mode{font:800 max(13px,1.7vmin) "Exo 2",sans-serif;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;padding:.6vmin 1.4vmin;border-radius:99px;border:1px solid rgba(148,163,184,.35)}
.ip-scr{position:absolute;inset:0;display:none}
.ip[data-m="0"] .ip-off,.ip[data-m="1"] .ip-ans,.ip[data-m="2"] .ip-drv,.ip[data-m="w"] .ip-wait{display:block}
.ip-msg{position:absolute;left:8vw;right:8vw;top:50%;transform:translateY(-50%);text-align:center;display:flex;flex-direction:column;align-items:center;gap:2.4vmin}
.ip-msg b{font:italic 900 max(28px,6vmin) "Exo 2",sans-serif;letter-spacing:.06em;color:#fff3dd}
.ip-msg span{font-size:max(17px,2.6vmin);color:#94a3b8;line-height:1.4}
.ip-msg svg{width:14vmin;height:14vmin;color:#64748b}
/* --- chế độ 1: trả lời --- */
.ip-ans{padding:calc(max(2.4vmin,env(safe-area-inset-top)) + max(56px,7vmin)) 4vmin max(4vmin,env(safe-area-inset-bottom));box-sizing:border-box}
.ip-ans.is-shown{display:flex!important;flex-direction:column;gap:3vmin}
.ip-q{flex:0 0 auto;min-height:20vmin;display:grid;place-items:center;padding:2.4vmin 4vmin;border-radius:3vmin;text-align:center;
  background:linear-gradient(180deg,rgba(20,30,52,.95),rgba(10,15,28,.95));border:.5vmin solid color-mix(in srgb,var(--tc) 55%,transparent);
  font:700 max(22px,4.8vmin)/1.2 "Exo 2",sans-serif;color:#fff}
.ip-q[data-len="l"]{font-size:max(19px,3.8vmin)}.ip-q[data-len="xl"]{font-size:max(17px,3.2vmin)}
.ip-a{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:2.4vmin}
.ip-a[data-n="2"]{grid-template-columns:1fr}.ip-a[data-n="3"] button:last-child{grid-column:1/-1}
.ip-a button{border-radius:3vmin;border:.5vmin solid color-mix(in srgb,var(--tc) 45%,rgba(255,255,255,.2));background:linear-gradient(180deg,rgba(26,42,72,.95),rgba(12,20,38,.97));
  color:#fff;font:800 max(20px,4.6vmin)/1.15 "Exo 2",sans-serif;padding:1vmin 2vmin;cursor:pointer;touch-action:manipulation;transition:transform .08s,opacity .3s}
.ip-a button:active{transform:scale(.97)}
.ip-a button.ok{background:linear-gradient(180deg,#2cc06d,#178a49);border-color:#9dffc6}
.ip-a button.bad{background:linear-gradient(180deg,#e0413f,#a3201f);border-color:#ffb0a8}
.ip-a button.rev{border-color:#7dffb0;box-shadow:inset 0 0 0 1vmin #3fd884}
.ip-a.lock button:not(.ok):not(.bad):not(.rev){opacity:.4}
/* --- chế độ 2: tap-lô y hệt game --- */
.ip-drv{background:linear-gradient(180deg,transparent 0,transparent 30%,#15181d 31%,#0c0e11 100%)}
.ip-drv::before{content:"";position:absolute;left:0;right:0;top:30%;height:1vmin;background:#2f353f;box-shadow:0 -2vmin 4vmin rgba(0,0,0,.5)}
.ip-row{position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:flex;align-items:flex-end;gap:2vmin;height:66vmin}
.ip-ped{position:relative;height:54vmin;padding:0;border:0;background:none;cursor:pointer;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  transform-origin:50% 100%;transition:transform .07s;margin-bottom:3vmin}
.ip-ped .sr-pedal-svg{display:block;height:calc(100% - 4.4vmin);width:auto;filter:drop-shadow(0 1.4vmin 1.8vmin rgba(0,0,0,.6))}
.ip-ped span{font:italic 900 3.2vmin/4.4vmin "Exo 2",sans-serif;letter-spacing:.14em}
.ip-gas span{color:#7fe9ff}.ip-brk span{color:#ff9a8a}
.ip-ped.on{transform:perspective(80vmin) rotateX(16deg) scaleY(.95)}
.ip-ped.on .sr-pedal-svg{filter:drop-shadow(0 0 3vmin var(--tc)) drop-shadow(0 0 1vmin var(--tc)) brightness(1.25)}
.ip .sr-nfill{fill:rgba(70,230,255,.55);transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}
.ip-gas.nitro .sr-pedal-svg{filter:drop-shadow(0 0 2.4vmin rgba(80,230,255,.85))}
.ip-wbox{position:relative;width:66vmin;height:100%;cursor:pointer;touch-action:none;--team:var(--tc)}
.ip-wheel{position:absolute;left:50%;bottom:-13vmin;width:66vmin;height:66vmin;margin-left:-33vmin;transition:transform .05s linear;filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6))}
.ip-wheel>svg{position:absolute;inset:0;width:100%;height:100%}
.ip-glow{position:absolute;bottom:-13vmin;width:38vmin;height:66vmin;border-radius:50%;pointer-events:none;opacity:0;filter:blur(4vmin);mix-blend-mode:screen;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--tc) 95%,white),color-mix(in srgb,var(--tc) 55%,transparent) 60%,transparent);transition:opacity .12s}
.ip-glow.l{left:calc(50% - 36vmin)}.ip-glow.r{left:calc(50% - 2vmin)}
.ip-wbox.l .ip-glow.l,.ip-wbox.r .ip-glow.r{opacity:.95}
.ip-wbox.l .ip-wheel,.ip-wbox.r .ip-wheel{filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6)) drop-shadow(0 0 2.6vmin var(--tc))}
.ip-scrn{position:absolute;left:25%;right:25%;top:26%;height:31%;border-radius:2.6vmin;background:linear-gradient(180deg,#050a12,#0b1422);border:.5vmin solid #000;
  box-shadow:0 0 0 .45vmin color-mix(in srgb,var(--tc) 70%,transparent),inset 0 0 3.6vmin rgba(80,150,255,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6vmin}
.ip-src{font:900 2.4vmin "Exo 2",sans-serif;letter-spacing:.2em;color:#4ade80}
.ip-kmh{display:flex;align-items:baseline;gap:.6vmin;color:#fff}
.ip-kmh span{font:italic 900 10vmin/1 "Exo 2",sans-serif;min-width:2.1em;text-align:right}.ip-kmh small{font:800 2.6vmin "Exo 2",sans-serif;color:#9fb4e0}
.ip-cells{display:flex;gap:.6vmin;width:78%}
.ip-cells i{flex:1;height:2.6vmin;border-radius:.7vmin;background:linear-gradient(90deg,#ffd23f calc(var(--f,0)*100%),rgba(255,255,255,.12) 0)}
.ip-nbar{width:78%;height:1.6vmin;border-radius:.7vmin;background:rgba(255,255,255,.1);overflow:hidden}
.ip-nbar em{display:block;height:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#4ef0ff,#a77bff)}
.ip-fire{position:absolute;top:max(3.4vmin,env(safe-area-inset-top));right:max(4vmin,env(safe-area-inset-right));width:min(17vw,24vmin);aspect-ratio:1;border-radius:50%;border:0;padding:0;cursor:pointer;
  display:grid;place-items:center;touch-action:none;color:#7c4a3a;background:radial-gradient(circle at 40% 35%,#4a1a10,#1c0a06 75%);box-shadow:inset 0 0 0 .6vmin #7c2d12,0 1.4vmin 2.6vmin rgba(0,0,0,.55);transition:transform .06s}
.ip-fire svg{width:44%;height:44%;transform:rotate(45deg)}
.ip-fire span{position:absolute;bottom:13%;font:italic 900 2.6vmin "Exo 2",sans-serif;letter-spacing:.16em}
.ip-fire b{position:absolute;top:4%;right:4%;min-width:5vmin;height:5vmin;border-radius:2.5vmin;background:#fff;color:#c2290e;font:900 3.4vmin/5vmin "Exo 2",sans-serif;text-align:center}
.ip-fire.ready{color:#fff;background:radial-gradient(circle at 40% 35%,#ff7a4a,#c2290e 75%);box-shadow:inset 0 0 0 .6vmin #fed7aa,0 0 5vmin rgba(255,90,40,.6);animation:ipf .9s ease-in-out infinite alternate}
@keyframes ipf{to{box-shadow:inset 0 0 0 .6vmin #fed7aa,0 0 1.6vmin rgba(255,90,40,.4)}}
.ip-fire.hit{transform:scale(.9)}
.ip-warn{position:absolute;left:0;right:0;top:12vmin;text-align:center;font:italic 900 5vmin "Exo 2",sans-serif;color:#ff8a80;letter-spacing:.1em;pointer-events:none}
.ip-wheel .wg{opacity:0;transition:opacity .1s}.ip-wbox.l .wg.wl,.ip-wbox.r .wg.wr{opacity:1}
.ip-wbox.l .ip-wheel,.ip-wbox.r .ip-wheel{filter:drop-shadow(0 2vmin 3vmin rgba(0,0,0,.6))}
.ip-ped.on{transform:none}.ip-ped .mv{transition:transform .08s,filter .1s}.ip-ped.on .mv{transform:translateY(4px) scale(.96,.9);filter:drop-shadow(0 0 4px var(--tc)) brightness(1.25)}
.ip-ped.on .sr-pedal-svg{filter:drop-shadow(0 1.4vmin 1.8vmin rgba(0,0,0,.6))}
.ip-fire{overflow:hidden}.ip-fire .sr-x2{width:52%;height:52%;transform:none}
.ip-fire .sr-fly{position:absolute;left:50%;bottom:-10%;width:22%;margin-left:-11%;pointer-events:none;animation:ipfly .7s cubic-bezier(.5,0,.8,.4) forwards}
.ip-fire .sr-fly svg{width:100%;height:auto;display:block;color:#fff;transform:none;filter:drop-shadow(0 0 1vmin #ffb347)}
@keyframes ipfly{0%{transform:translateY(0) scale(.9);opacity:1}70%{opacity:1}100%{transform:translateY(-330%) scale(1.05);opacity:0}}
.ip-res{position:absolute;top:calc(max(3.4vmin,env(safe-area-inset-top)) + min(17vw,24vmin) + 1.6vmin);right:max(4vmin,env(safe-area-inset-right));width:min(17vw,24vmin);display:flex;justify-content:center;align-items:flex-end;gap:.8vmin;color:#ff6a3c}
.ip-res svg{width:4vmin;height:4.6vmin;filter:drop-shadow(0 0 .8vmin rgba(255,90,60,.7))}.ip-res b{font:italic 900 3.4vmin "Exo 2",sans-serif;color:#ffb08f}
.ip-row{gap:0}.ip-ped{height:58vmin;margin:0 -2vmin 2vmin}.ip-ped .sr-pedal-svg{height:100%}.ip-wbox{z-index:1}
.ip-ped{height:62vmin}
.ip-fire{display:flex;align-items:center;justify-content:center;gap:2.4vmin}
.ip-fire .sr-slot{display:block;width:4.4vmin;height:9.6vmin;opacity:0;transform:translateY(170%)}
.ip-fire .sr-slot svg{display:block;width:100%;height:100%;overflow:visible;transform:none;filter:none}
.ip-fire .sr-slot .fl{opacity:0}.ip-fire .sr-slot.on{opacity:1;transform:none}
.ip-fire .sr-slot.load{animation:iplo .5s cubic-bezier(.2,.9,.3,1) both}.ip-fire .sr-slot.fly{animation:ipfu .52s cubic-bezier(.55,0,.9,.35) forwards}.ip-fire .sr-slot.fly .fl{opacity:1}
@keyframes iplo{from{transform:translateY(170%);opacity:.3}to{transform:none;opacity:1}}
@keyframes ipfu{0%{transform:none;opacity:1}80%{opacity:1}100%{transform:translateY(-260%);opacity:0}}
.ip-res{overflow:hidden;height:6vmin}.ip-res svg.sink{animation:ipsk .45s ease-in forwards}@keyframes ipsk{to{transform:translateY(180%);opacity:0}}
/* 3g — bố cục B */
.ip-row{position:absolute;inset:0;left:0;bottom:0;transform:none;height:auto;display:block}
.ip-ped{position:absolute;bottom:4vh;margin:0}
.ip-gas{left:5vw;height:54vh}.ip-brk{right:5vw;height:46vh}
.ip-wbox{position:absolute;left:50%;bottom:0;width:66vh;height:66vh;margin-left:-33vh}
.ip-wheel{width:66vh;height:66vh;margin-left:-33vh;bottom:-9.6vh}
.ip-fire{top:6vh;right:5vw;width:17vh;height:17vh}.ip-res{top:25vh;right:5vw;width:17vh}
.ipc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4vmin;padding:4vmin;box-sizing:border-box}
.ipc h1{margin:0;font:italic 900 max(30px,6vmin) "Exo 2",sans-serif;letter-spacing:.08em;color:#fff3dd}
.ipc p{margin:0;font-size:max(17px,2.4vmin);color:#94a3b8}
.ipc-row{display:flex;gap:5vmin;flex-wrap:wrap;justify-content:center}
.ipc-b{width:min(38vmin,380px);aspect-ratio:1.2;border-radius:4vmin;border:3px solid var(--tc);background:rgba(255,255,255,.04);color:var(--tc);cursor:pointer;padding:0;
  font:italic 900 max(28px,5vmin) "Exo 2",sans-serif;letter-spacing:.1em;box-shadow:0 0 4vmin color-mix(in srgb,var(--tc) 30%,transparent)}
`;
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M3 3l18 18"/></svg>';
const TXT = { on: "Connected", relay: "Connected (slow)", connecting: "Connecting…", nogame: "Waiting for the game" };
const MODE = ["iPad off", "Answer on iPad", "Drive on iPad"];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let styled = false;
function style() { if (styled) return; styled = true; const st = document.createElement("style"); st.textContent = CSS; document.head.append(st); }
function noGestures(root) { ["contextmenu", "dblclick", "gesturestart", "touchmove"].forEach(ev => root.addEventListener(ev, e => e.preventDefault(), { passive: false })); }

export function mountPadApp(mount, { team, client, onBack }) {
  style();
  const t = team ? 1 : 0, m = TEAM_META[t];
  mount.innerHTML = `<div class="ip" style="--tc:${m.color}" data-s="nogame" data-m="w" data-alarm="0">
    <div class="ip-top">${onBack ? `<button class="ip-back" aria-label="Choose team">${BACK}</button>` : ""}<b class="ip-team">${m.name}</b><span class="ip-st"><i></i><span></span></span><span class="ip-rtt"></span><span class="ip-mode"></span></div>
    <div class="ip-scr ip-wait"><div class="ip-msg"><b>RACING WORDS</b><span>Open RACING WORDS on the big screen — this iPad links by itself.</span></div></div>
    <div class="ip-scr ip-off"><div class="ip-msg">${OFF}<b>iPad is OFF</b><span>The big screen is playing without iPads.<br>Choose "Answer on iPad" or "Drive on iPad" with the iPad button on the big screen.</span></div></div>
    <div class="ip-scr ip-ans"><div class="ip-q"></div><div class="ip-a"></div><div class="ip-msg ip-ready"><b>GET READY</b><span>Questions show here when the race starts.</span></div></div>
    <div class="ip-scr ip-drv">
      <div class="ip-warn"></div>
      <button class="ip-fire" data-k="f" aria-label="Fire missile">${FIRE_ICON}</button><div class="ip-res"></div>
      <div class="ip-row">
        <button class="ip-ped ip-gas" data-k="b" aria-label="Boost">${GAS_SVG}</button>
        <div class="ip-wbox"><div class="ip-wheel">${WHEEL_SVG}
          <div class="ip-scrn"><div class="ip-src">iPAD</div><div class="ip-kmh"><span>0</span><small>km/h</small></div><div class="ip-cells"><i></i><i></i><i></i><i></i></div><div class="ip-nbar"><em></em></div></div></div></div>
        <button class="ip-ped ip-brk" data-k="k" aria-label="Brake">${BRAKE_SVG}</button>
      </div>
    </div></div>`;
  const root = mount.firstElementChild, $ = s => root.querySelector(s);
  const wbox = $(".ip-wbox"), wheel = $(".ip-wheel"), gas = $(".ip-gas"), brk = $(".ip-brk"), fireB = $(".ip-fire");
  // ---- lái: nhiều ngón cùng lúc, mỗi pointerId 1 việc ----
  const held = new Map();
  let steerVis = 0;
  const send = () => {
    const v = [...held.values()], steer = (v.includes("r") ? 1 : 0) - (v.includes("l") ? 1 : 0), boost = v.includes("b"), brake = v.includes("k");
    client.drive(steer, boost, brake);
    wbox.classList.toggle("l", v.includes("l")); wbox.classList.toggle("r", v.includes("r"));
    gas.classList.toggle("on", boost); brk.classList.toggle("on", brake);
    steerVis = steer;
  };
  const bind = (el, kindOf) => {
    el.addEventListener("pointerdown", e => { e.preventDefault(); const k0 = kindOf(e); if (!k0) return; try { el.setPointerCapture(e.pointerId); } catch (x) { /* */ } held.set(e.pointerId, k0); send(); });
    el.addEventListener("pointermove", e => { if (!held.has(e.pointerId)) return; const k = kindOf(e); if (k && k !== held.get(e.pointerId)) { held.set(e.pointerId, k); send(); } });
    const up = e => { if (held.delete(e.pointerId)) send(); };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => el.addEventListener(n, up));
  };
  bind(wbox, e => {                                        // chỉ trong vòng tròn vô lăng (+12 %)
    const r = wheel.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), rad = wheel.offsetWidth / 2 * 1.12;
    return dx * dx + dy * dy <= rad * rad ? (dx < 0 ? "l" : "r") : null; });
  bind(gas, () => "b"); bind(brk, () => "k");
  let msN = 0, msShown = -1, msHold = 0;
  const slots = [...fireB.querySelectorAll(".sr-slot")], busy = [0, 0], resEl = $(".ip-res");
  const paintSlots = () => { const now = performance.now(), ready = Math.min(msN, 2);
    slots.forEach((sl, j) => { if (now < busy[j]) return; const on = j < ready, was = sl.classList.contains("on");
      if (on && !was) { sl.classList.remove("load"); void sl.offsetWidth; sl.classList.add("on", "load"); } else if (!on && was) sl.classList.remove("on", "load"); });
    if (msShown !== msN && now > msHold) { msShown = msN; resEl.innerHTML = reserveHTML(Math.max(0, msN - 2)); } };
  fireB.addEventListener("pointerdown", e => {                // như game: chính quả trong nút bay; còn kho ⇒ icon chờ thụt xuống + quả mới trồi lên
    e.preventDefault(); if (msN <= 0) return; client.send("fire"); fireB.classList.add("hit"); setTimeout(() => fireB.classList.remove("hit"), 160);
    const n = msN, j = Math.min(n, 2) - 1, sl = slots[j], reload = n >= 3, now = performance.now();
    busy[j] = now + 1100; sl.classList.remove("load"); void sl.offsetWidth; sl.classList.add("fly");
    if (reload) { msHold = now + 700; const ic = resEl.querySelectorAll("svg"); ic[ic.length - 1]?.classList.add("sink"); }
    setTimeout(() => { sl.classList.remove("fly"); if (reload) { void sl.offsetWidth; sl.classList.add("on", "load"); } else sl.classList.remove("on"); }, 520);
    msN = n - 1; setTimeout(() => { msShown = -1; paintSlots(); }, 720);
  });
  // vô lăng quay mượt theo tay (như game: 70° khi bẻ hết)
  let wv = 0, raf = 0;
  const spin = () => { wv += (steerVis * 70 - wv) * 0.35; wheel.style.transform = `rotate(${wv.toFixed(1)}deg)`; raf = requestAnimationFrame(spin); };
  raf = requestAnimationFrame(spin);
  // ---- trả lời ----
  const ansEl = $(".ip-ans"), qEl = $(".ip-q"), aEl = $(".ip-a"), readyEl = $(".ip-ready");
  let q = null;
  aEl.addEventListener("pointerdown", e => {
    const b = e.target.closest("button"); if (!b || !q || q.lock || aEl.classList.contains("lock")) return;
    e.preventDefault(); aEl.classList.add("lock"); client.answer(+b.dataset.k, q.n);
  });
  function paintQ() {
    const live = q && q.ph === "race" && q.q;
    ansEl.classList.toggle("is-shown", !!live && root.dataset.m === "1");
    qEl.style.display = aEl.style.display = live ? "" : "none"; readyEl.style.display = live ? "none" : "";
    readyEl.querySelector("b").textContent = q && q.ph === "end" ? "RACE OVER" : q && q.ph === "count" ? "3 · 2 · 1…" : "GET READY";
    if (!live) return;
    const n = q.q.length;
    qEl.textContent = q.q; qEl.dataset.len = n > 90 ? "xl" : n > 55 ? "l" : "";
    if (aEl.dataset.qn !== String(q.n)) { aEl.dataset.qn = String(q.n); aEl.dataset.n = q.a.length; aEl.innerHTML = q.a.map((a, k) => `<button type="button" data-k="${k}">${esc(a)}</button>`).join(""); }
    const bs = aEl.querySelectorAll("button");
    bs.forEach((b, k) => { b.classList.toggle("ok", q.pick === k && !!q.ok); b.classList.toggle("bad", q.pick === k && !q.ok); b.classList.toggle("rev", (q.rev || []).includes(k)); });
    aEl.classList.toggle("lock", !!q.lock);
  }
  root.querySelector(".ip-back")?.addEventListener("click", () => { cancelAnimationFrame(raf); onBack(); });
  noGestures(root);
  let lock = null;
  const keep = async () => { if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* */ } };
  keep(); document.addEventListener("visibilitychange", keep); root.addEventListener("pointerdown", keep, { once: true });
  return {
    setState({ s, rtt }) {
      root.dataset.s = s;
      $(".ip-st > span").textContent = TXT[s] || "";
      $(".ip-rtt").textContent = s === "on" && rtt ? rtt + " ms" : "";
      if (s === "nogame") root.dataset.m = "w";
    },
    setMode(mode) {
      root.dataset.m = String(mode); $(".ip-mode").textContent = MODE[mode] || "";
      if (mode !== 2 && held.size) { held.clear(); send(); }
      paintQ();
    },
    setQ(v) { q = v; paintQ(); },
    setInfo(i) {
      $(".ip-kmh span").textContent = i.kmh;
      root.querySelectorAll(".ip-cells i").forEach((c, k) => c.style.setProperty("--f", Math.max(0, Math.min(1, i.cells - k)).toFixed(2)));
      $(".ip-nbar em").style.transform = `scaleX(${(i.nitro || 0).toFixed(2)})`;
      $(".ip-gas .sr-nfill").style.transform = `scaleY(${(i.nitro || 0).toFixed(2)})`; gas.classList.toggle("nitro", (i.nitro || 0) > 0.01);
      msN = i.ms; paintSlots(); fireB.classList.toggle("ready", i.ms > 0 && i.phase === "race");
      root.dataset.alarm = String(root.dataset.m === "2" ? i.alarm || 0 : 0);
      $(".ip-warn").textContent = i.alarm === 2 ? "DODGE!" : i.alarm === 1 ? "⚠ MISSILE" : "";
    },
  };
}

export function mountPadChooser(mount, { onPick }) {
  style();
  mount.innerHTML = `<div class="ipc"><h1>RACING WORDS · iPad</h1><p>Choose this iPad's team</p>
    <div class="ipc-row">${[0, 1].map(t => `<button class="ipc-b" data-t="${t}" style="--tc:${TEAM_META[t].color}">${TEAM_META[t].name}</button>`).join("")}</div>
    <p>The big screen decides what this iPad does: answer the questions, or be the steering wheel.</p></div>`;
  mount.querySelectorAll(".ipc-b").forEach(b => b.addEventListener("click", () => onPick(+b.dataset.t)));
  noGestures(mount.firstElementChild);
}
