// =============================================================
// TEMPLATE: WORDSHAKE — Đợt 386, 25/9/2026. Template #21.
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
//          clue over. The ✓ chip and the submitted score = lesson words found
//          (so it can never read 8/8 for one word); word points show as PTS.
// Assignment: total = number of lesson words in every mode; review rows are
// one per lesson word and never show an answer that was not found.
// FIGHT is not wired yet (needs a core layout — see GHI CHU WORDSHAKE.md).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { mkCell, mkSeg } from "../../core/options-panel.js";
import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { loadDict, lookup, points, shuffle, countOf, createSfx, escapeHtml as esc } from "./ws-lib.js";
import { openWordshakeEditor } from "./wordshake-editor.js";

const MODES = ["one", "list", "free"];
const TILE_CHOICES = [8, 12, 16];
const FILL = "EEEEEAAAAIIIOOOTTTNNNSSSRRRLLDDHHCMPUGBYWF";
const rl = () => FILL[Math.random() * FILL.length | 0];
const lettersOf = w => String(w || "").toUpperCase().replace(/[^A-Z]/g, "");
const BK_SVG = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m16 10-4 4m0-4 4 4"/></svg>';
const modeOf = o => (MODES.includes(o && o.wsMode) ? o.wsMode : "one");
const tilesOf = o => (TILE_CHOICES.includes(+(o && o.wsTiles)) ? +o.wsTiles : 12);

const wordshakeTemplate = {
  type: "wordshake",
  scorable: true,
  itemsKey: "items",
  name: "Wordshake",
  hasSloganSlot: true,
  checkOrder: ["shuffle", "showAnswers"],
  edit: openWordshakeEditor,

  // Mode 3 checks free words against the dictionary — load it while READY is on screen.
  prepare(activity) {
    return modeOf(activity.options) === "free" ? loadDict() : Promise.resolve();
  },

  toPrintItems(activity) {
    return (activity.content?.items || []).map(it => ({ clue: it.clue || "", answer: it.word || "" }));
  },

  buildExtraOptions({ panel, draft }) {
    const cur = modeOf(draft);
    const modeCell = mkCell({ label: "Wordshake mode", wide: true });
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
    if (ui.sloganSlot) ui.sloganSlot.textContent = "WORDSHAKE IN ANDREW CLASSES";
    const opt = activity.options || {};
    const mode = modeOf(opt);
    const sfx = createSfx();
    const voicePlayer = createVoicePlayer();
    ui.setVoiceGuard?.(() => voicePlayer.isPlaying());

    let items = [...(activity.content?.items || [])]
      .filter(it => it && lettersOf(it.word).length >= 2)
      .map(it => ({ word: String(it.word).trim(), up: lettersOf(it.word), clue: it.clue || "", voice: it.voice, hideText: it.hideText, src: it }));
    if (opt.shuffleQuestions) items = shuffle(items);
    const total = items.length;
    root.innerHTML = "";
    const wrap = el("div", "aw-ws-root aw-ws-m-" + mode);
    root.append(wrap);
    if (!total) { wrap.append(el("div", "aw-ws-empty", "This Wordshake has no words yet.")); return () => {}; }

    const st = items.map(() => ({ solved: false, tries: 0, typed: null }));
    let score = 0, finished = false, dead = false, firstVoice = true;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

    ui.onSubmit(() => finish());
    ui.setReviewProvider?.(() => buildReview());
    wrap.addEventListener("pointerdown", onDown);

    // ---------------- clue (text or voice) ----------------
    function clueNode(it, big) {
      const box = el("div", "aw-ws-clue" + (big ? " is-big" : ""));
      const vv = voiceView(activity, it);
      if (vv.hasVoice) {
        const btn = el("button", "aw-voicebtn" + (vv.hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        btn.type = "button"; btn.setAttribute("aria-label", "Listen");
        btn.dataset.voice = "1";
        btn.addEventListener("click", e => { e.stopPropagation(); voicePlayer.toggle(it.voice, btn); });
        if (!vv.hideText) box.append(el("span", "aw-ws-cluetext", esc(it.clue)));
        box.append(btn);
        return { box, btn, auto: vv.autoPlay };
      }
      box.append(el("span", "aw-ws-cluetext", esc(it.clue || "")));
      return { box, btn: null, auto: false };
    }
    function autoPlay(it, c) {
      if (!c.btn || !c.auto) return;
      voicePlayer.playDelayed(it.voice, c.btn, firstVoice ? DEFAULT_INTRO_DELAY_MS : 0);
      firstVoice = false;
    }

    // ---------------- bubbles ----------------
    function bubble(host, kind, sym) {
      const b = el("div", "aw-ws-bub " + kind); b.innerHTML = `<i>${esc(sym)}</i>`;
      host.append(b); later(() => b.remove(), 1300);
    }
    const tile = (ch, attrs, cls = "") => `<button type="button" class="aw-ws-t ${cls}" ${attrs}>${esc(ch)}</button>`;
    const blanks = n => Array(n).fill("_").join(" ");

    // =============================================================
    // MODE 1 — one word at a time
    // =============================================================
    const M1 = { i: 0, board: [], slots: [], state: "", lock: false };
    function m1Deal() {
      const it = items[M1.i];
      const L = it.up.split("");
      const n = Math.max(tilesOf(opt), L.length + 2);
      while (L.length < n) L.push(rl());
      M1.board = shuffle(L).map(ch => ({ ch, used: false }));
      M1.slots = Array(it.up.length).fill(null);
      M1.state = ""; M1.lock = false;
    }
    function m1Render() {
      voicePlayer.stop();
      const it = items[M1.i];
      wrap.innerHTML = "";
      const c = clueNode(it, true);
      const slots = el("div", "aw-ws-slots " + M1.state);
      slots.style.setProperty("--n", String(M1.slots.length));
      slots.innerHTML = M1.slots.map((k, j) => k == null ? `<div class="aw-ws-slot"></div>`
        : `<button type="button" class="aw-ws-slot is-full" data-do="slot" data-j="${j}">${esc(M1.board[k].ch)}</button>`).join("");
      const grid = el("div", "aw-ws-grid1");
      grid.style.setProperty("--cols", String(Math.min(8, Math.ceil(M1.board.length / 2))));
      grid.innerHTML = M1.board.map((b, k) => tile(b.ch, `data-do="t1" data-k="${k}"`, b.used ? "is-gone" : "")).join("");
      const body = el("div", "aw-ws-one");
      body.append(c.box, slots, grid, el("div", "aw-ws-bubs"));
      wrap.append(body);
      ui.setScore(score);
      ui.setNav({ index: M1.i + 1, total, onPrev: null, onNext: m1Skip, nextLabel: M1.i + 1 >= total ? icons.check : undefined });
      autoPlay(it, c);
    }
    function m1Patch() {        // mid-word taps redraw only the two rows (no fade, no clue replay)
      const slots = wrap.querySelector(".aw-ws-slots"), grid = wrap.querySelector(".aw-ws-grid1");
      if (!slots || !grid) return m1Render();
      slots.className = "aw-ws-slots " + M1.state;
      slots.innerHTML = M1.slots.map((k, j) => k == null ? `<div class="aw-ws-slot"></div>`
        : `<button type="button" class="aw-ws-slot is-full" data-do="slot" data-j="${j}">${esc(M1.board[k].ch)}</button>`).join("");
      grid.innerHTML = M1.board.map((b, k) => tile(b.ch, `data-do="t1" data-k="${k}"`, b.used ? "is-gone" : "")).join("");
    }
    function m1Check() {
      const it = items[M1.i], s = st[M1.i];
      const guess = M1.slots.map(k => M1.board[k].ch).join("");
      M1.lock = true; s.tries++; s.typed = guess;
      if (guess === it.up) {
        s.solved = true; score++; M1.state = "is-good"; m1Patch(); ui.setScore(score);
        sfx.ok(0, 2); bubble(wrap.querySelector(".aw-ws-bubs"), "ok", "+1");
        later(m1Next, 850);
      } else {
        M1.state = "is-bad"; m1Patch(); sfx.bad(0);
        later(() => { M1.board.forEach(b => b.used = false); M1.slots.fill(null); M1.state = ""; M1.lock = false; m1Patch(); }, 650);
      }
    }
    function m1Next() { if (M1.i + 1 >= total) return finish(); M1.i++; m1Deal(); m1Render(); sfx.next(); }
    function m1Skip() { if (M1.lock) return; m1Next(); }

    // =============================================================
    // MODE 2 — fixed board, keys, clue list
    // =============================================================
    const M2 = { rounds: [], r: 0, input: "", lock: false };
    function m2Build() {
      const rounds = []; let cur = [], set = new Set();
      items.forEach((it, idx) => {
        const u = new Set([...set, ...it.up]);
        if (cur.length && (u.size > 16 || cur.length >= 5)) { rounds.push({ idx: cur, set }); cur = []; set = new Set(); }
        cur.push(idx); set = new Set([...set, ...it.up]);
      });
      if (cur.length) rounds.push({ idx: cur, set });
      rounds.forEach(r => {
        const L = [...r.set]; let g = 0;
        while (L.length < 16 && g++ < 400) { const c = rl(); if (!L.includes(c)) L.push(c); }
        r.letters = shuffle(L);
      });
      M2.rounds = rounds;
    }
    function m2Render() {
      voicePlayer.stop();
      const R = M2.rounds[M2.r];
      wrap.innerHTML = "";
      const left = el("div", "aw-ws-pad");
      left.innerHTML = `<div class="aw-ws-pv">${esc(M2.input)}</div>
        <div class="aw-ws-grid4">${R.letters.map(ch => tile(ch, `data-do="key" data-c="${ch}"`)).join("")}</div>
        <div class="aw-ws-btns is-3"><button type="button" class="aw-ws-b is-bk" data-do="bk" aria-label="Delete letter">${BK_SVG}</button><button type="button" class="aw-ws-b is-clr" data-do="clr2"><span>Clear</span></button><button type="button" class="aw-ws-b is-ent" data-do="ent2"><span>Enter</span></button></div>
        <div class="aw-ws-bubs"></div>`;
      const list = el("div", "aw-ws-defs");
      R.idx.forEach(idx => list.append(defRow(idx)));
      const body = el("div", "aw-ws-split");
      body.append(left, list);
      wrap.append(body);
      ui.setScore(score);
      ui.setNav({ label: `${M2.r + 1} of ${M2.rounds.length}`, onPrev: null, onNext: m2NextBoard, nextLabel: M2.r + 1 >= M2.rounds.length ? icons.check : undefined });
    }
    function defRow(idx) {
      const it = items[idx], s = st[idx];
      const row = el("div", "aw-ws-df" + (s.solved ? " is-done" : ""));
      const c = clueNode(it, false);
      row.append(c.box, el("div", "aw-ws-bl", s.solved ? esc(it.word.toUpperCase()) : blanks(it.up.length)));
      return row;
    }
    function m2PatchInput() { const pv = wrap.querySelector(".aw-ws-pv"); if (pv) pv.textContent = M2.input; }
    function m2Submit() {
      const w = M2.input; if (!w) return; M2.input = ""; m2PatchInput();
      const R = M2.rounds[M2.r], host = wrap.querySelector(".aw-ws-bubs");
      const idx = R.idx.find(i => items[i].up === w);
      if (idx == null) { sfx.bad(0); bubble(host, "bad", "?"); R.idx.forEach(i => { if (!st[i].solved) st[i].tries++; }); return; }
      if (st[idx].solved) { sfx.dup(0); bubble(host, "dup", "Found"); return; }
      st[idx].solved = true; st[idx].typed = w; score++;
      sfx.ok(0, 2); m2Render(); bubble(wrap.querySelector(".aw-ws-bubs"), "ok", "+1");
      if (R.idx.every(i => st[i].solved)) later(m2NextBoard, 900);
    }
    function m2NextBoard() {
      if (M2.r + 1 >= M2.rounds.length) return finish();
      M2.r++; M2.input = ""; m2Render(); sfx.next();
    }

    // =============================================================
    // MODE 3 — free words, lesson words hidden (×2)
    // =============================================================
    // `score` (the ✓ chip, what an assignment submits) = lesson words found; `pts` =
    // the game's word points (free words + lesson ×2), shown beside the found list.
    const M3 = { boards: [], b: 0, letters: [], sel: [], found: [], dict: null, pts: 0 };
    function m3Build() {
      // Deal the lesson words into boards: each board holds ≤3 words whose
      // letters (as a multiset) fit in 12 tiles, leaving room for everyday letters.
      const left = items.map((_, i) => i).filter(i => items[i].up.length <= 12);
      const boards = [];
      while (left.length) {
        let need = {}; const idx = [];
        for (let k = 0; k < left.length && idx.length < 3; k++) {
          const c = countOf(items[left[k]].up), nx = { ...need };
          for (const ch in c) nx[ch] = Math.max(nx[ch] || 0, c[ch]);
          if (Object.values(nx).reduce((a, b) => a + b, 0) <= 12) { need = nx; idx.push(left[k]); left.splice(k, 1); k--; }
        }
        if (!idx.length) idx.push(left.shift());
        boards.push(idx);
      }
      M3.boards = boards;
      items.forEach((it, i) => { if (it.up.length > 12) st[i].tooLong = true; });
    }
    function m3Deal() {
      const idx = M3.boards[M3.b];
      let need = {};
      idx.forEach(i => { const c = countOf(items[i].up); for (const ch in c) need[ch] = Math.max(need[ch] || 0, c[ch]); });
      const L = []; for (const ch in need) for (let k = 0; k < need[ch]; k++) L.push(ch);
      const vowels = () => L.filter(c => "AEIOU".includes(c)).length;
      while (L.length < 16) L.push(vowels() < 5 ? "AEIOEA"[Math.random() * 6 | 0] : "TNSRLHDC"[Math.random() * 8 | 0]);
      M3.letters = shuffle(L.slice(0, Math.max(16, L.length)));
      M3.sel = []; M3.found = [];
    }
    function m3Render() {
      voicePlayer.stop();
      const idx = M3.boards[M3.b];
      wrap.innerHTML = "";
      const left = el("div", "aw-ws-pad");
      const word = M3.sel.map(k => M3.letters[k]).join("");
      left.innerHTML = `<div class="aw-ws-pv">${esc(word)}</div>
        <div class="aw-ws-grid4">${M3.letters.map((ch, k) => tile(ch, `data-do="t3" data-k="${k}"`, M3.sel.includes(k) ? "is-on" : "")).join("")}</div>
        <div class="aw-ws-btns"><button type="button" class="aw-ws-b is-clr" data-do="clr3"><span>Clear</span></button><button type="button" class="aw-ws-b is-ent" data-do="ent3"><span>Enter</span></button></div>
        <div class="aw-ws-bubs"></div>`;
      const right = el("div", "aw-ws-side");
      const list = el("div", "aw-ws-defs is-short");
      idx.forEach(i => list.append(defRow(i)));
      const found = el("ol", "aw-ws-found");
      right.append(el("div", "aw-ws-pts", `PTS <b>${M3.pts}</b>`));
      found.innerHTML = M3.found.map(f => `<li class="${f.les ? "is-les" : ""}"><b>${esc(f.w.toUpperCase())}</b>${f.m ? `<span>${esc(f.m)}</span>` : ""}<em>+${f.p}</em></li>`).join("");
      right.append(list, found);
      const body = el("div", "aw-ws-split");
      body.append(left, right);
      wrap.append(body);
      ui.setScore(score);
      ui.setNav({ label: `${M3.b + 1} of ${M3.boards.length}`, onPrev: null, onNext: m3NextBoard, nextLabel: M3.b + 1 >= M3.boards.length ? icons.check : undefined });
    }
    function m3PatchPad() {
      const pv = wrap.querySelector(".aw-ws-pv"), g = wrap.querySelector(".aw-ws-grid4");
      if (!pv || !g) return m3Render();
      pv.textContent = M3.sel.map(k => M3.letters[k]).join("");
      g.querySelectorAll(".aw-ws-t").forEach(t => t.classList.toggle("is-on", M3.sel.includes(+t.dataset.k)));
    }
    function m3Submit() {
      const w = M3.sel.map(k => M3.letters[k]).join(""); M3.sel = [];
      if (!w) return;
      const idx = M3.boards[M3.b];
      const lesIdx = idx.find(i => items[i].up === w);
      const lw = w.toLowerCase();
      let bub;
      if (M3.found.some(f => f.w === lw)) { bub = ["dup", "Found"]; sfx.dup(0); }
      else if (lesIdx != null) {
        const p = points(Math.min(7, Math.max(3, w.length))) * 2;
        st[lesIdx].solved = true; st[lesIdx].typed = w; score++; M3.pts += p;
        M3.found.unshift({ w: lw, m: voiceView(activity, items[lesIdx]).hideText ? "" : items[lesIdx].clue, les: true, p });
        bub = ["ok", "+" + p]; sfx.ok(0, 5);
      } else {
        const hit = lookup(M3.dict, lw);
        if (!hit) { bub = ["bad", "?"]; sfx.bad(0); }
        else { const p = points(w.length); M3.pts += p; M3.found.unshift({ w: lw, m: hit.m, les: false, p }); bub = ["ok", "+" + p]; sfx.ok(0, p); }
      }
      m3Render(); bubble(wrap.querySelector(".aw-ws-bubs"), ...bub);
      if (idx.every(i => st[i].solved)) later(m3NextBoard, 1100);
    }
    function m3NextBoard() {
      if (M3.b + 1 >= M3.boards.length) return finish();
      M3.b++; m3Deal(); m3Render(); sfx.next();
    }

    // ---------------- input ----------------
    function onDown(e) {
      const b = e.target.closest("[data-do]"); if (!b || finished) return;
      const d = b.dataset.do;
      sfx.unlock();
      if (mode === "one") {
        if (M1.lock) return;
        if (d === "t1") {
          const k = +b.dataset.k, j = M1.slots.indexOf(null);
          if (j < 0 || M1.board[k].used) return;
          M1.slots[j] = k; M1.board[k].used = true; sfx.tap(0); m1Patch();
          if (!M1.slots.includes(null)) m1Check();
        } else if (d === "slot") {
          const j = +b.dataset.j, k = M1.slots[j]; if (k == null) return;
          M1.board[k].used = false; M1.slots[j] = null; sfx.untap(0); m1Patch();
        }
      } else if (mode === "list") {
        if (d === "key") { if (M2.input.length < 16) { M2.input += b.dataset.c; sfx.tap(0); m2PatchInput(); } }
        else if (d === "bk") { M2.input = M2.input.slice(0, -1); sfx.untap(0); m2PatchInput(); }
        else if (d === "clr2") { if (M2.input) sfx.clear(0); M2.input = ""; m2PatchInput(); }
        else if (d === "ent2") m2Submit();
      } else {
        if (d === "t3") { const k = +b.dataset.k, i = M3.sel.indexOf(k); if (i >= 0) { M3.sel.splice(i, 1); sfx.untap(0); } else { M3.sel.push(k); sfx.tap(0); } m3PatchPad(); }
        else if (d === "clr3") { if (M3.sel.length) sfx.clear(0); M3.sel = []; m3PatchPad(); }
        else if (d === "ent3") m3Submit();
      }
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
      const res = { correct, incorrect: total - correct, total, items: total, perQuestion, review, answered: review.filter(r => r.answered).length };
      ui.finish(res);
    }

    // ---------------- start ----------------
    if (mode === "one") { m1Deal(); m1Render(); }
    else if (mode === "list") { m2Build(); m2Render(); }
    else {
      loadDict().then(d => { if (dead) return; M3.dict = d; }).catch(() => {});
      m3Build(); m3Deal(); m3Render();
    }

    return function cleanup() {
      dead = true;
      timers.forEach(clearTimeout); timers.clear();
      voicePlayer.stop();
      wrap.removeEventListener("pointerdown", onDown);
      sfx.dispose();
    };
  }
};

registerTemplate(wordshakeTemplate);
