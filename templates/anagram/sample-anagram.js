// =============================================================
// Sample ANAGRAM content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// =============================================================

export const activity = {
  id: "act_sample_anagram",
  schemaVersion: 1,
  type: "anagram",
  title: "ANIMALS — Unscramble",
  instruction: "Tap the letters in the right order to spell the word.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    anagramMode: "bonus",
    allCaps: true,
    allowSkip: true,
    showAnswers: true
  },
  content: {
    withClues: true,
    items: [
      { word: "elephant", clue: "A huge grey animal with a long trunk." },
      { word: "giraffe", clue: "The tallest animal, with a very long neck." },
      { word: "dolphin", clue: "A smart sea animal that jumps and clicks." },
      { word: "penguin", clue: "A black and white bird that cannot fly but swims well." },
      { word: "kangaroo", clue: "An animal from Australia that hops and carries its baby in a pouch." },
      { word: "polar bear", clue: "A big white bear that lives in the cold Arctic." }
    ]
  }
};
