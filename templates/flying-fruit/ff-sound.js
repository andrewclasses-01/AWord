// =============================================================
// FLYING FRUIT SOUNDS — real mp3 effects sourced directly from Wordwall's own
// "Flying Fruit" JUNGLE theme (see
//   D:\APP AND DATA\AWord-data\Source\Sound effect\FLYING FRUIT\GHI CHU.md
// for where each file came from). Own copy under ./sounds/ — every template
// stays self-contained (same pool/mute pattern as wam-sound.js / ftm-sound.js).
//
// The Jungle theme has NO "Go" and NO "ClockTick" sound (unlike Whack-a-mole's
// Wild West theme) — so there is no countdown-tick here.
//
// Frog / Toucan / Monkey are the ambient jungle-creature sounds; they fire
// occasionally to bring the night scene alive (kept quiet, and muted with the
// global sound toggle like everything else).
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. ./sounds/music.mp3 is in the folder but this template never
// plays it, so it is left out and never downloaded.
const pack = createPack(import.meta.url, {
  names: ["intro", "restart", "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "timesup", "gamecompleted", "gameover", "leaderboard", "menu", "reveal",
          "frog", "toucan", "monkey"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "frog", "toucan", "monkey"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const ffSound = {
  // engine lifecycle hooks (registerTemplate.sounds)
  intro: () => playFile("intro"),         // 01 — Play pressed
  restart: () => playFile("restart"),     // Start again
  complete: () => {},                     // outcome sound is played by the template itself
                                          //   (win / lose / time each differ) — no-op here so the
                                          //   engine's celebration doesn't force one fixed sound.

  // in-game one-shots
  correct: makePool(["correct-01", "correct-02", "correct-03"]),     // 03 — tapped the correct fruit
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])), // 04 — tapped a wrong fruit
  timesUp: () => playFile("timesup"),     // 05 — countdown ran out
  won: () => playFile("gamecompleted"),   // 06 — answered them all
  gameOver: () => playFile("gameover"),   // 07 — lost all lives
  leaderboard: () => playFile("leaderboard"), // 08 — leaderboard screen
  menu: () => playFile("menu"),           // 10 — menu opened
  reveal: () => playFile("reveal"),       // 11 — Show answers

  // ambient jungle creatures (quiet)
  frog: () => playFile("frog", 0.4),
  toucan: () => playFile("toucan", 0.4),
  monkey: () => playFile("monkey", 0.4)
};
