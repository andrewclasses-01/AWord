// =============================================================
// TEMPLATE: RUNNING WORD (RUNNINGW) — a two-team classroom race on ONE screen,
// run on a chess clock. Built from the paper + spreadsheet game Teacher Andrew
// has been running by hand (lesson tab `RunningW` + the `RUNNING` sheet of
// WORD GAMES.xlsx + a physical chess clock).
//
// HOW IT IS PLAYED
//   Each team gets its own printed word list. The team's EXPLAINER describes
//   word №1 without saying it; the TYPER spells it into this screen. Correct
//   spelling = the word turns green, the clock CLACKS over to the other team,
//   and that team's next row opens for typing. Nobody's clock is ever paused
//   except by the referee. A team that runs out of time loses on the spot; if a
//   team finishes its whole list first it wins on words.
//
// WHAT THIS TEMPLATE REPLACES
//   • the chess clock            -> two clocks in the frame, swapped by a correct word
//   • the iPad spreadsheet       -> the typing rows, with automatic marking
//   • printing 3 tabs from Excel -> the Print button on the setup screen (rw-print.js)
//   • hand-splitting the vocab   -> buildSets() in rw-sets.js (see that file: the real
//                                   85-word file splits 50/50 covering everything with
//                                   exactly 15 shared words — that maths is reproduced)
//
// THE ONE RULE THAT SHAPES THE WHOLE UI: the upcoming word must NEVER appear on
// screen. The typer is standing in front of it. So a row shows its NUMBER and
// nothing else until it has been earned; the words live on paper (and in the
// referee's CHECK sheet). Even the setup screen shows only counts, never a list.
// ONE deliberate exception (teacher's request, 5/8/2026): a PASSED word IS
// revealed, in plain ink — the opponent may see it, and that's fine now.
//
// Core is untouched: the two clocks are the template's own (tpl.hideTimerOption
// + options.timer:"none" so the engine's whole-game clock stays out of the way),
// the Andrew lifeline rides core/keyboard.js's existing `extraKey` slot, and the
// printed sheets reuse core's `.aw-print-sheet` plumbing without adding a format
// to core/print.js.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createKeyboard } from "../../core/keyboard.js";
import { openRunningWordEditor } from "./running-word-editor.js";
import { rwSound } from "./rw-sound.js";
import { printRunningSheets } from "./rw-print.js";
import { poolFrom, buildSets, readSets, setStats, MAX_SETS } from "./rw-sets.js";

// ---------------------------------------------------------------
// Answer matching. Deliberately forgiving about the things a race on a
// touchscreen punishes unfairly, and strict about spelling itself:
//   • case and accents ignored (as everywhere else in AWord)
//   • hyphen == space  -> SKIN-SCRAPER, SKIN SCRAPER, skin scraper all pass.
//     The real word pool contains SKIN-SCRAPER, LARGE-SCALE, WASH DOWN and
//     BRING IN, and no explainer says "hyphen" out loud.
//   • stray punctuation dropped, runs of spaces collapsed
// Nothing else is loosened: a missing or wrong LETTER is still wrong, which is
// the entire point of the game.
// ---------------------------------------------------------------
function norm(s) {
  return String(s ?? "")
    .normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[-–—_/]/g, " ")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const TEAMS = ["a", "b"];
const other = t => (t === "a" ? "b" : "a");

const SLOGAN = "RUNNING WORD IN ANDREW CLASSES";

// The data the end-of-match summary panel needs, stashed here just before
// ui.finish() runs. core/engine.js calls rwTemplate.renderSummary() AFTER the
// confetti — a method on the template object, with no access to mount()'s
// closure — so the per-team scoreboard it draws reads this instead. Safe as a
// module-level single because AWord only ever mounts one activity at a time
// (same reasoning the poolSizeHint pattern relies on).
let rwEndData = null;

// The 10 quick-pick notches on the "Time each team" slider (seconds), 0:30 up
// to 5:00 in half-minute steps. Slider position 0 is "Custom" — not in this
// list, handled separately in buildExtraOptions.
const CLOCK_STEPS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}
function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const rwTemplate = {
  type: "running_word",
  scorable: true,
  name: "Running word",
  edit: openRunningWordEditor,

  hideTimerOption: true,     // the game owns two clocks; a whole-game clock would fight them
  hideLettersOption: true,   // no lettered answer tiles
  hideShuffleAnswers: true,  // nothing to shuffle — the split is its own feature
  hideAutoSwitch: true,      // turns swap on a correct word, never on a checkbox
  hidePointsOff: true,       // wrong costs TIME here, not points
  manualTimerStart: true,    // the engine clock starts when the match does, not at mount
  // Real Fullscreen API tested unusable on iPad Chrome for THIS game (5/8/2026,
  // live device test): a downward swipe near the top edge (right where the
  // clocks sit) silently drops fullscreen mid-match, it exits right after the
  // 3-2-1 countdown, and Chrome throws a "leave/stay fullscreen?" banner over
  // the board. core/engine.js reads this flag and swaps the Fullscreen button
  // to a CSS-only zoom (`.aw-zoomed` on root) instead — see the flag's own
  // comment in engine.js for the full trade-off. CSS for `.aw-zoomed` lives in
  // running-word.css (this template's own file, not core).
  useZoomFullscreen: true,

  sounds: {
    play: () => {},          // the 3-2-1 has its own sound; a jingle here would collide
    restart: () => {},
    complete: () => {}       // finish() already played the bell / fanfare
  },

  // The shared Print button (Anagram/Quiz worksheet formats) still works — it
  // just sees a plain word list with no clues. The real sheets for this game are
  // the three printed from the setup screen.
  toPrintItems(activity) {
    return poolFrom(activity).map(w => ({ clue: "", answer: w }));
  },

  // ===== END-OF-MATCH MENU PANEL (teacher's redesign, 5/8/2026) =============
  // Replaces the engine's default summary body via the `tpl.renderSummary`
  // hook. Deliberately stripped right down: no Time, no Leaderboard, no Show
  // answers, no "Play a different template", no "you're Nth" line — just the
  // two teams side by side (name over score, the score bigger and gold) and a
  // single Start again. All the numbers come from rwEndData (set in endMatch).
  renderSummary(panel, { restart, panelItem }) {
    const d = rwEndData || { names: { a: "TEAM A", b: "TEAM B" }, wordsA: 0, wordsB: 0, totalA: 0, totalB: 0, timeA: 0, timeB: 0, winner: null };
    const board = el("div", "aw-rw-sum");
    TEAMS.forEach(t => {
      const won = t === "a" ? d.wordsA : d.wordsB;
      const total = t === "a" ? d.totalA : d.totalB;
      const half = el("div", `aw-rw-sum-half is-${t}` + (d.winner === t ? " is-winner" : ""));
      half.append(el("div", "aw-rw-sum-name", escapeHtml(d.names[t])));
      half.append(el("div", "aw-rw-sum-score", `${won}/${total}`));
      // Leftover clock time under the score (teacher's request, 6/8/2026).
      const timeMs = t === "a" ? d.timeA : d.timeB;
      const timeWrap = el("div", "aw-rw-sum-timewrap");
      timeWrap.append(el("div", "aw-rw-sum-time", fmtClock(timeMs || 0)));
      timeWrap.append(el("div", "aw-rw-sum-timelab", "time left"));
      half.append(timeWrap);
      board.append(half);
    });
    panel.append(board);
    const items = el("div", "aw-panel-items");
    items.append(panelItem("Start again", restart));
    panel.append(items);
  },

  buildExtraOptions({ panel, draft, el: E, mkCheck }) {
    const group = (label) => {
      const g = E("div", "aw-opt-group");
      g.append(E("div", "aw-opt-label", label));
      return g;
    };
    // One labelled slider + live value read-out. `fmt` turns the raw number into
    // what the teacher reads ("5:00", "Off", "All"…).
    const slider = (parent, caption, key, min, max, step, dflt, fmt) => {
      if (draft[key] == null) draft[key] = dflt;
      const row = E("div", "aw-rw-opt-row");
      row.append(E("span", "aw-rw-opt-cap", caption));
      const input = E("input", "aw-rw-opt-slider");
      input.type = "range"; input.min = String(min); input.max = String(max); input.step = String(step);
      input.value = String(clampInt(draft[key], min, max, dflt));
      const val = E("span", "aw-rw-opt-val", fmt(+input.value));
      input.oninput = () => { draft[key] = +input.value; val.textContent = fmt(+input.value); };
      row.append(input, val);
      parent.append(row);
    };

    // ---- team names ----
    const gNames = group("Teams");
    TEAMS.forEach(t => {
      const key = t === "a" ? "teamAName" : "teamBName";
      if (!draft[key]) draft[key] = t === "a" ? "TEAM A" : "TEAM B";
      const row = E("div", "aw-rw-opt-row");
      row.append(E("span", "aw-rw-opt-cap", t === "a" ? "Team A name" : "Team B name"));
      const input = E("input", "aw-rw-opt-text");
      input.type = "text"; input.maxLength = 18; input.value = draft[key];
      input.oninput = () => { draft[key] = input.value; };
      row.append(input);
      gNames.append(row);
    });
    panel.append(gNames);

    // ---- the clock ----
    const gClock = group("Chess clock");

    // "Time each team" is a STEPPED slider: notch 0 is "Custom" (reveals a
    // Min/Sec pair), notches 1..10 are the fixed picks 0:30 up to 5:00. Typed
    // Min/Sec always wins the slider's position on redraw — an old activity
    // saved with some other value (e.g. the plain 30-1800s slider this
    // replaces) just opens on "Custom" showing that exact time, no data lost.
    if (draft.clockSeconds == null) draft.clockSeconds = 300;
    const clockStepOf = secs => { const i = CLOCK_STEPS.indexOf(secs); return i === -1 ? 0 : i + 1; };
    const rowClock = E("div", "aw-rw-opt-row");
    rowClock.append(E("span", "aw-rw-opt-cap", "Time each team"));
    const clockCol = E("div", "aw-rw-clockcol");
    const clockSlider = E("input", "aw-rw-opt-slider");
    clockSlider.type = "range"; clockSlider.min = "0"; clockSlider.max = String(CLOCK_STEPS.length); clockSlider.step = "1";
    const clockVal = E("span", "aw-rw-opt-val", "");
    const customBox = E("div", "aw-rw-custom-time");
    const minInput = E("input", "aw-rw-opt-num");
    minInput.type = "number"; minInput.min = "0"; minInput.max = "29"; minInput.inputMode = "numeric";
    const secInput = E("input", "aw-rw-opt-num");
    secInput.type = "number"; secInput.min = "0"; secInput.max = "59"; secInput.inputMode = "numeric";
    customBox.append(minInput, E("span", "aw-rw-opt-numlab", "min"), secInput, E("span", "aw-rw-opt-numlab", "sec"));
    // Showing/hiding the two halves never touches clockSlider.value — only the
    // initial draw and a FIXED pick move the slider itself. Doing it the other
    // way (deriving the slider's position from draft.clockSeconds on every
    // redraw) is the bug this replaced: dragging onto notch 0 left
    // draft.clockSeconds unchanged, so re-deriving the step from it snapped
    // the slider straight back to wherever it used to be.
    function showCustom() {
      minInput.value = String(Math.floor(draft.clockSeconds / 60));
      secInput.value = String(draft.clockSeconds % 60);
      customBox.style.display = "inline-flex";
      clockVal.style.display = "none";
    }
    function showFixed() {
      customBox.style.display = "none";
      clockVal.style.display = "";
      clockVal.textContent = fmtClock(draft.clockSeconds * 1000);
    }
    function refreshClockUI() {   // full sync — only on first draw, from the saved value
      clockSlider.value = String(clockStepOf(draft.clockSeconds));
      if (clockStepOf(draft.clockSeconds) === 0) showCustom(); else showFixed();
    }
    clockSlider.oninput = () => {
      const step = +clockSlider.value;
      if (step === 0) { showCustom(); return; }    // slider is already at 0 — just reveal Min/Sec
      draft.clockSeconds = CLOCK_STEPS[step - 1];
      showFixed();
    };
    const applyCustomTime = () => {
      const m = clampInt(minInput.value, 0, 29, 0);
      const s = clampInt(secInput.value, 0, 59, 0);
      draft.clockSeconds = Math.max(10, m * 60 + s);    // a floor so 0:00 can't be set
      clockVal.textContent = fmtClock(draft.clockSeconds * 1000);
    };
    minInput.oninput = applyCustomTime;
    secInput.oninput = applyCustomTime;
    refreshClockUI();
    clockCol.append(clockSlider, clockVal, customBox);
    rowClock.append(clockCol);
    gClock.append(rowClock);

    slider(gClock, "Bonus per correct word", "incrementSeconds", 0, 15, 1, 0, v => (v ? `+${v}s` : "Off"));
    slider(gClock, "Hurry-up warning", "warnSeconds", 0, 60, 5, 15, v => (v ? `last ${v}s` : "Off"));
    panel.append(gClock);

    // ---- the round ----
    // "Words per team" was removed 5/8/2026: the split is now fully automatic
    // from the pool size (see rw-sets.js buildSets — max 50 a side), so there
    // is nothing left for the teacher to tune here.
    const gRound = group("Round");
    slider(gRound, "Andrew help per team", "andrewUses", 1, 5, 1, 1, v => `${v}×`);
    panel.append(gRound);

    // ---- pass ----
    const gPass = group("Pass");
    const rowPass = E("div", "aw-opt-row");
    rowPass.append(mkCheck(draft.allowPass !== false, "Allow PASS (skip a word you can't get)",
      v => { draft.allowPass = v; }));
    gPass.append(rowPass);
    slider(gPass, "Time penalty for a pass", "passPenaltySeconds", 0, 60, 5, 10,
      v => (v ? `−${v}s` : "Free"));
    panel.append(gPass);
  },

  // =============================================================
  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pool = poolFrom(activity);

    root.innerHTML = "";
    if (pool.length < 2) {
      root.append(el("div", "aw-rw-empty", "This activity needs at least 2 words."));
      return () => {};
    }

    // Teacher vs student device. The engine strips its toolbar under the frame
    // in student mode, so its absence is a reliable signal without asking core
    // for anything new. Printing and saving a set are teacher-only actions.
    const isTeacher = !!document.querySelector(".aw-below-right");

    // ---------- settings, normalised once ----------
    const cfg = {
      names: {
        a: String(opt.teamAName || "TEAM A").trim().slice(0, 18) || "TEAM A",
        b: String(opt.teamBName || "TEAM B").trim().slice(0, 18) || "TEAM B"
      },
      clockMs: clampInt(opt.clockSeconds, 10, 1800, 300) * 1000,
      incrementMs: clampInt(opt.incrementSeconds, 0, 15, 0) * 1000,
      warnSec: clampInt(opt.warnSeconds, 0, 60, 15),
      allowPass: opt.allowPass !== false,
      passPenaltyMs: clampInt(opt.passPenaltySeconds, 0, 60, 10) * 1000,
      andrewUses: clampInt(opt.andrewUses, 1, 5, 1)
    };

    // ---------- match state ----------
    let sets = readSets(activity);                 // saved splits (up to 3)
    let setIndex = 0;                               // which one is selected
    let current = sets[0] || buildSets(pool);
    let dirty = !sets.length;                        // current split isn't one of the saved ones

    let phase = "setup";                             // setup -> prep -> countdown -> play -> over
    let turn = null;                                  // null during "prep" until a board is tapped
    let running = false, paused = false, finished = false;
    const idx = { a: 0, b: 0 };
    // Turn-ending moves per team (a correct word OR a pass — a wrong try does
    // NOT count, it keeps the same team on the clock). The game only settles by
    // LIST when both teams have taken the SAME number of moves (teacher's rule,
    // 5/8/2026): the first team plays one more turn than the second at any
    // moment, so if it finishes its list the second team is owed a final,
    // equalising turn before time and score are locked. Running OUT OF TIME is
    // unaffected — that ends on the spot, chess-clock law.
    const moves = { a: 0, b: 0 };
    let listDone = false;                             // some team has completed its whole list
    let finisher = null;                              // the first team to complete its list
    const rows = { a: [], b: [] };                   // per-row status: null | "ok" | "pass"
    const clock = { a: cfg.clockMs, b: cfg.clockMs };
    const andrewLeft = { a: cfg.andrewUses, b: cfg.andrewUses };
    let andrewShown = false;                         // the word is revealed for the current turn
    let lastTick = { a: null, b: null };              // whole second last announced per clock
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

    // ---------- shell ----------
    const card = el("div", "aw-rw-card");
    root.append(card);

    // ===== SETUP SCREEN =====================================================
    const setup = el("div", "aw-rw-setup");
    card.append(setup);

    // ===== MATCH SCREEN (built once, shown when the match starts) ===========
    const match = el("div", "aw-rw-match");
    match.style.display = "none";
    card.append(match);

    // DECLARED BEFORE the clocks are built. refereeBar() runs inside the loop
    // below and assigns to it — a `let` sitting further down would still be in
    // its temporal dead zone at that moment and throw ReferenceError. (Same trap
    // recorded for Whack-a-mole in Đợt 63; the function DECLARATION itself
    // hoists fine, only the binding doesn't.)
    let refUI = null;

    // Docked at the very top of the frame (the engine's own topbar is hidden
    // for this game — see running-word.css). ONE row, five items evenly
    // balanced (teacher's redesign, 6/8/2026):
    //   [PASS a] [clock a]  [Play/Pause]  [clock b] [PASS b]
    // Each team's PASS is a square button on that team's OWN outer edge of the
    // frame, level with the clocks; the clocks are shortened to hug their
    // digits and sit over their team's column; Play/Pause is a wide pill
    // centred between the two clocks. Word count is still tracked internally
    // off `rows` for scoring/review, just not shown on the clock.
    const clocks = el("div", "aw-rw-clocks");
    const clockEls = {};
    const passEls = {};
    function makeClock(t) {
      const box = el("div", `aw-rw-clock is-${t}`);
      const time = el("div", "aw-rw-clock-time", fmtClock(clock[t]));
      box.append(time);
      clockEls[t] = { box, time };
      return box;
    }
    // PASS is per team now and only lives on that team's own turn (you can only
    // skip your OWN word). A spacer keeps the 5-column grid balanced when PASS
    // is switched off in Options.
    function makePass(t) {
      if (!cfg.allowPass) return el("div", `aw-rw-passgap is-${t}`);
      const btn = el("button", `aw-rw-passbtn is-${t}`, "PASS");
      btn.type = "button";
      btn.title = "Skip this word (time penalty)";
      btn.onclick = () => { if (turn === t) doPass(); };
      passEls[t] = btn;
      return btn;
    }
    clocks.append(makePass("a"), makeClock("a"), refereeBar(), makeClock("b"), makePass("b"));
    match.append(clocks);

    // Each board is a fixed 3-ROW WINDOW (teacher's request, 5/8/2026): the
    // input row sits at the BOTTOM, the two words just completed above it. The
    // whole word list lives in a `.aw-rw-track` that is slid up with a
    // translateY transition so the window advances one row at a time. Layout:
    //   board  ├─ rowhead (team name)
    //          ├─ viewport (.aw-rw-rows, 3 rows tall, overflow hidden)
    //          │    └─ track (.aw-rw-track, all rows, translateY animated)
    //          ├─ footer (.aw-rw-remaining)
    //          └─ probe (hidden span used to measure word width for fitting)
    // Tappable during "prep" to pick which team goes first — see enterPrep().
    const boards = el("div", "aw-rw-boards");
    const boardEls = {};
    TEAMS.forEach(t => {
      const board = el("div", `aw-rw-board is-${t}`);
      board.onclick = () => { if (phase === "prep") { ui.sound.click?.(); turn = t; paintAll(); } };
      const rowhead = el("div", "aw-rw-rowhead");
      rowhead.append(el("span", "aw-rw-rowhead-name", escapeHtml(cfg.names[t])));
      const viewport = el("div", "aw-rw-rows");
      const track = el("div", "aw-rw-track");
      viewport.append(track);
      // ⭐⭐ THE iPAD BUG, ROOT-FIXED (5/8/2026). Symptom the teacher hit on
      // iPad Chrome — never on Windows: the board of the team whose TURN it is
      // showed the word being typed at the TOP of the window with the two
      // UNPLAYED rows below it, instead of at the bottom with the two finished
      // words above. The other team's board was always right.
      //
      // Cause: this window holds the one live `<input>`, and WebKit reveals a
      // focused field / a moving caret by SCROLLING the nearest scroll
      // container — and `overflow:hidden` still makes an element one (hidden
      // only stops the USER scrolling it; the browser and `scrollTop` can move
      // it freely). WebKit aligns the revealed element to the START of that
      // container, which drags the current row from the bottom slot up to the
      // top slot: an offset of exactly 2 rows, which is exactly what the
      // teacher's screenshot measures. Blink (desktop Chrome) doesn't perform
      // that reveal, so the very same code looked perfect on Windows.
      // `focus({preventScroll:true})` (already in focusInput) is NOT enough —
      // it only covers the focus call itself, not `setSelectionRange` nor the
      // caret-reveal on every keystroke.
      //
      // So instead of trying to name every API that might scroll this box, we
      // make the box refuse to STAY scrolled: whatever moves it, for whatever
      // reason, now or in a future browser version, it snaps straight back.
      // The track's position is owned by applyTrack() alone.
      viewport.addEventListener("scroll", () => {
        if (viewport.scrollTop !== 0) viewport.scrollTop = 0;
        if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0;
      });
      const footer = el("div", "aw-rw-remaining", "0");
      const probe = el("span", "aw-rw-probe");   // measures a word at base font (see fitBoard)
      board.append(rowhead, viewport, footer, probe);
      boardEls[t] = { board, viewport, track, footer, probe, rowEls: [], noAnim: true };
      boards.append(board);
    });
    match.append(boards);

    // Re-fit the words as the boards grow/shrink (the 70/30 swap animates the
    // width every frame). The 3-row WINDOW itself needs nothing here any more:
    // it is pure CSS percentages now (see applyTrack), so the browser keeps it
    // correct on every layout by itself.
    const boardRO = new ResizeObserver(entries => {
      for (const entry of entries) {
        const t = entry.target === boardEls.a.board ? "a" : "b";
        fitBoard(t);
      }
    });
    boardRO.observe(boardEls.a.board);
    boardRO.observe(boardEls.b.board);

    // The single live input, moved into whichever row is currently in play.
    const input = el("input", "aw-rw-input");
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.maxLength = 40;
    input.inputMode = "none";     // AWord's own keyboard is always up — no OS keyboard
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
    });
    input.addEventListener("input", () => { filterEnglish(); refreshKeys(); });
    input.addEventListener("compositionend", () => { filterEnglish(); refreshKeys(); });

    // The keyboard is built when "prep" starts (the match screen first shows),
    // not at mount(): during setup there is nothing to type into and every key
    // would be born disabled. Always visible from then on — the show/hide
    // toggle this template used to have is gone (teacher's request, 5/8/2026).
    //
    // History worth keeping: the first version built it in mount() and the
    // "Andrew" key was then dead for the whole game. core/keyboard.js's fnKey()
    // used to attach its click handler ONLY when the key was enabled at BUILD
    // time, while refresh() afterwards only flipped `.disabled` — so a key born
    // disabled stayed handler-less forever, looking alive and doing nothing.
    // Caught 4/8/2026 by actually pressing it. **core has since been fixed**
    // (the handler is always attached now), so this deferral is no longer what
    // makes the key work — but building the keyboard in its playable state is
    // still the honest thing to do, and it keeps this game working on any older
    // copy of core.
    let kbd = null;
    function buildKeyboard() {
      if (kbd) return;
      kbd = createKeyboard({
        sound: ui.sound,
        onChar: ch => insertChar(ch),
        onBackspace: () => backspace(),
        submit: {
          onClick: () => submit(),
          isDisabled: () => phase !== "play" || paused || !input.value.trim()
        },
        extraKey: {
          label: "Andrew",
          className: "aw-rw-key-andrew",
          getState: () => {
            if (andrewShown) return "glowing";
            return andrewLeft[turn] > 0 ? "ready" : "used";
          },
          isDisabled: () => phase !== "play" || paused || andrewShown || !turn || andrewLeft[turn] <= 0,
          onClick: useAndrew
        }
      });
      match.append(kbd.el);
    }

    // ===== referee: one wide Play/Pause, centred in the middle column of the
    // clock strip (teacher's redesign, 6/8/2026 — PASS moved out to the two
    // clock-strip edges, one per team; see makePass above). ==============
    function refereeBar() {
      const bar = el("div", "aw-rw-ref");
      const playPauseBtn = el("button", "aw-rw-playpause", SVG_PLAY);
      playPauseBtn.type = "button";
      playPauseBtn.title = "Play";
      playPauseBtn.onclick = onPlayPauseClick;
      bar.append(playPauseBtn);
      refUI = { bar, playPauseBtn };
      return bar;
    }

    // In "prep" (boards shown, nobody's clock running yet): starts the 3-2-1
    // once a side has been picked. In "play": pauses/resumes. Disabled the
    // rest of the time (countdown, setup, over).
    function onPlayPauseClick() {
      if (phase === "prep") {
        if (!turn) return;
        ui.sound.click?.();
        beginCountdown();
      } else if (phase === "play") {
        togglePause();
      }
    }

    // ===== SETUP SCREEN CONTENT ============================================
    // Deliberately shows COUNTS ONLY. Rendering the actual lists here would put
    // both teams' words on the classroom screen with the typers watching.
    let setUI = null;
    function renderSetup() {
      setup.innerHTML = "";
      setup.append(el("div", "aw-rw-setup-title", "RUNNING WORD"));

      // -- saved set chooser --
      // A slot with a saved split shows a DELETE SET button (teacher's
      // request, 5/8/2026): a saved slot can't be reshuffled until it's
      // deleted first, so the printed sheets can never silently drift out of
      // sync with the game (see the Shuffle button below). `.aw-rw-slot` is a
      // <div>, not a <button>, so the delete button can nest inside it —
      // a button can never contain another button.
      const slots = el("div", "aw-rw-slots");
      for (let i = 0; i < MAX_SETS; i++) {
        const saved = sets[i];
        const isSel = i === setIndex;
        const slot = el("div", "aw-rw-slot" + (isSel ? " is-sel" : "") + (saved ? "" : " is-empty"));
        slot.setAttribute("role", "button"); slot.tabIndex = 0;
        slot.append(el("div", "aw-rw-slot-num", `SET ${i + 1}`));
        if (saved) {
          const st = setStats(saved, pool);
          slot.append(el("div", "aw-rw-slot-main", `${st.perTeam} + ${st.perTeam}`));
          slot.append(el("div", "aw-rw-slot-meta", `${st.overlap} shared`));
        } else {
          slot.append(el("div", "aw-rw-slot-main", "—"));
          slot.append(el("div", "aw-rw-slot-meta", "empty"));
        }
        slot.onclick = () => {
          ui.sound.click?.();
          setIndex = i;
          if (sets[i]) { current = sets[i]; dirty = false; }
          else { current = buildSets(pool); dirty = true; }
          renderSetup();
        };
        if (saved && isTeacher) {
          const delBtn = el("button", "aw-rw-slot-del", "DELETE SET");
          delBtn.type = "button";
          delBtn.onclick = e => { e.stopPropagation(); confirmDeleteSet(i); };
          slot.append(delBtn);
        }
        slots.append(slot);
      }
      setup.append(slots);

      // -- what the current split actually looks like, in numbers --
      const st = setStats(current, pool);
      const facts = el("div", "aw-rw-facts");
      const fact = (big, small) => {
        const f = el("div", "aw-rw-fact");
        f.append(el("div", "aw-rw-fact-big", big), el("div", "aw-rw-fact-small", small));
        return f;
      };
      facts.append(
        fact(String(st.poolSize), "words in pool"),
        fact(`${st.perTeam} + ${st.perTeam}`, "per team"),
        fact(String(st.overlap), "shared"),
        fact(st.full ? "ALL" : `${st.covered}/${st.poolSize}`, "pool covered"),
        fact(fmtClock(cfg.clockMs), "each clock")
      );
      setup.append(facts);

      // -- actions --
      const acts = el("div", "aw-rw-setup-acts");

      // Disabled once `current` IS a saved slot (not dirty) — delete it first
      // (teacher's request, 5/8/2026: never let Shuffle quietly invalidate
      // sheets that have already been printed for this SET).
      const shuffleBtn = el("button", "aw-rw-btn", "Shuffle new split");
      shuffleBtn.type = "button";
      shuffleBtn.disabled = !dirty;
      shuffleBtn.title = dirty ? "" : "Delete this SET first to shuffle a new split.";
      shuffleBtn.onclick = () => {
        if (!dirty) return;
        ui.sound.click?.();
        current = buildSets(pool);
        dirty = true;
        renderSetup();
      };
      acts.append(shuffleBtn);

      if (isTeacher) {
        const printBtn = el("button", "aw-rw-btn", `${icons.print}<span>Print 3 sheets</span>`);
        printBtn.type = "button";
        printBtn.classList.add("is-icon");
        printBtn.onclick = () => { ui.sound.click?.(); printRunningSheets(activity, current, cfg.names); };
        acts.append(printBtn);

        const saveBtn = el("button", "aw-rw-btn" + (dirty ? " is-dirty" : ""),
          dirty ? `Save as SET ${setIndex + 1}` : `SET ${setIndex + 1} saved`);
        saveBtn.type = "button";
        saveBtn.disabled = !dirty;
        saveBtn.onclick = () => saveCurrentSet(saveBtn);
        acts.append(saveBtn);
      }
      setup.append(acts);

      const start = el("button", "aw-rw-start", "START MATCH");
      start.type = "button";
      start.onclick = () => { ui.sound.click?.(); enterPrep(); };
      setup.append(start);

      setUI = { start };
    }

    // Positional helper shared by save/delete: slots i.a/i.b line up 1:1 with
    // SET 1/2/3 on screen (5/8/2026 — replaces an earlier version that
    // silently COMPACTED the array, so deleting or re-saving one slot could
    // shift the others into different numbers on reload). A hole is `null`.
    function snapshotSlots() {
      const next = [];
      for (let i = 0; i < MAX_SETS; i++) next[i] = sets[i] ? { a: sets[i].a.slice(), b: sets[i].b.slice() } : null;
      return next;
    }

    // Persist the current split into slot `setIndex`. store.js is imported
    // LAZILY, inside this click handler only: core's rule is that a student page
    // must never load library code, and this button only exists for a teacher.
    async function saveCurrentSet(btn) {
      if (!activity.id || String(activity.id).startsWith("conv_")) {
        ui.toast?.("Save the activity to your library first.");
        return;
      }
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const { saveActivity } = await import("../../core/store.js");
        const next = snapshotSlots();
        next[setIndex] = { a: current.a.slice(), b: current.b.slice() };
        activity.content = activity.content || {};
        activity.content.printSets = next;
        await saveActivity(activity);
        sets = readSets(activity);
        dirty = false;
        ui.toast?.(`Saved as SET ${setIndex + 1}.`);
        renderSetup();
      } catch (e) {
        console.warn("AWord/running-word: could not save the split", e);
        btn.disabled = false;
        btn.textContent = label;
        ui.toast?.("Could not save — are you signed in?");
      }
    }

    // Clear slot `i` back to empty. Same store.js pathway as save, so the
    // deletion syncs to every other device signed into this activity exactly
    // like any other save (teacher's request, 5/8/2026 — no new plumbing).
    async function confirmDeleteSet(i) {
      if (!activity.id || String(activity.id).startsWith("conv_")) {
        ui.toast?.("Save the activity to your library first.");
        return;
      }
      if (!confirm(`Delete SET ${i + 1}? The printed sheets for it will no longer match anything saved here.`)) return;
      try {
        const { saveActivity } = await import("../../core/store.js");
        const next = snapshotSlots();
        next[i] = null;
        activity.content = activity.content || {};
        activity.content.printSets = next;
        await saveActivity(activity);
        sets = readSets(activity);
        if (setIndex === i) { current = buildSets(pool); dirty = true; }
        ui.toast?.(`SET ${i + 1} deleted.`);
        renderSetup();
      } catch (e) {
        console.warn("AWord/running-word: could not delete the set", e);
        ui.toast?.("Could not delete — are you signed in?");
      }
    }

    // ===== PREP =============================================================
    // START MATCH lands here, not straight into the 3-2-1 (teacher's redesign,
    // 5/8/2026): the match screen shows with both boards equal (50/50, neither
    // team picked yet — `turn` is null). Tapping a board grows it to 70% and
    // picks that team to go first; the big Play button (disabled until a pick
    // is made) then runs the 3-2-1 and starts the clock.
    function enterPrep() {
      phase = "prep";
      turn = null;
      setup.style.display = "none";
      match.style.display = "";
      buildRows();
      buildKeyboard();
      paintAll();
    }

    // ===== COUNTDOWN =======================================================
    function beginCountdown() {
      phase = "countdown";
      paintAll();

      const overlay = el("div", "aw-rw-countdown");
      const num = el("div", "aw-rw-countdown-num", "3");
      overlay.append(num);
      match.append(overlay);

      let n = 3;
      rwSound.ready(false);
      const step = () => {
        n--;
        if (n > 0) {
          num.textContent = String(n);
          num.classList.remove("is-pop"); void num.offsetWidth; num.classList.add("is-pop");
          rwSound.ready(n === 1);
          later(step, 900);
        } else {
          overlay.remove();
          startMatch();
        }
      };
      later(step, 900);
    }

    function startMatch() {
      phase = "play";
      running = true;
      paused = false;
      ui.startTimer();                  // the engine's own elapsed clock, for the result panel
      lastFrame = performance.now();
      tickId = setInterval(tick, 100);
      rwSound.clack();
      paintAll();
      focusInput();
    }

    // ===== BOARD ===========================================================
    function buildRows() {
      TEAMS.forEach(t => {
        const list = current[t];
        rows[t] = list.map(() => null);
        const { track, rowEls } = boardEls[t];
        track.innerHTML = "";
        rowEls.length = 0;
        list.forEach((word, i) => {
          const row = el("div", "aw-rw-row");
          const no = el("span", "aw-rw-row-no", String(i + 1));
          const body = el("span", "aw-rw-row-body");
          const mark = el("span", "aw-rw-row-mark");
          row.append(no, body, mark);
          rowEls.push({ row, body, mark });
        });
        // ⭐ REVERSED STACKING (teacher's request, 5/8/2026): word N at the TOP
        // of the track, word 1 at the bottom, so the CURRENT word rides the top
        // of the 3-row window and finished words get pushed DOWN below it (the
        // opposite of the old "input at the bottom" layout). rowEls stays indexed
        // by word (rowEls[i] == word i) for every state path — only the visual
        // stacking is flipped, by appending the rows to the track in reverse.
        for (let i = rowEls.length - 1; i >= 0; i--) track.append(rowEls[i].row);
        boardEls[t].noAnim = true;   // first placement of the track shouldn't slide
      });
    }

    // Which word sits at the TOP of the 3-row window for team `t` (teacher's
    // reversed layout, 5/8/2026 — the newest word is on top now):
    //   • its turn (playing)      -> idx[t]      (the input row)
    //   • before the match starts -> idx[t]      (word 1 ready at the top)
    //   • waiting / game over     -> idx[t] - 1  (the word it last completed)
    // The two rows BELOW are the previous two (smaller and fainter — see the
    // tier classes in paintBoard).
    function topIndexOf(t) {
      if (phase === "play" && turn === t) return idx[t];
      if (phase === "prep" || phase === "countdown") return idx[t];
      return idx[t] - 1;
    }

    // Slide the track so `topIndexOf(t)` lands in the TOP third of the window.
    // `animate:false` (first build) suppresses the transition.
    //
    // ⭐ NO PIXELS ANYWHERE (5/8/2026). The track is exactly as tall as the
    // window (CSS `height:100%`) and each row is exactly `calc(100% / 3)` of it,
    // so ONE ROW = 100%/3 of the track by construction and the slide is written
    // in those same units. A `translateY` percentage resolves against the
    // element's own height, so the browser recomputes the whole thing on every
    // layout, on any device, with nothing for this file to measure, cache or
    // re-sync. Rotate the iPad, let the URL bar slide away, change the frame
    // ratio, run it in a future browser — the window stays exactly 3 rows.
    //
    // The track is stacked word N-1 (top) .. word 0 (bottom), so word `top` sits
    // at DOM slot (N-1-top); sliding it up by that many rows brings it to the
    // window's top slot, with the two OLDER words falling into the slots below.
    function applyTrack(t, animate) {
      const b = boardEls[t];
      const shift = -((current[t].length - 1) - topIndexOf(t));   // in ROWS (negative = slide up)
      const y = `translateY(calc(${shift} * 100% / 3))`;
      if (animate) {
        b.track.style.transform = y;
      } else {
        b.track.style.transition = "none";
        b.track.style.transform = y;
        void b.track.offsetWidth;              // flush, then restore the transition
        b.track.style.transition = "";
      }
    }

    // All 3 visible words share ONE font scale = the biggest that lets the
    // WIDEST of them fit the (possibly 30%-narrow) column — so nothing is ever
    // clipped to "…" and every word on a board reads at the same size
    // (teacher's request, 5/8/2026). The probe measures a word at the base
    // font; --rw-fit multiplies every row/input/reveal font-size in the CSS.
    function fitBoard(t) {
      const b = boardEls[t];
      const sample = b.rowEls[0];
      if (!sample) return;
      const avail = sample.body.clientWidth;
      if (avail <= 0) { b.board.style.setProperty("--rw-fit", "1"); return; }
      const top = topIndexOf(t);
      let maxNeed = 0;
      for (const i of [top, top - 1, top - 2]) {
        if (i < 0 || i >= current[t].length) continue;
        b.probe.textContent = String(current[t][i]).toUpperCase();
        maxNeed = Math.max(maxNeed, b.probe.offsetWidth);
      }
      const fit = maxNeed > avail ? avail / maxNeed : 1;
      b.board.style.setProperty("--rw-fit", fit.toFixed(3));
    }

    // Repaint one team's rows from state. Cheap enough to run whole-column on
    // every turn (50 rows), and far less error-prone than patching single rows.
    function paintBoard(t) {
      const list = current[t];
      const { board, rowEls, footer } = boardEls[t];

      // The 70/30 split (teacher's request, 5/8/2026) applies from "prep"
      // onward, not just "play" — so picking a side before the 3-2-1 already
      // shows it wide. Neither class = the neutral 50/50 shown before a pick.
      const showSplit = phase === "prep" || phase === "countdown" || phase === "play";
      board.classList.toggle("is-active", showSplit && turn === t);
      board.classList.toggle("is-waiting", showSplit && !!turn && turn !== t);
      board.classList.toggle("is-pickable", phase === "prep");
      board.classList.toggle("is-dimmed", phase === "play" && paused);

      const top = topIndexOf(t);
      rowEls.forEach((r, i) => {
        const status = rows[t][i];
        const isInput = i === idx[t] && phase === "play" && turn === t;
        r.row.classList.toggle("is-done", status === "ok");
        r.row.classList.toggle("is-passed", status === "pass");
        r.row.classList.toggle("is-current", isInput);
        r.row.classList.toggle("is-future", !status && !isInput);
        // Visible-tier shrink/fade (teacher's request, 5/8/2026): the top row
        // (newest) is full size and opacity, the two OLDER rows below it get
        // smaller and fainter (tier1 then tier2). Rows outside the window carry
        // no tier class and are clipped away by the viewport.
        const tier = top - i;
        r.row.classList.toggle("tier0", tier === 0);
        r.row.classList.toggle("tier1", tier === 1);
        r.row.classList.toggle("tier2", tier === 2);

        if (status === "ok") {
          r.body.textContent = list[i].toUpperCase();
          r.mark.innerHTML = icons.check;
        } else if (status === "pass") {
          // PASSED words are now REVEALED, in plain ink (teacher's request,
          // 5/8/2026 — the one deliberate exception to "never show the word").
          r.body.textContent = list[i].toUpperCase();
          r.mark.innerHTML = icons.cross;
        } else if (isInput) {
          r.body.innerHTML = "";
          r.body.append(input);
          r.mark.innerHTML = "";
        } else {
          r.body.textContent = "";
          r.mark.innerHTML = "";
        }
      });

      const animate = !boardEls[t].noAnim;
      boardEls[t].noAnim = false;
      applyTrack(t, animate);
      fitBoard(t);

      // words remaining — bare number, centred at the bottom of the board
      // (teacher's request, 5/8/2026 — replaces "N words" in the header).
      footer.textContent = String(Math.max(0, list.length - idx[t]));
    }

    function paintClocks() {
      TEAMS.forEach(t => {
        const c = clockEls[t];
        c.time.textContent = fmtClock(clock[t]);
        const secs = Math.ceil(clock[t] / 1000);
        c.box.classList.toggle("is-active", phase === "play" && t === turn && !paused);
        c.box.classList.toggle("is-paused", paused && t === turn);
        c.box.classList.toggle("is-warn", cfg.warnSec > 0 && secs <= cfg.warnSec && clock[t] > 0 && phase === "play");
        c.box.classList.toggle("is-dead", clock[t] <= 0);
      });
      if (refUI) {
        const canStart = phase === "prep" && !!turn;
        const isPlaying = phase === "play";
        const isTicking = isPlaying && !paused;   // local — deliberately not the outer `running` flag
        refUI.playPauseBtn.disabled = !(canStart || isPlaying);
        refUI.playPauseBtn.classList.toggle("is-pause", isTicking);
        // ⚠️ Only swap the icon SVG when it actually CHANGES. paintClocks() runs
        // every 100ms tick; blindly re-setting innerHTML replaced the button's
        // child SVG 10×/s, so a tap whose pointerdown/up straddled a rebuild
        // lost its click — that was the "sometimes works" bug (5/8/2026).
        const icon = isTicking ? "pause" : "play";
        if (refUI._icon !== icon) {
          refUI.playPauseBtn.innerHTML = isTicking ? SVG_PAUSE : SVG_PLAY;
          refUI._icon = icon;
        }
        refUI.playPauseBtn.title = isTicking ? "Pause" : (isPlaying ? "Resume" : "Play");
      }
      // Each team's PASS lights up only on that team's own live turn.
      TEAMS.forEach(t => {
        const btn = passEls[t];
        if (btn) btn.disabled = !(phase === "play" && !paused && turn === t);
      });
    }

    // The engine's own nav label ("TEAM X · word N of M") is gone (teacher's
    // request, 5/8/2026). Instead the centre of the bottom bar — same row as
    // the Menu button, with the arrows hidden — carries the slogan, styled to
    // match Crossword's (see `.act-running_word .aw-nav-label` in the CSS).
    // Putting it here rather than as a floating div keeps it off the keyboard
    // (where the old absolutely-positioned version was landing) and gives it a
    // visible colour against the white bar.
    function paintNav() {
      ui.setNav({ index: 0, total: 0, onPrev: null, onNext: null, label: SLOGAN });
    }

    function paintAll() {
      TEAMS.forEach(paintBoard);
      paintClocks();
      paintNav();
      refreshKeys();
    }

    // ===== CLOCK ===========================================================
    let tickId = null;
    let lastFrame = 0;
    function tick() {
      if (phase !== "play" || !running || paused) { lastFrame = performance.now(); return; }
      const now = performance.now();
      const dt = Math.max(0, now - lastFrame);
      lastFrame = now;
      clock[turn] = Math.max(0, clock[turn] - dt);

      // hurry-up ticking: one beep per whole second inside the warning window
      const secs = Math.ceil(clock[turn] / 1000);
      if (cfg.warnSec > 0 && secs <= cfg.warnSec && secs > 0 && lastTick[turn] !== secs) {
        lastTick[turn] = secs;
        rwSound.tick(secs);
      }
      paintClocks();
      if (clock[turn] <= 0) endMatch("timeout", other(turn));
    }

    function togglePause() {
      if (phase !== "play") return;
      paused = !paused;
      lastFrame = performance.now();
      if (paused) rwSound.pauseBeep(); else { rwSound.resumeBeep(); focusInput(); }
      paintAll();
    }

    // ===== TYPING ==========================================================
    function focusInput() {
      if (phase !== "play" || paused) return;
      try { input.focus({ preventScroll: true }); } catch { input.focus(); }
      const n = input.value.length;
      try { input.setSelectionRange(n, n); } catch { /* not supported on some types */ }
    }
    function filterEnglish() {
      const before = input.value;
      const cleaned = before.replace(/[^\x20-\x7E]/g, "");
      if (cleaned !== before) {
        const delta = before.length - cleaned.length;
        const caret = Math.max(0, (input.selectionStart ?? cleaned.length) - delta);
        input.value = cleaned;
        try { input.setSelectionRange(caret, caret); } catch { /* ignore */ }
      }
    }
    function insertChar(ch) {
      if (phase !== "play" || paused) return;
      const s = input.selectionStart ?? input.value.length;
      const e = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, s) + ch + input.value.slice(e);
      const p = s + ch.length;
      try { input.setSelectionRange(p, p); } catch { /* ignore */ }
      input.classList.remove("is-wrong");
      refreshKeys();
      focusInput();
    }
    function backspace() {
      if (phase !== "play" || paused) return;
      const s = input.selectionStart ?? input.value.length;
      const e = input.selectionEnd ?? input.value.length;
      if (s === e) {
        if (s === 0) return;
        input.value = input.value.slice(0, s - 1) + input.value.slice(e);
        try { input.setSelectionRange(s - 1, s - 1); } catch { /* ignore */ }
      } else {
        input.value = input.value.slice(0, s) + input.value.slice(e);
        try { input.setSelectionRange(s, s); } catch { /* ignore */ }
      }
      input.classList.remove("is-wrong");
      refreshKeys();
      focusInput();
    }
    function refreshKeys() { kbd?.refresh(); }   // null until the match starts

    // ===== THE THREE MOVES: submit · pass · Andrew ==========================
    function submit() {
      if (phase !== "play" || paused || finished) return;
      const typed = input.value.trim();
      if (!typed) return;
      const t = turn;
      const word = current[t][idx[t]];
      if (word == null) return;

      if (norm(typed) !== norm(word)) {
        // WRONG: the clock keeps running (chess-clock law) and the team stays on
        // this word. The typed text is left in the box so they can fix a letter
        // instead of retyping the lot.
        rwSound.wrong();
        input.classList.remove("is-wrong"); void input.offsetWidth;
        input.classList.add("is-wrong");
        const rowEl = boardEls[t].rowEls[idx[t]];
        if (rowEl) {
          rowEl.row.classList.remove("is-shake"); void rowEl.row.offsetWidth;
          rowEl.row.classList.add("is-shake");
        }
        focusInput();
        return;
      }

      // CORRECT
      rows[t][idx[t]] = "ok";
      idx[t] = idx[t] + 1;
      moves[t] = moves[t] + 1;
      clock[t] += cfg.incrementMs;
      lastTick[t] = null;
      input.value = "";
      input.classList.remove("is-wrong");
      andrewShown = false;
      hideReveal();
      rwSound.correct();
      flyWord(t);
      endTurn(t);
    }

    // A move that ENDS team t's turn just happened (idx + moves already
    // advanced). Decides whether the match settles now or the turn passes:
    //   • note the FIRST team to finish its list (it owns the result label)
    //   • settle by LIST only when a list is done AND both teams have played the
    //     same number of moves (teacher's rule, 5/8/2026) — until then, hand the
    //     clock over so the second team gets its equalising turn.
    function endTurn(t) {
      if (idx[t] >= current[t].length && !listDone) { listDone = true; finisher = t; }
      if (listDone && moves.a === moves.b) { endMatch("list", finisher); return; }
      swapTurn();
    }

    function doPass() {
      if (phase !== "play" || paused || finished || !cfg.allowPass) return;
      const t = turn;
      if (idx[t] >= current[t].length) return;
      rows[t][idx[t]] = "pass";
      idx[t] = idx[t] + 1;
      moves[t] = moves[t] + 1;
      clock[t] = Math.max(0, clock[t] - cfg.passPenaltyMs);
      lastTick[t] = null;
      input.value = "";
      andrewShown = false;
      hideReveal();
      rwSound.pass();
      if (clock[t] <= 0) { endMatch("timeout", other(t)); return; }
      endTurn(t);
    }

    function swapTurn() {
      turn = other(turn);
      lastFrame = performance.now();
      rwSound.clack();
      paintAll();
      focusInput();
    }

    // Andrew: show the word for the current turn so the typer can copy it.
    // One use per TEAM for the whole match (Options: 0..3).
    let revealEl = null;
    function useAndrew() {
      if (phase !== "play" || paused || andrewShown) return;
      const t = turn;
      if (andrewLeft[t] <= 0) return;
      andrewLeft[t]--;
      andrewShown = true;
      const word = current[t][idx[t]];
      hideReveal();
      revealEl = el("div", "aw-rw-reveal", escapeHtml(String(word).toUpperCase()));
      const rowEl = boardEls[t].rowEls[idx[t]];
      (rowEl ? rowEl.row : match).append(revealEl);
      rwSound.andrew();
      refreshKeys();
      focusInput();
    }
    function hideReveal() { if (revealEl) { revealEl.remove(); revealEl = null; } }

    // A ghost of the word just won flies from its row to the team's clock —
    // the same "reward flies to the counter" language the other templates use.
    function flyWord(t) {
      const rowEl = boardEls[t].rowEls[idx[t] - 1];
      const target = clockEls[t].time;
      if (!rowEl || !target) return;
      const from = rowEl.body.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      if (!from.width || !to.width) return;
      const ghost = el("div", "aw-rw-fly", icons.check);
      ghost.style.left = (from.left + from.width / 2) + "px";
      ghost.style.top = (from.top + from.height / 2) + "px";
      document.body.append(ghost);
      const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      let done = false;
      const drop = () => { if (done) return; done = true; ghost.remove(); };
      const anim = ghost.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.4)`, opacity: 0 }
      ], { duration: 480, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });
      anim.onfinish = drop;
      setTimeout(drop, 640);          // the animate() fallback rule (hidden tab -> no onfinish)
      flyNodes.add(ghost);
    }
    const flyNodes = new Set();

    // ===== END OF MATCH ====================================================
    // reason: "timeout"  -> `winner` is the team still holding time
    //         "list"     -> `finisher` completed its list; words decide, then clock
    //         "submit"   -> the referee ended it early from the menu
    function endMatch(reason, who) {
      if (finished) return;
      finished = true;
      phase = "over";
      running = false;
      if (tickId) { clearInterval(tickId); tickId = null; }
      hideReveal();
      input.blur();
      if (input.parentElement) input.remove();
      TEAMS.forEach(paintBoard);   // the winning word must show green before the result board

      const wordsA = rows.a.filter(s => s === "ok").length;
      const wordsB = rows.b.filter(s => s === "ok").length;

      let winner = null, headline = "", detail = "";
      if (reason === "timeout") {
        winner = who;
        headline = `${cfg.names[winner]} WINS`;
        detail = `${cfg.names[other(winner)]} ran out of time`;
      } else if (reason === "list") {
        winner = wordsA === wordsB ? (clock.a >= clock.b ? "a" : "b") : (wordsA > wordsB ? "a" : "b");
        headline = `${cfg.names[winner]} WINS`;
        detail = wordsA === wordsB
          ? `${cfg.names[who]} finished the list — more time left decides`
          : `${cfg.names[who]} finished the whole list`;
      } else {
        if (wordsA === wordsB) {
          winner = clock.a === clock.b ? null : (clock.a > clock.b ? "a" : "b");
          detail = winner ? "Level on words — more time left decides" : "A dead heat";
        } else {
          winner = wordsA > wordsB ? "a" : "b";
          detail = "More words spelled";
        }
        headline = winner ? `${cfg.names[winner]} WINS` : "IT'S A DRAW";
      }

      if (reason === "timeout") rwSound.timeUp();
      later(() => rwSound.win(), reason === "timeout" ? 1300 : 0);

      paintClocks();
      ui.setNav({ index: 0, total: 0, onPrev: null, onNext: null, label: SLOGAN });
      showResult(headline, detail, winner, wordsA, wordsB);

      // Let the result board be read for a beat, THEN hand off to the engine's
      // own GAME COMPLETE panel (Start again / Show answers / …). The result
      // overlay MUST be removed first: it sits at z-index 45, above the engine's
      // summary backdrop (z-index 13), so leaving it up trapped that panel
      // behind it — the end screen looked frozen, Menu and all (5/8/2026 fix).
      later(() => {
        if (resultOverlay) { resultOverlay.remove(); resultOverlay = null; }
        const total = current.a.length + current.b.length;
        const correct = wordsA + wordsB;
        // Hand the two-team scoreboard to renderSummary (per-team "won/total").
        rwEndData = {
          names: { a: cfg.names.a, b: cfg.names.b },
          wordsA, wordsB,
          totalA: current.a.length, totalB: current.b.length,
          timeA: clock.a, timeB: clock.b,
          winner
        };
        ui.finish({
          title: headline,
          score: winner === "b" ? wordsB : wordsA,
          scoreText: `${cfg.names.a} ${wordsA} – ${wordsB} ${cfg.names.b}`,
          correct,
          incorrect: 0,
          total,
          answered: correct,
          perQuestion: [],
          review: buildReview()
        });
      }, 2600);
    }

    let resultOverlay = null;
    function showResult(headline, detail, winner, wordsA, wordsB) {
      const over = el("div", "aw-rw-result");
      resultOverlay = over;
      over.append(el("div", "aw-rw-result-head", escapeHtml(headline)));
      over.append(el("div", "aw-rw-result-detail", escapeHtml(detail)));
      const grid = el("div", "aw-rw-result-grid");
      TEAMS.forEach(t => {
        const col = el("div", `aw-rw-result-team is-${t}` + (winner === t ? " is-winner" : ""));
        col.append(el("div", "aw-rw-result-name", escapeHtml(cfg.names[t])));
        col.append(el("div", "aw-rw-result-words", String(t === "a" ? wordsA : wordsB)));
        col.append(el("div", "aw-rw-result-lab", "words"));
        col.append(el("div", "aw-rw-result-time", fmtClock(clock[t])));
        col.append(el("div", "aw-rw-result-lab", "time left"));
        grid.append(col);
      });
      over.append(grid);
      match.append(over);
    }

    // The engine's "Show answers" screen: every row of both lists, so the class
    // can go back over the words nobody got.
    function buildReview() {
      const out = [];
      TEAMS.forEach(t => {
        current[t].forEach((word, i) => {
          const status = rows[t][i];
          out.push({
            question: `${cfg.names[t]} · ${i + 1}`,
            answered: status != null,
            yourText: status === "ok" ? word.toUpperCase() : (status === "pass" ? "passed" : null),
            yourCorrect: status === "ok",
            correctText: word.toUpperCase()
          });
        });
      });
      return out;
    }

    // ===== wiring ==========================================================
    // Menu -> "Submit answers" ends the match early; the counter keeps the
    // engine from offering it before a single word has been played.
    ui.onSubmit(
      () => { if (phase === "play") endMatch("submit", null); },
      () => rows.a.filter(Boolean).length + rows.b.filter(Boolean).length
    );

    function onKey(e) {
      if (phase !== "play") return;
      if (e.key === "Escape") { e.preventDefault(); togglePause(); }
    }
    window.addEventListener("keydown", onKey);

    renderSetup();
    ui.setNav({ index: 0, total: 0, onPrev: null, onNext: null, label: SLOGAN });

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      boardRO.disconnect();
      if (tickId) clearInterval(tickId);
      timers.forEach(clearTimeout);
      timers.clear();
      flyNodes.forEach(n => n.remove());
      flyNodes.clear();
      hideReveal();
    };
  }
};

// Small inline glyphs for the big Play/Pause button. Deliberately local
// rather than added to core/icons.js — no other template needs them, and
// core stays untouched.
const SVG_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';
const SVG_PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19 12 8 5.2z"/></svg>';

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(rwTemplate);
export default rwTemplate;
