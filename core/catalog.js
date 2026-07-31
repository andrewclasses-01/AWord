// =============================================================
// CATALOG — the single list of activity ("act") TYPES the app knows about.
// One source of truth shared by the home-page "New activity" picker and the
// in-game Template panel. `built:true` = playable now; others show "coming soon".
// =============================================================

export const TEMPLATES = [
  { type: "quiz",            label: "Quiz",            built: true,
    blurb: "Multiple-choice questions. Tap the correct answer." },
  { type: "anagram",         label: "Anagram",         built: true,
    blurb: "Tap the letters into the right order." },
  { type: "find_the_match",  label: "Find the match",  built: true,
    blurb: "Read the definition, tap the matching word." },
  { type: "type_the_answer", label: "Type the answer", built: true,
    blurb: "Type the answer to each question." },
  { type: "open_the_box",    label: "Open the box",    built: true,
    blurb: "Tap each box to reveal what's inside." },
  { type: "true_false",      label: "True or false",   built: true,
    blurb: "Read the statement, then tap True or False." }
];

export function templateLabel(type) {
  const t = TEMPLATES.find(x => x.type === type);
  return t ? t.label : (type || "Activity");
}
