// =============================================================
// Sample TOURNAMENT content — used by test.html and the New activity picker.
// CONVENTION: every template's sample file exports `export const activity`.
// =============================================================

export const activity = {
  id: "act_sample_tournament",
  schemaVersion: 1,
  type: "tournament",
  title: "WEATHER — Tournament",
  instruction: "",
  theme: "classic",
  sourceActId: "",
  options: {
    shuffleQuestions: true,
    tnGame: "aShowSpeed",
    tnHinh: "cap",
    wsMode: "one",
    wsTiles: 12,
    wsOnlyList: true,
    tnPhut: 3,
    tnLv: "easy",
    tnGoiY: true,
    tnGiong: false,
    tnBien: "eng1"
  },
  content: {
    withClues: true,
    items: [
      { word: "cloudy", clue: "full of clouds", clues: { eng1: "full of clouds", eng2: "with many clouds", vi1: "nhiều mây", vi2: "Hôm nay trời nhiều mây." } },
      { word: "rainbow", clue: "colours in the sky after rain", clues: { eng1: "colours in the sky after rain", eng2: "a bow of colours", vi1: "cầu vồng", vi2: "Cầu vồng hiện ra sau cơn mưa." } },
      { word: "thunder", clue: "the loud noise in a storm", clues: { eng1: "the loud noise in a storm", eng2: "a loud sound in the sky", vi1: "sấm", vi2: "Tiếng sấm làm em bé giật mình." } },
      { word: "windy", clue: "with a lot of wind", clues: { eng1: "with a lot of wind", eng2: "with strong air moving", vi1: "có gió, lộng gió", vi2: "Hôm nay trời lộng gió." } },
      { word: "storm", clue: "very bad weather", clues: { eng1: "very bad weather", eng2: "strong rain and wind", vi1: "cơn bão", vi2: "Cơn bão đến vào ban đêm." } },
      { word: "sunny", clue: "bright with sun", clues: { eng1: "bright with sun", eng2: "with the sun out", vi1: "có nắng", vi2: "Trời nắng đẹp quá." } },
      { word: "foggy", clue: "full of thick mist", clues: { eng1: "full of thick mist", eng2: "hard to see because of mist", vi1: "có sương mù", vi2: "Sáng nay sương mù dày đặc." } },
      { word: "frost", clue: "thin ice on cold mornings", clues: { eng1: "thin ice on cold mornings", eng2: "white ice on the ground", vi1: "sương giá", vi2: "Sương giá phủ trắng mái nhà." } }
    ]
  }
};
