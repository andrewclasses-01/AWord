// =============================================================
// GROUP SORT SOUNDS — the same "conveyor belt" (classic2) set True or false
// and Find the match use: the tap mode of this game IS a conveyor (one item
// glides in, you tap its group), so the same cues fit. Own copy under
// ./sounds/ — every template stays self-contained (never cross-import).
// Same pool/mute pattern as tf-sound.js / ftm-sound.js.
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

const pack = createPack(import.meta.url, {
  names: ["intro", "go", "conveyorappear", "conveyorcentred", "conveyorleave",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gamecompleted", "gameover", "timesup", "restart", "clocktick"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "conveyorappear", "conveyorcentred", "conveyorleave", "clocktick"]
});
const playFile = pack.play;
const makePool = pack.pool;
pack.prime();

export const gsSound = {
  intro: () => playFile("intro"),
  go: () => playFile("go"),
  conveyorAppear: () => playFile("conveyorappear"),
  conveyorCentred: () => playFile("conveyorcentred"),
  conveyorLeave: () => playFile("conveyorleave"),
  pickup: () => playFile("conveyorappear", 0.5),      // drag mode: a chip lifted
  correct: makePool(["correct-01", "correct-02", "correct-03"]),
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])),
  gameCompleted: () => playFile("gamecompleted"),
  gameOver: () => playFile("gameover"),
  restart: () => playFile("restart"),
  clockTick: () => playFile("clocktick")
};
