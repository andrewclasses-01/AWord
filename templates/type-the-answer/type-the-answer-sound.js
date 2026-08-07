// =============================================================
// TYPE THE ANSWER SOUNDS — real mp3 effects from Wordwall's own "Type the
// answer" Classic theme (sound pack "classic2", same set as Quiz). Sourced
// 30/7/2026, see
//   D:\APP AND DATA\AWord-data\Source\Sound effect\TYPE THE ANSWER\GHI CHU.md
// Own copy under ./sounds/ (self-contained — same pool/mute pattern as
// tf-sound.js / balloon-pop-sound.js).
//
// The on-screen keyboard's per-key "tock" is NOT in this pack (Wordwall has no
// typing sound), so it is synthesized in core/sound.js as sound.keyClick()
// (teacher's call, 1/8/2026) — it is NOT wired here.
// =============================================================

import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. The "archived" files below are listed too: they are small and
// the template does fire them in the rarer end-states.
const pack = createPack(import.meta.url, {
  names: ["intro-01", "tileflip-01", "tileflip-02", "tileflip-03", "tileflip-04",
          "correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "gamecompleted-01", "gameover-01", "timesup-01", "restart-01",
          "menu-01", "leaderboard-01", "revealanswers-01"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "tileflip-01", "tileflip-02", "tileflip-03", "tileflip-04"]
});
const playFile = (name, volume = 1) => pack.play(name, volume);
const makePool = (names, volume = 1) => pack.pool(names, volume);
pack.prime();

export const ttaSound = {
  intro:     () => playFile("intro-01"),                                     // 01 — Play pressed
  tileFlip:  makePool(["tileflip-01", "tileflip-02", "tileflip-03", "tileflip-04"]), // 02 — move to the next question
  correct:   makePool(["correct-01", "correct-02", "correct-03"]),          // 03 — typed the right answer
  wrong:     makePool(["incorrect-01", "incorrect-02", "incorrect-03"]),     // 04 — typed a wrong answer
  complete:  () => playFile("gamecompleted-01"),                             // 05 — finished every question
  gameOver:  () => playFile("gameover-01"),                                  // 06 — (archived) lost before finishing
  timesUp:   () => playFile("timesup-01"),                                   // 07 — (archived) timer hit 0
  restart:   () => playFile("restart-01"),                                   // 08 — Start again
  menu:      () => playFile("menu-01"),                                      // 09 — (archived) open menu
  leaderboard: () => playFile("leaderboard-01"),                            // 10 — (archived) leaderboard screen
  reveal:    () => playFile("revealanswers-01")                             // 11 — (archived) Show answers
};
