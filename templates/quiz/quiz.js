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
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
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

const quizTemplate = {
  type: "quiz",
  scorable: true,
  name: "Quiz",

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
    complete: quizSound.complete
  },

  // Extra Options: the central Points off group is engine-built; here we add
  // "Allow skip" (default OFF -> the student must answer before Next advances).
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Navigation"));
    const row = el("div", "aw-opt-row");
    row.append(mkCheck(draft.allowSkip === true, "Allow skip (move on without answering)",
      v => draft.allowSkip = v));
    g.append(row);
    panel.append(g);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pointsOff = Math.max(0, Math.min(5, Number(opt.pointsOff) || 0));  // deduct per wrong (0 = off)
    const allowSkip = opt.allowSkip === true;                                // move on without answering (default off)

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
        .filter(a => a && a.text != null)
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

      questionEl.textContent = q.question;

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
          tile.disabled = false;
        }
      });
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
      if (st.chosen !== null || finished) return;
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

      // Auto "Game complete" once EVERY question has been answered (no question
      // left). Wait a moment so the ✓/✗ feedback plays first.
      if (state.every(s => s.chosen !== null)) {
        autoTimer = setTimeout(finish, st.correct ? 1000 : 1500);
      }
    }

    function updateNav() {
      const isLast = index === total - 1;
      const may = canAdvance();   // gate Next/finish on the current answer unless Allow skip
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: isLast ? (may ? finish : null) : (may ? goNext : null),
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
    function goPrev() { if (!animating && index > 0) { clearAutoTimer(); showQuestion(index - 1, -1); } }
    function goNext() { if (!animating && canAdvance() && index < total - 1) { clearAutoTimer(); showQuestion(index + 1, 1); } }

    // Keyboard: number keys 1-9 answer the current question; ← → navigate.
    function onKey(e) {
      if (finished) return;
      if (e.key === "ArrowLeft") { goPrev(); return; }
      if (e.key === "ArrowRight") {
        if (!canAdvance()) return;   // same gate as the Next button
        (index === total - 1 ? finish : goNext)();
        return;
      }
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1 && n <= tiles.length) {
        const t = tiles[n - 1];
        if (t && !t.tile.disabled) t.tile.click();
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
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
          correctText: correctAns ? correctAns.text : ""
        };
      });
      const answered = state.filter(s => s.chosen !== null).length;
      const raw = { correct, incorrect: total - correct, total, perQuestion, review, answered };
      // With Points off on, rank + summary use the penalised score (may be negative).
      if (pointsOff) { const pts = scoreNow(); raw.score = pts; raw.scoreText = String(pts); }
      ui.finish(raw);
    }

    // cleanup: remove global listeners so nothing leaks after Start again / exit
    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(fitRaf);
      if (autoTimer) clearTimeout(autoTimer);
    };
  }
};

registerTemplate(quizTemplate);
export default quizTemplate;
