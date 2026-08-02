// =============================================================
// Sample WHACK-A-MOLE content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Whack-a-mole has TWO content shapes, chosen by `options.mode`:
//   "trueFalse" -> content.statements[{ text, answer:bool }]
//                  the sign shows a fixed target (TRUE); whack moles whose
//                  statement matches the target.
//   "quiz"      -> content.questions[{ question, answers:[{text,correct}] }]
//                  the sign shows ONE question (a "level"); moles carry that
//                  question's options; whack the correct one to rotate on.
// Both shapes live here so switching mode in Options works without new data.
// =============================================================

export const activity = {
  id: "act_sample_wam",
  schemaVersion: 1,
  type: "whack_a_mole",
  title: "PLANT LIFE CYCLE — Whack-a-mole",
  instruction: "Whack the moles that match the sign before they duck back down.",
  theme: "classic",
  options: {
    mode: "trueFalse",         // "trueFalse" | "quiz" (chosen in the editor, locked once there's content)
    timer: "countDown",        // "countDown" (bar) | "countUp" (no bar; ends when all needed answers are hit)
    timerTotalSeconds: 60,     // count-down length; also the "None"-free timer the engine drives us from
    switchAnswers: false,      // true -> sign says FALSE, hit the FALSE moles
    speed: 5,                  // 1..10 — how fast/often moles pop up
    lives: 0,                  // 0 = Unlimited; 1..10 = hearts (game over at 0)
    minusAmount: 1,            // points off per wrong hit (0 = off)
    bonusTime: true,           // bonus crates — each toggles independently
    bonusLoot: true,
    bonusPower: true,
    showAnswers: true
  },
  content: {
    // ----- True/False mode -----
    statements: [
      { text: "A seed needs water, warmth and air to start growing.", answer: true },
      { text: "Germinating means the tiny plant breaks out of its seed.", answer: true },
      { text: "Plants make their own food using sunlight.", answer: true },
      { text: "Roots grow upwards, away from the soil.", answer: false },
      { text: "A young plant that has just sprouted is called a seedling.", answer: true },
      { text: "Flowers help a plant make new seeds.", answer: true },
      { text: "Leaves take in sunlight to help the plant grow.", answer: true },
      { text: "Plants can only grow in complete darkness.", answer: false },
      { text: "A large seed always grows into a taller tree than a small seed.", answer: false },
      { text: "Rich, healthy soil helps a seedling grow well.", answer: true }
    ],
    // ----- Quiz mode -----
    questions: [
      {
        question: "What does a seed need to start growing?",
        answers: [
          { text: "Water, warmth and air", correct: true },
          { text: "Only darkness", correct: false },
          { text: "Only rocks", correct: false }
        ]
      },
      {
        question: "What is a young plant that has just sprouted called?",
        answers: [
          { text: "A seedling", correct: true },
          { text: "A boulder", correct: false },
          { text: "A cloud", correct: false }
        ]
      },
      {
        question: "How do plants make their own food?",
        answers: [
          { text: "Using sunlight", correct: true },
          { text: "By eating soil", correct: false },
          { text: "From moonlight", correct: false }
        ]
      },
      {
        question: "What do flowers help a plant do?",
        answers: [
          { text: "Make new seeds", correct: true },
          { text: "Grow roots downward", correct: false },
          { text: "Turn into stone", correct: false }
        ]
      }
    ]
  }
};
