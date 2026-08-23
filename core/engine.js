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

import { getTemplate, hasTemplate, ensureTemplate, cssImageUrls, preloadImages } from "./registry.js";
import { whenAllPacksPrimed } from "./sfx.js";
import { collectVoiceIds, preloadVoiceClips } from "./voice-clips.js";
import { hasAnyVoice, hasHiddenText } from "./voice-playback.js";
import {
  resolveActivity, variantsOf, voiceVariantsOf, variantLabel, activeVariant,
  contentSetsOf, activeContentSet, setLabel,
  viewKeyOf, splitViewOptions, optionsForView, storeViewOptions, VIEW_SELECTOR_KEYS
} from "./content-view.js";
import { switchTargets, convertActivity, toRecords } from "./convert.js";
import { computeResult } from "./scoring.js";
import { buildMistakesActivity, pickMistakes, minItemsFor } from "./mistakes.js";
import { buildStage } from "./layout.js";
import { formatTime, el, ordinal, fmtSecsParts } from "./utils.js";
import { press, tapOrHold } from "./press.js";
import { icons } from "./icons.js";

// ⭐ Đợt 192, revised Đợt 228 — games that never offer "change template". Read
// by `templateSwitchAvailable` (see where it is computed, and where
// buildOptionsPanel's footer button reads it) to decide whether that button
// offers the game picker (tap) + Style (hold), or is Style outright. Both
// games print their sheet from their own setup screen and are a fixed lesson
// shape, so switching template out from under them was never on offer.
// ⚠ MODULE SCOPE ON PURPOSE. Declared inside startGame() next to RUN_ORDER it
// sat ~35 lines BELOW the button that reads it, and `const` is not hoisted: every
// mount threw "Cannot access before initialization" and took the whole toolbar
// with it. A constant used near the top of a long function does not belong
// halfway down it.
const NO_TEMPLATE_TYPES = new Set(["running_word", "running_team"]);

// ⭐⭐ Đợt 216 (thầy, 20/8/2026) — HOW LONG THE GAME IGNORES TAPS AFTER START.
// The teacher plays on an infrared touch panel and START fires at pointerDOWN
// (press(), Đợt 175), so the game surface used to become live under a finger
// that was still on its way down for a second tap: "một số pha vừa bấm start
// xong bấm nhầm ngay nội dung bên dưới".
// ⚠️ 500ms IS A CHOSEN NUMBER, not a round one: the READY overlay fades out over
// 260ms, so anything at or under that would leave no guard at all once the fade
// is done — the shield has to outlast what the eye is watching. The teacher
// picked 0,5s out of 0,3 / 0,5 / 0,8 / 1,0.
const START_GUARD_MS = 500;
import { sound } from "./sound.js";
import { confettiBurst } from "./confetti.js";
import { addEntry, getEntries, getRank, updateName } from "./leaderboard.js";
// SHOWDOWN (Đợt 155) — this import is SAFE to take statically: core/showdown.js
// is deliberately pure (sessionStorage + the turn rule + the review renderer, no
// Firestore, no library). Everything that talks to Firestore lives in
// core/showdown-setup.js, which is `await import`-ed from the teacher's button
// only — same discipline as fight.js and store.js below.
import { readPick, clearPick, memberAt, stampReview, groupByMember, readPendingResult, SOLO_TEAM_ID, browserId, dealQuestions, SD_FREE_CAP, formatActDisplayName } from "./showdown.js";
// The Showdown "Show answers" screen. Static like the line above and for the
// same reason — it is DOM only, with no Firestore and no library layer; the one
// thing it needs from the network arrives as the `loadTeams` callback below.
import { mountShowdownReview } from "./showdown-review.js";
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

// ⭐ Đợt 228 — the same one-shot handover, for picking a new game from INSIDE
// the Options panel's inline Template picker. That switch tears the whole
// mount down (doSwitchTemplate() ends in cleanupAll()+startGame()), so this is
// how the fresh mount knows to open its OWN Options panel right away instead
// of quietly landing on the READY screen — thầy, 22/8/2026: "chọn Template
// xong thì Options không đóng mà chuyển sang options của template mới".
let openOptionsOnMount = false;

// Đợt 190 — the longest a RUNNING-mode entry may be and still count as a "word".
// 24 characters clears the longest real entries in the teacher's pools
// ("SKIN-SCRAPER", "COMPETITION", "ANTARCTICA") by a wide margin while excluding
// the sentence-shaped answers of a comprehension quiz. Same threshold the lesson
// importer uses to tell a word from a clue, and for the same reason.
const WORD_POOL_MAX_LEN = 24;

// `session` (optional) turns the page into STUDENT MODE — used by play.html:
//   session.endOptions   { showAnswers } — the ONE tick left on the Set
//                        assignment form (Đợt 246; leaderboard/startAgain are
//                        stored but no longer read — both end screens bake
//                        their own rows in)
//   session.playerName   the student's name — Đợt 199: handed over by myLesson
//                        from the login ID, no longer typed by hand
//   session.className    the student's class ("A1A"), handed over the same way;
//                        the READY screen shows "TUẤN KHANG - A1A" under the
//                        template name so the class can see who is playing
//   session.submit(r)      start delivering one play -> Promise<{ok:boolean}>,
//                          never rejects (Đợt 246 — core/assignments.js keeps
//                          the attempt in an outbox under one fixed id)
//   session.retrySubmit()  re-deliver the SAME attempt -> Promise<{ok}> —
//                          the same id, so a re-send can never write twice
//   session.attemptId()    that id, printed on the screenshot fallback board
//   session.meta           { assignmentTitle, code } — for the same board
//   session.entries()    the class ranking -> Promise<[{name,score,total,timeMs,mine}]>
// ⭐⭐ Đợt 246 — a student play starts as PRACTICE or SUBMIT (two buttons on the
// READY screen, `hwMode`). PRACTICE never calls submit and may drill mistakes;
// SUBMIT uploads at finish() and confirms via the SUBMIT HOMEWORK ceremony.
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
  // ⭐⭐ Đợt 181 — IN A MATCH, ASK THE MATCH. A fight board is never given the
  // act the teacher is choosing sub-acts of: core/fight.js hands each board a
  // FROZEN, ALREADY-RESOLVED copy (fixed word order, `shuffleQuestions:false`,
  // clue sets and halves stripped by resolveActivity), and passes no `base` —
  // so `libAct` and `originAct` in this closure are both that copy, and the two
  // rules below answered "this act has no sub-acts" every time. The match holds
  // the real pair, so both names are taken from it while fighting. Outside a
  // match `own`/`org` ARE `libAct`/`originAct` and every line is byte-for-byte
  // Đợt 154's.
  // "This play's own act" — `libAct` normally, the MATCH's act while fighting.
  // One definition, because three places need the same answer (subActSource,
  // applySubActSelection's "is this a conversion" test, and the Options panel's
  // per-view key) and two of them would be silently wrong with `libAct`.
  function subActOwner() { return fight ? fight.ctl.matchAct() : libAct; }

  function subActSource() {
    const own = subActOwner();
    const org = fight ? fight.ctl.sourceActivity() : originAct;
    if (variantsOf(own.content) || contentSetsOf(own.content)) return own;
    if (own._converted && !own._mistakes && org !== own &&
        (variantsOf(org.content) || contentSetsOf(org.content))) return org;
    return own;
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

  // ⭐⭐ PLAY MODES (Đợt 190, 18/8/2026) — RUNNING and IPA.
  // Both are the MODE button leading somewhere the Template button could not:
  // a vocabulary act borrowed BY another template for a while, with the library
  // act left exactly as it was. RUNNING opens Running word or Running team off
  // the same word pool; IPA opens Speaking cards showing "WORD /ipa/", built out
  // of each word's own `ipa` field (core/lesson-import.js imports the /ipa/
  // column onto the word instead of making a standalone act of it).
  // ⚠️ Đợt 212 retired the PRONUNCIATION clue set that used to hold it; this
  // mode was deliberately KEPT (thầy) and reads `item.ipa`, which
  // core/content-view.js fills from either spelling — see resolveItem().
  //
  // ⚠️ They are ordinary Change-template conversions underneath — `conv_…` id,
  // `_converted:true`, library untouched, exit = doSwitchTemplate(originAct.type)
  // which restores the REAL act. The ONLY thing the mark adds is memory: without
  // it a converted act cannot say WHY it was converted, so the MODE button could
  // not glow, could not offer the way back, and (in IPA mode) could not know to
  // hide the Template button.
  // ⚠️ Read off `libAct`, not `activity`: `resolveActivity()` builds a fresh
  // object whenever the act has clue sets, and a converted act has none — so the
  // two are the same object here today, but only one of them is guaranteed to be.
  const playMode = libAct._mode || "";
  if (playMode) stage.classList.add(`mode-${playMode}`);

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

  /**
   * ⭐ Đợt 177 — WHICH PLAY THE SHARED RESULT BOARD IS ABOUT.
   *
   * Every column of myActivity opens the SAME library act, so the origin act's
   * id is the one string all of them agree on — which is exactly what a board
   * that merges several browsers' results needs as its key.
   *
   * ⚠️ NOT `activity.id`. A "Change template" play is a throwaway conversion and
   * core/convert.js stamps it with a RANDOM id (`conv_quiz_5817…`), so two
   * columns that both switched to Quiz would each invent a different key and
   * neither would ever see the other's result — with nothing on screen to
   * explain why. `originAct` is `base || libAct` (see its own note above), i.e.
   * the act the teacher actually opened, and it survives conversion untouched.
   */
  function showdownRoundKey() {
    return String(originAct?.id || activity.id || "");
  }

  // ⭐⭐ Đợt 196 — the two things the Showdown review needs from this closure.
  //   `sdReviewStop`  the live Firestore listener's unsubscribe, so closing the
  //                   review (or tearing the play down) does not leave it
  //                   running behind a screen that is gone — the exact shape of
  //                   the ghost-clock bug of Đợt 131.
  //   `sdPending`     whether this column still owes the shared board its own
  //                   result. Read SYNCHRONOUSLY from sessionStorage (it lives
  //                   in the pure core/showdown.js) so the warning can be on the
  //                   very first frame of the review, and re-read after every
  //                   publish attempt.
  // ⚠️ One-team (solo) mode never publishes to the LIVE class board (see
  // saveTeamResult's own note), so a row left in the outbox by some EARLIER play
  // must not make a solo review accuse itself of not sharing something it was
  // never going to share. It DOES write to the durable history — Đợt 197.
  const sdCanPublish = !!showdownPick && showdownPick.teamId !== SOLO_TEAM_ID;

  // ⭐⭐⭐ Đợt 217 (thầy, 20/8/2026) — MÁY BỊ GIÀNH MẤT ĐỘI PHẢI DỪNG LẠI.
  // *"Đội bị lấy mất team cũng sẽ báo đã bị giành mất team và buộc dừng game, không
  // cho tiếp tục và yêu cầu phải chọn team để chơi lại."*
  // ⚠️⚠️ ĐIỀU KIỆN LÀ "CÓ NGƯỜI KHÁC ĐANG GIỮ", KHÔNG PHẢI "KHÔNG CÒN AI GIỮ".
  // Ranh giới này là thứ quyết định tính năng có dùng được hay không: một chỗ đặt gạch
  // KHÔNG CÓ có thể chỉ nghĩa là hết hạn TTL 12 giờ, là mạng lớp học rớt, là bảng chưa
  // từng được publish — dừng ván giữa giờ vì mấy thứ đó thì tệ hơn hẳn cái nó chữa.
  // Còn `c.by !== me` là bằng chứng dương tính: có một trình duyệt khác vừa ghi tên nó
  // lên đúng đội này.
  // ⚠️ NHẬP ĐỘNG, và chỉ khi thật sự đang chơi Showdown: `core/showdown-setup.js` với
  // tới Firestore + thư viện, mà trang học sinh tuyệt đối không được tải nó (luật 2
  // của v0.9.0). `showdownPick` chỉ khác null khi `!session`, nên nhánh này không bao
  // giờ chạy ở play.html.
  let sdClaimStop = null;
  if (sdCanPublish) {
    import("./showdown-setup.js").then(mod => {
      // `torndown` khai bằng `let` ở dưới xa — an toàn vì lời gọi lại này chỉ chạy sau
      // khi cả startGame() đã chạy xong (cùng lối lập luận với `menuEl` trong idleTick).
      if (torndown) return;
      sdClaimStop = mod.subscribeSetup(next => {
        if (torndown) return;
        const c = next && next.claims && next.claims[showdownPick.teamId];
        if (c && c.by !== browserId()) showTeamStolen();
      });
      if (torndown) stopSdClaimWatch();     // ván có thể đã bị dỡ ngay trong lúc chờ nhập
    }).catch(() => { /* offline / signed out — không có kênh nào để nghe, chơi tiếp */ });
  }
  function stopSdClaimWatch() {
    if (!sdClaimStop) return;
    const stop = sdClaimStop;
    sdClaimStop = null;
    try { stop(); } catch { /* already gone */ }
  }

  /**
   * ⭐⭐ Đợt 197 — WHICH ARRAY OF THE ACT IS THE PLAYABLE ONE, AND HOW LONG IT IS.
   *
   * Two callers need this and they must agree to the item: the Showdown class
   * screen's QUESTIONS read-out ("how many will each pupil get?") and Balance
   * questions itself, which trims that very array. ONE function, so the number
   * the teacher was shown is the number they get.
   *
   * ⚠️ `tpl.itemsKey` is opt-in — a template that never joined Fight or "start
   * with mistakes" has none. The fallbacks are the names actually used across
   * the 17 templates; an act whose shape matches none of them answers 0, and
   * both callers read 0 as "cannot divide this", never as "nought each".
   */
  const ITEM_KEYS = ["items", "questions", "cards", "words"];
  function playItemsKey(act = activity) {
    if (tpl.itemsKey && Array.isArray(act?.content?.[tpl.itemsKey])) return tpl.itemsKey;
    return ITEM_KEYS.find(k => Array.isArray(act?.content?.[k])) || null;
  }
  function playItemCount(act = activity) {
    const k = playItemsKey(act);
    return k ? (act.content[k] || []).length : 0;
  }

  /**
   * ⭐⭐⭐ BALANCE QUESTIONS (Đợt 197, thầy 19/8/2026) — EVERY CHILD IN THE CLASS
   * ANSWERS THE SAME NUMBER OF QUESTIONS.
   *
   * The teacher's own worked example: 50 questions, 3 teams of 5 / 6 / 6 (17
   * pupils) ⇒ board 1 shows 40, boards 2 and 3 show 48, so everybody gets 8.
   *
   * ⚠️ THE DIVISOR IS THE **BIGGEST TEAM**, NOT THIS ONE. Every board plays the
   * same act, so a team of 6 can only go round `50 / 6` = 8 times — and the
   * whole point is that the team of 5 goes round exactly as often, not the 10 it
   * could manage alone. This board then plays `8 × its own size`.
   * The biggest team travels in the PICK (`maxTeam`, written by the setup panel,
   * which is the only place that can see the whole table); a pick from before
   * this đợt has none, and falls back to this team's own size — i.e. no trim,
   * which is exactly the old behaviour.
   *
   * ⚠️ RETURNS A COPY. `resolveActivity` may hand back `libAct` ITSELF, and
   * trimming that array in place would delete questions from the teacher's
   * library. The copy shares `options` by reference, which is what keeps
   * Options ▸ Apply landing on the real act (see the note at `let activity`).
   *
   * ⚠️ Called from BOTH the mount and `begin()`. begin() re-resolves the act
   * from the library — so without the second call the trim would silently vanish
   * the moment the teacher pressed Play.
   */
  function applyBalance(act) {
    if (!showdownPick || act?.options?.balanceQuestions !== true) return act;
    // ⭐ Đợt 220 — Free/Count đang cầm bài thì Balance đứng xuống (Options đã khoá
    // chéo hai bên; guard này đỡ act cũ lỡ lưu cả hai cờ).
    if (tpl.sdDeal && ["free", "count"].includes(act?.options?.sdDeal)) return act;
    const key = playItemsKey(act);
    if (!key) return act;
    const all = act.content[key] || [];
    const mine = showdownPick.members?.length || 0;
    const biggest = Math.max(1, Number(showdownPick.maxTeam) || mine);
    if (!all.length || !mine) return act;
    const each = Math.floor(all.length / biggest);
    const cap = each * mine;
    // `each < 1` = more pupils in the biggest team than the act has questions.
    // Trimming to 0 would be a game with nothing in it, so the option simply
    // stands down and every board plays the whole act, as it does when it is off.
    if (each < 1 || cap <= 0 || cap >= all.length) return act;
    // Which questions get dropped follows the act's OWN shuffle setting: a
    // shuffled act takes a random `cap` of them (so two boards do not sit through
    // the same 40 of 50), an unshuffled one keeps the teacher's order and takes
    // the first `cap` — cutting a deliberately ordered lesson in the middle would
    // be worse than short.
    let kept;
    if (act.options?.shuffleQuestions === false) {
      kept = all.slice(0, cap);
    } else {
      const a = all.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      kept = a.slice(0, cap);
    }
    return { ...act, content: { ...act.content, [key]: kept } };
  }
  let sdReviewStop = null;
  let sdPending = sdCanPublish && !!readPendingResult();
  function refreshSdPending() { sdPending = sdCanPublish && !!readPendingResult(); }

  // ⭐⭐⭐ Đợt 220 (thầy, 21/8/2026) — FREE / COUNT: CHIA BÀI CHO TỪNG HỌC SINH.
  //   options.sdDeal       "normal" | "free" | "count"   (Showdown only)
  //   options.sdDealCount  N câu mỗi em (chỉ Count; ô số chặn cứng ở tổng số câu)
  //
  // Cùng họ với applyBalance ngay trên: NỐI DÀI mảng câu trước khi bất cứ thứ gì
  // đo nó. `memberAt` là `index % số em` nên slot s của mảng đã thuộc sẵn về em
  // s % M — luật chia lượt, tên trên khung, review, mistakes: không sửa dòng nào.
  //
  // ⚠️ ĐỌC MỘT LẦN, LÚC MOUNT — structural y như `roundMode` bên dưới: Apply đi
  // qua replayCurrent() nên đổi lựa chọn là dựng lại cả ván, không mutate ván sống.
  // ⚠️ Chỉ template khai `tpl.sdDeal` (Quiz · Type the answer — thầy chốt thử hai
  // game trước). 3 game bàn-chơi (Open the box · Crossword · Find the match) CẤM
  // vĩnh viễn: mảng câu của chúng CHÍNH LÀ cái bàn — nối dài là ô chữ có một từ
  // hai lần. Mở thêm template = thêm đúng 1 dòng cờ, như fightTurns của Đợt 202.
  // ⚠️ `!_mistakes`: vòng "Start with mistakes" (ẩn sau nhấn giữ START AGAIN, chỉ
  // Showdown) là vòng ÔN TẬP vài câu sai — nối nó thành 100 câu/em là biến một
  // phút ôn thành một ván marathon. Vòng ôn chơi mảng sai nguyên trạng.
  const sdDealMode = (showdownPick && tpl.sdDeal && !activity._mistakes
      && ["free", "count"].includes(activity.options?.sdDeal))
    ? activity.options.sdDeal
    : "none";
  // Câu số cao nhất ván này đã ĐI TỚI (0-based) — mẫu số của Free lúc Submit.
  // Nuôi bởi setNav, cùng nguồn với tên học sinh trên khung (một sự thật, một chỗ).
  let sdMaxIndex0 = 0;
  function applySdDeal(act) {
    if (sdDealMode === "none") return act;
    const key = playItemsKey(act);
    if (!key) return act;
    const all = act.content[key] || [];
    const M = showdownPick.members?.length || 0;
    if (all.length < 2 || !M) return act;   // 1 câu thì không có gì để chia
    const N = sdDealMode === "count"
      ? Math.max(1, Math.min(all.length, Math.round(Number(act.options?.sdDealCount)) || 1))
      : SD_FREE_CAP;
    const idx = dealQuestions({ count: all.length, members: M, perPupil: N });
    // ⚠️ CÙNG OBJECT NGUỒN, không clone từng câu: core/mistakes.js gom câu sai
    // bằng Set các object `src`, nên một câu sai hai lần vẫn ra MỘT mục ôn tập.
    // ⚠️ `options` giữ nguyên THAM CHIẾU (spread nông) — hợp đồng của applyBalance:
    // Apply mutate tại chỗ vào đúng object này.
    return { ...act, content: { ...act.content, [key]: idx.map(i => all[i]) } };
  }

  // ⭐ Đợt 197 — trim the play NOW, before anything measures it. Everything
  // downstream (the nav's "x of N", the review, the leaderboard total) reads
  // `activity`, so the balance has to land before the first of them looks.
  // ⭐ Đợt 220 — Free/Count chia bài SAU phép cắt Balance (hai cái loại trừ nhau
  // trong Options; act cũ lỡ mang cả hai thì Free/Count thắng vì applyBalance
  // tự đứng xuống — xem guard của nó).
  activity = applySdDeal(applyBalance(activity));

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
      if (!type) return false;
      // ⭐ Đợt 197 — "ĐÃ Ở ĐÚNG TRẠNG THÁI RỒI" LÀ THÀNH CÔNG, KHÔNG PHẢI THẤT BẠI.
      // myActivity dùng giá trị này để chấm cột kia đã đồng bộ chưa, và từ v2.3.0 nó
      // còn hiện **dấu ✗ đỏ khi thất bại** — nên trả `false` cho một cột vốn đã đúng
      // sẽ là một lời báo động sai, ngay trên màn hình lớp học.
      if (type === activity.type) return true;
      awSyncMute++;
      return Promise.resolve(doSwitchTemplate(type)).then(() => true, () => false)
        .finally(() => { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); });
    },
    // ⭐⭐ Đợt 206 (19/8/2026, teacher: "mở mode nhiều bảng thì đồng bộ cả LOẠI
    // act") — this used to be a bare merge-and-replay, and it had a hole that
    // was MEASURED, not guessed (`scratch/mirror206.html`): on an act that had
    // been through **Change template** (or a RUNNING / IPA play mode) the clue
    // set did not follow at all, and worse, this still returned `true`, so
    // myActivity drew its ✓ over a pane that was playing something else.
    //   The cause is that convert.js BAKES one clue set into the converted act's
    // content. Storing "now it's VI1" on that copy moves nothing; the choice has
    // to go onto the ORIGIN and be re-converted from there — which is exactly
    // what applySubActSelection() exists for, and what Options ▸ Apply has
    // always done on this same pane. The bridge simply never went through that
    // door. Now both doors are the same door.
    // ⚠️ ORDER MATTERS: applySubActSelection() reads the choice from `opts`, not
    // from `activity.options`, but the Object.assign above must still happen
    // first — a converted act keeps its non-selector options on the copy.
    // ⚠️ The mute is what stops the re-emitted TPL from bouncing back out of
    // doSwitchTemplate() and around the panes again.
    applyOptions(opts) {
      if (!opts) return false;
      awSyncMute++;
      try {
        if (!activity.options) activity.options = {};
        // ⭐ REPLACE, not merge. Each view of an act carries its OWN set of
        // options (Đợt 147), and Options ▸ Apply on the sending pane DELETES
        // every key the new view does not have. A merge here left the other
        // panes carrying a leftover from a view nobody is looking at — a
        // `lives: 3` that nothing on screen explains. The payload is the whole
        // of the sender's `activity.options`, so equality is the honest result.
        // ⚠️ MUTATE, never replace the object: libAct, the mistakes act and the
        // fight boards all hold this same one.
        Object.keys(activity.options).forEach(k => { if (!(k in opts)) delete activity.options[k]; });
        Object.assign(activity.options, opts);
        // Converted act + a different sub-act ⇒ this takes the rebuild over and
        // hands back a promise; we report success only once it has landed.
        const converting = applySubActSelection(opts);
        if (converting) return converting.then(() => true, () => false);
        replayCurrent();
        return true;
      }
      finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    setTheme(id) {
      if (!id) return false;
      if (id === activity.theme) return true;      // đã đúng rồi — xem ghi chú ở switchTemplate
      awSyncMute++;
      try {
        loadTheme(id);
        stage.classList.forEach(c => { if (c.startsWith("theme-")) stage.classList.remove(c); });
        stage.classList.add("theme-" + id);
        activity.theme = id;
        return true;
      } finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    // ⭐⭐ myActivity Đợt "đồng bộ Mode" (22/8/2026) — MODE joins Template/Options/
    // Style as a fourth thing myActivity can drive from another pane's marker.
    // Scope is deliberately narrow (teacher's call, 22/8/2026): only Single ↔
    // Showdown. Fight stays local-only — a match is ONE pair of boards, not a
    // thing every pane should fall into — and so do Running/IPA, both one-board
    // practice modes nobody asked the other panes to enter. Showdown is a real
    // exception even there: the team table is per-pane (one teacher only ever
    // runs one live picker at a time — running it across 4 boards makes no
    // sense), so this only opens the SAME EMPTY team-picker screen on the other
    // panes. It never copies a pick across; each board's team choice stays its
    // own, same as `applyOptions` never touches this screen (Đợt 156 note above).
    setMode(target) {
      if (target !== "single" && target !== "showdown") return false;
      const cur = fight ? "fight" : (showdownPick ? "showdown" : (playMode || "single"));
      if (cur === target) return true; // đã đúng rồi — xem ghi chú ở switchTemplate
      awSyncMute++;
      try {
        if (target === "single") {
          if (fight) { fight.ctl.exitFight(); return true; }
          if (playMode) { doSwitchTemplate(originAct.type); return true; }
          dropShowdown();
          replayCurrent();
          return true;
        }
        // target === "showdown"
        if (!canShowdown) return false; // act này không có Showdown — đừng giả vờ thành công
        if (fight || playMode) {
          // Phải THOÁT trước, màn Showdown tự mở lại sau — cùng cơ chế một-lần-
          // dùng `openShowdownOnMount` mà buildToShowdownConfirmPanel đang dùng.
          openShowdownOnMount = true;
          if (playMode) doSwitchTemplate(originAct.type); else fight.ctl.exitFight();
          return true;
        }
        if (!modeBtn.isConnected) return false;
        openToolPanel(modeBtn, buildShowdownPanelHost);
        return true;
      } finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    // ⭐⭐ myActivity Đợt "đồng bộ tức thời" (22/8/2026) — the other half of
    // TOOLOPEN/TOOLCLOSE: host clicks these on the OTHER panes when the teacher
    // opens/closes the Options popover on one, so every board shows the same
    // popover at the same time. Not muted (opening a panel emits nothing on its
    // own — `awEmit("TOOLOPEN", …)` only fires from a REAL open, at the top of
    // buildOptionsPanel — so a mirrored open here cannot echo back out).
    openOptions() {
      if (!optionsBtn.isConnected) return false;
      // Muted: buildOptionsPanel() below fires its OWN "TOOLOPEN" the moment it
      // mounts (any real open, this mirrored one included) — without the mute
      // that would echo straight back out and host would relay ANOTHER open to
      // every OTHER pane (harmless once opening is idempotent, but pointless
      // O(panes²) traffic for a 4-5 pane class screen).
      awSyncMute++;
      try { openToolPanel(optionsBtn, buildOptionsPanel); return true; }
      finally { setTimeout(() => { awSyncMute = Math.max(0, awSyncMute - 1); }, 400); }
    },
    closeTool() {
      closeToolPanel(false);
      return true;
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
  // ⭐ Đợt 178 — `.is-showdown` on the ROW itself, so a template whose caption is
  // its OWN node in this row (Speaking's "SPEAKING IN ANDREW CLASSES", Unjumble's
  // clue) can hide it in one CSS line from its own stylesheet. The engine's
  // `ui.sloganSlot` is already hidden by `.aw-top-centre.is-showdown >
  // .aw-top-slogan`, but that selector only reaches the engine's own node — a
  // template-owned sibling would sit UNDER the 3.6cqw pupil name instead, and
  // both are absolutely centred on the same seat.
  const topbar = el("div", "aw-topbar" + (tpl.inlineTimerBar ? " has-inline" : "") + (timerOutOfTopbar ? " aw-timer-external" : "") + (showdownPick ? " is-showdown" : ""));
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
    // ⭐⭐ Đợt 178 — THE NAME WAS BEING BUILT AND THEN THROWN AWAY HERE.
    // This branch appended `topbarMid` INSTEAD of `centreSlot`, so any template
    // with `inlineTimerBar` (Balloon pop · Flying fruit · Gameshow · Open the
    // box · Whack-a-mole · Running team) created `.aw-top-showdown`, painted the
    // pupil's name into it on every question — and never put it in the document.
    // No error, no empty box: the cue the whole class reads simply did not exist.
    // Nobody had hit it because the only three Showdown templates until now
    // (Quiz · Anagram · Type the answer) all use `hasLivesSlot` instead, which
    // takes the branch below.
    // ⚠️ Guarded on `showdownPick` because THAT is what makes `.aw-top-centre`
    // `position:absolute` (`.is-showdown` in app.css, added at the same place
    // this slot is built). Absolute means it costs the inline timer row no width
    // at all. Appending the IN-FLOW variant — a template that one day sets both
    // `inlineTimerBar` and `hasSloganSlot` — would take a flex share and squeeze
    // the very bar this branch exists to make room for.
    if (centreSlot && showdownPick) topbar.append(centreSlot);
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
  // ⭐⭐⭐ Đợt 220 (thầy, 21/8/2026) — HAI MŨI TÊN BỊ KHOÁ KHI BÀN KIA CÒN ĐANG LÀM.
  // Thầy: *"đội trước bấm next làm đội sau không chơi được nữa"*. Đọc
  // `nobodyElseIsPlaying()` trong core/fight.js để biết vì sao chặn phải nằm ở NGUỒN.
  //
  // ⭐ ĐẶT Ở `setNav` VÌ ĐÓ LÀ CÁI PHỄU DUY NHẤT: cả 15 template có nav đều đi qua đây,
  // nên một chốt ở đây là chốt cho tất cả, kể cả template viết sau này — không template
  // nào phải sửa một dòng, và không template nào có thể QUÊN.
  //
  // ⚠️⚠️ PHẢI NHỚ HAI HÀM XỬ LÝ. Trạng thái "bàn kia còn đang làm không" đổi vì việc của
  // BÀN KIA, mà `setNav` thì chỉ chạy khi CHÍNH bàn này có gì đó đổi — nên nếu chỉ chặn
  // trong `setNav` thì hai mũi tên sẽ nằm mờ cho tới khi template tình cờ vẽ lại nav,
  // có thể là không bao giờ. Trọng tài gọi `paintNavGate()` qua `registerNavGate`, và
  // hàm đó cần lại đúng hai handler cũ ⇒ phải giữ chúng ở đây.
  let navHandlers = { prev: null, next: null };
  /**
   * Bàn này có được rời vòng hiện tại không?
   * ⭐ Ô **Allow skip** là công tắc của chính luật này (thầy chốt 21/8/2026): bật lên là
   * thầy CỐ Ý cho phép cắt ngang, nên chốt mở. Tắt (mặc định từ Đợt 220, cả 4 template
   * có ô này) thì phải đợi bàn kia xong.
   * ⚠️ Ngoài Fight thì luôn `true` — chỉ trong trận mới có "bàn kia" để mà chờ.
   */
  function mayLeaveRound() {
    if (!fight || typeof fight.ctl.mayLeaveRound !== "function") return true;
    if (activity.options?.allowSkip === true) return true;
    return fight.ctl.mayLeaveRound(fight.side);
  }
  /** Nối/cắt dây hai mũi tên theo câu trả lời hiện tại, từ handler đã nhớ. */
  function paintNavGate() {
    const open = mayLeaveRound();
    wireNav(navPrev, open ? navHandlers.prev : null);
    wireNav(navNext, open ? navHandlers.next : null);
  }
  const rightTools = el("div", "aw-tools");
  const soundBtn = iconBtn("aw-iconbtn", sound.isMuted() ? icons.soundOff : icons.soundOn, "Sound");
  soundBtn.classList.toggle("is-off", sound.isMuted());
  // Fullscreen must work BEFORE the game starts too (the teacher usually goes
  // fullscreen while the PLAY screen is still up), so this one button sits
  // above the READY overlay instead of behind it.
  const fsBtn = iconBtn("aw-iconbtn aw-fs-always" + (root.classList.contains("aw-zoomed") ? " is-zoomed" : ""), icons.fullscreen, "Fullscreen");
  // ⭐⭐ Đợt 188 (teacher, 18/8/2026: "bỏ hẳn nút fullscreen trong chế độ fight và
  // showdown") — the button is BUILT either way (setZoomed and the handler below
  // both hold on to it, and a match rebuild may hand the same engine a different
  // mode) but only reaches the screen in single play. In a match the whole-match
  // button that used to sit in the shared toolbar is gone too, so from Đợt 188 on
  // there is no in-app way into full screen in either mode — the teacher's call,
  // confirmed; the browser's own F11 still works.
  rightTools.append(soundBtn);
  if (!fight && !showdownPick) rightTools.append(fsBtn);
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

  // ⭐⭐ FIGHT WAIT BAR (Đợt 187, teacher 18/8/2026) — while the referee holds the
  // round open for the team that has not answered yet ("TIME DELAY"), a bar runs
  // that wait down on BOTH boards, with no number on it: "chờ tối đa 5s và hiện
  // thanh thời gian (không cần số)". core/fight.js owns the TIMING and calls in
  // here through ctl.registerWaitBar; this side owns only the pixels, because
  // only the board knows where its own Menu / keyboard / ‹ › buttons ended up.
  //
  // WHERE IT GOES (the teacher's two cases, verbatim): "nếu không có nút
  // next-back (trống khu đó) thì thanh này kéo dài ở hàng dưới, nếu có nút
  // next-back, thì thanh ngắn và dài từ nút menu (hoặc nút bàn phím) tới gần nút
  // back". Both cases are one measurement with a different RIGHT edge — and "no
  // ‹ ›" is a real, existing state, not a hypothetical: Find the match (the one
  // ordinary-round game the teacher asked TIME DELAY to cover) hides both arrows
  // from its own stylesheet, so it takes the long bar while Quiz · Anagram · Type
  // the answer · True/false take the short one.
  //
  // ⚠️ ABSOLUTELY POSITIONED, and appended as a FOURTH child. `.aw-bottombar` is a
  // 3-track grid whose `:nth-child(1/2/3)` rules are the only thing keeping the
  // nav truly centred (the same reasoning that made `leftGroup` a wrapper back at
  // Đợt 92). An out-of-flow child takes no track and shifts no sibling, so those
  // three rules still address exactly the three elements they always did.
  // ⚠️ Measured with `offset*`, never getBoundingClientRect: offsets ignore CSS
  // transforms, so a bar placed while the keyboard is mid-slide still lands in its
  // final spot on frame one (the rule crossword's positionActive already follows).
  const waitBar = fight ? el("div", "aw-waitbar") : null;
  const waitBarFill = waitBar ? el("div", "aw-waitbar-fill") : null;
  if (waitBar) {
    waitBar.append(waitBarFill);
    bottombar.append(waitBar);
    // Optional call: an older core/fight.js served from a stale cache never asks.
    if (fight.ctl.registerWaitBar) fight.ctl.registerWaitBar(fight.side, runWaitBar);
    // ⭐⭐ Đợt 217 — ĐƯỜNG NHẬN TẠM DỪNG TỪ BÀN KIA (thầy: "1 bên bấm nút menu thì bên
    // còn lại cũng tạm dừng game cùng"). Lý do "relay" KHÔNG chuyển tiếp ngược lại —
    // xem `enterPause`. Cũng là lời gọi TUỲ CHỌN, cùng lý do với dòng ngay trên: một
    // core/fight.js cũ lấy từ cache sẽ không bao giờ hỏi tới.
    if (fight.ctl.registerPause) {
      fight.ctl.registerPause(fight.side, (on, dim) =>
        (on ? enterPause("relay", { dim: dim !== false }) : exitPause("relay")));
    }
    // ⭐⭐⭐ Đợt 220 — ĐƯỜNG TRỌNG TÀI BÁO "TRẠNG THÁI VÒNG VỪA ĐỔI, VẼ LẠI ‹ ›".
    // Lời gọi TUỲ CHỌN, cùng lý do với hai dòng trên: một core/fight.js cũ lấy từ cache
    // không có hàm này, và khi đó nav chỉ đơn giản là không bao giờ bị chặn — đúng nết cũ.
    if (fight.ctl.registerNavGate) fight.ctl.registerNavGate(fight.side, paintNavGate);
  }
  function placeWaitBar() {
    const rowW = bottombar.clientWidth;
    if (!rowW) return false;
    const GAP = Math.max(6, Math.round(rowW * 0.015));
    const left = leftGroup.offsetLeft + leftGroup.offsetWidth + GAP;
    // ⚠️ THE TEST IS "IS THAT SEAT EMPTY", NOT "ARE THERE ARROWS" — the teacher's
    // own words are "nếu không có nút next-back (TRỐNG KHU ĐÓ)". Measured while
    // building this: reading `navPrev.offsetWidth` alone gives Find the match a
    // bar 788px wide that runs straight THROUGH its "Page 1 / 2" label, which
    // that game keeps even though it hides both arrows (find-the-match.css, and
    // crossword.css does the same). A bar drawn over live text breaks the house
    // rule that anything taking room on screen has to be readable, so the whole
    // WRAPPER is measured: arrows, label, or both. A seat that is genuinely empty
    // collapses to 0 width and the bar runs on to the sound/fullscreen cluster.
    const navSeat = navWrap.offsetWidth > 0 ? navWrap.offsetLeft : rightTools.offsetLeft;
    const rightEdge = navSeat;
    const width = Math.round(rightEdge - GAP - left);
    if (width < 24) return false;          // nothing worth drawing in that gap
    waitBar.style.left = Math.round(left) + "px";
    waitBar.style.width = width + "px";
    return true;
  }
  function runWaitBar(ms, mode) {
    if (!waitBar) return;
    // ⭐⭐ Đợt 219 — HAI NHỊP MỚI, cho việc "tạm dừng là dừng TẤT CẢ" (thầy, 21/8/2026).
    // Thanh này là một `transition` CSS ở hàng nút dưới, KHÔNG nằm trong sân, nên
    // `freezePlay()` — vốn chỉ quét `stage.getAnimations({subtree:true})` — không bao
    // giờ với tới nó. Không có hai nhịp này thì mở ☰ Menu giữa cửa sổ Time delay là
    // thanh cứ cạn hết trong lúc trọng tài đã đứng im: bàn hứa một đằng, luật làm một nẻo.
    // ⚠️ `"hold"` GIỮ NGUYÊN BỀ RỘNG ĐANG CÓ — đọc bằng `getComputedStyle`, tức giá trị
    // ĐANG CHẠY GIỮA CHỪNG của transition (px), không phải cái "0%" đã ghi vào style.
    // ⚠️ `"go"` chạy nốt phần còn lại TỪ CHỖ ĐANG ĐỨNG, tuyệt đối không kéo về 100%:
    // kéo về đầy là tặng không cho đội chậm cả một cửa sổ nữa.
    // ⚠️ Cả hai đều bỏ qua khi thanh chưa bật, và bỏ qua ở nấc ∞ (`.is-forever` không
    // đếm gì để mà dừng — nó chỉ thở bằng CSS).
    if (mode === "hold" || mode === "go") {
      if (!waitBar.classList.contains("is-on") || waitBar.classList.contains("is-forever")) return;
      if (mode === "hold") {
        waitBarFill.style.width = getComputedStyle(waitBarFill).width;
        waitBarFill.style.transition = "none";
        return;
      }
      if (!Number.isFinite(ms) || !(ms > 0)) return;
      void waitBarFill.offsetWidth;                       // cùng điệu khởi động lại transition như dưới
      waitBarFill.style.transition = "width " + ms + "ms linear";
      waitBarFill.style.width = "0%";
      return;
    }
    if (!(ms > 0) || torndown) {
      waitBar.classList.remove("is-on", "is-forever");
      waitBarFill.style.transition = "none";
      waitBarFill.style.width = "100%";
      return;
    }
    if (!placeWaitBar()) return;
    waitBar.classList.add("is-on");
    // Start FULL with no transition, force a reflow, then let it empty. Without
    // that reflow the browser coalesces both writes and the bar snaps straight to
    // empty — the standard restart-a-CSS-transition dance.
    waitBarFill.style.transition = "none";
    waitBarFill.style.width = "100%";
    // ⭐⭐ Đợt 216 — A THIRD STATE: ∞ (`Infinity`). The teacher's ∞ no longer ends
    // after five seconds, it ends when the other team finishes the word, so there
    // is no deadline left to count down and a draining bar would be a lie — it
    // would run out while the round was still open. His own words for what to
    // show instead: "đứng đấy, thở nhẹ, nền sáng lấp lánh hào quang nhấp nháy
    // chậm". The bar therefore stays FULL and the motion is handed to CSS
    // (`.is-forever`, core/app.css); nothing here is timed.
    // ⚠️ RETURN BEFORE THE TRANSITION LINE. `"width " + Infinity + "ms"` is not a
    // valid duration, Chrome drops the whole shorthand, and the very next write
    // ("0%") then applies with NO transition at all — an ∞ wait would have shown
    // an empty bar instantly, the opposite of what it means.
    if (!Number.isFinite(ms)) { waitBar.classList.add("is-forever"); return; }
    waitBar.classList.remove("is-forever");
    void waitBarFill.offsetWidth;
    waitBarFill.style.transition = "width " + ms + "ms linear";
    waitBarFill.style.width = "0%";
  }

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

  // ----- Below the stage: TITLE (left) · Options/Style/Mode (center) ·
  // Edit/Assignment/Print (right) — Đợt 228 dropped the standalone Template
  // button from this row; Change Template now lives inside the Options panel. -----
  // The specific game title sits on the SAME row as the tool buttons (the
  // instruction line under the stage was removed per the teacher's request).
  const belowLeft = el("div", "aw-below-left");
  belowLeft.append(el("div", "aw-below-title", escapeText(activity.title || "")));

  const belowCenter = el("div", "aw-below-center");
  const optionsBtn = toolBtn(icons.options, "Options");
  // ⭐⭐ Đợt 228, revised same đợt (thầy, 22/8/2026: "bỏ luôn nút Template cũ bên
  // ngoài" rồi "style cũng đưa luôn vào trong nút Template bên trong options, mở
  // bằng cách nhấn giữ") — BOTH Template-switching AND Style moved inside the
  // Options panel, onto its "current template" button (see buildOptionsPanel
  // below: tap = the game picker, hold = Style — the exact tap/hold pair this
  // toolbar used to carry, Đợt 192, just relocated). So there is no separate
  // Template button OR Style button out here any more — only Options and Mode.
  // ⚠️ `templateSwitchAvailable` (renamed from the old `tplLocked`, inverted) is
  // read further down by buildOptionsPanel to decide WHICH GESTURE that inline
  // button offers, never whether Style is reachable: Style must survive in
  // EVERY mode (IPA, Running word, Running team included) exactly as it did
  // before, so the button still gets built there when this is false — it just
  // shows "Style" outright, plain tap, no picker to hold FOR. See where it is
  // built for the actual branch.
  const templateSwitchAvailable = !(playMode === "ipa" || NO_TEMPLATE_TYPES.has(activity.type));
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
  // ⭐⭐ Đợt 191b (thầy: "ở mọi mode đều cần có thể chuyển đội sang bất kỳ các mode
  // khác một cách linh hoạt") — ASK THE ACT THE TEACHER OWNS, NOT THE ONE BEING
  // BORROWED. Inside RUNNING or IPA the template on screen is Running word or
  // Speaking cards, and neither declares `fightMode`/`showdownMode` — so those two
  // tiles vanished, and the only way to a match from IPA was Single first, then
  // Fight. The question was being put to the wrong act: what can be fought over is
  // the ORIGIN's content, which is exactly what those modes will be handed.
  // ⚠️ `hasTemplate` first, never a bare `getTemplate` — that throws for a module
  // that has not been imported, and it is reached here on every mount.
  // In practice the origin's module IS loaded (this mode was entered by playing
  // it), but a throw here would take the whole toolbar down with it.
  const modeTpl = (playMode && originAct.type !== activity.type && hasTemplate(originAct.type))
    ? getTemplate(originAct.type)
    : tpl;
  const canFight = !!modeTpl.fightMode && !session;
  const canShowdown = !!modeTpl.showdownMode && !session;
  // ⭐ Đợt 190 — RUNNING and IPA are offered by CONTENT, not by a template flag:
  // they are somewhere this act's words can GO, so the question is whether the
  // origin act can get there. Running word/team need a word pool (switchList()
  // already applies each game's own floor — 2 words and 6); IPA needs at least
  // one transcription, and asks the resolved origin because that is where
  // core/content-view.js puts it.
  // ⭐ Đợt 192 (thầy) — RUNNING WORD FIRST, RUNNING TEAM SECOND, always. The
  // order used to be whatever `switchList()` handed back, which is ALL_TEMPLATES
  // order for an ordinary act but puts the act's OWN type first when a temp act
  // is playing (see switchList) — so the two tiles could swap places depending
  // on where the teacher came from. A picker whose two buttons trade seats is a
  // picker that has to be read every time.
  const RUN_ORDER = ["running_word", "running_team"];
  const RUN_LABEL = { running_word: "WORD", running_team: "TEAM" };
  const runTargets = () => {
    if (session || fight) return [];
    const list = switchList().filter(t => RUN_ORDER.includes(t.type))
      .sort((a, b) => RUN_ORDER.indexOf(a.type) - RUN_ORDER.indexOf(b.type));
    if (!list.length) return [];
    // ⚠️ A WORD POOL, NOT JUST ANY ANSWERS. Change template has offered Running
    // team from every "qa" act since it was built, and for a comprehension QUIZ
    // that means a race whose answers are whole SENTENCES ("She is over there,
    // making a snowman") — one team's explainer describing a sentence while the
    // other types it out is not the game. So this mode asks a second question
    // the Template button does not: do these read like WORDS? Deliberately
    // scoped to the mode — the Template button's own list is left exactly as it
    // has always been, because narrowing that would change behaviour the teacher
    // has been using for weeks.
    const terms = toRecords(originAct).records.map(r => (r.term || "").trim()).filter(Boolean);
    if (!terms.length) return [];
    const wordy = terms.filter(t => t.length <= WORD_POOL_MAX_LEN).length;
    return wordy / terms.length >= 0.8 ? list : [];
  };
  const canRunning = !session && !fight && runTargets().length > 0;
  const canIpa = (() => {
    if (session || fight || playMode === "ipa") return false;
    const items = resolveActivity(originAct).content?.items;
    return Array.isArray(items) && items.some(it => it && it.ipa);
  })();
  // ⚠️⚠️ `|| playMode` IS THE WAY OUT. Running word and Speaking cards declare
  // neither fightMode nor showdownMode, so without it the button that carried
  // the teacher INTO the mode would not be built on the way back — the mode
  // would be a room with no door, and the only escape a page reload.
  // ⭐ Đợt 191 (thầy) — THE BUTTON WEARS THE MODE IT IS IN. It used to always
  // show `icons.modes` (three panels = "a choice of modes"), which said what the
  // button DOES but never what is currently ON. Now single mode shows the single
  // board — the honest default when the app opens — and each mode swaps the icon
  // for its own, so the toolbar answers "what are we in?" without being tapped.
  // The glow is unchanged and still means exactly "not plain single".
  const modeIcon = fight ? icons.mode
    : showdownPick ? icons.showdown
      : playMode === "running" ? icons.fmtRace
        : playMode === "ipa" ? icons.ipa
          : icons.single;
  // ⭐⭐ Đợt 195 — HOME LIVES ON THIS BUTTON NOW (thầy, 18/8/2026: "tích hợp nút
  // trang chủ vào nhấn giữ nút mode"): tap = the mode picker, PRESS-AND-HOLD = the
  // "Go home?" question. The wiring itself sits with Options/Template further
  // down, where all three tool buttons are wired together.
  //
  // ⚠⚠ AND THAT IS WHY THIS BUTTON IS NOW ALWAYS BUILT. It used to be dropped
  // whenever there was no mode to offer — 5 of the 17 templates declare neither
  // `fightMode` nor `showdownMode` (maze chase · whack-a-mole · speaking cards ·
  // both Running games), so an act of one of those whose answers are too long for
  // a Running race and which carries no IPA got NO button here at all. Hanging
  // Home off a button that is sometimes absent would take Home away with it, and
  // the in-game ☰ menu has no way out either (Submit / Start again / Resume /
  // Change template) — the act would be a room with no door.
  // So where there is no mode to pick, the button is built as a HOME button
  // OUTRIGHT: its own icon, `title="Home"`, and a plain TAP opens the same
  // question. Exactly the shape Đợt 192 gave the Template/Style pair: nothing
  // is reachable only through a gesture on a button that is not there.
  const modeAvail = !!(canFight || canShowdown || canRunning || canIpa || playMode);
  const modeBtn = modeAvail ? toolBtn(modeIcon, "Mode") : toolBtn(icons.home, "Home");
  // Glows whenever anything other than plain single mode is running. With one
  // button standing for every mode this is the only at-a-glance "something
  // is on" the toolbar has left. A button that is only Home never glows.
  if (modeAvail && (fight || showdownPick || playMode)) modeBtn.classList.add("is-active");
  // ⭐ Đợt 191 (thầy: "chuyển vị trí nút mode ra ngoài cùng bên phải trong mọi
  // trạng thái") — MODE now sits LAST everywhere, and that **reverses Đợt 124**,
  // where it swapped places with Style during a match so it landed dead centre
  // ("nút cai quản cả trận thì được ghế giữa"). Deliberate: a button that moves
  // depending on the mode is a button the hand has to look for, and now that it
  // also CHANGES ICON with the mode (see `modeIcon` above) a fixed seat is what
  // keeps it findable. Do not restore the centre seat without checking with the
  // teacher — it was their call both times.
  // Đợt 192 — THREE buttons now, not four: Style folded into Template above.
  belowCenter.append(optionsBtn, modeBtn);
  // The other half of the Fight → Showdown handover (see `openShowdownOnMount`).
  // Read-and-clear FIRST, so a board that cannot honour it (no button, or we
  // somehow landed back in a match) still consumes the flag instead of leaving
  // it armed for whatever the teacher opens next.
  if (openShowdownOnMount) {
    openShowdownOnMount = false;
    if (modeAvail && !fight && canShowdown) {
      // Next tick: let this mount finish first — openToolPanel measures the
      // toolbar it is about to hang the panel under.
      setTimeout(() => { if (modeBtn.isConnected) openToolPanel(modeBtn, buildShowdownPanelHost); }, 0);
    }
  }

  // The other half of the inline-picker handover (see `openOptionsOnMount`) —
  // read-and-clear FIRST for the same reason as above: a mount that cannot
  // honour it (button missing) must still consume it rather than leave it
  // armed for whatever the teacher opens next.
  if (openOptionsOnMount) {
    openOptionsOnMount = false;
    setTimeout(() => { if (optionsBtn.isConnected) openToolPanelFor(optionsBtn, buildOptionsPanel); }, 0);
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
    const cur = fight ? "fight" : (showdownPick ? "showdown" : (playMode || "single"));
    const tiles = [];
    if (cur !== "single") tiles.push(["single", icons.single, "Single mode", buildSingleConfirmPanel]);
    if (canFight && cur !== "fight") tiles.push(["fight", icons.mode, "Fight mode", buildFightConfirmPanel]);
    // ⭐ Đợt 191 — ORDER IS FIGHT · SHOWDOWN · RUNNING · IPA (thầy). Single, when
    // it is offered at all, stays FIRST: it is the way back rather than one of
    // the four, and putting the exit where the eye starts is what keeps it from
    // being hunted for.
    if (canShowdown) tiles.push(["showdown", icons.showdown,
      cur === "showdown" ? "Showdown — set the teams again" : "Showdown",
      // ⚠️ FROM INSIDE A MATCH the table cannot simply open: this board would set
      // up teams, press READY, and `replayCurrent()` would restart it STILL
      // inside the fight, where `showdownPick` is ignored (`!fight`, see the top
      // of this file). The teacher would have built a line-up that does nothing
      // and nothing on screen would say so. So in a match the tile leads to a
      // confirm that LEAVES the match first, and the table opens by itself on
      // the single board that comes back.
      // ⭐ Đợt 191b — A PLAY MODE NEEDS THE SAME HOP A MATCH DOES. The team table
      // could open here, but pressing READY restarts the act that is on screen —
      // and in RUNNING/IPA that is Running word or Speaking cards, neither of
      // which reads `showdownPick` (`tpl.showdownMode` is false, see the top of
      // this file). The teacher would have built a line-up that does nothing.
      (fight || playMode) ? buildToShowdownConfirmPanel : buildShowdownPanelHost]);
    // RUNNING leads to a SECOND tile screen (Running word · Running team) rather
    // than straight into a game: the two are different lessons off one word list,
    // and the teacher picks which as the class starts. IPA has no such fork, so
    // it goes to its confirm directly.
    if (canRunning) tiles.push(["running", icons.fmtRace, "Running mode", buildRunningPickPanel]);
    if (canIpa) tiles.push(["ipa", icons.ipa, "IPA mode", buildIpaConfirmPanel]);
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

  // ---- RUNNING mode: the second tile screen (Đợt 190) ----------------------
  // Two more icon tiles, same grid and same look as the mode picker itself, so
  // the fork reads as one flow rather than a different kind of screen. Only the
  // games this act can actually feed are offered — Running team needs six words
  // and Running word two, and switchList() has already applied both floors.
  function buildRunningPickPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Running mode"));
    const grid = el("div", "aw-mp-grid");
    runTargets().forEach(t => {
      // ⭐ Đợt 192 (thầy) — the tile says WORD / TEAM, not "Running word" /
      // "Running team". Both tiles already sit under the heading "Running mode",
      // so the word "Running" was printed three times on one small screen and
      // the only part that DIFFERS was the last word — the part the eye reaches
      // last. The full name stays as the tooltip and the accessible name, which
      // is where a screen reader (and a hover) still wants it spelled out.
      const short = RUN_LABEL[t.type] || t.label;
      const tile = el("button", "aw-mp-tile", `<span class="aw-mp-icon">${icons.fmtRace}</span>` +
        `<span class="aw-mp-label">${escapeText(short)}</span>`);
      tile.type = "button"; tile.title = t.label; tile.setAttribute("aria-label", t.label);
      tile.onclick = () => { sound.click(); closeToolPanel(false); enterPlayMode("running", t.type); };
      grid.append(tile);
    });
    panel.append(grid);
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); switchToolPanel(buildModePickPanel); };
    row.append(cancelBtn);
    panel.append(row);
  }

  function buildIpaConfirmPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Switch to IPA mode?"));
    panel.append(el("div", "aw-mode-confirm-text",
      "Deal the words as cards, each with its pronunciation. Your activity is not changed."));
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); switchToolPanel(buildModePickPanel); };
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", "Start IPA");
    goBtn.type = "button";
    goBtn.onclick = () => { sound.click(); closeToolPanel(false); enterPlayMode("ipa", "speaking_cards"); };
    row.append(cancelBtn, goBtn);
    panel.append(row);
  }

  // Borrow another template for a while. Deliberately the SAME machinery as
  // Change template — convert from the ORIGIN act, play the throwaway copy, and
  // leave the library alone — with `_mode` added so the way back exists.
  // ⚠️ Convert from `originAct`, never from `activity`: converting a conversion
  // degrades the content a little more each hop (the rule `base`/`originAct`
  // exists for), and here it would also mean building a word list out of an
  // act that had already thrown its clue sets away.
  async function enterPlayMode(mode, targetType) {
    exitAnyFullscreen();
    dropShowdown();
    try {
      await ensureTemplate(targetType);
      const converted = await convertActivity(originAct, targetType,
        mode === "ipa" ? { style: "ipa" } : {});
      converted._mode = mode;
      cleanupAll();
      startGame(root, converted, { onExit, session, base: originAct });
    } catch (e) {
      console.warn("AWord: could not enter " + mode + " mode", e);
      toast("Could not start that mode");
    }
  }

  // Two named wrappers rather than one parameterised builder: `mountPanelContent`
  // and `capPanelHeight` both identify panels BY FUNCTION IDENTITY, and a fresh
  // closure per call would quietly never match.
  function buildFightConfirmPanel(panel) { buildModeConfirmPanel(panel, "fight"); }
  function buildSingleConfirmPanel(panel) { buildModeConfirmPanel(panel, "single"); }

  // Fight → Showdown, and (Đợt 191b) RUNNING/IPA → Showdown: the hops that cannot
  // be done in place, because the act on screen would ignore the pick. Both leave
  // first and let the team table open by itself on the board that comes back.
  function buildToShowdownConfirmPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Switch to Showdown?"));
    panel.append(el("div", "aw-mode-confirm-text", playMode
      ? "Go back to your activity first. The team table opens on its own."
      : "Leave the match first. The team table opens on its own."));
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); switchToolPanel(buildModePickPanel); };
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", "Set up teams");
    goBtn.type = "button";
    goBtn.onclick = () => {
      sound.click();
      closeToolPanel(false);
      // Read and cleared by the startGame() that the exit below is about to run —
      // exactly once, so a failed exit can never leave it armed for a later act.
      openShowdownOnMount = true;
      // ⭐ Đợt 191b — the same flag serves both exits. Leaving a play mode is a
      // template switch back to the origin (`doSwitchTemplate`), which lands on a
      // board that CAN read a pick; leaving a match is `exitFight()`.
      if (playMode) { doSwitchTemplate(originAct.type); return; }
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
      : playMode
        ? "Go back to your activity, exactly as it was."
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
        // ⭐⭐ myActivity Đợt "đồng bộ Mode" (22/8/2026) — Fight stays a NO-OP for
        // cross-pane sync (a match is one pair of boards, not a thing every pane
        // should fall into), so it keeps its own FIGHT marker only. Leaving
        // RUNNING/IPA/Showdown all land on plain Single, which the OTHER panes
        // — never having followed INTO those play modes in the first place —
        // genuinely can and should mirror, so those three now also emit MODE.
        if (fight) { fight.ctl.exitFight(); awEmit("FIGHT", "off"); return; }
        // ⭐ Đợt 190 — leaving RUNNING or IPA is a template switch BACK to the
        // origin, which `doSwitchTemplate` already handles as a special case:
        // it restores the REAL library act (its own id, its own saved options)
        // instead of converting the conversion. `replayCurrent()` would restart
        // the throwaway copy — still Running word, still marked, so the mode
        // would look like it had refused to close.
        if (playMode) { doSwitchTemplate(originAct.type); awEmit("MODE", "single"); return; }
        // Leaving Showdown: the restart re-reads an empty pick and the board
        // comes back as an ordinary single play (same path as the Showdown
        // panel's own "Single mode" button).
        dropShowdown();
        replayCurrent();
        awEmit("MODE", "single");
        return;
      }
      exitAnyFullscreen();
      dropShowdown();
      cleanupAll();
      try {
        // ⭐⭐ Đợt 191b — FROM A PLAY MODE THE MATCH GETS THE ORIGIN ACT, NOT THE
        // BORROWED ONE (thầy: chuyển được sang mode khác "nhưng lấy nội dung của
        // chuẩn chứ không phải của IPA"). In IPA mode `libAct` is a deck of
        // Speaking cards reading "WORD /ipa/", and in RUNNING mode it is a bare
        // word pool — fighting over either is fighting over the wrong content,
        // and Speaking cards is not even scorable. `originAct` is the act the
        // teacher owns and the one the mode was built out of.
        // ⚠️ `ensureTemplate` first: that module was loaded when the origin was
        // played, but startFight() calls startGame() on both boards immediately
        // and getTemplate() throws for anything not registered.
        const matchAct = playMode ? originAct : libAct;
        if (playMode) await ensureTemplate(originAct.type);
        const { startFight } = await import("./fight.js");
        // `base` travels into the match so a Change-template DURING the fight
        // still converts from the teacher's original act, exactly as it does
        // in single mode (entering a fight from an already-converted act is
        // the case that needs it).
        // ⭐⭐ Đợt 181 — `libAct`, NOT the resolved `activity`. The match is a
        // second home for the act, so it must be handed the same object single
        // mode works from: the LIBRARY one, still carrying its clue sets and
        // halves. Handing over the resolved copy left the two boards playing an
        // act that no longer knew it had sub-acts, so Options inside a match
        // could not offer them (measured: no ENG1/ENG2/VI1/VI2 row, no
        // PRACTICE/HOMEWORK row) — and a fight's Apply saved that stripped copy
        // back over the real act. core/fight.js resolves it itself now.
        startFight(root, matchAct, { onExit, base: originAct });
        awEmit("FIGHT", "on");
      } catch (e) {
        console.warn("AWord: fight mode failed to load", e);
        startGame(root, libAct, { onExit, base });
      }
    };
    row.append(goBtn);
    panel.append(row);
  }
  // ⛔ Đợt 188 — THE MATCH'S OWN FULLSCREEN BUTTON IS GONE (teacher, 18/8/2026).
  // Đợt 124 put one here, in the shared row beside Options/Template/Style/MODE,
  // because the per-board buttons could each only promote their own half of the
  // match. The teacher has now dropped the feature from Fight and Showdown
  // outright, so the button is not built at all rather than left hidden.
  // `fight.ctl.toggleFullscreen()` STAYS in core/fight.js: it is still what keeps
  // the `.is-fs` class honest when the browser goes full screen by its own means
  // (F11), and it is the only code that knows the match root holds both boards +
  // the strip + this row.

  const belowRight = el("div", "aw-below-right");
  // ⛔ Đợt 194 — THE EDIT BUTTON IS GONE FROM THIS ROW (thầy, 18/8/2026:
  // "Chuyển tính năng nút edit content trong mọi mode vào việc giữ nút Options
  // => Pop-up nhỏ hỏi có muốn edit content không => xác nhận rồi mới vào edit chứ
  // không bấm trực tiếp nút edit ở ngay dưới khung act nữa"). Editing now hangs off
  // a PRESS-AND-HOLD of the Options button, behind a confirm popup — see
  // `canEditNow()` / `buildEditConfirmPanel()` / `openEditor()` down where the
  // tool buttons are wired.
  // ⛔ Đợt 195 — AND THE HOME BUTTON IS GONE FROM HERE TOO (thầy, 18/8/2026:
  // "tích hợp nút trang chủ vào nhấn giữ nút mode, nhấn vào thì hiện pop-up hỏi có
  // muốn về trang chủ không, đồng ý thì mới về"). Going home now hangs off a
  // PRESS-AND-HOLD of the MODE button, behind a confirm popup — see `goHome()`
  // and `buildHomeConfirmPanel()`. TWO buttons left in this cluster.
  // ⭐ That also GIVES Home to a match for the first time: this whole cluster is
  // `visibility: hidden` inside a fight (app.css `.aw-fight-bottom
  // .aw-below-right`), so until now leaving a match for the library took two
  // steps — Mode ▸ Single mode, and only then Home.
  const assignBtn = toolBtn(icons.assignment, "Set assignment", true);
  const printBtn = toolBtn(icons.print, "Print", true);
  belowRight.append(assignBtn, printBtn);
  // ⭐⭐⭐ Đợt 245 (23/8/2026, thầy) — SOME GAMES CANNOT BE HOMEWORK, AND THE
  // BUTTON SAYS SO INSTEAD OF LYING.
  //
  // Three templates declare `noAssignment` (a sentence, not a boolean — the
  // reason IS the flag, so there is no second list of explanations to keep in
  // step): Speaking cards, Running word, Running team. Each of them would take
  // the teacher all the way through the Set assignment form and out the other
  // side with something broken: Speaking cards never calls ui.finish(), so NOT
  // ONE result would ever arrive; the two Running games replace the whole end
  // panel via renderSummary without reading `session`, so the pupil never sees
  // "SENT TO YOUR TEACHER" and the three end-of-game tick-boxes do nothing.
  // Their own files carry the full reasoning and what it would take to lift it.
  //
  // ⚠️ DIMMED, NOT HIDDEN, AND STILL CLICKABLE — the Đợt 220 lesson, stated by
  // thầy himself about the Questions each strip: a control that sits greyed out
  // "và không có gì trên màn nói vì sao" reads as a bug in the app. The tap is
  // what explains it. `pointer-events` therefore stays ON (see .aw-toolbtn.is-dim
  // in core/app.css) — the dimming is the hint, the toast is the answer.
  //
  // ⛔ The gate is HERE and only here: assignments already given out before this
  // đợt keep opening, keep playing and keep collecting, because nothing on the
  // student path or in Results asks this question.
  if (tpl.noAssignment) {
    assignBtn.classList.add("is-dim");
    assignBtn.title = "Cannot be set as homework — " + tpl.noAssignment;
  }
  // Set assignment -> the setup form; a new assignment appears as a strip below.
  assignBtn.onclick = async () => {
    sound.click();
    if (tpl.noAssignment) { toast(tpl.noAssignment); return; }
    const ui = await import("./assignment-ui.js");
    // `libAct` again (Đợt 145): the assignment snapshot must keep every clue
    // set, so the teacher can still switch the given act between them later.
    ui.openAssignmentSetup(libAct, { onCreated: loadAssignmentBars });
  };
  // Print opens a popup to pick a worksheet FORMAT (Anagram/Crossword/Quiz/
  // Unjumble) — the whole flow lives in core/print.js (generic, template-agnostic).
  // ⭐ Đợt 225 — re-resolve off `libAct` AT CLICK TIME, not the closed-over
  // `activity`. Same trap Đợt 145 fixed for begin(): Options ▸ Apply on this
  // READY screen writes the picked clue set straight onto `libAct.options`
  // (Object.assign, mutated in place) but deliberately does NOT rebuild
  // `activity.content` — that only gets re-baked on Play, "options take effect
  // on Play". `activity` here is still the copy resolveActivity() built at
  // mount, frozen on whichever set (ENG1) was active back then, so printing
  // straight from it always printed the FIRST set regardless of what the
  // teacher had since picked. `resolveActivity(libAct)` re-reads the current
  // choice every time the button is pressed — cheap and idempotent, exactly
  // begin()'s fix, just for the READY-screen Print button instead of Play.
  printBtn.onclick = () => { sound.click(); openPrintPopup(resolveActivity(libAct)); };

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
  // ⭐ Đợt 216 — "has PLAY been pressed", asked separately from "is the overlay
  // still in the DOM". They used to be the same question; they stopped being one
  // the moment the overlay stayed on as an invisible shield for START_GUARD_MS
  // after the game had already mounted. The one reader (Options ▸ Apply, far
  // below) means the first, so it now asks for the first.
  let playStarted = false;
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
  // ⭐⭐⭐ Đợt 246 (thầy) — STUDENT MODE STARTS WITH A CHOICE, NOT A BUTTON:
  // PRACTICE (left, amber dumbbell — nothing leaves the page) | SUBMIT (right,
  // the old START triangle — the play is handed in). Chosen fresh on EVERY
  // ready screen, "Start again" included (thầy chốt qua AskUserQuestion), so
  // `hwMode` is per-play state, never remembered.
  // ⚠️ A "Start with mistakes" round is practice BY NATURE — it plays a partial
  // act, so submitting it would hand in a bài tập cụt. It gets the PRACTICE
  // button alone, and hwMode can never be "submit" while `_mistakes` is set.
  // ⚠️ `playControl` is what the Đợt 122 prep gate hides/reveals — in student
  // mode that must be the whole pair, not the (unmounted) bigPlay.
  let hwMode = null;                 // "practice" | "submit" | null (teacher/fight)
  let playControl = bigPlay;
  let practiceBtn = null, submitStartBtn = null;
  if (session) {
    const mkStart = (cls, icon, label, title) => {
      const b = el("button", "aw-startbtn " + cls);
      b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
      b.append(el("span", "aw-startbtn-ic", icon), el("span", "aw-startbtn-label", label));
      return b;
    };
    const duo = el("div", "aw-ready-duo");
    practiceBtn = mkStart("is-practice", icons.practiceBig, "PRACTICE", "Practice — not sent to your teacher");
    duo.append(practiceBtn);
    if (!activity._mistakes) {
      submitStartBtn = mkStart("is-submit", icons.playBig, "SUBMIT", "Submit — sent to your teacher");
      duo.append(submitStartBtn);
    }
    playControl = duo;
    readyCenter.append(duo);
  } else {
    readyCenter.append(bigPlay);
  }
  // below the play button: the GAME (template) name, big & bold (replaces the
  // instruction line). A "Start with mistakes" run says so right here — the
  // teacher must be able to tell the two apart at a glance from across the
  // room, BEFORE pressing Play (Đợt 84).
  const gameName = (tpl.name || activity.type) + (activity._mistakes ? " with mistakes" : "");
  readyCenter.append(el("div", "aw-ready-game", escapeText(gameName).toUpperCase()));
  // ⭐ Đợt 199 — WHO is about to play, right under the template name:
  // "TUẤN KHANG - A1A". Only in student mode (an assignment opened from
  // myLesson), where both name and class come from the login ID — the teacher's
  // own screen has no session and shows nothing here.
  // Lớp có thể chưa được truyền sang (link cũ, hoặc bài giao mở tay) ⇒ chỉ ghi
  // mỗi tên, đừng để lòi ra dấu gạch cụt lủn.
  if (session && session.playerName) {
    // Đợt 201 — thầy chốt dấu ngăn là "•" (CHẤN PHONG • B2B), không phải "-".
    const ai = String(session.playerName).trim() +
      (session.className ? " • " + String(session.className).trim() : "");
    readyCenter.append(el("div", "aw-ready-ai", escapeText(ai).toUpperCase()));
  }
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

    playControl.style.display = "none";   // Đợt 246: the whole start control (pair or single)
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
      readyCenter.insertBefore(prep, playControl);
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
      playControl.style.display = "";
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
  // ⭐ Đợt 246 — the body is a named function now, because up to THREE buttons
  // start a game: bigPlay (teacher/fight), PRACTICE and SUBMIT (student mode,
  // which set `hwMode` first). Everything inside is byte-for-byte the old
  // handler apart from disabling all start buttons together.
  function startPressed() {
    bigPlay.disabled = true;
    if (practiceBtn) practiceBtn.disabled = true;
    if (submitStartBtn) submitStartBtn.disabled = true;
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
    playStarted = true;
    // ⭐⭐ Đợt 216 (thầy, 20/8/2026) — THE OVERLAY STAYS A SHIELD FOR HALF A SECOND.
    // "ngay khi start đã bấm được ngay nội dung rồi nên một số pha vừa bấm start
    // xong bấm nhầm ngay nội dung bên dưới". Two things made that unavoidable:
    // press() fires at pointerDOWN (Đợt 175), so START lands the instant a finger
    // touches the panel, and this line used to switch the overlay's
    // `pointer-events` off on the very next statement — with begin() mounting the
    // game one line further down. A second tap a hundred ms later went straight
    // into a board that had existed for a hundred ms.
    // ⭐ NO NEW ELEMENT: `.aw-play-overlay` is already `inset:0` over the whole
    // frame, so simply NOT switching its pointer-events off leaves a shield that
    // is already the right size and in the right layer. It fades out on schedule
    // (260ms) and keeps swallowing taps, invisible, until the guard is up.
    // ⚠️ ONE TIMER, NOT TWO. The old pair (`fade.onfinish` + a 350ms fallback)
    // existed because a hidden tab can stall animation events — that reasoning
    // still stands, and is exactly why removal now hangs off the plain setTimeout
    // ALONE and never off the animation: an `onfinish` here would uncover the game
    // at 260ms and quietly undo the guard.
    let removed = false;
    const removeOverlay = () => { if (removed) return; removed = true; playOverlay.remove(); };
    playOverlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease", fill: "forwards" });
    setTimeout(removeOverlay, START_GUARD_MS);
    begin();
  }
  press(bigPlay, startPressed);
  if (practiceBtn) press(practiceBtn, () => { hwMode = "practice"; startPressed(); });
  if (submitStartBtn) press(submitStartBtn, () => { hwMode = "submit"; startPressed(); });

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
  //   • `Idle` stepper 1..5s — the PERIOD, not just the opening grace (Đợt 187):
  //     the first charge lands after that many idle seconds ("cho suy nghĩ 3 giây
  //     mới bắt đầu trừ") and every further charge is one full period later, for
  //     as long as the stall lasts. Idle 3s ⇒ charges at 3s, 6s, 9s.
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
    // ⭐⭐ Đợt 214 (thầy, 20/8/2026) — NO LONGER TIED TO THE WHOLE-GAME TIMER.
    // Until now `timerMode() === "none"` also returned 0, which made Timer=None
    // a SILENT kill switch: the Options panel still let the teacher drag Time
    // cost up (measured on the real library: an act saved with timeCost 58 +
    // timer "none" — he stood in class watching time pass and nothing being
    // deducted, on every machine, because the act data is shared). The teacher's
    // call: the slider alone decides, whatever the clock mode. The flight effect
    // handles the no-visible-clock case itself (see flyTimeCost in timecost.js).
    if (!tpl.timeCost) return 0;
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
    // ⭐ Đợt 219 — hỏi `playPaused()` (khai further down this same closure — safe to
    // read here because idleTick can only ever run after PLAY, long after the whole
    // of startGame() has finished executing). Nó gộp CẢ BỐN lý do tạm dừng, không
    // riêng pop-up của bàn này — xem chính hàm đó để biết vì sao.
    if (playPaused() || (idleGuard && idleGuard())) return;
    idleMs += dt;
    const grace = idleGraceMs();
    // ⭐ Đợt 187 (teacher, 18/8/2026) — ONE PERIOD, NOT "grace then every second".
    // Until now the Idle stepper only bought the FIRST charge: after it, the
    // clock billed once per SECOND for as long as the stall lasted, so Idle 3s
    // charged at 3s, 4s, 5s… (9 seconds of sitting still = SEVEN charges). The
    // teacher's rule is that the number on the stepper is the whole period:
    // "cứ mỗi 3s không thao tác thì mới trừ điểm 1 lần chứ không riêng 3s đầu…
    // 9s không thao tác thì trừ 3 lần điểm" ⇒ 3s, 6s, 9s = three charges.
    // ⚠️ This makes the option ~N times CHEAPER per stall at Idle N (same points,
    // charged N times less often) — deliberate, and the reason the label under
    // the slider now names the period ("per idle 3s") instead of "per idle second".
    // A `while` (not an `if`): a tab that was throttled or backgrounded can hand
    // us a dt of several periods, and the student really was idle for all of them.
    while (idleMs >= grace * (idleCharges + 1)) {
      idleCharges++;
      chargeIdlePeriod(per);
      if (torndown) return;
    }
  }
  function chargeIdlePeriod(points) {
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
    // ⭐ Đợt 219 — nay là `playPaused()`: bàn kia bấm Menu trong Fight cũng phải
    // đóng băng đồng hồ CÂU của bàn này, nếu không thì đội bị dừng oan mất mấy giây
    // và ở chế độ đếm ngược là mất luôn câu đó.
    if (playPaused()) { roundBank(); return; }
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
    }
    // TIME COST (Đợt 139) — the idle clock starts with the real one, never
    // before PLAY. ⭐ Đợt 214: OUTSIDE the timer-mode branch, because Time cost
    // no longer needs the visible clock (timeCostPer() stopped returning 0 for
    // Timer=None). Still a no-op when the slider is Off — startIdleWatch()
    // checks timeCostPer() itself, so a game without the option allocates
    // nothing, exactly as before.
    startIdleWatch();
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
    // ⚠️ Đợt 197 — `applyBalance` again, not just `resolveActivity`: this line
    // re-reads the act from the library, which would quietly undo the Balance
    // questions trim the mount had already applied. One re-resolve, one re-trim.
    // ⭐ Đợt 220 — và applySdDeal, cùng lý do: begin() đọc lại act từ thư viện,
    // không chia lại là Start again chơi mảng gốc trần trụi. Mỗi lần chia là một
    // bộ bài mới — Start again đổi bài, đúng nết shuffle xưa nay.
    activity = applySdDeal(applyBalance(resolveActivity(libAct)));
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
  // Which BUILDER the open panel is showing (Dot 192) - see openToolPanelFor().
  let activeToolBuild = null;
  let panelCompactObs = null;   // ResizeObserver for is-compact-opts (Đợt 134) — see openToolPanel

  // fade = true -> animate opacity out before removing (a real user-initiated
  // close: outside click, or toggling the open button again). fade = false ->
  // remove instantly (used when SWITCHING to a different tool button, since a
  // new panel fades in immediately on top — an extra fade-out there would just
  // look like a delay — and on full teardown/restart where no one is watching).
  function closeToolPanel(fade = true) {
    const dim = toolDim, panel = toolPanelEl, btn = activeToolBtn;
    toolDim = null; toolPanelEl = null; activeToolBtn = null; activeToolBuild = null;
    panelCompactObs?.disconnect(); panelCompactObs = null;
    document.removeEventListener("pointerdown", onToolOutside);
    if (btn) btn.classList.remove("is-active");
    if (!dim && !panel) return;
    // Đợt 217 — SAU dòng trên, để cú `closeToolPanel(false)` dọn dẹp ở đầu
    // openToolPanel (lúc chưa có bảng nào) không thả đồng hồ chạy rồi khoá lại ngay.
    exitPause("panel");
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
    // Đợt 192 — WHICH panel is up, not just which button opened it. The Mode
    // button still leads to more than one screen (picker / confirm), so "is
    // this already open?" can't be answered by the button alone — see
    // openToolPanelFor(). (Đợt 228 — Template no longer has a panel of its own
    // to disambiguate against: picking a game now happens INSIDE Options.)
    activeToolBuild = buildContent;
    toolPanelEl.classList.toggle("is-opts", buildContent === buildOptionsPanel);
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
    // ⭐⭐ Đợt 217 (thầy) — MỌI BẢNG CÔNG CỤ NAY DỪNG VÁN CHƠI, y như ☰ Menu.
    // ⚠️ `dim:false` — `.aw-tool-dim` vừa được đắp lên cả khung nhìn ở trên; thêm tấm
    // che sân nữa là tối gấp đôi so với chính nó lúc mở Menu.
    // ⚠️ Không đặt trong `twoBeatPanelSwap` (đổi Options ▸ Template): ở đó bảng vốn
    // ĐANG mở nên lý do "panel" đã nằm sẵn trong tập, thêm lần nữa là vô hại nhưng
    // thừa — `enterPause` tự bỏ qua lý do trùng.
    enterPause("panel", { dim: false });
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

  // ⭐⭐ Đợt 194 — ONE BUTTON, TWO JOBS: tap opens Options, PRESS-AND-HOLD asks
  // whether to edit the content (thầy, 18/8/2026). Same helper, same 420ms and the
  // same reasons as Đợt 192's Template/Style pair — see core/press.js.
  // ⚠️ `openToolPanelFor`, NEVER `openToolPanel`: called with the button that is
  // already lit, `openToolPanel` CLOSES the popover (that is the "tap the open
  // button again" gesture), so holding while Options was open would just shut the
  // panel instead of showing the question. Đợt 192 met this exact trap.
  // ⚠️ The hold does NOT edit — it only opens the question. Nothing on this
  // toolbar may leave a running game on a gesture alone.
  tapOrHold(optionsBtn, {
    onTap: () => openToolPanelFor(optionsBtn, buildOptionsPanel),
    onHold: () => { if (canEditNow()) openToolPanelFor(optionsBtn, buildEditConfirmPanel); }
  });
  // ⭐⭐ Đợt 195 — MODE: tap = the picker, PRESS-AND-HOLD = "Go home?".
  // ⚠️ Never switches mode on the bare tap (teacher, 12/8/2026): a stray tap used
  // to drop a running match straight back to single mode with no way back. That
  // is unchanged — every route out of the picker still ends in a confirm screen
  // or the Showdown table, and Home has now joined them.
  // ⚠️ `openToolPanelFor` for the same reason Options and Template use it (see
  // below): `openToolPanel` called with the button already lit CLOSES the popover.
  if (modeAvail) {
    tapOrHold(modeBtn, {
      onTap: () => openToolPanelFor(modeBtn, buildModePickPanel),
      onHold: () => openToolPanelFor(modeBtn, buildHomeConfirmPanel)
    });
  } else {
    // No mode to pick — the button IS Home (see where it is built), so the plain
    // tap must reach the question. A hold here would be a gesture with nothing
    // behind it.
    modeBtn.onclick = () => openToolPanelFor(modeBtn, buildHomeConfirmPanel);
  }

  /**
   * Đợt 192 — `openToolPanel` alone cannot serve a button with two panels:
   * called with the button that is ALREADY active it CLOSES the popover, because
   * that is the "tap the open button again" gesture. So holding while Template
   * was open would just shut the panel instead of showing Style. Same content
   * still toggles (the gesture is intact); DIFFERENT content swaps in place,
   * exactly as the mode picker's own screens do.
   */
  function openToolPanelFor(btn, build) {
    if (activeToolBtn === btn && activeToolBuild !== build) { switchToolPanel(build); return; }
    openToolPanel(btn, build);
  }

  // ⛔ Đợt 194 — EDIT CONTENT IS SINGLE MODE ONLY (thầy chốt, 18/8/2026:
  // "chỉ cho edit trong single"). Fight · Showdown · Running · IPA all say no, and
  // that DELIBERATELY NARROWS what was on offer: only Fight used to hide the Edit
  // button (in CSS, `.aw-fight-bottom .aw-below-right`), so Showdown, Running and
  // IPA could all reach it until this đợt. The teacher was asked and chose this.
  // ⚠️ Asked AT THE MOMENT OF THE HOLD, not once while the button is built — the
  // gesture must answer for the state the board is in when the finger lifts.
  // `fight` and `playMode` are fixed for the life of a mount; `showdownPick` is a
  // `const` too, because turning Showdown ON re-enters startGame() (see its
  // declaration) — with one documented exception, cancelMyTeam() in
  // core/showdown-setup.js, which clears the pick WITHOUT restarting the play.
  // That exception can only ever make this STRICTER (a board still wearing its
  // Showdown chrome keeps saying no), never looser, which is the safe direction.
  function canEditNow() { return !session && !fight && !showdownPick && !playMode; }

  /**
   * Đợt 194 — the small popup the hold opens. NOT a mode confirm: Cancel simply
   * closes it (there is no picker behind this one to go back to).
   * ⚠️ A NAMED function declared once, never an arrow built per call:
   * mountPanelContent() and capPanelHeight() identify panels BY FUNCTION IDENTITY
   * (`buildContent === buildOptionsPanel`), and a fresh closure each time would
   * quietly never match — the popup could then inherit `is-opts` and be stretched
   * to the width of the whole Options grid.
   */
  function buildEditConfirmPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Edit content?"));
    panel.append(el("div", "aw-mode-confirm-text",
      "Leaves the game and opens the editor for this activity."));
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); closeToolPanel(true); };
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", "Edit content");
    goBtn.type = "button";
    goBtn.onclick = () => { sound.click(); closeToolPanel(false); openEditor(); };
    row.append(cancelBtn, goBtn);
    panel.append(row);
  }

  /**
   * Đợt 195 — "Go home?", the popup the MODE button's hold opens. Same shape
   * and the same classes as the Edit one above and as the four mode confirms, and
   * a NAMED function for the same reason (panels are identified by function
   * identity — see buildEditConfirmPanel's note).
   * The line underneath says what is about to be LEFT, because that differs a
   * great deal by mode: a match ends, a Showdown team survives, a play mode is
   * simply left. "Home" on a board with a live match behind it must not read the
   * same as "Home" on a quiet READY screen.
   */
  function buildHomeConfirmPanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Go home?"));
    panel.append(el("div", "aw-mode-confirm-text",
      fight ? "Ends the match and goes back to your library."
        : showdownPick ? "Leaves this activity and goes back to your library. Your team is kept."
          : playMode ? "Leaves this mode and goes back to your library."
            : "Leaves this activity and goes back to your library."));
    const row = el("div", "aw-mode-confirm-row");
    const cancelBtn = el("button", "aw-btn aw-mode-confirm-btn", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.onclick = () => { sound.click(); closeToolPanel(true); };
    const goBtn = el("button", "aw-btn aw-btn-primary aw-mode-confirm-btn", "Home");
    goBtn.type = "button";
    goBtn.onclick = () => { sound.click(); closeToolPanel(false); goHome(); };
    row.append(cancelBtn, goBtn);
    panel.append(row);
  }

  /**
   * Đợt 195 — what the old Home button did, plus the one thing it never had to
   * think about, because CSS kept it out of a match: A MATCH IS TWO ENGINES.
   * `cleanupAll()` belongs to THIS closure and stops board 0 only — board 1's
   * 500ms clock would go on ticking behind the library, which is precisely the
   * ghost-clock bug Đợt 131 was opened for (the teacher heard a "time's up" cue
   * with two minutes left on the visible clock). The match controller is the only
   * thing holding both boards' teardowns, so it does the stopping.
   * ⚠️ The Showdown pick is deliberately NOT dropped: it lives in sessionStorage
   * and is meant to survive from act to act (that is how the teacher plays a whole
   * lesson as the same team), and the old Home button never dropped it either.
   */
  function goHome() {
    sound.click();
    exitAnyFullscreen();
    if (fight) {
      fight.ctl.exitToLibrary();
      awEmit("FIGHT", "off");   // same signal every other way out of a match sends
      return;
    }
    cleanupAll();
    onExit?.();
  }

  /**
   * ⭐⭐ Đợt 194 — THE EDITOR ALWAYS GETS THE ACT THE TEACHER OWNS, and that
   * act's OWN template. In a plain play `libAct` is already it and this is
   * byte-for-byte the old Edit button. But two single-mode plays hand this
   * closure a THROWAWAY `libAct`:
   *   • "Change template"     — a converted copy (`_converted`, id "conv_…")
   *   • "Start with mistakes" — a cut-down copy of a few words (id "mist_…")
   * The old button edited THOSE. core/store.js does not find those ids in the
   * library, so Save filed a JUNK ACT at the library root and left the real act
   * untouched — silently, and the teacher's real content never changed. Same
   * lesson as Đợt 181's `subActOwner()`: ask who OWNS the content, never who is
   * on screen.
   * ⚠️ The two lines below are deliberately the SAME resolution Options ▸ Apply
   * already uses to decide what to persist (search `_mistakesBase` in this file).
   * Two answers to "which act is the real one" is how they drift apart.
   * ⚠️ The TEMPLATE must match the ACT, not the screen: inside a converted play
   * `tpl` is the borrowed game's, and its editor cannot read the origin's content.
   * ⚠️ `ensureTemplate` before `getTemplate` — the origin's module is normally
   * loaded (it was played to get here) but `getTemplate` THROWS when it is not.
   */
  async function openEditor() {
    const realAct = activity._mistakes ? (activity._mistakesBase || originAct) : libAct;
    const target = realAct._converted ? originAct : realAct;
    // Belt and braces, the same test the Options save path applies: a throwaway
    // id must never reach saveActivity(). If the resolution above ever fails to
    // land on a real act, say nothing happened rather than breed a junk act.
    if (!target || (target.id && /^(conv|mist)_/.test(String(target.id)))) {
      toast("Nothing to edit here"); return;
    }
    let editTpl = null;
    try { await ensureTemplate(target.type); editTpl = getTemplate(target.type); }
    catch (e) { console.warn("AWord: could not load the editor's template", e); }
    if (!editTpl?.edit) { toast("Edit — coming soon"); return; }
    // Leave the game, open the editor. Save -> store + replay with the new
    // content; Cancel -> replay the act untouched.
    exitAnyFullscreen();
    cleanupAll();
    // ⚠️ Đợt 145 — the EDITOR gets the LIBRARY act, never the resolved copy: the
    // copy has the other clue sets stripped out, so saving it would delete three
    // quarters of a vocabulary act's content without a word of warning.
    editTpl.edit(root, target, {
      onSave: async updated => {
        const { saveActivity } = await import("./store.js");
        const saved = await saveActivity(updated);
        startGame(root, saved, { onExit });
      },
      onCancel: () => startGame(root, target, { onExit })
    });
  }

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
    // ⛔⛔ Đợt 190 — NO CLUE-SET ROW INSIDE A PLAY MODE, and this one is not
    // cosmetic. In both new modes the row is a DEAD control: RUNNING drops clues
    // altogether (its games race on bare words) and IPA builds every card from
    // the transcription whichever button is lit. Worse than dead, it was
    // actively destructive — picking a set and pressing Apply runs
    // applySubActSelection, whose rebuild goes through doSwitchTemplate() and so
    // re-converts with NEITHER the `style:"ipa"` that makes the cards read
    // "WORD /ipa/" NOR the `_mode` mark. Measured before the guard: the deck
    // silently turned into English definitions, the Template button came back
    // and the MODE button stopped glowing — a mode that fell apart with nothing
    // on screen to say why. The whole row goes, which is also the OPT-IN rule of
    // Đợt 143 applied honestly.
    if (playMode) return null;
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
  // @returns {Promise|false} A PROMISE when it has TAKEN OVER the restart — the
  //          caller must then do nothing else, because a second restart on top
  //          of doSwitchTemplate() would race the conversion it just started.
  //          `false` when there was nothing for it to do.
  //          ⭐ Đợt 206 — it used to return the bare `true` and drop the promise
  //          on the floor. Both original callers only ask "did you take over?",
  //          and a promise is truthy, so they are unchanged; but myActivity's
  //          bridge needs to be able to WAIT for the rebuild, or its per-pane
  //          checkmark would be drawn while the pane is still converting.
  function applySubActSelection(selState) {
    // subActSource() only hands back the origin for an act converted FROM it, so
    // this inequality IS the converted case.
    const convSrc = subActSource();
    if (convSrc === subActOwner()) return false;
    const beforeKey = viewKeyOf(convSrc);
    const afterKey = viewKeyOf({ ...convSrc, options: { ...(convSrc.options || {}), ...selState } });
    if (beforeKey === afterKey) return false;
    if (!convSrc.options) convSrc.options = {};
    VIEW_SELECTOR_KEYS.forEach(k => { if (selState[k] !== undefined) convSrc.options[k] = selState[k]; });
    closeToolPanel(false);
    return Promise.resolve(doSwitchTemplate(activity.type));   // re-converts from the origin, then restarts
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
    // myActivity: fires once, right as the team-picker SCREEN opens — not once
    // teams are picked. Teacher's call (22/8/2026): other panes should only
    // open their OWN copy of this same screen, never inherit these picks.
    awEmit("MODE", "showdown");
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
        // ⭐ Đợt 197 — HOW MANY QUESTIONS THIS ACT HAS, so the class screen can show
        // the teacher what each pupil will get BEFORE they commit to a number of
        // teams (the QUESTIONS box beside Teams). Counted here rather than in the
        // panel because only the engine knows which array of the act's content is
        // the playable one — see `playItemCount`.
        questionCount: playItemCount(),
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
          awEmit("MODE", "single"); // myActivity: this is a second door back to Single, same as buildModeConfirmPanel's
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
    // myActivity Đợt "đồng bộ tức thời" (22/8/2026) — fires once, right as this
    // popover opens (not per internal showBody() swap between Options/Template/
    // Style — those all live inside this ONE panel since Đợt 228 today, so one
    // emit here already covers all three). Host relays it by clicking the SAME
    // Options button on every other pane, so all boards open together.
    awEmit("TOOLOPEN", "options");
    // ⭐⭐ Đợt "đồng bộ tức thời" — WRAPS `draft` in a Proxy so every one of the
    // ~20 scattered `draft.xxx = v` call sites in options-panel.js (steppers,
    // checkboxes, segmented controls) keeps working byte-for-byte, but now also
    // trips a throttled live-preview broadcast. Nothing about the control code
    // itself changes — this is the ONE choke point a Proxy buys for free.
    let optLiveTimer = null, optLivePending = false;
    function scheduleOptLive() {
      if (optLiveTimer) { optLivePending = true; return; }
      optLiveTimer = setTimeout(() => {
        optLiveTimer = null;
        awEmit("OPTLIVE", JSON.stringify(draft));
        if (optLivePending) { optLivePending = false; scheduleOptLive(); }
      }, 350); // trailing-throttle: 1 gói mỗi ~350ms lúc đang kéo dở, không bắn theo từng pixel
    }
    function liveDraft(obj) {
      return new Proxy(obj, { set(target, prop, value) { target[prop] = value; scheduleOptLive(); return true; } });
    }
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
    let draft = liveDraft({ ...base });
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
    // ⭐ Đợt 181 — THE ACT THE PER-VIEW OPTIONS BELONG TO (Đợt 147's `viewOptions`).
    // In single mode that is `libAct`, exactly as before. In a match `libAct` is
    // this board's frozen resolved copy, whose view key is always null — so
    // picking VI1 inside a fight would change the clue set but NOT bring VI1's
    // own clock/lives/penalty with it, and nothing applied in a match would ever
    // be stored per view. `matchAct()` is the match's `libAct`, which makes a
    // fight behave exactly like single mode here: a real act with sub-acts gets
    // per-view options, a converted one (no sub-acts of its own) does not.
    const viewAct = subActOwner();
    const selSrc = src === viewAct ? base : (src.options || {});

    // ⭐ Đợt 147 — ONE SET OF OPTIONS PER VIEW. Picking ENG2, or VI1, or the
    // homework half, now also swaps every other control in this panel to that
    // view's own settings (teacher, 14/8/2026 — reading Vietnamese clues is a
    // different exercise from listening to English ones, and wants its own
    // clock, lives and penalties). `viewKeyOf` is null for an act with neither
    // clue sets nor halves, i.e. the entire library before Đợt 145, and then
    // every line below is inert and this panel behaves exactly as it did.
    let curKey = viewKeyOf(viewAct);   // Đợt 181 — `viewAct`, see its own note above
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
      const nextKey = viewKeyOf({ ...viewAct, options: { ...draft, ...selState } });
      if (!nextKey || nextKey === curKey) return;
      pending[curKey] = draft;                       // park the view we are leaving
      const seed = pending[nextKey] || optionsForView(viewAct, nextKey)
        || (settingsMod ? settingsMod.getDefaultOptions(viewAct.type) : draft);
      draft = liveDraft({ ...splitViewOptions(seed).view, ...selState });
      curKey = nextKey;
      pending[curKey] = draft;
      scheduleOptLive(); // đổi hẳn view (ENG1/VI1/...) là một cú đổi lớn — báo ngay, đừng đợi lần kéo kế tiếp
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
        showdown: !!showdownPick,
        // ⭐ Đợt 220 — trần cứng của ô số Count. ⚠️ Đếm trên ACT GỐC trong thư
        // viện chứ không phải `activity`: ván đang chạy có thể ĐÃ bị nối dài
        // (500 slot) hoặc bị Balance cắt ngắn — đưa con số đó vào là trần sai.
        sdItemCount: playItemCount(resolveActivity(libAct))
      });
      switchesBuilt = true;
    }

    // ----- FOOTER: "current template" button (Đợt 228) + Apply -----
    // Merged in from the old standalone Template toolbar panel (thầy,
    // 22/8/2026: "bỏ luôn nút Template cũ bên ngoài", then "style cũng đưa luôn
    // vào trong nút Template bên trong options, mở bằng cách nhấn giữ"). One
    // button now carries the exact tap/hold pair the toolbar's merged
    // Template+Style button carried before Đợt 228 (see core/press.js's
    // `tapOrHold`, same helper): TAP swaps this panel's body for the game
    // picker, HOLD swaps it for Style — same panel, same popover, never
    // closed. Picking a game there hands off to doSwitchTemplate() without
    // this footer doing anything else; picking a theme in Style applies live,
    // same as it always has.
    // `bodyView` tracks which of the three bodies is showing so a second tap
    // (or the picker/Style's own close button) knows to swap back to
    // `buildBody` rather than just toggling blindly.
    let bodyView = "options", switching = false, tplBtn = null;
    function showBody(view) {
      if (bodyView === view) return;
      bodyView = view;
      if (tplBtn) tplBtn.classList.toggle("is-open", view !== "options");
      const builder = view === "template" ? buildTemplatePickerBody
                     : view === "style" ? buildStyleBody
                     : buildBody;
      swapContents(bodyHost, builder, () => { if (toolPanelEl) capPanelHeight(buildOptionsPanel); });
    }
    const footWrap = el("div", "aw-opt-foot");
    // ⚠️ ALWAYS built, unlike the old `if (templateSwitchAvailable)` gate —
    // Style must stay reachable in EVERY mode (IPA, Running word, Running
    // team included), exactly as the toolbar button guaranteed before. When
    // Change Template does not apply here, this button IS Style outright:
    // its own icon, plain tap, nothing to hold for — the same fallback
    // `tplLocked` used to give the toolbar button, just relocated.
    tplBtn = el("button", "aw-opt-tplbtn");
    tplBtn.type = "button";
    if (templateSwitchAvailable) {
      tplBtn.append(
        el("span", "aw-opt-tplbtn-icon", templateIcon(icons, activity.type)),
        el("span", "aw-opt-tplbtn-name", escapeText(templateLabel(activity.type)))
      );
      tplBtn.title = "Tap to change template · hold for Style";
      tapOrHold(tplBtn, {
        onTap: () => { sound.click(); showBody(bodyView === "template" ? "options" : "template"); },
        onHold: () => { sound.click(); showBody("style"); }
      });
    } else {
      tplBtn.append(el("span", "aw-opt-tplbtn-icon", icons.style), el("span", "aw-opt-tplbtn-name", "Style"));
      tplBtn.onclick = () => { sound.click(); showBody(bodyView === "style" ? "options" : "style"); };
    }
    footWrap.append(tplBtn);
    // APPLY — only now does the draft get written into activity.options.
    // Clicking outside without pressing this discards every change above.
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
        Object.entries(pending).forEach(([k, o]) => storeViewOptions(viewAct, k, o));
        Object.keys(activity.options).forEach(k => { if (!(k in draft)) delete activity.options[k]; });
      }
      Object.assign(activity.options, draft);
      // FIGHT MODE: each board plays a COPY of the act (its own frozen word
      // order), so writing into this copy's options would leave the real act —
      // and the other board — untouched. Hand the whole draft to the match,
      // which owns the real act, saves it, and rebuilds BOTH boards.
      if (fight) {
        // ⭐ Đợt 181 — a CONVERTED match act cannot simply STORE the sub-act:
        // convert.js baked one clue set into its content, so "now it's VI1"
        // would move the row and leave the game where it was. Exactly the case
        // applySubActSelection() exists for in single mode — it writes the
        // choice onto the ORIGIN and re-converts from there, which in a match
        // goes through doSwitchTemplate()'s own fight branch and rebuilds both
        // boards. It returns false (and nothing is lost) for a match act that
        // owns its sub-acts, which just needs the re-resolve Apply gives it.
        if (applySubActSelection(selState)) return;
        // `replace: !!curKey` — the same rule the `if (curKey)` block above
        // applies in single mode: an act WITH sub-acts gets each view's set
        // written whole, so nothing survives from the view the teacher left.
        fight.ctl.applyOptions({ ...draft }, { replace: !!curKey });
        closeToolPanel(false);
        return;
      }
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
      const playing = playStarted;   // Đợt 216 — see playStarted's own note
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
    footWrap.append(applyBtn);
    panel.append(footWrap);

    // ----- INLINE TEMPLATE PICKER (Đợt 228) — swaps INTO `bodyHost`, so it
    // lives exactly "above the Template + Apply row" the teacher asked for,
    // and never spills outside the Options popover: it IS this panel's body,
    // for as long as the picker stays open. Same grid the old standalone
    // Template panel drew (icon + name, is-current / is-soon) — only where it
    // lives changed, not how it looks or which games are offered. Nested
    // INSIDE buildOptionsPanel (not a sibling like switchList() above) because
    // it reads `bodyView`/`tplBtn`/`showBody`, which belong to one sitting of
    // this one panel.
    function buildTemplatePickerBody(host) {
      const head = el("div", "aw-tool-panel-head aw-opt-subhead");
      const title = el("span", "", "Choose a template");
      title.append(el("span", "aw-tool-head-hint", "hold the button below for Style"));
      head.append(title);
      const close = el("button", "aw-opt-subhead-close", icons.close);
      close.type = "button"; close.title = "Back to options";
      close.onclick = () => { sound.click(); showBody("options"); };
      head.append(close);
      host.append(head);
      // Đợt 228 — thầy: "hiển thị được toàn bộ template mà không cần scroll".
      // This grid is swapped INTO the panel's own body rather than laid over
      // it, so the popover's height simply grows to fit every tile (same
      // trick every clue-set switch already uses) instead of being cropped to
      // whatever room the normal options body happened to leave —
      // capPanelHeight()'s scroll cap still exists underneath as a safety
      // net, but a 3-column grid of 17 tiles is nowhere near tall enough to
      // ever need it.
      const grid = el("div", "aw-tpl-grid");
      const canSwitch = new Set(switchList().map(t => t.type));
      ALL_TEMPLATES.forEach(t => {
        const isCurrent = t.type === activity.type;
        const enabled = !isCurrent && canSwitch.has(t.type);
        const cls = isCurrent ? " is-current" : (enabled ? "" : " is-soon");
        // Đợt 148 — icon + name, so a 560px-wide picker reads as a list of
        // games rather than two columns of stranded words (teacher's request).
        const item = el("div", "aw-tpl-item" + cls);
        item.append(el("span", "aw-tpl-icon", templateIcon(icons, t.type)),
                    el("span", "aw-tpl-name", escapeText(t.label)));
        if (enabled) {
          item.onclick = () => pickTemplate(t.type, item, grid);
        } else if (!isCurrent) {
          item.onclick = () => { sound.click(); toast(`${t.label} — doesn't fit this content`); };
        }
        grid.append(item);
      });
      host.append(grid);
    }

    // Picking a game hands off to doSwitchTemplate() — which converts the
    // content, then tears this whole mount down and rebuilds it fresh (see
    // its own comment) — while THIS tile spins to say "working on it, not
    // stuck" (thầy: "để tôi biết đang load chứ không phải lỗi hay lag"), and
    // `openOptionsOnMount` (module scope, same one-shot pattern as
    // `openShowdownOnMount` above) tells the FRESH mount to open its own
    // Options panel immediately instead of quietly landing on the READY
    // screen. That is the whole trick behind "the popup doesn't close, it
    // just becomes the new game's options": the popover the teacher is
    // looking at never really survives the switch, but a new one opens
    // itself before the gap would read as anything more than a loading
    // spinner.
    // ⚠️ Reaching the end of this function means the switch did NOT happen —
    // doSwitchTemplate() catches its own errors (toasts, then returns
    // normally rather than rejecting), and a REAL switch calls
    // cleanupAll()+startGame() — tearing this very DOM down, `item` included
    // — before the `await` below could ever resume. So clearing the spinner
    // here is only ever the FAILURE path; success is silent because there is
    // nothing left to clear it on.
    async function pickTemplate(targetType, item, grid) {
      if (switching) return;
      switching = true;
      sound.click();
      grid.classList.add("is-busy");
      item.classList.add("is-loading");
      if (!fight) openOptionsOnMount = true;
      await doSwitchTemplate(targetType);
      if (!fight) openOptionsOnMount = false;
      switching = false;
      grid.classList.remove("is-busy");
      item.classList.remove("is-loading");
    }

    // ----- STYLE body (Đợt 228, reached by holding the footer button) —
    // switch themes LIVE, no restart needed. Nested here for the same reason
    // as buildTemplatePickerBody: it needs `showBody` to get back to the
    // normal options. Content unchanged from the old standalone Style panel —
    // only where it lives (and how you get to it) moved.
    function buildStyleBody(host) {
      const head = el("div", "aw-tool-panel-head aw-opt-subhead", "Style");
      const close = el("button", "aw-opt-subhead-close", icons.close);
      close.type = "button"; close.title = "Back to options";
      close.onclick = () => { sound.click(); showBody("options"); };
      head.append(close);
      host.append(head);
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
      host.append(grid);
    }
  }

  // Which games this act's content can become. Only games whose data shape can
  // hold this act's content are clickable ("compatible group", teacher's call
  // 3/8/2026); the rest are dimmed. Clicking one converts the content and plays
  // it straight away — the original act in the library is never touched (see
  // doSwitchTemplate).
  // The games we can switch to are ALWAYS computed from the ORIGINAL act
  // (teacher, 4/8/2026). A "Change template" play only BORROWS the origin's
  // content, so the temp act must never become the source for the next switch:
  // converting is lossy, and asking the temp act what it can turn into silently
  // locked games out — e.g. from a temp Speaking cards (no answers at all)
  // NOTHING was switchable, and from a temp Anagram without clues every
  // clue-needing game disappeared. Reading the origin means every switch offers
  // the same full list, whichever temp game happens to be on screen.
  // switchTargets() drops the origin's OWN type, so we add it back while a temp
  // act is playing — that entry is how the teacher returns to the real act.
  // ⚠️ Stays at THIS scope (a sibling of buildOptionsPanel), not nested inside
  // it: runTargets()/openSwitchPicker() further up and down this file call it
  // too — moving it into buildOptionsPanel would take it away from both.
  function switchList() {
    const list = switchTargets(originAct);
    if (activity.type !== originAct.type) {
      const home = ALL_TEMPLATES.find(t => t.type === originAct.type && t.built);
      if (home) list.unshift({ type: home.type, label: home.label });
    }
    return list.filter(t => t.type !== activity.type);   // never offer what's already playing
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
  // ⭐⭐⭐ Đợt 217 (thầy, 20/8/2026) — TẠM DỪNG NAY CÓ **LÝ DO**, KHÔNG CÒN LÀ CÔNG TẮC.
  // Thầy giao hai việc mà hoá ra là cùng một việc:
  //   · *"Khi Fight, 1 bên bấm nút menu thì bên còn lại cũng tạm dừng game cùng"*
  //   · *"Trong mọi chế độ, bấm bất cứ nút tùy chỉnh nào mà hiện pop-up thì game đều
  //      tạm dừng như khi bấm menu (fight thì dừng cho cả 2)"*
  // Ba nguồn có thể cùng lúc đòi dừng một bàn — ☰ Menu · bảng công cụ (Options /
  // Template / Style / MODE) · bàn BÊN KIA dừng và chuyển tiếp sang — nên "đang dừng"
  // phải là một TẬP LÝ DO chứ không phải một cờ.
  // ⛔⛔ VÌ SAO KHÔNG DÙNG CỜ: mở Options rồi bấm ☰ Menu, đóng Menu — với một cờ thì
  // cú đóng đó thả đồng hồ chạy lại NGAY TRONG LÚC bảng Options vẫn còn che kín màn.
  // Đồng hồ chỉ được chạy lại khi lý do CUỐI CÙNG rời đi.
  // ⚠️ CHỈ "menu" VÀ "panel" MỚI CHUYỂN TIẾP. Lý do "relay" là do bàn kia gửi sang;
  // chuyển tiếp nó ngược lại là hai bàn gọi qua gọi lại vô tận.
  const pauseReasons = new Set();
  // ⭐⭐⭐ Đợt 219 (thầy, 21/8/2026) — *"Khi nhấn menu hoặc các pop-up tùy chỉnh thì
  // game đã dừng nhưng time cost vẫn chạy, cần dừng lại tất cả mọi thứ."*
  // MỘT CÂU HỎI DUY NHẤT cho mọi đồng hồ trong file này: "ván này có đang bị dừng
  // không?". Trước đợt này `idleTick` và `roundTick` mỗi cái tự hỏi lấy, và cùng hỏi
  // sai một kiểu — `menuEl || toolPanelEl` chỉ biết pop-up của CHÍNH bàn mình:
  //   · Fight, bàn kia bấm ☰ Menu ⇒ bàn này nhận lý do `"relay"` (Đợt 217), sân đã
  //     phủ tối, chạm không được — mà Time cost vẫn trừ điểm đều mỗi 3 giây;
  //   · bị máy khác giành team ⇒ lý do `"stolen"`, tấm chặn phủ kín, vẫn trừ;
  //   · và ai đó thêm một lý do thứ năm ở đợt sau sẽ lại thủng đúng chỗ này.
  // ⚠️ VẪN GIỮ `menuEl || toolPanelEl` bên trong, chứ không đổi hẳn sang tập lý do:
  // hai biến đó là SỰ THẬT TRÊN MÀN HÌNH (pop-up có đang che hay không), còn tập lý
  // do là bản ghi chép về nó. Hỏi cả hai thì một ngày nào đó chúng lệch nhau, câu trả
  // lời vẫn ngả về phía AN TOÀN — không trừ điểm.
  function playPaused() {
    return pauseReasons.size > 0 || !!menuEl || !!toolPanelEl;
  }
  function enterPause(reason, { dim = true } = {}) {
    if (pauseReasons.has(reason)) return;
    const first = pauseReasons.size === 0;
    pauseReasons.add(reason);
    // ⚠️ Tấm che sân KHÔNG phải của riêng ☰ Menu nữa, nhưng bảng công cụ thì KHÔNG
    // được thêm: `.aw-tool-dim` đã phủ tối cả khung nhìn rồi, chồng thêm một lớp nữa
    // là sân tối gấp đôi so với chính nó lúc mở Menu.
    if (dim && !stageDim) { stageDim = el("div", "aw-stage-dim"); }
    if (first) freezePlay();
    if (stageDim && !stageDim.isConnected) inner.append(stageDim);
    // FIGHT: bàn kia dừng theo — nhưng chỉ khi lý do là của CHÍNH bàn này.
    syncRelay(dim);
  }
  // ⭐⭐⭐ Đợt 219 — LỖ RÒ CỦA ĐỢT 217, vá ở đây.
  // Đợt 217 gửi tin sang bàn kia trên MỖI lần thêm/bớt lý do. Thêm thì vô hại (bàn
  // kia bỏ qua lý do trùng), nhưng BỚT thì không: mở Options rồi bấm ☰ Menu rồi đóng
  // Menu — cú đóng đó xoá đúng một lý do, ván NÀY vẫn đứng (còn "panel"), mà bàn KIA
  // đã nhận lệnh "chạy tiếp" và chạy thật, sau lưng tấm che vẫn phủ kín bên này.
  // Đó chính là cái bẫy mà chú thích của Đợt 217 mô tả — nhưng nó chỉ được bịt ở
  // NỬA TRONG (tập lý do của bàn mình), còn nửa gửi đi thì chưa.
  // ⚠️ "Của chính bàn này" = có lý do nào KHÁC `"relay"` hay không. Chỉ gửi khi câu
  // trả lời ĐỔI, nên chuyển tiếp không bao giờ dội qua dội lại.
  let relaySent = false;
  function syncRelay(dim = true) {
    if (!fight) return;
    let own = false;
    pauseReasons.forEach(r => { if (r !== "relay") own = true; });
    if (own === relaySent) return;
    relaySent = own;
    fight.ctl.setPaused?.(fight.side, own, dim);
  }
  function exitPause(reason) {
    if (!pauseReasons.delete(reason)) return;
    syncRelay();
    if (pauseReasons.size) return;      // còn lý do khác — chưa được chạy lại
    stageDim?.remove(); stageDim = null;
    thawPlay();
  }
  // Đợt 217 — thân của "đóng băng ván chơi", tách khỏi việc DỰNG tấm che: nay có ba
  // lý do có thể gọi tới nó, và chỉ ☰ Menu / bàn-kia mới kèm tấm che.
  // ⭐⭐⭐ Đợt 217 — "ĐỘI NÀY VỪA BỊ MÁY KHÁC LẤY MẤT" (thầy). Ván dừng hẳn tại chỗ.
  // ⛔⛔ TẤM CHẶN NÀY KHÔNG CÓ NÚT ĐÓNG, và đó là cả ý nghĩa của nó: thầy giao *"buộc
  // dừng game, không cho tiếp tục và yêu cầu phải chọn team để chơi lại"*. Nút duy
  // nhất trên đó MỞ BẢNG SHOWDOWN chứ không gỡ tấm chặn — bỏ bảng đi giữa chừng thì
  // ván vẫn đứng nguyên, y như trước khi bấm. Đường ra hợp lệ duy nhất là chọn một đội
  // rồi bấm Ready, mà Ready thì dựng lại ván từ đầu nên tấm chặn tự biến mất cùng nó.
  // ⚠️ Nó phủ `inner` (khung chơi), KHÔNG phủ hàng nút dưới khung — nút MODE phải còn
  // bấm được, nếu không thì lời hứa "chọn team để chơi lại" thành ngõ cụt.
  // ⚠️ Lý do tạm dừng mang tên riêng "stolen": bảng công cụ mở ra rồi đóng lại sẽ gỡ
  // lý do "panel" của nó, và nếu hai thứ dùng chung một lý do thì đúng cú đóng bảng đó
  // sẽ thả đồng hồ chạy lại sau lưng tấm chặn.
  let stolenEl = null;
  function showTeamStolen() {
    if (stolenEl || torndown || !showdownPick) return;
    closeMenu();
    enterPause("stolen", { dim: false });     // tấm chặn dưới đây đã là một lớp phủ đặc
    stolenEl = el("div", "aw-sd-stolen");
    const box = el("div", "aw-sd-stolen-box");
    box.append(
      el("div", "aw-sd-stolen-t", "TEAM TAKEN"),
      el("div", "aw-sd-stolen-s",
        `${showdownPick.teamName || "This team"} is being played on another screen now.`),
      el("div", "aw-sd-stolen-s2", "Choose a team to play again.")
    );
    const b = el("button", "aw-btn-primary aw-sd-stolen-btn", "Choose a team");
    b.type = "button";
    b.onclick = () => {
      sound.click();
      clearPick();
      if (modeBtn && modeBtn.isConnected) openToolPanel(modeBtn, buildShowdownPanelHost);
    };
    box.append(b);
    stolenEl.append(box);
    inner.append(stolenEl);
  }

  function freezePlay() {
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
    // ⛔ Đợt 219 — ĐÃ CÂN NHẮC RỒI BỎ: gom nốt những số "-N" đang bay (chúng là con của
    // `document.body`, không phải của sân, nên `stage.getAnimations()` không thấy).
    // Dừng được, nhưng KHÔNG NÊN: mỗi số tự có một `setTimeout` dọn xác (flyTimeCost,
    // vì `onfinish` không bao giờ bắn trong tab bị ẩn), nên đóng băng nó chỉ đổi
    // "con số bay nốt 0,6 giây rồi tan" thành "con số đứng chết giữa màn rồi biến
    // mất" — xấu hơn, mà rủi ro hơn. Từ đợt này ván đang dừng KHÔNG trừ điểm nữa, nên
    // cửa sổ để có một số đang bay lúc bấm Menu chỉ còn đúng 0,7 giây.
    pausedAnimations.forEach(a => { try { a.pause(); } catch { /* ignore */ } });
    // Optional per-template hook — for timers a template manages ITSELF
    // (its own setInterval game clock, spawn scheduling, background music not
    // routed through core) that the steps above can't reach. Templates that
    // don't opt in are unaffected: the stage just dims+freezes visually.
    tpl.onPause?.(true);
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
  function thawPlay() {
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
    enterPause("menu");
    inner.append(menuEl);
    // clicking anywhere else closes the menu (deferred so the opening click doesn't trigger it)
    setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
  }
  function closeMenu() {
    if (!menuEl) return;
    const el2 = menuEl;
    menuEl = null;
    document.removeEventListener("pointerdown", onMenuOutside);
    exitPause("menu");
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
  /**
   * ⭐⭐ Đợt 244 (thầy, 23/8/2026) — WHAT THIS PLAY IS CALLED, for any Showdown
   * surface that has to name it: "LSA2-S2.T1.P3-4-5 / ENG1 QUIZ".
   *
   * ONE function because there are now TWO screens that must agree — the board
   * the class reads at the whistle (core/showdown-review.js, its title) and the
   * card the teacher opens next week (core/showdown-setup.js's displayName over
   * the ledger row). They were free to drift before this đợt, and the whole
   * point of Đợt 230/242's naming rule is that they say one thing.
   *
   * ⚠️ `originAct.title`, not `.name` — in the library an ACT carries `.title`
   * and only a FOLDER carries `.name` (core/store.js itemName()). That one
   * confusion is exactly what made every ledger row read "Showdown" from Đợt 197
   * to Đợt 243; do not reintroduce it.
   * ⚠️ `activity`, not `originAct`, for the variant and the template — a
   * "Change template" swap is precisely what makes the two differ, and what the
   * class actually played is what the name has to say.
   * ⚠️ Returns "" when the act has no title at all. Every caller treats "" as
   * "keep whatever you were showing", so an unnamed act never blanks a screen.
   */
  function sdBoardName() {
    const raw = originAct?.title || "";
    if (!raw) return "";
    return formatActDisplayName(raw, activeVariant(activity) || "", templateLabel(activity.type) || "") || raw;
  }

  function mistakesAvailable() {
    // ⭐ Đợt 246 — PRACTICE may drill its mistakes (that is what the mode is
    // for); SUBMIT may not (a partial replay is not a bài tập). The mistakes
    // machinery is pure in-page (core/mistakes.js), so no library is touched.
    if (session && hwMode !== "practice") return false;
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
    stopShowdownReview();          // ⭐ Đợt 196 — never leave the live listener behind
    stopSdClaimWatch();            // ⭐ Đợt 217 — và bộ nghe "đội có bị giành không"
    closeMenu(); stopTimer(); closeToolPanel(false);
    costNodes.forEach(n => n.remove()); costNodes.clear();
    cleanup();
  }

  /**
   * ⭐ Đợt 196 — close the Showdown review's Firestore listener, wherever the
   * review is being left from: the ✕, Start again, Home, Change template, a
   * match, a mode switch. One function, called from every one of those, because
   * a listener behind a dead screen is invisible and permanent (Đợt 131's
   * ghost-clock, in a different costume).
   */
  function stopShowdownReview() {
    if (!sdReviewStop) return;
    const stop = sdReviewStop;
    sdReviewStop = null;
    try { stop(); } catch { /* already gone */ }
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
    // ⭐ Đợt 190 — WHICH ACT A TEMPLATE'S OWN SAVE SHOULD LAND ON.
    // Running word and Running team save a "set" — one printed numbering plus
    // the class roll it was played with — onto the activity, because a teacher
    // who closes the app mid-lesson has to be able to reprint the very sheet the
    // class is holding. Both used to refuse outright on a converted act, which
    // was right while conversions were throwaway; RUNNING mode makes them the
    // NORMAL way into those games, so refusing would mean the printed numbering
    // could never be saved at all (teacher's call, 18/8/2026: write it back to
    // the original).
    // `originAct` is the library act behind this play — itself for an ordinary
    // play, the act we converted FROM for a converted one. So a template that
    // saves through this is correct in BOTH cases and needs no branch of its own.
    // ⚠️ Still returns a temporary act if the ORIGIN is one (a bundle imported
    // but never saved), which is why the callers keep their "is this saveable?"
    // check — this answers WHERE to save, not WHETHER.
    saveTarget: () => originAct,
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
    /**
     * ⭐⭐⭐ Đợt 220 — "tôi có được sang câu khác lúc này không?" cho những đường KHÔNG
     * đi qua nút bấm: phím ← →, cử chỉ, hay bất cứ lối tắt nào template tự nghĩ ra.
     * ⚠️ MỘT LUẬT, HAI CỬA — engine sở hữu cái NÚT (làm mờ nó), template sở hữu cái
     * PHÍM; cả hai hỏi đúng hàm `mayLeaveRound()` này, nên không thể đẻ ra bản sao thứ
     * hai của luật rồi lệch nhau. ⛔ ĐỪNG cho template tự đọc `options.allowSkip` —
     * đó chính là cách hai bản sao ra đời.
     * ⚠️ KHÔNG dùng cho đường trọng tài đẩy bàn (`goToIndex`/`jumpTo`): trọng tài là
     * người có quyền, chặn nó là hai bàn lệch câu.
     */
    mayLeaveRound() { return mayLeaveRound(); },
    /**
     * ⭐⭐ Đợt 220 — "mảng câu ĐÃ được chia bài, đừng tự xáo lại." Template hỏi câu
     * này TRƯỚC cú shuffle của chính nó (Quiz · Type the answer).
     * ⛔⛔ VÌ SAO KHÔNG ép `shuffleQuestions:false` vào options như fight.js làm:
     * applyBalance/applySdDeal giữ `options` theo THAM CHIẾU là hợp đồng sống —
     * Apply mutate thẳng vào object đó (Object.assign phía dưới), copy options ra
     * để sửa là Apply ghi vào bản sao và act thư viện KHÔNG BAO GIỜ nhận được nữa.
     * fight.js thoát vì nó cầm act ĐÃ đông lạnh riêng cho từng bàn; ở đây là act thật.
     */
    keepItemOrder() { return sdDealMode !== "none"; },
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
      // ⭐ Đợt 220 — FREE: một con số duy nhất tăng dần từ 1 (thầy chốt). Tổng của
      // mảng đã nối dài (500…) là con số kỹ thuật, lớp nhìn thấy chỉ hoảng.
      navLabel.textContent = label != null ? label
        : (sdDealMode === "free" ? String(index) : `${index} of ${total}`);
      // Đợt 220 — mốc xa nhất ván đã đi tới, mẫu số của Free lúc Submit.
      if (typeof index === "number" && index - 1 > sdMaxIndex0) sdMaxIndex0 = index - 1;
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
      // ⭐⭐⭐ Đợt 220 — NHỚ hai handler rồi mới nối dây, và nối qua `paintNavGate()`
      // chứ không nối thẳng: trọng tài có thể phải vẽ lại đúng hai nút này về sau, lúc
      // template không hề gọi `setNav` (xem chú thích dài ở chỗ khai `navHandlers`).
      navHandlers = { prev: onPrev, next: onNext };
      paintNavGate();
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
      // ⭐⭐⭐ Đợt 220 — FREE: CẮT KẾT QUẢ VỀ VÒNG TRỌN VẸN CUỐI TRƯỚC KHI TÍNH GÌ.
      // ⛔⛔ Vì sao BẮT BUỘC: template dựng `review` cho TOÀN BỘ mảng đã nối dài
      // (500 hàng), kể cả câu chưa ai chạm tới — mà từ Đợt 207 câu không làm là
      // câu SAI (`pctOf = right/total`). Không cắt thì thầy Submit ở câu 30 và cả
      // lớp về gần 0%, không một dòng lỗi nào.
      // ⭐ "Vòng trọn vẹn cuối" là lựa chọn của thầy (AskUserQuestion): mọi em cùng
      // mẫu số. Mẫu là `sdMaxIndex0` — cùng nguồn nuôi tên học sinh trên khung,
      // nên "câu đã phát" ở đây và tên từng hiện trên bảng không thể lệch nhau.
      // ⚠️ Chưa xong vòng đầu thì giữ nguyên số câu đã phát (cắt về 0 là một ván
      // không có ai — tệ hơn mẫu số lệch nhau một câu).
      // ⚠️ Đếm lại BỐN con số từ chính các hàng giữ lại, đừng trừ suy diễn:
      // computeResult đọc raw.correct/total trước khi nhìn perQuestion.
      if (sdDealMode === "free" && Array.isArray(raw.review) && showdownPick) {
        const M = Math.max(1, showdownPick.members.length);
        const dealt = Math.min(raw.review.length, sdMaxIndex0 + 1);
        const rounds = Math.floor(dealt / M);
        const keep = rounds >= 1 ? rounds * M : dealt;
        if (keep < raw.review.length) {
          raw.review = raw.review.slice(0, keep);
          if (Array.isArray(raw.perQuestion)) raw.perQuestion = raw.perQuestion.slice(0, keep);
          raw.total = raw.review.length;
          raw.answered = raw.review.filter(r => r.answered).length;
          raw.correct = raw.review.filter(r => r.answered && r.yourCorrect).length;
          raw.incorrect = raw.total - raw.correct;
          if (raw.score != null) raw.score = raw.correct;   // điểm mặc định = số câu đúng
        }
      }
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
        // ⭐⭐⭐ Đợt 246 (thầy) — two ways out of a student play:
        //   PRACTICE  nothing leaves this page. The review stays in memory for
        //             Show answers / Start with mistakes, and that is all.
        //   SUBMIT    the upload starts NOW, silently, alongside the fanfare —
        //             the SUBMIT HOMEWORK button on the end screen only waits
        //             for the server's confirmation of THIS upload, so a child
        //             who closes the tab before pressing it has still handed in
        //             (thầy chốt qua AskUserQuestion). session.submit() never
        //             rejects and resolves {ok:boolean}; the play is also held
        //             in the outbox (core/assignments.js) until confirmed.
        if (hwMode === "submit") {
          hwFinishedAt = Date.now();
          submission = session.submit({
            score: result.score, total: result.total, timeMs, review: reviewData
          }).then(r => (hwSendState = r || { ok: false }))
            .catch(e => { console.warn("AWord: submit failed", e); return (hwSendState = { ok: false }); });
        }
        celebrate(result, null);
        return;
      }
      // A "Start with mistakes" round is PRACTICE, not a scored play (teacher,
      // 7/8/2026): it never reaches the leaderboard. Its act has a fresh id
      // every round, so scoring it would build a one-row board per round that
      // always reads "YOU'RE 1ST" — noise on top of a table meant for comparing
      // real, full plays against each other.
      // ⭐⭐ Đợt 177 — PUBLISH THIS TEAM'S RESULT (teacher, 17/8/2026: "khi hoàn
      // thành game của 1 đội, kết quả đội đó tự đồng bộ vào kết quả các đội và
      // sẵn sàng cho các đội khác đọc"). Every other column can then open its own
      // Show answers, tap SHOWDOWN, and read the whole class off one screen.
      //
      // Fire-and-forget on purpose: the celebration and the summary panel must
      // never wait on a classroom network, and a failed publish costs only the
      // class board — this screen's own Show answers is built from memory and is
      // complete either way.
      //
      // Same two exclusions as the leaderboard directly below, for the same
      // reasons: a play where nobody answered anything has nothing to report, and
      // a "Start with mistakes" round is practice, not a scored play.
      // ⭐⭐ Đợt 196 — still fire-and-forget FROM HERE (the celebration must never
      // wait on a classroom network), but no longer fire-and-FORGET: what does
      // not land is kept in the outbox (core/showdown.js), retried by
      // showdown-setup's sendEntry, and — if it is still owed when the teacher
      // opens Show answers — said out loud on the board itself. `sdPending` is
      // set BEFORE the import so the very first frame of a review opened during
      // a bad minute already carries the warning.
      if (showdownPick && answered > 0 && !activity._mistakes) {
        const students = groupByMember(reviewData, showdownPick.members);
        const roundKey = showdownRoundKey();
        // ⛔⛔ `.title`, KHÔNG PHẢI `.name` — sửa lỗi im lặng có từ Đợt 197
        // (Đợt 243, thầy báo: "bảng showdown vẫn hiện tên như cũ"). Trong thư
        // viện, MỘT ACT tên gì nằm ở `.title`; `.name` là của THƯ MỤC
        // (core/store.js itemName(): folder -> .name, act -> .title). Nên dòng
        // này luôn trả về chuỗi rỗng, và cả chuỗi đặt tên phía sau chết theo:
        // formatActDisplayName("") thoát ngay ở dòng đầu => công thức
        // "X / ENG1 QUIZ" (Đợt 230 + 242) không bao giờ chạy tới =>
        // displayName() rơi xuống chữ chống-cháy "Showdown". Cũng là lý do
        // bảng "đội kia đang chơi act nào" giữa giờ trống tên: saveTeamResult
        // ngay dưới đây dùng chung đúng biến này.
        // ⚠️ Trận ĐÃ LƯU thì không cứu được — chúng ghi actName rỗng xuống
        // Firestore rồi, không còn gì để suy ngược ra tên act.
        const actName = originAct?.title || "";
        // ⭐ Đợt 230 — which clue set (ENG1/ENG2/VI1/VI2) was actually live for
        // this play, so the class's ledger (core/showdown-history.js) can show
        // "BODY PARTS / ENG1" instead of the act's shared "BODY PARTS /
        // WORDS" name. `activity`, not `originAct`: this is the instance the
        // class just played, and content-view.js's own note says its `options`
        // are shared by reference with the library act anyway. `null` (a
        // non-variant act) becomes "" — the ledger's own formatter treats an
        // empty variant as "show the raw name", same as before this đợt.
        const contentVariant = activeVariant(activity) || "";
        // ⭐ Đợt 242 — which TEMPLATE was actually live, same reasoning as
        // contentVariant right above and read off the same instance:
        // `activity.type`, not `originAct.type`, because a "Change template"
        // swap is exactly what can make the two differ. `tpl.name` is a raw
        // internal id ("quiz"); `templateLabel()` is the display word ("Quiz")
        // the ledger's formatter (core/showdown.js) uppercases into "QUIZ".
        const templateType = templateLabel(activity.type) || "";
        sdPending = sdCanPublish;
        import("./showdown-setup.js")
          .then(m => m.saveTeamResult({ pick: showdownPick, roundKey, actName, students }))
          .catch(e => console.warn("AWord: could not publish this team's result", e))
          .finally(refreshSdPending);
        // ⭐⭐⭐ Đợt 197 — AND FILE IT IN THE CLASS'S LEDGER (thầy: "lưu bền kể cả
        // khi tắt máy"). A SECOND, independent write, on purpose:
        //   • the live board above is overwritten by the next play and wiped by
        //     Reset teams; this one is never overwritten and never wiped;
        //   • if either write fails the other still lands, and a lesson with a
        //     bad minute of network keeps at least one record of what happened.
        // ⚠️ `nextPlayNo` is called EXACTLY ONCE per finished play — it is what
        // makes a replay a new column rather than an overwrite (thầy's rule), so
        // it must not move into a retry or a `.then` that could run twice.
        if (showdownPick.classId) {
          import("./showdown-history.js")
            .then(h => h.saveMatchResult({
              classId: showdownPick.classId, className: showdownPick.className,
              tableId: showdownPick.tableId || "", roundKey,
              playNo: h.nextPlayNo(showdownPick.tableId || "", roundKey),
              actName, contentVariant, templateType,
              teamId: showdownPick.teamId, teamName: showdownPick.teamName, students
            }))
            .catch(e => console.warn("AWord: could not file this result in the class history", e));
        }
      }
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
  // ⭐ Đợt 246 — SUBMIT-mode delivery state. `submission` is the promise of the
  // CURRENT send finishing; `hwSendState` is its outcome ({ok}) once settled
  // (null while in flight); `hwConfirmed` flips only after the fly-in — i.e.
  // after the server said yes; `hwFinishedAt` is when finish() fired (printed
  // on the screenshot fallback board). All per-play: a restart rebuilds them.
  let submission = null;
  let hwSendState = null;
  let hwConfirmed = false;
  let hwFinishedAt = 0;
  let hwLbTable = null;  // the left board's rows — the fly-in needs to find "my" row
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
    // ⭐⭐⭐ Đợt 246 — SUBMIT mode gets its own two-board screen (leaderboard +
    // score/menu, equal size). Routed HERE, not at the callers: Back from Show
    // answers / the fly-in / the screenshot flow all come through showSummary,
    // and every one of them must land on the same screen.
    if (session && hwMode === "submit") return showHomeworkEnd(result);
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
    // ⭐ Đợt 208 — AND NONE IN SHOWDOWN (thầy: "bỏ dòng leaderboard và dòng
    // you're x on the leaderboard… vì hiện là đấu team nên không cần mấy cái
    // này nữa"). The leaderboard is one row per PLAY on this browser; in Showdown
    // the play belongs to a team of pupils taking turns, so "you're 3rd" is a
    // sentence with no "you" in it. The board that does mean something there is
    // Show answers, which ranks the pupils themselves.
    if (!session && !activity._mistakes && !showdownPick) {
      const rank = getRank(activity.id, entryId);
      if (rank) panel.append(el("div", "aw-panel-rank", `YOU'RE ${ordinal(rank)} ON THE LEADERBOARD`));
    }

    const items = el("div", "aw-panel-items");
    if (session) {
      // ⭐⭐ Đợt 246 — this branch is PRACTICE only now (SUBMIT rerouted above).
      // Nothing was sent and the line says so; the rows are the teacher's list:
      // Show answers (the ONE remaining tick on the Set assignment form) ·
      // Start again · Start with mistakes (mistakesAvailable() opens up for
      // practice — the whole point of the mode is to drill what went wrong).
      const end = session.endOptions || {};
      panel.append(el("div", "aw-panel-rank", "PRACTICE — NOT SENT TO YOUR TEACHER"));
      if (end.showAnswers !== false && reviewData.length) {
        items.append(panelItem("Show answers", () => showReview(result, entryId)));
      }
      items.append(panelItem("Start again", restart));
      if (mistakesAvailable()) items.append(panelItem("Start with mistakes", startWithMistakes));
    } else {
      // ⭐ Đợt 208 — no Leaderboard row in Showdown (thầy — see the note on the
      // rank line above). ⚠️ The leaderboard itself is NOT switched off: finish()
      // still records the play, so turning Showdown off gets the history back
      // intact. Only the way IN from this panel is hidden, which is the smallest
      // change that does what was asked.
      if (!showdownPick) items.append(panelItem("Leaderboard", () => showLeaderboard(result, entryId)));
      // ⭐⭐⭐ Đợt 243 — kept in a variable: this row is no longer only a button,
      // it is also the KEY to the two rows below it (see lockBehindHold()).
      let answersRow = null;
      if (reviewData.length && activity.options?.showAnswers !== false) {
        answersRow = panelItem("Show answers", () => showReview(result, entryId));
        items.append(answersRow);
      }
      const again = panelItem("Start again", restart);
      items.append(again);
      // "Start with mistakes" sits right under "Start again" (teacher's layout).
      // Only for games that opted in with tpl.itemsKey AND only when this play
      // actually left something wrong or blank — a clean sheet gets no button
      // rather than a button that only ever says "No mistakes to practise".
      let mistRow = null;
      if (mistakesAvailable()) {
        const mist = panelItem("Start with mistakes", startWithMistakes);
        mistRow = mist;
        items.append(mist);
      }
      // ⭐⭐⭐ Đợt 243 — LOCK BOTH RESTART ROWS BEHIND "SHOW ANSWERS".
      // See lockBehindHold()'s own note for the whole rule and its traps.
      if (answersRow) lockBehindHold(answersRow, [again, mistRow], result, entryId);
      // "Play a different template" was HERE until Đợt 84 and moved out to make
      // room: a 5th button pushed the panel past its 92% max-height and made it
      // scroll, hiding the last row. The same picker still lives in the ☰ menu
      // as "Change template" (teacher's call, 7/8/2026).
    }
    panel.append(items);
    bd.append(panel);
  }

  /**
   * ⭐⭐⭐ Đợt 243 (23/8/2026, thầy) — "ẩn luôn cả START WITH MISTAKES và START
   * AGAIN và hiện chúng ra khi nhấn giữ Show answers. Làm như vậy với mọi mode,
   * trừ assignment".
   *
   * REPLACES Đợt 207, which hid only "Start with mistakes" and unlocked it by
   * holding "Start again" — and only in Showdown. Two things widen here:
   *   • BOTH restart rows are hidden now, so a pupil who reaches the end of a
   *     game cannot restart it at all without the teacher's finger;
   *   • EVERY mode does it — Single, Showdown, Fight, Play mode.
   *
   * ⛔ ASSIGNMENT IS NOT ROUTED HERE AT ALL. Student mode builds its rows in the
   * `if (session)` branch above from the teacher's own `session.endOptions`
   * tick-boxes, and has its own practise/submit flow — thầy's explicit
   * exception. That branch is untouched by this đợt, byte for byte.
   *
   * ⚠️ ONLY CALLED WHEN "Show answers" IS ON SCREEN. It is the only key, so
   * hiding the restart rows without it would leave a dead-end panel (an act
   * with `showAnswers:false`, or a template that records no review rows). No
   * key => nothing is locked, and the panel reads exactly as it did before
   * Đợt 207. Do NOT "improve" this by falling back to Leaderboard: Showdown
   * hides that row too (Đợt 208), so the dead end would come straight back.
   *
   * ⚠️ `opener.onclick` is CLEARED first. panelItem wires a plain onclick, and
   * core/press.js's tapOrHold swallows the trusted `click` itself — the two
   * together would open the review twice on a browser that still delivered one,
   * and half the point of tapOrHold is that `click` cannot be trusted on the
   * TOMKO infrared screen anyway.
   *
   * ⚠️ Hidden with a class, NOT by leaving the node out: it has to be in the
   * tree for the reveal to animate (`.aw-panel-item.is-held` in app.css opens a
   * max-height — with `overflow:hidden`, the Đợt 137 trap). And `disabled` goes
   * with it, because a zero-height row can still be reached by the keyboard:
   * hidden must mean "cannot be pressed".
   *
   * ⚠️ NOT REMEMBERED between paintings (thầy chốt qua AskUserQuestion): every
   * showSummary() builds fresh rows, so coming Back from Show answers or the
   * Leaderboard locks them again. That is the point of the lock, not an
   * oversight — nothing here should be moved up into the closure to persist it.
   */
  function lockBehindHold(opener, rows, result, entryId) {
    const locked = rows.filter(Boolean);
    if (!locked.length) return;
    locked.forEach(r => { r.classList.add("is-held"); r.disabled = true; });
    opener.onclick = null;
    tapOrHold(opener, {
      // ⭐ Đợt 243 — the row lights up and squeezes for as long as the finger is
      // down (core/app.css `.aw-panel-item.is-holding`), so the class can see
      // the press being counted. tapOrHold owns putting it on and taking it off.
      holdClass: "is-holding",
      onTap: () => { sound.click(); showReview(result, entryId); },
      onHold: () => {
        if (!locked.some(r => r.disabled)) return;   // already out — a second hold does nothing
        sound.click();
        locked.forEach(r => { r.disabled = false; r.classList.add("is-on"); });
      }
    });
    opener.title = "Hold to unlock Start again";
  }

  // =============================================================
  // Đợt 246 — SUBMIT MODE'S END SCREEN: two equal boards + SUBMIT HOMEWORK
  // =============================================================
  // Same four penalty keys as the teacher's report (scoreIsPenalised in
  // core/assignment-ui.js, Đợt 245) — keep the two lists in step by hand. The
  // engine cannot import that file (it pulls core/store.js, the teacher-library
  // boundary), so the six lines live twice on purpose.
  const HW_PENALTY_KEYS = ["pointsOff", "minusAmount", "letterPenalty", "timeCost"];
  function hwPenalised() {
    if (activity.type === "gameshow") return true;   // scores by speed, always
    const o = activity.options || {};
    return HW_PENALTY_KEYS.some(k => Number(o[k]) > 0);
  }
  // What a leaderboard row prints for a score. With a penalty on, `score/total`
  // is two different units glued together (the Đợt 245 lesson from the
  // teacher's report) — print the score alone.
  const hwScoreText = e => e.scoreText != null ? String(e.scoreText)
    : hwPenalised() ? `${e.score}` : `${e.score}/${e.total}`;

  const HW_SUBMIT_MIN_MS = 2000;     // the SUBMITTING screen never blinks past faster than this
  const HW_SUBMIT_GIVEUP_MS = 25000; // outer guard — past this the error screen shows no matter what hangs

  function hwWhen(ms) {
    const d = new Date(ms || Date.now());
    const p = n => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // The two-board screen: LEFT the class leaderboard (opens by itself, every
  // student's best attempt, all rows on screen at once), RIGHT the score panel
  // whose loudest control is SUBMIT HOMEWORK. Both boards are the same size in
  // every situation — the CSS fixes the pair's box, not the content.
  function showHomeworkEnd(result) {
    const bd = openBackdrop();
    const duo = el("div", "aw-hw-duo");

    const lbPanel = el("div", "aw-panel aw-hw-panel");
    lbPanel.append(el("div", "aw-panel-head", "LEADERBOARD"));
    const lbBox = el("div", "aw-hw-lbbox");
    hwLbTable = el("div", "aw-lb-table aw-hw-lbtable");
    hwLbTable.append(el("div", "aw-lb-row is-note", "Loading..."));
    lbBox.append(hwLbTable);
    lbPanel.append(lbBox);

    const menuPanel = el("div", "aw-panel aw-hw-panel");
    menuPanel.append(el("div", "aw-panel-head", endTitle.toUpperCase()));
    const stats = el("div", "aw-sum-stats");
    const t = fmtSecsParts(result.timeMs);
    stats.append(
      result.scoreText != null
        ? statBlock("Score", result.scoreText, "")
        : statBlock("Score", `${result.score}`, `/${result.total}`, result.score < 0 ? "is-neg" : ""),
      statBlock("Time", t.big, t.small)
    );
    menuPanel.append(stats);
    if (result.total > 0 && result.score !== result.correct) {
      menuPanel.append(el("div", "aw-sum-total", `Total: ${result.correct}/${result.total}`));
    }

    const items = el("div", "aw-panel-items");
    const hwBtn = el("button", "aw-hw-submitbtn");
    hwBtn.type = "button";
    hwBtn.append(el("span", "aw-hw-submitbtn-ic", icons.assignment),
                 el("span", null, "SUBMIT HOMEWORK"));
    if (hwConfirmed) markHwDone(hwBtn);
    else hwBtn.onclick = () => { sound.click(); startHomeworkSubmit(result, hwBtn); };
    items.append(hwBtn);
    // No "Leaderboard" row (the board is already on the left — thầy) and no
    // "Start with mistakes" (SUBMIT is the real thing, not a drill).
    const end = session.endOptions || {};
    if (end.showAnswers !== false && reviewData.length) {
      items.append(panelItem("Show answers", () => showReview(result, null)));
    }
    items.append(panelItem("Start again", restart));
    menuPanel.append(items);

    duo.append(lbPanel, menuPanel);
    bd.append(duo);
    hwRenderLeaderboard();
  }

  function markHwDone(btn) {
    btn.classList.add("is-done");
    btn.disabled = true;
    btn.onclick = null;
    btn.innerHTML = "";
    btn.append(el("span", "aw-hw-submitbtn-ic", icons.assignment),
               el("span", null, `SUBMITTED — ${escapeText((session.playerName || "").toUpperCase())}`));
  }

  // Build/refresh the left board. Every student's BEST attempt (exactly what
  // session.entries() returns), ALL of them at once: the font shrinks to fit
  // (a height-only fit over --fit) instead of the list scrolling (thầy, Đợt 246).
  // Returns the entries (or null when the read failed) for the fly-in.
  async function hwRenderLeaderboard() {
    const table = hwLbTable;
    if (!table || !table.isConnected) return null;
    let entries = null;
    try { entries = await session.entries(); } catch (e) { entries = null; }
    if (!table.isConnected) return entries;
    table.innerHTML = "";
    if (!entries) {
      table.append(el("div", "aw-lb-row is-note", "Could not load the leaderboard"));
      return null;
    }
    if (!entries.length) {
      table.append(el("div", "aw-lb-row is-note", "No plays yet — be the first!"));
      return entries;
    }
    entries.forEach((e, i) => {
      const row = el("div", "aw-lb-row" + (e.mine ? " is-you" : ""));
      const tp = fmtSecsParts(e.timeMs);
      // The name TEXT gets its own inline span so the fit below can measure the
      // real text width (fractional, via getBoundingClientRect). The cell's own
      // scrollWidth is useless for this: it is an integer AND floors at
      // clientWidth, so a name overflowing by half a pixel — exactly when the
      // browser starts drawing "…" — reads as a perfect fit.
      const nameCell = el("span", "aw-lb-name");
      nameCell.append(el("span", "aw-lb-nametext", escapeText(e.name)));
      row.append(
        el("span", "aw-lb-rank", ordinal(i + 1).toLowerCase()),
        nameCell,
        el("span", "aw-lb-score", escapeText(hwScoreText(e))),
        el("span", "aw-lb-time", `${tp.big}${tp.small}`)
      );
      table.append(row);
    });
    // Fit AFTER the rows exist. The box's height is fixed by the CSS, so this
    // is "the largest font at which nothing needs to scroll" — and the cap is
    // 2, not 1, because "linh hoạt" cuts both ways (thầy): a class of six
    // fills the board with big rows, a class of forty shrinks until it fits.
    // Row geometry is all in em (see .aw-hw-lbtable) so ONE variable scales
    // everything, columns included.
    // ⛔ NOT core/fit.js's fitOnce: that also tests WIDTH, and this table is a
    // grid that fills its box's width by design — scrollWidth == clientWidth,
    // which fitOnce's slack turns into "always overflowing", so it slammed
    // every class to the 0.28 floor (measured on the visual bench). Height is
    // the only axis that can actually overflow here.
    // "Overflowing" here means EITHER the rows need to scroll OR a name got
    // ellipsised — the number columns are in em, so growing the font squeezes
    // the 1fr name column, and a board of unreadable names is not "hiện được
    // toàn bộ" no matter how big its digits are.
    const box = table.parentElement;
    if (box) {
      const apply = f => table.style.setProperty("--fit", f);
      // Fractional rects, not scrollWidth (see the note where the row is
      // built): the ellipsis appears the moment the text is even half a pixel
      // wider than the cell, which integer scrollWidth cannot see.
      // NO epsilon: text-overflow draws "…" on ANY overflow, a 0.05px one
      // included (measured: a 0.1px allowance still ellipsised the top name).
      const over = () => table.scrollHeight > box.clientHeight ||
        [...table.querySelectorAll(".aw-lb-name")].some(n => {
          const s = n.firstElementChild;
          return s && s.getBoundingClientRect().width > n.getBoundingClientRect().width;
        });
      const runFit = () => {
        if (!table.isConnected) return;
        apply(2);
        if (!over()) return;
        let lo = 0.28, hi = 2, best = 0.28;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          apply(mid);
          if (over()) hi = mid; else { best = mid; lo = mid; }
        }
        apply(best);
      };
      runFit();
      // …and once more when the web font lands: its metrics are wider than the
      // fallback's, so a fit measured too early still ellipsises a name (the
      // same lesson core/fit.js's autoFit already carries).
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(runFit).catch(() => {});
    }
    return entries;
  }

  // The current send, retried if the last one already came back failed. The
  // SAME attempt is re-sent every time (same fixed id — core/assignments.js
  // can therefore never write a second row for it).
  function ensureSubmission() {
    if (hwSendState && !hwSendState.ok) {
      hwSendState = null;
      submission = session.retrySubmit()
        .then(r => (hwSendState = r || { ok: false }))
        .catch(() => (hwSendState = { ok: false }));
    }
    return submission || Promise.resolve({ ok: false });
  }

  // The SUBMIT HOMEWORK ceremony. The rule that matters most (thầy):
  // ⛔ THE FLY-IN NEVER RUNS ON HOPE. It runs after — and only after — the
  // server confirmed BOTH documents ({ok:true} from core/assignments.js).
  // Anything else lands on the Vietnamese error screen with GỬI LẠI BÀI TẬP
  // and CHỤP ẢNH MÀN HÌNH.
  function startHomeworkSubmit(result, hwBtn) {
    const overlay = buildHwOverlay(result, () => doSend());
    async function doSend() {
      overlay.showSending();
      const [sent] = await Promise.race([
        Promise.all([ensureSubmission(), new Promise(r => setTimeout(r, HW_SUBMIT_MIN_MS))]),
        new Promise(r => setTimeout(() => r([{ ok: false }]), HW_SUBMIT_GIVEUP_MS))
      ]);
      if (!overlay.root.isConnected) return;   // torn down (restart) while waiting
      if (sent && sent.ok) {
        hwConfirmed = true;
        if (hwBtn && hwBtn.isConnected) markHwDone(hwBtn);
        await hwFlyIn(overlay, result);
      } else {
        overlay.showError();
      }
    }
    doSend();
  }

  // The confirmed play flies into its own leaderboard row. The row must exist
  // first: refresh from the server (the write is confirmed, so a read that
  // works WILL contain it). If that read fails on the way back, the play is
  // still delivered — so the local numbers stand in for the row rather than
  // pretending nothing happened. Only the ROW is local; the confirmation that
  // gated all of this never is.
  async function hwFlyIn(overlay, result) {
    let entries = null;
    try { entries = await hwRenderLeaderboard(); } catch (e) { entries = null; }
    if (!overlay.root.isConnected) return;
    if (!entries && hwLbTable && hwLbTable.isConnected) {
      hwLbTable.innerHTML = "";
      const row = el("div", "aw-lb-row is-you");
      const tp = fmtSecsParts(result.timeMs);
      const nameCell = el("span", "aw-lb-name");
      nameCell.append(el("span", "aw-lb-nametext", escapeText(session.playerName || "Player")));
      row.append(
        el("span", "aw-lb-rank", ""),
        nameCell,
        el("span", "aw-lb-score", escapeText(hwScoreText({ score: result.score, total: result.total, scoreText: result.scoreText }))),
        el("span", "aw-lb-time", `${tp.big}${tp.small}`)
      );
      hwLbTable.append(row);
    }
    const target = hwLbTable && hwLbTable.isConnected
      ? hwLbTable.querySelector(".aw-lb-row.is-you .aw-lb-name") : null;
    await overlay.flyTo(target);
  }

  // The full-screen overlay behind SUBMIT HOMEWORK, with its four faces:
  // sending → (fly-in) | error → guide → board. One root, rebuilt per face —
  // no rAF anywhere (CSS animations + WAAPI only; hidden panes freeze rAF).
  function buildHwOverlay(result, onRetry) {
    const root = el("div", "aw-hw-sub");
    inner.append(root);
    const o = { root, cluster: null };
    const swap = build => { root.innerHTML = ""; o.cluster = null; build(); };

    o.showSending = () => swap(() => {
      const box = el("div", "aw-hw-sub-center");
      const title = el("div", "aw-hw-sub-title", "SUBMITTING HOMEWORK");
      const brand = el("div", "aw-hw-sub-brand");
      "ANDREW CLASSES".split("").forEach((ch, i) => {
        const s = el("span", null, ch === " " ? "&nbsp;" : escapeText(ch));
        s.style.setProperty("--i", i);
        brand.append(s);
      });
      box.append(title, brand);
      root.append(box);
      o.cluster = box;
    });

    o.showError = () => swap(() => {
      const box = el("div", "aw-hw-sub-center");
      box.append(el("div", "aw-hw-err-title", "GỬI BÀI CHƯA THÀNH CÔNG DO LỖI MẠNG"));
      box.append(el("div", "aw-hw-err-sub",
        "Bài làm của em vẫn còn trên máy — chọn một trong hai cách dưới đây."));
      const row = el("div", "aw-hw-err-btns");
      const retry = el("button", "aw-hw-bigbtn is-primary", "GỬI LẠI BÀI TẬP");
      retry.type = "button";
      retry.onclick = () => { sound.click(); onRetry(); };
      const shot = el("button", "aw-hw-bigbtn", "CHỤP ẢNH MÀN HÌNH");
      shot.type = "button";
      shot.onclick = () => { sound.click(); o.showGuide(); };
      row.append(retry, shot);
      box.append(row);
      root.append(box);
    });

    o.showGuide = () => swap(() => {
      const box = el("div", "aw-hw-sub-center");
      box.append(el("div", "aw-hw-guide-title", "CÁCH CHỤP ẢNH MÀN HÌNH"));
      const cards = el("div", "aw-hw-guide-cards");
      const card = (t, svg, d) => {
        const c = el("div", "aw-hw-guide-card");
        c.append(el("div", "aw-hw-guide-t", t), el("div", "aw-hw-guide-ph", svg),
                 el("div", "aw-hw-guide-d", d));
        return c;
      };
      cards.append(
        card("iPhone / iPad", hwPhoneSvg("right"),
             "Bấm <b>cùng lúc</b> nút <b>NGUỒN</b> (cạnh phải) + nút <b>TĂNG ÂM LƯỢNG</b> (cạnh trái)"),
        card("Android", hwPhoneSvg("down"),
             "Bấm <b>cùng lúc</b> nút <b>NGUỒN</b> + nút <b>GIẢM ÂM LƯỢNG</b> (cạnh phải)")
      );
      box.append(cards);
      box.append(el("div", "aw-hw-guide-note",
        "Chụp xong, em gửi ảnh qua <b>Zalo</b> cho thầy Andrew: <b>0359.769.765</b>"));
      const ok = el("button", "aw-hw-bigbtn is-primary", "ĐÃ RÕ");
      ok.type = "button";
      ok.onclick = () => { sound.click(); o.showBoard(); };
      box.append(ok);
      root.append(box);
    });

    o.showBoard = () => swap(() => {
      const box = el("div", "aw-hw-sub-center");
      box.append(el("div", "aw-hw-board-title", "HÃY CHỤP LẠI MÀN HÌNH"));
      const card = el("div", "aw-hw-board-card");
      const line = (label, value) => {
        const r = el("div", "aw-hw-board-row");
        r.append(el("span", "aw-hw-board-l", label), el("span", "aw-hw-board-v", value));
        return r;
      };
      const who = (session.playerName || "") + (session.className ? " • " + session.className : "");
      card.append(line("Học sinh", escapeText(who.toUpperCase())));
      if (session.meta?.assignmentTitle) card.append(line("Bài tập", escapeText(session.meta.assignmentTitle)));
      card.append(line("Trò chơi", escapeText(
        ((activity.title ? activity.title + " — " : "") + (tpl.name || activity.type)).toUpperCase())));
      card.append(line("Điểm", escapeText(result.scoreText != null
        ? String(result.scoreText) : `${result.score}/${result.total}`)));
      const t = fmtSecsParts(result.timeMs);
      card.append(line("Thời gian làm", `${t.big}${t.small}`));
      card.append(line("Nộp lúc", escapeText(hwWhen(hwFinishedAt))));
      const aid = session.attemptId?.();
      if (aid) card.append(line("Mã lượt", escapeText(aid)));
      box.append(card);
      const done = el("button", "aw-hw-bigbtn is-primary", "XONG");
      done.type = "button";
      done.onclick = () => { sound.click(); o.remove(); };
      box.append(done);
      root.append(box);
    });

    // Shrink the SUBMITTING cluster into `target` (the student's own name cell)
    // while the dim fades, then spark the landed row gold for a few seconds.
    // ⚠️ Removal hangs off the plain setTimeout, never off anim.onfinish alone —
    // a hidden tab stalls animation events (the Đợt 216 rule).
    o.flyTo = target => new Promise(done => {
      const cluster = o.cluster;
      if (!cluster || !cluster.isConnected) { o.remove(); return done(); }
      const from = cluster.getBoundingClientRect();
      const toEl = target && target.isConnected ? target : null;
      let dx = 0, dy = 0, scale = 0.12;
      if (toEl) {
        const to = toEl.getBoundingClientRect();
        dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        scale = Math.max(0.06, Math.min(to.height / Math.max(1, from.height), to.width / Math.max(1, from.width)));
      }
      root.classList.add("is-flying");
      cluster.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.12 }
      ], { duration: 750, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });
      setTimeout(() => {
        o.remove();
        if (toEl) {
          const row = toEl.closest(".aw-lb-row");
          if (row) {
            row.classList.add("aw-hw-justland");
            setTimeout(() => row.classList.remove("aw-hw-justland"), 3400);
          }
        }
        done();
      }, 800);
    });

    o.remove = () => root.remove();
    return o;
  }

  // Small phone drawing for the screenshot guide — power button always on the
  // right edge; `vol` = which volume half is pressed ("right" = iPhone's up,
  // on its left edge · "down" = Android's down, under the power button).
  function hwPhoneSvg(vol) {
    const upSide = vol === "right";
    return `<svg viewBox="0 0 90 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
      <rect x="24" y="8" width="42" height="104" rx="8"/>
      <rect x="${upSide ? 17 : 69}" y="${upSide ? 30 : 58}" width="5" height="20" rx="2.5"
            fill="#ffd75e" stroke="#ffd75e"/>
      <rect x="69" y="30" width="5" height="20" rx="2.5" fill="#ff8f5e" stroke="#ff8f5e"/>
      <circle cx="45" cy="102" r="4"/>
    </svg>`;
  }

  function showLeaderboard(result, entryId) {
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
    // ⚠️ Đợt 196 — the teacher can open Show answers, close it and open it again
    // as often as they like; each open MOUNTS A NEW review, so the previous
    // one's live listener has to go first or they stack up one per open.
    stopShowdownReview();
    if (backdrop) backdrop.innerHTML = "";   // hide the panel behind
    const rv = el("div", "aw-review");
    const head = el("div", "aw-rv-head");
    const closeBtn = iconBtn("aw-rv-close", icons.close, "Close");
    closeBtn.onclick = () => { stopShowdownReview(); rv.remove(); showSummary(result, entryId); };
    // ⭐ Đợt 177 — Showdown builds its OWN title, because there it is a control
    // and not a label: "SHOWDOWN A1C • TEAM 3", where the word SHOWDOWN carries
    // tap / double-tap / press-and-hold (this team ↔ the whole class · refresh
    // the other teams · the ranking board). Everything about it, markup
    // included, lives in core/showdown-review.js — see its header.
    if (!showdownPick) head.append(el("div", "aw-rv-title", "ANSWERS"));
    head.append(closeBtn);
    rv.append(head);

    // ⭐ SHOWDOWN (Đợt 155) — a flat list of questions says nothing about WHO
    // answered what, which is the one thing this mode exists to record. The
    // Showdown review groups the same rows by pupil and ranks them.
    // ⭐ Đợt 177 — and can now widen from "the team this browser played" to the
    // WHOLE CLASS, by reading what the other columns published when their own
    // games finished (see the publish in finish() above). The network call is
    // handed in from here so that file never has to import Firestore.
    if (showdownPick) {
      // ⭐⭐⭐ Đợt 196 — the review no longer ASKS ONCE, it WATCHES. Four
      // callbacks instead of one, all of them thin wrappers so that file still
      // never imports Firestore (its own header, luật 2 of v0.9.0):
      //   loadTeams    the one-shot read, still the fallback
      //   watchTeams   the live listener — this is what makes four columns agree
      //   flushPending re-send this column's own row if the whistle-time write
      //                did not land (core/showdown-setup.js keeps it in an outbox)
      //   isPending    whether this column still owes the shared row
      // ⚠️ `watchTeams` is SYNCHRONOUS on purpose — it must hand back an
      // unsubscribe the review can hold. The dynamic import is done INSIDE it and
      // the real unsubscribe is chained on afterwards.
      const sd = () => import("./showdown-setup.js");
      sdReviewStop = mountShowdownReview({
        head, before: closeBtn, host: rv,
        pick: showdownPick,
        review: reviewData,
        // ⭐⭐ Đợt 244 (thầy) — the board says WHICH ACT the class just played,
        // instead of the literal word "SHOWDOWN". EXACTLY the same formula the
        // class ledger uses for its own rows (core/showdown-setup.js displayName),
        // so the screen the class reads at the whistle and the card the teacher
        // opens next week can never name the same play two different ways:
        // act title + the clue set that was live + the template that was live.
        // ⚠️ `originAct.title` / `activity` are the same two objects finish()
        // reads, and for the same reasons (see its own note): `.title` because
        // `.name` belongs to FOLDERS, and `activity` because a "Change template"
        // swap is what makes the played template differ from the act's own.
        // Falls back to the raw title, then to "" — and "" is what makes
        // core/showdown-review.js keep the old word, so nothing regresses for an
        // act with no name at all.
        actName: sdBoardName(),
        loadTeams: () => sd().then(m => m.loadTeamResults(showdownRoundKey())),
        watchTeams: (onChange, onError) => {
          let off = null, dead = false;
          sd().then(m => {
            if (dead) return;
            off = m.subscribeResults(showdownRoundKey(), onChange, onError);
          }).catch(onError);
          return () => { dead = true; if (off) { try { off(); } catch { /* already gone */ } } };
        },
        flushPending: () => sd().then(m => m.flushPendingResult())
          .then(ok => { refreshSdPending(); return ok; },
                e => { refreshSdPending(); throw e; }),
        // Synchronous, so the title can be painted on the very first frame: the
        // outbox is sessionStorage, and reading it must not wait on a module.
        isPending: () => !!sdPending,
        toast
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
