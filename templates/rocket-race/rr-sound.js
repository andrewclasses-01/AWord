// =============================================================
// ROCKET RACE SOUNDS — 100% Web-Audio synth, no mp3 files.
//
// Same approach as rt-sound.js (Running team): there is no Wordwall original
// to borrow a sound pack from, and everything a rocket race needs — a whoosh,
// a sputter, a countdown blip, a chime — is cheap to synthesise. Keeping it
// synthetic also keeps the template 100% self-contained (no cross-template
// imports; the tone()/noise()/bell() helpers are a deliberate COPY, per the
// project contract) and costs the student's phone zero extra downloads.
//
// Event map:
//   count(n)      one 3-2-1 blip; n===1 rings longer
//   go()          "GO!" — the race starts
//   boost()       the player's rocket fires forward (correct answer)
//   turbo()       streak reached — afterburner kicks in
//   stall()       engine sputters (wrong answer)
//   pickup()      a power-up crate was collected
//   meteor()      the meteor power-up hits the leading rival
//   shield()      the shield absorbs a stall
//   lifeLost()    a heart just went out
//   tick(left)    one second of the question's final countdown
//   rivalFinish() a rival crossed the line before you
//   win()         you crossed the line (any place) — bright fanfare
//   lose()        game over (no lives left)
//   hum.start()/hum.stop()  the low engine drone while the race is on
// =============================================================

import { sound as coreSound } from "../../core/sound.js";
import { playWrongEffect } from "../../core/wrong-sound.js";

// Borrow the SHARED context from core/sound.js (Đợt 85): a private context
// makes its first sound ~37 ms late, the shared one is already warmed up.
function ac() { return coreSound.context(); }

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
  } catch { /* audio blocked — stay silent, never throw into the game loop */ }
}

// Filtered noise burst. `freqEnd` sweeps the filter — a rising sweep is a
// whoosh, a falling one is a thud.
function noise({ dur, gain = 0.2, delay = 0, type = "bandpass", freq = 1800, freqEnd = null, q = 1.2 }) {
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
    filt.type = type; filt.Q.value = q;
    filt.frequency.setValueAtTime(freq, t0);
    if (freqEnd) filt.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur / 1000);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
    src.connect(filt); filt.connect(g); g.connect(a.destination);
    src.start(t0);
    src.stop(t0 + dur / 1000 + 0.02);
  } catch { /* ignore */ }
}

// One bell strike with inharmonic partials (that is what reads as "metal").
function bell({ root = 660, gain = 0.15, dur = 1500, delay = 0 }) {
  noise({ dur: 40, gain: gain * 0.5, delay, freq: 3200, q: 0.8 });
  [1, 2.02, 2.98, 4.16, 5.43].forEach((mult, i) => {
    tone({ freq: root * mult, dur: dur * (1 - i * 0.13), type: "sine", gain: gain / (1.7 + i), delay });
  });
}

// ---- the engine drone: two detuned saws through a low-pass, very quiet ----
// Started at GO, stopped at the finish / on Menu pause / in cleanup. Kept as a
// single module-level instance: AWord mounts one activity at a time, and a
// second start() while running is a no-op so a resume can never stack two.
let humNodes = null;
const hum = {
  start() {
    if (humNodes || coreSound.isMuted()) return;
    try {
      const a = ac();
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.035, a.currentTime + 0.6);
      const filt = a.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 220; filt.Q.value = 0.7;
      const o1 = a.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 55;
      const o2 = a.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 55.7;
      o1.connect(filt); o2.connect(filt); filt.connect(g); g.connect(a.destination);
      o1.start(); o2.start();
      humNodes = { g, o1, o2, a };
    } catch { humNodes = null; }
  },
  // A turbo makes the drone climb; back() eases it down again.
  rev(up) {
    if (!humNodes) return;
    try {
      const t = humNodes.a.currentTime;
      humNodes.o1.frequency.exponentialRampToValueAtTime(up ? 82 : 55, t + 0.35);
      humNodes.o2.frequency.exponentialRampToValueAtTime(up ? 83 : 55.7, t + 0.35);
    } catch { /* ignore */ }
  },
  stop() {
    if (!humNodes) return;
    const h = humNodes; humNodes = null;
    try {
      const t = h.a.currentTime;
      h.g.gain.cancelScheduledValues(t);
      h.g.gain.setValueAtTime(Math.max(0.0001, h.g.gain.value), t);
      h.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      h.o1.stop(t + 0.35); h.o2.stop(t + 0.35);
    } catch { /* ignore */ }
  }
};

export const rrSound = {
  hum,

  count(n) {
    const last = n <= 1;
    tone({ freq: last ? 1046 : 660, dur: last ? 340 : 160, type: "triangle", gain: 0.14 });
    if (last) tone({ freq: 1568, dur: 420, type: "sine", gain: 0.1, delay: 90 });
  },

  // GO: a rising whoosh under a bright two-note.
  go() {
    noise({ dur: 520, gain: 0.16, freq: 300, freqEnd: 3800, q: 0.9 });
    tone({ freq: 784, dur: 160, type: "triangle", gain: 0.12 });
    tone({ freq: 1175, dur: 340, type: "triangle", gain: 0.12, delay: 120 });
  },

  // The rocket fires forward: an upward noise sweep + a short rising tone.
  boost() {
    noise({ dur: 380, gain: 0.14, freq: 500, freqEnd: 4200, q: 0.8 });
    tone({ freq: 520, freqEnd: 1240, dur: 260, type: "sine", gain: 0.1 });
  },

  correct() {
    tone({ freq: 1318, dur: 220, type: "sine", gain: 0.14 });
    tone({ freq: 1976, dur: 300, type: "sine", gain: 0.1, delay: 60 });
  },

  wrong() {
    playWrongEffect(() => {
      tone({ freq: 196, dur: 110, type: "square", gain: 0.085 });
      tone({ freq: 165, dur: 150, type: "square", gain: 0.085, delay: 115 });
    });
  },

  // Engine sputter: three falling wobbles with a puff of noise each.
  stall() {
    [0, 140, 290].forEach((d, i) => {
      tone({ freq: 220 - i * 30, freqEnd: 90, dur: 130, type: "sawtooth", gain: 0.07, delay: d });
      noise({ dur: 90, gain: 0.07, freq: 900, freqEnd: 300, q: 0.7, delay: d });
    });
  },

  turbo() {
    noise({ dur: 900, gain: 0.16, freq: 400, freqEnd: 6000, q: 0.6 });
    [659, 880, 1175, 1568].forEach((f, i) => tone({ freq: f, dur: 180, type: "triangle", gain: 0.11, delay: i * 70 }));
  },

  pickup() {
    tone({ freq: 880, dur: 90, type: "square", gain: 0.07 });
    tone({ freq: 1175, dur: 90, type: "square", gain: 0.07, delay: 80 });
    tone({ freq: 1760, dur: 220, type: "square", gain: 0.07, delay: 160 });
  },

  meteor() {
    noise({ dur: 700, gain: 0.18, freq: 5000, freqEnd: 120, q: 0.7 });
    tone({ freq: 140, freqEnd: 40, dur: 500, type: "sawtooth", gain: 0.09, delay: 380 });
  },

  shield() {
    tone({ freq: 523, dur: 120, type: "triangle", gain: 0.1 });
    tone({ freq: 784, dur: 260, type: "triangle", gain: 0.1, delay: 90 });
    noise({ dur: 220, gain: 0.06, freq: 2400, q: 2, delay: 60 });
  },

  lifeLost() {
    tone({ freq: 660, freqEnd: 180, dur: 420, type: "sawtooth", gain: 0.075 });
    noise({ dur: 300, gain: 0.05, freq: 700, q: 0.6 });
  },

  tick(left) {
    const n = Math.max(0, Math.min(10, left | 0));
    const urgency = 1 - n / 10;
    tone({ freq: 1000 + urgency * 900, freqEnd: 700 + urgency * 700, dur: 60 + urgency * 40,
           type: "square", gain: 0.05 + urgency * 0.07 });
  },

  rivalFinish() {
    noise({ dur: 300, gain: 0.08, freq: 2000, freqEnd: 600, q: 0.8 });
    tone({ freq: 440, freqEnd: 330, dur: 240, type: "triangle", gain: 0.07 });
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 250, type: "triangle", gain: 0.13, delay: i * 110 }));
    tone({ freq: 1568, dur: 520, type: "sine", gain: 0.11, delay: 470 });
    bell({ root: 784, gain: 0.12, dur: 1800, delay: 470 });
  },

  lose() {
    bell({ root: 330, gain: 0.18, dur: 1600, delay: 0 });
    bell({ root: 294, gain: 0.16, dur: 1600, delay: 400 });
    bell({ root: 247, gain: 0.2, dur: 2400, delay: 800 });
  }
};
