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
//   // dataUrl is a "data:audio/mpeg;base64,..." string — hand it straight
//   // to core/voice-clips.js's saveVoiceClip() or an <audio> tag.
//   (It was raw "data:audio/wav" before 12/8/2026 — see the MP3 section near
//   the bottom of this file. Both forms play; only the size differs.)
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

// Remembers the last voice a teacher picked in any bulk-generate flow
// (Anagram editor's "Generate all voices", the Excel-import voice panel, …)
// so the next picker opens on it instead of always resetting to DEFAULT_VOICE.
const LAST_VOICE_KEY = "aw.tts.lastVoice";
export function getLastVoice() {
  const v = localStorage.getItem(LAST_VOICE_KEY);
  return (v && VOICES.some(x => x.id === v)) ? v : DEFAULT_VOICE;
}
export function setLastVoice(voiceId) {
  if (voiceId) localStorage.setItem(LAST_VOICE_KEY, voiceId);
}

// Real-world measurement (10/8/2026, RTX-class GPU, kokoro-js@1.2.1): a WARM
// generate() call is ~5.3s on "wasm"/q8 vs ~0.6s on "webgpu"/fp32 — about 8.6x
// faster — with the same output (duration/RMS/peak all matched in a decode
// comparison, no NaNs). Model load itself is slower on webgpu (~8.5s vs
// ~0.8s, one-time shader-compile cost) but that's dwarfed by the per-word
// saving on anything past a handful of words. So: always TRY webgpu first,
// and silently fall back to wasm if `navigator.gpu` is missing, no adapter
// is available, or `from_pretrained` itself throws (e.g. a WebGPU op the
// ONNX graph needs isn't implemented on some driver) — every caller of
// generateSpeechDataUrl gets this for free, no call-site changes needed.
let _activeDevice = null;
export function activeDevice() { return _activeDevice; }   // "webgpu" | "wasm" | null (not loaded yet)

let _ttsP = null;
function loadTTS(onProgress) {
  if (!_ttsP) {
    _ttsP = (async () => {
      const { KokoroTTS } = await import(/* @vite-ignore */ CDN);
      if (typeof navigator !== "undefined" && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device: "webgpu", progress_callback: onProgress });
            _activeDevice = "webgpu";
            return tts;
          }
        } catch { /* fall through to wasm below */ }
      }
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "wasm", progress_callback: onProgress });
      _activeDevice = "wasm";
      return tts;
    })();
  }
  return _ttsP;
}

// ---- MP3 COMPRESSION (12/8/2026) -------------------------------------------
// Kokoro hands back RAW 32-bit float PCM at 24kHz — 768 kb/s, a studio format,
// not a delivery one. Every clip becomes its own Firestore document
// (core/voice-clips.js), stored as base64, which piles another 33% on top. So
// a raw WAV clip cost ~186KB on average (measured on real output: 90KB for
// "cat", 256KB for "photosynthesis") out of a 1 GiB free-tier budget.
//
// Encoding to MP3 48 kb/s mono first cuts that ~15x — measured end to end:
// "elephant" 131,260 -> 8,663 bytes, "photosynthesis" 256,060 -> 16,535 — for
// ~110ms of extra work per word, next to nothing beside the ~1.3s the model
// already spends generating. 48 kb/s is the teacher's own pick (12/8/2026)
// after listening to 64 / 48 / 32 side by side.
//
// WHY MP3 AND NOT OPUS, which would be ~3x smaller again: Safari only learned
// to play Opus in iOS 18.4 (March 2025), so a student on an older iPad would
// get SILENCE — precisely the class of bug that never shows up on the machine
// this is built on. MP3 plays everywhere, on every vintage.
//
// WHY THE ENCODER IS NOT WEB AUDIO: this function also runs inside
// core/tts-worker.js, a Worker with NO AudioContext at all. Kokoro's RawAudio
// already exposes `.audio` (Float32Array) + `.sampling_rate`, so the encoder is
// fed straight from those — which also dodges decodeAudioData silently
// resampling 24kHz up to the device's 48kHz, doubling the samples for no gain.
//
// Note: MP3 adds ~55ms of encoder padding at the head of a clip (measured: a
// 1.025s clip reads back as 1.08s). Irrelevant for a spoken word; recorded here
// because leading silence is exactly what core/sfx.js has to care about.
const MP3_KBPS = 48;
const MP3_FRAME = 1152;   // samples per MP3 frame — what encodeBuffer expects

let _lameP = null;
function loadLame() {
  if (!_lameP) _lameP = import("./vendor/lamejs.mjs").then(m => m.default ?? m);
  return _lameP;
}

// Kokoro RawAudio -> "data:audio/mpeg;base64,..."
async function toMp3DataUrl(raw) {
  const lamejs = await loadLame();
  const f32 = raw.audio;
  const pcm = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = f32[i] < -1 ? -1 : (f32[i] > 1 ? 1 : f32[i]);   // clamp, then scale
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const encoder = new lamejs.Mp3Encoder(1, raw.sampling_rate, MP3_KBPS);
  const parts = [];
  for (let i = 0; i < pcm.length; i += MP3_FRAME) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, i + MP3_FRAME));
    if (chunk.length) parts.push(chunk);
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(tail);
  return blobToDataUrl(new Blob(parts, { type: "audio/mpeg" }));
}

// Generates speech for `text` in `voiceId`. Returns a "data:audio/mpeg;
// base64,..." string — chosen over a Blob/object URL because that's
// exactly what core/voice-clips.js stores in Firestore AND what an
// <audio> tag's src can use directly, no URL.revokeObjectURL bookkeeping
// anywhere in the caller.
export async function generateSpeechDataUrl(text, voiceId, onProgress) {
  const tts = await loadTTS(onProgress);
  const audio = await tts.generate(text, { voice: voiceId || DEFAULT_VOICE });
  try {
    return await toMp3DataUrl(audio);
  } catch (e) {
    // A voice the teacher can hear beats no voice at all: if the encoder ever
    // fails, fall back to the uncompressed WAV this used to return. Callers
    // just store the string and players just set it as an <audio> src, so both
    // forms work — the only difference is size.
    console.warn("AWord: MP3 compression failed, storing WAV instead:", (e && e.message) || e);
    return blobToDataUrl(audio.toBlob());
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read audio blob."));
    reader.readAsDataURL(blob);
  });
}
