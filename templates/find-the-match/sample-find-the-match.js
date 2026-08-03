// =============================================================
// Sample FIND THE MATCH content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// =============================================================

export const activity = {
  id: "act_sample_ftm",
  schemaVersion: 1,
  type: "find_the_match",
  title: "FOOD GROUPS — Find the match",
  instruction: "Read the definition, then tap the matching word.",
  theme: "classic",
  options: {
    timer: "countUp",
    shuffleQuestions: true,
    lives: 5,
    showAnswers: true,
    speed: 0,
    repeatUntilCorrect: false,
    removeCorrects: true,
    pointsOff: 0
  },
  content: {
    pairs: [
      { keyword: "Apple", definition: "a round fruit that grows on trees, often red or green" },
      { keyword: "Carrot", definition: "an orange vegetable that grows under the ground" },
      { keyword: "Rose", definition: "a flower with a sweet smell and sharp thorns" },
      { keyword: "Salmon", definition: "a pink fish that swims from the sea back to rivers" },
      { keyword: "Rice", definition: "small white grains cooked and eaten as a main food" },
      { keyword: "Broccoli", definition: "a green vegetable that looks like a small tree" },
      { keyword: "Banana", definition: "a long yellow fruit you peel before eating" },
      { keyword: "Milk", definition: "a white drink that comes from cows" }
    ]
  }
};
