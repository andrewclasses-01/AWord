// =============================================================
// TEMPLATE: CROSSWORD — Wordwall style, English UI.  (Classic look)
//  • Content = a list of { answer, clue } pairs. The interlocking GRID is
//    generated automatically from the answers (crossword builder below), just
//    like Wordwall — the teacher only types answer + clue.
//
//  • TWO SCREENS (2/8/2026 redesign, teacher's terminology):
//      "the board"  = the whole crossword, keyboard HIDDEN.
//      "a row/col"  = one Across word (row) or Down word (col) popped out BIG,
//                     keyboard SHOWN.
//    The keyboard is ABSOLUTELY pinned to one fixed centred spot at the bottom
//    (fixed size), so it NEVER moves or resizes whatever you pick.
//      - Across word -> a big horizontal strip centred between the clue and the
//        keyboard.
//      - Down word   -> a big vertical strip to the RIGHT of the keyboard (above
//        the sound button in the bar below).
//    Whatever cell you tap, the cursor starts at the FIRST cell and you type the
//    whole word left-to-right.
//
//  • FLOW: pick a word on the board -> it pops out + keyboard appears -> type ->
//    Submit (keyboard's Submit key, or Enter). After EVERY answer the view
//    always zooms back to the board and hides the keyboard; you pick the next
//    word by hand. There is NO Next/Prev navigation (those buttons are hidden).
//
//  • "Change the crossword" option (default ON): while a word is open you can
//    tap the CLUE to bail back to the board and choose another. When OFF you are
//    locked to the word until you answer it (right or wrong).
//
//  • "Andrew help" (keyboard's 5th key, ONE use per game, only while a word is
//    open): the answer letters appear inside the cells in glowing GOLD (same
//    sparkle as the key) as a hint — you still type them yourself. The key goes
//    dark once used.
//
//  • Crossing letters already filled by a solved word show WHITE with a faint
//    dark outline (a "given"); once you type past them they turn normal black.
//
//  • Grading (each answer then returns to the board):
//      Correct                       -> cells go accent + white, +1, "correct".
//      Wrong, Show-answer-when-wrong ON  -> the correct letters show for 3.5s,
//                                           then it returns to the board.
//      Wrong, Show-answer-when-wrong OFF -> the cells get a grey ✕, then board.
//
//  • Options: Timer (engine), Show answers (engine review), plus this template's
//    "Show answer when wrong" and "Change the crossword". No Shuffle answers /
//    Letters (a crossword grid is fixed): since Đợt 143 "Shuffle answers" is
//    opt-in and this game doesn't declare it, and "Letters on answers" no
//    longer exists anywhere in the app.
//
//  • PAGINATION (teacher 4/8/2026): up to 120 answers total. ≤30 words plays
//    exactly as before (single board, no nav row at all). >30 splits into
//    pages of ≤30, divided evenly (e.g. 45 -> 23+22) — each page is its OWN
//    separate interlocking grid (a crossword can't sensibly span 120 answers
//    in one grid). Pages auto-advance as cleared, like find-the-match.js;
//    the shared nav row shows only "Page X / Y" (no manual page-flip arrows).
//    Multi-word answers (e.g. "polar bear") already fill as ONE continuous
//    run of boxes — gridKey() strips spaces/punctuation before building the
//    grid, unchanged by this pagination work.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
// Dot 143 - every penalty in the app is on ONE scale now (0..100, step 1).
// Importing the numbers rather than repeating them is what stops this
// game's slider and its mount() clamp drifting apart again.
import { POINTS_MAX, POINTS_STEP } from "../../core/options-panel.js";
import { el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createKeyboard } from "../../core/keyboard.js";
import { createVoicePlayer, voiceView } from "../../core/voice-playback.js";
import { openCrosswordEditor } from "./crossword-editor.js";
import { crosswordSound } from "./crossword-sound.js";

// Letters-only, UPPERCASE key for the grid (spaces / punctuation stripped, like
// Wordwall). Keeps the original answer for the review screen.
function gridKey(str) {
  return String(str ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

// -------------------------------------------------------------------
// CROSSWORD BUILDER — place words on a grid so they interlock at shared
// letters. Greedy: longest word first at the origin, then each next word takes
// its best-scoring valid crossing; a word that can't cross anything is dropped
// (kept out of the grid but still listed as a clue with "No answer" possible).
// -------------------------------------------------------------------
// ⚠️ `fixed` (Đợt 185) — build the SAME grid every time, for FIGHT MODE. This
// function is deliberately random in single play (see the two comments below):
// the layout shifts a little on every Start again. In a match that randomness
// is a silent disaster — each board builds its own grid, so clue #3 is a
// different word on the two screens, and the referee's "open clue 3 on both
// boards" opens two different questions. Nothing looks wrong on either board
// on its own; the class just sees two teams answering different things.
function buildCrossword(words, fixed = false) {
  const usable = words
    // `src` = the ORIGINAL content object, carried through BOTH hops of this
    // build (here, then into the placed-clue objects below) so "Start with
    // mistakes" can filter activity.content.words by identity (core/mistakes.js).
    .map(w => ({ key: gridKey(w.answer), clue: w.clue || "", answer: w.answer || "", src: w }))
    .filter(w => w.key.length >= 2);

  const seen = new Set();
  const list = [];
  for (const w of usable) { if (!seen.has(w.key)) { seen.add(w.key); list.push(w); } }
  // "Change a bit on every Start again": shuffle first, THEN a stable sort by
  // length keeps the longest words anchoring the grid but randomises the order
  // of equal-length words — so the interlock (row/column positions) shifts a
  // little each new game instead of being identical every time.
  if (!fixed) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  list.sort((a, b) => b.key.length - a.key.length);

  const cells = new Map();
  const placed = [];
  const at = (r, c) => cells.get(r + "," + c);

  function fitScore(key, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    let crossings = 0;
    if (at(row - dr, col - dc) != null) return -1;
    if (at(row + dr * key.length, col + dc * key.length) != null) return -1;
    for (let i = 0; i < key.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      const cur = at(r, c);
      if (cur != null) {
        if (cur !== key[i]) return -1;
        crossings++;
        continue;
      }
      if (dir === "A") {
        if (at(r - 1, c) != null || at(r + 1, c) != null) return -1;
      } else {
        if (at(r, c - 1) != null || at(r, c + 1) != null) return -1;
      }
    }
    return crossings;
  }

  function stamp(w, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    for (let i = 0; i < w.key.length; i++) cells.set((row + dr * i) + "," + (col + dc * i), w.key[i]);
    placed.push({ ...w, row, col, dir });
  }

  const skipped = [];
  list.forEach((w, wi) => {
    if (wi === 0) { stamp(w, 0, 0, "A"); return; }
    let best = null;
    for (const p of placed) {
      const pdr = p.dir === "D" ? 1 : 0, pdc = p.dir === "A" ? 1 : 0;
      for (let j = 0; j < p.key.length; j++) {
        const pr = p.row + pdr * j, pc = p.col + pdc * j;
        const letter = p.key[j];
        for (let i = 0; i < w.key.length; i++) {
          if (w.key[i] !== letter) continue;
          const dir = p.dir === "A" ? "D" : "A";
          const row = dir === "D" ? pr - i : pr;
          const col = dir === "A" ? pc - i : pc;
          const score = fitScore(w.key, row, col, dir);
          // random tie-break: among equally-good crossings, pick either one so
          // the layout varies between games.
          if (score > 0 && (!best || score > best.score || (score === best.score && !fixed && Math.random() < 0.5)))
            best = { row, col, dir, score };
        }
      }
    }
    if (best) stamp(w, best.row, best.col, best.dir);
    else skipped.push(w);
  });

  if (!placed.length) return { grid: null, clues: [], rows: 0, cols: 0, skipped };

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1, cols = maxC - minC + 1;

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (const [k, letter] of cells) {
    const [r, c] = k.split(",").map(Number);
    grid[r - minR][c - minC] = { sol: letter, num: 0 };
  }
  placed.forEach(p => { p.row -= minR; p.col -= minC; });

  let n = 0;
  const numAt = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const startsAcross = (c === 0 || !grid[r][c - 1]) && (c + 1 < cols && grid[r][c + 1]);
      const startsDown = (r === 0 || !grid[r - 1][c]) && (r + 1 < rows && grid[r + 1][c]);
      if (startsAcross || startsDown) { n++; grid[r][c].num = n; numAt.set(r + "," + c, n); }
    }
  }

  const clues = placed.map(p => {
    const dr = p.dir === "D" ? 1 : 0, dc = p.dir === "A" ? 1 : 0;
    const cellsOf = [];
    for (let i = 0; i < p.key.length; i++) cellsOf.push([p.row + dr * i, p.col + dc * i]);
    return {
      key: p.key, answer: p.answer, clue: p.clue, src: p.src,
      dir: p.dir, row: p.row, col: p.col,
      number: numAt.get(p.row + "," + p.col) || 0,
      cells: cellsOf
    };
  });
  clues.sort((a, b) => a.number - b.number || (a.dir === b.dir ? 0 : a.dir === "A" ? -1 : 1));

  return { grid, clues, rows, cols, skipped };
}

const crosswordTemplate = {
  type: "crossword",
  scorable: true,
  // TIME COST (Đợt 143) — opt in to the shared "-N per idle second" option.
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "words",
  hidePointsOff: true,   // ships its own "Points off when wrong" control
  // Đợt 143 (opt-in) — really reads options.autoSwitch now: a solved word moves
  // the cursor on to the next clue by itself.
  usesAutoSwitch: true,
  // ⭐⭐ Đợt 185 — FIGHT MODE in the "PICK TURN + LOCK" model the teacher chose
  // for this game (17/8/2026): "Khi mở ô, mỗi bên 1 lượt chọn câu… Khi 1 bên
  // chọn 1 cột/hàng thì cả 2 bên cùng mở cột/hàng đó, ai viết câu trả lời nhanh
  // hơn thì có điểm, đội bên kia sẽ bị coi như khóa, câu trả lời vẫn hiện ra
  // nhưng coi như bị sai." `fightPick: "lock"` IS that rule set — see the
  // pickMode block in core/fight.js.
  fightMode: true,
  fightPick: "lock",
  // ⭐⭐ Đợt 186 — SHOWDOWN. Left out in Đợt 178 for one honest reason: the class
  // chooses which clue to open, so `review` came out in GRID order and pupil `n`
  // would have been named against a clue they never touched. `playOrder` +
  // `setNav({index: row})` fix exactly that.
  showdownMode: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showCorrects", "changeCrossword", "autoNext", "showAnswers"],
  name: "Crossword",
  edit: openCrosswordEditor,

  sounds: {
    play: crosswordSound.play,
    restart: crosswordSound.restart,
    timeWarning: crosswordSound.timeWarning,
    complete: crosswordSound.complete
  },

  toPrintItems(activity) {
    return (activity.content?.words || [])
      .filter(w => w && gridKey(w.answer).length >= 2)
      .map(w => ({ clue: w.clue || "", answer: w.answer || "" }));
  },

  // This template's own extra options.
  // Đợt 140 — shared panel builders.
  buildExtraOptions({ panel, draft, mkSliderCell, addCheck, inFight }) {
    // "Points off when wrong" (0..100 since Dot 143). 0 = no penalty (drag it
    // to 0 to turn Minus mode off) — no separate checkbox.
    if (draft.minusAmount == null) draft.minusAmount = 0;
    panel.append(mkSliderCell({
      label: "Points off", sub: "wrong answer", min: 0, max: POINTS_MAX, step: POINTS_STEP,
      value: draft.minusAmount || 0, offAt: 0,
      fmt: v => (v === 0 ? "Off" : "-" + v),
      onInput: v => { draft.minusAmount = v; }
    }).cell);

    // ⭐ Đợt 213b (thầy, 20/8/2026) — nhãn đổi thành "Show corrects".
    // ⚠️ CHỈ đổi CHỮ HIỆN RA; trường lưu vẫn là `showAnswerWhenWrong` nên act cũ
    // chạy y nguyên, không cần di trú. Mã định danh `showCorrects` mới là thứ
    // `checkOrder` dùng để xếp chỗ (xem addCheck trong core/options-panel.js).
    addCheck("Show corrects", draft.showAnswerWhenWrong !== false,
      v => draft.showAnswerWhenWrong = v, { key: "showCorrects", title: "Show the correct answer after a wrong one" });
    // ⭐⭐ Đợt 259b (thầy, 25/8/2026: "cần bỏ hẳn ô tích Change the words trong
    // options fight của crossword") — Ô NÀY KHÔNG ĐƯỢC DỰNG TRONG TRẬN.
    // Đợt 259 ép `canExit = false` suốt trận (trọng tài mới là chỗ quyết từ nào
    // đang mở), nên ô tích này ngồi trên bảng hứa một điều mà luật đã bác — đúng
    // "công tắc chết" mà Đợt 143 cấm. Bỏ ô đi là cách duy nhất trung thực; để nó
    // mờ đi vẫn là bày ra một thứ không làm gì.
    // ⚠️ CHỈ giấu Ô, KHÔNG đụng `draft.changeCrossword`. Giá trị thầy đã lưu phải
    // còn nguyên để lúc chơi thường act vẫn theo đúng ý thầy — ghi đè nó ở đây là
    // lặng lẽ đổi act chỉ vì thầy lỡ mở bảng Options giữa một trận đấu.
    // ⚠️ Khoá `changeCrossword` vẫn nằm trong `checkOrder`: ngoài trận ô vẫn dựng
    // như cũ, và một khoá không có ô tương ứng thì `orderChecks` bỏ qua vô hại.
    if (!inFight) {
      addCheck("Change the crossword", draft.changeCrossword !== false,
        v => draft.changeCrossword = v, { key: "changeCrossword" });
    }
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    // ⭐⭐ Đợt 259 (thầy, 25/8/2026) — "Ở chế độ fight bỏ hẳn chế độ bấm vào câu hỏi
    // để ẩn (change the crossword)". In a match the referee — not the board — owns
    // which clue is open, and it opens the SAME one on both screens. A pupil
    // tapping the clue to back out would leave that board sitting on its grid
    // while the other team answered the word both were given, with no way back in
    // this round; the option is therefore forced OFF for the whole match,
    // whatever the act has saved. Single play is untouched.
    // ⚠️ Reads `activity._fight` directly, not the `fight` shorthand — this line
    // runs before that const exists.
    const canExit = !activity._fight && opt.changeCrossword !== false;   // tap the clue to bail out
    // "Points off when wrong": 0..100. 0 = no penalty (Minus mode off) — the slider
    // dragged to 0 IS the off switch, so there is no separate checkbox.
    const penalty = Math.max(0, Math.min(POINTS_MAX, opt.minusAmount || 0));
    const minusOn = penalty > 0;
    const PAGE_SIZE = 30;   // more than this and the board splits into pages (teacher 4/8/2026)
    const words = [...(activity.content?.words || [])].filter(w => w && String(w.answer || "").trim());

    // PAGINATION (teacher 4/8/2026): up to 120 answers total, split into pages
    // of at most PAGE_SIZE, divided as evenly as possible (e.g. 45 -> 23+22,
    // not 30+15) — same technique as find-the-match.js. Unlike Find the match,
    // each page is a fully SEPARATE interlocking grid (buildCrossword runs once
    // per page): a crossword's whole point is words crossing each other, so
    // there is no single grid that could sensibly span up to 120 answers.
    // pageState keeps each page's own grid AND play state, so an earlier
    // page's progress survives once the game auto-advances past it.
    const rawPageCount = Math.max(1, Math.ceil(words.length / PAGE_SIZE));
    const perPage = Math.ceil(words.length / rawPageCount);
    const wordPages = [];
    for (let p = 0; p < rawPageCount; p++) wordPages.push(words.slice(p * perPage, (p + 1) * perPage));
    const pageState = wordPages
      // `!!activity._fight` — in a match BOTH boards must build the identical
      // grid, see buildCrossword's own note. (Read straight off the activity:
      // this runs before the `fightCtl` shorthand below is in scope.)
      .map(wp => buildCrossword(wp, !!activity._fight))
      .filter(bp => bp.clues.length > 0)   // a page can only end up empty if every one of its words was <2 letters
      .map(bp => ({
        grid: bp.grid, clues: bp.clues, rows: bp.rows, cols: bp.cols,
        userGrid: new Map(), cellStatus: new Map(),
        wordState: bp.clues.map(() => ({ done: false, correct: false, revealed: false, wrong: false }))
      }));
    const PAGE_COUNT = pageState.length;
    const total = pageState.reduce((sum, ps) => sum + ps.clues.length, 0);   // grand total across every page

    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-cw-empty", "This crossword has no words yet."));
      return () => {};
    }

    let curPageIdx = 0;
    let grid, clues, rows, cols, userGrid, cellStatus, wordState;   // set by loadPage() for the CURRENT page

    // ----- FIGHT MODE (Đợt 185) — `_fight` is put here by core/fight.js.
    // Null outside a match; every branch below then falls back to the game as
    // it was. Rules: `tpl.fightPick: "lock"` above.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightMyTurn = false;         // pick phase: may THIS board choose a clue?
    let fightBoardLock = false;      // the other team answered first — this board is out
    let fightHeld = null;            // { i, correct } withheld until the match says reveal

    // ⭐ SHOWDOWN (Đợt 186) — {page, i} in the order clues were OPENED, and the
    // row of the clue on screen. The class chooses the order, so this is the
    // only order `review` (and "whose clue was this") can honestly be in.
    const playOrder = [];
    // ⭐⭐⭐ Đợt 265b (thầy, 26/8/2026: *"Showdown luôn xoay vòng đều đi"*) — MỘT Ô TRONG
    // `playOrder` = MỘT LƯỢT, KHÔNG PHẢI MỘT Ô CHỮ.
    // ⛔ Trước đợt này dòng dựng nó có rào `if (!playOrder.some(...))`, mà game này CHO
    // BỎ DỞ một ô chữ (chạm vào thanh gợi ý, hoặc Escape — `returnToBoard`). Ô chữ bị bỏ
    // dở rồi được mở lại **giữ nguyên row cũ** ⇒ em mở lại nhìn thấy tên của em đã bỏ dở
    // nó. Cùng con bọ với "Unanswered = Repeat" của True/false; đọc ghi chú dài ở
    // `turnLog` trong templates/true-false/true-false.js.
    // ⚠️ NHƯNG BỎ DỞ RỒI MỞ LẠI NGAY THÌ VẪN LÀ LƯỢT ẤY. Ở game này lượt chỉ kết thúc khi
    // một ô chữ được CHẤM (`endWord`), nên "mở lại đúng cái mình vừa rời" không được tính
    // là lượt mới — nếu không thì cứ chạm nhầm một cái là mất lượt.
    // `turnOutcome[t]` là "lượt thứ t chấm ra sao"; lượt bỏ dở thì không có gì cả, và hàng
    // của nó trong Show answers đọc là chưa trả lời — đúng như nó đã xảy ra.
    const turnOutcome = [];   // [{ correct, typed }] — một phần tử MỖI LƯỢT ĐƯỢC CHẤM
    let curTurn = -1;
    let curRow = 0;

    let curWord = -1;                // -1 = on the board (nothing picked)
    let curCell = 0;
    let finished = false;
    let livePoints = 0;              // shown score: +1 per correct, −penalty per wrong (Minus mode); may go negative
    let clueFitter = null;
    let ro = null;
    // Pronunciation playback (10/8/2026) — optional per-word, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `clues[curWord].src` is the ORIGINAL content object (see the `clues`
    // build at the top of this file), so `.voice`/`.hideText` live there. No
    // "wait for the intro chime" delay is needed — a word's clue is only
    // ever shown after the PLAYER taps a numbered cell, well after mount.
    // ⭐ Đợt 259 — `onGlow` is the PUSH half of the one-voice-per-match contract
    // (see toggleVoiceRemote/syncVoice in the fightCtl.attach block below): every
    // time this player lights or clears its own button, the speaking board tells
    // the referee, which relays it to the other board's button. Guarded by
    // `speaks()` so the call can never bounce back from the mirror side.
    // Outside a match `fightCtl` is null and this never fires.
    const voicePlayer = createVoicePlayer({
      onGlow: on => {
        if (fightCtl && fightCtl.speaks(fightSide)) fightCtl.reportVoiceState(fightSide, { playing: on });
      }
    });
    const timers = [];               // pending setTimeouts for the current word's end sequence
    const pushTimer = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };
    let andrewUsed = false;          // ONE use for the WHOLE game
    let andrewGlowing = false;       // from the press until this word ends

    const bigCells = new Map();      // index-in-current-word -> big overlay cell
    // ⭐ Đợt 259 — which "given" cells of the CURRENT word the player has actually
    // typed through. `i >= curCell` alone cannot answer that for the LAST cell of a
    // word: advanceCursor() deliberately stops at the final index, so a crossing
    // letter sitting there would keep blinking for ever even after the pupil typed
    // it — the exact confusion the blink exists to remove. Rebuilt per word in
    // renderActive(); wound back by backspace().
    const typedGivens = new Set();

    // Single page (≤30 words — the vast majority of crosswords): the engine's
    // Prev/Next nav is fully hidden exactly as before, using visibility (NOT
    // display:none) so the bottom bar's 3-column grid (left | nav | tools)
    // doesn't slide the sound/fullscreen tools inward — a crossword can't be
    // navigated (2/8), it's all picked from the board. Multiple pages
    // (teacher 4/8/2026): the nav row stays visible to show "Page X / Y"
    // (see updateNav below) — its ‹ › arrows are hidden separately via scoped
    // CSS in crossword.css (same technique as find-the-match.css), since a
    // page never flips by hand, only auto-advances once cleared.
    const navWrap = root.parentElement && root.parentElement.querySelector(".aw-nav");
    if (PAGE_COUNT <= 1 && navWrap) navWrap.style.visibility = "hidden";

    // Slogan on the SAME row as the clock + score (centred, small, grey, spaced
    // uppercase). Absolutely centred over the top bar so it never depends on the
    // clock/score widths.
    const topbar = root.parentElement && root.parentElement.querySelector(".aw-topbar");
    let sloganEl = null;
    if (topbar) {
      topbar.style.position = "relative";
      sloganEl = el("div", "aw-cw-slogan", "CROSSWORD IN ANDREW CLASSES");
      topbar.append(sloganEl);
    }

    ui.onSubmit(finish, () => pageState.reduce((sum, ps) => sum + ps.wordState.filter(s => s.done).length, 0));
    window.addEventListener("keydown", onKey);

    // ----- static shell: clue bar + grid + keyboard + active strip -----
    root.innerHTML = "";
    const wrap = el("div", "aw-cw-wrap");

    const clueBar = el("div", "aw-cw-cluebar");
    const clueText = el("span", "aw-cw-clue-text", "");
    clueBar.append(clueText);
    press(clueBar, () => {
      if (curWord >= 0 && !finished && canExit) { ui.sound?.click?.(); returnToBoard(); }
    });   // instant on touch-down — core/press.js
    wrap.append(clueBar);

    // Grid cells themselves are built by buildGridDom() (called from
    // loadPage()) since each page has its own rows/cols/grid — this shell
    // just hosts them.
    const gridWrap = el("div", "aw-cw-gridwrap");
    const gridEl = el("div", "aw-cw-grid");
    let cellEls = new Map();
    gridWrap.append(gridEl);
    wrap.append(gridWrap);

    // The standard keyboard, in an ABSOLUTE full-width host pinned to the bottom.
    // The host is out of the layout flow, so the keyboard's fixed (cqw) size and
    // centred position NEVER change with the clue length, grid size or the word
    // that's open. It fades/hides on the board and reappears for a word.
    const kbdHost = el("div", "aw-cw-kbdhost");
    const kbd = createKeyboard({
      sound: ui.sound,
      onChar: ch => { if (/^[a-zA-Z]$/.test(ch)) typeLetter(ch.toUpperCase()); },
      onBackspace: () => { backspace(); kbd.refresh(); },
      submit: {
        onClick: submitCurrentWord,
        isDisabled: () => finished || curWord < 0 || wordState[curWord].done || !wordFilled(clues[curWord])
      },
      extraKey: {
        label: "Andrew",
        className: "aw-cw-key-andrew",
        getState: () => !andrewUsed ? "ready" : (andrewGlowing ? "glowing" : "used"),
        // The `curWord >= 0` guard was originally here because core/keyboard.js
        // never wired a key that was disabled at BUILD time (curWord is -1 then).
        // That core trap was FIXED 4/8/2026, so the guard is no longer load-
        // bearing — kept deliberately, because it is also correct on its own
        // terms (no word selected yet == nothing to reveal, and useAndrew()
        // guards the board), and rewriting working Crossword behaviour just to
        // tidy a line isn't worth the risk.
        isDisabled: () => andrewUsed || finished || (curWord >= 0 && wordState[curWord].done),
        onClick: useAndrew
      }
    });
    kbd.setHidden(true);
    kbdHost.append(kbd.el);
    wrap.append(kbdHost);

    const activeEl = el("div", "aw-cw-active");
    activeEl.style.display = "none";
    wrap.append(activeEl);

    root.append(wrap);

    loadPage(0);   // builds the first page's grid cells and shows the board
    relayout();
    requestAnimationFrame(() => requestAnimationFrame(relayout));
    const settleTimers = [setTimeout(relayout, 60), setTimeout(relayout, 200)];
    if (window.ResizeObserver) { ro = new ResizeObserver(relayout); ro.observe(gridWrap); }
    window.addEventListener("resize", relayout);

    showScore();

    // -------------------------------------------------------------------
    function relayout() { resizeGrid(); if (curWord >= 0) positionActive(); }

    // Score: the running points, GREEN when ≥0 and RED WITH a leading "-" when
    // negative (teacher, 11/8/2026 — previously dropped the sign and relied on
    // colour alone, same change as core's ui.setScore()); the slash + total
    // stay normal. Same look as Type the answer (its CSS isn't loaded here,
    // hence the .aw-cw-prefixed classes styled in crossword.css).
    // TIME COST (Đợt 143): the idle clock's total is subtracted on the way to the
    // SCREEN. `livePoints` stays the game's own tally — everything else in this
    // file reads and writes it — so the deduction can never be folded into it.
    function scoreNow() { return livePoints - (ui.timeCostTotal ? ui.timeCostTotal() : 0); }

    // `n` (Đợt 143) lets the engine's Time cost count-down drive this chip
    // frame by frame through ui.setScorePainter, instead of ui.setScore
    // replacing the whole "7 / 20" markup with a bare number.
    function showScore(n) {
      // ⭐⭐ FIGHT (Đợt 185) — measured: the team scoreboard stayed on 0 all match.
      // Crossword paints its OWN score chip ("3/20" with its own colours) and
      // therefore never calls `ui.setScore()` — which is the one route the
      // engine forwards to `fight.ctl.onScore()`. So in a match the points have
      // to be reported here, at this game's single scoring funnel. Same route
      // type-the-answer uses for the same reason.
      if (fightCtl) fightCtl.onScore(fightSide, scoreNow());
      if (!ui.scoreEl) return;
      const shown = n == null ? scoreNow() : Math.round(n);
      const cls = shown < 0 ? "aw-cw-score-neg" : "aw-cw-score-pos";
      ui.scoreEl.innerHTML = `${icons.check}`
        + `<span class="aw-cw-score-num ${cls}">${shown}</span>`
        + `<span class="aw-cw-score-sep">/</span>`
        + `<span class="aw-cw-score-total">${total}</span>`;
      ui.scoreEl.classList.remove("aw-cw-score-pulse");
      void ui.scoreEl.offsetWidth;
      ui.scoreEl.classList.add("aw-cw-score-pulse");
    }

    // The board fills the whole area between the clue and the bottom edge (the
    // keyboard is an absolute overlay, so it does NOT steal grid space) — the
    // crossword shows centred at maximum size with nothing clipped.
    function resizeGrid() {
      const box = gridWrap.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const pad = 10;
      const cell = Math.max(11, Math.floor(Math.min(
        (box.width - pad) / cols,
        (box.height - pad) / rows
      )));
      gridEl.style.setProperty("--cell", cell + "px");
    }

    // Rebuilds the grid's cells from the CURRENT page's grid/rows/cols — runs
    // once for the first page (loadPage(0), called from mount) and again each
    // time the game auto-advances to a new page (each page is independently
    // sized, since it's its own separate interlocking crossword).
    function buildGridDom() {
      gridEl.innerHTML = "";
      gridEl.style.setProperty("--cols", cols);
      gridEl.style.setProperty("--rows", rows);
      cellEls = new Map();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const g = grid[r][c];
          const cell = el("div", "aw-cw-cell" + (g ? "" : " is-blank"));
          if (g) {
            if (g.num) cell.append(el("span", "aw-cw-cellnum", String(g.num)));
            cell.append(el("span", "aw-cw-letter", ""));
            cell.dataset.rc = r + "," + c;
            press(cell, () => onCellClick(r, c));   // instant on touch-down — core/press.js
            cellEls.set(r + "," + c, cell);
          }
          gridEl.append(cell);
        }
      }
      resizeGrid();
    }

    // Switches to page `p`: points every page-scoped variable (grid/clues/
    // rows/cols/userGrid/cellStatus/wordState) at pageState[p] — these are the
    // SAME Map/array objects for the whole life of the game, so a page's
    // progress is never lost, just not currently on screen — then rebuilds
    // the grid cells and shows the board.
    function loadPage(p) {
      curPageIdx = p;
      ({ grid, clues, rows, cols, userGrid, cellStatus, wordState } = pageState[p]);
      curWord = -1; curCell = 0;
      buildGridDom();
      activate();
      updateNav();
      requestAnimationFrame(relayout);   // settle sizing once the new cells are in the DOM
    }

    // The shared nav row (teacher 4/8/2026): only shown at all when there is
    // more than one page, and even then it's a plain position indicator, never
    // a control (see the navWrap/CSS comments above) — a page only advances
    // once every one of its words is done.
    function updateNav() {
      // ⭐⭐ Đợt 186 — `index` is the ROW IN `review` (the engine reads it for the
      // Showdown pupil and the per-round clock), NOT the page number it used to
      // carry; the page still reads exactly as before through `label`, which the
      // engine prefers when given. And the call is no longer skipped on a
      // one-page crossword: the page LABEL was the only thing it used to say, but
      // the row has to be reported on every game.
      ui.setNav({
        index: curRow + 1, total, onPrev: null, onNext: null,
        label: PAGE_COUNT > 1 ? `Page ${curPageIdx + 1} / ${PAGE_COUNT}` : ""
      });
    }

    function positionActive() {
      if (curWord < 0) return;
      const W = wrap.clientWidth;
      if (!W) return;
      // Measure with offset* (relative to the wrap) instead of
      // getBoundingClientRect: offsets ignore CSS transforms, so the keyboard's
      // hide/show SLIDE never throws the maths off — the strip lands in its
      // final spot on frame one, mid-animation reads included.
      // topBound = the actual BOTTOM of the question text (not the fixed clue
      // box), so the strip stays balanced whether the question is 1 or 2 lines.
      const topBound = clueBar.offsetTop + clueText.offsetTop + clueText.offsetHeight;
      const kbdTop = kbdHost.offsetTop + kbd.el.offsetTop;
      const kbdBottom = kbdTop + kbd.el.offsetHeight;
      const kbdRight = kbdHost.offsetLeft + kbd.el.offsetLeft + kbd.el.offsetWidth;
      const w = clues[curWord];
      const L = w.cells.length;
      const GAP = Math.max(2, Math.round(W * 0.006));
      const isDown = w.dir === "D";
      let cell, left, top, width, height;

      if (!isDown) {
        const bandTop = topBound;
        const bandH = Math.max(40, kbdTop - bandTop);
        const availW = W * 0.92;
        cell = Math.min((availW - (L - 1) * GAP) / L, bandH * 0.68, W * 0.16);
        cell = Math.max(24, cell);
        left = 0; width = W; top = bandTop; height = bandH;
      } else {
        const regionTop = topBound;
        const regionH = Math.max(60, kbdBottom - regionTop);
        const gapRight = Math.max(60, W - kbdRight);
        cell = Math.min(gapRight * 0.72, (regionH - (L - 1) * GAP) / L, W * 0.14);
        cell = Math.max(22, cell);
        left = kbdRight; width = gapRight; top = regionTop; height = regionH;
      }

      activeEl.style.left = Math.round(left) + "px";
      activeEl.style.top = Math.round(top) + "px";
      activeEl.style.width = Math.round(width) + "px";
      activeEl.style.height = Math.round(height) + "px";
      activeEl.style.setProperty("--bigcell", Math.floor(cell) + "px");
      activeEl.style.setProperty("--biggap", GAP + "px");
    }

    // -------------------------------------------------------------------
    // board <-> word
    // -------------------------------------------------------------------
    function activate() {
      // ⭐⭐⭐ Đợt 259 (thầy, 25/8/2026) — THE 50% "NOT YOUR TURN" FADE IS GONE, and
      // with it the whole `applyPickTurn` mechanism this function used to have to
      // re-run. Thầy: *"vì đã có thanh thời gian để biết đội nào đang chọn, nên 2
      // đội có màu sắc như nhau, ko cần nhạt đi khi 1 trong 2 đội đang chọn"* — the
      // PICK TIME bar over each board (core/fight.js, Đợt 259) is the cue now, and
      // it is a better one: it says whose turn it is AND how long is left.
      // ⚠️ This also retires the Đợt 187 bug for good rather than papering over it.
      // That fix existed because `applyPickTurn` was evaluated in only ONE place
      // (`setPickTurn`), while core/fight.js's boardPicked() tells BOTH boards
      // "nobody is choosing now" BEFORE opening the word on them — so both boards
      // read `!fightMyTurn && curWord < 0` as true and sat at opacity .5 for the
      // whole round, which on this white stage was the white film over the entire
      // match the teacher reported. With no fade there is no second place that has
      // to agree with the first.
      // ⛔ `fightMyTurn` itself STAYS — onCellClick still needs it to know whether
      // this board may report a tap at all. Only the paint is gone.
      if (curWord < 0) {
        gridEl.classList.remove("is-dimmed");
        activeEl.style.display = "none";
        activeEl.classList.remove("is-pop");
        bigCells.clear();
        kbd.setHidden(true);
        clueBar.classList.remove("is-active");   // empty on the board (slogan is up top now)
        clueText.style.removeProperty("--fit");
        clueText.textContent = "";
        clueText.classList.remove("is-exit", "aw-clue-voiceonly");
        voicePlayer.stop();   // a word just closed — silence its clip, if any
        const oldBtn = clueBar.querySelector(".aw-voicebtn");
        if (oldBtn) oldBtn.remove();
        paintGrid();
        return;
      }
      gridEl.classList.add("is-dimmed");
      clueBar.classList.add("is-active");
      clueText.classList.toggle("is-exit", canExit);
      paintGrid();
      updateClueBar();
      // Size + place the strip BEFORE it becomes visible (positionActive reads
      // offset* geometry, which ignores the keyboard's slide transform, so the
      // result is right on the very first frame — no oversize flash, no drift).
      positionActive();
      renderActive();
      activeEl.style.display = "flex";
      // clean scale-in from the correct size (re-trigger by reflow each time)
      activeEl.classList.remove("is-pop");
      void activeEl.offsetWidth;
      activeEl.classList.add("is-pop");
      kbd.setHidden(false);
      kbd.refresh();
    }

    function selectWord(i) {
      ui.noteActivity?.();   // TIME COST (Đợt 143): picking a clue off the board is an action
      // ⭐ SHOWDOWN (Đợt 186) — opening a clue is when a question STARTS here, so
      // this is where the play order grows and the pupil's name moves on. A clue
      // re-opened later keeps the row it already had.
      // ⭐⭐⭐ Đợt 265b — MỘT LƯỢT MỚI = MỘT ROW MỚI, trừ đúng ca "mở lại cái mình vừa rời"
      // (xem ghi chú ở chỗ khai `playOrder`).
      // ⚠️ KHÔNG ÁP CHO FIGHT: ở đó trọng tài đánh số vòng và cả hai bàn phải hiểu số ấy
      // giống hệt nhau, nên row = chỉ số ô chữ.
      if (fightCtl) {
        if (!playOrder.some(k => k.page === curPageIdx && k.i === i)) playOrder.push({ page: curPageIdx, i });
        curRow = playOrder.findIndex(k => k.page === curPageIdx && k.i === i);
      } else {
        const last = playOrder[playOrder.length - 1];
        const sameOneAgain = !!last && last.page === curPageIdx && last.i === i && !wordState[i].done;
        if (!sameOneAgain) playOrder.push({ page: curPageIdx, i });
        curRow = playOrder.length - 1;
      }
      curTurn = curRow;
      ui.itemChanging?.(curRow, { outMs: 140, inMs: 200 });
      updateNav();
      // Wrap within the CURRENT page's clue count — `total` is now the grand
      // total across every page, not this page's count (teacher 4/8/2026).
      const n = clues.length;
      curWord = ((i % n) + n) % n;
      curCell = 0;   // typing always begins at the FIRST cell of the word
      activate();
    }

    function returnToBoard() {
      clearTimers();
      consumeAndrewGlow();
      curWord = -1;
      activate();
    }

    function onCellClick(r, c) {
      if (curWord >= 0 || finished) return;   // only pick from the board
      const through = clues.filter(w => w.cells.some(([cr, cc]) => cr === r && cc === c));
      if (!through.length) return;
      // pick an UNANSWERED word through this cell (a done word can't be reopened)
      const pick = through.find(w => !wordState[clues.indexOf(w)].done);
      if (!pick) return;
      // ⚠️ FIGHT: the tap is only REPORTED. The referee is what opens the word,
      // and it opens the SAME one on both boards at once; a board that opened
      // its own would put the two teams on different clues.
      if (fightCtl) {
        if (!fightMyTurn) return;             // faded board: not our turn to choose
        fightCtl.boardPicked(fightSide, clues.indexOf(pick));
        return;
      }
      selectWord(clues.indexOf(pick));
    }

    function paintGrid() {
      const inWord = curWord >= 0
        ? new Set(clues[curWord].cells.map(([r, c]) => r + "," + c))
        : new Set();
      cellEls.forEach((cell, rc) => {
        cell.classList.toggle("is-inword", inWord.has(rc));
        const st = cellStatus.get(rc);
        cell.classList.toggle("is-solved", st === "solved");
        cell.classList.toggle("is-revealed", st === "revealed");
        cell.classList.toggle("is-wrong", st === "wrong");
        const s = cell.querySelector(".aw-cw-letter");
        if (s) s.textContent = (st === "wrong") ? "" : (userGrid.get(rc) || "");
      });
    }

    // -------------------------------------------------------------------
    // the BIG active-word strip
    // -------------------------------------------------------------------
    function renderActive() {
      const w = clues[curWord];
      activeEl.className = "aw-cw-active " + (w.dir === "D" ? "is-down" : "is-across");
      activeEl.innerHTML = "";
      bigCells.clear();
      // ⭐ Đợt 259 — indexes are per-WORD, so a new strip starts with none typed
      // through. Forgetting this would carry "already typed" from a 6-letter word
      // into the 3-letter one opened next and kill its blink outright.
      typedGivens.clear();
      w.cells.forEach((_, i) => {
        const cell = el("div", "aw-cw-bigcell");
        cell.append(el("span", "aw-cw-biglet", ""));
        activeEl.append(cell);
        bigCells.set(i, cell);
      });
      refreshActiveCells();
    }

    // Re-apply every big cell's letter + look from the current state.
    function refreshActiveCells() {
      if (curWord < 0) return;
      const w = clues[curWord];
      const st = wordState[curWord];
      w.cells.forEach(([r, c], i) => {
        const rc = r + "," + c;
        const cell = bigCells.get(i);
        if (!cell) return;
        // Đợt 26 (same bug class as Open the box, đợt 26): useAndrew() below
        // reveals empty cells' gold hint letters with a STAGGERED fade+scale-in
        // (`is-hintin`, animation-delay per cell via --hd, fill-mode:both — held
        // at opacity:0/scale(.35) for cells still waiting their turn). This
        // function runs on EVERY keystroke (typeLetter/backspace), and the bare
        // reset below used to strip `is-hintin` off every cell in the word —
        // including ones whose reveal hadn't started or finished yet — the
        // instant the player typed their very first letter. With nothing left
        // to hold the mid-flight value, those cells SNAPPED straight to fully
        // visible before the new state was even computed. Capture whether it
        // was present before wiping the class, then hand it back below (still
        // an unfilled-hint cell -> same synchronous tick, no reflow in between
        // -> the browser treats it as no net change and the animation just
        // continues, or if it had already finished, the `both` fill's held end
        // state is unaffected either way — see the shakeCell() reflow trick
        // just below for why a FORCED reflow would restart it instead).
        // ⭐⭐ Đợt 259 (thầy, 25/8/2026) — A GIVEN LETTER BLINKS UNTIL THE CURSOR HAS
        // PASSED IT. Thầy: *"các chữ có sẵn … phải khác một chút so với các chữ đang
        // được bấm … không nhận ra được mình bấm chữ đó hay chưa do không có dấu
        // hiệu nhận biết rõ ràng"*. A crossing letter that another word already
        // filled sits in the strip looking finished, so on a long word a pupil
        // genuinely loses track of how far along they are. `is-given-wait` (added in
        // the two `is-given` branches below, and ONLY while `i >= curCell`) pulses
        // the letter; the moment the pupil types that same letter and the cursor
        // steps past it, the class stops being re-applied and the cell settles.
        // ⛔ THE CELL'S BACKGROUND IS DELIBERATELY UNTOUCHED — the teacher's own
        // choice ("nền vẫn như cũ"); only the letter moves.
        // ⚠️ Same wipe-and-restore contract as `is-hintin` right below: the class is
        // removed and re-added inside ONE synchronous tick with no forced reflow in
        // between, so the browser sees no net change and an infinite animation
        // simply keeps running instead of snapping back to its first frame.
        const wasHinting = cell.classList.contains("is-hintin");
        cell.className = "aw-cw-bigcell";
        const letEl = cell.querySelector(".aw-cw-biglet");
        let text = "";
        const cs = cellStatus.get(rc);

        if (st.done) {
          // graded end-state (shown briefly before the board comes back)
          if (st.correct) { cell.classList.add("is-solved"); text = userGrid.get(rc) || w.key[i]; }
          else if (st.revealed) { cell.classList.add("is-revealed"); text = w.key[i]; }
          else if (st.wrong) { cell.classList.add("is-wrong"); text = ""; }
        } else if (cs === "solved") {
          // a crossing "given" from a CORRECT word -> blue letter
          text = userGrid.get(rc) || w.key[i];
          cell.classList.add("is-given", "is-given-ok");
          if (i >= curCell && !typedGivens.has(i)) cell.classList.add("is-given-wait");
        } else if (cs === "revealed") {
          // a crossing "given" from a WRONG answer that was revealed -> grey letter
          text = userGrid.get(rc) || w.key[i];
          cell.classList.add("is-given", "is-given-bad");
          if (i >= curCell && !typedGivens.has(i)) cell.classList.add("is-given-wait");
        } else if (andrewGlowing && !userGrid.get(rc)) {
          // Andrew hint: the answer letter, glowing gold (still type it yourself)
          text = w.key[i];
          cell.classList.add("is-hint");
          if (wasHinting) cell.classList.add("is-hintin");   // see the comment above — keep its reveal running/settled, don't snap it
        } else {
          text = userGrid.get(rc) || "";
        }
        if (!st.done && i === curCell) cell.classList.add("is-cursor");
        letEl.textContent = text;
      });
    }

    function updateClueBar() {
      const w = clues[curWord];
      voicePlayer.stop();   // silence the PREVIOUS word's clip, if any
      const oldBtn = clueBar.querySelector(".aw-voicebtn");
      if (oldBtn) oldBtn.remove();
      const vv = voiceView(activity, w.src);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      clueText.classList.toggle("aw-clue-voiceonly", hideText);
      clueText.textContent = hideText ? "" : (w.clue || "(no clue)");
      if (hasVoice) {
        // Appended INSIDE clueText (not clueBar) on purpose, mirroring
        // Anagram's own pattern: `.aw-voicebtn`'s `font: inherit; width:
        // 0.9em` needs clueText's OWN dynamic font-size (--fit) to size
        // itself correctly, and updateClueBar()'s autoFit measures
        // `clueText.scrollHeight` — which correctly grows to include the
        // button, same as Anagram's outer-card fitter does for its clueEl.
        // Own click handler must stop propagation — .aw-cw-cluebar.is-active
        // itself is clickable (tap the clue to bail back to the board, see
        // the clueBar.onclick set up above) and would otherwise catch this
        // click too and exit the word the instant the button is tapped.
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); handleListenTap(w.src.voice, vBtn); });
        clueText.append(vBtn);
        // ⭐⭐ Đợt 259 — ONE CLIP PER MATCH. Both boards show the same word, so two
        // copies of one recording starting a few ms apart is the echo the teacher
        // heard ("hiện 2 cái lồng nhau"). Only the speaking board (core/fight.js's
        // `ctl.speaks`, board 0) auto-plays; the other board builds the same button
        // and lights it from the mirror instead.
        if (vv.autoPlay && (!fightCtl || fightCtl.speaks(fightSide))) voicePlayer.play(w.src.voice, vBtn);
        // …and it must catch up with a clip that is ALREADY sounding: this board's
        // clue bar is rebuilt on every word, while the glow was reported before the
        // button existed. Same PULL half Anagram added at Đợt 134.
        else if (fightCtl) {
          const st = fightCtl.voiceState && fightCtl.voiceState();
          if (st && st.playing) vBtn.classList.add("is-playing");
        }
      }
      if (clueFitter) { clueFitter.destroy(); clueFitter = null; }
      clueFitter = autoFit(clueBar, clueText, s => clueText.style.setProperty("--fit", s),
        { min: 0.55, slack: 4, measure: () => clueText.scrollHeight });
    }

    // ⭐ Đợt 259 — a tap on the listen button. Outside a match it is just a toggle.
    // Inside one, a tap on the NON-speaking board is handed to the referee, which
    // routes it to board 0 — so wherever the class taps, exactly one clip plays.
    function handleListenTap(clipId, btn) {
      if (fightCtl && !fightCtl.speaks(fightSide)) { fightCtl.requestVoiceToggle(clipId); return; }
      voicePlayer.toggle(clipId, btn);
    }

    // -------------------------------------------------------------------
    // typing
    // -------------------------------------------------------------------
    function setGridLetter(rc, ch) {
      const cell = cellEls.get(rc);
      if (cell) { const s = cell.querySelector(".aw-cw-letter"); if (s) s.textContent = ch || ""; }
    }

    function typeLetter(ch) {
      if (finished || curWord < 0) return;
      if (fightBoardLock) return;   // FIGHT: the other team already took this word
      const w = clues[curWord];
      if (wordState[curWord].done) return;
      // TIME COST (Đợt 143): typing a letter IS this game's progress. Grading
      // only happens at Submit, so waiting for that would charge a class the
      // whole time they were spelling a long word out — which is the work.
      ui.noteActivity?.();
      const [r, c] = w.cells[curCell] || w.cells[0];
      const rc = r + "," + c;
      const cs = cellStatus.get(rc);
      if (cs === "solved" || cs === "revealed") {
        // a locked "given" from another word — you must type the SAME letter to
        // move on. A different key is REJECTED: the cell shakes and the cursor
        // stays, so you can't fill the rest until you match it.
        const have = userGrid.get(rc) || "";
        if (ch === have) { typedGivens.add(curCell); advanceCursor(); refreshActiveCells(); }
        else { shakeCell(curCell); }   // no rebuild — that would clear the shake
        kbd.refresh();
        return;
      }
      userGrid.set(rc, ch);
      setGridLetter(rc, ch);
      advanceCursor();
      refreshActiveCells();
      kbd.refresh();
    }

    // wobble a big cell to say "not accepted" (wrong letter on a given cell).
    function shakeCell(i) {
      const cell = bigCells.get(i);
      if (!cell) return;
      crosswordSound.reject();   // a dull "thunk" to go with the wobble
      cell.classList.remove("is-shake");
      void cell.offsetWidth;
      cell.classList.add("is-shake");
      setTimeout(() => cell.classList.remove("is-shake"), 420);
    }

    function advanceCursor() {
      const w = clues[curWord];
      if (curCell < w.cells.length - 1) curCell++;
    }

    function backspace() {
      if (finished || curWord < 0 || wordState[curWord].done) return;
      ui.noteActivity?.();   // TIME COST (Đợt 143): correcting a letter is progress too
      const w = clues[curWord];
      // clear the current cell if it holds an editable letter…
      let [r, c] = w.cells[curCell] || w.cells[0];
      let rc = r + "," + c;
      if (userGrid.get(rc) && cellStatus.get(rc) == null) {
        userGrid.delete(rc); setGridLetter(rc, ""); refreshActiveCells(); return;
      }
      // …otherwise step back to the previous editable cell and clear it
      for (let k = curCell - 1; k >= 0; k--) {
        [r, c] = w.cells[k]; rc = r + "," + c;
        curCell = k;
        // ⭐ Đợt 259 — backing up UNDOES "I typed through this one": every given at
        // or after the new cursor position has to blink again, or a pupil who
        // rubbed a letter out would be looking at a strip that still claims they
        // had reached the end.
        typedGivens.forEach(i => { if (i >= k) typedGivens.delete(i); });
        if (cellStatus.get(rc) == null && userGrid.get(rc)) { userGrid.delete(rc); setGridLetter(rc, ""); }
        break;
      }
      refreshActiveCells();
    }

    function wordFilled(w) {
      return w.cells.every(([r, c]) => userGrid.get(r + "," + c));
    }

    function submitCurrentWord() {
      if (finished || curWord < 0 || wordState[curWord].done) return;
      if (fightBoardLock) return;   // FIGHT: locked out of this word
      if (!wordFilled(clues[curWord])) return;
      gradeWord();
    }

    // ================= FIGHT MODE (Đợt 185) =========================
    // All dead code outside a match (`fightCtl` is null).

    // The match opens clue `i` on BOTH boards.
    function fightGoTo(i) {
      if (finished) return;
      if (!clues[i]) return;
      fightHeld = null;
      fightBoardLock = false;
      selectWord(i);
      syncFightLock();
    }

    // The round is settled: play the reveal that gradeWord() held back. A board
    // that was LOCKED never answered — the teacher's rule is that it still sees
    // the answer and still counts as wrong ("câu trả lời vẫn hiện ra nhưng coi
    // như bị sai"), so it is marked here rather than left half-played.
    function revealFightWord() {
      if (!fightCtl || curWord < 0) return;
      const w = clues[curWord], st = wordState[curWord];
      const held = fightHeld;
      fightHeld = null;
      if (!st.done) {
        // locked out (or never got to submit): counts as wrong, with the same
        // penalty a wrong submit would have cost.
        st.done = true; st.wrong = true; st.correct = false;
        // ⭐ Đợt 256 — bị khoá cũng là một câu sai có trừ điểm, nên nó cũng phải bay.
        // Tới đây thì vòng ĐÃ ngã ngũ (đây là đường reveal) nên không còn gì để giấu,
        // nhưng vẫn để `null`: trong trận core/engine.js ép về giữa khung, và một quy
        // ước duy nhất cho cả file thì không ai phải nhớ ngoại lệ.
        if (minusOn) {
          ui.flyPenalty?.(null, penalty, () => { livePoints -= penalty; return scoreNow(); });
        }
      }
      if (held && held.correct) {
        w.cells.forEach(([r, c]) => cellStatus.set(r + "," + c, "solved"));
        paintGrid(); kbd.refresh();
        revealCorrectSequence(w);
      } else {
        // Show the right answer in the cells — for the team that typed a wrong
        // one AND for the team that was locked out.
        w.cells.forEach(([r, c]) => {
          const rc = r + "," + c;
          if (cellStatus.get(rc) !== "solved") cellStatus.set(rc, "wrong");
        });
        paintGrid(); kbd.refresh();
        flipRevealWord(w);
      }
      const card = root.querySelector(".aw-cw-wrap") || root.firstElementChild;
      card?.classList.remove("is-fightlost");
    }

    // Back to the board, ready for the next choice.
    function fightBackToBoard() {
      if (!fightCtl || finished) return;
      fightHeld = null;
      fightBoardLock = false;
      returnToBoard();
    }

    function fightCard() { return root.querySelector(".aw-cw-wrap") || root.firstElementChild; }

    function syncFightLock() {
      if (!fightCtl) return;
      if (fightBoardLock) kbd.setHidden(true);
      fightCard()?.classList.toggle("is-fightlost", fightBoardLock || !!fightHeld);
    }

    // ⭐⭐ Đợt 259 — `applyPickTurn()` IS DELETED, not left dormant (a half-removed
    // mechanism is what makes the next reader think it is still live). It did one
    // thing: put `.is-fightwait` on the board that was not choosing, which drew the
    // 50% fade the teacher has now dropped in favour of the PICK TIME bar. The
    // `is-fightwait` rule is gone from crossword.css in the same breath.
    // ⚠️ Open the box dropped its own fade one step later (Đợt 259c, "cho đồng bộ"),
    // so no pick-turn game fades today. It stays each template's own call, though —
    // core/fight.js has never dictated what a board does with `setPickTurn`.

    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total: clues.length,
        goToIndex: fightGoTo,
        lock(on) { fightBoardLock = !!on; syncFightLock(); },
        reveal: revealFightWord,
        // Đợt 259 — record only: the board no longer repaints itself for a change
        // of turn (see the note above applyPickTurn's deletion). `fightMyTurn` is
        // still what onCellClick checks before reporting a tap.
        setPickTurn(mine) { fightMyTurn = !!mine; },
        backToBoard: fightBackToBoard,
        // ⭐⭐ Đợt 259 (thầy: "chỉ mở duy nhất 1 voice trong chế độ voice khi fight —
        // hiện 2 cái lồng nhau") — THE VOICE HALF OF THE FIGHT CONTRACT, which this
        // template had simply never wired up. Both boards mount the same act, so
        // both were auto-playing the same clip a few ms apart: an echo, not a
        // reading. core/fight.js has had the answer since Đợt 133 (Anagram's) —
        // only board 0 owns real playback (`ctl.speaks`), a tap on the other board
        // is relayed here, and the glow is mirrored back the other way.
        // ⚠️ Guarded by `speaks()`: this is the RECEIVING end, and it must only ever
        // run on the one board allowed to make a sound.
        toggleVoiceRemote(clipId) {
          if (!fightCtl || !fightCtl.speaks(fightSide)) return;
          voicePlayer.toggle(clipId, clueBar.querySelector(".aw-voicebtn"));
        },
        // The mirror: whatever the speaking board reported, painted onto THIS
        // board's own listen button. No <audio> is involved on this side at all.
        syncVoice(state) {
          if (!state || state.playing === undefined) return;
          clueBar.querySelector(".aw-voicebtn")?.classList.toggle("is-playing", !!state.playing);
        }
      });
    }

    // -------------------------------------------------------------------
    // Andrew help — gold hint letters inside the cells (still typed by hand)
    // -------------------------------------------------------------------
    function useAndrew() {
      if (andrewUsed || finished || curWord < 0 || wordState[curWord].done) return;
      andrewUsed = true;
      andrewGlowing = true;
      refreshActiveCells();   // gold hint letters take their final (glowing) state
      kbd.refresh();          // Andrew key -> glowing
      crosswordSound.magic(); // a sparkly chime as the gold letters appear
      // …but reveal them ONE AT A TIME: stagger a smooth fade-in per empty cell.
      const w = clues[curWord];
      let beat = 0;
      w.cells.forEach(([r, c], i) => {
        const rc = r + "," + c;
        if (userGrid.get(rc)) return;          // already filled — no hint here
        const cell = bigCells.get(i);
        if (!cell || !cell.classList.contains("is-hint")) return;
        cell.style.setProperty("--hd", (beat * 120) + "ms");
        cell.classList.add("is-hintin");
        beat++;
      });
    }
    function consumeAndrewGlow() {
      if (!andrewGlowing) return;
      andrewGlowing = false;
      if (curWord >= 0) refreshActiveCells();
      kbd.refresh();          // Andrew key -> used (dark)
    }

    // -------------------------------------------------------------------
    // grading — every answer then returns to the board
    // -------------------------------------------------------------------
    function gradeWord() {
      const w = clues[curWord];
      const st = wordState[curWord];
      if (st.done) return;
      consumeAndrewGlow();
      const typed = w.cells.map(([r, c]) => userGrid.get(r + "," + c) || "").join("");
      const ok = typed === w.key;

      // ⭐⭐ FIGHT (Đợt 185) — the whole reveal is HELD BACK. In single play a
      // graded word walks its cells green (or red, then flips the answer in),
      // and every one of those is the answer written out in full on a board the
      // other team can read while it is still typing. The board is greyed
      // instead, and the match calls reveal() once the round is settled.
      if (fightCtl) {
        st.done = true;
        st.correct = ok;
        if (!ok) st.wrong = true;
        if (ok) { crosswordSound.correct(); livePoints += 1; }
        else crosswordSound.wrong();
        showScore();
        // ⭐⭐⭐ Đợt 256 — "−N" bay vào ô điểm rồi mới trừ. ⛔ KHÔNG bay ra từ ô chữ:
        // đây là game LƯỢT CHỌN Ô, bàn kia có thể còn đang gõ chính từ đó, và một con
        // số bay ra từ đúng dãy ô ấy là chỉ thẳng vào chỗ sai (luật "GIẤU ĐÁP ÁN KHI
        // VÒNG CÒN MỞ", Đợt 129 — cùng lý do cả nhánh này giữ lại toàn bộ reveal).
        // core/engine.js vốn đã ép chỗ bay ra về giữa khung trong mọi trận.
        // ⚠️ Không kèm `flyStars("lose")`: chùm sao bay ra TỪ CHÍNH DÃY Ô (`activeEl`)
        // nên nó là đúng thứ vừa nói ở trên — nó thuộc về đường reveal, không phải
        // đường này.
        if (!ok && minusOn) {
          ui.flyPenalty?.(null, penalty, () => { livePoints -= penalty; return scoreNow(); });
        }
        fightHeld = { i: curWord, correct: ok };
        syncFightLock();
        fightCtl.wordDone(fightSide, { index: curWord, correct: ok });
        return;   // the MATCH decides what happens next (reveal, then backToBoard)
      }

      // ⭐⭐ Đợt 265 — TIME EACH ROUND: the pupil's turn is over the instant the word is
      // graded, so their clock stops here. Quiz/Anagram/Type the answer have done this
      // since Đợt 174; this game never did, so the count down carried on running through
      // the whole reveal AND through however long the class then took to pick the next
      // clue — with the name of the pupil who had already answered sitting over it. It is
      // also what lets roundTimeUp() below stay a one-case rule: the buzzer can now only
      // ever catch a word that is actually open.
      ui.roundDone?.();
      // ⭐⭐ Đợt 265b — và GHI VÀO LƯỢT NÀY nữa (xem `turnOutcome`). `wordState` trả lời
      // "ô chữ này rốt cuộc thế nào"; hàng trong Show answers phải trả lời "em ấy, ở lượt
      // ấy, gõ gì".
      if (curTurn >= 0) turnOutcome[curTurn] = { correct: ok, typed };
      if (ok) {
        st.done = true; st.correct = true;
        w.cells.forEach(([r, c]) => cellStatus.set(r + "," + c, "solved"));
        // Each cell lights green with a ting, ONE AT A TIME; only after the LAST
        // ting do the gold stars launch and the score tick up.
        const lastTing = revealCorrectSequence(w);
        paintGrid(); kbd.refresh();
        pushTimer(() => { livePoints += 1; showScore(); flyStars("gain"); }, lastTing + 240);
        endWord(lastTing + 240 + 900);
      } else {
        let holdMs = 2500;
        if (opt.showAnswerWhenWrong !== false) {
          st.done = true; st.revealed = true;
          // Phase A: walk the word cell-by-cell — a letter the student got RIGHT
          // turns green with a ting, a WRONG one gets a small red ✕ (its wrong
          // letter still showing through).
          const lastMark = revealWrongSequence(w);
          kbd.refresh();
          const AFTER_X = 260;   // a beat after the LAST ✕ lands
          const STAR_FLY = 700;  // time for the red stars to leave the cells
          const FLIP = 520, HOLD = 700;
          // Minus mode: only ONCE every ✕ is on screen do the red stars fly and
          // the score drop; the correct answer then flips in AFTER the stars have
          // left the cells (never on top of them).
          let flipAt = lastMark + AFTER_X;
          if (minusOn) {
            // ⭐⭐⭐ Đợt 256 (thầy, 24/8/2026) — CON SỐ, KHÔNG CHỈ NGÔI SAO.
            // Chùm sao đỏ của Đợt ~90 vẫn bay y nguyên (nó là thứ nói "điểm rời khỏi Ô
            // NÀY"), nhưng nó không nói TRỪ BAO NHIÊU — mà đó chính là thứ thầy hỏi. Nay
            // có thêm một con số "−N" bay cùng, và PHÉP TRỪ ĐI THEO CON SỐ chứ không còn
            // xảy ra tức thì.
            pushTimer(() => {
              flyStars("lose");
              ui.flyPenalty?.(activeEl, penalty, () => { livePoints -= penalty; return scoreNow(); });
            }, lastMark + AFTER_X);
            flipAt = lastMark + AFTER_X + STAR_FLY;
          }
          // Phase B: the correct answer flips in; the strip settles to uniform grey.
          pushTimer(() => flipRevealWord(w), flipAt);
          holdMs = flipAt + FLIP + HOLD;
        } else {
          // grey ✕ on this word's own cells, then back to the board. No per-cell
          // walk here, so keep the single word-level "wrong" sound + immediate minus.
          if (minusOn) {
            flyStars("lose");
            ui.flyPenalty?.(activeEl, penalty, () => { livePoints -= penalty; return scoreNow(); });
          }
          crosswordSound.wrong();
          st.done = true; st.wrong = true;
          w.cells.forEach(([r, c]) => {
            const rc = r + "," + c;
            if (cellStatus.get(rc) !== "solved") cellStatus.set(rc, "wrong");
          });
          refreshActiveCells(); paintGrid(); kbd.refresh();
        }
        endWord(holdMs);
      }
    }

    // Phase A of a wrong answer (Show-answer ON): reveal the strip cell-by-cell.
    // A cell the student got RIGHT turns green with a ting; a WRONG cell gets a
    // small red ✕ with its wrong letter still visible underneath. A crossing
    // "given" is skipped (left as it is). Returns the delay (ms) at which the
    // LAST mark lands, so the caller can time Phase B + the return to the board.
    function revealWrongSequence(w) {
      const STEP = 190;
      let beat = 0, lastMark = 0;
      w.cells.forEach(([r, c], i) => {
        const rc = r + "," + c;
        const cs = cellStatus.get(rc);
        const bc = bigCells.get(i);
        if (!bc) return;
        if (cs === "solved" || cs === "revealed") return;   // a crossing given
        const correct = (userGrid.get(rc) || "") === w.key[i];
        const delay = beat * STEP; beat++; lastMark = delay;
        pushTimer(() => {
          if (correct) {
            bc.className = "aw-cw-bigcell is-solved is-cellpop";
            crosswordSound.ting();
          } else {
            bc.className = "aw-cw-bigcell is-xmark";
            crosswordSound.tac();
          }
        }, delay);
      });
      return lastMark;
    }

    // A CORRECT word: light every cell green with a ting, one at a time (left to
    // right). Returns the delay (ms) of the LAST ting so the caller can launch
    // the stars + score only once the whole word has chimed.
    function revealCorrectSequence(w) {
      const STEP = 165;
      let last = 0;
      w.cells.forEach(([r, c], i) => {
        const bc = bigCells.get(i);
        if (!bc) return;
        const delay = i * STEP; last = delay;
        pushTimer(() => {
          bc.className = "aw-cw-bigcell is-solved is-cellpop";
          crosswordSound.ting();
        }, delay);
      });
      return last;
    }

    // Phase B: the correct answer flips in over this word's OWN cells and the
    // whole strip settles to one uniform grey ("revealed"). A correct crossing
    // given keeps its blue look. The board is repainted to match.
    function flipRevealWord(w) {
      w.cells.forEach(([r, c], i) => {
        const rc = r + "," + c;
        userGrid.set(rc, w.key[i]); setGridLetter(rc, w.key[i]);
        const wasSolved = cellStatus.get(rc) === "solved";
        if (!wasSolved) cellStatus.set(rc, "revealed");
        const bc = bigCells.get(i);
        if (!bc || wasSolved) return;   // leave a correct crossing given as-is
        const letEl = bc.querySelector(".aw-cw-biglet");
        if (letEl) letEl.textContent = w.key[i];
        bc.className = "aw-cw-bigcell is-revealed is-flip";
      });
      paintGrid();
    }

    // Little stars burst around the current strip and fly into the score (pure
    // visual — the number already changed). Gold for a gain, red for a loss.
    // Appended to <body> (fixed px); a timeout tidies them up.
    function flyStars(kind) {
      const scoreEl = ui.scoreEl;
      const aRect = activeEl.getBoundingClientRect();
      if (!scoreEl || !aRect.width) return;
      // a little chime as the stars launch: rising for a gain, falling for a loss.
      if (kind === "lose") crosswordSound.starLose(); else crosswordSound.starGain();
      const sRect = scoreEl.getBoundingClientRect();
      const tx = sRect.left + sRect.width / 2;
      const ty = sRect.top + sRect.height / 2;
      const color = kind === "lose" ? "#ef4444" : "#ffc531";
      const N = 12;
      const stars = [];
      let maxEnd = 0;
      for (let i = 0; i < N; i++) {
        const star = el("div", "aw-cw-star", "★");
        star.style.color = color;
        const sx = aRect.left + (0.12 + 0.76 * (i % 6) / 5) * aRect.width + (Math.random() - 0.5) * 24;
        const sy = aRect.top + Math.random() * aRect.height;
        star.style.left = sx + "px";
        star.style.top = sy + "px";
        star.style.fontSize = (11 + Math.random() * 12) + "px";
        document.body.append(star);
        stars.push(star);
        const delay = 30 + i * 24;
        const dur = 520 + Math.random() * 220;
        maxEnd = Math.max(maxEnd, delay + dur);
        star.animate([
          { transform: "translate(-50%,-50%) scale(.4) rotate(0deg)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(1) rotate(25deg)", opacity: 1, offset: 0.22 },
          { transform: `translate(calc(-50% + ${tx - sx}px), calc(-50% + ${ty - sy}px)) scale(.5) rotate(180deg)`, opacity: 0 }
        ], { duration: dur, delay, easing: "cubic-bezier(.4,.5,.35,1)", fill: "forwards" });
      }
      setTimeout(() => stars.forEach(s => s.remove()), maxEnd + 150);
    }

    // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" Here
    // that is: the game finished, and the reveal/grading sequence a submitted
    // word runs through (up to ~3.5s of cell-by-cell animation during which no
    // key does anything). Sitting on the BOARD with no word open is NOT guarded
    // — "nobody has picked a clue yet" is precisely the stall this option exists
    // to charge for.
    // "Being graded" is read off state that already exists rather than a new
    // flag: a word is open (curWord >= 0) AND that word is already marked done,
    // which is true for exactly the window between Submit and the return to the
    // board. A separate boolean would be one more thing to keep in step.
    ui.setScoreProvider?.(scoreNow);
    ui.setScorePainter?.(v => showScore(v));
    // ⭐⭐⭐ Đợt 266 — VẾ "CLIP CÒN ĐANG ĐỌC", game này trước nay KHÔNG CÓ ⇒ lúc clue
    // đang được đọc thì Time cost vẫn trừ đều, tuy cả lớp đang nghe chứ không thể
    // làm gì. Đi qua ui.setVoiceGuard (không nhét vào idleGuard) vì trong Fight chỉ
    // bàn 0 có <audio> thật — xem core/engine.js voiceBusy().
    ui.setVoiceGuard?.(() => voicePlayer.isPlaying());
    ui.setIdleGuard?.(() =>
      finished || (curWord >= 0 && !!wordState[curWord] && wordState[curWord].done));

    /**
     * ⭐⭐⭐ TIME EACH ROUND — OUT OF TIME (Đợt 265, thầy 26/8/2026).
     * "Time each round" is offered for EVERY Showdown game (core/options-panel.js builds
     * the row on `showdown`, not on a template flag), yet until this đợt only Quiz,
     * Anagram and Type the answer answered the buzzer. Measured here
     * (`scratch/dot265-tf.html`): the bar emptied, the clock froze at 0,00 and every one
     * of the grid's cells stayed live. See true-false.js's roundTimeUp() for the teacher's
     * report in full.
     *
     * Out of time = WRONG (the teacher's rule, Đợt 174), which in this game is exactly
     * gradeWord()'s wrong branch for a word that was never submitted: the strip goes red,
     * the answer flips in when "Show corrects" is on, Minus mode charges its points once,
     * and endWord() takes the class back to the board.
     * ⚠️ ONE CASE ONLY — a word that is OPEN. The stretch where the class is looking at
     * the whole grid choosing the next clue belongs to nobody, and since this đợt the
     * clock is not even running then (`ui.roundDone()` in gradeWord). Picking a clue for
     * them at the buzzer would be a rule this game has nowhere else.
     * ⚠️ FIGHT MODE NEVER CALLS THIS: there the referee owns the turn, and Đợt 259's PICK
     * TIME is that mode's own answer to the same question.
     */
    ui.setRoundTimeout?.(() => {
      if (finished || fightCtl || curWord < 0) return;
      const w = clues[curWord], st = wordState[curWord];
      if (!w || !st || st.done) return;
      consumeAndrewGlow();
      st.done = true; st.wrong = true; st.correct = false;
      if (curTurn >= 0) {
        turnOutcome[curTurn] = { correct: false, typed: w.cells.map(([r, c]) => userGrid.get(r + "," + c) || "·").join("") };
      }
      crosswordSound.wrong();
      // Đợt 256's rule — a deduction has to be SEEN. `activeEl` is the strip the class is
      // looking at, and outside a match there is nobody to hide the answer from.
      if (minusOn) {
        ui.flyPenalty?.(activeEl, penalty, () => { livePoints -= penalty; return scoreNow(); });
      }
      w.cells.forEach(([r, c]) => {
        const rc = r + "," + c;
        if (cellStatus.get(rc) !== "solved") cellStatus.set(rc, "wrong");
      });
      refreshActiveCells(); paintGrid(); kbd.refresh(); showScore();
      if (opt.showAnswerWhenWrong !== false) {
        const FLIP = 520, HOLD = 700, AFTER = 300;
        pushTimer(() => flipRevealWord(w), AFTER);
        endWord(AFTER + FLIP + HOLD);
      } else {
        endWord(1200);
      }
    });

    // After the brief end-state, finish the game if every word is done, else
    // zoom back to the board (keyboard hides) so the next word is picked by hand.
    function endWord(ms) {
      // Captured NOW, not inside the timer: returnToBoard() below sets curWord
      // to -1, and the search for "the next clue after this one" needs to know
      // which one we actually just finished.
      const endedWord = curWord;
      pushTimer(() => {
        if (!wordState.every(s => s.done)) {
          // AUTO NEXT QUESTION (Đợt 143) — options.autoSwitch. A crossword has
          // no ▷ button: finishing a word normally drops the class back to the
          // whole board so someone can pick the next clue. With this on, the
          // next UNSOLVED clue opens by itself instead — searched forward from
          // the one just finished and wrapping round, so the game walks the grid
          // in clue order rather than jumping back to the top every time.
          // returnToBoard() first, and unconditionally: it is what clears the
          // pending per-cell reveal timers and the Andrew glow. Skipping it
          // would carry a half-played reveal into the next word.
          returnToBoard();
          if (opt.autoSwitch === true) {
            const n = clues.length, from = endedWord >= 0 ? endedWord : 0;
            for (let k = 1; k <= n; k++) {
              const i = (from + k) % n;
              if (!wordState[i].done) { selectWord(i); break; }
            }
          }
          return;
        }
        // This PAGE is fully done: auto-advance to the next one (a fresh
        // board, own grid) or finish the whole game on the last page.
        if (curPageIdx < PAGE_COUNT - 1) loadPage(curPageIdx + 1);
        else finish();
      }, ms);
    }

    // ⚠️ A SECOND `function scoreNow()` used to sit here — `wordState.filter(
    // s => s.correct).length`, with no caller anywhere in the file. Two function
    // DECLARATIONS of the same name in one scope don't clash: the later one just
    // silently wins. So when Đợt 143 added the real scoreNow() up beside
    // showScore(), this dead one quietly replaced it, and Crossword became the
    // one game of thirteen whose score provider handed the engine a number with
    // no Time cost taken off — no error, nothing on screen, caught only by
    // measuring what setScoreProvider actually returns. Deleted; do not
    // reintroduce a same-named helper without checking for an existing one.

    // -------------------------------------------------------------------
    // physical keyboard (typing + Enter=Submit; no arrows/tab navigation)
    // -------------------------------------------------------------------
    function onKey(e) {
      if (finished || curWord < 0) return;
      const k = e.key;
      if (k === "Backspace") { e.preventDefault(); backspace(); kbd.refresh(); return; }
      if (k === "Enter") { e.preventDefault(); return submitCurrentWord(); }
      if (k === "Escape") { if (canExit) { e.preventDefault(); returnToBoard(); } return; }
      if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); typeLetter(k.toUpperCase()); }
    }

    // -------------------------------------------------------------------
    function finish() {
      // ⚠️⚠️ Đợt 256 — CHỐT SỔ TRƯỚC KHI ĐỌC ĐIỂM. Một con số "−N" còn đang bay là một
      // phép trừ CHƯA áp vào `livePoints`, mà `score` dưới đây đọc thẳng ra từ đó.
      ui.flushPenalties?.();
      if (finished) return;
      finished = true;
      consumeAndrewGlow();
      clearTimers();
      curWord = -1;
      kbd.setHidden(true);
      kbd.refresh();
      // Aggregate across EVERY page, in page order — a page's own userGrid/
      // wordState survive after the game auto-advances past it (loadPage()
      // never discards pageState), so this sees the whole game's results,
      // not just whichever page happens to be on screen right now.
      const review = [];
      const perQuestion = [];
      let correct = 0, answered = 0, wrongDone = 0;
      // ⭐⭐ Đợt 186 — WALKED IN PLAY ORDER, not grid order. The class chooses
      // which clue to open, so the grid's own order is not the order the
      // questions were played — and Showdown hands row `n` to pupil `n` (the
      // reason Đợt 178 left this game out). `playOrder` holds {page, i} in the
      // order words were opened; anything never opened is appended after it in
      // grid order, so nothing drops out of Show answers.
      const seq = [...playOrder];
      pageState.forEach((ps, p) => ps.clues.forEach((w, i) => {
        if (!seq.some(k => k.page === p && k.i === i)) seq.push({ page: p, i });
      }));
      // ⭐⭐ Đợt 265b — hàng `t` = LƯỢT thứ `t`, nên nó đọc `turnOutcome[t]` chứ không đọc
      // `wordState` (một ô chữ bị bỏ dở rồi mở lại có HAI lượt, và chỉ lượt sau mới có
      // người chấm). Ô chữ chưa ai mở nằm sau `playOrder.length` nên không có lượt nào.
      seq.forEach(({ page, i }, t) => {
        const ps = pageState[page];
        const w = ps && ps.clues[i];
        if (!w) return;
        // ⚠️⚠️ FIGHT ĐỌC NGUỒN CŨ. `turnOutcome` chỉ được ghi ở nhánh chơi đơn của
        // `gradeWord()` — nhánh fight `return` trước đó — nên trong trận nó rỗng và mọi
        // hàng sẽ đọc thành "chưa trả lời". Trong trận mỗi ô chữ chỉ chơi đúng một lần
        // (trọng tài đánh số vòng, không có chuyện bỏ dở rồi mở lại), nên `wordState` đúng.
        const st = ps.wordState[i];
        const o = fightCtl
          ? (st.done ? { correct: st.correct === true, typed: w.cells.map(([r, c]) => ps.userGrid.get(r + "," + c) || "·").join("") } : null)
          : (t < playOrder.length ? turnOutcome[t] : null);
        if (o && o.correct) correct++;
        if (o) { answered++; if (!o.correct) wrongDone++; }
        perQuestion.push({ q: perQuestion.length, correct: !!o && o.correct === true });
        review.push({
          question: w.clue,
          answered: !!o,
          yourText: o ? o.typed : null,
          yourCorrect: !!o && o.correct === true,
          correctText: w.answer || w.key,
          src: w.src
        });
      });
      // Deducted score for ranking/summary: +1 per correct word, −penalty per
      // wrong-and-graded word (Minus mode only). Computed HERE from `wordState`
      // (set synchronously in gradeWord) rather than read off `livePoints` — that
      // variable is only updated inside `pushTimer` callbacks fired well after the
      // per-cell reveal animation, and reading it right at finish() risks catching
      // it mid-update (same class of bug found + fixed in Type the answer's
      // finish(), which had a much tighter margin). Without any of this, the score
      // silently defaulted to `correct` and "Minus mode" had zero effect on the
      // final result.
      const score = minusOn ? correct - penalty * wrongDone : correct;
      // ⭐ Đợt 265b — mẫu số là SỐ HÀNG (= số lượt + ô chữ chưa ai mở), để `review` và
      // `perQuestion` luôn dài bằng nhau và bằng `total` (engine cắt chúng theo cặp ở chế
      // độ Free). Không có ô chữ nào bị bỏ dở thì con số này y hệt `total` cũ.
      const rowTotal = review.length;
      // ⭐⭐ Đợt 294 — `items` = SỐ Ô CHỮ CỦA ĐỀ (đếm qua mọi trang), đứng CẠNH `total`
      // (= số lượt: một ô chữ bỏ dở rồi mở lại có HAI hàng) chứ không thay nó. Màn tổng
      // kết vẫn đọc `total` như Đợt 265b; chỉ con số NỘP LÊN BÀI GIAO mới lấy `items` —
      // xem ghi chú dài ở core/scoring.js.
      const itemTotal = pageState.reduce((n, ps) => n + ps.clues.length, 0);
      ui.finish({ correct, incorrect: rowTotal - correct, total: rowTotal, items: itemTotal, perQuestion, review, answered, score });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", relayout);
      if (navWrap) navWrap.style.visibility = "";
      if (sloganEl) sloganEl.remove();
      if (topbar) topbar.style.position = "";
      document.querySelectorAll(".aw-cw-star").forEach(s => s.remove());
      if (ro) ro.disconnect();
      if (clueFitter) clueFitter.destroy();
      clearTimers();
      settleTimers.forEach(clearTimeout);
      voicePlayer.stop();
    };
  }
};

registerTemplate(crosswordTemplate);
export default crosswordTemplate;
