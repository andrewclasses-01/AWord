// =============================================================
// WHACK-A-MOLE SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Whack-a-mole" WILD WEST theme (see
//   D:\APP AND DATA\AWord-data\Source\Sound effect\WHACK A MOLE\GHI CHU.md
// for where each file came from). Own copy under ./sounds/ — every template
// stays self-contained (same pool/mute pattern as ftm-sound.js / otb-sound.js).
//
// Wordwall's whack-a-mole uses NO background music (checked: none loads over a
// whole play) — only these one-shot effects.
//
// NOT wired up (no engine hook / left for later): Menu, MenuSubtle.
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

export const wamSound = {
  // engine lifecycle hooks (registerTemplate.sounds)
  intro: () => playFile("intro"),                 // 01 — Play pressed
  restart: () => playFile("go"),                  // reuse Go as a short "Start again" cue (no dedicated restart in the set)
  timeWarning: () => {},                           // handled by our own ticking clock, not a one-shot
  complete: () => playFile("levelcomplete"),      // "Game complete" fanfare

  // in-game one-shots
  go: () => playFile("go"),                        // 02 — countdown starts
  clockTick: () => playFile("clocktick"),          // 03 — one tick of the clock
  mole: makePool(["mole-01", "mole-02", "mole-03", "mole-04", "mole-05", "mole-06", "mole-07"], 0.5), // 04 — a mole pops up
  correct: makePool(["correct-01", "correct-02", "correct-03"]),   // 05 — whacked a correct mole
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]), // 06 — whacked a wrong mole
  combo: () => playFile("combo"),                  // 07 — combo streak bonus
  disappear: () => playFile("disappear", 0.5),     // 08 — a mole ducked back down un-whacked
  crate: () => playFile("crate"),                  // 09 — a crate appears
  crateTime: () => playFile("time"),               // 10 — hit the +time crate
  crateLoot: () => playFile("loot"),               // 11 — hit the loot crate
  cratePower: () => playFile("power"),             // 12 — hit the power crate
  tableRotation: makePool(["tablerotation-01", "tablerotation-02"]), // 13 — the sign rotates to a new question
  levelComplete: () => playFile("levelcomplete"),  // 14 — a level/question cleared
  nextLevel: () => playFile("nextlevel"),          // 15 — advance to the next level
  pointsCounting: () => playFile("pointscounting"),// 16 — the score tallies up at the end
  pointsCounted: () => playFile("pointscounted"),  // 17 — final score locked in
  reveal: () => playFile("reveal")                 // 20 — Show answers
};
