// =============================================================
// RUNNING WORD SOUNDS — 100% Web-Audio synth, no mp3 files.
//
// Why synth and not a Wordwall mp3 pack like Crossword/Type the answer: this
// game has no Wordwall original to borrow from, and its key sounds are physical
// objects, not game jingles — a real CHESS CLOCK's plunger "clack", a countdown
// tick, and a boxing-style end-of-round BELL. Those are easy and tiny to
// synthesise, and keep the template self-contained (no assets to ship or lose).
//
// Every sound respects the shared mute toggle via core/sound.js's isMuted(),
// exactly like crossword-sound.js does for its synth half.
//
// Event map:
//   ready()     3-2-1 countdown blip (pitch rises on the last one)
//   clack()     THE signature sound — the chess-clock plunger swapping turns
//   correct()   a word accepted (bright two-note ting)
//   wrong()     a word rejected (short low double buzz)
//   pass()      a word passed with a time penalty (descending whoosh)
//   andrew()    the Andrew lifeline (sparkly arpeggio)
//   tick(n)     one countdown tick inside the last N seconds; the pitch and
//               loudness rise as `n` falls, so the last few are genuinely urgent
//   timeUp()    the end-of-round bell (three strikes, long decay)
//   win()       victory fanfare for the winning team
//   pauseBeep() / resumeBeep()  referee pause / resume
// =============================================================

import { sound as coreSound } from "../../core/sound.js";

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

// A short burst of filtered noise — the "wood" half of a knock, and the body of
// the bell strike. Noise is what makes a knock read as an OBJECT rather than a
// beep; a pure oscillator alone sounds like a game blip, not a clock plunger.
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

// One bell strike: a set of INHARMONIC partials (a real bell's overtones are
// not whole multiples of the root — that inharmonicity is what makes it sound
// like metal instead of an organ) plus a tiny noise transient for the hammer.
function bell({ root = 660, gain = 0.15, dur = 1500, delay = 0 }) {
  noise({ dur: 40, gain: gain * 0.5, delay, freq: 3200, q: 0.8 });
  [1, 2.02, 2.98, 4.16, 5.43].forEach((mult, i) => {
    tone({ freq: root * mult, dur: dur * (1 - i * 0.13), type: "sine", gain: gain / (1.7 + i), delay });
  });
}

export const rwSound = {
  // 3-2-1 before the clocks start. `last` gives the final blip a higher pitch.
  ready(last = false) {
    tone({ freq: last ? 1046 : 660, dur: last ? 340 : 160, type: "triangle", gain: 0.14 });
    if (last) tone({ freq: 1568, dur: 420, type: "sine", gain: 0.1, delay: 90 });
  },

  // THE chess-clock plunger. Two knocks ~28ms apart (button down, lever over)
  // over a very short low thump — this is the sound the whole game is built
  // around, so it plays on every turn swap.
  clack() {
    noise({ dur: 26, gain: 0.34, freq: 2400, q: 0.9 });
    noise({ dur: 34, gain: 0.26, freq: 1500, q: 1.1, delay: 28 });
    tone({ freq: 190, freqEnd: 90, dur: 70, type: "triangle", gain: 0.13, delay: 4 });
  },

  correct() {
    tone({ freq: 1318, dur: 240, type: "sine", gain: 0.15 });
    tone({ freq: 1976, dur: 320, type: "sine", gain: 0.11, delay: 65 });
  },

  wrong() {
    tone({ freq: 196, dur: 110, type: "square", gain: 0.085 });
    tone({ freq: 165, dur: 150, type: "square", gain: 0.085, delay: 115 });
  },

  // Passing costs time, so it sounds like something draining away.
  pass() {
    tone({ freq: 880, freqEnd: 220, dur: 420, type: "sawtooth", gain: 0.075 });
    noise({ dur: 380, gain: 0.06, freq: 900, q: 0.6 });
  },

  andrew() {
    [784, 988, 1319, 1568].forEach((f, i) =>
      tone({ freq: f, dur: 300, type: "triangle", gain: 0.1, delay: i * 70 }));
  },

  // One second of the final countdown. `left` = whole seconds still on the
  // clock: the fewer, the higher and louder — by 3-2-1 it is unmissable across
  // a noisy classroom.
  tick(left) {
    const n = Math.max(0, Math.min(15, left | 0));
    const urgency = 1 - n / 15;                       // 0 at 15s left, ~1 at 0
    tone({
      freq: 1000 + urgency * 900,
      freqEnd: 700 + urgency * 700,
      dur: 60 + urgency * 40,
      type: "square",
      gain: 0.05 + urgency * 0.075
    });
    if (n <= 5) noise({ dur: 30, gain: 0.06 + urgency * 0.06, freq: 3000, q: 1 });
  },

  // End of the match — three bell strikes, the classic "round over".
  timeUp() {
    bell({ root: 587, gain: 0.2, dur: 1700, delay: 0 });
    bell({ root: 587, gain: 0.18, dur: 1700, delay: 420 });
    bell({ root: 587, gain: 0.22, dur: 2400, delay: 840 });
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 250, type: "triangle", gain: 0.13, delay: i * 110 }));
    tone({ freq: 1568, dur: 520, type: "sine", gain: 0.11, delay: 470 });
    bell({ root: 784, gain: 0.12, dur: 1800, delay: 470 });
  },

  pauseBeep()  { tone({ freq: 520, freqEnd: 300, dur: 180, type: "sine", gain: 0.1 }); },
  resumeBeep() { tone({ freq: 300, freqEnd: 620, dur: 180, type: "sine", gain: 0.1 }); }
};
