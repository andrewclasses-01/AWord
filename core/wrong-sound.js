// =============================================================
// WRONG-SOUND CHOICE (Đợt 274, 27/8/2026, thầy) — a teacher preference for
// the sound every template plays on a wrong click/pick/answer, letting the
// classroom hear a "meme" clip (Bruh, Error, FAAAH, Oh my god, What da dog
// doing…) instead of each game's own built-in effect.
//
// ⛔⛔ NORMAL PLAY ONLY. An assignment/homework play (`session` truthy in
// core/engine.js's startGame()) NEVER hears these — it always keeps the
// template's own default wrong sound, exactly as before this đợt. These meme
// clips are for playing along together in class; a pupil doing homework alone
// gets the same serious feedback sound it always got. `setAssignmentMode()`
// below is called once per startGame() so this file always knows which mode
// the current play is in — see the call site in core/engine.js.
//
// Every template's own `-sound.js` module still owns its real "wrong" effect
// (its own mp3 pool, or a synthesized tone for the two templates with no
// Wordwall original) — this file does not replace any of that. Each module
// just wraps its wrong-effect function with `playWrongEffect()` below, which
// either runs it unchanged (default choice, or homework) or plays the chosen
// meme clip instead.
//
// Files live in ./assets/sounds/meme/, resolved relative to THIS module
// (import.meta.url) — same self-contained pattern as core/sound.js's old
// wrong() file and every template's own sound pack.
// =============================================================

import { sound } from "./sound.js";

const KEY = "aword-wrongsound";

// `file` is the base name under ./assets/sounds/meme/. The first entry
// ("default") has none — it means "let the template play its own sound".
export const WRONG_SOUND_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "bruh", label: "Bruh", file: "bruh" },
  { id: "error", label: "Error", file: "error" },
  { id: "faaah", label: "FAAAH", file: "faaah" },
  { id: "ohmygod", label: "Oh my god", file: "oh-my-god" },
  { id: "whatdadog", label: "What da dog doing", file: "what-da-dog-doing" }
];

function urlFor(file) {
  return new URL(`./assets/sounds/meme/${file}.mp3`, import.meta.url).href;
}

// One <audio> per file, built lazily and reused — same shape as the rest of
// the codebase's small sound helpers (core/sound.js's wrongEl()).
const els = new Map();
function elFor(file) {
  let a = els.get(file);
  if (!a) { a = new Audio(urlFor(file)); a.preload = "auto"; els.set(file, a); }
  return a;
}
// Fetch every clip early (tiny files, ~120 KB total) so the FIRST time a
// teacher picks one — in Settings or mid-game — it plays instantly instead of
// waiting on a fetch, the same "prime early" lesson core/sfx.js documents.
WRONG_SOUND_OPTIONS.forEach(o => { if (o.file) elFor(o.file).load(); });

export function getWrongSoundChoice() {
  try { return localStorage.getItem(KEY) || "default"; } catch { return "default"; }
}
export function setWrongSoundChoice(id) {
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
}

// Set once per startGame() (core/engine.js) — true for a pupil's assignment
// play, false for every other mode (Single, Showdown, Fight...).
let assignmentMode = false;
export function setAssignmentMode(on) { assignmentMode = !!on; }

// Play the chosen meme clip right now, ignoring assignment mode — used by the
// Settings screen so tapping a choice previews it immediately.
export function previewWrongSound(id) {
  const opt = WRONG_SOUND_OPTIONS.find(o => o.id === id);
  if (!opt || !opt.file) return;
  try {
    const a = elFor(opt.file);
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch { /* ignore */ }
}

/**
 * What every template's wrong-effect wrapper calls. `fallback` is that
 * template's own effect (its mp3 pool play, or a synthesized tone) — called
 * unchanged whenever the override does not apply.
 */
export function playWrongEffect(fallback) {
  if (assignmentMode) return fallback();
  const id = getWrongSoundChoice();
  if (id === "default") return fallback();
  const opt = WRONG_SOUND_OPTIONS.find(o => o.id === id);
  if (!opt || !opt.file) return fallback();
  if (sound.isMuted()) return;   // the fallback path would have respected this too
  try {
    const a = elFor(opt.file);
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch { /* ignore */ }
}

// Thin wrapper so a template's `wrong: makePool([...])` one-liner becomes
// `wrong: wrapWrong(makePool([...]))` without changing shape.
export function wrapWrong(fallbackFn) {
  return (...args) => playWrongEffect(() => fallbackFn(...args));
}
