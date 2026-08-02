// =============================================================
// SPEAKING CARDS SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Speaking cards" BOARD GAMES theme (its audio pack is `playingcards`).
// See D:\APP AND DATA\AWord-data\Source\Sound effect\SPEAKING CARDS\GHI CHU.md
// for exactly where each file came from + how the game state maps to each Type.
// Own copy under ./sounds/ (self-contained — not cross-imported).
// Same pool/mute pattern as balloon-pop-sound.js / otb-sound.js.
//
// Speaking cards does NOT score (no correct/incorrect, no Game complete /
// Game over / Leaderboard). It just deals random cards for students to talk
// about, so the palette only covers: start, shuffle, a card appearing, a card
// flipping open, restart, time's up (only if a countdown is set), and the menu.
// Board Games = the AWord "Classic" look for this template (teacher's call, 1/8/2026).
// =============================================================

import { sound as coreSound } from "../../core/sound.js";

function urlFor(name) { return new URL(`./sounds/${name}.mp3`, import.meta.url).href; }

const cache = new Map();
function audioFor(name) {
  let a = cache.get(name);
  if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
  return a;
}

function playFile(name, volume = 1) {
  if (coreSound.isMuted()) return;
  try {
    const a = audioFor(name);
    a.currentTime = 0;
    a.volume = volume;
    a.play().catch(() => {});
  } catch { /* ignore if the browser blocks audio */ }
}

// Stop a sound early (e.g. cut the long shuffle clip at its halfway point so it
// matches the shortened riffle animation).
export function stopSound(name) {
  try { const a = cache.get(name); if (a) { a.pause(); a.currentTime = 0; } } catch { /* ignore */ }
}

// The true length of a sound file, in ms — so a VISUAL effect can be made to
// last exactly as long as its sound (the intro camera pan runs for the intro
// sound; the deck's shuffle riffle repeats until the shuffle sound ends).
// Returns `fallbackMs` until the file's metadata has loaded (preload="auto" +
// the warm-up at the bottom of this file means it usually already has).
export function soundDurationMs(name, fallbackMs = 0) {
  try {
    const d = audioFor(name).duration;
    return (isFinite(d) && d > 0) ? Math.round(d * 1000) : fallbackMs;
  } catch { return fallbackMs; }
}

// One random file from a same-purpose pool — never the same one twice in a
// row so dealing several cards quickly doesn't sound robotic.
function makePool(names, volume = 1) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i], volume);
  };
}

export const scSound = {
  intro:      () => playFile("intro-01"),                                       // 01 — Play pressed
  shuffle:    () => playFile("shuffle-01"),                                     // 02 — deck is shuffled
  tileAppear: makePool(["tileappear-01", "tileappear-02", "tileappear-03"]),    // 03 — a fresh card slides out onto a deal place
  tileFlip:   makePool(["tileflip-01", "tileflip-02", "tileflip-03",
                        "tileflip-04", "tileflip-05", "tileflip-06"]),          // 04 — a card flips open to reveal its content
  restart:    () => playFile("restart-01"),                                     // 05 — Start again
  timesUp:    () => playFile("timesup-01"),                                     // 06 — countdown hits 0 (only if a timer is set)
  menu:       () => playFile("menu-01"),                                        // 07 — open menu / bottom-bar button
  menuSubtle: () => playFile("menusubtle-01")                                   // 08 — minor menu action (Undo)
};

// Warm up the two files we time visuals against, so their `.duration` is ready
// the moment we need it (soundDurationMs) instead of on the first play.
audioFor("intro-01");
audioFor("shuffle-01");
