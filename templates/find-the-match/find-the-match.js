// =============================================================
// TEMPLATE: FIND THE MATCH — Wordwall style, English UI.
//  • Unlike Quiz/Anagram this is NOT paginated 1-item-at-a-time: the whole
//    board stays on screen. One KEYWORD prompt on top; a grid of ALL
//    remaining DEFINITIONS below (correct one + every other pair's
//    definition as noise). Tap the matching tile -> it fades out and is
//    removed, the prompt swaps to the next unsolved pair.
//  • Wrong tap -> tile shakes (never changes colour), optional LIVES
//    (options.lives) drain; hitting 0 ends the game early.
//  • Score = number of pairs matched by the end (mistakes along the way
//    don't un-count a later successful match — this is a search game, not
//    a single-shot quiz). ui.finish()/review follow the same shape as
//    every other template so Show answers / Game complete work unchanged.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";

const ftmTemplate = {
  type: "find_the_match",
  scorable: true,
  name: "Find the match",

  toPrintItems(activity) {
    return (activity.content?.pairs || [])
      .filter(p => p && p.keyword && p.definition)
      .map(p => ({ clue: p.definition, answer: p.keyword }));
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};

    const pairs = [...(activity.content?.pairs || [])].filter(p => p && p.keyword && p.definition);
    const total = pairs.length;
    if (total < 2) {
      root.innerHTML = "";
      root.append(el("div", "aw-ftm-empty", "This activity needs at least 2 pairs."));
      return () => {};
    }

    // `order` = the sequence in which prompts are presented (one per pair).
    // `choiceOrder` = the fixed display order of the definition tiles.
    let order = pairs.map((_, i) => i);
    if (opt.shuffleQuestions) order = shuffle(order);
    const choiceOrder = shuffle(pairs.map((_, i) => i));

    const state = pairs.map(() => ({ solved: false }));
    let pos = 0;           // index into `order` -> which pair is the current prompt
    let finished = false;
    let livesLeft = typeof opt.lives === "number" ? opt.lives : null;
    let fitter = null;
    let autoTimer = null;
    const pendingRemovals = [];

    ui.onSubmit(finish);
    window.addEventListener("keydown", onKey);
    render();

    function scoreNow() { return state.filter(s => s.solved).length; }
    function currentIdx() { return order[pos]; }

    function render() {
      root.innerHTML = "";
      const card = el("div", "aw-ftm-card");

      if (livesLeft != null) {
        const lives = el("div", "aw-ftm-lives");
        for (let i = 0; i < opt.lives; i++) {
          lives.append(el("span", i < livesLeft ? "" : "is-lost", "&#9829;"));
        }
        card.append(lives);
      }

      card.append(el("div", "aw-ftm-prompt", pos < total ? escapeHtml(pairs[currentIdx()].keyword) : ""));

      const grid = el("div", "aw-ftm-grid");
      choiceOrder.forEach(idx => {
        if (state[idx].solved) return;
        const tile = el("button", "aw-ftm-tile", escapeHtml(pairs[idx].definition));
        tile.onclick = () => choose(idx, tile);
        grid.append(tile);
      });
      card.append(grid);
      root.append(card);

      const promptEl = card.querySelector(".aw-ftm-prompt");
      const gridEl = card.querySelector(".aw-ftm-grid");
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.03,
        measure: () => promptEl.offsetHeight + gridEl.scrollHeight
      });

      ui.setScore(scoreNow());
      updateNav();
    }

    function choose(idx, tile) {
      if (finished || pos >= total) return;
      const target = currentIdx();
      if (idx === target) {
        state[target].solved = true;
        ui.sound.correct();
        const fly = el("span", "aw-mark-fly", icons.markCheck);
        tile.append(fly);
        setTimeout(() => fly.remove(), 900);
        tile.classList.add("is-solved");
        tile.disabled = true;
        pendingRemovals.push(setTimeout(() => tile.remove(), 320));

        pos++;
        const promptEl = root.querySelector(".aw-ftm-prompt");
        if (promptEl) promptEl.textContent = pos < total ? pairs[currentIdx()].keyword : "";
        if (fitter) fitter.refit();
        ui.setScore(scoreNow());
        updateNav();

        if (pos >= total) autoTimer = setTimeout(finish, 900);
      } else {
        ui.sound.wrong();
        tile.classList.remove("is-shake");
        void tile.offsetWidth; // restart the shake animation if tapped again quickly
        tile.classList.add("is-shake");
        if (livesLeft != null) {
          livesLeft--;
          const livesEl = root.querySelector(".aw-ftm-lives");
          if (livesEl) [...livesEl.children].forEach((s, i) => s.classList.toggle("is-lost", i >= livesLeft));
          if (livesLeft <= 0) autoTimer = setTimeout(finish, 600);
        }
      }
    }

    function updateNav() {
      ui.setNav({ index: scoreNow(), total, onPrev: null, onNext: null });
    }

    function onKey(e) {
      if (finished) return;
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1) {
        const tiles = [...root.querySelectorAll(".aw-ftm-tile")].filter(t => !t.disabled);
        const tile = tiles[n - 1];
        if (tile) tile.click();
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      const perQuestion = order.map((idx, i) => ({ q: i, correct: state[idx].solved === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = order.map(idx => {
        const p = pairs[idx];
        const s = state[idx];
        return {
          question: p.keyword,
          answered: s.solved,
          yourText: s.solved ? p.definition : null,
          yourCorrect: s.solved,
          correctText: p.definition
        };
      });
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered: correct });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      pendingRemovals.forEach(clearTimeout);
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ftmTemplate);
export default ftmTemplate;
