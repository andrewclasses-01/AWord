// =============================================================
// Sample data for the ROCKET-RACE template (used by test.html).
// Data model "A" (same shape as Quiz): each item is a question with a few
// answers, exactly one correct. Answers ride on tiles under the track, so
// short answers read best — but long ones auto-shrink, so anything works.
// =============================================================

export const activity = {
  id: "sample-rocket-race",
  type: "rocket_race",
  title: "Space Race",
  instruction: "Answer fast to fire your rocket to the finish line!",
  theme: "classic",
  options: {
    timer: "countUp",       // none | countUp | countDown
    timerTotalSeconds: 120, // only used when timer = countDown
    shuffleQuestions: true,
    shuffleAnswers: true,
    showAnswers: true,
    lives: 0,               // 0 = unlimited
    pointsOff: 0,           // points off per wrong answer (0 = off)
    rrMode: "solo",         // solo | teams
    rrRivals: 4,            // rockets you race against (solo)
    rrSpeed: "normal",      // slow | normal | fast
    rrPowerups: true,
    rrQuestionSeconds: 0,   // 0 = untimed
    rrTeams: 2              // teams (teams mode)
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
        answers: [ { text: "Mars", correct: true }, { text: "Venus" }, { text: "Pluto" }, { text: "Mercury" } ] },
      { question: "An astronaut wears a …",
        answers: [ { text: "Spacesuit", correct: true }, { text: "Raincoat" }, { text: "Swimsuit" }, { text: "Pyjamas" } ] },
      { question: "The Moon goes around the …",
        answers: [ { text: "Earth", correct: true }, { text: "Sun" }, { text: "Mars" } ] }
    ]
  }
};
