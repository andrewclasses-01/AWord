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

import { getTemplate, ensureTemplate, cssImageUrls, preloadImages } from "./registry.js";
import { whenAllPacksPrimed } from "./sfx.js";
import { collectVoiceIds, preloadVoiceClips } from "./voice-clips.js";
import { hasAnyVoice, hasHiddenText } from "./voice-playback.js";
import { switchTargets, convertActivity } from "./convert.js";
import { computeResult } from "./scoring.js";
import { buildMistakesActivity, pickMistakes, minItemsFor } from "./mistakes.js";
import { buildStage } from "./layout.js";
import { formatTime, el, ordinal, fmtSecsParts } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { confettiBurst } from "./confetti.js";
import { addEntry, getEntries, getRank, updateName } from "./leaderboard.js";
// store.js (the teacher's library) is imported LAZILY for the same reason as
// assignment-ui.js: the student page must not even load code that can reach it.
import { TEMPLATES, templateLabel } from "./catalog.js";
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

// ----- "Zoom" fullscreen (opt-in via tpl.useZoomFullscreen, 5/8/2026) -----
// The REAL Fullscreen API misbehaved on iPad Chrome for Running word (tested
// live, not guessed): a stray downward swipe near the top edge drops out of
// fullscreen (fatal on a kids' touch panel — the chess clocks sit right
// there), it silently exits right after the 3-2-1 countdown, and Chrome pops
// its own "leave/stay fullscreen?" banner mid-match. None of that is fixable
// from JS — it's the browser's own gesture/heuristic layer.
// A template that opts in gets a CSS-only stand-in instead: `root` (the same
// stable element real fullscreen targets) just gets a class, and every OS/
// browser affordance above stops applying — only this same Fullscreen button
// (still on screen, still tappable) can turn it off. Trade-off: the browser's
// own tab/address bar stays visible (no top-layer promotion without the real
// API) — same trade-off Wordwall's own iPad experience makes, and worth it
// for the stability. Zero-diff for every template that doesn't set the flag:
// they keep calling the real requestFullscreen()/exitFullscreen() exactly as
// before. Visual rules for `.aw-zoomed` live in the opting-in template's OWN
// stylesheet (see templates/running-word/running-word.css), not here — this
// core edit is purely behavioral (which mechanism the button drives).
function setZoomed(root, fsBtn, on) {
  root.classList.toggle("aw-zoomed", on);
  fsBtn.classList.toggle("is-zoomed", on);
  // Zoomed mode has no browser-level top-layer promotion, so the page behind
  // `root` could still rubber-band/scroll under a child's touch drag — lock it
  // for the duration, exactly like the real Fullscreen API effectively does.
  document.documentElement.style.overflow = on ? "hidden" : "";
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
// `fight` (Đợt 124) — set ONLY by core/fight.js when this play is one of the two
// boards of a FIGHT MODE match: `{ side: 0|1, ctl }`. Everything about a single
// play stays identical; the flag just (a) keeps the second board off the shared
// myActivity bridge seat and out of the assignment strips, and (b) reports
// score / clock / finish to the match controller so the shared strip on top can
// show them. A play without it behaves exactly as it always has.
export function startGame(root, activity, { onExit, session = null, base = null, fight = null } = {}) {
  root.innerHTML = "";

  // The ORIGINAL library act behind this play. For a normal play it's `activity`
  // itself; for a "Change template" play it's the act we converted FROM. Applied
  // options are persisted onto THIS act (never onto the throwaway converted copy),
  // and a converted act's options are remembered in originAct.templateOptions[type].
  const originAct = base || activity;

  // FIGHT MODE (Đợt 131, 12/8/2026 — teacher heard the "time's up" cue with
  // 2 minutes left on the visible clock): hand this board's REAL teardown to
  // the match controller. Until now core/fight.js's own teardown() only ever
  // called the TEMPLATE's `lock(true)` (see ctl.attach below) — it never
  // touched this engine's own `cleanupAll()`, so this board's 500ms clock
  // interval (and everything else cleanupAll() stops) kept running forever in
  // the background every time a match rebuilt (Start again / Options > Apply
  // / Change template / exit fight to single). `cleanupAll` is a function
  // DECLARATION further down this same closure, hoisted, so it already exists
  // here. Registering unconditionally, before anything else, guarantees the
  // controller can always reach it — even a match that is torn down within
  // the same tick this board mounted (student closing the page mid-load).
  if (fight) fight.ctl.registerCleanup(fight.side, cleanupAll);

  const tpl = getTemplate(activity.type);
  const { page, stage, inner, below } = buildStage(activity.theme || "classic");
  // Activity-type class on the stage, present from the very first paint (READY
  // screen included) — before tpl.mount() ever runs. A template stylesheet can
  // key off `.aw-stage.act-<type>` for anything that must look right BEFORE the
  // teacher presses Play, which a `:has()` check against the template's own
  // markup can never do (that markup doesn't exist until mount()). Purely
  // additive: no other template's CSS reads an `.act-*` class today.
  stage.classList.add(`act-${activity.type}`);

  // ---- myActivity multi-pane sync bridge (a NO-OP when running standalone) ----
  // When embedded in myActivity's 2-4 pane view, pane 0's Template / Options /
  // Style changes are mirrored to the other panes. We log a console marker on
  // each change (myActivity listens), and expose programmatic setters so
  // myActivity can replay the same change on the OTHER panes. `awSyncMute` stops
  // a replayed change from echoing straight back out as a new marker.
  //
  // v0.9.6x fix (reported by Teacher Andrew: sync "sometimes" worked, timing-
  // dependent): `window.__awordBridge` used to be a brand-new object created by
  // EVERY startGame() call — and "Change template" re-enters startGame() via the
  // ASYNC doSwitchTemplate() (awaits ensureTemplate()+convertActivity(), which can
  // take anywhere from ~0ms cached to 1-2s on first load of a template type). Any
  // Options/Style call that arrived from myActivity DURING that window landed on
  // the OLD bridge — mutating an `activity`/`stage` object that was about to be
  // discarded the instant startGame() re-ran — and was silently lost. Fix: the
  // bridge itself is now a STABLE, page-lifetime singleton that only ever
  // delegates to whichever mount is CURRENT (`_setCurrent`, called synchronously
  // at the top of every startGame(), before any await can run); a switchTemplate()
  // in flight is tracked so a concurrent applyOptions()/setTheme() call WAITS for
  // it to land (and the now-current delegate) instead of racing it. Every method
  // is async and resolves true/false so myActivity knows for certain whether the
  // change actually applied (used to show a per-pane sync checkmark).
  if (!window.__awordBridge) {
    let current = null;   // delegate of the live mount: {getState,switchTemplate,applyOptions,setTheme}
    let inFlight = null;  // Promise of an in-flight switchTemplate — others await it first
    window.__awordBridge = {
      getState: () => (current ? current.getState() : null),
      async switchTemplate(type) {
        if (!current) return false;
        const p = Promise.resolve().then(() => current.switchTemplate(type));
        inFlight = p;
        try { return await p; } finally { if (inFlight === p) inFlight = null; }
      },
      async applyOptions(opts) {
        if (inFlight) await inFlight.catch(() => {});
        return current ? current.applyOptions(opts) : false;
      },
      async setTheme(id) {
        if (inFlight) await inFlight.catch(() => {});
        return current ? current.setTheme(id) : false;
      },
      _setCurrent(delegate) { current = delegate; },
    };
  }
  let awSyncMute = 0;
  const awEmit = (tag, payload) => { if (awSyncMute <= 0) { try { console.log("MYACT:AW:" + tag + ":" + payload); } catch (_) {} } };
  // FIGHT MODE: the bridge has exactly ONE seat (`_setCurrent`), so the second
  // board must not take it — otherwise myActivity would drive the right-hand
  // board while the teacher is looking at the left one. Board 0 keeps the seat.
  if (!fight || fight.side === 0) window.__awordBridge._setCurrent({
    getState: () => ({ type: activity.type, options: { ...(activity.options || {}) }, theme: activity.theme || null }),
    switchTemplate(type) {
      if (!type || type === activity.type) return false;
      awSyncMute++;
      return Promise.resolve(doSwitchTemplate(type)).then(() => true, () => false)
        .finally(() => { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); });
    },
    applyOptions(opts) {
      if (!opts) return false;
      awSyncMute++;
      try { if (!activity.options) activity.options = {}; Object.assign(activity.options, opts); replayCurrent(); return true; }
      finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    setTheme(id) {
      if (!id || id === activity.theme) return false;
      awSyncMute++;
      try {
        loadTheme(id);
        stage.classList.forEach(c => { if (c.startsWith("theme-")) stage.classList.remove(c); });
        stage.classList.add("theme-" + id);
        activity.theme = id;
        return true;
      } finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    }
  });

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
  // Opt-in (tpl.hasSloganSlot): a centered slot between the timer and the
  // score/lives group, on the SAME row — Anagram uses it for its "ANAGRAM IN
  // ANDREW CLASSES" caption (Đợt 134, moved here from a child of the question
  // card so it truly shares the timer/score row). The template fills the text
  // itself via ui.sloganSlot; empty by default so no other template is
  // affected. Automatically invisible in fight mode for free — a board's own
  // `.aw-topbar` collapses to 0 height there (see app.css), same as the timer
  // and score already do.
  const sloganSlot = tpl.hasSloganSlot ? el("span", "aw-top-slogan") : null;
  if (topbarMid) {
    topbar.append(timerEl, topbarMid, scoreEl);
  } else if (livesSlot && sloganSlot) {
    const topRight = el("div", "aw-top-right");
    topRight.append(livesSlot, scoreEl);
    topbar.append(timerEl, sloganSlot, topRight);
  } else if (sloganSlot) {
    topbar.append(timerEl, sloganSlot, scoreEl);
  } else if (livesSlot) {
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
  const fsBtn = iconBtn("aw-iconbtn aw-fs-always" + (root.classList.contains("aw-zoomed") ? " is-zoomed" : ""), icons.fullscreen, "Fullscreen");
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
  // MODE (Đợt 124) — SINGLE MODE <-> FIGHT MODE, for templates that opt in with
  // `tpl.fightMode` (Anagram so far). Teacher path only: a pupil playing an
  // assignment never sees this row at all. core/fight.js is DYNAMIC-imported so
  // the student page never downloads it, and so this file doesn't take a static
  // dependency on a module that imports it straight back.
  const modeBtn = (tpl.fightMode && !session) ? toolBtn(icons.mode, "Mode: single / fight") : null;
  if (modeBtn) {
    if (fight) modeBtn.classList.add("is-active");
    // MODE never switches on the bare click any more (teacher, 12/8/2026) — a
    // stray tap used to drop a running match straight back to single mode with
    // no way back. Same popover mechanism as Options/Template/Style
    // (openToolPanel), just with a Yes/Cancel question instead of controls.
    modeBtn.onclick = () => openToolPanel(modeBtn, buildModeConfirmPanel);
  }
  // DURING A MATCH the row is 5 wide (…/MODE/Fullscreen) and MODE swaps places
  // with Style so it lands dead centre (teacher, 12/8/2026) — it is the button
  // that governs the whole match, so it gets the middle seat. Outside a match
  // the row is its usual Options/Template/Style, with MODE simply appended.
  if (fight && modeBtn) belowCenter.append(optionsBtn, templateBtn, modeBtn, styleBtn);
  else if (modeBtn) belowCenter.append(optionsBtn, templateBtn, styleBtn, modeBtn);
  else belowCenter.append(optionsBtn, templateBtn, styleBtn);
  function buildModeConfirmPanel(panel) {
    const toFight = !fight;
    panel.append(el("div", "aw-tool-panel-head", toFight ? "Switch to Fight mode?" : "Switch to Single mode?"));
    panel.append(el("div", "aw-mode-confirm-text", toFight
      ? "Two teams play the same act side by side, racing for points."
      : "Leave the match and go back to one board."));
    const row = el("div", "aw-mode-confirm-row");
    // NOT panelItem(): that helper is styled for the dark in-stage .aw-panel
    // (white text, cqw sizing) — invisible/oversized out here in the light
    // below-stage popover, same trap the "Apply" button comment warns about.
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); closeToolPanel(true); };
    row.append(cancelBtn);
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", toFight ? "Start fight" : "Back to single");
    goBtn.type = "button";
    goBtn.onclick = async () => {
      sound.click();
      closeToolPanel(false);
      if (fight) { fight.ctl.exitFight(); return; }
      exitAnyFullscreen();
      cleanupAll();
      try {
        const { startFight } = await import("./fight.js");
        // `base` travels into the match so a Change-template DURING the fight
        // still converts from the teacher's original act, exactly as it does
        // in single mode (entering a fight from an already-converted act is
        // the case that needs it).
        startFight(root, activity, { onExit, base: originAct });
      } catch (e) {
        console.warn("AWord: fight mode failed to load", e);
        startGame(root, activity, { onExit, base });
      }
    };
    row.append(goBtn);
    panel.append(row);
  }
  // FIGHT MODE: one Fullscreen for the whole match, in the same row as
  // Options/Template/Style/MODE (teacher, 12/8/2026). The per-board buttons
  // inside the two frames are hidden by CSS — two of them made no sense when
  // both boards go full-screen together as one page.
  const fightFsBtn = fight ? toolBtn(icons.fullscreen, "Fullscreen") : null;
  if (fightFsBtn) {
    // ⚠️ NOT `fsBtn.click()`. This engine's own Fullscreen promotes ITS `root`,
    // which inside a match is just this ONE board's div — so the match went
    // full-screen showing a single board, with the other board, the scoreboard
    // strip and this very toolbar all left outside. The match controller owns
    // the element that holds all of them (see ctl.toggleFullscreen).
    fightFsBtn.onclick = () => { sound.click(); fight.ctl.toggleFullscreen(); };
    belowCenter.append(fightFsBtn);
  }

  const belowRight = el("div", "aw-below-right");
  const editBtn = toolBtn(icons.edit, "Edit", true);
  const assignBtn = toolBtn(icons.assignment, "Set assignment", true);
  const printBtn = toolBtn(icons.print, "Print", true);
  const homeBtn = toolBtn(icons.home, "Home", true);
  belowRight.append(editBtn, assignBtn, printBtn, homeBtn);
  // Leaving the game (Home / Edit) drops fullscreen so the library or editor
  // shows windowed as before — only "Start again" keeps fullscreen now that the
  // fullscreen target is the stable root (see the fullscreen helpers up top).
  homeBtn.onclick = () => { sound.click(); exitAnyFullscreen(); cleanupAll(); onExit?.(); };
  editBtn.onclick = () => {
    sound.click();
    if (!tpl.edit) { toast("Edit — coming soon"); return; }
    // Leave the game, open this game's editor. Save -> store + replay with the
    // new content; Cancel -> replay the original untouched.
    exitAnyFullscreen();
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
  if (!session && !fight && activity.id) {
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
  // below the play button: the GAME (template) name, big & bold (replaces the
  // instruction line). A "Start with mistakes" run says so right here — the
  // teacher must be able to tell the two apart at a glance from across the
  // room, BEFORE pressing Play (Đợt 84).
  const gameName = (tpl.name || activity.type) + (activity._mistakes ? " with mistakes" : "");
  readyCenter.append(el("div", "aw-ready-game", escapeText(gameName).toUpperCase()));
  playOverlay.append(readyCenter);
  inner.append(playOverlay);

  // ----- OPTIONAL "get ready first" gate — `tpl.prepare` (Đợt 108, 11/8/2026) --
  // A template whose game genuinely CANNOT start until something heavy has
  // loaded declares:
  //     tpl.prepare = (activity, onProgress) => Promise<any>
  // and the engine then, on THIS ready screen (i.e. the moment the activity
  // opens, before anyone presses anything): hides PLAY, shows a progress bar
  // in its place, and only reveals PLAY once that promise settles. Built for
  // SPEAKING, whose ~240MB in-browser pronunciation model would otherwise
  // download only after PLAY, leaving the student staring at a mic button
  // that can't grade anything yet (teacher, 11/8/2026).
  //
  // `onProgress({ percent, text })` — both optional: `percent` 0-100 drives
  // the bar, `text` replaces the caption. Deliberately a plain, template-
  // agnostic shape: the engine knows nothing about models or downloads, the
  // template maps whatever its own loader reports onto these two fields.
  //
  // Backward compatible by construction: a template that doesn't declare
  // `prepare` never enters this branch, so PLAY appears immediately exactly
  // as it always has (verified against Quiz + Anagram, Đợt 108).
  //
  // A prepare() that REJECTS still reveals PLAY (with a warning caption)
  // rather than bricking the activity behind a bar that never fills — the
  // template is expected to degrade gracefully in that case (SPEAKING falls
  // back to loading the model on the first recording, as it did before).
  //
  // ⬇️ ĐỌC TIẾP: từ Đợt 122 `tpl.prepare` không còn là thứ DUY NHẤT giữ nút
  // PLAY. Hợp đồng với template không đổi một chữ nào — nó chỉ trở thành MỘT
  // trong bốn bước của cổng chờ chung ngay dưới đây.
  // ----- ĐỢT 122 (12/8/2026) — CỔNG CHỜ NAY LÀ CỦA LÕI, CHẠY CHO CẢ 17 GAME --
  //
  // Thầy yêu cầu: "chuẩn bị trước toàn bộ những gì cần thiết trước khi bấm
  // START để chơi mượt, không trễ dù chơi với tốc độ rất cao."
  //
  // Cùng một thanh %, một nút PLAY, nhưng nay chờ BỐN việc song song:
  //   1. GIỌNG ĐỌC  — quét đệ quy `content` gom id clip rồi kéo hết về (nguồn
  //                   trễ lớn nhất: trước đợt này mỗi từ đợi tới lượt mới tải)
  //   2. ÂM THANH   — chờ `prime()` của bộ mp3 (Đợt 85 đã tải sớm nhưng KHÔNG
  //                   chặn PLAY, nên ai bấm nhanh trong giây đầu vẫn hụt tiếng)
  //   3. ẢNH        — ảnh nền trong CSS template + mảng `tpl.preloadImages`
  //   4. tpl.prepare — phần riêng của template (SPEAKING: mô hình chấm ~240MB)
  //
  // Đo dung lượng thật 12/8/2026: xấu nhất ~3,2MB (Gameshow 1,58MB tiếng +
  // act 100 từ 1,2MB giọng), thường chỉ 0,5–1,5MB — nhẹ nhờ Đợt 121 nén giọng
  // xuống 12KB/từ.
  //
  // BA LUẬT AN TOÀN (đừng gỡ khi sửa sau này):
  //  · Thanh chỉ hiện sau 250ms — mọi thứ đã có cache thì PLAY ra ngay, không
  //    nháy một thanh % chớp tắt vô nghĩa.
  //  · Quá 12 giây là mở PLAY, phần còn thiếu tải tiếp ở nền. Mạng lớp học
  //    chết không được phép khoá cứng nút chơi.
  //  · Mọi bước đều KHÔNG BAO GIỜ reject (giữ đúng luật Đợt 108: prepare lỗi
  //    vẫn phải hiện PLAY) — thiếu tiếng còn hơn không chơi được.
  //
  // Chạy lại mỗi lần dựng màn READY, kể cả "Start again" — rẻ, vì cả 4 bước
  // đều nhớ kết quả (giọng: bộ đệm `core/voice-clips.js`; tiếng: `primedP`
  // của pack; ảnh: cache HTTP của trình duyệt; mô hình: `_asrP`).
  const PREP_BAR_DELAY_MS = 250;
  const PREP_TIMEOUT_MS = 12000;
  prepareBeforePlay();

  function prepareBeforePlay() {
    const steps = [];

    // 1. giọng đọc từng từ. Mode "Text" KHÔNG tự đọc gì (voiceView), nên tải
    //    trước cả kho clip là phí đường truyền lớp học — act 100 từ ≈ 1,2MB.
    //    Nút loa nhỏ vẫn còn: bấm thì clip đó tải lẻ ngay lúc ấy, y như trước
    //    khi có bước nạp trước này (Đợt 122).
    const voiceIds = (activity.options || {}).contentMode === "text"
      ? [] : [...collectVoiceIds(activity.content || {})];
    if (voiceIds.length) {
      steps.push({
        weight: 3,
        run: report => preloadVoiceClips(voiceIds, ({ done, total }) =>
          report(done / total, `Loading the spoken words… ${done}/${total}`))
      });
    }

    // 2. bộ âm thanh mp3 của game (không báo % — pack không đếm được từng byte)
    steps.push({ weight: 1, run: () => whenAllPacksPrimed() });

    // 3. ảnh: khai trong CSS + ảnh do chính template dựng bằng JS
    const imageUrls = [...cssImageUrls(activity.type), ...(tpl.preloadImages || [])];
    if (imageUrls.length) {
      steps.push({
        weight: 1,
        run: report => preloadImages(imageUrls, ({ done, total }) => report(done / total))
      });
    }

    // 4. phần riêng của template (giữ nguyên hợp đồng Đợt 108)
    if (typeof tpl.prepare === "function") {
      steps.push({
        weight: 12,      // nặng nhất trong các bước hiện có (mô hình 240MB của SPEAKING)
        run: report => tpl.prepare(activity, p => {
          const pct = Number(p && p.percent);
          report(Number.isFinite(pct) ? pct / 100 : null, p && p.text);
        })
      });
    }

    bigPlay.style.display = "none";
    let prep = null, prepFill = null, prepText = null, caption = "Getting this game ready…";
    let settled = false;

    const barTimer = setTimeout(() => {
      if (settled) return;
      prep = el("div", "aw-ready-prep");
      const prepBar = el("div", "aw-ready-prepbar");
      prepFill = el("div", "aw-ready-prepfill");
      prepBar.append(prepFill);
      prepText = el("div", "aw-ready-preptext", caption);
      prep.append(prepBar, prepText);
      readyCenter.insertBefore(prep, bigPlay);
      paint();
    }, PREP_BAR_DELAY_MS);

    const fractions = steps.map(() => 0);
    const totalWeight = steps.reduce((s, x) => s + x.weight, 0);

    function paint() {
      if (!prep) return;
      let acc = 0;
      steps.forEach((s, i) => { acc += s.weight * Math.max(0, Math.min(1, fractions[i])); });
      prepFill.style.width = `${Math.round((acc / totalWeight) * 100)}%`;
      prepText.textContent = caption;
    }

    function reveal() {
      if (settled) return;
      settled = true;
      clearTimeout(barTimer);
      if (prep) prep.remove();
      bigPlay.style.display = "";
    }

    const runOne = (step, i) => {
      const report = (fraction, text) => {
        if (Number.isFinite(fraction)) fractions[i] = fraction;
        if (text) caption = String(text);
        paint();
      };
      // Một bước ném lỗi NGAY (không phải reject) cũng không được giết cả cổng.
      try { return Promise.resolve(step.run(report)).catch(() => {}).then(() => { fractions[i] = 1; paint(); }); }
      catch (e) { fractions[i] = 1; return Promise.resolve(); }
    };

    Promise.race([
      Promise.all(steps.map(runOne)),
      new Promise(r => setTimeout(r, PREP_TIMEOUT_MS))
    ]).then(reveal, reveal);
  }

  bigPlay.onclick = () => {
    bigPlay.disabled = true;
    // FIGHT MODE: whichever board the teacher presses, the OTHER one starts at
    // the same instant (teacher, 12/8/2026). Both plays run their own clock, so
    // starting them apart would leave the shared clock — which reads board 0 —
    // telling one team's time to both. Relayed before anything else here so the
    // two boards' clocks start on the same tick.
    if (fight) fight.ctl.playPressed(fight.side);
    // FIGHT MODE: both boards press Play together, so the lifecycle chimes
    // would fire twice a few milliseconds apart — one flammed, louder chime
    // instead of a clean one (the per-file extra voices in core/sfx.js make
    // BOTH audible now, which is right for gameplay sounds and wrong for this).
    // The board-0 copy is the match's chime.
    if (!fight || fight.side === 0) (tpl.sounds?.play || sound.start)();
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
  // Split out of startTimerNow() so the Menu-pause code (below) can restart
  // the exact same interval after adjusting `startedAt` — kept as one function
  // so the two call sites can never drift apart.
  function tickTimer() {
    const elapsed = Math.floor((performance.now() - startedAt) / 1000);
    let secondsNow;
    if (timerMode() === "countDown") {
      const remaining = Math.max(0, timerTotal() - elapsed);
      timerEl.textContent = formatTime(remaining);
      secondsNow = remaining;
      // Optional per-template hook — no default sound, so templates that
      // don't opt in (e.g. Quiz) behave exactly as before.
      if (remaining <= 5 && remaining > 0 && !timeWarned) { timeWarned = true; if (!fight || fight.side === 0) tpl.sounds?.timeWarning?.(); }
      if (remaining <= 0) { stopTimer(); submitHandler?.(); }
    } else {
      timerEl.textContent = formatTime(elapsed);
      secondsNow = elapsed;
    }
    // FIGHT MODE: both boards keep their own clock (each play still needs one
    // for its own timing), but only board 0's reading is shown — on the shared
    // strip between the two scoreboards. Raw seconds, not the in-frame chip's
    // text: the strip pads BOTH minutes and seconds to 2 digits (12/8/2026,
    // for a steady width/centering), unlike the single-digit-minutes chip.
    if (fight) fight.ctl.onTimer(fight.side, secondsNow);
  }
  function startTimerNow() {
    if (timerStarted) return;
    // Đợt 114 — SAME hole as Đợt 112, different door. A `manualTimerStart`
    // template calls ui.startTimer() from its own timer (Unjumble: when the
    // intro animation ends, 3.3s after PLAY). Leave the game during that window
    // and the dead play still starts a 500ms ticker nobody can clear — measured:
    // left to the library mid-intro, the "time's up" cue fired 12s later with no
    // game on screen at all.
    if (torndown) return;
    timerStarted = true;
    startedAt = performance.now();
    timeWarned = false;
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (timerMode() !== "none") {
      // show the correct value immediately (don't wait for the first 500ms tick)
      const initialSeconds = timerMode() === "countDown" ? timerTotal() : 0;
      timerEl.textContent = formatTime(initialSeconds);
      if (fight) fight.ctl.onTimer(fight.side, initialSeconds);
      timerId = setInterval(tickTimer, 500);
    }
  }

  function begin() {
    startedAt = performance.now();   // baseline (kept sane even if a manual-start template never starts the clock)
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (!tpl.manualTimerStart) startTimerNow();
    cleanup = tpl.mount(playArea, activity, ui) || (() => {});
  }
  const stopTimer = () => { if (timerId) clearInterval(timerId); timerId = null; };

  // ----- Menu pause (Đợt 91, 8/8/2026) — freeze the shared clock while the ☰
  // Menu popup is open, so the visible time (and any countDown auto-submit)
  // doesn't advance during the pause. `pausedClockAt` records WHEN it paused;
  // resuming shifts `startedAt` forward by exactly the paused duration so the
  // elapsed/remaining time picks up from the same value, not a jump. -----
  let pausedClockAt = 0;
  let torndown = false;   // set by cleanupAll(): this play is over, nothing may restart its clock
  function pauseClockForMenu() {
    if (timerId) { clearInterval(timerId); timerId = null; pausedClockAt = performance.now(); }
  }
  function resumeClockForMenu() {
    if (!pausedClockAt) return;
    startedAt += performance.now() - pausedClockAt;
    pausedClockAt = 0;
    // ⚠️ GHOST CLOCK GUARD (Đợt 112, 11/8/2026 — teacher heard the "time's up"
    // cue with plenty of time left). This runs from closeMenu(), and closeMenu()
    // is ALSO called by cleanupAll() while the game is being torn down — so
    // without this line "☰ Menu -> Start again" would hand the DEAD play a brand
    // new setInterval that nothing ever clears: it kept ticking on an invisible
    // timerEl, fired timeWarning at ITS own 5-seconds-left mark (during the NEXT
    // play, clock showing 0:28), then hit 0 and called submitHandler() — a
    // phantom fanfare AND a phantom leaderboard row / session.submit() for a game
    // nobody was playing. Every restart stacked one more. See GHI CHU DU AN.md.
    if (torndown) return;
    if (timerStarted && timerMode() !== "none") timerId = setInterval(tickTimer, 500);
  }

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
    if (tpl.useZoomFullscreen) setZoomed(root, fsBtn, !root.classList.contains("aw-zoomed"));
    else if (!fsElement()) requestFs(root);
    else exitFs();
  };
  // Leaving the game (Home / Edit) must drop BOTH kinds of fullscreen.
  function exitAnyFullscreen() {
    if (fsElement()) exitFs();
    if (root.classList.contains("aw-zoomed")) setZoomed(root, fsBtn, false);
  }

  // =============================================================
  // OUTER TOOLBAR POPOVERS — Options / Template / Style
  // One at a time: clicking a tool button makes it glow, opens a panel
  // centered under the 3-button cluster, and dims the WHOLE screen
  // (game included) behind it. Click outside (the dim, or elsewhere) closes it.
  // =============================================================
  let toolDim = null, toolPanelEl = null, activeToolBtn = null;
  let panelCompactObs = null;   // ResizeObserver for is-compact-opts (Đợt 134) — see openToolPanel

  // fade = true -> animate opacity out before removing (a real user-initiated
  // close: outside click, or toggling the open button again). fade = false ->
  // remove instantly (used when SWITCHING to a different tool button, since a
  // new panel fades in immediately on top — an extra fade-out there would just
  // look like a delay — and on full teardown/restart where no one is watching).
  function closeToolPanel(fade = true) {
    const dim = toolDim, panel = toolPanelEl, btn = activeToolBtn;
    toolDim = null; toolPanelEl = null; activeToolBtn = null;
    panelCompactObs?.disconnect(); panelCompactObs = null;
    document.removeEventListener("pointerdown", onToolOutside);
    if (btn) btn.classList.remove("is-active");
    if (!dim && !panel) return;
    if (!fade) { dim?.remove(); panel?.remove(); return; }
    let done = false;
    const remove = () => { if (done) return; done = true; dim?.remove(); panel?.remove(); };
    const fadeOpts = { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" };
    const a = dim?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOpts);
    // Mirrors .aw-tool-panel's entrance (app.css, `aw-pop-cx`) in reverse —
    // every keyframe stop keeps `translateX(-50%)` so the panel's own
    // centering transform is never overridden mid-animation (Đợt 134).
    panel?.animate(
      [{ opacity: 1, transform: "translateX(-50%) translateY(0) scale(1)" },
       { opacity: 0, transform: "translateX(-50%) translateY(6px) scale(.94)" }],
      fadeOpts
    );
    if (a) a.onfinish = remove;
    setTimeout(remove, 260);   // fallback (a hidden/backgrounded tab can stall animation events)
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
    // Cap the panel's height so it never runs off the top of the screen, and
    // let it scroll internally past that — but the cap itself is the ACTUAL
    // room above the toolbar (viewport top to `belowCenter`), not the stage's
    // own height. That distinction used to matter only in FIGHT MODE, where
    // the stage is just ONE of two half-width boards — measuring it gave a
    // squeezed ~307px scroller for a 557px Template list (teacher, 12/8/2026,
    // Đợt 130). Đợt 132 (teacher: "tăng tối đa chiều dọc… không bao giờ cần
    // scroll dọc, có thể đè lên nút tùy chỉnh nếu cần"): the same measurement
    // is simply MORE room than the stage's own height in single mode too —
    // there was never a reason to leave it capped tighter there. Applying it
    // everywhere is a strict increase, nothing shrinks for anyone.
    const roomAbove = belowCenter.getBoundingClientRect().top - 24;
    const maxH = Math.max(200, roomAbove);
    toolPanelEl.style.maxHeight = maxH + "px";
    // Đợt 134 (teacher, Anagram Options: "tự động... chỉnh kích thước nội
    // dung bên trong nhỏ lại để hiển thị được đầy đủ mà không cần scroll").
    // Opt-in (tpl.compactOptionsOnOverflow) and scoped to the OPTIONS panel
    // only — Template/Style/Mode panels, and every other template's Options,
    // are unaffected. A ResizeObserver (not a one-shot check at open time) so
    // toggling a radio that reveals MORE option rows mid-session re-evaluates
    // live too. Each callback measures against the panel's NATURAL (class
    // removed first) height, never its own already-compacted height, or the
    // decision would oscillate: compact -> shrinks -> looks like it fits ->
    // un-compact -> grows again -> overflows -> compact... forever.
    if (tpl.compactOptionsOnOverflow && buildContent === buildOptionsPanel) {
      const recheck = () => {
        toolPanelEl.classList.remove("is-compact-opts");
        toolPanelEl.classList.toggle("is-compact-opts", toolPanelEl.scrollHeight > maxH + 1);
      };
      recheck();
      panelCompactObs = new ResizeObserver(recheck);
      panelCompactObs.observe(toolPanelEl);
    }
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

    // Đợt 132 (teacher): the "OPTIONS" heading is gone — for EVERY template,
    // not just acts with a Content switch (below) to replace it — the panel
    // now just starts with its first real group. One line, one place: no
    // per-template opt-out needed since every panel goes through this one
    // function.

    // CONTENT (teacher, 12/8/2026, redesigned Đợt 132) — TOPMOST control, and
    // only for acts that actually carry spoken clips. One act now holds the
    // written clue AND the spoken one (the old "ENG1" + "ENG1 VOICE" pair
    // merged into a single act), so this is where the class picks which one
    // it plays with today. The meaning of each value, and the untouched-old-
    // act AUTO case, live in ONE place: voiceView() in core/voice-
    // playback.js. Nothing here is template-specific — all 14 games with a
    // listen button obey it. Redesigned from a plain radio pair into a big
    // two-button switch with a sliding thumb (teacher: "nút chuyển đẹp và
    // mượt hơn", "bỏ chữ CONTENT") — same draft-mutation contract as before,
    // just different markup.
    if (hasAnyVoice(activity.content || {})) {
      // An act saved BEFORE this option existed has no contentMode, and its
      // items may be mixed (some hideText, some not). Show the nearest of the
      // two buttons but DON'T write it into the draft — leaving contentMode
      // unset keeps the per-item AUTO behaviour byte-for-byte until the
      // teacher actually picks one.
      const shown = draft.contentMode || (hasAnyVoice(activity.content) && hasHiddenText(activity.content) ? "voice" : "text");
      const switchEl = el("div", "aw-opt-switch" + (shown === "voice" ? " is-voice" : ""));
      switchEl.append(el("div", "aw-opt-switch-thumb"));
      const textBtn = el("button", "aw-opt-switch-btn" + (shown === "text" ? " is-active" : ""), "Text");
      const voiceBtn = el("button", "aw-opt-switch-btn" + (shown === "voice" ? " is-active" : ""), "Voice");
      textBtn.type = "button"; voiceBtn.type = "button";
      const pick = value => {
        draft.contentMode = value;
        switchEl.classList.toggle("is-voice", value === "voice");
        textBtn.classList.toggle("is-active", value === "text");
        voiceBtn.classList.toggle("is-active", value === "voice");
        sound.click();
      };
      textBtn.onclick = () => pick("text");
      voiceBtn.onclick = () => pick("voice");
      switchEl.append(textBtn, voiceBtn);
      panel.append(switchEl);
    }

    // TIMER — a template can hide this whole group (tpl.hideTimerOption) when it
    // runs its OWN timer (e.g. Gameshow's per-QUESTION countdown, which the shared
    // whole-game timer would fight). Mirror of tpl.hideLettersOption below; every
    // other template keeps this group exactly as before.
    if (!tpl.hideTimerOption) {
      const gTimer = el("div", "aw-opt-group");
      gTimer.append(el("div", "aw-opt-label", "Timer"));
      // nowrap (Đợt 132, teacher: "các mode timer luôn nằm cùng dòng, không
      // bao giờ xuống dòng") — safe now that the panel itself is wide enough
      // to actually fit None / Count up / Count down+mm:ss on one line (see
      // .aw-tool-panel's widened max-width in app.css).
      const timerRow = el("div", "aw-opt-row aw-opt-row-nowrap");
      const mkRadio = (value, label) => {
        const wrap = el("label", "aw-opt-choice");
        const r = el("input"); r.type = "radio"; r.name = "aw-timer"; r.value = value;
        r.checked = (draft.timer ?? "countUp") === value;
        // Đợt 132 (teacher): the mm:ss steppers now stay VISIBLE at all times
        // next to "Count down" — dimmed + non-interactive when a different
        // timer mode is picked, rather than vanishing via display:none. That
        // also keeps the row's own width constant, which matters now that
        // it's forced onto one line (aw-opt-row-nowrap above) — a field that
        // popped in and out of the layout used to be able to reflow the row.
        r.onchange = () => { draft.timer = value; timeFields.classList.toggle("is-dim", value !== "countDown"); };
        wrap.append(r, document.createTextNode(label));
        return wrap;
      };
      // countdown minutes/seconds — press-and-hold or swipe-to-adjust steppers.
      const timeFields = el("span", "aw-opt-time");
      const total = draft.timerTotalSeconds ?? 120;
      const mm = makeNumberStepper(Math.floor(total / 60), 0, 59, v => { draft.timerTotalSeconds = v * 60 + ss.get(); });
      const ss = makeNumberStepper(total % 60, 0, 59, v => { draft.timerTotalSeconds = mm.get() * 60 + v; });
      timeFields.append(mm.el, document.createTextNode("m"), ss.el, document.createTextNode("s"));
      timeFields.classList.toggle("is-dim", (draft.timer ?? "countUp") !== "countDown");
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
    // activity.options.autoSwitch. Shown for every template (teacher's call,
    // 1/8/2026) EXCEPT ones that opt out via tpl.hideAutoSwitch — Type the answer
    // now always auto-advances a graded question on its own (3/8/2026 spec), so
    // this checkbox would no longer do anything there and only confuse things.
    if (!tpl.hideAutoSwitch) {
      const gAuto = el("div", "aw-opt-group");
      gAuto.append(el("div", "aw-opt-label", "Auto switch"));
      const rowAuto = el("div", "aw-opt-row");
      rowAuto.append(mkCheck(draft.autoSwitch === true, "Move to the next question automatically",
        v => draft.autoSwitch = v));
      gAuto.append(rowAuto);
      panel.append(gAuto);
    }

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

    // FIGHT MODE settings (content of the two boards, who scores a word, speed
    // bonus) go in the SAME panel rather than a second one — only while a match
    // is actually running, since they mean nothing to a single board.
    if (fight && typeof fight.ctl.buildOptions === "function") {
      fight.ctl.buildOptions({ panel, draft, el, mkCheck, mkRadioChoice });
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

    // The "Options apply when you press Play / Applying restarts the game…"
    // hint line was dropped Đợt 132 (teacher: trim guidance text so the whole
    // panel fits without scrolling) — the Apply button's own behaviour is
    // unchanged, this only removed the sentence explaining it.

    // APPLY — only now does the draft get written into activity.options.
    // Clicking outside without pressing this discards every change above.
    const applyWrap = el("div", "aw-opt-apply-wrap");
    const applyBtn = el("button", "aw-btn aw-btn-primary aw-opt-apply", "Apply");
    applyBtn.type = "button";
    applyBtn.onclick = () => {
      sound.click();
      if (!activity.options) activity.options = {};
      Object.assign(activity.options, draft);
      // FIGHT MODE: each board plays a COPY of the act (its own frozen word
      // order), so writing into this copy's options would leave the real act —
      // and the other board — untouched. Hand the whole draft to the match,
      // which owns the real act, saves it, and rebuilds BOTH boards.
      if (fight) { fight.ctl.applyOptions({ ...draft }); closeToolPanel(false); return; }
      awEmit("OPT", JSON.stringify(activity.options));   // mirror applied Options to other myActivity panes
      timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
      // Persist the applied options PERMANENTLY (teacher only — students never
      // reach this panel). For the original act, save its options straight onto
      // it. For a temporary "Change template" act, remember the options per
      // (original act, template type) in originAct.templateOptions[type] so that
      // picking that template for this act again later restores them — and NEVER
      // save a throwaway "conv_" act into the library.
      if (!session) {
        // A "Start with mistakes" act (id "mist_", Đợt 84) is a throwaway too:
        // its content is a CUT-DOWN copy of a real act. Options belong to the
        // act it was cut from — saving the cut-down copy would quietly drop a
        // 3-word act into the teacher's library. `activity.options` is the SAME
        // object as the base act's (buildMistakesActivity spreads shallowly),
        // so the Object.assign above already updated the real act in memory.
        const realAct = activity._mistakes ? (activity._mistakesBase || originAct) : activity;
        const isConv = !!realAct._converted;
        if (isConv) {
          if (!originAct.templateOptions) originAct.templateOptions = {};
          originAct.templateOptions[realAct.type] = { ...realAct.options };
        }
        const target = isConv ? originAct : realAct;
        if (target.id && !/^(conv|mist)_/.test(String(target.id))) {
          import("./store.js").then(m => m.saveActivity(target)).catch(() => {});
        }
      }
      // Applying ANY option restarts the current game so it always runs under
      // the new settings (teacher's call, 1/8/2026 — every template). If the
      // game hasn't started yet (Play overlay still up), there's nothing to
      // restart — just apply and close; the options take effect on Play.
      const playing = !playOverlay.isConnected;
      if (playing) { closeToolPanel(false); replayCurrent(); return; }
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
  // The games we can switch to, ALWAYS computed from the ORIGINAL act (teacher,
  // 4/8/2026). A "Change template" play only BORROWS the origin's content, so
  // the temp act must never become the source for the next switch: converting is
  // lossy, and asking the temp act what it can turn into silently locked games
  // out — e.g. from a temp Speaking cards (no answers at all) NOTHING was
  // switchable, and from a temp Anagram without clues every clue-needing game
  // disappeared. Reading the origin means every switch offers the same full
  // list, whichever temp game happens to be on screen.
  // switchTargets() drops the origin's OWN type, so we add it back while a temp
  // act is playing — that entry is how the teacher returns to the real act.
  function switchList() {
    const list = switchTargets(originAct);
    if (activity.type !== originAct.type) {
      const home = ALL_TEMPLATES.find(t => t.type === originAct.type && t.built);
      if (home) list.unshift({ type: home.type, label: home.label });
    }
    return list.filter(t => t.type !== activity.type);   // never offer what's already playing
  }

  function buildTemplatePanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Template"));
    const grid = el("div", "aw-tpl-grid");
    const canSwitch = new Set(switchList().map(t => t.type));
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

  // ----- Menu pause (Đợt 91, 8/8/2026) — teacher's brief: opening the ☰ Menu
  // dims + softly blurs the STAGE only (title/Options/Template/Style/Edit/
  // Assignment/Print below the stage stay fully lit, unlike `.aw-tool-dim`
  // which dims the whole viewport for Options/Template/Style) and puts the
  // WHOLE game on hold — clock, shared audio, any running animation — so
  // nothing moves/plays/counts down behind the popup; closing it (Resume, or
  // clicking outside) picks up exactly where it left off. -----
  let stageDim = null;
  let pausedAnimations = [];
  function enterMenuPause() {
    pauseClockForMenu();
    sound.pauseContext();   // the shared Web Audio context (crossword/running word/team's own tones)
    if (typeof window !== "undefined" && window.__awSfxPacks) {
      window.__awSfxPacks.forEach(p => p.pauseActive?.());   // any playing mp3 sfx/music, every template's pack
    }
    // Freeze whatever CSS/WAAPI animation is running INSIDE the stage right
    // now (entrance/exit pops, shakes, a template's own continuous movement
    // built on `element.animate()` or `@keyframes`) — remembering only the
    // ones we actually paused, so resume can't accidentally restart something
    // that was already paused/finished on its own.
    // ⚠️ MUST run BEFORE `stageDim` is created below: `stage.getAnimations()`
    // walks the WHOLE subtree, so appending the dim FIRST would catch its own
    // `aw-fadein` entrance animation (just started -> playState "running") and
    // immediately pause IT too, freezing the dim at opacity 0 — invisible dim
    // + blur despite every style being computed "correctly". (Caught live,
    // 8/8/2026: teacher saw the clock freeze but no dim/blur at all.)
    pausedAnimations = stage.getAnimations({ subtree: true }).filter(a => a.playState === "running");
    pausedAnimations.forEach(a => { try { a.pause(); } catch { /* ignore */ } });
    // Optional per-template hook — for timers a template manages ITSELF
    // (its own setInterval game clock, spawn scheduling, background music not
    // routed through core) that the steps above can't reach. Templates that
    // don't opt in are unaffected: the stage just dims+freezes visually.
    tpl.onPause?.(true);
    stageDim = el("div", "aw-stage-dim");
    inner.append(stageDim);
  }
  // The Menu closes for TWO different reasons and they need opposite endings:
  //   • Resume / click-outside  -> put the play back exactly as it was;
  //   • cleanupAll() (Start again / Home / Change template) -> the play is being
  //     THROWN AWAY, so "resuming" it means dropping a dead game's sounds and
  //     animations on top of the next one. `torndown` (set by cleanupAll before
  //     it calls closeMenu) tells the two apart. Đợt 113.
  // The shared AudioContext is the ONE thing resumed either way: it outlives the
  // play, and leaving it suspended would mute the NEXT game's synthesized tones
  // (crossword / running word / running team).
  function exitMenuPause() {
    stageDim?.remove(); stageDim = null;
    resumeClockForMenu();
    sound.resumeContext();
    if (typeof window !== "undefined" && window.__awSfxPacks) {
      window.__awSfxPacks.forEach(p => (torndown ? p.dropPaused?.() : p.resumeActive?.()));
    }
    // Those animations live in the stage DOM that is about to be replaced —
    // restarting them buys nothing and can flash a frame of the dying game.
    if (!torndown) pausedAnimations.forEach(a => { try { a.play(); } catch { /* ignore */ } });
    pausedAnimations = [];
    // Same reasoning for a template's OWN timers/music: cleanup() runs a moment
    // later and tears them down anyway, so waking them up first is a blip (an
    // audible one for Gameshow's background music), never a benefit.
    if (!torndown) tpl.onPause?.(false);
  }

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
    enterMenuPause();
    inner.append(menuEl);
    // clicking anywhere else closes the menu (deferred so the opening click doesn't trigger it)
    setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
  }
  function closeMenu() {
    if (!menuEl) return;
    const el2 = menuEl;
    menuEl = null;
    document.removeEventListener("pointerdown", onMenuOutside);
    exitMenuPause();
    // Mirrors .aw-menu's entrance (app.css, `aw-pop`) in reverse (Đợt 134) —
    // this popup has no self transform to protect, unlike .aw-tool-panel.
    let done = false;
    const remove = () => { if (done) return; done = true; el2.remove(); };
    const a = el2.animate(
      [{ opacity: 1, transform: "translateY(0) scale(1)" },
       { opacity: 0, transform: "translateY(4px) scale(.96)" }],
      { duration: 140, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" }
    );
    a.onfinish = remove;
    setTimeout(remove, 200);   // fallback (a hidden/backgrounded tab can stall animation events)
  }
  function menuItem(label, action) {
    const b = el("button", "aw-menu-item", label);
    b.type = "button";
    b.onclick = () => { sound.click(); action(); };
    return b;
  }

  // "Start again" ALWAYS goes back to the FULL word list (teacher, 7/8/2026).
  // On a "Start with mistakes" run `activity` is the cut-down act, so replaying
  // `activity` would lock the player inside the shrinking set forever. The act
  // carries `_mistakesBase` = the full act it was cut from (and stays pointing
  // at the FIRST one however many rounds deep you go), so this is the one
  // documented way back to everything — along with reloading the page and
  // switching template and back.
  function restart() {
    if (!fight || fight.side === 0) tpl.sounds?.restart?.();   // optional per-template restart sound, layered on the menu/button's own click (one board's copy is enough — see the Play chime above)
    // FIGHT MODE: "Start again" belongs to the MATCH, not to one board. Left to
    // itself this re-entered startGame() with no `fight` option, so the board
    // came back as an ordinary single play INSIDE the match — its own toolbar,
    // its own score chip, and no more reporting to the scoreboard above it.
    if (fight) { cleanupAll(); fight.ctl.restartMatch(); return; }
    cleanupAll();
    const target = activity._mistakes ? activity._mistakesBase : activity;
    startGame(root, target, { onExit, session, base: originAct });
  }

  // Replay whatever is loaded RIGHT NOW, mistakes round included. Used by
  // Options → Apply, which restarts only so the new settings take effect: it
  // must not double as the way out of a mistakes round (the teacher nudging
  // the timer mid-practice would silently get the whole word list back).
  function replayCurrent() {
    cleanupAll();
    if (fight) { fight.ctl.restartMatch(); return; }   // same reason as restart() above
    startGame(root, activity, { onExit, session, base: originAct });
  }

  // Is there a "Start with mistakes" round to offer? Needs a template that
  // opted in (tpl.itemsKey + `src` on its review rows) AND at least one item
  // this play got wrong or left blank.
  function mistakesAvailable() {
    if (session) return false;   // students get only what the teacher ticked
    const kept = pickMistakes(activity, tpl, reviewData);
    return !!(kept && kept.length);
  }

  // "Start with mistakes" — replay THIS play's wrong + unanswered items only.
  // Lands on the READY screen (big PLAY) of the same game, so the teacher can
  // hand the board over before anything starts.
  function startWithMistakes() {
    const next = buildMistakesActivity(activity, tpl, reviewData);
    const min = minItemsFor(activity.type);
    const n = next ? (next.content[tpl.itemsKey] || []).length : 0;
    if (n < min) {
      // Nothing left to practise, or too few for the game to work at all.
      // Say which, and stay on the summary so nothing is lost.
      toast(n === 0 ? "No mistakes to practise" : `Need at least ${min} words`);
      return;
    }
    cleanupAll();
    // base stays originAct: "Change template" still converts from the ORIGINAL
    // full act, which is the teacher's other documented way back to everything.
    startGame(root, next, { onExit, session, base: originAct });
  }
  // Order matters (Đợt 112): `torndown` first so the closeMenu() below can't
  // revive the clock (see resumeClockForMenu), and stopTimer AFTER closeMenu so
  // even a future resume path added in between still ends up cleared. Belt and
  // braces on purpose — a leaked 500ms ticker is invisible and cost the teacher
  // a phantom "time's up" mid-game plus phantom results.
  // ⚠️ Idempotent on purpose (Đợt 131): a fight-mode board can now be torn
  // down BOTH by its own button handler (e.g. restart()/replayCurrent() call
  // this directly, then hand off to fight.ctl.restartMatch()) AND by the
  // match controller's teardown() calling the very same function back via
  // registerCleanup — the second call must be a safe no-op, not a second run
  // of closeMenu/stopTimer/cleanup().
  function cleanupAll() { if (torndown) return; torndown = true; closeMenu(); stopTimer(); closeToolPanel(false); cleanup(); }

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
      // FIGHT MODE (teacher, 12/8/2026): the switch belongs to the MATCH, not
      // to the board whose toolbar was used — both boards must land on the same
      // new template, sharing one word order and one scoreboard. So convert
      // here, then hand the finished act to the controller, which rebuilds the
      // whole match around it (the same door Options > Apply goes through).
      if (fight) {
        await ensureTemplate(targetType);
        // Only a template that knows the fight contract may take a match over.
        // One that doesn't would still RUN — which is worse than refusing,
        // because it would LOOK like a match while quietly ignoring rounds,
        // locking and the shared scoreboard.
        // ⚠️ Checked here, after the module is loaded, rather than greying the
        // panel out: `tpl.fightMode` lives on the module and is the single
        // source of truth. Mirroring it into core/catalog.js (the only way to
        // know without loading) would mean two places to keep in sync, and
        // pre-loading all 17 modules just to draw the panel wastes the very
        // lazy-loading that catalog exists for.
        if (!getTemplate(targetType).fightMode) {
          toast(`${templateLabel(targetType)} can't be played as a fight yet`);
          return;
        }
        // Convert from the MATCH's act, never this board's frozen copy — see
        // ctl.sourceActivity() in core/fight.js for why.
        const matchAct = fight.ctl.sourceActivity();
        const next = targetType === matchAct.type
          ? matchAct
          : await convertActivity(matchAct, targetType);
        fight.ctl.restartMatch(next);
        return;
      }
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
    const targets = switchList();   // from the ORIGIN act — see switchList()
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
    sloganSlot,  // null unless tpl.hasSloganSlot is true — a centered span between timer and score (Anagram)
    scoreEl,     // the score element itself (read-only) — for effects that fly toward the score
    startTimer: startTimerNow,   // start the clock now (only meaningful with tpl.manualTimerStart)
    setScore(n) {
      // Positive score = GREEN, negative = RED WITH a leading "-" (teacher,
      // 11/8/2026 — previously the chip dropped the sign and relied on
      // colour alone; now a wrong-heavy round reads "-3" in red, not "3").
      const v = Number(n) || 0;
      scoreEl.innerHTML = `${icons.check} ${v}`;
      scoreEl.classList.toggle("is-pos", v > 0);
      scoreEl.classList.toggle("is-neg", v < 0);
      // FIGHT MODE: the in-frame chip is hidden and this team's number lives on
      // the shared strip above both boards instead.
      if (fight) fight.ctl.onScore(fight.side, v);
    },
    // `label` (added 4/8/2026 for Find the match) REPLACES the default
    // "x of N" text with the template's own wording — e.g. "Page 1 / 2" for a
    // game that has no per-question progress, or "" to show nothing at all.
    // Purely additive: leave it out and the text is exactly as before.
    setNav({ index, total, onPrev = null, onNext = null, nextLabel = null, label = null }) {
      navLabel.textContent = label != null ? label : `${index} of ${total}`;
      wireNav(navPrev, onPrev);
      wireNav(navNext, onNext);
      navNext.innerHTML = nextLabel ? nextLabel : icons.next;
      navNext.classList.toggle("is-finish", !!nextLabel);
    },
    onSubmit(fn, countFn) { submitHandler = fn; answeredCounter = typeof countFn === "function" ? countFn : null; },
    sound,
    toast,
    finish(raw) {
      // ⭐⭐ Đợt 114 — THE one guard that matters most. A play that has been
      // thrown away must never hand in a result: several templates schedule
      // their end-of-round animation with a bare setTimeout (0.3–2.9s) and call
      // finish() when it lands, so leaving the game during that window used to
      // write a phantom row into the leaderboard (teacher mode) or fire a
      // phantom session.submit() to Firestore (student mode) for a game nobody
      // was playing — while the NEXT play was already on screen. The templates
      // are being fixed one by one too, but this is the single place that
      // protects ALL of them, including any template written later.
      if (torndown) return;
      stopTimer();
      // FIGHT MODE: a board running out of words (or lives) ends the MATCH —
      // the winner comes from the two scoreboards, so this play doesn't draw
      // its own summary panel or write a single-player row to the leaderboard.
      if (fight) { fight.ctl.onFinish(fight.side, raw); return; }
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
      // A "Start with mistakes" round is PRACTICE, not a scored play (teacher,
      // 7/8/2026): it never reaches the leaderboard. Its act has a fresh id
      // every round, so scoring it would build a one-row board per round that
      // always reads "YOU'RE 1ST" — noise on top of a table meant for comparing
      // real, full plays against each other.
      if (answered > 0 && !activity._mistakes) {
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
    // The nav (prev/next + "x of N") is LEFT VISIBLE during the fanfare (teacher's
    // call 3/8/2026). It used to be hidden for the ~1.9-2.2s confetti window, but
    // because that overlay is transparent the bottom bar shows through, so the nav
    // appeared to "sometimes vanish" — most noticeably on a short converted (Change
    // template) quiz that auto-finishes the moment every answer is in. We keep the
    // auto-finish but no longer touch the nav here; the opaque Summary backdrop
    // that follows covers the whole bar anyway.
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

    // Opt-in: a template may REPLACE the whole summary body (stats + rank line +
    // action items) with its own. It gets the panel to fill, the computed
    // result, the `restart` action and the `panelItem` button helper. Used by
    // Running word to show a two-team scoreboard with only "Start again"
    // (teacher's request, 5/8/2026). Purely additive — every template that
    // doesn't define renderSummary keeps the default panel below, byte-for-byte.
    if (typeof tpl.renderSummary === "function") {
      tpl.renderSummary(panel, { result, restart, panelItem, session: !!session });
      bd.append(panel);
      return;
    }

    const stats = el("div", "aw-sum-stats");
    const t = fmtSecsParts(result.timeMs);
    stats.append(
      // SCORE = the scored value, not the raw tally (teacher, 7/8/2026). With
      // "Points off" on, a wrong answer subtracts, so 9 right + 1 wrong at −5
      // reads "4/10", NOT "9/10". `result.score` is exactly the number the
      // leaderboard already ranks by (scoring.js: raw.score ?? correct), so the
      // summary and the ranking can no longer disagree. Templates with no
      // penalty pass no `score` -> it defaults to `correct` -> byte-for-byte the
      // old display. Points-mode templates (Gameshow) pass a pre-formatted
      // scoreText on their OWN scale (e.g. "1250" speed points, where "/10"
      // would be meaningless) and still show it alone.
      result.scoreText != null
        ? statBlock("Score", result.scoreText, "")
        : statBlock("Score", `${result.score}`, `/${result.total}`, result.score < 0 ? "is-neg" : ""),
      statBlock("Time", t.big, t.small)
    );
    panel.append(stats);

    // The raw tally on its own quiet line under the two big numbers: how many
    // questions were actually right, regardless of what the penalty did to the
    // score. Small and grey on purpose — the headline is the SCORE above.
    // Only shown when it says something the Score line doesn't (teacher,
    // 7/8/2026): with "Points off" at 0 — the default on every act — score IS
    // the tally, so the line would just print the same fraction twice.
    if (result.total > 0 && result.score !== result.correct) {
      panel.append(el("div", "aw-sum-total", `Total: ${result.correct}/${result.total}`));
    }

    // No rank line on a "Start with mistakes" run — that play is deliberately
    // not scored (teacher, 7/8/2026), so `entryId` is null and the "you're 1st"
    // line would be meaningless anyway (see finish()).
    if (!session && !activity._mistakes) {
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
      items.append(panelItem("Start again", restart));
      // "Start with mistakes" sits right under "Start again" (teacher's layout).
      // Only for games that opted in with tpl.itemsKey AND only when this play
      // actually left something wrong or blank — a clean sheet gets no button
      // rather than a button that only ever says "No mistakes to practise".
      if (mistakesAvailable()) items.append(panelItem("Start with mistakes", startWithMistakes));
      // "Play a different template" was HERE until Đợt 84 and moved out to make
      // room: a 5th button pushed the panel past its 92% max-height and made it
      // scroll, hiding the last row. The same picker still lives in the ☰ menu
      // as "Change template" (teacher's call, 7/8/2026).
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

  // `valueCls` (optional) rides on the big number only — used to paint a
  // negative score red, the same sign-carries-colour rule as ui.setScore().
  function statBlock(label, big, small, valueCls = "") {
    const b = el("div", "aw-sum-stat");
    b.append(
      el("div", "aw-sum-label", label),
      el("div", "aw-sum-value" + (valueCls ? " " + valueCls : ""),
         `${escapeText(big)}<span>${escapeText(small)}</span>`)
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
