// =============================================================
// ROCKET RACE 3D — TIẾNG CẢNH PHÓNG (Đợt 398; nguồn myGame core/intro-sound-5b.js, tiếng tự tổng hợp bằng myGame tools/tao-am-thanh-*.py).
// Theo nút 🔊 của trận: nền buổi sáng (gió/nhà máy/chim) đi kênh BACKGROUND, còn lại kênh EFFECTS (opts.prefs() đọc lại mỗi giây).
// TIẾNG INTRO mẫu 5 (thầy 26/9/2026) — như 4i + "bùm" nhỏ khi bấm START, "túc túc túc" khi đếm 3-2-1, tiếng vượt ánh sáng THẬT (assets/sound-5).
// Gốc: TIẾNG INTRO "phóng từ mặt đất" (mẫu 4i) — Web Audio, không nhạc nền.
// Tiếng tự tổng hợp bằng tools/tao-am-thanh-intro.py → assets/sound-intro/*.ogg (mp3 dự phòng cho trình duyệt không đọc ogg).
//   Màn chờ: GIÓ + MÁY MÓC NHỎ trong nhà xưởng + CHIM HÓT (lặp liền).
//   START: xì hơi thân tàu · đánh lửa (nổ đanh + bùng) + MÂY KHÓI cuồn cuộn · GẦM ĐỘNG CƠ rú lên (rất to, lách tách) ·
//   tàu VÚT QUA máy quay · gầm xa dần, tối dần khi lên cao · NHẢY TỐC ĐỘ · hoà cảnh ⇒ tắt dần, nhường tiếng game.
// Nhịp lấy từ trạng thái cảnh (launch.onTick) chứ không theo đồng hồ riêng ⇒ luôn khớp hình, kể cả khi bàn thử tự lái khung hình.
// =============================================================
const NAMES = ["wind", "factory", "birds", "vent", "roar", "ignite", "steam", "flyby", "warp", "startboom", "tuc"];
const AMB = { wind: 0.5, factory: 0.4, birds: 0.5 };

export function createIntroSound(base = new URL("./sfx-intro/", import.meta.url).href, opts = {}) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return { update() {}, end() {}, setMuted() {}, get muted() { return true; } };
  const ctx = new AC();
  // nén + chặn đỉnh ở cuối: gầm động cơ được đẩy thật to mà không vỡ tiếng
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.3;
  const master = ctx.createGain(); master.gain.value = 1;
  master.connect(comp); comp.connect(ctx.destination);
  const bus = { fx: ctx.createGain(), bg: ctx.createGain() }; bus.fx.connect(master); bus.bg.connect(master);
  const applyPrefs = () => { const p = (opts.prefs && opts.prefs()) || { fx: true, bg: true }; bus.fx.gain.setTargetAtTime(p.fx ? 1 : 0, ctx.currentTime, 0.08); bus.bg.gain.setTargetAtTime(p.bg ? 1 : 0, ctx.currentTime, 0.08); };
  applyPrefs(); const prefTimer = setInterval(applyPrefs, 1000);
  const busOf = name => (AMB[name] != null ? bus.bg : bus.fx);
  const ext = new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? "ogg" : "mp3";
  const bufs = {};
  const ready = Promise.all(NAMES.map(n => fetch(base + n + "." + ext).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b))
    .then(b => { bufs[n] = b; }).catch(() => { /* thiếu một tiếng thì im tiếng đó */ })));
  // trình duyệt chỉ cho phát sau một cú chạm — cú chạm đầu tiên nào cũng mở khoá (TOMKO/Electron thường mở sẵn)
  let muted = false, ended = false;
  const unlock = () => { if (!ended && ctx.state === "suspended") ctx.resume().catch(() => {}); };
  window.addEventListener("pointerdown", unlock, true); window.addEventListener("keydown", unlock, true); unlock();

  const loops = {};                                   // tên → { src, g, f }
  const now = () => ctx.currentTime;
  function loop(name, vol, fade = 1.0) {
    let L = loops[name];
    if (!L) {
      const b = bufs[name]; if (!b) return;
      const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000; f.Q.value = 0.5;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(busOf(name)); src.start(now(), Math.random() * b.duration * 0.8);
      L = loops[name] = { src, g, f };
    }
    L.g.gain.cancelScheduledValues(now()); L.g.gain.setTargetAtTime(vol, now(), Math.max(0.01, fade / 3));
  }
  function tone(name, hz, secs = 0.5) { const L = loops[name]; if (L) L.f.frequency.setTargetAtTime(hz, now(), secs / 3); }
  function one(name, vol = 1, offset = 0) {
    const b = bufs[name]; if (!b) return;
    const src = ctx.createBufferSource(); src.buffer = b; const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(busOf(name)); src.start(now(), Math.min(offset, b.duration - 0.05));
  }
  const done = new Set(), once = (k, fn) => { if (!done.has(k)) { done.add(k); fn(); } };
  let started = false;
  ready.then(() => { started = true; });

  return {
    ready,
    get state() { return { ctx: ctx.state, ext, bufs: Object.keys(bufs), loops: Object.fromEntries(Object.entries(loops).map(([k, L]) => [k, +L.g.gain.value.toFixed(2)])), done: [...done] }; },   // bàn thử
    get muted() { return muted; },
    fx(name, vol = 1) { if (!ended) { unlock(); one(name, vol); } },          // tiếng một lần theo nút (bùm START)
    setMuted(m) { muted = !!m; master.gain.setTargetAtTime(muted ? 0 : 1, now(), 0.1); },
    // gọi MỖI KHUNG HÌNH từ cảnh intro: { phase, t, T, passT, handed }
    update(s) {
      if (!started || ended) return;
      if (s.phase === "idle") { Object.entries(AMB).forEach(([n, v]) => loop(n, v, 2.5)); return; }
      const { t, T } = s;
      once("launch", () => { loop("vent", 0.32, 1.2); loop("birds", 0.4, 1.5); });              // bấm START: thân tàu xì hơi lạnh
      [2.7, 1.8, 0.9].forEach((b, i) => { if (t >= T.lift - b) once("tuc" + i, () => one("tuc", 0.9)); });   // đếm 3-2-1: túc túc túc
      if (t >= T.ign) once("ign", () => {
        one("ignite", 1.0); one("steam", 0.85);
        loop("roar", 1.0, (T.lift - T.ign) + 0.2);                                              // gầm dâng tới đỉnh lúc rời bệ
        loop("vent", 0, 0.4); loop("factory", 0.08, 1.2); loop("birds", 0.06, 1.0); loop("wind", 0.25, 1.5);
      });
      if (s.passT) once("pass", () => {
        one("flyby", 1.0, 1.0);                                                                // đỉnh tiếng vút ≈ 0,3 s sau khi tàu vượt máy quay
        loop("roar", 0.72, 1.2); tone("roar", 2600, 3.0);                                      // máy quay ra sau đuôi, tàu lên cao ⇒ gầm tối và xa dần
        loop("wind", 0, 2.0); loop("factory", 0, 1.5); loop("birds", 0, 1.5);
      });
      if (s.passT && t >= T.warp) once("warp", () => { one("warp", 1.0, Math.max(0, 1.5 - (T.fade - T.warp))); loop("roar", 0.35, 1.0); tone("roar", 900, 1.2); });
      if (s.handed) this.end();
    },
    // hoà cảnh xong: tắt dần mọi tiếng intro (đuôi tiếng nhảy tốc độ vẫn ngân), rồi đóng hẳn
    end() {
      if (ended) return; ended = true; clearInterval(prefTimer);
      Object.values(loops).forEach(L => { L.g.gain.cancelScheduledValues(now()); L.g.gain.setTargetAtTime(0, now(), 0.4); });
      setTimeout(() => { Object.values(loops).forEach(L => { try { L.src.stop(); } catch { /* ignore */ } }); window.removeEventListener("pointerdown", unlock, true); window.removeEventListener("keydown", unlock, true); ctx.close().catch(() => {}); }, 4500);
    }
  };
}
