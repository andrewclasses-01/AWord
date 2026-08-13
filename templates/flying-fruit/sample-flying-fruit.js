// =============================================================
// Sample FLYING FRUIT content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Flying Fruit uses the SAME simple data shape as Anagram (teacher's call):
//   content.items = [{ word, clue }]
//     word = the CORRECT answer (the word that flies on the right fruit)
//     clue = the QUESTION / definition shown at the top of the frame
// In play: the clue is shown up top, the correct `word` flies past on a fruit
// among several RANDOM distractor words (the answers of other items) — tap the
// fruit carrying the correct word.
// =============================================================

export const activity = {
  id: "act_sample_flyingfruit",
  schemaVersion: 1,
  type: "flying_fruit",
  title: "VOCABULARY — Flying fruit",
  instruction: "Answers move across the screen. Tap the correct answer when you see it.",
  theme: "classic",
  options: {
    timer: "countUp",       // "none" | "countUp" | "countDown"
    timerTotalSeconds: 120, // used only when timer === "countDown"
    lives: 6,               // hearts — a wrong tap costs one
    speed: 7,               // 1..10 — how fast the fruits fly across
    retry: false,           // false = a wrong tap moves on; true = keep trying the same clue
    pointsOff: 0,           // 0..100 — points subtracted from the live score on each wrong tap (negative allowed)
    shuffleQuestions: true,
    showAnswers: true
  },
  content: {
    items: [
      { word: "MATTER",       clue: "This means to be important or have value in a situation." },
      { word: "CORRECT",      clue: "This describes something that is right and has no mistake in it." },
      { word: "COMPETITION",  clue: "This is an event where people try to win by doing something better than others." },
      { word: "STRANGE",      clue: "This describes something that feels unusual, unexpected, or a little hard to understand." },
      { word: "SEASON",       clue: "This is one of the four parts of the year, such as summer or winter." },
      { word: "BEHIND",       clue: "This means at the back of something, or slower than others." },
      { word: "PUSH",         clue: "This means to press something so it moves away from you." },
      { word: "CARRY",        clue: "This means to hold something and take it from one place to another." },
      { word: "BREAK",        clue: "This means to separate something into pieces, often by accident." },
      { word: "DESCRIBE",     clue: "This means to say what something is like, using words." },
      { word: "FRONT",        clue: "This is the part of something that faces forward." },
      { word: "SEARCH",       clue: "This means to look carefully in order to find something." }
    ]
  }
};
