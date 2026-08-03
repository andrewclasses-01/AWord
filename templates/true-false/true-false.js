// =============================================================
// TEMPLATE: TRUE FALSE — Wordwall style ("boolean" game), English UI.
//  • A STATEMENT rides in on a "conveyor belt": it slides in from the left
//    edge of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — one continuous slow glide. Speed 0
//    = arrives at centre and waits there until answered (this is how the
//    real act plays by default). Same motion engine as Find the match. The
//    slide-in pace was slowed a touch (teacher, 1/8/2026).
//  • Below a dashed divider sit TWO fixed buttons: TRUE (green) and FALSE
//    (red), sized at 80% (teacher, 1/8). The colours come from the theme's
//    own --aw-ok / --aw-no variables, so each theme gets its matching tone —
//    nothing is hard-coded here. The buttons never disappear.
//  • Answer CORRECT: the whole statement lifts off toward the score, bursting
//    into little stars that stream into it, and the score ticks up with a
//    pulse (teacher, 1/8). Answer WRONG: a ✗ + the wrong sound, and — if
//    lives are on — the LEFTMOST heart pops out and vanishes; the statement
//    then glides off to the right and the next one enters.
//  • Lives live in the TOP BAR, just left of the score (via ui.livesSlot).
//    `options.lives` is a slider 0..10: 0 (or null) = unlimited (no hearts
//    shown); 1..5 = that many separate hearts; 6..10 = a compact "N♥". Losing
//    the last heart ends the game (Game Over). (teacher's spec, 1/8/2026.)
//  • A statement that wasn't answered in time (Speed > 0, glide reached the
//    right edge) follows `options.repeatUntilCorrect`: false = marked
//    skipped; true = re-queued at a RANDOM position. A time-out never costs a
//    life (only wrong taps do) — same as FTM.
//  • Timer/sound: count-up mode gets a 3-2-1 prep countdown before the first
//    statement, and — via the engine's opt-in `manualTimerStart` hook — the
//    visible clock now stays at 0:00 during that countdown and only starts
//    ticking once it ends (teacher, 1/8). Count-down mode ticks once/sec from
//    10s, doubling from 5s.
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
const MAX_LIVES = 10;
const ENTER_MS = 1300;  // left edge -> centre (slowed from 900, teacher 1/8)
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once answered

// Speed 0-10 -> how long the CENTRE-to-right-edge drift takes. 0 = no drift
// at all (frozen at centre, "wait for answer"). Slightly slower curve than
// before (teacher wanted the glide eased down, 1/8).
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5600 - t * (5600 - 1100));
}

// Options store lives as: 0 = unlimited (slider's left end), 1..10 = that many
// hearts, null = unlimited (legacy), undefined = default 5.
function normLives(v) {
  if (v === 0 || v === null) return null;                 // unlimited
  if (typeof v === "number") return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
  return DEFAULT_LIVES;                                   // undefined -> default 5
}

const tfTemplate = {
  type: "true_false",
  scorable: true,
  name: "True or false",
  hasLivesSlot: true,       // hearts render in the top bar, left of the score
  manualTimerStart: true,   // the clock starts only after our 3-2-1 prep countdown

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
  buildExtraOptions({ panel, draft, mkRadioChoice }) {
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

    // LIVES — a slider 0..10 (0 = Unlimited). Teacher's spec (1/8/2026):
    // adjustable number of hearts, shown next to the score.
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-tf-livesrow");
    const curLives = (draft.lives === 0 || draft.lives === null) ? 0
      : (Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(1, draft.lives)) : DEFAULT_LIVES);
    const livesVal = el("span", "aw-tf-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-tf-livesslider");
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
    // Points deducted per WRONG answer (0..5). 0 = no penalty (behaviour unchanged).
    const pointsOff = Math.max(0, Math.min(5, Number(activity.options && activity.options.pointsOff) || 0));
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
    // `queue` = the LIVE working sequence — front = current statement. Always
    // shuffled: the two-column editor no longer carries a play order, so every
    // play mixes the True/False statements (teacher's spec, 1/8/2026).
    let order = shuffle(statements.map((_, i) => i));
    const queue = [...order];

    const state = statements.map(() => ({ answered: false, correct: false, chosen: null }));
    let finished = false;
    let livesLeft = startLives;
    let penalty = 0;          // accumulated points-off from wrong answers (pointsOff each)
    let fitter = null;
    let promptAnim = null;    // the currently-running Animation on .aw-tf-prompt (enter/crawl/exit)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    let balanceTimer = null;  // debounce for the divider/nav spacing balance (item 5)
    let gateTimer = null;     // unlocks the buttons once a new statement is ~50% in (item, 1/8)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingMarks = [];

    ui.onSubmit(() => finish("timesup"));
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", rebalance);
    renderShell();

    if (timerMode === "countUp") {
      runPrepCountdown();          // starts the clock (ui.startTimer) after 3-2-1
    } else {
      ui.startTimer();             // count-down / none: clock starts right away
      if (timerMode !== "none") tfSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    function scoreNow() { return state.filter(s => s.correct).length; }
    // The value actually shown/ranked: correct count minus wrong-answer penalty
    // (negatives allowed, never clamped). When pointsOff===0, penalty stays 0 so
    // liveScore() === scoreNow() and everything is byte-identical to before.
    function liveScore() { return scoreNow() - penalty; }

    function armFallback(fn, ms) {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(fn, ms);
    }

    // Count-up mode only: 3 big numbers (one/sec) in the statement area + a
    // "ting" each second, THEN the first statement starts. The engine's visible
    // clock is deferred (manualTimerStart) and only begins via ui.startTimer()
    // once these three numbers are done — so the clock reads 0:00 throughout.
    function runPrepCountdown() {
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) { ui.startTimer(); tfSound.go(); startCycle(); return; }
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
          ui.startTimer();     // the clock begins only NOW, after the 3-2-1 prep
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

      const track = el("div", "aw-tf-track");
      track.append(el("div", "aw-tf-prompt"));
      card.append(track);

      card.append(el("div", "aw-tf-divider"));

      const btnRow = el("div", "aw-tf-buttons");
      const btnTrue = el("button", "aw-tf-btn is-true", "True");
      const btnFalse = el("button", "aw-tf-btn is-false", "False");
      btnTrue.onclick = () => choose(true, btnTrue);
      btnFalse.onclick = () => choose(false, btnFalse);
      // Locked until a statement has slid in >=50% (item, 1/8) — this also keeps
      // taps during the 3-2-1 countdown from answering the first statement early.
      btnTrue.disabled = true; btnFalse.disabled = true;
      btnRow.append(btnTrue, btnFalse);
      card.append(btnRow);
      root.append(card);

      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.03,
        measure: () => track.offsetHeight + btnRow.scrollHeight
      });

      ui.setScore(liveScore());
      updateNav();
      renderLives();
      scheduleBalance();
    }

    // Hearts live in the top bar (ui.livesSlot), just left of the score. 1..5
    // lives show that many separate hearts; 6..10 show a compact "N♥";
    // unlimited shows nothing. A lost life removes the LEFTMOST heart.
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
    // individually) then re-renders. Returns true if that was the last life.
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
        pendingMarks.push(setTimeout(finishPop, 360));
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    function offscreenPx() { return Math.round((root.clientWidth || 1) * 1.15); }

    // Item (1/8): the True/False buttons are LOCKED while a new statement is
    // sliding in, and only unlock once it's ~50% across — so two answers can't
    // land right on top of each other.
    function lockButtons() { root.querySelectorAll(".aw-tf-btn").forEach(b => { b.disabled = true; }); }
    function unlockButtons() { root.querySelectorAll(".aw-tf-btn").forEach(b => { b.disabled = false; }); }

    // Starts the current queue-front's journey from the LEFT edge. Only
    // called once the PREVIOUS statement is fully gone.
    function startCycle() {
      if (finished) return;
      if (!queue.length) { armFallback(() => finish("complete"), 400); return; }
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) return;
      promptEl.style.visibility = "";           // a correct-answer fly may have hidden it
      promptEl.textContent = statements[queue[0]].text;
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the start position is committed before animating from it
      tfSound.conveyorAppear();
      const enter = promptEl.animate(
        [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
        { duration: ENTER_MS, easing: "ease-out", fill: "forwards" }
      );
      promptAnim = enter;
      // Lock now, unlock at ~50% of the slide-in (item, 1/8).
      lockButtons();
      if (gateTimer) clearTimeout(gateTimer);
      gateTimer = setTimeout(() => { if (!finished && queue.length) unlockButtons(); }, Math.round(ENTER_MS * 0.5));
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
    // calls `cb`. Used by a WRONG answer and by running out of lives.
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

    // A CORRECT answer: the whole statement lifts off toward the score,
    // bursting into little stars that stream into it; the score then ticks up
    // with a pulse. THEN `cb` runs (start next / finish). Overlay nodes are
    // appended to the fullscreen host (or body) so they show over the stage and
    // in fullscreen; they use px/viewport coords (NOT cqw, which wouldn't
    // resolve outside the stage container).
    function flyStatementToScore(promptEl, cb) {
      const scoreEl = ui.scoreEl || document.querySelector(".aw-top-score");
      const host = document.fullscreenElement || document.body;
      let called = false;
      const done = () => { if (called) return; called = true; if (!finished) cb(); };
      if (!promptEl || !scoreEl) { done(); return; }

      const from = promptEl.getBoundingClientRect();
      const to = scoreEl.getBoundingClientRect();
      const cs = getComputedStyle(promptEl);

      const clone = el("div", "aw-tf-flyclone");
      clone.textContent = promptEl.textContent;
      clone.style.left = from.left + "px";
      clone.style.top = from.top + "px";
      clone.style.width = from.width + "px";
      clone.style.height = from.height + "px";
      clone.style.font = cs.font;
      clone.style.color = cs.color;
      host.appendChild(clone);
      promptEl.style.visibility = "hidden";

      const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      try {
        clone.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(0.5)`, opacity: 0.7, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0 }
        ], { duration: 620, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => clone.remove();
      } catch (e) { /* ignore */ }
      pendingMarks.push(setTimeout(() => clone.remove(), 950));

      spawnStars(from, to, host);

      // score updates mid-flight, with a little pulse
      pendingMarks.push(setTimeout(() => {
        if (finished) return;
        ui.setScore(liveScore());
        updateNav();
        try {
          scoreEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
            { duration: 340, easing: "ease-out" });
        } catch (e) { /* ignore */ }
      }, 380));

      pendingMarks.push(setTimeout(done, 640));
    }

    function spawnStars(from, to, host) {
      const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
      const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
      const N = 11;
      for (let i = 0; i < N; i++) {
        const s = el("span", "aw-tf-star", "&#9733;");
        host.appendChild(s);
        const jx = cx + (Math.random() - 0.5) * from.width * 0.9;
        const jy = cy + (Math.random() - 0.5) * from.height * 0.9;
        const delay = i * 26;
        try {
          s.animate([
            { transform: `translate(${jx}px, ${jy}px) scale(.2)`, opacity: 0 },
            { transform: `translate(${jx}px, ${jy}px) scale(1)`, opacity: 1, offset: .18 },
            { transform: `translate(${tx}px, ${ty}px) scale(.35)`, opacity: 0 }
          ], { duration: 680, delay, easing: "cubic-bezier(.4,.1,.3,1)", fill: "forwards" }).onfinish = () => s.remove();
        } catch (e) { s.remove(); }
        pendingMarks.push(setTimeout(() => s.remove(), 950 + delay));
      }
    }

    function choose(value, btn) {
      if (finished || !queue.length) return;
      const idx = queue[0];
      const st = statements[idx];
      const isRight = value === !!st.answer;

      queue.shift();
      state[idx].answered = true;
      state[idx].chosen = value;
      // Lock right away so the NEXT statement can't be answered "blind" while the
      // current one is still flying off / sliding out — startCycle re-arms the
      // 50%-in unlock for the incoming statement (item, 1/8).
      lockButtons();

      if (isRight) {
        state[idx].correct = true;
        tfSound.correct();
        const promptEl = root.querySelector(".aw-tf-prompt");
        haltPromptAnim();
        flyStatementToScore(promptEl, () => { if (!queue.length) finish("complete"); else startCycle(); });
      } else {
        state[idx].correct = false;
        tfSound.wrong();
        flyMark(btn, false);

        // Points-off penalty: subtract pointsOff (negatives allowed, no clamp) and
        // refresh BOTH the top score and the nav counter so they stay in sync. The
        // whole block is skipped when pointsOff===0 -> byte-identical to before.
        if (pointsOff) {
          penalty += pointsOff;
          ui.setScore(liveScore());
          updateNav();
        }

        const outOfLives = loseLife();
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
      ui.setNav({ index: liveScore(), total, onPrev: null, onNext: null });
    }

    // Item 5 (teacher 1/8): keep the gap divider->buttons equal to the gap
    // buttons->"x of y" nav. The buttons sit at the card's bottom and the
    // flex:1 track above them absorbs any size change, so growing the divider's
    // bottom margin lengthens ONLY the top gap (the bottom gap doesn't move) —
    // one full-difference nudge lines them up. Reset to the CSS value before
    // each measure so repeated resizes don't accumulate.
    function scheduleBalance() {
      if (balanceTimer) clearTimeout(balanceTimer);
      balanceTimer = setTimeout(balanceSpacing, 70);
    }
    function rebalance() {
      const divider = root.querySelector(".aw-tf-divider");
      if (divider) divider.style.marginBottom = "";   // back to the CSS cqw value
      scheduleBalance();
    }
    function balanceSpacing() {
      if (finished) return;
      const divider = root.querySelector(".aw-tf-divider");
      const btnRow = root.querySelector(".aw-tf-buttons");
      const navLabel = document.querySelector(".aw-nav-label");
      if (!divider || !btnRow || !navLabel) return;
      const dR = divider.getBoundingClientRect();
      const bR = btnRow.getBoundingClientRect();
      const nR = navLabel.getBoundingClientRect();
      const gapTop = bR.top - dR.bottom;
      const gapBottom = nR.top - bR.bottom;
      if (gapBottom <= 0 || gapTop < 0) return;
      const delta = gapBottom - gapTop;
      if (Math.abs(delta) < 0.5) return;
      const cur = parseFloat(getComputedStyle(divider).marginBottom) || 0;
      divider.style.marginBottom = Math.max(0, cur + delta) + "px";
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
      if (balanceTimer) { clearTimeout(balanceTimer); balanceTimer = null; }
      if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
      tickTimers.forEach(clearTimeout);
      // "timesup" (Submit pressed, or the clock hit 0) plays NO template sound
      // now — the summary screen's own fanfare already covers it, and the old
      // ~6-7s timesUp clip just overlapped it (teacher, 1/8/2026).
      if (reason === "gameover") tfSound.gameOver();
      else if (reason === "complete") tfSound.gameCompleted();

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
      // Ranking score = correct count minus wrong-answer penalty. When pointsOff===0
      // penalty is 0, so score === correct, which equals the engine's default.
      ui.finish({ score: correct - penalty, correct, incorrect: total - correct, total, perQuestion, review, answered: state.filter(s => s.answered).length });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", rebalance);
      if (fitter) fitter.destroy();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      if (balanceTimer) clearTimeout(balanceTimer);
      if (gateTimer) clearTimeout(gateTimer);
      tickTimers.forEach(clearTimeout);
      haltPromptAnim();
      pendingMarks.forEach(clearTimeout);
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-tf-flyclone, .aw-tf-star").forEach(n => n.remove());
    };
  }
};

registerTemplate(tfTemplate);
export default tfTemplate;
