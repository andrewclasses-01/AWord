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

import { sound as coreSound } from "../../core/sound.js";

function urlFor(name) { return new URL(`./sounds/${name}.mp3`, import.meta.url).href; }

const cache = new Map();
function audioFor(name) {
  let a = cache.get(name);
  if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
  return a;
}

function playFile(name) {
  if (coreSound.isMuted()) return;
  try {
    const a = audioFor(name);
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch { /* ignore if the browser blocks audio */ }
}

// One random file from a same-purpose pool — never the same one twice in a
// row, so rapid repeats (dragging several words fast) don't sound identical.
function makePool(names) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i]);
  };
}

export const unjumbleSound = {
  pickup: makePool(["pickup1", "pickup2", "pickup3", "pickup4", "pickup5", "pickup6", "pickup7", "pickup8"]),
  drop: makePool(["drop1", "drop2", "drop3", "drop4", "drop5", "drop6", "drop7", "drop8"]),
  correct: makePool(["correct1", "correct2", "correct3", "correct4"]),
  fastCorrect: makePool(["fastcorrect1", "fastcorrect2", "fastcorrect3", "fastcorrect4"]),
  wrong: makePool(["incorrect1", "incorrect2", "incorrect3", "incorrect4"]),
  fastWrong: makePool(["fastincorrect1", "fastincorrect2", "fastincorrect3", "fastincorrect4"]),
  perfect: () => playFile("perfect"),
  play: () => playFile("intro"),
  restart: () => playFile("restart"),
  timeWarning: () => playFile("timesup"),
  complete: () => playFile("gamecompleted")
};
