// =============================================================
// SAMPLE DATA — Speaking cards.
// Data model (open-ended, NOT scored):
//   content.cards = [{ text, image? }]
//     text  : the prompt a student reads out / talks about
//     image : optional picture on the card (URL or data: URL). Omit / "" = text only.
// options:
//   timer            "none" | "countUp" | "countDown"
//   timerTotalSeconds  countdown length in seconds
//   shuffleQuestions   shuffle the deck order (reuses the engine's standard flag)
//   dealPlaces         how many cards are laid out at once (1..10)
// =============================================================

// A tiny self-contained picture (inline SVG) so the sample shows off image
// cards without needing any external file. Real activities usually attach a
// photo through the editor's image button.
const SUITCASE_IMG =
  "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 100'>
      <rect x='18' y='30' width='84' height='58' rx='9' fill='#c9962a' stroke='#8a5a10' stroke-width='4'/>
      <rect x='46' y='16' width='28' height='16' rx='5' fill='none' stroke='#8a5a10' stroke-width='4'/>
      <line x1='18' y1='56' x2='102' y2='56' stroke='#8a5a10' stroke-width='4'/>
      <rect x='52' y='50' width='16' height='12' rx='3' fill='#fff1c0' stroke='#8a5a10' stroke-width='3'/>
    </svg>`);

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
      { text: "What is your dream holiday? Where would you go?", image: SUITCASE_IMG },
      { text: "Describe the weather today." },
      { text: "Talk about a hobby you enjoy in your free time." },
      { text: "What is your favourite subject at school and why?" },
      { text: "Describe a person in your family." },
      { text: "Talk about a film or show you watched recently." },
      { text: "What would you do with a million dollars?" }
    ]
  }
};
