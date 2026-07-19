// =============================================================
// TEMPLATE: QUIZ — Wordwall style, English UI.  (REFERENCE TEMPLATE)
//  • Big question near the top edge; chunky 3D answer tiles.
//  • Text AUTO-SHRINKS to fit the 16:9 stage (long questions/answers never clip).
//  • Answer tiles adapt: 1 row for <=4 answers, 2 rows for 5-6.
//  • Tiles NEVER change color after answering. Feedback instead:
//      correct -> big white ✓ flies up + "ting" + small ✓ stays on the tile,
//                 other (wrong) tiles fade to 15%
//      wrong   -> big white ✗ rises and HOVERS ~1.9s + "Oh my god" sound,
//                 small ✗ stays on the chosen tile, all wrong tiles fade,
//                 the correct tile keeps its full color + small ✓
//  • Simple fade between questions; navigate with ◁ ▷ OR the number keys 1-9;
//    last question shows ✓ (finish).
//  • Menu "Submit answers" finishes at any time (unanswered = wrong).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { openQuizEditor } from "./quiz-editor.js";

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

  mount(root, activity, ui) {
    const opt = activity.options || {};

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
    let fitter = null;      // autoFit controller for the current card
    let autoTimer = null;   // pending "auto game complete" timer

    ui.onSubmit(finish);
    window.addEventListener("keydown", onKey);
    render();

    function scoreNow() { return state.filter(s => s.correct === true).length; }

    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      const q = questions[index];
      const st = state[index];
      const answered = st.chosen !== null;

      const card = el("div", "aw-quiz-card");
      card.append(el("div", "aw-quiz-question", escapeHtml(q.question)));

      const row = el("div", "aw-quiz-answers");
      // Answers-per-row (teacher's layout): 2->2, 3->3, 4->4, 5->3(+2), 6->3(+3),
      // 7->4(+3), 8->4(+4)... i.e. up to 4 in one row, otherwise two balanced rows
      // with the bigger row on top. A short last row is centered by the CSS.
      const n = q.answers.length;
      const perRow = n <= 4 ? n : Math.ceil(n / 2);
      row.style.setProperty("--per-row", perRow);

      // "Letters on answers" option (read live so a change in the Options panel
      // shows immediately — safe because it doesn't affect shuffle/scoring).
      const showLetters = opt.lettersOnAnswers === "abc";

      q.answers.forEach((ans, i) => {
        const tile = el("button", "aw-quiz-tile");
        const col = palette[i % palette.length];
        tile.style.setProperty("--tile", col.c);
        tile.style.setProperty("--tile-dark", col.d);
        if (showLetters) tile.append(el("span", "aw-quiz-letter", String.fromCharCode(65 + i)));
        tile.append(el("span", "aw-tile-text", escapeHtml(ans.text)));
        if (answered) {
          tile.disabled = true;
          addBadges(tile, ans, i, st);
        } else {
          tile.onclick = () => choose(tile, i);
        }
        row.append(tile);
      });
      card.append(row);
      root.append(card);

      // auto-shrink the whole card so nothing clips inside the 16:9 stage.
      // measure = question height + answers block height (the card is stretched
      // to 100%, so scrollHeight can't tell us the true content height).
      // slack:12 leaves room for the tiles' 6px 3D shadow lip (+gap).
      const questionEl = card.querySelector(".aw-quiz-question");
      const answersEl = card.querySelector(".aw-quiz-answers");
      // slack scales with the stage: card padding-bottom (3.2cqw) + 3D shadow lip.
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.045,
        measure: () => questionEl.offsetHeight + answersEl.offsetHeight
      });

      ui.setScore(scoreNow());
      updateNav();
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

    function choose(tile, i) {
      const q = questions[index];
      const st = state[index];
      if (st.chosen !== null || finished) return;
      st.chosen = i;
      st.correct = !!q.answers[i].correct;

      // feedback WITHOUT re-render, so the fly-up animation plays
      const row = tile.parentElement;
      [...row.children].forEach(t => (t.disabled = true));

      const fly = el("span",
        "aw-mark-fly" + (st.correct ? "" : " is-cross"),
        st.correct ? icons.markCheck : icons.markCross);
      tile.append(fly);
      setTimeout(() => fly.remove(), st.correct ? 900 : 2000);

      [...row.children].forEach((t, k) => addBadges(t, q.answers[k], k, st));

      if (st.correct) ui.sound.correct(); else ui.sound.wrong();
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
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: isLast ? finish : goNext,
        nextLabel: isLast ? icons.check : null   // last question: arrow becomes ✓ (finish)
      });
    }

    // simple fade between questions, with a timeout fallback so a hidden/
    // backgrounded tab (where animation callbacks can stall) still advances.
    function fadeSwap(change) {
      const card = root.querySelector(".aw-quiz-card");
      if (!card) { change(); return; }
      let done = false;
      const run = () => { if (done) return; done = true; change(); };
      const anim = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" });
      anim.onfinish = run;
      setTimeout(run, 220);
    }
    function goPrev() { if (index > 0) fadeSwap(() => { index--; render(); }); }
    function goNext() { if (index < total - 1) fadeSwap(() => { index++; render(); }); }

    // Keyboard: number keys 1-9 answer the current question; ← → navigate.
    function onKey(e) {
      if (finished) return;
      if (e.key === "ArrowLeft") { goPrev(); return; }
      if (e.key === "ArrowRight") {
        (index === total - 1 ? finish : goNext)();
        return;
      }
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1) {
        const tiles = root.querySelectorAll(".aw-quiz-tile");
        const tile = tiles[n - 1];
        if (tile && !tile.disabled) tile.click();
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
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    // cleanup: remove global listeners so nothing leaks after Start again / exit
    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(quizTemplate);
export default quizTemplate;
