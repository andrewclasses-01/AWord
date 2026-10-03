// TRAIN RUSH — ÂM THANH MẪU 1ah (30/9/2026): bỏ hết tiếng tự tổng hợp, dùng TIẾNG THU THẬT + NHẠC GIAO HƯỞNG.
// Thầy: "âm thanh thật, xịn, chuẩn điện ảnh cho mọi hiệu ứng và nhạc nền… toát lên không gian miền Tây hoang dã, hùng tráng".
//  • Hiệu ứng: Freesound, giấy phép CC0 (dùng tự do, không cần ghi tên) — nguồn từng file ở assets/sound-1ah/NGUON.md
//  • Nhạc: Pixabay (Pixabay Content License, dùng trong game miễn phí) — Sonican, bộ "Western Duel / Adventure" cùng một tác giả
//  • MỘT bộ máy chung cho cả trang: Fight 2 bàn dùng chung 1 AudioContext ⇒ nhạc, gió, tiếng tàu chỉ MỘT bản; tiếng 2 đội phát chung ở giữa.
//  • Vật ở xa: nhỏ dần, TRỄ theo tốc độ âm (343 m/s), đục dần (không khí nuốt tiếng cao), vang hẻm núi nhiều hơn.
//  • Nhạc phát bằng thẻ <audio> (vừa tải vừa phát) ⇒ không giải nén cả bài vào RAM.
// API cũ của bp3d-sound.js giữ nguyên (pop/correct/wrong/thud/bonus/whistle/chug/tick/levelUp/plane/win/timesUp/unlock/setMuted/muted)
// + thêm: train(v) · boom/whoosh/riser/cry · amb(on) · music(slot) · count(n) · hiss/brake · animal/steps/knock (con vật, chữ đổ).
const DIR = new URL("../assets/sound-1ah/", import.meta.url).href;

// tên → { f: các biến thể, vol, bus, rev (lượng vang), rate [thấp, cao] (đổi nhẹ mỗi lần cho khỏi nhàm), gap (giây tối thiểu giữa 2 lần) }
const BANK = {
  // --- đoàn tàu
  train:   { f: ["train-loop"], vol: 0.36, bus: "amb" },
  whistle: { f: ["whistle-1", "whistle-2"], vol: 0.75, rev: 0.45, gap: 0.8 },
  hiss:    { f: ["hiss-1", "hiss-2"], vol: 0.45, rev: 0.15, rate: [0.92, 1.06], gap: 0.5 },
  bell:    { f: ["bell"], vol: 0.55, rev: 0.3, gap: 1 },
  brake:   { f: ["brake"], vol: 0.55, rev: 0.25, gap: 1 },
  // --- trận đấu
  pop:     { f: ["pop-1", "pop-2", "pop-3"], vol: 0.8, rev: 0.18, rate: [0.9, 1.1], gap: 0.03 },
  crate:   { f: ["crate-1", "crate-2", "crate-3", "crate-4"], vol: 0.7, rev: 0.08, rate: [0.9, 1.08], gap: 0.06 },
  ding:    { f: ["ding"], vol: 0.55, rev: 0.3, rate: [0.99, 1.01], gap: 0.05 },
  cash:    { f: ["cash"], vol: 0.5, rev: 0.1, gap: 0.1 },
  coins:   { f: ["coins-1", "coins-2"], vol: 0.6, rev: 0.12, rate: [0.95, 1.05], gap: 0.1 },
  smash:   { f: ["smash-1", "smash-2"], vol: 0.5, rev: 0.15, rate: [0.92, 1.05], gap: 0.1 },
  coal:    { f: ["coal"], vol: 0.6, rev: 0.1, rate: [0.9, 1.1], gap: 0.2 },
  tick:    { f: ["tick"], vol: 0.8, rev: 0.05, gap: 0.3 },
  plane:   { f: ["plane"], vol: 0.6, rev: 0.25, gap: 3 },
  cheer:   { f: ["cheer"], vol: 0.6, rev: 0.2, gap: 2 },
  yeehaw:  { f: ["yeehaw"], vol: 0.55, rev: 0.25, gap: 2 },
  // --- điện ảnh (intro, đếm ngược)
  boom:    { f: ["boom-1", "boom-2", "boom-3"], vol: 0.85, rev: 0.35, gap: 0.2 },
  whoosh:  { f: ["whoosh-1", "whoosh-2", "whoosh-3"], vol: 0.5, rev: 0.2, rate: [0.9, 1.1], gap: 0.12 },
  riser:   { f: ["riser"], vol: 0.55, rev: 0.25, gap: 0.3 },
  timpani: { f: ["timpani"], vol: 0.9, rev: 0.4, gap: 0.2 },
  whip:    { f: ["whip"], vol: 0.8, rev: 0.4, gap: 0.2 },
  // --- thiên nhiên
  wind:    { f: ["wind-loop"], vol: 0.42, bus: "amb" },
  hawk:    { f: ["hawk-1", "hawk-2", "hawk-3"], vol: 0.4, rev: 0.55, rate: [0.95, 1.04], gap: 4 },
  // --- con vật (voice = tiếng kêu; steps = tiếng chân lặp)
  neigh:   { f: ["neigh-1", "neigh-2"], vol: 0.7, rev: 0.4, rate: [0.95, 1.05] },
  snort:   { f: ["snort"], vol: 0.6, rev: 0.3, rate: [0.95, 1.05] },
  moo:     { f: ["moo-1", "moo-2"], vol: 0.75, rev: 0.4, rate: [0.95, 1.05] },
  pig:     { f: ["pig"], vol: 0.6, rev: 0.3, rate: [0.95, 1.08] },
  trumpet: { f: ["elephant-1", "elephant-2"], vol: 0.8, rev: 0.45 },
  roar:    { f: ["roar-1", "roar-2"], vol: 0.85, rev: 0.45, rate: [0.95, 1.03] },
  camel:   { f: ["camel"], vol: 0.65, rev: 0.35 },
  hen:     { f: ["hen"], vol: 0.55, rev: 0.25, rate: [0.95, 1.1] },
  howl:    { f: ["howl"], vol: 0.6, rev: 0.55, rate: [0.97, 1.05] },
  bark:    { f: ["bark-1", "bark-2"], vol: 0.65, rev: 0.3, rate: [0.95, 1.08] },
  hooves:  { f: ["hooves-loop"], vol: 0.8, bus: "amb" },
  herd:    { f: ["herd-loop"], vol: 0.8, bus: "amb" },
  knock:   { f: ["knock-1", "knock-2"], vol: 0.9, rev: 0.5, rate: [0.92, 1.05], gap: 0.25 },
};
// nhạc (thẻ <audio>): menu = màn START · intro = phim mở màn · play = trong trận (nhỏ dưới hiệu ứng) · final = 30 s cuối · win = kết thúc
const MUSIC = {
  menu:  { f: "music-menu", loop: true, vol: 0.5 },
  intro: { f: "music-intro", loop: false, vol: 0.85 },
  play:  { f: "music-play", loop: true, vol: 0.3 },
  final: { f: "music-final", loop: true, vol: 0.42 },
  win:   { f: "music-win", loop: false, vol: 0.9 },
};
// con vật → tiếng kêu / tiếng chân (rate: đổi nhịp chân theo cỡ con)
const VOICE = { horse: "neigh", pronghorn: "snort", cow: "moo", pig: "pig", elephant: "trumpet", camel: "camel", lion: "roar", lioness: "roar",
  wolf: "howl", coyote: "howl", dog: "bark", chicken: "hen", eagleRun: "hawk", kangaroo: "snort" };
const FEET = { horse: ["hooves", 1, 1], pronghorn: ["hooves", 1.15, 0.7], cow: ["herd", 0.9, 0.9], pig: ["hooves", 1.3, 0.45], elephant: ["herd", 0.62, 1.2],
  camel: ["hooves", 0.8, 0.8], lion: ["hooves", 1.2, 0.35], lioness: ["hooves", 1.25, 0.32], wolf: ["hooves", 1.35, 0.25], coyote: ["hooves", 1.35, 0.25],
  dog: ["hooves", 1.45, 0.22], kangaroo: ["hooves", 0.7, 0.4], chicken: null, eagleRun: null };

const EXT = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? ".ogg" : ".mp3"; } catch (e) { return ".ogg"; } })();
let E = null;

function makeIR(ac) {   // vang hẻm núi: đuôi 2,6 s + 2 tiếng dội sớm từ vách đá (0,19 s và 0,41 s)
  const sr = ac.sampleRate, len = Math.floor(sr * 2.6), ir = ac.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) { const t = i / sr; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / 2.6, 3.2) * 0.55; }
    for (const [at, a] of [[0.19 + ch * 0.013, 0.5], [0.41 - ch * 0.02, 0.32], [0.63, 0.18]]) {
      const s = Math.floor(at * sr); for (let k = 0; k < 600; k++) d[s + k] += (Math.random() * 2 - 1) * a * (1 - k / 600);
    }
  }
  return ir;
}

function engine() {
  if (E) return E;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ac = new AC({ latencyHint: "interactive" });
  const master = ac.createGain(); master.gain.value = 0.95;
  const comp = ac.createDynamicsCompressor();   // chặn đỉnh: nhiều tiếng dồn cùng lúc không vỡ loa
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.22;
  master.connect(comp).connect(ac.destination);
  const bus = {};
  for (const k of ["sfx", "amb", "mus"]) { bus[k] = ac.createGain(); bus[k].connect(master); }
  const rev = ac.createConvolver(); rev.buffer = makeIR(ac);
  const revIn = ac.createGain(); revIn.gain.value = 0.45;
  const revLP = ac.createBiquadFilter(); revLP.type = "lowpass"; revLP.frequency.value = 5200;
  revIn.connect(revLP).connect(rev).connect(master);
  E = { ac, master, bus, revIn, bufs: new Map(), last: {}, lastIdx: {}, muted: false, loops: new Map(), trains: new Map(), mus: null, musSlot: null,
    hawkT: null, ambOn: false, ready: null, pending: null };
  window.__sndE = E;   // bàn thử: đo tiếng thật sự ra loa (AnalyserNode)
  // nạp mọi hiệu ứng (ngắn, mono) — nhạc KHÔNG nạp (phát bằng thẻ <audio>)
  const files = new Set(); for (const k in BANK) BANK[k].f.forEach(n => files.add(n));
  E.ready = Promise.all([...files].map(async n => {
    try { const r = await fetch(DIR + n + EXT); if (!r.ok) throw new Error(r.status); E.bufs.set(n, await ac.decodeAudioData(await r.arrayBuffer())); }
    catch (e) { console.warn("[sound-1ah] thiếu", n + EXT, e.message); }
  }));
  // trình duyệt chặn tiếng tới khi người dùng chạm lần đầu ⇒ chạm là mở
  const wake = () => { if (ac.state !== "running") ac.resume(); if (E.pending) { const p = E.pending; E.pending = null; musicTo(p.slot, p.fade); } };
  ["pointerdown", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, wake, { capture: true, passive: true }));
  return E;
}

const rnd = (a, b) => a + Math.random() * (b - a);
function play(name, o = {}) {
  const e = E; if (!e || e.muted) return null;
  const B = BANK[name]; if (!B) return null;
  const now = e.ac.currentTime;
  if (B.gap && !o.force && now - (e.last[name] ?? -99) < B.gap) return null;
  const pool = B.f.map(n => e.bufs.get(n)).filter(Boolean); if (!pool.length) return null;
  e.last[name] = now;
  let i = Math.floor(Math.random() * pool.length); if (pool.length > 1 && i === e.lastIdx[name]) i = (i + 1) % pool.length; e.lastIdx[name] = i;
  const src = e.ac.createBufferSource(); src.buffer = pool[i];
  src.playbackRate.value = o.rate ?? (B.rate ? rnd(B.rate[0], B.rate[1]) : 1);
  const g = e.ac.createGain(); g.gain.value = (B.vol ?? 1) * (o.vol ?? 1);
  let node = src;
  if (o.lp && o.lp < 16000) { const f = e.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; node.connect(f); node = f; }
  node.connect(g); g.connect(e.bus[o.bus || B.bus || "sfx"]);
  const rv = o.rev ?? B.rev ?? 0;
  if (rv > 0) { const s = e.ac.createGain(); s.gain.value = rv; g.connect(s); s.connect(e.revIn); }
  const t0 = now + (o.delay || 0);
  src.start(t0, o.offset || 0);
  if (o.fadeIn) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime((B.vol ?? 1) * (o.vol ?? 1), t0 + o.fadeIn); }
  return { src, g };
}
// âm ở khoảng cách d (m): nhỏ dần + trễ theo tốc độ âm + đục dần + vang nhiều hơn
function farOpts(d, ref = 22) {
  d = Math.max(1, d);
  return { vol: Math.min(1, Math.pow(ref / d, 1.3)), delay: d > 25 ? Math.min(0.25, d / 343) : 0,   // trễ tối đa 0,25 s (thật hơn nhưng không lệch hình)
    lp: Math.max(1800, 17000 * Math.exp(-d / 170)), rev: Math.min(0.9, 0.25 + d / 260) };
}
// tiếng lặp (tàu, gió, vó ngựa): gọi liên tục để giữ; ngừng gọi quá `hold` giây ⇒ tự nhỏ dần rồi tắt
function loopSet(key, name, vol, rate = 1, o = {}) {
  const e = E; if (!e) return;
  let L = e.loops.get(key);
  const now = e.ac.currentTime;
  if (!L) {
    if (key.startsWith("feet:") && [...e.loops.keys()].filter(k => k.startsWith("feet:")).length >= 3) return;   // tối đa 3 tiếng chân cùng lúc (Fight: 2 bàn cùng có thú)
    const buf = e.bufs.get(BANK[name].f[0]); if (!buf) return;
    const src = e.ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = e.ac.createGain(); g.gain.value = 0.0001;
    const f = e.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000;
    src.connect(f).connect(g).connect(e.bus[BANK[name].bus || "amb"]);
    let send = null; if (o.rev) { send = e.ac.createGain(); send.gain.value = o.rev; g.connect(send); send.connect(e.revIn); }
    src.start(now, Math.random() * buf.duration * 0.9);
    L = { src, g, f, send, name, hold: o.hold ?? 0.5 };
    e.loops.set(key, L);
  }
  L.seen = now; L.hold = o.hold ?? L.hold;
  const want = Math.max(0.0001, (BANK[name].vol ?? 1) * vol);
  L.g.gain.setTargetAtTime(want, now, o.tc ?? 0.12);
  L.src.playbackRate.setTargetAtTime(rate, now, 0.25);
  if (o.lp) L.f.frequency.setTargetAtTime(o.lp, now, 0.2);
  if (o.rev != null && L.send) L.send.gain.setTargetAtTime(o.rev, now, 0.2);
}
function loopReap() {   // tắt tiếng lặp không còn được giữ
  const e = E; if (!e) return; const now = e.ac.currentTime;
  for (const [k, L] of e.loops) {
    if (now - L.seen > L.hold && !L.dying) { L.dying = true; L.g.gain.setTargetAtTime(0.0001, now, 0.35); L.src.stop(now + 2); e.loops.delete(k); }
  }
}
setInterval(loopReap, 150);

// ---------------------------------------------------------------- nhạc
function musicTo(slot, fade = 1.6) {
  const e = E; if (!e) return;
  if (e.musSlot === slot && e.mus) return;
  const old = e.mus, t = e.ac.currentTime;
  if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + fade); setTimeout(() => { old.el.pause(); old.el.src = ""; old.node.disconnect(); }, fade * 1000 + 200); }
  e.mus = null; e.musSlot = slot;
  if (!slot) return;
  const M = MUSIC[slot];
  const el = new Audio(); el.crossOrigin = "anonymous"; el.preload = "auto"; el.loop = M.loop; el.src = DIR + M.f + EXT;
  const node = e.ac.createMediaElementSource(el), g = e.ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(M.vol, t + (slot === "win" || slot === "intro" ? 0.05 : fade));
  node.connect(g).connect(e.bus.mus);
  const cur = { el, node, g, slot };
  e.mus = cur;
  if (slot === "win") el.onended = () => { if (e.mus === cur) musicTo("menu", 4); };   // nhạc thắng hết ⇒ về nhạc chờ
  el.play().catch(() => { if (e.mus === cur) { e.mus = null; e.musSlot = null; e.pending = { slot, fade }; } });   // bị chặn tới lần chạm đầu
}
// hạ nhạc xuống một lúc (tiếng lớn: thắng, đếm ngược)
function duck(to = 0.35, back = 1.5) {
  const e = E; if (!e) return; const t = e.ac.currentTime, g = e.bus.mus.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + 0.08); g.linearRampToValueAtTime(1, t + 0.08 + back);
}

// ---------------------------------------------------------------- gió + chim ưng xa
function ambient(on) {
  const e = E; if (!e) return;
  e.ambOn = on;
  clearTimeout(e.hawkT);
  if (!on) return;
  const keep = () => { if (!e.ambOn) return; loopSet("wind", "wind", 1, 1, { hold: 1.2, tc: 0.8 }); e.windT = setTimeout(keep, 400); };
  clearTimeout(e.windT); keep();
  const hawk = () => { if (!e.ambOn) return; const d = rnd(90, 260); play("hawk", farOpts(d, 45)); e.hawkT = setTimeout(hawk, rnd(16, 34) * 1000); };
  e.hawkT = setTimeout(hawk, rnd(5, 12) * 1000);
}

// ---------------------------------------------------------------- tàu: một vòng lặp chung, theo tốc độ đoàn nhanh nhất
const CHUFF_REC = 5.6;   // số nhát "xình" mỗi giây trong bản thu train-loop (đo tự tương quan: chu kỳ 0,72 s = 4 nhát)
function trainTick() {
  const e = E; if (!e) return; const now = e.ac.currentTime;
  let v = 0; for (const [k, T] of e.trains) { if (now - T.t > 0.6) e.trains.delete(k); else v = Math.max(v, T.v); }
  if (v < 0.15) { if (e.trainOn) { e.trainOn = false; play("hiss", { vol: 0.8 }); } return; }
  e.trainOn = true;
  const chuffs = (v + 0.6) / 0.9;                             // cùng nhịp phả khói của lõi (S.chugT = 0.9 / (v + 0.6))
  const rate = Math.max(0.72, Math.min(1.35, chuffs / CHUFF_REC));
  loopSet("train", "train", 0.55 + 0.45 * Math.min(1, v / 8), rate, { hold: 0.7, tc: 0.25 });
}
setInterval(trainTick, 120);

let FID = 0;
export function createBpSound() {
  const e = engine();
  const id = ++FID;
  let muted = false;
  const ok = () => E && !muted && !E.muted;
  const api = {
    get muted() { return muted; },
    unlock() { if (E && E.ac.state !== "running") E.ac.resume(); return true; },
    setMuted(m) { muted = m; if (E) { E.muted = m; E.master.gain.setTargetAtTime(m ? 0 : 0.95, E.ac.currentTime, 0.05); } },
    ready: () => (E ? E.ready : Promise.resolve()),
    // --- lõi trận đấu (tên cũ)
    pop()     { if (ok()) play("pop"); },
    correct() { if (!ok()) return; play("crate", { vol: 1.1 }); play("ding", { delay: 0.05 }); play("cash", { delay: 0.12, vol: 0.55 }); },
    wrong()   { if (!ok()) return; play("smash"); play("crate", { rate: 0.8, vol: 0.6 }); },
    thud()    { if (ok()) play("crate", { vol: 0.75 }); },
    bump()    { if (ok()) play("crate", { rate: 0.55, vol: 0.28, lp: 900, force: true }); },   // 2 khinh khí cầu cọ nhau: tiếng bịch vải mềm
    coalHit() { if (ok()) play("coal"); },
    bonus()   { if (!ok()) return; play("coins"); play("cash", { delay: 0.18 }); },
    whistle() { if (ok()) play("whistle"); },
    chug(v)   { api.train(v); },
    train(v)  { if (E) E.trains.set(id, { v: v || 0, t: E.ac.currentTime }); },
    tick()    { if (ok()) play("tick"); },
    levelUp() { if (!ok()) return; play("bell"); play("cheer", { vol: 0.45, delay: 0.25 }); },
    plane()   { if (ok()) play("plane"); },
    win()     { if (!ok()) return; musicTo("win", 0.4); play("cheer", { delay: 0.3 }); play("yeehaw", { delay: 0.9 }); play("whistle", { delay: 1.6, force: true }); },
    timesUp() { if (!ok()) return; musicTo(null, 1.2); play("brake"); play("hiss", { delay: 1.1 }); play("bell", { delay: 0.4, vol: 0.7 }); },
    hiss()    { if (ok()) play("hiss"); },
    brake()   { if (ok()) play("brake"); },
    // --- điện ảnh
    boom(p = 0.85) { if (ok()) { play("boom", { vol: Math.min(1.2, p / 0.85) }); duck(0.55, 1.2); } },
    whoosh(dur = 0.9, peak = 0.35) { if (ok()) play("whoosh", { vol: Math.min(1.3, peak / 0.35), rate: Math.max(0.7, Math.min(1.3, 0.9 / dur)) }); },
    riser(dur = 1) { if (ok()) play("riser", { offset: Math.max(0, (E.bufs.get("riser")?.duration || dur) - dur - 0.05) }); },
    cry(d = 120) { if (ok()) play("hawk", farOpts(d, 60)); },
    count(n) {   // đếm ngược 3-2-1-GO
      if (!ok()) return;
      if (n > 0) { play("timpani", { rate: [0, 1.12, 1.0, 0.9][n] || 1, force: true }); duck(0.5, 0.6); }
      else { play("whip", { force: true }); play("boom", { vol: 0.7, force: true }); play("whistle", { delay: 0.15, force: true }); }
    },
    amb(on = true) { ambient(on); },
    hold(p) {   // tạm dừng trận: im hẳn (cả nhạc) · chơi tiếp: phát lại đúng chỗ
      if (!E) return;
      if (p) { E.ac.suspend(); if (E.mus) E.mus.el.pause(); }
      else { E.ac.resume(); if (E.mus) E.mus.el.play().catch(() => {}); }
    },
    music(slot, fade) { musicTo(slot, fade); },
    duck,
    // --- con vật / chữ đổ (d = khoảng cách tới máy quay, m)
    animal(kind, d) { if (!ok()) return; const v = VOICE[kind]; if (v) play(v, farOpts(d, 22)); },
    steps(key, kind, d, speed) {
      if (!ok()) return; const F = FEET[kind]; if (!F) return;
      const o = farOpts(d, 26), run = Math.min(1, speed / 9);
      loopSet("feet:" + key, F[0], F[2] * o.vol * (0.35 + 0.65 * run), F[1] * (0.8 + 0.35 * run), { hold: 0.35, lp: o.lp, rev: o.rev * 0.6 });
    },
    knock(d) {   // con vật húc: gỗ gãy ngay · 0,75 s sau chữ nặng đập xuống cát
      if (!ok()) return; const o = farOpts(d, 60);
      play("knock", o);
      play("crate", { ...o, rate: 0.5, vol: o.vol * 1.4, delay: o.delay + 0.75, force: true });
      play("coal", { ...o, rate: 0.7, delay: o.delay + 0.8, force: true });
    },
  };
  return api;
}
