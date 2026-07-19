// =============================================================
// MANIFEST — the list of FINISHED templates shown on the final
// gathering page (index.html / main.js).
//
// When a template is "chốt" (approved), add ONE line here.
// Do NOT list templates that are still under construction —
// keep building those only through their own test.html.
// =============================================================

export const FINISHED_TEMPLATES = [
  {
    type: "quiz",
    label: "Quiz",
    load: () => import("./templates/quiz/quiz.js"),
    sample: () => import("./templates/quiz/sample-quiz.js")
  }
  // Add the next one here once it's approved, e.g.:
  // {
  //   type: "anagram",
  //   label: "Anagram",
  //   load: () => import("./templates/anagram/anagram.js"),
  //   sample: () => import("./templates/anagram/sample-anagram.js")
  // }
];
