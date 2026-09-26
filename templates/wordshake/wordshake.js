// =============================================================
// TEMPLATE: A SHOW SPEED (was "Wordshake" — renamed Đợt 387, only the words
// people SEE; the type stays "wordshake" so saved acts/assignments still open)
// — Đợt 386, 25/9/2026. Template #21.
// Design approved in 4 rounds (D:\OTHERS\CLAUDE\AWord - thiet ke Wordshake\
// wordshake-v1…v4.html): structure = v2, neon arcade skin + sounds = v4.
// The FIXED two-team game lives in games/wordshake/ and shares
// ./ws-lib.js (dictionary · dice · sound) with this template.
//
// Content = the lesson's words, exactly like Anagram: content.items[{word, clue}]
// (+ ENG1/ENG2/VI1/VI2 clue sets and VOICE clips, resolved by core/content-view.js
// before mount — this file only ever sees {word, clue, voice}).
//
// THREE MODES (Options ▸ "Wordshake mode", opt.wsMode):
//   "one"  Mode 1 · One word — one clue at a time; the board holds the word's
//          letters plus decoys (opt.wsTiles 8/12/16). A tapped tile flies down
//          into the answer slots; tap a slot to send it back. Full = checked.
//          Wrong → the letters come back, try again. 1 point per word.
//   "list" Mode 2 · Word list — one fixed 16-letter board, tiles work like keys
//          (tap as often as you like). The board's clue list turns over as the
//          words are spelt. Long lessons are split into several boards, each
//          holding every letter its own words need. 1 point per word.
//   "free" Mode 3 · Free words — a 16-letter board with 2–3 lesson words hidden
//          in it; ANY dictionary word counts (each tile once per word, 3–7
//          letters, 3→1 … 7→5 points), a lesson word scores ×2 and turns its
//          clue over. Single: the ✓ chip / submitted score = lesson words found
//          (never "8/8" for one word); the word points show as PTS. Fight: the
//          strip shows the points (that is what the two teams race for).
//
// FIGHT (tpl.fightLayout "shared-middle", core Đợt 386): [board][centre][board].
//   Mode 1 rides the referee's ordinary rounds (like Anagram): the same clue on
//   both boards, the same letters shuffled differently, first correct takes it;
//   › = this team passes. Mode 2/3 are ONE shared board per round: a word one
//   team finds is TAKEN for the other; when a board's lesson words are all
//   found both teams move to the next board together; the last one (or the
//   clock) ends the match through ui.finish → ctl.onFinish.
//   Everything both boards must agree on lives in SHARED (keyed by the match's
//   ctl — restartMatch builds a new ctl, so a new match starts clean). The
//   centre is drawn by whichever board changes something (drawCentre).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { mkCell, mkSeg } from "../../core/options-panel.js";
import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { loadDict, lookup, points, shuffle, countOf, wordsOn, createSfx, createTank, flyPoint, escapeHtml as esc } from "./ws-lib.js";
import { openWordshakeEditor } from "./wordshake-editor.js";
import { sound } from "../../core/sound.js";

// Đợt 387 — the last-10-seconds bell (engine hook `sounds.countdownTick`, board 0
// only in a Fight). One module-level player: the hook is not tied to one mount.
const bell = createSfx();

const MODES = ["one", "list", "free"];
const TILE_CHOICES = [8, 12, 16];
const FILL = "EEEEEAAAAIIIOOOTTTNNNSSSRRRLLDDHHCMPUGBYWF";
const rl = () => FILL[Math.random() * FILL.length | 0];
const lettersOf = w => String(w || "").toUpperCase().replace(/[^A-Z]/g, "");
const BK_SVG = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m16 10-4 4m0-4 4 4"/></svg>';
const modeOf = o => (MODES.includes(o && o.wsMode) ? o.wsMode : "one");
const tilesOf = o => (TILE_CHOICES.includes(+(o && o.wsTiles)) ? +o.wsTiles : 12);
const blanks = n => Array(n).fill("_").join(" ");
const arrow = side => `<span class="aw-ws-arr ${side ? "is-r" : "is-l"}"></span>`;

// ---------------- Đợt 389: start screen + "Next" tick (per device) ----------------
// thầy 25/9/2026: the act opens on the GAME's own start screen (logo · 2/3/5 min ·
// PLAY) instead of AWord's READY; the minutes ARE the play's clock (count down).
// Both choices live on this device (like the GAME's `aword-wordshake-time`), not on
// the act: they are how the class plays today, not part of the lesson.
const TIMES = [120, 180, 300];
const T_MIN = 60, T_MAX = 600, DOUBLE_MS = 380, SWIPE_PX = 26;
const PREF_TIME = "aword-showspeed-act-time", PREF_NEXT = "aword-showspeed-next";
function readTime() { try { const v = +localStorage.getItem(PREF_TIME); return TIMES.includes(v) ? v : 180; } catch (e) { return 180; } }
function saveTime(v) { try { localStorage.setItem(PREF_TIME, String(v)); } catch (e) {} }
// `liveTime` = what the start screen shows right now (a swiped solo value is not
// saved, exactly like the GAME) — read by EVERY board's beforePlay, so in a match
// board 1 starts with the minutes board 0's centre screen shows.
let liveTime = null;
// Next is OFF unless the teacher ticks it (thầy: "mặc định là tắt ko cho next").
function allowNext() { try { return localStorage.getItem(PREF_NEXT) === "1"; } catch (e) { return false; } }
function saveNext(on) { try { localStorage.setItem(PREF_NEXT, on ? "1" : "0"); } catch (e) {} }
const nextSubs = new Set();        // mounted boards redraw their › when the tick flips
const beep = k => { if (!sound.isMuted()) bell[k](0); };
const TICK_SVG = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

// The board a team sees before PLAY in a match: its 16 tiles still dark, like the GAME.
function idleBoardHtml(side) {
  const t = Array(16).fill('<button type="button" class="aw-ws-t" disabled>?</button>').join("");
  return `<div class="aw-ws-root is-fight is-side-${side} aw-ws-idle"><div class="aw-ws-solo"><div class="aw-ws-pad">` +
    `<div class="aw-ws-pv"></div><div class="aw-ws-grid4">${t}</div>` +
    `<div class="aw-ws-btns"><button type="button" class="aw-ws-b is-clr" disabled><span>Clear</span></button><button type="button" class="aw-ws-b is-ent" disabled><span>Enter</span></button></div>` +
    `</div></div></div>`;
}

// The start panel itself (logo · minute chips · PLAY), drawn into `box` — the whole
// frame in single play, the centre board in a match. The chips work like the GAME's
// (Đợt 387): tap = choose; double-tap = that chip alone, swipe ▲ +1 / ▼ −1 min
// (1–10), mouse wheel too; double-tap again = the three chips back.
function mountStartPanel(box, { play, ready, onTime }) {
  let dur = readTime();
  let solo = false, soloBase = dur, lastTap = { t: 0, at: 0 }, isReady = false, dead = false;
  const offs = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
  const setDur = v => { dur = liveTime = v; if (onTime) onTime(v); };
  function draw() {
    const chips = solo
      ? `<div class="aw-wss-times is-solo"><div class="aw-wss-tsolo"><i class="up"></i><button type="button" data-do="time" data-t="${dur}" class="is-on"><span>${dur / 60} min</span></button><i class="dn"></i></div></div>`
      : `<div class="aw-wss-times">${TIMES.map(t => `<button type="button" data-do="time" data-t="${t}" class="${t === dur ? "is-on" : ""}"><span>${t / 60} min</span></button>`).join("")}</div>`;
    box.innerHTML = `<div class="aw-wss"><div class="aw-wss-logo">A SHOW <span>SPEED</span></div>${chips}` +
      `<button type="button" class="aw-wss-play" data-do="play" aria-label="Play" ${isReady ? "" : "disabled"}><span>Play</span></button>` +
      (isReady ? "" : `<div class="aw-wss-note">Loading…</div>`) + `</div>`;
  }
  function stepTime(n) {
    const v = Math.max(T_MIN, Math.min(T_MAX, dur + n * 60));
    const tbox = box.querySelector(".aw-wss-tsolo");
    if (v === dur) { if (tbox) tbox.animate([{ translate: "0 0" }, { translate: `0 ${n > 0 ? -5 : 5}px` }, { translate: "0 0" }], { duration: 180 }); return; }
    setDur(v); beep("tap");
    // in place, no redraw: the finger is still on the chip
    const btn = tbox && tbox.querySelector("button");
    if (btn) {
      btn.dataset.t = dur; btn.querySelector("span").textContent = `${dur / 60} min`;
      btn.animate([{ translate: `0 ${n > 0 ? 10 : -10}px`, opacity: .3 }, { translate: "0 0", opacity: 1 }], { duration: 200, easing: "ease-out" });
    }
  }
  function onDown(e) {
    const b = e.target.closest("[data-do]"); if (!b || b.disabled || dead) return;
    bell.unlock();
    if (b.dataset.do === "play") { e.preventDefault(); play(); return; }
    if (b.dataset.do !== "time") return;
    const t = +b.dataset.t, now = performance.now();
    const dbl = now - lastTap.at < DOUBLE_MS && (solo || lastTap.t === t);
    lastTap = dbl ? { t: 0, at: 0 } : { t, at: now };
    if (dbl) {
      const r0 = b.getBoundingClientRect();
      if (solo) { solo = false; setDur(soloBase); }
      else { solo = true; soloBase = t; setDur(t); saveTime(t); }
      beep("next"); draw();
      // the chip glides from where it was to where it now is
      const b2 = box.querySelector(`.aw-wss-times button[data-t="${dur}"]`);
      if (b2) { const r = b2.getBoundingClientRect(); b2.animate([{ translate: `${r0.left - r.left}px ${r0.top - r.top}px` }, { translate: "0 0" }], { duration: 320, easing: "cubic-bezier(.22,.9,.3,1)" }); }
      return;
    }
    if (!solo) { setDur(t); saveTime(t); beep("tap"); draw(); return; }
    // solo: follow the finger for swipes (screen px — nothing here is scaled)
    e.preventDefault();
    let y0 = e.clientY;
    const move = ev => {
      const dy = ev.clientY - y0;
      if (Math.abs(dy) < SWIPE_PX) return;
      y0 = ev.clientY; lastTap = { t: 0, at: 0 };   // a swipe is not half of a double-tap
      stepTime(dy < 0 ? 1 : -1);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }
  on(box, "pointerdown", onDown);
  on(box, "wheel", e => {
    if (!solo || dead || !e.target.closest(".aw-wss-tsolo")) return;
    e.preventDefault(); stepTime(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  setDur(dur); draw();
  Promise.resolve(ready && ready()).then(() => { if (dead) return; isReady = true; draw(); });
  return () => { dead = true; offs.forEach(f => f()); };
}

// ---------------- Đợt 390: score tank (Options ▸ Score tank, default ON) ----------------
// The score is not shown while the game runs: its box holds a sparkling tank, points
// fly in and slosh the water (ws-lib createTank/flyPoint). At the end the numbers
// count up through the core hook `fightReveal` (before the result panel). One set of
// tanks per match, kept here so the start screen and mount() share them.
// ⭐ Đợt 403 (thầy, 26/9/2026): FIGHT ONLY — single play shows its ✓ score in the
// frame's top-right corner the normal way, no tank, no count (singleTank removed).
const TANKS = new WeakMap();
// Đợt 403 — the match's shared state by its `.aw-fight` wrap, for the MISSED list
// the result panel shows (fightReveal only gets the wrap).
const WRAP_S = new WeakMap();
const tankOn = o => !(o && o.wsTank === false);
// (Đợt 390b: ignored — the tank level is FIXED, the same for every team; kept for the old call shape)
const tankK = (mode, fight) => mode === "free" ? (fight ? 20 : 3) : 6;
function fightTanks(wrap, k) {
  if (!wrap) return null;
  let t = TANKS.get(wrap);
  if (t) return t;
  const teams = [0, 1].map(i => wrap.querySelector(".aw-fight-team.side-" + i));
  if (!teams[0] || !teams[1]) return null;
  t = teams.map((team, i) => {
    const tk = createTank({ side: i, k });
    team.append(tk.el);
    // the strip's number is core's (bonus / penalties included): follow it for the level
    const sc = team.querySelector(".aw-fight-score");
    if (sc) new MutationObserver(() => tk.set(Number(sc.textContent) || 0)).observe(sc, { childList: true, characterData: true, subtree: true });
    tk.scoreEl = sc;
    return tk;
  });
  wrap.classList.add("is-ws-tank");
  TANKS.set(wrap, t);
  return t;
}

// ⭐ Đợt 402 (thầy, 26/9/2026) — "the other modes like the GAME" (Đợt 395 + 401): time's up
// ⇒ the boards go dark + blurred, the score box(es) slide from the strip down to the middle
// of their board, THEN both numbers count up together one step at a time (a tick a step);
// the leader's box grows on its first number past the lower score and counts on alone.
// `placeDown` measures in page px and converts to the target's own px (a zoomed / scaled
// frame); the box's centre is unchanged by its skew / scale, so centre-to-centre is exact.
// ⭐ Đợt 403 — measured with the box's own transform switched off for the moment, so it can
// run again whenever the size changes (⛶ fullscreen, iPad turned): `snap` = no animation.
function placeDown(box, target, scale, snap) {
  if (!box || !target) return;
  if (snap) box.style.transition = "none";
  box.style.transform = "none";
  const a = box.getBoundingClientRect(), b = target.getBoundingClientRect();
  box.style.transform = "";
  const k = target.offsetWidth / (b.width || 1) || 1;
  box.style.setProperty("--ws-dx", ((b.left + b.width / 2) - (a.left + a.width / 2)) * k + "px");
  box.style.setProperty("--ws-dy", ((b.top + b.height / 2) - (a.top + a.height / 2)) * k + "px");
  box.style.setProperty("--ws-k", String(scale));
  box.classList.add("is-ws-down");
  if (snap) { void box.offsetWidth; box.style.transition = ""; }
}
// The team box grows to at most 1.5×, and never wider than 75 % of its board — the
// leader's box grows ×1.2 more during the count (Đợt 403: ≤ 90 %, it spilled at 0.9 × 1.2).
const downScale = (team, board) => Math.min(1.5, .75 * board.offsetWidth / (team.offsetWidth || 1));
function slideDown(box, target, scale) {
  if (!box || !target) return Promise.resolve();
  placeDown(box, target, scale, false);
  return new Promise(r => setTimeout(r, 900));
}
// The GAME's count (Đợt 395) for 1 or 2 tanks. `grow(side)` makes the leader's box bigger.
// ⭐ Đợt 403 — a NEGATIVE score (penalties) counts DOWN from 0 to its value, step for step
// with the other number (the steps run on |score|); with a negative score in the match
// the leader grows once at the end instead of halfway.
function countTanks(tanks, scores, grow) {
  const say = (k, ...a) => { if (!sound.isMuted()) bell[k](...a); };
  const real = scores.map(v => Math.round(Number(v) || 0));
  const sc = real.map(v => Math.abs(v)), neg = real.some(v => v < 0);
  const lo = Math.min(...sc), hi = Math.max(...sc);
  const lead = real.length < 2 || real[0] === real[1] ? -1 : (real[0] > real[1] ? 0 : 1);
  const STEP = Math.round(Math.max(120, Math.min(340, 10000 / Math.max(1, hi))));
  const pan = i => sc.length < 2 ? 0 : (i ? .65 : -.65);
  const show = (i, n) => {
    tanks[i].countTo(n, sc[i]);
    if (real[i] < 0) { const num = tanks[i].el.querySelector(".wst-num"); if (num) num.textContent = String(-n); }
  };
  tanks.forEach(t => t.countTo(0, 1));
  return new Promise(res => {
    let n = 0, grown = false;
    // a torn-down match / left page: stop counting, let the caller go on
    const later = (fn, ms) => setTimeout(() => { if (tanks.every(t => t.el.isConnected)) fn(); else res(); }, ms);
    const done = () => {
      tanks.forEach((t, i) => t.landCount(real[i]));
      if (neg && lead >= 0 && grow) grow(lead);
      say("land"); later(res, 1000);
    };
    const tickOne = () => {
      n++;
      sc.forEach((v, i) => { if (n <= v) show(i, n); });
      say("countTick", hi > 1 ? (n - 1) / (hi - 1) : 1);
      later(step, n >= hi ? 450 : STEP);
    };
    const step = () => {
      if (n >= hi) return done();
      if (!neg && lead >= 0 && n === lo && !grown) {
        grown = true;
        if (lo > 0) tanks[1 - lead].landCount(lo);
        return later(() => { if (grow) grow(lead); say("swell", pan(lead)); later(tickOne, 420); }, lo > 0 ? 650 : 250);
      }
      tickOne();
    };
    step();
  });
}

// ⭐ Đợt 403 (thầy, 26/9/2026) — MISSED on the match's result panel, like the GAME.
// Mode 1/2: the lesson's words neither team made (+ meaning). Mode 3: the lesson words of
// the last board nobody made, then the everyday words (A1–B1, not a form of another word)
// on that board that nobody found — longest first, 10 at most.
function missedHtml(S) {
  const done = new Set(S.log.map(f => String(f.w).toLowerCase()));
  S.found.forEach((_, up) => done.add(String(up).toLowerCase()));
  S.taken.forEach((_, w) => done.add(String(w).toLowerCase()));
  const row = (w, m) => `<div><b>${esc(w.toUpperCase())}</b> <span>${esc(m || "")}</span></div>`;
  const wrapUp = rows => rows.length ? `<div class="aw-ws-mlab">MISSED</div><div class="aw-ws-mlist">${rows.join("")}</div>` : "";
  const items = S.items || [];
  if (S.mode !== "free") {
    return Promise.resolve(wrapUp(items.filter(it => !done.has(it.word.toLowerCase()) && !done.has(it.up.toLowerCase()))
      .slice(0, 10).map(it => row(it.word, it.clue))));
  }
  const P = S.plan && S.plan[Math.min(S.r, S.plan.length - 1)];
  if (!P) return Promise.resolve("");
  const lesson = P.words.map(up => items.find(x => x.up === up)).filter(it => it && !done.has(it.up.toLowerCase()));
  return loadDict().then(dict => {
    const extra = wordsOn(dict, P.letters, 4)
      .filter(w => !done.has(w) && !dict.get(w).base && !lesson.some(it => it.up.toLowerCase() === w))
      .sort((x, y) => y.length - x.length || dict.get(x).lv - dict.get(y).lv);
    const rows = lesson.map(it => row(it.word, it.clue))
      .concat(extra.map(w => row(w, (lookup(dict, w) || {}).m)));
    return wrapUp(rows.slice(0, 10));
  }).catch(() => wrapUp(lesson.map(it => row(it.word, it.clue))));
}

// ---------------- board plans (shared by single and fight) ----------------
// Mode 2 — boards of ≤5 words whose letters fit in 16 DIFFERENT letters.
function planList(items) {
  const rounds = []; let cur = [], set = new Set();
  items.forEach(it => {
    const u = new Set([...set, ...it.up]);
    if (cur.length && (u.size > 16 || cur.length >= 5)) { rounds.push({ words: cur, set }); cur = []; set = new Set(); }
    cur.push(it.up); set = new Set([...set, ...it.up]);
  });
  if (cur.length) rounds.push({ words: cur, set });
  rounds.forEach(r => {
    const L = [...r.set]; let g = 0;
    while (L.length < 16 && g++ < 400) { const c = rl(); if (!L.includes(c)) L.push(c); }
    r.letters = L; delete r.set;
  });
  return rounds;
}
// Mode 3 — boards of ≤3 words whose letters (as a MULTISET) fit in 12 tiles,
// topped up to 16 with everyday letters (≥5 vowels).
function planFree(items) {
  const left = items.filter(it => it.up.length <= 12).map(it => it.up);
  const boards = [];
  while (left.length) {
    let need = {}; const words = [];
    for (let k = 0; k < left.length && words.length < 3; k++) {
      const c = countOf(left[k]), nx = { ...need };
      for (const ch in c) nx[ch] = Math.max(nx[ch] || 0, c[ch]);
      if (Object.values(nx).reduce((a, b) => a + b, 0) <= 12) { need = nx; words.push(left[k]); left.splice(k, 1); k--; }
    }
    if (!words.length) words.push(left.shift());
    const L = []; for (const ch in need) for (let k = 0; k < need[ch]; k++) L.push(ch);
    const vowels = () => L.filter(c => "AEIOU".includes(c)).length;
    while (L.length < 16) L.push(vowels() < 5 ? "AEIOEA"[Math.random() * 6 | 0] : "TNSRLHDC"[Math.random() * 8 | 0]);
    boards.push({ words, letters: L });
  }
  return boards;
}

// ---------------- FIGHT: what both boards share ----------------
const SHARED = new WeakMap();
function sharedOf(ctl) {
  let s = SHARED.get(ctl);
  if (!s) {
    s = { plan: null, r: 0, i: 0, letters: {}, found: new Map(), taken: new Map(), log: [],
          subs: new Set(), host: null, ro: null, voice: createVoicePlayer(), items: null, activity: null,
          advancing: false, lastClue: -1, mode: "one" };
    SHARED.set(ctl, s);
  }
  return s;
}
function attachHost(S, host) {
  if (!host || S.host === host) return;
  S.host = host;
  host.innerHTML = "";
  host.classList.add("aw-ws-host");
  if (S.ro) S.ro.disconnect();
  const unit = () => host.style.setProperty("--ws-u", (host.clientWidth / 100) + "px");
  S.ro = new ResizeObserver(unit);
  S.ro.observe(host);
  unit();
  host.addEventListener("click", e => {
    const b = e.target.closest("[data-voice]"); if (!b || !S.items) return;
    const it = S.items.find(x => x.up === b.dataset.voice); if (it) S.voice.toggle(it.voice, b);
  });
}
function clueHtml(S, it, big) {
  const vv = voiceView(S.activity, it);
  const btn = vv.hasVoice ? `<button type="button" class="aw-voicebtn${vv.hideText ? " aw-voicebtn-lg" : ""}" data-voice="${esc(it.up)}" aria-label="Listen">${icons.soundOn}</button>` : "";
  const text = vv.hasVoice && vv.hideText ? "" : `<span>${esc(it.clue || "")}</span>`;
  return `<div class="aw-ws-cclue${big ? " is-big" : ""}">${text}${btn}</div>`;
}
function drawCentre(S) {
  const host = S.host; if (!host || !S.items) return;
  const byUp = up => S.items.find(x => x.up === up);
  const col = side => S.log.filter(f => f.side === side)
    .map(f => `<li data-k="${esc(f.w.toLowerCase())}"><b>${esc(f.w.toUpperCase())}</b>${f.m ? `<span>${esc(f.m)}</span>` : ""}</li>`).join("");
  // Đợt 387 — where every listed word sits BEFORE the redraw, so the columns
  // can slide instead of jump (a new word drops in on top, the rest move down).
  const before = new Map();
  host.querySelectorAll(".aw-ws-ccols li[data-k]").forEach(li => before.set(li.parentNode.className + "|" + li.dataset.k, li.getBoundingClientRect().top));
  const cols = `<div class="aw-ws-ccols"><ol class="is-l">${col(0)}</ol><ol class="is-r">${col(1)}</ol></div>`;
  const defRow = up => {
    const it = byUp(up); if (!it) return "";
    const who = S.found.get(up);
    const done = who === 0 || who === 1;
    return `<div class="aw-ws-cdf${done ? " is-done" : ""}"><span class="aw-ws-mk">${done && who === 0 ? arrow(0) : ""}</span>` +
      `<div>${clueHtml(S, it, false)}<div class="aw-ws-cbl">${done ? esc(it.word.toUpperCase()) : blanks(it.up.length)}</div></div>` +
      `<span class="aw-ws-mk">${done && who === 1 ? arrow(1) : ""}</span></div>`;
  };
  let html;
  if (S.mode === "one") {
    const it = S.items[S.i];
    html = `<div class="aw-ws-cen">${it ? clueHtml(S, it, true) : ""}<div class="aw-ws-cprog">${Math.min(S.i + 1, S.items.length)} / ${S.items.length}</div>${cols}</div>`;
  } else {
    const P = S.plan && S.plan[S.r];
    const rows = P ? P.words.map(defRow).join("") : "";
    html = S.mode === "list"
      ? `<div class="aw-ws-cen"><div class="aw-ws-cprog">${S.r + 1} / ${S.plan.length}</div><div class="aw-ws-cdefs">${rows}</div></div>`
      : `<div class="aw-ws-cen"><div class="aw-ws-cprog">${S.r + 1} / ${S.plan.length}</div><div class="aw-ws-cdefs is-short">${rows}</div>${cols}</div>`;
  }
  host.innerHTML = html;
  if (before.size || S.log.length) {
    const ease = "cubic-bezier(.22,.9,.3,1)";
    host.querySelectorAll(".aw-ws-ccols li[data-k]").forEach(li => {
      const was = before.get(li.parentNode.className + "|" + li.dataset.k);
      if (was == null) {
        // only the newest words (top of a column) are new; a first draw of a full list stays still
        if (before.size || li === li.parentNode.firstElementChild)
          li.animate([{ transform: "translateY(-120%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 460, easing: ease });
        return;
      }
      const dy = was - li.getBoundingClientRect().top;
      if (Math.abs(dy) > .5) li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: ease });
    });
  }
  // Mode 1: a NEW clue speaks once, from the centre (ONE player for the match).
  if (S.mode === "one" && S.lastClue !== S.i) {
    S.lastClue = S.i;
    S.voice.stop();
    const it = S.items[S.i], btn = host.querySelector("[data-voice]");
    if (it && btn && voiceView(S.activity, it).autoPlay) S.voice.playDelayed(it.voice, btn, S.i === 0 ? DEFAULT_INTRO_DELAY_MS : 0);
  }
}

const wordshakeTemplate = {
  type: "wordshake",
  scorable: true,
  itemsKey: "items",
  name: "A Show Speed",
  hasSloganSlot: true,
  sounds: {
    countdownTick: left => { if (!sound.isMuted()) bell.countdown(left); }
  },
  checkOrder: ["shuffle", "wsTank", "showAnswers"],
  edit: openWordshakeEditor,
  fightMode: true,
  fightLayout: "shared-middle",
  // Đợt 389 — boardTools "shared": ☰ · ‹ › · 🔊 of board 0 go to the row under the
  // match (beside Options / Mode), both boards' own bottom rows are hidden. The
  // TIME DELAY bar is re-homed into each board in mount (`ui.hostFightWaitBar`).
  fightFrame: { sideW: 392, midW: 440, h: 408, skin: "wordshake", boardTools: "shared" },
  // Đợt 389 — single play: the same move, out of the frame (core `tpl.toolsBelow`).
  toolsBelow: true,

  // ⭐ Đợt 389 (thầy, 25/9/2026) — the GAME's start screen replaces AWord's READY
  // (core `tpl.startScreen`). Single play: the whole frame. A match: board 0 draws
  // it on the centre board, each board's cover shows its idle tiles.
  startScreen({ host, activity, fight, play, ready }) {
    const side = fight ? fight.side : 0;
    const beforePlay = () => {
      const o = activity.options || (activity.options = {});
      o.timer = "countDown";
      o.timerTotalSeconds = liveTime || readTime();
    };
    if (fight) {
      host.innerHTML = idleBoardHtml(side);
      if (side !== 0) return { beforePlay };
      const S = sharedOf(fight.ctl);
      attachHost(S, fight.ctl.sharedRoot());
      if (tankOn(activity.options)) fightTanks(fight.ctl.sharedRoot()?.closest(".aw-fight"), tankK(modeOf(activity.options), true));
      if (!S.host) return { beforePlay };
      const off = mountStartPanel(S.host, { play, ready, onTime: v => fight.ctl.onTimer && fight.ctl.onTimer(0, v) });
      return { beforePlay, dispose: off };
    }
    host.innerHTML = `<div class="aw-ws-root aw-wss-single"></div>`;
    // the frame's own clock shows the chosen minutes before PLAY (the engine writes
    // its real value the moment the clock starts)
    const clock = host.closest(".aw-stage-inner")?.querySelector(".aw-top-timer");
    const onTime = v => { if (clock) { clock.textContent = Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0"); clock.style.visibility = "visible"; } };
    const off = mountStartPanel(host.firstChild, { play, ready, onTime });
    return { beforePlay, dispose: off };
  },

  // ⭐ Đợt 390 — core `tpl.fightReveal`: the match is over, the result panel waits
  // for this. Both tanks drain as the numbers count up; then the real numbers return.
  // ⭐ Đợt 402 — first the two boards dim + blur and the two team boxes slide down to the
  // middle of their boards (with or without tanks), then the count; they stay there, and
  // the result panel lands in the SHARED MIDDLE board instead of over the whole screen
  // (Start again rebuilds the match, so nothing needs putting back).
  fightReveal({ wrap, scores, activity }) {
    const teams = [0, 1].map(i => wrap.querySelector(".aw-fight-team.side-" + i));
    const boards = [...wrap.querySelectorAll(".aw-fight-board")];
    if (!teams[0] || !teams[1] || boards.length < 2) return;
    const mid = wrap.querySelector(".aw-fight-shared");
    const S = WRAP_S.get(wrap);
    // Đợt 403 — the missed words, worked out now (the dictionary is already loaded in Mode 3)
    const missed = S ? missedHtml(S) : Promise.resolve("");
    if (mid) {
      const mo = new MutationObserver(() => {
        const p = wrap.querySelector(":scope > .aw-fight-result");
        if (!p) return;
        mo.disconnect(); p.classList.add("is-ws-mid"); mid.append(p);
        missed.then(html => {
          if (!html || !p.isConnected) return;
          const box = document.createElement("div"); box.className = "aw-ws-missed"; box.innerHTML = html;
          const btns = p.querySelector(".aw-fight-result-btns");
          btns ? p.insertBefore(box, btns) : p.append(box);
        });
      });
      mo.observe(wrap, { childList: true });
      setTimeout(() => mo.disconnect(), 30000);
    }
    // Đợt 403 — the time-up sound of the GAME, only when the clock ran out (not when the
    // words ran out first — the look is the same, thầy chose it for both)
    const clk = wrap.querySelector(".aw-fight-clock");
    if (clk && /^0?0:00$/.test(clk.textContent.trim()) && !sound.isMuted()) bell.timeup();
    wrap.classList.add("is-ws-ending");
    const k = downScale(teams[0], boards[0]);
    // ⭐ Đợt 403 — ⛶ fullscreen / turning the iPad / a new window size: measure again, so
    // the boxes stay in the middle of their boards (until Start again rebuilds the match)
    let settled = false;
    const again = () => {
      if (!wrap.isConnected) { ro.disconnect(); return; }
      if (!settled) return;
      teams.forEach((x, i) => placeDown(x, boards[i], downScale(teams[0], boards[0]), true));
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(again));
    ro.observe(wrap); boards.forEach(b => ro.observe(b));
    const t = tankOn(activity.options) ? TANKS.get(wrap) : null;
    return Promise.all(teams.map((x, i) => slideDown(x, boards[i], k)))
      .then(() => { settled = true; again(); })
      .then(() => t ? countTanks(t, scores, side => teams[side].classList.add("is-ws-big")) : null)
      .then(() => {
        if (!t) return;
        wrap.classList.remove("is-ws-tank");
        t.forEach(x => x.el.classList.remove("is-count"));
      });
  },

  // ⭐ Đợt 389 — the "Next" tick on the row under the frame (core `tpl.belowTools`).
  // OFF = no › at all (Mode 1 cannot skip a word, Mode 2 cannot skip a board; in a
  // match no team can pass). The choice is this device's and flips live.
  belowTools({ host }) {
    const b = el("button", "aw-ws-tick");
    b.type = "button";
    const paint = () => {
      const on = allowNext();
      b.classList.toggle("is-on", on);
      b.title = on ? "Next is allowed — tap to turn it off" : "Next is off — tap to allow it";
      b.setAttribute("aria-pressed", String(on));
    };
    b.innerHTML = `<span class="aw-ws-tickbox">${TICK_SVG}</span><span class="aw-ws-ticklab">NEXT</span>`;
    b.addEventListener("click", () => {
      saveNext(!allowNext()); paint();
      nextSubs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    });
    paint();
    host.append(b);
  },

  // Mode 3 checks free words against the dictionary — load it while READY is on screen.
  prepare(activity) {
    return modeOf(activity.options) === "free" ? loadDict() : Promise.resolve();
  },

  toPrintItems(activity) {
    return (activity.content?.items || []).map(it => ({ clue: it.clue || "", answer: it.word || "" }));
  },

  buildExtraOptions({ panel, draft, addCheck }) {
    const cur = modeOf(draft);
    const modeCell = mkCell({ label: "A Show Speed mode", wide: true });
    const tilesCell = mkCell({ label: "Letters", sub: "Mode 1" });
    const sync = m => tilesCell.cell.classList.toggle("is-locked", m !== "one");
    modeCell.ctl.append(mkSeg([
      { value: "one", label: "One word" },
      { value: "list", label: "Word list" },
      { value: "free", label: "Free words" }
    ], cur, v => { draft.wsMode = v; sync(v); }));
    tilesCell.ctl.append(mkSeg(TILE_CHOICES.map(n => ({ value: n, label: String(n) })), tilesOf(draft), v => { draft.wsTiles = v; }));
    sync(cur);
    panel.append(modeCell.cell, tilesCell.cell);
    // Đợt 390 — the score tank (thầy: the GAME always has it, an activity may switch it off)
    if (addCheck) addCheck("Score tank", draft.wsTank !== false, v => { draft.wsTank = v; },
      { key: "wsTank", title: "Fight: hide the score in a tank until the end, then count it up" });
  },
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    if (ui.sloganSlot) ui.sloganSlot.textContent = "A SHOW SPEED IN ANDREW CLASSES";
    const opt = activity.options || {};
    const mode = modeOf(opt);
    const fight = activity._fight || null;
    const side = fight ? fight.side : 0;
    const fctl = fight ? fight.ctl : null;
    const pan = fctl ? (side ? .65 : -.65) : 0;
    const sfx = createSfx();
    const voicePlayer = createVoicePlayer();
    ui.setVoiceGuard?.(() => voicePlayer.isPlaying());

    let items = [...(activity.content?.items || [])]
      .filter(it => it && lettersOf(it.word).length >= 2)
      .map(it => ({ word: String(it.word).trim(), up: lettersOf(it.word), clue: it.clue || "", voice: it.voice, hideText: it.hideText, src: it }));
    if (opt.shuffleQuestions && !fctl) items = shuffle(items);
    const total = items.length;
    root.innerHTML = "";
    const wrap = el("div", "aw-ws-root aw-ws-m-" + mode + (fctl ? " is-fight is-side-" + side : ""));
    root.append(wrap);
    // Đợt 389 — fightFrame.boardTools "shared" hides the board's bottom row, where
    // the referee's TIME DELAY bar lives: it moves into this board (a sibling of
    // `wrap`, which every render empties).
    if (fctl && typeof ui.hostFightWaitBar === "function") {
      const waitSlot = el("div", "aw-ws-waitslot");
      root.append(waitSlot);
      ui.hostFightWaitBar(waitSlot);
    }
    if (!total) { wrap.append(el("div", "aw-ws-empty", "This activity has no words yet.")); return () => {}; }

    const st = items.map(() => ({ solved: false, tries: 0, typed: null }));
    const idxOf = up => items.findIndex(it => it.up === up);
    let score = 0, pts = 0, finished = false, dead = false, locked = false, refLocked = false, firstVoice = true;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

    // ---- fight wiring ----
    const S = fctl ? sharedOf(fctl) : null;
    if (S) {
      S.mode = mode;
      if (!S.items) { S.items = items; S.activity = activity; }
      // Đợt 390 — a new grouping every play ⇒ new boards (thầy: "play again trùng nhau quá")
      if (!S.plan && mode === "list") S.plan = planList(shuffle(items));
      if (!S.plan && mode === "free") S.plan = planFree(shuffle(items));
      attachHost(S, fctl.sharedRoot());
    }
    // Đợt 390 — score tanks (see fightTanks) — Đợt 403: a match only
    const fTanks = fctl && tankOn(opt) ? fightTanks(root.closest(".aw-fight"), tankK(mode, true)) : null;
    if (fctl && S) { const fw = root.closest(".aw-fight"); if (fw) WRAP_S.set(fw, S); }
    function pour(fromEl, text) {
      const T = fTanks && fTanks[side];
      if (!T) return;
      flyPoint(fromEl, T.el, text, side).then(() => {
        if (!T.el.isConnected || T.el.classList.contains("is-count")) return;
        T.hit(Number(T.scoreEl && T.scoreEl.textContent) || 0);
        if (!sound.isMuted()) bell.splash(pan);
      });
    }
    const sub = { side, r: 0, refresh: done => refreshFromShared(done) };
    if (S) S.subs.add(sub);
    const notify = () => { if (!S) return; drawCentre(S); S.subs.forEach(x => { if (x !== sub) x.refresh(); }); };

    ui.onSubmit(() => finish());
    ui.setReviewProvider?.(() => buildReview());
    wrap.addEventListener("pointerdown", onDown);

    // ---------------- clue (single mode) ----------------
    function clueNode(it, big) {
      const box = el("div", "aw-ws-clue" + (big ? " is-big" : ""));
      const vv = voiceView(activity, it);
      if (vv.hasVoice) {
        const btn = el("button", "aw-voicebtn" + (vv.hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        btn.type = "button"; btn.setAttribute("aria-label", "Listen");
        btn.addEventListener("click", e => { e.stopPropagation(); voicePlayer.toggle(it.voice, btn); });
        if (!vv.hideText) box.append(el("span", "aw-ws-cluetext", esc(it.clue)));
        box.append(btn);
        return { box, btn, auto: vv.autoPlay };
      }
      box.append(el("span", "aw-ws-cluetext", esc(it.clue || "")));
      return { box, btn: null, auto: false };
    }
    function autoPlay(it, c) {
      if (!c || !c.btn || !c.auto) return;
      voicePlayer.playDelayed(it.voice, c.btn, firstVoice ? DEFAULT_INTRO_DELAY_MS : 0);
      firstVoice = false;
    }
    function bubble(kind, sym) {
      const host = wrap.querySelector(".aw-ws-bubs"); if (!host) return;
      const b = el("div", "aw-ws-bub " + kind); b.innerHTML = `<i>${esc(sym)}</i>`;
      host.append(b); later(() => b.remove(), 1300);
    }
    const tile = (ch, attrs, cls = "") => `<button type="button" class="aw-ws-t ${cls}" ${attrs}>${esc(ch)}</button>`;
    const say = (kind, p) => kind === "ok" ? sfx.ok(pan, p) : kind === "bad" ? sfx.bad(pan) : sfx.dup(pan);

    // =============================================================
    // MODE 1 — one word at a time
    // =============================================================
    // given: the index of the word the OTHER team made that this board now shows (Đợt 404)
    const M1 = { i: 0, board: [], slots: [], state: "", given: -1 };
    function m1Deal() {
      const it = items[M1.i];
      let L;
      if (S && S.letters[it.up]) L = S.letters[it.up].slice();   // same letters, own shuffle
      else {
        L = it.up.split("");
        const n = Math.max(tilesOf(opt), L.length + 2);
        while (L.length < n) L.push(rl());
        if (S) S.letters[it.up] = L.slice();
      }
      M1.board = shuffle(L).map(ch => ({ ch, used: false }));
      M1.slots = Array(it.up.length).fill(null);
      M1.state = ""; M1.given = -1;
    }
    const slotsHtml = () => M1.given === M1.i
      ? items[M1.i].up.split("").map((ch, j) => `<div class="aw-ws-slot is-full is-given" style="--d:${j * 70}ms">${esc(ch)}</div>`).join("")
      : M1.slots.map((k, j) => k == null ? `<div class="aw-ws-slot"></div>`
      : `<button type="button" class="aw-ws-slot is-full" data-do="slot" data-j="${j}">${esc(M1.board[k].ch)}</button>`).join("");
    const grid1Html = () => M1.board.map((b, k) => tile(b.ch, `data-do="t1" data-k="${k}"`, b.used ? "is-gone" : "")).join("");
    function m1Render() {
      voicePlayer.stop();
      const it = items[M1.i];
      wrap.innerHTML = "";
      const body = el("div", "aw-ws-one");
      let c = null;
      if (!fctl) { c = clueNode(it, true); body.append(c.box); }
      const slots = el("div", "aw-ws-slots " + M1.state);
      slots.style.setProperty("--n", String(M1.slots.length));
      slots.innerHTML = slotsHtml();
      const grid = el("div", "aw-ws-grid1");
      grid.style.setProperty("--cols", String(fctl ? 4 : Math.min(8, Math.ceil(M1.board.length / 2))));
      grid.innerHTML = grid1Html();
      body.append(slots, grid);
      // Đợt 389 — a match has no › of its own any more (the row under the match is
      // board 0's alone); with Next allowed each team gets PASS on its own board.
      if (fctl && allowNext()) body.append(el("button", "aw-ws-b aw-ws-pass", "<span>Pass ›</span>"));
      body.append(el("div", "aw-ws-bubs"));
      const pass = body.querySelector(".aw-ws-pass");
      if (pass) { pass.type = "button"; pass.dataset.do = "pass"; }
      wrap.append(body);
      ui.setScore(score);
      if (fctl) { S.i = M1.i; drawCentre(S); }
      else autoPlay(it, c);
      m1Nav();
    }
    function m1Nav() {
      if (fctl) ui.setNav({ index: M1.i + 1, total, onPrev: null, onNext: null });
      else ui.setNav({ index: M1.i + 1, total, onPrev: null, onNext: allowNext() ? m1Skip : null, nextLabel: M1.i + 1 >= total ? icons.check : undefined });
    }
    function m1Patch() {
      const slots = wrap.querySelector(".aw-ws-slots"), grid = wrap.querySelector(".aw-ws-grid1");
      if (!slots || !grid) return m1Render();
      slots.className = "aw-ws-slots " + (M1.given === M1.i ? "is-given" : M1.state);
      slots.innerHTML = slotsHtml();
      grid.innerHTML = grid1Html();
    }
    function m1Check() {
      const it = items[M1.i], s = st[M1.i];
      const guess = M1.slots.map(k => M1.board[k].ch).join("");
      locked = true; s.tries++; s.typed = guess;
      if (guess === it.up) {
        s.solved = true; score++; M1.state = "is-good"; m1Patch(); ui.setScore(score);
        say("ok", 2); bubble("ok", "+1"); pour(wrap.querySelector(".aw-ws-slots"), "+1");
        if (fctl) {
          S.log.unshift({ w: it.word, side, m: "" }); notify();
          fctl.wordDone(side, { index: M1.i, correct: true });   // the referee moves both boards on
        } else later(m1Next, 850);
      } else {
        M1.state = "is-bad"; m1Patch(); say("bad");
        later(() => { if (M1.given === M1.i) return; M1.board.forEach(b => b.used = false); M1.slots.fill(null); M1.state = ""; locked = false; m1Patch(); }, 650);
      }
    }
    function m1Next() { if (M1.i + 1 >= total) return finish(); M1.i++; m1Deal(); locked = false; m1Render(); sfx.next(); }
    // ⭐ Đợt 404 (thầy, 26/9/2026) — FIGHT Mode 1: the round is decided (core `reveal()`, called on
    // BOTH boards) and the OTHER team made the word ⇒ this board's slots show that word, letter
    // by letter, so the team that lost it can learn it during the hold before the next word
    // ("2 bên cùng hiện kết quả, 1 bên do điền, 1 bên bị điền"). Nobody made it / a tie ⇒ nothing.
    function m1Reveal() {
      if (mode !== "one" || !fctl || !S || dead) return;
      const it = items[M1.i], s = st[M1.i];
      if (!it || !s || s.solved || M1.given === M1.i) return;
      if (!S.log.some(f => f.side !== side && f.w === it.word)) return;
      M1.given = M1.i; locked = true;
      m1Patch();
    }
    function m1Skip() { if (locked) return; m1Next(); }
    function m1Pass() {                      // fight: this team gives the word up
      if (locked || refLocked || !fctl || fctl.isLocked(side)) return;
      locked = true;
      fctl.wordDone(side, { index: M1.i, correct: false });
    }

    // =============================================================
    // MODE 2 / MODE 3 — a pad of 16 letters
    // =============================================================
    const plan = S ? S.plan : (mode === "list" ? planList(shuffle(items)) : mode === "free" ? planFree(shuffle(items)) : null);
    let R = 0, order = [], input = "", sel = [], found3 = [], M3dict = null;
    const curPlan = () => plan[S ? S.r : R];
    function dealOrder() { order = shuffle([...Array(curPlan().letters.length).keys()]); input = ""; sel = []; }
    function padHtml(listMode) {
      const P = curPlan();
      const keys = order.map((o, k) => listMode ? tile(P.letters[o], `data-do="key" data-c="${P.letters[o]}"`)
        : tile(P.letters[o], `data-do="t3" data-k="${k}"`, sel.includes(k) ? "is-on" : "")).join("");
      const word = listMode ? input : sel.map(k => P.letters[order[k]]).join("");
      const btns = listMode
        ? `<div class="aw-ws-btns is-3"><button type="button" class="aw-ws-b is-bk" data-do="bk" aria-label="Delete letter">${BK_SVG}</button><button type="button" class="aw-ws-b is-clr" data-do="clr"><span>Clear</span></button><button type="button" class="aw-ws-b is-ent" data-do="ent"><span>Enter</span></button></div>`
        : `<div class="aw-ws-btns"><button type="button" class="aw-ws-b is-clr" data-do="clr"><span>Clear</span></button><button type="button" class="aw-ws-b is-ent" data-do="ent"><span>Enter</span></button></div>`;
      return `<div class="aw-ws-pv">${esc(word)}</div><div class="aw-ws-grid4">${keys}</div>${btns}<div class="aw-ws-bubs"></div>`;
    }
    function defRow(up) {
      const i = idxOf(up), it = items[i];
      const done = st[i].solved;
      const row = el("div", "aw-ws-df" + (done ? " is-done" : ""));
      row.append(clueNode(it, false).box, el("div", "aw-ws-bl", done ? esc(it.word.toUpperCase()) : blanks(it.up.length)));
      return row;
    }
    function padRender() {
      voicePlayer.stop();
      wrap.innerHTML = "";
      const pad = el("div", "aw-ws-pad");
      pad.innerHTML = padHtml(mode === "list");
      if (fctl) {
        const solo = el("div", "aw-ws-solo"); solo.append(pad); wrap.append(solo);
      } else {
        const P = curPlan();
        const right = el("div", mode === "list" ? "aw-ws-defs" : "aw-ws-side");
        if (mode === "list") P.words.forEach(up => right.append(defRow(up)));
        else {
          const list = el("div", "aw-ws-defs is-short");
          P.words.forEach(up => list.append(defRow(up)));
          const fl = el("ol", "aw-ws-found");
          fl.innerHTML = found3.map(f => `<li class="${f.les ? "is-les" : ""}"><b>${esc(f.w.toUpperCase())}</b>${f.m ? `<span>${esc(f.m)}</span>` : ""}<em>+${f.p}</em></li>`).join("");
          right.append(list, el("div", "aw-ws-pts", `PTS <b>${pts}</b>`), fl);
        }
        const body = el("div", "aw-ws-split"); body.append(pad, right); wrap.append(body);
      }
      ui.setScore(fctl && mode === "free" ? pts : score);
      padNav();
      if (S) drawCentre(S);
    }
    function padNav() {
      const r = S ? S.r : R;
      ui.setNav({ label: `${r + 1} of ${plan.length}`, onPrev: null, onNext: fctl || !allowNext() ? null : nextBoard, nextLabel: r + 1 >= plan.length ? icons.check : undefined });
    }
    function patchPad() {
      const pad = wrap.querySelector(".aw-ws-pad"); if (!pad) return padRender();
      const P = curPlan();
      pad.querySelector(".aw-ws-pv").textContent = mode === "list" ? input : sel.map(k => P.letters[order[k]]).join("");
      if (mode === "free") pad.querySelectorAll(".aw-ws-t").forEach(t => t.classList.toggle("is-on", sel.includes(+t.dataset.k)));
    }
    function roundDone() { return curPlan().words.every(up => S ? S.found.has(up) : st[idxOf(up)].solved); }
    function afterFind() {
      if (!roundDone()) return;
      if (S) {
        if (S.advancing) return;
        S.advancing = true;
        later(() => {
          S.advancing = false;
          if (S.r + 1 >= plan.length) { [...S.subs].forEach(x => x.refresh(true)); return; }
          S.r++; sfx.next(); [...S.subs].forEach(x => x.refresh());
        }, 1000);
      } else later(nextBoard, mode === "list" ? 900 : 1100);
    }
    function submitWord() {
      const P = curPlan();
      const w = mode === "list" ? input : sel.map(k => P.letters[order[k]]).join("");
      input = ""; sel = [];
      if (!w) return patchPad();
      const lw = w.toLowerCase();
      const lesson = P.words.includes(w);
      const i = lesson ? idxOf(w) : -1;
      let kind, sym;
      const owner = S ? (S.found.has(w) ? S.found.get(w) : S.taken.get(lw)) : undefined;
      if (S && owner !== undefined) { kind = "dup"; sym = owner === side ? "Found" : "Taken"; }
      else if (!S && lesson && st[i].solved) { kind = "dup"; sym = "Found"; }
      else if (!S && mode === "free" && found3.some(f => f.w === lw)) { kind = "dup"; sym = "Found"; }
      else if (lesson) {
        const p = mode === "free" ? points(Math.min(7, Math.max(3, w.length))) * 2 : 1;
        if (i >= 0) { st[i].solved = true; st[i].typed = w; }
        score++; pts += p;
        const m = mode === "free" && i >= 0 && !voiceView(activity, items[i]).hideText ? items[i].clue : "";
        if (S) { S.found.set(w, side); if (mode === "free") S.log.unshift({ w: lw, side, m, p }); }
        else if (mode === "free") found3.unshift({ w: lw, m, les: true, p });
        kind = "ok"; sym = "+" + p;
      } else if (mode === "free") {
        const hit = lookup(M3dict, lw);
        if (!hit) { kind = "bad"; sym = "?"; }
        else {
          const p = points(w.length); pts += p;
          if (S) { S.taken.set(lw, side); S.log.unshift({ w: lw, side, m: hit.m, p }); }
          else found3.unshift({ w: lw, m: hit.m, les: false, p });
          kind = "ok"; sym = "+" + p;
        }
      } else {
        kind = "bad"; sym = "?";
        P.words.forEach(up => { const j = idxOf(up); if (j >= 0 && !st[j].solved) st[j].tries++; });
      }
      say(kind, kind === "ok" ? parseInt(sym.slice(1), 10) || 1 : 0);
      // single Mode 3: the tank holds lesson WORDS (the ✓ score), so only those pour
      if (kind === "ok" && (fctl || lesson)) pour(wrap.querySelector(".aw-ws-pv"), fctl ? sym : "+1");
      if (kind === "ok") { padRender(); notify(); afterFind(); } else patchPad();
      bubble(kind, sym);
    }
    function nextBoard() {
      if (R + 1 >= plan.length) return finish();
      R++; dealOrder(); padRender(); sfx.next();
    }
    // Called by the other board / by the round turning over, in a fight.
    function refreshFromShared(done) {
      if (dead || finished) return;
      if (done) return finish();
      if (mode === "one") return;
      if (sub.r !== S.r) { sub.r = S.r; dealOrder(); padRender(); }
      else ui.setScore(mode === "free" ? pts : score);
    }

    // ---------------- input ----------------
    function onDown(e) {
      const b = e.target.closest("[data-do]"); if (!b || finished) return;
      if (fctl && (refLocked || fctl.isLocked(side))) return;
      const d = b.dataset.do;
      sfx.unlock();
      if (mode === "one") {
        if (locked) return;
        if (d === "pass") return m1Pass();
        if (d === "t1") {
          const k = +b.dataset.k, j = M1.slots.indexOf(null);
          if (j < 0 || M1.board[k].used) return;
          M1.slots[j] = k; M1.board[k].used = true; sfx.tap(pan); m1Patch();
          if (!M1.slots.includes(null)) m1Check();
        } else if (d === "slot") {
          const j = +b.dataset.j, k = M1.slots[j]; if (k == null) return;
          M1.board[k].used = false; M1.slots[j] = null; sfx.untap(pan); m1Patch();
        }
        return;
      }
      if (S && S.advancing) return;
      if (d === "key") { if (input.length < 16) { input += b.dataset.c; sfx.tap(pan); patchPad(); } }
      else if (d === "t3") { const k = +b.dataset.k, i = sel.indexOf(k); if (i >= 0) { sel.splice(i, 1); sfx.untap(pan); } else { sel.push(k); sfx.tap(pan); } patchPad(); }
      else if (d === "bk") { input = input.slice(0, -1); sfx.untap(pan); patchPad(); }
      else if (d === "clr") { if (input || sel.length) sfx.clear(pan); input = ""; sel = []; patchPad(); }
      else if (d === "ent") submitWord();
    }

    // ---------------- finish / review ----------------
    function buildReview() {
      return items.map((it, i) => ({
        question: it.clue || it.word,
        answered: st[i].tries > 0 || st[i].solved,
        yourText: st[i].solved ? it.word : (st[i].typed || null),
        yourCorrect: st[i].solved,
        correctText: it.word,
        src: it.src
      }));
    }
    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout); timers.clear();
      voicePlayer.stop();
      const review = buildReview();
      const perQuestion = review.map((r, i) => ({ q: i, correct: r.yourCorrect === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const result = { correct, incorrect: total - correct, total, items: total, perQuestion, review, answered: review.filter(r => r.answered).length };
      // Đợt 403 (thầy) — single play: no tank, no count; the ✓ in the frame's corner
      // already shows the score. A match counts through `fightReveal`.
      ui.finish(result);
    }

    // Đợt 389 — the Next tick flipped under the frame: only the › (or PASS) changes.
    const onNextFlip = () => {
      if (dead || finished) return;
      if (mode !== "one") return padNav();
      if (!fctl) return m1Nav();
      const body = wrap.querySelector(".aw-ws-one"), cur = body && body.querySelector(".aw-ws-pass");
      if (!body || !!cur === allowNext()) return;
      if (cur) cur.remove();
      else {
        const p = el("button", "aw-ws-b aw-ws-pass", "<span>Pass ›</span>");
        p.type = "button"; p.dataset.do = "pass";
        body.insertBefore(p, body.querySelector(".aw-ws-bubs"));
      }
    };
    nextSubs.add(onNextFlip);

    // ---------------- start ----------------
    if (mode === "one") { m1Deal(); m1Render(); }
    else {
      if (mode === "free") loadDict().then(d => { if (!dead) M3dict = d; }).catch(() => {});
      sub.r = S ? S.r : 0;
      dealOrder(); padRender();
    }
    if (fctl) {
      fctl.attach(side, {
        total: mode === "one" ? total : 1,
        goToIndex(i) {
          if (mode !== "one" || dead) return;
          M1.i = Math.max(0, Math.min(total - 1, i)); m1Deal(); locked = false; m1Render();
        },
        lock(on) { refLocked = !!on; },
        reveal: () => m1Reveal(),
        review: () => buildReview()
      });
    }

    return function cleanup() {
      dead = true;
      nextSubs.delete(onNextFlip);
      timers.forEach(clearTimeout); timers.clear();
      voicePlayer.stop();
      if (S) { S.subs.delete(sub); if (!S.subs.size) { S.voice.stop(); if (S.ro) S.ro.disconnect(); } }
      wrap.removeEventListener("pointerdown", onDown);
      sfx.dispose();
    };
  }
};

registerTemplate(wordshakeTemplate);
