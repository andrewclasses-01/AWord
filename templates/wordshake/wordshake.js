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
import { loadDict, lookup, points, shuffle, countOf, createSfx, escapeHtml as esc } from "./ws-lib.js";
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
    .map(f => `<li><b>${esc(f.w.toUpperCase())}</b>${f.m ? `<span>${esc(f.m)}</span>` : ""}</li>`).join("");
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
  checkOrder: ["shuffle", "showAnswers"],
  edit: openWordshakeEditor,
  fightMode: true,
  fightLayout: "shared-middle",
  fightFrame: { sideW: 392, midW: 440, h: 408, skin: "wordshake" },

  // Mode 3 checks free words against the dictionary — load it while READY is on screen.
  prepare(activity) {
    return modeOf(activity.options) === "free" ? loadDict() : Promise.resolve();
  },

  toPrintItems(activity) {
    return (activity.content?.items || []).map(it => ({ clue: it.clue || "", answer: it.word || "" }));
  },

  buildExtraOptions({ panel, draft }) {
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
      if (!S.plan && mode === "list") S.plan = planList(items);
      if (!S.plan && mode === "free") S.plan = planFree(items);
      attachHost(S, fctl.sharedRoot());
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
    const M1 = { i: 0, board: [], slots: [], state: "" };
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
      M1.state = "";
    }
    const slotsHtml = () => M1.slots.map((k, j) => k == null ? `<div class="aw-ws-slot"></div>`
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
      body.append(slots, grid, el("div", "aw-ws-bubs"));
      wrap.append(body);
      ui.setScore(score);
      if (fctl) { S.i = M1.i; drawCentre(S); ui.setNav({ index: M1.i + 1, total, onPrev: null, onNext: m1Pass }); }
      else { ui.setNav({ index: M1.i + 1, total, onPrev: null, onNext: m1Skip, nextLabel: M1.i + 1 >= total ? icons.check : undefined }); autoPlay(it, c); }
    }
    function m1Patch() {
      const slots = wrap.querySelector(".aw-ws-slots"), grid = wrap.querySelector(".aw-ws-grid1");
      if (!slots || !grid) return m1Render();
      slots.className = "aw-ws-slots " + M1.state;
      slots.innerHTML = slotsHtml();
      grid.innerHTML = grid1Html();
    }
    function m1Check() {
      const it = items[M1.i], s = st[M1.i];
      const guess = M1.slots.map(k => M1.board[k].ch).join("");
      locked = true; s.tries++; s.typed = guess;
      if (guess === it.up) {
        s.solved = true; score++; M1.state = "is-good"; m1Patch(); ui.setScore(score);
        say("ok", 2); bubble("ok", "+1");
        if (fctl) {
          S.log.unshift({ w: it.word, side, m: "" }); notify();
          fctl.wordDone(side, { index: M1.i, correct: true });   // the referee moves both boards on
        } else later(m1Next, 850);
      } else {
        M1.state = "is-bad"; m1Patch(); say("bad");
        later(() => { M1.board.forEach(b => b.used = false); M1.slots.fill(null); M1.state = ""; locked = false; m1Patch(); }, 650);
      }
    }
    function m1Next() { if (M1.i + 1 >= total) return finish(); M1.i++; m1Deal(); locked = false; m1Render(); sfx.next(); }
    function m1Skip() { if (locked) return; m1Next(); }
    function m1Pass() {                      // fight: this team gives the word up
      if (locked || refLocked || !fctl || fctl.isLocked(side)) return;
      locked = true;
      fctl.wordDone(side, { index: M1.i, correct: false });
    }

    // =============================================================
    // MODE 2 / MODE 3 — a pad of 16 letters
    // =============================================================
    const plan = S ? S.plan : (mode === "list" ? planList(items) : mode === "free" ? planFree(items) : null);
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
      const r = S ? S.r : R;
      ui.setNav({ label: `${r + 1} of ${plan.length}`, onPrev: null, onNext: fctl ? null : nextBoard, nextLabel: r + 1 >= plan.length ? icons.check : undefined });
      if (S) drawCentre(S);
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
      ui.finish({ correct, incorrect: total - correct, total, items: total, perQuestion, review, answered: review.filter(r => r.answered).length });
    }

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
        review: () => buildReview()
      });
    }

    return function cleanup() {
      dead = true;
      timers.forEach(clearTimeout); timers.clear();
      voicePlayer.stop();
      if (S) { S.subs.delete(sub); if (!S.subs.size) { S.voice.stop(); if (S.ro) S.ro.disconnect(); } }
      wrap.removeEventListener("pointerdown", onDown);
      sfx.dispose();
    };
  }
};

registerTemplate(wordshakeTemplate);
