// =============================================================
// OPEN THE BOX SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Open the box" theme (see D:\APP AND DATA\Source\Sound effect\OPEN
// THE BOX\GHI CHU.md for where each file came from), own copy under
// ./sounds/ (not cross-imported — every template stays self-contained).
// Same pool/mute pattern as anagram-sound.js.
//
// NOTE on gameOver/timesUp naming (Teacher Andrew's explicit call, 30/7/2026):
// Wordwall's own file itself documents "07 TimesUp" as the clock-hits-0
// *ding*, separate from "06 GameOver" (the lose screen). The teacher asked
// for a DIFFERENT split instead: gameOver = lose (ran out of time before
// finishing), timesUp = the WIN sound (finished every box in time). Built
// exactly as instructed — the original "05 GameCompleted" file is left
// unused as a result (see GHI CHU OPEN-THE-BOX.md).
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. "gamecompleted" sits in ./sounds/ but is deliberately unused
// (see the note above), so it is not listed and never downloaded.
const pack = createPack(import.meta.url, {
  names: ["intro", "openbox-01", "openbox-02", "openbox-03",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gameover", "timesup", "restart", "clocktick", "shuffle",
          "tileappear", "tileeliminate"],
  hot:   ["openbox-01", "openbox-02", "openbox-03",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "clocktick", "tileeliminate"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const otbSound = {
  intro: () => playFile("intro"),                                            // 01 — right when PLAY is pressed, before the grid appears
  openBox: makePool(["openbox-01", "openbox-02", "openbox-03"]),             // 02 — tapping a box open
  correct: makePool(["correct-01", "correct-02", "correct-03"]),             // 03 — correct answer
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])), // 04 — wrong answer
  gameOver: () => playFile("gameover"),                                      // 06 — lose: time ran out before every box was solved
  timesUp: () => playFile("timesup"),                                        // 07 — win: every box solved before time ran out
  restart: () => playFile("restart"),                                        // 08 — "Start again"
  clockTick: () => playFile("clocktick"),                                    // 12 — once per second while the countdown runs
  shuffle: () => playFile("shuffle"),                                        // 13 — box/question order shuffled at the start of a play
  tileAppear: () => playFile("tileappear"),                                  // 14 — grid zooming in right after Play
  tileEliminate: () => playFile("tileeliminate")                             // 15 — a box locks (wrong answer) back on the grid
};
