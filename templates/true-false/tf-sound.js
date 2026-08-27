// =============================================================
// TRUE FALSE SOUNDS — real mp3 effects sourced directly from Wordwall's own
// "True or false" activity (internally the "boolean" game), which uses the
// SAME classic2 sound set as "Find the match" (both are "conveyor belt"
// games). See D:\APP AND DATA\AWord-data\Source\Sound effect\TRUE FALSE\
// GHI CHU.md for where each file came from. Own copy under ./sounds/
// (not cross-imported — every template stays self-contained).
//
// Same pool/mute pattern as ftm-sound.js / anagram-sound.js / otb-sound.js.
//
// Wordwall's own source splits "ConveyorItemCentred" into 4 identical files
// (not a mistake, per the source GHI CHU) — we only kept one copy.
//
// NOT wired up (no engine hook exists for these yet — would need
// "ĐỀ XUẤT SỬA CORE" if the teacher wants them): Menu, Leaderboard,
// RevealAnswers. Their source files were left uncopied.
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. This game ticks the clock every second, so clocktick is hot.
const pack = createPack(import.meta.url, {
  names: ["intro", "go", "conveyorappear", "conveyorcentred", "conveyorleave",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gamecompleted", "gameover", "timesup", "restart", "clocktick"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "conveyorappear", "conveyorcentred", "conveyorleave", "clocktick"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const tfSound = {
  intro: () => playFile("intro"),                                  // 01 — Play pressed
  go: () => playFile("go"),                                        // 05 — the very first statement starts its cycle
  conveyorAppear: () => playFile("conveyorappear"),                // 02 — a statement starts entering from the left
  conveyorCentred: () => playFile("conveyorcentred"),              // 03 — a statement finishes arriving at the centre
  conveyorLeave: () => playFile("conveyorleave"),                  // 04 — a statement starts drifting away to the right
  correct: makePool(["correct-01", "correct-02", "correct-03"]),   // 07 — answered True/False correctly
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])), // 08 — answered wrong
  gameCompleted: () => playFile("gamecompleted"),                  // 09 — answered every statement before losing
  gameOver: () => playFile("gameover"),                            // 10 — lost all lives before finishing
  timesUp: () => playFile("timesup"),                              // 11 — countdown reached 0 before finishing
  restart: () => playFile("restart"),                              // 12 — "Start again"
  clockTick: () => playFile("clocktick")                           // 06 — once per second while the timer runs
};
