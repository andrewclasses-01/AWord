// =============================================================
// UNJUMBLE SOUNDS — real mp3 sound effects for this template only (same
// pattern as templates/anagram/anagram-sound.js). Files live in ./sounds/,
// resolved relative to THIS file (import.meta.url) so they work from any
// page depth or host subpath. Respects the shared mute toggle via
// core/sound.js's isMuted().
//
// The mp3s are the REAL Wordwall "Whiteboard" theme sounds (= the "Classic"
// look Teacher Andrew chose for Unjumble). The event→file mapping below is
// taken straight from the theme's own Audios.json manifest — see
// D:\APP AND DATA\AWord-data\Source\Sound effect\UNJUMBLE\00 - GHI CHU NGUON.
//   pickup  = whiteboardpickup1..8   (nhấc 1 từ lên để kéo)
//   drop    = whiteboarddrop1..8     (thả 1 từ xuống)
//   correct = ChipMinor1..4          (1 từ vào đúng chỗ)
//   fastCorrect = ChipMinorFast1..4  (nhiều từ đúng liên tiếp — On submit)
//   wrong   = ChipFail1..4           (từ sai chỗ)
//   fastWrong = ChipFailFast1..4     (nhiều từ sai liên tiếp — On submit)
//   perfect = whiteboardchipmajor    (cả câu đúng hết — bonus for perfect)
//   play/restart/timeWarning/complete = intro/restart/timesup/gamesuccessful
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. This is the biggest one-shot pack (37 files: 8 pickups,
// 8 drops, 4×4 verdicts) and every one of them fires while dragging words, so
// almost the whole pack is hot.
const pack = createPack(import.meta.url, {
  names: ["pickup1", "pickup2", "pickup3", "pickup4", "pickup5", "pickup6", "pickup7", "pickup8",
          "drop1", "drop2", "drop3", "drop4", "drop5", "drop6", "drop7", "drop8",
          "correct1", "correct2", "correct3", "correct4",
          "fastcorrect1", "fastcorrect2", "fastcorrect3", "fastcorrect4",
          "incorrect1", "incorrect2", "incorrect3", "incorrect4",
          "fastincorrect1", "fastincorrect2", "fastincorrect3", "fastincorrect4",
          "perfect", "intro", "restart", "timesup", "gamecompleted"],
  hot:   ["pickup1", "pickup2", "pickup3", "pickup4",
          "drop1", "drop2", "drop3", "drop4",
          "correct1", "correct2", "incorrect1", "incorrect2",
          "fastcorrect1", "fastincorrect1"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const unjumbleSound = {
  pickup: makePool(["pickup1", "pickup2", "pickup3", "pickup4", "pickup5", "pickup6", "pickup7", "pickup8"]),
  drop: makePool(["drop1", "drop2", "drop3", "drop4", "drop5", "drop6", "drop7", "drop8"]),
  correct: makePool(["correct1", "correct2", "correct3", "correct4"]),
  fastCorrect: makePool(["fastcorrect1", "fastcorrect2", "fastcorrect3", "fastcorrect4"]),
  wrong: wrapWrong(makePool(["incorrect1", "incorrect2", "incorrect3", "incorrect4"])),
  fastWrong: makePool(["fastincorrect1", "fastincorrect2", "fastincorrect3", "fastincorrect4"]),
  perfect: () => playFile("perfect"),
  play: () => playFile("intro"),
  restart: () => playFile("restart"),
  timeWarning: () => playFile("timesup"),
  complete: () => playFile("gamecompleted")
};
