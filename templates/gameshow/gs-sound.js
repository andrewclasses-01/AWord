// =============================================================
// GAMESHOW SOUNDS — real .mp3 effects sourced directly from Wordwall's own
// "Gameshow" TV-GAME-SHOW theme (this look is Gameshow's "Classic" in AWord).
// See  D:\APP AND DATA\AWord-data\Source\Sound effect\GAMESHOW\GHI CHU.md
// for exactly where each file came from + which in-game event it maps to.
//
// How the mapping is known: read the theme's audio config
// (themejson/gameshow/audios.json) whose "Type" names pin each sound to an
// event (Correct / Incorrect / GameshowGetReady / GameshowBonusStart /
// GameshowQuizX2 …), cross-checked with the 47 files the game actually
// preloads. Downloaded as .ogg (a few .mp3) and transcoded to .mp3 with ffmpeg.
// Own copy under ./sounds/ so the template stays 100% self-contained.
// Same pool/mute pattern as quiz-sound.js / mc-sound.js.
// =============================================================

import { sound as coreSound } from "../../core/sound.js";
import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. This is the biggest pack (47 files); `skip` keeps the long
// background-music track OUT of the pre-fetch — it is streamed while it plays
// and pulling it up front would hog a slow classroom link for the one-shots
// that actually need to be instant.
const pack = createPack(import.meta.url, {
  names: ["intro", "restart", "opendoor", "getready", "questionappear", "chooseanswer",
          "correct-01", "correct-02", "correct-03",
          "perfect-01", "perfect-02", "perfect-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "plusscore", "minusscore", "clocktick", "timesup", "chipdisappear",
          "bonusstart", "tileappear", "bonuspick",
          "bonusflip-01", "bonusflip-02", "bonusflip-03", "bonusflip-04",
          "bonusmove-01", "bonusmove-02", "bonusmove-03",
          "bonusreveal-01", "bonusreveal-02", "bonusreveal-03", "bonusreveal-04", "bonusreveal-05",
          "uselifeline", "lifeline5050", "lifelinex2", "lifelinetime", "lifelinecheat",
          "complete", "gameover", "leaderboard", "reveal", "menu", "menusubtle"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "perfect-01", "perfect-02", "perfect-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "chooseanswer", "questionappear", "getready", "clocktick", "plusscore"],
  skip:  ["music"]
});
const playFile = pack.play;    // (name, volume?) — returns the element, like before
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

// ----- background music: a separate looping Audio (own low volume) -----
let musicEl = null;
function musicStart() {
  if (coreSound.isMuted()) return;
  try {
    if (!musicEl) { musicEl = new Audio(pack.urlFor("music")); musicEl.loop = true; musicEl.volume = 0.28; }
    musicEl.currentTime = 0;
    musicEl.play().catch(() => {});
  } catch { /* ignore */ }
}
function musicStop() { try { if (musicEl) { musicEl.pause(); musicEl.currentTime = 0; } } catch {} }
// Menu pause (Đợt 91, 8/8/2026): pause/resume IN PLACE (no currentTime reset,
// unlike musicStop) so the loop picks back up exactly where it left off.
function musicPause() { try { if (musicEl && !musicEl.paused) musicEl.pause(); } catch {} }
function musicResume() { try { if (musicEl && musicEl.paused) musicEl.play().catch(() => {}); } catch {} }

export const gsSound = {
  // ----- engine lifecycle hooks (registerTemplate.sounds) -----
  play: () => playFile("intro"),     // 01 — Play pressed: game-show intro jingle
  restart: () => playFile("restart"),
  // complete: set to a no-op so the engine's celebrate() doesn't ALSO play a
  // fanfare — the template plays its own win/lose cue (complete/gameOver) itself.
  complete: () => {},

  // ----- in-game one-shots (see GHI CHU numbering) -----
  openDoor: () => playFile("opendoor"),          // 02 — the TV "QUIZ SHOW" doors slide apart
  getReady: () => playFile("getready"),          // 03 — "Question N / Get ready!"
  questionAppear: () => playFile("questionappear"), // 04 — question + answer tiles fly in
  choose: () => playFile("chooseanswer"),        // 05 — an answer tile is tapped
  correct: makePool(["correct-01", "correct-02", "correct-03"]),   // 06
  perfect: makePool(["perfect-01", "perfect-02", "perfect-03"]),   // 07 — fast / on-a-streak
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]), // 08
  plusScore: () => playFile("plusscore"),        // 09 — the score counts UP
  minusScore: () => playFile("minusscore"),      // 10 — the score ticks DOWN (unused-but-ready)
  clockTick: () => playFile("clocktick", 0.7),   // 11 — last seconds warning
  timesUp: () => playFile("timesup"),            // 12 — the question ran out of time
  chipDisappear: () => playFile("chipdisappear", 0.8), // 13 — tiles clear between questions

  // ----- BONUS ROUND -----
  bonusStart: () => playFile("bonusstart"),      // 14 — "BONUS ROUND" doors open
  tileAppear: () => playFile("tileappear", 0.85),// 15 — the 5 mystery cards pop in
  bonusPick: () => playFile("bonuspick"),        // 16 — a card is chosen
  bonusFlip: makePool(["bonusflip-01", "bonusflip-02", "bonusflip-03", "bonusflip-04"]), // 17
  bonusMove: makePool(["bonusmove-01", "bonusmove-02", "bonusmove-03"], 0.8),            // 18
  bonusReveal: makePool(["bonusreveal-01", "bonusreveal-02", "bonusreveal-03", "bonusreveal-04", "bonusreveal-05"]), // 19

  // ----- LIFELINES -----
  useLifeline: () => playFile("uselifeline"),    // 20
  lifeline5050: () => playFile("lifeline5050"),  // 21 — 50:50
  lifelineX2: () => playFile("lifelinex2"),      // 22 — double points
  lifelineTime: () => playFile("lifelinetime"),  // 23 — extra time
  lifelineCheat: () => playFile("lifelinecheat"),// 24 — reveal the answer

  // ----- end / menu -----
  gameComplete: () => playFile("complete"),      // 25 — finished, success fanfare
  gameOver: () => playFile("gameover"),          // 26 — out of lives
  leaderboard: () => playFile("leaderboard"),    // 27
  reveal: () => playFile("reveal"),              // 28 — Show answers
  menu: () => playFile("menu"),                  // 30
  menuSubtle: () => playFile("menusubtle"),      // 31

  // ----- background music -----
  musicStart, musicStop, musicPause, musicResume
};
