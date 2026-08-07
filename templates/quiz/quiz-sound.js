// =============================================================
// QUIZ SOUNDS — real mp3 sound effects for this template only (not
// core/sound.js's synthesized tones). Files live in ./sounds/, resolved
// relative to THIS file (import.meta.url) so they work from any page depth
// or host subpath — same pattern as core/sound.js's wrong() file and
// templates/anagram/anagram-sound.js.
// Respects the shared mute toggle via core/sound.js's isMuted().
// =============================================================

import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — the pack is now fetched AT IMPORT TIME (prime() below),
// which `ensureTemplate()` runs before the READY screen is drawn, instead of
// each file being fetched on its own first play. Measured on the live site:
// first play went from 67–363 ms down to 8 ms. `hot` = the effects that fire
// during play, so they are queued first. See core/sfx.js for the full story.
const pack = createPack(import.meta.url, {
  names: ["blockchipminor1", "blockchipminor2", "blockchipminor3",
          "blockchipfail1", "blockchipfail2", "blockchipfail3",
          "blockgameintro1", "blockgamerestart", "blockgametimeout", "blockgamesuccessful"],
  hot:   ["blockchipminor1", "blockchipminor2", "blockchipminor3",
          "blockchipfail1", "blockchipfail2", "blockchipfail3"]
});
// Same names + same signatures as the hand-rolled helpers this replaced, so the
// export block below is untouched.
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const quizSound = {
  correct: makePool(["blockchipminor1", "blockchipminor2", "blockchipminor3"]),
  wrong: makePool(["blockchipfail1", "blockchipfail2", "blockchipfail3"]),
  play: () => playFile("blockgameintro1"),
  restart: () => playFile("blockgamerestart"),
  timeWarning: () => playFile("blockgametimeout"),
  complete: () => playFile("blockgamesuccessful"),
  // Ran out of lives (Lives option, 4/8/2026) — the pack has no dedicated
  // "game over" file, so the timeout cue stands in for it: a flat ending, not
  // the success fanfare.
  gameOver: () => playFile("blockgametimeout")
};
