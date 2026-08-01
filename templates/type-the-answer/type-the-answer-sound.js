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

// One random file from a same-purpose pool — never the same one twice in a row.
function makePool(names, volume = 1) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i], volume);
  };
}

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
