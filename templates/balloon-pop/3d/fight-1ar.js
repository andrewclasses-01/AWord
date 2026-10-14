// TRAIN RUSH — Fight 1 màn mẫu 1ar (14/10/2026): như 1aq, lõi bp3d-1ar (iPad hết giật: giờ game + vận tốc thùng).
// TRAIN RUSH — TRẬN FIGHT MỘT MÀN mẫu 1aq (14/10/2026): như 1ap, lõi bp3d-1aq (tàu to hơn, khinh khí cầu nhỏ hơn, 2 tàu nâng lên chừa tiền cảnh,
//   máy bay kéo băng bay thấp, thú đuổi nhau gần nhau 1/2).
// TRAIN RUSH — TRẬN FIGHT MỘT MÀN mẫu 1ap (14/10/2026). Thầy duyệt bản phác thiet-ke-fight-1-man.html (2 vòng) rồi "ok build":
//   • MỘT cảnh, 2 ray: TEAM 1 đỏ ray gần · TEAM 2 xanh ray xa (lõi bp3d-1ap.js, duo: true). Góc máy quay A.
//   • Ô điểm đỏ / xanh = THANH GIỜ của màn: đầy = Time round (Options), rút khi đội còn chơi, DỪNG khi đội đầy toa (tàu PHÓNG đi).
//     Cả 2 xong ⇒ phần còn lại rút về 0, điểm đếm lên (1 giây = 1 điểm) ⇒ máy bay kéo băng điểm ⇒ 2 tàu mới (màn k có k toa) cùng vào.
//   • Chờ đội kia thoải mái. Thanh của một đội rút hết khi chưa xong ⇒ tàu DỪNG, đội OUT; đội kia chơi nốt màn đó ⇒ KẾT THÚC TRẬN, chốt điểm.
//   • Time round ∞ ⇒ không thanh giờ, không thưởng giờ, đồng hồ giữa đếm lên · Off ⇒ ẩn đồng hồ. Levels Off = 1 màn đủ bộ từ; 1–20 màn.
//   • iPad như Rocket Race: mỗi đội 1 iPad thấy cảnh 2D của RIÊNG đội mình (pad-1ap / tr-padui-1ap.js), chạm quả = quả đó nổ trên màn lớn.
//     Nút iPad: Off · iPad + màn lớn (MẶC ĐỊNH — chạm màn lớn vẫn được, kể cả quả đội bạn) · Chỉ iPad (màn lớn chỉ để xem).
//   createTrainRushFight({ mount, words, wordsTitle, options, onSingle, onHome, host, padSignal })
//     options = Options của game (khoá DEFAULTS bp3d-1ap: levelCount, roundMin, balloonSpeed, trainSpeed, pointsOff, bonus*)
//     host = cầu AWord { listActs, openAct, options(ov) } (như 1ao) · padSignal = kho bắt tay iPad { write, listen } (myGame: localSignal)
//   ⇒ api { destroy(), setOptions(o), start(), G, core, pad }
// Hàng nút, bảng Thư mục / Mode / PAUSED / kết quả: như fight-1ao (CSS fight-1al + fight-1ao + fight-1ap).
import { createBalloonPop, DUO_COLORS } from "./bp3d-1ar.js";
import { createBpSound } from "./sound-1ah.js";
import { createPadHost } from "./tr-padlink-1ap.js";

const ICON = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/><path class="x" d="m16 9 6 6m0-6-6 6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  options: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>',
  ipad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.3h2"/></svg>',
  mode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.8"/></svg>',
  fight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.1" y="6" width="7.5" height="12" rx="1.6"/><rect x="14.4" y="6" width="7.5" height="12" rx="1.6"/><path d="M12 6.5v11"/></svg>',
};
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MARKUP = `
  <div class="fb-hud">
    <div class="fb-team t0"><i class="fb-fill"></i><span>TEAM 1</span><em class="fb-st0"></em><b class="fb-s0">0</b></div>
    <div class="fb-clock">2:00</div>
    <div class="fb-team t1"><i class="fb-fill"></i><span>TEAM 2</span><em class="fb-st1"></em><b class="fb-s1">0</b></div>
  </div>
  <div class="fb-area k1m">
    <div class="fb-board fb-duo"></div>
    <div class="fb-ov fb-ov-load"><div class="fb-loading">Loading…</div></div>
    <div class="fb-ov fb-ov-start" hidden><div class="fb-card">
      <div class="fb-title">TRAIN RUSH</div><div class="fb-sub">FIGHT</div>
      <p class="fb-desc"></p>
      <button class="fb-btn fb-go">START</button>
    </div></div>
    <div class="fb-black"></div>
    <div class="fb-ov fb-ov-count" hidden><div class="fb-count">3</div></div>
    <div class="fb-ov fb-ov-pause" hidden><div class="fb-card">
      <div class="fb-title" style="font-size:48px">PAUSED</div>
      <div style="margin-top:14px"><button class="fb-btn fb-resume">Resume</button></div>
      <button class="fb-btn sm fb-again">Start again</button><button class="fb-btn sm fb-stop">End game</button>
      <div class="fb-hostrow" hidden><button class="fb-btn sm fb-single">Single mode</button><button class="fb-btn sm fb-home">Library</button></div>
    </div></div>
    <div class="fb-ov fb-ov-end" hidden><div class="fb-card">
      <div class="fb-title fb-end-t" style="font-size:52px">TEAM 1 WINS!</div>
      <div class="fb-sub fb-end-why" style="font-size:22px">TIME'S UP</div>
      <div class="fb-res-row">
        <div class="fb-res-t t0"><span>TEAM 1</span><b class="fb-r0">0</b></div>
        <div class="fb-res-t t1"><span>TEAM 2</span><b class="fb-r1">0</b></div>
      </div>
      <button class="fb-btn fb-again">Start again</button>
    </div></div>
    <div class="fb-ov fb-ov-panel" hidden><div class="fb-card fb-pn">
      <button class="fb-pn-x" aria-label="Close">✕</button>
      <div class="fb-pn-t"></div><div class="fb-pn-b"></div>
    </div></div>
    <div class="fb-hint" hidden>Only iPad — the big screen is for watching</div>
  </div>
  <div class="fb-bar bp-outbar">
    <button class="bp-tool fb-menu" title="Menu" aria-label="Menu">${ICON.menu}</button>
    <button class="bp-tool bp-sound fb-sound" title="Sound" aria-label="Sound">${ICON.sound}</button>
    <i class="bp-tool-gap"></i>
    <button class="bp-tool fb-folder" title="Switch activity" aria-label="Switch activity">${ICON.folder}</button>
    <button class="bp-tool fb-options" title="Options" aria-label="Options">${ICON.options}</button>
    <button class="bp-tool fb-ipad" title="iPad" aria-label="iPad">${ICON.ipad}</button>
    <button class="bp-tool fb-mode" title="Mode" aria-label="Mode">${ICON.fight}</button>
  </div>`;
const COLORS = DUO_COLORS;
const keyOf = w => String(w.keyword).trim().toUpperCase().replace(/\s+/g, " ");
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PAD_HZ = 20;   // trạng thái xuống iPad mỗi giây

export async function createTrainRushFight({ mount, words, wordsTitle = "", options = {}, onSingle = null, onHome = null, host = null, padSignal = null, padMode = "both", onPad = null }) {
  // onPad({ mode, linked: [s0, s1] }) — AWord: báo khi đổi chế độ iPad / iPad nối-rời (claim ipad_now: iPad đi theo game, hold khi có iPad nối)
  let OPT = { levelCount: 5, roundMin: 2, ...options };   // 1ap: thầy chốt mặc định Levels 5 · Time round 2 phút
  mount.classList.add("fb-root", "fb-one");
  mount.innerHTML = MARKUP;
  const $ = s => mount.querySelector(s), $$ = s => mount.querySelectorAll(s);
  const area = $(".fb-area"), boardEl = $(".fb-duo");
  $(".fb-desc").textContent = "Two trains, one screen. TEAM 1 on the near track, TEAM 2 on the far track. Fill your cars before your time bar runs out!";
  if (onSingle || onHome) { $(".fb-hostrow").hidden = false; $(".fb-single").hidden = !onSingle; $(".fb-home").hidden = !onHome; }
  if (!onSingle) $(".fb-mode").hidden = true;
  if (host && !host.listActs) $(".fb-folder").hidden = true;
  if (host && !host.options) $(".fb-options").hidden = true;

  // thứ tự từ riêng mỗi đội; vị trí k của 2 đội không bao giờ trùng từ (như 1ad)
  function makeOrders() {
    const seen = new Set(), uniq = words.filter(w => { const k = keyOf(w); if (seen.has(k)) return false; seen.add(k); return true; });
    const A = shuf(uniq.slice()), B = shuf(uniq.slice()), n = A.length;
    for (let i = 0; i < n; i++) {
      if (keyOf(A[i]) !== keyOf(B[i])) continue;
      const cand = [...Array(n).keys()].filter(j => j !== i && keyOf(B[j]) !== keyOf(A[i]) && keyOf(B[i]) !== keyOf(A[j]));
      if (cand.length) { const j = cand[Math.floor(Math.random() * cand.length)]; [B[i], B[j]] = [B[j], B[i]]; }
    }
    return [A, B];
  }
  const timed = () => OPT.roundMin >= 1 && OPT.roundMin <= 10;
  const lvSecs = () => (timed() ? OPT.roundMin * 60 : 0);
  // G.t[i]: left = giây còn trên thanh giờ màn · shown = phần thanh đang vẽ · done = đầy toa · gone = tàu đã ra khỏi màn · out = hết giờ
  const G = { phase: "load", level: 0, lvTime: 0, lvClock: 0, elapsed: 0, countT: 0, paused: false, muted: false, lastTick: 99, finalMus: false, why: "",
    t: [0, 1].map(() => ({ left: 0, shown: 0, done: false, gone: false, out: false, bonus: 0, base: 0, add: 0 })), scores: [0, 0] };
  const total = i => G.scores[i] + G.t[i].bonusSum;
  G.t.forEach(t => { t.bonusSum = 0; });
  const snd = createBpSound();
  let dead = false, core = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

  // ------------------------------------------------------------ iPad
  let pad = null, padSent = [0, 0].map(() => ({ lv: -1, at: 0, st: "" })), padTick = 0;
  if (padSignal) {
    pad = createPadHost({ signal: padSignal });
    pad.attach({
      press: (t, k) => { if (k.startsWith("pop:") && core && G.phase === "play" && !G.paused) core.popById(t, +k.slice(4)); },
      status: (t, s) => { padSent[t].lv = -1; paintPadPanel(); notifyPad(); },   // iPad mới nối ⇒ gửi lại bố cục
    });
  }
  function padSend() {
    if (!pad || !core || padMode === "off") return;
    for (const t of [0, 1]) {
      if (pad.status(t) !== "on") continue;
      const L = core.padLayout(t), S0 = core.padState(t);
      if (!L || !S0) continue;
      if (padSent[t].lv !== L.v) { if (pad.raw(t, "l:" + JSON.stringify(L))) padSent[t].lv = L.v; }
      pad.state(t, { ...S0, tl: Math.ceil(G.t[t].shown), tt: G.lvTime, out: G.t[t].out ? 1 : 0, sc: total(t), ph: G.phase, lvn: G.level + 1, mode: padMode,
        os: total(1 - t), lvc: OPT.levelCount || 0, cd: G.phase === "count" ? G.cd || 0 : 0, bn: G.phase === "countup" ? Math.ceil(G.t[t].bonus || 0) : 0 });   // 1aq: iPad kiểu A — điểm đội bạn, LEVEL k/n, số đếm, thưởng giờ
    }
  }
  const padEvent = (t, e) => { if (pad && padMode !== "off") pad.event(t, e); };
  function notifyPad() { if (onPad) { try { onPad({ mode: padMode, linked: [0, 1].map(t => (pad ? pad.status(t) : "")) }); } catch (e) { /* */ } } }

  // ------------------------------------------------------------ dựng
  async function build() {
    core = await createBalloonPop({ mount: boardEl, view: "side", words, wordsTitle, duo: true, options: { ...OPT }, onEvent: onCore });
    if (dead) { core.destroy(); return; }
    core.fit();
    $(".fb-ov-load").hidden = true;
    $(".fb-ov-start").hidden = false;
    G.phase = "start";
    snd.amb(true); snd.music("menu");
    window.__fight = api;
  }
  function onCore(k, d) {
    if (k === "team" && d) {
      const T = G.t[d.team]; if (!T) return;
      if (d.state === "clear") { T.done = true; padEvent(d.team, "done"); }
      if (d.state === "gone") T.gone = true;
    } else if (k === "hud" && d && d.scores) { G.scores = d.scores.slice(); }
    else if (k === "hit" && d) padEvent(d.team, d.ok ? "ok" : "wrong");
    else if (k === "touchBlocked") { const h = $(".fb-hint"); h.hidden = false; later(() => { h.hidden = true; }, 1500); }
  }

  // ------------------------------------------------------------ nhịp trận
  function resetMatch() {
    ["start", "end", "pause", "count"].forEach(k => $(".fb-ov-" + k).hidden = true);
    G.level = 0; G.elapsed = 0; G.why = ""; G.paused = false; G.finalMus = false;
    G.t.forEach(t => Object.assign(t, { left: 0, shown: 0, done: false, gone: false, out: false, bonus: 0, base: 0, bonusSum: 0 }));
    G.scores = [0, 0];
  }
  // START / Start again ⇒ intro điện ảnh (tàu xanh trên ray xa thật) ⇒ sập tối ⇒ đếm 3-2-1
  function start(withIntro = true) {
    if (!core) return;
    resetMatch();
    snd.unlock(); snd.hold(false);
    if (!withIntro) { core.duoReady(); countdown(); return; }
    G.phase = "intro";
    snd.music("intro", 0.6);
    core.fightIntro({ colors: COLORS, onDone: () => {
      if (dead) return;
      const blk = $(".fb-black"); blk.classList.add("is-on");
      core.duoReady();
      later(() => { blk.classList.remove("is-on"); countdown(); }, 80);
    } });
  }
  function countdown() {
    G.phase = "count";
    const ov = $(".fb-ov-count"), num = $(".fb-count");
    ov.hidden = false;
    let n = 3; G.cd = 3; num.textContent = n; snd.count(3);   // 1aq: G.cd gửi iPad
    const tick = () => {
      n--; G.cd = n;
      if (n > 0) { num.textContent = n; snd.count(n); later(tick, 700); return; }
      num.textContent = "GO!"; snd.count(0); snd.music("play", 1.2);
      core.applyOpt(OPT);
      if (!core.duoStart(makeOrders())) { finish("NO WORDS"); return; }
      beginLevelBars(0);
      later(() => { ov.hidden = true; }, 550);
    };
    later(tick, 700);
  }
  function beginLevelBars(i) {
    G.level = i; G.lvTime = lvSecs(); G.lvClock = 0; G.lastTick = 99; G.phase = "play";
    if (G.finalMus) { G.finalMus = false; snd.music("play", 2); }
    G.t.forEach(t => Object.assign(t, { left: G.lvTime, shown: G.lvTime, done: false, gone: false, out: false, bonus: 0 }));
  }
  // cả 2 xong (hoặc OUT) ⇒ phần còn lại rút về 0, điểm đếm lên
  function levelDone() {
    G.phase = "countup"; G.countT = 0;
    G.t.forEach(t => { t.bonus = t.out ? 0 : Math.floor(t.left); t.base = t.bonusSum; });
    if (G.t.some(t => t.bonus > 0)) snd.bonus && snd.bonus();
  }
  function afterCount() {
    const outs = G.t.map((t, i) => (t.out ? i : -1)).filter(i => i >= 0);
    if (outs.length) return finish(outs.length === 2 ? "BOTH TEAMS RAN OUT OF TIME" : `TEAM ${outs[0] + 1} RAN OUT OF TIME`);
    G.phase = "between";
    core.duoBanner(`L${G.level + 1}  ${total(0)} : ${total(1)}`);
    later(() => {
      if (G.phase !== "between") return;
      const next = G.level + 1;
      if (OPT.levelCount > 0 && next >= OPT.levelCount) return finish("ALL LEVELS DONE");
      if (!core.duoLevel(next)) return finish("ALL WORDS DONE");
      beginLevelBars(next);
    }, 3400);
  }
  function finish(why) {
    if (G.phase === "over") return;
    G.phase = "over"; G.why = why;
    core.duoEnd();
    const a = total(0), b = total(1);
    if (/TIME|GAME OVER/.test(why)) { snd.timesUp(); later(() => snd.win(), 900); } else snd.win();
    [0, 1].forEach(t => padEvent(t, a === b ? "draw" : (t === 0) === (a > b) ? "win" : "lose"));
    $(".fb-end-t").textContent = a === b ? "DRAW!" : `TEAM ${a > b ? 1 : 2} WINS!`;
    $(".fb-end-why").textContent = why;
    $(".fb-r0").textContent = a; $(".fb-r1").textContent = b;
    $(".fb-res-t.t0").classList.toggle("is-win", a > b); $(".fb-res-t.t1").classList.toggle("is-win", b > a);
    later(() => { $(".fb-ov-end").hidden = false; }, 900);
  }
  function setPaused(p) {
    if (!core) return;
    G.paused = p; core.setPaused(p); snd.hold(p); $(".fb-ov-pause").hidden = !p; last = 0;
  }

  // ------------------------------------------------------------ đồng hồ + thanh giờ + dải điểm
  let last = 0, raf = 0;
  function loop(ts) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
    if (!G.paused) tick(dt);
    paintHud();
    if (pad && ts - padTick > 1000 / PAD_HZ) { padTick = ts; padSend(); }
  }
  function tick(dt) {
    if (G.phase === "play") {
      G.elapsed += dt;
      const states = core ? core.rigs.map(R => R.state) : [];
      if (G.t.some((t, i) => !t.done && !t.out && states[i] === "play")) G.lvClock += dt;   // đồng hồ giữa = giờ màn, dừng khi cả 2 đã xong
      if (timed()) G.t.forEach((t, i) => {
        if (t.done || t.out || states[i] !== "play") return;   // thanh chỉ rút khi đội ĐANG CHƠI (tàu đã vào khung — không tính lúc tàu chạy vào)
        t.left = Math.max(0, t.left - dt); t.shown = t.left;
        if (t.left <= 0) { t.out = true; core.duoOut(i); padEvent(i, "out"); }
      });
      if (timed()) {   // 30 s cuối nhạc dồn dập · 10 s cuối tích tắc (theo đội còn chơi lâu nhất)
        const playing = G.t.filter(t => !t.done && !t.out);
        const s = playing.length ? Math.ceil(Math.max(...playing.map(t => t.left))) : 99;
        if (s <= 30 && !G.finalMus && G.lvTime > 40) { G.finalMus = true; snd.music("final", 2); }
        if (s <= 10 && s > 0 && s < G.lastTick) { G.lastTick = s; snd.tick(); }
      }
      if (G.t.every(t => t.gone || t.out)) levelDone();
    } else if (G.phase === "countup") {
      G.countT += dt;
      const dur = G.t.some(t => t.bonus > 0) ? 1.8 : 0.3, p = Math.min(1, G.countT / dur), e = 1 - Math.pow(1 - p, 2);
      G.t.forEach(t => { t.shown = t.left * (1 - e); t.bonusSum = t.base + Math.round(t.bonus * e); });
      if (p >= 1) { G.t.forEach(t => { t.left = 0; t.shown = 0; }); afterCount(); }
    }
  }
  function paintHud() {
    const clk = $(".fb-clock");
    clk.style.visibility = OPT.roundMin === 0 ? "hidden" : "";
    const t = timed() ? Math.max(0, Math.ceil((G.phase === "start" || G.phase === "intro" || G.phase === "count" ? lvSecs() : G.lvTime) - G.lvClock)) : Math.floor(G.elapsed);
    clk.textContent = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    const playingMin = G.t.filter(x => !x.done && !x.out).map(x => x.left);
    clk.classList.toggle("is-warn", G.phase === "play" && timed() && playingMin.length > 0 && Math.max(...playingMin) <= 10);
    [0, 1].forEach(i => {
      const T = G.t[i], box = $(".fb-team.t" + i);
      $(".fb-s" + i).textContent = total(i);
      const f = timed() && G.lvTime ? (G.phase === "play" || G.phase === "countup" || G.phase === "between" || G.phase === "over" ? T.shown / G.lvTime : 1) : 1;
      box.querySelector(".fb-fill").style.width = (Math.max(0, f) * 100).toFixed(2) + "%";
      box.classList.toggle("is-out", T.out);
      box.classList.toggle("is-count", G.phase === "countup" && T.bonus > 0);
      box.classList.toggle("is-lead", total(i) > total(1 - i));
      $(".fb-st" + i).textContent = T.out ? "OUT" : G.phase === "countup" && T.bonus > 0 ? "+" + T.bonus : G.phase === "play" && T.done ? "✓ DONE" : "";
    });
  }
  raf = requestAnimationFrame(loop);

  // ------------------------------------------------------------ nút
  $(".fb-go").addEventListener("click", () => start(true));
  $$(".fb-again").forEach(b => b.addEventListener("click", () => { if (G.paused) setPaused(false); start(true); }));
  $(".fb-resume").addEventListener("click", () => setPaused(false));
  $(".fb-stop").addEventListener("click", () => { setPaused(false); finish("GAME OVER"); });
  $(".fb-menu").addEventListener("click", () => {
    if (!ovPanel.hidden) closePanel();
    if (G.phase === "intro") return core.skipIntro();
    if (G.phase === "play" || G.phase === "countup" || G.phase === "between") return setPaused(!G.paused);
    if (onSingle || onHome) $(".fb-ov-pause").hidden = !$(".fb-ov-pause").hidden;   // chưa chơi / đã xong ⇒ PAUSED làm Menu
  });
  $(".fb-sound").addEventListener("click", () => {
    G.muted = !G.muted; $(".fb-sound").classList.toggle("is-off", G.muted);
    try { snd.setMuted(G.muted); } catch (e) { /* */ }
    try { core && core.sfx.setMuted(G.muted); } catch (e) { /* */ }
  });
  // bảng nổi Thư mục / Mode / iPad / Options (myGame) — mở giữa trận thì tạm dừng, đóng thì chạy tiếp
  const ovPanel = $(".fb-ov-panel"), pnT = $(".fb-pn-t"), pnB = $(".fb-pn-b");
  let panelPaused = false, hostPaused = false, folderTok = 0;
  function holdFor(on) {
    if (on) { if (!(G.phase === "play" || G.phase === "countup" || G.phase === "between") || G.paused) return false; G.paused = true; core.setPaused(true); snd.hold(true); last = 0; return true; }
    G.paused = false; core.setPaused(false); snd.hold(false); last = 0; return false;
  }
  function openPanel(kind) {
    if (!ovPanel.hidden) closePanel();
    if (!$(".fb-ov-pause").hidden) setPaused(false);
    panelPaused = kind === "ipad" ? false : holdFor(true);   // bảng iPad đổi tại chỗ, không dừng trận
    ovPanel.dataset.kind = kind; pnB.innerHTML = ""; pnB.onclick = null; pnB.oninput = null;
    if (kind === "folder" && host && host.listActs) {
      pnT.textContent = "Switch activity";
      pnB.innerHTML = `<p class="fb-pn-note">Loading…</p>`;
      const tok = ++folderTok;
      Promise.resolve().then(() => host.listActs()).then(d => {
        if (tok !== folderTok || ovPanel.hidden || ovPanel.dataset.kind !== "folder") return;
        const groups = (d && d.groups) || [];
        if (d && d.folderName) pnT.textContent = d.folderName;
        pnB.innerHTML = groups.length ? `<div class="fb-pn-list">${groups.map(g => (g.path ? `<p class="fb-pn-grp">${esc(g.path)}</p>` : "") + g.acts.map(a =>
          `<button class="fb-pn-row${a.current ? " is-on" : ""}" data-id="${esc(String(a.id))}"${a.current ? " disabled" : ""}>${ICON.folder}<span>${esc(a.title || "Untitled")}</span></button>`).join("")).join("")}</div>`
          : `<p class="fb-pn-note">No other activities in this folder.</p>`;
        pnB.querySelectorAll(".fb-pn-row[data-id]").forEach(b => b.addEventListener("click", () => host.openAct(b.dataset.id)));
      }).catch(() => { if (tok === folderTok) pnB.innerHTML = `<p class="fb-pn-note">Could not load the folder.</p>`; });
    } else if (kind === "folder") {
      pnT.textContent = "Switch activity";
      pnB.innerHTML = `<div class="fb-pn-list">${["LSA2 S4 T4 — Words", "LSA2 S4 T3 — Words", "LSA2 S4 T2 — Words"].map((t, i) =>
        `<button class="fb-pn-row${i === 0 ? " is-on" : ""}">${ICON.folder}<span>${t}</span></button>`).join("")}</div><p class="fb-pn-note">Sample list — in AWord this shows the activities in the same folder.</p>`;
    } else if (kind === "options") {   // chạy riêng ở myGame: bảng mẫu LEVELS + TIME ROUND (+ tốc độ, Points off)
      pnT.textContent = "Options";
      const d = { ...OPT };
      const row = (k, label, sub, min, max) => `<div class="fb-sl"><label>${label}<small>${sub}</small></label><input type="range" min="${min}" max="${max}" step="1" data-k="${k}"><b data-v="${k}"></b></div>`;
      pnB.innerHTML = row("levelCount", "LEVELS", "Off = all words, one train", 0, 20) + row("roundMin", "TIME ROUND", "minutes per level · ∞ = count up", 0, 11)
        + row("balloonSpeed", "BALLOON SPEED", "", 1, 10) + row("trainSpeed", "TRAIN SPEED", "", 1, 10) + row("pointsOff", "POINTS OFF", "wrong answer", 0, 10)
        + `<div class="fb-pn-act"><button class="fb-btn sm fb-o-apply">Apply</button></div><p class="fb-pn-note">Apply restarts the match. In AWord this is the AWord Options panel.</p>`;
      const txt = (k, v) => (v === 0 && k !== "balloonSpeed" && k !== "trainSpeed" ? "Off" : k === "roundMin" ? (v >= 11 ? "∞" : v + "'") : String(v));
      const paint = () => pnB.querySelectorAll("[data-k]").forEach(inp => { inp.value = d[inp.dataset.k]; pnB.querySelector(`[data-v="${inp.dataset.k}"]`).textContent = txt(inp.dataset.k, d[inp.dataset.k]); });
      pnB.oninput = e => { const k = e.target.dataset && e.target.dataset.k; if (k) { d[k] = +e.target.value; paint(); } };
      pnB.querySelector(".fb-o-apply").addEventListener("click", () => { closePanel(); api.setOptions(d); });
      paint();
    } else if (kind === "ipad") { paintPadPanel(true); }
    else if (kind === "mode") {
      pnT.textContent = "Mode";
      pnB.innerHTML = `<div class="fb-pn-modes"><button class="fb-pn-mode fb-pn-single">${ICON.mode}<span>Single</span></button><button class="fb-pn-mode is-on">${ICON.fight}<span>Fight</span><small>2 teams</small></button></div>`;
      pnB.querySelector(".fb-pn-single").addEventListener("click", () => { closePanel(); if (onSingle) onSingle(); });
      pnB.querySelector(".fb-pn-mode.is-on").addEventListener("click", () => closePanel());
    }
    ovPanel.hidden = false;
  }
  // bảng iPad: 3 chế độ (đổi tại chỗ) + đèn nối từng đội
  function paintPadPanel(build = false) {
    if (ovPanel.hidden && !build) return;
    if (ovPanel.dataset.kind !== "ipad" && !build) return;
    pnT.textContent = "iPad";
    const st = t => (pad ? pad.status(t) : "");
    const lamp = s => (s === "on" ? "iPad connected" : s === "relay" ? "iPad connected (slow link)" : s === "wait" ? "Connecting…" : "Waiting for an iPad");
    pnB.innerHTML = `<div class="fb-pad-modes">${[["off", "Off"], ["both", "iPad + big screen"], ["ipad", "Only iPad"]].map(([k, l]) => `<button class="fb-pad-m${padMode === k ? " is-on" : ""}" data-pm="${k}">${l}</button>`).join("")}</div>
      <div class="fb-pad-teams">${[0, 1].map(t => `<div class="fb-pad-t t${t}" data-s="${st(t)}"><b>TEAM ${t + 1}</b><span><i></i>${padMode === "off" ? "Off" : lamp(st(t))}</span></div>`).join("")}</div>
      <p class="fb-pn-note">${padMode === "off" ? "iPads are off — play on the big screen." : padMode === "ipad" ? "Only iPad: the big screen is for watching." : "Each team plays on its iPad — the big screen still works (any balloon)."}<br>On each iPad: AWord home ▸ <b>iPad</b> ▸ choose the team.</p>`;
    pnB.querySelectorAll("[data-pm]").forEach(b => b.addEventListener("click", () => { api.setPadMode(b.dataset.pm); paintPadPanel(true); }));
  }
  function closePanel() {
    ovPanel.hidden = true; ovPanel.dataset.kind = "";
    if (panelPaused) { panelPaused = false; holdFor(false); }
  }
  const togglePanel = k => (ovPanel.dataset.kind === k && !ovPanel.hidden ? closePanel() : openPanel(k));
  $(".fb-pn-x").addEventListener("click", closePanel);
  ovPanel.addEventListener("click", e => { if (e.target === ovPanel) closePanel(); });
  $(".fb-folder").addEventListener("click", () => togglePanel("folder"));
  $(".fb-mode").addEventListener("click", () => togglePanel("mode"));
  $(".fb-ipad").addEventListener("click", () => togglePanel("ipad"));
  $(".fb-options").addEventListener("click", () => {
    if (!(host && host.options)) return togglePanel("options");
    if (!ovPanel.hidden) closePanel();
    if (!$(".fb-ov-pause").hidden) setPaused(false);
    hostPaused = holdFor(true);
    const bar = $(".fb-bar");
    host.options({ layer: mount, top: () => bar.getBoundingClientRect().top - mount.getBoundingClientRect().top,
      onClose: () => { if (hostPaused) { hostPaused = false; if (!dead) holdFor(false); } } });
  });
  $(".fb-single").addEventListener("click", () => { if (onSingle) onSingle(); });
  $(".fb-home").addEventListener("click", () => { if (onHome) onHome(); });
  $(".fb-ipad").classList.toggle("is-on", padMode !== "off");

  const api = {
    G, get core() { return core; }, get pad() { return pad; }, start, finish, snd,
    get options() { return { ...OPT }; },
    // Options ▸ Apply (AWord liveOptions hoặc bảng mẫu): ghi Options; trận đang chạy / đã xong ⇒ chơi lại từ đếm 3-2-1 (bỏ intro)
    setOptions(o) {
      if (dead || !o) return false;
      OPT = { ...OPT, ...o };
      if (core) core.applyOpt(OPT);
      hostPaused = false; panelPaused = false; ovPanel.hidden = true;
      if (G.phase === "play" || G.phase === "countup" || G.phase === "between" || G.phase === "over" || G.phase === "count") { if (G.paused) setPaused(false); timers.forEach(t => clearTimeout(t)); timers.clear(); start(false); }
      return true;
    },
    // nút iPad: off · both (mặc định) · ipad — đổi tại chỗ, không chơi lại trận
    setPadMode(m) {
      if (!["off", "both", "ipad"].includes(m)) return;
      padMode = m; if (core) core.setTouch(m !== "ipad");
      $(".fb-ipad").classList.toggle("is-on", m !== "off");
      padSent.forEach(x => { x.lv = -1; });
      if (pad) for (const t of [0, 1]) pad.state(t, { mode: m, ph: G.phase });
      notifyPad();
    },
    get padMode() { return padMode; },
    // bàn thử (khung xem trước bị ẩn ⇒ rAF đứng): tua tay n khung — lõi + thanh giờ + gửi iPad
    step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) { if (core && !G.paused) core.step(1, dt); if (!G.paused) tick(dt); } paintHud(); padSend(); return G.phase; },
    destroy() {
      if (dead) return; dead = true;
      cancelAnimationFrame(raf);
      timers.forEach(t => clearTimeout(t)); timers.clear();
      try { pad && pad.detach(); } catch (e) { /* */ }
      try { core && core.destroy(); } catch (e) { /* */ }
      try { snd.hold(false); snd.music(null, 0.3); snd.amb(false); } catch (e) { /* */ }
      mount.innerHTML = ""; mount.classList.remove("fb-root", "fb-one");
      if (window.__fight === api) delete window.__fight;
    },
    get dead() { return dead; },
  };
  build();
  notifyPad();
  return api;
}
