// =============================================================
// TEMPLATE: GROUP SORT — Wordwall's "Group sort" + "Speed sorting" in ONE game.
// Built Đợt 288 (03/9/2026) for the NEN TANG TIENG ANH course (Lesson 16 BT2
// "phân biệt 7 loại câu hỏi xin thông tin" is a Speed sorting on Wordwall).
//
// TWO MODES (options.mode):
//  • "tap"  (default) — SPEED SORTING. One item glides in on the True-false
//    conveyor belt; below sit N GROUP BUTTONS (2..8, coloured with the theme's
//    tile palette). Tap the right group: the item flies INTO that button with a
//    burst of stars and the score ticks up. Tap wrong: ✗ + wrong sound, a heart
//    pops (if lives are on), the item glides off (and comes back later when
//    "Repeat" is on). Speed 0..10 = how fast an unanswered item drifts away
//    (0 = waits). Keys 1..9 = tap group 1..9.
//  • "drag" — GROUP SORT proper. EVERY item sits in a pool at the top; drag each
//    chip into its group box (or tap a chip, then tap a box). options.dragCheck:
//    "submit" = graded once the pool is empty or Submit is pressed (✓/✗ on every
//    chip, then the summary); "instant" = graded on every drop (a wrong chip
//    shakes, costs a heart/points and jumps back to the pool).
//
// DATA:  content.groups = [name, …] · content.items = [{ text, group: name }]
// A FLAT item list on purpose — "Start with mistakes" (itemsKey) and Show
// answers want one array of playable things. `group` is the NAME, not an
// index, so the editor can reorder groups without touching every item.
//
// Everything else follows CONG THUC MAU.md and the True-false template (the
// closest relative: conveyor, lives in the top bar via ui.livesSlot, the 3-2-1
// prep countdown with manualTimerStart, points-off through ui.flyPenalty).
// NOT in this first build (see GHI CHU GROUP-SORT.md): Fight mode, Showdown,
// per-item voice, Change template conversions.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { openGsEditor } from "./group-sort-editor.js";
import { gsSound } from "./gs-sound.js";
import { MIN_GROUPS, normalizeGroups, groupIndexOf } from "./gs-shared.js";

const MAX_LIVES = 10;
const ENTER_MS = 1300;   // tap mode: left edge -> centre (same pace as True-false)
const EXIT_MS = 550;     // tap mode: wherever it is -> off the right edge
const TAP_SLOP_PX = 7;   // drag mode: a pointer that moved less than this is a TAP, not a drag

// Speed 0-10 -> how long the centre-to-right-edge drift takes (tap mode).
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5600 - t * (5600 - 1100));
}

// options.lives: 0 / null / undefined = unlimited (this game defaults to
// UNLIMITED — a course exercise asks for 100%, not for surviving 5 mistakes);
// 1..10 = that many hearts.
function normLives(v) {
  if (typeof v === "number" && v >= 1) return Math.min(MAX_LIVES, Math.round(v));
  return null;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const gsTemplate = {
  type: "group_sort",
  scorable: true,
  name: "Group sort",
  timeCost: true,
  itemsKey: "items",
  checkOrder: ["shuffle", "showAnswers"],
  hasLivesSlot: true,
  manualTimerStart: true,
  hidePointsOff: false,

  toPrintItems(activity) {
    const groups = normalizeGroups(activity.content);
    return (activity.content?.items || [])
      .filter(it => it && typeof it.text === "string" && it.text.trim())
      .map(it => ({ clue: it.text, answer: groups[groupIndexOf(groups, it.group)] || String(it.group || "") }));
  },

  edit: openGsEditor,

  sounds: {
    play: gsSound.intro,
    restart: gsSound.restart,
    complete: () => {}   // this file picks Completed / GameOver itself
  },

  buildExtraOptions({ panel, draft, mkSliderCell, mkSeg, mkCell }) {
    const mode = mkCell({ label: "Mode" });
    mode.ctl.append(mkSeg([
      { value: "tap", label: "Tap", title: "One item at a time — tap its group (Speed sorting)" },
      { value: "drag", label: "Drag", title: "Every item in a pool — drag each into its box (Group sort)" }
    ], draft.mode === "drag" ? "drag" : "tap", v => { draft.mode = v; }));

    const speed = mkSliderCell({
      label: "Speed", sub: "tap · 0 = wait", min: 0, max: 10, step: 1,
      value: Number.isInteger(draft.speed) ? draft.speed : 0, tone: "blue", offAt: 0,
      fmt: v => (v === 0 ? "Off" : String(v)),
      onInput: v => { draft.speed = v; }
    });
    speed.cell.title = "Tap mode only: 0 = the item waits for an answer; 10 = it drifts away fastest";

    const curLives = normLives(draft.lives) || 0;
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: curLives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }
    });
    lives.cell.title = "0 = unlimited lives";

    const repeat = mkCell({ label: "Unanswered", sub: "tap" });
    repeat.ctl.append(mkSeg([
      { value: "once", label: "Ask once", title: "Show each item once" },
      { value: "repeat", label: "Repeat", title: "A missed item comes back later" }
    ], draft.repeatUntilCorrect === true ? "repeat" : "once",
      v => { draft.repeatUntilCorrect = v === "repeat"; }));

    const check = mkCell({ label: "Checking", sub: "drag" });
    check.ctl.append(mkSeg([
      { value: "submit", label: "On submit", title: "Graded once every chip is placed (or Submit is pressed)" },
      { value: "instant", label: "Instantly", title: "Every drop is graded at once; a wrong chip returns to the pool" }
    ], draft.dragCheck === "instant" ? "instant" : "submit",
      v => { draft.dragCheck = v; }));

    panel.append(mode.cell, speed.cell, lives.cell, repeat.cell, check.cell);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.mode === "drag" ? "drag" : "tap";
    const groups = normalizeGroups(activity.content);
    const items = [...(activity.content?.items || [])]
      .filter(it => it && typeof it.text === "string" && it.text.trim() && groupIndexOf(groups, it.group) >= 0);
    const total = items.length;
    if (groups.length < MIN_GROUPS || total < 1) {
      root.innerHTML = "";
      root.append(el("div", "aw-gs-empty", "This activity needs at least 2 groups and 1 item."));
      return () => {};
    }
    const answerOf = it => groupIndexOf(groups, it.group);   // correct group index of an item
    const pointsOff = Math.max(0, Math.min(100, Number(opt.pointsOff) || 0));
    const timerMode = opt.timer ?? "countUp";
    const timerTotal = opt.timerTotalSeconds ?? 120;

    // ---- shared state (both modes) ----
    const state = items.map(() => ({ answered: false, correct: false, chosen: null, timedOut: false }));
    let finished = false;
    let livesLeft = normLives(opt.lives);
    let penalty = 0;
    const timers = [];              // every setTimeout we own — cleared in cleanup()
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    function scoreNow() { return state.filter(s => s.correct).length; }
    function liveScore() { return scoreNow() - penalty - (ui.timeCostTotal ? ui.timeCostTotal() : 0); }

    ui.setScoreProvider?.(liveScore);
    renderLives();

    // Hearts in the top bar (ui.livesSlot) — same rendering as True-false.
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }
    // Returns true when that was the last life.
    function loseLife() {
      if (livesLeft == null) return false;
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" }).onfinish = finishPop;
        } catch (e) { finishPop(); }
        later(finishPop, 360);
      } else renderLives();
      return livesLeft <= 0;
    }

    // Points-off: the "-N" flies into the score, THEN the deduction lands (Đợt 256).
    function chargePenalty(fromEl, n) {
      if (!n) return;
      if (ui.flyPenalty) {
        ui.flyPenalty(fromEl, n, () => { penalty += n; const v = liveScore(); paintNav(); return v; });
      } else {
        penalty += n; ui.setScore(liveScore()); paintNav();
      }
    }

    function flyMark(target, ok) {
      const fly = el("span", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      target.append(fly);
      later(() => fly.remove(), 900);
    }

    // Small stars streaming from `from` to `to` (both DOMRects), on the fullscreen host.
    function spawnStars(from, to) {
      const host = document.fullscreenElement || document.body;
      const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
      const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
      for (let i = 0; i < 10; i++) {
        const s = el("span", "aw-gs-star", "&#9733;");
        host.appendChild(s);
        const jx = cx + (Math.random() - 0.5) * from.width * 0.8;
        const jy = cy + (Math.random() - 0.5) * from.height * 0.8;
        const delay = i * 24;
        try {
          s.animate([
            { transform: `translate(${jx}px, ${jy}px) scale(.2)`, opacity: 0 },
            { transform: `translate(${jx}px, ${jy}px) scale(1)`, opacity: 1, offset: .18 },
            { transform: `translate(${tx}px, ${ty}px) scale(.35)`, opacity: 0 }
          ], { duration: 640, delay, easing: "cubic-bezier(.4,.1,.3,1)", fill: "both" }).onfinish = () => s.remove();
          // `fill: "both"` — during `delay` the star must already sit at its first
          // keyframe (invisible, at the item); "forwards" alone leaves it parked at
          // the page's top-left corner for those few frames (seen in the first test).
        } catch (e) { s.remove(); }
        later(() => s.remove(), 900 + delay);
      }
    }

    // Review rows — one per item, in play order (tap) / content order (drag).
    function reviewRow(idx) {
      const it = items[idx], s = state[idx];
      return {
        question: it.text,
        answered: s.answered === true && s.timedOut !== true,
        yourText: s.chosen == null ? null : groups[s.chosen],
        yourCorrect: s.correct === true,
        correctText: groups[answerOf(it)],
        src: it
      };
    }
    let reviewOrder = items.map((_, i) => i);

    function finish(reason) {
      if (finished) return;
      finished = true;
      ui.flushPenalties?.();
      timers.forEach(clearTimeout); timers.length = 0;
      tapCleanup?.();
      if (reason === "gameover") gsSound.gameOver();
      else if (reason === "complete") gsSound.gameCompleted();
      const review = reviewOrder.map(reviewRow);
      const perQuestion = review.map((r, i) => ({ q: i, correct: r.yourCorrect === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      ui.finish({ score: correct - penalty, correct, incorrect: total - correct, total, perQuestion, review,
                  answered: review.filter(r => r.answered).length });
    }

    let paintNav = () => {};
    let tapCleanup = null;
    let cleanupMode = () => {};

    if (mode === "drag") cleanupMode = mountDrag();
    else cleanupMode = mountTap();

    return function cleanup() {
      finished = true;
      timers.forEach(clearTimeout); timers.length = 0;
      cleanupMode();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-gs-flyclone, .aw-gs-star, .aw-gs-dragclone").forEach(n => n.remove());
    };

    // =====================================================================
    // TAP MODE — the conveyor (True-false's motion engine) + N group buttons.
    // =====================================================================
    function mountTap() {
      const speed = Number.isInteger(opt.speed) ? Math.max(0, Math.min(10, opt.speed)) : 0;
      const crawlMs = crawlMsFor(speed);
      const repeatUntilCorrect = opt.repeatUntilCorrect === true;

      const order = opt.shuffleQuestions === false ? items.map((_, i) => i) : shuffle(items.map((_, i) => i));
      reviewOrder = order;
      const queue = [...order];
      let promptAnim = null, fallbackTimer = null, prepTimer = null, gateTimer = null, fitter = null;
      const tickTimers = [];
      let curIdx = -1;

      ui.onSubmit(() => finish("timesup"));
      window.addEventListener("keydown", onKey);
      renderShell();
      ui.setIdleGuard?.(() => {
        if (finished || prepTimer) return true;
        const btn = root.querySelector(".aw-gs-gbtn");
        return !!(btn && btn.disabled);
      });

      if (timerMode === "countUp") runPrepCountdown();
      else {
        ui.startTimer();
        if (timerMode !== "none") gsSound.go();
        if (timerMode === "countDown") armCountdownTicks();
        startCycle();
      }

      function armFallback(fn, ms) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(fn, ms);
      }

      function renderShell() {
        root.innerHTML = "";
        const card = el("div", "aw-gs-card is-tap");
        const track = el("div", "aw-gs-track");
        track.append(el("div", "aw-gs-prompt"));
        card.append(track);
        card.append(el("div", "aw-gs-divider"));

        const grid = el("div", "aw-gs-groups");
        const n = groups.length;
        const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
        grid.style.setProperty("--gs-cols", String(cols));
        groups.forEach((g, i) => {
          const b = el("button", "aw-gs-gbtn");
          b.type = "button";
          b.style.setProperty("--tile", `var(--aw-tile-${i % 4})`);
          b.style.setProperty("--tile-dark", `var(--aw-tile-${i % 4}d)`);
          b.dataset.group = String(i);
          b.append(el("span", "aw-gs-gkey", String(i + 1)), el("span", "aw-gs-gtext", escapeHtml(g)));
          b.disabled = true;
          press(b, () => choose(i, b));
          grid.append(b);
        });
        card.append(grid);
        root.append(card);

        fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
          slack: root.clientWidth * 0.03,
          measure: () => track.offsetHeight + grid.scrollHeight
        });
        ui.setScore(liveScore());
        paintNav = updateNav;
        updateNav();
      }

      function updateNav() {
        const row = curIdx < 0 ? 0 : Math.min(total, order.indexOf(curIdx) + 1);
        ui.setNav({ index: Math.max(1, row), total, label: `${liveScore()} of ${total}`, onPrev: null, onNext: null });
      }

      function runPrepCountdown() {
        const promptEl = root.querySelector(".aw-gs-prompt");
        if (!promptEl) { ui.startTimer(); gsSound.go(); startCycle(); return; }
        promptEl.classList.add("is-countdown");
        let n = 3;
        const tick = () => {
          if (finished) return;
          promptEl.textContent = String(n);
          gsSound.clockTick();
          n--;
          if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
          prepTimer = setTimeout(() => {
            prepTimer = null;
            promptEl.classList.remove("is-countdown");
            promptEl.textContent = "";
            ui.startTimer();
            gsSound.go();
            startCycle();
          }, 1000);
        };
        tick();
      }

      function armCountdownTicks() {
        const at = [];
        for (let r = 10; r >= 6; r--) at.push(timerTotal - r);
        for (let r = 5; r >= 1; r -= 0.5) at.push(timerTotal - r);
        at.forEach(sec => {
          if (sec < 0) return;
          tickTimers.push(setTimeout(() => { if (!finished) gsSound.clockTick(); }, sec * 1000));
        });
      }

      function offscreenPx() { return Math.round((root.clientWidth || 1) * 1.15); }
      function lockButtons() { root.querySelectorAll(".aw-gs-gbtn").forEach(b => { b.disabled = true; }); }
      function unlockButtons() { root.querySelectorAll(".aw-gs-gbtn").forEach(b => { b.disabled = false; }); }

      function startCycle() {
        if (finished) return;
        if (!queue.length) { armFallback(() => finish("complete"), 400); return; }
        const promptEl = root.querySelector(".aw-gs-prompt");
        if (!promptEl) return;
        promptEl.style.visibility = "";
        curIdx = queue[0];
        promptEl.textContent = items[curIdx].text;
        const off = offscreenPx();
        promptEl.style.transform = `translateX(${-off}px)`;
        void promptEl.offsetWidth;
        gsSound.conveyorAppear();
        const enter = promptEl.animate(
          [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
          { duration: ENTER_MS, easing: "ease-out", fill: "forwards" });
        promptAnim = enter;
        lockButtons();
        if (gateTimer) clearTimeout(gateTimer);
        gateTimer = setTimeout(() => {
          if (finished || !queue.length) return;
          unlockButtons();
          updateNav();
        }, Math.round(ENTER_MS * 0.5));
        let done = false;
        const onEntered = () => {
          if (done) return; done = true;
          promptAnim = null;
          if (finished) return;
          gsSound.conveyorCentred();
          armCrawl();
        };
        enter.onfinish = onEntered;
        armFallback(onEntered, ENTER_MS + 100);
      }

      function armCrawl() {
        if (finished || !queue.length || !crawlMs) return;
        const promptEl = root.querySelector(".aw-gs-prompt");
        if (!promptEl) return;
        const off = offscreenPx();
        gsSound.conveyorLeave();
        const crawl = promptEl.animate(
          [{ transform: "translateX(0px)" }, { transform: `translateX(${off}px)` }],
          { duration: crawlMs, easing: "linear", fill: "forwards" });
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

      function haltPromptAnim() {
        if (promptAnim) {
          try { promptAnim.commitStyles(); } catch (e) { /* ignore */ }
          try { promptAnim.cancel(); } catch (e) { /* ignore */ }
          promptAnim = null;
        }
      }

      // Puts an item back at a RANDOM later spot (never slot 0). Removing from
      // the front is the CALLER's job (the True-false Đợt 179 split).
      function requeueRandom(idx) {
        if (!queue.length) { queue.push(idx); return; }
        const pos = 1 + Math.floor(Math.random() * queue.length);
        queue.splice(pos, 0, idx);
      }

      function onTimeUp() {
        if (finished || !queue.length) return;
        const idx = queue.shift();
        if (repeatUntilCorrect) requeueRandom(idx);
        else { state[idx].answered = true; state[idx].correct = false; state[idx].timedOut = true; }
        startCycle();
      }

      function exitPromptThenCall(cb) {
        const promptEl = root.querySelector(".aw-gs-prompt");
        haltPromptAnim();
        if (!promptEl) { cb(); return; }
        gsSound.conveyorLeave();
        const off = offscreenPx();
        const exit = promptEl.animate([{ transform: `translateX(${off}px)` }],
          { duration: EXIT_MS, easing: "ease-in", fill: "forwards" });
        promptAnim = exit;
        let done = false;
        const run = () => { if (done) return; done = true; promptAnim = null; if (!finished) cb(); };
        exit.onfinish = run;
        armFallback(run, EXIT_MS + 100);
      }

      // A CORRECT tap: a clone of the item flies INTO the tapped group button
      // (that is where it belongs), stars stream to the score, score ticks up.
      function flyPromptToButton(promptEl, btn, cb) {
        const host = document.fullscreenElement || document.body;
        let called = false;
        const done = () => { if (called) return; called = true; if (!finished) cb(); };
        const scoreEl = ui.scoreEl;
        if (!promptEl || !btn) { done(); return; }
        const from = promptEl.getBoundingClientRect();
        const to = btn.getBoundingClientRect();
        const cs = getComputedStyle(promptEl);
        const clone = el("div", "aw-gs-flyclone");
        clone.textContent = promptEl.textContent;
        clone.style.left = from.left + "px"; clone.style.top = from.top + "px";
        clone.style.width = from.width + "px"; clone.style.height = from.height + "px";
        clone.style.font = cs.font; clone.style.color = cs.color;
        host.appendChild(clone);
        promptEl.style.visibility = "hidden";
        const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        try {
          clone.animate([
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(0.55)`, opacity: 0.8, offset: 0.6 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0 }
          ], { duration: 560, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => clone.remove();
        } catch (e) { /* ignore */ }
        later(() => clone.remove(), 900);
        if (scoreEl) spawnStars(to, scoreEl.getBoundingClientRect());
        try {
          btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
            { duration: 360, easing: "ease-out", delay: 380 });
        } catch (e) { /* ignore */ }
        later(() => {
          if (finished) return;
          ui.setScore(liveScore());
          updateNav();
          try { scoreEl?.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 340, easing: "ease-out" }); } catch (e) { /* ignore */ }
        }, 420);
        later(done, 640);
      }

      function choose(gi, btn) {
        if (finished || !queue.length) return;
        if (btn.disabled) return;
        const idx = queue[0];
        const isRight = answerOf(items[idx]) === gi;
        ui.noteActivity?.();
        queue.shift();
        state[idx].answered = true;
        state[idx].chosen = gi;
        state[idx].timedOut = false;
        ui.roundDone?.();
        lockButtons();
        if (isRight) {
          state[idx].correct = true;
          gsSound.correct();
          flyMark(btn, true);
          const promptEl = root.querySelector(".aw-gs-prompt");
          haltPromptAnim();
          flyPromptToButton(promptEl, btn, () => { if (!queue.length) finish("complete"); else startCycle(); });
        } else {
          state[idx].correct = false;
          gsSound.wrong();
          flyMark(btn, false);
          if (pointsOff) chargePenalty(btn, pointsOff);
          const outOfLives = loseLife();
          if (repeatUntilCorrect) requeueRandom(idx);
          exitPromptThenCall(() => {
            if (outOfLives) finish("gameover");
            else if (!queue.length) finish("complete");
            else startCycle();
          });
        }
      }

      function onKey(e) {
        if (finished) return;
        const n = Number(e.key);
        if (!Number.isInteger(n) || n < 1 || n > groups.length) return;
        const btn = root.querySelector(`.aw-gs-gbtn[data-group="${n - 1}"]`);
        if (btn && !btn.disabled) { e.preventDefault(); choose(n - 1, btn); }
      }

      tapCleanup = () => {
        haltPromptAnim();
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
        if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
        tickTimers.forEach(clearTimeout); tickTimers.length = 0;
      };
      return function cleanupTap() {
        window.removeEventListener("keydown", onKey);
        tapCleanup();
        if (fitter) fitter.destroy();
      };
    }

    // =====================================================================
    // DRAG MODE — a pool of chips, N boxes, drag (or tap-then-tap) to place.
    // =====================================================================
    function mountDrag() {
      const instant = opt.dragCheck === "instant";
      const order = opt.shuffleQuestions === false ? items.map((_, i) => i) : shuffle(items.map((_, i) => i));
      reviewOrder = items.map((_, i) => i);
      const placed = items.map(() => null);   // group index each chip sits in, null = pool
      const locked = items.map(() => false);  // instant mode: correctly placed chips stay put
      let graded = false;
      let selected = null;                    // chip idx picked by a TAP, waiting for a box tap
      const chips = [];
      const activeClones = new Set();
      let dragging = null;

      root.innerHTML = "";
      const card = el("div", "aw-gs-card is-drag");
      const pool = el("div", "aw-gs-pool");
      const boxes = el("div", "aw-gs-boxes");
      const n = groups.length;
      boxes.style.setProperty("--gs-cols", String(n <= 4 ? n : 4));
      const boxEls = groups.map((g, i) => {
        const box = el("div", "aw-gs-box");
        box.style.setProperty("--tile", `var(--aw-tile-${i % 4})`);
        box.style.setProperty("--tile-dark", `var(--aw-tile-${i % 4}d)`);
        box.dataset.group = String(i);
        const head = el("div", "aw-gs-boxhead", escapeHtml(g));
        const body = el("div", "aw-gs-boxbody");
        box.append(head, body);
        // Tap-to-place: a chip selected by a tap lands here on a tap.
        press(box, () => { if (selected != null && !graded) placeChip(selected, i, true); });
        boxes.append(box);
        return box;
      });
      order.forEach(idx => {
        const chip = el("button", "aw-gs-chip", escapeHtml(items[idx].text));
        chip.type = "button";
        chip.dataset.idx = String(idx);
        chips[idx] = chip;
        attachDrag(chip, idx);
        pool.append(chip);
      });
      card.append(pool, boxes);
      root.append(card);
      paintNav = updateNav;
      updateNav();
      ui.setScore(liveScore());
      ui.setIdleGuard?.(() => finished || graded);
      ui.onSubmit(() => grade(true));
      ui.startTimer();
      if (timerMode !== "none") gsSound.go();

      function placedCount() { return placed.filter(p => p != null).length; }
      function updateNav() {
        ui.setNav({
          index: Math.max(1, placedCount()), total,
          label: graded ? `${liveScore()} of ${total}` : `${placedCount()} / ${total} placed`,
          onPrev: null, onNext: null
        });
      }

      function boxAt(x, y) {
        for (let i = 0; i < boxEls.length; i++) {
          const r = boxEls[i].getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
        }
        const pr = pool.getBoundingClientRect();
        if (x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom) return -1;   // back to the pool
        return null;
      }

      function setSelected(idx) {
        if (selected != null && chips[selected]) chips[selected].classList.remove("is-selected");
        selected = idx;
        if (idx != null && chips[idx]) chips[idx].classList.add("is-selected");
      }

      // Move chip `idx` into group `gi` (-1 = pool). `byTap` = came from tap-to-place.
      function placeChip(idx, gi, byTap) {
        if (finished || graded || locked[idx]) return;
        const chip = chips[idx];
        setSelected(null);
        if (gi === -1 || gi == null) {
          if (placed[idx] != null) { placed[idx] = null; pool.append(chip); }
          updateNav();
          return;
        }
        ui.noteActivity?.();
        placed[idx] = gi;
        boxEls[gi].querySelector(".aw-gs-boxbody").append(chip);
        chip.classList.remove("is-wrong");
        if (instant) {
          const ok = answerOf(items[idx]) === gi;
          state[idx].answered = true; state[idx].chosen = gi; state[idx].correct = ok;
          if (ok) {
            locked[idx] = true;
            chip.classList.add("is-correct");
            chip.append(badge(true));
            gsSound.correct();
            const scoreEl = ui.scoreEl;
            if (scoreEl) spawnStars(chip.getBoundingClientRect(), scoreEl.getBoundingClientRect());
            ui.setScore(liveScore());
            updateNav();
            if (locked.every(Boolean)) { later(() => finish("complete"), 500); return; }
          } else {
            gsSound.wrong();
            chip.classList.add("is-wrong");
            flyMark(chip, false);
            if (pointsOff) chargePenalty(chip, pointsOff);
            const outOfLives = loseLife();
            later(() => {
              if (finished) return;
              chip.classList.remove("is-wrong");
              placed[idx] = null;
              state[idx].answered = false; state[idx].chosen = null;
              pool.append(chip);
              updateNav();
              if (outOfLives) finish("gameover");
            }, 650);
          }
          updateNav();
          return;
        }
        updateNav();
        // "On submit": grade by itself once the last chip is placed.
        if (placedCount() === total) later(() => grade(false), 350);
      }

      function badge(ok) {
        return el("span", "aw-tile-badge aw-gs-badge" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      }

      // Submit-mode grading: every chip gets ✓/✗ where it sits; an unplaced chip
      // counts as unanswered (wrong). Then the summary after a beat.
      function grade(fromSubmit) {
        if (finished || graded) return;
        if (instant) { finish(fromSubmit ? "timesup" : "complete"); return; }
        graded = true;
        setSelected(null);
        let wrong = 0, right = 0;
        items.forEach((it, idx) => {
          const gi = placed[idx];
          const s = state[idx];
          s.chosen = gi; s.answered = gi != null;
          s.correct = gi != null && answerOf(it) === gi;
          const chip = chips[idx];
          chip.classList.add(s.correct ? "is-correct" : "is-wrong");
          chip.append(badge(s.correct));
          if (s.correct) right++; else wrong++;
        });
        if (right && !wrong) gsSound.correct(); else gsSound.wrong();
        ui.setScore(liveScore());
        updateNav();
        if (pointsOff && wrong) chargePenalty(null, pointsOff * wrong);
        later(() => finish(wrong === 0 ? "complete" : (fromSubmit ? "timesup" : "complete")), 1300);
      }

      // ---- drag (pointer events: mouse + touch); a short press = a TAP ----
      function attachDrag(chip, idx) {
        chip.style.touchAction = "none";
        let down = null, clone = null, moved = false;
        chip.addEventListener("pointerdown", e => {
          if (finished || graded || locked[idx] || dragging) return;
          if (e.button != null && e.button !== 0) return;
          e.preventDefault();
          down = { x: e.clientX, y: e.clientY, id: e.pointerId };
          moved = false;
          dragging = idx;
          const r = chip.getBoundingClientRect();
          const cs = getComputedStyle(chip);
          clone = chip.cloneNode(true);
          clone.classList.add("aw-gs-dragclone");
          clone.classList.remove("is-selected");
          clone.style.left = r.left + "px"; clone.style.top = r.top + "px";
          clone.style.width = r.width + "px"; clone.style.height = r.height + "px";
          clone.style.fontFamily = cs.fontFamily; clone.style.fontSize = cs.fontSize;
          clone.style.fontWeight = cs.fontWeight; clone.style.color = cs.color;
          clone.style.background = cs.background; clone.style.borderRadius = cs.borderRadius;
          clone.style.padding = cs.padding; clone.style.boxShadow = cs.boxShadow;
          clone.style.display = "none";
          down.offX = e.clientX - r.left; down.offY = e.clientY - r.top;
          (document.fullscreenElement || document.body).append(clone);
          activeClones.add(clone);
          try { chip.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        });
        chip.addEventListener("pointermove", e => {
          if (!down || e.pointerId !== down.id) return;
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (!moved && Math.hypot(dx, dy) < TAP_SLOP_PX) return;
          if (!moved) {
            moved = true;
            clone.style.display = "";
            chip.classList.add("is-dragsrc");
            gsSound.pickup();
          }
          clone.style.left = (e.clientX - down.offX) + "px";
          clone.style.top = (e.clientY - down.offY) + "px";
          const over = boxAt(e.clientX, e.clientY);
          boxEls.forEach((b, i) => b.classList.toggle("is-over", over === i));
        });
        const end = e => {
          if (!down || e.pointerId !== down.id) return;
          try { chip.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          boxEls.forEach(b => b.classList.remove("is-over"));
          chip.classList.remove("is-dragsrc");
          const wasMoved = moved;
          const x = e.clientX, y = e.clientY;
          down = null; dragging = null;
          if (clone) { clone.remove(); activeClones.delete(clone); clone = null; }
          if (finished || graded) return;
          if (!wasMoved) {
            // A TAP: select / unselect this chip (then a tap on a box places it).
            if (selected === idx) setSelected(null); else setSelected(idx);
            return;
          }
          const gi = boxAt(x, y);
          if (gi === null) return;            // dropped nowhere: stays where it was
          if (gi === -1) { placeChip(idx, -1, false); return; }
          if (placed[idx] === gi) return;     // same box: nothing changes
          placeChip(idx, gi, false);
        };
        chip.addEventListener("pointerup", end);
        chip.addEventListener("pointercancel", end);
      }

      return function cleanupDrag() {
        activeClones.forEach(c => c.remove());
        activeClones.clear();
      };
    }
  }
};

registerTemplate(gsTemplate);
export default gsTemplate;
