// =============================================================
// TEMPLATE: UNJUMBLE — Wordwall "Whiteboard" style (= "Classic" for AWord),
// English UI. Rebuild of https://wordwall.net/resource/116872783/unjumble.
//
//  • The teacher types a correct SENTENCE; the game splits it into WORDS and
//    scrambles the WORD ORDER. The player rebuilds the sentence by DRAGGING
//    words into place (real drag-and-drop with insert + reflow, like the
//    Wordwall original — pointer events so it works with mouse AND touch on
//    the TOMKO board).
//  • Words are grey handwriting "ink" (#777) sitting on ruled whiteboard
//    lines — no coloured tile boxes. A word turns GREEN when it reaches its
//    correct place, RED (only in "On submit" mode, after Submit) when wrong.
//
//  • Three MARKING modes, chosen in Options (switching restarts the act,
//    see optionsNeedRestart()):
//      "everyword" = Every word — each word is marked live as it lands in its
//                    correct slot (green); 1 point per correct word.
//      "bonus"     = Every word + bonus for perfect — same live marking, but
//                    solving the sentence WITHOUT ever leaving a moved word in
//                    a wrong slot pops "PERFECT" and doubles that sentence's
//                    points. (default)
//      "submit"    = On submit — reorder freely, then a SUBMIT button marks
//                    every position green/red in turn and reveals the correct
//                    sentence if any word is wrong; 1 point per correct word.
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
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { unjumbleSound } from "./unjumble-sound.js";
import { openUnjumbleEditor } from "./unjumble-editor.js";

// Small colored check/cross that lands on a word after marking — meaning
// carried through COLOUR (green tick = right, red cross = wrong), matching
// the Wordwall Whiteboard theme's correcttick.png / incorrectcross.png.
const SMALL_CHECK_GREEN = `<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 12.5l5 5L19.5 6.5" stroke="#1faa6b" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SMALL_CROSS_RED = `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#d8434c" stroke-width="3.6" stroke-linecap="round"/></svg>`;

const STAGGER_MS = 240;     // ms — gap between each position's reveal in "submit" mode

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
  const words = String(sentence ?? "").trim().split(/\s+/).filter(Boolean);
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
  return { words, order };
}

function sentenceText(it) { return it.words.join(" "); }
function itemSentence(it) { return it.sentence ?? it.text ?? it.word ?? ""; }

const unjumbleTemplate = {
  type: "unjumble",
  scorable: true,
  name: "Unjumble",

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .map(it => ({ clue: it.clue || "", answer: itemSentence(it) }))
      .filter(x => x.answer);
  },

  edit: openUnjumbleEditor,

  buildExtraOptions({ panel, draft, mkRadioChoice }) {
    const gMode = el("div", "aw-opt-group");
    gMode.append(el("div", "aw-opt-label", "Marking"));
    const rowMode = el("div", "aw-opt-row");
    const mode = draft.unjumbleMode === "everyword" ? "everyword"
      : draft.unjumbleMode === "submit" ? "submit" : "bonus";
    rowMode.append(
      mkRadioChoice("aw-unj-mode", "everyword", "Every word", mode === "everyword", v => draft.unjumbleMode = v),
      mkRadioChoice("aw-unj-mode", "bonus", "Every word + bonus", mode === "bonus", v => draft.unjumbleMode = v),
      mkRadioChoice("aw-unj-mode", "submit", "On submit", mode === "submit", v => draft.unjumbleMode = v)
    );
    gMode.append(rowMode);
    panel.append(gMode);

    const gAlign = el("div", "aw-opt-group");
    gAlign.append(el("div", "aw-opt-label", "Alignment"));
    const rowAlign = el("div", "aw-opt-row");
    const align = draft.align === "center" ? "center" : "left";
    rowAlign.append(
      mkRadioChoice("aw-unj-align", "left", "Left", align === "left", v => draft.align = v),
      mkRadioChoice("aw-unj-align", "center", "Centered", align === "center", v => draft.align = v)
    );
    gAlign.append(rowAlign);
    panel.append(gAlign);
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
    const mode = opt.unjumbleMode === "everyword" ? "everyword"
      : opt.unjumbleMode === "submit" ? "submit" : "bonus";
    const align = opt.align === "center" ? "center" : "left";
    const allowSkip = opt.allowSkip !== false;

    let items = [...(activity.content?.items || [])]
      .filter(it => it && String(itemSentence(it)).trim());
    if (opt.shuffleQuestions) items = shuffle(items);
    items = items.map(it => ({ clue: it.clue || "", ...prepareItem(itemSentence(it)) }));

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-unj-empty", "This unjumble has no sentences yet."));
      return () => {};
    }

    const state = items.map(() => ({
      order: null,          // set from item's scrambled order in render()
      hadMistake: false,
      graded: false,        // board locked (solved in live modes / submitted)
      correct: null,        // whole sentence correct (bool once decided)
      points: 0,
      marks: null           // submit: per-slot "correct"|"wrong" after reveal
    }));
    // seed each state's working order from the prepared item once
    state.forEach((st, i) => { st.order = [...items[i].order]; });

    let index = 0;
    let finished = false;
    let busy = false;
    let fitter = null;
    let autoTimer = null;
    let boardEl = null;
    let submitBtnEl = null;
    let revealEl = null;
    const activeFlyNodes = new Set();

    ui.onSubmit(finish);
    render();

    function doneCheck(s) { return mode === "submit" ? s.graded === true : s.correct === true; }
    function scoreNow() { return state.reduce((sum, s) => sum + (s.points || 0), 0); }

    // ---------- full render (real boundaries only) ----------
    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      submitBtnEl = null; revealEl = null;
      const it = items[index];
      const st = state[index];

      const card = el("div", "aw-unj-card");
      card.append(doodleLayer());

      if (it.clue) card.append(el("div", "aw-unj-clue", escapeHtml(it.clue)));
      else card.append(el("div", "aw-unj-clue aw-unj-clue-generic", "Put the words in the right order"));

      boardEl = el("div", "aw-unj-board" + (align === "center" ? " is-centered" : ""));
      card.append(boardEl);

      if (mode === "submit") {
        revealEl = el("div", "aw-unj-reveal");
        revealEl.textContent = st.correct === false ? sentenceText(it) : "";
        card.append(revealEl);
        submitBtnEl = el("button", "aw-unj-submit", "Submit");
        submitBtnEl.type = "button";
        submitBtnEl.onclick = doSubmit;
        card.append(submitBtnEl);
      }

      root.append(card);
      renderBoard();
      updateSubmitState();

      const clueEl = card.querySelector(".aw-unj-clue");
      const boardMarginBottom = parseFloat(getComputedStyle(boardEl).marginBottom) || 0;
      const revealMarginTop = revealEl ? parseFloat(getComputedStyle(revealEl).marginTop) || 0 : 0;
      const btnMarginTop = submitBtnEl ? parseFloat(getComputedStyle(submitBtnEl).marginTop) || 0 : 0;
      const cardPaddingBottom = parseFloat(getComputedStyle(card).paddingBottom) || 0;
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.05,
        measure: () => clueEl.offsetHeight + boardEl.offsetHeight + boardMarginBottom +
          (revealEl ? revealEl.offsetHeight + revealMarginTop : 0) +
          (submitBtnEl ? submitBtnEl.offsetHeight + btnMarginTop : 0) + cardPaddingBottom
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    // Re-draw ONLY the word tiles from the current order (avoids replaying the
    // card fade-in on every drag).
    function renderBoard() {
      const it = items[index], st = state[index];
      boardEl.innerHTML = "";
      const locked = st.graded || busy;
      st.order.forEach((wordId, slot) => {
        const tile = el("span", "aw-unj-wtile");
        tile.dataset.slot = String(slot);
        tile.dataset.word = String(wordId);
        tile.textContent = it.words[wordId];
        if (mode === "submit") {
          const m = st.marks ? st.marks[slot] : null;
          if (m === "correct") { tile.classList.add("is-correct"); tile.append(markBadge(true)); }
          else if (m === "wrong") { tile.classList.add("is-wrong"); tile.append(markBadge(false)); }
        } else if (wordId === slot) {
          tile.classList.add("is-correct");
          if (st.correct) tile.append(markBadge(true));
        }
        if (locked) tile.classList.add("is-locked");
        else attachDrag(tile);
        boardEl.append(tile);
      });
    }

    // ---------- drag to reorder (pointer events: mouse + touch) ----------
    // Insert-with-reflow: the dragged word is lifted as a floating clone, a
    // placeholder shows where it will land, and the other words part to make
    // room — dropping splices it into the placeholder's slot.
    function attachDrag(tile) {
      tile.style.touchAction = "none";
      let dragging = false, clone = null, ph = null, offX = 0, offY = 0;

      tile.addEventListener("pointerdown", e => {
        const st = state[index];
        if (busy || st.graded) return;
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
        ph = el("span", "aw-unj-ph");
        ph.style.width = r.width + "px";
        ph.style.height = r.height + "px";
        tile.style.display = "none";
        boardEl.insertBefore(ph, tile);
        try { tile.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        unjumbleSound.pickup();
      });

      tile.addEventListener("pointermove", e => {
        if (!dragging) return;
        clone.style.left = (e.clientX - offX) + "px";
        clone.style.top = (e.clientY - offY) + "px";
        positionPlaceholder(e.clientX, e.clientY, ph);
      });

      const end = e => {
        if (!dragging) return;
        dragging = false;
        try { tile.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        if (clone) { clone.remove(); activeFlyNodes.delete(clone); clone = null; }
        const newIndex = placeholderIndex(ph);
        if (ph) { ph.remove(); ph = null; }
        tile.style.display = "";
        commitReorder(Number(tile.dataset.word), newIndex);
      };
      tile.addEventListener("pointerup", end);
      tile.addEventListener("pointercancel", end);
    }

    // Move the placeholder to the gap nearest the pointer (row-aware via
    // closest tile centre; insert before it if the pointer is to its left).
    function positionPlaceholder(x, y, ph) {
      const tiles = [...boardEl.querySelectorAll(".aw-unj-wtile")].filter(t => t.style.display !== "none");
      let best = null, bestD = Infinity, before = true;
      for (const t of tiles) {
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (d < bestD) { bestD = d; best = t; before = x < cx; }
      }
      if (!best) { boardEl.append(ph); return; }
      if (before) boardEl.insertBefore(ph, best);
      else boardEl.insertBefore(ph, best.nextSibling);
    }

    // Index the placeholder would occupy in the order[] array WITHOUT the
    // dragged word (= count of visible tiles before it).
    function placeholderIndex(ph) {
      let idx = 0;
      for (const child of boardEl.children) {
        if (child === ph) break;
        if (child.classList.contains("aw-unj-wtile") && child.style.display !== "none") idx++;
      }
      return idx;
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
      if (changed) afterDrop(wordId);
      updateSubmitState();
    }

    // ---------- marking (live modes) ----------
    function afterDrop(wordId) {
      if (mode === "submit") return;
      const st = state[index], it = items[index];
      const n = it.words.length;
      let cc = 0;
      for (let i = 0; i < n; i++) if (st.order[i] === i) cc++;
      const slot = st.order.indexOf(wordId);
      const home = st.order[slot] === slot;
      if (home) unjumbleSound.correct();
      if (!home && mode === "bonus") st.hadMistake = true;
      const prev = st.points;
      st.points = cc;
      if (cc > prev) pulseScoreTo(scoreNow());
      else ui.setScore(scoreNow());
      if (cc === n) finalizeLiveWord();
    }

    function finalizeLiveWord() {
      const st = state[index], it = items[index];
      const n = it.words.length;
      const perfect = mode === "bonus" && !st.hadMistake;
      st.correct = true;
      st.graded = true;
      renderBoard();      // lock the board + stamp the green ticks
      updateNav();
      if (perfect) {
        unjumbleSound.perfect();
        flyScoreGain("perfect", n, () => { st.points = n * 2; return scoreNow(); });
      } else {
        showBigMark(true);
      }
      if (state.every(doneCheck)) {
        autoTimer = setTimeout(finish, perfect ? FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 300 : 1100);
      }
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
          t.append(markBadge(isRight));
          (isRight ? unjumbleSound.fastCorrect : unjumbleSound.fastWrong)();
        }, slot * STAGGER_MS);
      }
      setTimeout(() => {
        st.correct = allCorrect;
        st.points = cc;
        busy = false;
        updateSubmitState();
        updateNav();
        if (revealEl) revealEl.textContent = allCorrect ? "" : sentenceText(it);
        if (cc > 0) pulseScoreTo(scoreNow()); else ui.setScore(scoreNow());
        showBigMark(allCorrect);
        if (state.every(doneCheck)) autoTimer = setTimeout(finish, allCorrect ? 900 : 1600);
      }, n * STAGGER_MS + 300);
    }

    function updateSubmitState() {
      if (!submitBtnEl) return;
      const st = state[index];
      submitBtnEl.disabled = st.graded || busy;
    }

    // ---------- shared score effects (same feel as Anagram) ----------
    function showBigMark(isCorrect) {
      if (!boardEl) return;
      const fly = el("span", "aw-mark-fly" + (isCorrect ? "" : " is-cross"),
        isCorrect ? icons.markCheck : icons.markCross);
      boardEl.append(fly);
      setTimeout(() => fly.remove(), isCorrect ? 900 : 1800);
    }

    function flyScoreGain(kind, points, applyAndGetNewTotal) {
      const g = boardEl;
      const scoreEl = document.querySelector(".aw-top-score");
      if (!g || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const startRect = g.getBoundingClientRect();
      const endRect = scoreEl.getBoundingClientRect();
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;

      const wrap = el("div", "aw-unj-flygain");
      wrap.style.left = cx + "px";
      wrap.style.top = cy + "px";
      wrap.style.fontSize = Math.max(24, startRect.width * 0.06) + "px";

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

    function pulseScoreTo(newValue) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (!scoreEl) return;
      const match = /(-?\d+)/.exec(scoreEl.textContent || "");
      const oldValue = match ? parseInt(match[1], 10) : 0;
      if (oldValue === newValue) { ui.setScore(newValue); return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth;
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

    // ---------- navigation ----------
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
      const card = root.querySelector(".aw-unj-card");
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
      const totalWords = items.reduce((s, it) => s + it.words.length, 0);
      const totalPoints = state.reduce((s, st) => s + (st.points || 0), 0);
      const correctSentences = state.filter(st => st.correct === true).length;
      const perQuestion = state.map((st, i) => ({ q: i, correct: st.correct === true }));
      const review = items.map((it, i) => {
        const st = state[i];
        const started = st.order.some((id, slot) => id !== slot);
        const yourWords = st.order.map(id => it.words[id]).join(" ");
        return {
          question: it.clue || "Put the words in the right order",
          answered: doneCheck(st),
          yourText: (doneCheck(st) || started) ? yourWords : null,
          yourCorrect: st.correct === true,
          correctText: sentenceText(it)
        };
      });
      const answered = state.filter(st => doneCheck(st)).length;
      ui.finish({ correct: totalPoints, incorrect: total - correctSentences, total: totalWords, perQuestion, review, answered });
    }

    function markBadge(isCorrect) {
      return el("span", "aw-unj-badge", isCorrect ? SMALL_CHECK_GREEN : SMALL_CROSS_RED);
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

registerTemplate(unjumbleTemplate);
export default unjumbleTemplate;
