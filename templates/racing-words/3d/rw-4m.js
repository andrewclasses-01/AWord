// RACING WORDS — GÓI NHÚNG mẫu 4m (19/10/2026) = rw-4l.js + lõi sr3d-4m.js (mẫu drone 3D thật A1 / A6 / B3, chọn ở Settings ▸ Drone ▸ Model).
// RACING WORDS — GÓI NHÚNG mẫu 4l (19/10/2026) = rw-4k.js + lõi sr3d-4l.js (iPad DRONE) · remote phải là createPadHost của sr3d-padlink-4l.js (3 chỗ).
//   Xưởng: khi Settings ▸ Drone bật ⇒ thẻ thứ 3 DRONE · iPAD (giữa trên) có QR + trạng thái nối — KHÔNG chặn START (drone không bắt buộc). CSS thêm rw-4l.css.
// ---- gốc 4k ----
// RACING WORDS — GÓI NHÚNG mẫu 4k (19/10/2026) = rw-4j.js + lõi sr3d-4k.js (DRONE đợt 1: cột drone giữa, tab Settings ▸ Drone, tâm bắn). CSS thêm rw-4k.css (sau rw-4j.css).
// ---- gốc 4j ----
// RACING WORDS — GÓI NHÚNG mẫu 4g (18/10/2026) = rw-4f.js + lõi sr3d-4g.js (9 việc thầy — hồ sơ mục 41). Phần tiếng mới:
//   · 5 đèn: phát theo sự kiện lõi "light" (đúng nhịp, không dò 50 ms) — mẫu start_lights to hơn + lớp BÍP tổng hợp (sóng vuông 660 Hz, cắt gọn) cho rõ, nét;
//     nhạc trận vào nhỏ (35 %) trong lúc đếm, GO mới lên đủ
//   · Time 10 giây cuối: "tick" mỗi giây (bíp 880 Hz, 3 giây cuối 1.320 Hz)
//   · màn kết: xe thua phanh (rít lốp) · xe thắng vụt ga (boost) · drift (rít lốp dài, trầm) · slow motion ⇒ máy + gió trầm xuống theo G.ts ·
//     đáp đất (land + cinematic_hit) · chữ thắng mới phát win + tiếng reo
//   CSS thêm rw-4g.css (sau rw-4f.css).
// ---- gốc 4f ----
// RACING WORDS — GÓI NHÚNG mẫu 4f (16/10/2026) = rw-4e.js + iPad sau buổi thử TOMKO (thầy: "kết nối với iPad ngay từ trước khi có intro… test ok rồi
//   mới cho start. Khi đã start thì phải giữ kết nối đó, dù có chỉnh options hay bấm start again, change car…"):
//   · CỔNG iPAD ở XƯỞNG (chế độ Drive on iPad): 2 thẻ đội góc dưới — trạng thái nối, mã QR khi chưa nối, vô lăng nhỏ quay theo iPad, ô thử ◀ LEFT / RIGHT ▶,
//     nút Reconnect, dòng chẩn đoán. START chỉ bấm được khi CẢ 2 iPad nối THẲNG (không phải "slow") và đã bẻ thử trái + phải.
//     Đổi chế độ iPad khác Drive (⚙ Settings ▸ iPad) ⇒ không chặn.
//   · remote = createPadHost của sr3d-padlink-4f.js — đường nối SỐNG QUA NHIỀU VÁN (chủ trang giữ, game chỉ gắn / gỡ) ⇒ Apply Options / Start again /
//     đổi xe không phải nối lại; cờ "đã thử" nằm trong đường nối nên dựng lại game không phải thử lại. Lõi vẫn sr3d-4e.js, intro sr3d-intro-4e.js.
//   · iPad: sr3d-padui-4f.js (mốc cân bằng tự lấy theo hướng màn, bỏ LEVEL).
// ---- gốc 4e ----
// RACING WORDS — GÓI NHÚNG mẫu 4e (16/10/2026) = rw-4d.js + lõi sr3d-4e.js / intro sr3d-intro-4e.js (8 việc thầy — hồ sơ mục 39):
//   · ⚙ Settings mở được MỌI LÚC, cả trên xưởng intro (rw-4e.css: bảng nổi trên lớp intro) và TẠM DỪNG game: trận đứng, phim intro đứng (intro.pause), tiếng dừng
//   · chạm đúp bỏ phim intro không tính các cú chạm trong bảng Settings
//   · game đã huỷ (Apply ⇒ AWord dựng lại) thì bỏ qua sự kiện muộn (bảng Options đóng sau ⇒ "pause" ⇒ lỗi resume AudioContext đã đóng)
//   · mặc định Drive on iPad + Tilt · Cockpit · Sky view Off · Traffic Off; bay xa hơn khi lên cầu nhảy bằng boost; nghiêng đúng chiều vô lăng; BAD LANDING mất lái
// ---- gốc 4d ----
// RACING WORDS — GÓI NHÚNG mẫu 4d (16/10/2026) = rw-4c.js + lõi sr3d-4d.js (gộp 2 camera bay lên trời (⚙ Settings ▸ Camera: Sky view)). CSS thêm rw-4d.css.
// ---- gốc 4c ----
// RACING WORDS — GÓI NHÚNG mẫu 4c (16/10/2026) = rw-4b.js + lõi sr3d-4c.js (xe khác trên đường (⚙ Settings ▸ Race: Traffic)). CSS thêm rw-4c.css.
// ---- gốc 4b ----
// RACING WORDS — GÓI NHÚNG mẫu 4b (16/10/2026) = rw-4a.js + lõi sr3d-4b.js (đường cong đúng vật lý · bỏ lái tự động · dốc xoắn · phần thưởng
//   BOOST / LIFE / MISSILE · vạch mạng mới). Options mới: pkBoost, pkLife, pkMissile (true/false), twists. CSS thêm rw-4b.css (sau rw-4a.css).
// ---- gốc 4a ----
// RACING WORDS — GÓI NHÚNG mẫu 4a (16/10/2026) = rw-3z.js + lõi sr3d-4a.js (chế độ đua len/time/words · đích dời được · nhiều cua · cây chi tiết ·
//   vạch ANDREW STUDIO · cầu nhảy mượt). Options mới: race ("len" | "time" | "words"), lenK (1 | 1.5 | 2 | 3), timeS (giây). CSS thêm rw-4a.css (sau rw-3z.css).
// ---- gốc 3z ----
// RACING WORDS — GÓI NHÚNG mẫu 3z (16/10/2026) = rw-3y.js + lõi sr3d-3z.js / intro sr3d-intro-3z.js (dải câu hỏi xuống dưới, xe không chìm,
//   bóng đúng hình xe, nút ⚙ Cài đặt có tab iPad · Camera, góc nhìn đuôi xe). CSS thêm rw-3z.css (sau rw-3r.css).
// ---- gốc 3y ----
// RACING WORDS — GÓI NHÚNG mẫu 3y (16/10/2026) = rw-3r.js + lõi sr3d-3y.js (LÁI NGHIÊNG iPAD · phanh trái ga phải · dấu đỉnh vô lăng máy bay giấy).
//   iPad: sr3d-padui-3y.js + đường nối sr3d-padlink-3y.js (khoá "c:" kiểu lái, "r:" tên lửa qua kho). remote phải là createPadHost của padlink-3y.
// ---- gốc 3r ----
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
import { createSpeedRun } from "./sr3d-4m.js";   // 4m: mẫu drone 3D thật · 4l: + iPad drone · 4k: DRONE
import { XE, prepXe } from "./sr3d-xe3d-3o.js";
import { createIntro } from "./sr3d-intro-4h.js";
import { createSound } from "./sr3d-sound-3o.js";
import { qrSvg } from "./mc3d-qr.js";

const CARS_KEY = "speedrun.cars";            // xe 2 đội nhớ THEO MÁY (thầy chọn ở màn chờ xưởng)
const DEF_CARS = ["Y2", "H4"];

export async function createRacingWords({ mount, questions, title = "RACING WORDS", options = {}, host = null, remote = null, onEvent = () => {}, onProgress = () => {} }) {
  // 4h: onProgress(bước) cho thanh LOADING chia theo THỜI GIAN — "cars" (xe đã tải) · "race" (trận dựng xong) · "studio" (xưởng xong, sắp trả về) · "frame" (khung đầu đã vẽ) · "warm" (dịch sẵn hình xong)
  const prog = k => { try { onProgress(k); } catch (e) { /* */ } };
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
  prog("cars"); await new Promise(r => setTimeout(r, 0));   // 4h: nhường 1 nhịp cho thanh LOADING vẽ
  if (dead) return null;
  frame.innerHTML = "";

  // ---------- âm thanh ----------
  const S = createSound(); S.load();
  // 4g: BÍP tổng hợp (Web Audio) chồng lên tiếng mẫu — rõ, nét, không tốn file; theo nút loa hiệu ứng (S.fxOn)
  function beep(f = 660, dur = 0.2, gain = 0.32) {
    if (dead || !S.fxOn) return; const c = S.ctx; if (!c || c.state === "closed") return;
    const t0 = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 2;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006); g.gain.setValueAtTime(gain, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200;
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(c.destination); o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.02); o2.stop(t0 + dur + 0.02);
  }
  // 4h: tiếng KHOẢNG CHỜ câu mới (thầy chọn trên trang thiet-ke-4h): R3 gió hút qua bộ lọc + sóng trầm dâng (T giây) · B1 bùm trầm nhẹ khi câu mới bật ra
  let noiseB = null;
  const noise = c => { if (noiseB && noiseB.sampleRate === c.sampleRate) return noiseB; const b = c.createBuffer(1, c.sampleRate * 3.2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (noiseB = b); };
  function qRiser(T = 3) {
    if (dead || !S.fxOn) return; const c = S.ctx; if (!c || c.state === "closed") return;
    const t = c.currentTime + 0.02, out = c.createGain(); out.gain.value = 0.8; out.connect(c.destination);
    const n = c.createBufferSource(); n.buffer = noise(c); const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(3600, t + T);
    const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.32, t + T * 0.92); ng.gain.linearRampToValueAtTime(0, t + T);
    n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t); n.stop(t + T + 0.05);
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(130, t + T);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + T * 0.9); g.gain.linearRampToValueAtTime(0, t + T);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + T + 0.02);
    setTimeout(() => { try { out.disconnect(); } catch (e) { /* */ } }, (T + 0.5) * 1000);
  }
  function qBoom() {
    if (dead || !S.fxOn) return; const c = S.ctx; if (!c || c.state === "closed") return;
    const t = c.currentTime + 0.005, out = c.createGain(); out.gain.value = 0.85; out.connect(c.destination);
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.32);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
    const n = c.createBufferSource(); n.buffer = noise(c); const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(lp); lp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.15);
    setTimeout(() => { try { out.disconnect(); } catch (e) { /* */ } }, 900);
  }
  const PAN = [-0.55, 0.55];
  let introOn = true, idleAmb = false;

  // ---------- trận đua ----------
  // 4f: đường nối iPad sống qua nhiều ván — game chỉ gắn / gỡ CHÍNH NÓ
  let myCtl = null;
  const rem = remote ? Object.assign(Object.create(remote), { attach(c) { myCtl = c; remote.attach(c); }, detach() { remote.detach && remote.detach(myCtl); } }) : null;
  const game = createSpeedRun({ mount: frame, bar, questions, title, options: { ...options, cars }, remote: rem, host,
    onEvent: (k, v) => { if (dead) return; if (k === "pause") S.pause(v === true); else if (k === "settings") { if (intro) intro.pause(v === true); } else onGameEvent(k, v || {}); try { onEvent(k, v); } catch (e) { /* */ } } });
  game.hold(true);
  prog("race");

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
  warm.then(() => { if (!dead && intro.arGo) intro.arGo(); prog("warm"); });   // 3r · 4h: báo "warm"
  prog("studio"); requestAnimationFrame(() => requestAnimationFrame(() => { if (!dead) prog("frame"); }));   // 4h: "frame" = khung đầu đã vẽ (dịch hình lần đầu khoá luồng chính ~1 s)
  // 3p: CHẠM ĐÚP khi phim intro đang chiếu ⇒ vào thẳng màn xuất phát (2 lần chạm ≤ 350 ms, lệch ≤ 40 px)
  let tap0 = null;
  on(frame, "pointerdown", e => {
    if (!intro || intro.state !== "play" || e.target.closest("button, .sr-panel")) { tap0 = null; return; }   // 4e: chạm trong Settings không bỏ phim
    const now = performance.now();
    if (tap0 && now - tap0.t < 350 && Math.hypot(e.clientX - tap0.x, e.clientY - tap0.y) < 40) { tap0 = null; intro.skip(); return; }
    tap0 = { t: now, x: e.clientX, y: e.clientY };
  }, { capture: true });
  // nút thử / tự chơi gọi thẳng game.start() ⇒ intro tự ẩn
  every(() => { if (introOn && game.state().phase !== "menu") { introOn = false; intro.hide(); game.hold(false); } }, 200);

  // ---------- 4f: CỔNG iPAD ở xưởng ----------
  const TM = [{ name: "TEAM 1", color: "#3b8cff" }, { name: "TEAM 2", color: "#ff7a00" }];
  const WHEEL = `<svg viewBox="-50 -50 100 100"><circle r="38" fill="none" stroke="currentColor" stroke-width="9"/><path d="M-38 4H38M0 4V38" stroke="currentColor" stroke-width="9" fill="none"/><rect x="-6" y="-49" width="12" height="15" rx="3" fill="var(--tc)"/></svg>`;
  const gate = document.createElement("div"); gate.className = "rw-gate"; gate.hidden = true;
  gate.innerHTML = [0, 1].map(i => `<div class="rw-gc rw-gc${i}" style="--tc:${TM[i].color}" data-t="${i}">
      <div class="rw-gh"><b>${TM[i].name} · iPAD</b><span class="rw-gs"><i></i><span></span></span></div>
      <div class="rw-gb"><div class="rw-gq"></div><div class="rw-gw">${WHEEL}</div>
        <div class="rw-gt"><span class="rw-gl">◀ LEFT</span><span class="rw-gr">RIGHT ▶</span><small></small></div></div>
      <div class="rw-gf"><button type="button" class="rw-grc">↻ Reconnect</button><em class="rw-gd"></em></div></div>`).join("");
  // 4l: thẻ DRONE · iPAD (chỉ khi Settings ▸ Drone bật) — QR + trạng thái, không chặn START
  gate.insertAdjacentHTML("beforeend", `<div class="rw-gc rw-gc2" style="--tc:#b07cff" data-t="2"><div class="rw-gh"><b>DRONE · iPAD</b><span class="rw-gs"><i></i><span></span></span></div>
    <div class="rw-gb"><div class="rw-gq"></div><div class="rw-gt"><small></small></div></div><div class="rw-gf"><button type="button" class="rw-grc">↻ Reconnect</button><em class="rw-gd"></em></div></div>`);
  frame.appendChild(gate);
  const startB = frame.querySelector(".ri-start"), startHTML = startB ? startB.innerHTML : "";
  const gs = [0, 1].map(i => { const c = gate.querySelector(".rw-gc" + i); return { c, st: c.querySelector(".rw-gs span"), q: c.querySelector(".rw-gq"), w: c.querySelector(".rw-gw svg"), tip: c.querySelector(".rw-gt small"), d: c.querySelector(".rw-gd"), key: "", qr: "", rot: 1e9 }; });
  gate.querySelectorAll(".rw-grc").forEach(b => on(b, "click", e => { e.stopPropagation(); const t = +b.closest(".rw-gc").dataset.t; remote && remote.reconnect && remote.reconnect(t); }));
  const gateNeed = () => !!(remote && remote.live && game.padMode === 2);
  const teamOk = l => l.s === "on" && l.tl && l.tr;
  let gateOk = true;
  const g2 = (() => { const c = gate.querySelector(".rw-gc2"); return { c, st: c.querySelector(".rw-gs span"), q: c.querySelector(".rw-gq"), tip: c.querySelector(".rw-gt small"), d: c.querySelector(".rw-gd"), key: "", qr: "" }; })();
  function paintDroneCard() {                                        // 4l
    const on = !!(remote && remote.live && game.drone && game.drone.set.on && introOn && intro && intro.state === "idle");
    g2.c.hidden = !on; if (!on) return;
    const l = remote.live(2), key = [l.s, l.diag].join("|"); if (key === g2.key) return; g2.key = key;
    g2.c.dataset.s = l.s || "none"; g2.c.classList.toggle("is-ok", l.s === "on");
    g2.st.textContent = l.s === "on" ? "READY" : l.s === "relay" ? "SLOW — reconnecting…" : l.s === "wait" ? "Connecting…" : "Scan the QR with the drone iPad";
    g2.tip.textContent = l.s === "on" ? "Drone iPad connected" : "Optional — the race can start without it"; g2.d.textContent = l.diag || "";
    const wantQr = l.s !== "on" && l.s !== "relay" ? l.url : "";
    if (wantQr !== g2.qr) { g2.qr = wantQr; g2.q.innerHTML = wantQr ? qrSvg(wantQr, { quiet: 1 }) : ""; g2.c.classList.toggle("has-qr", !!wantQr); }
  }
  function paintGate() {
    paintDroneCard();                                                   // 4l
    const show = (gateNeed() || !g2.c.hidden) && introOn && intro && intro.state === "idle";
    if (gate.hidden === show) gate.hidden = !show;
    const need = gateNeed();
    gateOk = !need || [0, 1].every(i => teamOk(remote.live(i)));
    root.classList.toggle("rw-padwait", !gateOk);
    if (startB) { const h = gateOk ? startHTML : "WAITING FOR iPADS…"; if (startB.innerHTML !== h) startB.innerHTML = h; }
    gs.forEach(g => { g.c.hidden = !gateNeed(); });                    // 4l: cổng 2 đội chỉ khi Drive on iPad
    if (!show || !gateNeed()) return;
    [0, 1].forEach(i => {
      const l = remote.live(i), g = gs[i], ok = teamOk(l);
      const key = [l.s, l.tl, l.tr, l.diag, ok].join("|");
      if (key !== g.key) {
        g.key = key;
        g.c.dataset.s = l.s || "none"; g.c.classList.toggle("is-ok", ok); g.c.classList.toggle("is-tl", l.tl); g.c.classList.toggle("is-tr", l.tr);
        g.st.textContent = l.s === "on" ? (ok ? "READY" : "Connected") : l.s === "relay" ? "SLOW — reconnecting…" : l.s === "wait" ? "Connecting…" : "Scan the QR with the iPad";
        g.tip.textContent = l.s === "on" ? (ok ? "Steering OK" : "Turn the iPad wheel left and right") : l.s === "relay" ? "No direct link — too slow to drive" : "";
        g.d.textContent = l.diag || "";
        const wantQr = l.s !== "on" && l.s !== "relay" ? l.url : "";
        if (wantQr !== g.qr) { g.qr = wantQr; g.q.innerHTML = wantQr ? qrSvg(wantQr, { quiet: 1 }) : ""; g.c.classList.toggle("has-qr", !!wantQr); }
      }
      const fresh = performance.now() - l.at < 600, rot = Math.round((fresh ? l.steer : 0) * 90);
      if (rot !== g.rot) { g.rot = rot; g.w.style.transform = `rotate(${rot}deg)`; }
    });
  }
  every(paintGate, 100);
  // START bị chặn khi iPad chưa sẵn sàng ⇒ nháy thẻ đội còn thiếu
  on(frame, "click", e => {
    if (gateOk || !e.target.closest(".ri-start")) return;
    e.stopImmediatePropagation(); e.preventDefault();
    [0, 1].forEach(i => { if (!teamOk(remote.live(i))) { const c = gs[i].c; c.classList.remove("is-nudge"); void c.offsetWidth; c.classList.add("is-nudge"); } });
  }, { capture: true });

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
      if (ph === "count") { S.loop("mRace", true, { fade: 2, gain: 0.35 }); lights = 0; }                       // 4g: nhạc nhỏ khi đếm đèn
      if (ph === "race") { S.play("go"); beep(1320, 0.42, 0.34); S.loop("mRace", true, { gain: 1 }); }
      if (ph === "end") S.loop("mRace", false, { fade: 0.8 });                                                   // 4g: win / reo / nhạc kết khi CHỮ THẮNG hiện (sự kiện "banner")
      if (ph === "menu") { S.stopAll(0.8); idleAmb = false; }
      lastPhase = ph;
    }
    S.pause(!!game.G.paused);
    st.teams.forEach((t, i) => {
      const T = game.T[i], v = t.v, boostK = Math.max(T.boostK || 0, T.nitroK || 0);
      const ts = game.G.ts || 1, slow = 0.45 + 0.55 * ts;                                                         // 4g: slow motion ⇒ tiếng trầm xuống
      S.loop("engine" + i, racing, { name: "engine", rate: (0.85 + v / 45 + boostK * 0.1) * slow, gain: 0.55 + 0.35 * boostK, pan: PAN[i] });
      S.loop("wind" + i, racing && (v > 25 || t.air), { name: "wind", gain: Math.min(1, (v - 20) / 25) + (t.air ? 0.4 : 0), rate: slow, pan: PAN[i] });
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
    if (k === "qwait") { qRiser(v.T || 3); return; }                                // 4h
    if (k === "rsLight") { S.play("lightsBeep", { gain: 1.3 }); beep(660, 0.2, 0.28); return; }   // 4i: đèn 3-2-1 khi quay lại game
    if (k === "rsGo") { beep(1320, 0.34, 0.32); return; }
    if (k === "qnew") { qBoom(); return; }
    if (k === "light") { S.play("lightsBeep", { gain: 1.6 }); beep(660, 0.22, 0.3); return; }                    // 4g: từng đèn — to, rõ, nét
    if (k === "tick") { beep(v <= 3 ? 1320 : 880, v <= 3 ? 0.16 : 0.1, v <= 3 ? 0.26 : 0.17); if (v <= 3) S.play("lightsBeep", { gain: 1.1, rate: 1.25 }); return; }
    if (k === "drift") { S.play("screech", { pan: PAN[v.team], gain: v.loser ? 0.9 : 1.2, rate: v.loser ? 1 : 0.82 }); if (!v.loser) S.play("screech", { pan: PAN[v.team], gain: 0.8, rate: 0.7, delay: 0.25 }); return; }
    if (k === "fin") {
      if (v.stage === "lose") { if (!v.air) S.play("boost", { pan: PAN[v.team], gain: 1.1 }); }
      else if (v.stage === "win") { S.play("flyby", { gain: 0.9, rate: 0.62 }); S.play("hit", { gain: 0.7, delay: 0.1 }); }
      else if (v.stage === "land") { S.play("land", { gain: 1.1, rate: 0.8 }); S.play("hit", { gain: 0.9 }); }
      return;
    }
    if (k === "banner") { S.play("win"); S.play("crowd", { delay: 0.3 }); setTimeout(() => !dead && S.play("mResult"), 1400); return; }
    if (k === "tumble") { S.play("crash", { pan: PAN[v.team], gain: 0.7 }); S.play("screech", { pan: PAN[v.team], gain: 0.6, rate: 0.75 }); return; }
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
