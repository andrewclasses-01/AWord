// =============================================================
// Sample SPEED SORTING (type group_sort) content — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// SHAPE (Wordwall model "E. Sort", docs/00-OVERVIEW.md):
//   content.groups = [name, name, ...]           2..8 group names, in order
//   content.items  = [{ text, group }, ...]      group = the NAME it belongs to
// A FLAT item list on purpose: "Start with mistakes" (core/mistakes.js) and
// the Show answers screen both want one array of playable things.
// =============================================================

export const activity = {
  id: "act_sample_gs",
  schemaVersion: 1,
  type: "group_sort",
  title: "QUESTION WORDS — Speed sorting",
  instruction: "Put each question into the right group.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    showAnswers: true,
    mode: "tap",            // "tap" = SPEED SORTING (chips ride a belt, drag each onto its pill) · "drag" = GROUP SORT (pool + boxes)
    speed: 3,               // belt mode: 1..10 = belt speed (Đợt 327; the old 0 = "wait" is read as 3)
    lives: 0,               // 0 = unlimited hearts
    repeatUntilCorrect: false,
    dragCheck: "submit",    // drag mode: "submit" = graded when all are placed / Submit · "instant" = graded on every drop
    pointsOff: 0
  },
  content: {
    groups: ["WHERE", "WHEN", "WHO", "WHY"],
    items: [
      { text: "Where is my coat?",              group: "WHERE" },
      { text: "Where does your brother study?", group: "WHERE" },
      { text: "Where do they play football?",   group: "WHERE" },
      { text: "When is her birthday?",          group: "WHEN" },
      { text: "When did they get home?",        group: "WHEN" },
      { text: "When is the next test?",         group: "WHEN" },
      { text: "Who is that tall man?",          group: "WHO" },
      { text: "Who is she calling?",            group: "WHO" },
      { text: "Who will help me?",              group: "WHO" },
      { text: "Why are you sad?",               group: "WHY" },
      { text: "Why does she play football?",    group: "WHY" },
      { text: "Why is the class so quiet?",     group: "WHY" }
    ]
  }
};
