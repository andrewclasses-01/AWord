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
//     ctl.wordDone(side, { index, earned, perfect }) a word was just solved
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
  fightContent: "same",      // same | scramble | different
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
// startFight(root, activity, { onExit }) — replaces the single play in `root`.
// Returns nothing; the MODE button inside the shared toolbar comes back here
// to switch off again.
// ---------------------------------------------------------------
export function startFight(root, activity, { onExit } = {}) {
  root.innerHTML = "";
  const fo = fightOptionsFrom(activity.options || {});

  // ----- shell -----
  const wrap = el("div", "aw-fight");
  const top = el("div", "aw-fight-top");
  const boardsRow = el("div", "aw-fight-boards");
  const handsRow = el("div", "aw-fight-hands");
  const bottom = el("div", "aw-fight-bottom");

  // ----- the strip above the boards -----
  // Two halves that line up with the two boards (each team's number sits dead
  // centre over ITS OWN board — teacher, 12/8/2026), plus the clock floating
  // over the join. The teacher's own hand points used to live in this strip
  // too (either side of the clock) but moved DOWN below each board, dead
  // centre under it, at the teacher's request (12/8/2026, third pass) — see
  // `handsRow` below.
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

  // ----- one row below the boards, each hand-points box under its own board -----
  // Same two-halves grid as `top` (matches boardsRow's columns/gap) so each
  // box sits dead centre under ITS OWN board, same reasoning as the team score
  // above it.
  const hands = [makeHand(0), makeHand(1)];
  const handHalf0 = el("div", "aw-fight-handhalf");
  const handHalf1 = el("div", "aw-fight-handhalf");
  handHalf0.append(hands[0].el);
  handHalf1.append(hands[1].el);
  handsRow.append(handHalf0, handHalf1);

  const boardEls = [el("div", "aw-fight-board"), el("div", "aw-fight-board")];
  boardsRow.append(boardEls[0], boardEls[1]);
  wrap.append(top, boardsRow, handsRow, bottom);
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
  let roundIndex = 0;
  let roundWinner = null;               // side that finished the current word first
  let roundTimer = null;
  let matchOver = false;
  let torndown = false;
  let playRelaying = false;             // guards the "one PLAY starts both" relay

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

  // ----- the round: both boards hold the SAME word index -----
  function advanceRound() {
    if (matchOver || torndown) return;
    roundWinner = null;
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

    // --- what the template tells us ---
    attach(side, api) {
      boards[side] = api;
      // A board that mounts late (pane 1 always does) must not sit on word 1
      // while the other is already on word 3.
      if (roundIndex > 0) api.goToIndex(roundIndex);
      if (ctl.isLocked(side)) api.lock(true);
    },
    wordDone(side, info) {
      if (matchOver || torndown) return;
      if (info && info.index !== roundIndex) return;    // a stale word (teacher used Next) — ignore
      const first = roundWinner === null;
      if (first) {
        roundWinner = side;
        if (fo.fightSpeedBonus > 0) {
          bonus[side] += fo.fightSpeedBonus;
          paintScore(side);
          flashTeam(side, `+${fo.fightSpeedBonus}`);
        }
        teams[side].el.classList.add("is-won");
        if (fo.fightFirstRule === "lock") {
          const other = side === 0 ? 1 : 0;
          boards[other] && boards[other].lock(true);
          later(advanceRound, ROUND_HOLD_MS);
        } else {
          // Let the other team finish — but never hang the lesson on it.
          later(advanceRound, LATE_LIMIT_MS);
        }
      } else {
        // The slower team just got there. With `fightLateScores:false` only the
        // winner scores the round, so this team's number is frozen where it is
        // and the points still on their way in are cancelled as they land.
        if (!fo.fightLateScores) { frozenAt[side] = game[side] + bonus[side]; holdFreeze(side); paintScore(side); }
        later(advanceRound, ROUND_HOLD_MS);
      }
    },
    // The teacher pressed Next/Previous on either board: both boards move, and
    // the round follows the board that was pressed.
    boardMoved(side, index) {
      if (index === roundIndex || matchOver || torndown) return;
      roundIndex = index;
      roundWinner = null;
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
    // words with one of the scoreboards stuck.
    restartMatch(nextActivity) { teardown(); startFight(root, nextActivity || activity, { onExit }); },
    // The MODE button, also drawn by the engine, comes back here.
    isFight: true,
    exitFight() { teardown(); startGame(root, activity, { onExit }); }
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
    const winner = a === b ? "IT'S A DRAW" : (a > b ? "TEAM 1 WINS" : "TEAM 2 WINS");
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
    rowContent.append(
      mkRadioChoice("aw-fight-content", "same", "Same word, same letters", cur.fightContent === "same", v => draft.fightContent = v),
      mkRadioChoice("aw-fight-content", "scramble", "Same word, letters mixed differently", cur.fightContent === "scramble", v => draft.fightContent = v),
      mkRadioChoice("aw-fight-content", "different", "Different words", cur.fightContent === "different", v => draft.fightContent = v)
    );
    g.append(rowContent);

    const rowRule = el("div", "aw-opt-row");
    rowRule.append(
      mkRadioChoice("aw-fight-rule", "lock", "First team wins the word", cur.fightFirstRule === "lock", v => draft.fightFirstRule = v),
      mkRadioChoice("aw-fight-rule", "finish", "Let the other team finish", cur.fightFirstRule === "finish", v => draft.fightFirstRule = v)
    );
    g.append(rowRule);

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
    g.append(rowBonus);

    const rowLate = el("div", "aw-opt-row");
    rowLate.append(mkCheck(cur.fightLateScores !== false, "The slower team still keeps its points",
      v => draft.fightLateScores = v));
    g.append(rowLate);
    panel.append(g);
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

  // ⚠️ Nothing in here may throw. teardown() runs on the way INTO a rebuild
  // (Start again / Apply / leaving fight mode), so an exception here stops the
  // new match from ever being built and the old one just sits there — no error
  // the teacher can see. It talks to plays that are already being dismantled,
  // which is exactly where a stray throw comes from.
  function teardown() {
    torndown = true;
    clearTimeout(roundTimer);
    boards.forEach(b => { try { b && b.lock(true); } catch { /* board already gone */ } });
  }
}
