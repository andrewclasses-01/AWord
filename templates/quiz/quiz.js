// =============================================================
// TEMPLATE: QUIZ — Wordwall style, English UI.  (REFERENCE TEMPLATE)
//  • Big question near the top edge; chunky 3D answer tiles.
//  • Text AUTO-SHRINKS to fit the 16:9 stage (long questions/answers never clip):
//      - card-level HEIGHT fit shrinks everything so the answers never overlap
//        the question (long multi-word answers just make the tiles TALLER first);
//      - per-tile WIDTH fit shrinks ONE tile's font when a single long word would
//        be too wide — a single word is NEVER broken across two lines.
//  • Answer tiles adapt: 1 row for <=4 answers, 2 rows for 5-6.
//  • Tiles NEVER change color after answering. Feedback instead:
//      correct -> big white ✓ flies up + "ting" + small ✓ stays on the tile,
//                 other (wrong) tiles fade to 15%
//      wrong   -> big white ✗ rises and HOVERS ~1.9s + "Oh my god" sound,
//                 small ✗ stays on the chosen tile, all wrong tiles fade,
//                 the correct tile keeps its full color + small ✓
//  • NAVIGATION is IN-PLACE (build once, update content): moving to another
//    question SLIDES the question text sideways while the answer tiles STAY PUT
//    (same boxes, same colours) and only the TEXT inside them cross-fades to the
//    new answers — no flicker, no rebuild. Navigate with ◁ ▷ OR number keys 1-9;
//    last question shows ✓ (finish).
//  • Menu "Submit answers" finishes at any time (unanswered = wrong).
//  • LIVES (Options, slider 0..10, 0 = Unlimited — the default, so every quiz
//    made before this feature plays exactly as it always did): a WRONG answer
//    costs a heart (shown in the top bar via ui.livesSlot, left of the score);
//    reaching 0 ends the game right away with "Game over", even when questions
//    are left. Same control + rendering as True/false and Type the answer.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { openQuizEditor } from "./quiz-editor.js";
import { quizSound } from "./quiz-sound.js";

// Modern answer-tile palette (8 well-separated colors), each with a darker
// shade for the 3D shadow lip. Per GAME START we shuffle this and assign a
// distinct color to each answer position (1..N); every question in the game
// keeps those colors, and Start again reshuffles for a fresh look.
const PALETTE = [
  { c: "#3b82f6", d: "#2563eb" }, // blue
  { c: "#06b6d4", d: "#0e93ad" }, // cyan
  { c: "#10b981", d: "#059669" }, // emerald
  { c: "#f59e0b", d: "#d97706" }, // amber
  { c: "#f97316", d: "#ea580c" }, // orange
  { c: "#ef4444", d: "#dc2626" }, // red
  { c: "#14b8a6", d: "#0f9488" }, // teal (replaces pink)
  { c: "#8b5cf6", d: "#7c3aed" }  // violet
];

const MAX_LIVES = 10;
// Lives are opt-in (4/8/2026): 0, null or undefined -> unlimited. Every quiz
// saved before this feature has no `lives` field at all, so undefined MUST mean
// unlimited (not a default life count) — otherwise old content would suddenly
// end in a Game Over nobody asked for. Same rule as Type the answer / Anagram.
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}

const quizTemplate = {
  type: "quiz",
  scorable: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "questions",
  name: "Quiz",
  hasLivesSlot: true,      // hearts render in the top bar, left of the score (same slot as True/false)
  // FIGHT MODE (12/8/2026, trial second template after Anagram) — see the
  // `_fight` branches in mount() below and core/fight.js's header comment for
  // the contract. Quiz's own scoring already goes through ui.setScore(), which
  // the engine forwards to the match scoreboard on its own — so unlike Anagram
  // (which flies its "+N" to a spot it has to ask fight.ctl.scoreTarget() for),
  // Quiz needed no scoring plumbing of its own, only round/lock bookkeeping.
  fightMode: true,

  // Content editor for this game (opened by the home page and the in-game Edit
  // button). Each template supplies its own editor the same way.
  edit: openQuizEditor,

  // Normalise this game's content for the shared Print system (core/print.js):
  // each question -> { clue, answer, options }. Print then renders whichever
  // paper FORMAT the teacher picks (Anagram / Quiz / ...).
  toPrintItems(activity) {
    return (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.length > 0)
      .map(q => ({
        clue: q.question || "",
        answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
      }));
  },

  // Engine-level lifecycle sounds (Play pressed / Start again / 5s-left /
  // Game complete) — OPTIONAL per-template override, see core/engine.js.
  // Undefined for any other template = its default synthesized tone plays
  // unchanged, so this touches Quiz only.
  sounds: {
    play: quizSound.play,
    restart: quizSound.restart,
    timeWarning: quizSound.timeWarning,
    // Silenced here on purpose: quiz.js's own finish() picks ONE end sound —
    // the success fanfare, or the "timeout" cue when the player ran out of
    // lives (a fanfare over GAME OVER would be plain wrong). Same pattern as
    // Find the match / True or false.
    complete: () => {}
  },

  // Extra Options: the central Points off group is engine-built; here we add
  // "Allow skip" (default OFF -> the student must answer before Next advances)
  // and "Lives" (0..10, 0 = Unlimited).
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Navigation"));
    const row = el("div", "aw-opt-row");
    row.append(mkCheck(draft.allowSkip === true, "Allow skip (move on without answering)",
      v => draft.allowSkip = v));
    g.append(row);
    panel.append(g);

    // LIVES — a slider 0..10 (0 = Unlimited), teacher's spec 4/8/2026. A wrong
    // answer costs a heart; hitting 0 ends the game right away. Same control and
    // rendering pattern as True/false and Type the answer.
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-quiz-livesrow");
    const curLives = Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(0, draft.lives)) : 0;
    const livesVal = el("span", "aw-quiz-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-quiz-livesslider");
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
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pointsOff = Math.max(0, Math.min(5, Number(opt.pointsOff) || 0));  // deduct per wrong (0 = off)
    const allowSkip = opt.allowSkip === true;                                // move on without answering (default off)

    // ----- FIGHT MODE (12/8/2026, trial) — this play is one of two boards
    // racing. `_fight` is put here by core/fight.js; everything below falls
    // back to ordinary single-board behaviour when it is absent. See
    // anagram.js's own `_fight` branches for the fuller pattern this mirrors.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;   // set by the match controller between rounds
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));

    // one random colour set for this whole play (reshuffled on Start again)
    const palette = shuffle(PALETTE);

    // Prepare questions (shuffle once so back/forward stays stable).
    // Guard against missing/empty data so a malformed activity never crashes.
    let questions = [...(activity.content?.questions || [])]
      .filter(q => q && Array.isArray(q.answers) && q.answers.length > 0);
    if (opt.shuffleQuestions) questions = shuffle(questions);
    questions = questions.map(q => ({
      question: q.question || "",
      answers: (opt.shuffleAnswers ? shuffle(q.answers) : [...q.answers])
        .filter(a => a && a.text != null),
      src: q   // the ORIGINAL content object — "Start with mistakes" filters by it
    }));

    const total = questions.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-quiz-empty", "This quiz has no questions yet."));
      return () => {};
    }

    // Per-question state: chosen = tile index clicked (null = not yet), correct = true/false
    const state = questions.map(() => ({ chosen: null, correct: null }));
    let index = 0;
    let finished = false;
    let autoTimer = null;   // pending "auto game complete" timer
    let livesLeft = normLives(opt.lives);   // null = unlimited (see normLives)
    let ending = false;     // out of lives: the game is on its way out, ignore any further input
    let heartTimer = null;  // fallback timer for the "heart pops out" animation

    // Pronunciation playback (10/8/2026) — optional per-question, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `q.src` is the ORIGINAL content object (see the `questions` map
    // above), so `.voice`/`.hideText` live at `q.src.voice`/`q.src.hideText`.
    const voicePlayer = createVoicePlayer();
    let firstQuestionSpoken = false;

    // ----- Build the card & tiles ONCE; navigation updates them in place -----
    root.innerHTML = "";
    const card = el("div", "aw-quiz-card");
    const questionEl = el("div", "aw-quiz-question");
    const answersRow = el("div", "aw-quiz-answers");
    card.append(questionEl, answersRow);
    root.append(card);

    // tiles[] holds a persistent { tile, textEl, letterEl } per answer slot.
    // We reuse these boxes across questions (only their text/state changes), so
    // the tiles never flicker or move when the question changes.
    let tiles = [];

    ui.onSubmit(finish, () => state.filter(s => s.chosen !== null).length);   // block "Submit answers" at 0 answered
    window.addEventListener("keydown", onKey);

    applyQuestion(0);   // first question, no animation
    ui.setScore(scoreNow());
    updateNav();
    renderLives();

    // Fit now, once fonts are ready, and on every resize.
    fitNow();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNow).catch(() => {});
    let fitRaf = 0;
    const onResize = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitNow); };
    window.addEventListener("resize", onResize);

    // Live score = correct answers, minus `pointsOff` per WRONG answer. With the
    // feature off (pointsOff 0) this is byte-identical to the old correct-count.
    // May go negative — the engine shows a negative score in red with no minus.
    function scoreNow() {
      const correct = state.filter(s => s.correct === true).length;
      if (!pointsOff) return correct;
      const wrong = state.filter(s => s.chosen !== null && s.correct === false).length;
      return correct - pointsOff * wrong;
    }
    // Next is blocked until the current question is answered, unless Allow skip is on.
    function canAdvance() { return allowSkip || state[index].chosen !== null; }

    // Make sure answersRow has exactly `n` tile boxes (create/remove as needed).
    // Colours are assigned by POSITION and never change, so a box keeps its
    // colour for the whole game (Start again reshuffles). Only ever grows/shrinks
    // when a converted quiz has questions with different answer counts.
    function syncTiles(n) {
      while (tiles.length < n) {
        const i = tiles.length;
        const tile = el("button", "aw-quiz-tile");
        const col = palette[i % palette.length];
        tile.style.setProperty("--tile", col.c);
        tile.style.setProperty("--tile-dark", col.d);
        const letterEl = el("span", "aw-quiz-letter");
        const textEl = el("span", "aw-tile-text");
        tile.append(letterEl, textEl);
        tile.onclick = () => choose(i);
        answersRow.append(tile);
        tiles.push({ tile, textEl, letterEl });
      }
      while (tiles.length > n) {
        const t = tiles.pop();
        t.tile.remove();
      }
    }

    // Put question `i`'s content into the (persistent) card + tiles.
    function applyQuestion(i) {
      const q = questions[i];
      const st = state[i];
      const answered = st.chosen !== null;
      const nAns = q.answers.length;

      voicePlayer.stop();   // silence the PREVIOUS question's clip, if any
      questionEl.className = "aw-quiz-question";
      const vv = voiceView(activity, q.src);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      if (hideText) {
        questionEl.textContent = "";
        questionEl.classList.add("aw-clue-voiceonly");
      } else {
        questionEl.textContent = q.question;
      }
      if (hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        vBtn.onclick = e => { e.stopPropagation(); voicePlayer.toggle(q.src.voice, vBtn); };
        questionEl.append(vBtn);
        // FIGHT MODE: both boards show the same question, so only board 0
        // speaks — two copies of the same clip a few ms apart is an echo, not
        // a reading (same rule as anagram.js).
        if (vv.autoPlay && (!fightCtl || fightCtl.speaks(fightSide))) {
          voicePlayer.playDelayed(q.src.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
        }
      }
      firstQuestionSpoken = true;

      // Answers-per-row: 2->2, 3->3, 4->4, 5->3(+2), 6->3(+3)... (max 4 per row,
      // otherwise two balanced rows with the bigger row on top). CSS centers a
      // short last row.
      answersRow.style.setProperty("--per-row", nAns <= 4 ? nAns : Math.ceil(nAns / 2));

      syncTiles(nAns);
      const showLetters = opt.lettersOnAnswers === "abc";   // read live (safe: doesn't affect scoring)

      q.answers.forEach((ans, k) => {
        const { tile, textEl, letterEl } = tiles[k];
        // wipe any per-question marks/animation from a previous question
        tile.querySelectorAll(".aw-tile-badge, .aw-mark-fly").forEach(n => n.remove());
        tile.classList.remove("is-dimmed");
        tile.style.removeProperty("--tw");   // reset per-tile width fit
        textEl.textContent = ans.text;
        letterEl.textContent = showLetters ? String.fromCharCode(65 + k) : "";
        letterEl.style.display = showLetters ? "" : "none";
        if (answered) {
          tile.disabled = true;
          addBadges(tile, ans, k, st);
        } else {
          // FIGHT MODE: the other team already took this question (or the
          // match is over) — tiles go visibly dead rather than silently
          // ignoring taps, so the class can SEE the round is decided.
          tile.disabled = fightLocked();
        }
      });
    }

    // Toggle just the disabled state of this question's not-yet-answered
    // tiles, without rebuilding anything — used by the fight controller's
    // lock(on) so a round-lock never replays this question's voice clip
    // (a full applyQuestion() call would, since it always restarts playback).
    function syncFightLock() {
      if (state[index].chosen !== null) return;   // already answered -> stays disabled regardless
      const locked = fightLocked();
      tiles.forEach(t => { t.tile.disabled = locked; });
    }

    // HEIGHT fit (whole card) + per-tile WIDTH fit (never break a single word).
    function fitNow() {
      // reset scales
      card.style.setProperty("--fit", 1);
      tiles.forEach(t => t.textEl.style.removeProperty("--tw"));

      // 1) HEIGHT fit: shrink --fit until question + answers fit the stage height.
      //    slack scales with the stage (card padding-bottom + 3D shadow lip).
      const slack = root.clientWidth * 0.045;
      const measure = () => questionEl.offsetHeight + answersRow.offsetHeight;
      const overH = () => measure() > root.clientHeight - slack;
      if (overH()) {
        let lo = 0.4, hi = 1, best = 0.4;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          card.style.setProperty("--fit", mid);
          if (overH()) hi = mid; else { best = mid; lo = mid; }
        }
        card.style.setProperty("--fit", best);
      }

      // 2) WIDTH fit per tile: if a tile's widest word overflows its box, shrink
      //    just THAT tile's text (via --tw) so it fits — a single word is NEVER
      //    broken across two lines. scrollWidth (measured at --tw:1) is the widest
      //    unbreakable line, so avail/need gives the exact scale in one shot (a
      //    0.2 floor keeps even a pathological 40+ char word from spilling out).
      //    Multi-word answers that wrap cleanly at spaces don't overflow -> left
      //    alone (their box simply grew taller in step 1).
      tiles.forEach(({ textEl }) => {
        const avail = textEl.clientWidth;
        const need = textEl.scrollWidth;
        if (need > avail + 0.5) {
          const s = Math.max(0.2, (avail / need) * 0.99);
          textEl.style.setProperty("--tw", s.toFixed(3));
        }
      });
    }

    // Small persistent marks after answering + dim every WRONG tile
    // (the correct tile always keeps its color)
    function addBadges(tile, ans, i, st) {
      if (ans.correct) tile.append(el("span", "aw-tile-badge", icons.markCheck));
      else {
        if (i === st.chosen) tile.append(el("span", "aw-tile-badge", icons.markCross));
        tile.classList.add("is-dimmed");
      }
    }

    function choose(i) {
      const q = questions[index];
      const st = state[index];
      if (st.chosen !== null || finished || ending || fightLocked()) return;
      st.chosen = i;
      st.correct = !!q.answers[i].correct;

      tiles.forEach(t => (t.tile.disabled = true));

      // feedback: big ✓/✗ flies up from the chosen tile
      const chosenTile = tiles[i].tile;
      const fly = el("span",
        "aw-mark-fly" + (st.correct ? "" : " is-cross"),
        st.correct ? icons.markCheck : icons.markCross);
      chosenTile.append(fly);
      setTimeout(() => fly.remove(), st.correct ? 900 : 2000);

      // small persistent ✓/✗ + dim wrong tiles
      tiles.forEach((t, k) => addBadges(t.tile, q.answers[k], k, st));

      if (st.correct) quizSound.correct(); else quizSound.wrong();
      ui.setScore(scoreNow());
      updateNav();

      // FIGHT MODE: tell the match this board just answered the round's
      // question — right or wrong, a tap resolves the question with no
      // retry, same as Anagram's bonus-mode letters. The controller decides
      // who scores the round and when both boards move on.
      if (fightCtl) fightCtl.wordDone(fightSide, { index });

      // A wrong answer costs a heart when Lives are on. Running out ends the
      // game right away ("Game over"), even with questions still unanswered —
      // and `ending` locks the tiles + nav for the short wait so nothing can be
      // clicked while the game is on its way out.
      const outOfLives = st.correct ? false : loseLife();
      if (outOfLives) {
        ending = true;
        tiles.forEach(t => (t.tile.disabled = true));
        updateNav();          // grey the arrows out too — `ending` already blocks their handlers,
                              // but a live-looking Next during the last 1.5s is just confusing
        clearAutoTimer();
        autoTimer = setTimeout(() => finish("gameover"), 1500);
        return;
      }

      // Auto "Game complete" once EVERY question has been answered (no question
      // left). Wait a moment so the ✓/✗ feedback plays first. FIGHT MODE skips
      // this: the match controller ends the whole match itself once every
      // round has been played (advanceRound()/endMatch() in core/fight.js) —
      // a board calling finish() here too would race it (same reasoning as
      // Anagram's finalizeBonusWord()).
      if (!fightCtl && state.every(s => s.chosen !== null)) {
        autoTimer = setTimeout(() => finish("complete"), st.correct ? 1000 : 1500);
      }
    }

    // ===== LIVES (opt-in via Options; ui.livesSlot is a span left of the score,
    // reserved by tpl.hasLivesSlot) — same rendering pattern as True/false. =====
    // 1..5 lives show that many separate hearts; 6..10 show a compact "N♥";
    // unlimited shows nothing at all.
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                 // unlimited -> no hearts shown
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }

    // Costs one life; pops the LEFTMOST heart out (when hearts are shown
    // individually) then re-renders. Returns true if that was the last life.
    // The pop uses .animate() WITH a setTimeout fallback (core rule: onfinish
    // may never fire in a hidden tab).
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
        heartTimer = setTimeout(finishPop, 360);
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    function updateNav() {
      const isLast = index === total - 1;
      const may = canAdvance() && !ending;   // gate Next/finish on the current answer unless Allow skip
      ui.setNav({
        index: index + 1,
        total,
        onPrev: (index > 0 && !ending) ? goPrev : null,
        // wrapped, NOT `finish` itself: engine wires the button as
        // `btn.onclick = handler`, so a bare `finish` would be handed the click
        // event as its `reason` argument.
        onNext: isLast ? (may ? () => finish("complete") : null) : (may ? goNext : null),
        nextLabel: isLast ? icons.check : null   // last question: arrow becomes ✓ (finish)
      });
    }

    // Move to question `i` with a SLIDE for the question text and a text-only
    // FADE inside the answer tiles (the tiles themselves never move or rebuild).
    // dir: +1 = next (slide left), -1 = prev (slide right). A timeout fallback
    // still advances a backgrounded/hidden tab where animation events can stall.
    let animating = false;
    function showQuestion(i, dir) {
      if (i === index) return;
      const outX = dir >= 0 ? -6 : 6;
      const inX = dir >= 0 ? 6 : -6;
      animating = true;

      const outAnims = [];
      outAnims.push(questionEl.animate(
        [{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${outX}%)`, opacity: 0 }],
        { duration: 130, easing: "ease", fill: "forwards" }));
      tiles.forEach(t => outAnims.push(t.textEl.animate(
        [{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: "ease", fill: "forwards" })));

      let swapped = false;
      const doSwap = () => {
        if (swapped) return;
        swapped = true;
        outAnims.forEach(a => { try { a.cancel(); } catch (_) {} });   // drop the "forwards" hold
        index = i;
        applyQuestion(i);
        fitNow();
        updateNav();
        // FIGHT MODE: the teacher pressed ‹ › on THIS board — tell the match so
        // the other board follows (see jumpTo()/ctl.attach below for the other
        // direction: the controller moving a board that didn't initiate).
        if (fightCtl) fightCtl.boardMoved(fightSide, i);
        const inA = questionEl.animate(
          [{ transform: `translateX(${inX}%)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
          { duration: 190, easing: "ease", fill: "forwards" });
        const tileIns = tiles.map(t => t.textEl.animate(
          [{ opacity: 0 }, { opacity: 1 }], { duration: 190, easing: "ease", fill: "forwards" }));
        inA.onfinish = () => {
          try { inA.cancel(); } catch (_) {}
          tileIns.forEach(a => { try { a.cancel(); } catch (_) {} });
          animating = false;
        };
        setTimeout(() => { animating = false; }, 240);
      };
      outAnims[0].onfinish = doSwap;
      setTimeout(doSwap, 190);
    }

    // Manually navigating (prev/next) CANCELS a pending auto-finish: if the
    // teacher answered the last question and then went back to review, the game
    // must NOT auto-end under them (same fix as Type-the-answer, Đợt 56). The
    // auto-finish still fires when they answer everything and simply stop.
    function clearAutoTimer() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }
    function goPrev() { if (!animating && !ending && index > 0) { clearAutoTimer(); showQuestion(index - 1, -1); } }
    function goNext() { if (!animating && !ending && canAdvance() && index < total - 1) { clearAutoTimer(); showQuestion(index + 1, 1); } }

    // FIGHT MODE: the match controller moving THIS board because the OTHER
    // one navigated — a hard cut, not the slide (no `dir` to animate towards,
    // and a round change outranks whatever slide might already be running).
    function jumpTo(i) {
      const target = Math.max(0, Math.min(total - 1, i | 0));
      if (target === index) return;
      animating = false;
      clearAutoTimer();
      index = target;
      applyQuestion(target);
      fitNow();
      updateNav();
    }

    // ----- FIGHT MODE: the match controller drives both boards through this -----
    // Registered after the functions above exist so the controller can move
    // this board the moment it attaches (board 1 mounts later than board 0 and
    // would otherwise sit on question 1 while the match is already on 3).
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex: jumpTo,
        lock(on) {
          fightBoardLock = !!on;
          syncFightLock();
        }
      });
    }

    // Keyboard: number keys 1-9 answer the current question; ← → navigate.
    function onKey(e) {
      if (finished || ending) return;
      if (e.key === "ArrowLeft") { goPrev(); return; }
      if (e.key === "ArrowRight") {
        if (!canAdvance()) return;   // same gate as the Next button
        (index === total - 1 ? () => finish("complete") : goNext)();
        return;
      }
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1 && n <= tiles.length) {
        const t = tiles[n - 1];
        if (t && !t.tile.disabled) t.tile.click();
      }
    }

    // `reason` is "complete" (everything answered / Submit answers / the ✓ button)
    // or "gameover" (ran out of lives). It picks the end SOUND and the title on
    // the celebration screen; everything else is identical.
    function finish(reason = "complete") {
      if (finished) return;
      finished = true;
      clearAutoTimer();
      if (reason === "gameover") quizSound.gameOver(); else quizSound.complete();
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      // per-question detail for the "Show answers" review screen
      const review = questions.map((q, i) => {
        const s = state[i];
        const correctAns = q.answers.find(a => a.correct);
        return {
          question: q.question,
          answered: s.chosen !== null,
          yourText: s.chosen !== null ? q.answers[s.chosen].text : null,
          yourCorrect: s.correct === true,
          correctText: correctAns ? correctAns.text : "",
          src: q.src
        };
      });
      const answered = state.filter(s => s.chosen !== null).length;
      const raw = { correct, incorrect: total - correct, total, perQuestion, review, answered };
      // With Points off on, rank + summary use the penalised score (may be negative).
      // NO scoreText: that field means "my points are on a scale of their own"
      // (Gameshow) and makes the summary print the number ALONE. Quiz's points
      // are still out of `total`, and since 7/8/2026 the summary shows
      // `result.score`/total by itself — so passing scoreText here would turn
      // the teacher's "4/10" back into a bare "4".
      if (pointsOff) raw.score = scoreNow();
      // Out of lives -> the celebration screen reads "Game over" instead of
      // "Game complete" (engine reads raw.title; undefined = default).
      if (reason === "gameover") raw.title = "Game over";
      ui.finish(raw);
    }

    // cleanup: remove global listeners so nothing leaks after Start again / exit
    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(fitRaf);
      if (autoTimer) clearTimeout(autoTimer);
      if (heartTimer) clearTimeout(heartTimer);
      voicePlayer.stop();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";   // hearts must not survive into the next game
    };
  }
};

registerTemplate(quizTemplate);
export default quizTemplate;
