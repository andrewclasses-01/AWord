// =============================================================
// FIND THE GAP SOUNDS — the "conveyor belt" (classic2) set Find the match /
// True or false / Speed sorting share, own copy under ./sounds/ (every
// template stays self-contained — never cross-import another's pack).
// The listening passage itself is NOT here: it is a whole mp3 played by
// ftg-audio.js, not an sfx.
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

const pack = createPack(import.meta.url, {
  names: ["intro", "go", "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gamecompleted", "gameover", "timesup", "restart", "clocktick"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03", "clocktick"]
});
const playFile = pack.play;
const makePool = pack.pool;
pack.prime();

export const ftgSound = {
  intro: () => playFile("intro"),
  go: () => playFile("go"),
  correct: makePool(["correct-01", "correct-02", "correct-03"]),
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])),
  gameCompleted: () => playFile("gamecompleted"),
  gameOver: () => playFile("gameover"),
  timesUp: () => playFile("timesup"),
  restart: () => playFile("restart"),
  clockTick: () => playFile("clocktick")
};
