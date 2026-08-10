// =============================================================
// PHONEMIZE — text -> IPA phonemes via eSpeak-NG, running 100% in the
// browser (WASM, no server) through the `phonemizer` package (Apache-2.0,
// by the same author as transformers.js). Companion to core/speech-score.js:
// both sides of a pronunciation check need to speak the SAME "phoneme
// language" — this IS espeak-ng's IPA output, exactly what
// onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX was fine-tuned to
// recognise from audio (see core/speech-score.js header for why that
// matters). Lazy-loaded from a CDN the first time something actually calls
// it, same idiom as core/tts.js loading Kokoro.
//
// USAGE (an editor computing the "target" pronunciation for a word, ONCE,
// at content-authoring time — NOT during play, same pattern as generating
// a voice clip in templates/anagram/anagram-editor.js):
//   import { phonemizeWord } from "../../core/phonemize.js";
//   const ipa = await phonemizeWord("elephant");   // "ˈɛlɪfənt"
// =============================================================

const CDN = "https://esm.sh/phonemizer@1.2.1";

let _modP = null;
function loadPhonemizer() {
  if (!_modP) _modP = import(/* @vite-ignore */ CDN);
  return _modP;
}

// English (US) — the espeak-ng voice code, matches the accent
// onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX was mainly evaluated
// against and closest to AWord's default Kokoro voice ("bf_emma" is
// en-gb, but most content + the sample activity are written in US
// spelling/vocabulary).
export const DEFAULT_LANG = "en-us";

// Returns ONE IPA string for `text` (a single word or short phrase).
// phonemize() itself returns an array — one entry per sentence it split
// the input into on punctuation; a bare word/phrase never splits, so
// joining with a space is just a safe fallback (keeps the caller's API
// simple: always a string, never an array).
export async function phonemizeWord(text, lang = DEFAULT_LANG) {
  const clean = String(text ?? "").trim();
  if (!clean) return "";
  const { phonemize } = await loadPhonemizer();
  const parts = await phonemize(clean, lang);
  return (parts || []).join(" ").trim();
}
