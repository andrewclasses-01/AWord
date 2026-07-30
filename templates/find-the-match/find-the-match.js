// =============================================================
// TEMPLATE: FIND THE MATCH — Wordwall style, English UI.
//  • Grid: ALWAYS laid out in 5 fixed ROWS (columns = ceil(total/5)),
//    centred on screen. Each keyword tile gets an EXPLICIT grid-row/
//    grid-column assigned once at mount — removing a solved tile leaves a
//    hole, the other tiles never reflow (teacher's explicit spec, 31/7/2026).
//  • Prompt ("conveyor belt"): the DEFINITION slides in from the left edge
//    of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — the whole journey is ONE
//    continuous slow glide, not a quick fade. Speed 0 = arrives at centre
//    and just waits there (no drift) until answered. ANY tap — correct OR
//    wrong — makes the current prompt continue on to the right edge from
//    wherever it currently is (a glide, not a snap); the next prompt only
//    starts entering once the current one is FULLY off-screen (31/7/2026,
//    2nd round: a wrong tap now dismisses the prompt too, changed from the
//    1st round's "wrong tap doesn't touch it" guess).
//  • A pair that wasn't matched (wrong tap OR the glide reached the right
//    edge unanswered) follows `options.repeatUntilCorrect`: false = marked
//    skipped, tile removed; true = re-queued at a RANDOM position (not
//    just appended to the back) so it comes back later, order unpredictable.
//  • `options.removeCorrects`: whether a correct tile disappears or stays
//    locked with a small permanent checkmark.
//  • Timer/sound choreography (31/7/2026): Count-up mode gets a 3-2-1
//    prep countdown (big numbers in the question area + a "ting" per
//    second) BEFORE the first prompt ever appears — the engine's own
//    visible clock unavoidably keeps running through this (no core hook
//    exists to pause it yet; flagged in GHI CHU as a proposed core add,
//    so the recorded time ends up ~3s higher than "real" play time).
//    Count-down mode ticks once/sec from 10s remaining, doubling to twice/
//    sec from 5s remaining — computed from this template's OWN clock
//    (independent of the engine's private timer internals).
//  • Sounds: real Wordwall "Find the match" effects via ftm-sound.js — see
//    that file + GHI CHU FIND-THE-MATCH.md for the full mapping.
//  • Score = number of pairs matched by the end. ui.finish()/review follow
//    the same shape as every other template.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { openFtmEditor } from "./find-the-match-editor.js";
import { ftmSound } from "./ftm-sound.js";

// Same 8-colour palette as quiz.js's/open-the-box.js's answer-tile PALETTE.
// Colour is assigned once per pair (by its fixed slot) and stays stable.
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

const ROWS = 5;
const ENTER_MS = 900;   // left edge -> centre, always this pace regardless of Speed
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once a tile is tapped

// Speed 0-10 -> how long the CENTRE-to-right-edge drift takes. 0 = no
// drift at all (frozen at centre, "wait for answer"). Chosen for feel —
// not measured against real Wordwall timing, revisit if the teacher wants
// a different pace after trying it on TOMKO.
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5000 - t * (5000 - 900));
}

const ftmTemplate = {
  type: "find_the_match",
  scorable: true,
  name: "Find the match",

  toPrintItems(activity) {
    return (activity.content?.pairs || [])
      .filter(p => p && p.keyword && p.definition)
      .map(p => ({ clue: p.definition, answer: p.keyword }));
  },

  edit: openFtmEditor,

  sounds: {
    play: ftmSound.intro,
    restart: ftmSound.restart,
    complete: () => {}   // silenced: find-the-match.js picks ONE of Completed/GameOver/TimesUp itself
  },

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  buildExtraOptions({ panel, draft, mkCheck, mkRadioChoice }) {
    // SPEED — a real slider (teacher's explicit request), not a dropdown.
    const gSpeed = el("div", "aw-opt-group");
    gSpeed.append(el("div", "aw-opt-label", "Speed"));
    const rowSpeed = el("div", "aw-opt-row aw-ftm-speedrow");
    const initSpeed = Number.isInteger(draft.speed) ? draft.speed : 0;
    const speedVal = el("span", "aw-ftm-speedval", initSpeed === 0 ? "0 — wait for answer" : String(initSpeed));
    const speedInput = el("input", "aw-ftm-speedslider");
    speedInput.type = "range"; speedInput.min = "0"; speedInput.max = "10"; speedInput.step = "1";
    speedInput.value = String(initSpeed);
    speedInput.oninput = () => {
      const v = parseInt(speedInput.value, 10);
      draft.speed = v;
      speedVal.textContent = v === 0 ? "0 — wait for answer" : String(v);
    };
    rowSpeed.append(speedInput, speedVal);
    gSpeed.append(rowSpeed);
    panel.append(gSpeed);

    // What happens to a pair that wasn't matched in time (only matters
    // when Speed > 0, or when it was tapped wrong).
    const gRepeat = el("div", "aw-opt-group");
    gRepeat.append(el("div", "aw-opt-label", "Unanswered questions"));
    const rowRepeat = el("div", "aw-opt-row");
    const repeatOn = draft.repeatUntilCorrect === true;
    rowRepeat.append(
      mkRadioChoice("aw-ftm-repeat", "once", "Show each question once", !repeatOn, () => { draft.repeatUntilCorrect = false; }),
      mkRadioChoice("aw-ftm-repeat", "repeat", "Repeat questions until correct", repeatOn, () => { draft.repeatUntilCorrect = true; })
    );
    gRepeat.append(rowRepeat);
    panel.append(gRepeat);

    // Whether a correctly-matched tile disappears or stays (locked).
    const gRemove = el("div", "aw-opt-group");
    gRemove.append(el("div", "aw-opt-label", "Answers"));
    const rowRemove = el("div", "aw-opt-row");
    rowRemove.append(mkCheck(draft.removeCorrects !== false, "Remove corrects", v => { draft.removeCorrects = v; }));
    gRemove.append(rowRemove);
    panel.append(gRemove);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const removeCorrects = opt.removeCorrects !== false;
    const repeatUntilCorrect = opt.repeatUntilCorrect === true;
    const speed = Number.isInteger(opt.speed) ? Math.max(0, Math.min(10, opt.speed)) : 0;
    const crawlMs = crawlMsFor(speed);
    const timerMode = opt.timer ?? "countUp";
    const timerTotal = opt.timerTotalSeconds ?? 120;

    const pairs = [...(activity.content?.pairs || [])].filter(p => p && p.keyword && p.definition);
    const total = pairs.length;
    if (total < 2) {
      root.innerHTML = "";
      root.append(el("div", "aw-ftm-empty", "This activity needs at least 2 pairs."));
      return () => {};
    }

    // `order` = the fixed sequence used for scoring/review (never mutated).
    // `queue` = the LIVE working sequence — front = current prompt.
    let order = pairs.map((_, i) => i);
    if (opt.shuffleQuestions) order = shuffle(order);
    const queue = [...order];
    const choiceOrder = shuffle(pairs.map((_, i) => i));

    // Fixed 5-row layout, computed ONCE from `total` so a tile's cell never
    // changes even as siblings around it get removed (teacher's spec).
    const cols = Math.max(1, Math.ceil(total / ROWS));
    const colW = Math.min(15, 90 / cols);
    const slot = {};      // pairIdx -> {row, col} (1-based, CSS grid-line numbers)
    const tileColor = {};
    choiceOrder.forEach((idx, i) => {
      slot[idx] = { row: Math.floor(i / cols) + 1, col: (i % cols) + 1 };
      tileColor[idx] = PALETTE[i % PALETTE.length];
    });

    const state = pairs.map(() => ({ solved: false, skipped: false }));
    let finished = false;
    let livesLeft = typeof opt.lives === "number" ? opt.lives : null;
    let fitter = null;
    let promptAnim = null;    // the currently-running Animation on .aw-ftm-prompt (enter or crawl)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running (rule: .animate() needs one)
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingRemovals = [];

    ui.onSubmit(() => finish("timesup"));
    window.addEventListener("keydown", onKey);
    renderShell();

    if (timerMode === "countUp") {
      runPrepCountdown();
    } else {
      if (timerMode !== "none") ftmSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    function scoreNow() { return state.filter(s => s.solved).length; }

    function armFallback(fn, ms) {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(fn, ms);
    }

    // Count-up mode only: 3 big numbers (one per second) in the question
    // area + a "ting" each second, THEN the real first prompt starts. The
    // engine's own visible clock/recorded time has no hook to pause during
    // this — see the header comment + GHI CHU for the proposed core add.
    function runPrepCountdown() {
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) { ftmSound.go(); startCycle(); return; }
      promptEl.classList.add("is-countdown");
      let n = 3;
      const tick = () => {
        if (finished) return;
        promptEl.textContent = String(n);
        ftmSound.clockTick();
        n--;
        if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
        prepTimer = setTimeout(() => {
          promptEl.classList.remove("is-countdown");
          promptEl.textContent = "";
          ftmSound.go();
          startCycle();
        }, 1000);
      };
      tick();
    }

    // Count-down mode only: schedule a "ting" once/sec while 10-6s remain,
    // then twice/sec (every 0.5s) from 5s remaining down to 0.5s. Computed
    // from THIS template's own start reference (mount() runs right as the
    // engine's own countdown begins too, for count-down mode — no prep
    // delay applies here), independent of engine.js's private timer state.
    function armCountdownTicks() {
      const at = [];
      for (let r = 10; r >= 6; r--) at.push(timerTotal - r);
      for (let r = 5; r >= 1; r -= 0.5) at.push(timerTotal - r);
      at.forEach(sec => {
        if (sec < 0) return;
        tickTimers.push(setTimeout(() => { if (!finished) ftmSound.clockTick(); }, sec * 1000));
      });
    }

    function renderShell() {
      root.innerHTML = "";
      const card = el("div", "aw-ftm-card");

      if (livesLeft != null) {
        const lives = el("div", "aw-ftm-lives");
        for (let i = 0; i < opt.lives; i++) {
          lives.append(el("span", i < livesLeft ? "" : "is-lost", "&#9829;"));
        }
        card.append(lives);
      }

      const track = el("div", "aw-ftm-track");
      track.append(el("div", "aw-ftm-prompt"));
      card.append(track);

      card.append(el("div", "aw-ftm-divider"));

      const grid = el("div", "aw-ftm-grid");
      grid.style.gridTemplateColumns = `repeat(${cols}, ${colW}cqw)`;
      grid.style.gridTemplateRows = `repeat(${ROWS}, min-content)`;
      choiceOrder.forEach(idx => {
        if (state[idx].solved || state[idx].skipped) return;
        const tile = el("button", "aw-ftm-tile", escapeHtml(pairs[idx].keyword));
        tile.dataset.idx = String(idx);
        tile.style.gridRow = String(slot[idx].row);
        tile.style.gridColumn = String(slot[idx].col);
        const col = tileColor[idx];
        tile.style.setProperty("--ftm-c", col.c);
        tile.style.setProperty("--ftm-d", col.d);
        tile.onclick = () => choose(idx, tile);
        grid.append(tile);
      });
      card.append(grid);
      root.append(card);

      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.03,
        measure: () => track.offsetHeight + grid.scrollHeight
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    function offscreenPx() { return Math.round((root.clientWidth || 1) * 1.15); }

    // Starts (or restarts) the current queue-front's journey from the LEFT
    // edge. Only called once the PREVIOUS prompt is fully gone.
    function startCycle() {
      if (finished) return;
      if (!queue.length) { armFallback(() => finish("complete"), 400); return; }
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) return;
      promptEl.textContent = escapeHtml(pairs[queue[0]].definition);
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the browser commits the start position before animating from it
      ftmSound.conveyorAppear();
      const enter = promptEl.animate(
        [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
        { duration: ENTER_MS, easing: "ease-out", fill: "forwards" }
      );
      promptAnim = enter;
      let done = false;
      const onEntered = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (finished) return;
        ftmSound.conveyorCentred();
        armCrawl();
      };
      enter.onfinish = onEntered;
      armFallback(onEntered, ENTER_MS + 100);
    }

    // After arriving at centre: if Speed > 0, keep drifting to the right
    // edge (unanswered by the time it fully exits = a timeout). Speed 0 =
    // stays frozen at centre — no crawl armed at all.
    function armCrawl() {
      if (finished || !queue.length || !crawlMs) return;
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) return;
      const off = offscreenPx();
      ftmSound.conveyorLeave();
      const crawl = promptEl.animate(
        [{ transform: "translateX(0px)" }, { transform: `translateX(${off}px)` }],
        { duration: crawlMs, easing: "linear", fill: "forwards" }
      );
      promptAnim = crawl;
      let done = false;
      const onCrawlDone = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (!finished) onTimeUp();
      };
      crawl.onfinish = onCrawlDone;
      armFallback(onCrawlDone, crawlMs + 120);
    }

    // Freezes whatever position the prompt is CURRENTLY at (mid-entrance or
    // mid-crawl) into a real inline style, so a follow-up .animate() call
    // with only a "to" keyframe continues smoothly from there (implicit
    // from-keyframe = current computed style).
    function haltPromptAnim() {
      if (promptAnim) {
        try { promptAnim.commitStyles(); } catch (e) { /* ignore */ }
        try { promptAnim.cancel(); } catch (e) { /* ignore */ }
        promptAnim = null;
      }
    }

    // Puts a pair back in the running for later — at a RANDOM spot in the
    // queue (not just appended at the back), per the teacher's spec, so a
    // missed question doesn't come back in a predictable rhythm.
    function requeueRandom(idx) {
      queue.shift();
      if (!queue.length) { queue.push(idx); return; }
      const pos = 1 + Math.floor(Math.random() * queue.length);
      queue.splice(pos, 0, idx);
    }

    // A pair that just failed this round (wrong tap OR the glide timed
    // out unanswered) — shared by onTimeUp() and choose()'s wrong branch.
    function dropOrRequeue(idx) {
      if (repeatUntilCorrect) {
        requeueRandom(idx);
      } else {
        queue.shift();
        state[idx].skipped = true;
        removeTile(root.querySelector(`.aw-ftm-tile[data-idx="${idx}"]`));
      }
    }

    function onTimeUp() {
      if (finished || !queue.length) return;
      dropOrRequeue(queue[0]);
      startCycle();
    }

    function removeTile(tile) {
      if (!tile) return;
      tile.classList.add("is-solved");
      tile.disabled = true;
      pendingRemovals.push(setTimeout(() => tile.remove(), 320));
    }

    // Slides the prompt from wherever it currently is to fully off the
    // right edge, THEN calls `cb` (next cycle, or finish). Shared by a
    // correct tap, a wrong tap, and running out of lives.
    function exitPromptThenCall(cb) {
      const promptEl = root.querySelector(".aw-ftm-prompt");
      haltPromptAnim();
      if (!promptEl) { cb(); return; }
      ftmSound.conveyorLeave();
      const off = offscreenPx();
      const exit = promptEl.animate(
        [{ transform: `translateX(${off}px)` }],
        { duration: EXIT_MS, easing: "ease-in", fill: "forwards" }
      );
      promptAnim = exit;
      let done = false;
      const run = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (!finished) cb();
      };
      exit.onfinish = run;
      armFallback(run, EXIT_MS + 100);
    }

    function choose(idx, tile) {
      if (finished || !queue.length) return;
      const target = queue[0];
      if (idx === target) {
        queue.shift();
        state[target].solved = true;
        ftmSound.correct();

        const fly = el("span", "aw-mark-fly", icons.markCheck);
        tile.append(fly);
        setTimeout(() => fly.remove(), 900);
        if (removeCorrects) {
          removeTile(tile);
        } else {
          tile.classList.add("is-locked");
          tile.disabled = true;
          tile.append(el("span", "aw-tile-badge", icons.markCheck));
        }

        ui.setScore(scoreNow());
        updateNav();
        exitPromptThenCall(() => { if (!queue.length) finish("complete"); else startCycle(); });
      } else {
        // Wrong tap: a big ✗ flies up on the TAPPED tile then fades (the
        // tile itself is NOT removed/locked — it may still be the right
        // answer for a LATER prompt). Lose a life if enabled. The CURRENT
        // prompt's pair is done for this round either way (dropOrRequeue),
        // and the prompt glides off to the right same as a correct tap.
        ftmSound.wrong();
        const fly = el("span", "aw-mark-fly is-cross", icons.markCross);
        tile.append(fly);
        setTimeout(() => fly.remove(), 900);

        let outOfLives = false;
        if (livesLeft != null) {
          livesLeft--;
          const livesEl = root.querySelector(".aw-ftm-lives");
          if (livesEl) [...livesEl.children].forEach((s, i) => s.classList.toggle("is-lost", i >= livesLeft));
          if (livesLeft <= 0) outOfLives = true;
        }

        dropOrRequeue(target);
        exitPromptThenCall(() => {
          if (outOfLives) finish("gameover");
          else if (!queue.length) finish("complete");
          else startCycle();
        });
      }
    }

    function updateNav() {
      ui.setNav({ index: scoreNow(), total, onPrev: null, onNext: null });
    }

    function onKey(e) {
      if (finished) return;
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1) {
        const tiles = [...root.querySelectorAll(".aw-ftm-tile")].filter(t => !t.disabled);
        const tile = tiles[n - 1];
        if (tile) tile.click();
      }
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      haltPromptAnim();
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
      tickTimers.forEach(clearTimeout);
      if (reason === "gameover") ftmSound.gameOver();
      else if (reason === "timesup") ftmSound.timesUp();
      else ftmSound.gameCompleted();

      const perQuestion = order.map((idx, i) => ({ q: i, correct: state[idx].solved === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = order.map(idx => {
        const p = pairs[idx];
        const s = state[idx];
        return {
          question: p.definition,
          answered: s.solved,
          yourText: s.solved ? p.keyword : null,
          yourCorrect: s.solved,
          correctText: p.keyword
        };
      });
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered: correct });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      tickTimers.forEach(clearTimeout);
      haltPromptAnim();
      pendingRemovals.forEach(clearTimeout);
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ftmTemplate);
export default ftmTemplate;
