// =============================================================
// SAMPLE DATA — Speaking cards.
// Data model (open-ended, NOT scored):
//   content.cards = [{ text }]
//     text  : the prompt a student reads out / talks about
// options:
//   timer            "none" | "countUp" | "countDown"
//   timerTotalSeconds  countdown length in seconds
//   shuffleQuestions   shuffle the deck order (reuses the engine's standard flag)
//   dealPlaces         how many cards are laid out at once (1..10)
// =============================================================

export const activity = {
  id: "sample-speaking-cards",
  type: "speaking_cards",
  title: "Speaking cards",
  instruction: "Deal out cards at random from a shuffled deck.",
  theme: "classic",
  options: {
    timer: "none",
    timerTotalSeconds: 120,
    shuffleQuestions: true,
    dealPlaces: 1
  },
  content: {
    cards: [
      { text: "Describe your best friend. What do you like about them?" },
      { text: "Talk about a food you love and how it tastes." },
      { text: "What did you do last weekend?" },
      { text: "Describe your favourite place to relax." },
      { text: "Talk about a pet you have or would like to have." },
      { text: "What is your dream holiday? Where would you go?" },
      { text: "Describe the weather today." },
      { text: "Talk about a hobby you enjoy in your free time." },
      { text: "What is your favourite subject at school and why?" },
      { text: "Describe a person in your family." },
      { text: "Talk about a film or show you watched recently." },
      { text: "What would you do with a million dollars?" },
      { text: "TROUSER /ˈtraʊzə/" },
      { text: "responsibility" }
    ]
  }
};
