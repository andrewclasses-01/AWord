// =============================================================
// TEMPLATE: RUNNING TEAM (RUNNINGT) — a whole-class relay against the clock,
// played off ONE sheet of paper that travels around the room.
//
// HOW IT IS PLAYED
//   The screen calls a pupil and a number — "MINH ANH — 23". Minh Anh is
//   holding the printed word list; she finds row 23 and reads that word out
//   loud. Six words are on screen and five of them LOOK like the answer, so
//   somebody else has to listen properly and pick the right one. Tap it and the
//   board clears: READY, 3, 2, 1, and the next name is called. The paper is
//   passed to whoever is named next — that is the "running" in Running team.
//
// WHAT MAKES IT A GAME
//   Two clocks and a row of hearts. Every question has its own short countdown;
//   letting it run out, or tapping the wrong word, costs a heart. Lose the last
//   heart and the class loses. But there is also a MAIN clock counting down over
//   the whole round: survive to zero and the CLASS WINS. Clear the whole word
//   list first and they win too.
//
// WHAT THIS TEMPLATE NEEDS THAT NO OTHER ONE DOES
//   Real pupils' names. They come from Settings > Classes (core/classes.js) —
//   app-wide data, not activity content, because the same roll is wanted by
//   every future activity that calls children by name. The setup screen picks a
//   class and lets the teacher untick whoever is away today.
//
// A "GAME SET" = one printed numbering + the roll it was played with, saved
// together on the activity. Both have to persist as a pair: a teacher who closes
// the app mid-lesson must be able to reprint the exact sheet the class is
// holding. See rt-sets.js.
//
// CORE IS UNTOUCHED. Everything this game needs already existed:
//   • the 4:3 frame + the CSS-zoom fullscreen  -> `useZoomFullscreen` + the
//     `act-running_team` class the engine stamps on every stage (Running word
//     opened both doors on 5/8/2026)
//   • no whole-game engine clock               -> `hideTimerOption` +
//     options.timer:"none"; this game owns both of its clocks
//   • a different end-of-game panel            -> the `renderSummary` hook
//
//   ⚠️ It does NOT use `inlineTimerBar` or `hasLivesSlot`, even though it wants
//   exactly what they provide. Those two flags are MUTUALLY EXCLUSIVE in
//   core/engine.js: the topbar builder checks `if (topbarMid) ... else if
//   (livesSlot)`, so a template setting both gets its hearts element created and
//   then never appended — invisible, with no error anywhere. This game needs a
//   question bar AND hearts AND a main clock, so it hides the engine topbar
//   outright (running-team.css) and draws its own row, exactly as Running word
//   does. No core change, no silent trap.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { el, shuffle } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { fitOnce } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { openRunningTeamEditor } from "./running-team-editor.js";
import { rtSound } from "./rt-sound.js";
import { printRunningTeamSheet } from "./rt-print.js";
import {
  poolFrom, buildOrder, buildTiles, readSets, makeSet, rosterOf,
  setFitsPool, MIN_POOL, MAX_SETS, TILES
} from "./rt-sets.js";

const SLOGAN = "RUNNING TEAM IN ANDREW CLASSES";

// Lives are stored as 0 = UNLIMITED, 1..10 = that many hearts — the same
// convention (and the same slider) as Find the match, so the two games behave
// identically for the teacher. `null` internally means unlimited.
const MAX_LIVES = 10;
const DEFAULT_LIVES = 3;
function normLives(v) {
  if (v === 0 || v === null || v === undefined) return v === 0 ? null : DEFAULT_LIVES;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return DEFAULT_LIVES;
  if (n <= 0) return null;
  return Math.min(MAX_LIVES, n);
}

// The data the end-of-round panel needs, stashed just before ui.finish() runs.
// core/engine.js calls rtTemplate.renderSummary() AFTER the confetti — a method
// on the template object, with no access to mount()'s closure — so it reads
// this instead. Safe as a module-level single because AWord only ever mounts one
// activity at a time (the same reasoning Running word's rwEndData relies on).
let rtEndData = null;

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

const rtTemplate = {
  type: "running_team",
  scorable: true,
  name: "Running team",
  edit: openRunningTeamEditor,

  hideTimerOption: true,     // the game owns two clocks; a whole-game clock would fight them
  hideLettersOption: true,   // no A/B/C letters on the tiles
  hideShuffleAnswers: true,  // the six tiles are dealt fresh and shuffled every round
  hideAutoSwitch: true,      // questions advance on an answer, never on a checkbox
  hidePointsOff: true,       // a wrong answer costs a HEART here, not points
  manualTimerStart: true,    // nothing starts until START RUNNING is pressed
  // Real Fullscreen API measured unusable on iPad Chrome for this shape of game
  // (Running word, 5/8/2026, live device): a downward swipe near the top edge
  // silently drops fullscreen mid-round and Chrome throws a "stay fullscreen?"
  // banner over the board. The engine reads this flag and swaps the Fullscreen
  // button to a CSS-only zoom (`.aw-zoomed` on root). CSS for it lives in
  // running-team.css — core has no shared rule for that class.
  useZoomFullscreen: true,

  sounds: {
    play: () => {},          // the READY / 3-2-1 has its own sound; a jingle here would collide
    restart: () => {},
    complete: () => {}       // endGame() already played the win / lose bells
  },

  // The shared Print button (Anagram/Quiz worksheet formats) still works — it
  // just sees a plain word list with no clues. The sheet that matters for this
  // game is the numbered one printed from the setup screen.
  toPrintItems(activity) {
    return poolFrom(activity).map(w => ({ clue: "", answer: w }));
  },

  // ===== END-OF-ROUND PANEL =================================================
  // Replaces the engine's default summary body via the `tpl.renderSummary` hook.
  // The verdict is the point here, not the arithmetic: WIN or GAME OVER huge,
  // the score and the time left small underneath, and one Start again.
  renderSummary(panel, { restart, panelItem }) {
    const d = rtEndData || { won: false, correct: 0, asked: 0, total: 0, mainLeft: 0, reason: "", className: "" };
    const board = el("div", "aw-rt-sum" + (d.won ? " is-win" : " is-lose"));

    board.append(el("div", "aw-rt-sum-verdict", d.won ? "CLASS WINS" : "GAME OVER"));
    board.append(el("div", "aw-rt-sum-why", escapeHtml(reasonText(d))));

    const stats = el("div", "aw-rt-sum-stats");
    stats.append(stat(`${d.correct}/${d.asked}`, "words won"));
    stats.append(stat(fmtClock(d.mainLeft), "time left"));
    stats.append(stat(String(d.total), "words on the sheet"));
    board.append(stats);

    if (d.className) board.append(el("div", "aw-rt-sum-class", escapeHtml(d.className.toUpperCase())));
    panel.append(board);

    const row = el("div", "aw-rt-sum-acts");
    row.append(panelItem("Start again", restart));
    panel.append(row);

    function stat(big, small) {
      const s = el("div", "aw-rt-sum-stat");
      s.append(el("div", "aw-rt-sum-big", escapeHtml(big)), el("div", "aw-rt-sum-small", escapeHtml(small)));
      return s;
    }
  },

  // ===== OPTIONS ============================================================
  buildExtraOptions({ panel, draft }) {
    // -- main clock (whole minutes: nobody sets a class game to 7m20s) --
    const gMain = el("div", "aw-opt-group");
    gMain.append(el("div", "aw-opt-label", "Round time (whole game)"));
    const rowMain = el("div", "aw-opt-row");
    const mainMins = Math.round(clampInt(draft.mainSeconds, 30, 3600, 600) / 60) || 1;
    const mainStep = makeNumberStepper(mainMins, 1, 60, v => { draft.mainSeconds = v * 60; });
    rowMain.append(mainStep.el, el("span", "aw-opt-time", "minutes"));
    gMain.append(rowMain);
    panel.append(gMain);

    // -- per-question clock --
    const gQ = el("div", "aw-opt-group");
    gQ.append(el("div", "aw-opt-label", "Question time"));
    const rowQ = el("div", "aw-opt-row");
    const qStep = makeNumberStepper(
      clampInt(draft.questionSeconds, 3, 59, 15), 3, 59,
      v => { draft.questionSeconds = v; });
    rowQ.append(qStep.el, el("span", "aw-opt-time", "seconds"));
    gQ.append(rowQ);
    panel.append(gQ);

    // -- lives (0 = unlimited, exactly like Find the match) --
    const gL = el("div", "aw-opt-group");
    gL.append(el("div", "aw-opt-label", "Lives"));
    const rowL = el("div", "aw-opt-row aw-rt-livesrow");
    const cur = normLives(draft.lives);
    const curNum = cur === null ? 0 : cur;
    const val = el("span", "aw-rt-livesval", curNum === 0 ? "Unlimited" : String(curNum));
    const slider = el("input", "aw-rt-livesslider");
    slider.type = "range"; slider.min = "0"; slider.max = String(MAX_LIVES); slider.step = "1";
    slider.value = String(curNum);
    slider.oninput = () => {
      const v = parseInt(slider.value, 10);
      draft.lives = v;                        // 0 stored = unlimited
      val.textContent = v === 0 ? "Unlimited" : String(v);
    };
    rowL.append(slider, val);
    gL.append(rowL);
    gL.append(el("div", "aw-opt-note",
      "At Unlimited nobody is ever knocked out — a wrong tap just lets the class try again."));
    panel.append(gL);
  },

  // =============================================================
  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pool = poolFrom(activity);

    root.innerHTML = "";
    if (pool.length < MIN_POOL) {
      root.append(el("div", "aw-rt-empty", `This activity needs at least ${MIN_POOL} words — every round shows six.`));
      return () => {};
    }

    // Teacher vs student device. The engine strips its toolbar under the frame
    // in student mode, so its absence is a reliable signal without asking core
    // for anything new. Printing, picking a class and saving a set are all
    // teacher-only actions.
    const isTeacher = !!document.querySelector(".aw-below-right");

    const cfg = {
      mainMs: clampInt(opt.mainSeconds, 30, 3600, 600) * 1000,
      questionMs: clampInt(opt.questionSeconds, 3, 59, 15) * 1000,
      lives: normLives(opt.lives)               // null = unlimited
    };

    // ---------- setup state ----------
    let sets = readSets(activity);
    let setIndex = 0;
    let current = sets.find(Boolean) ? sets[sets.findIndex(Boolean)] : null;
    if (current) setIndex = sets.findIndex(Boolean);
    let dirty = false;                          // `current` isn't one of the saved slots

    let classes = null;                         // null = not loaded yet, [] = none/unavailable
    let classError = "";
    let pickedClassId = current?.classId || "";
    let rosterDraft = current ? rosterOf(current).map(s => ({ ...s, present: true })) : [];

    // ---------- match state ----------
    let phase = "setup";                        // setup | ready | question | over
    let order = [];                             // the printed numbering
    let roster = [];                            // pupils actually present
    let queue = [];                             // indices of `order` still to ask
    let qWordIndex = -1;                        // index into `order` of the live question
    let turnPtr = 0;                            // round-robin pointer into `roster`
    let livesLeft = null;
    let mainLeft = 0, qLeft = 0;
    let correctCount = 0, askedCount = 0;
    let locked = true;                          // tiles ignore taps between questions
    let finished = false;
    let lastQTick = null;                       // last whole second announced on the question bar
    const perQuestion = [];                     // [{q, correct}] for the engine's scoring
    const review = [];                          // [{question, answered, yourText, yourCorrect, correctText}]

    let mainTimer = null, qTimer = null;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

    // ---------- shell ----------
    const card = el("div", "aw-rt-card");
    root.append(card);

    const setup = el("div", "aw-rt-setup");
    card.append(setup);

    const match = el("div", "aw-rt-match");
    match.style.display = "none";
    card.append(match);

    // ===== MATCH CHROME (built once) ========================================
    // The engine's own topbar is hidden for this game (see the file header for
    // why), so this row is the whole status display: main clock · hearts ·
    // question bar · score.
    const top = el("div", "aw-rt-top");
    const mainClockEl = el("div", "aw-rt-mainclock", fmtClock(cfg.mainMs));
    const heartsEl = el("div", "aw-rt-hearts");
    const qbar = el("div", "aw-rt-qbar");
    const qfill = el("div", "aw-rt-qbar-fill");
    qbar.append(qfill);
    const scoreEl = el("div", "aw-rt-score", `${icons.check}<span>0</span>`);
    top.append(mainClockEl, heartsEl, qbar, scoreEl);
    match.append(top);

    const board = el("div", "aw-rt-board");
    const prompt = el("div", "aw-rt-prompt");
    const promptName = el("div", "aw-rt-prompt-name");
    const promptNum = el("div", "aw-rt-prompt-num");
    prompt.append(promptName, promptNum);
    const tilesEl = el("div", "aw-rt-tiles");
    board.append(prompt, tilesEl);
    match.append(board);

    // The READY / 3-2-1 card. It sits OVER the board rather than replacing it so
    // the board never has to be rebuilt between questions.
    const overlay = el("div", "aw-rt-overlay");
    const overlayText = el("div", "aw-rt-overlay-text");
    overlay.append(overlayText);
    overlay.style.display = "none";
    match.append(overlay);

    // ===== SETUP SCREEN =====================================================
    function renderSetup() {
      setup.innerHTML = "";
      setup.append(el("div", "aw-rt-setup-title", "RUNNING TEAM"));

      // -- saved set slots --
      const slots = el("div", "aw-rt-slots");
      for (let i = 0; i < MAX_SETS; i++) {
        const saved = sets[i];
        const isSel = i === setIndex && !dirty;
        const slot = el("div", "aw-rt-slot" + (isSel ? " is-sel" : "") + (saved ? "" : " is-empty"));
        slot.setAttribute("role", "button"); slot.tabIndex = 0;
        slot.append(el("div", "aw-rt-slot-num", `SET ${i + 1}`));
        if (saved) {
          const fits = setFitsPool(saved, pool);
          slot.append(el("div", "aw-rt-slot-main", escapeHtml(saved.className || "—")));
          slot.append(el("div", "aw-rt-slot-meta",
            fits ? `${saved.order.length} words · ${saved.studentNames.length} pupils`
                 : "word list changed"));
          if (!fits) slot.classList.add("is-stale");
        } else {
          slot.append(el("div", "aw-rt-slot-main", "—"));
          slot.append(el("div", "aw-rt-slot-meta", "empty"));
        }
        slot.onclick = () => {
          if (!sets[i]) return;                 // an empty slot is only a save target
          if (!setFitsPool(sets[i], pool)) return;
          setIndex = i;
          current = sets[i];
          rosterDraft = rosterOf(current).map(s => ({ ...s, present: true }));
          pickedClassId = current.classId || "";
          dirty = false;
          renderSetup();
        };
        // A saved slot can't be re-dealt until it is deleted — the sheets the
        // class is holding must never silently stop matching the game (the same
        // rule Running word settled on, 5/8/2026).
        if (saved && isTeacher) {
          const del = el("button", "aw-rt-slot-del", "DELETE SET");
          del.type = "button";
          del.onclick = e => { e.stopPropagation(); confirmDeleteSet(i); };
          slot.append(del);
        }
        slots.append(slot);
      }
      setup.append(slots);

      // -- class picker + roll review --
      if (isTeacher) setup.append(classBlock());

      // -- what is about to be played, in numbers --
      const present = rosterDraft.filter(s => s.present);
      const facts = el("div", "aw-rt-facts");
      facts.append(
        fact(String(pool.length), "words in pool"),
        fact(String(present.length), "pupils playing"),
        fact(fmtClock(cfg.mainMs), "round time"),
        fact(`${Math.round(cfg.questionMs / 1000)}s`, "per question"),
        fact(cfg.lives === null ? "∞" : String(cfg.lives), "lives")
      );
      setup.append(facts);

      // -- actions --
      const acts = el("div", "aw-rt-setup-acts");

      const shuffleBtn = el("button", "aw-rt-btn", "Shuffle new numbering");
      shuffleBtn.type = "button";
      shuffleBtn.disabled = !canDeal() || (!!current && !dirty);
      shuffleBtn.title = (!!current && !dirty)
        ? "Delete this SET first to deal a new numbering."
        : "";
      shuffleBtn.onclick = () => {
        if (shuffleBtn.disabled) return;
        dealCurrent();
        renderSetup();
      };
      acts.append(shuffleBtn);

      if (isTeacher) {
        const printBtn = el("button", "aw-rt-btn is-icon", `${icons.print}<span>Print word list</span>`);
        printBtn.type = "button";
        printBtn.disabled = !current;
        printBtn.onclick = () => {
          if (!current) return;
          printRunningTeamSheet(current.order, {
            title: activity.title || "Running team",
            className: current.className
          });
        };
        acts.append(printBtn);

        const saveBtn = el("button", "aw-rt-btn" + (dirty ? " is-dirty" : ""),
          dirty ? `Save as SET ${firstFreeSlot() + 1}` : (current ? `SET ${setIndex + 1} saved` : "Nothing to save"));
        saveBtn.type = "button";
        saveBtn.disabled = !dirty || !current;
        saveBtn.onclick = () => saveCurrentSet(saveBtn);
        acts.append(saveBtn);
      }
      setup.append(acts);

      const start = el("button", "aw-rt-start", "START RUNNING");
      start.type = "button";
      start.disabled = !readyToStart();
      start.title = readyToStart() ? "" : "Pick a class and deal a numbering first.";
      start.onclick = () => { if (readyToStart()) startRunning(); };
      setup.append(start);

      function fact(big, small) {
        const f = el("div", "aw-rt-fact");
        f.append(el("div", "aw-rt-fact-big", escapeHtml(big)), el("div", "aw-rt-fact-small", escapeHtml(small)));
        return f;
      }
    }

    // The class chooser and the "who is here today" review, in one block.
    function classBlock() {
      const wrap = el("div", "aw-rt-classblock");
      const head = el("div", "aw-rt-classhead");
      head.append(el("div", "aw-rt-classlabel", "CLASS"));

      const sel = el("select", "aw-rt-classsel");
      if (classes === null) {
        const o = el("option", null, "Loading…"); o.value = ""; sel.append(o);
        sel.disabled = true;
      } else if (!classes.length) {
        const o = el("option", null, classError || "No classes — add one in Settings"); o.value = "";
        sel.append(o);
        sel.disabled = true;
      } else {
        const blank = el("option", null, "— pick a class —"); blank.value = "";
        sel.append(blank);
        classes.forEach(c => {
          const o = el("option", null, escapeHtml(c.name));
          o.value = c.id;
          if (c.id === pickedClassId) o.selected = true;
          sel.append(o);
        });
      }
      sel.onchange = () => {
        pickedClassId = sel.value;
        const c = (classes || []).find(x => x.id === pickedClassId);
        rosterDraft = c ? c.students.map(s => ({ ...s, present: true })) : [];
        // Picking a class always deals a fresh numbering: a set is a numbering
        // AND a roll, so a new roll is a new set.
        if (rosterDraft.length) dealCurrent();
        else { current = null; dirty = false; }
        renderSetup();
      };
      head.append(sel);
      wrap.append(head);

      if (rosterDraft.length) {
        const present = rosterDraft.filter(s => s.present).length;
        wrap.append(el("div", "aw-rt-classtip",
          `Tap anyone who is away today to grey them out — ${present} of ${rosterDraft.length} playing.`));
        const chips = el("div", "aw-rt-chips");
        rosterDraft.forEach(s => {
          const chip = el("button", "aw-rt-chip" + (s.present ? "" : " is-out"), escapeHtml(s.name));
          chip.type = "button";
          chip.onclick = () => {
            s.present = !s.present;
            chip.classList.toggle("is-out", !s.present);
            // The roll changed, so the saved pairing no longer describes this
            // round — mark it dirty so it can be saved (and re-printed) afresh.
            if (current) { current = makeSet(current.order, currentClassName(), pickedClassId, rosterDraft.filter(x => x.present)); dirty = true; }
            renderSetup();
          };
          chips.append(chip);
        });
        wrap.append(chips);
      }
      return wrap;
    }

    function currentClassName() {
      const c = (classes || []).find(x => x.id === pickedClassId);
      return c ? c.name : (current?.className || "");
    }
    function canDeal() { return rosterDraft.some(s => s.present); }
    function readyToStart() {
      return !!current && current.order.length >= MIN_POOL && current.studentNames.length > 0;
    }
    function firstFreeSlot() {
      const free = sets.findIndex(s => !s);
      return free === -1 ? setIndex : free;
    }
    function dealCurrent() {
      const present = rosterDraft.filter(s => s.present);
      current = makeSet(buildOrder(pool), currentClassName(), pickedClassId, present);
      setIndex = firstFreeSlot();
      dirty = true;
    }

    // Classes live in Firestore behind the teacher's sign-in. Loaded with a
    // DYNAMIC import on purpose: core/classes.js reaches the library layer, and
    // the core contract says the student page must never pull that in. A static
    // import here would drag it into play.html for every pupil.
    async function loadClasses() {
      if (!isTeacher) { classes = []; return; }
      try {
        const { listClasses } = await import("../../core/classes.js");
        classes = await listClasses();
      } catch (e) {
        classes = [];
        classError = e?.code === "aw/signed-out"
          ? "Sign in to use your classes"
          : "Could not load your classes";
      }
      if (phase === "setup") renderSetup();
    }

    async function saveCurrentSet(btn) {
      if (!current) return;
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "Saving…";
      try {
        const slot = firstFreeSlot();
        const next = new Array(MAX_SETS).fill(null);
        for (let i = 0; i < MAX_SETS; i++) next[i] = sets[i] || null;
        next[slot] = current;

        const { saveActivity } = await import("../../core/store.js");
        activity.content = activity.content || {};
        activity.content.gameSets = next;
        await saveActivity(activity);

        sets = readSets(activity);
        setIndex = slot;
        current = sets[slot];
        dirty = false;
        ui.toast?.(`Saved as SET ${slot + 1}`);
        renderSetup();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = label;
        ui.toast?.(e?.code === "aw/signed-out" ? "Sign in to save a set" : "Could not save the set");
      }
    }

    async function confirmDeleteSet(i) {
      if (!confirm(`Delete SET ${i + 1}?\n\nThe sheet already handed out will no longer match a saved set.`)) return;
      try {
        const next = new Array(MAX_SETS).fill(null);
        for (let k = 0; k < MAX_SETS; k++) next[k] = sets[k] || null;
        next[i] = null;

        const { saveActivity } = await import("../../core/store.js");
        activity.content = activity.content || {};
        activity.content.gameSets = next;
        await saveActivity(activity);

        sets = readSets(activity);
        if (setIndex === i) {
          current = null; dirty = false;
          rosterDraft = rosterDraft.map(s => ({ ...s, present: true }));
        }
        ui.toast?.(`SET ${i + 1} deleted`);
        renderSetup();
      } catch (e) {
        ui.toast?.("Could not delete the set");
      }
    }

    // ===== THE ROUND ========================================================
    function startRunning() {
      order = current.order.slice();
      roster = rosterOf(current);
      queue = shuffle(order.map((_, i) => i));
      livesLeft = cfg.lives;
      mainLeft = cfg.mainMs;
      correctCount = 0; askedCount = 0; turnPtr = 0;
      perQuestion.length = 0; review.length = 0;
      finished = false;

      setup.style.display = "none";
      match.style.display = "";
      paintHearts();
      paintScore();
      paintMainClock();

      phase = "ready";
      startMainClock();
      goReady();
    }

    // The main clock runs from START RUNNING to the final whistle — it does NOT
    // pause for the READY card or the 3-2-1 (teacher's rule: it is the limit on
    // the whole round, not on the questions).
    function startMainClock() {
      stopMainClock();
      let last = performance.now();
      mainTimer = setInterval(() => {
        const now = performance.now();
        mainLeft -= (now - last);
        last = now;
        if (mainLeft <= 0) {
          mainLeft = 0;
          paintMainClock();
          endGame(true, "timeup");
          return;
        }
        paintMainClock();
      }, 200);
    }
    function stopMainClock() { if (mainTimer) { clearInterval(mainTimer); mainTimer = null; } }

    // READY -> 3 -> 2 -> 1 -> the tiles. Every step is a plain timeout, and the
    // whole chain is registered in `timers` so cleanup() can cancel it mid-flight.
    function goReady() {
      if (finished) return;
      if (!queue.length) { endGame(true, "cleared"); return; }
      phase = "ready";
      locked = true;
      stopQuestionClock();
      resetQBar();
      showOverlay("READY", "is-ready");
      rtSound.ready();
      later(() => step(3), 850);

      function step(n) {
        if (finished) return;
        if (n === 0) { hideOverlay(); openQuestion(); return; }
        showOverlay(String(n), "is-count");
        rtSound.count(n);
        later(() => step(n - 1), 680);
      }
    }

    function openQuestion() {
      if (finished) return;
      phase = "question";
      qWordIndex = queue.pop();
      const word = order[qWordIndex];
      const who = roster.length ? roster[turnPtr % roster.length] : { name: "" };

      promptName.textContent = "";
      promptName.append(document.createTextNode(who.name || ""));
      promptNum.textContent = String(qWordIndex + 1);

      // Six tiles: the answer plus the five words in the pool that look most
      // like it (rt-sets.js), already shuffled.
      const tiles = buildTiles(word, pool);
      tilesEl.innerHTML = "";
      tiles.forEach(t => {
        const b = el("button", "aw-rt-tile");
        b.type = "button";
        const span = el("span", "aw-rt-tile-text", escapeHtml(String(t).toUpperCase()));
        b.append(span);
        b.onclick = () => onTile(b, t, word);
        tilesEl.append(b);
      });
      // Long entries (SKIN-SCRAPER, CIVILISATION) must not spill out of a tile.
      requestAnimationFrame(() => {
        tilesEl.querySelectorAll(".aw-rt-tile").forEach(b => {
          const span = b.querySelector(".aw-rt-tile-text");
          span.style.removeProperty("--rt-fit");
          fitOnce(b, span, s => span.style.setProperty("--rt-fit", s), { min: 0.42, contentBox: true });
        });
      });

      askedCount++;
      locked = false;
      lastQTick = null;
      qLeft = cfg.questionMs;
      startQuestionClock();
      rtSound.reveal();
    }

    function startQuestionClock() {
      stopQuestionClock();
      let last = performance.now();
      qTimer = setInterval(() => {
        const now = performance.now();
        qLeft -= (now - last);
        last = now;
        if (qLeft <= 0) { qLeft = 0; paintQBar(); onTimeUp(); return; }
        paintQBar();
        const whole = Math.ceil(qLeft / 1000);
        if (whole <= 5 && whole !== lastQTick) { lastQTick = whole; rtSound.tick(whole); }
      }, 100);
    }
    function stopQuestionClock() { if (qTimer) { clearInterval(qTimer); qTimer = null; } }

    function onTile(btn, picked, answer) {
      if (locked || phase !== "question") return;
      if (String(picked).toUpperCase() === String(answer).toUpperCase()) {
        locked = true;
        stopQuestionClock();
        btn.classList.add("is-right");
        flyMark(btn, true);
        rtSound.correct();
        correctCount++;
        recordAnswer(true, picked, answer);
        turnPtr++;                                   // the paper moves on
        paintScore();
        later(() => goReady(), 900);
        return;
      }

      // Wrong. With lives switched OFF (Unlimited) the class simply tries again:
      // the tile dims, the clock keeps running, nobody is knocked out.
      btn.classList.add("is-wrong");
      btn.disabled = true;
      flyMark(btn, false);
      rtSound.wrong();
      if (livesLeft === null) return;

      locked = true;
      stopQuestionClock();
      loseLife(picked, answer);
    }

    function onTimeUp() {
      if (phase !== "question" || locked) return;
      locked = true;
      stopQuestionClock();
      // Unlimited lives still has to move the lesson along, or an unanswered
      // question would sit there for ever.
      loseLife(null, order[qWordIndex]);
    }

    // A heart goes out (or, on Unlimited, just the question is lost). Either way
    // the correct tile is shown for a beat — that beat is the only chance the
    // class gets to LEARN the word they missed — and then the round moves on.
    function loseLife(picked, answer) {
      recordAnswer(false, picked, answer);
      if (livesLeft !== null) {
        livesLeft = Math.max(0, livesLeft - 1);
        paintHearts();
        rtSound.lifeLost();
      }
      revealAnswer(answer);
      const dead = livesLeft === 0;
      later(() => {
        if (dead) endGame(false, "nolives");
        else { turnPtr++; goReady(); }
      }, dead ? 900 : 1400);
    }

    function revealAnswer(answer) {
      tilesEl.querySelectorAll(".aw-rt-tile").forEach(b => {
        const txt = b.querySelector(".aw-rt-tile-text")?.textContent || "";
        if (txt.toUpperCase() === String(answer).toUpperCase()) b.classList.add("is-answer");
        else b.classList.add("is-dimmed");
      });
    }

    function recordAnswer(correct, picked, answer) {
      perQuestion.push({ q: perQuestion.length, correct });
      const who = roster.length ? roster[turnPtr % roster.length].name : "";
      review.push({
        question: `${who} — ${qWordIndex + 1}`,
        answered: picked != null,
        yourText: picked == null ? "(time up)" : String(picked).toUpperCase(),
        yourCorrect: correct,
        correctText: String(answer).toUpperCase()
      });
    }

    // ===== END ==============================================================
    function endGame(won, reason) {
      if (finished) return;
      finished = true;
      phase = "over";
      locked = true;
      stopMainClock();
      stopQuestionClock();
      hideOverlay();

      rtEndData = {
        won, reason,
        correct: correctCount,
        asked: askedCount,
        total: order.length,
        mainLeft,
        className: current?.className || ""
      };
      if (won) rtSound.win(); else rtSound.lose();

      // `total` is what was actually ASKED, not the length of the sheet: a class
      // that wins on the final whistle after 14 questions scored 12/14, not
      // 12/85. The sheet length is reported separately in the panel.
      ui.finish({
        correct: correctCount,
        incorrect: Math.max(0, askedCount - correctCount),
        total: Math.max(1, askedCount),
        answered: askedCount,
        perQuestion: perQuestion.slice(),
        review: review.slice(),
        score: correctCount
      });
    }

    // ===== PAINTING =========================================================
    function paintMainClock() {
      mainClockEl.textContent = fmtClock(mainLeft);
      mainClockEl.classList.toggle("is-low", mainLeft <= 30000);
    }
    function paintQBar() {
      const frac = cfg.questionMs > 0 ? Math.max(0, Math.min(1, qLeft / cfg.questionMs)) : 0;
      qfill.style.width = (frac * 100).toFixed(2) + "%";
      qfill.classList.toggle("is-warning", frac <= 0.34);
    }
    function resetQBar() {
      qfill.style.width = "100%";
      qfill.classList.remove("is-warning");
    }
    function paintScore() {
      scoreEl.innerHTML = "";
      scoreEl.insertAdjacentHTML("beforeend", icons.check);
      scoreEl.append(el("span", null, String(correctCount)));
    }
    // 1..5 lives draw that many hearts; 6..10 collapse to "♥ xN" so the row
    // never overruns the clock (the same shape Find the match settled on).
    function paintHearts() {
      heartsEl.innerHTML = "";
      if (livesLeft === null) {
        heartsEl.append(el("span", "aw-rt-heart is-inf", "∞"));
        return;
      }
      const total = cfg.lives || 0;
      if (total > 5) {
        heartsEl.append(el("span", "aw-rt-heart", "♥"));
        heartsEl.append(el("span", "aw-rt-heartx", `×${livesLeft}`));
        return;
      }
      for (let i = 0; i < total; i++) {
        heartsEl.append(el("span", "aw-rt-heart" + (i < livesLeft ? "" : " is-out"), "♥"));
      }
    }

    function showOverlay(text, cls) {
      overlay.className = "aw-rt-overlay " + (cls || "");
      overlay.style.display = "";
      overlayText.textContent = text;
      // Only `opacity` is animated. The text is centred by FLEX, but the pop
      // scales it — so the scale lives on the TEXT (no translate involved) and
      // the fade on the backdrop. See the core notes on animating a
      // transform-positioned element.
      overlayText.style.animation = "none";
      void overlayText.offsetWidth;               // restart the keyframe
      overlayText.style.animation = "";
    }
    function hideOverlay() { overlay.style.display = "none"; }

    // A big ✓ / ✗ floating up off the tile. Reuses core's `.aw-mark-fly`, whose
    // keyframes already bake the -50% centring into every step.
    function flyMark(host, ok) {
      const mark = el("div", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      host.append(mark);
      let done = false;
      const kill = () => { if (done) return; done = true; mark.remove(); };
      later(kill, 1000);                          // element.animate() may never
                                                   // finish in a hidden tab; the
                                                   // CSS animation is the same
                                                   // risk, so time it out.
    }

    // ===== WIRING ===========================================================
    // Number keys 1-6 pick a tile — the teacher usually has a keyboard within
    // reach and it is faster than crossing the room to the board.
    function onKey(e) {
      if (phase !== "question" || locked) return;
      const n = parseInt(e.key, 10);
      if (!Number.isFinite(n) || n < 1 || n > TILES) return;
      const btn = tilesEl.querySelectorAll(".aw-rt-tile")[n - 1];
      if (btn && !btn.disabled) btn.click();
    }
    window.addEventListener("keydown", onKey);

    ui.onSubmit?.(() => { if (!finished && phase !== "setup") endGame(false, "submitted"); });

    // The slogan rides the CENTRE of the bottom bar, on the Menu button's row,
    // in place of the engine's "x of N" label — the same placement Running word
    // settled on. Set once and never changed: questions advance on an answer, so
    // there is no counter to show and the arrows either side are hidden in CSS.
    ui.setNav?.({ index: 0, total: 0, onPrev: null, onNext: null, label: SLOGAN });

    renderSetup();
    loadClasses();

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      stopMainClock();
      stopQuestionClock();
      timers.forEach(clearTimeout);
      timers.clear();
      finished = true;
    };
  }
};

function reasonText(d) {
  if (d.reason === "timeup") return "The round timer ran out with hearts to spare.";
  if (d.reason === "cleared") return "Every word on the sheet was won.";
  if (d.reason === "nolives") return "The last life was lost.";
  if (d.reason === "submitted") return "The round was ended early.";
  return "";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(rtTemplate);
