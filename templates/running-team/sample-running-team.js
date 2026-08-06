// =============================================================
// SAMPLE — Running team.
// The same real vocabulary pool Running word's sample uses (the IELTS "soap and
// bathing" lesson Teacher Andrew ran from a spreadsheet), trimmed to 40 words so
// a demo round is short. In class the pool comes straight from a lesson file's
// WORDTABLE — typically 80-100 words.
//
// ⚠️ UNLIKE Running word's sample, this one DOES ship a saved game set. That is
// deliberate, not a stale leftover: a Running team round cannot start without a
// class roll, and the roll lives in Settings > Classes behind the teacher's
// Google sign-in. Without a set baked in here, `test.html` — the page used to
// build and regression-test this template, which never signs in — could reach
// the setup screen and go no further. The names below are obviously a demo roll,
// and a real round always deals its own set from a real class.
// =============================================================

const WORDS = [
  "CYLINDER", "LUXURIOUS", "NECESSITY", "PUMICE", "AQUEDUCT",
  "STIR", "LIGHTEN", "INVENT", "STRIGIL", "ALKALI",
  "OUTLAW", "EPIDEMIC", "SODIUM", "CIVILISATION", "INSCRIPTION",
  "GLYCERINE", "FATTY", "PREHISTORIC", "CARBONATE", "OBEDIENCE",
  "SANITARY", "CLEANLINESS", "RESERVATION", "SCRAPE", "ANOINT",
  "INSCRIBE", "REINFORCE", "HYGIENE", "OUTBREAK", "BATHE",
  "CLEANSE", "PLAGUE", "FETCH", "LAVISH", "RINSE",
  "SCARCE", "DOWNHILL", "SKIN-SCRAPER", "LARGE-SCALE", "WASH DOWN"
];

// One fixed numbering — this is what a printed sheet would say. Kept as an
// explicit list rather than a shuffle at import time so the demo sheet and the
// demo game always agree, however many times the page is reloaded.
const ORDER = [
  "SCRAPE", "OUTLAW", "HYGIENE", "CYLINDER", "BATHE",
  "INSCRIBE", "ALKALI", "PLAGUE", "STIR", "CLEANLINESS",
  "PUMICE", "OUTBREAK", "SODIUM", "LAVISH", "INSCRIPTION",
  "FETCH", "PREHISTORIC", "RINSE", "CARBONATE", "SCARCE",
  "NECESSITY", "CLEANSE", "GLYCERINE", "ANOINT", "AQUEDUCT",
  "FATTY", "REINFORCE", "DOWNHILL", "LUXURIOUS", "STRIGIL",
  "EPIDEMIC", "SANITARY", "INVENT", "OBEDIENCE", "LIGHTEN",
  "CIVILISATION", "RESERVATION", "SKIN-SCRAPER", "LARGE-SCALE", "WASH DOWN"
];

const NAMES = [
  "MINH ANH", "BAO NAM", "THUY LINH", "GIA HUY", "NGOC MAI",
  "QUANG DUNG", "PHUONG VY", "TUAN KIET", "HA VY", "DUC ANH"
];

export const activity = {
  id: "sample-running-team",
  type: "running_team",
  schemaVersion: 1,
  title: "Running team — Soap & bathing",
  instruction: "The named pupil reads their number off the sheet; the class picks that word from the six.",
  theme: "classic",
  options: {
    timer: "none",              // the game runs its OWN two clocks
    mainSeconds: 600,            // 10:00 for the whole round
    questionSeconds: 15,
    lives: 3                     // 0 would mean unlimited
  },
  content: {
    words: WORDS,
    gameSets: [
      {
        order: ORDER,
        classId: "",             // a demo roll, not a real saved class
        className: "DEMO",
        studentIds: NAMES.map((_, i) => `st_demo_${i}`),
        studentNames: NAMES
      }
    ]
  }
};
