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

// Small colored check/cross for the "on submit" per-position reveal —
// deliberately distinct from core/icons.js's white/dark-outline markCheck/
// markCross (those are for the big celebratory marks; these are small and
// carry meaning through COLOR, per the teacher's request).
const SMALL_CHECK_GREEN = `<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 12.5l5 5L19.5 6.5" stroke="#22a35e" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SMALL_CROSS_RED = `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#e0453f" stroke-width="3.6" stroke-linecap="round"/></svg>`;

const FLY_DURATION = 340;   // ms — one tile's flight into the result row
const STAGGER_MS = 260;     // ms — gap between each position's reveal in "submit" mode

// The shared "hold, then fly to the score, morph into +points, pulse-count
// it in" sequence (bonus PERFECT, bonus normal-correct, submit all-correct).
const FLYGAIN_HOLD_MS = 550;
const FLYGAIN_FLIGHT_MS = 550;
const FLYGAIN_PULSE_MS = 420;
const FLYGAIN_TOTAL_MS = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;

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
        if (isRight != null) box.append(el("span", "aw-tile-badge", isRight ? SMALL_CHECK_GREEN : SMALL_CROSS_RED));
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
        tile.onclick = () => onTileClick(tileId, tile);
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

    function bonusPick(tileId, tileEl) {
      const st = state[index];
      if (st.correct === true || st.used[tileId]) return;
      const it = items[index];
      const expected = it.letters[st.nextPos];
      const picked = it.letters[tileId];
      if (picked.toLowerCase() !== expected.toLowerCase()) {
        st.hadMistake = true;
        anagramSound.wrongPick();
        showWrongPickBadge(tileEl);
        return;
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
        if (wordDone) finalizeBonusWord();
      });
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
      flyScoreGain(perfect ? "perfect" : "check", earned, () => { st.points = earned; return scoreNow(); });
      anagramSound.wordCompleteBonus();
      if (outOfLives) autoTimer = setTimeout(() => finish({ gameover: true }), FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250);
      else if (state.every(doneCheck)) autoTimer = setTimeout(finish, FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250);
    }

    // ----- interaction: submit mode -----
    function submitPick(tileId, tileEl) {
      const st = state[index];
      if (st.graded || st.used[tileId]) return;
      const slotIdx = st.placed.findIndex(p => p === null);
      if (slotIdx === -1) return;
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
      patchResultSlotDisplay(pos);
      busy = true;
      flyTileClone(fromRect, toRect, shownChar, ORIGIN_BG, fontSize, () => {
        patchOriginRestored(tileId);
        busy = false;
        updateSubmitButtonState();
      });
    }

    function swapResultPositions(posA, posB) {
      const st = state[index];
      if (st.graded || busy) return;
      const elA = root.querySelector(`.aw-anagram-rtile[data-pos="${posA}"]`);
      const elB = root.querySelector(`.aw-anagram-rtile[data-pos="${posB}"]`);
      const charA = elA ? elA.textContent : "";
      const charB = elB ? elB.textContent : "";
      const tmp = st.placed[posA];
      st.placed[posA] = st.placed[posB];
      st.placed[posB] = tmp;
      anagramSound.pickup();
      updateSubmitButtonState();
      if (!elA || !elB) { patchResultSlotDisplay(posA); patchResultSlotDisplay(posB); return; }
      const rectA = elA.getBoundingClientRect();
      const rectB = elB.getBoundingClientRect();
      const fontSize = getComputedStyle(elA).fontSize;   // A and B are same-size tiles in the same group
      // Blank both tiles now, fly each letter to the OTHER tile's spot, then
      // commit the final text once both clones land — a real swap-in-flight
      // instead of the two tiles instantly trading text.
      elA.textContent = ""; elB.textContent = "";
      busy = true;
      let pending = (charA ? 1 : 0) + (charB ? 1 : 0);
      if (pending === 0) { busy = false; return; }   // both were empty — nothing to actually fly
      const settle = () => {
        pending--;
        if (pending > 0) return;
        patchResultSlotDisplay(posA);
        patchResultSlotDisplay(posB);
        busy = false;
        updateSubmitButtonState();
      };
      // settle() must fire EXACTLY `pending` times — only call it as a
      // flyTileClone completion, never synchronously for an empty side.
      if (charA) flyTileClone(rectA, rectB, charA, ORIGIN_BG, fontSize, settle);
      if (charB) flyTileClone(rectB, rectA, charB, ORIGIN_BG, fontSize, settle);
    }

    // Shared position-only fly (no color morph — everything pre-Submit
    // stays the neutral origin grey) used by unplace()/swapResultPositions().
    // `fontSize` MUST be passed in (read from the real tile before it's
    // touched) — this clone used to fall back to the page's inherited
    // font-size instead of the tile's actual size, which is why a swapped or
    // returned letter visibly shrank mid-flight (teacher-reported, 3/8/2026).
    function flyTileClone(fromRect, toRect, char, bg, fontSize, onDone) {
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      clone.style.background = bg;
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
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px, ${dy}px)` }
      ], { duration: FLY_DURATION, easing: "ease-in-out", fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, FLY_DURATION + 150);
    }

    // Drag (pointer events, mouse+touch alike) to swap two already-placed
    // result tiles, OR a plain tap (no real movement) to send one back to
    // the origin row — only while the word hasn't been submitted yet.
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
        tileEl.classList.add("is-dragging");
      });
      tileEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD) moved = true;
        if (moved) tileEl.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        tileEl.classList.remove("is-dragging");
        tileEl.style.transform = "";
        if (moved) {
          tileEl.style.pointerEvents = "none";
          const under = document.elementFromPoint(e.clientX, e.clientY);
          tileEl.style.pointerEvents = "";
          const targetTile = under && under.closest(".aw-anagram-rtile");
          if (targetTile && targetTile !== tileEl && targetTile.dataset.pos != null) {
            swapResultPositions(pos, Number(targetTile.dataset.pos));
          }
        } else {
          unplace(pos);
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
          slotEl.append(el("span", "aw-tile-badge", isRight ? SMALL_CHECK_GREEN : SMALL_CROSS_RED));
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
          flyScoreGain("check", 1, () => { st.points = 1; return scoreNow(); });
          anagramSound.submitWordCorrect();
        } else {
          showBigMark(false);
          ui.sound.wrong();
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
    function showWrongPickBadge(tileEl) {
      const badge = el("span", "aw-anagram-pickbadge", SMALL_CROSS_RED);
      tileEl.append(badge);
      setTimeout(() => badge.remove(), 550);
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
    // pulse-counting it in" effect — bonus PERFECT, bonus normal-correct,
    // submit all-correct all use this. `applyAndGetNewTotal` is called only
    // once the mark ARRIVES (it applies this word's points and returns the
    // fresh scoreNow() total) — so the score visibly stays unchanged until
    // that exact moment, matching "chuyển dần thành điểm... rồi nhập vào
    // số điểm tổng".
    function flyScoreGain(kind, points, applyAndGetNewTotal) {
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
      // "check" must match the big X's size exactly (both are "whole word"
      // marks) — the X is CSS width:34.7% of this SAME .aw-anagram-group
      // (see anagram.css), so mirror that fraction here in px (font-size
      // drives width/height via the 1em box on .aw-anagram-flygain).
      const baseSize = kind === "perfect"
        ? Math.max(24, startRect.width * 0.0825)   // PERFECT text — 1.5x a normal check
        : Math.max(28, startRect.width * 0.347);   // check — same size as the big X mark
      wrap.style.fontSize = baseSize + "px";

      // How far to shrink by the time it ARRIVES: the actual score badge's own
      // font-size, not a flat guess. Fixes the mark still looking oversized
      // right as it lands (teacher-reported, 3/8/2026) — before this, the end
      // keyframe was a flat scale(0.4) regardless of baseSize, which could
      // still be much bigger than the tiny score digits for a wide stage.
      const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
      const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

      const iconSpan = el("span", "afg-icon", kind === "perfect" ? "PERFECT" : icons.markCheck);
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
      fromEl.style.visibility = "hidden";
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      clone.style.background = toColor;
      document.body.append(clone);
      // See the identical comment in flyTileClone() — forces one legitimate
      // "at rest" paint before the transform animation starts, avoiding a
      // square-cornered flash during compositor-layer promotion.
      void clone.offsetWidth;
      activeFlyNodes.add(clone);
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)", background: ORIGIN_BG },
        { transform: `translate(${dx}px, ${dy}px)`, background: toColor }
      ], { duration: FLY_DURATION, easing: "ease-in-out", fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, FLY_DURATION + 150);
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
      correct -= penalty;   // reflect points-off in the ranked/summary score (no-op when the option is off)
      ui.finish({
        correct, incorrect: total - correctWords, total: finishTotal, perQuestion, review, answered,
        title: opts?.gameover ? "Game over" : undefined
      });
    }

    return function cleanup() {
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(anagramTemplate);
export default anagramTemplate;
