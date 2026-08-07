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

import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — the whole pack is fetched at IMPORT time (prime() below),
// not one file at a time on its first play. See core/sfx.js. This template was
// the one that already hinted at the fix: it used to warm up intro-01 and
// shuffle-01 by hand at the bottom of the file, because it needs their
// `.duration` to time a visual — now every file gets that treatment.
const pack = createPack(import.meta.url, {
  names: ["intro-01", "shuffle-01",
          "tileappear-01", "tileappear-02", "tileappear-03",
          "tileflip-01", "tileflip-02", "tileflip-03", "tileflip-04", "tileflip-05", "tileflip-06",
          "restart-01", "timesup-01", "menu-01", "menusubtle-01"],
  hot:   ["intro-01", "shuffle-01",
          "tileappear-01", "tileappear-02", "tileappear-03",
          "tileflip-01", "tileflip-02", "tileflip-03"]
});
const playFile = (name, volume = 1) => pack.play(name, volume);
const makePool = (names, volume = 1) => pack.pool(names, volume);
pack.prime();

// Stop a sound early (e.g. cut the long shuffle clip at its halfway point so it
// matches the shortened riffle animation).
export function stopSound(name) { pack.stop(name); }

// The true length of a sound file, in ms — so a VISUAL effect can be made to
// last exactly as long as its sound (the intro camera pan runs for the intro
// sound; the deck's shuffle riffle repeats until the shuffle sound ends).
// prime() means the metadata is normally already there, so `fallbackMs` is now
// only a safety net.
export function soundDurationMs(name, fallbackMs = 0) { return pack.durationMs(name, fallbackMs); }

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
