// =============================================================
// TTS — Kokoro-82M text-to-speech (Apache-2.0), running 100% in the
// browser via the `kokoro-js` package (WASM, no server) — fits AWord's
// architecture exactly (static GitHub Pages hosting, no backend other
// than Firestore). Lazy-loaded from a CDN the first time a template
// actually asks for it, same idiom as core/firebase.js lazy-loading the
// Firebase SDK — pages that never touch TTS never pay for the ~86MB
// model download.
//
// USAGE (an editor generating a pronunciation clip):
//   import { VOICES, DEFAULT_VOICE, generateSpeechDataUrl } from "../../core/tts.js";
//   const dataUrl = await generateSpeechDataUrl("elephant", "bf_emma", p => ...progress...);
//   // dataUrl is a "data:audio/wav;base64,..." string — hand it straight
//   // to core/voice-clips.js's saveVoiceClip() or an <audio> tag.
//
// The model itself is only loaded ONCE per page (module-scoped singleton
// promise) even if generateSpeechDataUrl() is called many times in a row
// (e.g. a teacher generating voice for several words back to back).
// =============================================================

const CDN = "https://esm.sh/kokoro-js@1.2.1";
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

// Captured from a real run of `tts.voices` (kokoro-js@1.2.1, the model
// above) on 10/8/2026 via a browser test — see GHI CHU ANAGRAM.md for
// how it was verified. Hardcoded here (rather than asking the model for
// this list) so the editor can show a voice picker WITHOUT downloading
// the 86MB model first — that only happens once "Generate" is pressed.
// `grade` is Kokoro's own A–F quality grade for that voice.
export const VOICES = [
  { id: "af_heart",    name: "Heart",    lang: "en-us", gender: "Female", grade: "A" },
  { id: "af_bella",    name: "Bella",    lang: "en-us", gender: "Female", grade: "A-" },
  { id: "af_nicole",   name: "Nicole",   lang: "en-us", gender: "Female", grade: "B-" },
  { id: "af_kore",     name: "Kore",     lang: "en-us", gender: "Female", grade: "C+" },
  { id: "af_sarah",    name: "Sarah",    lang: "en-us", gender: "Female", grade: "C+" },
  { id: "af_aoede",    name: "Aoede",    lang: "en-us", gender: "Female", grade: "C+" },
  { id: "af_nova",     name: "Nova",     lang: "en-us", gender: "Female", grade: "C" },
  { id: "af_alloy",    name: "Alloy",    lang: "en-us", gender: "Female", grade: "C" },
  { id: "af_sky",      name: "Sky",      lang: "en-us", gender: "Female", grade: "C-" },
  { id: "af_jessica",  name: "Jessica",  lang: "en-us", gender: "Female", grade: "D" },
  { id: "af_river",    name: "River",    lang: "en-us", gender: "Female", grade: "D" },
  { id: "am_fenrir",   name: "Fenrir",   lang: "en-us", gender: "Male",   grade: "C+" },
  { id: "am_michael",  name: "Michael",  lang: "en-us", gender: "Male",   grade: "C+" },
  { id: "am_puck",     name: "Puck",     lang: "en-us", gender: "Male",   grade: "C+" },
  { id: "am_echo",     name: "Echo",     lang: "en-us", gender: "Male",   grade: "D" },
  { id: "am_eric",     name: "Eric",     lang: "en-us", gender: "Male",   grade: "D" },
  { id: "am_liam",     name: "Liam",     lang: "en-us", gender: "Male",   grade: "D" },
  { id: "am_onyx",     name: "Onyx",     lang: "en-us", gender: "Male",   grade: "D" },
  { id: "am_santa",    name: "Santa",    lang: "en-us", gender: "Male",   grade: "D-" },
  { id: "am_adam",     name: "Adam",     lang: "en-us", gender: "Male",   grade: "F+" },
  { id: "bf_emma",     name: "Emma",     lang: "en-gb", gender: "Female", grade: "B-" },
  { id: "bf_isabella", name: "Isabella", lang: "en-gb", gender: "Female", grade: "C" },
  { id: "bm_fable",    name: "Fable",    lang: "en-gb", gender: "Male",   grade: "C" },
  { id: "bm_george",   name: "George",   lang: "en-gb", gender: "Male",   grade: "C" },
  { id: "bm_lewis",    name: "Lewis",    lang: "en-gb", gender: "Male",   grade: "D+" },
  { id: "bf_alice",    name: "Alice",    lang: "en-gb", gender: "Female", grade: "D" },
  { id: "bf_lily",     name: "Lily",     lang: "en-gb", gender: "Female", grade: "D" },
  { id: "bm_daniel",   name: "Daniel",   lang: "en-gb", gender: "Male",   grade: "D" }
];

// British, best-graded of the bf_/bm_ set — teacher's default (10/8/2026).
export const DEFAULT_VOICE = "bf_emma";

let _ttsP = null;
function loadTTS(onProgress) {
  if (!_ttsP) {
    _ttsP = (async () => {
      const { KokoroTTS } = await import(/* @vite-ignore */ CDN);
      return KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "wasm", progress_callback: onProgress });
    })();
  }
  return _ttsP;
}

// Generates speech for `text` in `voiceId`. Returns a "data:audio/wav;
// base64,..." string — chosen over a Blob/object URL because that's
// exactly what core/voice-clips.js stores in Firestore AND what an
// <audio> tag's src can use directly, no URL.revokeObjectURL bookkeeping
// anywhere in the caller.
export async function generateSpeechDataUrl(text, voiceId, onProgress) {
  const tts = await loadTTS(onProgress);
  const audio = await tts.generate(text, { voice: voiceId || DEFAULT_VOICE });
  return blobToDataUrl(audio.toBlob());
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read audio blob."));
    reader.readAsDataURL(blob);
  });
}
