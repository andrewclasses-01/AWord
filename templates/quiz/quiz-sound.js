// =============================================================
// QUIZ SOUNDS — real mp3 sound effects for this template only (not
// core/sound.js's synthesized tones). Files live in ./sounds/, resolved
// relative to THIS file (import.meta.url) so they work from any page depth
// or host subpath — same pattern as core/sound.js's wrong() file and
// templates/anagram/anagram-sound.js.
// Respects the shared mute toggle via core/sound.js's isMuted().
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

// One random file from a same-purpose pool of 3 — never the same one twice
// in a row, so answering several questions in a row doesn't sound robotic.
function makePool(names) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i]);
  };
}

export const quizSound = {
  correct: makePool(["blockchipminor1", "blockchipminor2", "blockchipminor3"]),
  wrong: makePool(["blockchipfail1", "blockchipfail2", "blockchipfail3"]),
  play: () => playFile("blockgameintro1"),
  restart: () => playFile("blockgamerestart"),
  timeWarning: () => playFile("blockgametimeout"),
  complete: () => playFile("blockgamesuccessful")
};
