// =============================================================
// Sample OPEN THE BOX content (English) — used by test.html and the home page.
// CONVENTION: every template's sample data file exports
//   `export const activity = {...}`  (standard name).
// This is an OPEN-ENDED template (scorable:false) — no timer/lives/marking,
// used for live-class activities (e.g. drawing a random speaking prompt).
// =============================================================

export const activity = {
  id: "act_sample_otb",
  schemaVersion: 1,
  type: "open_the_box",
  title: "SPEAKING PROMPTS — Open the box",
  instruction: "Tap a box to reveal a speaking prompt.",
  theme: "classic",
  options: {
    timer: "none",
    shuffleQuestions: true,
    columns: null,
    boxesAutoClose: false
  },
  content: {
    mode: "simple",
    items: [
      { text: "Tell me about your family." },
      { text: "What did you do last weekend?" },
      { text: "Describe your favourite food." },
      { text: "What is your dream job? Why?" },
      { text: "Talk about a place you want to visit." },
      { text: "What do you usually do after school?" },
      { text: "Describe your best friend." },
      { text: "What is your favourite season? Why?" },
      { text: "Talk about a hobby you enjoy." }
    ]
  }
};
