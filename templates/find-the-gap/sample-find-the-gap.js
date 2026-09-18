// =============================================================
// Sample FIND THE GAP content — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Real lines from LSA2-S1.T1.P1-2-3 (Listening for A2, Part 1) with the
// timecodes Parakeet measured on 18/9/2026; the audio streams from the
// public myLesson-audio store, so this sample plays for real anywhere.
// See ftg-shared.js for the shape.
// =============================================================

export const activity = {
  id: "act_sample_ftg",
  schemaVersion: 1,
  type: "find_the_gap",
  optVer: 4,             // options already on the current scale (core/options-migrate.js) — never ×20 Points off
  title: "LSA2-S1.T1.P1-2-3 — Find the gap",
  instruction: "Listen and fill in the missing words.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    showAnswers: true,
    allowSkip: false,
    speakerNames: true,
    mode: "quiz",          // "quiz" (tap one of N words) · "type" (keyboard) · "find" (tap in the big grid)
    scoring: "sentence",   // "sentence" = 1 point per line, all gaps right (default) · "gap" = 1 point per gap
    choices: 6,            // quiz mode: tiles per gap (3..6)
    lives: 0,              // 0 = unlimited hearts
    pointsOff: 0
  },
  content: {
    audio: "LSA2-S1.T1.P1-2-3",
    items: [
      { speaker: "Male", text: "I've got the passports here.",
        gaps: [{ word: 3 }], start: 9.21, end: 11.61, enabled: true },
      { speaker: "Female", text: "And the tickets are in my bag.",
        gaps: [{ word: 2 }, { word: 6 }], start: 12.17, end: 14.65, enabled: true },
      { speaker: "Male", text: "What about the camera?",
        gaps: [{ word: 3 }], start: 14.81, end: 16.57, enabled: true },
      { speaker: "Female", text: "Oh no! I've left it at home. And I really wanted to take some holiday photos.",
        gaps: [{ word: 6 }, { word: 15 }], start: 16.49, end: 23.05, enabled: true },
      { speaker: "Male", text: "Hurry up! We'll be late.",
        gaps: [{ word: 4 }], start: 30.33, end: 32.81, enabled: true },
      { speaker: "Male", text: "At six fifteen. We've got to leave in ten minutes.",
        gaps: [{ word: 2, answers: ["15"] }, { word: 6 }], start: 34.81, end: 38.33, enabled: true },
      { speaker: "Female", text: "I'm nearly ready.",
        gaps: [{ word: 2 }], start: 38.25, end: 40.17, enabled: true },
      { speaker: "Male", text: "Can you tell me the way to Room 22?",
        gaps: [{ word: 7 }], start: 47.45, end: 50.41, enabled: true },
      { speaker: "Male", text: "Do I have to go through the main hall?",
        gaps: [{ word: 8 }], start: 57.53, end: 60.09, enabled: true },
      { speaker: "Female", text: "The one over there, wearing a hat.",
        gaps: [{ word: 6 }], start: 74.41, end: 77.21, enabled: true },
      { speaker: "Female", text: "Oh, the traffic’s terrible today.",
        gaps: [{ word: 3 }], start: 87.13, end: 89.93, enabled: true },
      { speaker: "Male", text: "Yes, it took me forty minutes by bus.",
        gaps: [{ word: 4, answers: ["40"] }, { word: 7 }], start: 90.17, end: 93.13, enabled: true },
      { speaker: "Female", text: "Well, I drove and it took me an hour!",
        gaps: [{ word: 2 }, { word: 8 }], start: 93.05, end: 95.53, enabled: true },
      { speaker: "Male", text: "An hour! It’s probably quicker by bicycle.",
        gaps: [{ word: 6 }], start: 95.45, end: 99.53, enabled: true }
    ]
  }
};
