// =============================================================
// ROCKET-RACE CONTENT EDITOR.
//
// Rocket race uses the SAME data shape as Quiz (content.questions[] each with
// a list of answers, exactly one correct), so — exactly like Maze chase — we
// REUSE the Quiz editor and only:
//   • keep the activity's type as "rocket_race" on save (the Quiz editor's
//     normalize() stamps "quiz" — we stamp it back),
//   • relabel the little type badge to "ROCKET RACE".
// Rivals / speed / power-ups / mode aren't edited here — like every other
// template, per-act options live in the in-game Options panel
// (buildExtraOptions) + Settings.
// =============================================================

import { openQuizEditor } from "../quiz/quiz-editor.js";

export function openRocketRaceEditor(container, activity, opts = {}) {
  openQuizEditor(container, activity, {
    ...opts,
    onSave: async updated => {
      if (updated) updated.type = "rocket_race";
      return opts.onSave?.(updated);
    }
  });
  const badge = container.querySelector(".aw-ed-typebadge");
  if (badge) badge.textContent = "ROCKET RACE";
}
