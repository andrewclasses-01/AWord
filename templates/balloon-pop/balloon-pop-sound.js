// =============================================================
// BALLOON POP SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Balloon pop" WILD WEST theme (theme id `western2`). See
// D:\APP AND DATA\AWord-data\Source\Sound effect\BALOON POP\GHI CHU.md for
// exactly where each file came from + how the game state maps to each Type.
// Own copy under ./sounds/ (self-contained — not cross-imported).
// Same pool/mute pattern as anagram-sound.js / otb-sound.js.
//
// Balloon Pop does NOT use "chip" correct/incorrect or a clock-tick like
// Quiz/Anagram — its feedback is the cargo LAND (correct) / cargo BREAK
// (wrong), and its running "clock" is the train chugging. Wild West = the
// AWord "Classic" look for this template (teacher's call, 1/8/2026).
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

// One random file from a same-purpose pool — never the same one twice in a
// row so rapid repeats (popping several balloons fast) don't sound robotic.
function makePool(names, volume = 1) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i], volume);
  };
}

export const bpSound = {
  intro:      () => playFile("intro-01"),                                    // 01 — Play pressed, camera pans up
  pop:        () => playFile("balloonpop-01"),                               // 02 — a balloon is popped
  cargoCorrect: makePool(["cargocorrect-01", "cargocorrect-02"]),           // 03 — keyword crate lands on the right train car
  cargoWrong: makePool(["cargoincorrect-01", "cargoincorrect-02", "cargoincorrect-03"]), // 04 — crate breaks (wrong keyword)
  cargoBounce: makePool(["cargobounce-01", "cargobounce-02"]),              // 05 — crate bounces
  ting:       makePool(["ting-01", "ting-02"]),                             // 06 — "ting" when a car is loaded / points
  trainChug:  () => playFile("trainchug-01", 0.7),                          // 07 — train moves to the next car
  trainBell:  () => playFile("trainbell-01"),                               // 08 — bell (level milestone)
  trainToot:  () => playFile("traintoot-01"),                               // 09 — whistle
  trainTime:  () => playFile("traintime-01"),                               // 10 — running low on time
  balloonTime:  () => playFile("balloontime-01"),                           // 11 — Extra Time bonus balloon
  balloonLoot:  () => playFile("balloonloot-01"),                           // 12 — Points bonus balloon
  balloonCombo: () => playFile("ballooncombo-01"),                          // 13 — x2 Score bonus balloon
  planeFlyBy: () => playFile("planeflyby-01", 0.6),                         // 14 — biplane towing a banner, ambient
  complete:   () => playFile("gamecompleted-01"),                           // 15 — win (all levels done)
  gameOver:   () => playFile("gameover-01"),                                // 16 — lose
  timesUp:    () => playFile("timesup-01"),                                 // 17 — clock hits 0
  restart:    () => playFile("restart-01"),                                 // 18 — Start again
  menu:       () => playFile("menu-01"),                                    // 19 — open menu
  menuSubtle: () => playFile("menusubtle-01"),                              // 20 — minor menu action
  leaderboard:  () => playFile("leaderboard-01"),                           // 21 — Leaderboard screen
  reveal:     () => playFile("revealanswers-01")                            // 22 — Show answers
};
