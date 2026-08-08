// =============================================================
// TEMPLATE: ANAGRAM — Wordwall style, English UI.
//  • Clue near the top (or a generic "Unscramble the word" label without one).
//  • Two rows sit close together, raised a bit off the very bottom:
//      "dãy kết quả" (result row)  — the target word shape, dashed empty
//      boxes that fill in as letters land, ABOVE —
//      "dãy chữ gốc" (origin row)  — the scrambled letter tiles (grey box,
//      white letter), just BELOW.
//  • Two modes, chosen in Options ("Anagram mode") — switching mode always
//    restarts the game (the 2 scoring models are incompatible mid-play,
//    see optionsNeedRestart()):
//      "bonus"  = Letters with bonus — tap the correct NEXT letter (in
//                 order); a wrong tap flashes a small cross right on that
//                 tile (no move) + buzz; a right tap flies smoothly into
//                 the result row, turning blue immediately. Finishing with
//                 zero mistakes pops "PERFECT" which (after a short hold)
//                 flies into the score, morphing into the point value and
//                 pulse-counting it in — DOUBLE points; any mistake along
//                 the way -> a small check instead of "PERFECT", normal
//                 points (1 per letter), same fly+pulse treatment.
//      "submit" = On submit — tap any tile (any order), it flies to the
//                 next empty result slot KEEPING the origin's grey color
//                 (no color change yet); tap a filled slot to send it back,
//                 or DRAG a filled slot onto another one to swap them —
//                 all before Submit. A SUBMIT button (raised above a
//                 reserved answer-reveal line) reveals each position's
//                 small green check / red cross in turn (recoloring that
//                 tile blue or a muted grey), then a big check/cross for
//                 the whole word; a correct word flies+pulses into the
//                 score exactly like bonus mode (1 point); a wrong word
//                 reveals the correct spelling (green, caps per option, no
//                 "Correct:" prefix) in the reserved line, no fly.
//  • Multi-word phrases keep their spaces as fixed gaps (no slot to fill).
//  • Options: timer, shuffleQuestions, allCaps (force uppercase tiles),
//    allowSkip (Next may skip an unfinished word).
//  • Mouse/touch ONLY, by design — no keyboard shortcuts (not even ←/→ for
//    prev/next). Use the Previous/Next buttons in the bottom bar instead.
//  • Mid-word interactions (a single letter landing, a drag-swap) patch the
//    DOM directly instead of calling the full render() — render() replaces
//    the WHOLE card and re-triggers its fade-in animation, so calling it on
//    every tap made the whole screen visibly flash. Full render() is still
//    used at real boundaries: word start/change, and once per word when it
//    finishes (locks tiles, shows the reveal line, updates nav).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { anagramSound } from "./anagram-sound.js";
import { openAnagramEditor } from "./anagram-editor.js";

// Tile clone colors for the flying-letter animation — MUST stay in sync
// with the --aw-ana-origin-bg / --aw-ana-result-bg / --aw-ana-wrong-bg
// fallbacks in anagram.css (the JS clone is a plain fixed-position element,
// not themed via CSS var).
const ORIGIN_BG = "#6b7785";
const RESULT_BG = "#2f6fed";

// Big white/dark-outline check or cross INSIDE a result tile — used both for
// bonus mode's wrong-pick mark (in the pending slot) and submit mode's
// per-position reveal (teacher, 8/8/2026: "tích to ngay trong ô chữ" instead
// of a small corner badge). core/icons.js's markCheck/markCross already are
// exactly this look (used elsewhere in this file for the whole-word marks).

const STAGGER_MS = 260;     // ms — gap between each position's reveal in "submit" mode

// Shared "settle" easing for every tile flight (letter placement, swap,
// return-to-origin) — a mild spring overshoot instead of flat ease-in-out,
// so a tile looks like it has real weight when it arrives somewhere
// (teacher-reported "trông cực kỳ giả", 8/8/2026). Kept subtle (~12%
// overshoot) since bonus-mode taps can queue several flights back to back.
const FLY_EASING = "cubic-bezier(.22,1.12,.36,1)";

// Flight duration now scales with DISTANCE instead of one flat number for
// every trip — a fixed 340ms made a short adjacent-tile swap look like it
// was gliding in slow motion compared to how far it actually travelled
// (teacher-reported "rất delay, không tự nhiên", 8/8/2026). Modelled as a
// roughly constant "toss speed" instead, clamped so neither a 1-tile hop nor
// a whole-word-wide flight feels wrong.
const FLY_SPEED_PX_MS = 1.4;   // px per ms
const FLY_MIN_MS = 130;
const FLY_MAX_MS = 380;
function flyDurationFor(dx, dy) {
  return Math.max(FLY_MIN_MS, Math.min(FLY_MAX_MS, Math.hypot(dx, dy) / FLY_SPEED_PX_MS));
}

// The shared "hold, then fly to the score, morph into +points, pulse-count
// it in" sequence — submit mode's all-correct outcome only now (bonus mode's
// own perfect/non-perfect feedback is showPerfectBurst()/flyPointsOnly()
// below, teacher 8/8/2026).
const FLYGAIN_HOLD_MS = 550;
const FLYGAIN_FLIGHT_MS = 550;
const FLYGAIN_PULSE_MS = 420;
const FLYGAIN_TOTAL_MS = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;

// Bonus-mode word-complete feedback (teacher, 8/8/2026): "PERFECT" pops in
// place (no longer flies anywhere); the "+N" points fly to the score
// separately, starting a beat after PERFECT for a perfect word, or right
// away when the word had a mistake (no icon shown at all in that case).
const PERFECT_BURST_MS = 950;
const PERFECT_TO_POINTS_DELAY_MS = 420;
const PICKFLY_HOLD_MS = 320;
const PICKFLY_FLIGHT_MS = 600;
const PICKFLY_TOTAL_MS = PICKFLY_HOLD_MS + PICKFLY_FLIGHT_MS;

// Lives (v0.9.29, teacher 3/8/2026) — a slider 0..10 in Options, same convention
// as true-false.js/find-the-match.js: 0 (or missing) = unlimited, 1..10 = that
// many hearts. UNLIKE true-false (whose "undefined" defaults to 5 lives),
// Anagram's "undefined" means UNLIMITED — this is a brand-new option on a
// template that never had a lives concept before, so an activity saved before
// this feature existed must keep playing exactly as before (zero-diff).
const MAX_LIVES = 10;
function normLives(v) {
  if (v == null || v === 0) return null;                    // unlimited (incl. "never set")
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}

function displayChar(ch, allCaps) { return allCaps ? ch.toUpperCase() : ch; }

// Tile size (in cqw) so the WHOLE origin row occupies ~90% of the stage
// width regardless of word length — short words get bigger tiles, long
// words get smaller ones, clamped so neither extreme breaks the layout.
function computeTileSize(nLetters) {
  const gap = 1.1, target = 90;
  const raw = (target - (Math.max(nLetters, 1) - 1) * gap) / Math.max(nLetters, 1);
  return Math.max(3.4, Math.min(9.5, raw));
}

// Build { letters, cells, tileOrder } once per item:
//  letters   = target chars, letter positions only, in the CORRECT order
//  cells     = full word split into { isSpace, letterIdx } (letterIdx into `letters`)
//  tileOrder = a shuffled permutation of letters' indices (origin row display order)
function prepareItem(word) {
  const chars = String(word ?? "").split("");
  const letters = [];
  const cells = chars.map(ch => {
    if (ch === " ") return { isSpace: true, letterIdx: -1 };
    const letterIdx = letters.length;
    letters.push(ch);
    return { isSpace: false, letterIdx };
  });
  let tileOrder = letters.map((_, i) => i);
  const original = tileOrder.join(",");
  for (let tries = 0; tries < 8; tries++) {
    tileOrder = shuffle(tileOrder);
    if (tileOrder.join(",") !== original || letters.length <= 1) break;
  }
  return { letters, cells, tileOrder };
}

const anagramTemplate = {
  type: "anagram",
  scorable: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  name: "Anagram",
  hasLivesSlot: true,   // hearts render in the top bar, left of the score (v0.9.29)

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.word)
      .map(it => ({ clue: it.clue || "", answer: it.word }));
  },

  // Content editor for this game (opened by the home page and the in-game
  // Edit button). Each template supplies its own editor the same way.
  edit: openAnagramEditor,

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  buildExtraOptions({ panel, draft, mkCheck, mkRadioChoice }) {
    const gMode = el("div", "aw-opt-group");
    gMode.append(el("div", "aw-opt-label", "Anagram mode"));
    const rowMode = el("div", "aw-opt-row");
    const isSubmit = draft.anagramMode === "submit";
    rowMode.append(
      mkRadioChoice("aw-anagram-mode", "bonus", "Letters with bonus", !isSubmit, v => draft.anagramMode = v),
      mkRadioChoice("aw-anagram-mode", "submit", "On submit", isSubmit, v => draft.anagramMode = v)
    );
    gMode.append(rowMode);
    panel.append(gMode);

    // LIVES — a slider 0..10 (0 = Unlimited), same shape/convention as
    // true-false.js's Lives control (teacher, 3/8/2026).
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-anagram-livesrow");
    const curLives = (draft.lives === 0 || draft.lives == null) ? 0
      : Math.min(MAX_LIVES, Math.max(1, Math.round(draft.lives)));
    const livesVal = el("span", "aw-anagram-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-anagram-livesslider");
    livesInput.type = "range"; livesInput.min = "0"; livesInput.max = String(MAX_LIVES); livesInput.step = "1";
    livesInput.value = String(curLives);
    livesInput.oninput = () => {
      const v = parseInt(livesInput.value, 10);
      draft.lives = v;   // 0 stored = unlimited
      livesVal.textContent = v === 0 ? "Unlimited" : String(v);
    };
    rowLives.append(livesInput, livesVal);
    gLives.append(rowLives);
    panel.append(gLives);

    const gMore = el("div", "aw-opt-group");
    gMore.append(el("div", "aw-opt-label", "Anagram options"));
    const rowMore = el("div", "aw-opt-row");
    rowMore.append(
      mkCheck(draft.allCaps === true, "All caps", v => draft.allCaps = v),
      mkCheck(draft.allowSkip !== false, "Allow skip (Next can move on early)", v => draft.allowSkip = v)
    );
    gMore.append(rowMore);
    panel.append(gMore);
  },

  // Engine calls this right after Apply mutates activity.options. Per the
  // teacher's request, ANY Options change restarts the act immediately
  // (not just an anagramMode switch) — Anagram's timer/shuffle/allCaps/
  // letters etc. all read fresh at mount(), so leaving the old play running
  // under options it wasn't built for looked stale/inconsistent.
  optionsNeedRestart() {
    return true;
  },

  // Engine-level lifecycle sounds (Play pressed / Start again / 5s-left /
  // Game complete) — OPTIONAL per-template override, see core/engine.js.
  // Undefined for any other template = its default synthesized tone plays
  // unchanged, so this touches Anagram only.
  sounds: {
    play: anagramSound.play,
    restart: anagramSound.restart,
    timeWarning: anagramSound.timeWarning,
    complete: anagramSound.complete
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.anagramMode === "submit" ? "submit" : "bonus";
    const allCaps = opt.allCaps != null ? !!opt.allCaps : opt.changeCase === "upper";
    const allowSkip = opt.allowSkip !== false;
    const pointsOff = Math.max(0, Math.min(5, Number(opt.pointsOff) || 0));  // deduct once per WORD with a mistake (0 = off)
    const startLives = normLives(opt.lives);   // null = unlimited

    let items = [...(activity.content?.items || [])].filter(it => it && String(it.word || "").trim());
    if (opt.shuffleQuestions) items = shuffle(items);
    // `src` = the ORIGINAL content object, carried through so "Start with
    // mistakes" can filter activity.content.items by identity (core/mistakes.js).
    items = items.map(it => ({ clue: it.clue || "", word: it.word, ...prepareItem(it.word), src: it }));

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-anagram-empty", "This anagram has no words yet."));
      return () => {};
    }

    // Per-item state.
    //  bonus mode uses: nextPos / hadMistake / correct(true once solved) / points
    //  submit mode uses: graded / correct(true|false once submitted) / points
    const state = items.map(it => ({
      placed: it.letters.map(() => null),
      used: it.letters.map(() => false),
      nextPos: 0,
      hadMistake: false,
      graded: false,      // submit mode: locked, Submit pressed — reveal may still be mid-stagger
      revealed: false,    // submit mode: the staggered per-position reveal has FINISHED
      correct: null,
      points: 0
    }));
    let index = 0;
    let finished = false;
    let penalty = 0;           // total points-off across words answered wrong (stays 0 when the option is off)
    let livesLeft = startLives;   // null = unlimited (can't lose)
    let busy = false;          // true while a fly/reveal animation must not be interrupted
    let fitter = null;
    let autoTimer = null;
    let submitBtnEl = null;    // current word's Submit button (submit mode) — kept for incremental updates
    let revealSlotEl = null;   // current word's answer-reveal line (submit mode) — ditto
    const activeFlyNodes = new Set();   // stray document.body clones — swept on cleanup

    // Slogan on the SAME row as the clock + score (centred, small, grey,
    // spaced uppercase) — same look/technique as crossword.js/speaking-cards.js
    // (teacher, 8/8/2026). Absolutely centred over the top bar so it never
    // depends on the clock/score widths; set up ONCE here (not in render(),
    // which reruns per word) since the top bar itself persists across words.
    const topbar = root.parentElement && root.parentElement.querySelector(".aw-topbar");
    let sloganEl = null;
    if (topbar) {
      topbar.style.position = "relative";
      sloganEl = el("div", "aw-anagram-slogan", "ANAGRAM IN ANDREW CLASSES");
      topbar.append(sloganEl);
    }

    ui.onSubmit(finish, () => state.filter(s => doneCheck(s)).length);   // block "Submit answers" at 0 answered
    renderLives();
    render();

    function doneCheck(s) { return mode === "bonus" ? s.correct === true : s.graded === true; }

    function scoreNow() {
      const base = mode === "bonus"
        ? state.reduce((sum, s) => sum + (s.points || 0), 0)
        : state.filter(s => s.correct === true).length;
      return base - penalty;   // points-off (may drive the total negative -> shown red)
    }

    // Hearts live in the top bar (ui.livesSlot), just left of the score — same
    // look/behaviour as true-false.js's Lives. 1..5 lives show that many
    // separate hearts; 6..10 show a compact "N♥"; unlimited shows nothing.
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                 // unlimited
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }

    // Costs one life; pops the LEFTMOST heart out (when hearts are shown
    // individually) then re-renders. Returns true if that was the last life —
    // called at the SAME granularity as the pointsOff penalty (once per WORD
    // that had a mistake / was submitted wrong), not per keypress.
    function loseLife() {
      if (livesLeft == null) return false;           // unlimited -> can't lose
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;   // leftmost heart
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate(
            [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        setTimeout(finishPop, 360);
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      submitBtnEl = null;
      revealSlotEl = null;
      const it = items[index];
      const st = state[index];
      const tileSize = computeTileSize(it.letters.length);

      const card = el("div", "aw-anagram-card");
      if (it.clue) card.append(el("div", "aw-anagram-clue", escapeHtml(it.clue)));
      else card.append(el("div", "aw-anagram-clue aw-anagram-clue-generic", "Unscramble the word"));

      // Flexible slack, split 1:2 — see anagram.css's comment on these two
      // classes for why (teacher, 8/8/2026: tile rows should lean higher
      // when the clue leaves a lot of empty room, not sit glued to the
      // bottom of the stage).
      card.append(el("div", "aw-anagram-topspace"));

      const group = el("div", "aw-anagram-group");
      group.style.setProperty("--aw-ana-tile", tileSize + "cqw");

      const resultRow = el("div", "aw-anagram-result" + (mode === "submit" ? " is-interactive" : ""));
      it.cells.forEach(c => {
        if (c.isSpace) { resultRow.append(el("span", "aw-anagram-rspace")); return; }
        const pos = c.letterIdx;
        const tileId = st.placed[pos];
        const cls = ["aw-anagram-rtile"];
        let isRight = null;
        if (tileId != null) {
          cls.push("is-filled");
          if (mode === "bonus") {
            cls.push("is-blue");
          } else if (st.revealed) {
            isRight = it.letters[tileId].toLowerCase() === it.letters[pos].toLowerCase();
            cls.push(isRight ? "is-blue" : "is-wrongbg");
          }
        }
        const box = el("div", cls.join(" "));
        box.dataset.pos = String(pos);
        if (tileId != null) box.textContent = displayChar(it.letters[tileId], allCaps);
        // Transient flash, not a permanent fixture (teacher, 8/8/2026) — the
        // tile's own background color (.is-blue/.is-wrongbg, set above)
        // already conveys right/wrong permanently; the icon is just a brief
        // confirmation, even on a re-render (e.g. navigating back to an
        // already-submitted word).
        if (isRight != null) showTransientMark(box, "aw-anagram-revealmark", isRight ? icons.markCheck : icons.markCross, 550);
        if (mode === "submit" && !st.graded) attachResultTileInteraction(box, pos);
        resultRow.append(box);
      });
      group.append(resultRow);

      const originRow = el("div", "aw-anagram-origin");
      const wordDone = mode === "bonus" ? st.correct === true : st.graded;
      it.tileOrder.forEach(tileId => {
        const used = st.used[tileId];
        const tile = el("button", "aw-anagram-otile" + (used ? " is-used" : ""));
        tile.type = "button";
        tile.dataset.tile = String(tileId);
        tile.textContent = displayChar(it.letters[tileId], allCaps);
        const locked = used || wordDone;
        tile.disabled = locked;
        attachOriginTileInteraction(tile, tileId);
        originRow.append(tile);
      });
      group.append(originRow);
      card.append(group);

      let revealSlot = null;
      if (mode === "submit") {
        revealSlot = el("div", "aw-anagram-reveal");
        revealSlot.textContent = st.correct === false ? (allCaps ? it.word.toUpperCase() : it.word) : "";
        card.append(revealSlot);
        revealSlotEl = revealSlot;
      }

      if (mode === "submit") {
        const submitBtn = el("button", "aw-anagram-submit", "Submit");
        submitBtn.type = "button";
        submitBtn.onclick = doSubmit;
        card.append(submitBtn);
        submitBtnEl = submitBtn;
      }

      card.append(el("div", "aw-anagram-botspace"));

      root.append(card);
      updateSubmitButtonState();

      const clueEl = card.querySelector(".aw-anagram-clue");
      // offsetHeight never includes MARGIN — group's bottom margin, the
      // reveal line's top margin, the Submit button's top margin, and the
      // card's own bottom padding are all real fixed (non-fit-scaled) vertical
      // space that autoFit must know about, or it under-shrinks on a 2-line
      // clue and Submit ends up pushed outside the stage.
      const groupMarginBottom = parseFloat(getComputedStyle(group).marginBottom) || 0;
      const revealMarginTop = revealSlot ? parseFloat(getComputedStyle(revealSlot).marginTop) || 0 : 0;
      const btnMarginTop = submitBtnEl ? parseFloat(getComputedStyle(submitBtnEl).marginTop) || 0 : 0;
      const cardPaddingBottom = parseFloat(getComputedStyle(card).paddingBottom) || 0;
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.045,
        measure: () => clueEl.offsetHeight + group.offsetHeight + groupMarginBottom +
          (revealSlot ? revealSlot.offsetHeight + revealMarginTop : 0) +
          (submitBtnEl ? submitBtnEl.offsetHeight + btnMarginTop : 0) + cardPaddingBottom
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    // ----- interaction: bonus mode -----
    function onTileClick(tileId, tileEl) {
      // NOTE (v0.9.29, teacher 3/8/2026): no longer gated by `busy` — that used
      // to block EVERY tile tap for the full ~340ms of the PREVIOUS letter's
      // flight, which felt laggy when tapping fast. `busy` still guards the
      // heavier result-row actions (Submit / drag-swap / send-back) below.
      if (finished) return;
      if (mode === "bonus") bonusPick(tileId, tileEl); else submitPick(tileId, tileEl);
    }

    // Returns true if the letter was placed, false on a mismatch/no-op — the
    // caller (a plain tap, or a drag-drop onto the receiving slot) uses this
    // to know whether to spring the tile back to the origin row.
    function bonusPick(tileId, tileEl) {
      const st = state[index];
      if (st.correct === true || st.used[tileId]) return false;
      const it = items[index];
      const expected = it.letters[st.nextPos];
      const picked = it.letters[tileId];
      if (picked.toLowerCase() !== expected.toLowerCase()) {
        st.hadMistake = true;
        anagramSound.wrongPick();
        showWrongPickMark();
        return false;
      }
      anagramSound.place();
      // State advances THE INSTANT a correct tap is validated — not when its fly
      // animation finishes — so a second/third... correct tap registers right
      // away too, its flight simply overlapping the previous one's. Only the
      // TAPPED tile itself locks (immediately, below); every other tile stays
      // tappable throughout, which is what makes fast consecutive taps feel
      // instant instead of gated behind each ~340ms flight (teacher, 3/8/2026).
      const destPos = st.nextPos;
      st.used[tileId] = true;
      st.placed[destPos] = tileId;
      st.nextPos++;
      tileEl.disabled = true;
      const wordDone = st.nextPos === it.letters.length;
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${destPos}"]`);
      const shownChar = displayChar(picked, allCaps);
      flyLetter(tileEl, destEl, shownChar, RESULT_BG, () => {
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, "is-blue");
        // Confirmation check lands on the DESTINATION tile (the one that was
        // just correctly filled) — teacher, 8/8/2026 (was on the origin tile,
        // which read as "wrong end" once she saw it land).
        showLandedCheckBadge(destEl);
        if (wordDone) finalizeBonusWord();
      });
      return true;
    }

    function finalizeBonusWord() {
      const st = state[index];
      const it = items[index];
      const n = it.letters.length;
      const perfect = !st.hadMistake;
      if (!perfect) penalty += pointsOff;   // one points-off for a word solved with any mistake
      const outOfLives = !perfect && loseLife();   // a life is lost on a word solved WITH a mistake
      const earned = n * (perfect ? 2 : 1);
      st.correct = true;               // word is DONE — points deferred, see below
      // No render() here: every origin tile is already .is-used and every
      // result tile already .is-blue via the incremental patches each
      // successful pick applied — a full render() would just replay the
      // WHOLE card's fade-in animation for no visual gain (that's exactly
      // the flash bug). Only updateNav() is a real change at this instant.
      updateNav();
      anagramSound.wordCompleteBonus();
      const applyAndGetNewTotal = () => { st.points = earned; return scoreNow(); };
      let finishDelay;
      if (perfect) {
        // PERFECT pops in place; the point value follows it a beat later and
        // is the thing that actually flies to the score (teacher, 8/8/2026).
        showPerfectBurst();
        flyPointsOnly(earned, applyAndGetNewTotal, PERFECT_TO_POINTS_DELAY_MS);
        finishDelay = PERFECT_TO_POINTS_DELAY_MS + PICKFLY_TOTAL_MS + FLYGAIN_PULSE_MS + 250;
      } else {
        // Had a mistake: no PERFECT, no icon at all — just the points flying.
        flyPointsOnly(earned, applyAndGetNewTotal, 0);
        finishDelay = PICKFLY_TOTAL_MS + FLYGAIN_PULSE_MS + 250;
      }
      if (outOfLives) autoTimer = setTimeout(() => finish({ gameover: true }), finishDelay);
      else if (state.every(doneCheck)) autoTimer = setTimeout(finish, finishDelay);
    }

    // ----- interaction: submit mode -----
    // Plain tap: always the leftmost empty slot (unchanged behaviour).
    function submitPick(tileId, tileEl) {
      const slotIdx = state[index].placed.findIndex(p => p === null);
      if (slotIdx === -1) return;
      submitPickAt(tileId, tileEl, slotIdx);
    }

    // Drag-drop: the PLAYER chose the destination slot (teacher, 8/8/2026 —
    // "On submit" drags land wherever dropped, unlike the tap's auto-fill).
    // Returns true if placed, false if the slot was invalid/occupied — the
    // caller springs the tile back to the origin row on false.
    function submitPickAt(tileId, tileEl, slotIdx) {
      const st = state[index];
      if (st.graded || st.used[tileId]) return false;
      if (slotIdx == null || slotIdx < 0 || st.placed[slotIdx] != null) return false;
      const it = items[index];
      anagramSound.place();   // same "drop" as bonus mode's correct pick — both modes tap the origin row alike
      // Same decoupling as bonusPick: the slot is claimed and the tile locked
      // RIGHT NOW (not in the fly's onDone) so a fast second tap reads the
      // updated `placed` array and can't double-claim the same empty slot, and
      // so taps never wait on each other's flight to finish.
      st.used[tileId] = true;
      st.placed[slotIdx] = tileId;
      tileEl.disabled = true;
      updateSubmitButtonState();
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${slotIdx}"]`);
      const shownChar = displayChar(it.letters[tileId], allCaps);
      // stays ORIGIN-colored during the flight (only Submit reveals right/wrong colors)
      flyLetter(tileEl, destEl, shownChar, ORIGIN_BG, () => {
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, null);
      });
      return true;
    }

    function unplace(pos) {
      const st = state[index];
      if (st.graded || busy) return;
      const tileId = st.placed[pos];
      if (tileId == null) return;
      const it = items[index];
      const resultEl = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
      const originEl = root.querySelector(`.aw-anagram-otile[data-tile="${tileId}"]`);
      const shownChar = displayChar(it.letters[tileId], allCaps);
      anagramSound.pickup();
      st.placed[pos] = null;
      st.used[tileId] = false;
      updateSubmitButtonState();
      if (!resultEl || !originEl) { patchResultSlotDisplay(pos); patchOriginRestored(tileId); return; }
      // Empty the slot right away (back to its dashed placeholder look) —
      // the letter itself keeps traveling as a separate flying clone, so it
      // never just "vanishes"; the origin tile only reappears once the
      // clone actually ARRIVES there.
      const fromRect = resultEl.getBoundingClientRect();
      const toRect = originEl.getBoundingClientRect();
      const fontSize = getComputedStyle(resultEl).fontSize;
      const borderRadius = getComputedStyle(resultEl).borderRadius;
      patchResultSlotDisplay(pos);
      busy = true;
      flyTileClone(fromRect, toRect, shownChar, ORIGIN_BG, fontSize, () => {
        patchOriginRestored(tileId);
        busy = false;
        updateSubmitButtonState();
      }, borderRadius);
    }

    // "Chèn-đẩy" (insert-and-shift) reorder — replaces the old A<->B swap
    // (teacher, 8/8/2026): dragging a placed tile onto another slot no
    // longer just trades those two — it's pulled OUT of its slot and
    // INSERTED at the target slot, shifting every tile between the two
    // positions back by one, the same mental model as reordering a list
    // (the content editor's row drag already works this way). `fromPos`'s
    // tile keeps going from EXACTLY where the hand let go —
    // `draggedFromRect`, its current on-screen rect, still carrying the live
    // drag transform — so it never stops looking like itself mid-flight (no
    // hide/reveal seam). Every REAL tile between fromPos/toPos slides the
    // short one-slot distance to make room. All of them reset `transform:""`
    // and repaint via patchResultSlotDisplay() in the SAME synchronous tick
    // once every animation finishes — the browser only ever paints the
    // combined "back home + correct letter" frame, never an in-between flash
    // (same trick used by every other patch* function here).
    function moveResultTile(fromPos, toPos, draggedFromRect) {
      const st = state[index];
      if (st.graded || busy || fromPos === toPos) return;
      const lo = Math.min(fromPos, toPos), hi = Math.max(fromPos, toPos);

      // Snapshot each affected slot's TRUE (untransformed) layout rect
      // BEFORE anything moves — toggling transform off/on to measure is
      // cheap and avoids parsing transform strings back into numbers.
      const els = {}, homes = {};
      for (let p = lo; p <= hi; p++) {
        const elp = root.querySelector(`.aw-anagram-rtile[data-pos="${p}"]`);
        els[p] = elp;
        if (!elp) continue;
        const saved = elp.style.transform;
        elp.style.transform = "";
        homes[p] = elp.getBoundingClientRect();
        elp.style.transform = saved;
      }

      const oldPlaced = st.placed.slice();
      const moved = st.placed.splice(fromPos, 1)[0];
      st.placed.splice(toPos, 0, moved);
      anagramSound.pickup();
      updateSubmitButtonState();

      // For every OLD occupant of a slot in [lo,hi], find where its content
      // ends up now (unique by tileId) and animate THAT DOM node sliding
      // there. Slots that were already empty carry no letter, so there's
      // nothing to visibly slide for them — patchResultSlotDisplay() alone
      // (at settle) is enough, and lands invisibly under whichever real tile
      // just finished animating into that exact spot.
      const jobs = [];
      let dur = FLY_MIN_MS;
      for (let p = lo; p <= hi; p++) {
        const tileId = oldPlaced[p];
        if (tileId == null) continue;
        const elp = els[p];
        const homeP = homes[p];
        if (!elp || !homeP) continue;
        const destPos = st.placed.indexOf(tileId);
        const destHome = homes[destPos];
        if (!destHome || destPos === p) continue;
        const curP = (p === fromPos && draggedFromRect) ? draggedFromRect : homeP;
        const dx = (destHome.left + destHome.width / 2) - (homeP.left + homeP.width / 2);
        const dy = (destHome.top + destHome.height / 2) - (homeP.top + homeP.height / 2);
        const travelDx = (destHome.left + destHome.width / 2) - (curP.left + curP.width / 2);
        const travelDy = (destHome.top + destHome.height / 2) - (curP.top + curP.height / 2);
        dur = Math.max(dur, flyDurationFor(travelDx, travelDy));
        jobs.push({ el: elp, from: (p === fromPos ? elp.style.transform : "") || "translate(0,0) scale(1)",
                    to: `translate(${dx}px, ${dy}px) scale(1)` });
      }

      if (!jobs.length) {
        for (let p = lo; p <= hi; p++) patchResultSlotDisplay(p);
        return;
      }

      busy = true;
      let pending = jobs.length;
      const settle = () => {
        pending--;
        if (pending > 0) return;
        // `fill:"forwards"` keeps a FINISHED animation's last keyframe active
        // over the cascade — clearing style.transform alone does nothing
        // while that hold is still in effect (caught measuring
        // getComputedStyle post-settle during testing, 8/8/2026); cancel()
        // releases the hold so the (now-empty) inline style wins.
        jobs.forEach(j => { j.anim.cancel(); j.el.style.transform = ""; });
        if (els[fromPos]) els[fromPos].classList.remove("is-dragging");
        for (let p = lo; p <= hi; p++) patchResultSlotDisplay(p);
        busy = false;
        updateSubmitButtonState();
      };

      jobs.forEach(job => {
        job.anim = job.el.animate(
          [{ transform: job.from }, { transform: job.to }],
          { duration: dur, easing: FLY_EASING, fill: "forwards" }
        );
        let done = false;
        const finish = () => { if (done) return; done = true; settle(); };
        job.anim.onfinish = finish;
        setTimeout(finish, dur + 100);
      });
    }

    // Shared position-only fly (no color morph — everything pre-Submit
    // stays the neutral origin grey) used by unplace().
    // `fontSize` MUST be passed in (read from the real tile before it's
    // touched) — this clone used to fall back to the page's inherited
    // font-size instead of the tile's actual size, which is why a swapped or
    // returned letter visibly shrank mid-flight (teacher-reported, 3/8/2026).
    function flyTileClone(fromRect, toRect, char, bg, fontSize, onDone, borderRadius) {
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      // backgroundCOLOR (longhand), not the `background` shorthand — the
      // shorthand would blank out the CSS-declared gloss `background-image`
      // that .aw-anagram-flytile shares with the real tiles (teacher, 8/8/2026).
      clone.style.backgroundColor = bg;
      if (borderRadius) clone.style.borderRadius = borderRadius;
      document.body.append(clone);
      // Forces a synchronous style/layout flush BEFORE the transform animation
      // starts, so the browser paints one legitimate "at rest" frame (already
      // rounded, already sized) first — without this, transform-driven
      // compositor-layer promotion can race the very first paint and flash a
      // raw square-cornered frame for 1-2 frames (teacher-reported, 3/8/2026).
      void clone.offsetWidth;
      activeFlyNodes.add(clone);
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      const duration = flyDurationFor(dx, dy);
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px, ${dy}px)` }
      ], { duration, easing: FLY_EASING, fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, duration + 150);
    }

    // Drag (pointer events, mouse+touch alike) to INSERT an already-placed
    // result tile at another slot (pushing everything in between back by
    // one — see moveResultTile()), OR a plain tap (no real movement) to send
    // it back to the origin row — only while the word hasn't been submitted yet.
    function attachResultTileInteraction(tileEl, pos) {
      let dragging = false, moved = false, startX = 0, startY = 0;
      const THRESHOLD = 6;
      tileEl.style.touchAction = "none";
      tileEl.addEventListener("pointerdown", e => {
        const st = state[index];
        if (busy || st.graded || st.placed[pos] == null) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        tileEl.setPointerCapture(e.pointerId);
      });
      tileEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
          moved = true;
          tileEl.classList.add("is-dragging");
        }
        if (moved) {
          tileEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          setDropHighlight(target && target !== tileEl ? target : null);
        }
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        clearDropHighlight();
        if (moved) {
          // Read the tile's CURRENT on-screen rect — still carrying its drag
          // transform at this instant — BEFORE anything resets it. This is
          // the fix for the old "snap back to source slot, then a separate
          // clone flies" bug: the flight now starts from wherever the hand
          // actually let go.
          const draggedRect = tileEl.getBoundingClientRect();
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          if (target && target !== tileEl && target.dataset.pos != null) {
            // .is-dragging (elevated z-index) stays on until moveResultTile
            // actually settles — the real tile keeps sliding in view now
            // (no more hide-and-fly-a-clone), so it must stay on top of the
            // other tiles it's crossing over the whole way across.
            moveResultTile(pos, Number(target.dataset.pos), draggedRect);
          } else {
            animateReturnHome(tileEl);   // keeps .is-dragging (elevated z-index) until it has actually settled
          }
        } else {
          tileEl.classList.remove("is-dragging");
          tileEl.style.transform = "";
          unplace(pos);
        }
      };
      tileEl.addEventListener("pointerup", endDrag);
      tileEl.addEventListener("pointercancel", endDrag);
    }

    // ----- drag & drop helpers (shared by origin-row placement drags and
    // result-row swap drags) -----
    let dropHighlightEl = null;
    function setDropHighlight(target) {
      if (dropHighlightEl === target) return;
      if (dropHighlightEl) dropHighlightEl.classList.remove("is-droptarget");
      dropHighlightEl = target || null;
      if (dropHighlightEl) dropHighlightEl.classList.add("is-droptarget");
    }
    function clearDropHighlight() { setDropHighlight(null); }

    // Finds the real drop target under the pointer, ignoring the element
    // being dragged itself (it's still under the pointer while held).
    function hitTestUnder(el0, x, y, selector) {
      const prevPE = el0.style.pointerEvents;
      el0.style.pointerEvents = "none";
      const under = document.elementFromPoint(x, y);
      el0.style.pointerEvents = prevPE;
      return under ? under.closest(selector) : null;
    }

    // Smoothly slides a tile that's mid-drag (still carrying its drag
    // transform) back to its normal layout position — used whenever a drag
    // ends without landing anywhere valid (dropped in empty space, dropped
    // on the wrong slot, or the letter turned out wrong). Animates the REAL
    // tile, not a clone — it never actually left the DOM, which is what
    // makes "let go and it springs back to your hand" read as physical
    // instead of an instant teleport (teacher, 8/8/2026).
    function animateReturnHome(tileEl) {
      const current = tileEl.style.transform;
      const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(current || "");
      const duration = flyDurationFor(m ? parseFloat(m[1]) : 0, m ? parseFloat(m[2]) : 0);
      let done = false;
      const anim = tileEl.animate(
        [{ transform: current || "translate(0,0)" }, { transform: "translate(0,0) scale(1)" }],
        { duration, easing: FLY_EASING, fill: "forwards" }
      );
      const finishIt = () => {
        if (done) return; done = true;
        // Must cancel BEFORE clearing the inline style — a finished
        // `fill:"forwards"` animation keeps holding its last keyframe over
        // the cascade otherwise, which would then also block any FUTURE
        // plain `style.transform` write on this tile (e.g. the very next
        // drag's live pointermove tracking) from having any visible effect
        // (caught by measuring getComputedStyle post-settle in the swap
        // path's identical pattern, 8/8/2026 — fixed here too for the same
        // reason, even though this keyframe's end value happens to already
        // look identical to "").
        anim.cancel();
        tileEl.style.transform = "";
        tileEl.classList.remove("is-dragging");
      };
      anim.onfinish = finishIt;
      setTimeout(finishIt, duration + 150);
    }

    // Is `target` (a result-row tile the player is hovering/dropping over)
    // a legal destination for a letter dragged straight from the origin
    // row? Bonus mode only ever accepts the ONE slot currently being
    // solved for (order still matters, per the teacher's ruling — dragging
    // just changes HOW you place a letter, not the turn order); On-submit
    // accepts any still-empty slot (the player picks where it goes).
    function isValidOriginDropTarget(target) {
      if (!target || target.dataset.pos == null) return false;
      const st = state[index];
      const pos = Number(target.dataset.pos);
      if (mode === "bonus") return pos === st.nextPos;
      return st.placed[pos] == null;
    }

    // Resolves a drag that started on an ORIGIN tile and ended over `target`
    // (may be null). Dropping on an invalid slot never counts as a real
    // attempt — it just springs back with no penalty. Dropping the WRONG
    // letter on bonus mode's one legal (receiving) slot DOES count as a
    // mistake, same as tapping the wrong tile — bonusPick() already applies
    // that penalty, this just also has to spring the tile back since (unlike
    // a tap) it actually left its spot.
    function handleOriginDrop(tileId, tileEl, target) {
      if (finished || !isValidOriginDropTarget(target)) { animateReturnHome(tileEl); return; }
      const pos = Number(target.dataset.pos);
      const ok = mode === "bonus" ? bonusPick(tileId, tileEl) : submitPickAt(tileId, tileEl, pos);
      if (ok) tileEl.classList.remove("is-dragging");   // flyLetter has already hidden the tile — safe now
      else animateReturnHome(tileEl);
    }

    // Lets an origin-row tile be DRAGGED straight onto a result slot (both
    // modes), on top of the existing plain-tap placement. A tap (no real
    // pointer movement past THRESHOLD) falls through to the exact same
    // onTileClick() path as before — drag is purely an alternate input, the
    // tap behaviour is untouched.
    function attachOriginTileInteraction(tileEl, tileId) {
      let dragging = false, moved = false, startX = 0, startY = 0;
      const THRESHOLD = 6;
      tileEl.style.touchAction = "none";
      tileEl.addEventListener("pointerdown", e => {
        if (finished || tileEl.disabled) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        tileEl.setPointerCapture(e.pointerId);
      });
      tileEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
          moved = true;
          tileEl.classList.add("is-dragging");
        }
        if (moved) {
          tileEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          setDropHighlight(isValidOriginDropTarget(target) ? target : null);
        }
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        clearDropHighlight();
        if (moved) {
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          handleOriginDrop(tileId, tileEl, target);
        } else {
          tileEl.style.transform = "";
          onTileClick(tileId, tileEl);
        }
      };
      tileEl.addEventListener("pointerup", endDrag);
      tileEl.addEventListener("pointercancel", endDrag);
    }

    function doSubmit() {
      const st = state[index];
      if (st.graded || busy) return;
      if (!st.placed.every(p => p != null)) return;
      const it = items[index];
      busy = true;
      st.graded = true;
      // No render() here: every origin tile is already .is-used (Submit only
      // enables once every slot is filled), so nothing there needs to change.
      // Just disable the button and let Next reflect "graded" — the reveal
      // itself is driven by the staggered loop below, patching the SAME live
      // tiles directly (a full render() would flash the whole card).
      updateSubmitButtonState();
      updateNav();

      const n = it.letters.length;
      let allCorrect = true;
      for (let pos = 0; pos < n; pos++) {
        const tileId = st.placed[pos];
        const isRight = it.letters[tileId].toLowerCase() === it.letters[pos].toLowerCase();
        if (!isRight) allCorrect = false;
        setTimeout(() => {
          const slotEl = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
          if (!slotEl) return;
          slotEl.classList.add(isRight ? "is-blue" : "is-wrongbg");
          // Transient flash (teacher, 8/8/2026) — see the identical note at
          // render()'s revealmark append.
          const mark = el("span", "aw-anagram-revealmark", isRight ? icons.markCheck : icons.markCross);
          slotEl.append(mark);
          setTimeout(() => mark.remove(), 550);
          (isRight ? anagramSound.submitTileCorrect : anagramSound.wrongPick)();
        }, pos * STAGGER_MS);
      }

      setTimeout(() => {
        st.correct = allCorrect;
        if (!allCorrect && pointsOff) { penalty += pointsOff; ui.setScore(scoreNow()); }  // one points-off for a wrong word
        const outOfLives = !allCorrect && loseLife();   // a life is lost on a wrong word
        st.revealed = true;   // only matters if this word is re-rendered later (e.g. navigated back to)
        busy = false;
        updateSubmitButtonState();
        updateNav();
        // Per-position colors/badges are ALREADY on the live tiles (the
        // staggered loop above applied them directly) — only the reveal
        // line's text is still outstanding, patch it in place.
        if (revealSlotEl) revealSlotEl.textContent = allCorrect ? "" : (allCaps ? it.word.toUpperCase() : it.word);
        if (allCorrect) {
          flyScoreGain(1, () => { st.points = 1; return scoreNow(); });
          anagramSound.submitWordCorrect();
        } else {
          showBigMark(false);
          // Real Anagram "Incorrect" sound (same pool as a per-letter wrong
          // pick) instead of core's generic synthesized wrong tone (teacher,
          // 8/8/2026 — "âm chuẩn trong source âm thanh"). Wordwall's own
          // asset set has no SEPARATE "whole word wrong" sound — "Incorrect"
          // is reused at every granularity, per the source folder's own
          // notes (GHI CHU.md).
          anagramSound.wrongPick();
        }
        if (outOfLives) {
          autoTimer = setTimeout(() => finish({ gameover: true }), 1500);   // always the wrong-word branch (outOfLives implies !allCorrect)
        } else if (state.every(doneCheck)) {
          autoTimer = setTimeout(finish, allCorrect ? FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250 : 1500);
        }
      }, n * STAGGER_MS + 300);
    }

    // ----- incremental DOM patches (avoid a full render() mid-word — that
    // used to flash the whole clue+both rows on every single tap) -----
    function patchTileUsed(tileEl) {
      // Deliberately do NOT reset style.visibility back to "" here — the tile
      // was set to visibility:hidden the instant it started flying (see
      // flyLetter). Clearing that back to visible right as `.is-used`'s
      // opacity:0 kicks in made the CSS opacity transition animate from a
      // (now momentarily visible) opacity:1 down to 0 — a brief flash right
      // where the tile used to be. Leaving it hidden is permanent and fine:
      // this tile is used for good, it never needs to reappear.
      tileEl.classList.add("is-used");
      tileEl.classList.remove("is-dragging");
      tileEl.style.transform = "";
      tileEl.disabled = true;
    }
    function patchOriginRestored(tileId) {
      const tileEl = root.querySelector(`.aw-anagram-otile[data-tile="${tileId}"]`);
      if (!tileEl) return;
      // This tile is genuinely coming BACK into play (unplace/On submit),
      // unlike patchTileUsed's permanent hide — it must reappear, so the
      // visibility:hidden set when it originally flew away has to be
      // cleared here. Safe from the earlier flash bug: opacity (via
      // .is-used removal) and visibility both move the SAME direction
      // (hidden -> shown) here, so it fades IN cleanly instead of flashing.
      tileEl.style.visibility = "";
      tileEl.classList.remove("is-used");
      // Always re-enable — every call site restores this tile right as its
      // own lock is ending, so there is no "still busy" case to preserve
      // (reading the outer `busy` here raced against it being cleared right
      // after, in whichever order the caller happened to write them).
      tileEl.disabled = false;
    }
    function patchResultFilled(destEl, char, extraClass) {
      destEl.classList.add("is-filled");
      if (extraClass) destEl.classList.add(extraClass);
      destEl.textContent = char;
    }
    function patchResultSlotDisplay(pos) {
      const elx = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
      if (!elx) return;
      const st = state[index], it = items[index];
      const tileId = st.placed[pos];
      elx.classList.remove("is-blue", "is-wrongbg");
      if (tileId != null) { elx.classList.add("is-filled"); elx.textContent = displayChar(it.letters[tileId], allCaps); }
      else { elx.classList.remove("is-filled"); elx.textContent = ""; }
    }
    function updateSubmitButtonState() {
      if (!submitBtnEl) return;
      const st = state[index];
      const filled = st.placed.every(p => p != null);
      submitBtnEl.disabled = !filled || st.graded || busy;
    }

    // ----- shared visual effects -----

    // Pops a transient check/cross mark into `parentEl`: small->large while
    // fading in, holds at full size, then large->small while fading out — a
    // SINGLE continuous animation instead of a CSS entrance + an instant
    // `.remove()`, which used to make the mark vanish with a jerk (teacher,
    // 8/8/2026: "biến mất khực một cái"). Removing the element only happens
    // once the shrink-out has actually finished playing.
    function showTransientMark(parentEl, className, iconSvg, totalMs) {
      const mark = el("span", className, iconSvg);
      parentEl.append(mark);
      const anim = mark.animate([
        { transform: "scale(.3)", opacity: 0, offset: 0, easing: "cubic-bezier(.34,1.4,.4,1)" },
        { transform: "scale(1)", opacity: 1, offset: 0.32 },
        { transform: "scale(1)", opacity: 1, offset: 0.7, easing: "ease-in" },
        { transform: "scale(.4)", opacity: 0, offset: 1 }
      ], { duration: totalMs, fill: "forwards" });
      let done = false;
      const finish = () => { if (done) return; done = true; mark.remove(); };
      anim.onfinish = finish;
      setTimeout(finish, totalMs + 100);
      return mark;
    }

    // A big white check on the DESTINATION tile right as a correct letter
    // lands — same visual family as the big white X (teacher, 8/8/2026: it
    // used to sit on the ORIGIN tile, which read as the wrong end once the
    // letter had already flown away).
    function showLandedCheckBadge(destEl) {
      showTransientMark(destEl, "aw-anagram-slotmark", icons.markCheck, 550);
    }

    // A big white X inside the currently-PENDING result slot (the one a
    // wrong letter was aimed at) — replaces the old small red X that used to
    // sit on the origin tile itself (teacher, 8/8/2026).
    function showWrongPickMark() {
      const slotEl = root.querySelector(`.aw-anagram-rtile[data-pos="${state[index].nextPos}"]`);
      if (!slotEl) return;
      showTransientMark(slotEl, "aw-anagram-slotmark", icons.markCross, 550);
    }

    // "PERFECT" pops up at the middle of the tile rows, grows in, then fades
    // out IN PLACE — it no longer flies anywhere (teacher, 8/8/2026: the
    // point value is a separate, later effect — see flyPointsOnly() below).
    function showPerfectBurst() {
      // Centered on the RESULT row specifically (not the whole group, which
      // spans both rows and would land it in the gap between them — teacher-
      // reported "bị lệch", 8/8/2026).
      const row = root.querySelector(".aw-anagram-result");
      if (!row) return;
      const burst = el("span", "aw-anagram-perfect-burst", "PERFECT");
      row.append(burst);
      setTimeout(() => burst.remove(), PERFECT_BURST_MS);
    }

    // Flies "+N" from the middle of the tile rows to the score badge, no icon
    // shown first — used for BOTH bonus-mode outcomes (teacher, 8/8/2026): a
    // non-perfect word calls this immediately with delayMs=0, a perfect word
    // calls it a beat after showPerfectBurst() (delayMs>0) so PERFECT reads
    // as "for the word", then the number reads as "here's what it earned".
    function flyPointsOnly(points, applyAndGetNewTotal, delayMs) {
      const run = () => {
        // Same anchor as showPerfectBurst() (the RESULT row) so the two
        // effects visually belong together instead of jumping between spots
        // (teacher, 8/8/2026).
        const row = root.querySelector(".aw-anagram-result");
        const scoreEl = document.querySelector(".aw-top-score");
        if (!row || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
        // "slightly bigger than one tile" (teacher, 8/8/2026), THEN doubled
        // again per the follow-up request — read the REAL rendered tile size
        // directly instead of guessing a cqw->px conversion, so this stays
        // correct at any fit/zoom level.
        const tileEl = root.querySelector(".aw-anagram-otile, .aw-anagram-rtile");
        const tilePx = tileEl ? tileEl.getBoundingClientRect().width : 40;
        const baseSize = Math.max(48, tilePx * 1.15 * 2);

        const startRect = row.getBoundingClientRect();
        const endRect = scoreEl.getBoundingClientRect();
        const cx = startRect.left + startRect.width / 2;
        const cy = startRect.top + startRect.height / 2;
        const dx = (endRect.left + endRect.width / 2) - cx;
        const dy = (endRect.top + endRect.height / 2) - cy;

        const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
        const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

        const numEl = el("div", "aw-anagram-flynum", "+" + points);
        numEl.style.left = cx + "px";
        numEl.style.top = cy + "px";
        numEl.style.fontSize = baseSize + "px";
        document.body.append(numEl);
        activeFlyNodes.add(numEl);

        const total = PICKFLY_HOLD_MS + PICKFLY_FLIGHT_MS;
        const holdFrac = PICKFLY_HOLD_MS / total;
        const anim = numEl.animate([
          { transform: "translate(-50%,-50%) scale(.6)", opacity: 0, offset: 0 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: Math.min(1, holdFrac * 0.5) },
          { transform: "translate(-50%,-50%) scale(1.06)", opacity: 1, offset: holdFrac },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 1, offset: 1 }
        ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

        let done = false;
        const complete = () => {
          if (done) return; done = true;
          numEl.remove(); activeFlyNodes.delete(numEl);
          pulseScoreTo(applyAndGetNewTotal());
        };
        anim.onfinish = complete;
        setTimeout(complete, total + 150);
      };
      if (delayMs) setTimeout(run, delayMs); else run();
    }

    // In-place big check/cross — used ONLY for the "submit" mode's WRONG
    // outcome now (correct outcomes fly+pulse into the score, see below).
    function showBigMark(isCorrect) {
      const g = root.querySelector(".aw-anagram-group");
      if (!g) return;
      const fly = el("span", "aw-mark-fly" + (isCorrect ? "" : " is-cross"),
        isCorrect ? icons.markCheck : icons.markCross);
      g.append(fly);
      setTimeout(() => fly.remove(), isCorrect ? 900 : 2000);
    }

    // Shared "hold in place, then fly to the score, morphing into +points,
    // pulse-counting it in" effect — submit mode's all-correct outcome ONLY
    // now (bonus mode's own feedback is showPerfectBurst()/flyPointsOnly()
    // above, teacher 8/8/2026). `applyAndGetNewTotal` is called only once
    // the mark ARRIVES (it applies this word's points and returns the fresh
    // scoreNow() total) — so the score visibly stays unchanged until that
    // exact moment, matching "chuyển dần thành điểm... rồi nhập vào số điểm
    // tổng".
    function flyScoreGain(points, applyAndGetNewTotal) {
      const g = root.querySelector(".aw-anagram-group");
      const scoreEl = document.querySelector(".aw-top-score");
      if (!g || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const startRect = g.getBoundingClientRect();
      const endRect = scoreEl.getBoundingClientRect();
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;

      const wrap = el("div", "aw-anagram-flygain");
      wrap.style.left = cx + "px";
      wrap.style.top = cy + "px";
      // Must match the big X's size exactly (both are "whole word" marks) —
      // the X is CSS width:34.7% of this SAME .aw-anagram-group (see
      // anagram.css), so mirror that fraction here in px (font-size drives
      // width/height via the 1em box on .aw-anagram-flygain).
      const baseSize = Math.max(28, startRect.width * 0.347);
      wrap.style.fontSize = baseSize + "px";

      // How far to shrink by the time it ARRIVES: the actual score badge's own
      // font-size, not a flat guess. Fixes the mark still looking oversized
      // right as it lands (teacher-reported, 3/8/2026) — before this, the end
      // keyframe was a flat scale(0.4) regardless of baseSize, which could
      // still be much bigger than the tiny score digits for a wide stage.
      const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
      const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

      const iconSpan = el("span", "afg-icon", icons.markCheck);
      const numSpan = el("span", "afg-num", "+" + points);
      wrap.append(iconSpan, numSpan);
      document.body.append(wrap);
      activeFlyNodes.add(wrap);

      const total = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;
      const holdFrac = FLYGAIN_HOLD_MS / total;
      const fadeEndFrac = Math.min(1, (FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS * 0.6) / total);

      const wrapAnim = wrap.animate([
        { transform: "translate(-50%,-50%) scale(1)", offset: 0 },
        { transform: "translate(-50%,-50%) scale(1.1)", offset: holdFrac },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, offset: 1 }
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

    // Animates the top-score badge from its currently-shown number up to
    // `newValue`, with a scale "pulse" — reaches directly into engine.js's
    // `.aw-top-score` (same element/markup ui.setScore() writes:
    // `${icons.check} ${n}`) since ui.setScore() itself has no animated form.
    function pulseScoreTo(newValue) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (!scoreEl) return;
      const match = /(-?\d+)/.exec(scoreEl.textContent || "");
      const oldValue = match ? parseInt(match[1], 10) : 0;
      if (oldValue === newValue) { ui.setScore(newValue); return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth; // restart if still running
      scoreEl.classList.add("aw-score-pulse");
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / FLYGAIN_PULSE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(oldValue + (newValue - oldValue) * eased);
        scoreEl.innerHTML = `${icons.check} ${val}`;
        if (t < 1) requestAnimationFrame(step);
        else {
          scoreEl.innerHTML = `${icons.check} ${newValue}`;
          setTimeout(() => scoreEl.classList.remove("aw-score-pulse"), 200);
        }
      };
      requestAnimationFrame(step);
    }

    // Flies a cloned tile from its origin-row position into a result slot.
    // `toColor` = the background it should end on (bonus: RESULT_BG, turns
    // blue immediately; submit: ORIGIN_BG, stays grey until Submit reveals
    // right/wrong colors).
    function flyLetter(fromEl, toEl, char, toColor, onDone) {
      if (!fromEl || !toEl) { onDone(); return; }
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const fontSize = getComputedStyle(fromEl).fontSize;
      const borderRadius = getComputedStyle(fromEl).borderRadius;
      fromEl.style.visibility = "hidden";
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      // backgroundCOLOR (longhand) — see the identical note in flyTileClone().
      clone.style.backgroundColor = toColor;
      clone.style.borderRadius = borderRadius;
      document.body.append(clone);
      // See the identical comment in flyTileClone() — forces one legitimate
      // "at rest" paint before the transform animation starts, avoiding a
      // square-cornered flash during compositor-layer promotion.
      void clone.offsetWidth;
      activeFlyNodes.add(clone);
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      const duration = flyDurationFor(dx, dy);
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)", backgroundColor: ORIGIN_BG },
        { transform: `translate(${dx}px, ${dy}px)`, backgroundColor: toColor }
      ], { duration, easing: FLY_EASING, fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, duration + 150);
    }

    // ----- navigation -----
    function updateNav() {
      const isLast = index === total - 1;
      const st = state[index];
      const canAdvance = allowSkip || doneCheck(st);
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: canAdvance ? (isLast ? finish : goNext) : null,
        nextLabel: isLast ? icons.check : null
      });
    }

    function fadeSwap(change) {
      const card = root.querySelector(".aw-anagram-card");
      if (!card) { change(); return; }
      let done = false;
      const run = () => { if (done) return; done = true; change(); };
      const anim = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" });
      anim.onfinish = run;
      setTimeout(run, 220);
    }
    function goPrev() { if (busy) return; if (index > 0) fadeSwap(() => { index--; render(); }); }
    function goNext() { if (busy) return; if (index < total - 1) fadeSwap(() => { index++; render(); }); }

    function finish(opts) {
      if (finished) return;
      finished = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correctWords = perQuestion.filter(p => p.correct).length;
      // Bonus mode scores per LETTER (+ the double-perfect bonus), so the
      // "Score" total shown at game-complete is the letter count too — the
      // word count (`total`, used for nav) is a different, unrelated number
      // here. Submit mode scores 1 point per word, so total stays word-based.
      let correct, finishTotal;
      if (mode === "bonus") {
        correct = state.reduce((sum, s) => sum + (s.points || 0), 0);
        finishTotal = items.reduce((sum, it) => sum + it.letters.length, 0);
      } else {
        correct = correctWords;
        finishTotal = total;
      }
      const review = items.map((it, i) => {
        const s = state[i];
        const started = s.placed.some(p => p != null);
        const partial = started ? s.placed.map(id => id != null ? it.letters[id] : "_").join("") : null;
        return {
          question: it.clue || "Unscramble the word",
          answered: doneCheck(s),
          yourText: s.correct === true ? it.word : partial,
          yourCorrect: s.correct === true,
          correctText: it.word,
          src: it.src
        };
      });
      const answered = state.filter(s => doneCheck(s)).length;
      ui.finish({
        // `correct` stays the genuine measure (words, or letters in bonus mode) so
        // the summary's small "Total: x/y" row can show it distinctly; `score` is
        // what ranking/leaderboard actually use — reflects points-off (no-op when
        // the option is off). Previously `correct` itself was decremented in place
        // and no separate `score` was sent, so ranking/summary matched `correct`
        // exactly and that secondary row could never appear even when a penalty
        // had been applied.
        correct, incorrect: total - correctWords, total: finishTotal, perQuestion, review, answered,
        score: correct - penalty,
        title: opts?.gameover ? "Game over" : undefined
      });
    }

    return function cleanup() {
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      if (sloganEl) sloganEl.remove();
      if (topbar) topbar.style.position = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(anagramTemplate);
export default anagramTemplate;
