// =============================================================
// Sample BALLOON POP content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
//
// Data model (from the real Wordwall "Balloon pop", captured 1/8/2026):
// each item = a KEYWORD (hangs from a balloon) + its MATCHING DEFINITION
// (appears on the train car). Optional per-side images (keywordImage /
// definitionImage) mirror Wordwall's 🖼️ picture option — not used yet.
// min 5, max 100 items. See GHI CHU BALLOON-POP.md.
// =============================================================

export const activity = {
  id: "act_sample_balloon_pop",
  schemaVersion: 1,
  type: "balloon_pop",
  title: "VOCABULARY — Balloon pop",
  instruction: "Pop the balloons to drop each keyword onto its matching definition.",
  theme: "classic",   // Wild West look is baked into the template; classic = default
  options: {
    timer: "none",           // engine's own timer is unused — Balloon pop runs its own countdown (bpTimerSeconds)
    shuffleQuestions: true,
    showAnswers: true,
    bpTimerSeconds: 60,      // total round time (Wordwall default 1:00)
    bpSpeed: 5,              // balloon drift speed 1..10 (Wordwall default 5)
    bpLevels: 10,            // how many definitions to play this round (Wordwall default 10)
    bpBonusTime: false,      // Extra Time bonus balloons
    bpBonusPoints: false,    // Points bonus balloons
    bpBonusX2: false         // x2 Score bonus balloons
  },
  content: {
    items: [
      { keyword: "CORRECT",     definition: "This describes something that is right and has no mistake in it." },
      { keyword: "COMPETITION", definition: "This is an event where people try to win by doing something better than others." },
      { keyword: "STRANGE",     definition: "This describes something that feels unusual, unexpected, or a little hard to understand." },
      { keyword: "FRONT",       definition: "This is the part of something that faces forward or comes before the rest." },
      { keyword: "BAR",         definition: "This is a place or counter where drinks or food are served." },
      { keyword: "NEAR",        definition: "This means not far from someone or something." },
      { keyword: "PUSH",        definition: "This means to use your hand or body to move something away from you." },
      { keyword: "DROP",        definition: "This means to let something fall from your hand or from a higher place." },
      { keyword: "THROW",       definition: "This means to send something through the air with your hand." },
      { keyword: "DESCRIBE",    definition: "This means to say or write what someone or something is like." },
      { keyword: "MATTER",      definition: "This means to be important or have value in a situation." },
      { keyword: "CARRY",       definition: "This means to hold something and take it from one place to another." },
      { keyword: "PULL",        definition: "This means to use force to bring something towards you." },
      { keyword: "INTEREST",    definition: "This is the feeling of wanting to know more about something or to give your attention to it." },
      { keyword: "BEHIND",      definition: "This means at the back of someone or something." },
      { keyword: "BREAK",       definition: "This means to damage something so it is in pieces or no longer works properly." },
      { keyword: "SEASON",      definition: "This is one of the parts of the year, such as spring, summer, autumn, or winter." },
      { keyword: "ACROSS",      definition: "This means from one side to the other side of something." },
      { keyword: "FALL",        definition: "This means to go down to the ground by accident." },
      { keyword: "CHANGE",      definition: "This means to become different or to make something different." }
    ]
  }
};
