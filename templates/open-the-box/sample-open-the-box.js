// =============================================================
// Sample OPEN THE BOX content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// One mode only (30/7/2026): each box is a quiz question with >=2 answers,
// one marked correct — see open-the-box.js / open-the-box-editor.js.
// =============================================================

export const activity = {
  id: "act_sample_otb",
  schemaVersion: 1,
  type: "open_the_box",
  title: "VOCABULARY REVIEW — Open the box",
  instruction: "Tap a box to answer the question inside before time runs out.",
  theme: "classic",
  options: {
    timer: "none",
    shuffleQuestions: true,
    shuffleAnswers: true,
    questionTimeSeconds: 15,
    pointsOff: 0
  },
  content: {
    items: [
      {
        question: "What is the opposite of \"generous\"?",
        answers: [
          { text: "Stingy", correct: true },
          { text: "Kind", correct: false },
          { text: "Wealthy", correct: false },
          { text: "Cheerful", correct: false }
        ]
      },
      {
        question: "Choose the correct sentence.",
        answers: [
          { text: "She don't like coffee.", correct: false },
          { text: "She doesn't like coffee.", correct: true },
          { text: "She not like coffee.", correct: false },
          { text: "She isn't likes coffee.", correct: false }
        ]
      },
      {
        question: "What do you call a person who studies the weather?",
        answers: [
          { text: "Geologist", correct: false },
          { text: "Meteorologist", correct: true },
          { text: "Biologist", correct: false },
          { text: "Astronomer", correct: false }
        ]
      },
      {
        question: "\"Break the ice\" means...",
        answers: [
          { text: "To make people feel more relaxed", correct: true },
          { text: "To damage something cold", correct: false },
          { text: "To cancel a plan", correct: false },
          { text: "To arrive very early", correct: false }
        ]
      },
      {
        question: "Which word means \"very tired\"?",
        answers: [
          { text: "Exhausted", correct: true },
          { text: "Excited", correct: false },
          { text: "Anxious", correct: false },
          { text: "Curious", correct: false }
        ]
      },
      {
        question: "Complete: \"If it rains tomorrow, we ___ the picnic.\"",
        answers: [
          { text: "will cancel", correct: true },
          { text: "cancel", correct: false },
          { text: "cancelled", correct: false },
          { text: "canceling", correct: false }
        ]
      },
      {
        question: "What is a synonym for \"huge\"?",
        answers: [
          { text: "Enormous", correct: true },
          { text: "Tiny", correct: false },
          { text: "Narrow", correct: false },
          { text: "Ordinary", correct: false }
        ]
      },
      {
        question: "Which sentence uses the present perfect correctly?",
        answers: [
          { text: "I have visited Japan twice.", correct: true },
          { text: "I have visit Japan twice.", correct: false },
          { text: "I visited Japan since 2020.", correct: false },
          { text: "I am visiting Japan twice already.", correct: false }
        ]
      },
      {
        question: "\"Once in a blue moon\" describes something that...",
        answers: [
          { text: "Happens very rarely", correct: true },
          { text: "Happens every night", correct: false },
          { text: "Never happens", correct: false },
          { text: "Happens on a schedule", correct: false }
        ]
      }
    ]
  }
};
