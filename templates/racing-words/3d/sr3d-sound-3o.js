// RACING WORDS mẫu 3o = sr3d-sound-3n.js + close() đóng AudioContext + gỡ listener mở khoá tiếng (AWord dựng lại game nhiều lần ⇒ không rò).
// =============================================================
// RACING WORDS — BỘ ÂM THANH (mẫu 3n, 15/10/2026). Thầy: "âm thanh thật, điện ảnh, xịn, cinematic, cả nhạc nền".
// Web Audio (như Rocket Race Đợt 393): mọi tiếng đã tải sẵn thành buffer; 2 kênh EFFECT / MUSIC tắt riêng (nhớ theo máy);
// tiếng lặp (máy, gió, nhạc) nối KHÔNG khựng + mọi lần bật/tắt đều TRƯỢT âm lượng; máy xe đổi cao độ theo tốc độ.
// File ở speed-run/sfx/<tên>.mp3 — thầy nhờ em chọn (15/10): 29 bản thu thật Pixabay/Mixkit, cắt + ghép lặp + chuẩn độ to bằng make_sfx.py (nguồn: sfx/NGUON AM THANH.md).
// Dùng: const S = createSound(); await S.load(); S.cue("door"); S.loop("engine0", true, { gain, rate }); S.duck(…)
// =============================================================
const BASE = new URL("../sfx/", import.meta.url).href;
// tên tiếng ⇒ { f: file, v: âm lượng gốc, bus: "fx" | "music", loop }
export const SOUNDS = {
  // intro
  garage: { f: "garage_ambience", v: 0.8, loop: true }, door: { f: "roller_door", v: 0.9 }, lights: { f: "lights_on", v: 0.8 },
  start: { f: "engine_start", v: 1 }, rev: { f: "rev_idle", v: 0.7, loop: true }, pop: { f: "exhaust_pops", v: 0.85 }, flyby: { f: "drive_by", v: 1 },
  hit: { f: "cinematic_hit", v: 1 }, lightsBeep: { f: "start_lights", v: 0.8 }, go: { f: "go_stinger", v: 0.9 },
  // trận đua
  engine: { f: "engine_loop", v: 0.55, loop: true }, boost: { f: "boost", v: 0.9 }, screech: { f: "tire_screech", v: 0.7 }, wind: { f: "wind_rush", v: 0.35, loop: true },
  land: { f: "landing_thud", v: 0.9 }, crash: { f: "crash_bump", v: 0.9 }, mLaunch: { f: "missile_launch", v: 0.9 }, mFly: { f: "missile_flyby", v: 0.7 },
  boom: { f: "explosion", v: 1 }, fire: { f: "fire_burn", v: 0.6, loop: true }, correct: { f: "correct_answer", v: 0.8 }, wrong: { f: "wrong_answer", v: 0.8 },
  reload: { f: "reload_clunk", v: 0.7 }, click: { f: "ui_click", v: 0.5 }, win: { f: "win_stinger", v: 1 }, crowd: { f: "crowd_cheer", v: 0.7 },
  // nhạc
  mIntro: { f: "intro_music", v: 0.75, bus: "music" }, mRace: { f: "race_music", v: 0.38, bus: "music", loop: true }, mResult: { f: "result_music", v: 0.7, bus: "music" },
};
const KEY = "racingwords.sound";

export function createSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain(); master.connect(ctx.destination);
  // chặn đỉnh nhẹ ở cuối ⇒ nhiều tiếng chồng nhau không rè
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  comp.connect(master);
  const pref = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } })();
  const bus = { fx: ctx.createGain(), music: ctx.createGain() };
  bus.fx.gain.value = pref.fx === false ? 0 : 1; bus.music.gain.value = pref.music === false ? 0 : 1;
  bus.fx.connect(comp); bus.music.connect(comp);
  const buf = {}, loops = {};
  let closed = false;
  const ramp = (p, v, t = 0.25) => { const n = ctx.currentTime; p.cancelScheduledValues(n); p.setValueAtTime(p.value, n); p.linearRampToValueAtTime(v, n + t); };

  async function load(names = Object.keys(SOUNDS)) {
    await Promise.all(names.map(async n => {
      const s = SOUNDS[n]; if (!s || buf[s.f] !== undefined) return;
      buf[s.f] = null;
      try { const r = await fetch(BASE + s.f + ".mp3"); if (!r.ok) return; buf[s.f] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { buf[s.f] = null; }
    }));
  }
  function unlock() { if (ctx.state === "suspended") ctx.resume(); }
  ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, unlock, { capture: true }));

  /** phát 1 lần: gain (nhân), rate (cao độ), pan (−1…1), delay (s) */
  function play(name, { gain = 1, rate = 1, pan = 0, delay = 0 } = {}) {
    const s = SOUNDS[name], b = s && buf[s.f]; if (!b || closed) return null;
    const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = s.v * gain;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(bus[s.bus || "fx"]); } else g.connect(bus[s.bus || "fx"]);
    src.start(ctx.currentTime + delay); return { src, g };
  }
  /** tiếng lặp có tên riêng (vd. "engine0"): bật/tắt trượt; đổi gain/rate mượt mỗi khung */
  function loop(id, on, { name = id, gain = 1, rate = 1, pan = 0, fade = 0.4 } = {}) {
    if (closed) return;
    let L = loops[id];
    if (on && !L) {
      const s = SOUNDS[name], b = s && buf[s.f]; if (!b) return;
      const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
      const g = ctx.createGain(); g.gain.value = 0;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      src.connect(g); if (p) { g.connect(p); p.connect(bus[s.bus || "fx"]); } else g.connect(bus[s.bus || "fx"]);
      src.loopStart = 0.03; src.loopEnd = b.duration - 0.03;                      // mp3 có đệm câm ở 2 đầu ⇒ lặp bỏ 30 ms mỗi mép (file đã ghép chéo đầu-cuối)
      src.start(0, 0.03 + Math.random() * Math.max(0, b.duration - 0.2)); L = loops[id] = { src, g, p, s };
      ramp(g.gain, s.v * gain, fade);
    }
    if (!L) return;
    if (!on) { ramp(L.g.gain, 0, fade); const src = L.src; setTimeout(() => { try { src.stop(); } catch (e) { /* */ } }, fade * 1000 + 50); delete loops[id]; return; }
    L.g.gain.setTargetAtTime(L.s.v * gain, ctx.currentTime, 0.08);
    L.src.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.08);
    if (L.p) L.p.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
  }
  function stopAll(fade = 0.5) { Object.keys(loops).forEach(id => loop(id, false, { fade })); }
  function setBus(k, on) { pref[k] = !!on; try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) { /* */ } ramp(bus[k].gain, on ? 1 : 0, 0.3); }
  return {
    ctx, load, play, loop, stopAll, setBus, get fxOn() { return pref.fx !== false; }, get musicOn() { return pref.music !== false; },
    pause(v) { if (closed) return; v ? ctx.suspend() : ctx.resume(); }, has: name => !!(SOUNDS[name] && buf[SOUNDS[name].f]),
    // 3o: tắt hẳn — gỡ listener mở khoá + đóng AudioContext (Safari giới hạn số AudioContext)
    close() { if (closed) return; closed = true; ["pointerdown", "keydown"].forEach(ev => window.removeEventListener(ev, unlock, { capture: true })); try { ctx.close(); } catch (e) { /* */ } },
  };
}
