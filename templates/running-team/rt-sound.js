// =============================================================
// RUNNING TEAM SOUNDS — 100% Web-Audio synth, no mp3 files.
//
// Same approach as rw-sound.js (Running word): this game has no Wordwall
// original to borrow a sound pack from, and everything it needs is a blip, a
// tick or a bell — cheap to synthesise and it keeps the template self-contained.
//
// The tone()/noise()/bell() helpers below are deliberately a COPY of Running
// word's rather than an import from it. Templates are self-contained by
// contract: importing across template folders would drag one game's module (and
// its stylesheet's fate) into another's load, and the two games' sound sets
// drift apart over time anyway. Shared audio belongs in core/sound.js, which
// this file does defer to for the mute toggle.
//
// Event map:
//   ready()      the READY card appears
//   count(n)     one 3-2-1 blip; n===1 is higher and longer
//   reveal()     the question and its six tiles open
//   correct()    the right tile was tapped
//   wrong()      the wrong tile was tapped
//   lifeLost()   a heart just went out (wrong answer or the question timed out)
//   tick(left)   one second inside the question's final seconds
//   win()        the class survived to the final whistle
//   lose()       the last heart went out
// =============================================================

import { sound as coreSound } from "../../core/sound.js";
import { playWrongEffect } from "../../core/wrong-sound.js";

// Borrow the SHARED context from core/sound.js (Đợt 85) instead of building a
// private one: a brand-new context makes its first sound ~37 ms late (48 ms vs
// 10.7 ms measured), and the shared one is warmed up on the first tap.
function ac() { return coreSound.context(); }

// One oscillator note. `freqEnd` glides the pitch across the note.
function tone({ freq, freqEnd = null, dur, type = "sine", gain = 0.15, delay = 0, attack = 0.004 }) {
  if (coreSound.isMuted()) return;
  try {
    const a = ac();
    const t0 = a.currentTime + delay / 1000;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur / 1000);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
    osc.connect(g); g.connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur / 1000 + 0.02);
  } catch { /* browser blocked audio — silent, never throw into the game loop */ }
}

// A short burst of filtered noise — what makes a knock read as an OBJECT
// rather than a beep.
function noise({ dur, gain = 0.2, delay = 0, type = "bandpass", freq = 1800, q = 1.2 }) {
  if (coreSound.isMuted()) return;
  try {
    const a = ac();
    const t0 = a.currentTime + delay / 1000;
    const frames = Math.max(1, Math.ceil(a.sampleRate * (dur / 1000)));
    const buf = a.createBuffer(1, frames, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const filt = a.createBiquadFilter();
    filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const g = a.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
    src.connect(filt); filt.connect(g); g.connect(a.destination);
    src.start(t0);
    src.stop(t0 + dur / 1000 + 0.02);
  } catch { /* ignore */ }
}

// One bell strike: INHARMONIC partials (a real bell's overtones are not whole
// multiples of the root — that is what makes it sound like metal) plus a tiny
// noise transient for the hammer.
function bell({ root = 660, gain = 0.15, dur = 1500, delay = 0 }) {
  noise({ dur: 40, gain: gain * 0.5, delay, freq: 3200, q: 0.8 });
  [1, 2.02, 2.98, 4.16, 5.43].forEach((mult, i) => {
    tone({ freq: root * mult, dur: dur * (1 - i * 0.13), type: "sine", gain: gain / (1.7 + i), delay });
  });
}

export const rtSound = {
  // The READY card — a rising two-note "get set".
  ready() {
    tone({ freq: 523, dur: 180, type: "triangle", gain: 0.12 });
    tone({ freq: 784, dur: 260, type: "triangle", gain: 0.11, delay: 130 });
  },

  // One 3-2-1 blip. The last one (n===1) is higher and rings longer so the
  // class knows the tiles are about to appear.
  count(n) {
    const last = n <= 1;
    tone({ freq: last ? 1046 : 660, dur: last ? 340 : 160, type: "triangle", gain: 0.14 });
    if (last) tone({ freq: 1568, dur: 420, type: "sine", gain: 0.1, delay: 90 });
  },

  // The tiles land.
  reveal() {
    noise({ dur: 40, gain: 0.14, freq: 2600, q: 0.9 });
    tone({ freq: 440, freqEnd: 880, dur: 180, type: "sine", gain: 0.09 });
  },

  correct() {
    tone({ freq: 1318, dur: 240, type: "sine", gain: 0.15 });
    tone({ freq: 1976, dur: 320, type: "sine", gain: 0.11, delay: 65 });
  },

  wrong() {
    playWrongEffect(() => {
      tone({ freq: 196, dur: 110, type: "square", gain: 0.085 });
      tone({ freq: 165, dur: 150, type: "square", gain: 0.085, delay: 115 });
    });
  },

  // A heart going out: a short descending "drop" under the wrong-answer buzz.
  lifeLost() {
    tone({ freq: 660, freqEnd: 180, dur: 420, type: "sawtooth", gain: 0.075 });
    noise({ dur: 300, gain: 0.05, freq: 700, q: 0.6 });
  },

  // One second of a question's final countdown. The fewer left, the higher and
  // louder — unmissable across a noisy classroom by the last one.
  tick(left) {
    const n = Math.max(0, Math.min(10, left | 0));
    const urgency = 1 - n / 10;
    tone({
      freq: 1000 + urgency * 900,
      freqEnd: 700 + urgency * 700,
      dur: 60 + urgency * 40,
      type: "square",
      gain: 0.05 + urgency * 0.07
    });
    if (n <= 3) noise({ dur: 30, gain: 0.06 + urgency * 0.06, freq: 3000, q: 1 });
  },

  // The class made it to the final whistle (or cleared the whole list).
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 250, type: "triangle", gain: 0.13, delay: i * 110 }));
    tone({ freq: 1568, dur: 520, type: "sine", gain: 0.11, delay: 470 });
    bell({ root: 784, gain: 0.12, dur: 1800, delay: 470 });
  },

  // The last heart went out — three slow low strikes.
  lose() {
    bell({ root: 330, gain: 0.18, dur: 1600, delay: 0 });
    bell({ root: 294, gain: 0.16, dur: 1600, delay: 400 });
    bell({ root: 247, gain: 0.2, dur: 2400, delay: 800 });
  }
};
