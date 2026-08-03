// =============================================================
// Sample TYPE THE ANSWER content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// =============================================================

export const activity = {
  id: "act_sample_tta",
  schemaVersion: 1,
  type: "type_the_answer",
  title: "VOCABULARY — Type the answer",
  instruction: "Type your answer, then press Enter or tap Submit.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    showAnswerWhenWrong: true,
    allowSkip: false,
    showAnswers: true
  },
  content: {
    mode: "qa",
    items: [
      { prompt: "What is the past tense of \"go\"?", acceptedAnswers: ["went"] },
      { prompt: "What is the opposite of \"hot\"?", acceptedAnswers: ["cold"] },
      { prompt: "What colour do you get by mixing blue and yellow?", acceptedAnswers: ["green"] },
      { prompt: "What is another word for \"grey\"?", acceptedAnswers: ["gray", "grey"] },
      { prompt: "How many days are there in a week?", acceptedAnswers: ["seven", "7"] },
      { prompt: "What do bees make?", acceptedAnswers: ["honey"] }
    ]
  }
};
