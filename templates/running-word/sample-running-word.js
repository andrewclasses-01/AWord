// =============================================================
// SAMPLE — Running word.
// A real vocabulary pool (the IELTS "soap and bathing" lesson Teacher Andrew
// used to run this game from a spreadsheet), trimmed to 40 words so the demo
// round is short enough to play through on a test page. In class the pool comes
// straight from a lesson file's WORDTABLE — typically 80-100 words.
//
// No `printSets` here on purpose: a fresh act should shuffle its own pair of
// lists the first time it is opened, so the sample never ships a stale split.
// =============================================================

export const activity = {
  id: "sample-running-word",
  type: "running_word",
  schemaVersion: 1,
  title: "Running word — Soap & bathing",
  instruction: "Explainer describes the word, typer spells it. Correct spelling flips the clock.",
  theme: "classic",
  options: {
    timer: "none",              // the game runs its OWN two clocks
    teamAName: "TEAM A",
    teamBName: "TEAM B",
    clockSeconds: 300,           // 5:00 each
    incrementSeconds: 0,         // Fischer bonus per correct word (0 = off)
    allowPass: true,
    passPenaltySeconds: 10,
    andrewUses: 1,               // one lifeline per team for the whole match
    warnSeconds: 15
  },
  content: {
    // A mix of {word, ipa} and bare strings (11/8/2026 — IPA is optional):
    // exercises both the "has IPA" and "no IPA" paths on the printed sheets
    // and the in-game reveal at once, same as a real teacher's pool will
    // once some rows are filled in and others aren't.
    words: [
      { word: "CYLINDER", ipa: "/sɪˈlɪndə/" }, "LUXURIOUS", { word: "NECESSITY", ipa: "/nəˈsesəti/" }, "PUMICE", "AQUEDUCT",
      { word: "STIR", ipa: "/stɜː/" }, "LIGHTEN", { word: "INVENT", ipa: "/ɪnˈvent/" }, "STRIGIL", "ALKALI",
      "OUTLAW", { word: "EPIDEMIC", ipa: "/ˌepɪˈdemɪk/" }, "SODIUM", { word: "CIVILISATION", ipa: "/ˌsɪvəlaɪˈzeɪʃn/" }, "INSCRIPTION",
      "GLYCERINE", "FATTY", "PREHISTORIC", "CARBONATE", { word: "OBEDIENCE", ipa: "/əˈbiːdiəns/" },
      { word: "SANITARY", ipa: "/ˈsænɪtri/" }, "CLEANLINESS", "RESERVATION", "SCRAPE", "ANOINT",
      "INSCRIBE", "REINFORCE", { word: "HYGIENE", ipa: "/ˈhaɪdʒiːn/" }, "OUTBREAK", "BATHE",
      "CLEANSE", "PLAGUE", "FETCH", "LAVISH", "RINSE",
      "SCARCE", "DOWNHILL", { word: "SKIN-SCRAPER", ipa: "/ˈskɪn ˌskreɪpə/" }, "LARGE-SCALE", "WASH DOWN"
    ]
  }
};
