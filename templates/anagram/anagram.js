// =============================================================
// TEMPLATE: ANAGRAM — Wordwall style, English UI.
//  • Clue near the top (or a generic "Unscramble the word" label without one).
//  • Two rows sit close together, raised a bit off the very bottom:
//      "dãy kết quả" (result row)  — the target word shape, dashed empty
//      boxes that fill in as letters land, ABOVE —
//      "dãy chữ gốc" (origin row)  — the scrambled letter tiles (grey box,
//      white letter), just BELOW.
//  • Three modes, chosen in Options ("Anagram mode") — switching mode always
//    restarts the game (the scoring models are incompatible mid-play,
//    see optionsNeedRestart()):
//      "bonus"  = Letters with bonus — tap the correct NEXT letter (in
//                 order); a wrong tap flashes a small cross right on that
//                 tile (no move) + buzz; a right tap flies smoothly into
//                 the result row, turning blue immediately. Finishing with
//                 zero mistakes pops "PERFECT" which (after a short hold)
//                 flies into the score, morphing into the point value and
//                 pulse-counting it in — DOUBLE points; any mistake along
//                 the way -> a small check instead of "PERFECT", normal
//                 points (1 per letter), same fly+pulse treatment. No
//                 points-off of any kind in this mode (teacher, 10/8/2026).
//      "submit" = On submit — tap any tile (any order), it flies to the
//                 next empty result slot KEEPING the origin's grey color
//                 (no color change yet); tap a filled slot to send it back,
//                 or DRAG a filled slot onto another one to swap them —
//                 all before Submit. A SUBMIT button (raised above a
//                 reserved answer-reveal line) reveals each position's
//                 small green check / red cross in turn (recoloring that
//                 tile blue or a muted grey), then a big check/cross for
//                 the whole word; a correct word flies+pulses into the
//                 score exactly like bonus mode (1 point); a wrong word
//                 reveals the correct spelling (green, caps per option, no
//                 "Correct:" prefix) in the reserved line, no fly. Its own
//                 "Points off (wrong answer)" slider, 0..10, once per wrong
//                 WORD.
//      "bonusMinus" = Bonus and minus (teacher, 10/8/2026) — identical
//                 interaction/feel to "bonus" (same bonusPick(), same tap-
//                 in-order rules), but with 2 extra dials replacing the
//                 fixed "double points" rule: a "Bonus x" multiplier
//                 (1..5, teacher-chosen, replaces the hardcoded x2 for a
//                 PERFECT word — burst text becomes "Nx PERFECT") and a
//                 "Points off (wrong letter)" slider (0..100, step 5) that
//                 fires on EVERY wrong tap, not once per word: a big red
//                 "-N" flies from the mis-tapped slot to the score the
//                 instant it lands (see flyLetterPenalty()), on top of the
//                 existing small cross flash. isBonusFamily (mode==="bonus"
//                 || mode==="bonusMinus") gates every place the two share
//                 mechanics; the scoring math itself still branches on the
//                 exact mode inside finalizeBonusWord()/bonusPick().
//  • Multi-word phrases keep their spaces as fixed gaps (no slot to fill).
//  • Options: timer, shuffleQuestions, allCaps (force uppercase tiles),
//    allowSkip (Next may skip an unfinished word).
//  • Mouse/touch ONLY, by design — no keyboard shortcuts (not even ←/→ for
//    prev/next). Use the Previous/Next buttons in the bottom bar instead.
//  • Mid-word interactions (a single letter landing, a drag-swap) patch the
//    DOM directly instead of calling the full render() — render() replaces
//    the WHOLE card and re-triggers its fade-in animation, so calling it on
//    every tap made the whole screen visibly flash. Full render() is still
//    used at real boundaries: word start/change, and once per word when it
//    finishes (locks tiles, shows the reveal line, updates nav).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { getVoiceClip } from "../../core/voice-clips.js";
import { voiceView } from "../../core/voice-playback.js";
import { anagramSound } from "./anagram-sound.js";
import { openAnagramEditor } from "./anagram-editor.js";

// Tile clone colors for the flying-letter animation — MUST stay in sync
// with the --aw-ana-origin-bg / --aw-ana-result-bg / --aw-ana-wrong-bg
// fallbacks in anagram.css (the JS clone is a plain fixed-position element,
// not themed via CSS var).
const ORIGIN_BG = "#6b7785";
const RESULT_BG = "#2f6fed";

// Big white/dark-outline check or cross INSIDE a result tile — used both for
// bonus mode's wrong-pick mark (in the pending slot) and submit mode's
// per-position reveal (teacher, 8/8/2026: "tích to ngay trong ô chữ" instead
// of a small corner badge). core/icons.js's markCheck/markCross already are
// exactly this look (used elsewhere in this file for the whole-word marks).

const STAGGER_MS = 260;     // ms — gap between each position's reveal in "submit" mode
const EQ_BAR_COUNT = 4;     // Đợt 132 — equalizer bars beside the listen button

// Shared "settle" easing for every tile flight (letter placement, swap,
// return-to-origin) — a mild spring overshoot instead of flat ease-in-out,
// so a tile looks like it has real weight when it arrives somewhere
// (teacher-reported "trông cực kỳ giả", 8/8/2026). Kept subtle (~12%
// overshoot) since bonus-mode taps can queue several flights back to back.
const FLY_EASING = "cubic-bezier(.22,1.12,.36,1)";

// Flight duration now scales with DISTANCE instead of one flat number for
// every trip — a fixed 340ms made a short adjacent-tile swap look like it
// was gliding in slow motion compared to how far it actually travelled
// (teacher-reported "rất delay, không tự nhiên", 8/8/2026). Modelled as a
// roughly constant "toss speed" instead, clamped so neither a 1-tile hop nor
// a whole-word-wide flight feels wrong.
const FLY_SPEED_PX_MS = 1.4;   // px per ms
const FLY_MIN_MS = 130;
const FLY_MAX_MS = 380;
function flyDurationFor(dx, dy) {
  return Math.max(FLY_MIN_MS, Math.min(FLY_MAX_MS, Math.hypot(dx, dy) / FLY_SPEED_PX_MS));
}

// The shared "hold, then fly to the score, morph into +points, pulse-count
// it in" sequence — submit mode's all-correct outcome only now (bonus mode's
// own perfect/non-perfect feedback is showPerfectBurst()/flyPointsOnly()
// below, teacher 8/8/2026).
const FLYGAIN_HOLD_MS = 550;
const FLYGAIN_FLIGHT_MS = 550;
const FLYGAIN_PULSE_MS = 420;
const FLYGAIN_TOTAL_MS = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;

// Bonus-mode word-complete feedback (teacher, 8/8/2026): "PERFECT" pops in
// place (no longer flies anywhere); the "+N" points fly to the score
// separately, starting a beat after PERFECT for a perfect word, or right
// away when the word had a mistake (no icon shown at all in that case).
const PERFECT_BURST_MS = 950;
const PERFECT_TO_POINTS_DELAY_MS = 420;
const PICKFLY_HOLD_MS = 320;
const PICKFLY_FLIGHT_MS = 600;
const PICKFLY_TOTAL_MS = PICKFLY_HOLD_MS + PICKFLY_FLIGHT_MS;

// Lives (v0.9.29, teacher 3/8/2026) — a slider 0..10 in Options, same convention
// as true-false.js/find-the-match.js: 0 (or missing) = unlimited, 1..10 = that
// many hearts. UNLIKE true-false (whose "undefined" defaults to 5 lives),
// Anagram's "undefined" means UNLIMITED — this is a brand-new option on a
// template that never had a lives concept before, so an activity saved before
// this feature existed must keep playing exactly as before (zero-diff).
const MAX_LIVES = 10;
function normLives(v) {
  if (v == null || v === 0) return null;                    // unlimited (incl. "never set")
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}

// "Bonus and minus" mode dials (teacher, 10/8/2026) — see the header
// comment above for what each one does. Anagram now builds its OWN
// "Points off" control(s) entirely (tpl.hidePointsOff = true, below) since
// the meaning/range differs per mode; these are the shared clamp rules used
// by BOTH buildExtraOptions() (the slider UI) and mount() (reading the
// saved value), kept in one place so they can't drift apart.
const MAX_SUBMIT_PENALTY = 10;      // "On submit" — once per wrong WORD
const MAX_LETTER_PENALTY = 100;     // "Bonus and minus" — once per wrong LETTER TAP
const LETTER_PENALTY_STEP = 5;
const MIN_BONUS_MULT = 1, MAX_BONUS_MULT = 5, DEFAULT_BONUS_MULT = 2;   // 2x matches the old fixed "double" bonus
function clampSubmitPenalty(v) { return Math.max(0, Math.min(MAX_SUBMIT_PENALTY, Math.round(v) || 0)); }
function clampLetterPenalty(v) {
  return Math.max(0, Math.min(MAX_LETTER_PENALTY, Math.round((v || 0) / LETTER_PENALTY_STEP) * LETTER_PENALTY_STEP));
}
function clampBonusMult(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= MIN_BONUS_MULT ? Math.min(MAX_BONUS_MULT, n) : DEFAULT_BONUS_MULT;
}

function displayChar(ch, allCaps) { return allCaps ? ch.toUpperCase() : ch; }

// Tile size (in cqw) so the WHOLE origin row occupies ~90% of the stage
// width regardless of word length — short words get bigger tiles, long
// words get smaller ones, clamped so neither extreme breaks the layout.
function computeTileSize(nLetters) {
  const gap = 1.1, target = 90;
  const raw = (target - (Math.max(nLetters, 1) - 1) * gap) / Math.max(nLetters, 1);
  return Math.max(3.4, Math.min(9.5, raw));
}

// Build { letters, cells, tileOrder } once per item:
//  letters   = target chars, letter positions only, in the CORRECT order
//  cells     = full word split into { isSpace, letterIdx } (letterIdx into `letters`)
//  tileOrder = a shuffled permutation of letters' indices (origin row display order)
// `fixedOrder` (Đợt 124, FIGHT MODE) — when the two boards must show the SAME
// scramble, the first board to prepare a word hands its tileOrder to the second
// through the shared source object. Without it each board shuffles for itself
// and one team gets an easier arrangement of the same word.
function prepareItem(word, fixedOrder) {
  const chars = String(word ?? "").split("");
  const letters = [];
  const cells = chars.map(ch => {
    if (ch === " ") return { isSpace: true, letterIdx: -1 };
    const letterIdx = letters.length;
    letters.push(ch);
    return { isSpace: false, letterIdx };
  });
  let tileOrder = letters.map((_, i) => i);
  if (Array.isArray(fixedOrder) && fixedOrder.length === letters.length) {
    return { letters, cells, tileOrder: [...fixedOrder] };
  }
  const original = tileOrder.join(",");
  for (let tries = 0; tries < 8; tries++) {
    tileOrder = shuffle(tileOrder);
    if (tileOrder.join(",") !== original || letters.length <= 1) break;
  }
  return { letters, cells, tileOrder };
}

const anagramTemplate = {
  type: "anagram",
  scorable: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  name: "Anagram",
  hasLivesSlot: true,   // hearts render in the top bar, left of the score (v0.9.29)
  // FIGHT MODE (Đợt 124) — makes the MODE button appear under the frame, and
  // means this template knows how to run as one of two boards racing (see the
  // `_fight` branches in mount()). The first template to opt in.
  fightMode: true,
  hidePointsOff: true,  // ships its own mode-dependent "Points off" control(s) — see buildExtraOptions (10/8/2026)

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.word)
      .map(it => ({ clue: it.clue || "", answer: it.word }));
  },

  // Content editor for this game (opened by the home page and the in-game
  // Edit button). Each template supplies its own editor the same way.
  edit: openAnagramEditor,

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  buildExtraOptions({ panel, draft, mkCheck, mkRadioChoice }) {
    const gMode = el("div", "aw-opt-group");
    gMode.append(el("div", "aw-opt-label", "Anagram mode"));
    // nowrap (Đợt 132, teacher: "mở rộng đủ để hiện các mode ANAGRAM mà ko
    // cần xuống dòng") — matches core/engine.js's Timer row, same reasoning:
    // the panel is now wide enough (core/app.css) to actually fit this on
    // one line.
    const rowMode = el("div", "aw-opt-row aw-opt-row-nowrap");
    const curMode = draft.anagramMode === "submit" ? "submit"
      : draft.anagramMode === "bonusMinus" ? "bonusMinus" : "bonus";

    // POINTS OFF (teacher, 10/8/2026) — 3 groups built up front, right in the
    // fixed slot the teacher asked for (directly below the mode radios,
    // directly above Lives); only .style.display toggles per mode (see
    // syncPenaltyGroups below) so switching the radio updates the panel
    // instantly with no rebuild — same technique core/engine.js already uses
    // for the Timer group's "Count down" fields. This whole block REPLACES
    // the shared core "Points off" control (tpl.hidePointsOff = true below):
    // "bonus" needs no points-off UI at all, "submit" keeps the classic
    // once-per-wrong-WORD deduction (just widened to 0..10), "bonusMinus"
    // repurposes the same visual slot for a once-per-wrong-LETTER deduction
    // (0..100, step 5) plus its own "Bonus x" multiplier.
    const gPenSubmit = el("div", "aw-opt-group");
    gPenSubmit.append(el("div", "aw-opt-label", "Points off (wrong answer)"));
    const rowPenSubmit = el("div", "aw-opt-row");
    const curSubmitPen = clampSubmitPenalty(draft.pointsOff || 0);
    const penSubmitSlider = el("input", "aw-opt-slider");
    penSubmitSlider.type = "range"; penSubmitSlider.min = "0"; penSubmitSlider.max = String(MAX_SUBMIT_PENALTY); penSubmitSlider.step = "1";
    penSubmitSlider.value = String(curSubmitPen);
    const penSubmitVal = el("span", "aw-opt-slidval", curSubmitPen === 0 ? "Off" : "-" + curSubmitPen);
    penSubmitSlider.oninput = () => {
      const v = clampSubmitPenalty(+penSubmitSlider.value);
      draft.pointsOff = v;
      penSubmitVal.textContent = v === 0 ? "Off" : "-" + v;
    };
    rowPenSubmit.append(penSubmitSlider, penSubmitVal);
    gPenSubmit.append(rowPenSubmit);

    const gPenLetter = el("div", "aw-opt-group");
    gPenLetter.append(el("div", "aw-opt-label", "Points off (wrong letter)"));
    const rowPenLetter = el("div", "aw-opt-row");
    const curLetterPen = clampLetterPenalty(draft.letterPenalty || 0);
    const penLetterSlider = el("input", "aw-opt-slider");
    penLetterSlider.type = "range"; penLetterSlider.min = "0"; penLetterSlider.max = String(MAX_LETTER_PENALTY); penLetterSlider.step = String(LETTER_PENALTY_STEP);
    penLetterSlider.value = String(curLetterPen);
    const penLetterVal = el("span", "aw-opt-slidval", curLetterPen === 0 ? "Off" : "-" + curLetterPen);
    penLetterSlider.oninput = () => {
      const v = clampLetterPenalty(+penLetterSlider.value);
      draft.letterPenalty = v;
      penLetterVal.textContent = v === 0 ? "Off" : "-" + v;
    };
    rowPenLetter.append(penLetterSlider, penLetterVal);
    gPenLetter.append(rowPenLetter);

    const gBonusMult = el("div", "aw-opt-group");
    gBonusMult.append(el("div", "aw-opt-label", "Bonus x (perfect-word multiplier)"));
    const rowBonusMult = el("div", "aw-opt-row");
    const curMult = clampBonusMult(draft.bonusMult);
    const multSlider = el("input", "aw-anagram-multslider");
    multSlider.type = "range"; multSlider.min = String(MIN_BONUS_MULT); multSlider.max = String(MAX_BONUS_MULT); multSlider.step = "1";
    multSlider.value = String(curMult);
    const multVal = el("span", "aw-anagram-multval", curMult + "x");
    multSlider.oninput = () => {
      const v = Math.max(MIN_BONUS_MULT, Math.min(MAX_BONUS_MULT, +multSlider.value | 0));
      draft.bonusMult = v;
      multVal.textContent = v + "x";
    };
    rowBonusMult.append(multSlider, multVal);
    gBonusMult.append(rowBonusMult);

    function syncPenaltyGroups(m) {
      gPenSubmit.style.display = m === "submit" ? "" : "none";
      gPenLetter.style.display = m === "bonusMinus" ? "" : "none";
      gBonusMult.style.display = m === "bonusMinus" ? "" : "none";
    }
    syncPenaltyGroups(curMode);

    rowMode.append(
      mkRadioChoice("aw-anagram-mode", "bonus", "Letters with bonus", curMode === "bonus", v => { draft.anagramMode = v; syncPenaltyGroups(v); }),
      mkRadioChoice("aw-anagram-mode", "submit", "On submit", curMode === "submit", v => { draft.anagramMode = v; syncPenaltyGroups(v); }),
      mkRadioChoice("aw-anagram-mode", "bonusMinus", "Bonus and minus", curMode === "bonusMinus", v => { draft.anagramMode = v; syncPenaltyGroups(v); })
    );
    gMode.append(rowMode);
    panel.append(gMode, gPenSubmit, gPenLetter, gBonusMult);

    // LIVES — a slider 0..10 (0 = Unlimited), same shape/convention as
    // true-false.js's Lives control (teacher, 3/8/2026).
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-anagram-livesrow");
    const curLives = (draft.lives === 0 || draft.lives == null) ? 0
      : Math.min(MAX_LIVES, Math.max(1, Math.round(draft.lives)));
    const livesVal = el("span", "aw-anagram-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-anagram-livesslider");
    livesInput.type = "range"; livesInput.min = "0"; livesInput.max = String(MAX_LIVES); livesInput.step = "1";
    livesInput.value = String(curLives);
    livesInput.oninput = () => {
      const v = parseInt(livesInput.value, 10);
      draft.lives = v;   // 0 stored = unlimited
      livesVal.textContent = v === 0 ? "Unlimited" : String(v);
    };
    rowLives.append(livesInput, livesVal);
    gLives.append(rowLives);
    panel.append(gLives);

    const gMore = el("div", "aw-opt-group");
    gMore.append(el("div", "aw-opt-label", "Anagram options"));
    const rowMore = el("div", "aw-opt-row");
    rowMore.append(
      mkCheck(draft.allCaps === true, "All caps", v => draft.allCaps = v),
      mkCheck(draft.allowSkip !== false, "Allow skip (Next can move on early)", v => draft.allowSkip = v)
    );
    gMore.append(rowMore);
    panel.append(gMore);
  },

  // Engine calls this right after Apply mutates activity.options. Per the
  // teacher's request, ANY Options change restarts the act immediately
  // (not just an anagramMode switch) — Anagram's timer/shuffle/allCaps/
  // letters etc. all read fresh at mount(), so leaving the old play running
  // under options it wasn't built for looked stale/inconsistent.
  optionsNeedRestart() {
    return true;
  },

  // Engine-level lifecycle sounds (Play pressed / Start again / 5s-left /
  // Game complete) — OPTIONAL per-template override, see core/engine.js.
  // Undefined for any other template = its default synthesized tone plays
  // unchanged, so this touches Anagram only.
  sounds: {
    play: anagramSound.play,
    restart: anagramSound.restart,
    timeWarning: anagramSound.timeWarning,
    complete: anagramSound.complete
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.anagramMode === "submit" ? "submit"
      : opt.anagramMode === "bonusMinus" ? "bonusMinus" : "bonus";
    // "bonus" and "bonusMinus" share every interaction/rendering mechanic
    // (tap-the-next-letter, tiles turn blue immediately, etc.) — only their
    // SCORING differs, handled separately inside finalizeBonusWord()/
    // bonusPick() (see the header comment for the full breakdown).
    const isBonusFamily = mode === "bonus" || mode === "bonusMinus";
    const allCaps = opt.allCaps != null ? !!opt.allCaps : opt.changeCase === "upper";
    const allowSkip = opt.allowSkip !== false;
    // Points off: "submit" = once per wrong WORD (0..10); "bonusMinus" = once
    // per wrong LETTER TAP (0..100, step 5), applied live in bonusPick() via
    // flyLetterPenalty() rather than aggregated here. Plain "bonus" uses
    // neither (0) — see buildExtraOptions/the header comment for why.
    const pointsOff = mode === "submit" ? clampSubmitPenalty(opt.pointsOff || 0) : 0;
    const letterPenalty = mode === "bonusMinus" ? clampLetterPenalty(opt.letterPenalty || 0) : 0;
    const bonusMult = mode === "bonusMinus" ? clampBonusMult(opt.bonusMult) : 2;   // "bonus" keeps the old fixed x2
    const startLives = normLives(opt.lives);   // null = unlimited

    // ----- FIGHT MODE (Đợt 124) — this play is one of two boards racing -----
    // `_fight` is put here by core/fight.js; everything below degrades to the
    // ordinary single-board behaviour when it is absent.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;                 // set by the match controller between rounds
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    // FIGHT MODE — a graded "On submit" word whose result is still WITHHELD
    // while the other team plays (teacher, 12/8/2026). Holds `{rights,
    // allCorrect}` so revealFightResult() can draw the whole picture later;
    // null when there is nothing owed. See doSubmit's fight branch for why the
    // per-position colours in particular must not go up early.
    let fightPendingReveal = null;
    // Where a "+N" flies to, and what gets the count-up pulse. Single mode: the
    // frame's own score chip, exactly as always. FIGHT MODE (teacher, 12/8/2026,
    // second pass): the frame has NO chip any more — the only score on screen is
    // this team's number on the strip above its board, so the points fly the
    // whole way out to it.
    // ⚠️ NEVER `document.querySelector(".aw-top-score")` here: that is a
    // document-wide lookup, so with two boards on screen the RIGHT-hand board
    // animates its points onto the LEFT-hand board's chip — and on a discarded
    // play it finds the NEXT game's chip (Đợt 114).
    const scoreTargetEl = () => (fightCtl ? fightCtl.scoreTarget(fightSide) : ui.scoreEl);

    let items = [...(activity.content?.items || [])].filter(it => it && String(it.word || "").trim());
    if (opt.shuffleQuestions) items = shuffle(items);
    // `src` = the ORIGINAL content object, carried through so "Start with
    // mistakes" can filter activity.content.items by identity (core/mistakes.js).
    // In a fight with "same letters" the two boards share these very objects,
    // so whichever board prepares a word first leaves its scramble on the
    // source for the other to copy.
    items = items.map(it => {
      const shared = fightCtl && fightCtl.shareLetters;
      const prepared = prepareItem(it.word, shared ? it._fightOrder : null);
      if (shared && !it._fightOrder) it._fightOrder = prepared.tileOrder;
      return { clue: it.clue || "", word: it.word, ...prepared, src: it };
    });

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-anagram-empty", "This anagram has no words yet."));
      return () => {};
    }

    // Per-item state.
    //  bonus mode uses: nextPos / hadMistake / correct(true once solved) / points
    //  submit mode uses: graded / correct(true|false once submitted) / points
    const state = items.map(it => ({
      placed: it.letters.map(() => null),
      used: it.letters.map(() => false),
      nextPos: 0,
      hadMistake: false,
      graded: false,      // submit mode: locked, Submit pressed — reveal may still be mid-stagger
      revealed: false,    // submit mode: the staggered per-position reveal has FINISHED
      correct: null,
      points: 0
    }));
    let index = 0;
    let finished = false;
    // "this mount was thrown away" — set ONLY by cleanup(), never by finish().
    // Separate from `finished` so a legitimately completed game still animates
    // its last score pulse (Đợt 114).
    let dead = false;
    let penalty = 0;           // total points-off across words answered wrong (stays 0 when the option is off)
    let livesLeft = startLives;   // null = unlimited (can't lose)
    let busy = false;          // true while a fly/reveal animation must not be interrupted
    let fitter = null;
    let autoTimer = null;
    let submitBtnEl = null;    // current word's Submit button (submit mode) — kept for incremental updates
    let revealSlotEl = null;   // current word's answer-reveal line (submit mode) — ditto
    const activeFlyNodes = new Set();   // stray document.body clones — swept on cleanup

    // Pronunciation playback (10/8/2026, revised 10/8/2026) — clips are
    // generated once in the editor (anagram-editor.js) and referenced by id
    // (it.src.voice, a voiceClips/{id} Firestore doc — public read, see
    // core/voice-clips.js's file comment for why). Fetched lazily (on first
    // need — either the auto-play at the bottom of render(), or a tap) and
    // cached here so replaying the same word never re-fetches.
    //  • Opening a NEW word auto-plays its voice immediately, if it has one
    //    (teacher's request, 10/8/2026).
    //  • The listen button GLOWS (`.is-playing`) while its clip is actually
    //    sounding, and toggles: tap while playing -> stop; tap while
    //    stopped -> (re)play from the top. `voiceBtnEl` tracks which
    //    button is wired to `voiceAudioEl` right now so the glow always
    //    lands on the correct (current word's) button.
    const voiceClipCache = new Map();   // clipId -> data: URL
    let voiceAudioEl = null;            // currently-playing/loaded clip, stopped on cleanup
    let voiceBtnEl = null;              // listen button currently wired to voiceAudioEl's play state
    let voiceIntroTimeoutId = null;     // pending delayed auto-play (first word only), see render() below
    let firstWordRendered = false;      // only the VERY first render() of this mount() waits for the intro chime
    // Đợt 133 — THIS board's current listen button, tracked regardless of
    // whether playback has ever started (unlike `voiceBtnEl`, which is only
    // set once a play begins). Needed so a REMOTE toggle request or a mirror
    // update (see toggleVoiceRemote/syncVoice below) always has somewhere to
    // land, even on a board that has never itself started a clip.
    let currentListenBtn = null;
    function setListenGlow(btn, glowing) {
      if (btn) btn.classList.toggle("is-playing", glowing);
      // FIGHT MODE (Đợt 133, teacher): only the SPEAKING board (ctl.speaks)
      // ever owns a real <audio> element — report every glow change out so
      // the OTHER board's mirror (syncVoice, via ctl.attach) matches it
      // exactly instead of guessing. Guarded by `speaks()` so the call on
      // the MIRROR side (which reaches this same function through syncVoice
      // below) never reports back and creates a relay loop.
      if (fightCtl && fightCtl.speaks(fightSide)) fightCtl.reportVoiceState(fightSide, { playing: glowing });
    }

    // ----- Equalizer visualizer (Đợt 132, teacher) -----
    // A few CSS bars (`.aw-anagram-eq-bar`, children of the listen button
    // itself — see render()) driven by a REAL AnalyserNode on whatever clip
    // is currently playing, not a canned CSS loop — teacher's ask was "nhảy
    // theo đúng âm lượng thật". One shared AudioContext for the whole play
    // (created lazily — browsers refuse an AudioContext before any user
    // gesture, and the very first word can auto-play before one exists).
    // `setInterval`, not `requestAnimationFrame`: rAF freezes solid while the
    // tab/pane is backgrounded (documented trap, see core/HUONG DAN CORE.md)
    // — the clip would keep playing with the bars frozen mid-jump instead of
    // just running a little chunkier, which is the worst of both.
    let audioCtx = null;
    function ensureAudioCtx() {
      if (audioCtx) return audioCtx;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = Ctx ? new Ctx() : null;
      return audioCtx;
    }
    let eqTimer = null, eqAnalyser = null, eqSource = null, eqData = null;
    function stopEqualizer() {
      if (eqTimer) { clearInterval(eqTimer); eqTimer = null; }
      // Disconnect rather than just drop the reference — an AnalyserNode left
      // wired to `ctx.destination` stays part of the audio graph forever
      // otherwise, and a long play (dozens of words, one clip each) would
      // pile up that many silently-connected nodes by the end.
      if (eqAnalyser) { try { eqAnalyser.disconnect(); } catch { /* already gone */ } eqAnalyser = null; }
      if (eqSource) { try { eqSource.disconnect(); } catch { /* already gone */ } eqSource = null; }
    }
    // `audioEl` MUST be routed analyser -> ctx.destination or the clip goes
    // SILENT: `createMediaElementSource` hands the element's whole output to
    // the Web Audio graph, and nothing plays through the normal <audio> path
    // once that happens — the graph itself is now the only way out to
    // speakers. A button with no `.aw-anagram-eq-bar` children (there isn't
    // one today, but keep this defensive) or a browser with no Web Audio at
    // all just skips the visualizer; playback itself never depends on it.
    function startEqualizer(audioEl, btn) {
      stopEqualizer();
      const ctx = ensureAudioCtx();
      const bars = btn ? btn.querySelectorAll(".aw-anagram-eq-bar") : null;
      if (!ctx || !bars || !bars.length) return;
      let source;
      try { source = ctx.createMediaElementSource(audioEl); }
      catch { return; }   // e.g. this exact element was already wired once — degrade silently
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;             // few, chunky bins — "màu đơn giản", not a fine spectrum
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      eqSource = source; eqAnalyser = analyser;
      eqData = new Uint8Array(analyser.frequencyBinCount);
      const perBar = Math.max(1, Math.floor(eqData.length / bars.length));
      eqTimer = setInterval(() => {
        analyser.getByteFrequencyData(eqData);
        // Đợt 133 — collected into `levels` (not just painted locally) so
        // fight mode's speaking board can report it out; the mirror board
        // paints from the SAME array instead of running its own analyser.
        const levels = [];
        bars.forEach((bar, i) => {
          let sum = 0;
          for (let j = i * perBar; j < i * perBar + perBar; j++) sum += eqData[j] || 0;
          const level = +(sum / perBar / 255).toFixed(2);
          bar.style.setProperty("--h", level);
          levels.push(level);
        });
        if (fightCtl && fightCtl.speaks(fightSide)) fightCtl.reportVoiceState(fightSide, { levels });
      }, 70);
    }

    function stopVoiceClip() {
      if (voiceAudioEl) voiceAudioEl.pause();
      setListenGlow(voiceBtnEl, false);
      stopEqualizer();
    }
    // Tap handler: playing -> stop; anything else (stopped, or a fresh
    // word's first play) -> (re)play from the top. SINGLE MODE ONLY — fight
    // mode's tap handling is handleListenTap() below, which this no longer
    // gates on its own (Đợt 133): a fight board never calls this directly.
    function toggleVoiceClip(clipId, btn) {
      if (voiceAudioEl && voiceBtnEl === btn && !voiceAudioEl.paused) { stopVoiceClip(); return; }
      playVoiceClip(clipId, btn);
    }
    // Đợt 133 (teacher) — the ACTUAL tap handler wired to every listen
    // button's onclick. Single mode: unchanged, delegates straight to
    // toggleVoiceClip. FIGHT MODE: only ONE clip plays for the whole match,
    // owned by the speaking board (ctl.speaks) — a tap on EITHER board's
    // button routes here, and once a clip is actually playing, NO tap (on
    // either board) can stop it early; only once it has fully finished can a
    // tap start it again ("không thể dừng voice khi đang chạy... chỉ khi
    // voice đã dừng hoàn toàn mới có thể bấm để phát lại").
    function handleListenTap(clipId, btn) {
      if (!fightCtl) { toggleVoiceClip(clipId, btn); return; }
      if (!fightCtl.speaks(fightSide)) { fightCtl.requestVoiceToggle(clipId); return; }
      if (voiceAudioEl && !voiceAudioEl.paused) return;   // playing -- ignore, can't be stopped early
      playVoiceClip(clipId, btn);
    }
    function playVoiceClip(clipId, btn) {
      if (!clipId) return;
      const cached = voiceClipCache.get(clipId);
      if (cached) { startVoicePlayback(cached, btn); return; }
      getVoiceClip(clipId).then(clip => {
        if (!clip || !clip.audio) return;
        voiceClipCache.set(clipId, clip.audio);
        startVoicePlayback(clip.audio, btn);
      }).catch(() => { /* no pronunciation audio — not fatal, game plays on without it */ });
    }
    function startVoicePlayback(dataUrl, btn) {
      if (voiceAudioEl) { voiceAudioEl.pause(); setListenGlow(voiceBtnEl, false); }
      stopEqualizer();
      voiceAudioEl = new Audio(dataUrl);
      voiceBtnEl = btn || null;
      voiceAudioEl.addEventListener("ended", () => { setListenGlow(voiceBtnEl, false); stopEqualizer(); });
      setListenGlow(voiceBtnEl, true);
      startEqualizer(voiceAudioEl, voiceBtnEl);
      voiceAudioEl.play().catch(() => { setListenGlow(voiceBtnEl, false); stopEqualizer(); });   // e.g. autoplay blocked — fails silently, tap still works
    }

    // The "ANAGRAM IN ANDREW CLASSES" slogan (Đợt 89) was dropped on 12/8/2026
    // then brought BACK on 12/8/2026 (Đợt 132, teacher: wants it on both a
    // single board and a fight — two boards showing two slogans is fine this
    // time). It does NOT reuse crossword's approach (a child of `.aw-topbar`,
    // appended once in mount()) because in FIGHT MODE `.aw-topbar` is hidden
    // per board (core/fight.js draws its own shared strip instead) — a slogan
    // parked there would be invisible in exactly the mode the teacher most
    // wants it in. Instead it's a normal flex child INSIDE `.aw-anagram-card`,
    // rebuilt every render() like everything else in this file, which is
    // visible in both modes for free and needs no separate fight-mode branch.

    ui.onSubmit(finish, () => state.filter(s => doneCheck(s)).length);   // block "Submit answers" at 0 answered
    renderLives();
    render();

    function doneCheck(s) { return isBonusFamily ? s.correct === true : s.graded === true; }

    function scoreNow() {
      const base = isBonusFamily
        ? state.reduce((sum, s) => sum + (s.points || 0), 0)
        : state.filter(s => s.correct === true).length;
      return base - penalty;   // points-off (may drive the total negative -> shown red)
    }

    // Hearts live in the top bar (ui.livesSlot), just left of the score — same
    // look/behaviour as true-false.js's Lives. 1..5 lives show that many
    // separate hearts; 6..10 show a compact "N♥"; unlimited shows nothing.
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                 // unlimited
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }

    // Costs one life; pops the LEFTMOST heart out (when hearts are shown
    // individually) then re-renders. Returns true if that was the last life —
    // called at the SAME granularity as the pointsOff penalty (once per WORD
    // that had a mistake / was submitted wrong), not per keypress.
    function loseLife() {
      if (livesLeft == null) return false;           // unlimited -> can't lose
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;   // leftmost heart
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate(
            [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        setTimeout(finishPop, 360);
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      submitBtnEl = null;
      revealSlotEl = null;
      // A withheld result belongs to the word that was on screen; a real word
      // boundary (which is the only time render() runs) clears the debt, or
      // the next word would arrive wearing the previous round's grey.
      fightPendingReveal = null;
      // render() only ever runs at a real word start/change boundary (see
      // this file's header comment) — the ONE moment any audio left over
      // from the previous word must be silenced, regardless of whether the
      // NEW word even has a voice of its own. A pending DELAYED first-word
      // auto-play (see below) must be cancelled too, or it would fire late
      // and talk over whatever word the player has since moved on to.
      if (voiceIntroTimeoutId) { clearTimeout(voiceIntroTimeoutId); voiceIntroTimeoutId = null; }
      stopVoiceClip();
      voiceAudioEl = null; voiceBtnEl = null;
      currentListenBtn = null;   // reset every word — set again below only if this word actually gets a listen button
      const it = items[index];
      const st = state[index];
      const tileSize = computeTileSize(it.letters.length);

      const card = el("div", "aw-anagram-card");
      // Options > Content (12/8/2026) decides whether this act plays as TEXT
      // or as VOICE today — one act now holds both. voiceView() is the single
      // place that rule lives; never read it.src.hideText directly.
      const vv = voiceView(activity, it.src);
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      // Đợt 132 (teacher): in TEXT mode the clue is fully written out, so the
      // manual listen button is now dropped entirely rather than kept as a
      // "still tap it if you want" extra — a scoped reversal of Đợt 123's
      // original call (documented there as "the small listen button stays"),
      // just for Anagram. Reads `contentMode` directly rather than through
      // `voiceView()` because `vv.hideText` alone can't tell "explicit Text"
      // apart from "AUTO, and this item happens to have hideText:false" —
      // AUTO must keep showing the button exactly as it always has.
      const textMode = activity.options?.contentMode === "text";
      // Hide text (10/8/2026, revised 10/8/2026): when ON, the Clue never
      // appears in any form — teacher's request was "just ONE big centered
      // listen button standing where the question normally sits, nothing
      // else" (no placeholder text, no other icon) — so clueEl carries NO
      // text content at all in this case; `.aw-anagram-clue-voiceonly`
      // centers the (larger) button inside the same box the text would
      // otherwise fill. The ORDINARY "no clue was written" fallback (no
      // voice involved) is unchanged.
      const clueEl = hideText
        ? el("div", "aw-anagram-clue aw-anagram-clue-voiceonly")
        : it.clue
          ? el("div", "aw-anagram-clue", escapeHtml(it.clue))
          : el("div", "aw-anagram-clue aw-anagram-clue-generic", "Unscramble the word");
      // Listen button is a CHILD of the clue box — a flowing INLINE child
      // after the clue text normally (not absolutely positioned, see the
      // comment on .aw-anagram-listenbtn in the CSS for why), or the box's
      // SOLE child, larger, when hideText has left the box textless.
      if (hasVoice && !textMode) {
        // Đợt 132 (teacher): the speaker is now ONE cluster — icon on the
        // left, equalizer bars on the right — and the whole thing is a
        // SINGLE `<button>` rather than two separately-clickable pieces.
        // That was a deliberate choice over a wrapper `<div>` holding two
        // click targets: two `onclick` handlers on nested elements both
        // reachable by the same tap would fire TWICE (bubbling), toggling
        // play then immediately stop — one button, one handler, sidesteps
        // that bug entirely and "bấm vào cái nào cũng được" is true for free.
        const listenBtn = el("button", "aw-anagram-listenbtn" + (hideText ? " aw-anagram-listenbtn-lg" : ""));
        listenBtn.type = "button";
        listenBtn.setAttribute("aria-label", "Listen to pronunciation");
        listenBtn.append(el("span", "aw-anagram-listenicon", icons.soundOn));
        const eqEl = el("span", "aw-anagram-eq");
        for (let i = 0; i < EQ_BAR_COUNT; i++) eqEl.append(el("span", "aw-anagram-eq-bar"));
        listenBtn.append(eqEl);
        listenBtn.onclick = () => handleListenTap(it.src.voice, listenBtn);
        currentListenBtn = listenBtn;
        clueEl.append(listenBtn);
        // Auto-play the moment this word opens (teacher's request,
        // 10/8/2026) — safe to call unconditionally here since render()
        // never re-runs mid-word (see the file header comment); if the
        // browser blocks autoplay, startVoicePlayback() degrades silently
        // and the tap still works. The FIRST word of the whole play waits
        // out the engine's own "Play" chime (`anagramSound.play`, fired by
        // core/engine.js right before mount() — see anagram-sound.js's
        // introDurationMs()) so the two sounds never overlap; every later
        // word (reached via Next/Previous) plays immediately as before.
        // ...but only in VOICE mode: in TEXT mode the clue is on screen to be
        // read, so the button waits to be asked (vv.autoPlay). And in FIGHT
        // MODE only ONE board speaks — both show the same word, so two copies
        // of the same clip a few milliseconds apart is an echo, not a reading.
        if (!vv.autoPlay || (fightCtl && !fightCtl.speaks(fightSide))) {
          /* text mode — button only, no automatic speech */
        } else if (!firstWordRendered) {
          voiceIntroTimeoutId = setTimeout(() => {
            voiceIntroTimeoutId = null;
            playVoiceClip(it.src.voice, listenBtn);
          }, anagramSound.introDurationMs());
        } else {
          playVoiceClip(it.src.voice, listenBtn);
        }
      }
      firstWordRendered = true;
      // Slogan row (see mount()'s header comment above) — a real flex child,
      // first in the card, so its own height + margin also buys the listen
      // button's glow ring some breathing room at the very top of the stage
      // (teacher, 12/8/2026: the ring used to poke past `.aw-playarea`'s
      // `overflow:hidden` and get clipped). Counted in autoFit's `measure`
      // below like every other fixed-height piece of this card.
      const sloganEl = el("div", "aw-anagram-slogan", "ANAGRAM IN ANDREW CLASSES");
      card.append(sloganEl);
      card.append(clueEl);

      // Flexible slack, split 1:2 — see anagram.css's comment on these two
      // classes for why (teacher, 8/8/2026: tile rows should lean higher
      // when the clue leaves a lot of empty room, not sit glued to the
      // bottom of the stage).
      card.append(el("div", "aw-anagram-topspace"));

      const group = el("div", "aw-anagram-group");
      group.style.setProperty("--aw-ana-tile", tileSize + "cqw");

      const resultRow = el("div", "aw-anagram-result" + (mode === "submit" ? " is-interactive" : ""));
      it.cells.forEach(c => {
        if (c.isSpace) { resultRow.append(el("span", "aw-anagram-rspace")); return; }
        const pos = c.letterIdx;
        const tileId = st.placed[pos];
        const cls = ["aw-anagram-rtile"];
        let isRight = null;
        if (tileId != null) {
          cls.push("is-filled");
          if (isBonusFamily) {
            cls.push("is-blue");
          } else if (st.revealed) {
            isRight = it.letters[tileId].toLowerCase() === it.letters[pos].toLowerCase();
            cls.push(isRight ? "is-blue" : "is-wrongbg");
          }
        }
        const box = el("div", cls.join(" "));
        box.dataset.pos = String(pos);
        if (tileId != null) box.textContent = displayChar(it.letters[tileId], allCaps);
        // Transient flash, not a permanent fixture (teacher, 8/8/2026) — the
        // tile's own background color (.is-blue/.is-wrongbg, set above)
        // already conveys right/wrong permanently; the icon is just a brief
        // confirmation, even on a re-render (e.g. navigating back to an
        // already-submitted word).
        if (isRight != null) showTransientMark(box, "aw-anagram-revealmark", isRight ? icons.markCheck : icons.markCross, 550);
        if (mode === "submit" && !st.graded) attachResultTileInteraction(box, pos);
        resultRow.append(box);
      });
      group.append(resultRow);

      const originRow = el("div", "aw-anagram-origin");
      const wordDone = isBonusFamily ? st.correct === true : st.graded;
      it.tileOrder.forEach(tileId => {
        const used = st.used[tileId];
        const tile = el("button", "aw-anagram-otile" + (used ? " is-used" : ""));
        tile.type = "button";
        tile.dataset.tile = String(tileId);
        tile.textContent = displayChar(it.letters[tileId], allCaps);
        // `fightLocked()` = the other team already took this word (or the match
        // is over): the tiles go visibly dead rather than silently ignoring
        // taps, so the class can SEE that the round is decided.
        const locked = used || wordDone || fightLocked();
        tile.disabled = locked;
        attachOriginTileInteraction(tile, tileId);
        originRow.append(tile);
      });
      group.append(originRow);
      // A legitimate rebuild (new word, or a board mounting into a round that
      // is already decided) has to arrive wearing the same "too slow" look
      // syncFightLock() paints the rest of the time — set on the group BEFORE
      // it goes into the document so it is never seen without it.
      if (fightLocked() && !wordDone) group.classList.add("is-fightlost");
      card.append(group);

      let revealSlot = null;
      if (mode === "submit") {
        revealSlot = el("div", "aw-anagram-reveal");
        revealSlot.textContent = st.correct === false ? (allCaps ? it.word.toUpperCase() : it.word) : "";
        card.append(revealSlot);
        revealSlotEl = revealSlot;
      }

      if (mode === "submit") {
        const submitBtn = el("button", "aw-anagram-submit", "Submit");
        submitBtn.type = "button";
        submitBtn.onclick = doSubmit;
        card.append(submitBtn);
        submitBtnEl = submitBtn;
      }

      card.append(el("div", "aw-anagram-botspace"));

      root.append(card);
      updateSubmitButtonState();

      // clueEl was captured when the card was built, above — offsetHeight
      // never includes MARGIN — group's bottom margin, the
      // reveal line's top margin, the Submit button's top margin, and the
      // card's own bottom padding are all real fixed (non-fit-scaled) vertical
      // space that autoFit must know about, or it under-shrinks on a 2-line
      // clue and Submit ends up pushed outside the stage.
      const groupMarginBottom = parseFloat(getComputedStyle(group).marginBottom) || 0;
      const revealMarginTop = revealSlot ? parseFloat(getComputedStyle(revealSlot).marginTop) || 0 : 0;
      const btnMarginTop = submitBtnEl ? parseFloat(getComputedStyle(submitBtnEl).marginTop) || 0 : 0;
      const cardPaddingBottom = parseFloat(getComputedStyle(card).paddingBottom) || 0;
      const sloganMarginBottom = parseFloat(getComputedStyle(sloganEl).marginBottom) || 0;
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.045,
        measure: () => sloganEl.offsetHeight + sloganMarginBottom +
          clueEl.offsetHeight + group.offsetHeight + groupMarginBottom +
          (revealSlot ? revealSlot.offsetHeight + revealMarginTop : 0) +
          (submitBtnEl ? submitBtnEl.offsetHeight + btnMarginTop : 0) + cardPaddingBottom
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    // ----- interaction: bonus mode -----
    function onTileClick(tileId, tileEl) {
      // NOTE (v0.9.29, teacher 3/8/2026): no longer gated by `busy` — that used
      // to block EVERY tile tap for the full ~340ms of the PREVIOUS letter's
      // flight, which felt laggy when tapping fast. `busy` still guards the
      // heavier result-row actions (Submit / drag-swap / send-back) below.
      if (finished) return;
      // FIGHT MODE: this board is out of the round (the other team got the word
      // first, or the match is over). One test here covers taps AND drags,
      // since every drop path ends up in bonusPick/submitPick through here.
      if (fightLocked()) return;
      if (isBonusFamily) bonusPick(tileId, tileEl); else submitPick(tileId, tileEl);
    }

    // Returns true if the letter was placed, false on a mismatch/no-op — the
    // caller (a plain tap, or a drag-drop onto the receiving slot) uses this
    // to know whether to spring the tile back to the origin row.
    function bonusPick(tileId, tileEl) {
      const st = state[index];
      if (st.correct === true || st.used[tileId]) return false;
      const it = items[index];
      const expected = it.letters[st.nextPos];
      const picked = it.letters[tileId];
      if (picked.toLowerCase() !== expected.toLowerCase()) {
        st.hadMistake = true;
        anagramSound.wrongPick();
        showWrongPickMark();
        // "Bonus and minus" (teacher, 10/8/2026): a wrong tap ALSO flies a
        // big red "-N" from the mis-tapped slot to the score, on top of the
        // small cross flash — the deduction lands (and the score visibly
        // drops) the instant the number arrives, same convention as every
        // other fly effect here. Plain "bonus" mode never deducts anything.
        if (mode === "bonusMinus" && letterPenalty > 0) {
          const pendingSlot = root.querySelector(`.aw-anagram-rtile[data-pos="${st.nextPos}"]`);
          flyLetterPenalty(pendingSlot, letterPenalty);
        }
        return false;
      }
      anagramSound.place();
      // State advances THE INSTANT a correct tap is validated — not when its fly
      // animation finishes — so a second/third... correct tap registers right
      // away too, its flight simply overlapping the previous one's. Only the
      // TAPPED tile itself locks (immediately, below); every other tile stays
      // tappable throughout, which is what makes fast consecutive taps feel
      // instant instead of gated behind each ~340ms flight (teacher, 3/8/2026).
      const destPos = st.nextPos;
      st.used[tileId] = true;
      st.placed[destPos] = tileId;
      st.nextPos++;
      tileEl.disabled = true;
      const wordDone = st.nextPos === it.letters.length;
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${destPos}"]`);
      const shownChar = displayChar(picked, allCaps);
      flyLetter(tileEl, destEl, shownChar, RESULT_BG, () => {
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, "is-blue");
        // Confirmation check lands on the DESTINATION tile (the one that was
        // just correctly filled) — teacher, 8/8/2026 (was on the origin tile,
        // which read as "wrong end" once she saw it land).
        showLandedCheckBadge(destEl);
        if (wordDone) finalizeBonusWord();
      });
      return true;
    }

    function finalizeBonusWord() {
      // Đợt 114 — reached from flyLetter's untracked 150ms-past-the-animation
      // fallback, and it arms `autoTimer` -> finish(). Placing the last letter of
      // the last word and leaving within ~0.5s used to hand in the dead play.
      if (dead) return;
      const st = state[index];
      const it = items[index];
      const n = it.letters.length;
      const perfect = !st.hadMistake;
      // No word-level points-off here (any longer): plain "bonus" never had
      // one to begin with in the new design, and "bonusMinus" already
      // deducted per wrong LETTER TAP live in bonusPick() via
      // flyLetterPenalty() — double-charging the same mistakes at word-end
      // too would be wrong (teacher, 10/8/2026).
      const outOfLives = !perfect && loseLife();   // a life is lost on a word solved WITH a mistake (both modes)
      const mult = mode === "bonusMinus" ? bonusMult : 2;   // "bonus" keeps the old fixed x2
      const earned = n * (perfect ? mult : 1);
      st.correct = true;               // word is DONE — points deferred, see below
      // No render() here: every origin tile is already .is-used and every
      // result tile already .is-blue via the incremental patches each
      // successful pick applied — a full render() would just replay the
      // WHOLE card's fade-in animation for no visual gain (that's exactly
      // the flash bug). Only updateNav() is a real change at this instant.
      updateNav();
      anagramSound.wordCompleteBonus();
      const applyAndGetNewTotal = () => { st.points = earned; return scoreNow(); };
      let finishDelay;
      if (perfect) {
        // PERFECT pops in place; the point value follows it a beat later and
        // is the thing that actually flies to the score (teacher, 8/8/2026).
        // "bonusMinus" prefixes the multiplier ("5x PERFECT") so the earned
        // total that follows makes sense at a glance (teacher, 10/8/2026).
        showPerfectBurst(mode === "bonusMinus" ? `${mult}x PERFECT` : "PERFECT");
        flyPointsOnly(earned, applyAndGetNewTotal, PERFECT_TO_POINTS_DELAY_MS);
        finishDelay = PERFECT_TO_POINTS_DELAY_MS + PICKFLY_TOTAL_MS + FLYGAIN_PULSE_MS + 250;
      } else {
        // Had a mistake: no PERFECT, no icon at all — just the points flying.
        flyPointsOnly(earned, applyAndGetNewTotal, 0);
        finishDelay = PICKFLY_TOTAL_MS + FLYGAIN_PULSE_MS + 250;
      }
      // FIGHT MODE: tell the match this board just solved the round's word.
      // The controller decides who scores, whether the other board keeps
      // playing, and when both move on — this play only reports.
      // No `correct` flag: in the bonus-family modes a word can only ever end
      // SOLVED (letters must be tapped in the right order, a wrong tap is
      // simply refused), so getting here always means correct. Mistakes along
      // the way cost the multiplier, not the round — see `perfect`.
      if (fightCtl) fightCtl.wordDone(fightSide, { index, earned, perfect, correct: true });
      if (outOfLives) autoTimer = setTimeout(() => finish({ gameover: true }), finishDelay);
      // In a fight the controller drives the last word too (it ends the match
      // once both boards are done), so don't race it with a local finish().
      else if (!fightCtl && state.every(doneCheck)) autoTimer = setTimeout(finish, finishDelay);
    }

    // ----- interaction: submit mode -----
    // Plain tap: always the leftmost empty slot (unchanged behaviour).
    function submitPick(tileId, tileEl) {
      const slotIdx = state[index].placed.findIndex(p => p === null);
      if (slotIdx === -1) return;
      submitPickAt(tileId, tileEl, slotIdx);
    }

    // Drag-drop: the PLAYER chose the destination slot (teacher, 8/8/2026 —
    // "On submit" drags land wherever dropped, unlike the tap's auto-fill).
    // Returns true if placed, false if the slot was invalid/occupied — the
    // caller springs the tile back to the origin row on false.
    function submitPickAt(tileId, tileEl, slotIdx) {
      const st = state[index];
      if (st.graded || st.used[tileId]) return false;
      if (slotIdx == null || slotIdx < 0 || st.placed[slotIdx] != null) return false;
      const it = items[index];
      anagramSound.place();   // same "drop" as bonus mode's correct pick — both modes tap the origin row alike
      // Same decoupling as bonusPick: the slot is claimed and the tile locked
      // RIGHT NOW (not in the fly's onDone) so a fast second tap reads the
      // updated `placed` array and can't double-claim the same empty slot, and
      // so taps never wait on each other's flight to finish.
      st.used[tileId] = true;
      st.placed[slotIdx] = tileId;
      tileEl.disabled = true;
      updateSubmitButtonState();
      const destEl = root.querySelector(`.aw-anagram-rtile[data-pos="${slotIdx}"]`);
      const shownChar = displayChar(it.letters[tileId], allCaps);
      // stays ORIGIN-colored during the flight (only Submit reveals right/wrong colors)
      flyLetter(tileEl, destEl, shownChar, ORIGIN_BG, () => {
        patchTileUsed(tileEl);
        patchResultFilled(destEl, shownChar, null);
      });
      return true;
    }

    function unplace(pos) {
      const st = state[index];
      if (st.graded || busy) return;
      const tileId = st.placed[pos];
      if (tileId == null) return;
      const it = items[index];
      const resultEl = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
      const originEl = root.querySelector(`.aw-anagram-otile[data-tile="${tileId}"]`);
      const shownChar = displayChar(it.letters[tileId], allCaps);
      anagramSound.pickup();
      st.placed[pos] = null;
      st.used[tileId] = false;
      updateSubmitButtonState();
      if (!resultEl || !originEl) { patchResultSlotDisplay(pos); patchOriginRestored(tileId); return; }
      // Empty the slot right away (back to its dashed placeholder look) —
      // the letter itself keeps traveling as a separate flying clone, so it
      // never just "vanishes"; the origin tile only reappears once the
      // clone actually ARRIVES there.
      const fromRect = resultEl.getBoundingClientRect();
      const toRect = originEl.getBoundingClientRect();
      const fontSize = getComputedStyle(resultEl).fontSize;
      const borderRadius = getComputedStyle(resultEl).borderRadius;
      patchResultSlotDisplay(pos);
      busy = true;
      flyTileClone(fromRect, toRect, shownChar, ORIGIN_BG, fontSize, () => {
        patchOriginRestored(tileId);
        busy = false;
        updateSubmitButtonState();
      }, borderRadius);
    }

    // "Chèn-đẩy" (insert-and-shift) reorder — replaces the old A<->B swap
    // (teacher, 8/8/2026): dragging a placed tile onto another slot no
    // longer just trades those two — it's pulled OUT of its slot and
    // INSERTED at the target slot, shifting every tile between the two
    // positions back by one, the same mental model as reordering a list
    // (the content editor's row drag already works this way). `fromPos`'s
    // tile keeps going from EXACTLY where the hand let go —
    // `draggedFromRect`, its current on-screen rect, still carrying the live
    // drag transform — so it never stops looking like itself mid-flight (no
    // hide/reveal seam). Every REAL tile between fromPos/toPos slides the
    // short one-slot distance to make room. All of them reset `transform:""`
    // and repaint via patchResultSlotDisplay() in the SAME synchronous tick
    // once every animation finishes — the browser only ever paints the
    // combined "back home + correct letter" frame, never an in-between flash
    // (same trick used by every other patch* function here).
    function moveResultTile(fromPos, toPos, draggedFromRect) {
      const st = state[index];
      if (st.graded || busy || fromPos === toPos) return;
      const lo = Math.min(fromPos, toPos), hi = Math.max(fromPos, toPos);

      // Snapshot each affected slot's TRUE (untransformed) layout rect
      // BEFORE anything moves — toggling transform off/on to measure is
      // cheap and avoids parsing transform strings back into numbers.
      const els = {}, homes = {};
      for (let p = lo; p <= hi; p++) {
        const elp = root.querySelector(`.aw-anagram-rtile[data-pos="${p}"]`);
        els[p] = elp;
        if (!elp) continue;
        const saved = elp.style.transform;
        elp.style.transform = "";
        homes[p] = elp.getBoundingClientRect();
        elp.style.transform = saved;
      }

      const oldPlaced = st.placed.slice();
      const moved = st.placed.splice(fromPos, 1)[0];
      st.placed.splice(toPos, 0, moved);
      anagramSound.pickup();
      updateSubmitButtonState();

      // For every OLD occupant of a slot in [lo,hi], find where its content
      // ends up now (unique by tileId) and animate THAT DOM node sliding
      // there. Slots that were already empty carry no letter, so there's
      // nothing to visibly slide for them — patchResultSlotDisplay() alone
      // (at settle) is enough, and lands invisibly under whichever real tile
      // just finished animating into that exact spot.
      const jobs = [];
      let dur = FLY_MIN_MS;
      for (let p = lo; p <= hi; p++) {
        const tileId = oldPlaced[p];
        if (tileId == null) continue;
        const elp = els[p];
        const homeP = homes[p];
        if (!elp || !homeP) continue;
        const destPos = st.placed.indexOf(tileId);
        const destHome = homes[destPos];
        if (!destHome || destPos === p) continue;
        const curP = (p === fromPos && draggedFromRect) ? draggedFromRect : homeP;
        const dx = (destHome.left + destHome.width / 2) - (homeP.left + homeP.width / 2);
        const dy = (destHome.top + destHome.height / 2) - (homeP.top + homeP.height / 2);
        const travelDx = (destHome.left + destHome.width / 2) - (curP.left + curP.width / 2);
        const travelDy = (destHome.top + destHome.height / 2) - (curP.top + curP.height / 2);
        dur = Math.max(dur, flyDurationFor(travelDx, travelDy));
        jobs.push({ el: elp, from: (p === fromPos ? elp.style.transform : "") || "translate(0,0) scale(1)",
                    to: `translate(${dx}px, ${dy}px) scale(1)` });
      }

      if (!jobs.length) {
        for (let p = lo; p <= hi; p++) patchResultSlotDisplay(p);
        return;
      }

      busy = true;
      let pending = jobs.length;
      const settle = () => {
        pending--;
        if (pending > 0) return;
        // `fill:"forwards"` keeps a FINISHED animation's last keyframe active
        // over the cascade — clearing style.transform alone does nothing
        // while that hold is still in effect (caught measuring
        // getComputedStyle post-settle during testing, 8/8/2026); cancel()
        // releases the hold so the (now-empty) inline style wins.
        jobs.forEach(j => { j.anim.cancel(); j.el.style.transform = ""; });
        if (els[fromPos]) els[fromPos].classList.remove("is-dragging");
        for (let p = lo; p <= hi; p++) patchResultSlotDisplay(p);
        busy = false;
        updateSubmitButtonState();
      };

      jobs.forEach(job => {
        job.anim = job.el.animate(
          [{ transform: job.from }, { transform: job.to }],
          { duration: dur, easing: FLY_EASING, fill: "forwards" }
        );
        let done = false;
        const finish = () => { if (done) return; done = true; settle(); };
        job.anim.onfinish = finish;
        setTimeout(finish, dur + 100);
      });
    }

    // Shared position-only fly (no color morph — everything pre-Submit
    // stays the neutral origin grey) used by unplace().
    // `fontSize` MUST be passed in (read from the real tile before it's
    // touched) — this clone used to fall back to the page's inherited
    // font-size instead of the tile's actual size, which is why a swapped or
    // returned letter visibly shrank mid-flight (teacher-reported, 3/8/2026).
    function flyTileClone(fromRect, toRect, char, bg, fontSize, onDone, borderRadius) {
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      // backgroundCOLOR (longhand), not the `background` shorthand — the
      // shorthand would blank out the CSS-declared gloss `background-image`
      // that .aw-anagram-flytile shares with the real tiles (teacher, 8/8/2026).
      clone.style.backgroundColor = bg;
      if (borderRadius) clone.style.borderRadius = borderRadius;
      document.body.append(clone);
      // Forces a synchronous style/layout flush BEFORE the transform animation
      // starts, so the browser paints one legitimate "at rest" frame (already
      // rounded, already sized) first — without this, transform-driven
      // compositor-layer promotion can race the very first paint and flash a
      // raw square-cornered frame for 1-2 frames (teacher-reported, 3/8/2026).
      void clone.offsetWidth;
      activeFlyNodes.add(clone);
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      const duration = flyDurationFor(dx, dy);
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px, ${dy}px)` }
      ], { duration, easing: FLY_EASING, fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, duration + 150);
    }

    // Drag (pointer events, mouse+touch alike) to INSERT an already-placed
    // result tile at another slot (pushing everything in between back by
    // one — see moveResultTile()), OR a plain tap (no real movement) to send
    // it back to the origin row — only while the word hasn't been submitted yet.
    function attachResultTileInteraction(tileEl, pos) {
      let dragging = false, moved = false, startX = 0, startY = 0;
      const THRESHOLD = 6;
      tileEl.style.touchAction = "none";
      tileEl.addEventListener("pointerdown", e => {
        const st = state[index];
        if (busy || st.graded || st.placed[pos] == null) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        tileEl.setPointerCapture(e.pointerId);
      });
      tileEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
          moved = true;
          tileEl.classList.add("is-dragging");
        }
        if (moved) {
          tileEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          setDropHighlight(target && target !== tileEl ? target : null);
        }
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        clearDropHighlight();
        if (moved) {
          // Read the tile's CURRENT on-screen rect — still carrying its drag
          // transform at this instant — BEFORE anything resets it. This is
          // the fix for the old "snap back to source slot, then a separate
          // clone flies" bug: the flight now starts from wherever the hand
          // actually let go.
          const draggedRect = tileEl.getBoundingClientRect();
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          if (target && target !== tileEl && target.dataset.pos != null) {
            // .is-dragging (elevated z-index) stays on until moveResultTile
            // actually settles — the real tile keeps sliding in view now
            // (no more hide-and-fly-a-clone), so it must stay on top of the
            // other tiles it's crossing over the whole way across.
            moveResultTile(pos, Number(target.dataset.pos), draggedRect);
          } else {
            animateReturnHome(tileEl);   // keeps .is-dragging (elevated z-index) until it has actually settled
          }
        } else {
          tileEl.classList.remove("is-dragging");
          tileEl.style.transform = "";
          unplace(pos);
        }
      };
      tileEl.addEventListener("pointerup", endDrag);
      tileEl.addEventListener("pointercancel", endDrag);
    }

    // ----- drag & drop helpers (shared by origin-row placement drags and
    // result-row swap drags) -----
    let dropHighlightEl = null;
    function setDropHighlight(target) {
      if (dropHighlightEl === target) return;
      if (dropHighlightEl) dropHighlightEl.classList.remove("is-droptarget");
      dropHighlightEl = target || null;
      if (dropHighlightEl) dropHighlightEl.classList.add("is-droptarget");
    }
    function clearDropHighlight() { setDropHighlight(null); }

    // Finds the real drop target under the pointer, ignoring the element
    // being dragged itself (it's still under the pointer while held).
    function hitTestUnder(el0, x, y, selector) {
      const prevPE = el0.style.pointerEvents;
      el0.style.pointerEvents = "none";
      const under = document.elementFromPoint(x, y);
      el0.style.pointerEvents = prevPE;
      return under ? under.closest(selector) : null;
    }

    // Smoothly slides a tile that's mid-drag (still carrying its drag
    // transform) back to its normal layout position — used whenever a drag
    // ends without landing anywhere valid (dropped in empty space, dropped
    // on the wrong slot, or the letter turned out wrong). Animates the REAL
    // tile, not a clone — it never actually left the DOM, which is what
    // makes "let go and it springs back to your hand" read as physical
    // instead of an instant teleport (teacher, 8/8/2026).
    function animateReturnHome(tileEl) {
      const current = tileEl.style.transform;
      const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(current || "");
      const duration = flyDurationFor(m ? parseFloat(m[1]) : 0, m ? parseFloat(m[2]) : 0);
      let done = false;
      const anim = tileEl.animate(
        [{ transform: current || "translate(0,0)" }, { transform: "translate(0,0) scale(1)" }],
        { duration, easing: FLY_EASING, fill: "forwards" }
      );
      const finishIt = () => {
        if (done) return; done = true;
        // Must cancel BEFORE clearing the inline style — a finished
        // `fill:"forwards"` animation keeps holding its last keyframe over
        // the cascade otherwise, which would then also block any FUTURE
        // plain `style.transform` write on this tile (e.g. the very next
        // drag's live pointermove tracking) from having any visible effect
        // (caught by measuring getComputedStyle post-settle in the swap
        // path's identical pattern, 8/8/2026 — fixed here too for the same
        // reason, even though this keyframe's end value happens to already
        // look identical to "").
        anim.cancel();
        tileEl.style.transform = "";
        tileEl.classList.remove("is-dragging");
      };
      anim.onfinish = finishIt;
      setTimeout(finishIt, duration + 150);
    }

    // Is `target` (a result-row tile the player is hovering/dropping over)
    // a legal destination for a letter dragged straight from the origin
    // row? Bonus mode only ever accepts the ONE slot currently being
    // solved for (order still matters, per the teacher's ruling — dragging
    // just changes HOW you place a letter, not the turn order); On-submit
    // accepts any still-empty slot (the player picks where it goes).
    function isValidOriginDropTarget(target) {
      if (!target || target.dataset.pos == null) return false;
      const st = state[index];
      const pos = Number(target.dataset.pos);
      if (isBonusFamily) return pos === st.nextPos;
      return st.placed[pos] == null;
    }

    // Resolves a drag that started on an ORIGIN tile and ended over `target`
    // (may be null). Dropping on an invalid slot never counts as a real
    // attempt — it just springs back with no penalty. Dropping the WRONG
    // letter on bonus mode's one legal (receiving) slot DOES count as a
    // mistake, same as tapping the wrong tile — bonusPick() already applies
    // that penalty, this just also has to spring the tile back since (unlike
    // a tap) it actually left its spot.
    function handleOriginDrop(tileId, tileEl, target) {
      if (finished || !isValidOriginDropTarget(target)) { animateReturnHome(tileEl); return; }
      const pos = Number(target.dataset.pos);
      const ok = isBonusFamily ? bonusPick(tileId, tileEl) : submitPickAt(tileId, tileEl, pos);
      if (ok) tileEl.classList.remove("is-dragging");   // flyLetter has already hidden the tile — safe now
      else animateReturnHome(tileEl);
    }

    // Lets an origin-row tile be DRAGGED straight onto a result slot (both
    // modes), on top of the existing plain-tap placement. A tap (no real
    // pointer movement past THRESHOLD) falls through to the exact same
    // onTileClick() path as before — drag is purely an alternate input, the
    // tap behaviour is untouched.
    function attachOriginTileInteraction(tileEl, tileId) {
      let dragging = false, moved = false, startX = 0, startY = 0;
      const THRESHOLD = 6;
      tileEl.style.touchAction = "none";
      tileEl.addEventListener("pointerdown", e => {
        if (finished || tileEl.disabled) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        tileEl.setPointerCapture(e.pointerId);
      });
      tileEl.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
          moved = true;
          tileEl.classList.add("is-dragging");
        }
        if (moved) {
          tileEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          setDropHighlight(isValidOriginDropTarget(target) ? target : null);
        }
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        clearDropHighlight();
        if (moved) {
          const target = hitTestUnder(tileEl, e.clientX, e.clientY, ".aw-anagram-rtile");
          handleOriginDrop(tileId, tileEl, target);
        } else {
          tileEl.style.transform = "";
          onTileClick(tileId, tileEl);
        }
      };
      tileEl.addEventListener("pointerup", endDrag);
      tileEl.addEventListener("pointercancel", endDrag);
    }

    function doSubmit() {
      const st = state[index];
      if (st.graded || busy) return;
      if (!st.placed.every(p => p != null)) return;
      const it = items[index];
      busy = true;
      st.graded = true;
      // No render() here: every origin tile is already .is-used (Submit only
      // enables once every slot is filled), so nothing there needs to change.
      // Just disable the button and let Next reflect "graded" — the reveal
      // itself is driven by the staggered loop below, patching the SAME live
      // tiles directly (a full render() would flash the whole card).
      updateSubmitButtonState();
      updateNav();

      const n = it.letters.length;
      const rights = [];
      let allCorrect = true;
      for (let pos = 0; pos < n; pos++) {
        const tileId = st.placed[pos];
        const isRight = it.letters[tileId].toLowerCase() === it.letters[pos].toLowerCase();
        rights.push(isRight);
        if (!isRight) allCorrect = false;
      }

      // ----- FIGHT MODE: hold the WHOLE grading picture back -----
      // Per-position green/grey is the biggest answer leak this template has —
      // it shows the other team exactly which letters are already home — and
      // the reveal line literally prints the word. So in a match nothing is
      // drawn now: the board just goes neutral grey (syncFightLock) and the
      // match calls reveal() once both teams are done (teacher, 12/8/2026).
      // The state itself still settles immediately, so the controller hears
      // about this board's result straight away rather than ~2.4s later.
      if (fightCtl) {
        fightPendingReveal = { rights, allCorrect };
        st.correct = allCorrect;
        if (!allCorrect && pointsOff) { penalty += pointsOff; ui.setScore(scoreNow()); }
        const outOfLivesFight = !allCorrect && loseLife();
        st.revealed = true;
        busy = false;
        updateSubmitButtonState();
        updateNav();
        syncFightLock();
        fightCtl.wordDone(fightSide, { index, correct: allCorrect });
        if (outOfLivesFight) autoTimer = setTimeout(() => finish({ gameover: true }), 1500);
        return;
      }

      for (let pos = 0; pos < n; pos++) {
        const isRight = rights[pos];
        setTimeout(() => {
          const slotEl = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
          if (!slotEl) return;
          slotEl.classList.add(isRight ? "is-blue" : "is-wrongbg");
          // Transient flash (teacher, 8/8/2026) — see the identical note at
          // render()'s revealmark append.
          const mark = el("span", "aw-anagram-revealmark", isRight ? icons.markCheck : icons.markCross);
          slotEl.append(mark);
          setTimeout(() => mark.remove(), 550);
          if (dead) return;   // Đợt 114 — the play area is detached but the SOUND still played
          (isRight ? anagramSound.submitTileCorrect : anagramSound.wrongPick)();
        }, pos * STAGGER_MS);
      }

      setTimeout(() => {
        // Đợt 114 — this timer is 1.9-2.9s out (n × 260ms + 300) and nothing
        // holds its handle, so pressing Submit on the last word and then leaving
        // used to land HERE on a discarded play and arm a brand-new autoTimer
        // (below) that finished it into the leaderboard. Widest window of any
        // leak found in the audit.
        if (dead) return;
        st.correct = allCorrect;
        if (!allCorrect && pointsOff) { penalty += pointsOff; ui.setScore(scoreNow()); }  // one points-off for a wrong word
        const outOfLives = !allCorrect && loseLife();   // a life is lost on a wrong word
        st.revealed = true;   // only matters if this word is re-rendered later (e.g. navigated back to)
        busy = false;
        updateSubmitButtonState();
        updateNav();
        // Per-position colors/badges are ALREADY on the live tiles (the
        // staggered loop above applied them directly) — only the reveal
        // line's text is still outstanding, patch it in place.
        if (revealSlotEl) revealSlotEl.textContent = allCorrect ? "" : (allCaps ? it.word.toUpperCase() : it.word);
        if (allCorrect) {
          flyScoreGain(1, () => { st.points = 1; return scoreNow(); });
          anagramSound.submitWordCorrect();
        } else {
          showBigMark(false);
          // Real Anagram "Incorrect" sound (same pool as a per-letter wrong
          // pick) instead of core's generic synthesized wrong tone (teacher,
          // 8/8/2026 — "âm chuẩn trong source âm thanh"). Wordwall's own
          // asset set has no SEPARATE "whole word wrong" sound — "Incorrect"
          // is reused at every granularity, per the source folder's own
          // notes (GHI CHU.md).
          anagramSound.wrongPick();
        }
        // (FIGHT MODE never reaches here — it returned early above, having
        // already settled the state and reported to the match.)
        if (outOfLives) {
          autoTimer = setTimeout(() => finish({ gameover: true }), 1500);   // always the wrong-word branch (outOfLives implies !allCorrect)
        } else if (state.every(doneCheck)) {
          autoTimer = setTimeout(finish, allCorrect ? FLYGAIN_TOTAL_MS + FLYGAIN_PULSE_MS + 250 : 1500);
        }
      }, n * STAGGER_MS + 300);
    }

    // ----- FIGHT MODE: the withheld grading picture, finally drawn -----
    // Called by the match once BOTH teams are done with the word. Everything
    // lands AT ONCE rather than position-by-position: the staggered version
    // takes n×260ms+300 (≈2.4s for an 8-letter word), which would still be
    // playing when the round turns over at ROUND_HOLD_MS (2100ms) — and a
    // simultaneous reveal is the fairer read in a race anyway, since both
    // boards show their result in the same instant.
    // Also runs on a board that never submitted, so IT is shown the answer too.
    function revealFightResult() {
      if (dead) return;
      const pend = fightPendingReveal;
      fightPendingReveal = null;
      const st = state[index], it = items[index];
      if (mode !== "submit" || !it) { syncFightLock(); return; }
      if (pend) {
        pend.rights.forEach((isRight, pos) => {
          const slotEl = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
          if (!slotEl) return;
          slotEl.classList.add(isRight ? "is-blue" : "is-wrongbg");
          showTransientMark(slotEl, "aw-anagram-revealmark",
            isRight ? icons.markCheck : icons.markCross, 550);
        });
        if (revealSlotEl) revealSlotEl.textContent = pend.allCorrect ? "" : (allCaps ? it.word.toUpperCase() : it.word);
        if (pend.allCorrect) {
          flyScoreGain(1, () => { st.points = 1; return scoreNow(); });
          anagramSound.submitWordCorrect();
        } else {
          showBigMark(false);
          anagramSound.wrongPick();
        }
      } else if (revealSlotEl && st.correct !== true) {
        // Never submitted (the other team took the word): no marks to draw —
        // just show what the answer was.
        revealSlotEl.textContent = allCaps ? it.word.toUpperCase() : it.word;
      }
      syncFightLock();
    }

    // ----- incremental DOM patches (avoid a full render() mid-word — that
    // used to flash the whole clue+both rows on every single tap) -----
    function patchTileUsed(tileEl) {
      // Deliberately do NOT reset style.visibility back to "" here — the tile
      // was set to visibility:hidden the instant it started flying (see
      // flyLetter). Clearing that back to visible right as `.is-used`'s
      // opacity:0 kicks in made the CSS opacity transition animate from a
      // (now momentarily visible) opacity:1 down to 0 — a brief flash right
      // where the tile used to be. Leaving it hidden is permanent and fine:
      // this tile is used for good, it never needs to reappear.
      tileEl.classList.add("is-used");
      tileEl.classList.remove("is-dragging");
      tileEl.style.transform = "";
      tileEl.disabled = true;
    }
    function patchOriginRestored(tileId) {
      const tileEl = root.querySelector(`.aw-anagram-otile[data-tile="${tileId}"]`);
      if (!tileEl) return;
      // This tile is genuinely coming BACK into play (unplace/On submit),
      // unlike patchTileUsed's permanent hide — it must reappear, so the
      // visibility:hidden set when it originally flew away has to be
      // cleared here. Safe from the earlier flash bug: opacity (via
      // .is-used removal) and visibility both move the SAME direction
      // (hidden -> shown) here, so it fades IN cleanly instead of flashing.
      tileEl.style.visibility = "";
      tileEl.classList.remove("is-used");
      // Always re-enable — every call site restores this tile right as its
      // own lock is ending, so there is no "still busy" case to preserve
      // (reading the outer `busy` here raced against it being cleared right
      // after, in whichever order the caller happened to write them).
      tileEl.disabled = false;
    }
    function patchResultFilled(destEl, char, extraClass) {
      destEl.classList.add("is-filled");
      if (extraClass) destEl.classList.add(extraClass);
      destEl.textContent = char;
    }
    function patchResultSlotDisplay(pos) {
      const elx = root.querySelector(`.aw-anagram-rtile[data-pos="${pos}"]`);
      if (!elx) return;
      const st = state[index], it = items[index];
      const tileId = st.placed[pos];
      elx.classList.remove("is-blue", "is-wrongbg");
      if (tileId != null) { elx.classList.add("is-filled"); elx.textContent = displayChar(it.letters[tileId], allCaps); }
      else { elx.classList.remove("is-filled"); elx.textContent = ""; }
    }
    function updateSubmitButtonState() {
      if (!submitBtnEl) return;
      const st = state[index];
      const filled = st.placed.every(p => p != null);
      submitBtnEl.disabled = !filled || st.graded || busy || fightLocked();
    }

    // FIGHT MODE — apply a lock change WITHOUT re-rendering (12/8/2026).
    // Called by the match controller's lock() the instant the other team wins
    // the word, so it must touch as little as possible: a full render() here
    // replayed the card's fade-in and read as a one-frame flash on the losing
    // board. Everything below is an in-place patch of state that is already on
    // screen — the same discipline the rest of this file uses mid-word.
    function syncFightLock() {
      const locked = fightLocked();
      const st = state[index];
      const wordDone = isBonusFamily ? st.correct === true : st.graded;
      root.querySelectorAll(".aw-anagram-otile").forEach(tileEl => {
        const tileId = Number(tileEl.dataset.tile);
        tileEl.disabled = st.used[tileId] || wordDone || locked;
      });
      // "Too slow" (teacher, 12/8/2026): the moment the other team takes the
      // word, this board's tiles lose their colour and dim, so the class SEES
      // the round is already decided instead of discovering it by tapping.
      // A board that finished the word ITSELF keeps its colours — it earned
      // them, and it is only locked because the round is now over for both.
      // Grey while this board's go is over but its result is not on show yet:
      // either it never got to play ("too slow" — the other team took the
      // word), or it HAS submitted but the marks are withheld until the other
      // team finishes. Once revealed, a board that played drops the grey so
      // its own per-letter colours read properly.
      const groupEl = root.querySelector(".aw-anagram-group");
      if (groupEl) groupEl.classList.toggle("is-fightlost", locked && (!wordDone || !!fightPendingReveal));
      updateSubmitButtonState();
    }

    // ----- shared visual effects -----

    // Pops a transient check/cross mark into `parentEl`: small->large while
    // fading in, holds at full size, then large->small while fading out — a
    // SINGLE continuous animation instead of a CSS entrance + an instant
    // `.remove()`, which used to make the mark vanish with a jerk (teacher,
    // 8/8/2026: "biến mất khực một cái"). Removing the element only happens
    // once the shrink-out has actually finished playing.
    function showTransientMark(parentEl, className, iconSvg, totalMs) {
      const mark = el("span", className, iconSvg);
      parentEl.append(mark);
      const anim = mark.animate([
        { transform: "scale(.3)", opacity: 0, offset: 0, easing: "cubic-bezier(.34,1.4,.4,1)" },
        { transform: "scale(1)", opacity: 1, offset: 0.32 },
        { transform: "scale(1)", opacity: 1, offset: 0.7, easing: "ease-in" },
        { transform: "scale(.4)", opacity: 0, offset: 1 }
      ], { duration: totalMs, fill: "forwards" });
      let done = false;
      const finish = () => { if (done) return; done = true; mark.remove(); };
      anim.onfinish = finish;
      setTimeout(finish, totalMs + 100);
      return mark;
    }

    // A big white check on the DESTINATION tile right as a correct letter
    // lands — same visual family as the big white X (teacher, 8/8/2026: it
    // used to sit on the ORIGIN tile, which read as the wrong end once the
    // letter had already flown away).
    function showLandedCheckBadge(destEl) {
      showTransientMark(destEl, "aw-anagram-slotmark", icons.markCheck, 550);
    }

    // A big white X inside the currently-PENDING result slot (the one a
    // wrong letter was aimed at) — replaces the old small red X that used to
    // sit on the origin tile itself (teacher, 8/8/2026).
    function showWrongPickMark() {
      const slotEl = root.querySelector(`.aw-anagram-rtile[data-pos="${state[index].nextPos}"]`);
      if (!slotEl) return;
      showTransientMark(slotEl, "aw-anagram-slotmark", icons.markCross, 550);
    }

    // "PERFECT" pops up at the middle of the tile rows, grows in, then fades
    // out IN PLACE — it no longer flies anywhere (teacher, 8/8/2026: the
    // point value is a separate, later effect — see flyPointsOnly() below).
    function showPerfectBurst(label) {
      // Centered on the RESULT row specifically (not the whole group, which
      // spans both rows and would land it in the gap between them — teacher-
      // reported "bị lệch", 8/8/2026). `label` defaults to "PERFECT"; "bonus
      // and minus" mode passes "Nx PERFECT" instead (teacher, 10/8/2026).
      const row = root.querySelector(".aw-anagram-result");
      if (!row) return;
      const burst = el("span", "aw-anagram-perfect-burst", label || "PERFECT");
      row.append(burst);
      setTimeout(() => burst.remove(), PERFECT_BURST_MS);
    }

    // ----- FIGHT MODE: land a flying score mark, or reject it (Đợt 133) -----
    // Every "+N flies to the score" effect in this file (flyScoreGain below,
    // flyPointsOnly further down) funnels through here at the exact instant
    // it ARRIVES. In fight mode this is the one place that decides whether
    // the point actually counts: `fightCtl.mayScore()` reads the round's
    // FINAL, already-decided outcome — word-completion timestamps (and the
    // controller's own 0.1s tie-window) are settled within ~100ms, while a
    // flight itself takes 0.9-1.8s to land, so this can never be caught out
    // by the exact race the old numeric freeze/holdFreeze alone was
    // vulnerable to (teacher, 13/8/2026: "vẫn báo điểm... phải có cơ chế làm
    // điểm rơi ra khỏi màn hình"). Single mode (`fightCtl` null) always lands
    // normally — nothing here changes for it.
    //
    // A rejected mark falls a little further down and fades, instead of
    // landing — `dx`/`dy`/`endScale` are the position it's ALREADY sitting at
    // (its own flight animation holds its last keyframe via fill:"forwards"),
    // so this is a small delta from there, not a fresh flight across the
    // screen. `applyAndGetNewTotal()` is never called for a rejected mark, so
    // this word's points are simply never added — nothing to freeze or
    // un-freeze later, because the increment never happened in the first
    // place.
    function landOrReject(node, anim, applyAndGetNewTotal, dx, dy, endScale) {
      if (fightCtl && !fightCtl.mayScore(fightSide)) {
        try { anim.cancel(); } catch { /* already gone — same "release the fill:forwards hold before touching it again" trap this file already documents elsewhere */ }
        const fall = node.animate([
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 1, offset: 0 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 70}px)) scale(${endScale * 0.7})`, opacity: 0, offset: 1 }
        ], { duration: 380, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
        let fell = false;
        const settle = () => { if (fell) return; fell = true; node.remove(); activeFlyNodes.delete(node); };
        fall.onfinish = settle;
        setTimeout(settle, 380 + 150);
        return;
      }
      node.remove(); activeFlyNodes.delete(node);
      pulseScoreTo(applyAndGetNewTotal());
    }

    // Flies "+N" from the middle of the tile rows to the score badge, no icon
    // shown first — used for BOTH bonus-mode outcomes (teacher, 8/8/2026): a
    // non-perfect word calls this immediately with delayMs=0, a perfect word
    // calls it a beat after showPerfectBurst() (delayMs>0) so PERFECT reads
    // as "for the word", then the number reads as "here's what it earned".
    function flyPointsOnly(points, applyAndGetNewTotal, delayMs) {
      const run = () => {
        // Same anchor as showPerfectBurst() (the RESULT row) so the two
        // effects visually belong together instead of jumping between spots
        // (teacher, 8/8/2026).
        const row = root.querySelector(".aw-anagram-result");
        const scoreEl = scoreTargetEl();
        if (!row || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
        // (scoreTargetEl: this board's own chip, or in FIGHT MODE this team's
        // number on the shared strip above — see its definition in mount().)
        // "slightly bigger than one tile" (teacher, 8/8/2026), THEN doubled
        // again per the follow-up request — read the REAL rendered tile size
        // directly instead of guessing a cqw->px conversion, so this stays
        // correct at any fit/zoom level.
        const tileEl = root.querySelector(".aw-anagram-otile, .aw-anagram-rtile");
        const tilePx = tileEl ? tileEl.getBoundingClientRect().width : 40;
        const baseSize = Math.max(48, tilePx * 1.15 * 2);

        const startRect = row.getBoundingClientRect();
        const endRect = scoreEl.getBoundingClientRect();
        const cx = startRect.left + startRect.width / 2;
        const cy = startRect.top + startRect.height / 2;
        const dx = (endRect.left + endRect.width / 2) - cx;
        const dy = (endRect.top + endRect.height / 2) - cy;

        const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
        const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

        const numEl = el("div", "aw-anagram-flynum", "+" + points);
        numEl.style.left = cx + "px";
        numEl.style.top = cy + "px";
        numEl.style.fontSize = baseSize + "px";
        document.body.append(numEl);
        activeFlyNodes.add(numEl);

        const total = PICKFLY_HOLD_MS + PICKFLY_FLIGHT_MS;
        const holdFrac = PICKFLY_HOLD_MS / total;
        const anim = numEl.animate([
          { transform: "translate(-50%,-50%) scale(.6)", opacity: 0, offset: 0 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: Math.min(1, holdFrac * 0.5) },
          { transform: "translate(-50%,-50%) scale(1.06)", opacity: 1, offset: holdFrac },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 1, offset: 1 }
        ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

        let done = false;
        const complete = () => {
          if (done) return; done = true;
          landOrReject(numEl, anim, applyAndGetNewTotal, dx, dy, endScale);
        };
        anim.onfinish = complete;
        setTimeout(complete, total + 150);
      };
      if (delayMs) setTimeout(run, delayMs); else run();
    }

    // "Bonus and minus" mode ONLY (teacher, 10/8/2026): a big RED "-N" flies
    // from the mis-tapped slot (the very tile showWrongPickMark() just put
    // an X on) straight to the score, landing = the deduction actually
    // applies — same "hold the score until it arrives" convention as every
    // other fly effect in this file. Sized off the REAL tile width so it
    // never reads as a throwaway detail even when the slider's penalty is
    // small ("không bị nhỏ, nhỏ nhất cũng phải gần bằng size của 1 ô").
    function flyLetterPenalty(slotEl, points) {
      const applyAndGetNewTotal = () => { penalty += points; return scoreNow(); };
      const scoreEl = scoreTargetEl();
      if (!slotEl || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const tileEl = root.querySelector(".aw-anagram-otile, .aw-anagram-rtile");
      const tilePx = tileEl ? tileEl.getBoundingClientRect().width : 40;
      const baseSize = Math.max(42, tilePx * 1.05);

      const startRect = slotEl.getBoundingClientRect();
      const endRect = scoreEl.getBoundingClientRect();
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;

      const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
      const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

      const numEl = el("div", "aw-anagram-flynum aw-anagram-flynum-bad", "-" + points);
      numEl.style.left = cx + "px";
      numEl.style.top = cy + "px";
      numEl.style.fontSize = baseSize + "px";
      document.body.append(numEl);
      activeFlyNodes.add(numEl);

      const total = PICKFLY_HOLD_MS + PICKFLY_FLIGHT_MS;
      const holdFrac = PICKFLY_HOLD_MS / total;
      const anim = numEl.animate([
        { transform: "translate(-50%,-50%) scale(.6)", opacity: 0, offset: 0 },
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: Math.min(1, holdFrac * 0.5) },
        { transform: "translate(-50%,-50%) scale(1.06)", opacity: 1, offset: holdFrac },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 1, offset: 1 }
      ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

      let done = false;
      const complete = () => {
        if (done) return; done = true;
        numEl.remove(); activeFlyNodes.delete(numEl);
        pulseScoreTo(applyAndGetNewTotal());
      };
      anim.onfinish = complete;
      setTimeout(complete, total + 150);
    }

    // In-place big check/cross — used ONLY for the "submit" mode's WRONG
    // outcome now (correct outcomes fly+pulse into the score, see below).
    function showBigMark(isCorrect) {
      const g = root.querySelector(".aw-anagram-group");
      if (!g) return;
      const fly = el("span", "aw-mark-fly" + (isCorrect ? "" : " is-cross"),
        isCorrect ? icons.markCheck : icons.markCross);
      g.append(fly);
      setTimeout(() => fly.remove(), isCorrect ? 900 : 2000);
    }

    // Shared "hold in place, then fly to the score, morphing into +points,
    // pulse-counting it in" effect — submit mode's all-correct outcome ONLY
    // now (bonus mode's own feedback is showPerfectBurst()/flyPointsOnly()
    // above, teacher 8/8/2026). `applyAndGetNewTotal` is called only once
    // the mark ARRIVES (it applies this word's points and returns the fresh
    // scoreNow() total) — so the score visibly stays unchanged until that
    // exact moment, matching "chuyển dần thành điểm... rồi nhập vào số điểm
    // tổng".
    function flyScoreGain(points, applyAndGetNewTotal) {
      const g = root.querySelector(".aw-anagram-group");
      const scoreEl = scoreTargetEl();
      if (!g || !scoreEl) { pulseScoreTo(applyAndGetNewTotal()); return; }
      const startRect = g.getBoundingClientRect();
      const endRect = scoreEl.getBoundingClientRect();
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;

      const wrap = el("div", "aw-anagram-flygain");
      wrap.style.left = cx + "px";
      wrap.style.top = cy + "px";
      // Must match the big X's size exactly (both are "whole word" marks) —
      // the X is CSS width:34.7% of this SAME .aw-anagram-group (see
      // anagram.css), so mirror that fraction here in px (font-size drives
      // width/height via the 1em box on .aw-anagram-flygain).
      const baseSize = Math.max(28, startRect.width * 0.347);
      wrap.style.fontSize = baseSize + "px";

      // How far to shrink by the time it ARRIVES: the actual score badge's own
      // font-size, not a flat guess. Fixes the mark still looking oversized
      // right as it lands (teacher-reported, 3/8/2026) — before this, the end
      // keyframe was a flat scale(0.4) regardless of baseSize, which could
      // still be much bigger than the tiny score digits for a wide stage.
      const scoreFontPx = parseFloat(getComputedStyle(scoreEl).fontSize) || baseSize * 0.4;
      const endScale = Math.max(0.12, Math.min(1, scoreFontPx / baseSize));

      const iconSpan = el("span", "afg-icon", icons.markCheck);
      const numSpan = el("span", "afg-num", "+" + points);
      wrap.append(iconSpan, numSpan);
      document.body.append(wrap);
      activeFlyNodes.add(wrap);

      const total = FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS;
      const holdFrac = FLYGAIN_HOLD_MS / total;
      const fadeEndFrac = Math.min(1, (FLYGAIN_HOLD_MS + FLYGAIN_FLIGHT_MS * 0.6) / total);

      const wrapAnim = wrap.animate([
        { transform: "translate(-50%,-50%) scale(1)", offset: 0 },
        { transform: "translate(-50%,-50%) scale(1.1)", offset: holdFrac },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, offset: 1 }
      ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

      iconSpan.animate([
        { opacity: 1, offset: 0 }, { opacity: 1, offset: holdFrac },
        { opacity: 0, offset: fadeEndFrac }, { opacity: 0, offset: 1 }
      ], { duration: total, easing: "linear", fill: "forwards" });
      numSpan.animate([
        { opacity: 0, offset: 0 }, { opacity: 0, offset: holdFrac },
        { opacity: 1, offset: fadeEndFrac }, { opacity: 1, offset: 1 }
      ], { duration: total, easing: "linear", fill: "forwards" });

      let done = false;
      const complete = () => {
        if (done) return; done = true;
        landOrReject(wrap, wrapAnim, applyAndGetNewTotal, dx, dy, endScale);
      };
      wrapAnim.onfinish = complete;
      setTimeout(complete, total + 150);
    }

    // Animates the top-score badge from its currently-shown number up to
    // `newValue`, with a scale "pulse" — ui.setScore() itself has no animated
    // form, so this drives the count frame by frame.
    // ⚠️ Every frame goes THROUGH ui.setScore() rather than writing
    // `scoreEl.innerHTML` here: the sign colour (.is-pos/.is-neg) lives in
    // ui.setScore(), so a hand-rolled innerHTML write paints the new NUMBER
    // while leaving the old COLOUR behind. That was a real bug (teacher,
    // 11/8/2026): crossing from + to − mid-word showed a negative score still
    // in GREEN, and it only turned red at the next word — because render(),
    // which runs at word boundaries only, was the next thing to call
    // ui.setScore(). Same markup as before (`${icons.check} ${n}`), so nothing
    // else changes.
    function pulseScoreTo(newValue) {
      // ⚠️ Đợt 114 — the querySelector below is a LIVE lookup, so on a discarded
      // play it does not fail quietly: it finds the NEXT game's score badge and
      // animates the dead game's number onto it. Several 0.9-1.9s fly/pulse
      // timers reach here, so the flag has to be tested at the top.
      if (dead) return;
      const scoreEl = scoreTargetEl();
      if (!scoreEl) return;
      // Read the old value off THIS PLAY's own chip, never off the fight
      // scoreboard: that one also carries the teacher's hand adjustments and
      // speed bonuses, so counting up from it would jump by whatever those add.
      const match = /(-?\d+)/.exec((ui.scoreEl || scoreEl).textContent || "");
      const oldValue = match ? parseInt(match[1], 10) : 0;
      if (oldValue === newValue) { ui.setScore(newValue); return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth; // restart if still running
      scoreEl.classList.add("aw-score-pulse");
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / FLYGAIN_PULSE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(oldValue + (newValue - oldValue) * eased);
        ui.setScore(val);
        if (t < 1) requestAnimationFrame(step);
        else {
          ui.setScore(newValue);
          setTimeout(() => scoreEl.classList.remove("aw-score-pulse"), 200);
        }
      };
      requestAnimationFrame(step);
    }

    // Flies a cloned tile from its origin-row position into a result slot.
    // `toColor` = the background it should end on (bonus: RESULT_BG, turns
    // blue immediately; submit: ORIGIN_BG, stays grey until Submit reveals
    // right/wrong colors).
    function flyLetter(fromEl, toEl, char, toColor, onDone) {
      if (!fromEl || !toEl) { onDone(); return; }
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const fontSize = getComputedStyle(fromEl).fontSize;
      const borderRadius = getComputedStyle(fromEl).borderRadius;
      fromEl.style.visibility = "hidden";
      const clone = el("div", "aw-anagram-flytile", escapeHtml(char));
      clone.style.position = "fixed";
      clone.style.left = fromRect.left + "px";
      clone.style.top = fromRect.top + "px";
      clone.style.width = fromRect.width + "px";
      clone.style.height = fromRect.height + "px";
      clone.style.fontSize = fontSize;
      // backgroundCOLOR (longhand) — see the identical note in flyTileClone().
      clone.style.backgroundColor = toColor;
      clone.style.borderRadius = borderRadius;
      document.body.append(clone);
      // See the identical comment in flyTileClone() — forces one legitimate
      // "at rest" paint before the transform animation starts, avoiding a
      // square-cornered flash during compositor-layer promotion.
      void clone.offsetWidth;
      activeFlyNodes.add(clone);
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      const duration = flyDurationFor(dx, dy);
      let done = false;
      const finishFly = () => {
        if (done) return; done = true;
        clone.remove(); activeFlyNodes.delete(clone);
        onDone();
      };
      const anim = clone.animate([
        { transform: "translate(0,0)", backgroundColor: ORIGIN_BG },
        { transform: `translate(${dx}px, ${dy}px)`, backgroundColor: toColor }
      ], { duration, easing: FLY_EASING, fill: "forwards" });
      anim.onfinish = finishFly;
      setTimeout(finishFly, duration + 150);
    }

    // ----- navigation -----
    function updateNav() {
      const isLast = index === total - 1;
      const st = state[index];
      const canAdvance = allowSkip || doneCheck(st);
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: canAdvance ? (isLast ? finish : goNext) : null,
        nextLabel: isLast ? icons.check : null
      });
    }

    function fadeSwap(change) {
      const card = root.querySelector(".aw-anagram-card");
      if (!card) { change(); return; }
      let done = false;
      const run = () => { if (done) return; done = true; change(); };
      const anim = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" });
      anim.onfinish = run;
      setTimeout(run, 220);
    }
    // ⚠️ FIGHT MODE: tell the match BEFORE the fade starts, not after it ends.
    // Reporting from inside fadeSwap's callback meant the other board only
    // began its own fade once THIS one had finished — a visible ~160ms lag
    // between two frames that are meant to move as one (teacher, 12/8/2026:
    // "2 bên đều đồng bộ 100% và có hiệu ứng giống hệt nhau"). The controller
    // hands the target straight to the other board, so both fades start in the
    // same frame and run the identical `fadeSwap` + `render`.
    function goPrev() {
      if (busy || index === 0) return;
      const target = index - 1;
      if (fightCtl) fightCtl.boardMoved(fightSide, target);
      fadeSwap(() => { index = target; render(); });
    }
    function goNext() {
      if (busy || index >= total - 1) return;
      const target = index + 1;
      if (fightCtl) fightCtl.boardMoved(fightSide, target);
      fadeSwap(() => { index = target; render(); });
    }

    // ----- FIGHT MODE: the match controller drives both boards through this -----
    // Registered AFTER goTo/render exist so the controller can move this board
    // the moment it attaches (board 1 mounts later than board 0 and would
    // otherwise sit on word 1 while the match is already on word 3).
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex(i) {
          const target = Math.max(0, Math.min(total - 1, i | 0));
          if (target === index) return;
          if (busy) busy = false;          // a round change outranks a half-finished animation
          fadeSwap(() => { index = target; render(); });
        },
        lock(on) {
          // ⚠️ `dead` first. The match locks both boards while tearing itself
          // down (Start again), i.e. AFTER cleanup() has run here — repainting
          // a dismantled play threw, and the exception killed the rebuild
          // halfway, leaving the OLD match on screen with no error visible to
          // the teacher. Same family as the Đợt 114 "ván đã chết" rules.
          if (dead) return;
          fightBoardLock = !!on;
          // ⚠️ NEVER render() here (teacher-reported flash, 12/8/2026). This
          // fires on the LOSING board at the exact moment the other team
          // finishes a word, and render() replaces the whole card — replaying
          // its fade-in as a one-frame flash right in the class's face. Patch
          // in place instead, exactly like every other mid-word update in this
          // file (see the header comment's note on why render() is reserved
          // for real word boundaries).
          syncFightLock();
        },
        reveal: revealFightResult,
        // Đợt 133 (teacher: "chỉ phát 1 voice duy nhất cho cả 2 đội") — the
        // MATCH's own relay for shared voice playback. Only ever called on
        // the SPEAKING board (fightCtl.speaks) — a tap on the OTHER board's
        // listen button (handleListenTap) reaches here via
        // ctl.requestVoiceToggle(), which always targets board 0. Same
        // "can't interrupt a playing clip" rule as a local tap.
        toggleVoiceRemote(clipId) {
          if (!fightCtl || !fightCtl.speaks(fightSide)) return;
          if (voiceAudioEl && !voiceAudioEl.paused) return;
          if (currentListenBtn) playVoiceClip(clipId, currentListenBtn);
        },
        // The MIRROR side's half: paints glow/equalizer bars to match
        // whatever the speaking board just reported (reportVoiceState,
        // called from setListenGlow/startEqualizer above) — no real <audio>
        // of its own. `setListenGlow` here is safe from re-reporting a loop:
        // it only calls fightCtl.reportVoiceState() when `speaks(fightSide)`
        // is true, which is false on this side by construction.
        syncVoice(state) {
          if (!currentListenBtn) return;
          if (state.playing !== undefined) setListenGlow(currentListenBtn, state.playing);
          if (state.levels) {
            const bars = currentListenBtn.querySelectorAll(".aw-anagram-eq-bar");
            bars.forEach((bar, i) => { if (state.levels[i] != null) bar.style.setProperty("--h", state.levels[i]); });
          }
        }
      });
    }

    function finish(opts) {
      if (finished) return;
      finished = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correctWords = perQuestion.filter(p => p.correct).length;
      // Bonus-family modes score per LETTER (+ the perfect-word multiplier),
      // so the "Score" total shown at game-complete is the letter count too
      // — the word count (`total`, used for nav) is a different, unrelated
      // number here. Submit mode scores 1 point per word, so total stays
      // word-based.
      let correct, finishTotal;
      if (isBonusFamily) {
        correct = state.reduce((sum, s) => sum + (s.points || 0), 0);
        finishTotal = items.reduce((sum, it) => sum + it.letters.length, 0);
      } else {
        correct = correctWords;
        finishTotal = total;
      }
      const review = items.map((it, i) => {
        const s = state[i];
        const started = s.placed.some(p => p != null);
        const partial = started ? s.placed.map(id => id != null ? it.letters[id] : "_").join("") : null;
        return {
          question: it.clue || "Unscramble the word",
          answered: doneCheck(s),
          yourText: s.correct === true ? it.word : partial,
          yourCorrect: s.correct === true,
          correctText: it.word,
          src: it.src
        };
      });
      const answered = state.filter(s => doneCheck(s)).length;
      ui.finish({
        // `correct` stays the genuine measure (words, or letters in bonus mode) so
        // the summary's small "Total: x/y" row can show it distinctly; `score` is
        // what ranking/leaderboard actually use — reflects points-off (no-op when
        // the option is off). Previously `correct` itself was decremented in place
        // and no separate `score` was sent, so ranking/summary matched `correct`
        // exactly and that secondary row could never appear even when a penalty
        // had been applied.
        correct, incorrect: total - correctWords, total: finishTotal, perQuestion, review, answered,
        score: correct - penalty,
        title: opts?.gameover ? "Game over" : undefined
      });
    }

    return function cleanup() {
      // Đợt 114 — MUST be first. This file schedules its whole end-of-word
      // sequence with untracked setTimeouts (up to 2.9s), so clearing autoTimer
      // alone was never enough: a later timer simply armed a new one.
      dead = true;
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      if (voiceIntroTimeoutId) clearTimeout(voiceIntroTimeoutId);
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
      if (voiceAudioEl) voiceAudioEl.pause();
      stopEqualizer();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(anagramTemplate);
export default anagramTemplate;
