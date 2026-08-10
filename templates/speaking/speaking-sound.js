// =============================================================
// SPEAKING SOUNDS — the teacher asked (11/8/2026) to drop the engine's
// default "Oh my god" wrong-answer meme for this template and use the
// characteristic sounds the other templates already ship instead. This is
// the classic Wordwall "classic2" pack — the same set Type the answer and
// Quiz use — with our own copies under ./sounds/ (self-contained, the
// project convention: every template carries its own audio so a rename or
// removal of another template can never silence this one). Source files
// copied from templates/type-the-answer/sounds/ (originals documented in
// D:\APP AND DATA\AWord-data\Source\Sound effect\TYPE THE ANSWER\GHI CHU.md).
//
// Same pool/prime pattern as type-the-answer-sound.js (see core/sfx.js for
// why prime() at import time matters — first-play lag).
// =============================================================

import { createPack } from "../../core/sfx.js";

const pack = createPack(import.meta.url, {
  names: ["intro-01",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gamecompleted-01", "restart-01"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03"]
});
pack.prime();

export const spkSound = {
  intro:    () => pack.play("intro-01"),          // Play pressed
  correct:  pack.pool(["correct-01", "correct-02", "correct-03"]),        // pronunciation passed
  wrong:    pack.pool(["incorrect-01", "incorrect-02", "incorrect-03"]),  // below the pass threshold
  complete: () => pack.play("gamecompleted-01"),  // finished every word
  restart:  () => pack.play("restart-01")         // Start again
};
