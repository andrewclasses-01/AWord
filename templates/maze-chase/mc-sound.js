// =============================================================
// MAZE-CHASE SOUNDS — real .mp3 effects sourced directly from Wordwall's own
// "Maze chase" SPACE theme (this Space look is Maze chase's "Classic" in AWord).
// See  D:\APP AND DATA\AWord-data\Source\Sound effect\MAZE CHASE\GHI CHU.md
// for exactly where each file came from + which in-game event it maps to.
//
// How the mapping is known: read the theme's audio config
// (themejson/space/audios.json) whose "Type" names pin each sound to an event
// (MazeChaseAnswerRight, MazeChasePlayerFootsteps, MazeChaseEnemyAttack, ...),
// then cross-checked with the .ogg files the game actually preloads. Downloaded
// as .ogg and transcoded to .mp3 with ffmpeg. Own copy under ./sounds/ so the
// template stays 100% self-contained (same pool/mute pattern as wam-sound.js).
//
// NOT captured (never loaded in the preview — the game lazy-loads end-state SFX
// only when you reach them; the Play button lives inside a WebGL canvas that
// couldn't be scripted): TimesUp / GameCompleted / GameOver / Restart /
// Leaderboard. We fall back to the engine's own fanfare for "complete" and reuse
// maze cues (clock tick as the 5-second warning, player-appear as restart).
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
  if (coreSound.isMuted()) return null;
  try {
    const a = audioFor(name);
    a.currentTime = 0;
    if (volume != null) a.volume = volume;
    a.play().catch(() => {});
    return a;
  } catch { return null; }
}

// Random-variant pool (avoid repeating the same file twice in a row).
function makePool(names, volume) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    return playFile(names[i], volume);
  };
}

export const mcSound = {
  // ----- engine lifecycle hooks (registerTemplate.sounds) -----
  play: () => playFile("intro"),            // 01 — Play pressed (space game intro)
  restart: () => playFile("playerappear"),  // reuse the player-spawn cue for "Start again"
  timeWarning: () => playFile("clocktick"), // last 5 seconds of a countdown
  // complete: (left out on purpose → engine's own fanfare plays)

  // ----- in-game one-shots -----
  introDoor: () => playFile("introdoor"),                 // the iris/door open at the start
  playerAppear: () => playFile("playerappear"),           // 03 — player warps in
  footstep: makePool(["footsteps-01","footsteps-02","footsteps-03","footsteps-04","footsteps-05"], 0.35), // 04 — one step
  answer: () => playFile("answer", 0.7),                  // 05 — stepped onto an answer pad
  correct: () => playFile("correct"),                     // 06 — reached the RIGHT answer
  wrong: () => playFile("incorrect"),                     // 07 — reached a WRONG answer
  enemyAppear: () => playFile("enemyappear"),             // 08 — an enemy warps in
  enemyAttack: () => playFile("enemyattack"),             // 09 — an enemy lunges / catches you
  enemyPassive: () => playFile("enemypassive", 0.5),      // 10 — idle enemy ambience
  playerDamage: () => playFile("playerdamage"),           // 11 — you got hit (lose a life)
  playerEject: () => playFile("playereject"),             // 12 — knocked back after a hit
  playerDeath: () => playFile("playerdeath"),             // 13 — last life lost (game over)
  teleport: () => playFile("teleport"),                   // 14 — wrapped around a maze edge
  mapAppear: () => playFile("mapappear", 0.7),            // 15 — the maze deals in
  mapDisappear: () => playFile("mapdisappear", 0.7),      // 16 — the maze clears out
  tileAppear: () => playFile("tileappear", 0.8),          // 17 — answer pads pop in
  tileEliminate: () => playFile("tileeliminate", 0.8),    // 18 — a wrong pad is removed
  menu: () => playFile("menu"),                           // 20 — menu open
  reveal: () => playFile("reveal")                        // 22 — Show answers
};
