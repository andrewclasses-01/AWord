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

import { sound as coreSound } from "../../core/sound.js";

function urlFor(name) { return new URL(`./sounds/${name}.mp3`, import.meta.url).href; }

const cache = new Map();
function audioFor(name) {
  let a = cache.get(name);
  if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
  return a;
}

function playFile(name, volume) {
  if (coreSound.isMuted()) return;
  try {
    const a = audioFor(name);
    a.currentTime = 0;
    if (volume != null) a.volume = volume;
    a.play().catch(() => {});
  } catch { /* ignore if the browser blocks audio */ }
}

// Random-variant pool (avoid repeating the same file twice in a row).
function makePool(names, volume) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i], volume);
  };
}

export const ffSound = {
  // engine lifecycle hooks (registerTemplate.sounds)
  intro: () => playFile("intro"),         // 01 — Play pressed
  restart: () => playFile("restart"),     // Start again
  complete: () => {},                     // outcome sound is played by the template itself
                                          //   (win / lose / time each differ) — no-op here so the
                                          //   engine's celebration doesn't force one fixed sound.

  // in-game one-shots
  correct: makePool(["correct-01", "correct-02", "correct-03"]),     // 03 — tapped the correct fruit
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]), // 04 — tapped a wrong fruit
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
