// =============================================================
// Sample activity for SPEAKING — used by test.html and as the
// starting point when a teacher picks "Speaking" in "New activity".
//
// `phonemes` on each item is the TARGET pronunciation (eSpeak-ng IPA,
// generated once via core/phonemize.js — see speaking-editor.js's
// "Generate phonemes" button). Captured 10/8/2026 from a REAL call to
// phonemizeWord() in a live browser (see GHI CHU SPEAKING.md) —
// not hand-guessed IPA.
// =============================================================

export const activity = {
  id: "sample-speaking",
  type: "speaking",
  title: "Say It Right — Animals",
  instruction: "Say each word out loud.",
  theme: "classic",
  options: {
    shuffleQuestions: false,
    // Đợt 108: the pass bar is in STARS now (half-star steps). Activities
    // saved with the older `passThreshold` percentage keep working —
    // speaking.js converts them with the same ÷20 rule (70% -> 3.5★).
    passStars: 3.5,
    playReference: true,
    allowRetry: true,
    timer: "none"
  },
  content: {
    items: [
      { word: "elephant", clue: "A very big grey animal with a long trunk.", phonemes: "ˈɛlɪfənt" },
      { word: "banana", clue: "A long yellow fruit.", phonemes: "bɐnˈænə" },
      { word: "butterfly", clue: "An insect with big colourful wings.", phonemes: "bˈʌɾɚflˌaɪ" },
      { word: "umbrella", clue: "You hold it over your head when it rains.", phonemes: "ʌmbɹˈɛlə" }
    ]
  }
};
