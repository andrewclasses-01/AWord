// =============================================================
// SOUND — game sounds generated with Web Audio (no files needed).
// correct() = bright "ting!", wrong() = "Oh my god" meme mp3.
// The speaker button in the game toggles these on/off.
// =============================================================

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

// Play one tone. freqEnd (optional) glides the pitch down/up during the note.
function tone({ freq, freqEnd = null, dur, type = "sine", gain = 0.15, delay = 0 }) {
  if (muted) return;
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
    osc.connect(g);
    g.connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur / 1000 + 0.02);
  } catch (e) { /* ignore if the browser blocks audio */ }
}

// Wrong-answer sound: "Oh my god" meme (mp3 bundled offline).
// URL is resolved RELATIVE TO THIS FILE (works from any page depth or host subpath).
const WRONG_MP3 = new URL("./assets/sounds/oh-my-god-meme.mp3", import.meta.url).href;
let wrongAudio = null;
function playWrongFile() {
  try {
    if (!wrongAudio) {
      wrongAudio = new Audio(WRONG_MP3);
      wrongAudio.preload = "auto";
    }
    wrongAudio.currentTime = 0;
    // if the file fails for any reason, fall back to a low "womp" tone
    wrongAudio.play().catch(() => tone({ freq: 220, freqEnd: 110, dur: 320, type: "sawtooth", gain: 0.11 }));
  } catch {
    tone({ freq: 220, freqEnd: 110, dur: 320, type: "sawtooth", gain: 0.11 });
  }
}

export const sound = {
  // bright bell-like "ting!" (two high sine notes)
  correct() {
    tone({ freq: 1318, dur: 260, type: "sine", gain: 0.16 });
    tone({ freq: 1976, dur: 340, type: "sine", gain: 0.12, delay: 70 });
  },
  // "Oh my god" meme sound
  wrong() {
    if (muted) return;
    playWrongFile();
  },
  // cheerful little fanfare for "Game complete"
  fanfare() {
    const notes = [523, 659, 784, 1046];          // C5 E5 G5 C6
    notes.forEach((f, i) => tone({ freq: f, dur: 240, type: "triangle", gain: 0.13, delay: i * 110 }));
    tone({ freq: 1568, dur: 420, type: "sine", gain: 0.1, delay: 470 });
  },
  // bright startup chime when a game begins (rising sparkle)
  start() {
    const seq = [523, 659, 784, 1046, 1319];      // C E G C E — ascending
    seq.forEach((f, i) => tone({ freq: f, dur: 190, type: "triangle", gain: 0.12, delay: i * 85 }));
  },
  // subtle UI click for buttons
  click() {
    tone({ freq: 900, freqEnd: 1250, dur: 70, type: "sine", gain: 0.08 });
  },
  isMuted() { return muted; },
  toggle()  { muted = !muted; return muted; }
};
