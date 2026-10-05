// TRAIN RUSH — TRẬN FIGHT mẫu 1an (05/10/2026): y hệt fight-1am, chỉ dùng lõi bp3d-1an.
// ---- ghi chú 1am: TRAIN RUSH — TRẬN FIGHT mẫu 1am (05/10/2026): y hệt fight-1al, chỉ dùng lõi bp3d-1am (tự giữ 60 khung, dịch sẵn shader — xem đầu bp3d-1am.js).
// ---- ghi chú 1al: TRAIN RUSH — TRẬN FIGHT mẫu 1al (03/10/2026): y hệt fight-1ak, chỉ dùng lõi bp3d-1al.
// ---- ghi chú 1ak: TRAIN RUSH — TRẬN FIGHT mẫu 1ak (03/10/2026): y hệt fight-1aj, chỉ dùng lõi bp3d-1ak.
// ---- ghi chú 1aj: TRAIN RUSH — TRẬN FIGHT dạng MÔ-ĐUN (mẫu 1aj, 03/10/2026). Tách nguyên phần Fight của trang mau-1ai-train-rush.html (1ah: hai bàn trái–phải,
// intro điện ảnh, đếm 3-2-1, đồng hồ chung, nhạc chung) thành createTrainRushFight() gắn vào Ô BẤT KỲ và DỠ ĐƯỢC (destroy) — để AWord
// (Balloon pop ▸ Mode ▸ Fight, Đợt 449) mở / đóng trận mà không nạp lại trang. Luật chơi, hình, tiếng: y hệt 1ah/1ai.
//   createTrainRushFight({ mount, words:[{keyword, definition}], wordsTitle, time (giây), onSingle, onHome }) ⇒ { destroy(), G, boards }
//   onSingle / onHome có ⇒ bảng PAUSED có thêm nút Single mode / Library; nút Mode ở hàng nút gọi onSingle.
import { createBalloonPop } from "./bp3d-1an.js";
import { createBpSound } from "./sound-1ah.js";   // 1ah: bộ máy âm thanh CHUNG của trận (nhạc, gió, đếm ngược, thắng)

const MARKUP = `
  <div class="fb-hud">
    <div class="fb-team t0"><span>TEAM 1</span><b class="fb-s0">0</b></div>
    <div class="fb-clock">2:00</div>
    <div class="fb-team t1"><span>TEAM 2</span><b class="fb-s1">0</b></div>
  </div>
  <div class="fb-area">
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
  </div>
  <div class="fb-bar">
    <button class="fb-tool fb-menu" title="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <button class="fb-tool fb-sound" title="Sound"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg></button>
    <button class="fb-tool fb-mode" title="Mode — back to Single"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.1" y="6" width="7.5" height="12" rx="1.6"/><rect x="14.4" y="6" width="7.5" height="12" rx="1.6"/><path d="M12 6.5v11"/></svg></button>
    <div class="fb-kieu"><small>TRAIN RUSH · Fight</small></div>
  </div>`;
const KIEU = 1;   // 1ad: thầy chọn kiểu 1 (hai bàn trái–phải)
// 1ad: tàu 2 đội khác màu — đầu máy + toa than theo màn (3 sắc độ của màu đội), ván toa hàng + viền bảng định nghĩa màu đội
const COLORS = [
  { engine: [0x8f1d14, 0xa3281a, 0x7a1810], box: ["#9c3424", "#7c2618"], frame: "#b0281a" },
  { engine: [0x1d3f7a, 0x1f4f8f, 0x183466], box: ["#35608f", "#264a73"], frame: "#1f5fb8" },
];
const keyOf = w => String(w.keyword).trim().toUpperCase().replace(/\s+/g, " ");
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export async function createTrainRushFight({ mount, words, wordsTitle = "", time = 120, onSingle = null, onHome = null }) {
  const TIME = Math.max(20, Math.min(900, +time || 120));
  mount.classList.add("fb-root");
  mount.innerHTML = MARKUP;
  const $ = s => mount.querySelector(s), $$ = s => mount.querySelectorAll(s);
  const area = $(".fb-area");
  area.classList.add("k" + KIEU);
  $(".fb-desc").textContent = "Each team has its own train and its own sky. Most points when time runs out wins.";
  if (onSingle || onHome) {
    $(".fb-hostrow").hidden = false;
    $(".fb-single").hidden = !onSingle; $(".fb-home").hidden = !onHome;
  }
  if (!onSingle) $(".fb-mode").hidden = true;

  // 1ad: thứ tự từ riêng mỗi đội; vị trí k (toa thứ k tính từ đầu ván) của 2 đội không bao giờ trùng từ
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
  const seed = (Date.now() % 100000) + 1;   // 2 bàn cùng hạt giống ⇒ cùng thứ tự từ, cùng toa khách/toa than
  const G = { boards: [], scores: [0, 0], ended: false, running: false, paused: false, timeLeft: TIME, muted: false, lastTick: 99, finalMus: false, intro: false };
  const snd = createBpSound();
  let dead = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
  const hud = team => d => { G.scores[team] = d.score; };
  const endFrom = team => why => { if (why === "done" && G.running) finish(`TEAM ${team + 1} FINISHED ALL WORDS!`); };

  function mkBoard(team) {
    const el = document.createElement("div");
    el.className = "fb-board t" + team;
    area.prepend(el);
    return el;
  }
  async function build() {
    const common = { view: "side", words, wordsTitle, embed: true, seed, options: { timerMode: "none" } };
    // thêm bàn đội 2 trước (prepend) để đội 1 nằm trái
    const el1 = mkBoard(1), el0 = mkBoard(0);
    const h0 = await createBalloonPop({ ...common, mount: el0, mirror: true, trainColors: COLORS[0], onEvent: (k, d) => k === "hud" ? hud(0)(d) : k === "end" && endFrom(0)(d) });
    if (dead) { h0.destroy(); return; }
    const h1 = await createBalloonPop({ ...common, mount: el1, trainColors: COLORS[1], onEvent: (k, d) => k === "hud" ? hud(1)(d) : k === "end" && endFrom(1)(d) });
    if (dead) { h0.destroy(); h1.destroy(); return; }
    G.boards = [h0, h1];
    G.boards.forEach(b => b.fit());
    // nhãn đội gắn SAU khi dựng bàn (lõi ghi đè nội dung ô chứa)
    for (const [el, t] of [[el0, 0], [el1, 1]]) { const tag = document.createElement("div"); tag.className = "fb-tag"; tag.textContent = "TEAM " + (t + 1); el.append(tag); }
    $(".fb-ov-load").hidden = true;
    $(".fb-ov-start").hidden = false;
    snd.amb(true); snd.music("menu");   // 1ah: màn START — gió sa mạc + nhạc chờ (phát sau lần chạm đầu)
    window.__fight = api;
  }

  // 1ae: START / Start again ⇒ intro điện ảnh (bàn phải phủ cả màn) ⇒ sập tối ⇒ tách 2 bàn ⇒ đếm 3-2-1
  function start() {
    if (G.boards.length < 2) return;
    ["start", "end", "pause"].forEach(k => $(".fb-ov-" + k).hidden = true);
    G.ended = false; G.running = false; G.paused = false; G.timeLeft = TIME; G.scores = [0, 0]; G.lastTick = 99; G.finalMus = false;
    G.intro = true;
    snd.unlock(); snd.hold(false); snd.music("intro", 0.6);
    area.classList.add("is-cine");
    G.boards[1].fit();
    G.boards[1].fightIntro({ colors: COLORS, onDone: () => {
      if (dead) return;
      const blk = $(".fb-black");
      blk.classList.add("is-on");                 // intro đã sập tối ⇒ giữ màn đen trong lúc tách bàn
      area.classList.remove("is-cine");
      G.boards.forEach(b => b.fit());
      G.intro = false;
      later(() => { blk.classList.remove("is-on"); countdown(); }, 80);
    } });
  }
  function countdown() {
    const ov = $(".fb-ov-count"), num = $(".fb-count");
    ov.hidden = false;
    let n = 3; num.textContent = n; snd.count(3);
    const tick = () => {
      n--;
      if (n > 0) { num.textContent = n; snd.count(n); later(tick, 700); return; }
      num.textContent = "GO!"; snd.count(0); snd.music("play", 1.2);
      const orders = makeOrders();
      G.orders = orders;
      G.boards.forEach((b, i) => { b.setOrder(orders[i]); b.start(); });
      G.running = true; last = 0;
      later(() => { ov.hidden = true; }, 550);
    };
    later(tick, 700);
  }
  function finish(why) {
    if (G.ended) return;
    G.ended = true; G.running = false;
    G.boards.forEach(b => b.end("time"));
    if (why === "GAME OVER") { snd.brake(); snd.music(null, 1.2); }
    else { snd.timesUp(); later(() => snd.win(), 900); }   // 1ah: phanh xì hơi ⇒ kèn thắng + reo hò
    const [a, b] = G.scores;
    $(".fb-end-t").textContent = a === b ? "DRAW!" : `TEAM ${a > b ? 1 : 2} WINS!`;
    $(".fb-end-why").textContent = why;
    $(".fb-r0").textContent = a; $(".fb-r1").textContent = b;
    $(".fb-res-t.t0").classList.toggle("is-win", a > b); $(".fb-res-t.t1").classList.toggle("is-win", b > a);
    later(() => { $(".fb-ov-end").hidden = false; }, 900);
  }
  function setPaused(p) {
    G.paused = p; G.boards.forEach(b => b.setPaused(p)); snd.hold(p); $(".fb-ov-pause").hidden = !p; last = 0;
  }

  // đồng hồ chung + dải điểm
  let last = 0, raf = 0;
  function loop(ts) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
    if (G.running && !G.paused) {
      G.timeLeft -= dt;
      if (G.timeLeft <= 0) { G.timeLeft = 0; finish("TIME'S UP"); }
    }
    const t = Math.max(0, Math.ceil(G.timeLeft));
    if (G.running && !G.paused) {   // 1ah: 30 s cuối nhạc dồn dập · 10 s cuối đồng hồ bỏ túi tích tắc
      if (t <= 30 && !G.finalMus && TIME > 40) { G.finalMus = true; snd.music("final", 2); }
      if (t <= 10 && t > 0 && t < G.lastTick) { G.lastTick = t; snd.tick(); }
    }
    const clk = $(".fb-clock");
    clk.textContent = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    clk.classList.toggle("is-warn", G.running && t <= 10);
    $(".fb-s0").textContent = G.scores[0]; $(".fb-s1").textContent = G.scores[1];
    $(".fb-team.t0").classList.toggle("is-lead", G.scores[0] > G.scores[1]);
    $(".fb-team.t1").classList.toggle("is-lead", G.scores[1] > G.scores[0]);
  }
  raf = requestAnimationFrame(loop);

  $(".fb-go").addEventListener("click", start);
  $$(".fb-again").forEach(b => b.addEventListener("click", () => { setPaused(false); start(); }));
  $(".fb-resume").addEventListener("click", () => setPaused(false));
  $(".fb-stop").addEventListener("click", () => { setPaused(false); finish("GAME OVER"); });
  $(".fb-menu").addEventListener("click", () => {
    if (G.intro) return G.boards[1].skipIntro();
    if (G.running) return setPaused(!G.paused);
    // 1aj: chưa chơi / đã kết thúc ⇒ bảng PAUSED làm Menu (Single mode · Library) — không thì kẹt, không ra được
    if (onSingle || onHome) $(".fb-ov-pause").hidden = !$(".fb-ov-pause").hidden;
  });
  $(".fb-sound").addEventListener("click", () => {
    G.muted = !G.muted; $(".fb-sound").classList.toggle("is-off", G.muted);
    mount.querySelectorAll(".fb-board .bp-sound").forEach(b => b.click());
  });
  $(".fb-mode").addEventListener("click", () => { if (onSingle) onSingle(); });
  $(".fb-single").addEventListener("click", () => { if (onSingle) onSingle(); });
  $(".fb-home").addEventListener("click", () => { if (onHome) onHome(); });

  const api = {
    G, get boards() { return G.boards; }, start, finish, countdown, snd,
    // 1aj: dỡ hẳn trận — 2 bàn destroy(), đồng hồ / hẹn giờ dừng, nhạc + gió tắt. Gọi lại vô hại.
    destroy() {
      if (dead) return; dead = true;
      cancelAnimationFrame(raf);
      timers.forEach(t => clearTimeout(t)); timers.clear();
      G.boards.forEach(b => { try { b.destroy(); } catch (e) { /* bỏ qua */ } });
      try { snd.hold(false); snd.music(null, 0.3); snd.amb(false); } catch (e) { /* bỏ qua */ }
      mount.innerHTML = ""; mount.classList.remove("fb-root");
      if (window.__fight === api) delete window.__fight;
    },
    get dead() { return dead; },
  };
  build();
  return api;
}
