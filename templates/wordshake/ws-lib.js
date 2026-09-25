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
export function rollBoard(dict, { minWords = 45, tries = 40 } = {}) {
  let best = null, bestN = -1;
  for (let t = 0; t < tries; t++) {
    const letters = shuffle(DICE).map(d => d[Math.random() * 6 | 0]);
    const v = letters.filter(c => VOWELS.includes(c)).length;
    if (v < 4 || v > 7 || letters.includes("Q")) continue;
    if (!dict) return letters;
    const n = wordsOn(dict, letters, 4).length;
    if (n >= minWords) return letters;
    if (n > bestN) { best = letters; bestN = n; }
  }
  return best || "AEEIOSTRNLPCDMHU".split("");
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
    next() { tone(660, .07, { type: "triangle", vol: .06 }); tone(990, .1, { type: "triangle", vol: .06, at: .07 }); },
    timeup() { tone(440, .35, { type: "sawtooth", vol: .07 }); tone(330, .6, { type: "sawtooth", vol: .07, at: .3 }); },
    win(pan) {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, { type: "triangle", vol: .1, at: .4 + i * .11, pan: P(pan) }));
      tone(1047, .55, { type: "square", vol: .05, at: .85, pan: P(pan) }); tone(1319, .55, { type: "triangle", vol: .07, at: .85, pan: P(pan) });
    },
    dispose() { try { ctx && ctx.close(); } catch (e) {} ctx = null; }
  };
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
