// =============================================================
// ANAGRAM SOUNDS — real mp3 sound effects for this template only (not
// core/sound.js's synthesized tones). Files live in ./sounds/, resolved
// relative to THIS file (import.meta.url) so they work from any page depth
// or host subpath — same pattern as core/sound.js's wrong() file.
// Respects the shared mute toggle via core/sound.js's isMuted().
// =============================================================

import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — files are fetched AT IMPORT TIME (prime() below), before
// the READY screen, instead of on their own first play. `hot` = the effects
// that fire while playing. See core/sfx.js.
const pack = createPack(import.meta.url, {
  names: ["blocktiledrop1", "blocktiledrop2", "blocktiledrop3",
          "blocktilepickup1", "blocktilepickup2", "blocktilepickup3",
          "blockchipminor1", "blockchipminor2", "blockchipminor3",
          "blockchipfail1", "blockchipfail2", "blockchipfail3",
          "blockchipmajor", "blockchipminorfast",
          "blockgameintro1", "blockgamerestart", "blockgametimeout", "blockgamesuccessful"],
  hot:   ["blocktiledrop1", "blocktiledrop2", "blocktiledrop3",
          "blocktilepickup1", "blocktilepickup2", "blocktilepickup3",
          "blockchipminorfast", "blockchipfail1", "blockchipfail2", "blockchipfail3"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const anagramSound = {
  place: makePool(["blocktiledrop1", "blocktiledrop2", "blocktiledrop3"]),
  wrongPick: makePool(["blockchipfail1", "blockchipfail2", "blockchipfail3"]),
  pickup: makePool(["blocktilepickup1", "blocktilepickup2", "blocktilepickup3"]),
  submitWordCorrect: makePool(["blockchipminor1", "blockchipminor2", "blockchipminor3"]),
  wordCompleteBonus: () => playFile("blockchipmajor"),
  submitTileCorrect: () => playFile("blockchipminorfast"),
  play: () => playFile("blockgameintro1"),
  restart: () => playFile("blockgamerestart"),
  timeWarning: () => playFile("blockgametimeout"),
  complete: () => playFile("blockgamesuccessful"),
  // Real length of the "Play" chime (10/8/2026) — anagram.js delays the
  // FIRST word's auto-played pronunciation clip by this long, so it never
  // talks over this intro sound. The file is already primed (loaded) well
  // before the teacher can press Play, so the real duration is available;
  // the fallback only matters on a very slow connection where metadata
  // hasn't arrived yet.
  introDurationMs: (fallbackMs = 700) => pack.durationMs("blockgameintro1", fallbackMs)
};
