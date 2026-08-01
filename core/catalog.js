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
    blurb: "Read the statement, then tap True or False." },
  { type: "gameshow",        label: "Gameshow quiz",   built: true,
    blurb: "Quiz with a time limit, lifelines and bonus points." },
  { type: "maze_chase",      label: "Maze chase",      built: true,
    blurb: "Run through the maze to the correct answer, dodging the enemies." },
  { type: "whack_a_mole",    label: "Whack-a-mole",    built: true,
    blurb: "Moles pop up one at a time — whack only the correct ones." },
  { type: "flying_fruit",    label: "Flying fruit",    built: true,
    blurb: "Tap the answer as it flies past." },
  { type: "balloon_pop",     label: "Balloon pop",     built: true,
    blurb: "Pop the balloon carrying the matching word." },
  { type: "crossword",       label: "Crossword",       built: true,
    blurb: "Type the answers into the grid using the clues." },
  { type: "unjumble",        label: "Unjumble",        built: true,
    blurb: "Drag the words into the right order to build the sentence." },
  { type: "speaking_cards",  label: "Speaking cards",  built: true,
    blurb: "Deal cards at random for speaking practice." }
];

export function templateLabel(type) {
  const t = TEMPLATES.find(x => x.type === type);
  return t ? t.label : (type || "Activity");
}
