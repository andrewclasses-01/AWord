// =============================================================
// CATALOG — the single list of activity ("act") TYPES the app knows about.
// One source of truth shared by the home-page "New activity" picker and the
// in-game Template panel. `built:true` = playable now; others show "coming soon".
// =============================================================

export const TEMPLATES = [
  { type: "quiz",            label: "Quiz",            built: true,
    blurb: "Multiple-choice questions. Tap the correct answer." },
  { type: "anagram",         label: "Anagram",         built: false,
    blurb: "Drag the letters into the right order." },
  { type: "find_the_match",  label: "Find the match",  built: false,
    blurb: "Tap matching pairs to make them disappear." },
  { type: "type_the_answer", label: "Type the answer", built: false,
    blurb: "Type the answer to each question." },
  { type: "open_the_box",    label: "Open the box",    built: false,
    blurb: "Tap each box to reveal what's inside." }
];

export function templateLabel(type) {
  const t = TEMPLATES.find(x => x.type === type);
  return t ? t.label : (type || "Activity");
}
