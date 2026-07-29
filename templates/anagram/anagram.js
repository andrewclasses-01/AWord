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
  name: "Anagram",

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

    let items = [...(activity.content?.items || [])].filter(it => it && String(it.word || "").trim());
    if (opt.shuffleQuestions) items = shuffle(items);
    items = items.map(it => ({ clue: it.clue || "", word: it.word, ...prepareItem(it.word) }));

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
    let busy = false;          // true while a fly/reveal animation must not be interrupted
    let fitter = null;
    let autoTimer = null;
    let submitBtnEl = null;    // current word's Submit button (submit mode) — kept for incremental updates
    let revealSlotEl = null;   // current word's answer-reveal line (submit mode) — ditto
    const activeFlyNodes = new Set();   // stray document.body clones — swept on cleanup

    ui.onSubmit(finish);
    render();

    function doneCheck(s) { return mode === "bonus" ? s.correct === true : s.graded === true; }

    function scoreNow() {
      if (mode === "bonus") return state.reduce((sum, s) => sum + (s.points || 0), 0);
      return state.filter(s => s.correct === true).length;
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
        const locked = used || busy || wordDone;
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
      if (busy || finished) return;
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
      st.used[tileId] = true;
      busy = true;
      setOriginLocked(true);
      const destPos = st.nextPos;
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${destPos}"]`);
      const shownChar = displayChar(picked, allCaps);
      flyLetter(tileEl, destEl, shownChar, RESULT_BG, () => {
        st.placed[destPos] = tileId;
        st.nextPos++;
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, "is-blue");
        busy = false;
        if (st.nextPos === it.letters.length) finalizeBonusWord();
        else setOriginLocked(false);
      });
    }

    function finalizeBonusWord() {
      const st = state[index];
      const it = items[index];
      const n = it.letters.length;
      const perfect = !st.hadMistake;
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
      if (state.every(doneCheck)) autoTimer = setTimeout(finish, FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250);
    }

    // ----- interaction: submit mode -----
    function submitPick(tileId, tileEl) {
      const st = state[index];
      if (st.graded || st.used[tileId]) return;
      const slotIdx = st.placed.findIndex(p => p === null);
      if (slotIdx === -1) return;
      const it = items[index];
      anagramSound.place();   // same "drop" as bonus mode's correct pick — both modes tap the origin row alike
      busy = true;
      setOriginLocked(true);
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${slotIdx}"]`);
      const shownChar = displayChar(it.letters[tileId], allCaps);
      // stays ORIGIN-colored during the flight (only Submit reveals right/wrong colors)
      flyLetter(tileEl, destEl, shownChar, ORIGIN_BG, () => {
        st.used[tileId] = true;
        st.placed[slotIdx] = tileId;
        busy = false;
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, null);
        updateSubmitButtonState();
        setOriginLocked(false);
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
      patchResultSlotDisplay(pos);
      busy = true;
      flyTileClone(fromRect, toRect, shownChar, ORIGIN_BG, () => {
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
      if (charA) flyTileClone(rectA, rectB, charA, ORIGIN_BG, settle);
      if (charB) flyTileClone(rectB, rectA, charB, ORIGIN_BG, settle);
    }

    // Shared position-only fly (no color morph — everything pre-Submit
    // stays the neutral origin grey) used by unplace()/swapResultPositions().
    function flyTileClone(fromRect, toRect, char, bg, onDone) {
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.background = bg;
      document.body.append(clone);
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
        if (state.every(doneCheck)) {
          autoTimer = setTimeout(finish, allCorrect ? FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250 : 1500);
        }
      }, n * STAGGER_MS + 300);
    }

    // ----- incremental DOM patches (avoid a full render() mid-word — that
    // used to flash the whole clue+both rows on every single tap) -----
    function setOriginLocked(locked) {
      root.querySelectorAll(".aw-anagram-otile:not(.is-used)").forEach(t => { t.disabled = locked; });
    }
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

    function finish() {
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
          correctText: it.word
        };
      });
      const answered = state.filter(s => doneCheck(s)).length;
      ui.finish({ correct, incorrect: total - correctWords, total: finishTotal, perQuestion, review, answered });
    }

    return function cleanup() {
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(anagramTemplate);
export default anagramTemplate;
