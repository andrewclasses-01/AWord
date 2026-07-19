// =============================================================
// Sample QUIZ content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// Later this content will come from the teacher editor / Firebase.
// =============================================================

export const activity = {
  id: "act_sample_quiz",
  schemaVersion: 1,
  type: "quiz",
  title: "LSA2-S1.T1.P1-2-3 / ENG2",
  instruction: "Tap the correct answer.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    shuffleAnswers: true,
    lives: null
  },
  content: {
    questions: [
      {
        question: 'The opposite of "hot" is ...',
        answers: [
          { text: "cold", correct: true },
          { text: "warm", correct: false },
          { text: "wet", correct: false },
          { text: "dry", correct: false }
        ]
      },
      {
        question: 'What is the past tense of "go"?',
        answers: [
          { text: "went", correct: true },
          { text: "goed", correct: false },
          { text: "gone", correct: false },
          { text: "going", correct: false }
        ]
      },
      {
        question: "A baby dog is called a ...",
        answers: [
          { text: "puppy", correct: true },
          { text: "kitten", correct: false },
          { text: "calf", correct: false },
          { text: "cub", correct: false }
        ]
      },
      {
        question: "Which word is a fruit?",
        answers: [
          { text: "banana", correct: true },
          { text: "carrot", correct: false },
          { text: "potato", correct: false },
          { text: "onion", correct: false }
        ]
      },
      {
        question: "Choose the correct spelling.",
        answers: [
          { text: "beautiful", correct: true },
          { text: "beutiful", correct: false },
          { text: "beautifull", correct: false },
          { text: "beatiful", correct: false }
        ]
      },
      {
        question: "How many days are there in a week?",
        answers: [
          { text: "seven", correct: true },
          { text: "five", correct: false },
          { text: "ten", correct: false },
          { text: "twelve", correct: false }
        ]
      }
    ]
  }
};
