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

import { createPack } from "../../core/sfx.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. Footsteps fire several times a second while the player runs,
// so the whole footstep set is hot. comet / jellyfish / ufo / menusubtle sit in
// ./sounds/ unused, so they are not listed and never downloaded.
const pack = createPack(import.meta.url, {
  names: ["intro", "introdoor", "playerappear", "clocktick",
          "footsteps-01", "footsteps-02", "footsteps-03", "footsteps-04", "footsteps-05",
          "answer", "correct", "incorrect",
          "enemyappear", "enemyattack", "enemypassive",
          "playerdamage", "playereject", "playerdeath", "teleport",
          "mapappear", "mapdisappear", "tileappear", "tileeliminate", "menu", "reveal"],
  hot:   ["footsteps-01", "footsteps-02", "footsteps-03", "footsteps-04", "footsteps-05",
          "answer", "correct", "incorrect", "enemyattack", "playerdamage",
          "tileeliminate", "clocktick"]
});
const playFile = pack.play;    // (name, volume?) — returns the element, like before
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

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
