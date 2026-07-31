// =============================================================
// CROSSWORD SOUNDS — real mp3 effects taken straight from Wordwall's own
// "Crossword" (theme Classic). See
//   D:\APP AND DATA\AWord-data\Source\Sound effect\CROSSWORD\GHI CHU.md
// for exactly where each file came from + which game event it maps to
// (verified by actually playing the Wordwall act and matching durations).
// Own copy under ./sounds/ (self-contained, like quiz-sound.js / anagram-sound.js).
// Respects the shared mute toggle via core/sound.js's isMuted().
//
// Which sound plays where (Classic crossword uses this exact subset):
//   intro        blockgameintro1       — Play pressed
//   correct(x3)  blockchipminor1/2/3   — a word solved correctly (random of 3)
//   wrong(x3)    blockchipfail1/2/3    — a word answered wrong (random of 3)
//   complete     blockgamesuccessful   — game finished / Submit answers
//   timesUp      blockgametimeout      — count-down timer runs out
//   restart      blockgamerestart      — Start again
// (menu/leaderboard/revealanswers are archived in ./sounds/ for completeness but
//  the shared engine owns those screens, so this template does not fire them.)
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

// One random file from a same-purpose pool of 3 — never the same one twice in a
// row, so solving several words in a row doesn't sound robotic.
function makePool(names) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i]);
  };
}

export const crosswordSound = {
  correct: makePool(["correct-01", "correct-02", "correct-03"]),
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]),
  play: () => playFile("intro"),
  restart: () => playFile("restart"),
  timeWarning: () => playFile("timesup"),
  complete: () => playFile("gamecompleted")
};
