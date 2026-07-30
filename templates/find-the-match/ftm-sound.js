// =============================================================
// FIND THE MATCH SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Find the match" theme (see D:\APP AND DATA\AWord-data\Source\Sound
// effect\FIND THE MATCH\GHI CHU.md for where each file came from), own copy
// under ./sounds/ (not cross-imported — every template stays self-contained).
// Same pool/mute pattern as anagram-sound.js / otb-sound.js.
//
// Wordwall's own source splits "ConveyorItemCentred" into 4 identical files
// (not a mistake, per the source GHI CHU) — we only kept one copy.
//
// NOT wired up (no engine hook exists for these yet — would need
// "ĐỀ XUẤT SỬA CORE" if the teacher wants them): Menu, Leaderboard,
// RevealAnswers. Their source files were left uncopied.
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

function makePool(names) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i]);
  };
}

export const ftmSound = {
  intro: () => playFile("intro"),                                // 01 — Play pressed
  go: () => playFile("go"),                                       // 05 — the very first prompt starts its cycle
  conveyorAppear: () => playFile("conveyorappear"),                // 02 — a prompt starts entering from the left
  conveyorCentred: () => playFile("conveyorcentred"),              // 03 — a prompt finishes arriving at the centre
  conveyorLeave: () => playFile("conveyorleave"),                  // 04 — a prompt starts drifting away to the right
  correct: makePool(["correct-01", "correct-02", "correct-03"]),   // 07 — correct match
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]), // 08 — wrong tap
  gameCompleted: () => playFile("gamecompleted"),                  // 09 — cleared every pair before losing
  gameOver: () => playFile("gameover"),                            // 10 — lost all lives before finishing
  timesUp: () => playFile("timesup"),                              // 11 — countdown reached 0 before finishing
  restart: () => playFile("restart"),                              // 12 — "Start again"
  clockTick: () => playFile("clocktick")                           // 06 — once per second while the timer runs
};
