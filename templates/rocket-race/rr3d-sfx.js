// ⭐ Đợt 417 (thầy 28/9/2026 "ok, ghép 7d vào AWord"): chép NGUYÊN từ kho myGame `rocket-race/game7d/` (MẪU 7b + 7c + 7d).
// Sửa về sau: làm ở myGame (tools/chep-aword-sang-game.py lấy bản này ra thư mục game mới) → thầy OK → chép sang.
// =============================================================
// ROCKET RACE 3D — bộ tiếng của trận Fight 3D.
// Đợt 392: mp3 CC0 (Kenney + OpenGameArt) qua core/sfx.js.
// ⭐ Đợt 393 (thầy, 26/9/2026): "hiệu ứng hơi hoạt hình và trẻ con, thay toàn bộ bằng hiệu ứng điện
// ảnh và chân thực" + "tiếng lửa khi tăng tốc bị ngắt luôn, phải giảm dần thật chậm" + "bấm loa hiện
// 2 mục Effect và Background" + "bỏ giọng đọc ở mọi tình huống":
//   · tiếng hiệu ứng TỔNG HỢP lại (sfx/NGUON AM THANH.md) — nền vũ trụ + lửa cháy giữ bản CC0;
//   · phát bằng WEB AUDIO (không qua <audio>): tiếng lặp nối KHÔNG khựng, mọi lần tắt/bật đều trượt
//     âm lượng (không cắt), hai "bus" Effect / Background tắt riêng, nhớ theo máy (localStorage);
//   · ☰ Menu tạm dừng = ctx.suspend() (mọi tiếng đứng đúng chỗ, mở lại chạy tiếp).
// Chỉ được import() ĐỘNG từ nhánh Fight 3D — Solo/Teams và máy học sinh không tải file này.
// =============================================================

const NAMES = ["ambient", "engine", "fire", "boost", "stall", "hit1", "hit2", "hit3", "boom", "boomlow",
  "turbo", "tap", "gate", "portal", "win", "whoosh", "ting", "tinggo",
  "mcharge", "mload", "mlaunch", "mwarn", "mdodge",       // Đợt 407: tên lửa (myGame tools/tao-am-thanh-6.py)
  "malarm_b", "malarmf_b"];                               // Đợt 409: chuông báo động kiểu b (myGame tools/tao-am-thanh-6d.py)
const BG = new Set(["ambient"]);                 // còn lại đều là Effect
// Âm lượng gốc từng tiếng (chỉnh tương quan với nhau)
const BASE = { ambient: 0.45, engine: 0.32, fire: 0.55, boost: 0.8, stall: 0.85, hit1: 0.95, hit2: 0.95, hit3: 0.95,
  boom: 1, boomlow: 0.8, turbo: 1, tap: 0.45, gate: 0.8, portal: 0.75, win: 0.8, whoosh: 0.75, ting: 0.6, tinggo: 0.7,
  mcharge: 0.9, mload: 0.75, mlaunch: 0.95, mwarn: 0.45, mdodge: 0.9, malarm_b: 0.65, malarmf_b: 0.7 };
// ⭐ Đợt 444 (thầy 02/10/2026): "khi chọn 1 câu đúng, tiếng nổ tăng tốc động cơ to hơn nữa nhiều, nổi bật hẳn lên".
// File boost to trung bình chỉ ~ −20 dB (đỉnh −2 dB) ⇒ gần ngang tiếng động cơ nền. Tên ảo "boostx" = buffer boost đi qua đường
// KHUẾCH ĐẠI (+PUNCH_DB) → BỘ NÉN → bù lại → CHẶN ĐỈNH −3 dB: phần thân tiếng to lên nhiều mà không rè. Đo OfflineAudioContext
// (1,5 s đầu): cũ RMS −18,7 dB / đỉnh −6,5 · mới RMS −10,5 / đỉnh −1,1 (≈ +8 dB; động cơ nền RMS −25). Không chặn đỉnh thì
// đỉnh +3 dB = rè. Chỉ câu đúng (view.advanceFx — cả BOOST tiến nấc) gọi "boostx"; né của rr3d-missile.js vẫn "boost" thường.
const ALIAS = { boostx: "boost" };
const PUNCH = new Set(["boostx"]);
const PUNCH_DB = 14, PUNCH_MAKEUP_DB = 5;
const KEY = "aw-rr3d-sound";

export function readSoundPrefs() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { fx: v.fx !== false, bg: v.bg !== false }; }
  catch { return { fx: true, bg: true }; }
}
function savePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } }

export function createRr3dSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return dummy();
  const ctx = new AC();
  const master = ctx.createGain(); master.connect(ctx.destination);
  const prefs = readSoundPrefs();
  const bus = { fx: ctx.createGain(), bg: ctx.createGain() };
  bus.fx.gain.value = prefs.fx ? 1 : 0; bus.bg.gain.value = prefs.bg ? 1 : 0;
  bus.fx.connect(master); bus.bg.connect(master);
  // Đợt 444: đường "punch" — nén mạnh rồi bù, đổ vào bus Effect (tắt Effect / act voice vẫn ăn như mọi tiếng khác)
  const punchIn = ctx.createGain(); punchIn.gain.value = Math.pow(10, PUNCH_DB / 20);
  const punchComp = ctx.createDynamicsCompressor();
  punchComp.threshold.value = -14; punchComp.knee.value = 6; punchComp.ratio.value = 8;
  punchComp.attack.value = 0.003; punchComp.release.value = 0.3;
  const punchOut = ctx.createGain(); punchOut.gain.value = Math.pow(10, PUNCH_MAKEUP_DB / 20);
  const punchLim = ctx.createDynamicsCompressor();
  punchLim.threshold.value = -3; punchLim.knee.value = 0; punchLim.ratio.value = 20; punchLim.attack.value = 0.001; punchLim.release.value = 0.1;
  punchIn.connect(punchComp); punchComp.connect(punchOut); punchOut.connect(punchLim); punchLim.connect(bus.fx);
  const buffers = new Map();
  let dead = false, paused = false;
  const base = new URL("./sfx/", import.meta.url);
  const ready = Promise.all(NAMES.map(n => fetch(new URL(n + ".mp3", base)).then(r => r.arrayBuffer())
    .then(b => ctx.decodeAudioData(b)).then(buf => { buffers.set(n, { buf, ...bounds(buf) }); })
    .catch(() => { /* thiếu một tiếng thì im tiếng đó */ })));
  // Trình duyệt chỉ cho phát sau một cú chạm — cú chạm đầu tiên nào cũng mở khoá.
  const unlock = () => { if (!paused && !dead && ctx.state === "suspended") ctx.resume().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, true);
  unlock();

  const loops = new Map();          // tên → { src, g }
  function out(name) { return BG.has(name) ? bus.bg : bus.fx; }
  function play(name, v = 1) {
    if (dead) return;
    const file = ALIAS[name] || name;
    const b = buffers.get(file); if (!b) return;          // chưa tải xong — bỏ qua tiếng này
    const src = ctx.createBufferSource(); src.buffer = b.buf;
    const g = ctx.createGain(); g.gain.value = Math.min(1.5, (BASE[file] ?? 0.8) * v);
    src.connect(g); g.connect(PUNCH.has(name) ? punchIn : out(name));
    src.start(ctx.currentTime, b.start);
  }
  function loop(name, on, v = 1, fade) {
    if (dead) return;
    const cur = loops.get(name);
    const now = ctx.currentTime;
    if (!on) {
      if (!cur) return;
      loops.delete(name);
      const f = fade ?? 1.6;                   // tắt = trượt nhỏ dần, không cắt
      cur.g.gain.cancelScheduledValues(now); cur.g.gain.setValueAtTime(cur.g.gain.value, now);
      cur.g.gain.linearRampToValueAtTime(0, now + f);
      try { cur.src && cur.src.stop(now + f + 0.05); } catch { /* ignore */ }
      return;
    }
    const target = Math.min(1.5, (BASE[name] ?? 0.8) * v);
    if (cur) {
      cur.g.gain.cancelScheduledValues(now); cur.g.gain.setValueAtTime(cur.g.gain.value, now);
      cur.g.gain.linearRampToValueAtTime(target, now + (fade ?? 0.8));
      return;
    }
    const rec = { src: null, g: ctx.createGain() };
    rec.g.gain.value = 0;
    rec.g.connect(out(name));
    loops.set(name, rec);
    const start = () => {
      if (dead || loops.get(name) !== rec) return;
      const b = buffers.get(name); if (!b) return;
      const src = ctx.createBufferSource(); src.buffer = b.buf;
      src.loop = true; src.loopStart = b.start; src.loopEnd = b.end;
      src.connect(rec.g);
      const t = ctx.currentTime;
      rec.g.gain.setValueAtTime(0, t); rec.g.gain.linearRampToValueAtTime(target, t + (fade ?? 1.2));
      src.start(t, b.start);
      rec.src = src;
    };
    if (buffers.has(name)) start(); else ready.then(start);
  }
  // Tiếng lặp đang chạy gầm to lên rồi LẮNG LẠI THẬT CHẬM (động cơ khi tăng tốc)
  function swell(name, peak, back, upSec = 0.25, downSec = 5) {
    const cur = loops.get(name); if (!cur || dead) return;
    const now = ctx.currentTime, g = cur.g.gain;
    const k = BASE[name] ?? 0.8;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(Math.min(1.5, k * peak), now + upSec);
    g.setTargetAtTime(Math.min(1.5, k * back), now + upSec, downSec / 3);   // tắt dần theo hàm mũ
  }
  // ⭐ Đợt 405 (thầy): act VOICE ⇒ nhạc nền TẮT và không bật được (giọng đọc phải nghe rõ).
  // Khoá chỉ ép kênh nền về 0 cho trận này — KHÔNG ghi đè lựa chọn đã nhớ của máy.
  // ⭐ Đợt 454 (thầy 03/10/2026): tiếng NẠP NĂNG LƯỢNG lúc tên lửa ở ô sẵn sàng đỏ dần — tổng hợp tại chỗ (không file).
  // ⭐ 454b (thầy: "tiếng titttt quá lớn, chói") — CHỈ còn tiếng gió "VÚT": tiếng ồn trắng qua lọc dải, tần số giữa quét 220 → 2400 Hz,
  // to dần rồi lặng đi đúng lúc nạp xong; không dao động, không "ting"; đỉnh nhỏ (0,07).
  // Trả { stop() } — huỷ giữa chừng (trận khoá / tên lửa bị dọn) thì trượt tắt trong 0,12 s.
  let noiseBuf = null;
  function charge(dur = 2, v = 1) {
    if (dead) return { stop() {} };
    const t0 = ctx.currentTime, t1 = t0 + Math.max(0.3, dur);
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(220, t0); bp.frequency.exponentialRampToValueAtTime(2400, t1);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.07 * v, t0 + (t1 - t0) * 0.85); g.gain.linearRampToValueAtTime(0.0001, t1 + 0.12);
    src.connect(bp); bp.connect(g); g.connect(bus.fx);
    src.start(t0); src.stop(t1 + 0.2);
    let done = false;
    return {
      stop() {
        if (done || dead) return; done = true;
        const now = ctx.currentTime; if (now >= t1) return;
        g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0.0001, now + 0.12);
        try { src.stop(now + 0.15); } catch { /* ignore */ }
      }
    };
  }
  // ⭐ Đợt 455 (thầy 04/10/2026): tiếng SERVO ROBOT lúc tay đẩy quả ra + xoay quả lên trời — động cơ nhỏ rít lên rồi hạ (răng cưa qua
  // lọc dải, rung 32 Hz như bánh răng), cuối có tiếng "cạch" khớp (ồn ngắn qua lọc thấp). Nhỏ (đỉnh ~0,06).
  function servo(dur = 0.4, v = 1) {
    if (dead) return;
    const t0 = ctx.currentTime, t1 = t0 + Math.max(0.12, dur);
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(150, t0); o.frequency.linearRampToValueAtTime(235, t0 + (t1 - t0) * 0.7); o.frequency.linearRampToValueAtTime(180, t1);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 1.6;
    const grit = ctx.createGain(); grit.gain.value = 0.75;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 32; const lg = ctx.createGain(); lg.gain.value = 0.25; lfo.connect(lg); lg.connect(grit.gain);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.06 * v, t0 + 0.04);
    g.gain.setValueAtTime(0.06 * v, t1 - 0.05); g.gain.linearRampToValueAtTime(0.0001, t1);
    o.connect(bp); bp.connect(grit); grit.connect(g); g.connect(bus.fx);
    [o, lfo].forEach(n => { n.start(t0); n.stop(t1 + 0.05); });
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t1); ng.gain.linearRampToValueAtTime(0.12 * v, t1 + 0.005); ng.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.07);
    n.connect(lp); lp.connect(ng); ng.connect(bus.fx); n.start(t1); n.stop(t1 + 0.1);
  }
  let bgLocked = false;
  // ⭐ MẪU 7b (thầy 27/9/2026): act VOICE ⇒ MỌI tiếng hiệu ứng (động cơ, tăng tốc, báo động, nổ…) nhỏ lại CẢ TRẬN ở một mức
  // cố định để nghe rõ giọng đọc — không tăng giảm theo lúc voice phát. fxLevel 1 = bình thường; trận voice đặt ~0,35.
  let fxLevel = 1;
  function applyBus(fadeSec) {
    const now = ctx.currentTime;
    [["fx", bus.fx], ["bg", bus.bg]].forEach(([k, gn]) => {
      const on = prefs[k] && !(k === "bg" && bgLocked);
      gn.gain.cancelScheduledValues(now); gn.gain.setValueAtTime(gn.gain.value, now);
      gn.gain.linearRampToValueAtTime(on ? (k === "fx" ? fxLevel : 1) : 0, now + fadeSec);
    });
  }
  function setPrefs(p) {
    if (bgLocked && "bg" in p) { p = { ...p }; delete p.bg; }
    Object.assign(prefs, p); savePrefs(prefs);
    applyBus(0.5);
  }
  function lockBg(on) { bgLocked = !!on; applyBus(0.3); }
  function setFxLevel(k) { fxLevel = Math.max(0, Math.min(1, +k || 0)); applyBus(0.3); }
  return {
    play, loop, swell, charge, servo, setPrefs, lockBg, setFxLevel,
    get fxLevel() { return fxLevel; },
    get prefs() { return { ...prefs, bg: prefs.bg && !bgLocked }; },
    get bgLocked() { return bgLocked; },
    get state() { return ctx.state; },
    pause(on) {
      paused = !!on;
      if (dead) return;
      if (paused) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
    },
    stopAll() {
      if (dead) return;
      const now = ctx.currentTime;
      master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(0, now + 0.25);
      dead = true;
      window.removeEventListener("pointerdown", unlock, true);
      setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 400);
    }
  };
}

// mp3 có khoảng lặng đầu/cuối do bộ mã hoá — cắt đi để tiếng lặp nối liền
function bounds(buf) {
  const d = buf.getChannelData(0), n = d.length, th = 0.0008;
  let a = 0, b = n - 1;
  while (a < n && Math.abs(d[a]) < th) a++;
  while (b > a && Math.abs(d[b]) < th) b--;
  return { start: a / buf.sampleRate, end: (b + 1) / buf.sampleRate };
}

function dummy() {
  const noop = () => {};
  return { play: noop, loop: noop, swell: noop, charge: () => ({ stop: noop }), servo: noop, setPrefs: noop, lockBg: noop, setFxLevel: noop, fxLevel: 1, prefs: { fx: true, bg: true }, bgLocked: false, state: "none", pause: noop, stopAll: noop };
}
