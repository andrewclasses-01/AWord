// =============================================================
// Sample WORDSHAKE content — used by test.html and the New activity picker.
// CONVENTION: every template's sample file exports `export const activity`.
// =============================================================

export const activity = {
  id: "act_sample_wordshake",
  schemaVersion: 1,
  type: "wordshake",
  title: "WEATHER — Wordshake",
  instruction: "Make the word from the letters.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    wsMode: "one",
    wsTiles: 12,
    showAnswers: true
  },
  content: {
    withClues: true,
    items: [
      { word: "cloudy", clue: "nhiều mây" },
      { word: "rainbow", clue: "cầu vồng" },
      { word: "thunder", clue: "sấm" },
      { word: "windy", clue: "có gió, lộng gió" },
      { word: "storm", clue: "cơn bão" },
      { word: "sunny", clue: "có nắng" },
      { word: "foggy", clue: "có sương mù" },
      { word: "frost", clue: "sương giá" }
    ]
  }
};
