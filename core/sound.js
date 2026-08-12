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
function wrongEl() {
  if (!wrongAudio) {
    wrongAudio = new Audio(WRONG_MP3);
    wrongAudio.preload = "auto";
  }
  return wrongAudio;
}
function playWrongFile() {
  try {
    wrongEl();
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
  // short dry "tock" for an on-screen-keyboard key press — iPhone-typing style.
  // Two very short components (a crisp high tick over a tiny low body) with a
  // fast decay so rapid typing stays clean. Respects the global mute like the
  // rest of this module. (Added for Type the answer, 1/8/2026.)
  keyClick() {
    tone({ freq: 1450, freqEnd: 950, dur: 22, type: "square",   gain: 0.05 });
    tone({ freq: 320,  freqEnd: 180, dur: 30, type: "triangle", gain: 0.05 });
  },
  // short bright "ting" for a single correct pick/reveal (lighter than correct())
  tick() {
    tone({ freq: 1760, dur: 130, type: "sine", gain: 0.14 });
  },
  // short low double "duh-duh" buzz for a single wrong pick/reveal
  buzz() {
    tone({ freq: 190, dur: 110, type: "square", gain: 0.09 });
    tone({ freq: 160, dur: 140, type: "square", gain: 0.09, delay: 120 });
  },
  // Pitch-glide tone spanning an EXACT duration the caller controls — for an
  // effect that must sync with a running animation (e.g. Anagram's score
  // count-up, Đợt 134) rather than one of the fixed "themed" sounds above.
  // Thin wrapper so callers outside this module never touch the raw
  // Web-Audio `tone()` internals directly.
  glide({ freq, freqEnd, dur, gain = 0.1, type = "sine" }) {
    tone({ freq, freqEnd, dur, type, gain });
  },
  isMuted() { return muted; },
  toggle()  { muted = !muted; return muted; },

  // The SHARED AudioContext. Templates that synthesize their own sounds
  // (crossword, running word, running team) used to each build a private
  // context — and a fresh context makes its FIRST sound arrive ~37 ms late while
  // the output device spins up (measured: 48 ms vs 10.7 ms). Borrowing this one
  // means they inherit the warm-up below and start in time. (Đợt 85, 7/8/2026)
  context() { return ac(); },

  // ----- Pause/resume the shared context (Đợt 91, 8/8/2026 — Menu pause) -----
  // Every synthesized tone here + every template that borrows this context
  // (crossword, running word, running team) is short one-shot notes, so
  // suspending mid-note just silences it instantly; resuming continues the
  // clock cleanly. No-op if the context was never created (nothing has made a
  // sound yet) or already suspended/running, so this is safe to call blindly.
  pauseContext() {
    try { if (ctx && ctx.state === "running") ctx.suspend(); } catch { /* ignore */ }
  },
  resumeContext() {
    try { if (ctx && ctx.state === "suspended") ctx.resume(); } catch { /* ignore */ }
  },

  // ----- WAKE THE AUDIO DEVICE (Đợt 85, 7/8/2026) -----
  // The AudioContext above is built lazily inside the FIRST tone() call, and the
  // very first sound of a page therefore also pays for starting the output
  // device. Measured on the teacher's machine: first synthesized tone 48 ms,
  // every tone after it 10.7 ms. warmup() pays that 37 ms in advance:
  // it builds + resumes the context, pushes one SILENT sample through it so the
  // device is actually spun up, and creates the wrong-answer element so its file
  // starts downloading too. Safe to call any number of times.
  // (Template mp3 packs warm themselves up — see core/sfx.js prime().)
  warmup() {
    try {
      const a = ac();
      if (a.state === "suspended") a.resume();
      const src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, a.sampleRate);   // 1 silent frame
      src.connect(a.destination);
      src.start(0);
      wrongEl();
    } catch { /* browser blocked audio — nothing to warm up */ }
  }
};

// An AudioContext may only start inside a user gesture, so hook the FIRST one
// anywhere on the page (capture phase, so it lands before the button's own
// click handler). On the teacher's side that gesture is opening the activity,
// long before PLAY; on the student page it is the PLAY press itself, which still
// gets the device started a few ms ahead of the intro sound.
if (typeof window !== "undefined") {
  const wake = () => {
    sound.warmup();
    window.removeEventListener("pointerdown", wake, true);
    window.removeEventListener("keydown", wake, true);
  };
  window.addEventListener("pointerdown", wake, true);
  window.addEventListener("keydown", wake, true);
}
