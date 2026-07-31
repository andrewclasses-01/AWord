// =============================================================
// TEMPLATE: TRUE FALSE — Wordwall style ("boolean" game), English UI.
//  • A STATEMENT rides in on a "conveyor belt": it slides in from the left
//    edge of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — one continuous slow glide. Speed 0
//    = arrives at centre and waits there until answered (this is how the
//    real act plays by default). Same motion engine as Find the match.
//  • Below a dashed divider sit TWO fixed buttons: TRUE (green) and FALSE
//    (red). The colours come from the theme's own --aw-ok / --aw-no
//    variables, so each theme gets its matching tone (teacher's spec,
//    31/7/2026) — nothing is hard-coded here. The buttons never disappear;
//    you answer every statement with the same two buttons.
//  • Answer: tapping the button whose value matches statement.answer scores
//    a point (correct sound + ✓ flies up). A wrong tap plays the wrong
//    sound + a ✗, and — if lives are on — costs one heart; running out of
//    hearts ends the game (Game Over). Either way the current statement
//    then glides off to the right and the next one enters.
//  • A statement that wasn't answered in time (Speed > 0, glide reached the
//    right edge) follows `options.repeatUntilCorrect`: false = marked
//    skipped; true = re-queued at a RANDOM position so it comes back later.
//    A time-out never costs a life (only wrong taps do) — same as FTM.
//  • Lives: `options.lives` (a number, default 5) shows that many hearts;
//    null = no lives (endless until the statements/timer run out). A toggle
//    in the Options panel switches it on/off (teacher's spec).
//  • Timer/sound choreography mirrors Find the match: count-up mode gets a
//    3-2-1 prep countdown (big numbers + a "ting"/sec) before the first
//    statement; count-down mode ticks once/sec from 10s remaining, doubling
//    from 5s. (Same known limitation: the engine's visible clock can't be
//    paused during the count-up prep — flagged in GHI CHU.)
//  • Score = number of statements answered correctly. ui.finish()/review
//    follow the same shape as every other template.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { openTfEditor } from "./true-false-editor.js";
import { tfSound } from "./tf-sound.js";

const DEFAULT_LIVES = 5;
const ENTER_MS = 900;   // left edge -> centre, always this pace regardless of Speed
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once answered

// Speed 0-10 -> how long the CENTRE-to-right-edge drift takes. 0 = no drift
// at all (frozen at centre, "wait for answer"). Same curve as Find the match.
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5000 - t * (5000 - 900));
}

function normLives(v) {
  if (v === null) return null;
  if (typeof v === "number" && v >= 1) return Math.min(9, Math.round(v));
  if (v === undefined) return DEFAULT_LIVES;   // default ON with 5 hearts
  return null;
}

const tfTemplate = {
  type: "true_false",
  scorable: true,
  name: "True or false",

  toPrintItems(activity) {
    return (activity.content?.statements || [])
      .filter(s => s && typeof s.text === "string" && s.text.trim())
      .map(s => ({ clue: s.text, answer: s.answer ? "True" : "False" }));
  },

  edit: openTfEditor,

  sounds: {
    play: tfSound.intro,
    restart: tfSound.restart,
    complete: () => {}   // silenced: true-false.js picks ONE of Completed/GameOver/TimesUp itself
  },

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  buildExtraOptions({ panel, draft, mkCheck, mkRadioChoice }) {
    // SPEED — a real slider (matches Find the match's control).
    const gSpeed = el("div", "aw-opt-group");
    gSpeed.append(el("div", "aw-opt-label", "Speed"));
    const rowSpeed = el("div", "aw-opt-row aw-tf-speedrow");
    const initSpeed = Number.isInteger(draft.speed) ? draft.speed : 0;
    const speedVal = el("span", "aw-tf-speedval", initSpeed === 0 ? "0 — wait for answer" : String(initSpeed));
    const speedInput = el("input", "aw-tf-speedslider");
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

    // LIVES — on/off toggle (teacher's spec: default 5 hearts, can be turned off).
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row");
    rowLives.append(mkCheck(normLives(draft.lives) != null, "Show 5 lives (game over when they run out)",
      v => { draft.lives = v ? DEFAULT_LIVES : null; }));
    gLives.append(rowLives);
    panel.append(gLives);

    // What happens to a statement that wasn't answered in time (only matters
    // when Speed > 0).
    const gRepeat = el("div", "aw-opt-group");
    gRepeat.append(el("div", "aw-opt-label", "Unanswered questions"));
    const rowRepeat = el("div", "aw-opt-row");
    const repeatOn = draft.repeatUntilCorrect === true;
    rowRepeat.append(
      mkRadioChoice("aw-tf-repeat", "once", "Show each statement once", !repeatOn, () => { draft.repeatUntilCorrect = false; }),
      mkRadioChoice("aw-tf-repeat", "repeat", "Repeat until answered", repeatOn, () => { draft.repeatUntilCorrect = true; })
    );
    gRepeat.append(rowRepeat);
    panel.append(gRepeat);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const repeatUntilCorrect = opt.repeatUntilCorrect === true;
    const speed = Number.isInteger(opt.speed) ? Math.max(0, Math.min(10, opt.speed)) : 0;
    const crawlMs = crawlMsFor(speed);
    const timerMode = opt.timer ?? "countUp";
    const timerTotal = opt.timerTotalSeconds ?? 120;
    const startLives = normLives(opt.lives);

    const statements = [...(activity.content?.statements || [])]
      .filter(s => s && typeof s.text === "string" && s.text.trim());
    const total = statements.length;
    if (total < 1) {
      root.innerHTML = "";
      root.append(el("div", "aw-tf-empty", "This activity needs at least 1 statement."));
      return () => {};
    }

    // `order` = the fixed sequence used for scoring/review (never mutated).
    // `queue` = the LIVE working sequence — front = current statement.
    let order = statements.map((_, i) => i);
    if (opt.shuffleQuestions) order = shuffle(order);
    const queue = [...order];

    const state = statements.map(() => ({ answered: false, correct: false, chosen: null }));
    let finished = false;
    let livesLeft = startLives;
    let fitter = null;
    let promptAnim = null;    // the currently-running Animation on .aw-tf-prompt (enter/crawl/exit)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingMarks = [];

    ui.onSubmit(() => finish("timesup"));
    window.addEventListener("keydown", onKey);
    renderShell();

    if (timerMode === "countUp") {
      runPrepCountdown();
    } else {
      if (timerMode !== "none") tfSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    function scoreNow() { return state.filter(s => s.correct).length; }

    function armFallback(fn, ms) {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(fn, ms);
    }

    // Count-up mode only: 3 big numbers (one/sec) in the statement area + a
    // "ting" each second, THEN the first statement starts. (The engine's own
    // visible clock has no hook to pause here — see header + GHI CHU.)
    function runPrepCountdown() {
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) { tfSound.go(); startCycle(); return; }
      promptEl.classList.add("is-countdown");
      let n = 3;
      const tick = () => {
        if (finished) return;
        promptEl.textContent = String(n);
        tfSound.clockTick();
        n--;
        if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
        prepTimer = setTimeout(() => {
          promptEl.classList.remove("is-countdown");
          promptEl.textContent = "";
          tfSound.go();
          startCycle();
        }, 1000);
      };
      tick();
    }

    // Count-down mode only: a "ting" once/sec while 10-6s remain, then twice/
    // sec from 5s remaining to 0.5s. Computed from this template's own start
    // reference (mount runs as the engine's countdown begins for this mode).
    function armCountdownTicks() {
      const at = [];
      for (let r = 10; r >= 6; r--) at.push(timerTotal - r);
      for (let r = 5; r >= 1; r -= 0.5) at.push(timerTotal - r);
      at.forEach(sec => {
        if (sec < 0) return;
        tickTimers.push(setTimeout(() => { if (!finished) tfSound.clockTick(); }, sec * 1000));
      });
    }

    function renderShell() {
      root.innerHTML = "";
      const card = el("div", "aw-tf-card");

      if (startLives != null) {
        const lives = el("div", "aw-tf-lives");
        for (let i = 0; i < startLives; i++) {
          lives.append(el("span", i < livesLeft ? "" : "is-lost", "&#9829;"));
        }
        card.append(lives);
      }

      const track = el("div", "aw-tf-track");
      track.append(el("div", "aw-tf-prompt"));
      card.append(track);

      card.append(el("div", "aw-tf-divider"));

      const btnRow = el("div", "aw-tf-buttons");
      const btnTrue = el("button", "aw-tf-btn is-true", "True");
      const btnFalse = el("button", "aw-tf-btn is-false", "False");
      btnTrue.onclick = () => choose(true, btnTrue);
      btnFalse.onclick = () => choose(false, btnFalse);
      btnRow.append(btnTrue, btnFalse);
      card.append(btnRow);
      root.append(card);

      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.03,
        measure: () => track.offsetHeight + btnRow.scrollHeight
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    function offscreenPx() { return Math.round((root.clientWidth || 1) * 1.15); }

    // Starts the current queue-front's journey from the LEFT edge. Only
    // called once the PREVIOUS statement is fully gone.
    function startCycle() {
      if (finished) return;
      if (!queue.length) { armFallback(() => finish("complete"), 400); return; }
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) return;
      promptEl.textContent = escapeHtml(statements[queue[0]].text);
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the start position is committed before animating from it
      tfSound.conveyorAppear();
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
        tfSound.conveyorCentred();
        armCrawl();
      };
      enter.onfinish = onEntered;
      armFallback(onEntered, ENTER_MS + 100);
    }

    // After arriving at centre: if Speed > 0, keep drifting to the right edge
    // (unanswered by the time it fully exits = a timeout). Speed 0 = frozen.
    function armCrawl() {
      if (finished || !queue.length || !crawlMs) return;
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) return;
      const off = offscreenPx();
      tfSound.conveyorLeave();
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

    // Freezes whatever position the prompt is CURRENTLY at into a real inline
    // style, so a follow-up .animate() with only a "to" keyframe continues
    // smoothly from there.
    function haltPromptAnim() {
      if (promptAnim) {
        try { promptAnim.commitStyles(); } catch (e) { /* ignore */ }
        try { promptAnim.cancel(); } catch (e) { /* ignore */ }
        promptAnim = null;
      }
    }

    // Puts a statement back in the running — at a RANDOM spot in the queue
    // (not just at the back), so a missed one doesn't return predictably.
    function requeueRandom(idx) {
      queue.shift();
      if (!queue.length) { queue.push(idx); return; }
      const pos = 1 + Math.floor(Math.random() * queue.length);
      queue.splice(pos, 0, idx);
    }

    // A statement that timed out unanswered.
    function dropOrRequeue(idx) {
      if (repeatUntilCorrect) requeueRandom(idx);
      else { queue.shift(); state[idx].answered = true; state[idx].correct = false; }
    }

    function onTimeUp() {
      if (finished || !queue.length) return;
      dropOrRequeue(queue[0]);
      startCycle();
    }

    function flyMark(btn, ok) {
      const fly = el("span", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      btn.append(fly);
      pendingMarks.push(setTimeout(() => fly.remove(), 900));
    }

    // Slides the prompt from wherever it is to fully off the right edge, THEN
    // calls `cb`. Shared by every answer and by running out of lives.
    function exitPromptThenCall(cb) {
      const promptEl = root.querySelector(".aw-tf-prompt");
      haltPromptAnim();
      if (!promptEl) { cb(); return; }
      tfSound.conveyorLeave();
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

    function choose(value, btn) {
      if (finished || !queue.length) return;
      const idx = queue[0];
      const st = statements[idx];
      const isRight = value === !!st.answer;

      queue.shift();
      state[idx].answered = true;
      state[idx].chosen = value;

      if (isRight) {
        state[idx].correct = true;
        tfSound.correct();
        flyMark(btn, true);
        ui.setScore(scoreNow());
        updateNav();
        exitPromptThenCall(() => { if (!queue.length) finish("complete"); else startCycle(); });
      } else {
        state[idx].correct = false;
        tfSound.wrong();
        flyMark(btn, false);

        let outOfLives = false;
        if (livesLeft != null) {
          livesLeft--;
          const livesEl = root.querySelector(".aw-tf-lives");
          if (livesEl) [...livesEl.children].forEach((s, i) => s.classList.toggle("is-lost", i >= livesLeft));
          if (livesLeft <= 0) outOfLives = true;
        }
        // A wrong tap: if "repeat until answered" is on, the statement comes
        // back later (it wasn't answered correctly); otherwise it's done.
        if (repeatUntilCorrect) requeueRandom(idx);

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

    // Keyboard: T / ArrowLeft = True, F / ArrowRight = False (statements only
    // ever move forward, so the arrows aren't needed for navigation here).
    function onKey(e) {
      if (finished) return;
      const k = e.key.toLowerCase();
      if (k === "t" || e.key === "ArrowLeft") {
        e.preventDefault();
        root.querySelector(".aw-tf-btn.is-true")?.click();
      } else if (k === "f" || e.key === "ArrowRight") {
        e.preventDefault();
        root.querySelector(".aw-tf-btn.is-false")?.click();
      }
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      haltPromptAnim();
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
      tickTimers.forEach(clearTimeout);
      if (reason === "gameover") tfSound.gameOver();
      else if (reason === "timesup") tfSound.timesUp();
      else tfSound.gameCompleted();

      const perQuestion = order.map((idx, i) => ({ q: i, correct: state[idx].correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = order.map(idx => {
        const st = statements[idx];
        const s = state[idx];
        const correctText = st.answer ? "True" : "False";
        return {
          question: st.text,
          answered: s.answered,
          yourText: s.chosen == null ? null : (s.chosen ? "True" : "False"),
          yourCorrect: s.correct,
          correctText
        };
      });
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered: state.filter(s => s.answered).length });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      tickTimers.forEach(clearTimeout);
      haltPromptAnim();
      pendingMarks.forEach(clearTimeout);
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(tfTemplate);
export default tfTemplate;
