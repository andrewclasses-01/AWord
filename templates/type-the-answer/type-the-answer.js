// =============================================================
// TEMPLATE: TYPE THE ANSWER — Wordwall style, English UI.
//  • One prompt at a time (same pagination model as Quiz): question near
//    the top, a text input + Submit button pushed to the lower area.
//  • Player types, presses Enter or taps Submit -> graded immediately
//    (single-shot, like Quiz). Matching ignores case/accents unless the
//    activity turns on options.strictCase / options.strictAccent, and
//    always trims + collapses whitespace. Any of options.acceptedAnswers
//    counts as correct.
//  • Wrong -> input border turns red (not the tile-recolour rule; an input
//    box isn't a "tile", a state-coloured field is normal form UX) + a
//    "Correct: ..." reveal line under it (options.showAnswerWhenWrong,
//    default true). The literal text the student typed is kept for
//    review (perQuestion doesn't carry it, but `review[].yourText` does).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";

function normalize(str, { strictCase, strictAccent } = {}) {
  let s = String(str ?? "").trim().replace(/\s+/g, " ");
  if (!strictAccent) s = s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
  if (!strictCase) s = s.toLowerCase();
  return s;
}

const ttaTemplate = {
  type: "type_the_answer",
  scorable: true,
  name: "Type the answer",

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length)
      .map(it => ({ clue: it.prompt, answer: it.acceptedAnswers[0] }));
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};

    let items = [...(activity.content?.items || [])]
      .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length);
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-tta-empty", "This activity has no questions yet."));
      return () => {};
    }

    const state = items.map(() => ({ typed: null, graded: false, correct: null }));
    let index = 0;
    let finished = false;
    let fitter = null;
    let autoTimer = null;

    ui.onSubmit(finish);
    render();

    function scoreNow() { return state.filter(s => s.correct === true).length; }

    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      const it = items[index];
      const st = state[index];

      const card = el("div", "aw-tta-card");
      card.append(el("div", "aw-tta-prompt", escapeHtml(it.prompt)));

      const area = el("div", "aw-tta-answer-area");
      const row = el("div", "aw-tta-row");
      const input = el("input", "aw-tta-input");
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = "Type your answer...";
      const submitBtn = el("button", "aw-tta-submit", "Submit");

      if (st.graded) {
        input.value = st.typed || "";
        input.disabled = true;
        submitBtn.disabled = true;
        input.classList.add(st.correct ? "is-correct" : "is-wrong");
        row.append(el("span", "aw-tile-badge", st.correct ? icons.markCheck : icons.markCross));
      } else {
        input.value = st.typed || "";
        input.addEventListener("keydown", e => { if (e.key === "Enter") submitAnswer(input.value); });
        submitBtn.onclick = () => submitAnswer(input.value);
      }
      row.prepend(input);
      row.append(submitBtn);
      area.append(row);

      if (st.graded && !st.correct && opt.showAnswerWhenWrong !== false) {
        area.append(el("div", "aw-tta-reveal", `Correct: <b>${escapeHtml(it.acceptedAnswers[0])}</b>`));
      }
      card.append(area);
      root.append(card);

      const promptEl = card.querySelector(".aw-tta-prompt");
      const areaEl = card.querySelector(".aw-tta-answer-area");
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.045,
        measure: () => promptEl.offsetHeight + areaEl.offsetHeight
      });

      ui.setScore(scoreNow());
      updateNav();
      if (!st.graded) input.focus();
    }

    function submitAnswer(typed) {
      const it = items[index];
      const st = state[index];
      if (st.graded || finished) return;
      st.typed = typed;
      st.graded = true;
      st.correct = it.acceptedAnswers.some(a =>
        normalize(a, opt) === normalize(typed, opt));

      if (st.correct) ui.sound.correct(); else ui.sound.wrong();
      render();

      const row = root.querySelector(".aw-tta-row");
      if (row) {
        const fly = el("span", "aw-mark-fly" + (st.correct ? "" : " is-cross"),
          st.correct ? icons.markCheck : icons.markCross);
        row.append(fly);
        setTimeout(() => fly.remove(), st.correct ? 900 : 2000);
      }

      if (state.every(s => s.graded)) {
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
        nextLabel: isLast ? icons.check : null
      });
    }

    function fadeSwap(change) {
      const card = root.querySelector(".aw-tta-card");
      if (!card) { change(); return; }
      let done = false;
      const run = () => { if (done) return; done = true; change(); };
      const anim = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" });
      anim.onfinish = run;
      setTimeout(run, 220);
    }
    function goPrev() { if (index > 0) fadeSwap(() => { index--; render(); }); }
    function goNext() { if (index < total - 1) fadeSwap(() => { index++; render(); }); }

    function finish() {
      if (finished) return;
      finished = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = items.map((it, i) => {
        const s = state[i];
        return {
          question: it.prompt,
          answered: s.graded,
          yourText: s.graded ? s.typed : null,
          yourCorrect: s.correct === true,
          correctText: it.acceptedAnswers[0]
        };
      });
      const answered = state.filter(s => s.graded).length;
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    return function cleanup() {
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ttaTemplate);
export default ttaTemplate;
