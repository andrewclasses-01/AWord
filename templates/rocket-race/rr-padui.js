// ⚠️ ĐỢT 511 — CHÉP từ myGame rocket-race/core/rr-padui-9.js (mẫu 9, myGame 4755fe1). Sửa ở myGame trước (mẫu mới) rồi chép lại; chỉ đổi đường import.
// ROCKET RACE mẫu 9 — MÀN ĐIỀU KHIỂN TÊN LỬA TRÊN iPAD (13/10/2026). Thầy chốt: nút BẮN + BOOST to · báo động tên lửa tới · tiếng + rung ·
// vị trí 2 tàu. Câu hỏi + ô đáp án VẪN ở màn lớn (iPad không có câu hỏi).
//   mountMissilePad(mount, { team, client, onBack }) ⇒ { setState({ s, rtt }), setInfo(obj), event(name) }
//   mountPadChooser(mount, { onPick })               — màn chọn đội
// ⭐ 13/10 (thầy: "vạch, tên lửa, nút boost cần có thiết kế 3D giống hệt trên game thật"): phần dưới = BẢNG 3D CỦA CHÍNH GAME (rr-padscene-9.js);
//   NGANG: khu tên lửa trái · BOOST phải; DỌC: trên/dưới. Trên cùng: đội · đèn nối · ĐƯỜNG ĐUA MINI (tàu mình + tàu địch + vạch đích).
//   Tên lửa ĐANG BAY TỚI (kể cả bay vào tàu kia mà 2 tàu cùng nấc — trúng lan) ⇒ viền đỏ nhấp nháy + đếm giây + bíp nhanh dần;
//   vào 1,25 s cuối mà có BOOST ⇒ nút BOOST chớp "BOOST NOW!" (né được). Đứng dọc vẫn dùng được (FIRE trên, BOOST dưới).
// Tiếng tự tổng hợp Web Audio (iOS: mở khoá ở lần chạm đầu tiên). Rung: navigator.vibrate — Safari iPad KHÔNG hỗ trợ (bỏ qua êm).
// ⭐⭐ ĐỢT 514 (thầy 14/10/2026, duyệt MẪU 11 ở myGame): bảng 3D MỚI (rr-padscene.js) PHỦ CẢ MÀN sau thanh trên (tên lửa phóng bay qua thanh
//   lên tới mép trên) · đường đua mini: 2 CHẤM TRÒN (như mẫu) + tên lửa 2D NHỎ, PHẲNG, CHUI RA từ chấm tàu bắn (lớn dần, không hiện đột ngột)
//   · viền đỏ báo động = HTML (bảng mới không có khung 3D) · chạm quả to nào bắn quả đó ("fire0"/"fire1")
//   · đội đã có iPad ⇒ iPad này hiện "<ĐỘI> ALREADY HAS AN iPAD" (Try again / Choose team), không giành nữa; màn chọn đội chặn luôn đội đó.
import { TEAM_META } from "./rr-padlink.js";
import { createPadScene } from "./rr-padscene.js";

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;background:#05060a;overscroll-behavior:none}
.mp,.mpc{position:fixed;inset:0;font-family:"Exo 2",system-ui,sans-serif;color:#e2e8f0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
  background:radial-gradient(120% 90% at 50% 0%,#17203a 0%,#07090f 60%,#030408 100%)}
.mp{touch-action:none;display:grid;grid-template-rows:auto 1fr;gap:2.4vmin;padding:max(2.4vmin,env(safe-area-inset-top)) max(2.4vmin,env(safe-area-inset-right)) max(2.4vmin,env(safe-area-inset-bottom)) max(2.4vmin,env(safe-area-inset-left));box-sizing:border-box}
.mp::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;z-index:3;box-shadow:inset 0 0 0 1.1vmin rgba(255,40,30,.95),inset 0 0 14vmin rgba(255,30,20,.7)}
.mp[data-alarm="1"]::after{animation:mpa .5s ease-in-out infinite alternate;opacity:.45}
.mp[data-alarm="2"]::after{animation:mpa .09s linear infinite alternate}
/* mẫu 9 · 3D: viền đỏ báo động = khung cảnh báo 3D của chính bảng game (không vẽ thêm viền HTML) */
@keyframes mpa{from{opacity:.15}to{opacity:1}}
.mp-top{display:flex;align-items:center;gap:2vmin;min-height:12vmin}
.mp-back{width:9vmin;height:9vmin;border-radius:2.4vmin;border:0;background:rgba(255,255,255,.08);color:#cbd5e1;font:900 5vmin/1 "Exo 2",sans-serif;cursor:pointer}
.mp-team{padding:1.2vmin 2.6vmin;border-radius:2.4vmin;background:var(--tc);color:#fff;font:900 3.6vmin/1 "Exo 2",sans-serif;letter-spacing:.1em;white-space:nowrap}
.mp-link{display:flex;align-items:center;gap:1vmin;font:700 2.2vmin "Exo 2",sans-serif;color:#94a3b8;white-space:nowrap}
.mp-link i{width:2.2vmin;height:2.2vmin;border-radius:50%;background:#64748b}
.mp[data-s="on"] .mp-link i{background:#22c55e;box-shadow:0 0 1.4vmin #22c55e}
.mp[data-s="relay"] .mp-link i{background:#f59e0b}
.mp[data-s="connecting"] .mp-link i,.mp[data-s="nogame"] .mp-link i{animation:mpb 1s infinite}
@keyframes mpb{50%{opacity:.25}}
.mp-track{position:relative;flex:1;height:12vmin;min-width:20vmin}
/* ⭐ (thầy 13/10) tên lửa 2D bay trên đường đua mini theo ĐÚNG tên lửa trong game + nổ chỗ trúng / chỗ 2 quả đâm nhau */
.mp-fly{position:absolute;inset:0;pointer-events:none;overflow:visible}
/* Đợt 514: tên lửa 2D NHỎ, PHẲNG (không bóng/sáng), nằm DƯỚI chấm tàu ⇒ lúc phóng như chui ra từ chấm */
.mp-ms{position:absolute;left:0;top:0;width:2.8vmin;height:.9vmin;margin:-.45vmin 0 0 -1.4vmin;will-change:transform;z-index:1}
.mp-ms svg{width:100%;height:100%;overflow:visible;display:block}
.mp-ms.peace path.b{fill:#22c55e}
.mp-boom{position:absolute;z-index:3;width:9vmin;height:9vmin;margin:-4.5vmin 0 0 -4.5vmin;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,#fff 0%,#ffe08a 18%,#ff8a2a 40%,rgba(255,60,20,.6) 58%,rgba(255,40,10,0) 72%);animation:mpboom .7s ease-out forwards}
.mp-boom.big{width:14vmin;height:14vmin;margin:-7vmin 0 0 -7vmin}
.mp-boom::after{content:"";position:absolute;inset:-20%;border-radius:50%;border:.5vmin solid rgba(255,190,120,.9);animation:mpring .7s ease-out forwards}
.mp-boom.puff{background:radial-gradient(circle,rgba(255,200,150,.8) 0%,rgba(255,120,60,.4) 35%,rgba(0,0,0,0) 65%);width:5vmin;height:5vmin;margin:-2.5vmin 0 0 -2.5vmin}
.mp-boom.puff::after{display:none}
@keyframes mpboom{0%{transform:scale(.2);opacity:1}60%{opacity:.9}100%{transform:scale(1.25);opacity:0}}
@keyframes mpring{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.5);opacity:0}}
.mp-track::before{content:"";position:absolute;left:2vmin;right:4vmin;top:50%;height:.6vmin;border-radius:.3vmin;background:rgba(148,163,184,.3)}
.mp-flag{position:absolute;right:0;top:50%;transform:translateY(-50%);width:3vmin;height:5vmin;
  background:conic-gradient(#fff 25%,#111 0 50%,#fff 0 75%,#111 0) 0 0/1.5vmin 1.25vmin;border-radius:.4vmin}
/* ⭐ (thầy 13/10) 2 tàu trên đường đua mini CÙNG CỠ (trước: tàu mình to hơn, tàu địch mờ) */
/* Đợt 514: 2 tàu = 2 CHẤM TRÒN màu đội (như mẫu 11) */
.mp-ship{position:absolute;top:50%;width:3.6vmin;height:3.6vmin;margin-left:-1.8vmin;transform:translateY(-50%);transition:left .45s cubic-bezier(.3,.8,.3,1);
  border-radius:50%;background:var(--c);box-shadow:0 0 1.6vmin var(--c);z-index:2}
.mp-ship.foe{top:calc(50% + 1.6vmin)}
.mp-ship.me{top:calc(50% - 1.4vmin)}
.mp-steps{font:900 3vmin/1 "Exo 2",sans-serif;color:#e2e8f0;white-space:nowrap}
.mp-top{position:relative;z-index:2}
/* Đợt 514: bảng 3D phủ CẢ MÀN phía sau thanh trên (tên lửa phóng bay lên tới mép trên màn) */
.mp-main.mp-3d{position:absolute;inset:0;z-index:0}
.mp-3d{display:block;position:relative;border-radius:3vmin;overflow:hidden;background:#03050b;touch-action:none}
.mp-3d-err{position:absolute;inset:0;display:grid;place-items:center;font:800 3vmin "Exo 2",sans-serif;color:#fca5a5}
.mp-3d-err[hidden]{display:none}

/* (mẫu 9 · 3D) nút FIRE / BOOST HTML cũ đã bỏ — bảng 3D của game thay thế, xem rr-padscene-9.js */
/* báo động + màn phủ */
.mp-inc{position:absolute;left:50%;top:13vmin;transform:translateX(-50%);z-index:3;padding:1.2vmin 3vmin;border-radius:2.4vmin;background:rgba(127,29,29,.92);
  color:#fff;font:900 3.6vmin/1 "Exo 2",sans-serif;letter-spacing:.08em;white-space:nowrap;display:none;pointer-events:none;box-shadow:0 0 4vmin rgba(255,40,30,.6)}
.mp[data-alarm="1"] .mp-inc,.mp[data-alarm="2"] .mp-inc{display:block}
.mp-cover{position:absolute;inset:0;z-index:4;display:none;flex-direction:column;align-items:center;justify-content:center;gap:2vmin;background:rgba(3,4,8,.82);text-align:center;pointer-events:none}
.mp-cover.on{display:flex}
.mp-cover b{font:900 9vmin/1 "Exo 2",sans-serif;letter-spacing:.08em}
.mp-cover p{margin:0;font:700 3vmin/1.4 "Exo 2",sans-serif;color:#94a3b8;max-width:80vmin}
.mp-cover.win b{color:#fde047;text-shadow:0 0 4vmin rgba(253,224,71,.6)}
.mp-cover.lose b{color:#f87171}
.mp-cover b{max-width:92vw}
.mp-cover.kicked,.mp-cover.taken{pointer-events:auto}.mp-cover.kicked b,.mp-cover.taken b{font-size:6vmin;color:#fcd34d}
.mp-cbtns{display:none;gap:3vmin;margin-top:2vmin}.mp-cover.kicked .mp-cbtns,.mp-cover.taken .mp-cbtns{display:flex}
.mp-cbtns button{border:0;border-radius:2.4vmin;padding:2vmin 4vmin;font:900 3.4vmin "Exo 2",sans-serif;letter-spacing:.06em;color:#fff;background:var(--tc);cursor:pointer}
.mp-cbtns button+button{background:rgba(255,255,255,.12)}
/* màn chờ chung (như pad.html của AWord) */
.mph{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3vmin;padding:6vmin;box-sizing:border-box;text-align:center;
  font-family:"Exo 2",system-ui,sans-serif;color:#e2e8f0;background:radial-gradient(120% 90% at 30% 20%,#1a1440 0%,#07060f 60%,#020208 100%)}
.mph b{font:900 6vmin "Exo 2",sans-serif;letter-spacing:.06em}.mph p{margin:0;font:700 3vmin/1.45 "Exo 2",sans-serif;color:#94a3b8;max-width:90vmin}
.mph a{color:#7dd3fc;cursor:pointer}
.mp-relay{position:absolute;left:50%;bottom:1vmin;transform:translateX(-50%);z-index:3;font:700 2vmin "Exo 2",sans-serif;color:#fcd34d;display:none;white-space:nowrap}
.mp[data-s="relay"] .mp-relay{display:block}
/* màn chọn đội */
.mpc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5vmin}
.mpc h2{margin:0;font:900 5vmin "Exo 2",sans-serif;letter-spacing:.1em}
.mpc div{display:flex;gap:5vmin}
.mpc button{width:34vmin;height:24vmin;border:0;border-radius:4vmin;background:var(--tc);color:#fff;font:900 6vmin "Exo 2",sans-serif;letter-spacing:.08em;cursor:pointer;box-shadow:0 1.4vmin 3vmin rgba(0,0,0,.5);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vmin}
.mpc button.cur{box-shadow:0 0 0 1vmin #fff,0 1.4vmin 3vmin rgba(0,0,0,.5)}
.mpc button small{font:700 2.2vmin "Exo 2",sans-serif;letter-spacing:.04em;opacity:.9}
.mpc .mpc-x{margin:0;font:700 2.6vmin "Exo 2",sans-serif;color:#94a3b8}
`;
function css() {
  if (document.getElementById("mp-css")) return;
  if (!document.getElementById("aw-rr3d-exo2")) {             // AWord pad.html: font Exo 2 (chữ bảng) — như rr3dLaunch
    const lk = document.createElement("link"); lk.id = "aw-rr3d-exo2"; lk.rel = "stylesheet";
    lk.href = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,700;0,800;0,900;1,900&display=swap"; document.head.append(lk);
  }
  const s = document.createElement("style"); s.id = "mp-css"; s.textContent = CSS; document.head.append(s);
}

const SHIP = () => "";   // Đợt 514: tàu = chấm tròn (CSS .mp-ship, màu --c)

// ---------------------------------------------------------------- tiếng (Web Audio tổng hợp — không file)
function makeSound() {
  let ac = null;
  const unlock = () => { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) { /* */ } };
  function tone(f0, f1, dur, type = "sine", vol = 0.25, at = 0) {
    if (!ac) return; const t = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, f0, f1, vol = 0.3) {
    if (!ac) return; const t = ac.currentTime, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = b; f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(ac.destination); s.start(t);
  }
  const P = {
    fire() { noise(0.55, 600, 3200, 0.45); tone(180, 90, 0.4, "sawtooth", 0.12); },
    boost() { noise(0.7, 300, 1800, 0.35); tone(220, 880, 0.45, "triangle", 0.18); },
    dodge() { tone(500, 1400, 0.25, "triangle", 0.2); },
    hit() { noise(0.6, 900, 120, 0.6); tone(120, 40, 0.5, "sine", 0.4); },
    mplus() { tone(880, 880, 0.12, "sine", 0.2); tone(1320, 1320, 0.18, "sine", 0.2, 0.1); },
    full() { tone(660, 660, 0.1, "triangle", 0.18); tone(990, 990, 0.18, "triangle", 0.18, 0.09); },
    refuse() { tone(160, 120, 0.15, "square", 0.08); },
    beep(hi) { tone(hi ? 1500 : 1100, hi ? 1500 : 1100, 0.07, "square", 0.09); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.3, "triangle", 0.2, i * 0.13)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, f * 0.98, 0.35, "sawtooth", 0.1, i * 0.18)); },
  };
  return { unlock, play: n => P[n] && P[n]() };
}
// chỉ rung sau một cú CHẠM THẬT (isTrusted) — Chrome chặn + báo lỗi console nếu chưa chạm; userActivation không đủ (cú click do script cũng bật nó)
let touched = false;
addEventListener("pointerdown", e => { if (e.isTrusted) touched = true; }, { capture: true, passive: true });
const buzz = p => { try { if (touched && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* Safari iPad không có — bỏ qua */ } };

export function mountMissilePad(mount, { team, client, onBack }) {
  css();
  const meta = TEAM_META[team], foe = TEAM_META[1 - team];
  mount.innerHTML = `<div class="mp" data-s="connecting" style="--tc:${meta.color}">
    <div class="mp-top">
      <button class="mp-back" type="button" aria-label="Back">‹</button>
      <div class="mp-team">${meta.name}</div>
      <div class="mp-link"><i></i><span>Connecting…</span></div>
      <div class="mp-track"><div class="mp-ship foe" style="--c:${foe.color}">${SHIP()}</div><div class="mp-ship me" style="--c:${meta.color}">${SHIP()}</div><div class="mp-flag"></div><div class="mp-fly"></div></div>
      <div class="mp-steps">0%</div>
    </div>
    <div class="mp-main mp-3d"><div class="mp-3d-err" hidden>3D is not available on this device.</div></div>
    <div class="mp-inc">⚠ INCOMING <span></span></div>
    <div class="mp-cover on"><b>WAITING</b><p>Open Rocket Race on the classroom screen and choose iPad ▸ Game controller.</p>
      <div class="mp-cbtns"><button type="button" data-k="take">Try again</button><button type="button" data-k="team">Choose team</button></div></div>
    <div class="mp-relay">Slow link (no direct connection) — buttons work, status is not shown</div>
  </div>`;
  const root = mount.firstElementChild, q = s => root.querySelector(s);
  const linkS = q(".mp-link span"), cover = q(".mp-cover"), incS = q(".mp-inc span");
  const shipMe = q(".mp-ship.me"), shipFoe = q(".mp-ship.foe"), stepsEl = q(".mp-steps");
  // ---- tên lửa 2D trên đường đua mini: máy chiếu gửi fl = [[id, từ, tới, t, dur]] (đúng đường bay trong game) ⇒ iPad tự chạy t giữa 2 lần gửi.
  // Đường cong: rời tàu bắn ⇒ vồng LÊN ⇒ lao XUỐNG tàu bị bắn (như game: lên trời rồi bổ nhào). Nổ: "boom:<tàu>" (trúng) · "clash" (2 quả đâm nhau).
  const track = q(".mp-track"), flyEl = q(".mp-fly");
  const shipPct = [50, 50];                         // % ngang tâm tàu đội 0 / đội 1 (theo setInfo)
  const shipDy = s => (s === team ? -1.4 : 1.6);    // vmin lệch dọc so với giữa đường (tàu mình ở trên)
  // Đợt 514: phẳng 2D — lửa đuôi vàng · thân đỏ một màu mũi bo · cánh sẫm (không viền, không bóng)
  const MS_SVG = `<svg viewBox="0 0 30 10"><path d="M-7 5 L1 2.6 L1 7.4 Z" fill="#ffc23a"/><path class="b" d="M1 2 H20 Q29 2.4 30 5 Q29 7.6 20 8 H1 Z" fill="#ef2b2b"/><path d="M1 2 L-1 -1 L6 2 Z M1 8 L-1 11 L6 8 Z" fill="#9f1018"/></svg>`;
  const flights = new Map();                        // id → { el, from, to, t, dur, x, y }
  let peaceNow = false;
  const vmin = () => Math.min(innerWidth, innerHeight) / 100;
  function flyPos(f) {
    const W = track.clientWidth, H = track.clientHeight, v = vmin(), k = Math.max(0, Math.min(1, f.t / f.dur));
    const x0 = W * shipPct[f.from] / 100, x1 = W * shipPct[f.to] / 100, y0 = H / 2 + shipDy(f.from) * v, y1 = H / 2 + shipDy(f.to) * v;
    const arc = Math.min(H / 2 - 0.6 * v, 4.4 * v);
    const ease = k * k * (3 - 2 * k) * 0.35 + k * 0.65;   // nhanh dần cuối đường như game
    const x = x0 + (x1 - x0) * ease, y = y0 + (y1 - y0) * ease - arc * Math.sin(Math.PI * Math.min(1, ease * 1.15));
    return { x, y };
  }
  function boomAt(x, y, cls = "") {
    const b = document.createElement("div"); b.className = "mp-boom " + cls;
    b.style.left = x + "px"; b.style.top = y + "px"; flyEl.append(b); setTimeout(() => b.remove(), 800);
  }
  function dropFlight(id, how) {
    const f = flights.get(id); if (!f) return;
    if (how) boomAt(f.x, f.y, how);
    f.el.remove(); flights.delete(id);
  }
  function setFlights(list) {
    const seen = new Set();
    (list || []).forEach(([id, from, to, t, dur]) => {
      seen.add(id);
      let f = flights.get(id);
      if (!f) { const el = document.createElement("div"); el.className = "mp-ms"; el.innerHTML = MS_SVG; flyEl.append(el); f = { el, from, to, t, dur, x: 0, y: 0 }; flights.set(id, f); }
      f.dur = Math.max(0.2, dur); if (Math.abs(f.t - t) > 0.2) f.t = t;
      f.el.classList.toggle("peace", peaceNow);
    });
    [...flights.keys()].forEach(id => { if (!seen.has(id)) dropFlight(id, "puff"); });   // biến mất không kèm sự kiện (né rồi nổ xa) ⇒ khói nhỏ
  }
  let flyRaf = 0, flyLast = performance.now();
  (function flyFrame(now) {
    flyRaf = requestAnimationFrame(flyFrame);
    const dt = Math.min(0.1, (now - flyLast) / 1000); flyLast = now;
    flights.forEach(f => {
      const a = flyPos(f); f.t += dt; const b = flyPos(f);
      f.x = b.x; f.y = b.y;
      const ang = Math.atan2(b.y - a.y, b.x - a.x) || (shipPct[f.to] >= shipPct[f.from] ? 0 : Math.PI);
      const k = f.t / f.dur, g = Math.max(0, Math.min(1, k / 0.12)), em = g * g * (3 - 2 * g);   // Đợt 514: CHUI RA từ chấm tàu — lớn dần 12 % đầu đường
      f.el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${ang}rad) scale(${0.25 + 0.75 * em})`;
    });
  })(flyLast);
  const snd = makeSound();
  let info = null, conn = "connecting", alarmT = 0, beepAt = 0;

  // ⭐ mẫu 9 (thầy): vạch · tên lửa · nút BOOST = CHÍNH bảng 3D của game (rr-padscene-9.js). Chạm đúng vùng chạm của game:
  // quả to = bắn · hàng quả nhỏ = nạp · BOOST. Không gửi được (chưa nối) ⇒ bảng lắc từ chối như game.
  let scene = null;
  try {
    scene = createPadScene({ mount: q(".mp-3d"), team, topEl: q(".mp-top"), onKey: k => {   // k = "fire0" | "fire1" | "boost"
      snd.unlock();
      if (!client.send(k)) scene && scene.event(k === "boost" ? "refuse-boost" : "refuse-fire");
    } });
  } catch (e) { console.warn("iPad 3D", e); q(".mp-3d-err").hidden = false; }
  q(".mp-back").addEventListener("click", () => onBack && onBack());
  q('[data-k="take"]').addEventListener("click", () => { snd.unlock(); client.reconnect(); });
  q('[data-k="team"]').addEventListener("click", () => onBack && onBack());
  root.addEventListener("contextmenu", e => e.preventDefault());

  function paintCover() {
    let cls = "", title = "", text = "";
    if (conn === "taken" || conn === "kicked") { cls = "taken"; title = meta.name + " ALREADY HAS AN iPAD";
      text = "Another iPad is connected to this team. Choose the other team, or keep this screen open: it joins by itself when that iPad leaves."; }
    else if (conn === "nogame") { title = "WAITING"; text = "Open Rocket Race on the classroom screen and choose iPad ▸ Game controller."; }
    else if (conn !== "on" && conn !== "relay") { title = "CONNECTING…"; text = "Same Wi-Fi as the classroom screen."; }
    else if (conn === "on" && !info) { title = "CONNECTED"; text = "Waiting for the race."; }
    else if (info && info.ph !== "play" && info.ph !== "over") { title = info.ph === "count" ? "GET READY" : "READY"; text = "Answer on the big screen. Fire missiles and BOOST from here."; }
    else if (info && info.ph === "over" && info.w >= 0) { cls = info.w === team ? "win" : "lose"; title = info.w === team ? "YOU WIN!" : "YOU LOSE"; }
    cover.className = "mp-cover" + (title ? " on " + cls : "");
    if (title) { cover.querySelector("b").textContent = title; cover.querySelector("p").textContent = text; }
  }
  function setInfo(o) {
    const prev = info; info = o;
    // đường đua mini
    const L = Math.max(1, o.L || 1), x = p => 2 + (Math.max(0, Math.min(L, p)) / L) * 88;
    shipMe.style.left = `calc(${x(o.p[team])}% )`; shipFoe.style.left = `calc(${x(o.p[1 - team])}% )`;
    shipPct[0] = x(o.p[0]); shipPct[1] = x(o.p[1]); peaceNow = !!o.pc;
    setFlights(o.ph === "play" || o.ph === "over" ? o.fl : []);
    // ⭐ (thầy 13/10) chỗ đích ghi % như thanh % trong game thật: tàu DẪN ĐẦU đã đi bao nhiêu phần đường (= view.lead() = max(p) / L, AWord Đợt 444)
    stepsEl.textContent = Math.round(100 * Math.max(0, Math.min(1, Math.max(o.p[0], o.p[1]) / L))) + "%";
    if (scene) scene.setInfo(o);
    // báo động: thr = giây tới lúc tên lửa nổ ở tàu mình (kể cả trúng lan) — −1 = không có. Khung đỏ 3D do bảng game tự vẽ.
    const thr = o.thr, inWin = thr >= 0 && thr <= o.win;
    root.dataset.alarm = thr < 0 || o.ph !== "play" ? "0" : inWin ? "2" : "1";
    incS.textContent = thr >= 0 ? thr.toFixed(1) + " s" + (inWin && o.ar && o.ar.boost ? " · BOOST NOW!" : "") : "";
    alarmT = thr;
    if (prev && prev.ar && o.ar && !prev.ar.boost && o.ar.boost) { snd.play("full"); buzz(60); }
    paintCover();
  }
  // bíp báo động nhanh dần theo số giây còn lại
  const beepI = setInterval(() => {
    if (!info || alarmT < 0 || info.ph !== "play") return;
    const now = performance.now(), gap = alarmT <= info.win ? 140 : alarmT <= 2.5 ? 300 : 560;
    if (now - beepAt >= gap) { beepAt = now; snd.play("beep"); }
  }, 40);
  function event(name) {
    if (scene) scene.event(name);
    // nổ trên đường đua mini: trúng tàu ⇒ nổ ĐÚNG tàu đó (gỡ quả đang lao vào nó) · 2 quả đâm nhau ⇒ nổ TO giữa 2 quả
    if (name.startsWith("boom:")) {
      const side = +name.slice(5), W = track.clientWidth, H = track.clientHeight;
      let best = null; flights.forEach((f, id) => { if (f.to === side && (!best || f.t / f.dur > best.k)) best = { id, k: f.t / f.dur }; });
      if (best) dropFlight(best.id);
      boomAt(W * shipPct[side] / 100, H / 2 + shipDy(side) * vmin(), "");
      return;
    }
    if (name === "clash") {
      const a = [...flights.entries()].filter(([, f]) => f.from === 0).sort((p, q2) => q2[1].t - p[1].t)[0];
      const b = [...flights.entries()].filter(([, f]) => f.from === 1).sort((p, q2) => q2[1].t - p[1].t)[0];
      if (a && b) { boomAt((a[1].x + b[1].x) / 2, (a[1].y + b[1].y) / 2, "big"); dropFlight(a[0]); dropFlight(b[0]); }
      else if (a || b) { const f = (a || b); boomAt(f[1].x, f[1].y, "big"); dropFlight(f[0]); }
      return;
    }
    if (name === "fire") { snd.play("fire"); buzz(40); }
    else if (name === "boost") { snd.play("boost"); buzz(50); }
    else if (name === "dodge") { snd.play("dodge"); buzz([30, 40, 30]); }
    else if (name === "hit") { snd.play("hit"); buzz([120, 60, 200]); }
    else if (name === "mplus") { snd.play("mplus"); buzz(40); }
    else if (name === "refuse-fire" || name === "refuse-boost") snd.play("refuse");
    else if (name === "win") { snd.play("win"); buzz([80, 60, 80, 60, 200]); }
    else if (name === "lose") { snd.play("lose"); buzz(400); }
  }
  // giữ màn sáng — iPad tắt màn giữa trận là mất điều khiển
  let lock = null;
  async function keepAwake() { if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return; try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* */ } }
  document.addEventListener("visibilitychange", keepAwake); keepAwake();
  return {
    setState({ s, rtt }) {
      conn = s; root.dataset.s = s;
      linkS.textContent = s === "on" ? "" : s === "relay" ? "Slow link" : s === "nogame" ? "No game" : s === "kicked" || s === "taken" ? "Team already has an iPad" : "Connecting…";
      if (s !== "on") { info = null; root.dataset.alarm = "0"; alarmT = -1; }
      paintCover();
    },
    setInfo, event,
    get scene() { return scene; },
    destroy() { clearInterval(beepI); cancelAnimationFrame(flyRaf); if (scene) scene.destroy(); document.removeEventListener("visibilitychange", keepAwake); try { lock && lock.release(); } catch (e) { /* */ } },
  };
}

// Màn chọn đội. current = đội iPad này đã chọn trước đó (viền sáng) · setBusy([0|1, 0|1]) = đội nào ĐANG có iPad khác nối (ghi nhỏ dưới nút —
// Đợt 514: đội đó KHÔNG chọn được nữa (mờ + báo), trừ đội iPad này đang giữ).
export function mountPadChooser(mount, { onPick, current = null }) {
  css();
  mount.innerHTML = `<div class="mpc"><h2>ROCKET RACE · CHOOSE YOUR TEAM</h2><div>${TEAM_META.map((m, t) =>
    `<button type="button" data-t="${t}" class="${t === current ? "cur" : ""}" style="--tc:${m.color}">${m.name}<small></small></button>`).join("")}</div>
    <p class="mpc-x">This iPad remembers its team. Change it any time with ‹ on the missile console.</p></div>`;
  const btns = [...mount.querySelectorAll("button")];
  // ⭐ Đợt 514 (thầy 14/10): đội ĐÃ có iPad ⇒ không cho chọn — chạm vào chỉ báo, không giành
  let busyNow = [0, 0], noteT = 0;
  const note = mount.querySelector(".mpc-x"), noteText = note.textContent;
  btns.forEach(b => b.addEventListener("click", () => {
    const t = +b.dataset.t;
    if (busyNow[t] && t !== current) {
      note.textContent = TEAM_META[t].name + " already has an iPad connected. Choose the other team."; note.style.color = "#fcd34d";
      clearTimeout(noteT); noteT = setTimeout(() => { note.textContent = noteText; note.style.color = ""; }, 3500);
      return;
    }
    onPick(t);
  }));
  return { setBusy(busy) { busyNow = [busy && busy[0] ? 1 : 0, busy && busy[1] ? 1 : 0];
    btns.forEach((b, t) => { b.querySelector("small").textContent = busyNow[t] ? "iPad already connected" : ""; b.style.opacity = busyNow[t] && t !== current ? ".45" : ""; }); } };
}
// Màn chờ chung (AWord: màn "iPad ready" của pad.html) — html do trang gọi truyền vào
export function mountPadHub(mount, { title, html, onTeam }) {
  css();
  mount.innerHTML = `<div class="mph"><b>${title}</b><p>${html}</p><p><a data-k="team">Choose team</a></p></div>`;
  mount.querySelector('[data-k="team"]').addEventListener("click", e => { e.preventDefault(); onTeam && onTeam(); });
}
