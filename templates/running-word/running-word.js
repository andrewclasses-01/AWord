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
import { poolFrom, buildSets, readSets, setStats, normWordsPerTeam, MAX_SETS } from "./rw-sets.js";

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
  hasKeyboardToggle: true,   // borrow the bottom-bar slot for the show/hide keyboard button
  manualTimerStart: true,    // the engine clock starts when the match does, not at mount

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

  buildExtraOptions({ panel, draft, el: E, mkCheck }) {
    // The "Words per team" slider needs the pool size, but the engine only ever
    // hands this hook `draft` (= a copy of activity.options). Rather than stash
    // the count IN the options — where Apply would happily persist it to
    // Firestore as junk — mount() leaves it in this module-level hint. Only one
    // game is mounted at a time, so it is always the right activity's.
    const poolSize = Math.max(1, poolSizeHint);

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
    slider(gClock, "Time each team", "clockSeconds", 30, 1800, 30, 300, v => fmtClock(v * 1000));
    slider(gClock, "Bonus per correct word", "incrementSeconds", 0, 15, 1, 0, v => (v ? `+${v}s` : "Off"));
    slider(gClock, "Hurry-up warning", "warnSeconds", 0, 60, 5, 15, v => (v ? `last ${v}s` : "Off"));
    panel.append(gClock);

    // ---- the round ----
    const gRound = group("Round");
    slider(gRound, "Words per team", "wordsPerTeam", 0, poolSize, 1, 0,
      v => (v <= 0 ? `All (${poolSize})` : String(v)));
    slider(gRound, "Andrew help per team", "andrewUses", 0, 3, 1, 1, v => (v ? `${v}×` : "Off"));
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
    poolSizeHint = pool.length;      // read back by buildExtraOptions (see there)

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
      clockMs: clampInt(opt.clockSeconds, 30, 1800, 300) * 1000,
      incrementMs: clampInt(opt.incrementSeconds, 0, 15, 0) * 1000,
      warnSec: clampInt(opt.warnSeconds, 0, 60, 15),
      perTeam: normWordsPerTeam(opt.wordsPerTeam, pool.length),
      allowPass: opt.allowPass !== false,
      passPenaltyMs: clampInt(opt.passPenaltySeconds, 0, 60, 10) * 1000,
      andrewUses: clampInt(opt.andrewUses, 0, 3, 1)
    };

    // ---------- match state ----------
    let sets = readSets(activity);                 // saved splits (up to 3)
    let setIndex = 0;                               // which one is selected
    let current = sets[0] || buildSets(pool, cfg.perTeam);
    let dirty = !sets.length;                        // current split isn't one of the saved ones

    let phase = "setup";                             // setup -> countdown -> play -> over
    let turn = "a";
    let running = false, paused = false, finished = false;
    const idx = { a: 0, b: 0 };
    const rows = { a: [], b: [] };                   // per-row status: null | "ok" | "pass"
    const clock = { a: cfg.clockMs, b: cfg.clockMs };
    const andrewLeft = { a: cfg.andrewUses, b: cfg.andrewUses };
    let andrewShown = false;                         // the word is revealed for the current turn
    let lastTick = { a: null, b: null };              // whole second last announced per clock
    let undoSnap = null;                              // one level of referee undo
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

    const clocks = el("div", "aw-rw-clocks");
    const clockEls = {};
    TEAMS.forEach(t => {
      const box = el("div", `aw-rw-clock is-${t}`);
      const name = el("div", "aw-rw-clock-name", escapeHtml(cfg.names[t]));
      const time = el("div", "aw-rw-clock-time", fmtClock(clock[t]));
      const meta = el("div", "aw-rw-clock-meta");
      const wordsDone = el("span", "aw-rw-clock-words", "0");
      meta.append(el("span", "aw-rw-clock-wordslab", "words"), wordsDone);
      box.append(name, time, meta);
      clockEls[t] = { box, time, wordsDone };
      clocks.append(box);
      if (t === "a") clocks.append(refereeBar());
    });
    match.append(clocks);

    const boards = el("div", "aw-rw-boards");
    const boardEls = {};
    TEAMS.forEach(t => {
      const board = el("div", `aw-rw-board is-${t}`);
      const scroller = el("div", "aw-rw-rows");
      board.append(scroller);
      boardEls[t] = { board, scroller, rowEls: [] };
      boards.append(board);
    });
    match.append(boards);

    // The single live input, moved into whichever row is currently in play.
    const input = el("input", "aw-rw-input");
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.maxLength = 40;

    let keyboardVisible = true;
    input.inputMode = "none";     // AWord's own keyboard is up by default
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
    });
    input.addEventListener("input", () => { filterEnglish(); refreshKeys(); });
    input.addEventListener("compositionend", () => { filterEnglish(); refreshKeys(); });

    // The keyboard is built when the MATCH starts, not at mount(): during setup
    // there is nothing to type into, and every key would be born disabled.
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
          isDisabled: () => phase !== "play" || paused || andrewShown || andrewLeft[turn] <= 0,
          onClick: useAndrew
        }
      });
      if (!keyboardVisible) kbd.setHidden(true);
      match.append(kbd.el);
    }

    // keyboard show/hide button in the engine's bottom-bar slot
    let kbdBtn = null;
    if (ui.kbdSlot) {
      ui.kbdSlot.innerHTML = "";
      kbdBtn = el("button", "aw-iconbtn", icons.keyboard);
      kbdBtn.type = "button";
      kbdBtn.onclick = () => {
        keyboardVisible = !keyboardVisible;
        kbd?.setHidden(!keyboardVisible);
        input.inputMode = keyboardVisible ? "none" : "text";
        kbdBtn.classList.toggle("is-off", !keyboardVisible);
        kbdBtn.title = keyboardVisible ? "Hide keyboard" : "Show keyboard";
        if (phase === "play") focusInput();
      };
      kbdBtn.title = "Hide keyboard";
      ui.kbdSlot.append(kbdBtn);
    }

    // ===== referee strip (between the two clocks) ===========================
    function refereeBar() {
      const bar = el("div", "aw-rw-ref");
      const turnArrow = el("div", "aw-rw-turnarrow", "&#9654;");
      bar.append(turnArrow);
      const btns = el("div", "aw-rw-refbtns");

      const passBtn = el("button", "aw-rw-refbtn is-pass", "PASS");
      passBtn.type = "button";
      passBtn.title = "Skip this word (time penalty)";
      passBtn.onclick = () => doPass();

      const pauseBtn = el("button", "aw-rw-refbtn is-pause", SVG_PAUSE);
      pauseBtn.type = "button";
      pauseBtn.title = "Pause the clock";
      pauseBtn.onclick = () => togglePause();

      const undoBtn = el("button", "aw-rw-refbtn is-undo", SVG_UNDO);
      undoBtn.type = "button";
      undoBtn.title = "Undo the last word";
      undoBtn.onclick = () => doUndo();

      if (cfg.allowPass) btns.append(passBtn);
      btns.append(pauseBtn, undoBtn);
      bar.append(btns);
      refUI = { bar, turnArrow, passBtn, pauseBtn, undoBtn };
      return bar;
    }

    // ===== SETUP SCREEN CONTENT ============================================
    // Deliberately shows COUNTS ONLY. Rendering the actual lists here would put
    // both teams' words on the classroom screen with the typers watching.
    let setUI = null;
    function renderSetup() {
      setup.innerHTML = "";
      setup.append(el("div", "aw-rw-setup-title", "RUNNING WORD"));
      setup.append(el("div", "aw-rw-setup-sub",
        "Two teams · one chess clock · spell the word to pass the turn"));

      // -- saved set chooser --
      const slots = el("div", "aw-rw-slots");
      for (let i = 0; i < MAX_SETS; i++) {
        const saved = sets[i];
        const isSel = i === setIndex;
        const slot = el("button", "aw-rw-slot" + (isSel ? " is-sel" : "") + (saved ? "" : " is-empty"));
        slot.type = "button";
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
          else { current = buildSets(pool, cfg.perTeam); dirty = true; }
          renderSetup();
        };
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

      const shuffleBtn = el("button", "aw-rw-btn", "Shuffle new split");
      shuffleBtn.type = "button";
      shuffleBtn.onclick = () => {
        ui.sound.click?.();
        current = buildSets(pool, cfg.perTeam);
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

      const note = el("div", "aw-rw-setup-note",
        dirty
          ? "This split is new — print it, and save it if you want the same sheets next lesson."
          : "Playing the saved split — it matches the sheets you printed from this set.");
      setup.append(note);

      const start = el("button", "aw-rw-start", "START MATCH");
      start.type = "button";
      start.onclick = () => { ui.sound.click?.(); beginCountdown(); };
      setup.append(start);

      const cfgLine = el("div", "aw-rw-setup-cfg", [
        `${fmtClock(cfg.clockMs)} each`,
        cfg.incrementMs ? `+${cfg.incrementMs / 1000}s per word` : null,
        cfg.allowPass ? `PASS −${cfg.passPenaltyMs / 1000}s` : "no PASS",
        cfg.andrewUses ? `Andrew ×${cfg.andrewUses} per team` : "no Andrew",
        cfg.warnSec ? `warning in the last ${cfg.warnSec}s` : null
      ].filter(Boolean).join("  ·  "));
      setup.append(cfgLine);

      setUI = { start };
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
        const next = sets.slice();
        next[setIndex] = { a: current.a.slice(), b: current.b.slice() };
        for (let i = 0; i < next.length; i++) if (!next[i]) next[i] = { a: [], b: [] };
        activity.content = activity.content || {};
        activity.content.printSets = next.filter(s => s.a.length && s.b.length);
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

    // ===== COUNTDOWN =======================================================
    function beginCountdown() {
      phase = "countdown";
      setup.style.display = "none";
      match.style.display = "";
      buildRows();
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
      buildKeyboard();          // AFTER phase is "play" — see the note on buildKeyboard
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
        const { scroller, rowEls } = boardEls[t];
        scroller.innerHTML = "";
        rowEls.length = 0;
        // A header naming the team, so a glance at the column is unambiguous
        // even when the clocks are above the fold on a small window.
        const head = el("div", "aw-rw-rowhead");
        head.append(el("span", "aw-rw-rowhead-name", escapeHtml(cfg.names[t])),
                    el("span", "aw-rw-rowhead-count", `${list.length} words`));
        scroller.append(head);
        list.forEach((word, i) => {
          const row = el("div", "aw-rw-row");
          const no = el("span", "aw-rw-row-no", String(i + 1));
          const body = el("span", "aw-rw-row-body");
          const mark = el("span", "aw-rw-row-mark");
          row.append(no, body, mark);
          scroller.append(row);
          rowEls.push({ row, body, mark });
        });
      });
    }

    // Repaint one team's rows from state. Cheap enough to run whole-column on
    // every turn (50 rows), and far less error-prone than patching single rows.
    function paintBoard(t) {
      const list = current[t];
      const { board, rowEls } = boardEls[t];
      const active = phase === "play" && t === turn && !paused;
      board.classList.toggle("is-active", active);
      board.classList.toggle("is-waiting", phase === "play" && t !== turn);

      rowEls.forEach((r, i) => {
        const status = rows[t][i];
        const isCurrent = i === idx[t] && phase === "play";
        r.row.classList.toggle("is-done", status === "ok");
        r.row.classList.toggle("is-passed", status === "pass");
        r.row.classList.toggle("is-current", isCurrent);
        r.row.classList.toggle("is-live", isCurrent && t === turn);
        r.row.classList.toggle("is-future", !status && !isCurrent);

        if (status === "ok") {
          r.body.textContent = list[i].toUpperCase();
          r.mark.innerHTML = icons.check;
        } else if (status === "pass") {
          // The word is NOT revealed: it may also sit on the other team's list,
          // and passing must never hand it over for free.
          r.body.textContent = "—";
          r.mark.innerHTML = icons.cross;
        } else if (isCurrent && t === turn) {
          r.body.innerHTML = "";
          r.body.append(input);
          r.mark.innerHTML = "";
        } else {
          r.body.textContent = "";
          r.mark.innerHTML = "";
        }
      });
      // keep the row in play in view
      const cur = rowEls[idx[t]];
      if (cur) keepInView(boardEls[t].scroller, cur.row);
    }

    function keepInView(scroller, row) {
      const sr = scroller.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      if (rr.top < sr.top + rr.height) scroller.scrollTop += rr.top - sr.top - rr.height;
      else if (rr.bottom > sr.bottom - rr.height) scroller.scrollTop += rr.bottom - sr.bottom + rr.height;
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
        c.wordsDone.textContent = String(rows[t].filter(s => s === "ok").length);
      });
      if (refUI) {
        refUI.turnArrow.classList.toggle("is-b", turn === "b");
        refUI.pauseBtn.classList.toggle("is-on", paused);
        refUI.pauseBtn.innerHTML = paused ? SVG_PLAY : SVG_PAUSE;
        refUI.undoBtn.disabled = !undoSnap;
        if (refUI.passBtn) refUI.passBtn.disabled = phase !== "play" || paused;
      }
    }

    function paintScore() {
      const scoreEl = ui.scoreEl || document.querySelector(".aw-top-score");
      if (!scoreEl) return;
      const a = rows.a.filter(s => s === "ok").length;
      const b = rows.b.filter(s => s === "ok").length;
      scoreEl.innerHTML =
        `<span class="aw-rw-sc is-a">${a}</span>` +
        `<span class="aw-rw-sc-sep">–</span>` +
        `<span class="aw-rw-sc is-b">${b}</span>`;
    }

    function paintNav() {
      const t = turn;
      const n = Math.min(idx[t] + 1, current[t].length);
      ui.setNav({
        index: n, total: current[t].length,
        onPrev: null, onNext: null,
        label: phase === "play"
          ? `${cfg.names[t]}  ·  word ${n} of ${current[t].length}`
          : ""
      });
    }

    function paintAll() {
      TEAMS.forEach(paintBoard);
      paintClocks();
      paintScore();
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
      undoSnap = snapshot();
      rows[t][idx[t]] = "ok";
      idx[t] = idx[t] + 1;
      clock[t] += cfg.incrementMs;
      lastTick[t] = null;
      input.value = "";
      input.classList.remove("is-wrong");
      andrewShown = false;
      hideReveal();
      rwSound.correct();
      flyWord(t);

      if (idx[t] >= current[t].length) {           // this team finished its list
        endMatch("list", t);
        return;
      }
      swapTurn();
    }

    function doPass() {
      if (phase !== "play" || paused || finished || !cfg.allowPass) return;
      const t = turn;
      if (idx[t] >= current[t].length) return;
      undoSnap = snapshot();
      rows[t][idx[t]] = "pass";
      idx[t] = idx[t] + 1;
      clock[t] = Math.max(0, clock[t] - cfg.passPenaltyMs);
      lastTick[t] = null;
      input.value = "";
      andrewShown = false;
      hideReveal();
      rwSound.pass();
      if (clock[t] <= 0) { endMatch("timeout", other(t)); return; }
      if (idx[t] >= current[t].length) { endMatch("list", t); return; }
      swapTurn();
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
      const target = clockEls[t].wordsDone;
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

    // ===== UNDO (referee) ==================================================
    function snapshot() {
      return {
        turn,
        idx: { ...idx },
        clock: { ...clock },
        rowsA: rows.a.slice(),
        rowsB: rows.b.slice(),
        andrewLeft: { ...andrewLeft }
      };
    }
    function doUndo() {
      if (!undoSnap || phase !== "play") return;
      const s = undoSnap;
      undoSnap = null;
      turn = s.turn;
      idx.a = s.idx.a; idx.b = s.idx.b;
      clock.a = s.clock.a; clock.b = s.clock.b;
      rows.a = s.rowsA; rows.b = s.rowsB;
      andrewLeft.a = s.andrewLeft.a; andrewLeft.b = s.andrewLeft.b;
      andrewShown = false;
      hideReveal();
      input.value = "";
      lastFrame = performance.now();
      lastTick = { a: null, b: null };
      ui.toast?.("Last word undone.");
      paintAll();
      focusInput();
    }

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
      paintScore();
      ui.setNav({ index: 0, total: 0, onPrev: null, onNext: null, label: "" });
      showResult(headline, detail, winner, wordsA, wordsB);

      // Let the result board be read before the engine's own celebration and
      // summary panel take the screen.
      later(() => {
        const total = current.a.length + current.b.length;
        const correct = wordsA + wordsB;
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

    function showResult(headline, detail, winner, wordsA, wordsB) {
      const over = el("div", "aw-rw-result");
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
    ui.setNav({ index: 0, total: 0, onPrev: null, onNext: null, label: "" });
    paintScore();

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (tickId) clearInterval(tickId);
      timers.forEach(clearTimeout);
      timers.clear();
      flyNodes.forEach(n => n.remove());
      flyNodes.clear();
      hideReveal();
      if (ui.kbdSlot) ui.kbdSlot.innerHTML = "";
    };
  }
};

// Small inline glyphs for the referee strip. Deliberately local rather than
// added to core/icons.js — no other template needs a pause or an undo, and
// core stays untouched.
// Set by mount(), read by buildExtraOptions() — see the note in that hook.
let poolSizeHint = 100;

const SVG_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';
const SVG_PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19 12 8 5.2z"/></svg>';
const SVG_UNDO  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 0 14h-3"/></svg>';

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(rwTemplate);
export default rwTemplate;
