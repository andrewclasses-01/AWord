// =============================================================
// Sample UNJUMBLE content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Data shape mirrors Anagram but the unit is a WHOLE SENTENCE: the teacher
// types the correct sentence, the game splits it into words and scrambles
// the WORD order. `sentence` is the correct sentence; `clue` is optional.
// (The editor also accepts the legacy key `word` / `text` for a sentence.)
// =============================================================

export const activity = {
  id: "act_sample_unjumble",
  schemaVersion: 1,
  type: "unjumble",
  title: "FUTURE with WILL — Unjumble",
  instruction: "Drag the words into the right order to make a correct sentence.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    unjumbleMode: "bonus",   // "everyword" | "bonus" | "submit"
    align: "left",           // "left" | "center"
    allowSkip: true,
    showAnswers: true
  },
  content: {
    withClues: false,
    items: [
      { sentence: "My mechanic will fix the bike next week.", clue: "" },
      { sentence: "My mother will help my father next month.", clue: "" },
      { sentence: "We will clean the house next Saturday.", clue: "" },
      { sentence: "She will read a book tomorrow.", clue: "" },
      { sentence: "The boys will jump on the table.", clue: "" },
      { sentence: "He will swim in the pool after school.", clue: "" }
    ]
  }
};
