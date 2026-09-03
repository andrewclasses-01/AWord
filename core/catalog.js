// =============================================================
// CATALOG — the single list of activity ("act") TYPES the app knows about.
// One source of truth shared by the home-page "New activity" picker, the
// in-game Template panel, and the on-demand loader in core/registry.js.
// `built:true` = playable now; others show "coming soon".
//
// Each built entry also says HOW to load itself:
//   load()  -> the template module (it calls registerTemplate() on import,
//              and pulls in its own editor + sounds)
//   css     -> its stylesheet, path relative to the PAGE (index.html /
//              play.html both sit at the web root)
//   sample() -> the ready-made demo act, used for seeding and test pages
// Nothing imports these eagerly: `ensureTemplate(type)` in core/registry.js
// runs them the first time a type is actually played or edited, so a student
// opening one assignment downloads ONE game, not fourteen.
//
// Adding a template = ONE entry here. No page, no import list to touch.
// =============================================================

export const TEMPLATES = [
  { type: "quiz",            label: "Quiz",            built: true,
    blurb: "Multiple-choice questions. Tap the correct answer.",
    css: "templates/quiz/quiz.css",
    load: () => import("../templates/quiz/quiz.js"),
    sample: () => import("../templates/quiz/sample-quiz.js") },

  { type: "anagram",         label: "Anagram",         built: true,
    blurb: "Tap the letters into the right order.",
    css: "templates/anagram/anagram.css",
    load: () => import("../templates/anagram/anagram.js"),
    sample: () => import("../templates/anagram/sample-anagram.js") },

  { type: "find_the_match",  label: "Find the match",  built: true,
    blurb: "Read the definition, tap the matching word.",
    css: "templates/find-the-match/find-the-match.css",
    load: () => import("../templates/find-the-match/find-the-match.js"),
    sample: () => import("../templates/find-the-match/sample-find-the-match.js") },

  { type: "type_the_answer", label: "Type the answer", built: true,
    blurb: "Type the answer to each question.",
    css: "templates/type-the-answer/type-the-answer.css",
    load: () => import("../templates/type-the-answer/type-the-answer.js"),
    sample: () => import("../templates/type-the-answer/sample-type-the-answer.js") },

  { type: "open_the_box",    label: "Open the box",    built: true,
    blurb: "Tap each box to reveal what's inside.",
    css: "templates/open-the-box/open-the-box.css",
    load: () => import("../templates/open-the-box/open-the-box.js"),
    sample: () => import("../templates/open-the-box/sample-open-the-box.js") },

  // ⭐ Đợt 288 (03/9/2026) — Wordwall's Group sort + Speed sorting in one game
  // (options.mode "tap" / "drag"). Built for the NEN TANG TIENG ANH course.
  { type: "group_sort",      label: "Group sort",      built: true,
    blurb: "Put each item into the right group — tap the group, or drag it in.",
    css: "templates/group-sort/group-sort.css",
    load: () => import("../templates/group-sort/group-sort.js"),
    sample: () => import("../templates/group-sort/sample-group-sort.js") },

  { type: "true_false",      label: "True or false",   built: true,
    blurb: "Read the statement, then tap True or False.",
    css: "templates/true-false/true-false.css",
    load: () => import("../templates/true-false/true-false.js"),
    sample: () => import("../templates/true-false/sample-true-false.js") },

  { type: "gameshow",        label: "Gameshow quiz",   built: true,
    blurb: "Quiz with a time limit, lifelines and bonus points.",
    css: "templates/gameshow/gameshow.css",
    load: () => import("../templates/gameshow/gameshow.js"),
    sample: () => import("../templates/gameshow/sample-gameshow.js") },

  { type: "maze_chase",      label: "Maze chase",      built: true,
    blurb: "Run through the maze to the correct answer, dodging the enemies.",
    css: "templates/maze-chase/maze-chase.css",
    load: () => import("../templates/maze-chase/maze-chase.js"),
    sample: () => import("../templates/maze-chase/sample-maze-chase.js") },

  { type: "whack_a_mole",    label: "Whack-a-mole",    built: true,
    blurb: "Moles pop up one at a time — whack only the correct ones.",
    css: "templates/whack-a-mole/whack-a-mole.css",
    load: () => import("../templates/whack-a-mole/whack-a-mole.js"),
    sample: () => import("../templates/whack-a-mole/sample-whack-a-mole.js") },

  { type: "flying_fruit",    label: "Flying fruit",    built: true,
    blurb: "Tap the answer as it flies past.",
    css: "templates/flying-fruit/flying-fruit.css",
    load: () => import("../templates/flying-fruit/flying-fruit.js"),
    sample: () => import("../templates/flying-fruit/sample-flying-fruit.js") },

  { type: "balloon_pop",     label: "Balloon pop",     built: true,
    blurb: "Pop the balloon carrying the matching word.",
    css: "templates/balloon-pop/balloon-pop.css",
    load: () => import("../templates/balloon-pop/balloon-pop.js"),
    sample: () => import("../templates/balloon-pop/sample-balloon-pop.js") },

  { type: "crossword",       label: "Crossword",       built: true,
    blurb: "Type the answers into the grid using the clues.",
    css: "templates/crossword/crossword.css",
    load: () => import("../templates/crossword/crossword.js"),
    sample: () => import("../templates/crossword/sample-crossword.js") },

  { type: "unjumble",        label: "Unjumble",        built: true,
    blurb: "Drag the words into the right order to build the sentence.",
    css: "templates/unjumble/unjumble.css",
    load: () => import("../templates/unjumble/unjumble.js"),
    sample: () => import("../templates/unjumble/sample-unjumble.js") },

  { type: "speaking_cards",  label: "Speaking cards",  built: true,
    blurb: "Deal cards at random for speaking practice.",
    css: "templates/speaking-cards/speaking-cards.css",
    load: () => import("../templates/speaking-cards/speaking-cards.js"),
    sample: () => import("../templates/speaking-cards/sample-speaking-cards.js") },

  { type: "running_word",    label: "Running word",    built: true,
    blurb: "Two teams race on a chess clock — explain the word, spell it, pass the turn.",
    css: "templates/running-word/running-word.css",
    load: () => import("../templates/running-word/running-word.js"),
    sample: () => import("../templates/running-word/sample-running-word.js") },

  { type: "running_team",    label: "Running team",    built: true,
    blurb: "The class races one clock: a named pupil reads a number off the paper, the rest pick that word from six look-alikes.",
    css: "templates/running-team/running-team.css",
    load: () => import("../templates/running-team/running-team.js"),
    sample: () => import("../templates/running-team/sample-running-team.js") },

  { type: "speaking",        label: "Speaking",        built: true,
    blurb: "Say each word into the mic — an AI grades your pronunciation.",
    css: "templates/speaking/speaking.css",
    load: () => import("../templates/speaking/speaking.js"),
    sample: () => import("../templates/speaking/sample-speaking.js") }
];

export function templateEntry(type) {
  return TEMPLATES.find(x => x.type === type) || null;
}

export function templateLabel(type) {
  const t = templateEntry(type);
  return t ? t.label : (type || "Activity");
}

// ⭐ Đợt 148 — ONE icon per act type, in the one place that already lists the
// types. Both the in-game Template picker (core/engine.js) and the Import
// dialog's rows (main.js) read this; before, main.js kept a private map of its
// own and the Template picker had no icons at all, so a new template could show
// up iconless in one place and lettered in the other.
// A few games deliberately SHARE an icon: Gameshow and Maze chase are quizzes
// with a different skin, Flying fruit unscrambles like Anagram, Speaking cards
// and Speaking both put a microphone in front of the class. Sharing is fine;
// having none is not.
export const TEMPLATE_ICON = {
  quiz: "fmtQuiz", gameshow: "fmtQuiz",
  anagram: "fmtAnagram", flying_fruit: "fmtFruit",
  find_the_match: "link", balloon_pop: "fmtBalloon",
  type_the_answer: "keyboard", crossword: "fmtCrossword", unjumble: "fmtUnjumble",
  open_the_box: "fmtBox", maze_chase: "fmtMaze", whack_a_mole: "fmtMole",
  true_false: "check",
  speaking_cards: "mic", speaking: "mic",
  running_word: "fmtRace", running_team: "fmtRace"
};

// The icon MARKUP for a type. `icons` is passed in rather than imported so this
// module stays the plain data list it has always been.
export function templateIcon(icons, type) {
  return icons[TEMPLATE_ICON[type]] || icons.template;
}
