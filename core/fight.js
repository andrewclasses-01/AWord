// =============================================================
// FIGHT MODE — two teams, two boards, one word, side by side (Đợt 124,
// 12/8/2026). The teacher's own idea; there is nothing like it on Wordwall.
//
// WHAT IT IS
//   The MODE button under the frame flips a normal act between SINGLE MODE
//   (one 16:10.5 board, everything exactly as before) and FIGHT MODE:
//
//     SCOREBOARD 1  │  CLOCK  │  SCOREBOARD 2      <- one shared strip on top
//     ┌───────────┐   ┌───────────┐
//     │  TEAM 1   │   │  TEAM 2   │                <- two REAL plays, side by side
//     └───────────┘   └───────────┘
//        [hand pts]      [hand pts]                <- one below EACH board, dead centre under it
//        Options · Template · Style · MODE · ⛶     <- the ONE toolbar, shared
//
//   Both teams solve the SAME word at the same time on a touch screen; whoever
//   finishes first scores. Points follow the template's own scoring rules
//   (teacher's call) and the teacher can nudge either score by hand.
//
// HOW IT RUNS TWO GAMES AT ONCE
//   `startGame()` keeps every scrap of its state inside its own closure, so
//   calling it twice into two different containers gives two independent plays
//   for free — no engine rewrite. What is NOT free is everything that reaches
//   ACROSS a play: the myActivity bridge seat, `document.querySelector()` on
//   shared class names, one <audio> per sound file, and a clip of speech that
//   would otherwise be spoken twice at once. Those are handled at the source
//   (see core/sfx.js's extra voices, and the fight branches in anagram.js).
//
// THE ONE TOOLBAR
//   Pane 0 builds the normal below-the-frame bar (Options/Template/Style/MODE/
//   Edit/Assignment/Print/Home) and this file simply MOVES that DOM node into
//   the shared bottom row; pane 1's copy is dropped. Every existing handler
//   travels with the node, so there is no second implementation of any tool —
//   and anything added to that bar later shows up here with no work.
//
// TEMPLATE CONTRACT (opt-in, one template so far — Anagram)
//   A template joins fight mode by setting `tpl.fightMode = true` (that is what
//   makes the MODE button appear at all) and talking to `activity._fight`:
//     ctl.attach(side, { goToIndex, lock, total })   register the board
//     ctl.wordDone(side, { index, correct })         this board finished a word
//        `correct:false` = finished it WRONG, which ends only THIS board's go:
//        the round stays open and the other team plays on (see wordDone).
//     ctl.isLocked(side)                             refuse input while locked
//     ctl.scoreTarget(side)                          where "+8" should fly to
//     ctl.shareLetters / ctl.speaks(side)            keep the two boards fair
//   A template that does none of this still works — it just runs twice with no
//   round logic, which is why the flag is opt-in rather than automatic.
// =============================================================

import { el, shuffle } from "./utils.js";
import { startGame } from "./engine.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { getTemplate } from "./registry.js";

// How long the winning word stays on screen before both boards move on.
// ⚠️ Must outlast the template's own score animation, measured at 1760ms for a
// PERFECT Anagram word (420 delay + 920 flight + 420 pulse): the round must not
// turn over while the points it earned are still flying, or a frozen "slower
// team" would unfreeze just in time to keep them after all.
const ROUND_HOLD_MS = 2100;
// "Let the other team finish" can't wait forever — a team that walks away must
// not freeze the lesson.
const LATE_LIMIT_MS = 20000;
// Đợt 133 (teacher, 13/8/2026): two correct finishes within this many ms of
// each other count as SIMULTANEOUS — both score, neither is locked/frozen.
// A clean 0.1s per the teacher's own words; well inside ROUND_HOLD_MS's own
// margin above the 1760ms flight time, so waiting it out never risks the
// round turning over before either side's score has actually landed.
const TIE_WINDOW_MS = 100;

// The teacher's hand-given points, per side. MODULE level on purpose: the
// teacher asked for a number that survives "Start again" and a template change
// but starts fresh when the browser page is reloaded — which is exactly the
// lifetime of a module variable. (Every other score belongs to a match and is
// rebuilt with it.)
const handPoints = [0, 0];
// "Woken" state for the "asleep at zero" gate (Đợt 124, third pass) — same
// module-level lifetime as handPoints, see interact()/paintHand() below.
const handAwake = [false, false];

export const FIGHT_DEFAULTS = {
  // Đợt 133 (teacher): "same" ("same word, same letters") is GONE as a
  // choice — see buildOptions below — and the default moved from it to
  // "scramble". `fightOptionsFrom()` still accepts "same" verbatim if it
  // reads it off an OLD saved act's options (nothing migrates existing
  // acts), so a match started from one keeps working exactly as it did —
  // this default only decides what a never-configured act starts on.
  fightContent: "scramble",  // scramble | different (legacy acts may still carry "same")
  fightFirstRule: "lock",    // lock | finish
  fightSpeedBonus: 0,        // extra points for the team that got there first
  fightLateScores: true      // the slower team still keeps what it earned
};

export function fightOptionsFrom(options = {}) {
  const o = { ...FIGHT_DEFAULTS };
  ["fightContent", "fightFirstRule", "fightSpeedBonus", "fightLateScores"].forEach(k => {
    if (options[k] !== undefined) o[k] = options[k];
  });
  o.fightSpeedBonus = Math.max(0, Math.min(20, Number(o.fightSpeedBonus) || 0));
  return o;
}

// ---------------------------------------------------------------
// startFight(root, activity, { onExit, base }) — replaces the single play in
// `root`. Returns nothing; the MODE button inside the shared toolbar comes
// back here to switch off again.
//
// `base` is the teacher's ORIGINAL library act, when `activity` is a converted
// copy of it ("conv_..."). Same contract as startGame's `base`, and for the
// same reason: every Change-template conversion must start from the original,
// never from the previous conversion, or the content degrades a little more
// each hop (anagram -> quiz invents distractors; quiz -> anagram then keeps
// only the right answer, and so on).
// ---------------------------------------------------------------
export function startFight(root, activity, { onExit, base = null } = {}) {
  root.innerHTML = "";
  const fo = fightOptionsFrom(activity.options || {});
  const originAct = base || activity;

  // ----- shell -----
  const wrap = el("div", "aw-fight");
  const top = el("div", "aw-fight-top");
  const boardsRow = el("div", "aw-fight-boards");
  // ONE row under the boards holds BOTH the teacher's hand-point boxes and the
  // shared toolbar, on the same line (teacher, 12/8/2026 fourth pass) — the
  // hands stay dead centre under their own board while the toolbar floats
  // centred over the join between them.
  const controlsRow = el("div", "aw-fight-controls");
  const bottom = el("div", "aw-fight-bottom");

  // ----- the strip above the boards -----
  // Two halves that line up with the two boards (each team's number sits dead
  // centre over ITS OWN board — teacher, 12/8/2026), plus the clock floating
  // over the join. The teacher's own hand points used to live in this strip
  // too (either side of the clock) but moved DOWN below each board, dead
  // centre under it, at the teacher's request (12/8/2026, third pass) — see
  // `handsRow` below.
  // ⚠️ Đợt 136 REVERSES Đợt 134's 7-segment hand-points display (teacher, same
  // day: "số dạng thanh 7 nút… quá khó nhìn do mảnh quá => hãy đổi sang font số
  // bình thường của AWord và tăng size"). The segment bars were only ~11% of a
  // digit's height, which reads as thin hairlines from the back of a room —
  // exactly the opposite of the "bigger" the request was aiming at. The digits
  // are plain text again in the app's own Baloo 2, bumped ~30% and bolded (see
  // .aw-fight-handnum in core/app.css). Đợt 134's SEVEN_SEG map, sevenSegHtml()
  // and the .aw-seg-* CSS block are all DELETED rather than left dormant — a
  // half-removed mechanism is what makes a later reader think it's still live.
  const teams = [makeTeam(0), makeTeam(1)];
  const half0 = el("div", "aw-fight-half");
  const half1 = el("div", "aw-fight-half");
  half0.append(teams[0].el);
  half1.append(teams[1].el);

  const middle = el("div", "aw-fight-middle");
  const clockBox = el("div", "aw-fight-clockbox");
  const clockEl = el("div", "aw-fight-clock", "00:00");
  clockBox.append(clockEl);
  middle.append(clockBox);
  top.append(half0, half1, middle);

  // ----- the row under the boards: hand points · toolbar · hand points -----
  // Same two-halves grid as `top` (matches boardsRow's columns/gap) so each box
  // sits dead centre under ITS OWN board, same reasoning as the team score
  // above it. `bottom` (the shared toolbar) is absolutely centred over the
  // whole row by CSS, so all three sit on one line.
  const hands = [makeHand(0), makeHand(1)];
  const handHalf0 = el("div", "aw-fight-handhalf");
  const handHalf1 = el("div", "aw-fight-handhalf");
  handHalf0.append(hands[0].el);
  handHalf1.append(hands[1].el);
  controlsRow.append(handHalf0, handHalf1, bottom);

  const boardEls = [el("div", "aw-fight-board"), el("div", "aw-fight-board")];
  boardsRow.append(boardEls[0], boardEls[1]);
  wrap.append(top, boardsRow, controlsRow);
  root.append(wrap);

  function makeTeam(side) {
    const box = el("div", `aw-fight-team side-${side}`);
    // No name label any more (teacher, 12/8/2026 second pass) — "TEAM 1"/
    // "TEAM 2" was clutter once the layout itself already says which number
    // belongs to which board (it sits dead centre above it). No +/- buttons
    // here either: the teacher's own points are a SEPARATE number beside the
    // clock (makeHand below), so this one stays purely what the game scored.
    const value = el("div", "aw-fight-score", "0");
    box.append(value);
    return { el: box, value };
  }

  // ----- the teacher's own points (Đợt 124, second + third pass) -----
  // One box below EACH board, entirely by hand: TAP or swipe UP adds a point,
  // swipe DOWN takes one off. Kept apart from the game's score on purpose — it
  // survives Start again and a template change (module-level, see handPoints)
  // and only a page reload clears it, which is exactly how the scoreboards on
  // the classroom whiteboard behave.
  //
  // "Asleep at zero" (12/8/2026, third pass): a box reading 0 is dimmed, and
  // the FIRST tap/swipe on a dimmed box only wakes it (brightens, no change) —
  // the SECOND is what actually bumps the number. A touchscreen box that sits
  // at the bottom of the frame gets brushed by accident; this costs the
  // teacher nothing when the box is already away from zero (never dims, every
  // touch counts immediately), only guards the box's resting state.
  function makeHand(side) {
    const box = el("div", `aw-fight-hand side-${side}`);
    box.tabIndex = 0;
    box.title = "Teacher points — tap or swipe up to add, swipe down to take off";
    const numWrap = el("div", "aw-fight-handnum");
    const value = el("div", "aw-fight-handvalue", "0");
    numWrap.append(value);
    box.append(numWrap);

    const SWIPE = 14;                       // px before a drag counts as a swipe
    let startY = null, acted = false;
    box.style.touchAction = "none";
    box.addEventListener("pointerdown", e => {
      startY = e.clientY; acted = false;
      try { box.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    });
    box.addEventListener("pointermove", e => {
      if (startY === null || acted) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) < SWIPE) return;
      acted = true;                          // one step per swipe, not one per pixel
      interact(side, dy < 0 ? +1 : -1);
    });
    const end = () => {
      if (startY === null) return;
      if (!acted) interact(side, +1);        // a plain tap adds a point
      startY = null; acted = false;
    };
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
    return { el: box, value, numWrap };
  }

  // The gate described above: a dimmed (0, not-yet-woken) box just wakes on
  // this touch: `handAwake` flips true and the box repaints brighter, but
  // `handPoints` doesn't move — the very next touch is what calls bump().
  function interact(side, delta) {
    if (handPoints[side] === 0 && !handAwake[side]) {
      handAwake[side] = true;
      sound.click();
      paintHand(side, 0);
      return;
    }
    bump(side, delta);
  }

  function bump(side, delta) {
    handPoints[side] += delta;
    // Landing back on exactly 0 re-arms the "wake first" gate — the box is at
    // rest again, so the next touch should ask before it moves once more.
    if (handPoints[side] === 0) handAwake[side] = false;
    sound.click();
    paintHand(side, delta);
  }

  const HAND_SLIDE_MS = 200;
  // `dir` is the numeric change just applied (+1/-1), or 0/undefined for a
  // repaint with no value change (waking a dimmed box, or the initial/carried-
  // over paint at match start) — only a real change gets the slide animation.
  function paintHand(side, dir) {
    const h = hands[side];
    const v = handPoints[side];
    const text = String(Math.abs(v));
    const isNeg = v < 0;
    // "Asleep at zero": dim while resting on 0 and not yet woken by a touch —
    // still legible, not fully invisible (teacher's ask: "vẫn dim một chút đủ
    // nhìn"). Away from zero the box is ALWAYS bright; only 0 can dim.
    h.el.classList.toggle("is-dim", v === 0 && !handAwake[side]);
    if (dir) { animateHandSlide(side, text, isNeg, dir); return; }
    h.value.textContent = text;
    h.value.classList.toggle("is-neg", isNeg);
  }

  // The "odometer" swap (teacher's ask, 12/8/2026 third pass): the OLD number
  // slides out one way while the NEW one slides in from the other, instead of
  // just replacing the text. Increasing (+1) reads as the number climbing —
  // new value rises in from below, old one exits upward; decreasing is the
  // mirror. `.aw-fight-handnum` is the fixed-height clipping window (CSS) that
  // makes the two overlapping numbers look like one sliding strip.
  function animateHandSlide(side, text, isNeg, dir) {
    const h = hands[side];
    const oldEl = h.value;
    const newEl = el("div", "aw-fight-handvalue" + (isNeg ? " is-neg" : ""), text);
    newEl.style.transform = `translateY(${dir > 0 ? "100%" : "-100%"})`;
    h.numWrap.append(newEl);
    const outAnim = oldEl.animate(
      [{ transform: "translateY(0)" }, { transform: `translateY(${dir > 0 ? "-100%" : "100%"})` }],
      { duration: HAND_SLIDE_MS, easing: "ease", fill: "forwards" });
    const inAnim = newEl.animate(
      [{ transform: `translateY(${dir > 0 ? "100%" : "-100%"})` }, { transform: "translateY(0)" }],
      { duration: HAND_SLIDE_MS, easing: "ease", fill: "forwards" });
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      // `fill:"forwards"` holds the last keyframe after the animation ends —
      // cancel() releases that hold before the inline style reset below, or
      // the reset is a no-op and the element stays visually stuck mid-flight
      // (same trap documented in templates/anagram/anagram.js).
      try { outAnim.cancel(); inAnim.cancel(); } catch { /* already gone */ }
      oldEl.remove();
      newEl.style.transform = "";
      h.value = newEl;
    };
    inAnim.onfinish = settle;
    setTimeout(settle, HAND_SLIDE_MS + 120);   // fallback: a hidden/backgrounded tab can stall animation events
  }

  // ----- per-side running totals -----
  // `game` is whatever the template's own scoring says right now; `bonus` is the
  // speed bonuses this match's rules awarded. The teacher's own points are NOT
  // in here — they live in `handPoints` at module level and are shown in their
  // own box, so they outlive the match.
  const game = [0, 0], bonus = [0, 0];
  // "The slower team keeps nothing" (fightLateScores:false). It cannot be done
  // by subtracting what the word earned at the moment the team finishes: the
  // template hands its points over ~1.76s LATER, when its "+12" finishes flying
  // into the scoreboard (measured — PERFECT delay 420 + flight 920 + pulse 420).
  // Subtracting first made the number dive to -12 and crawl back to 0 in front
  // of the class. Instead the team's total is FROZEN at what it was before the
  // word, and whatever the template adds afterwards is cancelled as it arrives.
  const freezeAdj = [0, 0];         // permanent, accumulated across rounds
  const frozenAt = [null, null];    // game+bonus at the moment of freezing, while a freeze is on
  const boards = [null, null];          // the template's own handles, via ctl.attach
  // Each board's REAL engine teardown (core/engine.js's own cleanupAll —
  // stops that board's 500ms clock interval, closes its menu/panel, runs the
  // template's own cleanup), registered by engine.js itself via
  // ctl.registerCleanup below. Đợt 131: teardown() used to call only
  // `boards[side].lock(true)` (the TEMPLATE's lock, from ctl.attach) and
  // never this — so every match rebuild left both boards' old clocks ticking
  // forever in the background, each free to fire its own "time's up" cue on
  // its own leftover schedule while the NEW match's clock read something
  // else entirely (teacher, 12/8/2026: heard it with 2 minutes still showing).
  const cleanupFns = [null, null];
  let roundIndex = 0;
  // Side that got the current word RIGHT first — i.e. actually won the round.
  // Getting there first while WRONG does not win it (teacher, 12/8/2026), see
  // ctl.wordDone.
  let roundWinner = null;
  // Đợt 133 — the side of the FIRST correct answer this round, while the
  // TIE_WINDOW_MS grace period is still open deciding whether a second
  // correct answer (if one comes) counts as simultaneous. `roundWinner`
  // itself stays null the whole time this is set — see finalizeSingleWinner/
  // finalizeTie below, the only two places allowed to clear it.
  let pendingWinner = null;
  let pendingTimer = null;
  // Which sides have already had their go at the current word (right or wrong).
  // A team that answered WRONG is finished with this word — locked and out —
  // but the round itself stays open for the other team, so "has this side
  // finished" and "has the round been won" are two different questions and
  // need two different flags.
  let roundDone = [false, false];
  let roundTimer = null;
  let matchOver = false;
  let torndown = false;
  let playRelaying = false;             // guards the "one PLAY starts both" relay
  // Đợt 134 — a running snapshot of the speaking board's voice state, merged
  // field-by-field (playing / levels are reported separately, at different
  // moments — see anagram.js's setListenGlow/startEqualizer). Lets a board
  // PULL "what's true right now" instead of only relying on the one-shot
  // PUSH from reportVoiceState below, which is silently dropped if the
  // receiving board's own listen button doesn't exist yet at that exact
  // instant (the two boards' render() calls are not perfectly synchronized —
  // teacher-reported "2 loa lệch màu" bug, one board stuck on the old color
  // through an entire clip because the push landed in that gap).
  let lastVoiceState = null;

  function totalOf(side) { return game[side] + bonus[side] + freezeAdj[side]; }
  // Called on every score report while a freeze is on: keep the total pinned to
  // what it was when the freeze started.
  function holdFreeze(side) {
    if (frozenAt[side] === null) return;
    freezeAdj[side] = frozenAt[side] - (game[side] + bonus[side]);
  }
  function paintScore(side) {
    const v = totalOf(side);
    teams[side].value.textContent = String(v);
    teams[side].value.classList.toggle("is-neg", v < 0);
  }

  function later(fn, ms) {
    clearTimeout(roundTimer);
    roundTimer = setTimeout(() => { roundTimer = null; if (!torndown) fn(); }, ms);
  }

  // The round is settled for BOTH teams — let each board finally show the ✓/✗
  // it has been holding back (teacher, 12/8/2026: a board that finishes while
  // the other is still playing must not display which answer was right, or the
  // team still choosing simply copies it). Called only once nobody is left to
  // play, so there is nothing left to give away. Templates that don't
  // implement `reveal` are unaffected.
  function revealBoards() {
    boards.forEach(b => { try { b && b.reveal && b.reveal(); } catch { /* board already gone */ } });
  }

  // Đợt 133 — the SINGLE path that turns "one side finished correctly" into
  // a settled round, whether that's decided the instant it happens (no
  // tie-window was open) or TIE_WINDOW_MS later once the window closes with
  // nobody else joining it. Kept as one function so revealBoards()/
  // later(advanceRound…) below is only ever reached from exactly one place —
  // calling it twice for the same round would reveal / fly a score twice.
  function finalizeSingleWinner(side) {
    roundWinner = side;
    const other = side === 0 ? 1 : 0;
    if (fo.fightSpeedBonus > 0) {
      bonus[side] += fo.fightSpeedBonus;
      paintScore(side);
      flashTeam(side, `+${fo.fightSpeedBonus}`);
    }
    teams[side].el.classList.add("is-won");
    // Lock the other side out only if it is still IN the round; one that
    // already answered wrong is locked already, and re-locking it would
    // repaint it as "too slow" on top of its own wrong-answer feedback.
    if (fo.fightFirstRule === "lock" && !roundDone[other]) boards[other] && boards[other].lock(true);
    const nobodyLeft = fo.fightFirstRule === "lock" || roundDone[other];
    if (nobodyLeft) revealBoards();
    later(advanceRound, nobodyLeft ? ROUND_HOLD_MS : LATE_LIMIT_MS);
  }

  // Đợt 133 (teacher): two correct finishes within TIE_WINDOW_MS of each
  // other are simultaneous — BOTH score, neither is locked out or frozen.
  // `roundWinner` deliberately stays null (there is no EXCLUSIVE winner);
  // `ctl.mayScore()` already treats null as "let it count", so a tie needs no
  // extra flag of its own — see mayScore's own comment.
  function finalizeTie(sideA, sideB) {
    [sideA, sideB].forEach(side => {
      if (fo.fightSpeedBonus > 0) {
        bonus[side] += fo.fightSpeedBonus;
        paintScore(side);
        flashTeam(side, `+${fo.fightSpeedBonus}`);
      }
      teams[side].el.classList.add("is-won");
    });
    revealBoards();
    later(advanceRound, ROUND_HOLD_MS);
  }

  // ----- the round: both boards hold the SAME word index -----
  function advanceRound() {
    if (matchOver || torndown) return;
    // Safety net for the walk-away path (the 20s backstop fires straight in
    // here): nobody may leave a round still owing a hidden result, or the
    // board would carry the withheld grey into the next word.
    revealBoards();
    roundWinner = null;
    // A pending tie-window can't outlive its own round — boardMoved() (Next/
    // Previous) and this natural round-turnover both jump straight past
    // whatever it was waiting to decide.
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    pendingWinner = null;
    roundDone = [false, false];
    // The winner's glow belongs to the word that was just won, not to the next
    // one — leaving it on made one team look permanently ahead.
    teams.forEach(t => t.el.classList.remove("is-won"));
    // Release any "slower team" freeze — freezeAdj keeps what it cancelled, so
    // the next word scores normally from the frozen total.
    frozenAt[0] = frozenAt[1] = null;
    const total = Math.max(boards[0]?.total || 0, boards[1]?.total || 0);
    if (roundIndex + 1 >= total) { endMatch(); return; }
    roundIndex++;
    boards.forEach(b => { if (b) { b.lock(false); b.goToIndex(roundIndex); } });
  }

  function endMatch() {
    if (matchOver) return;
    matchOver = true;
    revealBoards();   // never end a match with the last word's result still hidden
    boards.forEach(b => b && b.lock(true));
    showResult();
  }

  const ctl = {
    // --- what the template asks about ---
    shareLetters: fo.fightContent === "same",
    // Only board 0 is allowed to speak: both boards show the same word, and two
    // copies of one clip starting a few ms apart is an echo, not a reading.
    speaks(side) { return side === 0; },
    isLocked(side) { return matchOver || (roundWinner !== null && roundWinner !== side && fo.fightFirstRule === "lock"); },
    // The frames have no score chip in fight mode, so a template's "+N" flies
    // all the way out to this team's number on the strip above its board.
    scoreTarget(side) { return teams[side].value; },

    // Đợt 133 (teacher: "chỉ phát 1 voice duy nhất cho cả 2 đội") — a tap on
    // EITHER board's listen button routes here (see anagram.js's
    // handleListenTap), and this always hands it to board 0 — the one board
    // ctl.speaks() ever lets own real playback — regardless of which board
    // was actually tapped. There is never more than one <audio> element
    // playing across the whole match.
    requestVoiceToggle(clipId) {
      if (boards[0] && boards[0].toggleVoiceRemote) boards[0].toggleVoiceRemote(clipId);
    },
    // The speaking board reports every glow/equalizer change here (from
    // anagram.js's setListenGlow / startEqualizer) — relayed straight to
    // whichever board is NOT side, so both boards' listen buttons glow and
    // jump identically off the ONE real clip. A board with nothing
    // registered for `syncVoice` (a template that hasn't opted in) simply
    // doesn't receive anything — safe no-op.
    reportVoiceState(side, state) {
      lastVoiceState = { ...lastVoiceState, ...state };
      const other = side === 0 ? 1 : 0;
      if (boards[other] && boards[other].syncVoice) boards[other].syncVoice(state);
    },
    // Đợt 134 — the PULL half of the fix above: a board calls this itself
    // right after it (re)builds its own listen button (anagram.js's
    // render()), instead of only waiting to be pushed to. Returns null until
    // the speaking board has reported anything at all this match.
    voiceState() { return lastVoiceState; },

    // Both boards start together (teacher, 12/8/2026). Pressing PLAY on either
    // one presses the other's too, so the two clocks — and therefore the shared
    // clock, which reads board 0's — can never disagree. The guard stops the
    // programmatic click from bouncing straight back.
    playPressed(side) {
      if (playRelaying) return;
      playRelaying = true;
      const other = side === 0 ? 1 : 0;
      const btn = boardEls[other] && boardEls[other].querySelector(".aw-play-overlay button");
      if (btn && !btn.disabled) btn.click();
      setTimeout(() => { playRelaying = false; }, 400);
    },

    // The engine's own teardown for this board (Đợt 131) — called from
    // engine.js's startGame() unconditionally, before anything else, so
    // teardown() below can always reach it. Kept separate from `attach`
    // (the TEMPLATE's own handle) on purpose: a template that never joins
    // the fight contract at all would still leak its clock without this.
    registerCleanup(side, fn) { cleanupFns[side] = fn; },

    // --- what the template tells us ---
    attach(side, api) {
      boards[side] = api;
      // A board that mounts late (pane 1 always does) must not sit on word 1
      // while the other is already on word 3.
      if (roundIndex > 0) api.goToIndex(roundIndex);
      if (ctl.isLocked(side)) api.lock(true);
    },
    // A board has finished with the current word — `info.correct === false`
    // means it finished it WRONG.
    //
    // ⚠️ BEING FIRST IS NOT THE SAME AS WINNING (teacher, 12/8/2026). Racing to
    // a wrong answer must not take the word away from the other team: a wrong
    // finish only ends THAT team's go (it is marked wrong and locked out as
    // usual, exactly as in single play), while the round stays open and the
    // other team keeps playing, unblocked and un-greyed, until it finishes.
    // Only a CORRECT finish wins the round and locks the loser out.
    //
    // ⭐ Đợt 133 (teacher): a CORRECT finish no longer wins the round the
    // instant it happens — it opens a TIE_WINDOW_MS grace period first. If
    // the OTHER side also finishes correctly inside that window, it's a tie
    // (finalizeTie: both score). Otherwise, once the window closes with
    // nobody else joining it, the first side wins exclusively exactly as
    // before (finalizeSingleWinner). The other side stays UNLOCKED for the
    // whole window (isLocked() only fires once `roundWinner` is actually
    // set), which is exactly what lets it still tie if it's that close.
    wordDone(side, info) {
      if (matchOver || torndown) return;
      if (info && info.index !== roundIndex) return;    // a stale word (teacher used Next) — ignore
      if (roundDone[side]) return;                      // this side already had its go this round
      roundDone[side] = true;
      // Anything that doesn't say otherwise counts as correct: templates whose
      // word can only ever END correct (Anagram's tap-in-order modes) simply
      // don't send the flag.
      const correct = !info || info.correct !== false;
      const other = side === 0 ? 1 : 0;

      if (!correct) {
        // Wrong. This board is out of the round — lock it so the mistake
        // stands. Its result stays HIDDEN for now (the template withholds the
        // ✓/✗ and shows only neutral grey) precisely because the other team is
        // still choosing and would otherwise read the answer straight off this
        // board.
        boards[side] && boards[side].lock(true);
        if (pendingWinner !== null) {
          // The OTHER side already answered correctly and is waiting out the
          // tie-window — this side finishing WRONG rules a tie out, so settle
          // right now through the SAME path the timer would have used rather
          // than let both fire (revealBoards()/advanceRound must only ever
          // run once per round).
          clearTimeout(pendingTimer); pendingTimer = null;
          const decided = pendingWinner; pendingWinner = null;
          finalizeSingleWinner(decided);
          return;
        }
        // If the other team has already had its go, nobody is left to play —
        // show both results and move on. Otherwise wait for them, with the
        // same walk-away backstop used by "let the other team finish" so a
        // lesson can never hang.
        const settled = roundDone[other] || roundWinner !== null;
        if (settled) revealBoards();
        later(advanceRound, settled ? ROUND_HOLD_MS : LATE_LIMIT_MS);
        return;
      }

      // CORRECT.
      if (roundWinner !== null) {
        // Round already has an EXCLUSIVE winner (the tie-window, if there
        // ever was one, is long closed) — old "late correct" path, unchanged:
        // with `fightLateScores:false` only the winner scores it, so this
        // team's number is frozen where it is and the points still on their
        // way in are cancelled as they land. (Anagram additionally self-
        // rejects via ctl.mayScore() at the exact moment its flight would
        // land, which can never be fooled by timing the way this numeric
        // freeze alone could — see mayScore's own comment. Both stay active
        // together: this covers every OTHER fight-enabled template too.)
        if (!fo.fightLateScores) { frozenAt[side] = game[side] + bonus[side]; holdFreeze(side); paintScore(side); }
        revealBoards();
        later(advanceRound, ROUND_HOLD_MS);
        return;
      }

      if (pendingWinner === null) {
        // First correct answer this round — open the tie-window rather than
        // deciding immediately.
        pendingWinner = side;
        pendingTimer = setTimeout(() => {
          pendingTimer = null;
          if (torndown) return;   // teardown() already cleared this timer -- belt and braces
          const decided = pendingWinner; pendingWinner = null;
          finalizeSingleWinner(decided);
        }, TIE_WINDOW_MS);
        return;
      }

      // A second correct answer, with `pendingWinner` still set — proves this
      // landed WITHIN the window: JS is single-threaded, so nothing else could
      // have run between the window opening and this call, meaning the timer
      // above hasn't fired yet. That makes it a tie.
      clearTimeout(pendingTimer); pendingTimer = null;
      const firstSide = pendingWinner; pendingWinner = null;
      finalizeTie(firstSide, side);
    },
    // Đợt 133 — does THIS side's word actually get to count, checked at the
    // exact moment its score animation is about to land (~0.9-1.8s after
    // wordDone() above, well after any tie-window has closed — so unlike a
    // pre-computed freeze snapshot, this can never be caught out by timing).
    // `roundWinner === null` covers BOTH "nobody has finished this round yet"
    // (shouldn't really be reachable this late, permissive default) AND "it
    // was a tie" (finalizeTie deliberately never sets roundWinner) — both
    // cases mean "let it count". A side that lost a DECISIVE round only
    // counts if the teacher's own "slower team still keeps its points" rule
    // says so. Templates that don't call this (Quiz today) are unaffected —
    // they still go through the numeric freeze above alone, exactly as before.
    mayScore(side) {
      if (roundWinner === null) return true;
      if (roundWinner === side) return true;
      return fo.fightLateScores !== false;
    },
    // The teacher pressed Next/Previous on either board: both boards move, and
    // the round follows the board that was pressed.
    boardMoved(side, index) {
      if (index === roundIndex || matchOver || torndown) return;
      roundIndex = index;
      roundWinner = null;
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
      pendingWinner = null;
      roundDone = [false, false];
      clearTimeout(roundTimer); roundTimer = null;
      teams.forEach(t => t.el.classList.remove("is-won"));
      const other = side === 0 ? 1 : 0;
      if (boards[other]) { boards[other].lock(false); boards[other].goToIndex(index); }
      if (boards[side]) boards[side].lock(false);
    },

    // --- what the ENGINE reports (see startGame's `fight` option) ---
    onScore(side, value) { game[side] = Number(value) || 0; holdFreeze(side); paintScore(side); },
    // `seconds` is the RAW count (engine.js sends the number, not its own
    // single-digit-minutes chip text) — the strip pads both halves to 2
    // digits ("05:07", not "5:07") so the width never shifts and the ":"
    // stays parked on the seam between the two boards (teacher, 12/8/2026).
    onTimer(side, seconds) {
      if (side !== 0) return;
      const s = Math.max(0, Math.floor(Number(seconds) || 0));
      const m = Math.floor(s / 60);
      clockEl.textContent = `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    },
    onFinish(side) {
      // One board ran out of words/lives on its own — the match is over for
      // both, and the winner is simply whoever has more points.
      if (!matchOver) later(endMatch, ROUND_HOLD_MS);
    },
    // Options panel: pane 0's engine hands us its draft so the fight settings
    // live in the SAME panel as everything else (see engine.buildOptionsPanel).
    buildOptions,
    // Options > Apply, from either board. The real act is ours, not the board's
    // copy, so the settings are written (and saved) here and the whole match is
    // rebuilt — both boards, one word order, new rules.
    applyOptions(opts) {
      if (!activity.options) activity.options = {};
      Object.assign(activity.options, opts);
      // Same rule as the engine's own Apply: remember it on the real act, never
      // on a throwaway "conv_"/"mist_" copy.
      const id = String(activity.id || "");
      if (id && !/^(conv|mist)_/.test(id)) {
        import("./store.js").then(m => m.saveActivity(activity)).catch(() => {});
      }
      ctl.restartMatch();
    },
    // "Start again" (either board's menu, or the result panel) rebuilds the
    // MATCH — one board restarting on its own would leave the two on different
    // words with one of the scoreboards stuck. Also how a mid-match TEMPLATE
    // CHANGE lands: the engine converts the act, then hands the whole thing
    // over here so BOTH boards are rebuilt onto it together.
    restartMatch(nextActivity) { teardown(); startFight(root, nextActivity || activity, { onExit, base: originAct }); },
    // What a NEW act must be derived from (Change template). Two things make
    // this the right source rather than what a board is holding:
    //  • each board only ever sees a frozen COPY of the match act (its own
    //    fixed word order, shuffleQuestions forced off — see actFor below);
    //  • after one switch the match act is itself a conversion, so converting
    //    from it again would compound the loss — hence `originAct`, the
    //    teacher's original, carried across every rebuild by restartMatch.
    sourceActivity() { return originAct; },
    // ⚠️ FULLSCREEN BELONGS TO THE MATCH, NOT TO A BOARD (teacher, 12/8/2026:
    // "fullscreen hiển thị đủ toàn bộ cả 2 khung act + dải điểm + hàng nút").
    // The engine's own Fullscreen button promotes ITS `root` — and inside a
    // match each board's engine was started with `root = boardEls[i]`, so
    // going full-screen from there blew up ONE BOARD to fill the screen and
    // left the other board, the scoreboard strip and the toolbar outside it
    // entirely. The match's own root is the only element that holds all three,
    // so the shared button routes here instead.
    toggleFullscreen() {
      if (anyFsElement()) exitFsAny();
      else requestFsOn(root);
    },
    // The MODE button, also drawn by the engine, comes back here.
    isFight: true,
    // Back to a single board. `base` goes with it for the same reason it
    // travelled in: leaving a match that had been switched to another template
    // must not let that CONVERTED act become the origin every later switch
    // converts from.
    exitFight() { teardown(); startGame(root, activity, { onExit, base: originAct }); }
  };

  function flashTeam(side, text) {
    const chip = el("div", "aw-fight-flash", text);
    teams[side].el.append(chip);
    setTimeout(() => chip.remove(), 1200);
  }

  // ----- result -----
  function showResult() {
    const a = totalOf(0), b = totalOf(1);
    const panel = el("div", "aw-fight-result");
    // Đợt 134 (teacher: "TEAM 1/2 WINS" -> "TEAM LEFT/RIGHT WINS", applies to
    // every fightMode template — currently Anagram and Quiz). Side 0 is
    // always the LEFT board and side 1 always RIGHT (their team name labels
    // were dropped back in Đợt 125 — see the comment on .aw-fight-team below
    // — so position is the only thing left distinguishing them on screen).
    const winner = a === b ? "IT'S A DRAW" : (a > b ? "TEAM LEFT WINS" : "TEAM RIGHT WINS");
    panel.append(el("div", "aw-fight-result-title", winner));
    const rowEl = el("div", "aw-fight-result-scores");
    rowEl.append(
      el("div", "aw-fight-result-score" + (a >= b ? " is-top" : ""), String(a)),
      el("div", "aw-fight-result-vs", "—"),
      el("div", "aw-fight-result-score" + (b >= a ? " is-top" : ""), String(b))
    );
    panel.append(rowEl);
    const again = el("button", "aw-btn aw-btn-primary", "Start again");
    again.type = "button";
    again.onclick = () => { sound.click(); ctl.restartMatch(); };
    panel.append(again);
    wrap.append(panel);
    try { sound.fanfare(); } catch { /* ignore */ }
  }

  // ----- the fight settings, shown inside the normal Options panel -----
  function buildOptions({ panel, draft, mkCheck, mkRadioChoice }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Fight mode"));
    const rowContent = el("div", "aw-opt-row");
    const cur = fightOptionsFrom(draft);
    // Đợt 133 (teacher): "Same word, same letters" is GONE — dropped
    // entirely, not just re-labelled. A legacy act that still carries
    // `fightContent:"same"` (nothing migrates existing acts, see
    // FIGHT_DEFAULTS) shows "Same words, mix letters" selected here instead
    // — visually the nearest of the two remaining choices — but its OWN
    // value on disk stays "same" unless the teacher actually touches this
    // row; `ctl.shareLetters` above still reads it correctly either way.
    rowContent.append(
      mkRadioChoice("aw-fight-content", "scramble", "Same words, mix letters",
        cur.fightContent === "scramble" || cur.fightContent === "same", v => draft.fightContent = v),
      mkRadioChoice("aw-fight-content", "different", "Different words", cur.fightContent === "different", v => draft.fightContent = v)
    );
    g.append(rowContent);
    panel.append(g);

    // Đợt 134 (teacher: "tách... thành 1 cụm riêng, cân đối khoảng cách" —
    // these 3 controls used to be crammed into the SAME group as "Same/
    // Different words" above with nothing but a row-gap between any of the
    // 4 rows, reading as one dense, unevenly-spaced block). Own group, own
    // label, same margin-bottom rhythm as every other group in this panel.
    const gRule = el("div", "aw-opt-group");
    gRule.append(el("div", "aw-opt-label", "Round rule"));
    const rowRule = el("div", "aw-opt-row");
    rowRule.append(
      mkRadioChoice("aw-fight-rule", "lock", "First team wins the word", cur.fightFirstRule === "lock", v => draft.fightFirstRule = v),
      mkRadioChoice("aw-fight-rule", "finish", "Let the other team finish", cur.fightFirstRule === "finish", v => draft.fightFirstRule = v)
    );
    gRule.append(rowRule);

    const rowBonus = el("div", "aw-opt-row");
    const slider = el("input", "aw-opt-slider");
    slider.type = "range"; slider.min = "0"; slider.max = "20"; slider.step = "1";
    slider.value = String(cur.fightSpeedBonus);
    const val = el("span", "aw-opt-slidval", cur.fightSpeedBonus === 0 ? "Off" : "+" + cur.fightSpeedBonus);
    slider.oninput = () => {
      const v = Math.max(0, Math.min(20, +slider.value | 0));
      draft.fightSpeedBonus = v;
      val.textContent = v === 0 ? "Off" : "+" + v;
    };
    rowBonus.append(el("span", "aw-opt-sublabel", "Bonus for finishing first"), slider, val);
    gRule.append(rowBonus);
    panel.append(gRule);

    // "The slower team still keeps its points" stays OUTSIDE the new "Round
    // rule" group — it's about what happens AFTER a round ends, not about
    // the round rule itself — but still gets its own group (rather than
    // dangling with no label/spacing of its own) so the panel's rhythm
    // stays even throughout: group, group, group, not group + 3 loose rows.
    const gLate = el("div", "aw-opt-group");
    const rowLate = el("div", "aw-opt-row");
    rowLate.append(mkCheck(cur.fightLateScores !== false, "The slower team still keeps its points",
      v => draft.fightLateScores = v));
    gLate.append(rowLate);
    panel.append(gLate);
  }

  // ----- build the two plays -----
  // Both sides share the SAME item objects (so "same letters" can hand the
  // scramble from one board to the other, and so Start-with-mistakes `src`
  // identity still works); only the ORDER and the options object differ.
  // `itemsKey` — which array in activity.content holds the playable items —
  // is per-template ("items" for Anagram, "questions" for Quiz, ...; see
  // tpl.itemsKey, the same field core/mistakes.js reads). Hardcoding ".items"
  // here worked only by accident while Anagram was the sole fightMode
  // template; Quiz joining (12/8/2026, trial) is what surfaced it.
  const itemsKey = getTemplate(activity.type)?.itemsKey || "items";
  const srcItems = (activity.content && activity.content[itemsKey]) || [];
  const orderA = fo.fightContent === "different" && (activity.options || {}).shuffleQuestions !== false
    ? shuffle([...srcItems]) : [...srcItems];
  const orderB = fo.fightContent === "different"
    ? shuffle([...srcItems])
    : orderA;
  // The item order is fixed HERE, once, so both boards agree on what word 3 is;
  // letting each play shuffle for itself is what made them drift apart.
  const baseOrder = (activity.options || {}).shuffleQuestions !== false && fo.fightContent !== "different"
    ? shuffle([...srcItems]) : orderA;

  function actFor(side) {
    const items = fo.fightContent === "different" ? (side === 0 ? orderA : orderB) : baseOrder;
    return {
      ...activity,
      options: { ...(activity.options || {}), shuffleQuestions: false },
      content: { ...(activity.content || {}), [itemsKey]: items },
      _fight: { side, ctl }
    };
  }

  // Clear any scramble kept from a previous round of this act, so a new fight
  // doesn't reuse the exact tile order the class has already solved.
  srcItems.forEach(it => { if (it && it._fightOrder) delete it._fightOrder; });

  startGame(boardEls[0], actFor(0), { onExit, fight: { side: 0, ctl } });
  startGame(boardEls[1], actFor(1), { fight: { side: 1, ctl } });

  // ONE toolbar: keep pane 0's, drop pane 1's (see the header comment).
  const below0 = boardEls[0].querySelector(".aw-below");
  if (below0) bottom.append(below0);
  const below1 = boardEls[1].querySelector(".aw-below");
  if (below1) below1.remove();
  // Assignment strips belong under a single act, not under a match.
  boardEls.forEach(b => b.querySelectorAll(".aw-as-bars").forEach(x => x.remove()));

  paintScore(0); paintScore(1);
  paintHand(0); paintHand(1);   // carried over from the previous match, by design

  // ----- FULLSCREEN (teacher, 12/8/2026 fourth pass) -----
  // A match must go full-screen as ONE picture: both boards + the score/clock
  // strip + the toolbar, all visible, nothing cut off, no browser chrome.
  //
  // ⚠️ Why a CLASS and not the `:fullscreen` pseudo-class. core/app.css already
  // has `:fullscreen .aw-page { width:100vw; height:100vh }` and
  // `:fullscreen .aw-below { display:none }` for SINGLE mode — inside a match
  // those hit EACH BOARD's own page (blowing both up to the whole screen) and
  // delete the shared toolbar. Overriding them needs higher specificity, and
  // every vendor spelling must be written as its OWN rule (a browser drops a
  // whole selector list containing one pseudo-class it doesn't know), so the
  // pseudo-class route costs ~20 near-duplicate rules. One JS-toggled class
  // beats all of them on specificity and stays in ONE readable block.
  const FS_EVENTS = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
  function anyFsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement ||
           document.mozFullScreenElement || document.msFullscreenElement || null;
  }
  // Vendor-probed, same spellings core/engine.js uses (the TOMKO panel needs
  // the prefixed ones — unprefixed alone left it filling a corner there).
  function requestFsOn(elem) {
    const fn = elem.requestFullscreen || elem.webkitRequestFullscreen ||
               elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (fn) try { fn.call(elem); } catch { /* refused (no user gesture) */ }
  }
  function exitFsAny() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen ||
               document.mozCancelFullScreen || document.msExitFullscreen;
    if (fn) try { fn.call(document); } catch { /* ignore */ }
  }
  function syncFullscreenClass() {
    // `root` is what the engine's Fullscreen button actually promotes, so only
    // treat it as ours when the fullscreen element really contains this match.
    const fsEl = anyFsElement();
    wrap.classList.toggle("is-fs", !!fsEl && fsEl.contains(wrap));
  }
  FS_EVENTS.forEach(evt => document.addEventListener(evt, syncFullscreenClass));
  syncFullscreenClass();   // already full-screen when the match is rebuilt (Start again / Apply)

  // ⚠️ Nothing in here may throw. teardown() runs on the way INTO a rebuild
  // (Start again / Apply / leaving fight mode), so an exception here stops the
  // new match from ever being built and the old one just sits there — no error
  // the teacher can see. It talks to plays that are already being dismantled,
  // which is exactly where a stray throw comes from.
  function teardown() {
    torndown = true;
    clearTimeout(roundTimer);
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }   // Đợt 133 — same reasoning as roundTimer
    FS_EVENTS.forEach(evt => { try { document.removeEventListener(evt, syncFullscreenClass); } catch { /* ignore */ } });
    boards.forEach(b => { try { b && b.lock(true); } catch { /* board already gone */ } });
    // Đợt 131: the actual fix for the ghost-clock bug — stop BOTH boards'
    // engines for real, not just the template's lock() above. Safe to call
    // even when a board already tore itself down through its own button
    // (cleanupAll() is idempotent, see core/engine.js) and safe when a board
    // never finished mounting (cleanupFns[side] stays null, guarded below).
    cleanupFns.forEach(fn => { try { fn && fn(); } catch { /* board already gone */ } });
  }
}
