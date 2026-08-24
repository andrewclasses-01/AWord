// =============================================================
// TEMPLATE: UNJUMBLE — Wordwall "Whiteboard" style (= "Classic" for AWord),
// English UI. Rebuild of https://wordwall.net/resource/116872783/unjumble.
//
//  • The teacher types a correct SENTENCE; the game splits it into WORDS and
//    scrambles the WORD ORDER. The player rebuilds the sentence by DRAGGING
//    words into place (real drag-and-drop with insert + reflow, like the
//    Wordwall original — pointer events so it works with mouse AND touch on
//    the TOMKO board).
//  • Words use the shared AWord font (Baloo 2) as light draggable chips. A word
//    turns GREEN when it reaches its correct place, RED (only in "On submit"
//    mode, after Submit) when wrong. Colour alone carries the meaning — there
//    are no small per-word tick/cross badges (teacher's request).
//
//  • Two MARKING modes, chosen in Options (switching restarts the act,
//    see optionsNeedRestart()):
//      "bonus"  = Words with bonus (default) — each sentence has a MINIMUM
//                 number of drag-moves needed to solve it (minMoves = n - LIS
//                 of the scramble). Solve it in exactly that many moves → a
//                 "PERFECT" pops and the sentence scores 2 points. Solve it in
//                 MORE moves → a big ✓ shows and it scores 1 point. Words still
//                 turn green live as they land home.
//      "submit" = On submit — reorder freely, then a SUBMIT button marks every
//                 position green/red in turn and reveals the correct sentence
//                 if any word is wrong; 1 point per correct word.
//
//  • Options: timer (engine), shuffleQuestions (engine), show answers
//    (engine), plus this template's Marking mode + text Alignment (left /
//    centered). Mouse/touch only, by design — no keyboard shortcuts.
//  • A single drag re-renders only the BOARD (not the whole card) so the
//    card's fade-in never replays mid-play (the flash bug documented for
//    Anagram / Open the box). Full render() runs only at real boundaries
//    (sentence start/change, or once when a sentence finishes).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
// Dot 143 - every penalty in the app is on ONE scale now (0..100, step 1).
// Importing the numbers rather than repeating them is what stops this
// game's slider and its mount() clamp drifting apart again.
import { POINTS_MAX, POINTS_STEP } from "../../core/options-panel.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { unjumbleSound } from "./unjumble-sound.js";
import { openUnjumbleEditor } from "./unjumble-editor.js";

const STAGGER_MS = 240;     // ms — gap between each position's reveal in "submit" mode
const INTRO_MS = 3272;      // ms — matches intro.mp3 (~3.27s): full "zoom in from far" intro
const DROP_FLY_MS = 190;    // ms — a dropped word glides smoothly to its caret slot

// Little sparkle stars that stream to the score — gold on a correct sentence,
// red on a wrong one (submit mode).
const STAR_SVG = `<svg viewBox="0 0 24 24" fill="#ffd23f" stroke="#e8920c" stroke-width="1"><path d="M12 2l2.6 6.3L21 9l-5 4.3L17.6 20 12 16.4 6.4 20 8 13.3 3 9l6.4-.7z"/></svg>`;
const STAR_RED_SVG = `<svg viewBox="0 0 24 24" fill="#ef4b57" stroke="#a5111c" stroke-width="1"><path d="M12 2l2.6 6.3L21 9l-5 4.3L17.6 20 12 16.4 6.4 20 8 13.3 3 9l6.4-.7z"/></svg>`;

// Shared "hold, then fly to the score, morph into +points, pulse-count it in"
// timings (same feel as Anagram's PERFECT bonus).
const FLYGAIN_HOLD_MS = 550;
const FLYGAIN_FLIGHT_MS = 550;
const FLYGAIN_PULSE_MS = 420;
const FLYGAIN_TOTAL_MS = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;

// Split a sentence into words (whitespace), keeping punctuation attached to
// its word (e.g. "week." stays one token, matching Wordwall). Returns
// { words, order } where order[displaySlot] = wordIndex, scrambled so it
// differs from the solved order.
function prepareItem(sentence) {
  let s = String(sentence ?? "").trim();
  // Trailing "?" / "!" becomes a FIXED end token: pre-placed, never scrambled,
  // never draggable (teacher, Đợt 41). "." and "," stay attached to their word.
  let fixed = null;
  const m = /[?!]+$/.exec(s);
  if (m) { fixed = m[0]; s = s.slice(0, s.length - fixed.length).trim(); }
  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length && fixed) { words.push(fixed); fixed = null; }   // degenerate "?!" only
  const n = words.length;
  let order = words.map((_, i) => i);
  // Prefer a DERANGEMENT (no word left in its correct slot) so the puzzle
  // never starts half-solved; fall back to "any order != solved" if a clean
  // derangement isn't found (or n <= 1, where none exists).
  const homeCount = ord => ord.reduce((c, id, i) => c + (id === i ? 1 : 0), 0);
  let best = order, bestHome = homeCount(order);
  for (let tries = 0; tries < 40 && bestHome > 0; tries++) {
    const cand = shuffle(order);
    const h = homeCount(cand);
    if (h < bestHome) { best = cand; bestHome = h; }
  }
  order = best;
  if (n > 1 && homeCount(order) === n) order = shuffle(order);   // guard: never leave it fully solved
  return { words, order, fixed };
}

function sentenceText(it) { return it.words.join(" ") + (it.fixed || ""); }
function itemSentence(it) { return it.sentence ?? it.text ?? it.word ?? ""; }

// Lives: 0 / null = unlimited; 1..10 = that many hearts. undefined -> unlimited
// (off by default for Unjumble; the teacher turns it on with the slider).
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(10, Math.max(1, Math.round(v)));
}

const unjumbleTemplate = {
  type: "unjumble",
  scorable: true,
  // TIME COST (Đợt 143) — opt in to the shared "-N per idle second" option.
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  // ⭐ Đợt 178 — SHOWDOWN. `render()` is the single funnel (mount · goPrev ·
  // goNext), `updateNav()` sends `setNav({index: index + 1})`, and `review` is
  // `items.map((it, i) => …)` on that index.
  showdownMode: true,
  hidePointsOff: true,   // ships its own "Points off when wrong" control
  // Đợt 143 (opt-in) — really reads options.autoSwitch now: a graded sentence
  // walks on to the next one by itself instead of waiting for ▷.
  usesAutoSwitch: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showCorrects", "autoNext", "allowSkip", "showAnswers"],
  name: "Unjumble",
  hasLivesSlot: true,       // hearts render in the top bar, left of the score (like True/false)

  // Show answers as a readable STACKED list (full-width sentences) instead of the
  // 3-column layout, which squashed long sentences to nothing (teacher, Đợt 40).
  reviewStyle: "stacked",

  // Defer the clock so it stays at 0:00 during the whiteboard intro (Classic).
  // begin() mounts without starting the timer; mount() calls ui.startTimer()
  // once the intro finishes (or immediately on non-Classic styles).
  manualTimerStart: true,

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .map(it => ({ clue: it.clue || "", answer: itemSentence(it) }))
      .filter(x => x.answer);
  },

  edit: openUnjumbleEditor,

  // Đợt 140 — shared panel builders (see core/engine.js buildOptionsPanel).
  buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck }) {
    const cMode = mkCell({ label: "Marking" });
    cMode.ctl.append(mkSeg([
      { value: "bonus", label: "With bonus", title: "Words with bonus" },
      { value: "submit", label: "On submit" }
    ], draft.unjumbleMode === "submit" ? "submit" : "bonus",
      v => { draft.unjumbleMode = v; }));

    const cAlign = mkCell({ label: "Alignment" });
    cAlign.ctl.append(mkSeg([
      { value: "left", label: "Left" },
      { value: "center", label: "Centered" }
    ], draft.align === "center" ? "center" : "left",
      v => { draft.align = v; }));

    panel.append(
      cMode.cell, cAlign.cell,
      // On-submit mode: how many points a WRONG sentence costs (0–5).
      mkSliderCell({
        label: "Points off", sub: "wrong sentence", min: 0, max: 5, step: 1,
        value: Math.max(0, Math.min(POINTS_MAX, draft.pointsOff == null ? 20 : draft.pointsOff)), offAt: 0,
        fmt: v => (v === 0 ? "Off" : "-" + v),
        onInput: v => { draft.pointsOff = v; }
      }).cell,
      // Lives (0 = unlimited, 1..10 hearts) — like True/false.
      mkSliderCell({
        label: "Lives", min: 0, max: 10, step: 1,
        value: (draft.lives == null || draft.lives === 0) ? 0 : Math.min(10, Math.max(1, Math.round(draft.lives))),
        tone: "green", offAt: 0,
        fmt: v => (v === 0 ? "∞" : String(v)),
        onInput: v => { draft.lives = v; }
      }).cell
    );

    // On-submit mode: whether a wrong submission reveals the correct sentence.
    // ⭐ Đợt 213b (thầy, 20/8/2026) — nhãn đổi thành "Show corrects".
    // ⚠️ CHỈ đổi CHỮ HIỆN RA; trường lưu vẫn là `showAnswerWhenWrong` nên act cũ
    // chạy y nguyên, không cần di trú. Mã định danh `showCorrects` mới là thứ
    // `checkOrder` dùng để xếp chỗ (xem addCheck trong core/options-panel.js).
    addCheck("Show corrects", draft.showAnswerWhenWrong !== false,
      v => { draft.showAnswerWhenWrong = v; }, { key: "showCorrects", title: "Show the correct answer after a wrong one" });
    // ⭐⭐ Đợt 220 (thầy, 21/8/2026) — MẶC ĐỊNH TẮT, THỐNG NHẤT CẢ BỐN TEMPLATE.
    // Trước đợt này Anagram + Unjumble mặc định BẬT (`!== false`) còn Quiz + Type the
    // answer mặc định TẮT (`=== true`) — cùng một ô tích, hai nết trái ngược, và thầy
    // không có cách nào biết mình đang ở nết nào ngoài việc mở Options ra soi.
    // ⚠️ ĐÂY LÀ THAY ĐỔI HỒI TỐ và đó là điều thầy chọn: mọi act Anagram/Unjumble trong
    // thư viện chưa từng đụng tới ô này sẽ chuyển sang CHẶN ngay lần chơi sau.
    // ⭐ Từ Đợt 220 ô này còn là CÔNG TẮC của luật chặn ‹ › trong Fight (xem
    // `mayLeaveRound()` trong core/engine.js): bật lên là cố ý cho phép cắt ngang đội kia.
    // ⛔ Ô NÀY TRƯỚC ĐÂY KHÔNG HỀ TỒN TẠI Ở UNJUMBLE, dù `mount()` vẫn đọc `opt.allowSkip`
    // — tức là một tuỳ chọn có thật, luôn BẬT, và không có đường nào tắt. Nay mặc định
    // TẮT thì bắt buộc phải có ô để bật lại, kẻo là tước mất một lối chơi.
    addCheck("Allow skip", draft.allowSkip === true, v => draft.allowSkip = v,
      { key: "allowSkip", title: "Allow skip (Next can move on early)" });
  },

  // Any Options change restarts the act (the 3 marking models are not
  // compatible mid-play), same as Anagram.
  optionsNeedRestart() { return true; },

  // Engine lifecycle sounds — real Whiteboard-theme mp3s.
  sounds: {
    play: unjumbleSound.play,
    restart: unjumbleSound.restart,
    timeWarning: unjumbleSound.timeWarning,
    complete: unjumbleSound.complete
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.unjumbleMode === "submit" ? "submit" : "bonus";
    const align = opt.align === "center" ? "center" : "left";
    const allowSkip = opt.allowSkip === true;   // Đợt 220 — mặc định TẮT, thống nhất 4 template
    const showAnswerWhenWrong = opt.showAnswerWhenWrong !== false;   // submit mode reveal (default on)
    const pointsOff = Math.max(0, Math.min(POINTS_MAX, opt.pointsOff == null ? 20 : opt.pointsOff));   // submit wrong penalty (0..100 since Dot 143)
    const startLives = normLives(opt.lives);   // null = unlimited
    let livesLeft = startLives;

    let items = [...(activity.content?.items || [])]
      .filter(it => it && String(itemSentence(it)).trim());
    if (opt.shuffleQuestions) items = shuffle(items);
    // `src` = the ORIGINAL content object, carried through so "Start with
    // mistakes" can filter activity.content.items by identity (core/mistakes.js).
    items = items.map(it => ({ clue: it.clue || "", ...prepareItem(itemSentence(it)), src: it }));

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-unj-empty", "This unjumble has no sentences yet."));
      return () => {};
    }

    const state = items.map(() => ({
      order: null,          // set from item's scrambled order in render()
      moveCount: 0,         // bonus: how many reordering drags the player has made
      minMoves: 0,          // bonus: fewest drags that can solve this scramble
      graded: false,        // board locked (solved in live modes / submitted)
      correct: null,        // whole sentence correct (bool once decided)
      points: 0,
      marks: null           // submit: per-slot "correct"|"wrong" after reveal
    }));
    // seed each state's working order + minimum-moves target from the prepared item once
    state.forEach((st, i) => {
      st.order = [...items[i].order];
      // Minimum number of "lift one word, drop it anywhere" moves to sort the
      // scramble = n − (longest already-in-order run) = n − LIS. Words left in a
      // longest increasing subsequence never need to move; every other word costs
      // exactly one drag.
      st.minMoves = items[i].words.length - lisLength(items[i].order);
    });

    let index = 0;
    let finished = false;
    // "this mount was thrown away" — set ONLY by cleanup(). Separate from
    // `finished` (the game legitimately ended) so a real finish still animates
    // its closing score pulse (Đợt 114).
    let dead = false;
    let busy = false;
    let fitter = null;
    let autoTimer = null;
    let boardEl = null;
    let submitBtnEl = null;
    let revealEl = null;
    let introEl = null;
    const activeFlyNodes = new Set();

    // The whiteboard photo is the WHOLE-stage background for the Classic
    // ("Whiteboard") style. We tag the stage from here (no core change) and let
    // CSS gate it on `.theme-classic`; the tag is removed in cleanup. Switching
    // Style live to another look then drops the photo automatically via CSS.
    const stageEl = root.closest(".aw-stage");
    if (stageEl) stageEl.classList.add("aw-unj-active");
    const isClassic = (activity.theme || "classic") === "classic";
    root.style.position = "relative";   // lets the next/back crossfade overlap two cards (no flash)

    // Slogan on the clock/score row (like Crossword): the clue + moves counter
    // sit inside the card instead (see below).
    const topbarEl = stageEl ? stageEl.querySelector(".aw-topbar") : null;
    if (topbarEl) topbarEl.style.position = "relative";
    let introActive = false;
    let sloganEl = null;
    if (topbarEl) {
      sloganEl = el("div", "aw-unj-slogan");
      // per-WORD spans so the intro title can fly each word onto its match.
      ["UNJUMBLE", "IN", "ANDREW", "CLASSES"].forEach((w, i) => {
        if (i) sloganEl.append(document.createTextNode(" "));
        sloganEl.append(el("span", "aw-unj-slogw", w));
      });
      // Hidden while the intro plays; the intro title flies up and hands off to it
      // (runIntro reveals it). With no intro, it's visible straight away.
      sloganEl.style.opacity = (isClassic && stageEl) ? "0" : "1";
      topbarEl.append(sloganEl);
    }
    // The clue (top of the card, under the slogan) and the "N moves for bonus"
    // counter (bottom of the card, where Submit sits, coloured green) now live
    // INSIDE the card, so they're hidden with the words during the intro and
    // appear only when the words do (teacher, Đợt 40). render() (re)creates them;
    // movesEl is tracked here so updateBonusMoves can refresh it live.
    let movesEl = null;
    function updateBonusMoves() {
      if (!movesEl) return;
      const st = state[index];
      const remaining = st.minMoves - st.moveCount;
      movesEl.textContent = (mode === "bonus" && !st.graded && remaining > 0)
        ? `${remaining} move${remaining === 1 ? "" : "s"} for bonus` : "";
    }
    // Show the score as "N / max" like the other templates (teacher, Đợt 42), red
    // when negative. maxScore counts by SENTENCE: bonus = 2 per sentence, submit = 1.
    const maxScore = mode === "submit" ? total : 2 * total;
    function showScore(val) {
      if (dead) return;   // Đợt 114 — live lookup: on a dead play this hits the NEXT game's badge
      const sc = document.querySelector(".aw-top-score");
      if (!sc) return;
      sc.innerHTML = `${icons.check} ${val} <span class="aw-unj-smax">/ ${maxScore}</span>`;
      sc.classList.toggle("aw-unj-neg", val < 0);
    }

    // ---- Lives: hearts in the top bar, left of the score (like True/false) ----
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                     // unlimited -> no hearts
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }
    function loseLife() {
      if (livesLeft == null) return false;               // unlimited -> can't lose
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;   // leftmost heart pops
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const fin = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = fin;
        } catch { fin(); }
        setTimeout(fin, 360);
      } else renderLives();
      return livesLeft <= 0;                             // true = that was the last life
    }
    // Shrink a one-line element's font until it fits `card`'s width (used for the clue).
    function fitOneLine(elm, card) {
      elm.style.fontSize = "";
      const maxW = card.clientWidth * 0.9;
      const w = elm.scrollWidth;
      if (w > maxW) {
        const base = parseFloat(getComputedStyle(elm).fontSize) || 16;
        elm.style.fontSize = Math.max(8, base * maxW / w) + "px";
      }
    }

    introActive = isClassic && !!stageEl;   // the "moves for bonus" line stays hidden until the intro ends
    ui.onSubmit(finish, () => state.filter(st => doneCheck(st)).length);   // block "Submit answers" at 0 answered
    render();
    renderLives();

    // Intro (Classic): the title zooms in over ~3.3s (intro.mp3), then the clock
    // starts. Other Styles skip straight in. The clock only starts here
    // (manualTimerStart defers it in the engine).
    if (introActive) runIntro(() => ui.startTimer());
    else ui.startTimer();

    function doneCheck(s) { return mode === "submit" ? s.graded === true : s.correct === true; }
    // TIME COST (Đợt 143): one place decides what the score is. Every showScore()
    // in this file is fed from here, so an ordinary score update can never
    // repaint the idle clock's deduction away.
    function scoreNow() {
      return state.reduce((sum, s) => sum + (s.points || 0), 0)
        - (ui.timeCostTotal ? ui.timeCostTotal() : 0);
    }

    // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" Here
    // that is: the game over, the mount thrown away, the whiteboard INTRO (3.3s
    // during which the words aren't even draggable yet), and the grading/reveal
    // animation (`busy`).
    // ⚠️ setScorePainter, not just setScoreProvider: this game writes its own
    // "N / max" chip into .aw-top-score, so the engine's count-down would
    // otherwise replace that whole chip with a bare number.
    ui.setScoreProvider?.(scoreNow);
    ui.setScorePainter?.(v => showScore(v));
    ui.setIdleGuard?.(() => finished || dead || busy || introActive);

    // ---------- full render (real boundaries only) ----------
    // `transition === "cross"` keeps the outgoing card on screen and crossfades to
    // the new one so next/back never flashes the bare background (teacher, Đợt 36).
    function render(transition) {
      // ⭐ Đợt 178 — SHOWDOWN: start the name's fall in the same frame the card
      // starts its crossfade, rather than at `setNav` inside updateNav() further
      // down. 200ms both ways is `crossfadeCards`' own duration, so the two
      // motions cannot drift apart if that is ever retimed.
      ui.itemChanging?.(index, { outMs: 200, inMs: 200 });
      const oldCard = transition ? root.querySelector(".aw-unj-card") : null;
      if (fitter) { fitter.destroy(); fitter = null; }
      if (!oldCard) root.innerHTML = "";
      submitBtnEl = null; revealEl = null;
      const it = items[index];
      const st = state[index];
      st._green = greenPrefix(st.order);   // sync the "correct-run" marker for this sentence

      const card = el("div", "aw-unj-card");
      card.append(doodleLayer());

      // clue at the TOP of the card, under the slogan (teacher, Đợt 40)
      let clueLineEl = null;
      if (it.clue) { clueLineEl = el("div", "aw-unj-clue", escapeHtml(it.clue)); card.append(clueLineEl); }

      boardEl = el("div", "aw-unj-board" + (align === "center" ? " is-centered" : ""));
      card.append(boardEl);

      movesEl = null;
      if (mode === "submit") {
        revealEl = el("div", "aw-unj-reveal");
        revealEl.textContent = (st.correct === false && showAnswerWhenWrong) ? sentenceText(it) : "";
        card.append(revealEl);
        submitBtnEl = el("button", "aw-unj-submit", "Submit");
        submitBtnEl.type = "button";
        press(submitBtnEl, doSubmit);   // instant on touch-down — core/press.js
        card.append(submitBtnEl);
      } else {
        // "N moves for bonus" sits at the BOTTOM of the card, where Submit would be.
        movesEl = el("div", "aw-unj-moves"); card.append(movesEl);
      }

      root.append(card);
      if (oldCard) crossfadeCards(oldCard, card);
      renderBoard();
      updateSubmitState();
      updateBonusMoves();
      if (clueLineEl) fitOneLine(clueLineEl, card);

      const clueH = clueLineEl ? clueLineEl.offsetHeight + (parseFloat(getComputedStyle(clueLineEl).marginBottom) || 0) : 0;
      const boardMarginBottom = parseFloat(getComputedStyle(boardEl).marginBottom) || 0;
      const revealMarginTop = revealEl ? parseFloat(getComputedStyle(revealEl).marginTop) || 0 : 0;
      const btnMarginTop = submitBtnEl ? parseFloat(getComputedStyle(submitBtnEl).marginTop) || 0 : 0;
      const movesH = movesEl ? movesEl.offsetHeight + (parseFloat(getComputedStyle(movesEl).marginTop) || 0) : 0;
      const cardPad = (parseFloat(getComputedStyle(card).paddingTop) || 0) + (parseFloat(getComputedStyle(card).paddingBottom) || 0);
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.05,
        measure: () => clueH + boardEl.offsetHeight + boardMarginBottom +
          (revealEl ? revealEl.offsetHeight + revealMarginTop : 0) +
          (submitBtnEl ? submitBtnEl.offsetHeight + btnMarginTop : 0) + movesH + cardPad
      });

      showScore(scoreNow());
      updateNav();
    }

    // Overlap the outgoing + incoming cards and fade the old one out while the new
    // one fades in (its CSS aw-fadein) — a seamless crossfade with no frame where
    // the background shows through bare (that bare frame was the "flicker").
    function crossfadeCards(oldCard, newCard) {
      for (const c of [oldCard, newCard]) { c.style.position = "absolute"; c.style.inset = "0"; }
      oldCard.style.zIndex = "1"; oldCard.style.pointerEvents = "none";
      newCard.style.zIndex = "2";
      const anim = oldCard.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease", fill: "forwards" });
      let done = false;
      const clean = () => {
        if (done) return; done = true;
        if (oldCard.parentNode) oldCard.remove();
        for (const p of ["position", "inset", "zIndex", "pointerEvents"]) newCard.style[p] = "";
      };
      anim.onfinish = clean;
      setTimeout(clean, 280);
    }

    // Re-draw ONLY the word tiles from the current order (avoids replaying the
    // card fade-in on every drag).
    function renderBoard() {
      const it = items[index], st = state[index];
      boardEl.innerHTML = "";
      const locked = st.graded || busy;
      // Bonus mode: only the LEADING run of correctly-placed words (from the start
      // of the sentence) is green — a word in its right spot but sitting after a
      // wrong one stays grey (teacher, Đợt 36). On a full solve prefix === n → all
      // green. Submit mode colours per-slot from the marks after Submit.
      const green = mode === "submit" ? 0 : greenPrefix(st.order);
      st.order.forEach((wordId, slot) => {
        const tile = el("span", "aw-unj-wtile");
        tile.dataset.slot = String(slot);
        tile.dataset.word = String(wordId);
        tile.textContent = it.words[wordId];
        if (mode === "submit") {
          const m = st.marks ? st.marks[slot] : null;
          if (m === "correct") tile.classList.add("is-correct");
          else if (m === "wrong") tile.classList.add("is-wrong");
        } else if (slot < green) {
          tile.classList.add("is-correct");
        }
        if (locked) tile.classList.add("is-locked");
        else attachDrag(tile);
        boardEl.append(tile);
      });
      // FIXED trailing "?"/"!" — always the last tile, pre-placed, locked, never a
      // drop target (teacher, Đợt 41). Turns green with the rest once solved.
      if (it.fixed) {
        const fx = el("span", "aw-unj-wtile is-locked is-fixed");
        fx.dataset.fixed = "1";
        fx.textContent = it.fixed;
        const solved = mode === "submit" ? (st.correct === true) : (green >= st.order.length);
        if (solved) fx.classList.add("is-correct");
        boardEl.append(fx);
      }
    }

    // ---------- drag to reorder (pointer events: mouse + touch) ----------
    // The dragged word lifts as a floating clone; a blinking text-cursor CARET
    // shows the nearest gap where it will land. The OTHER words DON'T move while
    // dragging (no reflow) — they only shuffle into the new order on DROP. The
    // source word stays in place, dimmed, until then. (Teacher's request, Đợt 35.)
    function attachDrag(tile) {
      tile.style.touchAction = "none";
      let dragging = false, clone = null, caret = null, offX = 0, offY = 0;

      tile.addEventListener("pointerdown", e => {
        const st = state[index];
        if (busy || st.graded) return;
        // TIME COST (Đợt 143): picking a word up IS this game's progress. In
        // "On submit" mode nothing is graded until Submit, so waiting for that
        // would charge a class for the whole time they spend building the
        // sentence — which is the work.
        ui.noteActivity?.();
        dragging = true;
        const r = tile.getBoundingClientRect();
        const cs = getComputedStyle(tile);
        offX = e.clientX - r.left;
        offY = e.clientY - r.top;
        clone = tile.cloneNode(true);
        clone.classList.add("aw-unj-drag");
        clone.style.position = "fixed";
        clone.style.left = r.left + "px";
        clone.style.top = r.top + "px";
        clone.style.width = r.width + "px";
        clone.style.height = r.height + "px";
        clone.style.margin = "0";
        // the clone lives on document.body, outside .aw-unj-card's CSS-var
        // scope, so copy the resolved text styling across explicitly.
        clone.style.fontFamily = cs.fontFamily;
        clone.style.fontSize = cs.fontSize;
        clone.style.fontStyle = cs.fontStyle;
        clone.style.fontWeight = cs.fontWeight;
        clone.style.color = cs.color;
        document.body.append(clone);
        activeFlyNodes.add(clone);
        // the source word stays put (no reflow) — just dimmed to show it's lifted
        tile.classList.add("is-dragsrc");
        // the caret marks where the word will drop; positioned inside the board
        caret = el("span", "aw-unj-caret");
        boardEl.append(caret);
        positionCaret(e.clientX, e.clientY, caret, tile);
        try { tile.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        unjumbleSound.pickup();
      });

      tile.addEventListener("pointermove", e => {
        if (!dragging) return;
        clone.style.left = (e.clientX - offX) + "px";
        clone.style.top = (e.clientY - offY) + "px";
        positionCaret(e.clientX, e.clientY, caret, tile);
      });

      const end = e => {
        if (!dragging) return;
        dragging = false;
        try { tile.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        const newIndex = caretDropIndex(caret);
        if (caret) { caret.remove(); caret = null; }
        tile.classList.remove("is-dragsrc");
        const wordId = Number(tile.dataset.word);
        commitReorder(wordId, newIndex);        // update data + re-render the board
        if (state[index].graded) {              // sentence solved → celebration takes over, no glide
          if (clone) { clone.remove(); activeFlyNodes.delete(clone); clone = null; }
        } else {
          flyCloneToLanded(clone, wordId);      // glide the lifted word to where it landed
          clone = null;                         // ownership handed to the flight
        }
      };
      tile.addEventListener("pointerup", end);
      tile.addEventListener("pointercancel", end);
    }

    // Place the caret at the drop gap NEAREST the pointer, and store the exact
    // insertion index for the drop. Rewritten for accuracy + stability (Đợt 36):
    //   • the dragged word is EXCLUDED, so the gaps are computed among the words
    //     that will actually stay — the caret's index is then already the spliced
    //     insertion index (no fragile "full-index minus one" conversion, which was
    //     the source of the flaky first/last behaviour).
    //   • row is chosen by nearest vertical centre with a generous tolerance
    //     (half a row), so sub-pixel wobble can't make it flip rows.
    //   • the pointer is clamped past the ends, so the very first and very last
    //     gaps are easy to hit even when the finger overshoots the text.
    // `caret.dataset.insert` = index in the array AFTER the dragged word is removed.
    function positionCaret(x, y, caret, srcTile) {
      const rest = [...boardEl.querySelectorAll(".aw-unj-wtile")]
        .filter(t => t !== srcTile && !t.dataset.fixed)   // never drop after the fixed ?/! token
        .map((t, i) => ({ idx: i, r: t.getBoundingClientRect() }));
      const brect = boardEl.getBoundingClientRect();
      if (!rest.length) {   // 1-word sentence: nothing to reorder around
        caret.dataset.insert = "0";
        caret.style.left = "0px"; caret.style.top = "0px";
        caret.style.height = (boardEl.clientHeight * 0.6) + "px";
        return;
      }
      // (1) nearest row (tolerant grouping so it never jitters between rows)
      let rowTop = rest[0].r.top, bestDy = Infinity;
      for (const { r } of rest) {
        const dy = Math.abs((r.top + r.height / 2) - y);
        if (dy < bestDy) { bestDy = dy; rowTop = r.top; }
      }
      const rowH = rest[0].r.height;
      const row = rest.filter(o => Math.abs(o.r.top - rowTop) < rowH * 0.6).sort((a, b) => a.r.left - b.r.left);
      const rowY = row[0].r.top;

      // (2) candidate gaps on that row → insertion index among the remaining words
      const gaps = [{ x: row[0].r.left, insert: row[0].idx }];
      for (let i = 1; i < row.length; i++) {
        gaps.push({ x: (row[i - 1].r.right + row[i].r.left) / 2, insert: row[i].idx });
      }
      gaps.push({ x: row[row.length - 1].r.right, insert: row[row.length - 1].idx + 1 });

      let best = gaps[0], bestDx = Infinity;
      for (const g of gaps) {
        const dx = Math.abs(g.x - x);
        if (dx < bestDx) { bestDx = dx; best = g; }
      }

      const h = rowH * 0.72;   // a touch shorter than the row, so it reads as a text cursor
      caret.style.left = (best.x - brect.left) + "px";
      caret.style.top = (rowY - brect.top + (rowH - h) / 2) + "px";
      caret.style.height = h + "px";
      caret.dataset.insert = String(best.insert);   // index in the spliced array
    }

    // The caret already stores the spliced insertion index (see positionCaret).
    function caretDropIndex(caret) {
      return caret ? Number(caret.dataset.insert || 0) : 0;
    }

    // Glide the lifted clone from where it was released to the slot the word landed
    // in, then hand off to the real tile — so a drop settles smoothly instead of
    // snapping (teacher, Đợt 36). The real tile is hidden during the short flight.
    function flyCloneToLanded(clone, wordId) {
      if (!clone) return;
      const target = boardEl.querySelector(`.aw-unj-wtile[data-word="${wordId}"]`);
      if (!target) { clone.remove(); activeFlyNodes.delete(clone); return; }
      const cr = clone.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      target.style.visibility = "hidden";
      const anim = clone.animate([
        { left: cr.left + "px", top: cr.top + "px", width: cr.width + "px", height: cr.height + "px", transform: "scale(1.14) rotate(-4deg)" },
        { left: tr.left + "px", top: tr.top + "px", width: tr.width + "px", height: tr.height + "px", transform: "scale(1) rotate(0deg)" }
      ], { duration: DROP_FLY_MS, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });
      let done = false;
      const land = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        if (target) target.style.visibility = "";
      };
      anim.onfinish = land;
      setTimeout(land, DROP_FLY_MS + 80);
    }

    function commitReorder(wordId, newIndex) {
      const st = state[index];
      const from = st.order.indexOf(wordId);
      if (from < 0) return;
      const arr = [...st.order];
      arr.splice(from, 1);
      arr.splice(Math.max(0, Math.min(newIndex, arr.length)), 0, wordId);
      const changed = arr.join(",") !== st.order.join(",");
      st.order = arr;
      unjumbleSound.drop();
      renderBoard();
      if (changed) { st.moveCount++; afterDrop(wordId); }
      updateBonusMoves();
      updateSubmitState();
    }

    // ---------- marking (bonus mode) ----------
    // Words turn green live as they land home (renderBoard handles the colour),
    // but points are only awarded once the WHOLE sentence is solved — 2 for a
    // perfect (minimum-move) solve, 1 otherwise.
    function afterDrop() {
      if (mode === "submit") return;
      const st = state[index], it = items[index];
      const n = it.words.length;
      const green = greenPrefix(st.order);
      if (green > (st._green || 0)) unjumbleSound.correct();   // the leading correct run just grew
      st._green = green;
      if (green === n) finalizeLiveWord();                     // whole sentence solved
    }

    function finalizeLiveWord() {
      const st = state[index];
      // PERFECT = solved using no more than the fewest possible drags.
      const perfect = st.moveCount <= st.minMoves;
      // capture the "moves for bonus" spot BEFORE updateBonusMoves clears it, so the
      // BONUS chip can fly from exactly where that line was (teacher, Đợt 41).
      const movesRect = (movesEl && movesEl.textContent) ? movesEl.getBoundingClientRect() : null;
      st.correct = true;
      st.graded = true;
      st.points = 0;       // banked by the flights below (1 for the sentence, +1 for a bonus)
      renderBoard();       // lock the board — the whole sentence is now green (prefix === n)
      updateBonusMoves();  // hide the "moves for bonus" line
      updateNav();
      celebrateBounce();   // all words do a little wave-bounce (teacher, Đợt 36)
      // The ✓ for a correct sentence flies into the score (+1) (teacher, Đợt 39).
      flyToScore(boardEl, icons.markCheck, 1, () => { st.points = 1; return scoreNow(); });
      if (perfect) {
        unjumbleSound.perfect();
        // the "moves for bonus" spot launches a "BONUS" chip into the score (+1 more).
        setTimeout(() => flyToScore(movesRect || boardEl, "BONUS", 1,
          () => { st.points = 2; return scoreNow(); }), 420);
      }
      const doneDelay = perfect ? FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 700 : FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 300;
      if (state.every(doneCheck)) autoTimer = setTimeout(finish, doneDelay);
      else maybeAutoNext(doneDelay);   // Đợt 143 — "Auto next question"
    }

    // ---------- submit mode ----------
    function doSubmit() {
      const st = state[index], it = items[index];
      if (st.graded || busy) return;
      busy = true;
      st.graded = true;
      const n = it.words.length;
      st.marks = new Array(n).fill(null);
      updateSubmitState();
      updateNav();
      const tiles = [...boardEl.querySelectorAll(".aw-unj-wtile")];
      let allCorrect = true, cc = 0;
      for (let slot = 0; slot < n; slot++) {
        const isRight = st.order[slot] === slot;
        if (isRight) cc++; else allCorrect = false;
        st.marks[slot] = isRight ? "correct" : "wrong";
        setTimeout(() => {
          const t = tiles[slot];
          if (!t) return;
          t.classList.add(isRight ? "is-correct" : "is-wrong");
          (isRight ? unjumbleSound.fastCorrect : unjumbleSound.fastWrong)();
        }, slot * STAGGER_MS);
      }
      setTimeout(() => {
        // Đợt 114 — up to ~2.2s out and untracked, and it ARMS `autoTimer` below.
        // cleanup() clearing autoTimer could never help: this timer simply made a
        // new one on the dead play, which then finished it (fanfare over the next
        // game + a phantom leaderboard row).
        if (dead) return;
        st.correct = allCorrect;
        st.points = 0;   // banked by the effect below
        busy = false;
        updateSubmitState();
        updateNav();
        if (revealEl) revealEl.textContent = (!allCorrect && showAnswerWhenWrong) ? sentenceText(it) : "";
        // Score by SENTENCE (correct = 1; wrong costs pointsOff, 0–5). Both correct AND
        // wrong now shower stars that stream to the score — GOLD +1 on correct, RED
        // −pointsOff on wrong (no big ✗, teacher Đợt 42). A wrong sentence also costs a
        // life; running out ends the game.
        let outOfLives = false;
        if (allCorrect) {
          celebrateBounce();
          flyStarsToScore(boardEl, () => { st.points = 1; return scoreNow(); });
        } else {
          outOfLives = loseLife();
          // ⭐⭐⭐ Đợt 256 (thầy, 24/8/2026) — CON SỐ, KHÔNG CHỈ NGÔI SAO.
          // Unjumble vốn đã làm đúng nửa quan trọng nhất từ Đợt 41/42: chùm sao ĐỎ bay
          // từ cả câu vào ô điểm và phép trừ chỉ áp KHI SAO TỚI NƠI. Thiếu đúng một
          // thứ — nó không nói TRỪ BAO NHIÊU, mà đó chính là điều thầy hỏi.
          // ⚠️⚠️ CHỈ MỘT NGƯỜI ĐƯỢC TRỪ. Quyền trừ chuyển sang CON SỐ (`st.points`
          // nay đặt trong callback của ui.flyPenalty), còn callback của chùm sao hạ
          // xuống thành "vẽ lại điểm hiện hành". Để cả hai cùng đặt `st.points` thì vô
          // hại (gán chứ không cộng dồn) — nhưng để cả hai cùng TRỪ ở một template
          // khác thì là trừ hai lần, nên luật viết ra ở đây là: một cú bay, một chủ nợ.
          // ⭐ Con số bay 920ms, chùm sao 1100ms ⇒ số tới TRƯỚC, điểm tụt lúc nó cắm
          // vào, rồi sao mới tới và chỉ vẽ lại đúng con số ấy. Không có nhịp nảy ngược.
          ui.flyPenalty?.(boardEl, pointsOff, () => { st.points = -pointsOff; return scoreNow(); });
          flyStarsToScore(boardEl, () => scoreNow(), true);
        }
        if (outOfLives) autoTimer = setTimeout(() => finish("gameover"), FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 400);
        else if (state.every(doneCheck)) autoTimer = setTimeout(finish, FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 400);
        else maybeAutoNext(FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 400);   // Đợt 143 — "Auto next question"
      }, n * STAGGER_MS + 300);
    }

    function updateSubmitState() {
      if (!submitBtnEl) return;
      const st = state[index];
      submitBtnEl.disabled = st.graded || busy;
    }

    // A shower of little stars pops up around the whole sentence and streams into
    // the score, then the point lands — GOLD on a correct submit, RED on a wrong
    // one (teacher, Đợt 41/42).
    function flyStarsToScore(sourceEl, applyAndGetNewTotal, red) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (!sourceEl || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const gr = sourceEl.getBoundingClientRect();
      const er = scoreEl.getBoundingClientRect();
      const ex = er.left + er.width / 2, ey = er.top + er.height / 2;
      const size = Math.max(14, gr.height * 0.16);
      const N = 12;
      for (let i = 0; i < N; i++) {
        const s = el("span", "aw-unj-flystar");
        s.innerHTML = red ? STAR_RED_SVG : STAR_SVG;
        s.style.width = s.style.height = size + "px";
        const sx = gr.left + gr.width * (0.08 + 0.84 * ((i * 0.3819) % 1));
        const sy = gr.top + gr.height * (0.15 + 0.7 * ((i * 0.6180) % 1));
        s.style.left = sx + "px"; s.style.top = sy + "px";
        document.body.append(s);
        activeFlyNodes.add(s);
        s.animate([
          { transform: "translate(-50%,-50%) scale(.3) rotate(0deg)", opacity: 0, offset: 0 },
          { transform: "translate(-50%,-50%) scale(1) rotate(40deg)", opacity: 1, offset: .25 },
          { transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) scale(.35) rotate(160deg)`, opacity: 0, offset: 1 }
        ], { duration: 750 + i * 25, delay: i * 20, easing: "cubic-bezier(.4,.2,.25,1)", fill: "forwards" });
        setTimeout(() => { s.remove(); activeFlyNodes.delete(s); }, 820 + i * 45);
      }
      setTimeout(() => pulseScoreTo(applyAndGetNewTotal()), 760);
    }

    // A left-to-right wave of little hops across the solved sentence's words.
    function celebrateBounce() {
      if (!boardEl) return;
      const tiles = [...boardEl.querySelectorAll(".aw-unj-wtile")];
      tiles.forEach((t, i) => {
        t.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(-16%)" }, { transform: "translateY(0)" }],
          { duration: 460, delay: i * 55, easing: "cubic-bezier(.34,1.56,.64,1)" }
        );
      });
    }

    // Fly an icon/label out of `startEl`, hold, then sail into the score while
    // morphing to "+points" and pulse-counting the new total in. Used for the ✓
    // that a solved sentence earns, and (on a bonus) a second "BONUS" flight.
    // `start` may be an element OR a plain rect {left,top,width,height} (e.g. the
    // captured "moves for bonus" spot, since that element is cleared before we fly).
    function flyToScore(start, iconHtml, points, applyAndGetNewTotal) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (!start || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const startRect = start.getBoundingClientRect ? start.getBoundingClientRect() : start;
      const endRect = scoreEl.getBoundingClientRect();
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;

      const wrap = el("div", "aw-unj-flygain");
      wrap.style.left = cx + "px";
      wrap.style.top = cy + "px";
      wrap.style.fontSize = Math.max(24, startRect.width * 0.06) + "px";

      const iconSpan = el("span", "afg-icon", iconHtml);
      const numSpan = el("span", "afg-num" + (points < 0 ? " is-neg" : ""), (points >= 0 ? "+" : "") + points);
      wrap.append(iconSpan, numSpan);
      document.body.append(wrap);
      activeFlyNodes.add(wrap);

      const total = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;
      const holdFrac = FLYGAIN_HOLD_MS / total;
      const fadeEndFrac = Math.min(1, (FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS * 0.6) / total);

      const wrapAnim = wrap.animate([
        { transform: "translate(-50%,-50%) scale(1)", offset: 0 },
        { transform: "translate(-50%,-50%) scale(1.1)", offset: holdFrac },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, offset: 1 }
      ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

      iconSpan.animate([
        { opacity: 1, offset: 0 }, { opacity: 1, offset: holdFrac },
        { opacity: 0, offset: fadeEndFrac }, { opacity: 0, offset: 1 }
      ], { duration: total, easing: "linear", fill: "forwards" });
      numSpan.animate([
        { opacity: 0, offset: 0 }, { opacity: 0, offset: holdFrac },
        { opacity: 1, offset: fadeEndFrac }, { opacity: 1, offset: 1 }
      ], { duration: total, easing: "linear", fill: "forwards" });

      let done = false;
      const complete = () => {
        if (done) return; done = true;
        wrap.remove(); activeFlyNodes.delete(wrap);
        pulseScoreTo(applyAndGetNewTotal());
      };
      wrapAnim.onfinish = complete;
      setTimeout(complete, total + 150);
    }

    function pulseScoreTo(newValue) {
      // Đợt 114 — same live-lookup trap as showScore, reached from the 0.76-1.25s
      // star/tick fly timers: the dead play's total used to count up on the NEW
      // game's badge, complete with Unjumble's "/ max" markup even after a
      // Change Template to Quiz.
      if (dead) return;
      const scoreEl = document.querySelector(".aw-top-score");
      if (!scoreEl) return;
      const match = /(-?\d+)/.exec(scoreEl.textContent || "");
      const oldValue = match ? parseInt(match[1], 10) : 0;
      if (oldValue === newValue) { showScore(newValue); return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth;
      scoreEl.classList.add("aw-score-pulse");
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / FLYGAIN_PULSE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(oldValue + (newValue - oldValue) * eased);
        showScore(val);
        if (t < 1) requestAnimationFrame(step);
        else {
          showScore(newValue);
          setTimeout(() => scoreEl.classList.remove("aw-score-pulse"), 200);
        }
      };
      requestAnimationFrame(step);
    }

    // ---------- navigation ----------
    function updateNav() {
      const isLast = index === total - 1;
      const st = state[index];
      const canAdvance = allowSkip || doneCheck(st);
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        // Last question: keep the Next button but DISABLE it (no ✓ icon either) —
        // the game hands in via "Submit answers" / auto-finish (teacher, Đợt 38).
        onNext: (!isLast && canAdvance) ? goNext : null,
        nextLabel: null
      });
    }
    // Next/back crossfade to the new card (render handles the overlap) so the
    // background never flashes bare between questions (teacher, Đợt 36).
    function goPrev() { if (busy) return; if (index > 0) { index--; render("cross"); } }
    function goNext() { if (busy) return; if (index < total - 1) { index++; render("cross"); } }

    // AUTO NEXT QUESTION (Đợt 143) — options.autoSwitch. Called from both places
    // a sentence can finish (the drag-to-solve path and doSubmit's grading), with
    // whatever wait that caller already computed for its own celebration, so the
    // flying ✓ / BONUS chip still lands before the board moves.
    // `index === from` is the guard that lets a teacher pressing ▷ during the
    // wait win: this template's goPrev/goNext don't clear autoTimer, so without
    // it the pending timer would advance a SECOND time on top of the manual move.
    function maybeAutoNext(delay) {
      if (opt.autoSwitch !== true || index >= total - 1) return;
      const from = index;
      autoTimer = setTimeout(() => {
        autoTimer = null;
        if (index === from) goNext();
      }, delay);
    }

    function finish(reason) {
      // ⚠️⚠️ Đợt 256 — CHỐT SỔ TRƯỚC KHI ĐỌC ĐIỂM: một con số "−N" còn đang bay là một
      // `st.points` CHƯA được đặt, và `scoreNow()` cộng từ chính mảng đó.
      ui.flushPenalties?.();
      if (finished) return;
      finished = true;
      const totalPoints = state.reduce((s, st) => s + (st.points || 0), 0);
      const perQuestion = state.map((st, i) => ({ q: i, correct: st.correct === true }));
      const review = items.map((it, i) => {
        const st = state[i];
        const started = st.order.some((id, slot) => id !== slot);
        const yourWords = st.order.map(id => it.words[id]).join(" ") + (it.fixed || "");
        return {
          question: it.clue || "Put the words in the right order",
          answered: doneCheck(st),
          yourText: (doneCheck(st) || started) ? yourWords : null,
          yourCorrect: st.correct === true,
          correctText: sentenceText(it),
          src: it.src
        };
      });
      const answered = state.filter(st => doneCheck(st)).length;
      // maxScore (mount-scope) counts by SENTENCE: bonus = 2/sentence, submit = 1.
      ui.finish({
        correct: totalPoints, incorrect: maxScore - totalPoints, total: maxScore,
        score: totalPoints, perQuestion, review, answered,
        title: reason === "gameover" ? "Game over" : undefined   // ran out of lives
      });
    }

    // Decorative marker doodles in the whiteboard corners (Classic look only —
    // hidden by CSS on other themes). Deliberately generic (no branding).
    function doodleLayer() {
      const layer = el("div", "aw-unj-doodles");
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = `
        <svg class="aw-unj-doodle aw-unj-doodle-a" viewBox="0 0 60 60" fill="none" stroke="#2b2f33" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M34 4 16 32h12l-6 24 24-34H32z"/></svg>
        <svg class="aw-unj-doodle aw-unj-doodle-b" viewBox="0 0 60 60" fill="none" stroke="#e05663" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M30 6l6.6 13.4L51 21l-10.7 10 2.6 14.8L30 39.4 17.1 45.8 19.7 31 9 21l14.4-1.6z"/></svg>
        <svg class="aw-unj-doodle aw-unj-doodle-c" viewBox="0 0 80 70" fill="none" stroke="#3aae6a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><circle cx="40" cy="16" r="10"/><path d="M40 26v22M40 34l-14 8M40 34l14 8M40 48l-10 16M40 48l10 16"/></svg>
        <svg class="aw-unj-doodle aw-unj-doodle-d" viewBox="0 0 90 60" fill="none" stroke="#3d63c9" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 50V24l10-8 8 8h20l10 10v16z"/><path d="M24 24V12l8 4M62 34l14-6-4 12"/><circle cx="30" cy="40" r="2.4" fill="#3d63c9"/></svg>`;
      return layer;
    }

    // Intro (Classic): a title cluster (UNJUMBLE / in ANDREW CLASSES) zooms in from
    // far, HOLDS big for most of intro.mp3, then FAST each word shrinks + flies onto
    // its match in the top-bar slogan (UNJUMBLE→UNJUMBLE, in→IN, ANDREW→ANDREW,
    // CLASSES→CLASSES) as the slogan fades in (teacher, Đợt 41). No background/border,
    // words hidden meanwhile. Tap to skip. Classic only.
    function runIntro(done) {
      const ZOOM_MS = 460;                      // grow in (tilted)
      const STRAIGHTEN_MS = 160;                // un-tilt just before flying (so words land straight)
      const FLY_MS = 460;                       // fast shrink + fly
      const TILT = -4;                          // slight artistic tilt during zoom + hold
      const FLY_AT = Math.max(ZOOM_MS + 200, INTRO_MS - STRAIGHTEN_MS - FLY_MS);   // long hold in between
      introEl = el("div", "aw-unj-intro");
      introEl.setAttribute("aria-hidden", "true");
      const introText = el("div", "aw-unj-intro-text");
      const wUNJ = el("span", "aw-unj-introw aw-unj-intro-title", "UNJUMBLE");
      const line1 = el("div", "aw-unj-intro-l1"); line1.append(wUNJ);
      const line2 = el("div", "aw-unj-intro-l2");
      const wIN = el("span", "aw-unj-introw aw-unj-intro-sub", "in");
      const wAND = el("span", "aw-unj-introw aw-unj-intro-sub", "ANDREW");
      const wCL = el("span", "aw-unj-introw aw-unj-intro-sub", "CLASSES");
      line2.append(wIN, document.createTextNode(" "), wAND, document.createTextNode(" "), wCL);
      introText.append(line1, line2);
      introEl.append(introText);
      stageEl.append(introEl);
      activeFlyNodes.add(introEl);
      const card = root.querySelector(".aw-unj-card");
      if (card) card.style.visibility = "hidden";

      let finishedIntro = false, flewWords = false;
      const finishIntro = () => {
        // ⚠️ Đợt 114 — MEASURED bug, not a theoretical one. This runs 3.3s after
        // PLAY off an untracked timer and ends by calling ui.startTimer(). Press
        // PLAY, press Home a second later, and the discarded play still started
        // the shared clock: the "time's up" cue then fired 12 seconds later with
        // the library on screen and no game running at all. (core/engine.js now
        // refuses this too — belt and braces, same as Đợt 112.)
        if (dead) return;
        if (finishedIntro) return;
        finishedIntro = true;
        introEl.removeEventListener("pointerdown", finishIntro);
        introEl.remove();
        activeFlyNodes.delete(introEl);
        introEl = null;
        if (card) card.style.visibility = "";
        introActive = false;
        if (sloganEl) sloganEl.style.opacity = "1";   // slogan takes over up top
        updateBonusMoves();
        done();
      };
      introEl.addEventListener("pointerdown", finishIntro);

      // phase 1 — the tilted cluster grows from far (zoom) and holds big
      introText.animate([
        { transform: `scale(0.42) rotate(${TILT}deg)`, opacity: 0, offset: 0 },
        { transform: `scale(1) rotate(${TILT}deg)`, opacity: 1, offset: ZOOM_MS / FLY_AT },
        { transform: `scale(1) rotate(${TILT}deg)`, opacity: 1, offset: 1 }
      ], { duration: FLY_AT, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });

      // phase 1b — straighten (un-tilt) so the per-word flight lands precisely
      const straighten = () => {
        introText.animate([
          { transform: `scale(1) rotate(${TILT}deg)` },
          { transform: "scale(1) rotate(0deg)" }
        ], { duration: STRAIGHTEN_MS, easing: "ease-out", fill: "forwards" });
      };

      // phase 2 — each word shrinks + flies onto its slogan word; slogan fades in
      const flyWords = () => {
        if (flewWords) return; flewWords = true;
        const slogw = sloganEl ? [...sloganEl.querySelectorAll(".aw-unj-slogw")] : [];
        [[wUNJ, slogw[0]], [wIN, slogw[1]], [wAND, slogw[2]], [wCL, slogw[3]]].forEach(([w, target]) => {
          if (!w) return;
          const wr = w.getBoundingClientRect();
          let dx = 0, dy = -stageEl.getBoundingClientRect().height * 0.42, sc = 0.14;
          if (target) {
            const tr = target.getBoundingClientRect();
            dx = (tr.left + tr.width / 2) - (wr.left + wr.width / 2);
            dy = (tr.top + tr.height / 2) - (wr.top + wr.height / 2);
            sc = tr.height / wr.height;
          }
          w.animate([
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(${sc})`, opacity: 0.15 }
          ], { duration: FLY_MS, easing: "cubic-bezier(.5,0,.15,1)", fill: "forwards" });
        });
        if (sloganEl) sloganEl.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: FLY_MS, delay: FLY_MS * 0.35, easing: "ease-out", fill: "forwards" });
      };
      setTimeout(straighten, FLY_AT);
      setTimeout(flyWords, FLY_AT + STRAIGHTEN_MS);
      setTimeout(finishIntro, FLY_AT + STRAIGHTEN_MS + FLY_MS + 80);
    }

    return function cleanup() {
      dead = true;   // Đợt 114 — MUST be first; see finishIntro / doSubmit / pulseScoreTo
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      if (stageEl) stageEl.classList.remove("aw-unj-active");
      if (sloganEl) sloganEl.remove();
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Length of the leading run of already-correctly-placed words (order[i] === i for
// i = 0,1,…). Everything up to the first out-of-place word is "green"; the rest
// stays grey even if a later word happens to sit in its own slot (teacher, Đợt 36).
function greenPrefix(order) {
  let p = 0;
  while (p < order.length && order[p] === p) p++;
  return p;
}

// Length of the longest strictly-increasing subsequence (patience sorting, O(n log n)).
// Used to derive the minimum number of drag-moves to sort a scramble: n − LIS.
function lisLength(arr) {
  const tails = [];
  for (const x of arr) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
    tails[lo] = x;
  }
  return tails.length;
}

registerTemplate(unjumbleTemplate);
export default unjumbleTemplate;
