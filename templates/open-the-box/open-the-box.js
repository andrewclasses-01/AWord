// =============================================================
// TEMPLATE: OPEN THE BOX — Wordwall style, English UI.
//
// ONE mode only (30/7/2026, teacher's call — the old open-ended "Simple"
// mode has been removed): tap a box (Ô SỐ) -> it zooms into a full
// Quiz-style question+answers screen (Ô CÂU HỎI). Every question is
// REQUIRED to have at least 2 answers with one marked correct (see
// `MIN_ANSWERS` below and `open-the-box-editor.js`).
//
// TIMER MODEL (rewritten 30/7/2026, đợt 9; amended 31/7/2026, đợt 11 —
// teacher's call): ONE shared countdown, started the first time ANY box is
// opened. A WRONG answer does NOT reset it — it just keeps draining
// continuously, through question screens AND while sitting at the grid
// choosing the next box, never pausing. A CORRECT answer resets the bar
// back to full (visible "refill" animation) and then PAUSES it there — it
// does NOT resume counting down until the player opens the NEXT box (đợt 11
// change: "đồng hồ reset và chỉ bắt đầu tiếp tục tính khi bấm chọn ô câu hỏi
// tiếp theo" — đợt 9 had it resume immediately instead, even while still
// sitting at the grid deciding). If it reaches 0 at any point while actually
// running (mid-question, or sitting at the grid after a wrong answer), the
// round ends immediately ("Game over"). Finishing every box before that
// happens ends the round as a win ("Game complete"). Both call
// `ui.finish()`, giving Open the box the SAME ending flow as Quiz/Anagram:
// Leaderboard / Show answers / Start again / Play a different template,
// Score + Time.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el, formatTime } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { otbSound } from "./otb-sound.js";
import { openOtbEditor } from "./open-the-box-editor.js";

const MIN_ANSWERS = 2;

// Question screen text sizing (teacher's request, 1/8/2026; evolved across the
// day: 2.4 was too big + broke words -> 1.5 width-aware shared fit -> now a
// PER-TILE fit). Each tile fits its OWN text between FIT_MIN and FIT_MAX, so a
// short word grows to ~50% bigger than base while a long word (e.g.
// "Meteorologist") shrinks ONLY its own tile until it sits inside the padding
// with a margin — never cartoonishly big, never touching the edge, never
// broken mid-word. See setupFit().
const FIT_MAX = 1.5;
const FIT_MIN = 0.4;

// Zoom animation timing (Ô SỐ <-> Ô CÂU HỎI) — both directions share the
// same speed. Doubled (30/7/2026, đợt 9, teacher's call: "chậm hơn gấp đôi
// và mượt") from the đợt 5/6 values of 600/420.
const ZOOM_TRANSFORM_MS = 1200;
const ZOOM_OPACITY_MS = 840;
const ZOOM_FALLBACK_MS = ZOOM_TRANSFORM_MS + 80;

// Đợt 25 (7/8/2026, teacher: "vài frame cuối hơi khựng và giật"). The corner
// rounding (point 2 of đợt 21) is the ONE part of the zoom the compositor
// can't run: `border-radius` forces the browser to REPAINT the whole tile on
// every single frame, and that repaint gets more expensive the BIGGER the tile
// is — i.e. worst exactly at the end of the open. So the radius now only
// animates over the CHEAP part of each flight (the first 45% of the OPEN,
// while the tile is still small; the LAST 45% of the CLOSE, once it has shrunk
// back down), leaving the other 55% as a pure transform+opacity animation the
// compositor can carry on its own. The rendered corner still travels smoothly
// between the box's radius and the tile's own, and still LANDS on exactly the
// box's radius — see zoomElFrom/zoomElTo.
const ZOOM_RADIUS_MS = Math.round(ZOOM_TRANSFORM_MS * 0.45);

// Grid "pop in" entrance (teacher's request). Right after Play, the WHOLE
// staggered sequence is timed to match ./sounds/intro.mp3's real length
// (measured with ffmpeg: 2.46s) so the last box settles right as the music
// ends. Every LATER return to the grid (after answering a question) plays
// the same pop, just much quicker — it shouldn't slow gameplay down.
const ENTRANCE_MUSIC_MS = 2460;
const ENTRANCE_BOX_MS_FIRST = 900;
const ENTRANCE_RETURN_TOTAL_MS = 550;
const ENTRANCE_BOX_MS_RETURN = 320;

// Per-tile stagger (ms) shared by BOTH the answer tiles' entrance slide-in
// and their exit slide-out, so the two cascades feel symmetric. The tiles'
// own slide durations live in open-the-box.css (`aw-otb-qtile-in` AND
// `aw-otb-qtile-out` keyframes — both real ANIMATIONS, not transitions; see
// the long comment on `.is-closing` there for why a transition silently
// doesn't work here) — both set to `1.2s`, matching ZOOM_TRANSFORM_MS below
// EXACTLY (teacher's request, đợt 12: "2 khoảng animation hoàn toàn bằng
// nhau" — the tiles run AT THE SAME TIME as the question card's zoom, not
// before/after it; keep all three in sync if any of them changes).
const TILE_STAGGER_MS = 45;

// CLOSE only (teacher's request, đợt 15): hold the number boxes' fade-in
// back by this long before it starts — on the close they were reappearing a
// touch too early (right as the question tile began shrinking). Delaying the
// START makes them come in later; the fade's DURATION is shortened by the
// same amount in JS so it still finishes exactly as the question card is
// removed at ZOOM_TRANSFORM_MS (no snap). The OPEN fade-out is unchanged
// (no delay) — the teacher was happy with that direction.
const CLOSE_BOX_FADE_DELAY_MS = 400;

// Correct-answer timer "refill" (teacher's request, đợt 9): the bar visibly
// fills back up to full over this long before the fresh full-length
// countdown resumes.
const REFILL_MS = 500;

// Last 5 seconds: the bar turns red and the tick sound doubles in frequency
// (every 0.5s instead of every 1s) — teacher's request, đợt 9.
const WARNING_SECONDS = 5;

// A plain GREEN check (solved-box badge) and a grey padlock (locked-box
// badge) — NOT core/icons.js's markCheck/markCross, which are hard-coded
// white-on-dark-outline (made for flying up over a COLOURED tile), so their
// CSS `color` can't be recoloured. These two sit on a plain white/grey card
// background instead, so a simple currentColor stroke/fill works and CAN be
// recoloured from CSS.
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
// by ANSWER position for the answer tiles (same as Quiz).
// Đợt 25 (7/8/2026, teacher's request): the bottom bar's Prev/Next slot has
// been empty since đợt 24 removed the nav from this game (a "tap any box" game
// has no linear order to walk). The teacher asked for the brand line to sit
// there instead — passed to the engine as ui.setNav({label}) (same route
// Running word/team use), styled small + grey + spaced in open-the-box.css.
const SLOGAN = "OPEN THE BOX IN ANDREW CLASSES";

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

// Size + colour the box grid. `explicitCols` comes from options.columns
// (teacher override); null lets bestFit() decide. `.aw-otb-grid` is a
// FLEXBOX wrap (not CSS Grid, changed 30/7/2026 đợt 10 — see the comment on
// `.aw-otb-grid` in open-the-box.css for why) — `justify-content:center`
// there centres every wrapped row automatically, including a partial last
// row, so this function only needs to size the boxes; no per-row placement
// math needed here any more.
function layoutGrid(root, total, explicitCols) {
  const grid = root.querySelector(".aw-otb-grid");
  if (!grid) return;
  // WIDTH comes from the PARENT (.aw-otb-card), not grid.clientWidth: once
  // the fix below runs, the grid's own width is deliberately pinned to an
  // exact value, so re-measuring from itself on the next call would just
  // read back its own last result instead of "how much space is actually
  // available". Height is unaffected (the grid still flex-grows to fill it).
  const w = grid.parentElement.clientWidth, h = grid.clientHeight;
  if (w <= 0 || h <= 0) return;
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
  const cols = explicitCols || bestFit(w, h, gap, total).cols;
  const rows = Math.ceil(total / cols);
  const size = Math.max(0, Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows));
  grid.style.setProperty("--cols", cols);
  grid.style.setProperty("--cell", size + "px");
  // Pin the container's own width to EXACTLY what `cols` boxes need — see
  // the long comment on `.aw-otb-grid` in open-the-box.css for why this is
  // required for flex-wrap to actually break rows at `cols` items instead
  // of packing in extras whenever `size` ends up smaller than a pure
  // width/cols division would give (happens whenever HEIGHT is the binding
  // constraint, e.g. a wide-but-short stage with few rows of many boxes).
  grid.style.width = (cols * size + Math.max(0, cols - 1) * gap) + "px";
  // Number size tracks the ACTUAL box size (not the stage width like a plain
  // cqw value would) so it stays as large as possible while still fitting a
  // 2-digit number, whether there are 4 boxes or 100.
  grid.style.setProperty("--num-size", (size * 0.46) + "px");
  // Point 3 (4/8/2026): the solved/locked box back-face text (question +
  // answer) is ALSO sized off the real cell — a stage-relative cqw stayed the
  // same as boxes shrank and overflowed. This is the MAX; fitBackFaces() then
  // shrinks per box so long questions fit fully inside.
  grid.style.setProperty("--back-size", (size * 0.12) + "px");

  grid.querySelectorAll(".aw-otb-box").forEach((box, i) => {
    const p = PALETTE[(i % cols) % PALETTE.length];   // colour cycles by LOGICAL column (still meaningful purely as a colour-variety grouping, independent of the flex layout mechanism)
    box.style.setProperty("--otb-c", p.c);
    box.style.setProperty("--otb-d", p.d);
  });
}

// Point 3 (4/8/2026): shrink each OPENED box's back-face text (question +
// correct answer) until it fits fully inside that box. --back-size (set in
// layoutGrid) already scales with the cell; this per-box --back-fit multiplier
// then guarantees even a long question shows in full instead of being clipped
// by the face's overflow:hidden. Only runs on flipped boxes (few, and only
// after a box is answered / on resize), so cost stays tiny. Measures FLOW
// content height (q + gap + a) against the padded face minus room reserved for
// the tick/lock badge, and each text line's own overflow for a long word.
function fitBackFaces(root) {
  root.querySelectorAll(".aw-otb-box.is-open .aw-otb-face-back").forEach(face => {
    const q = face.querySelector(".aw-otb-back-q");
    const a = face.querySelector(".aw-otb-back-a");
    if (!q && !a) return;
    const badge = face.querySelector(".aw-otb-solved-tick");
    const cs = getComputedStyle(face);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const apply = s => face.style.setProperty("--back-fit", s);
    const contentH = () => {
      const gap = parseFloat(getComputedStyle(face).rowGap) || 0;
      return (q ? q.offsetHeight : 0) + (a ? a.offsetHeight : 0) + (q && a ? gap : 0);
    };
    // leave room under the text for the badge so the last line never sits on it
    const reserve = () => (badge ? badge.offsetHeight + 2 : 0);
    const overW = () => (q && q.scrollWidth > q.clientWidth + 1) || (a && a.scrollWidth > a.clientWidth + 1);
    const overH = () => contentH() > (face.clientHeight - padY - reserve());
    const over = () => overH() || overW();
    apply(1);
    if (!over()) return;
    let lo = 0.2, hi = 1, best = 0.2;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      apply(mid);
      if (over()) hi = mid; else { best = mid; lo = mid; }
    }
    apply(best);
    // width guarantee for a single unbreakable long word (same idea as the
    // in-question fitOne): drop past the floor until it sits on one line.
    let f = best;
    const HARD_MIN = 0.1;
    for (let i = 0; i < 8 && overW() && f > HARD_MIN; i++) {
      const el = (q && q.scrollWidth > q.clientWidth + 1) ? q : a;
      f = Math.max(HARD_MIN, f * (el.clientWidth / Math.max(el.scrollWidth, 1)) * 0.95);
      apply(f);
    }
  });
}

const otbTemplate = {
  type: "open_the_box",
  scorable: true,   // every play is scored now that Simple mode is gone
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  name: "Open the box",

  // Opt-in: put THIS template's per-question timer bar on the SAME row as
  // the engine's score display (ui.topbarMid) instead of a row below it —
  // see core/engine.js / core/app.css ".has-inline" (30/7/2026, teacher's
  // call, scoped so no other template's topbar layout changes).
  inlineTimerBar: true,

  // Only the Intro chime plays on Play (30/7/2026, đợt 9 — the teacher
  // heard 2 sounds at once and asked for just the one; the earlier
  // shuffle-on-mount sound has been removed, see mountQuestions()).
  sounds: {
    play: otbSound.intro,
    restart: otbSound.restart
  },

  // The teacher builds/edits content here (mirrors quiz-editor.js/anagram-editor.js).
  edit: openOtbEditor,

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.question)
      .map(it => ({
        clue: it.question,
        answer: (it.answers || []).find(a => a.correct)?.text || (it.answers || [])[0]?.text || ""
      }));
  },

  buildExtraOptions({ panel, draft }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Question time"));
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
    return mountQuestions(root, activity, ui);
  }
};

// =============================================================
// tap a box -> Quiz-style answer screen. See the file header for the timer
// model (a single continuous shared countdown) and the full rule set.
// =============================================================
function mountQuestions(root, activity, ui) {
  const opt = activity.options || {};
  let items = [...(activity.content?.items || [])]
    .filter(it => it && it.question && Array.isArray(it.answers)
      && it.answers.length >= MIN_ANSWERS && it.answers.some(a => a && a.correct));
  if (opt.shuffleQuestions) items = shuffle(items);
  items = items.map(it => ({
    question: it.question,
    answers: (opt.shuffleAnswers ? shuffle(it.answers) : [...it.answers]).filter(a => a && a.text != null),
    src: it   // the ORIGINAL content object — "Start with mistakes" filters by it
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
  // Penalty (teacher's option, engine Options panel): subtract this many
  // points on each WRONG answer, clamped 0..5. 0 = no penalty (default), so
  // behaviour is identical to before this option existed. Negative scores are
  // allowed (not clamped to 0) — ui.setScore renders them red without a minus.
  const pointsOff = Math.max(0, Math.min(5, Number(activity.options && activity.options.pointsOff) || 0));

  const boxState = items.map(() => "unplayed");   // "unplayed" | "correct" | "locked"
  const lastWrongText = items.map(() => null);    // last wrong answer text picked (for the Show answers review)
  let score = 0;
  let timeLeft = questionSeconds;
  let activeIndex = null;            // box index currently showing its question, else null
  let ended = false;                 // game over OR every box solved
  let fitter = null;
  let lastBoxRect = null;    // rect of the tapped box, for the open/close zoom animation
  let hasPlayedEntrance = false;   // the LONG music-synced grid pop only plays once per play-through
  // Point 4 (4/8/2026): answer tiles ignore taps until 80% of their slide-in
  // has played, so the player can't mis-tap a still-arriving tile before
  // reading it. Set false while the tiles slide in, flipped true by gateTimer.
  let answersUnlocked = false;
  let gateTimer = null;

  // ----- Cross-fade transition bookkeeping (đợt 14) -----
  // The grid and the question card briefly OVERLAP (absolutely positioned via
  // the `.aw-otb-anim` class on root) so the number boxes can fade while the
  // question tile zooms — see animateOpen()/closeCardThen(). A single token
  // invalidates a previous transition's settle callback if a new transition
  // starts before it fires (fast taps, or the shared timer hitting 0 mid
  // animation); the stale callback checks the token and bails.
  let animToken = 0;
  let pendingSettle = null;
  // Đợt 24 (7/8/2026): after an answer, the number boxes are held un-tappable
  // until 80% of the close-back animation, then unlocked (see closeCardThen).
  // This timer drives that unlock; clearPending() cancels it whenever a newer
  // transition starts or the template is cleaned up.
  let boxUnlockTimer = null;
  const clearPending = () => {
    if (pendingSettle) { clearTimeout(pendingSettle); pendingSettle = null; }
    if (boxUnlockTimer) { clearTimeout(boxUnlockTimer); boxUnlockTimer = null; }
  };

  // ----- Shared continuous countdown (see file header) -----
  let sharedClockEl = null, sharedFillEl = null;
  let timerStarted = false;
  // Set by resetSharedTimer() after a CORRECT answer (đợt 11): the bar sits
  // full but the countdown does NOT resume until openBox() runs again.
  let pausedForNextBox = false;
  let tickInterval = null, endTimeout = null;

  // Builds the clock + bar row inside the engine's topbar. Called ONCE at mount
  // (see the call next to render() at the bottom) — NOT on the first box open
  // like it used to be (đợt 25b). Building it late made the topbar grow from 34
  // to 37px the instant the first box was tapped, which stole those 3px from the
  // play area (431.3 -> 428.3) and visibly shrank the grid/tiles one time per
  // round — the same class of glitch đợt 24 fixed on the BOTTOM bar, just from
  // the other end of the frame. Building it up front makes the frame's three
  // rows a fixed height for the whole round: nothing ever resizes mid-game. The
  // bar simply sits full (scaleX defaults to 1) showing the per-question time
  // until the first box starts the countdown.
  function ensureTimerUI() {
    if (sharedFillEl || !ui.topbarMid) return;
    ui.topbarMid.innerHTML = "";
    const topbarRow = el("div", "aw-otb-q-topbar");
    sharedClockEl = el("div", "aw-otb-q-clock", formatTime(Math.ceil(timeLeft)));
    const bar = el("div", "aw-otb-timerbar");
    sharedFillEl = el("div", "aw-otb-timerbar-fill");
    bar.append(sharedFillEl);
    topbarRow.append(sharedClockEl, bar);
    ui.topbarMid.append(topbarRow);
  }

  function startSharedTimerIfNeeded() {
    if (timerStarted) return;
    timerStarted = true;
    ensureTimerUI();
    runCountdown(timeLeft);
  }

  // Drains `durationSec` -> 0 in real time, continuously updating the clock
  // digits + bar width + tick sound, REGARDLESS of whether a question card
  // is on screen or the grid is showing (teacher's request, đợt 9). Ends the
  // round via gameOver() the instant it hits 0, wherever the player is.
  function runCountdown(durationSec) {
    const startAt = performance.now();
    const totalDur = Math.max(durationSec, 0.05);
    if (sharedFillEl) {
      // đợt 25: drains with `transform: scaleX()`, NOT `width`. A width
      // transition is re-laid-out and repainted by the main thread on every
      // frame for the WHOLE countdown (measured: a 15000ms `width` transition
      // running right through the box-open zoom); a scaleX transition is handed
      // to the compositor and costs the main thread nothing. The bar looks the
      // same — it's anchored left by `transform-origin` in the CSS.
      sharedFillEl.classList.remove("is-warning");
      sharedFillEl.style.transition = "none";
      sharedFillEl.style.transform = "scaleX(1)";
      void sharedFillEl.offsetWidth; // force reflow so the transition below actually animates
      sharedFillEl.style.transition = `transform ${totalDur}s linear, background-color .4s ease`;
      sharedFillEl.style.transform = "scaleX(0)";
    }
    // A single unified "tick slot", in SECONDS: whole-second steps while
    // more than WARNING_SECONDS remain, half-second steps once inside the
    // final WARNING_SECONDS — continuous across that seam, so there's no
    // separate "mode" flag whose own init value can collide with the very
    // check it's about to run (đợt 12 fix — the old halfMode flag computed
    // its OWN starting `lastTick` from the SAME `remaining` it then
    // immediately re-compared against on that same tick, so the two were
    // always equal right at the transition and the beat that should have
    // landed exactly at the 5-second mark silently never fired — heard as a
    // skipped beat before the double-speed tick kicked in). Now there's one
    // formula and one comparison, so the beat AT the 5s mark fires normally
    // (still single-rate), and the very next beat half a second later is the
    // first double-rate one — no gap, no double-fire, teacher's request.
    let lastSlot = Math.ceil(totalDur);
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      const remaining = Math.max(0, totalDur - (performance.now() - startAt) / 1000);
      timeLeft = remaining;
      if (sharedClockEl) sharedClockEl.textContent = formatTime(Math.ceil(remaining));
      sharedFillEl?.classList.toggle("is-warning", remaining <= WARNING_SECONDS);
      const slot = remaining > WARNING_SECONDS ? Math.ceil(remaining) : Math.ceil(remaining * 2) / 2;
      if (slot < lastSlot) { lastSlot = slot; if (remaining > 0) otbSound.clockTick(); }
      if (remaining <= 0) { clearInterval(tickInterval); tickInterval = null; }
    }, 250);
    if (endTimeout) clearTimeout(endTimeout);
    endTimeout = setTimeout(() => { endTimeout = null; gameOver(); }, totalDur * 1000);
  }

  // Correct answer: the bar visibly fills BACK UP from its current width to
  // full over REFILL_MS (teacher's "hiệu ứng thanh đồng hồ đầy ngược trở
  // lại"), THEN stays there PAUSED — it does NOT resume counting down on its
  // own any more (đợt 11 change, see the file header). openBox() is what
  // resumes it, the next time the player taps a box.
  function resetSharedTimer() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    if (endTimeout) { clearTimeout(endTimeout); endTimeout = null; }
    timeLeft = questionSeconds;
    if (sharedClockEl) sharedClockEl.textContent = formatTime(questionSeconds);
    if (sharedFillEl) {
      // đợt 25: same switch to scaleX as runCountdown. The "current" position is
      // now read out of the live transform MATRIX (its `a` component is scaleX)
      // instead of a computed width — getComputedStyle returns the mid-flight
      // animated value either way, so the refill still starts from exactly where
      // the bar had drained to. `none` (no transform yet) means full = 1.
      const cs = getComputedStyle(sharedFillEl).transform;
      const current = (cs && cs !== "none") ? new DOMMatrixReadOnly(cs).a : 1;
      sharedFillEl.classList.remove("is-warning");
      sharedFillEl.style.transition = "none";
      sharedFillEl.style.transform = `scaleX(${current})`;   // pin the drained position as the animation's start point
      void sharedFillEl.offsetWidth;
      sharedFillEl.style.transition = `transform ${REFILL_MS}ms ease`;
      sharedFillEl.style.transform = "scaleX(1)";
    }
    pausedForNextBox = true;
  }

  function stopSharedTimer() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    if (endTimeout) { clearTimeout(endTimeout); endTimeout = null; }
  }

  ensureTimerUI();   // đợt 25b: BEFORE the first render, so the topbar never changes height mid-round
  render();
  const ro = new ResizeObserver(() => { if (activeIndex === null) { layoutGrid(root, total, explicitCols); fitBackFaces(root); } });
  ro.observe(root);

  function render() {
    if (fitter) { fitter.destroy(); fitter = null; }
    root.innerHTML = "";
    if (activeIndex === null) renderGrid(); else renderQuestion(activeIndex);
  }

  // Build the numbered-box grid for the CURRENT boxState, but DON'T append,
  // lay out, add any entrance/fade class, or play a sound — the caller
  // decides how it enters (a pop for a fresh render, a cross-fade for a
  // close, see applyPopEntrance / animateOpen / closeCardThen). Splitting
  // this out (đợt 14) is what lets the close transition lay the grid UNDER
  // the still-visible question card so the boxes can fade back in.
  function buildBoxGrid() {
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
        // wrong pick: shows the question on a solid RED tile (see
        // open-the-box.css, đợt 12) + a padlock badge in the SAME spot the
        // green tick uses on a solved box
        back.append(el("div", "aw-otb-back-q", escapeHtml(it.question)));
        back.append(el("span", "aw-otb-solved-tick aw-otb-lock-tick", ICON_LOCK));
      }
      inner.append(front, back);
      box.append(inner);
      if (boxState[i] === "unplayed" && !ended) box.onclick = () => openBox(i);
      grid.append(box);
    });
    card.append(grid);
    return { card, grid };
  }

  // The "pop in" entrance (scale + fade, staggered per box). The FIRST one
  // after Play is timed to intro.mp3 (music-synced); later plain renders use
  // the quick return timing. Only used by renderGrid() — the close transition
  // uses a plain fade-in instead (is-appearing-fade), see closeCardThen().
  function applyPopEntrance(grid) {
    const isFirst = !hasPlayedEntrance;
    const totalMs = isFirst ? ENTRANCE_MUSIC_MS : ENTRANCE_RETURN_TOTAL_MS;
    const boxMs = isFirst ? ENTRANCE_BOX_MS_FIRST : ENTRANCE_BOX_MS_RETURN;
    const staggerTotal = Math.max(0, totalMs - boxMs);
    grid.classList.add("is-entrance");
    grid.querySelectorAll(".aw-otb-box").forEach((box, i) => {
      const delay = total > 1 ? (i / (total - 1)) * staggerTotal : 0;
      box.style.setProperty("--otb-appear-delay", Math.round(delay) + "ms");
      box.style.setProperty("--otb-appear-dur", boxMs + "ms");
    });
    if (isFirst) { otbSound.tileAppear(); hasPlayedEntrance = true; }
  }

  function renderGrid() {
    const { card, grid } = buildBoxGrid();
    root.append(card);
    layoutGrid(root, total, explicitCols);
    fitBackFaces(root);   // point 3: size any already-solved boxes' back text
    applyPopEntrance(grid);
    updateProgress();
  }

  function openBox(i) {
    if (ended || boxState[i] !== "unplayed") return;
    const boxEl = root.querySelectorAll(".aw-otb-box")[i];
    if (boxEl) lastBoxRect = relRect(boxEl, root);
    otbSound.openBox();
    if (!timerStarted) {
      startSharedTimerIfNeeded();   // the very first box of the play-through
    } else if (pausedForNextBox) {
      // a previous correct answer reset the bar and paused it (see
      // resetSharedTimer) — opening THIS box is what resumes the countdown
      // (teacher's request, đợt 11). timeLeft is already the full
      // questionSeconds from that reset.
      pausedForNextBox = false;
      runCountdown(timeLeft);
    }
    activeIndex = i;
    animateOpen(i);
  }

  // OPEN transition (teacher's request, đợt 14): the tapped box grows out
  // from its exact spot/size into the full question tile WHILE the OTHER
  // number boxes fade out and the answer tiles slide in — all three over the
  // SAME span (ZOOM_TRANSFORM_MS, kept equal in JS + CSS). The grid card and
  // the new question card briefly overlap (absolute, via `.aw-otb-anim` on
  // root); once the grow finishes the old grid is dropped and the question
  // card becomes the plain render.
  function animateOpen(i) {
    clearPending();
    const myToken = ++animToken;
    const gridCard = root.querySelector(".aw-otb-card");
    const grid = gridCard ? gridCard.querySelector(".aw-otb-grid") : null;
    // drop any stale question overlay left by an interrupted transition
    root.querySelectorAll(".aw-otb-qcard").forEach(n => n.remove());
    if (!grid) {
      // no grid on screen (shouldn't normally happen) — fall back to a plain
      // question render (still zooms the tile from the tapped box's rect)
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      renderQuestion(i);
      return;
    }
    root.classList.add("aw-otb-anim");
    gridCard.classList.add("aw-otb-anim-under");
    const { card, qTile, answersRow } = buildQuestion(i);
    card.classList.add("aw-otb-anim-top");
    root.append(card);
    setupFit(card, qTile, answersRow);
    // fade the OTHER boxes out; hide the tapped one immediately (its question
    // tile is what grows from that exact spot instead, so leaving the number
    // there too would double-image). --otb-fade-ms keeps the fade span equal
    // to the tile zoom + the answers' slide-in.
    // Đợt 26 (teacher-reported bug: "các ô số khác không fade dần mà xuất
    // hiện/biến mất khực một cái"). Two DIFFERENT stale-animation-state bugs,
    // both only visible when a box is tapped while an EARLIER animation on
    // this same grid hasn't finished yet — very plausible: the entrance pop
    // right after Play runs up to ENTRANCE_MUSIC_MS (2460ms), and đợt 24's
    // "unlock the grid at 80% of a close" deliberately lets the NEXT open
    // start before the close's own fade-in has finished landing.
    //
    // (a) PER-BOX: `is-entrance` drives EACH box's own opacity/scale via a
    // CSS *animation* with fill-mode `both`. The instant that class is
    // removed, any box still mid-flight (or still sitting in its own
    // animation-delay, held invisible at opacity:0/scale:.72 by the `both`
    // fill) has nothing left to hold that value — it SNAPS straight to the
    // element's plain default (opacity:1, no transform) before the grid-level
    // fade-out even starts. Freeze each box's CURRENT live value as an inline
    // style FIRST so removing the class is a visual no-op; the grid's own
    // fade (below) then multiplies that already-in-flight opacity down to 0,
    // so a box that hadn't appeared yet (frozen at 0) simply never appears
    // instead of flashing on then off. (Harmless to leave these inline styles
    // set afterwards — this whole card is destroyed in pendingSettle below.)
    if (grid.classList.contains("is-entrance")) {
      grid.querySelectorAll(".aw-otb-box").forEach(b => {
        const cs = getComputedStyle(b);
        b.style.opacity = cs.opacity;
        b.style.transform = cs.transform;
      });
    }
    // (b) GRID-LEVEL: is-exiting's keyframe reads --otb-fade-from as its start
    // (see open-the-box.css) — fine as a plain 1 when the grid was sitting
    // idle, but if a close's own `is-appearing-fade` was interrupted mid-fade
    // (the đợt 24 80%-early-tap window above), the grid's REAL current
    // opacity is wherever that fade-in had reached (measured: ~0.7 at the
    // earliest possible re-tap moment), not 1. Feed the actual live value in
    // instead of letting the keyframe assume 1 — in the common uninterrupted
    // case getComputedStyle just reads back 1, so nothing changes there.
    grid.style.setProperty("--otb-fade-from", getComputedStyle(grid).opacity);
    grid.classList.remove("is-entrance", "is-appearing-fade");
    grid.style.removeProperty("--otb-fade-delay");
    grid.style.setProperty("--otb-fade-ms", ZOOM_TRANSFORM_MS + "ms");
    grid.classList.add("is-exiting");
    grid.style.pointerEvents = "none";
    grid.querySelectorAll(".aw-otb-box").forEach((b, idx) => {
      b.disabled = true;
      if (idx === i) { b.style.animation = "none"; b.style.opacity = "0"; }
    });
    // grow the question tile from the tapped box's rect (captured in openBox);
    // the answer tiles slide in on their own (aw-otb-qtile-in keyframe).
    if (lastBoxRect) zoomElFrom(qTile, lastBoxRect);
    // đợt 25: settle only once EVERY animation of the open has finished. This
    // callback is real main-thread work — it deletes the whole box grid (up to
    // 120 boxes) and takes both cards back out of absolute positioning, which
    // forces a full re-layout of the play area. At the old fixed
    // ZOOM_FALLBACK_MS (1280ms) that landed WHILE the last answer tiles were
    // still sliding in (each tile ends at ZOOM_TRANSFORM_MS + its own stagger,
    // i.e. up to 1425ms for 6 answers) — a layout spike dropped right into the
    // final frames of the animation. Waiting for the last tile costs nothing
    // visually: the boxes have been fully faded out (`forwards`) since 1200ms,
    // so the grid is invisible the whole time it lingers.
    const lastTileEndsAt = Math.max(0, items[i].answers.length - 1) * TILE_STAGGER_MS;
    pendingSettle = setTimeout(() => {
      pendingSettle = null;
      if (myToken !== animToken) return;   // a newer transition superseded this one
      gridCard.remove();
      root.classList.remove("aw-otb-anim");
      // the question card keeps its inert .aw-otb-anim-top class (harmless
      // once root loses .aw-otb-anim) — it just suppresses a late card
      // fade-in flash; see the CSS note on .aw-otb-anim-top.
    }, ZOOM_FALLBACK_MS + lastTileEndsAt);
  }

  // CLOSE transition (teacher's request, đợt 14) — the EXACT reverse of
  // animateOpen: the question tile zooms back down onto its box WHILE the
  // number boxes fade back in and the answer tiles slide out, all over the
  // SAME span (ZOOM_TRANSFORM_MS). The freshly-built grid (showing the
  // just-answered box's final solved/locked state) is laid UNDER the question
  // card; once the zoom-back finishes the question card is dropped and
  // `afterFn` runs (sounds + win check — it must NOT re-render the grid, which
  // is already on screen). If no question is open (timed out while sitting at
  // the grid — see file header), just runs `afterFn` straight away.
  function closeCardThen(afterFn) {
    clearPending();
    const myToken = ++animToken;
    const qcard = root.querySelector(".aw-otb-qcard");
    const qTile = root.querySelector(".aw-otb-q-question");
    const answersRow = root.querySelector(".aw-otb-q-answers");
    activeIndex = null;   // logically back at the grid now
    if (!qcard || !qTile || !lastBoxRect) {
      if (!root.querySelector(".aw-otb-grid")) {
        if (fitter) { fitter.destroy(); fitter = null; }
        root.innerHTML = "";
        renderGrid();
      }
      afterFn();
      return;
    }
    // drop any stale grid card left over from a fast/interrupted open, then
    // lay the fresh grid UNDER the question card, faded out, ready to fade in
    root.querySelectorAll(".aw-otb-card").forEach(n => n.remove());
    root.classList.add("aw-otb-anim");
    qcard.classList.add("aw-otb-anim-top");
    const { card: gridCard, grid } = buildBoxGrid();
    gridCard.classList.add("aw-otb-anim-under");
    root.insertBefore(gridCard, qcard);
    layoutGrid(root, total, explicitCols);
    fitBackFaces(root);   // point 3: fit the just-answered box's back text

    // delayed, shorter fade-in so the boxes appear LATER but still land at
    // full opacity right as the question card is removed (ZOOM_TRANSFORM_MS)
    grid.style.setProperty("--otb-fade-delay", CLOSE_BOX_FADE_DELAY_MS + "ms");
    grid.style.setProperty("--otb-fade-ms", (ZOOM_TRANSFORM_MS - CLOSE_BOX_FADE_DELAY_MS) + "ms");
    grid.classList.add("is-appearing-fade");
    grid.style.pointerEvents = "none";
    updateProgress();
    // Point 6 (đợt 24, 7/8/2026, teacher's request): don't let the next box be
    // tapped until 80% of the close-back animation has played — symmetric with
    // the OPEN read-gate (point 4) that unlocks the answers at 80% of their
    // slide-in. TWO things must be lifted for a tap to land: the fresh grid is
    // held pointer-inert (above), AND the question card sits ON TOP of it
    // (z-index 2, .aw-otb-anim-top) intercepting every tap while it zooms back.
    // At 80% we lift BOTH — the grid goes live and the still-visibly-shrinking
    // question card is made pointer-transparent so a tap passes straight through
    // to the box beneath it (the zoom-back keeps playing to 100% visually; only
    // the input gate opens early). Guarded by the transition token so a
    // superseded close never re-enables a grid a newer transition already owns;
    // clearPending() (top of every open/close + cleanup) cancels a stale timer.
    // Boxes that are solved/locked/ended stay disabled regardless (buildBoxGrid),
    // so this only ever frees the still-playable boxes.
    boxUnlockTimer = setTimeout(() => {
      boxUnlockTimer = null;
      if (myToken !== animToken) return;
      grid.style.pointerEvents = "";
      qcard.style.pointerEvents = "none";
    }, Math.round(ZOOM_TRANSFORM_MS * 0.8));
    // slide the answers out + shrink the question tile back onto its box, all
    // at the same time (đợt 12 kept these two equal; đợt 14 adds the grid
    // fade-in to the SAME span so the whole thing reverses the open exactly).
    if (answersRow) answersRow.classList.add("is-closing");
    zoomElTo(qTile, lastBoxRect, () => {
      if (myToken !== animToken) return;   // a newer transition superseded this one
      qcard.remove();
      root.classList.remove("aw-otb-anim");
      grid.classList.remove("is-appearing-fade");
      grid.style.pointerEvents = "";
      afterFn();
    });
  }

  function relRect(node, container) {
    const a = node.getBoundingClientRect(), b = container.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }

  // Build the question screen DOM — question as its own big tile on the left,
  // answers in a 2-column grid on the right (matches the teacher's Wordwall
  // reference photo). Does NOT append / fit / zoom: animateOpen() overlays it
  // on the still-present grid; renderQuestion() (the plain path) does those
  // steps. The clock + bar are NOT built here — they live in ui.topbarMid and
  // keep running whether this screen or the grid is showing (see the
  // shared-timer functions above).
  function buildQuestion(i) {
    const it = items[i];
    const card = el("div", "aw-otb-qcard");

    const body = el("div", "aw-otb-q-body");
    const qTile = el("div", "aw-otb-q-question");
    // inner text span so setupFit can size the question independently of its
    // tile (the tile is the fit "box", this span is the "content").
    qTile.append(el("div", "aw-otb-q-qtext", escapeHtml(it.question)));
    body.append(qTile);

    const row = el("div", "aw-otb-q-answers");
    const showLetters = opt.lettersOnAnswers === "abc";
    it.answers.forEach((ans, k) => {
      const tile = el("button", "aw-otb-qtile");
      tile.type = "button";
      // staggered "slide in from the right" entrance. This SAME inline
      // animation-delay (set once, here) also drives the exit — .is-closing
      // swaps in a different keyframe (see open-the-box.css, đợt 13) but the
      // inline animation-delay stays put and keeps applying to it, since
      // inline styles always outrank a class rule's shorthand.
      tile.style.animationDelay = (k * TILE_STAGGER_MS) + "ms";
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

    // Point 4: gate taps until 80% of the answers' slide-in has played. The
    // last tile lands at ZOOM_TRANSFORM_MS + its stagger; 80% of that whole
    // span is when picking unlocks (CSS `.is-gated` makes the row inert until
    // then; answer() double-checks answersUnlocked).
    const slideSpan = ZOOM_TRANSFORM_MS + Math.max(0, it.answers.length - 1) * TILE_STAGGER_MS;
    answersUnlocked = false;
    row.classList.add("is-gated");
    if (gateTimer) clearTimeout(gateTimer);
    gateTimer = setTimeout(() => {
      gateTimer = null;
      answersUnlocked = true;
      row.classList.remove("is-gated");
    }, Math.round(slideSpan * 0.8));

    return { card, qTile, answersRow: row };
  }

  // PER-TILE independent text sizing (teacher's request, 1/8/2026): the
  // question tile and EACH answer tile fit their OWN text to their OWN box, so
  // one long word (e.g. "Meteorologist") shrinks only THAT tile instead of
  // dragging every tile down or touching its own edge. Each uses the core
  // fitOnce with contentBox:true, so the text is sized to sit INSIDE the
  // tile's padding (a natural margin) — never clipped, never touching the
  // edge, and never broken mid-word (overflow-wrap is normal in
  // open-the-box.css). A short word grows up to FIT_MAX; a long one shrinks to
  // as low as FIT_MIN. `card` is unused now (each element carries its own
  // --fit; the card keeps --fit:1 from CSS for the stable layout gaps/padding).
  function setupFit(card, qTile, answersRow) {
    if (fitter) { fitter.destroy(); fitter = null; }
    // Grow/shrink one text span to fit its own tile. HEIGHT: the wrapped text
    // must fit the tile's content height (this is what a multi-word question or
    // answer grows into). WIDTH: the span is full-width and words never break
    // (overflow-wrap:normal), so the ONLY thing that can stick out sideways is
    // a single word wider than the span — detected as the span overflowing
    // ITSELF (scrollWidth > its own clientWidth). Comparing to the span's own
    // width (not the padded box minus slack) is what avoids the false "always
    // overflowing" a full-width block gives against the box width. The word
    // ends up inside the tile's padding, i.e. with a natural margin.
    const fitOne = (box, textEl) => {
      if (!box || !textEl) return;
      const cs = getComputedStyle(box);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const apply = s => textEl.style.setProperty("--fit", s);
      const overW = () => textEl.scrollWidth > textEl.clientWidth + 1;
      const over = () => textEl.scrollHeight > box.clientHeight - padY - 2 || overW();
      apply(FIT_MAX);
      if (over()) {
        let lo = FIT_MIN, hi = FIT_MAX, best = FIT_MIN;
        for (let i = 0; i < 16; i++) {
          const mid = (lo + hi) / 2;
          apply(mid);
          if (over()) hi = mid; else { best = mid; lo = mid; }
        }
        apply(best);
        // Point 5 (4/8/2026): a single unbreakable word longer than the tile
        // (e.g. a 40+ character term) can still be wider than the box even at
        // FIT_MIN — the binary search stops at the floor and the word OVERFLOWS
        // the tile edge (words never wrap, overflow-wrap:normal). Since text
        // width scales ~linearly with font-size, shrink past the floor by the
        // exact clientWidth/scrollWidth ratio until the whole word sits on one
        // line inside the tile. Guarantees "no word ever splits or spills",
        // just smaller — the teacher's rule. HARD_MIN keeps it from vanishing.
        let f = best;
        const HARD_MIN = 0.12;
        for (let i = 0; i < 8 && overW() && f > HARD_MIN; i++) {
          f = Math.max(HARD_MIN, f * (textEl.clientWidth / Math.max(textEl.scrollWidth, 1)) * 0.96);
          apply(f);
        }
      }
    };
    const runAll = () => {
      fitOne(qTile, qTile.querySelector(".aw-otb-q-qtext"));
      answersRow.querySelectorAll(".aw-otb-qtile").forEach(tile => fitOne(tile, tile.querySelector(".aw-otb-q-text")));
    };
    runAll();
    // re-fit once the web font loads (its metrics differ from the fallback) and
    // whenever the 16:9 stage is resized.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(runAll).catch(() => {});
    let raf = 0;
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(runAll); };
    window.addEventListener("resize", onResize);
    fitter = { refit: runAll, destroy() { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); } };
  }

  // Plain (non-animated) question render — used only via render()'s defensive
  // else-branch (e.g. an unexpected re-render); normal play always goes
  // through animateOpen() so the boxes cross-fade instead of vanishing.
  // Zooms ONLY the question tile FROM the tapped box's rect (the answer tiles
  // slide in on their own via the aw-otb-qtile-in keyframe, same span — see
  // đợt 10/12; safe to animate transform on the tile, it isn't positioned via
  // transform, CONG THUC MAU §3.5).
  function renderQuestion(i) {
    const { card, qTile, answersRow } = buildQuestion(i);
    root.append(card);
    setupFit(card, qTile, answersRow);
    if (lastBoxRect) zoomElFrom(qTile, lastBoxRect);
  }

  function answer(i, k, tile, row) {
    if (activeIndex !== i || ended || !answersUnlocked) return;   // point 4: ignore taps until the read-gate opens
    const it = items[i];
    const correct = !!it.answers[k].correct;

    [...row.children].forEach(t => t.disabled = true);
    const fly = el("span", "aw-mark-fly" + (correct ? "" : " is-cross"), correct ? icons.markCheck : icons.markCross);
    tile.append(fly);
    setTimeout(() => fly.remove(), correct ? 900 : 1400);
    if (!correct) tile.classList.add("is-dimmed");
    tile.append(el("span", "aw-tile-badge", correct ? icons.markCheck : icons.markCross));

    if (correct) {
      otbSound.correct(); score++;
      resetSharedTimer();   // bar refills + fresh full countdown (see file header)
    } else {
      otbSound.wrong();     // timer is untouched — it just keeps draining, even at the grid
      score -= pointsOff;   // penalty (negative allowed); updateProgress() below refreshes score + nav
    }

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
      if (ended) return;   // the shared countdown may have already ended the round while this was waiting
      // closeCardThen() now handles putting the grid back (fading the boxes in
      // WHILE the question tile zooms back — đợt 14), so afterFn does NOT
      // re-render; it only checks for the win. (đợt 16, teacher's call: the
      // post-close tileEliminate() sound was REMOVED — a wrong answer already
      // plays otbSound.wrong() the moment it's picked, so the second sound as
      // the box locked back on the grid was a duplicate for the same event.)
      closeCardThen(() => {
        if (boxState.every(s => s === "correct")) {
          ended = true;
          stopSharedTimer();
          otbSound.timesUp();
          finishRound("Game complete");
        }
      });
    }, correct ? 900 : 1400);
  }

  function updateProgress() {
    ui.setScore(score);
    // đợt 25 (teacher's request): the nav slot shows the BRAND LINE instead of
    // "x of N". The arrows have been gone since đợt 24 (this game is "tap any
    // box", there is no previous/next), and the count they sat next to was
    // hidden with them — so nothing is lost, the empty middle of the bottom bar
    // now carries the slogan. `label` is core/engine.js's own opt-in for exactly
    // this (Find the match's "Page 1 / 2", Running word's slogan); index/total
    // are still passed so the call stays valid if the label is ever dropped.
    ui.setNav({ index: score, total, onPrev: null, onNext: null, label: SLOGAN });
  }

  // Shrink transform, same math as zoomElFrom but reversed (current
  // size/position -> the target box's rect). ONLY ever called on the
  // QUESTION TILE now (teacher's request, đợt 10: "chỉ ô số zoom in-out với
  // ô câu hỏi" — the answer tiles get their own, unrelated slide instead,
  // see .is-closing in open-the-box.css / answer() below).
  function zoomElTo(el2, targetRect, onDone) {
    const elRect = el2.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const scaleX = targetRect.w / elRect.width, scaleY = targetRect.h / elRect.height;
    const dx = (rootRect.left + targetRect.x + targetRect.w / 2) - (elRect.left + elRect.width / 2);
    const dy = (rootRect.top + targetRect.y + targetRect.h / 2) - (elRect.top + elRect.height / 2);
    el2.style.transformOrigin = "center center";
    // Point 2 (4/8/2026): round the corners PROGRESSIVELY on the way down so the
    // question tile lands looking exactly like the rounded number box, instead
    // of a near-square (its own radius, once scaled down by scaleX/scaleY,
    // shrinks to almost nothing). To end at the box's real corner radius we set
    // the tile's radius to boxRadius/scale per axis, so scale*radius == boxRadius
    // at the finish; the transition interpolates from the tile's natural radius.
    const br = (scaleX > 0 && scaleY > 0) ? readBoxRadius(root) : 0;
    const natRadius = getComputedStyle(el2).borderRadius;
    // explicit starting point + a forced reflow BEFORE enabling the
    // transition, same as zoomElFrom — without this the browser can
    // collapse the "no transition yet" and "new value" style writes into
    // one recalculation and just jump straight to the end state instead
    // of animating (this is what was happening before this fix).
    el2.style.transition = "none";
    el2.style.transform = "translate(0px, 0px) scale(1, 1)";
    el2.style.opacity = "1";
    if (br > 0) el2.style.borderRadius = natRadius;
    void el2.offsetWidth;
    // đợt 25: mirror of zoomElFrom — the radius leg is short, but here it is
    // DELAYED to the tail (ZOOM_TRANSFORM_MS - ZOOM_RADIUS_MS) so it runs while
    // the tile is already small (cheap repaints) and still finishes at exactly
    // ZOOM_TRANSFORM_MS, landing on the number box's own radius as before. The
    // expensive first half of the shrink is now transform+opacity only.
    el2.style.transition = `transform ${ZOOM_TRANSFORM_MS}ms cubic-bezier(.4,0,.2,1), opacity ${ZOOM_OPACITY_MS}ms ease`
      + (br > 0 ? `, border-radius ${ZOOM_RADIUS_MS}ms cubic-bezier(.4,0,.2,1) ${ZOOM_TRANSFORM_MS - ZOOM_RADIUS_MS}ms` : "");
    el2.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    el2.style.opacity = "0.15";
    if (br > 0) el2.style.borderRadius = `${(br / scaleX).toFixed(2)}px / ${(br / scaleY).toFixed(2)}px`;
    let done = false;
    const run = () => { if (done) return; done = true; onDone(); };
    // Fire on the TRANSFORM transition specifically (đợt 14). The opacity
    // transition (ZOOM_OPACITY_MS = 840ms) ends BEFORE the transform one
    // (1200ms); a plain `transitionend` once-listener would fire on whichever
    // ends first = opacity, cutting the whole close short at 840ms — with the
    // cross-fade grid now visible underneath, that showed as the tile snapping
    // away half-shrunk and the boxes jumping the last bit of their fade-in.
    // Keying on `transform` lets the shrink AND the box fade-in (same 1200ms
    // span) both finish before the card is dropped.
    el2.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") run(); });
    setTimeout(run, ZOOM_FALLBACK_MS);
  }

  function zoomElFrom(el2, originRect) {
    const elRect = el2.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const scaleX = originRect.w / elRect.width, scaleY = originRect.h / elRect.height;
    const dx = (rootRect.left + originRect.x + originRect.w / 2) - (elRect.left + elRect.width / 2);
    const dy = (rootRect.top + originRect.y + originRect.h / 2) - (elRect.top + elRect.height / 2);
    el2.style.transformOrigin = "center center";
    // Point 2 (4/8/2026), mirror of zoomElTo: START with the corners matching
    // the box (boxRadius/scale per axis, so scale*radius == boxRadius) and
    // un-round toward the tile's natural radius as it grows — the reverse of
    // the fly-back, so open and close look symmetric.
    const br = (scaleX > 0 && scaleY > 0) ? readBoxRadius(root) : 0;
    const natRadius = getComputedStyle(el2).borderRadius;   // capture the natural (CSS) radius BEFORE overriding it inline
    el2.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    el2.style.opacity = "0.5";
    if (br > 0) el2.style.borderRadius = `${(br / scaleX).toFixed(2)}px / ${(br / scaleY).toFixed(2)}px`;
    void el2.offsetWidth; // force reflow so the browser commits the shrunk starting state first
    // đợt 25: the border-radius leg is SHORT (ZOOM_RADIUS_MS, no delay) so the
    // per-frame repaint it forces happens while the tile is still small, and
    // the last ~55% of the growth is transform+opacity only — see the constant.
    el2.style.transition = `transform ${ZOOM_TRANSFORM_MS}ms cubic-bezier(.22,.9,.3,1), opacity ${ZOOM_OPACITY_MS}ms ease`
      + (br > 0 ? `, border-radius ${ZOOM_RADIUS_MS}ms cubic-bezier(.22,.9,.3,1)` : "");
    el2.style.transform = "translate(0px, 0px) scale(1, 1)";
    el2.style.opacity = "1";
    if (br > 0) el2.style.borderRadius = natRadius; // animate toward the natural (CSS) radius
    let done = false;
    const clear = () => { if (done) return; done = true; el2.style.transition = ""; el2.style.transform = ""; el2.style.borderRadius = ""; };
    // ⭐ đợt 25 — THE stutter the teacher reported ("vài frame cuối hơi khựng và
    // giật" on the OPEN). This used to be a bare `transitionend {once:true}`,
    // which fires on WHICHEVER of the three transitions ends FIRST — and that is
    // OPACITY at ZOOM_OPACITY_MS (840ms), not the transform at 1200ms. clear()
    // then wiped the inline `transition` + `transform` mid-flight, which CANCELS
    // the still-running transform transition: the tile jumped straight to its end
    // state at 70% of the way through. With this easing that jump is only ~1% of
    // the distance (cubic-bezier(.22,.9,.3,1) is at 98.9% by then), so it doesn't
    // read as a "leap" — it reads as the motion being chopped off, the last third
    // of the slow-down never playing: exactly a hitch in the final frames.
    // zoomElTo (the CLOSE) already keys on `transform` for this same reason and
    // documents it (đợt 14) — the OPEN direction was simply never fixed, which is
    // why only the open felt rough. Same fix here; the setTimeout stays as the
    // backstop for a tab that never fires transitionend at all (hidden tab).
    el2.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") clear(); });
    setTimeout(clear, ZOOM_FALLBACK_MS);
  }

  // Fired by the shared countdown hitting 0 — can happen mid-question OR
  // while just sitting at the grid (see file header). closeCardThen() itself
  // already handles "no card on screen" (skips straight to afterFn()).
  function gameOver() {
    if (ended) return;
    ended = true;
    stopSharedTimer();
    otbSound.gameOver();
    closeCardThen(finishGameOver);
  }

  function finishGameOver() {
    activeIndex = null;
    // closeCardThen() already faded the grid back in (with final box states)
    // when a question was open; only render from scratch if it isn't there
    // (timed out while sitting at the grid — no card to close).
    if (!root.querySelector(".aw-otb-grid")) {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      renderGrid();
    }
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
  // needed core/engine.js to support (see GHI CHU OPEN-THE-BOX.md).
  function finishRound(title) {
    const perQuestion = items.map((it, i) => ({ q: i, correct: boxState[i] === "correct" }));
    const review = items.map((it, i) => {
      const correctText = (it.answers.find(a => a.correct) || {}).text || "";
      if (boxState[i] === "correct") {
        return { question: it.question, answered: true, yourText: correctText, yourCorrect: true, correctText, src: it.src };
      }
      if (boxState[i] === "locked") {
        return { question: it.question, answered: true, yourText: lastWrongText[i], yourCorrect: false, correctText, src: it.src };
      }
      // "unplayed" at the end (never attempted, or was wrong earlier but a
      // later correct answer elsewhere freed it back up) — reported as not
      // answered; this game allows retries so it doesn't map perfectly onto
      // Quiz's single-attempt review, this is the closest honest reading.
      return { question: it.question, answered: false, yourText: null, yourCorrect: false, correctText, src: it.src };
    });
    const correctCount = boxState.filter(s => s === "correct").length;
    const answeredCount = boxState.filter(s => s !== "unplayed").length;
    // Report the LIVE score (correct count minus wrong-answer penalties) as
    // the final score. With pointsOff===0 this equals correctCount, i.e. the
    // engine's own default, so nothing changes; with a penalty it can go below
    // correctCount (and negative).
    ui.finish({ score, correct: correctCount, incorrect: total - correctCount, total, perQuestion, review, answered: answeredCount, title });
  }

  return function cleanup() {
    ro.disconnect();
    clearPending();
    if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
    if (fitter) fitter.destroy();
    stopSharedTimer();
    if (ui.topbarMid) ui.topbarMid.innerHTML = "";
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Point 2 helper (4/8/2026): the number box's real corner radius in px, read
// from a front face currently in the grid (theme-agnostic — picks up whatever
// --aw-tile-radius resolves to). Returns 0 if no grid is present (e.g. the
// plain renderQuestion fallback with no boxes on screen), which makes the zoom
// functions simply skip the corner-rounding step.
function readBoxRadius(root) {
  const face = root.querySelector(".aw-otb-face-front");
  if (face) {
    const r = parseFloat(getComputedStyle(face).borderTopLeftRadius);
    if (r > 0) return r;
  }
  return 0;
}

registerTemplate(otbTemplate);
export default otbTemplate;
