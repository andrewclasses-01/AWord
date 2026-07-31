// =============================================================
// MAZE-CHASE CONTENT EDITOR.
//
// Maze chase uses the SAME data shape as Quiz (content.questions[] each with a
// list of answers, exactly one correct), so instead of duplicating the whole
// question-builder form we REUSE the Quiz editor and just:
//   • keep the activity's type as "maze_chase" on save (the Quiz editor's
//     normalize() stamps "quiz" — we stamp it back),
//   • relabel the little type badge to "MAZE CHASE".
// Lives / Difficulty aren't edited here — like every other template, per-act
// options live in the in-game Options panel (buildExtraOptions) + Settings.
// =============================================================

import { openQuizEditor } from "../quiz/quiz-editor.js";

export function openMazeChaseEditor(container, activity, opts = {}) {
  openQuizEditor(container, activity, {
    ...opts,
    onSave: async updated => {
      if (updated) updated.type = "maze_chase";
      return opts.onSave?.(updated);
    }
  });
  const badge = container.querySelector(".aw-ed-typebadge");
  if (badge) badge.textContent = "MAZE CHASE";
}
