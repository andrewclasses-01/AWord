// =============================================================
// TEMPLATE: OPEN THE BOX — Wordwall style, English UI.
//  • Two content modes, each with its OWN interaction model:
//      - "simple": tap a box -> it flips and reveals a prompt. Open-ended,
//        no score, no timer, no ending. NEVER calls ui.finish().
//      - "questions": tap a box (Ô SỐ) -> it zooms into a full Quiz-style
//        question+answers screen (Ô CÂU HỎI), with a SHARED countdown
//        ("Question time" in Options) that only ticks while a question is
//        on screen. Correct -> Ô SỐ locks open (permanently solved) + timer
//        resets to full. Wrong -> Ô SỐ locks closed, greyed out with a
//        padlock (can't retry until another Ô SỐ is answered correctly) +
//        timer keeps draining from where it was. Ends when EITHER the timer
//        hits 0 (shake + explode the grid, title "Game over") OR every box
//        is solved (title "Game complete") — both call `ui.finish()`, which
//        gives Open the box the SAME ending flow as Quiz/Anagram for free:
//        Leaderboard / Show answers / Start again / Play a different
//        template, Score + Time. `core/engine.js` got ONE small addition to
//        support this: `ui.finish({..., title})` — an optional title
//        ("Game over" here) that overrides the panel's default
//        "Game complete" text; every other template that doesn't pass it
//        is 100% unaffected.
//  • options.boxesAutoClose only applies to "simple" mode.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el, formatTime } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { otbSound } from "./otb-sound.js";

// Zoom animation timing (Ô SỐ <-> Ô CÂU HỎI) — both directions share the
// same speed, per the teacher ("chậm hơn nữa" / "chậm và mượt" for both).
const ZOOM_TRANSFORM_MS = 600;
const ZOOM_OPACITY_MS = 420;
const ZOOM_FALLBACK_MS = ZOOM_TRANSFORM_MS + 80;

// A plain GREEN check (Questions-mode "solved" badge) and a grey padlock
// (Questions-mode "locked" badge) — NOT core/icons.js's markCheck/markCross,
// which are hard-coded white-on-dark-outline (made for flying up over a
// COLOURED tile), so their CSS `color` can't be recoloured. These two sit on
// a plain white/grey card background instead, so a simple currentColor
// stroke/fill works and CAN be recoloured from CSS.
const ICON_CHECK_GREEN = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M4.5 12.5l5 5L19.5 6.5" stroke="currentColor" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none">
  <rect x="5" y="11" width="14" height="9.5" rx="2" fill="currentColor"/>
  <path d="M7.7 11V7.8a4.3 4.3 0 0 1 8.6 0V11" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>
</svg>`;

// Same 8-colour palette as quiz.js's answer-tile PALETTE (filled tile + a
// darker bottom-shadow "lip" — matches the Quiz answer tiles look, per the
// teacher's reference photo). Cycles by COLUMN index for the box grid, and
// by ANSWER position for the Questions-mode answer tiles (same as Quiz).
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

// Find the column/row split that lets N equal SQUARE boxes fill a
// w x h area as large as possible (plain CSS grid can't solve this 2D
// packing on its own since column width and row height are independent).
function bestFit(w, h, gap, n) {
  let cols = 1, size = 0;
  for (let c = 1; c <= n; c++) {
    const rows = Math.ceil(n / c);
    const cellW = (w - gap * (c - 1)) / c;
    const cellH = (h - gap * (rows - 1)) / rows;
    const s = Math.min(cellW, cellH);
    if (s > size) { size = s; cols = c; }
  }
  return { cols, size: Math.max(size, 0) };
}

// Shared by both modes: size + colour the box grid. `explicitCols` comes
// from options.columns (teacher override); null lets bestFit() decide.
function layoutGrid(root, total, explicitCols) {
  const grid = root.querySelector(".aw-otb-grid");
  if (!grid) return;
  const w = grid.clientWidth, h = grid.clientHeight;
  if (w <= 0 || h <= 0) return;
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
  const cols = explicitCols || bestFit(w, h, gap, total).cols;
  const rows = Math.ceil(total / cols);
  const size = Math.max(0, Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows));
  grid.style.setProperty("--cols", cols);
  grid.style.setProperty("--cell", size + "px");
  // Number size tracks the ACTUAL box size (not the stage width like a plain
  // cqw value would) so it stays as large as possible while still fitting a
  // 2-digit number, whether there are 4 boxes or 50.
  grid.style.setProperty("--num-size", (size * 0.46) + "px");
  grid.querySelectorAll(".aw-otb-box").forEach((box, i) => {
    const p = PALETTE[(i % cols) % PALETTE.length];
    box.style.setProperty("--otb-c", p.c);
    box.style.setProperty("--otb-d", p.d);
  });
}

const otbTemplate = {
  type: "open_the_box",
  // Simple mode is still open-ended/unscored; Questions mode now IS scored
  // and calls ui.finish(). Nothing in the app currently reads this flag
  // (grep confirms no consumer), so leaving it false is inert either way —
  // kept false since it's still accurate for the template's default mode.
  scorable: false,
  name: "Open the box",

  // Sound effects "similar to Anagram" (teacher's request) for Questions
  // mode's round-end/restart moments — reuses real mp3s copied from
  // templates/anagram/sounds (own copy, not cross-imported — see otb-sound.js).
  // Undefined for "play"/"timeWarning" -> engine's default sounds still play.
  sounds: {
    restart: otbSound.restart,
    complete: otbSound.allSolved
  },

  toPrintItems(activity) {
    const c = activity.content || {};
    if (c.mode === "questions") {
      return (c.items || [])
        .filter(it => it && it.question)
        .map(it => ({
          clue: it.question,
          answer: (it.answers || []).find(a => a.correct)?.text || (it.answers || [])[0]?.text || ""
        }));
    }
    return (c.items || [])
      .filter(it => it && it.text)
      .map(it => ({ clue: "", answer: it.text }));
  },

  // "Question time" — only meaningful in Questions mode, harmless to show
  // otherwise (same convention as other templates ignoring unrelated
  // options, e.g. Anagram ignoring lettersOnAnswers — see CONG THUC MAU §5).
  buildExtraOptions({ panel, draft }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Question time (Questions mode only)"));
    const row = el("div", "aw-opt-row");
    const secs = el("span", "aw-opt-time");
    const stepper = makeNumberStepper(
      typeof draft.questionTimeSeconds === "number" ? draft.questionTimeSeconds : 15,
      3, 59,
      v => draft.questionTimeSeconds = v
    );
    secs.append(stepper.el, document.createTextNode("s"));
    row.append(secs);
    g.append(row);
    panel.append(g);
  },

  mount(root, activity, ui) {
    const mode = activity.content?.mode === "questions" ? "questions" : "simple";
    return mode === "questions" ? mountQuestions(root, activity, ui) : mountSimple(root, activity, ui);
  }
};

// =============================================================
// SIMPLE MODE — tap a box, it flips and shows a prompt. No score, no end.
// =============================================================
function mountSimple(root, activity, ui) {
  const opt = activity.options || {};
  let items = [...(activity.content?.items || [])].filter(it => it && it.text);
  if (opt.shuffleQuestions) items = shuffle(items);

  const total = items.length;
  if (total === 0) {
    root.innerHTML = "";
    root.append(el("div", "aw-otb-empty", "This activity has no boxes yet."));
    return () => {};
  }

  const explicitCols = typeof opt.columns === "number" && opt.columns > 0 ? opt.columns : null;
  const openNow = items.map(() => false);   // currently flipped open
  const everOpened = new Set();

  render();
  const ro = new ResizeObserver(() => layoutGrid(root, total, explicitCols));
  ro.observe(root);

  function render() {
    root.innerHTML = "";
    const card = el("div", "aw-otb-card");
    const grid = el("div", "aw-otb-grid");

    items.forEach((it, i) => {
      const box = el("button", "aw-otb-box" + (openNow[i] ? " is-open" : ""));
      box.type = "button";
      const inner = el("div", "aw-otb-box-inner");
      const front = el("div", "aw-otb-face aw-otb-face-front", String(i + 1));
      const back = el("div", "aw-otb-face aw-otb-face-back", "");
      back.append(el("div", "", escapeHtml(it.text)));
      inner.append(front, back);
      box.append(inner);
      box.onclick = () => toggle(i);
      grid.append(box);
    });

    card.append(grid);
    root.append(card);
    layoutGrid(root, total, explicitCols);
    updateProgress();
  }

  function toggle(i) {
    if (opt.boxesAutoClose) {
      openNow.forEach((v, k) => { if (k !== i) openNow[k] = false; });
    }
    openNow[i] = !openNow[i];
    if (openNow[i]) everOpened.add(i);
    const box = root.querySelectorAll(".aw-otb-box")[i];
    if (opt.boxesAutoClose) {
      render(); // other boxes may have just closed too -> simplest correct redraw
    } else if (box) {
      box.classList.toggle("is-open", openNow[i]);
      updateProgress();
    }
  }

  function updateProgress() {
    ui.setScore(everOpened.size);
    ui.setNav({ index: everOpened.size, total, onPrev: null, onNext: null });
  }

  return function cleanup() { ro.disconnect(); };
}

// =============================================================
// QUESTIONS MODE — tap a box -> Quiz-style answer screen + shared
// countdown. See file header for the full rule set (from the teacher).
// =============================================================
function mountQuestions(root, activity, ui) {
  const opt = activity.options || {};
  let items = [...(activity.content?.items || [])]
    .filter(it => it && it.question && Array.isArray(it.answers) && it.answers.length > 0);
  if (opt.shuffleQuestions) items = shuffle(items);
  items = items.map(it => ({
    question: it.question,
    answers: (opt.shuffleAnswers ? shuffle(it.answers) : [...it.answers]).filter(a => a && a.text != null)
  }));

  const total = items.length;
  if (total === 0) {
    root.innerHTML = "";
    root.append(el("div", "aw-otb-empty", "This activity has no boxes yet."));
    return () => {};
  }

  const explicitCols = typeof opt.columns === "number" && opt.columns > 0 ? opt.columns : null;
  const questionSeconds = typeof opt.questionTimeSeconds === "number" && opt.questionTimeSeconds > 0
    ? opt.questionTimeSeconds : 15;

  const boxState = items.map(() => "unplayed");   // "unplayed" | "correct" | "locked"
  const lastWrongText = items.map(() => null);    // last wrong answer text picked (for the Show answers review)
  let score = 0;
  let timeLeft = questionSeconds;    // carries over across boxes; resets only on a correct answer
  let activeIndex = null;            // box index currently showing its question, else null
  let ended = false;                 // game over OR every box solved
  let fitter = null;
  let questionTimeout = null, clockInterval = null, questionStart = 0, questionDuration = 0;
  let lastBoxRect = null;    // rect of the tapped box, for the open/close zoom animation

  render();
  const ro = new ResizeObserver(() => { if (activeIndex === null) layoutGrid(root, total, explicitCols); });
  ro.observe(root);

  function render() {
    if (fitter) { fitter.destroy(); fitter = null; }
    root.innerHTML = "";
    if (activeIndex === null) renderGrid(); else renderQuestion(activeIndex);
  }

  function renderGrid() {
    const card = el("div", "aw-otb-card");
    const grid = el("div", "aw-otb-grid");

    items.forEach((it, i) => {
      const solved = boxState[i] === "correct";
      const locked = boxState[i] === "locked";
      const box = el("button", "aw-otb-box" + ((solved || locked) ? " is-open" : "") + (locked ? " is-locked" : ""));
      box.type = "button";
      box.disabled = boxState[i] !== "unplayed" || ended;
      const inner = el("div", "aw-otb-box-inner");
      const front = el("div", "aw-otb-face aw-otb-face-front", String(i + 1));
      const back = el("div", "aw-otb-face aw-otb-face-back", "");
      if (solved) {
        back.append(el("div", "aw-otb-back-q", escapeHtml(it.question)));
        const correctAns = it.answers.find(a => a.correct);
        if (correctAns) back.append(el("div", "aw-otb-back-a is-correct", "&#10003; " + escapeHtml(correctAns.text)));
        back.append(el("span", "aw-otb-solved-tick", ICON_CHECK_GREEN));
      } else if (locked) {
        // wrong pick: shows the question in grey ("black and white") + a
        // padlock badge in the SAME spot the green tick uses on a solved box
        back.append(el("div", "aw-otb-back-q", escapeHtml(it.question)));
        back.append(el("span", "aw-otb-solved-tick aw-otb-lock-tick", ICON_LOCK));
      }
      inner.append(front, back);
      box.append(inner);
      if (boxState[i] === "unplayed" && !ended) box.onclick = () => openBox(i);
      grid.append(box);
    });

    card.append(grid);
    root.append(card);
    layoutGrid(root, total, explicitCols);
    updateProgress();
  }

  function openBox(i) {
    if (ended || boxState[i] !== "unplayed") return;
    const boxEl = root.querySelectorAll(".aw-otb-box")[i];
    if (boxEl) lastBoxRect = relRect(boxEl, root);
    otbSound.openBox();
    activeIndex = i;
    render();
  }

  // Shared by answer() (after picking) and gameOver() (on timeout): zoom the
  // Ô CÂU HỎI back down to where its Ô SỐ was, THEN run `afterFn` (which
  // renders the grid again) — so returning to the grid is always animated,
  // not just on timeout.
  function closeCardThen(afterFn) {
    const qcard = root.querySelector(".aw-otb-qcard");
    if (qcard && lastBoxRect) zoomCardTo(qcard, lastBoxRect, afterFn);
    else afterFn();
  }

  function relRect(node, container) {
    const a = node.getBoundingClientRect(), b = container.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }

  // Layout: clock + draining bar across the TOP, then a LEFT/RIGHT split
  // below — question as its own big tile on the left, answers in a 2-column
  // grid on the right (matches the teacher's Wordwall reference photo,
  // which is NOT the same stacked question-on-top layout Quiz itself uses).
  function renderQuestion(i) {
    const it = items[i];
    const card = el("div", "aw-otb-qcard");

    const topbar = el("div", "aw-otb-q-topbar");
    const clock = el("div", "aw-otb-q-clock", formatTime(Math.ceil(timeLeft)));
    const bar = el("div", "aw-otb-timerbar");
    const fill = el("div", "aw-otb-timerbar-fill");
    bar.append(fill);
    topbar.append(clock, bar);
    card.append(topbar);

    const body = el("div", "aw-otb-q-body");
    const qTile = el("div", "aw-otb-q-question", escapeHtml(it.question));
    body.append(qTile);

    const row = el("div", "aw-otb-q-answers");
    const showLetters = opt.lettersOnAnswers === "abc";
    it.answers.forEach((ans, k) => {
      const tile = el("button", "aw-otb-qtile");
      tile.type = "button";
      tile.style.animationDelay = (k * 55) + "ms";   // staggered "pop in" entrance
      const col = PALETTE[k % PALETTE.length];
      tile.style.setProperty("--otb-c", col.c);
      tile.style.setProperty("--otb-d", col.d);
      if (showLetters) tile.append(el("span", "aw-otb-q-letter", String.fromCharCode(65 + k)));
      tile.append(el("span", "aw-otb-q-text", escapeHtml(ans.text)));
      tile.onclick = () => answer(i, k, tile, row);
      row.append(tile);
    });
    if (it.answers.length % 2 === 1) row.lastElementChild.classList.add("aw-otb-qtile-wide");
    body.append(row);
    card.append(body);
    root.append(card);

    // slack only needs to cover the card's own bottom padding + the answer
    // tiles' shadow "lip" now (topbar/margins are already counted inside
    // measure() itself) — 0.045 was sized for the OLD, taller top padding;
    // left that big after the "raise the bar" pass, it exceeded the actual
    // leftover space and made autoFit think even a short question overflowed
    // (found by reading getComputedStyle(card,'--fit') directly: it was
    // always 0.4, the minimum, regardless of text length).
    fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
      slack: root.clientWidth * 0.02,
      measure: () => topbar.offsetHeight + Math.max(qTile.scrollHeight, row.scrollHeight)
    });

    // Zoom the whole card in FROM the tapped box's exact on-screen position
    // (captured in openBox()) so it visually "grows" out of that box, rather
    // than just popping into existence. Safe to animate `transform` here:
    // .aw-otb-qcard isn't itself positioned via transform (see rule 12/CONG
    // THUC MAU §3.5) — this is a one-off entrance effect, not static layout.
    if (lastBoxRect) zoomCardFrom(card, lastBoxRect);

    startTimer(fill, clock);
  }

  // The countdown bar is a single CSS transition (smooth, no rAF loop needed).
  // Its END is detected with setTimeout (NOT transitionend/onfinish) so a
  // backgrounded tab still ends the question correctly — same defensive
  // pattern CONG THUC MAU already uses for element.animate() elsewhere. The
  // digit clock is cosmetic only (a setInterval just re-renders its text);
  // the setTimeout above is what actually decides when time is up.
  function startTimer(fillEl, clockEl) {
    questionStart = performance.now();
    questionDuration = Math.max(timeLeft, 0.05);
    fillEl.style.transition = "none";
    fillEl.style.width = "100%";
    void fillEl.offsetWidth; // force reflow so the transition below actually animates
    fillEl.style.transition = `width ${questionDuration}s linear`;
    fillEl.style.width = "0%";
    clockInterval = setInterval(() => {
      const remaining = Math.max(0, questionDuration - (performance.now() - questionStart) / 1000);
      clockEl.textContent = formatTime(Math.ceil(remaining));
      if (remaining <= 0) { clearInterval(clockInterval); clockInterval = null; }
    }, 250);
    questionTimeout = setTimeout(() => { questionTimeout = null; gameOver(); }, questionDuration * 1000);
  }

  function stopTimer(remainingSec) {
    if (questionTimeout) { clearTimeout(questionTimeout); questionTimeout = null; }
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
    timeLeft = Math.max(0, remainingSec);
  }

  function answer(i, k, tile, row) {
    if (activeIndex !== i || ended) return;
    const it = items[i];
    const correct = !!it.answers[k].correct;
    const elapsedSec = (performance.now() - questionStart) / 1000;
    const remainingSec = Math.max(0, questionDuration - elapsedSec);

    [...row.children].forEach(t => t.disabled = true);
    const fly = el("span", "aw-mark-fly" + (correct ? "" : " is-cross"), correct ? icons.markCheck : icons.markCross);
    tile.append(fly);
    setTimeout(() => fly.remove(), correct ? 900 : 1400);
    if (!correct) tile.classList.add("is-dimmed");
    tile.append(el("span", "aw-tile-badge", correct ? icons.markCheck : icons.markCross));

    if (correct) { otbSound.correct(); score++; } else { otbSound.wrong(); }
    stopTimer(correct ? questionSeconds : remainingSec);

    if (correct) {
      boxState[i] = "correct";
      // a correct answer frees up any boxes that were locked from a previous wrong pick
      boxState.forEach((s, idx) => { if (s === "locked") boxState[idx] = "unplayed"; });
    } else {
      boxState[i] = "locked";
      lastWrongText[i] = it.answers[k].text;
    }
    updateProgress();

    setTimeout(() => {
      if (timeLeft <= 0) { gameOver(); return; }
      closeCardThen(() => {
        activeIndex = null;
        render();
        if (boxState.every(s => s === "correct")) { ended = true; otbSound.allSolved(); finishRound("Game complete"); }
      });
    }, correct ? 900 : 1400);
  }

  function updateProgress() {
    ui.setScore(score);
    ui.setNav({ index: score, total, onPrev: null, onNext: null });
  }

  // Card-shrink transform, same math as zoomCardFrom but reversed (current
  // size/position -> the target box's rect), used when time runs out so the
  // question screen visibly "returns" to the grid before it shakes.
  function zoomCardTo(card, targetRect, onDone) {
    const cardRect = card.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const scaleX = targetRect.w / cardRect.width, scaleY = targetRect.h / cardRect.height;
    const dx = (rootRect.left + targetRect.x + targetRect.w / 2) - (cardRect.left + cardRect.width / 2);
    const dy = (rootRect.top + targetRect.y + targetRect.h / 2) - (cardRect.top + cardRect.height / 2);
    card.style.transformOrigin = "center center";
    // explicit starting point + a forced reflow BEFORE enabling the
    // transition, same as zoomCardFrom — without this the browser can
    // collapse the "no transition yet" and "new value" style writes into
    // one recalculation and just jump straight to the end state instead
    // of animating (this is what was happening before this fix).
    card.style.transition = "none";
    card.style.transform = "translate(0px, 0px) scale(1, 1)";
    card.style.opacity = "1";
    void card.offsetWidth;
    card.style.transition = `transform ${ZOOM_TRANSFORM_MS}ms cubic-bezier(.4,0,.2,1), opacity ${ZOOM_OPACITY_MS}ms ease`;
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    card.style.opacity = "0.15";
    let done = false;
    const run = () => { if (done) return; done = true; onDone(); };
    card.addEventListener("transitionend", run, { once: true });
    setTimeout(run, ZOOM_FALLBACK_MS);
  }

  function zoomCardFrom(card, originRect) {
    const cardRect = card.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const scaleX = originRect.w / cardRect.width, scaleY = originRect.h / cardRect.height;
    const dx = (rootRect.left + originRect.x + originRect.w / 2) - (cardRect.left + cardRect.width / 2);
    const dy = (rootRect.top + originRect.y + originRect.h / 2) - (cardRect.top + cardRect.height / 2);
    card.style.transformOrigin = "center center";
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    card.style.opacity = "0.5";
    void card.offsetWidth; // force reflow so the browser commits the shrunk starting state first
    card.style.transition = `transform ${ZOOM_TRANSFORM_MS}ms cubic-bezier(.22,.9,.3,1), opacity ${ZOOM_OPACITY_MS}ms ease`;
    card.style.transform = "translate(0px, 0px) scale(1, 1)";
    card.style.opacity = "1";
    let done = false;
    const clear = () => { if (done) return; done = true; card.style.transition = ""; card.style.transform = ""; };
    card.addEventListener("transitionend", clear, { once: true });
    setTimeout(clear, ZOOM_FALLBACK_MS);
  }

  function gameOver() {
    if (ended) return;
    ended = true;
    if (questionTimeout) { clearTimeout(questionTimeout); questionTimeout = null; }
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
    otbSound.timeout();
    closeCardThen(finishGameOver);
  }

  function finishGameOver() {
    activeIndex = null;
    render(); // back to the grid, showing final box states
    const boxes = [...root.querySelectorAll(".aw-otb-box")];
    boxes.forEach(b => { b.disabled = true; b.classList.add("aw-otb-shake"); });
    setTimeout(() => {
      boxes.forEach((b, idx) => {
        b.style.setProperty("--otb-explode-delay", (idx % 9) * 30 + "ms");
        b.classList.remove("aw-otb-shake");
        b.classList.add("aw-otb-explode");
      });
      setTimeout(() => finishRound("Game over"), 650);
    }, 500);
  }

  // Hands off to engine.js's OWN ending flow — same Score/Time/rank +
  // Leaderboard/Show answers/Start again/Play a different template as
  // Quiz/Anagram get from ui.finish(). `title` is the one bit Open the box
  // needed core/engine.js to support (see file header).
  function finishRound(title) {
    const perQuestion = items.map((it, i) => ({ q: i, correct: boxState[i] === "correct" }));
    const review = items.map((it, i) => {
      const correctText = (it.answers.find(a => a.correct) || {}).text || "";
      if (boxState[i] === "correct") {
        return { question: it.question, answered: true, yourText: correctText, yourCorrect: true, correctText };
      }
      if (boxState[i] === "locked") {
        return { question: it.question, answered: true, yourText: lastWrongText[i], yourCorrect: false, correctText };
      }
      // "unplayed" at the end (never attempted, or was wrong earlier but a
      // later correct answer elsewhere freed it back up) — reported as not
      // answered; this game allows retries so it doesn't map perfectly onto
      // Quiz's single-attempt review, this is the closest honest reading.
      return { question: it.question, answered: false, yourText: null, yourCorrect: false, correctText };
    });
    const correctCount = boxState.filter(s => s === "correct").length;
    const answeredCount = boxState.filter(s => s !== "unplayed").length;
    ui.finish({ correct: correctCount, incorrect: total - correctCount, total, perQuestion, review, answered: answeredCount, title });
  }

  return function cleanup() {
    ro.disconnect();
    if (fitter) fitter.destroy();
    if (questionTimeout) clearTimeout(questionTimeout);
    if (clockInterval) clearInterval(clockInterval);
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(otbTemplate);
export default otbTemplate;
