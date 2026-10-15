// RACING WORDS — GÓI NHÚNG mẫu 3r (16/10/2026) = rw-3q.js + lõi sr3d-3r.js / intro sr3d-intro-3r.js (MƯỢT TRÊN TOMKO: thầy "tối ưu tuyệt đối độ mượt";
//   đo act 572 trong myActivity: xưởng 37 ⇒ 60 fps, phim intro 18 ⇒ ~55–60, đua hết dịch shader giữa trận). CSS rw-3r.css (bỏ filter đắt của HUD).
//   Intro chỉ bắt đầu tự chỉnh độ nét SAU khi trận dịch sẵn shader xong (intro.arGo) — lúc dịch ngầm khung chậm giả, đừng để bộ chỉnh học sai.
// ---- gốc 3q ----
// RACING WORDS — GÓI NHÚNG mẫu 3q (15/10/2026) = rw-3p.js + lõi sr3d-3q.js (cảnh xa đúng vật lý · 35 km/h · cầu nhảy chậm · FIGHT: Lives / Missile damages /
//   Time delay / Miss wait / Missile streak / Missiles max). options thêm: lives · msDmg · tieWait · missWait · streak (Infinity = chờ mãi).
// =============================================================
// RACING WORDS — GÓI NHÚNG mẫu 3p (15/10/2026) = rw-3o.js + (thầy: "double tap vào intro để vào màn chuẩn bị start luôn" · "khá lag, tham khảo Train Rush"):
//   · CHẠM ĐÚP lúc phim intro đang chiếu ⇒ bỏ phim, vào thẳng 5 đèn xuất phát (intro.skip = handoff)
//   · game.prewarm() ngay khi dựng xong (thầy còn ở xưởng): dịch sẵn shader cả trận; START / chạm đúp chờ nó xong (thường đã xong từ lâu)
//   · lõi sr3d-3p.js + xe sr3d-car-3p.js (gộp mảnh, bỏ kính transmission) — chi tiết ở đầu 2 file đó
// ---- gốc 3o ----
// RACING WORDS — GÓI NHÚNG mẫu 3o (15/10/2026) để AWord nạp (thầy: "đưa lên AWord, sử dụng options của AWord" ⇒ "ok build").
// Gom những gì trang thử page-3n.js làm (intro xưởng, trận đua, âm thanh, iPad, tải xe) thành MỘT hàm, KHÔNG có bàn thử, KHÔNG biến window.__*,
// mọi bộ đếm giờ / listener / AudioContext / khung WebGL đều dỡ ở destroy() (AWord dựng lại game khi Apply / đổi act).
//
// const rw = await createRacingWords({ mount, questions, title, options, host, remote, onEvent })
//   mount     : ô do AWord cấp (phủ trọn trang) — gói tự dựng lớp .rw-root (khung game tỉ lệ ≤ 2:1 + hàng nút 60 px bên dưới)
//   questions : [{ question, answers: [{ text, correct }] }]  (đúng kiểu content.questions của AWord)
//   options   : { steps, laps, ramps, sameQ, msMax, cars? }   (AWord đọc từ khoá phẳng sr* của act)
//   host      : cầu AWord { options(ov), listActs(), openAct(id), templates(), switchTemplate(t), home() }
//   remote    : createPadHost({ signal, padUrl }) — AWord truyền kênh bắt tay Firestore; không có ⇒ không có nút iPad
//   onEvent   : (k, v) — "pad" (iPad nối / mất nối), "padMode", "end", …
// ⇒ { setOptions(o) (true = áp ngay, false = AWord dựng lại), destroy(), game, intro }
// =============================================================
import { createSpeedRun } from "./sr3d-3r.js";
import { XE, prepXe } from "./sr3d-xe3d-3o.js";
import { createIntro } from "./sr3d-intro-3r.js";
import { createSound } from "./sr3d-sound-3o.js";

const CARS_KEY = "speedrun.cars";            // xe 2 đội nhớ THEO MÁY (thầy chọn ở màn chờ xưởng)
const DEF_CARS = ["Y2", "H4"];

export async function createRacingWords({ mount, questions, title = "RACING WORDS", options = {}, host = null, remote = null, onEvent = () => {} }) {
  // ---------- khung: game (tỉ lệ ≤ 2:1, giữa theo chiều dọc) + hàng nút 60 px ----------
  const root = document.createElement("div"); root.className = "rw-root";
  root.innerHTML = `<div class="rw-wrap"><div class="rw-frame"><div class="rw-load">LOADING CARS…</div></div><div class="rw-bar"></div></div>`;
  mount.appendChild(root);
  const frame = root.querySelector(".rw-frame"), bar = root.querySelector(".rw-bar");
  const timers = [], offs = [];
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); offs.push(() => el.removeEventListener(ev, fn, opt)); };
  let dead = false;

  // ---------- xe ----------
  let saved = null; try { saved = JSON.parse(localStorage.getItem(CARS_KEY) || "null"); } catch (e) { /* */ }
  const want = Array.isArray(options.cars) && options.cars.length === 2 ? options.cars : Array.isArray(saved) && saved.length === 2 ? saved : DEF_CARS;
  const cars = want.map((id, i) => XE.some(x => x.id === id) ? id : DEF_CARS[i]);
  await Promise.all(cars.map(prepXe));
  if (dead) return null;
  frame.innerHTML = "";

  // ---------- âm thanh ----------
  const S = createSound(); S.load();
  const PAN = [-0.55, 0.55];
  let introOn = true, idleAmb = false;

  // ---------- trận đua ----------
  const game = createSpeedRun({ mount: frame, bar, questions, title, options: { ...options, cars }, remote, host,
    onEvent: (k, v) => { if (k === "pause") S.pause(v === true); else onGameEvent(k, v || {}); try { onEvent(k, v); } catch (e) { /* */ } } });
  game.hold(true);

  // ---------- intro xưởng ANDREW STUDIO ----------
  const after = document.createElement("div"); after.className = "rw-after"; frame.appendChild(after);
  const intro = createIntro({ mount: frame, cars, title,
    onSetCar: (i, id) => { intro.arWait(); Promise.resolve(game.setCar(i, id)).then(() => game.prewarm()).catch(() => {}).then(() => { if (!dead) intro.arGo(); });   // 3r: đổi xe ⇒ trận dịch lại shader ⇒ intro chờ
      try { localStorage.setItem(CARS_KEY, JSON.stringify(intro ? intro.cars : cars)); } catch (e) { /* */ } },
    onCue: (n, t) => introCue(n, t),
    onHandoff: () => {
      introOn = false;
      // 3p: chờ dịch sẵn shader (tối đa 4 s) rồi mới vào trận ⇒ không đứng hình ở 5 đèn đỏ
      Promise.race([game.prewarm(), new Promise(r => setTimeout(r, 4000))]).then(() => { if (dead) return; game.hold(false); game.start(); });   // 3r: lần dịch HIỆN HÀNH (đổi xe ⇒ dịch lại)
      after.style.transition = "none"; after.style.opacity = "1";
      requestAnimationFrame(() => { if (dead) return; intro.hide(); after.style.transition = "opacity .6s ease-out"; after.style.opacity = "0"; });
    } });
  // 3p: dịch sẵn shader ngay lúc thầy còn ở xưởng (compileAsync không chặn khung) · đổi xe ⇒ lõi tự dịch lại
  const warm = game.prewarm().catch(e => console.warn("RW prewarm", e));
  warm.then(() => { if (!dead && intro.arGo) intro.arGo(); });   // 3r
  // 3p: CHẠM ĐÚP khi phim intro đang chiếu ⇒ vào thẳng màn xuất phát (2 lần chạm ≤ 350 ms, lệch ≤ 40 px)
  let tap0 = null;
  on(frame, "pointerdown", e => {
    if (!intro || intro.state !== "play" || e.target.closest("button")) { tap0 = null; return; }
    const now = performance.now();
    if (tap0 && now - tap0.t < 350 && Math.hypot(e.clientX - tap0.x, e.clientY - tap0.y) < 40) { tap0 = null; intro.skip(); return; }
    tap0 = { t: now, x: e.clientX, y: e.clientY };
  }, { capture: true });
  // nút thử / tự chơi gọi thẳng game.start() ⇒ intro tự ẩn
  every(() => { if (introOn && game.state().phase !== "menu") { introOn = false; intro.hide(); game.hold(false); } }, 200);

  function introCue(n, t) {
    if (n === "start") { S.play("mIntro"); S.loop("garage", true); }
    else if (n === "lights") S.play("lights", { rate: 0.94 + Math.random() * 0.12, gain: 0.8 + 0.05 * t, pan: (t - 2) * 0.2 });
    else if (n === "sign") S.play("lights", { rate: 0.8, gain: 0.7 });
    else if (n === "engine") { S.play("start", { pan: PAN[t] }); setTimeout(() => !dead && S.loop("rev" + t, true, { name: "rev", pan: PAN[t], fade: 0.8 }), 900); }
    else if (n === "pop") S.play("pop", { pan: PAN[t ?? 0], rate: 0.9 + Math.random() * 0.2, gain: intro.state !== "play" ? 0.45 : 1 });
    else if (n === "door") S.play("door");
    else if (n === "rollout") { [0, 1].forEach(i => S.loop("rev" + i, true, { name: "rev", rate: 1.35, gain: 1.3, pan: PAN[i] })); S.play("screech", { gain: 0.7 }); S.play("flyby", { delay: 1.3 }); }
    else if (n === "title") S.play("hit");
    else if (n === "handoff") { S.loop("rev0", false, { fade: 0.8 }); S.loop("rev1", false, { fade: 0.8 }); S.loop("garage", false, { fade: 1 }); }
  }
  on(window, "pointerdown", () => { if (!idleAmb && introOn) { idleAmb = true; S.loop("garage", true, { fade: 1.5 }); } }, { capture: true });
  on(root, "pointerdown", e => { if (e.target.closest("button")) S.play("click"); }, { capture: true });

  // trận: máy 2 xe (cao độ theo tốc độ, lệch trái/phải), gió, lửa, nhạc, 5 đèn, GO, boost, lốp rít, nạp tên lửa
  let lastPhase = "menu", lights = 0;
  every(() => {
    const st = game.state(), ph = st.phase, racing = ph === "count" || ph === "race" || ph === "end";
    if (ph !== lastPhase) {
      if (ph === "count") { S.loop("mRace", true, { fade: 2 }); lights = 0; }
      if (ph === "race") S.play("go");
      if (ph === "end") { S.loop("mRace", false, { fade: 1.2 }); S.play("win"); S.play("crowd", { delay: 0.3 }); setTimeout(() => !dead && S.play("mResult"), 1400); }
      if (ph === "menu") { S.stopAll(0.8); idleAmb = false; }
      lastPhase = ph;
    }
    if (ph === "count") { const n = Math.min(5, Math.floor((game.G.countT - 0.6) / 0.55) + 1); while (lights < n && lights < 5) { lights++; S.play("lightsBeep"); } }
    S.pause(!!game.G.paused);
    st.teams.forEach((t, i) => {
      const T = game.T[i], v = t.v, boostK = Math.max(T.boostK || 0, T.nitroK || 0);
      S.loop("engine" + i, racing, { name: "engine", rate: 0.85 + v / 45 + boostK * 0.1, gain: 0.55 + 0.35 * boostK, pan: PAN[i] });
      S.loop("wind" + i, racing && (v > 25 || t.air), { name: "wind", gain: Math.min(1, (v - 20) / 25) + (t.air ? 0.4 : 0), pan: PAN[i] });
      S.loop("fire" + i, racing && (T.burnT || 0) > 0, { name: "fire", pan: PAN[i] });
      if (T.nitroK > 0.6 && !T._sBoost) { T._sBoost = true; S.play("boost", { pan: PAN[i] }); } else if (T.nitroK < 0.2) T._sBoost = false;
      if (t.spin > 0 && !T._sSpin) { T._sSpin = true; S.play("screech", { pan: PAN[i] }); } else if (t.spin <= 0) T._sSpin = false;
      if (t.ms > (T._sMs ?? t.ms)) S.play("reload", { pan: PAN[i] }); T._sMs = t.ms;
    });
  }, 50);
  // nút loa của hàng nút: tắt / bật cả tiếng hiệu ứng + nhạc (nhớ theo máy)
  const tb = bar.querySelector('[data-k="sound"]');
  if (tb) { tb.classList.toggle("is-off", !S.fxOn); on(tb, "click", () => { const v = !tb.classList.contains("is-off"); S.setBus("fx", v); S.setBus("music", v); }); }

  function onGameEvent(k, v) {
    if (k === "correct") S.play("correct", { pan: PAN[v.team] });
    else if (k === "wrong") S.play("wrong", { pan: PAN[v.team] });
    else if (k === "fire") S.play("mLaunch", { pan: PAN[v.team] });
    else if (k === "impact") { if (v.kind === "hit") S.play("boom", { pan: PAN[v.to] }); else S.play("boom", { gain: 0.55, rate: 1.15, pan: PAN[v.to] }); }
    else if (k === "land") S.play("land", { pan: PAN[v.team], gain: v.kind === "bad" ? 1 : 0.8 });
    else if (k === "bump") S.play("crash", { gain: 0.8 });
    else if (k === "knockout") { S.play("boom", { gain: 1.2, rate: 0.85 }); S.play("crash", { pan: PAN[v.team] }); }   // 3q: hết mạng ⇒ xe nổ
    else if (k === "takeoff") S.play("flyby", { gain: 0.5, rate: 1.2, pan: PAN[v.team ?? 0] });
    else if (k === "menu" && intro) { introOn = true; game.hold(true); intro.show(); }
    else if (k === "car" && intro && intro.cars[v.team] !== v.id) intro.setCar(v.team, v.id, false);
  }

  return {
    game, intro,
    setOptions(o) { if (dead) return false; return game.setOptions(o) === true; },
    destroy() {
      if (dead) return; dead = true;
      timers.forEach(clearInterval); offs.forEach(f => f());
      try { intro.destroy(); } catch (e) { /* */ }
      try { game.destroy(); } catch (e) { /* */ }
      try { S.stopAll(0.1); S.close(); } catch (e) { /* */ }
      root.remove();
    }
  };
}
