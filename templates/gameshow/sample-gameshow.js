// =============================================================
// Sample data for the GAMESHOW template (used by test.html).
// Data model "A" (identical to Quiz): each question has 2–6 answers, exactly
// one correct. Keep answers fairly short so the game-show tiles read well.
// =============================================================

export const activity = {
  id: "sample-gameshow",
  type: "gameshow",
  title: "Vocabulary Showdown",
  instruction: "Beat the clock, use your lifelines, win the bonus round!",
  theme: "classic",
  options: {
    timer: "none",         // Gameshow runs its OWN per-question timer (gsSeconds)
    gsSeconds: 20,         // seconds per question (0 = no time pressure)
    lives: 0,              // 0 = Unlimited
    bonusEvery: 3,         // a bonus round after every 3 questions (0 = off)
    lifelines: { fifty: true, x2: true, time: true, cheat: true },
    shuffleQuestions: true,
    shuffleAnswers: true,
    showAnswers: true
  },
  content: {
    questions: [
      { question: "This means to say or write what someone or something is like.",
        answers: [ { text: "DESCRIBE", correct: true }, { text: "BREAK" }, { text: "FALL" }, { text: "PUSH" } ] },
      { question: "An event where people try to win by doing something better than others.",
        answers: [ { text: "COMPETITION", correct: true }, { text: "MATTER" }, { text: "FRONT" }, { text: "SEASON" } ] },
      { question: "Something that is right and has no mistake in it.",
        answers: [ { text: "CORRECT", correct: true }, { text: "BREAK" }, { text: "CARRY" }, { text: "SEASON" } ] },
      { question: "To keep something in your mind and not forget it.",
        answers: [ { text: "REMEMBER", correct: true }, { text: "IGNORE" }, { text: "LOSE" }, { text: "DROP" } ] },
      { question: "A place where you borrow books to read.",
        answers: [ { text: "LIBRARY", correct: true }, { text: "KITCHEN" }, { text: "GARAGE" } ] },
      { question: "The opposite of 'ancient' or 'old'.",
        answers: [ { text: "MODERN", correct: true }, { text: "TINY" }, { text: "HEAVY" }, { text: "CHEAP" } ] },
      { question: "To make something larger in size or amount.",
        answers: [ { text: "INCREASE", correct: true }, { text: "REDUCE" }, { text: "REPEAT" }, { text: "ARRIVE" } ] },
      { question: "A feeling of being happy and pleased.",
        answers: [ { text: "JOY", correct: true }, { text: "FEAR" }, { text: "ANGER" }, { text: "DOUBT" } ] },
      { question: "A person who travels to space.",
        answers: [ { text: "ASTRONAUT", correct: true }, { text: "PILOT" }, { text: "SAILOR" }, { text: "FARMER" } ] },
      { question: "To find the answer to a problem.",
        answers: [ { text: "SOLVE", correct: true }, { text: "BUILD" }, { text: "PAINT" }, { text: "CLOSE" } ] }
    ]
  }
};
