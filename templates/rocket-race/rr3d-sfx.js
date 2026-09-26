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
  "turbo", "tap", "gate", "portal", "win", "whoosh", "ting", "tinggo"];
const BG = new Set(["ambient"]);                 // còn lại đều là Effect
// Âm lượng gốc từng tiếng (chỉnh tương quan với nhau)
const BASE = { ambient: 0.45, engine: 0.32, fire: 0.55, boost: 0.8, stall: 0.85, hit1: 0.95, hit2: 0.95, hit3: 0.95,
  boom: 1, boomlow: 0.8, turbo: 1, tap: 0.45, gate: 0.8, portal: 0.75, win: 0.8, whoosh: 0.75, ting: 0.6, tinggo: 0.7 };
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
    const b = buffers.get(name); if (!b) return;          // chưa tải xong — bỏ qua tiếng này
    const src = ctx.createBufferSource(); src.buffer = b.buf;
    const g = ctx.createGain(); g.gain.value = Math.min(1.5, (BASE[name] ?? 0.8) * v);
    src.connect(g); g.connect(out(name));
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
  function setPrefs(p) {
    Object.assign(prefs, p); savePrefs(prefs);
    const now = ctx.currentTime;
    [["fx", bus.fx], ["bg", bus.bg]].forEach(([k, gn]) => {
      gn.gain.cancelScheduledValues(now); gn.gain.setValueAtTime(gn.gain.value, now);
      gn.gain.linearRampToValueAtTime(prefs[k] ? 1 : 0, now + 0.5);
    });
  }
  return {
    play, loop, swell, setPrefs,
    get prefs() { return { ...prefs }; },
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
  return { play: noop, loop: noop, swell: noop, setPrefs: noop, prefs: { fx: true, bg: true }, state: "none", pause: noop, stopAll: noop };
}
