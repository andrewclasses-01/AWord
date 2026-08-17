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
import {
  resolveActivity, variantsOf, voiceVariantsOf, variantLabel, activeVariant,
  contentSetsOf, activeContentSet, setLabel,
  viewKeyOf, splitViewOptions, optionsForView, storeViewOptions, VIEW_SELECTOR_KEYS
} from "./content-view.js";
import { switchTargets, convertActivity } from "./convert.js";
import { computeResult } from "./scoring.js";
import { buildMistakesActivity, pickMistakes, minItemsFor } from "./mistakes.js";
import { buildStage } from "./layout.js";
import { formatTime, el, ordinal, fmtSecsParts } from "./utils.js";
import { press } from "./press.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { confettiBurst } from "./confetti.js";
import { addEntry, getEntries, getRank, updateName } from "./leaderboard.js";
// SHOWDOWN (Đợt 155) — this import is SAFE to take statically: core/showdown.js
// is deliberately pure (sessionStorage + the turn rule + the review renderer, no
// Firestore, no library). Everything that talks to Firestore lives in
// core/showdown-setup.js, which is `await import`-ed from the teacher's button
// only — same discipline as fight.js and store.js below.
import { readPick, clearPick, memberAt, stampReview, buildShowdownReview } from "./showdown.js";
// store.js (the teacher's library) is imported LAZILY for the same reason as
// assignment-ui.js: the student page must not even load code that can reach it.
import { TEMPLATES, templateLabel, templateIcon } from "./catalog.js";
import { fitOnce } from "./fit.js";
import { THEMES, loadTheme } from "./themes/manifest.js";
import { openPrintPopup } from "./print.js";
// Đợt 143 — the Options panel's BODY lives here now, shared with Settings >
// "Default activity options" so the teacher meets the same controls in both
// places. This file keeps the other half: the draft model, Apply, and
// persisting into the teacher's library.
import { buildOptionsBody } from "./options-panel.js";
// Đợt 143 — penalties moved onto ONE 0..100 scale. An act saved under an older
// scale is converted exactly once, guarded by act.optVer; see that file for the
// multiply-on-every-load trap it exists to prevent.
import { migrateActivityOptions } from "./options-migrate.js";
// Time cost (Đợt 139) — leaf module, no dependency of its own beyond utils, so
// importing it statically is safe on the STUDENT page too (the ⛔ boundary is
// only about code that can reach the teacher's library: store.js / assignment-
// ui.js / fight.js).
import { flyTimeCost } from "./timecost.js";
// NOTE: assignment-ui.js reaches into the teacher's library (core/store.js), so
// it is imported LAZILY and only on teacher paths — that keeps the student page
// (play.html) free of any code that can touch the library.

// ⭐⭐ Đợt 153 — WARM ALL FOUR Baloo 2 WEIGHTS THE MOMENT THE ENGINE LOADS.
// Every @font-face here is `font-display: swap` (core/app.css), and a weight's
// file is only fetched when something first NEEDS it. The MODE popover's
// explanation line is the first text in the whole app at weight 400: measured
// on a fresh page, `document.fonts.check('400 13px "Baloo 2"')` was still false
// when the swap to Mode began, so `max-width: 30ch` resolved against the
// FALLBACK font and swapContents pinned the panel 260px wide — the real width
// is 267.36px, so the box jumped 7.36px wider the instant the pin came off, at
// the very end of the animation. Nothing in swapContents can defend against
// this: it measures the truth of that frame, and the truth changed underneath
// it a few milliseconds later.
// 👉 LUẬT: anything a panel's size is measured from must be metric-stable
// BEFORE the teacher can open it. Fire-and-forget, a few KB each, and they
// would be fetched anyway.
if (typeof document !== "undefined" && document.fonts?.load) {
  [400, 600, 700, 800].forEach(w => {
    try { document.fonts.load(`${w} 13px "Baloo 2"`).catch(() => { /* offline: fallback font, nothing to do */ }); }
    catch { /* ignore */ }
  });
}

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

// ⭐ Đợt 158 — a one-shot handover across a RESTART. Leaving a match to set up
// Showdown means the board the teacher is looking at is thrown away and rebuilt
// by fight.js, taking the popover with it; this flag is how the new board knows
// to open the team table by itself. Module scope (not a closure) precisely
// because it has to outlive the play that set it — and it is read-and-cleared,
// so it can only ever fire for the next mount, never a later one.
let openShowdownOnMount = false;

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
export function startGame(root, libAct, { onExit, session = null, base = null, fight = null } = {}) {
  root.innerHTML = "";

  // ⭐ Đợt 145 — TWO NAMES FOR ONE ACT, and the difference matters.
  //   `libAct`   the object that came from the library. For a vocabulary act it
  //              still holds ALL its clue sets. Everything that WRITES — Edit,
  //              Set assignment, saving applied Options, re-entering this
  //              function — must use this one.
  //   `activity` what this play actually runs: the same act with the chosen
  //              clue set flattened down to a plain `.clue` per item, so all 17
  //              templates keep working without knowing variants exist.
  // For every act that has no variants (i.e. the entire existing library)
  // resolveActivity() hands back the SAME object, so the two names are one
  // thing and this đợt changes nothing at all. See core/content-view.js.
  // ⚠️ The two SHARE their `options` object by reference, which is what keeps
  // Options → Apply (Object.assign into activity.options) landing on the real
  // act; only `content` differs.
  // ⚠️ `let`, not `const`, and re-read in begin() — see the note there. Applying
  // Options BEFORE pressing Play does not re-enter startGame(), so a clue set
  // chosen on the READY screen would otherwise never reach the game.
  let activity = resolveActivity(libAct);

  // The ORIGINAL library act behind this play. For a normal play it's `libAct`
  // itself; for a "Change template" play it's the act we converted FROM. Applied
  // options are persisted onto THIS act (never onto the throwaway converted copy),
  // and a converted act's options are remembered in originAct.templateOptions[type].
  const originAct = base || libAct;

  // ⭐⭐ Đợt 154 — THE ACT THAT OWNS THE SUB-ACTS (clue sets · PRACTICE/HOMEWORK).
  // Normally that is the act being played. But a "Change template" play is a
  // CONVERSION, and convert.js resolves the act down to ONE clue set before it
  // converts — so the temp act carries no `variants` and no halves, and asking
  // it what sub-acts exist answers "none". The origin still knows, so ask it.
  // Everything downstream (the Options rows, the READY title, the re-convert on
  // Apply) goes through this one function, so there is a single answer to
  // "which act is the teacher choosing sub-acts OF".
  // For every act that isn't converted — and for the entire pre-Đợt-145 library
  // — this returns `libAct` and nothing anywhere behaves differently.
  // ⚠️ ONLY a converted act borrows the origin's sub-acts, and never a "start
  // with mistakes" run. A mistakes act is ALSO a flattened cut-down copy with
  // no variants, and it is played with the same `base` — so without this guard
  // it would answer "the origin owns my sub-acts" too, and Apply would rebuild
  // the origin from scratch, silently throwing the 3 words the class was
  // reviewing away.
  function subActSource() {
    if (variantsOf(libAct.content) || contentSetsOf(libAct.content)) return libAct;
    if (libAct._converted && !libAct._mistakes && originAct !== libAct &&
        (variantsOf(originAct.content) || contentSetsOf(originAct.content))) return originAct;
    return libAct;
  }

  // The sub-act currently on screen, as it reads in Options: "ENG1", "HOMEWORK".
  // Teacher, 14/8/2026: the READY screen must say WHICH one is about to be
  // played — "DS-S2.I1.W3 / WORDS" is not enough when one act carries four.
  // The half comes first and the clue set second, the order the two rows sit in
  // the Options panel, so the screen reads the way the panel does.
  function subActLabel() {
    const src = subActSource();
    const parts = [];
    const sets = contentSetsOf(src.content);
    if (sets) parts.push(setLabel(src.content, activeContentSet(src)));
    if (variantsOf(src.content)) parts.push(variantLabel(src.content, activeVariant(src)));
    return parts.filter(Boolean).join(" - ");
  }

  // Đợt 143 — bring old penalty values onto the current 0..100 scale before ANY
  // of them is read. Belt-and-braces with core/store.js (which migrates
  // everything the library hands out): samples, imported bundles, converted
  // copies and "start with mistakes" acts are built on the fly and never come
  // through the library at all. Idempotent — `act.optVer` makes sure a value
  // can only ever be converted once, however many times this runs.
  migrateActivityOptions(libAct);
  if (originAct !== libAct) migrateActivityOptions(originAct);

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

  // ⭐⭐ SHOWDOWN (Đợt 155) — read core/showdown.js's header for the whole idea.
  // `readPick()` is a SYNCHRONOUS sessionStorage read of a snapshot the setup
  // panel left behind, which is what lets the first pupil's name be on screen in
  // the very first frame — a name that arrives a beat late reads as a bug on a
  // classroom projector, and an `await` here would guarantee it every time.
  //
  // ⚠️ `!fight`: Showdown and Fight are MUTUALLY EXCLUSIVE. Both redefine the
  // same two things — who the current question belongs to, and what the middle
  // of the top row says — so "both at once" has no meaning to define. The MODE
  // button drops Showdown on its way in (see buildModeConfirmPanel), and this
  // guard is the other half of that: a board inside a match never reads a pick.
  //
  // ⚠️ `!session`: a pupil playing an assignment is one named person already.
  // `const`: nothing ever reassigns this. Turning Showdown on or off writes
  // sessionStorage and re-enters startGame(), so the live value is always the
  // one THIS mount read — there is deliberately no second way to change it.
  const showdownPick = (tpl.showdownMode && !session && !fight) ? readPick() : null;

  // ⭐⭐ TIME EACH ROUND (Đợt 174, teacher 17/8/2026) — a SECOND clock, one that
  // belongs to the pupil whose turn it is rather than to the game.
  //   options.roundTimer   "none" | "countUp" | "countDown"
  //   options.roundSeconds the count-down's length (ignored by count up)
  //
  // ⚠️ SHOWDOWN ONLY, and that is a deliberate narrowing, not a shortcut
  // (teacher's answer, 17/8/2026: "chỉ khi chạy showdown"). Outside Showdown
  // there is no "round belongs to somebody" to time: the option is not even
  // built into the Options panel (see buildOptionsPanel below), so a saved
  // `roundTimer` on an act played in single mode reads as "none" here and this
  // whole feature costs the other 14 templates — and these three outside
  // Showdown — nothing at all.
  //
  // ⚠️ READ ONCE, AT MOUNT. Everything it decides is STRUCTURAL (where the name
  // lives, where the whole-game clock lives, whether there is a bar under the
  // top row), and the two things that change options — Options ▸ Apply and the
  // myActivity bridge — both re-enter startGame() through replayCurrent(), so a
  // change is picked up by the rebuild rather than by mutating a live layout.
  const roundMode = showdownPick
    ? (["countUp", "countDown"].includes(activity.options?.roundTimer) ? activity.options.roundTimer : "none")
    : "none";
  const roundOn = roundMode !== "none";
  // Same clamp as the Options stepper (see core/options-panel.js). A default of
  // 20s rather than the whole-game clock's 120: this one is one pupil, one
  // question.
  const roundTotal = () => Math.max(3, Math.min(599, Math.round(Number(activity.options?.roundSeconds)) || 20));

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
    // ⭐ Đợt 171 — ALL THREE mutators share this ONE queue now, not just
    // switchTemplate. Originally (v0.9.6x fix, see the long note above)
    // `applyOptions`/`setTheme` only ever WAITED for an in-flight
    // switchTemplate; neither became `inFlight` itself, so two of THEM
    // arriving close together had no mutual exclusion at all. That was a
    // narrow bet — Options/Theme used to be effectively synchronous — but a
    // Text/Voice content-mode change is exactly as heavy as a template switch
    // (replayCurrent() re-enters startGame(), which kicks off real voice-clip
    // preloading; see prepareBeforePlay() below), and two panes' worth of
    // Showdown/myActivity relayed OPT calls landing on the SAME pane close
    // together could overlap: the second's cleanupAll()+startGame() would
    // start tearing the DOM down while the first's async continuations were
    // still running against it. Teacher, 15/8/2026, after re-testing found it
    // "lúc được lúc không" (sometimes syncs, sometimes doesn't) for Text/Voice
    // specifically while Lives/Timer-style options — cheap, no async tail —
    // synced every time: exactly the signature of a race, not a hole in the
    // sync itself. Every mutator now both AWAITS and BECOMES `inFlight`, so
    // whichever call is running has the seat to itself.
    let inFlight = null;
    function queued(run) {
      const p = (inFlight ? inFlight.catch(() => {}) : Promise.resolve()).then(run);
      inFlight = p;
      return p.finally(() => { if (inFlight === p) inFlight = null; });
    }
    window.__awordBridge = {
      getState: () => (current ? current.getState() : null),
      switchTemplate: (type) => queued(() => current ? current.switchTemplate(type) : false),
      applyOptions: (opts) => queued(() => current ? current.applyOptions(opts) : false),
      setTheme: (id) => queued(() => current ? current.setTheme(id) : false),
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
  // `tpl.timerBesideMenu` (opt-in, currently only Open the box, Đợt 92) — the
  // engine's own whole-game timer (`timerEl`) does NOT sit in this row at all;
  // it moves down to the bottom bar, next to Menu — see the leftGroup setup
  // below and the long comment on `.has-inline` in core/app.css for why (this
  // row already carries the template's OWN per-box clock via `topbarMid`, and
  // the two used to visually collide once Timer was set to anything but None).
  // ⭐ Đợt 174 — the whole-game clock ALSO leaves this row when a per-round clock
  // is running (teacher: "Đồng hồ đếm xuôi/ngược tổng… được đưa vào bên cạnh nút
  // Menu"). Two clocks side by side in one row is exactly the collision
  // `tpl.timerBesideMenu` was invented for at Đợt 92 — this is the same move,
  // decided per PLAY instead of per template, so the flag and the mode share one
  // variable from here on and no `.aw-timer-external` rule has to learn about
  // Showdown.
  const timerOutOfTopbar = !!tpl.timerBesideMenu || roundOn;
  const topbar = el("div", "aw-topbar" + (tpl.inlineTimerBar ? " has-inline" : "") + (timerOutOfTopbar ? " aw-timer-external" : ""));
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
  // ⭐ Đợt 155 — the centre of the row can now carry TWO things, so both live in
  // one wrapper that takes the single centre seat the layout already had. In
  // Showdown the wrapper gets `.is-showdown` and CSS hides the template's own
  // caption while showing the pupil's name.
  //   ⚠️ HIDDEN, not replaced. Anagram rewrites `ui.sloganSlot.textContent` on
  //   every render(), so a name written into that same node would be wiped the
  //   next time the word changed — silently, and only in the one game that has a
  //   slogan. Two nodes and a CSS class means NEITHER side can clobber the
  //   other, and no template needed a single line changed for Showdown.
  const sloganSlot = (tpl.hasSloganSlot || showdownPick) ? el("span", "aw-top-slogan") : null;
  const showdownSlot = showdownPick ? el("span", "aw-top-showdown") : null;
  // ⭐ Đợt 174 — the per-round clock takes the centre seat the NAME used to hold,
  // and the name moves down over the ‹ › cluster (teacher's own layout). Both
  // stay ONE node each, moved rather than duplicated: `paintShowdownName` keeps
  // writing to the same `showdownSlot` wherever it ended up, so the name logic
  // did not need a single line changed for this.
  const roundClockEl = roundOn ? el("span", "aw-round-clock", "0") : null;
  let centreSlot = null;
  if (sloganSlot) {
    centreSlot = el("span", "aw-top-centre" + (showdownSlot ? " is-showdown" : ""));
    centreSlot.append(sloganSlot);
    if (showdownSlot && !roundOn) centreSlot.append(showdownSlot);
    // ⭐ Đợt 174b (teacher, 17/8/2026) — COUNT DOWN keeps its number OUT of this
    // centre seat: the seconds and the bar belong together on ONE line, sharing
    // the score's row ("cả số giây + thanh thời gian đều cùng nằm trên 1 hàng và
    // cùng hàng với số điểm"), so they are built into `.aw-roundrow` below
    // instead. COUNT UP has no bar and nothing to pair with, so its number stays
    // here, centred on the frame, where it was.
    if (roundClockEl && roundMode !== "countDown") centreSlot.append(roundClockEl);
  }
  if (topbarMid) {
    if (timerOutOfTopbar) topbar.append(topbarMid, scoreEl);
    else topbar.append(timerEl, topbarMid, scoreEl);
  } else if (livesSlot && centreSlot) {
    const topRight = el("div", "aw-top-right");
    topRight.append(livesSlot, scoreEl);
    topbar.append(timerEl, centreSlot, topRight);
  } else if (centreSlot) {
    topbar.append(timerEl, centreSlot, scoreEl);
  } else if (livesSlot) {
    const topRight = el("div", "aw-top-right");
    topRight.append(livesSlot, scoreEl);
    topbar.append(timerEl, topRight);
  } else topbar.append(timerEl, scoreEl);

  // SHOWDOWN (Đợt 155) — whose question is this? `index0` is the item's
  // ZERO-BASED position in the play order. Every template already reports it,
  // as `index + 1`, through ui.setNav (that is where this is called from), and
  // it is the same index each template builds its own `review` array on — so
  // the name over the frame and the name in Show answers cannot drift apart.
  // The rule itself lives in core/showdown.js's memberAt(), used by both.
  // ⭐ Đợt 159 — THE NAME NOW CHANGES WITH THE QUESTION, not after it.
  // `sdNameIndex` is which pupil the slot is showing OR travelling towards. Two
  // callers set it and they must not fight: `ui.itemChanging` (the template, at
  // the START of its own out-animation) and `ui.setNav` (the same template, at
  // the swap). Whoever gets there first owns that index; the other sees it
  // already claimed and does nothing. Without this the setNav call would slam
  // the new name in at full opacity halfway through the fall.
  let sdNameIndex = -1;
  function paintShowdownName(index0, anim) {
    if (!showdownSlot || !showdownPick) return;
    if (index0 === sdNameIndex) return;
    sdNameIndex = index0;
    const m = memberAt(showdownPick.members, index0);
    // textContent, not el()'s 3rd argument: that one is innerHTML, and this is
    // a name the teacher typed.
    const text = m ? m.name : "";
    if (!anim) { showdownSlot.textContent = text; return; }
    // Teacher, 15/8/2026: "tên cũ hạ thấp và biến mất dần, tên mới chạy từ trên
    // xuống… đồng bộ với thời gian ẩn câu cũ và xuất hiện câu mới". The template
    // hands us ITS OWN two durations, so the two motions cannot drift apart even
    // if a template later retimes its transition.
    const outMs = Math.max(60, anim.outMs || 130);
    const inMs = Math.max(60, anim.inMs || 190);
    // ⚠️ Every animate() gets a setTimeout fallback (core rule): a hidden or
    // backgrounded tab freezes rAF, `onfinish` never comes, and without this the
    // name would sit invisible at the bottom of its fall for the rest of the
    // lesson — the whole cue the class reads, gone.
    let swapped = false;
    const swap = () => {
      if (swapped) return;
      swapped = true;
      showdownSlot.textContent = text;
      const inA = showdownSlot.animate(
        [{ transform: "translateY(-70%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
        { duration: inMs, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });
      const done = () => { try { inA.cancel(); } catch { /* already gone */ } };
      inA.onfinish = done;
      setTimeout(done, inMs + 120);
    };
    const outA = showdownSlot.animate(
      [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(60%)", opacity: 0 }],
      { duration: outMs, easing: "ease-in", fill: "forwards" });
    outA.onfinish = () => { try { outA.cancel(); } catch { /* already gone */ } swap(); };
    setTimeout(swap, outMs + 80);
  }
  paintShowdownName(0);   // never let the slot sit empty behind the READY screen

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
  // `tpl.timerBesideMenu` (Đợt 92) — `timerEl` was never appended to the
  // topbar above for this template (see the `if (tpl.timerBesideMenu)` branch
  // there), so it's still a detached node here; this is the only place it
  // gets mounted. Its own visibility (Timer option = None vs Count down) is
  // still driven exactly as before, from the SAME `timerEl.style.visibility =`
  // lines elsewhere in this file — only WHERE it lives in the DOM changed.
  if (tpl.timerBesideMenu) leftGroup.append(timerEl);
  // Optional opt-in slot right next to Menu — a template can put its own icon
  // button here (currently only Type the answer's on-screen-keyboard toggle).
  // `null` unless the template asks for it, so every other template's bottom
  // bar ends up with the exact same DOM/behavior as before (just one extra
  // wrapper level around Menu that no CSS depended on being bare).
  const kbdSlot = tpl.hasKeyboardToggle ? el("span", "aw-bottombar-extra") : null;
  if (kbdSlot) leftGroup.append(kbdSlot);
  // ⭐ Đợt 174 — the whole-game clock, when a per-round clock has taken the top
  // row. AFTER the keyboard toggle on purpose (teacher: "bên cạnh nút Menu, hoặc
  // cạnh nút bàn phím nếu có bàn phím") — Type the answer is the one Showdown
  // template with that button, and putting the clock between Menu and it would
  // push the toggle away from the corner the teacher reaches for.
  // `!tpl.timerBesideMenu`: that flag already appended it above; appending the
  // same node twice would silently MOVE it, not duplicate it, so the guard is
  // about intent rather than breakage.
  if (roundOn && !tpl.timerBesideMenu) leftGroup.append(timerEl);
  // The pupil's name rides directly above ‹ ›, as its own line in the bottom
  // row's centre seat. A WRAPPER, not a fourth child: `.aw-bottombar` is a
  // 3-track grid whose `:nth-child(1/2/3)` rules are what keep the nav truly
  // centred, and a fourth child would silently unpick that (the same reasoning
  // as `leftGroup` itself, added at Đợt 92).
  const navHost = (roundOn && showdownSlot) ? el("div", "aw-navstack") : navWrap;
  if (navHost !== navWrap) navHost.append(showdownSlot, navWrap);
  bottombar.append(leftGroup, navHost, rightTools);

  // ⭐ Đợt 176 (teacher, 17/8/2026) — the name no longer sits glued to ‹ ›: it
  // FLOATS, centred in the empty band between the game's lowest content and the
  // nav row ("trong QUIZ, tên nằm chính giữa khoảng cách từ mép trên nút
  // NEXT-BACK đến mép dưới các ô đáp án; Type the answer thì tới mép dưới bàn
  // phím"). The slot is absolutely positioned (CSS: `.aw-navstack >
  // .aw-top-showdown`), so raising it never reflows the game — no measure→move→
  // measure loop to fall into (the Đợt v1.8.1 lesson). "Lowest content" is
  // measured, not hard-coded per template: the bottom-most visible
  // button/input/keyboard inside the play area IS the tiles row in Quiz, the
  // keyboard in Type the answer, the Submit/origin row in Anagram — exactly the
  // teacher's three examples, and correct for template #4 without a new case.
  // Re-run cheaply from the round ticker (every ~250ms) because the anchor moves
  // for real reasons: keyboard toggled away, autoFit re-shrinking, a resize.
  function placeShowdownName() {
    if (navHost === navWrap || !showdownSlot || !showdownSlot.isConnected) return;
    const navR = navWrap.getBoundingClientRect();
    if (!navR.height) return;
    let contentBottom = -Infinity;
    playArea.querySelectorAll("button, textarea, input, .aw-kbd").forEach(n => {
      if (!n.offsetWidth && !n.offsetHeight) return;
      const b = n.getBoundingClientRect().bottom;
      // `<= navR.top`: a stray full-height wrapper must not read as "content
      // reaching the nav row" and pin the name to its old seat forever.
      if (b > contentBottom && b <= navR.top) contentBottom = b;
    });
    let off = 0;
    if (isFinite(contentBottom)) {
      off = Math.max(0, (navR.top - contentBottom - showdownSlot.offsetHeight) / 2);
    }
    showdownSlot.style.bottom = `calc(100% + ${Math.round(off)}px)`;
  }

  // COUNT DOWN only — the time bar, "tương tự thanh thời gian phía trên của
  // Whack a mole": the same green → orange → red fill, owned by the engine so
  // all three Showdown templates get it without a line of their own.
  // ⭐ Đợt 174b — IT LIVES IN THE TOP ROW, beside the number it belongs to and
  // on the same line as the score (teacher's correction after seeing 174's first
  // build, which gave the bar a full-width row of its own under the topbar).
  // That is the same shape Whack-a-mole's own inline bar has — clock, then bar
  // taking the slack, then the score hard right — and it costs the play area no
  // height at all, unlike the separate row it replaces.
  const roundBar = roundMode === "countDown" ? el("div", "aw-roundbar") : null;
  const roundBarFill = roundBar ? el("div", "aw-roundbar-fill") : null;
  if (roundBar) roundBar.append(roundBarFill);
  if (roundBar && roundClockEl) {
    const roundRow = el("div", "aw-roundrow");
    roundRow.append(roundClockEl, roundBar);
    // FIRST in-flow child, whatever the row's shape already is: every branch
    // above ends with the score (or the score's group) last, and prepending is
    // the one move that cannot disturb which of those branches ran.
    topbar.prepend(roundRow);
  }

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
  // ⭐⭐ MODE (Đợt 158) — ONE button for all three modes (teacher, 14/8/2026:
  // "tích hợp cả single mode / fight mode / showdown mode vào chung 1 nút bấm
  // thôi, tránh việc quá nhiều nút bấm"). It replaces the two buttons this row
  // used to carry — MODE (Đợt 124, single ↔ fight) and SHOWDOWN (Đợt 155) — and
  // opens a PICKER of big icon tiles, each leading on to the screen that mode
  // already had. Nothing about the modes themselves changed.
  //
  // Teacher path only (`!session`): a pupil playing an assignment never sees
  // this row at all. Both core/fight.js and core/showdown-setup.js stay
  // DYNAMIC-imported from here — the student page must download neither, and
  // this file must not take a static dependency on a module that imports it
  // straight back.
  const canFight = !!tpl.fightMode && !session;
  const canShowdown = !!tpl.showdownMode && !session;
  const modeBtn = (canFight || canShowdown) ? toolBtn(icons.modes, "Mode") : null;
  if (modeBtn) {
    // Glows whenever anything other than plain single mode is running. With one
    // button standing for three modes this is the only at-a-glance "something
    // is on" the toolbar has left.
    if (fight || showdownPick) modeBtn.classList.add("is-active");
    // Never switches on the bare click (teacher, 12/8/2026): a stray tap used to
    // drop a running match straight back to single mode with no way back. Same
    // popover mechanism as Options/Template/Style, and now every route out of it
    // ends in either a confirm screen or the Showdown table.
    modeBtn.onclick = () => openToolPanel(modeBtn, buildModePickPanel);
  }
  // DURING A MATCH the row is 5 wide (…/MODE/Fullscreen) and MODE swaps places
  // with Style so it lands dead centre (teacher, 12/8/2026) — it is the button
  // that governs the whole match, so it gets the middle seat. Outside a match it
  // sits last, in the seat SHOWDOWN and MODE used to share.
  if (fight && modeBtn) belowCenter.append(optionsBtn, templateBtn, modeBtn, styleBtn);
  else belowCenter.append(optionsBtn, templateBtn, styleBtn, ...(modeBtn ? [modeBtn] : []));
  // The other half of the Fight → Showdown handover (see `openShowdownOnMount`).
  // Read-and-clear FIRST, so a board that cannot honour it (no button, or we
  // somehow landed back in a match) still consumes the flag instead of leaving
  // it armed for whatever the teacher opens next.
  if (openShowdownOnMount) {
    openShowdownOnMount = false;
    if (modeBtn && !fight && canShowdown) {
      // Next tick: let this mount finish first — openToolPanel measures the
      // toolbar it is about to hang the panel under.
      setTimeout(() => { if (modeBtn.isConnected) openToolPanel(modeBtn, buildShowdownPanelHost); }, 0);
    }
  }

  // ---- THE PICKER (teacher's design, 14/8/2026) ----------------------------
  // Same footprint as the Showdown table ("bảng to như bảng đội"), and the tiles
  // are ICONS ONLY — no words ("dùng icon thật to, không dùng chữ"). The mode you
  // are already in is not offered ("đang ở chế độ nào thì hiện 2 cái kia")…
  // ⚠️ …with ONE exception the teacher chose after seeing the gap: Showdown's own
  // tile STAYS while Showdown is running, wearing a lit border, because tapping
  // it is the only way back into the team table to re-pick teams (screen C's
  // "Reset team"). Fight and Single have no such second screen, so they really
  // do just disappear. Take the exception out and Reset team becomes unreachable.
  function buildModePickPanel(panel) {
    const cur = fight ? "fight" : (showdownPick ? "showdown" : "single");
    const tiles = [];
    if (cur !== "single") tiles.push(["single", icons.single, "Single mode", buildSingleConfirmPanel]);
    if (canFight && cur !== "fight") tiles.push(["fight", icons.mode, "Fight mode", buildFightConfirmPanel]);
    if (canShowdown) tiles.push(["showdown", icons.showdown,
      cur === "showdown" ? "Showdown — set the teams again" : "Showdown",
      // ⚠️ FROM INSIDE A MATCH the table cannot simply open: this board would set
      // up teams, press READY, and `replayCurrent()` would restart it STILL
      // inside the fight, where `showdownPick` is ignored (`!fight`, see the top
      // of this file). The teacher would have built a line-up that does nothing
      // and nothing on screen would say so. So in a match the tile leads to a
      // confirm that LEAVES the match first, and the table opens by itself on
      // the single board that comes back.
      fight ? buildToShowdownConfirmPanel : buildShowdownPanelHost]);
    const grid = el("div", "aw-mp-grid");
    tiles.forEach(([key, icon, label, next]) => {
      // The label never shows on screen (that is the point) — it is the hover
      // tooltip and the accessible name, both of which cost nothing.
      const tile = el("button", "aw-mp-tile" + (key === cur ? " is-cur" : ""), `<span class="aw-mp-icon">${icon}</span>`);
      tile.type = "button"; tile.title = label; tile.setAttribute("aria-label", label);
      tile.onclick = () => { sound.click(); switchToolPanel(next); };
      grid.append(tile);
    });
    panel.append(grid);
  }

  // Two named wrappers rather than one parameterised builder: `mountPanelContent`
  // and `capPanelHeight` both identify panels BY FUNCTION IDENTITY, and a fresh
  // closure per call would quietly never match.
  function buildFightConfirmPanel(panel) { buildModeConfirmPanel(panel, "fight"); }
  function buildSingleConfirmPanel(panel) { buildModeConfirmPanel(panel, "single"); }

  // Fight → Showdown, the one hop that cannot be done in place (see the tile).
  function buildToShowdownConfirmPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Switch to Showdown?"));
    panel.append(el("div", "aw-mode-confirm-text",
      "Leave the match first. The team table opens on its own."));
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); switchToolPanel(buildModePickPanel); };
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", "Set up teams");
    goBtn.type = "button";
    goBtn.onclick = () => {
      sound.click();
      closeToolPanel(false);
      // Read and cleared by the startGame() that `exitFight()` is about to run —
      // exactly once, so a failed exit can never leave it armed for a later act.
      openShowdownOnMount = true;
      fight.ctl.exitFight();
      awEmit("FIGHT", "off");
    };
    row.append(cancelBtn, goBtn);
    panel.append(row);
  }

  // Đợt 155 — Fight and Showdown ENDS the other for this browser: both decide
  // whose question this is, so they cannot both be on.
  // ⭐ Đợt 158 — and leaving Showdown now HANDS THE TEAM BACK. Dropping only the
  // local pick (all this did before) left the CLAIM standing on Firestore, so
  // this screen's team stayed invisible on every other screen until the 12-hour
  // TTL expired — invisible damage, on a machine nobody was looking at.
  // Fire-and-forget: the write is a courtesy to the other screens, and the
  // teacher must never wait on a classroom network to change mode.
  // The shared team TABLE itself is untouched — only this screen's hold on it.
  function dropShowdown() {
    if (!showdownPick) return;
    clearPick();
    import("./showdown-setup.js")
      .then(m => m.releaseMyClaim())
      .catch(e => console.warn("AWord: could not release the Showdown team", e));
  }

  function buildModeConfirmPanel(panel, target) {
    const toFight = target === "fight";
    const leavingShowdown = !fight && !!showdownPick;
    panel.append(el("div", "aw-tool-panel-head", toFight ? "Switch to Fight mode?" : "Switch to Single mode?"));
    panel.append(el("div", "aw-mode-confirm-text", toFight
      ? "Two teams play the same act side by side, racing for points."
      : leavingShowdown
        ? "Leave Showdown. This screen's team goes back to the other screens."
        : "Leave the match and go back to one board."));
    const row = el("div", "aw-mode-confirm-row");
    // NOT panelItem(): that helper is styled for the dark in-stage .aw-panel
    // (white text, cqw sizing) — invisible/oversized out here in the light
    // below-stage popover, same trap the "Apply" button comment warns about.
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    // Đợt 158 — Cancel steps BACK to the picker instead of closing the popover:
    // with a chooser in front of it this is the second screen of a two-screen
    // flow, and "I tapped the wrong tile" is the likeliest reason to press it.
    cancelBtn.onclick = () => { sound.click(); switchToolPanel(buildModePickPanel); };
    row.append(cancelBtn);
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", toFight ? "Start fight" : "Back to single");
    goBtn.type = "button";
    goBtn.onclick = async () => {
      sound.click();
      closeToolPanel(false);
      if (!toFight) {
        // myActivity marker (2026-08-13): fires only once the teacher has
        // actually CONFIRMED here, not when the popover merely opens — host
        // uses it to auto show/hide its own "act-gap" panel around the match.
        if (fight) { fight.ctl.exitFight(); awEmit("FIGHT", "off"); return; }
        // Leaving Showdown: the restart re-reads an empty pick and the board
        // comes back as an ordinary single play (same path as the Showdown
        // panel's own "Single mode" button).
        dropShowdown();
        replayCurrent();
        return;
      }
      exitAnyFullscreen();
      dropShowdown();
      cleanupAll();
      try {
        const { startFight } = await import("./fight.js");
        // `base` travels into the match so a Change-template DURING the fight
        // still converts from the teacher's original act, exactly as it does
        // in single mode (entering a fight from an already-converted act is
        // the case that needs it).
        startFight(root, activity, { onExit, base: originAct });
        awEmit("FIGHT", "on");
      } catch (e) {
        console.warn("AWord: fight mode failed to load", e);
        startGame(root, libAct, { onExit, base });
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
    // ⚠️ Đợt 145 — the EDITOR gets `libAct`, never the resolved copy: the copy
    // has the other clue sets stripped out, so saving it would delete three
    // quarters of a vocabulary act's content without a word of warning.
    tpl.edit(root, libAct, {
      onSave: async updated => {
        const { saveActivity } = await import("./store.js");
        const saved = await saveActivity(updated);
        startGame(root, saved, { onExit });
      },
      onCancel: () => startGame(root, libAct, { onExit })
    });
  };
  // Set assignment -> the setup form; a new assignment appears as a strip below.
  assignBtn.onclick = async () => {
    sound.click();
    const ui = await import("./assignment-ui.js");
    // `libAct` again (Đợt 145): the assignment snapshot must keep every clue
    // set, so the teacher can still switch the given act between them later.
    ui.openAssignmentSetup(libAct, { onCreated: loadAssignmentBars });
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
  // ⭐ Đợt 154 — the title carries the SUB-ACT: "DS-S2.I1.W3 / WORDS - ENG1".
  // One act now holds four clue sets and/or two halves, so the act's own name no
  // longer says what is about to be played.
  // ⚠️ Rebuilt through `readyTitleEl`, not written once: Options > Apply on the
  // READY screen deliberately does NOT restart (the options take effect on
  // Play), so the sub-act can change while this very element is on screen — the
  // same trap Đợt 145 hit with the clue baked into `content`.
  const readyTitleEl = activity.title ? el("div", "aw-ready-title") : null;
  function refreshReadyTitle() {
    if (!readyTitleEl) return;
    const sub = subActLabel();
    readyTitleEl.textContent = (activity.title + (sub ? " - " + sub : "")).toUpperCase();
  }
  if (readyTitleEl) { refreshReadyTitle(); readyCenter.append(readyTitleEl); }
  const bigPlay = el("button", "aw-bigplay", icons.playBig);
  bigPlay.type = "button"; bigPlay.title = "Play"; bigPlay.setAttribute("aria-label", "Play");
  readyCenter.append(bigPlay);
  // below the play button: the GAME (template) name, big & bold (replaces the
  // instruction line). A "Start with mistakes" run says so right here — the
  // teacher must be able to tell the two apart at a glance from across the
  // room, BEFORE pressing Play (Đợt 84).
  const gameName = (tpl.name || activity.type) + (activity._mistakes ? " with mistakes" : "");
  readyCenter.append(el("div", "aw-ready-game", escapeText(gameName).toUpperCase()));
  // ⭐ Đợt 156 — SHOWDOWN: the team this screen is about to play, and who is in
  // it, so the class can see the line-up before anything starts (teacher: "hiển
  // thị thêm 'Tên team: các thành viên'"). Only THIS screen's team — the other
  // teams are being played on other screens and their results never come here.
  // Built as two nodes so the team name can carry its own weight/colour without
  // the members' list inheriting them.
  if (showdownPick) {
    const line = el("div", "aw-ready-team");
    const nameEl = el("span", "aw-ready-teamname");
    nameEl.textContent = showdownPick.teamName;      // teacher's own text
    const whoEl = el("span", "aw-ready-teamwho");
    whoEl.textContent = showdownPick.members.map(m => m.name).join(" · ");
    line.append(nameEl, whoEl);
    readyCenter.append(line);
  }
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
  let preparedVariant = null;   // Đợt 145/146 — see prepareBeforePlay()/begin()
  // "Which content is this act set to right now", across both axes — the clue
  // set and the practice/homework half. Only used to spot a change.
  const contentKeyOf = act => `${activeVariant(act) || "-"}|${activeContentSet(act) || "-"}`;
  prepareBeforePlay();

  function prepareBeforePlay() {
    const steps = [];
    // Which content this preload is for (Đợt 145/146) — begin() compares
    // against this to notice a clue set OR a half chosen after this screen was
    // built. One string covers both axes.
    preparedVariant = contentKeyOf(libAct);

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

  // press() = instant on touch-down (core/press.js, Đợt 175). Fight's relay
  // (`btn.click()` in fight.js playPressed) still lands: press() runs the
  // handler for untrusted programmatic clicks.
  press(bigPlay, () => {
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
  });

  // ----- Timer (starts at PLAY, measured precisely) -----
  // Modes (set via the Options panel): "none" | "countUp" | "countDown".
  // Count down auto-submits the game when it reaches 0.
  let timerId = null, startedAt = 0, cleanup = () => {};
  let timeWarned = false;   // fires the "5 seconds left" hook (below) once per play
  // `tpl.hideTimerCountUp` (Đợt 92) — a game that already shows its own
  // elapsed/remaining time (Open the box's per-box clock/bar) never falls
  // back to "Count up" on a fresh act; see the same flag in options-panel.js.
  function timerMode() { return activity.options?.timer ?? (tpl.hideTimerCountUp ? "none" : "countUp"); }
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
  // ----- TIME COST (Đợt 139, teacher 13/8/2026) -----
  // "Mỗi giây TRỐNG trôi qua mà không làm gì thì mới bị trừ" — the teacher
  // replaced his own first wording ("every second on the clock") with this
  // before any of it shipped. So this is NOT a clock tax: it is an IDLE tax.
  //   • `Time cost` slider 0..100 in Options (0 = Off)
  //   • `Idle` stepper 1..5s — the grace the student gets before the FIRST
  //     charge ("cho suy nghĩ 3 giây mới bắt đầu trừ"); after that it charges
  //     once per further idle SECOND, for as long as the stall lasts.
  //   • Any real progress calls ui.noteActivity() and puts both back to zero.
  //
  // DIVISION OF LABOUR (deliberately the same as the shared "Points off"
  // option, see core/HUONG DAN CORE.md): the engine owns the clock, the
  // accumulator and the effect; the TEMPLATE owns the score number and
  // subtracts `ui.timeCostTotal()` inside its own scoreNow(). The engine never
  // invents a score of its own — that is what keeps one number, one owner.
  //
  // Opt-in per template (`tpl.timeCost`, like `fightMode`): the slider only
  // shows for templates that really subtract it (Anagram + Quiz today), so it
  // can never sit in the panel doing nothing on the other 15 games.
  //
  // ⚠️ TWO THINGS A WRONG TAP MUST NOT DO (teacher's calls, both deliberate):
  //   1. reset the idle clock — in "Letters with bonus" a wrong tap costs
  //      nothing, so if it counted as activity a student could just drum on the
  //      board forever and never pay a point. Only PROGRESS resets.
  //   2. be charged for at all while the student CAN'T act. The template says
  //      when that is, via ui.setIdleGuard(): its own animation, the wait
  //      between fight rounds, being locked out after losing a round, a word
  //      already solved, a clip still speaking. A guard that gets stuck ON just
  //      means "no charge" — the safe direction to fail in.
  let timeCostTotal = 0;        // points the idle clock has taken so far, this play
  let scoreProvider = null;     // template's own scoreNow(), via ui.setScoreProvider
  let scorePainter = null;      // template's own score-chip writer, via ui.setScorePainter (Đợt 143)
  let idleGuard = null;         // template's "the student cannot act right now", via ui.setIdleGuard
  let idleMs = 0;               // idle time accumulated since the last real action
  let idleCharges = 0;          // how many times THIS stall has already been charged
  let idleLastTick = 0;         // previous idle sample, for the delta
  let idleId = null;            // the 100ms watcher — only ever exists while the option is ON
  const costNodes = new Set();  // "-N" nodes still in the air (binned on teardown)
  function timeCostPer() {
    if (!tpl.timeCost || timerMode() === "none") return 0;
    const v = Math.round(Number(activity.options?.timeCost) || 0);
    return Math.max(0, Math.min(100, v));
  }
  function idleGraceMs() {
    const v = Math.round(Number(activity.options?.timeCostIdle) || 0);
    return Math.max(1, Math.min(5, v || 1)) * 1000;
  }
  // The student just did something real. Called by the template (see
  // ui.noteActivity) — never by the engine on raw pointer/key events: "moved
  // the mouse" is not progress, and counting it would quietly defeat the whole
  // option on a touchscreen where a stray palm keeps waking it.
  function noteActivity() { idleMs = 0; idleCharges = 0; idleLastTick = performance.now(); }
  function idleTick() {
    const per = timeCostPer();
    const now = performance.now();
    const dt = now - idleLastTick;
    idleLastTick = now;
    if (torndown || !per) return;
    // Frozen time is DISCARDED, not deferred: dt is simply dropped, so a 2.4s
    // reveal animation or a menu pause leaves the idle counter exactly where it
    // was rather than paying it all out in one lump the moment play resumes.
    // `menuEl`/`toolPanelEl` are declared further down this same closure — safe
    // to read here because idleTick can only ever run after PLAY, long after
    // the whole of startGame() has finished executing. Both mean the game is
    // covered by a dim and cannot be touched: ☰ Menu already freezes the clock
    // (Đợt 91), and an open Options/Template/Style panel blocks every tap.
    if (menuEl || toolPanelEl || (idleGuard && idleGuard())) return;
    idleMs += dt;
    const grace = idleGraceMs();
    // Charge every whole second past the grace. A `while` (not an `if`): a tab
    // that was throttled or backgrounded can hand us a dt of several seconds,
    // and the student really was idle for all of them.
    while (idleMs >= grace + idleCharges * 1000) {
      idleCharges++;
      chargeIdleSecond(per);
      if (torndown) return;
    }
  }
  function chargeIdleSecond(points) {
    timeCostTotal += points;
    // FIGHT MODE: tell the match FIRST, and through a channel of its OWN. It
    // must not go in as a score report: a team frozen by the "slower team keeps
    // nothing" rule has every score report cancelled by holdFreeze(), which
    // would swallow the deduction permanently. The teacher's call is that the
    // clock charges both teams regardless of who won the word.
    if (fight) fight.ctl.onTimeCost(fight.side, timeCostTotal);
    flyTimeCost({
      // Fight mode has no chip inside the frame — this team's number lives on
      // the strip above its board, and the one clock lives between the two.
      fromEl: fight ? fight.ctl.scoreTarget(fight.side) : scoreEl,
      toEl: fight ? fight.ctl.clockTarget() : timerEl,
      readEl: scoreEl,     // always this board's OWN chip — see flyTimeCost's doc
      points,
      target: scoreProvider,
      paint: v => (scorePainter ? scorePainter(v) : ui.setScore(v)),
      alive: () => !torndown,
      nodes: costNodes
    });
  }
  // ⚠️ GHOST CLOCK: this is a SECOND interval on top of the 500ms clock, so it
  // needs the same discipline (Đợt 112/131 — a forgotten interval kept charging
  // an invisible game). It is created ONLY when the option is really on (so a
  // game with Time cost off allocates nothing at all and behaves byte for byte
  // as before), and stopTimer() — which every teardown path already goes
  // through — is what clears it.
  function startIdleWatch() {
    if (idleId || !timeCostPer()) return;
    noteActivity();
    idleId = setInterval(idleTick, 100);
  }
  function stopIdleWatch() { if (idleId) clearInterval(idleId); idleId = null; }

  // =============================================================
  // TIME EACH ROUND (Đợt 174) — the pupil's own clock
  // =============================================================
  // DIVISION OF LABOUR, deliberately the same as Time cost's (see above): the
  // ENGINE owns the clock, the bar and the bookkeeping; the TEMPLATE owns what
  // "the pupil finished" and "the pupil ran out of time" MEAN, because only it
  // knows what an answer is. Two one-liners are all a template needs:
  //   • ui.roundDone()          "this pupil's turn is over" → the clock freezes
  //                             at that reading, and that reading is what Show
  //                             answers prints for the question
  //   • ui.setRoundTimeout(fn)  fn() = "count this round wrong, now" (count down
  //                             only). A template that never registers one
  //                             simply keeps counting past the limit rather
  //                             than doing something the engine invented.
  //
  // ⚠️ TIME IS BANKED PER ITEM, NOT PER VISIT. `roundMs[i]` accumulates, so
  // walking back with ‹ and returning adds to that pupil's total instead of
  // resetting it — the number in Show answers is "how long this question had",
  // which is the only reading that survives the teacher navigating.
  let roundIndex = -1;        // item the clock is timing (0-based), -1 = none yet
  let roundStartedAt = 0;     // performance.now() of the running segment; 0 = not running
  let roundId = null;         // the 50ms ticker — only ever exists while roundOn
  let roundOver = false;      // this round is settled (answered, or timed out)
  const roundMs = [];         // banked ms per item index
  let roundTimeUp = null;     // template's timeout handler, via ui.setRoundTimeout
  let sdPlaceTick = 0;        // Đợt 176 — throttles placeShowdownName() to every 5th tick

  // Teacher's own spec: "chỉ cần hiển thị các số 1-59, khi sang giây tiếp theo
  // mới hiển thị 1:00, 1:01" — bare seconds under a minute, m:ss from there on.
  // Deliberately NOT core/utils.js's formatTime (which always prints 0:07): a
  // round is normally under a minute, and "7" is read across a classroom faster
  // than "0:07".
  // ⭐ Đợt 176 — the number now carries HUNDREDTHS in smaller type ("30,18",
  // teacher 17/8/2026). ONLY this per-round clock: the whole-game clock next to
  // Menu keeps its plain m:ss on purpose (teacher: "đồng hồ tổng không dùng
  // dạng này"). Comma, not dot — it matches how the class reads decimals.
  function roundPaintClock(secs) {
    const v = Math.max(0, secs);
    const whole = Math.floor(v);
    const cents = Math.min(99, Math.floor((v - whole) * 100));
    const main = whole < 60 ? String(whole) : `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
    roundClockEl.textContent = main;
    roundClockEl.append(el("span", "aw-round-dec", "," + String(cents).padStart(2, "0")));
  }
  function roundLive() {
    return (roundMs[roundIndex] || 0) + (roundStartedAt ? performance.now() - roundStartedAt : 0);
  }
  /** Close the running segment into the bank. Safe to call twice. */
  function roundBank() {
    if (!roundStartedAt || roundIndex < 0) { roundStartedAt = 0; return; }
    roundMs[roundIndex] = (roundMs[roundIndex] || 0) + (performance.now() - roundStartedAt);
    roundStartedAt = 0;
  }
  function roundPaint() {
    if (!roundOn || !roundClockEl || roundIndex < 0) return;
    const secs = roundLive() / 1000;
    if (roundMode === "countUp") { roundPaintClock(secs); return; }
    const total = roundTotal();
    const left = Math.max(0, total - secs);
    // Đợt 176 — the old `ceil` ("0.4s left still reads 1") is gone with the
    // hundredths: the number now shows the REAL remainder, and "0,00" is the
    // moment the bar empties too.
    roundPaintClock(left);
    if (roundBarFill) {
      const pct = Math.max(0, Math.min(100, (left / total) * 100));
      roundBarFill.style.width = pct + "%";
      // PERCENTAGES, not Whack-a-mole's fixed 30s/10s marks: a round is usually
      // 15-30 seconds long, so a 30-second "getting close" threshold would paint
      // the whole bar orange from the first frame.
      roundBarFill.classList.toggle("is-orange", pct <= 50 && pct > 20);
      roundBarFill.classList.toggle("is-red", pct <= 20);
    }
  }
  function roundTick() {
    if (torndown || roundIndex < 0) return;
    // Đợt 176 — keep the floating name centred as its anchor moves (keyboard
    // toggled, autoFit, resize). Every 5th tick = 4×/s, layout is usually clean
    // so the rect reads are effectively free.
    if ((sdPlaceTick = (sdPlaceTick + 1) % 5) === 0) placeShowdownName();
    // FROZEN while the game is covered and cannot be played: ☰ Menu (which
    // already freezes the whole-game clock, Đợt 91) and any open tool panel.
    // Banking on the way in and restarting on the way out means a pause costs
    // the pupil nothing at all — the alternative, letting a count down run out
    // behind an Options panel the teacher opened, would mark the class wrong for
    // something they could not even see.
    if (menuEl || toolPanelEl) { roundBank(); return; }
    if (!roundStartedAt && !roundOver) roundStartedAt = performance.now();
    roundPaint();
    if (roundMode !== "countDown" || roundOver) return;
    if (roundLive() / 1000 < roundTotal()) return;
    roundOver = true;
    roundBank();
    roundPaint();
    // The template decides what "out of time" costs — see ui.setRoundTimeout.
    try { roundTimeUp?.(); } catch (e) { console.warn("AWord: round timeout handler failed", e); }
  }
  /** A new item is on screen: bank the old round, open a fresh one. */
  function roundBegin(index0) {
    if (!roundOn || torndown) return;
    const i = Math.max(0, Math.floor(Number(index0) || 0));
    if (i === roundIndex) return;      // same item (templates call setNav a lot)
    roundBank();
    roundIndex = i;
    roundOver = false;
    roundStartedAt = performance.now();
    if (roundBarFill) roundBarFill.classList.remove("is-orange", "is-red");
    roundPaint();
    placeShowdownName();   // Đợt 176 — a new item can re-lay the content out
  }
  /** The pupil's turn is over (they answered) — freeze the reading. */
  function roundDone() {
    if (!roundOn || roundOver || roundIndex < 0) return;
    roundOver = true;
    roundBank();
    roundPaint();
  }
  // 50ms, not the original 100 (Đợt 176): the clock paints hundredths now, and
  // at 10Hz the small digits visibly stutter. 20Hz is still far below rAF cost.
  function startRoundWatch() { if (roundOn && !roundId && !torndown) roundId = setInterval(roundTick, 50); }
  function stopRoundWatch() { if (roundId) clearInterval(roundId); roundId = null; }

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
      // TIME COST (Đợt 139) — the idle clock starts with the real one, never
      // before PLAY. `timerMode() === "none"` never reaches here, which is also
      // exactly when timeCostPer() returns 0.
      startIdleWatch();
    }
  }

  function begin() {
    // ⭐ Đợt 145 — RE-READ the chosen clue set at the moment play starts, not
    // when this screen was built. Options → Apply on the READY screen (before
    // Play) deliberately does NOT restart anything: it closes the panel and
    // says "the options take effect on Play". Every other option is read live
    // out of `activity.options`, so that promise held for free — but the clue
    // set is baked into `content` by the resolver, so it has to be re-baked
    // here. Caught by testing: picking VI1, Apply, Play still showed ENG1.
    // Identity for every act without clue sets, so this costs those nothing.
    activity = resolveActivity(libAct);
    // Top up the clip cache when the set changed under us — the READY gate
    // preloaded whichever one was current when it ran. Fire-and-forget on
    // purpose: it only fills core/voice-clips.js's cache, plays nothing, and a
    // slow or failed fetch must never hold up the game — the listen button
    // falls back to fetching its own clip, exactly as it did before the
    // preload gate existed (Đợt 122).
    const nowVariant = contentKeyOf(libAct);
    if (nowVariant !== preparedVariant) {
      preparedVariant = nowVariant;
      if ((activity.options || {}).contentMode !== "text") {
        const ids = [...collectVoiceIds(activity.content || {})];
        if (ids.length) preloadVoiceClips(ids).catch(() => {});
      }
    }
    startedAt = performance.now();   // baseline (kept sane even if a manual-start template never starts the clock)
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (!tpl.manualTimerStart) startTimerNow();
    // TIME EACH ROUND (Đợt 174) — started BEFORE mount(), and INDEPENDENTLY of
    // the whole-game clock: the two are different options and a teacher may well
    // run Timer = None with a per-round count down. mount() calls ui.setNav()
    // for its first item, which is what opens round 1, so the watcher has to be
    // alive by then.
    startRoundWatch();
    cleanup = tpl.mount(playArea, activity, ui) || (() => {});
  }
  // ⚠️ Also kills the TIME COST watcher (Đợt 139). Every teardown path in this
  // file already funnels through stopTimer() — cleanupAll(), the countDown
  // hitting 0, ui.finish() — so hanging the second interval off it is what
  // guarantees the idle clock can never outlive its own play (the Đợt 112/131
  // ghost-clock lesson, applied up front this time instead of after the bug).
  // ⚠️ Đợt 174 — and the ROUND watcher too, for the same reason: it is a third
  // interval, and the Đợt 112/131 ghost-clock lesson says every one of them has
  // to hang off the single teardown path everything already funnels through.
  const stopTimer = () => { if (timerId) clearInterval(timerId); timerId = null; stopIdleWatch(); stopRoundWatch(); };

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
  // ⭐ Đợt 148 — SWAP THE CONTENTS OF A BOX, smoothly: fade the old out, build
  // the new, then let the box travel to its new height while the new content
  // fades in. Used by BOTH things the teacher asked to stop flashing — going
  // Options → Template/Style/Mode (the panel box stays put and morphs) and
  // switching clue set / half inside Options (only the body below the switches
  // is rebuilt).
  // ⚠️ No `requestAnimationFrame` anywhere in here. A hidden or backgrounded
  // tab never fires it, and the box would stay pinned at its old height for
  // ever — the same class of trap as the animation-event stall that
  // closeToolPanel() already guards with a timeout.
  // ⭐ Đợt 149/151 — swap a box's contents as a DISSOLVE. The outgoing content
  // is parked in an absolutely-positioned layer BENEATH, at full opacity for
  // the whole ride; the incoming content takes the flow and fades in ABOVE it,
  // carrying the panel's background (see .aw-swap-in). Đợt 149 faded both
  // layers at once, which dipped the combined coverage mid-swap and made even
  // identical content shimmer; with an opaque base, a pixel that is the same
  // in both layers never changes at all. (Đợt 148's version was worse still:
  // it emptied the box before rebuilding — a moment with nothing in it.)
  // Must not be SHORTER than .aw-swapbox's height/width transition in app.css:
  // the pin has to outlive the travel, or the last frames run un-pinned.
  const SWAP_MS = 260;
  let swapToken = 0;
  function swapContents(box, build, done) {
    // A second swap can start while this one is still running — the teacher
    // clicking Template then Style straight away, or tapping through clue sets.
    // Every stage checks it is still the LATEST swap, so an older one's cleanup
    // can never unpin the height out from under the newer one.
    const mine = ++swapToken;
    // ⭐ Đợt 153 — MEASURE THE BOX AT REST, never mid-entrance. `.aw-tool-panel`
    // opens with a 220ms `aw-pop-cx` keyframe that starts at `scale(.9)`;
    // clicking a second tool inside that window leaves the panel scaled, and
    // every getBoundingClientRect below is scaled with it — we would pin 0.9×
    // the real target and the box would pop to full size the instant the pin
    // came off. Finishing the entrance first costs nothing (it is on its way to
    // exactly this state anyway).
    // ⚠️ @keyframes animations ONLY. A running TRANSITION on this box is the
    // PREVIOUS swap still travelling; finishing that would teleport the box to
    // the old target before we read r0, i.e. the jump we are here to remove.
    if (typeof CSSAnimation !== "undefined") {
      box.getAnimations?.().forEach(a => {
        if (a instanceof CSSAnimation) { try { a.finish(); } catch { /* ignore */ } }
      });
    }
    const r0 = box.getBoundingClientRect();
    // The compact-on-overflow watcher measures the panel on EVERY resize, and
    // an animated height resizes it every frame — each callback strips a class,
    // reads scrollHeight (a forced reflow) and puts it back. Nothing useful can
    // come of measuring a box that is mid-flight, so it sits out the swap.
    panelCompactObs?.disconnect();
    const outgoing = el("div", "aw-swap-out");
    while (box.firstChild) outgoing.append(box.firstChild);
    box.classList.add("aw-swapbox");
    const incoming = el("div", "aw-swap-in");
    build(incoming);
    box.append(outgoing, incoming);
    // ⭐⭐ Đợt 153 — NEITHER LAYER MAY BE RE-LAID-OUT WHILE THE BOX TRAVELS.
    // Đợt 152 gave the box a travelling WIDTH, and both layers were sized by
    // that width every frame: the old content re-flowed all the way down
    // (Options 560→295 measured its content 340px → 372 → 389 → 453 → 487, a
    // two-column grid collapsing into one in visible steps) and the new content
    // re-flowed all the way up. Only Options↔Template escaped, because those
    // two are the same 560px wide — exactly the teacher's report: Options↔
    // Template smooth, but "chuyển sang Styles và Fight thì cuối animation
    // xuất hiện frame thừa của một pop-up khác nảy nhanh ra".
    // So: the OUTGOING layer is pinned at the width it was laid out in — it is
    // a SNAPSHOT of what the teacher was already looking at, and the narrowing
    // box simply clips it (see .aw-swap-out).
    outgoing.style.width = r0.width + "px";
    // ⭐ Đợt 152 — measure the TARGET by letting the box take it for a moment,
    // not by measuring the incoming layer. The layer's own height MISSES the
    // box's padding: on the panel (padding 14/16, border-box) that pinned the
    // travel 30px SHORT, the content squashed and clipped, and the box then
    // popped to its true size when the pin came off — the teacher's "co pop-up
    // lại nhỏ... rồi mới hoàn thiện trong nhịp tiếp theo". Un-pinned, the box
    // sizes itself from the in-flow incoming content under its OWN padding,
    // width class and max-height — by definition the size it will settle at.
    // The outgoing layer is absolute, so it doesn't vote. Width is pinned and
    // animated for the same reason (Options↔Style really do differ in width).
    // Everything up to the setTimeout runs before a single frame is painted,
    // so the momentary un-pin is never visible.
    // ⚠️ Đợt 153 — measure under the box's RESTING rules, not the swap's. With
    // `.aw-swapbox` on, overflow is hidden, so a panel tall enough to scroll at
    // rest measures 15px too wide INSIDE (no scrollbar taken off) — pinning the
    // incoming layer to that width would make it snap 15px narrower at unwrap,
    // the very same "extra frame" in a new place (this is the 15px of Đợt 152,
    // met from the other side). The outgoing layer steps out for the reading:
    // it is absolute, so it never voted on the box's size, but with the
    // resting `overflow-y:auto` back on it WOULD add scrollable overflow and
    // conjure a scrollbar that isn't real. All of it is synchronous — no frame
    // is painted between hiding it and putting it back.
    outgoing.style.display = "none";
    box.classList.remove("aw-swapbox");
    box.style.height = ""; box.style.width = "";
    const r1 = box.getBoundingClientRect();
    const inW = incoming.getBoundingClientRect().width;   // width the new content really settles at
    box.style.height = r0.height + "px"; box.style.width = r0.width + "px";
    box.classList.add("aw-swapbox");
    outgoing.style.display = "";
    // ⭐ Đợt 153 (part two) — the INCOMING layer is laid out at its DESTINATION
    // width from the very first frame, so the content the teacher is watching
    // fade in never re-flows either: the box opens or closes AROUND finished
    // content instead of reshuffling it on the way.
    incoming.style.width = inW + "px";
    // ⭐ Đợt 153 (part three) — and its opaque background COVERS THE WHOLE BOX
    // for the whole ride. Shrinking Options (310px of content) into Style
    // (109px) left up to 201px of old content standing there uncovered at full
    // opacity, wiped away only by the closing box — while growing into Template
    // (401px) covered it from frame one, which is why only one of the two
    // directions ever looked wrong. The cover travels on the SAME curve and
    // duration as the box (see .aw-swap-in), so its bottom edge sits exactly on
    // the box's inner edge at every frame; the old content now dissolves under
    // it everywhere, exactly as it already did in the growing direction.
    // Đợt 151's rule is untouched: the outgoing layer still never fades, and a
    // pixel that is the same in both layers still never changes.
    const padV = (cs => parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom))(getComputedStyle(box));
    incoming.style.minHeight = Math.max(0, r0.height - padV) + "px";
    // One tick so the browser registers the starting opacities/size before
    // they change — the transition has nothing to run from otherwise.
    setTimeout(() => {
      if (mine !== swapToken) return;
      incoming.classList.add("is-in");   // the outgoing layer never fades — see .aw-swap-out
      box.style.height = r1.height + "px"; box.style.width = r1.width + "px";
      incoming.style.minHeight = Math.max(0, r1.height - padV) + "px";
      // ⭐ Đợt 159 (teacher, 15/8/2026: "gần cuối animation xuất hiện vài frame
      // không được mượt" — both switching tool-to-tool AND inside the Mode
      // picker) — WAIT FOR THE BOX'S OWN TRANSITION TO REALLY FINISH, don't
      // guess its duration. The old code cleaned up on a flat `setTimeout(SWAP_MS
      // + 40)`, betting the .26s height/width transition (app.css's
      // `.aw-swapbox`) always settles within 300ms of real time. Animating
      // height/width forces a full layout recalculation on every single frame
      // (unlike a transform/opacity fade, which the compositor can run on its
      // own) — so any main-thread contention right then (building the incoming
      // panel's markup, the game's own timer/sound ticking underneath the dim)
      // could make the real transition run past the guess. When it did, this
      // cleanup fired MID-transition, clearing the animated height/width and
      // deleting the class that drives it — an in-flight CSS transition
      // cancelled that way jumps straight to its end value with no further
      // easing, which reads as a rough snap in exactly the animation's last
      // frames. `transitionend` on the box (height and width share the same
      // duration and start together, so the first to land is enough) removes
      // that guess. The timeout stays as a fallback ONLY, mirroring
      // closeToolPanel()'s same guard: a hidden/backgrounded tab can stall
      // transition events entirely, and the box must not stay pinned forever.
      let fallback = null;
      const onEnd = ev => { if (ev.target === box) finish(); };
      const finish = () => {
        box.removeEventListener("transitionend", onEnd);
        clearTimeout(fallback);
        if (mine !== swapToken) return;   // a newer swap already took over the box
        outgoing.remove();
        // unwrap: the box's children become the real content again, so nothing
        // downstream ever sees the temporary layer
        while (incoming.firstChild) box.insertBefore(incoming.firstChild, incoming);
        incoming.remove();
        box.style.height = ""; box.style.width = "";
        box.classList.remove("aw-swapbox");
        done?.();
      };
      box.addEventListener("transitionend", onEnd);
      fallback = setTimeout(finish, SWAP_MS + 120);
    }, 20);
  }

  // Everything that has to happen for a set of panel contents, whether the
  // panel is brand new or is being swapped in place.
  function mountPanelContent(buildContent, host) {
    // `is-opts` (Đợt 140) gives the Options panel a stated width so its two
    // grid columns are always the same comfortable size — see app.css. Set
    // BEFORE buildContent so anything that measures itself while building
    // (an accordion reading scrollHeight) reads the final width.
    toolPanelEl.classList.toggle("is-opts", buildContent === buildOptionsPanel);
    toolPanelEl.classList.toggle("is-tpl", buildContent === buildTemplatePanel);
    // Đợt 156 — the Showdown table states its own width for the same reason
    // `is-opts` does: its body is a fixed 560px, and the panel's default
    // `max-width: 580px` (with 40px of padding inside it) would squeeze it.
    // ⚠️ Đợt 158 — the MODE PICKER is deliberately NOT in here. It briefly was
    // (the first build made it as wide as the team table, and the teacher said
    // too big): it states no width at all now and the panel sizes itself around
    // the tiles, like Style and the confirm screens do.
    toolPanelEl.classList.toggle("is-sd", buildContent === buildShowdownPanelHost);
    toolPanelEl.classList.remove("is-compact-opts");
    panelCompactObs?.disconnect(); panelCompactObs = null;
    // `host` is the cross-fade layer during a swap, the panel itself otherwise.
    buildContent(host || toolPanelEl);
  }

  // ⭐⭐ Đợt 162 (teacher, 15/8/2026: tested Đợt 161 live, still choppy in the
  // final frames — asked for a different shape entirely) — TWO BEATS instead
  // of one box morphing its own height/width. Beat 1 fades+shrinks the OLD
  // panel away; once that is genuinely done, beat 2 drops it and builds the
  // NEW panel fresh (which gets the ordinary `aw-pop-cx` entrance for free —
  // the same rise-and-scale-in every fresh-opened popover already plays).
  // Đợt 148-153 chased the single-box morph through many rounds (pin the
  // outgoing snapshot's width, pin the incoming layer's width, cover it with
  // an opaque layer, wait for the real transitionend instead of a guessed
  // timeout…) because animating a box's actual `height`/`width` forces the
  // browser to redo LAYOUT on every frame — the one CSS property pairing a
  // GPU compositor can't run on its own. Two fades of `opacity`/`transform`
  // are exactly what the compositor CAN run independently of the main
  // thread, so this sidesteps the whole class of jank rather than tuning it
  // further. `toolDim` (the screen-dimming backdrop) is deliberately touched
  // by NEITHER beat — removing/re-adding it is what the very first version of
  // this popover (Đợt 148, before the morph existed) did, and it was the dim
  // flickering off and back on that read as a flash; staying up the whole
  // two-beat ride keeps the game underneath dark throughout, exactly as the
  // teacher asked when requesting this shape.
  // `btn` is omitted by switchToolPanel() (Đợt 158's mode-picker navigation):
  // that call is switching CONTENT under the SAME already-lit Mode button,
  // not switching WHICH button is lit, so activeToolBtn is left alone.
  function twoBeatPanelSwap(buildContent, btn) {
    const mine = ++swapToken;
    const oldPanel = toolPanelEl;
    panelCompactObs?.disconnect(); panelCompactObs = null;
    const openNew = () => {
      if (mine !== swapToken) return;   // a newer switch already took over
      oldPanel?.remove();
      toolPanelEl = el("div", "aw-tool-panel");
      mountPanelContent(buildContent);
      belowCenter.append(toolPanelEl);
      capPanelHeight(buildContent);
      if (btn) {
        activeToolBtn?.classList.remove("is-active");
        btn.classList.add("is-active");
        activeToolBtn = btn;
      }
    };
    if (!oldPanel) { openNew(); return; }   // nothing was open — straight to beat 2
    // Mirrors closeToolPanel()'s own exit fade (same keyframes, same
    // centering-safe `translateX(-50%)` on every stop) — WAAPI, not the CSS
    // `aw-pop-cx` class, for the same reason closeToolPanel uses WAAPI: it
    // needs a real finish signal to chain beat 2 off of.
    const fadeOpts = { duration: 150, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" };
    const exit = oldPanel.animate(
      [{ opacity: 1, transform: "translateX(-50%) translateY(0) scale(1)" },
       { opacity: 0, transform: "translateX(-50%) translateY(6px) scale(.94)" }],
      fadeOpts
    );
    let started = false;
    const startBeat2 = () => { if (started) return; started = true; openNew(); };
    exit.onfinish = startBeat2;
    setTimeout(startBeat2, 150 + 60);   // fallback — a hidden/backgrounded tab can stall the finish event
  }

  function openToolPanel(btn, buildContent) {
    if (activeToolBtn === btn) { closeToolPanel(true); return; }   // clicking the open one again closes it
    sound.click();
    if (toolPanelEl && activeToolBtn) { twoBeatPanelSwap(buildContent, btn); return; }
    closeToolPanel(false);
    toolDim = el("div", "aw-tool-dim");
    toolDim.onclick = () => closeToolPanel(true);
    document.body.append(toolDim);
    toolPanelEl = el("div", "aw-tool-panel");
    mountPanelContent(buildContent);
    belowCenter.append(toolPanelEl);
    capPanelHeight(buildContent);
    btn.classList.add("is-active");
    activeToolBtn = btn;
    setTimeout(() => document.addEventListener("pointerdown", onToolOutside), 0);
  }

  // Đợt 158 — swap the OPEN panel to DIFFERENT CONTENT without changing which
  // button is active. `openToolPanel` cannot do this: called with the button that
  // is already active it CLOSES the panel, because that is the "tap the open
  // button again" gesture. The mode picker needs it, since one button now leads
  // to three different screens (picker → confirm → back to picker, or picker →
  // the Showdown table). Đợt 162 — now the same two-beat swap as tool-to-tool
  // switching, for the same reason (see twoBeatPanelSwap above).
  function switchToolPanel(buildContent) {
    if (!toolPanelEl) return;   // teacher dismissed the popover mid-tap
    twoBeatPanelSwap(buildContent);
  }

  function capPanelHeight(buildContent) {
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
  }

  optionsBtn.onclick = () => openToolPanel(optionsBtn, buildOptionsPanel);
  templateBtn.onclick = () => openToolPanel(templateBtn, buildTemplatePanel);
  styleBtn.onclick = () => openToolPanel(styleBtn, buildStylePanel);

  // "Which sub-acts does this act have, and which one is lit up" — the input the
  // Options panel's TEXT|VOICE row is built from.
  // (Đợt 155 lifted this out of buildOptionsPanel so the Showdown table could
  // draw the same row; Đợt 156 took that row back OUT of Showdown at the
  // teacher's request, so Options is once again the only caller. Left as its own
  // function because it is the whole of one idea, not because it is shared.)
  // `src`, not `libAct`: on a CONVERTED act the clue sets live on the origin —
  // see subActSource(). For every act that is not converted, and for the whole
  // pre-Đợt-145 library, `src === libAct` and this is byte-for-byte Đợt 154's.
  // ⚠️ Reads `selState` (the panel's stable selector object), never a draft: the
  // row is built once and outlives every re-render (Đợt 149).
  // ⚠️ Returns null unless the act really has clue sets or real clips — an act
  // with neither gets no row at all, not a dead one (the OPT-IN rule of Đợt 143).
  function makeContentSwitch(selState) {
    const src = subActSource();
    const variants = variantsOf(src.content);
    if (!variants && !hasAnyVoice(src.content || {})) return null;
    return {
      shown: selState.contentMode || (hasHiddenText(src.content) ? "voice" : "text"),
      variants,
      voiceVariants: voiceVariantsOf(src.content),
      labelOf: key => variantLabel(src.content, key),
      variant: selState.contentVariant || activeVariant({ ...src, options: { ...selState, contentMode: "text" } }),
      voiceVariant: selState.voiceVariant || activeVariant({ ...src, options: { ...selState, contentMode: "voice" } })
    };
  }

  // ⭐⭐ THE SUB-ACT HALF OF "APPLY" (lifted out of the Options panel in Đợt 155).
  //
  // ON A CONVERTED ACT THE SUB-ACT CANNOT SIMPLY BE STORED. Every other option
  // is read at play time, so writing it into `activity.options` is enough. This
  // one is not: convert.js BAKED one clue set (its text AND its clips) into the
  // temp act's content at conversion time. Storing "now it's VI1" on an act
  // whose content is already ENG1 changes nothing on screen — the row would move
  // and the game would not, which is worse than not offering the row at all. So
  // the choice is written onto the ORIGIN (the act convert.js reads) and the
  // conversion is rebuilt from there.
  //
  // Comparing VIEW KEYS rather than raw keys means an Apply that didn't touch
  // the sub-act never pays for a rebuild, and a first-ever Apply (nothing stored
  // yet, so the act is on its default set) doesn't count as a change.
  // `viewKeyOf` is null for an act with neither clue sets nor halves — i.e. the
  // entire pre-Đợt-145 library — so both sides are null and this never fires.
  //
  // @returns {boolean} TRUE when it has TAKEN OVER the restart. The caller must
  //          then do nothing else: a second restart on top of doSwitchTemplate()
  //          would race the conversion it just started.
  function applySubActSelection(selState) {
    // subActSource() only hands back the origin for an act converted FROM it, so
    // this inequality IS the converted case.
    const convSrc = subActSource();
    if (convSrc === libAct) return false;
    const beforeKey = viewKeyOf(convSrc);
    const afterKey = viewKeyOf({ ...convSrc, options: { ...(convSrc.options || {}), ...selState } });
    if (beforeKey === afterKey) return false;
    if (!convSrc.options) convSrc.options = {};
    VIEW_SELECTOR_KEYS.forEach(k => { if (selState[k] !== undefined) convSrc.options[k] = selState[k]; });
    closeToolPanel(false);
    doSwitchTemplate(activity.type);   // re-converts from the origin, then restarts
    return true;
  }

  // ----- SHOWDOWN panel (Đợt 155) -----
  // A thin host: the head is drawn at once and the real table arrives when
  // core/showdown-setup.js has loaded (dynamic import — it reaches Firestore and
  // core/classes.js, which the student page must never download).
  function buildShowdownPanelHost(panel) {
    // ⭐ Đợt 159 — this head is a PLACEHOLDER only. The table draws its own head
    // row (title + the Reset / Single-mode icons the teacher moved up there), so
    // both of these come out again the moment the real panel is built. Drawing
    // one here anyway means the popover never opens as a bare 'Loading…' box.
    const head = el("div", "aw-tool-panel-head", "Showdown");
    const loading = el("div", "aw-sd-loading", "Loading...");
    panel.append(head, loading);
    import("./showdown-setup.js").then(mod => {
      // ⛔⛔ Đợt 158 — `panel.isConnected` WOULD BE THE WRONG TEST HERE, and this
      // is the very trap HUONG DAN CORE.md records from Đợt 156, met on a new
      // path. Opened over an existing panel, `panel` is the temporary
      // `.aw-swap-in` layer that swapContents REMOVES at SWAP_MS + 40 = 300ms,
      // after moving its children into the real box. An import slower than that
      // would come back, see a "closed" panel, and leave 'Loading…' on screen
      // for ever — while the popover the teacher is looking at is perfectly
      // alive. Đợt 158 made this the NORMAL route (the mode picker always swaps
      // into this panel), so what used to need a cold cache AND a slow network
      // now only needs the slow network.
      //   `loading` is a child WE made, so the swap carries it along: it is
      // connected exactly while this panel's UI is on screen. And the thing to
      // build into is its live PARENT — after the unwrap that is the real box,
      // not `panel`.
      if (!loading.isConnected) return;
      const host = loading.parentNode;
      loading.remove();
      head.remove();
      mod.buildShowdownPanel(host, {
        currentTeam: showdownPick,
        toast,
        // ⭐ Đợt 156 — the panel no longer carries the TEXT/VOICE row (teacher:
        // the pop-up holds only the class and the number of teams). Content is
        // chosen in Options, and an Options > Apply while Showdown is running
        // keeps it running: Apply ends in replayCurrent(), which re-enters
        // startGame(), which re-reads the pick. Nothing had to be added for
        // that — but it IS the behaviour the teacher asked for, so it is worth
        // knowing that moving Apply off replayCurrent() would break it.
        onApply(/* pick */) {
          // The panel already wrote the pick into sessionStorage, so the restart
          // re-reads it at the top of startGame() and the play comes back
          // wearing the new team. Nothing here pokes `showdownPick`: the one
          // that matters is the one the NEXT mount reads, and pretending
          // otherwise is how a second source of truth starts.
          closeToolPanel(false);
          replayCurrent();
        },
        onTurnOff() {
          // clearPick() already ran in the panel; replaying re-reads an empty
          // pick and the board comes back as an ordinary single play.
          closeToolPanel(false);
          replayCurrent();
        }
      });
      // The table is taller than the head-plus-spinner it replaced, so the cap
      // has to be recomputed or the panel keeps the height it opened at.
      // ⚠️ Same correction as the liveness test above: `toolPanelEl === panel`
      // is false whenever this arrived through a swap, so the cap was silently
      // skipped on exactly the path Đợt 158 made normal. Ask whether the open
      // panel CONTAINS what we just built instead.
      if (toolPanelEl && toolPanelEl.contains(host)) capPanelHeight(buildShowdownPanelHost);
    }).catch(e => {
      console.warn("AWord: showdown setup failed to load", e);
      loading.textContent = "Could not open Showdown.";
    });
  }

  // ----- OPTIONS panel: real controls, DRAFT model -----
  // Edits go into a local `draft` copy first. Nothing is saved to
  // activity.options until "Apply" is pressed; clicking outside (or
  // switching to another tool) without pressing Apply discards the draft.
  //
  // Đợt 143 — the panel's whole BODY moved to core/options-panel.js. It is now
  // built by the SAME function that builds Settings > "Default activity
  // options", which until this đợt had a hand-written quiz-shaped form of its
  // own (a Timer <select>, a Letters <select>, three checkboxes — for all 17
  // games). Two builders cannot stay identical by discipline; one can.
  // What stays HERE is everything this caller owns and Settings does not: the
  // draft model, Apply, fight mode, and persisting into the teacher's library.
  function buildOptionsPanel(panel) {
    // ⭐⭐ Đợt 173 — `fight.ctl.matchOptions()`, NOT `activity.options`, while
    // fighting. `activity` in THIS closure is board 0's own FROZEN copy
    // (core/fight.js's `actFor`), which deliberately forces
    // `shuffleQuestions:false` so the template's own shuffle check doesn't
    // re-shuffle a word order the match already fixed once for both boards —
    // exactly right for what the template reads, but wrong for what the panel
    // should show, since it made the checkbox draw unchecked every single time
    // the panel opened during a fight (teacher, 15/8/2026: "apply rồi mở lại
    // thì đã mất rồi"). `matchOptions()` returns the match's REAL, un-frozen
    // options object — the same one `fight.ctl.applyOptions()` writes onto and
    // saves — so the draft this panel seeds from now matches what Apply
    // actually persists.
    const base = (fight ? fight.ctl.matchOptions() : activity.options) || {};
    let draft = { ...base };
    // ⭐⭐ Đợt 154 — WHERE THE SUB-ACTS LIVE WHEN THE TEMPLATE HAS BEEN CHANGED.
    // A "Change template" act is a CONVERSION, and convert.js resolves the act
    // down to one clue set before converting — so the temp act on screen has no
    // `variants` and no halves at all. That is why picking any game other than
    // the act's own used to hide the Text/Voice row AND the sub-act list
    // (teacher, 14/8/2026: "với act tích hợp, khi chọn các template khác ngoài
    // ANAGRAM, cho phép chọn các lựa chọn TEXT-VOICE và các act con").
    // The choice belongs to the ORIGIN act, so the panel reads it from there —
    // and Apply rebuilds the conversion from the origin (see subActSource /
    // the re-convert branch in Apply).
    const src = subActSource();
    const selSrc = src === libAct ? base : (src.options || {});

    // ⭐ Đợt 147 — ONE SET OF OPTIONS PER VIEW. Picking ENG2, or VI1, or the
    // homework half, now also swaps every other control in this panel to that
    // view's own settings (teacher, 14/8/2026 — reading Vietnamese clues is a
    // different exercise from listening to English ones, and wants its own
    // clock, lives and penalties). `viewKeyOf` is null for an act with neither
    // clue sets nor halves, i.e. the entire library before Đợt 145, and then
    // every line below is inert and this panel behaves exactly as it did.
    let curKey = viewKeyOf(libAct);
    // Edits per view, held until Apply — so switching away and back inside one
    // sitting does not lose what was typed, and closing without Apply still
    // discards ALL of it (the draft rule this panel has always had).
    const pending = {};
    if (curKey) pending[curKey] = draft;
    // A view being visited for the FIRST time starts from the Settings
    // defaults (teacher's choice). Loaded up front so the switch itself never
    // has to wait; if it somehow has not arrived, the fallback is to carry the
    // current settings over, which is the least surprising thing to do.
    let settingsMod = null;
    if (curKey) import("./settings.js").then(m => { settingsMod = m; }).catch(() => {});

    // ⭐ Đợt 149 — the Content rows live in their OWN host, built once and left
    // alone; only `bodyHost` is rebuilt when the view changes. Teacher: "chuyển
    // giữa TEXT-VOICE và chuyển qua lại giữa các con của chúng rất giật" —
    // measured, those rows were inside the part being rebuilt, so the button
    // under their finger was destroyed and recreated on every tap.
    // Because those rows are never rebuilt they would keep writing into the
    // FIRST draft for ever, so their choice goes into `selState` instead: one
    // stable object, merged into whichever draft is current.
    const selState = {};
    // Đợt 154 — seeded from the act that OWNS the sub-acts. On a converted act
    // `base` can still carry a stale `contentVariant` (remembered per template
    // in originAct.templateOptions), and it means nothing there: that act's
    // content was baked from ONE set already. The origin's options are the only
    // record of which one the teacher is actually on.
    VIEW_SELECTOR_KEYS.forEach(k => { if (selSrc[k] !== undefined) selState[k] = selSrc[k]; });
    const switchHost = el("div", "aw-opt-switches");
    const bodyHost = el("div", "aw-opt-bodyhost");
    panel.append(switchHost, bodyHost);
    let switchesBuilt = false;
    renderBody();

    function onViewChange() {
      const nextKey = viewKeyOf({ ...libAct, options: { ...draft, ...selState } });
      if (!nextKey || nextKey === curKey) return;
      pending[curKey] = draft;                       // park the view we are leaving
      const seed = pending[nextKey] || optionsForView(libAct, nextKey)
        || (settingsMod ? settingsMod.getDefaultOptions(libAct.type) : draft);
      draft = { ...splitViewOptions(seed).view, ...selState };
      curKey = nextKey;
      pending[curKey] = draft;
      // Đợt 148 (teacher: "mọi lựa chọn (cả text-voice hay các act con) cũng
      // cần hiệu ứng animation mượt") — the body carries a different set of
      // values now, so it fades across and the panel travels to its new height
      // instead of snapping.
      // The done-callback re-arms the compact watcher swapContents stood down
      // (Đợt 150 — before this, only tool-to-tool swaps re-armed it, so the
      // first view change left the panel unwatched for the rest of the sitting).
      swapContents(bodyHost, buildBody, () => { if (toolPanelEl) capPanelHeight(buildOptionsPanel); });
    }

    function renderBody() {
      bodyHost.innerHTML = "";
      buildBody(bodyHost);
    }

    function buildBody(host) {

    // CONTENT (Text / Voice) — only for acts that actually carry spoken clips.
    // An act saved BEFORE this option existed has no contentMode, and its items
    // may be mixed (some hideText, some not). We show the nearest of the two
    // buttons but DON'T write it into the draft — leaving contentMode unset
    // keeps the per-item AUTO behaviour byte-for-byte until the teacher really
    // picks one. (Settings passes a switch too, since there it IS a default.)
    // ⭐ Đợt 145 — read the LIBRARY act here, not the resolved one: the clue
    // sets and every variant's clips live on it, and the panel is where the
    // teacher picks between them. A variant act always shows the switch (even
    // before any voice is generated) because the right-hand half of the row —
    // the list of clue sets — is the reason the row exists.
    // ⭐ Đợt 154 — `src`, not `libAct`: on a converted act the clue sets live on
    // the origin (see subActSource). For every act that is NOT converted, and
    // for the whole pre-Đợt-145 library, `src === libAct` and every line here is
    // byte-for-byte what it was.
    // ⭐ Đợt 155 — assembled by makeContentSwitch() further down, because the
    // SHOWDOWN table shows the very same row and must describe the act with the
    // same words. Two descriptions of one act is how the two panels would start
    // lighting up different buttons for it.
    const contentSwitch = makeContentSwitch(selState);
    // ⭐ Đợt 146 — the PRACTICE/HOMEWORK row, above the Text/Voice one. It is
    // about WHICH CONTENT is played and nothing else; the options a class gets
    // when the act is assigned are decided at assignment time (teacher: "rời
    // nhau — HAI công tắc"). Null for every act without a second half, which
    // hides the row entirely.
    const sets = contentSetsOf(src.content);
    const contentSetSwitch = sets
      ? {
          sets,
          labelOf: key => setLabel(src.content, key),
          current: selState.contentSet || activeContentSet(src)
        }
      : null;
      buildOptionsBody(host, {
        tpl, draft, contentSwitch, contentSetSwitch, fight, onViewChange,
        switchHost, selectors: selState, renderSwitches: !switchesBuilt,
        // ⭐ Đợt 174 — "Time each round" is built only while a Showdown is
        // actually running, the same way the Fight rows above are built only
        // during a match: outside Showdown nobody owns a round, so the control
        // would be the dead button the OPT-IN rule of Đợt 143 exists to prevent.
        showdown: !!showdownPick
      });
      switchesBuilt = true;
    }

    // APPLY — only now does the draft get written into activity.options.
    // Clicking outside without pressing this discards every change above.
    const applyWrap = el("div", "aw-opt-apply-wrap");
    const applyBtn = el("button", "aw-btn aw-btn-primary aw-opt-apply", "Apply");
    applyBtn.type = "button";
    applyBtn.onclick = () => {
      sound.click();
      if (!activity.options) activity.options = {};
      // Đợt 149 — the Content rows write into `selState`, which is merged back
      // in here. Doing it at Apply (rather than on every tap) also covers the
      // act that has a Text/Voice switch but NO clue sets: its taps change no
      // view key, so onViewChange never runs and this is the only place the
      // choice could arrive from.
      draft = { ...draft, ...selState };
      // Đợt 147 — write back EVERY view touched in this sitting, not just the
      // one on screen, and make the act's effective options exactly this
      // view's. The keys are REMOVED rather than merged over: a view seeded
      // from the Settings defaults may simply not have a key the previous view
      // had, and a leftover `lives: 3` from a view the teacher is no longer
      // looking at is a setting nothing on screen explains.
      // ⚠️ `activity.options` must be MUTATED, never replaced — libAct, the
      // mistakes act and the fight boards all hold the same object.
      if (curKey) {
        pending[curKey] = draft;
        Object.entries(pending).forEach(([k, o]) => storeViewOptions(libAct, k, o));
        Object.keys(activity.options).forEach(k => { if (!(k in draft)) delete activity.options[k]; });
      }
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
        // `libAct` (Đợt 145) — saving the resolved copy would write an act with
        // its other clue sets stripped out back over the real one.
        const realAct = activity._mistakes ? (activity._mistakesBase || originAct) : libAct;
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
      // Đợt 154's converted-act rebuild — moved into applySubActSelection() in
      // Đợt 155 so the Showdown table, which offers the same choice, goes
      // through exactly the same path. It returns true when it has taken the
      // restart over, and then there is nothing left for this Apply to do.
      if (applySubActSelection(selState)) return;
      // Applying ANY option restarts the current game so it always runs under
      // the new settings (teacher's call, 1/8/2026 — every template). If the
      // game hasn't started yet (Play overlay still up), there's nothing to
      // restart — just apply and close; the options take effect on Play.
      const playing = !playOverlay.isConnected;
      if (playing) { closeToolPanel(false); replayCurrent(); return; }
      // ⭐⭐ Đợt 174 — ONE EXCEPTION to "nothing restarts on the READY screen",
      // and it was a real hole found by testing rather than a precaution.
      // "Take effect on Play" holds for every option the game READS as it runs.
      // `roundTimer` is not one: the engine reads it ONCE, at mount, because it
      // decides where the pupil's name, the whole-game clock and the count-down
      // bar physically live — and all of that chrome was built before this
      // READY screen appeared. Applying it here used to leave the old layout AND
      // a `roundMode` captured as "none", so pressing Play gave no round clock
      // at all, with nothing on screen saying why. Rebuilding lands back on this
      // same READY screen, so the only thing the teacher sees is the layout
      // catching up with what they just chose.
      // (Only the MODE: the count-down's length is read live by roundTotal(),
      // so changing the seconds alone never needs this.)
      if (showdownPick) {
        const nextMode = ["countUp", "countDown"].includes(activity.options?.roundTimer)
          ? activity.options.roundTimer : "none";
        if (nextMode !== roundMode) { closeToolPanel(false); replayCurrent(); return; }
      }
      // Đợt 154 — still on the READY screen: nothing restarts, so the title has
      // to be told that the sub-act under it may have just changed.
      refreshReadyTitle();
      toast("Options applied");
      closeToolPanel(true);
    };
    applyWrap.append(applyBtn);
    panel.append(applyWrap);
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
      // Đợt 148 — icon + name, so a 560px-wide picker reads as a list of games
      // rather than two columns of stranded words (teacher's request).
      const item = el("div", "aw-tpl-item" + cls);
      item.append(el("span", "aw-tpl-icon", templateIcon(icons, t.type)),
                  el("span", "aw-tpl-name", escapeText(t.label)));
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
    const target = activity._mistakes ? activity._mistakesBase : libAct;
    startGame(root, target, { onExit, session, base: originAct });
  }

  // Replay whatever is loaded RIGHT NOW, mistakes round included. Used by
  // Options → Apply, which restarts only so the new settings take effect: it
  // must not double as the way out of a mistakes round (the teacher nudging
  // the timer mid-practice would silently get the whole word list back).
  function replayCurrent() {
    cleanupAll();
    if (fight) { fight.ctl.restartMatch(); return; }   // same reason as restart() above
    // `libAct`, not the resolved copy — replaying is exactly when a just-applied
    // change of clue set has to be re-resolved (Đợt 145). A mistakes round is
    // already a cut-down plain act, so it replays itself.
    startGame(root, activity._mistakes ? activity : libAct, { onExit, session, base: originAct });
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
  // ⚠️ The `costNodes` sweep (Đợt 139) is the same rule every template with a
  // fly effect already follows: those "-N" divs live on document.body, NOT
  // inside `root`, so nothing removes them when the play's DOM goes — leaving
  // the game mid-flight would strand one hanging over the next screen.
  function cleanupAll() {
    if (torndown) return;
    torndown = true;
    closeMenu(); stopTimer(); closeToolPanel(false);
    costNodes.forEach(n => n.remove()); costNodes.clear();
    cleanup();
  }

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
    // ----- TIME COST (Đợt 139) — three one-liners a template opts in with.
    // Nothing here is required: a template that ignores all three behaves
    // exactly as it did before this option existed.
    //  • timeCostTotal()      subtract it in your own scoreNow()
    //  • noteActivity()       "the student just made real PROGRESS" (not: tapped
    //                         anything — a refused/wrong tap must NOT reset it)
    //  • setIdleGuard(fn)     fn() === true while the student CANNOT act
    //  • setScoreProvider(fn) fn() === your authoritative score right now, so
    //                         the count-down animates to the real number instead
    //                         of doing arithmetic on whatever the chip shows
    //                         (which may be mid-flight from your own effect)
    timeCostTotal: () => timeCostTotal,
    noteActivity,
    setIdleGuard(fn) { idleGuard = typeof fn === "function" ? fn : null; },
    setScoreProvider(fn) { scoreProvider = typeof fn === "function" ? fn : null; },
    // Đợt 143 — a template that DRAWS ITS OWN score chip supplies the painter
    // the Time cost count-down should use. Crossword and Type the answer write
    // `ui.scoreEl.innerHTML` themselves ("7 / 20", coloured by sign) instead of
    // calling ui.setScore(); without this the count-down would have replaced
    // their whole chip with a bare number, one frame at a time, and left it that
    // way — the "số đổi mà màu không đổi" trap from core/HUONG DAN CORE.md, in a
    // louder form. Unset = ui.setScore, which is right for every other template.
    setScorePainter(fn) { scorePainter = typeof fn === "function" ? fn : null; },
    // ----- TIME EACH ROUND (Đợt 174) — see the block above startTimerNow().
    // All three are no-ops outside Showdown / with the option off, so a template
    // wires them once and never has to ask which mode it is in.
    //  • roundTimerMode()      "none" | "countUp" | "countDown"
    //  • roundDone()           the pupil's turn is over → freeze their reading
    //  • setRoundTimeout(fn)   fn() = "out of time: count this round wrong"
    roundTimerMode: () => roundMode,
    roundDone,
    setRoundTimeout(fn) { roundTimeUp = typeof fn === "function" ? fn : null; },
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
      // SHOWDOWN (Đợt 155) — the one place the engine learns which item is on
      // screen, including when the teacher walks back with ‹ ›, so the name
      // follows the question rather than counting turns of its own. Guarded on
      // the type because a template may send `label` instead of an index (Find
      // the match) — none of those opt into Showdown today, but a counter that
      // silently jumps to NaN would be a horrible way to find that out.
      if (typeof index === "number") paintShowdownName(index - 1);
      // TIME EACH ROUND (Đợt 174) — the round opens HERE, at the swap, not at
      // ui.itemChanging above it: itemChanging fires when the OLD item starts
      // fading out (130ms early in Quiz), and a clock that starts before the
      // question is readable charges the pupil for the animation. Same index,
      // same source of truth as the name — roundBegin() ignores a repeat, which
      // matters because templates call setNav on every state change, not only
      // when they move.
      if (typeof index === "number") roundBegin(index - 1);
      wireNav(navPrev, onPrev);
      wireNav(navNext, onNext);
      navNext.innerHTML = nextLabel ? nextLabel : icons.next;
      navNext.classList.toggle("is-finish", !!nextLabel);
    },
    /**
     * ⭐ Đợt 159 — "I am ABOUT to move to item `index0`, and here is how long my
     * own out/in take." Optional, and additive: a template that never calls it
     * behaves exactly as before (the name then changes instantly at setNav).
     *
     * It exists because setNav arrives too LATE to move with the question. Quiz
     * fades its question out over 130ms, swaps, then fades in over 190ms — and
     * setNav is called at the swap, i.e. 130ms after the motion the teacher sees
     * begins. Told beforehand, the engine starts the name's fall in the same
     * frame as the question's, using the template's own numbers.
     *
     * ⚠️ `index0` is ZERO-BASED here, unlike setNav's 1-based `index`. Every
     * template's internal `index` already is.
     */
    itemChanging(index0, { outMs, inMs } = {}) {
      if (typeof index0 === "number") paintShowdownName(index0, { outMs, inMs });
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
      // SHOWDOWN (Đợt 155) — tag each row with the pupil whose turn it was, so
      // the review can be grouped by name. Done HERE, once, rather than inside
      // the review renderer: core/mistakes.js reads these same rows, and a
      // "Start with mistakes" round should carry the names of who got them
      // wrong. Templates were not asked to record any of this — the rotation is
      // a pure function of the item's index (see core/showdown.js).
      if (showdownPick) stampReview(reviewData, showdownPick.members);
      // ⭐ Đợt 174 — and how long each of those turns took, when the per-round
      // clock was running (teacher: "từng lượt làm của học sinh sẽ được đếm và
      // ghi vào kết quả trong show answers"). Written the same way and for the
      // same reason as the names above: `roundMs` is indexed by item, exactly
      // like `review`, so this is a merge and not a second measurement. The last
      // round is still open at this point — bank it first or the question the
      // game ended on would be the only one with no time against it.
      if (roundOn) {
        roundBank();
        reviewData.forEach((r, i) => { if (roundMs[i] != null) r.roundMs = Math.round(roundMs[i]); });
      }
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
    // ⭐ Đợt 174c (teacher) — the header says WHOSE result this is:
    // "SHOWDOWN - B2A / TEAM 1". It used to be the bare word SHOWDOWN with the
    // class nowhere and the team on a second header line inside the list; on a
    // projector, a screenshot of the results then had nothing on it naming the
    // class. `escapeText`: both halves are names the teacher typed.
    const rvTitle = showdownPick
      ? "SHOWDOWN" + (showdownPick.className ? ` - ${showdownPick.className}` : "") +
        ` / ${String(showdownPick.teamName || "Team").toUpperCase()}`
      : "ANSWERS";
    head.append(el("div", "aw-rv-title", escapeText(rvTitle)));
    // The team's score moves up here with it (it was the right-hand half of the
    // header line that has just been removed from core/showdown.js).
    if (showdownPick) {
      const right = reviewData.filter(r => r.answered && r.yourCorrect).length;
      head.append(el("div", "aw-rv-sdtotal", `${right}/${reviewData.length}`));
    }
    const closeBtn = iconBtn("aw-rv-close", icons.close, "Close");
    closeBtn.onclick = () => { rv.remove(); showSummary(result, entryId); };
    head.append(closeBtn);
    rv.append(head);

    // ⭐ SHOWDOWN (Đợt 155) — a flat list of questions says nothing about WHO
    // answered what, which is the one thing this mode exists to record. The
    // Showdown review groups the same rows by pupil, in the team's own order,
    // and shows only the team this browser played (teacher, 14/8/2026: "Kết quả
    // chỉ show đội được chọn đó") — no other team was ever on this screen, so
    // there is nothing else in memory to show.
    if (showdownPick) {
      buildShowdownReview(rv, {
        members: showdownPick.members,
        teamName: showdownPick.teamName,
        review: reviewData
      });
      inner.append(rv);
      return;
    }

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
