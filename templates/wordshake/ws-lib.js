// =============================================================
// WORDSHAKE — shared library for the fixed GAME (games/wordshake) and the
// activity TEMPLATE (templates/wordshake). Đợt 386, 25/9/2026.
// Design approved in 4 rounds: D:\OTHERS\CLAUDE\AWord - thiet ke Wordshake\
// wordshake-v1…v4.html (structure = v2, neon skin + HUD strip + sound = v4).
//
//   loadDict()          -> Promise<Map>  word -> { lv, m, base }
//   lookup(dict, w)     -> { m, base, lv } | null   (3–7 letters only)
//   points(len)         -> 3→1 · 4→2 · 5→3 · 6→4 · 7→5
//   rollBoard(dict)     -> 16 upper-case letters from 16 Boggle dice
//   wordsOn(dict, letters, maxLv) -> every dictionary word the board can make
//   canMake(word, letters)
//   createSfx()         -> synthesised sound effects (Web Audio, no files)
//
// The dictionary (ws-dict.txt) is built from ALL ENGLISH WORDS.xlsx: A1→C2,
// 3–7 letters, no -ing/-ed forms (thầy, 25/9/2026), meanings = short common
// Vietnamese, several senses joined by " / ". One line per word:
//   word \t level(1..6) \t meaning        headword
//   word \t level(1..6) \t =base          inflected form, shows the base's meaning
// =============================================================

export const MIN_LEN = 3, MAX_LEN = 7;
export const points = n => Math.max(1, Math.min(5, n - 2));

let dictPromise = null;
export function loadDict() {
  if (dictPromise) return dictPromise;
  const url = new URL("./ws-dict.txt", import.meta.url).href;
  dictPromise = fetch(url).then(r => {
    if (!r.ok) throw new Error("ws-dict.txt " + r.status);
    return r.text();
  }).then(parseDict).catch(e => { dictPromise = null; throw e; });
  return dictPromise;
}
export function parseDict(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const a = line.indexOf("\t"), b = line.indexOf("\t", a + 1);
    if (a < 0 || b < 0) continue;
    const w = line.slice(0, a), lv = +line.slice(a + 1, b), rest = line.slice(b + 1).replace(/\r$/, "");
    if (rest.startsWith("=")) map.set(w, { lv, m: "", base: rest.slice(1) });
    else map.set(w, { lv, m: rest, base: null });
  }
  return map;
}
export function lookup(dict, w) {
  w = String(w || "").toLowerCase();
  if (w.length < MIN_LEN || w.length > MAX_LEN || !dict) return null;
  const e = dict.get(w);
  if (!e) return null;
  if (e.base) {
    const b = dict.get(e.base);
    return { m: b ? b.m : "", base: e.base, lv: e.lv };
  }
  return { m: e.m, base: null, lv: e.lv };
}

export function countOf(s) { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; }
export function canMake(word, letters) {
  const bag = countOf(letters.join ? letters.join("").toLowerCase() : String(letters).toLowerCase());
  const m = {};
  for (const c of word) { m[c] = (m[c] || 0) + 1; if (m[c] > (bag[c] || 0)) return false; }
  return true;
}
export function wordsOn(dict, letters, maxLv = 6) {
  const bag = countOf(letters.join("").toLowerCase());
  const out = [];
  for (const [w, e] of dict) {
    if (e.lv > maxLv) continue;
    let ok = true; const m = {};
    for (const c of w) { m[c] = (m[c] || 0) + 1; if (m[c] > (bag[c] || 0)) { ok = false; break; } }
    if (ok) out.push(w);
  }
  return out;
}

// The 16 dice of the original game (British Council Wordshake, read 25/9/2026).
const DICE = ["OSNDWE", "RUWLGI", "AAIOTC", "MCEDPA", "HSRAOM", "SEUTLP", "ABILYT", "EIYEHF",
              "DOKNUT", "ELGKUY", "NTGVEI", "IFORXB", "SEARLC", "PNHSEI", "VENDZA", "OMBAJQ"];
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
const VOWELS = "AEIOU";
// Roll until the board is worth playing: 4–7 vowels, no Q (a lone Q is dead
// weight without U), and — once the dictionary is known — at least `minWords`
// everyday words (A1–B2) on it. 40 tries is plenty (measured: most rolls pass).
// Đợt 387 — `easy` (thầy: "ưu tiên bộ chữ dễ … tránh bế tắc"): roll 60 boards
// with 5–7 vowels and keep the one with the MOST A1–A2 words. Measured over
// 100 boards: 109 → ~250 A1–A2 words a board, ~13 ms a board.
// ⭐ Đợt 390 (thầy: "các lượt play again trùng nhau quá") — "the MOST A1–A2 words"
// always drifts to the same common letters: measured, two easy boards in a row
// shared 10.1 of 16 letters (up to 13) vs 7.6 for plain rolls. Now every board with
// ≥ 55 % of the best one's easy words is a candidate, and the one sharing the FEWEST
// letters with `recent` (the last boards played, newest first) wins. Measured over
// 150 boards in a row: 10.1 → 7.8 shared letters, 19 % → 8 % shared easy words, still
// ~174 A1–A2 words a board (plain rolls 109). The GAME keeps `recent` in localStorage.
export function overlapOf(a, b) {
  const m = countOf(a.join("")); let n = 0;
  for (const c of b) if (m[c] > 0) { m[c]--; n++; }
  return n;
}
export function rollBoard(dict, { minWords = 45, tries = 40, easy = false, recent = [], pool: poolPct = .55 } = {}) {
  let best = null, bestN = -1;
  if (easy) tries = 60;
  const cands = [];
  for (let t = 0; t < tries; t++) {
    const letters = shuffle(DICE).map(d => d[Math.random() * 6 | 0]);
    const v = letters.filter(c => VOWELS.includes(c)).length;
    if (v < (easy ? 5 : 4) || v > 7 || letters.includes("Q")) continue;
    if (!dict) return letters;
    const n = wordsOn(dict, letters, easy ? 2 : 4).length;
    if (!easy && n >= minWords) return letters;
    cands.push({ letters, n });
    if (n > bestN) { best = letters; bestN = n; }
  }
  if (!easy || !cands.length) return best || "AEEIOSTRNLPCDMHU".split("");
  const pool = cands.filter(c => c.n >= bestN * poolPct);
  // the board the class JUST saw counts double
  const likeness = c => recent.slice(0, 8).reduce((s, r, i) => s + overlapOf(r, c.letters) * (i === 0 ? 2 : 1), 0);
  pool.forEach(c => { c.like = likeness(c) + Math.random() * .5; });
  pool.sort((a, b) => a.like - b.like);
  return pool[0].letters;
}

// ---------------------------------------------------------------
// Sound — synthesised with Web Audio, nothing to download. In a fight the
// left team's sounds pan left and the right team's pan right, so in a noisy
// classroom you can hear which side just scored.
// ---------------------------------------------------------------
export function createSfx() {
  let ctx = null, on = true;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function out(c, pan) {
    const g = c.createGain(); g.gain.value = .9;
    if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(c.destination); }
    else g.connect(c.destination);
    return g;
  }
  function tone(f, dur, o = {}) {
    const c = on && ac(); if (!c) return;
    const t = c.currentTime + (o.at || 0);
    const os = c.createOscillator(), g = c.createGain();
    os.type = o.type || "square"; os.frequency.setValueAtTime(f, t);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .06, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g).connect(out(c, o.pan)); os.start(t); os.stop(t + dur + .03);
  }
  function noise(dur, o = {}) {
    const c = on && ac(); if (!c) return;
    const t = c.currentTime + (o.at || 0), n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = o.freq || 2500; bp.Q.value = 1.2;
    const g = c.createGain(); g.gain.value = o.vol || .08;
    src.connect(bp).connect(g).connect(out(c, o.pan)); src.start(t);
  }
  const P = p => p || 0;
  return {
    get on() { return on; },
    set on(v) { on = !!v; if (on) ac(); },
    unlock() { ac(); },
    tap: (pan) => tone(pan > 0 ? 980 : 880, .055, { vol: .045, pan: P(pan) }),
    untap: (pan) => tone(520, .06, { vol: .04, pan: P(pan), slide: 420 }),
    clear: (pan) => tone(420, .14, { type: "triangle", vol: .06, pan: P(pan), slide: 160 }),
    ok(pan, pts = 1) {
      const base = pan > 0 ? 587 : 523, steps = [0, 4, 7, 12, 16, 19].slice(0, Math.min(6, 2 + pts));
      steps.forEach((k, i) => tone(base * Math.pow(2, k / 12), .13, { type: "triangle", vol: .1, at: i * .06, pan: P(pan) }));
      noise(.12, { vol: .04, at: steps.length * .06, freq: 6000, pan: P(pan) });
    },
    bad(pan) { tone(196, .28, { type: "sawtooth", vol: .06, slide: 98, pan: P(pan) }); noise(.2, { vol: .05, freq: 400, pan: P(pan) }); },
    dup(pan) { tone(784, .07, { vol: .05, pan: P(pan) }); tone(622, .1, { vol: .05, at: .1, pan: P(pan) }); },
    shake() { for (let i = 0; i < 12; i++) noise(.045, { at: i * .055, vol: .06, freq: 1200 + Math.random() * 3000 }); },
    tick: () => tone(1320, .035, { vol: .05 }),
    // Đợt 387 (thầy: "10 giây cuối có chuông dồn dập") — call once per second
    // with the seconds left (10…1): 2 bell strikes a second from 10 to 6, 4 a
    // second from 5 to 1, pitch climbing as time runs out. Scheduled on the
    // audio clock (`at`), so the strikes stay evenly spaced inside the second.
    countdown(left) {
      if (!(left > 0 && left <= 10)) return;
      const n = left > 5 ? 2 : 4, f = 1320 * Math.pow(2, (10 - left) / 18);
      for (let i = 0; i < n; i++) {
        const at = i / n;
        tone(f, .22, { type: "sine", vol: .09, at });
        tone(f * 2.76, .12, { type: "sine", vol: .03, at });   // the metallic overtone of a bell
      }
    },
    next() { tone(660, .07, { type: "triangle", vol: .06 }); tone(990, .1, { type: "triangle", vol: .06, at: .07 }); },
    timeup() { tone(440, .35, { type: "sawtooth", vol: .07 }); tone(330, .6, { type: "sawtooth", vol: .07, at: .3 }); },
    win(pan) {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, { type: "triangle", vol: .1, at: .4 + i * .11, pan: P(pan) }));
      tone(1047, .55, { type: "square", vol: .05, at: .85, pan: P(pan) }); tone(1319, .55, { type: "triangle", vol: .07, at: .85, pan: P(pan) });
    },
    // Đợt 390 — the score tank: a point lands in the water · one drip per counted
    // point while it drains (pitch climbs with the count) · the number lands.
    splash(pan) { noise(.16, { vol: .05, freq: 900, pan: P(pan) }); tone(380, .14, { type: "sine", vol: .06, slide: 950, pan: P(pan) }); },
    drip(i) { tone(620 + Math.min(i, 80) * 12, .05, { type: "sine", vol: .05 }); },
    land() { tone(1047, .3, { type: "triangle", vol: .09 }); tone(1568, .42, { type: "triangle", vol: .06, at: .08 }); },
    dispose() { try { ctx && ctx.close(); } catch (e) {} ctx = null; }
  };
}

// ---------------------------------------------------------------
// ⭐ Đợt 390 (thầy, 25/9/2026) — SCORE TANK. While a game runs a score box shows no
// number, only a sparkling tank of water; a point FLIES in (`flyPoint`) and the water
// sloshes and rises a little (`hit`). When time is up the tank DRAINS while its number
// counts up from 0 (`drain`) — the class holds its breath until the last drop.
// Used by the GAME (always) and the template (Options ▸ Score tank). Self-contained:
// its CSS is injected once, so it looks the same wherever it is dropped.
//   createTank({ side, k, cls }) -> { el, hit(score), set(score), drain(final, ms, onStep), stop(), level }
//   flyPoint(fromEl, toEl, text, side) -> Promise (resolves when it lands)
// `k` = how fast the water rises: level = 14 % + 74 % · (1 − e^(−score/k)), so it
// never shows who leads by much and never overflows.
// ---------------------------------------------------------------
const WAVE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 8'%3E%3Cpath d='M0 5 Q6 0 12 5 T24 5 V8 H0Z'/%3E%3C/svg%3E\")";
const TANK_CSS = `
.wst{position:absolute;inset:3px;overflow:hidden;border-radius:3px;pointer-events:none;z-index:0;--wc1:#6BFFA8;--wc2:#118A4C;--wglow:rgba(61,245,138,.55)}
.wst.wst-s1{--wc1:#8AE9FF;--wc2:#10658F;--wglow:rgba(55,215,255,.55)}
.wst-water{position:absolute;left:-12%;right:-12%;bottom:0;height:14%;transform-origin:50% 100%;
  background:linear-gradient(180deg,var(--wc1),var(--wc2));opacity:.82;box-shadow:inset 0 0 14px var(--wglow);
  transition:height .75s cubic-bezier(.3,1.45,.5,1)}
.wst.is-draining .wst-water{transition:none}
.wst-wv{position:absolute;left:0;width:200%;height:7px;top:-6px;background:var(--wc1);
  -webkit-mask:${WAVE} repeat-x 0 0/24px 7px;mask:${WAVE} repeat-x 0 0/24px 7px;animation:wst-flow 1.7s linear infinite}
.wst-wv.b{top:-4px;opacity:.55;animation-duration:2.6s;animation-direction:reverse}
@keyframes wst-flow{from{transform:translateX(0)}to{transform:translateX(-24px)}}
.wst-bb{position:absolute;bottom:0;width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 4px #fff;opacity:0;animation:wst-rise 2.4s ease-in infinite}
.wst-bb:nth-child(3){left:22%;animation-delay:.3s}.wst-bb:nth-child(4){left:48%;animation-delay:1.2s;width:2px;height:2px}
.wst-bb:nth-child(5){left:70%;animation-delay:.8s}.wst-bb:nth-child(6){left:85%;animation-delay:1.9s;width:2px;height:2px}
@keyframes wst-rise{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-300%);opacity:0}}
.wst::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.38) 50%,transparent 62%);
  transform:translateX(-130%);animation:wst-glint 3.2s ease-in-out infinite}
@keyframes wst-glint{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
.wst.is-slosh .wst-water{animation:wst-slosh 1s cubic-bezier(.3,.6,.4,1)}
.wst.is-slosh .wst-wv{animation-duration:.45s}
@keyframes wst-slosh{0%{transform:rotate(0)}15%{transform:rotate(-8deg) scaleY(1.12)}35%{transform:rotate(6deg)}55%{transform:rotate(-3.5deg)}75%{transform:rotate(1.5deg)}100%{transform:rotate(0)}}
.wst-num{position:absolute;inset:0;display:grid;place-items:center;font:inherit;line-height:1;color:#fff;opacity:0;z-index:2;
  text-shadow:0 0 10px var(--wglow),0 0 2px #000;font-variant-numeric:tabular-nums}
.wst.is-count .wst-num{opacity:1}
.wst.is-count::after{animation:none;opacity:0}
.wst-num.is-land{animation:wst-land .5s cubic-bezier(.22,.9,.3,1)}
@keyframes wst-land{0%{scale:1}35%{scale:1.45}100%{scale:1}}
.wst-fly{position:fixed;z-index:9999;pointer-events:none;left:0;top:0;font:italic 800 22px/1 "Saira",sans-serif;color:#03150C;
  padding:4px 9px;border-radius:4px;background:#3DF58A;box-shadow:0 0 18px rgba(61,245,138,.9)}
.wst-fly.s1{background:#37D7FF;box-shadow:0 0 18px rgba(55,215,255,.9)}
@media (prefers-reduced-motion:reduce){.wst *,.wst::after{animation:none!important}}
`;
function ensureTankCss() {
  if (typeof document === "undefined" || document.getElementById("ws-tank-css")) return;
  const st = document.createElement("style"); st.id = "ws-tank-css"; st.textContent = TANK_CSS;
  document.head.append(st);
}
export function tankLevel(score, k = 10) { return .14 + .74 * (1 - Math.exp(-Math.max(0, score) / k)); }
export function createTank({ side = 0, k = 10, cls = "" } = {}) {
  ensureTankCss();
  const el = document.createElement("div");
  el.className = `wst wst-s${side ? 1 : 0} ${cls}`.trim();
  el.innerHTML = `<div class="wst-water"><i class="wst-wv a"></i><i class="wst-wv b"></i></div><i class="wst-bb"></i><i class="wst-bb"></i><i class="wst-bb"></i><i class="wst-bb"></i><span class="wst-num"></span>`;
  const water = el.firstChild, num = el.querySelector(".wst-num");
  let lv = tankLevel(0, k), iv = null, slosh = null;
  const paint = v => { lv = v; water.style.height = (v * 100).toFixed(1) + "%"; };
  paint(lv);
  const T = {
    el,
    get level() { return lv; },
    /** a point just landed: slosh, and rise to the new score's level */
    hit(score) {
      paint(tankLevel(score, k));
      el.classList.remove("is-slosh"); void el.offsetWidth; el.classList.add("is-slosh");
      clearTimeout(slosh); slosh = setTimeout(() => el.classList.remove("is-slosh"), 1050);
    },
    set(score) { paint(tankLevel(score, k)); },
    /** drain to empty over `ms` while the number counts 0 → final; onStep(n) per new number */
    drain(final, ms, onStep) {
      T.stop();
      final = Math.round(Number(final) || 0);
      el.classList.add("is-count", "is-draining");
      num.textContent = "0";
      const from = lv, t0 = performance.now(), dur = Math.max(300, ms);
      let shown = 0;
      return new Promise(res => {
        const end = () => { clearInterval(iv); iv = null; el.classList.remove("is-draining"); paint(0); num.textContent = String(final); num.classList.add("is-land"); res(final); };
        if (final <= 0) { num.textContent = String(final); return setTimeout(end, 300); }
        // setInterval, not rAF: a hidden pane freezes rAF and the class would wait forever
        iv = setInterval(() => {
          const t = Math.min(1, (performance.now() - t0) / dur);
          const e = 1 - Math.pow(1 - t, 2.2);          // slows down near the end — the suspense
          paint(from * (1 - e));
          const n = Math.min(final, Math.floor(final * e + 1e-6));
          if (n !== shown) { shown = n; num.textContent = String(n); if (onStep) onStep(n); }
          if (t >= 1) end();
        }, 30);
      });
    },
    stop() { if (iv) { clearInterval(iv); iv = null; } el.classList.remove("is-draining"); },
    reset(score = 0) { T.stop(); el.classList.remove("is-count"); num.classList.remove("is-land"); paint(tankLevel(score, k)); },
    destroy() { T.stop(); clearTimeout(slosh); el.remove(); }
  };
  return T;
}
export function flyPoint(fromEl, toEl, text, side = 0) {
  ensureTankCss();
  return new Promise(res => {
    if (!fromEl || !toEl || !fromEl.isConnected || !toEl.isConnected) return res();
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "wst-fly" + (side ? " s1" : ""); f.textContent = text;
    document.body.append(f);
    const w = f.offsetWidth, h = f.offsetHeight;
    const x0 = a.left + a.width / 2 - w / 2, y0 = a.top + a.height / 2 - h / 2;
    const x1 = b.left + b.width / 2 - w / 2, y1 = b.top + b.height / 2 - h / 2;
    let done = false;
    const fin = () => { if (done) return; done = true; f.remove(); res(); };
    const an = f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${x0}px,${y0 - 30}px) scale(1.15)`, opacity: 1, offset: .2 },
      { transform: `translate(${x1}px,${y1}px) scale(.45)`, opacity: .9 }
    ], { duration: 620, easing: "cubic-bezier(.5,0,.4,1)", fill: "forwards" });
    an.onfinish = fin; setTimeout(fin, 800);   // a hidden tab may never finish the animation
  });
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
