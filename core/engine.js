// =============================================================
// ENGINE — shared game controller (Wordwall style). 100% English UI.
//
// Game lifecycle:
//   1. READY screen (dark): template type on top, big lesson TITLE, giant
//      PLAY button, instruction below. Nothing starts until PLAY is clicked.
//   2. Game runs: timer top-left, score (✓ n) top-right,
//      bottom bar [☰ menu] ◁ "x of N" ▷ [🔊] [⛶].
//   3. Finish -> "Game complete" + confetti + fanfare, then the dark SUMMARY,
//      then ANDREW LEADERBOARD (type your name, Ok, Show answers, Back).
//   4. Start again -> back to the READY screen.
//
// Fullscreen letterboxes the 16:9 stage (keeps ratio, just zooms).
// Results (incl. per-question review) are saved to the local leaderboard.
// =============================================================

import { getTemplate, ensureTemplate } from "./registry.js";
import { switchTargets, convertActivity } from "./convert.js";
import { computeResult } from "./scoring.js";
import { buildStage } from "./layout.js";
import { formatTime, el, ordinal, fmtSecsParts } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { confettiBurst } from "./confetti.js";
import { addEntry, getEntries, getRank, updateName } from "./leaderboard.js";
// store.js (the teacher's library) is imported LAZILY for the same reason as
// assignment-ui.js: the student page must not even load code that can reach it.
import { TEMPLATES } from "./catalog.js";
import { fitOnce } from "./fit.js";
import { THEMES, loadTheme } from "./themes/manifest.js";
import { makeNumberStepper } from "./numberstepper.js";
import { openPrintPopup } from "./print.js";
// NOTE: assignment-ui.js reaches into the teacher's library (core/store.js), so
// it is imported LAZILY and only on teacher paths — that keeps the student page
// (play.html) free of any code that can touch the library.

// The full list of games (for the Template panel). Only entries whose `type`
// matches a template already built (registered) are clickable; the rest show
// "coming soon". Update this list as templates/<name>/ get built.
// Shared list of act types (single source of truth: core/catalog.js).
const ALL_TEMPLATES = TEMPLATES;

// ----- Fullscreen helpers (vendor-prefixed for older browsers, e.g. the TOMKO
// interactive panel) — the unprefixed API alone left that board only filling a
// corner, so we probe every spelling. We fullscreen the STABLE app container
// (root), not the rebuilt .aw-page, so "Start again" keeps fullscreen. -----
function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement ||
         document.mozFullScreenElement || document.msFullscreenElement || null;
}
function requestFs(elem) {
  const fn = elem.requestFullscreen || elem.webkitRequestFullscreen ||
             elem.mozRequestFullScreen || elem.msRequestFullscreen;
  if (fn) try { fn.call(elem); } catch (_) {}
}
function exitFs() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen ||
             document.mozCancelFullScreen || document.msExitFullscreen;
  if (fn) try { fn.call(document); } catch (_) {}
}

// Preview colors for the Style panel swatches (kept in sync with core/themes/*.css).
const THEME_SWATCH = {
  classic:   "linear-gradient(135deg, #ffffff 50%, #2f7bff 50%)",
  basic:     "linear-gradient(135deg, #ffffff 50%, #17255a 50%)",
  classroom: "linear-gradient(135deg, #fbf4e6 50%, #2f6b4f 50%)",
  beach:     "linear-gradient(135deg, #fdf8ec 50%, #17a3b8 50%)"
};

// `session` (optional) turns the page into STUDENT MODE — used by play.html:
//   session.endOptions   { leaderboard, showAnswers, startAgain } — what the
//                        teacher ticked when setting the assignment
//   session.playerName   the name the student typed
//   session.submit(r)    hand in one play  -> Promise
//   session.entries()    the class ranking -> Promise<[{name,score,total,timeMs,mine}]>
// With a session the teacher-only tools (Options/Template/Style, Edit, Set
// assignment, Print, Home) are not built at all, so a student cannot reach them.
export function startGame(root, activity, { onExit, session = null, base = null } = {}) {
  root.innerHTML = "";

  // The ORIGINAL library act behind this play. For a normal play it's `activity`
  // itself; for a "Change template" play it's the act we converted FROM. Applied
  // options are persisted onto THIS act (never onto the throwaway converted copy),
  // and a converted act's options are remembered in originAct.templateOptions[type].
  const originAct = base || activity;

  const tpl = getTemplate(activity.type);
  const { page, stage, inner, below } = buildStage(activity.theme || "classic");

  // ---- myActivity multi-pane sync bridge (a NO-OP when running standalone) ----
  // When embedded in myActivity's 2-4 pane view, pane 0's Template / Options /
  // Style changes are mirrored to the other panes. We log a console marker on
  // each change (myActivity listens), and expose programmatic setters so
  // myActivity can replay the same change on the OTHER panes. `awSyncMute` stops
  // a replayed change from echoing straight back out as a new marker.
  let awSyncMute = 0;
  const awEmit = (tag, payload) => { if (awSyncMute <= 0) { try { console.log("MYACT:AW:" + tag + ":" + payload); } catch (_) {} } };
  window.__awordBridge = {
    getState: () => ({ type: activity.type, options: { ...(activity.options || {}) }, theme: activity.theme || null }),
    switchTemplate(type) {
      if (!type || type === activity.type) return;
      awSyncMute++;
      try { doSwitchTemplate(type); } finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    applyOptions(opts) {
      if (!opts) return;
      awSyncMute++;
      try { if (!activity.options) activity.options = {}; Object.assign(activity.options, opts); restart(); }
      finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    setTheme(id) {
      if (!id || id === activity.theme) return;
      awSyncMute++;
      try {
        loadTheme(id);
        stage.classList.forEach(c => { if (c.startsWith("theme-")) stage.classList.remove(c); });
        stage.classList.add("theme-" + id);
        activity.theme = id;
      } finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    }
  };

  // ----- Top bar (timer left · score right) -----
  // `tpl.inlineTimerBar` (opt-in, currently only Open the box) adds a THIRD
  // slot in the middle of this row (`ui.topbarMid`) so a template's own
  // per-round timer bar can sit on the SAME line as the score instead of a
  // separate row below it. Templates that don't set the flag get the exact
  // same 2-child flex row as before — nothing else about `.aw-topbar` changes
  // for them.
  const topbar = el("div", "aw-topbar" + (tpl.inlineTimerBar ? " has-inline" : ""));
  const timerEl = el("span", "aw-top-timer", "0:00");
  const scoreEl = el("span", "aw-top-score", `${icons.check} 0`);
  const topbarMid = tpl.inlineTimerBar ? el("div", "aw-topbar-mid") : null;
  // Opt-in (tpl.hasLivesSlot): a small slot that sits immediately to the LEFT
  // of the score, on the SAME row — True/false uses it for its hearts. The
  // slot + score are wrapped in a right-aligned group so the score still sits
  // hard against the frame's right edge; templates that don't opt in keep the
  // exact same 2-child flex row as before. (A template never sets BOTH this and
  // inlineTimerBar, so the topbarMid branch takes precedence harmlessly.)
  const livesSlot = tpl.hasLivesSlot ? el("span", "aw-top-lives") : null;
  if (topbarMid) topbar.append(timerEl, topbarMid, scoreEl);
  else if (livesSlot) {
    const topRight = el("div", "aw-top-right");
    topRight.append(livesSlot, scoreEl);
    topbar.append(timerEl, topRight);
  } else topbar.append(timerEl, scoreEl);

  // ----- Play area -----
  const playArea = el("div", "aw-playarea");

  // ----- Bottom bar -----
  const bottombar = el("div", "aw-bottombar");
  const menuBtn = iconBtn("aw-iconbtn", icons.menu, "Menu");
  const navWrap = el("div", "aw-nav");
  const navPrev = iconBtn("aw-navbtn", icons.prev, "Previous");
  const navLabel = el("span", "aw-nav-label", "");
  const navNext = iconBtn("aw-navbtn", icons.next, "Next");
  navWrap.append(navPrev, navLabel, navNext);
  const rightTools = el("div", "aw-tools");
  const soundBtn = iconBtn("aw-iconbtn", sound.isMuted() ? icons.soundOff : icons.soundOn, "Sound");
  soundBtn.classList.toggle("is-off", sound.isMuted());
  // Fullscreen must work BEFORE the game starts too (the teacher usually goes
  // fullscreen while the PLAY screen is still up), so this one button sits
  // above the READY overlay instead of behind it.
  const fsBtn = iconBtn("aw-iconbtn aw-fs-always", icons.fullscreen, "Fullscreen");
  rightTools.append(soundBtn, fsBtn);
  // Menu sits in a small wrapper (not appended bare) so `.aw-bottombar`'s grid
  // still gets exactly 3 children (its CSS targets :nth-child(1/2/3) to keep
  // the middle nav truly centered) even when the optional slot below is added.
  const leftGroup = el("div", "aw-bottombar-left");
  leftGroup.append(menuBtn);
  // Optional opt-in slot right next to Menu — a template can put its own icon
  // button here (currently only Type the answer's on-screen-keyboard toggle).
  // `null` unless the template asks for it, so every other template's bottom
  // bar ends up with the exact same DOM/behavior as before (just one extra
  // wrapper level around Menu that no CSS depended on being bare).
  const kbdSlot = tpl.hasKeyboardToggle ? el("span", "aw-bottombar-extra") : null;
  if (kbdSlot) leftGroup.append(kbdSlot);
  bottombar.append(leftGroup, navWrap, rightTools);

  inner.append(topbar, playArea, bottombar);

  // ----- Below the stage: TITLE (left) · Options/Template/Style (center) ·
  // Edit/Assignment/Print (right) -----
  // The specific game title sits on the SAME row as the tool buttons (the
  // instruction line under the stage was removed per the teacher's request).
  const belowLeft = el("div", "aw-below-left");
  belowLeft.append(el("div", "aw-below-title", escapeText(activity.title || "")));

  const belowCenter = el("div", "aw-below-center");
  const optionsBtn = toolBtn(icons.options, "Options");
  const templateBtn = toolBtn(icons.template, "Template");
  const styleBtn = toolBtn(icons.style, "Style");
  belowCenter.append(optionsBtn, templateBtn, styleBtn);

  const belowRight = el("div", "aw-below-right");
  const editBtn = toolBtn(icons.edit, "Edit", true);
  const assignBtn = toolBtn(icons.assignment, "Set assignment", true);
  const printBtn = toolBtn(icons.print, "Print", true);
  const homeBtn = toolBtn(icons.home, "Home", true);
  belowRight.append(editBtn, assignBtn, printBtn, homeBtn);
  // Leaving the game (Home / Edit) drops fullscreen so the library or editor
  // shows windowed as before — only "Start again" keeps fullscreen now that the
  // fullscreen target is the stable root (see the fullscreen helpers up top).
  homeBtn.onclick = () => { sound.click(); if (fsElement()) exitFs(); cleanupAll(); onExit?.(); };
  editBtn.onclick = () => {
    sound.click();
    if (!tpl.edit) { toast("Edit — coming soon"); return; }
    // Leave the game, open this game's editor. Save -> store + replay with the
    // new content; Cancel -> replay the original untouched.
    if (fsElement()) exitFs();
    cleanupAll();
    tpl.edit(root, activity, {
      onSave: async updated => {
        const { saveActivity } = await import("./store.js");
        const saved = await saveActivity(updated);
        startGame(root, saved, { onExit });
      },
      onCancel: () => startGame(root, activity, { onExit })
    });
  };
  // Set assignment -> the setup form; a new assignment appears as a strip below.
  assignBtn.onclick = async () => {
    sound.click();
    const ui = await import("./assignment-ui.js");
    ui.openAssignmentSetup(activity, { onCreated: loadAssignmentBars });
  };
  // Print opens a popup to pick a worksheet FORMAT (Anagram/Crossword/Quiz/
  // Unjumble) — the whole flow lives in core/print.js (generic, template-agnostic).
  printBtn.onclick = () => { sound.click(); openPrintPopup(activity); };

  below.append(belowLeft, belowCenter, belowRight);

  // Students never see the teacher's toolbar.
  if (session) { belowCenter.remove(); belowRight.remove(); }

  // ----- The assignment strips, a little below the stage -----
  // One per assignment made from this act; clicking one opens its report.
  const barsWrap = el("div", "aw-as-bars");
  if (!session && activity.id) {
    page.append(barsWrap);
    loadAssignmentBars();
  }
  async function loadAssignmentBars() {
    try {
      const [{ listAssignmentsForAct }, ui] = await Promise.all([
        import("./assignments.js"), import("./assignment-ui.js")
      ]);
      const list = await listAssignmentsForAct(activity.id);
      barsWrap.innerHTML = "";
      // Deleting or renaming from the report must be reflected here at once —
      // the strip and the Results card are the SAME assignment document.
      list.forEach(a => barsWrap.append(
        ui.assignmentBar(a, x => ui.openAssignmentDetail(x, { onChanged: loadAssignmentBars, inAct: true }))));
    } catch (e) {
      barsWrap.innerHTML = "";   // offline / not signed in: just show nothing
    }
  }

  function toolBtn(svg, title, small) {
    const b = el("button", "aw-toolbtn" + (small ? " aw-toolbtn-sm" : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }

  root.append(page);

  // Kill the browser's right-click menu inside the game frame — the teacher
  // plays on a touch panel and a stray long-press / right-click popping up
  // "Reload / Save image / Inspect" over the board is only ever in the way.
  // Scoped to `page`, so the library pages keep their normal context menu.
  page.addEventListener("contextmenu", e => e.preventDefault());

  // ----- READY screen (template type · big title · PLAY · instruction) -----
  const playOverlay = el("div", "aw-play-overlay");
  playOverlay.append(el("div", "aw-ready-type", "ANDREW CLASSES"));   // brand on top
  const readyCenter = el("div", "aw-ready-center");
  if (activity.title) readyCenter.append(el("div", "aw-ready-title", escapeText(activity.title).toUpperCase()));
  const bigPlay = el("button", "aw-bigplay", icons.playBig);
  bigPlay.type = "button"; bigPlay.title = "Play"; bigPlay.setAttribute("aria-label", "Play");
  readyCenter.append(bigPlay);
  // below the play button: the GAME (template) name, big & bold (replaces the instruction line)
  readyCenter.append(el("div", "aw-ready-game", escapeText(tpl.name || activity.type).toUpperCase()));
  playOverlay.append(readyCenter);
  inner.append(playOverlay);

  bigPlay.onclick = () => {
    bigPlay.disabled = true;
    (tpl.sounds?.play || sound.start)();        // startup chime (template may override)
    playOverlay.style.pointerEvents = "none";   // never block the game, even if the fade stalls
    let removed = false;
    const removeOverlay = () => { if (removed) return; removed = true; playOverlay.remove(); };
    const fade = playOverlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease", fill: "forwards" });
    fade.onfinish = removeOverlay;
    setTimeout(removeOverlay, 350);   // fallback: a backgrounded/hidden tab can stall animation events
    begin();
  };

  // ----- Timer (starts at PLAY, measured precisely) -----
  // Modes (set via the Options panel): "none" | "countUp" | "countDown".
  // Count down auto-submits the game when it reaches 0.
  let timerId = null, startedAt = 0, cleanup = () => {};
  let timeWarned = false;   // fires the "5 seconds left" hook (below) once per play
  function timerMode() { return activity.options?.timer ?? "countUp"; }
  function timerTotal() { return activity.options?.timerTotalSeconds ?? 120; }
  timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";

  // The clock's ticking is split out of begin() so a template can DEFER it.
  // Opt-in via `tpl.manualTimerStart`: begin() then mounts WITHOUT starting the
  // clock, and the template calls `ui.startTimer()` itself once it's ready
  // (e.g. True/false starts it only after its 3-2-1 prep countdown, so the
  // visible clock stays at 0:00 during the countdown). `startedAt` is reset the
  // moment the clock actually starts, so the measured play time excludes the
  // prep. Guarded so it can only start once per play. Templates that don't opt
  // in behave exactly as before (begin() starts the clock immediately).
  let timerStarted = false;
  function startTimerNow() {
    if (timerStarted) return;
    timerStarted = true;
    startedAt = performance.now();
    timeWarned = false;
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (timerMode() !== "none") {
      // show the correct value immediately (don't wait for the first 500ms tick)
      timerEl.textContent = timerMode() === "countDown" ? formatTime(timerTotal()) : formatTime(0);
      timerId = setInterval(() => {
        const elapsed = Math.floor((performance.now() - startedAt) / 1000);
        if (timerMode() === "countDown") {
          const remaining = Math.max(0, timerTotal() - elapsed);
          timerEl.textContent = formatTime(remaining);
          // Optional per-template hook — no default sound, so templates that
          // don't opt in (e.g. Quiz) behave exactly as before.
          if (remaining <= 5 && remaining > 0 && !timeWarned) { timeWarned = true; tpl.sounds?.timeWarning?.(); }
          if (remaining <= 0) { stopTimer(); submitHandler?.(); }
        } else {
          timerEl.textContent = formatTime(elapsed);
        }
      }, 500);
    }
  }

  function begin() {
    startedAt = performance.now();   // baseline (kept sane even if a manual-start template never starts the clock)
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (!tpl.manualTimerStart) startTimerNow();
    cleanup = tpl.mount(playArea, activity, ui) || (() => {});
  }
  const stopTimer = () => { if (timerId) clearInterval(timerId); timerId = null; };

  // ----- Sound / fullscreen buttons -----
  soundBtn.onclick = () => {
    const m = sound.toggle();
    soundBtn.innerHTML = m ? icons.soundOff : icons.soundOn;
    soundBtn.classList.toggle("is-off", m);
  };
  // Fullscreen the ROOT container (not `page`) so the 16:9 stage keeps its
  // ratio and just zooms — CSS handles the centering + black bars. Using the
  // stable root means "Start again" (which rebuilds `page`) no longer drops us
  // out of fullscreen.
  fsBtn.onclick = () => {
    if (!fsElement()) requestFs(root);
    else exitFs();
  };

  // =============================================================
  // OUTER TOOLBAR POPOVERS — Options / Template / Style
  // One at a time: clicking a tool button makes it glow, opens a panel
  // centered under the 3-button cluster, and dims the WHOLE screen
  // (game included) behind it. Click outside (the dim, or elsewhere) closes it.
  // =============================================================
  let toolDim = null, toolPanelEl = null, activeToolBtn = null;

  // fade = true -> animate opacity out before removing (a real user-initiated
  // close: outside click, or toggling the open button again). fade = false ->
  // remove instantly (used when SWITCHING to a different tool button, since a
  // new panel fades in immediately on top — an extra fade-out there would just
  // look like a delay — and on full teardown/restart where no one is watching).
  function closeToolPanel(fade = true) {
    const dim = toolDim, panel = toolPanelEl, btn = activeToolBtn;
    toolDim = null; toolPanelEl = null; activeToolBtn = null;
    document.removeEventListener("pointerdown", onToolOutside);
    if (btn) btn.classList.remove("is-active");
    if (!dim && !panel) return;
    if (!fade) { dim?.remove(); panel?.remove(); return; }
    let done = false;
    const remove = () => { if (done) return; done = true; dim?.remove(); panel?.remove(); };
    const fadeOpts = { duration: 150, easing: "ease", fill: "forwards" };
    const a = dim?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOpts);
    panel?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOpts);
    if (a) a.onfinish = remove;
    setTimeout(remove, 220);   // fallback (a hidden/backgrounded tab can stall animation events)
  }
  function onToolOutside(ev) {
    if (!toolPanelEl) return;
    if (toolPanelEl.contains(ev.target)) return;
    if (belowCenter.contains(ev.target)) return;   // the 3 buttons themselves toggle via their own onclick
    closeToolPanel(true);
  }
  function openToolPanel(btn, buildContent) {
    if (activeToolBtn === btn) { closeToolPanel(true); return; }   // clicking the open one again closes it
    closeToolPanel(false);   // switching tools: drop the old one instantly, new one fades in
    sound.click();
    toolDim = el("div", "aw-tool-dim");
    toolDim.onclick = () => closeToolPanel(true);
    document.body.append(toolDim);
    toolPanelEl = el("div", "aw-tool-panel");
    buildContent(toolPanelEl);
    belowCenter.append(toolPanelEl);
    // Cap the panel's height to the stage's own height (never taller than
    // the 16:9 frame it floats above) and let it scroll internally past that.
    toolPanelEl.style.maxHeight = stage.getBoundingClientRect().height + "px";
    btn.classList.add("is-active");
    activeToolBtn = btn;
    setTimeout(() => document.addEventListener("pointerdown", onToolOutside), 0);
  }

  optionsBtn.onclick = () => openToolPanel(optionsBtn, buildOptionsPanel);
  templateBtn.onclick = () => openToolPanel(templateBtn, buildTemplatePanel);
  styleBtn.onclick = () => openToolPanel(styleBtn, buildStylePanel);

  // ----- OPTIONS panel: real controls, DRAFT model -----
  // Edits go into a local `draft` copy first. Nothing is saved to
  // activity.options until "Apply" is pressed; clicking outside (or
  // switching to another tool) without pressing Apply discards the draft.
  function buildOptionsPanel(panel) {
    const base = activity.options || {};
    const draft = { ...base };

    panel.append(el("div", "aw-tool-panel-head", "Options"));

    // TIMER — a template can hide this whole group (tpl.hideTimerOption) when it
    // runs its OWN timer (e.g. Gameshow's per-QUESTION countdown, which the shared
    // whole-game timer would fight). Mirror of tpl.hideLettersOption below; every
    // other template keeps this group exactly as before.
    if (!tpl.hideTimerOption) {
      const gTimer = el("div", "aw-opt-group");
      gTimer.append(el("div", "aw-opt-label", "Timer"));
      const timerRow = el("div", "aw-opt-row");
      const mkRadio = (value, label) => {
        const wrap = el("label", "aw-opt-choice");
        const r = el("input"); r.type = "radio"; r.name = "aw-timer"; r.value = value;
        r.checked = (draft.timer ?? "countUp") === value;
        r.onchange = () => { draft.timer = value; timeFields.style.display = value === "countDown" ? "inline-flex" : "none"; };
        wrap.append(r, document.createTextNode(label));
        return wrap;
      };
      // countdown minutes/seconds — press-and-hold or swipe-to-adjust steppers.
      const timeFields = el("span", "aw-opt-time");
      const total = draft.timerTotalSeconds ?? 120;
      const mm = makeNumberStepper(Math.floor(total / 60), 0, 59, v => { draft.timerTotalSeconds = v * 60 + ss.get(); });
      const ss = makeNumberStepper(total % 60, 0, 59, v => { draft.timerTotalSeconds = mm.get() * 60 + v; });
      timeFields.append(mm.el, document.createTextNode("m"), ss.el, document.createTextNode("s"));
      timeFields.style.display = (draft.timer ?? "countUp") === "countDown" ? "inline-flex" : "none";
      // Keep "Count down" + its time fields together on one line (a no-wrap group)
      // so the fields sit to the RIGHT of the button instead of wrapping below.
      const cdGroup = el("span", "aw-opt-cd");
      cdGroup.append(mkRadio("countDown", "Count down"), timeFields);
      timerRow.append(mkRadio("none", "None"), mkRadio("countUp", "Count up"), cdGroup);
      gTimer.append(timerRow);
      panel.append(gTimer);
    }

    // RANDOM
    const gRandom = el("div", "aw-opt-group");
    gRandom.append(el("div", "aw-opt-label", "Random"));
    const rowRandom = el("div", "aw-opt-row");
    rowRandom.append(
      mkCheck(draft.shuffleQuestions !== false, "Shuffle question order", v => draft.shuffleQuestions = v)
    );
    // "Shuffle answer order" is meaningless for templates with no answer choices
    // (e.g. Type the answer — the student types, there are no options to shuffle),
    // so those opt out via tpl.hideShuffleAnswers. Mirror of tpl.hideLettersOption
    // above; every other template keeps this checkbox exactly as before.
    if (!tpl.hideShuffleAnswers) {
      rowRandom.append(
        mkCheck(draft.shuffleAnswers !== false, "Shuffle answer order", v => draft.shuffleAnswers = v)
      );
    }
    gRandom.append(rowRandom);
    panel.append(gRandom);

    // AUTO SWITCH — advance to the next question automatically once the current
    // one has an answer. OFF by default; a template acts on it by reading
    // activity.options.autoSwitch (Type the answer does). Shown for every
    // template (teacher's call, 1/8/2026).
    const gAuto = el("div", "aw-opt-group");
    gAuto.append(el("div", "aw-opt-label", "Auto switch"));
    const rowAuto = el("div", "aw-opt-row");
    rowAuto.append(mkCheck(draft.autoSwitch === true, "Move to the next question automatically",
      v => draft.autoSwitch = v));
    gAuto.append(rowAuto);
    panel.append(gAuto);

    // LETTERS ON ANSWERS — a template can opt out entirely (e.g. Type the
    // answer has no letter-lettered answer boxes, so the option is meaningless
    // for it). Every other template keeps this group exactly as before.
    if (!tpl.hideLettersOption) {
      const gLet = el("div", "aw-opt-group");
      gLet.append(el("div", "aw-opt-label", "Letters on answers"));
      const rowLet = el("div", "aw-opt-row");
      const mkRadioLet = (value, label) => {
        const wrap = el("label", "aw-opt-choice");
        const r = el("input"); r.type = "radio"; r.name = "aw-letters"; r.value = value;
        r.checked = (draft.lettersOnAnswers ?? "none") === value;
        r.onchange = () => { draft.lettersOnAnswers = value; };
        wrap.append(r, document.createTextNode(label));
        return wrap;
      };
      rowLet.append(mkRadioLet("abc", "A, B, C"), mkRadioLet("none", "None"));
      gLet.append(rowLet);
      panel.append(gLet);
    }

    // TEMPLATE-SPECIFIC EXTRA OPTIONS (optional hook) — a template can append its
    // own groups here (e.g. Anagram's mode/skip/all-caps). `draft` is the SAME
    // object Apply writes back into activity.options, so template controls just
    // mutate fields on it directly; `mkCheck`/`mkRadioChoice` keep the same look.
    if (typeof tpl.buildExtraOptions === "function") {
      tpl.buildExtraOptions({ panel, draft, el, mkCheck, mkRadioChoice });
    }

    // POINTS OFF — deduct this many points for a WRONG answer (0 = off). Central
    // option (teacher, 3/8/2026): shown for every SCORABLE template EXCEPT those
    // that already ship their OWN points-off control (tpl.hidePointsOff — Type the
    // answer, Unjumble, Crossword, Whack-a-mole) and Gameshow (speed-based scoring).
    // A template honours it by reading activity.options.pointsOff in mount() and
    // subtracting on a wrong answer (score may go negative -> shown red, no minus).
    if (tpl.scorable !== false && !tpl.hidePointsOff) {
      const clampPen = v => Math.max(0, Math.min(5, v | 0));
      const gPen = el("div", "aw-opt-group");
      gPen.append(el("div", "aw-opt-label", "Points off (wrong answer)"));
      const rowPen = el("div", "aw-opt-row");
      const penSlider = el("input", "aw-opt-slider");
      penSlider.type = "range"; penSlider.min = "0"; penSlider.max = "5"; penSlider.step = "1";
      penSlider.value = String(clampPen(draft.pointsOff || 0));
      const penVal = el("span", "aw-opt-slidval", clampPen(draft.pointsOff || 0) === 0 ? "Off" : "-" + clampPen(draft.pointsOff || 0));
      penSlider.oninput = () => {
        const v = clampPen(+penSlider.value);
        draft.pointsOff = v;
        penVal.textContent = v === 0 ? "Off" : "-" + v;
      };
      rowPen.append(penSlider, penVal);
      gPen.append(rowPen);
      panel.append(gPen);
    }

    // END OF GAME — kept LAST (after the template's own extra options), per the
    // teacher's request (1/8/2026): "Show answers" sits at the very bottom.
    const gEnd = el("div", "aw-opt-group");
    gEnd.append(el("div", "aw-opt-label", "End of game"));
    const rowEnd = el("div", "aw-opt-row");
    rowEnd.append(mkCheck(draft.showAnswers !== false, "Show answers", v => draft.showAnswers = v));
    gEnd.append(rowEnd);
    panel.append(gEnd);

    panel.append(el("div", "aw-opt-hint",
      playOverlay.isConnected ? "Options apply when you press Play." : "Applying restarts the game with the new options."));

    // APPLY — only now does the draft get written into activity.options.
    // Clicking outside without pressing this discards every change above.
    const applyWrap = el("div", "aw-opt-apply-wrap");
    const applyBtn = el("button", "aw-btn aw-btn-primary aw-opt-apply", "Apply");
    applyBtn.type = "button";
    applyBtn.onclick = () => {
      sound.click();
      if (!activity.options) activity.options = {};
      Object.assign(activity.options, draft);
      awEmit("OPT", JSON.stringify(activity.options));   // mirror applied Options to other myActivity panes
      timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
      // Persist the applied options PERMANENTLY (teacher only — students never
      // reach this panel). For the original act, save its options straight onto
      // it. For a temporary "Change template" act, remember the options per
      // (original act, template type) in originAct.templateOptions[type] so that
      // picking that template for this act again later restores them — and NEVER
      // save a throwaway "conv_" act into the library.
      if (!session) {
        const isConv = !!activity._converted;
        if (isConv) {
          if (!originAct.templateOptions) originAct.templateOptions = {};
          originAct.templateOptions[activity.type] = { ...activity.options };
        }
        const target = isConv ? originAct : activity;
        if (target.id && !String(target.id).startsWith("conv_")) {
          import("./store.js").then(m => m.saveActivity(target)).catch(() => {});
        }
      }
      // Applying ANY option restarts the current game so it always runs under
      // the new settings (teacher's call, 1/8/2026 — every template). If the
      // game hasn't started yet (Play overlay still up), there's nothing to
      // restart — just apply and close; the options take effect on Play.
      const playing = !playOverlay.isConnected;
      if (playing) { closeToolPanel(false); restart(); return; }
      toast("Options applied");
      closeToolPanel(true);
    };
    applyWrap.append(applyBtn);
    panel.append(applyWrap);

    function mkCheck(checked, label, onChange) {
      const wrap = el("label", "aw-opt-choice");
      const c = el("input"); c.type = "checkbox"; c.checked = checked;
      c.onchange = () => onChange(c.checked);
      wrap.append(c, document.createTextNode(label));
      return wrap;
    }

    // shared radio-choice builder handed to templates via buildExtraOptions
    function mkRadioChoice(name, value, label, checked, onChange) {
      const wrap = el("label", "aw-opt-choice");
      const r = el("input"); r.type = "radio"; r.name = name; r.value = value;
      r.checked = checked;
      r.onchange = () => onChange(value);
      wrap.append(r, document.createTextNode(label));
      return wrap;
    }
  }

  // ----- TEMPLATE panel: switch games KEEPING the current content -----
  // Only games whose data shape can hold this act's content are clickable
  // ("compatible group", teacher's call 3/8/2026); the rest are dimmed.
  // Clicking one converts the content and plays it straight away — the
  // original act in the library is never touched (see doSwitchTemplate).
  function buildTemplatePanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Template"));
    const grid = el("div", "aw-tpl-grid");
    const canSwitch = new Set(switchTargets(activity).map(t => t.type));
    ALL_TEMPLATES.forEach(t => {
      const isCurrent = t.type === activity.type;
      const enabled = !isCurrent && canSwitch.has(t.type);
      const cls = isCurrent ? " is-current" : (enabled ? "" : " is-soon");
      const item = el("div", "aw-tpl-item" + cls, escapeText(t.label));
      if (enabled) {
        item.onclick = () => { closeToolPanel(false); doSwitchTemplate(t.type); };
      } else if (!isCurrent) {
        item.onclick = () => { sound.click(); toast(`${t.label} — doesn't fit this content`); };
      }
      grid.append(item);
    });
    panel.append(grid);
  }

  // ----- STYLE panel: switch themes LIVE (no restart needed) -----
  function buildStylePanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Style"));
    const grid = el("div", "aw-style-grid");
    THEMES.forEach(t => {
      const item = el("button", "aw-style-item" + (t.id === activity.theme ? " is-active" : ""));
      item.type = "button";
      const swatch = el("span", "aw-style-swatch");
      swatch.style.background = THEME_SWATCH[t.id] || "#ccc";
      item.append(swatch, el("span", "aw-style-name", t.label));
      item.onclick = () => {
        sound.click();
        loadTheme(t.id);
        stage.classList.forEach(c => { if (c.startsWith("theme-")) stage.classList.remove(c); });
        stage.classList.add(`theme-${t.id}`);
        activity.theme = t.id;
        grid.querySelectorAll(".aw-style-item").forEach(x => x.classList.remove("is-active"));
        item.classList.add("is-active");
        awEmit("STYLE", t.id);   // mirror the Style choice to other myActivity panes
      };
      grid.append(item);
    });
    panel.append(grid);
  }

  // ----- Menu (Submit answers · Start again · Resume · Change template) -----
  let submitHandler = null;
  // Optional getter a template registers via ui.onSubmit(fn, countFn): how many
  // questions have an answer so far. When it reports 0, "Submit answers" is a
  // no-op (you can't hand in a game with nothing answered). Templates that don't
  // register one keep the old behavior — the guard simply doesn't apply.
  let answeredCounter = null;
  let menuEl = null;
  menuBtn.onclick = () => (menuEl ? closeMenu() : openMenu());

  function onMenuOutside(ev) {
    if (menuEl && !menuEl.contains(ev.target) && !menuBtn.contains(ev.target)) closeMenu();
  }
  function openMenu() {
    menuEl = el("div", "aw-menu");
    menuEl.append(
      menuItem("Submit answers", () => {
        closeMenu();
        if (answeredCounter && answeredCounter() === 0) { toast("Answer at least one question first."); return; }
        submitHandler?.();
      }),
      menuItem("Start again", restart),
      menuItem("Resume", closeMenu)
    );
    // "Change template" is a teacher tool — students never see it.
    if (!session) menuEl.append(menuItem("Change template", () => {
      closeMenu();
      // Back = drop the picker and resume the running game.
      openSwitchPicker(() => { backdrop?.remove(); backdrop = null; });
    }));
    inner.append(menuEl);
    // clicking anywhere else closes the menu (deferred so the opening click doesn't trigger it)
    setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
  }
  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener("pointerdown", onMenuOutside); }
  }
  function menuItem(label, action) {
    const b = el("button", "aw-menu-item", label);
    b.type = "button";
    b.onclick = () => { sound.click(); action(); };
    return b;
  }

  function restart() {
    tpl.sounds?.restart?.();   // optional per-template restart sound, layered on the menu/button's own click
    cleanupAll();
    startGame(root, activity, { onExit, session, base: originAct });
  }
  function cleanupAll() { stopTimer(); closeMenu(); closeToolPanel(false); cleanup(); }

  // ----- Small toast message -----
  function toast(msg) {
    const t = el("div", "aw-toast", escapeText(msg));
    inner.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  // ----- CHANGE TEMPLATE: play THIS content as a different game -----
  // Loads the target template on demand, converts the content into its shape,
  // then re-enters startGame with a fresh EPHEMERAL activity (id "conv_...").
  // The library act is untouched; the current theme is kept; fullscreen too
  // (the fullscreen target is the stable root, exactly like "Start again").
  async function doSwitchTemplate(targetType) {
    awEmit("TPL", targetType);   // mirror the Template switch to other myActivity panes
    try {
      // Switching back to the original type restores the REAL library act (its
      // own id + saved options), not a throwaway converted copy. Always convert
      // FROM the origin so options are remembered per (origin act, template).
      if (targetType === originAct.type) {
        cleanupAll();
        startGame(root, originAct, { onExit, session, base: originAct });
        return;
      }
      await ensureTemplate(targetType);
      const converted = await convertActivity(originAct, targetType);
      cleanupAll();
      startGame(root, converted, { onExit, session, base: originAct });
    } catch (e) {
      console.warn("AWord: template switch failed", e);
      toast("Could not switch template");
    }
  }

  // In-stage picker (works in fullscreen, unlike the below-stage tool row):
  // a dark backdrop listing the compatible games. `onBack` returns to wherever
  // it was opened from — the running game (menu) or the summary (game over).
  function openSwitchPicker(onBack) {
    const bd = openBackdrop();
    const panel = el("div", "aw-panel aw-panel-wide");
    panel.append(el("div", "aw-panel-head", "CHANGE TEMPLATE"));
    const targets = switchTargets(activity);
    if (!targets.length) {
      panel.append(el("div", "aw-panel-rank", "THIS CONTENT CAN'T BE PLAYED AS ANOTHER GAME"));
    } else {
      const list = el("div", "aw-panel-items aw-switch-list");
      targets.forEach(t => list.append(panelItem(t.label, () => doSwitchTemplate(t.type))));
      panel.append(list);
    }
    const foot = el("div", "aw-panel-items aw-panel-items-row");
    foot.append(panelItem("Back", onBack));
    panel.append(foot);
    bd.append(panel);
  }

  // ----- API handed to the template -----
  const ui = {
    playArea,
    topbarMid,   // null unless tpl.inlineTimerBar is true — see topbar setup above
    kbdSlot,     // null unless tpl.hasKeyboardToggle is true — see bottombar setup above
    livesSlot,   // null unless tpl.hasLivesSlot is true — a span left of the score (True/false hearts)
    scoreEl,     // the score element itself (read-only) — for effects that fly toward the score
    startTimer: startTimerNow,   // start the clock now (only meaningful with tpl.manualTimerStart)
    setScore(n) {
      // Positive score = GREEN, negative = RED with NO minus sign (teacher, 3/8/2026).
      // Templates that allow points-off may pass a negative n; the sign is carried by
      // colour, not a "-", so a wrong-heavy round reads "3" in red, not "-3".
      const v = Number(n) || 0;
      scoreEl.innerHTML = `${icons.check} ${Math.abs(v)}`;
      scoreEl.classList.toggle("is-pos", v > 0);
      scoreEl.classList.toggle("is-neg", v < 0);
    },
    setNav({ index, total, onPrev = null, onNext = null, nextLabel = null }) {
      navLabel.textContent = `${index} of ${total}`;
      wireNav(navPrev, onPrev);
      wireNav(navNext, onNext);
      navNext.innerHTML = nextLabel ? nextLabel : icons.next;
      navNext.classList.toggle("is-finish", !!nextLabel);
    },
    onSubmit(fn, countFn) { submitHandler = fn; answeredCounter = typeof countFn === "function" ? countFn : null; },
    sound,
    toast,
    finish(raw) {
      stopTimer();
      endTitle = raw.title || "Game complete";
      const timeMs = Math.round(performance.now() - startedAt);
      const result = computeResult(raw, timeMs / 1000);
      result.timeMs = timeMs;
      reviewData = raw.review || [];   // kept in memory for "Show answers"
      // Don't add to the leaderboard if the player answered NO question.
      const answered = raw.answered != null ? raw.answered : reviewData.filter(r => r.answered).length;
      let entryId = null;
      if (session) {
        // Student mode: every finished game is handed in, straight away.
        // The upload runs alongside the celebration so nobody waits on a spinner.
        submission = session.submit({
          score: result.score, total: result.total, timeMs, review: reviewData
        }).catch(e => { console.warn("AWord: submit failed", e); submitFailed = true; return null; });
        celebrate(result, null);
        return;
      }
      if (answered > 0) {
        // stored (incl. review) so it can sync later and students can compete.
        entryId = addEntry(activity.id, {
          name: "Player", score: result.score, total: result.total, timeMs,
          scoreText: result.scoreText, review: raw.review || null
        });
      }
      celebrate(result, entryId);
    }
  };

  function wireNav(btn, handler) {
    btn.onclick = handler || null;
    btn.disabled = !handler;
  }

  // =============================================================
  // GAME COMPLETE — celebration, then the dark panels
  // =============================================================
  function celebrate(result, entryId) {
    navWrap.style.visibility = "hidden";
    const cover = el("div", "aw-celebrate");
    const text = el("div", "aw-gc-text", endTitle);
    cover.append(text);
    inner.append(cover);
    confettiBurst(cover);
    (tpl.sounds?.complete || sound.fanfare)();
    setTimeout(() => {
      text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      setTimeout(() => { cover.remove(); showSummary(result, entryId); }, 300);
    }, 1900);
  }

  // ----- Dark modal panels -----
  let backdrop = null;
  let reviewData = [];   // this play's per-question review (for "Show answers")
  let submission = null; // student mode: the promise of THIS play being handed in
  let submitFailed = false;
  // Optional per-finish title (e.g. Open the box's Questions mode passes
  // "Game over" on a timeout loss) — defaults to "Game complete" so every
  // other template's ui.finish() is unaffected. Kept in this shared
  // variable (not a function param) so navigating Leaderboard/Show answers
  // and back to Summary keeps showing the SAME title from the original
  // finish() call.
  let endTitle = "Game complete";
  function openBackdrop() {
    if (!backdrop) { backdrop = el("div", "aw-backdrop"); inner.append(backdrop); }
    backdrop.innerHTML = "";
    return backdrop;
  }

  function showSummary(result, entryId) {
    const bd = openBackdrop();
    const panel = el("div", "aw-panel");
    panel.append(el("div", "aw-panel-head", endTitle.toUpperCase()));

    const stats = el("div", "aw-sum-stats");
    const t = fmtSecsParts(result.timeMs);
    stats.append(
      // Points-mode templates (Gameshow) pass a pre-formatted scoreText and show
      // it alone; everyone else keeps the classic "correct/total" form.
      result.scoreText != null
        ? statBlock("Score", result.scoreText, "")
        : statBlock("Score", `${result.correct}`, `/${result.total}`),
      statBlock("Time", t.big, t.small)
    );
    panel.append(stats);

    if (!session) {
      const rank = getRank(activity.id, entryId);
      if (rank) panel.append(el("div", "aw-panel-rank", `YOU'RE ${ordinal(rank)} ON THE LEADERBOARD`));
    }

    const items = el("div", "aw-panel-items");
    if (session) {
      // Student mode: only what the teacher ticked when setting the assignment.
      const end = session.endOptions || {};
      panel.append(el("div", "aw-panel-rank",
        submitFailed ? "COULD NOT SEND YOUR RESULT — CHECK YOUR INTERNET"
                     : `SENT TO YOUR TEACHER — ${escapeText(session.playerName || "")}`));
      if (end.leaderboard !== false) items.append(panelItem("Leaderboard", () => showLeaderboard(result, entryId)));
      if (end.showAnswers !== false && reviewData.length) {
        items.append(panelItem("Show answers", () => showReview(result, entryId)));
      }
      if (end.startAgain !== false) items.append(panelItem("Start again", restart));
    } else {
      items.append(panelItem("Leaderboard", () => showLeaderboard(result, entryId)));
      if (reviewData.length && activity.options?.showAnswers !== false) {
        items.append(panelItem("Show answers", () => showReview(result, entryId)));
      }
      items.append(
        panelItem("Start again", restart),
        panelItem("Play a different template", () => openSwitchPicker(() => showSummary(result, entryId)))
      );
    }
    panel.append(items);
    bd.append(panel);
  }

  // Student mode: the CLASS ranking for this assignment, read live from the
  // public scores of the assignment (names + scores only — never anyone's answers).
  function showOnlineLeaderboard(result) {
    const bd = openBackdrop();
    const panel = el("div", "aw-panel aw-panel-wide");
    panel.append(el("div", "aw-panel-head", "ANDREW CLASSES"));
    const table = el("div", "aw-lb-table");
    table.append(el("div", "aw-lb-row", "Loading..."));
    panel.append(table);

    const items = el("div", "aw-panel-items aw-panel-items-row");
    items.append(panelItem("Back", () => showSummary(result, null)));
    panel.append(items);
    bd.append(panel);

    // wait for THIS play to land first, so the student sees their own row
    Promise.resolve(submission)
      .then(() => session.entries())
      .then(entries => {
        table.innerHTML = "";
        if (!entries.length) { table.append(el("div", "aw-lb-row", "No scores yet")); return; }
        entries.slice(0, 10).forEach((e, i) => {
          const row = el("div", "aw-lb-row" + (e.mine ? " is-you" : ""));
          const tp = fmtSecsParts(e.timeMs);
          row.append(
            el("span", "aw-lb-rank", ordinal(i + 1).toLowerCase()),
            el("span", "aw-lb-name", escapeText(e.name)),
            el("span", "aw-lb-score", e.scoreText != null ? e.scoreText : `${e.score}/${e.total}`),
            el("span", "aw-lb-time", `${tp.big}${tp.small}`)
          );
          table.append(row);
        });
      })
      .catch(() => { table.innerHTML = ""; table.append(el("div", "aw-lb-row", "Could not load the leaderboard")); });
  }

  function showLeaderboard(result, entryId) {
    if (session) return showOnlineLeaderboard(result);
    const bd = openBackdrop();
    const panel = el("div", "aw-panel aw-panel-wide");
    panel.append(el("div", "aw-panel-head", "ANDREW CLASSES"));

    const table = el("div", "aw-lb-table");
    const entries = getEntries(activity.id).slice(0, 10);
    let nameInput = null;
    entries.forEach((e, i) => {
      const row = el("div", "aw-lb-row" + (e.id === entryId ? " is-you" : ""));
      row.append(el("span", "aw-lb-rank", ordinal(i + 1).toLowerCase()));
      if (e.id === entryId) {
        nameInput = el("input", "aw-lb-name-input");
        nameInput.value = e.name;
        nameInput.maxLength = 20;
        nameInput.oninput = () => updateName(activity.id, e.id, nameInput.value.trim() || "Player");
        // press Enter to confirm the name (same as the Ok button)
        nameInput.onkeydown = ev => {
          if (ev.key === "Enter") {
            sound.click();
            updateName(activity.id, e.id, nameInput.value.trim() || "Player");
            nameInput.blur();
            toast("Name saved");
          }
        };
        const wrap = el("span", "aw-lb-name");
        wrap.append(nameInput);
        row.append(wrap);
      } else {
        row.append(el("span", "aw-lb-name", escapeText(e.name)));
      }
      const tp = fmtSecsParts(e.timeMs);
      row.append(
        el("span", "aw-lb-score", e.scoreText != null ? e.scoreText : `${e.score}/${e.total}`),
        el("span", "aw-lb-time", `${tp.big}${tp.small}`)
      );
      table.append(row);
    });
    panel.append(table);

    const items = el("div", "aw-panel-items aw-panel-items-row");
    // Ok = confirm/save the typed name
    items.append(panelItem("Ok", () => {
      if (nameInput) updateName(activity.id, entryId, nameInput.value.trim() || "Player");
      toast("Name saved");
    }));
    items.append(panelItem("Back", () => showSummary(result, entryId)));
    panel.append(items);
    bd.append(panel);

    nameInput?.focus();
    nameInput?.select();
  }

  // =============================================================
  // SHOW ANSWERS — full 16:9 review: question | your answer | correct answer
  // =============================================================
  function showReview(result, entryId) {
    if (backdrop) backdrop.innerHTML = "";   // hide the panel behind
    const rv = el("div", "aw-review");
    const head = el("div", "aw-rv-head");
    head.append(el("div", "aw-rv-title", "ANSWERS"));
    const closeBtn = iconBtn("aw-rv-close", icons.close, "Close");
    closeBtn.onclick = () => { rv.remove(); showSummary(result, entryId); };
    head.append(closeBtn);
    rv.append(head);

    // Opt-in STACKED layout (tpl.reviewStyle === "stacked"): each item is one or
    // two FULL-WIDTH lines (number · sentence · ✓/✗), so long sentences stay big
    // and readable instead of being squashed into the 3-column grid. A wrong item
    // shows the player's line (✗) then the correct line (✓). Styling lives in the
    // template's own CSS (.aw-rv-slist/.aw-rv-sitem/.aw-rv-sline). Backward-compatible:
    // any template without the flag keeps the original 3-column review below.
    if (tpl.reviewStyle === "stacked") {
      const sline = (num, text, mark, cls) => {
        const line = el("div", "aw-rv-sline " + cls);
        line.append(
          el("span", "aw-rv-snum", num == null ? "" : String(num)),
          el("span", "aw-rv-stext", escapeText(text || "")),
          el("span", "aw-rv-smark", mark || "")
        );
        return line;
      };
      const slist = el("div", "aw-rv-slist");
      reviewData.forEach((r, i) => {
        const item = el("div", "aw-rv-sitem");
        if (r.answered && r.yourCorrect) {
          item.append(sline(i + 1, r.correctText, icons.check, "is-ok"));
        } else {
          item.append(sline(i + 1, r.answered ? r.yourText : "No answer", icons.cross, "is-bad"));
          item.append(sline(null, r.correctText, icons.check, "is-ok"));
        }
        slist.append(item);
      });
      rv.append(slist);
      inner.append(rv);
      return;
    }

    const list = el("div", "aw-rv-list");
    reviewData.forEach((r, i) => {
      const rowEl = el("div", "aw-rv-row");
      rowEl.append(cell("aw-rv-q", `${i + 1}. ${r.question}`, null));   // numbered question
      if (r.answered && r.yourCorrect) {
        // correct -> ONE wide box (spans both answer columns)
        rowEl.append(cell("aw-rv-a is-correct aw-rv-span", r.correctText, icons.check));
      } else {
        // your answer (wrong or none) + the correct answer
        if (!r.answered) rowEl.append(cell("aw-rv-a is-none", "No answer", null));
        else rowEl.append(cell("aw-rv-a is-wrong", r.yourText, icons.cross));
        rowEl.append(cell("aw-rv-a is-correct", r.correctText, icons.check));
      }
      list.append(rowEl);
    });
    rv.append(list);
    inner.append(rv);

    // Questions use ONE fixed size (CSS) — long ones wrap and grow the row height
    // (answer boxes stretch to match). Only the answer text auto-shrinks to fit
    // its now-narrower box.
    rv.querySelectorAll(".aw-rv-a").forEach(box => {
      const span = box.querySelector(".aw-rv-fit");
      fitOnce(box, span, s => span.style.setProperty("--fit", s), { max: 1, min: 0.2, slack: 2, contentBox: true });
    });
  }

  function cell(cls, text, mark) {
    const c = el("div", "aw-rv-cell " + cls);
    const inner2 = el("span", "aw-rv-fit");
    if (mark) inner2.append(el("span", "aw-rv-mark", mark));
    inner2.append(el("span", "aw-rv-txt", escapeText(text || "")));
    c.append(inner2);
    return c;
  }

  function statBlock(label, big, small) {
    const b = el("div", "aw-sum-stat");
    b.append(
      el("div", "aw-sum-label", label),
      el("div", "aw-sum-value", `${escapeText(big)}<span>${escapeText(small)}</span>`)
    );
    return b;
  }
  function panelItem(label, action) {
    const b = el("button", "aw-panel-item", label);
    b.type = "button";
    b.onclick = () => { sound.click(); action(); };
    return b;
  }
}

function iconBtn(cls, svg, title) {
  const b = el("button", cls, svg);
  b.type = "button";
  b.title = title;
  b.setAttribute("aria-label", title);
  return b;
}

function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
