// =============================================================
// OPEN THE BOX (Questions mode) SOUNDS — real mp3 effects, SAME files as
// templates/anagram/sounds (copied here, not cross-imported, so this
// template stays self-contained) — the teacher asked for sound effects
// "similar to Anagram". Same pool/mute pattern as anagram-sound.js.
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

export const otbSound = {
  openBox: makePool(["blocktilepickup1", "blocktilepickup2", "blocktilepickup3"]),
  correct: makePool(["blockchipminor1", "blockchipminor2", "blockchipminor3"]),
  wrong: makePool(["blockchipfail1", "blockchipfail2", "blockchipfail3"]),
  timeout: () => playFile("blockgametimeout"),
  restart: () => playFile("blockgamerestart"),
  allSolved: () => playFile("blockgamesuccessful")
};
