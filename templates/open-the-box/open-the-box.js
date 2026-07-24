// =============================================================
// TEMPLATE: OPEN THE BOX — Wordwall style, English UI.
//  • OPEN-ENDED template (scorable:false): a grid of numbered boxes that
//    flip open to reveal their content. Used for live-class activities
//    (drawing a random speaking prompt, quick review) — there is NO score,
//    NO timer, NO leaderboard and this template NEVER calls ui.finish().
//    That's deliberate, not missing: core/engine.js only knows how to end
//    a play through ui.finish() -> celebration -> Game complete/leaderboard
//    panel, which makes no sense for an activity with no "finish" concept
//    (see GHI CHU OPEN-THE-BOX.md warning). Not registering ui.onSubmit()
//    makes the menu's "Submit answers" item a harmless no-op
//    (`submitHandler?.()` in core/engine.js). options.timer is "none" in
//    the sample data so the engine never even starts its clock.
//  • Two content modes: "simple" (just a prompt) or "questions" (a
//    question + optional answer list, correct ones marked with ✓).
//  • options.boxesAutoClose: true -> opening a box closes any other open
//    box (only one open at a time). false/undefined (default) -> boxes
//    stay open independently until tapped again.
//  • The live score/nav readouts are repurposed as a simple "boxes opened"
//    progress counter (engine has no dedicated UI for open-ended games).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";

const otbTemplate = {
  type: "open_the_box",
  scorable: false,
  name: "Open the box",

  toPrintItems(activity) {
    const c = activity.content || {};
    if (c.mode === "questions") {
      return (c.items || [])
        .filter(it => it && it.question)
        .map(it => ({
          clue: it.question,
          answer: (it.answers || []).find(a => a.correct)?.text || (it.answers || [])[0]?.text || ""
        }));
    }
    return (c.items || [])
      .filter(it => it && it.text)
      .map(it => ({ clue: "", answer: it.text }));
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = activity.content?.mode === "questions" ? "questions" : "simple";

    let items = [...(activity.content?.items || [])]
      .filter(it => it && (mode === "questions" ? it.question : it.text));
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-otb-empty", "This activity has no boxes yet."));
      return () => {};
    }

    const openNow = items.map(() => false);   // currently flipped open
    const everOpened = new Set();

    render();

    function render() {
      root.innerHTML = "";
      const card = el("div", "aw-otb-card");
      const grid = el("div", "aw-otb-grid");
      if (typeof opt.columns === "number" && opt.columns > 0) {
        grid.style.setProperty("--cols", opt.columns);
      }

      items.forEach((it, i) => {
        const box = el("button", "aw-otb-box" + (openNow[i] ? " is-open" : ""));
        box.type = "button";
        const inner = el("div", "aw-otb-box-inner");

        const front = el("div", "aw-otb-face aw-otb-face-front", String(i + 1));
        const back = el("div", "aw-otb-face aw-otb-face-back");
        if (mode === "questions") {
          back.append(el("div", "aw-otb-back-q", escapeHtml(it.question)));
          (it.answers || []).forEach(a => {
            back.append(el("div", "aw-otb-back-a" + (a.correct ? " is-correct" : ""),
              (a.correct ? "&#10003; " : "") + escapeHtml(a.text)));
          });
        } else {
          back.append(el("div", "", escapeHtml(it.text)));
        }

        inner.append(front, back);
        box.append(inner);
        box.onclick = () => toggle(i);
        grid.append(box);
      });

      card.append(grid);
      root.append(card);
      updateProgress();
    }

    function toggle(i) {
      if (opt.boxesAutoClose) {
        openNow.forEach((v, k) => { if (k !== i) openNow[k] = false; });
      }
      openNow[i] = !openNow[i];
      if (openNow[i]) everOpened.add(i);
      const box = root.querySelectorAll(".aw-otb-box")[i];
      if (opt.boxesAutoClose) {
        // other boxes may have just closed too -> simplest correct redraw
        render();
      } else if (box) {
        box.classList.toggle("is-open", openNow[i]);
        updateProgress();
      }
    }

    function updateProgress() {
      ui.setScore(everOpened.size);
      ui.setNav({ index: everOpened.size, total, onPrev: null, onNext: null });
    }

    // No timer, no listeners registered at window level -> nothing to undo.
    return function cleanup() {};
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(otbTemplate);
export default otbTemplate;
