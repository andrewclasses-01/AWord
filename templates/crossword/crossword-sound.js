// =============================================================
// CROSSWORD SOUNDS — real mp3 effects taken straight from Wordwall's own
// "Crossword" (theme Classic). See
//   D:\APP AND DATA\AWord-data\Source\Sound effect\CROSSWORD\GHI CHU.md
// for exactly where each file came from + which game event it maps to
// (verified by actually playing the Wordwall act and matching durations).
// Own copy under ./sounds/ (self-contained, like quiz-sound.js / anagram-sound.js).
// Respects the shared mute toggle via core/sound.js's isMuted().
//
// Which sound plays where (Classic crossword uses this exact subset):
//   intro        blockgameintro1       — Play pressed
//   correct(x3)  blockchipminor1/2/3   — a word solved correctly (random of 3)
//   wrong(x3)    blockchipfail1/2/3    — a word answered wrong (random of 3)
//   complete     blockgamesuccessful   — game finished / Submit answers
//   timesUp      blockgametimeout      — count-down timer runs out
//   restart      blockgamerestart      — Start again
// (menu/leaderboard/revealanswers are archived in ./sounds/ for completeness but
//  the shared engine owns those screens, so this template does not fire them.)
// =============================================================

import { sound as coreSound } from "../../core/sound.js";
import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";

// Đợt 85 (7/8/2026) — fetched at IMPORT time (prime() below), not on first play.
// See core/sfx.js. menu/leaderboard/revealanswers sit in ./sounds/ for
// completeness but this template never fires them, so they are not listed and
// therefore not downloaded.
const pack = createPack(import.meta.url, {
  names: ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03",
          "intro", "restart", "timesup", "gamecompleted"],
  hot:   ["correct-01", "correct-02", "correct-03",
          "incorrect-01", "incorrect-02", "incorrect-03"]
});
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

// -------------------------------------------------------------------
// Tiny Web-Audio synth for the per-cell effects (no files needed): a short
// "ting" on a correct cell, a "tặc" blip on a wrong one, and a sparkly "magic"
// arpeggio for Andrew's hint. Kept here (not in core/sound.js) so the template
// stays self-contained and does NOT touch core. Respects the shared mute.
// -------------------------------------------------------------------
// Borrow the SHARED context from core/sound.js (Đợt 85) instead of building a
// private one: a brand-new context makes its first sound ~37 ms late, and the
// shared one is already warmed up by the teacher's first tap on the page.
function ac() { return coreSound.context(); }
function blip({ freq, freqEnd = null, dur, type = "sine", gain = 0.14, delay = 0 }) {
  if (coreSound.isMuted()) return;
  try {
    const a = ac();
    const t0 = a.currentTime + delay / 1000;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur / 1000);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
    osc.connect(g); g.connect(a.destination);
    osc.start(t0); osc.stop(t0 + dur / 1000 + 0.02);
  } catch { /* ignore if the browser blocks audio */ }
}

export const crosswordSound = {
  correct: makePool(["correct-01", "correct-02", "correct-03"]),
  // bright, short bell "ting!" — one per CORRECT cell as a word is checked.
  ting: () => {
    blip({ freq: 1760, dur: 150, type: "sine", gain: 0.16 });
    blip({ freq: 2637, dur: 120, type: "sine", gain: 0.08, delay: 45 });
  },
  // short, dry "tặc" blip — one per WRONG cell as a word is checked.
  tac: () => {
    blip({ freq: 520, freqEnd: 170, dur: 75, type: "square", gain: 0.12 });
  },
  // sparkly rising arpeggio + shimmer — plays once when Andrew's hint appears.
  magic: () => {
    const seq = [880, 1174, 1568, 2093, 2637];
    seq.forEach((f, i) => blip({ freq: f, dur: 240, type: "triangle", gain: 0.10, delay: i * 70 }));
    blip({ freq: 3136, dur: 460, type: "sine", gain: 0.07, delay: seq.length * 70 });
  },
  // rising "collect" chime — the GOLD stars flying into the score (points gained).
  starGain: () => {
    blip({ freq: 1046, dur: 90,  type: "triangle", gain: 0.12 });
    blip({ freq: 1568, dur: 120, type: "triangle", gain: 0.11, delay: 85 });
    blip({ freq: 2093, dur: 200, type: "sine",     gain: 0.09, delay: 175 });
  },
  // falling "drop" tone — the RED stars flying into the score (points lost). Same
  // family as starGain but DESCENDING so it clearly reads as a loss.
  starLose: () => {
    blip({ freq: 660, freqEnd: 330, dur: 200, type: "triangle", gain: 0.12 });
    blip({ freq: 440, freqEnd: 210, dur: 240, type: "sine",     gain: 0.09, delay: 120 });
  },
  // dull "thunk" — a wrong letter typed onto a locked given cell (with the shake).
  reject: () => {
    blip({ freq: 200, freqEnd: 120, dur: 120, type: "square",   gain: 0.12 });
    blip({ freq: 150, dur: 90,  type: "triangle", gain: 0.07, delay: 55 });
  },
  wrong: wrapWrong(makePool(["incorrect-01", "incorrect-02", "incorrect-03"])),
  play: () => playFile("intro"),
  restart: () => playFile("restart"),
  timeWarning: () => playFile("timesup"),
  complete: () => playFile("gamecompleted")
};
