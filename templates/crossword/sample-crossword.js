// =============================================================
// Sample CROSSWORD content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Content shape for Crossword:
//   content.words = [ { answer: "CORRECT", clue: "This describes ..." }, ... ]
// The grid is generated automatically from the answers (interlocking words),
// exactly like Wordwall — the teacher only types answer + clue pairs.
// (These 20 pairs are the real ones from Teacher Andrew's Wordwall act
//  https://wordwall.net/resource/116864402/crossword)
// =============================================================

export const activity = {
  id: "act_sample_crossword",
  schemaVersion: 1,
  type: "crossword",
  title: "VOCABULARY — Crossword",
  instruction: "Use the clues to solve the crossword. Tap a word and type in the answer.",
  theme: "classic",
  options: {
    timer: "countUp",
    showAnswerWhenWrong: true,
    showAnswers: true
  },
  content: {
    words: [
      { answer: "CORRECT",     clue: "This describes something that is right and has no mistake in it." },
      { answer: "COMPETITION", clue: "This is an event where people try to win by doing something better than others." },
      { answer: "STRANGE",     clue: "This describes something that feels unusual, unexpected, or a little hard to understand." },
      { answer: "FRONT",       clue: "This is the part of something that faces forward or comes before the rest." },
      { answer: "BAR",         clue: "This is a place or counter where drinks or food are served." },
      { answer: "NEAR",        clue: "This means not far from someone or something." },
      { answer: "PUSH",        clue: "This means to use your hand or body to move something away from you." },
      { answer: "DROP",        clue: "This means to let something fall from your hand or from a higher place." },
      { answer: "THROW",       clue: "This means to send something through the air with your hand." },
      { answer: "DESCRIBE",    clue: "This means to say or write what someone or something is like." },
      { answer: "MATTER",      clue: "This means to be important or have value in a situation." },
      { answer: "CARRY",       clue: "This means to hold something and take it from one place to another." },
      { answer: "PULL",        clue: "This means to use force to bring something towards you." },
      { answer: "INTEREST",    clue: "This is the feeling of wanting to know more about something or to give your attention to it." },
      { answer: "BEHIND",      clue: "This means at the back of someone or something." },
      { answer: "BREAK",       clue: "This means to damage something so it is in pieces or no longer works properly." },
      { answer: "SEASON",      clue: "This is one of the parts of the year, such as spring, summer, autumn, or winter." },
      { answer: "ACROSS",      clue: "This means from one side to the other side of something." },
      { answer: "FALL",        clue: "This means to go down to the ground by accident." },
      { answer: "CHANGE",      clue: "This means to become different or to make something different." }
    ]
  }
};
