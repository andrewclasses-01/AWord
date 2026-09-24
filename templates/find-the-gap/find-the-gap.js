// =============================================================
// TEMPLATE: FIND THE GAP — thầy's own design (18/9/2026), not a Wordwall game.
//
// A listening gap-fill. ONE ITEM = ONE SPOKEN LINE of a real listening
// passage (LSA2/LSB1/IEL… mp3 in the public myLesson-audio store). The line
// shows at the top with its gaps ("___" boxes numbered ₁ ₂ …), the matching
// slice of the audio plays by itself, and the class fills the gaps IN ORDER
// (₁ then ₂ …). Answers / keyboard / tiles are on screen from the first
// frame and usable while the audio is still playing (thầy, bản 2 of the
// design). Listen again is unlimited (🔊 at the top right).
//
// THREE ANSWER MODES (options.mode):
//   "quiz" — up to 6 word tiles per gap (Quiz look); distractors come from
//            the other gaps of the same activity, most look-alike first
//   "type" — the shared on-screen keyboard (core/keyboard.js) + one input box
//            per gap; Submit grades the CURRENT box
//   "find" — EVERY gap word of the activity as one big tile grid (Find the
//            match look), ≤35 tiles per page; the items of a page are played
//            before the next page appears
//
// SCORING (options.scoring): "gap" = one point per gap · "sentence" = one
// point per line, all of its gaps right. Points off / Lives / Time cost /
// Time each round are the shared core mechanisms.
//
// FIGHT / SHOWDOWN: opt-in like Quiz (fightMode/showdownMode/sdDeal). In a
// match every mark that says WHICH word was right is withheld until the
// referee's reveal(); only board 0 owns the <audio> (ctl.speaks), the other
// board mirrors its 🔊 state. "In turns" is NOT declared — two boards
// playing two different slices at once is the open voice issue in
// core/HUONG DAN CORE.md.
//
// AUDIO: the whole mp3 is downloaded before PLAY (tpl.prepare → % bar) and
// kept in Cache Storage for a day; seeks are then instant on any network
// (measured, see ftg-audio.js). ☰ pause reaches it through tpl.onPause.
//
// Everything else follows templates/CONG THUC MAU.md: --aw-u sizing, lives
// in ui.livesSlot, ui.flyPenalty for "-N", `dead` flag + timer set in
// cleanup(), review rows with `src` for Start with mistakes.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { createKeyboard } from "../../core/keyboard.js";
import { openFtgEditor } from "./find-the-gap-editor.js";
import { ftgSound } from "./ftg-sound.js";
import { loadAudio, createSegmentPlayer } from "./ftg-audio.js";
import { mkRangeCell } from "./ftg-range.js";
import {
  normalizeItems, answersOf, isRightAnswer, buildChoices, answerPool, gapEnd, gappable,
  audioUrlOf, escapeHtml, MAX_CHOICES, MIN_CHOICES
} from "./ftg-shared.js";

const PALETTE = [
  { c: "#3b82f6", d: "#2563eb" }, // blue
  { c: "#06b6d4", d: "#0e93ad" }, // cyan
  { c: "#10b981", d: "#059669" }, // emerald
  { c: "#f59e0b", d: "#d97706" }, // amber
  { c: "#f97316", d: "#ea580c" }, // orange
  { c: "#ef4444", d: "#dc2626" }, // red
  { c: "#14b8a6", d: "#0f9488" }, // teal
  { c: "#8b5cf6", d: "#7c3aed" }  // violet
];
const MAX_LIVES = 10;
const FIND_PAGE_MAX = 35;    // tiles per page in FIND mode (Find the match's ceiling)
const FIND_ROWS = 5;
const INTRO_DELAY_MS = 700;  // let the PLAY chime finish before the first line speaks

// ☰ Menu pause bridge (see core/HUONG DAN CORE.md "MENU PAUSE" §3) — the
// engine pauses sfx packs + WAAPI animations itself, but the passage is a
// bare <audio> owned by the current mount. Module-level single: AWord only
// mounts one activity at a time.
let ftgPauseHandlers = null;

// ⭐ FIGHT SCORING (thầy, 18/9/2026): "ai điền được NHIỀU ô hơn thì được điểm —
// cả hai cùng 1/2 thì mỗi bên 1 điểm; 1/2 với 2/2 thì bên 2/2 được, bên kia
// không". The referee (core/fight.js) only knows right/wrong per board and who
// is ALLOWED to score; the number itself is the template's. Both boards run in
// this same module, so they share ONE ledger of "gaps right per side, per
// round" and each board settles its own point at reveal(). Board 0 mounts
// first and opens a fresh ledger for its referee; board 1 joins it.
let ftgFightLedger = null;   // { ctl, rounds: Map<index, [hits0, hits1]>, gaps: Map<lineKey, gaps[]> } — gaps: both boards MUST blank the same words
// ⭐ Đợt 365 (thầy, 20/9/2026 — ảnh 2 bàn khoét KHÁC từ dù cùng Random gaps): the
// ledger used to be re-opened by whichever mount had `side === 0`. Since Đợt 356
// each board has its own ▶, so board 1 can mount FIRST (it blanks, writes the
// ledger) and board 0 then wiped it and blanked again on its own. Now the ledger
// is opened once per MATCH (a new referee `ctl` = a new match, Start again
// included) by whichever board mounts first, and the other one simply reads it.
// The key is the line's text + slice, not the object: begin() re-resolves the
// act on every ▶, so an object identity is not something to lean on.
const ftgLineKey = it => it.text + "\u0001" + it.start + "\u0001" + it.end;

function normLives(v) {
  if (v === 0 || v === null || v === undefined || v === "") return null;   // unlimited
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(n)));
}
function normMode(v) { return v === "type" || v === "find" ? v : "quiz"; }
// Thầy (18/9): một câu 2 chỗ trống phải đúng CẢ HAI mới được 1 điểm ⇒ mặc định "sentence"
function normScoring(v) { return v === "gap" ? "gap" : "sentence"; }
const MAX_GAPS = 10;
// options.minGaps / options.maxGaps → the GAPS range [lo, hi] (1..10). An act
// saved before Đợt 365 has only minGaps (the old "Min gaps" slider): its hi is
// the top of the scale, exactly what thầy chose for old acts.
function normGapRange(minV, maxV) {
  const cl = (v, d) => { const n = Number(v); return Number.isFinite(n) && v !== null && v !== "" ? Math.min(MAX_GAPS, Math.max(1, Math.round(n))) : d; };
  const lo = cl(minV, 1);
  const hi = Math.max(lo, cl(maxV, MAX_GAPS));
  return { lo, hi };
}

// ⭐ Thầy (18/9 vòng 4; Đợt 365 20/9) — LUẬT VỀ CHỖ TRỐNG LÚC CHƠI:
//  • GAPS [lo..hi] (options.minGaps / maxGaps, thanh 2 nút): SỐ chỗ trống mỗi câu. lo = hi
//    ⇒ đúng N chỗ; lo < hi ⇒ mỗi câu, mỗi ván bốc một số trong khoảng. Thanh QUYẾT ĐỊNH
//    hoàn toàn (thầy chốt 20/9): có thể ÍT hơn số thầy/CLI đã khoét sẵn; câu có ít từ khoét
//    được hơn N thì khoét HẾT.
//  • options.randomGaps: mỗi ván (kể cả Start again) VỊ TRÍ chỗ trống được bốc LẠI ngẫu nhiên
//    — cùng một câu, lần này trống từ này, lần sau trống từ khác — để em phải NGHE thật chứ
//    không nhớ vẹt. Cụm thầy khoét vẫn là một "đơn vị" có thể được bốc; ưu tiên từ ≥ 3 chữ,
//    chỉ động tới "a/the/I" khi hết từ dài.
//  • Random TẮT: chọn ĐỊNH TRƯỚC — chỗ thầy khoét đi trước (từ dài trước, cùng dài thì đứng
//    trước), rồi tới từ tự do dài trước — nên cùng một SỐ thì ván nào cũng cùng một bộ.
//  `gap.choices` chỉ theo chỗ trống thầy đặt; chỗ khoét thêm dùng nhiễu tự sinh (buildChoices).
//  FIGHT: bàn mount trước gọi hàm này rồi ghi sổ chung, bàn kia đọc lại (xem ftgFightLedger).
function applyGapPolicy(it, { minGaps, maxGaps = minGaps, randomGaps, rnd = Math.random }) {
  const covered = new Set();
  it.gaps.forEach(g => { for (let i = g.word; i <= gapEnd(g); i++) covered.add(i); });
  // every gappable token outside the teacher's gaps is a one-word candidate unit
  const free = [];
  it.tokens.forEach((t, i) => { if (!covered.has(i) && gappable(t)) free.push({ word: i, span: 1, answers: [], choices: [], len: t.core.length }); });
  const units = it.gaps.length + free.length;
  const lo = Math.max(1, minGaps | 0), hi = Math.max(lo, maxGaps | 0);
  const want = lo === hi ? lo : lo + Math.floor(rnd() * (hi - lo + 1));
  const need = Math.min(units, want);
  const byLen = (a, b) => (b.len - a.len) || (a.word - b.word);
  let chosen;
  if (randomGaps) {
    const all = [...it.gaps.map(g => ({ ...g, len: 99 })), ...free];
    // long words first (>= 3 letters), so "the"/"a" only get blanked when nothing else is left
    const long = all.filter(u => u.len >= 3), short = all.filter(u => u.len < 3);
    const pickFrom = (arr, k) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };
    chosen = pickFrom(long, need);
    if (chosen.length < need) chosen = chosen.concat(pickFrom(short, need - chosen.length));
  } else {
    const teacher = it.gaps.map(g => ({ ...g, len: it.tokens.slice(g.word, gapEnd(g) + 1).reduce((n, t) => n + t.core.length, 0) })).sort(byLen);
    chosen = [...teacher, ...free.sort(byLen)].slice(0, need);
  }
  return chosen.map(({ len, ...g }) => g).sort((a, b) => a.word - b.word);
}

function normChoices(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(MAX_CHOICES, Math.max(MIN_CHOICES, Math.round(n))) : MAX_CHOICES;
}

// The line with its gaps as blanks — for Print and the Show answers question column.
function gappedText(it) {
  const out = [];
  for (let i = 0; i < it.tokens.length; i++) {
    const g = it.gaps.find(x => x.word === i);
    if (!g) { out.push(it.tokens[i].raw); continue; }
    const last = it.tokens[gapEnd(g)];
    out.push(it.tokens[i].lead + "_____" + (last ? last.trail : ""));
    i = gapEnd(g);
  }
  return out.join(" ");
}

const ftgTemplate = {
  type: "find_the_gap",
  scorable: true,
  name: "Find the gap",
  timeCost: true,
  itemsKey: "items",
  hasLivesSlot: true,
  hasKeyboardToggle: true,   // the ⌨ button next to Menu — only filled in TYPE mode
  showdownMode: true,
  sdDeal: true,
  fightMode: true,
  checkOrder: ["shuffle", "randomGaps", "removeCorrects", "showAnswers", "allowSkip", "speakerNames"],

  toPrintItems(activity) {
    return normalizeItems(activity.content).map(it => ({
      clue: (it.speaker ? it.speaker + ": " : "") + gappedText(it),
      answer: it.gaps.map(g => answersOf(it, g)[0]).join(" · ")
    }));
  },

  edit: openFtgEditor,

  sounds: {
    play: ftgSound.intro,
    restart: ftgSound.restart,
    complete: () => {}   // finish() picks Completed / GameOver itself
  },

  // Download the passage before PLAY shows — the % bar stands where PLAY will
  // be (core engine, Đợt 108). A failed download still resolves: PLAY must
  // never be withheld for good; the game retries on demand when a line plays.
  prepare(activity, onProgress) {
    const url = audioUrlOf(activity.content?.audio);
    if (!url) return Promise.resolve();
    const fmtMB = n => (n / 1048576).toFixed(1);
    return loadAudio(url, p => {
      if (!onProgress) return;
      const pct = p.total ? Math.round((p.loaded / p.total) * 100) : 0;
      onProgress({ percent: pct, text: p.total ? `Loading audio… ${fmtMB(p.loaded)} / ${fmtMB(p.total)} MB` : "Loading audio…" });
    }).catch(() => { onProgress && onProgress({ percent: 100, text: "Audio will load when the game starts" }); });
  },

  onPause(paused) {
    if (!ftgPauseHandlers) return;
    if (paused) ftgPauseHandlers.pause(); else ftgPauseHandlers.resume();
  },

  buildExtraOptions({ panel, draft, mkSliderCell, mkSeg, mkCell, addCheck }) {
    // Cells that only mean something in ONE mode are greyed (not hidden) in the
    // others — core's `.is-locked` look, the same one Fight's panel uses. Thầy
    // (18/9 vòng 4): Choices ↔ Quiz only, Remove corrects ↔ Find only.
    const setLocked = (node, on) => { if (!node) return; node.classList.toggle("is-locked", on); node.querySelectorAll("input, button, select").forEach(c => { c.disabled = on; }); };
    let choicesCell = null, removeWrap = null;
    const syncMode = v => { setLocked(choicesCell, v !== "quiz"); setLocked(removeWrap, v !== "find"); };
    const mode = mkCell({ label: "Mode" });
    mode.ctl.append(mkSeg([
      { value: "quiz", label: "Quiz", title: "Tap one of the word tiles" },
      { value: "type", label: "Type", title: "Type the word on the keyboard" },
      { value: "find", label: "Find", title: "Find the word in the big grid of every answer" }
    ], normMode(draft.mode), v => { draft.mode = v; syncMode(v); }));

    const scoring = mkCell({ label: "Scoring" });
    scoring.ctl.append(mkSeg([
      { value: "gap", label: "Each gap", title: "One point for every gap filled right" },
      { value: "sentence", label: "Each sentence", title: "One point per line — every gap in it must be right" }
    ], normScoring(draft.scoring), v => { draft.scoring = v; }));

    const choices = mkSliderCell({
      label: "Choices", sub: "quiz", min: MIN_CHOICES, max: MAX_CHOICES, step: 1,
      value: normChoices(draft.choices), tone: "blue",
      fmt: v => String(v),
      onInput: v => { draft.choices = v; }
    });
    choices.cell.title = "Quiz mode: how many word tiles each gap offers (fewer when the activity has too few words)";
    choicesCell = choices.cell;

    // ⭐ Đợt 365 — GAPS: a two-thumb range (ftg-range.js). Thumbs together = an
    // exact count; apart = each line draws a count in between, every play.
    const range = normGapRange(draft.minGaps, draft.maxGaps);
    const gapsCell = mkRangeCell({
      mkCell, label: "Gaps", sub: "per line", min: 1, max: MAX_GAPS, lo: range.lo, hi: range.hi, tone: "blue",
      onInput: (lo, hi) => { draft.minGaps = lo; draft.maxGaps = hi; }
    });
    gapsCell.cell.title = "How many gaps each line gets. Two thumbs on one number = exactly that many; apart = a random count in between for every line, every play. A line with fewer words is blanked completely";

    const curLives = normLives(draft.lives) || 0;
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: curLives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }
    });
    lives.cell.title = "0 = unlimited lives";

    panel.append(mode.cell, scoring.cell, choices.cell, gapsCell.cell, lives.cell);

    addCheck("Random gaps", draft.randomGaps === true, v => { draft.randomGaps = v; },
      { key: "randomGaps", title: "Every play (Start again too) blanks DIFFERENT words of the same line — for real listening, not memory" });
    removeWrap = addCheck("Remove corrects", draft.removeCorrects !== false, v => { draft.removeCorrects = v; },
      { key: "removeCorrects", title: "Find mode: a tile that was answered right disappears (on) or stays on the board (off), like Find the match" });
    syncMode(normMode(draft.mode));
    addCheck("Allow skip", draft.allowSkip === true, v => { draft.allowSkip = v; },
      { key: "allowSkip", title: "Let › move on before every gap of the line is filled" });
    addCheck("Speaker names", draft.speakerNames !== false, v => { draft.speakerNames = v; },
      { key: "speakerNames", title: "Show who is speaking (Male / Female / Paul…) above the line" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = normMode(opt.mode);
    const scoring = normScoring(opt.scoring);
    const nChoices = normChoices(opt.choices);
    const pointsOff = Math.max(0, Math.min(100, Number(opt.pointsOff) || 0));
    const allowSkip = opt.allowSkip === true;
    const showSpeaker = opt.speakerNames !== false;
    const removeCorrects = opt.removeCorrects !== false;   // FIND: solved tiles vanish (default) or stay

    // ----- FIGHT MODE (opt-in, same pattern as quiz.js) -----
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    let fightPendingReveal = false;   // this board answered, marks withheld until reveal()
    const speaks = () => !fightCtl || fightCtl.speaks(fightSide);
    if (fightCtl && (!ftgFightLedger || ftgFightLedger.ctl !== fightCtl)) ftgFightLedger = { ctl: fightCtl, rounds: new Map(), gaps: new Map() };
    const fightRound = i => { const L = ftgFightLedger; if (!L.rounds.has(i)) L.rounds.set(i, [0, 0]); return L.rounds.get(i); };

    let items = normalizeItems(activity.content);
    // A dealt (Showdown) list must keep its order — one rule, one place (ui.keepItemOrder).
    if (opt.shuffleQuestions && !ui.keepItemOrder?.()) items = shuffle(items);
    // GAPS range / Random gaps (see applyGapPolicy). In a FIGHT both boards must
    // blank the SAME words (and the same NUMBER of them): the board that mounts
    // FIRST decides, the other takes the layout from the shared ledger (keyed by
    // ftgLineKey — see its note).
    const { lo: minGaps, hi: maxGaps } = normGapRange(opt.minGaps, opt.maxGaps);
    const randomGaps = opt.randomGaps === true;
    items = items.map(it => {
      const key = ftgLineKey(it);
      if (fightCtl && ftgFightLedger.gaps.has(key)) return { ...it, gaps: ftgFightLedger.gaps.get(key) };
      const gaps = applyGapPolicy(it, { minGaps, maxGaps, randomGaps });
      if (fightCtl) ftgFightLedger.gaps.set(key, gaps);
      return { ...it, gaps };
    });
    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-ftg-empty", "This activity has no lines with gaps yet."));
      return () => {};
    }
    const pool = answerPool(items);
    const palette = shuffle(PALETTE);

    // Per-item state. `cur` = which gap is being filled right now.
    const state = items.map(it => ({
      done: it.gaps.map(() => false), chosen: it.gaps.map(() => null), ok: it.gaps.map(() => false),
      typed: it.gaps.map(() => ""), cur: 0, settled: false, correct: false, timedOut: false,
      points: 0, scored: false   // FIGHT only: the round's point, settled at reveal()
    }));
    const gapTotal = items.reduce((n, it) => n + it.gaps.length, 0);
    const scoreTotal = scoring === "gap" ? gapTotal : total;

    // FIND mode pages: consecutive items grouped so a page never holds more
    // than FIND_PAGE_MAX tiles (one tile per gap). Other modes: one page.
    const pages = [];
    if (mode === "find") {
      let cur = [], n = 0;
      items.forEach((it, i) => {
        if (cur.length && n + it.gaps.length > FIND_PAGE_MAX) { pages.push(cur); cur = []; n = 0; }
        cur.push(i); n += it.gaps.length;
      });
      if (cur.length) pages.push(cur);
    } else pages.push(items.map((_, i) => i));
    const pageOf = itemIdx => pages.findIndex(p => p.includes(itemIdx));
    // tiles of each page, shuffled once per mount (a Fight board shuffles its own)
    const pageTiles = pages.map(p => shuffle(p.flatMap(i => items[i].gaps.map((g, k) => ({ item: i, gap: k, text: answersOf(items[i], g)[0] })))));
    let findCols = 1, findColW = 15;
    if (mode === "find") {
      const maxTiles = Math.max(...pageTiles.map(t => t.length));
      findCols = Math.max(1, Math.ceil(maxTiles / FIND_ROWS));
      findColW = Math.min(15, 90 / findCols);
    }

    let index = 0, finished = false, ending = false, dead = false, animating = false;
    // ⚠️ declared HERE, above every call — a `let` further down is the TDZ trap
    // (core/HUONG DAN CORE.md Đợt 192/256): showItemNow(0) runs before RENDER.
    let tiles = [];           // QUIZ / FIND: { tile, textEl, text, item?, gap? }
    let inputs = [];          // TYPE: one box per gap
    let ro = null, fitRaf = 0;   // ResizeObserver + its rAF handle (declared up here: renderArea runs before the observer exists)
    let livesLeft = normLives(opt.lives);
    let penalty = 0;
    let curPage = -1;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const clearLater = t => { clearTimeout(t); timers.delete(t); };
    let autoTimer = null;
    const clearAutoTimer = () => { if (autoTimer) { clearLater(autoTimer); autoTimer = null; } };

    // ----- score -----
    function scoreNow() {
      const base = fightCtl
        ? state.reduce((n, s) => n + (s.scored ? s.points : 0), 0)   // one point per round WON (see ledger)
        : scoring === "gap"
          ? state.reduce((n, s) => n + s.ok.filter(Boolean).length, 0)
          : state.filter(s => s.correct).length;
      return base - penalty - (ui.timeCostTotal ? ui.timeCostTotal() : 0);
    }

    // ----- audio -----
    const audioUrl = audioUrlOf(activity.content?.audio);
    let player = null, playerReq = null;
    let playingNow = false;
    async function ensurePlayer() {
      if (player) return player;
      if (!audioUrl) return null;
      if (!playerReq) {
        playerReq = loadAudio(audioUrl).then(bu => {
          if (dead) return null;
          if (!player) {
            player = createSegmentPlayer(bu);
            player.onState(on => {
              if (dead) return;
              paintPlaying(on);
              if (fightCtl && fightCtl.speaks(fightSide)) fightCtl.reportVoiceState(fightSide, { playing: on });
            });
          }
          return player;
        }).catch(() => { playerReq = null; if (!dead) ui.toast("Could not load the audio"); return null; });
      }
      return playerReq;
    }
    async function playLine(i) {
      if (!speaks() || dead) return;
      const p = await ensurePlayer();
      if (!p || dead || i !== index) return;
      const it = items[i];
      if (it.end > it.start) p.play(it.start, it.end);
    }
    function stopAudio() { if (player) player.stop(); }
    function toggleLine() { if (player && player.isPlaying()) player.stop(); else playLine(index); }
    function handleListenTap() {
      if (finished) return;
      if (fightCtl && !fightCtl.speaks(fightSide)) { fightCtl.requestVoiceToggle("ftg:" + index); return; }
      toggleLine();
    }
    ftgPauseHandlers = {
      pause() { if (player) player.pause(); },
      resume() { if (player) player.resume(); }
    };

    // ----- DOM -----
    root.innerHTML = "";
    const card = el("div", "aw-ftg-card is-" + mode);
    const top = el("div", "aw-ftg-top");
    const speakerEl = el("div", "aw-ftg-speaker");
    const sentenceEl = el("div", "aw-ftg-sentence");
    const listenBtn = el("button", "aw-ftg-listen", icons.soundOn);
    listenBtn.type = "button";
    listenBtn.title = "Listen again";
    listenBtn.setAttribute("aria-label", "Listen again");
    const wave = el("div", "aw-ftg-wave");
    for (let k = 0; k < 7; k++) wave.append(el("span", "aw-ftg-bar"));
    listenBtn.append(wave);
    press(listenBtn, handleListenTap);
    top.append(speakerEl, sentenceEl, listenBtn);
    const divider = el("div", "aw-ftg-divider");
    const area = el("div", "aw-ftg-area");
    card.append(top, divider, area);
    root.append(card);

    // TYPE mode: keyboard + the ⌨ toggle in the engine's slot next to Menu
    let kbd = null, kbdBtn = null, keyboardVisible = true;
    if (mode === "type") {
      kbd = createKeyboard({
        sound: ui.sound,
        onChar: ch => typeChar(ch),
        onBackspace: () => typeBackspace(),
        submit: { onClick: () => submitTyped(), isDisabled: () => !canAnswer() || !state[index].typed[state[index].cur].trim() }
      });
      card.append(kbd.el);
      if (ui.kbdSlot) {
        ui.kbdSlot.innerHTML = "";
        kbdBtn = el("button", "aw-iconbtn", icons.keyboard);
        kbdBtn.type = "button";
        press(kbdBtn, () => {
          keyboardVisible = !keyboardVisible;
          kbd.setHidden(!keyboardVisible);
          kbdBtn.title = keyboardVisible ? "Hide keyboard" : "Show keyboard";
          kbdBtn.classList.toggle("is-off", !keyboardVisible);
          later(fitNow, 260);
        });
        kbdBtn.title = "Hide keyboard";
        ui.kbdSlot.append(kbdBtn);
      }
    }

    ui.onSubmit(() => finish("complete"), () => state.filter(s => s.done.some(Boolean)).length);
    window.addEventListener("keydown", onKey);
    ui.setScoreProvider?.(scoreNow);
    // ⭐ Đợt 384 — bài làm TỚI LÚC NÀY cho lượt dở (dashboard myLesson xem từng câu); bọc hàm ⇒ lỗi chỉ rơi vào try của engine.
    ui.setReviewProvider?.(() => buildReview());
    ui.setVoiceGuard?.(() => !!(player && player.isPlaying()));
    ui.setIdleGuard?.(() => animating || ending || finished || fightLocked() || state[index].settled);
    ui.setRoundTimeout?.(roundTimeUp);

    renderLives();
    ui.setScore(scoreNow());
    showItemNow(0);
    later(() => playLine(index), INTRO_DELAY_MS);

    const onResize = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitNow); };
    window.addEventListener("resize", onResize);
    // The stage can change size without a window resize (zoom fullscreen, the
    // engine finishing its own layout right after mount) — Đợt 273's lesson.
    if (typeof ResizeObserver === "function") { ro = new ResizeObserver(onResize); ro.observe(root); ro.observe(area); }
    // …and the tiles themselves: their size follows --aw-u, which core/unit.js
    // can set AFTER we first measured (thầy's "hàng cuối bị lẹm" screenshot).
    watchFirstTile();
    onResize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!dead) fitNow(); }).catch(() => {});

    // =================================================================
    // RENDER
    // =================================================================
    function canAnswer() {
      const st = state[index];
      return !finished && !ending && !animating && !fightLocked() && !st.settled;
    }

    function renderItem() {
      const it = items[index], st = state[index];
      speakerEl.textContent = showSpeaker && it.speaker ? it.speaker.toUpperCase() : "";
      speakerEl.style.display = speakerEl.textContent ? "" : "none";
      renderSentence();
      renderArea();
      paintPlaying(!!(player && player.isPlaying()));
      if (fightCtl) syncFightLock();
      fitNow();
      void st;
    }

    // The line: plain tokens + one .aw-ftg-gap per gap. A gap shows its
    // number until it is answered, then the word (green) or the right word
    // (red, over what was typed/chosen) — or "•••" while a Fight withholds it.
    function renderSentence() {
      const it = items[index], st = state[index];
      sentenceEl.innerHTML = "";
      const gapAt = new Map(it.gaps.map((g, k) => [g.word, k]));
      for (let i = 0; i < it.tokens.length; i++) {
        const t = it.tokens[i];
        if (i > 0) sentenceEl.append(" ");
        const k = gapAt.get(i);
        if (k === undefined) { sentenceEl.append(el("span", "aw-ftg-word", escapeHtml(t.raw))); continue; }
        const last = it.tokens[gapEnd(it.gaps[k])] || t;   // a phrase gap covers several tokens
        if (t.lead) sentenceEl.append(el("span", "aw-ftg-word", escapeHtml(t.lead)));
        sentenceEl.append(gapSpan(it, st, k));
        if (last.trail) sentenceEl.append(el("span", "aw-ftg-word", escapeHtml(last.trail)));
        i = gapEnd(it.gaps[k]);
      }
    }
    function gapSpan(it, st, k) {
      const g = el("span", "aw-ftg-gap");
      g.dataset.g = String(k);
      const right = answersOf(it, it.gaps[k])[0] || "";
      if (!st.done[k]) {
        g.classList.toggle("is-current", k === st.cur && !st.settled);
        g.append(el("span", "aw-ftg-gapnum", String(k + 1)));
      } else if (fightCtl && fightPendingReveal) {
        g.classList.add("is-hidden");
        g.append(el("span", "aw-ftg-gapdots", "•••"));
      } else if (st.ok[k]) {
        g.classList.add("is-ok");
        g.textContent = right;
      } else if (opt.anDapAn) {
        // ⭐ Đợt 383 — BÀI GIAO: chỗ trống sai hiện CHỮ EM ĐÃ ĐIỀN (đỏ), không bao giờ hiện từ đúng.
        g.classList.add("is-bad");
        g.textContent = st.chosen[k] || st.typed?.[k] || "✗";
      } else {
        g.classList.add("is-bad");
        g.textContent = right;
        g.title = st.chosen[k] ? "You answered: " + st.chosen[k] : "No answer";
      }
      return g;
    }
    function paintCurrentGap() {
      const st = state[index];
      sentenceEl.querySelectorAll(".aw-ftg-gap").forEach(g => {
        const k = Number(g.dataset.g);
        g.classList.toggle("is-current", !st.done[k] && k === st.cur && !st.settled);
      });
    }

    function renderArea() {
      area.innerHTML = "";
      tiles = []; inputs = [];
      if (mode === "quiz") renderQuiz();
      else if (mode === "type") renderType();
      else renderFind();
      watchFirstTile();
    }

    function tileButton(text, colourIdx) {
      const tile = el("button", "aw-ftg-tile");
      tile.type = "button";
      const textEl = el("span", "aw-ftg-tiletext", escapeHtml(text));
      tile.append(textEl);
      const col = palette[colourIdx % palette.length];
      tile.style.setProperty("--tile", col.c);
      tile.style.setProperty("--tile-dark", col.d);
      return { tile, textEl, text };
    }

    // QUIZ — one set of tiles for the CURRENT gap; rebuilt as the gap moves.
    function renderQuiz() {
      const it = items[index], st = state[index];
      const row = el("div", "aw-ftg-choices");
      area.append(row);
      if (st.settled) { row.classList.add("is-done"); }
      const k = Math.min(st.cur, it.gaps.length - 1);
      // a settled line (walked back to with ‹) shows its last gap's words, marked
      const words = shuffle(buildChoices(it, it.gaps[k], pool, nChoices));
      const per = words.length <= 3 ? Math.max(1, words.length) : Math.ceil(words.length / 2);
      row.style.setProperty("--per-row", String(per));
      words.forEach((w, i) => {
        const t = tileButton(w, i);
        t.tile.disabled = !canAnswer();
        press(t.tile, () => answerGap(w, t.tile));
        row.append(t.tile);
        tiles.push(t);
      });
      if (st.settled && !(fightCtl && fightPendingReveal)) {
        const right = answersOf(it, it.gaps[k]);
        tiles.forEach(t => {
          // ⭐ Đợt 383 — bài giao: không tô ô đúng khi em đã chọn sai; chỉ đánh dấu ô em chọn.
          if (opt.anDapAn && !st.ok[k]) {
            t.tile.classList.add(st.chosen[k] === t.text ? "is-wrongpick" : "is-dimmed");
            return;
          }
          if (right.some(a => a === t.text)) t.tile.classList.add("is-right");
          else if (st.chosen[k] === t.text && !st.ok[k]) t.tile.classList.add("is-wrongpick");
          else t.tile.classList.add("is-dimmed");
        });
      }
    }

    // TYPE — one box per gap, the current one takes the keyboard.
    function renderType() {
      const it = items[index], st = state[index];
      const row = el("div", "aw-ftg-inputs");
      area.append(row);
      it.gaps.forEach((g, k) => {
        const box = el("div", "aw-ftg-input");
        box.dataset.g = String(k);
        box.append(el("span", "aw-ftg-inputnum", String(k + 1)));
        const txt = el("span", "aw-ftg-inputtext", "");
        box.append(txt);
        const caret = el("span", "aw-ftg-caret");
        box.append(caret);
        const mark = el("span", "aw-ftg-inputmark", "");
        box.append(mark);
        press(box, () => { if (!st.done[k] && canAnswer() && k === st.cur) { /* already current */ } });
        row.append(box);
        inputs.push({ box, txt, mark, k });
      });
      paintInputs();
    }
    function paintInputs() {
      const it = items[index], st = state[index];
      inputs.forEach(({ box, txt, mark, k }) => {
        const hidden = fightCtl && fightPendingReveal && st.done[k];
        box.classList.toggle("is-current", !st.done[k] && k === st.cur && !st.settled);
        box.classList.toggle("is-ok", st.done[k] && st.ok[k] && !hidden);
        box.classList.toggle("is-bad", st.done[k] && !st.ok[k] && !hidden);
        box.classList.toggle("is-hidden", !!hidden);
        if (hidden) { txt.textContent = "•••"; mark.innerHTML = ""; }
        // Đợt 383 — bài giao (`opt.anDapAn`): ô gõ sai giữ CHỮ EM GÕ + ✗, không thay bằng đáp án đúng.
        else if (st.done[k] && !st.ok[k]) { txt.textContent = opt.anDapAn ? (st.typed[k] || "") : answersOf(it, it.gaps[k])[0]; mark.innerHTML = icons.markCross; }
        else { txt.textContent = st.typed[k]; mark.innerHTML = st.done[k] ? icons.markCheck : ""; }
      });
      kbd && kbd.refresh && kbd.refresh();
    }
    function typeChar(ch) {
      const st = state[index];
      if (!canAnswer()) return;
      if (st.typed[st.cur].length >= 40) return;
      st.typed[st.cur] += ch;
      paintInputs();
    }
    function typeBackspace() {
      const st = state[index];
      if (!canAnswer()) return;
      st.typed[st.cur] = st.typed[st.cur].slice(0, -1);
      paintInputs();
    }
    function submitTyped() {
      const st = state[index];
      if (!canAnswer()) return;
      const v = st.typed[st.cur].trim();
      if (!v) return;
      const box = inputs[st.cur] ? inputs[st.cur].box : null;
      answerGap(v, box);
    }

    // FIND — the current page's grid of EVERY gap word. Solved tiles fade
    // and leave their cell (never reflow), exactly like Find the match.
    function renderFind() {
      const p = pageOf(index);
      curPage = p;
      const grid = el("div", "aw-ftg-grid");
      grid.style.gridTemplateColumns = `repeat(${findCols}, calc(${findColW} * var(--aw-u)))`;
      grid.style.gridTemplateRows = `repeat(${FIND_ROWS}, min-content)`;
      area.append(grid);
      pageTiles[p].forEach((td, i) => {
        const solved = removeCorrects && state[td.item].done[td.gap] && state[td.item].ok[td.gap] && !(fightCtl && fightPendingReveal && td.item === index);
        const t = tileButton(td.text, i);
        t.item = td.item; t.gap = td.gap;
        t.tile.style.gridRow = String(Math.floor(i / findCols) + 1);
        t.tile.style.gridColumn = String((i % findCols) + 1);
        if (solved) t.tile.classList.add("is-solved");
        t.tile.disabled = solved || !canAnswer();
        press(t.tile, () => answerGap(td.text, t.tile, t));
        grid.append(t.tile);
        tiles.push(t);
      });
    }

    function watchFirstTile() {
      if (!ro) return;
      const first = tiles[0] && tiles[0].tile;
      if (first) ro.observe(first);
    }

    function paintPlaying(on) {
      playingNow = on;
      listenBtn.classList.toggle("is-playing", on);
    }

    // =================================================================
    // ANSWERING
    // =================================================================
    function answerGap(text, fromEl, tileRec) {
      const it = items[index], st = state[index];
      if (!canAnswer()) return;
      const k = st.cur;
      if (k >= it.gaps.length) return;
      const ok = isRightAnswer(it, it.gaps[k], text);
      st.done[k] = true; st.chosen[k] = text; st.ok[k] = ok;
      if (fightCtl) fightRound(index)[fightSide] = st.ok.filter(Boolean).length;
      ui.noteActivity?.();

      if (ok) ftgSound.correct(); else ftgSound.wrong();

      if (fightCtl) {
        // withhold every mark that says which word was right (Quiz's rule)
        fightPendingReveal = true;
        if (tileRec) { tileRec.tile.classList.add("is-taken"); tileRec.tile.disabled = true; }
      } else {
        if (fromEl) flyMark(fromEl, ok);
        if (mode === "quiz") {
          const right = answersOf(it, it.gaps[k]);
          tiles.forEach(t => {
            // ⭐ Đợt 383 — bài giao (`opt.anDapAn`): chọn SAI thì chỉ đánh dấu ô em chọn, ô đúng mờ như các ô khác.
            if (opt.anDapAn && !ok) { t.tile.classList.add(t.tile === fromEl ? "is-wrongpick" : "is-dimmed"); return; }
            if (right.some(a => a === t.text)) t.tile.classList.add("is-right");
            else if (t.tile === fromEl && !ok) t.tile.classList.add("is-wrongpick");
            else t.tile.classList.add("is-dimmed");
          });
        }
        if (mode === "find" && tileRec && ok) {
          // Remove corrects ON: the tile fades and leaves its cell. OFF: it stays,
          // indistinguishable from the others (Find the match's rule) — tapping it
          // again for a different gap is simply a wrong answer.
          if (removeCorrects) { tileRec.tile.classList.add("is-solved"); tileRec.tile.disabled = true; }
        }
      }

      const willFly = !ok && pointsOff > 0;
      ui.setScore(scoreNow());
      if (willFly) ui.flyPenalty?.(fightCtl ? null : fromEl, pointsOff, () => { penalty += pointsOff; return scoreNow(); });

      st.cur++;
      const lineDone = st.cur >= it.gaps.length;
      if (lineDone) settleLine();
      else {
        renderSentence();
        if (mode === "quiz") renderArea(); else if (mode === "type") paintInputs(); else syncTileLocks();
        fitNow();
      }

      const outOfLives = ok ? false : loseLife();
      if (outOfLives) {
        ending = true;
        lockAll();
        updateNav();
        clearAutoTimer();
        autoTimer = later(() => finish("gameover"), 1500);
      }
    }

    // Every gap of the line is answered: the line is settled.
    function settleLine() {
      const it = items[index], st = state[index];
      st.settled = true;
      st.correct = st.ok.every(Boolean);
      ui.setScore(scoreNow());   // "Each sentence" only counts a line once it is settled
      ui.roundDone?.();
      renderSentence();
      if (mode === "type") paintInputs();   // QUIZ keeps its last tile set on screen, marked
      lockAll();
      updateNav();
      if (fightCtl) {
        syncFightLock();
        // ⭐ Đợt 352 (thầy, 20/9/2026) — "correct" to the referee = ALL gaps right
        // (st.correct), not "at least one". A board that finished but is NOT
        // 100% must go through the referee's WRONG path: that gives the other
        // side the FULL Miss wait (not the short Time delay) to keep playing,
        // exactly like a plain wrong answer in every other template (Đợt 128) —
        // it only self-locks/greys while the round stays open, it is never
        // scored zero for it. The point itself is still decided independently
        // at reveal() by comparing the ledger (`hits[side] >= hits[other]`), so
        // a 1/2 board still ties or beats a rival with fewer/equal hits; it is
        // only a board that reaches ALL gaps first that gets to cut the other
        // one off early via Time delay (a genuinely finished-and-correct line).
        fightCtl.wordDone(fightSide, { index, correct: st.correct });
        return;   // the referee moves both boards
      }
      if (ending) return;
      if (state.every(s => s.settled)) { autoTimer = later(() => finish("complete"), st.correct ? 1000 : 1500); return; }
      if (index < total - 1) autoTimer = later(() => { autoTimer = null; goNext(); }, st.correct ? 900 : 1500);
      void it;
    }

    function lockAll() {
      tiles.forEach(t => { t.tile.disabled = true; });
      kbd && kbd.refresh && kbd.refresh();
    }
    // Every tile that is still in play follows canAnswer(); solved / taken
    // tiles stay dead. Used after the slide (tiles were built while animating).
    function syncTileLocks() {
      const on = canAnswer();
      tiles.forEach(t => { if (!t.tile.classList.contains("is-solved") && !t.tile.classList.contains("is-taken")) t.tile.disabled = !on; });
      kbd && kbd.refresh && kbd.refresh();
    }

    // The big ✓/✗ goes up from a ghost box laid over the target's rectangle
    // (not inside the target): in QUIZ mode the tiles are rebuilt for the next
    // gap right away, and a mark appended inside a tile would vanish with it.
    function flyMark(target, ok) {
      const r = target.getBoundingClientRect(), c = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const host = el("span", "aw-ftg-flyhost");
      host.style.left = (r.left - c.left) + "px";
      host.style.top = (r.top - c.top) + "px";
      host.style.width = r.width + "px";
      host.style.height = Math.min(r.height, r.width) + "px";
      host.append(el("span", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross));
      card.append(host);
      later(() => host.remove(), ok ? 900 : 1400);
    }

    // TIME EACH ROUND (Showdown) — out of time: every gap still open counts
    // wrong, one Points-off charge, one heart. Fight never calls this.
    function roundTimeUp() {
      const it = items[index], st = state[index];
      if (st.settled || finished || ending || fightLocked()) return;
      for (let k = st.cur; k < it.gaps.length; k++) { st.done[k] = true; st.ok[k] = false; }
      st.cur = it.gaps.length;
      st.timedOut = true;
      ftgSound.wrong();
      const willFly = pointsOff > 0;
      ui.setScore(scoreNow());
      if (willFly) ui.flyPenalty?.(null, pointsOff, () => { penalty += pointsOff; return scoreNow(); });
      settleLine();
      if (loseLife()) {
        ending = true; lockAll(); updateNav(); clearAutoTimer();
        autoTimer = later(() => finish("gameover"), 1500);
      }
    }

    // ----- FIGHT: lock / reveal -----
    function syncFightLock() {
      const locked = fightLocked();
      const st = state[index];
      // unlocking goes through canAnswer() (syncTileLocks) — a board unlocked by the
      // referee mid-slide must not offer live tiles while `animating` still refuses taps
      if (!st.settled) { if (locked) tiles.forEach(t => { t.tile.disabled = true; }); else syncTileLocks(); }
      area.classList.toggle("is-fightlost", locked && (!st.settled || fightPendingReveal));
      kbd && kbd.refresh && kbd.refresh();
    }
    function revealFightMarks() {
      fightPendingReveal = false;
      const it = items[index], st = state[index];
      // an unanswered board is shown the right words too
      if (!st.settled) {
        for (let k = 0; k < it.gaps.length; k++) if (!st.done[k]) { st.done[k] = true; st.ok[k] = false; st.chosen[k] = null; }
      }
      renderSentence();
      if (mode === "type") paintInputs();
      else tiles.forEach(t => {
        t.tile.classList.remove("is-taken");
        const chosenHere = st.chosen.some(c => c != null && c === t.text);
        const rightHere = it.gaps.some(g => answersOf(it, g).some(a => a === t.text));
        if (mode === "find" && t.item !== index) return;
        if (rightHere) t.tile.classList.add(mode === "find" ? "is-solved" : "is-right");
        else if (chosenHere) t.tile.classList.add("is-wrongpick");
        else if (mode === "quiz") t.tile.classList.add("is-dimmed");
      });
      syncFightLock();
    }

    // =================================================================
    // LIVES
    // =================================================================
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;
      if (livesLeft <= 5) for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      else { slot.append(el("span", "aw-top-heartcount", String(livesLeft))); slot.append(el("span", "aw-top-heart", "&#9829;")); }
    }
    function loseLife() {
      if (livesLeft == null) return false;
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" }).onfinish = finishPop;
        } catch (e) { finishPop(); }
        later(finishPop, 360);
      } else renderLives();
      return livesLeft <= 0;
    }

    // =================================================================
    // NAVIGATION
    // =================================================================
    function canAdvance() { return allowSkip || state[index].settled; }
    function mayLeave() { return ui.mayLeaveRound?.() !== false; }
    function updateNav() {
      const last = index === total - 1;
      let label = null;
      if (mode === "find" && pages.length > 1) label = `${index + 1} of ${total} · Page ${pageOf(index) + 1} / ${pages.length}`;
      ui.setNav({
        index: index + 1, total, label,
        onPrev: (index > 0 && !ending && !animating) ? goPrev : null,
        onNext: (!ending && !animating && canAdvance()) ? (last ? () => finish("complete") : goNext) : null,
        nextLabel: last ? icons.check : null
      });
    }
    function goPrev() { if (!animating && !ending && !finished && mayLeave() && index > 0) { clearAutoTimer(); showItem(index - 1, -1); } }
    function goNext() { if (!animating && !ending && !finished && canAdvance() && mayLeave() && index < total - 1) { clearAutoTimer(); showItem(index + 1, 1); } }
    function jumpTo(i) {
      const target = Math.max(0, Math.min(total - 1, i | 0));
      if (target === index) return;
      animating = false;
      clearAutoTimer();
      showItem(target, target > index ? 1 : -1);
    }

    function showItemNow(i) {
      index = i;
      fightPendingReveal = fightCtl ? (state[i].settled && !state[i].revealed) : false;
      renderItem();
      updateNav();
    }

    // Fade the line + answer area out, swap, fade in. Timeout fallback for a
    // hidden tab (animation events can stall there — CONG THUC MAU rule 3.4).
    function showItem(i, dir) {
      if (i === index) return;
      if (fightCtl) fightCtl.boardMoved(fightSide, i);
      ui.itemChanging?.(i, { outMs: 130, inMs: 190 });
      stopAudio();
      animating = true;
      updateNav();
      const outX = dir >= 0 ? -6 : 6, inX = dir >= 0 ? 6 : -6;
      let swapped = false;
      const doSwap = () => {
        if (swapped || dead) return;
        swapped = true;
        showItemNow(i);
        try {
          top.animate([{ transform: `translateX(${inX}%)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: 190, easing: "ease", fill: "both" });
          area.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 190, easing: "ease", fill: "both" });
        } catch (e) { /* no WAAPI */ }
        later(() => { animating = false; updateNav(); syncTileLocks(); playLine(i); }, 200);
      };
      try {
        const a = top.animate([{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${outX}%)`, opacity: 0 }], { duration: 130, easing: "ease", fill: "forwards" });
        area.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: "ease", fill: "forwards" });
        a.onfinish = doSwap;
      } catch (e) { doSwap(); }
      later(doSwap, 200);
    }

    // ----- FIGHT attach -----
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex: jumpTo,
        lock(on) { fightBoardLock = !!on; syncFightLock(); },
        reveal() {
          const st = state[index];
          st.revealed = true;
          if (!st.scored) {
            const hits = fightRound(index);
            const me = hits[fightSide], other = hits[fightSide === 0 ? 1 : 0];
            st.points = (me > 0 && me >= other) ? 1 : 0;
            st.scored = true;
            ui.setScore(scoreNow());
          }
          revealFightMarks();
        },
        review: buildReview,
        toggleVoiceRemote(clipId) {
          if (!fightCtl || !fightCtl.speaks(fightSide)) return;
          const m = /^ftg:(\d+)$/.exec(String(clipId || ""));
          if (m && Number(m[1]) !== index) return;
          toggleLine();
        },
        syncVoice(st) { if (st && st.playing !== undefined) paintPlaying(!!st.playing); }
      });
    }

    // =================================================================
    // KEYBOARD (physical)
    // =================================================================
    function onKey(e) {
      if (finished || ending || dead) return;
      if (e.key === "ArrowLeft") { goPrev(); return; }
      if (e.key === "ArrowRight") {
        if (!canAdvance() || !mayLeave()) return;
        (index === total - 1 ? () => finish("complete") : goNext)();
        return;
      }
      if (mode === "type") {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === "Enter") { submitTyped(); e.preventDefault(); return; }
        if (e.key === "Backspace") { typeBackspace(); e.preventDefault(); return; }
        if (e.key.length === 1) { typeChar(e.key); e.preventDefault(); }
        return;
      }
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1 && n <= tiles.length) {
        const t = tiles[n - 1];
        if (t && !t.tile.disabled) t.tile.click();
      }
    }

    // =================================================================
    // FIT — the line shrinks to its area; QUIZ/FIND tiles shrink per tile so
    // a single word is never broken across lines.
    // =================================================================
    function fitNow() {
      if (dead) return;
      card.style.setProperty("--sfit", "1");
      const topH = top.clientHeight;
      const fits = () => sentenceEl.scrollHeight + speakerEl.offsetHeight <= topH - root.clientWidth * 0.01;
      if (!fits()) {
        let lo = 0.45, hi = 1, best = 0.45;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          card.style.setProperty("--sfit", mid.toFixed(3));
          if (fits()) { best = mid; lo = mid; } else hi = mid;
        }
        card.style.setProperty("--sfit", best.toFixed(3));
      }
      // FIND: the 5-row grid must fit the area — shrink the whole grid first,
      // then let single long words shrink per tile below.
      const grid = area.querySelector(".aw-ftg-grid");
      if (grid) {
        grid.style.setProperty("--gfit", "1");
        const rowsH = () => { const r = grid.getBoundingClientRect(); const first = grid.firstElementChild, last = grid.lastElementChild; if (!first || !last) return 0; return last.getBoundingClientRect().bottom - first.getBoundingClientRect().top; };
        const overG = () => rowsH() > area.clientHeight - 2;
        if (overG()) {
          let lo = 0.4, hi = 1, best = 0.4;
          for (let k = 0; k < 12; k++) {
            const mid = (lo + hi) / 2;
            grid.style.setProperty("--gfit", mid.toFixed(3));
            if (overG()) hi = mid; else { best = mid; lo = mid; }
          }
          grid.style.setProperty("--gfit", best.toFixed(3));
        }
      }
      tiles.forEach(({ tile, textEl }) => {
        tile.style.setProperty("--tfit", "1");
        let scale = 1, guard = 0;
        const over = () => textEl.scrollWidth > tile.clientWidth - 1 || tile.scrollHeight > tile.clientHeight + 1;
        while (guard++ < 14 && over() && scale > 0.34) { scale -= 0.06; tile.style.setProperty("--tfit", scale.toFixed(3)); }
      });
    }

    // =================================================================
    // FINISH
    // =================================================================
    function buildReview() {
      return items.map((it, i) => {
        const s = state[i];
        return {
          question: (showSpeaker && it.speaker ? it.speaker + ": " : "") + gappedText(it),
          answered: s.done.some(Boolean) && !s.timedOut,
          yourText: s.done.some(Boolean) ? s.chosen.map(c => (c == null ? "—" : c)).join(" · ") : null,
          yourCorrect: s.correct === true,
          correctText: it.gaps.map(g => answersOf(it, g)[0]).join(" · "),
          src: it.src
        };
      });
    }

    function finish(reason = "complete") {
      if (finished) return;
      finished = true;
      clearAutoTimer();
      stopAudio();
      ui.flushPenalties?.();
      if (reason === "gameover") ftgSound.gameOver(); else ftgSound.gameCompleted();
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = scoring === "gap"
        ? state.reduce((n, s) => n + s.ok.filter(Boolean).length, 0)
        : perQuestion.filter(p => p.correct).length;
      const raw = {
        correct, incorrect: scoreTotal - correct, total: scoreTotal, perQuestion,
        review: buildReview(),
        answered: state.filter(s => s.done.some(Boolean)).length,
        score: scoreNow()
      };
      if (reason === "gameover") raw.title = "Game over";
      ui.finish(raw);
    }

    return function cleanup() {
      dead = true;
      finished = true;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(fitRaf);
      if (ro) ro.disconnect();
      timers.forEach(clearTimeout); timers.clear();
      if (player) { player.destroy(); player = null; }
      ftgPauseHandlers = null;
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      if (ui.kbdSlot) ui.kbdSlot.innerHTML = "";
    };
  }
};

registerTemplate(ftgTemplate);
export default ftgTemplate;
