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
  },
  {
    type: "anagram",
    label: "Anagram",
    load: () => import("./templates/anagram/anagram.js"),
    sample: () => import("./templates/anagram/sample-anagram.js")
  },
  {
    type: "open_the_box",
    label: "Open the box",
    load: () => import("./templates/open-the-box/open-the-box.js"),
    sample: () => import("./templates/open-the-box/sample-open-the-box.js")
  },
  {
    type: "type_the_answer",
    label: "Type the answer",
    load: () => import("./templates/type-the-answer/type-the-answer.js"),
    sample: () => import("./templates/type-the-answer/sample-type-the-answer.js")
  }
  // Add the next one here once it's approved.
];
