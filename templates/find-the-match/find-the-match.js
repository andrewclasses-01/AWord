// =============================================================
// TEMPLATE: FIND THE MATCH — Wordwall style, English UI.
//  • Grid: 5 fixed ROWS, centred on screen. Each keyword tile gets an EXPLICIT
//    grid-row/grid-column by its position within the page — matching a tile
//    leaves a hole, the others never reflow (teacher's spec, 31/7/2026).
//  • PAGINATION (teacher 3/8/2026): more than 35 tiles splits the board into
//    pages (divided evenly), each a self-contained round whose prompts only
//    reference that page's tiles (so the answer is always on screen). Pages
//    auto-advance as cleared. There are NO page arrows and no "x of N" progress
//    (teacher 4/8/2026): the shared nav row under the stage shows only
//    "Page X / Y" — a position indicator, not a control — via ui.setNav's
//    `label`, which also keeps that row's height OUT of the board area.
//  • TEXT FIT (teacher 3/8/2026): every tile flex-centres its keyword and, via
//    a per-tile --tfit shrink (fitTiles), scales the font down until the word
//    fits inside the tile both ways — it never spills outside its box.
//  • Prompt ("conveyor belt"): the DEFINITION slides in from the left edge
//    of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — the whole journey is ONE
//    continuous slow glide, not a quick fade. Speed 0 = arrives at centre
//    and just waits there (no drift) until answered. A CORRECT tap makes the
//    prompt lift off and FLY into the score (bursting into little stars, like
//    True/false); a WRONG tap makes it glide on to the right edge from wherever
//    it is. Either way the answer TILES stay fixed and the tapped tile is never
//    removed; tiles are locked until the next prompt is ~50% in (1/8/2026).
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
const MAX_TILES_PER_PAGE = 35;   // more than this and the board splits into pages (teacher 3/8/2026)
const ENTER_MS = 900;   // left edge -> centre, always this pace regardless of Speed
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once a tile is tapped
const DEFAULT_LIVES = 5;
const MAX_LIVES = 10;

// Options store lives as: 0 = unlimited (slider's left end), 1..10 = that many
// hearts, null = unlimited (legacy), undefined = default 5 — same shape as
// True/false so Settings/Options behave consistently across templates.
function normLives(v) {
  if (v === 0 || v === null) return null;                 // unlimited
  if (typeof v === "number") return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
  return DEFAULT_LIVES;                                   // undefined -> default 5
}

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
  hasLivesSlot: true,       // hearts render in the top bar, left of the score (like True/false)
  manualTimerStart: true,   // the visible clock starts only after our 3-2-1 prep (count-up), so the prep isn't counted

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
    // LIVES — a slider 0..10 (0 = Unlimited), hearts shown next to the score
    // (same as True/false — teacher's request, 1/8).
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-ftm-livesrow");
    const curLives = (draft.lives === 0 || draft.lives === null) ? 0
      : (Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(1, draft.lives)) : DEFAULT_LIVES);
    const livesVal = el("span", "aw-ftm-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-ftm-livesslider");
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
    // Penalty subtracted from the live score on each WRONG tap (0..5, 0 = off).
    // When 0, the whole feature is inert and play is byte-identical to before.
    const pointsOff = Math.max(0, Math.min(5, Number(activity.options && activity.options.pointsOff) || 0));
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
    let order = pairs.map((_, i) => i);
    if (opt.shuffleQuestions) order = shuffle(order);

    // PAGINATION (teacher 3/8/2026): a big set is split across PAGES of at most
    // MAX_TILES_PER_PAGE keyword tiles, divided as evenly as possible (e.g. 40 ->
    // 20+20, not 35+5). Each page is a SELF-CONTAINED round — its prompts are
    // only the pairs whose keyword tile sits on that page, so the matching word
    // is ALWAYS visible on the current page. Pages auto-advance as they're
    // cleared; a ‹ Page X/Y › pager also lets you move manually. `choiceOrder`
    // (shuffled) is the tile layout order; chunking it forms the pages.
    const choiceOrder = shuffle(pairs.map((_, i) => i));
    const PAGE_COUNT = Math.max(1, Math.ceil(total / MAX_TILES_PER_PAGE));
    const perPage = Math.ceil(total / PAGE_COUNT);
    const pages = [];
    for (let p = 0; p < PAGE_COUNT; p++) pages.push(choiceOrder.slice(p * perPage, (p + 1) * perPage));
    // Per-page prompt queues — front = current prompt for that page; shuffled
    // within the page (when shuffleQuestions is on) for variety.
    const pageQueues = pages.map(arr => (opt.shuffleQuestions ? shuffle([...arr]) : [...arr]));

    // Grid geometry sized to the LARGEST page so every page lines up identically
    // (5 fixed rows, columns from the tile count). A tile's cell never changes as
    // siblings around it are matched — removing one leaves a hole (teacher's spec).
    const maxPageSize = Math.max(...pages.map(a => a.length));
    const cols = Math.max(1, Math.ceil(maxPageSize / ROWS));
    const colW = Math.min(15, 90 / cols);

    const state = pairs.map(() => ({ solved: false, skipped: false }));
    let finished = false;
    let curPage = 0;                 // page currently on screen / being played
    let queue = pageQueues[curPage]; // LIVE working sequence for the current page — front = current prompt
    let penalty = 0;          // total points docked by wrong taps (pointsOff); stays 0 when the feature is off
    let livesLeft = normLives(opt.lives);
    let fitter = null;
    let tileFitRaf = 0;       // rAF handle coalescing per-tile font fitting after --fit settles
    let promptAnim = null;    // the currently-running Animation on .aw-ftm-prompt (enter or crawl)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running (rule: .animate() needs one)
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    let gateTimer = null;     // unlocks the tiles once a new prompt is ~50% in (like True/false)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingMarks = [];  // setTimeouts for fly marks / heart-pop cleanup

    ui.onSubmit(() => finish("timesup"), () => state.filter(s => s.solved || s.skipped).length);   // block "Submit answers" at 0 answered
    window.addEventListener("keydown", onKey);
    renderShell();

    if (timerMode === "countUp") {
      runPrepCountdown();          // starts the clock (ui.startTimer) only after the 3-2-1
    } else {
      ui.startTimer();             // count-down / none: clock starts right away
      if (timerMode !== "none") ftmSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    // Live score = pairs matched minus points docked for wrong taps. Negatives
    // are allowed (the top-bar renders them red without a minus). With the
    // feature off (penalty always 0) this equals the plain matched-count.
    function scoreNow() { return state.filter(s => s.solved).length - penalty; }

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
      if (!promptEl) { ui.startTimer(); ftmSound.go(); startCycle(); return; }
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
          ui.startTimer();     // the visible clock begins only NOW — the 3-2-1 prep isn't counted
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
      // renderShell now runs once per page (mount + every page change), so tear
      // down the PREVIOUS page's autoFit (its resize listener) / pending tile fit
      // before building the new one — otherwise they'd pile up.
      if (fitter) { fitter.destroy(); fitter = null; }
      if (tileFitRaf) { cancelAnimationFrame(tileFitRaf); tileFitRaf = 0; }
      root.innerHTML = "";
      const card = el("div", "aw-ftm-card");

      const track = el("div", "aw-ftm-track");
      track.append(el("div", "aw-ftm-prompt"));
      card.append(track);

      card.append(el("div", "aw-ftm-divider"));

      const grid = el("div", "aw-ftm-grid");
      grid.style.gridTemplateColumns = `repeat(${cols}, ${colW}cqw)`;
      grid.style.gridTemplateRows = `repeat(${ROWS}, min-content)`;
      // Only THIS page's tiles. Cell = position within the page (explicit
      // grid-row/column) so matched tiles leave a fixed hole, never reflowing.
      pages[curPage].forEach((idx, i) => {
        const st = state[idx];
        // A matched-and-removed tile (removeCorrects) leaves an empty cell.
        if (st.solved && removeCorrects) return;
        const tile = el("button", "aw-ftm-tile", escapeHtml(pairs[idx].keyword));
        tile.dataset.idx = String(idx);
        tile.style.gridRow = String(Math.floor(i / cols) + 1);
        tile.style.gridColumn = String((i % cols) + 1);
        const col = PALETTE[i % PALETTE.length];
        tile.style.setProperty("--ftm-c", col.c);
        tile.style.setProperty("--ftm-d", col.d);
        if (st.solved) {
          // matched but kept (removeCorrects:false) — dimmed + permanent check.
          tile.classList.add("is-locked");
          tile.disabled = true;
          tile.append(el("span", "aw-tile-badge", icons.markCheck));
        } else {
          // unmatched (incl. a skipped pair's keyword, which lingers as a
          // distractor) — clickable.
          tile.onclick = () => choose(idx, tile);
        }
        grid.append(tile);
      });
      card.append(grid);

      // The page indicator lives DOWN in the shared nav row under the stage (see
      // updateNav) — no in-board pager any more, so every bit of the board's
      // height goes to the tiles themselves (teacher 4/8/2026).

      root.append(card);

      // The height the tile grid actually NEEDS. Not grid.scrollHeight: the grid
      // is a stretched flex child, so its scrollHeight collapses to its stretched
      // height (fit.js warns about exactly this) and real overflow stayed
      // invisible until it exceeded the whole slack — which is why the bottom row
      // was being clipped (measured 4/8/2026: 12 tiles cut, 11px over).
      const gridNeedH = () => {
        const tile = grid.querySelector(".aw-ftm-tile");
        if (!tile) return 0;
        const rowsUsed = Math.max(1, Math.min(ROWS, Math.ceil(pages[curPage].length / cols)));
        const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        return rowsUsed * tile.offsetHeight + (rowsUsed - 1) * gap;
      };
      // offsetHeight ignores margins, and this card's fixed chrome (the track's
      // bottom margin, the divider's margin, the card's own padding) adds up to
      // ~3cqw — leaving it out made autoFit think the board was shorter than it is.
      const outerH = node => {
        if (!node) return 0;
        const cs = getComputedStyle(node);
        return node.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      };
      fitter = autoFit(root, card, s => { card.style.setProperty("--fit", s); scheduleTileFit(); }, {
        // slack ~1.5cqw: the tiles' 3D shadow lip (0.5cqw) sits below their layout
        // box and would otherwise be shaved off by the grid's overflow:hidden.
        slack: root.clientWidth * 0.015,
        measure: () => {
          const cs = getComputedStyle(card);
          return (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
            + outerH(track) + outerH(card.querySelector(".aw-ftm-divider")) + gridNeedH();
        }
      });
      // Fit the tiles NOW, synchronously (once --fit is set) — don't wait on the
      // rAF path, which is frozen while the tab isn't compositing. Re-fit once
      // the web font swaps in (its metrics differ) and, via scheduleTileFit, on
      // every later resize.
      fitTiles();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!finished) fitTiles(); }).catch(() => {});

      ui.setScore(scoreNow());
      updateNav();
      renderLives();
      lockTiles();   // stay locked until the first prompt is ~50% in (startCycle re-arms the unlock)
    }

    // Per-tile text fit: after the whole-stage --fit settles, shrink each tile's
    // font (via its own --tfit) until the keyword fits INSIDE the tile both ways,
    // so a long word never spills outside its box and always stays centred
    // (teacher 3/8/2026). Coalesced through one rAF so the burst of --fit writes
    // during autoFit's binary search only triggers a single pass.
    function scheduleTileFit() {
      if (tileFitRaf) cancelAnimationFrame(tileFitRaf);
      tileFitRaf = requestAnimationFrame(() => { tileFitRaf = 0; fitTiles(); });
    }
    function fitTiles() {
      root.querySelectorAll(".aw-ftm-tile").forEach(t => {
        t.style.setProperty("--tfit", "1");
        let scale = 1, guard = 0;
        while (guard++ < 12 &&
               (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1) &&
               scale > 0.4) {
          scale -= 0.08;
          t.style.setProperty("--tfit", scale.toFixed(3));
        }
      });
    }

    // The next page (wrapping) that still has unsolved prompts, or -1 if the
    // whole activity is done.
    function nextNonEmptyPage(from) {
      for (let k = 1; k <= PAGE_COUNT; k++) {
        const p = (from + k) % PAGE_COUNT;
        if (pageQueues[p].length) return p;
      }
      return -1;
    }

    // (Pages are never flipped by hand — the game moves on by itself once the
    // current page is cleared; the nav row only REPORTS which page you're on.)

    // Hearts live in the top bar (ui.livesSlot), just left of the score — same
    // as True/false. 1..5 lives show that many separate hearts; 6..10 show a
    // compact "N♥"; unlimited shows nothing. A lost life pops the LEFTMOST heart.
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

    // Drops one life, popping the leftmost heart (when 1..5 are shown
    // individually) then re-rendering. Returns true if that was the last life.
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

    // Long definitions can overflow the fixed-height, overflow:hidden track (the
    // whole-stage autoFit only watches the answer grid, not the prompt). Shrink
    // THIS prompt's font via --pfit until it fits both ways, so nothing is
    // clipped. The fly-to-score clone reads the resulting computed size, so it
    // lifts off from exactly the size shown here.
    function fitPrompt(promptEl) {
      const track = promptEl.parentElement;   // .aw-ftm-track
      if (!track) return;
      promptEl.style.setProperty("--pfit", "1");
      let scale = 1, guard = 0;
      while (guard++ < 14 &&
             (promptEl.scrollHeight > track.clientHeight + 1 || promptEl.scrollWidth > track.clientWidth + 1) &&
             scale > 0.45) {
        scale -= 0.07;
        promptEl.style.setProperty("--pfit", scale.toFixed(3));
      }
    }

    // Tiles are LOCKED while a prompt is entering, and only unlock once it's
    // ~50% across — so you can't answer two prompts back-to-back "blind"
    // (teacher 1/8, same gate as True/false). Solved / locked tiles stay
    // disabled regardless.
    function lockTiles() { root.querySelectorAll(".aw-ftm-tile").forEach(t => { t.disabled = true; }); }
    function unlockTiles() {
      root.querySelectorAll(".aw-ftm-tile").forEach(t => {
        if (!t.classList.contains("is-solved") && !t.classList.contains("is-locked")) t.disabled = false;
      });
    }

    // Starts (or restarts) the current queue-front's journey from the LEFT
    // edge. Only called once the PREVIOUS prompt is fully gone.
    function startCycle() {
      if (finished) return;
      // Current page cleared? Move to the next page that still has prompts (and
      // re-render for it), or finish once every page is done (teacher 3/8/2026).
      if (!queue.length) {
        const np = nextNonEmptyPage(curPage);
        if (np < 0) { armFallback(() => finish("complete"), 400); return; }
        curPage = np;
        queue = pageQueues[curPage];
        renderShell();
      }
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) return;
      promptEl.style.visibility = "";           // a correct-answer fly may have hidden it
      promptEl.textContent = escapeHtml(pairs[queue[0]].definition);
      fitPrompt(promptEl);                       // shrink long definitions so nothing is clipped
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the browser commits the start position before animating from it
      ftmSound.conveyorAppear();
      const enter = promptEl.animate(
        [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
        { duration: ENTER_MS, easing: "ease-out", fill: "forwards" }
      );
      promptAnim = enter;
      // Lock the tiles now, unlock at ~50% of the slide-in (teacher 1/8).
      lockTiles();
      if (gateTimer) clearTimeout(gateTimer);
      gateTimer = setTimeout(() => { if (!finished && queue.length) unlockTiles(); }, Math.round(ENTER_MS * 0.5));
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
        // Tile is NOT removed (teacher's spec 1/8: answers stay fixed) — it
        // simply lingers as an unmatched distractor for the rest of the game.
      }
    }

    function onTimeUp() {
      if (finished || !queue.length) return;
      dropOrRequeue(queue[0]);
      startCycle();
    }

    function removeTile(tile) {
      if (!tile) return;
      // Teacher's spec (1/8): tiles must NEVER change position. A matched tile
      // fades out (opacity:0 via .is-solved) but STAYS in the DOM — its grid
      // cell is kept reserved so no other tile ever reflows.
      tile.classList.add("is-solved");
      tile.disabled = true;
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

    // A CORRECT answer: the whole prompt lifts off toward the score, bursting
    // into little stars that stream into it; the score then ticks up with a
    // pulse. THEN `cb` runs (start next / finish). Overlay nodes are appended to
    // the fullscreen host (or <body>) so they show over the stage and in
    // fullscreen; they use px/viewport coords (NOT cqw, which wouldn't resolve
    // outside the stage). Mirrors True/false's flyStatementToScore.
    function flyPromptToScore(promptEl, cb) {
      const scoreEl = ui.scoreEl || document.querySelector(".aw-top-score");
      const host = document.fullscreenElement || document.body;
      let called = false;
      const done = () => { if (called) return; called = true; if (!finished) cb(); };
      if (!promptEl || !scoreEl) { done(); return; }

      const from = promptEl.getBoundingClientRect();
      const to = scoreEl.getBoundingClientRect();
      const cs = getComputedStyle(promptEl);

      const clone = el("div", "aw-ftm-flyclone");
      clone.textContent = promptEl.textContent;
      clone.style.left = from.left + "px";
      clone.style.top = from.top + "px";
      clone.style.width = from.width + "px";
      clone.style.height = from.height + "px";
      clone.style.font = cs.font;
      clone.style.fontSize = cs.fontSize;   // carry the fitted (possibly shrunk) size exactly
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

      // score ticks up mid-flight, with a little pulse
      pendingMarks.push(setTimeout(() => {
        if (finished) return;
        ui.setScore(scoreNow());
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
        const s = el("span", "aw-ftm-star", "&#9733;");
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

    function choose(idx, tile) {
      if (finished || !queue.length) return;
      const target = queue[0];
      // Lock all tiles right away so the NEXT prompt can't be answered "blind"
      // while this one is still flying off / sliding out — startCycle re-arms
      // the 50%-in unlock for the incoming prompt (teacher 1/8, like True/false).
      lockTiles();
      if (idx === target) {
        queue.shift();
        state[target].solved = true;
        ftmSound.correct();

        const fly = el("span", "aw-mark-fly", icons.markCheck);
        tile.append(fly);
        pendingMarks.push(setTimeout(() => fly.remove(), 900));
        if (removeCorrects) {
          removeTile(tile);
        } else {
          tile.classList.add("is-locked");
          tile.disabled = true;
          tile.append(el("span", "aw-tile-badge", icons.markCheck));
        }

        // The current PROMPT lifts off toward the score, bursting into little
        // stars (same effect as True/false, teacher 1/8) — flyPromptToScore
        // ticks the score up mid-flight with a pulse, then continues.
        const promptEl = root.querySelector(".aw-ftm-prompt");
        haltPromptAnim();
        // startCycle() auto-advances to the next page (or finishes) when this
        // page's queue is now empty — see its top-of-function guard.
        flyPromptToScore(promptEl, () => startCycle());
      } else {
        // Wrong tap (teacher's spec, 1/8): the TAPPED tile stays exactly where
        // it is — a ✗ flies up then fades, but the tile never moves or vanishes
        // (it may be the right answer for a LATER prompt; answers are fixed).
        // The current PROMPT, however, moves on to the next one: its pair is
        // dropped (Show once) or re-queued at a RANDOM later spot (Repeat until
        // correct), and the prompt glides off to the right just like a correct
        // tap. Lose a life if lives are enabled — running out ends the game.
        ftmSound.wrong();
        const fly = el("span", "aw-mark-fly is-cross", icons.markCross);
        tile.append(fly);
        pendingMarks.push(setTimeout(() => fly.remove(), 900));

        // Dock points for the wrong tap (no clamp — the score may go negative).
        // Guarded by pointsOff so play is byte-identical when the feature is off.
        if (pointsOff) {
          penalty += pointsOff;
          ui.setScore(scoreNow());
          updateNav();
        }

        const outOfLives = loseLife();
        dropOrRequeue(target);
        exitPromptThenCall(() => {
          if (outOfLives) finish("gameover");
          else startCycle();   // auto-advances to the next page or finishes when the page is cleared
        });
      }
    }

    // The row under the stage (teacher 4/8/2026): NO "x of N" progress and NO
    // arrows — this game never goes back, and the score is already top-right.
    // It shows only WHICH PAGE of tiles is on screen, and nothing at all when
    // the whole set fits on one page. (`label` is core's opt-in nav text.)
    function updateNav() {
      ui.setNav({
        index: curPage + 1, total: PAGE_COUNT, onPrev: null, onNext: null,
        label: PAGE_COUNT > 1 ? `Page ${curPage + 1} / ${PAGE_COUNT}` : ""
      });
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
      // Out of lives shows "GAME OVER" (celebration cover + menu panel both
      // read this title); everything else keeps the default "Game complete".
      // Report the SAME live value shown top-right (matched minus points off).
      // With the feature off, penalty is 0 so this equals `correct` — the exact
      // number ui.finish would default to anyway (byte-identical).
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered: correct,
        score: scoreNow(),
        title: reason === "gameover" ? "Game over" : undefined });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (tileFitRaf) cancelAnimationFrame(tileFitRaf);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      if (gateTimer) clearTimeout(gateTimer);
      tickTimers.forEach(clearTimeout);
      pendingMarks.forEach(clearTimeout);
      haltPromptAnim();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-ftm-flyclone, .aw-ftm-star").forEach(n => n.remove());
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ftmTemplate);
export default ftmTemplate;
