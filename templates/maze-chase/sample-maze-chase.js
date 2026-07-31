// =============================================================
// Sample data for the MAZE-CHASE template (used by test.html).
// Data model "A" (same shape as Quiz): each item is a question with a few
// answers, exactly one correct. Keep answers SHORT — they ride on the maze
// pads, so one or two words read best.
// =============================================================

export const activity = {
  id: "sample-maze-chase",
  type: "maze_chase",
  title: "Space Explorers",
  instruction: "Run to the correct answer. Dodge the robots!",
  theme: "classic",
  options: {
    timer: "countUp",       // none | countUp | countDown
    timerTotalSeconds: 120, // only used when timer = countDown
    shuffleQuestions: true,
    showAnswers: true,
    lives: 5,               // maze-chase extra
    difficulty: 6           // maze-chase extra (1–10: more/faster enemies)
  },
  content: {
    questions: [
      { question: "Which planet is closest to the Sun?",
        answers: [ { text: "Mercury", correct: true }, { text: "Venus" }, { text: "Mars" }, { text: "Earth" } ] },
      { question: "What do we call a shooting star?",
        answers: [ { text: "Meteor", correct: true }, { text: "Comet" }, { text: "Planet" } ] },
      { question: "The Sun is a …",
        answers: [ { text: "Star", correct: true }, { text: "Moon" }, { text: "Galaxy" }, { text: "Comet" } ] },
      { question: "Who was the first person on the Moon?",
        answers: [ { text: "Armstrong", correct: true }, { text: "Gagarin" }, { text: "Newton" } ] },
      { question: "Which planet has beautiful rings?",
        answers: [ { text: "Saturn", correct: true }, { text: "Jupiter" }, { text: "Neptune" }, { text: "Mars" } ] },
      { question: "A vehicle that travels in space is a …",
        answers: [ { text: "Rocket", correct: true }, { text: "Truck" }, { text: "Boat" } ] },
      { question: "Our galaxy is called the …",
        answers: [ { text: "Milky Way", correct: true }, { text: "Big Dipper" }, { text: "Orion" } ] },
      { question: "The red planet is …",
        answers: [ { text: "Mars", correct: true }, { text: "Venus" }, { text: "Pluto" }, { text: "Mercury" } ] }
    ]
  }
};
