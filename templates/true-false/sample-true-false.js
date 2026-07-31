// =============================================================
// Sample TRUE FALSE content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// =============================================================

export const activity = {
  id: "act_sample_tf",
  schemaVersion: 1,
  type: "true_false",
  title: "PLANT LIFE CYCLE — True or false",
  instruction: "Read each statement, then tap True or False.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    lives: 5,               // 5 hearts (set to null to turn lives off)
    showAnswers: true,
    speed: 0,               // 0 = the statement waits at the centre until answered
    repeatUntilCorrect: false
  },
  content: {
    statements: [
      { text: "A seed needs water, warmth and air to start growing.", answer: true },
      { text: "Germinating means the tiny plant breaks out of its seed.", answer: true },
      { text: "Plants make their own food using sunlight.", answer: true },
      { text: "Roots grow upwards, away from the soil.", answer: false },
      { text: "A young plant that has just sprouted is called a seedling.", answer: true },
      { text: "Flowers help a plant make new seeds.", answer: true },
      { text: "Leaves take in sunlight to help the plant grow.", answer: true },
      { text: "Plants can only grow in complete darkness.", answer: false }
    ]
  }
};
