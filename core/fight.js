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
//        + optional `review()` (Đợt 223) = "hand back this board's own review
//        array right now" — same shape as ui.finish()'s `review` (see
//        core/engine.js's showReview), read only once, at endMatch(), to build
//        the "Show answers" panel of the end-of-match result. Not knowing it
//        just means that board's side of the panel stays empty.
//     ctl.wordDone(side, { index, correct })         this board finished a word
//        `correct:false` = finished it WRONG, which ends only THIS board's go:
//        the round stays open and the other team plays on (see wordDone).
//     ctl.isLocked(side)                             refuse input while locked
//     ctl.scoreTarget(side)                          where "+8" should fly to
//     ctl.shareLetters / ctl.speaks(side)            keep the two boards fair
//   A template that does none of this still works — it just runs twice with no
//   round logic, which is why the flag is opt-in rather than automatic.
//   ⚠️ Đợt 222 had also added an optional `timeUp()` (fight referee calls it
//   when the Time delay window shuts with a board still unanswered, so it can
//   run its own HẾT GIỜ = SAI path). Đợt 223 removed the only call site —
//   removing "Round rule" made that lock silent by design (see finalizeSingleWinner) —
//   so the 5 templates that implemented it had the method deleted too; don't
//   re-add it without a caller.
// =============================================================

import { el, shuffle } from "./utils.js";
import { press } from "./press.js";
import { startGame } from "./engine.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { getTemplate } from "./registry.js";
import { resolveActivity, variantsOf, contentSetsOf } from "./content-view.js";

// Đợt 223 — same two-line escaper core/engine.js keeps locally for its own
// review list; `el()`'s third argument is innerHTML, so question/answer text
// must go through this before it lands there.
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
// ⭐⭐ Đợt 187 (teacher, 18/8/2026) — THIS IS NOW A SLIDER, "TIME DELAY". The
// constant stays as the DEFAULT, so every act ever saved keeps the exact 0.1s
// behaviour it has today unless the teacher moves the new control.
const TIE_WINDOW_MS = 100;
// ⭐⭐ Đợt 216 (thầy, 20/8/2026) — "∞" ON THAT SLIDER IS NOW LITERAL.
// It used to be a 5-second cap (Đợt 187: "chờ tối đa 5s … hết thanh time 5s đó
// thì khóa trả lời"). Raising the slider's ceiling to 10s made that cap absurd —
// ∞ would have waited LESS than the four notches sitting just below it — and the
// teacher settled it by taking the cap off outright: "nâng nấc đó lên không giới
// hạn, cứ chờ mãi thôi cho đến khi câu đó được hoàn thành".
// ⚠️⚠️ SO ∞ HAS NO TIMER AT ALL. The round now ends on an EVENT (the other board
// reporting its word done, right or wrong), not on a clock. Two consequences,
// both deliberate and both the teacher's call:
//   · the 20s walk-away backstop that every other path keeps (LATE_LIMIT_MS) does
//     NOT cover this one — a team that simply stops playing holds the round open,
//     and the way out is the teacher's own Menu ▸ Start again;
//   · nothing may be handed `Infinity` as a duration. `setTimeout(fn, Infinity)`
//     fires on the NEXT TICK (the spec clamps a non-finite delay to 0), which
//     would have made ∞ the FASTEST setting on the slider instead of the slowest.
//     Every site that could receive it is guarded — see `tieUnlimited` below and
//     runWaitBar() in core/engine.js.
// Below this the wait is over before the eye can read a bar, so no bar is drawn
// (teacher: the bar shows "ở MỌI mức từ 0,2s trở lên"). 0.1s is exactly the old
// invisible tie-window, and it stays invisible.
const WAIT_BAR_MIN_MS = 200;
// What the Speed bonus slider jumps to the first time it becomes reachable. The
// old slider was 0..20 with 0 meaning "Off"; the new one is 1..100 with no Off
// at all (turning the bonus off is what dragging TIME DELAY back to 0.1s does),
// so an act carrying the old 0 has no legal value to show and is repaired to this.
const DEFAULT_SPEED_BONUS = 5;

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
  fightSpeedBonus: 0,        // extra points for the team that got there first
  // ⭐ Đợt 187 — TIME DELAY, in SECONDS, or **0 = ∞** (the app's own house
  // convention for "unlimited", the same one Lives and Find the match already use
  // at the left end of their sliders — see normLives()). Default 0.1 = the
  // hard-coded tie window this replaces, so an act that has never seen the
  // control behaves byte for byte as before.
  // ⭐⭐ Đợt 216 — the range is now 0.1 … 10.0 (was 0.1 … 3.0); the legal values
  // are the DELAY_STEPS ladder below, not "every tenth up to ten".
  fightTieWindow: 0.1,
  // ⭐⭐ Đợt 202 (teacher, 19/8/2026) — IN TURNS. The question pool is DEALT OUT
  // between the two boards instead of being played by both: each team gets its
  // own half and no question ever appears on both boards. TWO gates guard it
  // (see `turnsMode` below): this option AND the template's own `tpl.fightTurns`
  // opt-in — today Type the answer alone, at the teacher's request ("tạm thời
  // áp dụng với duy nhất type the answer để tôi thử nghiệm trước").
  // OFF by default, so every act ever saved keeps the behaviour it has today.
  fightTurns: false,
  // ⭐⭐ Đợt 259 (thầy, 25/8/2026) — PICK TIME. How long the team whose turn it is
  // has to CHOOSE a question in a pick-turn match (Crossword · Open the box). Run
  // out and the turn simply passes to the other team — no penalty, nothing is
  // opened, the clock just starts again on the other side.
  // ⚠️ IN SECONDS, 1 … 10, with **0 = ∞** — the same house convention Time delay
  // and Lives already use for "unlimited", so nothing downstream needs a second
  // special case. DEFAULT 0 (∞) on purpose: this is a brand-new deadline, and
  // every act ever saved must keep playing exactly as it does today until the
  // teacher moves the control himself. At ∞ the bar still SHOWS (it is what says
  // whose turn it is now that the losing board no longer fades) — it just
  // breathes in place instead of draining. See `pickMs` in startFight.
  fightPickTime: 0,
  // ⭐⭐ Đợt 276 (thầy, 27/8/2026) — MISS WAIT. Once one side has already
  // answered WRONG and the round is still open (nobody has WON it yet), how
  // long does the still-playing side keep its chance before the referee
  // gives up and moves the class on? Thầy: *"đội bên trái làm trước bị sai,
  // thì đội sau ko thể đợi mãi tùy ý được mà phải có thanh thời gian gì đó
  // thiết lập được phần này"*.
  // This used to be the module's own hard-coded 20-second walk-away backstop
  // (LATE_LIMIT_MS) with nothing on screen to control it. It is now a
  // slider, and LATE_LIMIT_MS itself is UNTOUCHED everywhere else it is
  // used — the other walk-away wait, in finalizeSingleWinner, for "the round
  // already has a winner, the loser is still finishing to keep its own
  // points" (Both-finish mode) — the teacher's own call to keep those two
  // separate, 27/8/2026.
  // IN SECONDS, 0 … 20, or **-1 = ∞** — deliberately NOT the house "0 means
  // ∞" convention every other fight slider on this panel uses, because 0 IS
  // a real, legal value here (an instant cutoff the moment the mistake
  // lands), so it cannot double as the infinity marker too. DEFAULT 20 —
  // exactly LATE_LIMIT_MS's old fixed value, so no act saved before this
  // control existed changes behaviour by a single millisecond until the
  // teacher moves it himself.
  fightWrongWait: 20
};

// ⭐⭐ Đợt 216 (thầy, 20/8/2026) — WHAT VALUES THE TIME DELAY SLIDER CAN HOLD.
// The teacher raised the ceiling from 3s to 10s and chose the shape himself out
// of three offered: "0,1s tới 3s, rồi 0,5s tới 10s".
// ⚠️ NOT A UNIFORM STEP, ON PURPOSE. A flat 0.1 all the way would have given the
// slider 100 notches, and since Đợt 213 a tap beside the thumb moves exactly ONE
// — reaching 8s from 1s would have been seventy taps. Coarsening the half nobody
// tunes finely keeps it at 44 (+ ∞) while leaving 0.1 … 3.0 exactly as precise as
// it has always been, which is the half the teacher actually adjusts.
// ⚠️ Built, not typed out: a hand-written list of 44 numbers is a list that will
// disagree with the slider's own arithmetic the first time either is edited.
// ⚠️ `Math.round(x * 10) / 10` at every step — plain accumulation of 0.1 drifts to
// 0.30000000000000004, and these numbers are compared for equality by posOf().
const DELAY_STEPS = (() => {
  const out = [];
  for (let t = 1; t <= 30; t++) out.push(Math.round(t) / 10);        // 0.1 … 3.0 in tenths
  for (let t = 35; t <= 100; t += 5) out.push(Math.round(t) / 10);   // 3.5 … 10.0 in halves
  return out;
})();
// The nearest LEGAL delay to any number — used both by the panel (to seat an act
// saved under the old 0.1-only ladder) and by fightOptionsFrom (to repair a
// hand-edited act). Every old value 0.1 … 3.0 is still on the ladder, so no act
// in the library moves by a single tenth.
function snapDelay(sec) {
  let best = DELAY_STEPS[0];
  for (const v of DELAY_STEPS) if (Math.abs(v - sec) < Math.abs(best - sec)) best = v;
  return best;
}

// 0 means ∞ — everything that needs a real number of milliseconds goes through
// here, so that one special value is decoded in exactly one place.
export function tieWindowMsOf(o) {
  return o.fightTieWindow === 0 ? Infinity : Math.round(o.fightTieWindow * 1000);
}
// Is the speed bonus even on the table? At 0.1s it is not (teacher: "khi là 0,1s
// thì thanh speed bonus ẩn và ko thưởng đội nhanh hơn — vì đội nhanh hơn có điểm,
// đội chậm hơn bị khóa rồi, 0,1s chênh coi như bằng nhau"). From 0.2s up the
// slower team can score too, and the bonus becomes the only thing left that
// rewards being fast.
export function speedBonusApplies(o) { return tieWindowMsOf(o) >= WAIT_BAR_MIN_MS; }
// ⭐ Đợt 259 — PICK TIME in milliseconds, or Infinity for the ∞ notch. Same
// one-place-to-decode rule as tieWindowMsOf above; see FIGHT_DEFAULTS.
// ⚠️ Infinity, deliberately, and NOT a very large number: every site that could
// receive it is guarded the same way Đợt 216 had to guard ∞ on Time delay —
// `setTimeout(fn, Infinity)` fires on the NEXT TICK (the spec clamps a non-finite
// delay to 0), which would make ∞ the FASTEST setting instead of the slowest.
export function pickTimeMsOf(o) {
  return o.fightPickTime === 0 ? Infinity : Math.round(o.fightPickTime * 1000);
}
// ⭐ Đợt 276 — MISS WAIT in milliseconds, or Infinity for the ∞ notch. Same
// one-place-to-decode rule as the two functions above — EXCEPT the sentinel
// is -1, not 0: see FIGHT_DEFAULTS.fightWrongWait for why 0 can't do double
// duty here. Every setTimeout site that could receive this stays guarded the
// same way — Infinity fires on the NEXT TICK, not never, so it must never
// reach `later()`; see the `Number.isFinite(wrongWaitMs)` guard in wordDone.
export function wrongWaitMsOf(o) {
  return o.fightWrongWait < 0 ? Infinity : Math.round(o.fightWrongWait * 1000);
}

export function fightOptionsFrom(options = {}) {
  const o = { ...FIGHT_DEFAULTS };
  ["fightContent", "fightSpeedBonus", "fightTieWindow", "fightTurns", "fightPickTime", "fightWrongWait"].forEach(k => {
    if (options[k] !== undefined) o[k] = options[k];
  });
  // ⭐ Đợt 187 — the ceiling went 20 -> 100 (teacher: "kéo từ 1 đến 100 điểm").
  // Still clamped from 0 so an act saved under the OLD 0..20 slider — including
  // its "Off" 0 — loads without being rewritten behind the teacher's back; the
  // panel is where a 0 gets repaired, and only once the delay makes it reachable.
  o.fightSpeedBonus = Math.max(0, Math.min(100, Number(o.fightSpeedBonus) || 0));
  // TIME DELAY: 0 stays 0 (∞). Anything else is snapped onto the DELAY_STEPS
  // ladder — the exact set of values the slider can produce — so a hand-edited or
  // corrupted act can never hand the round logic a window of, say, 40 minutes.
  // ⚠️⚠️ Đợt 216 — THIS LINE IS HALF THE FEATURE, not tidying. It used to clamp to
  // `Math.min(3, …)`: leaving it alone would have let the teacher drag the new
  // slider to 7s, watch it save, and find it silently back at 3s the next time the
  // act was opened — the ceiling lives in TWO places and both have to move.
  const tw = Number(o.fightTieWindow);
  o.fightTieWindow = tw === 0 ? 0 : (Number.isFinite(tw) ? snapDelay(tw) : 0.1);
  // Đợt 202 — a plain flag, but forced to a real boolean: it is read in three
  // places that all mean "is this a dealt match", and a stray "false" string off
  // a hand-edited act would make every one of them silently say yes.
  o.fightTurns = o.fightTurns === true;
  // ⭐ Đợt 259 — PICK TIME: 0 stays 0 (∞); anything else is forced onto a whole
  // second in 1 … 10, the exact set the slider can produce. Same reasoning as the
  // Time delay line above — a hand-edited or corrupted act must not be able to
  // hand the round logic a 40-minute choosing window, and a value the slider
  // cannot show would be silently rewritten the first time the panel opened.
  const pt = Number(o.fightPickTime);
  o.fightPickTime = pt === 0 ? 0 : (Number.isFinite(pt) ? Math.max(1, Math.min(10, Math.round(pt))) : 0);
  // ⭐ Đợt 276 — MISS WAIT: -1 stays -1 (∞); anything else is forced onto a
  // whole second in 0 … 20, the exact range the slider can produce. Same
  // reasoning as every clamp above: a hand-edited or corrupted act must not
  // be able to hand the round logic a value the slider cannot show.
  const mw = Number(o.fightWrongWait);
  o.fightWrongWait = mw < 0 ? -1 : (Number.isFinite(mw) ? Math.max(0, Math.min(20, Math.round(mw))) : 20);
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

  // ⭐⭐ Đợt 181 (17/8/2026) — `activity` IS THE LIBRARY ACT, NOT A RESOLVED COPY.
  // Until now core/engine.js handed the match its already-resolved `activity`
  // (core/content-view.js's flattened view: ONE clue set baked in, `variants`
  // and `contentSets` stripped off). Two things came of that, both measured:
  //   • the Options panel inside a match could not offer the sub-acts at all —
  //     no ENG1/ENG2/VI1/VI2, no PRACTICE/HOMEWORK — because the only act the
  //     boards could see no longer knew it had any (teacher, 17/8/2026);
  //   • Options > Apply SAVED that stripped copy over the real act (see
  //     applyOptions below), i.e. a match could quietly delete the other three
  //     clue sets from the teacher's library.
  // The match now holds the library act and resolves it ITSELF, here, once per
  // build. Picking a different clue set is therefore just applyOptions() +
  // restartMatch(): the rebuild resolves again and both boards land on it.
  // ⚠️ `playAct` is what the BOARDS play; `activity` is what OPTIONS write to
  // and what gets saved. Never swap the two.
  const playAct = resolveActivity(activity);

  // ⭐ Đợt 202 — THE ITEM POOL IS READ HERE, AT THE TOP. It used to be read down
  // beside actFor(), which is still where the two boards' ORDERS are built; only
  // the pool itself moved up, because IN TURNS has to know how many questions
  // exist before the round rules below can be decided (a pool of one cannot be
  // dealt out to two boards). `itemsKey` is the per-template field name that
  // holds the playable array — "items" for Anagram, "questions" for Quiz — the
  // same field core/mistakes.js reads.
  const itemsKey = getTemplate(activity.type)?.itemsKey || "items";
  const srcItems = (playAct.content && playAct.content[itemsKey]) || [];

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
  // ⭐⭐ Đợt 259 — THE PICK-TIME BAR, one per half, over that team's OWN board.
  // It is the thing that says WHOSE TURN IT IS TO CHOOSE, which is why it can
  // replace the 50% fade Crossword used to wear (thầy: "vì đã có thanh thời gian
  // để biết đội nào đang chọn, nên 2 đội có màu sắc như nhau").
  // ⚠️ ABSOLUTELY POSITIONED (see core/app.css), NOT a second flex item. Each
  // team's number has to stay dead centre over its own board — a measured rule
  // from 12/8/2026, where an ordinary sibling here pushed it 13px off — and an
  // out-of-flow bar takes no share of the row's width at all. The height it needs
  // is reserved with padding on the half AND on the clock box together, so the
  // score and the clock stay on one shared line exactly as before.
  const pickBars = [makePickBar(), makePickBar()];
  half0.append(pickBars[0].el);
  half1.append(pickBars[1].el);
  // ⭐⭐⭐ Đợt 281 (thầy, 28/8/2026) — THANH MISS WAIT, một cái mỗi nửa, CÙNG
  // CHỖ và CÙNG KHUÔN với thanh PICK TIME ngay trên (absolutely positioned,
  // không lấy phần rộng nào của hàng — xem lý do ở `pickBars`). Chỉ khác: chỉ
  // MỘT bên bật tại một thời điểm (bàn còn được chơi tiếp), không phải cả hai
  // như pick time. Logic tô màu/đếm giờ nằm ở `paintMissBar`/`startMissBar`
  // cạnh `paintWaitBar`, đọc phía dưới.
  const missBars = [makeMissBar(), makeMissBar()];
  half0.append(missBars[0].el);
  half1.append(missBars[1].el);

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

  // ⭐ Đợt 259 — one pick-time bar. Deliberately the SAME two-node shape as the
  // engine's own wait bar (`.aw-waitbar` / `-fill`, core/app.css): the drain is a
  // single CSS width transition of the exact window length, and the ∞ state is a
  // pure-CSS breathe with no JS timer behind it at all. Built for BOTH halves on
  // every match — pick mode or not — because `pickMode` is not resolved until
  // much further down this function; the CSS only ever shows them inside
  // `.aw-fight.is-pickmode` (set once, right after pickMode is known).
  function makePickBar() {
    const bar = el("div", "aw-fight-pickbar");
    const fill = el("div", "aw-fight-pickbar-fill");
    bar.append(fill);
    return { el: bar, fill };
  }

  // ⭐⭐⭐ Đợt 281 — same two-node shape as makePickBar() right above (and, one
  // level further back, core/engine.js's own `.aw-waitbar`/`-fill`): the drain
  // is a single CSS width transition of the exact window length. See
  // `paintMissBar` (near `paintWaitBar`) for the three-band green→orange→red
  // colouring this one adds on top.
  function makeMissBar() {
    const bar = el("div", "aw-fight-missbar");
    const fill = el("div", "aw-fight-missbar-fill");
    bar.append(fill);
    return { el: bar, fill };
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
  // TIME COST (Đợt 139) — what each board's IDLE clock has taken off this team,
  // as a running total sent by that board's engine (absolute, not a delta, so a
  // repeat or a missed report can never make it drift). Deliberately its own
  // slot rather than folded into `game`: the freeze below cancels word points,
  // and the teacher's rule is that the clock keeps charging a frozen team all
  // the same. Nothing else in this file may touch it.
  const cost = [0, 0];
  // "The slower team keeps nothing" (fightLateScores:false). It cannot be done
  // by subtracting what the word earned at the moment the team finishes: the
  // template hands its points over ~1.76s LATER, when its "+12" finishes flying
  // into the scoreboard (measured — PERFECT delay 420 + flight 920 + pulse 420).
  // Subtracting first made the number dive to -12 and crawl back to 0 in front
  // of the class. Instead the team's total is FROZEN at what it was before the
  // word, and whatever the template adds afterwards is cancelled as it arrives.
  const freezeAdj = [0, 0];         // permanent, accumulated across rounds
  const frozenAt = [null, null];    // the total a frozen side is pinned to, while a freeze is on
  // ⭐⭐ Đợt 183 — WHAT A FROZEN TEAM IS PINNED TO: its total at the START of the
  // round, snapshotted here, NOT its total at the moment it is frozen.
  //
  // Measured bug (Open the box, pick mode): the slower team kept the point it
  // had just been denied. Freezing to "the total right now" only works for a
  // template whose points arrive LATE — Anagram hands its "+12" over ~1.76s
  // after the word, so the freeze lands first and cancels it. Open the box and
  // Quiz call `ui.setScore()` SYNCHRONOUSLY, before they report the finish, so
  // by the time the freeze ran the point was already inside `game[side]` and it
  // pinned the team to a total that already included it.
  // A round-start baseline cannot be caught out by either order, which is the
  // whole point: nothing about the fix depends on when a template reports.
  //
  // ⭐⭐ AND IT IS SNAPSHOTTED IN **TOTAL** SPACE — `+ freezeAdj` — which also
  // fixes a bug that was in here from the start (measured in the same run):
  // `holdFreeze` ASSIGNS `freezeAdj = frozen - (game + bonus)`, so pinning a
  // team to a raw `game + bonus` reading silently GIVES BACK everything an
  // earlier round had cancelled. Second freeze of a match, and the first
  // round's denied point quietly reappears on the scoreboard — a team can only
  // gain from it, so nobody complains, and the arithmetic is invisible on
  // screen. `freezeAdj` accumulates; the baseline has to live in the same
  // space it does.
  const roundBase = [0, 0];
  function snapRoundBase() {
    roundBase[0] = game[0] + bonus[0] + freezeAdj[0];
    roundBase[1] = game[1] + bonus[1] + freezeAdj[1];
  }

  // ⭐⭐ PICK-TURN ROUNDS (Đợt 183, the teacher's rules of 17/8/2026) — the SECOND
  // round model this file knows, for the games whose whole point is that the
  // class chooses what to play next (Open the box · Find the match · Crossword).
  //
  //   normal rounds  the referee walks item 0, 1, 2… and both boards follow.
  //   PICK rounds    both boards sit on their own grid; the team whose TURN it
  //                  is has a normal-looking grid, the other's is faded and
  //                  dead. That team taps a box — and the referee opens THAT
  //                  box on BOTH boards, in the same frame.
  //
  // A template opts in with `tpl.fightPick`:
  //   "wait"  the round waits for BOTH teams (Open the box · Find the match):
  //           the first correct answer scores, the other team still gets its go,
  //           and a correct answer arriving second scores nothing.
  //   "lock"  the first correct answer takes it (Crossword): the other board is
  //           locked at once, its answer is shown but counts as WRONG.
  //
  // NEXT PICKER — the teacher's own catch-up rule: the team that finished LAST
  // and got it WRONG chooses next ("đội sau sai sẽ luôn được tiếp tục chọn ô câu
  // hỏi tiếp theo mà không đảo lượt"); only when nobody ended wrong does the turn
  // alternate. In a "lock" game the locked team IS the wrong one.
  const pickMode = (getTemplate(activity.type)?.fightPick) || null;
  // ⭐⭐ IN TURNS (Đợt 202) — ONE pool, DEALT OUT: each board plays its own half
  // and no question is ever on both boards at once. Three gates, all of which
  // must hold, and the last two are why this is a `const` and not just the
  // option:
  //   • the teacher ticked it (`fo.fightTurns`);
  //   • the TEMPLATE opted in (`tpl.fightTurns`) — the opt-in law of Đợt 143.
  //     Only Type the answer declares it today, so an act that carries the
  //     option and is then switched to another template quietly plays as a
  //     normal match instead of dealing a pool the new template never agreed to;
  //   • there are at least 2 questions to deal — below that, one board would be
  //     handed an EMPTY list and mount with nothing on it.
  // ⚠ Pick-turn games are excluded outright: their whole round model is "both
  // boards open the SAME box", which a dealt pool has nothing to open.
  // `turnsTpl` = CAN this match offer In turns at all (the last two gates);
  // it is also exactly what decides whether the checkbox is built in the Options
  // panel, so the control and the behaviour can never disagree about who is
  // eligible. `turnsMode` = and is it actually ON.
  const turnsTpl = !!getTemplate(activity.type)?.fightTurns && !pickMode && srcItems.length >= 2;
  const turnsMode = turnsTpl && fo.fightTurns === true;
  // ⭐⭐ Đợt 259 (thầy, 25/8/2026) — WHO CHOOSES FIRST IS NOW A COIN TOSS.
  // It used to be a hard 0, so the LEFT board opened every single match ("hiện
  // đại luôn đội bên trái trước"). Only pick-turn games have a first chooser at
  // all; outside them this value is never read, so it stays the plain 0 it was.
  // ⚠️ Just the FIRST turn. Everything after it is the teacher's own catch-up
  // rule in endPickRound() — the team that ended wrong keeps choosing — which
  // this does not touch.
  let pickTurn = pickMode ? (Math.random() < 0.5 ? 1 : 0) : 0;   // which side may choose the next item
  let pickOpen = !!pickMode;      // true while both boards wait on their grid for a choice
  // ⭐⭐ Đợt 259 — PICK TIME: how long that side has to choose, or Infinity for ∞.
  // Read ONCE per match, like every other option here.
  const pickMs = pickMode ? pickTimeMsOf(fo) : 0;
  // The bars are built for every match (see makePickBar); this class is what lets
  // the CSS show them, so they can never appear in a game that has no pick turn.
  if (pickMode) wrap.classList.add("is-pickmode");
  let playedRounds = 0;           // items actually played — pick mode counts these, not roundIndex
  let lastFinisher = null;        // { side, correct } — the LAST board to finish this round
  // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — "ROUND RULE" VÀ "SLOWER TEAM KEEPS POINTS"
  // BỊ BỎ HẲN KHỎI OPTIONS. TIME DELAY một mình quyết định luôn cả hai câu hỏi
  // đó, đúng lời thầy: *"0,1 time delay thì không cho đội chậm làm, lớn hơn thì
  // cho làm tức là đã có both finish rồi"*.
  //   • ĐÚNG nấc KHÔNG CÓ DELAY (fightTieWindow === 0.1, nấc thấp nhất) — đội
  //     chậm bị khoá NGAY khi đội kia thắng ("First wins" cũ, xem lockLoser()).
  //   • BẤT KỲ nấc nào cao hơn (kể cả ∞) — đội chậm KHÔNG bị khoá, được chơi
  //     tiếp tới khi tự xong ("Both finish" cũ) và LUÔN giữ điểm mình kiếm
  //     được ("Slower team keeps points" cũ giờ luôn bật — nó chỉ có ý nghĩa ở
  //     đúng chế độ không-khoá này, xem lateScores()).
  // Does a decided round lock the team that did not win it? Outside pick mode
  // this is now derived from TIME DELAY alone; inside it, the game's own rule.
  // ⭐⭐ Đợt 187 — TIME DELAY, decoded ONCE for the whole match.
  // ⚠️ PICK-TURN GAMES ARE SEALED OFF FROM TIME DELAY (teacher, 18/8/2026:
  // "open the box không cần … crossword không cần"). They are pinned to the old
  // fixed window, so an act that picked up a 3s delay while it was an Anagram and
  // was then switched to Open the box mid-match cannot quietly carry that delay
  // into rules the teacher settled separately at Đợt 183.
  // ⭐⭐ Đợt 202 — IN TURNS IS SEALED OFF FROM ALL THREE RACE CONTROLS, the same
  // way pick-turn games are sealed off from TIME DELAY. This is not tidiness: the
  // two boards hold DIFFERENT questions in a dealt match, so every one of those
  // rules is about a race that is not being run.
  //   • Time delay / Speed bonus  "who got to the SAME word first" — there is no
  //     same word to be first at, so the window is pinned to the old invisible
  //     0.1s and no wait bar is drawn (and lockLoser()/lateScores() read
  //     `turnsMode` FIRST, before ever looking at fightTieWindow, for exactly
  //     this reason — locking the slower team would take away ITS OWN
  //     question, which the other team never had a claim on).
  //   • Fight content              the deal decides the content outright.
  // The Options panel greys all three while In turns is ticked (see buildOptions),
  // so nothing on screen claims to decide something these lines have already
  // settled — the dead-control trap of Đợt 143.
  const tieMs = (pickMode || turnsMode) ? TIE_WINDOW_MS : tieWindowMsOf(fo);
  const tieUnlimited = !pickMode && !turnsMode && fo.fightTieWindow === 0;
  // ⭐⭐ Đợt 276 — MISS WAIT, decoded ONCE for the whole match, same as every
  // other option above. Applies in EVERY round model (ordinary, pick-turn, In
  // turns) because the branch it governs — one side already wrong, nobody has
  // WON yet, the other side still free to finish — is not sealed off from any
  // of them the way the race controls above are; see the WRONG branch of
  // ctl.wordDone.
  const wrongWaitMs = wrongWaitMsOf(fo);
  // The wait bar is drawn only for the ORDINARY round model. The teacher went
  // through the three pick-turn games one by one: "open the box không cần …
  // crossword không cần … find the match có cần" — and Find the match is an
  // ordinary-round game (it has no `fightPick`), so `!pickMode` is the whole test.
  const waitBarMs = (!pickMode && !turnsMode && tieMs >= WAIT_BAR_MIN_MS) ? tieMs : 0;
  // The bonus is off entirely at 0.1s — see speedBonusApplies(). Resolved once
  // here so the two award sites can not disagree about it.
  // In a pick-turn game the bonus is untouched by all this — it keeps the plain
  // "reward whoever got there first" meaning it has had since Đợt 124, because
  // the control that would have switched it off (TIME DELAY) is not offered there.
  const speedBonus = turnsMode ? 0
    : ((pickMode || speedBonusApplies(fo)) ? fo.fightSpeedBonus : 0);
  // ⭐⭐⭐ Đợt 223 — CHỈ CÒN ĐỌC TIME DELAY. Đúng nấc "không delay" (0.1s, nấc
  // thấp nhất trên thanh trượt) mới khoá đội chậm; mọi nấc khác — kể cả ∞ —
  // không khoá. ∞ vốn đã không còn ai để khoá vào lúc vòng chốt (xem nhánh ∞
  // trong wordDone: cả hai bàn đều đã xong trước khi có một người thắng), nên
  // giá trị ở đây không đổi gì trên màn hình dù là gì.
  const lockLoser = () => (turnsMode ? false
    : (pickMode ? pickMode === "lock" : fo.fightTieWindow === 0.1));
  // Does a team that finishes correctly AFTER the round is won keep what it
  // earned? The teacher's pick rules say no ("đội sau chọn đúng thì … không có
  // điểm"), so pick mode fixes it instead. Outside pick mode this is now
  // ALWAYS true (Đợt 223 — "Slower team keeps points" removed, its old
  // meaning kept as the only behaviour left): a team is only ever still
  // playing after roundWinner is set when lockLoser() was false in the first
  // place, i.e. it was never locked out, so whatever it earns on its own time
  // is its own to keep.
  const lateScores = () => (turnsMode ? true : (pickMode ? false : true));

  // ----- the wait bar (Đợt 187) — one per board, drawn by core/engine.js down in
  // its own bottom row, because that is the only place that knows where this
  // board's Menu / keyboard / ‹ › buttons ended up. This file owns the TIMING
  // (it is the referee's window, not the board's), the engine owns the pixels.
  const waitBarFns = [null, null];
  // Đợt 217 — mỗi bàn để lại đây một cách "hãy dừng / hãy chạy tiếp" (registerPause).
  const pauseFns = [null, null];
  // ⭐⭐⭐ Đợt 220 — mỗi bàn để lại đây một cách "vẽ lại hai mũi tên ‹ › của tôi"
  // (registerNavGate). Xem `nobodyElseIsPlaying()` bên dưới để biết vì sao trọng tài
  // phải CHỦ ĐỘNG gọi: trạng thái "bàn kia còn đang làm không" đổi vì việc của BÀN
  // KIA, mà `ui.setNav` thì chỉ chạy khi CHÍNH bàn này có gì đó đổi.
  const navFns = [null, null];
  // ⭐⭐⭐ Đợt 266 — mỗi bàn để lại đây một cách trả lời "bàn tôi có clip đang đọc
  // không" (registerVoiceBusy, core/engine.js). LÝ DO NÓ PHẢI Ở TRỌNG TÀI: chỉ bàn 0
  // được sở hữu tiếng thật (`ctl.speaks` ngay dưới), nên vế "clip còn đang đọc" nằm
  // trong idleGuard của từng bàn thì bàn 1 luôn trả lời FALSE — và Time cost trừ đội
  // bên phải suốt quãng cả lớp đang nghe đúng clip đó. Đo được (act VOICE, hai bàn
  // ngồi im 9 giây, Time cost 10 / idle 1s): Anagram 50/90, Quiz 50/90, True-false
  // 50/80. Thầy 26/8/2026: *"Time cost chỉ trừ điểm 1 bên (bên phải)"*.
  const voiceBusyFns = [null, null];
  // ⭐ Đợt 219 — `mode` đi kèm: `"hold"` = đứng yên tại chỗ đang chạy tới,
  // `"go"` = chạy tiếp NỐT `ms` còn lại (không kéo về đầy). Không truyền gì thì
  // đúng như cũ. Nửa bên kia nằm ở `runWaitBar` trong core/engine.js.
  function paintWaitBar(ms, mode) {
    waitBarFns.forEach(fn => { try { fn && fn(ms, mode); } catch { /* board already gone */ } });
  }

  // ⭐⭐⭐ Đợt 281 (thầy, 28/8/2026) — THANH MISS WAIT. Thầy: *"đội bên trái làm
  // trước bị sai, thì đội sau ko thể đợi mãi tùy ý được mà phải có thanh thời
  // gian gì đó thiết lập được phần này ... chạy 1 thanh thời gian có đổi màu
  // gradient ở dải phía trên để thể hiện lượng thời gian còn lại ở làm"*.
  // MISS WAIT (Đợt 276) đã có ĐỒNG HỒ THẬT từ trước (`later(advanceRound,
  // wrongWaitMs)` trong nhánh WRONG của wordDone) — cái thiếu chỉ là NGƯỜI VẼ.
  // ⭐ KHÔNG QUA `core/engine.js` NHƯ waitBar: bàn này SỐNG SẴN Ở DẢI TRÊN
  // (`half0`/`half1`, cùng nơi `pickBars` — Đợt 259 — và điểm số của mỗi đội
  // đứng), thứ CHÍNH file này dựng (xem `top`/`makeTeam` phía trên), nên trọng
  // tài tự vẽ luôn pixel của chính mình — không cần một đường registerXxxBar
  // xuyên file như waitBar phải làm (waitBar sống ở hàng nút DƯỚI, đất của
  // core/engine.js, nơi fight.js không với tới).
  // ⭐ CHỈ MỘT BÀN — bàn còn đang được chơi tiếp (đội đã sai bị khoá/che rồi,
  // không có gì để đếm ngược ở đó). Phần tử `missBars` được dựng cùng chỗ với
  // `pickBars` (xem ngay trên `makeTeam`) — đây chỉ là phần TÔ MÀU/ĐẾM GIỜ.
  let missWaitSide = -1;   // bàn nào đang đếm ngược MISS WAIT, hoặc -1 = không bàn nào
  let missTotalMs = 0;     // độ dài CẢ cửa sổ (wrongWaitMs) — mốc % cho 2 lần đổi màu
  let missBandTimers = []; // 2 hẹn giờ đổi màu (50%/20% còn lại) — huỷ/đặt lại quanh pause
  function clearMissBandTimers() { missBandTimers.forEach(t => clearTimeout(t)); missBandTimers = []; }
  // Cùng NGƯỠNG % với `.aw-roundbar-fill` (core/engine.js) — MỘT ngôn ngữ màu
  // "sắp hết giờ" cho cả app, không bịa ra một cái riêng cho MISS WAIT.
  function applyMissBand(pb, pct) {
    pb.el.classList.toggle("is-orange", pct <= 50 && pct > 20);
    pb.el.classList.toggle("is-red", pct <= 20);
  }
  // Đặt lại từ THỜI ĐIỂM HIỆN TẠI (msLeft), không phải từ đầu — gọi cả lúc bật
  // thanh LẪN lúc "go" sau một lượt tạm dừng, nên một lần tạm dừng giữa chừng
  // không làm thanh nhảy lùi về xanh rồi phải đợi lại đúng mốc cũ.
  function scheduleMissBands(pb, msLeft) {
    clearMissBandTimers();
    if (!Number.isFinite(msLeft) || missTotalMs <= 0) { applyMissBand(pb, 100); return; }
    const pctLeft = Math.max(0, Math.min(100, (msLeft / missTotalMs) * 100));
    applyMissBand(pb, pctLeft);
    const toOrangeAt = msLeft - missTotalMs * 0.5;
    const toRedAt = msLeft - missTotalMs * 0.2;
    if (toOrangeAt > 0) missBandTimers.push(setTimeout(() => applyMissBand(pb, 50), toOrangeAt));
    if (toRedAt > 0) missBandTimers.push(setTimeout(() => applyMissBand(pb, 20), toRedAt));
  }
  // Một bàn, ba trạng thái — CÙNG KHUÔN `paintPickBar` ngay dưới đây (chính nó
  // mô phỏng theo `runWaitBar` của core/engine.js): `mode` "hold"/"go" y hệt.
  function paintMissBar(side, ms, mode) {
    const pb = missBars[side];
    if (!pb) return;
    if (mode === "hold" || mode === "go") {
      if (!pb.el.classList.contains("is-on")) return;
      if (mode === "hold") {
        pb.fill.style.width = getComputedStyle(pb.fill).width;
        pb.fill.style.transition = "none";
        clearMissBandTimers();   // màu đứng nguyên ở mức vừa đọc được — không đổi giữa lúc dừng
        return;
      }
      if (!Number.isFinite(ms) || !(ms > 0)) return;
      void pb.fill.offsetWidth;
      // Nền (màu) chuyển mượt riêng .25s, KHÔNG ăn theo `ms` của bề rộng — hai
      // chuyển động khác nhịp trong CÙNG MỘT inline style, nên phải viết chung
      // một chuỗi (style.transition đặt lại là THAY, không phải CỘNG DỒN).
      pb.fill.style.transition = "width " + ms + "ms linear, background .25s ease";
      pb.fill.style.width = "0%";
      scheduleMissBands(pb, ms);
      return;
    }
    if (!(ms > 0) || torndown) {
      pb.el.classList.remove("is-on", "is-orange", "is-red");
      pb.fill.style.transition = "none";
      pb.fill.style.width = "100%";
      clearMissBandTimers();
      return;
    }
    pb.el.classList.add("is-on");
    pb.fill.style.transition = "none";
    pb.fill.style.width = "100%";
    applyMissBand(pb, 100);
    void pb.fill.offsetWidth;   // cú reflow chuẩn để khởi động lại transition CSS
    pb.fill.style.transition = "width " + ms + "ms linear, background .25s ease";
    pb.fill.style.width = "0%";
    scheduleMissBands(pb, ms);
  }
  /** Mở thanh MISS WAIT trên bàn `side` (bàn CÒN ĐƯỢC CHƠI TIẾP), đếm `ms`. */
  function startMissBar(side, ms) {
    missWaitSide = side;
    missTotalMs = ms;
    paintMissBar(side, ms);
  }
  /** Tắt thanh đang mở (nếu có) — không cần biết bàn nào, tự nhớ trong `missWaitSide`. */
  function stopMissBar() {
    if (missWaitSide < 0) return;
    paintMissBar(missWaitSide, 0);
    missWaitSide = -1;
    missTotalMs = 0;
  }

  // ⭐⭐⭐ Đợt 217 (thầy, 20/8/2026) — CHE DẤU VẾT TRẢ LỜI CỦA BÀN ĐÃ XONG.
  // *"nếu bật delay, đội xong trước hiện tích đúng/sai và tính điểm xong phải có
  // phương án ẩn ngay câu trả lời (VD quiz thì nhạt màu hơn các ô đáp án, Anagram thì
  // không hiện chữ trong ô nữa…)"*. Một cửa sổ chờ 10 giây là mười giây đội kia được
  // liếc sang bàn bên — thứ mà cửa sổ 0,1s của Đợt 133 chưa bao giờ cho đủ thời gian.
  //
  // ⭐⭐ MỘT LỚP CSS, KHÔNG PHẢI MỘT HỢP ĐỒNG MỚI. Trọng tài chỉ gắn `.is-concealed`
  // lên vỏ bàn của mình; *cái gì* là "dấu vết trả lời" thì CHÍNH TEMPLATE khai, bằng
  // vài dòng trong stylesheet của nó. Nếu thay bằng một hàm `conceal()` trong
  // `ctl.attach` thì bảy template phải sửa JS, và template nào quên là im lặng hở bài.
  // Cách này là **tự chọn tham gia** đúng luật Đợt 143: template không khai gì thì
  // không che gì, không có nút chết nào sinh ra.
  //
  // ⚠️ CHỈ KHI CÓ THANH CHỜ THẬT (thầy chốt: "từ 0,2s trở lên"). Ở 0,1s vòng đóng gần
  // như tức thì, che rồi hiện lại chỉ là một cú nháy vô nghĩa.
  // ⚠️ Che theo BÀN, không theo vòng: bàn kia đang chơi thì tuyệt đối không đụng tới.
  function conceal(side, on) {
    if (!boardEls[side]) return;
    boardEls[side].classList.toggle("is-concealed", !!on && waitBarMs >= WAIT_BAR_MIN_MS);
  }
  function unconcealAll() {
    boardEls.forEach(b => b && b.classList.remove("is-concealed"));
  }

  // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — KHOÁ IM LẶNG Ở NẤC "KHÔNG DELAY".
  // Thầy: *"đội chậm hơn sẽ bị mất màu và không có âm thanh gì"* — ở đúng nấc
  // 0,1s, đội chậm thua trong chưa đầy một phần mười giây, không hề có cơ hội
  // công bằng để phản ứng, nên khoá nó KHÔNG đi qua `timeUp()` nữa (không tiếng
  // sai, không dấu ✗, không trừ điểm — xem finalizeSingleWinner). Cái duy nhất
  // báo cho lớp biết bàn đó vừa thua là một lớp CSS chung, `filter:grayscale`
  // trên CHÍNH `.aw-fight-board` (core/app.css) — một chỗ, mọi template ăn
  // theo, không cần template nào tự khai CSS riêng như `.is-concealed`.
  function silentLose(side) {
    if (!boardEls[side]) return;
    boardEls[side].classList.add("is-fight-silentlost");
  }
  function clearSilentLose() {
    boardEls.forEach(b => b && b.classList.remove("is-fight-silentlost"));
  }

  // ---------------------------------------------------------------
  // ⭐⭐⭐ Đợt 220 (thầy, 21/8/2026) — MỘT BÀN KHÔNG ĐƯỢC TỰ SANG CÂU KHI BÀN KIA
  // CÒN ĐANG LÀM DỞ.
  // ---------------------------------------------------------------
  // Thầy: *"khi bật delay, đội chơi trước xong và đang chờ, đội sau đang làm tiếp thì
  // đội trước bấm next làm đội sau không chơi được nữa mà phải chuyển sang câu sau
  // luôn."*
  //
  // ⛔⛔ GỐC RỄ NẰM Ở `boardMoved()`, VÀ NÓ KHÔNG PHẢI LỖI — nó được viết cho MỘT
  // NGƯỜI ĐIỀU KHIỂN. Chú thích của chính nó nói *"The teacher pressed Next/Previous
  // on either board"*: hồi Đợt 124 chỉ có thầy đứng bấm, nên "bàn nào bấm thì cả hai
  // cùng đi" là đúng. Lớp học thật thì HAI ĐỘI tự bấm lấy, và đội xong trước có đủ cả
  // ba thứ để cướp câu: nút sáng hợp lệ, tay rảnh, và mười giây chờ để sốt ruột.
  //
  // ⛔⛔ VÌ SAO KHÔNG CHẶN Ở TRONG `boardMoved()` — đã cân nhắc và LOẠI: template gọi
  // `boardMoved()` SAU KHI (Quiz: ngay lúc bắt đầu trượt) nó đã tự dời mình rồi. Trọng
  // tài từ chối ở đó thì bàn bấm đã đi, bàn kia đứng lại ⇒ **hai bàn lệch câu**, tệ hơn
  // hẳn thứ đang chữa. Cửa duy nhất đúng là chặn TỪ NGUỒN: đừng để bàn đó khởi hành.
  // Nên hàm này chỉ TRẢ LỜI, người hỏi là `core/engine.js` (làm mờ nút) và template
  // (chặn phím ‹ ›).
  //
  // ⚠️ "Còn đang làm" KHÔNG chỉ là `roundDone`. Một bàn bị khoá vì luật "Slower team
  // keeps points = off" cũng hết đường trả lời dù nó chưa hề xong — bỏ sót ca đó là
  // hai mũi tên nằm mờ suốt cả nhịp giữ, chờ một đội không bao giờ bấm nữa.
  function nobodyElseIsPlaying(side) {
    if (matchOver || torndown) return true;      // hết trận thì không còn gì để bảo vệ
    const other = side === 0 ? 1 : 0;
    if (!boards[other]) return true;             // bàn kia chưa mount / đã bị dỡ
    return roundDone[other] || (roundWinner !== null && lockLoser());
  }

  /** Bảo cả hai bàn hỏi lại câu trên và vẽ lại hai mũi tên của mình. */
  function syncNavGates() {
    navFns.forEach(fn => { try { fn && fn(); } catch { /* bàn đã bị dỡ */ } });
  }

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

  // ⚠️ `- cost[side]` sits OUTSIDE the frozen part on purpose (Đợt 139).
  // holdFreeze() pins `game + bonus` to whatever it was when the team lost the
  // round; the idle cost is subtracted after that pinning, so it still lands on
  // a frozen team's number instead of being cancelled with the word's points.
  function totalOf(side) { return game[side] + bonus[side] + freezeAdj[side] - cost[side]; }
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

  // ⭐⭐⭐ Đợt 219 (thầy, 21/8/2026) — HAI ĐỒNG HỒ CỦA TRỌNG TÀI NAY DỪNG ĐƯỢC.
  // Thầy: *"game đã dừng nhưng time cost vẫn chạy, cần dừng lại tất cả mọi thứ."*
  // Time cost và đồng hồ câu nằm ở core/engine.js; hai cái CÒN LẠI nằm đây, và
  // chúng là hai cái tệ nhất nếu bỏ sót — chúng không trừ điểm, chúng SANG CÂU:
  //   · `roundTimer`   nhịp giữ 2,1s sau khi vòng chốt, và lưới an toàn 20 giây;
  //   · `pendingTimer` cửa sổ TIME DELAY (tới 10 giây từ Đợt 216).
  // Mở ☰ Menu giữa cửa sổ Time delay, bản trước đợt này: thanh chờ vẫn cạn, vòng
  // vẫn chốt, bảng vẫn sang câu sau — SAU LƯNG pop-up. Thầy quay lại thì đã mất câu.
  //
  // ⚠️ CÁCH LÀM: HUỶ RỒI ĐẶT LẠI, chứ `setTimeout` không có nút tạm dừng. Mỗi đồng
  // hồ nhớ ba thứ — việc phải làm (`fire`), còn bao nhiêu mili giây (`left`), và
  // mốc đến hạn (`endAt`) để lúc dừng còn trừ ra được phần đã trôi.
  // ⛔⛔ MỌI CHỖ HUỶ ĐỒNG HỒ PHẢI ĐI QUA `cancelRound()`/`cancelPending()`. Một dòng
  // `clearTimeout(x); x = null` sót lại sẽ xoá cái ĐỒNG HỒ mà để nguyên VIỆC PHẢI
  // LÀM, và cú thôi-tạm-dừng kế tiếp sẽ dựng dậy một vòng đã bị bỏ từ lâu — sang
  // câu một mình, không ai bấm gì.
  let roundDue = null;             // { fire, left, endAt } — nhịp giữ / lưới 20s
  let pendingDue = null;           // { fire, left, endAt } — cửa sổ Time delay
  // ⭐ Đợt 259 — ĐỒNG HỒ THỨ BA: PICK TIME (hạn chọn câu của đội đang tới lượt).
  // Cùng khuôn "huỷ rồi đặt lại" như hai cái trên, và VÌ CÙNG MỘT LÝ DO: mở ☰ Menu
  // giữa lúc thanh chọn đang cạn mà nó cứ chạy tiếp thì thầy quay lại đã mất lượt.
  let pickTimer = null;
  let pickDue = null;              // { fire, left, endAt } — hạn chọn câu
  let refPaused = false;           // trọng tài đang bị dừng?
  const pausedSides = new Set();   // bàn nào đang đòi dừng

  function armRound() {
    if (!roundDue || roundTimer || refPaused || torndown) return;
    roundDue.endAt = performance.now() + roundDue.left;
    roundTimer = setTimeout(roundDue.fire, roundDue.left);
  }
  function armPending() {
    if (!pendingDue || pendingTimer || refPaused || torndown) return;
    pendingDue.endAt = performance.now() + pendingDue.left;
    pendingTimer = setTimeout(pendingDue.fire, pendingDue.left);
  }
  function armPick() {
    if (!pickDue || pickTimer || refPaused || torndown) return;
    pickDue.endAt = performance.now() + pickDue.left;
    pickTimer = setTimeout(pickDue.fire, pickDue.left);
  }
  function cancelRound() { clearTimeout(roundTimer); roundTimer = null; roundDue = null; }
  function cancelPending() { clearTimeout(pendingTimer); pendingTimer = null; pendingDue = null; }
  function cancelPick() { clearTimeout(pickTimer); pickTimer = null; pickDue = null; }

  /**
   * Một bàn vào/ra trạng thái tạm dừng. Trọng tài dừng khi CÓ ÍT NHẤT MỘT bàn dừng
   * và chỉ chạy lại khi KHÔNG CÒN bàn nào — cùng lý lẽ với tập `pauseReasons` bên
   * engine: hai bàn là hai nguồn độc lập, một cờ đúng/sai sẽ để bàn A đóng Menu là
   * thả đồng hồ chạy trong lúc bàn B vẫn đang mở Options.
   */
  function setRefPaused(side, on) {
    if (on) pausedSides.add(side); else pausedSides.delete(side);
    const want = pausedSides.size > 0;
    if (want === refPaused) return;
    refPaused = want;
    const t = performance.now();
    if (refPaused) {
      // ⚠️ HUỶ ĐỒNG HỒ NHƯNG GIỮ VIỆC PHẢI LÀM — cố ý KHÔNG gọi `cancelRound()`/
      // `cancelPending()` ở đây: hai hàm đó vứt luôn cả `roundDue`/`pendingDue`, mà
      // đó chính là thứ cú chạy-tiếp cần để dựng lại đúng phần còn dở.
      if (roundTimer) { clearTimeout(roundTimer); roundTimer = null; roundDue.left = Math.max(0, roundDue.endAt - t); }
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; pendingDue.left = Math.max(0, pendingDue.endAt - t); }
      // ⭐ Đợt 259 — đồng hồ CHỌN CÂU dừng theo, cùng khuôn (huỷ đồng hồ, giữ việc).
      if (pickTimer) { clearTimeout(pickTimer); pickTimer = null; pickDue.left = Math.max(0, pickDue.endAt - t); }
      // ⚠️ Thanh chờ phải đứng lại CÙNG LÚC. Nó là một `transition` CSS ở hàng nút
      // dưới — KHÔNG nằm trong sân, nên `freezePlay()` của engine (chỉ quét
      // `stage.getAnimations`) không bao giờ với tới; để nguyên thì thanh cạn hết
      // trong lúc đồng hồ đứng im, và bàn hiện ra một lời hứa sai.
      paintWaitBar(0, "hold");
      // ⚠️ Y HỆT LÝ DO ĐÓ cho thanh chọn câu: nó nằm ở HÀNG TRÊN, ngoài sân, nên
      // freezePlay() cũng không với tới. Để nguyên thì thanh cạn hết trong lúc
      // đồng hồ đứng im — rồi thầy đóng Menu là lượt chọn nhảy sang đội kia ngay
      // trước mắt, không ai hiểu vì sao.
      paintPickBars("hold");
      // ⭐⭐⭐ Đợt 281 — Y HỆT LÝ DO ĐÓ cho thanh MISS WAIT: đồng hồ thật của nó
      // (`roundDue`, vừa đứng lại ở dòng trên) và thanh vẽ trên bàn là HAI THỨ
      // KHÁC NHAU (`freezePlay()` không với tới thanh, nó cũng ở ngoài sân) — để
      // nguyên thì thanh cạn hết trong lúc đồng hồ MISS WAIT đứng im.
      if (missWaitSide >= 0) paintMissBar(missWaitSide, 0, "hold");
    } else {
      armRound();
      armPending();
      armPick();
      if (pendingDue) paintWaitBar(pendingDue.left, "go");
      paintPickBars("go");
      // ⭐⭐⭐ Đợt 281 — MISS WAIT chạy tiếp NỐT phần còn lại, đọc từ CHÍNH `roundDue`
      // (đồng hồ thật của nó, vừa được `armRound()` gắn lại ở dòng trên) chứ không
      // có `Due` riêng — xem chú thích ở khối khai `missWaitSide` phía trên.
      if (missWaitSide >= 0 && roundDue) paintMissBar(missWaitSide, roundDue.left, "go");
    }
  }

  function later(fn, ms) {
    cancelRound();
    roundDue = {
      fire: () => { roundTimer = null; roundDue = null; if (!torndown) fn(); },
      left: Math.max(0, Number(ms) || 0), endAt: 0
    };
    armRound();
  }

  // The round is settled for BOTH teams — let each board finally show the ✓/✗
  // it has been holding back (teacher, 12/8/2026: a board that finishes while
  // the other is still playing must not display which answer was right, or the
  // team still choosing simply copies it). Called only once nobody is left to
  // play, so there is nothing left to give away. Templates that don't
  // implement `reveal` are unaffected.
  function revealBoards() {
    // ⛔⛔⛔ Đợt 219 (thầy, 21/8/2026) — `unconcealAll()` ĐÃ RỜI KHỎI ĐÂY, và đó là cả
    // nội dung việc thứ ba thầy giao: *"Sau đó đội chậm hơn làm xong thì đội làm
    // trước cũng không cần hiện lại, chuyển thẳng sang câu sau cùng với đội chậm
    // luôn."*
    // Đợt 217 gỡ che ngay tại đây, tức ĐÚNG lúc vòng chốt — nên bàn nhanh sáng bài
    // trở lại rồi đứng đó phơi ra suốt nhịp giữ 2,1 giây trước khi sang câu. Với
    // Anagram thì hai giây đó là cả từ, viết sẵn, nằm cạnh bàn đội kia.
    // Che nay được giữ tới tận lúc SANG CÂU (`advanceRound`) hoặc HẾT TRẬN
    // (`endMatch`) — hai chỗ duy nhất mà thứ đang bị che sắp bị thay bằng thứ khác.
    // ⚠️ `reveal()` vẫn được gọi như cũ: bàn vẫn ghi ✓/✗ của nó vào DOM, chỉ là lớp
    // che đang phủ lên. Không có trạng thái mới nào sinh ra, nên không có gì phải gỡ
    // ra sau — sang câu là `render()` vẽ lại từ đầu.
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
    paintWaitBar(0);                 // the window is closed — the bar must not run on
    const other = side === 0 ? 1 : 0;
    if (speedBonus > 0) {
      bonus[side] += speedBonus;
      paintScore(side);
      flashTeam(side, `+${speedBonus}`);
    }
    teams[side].el.classList.add("is-won");
    // Lock the other side out only if it is still IN the round; one that
    // already answered wrong is locked already, and re-locking it would
    // repaint it as "too slow" on top of its own wrong-answer feedback.
    // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — KHOÁ Ở ĐÂY GIỜ LUÔN IM LẶNG.
    // Đợt 222 từng bắt trọng tài gọi `board.timeUp()` ở đây — đi đúng đường
    // "hết giờ = sai" của template (tiếng sai, trừ điểm, dấu ✗) — vì lockLoser()
    // khi đó có thể true ở BẤT KỲ mức Time delay nào (tuỳ ô Round rule cũ).
    // Đợt 223 bỏ hẳn Round rule: lockLoser() giờ CHỈ true ở đúng nấc "không
    // delay" (0,1s — xem định nghĩa của nó phía trên) hoặc ở luật riêng của
    // pick-turn "lock" (Crossword). Cả hai ca đó đội thua đều KHÔNG hề có một
    // cơ hội công bằng nào để phản ứng — cửa sổ đóng trong dưới 130ms, gần như
    // trùng khoảnh khắc đội kia vừa reo tiếng đúng — nên thầy chốt: không tiếng,
    // không dấu ✗, không trừ điểm, chỉ khoá TRẦN TRỤI như nết gốc Đợt 124.
    // Dấu hiệu duy nhất cho lớp biết bàn đó vừa thua là `silentLose()`: MỘT lớp
    // CSS chung (`is-fight-silentlost`, core/app.css) làm cả khung ngả đen
    // trắng — "mất màu" đúng nghĩa đen, không cần động tới JS của template nào.
    if (lockLoser() && !roundDone[other]) {
      roundDone[other] = true;
      silentLose(other);
      boards[other] && boards[other].lock(true);
    }
    const nobodyLeft = lockLoser() || roundDone[other];
    if (nobodyLeft) revealBoards();
    later(advanceRound, nobodyLeft ? ROUND_HOLD_MS : LATE_LIMIT_MS);
    syncNavGates();   // Đợt 220 — khoá đội thua cũng là "hết người đang làm"
  }

  // Đợt 133 (teacher): two correct finishes within TIE_WINDOW_MS of each
  // other are simultaneous — BOTH score, neither is locked out or frozen.
  // `roundWinner` deliberately stays null (there is no EXCLUSIVE winner);
  // `ctl.mayScore()` already treats null as "let it count", so a tie needs no
  // extra flag of its own — see mayScore's own comment.
  // ⚠️⚠️ Đợt 187 — `sideA` IS THE ONE THAT FINISHED FIRST, and only it takes the
  // speed bonus (teacher, 18/8/2026: "chỉ đội xong TRƯỚC" ăn Speed bonus). Until
  // now both sides took it, which was harmless while the window was a fixed 0.1s
  // — nobody can be meaningfully "faster" inside a tenth of a second, which is
  // exactly why the teacher has the bonus HIDDEN at that setting. The moment the
  // window can be 3 seconds long, giving both sides the bonus would make the
  // slider it is attached to reward nothing at all.
  // Both sides still score the GAME points, and neither is locked or frozen —
  // that half of Đợt 133 is untouched.
  function finalizeTie(sideA, sideB) {
    paintWaitBar(0);
    if (speedBonus > 0) {
      bonus[sideA] += speedBonus;
      paintScore(sideA);
      flashTeam(sideA, `+${speedBonus}`);
    }
    [sideA, sideB].forEach(side => teams[side].el.classList.add("is-won"));
    revealBoards();
    later(advanceRound, ROUND_HOLD_MS);
    syncNavGates();   // Đợt 220
  }

  // ----- PICK-TURN rounds (Đợt 183) — see the pickMode block above ----------

  // Tell both boards whose turn it is to choose. A board that is NOT choosing
  // refuses taps; that is the template's half of the deal (`setPickTurn`),
  // because only it knows what its own board looks like.
  // ⚠️ Đợt 259 — IT NO LONGER HAS TO FADE. Until now the fade was the ONLY cue in
  // the room saying whose turn it was, so every pick-turn template owed one; the
  // pick-time bar above each board now says it, and Crossword has dropped its own
  // fade at the teacher's request, and Open the box dropped its own at Đợt 259c —
  // so today NO pick-turn template fades. That is a choice each template makes,
  // though: this call has never dictated what a board does with the news.
  // ⚠️ THE SINGLE FUNNEL for a change of turn, which is why the clock is started
  // from here rather than from each of the three callers.
  function paintPickTurn() {
    boards.forEach((b, i) => { try { b && b.setPickTurn && b.setPickTurn(pickOpen && i === pickTurn); } catch { /* board already gone */ } });
    openPickClock();
  }

  // ⭐⭐ Đợt 259 — PICK TIME, the clock on the CHOOSING team.
  //
  // Starts (or clears) the deadline for the current pick phase and repaints both
  // bars. Called from paintPickTurn alone, so "whose turn is it" and "how long
  // have they got" can never disagree.
  // ⚠️ `!pickOpen` is the CLOSE case, not a bug: boardPicked() sets pickOpen to
  // false and then repaints, which lands here and takes the deadline away — a
  // team that has chosen is no longer on the clock, and the word it opened has no
  // time limit at all (thầy: "cần giữ nguyên hiển thị để nhập, kể cả chờ lâu").
  function openPickClock() {
    cancelPick();
    if (!pickMode) return;
    if (pickOpen && !matchOver && !torndown && Number.isFinite(pickMs)) {
      pickDue = {
        fire: () => { pickTimer = null; pickDue = null; if (!torndown) pickExpired(); },
        left: pickMs, endAt: 0
      };
      armPick();
    }
    paintPickBars();
  }

  // Nobody chose in time: hand the turn straight over, no penalty, nothing
  // opened. The other team gets a full window of its own (paintPickTurn ->
  // openPickClock), so two teams that both sit on their hands simply pass the bar
  // back and forth — which is exactly what the teacher asked for.
  function pickExpired() {
    if (matchOver || torndown || !pickOpen) return;
    pickTurn = pickTurn === 0 ? 1 : 0;
    sound.click();   // a small tick, so the class hears the turn change and not just sees it
    paintPickTurn();
  }

  // Repaint both bars from the CURRENT state. `mode` is passed straight through
  // to the pause/resume pair, exactly like runWaitBar's own "hold"/"go".
  function paintPickBars(mode) {
    if (!pickMode) return;
    const live = pickOpen && !matchOver && !torndown;
    pickBars.forEach((pb, i) => {
      // The side that is NOT choosing gets 0 — bar off. The chooser gets whatever
      // is actually left on the clock (a resume after ☰ Menu must not restart a
      // window the team has already used half of), or Infinity at the ∞ notch,
      // where there is no clock to have a remainder.
      const ms = (live && i === pickTurn)
        ? (Number.isFinite(pickMs) ? (pickDue ? pickDue.left : pickMs) : Infinity)
        : 0;
      paintPickBar(pb, ms, mode);
    });
  }

  // One bar, three states — the same three core/engine.js's runWaitBar() has, and
  // for the same reasons. Kept deliberately parallel to it: whoever fixes a
  // timing trap in one of them should recognise the other on sight.
  function paintPickBar(pb, ms, mode) {
    if (mode === "hold" || mode === "go") {
      // ⚠️ Only a RUNNING finite bar can be held or resumed. A bar that is off, or
      // one breathing at ∞, has nothing counting down to pause.
      if (!pb.el.classList.contains("is-on") || pb.el.classList.contains("is-forever")) return;
      if (mode === "hold") {
        // ⚠️ Read the LIVE width out of getComputedStyle — the mid-transition px
        // value — not the "0%" already written into style, or the bar would jump
        // to empty the instant the teacher opened a panel.
        pb.fill.style.width = getComputedStyle(pb.fill).width;
        pb.fill.style.transition = "none";
        return;
      }
      if (!Number.isFinite(ms) || !(ms > 0)) return;
      void pb.fill.offsetWidth;
      pb.fill.style.transition = "width " + ms + "ms linear";
      pb.fill.style.width = "0%";
      return;
    }
    if (!(ms > 0) || torndown) {
      pb.el.classList.remove("is-on", "is-forever");
      pb.fill.style.transition = "none";
      pb.fill.style.width = "100%";
      return;
    }
    pb.el.classList.add("is-on");
    pb.fill.style.transition = "none";
    pb.fill.style.width = "100%";
    // ∞ — the bar stays FULL and breathes (pure CSS, `.is-forever`). There is no
    // deadline, so a draining bar would be a lie.
    // ⚠️⚠️ RETURN BEFORE THE TRANSITION LINE. `"width " + Infinity + "ms"` is not a
    // valid duration, Chrome drops the whole shorthand, and the "0%" written right
    // after would then apply with NO transition — an ∞ bar would show up empty,
    // the exact opposite of what it means. Đợt 216 already paid for this once.
    if (!Number.isFinite(ms)) { pb.el.classList.add("is-forever"); return; }
    pb.el.classList.remove("is-forever");
    void pb.fill.offsetWidth;   // the standard restart-a-CSS-transition reflow
    pb.fill.style.transition = "width " + ms + "ms linear";
    pb.fill.style.width = "0%";
  }

  // A round has been settled and held; put both boards back on their grid and
  // hand the choice to whoever the teacher's catch-up rule says.
  function endPickRound() {
    if (matchOver || torndown) return;
    playedRounds++;
    // Who chooses next:
    //  • nobody answered correctly     -> the team that finished LAST (it was wrong)
    //  • a "lock" game (Crossword)     -> the team that did NOT win, since being
    //                                     locked counts as answering wrong
    //  • otherwise                     -> the last finisher IF it was wrong, and
    //                                     only when both were right does the
    //                                     turn actually alternate
    if (roundWinner === null) pickTurn = lastFinisher ? lastFinisher.side : (pickTurn === 0 ? 1 : 0);
    else if (pickMode === "lock") pickTurn = roundWinner === 0 ? 1 : 0;
    else if (lastFinisher && lastFinisher.correct === false) pickTurn = lastFinisher.side;
    else pickTurn = pickTurn === 0 ? 1 : 0;

    roundWinner = null;
    roundDone = [false, false];
    lastFinisher = null;
    teams.forEach(t => t.el.classList.remove("is-won"));
    frozenAt[0] = frozenAt[1] = null;

    const total = Math.max(boards[0]?.total || 0, boards[1]?.total || 0);
    if (playedRounds >= total) { endMatch(); return; }

    pickOpen = true;
    boards.forEach(b => {
      if (!b) return;
      try { b.lock(false); } catch { /* gone */ }
      try { b.backToBoard && b.backToBoard(); } catch { /* gone */ }
    });
    paintPickTurn();
    syncNavGates();   // Đợt 220 — vòng chọn mới cũng là một vòng mở
  }

  // ----- the round: both boards hold the SAME word index -----
  function advanceRound() {
    if (matchOver || torndown) return;
    // ⭐⭐ Đợt 219 — GỠ CHE Ở ĐÂY, không ở `revealBoards()` nữa (xem chú thích dài
    // trong hàm đó). Đặt trên cùng nên nó phủ CẢ HAI nhánh bên dưới — vòng thường và
    // pick mode — và nằm cùng một nhịp đồng bộ với `goToIndex()` phía dưới, nên
    // trình duyệt không bao giờ vẽ ra một khung hình có bài cũ đã sáng lại.
    unconcealAll();
    clearSilentLose();   // Đợt 223 — câu mới thì màu cũng phải trở lại
    // PICK MODE: "the next round" is not the next index — it is back to the
    // grid, with the turn handed on. Everything that got us here (the tie
    // window, the walk-away backstop, the hold after a decided round) is shared
    // with normal rounds, which is exactly why this branch sits at the top of
    // advanceRound() rather than beside each of those callers.
    paintWaitBar(0);
    stopMissBar();   // Đợt 281 — belt and braces: wordDone() already stops it the
                      // instant the timed side answers; this covers the timer's
                      // own natural fire (nobody answered) and any path still to be found.
    if (pickMode) { revealBoards(); endPickRound(); return; }
    // Safety net for the walk-away path (the 20s backstop fires straight in
    // here): nobody may leave a round still owing a hidden result, or the
    // board would carry the withheld grey into the next word.
    revealBoards();
    roundWinner = null;
    // A pending tie-window can't outlive its own round — boardMoved() (Next/
    // Previous) and this natural round-turnover both jump straight past
    // whatever it was waiting to decide.
    cancelPending();
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
    snapRoundBase();   // Đợt 183 — what a "slower team" freeze will pin them to
    boards.forEach((b, i) => {
      if (!b) return;
      // ⭐ Đợt 202 — an ODD pool leaves one board a question short (81 dealt out is
      // 41 vs 40) and the teacher's rule is that the spare is PLAYED, not dropped
      // ("nếu lẻ thì lệch 1 cũng ok, không bỏ") — so the match runs to the LONGER
      // half (`total` above is already the max) and the short board simply has no
      // question this round. It stays locked and is marked as having had its go,
      // or the round would sit waiting out the full 20s walk-away backstop for a
      // team that has nothing left to answer.
      if (turnsMode && (b.total || 0) <= roundIndex) { roundDone[i] = true; b.lock(true); return; }
      b.lock(false);
      b.goToIndex(roundIndex);
    });
    // Đợt 220 — câu mới, vòng mở lại ⇒ hai mũi tên của CẢ HAI bàn phải mờ trở lại.
    // ⚠️ Đặt SAU `goToIndex` là cố ý: template sẽ gọi `ui.setNav` trong lúc dời câu, và
    // lệnh vẽ cuối cùng phải là lệnh biết vòng đã mở lại.
    syncNavGates();
  }

  function endMatch() {
    if (matchOver) return;
    matchOver = true;
    paintWaitBar(0);
    stopMissBar();   // Đợt 281 — hết trận thì không còn gì để đếm nữa
    // ⭐ Đợt 259 — hết trận thì không còn lượt nào để chọn: tắt đồng hồ VÀ cả hai
    // thanh. `matchOver` đã bật ở trên nên paintPickBars() tự cho cả hai về 0.
    cancelPick();
    paintPickBars();
    // ⚠️ Đợt 219 — HẾT TRẬN THÌ PHẢI SÁNG LẠI. Không có câu sau để chuyển sang, nên
    // đây là chỗ cuối cùng lớp còn nhìn được câu vừa rồi; giữ che ở đây là kết thúc
    // một trận bằng một bàn trắng trơn.
    unconcealAll();
    clearSilentLose();   // Đợt 223 — hết trận thì trả lại màu, đừng để trắng đen mãi
    revealBoards();   // never end a match with the last word's result still hidden
    boards.forEach(b => b && b.lock(true));
    syncNavGates();   // Đợt 220 — hết trận thì không còn gì để chặn
    showResult();
  }

  const ctl = {
    // --- what the template asks about ---
    // Đợt 202 — a dealt match has no shared word, so there are no letters to
    // share either, whatever an old act's `fightContent` still says on disk.
    shareLetters: !turnsMode && fo.fightContent === "same",
    // Only board 0 is allowed to speak: both boards show the same word, and two
    // copies of one clip starting a few ms apart is an echo, not a reading.
    speaks(side) { return side === 0; },
    isLocked(side) { return matchOver || (roundWinner !== null && roundWinner !== side && lockLoser()); },
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
    // ⭐ Đợt 187 — same shape as registerCleanup: the ENGINE hands us a way to
    // drive the wait bar it built in its own bottom row. `fn(ms)` starts a bar
    // that empties over `ms`; `fn(0)` clears it. A board that never registers
    // (an older engine, a board torn down mid-round) is simply skipped.
    registerWaitBar(side, fn) { waitBarFns[side] = fn; },

    // ⭐⭐ Đợt 217 (thầy, 20/8/2026) — MỘT BÀN DỪNG THÌ CẢ HAI DỪNG.
    // *"Khi Fight, 1 bên bấm nút menu thì bên còn lại cũng tạm dừng game cùng"* — và
    // Đợt 217 mở rộng cho mọi bảng công cụ. Trọng tài chỉ làm đúng việc chuyển tiếp;
    // *cách* dừng một bàn là của `core/engine.js` (đồng hồ, tiếng, hoạt cảnh, hook
    // `tpl.onPause`) — cùng cách chia việc như thanh chờ ngay trên.
    // ⛔ CHỈ GỬI SANG BÀN KIA, không bao giờ gọi lại chính bàn gửi: bàn gửi đã tự dừng
    // trước khi gọi tới đây, và gọi ngược lại chỉ đẻ ra một vòng lẩn quẩn.
    registerPause(side, fn) { pauseFns[side] = fn; },

    // ⭐⭐⭐ Đợt 220 — CÙNG KHUÔN VỚI `registerWaitBar`/`registerPause`: engine trao
    // cho trọng tài một cách vẽ lại hai mũi tên ‹ › của bàn nó, vì chỉ trọng tài mới
    // biết lúc nào câu trả lời đổi (bàn KIA vừa xong / vòng vừa chốt / sang câu mới).
    // Bàn nào không đăng ký (engine cũ lấy từ cache) thì đơn giản là bị bỏ qua.
    registerNavGate(side, fn) { navFns[side] = fn; },

    // ⭐⭐⭐ Đợt 266 — hai nửa của MỘT câu hỏi chung cho cả trận.
    // ⚠️ HỎI CẢ HAI BÀN chứ không chỉ bàn 0, dù hợp đồng nói chỉ bàn 0 được đọc.
    // Đây KHÔNG phải phòng xa suông: ngay trong đợt này ba template (Type the answer ·
    // Find the match · Open the box) bị bắt quả tang **quên hẳn rào `ctl.speaks`** nên
    // tự phát clip ở CẢ HAI bàn — đo được 2 lượt phát cho MỘT câu (đã vá cùng đợt).
    // Hỏi cả hai thì câu trả lời vẫn đúng dù cái rào đó có ai làm hỏng lại hay không,
    // và không bao giờ nghiêng về phía "cứ trừ tiền đi".
    registerVoiceBusy(side, fn) { voiceBusyFns[side] = fn; },
    voiceBusy() {
      return voiceBusyFns.some(fn => { try { return !!(fn && fn()); } catch { return false; } });
    },

    /**
     * ⭐⭐⭐ Đợt 220 — "BÀN NÀY CÓ ĐƯỢC RỜI VÒNG NÀY KHÔNG?"
     * `false` = bàn kia còn đang làm dở ⇒ hai mũi tên phải mờ, phím ‹ › phải câm.
     * Đọc `nobodyElseIsPlaying()` ngay trên để biết vì sao việc chặn bắt buộc phải
     * nằm ở NGUỒN chứ không nằm trong `boardMoved()`.
     * ⚠️ Hàm này KHÔNG biết gì về ô "Allow skip" — đó là options của act, và options
     * là chuyện của `core/engine.js`. Trọng tài chỉ trả lời đúng câu nó biết.
     */
    mayLeaveRound(side) { return nobodyElseIsPlaying(side); },
    // ⚠️ `dim` ĐI THEO nguồn, không tự quyết. ☰ Menu chỉ tối MỘT bàn nên bàn kia cũng
    // phải tự đắp tấm che của nó; còn bảng công cụ đã phủ tối CẢ khung nhìn bằng
    // `.aw-tool-dim`, nên bàn kia đắp thêm một lớp nữa là nửa màn hình bên đó tối hơn
    // hẳn nửa bên này — trông y như lỗi hiển thị.
    setPaused(side, on, dim = true) {
      // ⭐ Đợt 219 — TRỌNG TÀI TRƯỚC, BÀN KIA SAU. Đặt trước là cố ý: bàn kia nhận
      // được tin sẽ tự đóng băng phần của nó, còn hai đồng hồ chung thì chỉ có ở đây
      // mới dừng được, và chúng là thứ có thể sang câu sau lưng cả hai bàn.
      setRefPaused(side, !!on);
      const other = side === 0 ? 1 : 0;
      const fn = pauseFns[other];
      if (fn) { try { fn(!!on, !!dim); } catch { /* bàn kia đã bị dỡ */ } }
    },

    // --- what the template tells us ---
    attach(side, api) {
      boards[side] = api;
      // A board that mounts late (pane 1 always does) must not sit on word 1
      // while the other is already on word 3.
      // ⚠️ PICK MODE has no "current index" to catch up to while the grid is
      // showing — the board is told whose turn it is instead. Jumping it to
      // `roundIndex` here would re-open the LAST box played.
      if (pickMode) {
        api.setPickTurn && api.setPickTurn(pickOpen && side === pickTurn);
        // ⭐ Đợt 259 — THE PICK CLOCK STARTS HERE, not at build time. The two
        // boards mount one after the other (pane 1 always arrives late), and a
        // window that began ticking while only one board existed would hand half
        // of itself to a team that could not yet see its own grid. Restarting on
        // EVERY attach means the clock effectively begins when the last board is
        // up, which is when the match really begins.
        // ⚠️ Only two attaches ever happen per match, so "restarts every time" is
        // bounded — this is not a repaint path.
        openPickClock();
      }
      else if (roundIndex > 0) api.goToIndex(roundIndex);
      if (ctl.isLocked(side)) api.lock(true);
    },
    // PICK MODE — a team tapped a box on ITS OWN board. Nothing has opened yet:
    // the template only reports the tap, and the referee is what opens the SAME
    // box on BOTH boards, in one go. Letting each board open its own would put
    // the two on different items the moment one tap is missed, and the boards
    // are what the class is comparing.
    // Returns false when the tap must be ignored (not this team's turn, a round
    // already running, match over) so the template can stay silent about it.
    boardPicked(side, index) {
      if (!pickMode || matchOver || torndown) return false;
      paintWaitBar(0);
      if (!pickOpen || side !== pickTurn) return false;
      pickOpen = false;
      unconcealAll();          // Đợt 217 — vòng mới, không bàn nào còn bị che
      clearSilentLose();       // Đợt 223 — vòng mới thì màu cũng trở lại
      roundIndex = index;
      roundWinner = null;
      roundDone = [false, false];
      lastFinisher = null;
      cancelPending();
      pendingWinner = null;
      cancelRound();
      teams.forEach(t => t.el.classList.remove("is-won"));
      frozenAt[0] = frozenAt[1] = null;
      snapRoundBase();                       // Đợt 183 — see roundBase's own note
      paintPickTurn();                       // both grids go neutral — nobody is choosing now
      boards.forEach(b => {
        if (!b) return;
        try { b.lock(false); } catch { /* gone */ }
        try { b.goToIndex(index); } catch { /* gone */ }
      });
      // ⭐⭐⭐ Đợt 259 (thầy, 25/8/2026) — THE 20-SECOND BACKSTOP IS GONE FROM HERE.
      // It used to read `later(advanceRound, LATE_LIMIT_MS)`, and that ONE line was
      // the bug the teacher reported: *"khi chọn ô nhưng một lát không bấm thì bàn
      // phím tự động ẩn xuống và mất trạng thái đang chọn ô"*. Twenty seconds after
      // a word opened — with NOBODY having answered it, which is the only case this
      // timer covers — advanceRound() ran, endPickRound() called backToBoard() on
      // both boards, and a team still spelling a long word out on a touchscreen
      // watched its keyboard drop and its clue close under its hands. Nothing was
      // wrong on screen; the round had simply expired. Thầy: *"cần giữ nguyên hiển
      // thị để nhập, kể cả chờ lâu. Chỉ ẩn khi đã xong từ."*
      // ⚠️ THE HANG THIS GUARDED AGAINST IS ACCEPTED, and there is precedent: ∞ on
      // Time delay gave up the same backstop at Đợt 216, for the same reason (the
      // round ends on an EVENT, not on a clock) and with the same way out — the
      // teacher's own ☰ Menu ▸ Start again. The choosing phase, which is where a
      // class actually stalls, is now covered by PICK TIME instead.
      // ⚠️ Removing the call is safe on its own terms: `cancelRound()` a few lines
      // up already clears whatever the previous round left armed, so nothing here
      // depended on `later()`'s own cancel-then-arm.
      return true;
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
      // ⭐⭐⭐ Đợt 281 — bàn này vừa tự trả lời xong (đúng hay sai không quan trọng),
      // nên nếu nó đang là mục tiêu của một thanh MISS WAIT thì thanh đó hết lý do
      // để đếm tiếp NGAY TỪ GIÂY NÀY — không đợi tới `advanceRound()` (có thể còn
      // cách đây tới ROUND_HOLD_MS), kẻo bàn hiện một lời hứa đã hết hạn.
      if (missWaitSide === side) stopMissBar();
      // Anything that doesn't say otherwise counts as correct: templates whose
      // word can only ever END correct (Anagram's tap-in-order modes) simply
      // don't send the flag.
      const correct = !info || info.correct !== false;
      const other = side === 0 ? 1 : 0;
      // ⭐ Đợt 202 — IN TURNS: this board shows its own ✓/✗ AT ONCE. The rule
      // that withholds it ("GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ", core/HUONG DAN CORE.md)
      // exists so the team still playing cannot read the answer off the other
      // board — and in a dealt match the other board is holding a DIFFERENT
      // question, so there is nothing there to read. Without this the faster
      // team stares at a grey card until the slower one finishes, for a verdict
      // that was decided the moment it pressed Submit.
      if (turnsMode) {
        try { boards[side] && boards[side].reveal && boards[side].reveal(); } catch { /* board already gone */ }
      }
      // ⭐⭐ Đợt 217 — TỪ GIÂY NÀY BÀN NÀY KHÔNG CÒN ĐƯỢC ĐỂ LỘ BÀI (xem conceal()).
      // Đặt ở đây, ngay sau `roundDone[side] = true`, vì đây là ĐIỂM DUY NHẤT mà mọi
      // kiểu kết thúc của một bàn đều đi qua — đúng, sai, hết giờ, đều một cửa.
      // ⚠️ Đặt TRƯỚC mọi nhánh quyết định bên dưới là cố ý: nhánh nào chốt luôn vòng
      // đều gọi `revealBoards()`, và hàm đó gỡ che ngay trong cùng một nhịp đồng bộ —
      // nên ca "xong là đóng vòng luôn" không hề nháy một khung hình nào.
      // ⚠️ In turns tự miễn nhiễm mà không cần điều kiện riêng: chế độ đó ghim cửa sổ
      // về 0,1s ⇒ `waitBarMs` = 0 ⇒ conceal() thành lệnh rỗng. Hai bàn cầm hai câu
      // KHÁC nhau nên vốn chẳng có gì để nhìn trộm.
      // ⭐⭐ Đợt 220 (thầy, 21/8/2026) — CHE ĐỘI XONG **TRƯỚC**, KHÔNG CHE ĐỘI XONG **SAU**.
      // *"chỉ cần ẩn đội chơi trước, đội chơi sau không ẩn chữ mà vẫn hiển thị như bình
      // thường để cả lớp cùng quan sát kỹ kết quả trước khi auto next sang câu tiếp theo"*.
      // ⭐ KHÔNG mâu thuẫn với Đợt 219, mà là NỬA CÒN LẠI của cùng một luật: Đợt 219 chốt
      // *"đội làm trước cũng không cần hiện lại"* (⇒ che GIỮ tới lúc sang câu, đừng gỡ
      // trong `revealBoards()`), đợt này chốt *"đội xong sau không che"*. Ghép lại:
      // **che đúng MỘT bàn — bàn đã xong khi vẫn còn người đang làm.**
      // ⛔ Vì sao an toàn: che sinh ra để bàn còn đang làm không liếc sang chép bài. Bàn
      // xong SAU CÙNG thì không còn ai để chép nữa — che nó chỉ tổ bịt mắt cả lớp đúng
      // lúc lớp cần nhìn nhất, tức là ngay trước khi câu bị thay mất.
      // ⚠️ Hỏi `roundDone[other]` NGAY TẠI ĐÂY là cố ý: `roundDone[side] = true` vừa chạy
      // ở trên cho CHÍNH bàn này, nên `roundDone[other]` vẫn là câu trả lời trung thực cho
      // "trước tôi đã có ai xong chưa". Ca bàn kia bị KHOÁ mà chưa xong (Slower team keeps
      // points = off) thì nó không đi qua `wordDone` nên chẳng bao giờ bị che — đúng ý.
      conceal(side, !roundDone[other]);
      // Đợt 220 — bàn này vừa xong ⇒ câu trả lời của `nobodyElseIsPlaying()` đổi cho CẢ
      // HAI bàn. Bàn kia sẽ không tự biết: `ui.setNav` của nó chỉ chạy khi chính nó đổi.
      syncNavGates();
      // PICK MODE bookkeeping (Đợt 183): who finished LAST, and how — that is
      // the whole input to the teacher's "the wrong team chooses next" rule.
      // Written on every finish, so after the round it holds the later one.
      if (pickMode) {
        lastFinisher = { side, correct };
        // "ai chọn câu trả lời nhanh hơn thì có điểm và được setup thời gian
        // lại" — a correct answer restarts the per-question clock on BOTH
        // boards, so the team still choosing gets a fair run at it. A wrong one
        // deliberately leaves the clock draining ("thời gian vẫn tiếp tục chạy").
        if (correct) boards.forEach(b => { try { b && b.resetClock && b.resetClock(); } catch { /* gone */ } });
      }

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
          cancelPending();
          const decided = pendingWinner; pendingWinner = null;
          finalizeSingleWinner(decided);
          return;
        }
        // If the other team has already had its go, nobody is left to play —
        // show both results and move on.
        const settled = roundDone[other] || roundWinner !== null;
        if (settled) {
          revealBoards();
          later(advanceRound, ROUND_HOLD_MS);
          return;
        }
        // ⭐⭐ Đợt 276 — otherwise the OTHER team is still free to finish (and
        // could still win the round outright): MISS WAIT is how long the
        // referee gives it before giving up and moving the class on, in place
        // of the old hard-coded 20s walk-away backstop.
        // ⚠️ ∞ ARMS NO TIMER AT ALL — same reason as Time delay's own ∞ above:
        // `setTimeout(fn, Infinity)` fires on the NEXT TICK (the spec clamps a
        // non-finite delay to 0), which would make ∞ the FASTEST setting
        // instead of the slowest. The round then closes only when the other
        // board's own wordDone reports back, or the teacher's own ☰ Menu ▸
        // Start again — exactly the accepted ∞ shape Time delay and Pick time
        // already use elsewhere in this file.
        if (Number.isFinite(wrongWaitMs)) {
          // ⭐⭐⭐ Đợt 281 — thanh MISS WAIT, trên bàn CÒN ĐƯỢC CHƠI TIẾP (`other`) —
          // bàn vừa sai đã khoá/che rồi, không có gì để đếm ngược ở đó. Dưới
          // ngưỡng `WAIT_BAR_MIN_MS` (0s tức thì, chốt riêng của nấc này — xem
          // FIGHT_DEFAULTS.fightWrongWait) thì không vẽ gì, chỉ tổ nháy một khung.
          if (wrongWaitMs >= WAIT_BAR_MIN_MS) startMissBar(other, wrongWaitMs);
          later(advanceRound, wrongWaitMs);
        }
        return;
      }

      // CORRECT.
      if (roundWinner !== null) {
        // Round already has an EXCLUSIVE winner (the tie-window, if there
        // ever was one, is long closed) — old "late correct" path, unchanged:
        // when `lateScores()` is false (pick mode only, Đợt 223) only the
        // winner scores it, so this team's number is frozen where it is and
        // the points still on their way in are cancelled as they land.
        // (Anagram additionally self-
        // rejects via ctl.mayScore() at the exact moment its flight would
        // land, which can never be fooled by timing the way this numeric
        // freeze alone could — see mayScore's own comment. Both stay active
        // together: this covers every OTHER fight-enabled template too.)
        if (!lateScores()) { frozenAt[side] = roundBase[side]; holdFreeze(side); paintScore(side); }
        revealBoards();
        later(advanceRound, ROUND_HOLD_MS);
        return;
      }

      if (pendingWinner === null) {
        // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — KHÔNG CÒN AI ĐỂ CHỜ THÌ CHỐT NGAY, Ở
        // MỌI MỨC TIME DELAY. Thầy: *"một số act có 2 đội cùng chọn xong rồi (1
        // đội nhanh có điểm, đội chậm ko có điểm) mà vẫn chạy time delay cho đến
        // khi hết"*. Ca đó là: đội chậm trả lời SAI trước (khoá rồi, không đặt
        // `pendingWinner`), rồi đội nhanh mới trả lời ĐÚNG — nhánh này mở một cửa
        // sổ chờ MỚI dù chẳng còn ai để chờ, và trận đứng lại đúng bằng độ dài
        // Time delay một cách vô ích.
        // ⭐⭐ Đợt 216 từng chỉ vá cho riêng ∞ (comment gốc: "a finite window
        // keeps its old behaviour to the millisecond") — cùng lỗi, cùng cách vá,
        // Đợt 223 chỉ bỏ chữ `tieUnlimited &&` để áp dụng cho MỌI mức, kể cả
        // finite: nếu bàn kia đã xong (`roundDone[other]`) thì không có gì để
        // đợi nữa, chốt luôn qua đúng đường finalizeSingleWinner mà nhánh SAI ở
        // trên cũng dùng khi hai lượt đến ngược thứ tự — hai chiều không bao giờ
        // lệch nhau.
        if (roundDone[other]) { finalizeSingleWinner(side); return; }
        // First correct answer this round — open the tie-window rather than
        // deciding immediately.
        pendingWinner = side;
        // ⭐ Đợt 187 — the window is the teacher's TIME DELAY now, and from 0.2s
        // up a bar runs it down on BOTH boards: the team still playing needs to
        // see how long it has, and the team that just finished needs to see why
        // the round has not turned over yet.
        // ⭐⭐ Đợt 216 — at ∞ that same bar stands still and breathes instead of
        // draining (`Infinity` reaches runWaitBar in core/engine.js, which has its
        // own branch for it): there is no deadline left for it to show.
        paintWaitBar(waitBarMs);
        // ⚠️⚠️ NO TIMER AT ∞ — and NOT because `setTimeout(fn, Infinity)` would be
        // slow, but because it would be INSTANT: a non-finite delay is clamped to
        // 0 by the spec, so the round would settle on the next tick and ∞ would
        // behave as the shortest setting on the whole slider. The wait ends on the
        // other board's own `wordDone` instead — the two paths just above (a
        // second CORRECT answer ⇒ tie, a WRONG one ⇒ single winner) are what close
        // this round now, and both already clear a null `pendingTimer` safely.
        if (tieUnlimited) return;
        pendingDue = {
          fire: () => {
            pendingTimer = null; pendingDue = null;
            if (torndown) return;   // teardown() already cleared this timer -- belt and braces
            const decided = pendingWinner; pendingWinner = null;
            finalizeSingleWinner(decided);
          },
          left: tieMs, endAt: 0
        };
        armPending();   // Đợt 219 — không đặt nếu trọng tài đang bị dừng; nối lại lúc chạy tiếp
        return;
      }

      // A second correct answer, with `pendingWinner` still set — proves this
      // landed WITHIN the window: JS is single-threaded, so nothing else could
      // have run between the window opening and this call, meaning the timer
      // above hasn't fired yet. That makes it a tie.
      cancelPending();
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
      return lateScores();
    },
    // The teacher pressed Next/Previous on either board: both boards move, and
    // the round follows the board that was pressed.
    boardMoved(side, index) {
      if (index === roundIndex || matchOver || torndown) return;
      paintWaitBar(0);
      // ⚠️ Đợt 219 — CÂU MỚI THÌ KHÔNG BÀN NÀO CÒN BỊ CHE. Lỗ này có từ Đợt 217 (lúc
      // đó `revealBoards()` là chỗ duy nhất gỡ che, mà đường ‹ › này không đi qua đó),
      // nhưng từ đợt này lớp che sống lâu hơn hẳn nên nó sẽ cắn thật: thầy bấm Next
      // giữa lúc một bàn đang bị che là bàn đó sang câu mới với chữ vẫn tàng hình.
      unconcealAll();
      clearSilentLose();   // Đợt 223 — thầy bấm ‹ › giữa lúc mất màu cũng phải trả lại
      roundIndex = index;
      roundWinner = null;
      cancelPending();
      pendingWinner = null;
      roundDone = [false, false];
      cancelRound();
      teams.forEach(t => t.el.classList.remove("is-won"));
      snapRoundBase();   // Đợt 183 — a new round starts here too
      const other = side === 0 ? 1 : 0;
      if (boards[other]) { boards[other].lock(false); boards[other].goToIndex(index); }
      if (boards[side]) boards[side].lock(false);
      syncNavGates();   // Đợt 220 — vòng mới mở ⇒ mờ lại hai mũi tên trên cả hai bàn
    },

    // --- what the ENGINE reports (see startGame's `fight` option) ---
    // ⚠️ `+ cost[side]` (Đợt 139) — measured bug, caught in a real match: the
    // team numbers fell TWICE as fast as the slider said (-40/s at a setting of
    // 20). A template's scoreNow() already has the idle cost subtracted (that
    // is where the deduction lives, by design), so storing the reported value
    // raw put the cost inside `game` AND again in `cost` below. `game` must
    // hold this board's score WITHOUT the clock, so the clock is applied in
    // exactly one place — totalOf().
    onScore(side, value) { game[side] = (Number(value) || 0) + cost[side]; holdFreeze(side); paintScore(side); },
    // TIME COST (Đợt 139) — a channel of its OWN, never onScore(): a score
    // report goes through holdFreeze(), which would cancel the deduction for a
    // team currently frozen by the "slower team keeps nothing" rule and leave
    // it cancelled for good (freezeAdj keeps what it cancelled). `total` is
    // that board's cumulative timeCostTotal, so this is idempotent.
    onTimeCost(side, total) { cost[side] = Math.max(0, Number(total) || 0); paintScore(side); },
    // Where a board's "-N" flies TO: the one clock between the two frames (each
    // board's own in-frame clock is visibility:hidden in a match).
    clockTarget() { return clockEl; },
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
    // ⭐⭐ Đợt 173 (15/8/2026) — THE REAL OPTIONS, not either board's copy. Every
    // board only ever mounts `actFor(side)`'s FROZEN copy, which deliberately
    // lies about `shuffleQuestions` (forces it `false` — see actFor's own
    // comment) so the template's own shuffle check doesn't re-shuffle a word
    // order the match already fixed once for both boards. That copy is also
    // exactly what board 0's `startGame()` reads to SEED the Options panel
    // (`buildOptionsPanel`'s `base`) — so the Shuffle-questions checkbox was
    // reading the LIE every time the panel opened during a fight, and always
    // drew unchecked no matter what the teacher had actually saved (teacher,
    // 15/8/2026: "tích xong apply rồi mở lại kiểm tra thì đã mất rồi"). The
    // Apply side was never broken — `applyOptions` below always wrote onto and
    // saved THIS `activity`, the match's real one; only the panel's OWN
    // opening draft was reading the wrong object. core/engine.js calls this
    // instead of `activity.options` directly whenever `fight` is set.
    matchOptions() { return ctl.matchAct().options || {}; },
    // ⭐⭐ Đợt 181 — THE MATCH'S OWN ACT, the way `libAct` is the engine's own in
    // single mode: the library object, NOT resolved, still carrying its clue
    // sets and halves. A board can never answer this for itself (it only ever
    // holds the frozen resolved copy `actFor` made it), so everything that has
    // to talk about "the act the teacher is choosing sub-acts of" — the Options
    // panel's TEXT|VOICE + PRACTICE|HOMEWORK rows, and the per-view options of
    // Đợt 147 — comes through here. See engine.js's subActSource().
    matchAct() { return activity; },
    // Options > Apply, from either board. The real act is ours, not the board's
    // copy, so the settings are written (and saved) here and the whole match is
    // rebuilt — both boards, one word order, new rules.
    //
    // `replace` (Đợt 181) mirrors the engine's own Apply: when the act has
    // SUB-ACTS, each one keeps its own complete set of options, so the incoming
    // set REPLACES rather than merges — otherwise a `lives: 3` left behind by
    // the clue set the teacher just moved away from survives into one that
    // never had it, with nothing on screen explaining it. Off for an act with
    // no sub-acts, exactly like the engine's `if (curKey)` guard.
    applyOptions(opts, { replace = false } = {}) {
      if (!activity.options) activity.options = {};
      if (replace) Object.keys(activity.options).forEach(k => { if (!(k in opts)) delete activity.options[k]; });
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
    exitFight() { teardown(); startGame(root, activity, { onExit, base: originAct }); },
    // Đợt 195 — STRAIGHT OUT TO THE LIBRARY, not back to a single board. The
    // engine's Home (now a press-and-hold on the MODE button) reaches this from
    // inside a match, and it must not simply call board 0's own `cleanupAll()` +
    // `onExit`: that stops ONE engine and leaves board 1's 500ms clock ticking
    // behind the library — the ghost-clock bug of Đợt 131, which nobody would see
    // and everybody would hear. `teardown()` is what stops both, and it is
    // idempotent, so a board that already tore itself down is safe.
    exitToLibrary() { teardown(); onExit?.(); }
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
    const btnRow = el("div", "aw-fight-result-btns");
    // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — SHOW ANSWERS Ở BẢNG CUỐI TRẬN FIGHT.
    // Thầy: *"sẽ hiện ra kết quả của 2 bên để xem đúng sai thế nào"*, chốt qua
    // AskUserQuestion: HAI CỘT SONG SONG, đủ câu hỏi + đáp án từng đội — đúng
    // hình dạng màn Show answers một-người-chơi sẵn có (core/engine.js's
    // showReview), nhân đôi. Chỉ hiện nút khi ÍT NHẤT MỘT bàn có gì để xem —
    // một template chưa khai `review()` (xem TEMPLATE CONTRACT đầu file) thì
    // không vờ có nút chẳng làm gì (luật tự-chọn-tham-gia của Đợt 143).
    const rvA = boards[0] && typeof boards[0].review === "function" ? (boards[0].review() || []) : [];
    const rvB = boards[1] && typeof boards[1].review === "function" ? (boards[1].review() || []) : [];
    if (rvA.length || rvB.length) {
      const showBtn = el("button", "aw-btn", "Show answers");
      showBtn.type = "button";
      press(showBtn, () => { sound.click(); showFightReview(rvA, rvB, panel); });
      btnRow.append(showBtn);
    }
    const again = el("button", "aw-btn aw-btn-primary", "Start again");
    again.type = "button";
    press(again, () => { sound.click(); ctl.restartMatch(); });   // instant on touch-down — core/press.js
    btnRow.append(again);
    panel.append(btnRow);
    wrap.append(panel);
    try { sound.fanfare(); } catch { /* ignore */ }
  }

  // Đợt 223 — the two-column "Show answers": one call reads BOTH boards'
  // `review()` at once (see showResult above), so there is nothing left to
  // resolve here — build the two columns and toggle them over the result
  // panel, exactly the way core/engine.js's own showReview swaps in over its
  // summary panel (`rv.remove()` on Close is enough; `panel` never left the
  // DOM, it was only hidden).
  function showFightReview(rvA, rvB, resultPanel) {
    resultPanel.style.display = "none";
    const rv = el("div", "aw-fight-review");
    const head = el("div", "aw-fight-rv-head");
    head.append(el("div", "aw-fight-rv-title", "ANSWERS"));
    const closeBtn = el("button", "aw-fight-rv-close", icons.close);
    closeBtn.type = "button";
    press(closeBtn, () => { sound.click(); rv.remove(); resultPanel.style.display = ""; });
    head.append(closeBtn);
    rv.append(head);
    const cols = el("div", "aw-fight-rv-cols");
    cols.append(reviewColumn("TEAM LEFT", rvA), reviewColumn("TEAM RIGHT", rvB));
    rv.append(cols);
    wrap.append(rv);
  }

  function reviewColumn(label, rows) {
    const col = el("div", "aw-fight-rv-col");
    col.append(el("div", "aw-fight-rv-col-title", label));
    const list = el("div", "aw-fight-rv-list");
    if (!rows.length) {
      list.append(el("div", "aw-fight-rv-empty", "No answers yet"));
    } else {
      rows.forEach((r, i) => {
        const rowEl = el("div", "aw-fight-rv-row");
        rowEl.append(el("div", "aw-fight-rv-q", `${i + 1}. ${escapeText(r.question)}`));
        if (r.answered && r.yourCorrect) {
          rowEl.append(el("div", "aw-fight-rv-a is-correct", escapeText(r.correctText)));
        } else {
          rowEl.append(el("div", "aw-fight-rv-a is-wrong", escapeText(r.answered ? r.yourText : "No answer")));
          rowEl.append(el("div", "aw-fight-rv-a is-correct", escapeText(r.correctText)));
        }
        list.append(rowEl);
      });
    }
    col.append(list);
    return col;
  }

  // ----- the fight settings, shown inside the normal Options panel -----
  // Đợt 140 — rebuilt on the shared panel builders (mkCell/mkSeg/
  // mkSliderCell/addCheck) like the rest of the panel. This matters MORE here
  // than anywhere else: in fight mode the two boards push the toolbar up, so
  // the room above it measured only 471px at 1280x720 (vs 645 in single mode)
  // while these three groups alone were ~146px of full-width rows. As narrow
  // cells they pair up with the engine's own and stop forcing a scrollbar.
  // The seg labels are SHORT with the full sentence on the tooltip — the
  // group label above each one already says what is being chosen.
  function buildOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck }) {
    const cur = fightOptionsFrom(draft);

    // Đợt 133 (teacher): "Same word, same letters" is GONE — dropped
    // entirely, not just re-labelled. A legacy act that still carries
    // `fightContent:"same"` (nothing migrates existing acts, see
    // FIGHT_DEFAULTS) shows "Same words" selected here instead — visually the
    // nearest of the two remaining choices — but its OWN value on disk stays
    // "same" unless the teacher actually touches this control;
    // `ctl.shareLetters` above still reads it correctly either way.
    const cContent = mkCell({ label: "Fight content" });
    cContent.ctl.append(mkSeg([
      { value: "scramble", label: "Same words", title: "Same words, mix letters" },
      { value: "different", label: "Different", title: "Different words" }
    ], cur.fightContent === "different" ? "different" : "scramble",
      v => { draft.fightContent = v; }));

    // ⭐⭐⭐ Đợt 223 (thầy, 21/8/2026) — "ROUND RULE" (First wins/Both finish) VÀ
    // "SLOWER TEAM KEEPS POINTS" BỊ BỎ HẲN, không còn ô nào ở đây nữa. Thầy:
    // *"nó đã được điều khiển ở chế độ có TIME DELAY hay không rồi"* — TIME
    // DELAY một mình quyết định cả hai: đúng nấc 0,1s (thấp nhất) = khoá ngay
    // ("First wins" cũ); mọi nấc cao hơn = không khoá, đội chậm chơi tới khi tự
    // xong và luôn giữ điểm ("Both finish" + "Slower team keeps points" cũ, xem
    // lockLoser()/lateScores() ở trên).

    // ⭐⭐ Đợt 187 — TIME DELAY. Sits immediately ABOVE Speed bonus because it
    // decides whether Speed bonus exists at all (teacher's own layout: "thêm 1
    // thanh kéo là TIME DELAY ở cùng khu vực với speed bonus … kéo từ 0,2s trở
    // lên thì thanh speed bonus mới hiện Ở DƯỚI").
    // ⚠️ The slider carries an ∞ stop one step past its top (rather than at 0 on
    // the left, where Lives keeps its own ∞) — the teacher's order: "ngay sau 3s
    // là đến nấc unlimited", now "ngay sau 10s". The stored value keeps the house
    // 0-means-∞ convention all the same, so nothing downstream needs a second
    // special case.
    // ⭐⭐ Đợt 216 — THE SLIDER NOW MOVES ON AN INDEX INTO `DELAY_STEPS`, NOT ON
    // SECONDS. It has to: the ladder is 0.1-fine below 3s and 0.5-coarse above it
    // (see DELAY_STEPS), and a range input has exactly one `step`. Positions run
    // 1 … 44 for the real delays and 45 for ∞.
    // ⚠️ This is also what keeps Đợt 213's tap gesture honest — a tap beside the
    // thumb is "+1 POSITION", so it moves a tenth down low and half a second up
    // high, which is the whole point of a non-uniform ladder. A seconds-valued
    // slider could not have expressed that at all.
    const UNLIM_POS = DELAY_STEPS.length + 1;
    const posOf = w => {
      if (w === 0) return UNLIM_POS;
      const i = DELAY_STEPS.indexOf(snapDelay(w));
      return i < 0 ? 1 : i + 1;          // snapDelay always lands on the ladder; guard anyway
    };
    const valOf = pos => (pos >= UNLIM_POS ? 0 : DELAY_STEPS[pos - 1]);
    const cDelay = mkSliderCell({
      label: "Time delay", sub: "let the other team finish",
      // ⭐ Đợt 213 — BLUE, not amber. thầy's three-colour law is red = a
      // punishment, amber = a REWARD, green = a resource; this is a waiting
      // window and none of the three, so it takes the plain-quantity blue that
      // Speed / Difficulty / Round time already use. It is not cosmetic any
      // more either: core/options-panel.js now reads the tone to decide which
      // side of the panel a slider sits on, so a wrong colour is a wrong place.
      min: 1, max: UNLIM_POS, step: 1, value: posOf(cur.fightTieWindow), tone: "blue",
      fmt: pos => (pos >= UNLIM_POS ? "∞" : DELAY_STEPS[pos - 1].toFixed(1) + "s"),
      onInput: pos => { const w = valOf(pos); draft.fightTieWindow = w; syncDelay(w); }
    });
    cDelay.cell.title = "How long a team that answered second still counts as level. At the minimum, the slower team is locked out at once; above it, they keep playing until they finish and always keep what they earn. ∞ waits for as long as it takes.";

    // Same slider, two shapes. In a pick-turn game there is no TIME DELAY to
    // turn the bonus off with, so it keeps its own "Off" at 0 exactly as before;
    // everywhere else the range starts at 1 and 0.1s on TIME DELAY is the off
    // switch. Both got the ceiling the teacher asked for (20 -> 100).
    const cBonus = pickMode
      ? mkSliderCell({
          label: "Speed bonus", sub: "finish first",
          // Đợt 213 — AMBER: this awards up to +100 points, so by thầy's law
          // ("các thanh thưởng luôn có màu vàng") it is a reward, and the panel
          // now seats rewards on the left off the back of that same tone.
          min: 0, max: 100, step: 1, value: cur.fightSpeedBonus, tone: "amber", offAt: 0,
          fmt: v => (v === 0 ? "Off" : "+" + v),
          onInput: v => { draft.fightSpeedBonus = v; }
        })
      : mkSliderCell({
          label: "Speed bonus", sub: "finish first",
          min: 1, max: 100, step: 1, value: Math.max(1, cur.fightSpeedBonus || DEFAULT_SPEED_BONUS),
          tone: "amber",   // Đợt 213 — same slider, same rule as the branch above
          fmt: v => "+" + v,
          onInput: v => { draft.fightSpeedBonus = v; }
        });

    // ⭐⭐ Đợt 259 — PICK TIME, built ONLY for a pick-turn game (Crossword · Open
    // the box). Every other template has no choosing phase at all, so a control
    // for it there would be the dead-control trap of Đợt 143.
    // ⚠️ BLUE, by thầy's three-colour law: red punishes, amber rewards, green is a
    // resource — and a choosing window is none of the three, exactly like Time
    // delay beside it. The tone is not cosmetic: core/options-panel.js reads it to
    // decide which side of the panel the slider is seated on.
    // ⚠️ The ∞ stop sits ONE STEP PAST THE TOP, not at 0 on the left, matching the
    // shape thầy chose for Time delay ("ngay sau 10s là đến nấc unlimited"). The
    // STORED value still follows the house 0-means-∞ convention.
    const PICK_UNLIM = 11;   // positions 1..10 = seconds, 11 = ∞
    const cPickTime = pickMode ? mkSliderCell({
      label: "Pick time", sub: "choose a question",
      min: 1, max: PICK_UNLIM, step: 1,
      value: cur.fightPickTime === 0 ? PICK_UNLIM : cur.fightPickTime,
      tone: "blue",
      fmt: v => (v >= PICK_UNLIM ? "∞" : v + "s"),
      onInput: v => { draft.fightPickTime = v >= PICK_UNLIM ? 0 : v; }
    }) : null;
    if (cPickTime) cPickTime.cell.title = "How long the team whose turn it is has to choose a question. Run out and the turn simply passes to the other team — nothing is opened and nobody loses a point. At ∞ the bar still shows whose turn it is, it just never runs out.";

    // ⭐⭐ Đợt 276 (thầy, 27/8/2026) — MISS WAIT. Thầy: *"đội bên trái làm trước bị
    // sai, thì đội sau ko thể đợi mãi tùy ý được mà phải có thanh thời gian gì đó
    // thiết lập được"*. Built for EVERY fight game and never greyed out — unlike
    // Time delay / Speed bonus / Pick time / In turns above, which all govern who
    // got there FIRST, this one only ever fires once somebody has already LOST,
    // which is not a race any of those three controls are sealed off from.
    // ⚠️ 0 IS A REAL, SELECTABLE VALUE — the instant cutoff at the left end of the
    // slider — so unlike Time delay/Pick time, ∞ can't double up on it and instead
    // sits one step past the top, the same shape those two sliders use.
    const WRONGWAIT_UNLIM = 21;   // positions 0..20 = seconds, 21 = ∞
    const cWrongWait = mkSliderCell({
      label: "Miss wait", sub: "after the other team's mistake",
      min: 0, max: WRONGWAIT_UNLIM, step: 1,
      value: cur.fightWrongWait < 0 ? WRONGWAIT_UNLIM : cur.fightWrongWait,
      tone: "blue",
      fmt: v => (v >= WRONGWAIT_UNLIM ? "∞" : v + "s"),
      onInput: v => { draft.fightWrongWait = v >= WRONGWAIT_UNLIM ? -1 : v; }
    });
    cWrongWait.cell.title = "How long the other team keeps its chance once one side has already answered wrong and nobody has won the round yet, before the referee gives up and moves the class on. ∞ waits for as long as it takes.";

    panel.append(cContent.cell);
    // ⭐ Đợt 188 — Time delay and Speed bonus share ONE column, stacked, because
    // the first decides whether the second does anything (teacher: "time delay và
    // speed bonus luôn cùng 1 cột"). Side by side, the greyed-out Speed bonus read
    // as an unrelated broken control. A pick-turn game has no Time delay, so its
    // Speed bonus goes back to being an ordinary cell of its own.
    // ⭐ Đợt 259 — …except it now has a stack-mate of its own: PICK TIME is a
    // pick-turn game's counterpart to Time delay (both are "how long may this go
    // on"), so it takes the same shared column above Speed bonus, and the two
    // branches below end up the same shape as each other again.
    if (pickMode) {
      const stack = el("div", "aw-optc-stack");
      stack.append(cPickTime.cell, cBonus.cell);
      panel.append(stack);
    }
    else {
      const stack = el("div", "aw-optc-stack");
      stack.append(cDelay.cell, cBonus.cell);
      panel.append(stack);
    }
    panel.append(cWrongWait.cell);

    // ⭐⭐ Đợt 202 — IN TURNS, first in the checkbox block and GREEN, because it
    // is not a setting of the match the way the others are: it changes what the
    // match IS (one pool dealt out, instead of one word raced for). Built ONLY
    // where it could actually run — `turnsTpl`, the opt-in law of Đợt 143 — so
    // 6 of the 7 fight templates never see a box that would do nothing for them.
    // ⚠ `syncTurns` below reads `lateChk`, declared just after this: safe only
    // because nothing calls it until either the teacher taps this box or the
    // init line at the very bottom of this builder runs. Do not "tidy" it into
    // an eager call up here — that is the TDZ crash of Đợt 192.
    let turnsChk = null;
    if (turnsTpl) {
      turnsChk = addCheck("In turns", cur.fightTurns === true,
        v => { draft.fightTurns = v; syncTurns(v); },
        { title: "Deal the questions out — each team plays its own half, none on both boards" });
      turnsChk.classList.add("is-green");
    }

    // ⭐ Which other control can still DO anything at this delay. Nothing here
    // is decoration: a control left on screen that cannot change what happens
    // is the dead-control trap the opt-in rule of Đợt 143 exists to stop.
    //   • 0.1s   the fast team scores and the slow one is locked, so a bonus for
    //           being fast rewards nothing that is not already rewarded — the
    //           teacher's own reasoning, and he asked for it HIDDEN, not zeroed.
    // ⭐ Đợt 188 — GREYED, NOT HIDDEN (teacher). Hiding these made the panel
    // re-flow under the finger that was still on the TIME DELAY slider, and left
    // no sign the controls existed. `.is-locked` dims them and turns off
    // pointer-events, so they read as "there, but something else decides this".
    // ⚠️ `.is-locked` (opacity + pointer-events:none) is only half the lock —
    // pointer-events stops a FINGER, but the control is still in the tab order and
    // an arrow key on a focused slider would move it with nothing on screen
    // explaining why a greyed-out control just changed. `disabled` is what
    // actually closes that door, on the slider, on the segmented buttons and on
    // the checkbox alike.
    function setLocked(node, on) {
      node.classList.toggle("is-locked", on);
      node.querySelectorAll("input, button, select").forEach(ctlEl => { ctlEl.disabled = on; });
    }
    function syncDelay(w) {
      const bonusOn = speedBonusApplies({ fightTieWindow: w });
      setLocked(cBonus.cell, !bonusOn);
      // Repair an unreachable value rather than show a lie: the old slider went
      // 0..20 with 0 = "Off", the new one starts at 1, so an act saved with 0
      // has nothing legal to show the moment the bonus becomes reachable.
      // ⚠️ Đợt 188 — the value is NO LONGER zeroed when the bonus goes dead. It is
      // `speedBonusApplies()` at run time that ignores it (that gate is the actual
      // rule), so the number the teacher set survives being greyed out and comes
      // straight back to life the moment TIME DELAY leaves 0.1s. Writing 0 here
      // used to destroy it silently, and greying a control while quietly changing
      // the value under it would be the worse of the two lies.
      if (bonusOn && (Number(draft.fightSpeedBonus) || 0) < 1) {
        draft.fightSpeedBonus = DEFAULT_SPEED_BONUS;
        cBonus.slider.value = String(DEFAULT_SPEED_BONUS);
        cBonus.paint(DEFAULT_SPEED_BONUS);
      }
    }
    // ⭐⭐ Đợt 202 — In turns takes the entire race apart, so all three race
    // controls go dead TOGETHER (why: see the block above `tieMs`).
    // • GREYED, never hidden (Đợt 188): hiding would re-flow the panel under the
    //   finger still resting on this very checkbox, and leave nothing on screen
    //   to say those three controls exist.
    // • ⚠⚠ NOTHING HERE WRITES A VALUE. That is the whole of the teacher's "2 cái
    //   độc lập": unticking In turns must give back the settings exactly as
    //   they were, and it does so precisely BECAUSE this only ever touches the
    //   LOCK and never the value under it (Đợt 188's own rule, learned when an
    //   earlier version zeroed Speed bonus behind the teacher's back).
    function syncTurns(on) {
      [cContent.cell, cDelay.cell, cBonus.cell].forEach(n => setLocked(n, on));
      // Coming back OFF, hand Speed bonus to whatever TIME DELAY says about it
      // rather than leaving it live at every setting.
      if (!on && !pickMode) {
        const w = draft.fightTieWindow === undefined ? cur.fightTieWindow : draft.fightTieWindow;
        syncDelay(w);
      }
    }

    // A pick-turn game never shows TIME DELAY, so nothing here may move: running
    // syncDelay() there would hide the bonus (or zero it) off a value the teacher
    // has no control on screen to put back.
    if (!pickMode) syncDelay(cur.fightTieWindow);
    // … and In turns has the last word: it locks all three, on top of whatever
    // syncDelay just decided. Order matters, this line must stay after it.
    if (turnsTpl && cur.fightTurns === true) syncTurns(true);
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
  // ⚠️ Đợt 181 — `playAct`, not `activity`: on a variant / two-halves act the
  // items the boards play are the RESOLVED ones (one clue set flattened onto
  // `.clue`, the chosen half flattened onto `content[itemsKey]`). Both boards
  // share these very objects, which is what `_fightOrder` ("same letters")
  // relies on — resolveActivity() is called ONCE, above, precisely so there is
  // one set of them for the whole match.
  const orderA = fo.fightContent === "different" && (activity.options || {}).shuffleQuestions !== false
    ? shuffle([...srcItems]) : [...srcItems];
  const orderB = fo.fightContent === "different"
    ? shuffle([...srcItems])
    : orderA;
  // The item order is fixed HERE, once, so both boards agree on what word 3 is;
  // letting each play shuffle for itself is what made them drift apart.
  const baseOrder = (activity.options || {}).shuffleQuestions !== false && fo.fightContent !== "different"
    ? shuffle([...srcItems]) : orderA;
  // ⭐⭐ Đợt 202 — IN TURNS: DEAL the pool out ALTERNATELY (items 0,2,4… to the
  // left board, 1,3,5… to the right) instead of cutting it in half. With Shuffle
  // questions OFF an act's list is usually written easy → hard, and a straight
  // half-cut would hand one team every easy question and the other every hard
  // one; dealing alternately keeps the two halves the same shape whatever order
  // the pool is in. 81 questions come out 41 / 40, no question on both boards.
  // ⚠ Dealt from the SAME item objects both boards would otherwise have shared,
  // so "Start with mistakes" src identity keeps working exactly as before.
  const dealt = [[], []];
  if (turnsMode) {
    const pool = (activity.options || {}).shuffleQuestions !== false
      ? shuffle([...srcItems]) : [...srcItems];
    pool.forEach((it, i) => dealt[i % 2].push(it));
  }

  function actFor(side) {
    const items = turnsMode ? dealt[side]
      : (fo.fightContent === "different" ? (side === 0 ? orderA : orderB) : baseOrder);
    // Built from `playAct` (Đợt 181): a board is handed the RESOLVED act, so
    // resolving it again inside startGame() is the identity case documented in
    // core/content-view.js and the two boards keep sharing one set of items.
    return {
      ...playAct,
      options: { ...(activity.options || {}), shuffleQuestions: false },
      content: { ...(playAct.content || {}), [itemsKey]: items },
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
    paintWaitBar(0);
    clearMissBandTimers();   // Đợt 281 — 2 setTimeout riêng của thanh MISS WAIT, `later()`/
                              // cancelRound() bên dưới không biết tới chúng
    cancelRound();
    cancelPending();   // Đợt 133 — same reasoning as roundTimer
    cancelPick();      // Đợt 259 — same reasoning again: a pick clock that outlives
                       // its match hands the turn over inside a torn-down referee
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
