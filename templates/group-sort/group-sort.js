// =============================================================
// TEMPLATE: SPEED SORTING — Wordwall's "Speed sorting" + "Group sort" in ONE
// game. Built Đợt 288 (03/9/2026) as "Group sort" for the NEN TANG TIENG ANH
// course; Đợt 327 (14/9/2026) rebuilt the conveyor mode from thầy's mockup
// and renamed the template to "Speed sorting" (type id stays `group_sort` —
// every saved act and assignment keeps working).
//
// TWO MODES (options.mode):
//  • "tap"  (default) — SPEED SORTING, a real CONVEYOR BELT. Same-sized
//    coloured chips drift left→right across a lane at the top, on a loop;
//    below sit N dashed amber GROUP PILLS (no colours, no numbers — nothing
//    that hints at the answer). Press ANY chip and it is yours: a clone
//    follows the pointer while the chip's own slot keeps riding the belt.
//    Drop it on the right pill → ✓ bursts on the pill, stars fly to the
//    score. Drop it on a wrong pill → ✗ bursts there, a heart pops (if lives
//    are on), points off — and the item is SPENT either way (it does not
//    come back). Let go over nothing → the chip flies back to exactly where
//    its slot is now. Speed 1..10 = belt speed. Game complete when every
//    item has been dropped somewhere; time's up / out of hearts end it early.
//    (The option value stays "tap" so acts saved before Đợt 327 open in the
//    same mode they were saved in.)
//  • "drag" — GROUP SORT proper. EVERY item sits in a pool at the top; drag
//    each chip into its group box (or tap a chip, then tap a box).
//    options.dragCheck: "submit" = graded once the pool is empty or Submit is
//    pressed; "instant" = graded on every drop (a wrong chip shakes, costs a
//    heart/points and jumps back to the pool).
//
// DATA:  content.groups = [name, …] · content.items = [{ text, group: name }]
// A FLAT item list on purpose — "Start with mistakes" (itemsKey) and Show
// answers want one array of playable things. `group` is the NAME, not an
// index, so the editor can reorder groups without touching every item.
//
// Everything else follows CONG THUC MAU.md: lives in the top bar via
// ui.livesSlot, the 3-2-1 prep countdown with manualTimerStart, points-off
// through ui.flyPenalty. NOT built: Fight mode, Showdown, per-item voice,
// Change template conversions (see GHI CHU GROUP-SORT.md).
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
const TAP_SLOP_PX = 7;   // drag mode: a pointer that moved less than this is a TAP, not a drag
const BELT_SLOTS = 5;    // belt mode: chip slots kept alive on the belt at once

// Menu pause (Đợt 328) — bridges the CURRENT mount's belt pause/resume pair
// out to the template-level `onPause` hook engine.js calls when the ☰ menu
// opens/closes. Module-level single, same pattern as maze-chase's
// `mazePauseHandlers`: AWord only ever mounts one activity at a time. The
// engine's own step (pausing every WAAPI `.animate()` under the stage) does
// NOT reach the belt — it moves via a plain requestAnimationFrame loop, not
// `.animate()` — so without this the conveyor kept drifting behind the dim.
let gsPauseHandlers = null;
const CHIP_COLOURS = 5;  // belt mode: theme tiles 0..3 + the template's own purple

// Belt speed 1..10 -> lane-widths per second (3 ≈ the pace thầy approved).
function beltFractionFor(speed) {
  return 0.06 + (speed - 1) * 0.03;
}

// options.speed for the belt: 1..10; anything else (incl. the old "0 =
// wait", which has no meaning on a belt that must keep moving) = 3.
function normSpeed(v) {
  const n = Number.isInteger(v) ? v : 0;
  return n >= 1 ? Math.min(10, n) : 3;
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
  name: "Speed sorting",
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

  // See `gsPauseHandlers` above: only the belt mode has anything of its own
  // to pause (drag mode has no timer/animation outside the engine's reach).
  onPause(paused) {
    if (!gsPauseHandlers) return;
    if (paused) gsPauseHandlers.pause(); else gsPauseHandlers.resume();
  },

  sounds: {
    play: gsSound.intro,
    restart: gsSound.restart,
    complete: () => {}   // this file picks Completed / GameOver itself
  },

  buildExtraOptions({ panel, draft, mkSliderCell, mkSeg, mkCell }) {
    const mode = mkCell({ label: "Mode" });
    mode.ctl.append(mkSeg([
      { value: "tap", label: "Speed sorting", title: "Items ride a conveyor belt — grab each one and drop it into its group" },
      { value: "drag", label: "Group sort", title: "Every item in a pool — drag each into its box" }
    ], draft.mode === "drag" ? "drag" : "tap", v => { draft.mode = v; }));

    const speed = mkSliderCell({
      label: "Speed", sub: "belt", min: 1, max: 10, step: 1,
      value: normSpeed(draft.speed), tone: "blue",
      fmt: v => String(v),
      onInput: v => { draft.speed = v; }
    });
    speed.cell.title = "Speed sorting only: how fast the belt moves (1 = slow, 10 = fastest)";

    const curLives = normLives(draft.lives) || 0;
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: curLives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }
    });
    lives.cell.title = "0 = unlimited lives";

    const check = mkCell({ label: "Checking", sub: "group sort" });
    check.ctl.append(mkSeg([
      { value: "submit", label: "On submit", title: "Graded once every chip is placed (or Submit is pressed)" },
      { value: "instant", label: "Instantly", title: "Every drop is graded at once; a wrong chip returns to the pool" }
    ], draft.dragCheck === "instant" ? "instant" : "submit",
      v => { draft.dragCheck = v; }));

    panel.append(mode.cell, speed.cell, lives.cell, check.cell);
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

    // Review rows — one per item, in play order (belt) / content order (drag).
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
                  answered: review.filter(r => r.answered).length,
                  title: reason === "gameover" ? "Game over" : undefined });
    }

    let paintNav = () => {};
    let tapCleanup = null;
    let cleanupMode = () => {};
    gsPauseHandlers = null;   // this mount's own, until mountBelt() (if any) sets it

    if (mode === "drag") cleanupMode = mountDrag();
    else cleanupMode = mountBelt();

    return function cleanup() {
      finished = true;
      timers.forEach(clearTimeout); timers.length = 0;
      cleanupMode();
      gsPauseHandlers = null;
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-gs-flyclone, .aw-gs-star, .aw-gs-dragclone").forEach(n => n.remove());
    };

    // =====================================================================
    // BELT MODE (options.mode "tap") — the conveyor: same-sized chips ride
    // left→right on a loop; press one, drop it on a dashed pill below.
    // Positions are plain layout px kept in JS (`chip.x`) and applied as a
    // transform each frame — NOT flex — because a held chip's slot must keep
    // moving in step with its neighbours while the chip itself is off with
    // the pointer, or it would land on top of one when it came back.
    // =====================================================================
    function mountBelt() {
      const speedFrac = beltFractionFor(normSpeed(opt.speed));
      const order = opt.shuffleQuestions === false ? items.map((_, i) => i) : shuffle(items.map((_, i) => i));
      reviewOrder = order;
      const pool = [...order];          // items not yet dropped anywhere
      let poolCursor = 0;
      const onBelt = new Set();         // item indices currently occupying a slot
      const played = [];                // item indices in the order they were dropped
      let belt = [];                    // { el, x, itemIdx, held }
      let chipW = 0, chipH = 0, chipGap = 0, colourCursor = 0;
      let rafId = null, lastTime = null, running = false;
      let prepTimer = null, fitter = null, drag = null;
      const tickTimers = [];
      let lane, pills, pillEls = [];

      ui.onSubmit(() => finish("timesup"));
      renderShell();
      ui.setIdleGuard?.(() => finished || !running);

      if (timerMode === "countUp") runPrepCountdown();
      else {
        ui.startTimer();
        if (timerMode !== "none") gsSound.go();
        if (timerMode === "countDown") armCountdownTicks();
        startBelt();
      }

      function renderShell() {
        root.innerHTML = "";
        const card = el("div", "aw-gs-card is-belt");
        const railTop = el("div", "aw-gs-rail");
        lane = el("div", "aw-gs-lane");
        const railMid = el("div", "aw-gs-rail");
        pills = el("div", "aw-gs-pills");
        // The pill ROW is a non-stretched child of the stretched .aw-gs-pills,
        // so its offsetHeight is the TRUE content height for autoFit (a
        // stretched box's scrollHeight == its box height — the fit.js trap).
        const pillRow = el("div", "aw-gs-pillrow");
        pillEls = groups.map((g, i) => {
          const p = el("div", "aw-gs-pill");
          p.dataset.group = String(i);
          p.append(el("span", "aw-gs-pilltext", escapeHtml(g)));
          pillRow.append(p);
          return p;
        });
        pills.append(pillRow);
        card.append(railTop, lane, railMid, pills);
        root.append(card);

        const outer = n => {
          const cs = getComputedStyle(n);
          return n.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        };
        fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
          slack: root.clientWidth * 0.02,
          measure: () => {
            const cs = getComputedStyle(card), ps = getComputedStyle(pills);
            return outer(railTop) + outer(lane) + outer(railMid)
                 + pillRow.offsetHeight + parseFloat(ps.paddingTop) + parseFloat(ps.paddingBottom)
                 + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
          }
        });
        ui.setScore(liveScore());
        paintNav = updateNav;
        updateNav();
      }

      function updateNav() {
        ui.setNav({ index: Math.max(1, played.length), total, label: `${liveScore()} of ${total}`, onPrev: null, onNext: null });
      }

      function runPrepCountdown() {
        const count = el("div", "aw-gs-count");
        lane.append(count);
        let n = 3;
        const tick = () => {
          if (finished) return;
          count.textContent = String(n);
          gsSound.clockTick();
          n--;
          if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
          prepTimer = setTimeout(() => {
            prepTimer = null;
            count.remove();
            ui.startTimer();
            gsSound.go();
            startBelt();
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

      // ---- the belt ----
      // Every chip is the SAME fixed size, so one hidden probe gives the box
      // in LAYOUT px (offsetWidth, not getBoundingClientRect — the zoom
      // fullscreen scales the stage, and chip.x lives in unscaled px).
      function measureChip() {
        const probe = el("div", "aw-gs-bchip is-probe");
        lane.append(probe);
        chipW = probe.offsetWidth; chipH = probe.offsetHeight;
        probe.remove();
        chipGap = chipW * 0.16;
      }

      // Đợt 329 — ONE font size for all chips, the LARGEST at which EVERY item
      // still fits the fixed box. Binary search over K (font = K × --aw-u) with a
      // probe chip: at each K every text is laid out naturally (no clamp) and
      // must fit both the content height and width. ≤150 items × 9 steps of
      // layout reads, once per play — cheap. Written as `calc(K * var(--aw-u))`
      // so it keeps scaling with the stage (fullscreen, phone).
      function fitChipFont() {
        const card = root.querySelector(".aw-gs-card");
        const u = parseFloat(getComputedStyle(lane).getPropertyValue("--aw-u")) || 1;
        const probe = el("div", "aw-gs-bchip is-probe");
        const span = el("span", "aw-gs-bchiptext");
        probe.append(span);
        lane.append(probe);
        const cs = getComputedStyle(probe);
        const availH = probe.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const availW = probe.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const fitsAll = k => {
          probe.style.fontSize = (k * u) + "px";
          for (let i = 0; i < items.length; i++) {
            span.textContent = items[i].text;
            if (span.scrollHeight > availH + 0.5 || span.scrollWidth > availW + 0.5) return false;
          }
          return true;
        };
        let lo = 1.0, hi = 3.6, best = lo;
        if (fitsAll(hi)) best = hi;
        else {
          for (let s = 0; s < 9; s++) {
            const mid = (lo + hi) / 2;
            if (fitsAll(mid)) { best = mid; lo = mid; } else hi = mid;
          }
        }
        probe.remove();
        card?.style.setProperty("--gs-chipfont", `calc(${best.toFixed(3)} * var(--aw-u))`);
      }

      function paintChip(chip, idx) {
        const k = colourCursor % CHIP_COLOURS; colourCursor++;
        chip.el.style.setProperty("--tile", k < 4 ? `var(--aw-tile-${k})` : "var(--aw-gs-tile-4)");
        chip.el.style.setProperty("--tile-dark", k < 4 ? `var(--aw-tile-${k}d)` : "var(--aw-gs-tile-4d)");
        chip.el.innerHTML = "";
        const t = el("span", "aw-gs-bchiptext");
        t.textContent = items[idx].text;
        chip.el.append(t);
        chip.itemIdx = idx;
      }

      function positionChip(c) { c.el.style.transform = `translate(${c.x}px, -50%)`; }

      // Next pool item that is NOT already on another slot — null once every
      // remaining item is already visible (or none is left).
      function nextItemForSlot() {
        if (!pool.length) return null;
        for (let k = 0; k < pool.length; k++) {
          const idx = pool[poolCursor % pool.length];
          poolCursor++;
          if (!onBelt.has(idx)) return idx;
        }
        return null;
      }

      function startBelt() {
        if (finished) return;
        measureChip();
        fitChipFont();
        const count = Math.min(BELT_SLOTS, pool.length);
        let x = chipGap;
        for (let i = 0; i < count; i++) {
          const idx = pool[poolCursor % pool.length]; poolCursor++;
          onBelt.add(idx);
          const chip = { el: el("div", "aw-gs-bchip"), x, itemIdx: idx, held: false };
          paintChip(chip, idx);
          positionChip(chip);
          attachDrag(chip);
          lane.append(chip.el);
          belt.push(chip);
          x += chipW + chipGap;
        }
        running = true;
        lastTime = null;
        rafId = requestAnimationFrame(loop);
      }

      // Đợt 328 — the ☰ Menu dims the stage but does NOT reach a plain
      // requestAnimationFrame loop (only WAAPI `.animate()` calls), so
      // without this bridge the belt kept drifting behind the dim. Bridged
      // to the template-level `onPause` hook via `gsPauseHandlers` above.
      function pauseGame() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        running = false;
      }
      function resumeGame() {
        if (finished || prepTimer || !belt.length) return;   // over, still counting in, or nothing left to run
        running = true;
        lastTime = null;
        rafId = requestAnimationFrame(loop);
      }
      gsPauseHandlers = { pause: pauseGame, resume: resumeGame };

      // Every chip drifts — a HELD one too (its slot stays in sequence).
      // Whatever has fully left the right edge comes back in from the left
      // with the next item; a held chip is never recycled.
      function loop(now) {
        if (finished || !running) return;
        if (lastTime == null) lastTime = now;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const laneW = lane.clientWidth || 1;
        const speed = laneW * speedFrac;
        let minX = Infinity;
        belt.forEach(c => {
          c.x += speed * dt;
          positionChip(c);
          if (c.x < minX) minX = c.x;
        });
        const exited = belt.filter(c => !c.held && c.x > laneW + chipGap);
        exited.forEach(c => {          // one at a time, so two exits on one frame never stack
          recycle(c, minX);
          if (c.x < minX) minX = c.x;
        });
        rafId = requestAnimationFrame(loop);
      }

      function recycle(chip, minX) {
        onBelt.delete(chip.itemIdx);
        const nextIdx = nextItemForSlot();
        if (nextIdx == null) { retireSlot(chip); return; }
        onBelt.add(nextIdx);
        // Behind the leftmost chip — but NEVER inside the lane: when the belt
        // has thinned out, minX can be well inside, and a chip placed just
        // behind it would pop into view instead of sliding in from the edge
        // (thầy saw exactly that, Đợt 329).
        chip.x = Math.min(minX - chipW - chipGap, -chipW - chipGap);
        paintChip(chip, nextIdx);
        positionChip(chip);
      }

      function retireSlot(chip) {
        chip.el.remove();
        belt = belt.filter(b => b !== chip);
      }

      // A dropped chip (right OR wrong) is spent: out of the pool for good,
      // and its slot picks up the next item from off the left edge.
      function consume(chip) {
        const pi = pool.indexOf(chip.itemIdx);
        if (pi >= 0) pool.splice(pi, 1);
        onBelt.delete(chip.itemIdx);
        played.push(chip.itemIdx);
        const playedSet = new Set(played);
        reviewOrder = played.concat(order.filter(i => !playedSet.has(i)));
        const nextIdx = nextItemForSlot();
        if (nextIdx == null) {
          retireSlot(chip);
        } else {
          onBelt.add(nextIdx);
          let minX = Infinity;
          belt.forEach(b => { if (b.x < minX) minX = b.x; });
          chip.x = Math.min(minX - chipW - chipGap, -chipW - chipGap);
          paintChip(chip, nextIdx);
          positionChip(chip);
          chip.held = false;
          chip.el.classList.remove("is-held");
        }
        updateNav();
      }

      // ---- drag: press ANY chip → a fixed clone follows the pointer ----
      // Move/up/cancel are listened for on WINDOW for the whole drag, so a
      // release anywhere (even after pointer capture is lost) ends it.
      function attachDrag(chip) {
        chip.el.addEventListener("pointerdown", e => {
          if (finished || !running || chip.held || drag) return;
          if (e.button != null && e.button !== 0) return;
          e.preventDefault();
          startDrag(chip, e);
        });
      }

      function startDrag(chip, e) {
        const src = chip.el;
        const r = src.getBoundingClientRect();
        const cs = getComputedStyle(src);
        chip.held = true;
        src.classList.add("is-held");
        ui.noteActivity?.();
        gsSound.pickup();

        // The clone lives on <body>/fullscreen host, outside the stage, where
        // --aw-u does not exist — so every unit-derived size is copied in px.
        const clone = src.cloneNode(true);
        clone.className = "aw-gs-dragclone is-belt";
        clone.style.cssText = "";
        clone.style.left = r.left + "px"; clone.style.top = r.top + "px";
        clone.style.width = r.width + "px"; clone.style.height = r.height + "px";
        clone.style.background = cs.backgroundColor;
        clone.style.borderRadius = cs.borderRadius;
        clone.style.border = cs.border;
        clone.style.padding = cs.padding;
        clone.style.fontFamily = cs.fontFamily;
        clone.style.fontSize = cs.fontSize;
        clone.style.fontWeight = cs.fontWeight;
        clone.style.lineHeight = cs.lineHeight;
        clone.style.color = cs.color;
        clone.style.textShadow = cs.textShadow;
        (document.fullscreenElement || document.body).append(clone);

        const pillRects = pillEls.map(p => p.getBoundingClientRect());
        drag = {
          chip, clone, id: e.pointerId,
          offX: e.clientX - r.left, offY: e.clientY - r.top,
          pillRects, lastX: e.clientX, lastY: e.clientY
        };
        try { src.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        window.addEventListener("pointermove", onDragMove);
        window.addEventListener("pointerup", onDragUp);
        window.addEventListener("pointercancel", onDragUp);
        document.addEventListener("visibilitychange", onHidden);
      }

      function pillAt(x, y, rects) {
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
        }
        return -1;
      }

      function onDragMove(e) {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        d.lastX = e.clientX; d.lastY = e.clientY;
        d.clone.style.left = (e.clientX - d.offX) + "px";
        d.clone.style.top = (e.clientY - d.offY) + "px";
        const over = pillAt(e.clientX, e.clientY, d.pillRects);
        pillEls.forEach((p, i) => p.classList.toggle("is-over", over === i));
      }

      function onDragUp(e) {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        endDrag(e.clientX, e.clientY);
      }

      // The tab going hidden mid-drag (app switch on a phone) ends it where
      // the pointer last was. NOT window blur: any focus flicker (a screenshot
      // tool, a system dialog) would drop the chip while the finger is still
      // down.
      function onHidden() {
        if (document.hidden && drag) endDrag(drag.lastX, drag.lastY);
      }

      function unhookDrag() {
        window.removeEventListener("pointermove", onDragMove);
        window.removeEventListener("pointerup", onDragUp);
        window.removeEventListener("pointercancel", onDragUp);
        document.removeEventListener("visibilitychange", onHidden);
      }

      function endDrag(x, y) {
        const d = drag;
        drag = null;
        unhookDrag();
        try { d.chip.el.releasePointerCapture(d.id); } catch (err) { /* ignore */ }
        pillEls.forEach(p => p.classList.remove("is-over"));
        if (finished) { d.clone.remove(); return; }

        const chip = d.chip, clone = d.clone;
        const gi = pillAt(x, y, d.pillRects);
        if (gi < 0) { flyBackToBelt(chip, clone); return; }

        const idx = chip.itemIdx;
        const pill = pillEls[gi];
        const isRight = answerOf(items[idx]) === gi;
        clone.remove();
        state[idx].answered = true;
        state[idx].chosen = gi;
        state[idx].timedOut = false;
        state[idx].correct = isRight;
        ui.noteActivity?.();
        ui.roundDone?.();
        if (isRight) {
          gsSound.correct();
          flyMark(pill, true);
          pill.classList.add("is-correct");
          later(() => pill.classList.remove("is-correct"), 550);
          const scoreEl = ui.scoreEl;
          if (scoreEl) spawnStars(pill.getBoundingClientRect(), scoreEl.getBoundingClientRect());
          consume(chip);
          later(() => {
            if (finished) return;
            ui.setScore(liveScore());
            updateNav();
            try { scoreEl?.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 340, easing: "ease-out" }); } catch (e) { /* ignore */ }
          }, 420);
          if (!pool.length && !belt.length) later(() => finish("complete"), 700);
        } else {
          gsSound.wrong();
          flyMark(pill, false);
          pill.classList.add("is-wrong");
          later(() => pill.classList.remove("is-wrong"), 480);
          if (pointsOff) chargePenalty(pill, pointsOff);
          const outOfLives = loseLife();
          consume(chip);
          if (outOfLives) { later(() => finish("gameover"), 500); return; }
          if (!pool.length && !belt.length) later(() => finish("complete"), 700);
        }
      }

      // Let go over nothing: the clone flies to where the chip's slot is
      // RIGHT NOW (re-read every frame — the slot kept drifting), then the
      // real chip shows again and carries on. A slot that already left the
      // lane re-enters from the left like any recycled chip instead.
      function flyBackToBelt(chip, clone) {
        const laneW = lane.clientWidth || 1;
        let done = false;
        const finishFly = () => {
          if (done) return; done = true;
          clone.remove();
          chip.held = false;
          chip.el.classList.remove("is-held");
        };
        if (chip.x + chipW > laneW) {
          let minX = Infinity;
          belt.forEach(b => { if (b !== chip && b.x < minX) minX = b.x; });
          chip.x = Math.min(isFinite(minX) ? minX - chipW - chipGap : 0, -chipW - chipGap);
          positionChip(chip);
          const f0 = performance.now();
          const fade = now => {
            if (finished) { finishFly(); return; }
            const p = Math.min(1, (now - f0) / 180);
            clone.style.opacity = String(1 - p);
            if (p < 1) requestAnimationFrame(fade); else finishFly();
          };
          requestAnimationFrame(fade);
          return;
        }
        const startL = parseFloat(clone.style.left) || 0, startT = parseFloat(clone.style.top) || 0;
        const t0 = performance.now(), DUR = 260;
        const step = now => {
          if (finished) { finishFly(); return; }
          const p = Math.min(1, (now - t0) / DUR);
          const ease = 1 - Math.pow(1 - p, 3);
          const lr = lane.getBoundingClientRect();
          const k = lr.width / (lane.clientWidth || 1);   // zoom-fullscreen scale
          const tl = lr.left + chip.x * k;
          const tt = lr.top + lr.height / 2 - (chipH * k) / 2;
          clone.style.left = (startL + (tl - startL) * ease) + "px";
          clone.style.top = (startT + (tt - startT) * ease) + "px";
          clone.style.transform = `scale(${1.04 - 0.04 * ease})`;
          if (p < 1) requestAnimationFrame(step); else finishFly();
        };
        requestAnimationFrame(step);
      }

      tapCleanup = () => {
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
        tickTimers.forEach(clearTimeout); tickTimers.length = 0;
        if (drag) { const d = drag; drag = null; unhookDrag(); d.clone.remove(); }
      };
      return function cleanupBelt() {
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
