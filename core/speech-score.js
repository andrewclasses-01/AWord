// =============================================================
// SPEECH SCORE — listens to a recorded word and grades how close it
// sounds to a target pronunciation, running 100% in the browser (WebGPU/
// WASM via ONNX Runtime Web, no server) — fits AWord's architecture
// exactly, same idiom as core/tts.js (Kokoro) and core/phonemize.js
// (eSpeak-NG): lazy-loaded from a CDN the first time a template actually
// needs it, so pages that never touch pronunciation scoring never pay for
// the model download.
//
// THE PIPELINE (mirrors the open-source "AI Pronunciation Trainer" /
// OpenPronounce projects, re-implemented so it runs client-side instead of
// needing a Python server):
//   1. `core/phonemize.js` (eSpeak-NG) turns the TARGET WORD into a
//      reference IPA string — done ONCE, at content-authoring time in the
//      editor, and stored on the item (`it.phonemes`). NOT part of this
//      file.
//   2. `recognizePhonemes()` (this file) listens to what the STUDENT said
//      and returns the IPA phonemes the model actually heard.
//   3. `scorePronunciation()` (this file) compares the two IPA strings and
//      returns a 0-100 match score.
// Steps 2 use the same espeak-ng phoneme "alphabet" as step 1 on purpose:
// the ASR model below (`wav2vec2-lv-60-espeak-cv-ft`) was fine-tuned
// specifically to output espeak-ng phoneme labels, so both sides of the
// comparison are apples-to-apples.
//
// USAGE (a template's mount(), after recording a clip):
//   import { recognizePhonemes, scorePronunciation } from "../../core/speech-score.js";
//   const heard = await recognizePhonemes(audioBlob, p => ...progress...);
//   const { score } = scorePronunciation(heard, item.phonemes);
//   // score is 0-100 — compare against activity.options.passThreshold
//
// ⚠️ Model is ~240MB (q4, wasm — see loadASR() below for why this file never
// requests the fp32/webgpu build) — much bigger than Kokoro's ~86MB.
// Downloaded ONCE per browser (cached by the browser/ONNX Runtime's own
// model cache) the first time a student actually records something, not
// when the activity merely loads.
//
// ⚠️⚠️ WHY THIS DOESN'T USE transformers.js's pipeline() (bug found + fixed
// live, 10/8/2026): the obvious `pipeline("automatic-speech-recognition",
// MODEL_ID)` throws `Error: Could not locate file: ".../tokenizer.json"` —
// this model's HF repo only ships the OLD "slow" tokenizer format
// (vocab.json + tokenizer_config.json), and transformers.js's tokenizer
// loader (confirmed against @huggingface/transformers@3.8.1, and a known
// open gap — see huggingface/transformers.js issue #93) unconditionally
// requires the newer tokenizer.json and has no vocab.json fallback, even
// though the SAME model loads fine in Python. Verified live in a real
// browser (not guessed): `pipeline(...)` and even the concrete
// `Wav2Vec2CTCTokenizer.from_pretrained(MODEL_ID)` both throw the identical
// error; `AutoProcessor.from_pretrained(MODEL_ID)` and
// `AutoModelForCTC.from_pretrained(MODEL_ID)` — the two pieces that do NOT
// need a tokenizer — load fine.
// FIX: skip the tokenizer entirely. Load the processor (audio -> model
// input) and the CTC model directly, run inference to get raw per-frame
// logits, and do the phoneme decode OURSELVES: greedy argmax each frame,
// collapse consecutive duplicate frames, drop the blank id (CTC's "no
// phoneme this frame" token — id 0 / `<pad>` in this model's vocab.json,
// fetched directly with a plain fetch(), no tokenizer class involved). This
// is the textbook CTC greedy decode — exactly what a "fast tokenizer" would
// have done for us, just written by hand in ~15 lines because the packaged
// one refuses to load. Confirmed correct with a real TTS-generated
// "elephant" clip round-tripped through this exact code: heard "ɛlɪfənt"
// against phonemize("elephant") = "ˈɛlɪfənt" — a 100% score once the stress
// mark is stripped (scorePronunciation already does that).
// =============================================================

const CDN = "https://esm.sh/@huggingface/transformers@3.8.1";
const MODEL_ID = "onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX";
const VOCAB_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/vocab.json`;
const BLANK_ID = 0;   // CTC blank token — this model's vocab.json maps "<pad>" -> 0

let _activeDevice = null;
export function activeDevice() { return _activeDevice; }   // "wasm" | null (not loaded yet) — see loadASR() for why webgpu is never used here

// Unlike core/tts.js (Kokoro), this ALWAYS loads the quantized wasm build,
// never tries webgpu/fp32. Deliberate, not an oversight: Kokoro's
// webgpu-first choice pays off because a teacher generates MANY clips back
// to back in one editor session (Đợt 103 measured ~8.6x — worth a bigger,
// slower-to-load fp32 file). Here a student records ONE short clip and
// waits for ONE quick recognize — CTC inference over a couple of seconds of
// audio is fast on wasm regardless of device, so download SIZE dominates
// the experience, not inference speed. fp32/webgpu for this model is
// ~1.26GB (confirmed live, 10/8/2026 — same architecture, just a much
// bigger backbone than Kokoro's 82M params); the quantized q4/wasm build is
// ~240MB. Smaller download wins for a one-shot-per-turn use case.
let _asrP = null;
function loadASR(onProgress) {
  if (!_asrP) {
    _asrP = (async () => {
      const mod = await import(/* @vite-ignore */ CDN);
      const [processor, model, vocab] = await Promise.all([
        mod.AutoProcessor.from_pretrained(MODEL_ID),
        mod.AutoModelForCTC.from_pretrained(MODEL_ID, { dtype: "q4", device: "wasm", progress_callback: onProgress }),
        fetch(VOCAB_URL).then(r => r.json())
      ]);
      const id2phoneme = {};
      for (const [symbol, id] of Object.entries(vocab)) id2phoneme[id] = symbol;
      _activeDevice = "wasm";
      return { readAudio: mod.read_audio, processor, model, id2phoneme };
    })();
  }
  return _asrP;
}

// Greedy CTC decode: for each time frame, take the highest-scoring vocab id
// (argmax); collapse runs of the same id down to one (CTC's own convention
// — a sustained sound repeats the same label across several frames); then
// drop every remaining blank id. What's left, joined in order, is the
// phoneme string.
function greedyCtcDecode(logits, id2phoneme) {
  const [, timeSteps, vocabSize] = logits.dims;
  const data = logits.data;
  const ids = new Array(timeSteps);
  for (let t = 0; t < timeSteps; t++) {
    const base = t * vocabSize;
    let bestId = 0, bestVal = -Infinity;
    for (let v = 0; v < vocabSize; v++) {
      const val = data[base + v];
      if (val > bestVal) { bestVal = val; bestId = v; }
    }
    ids[t] = bestId;
  }
  const out = [];
  let prev = null;
  for (const id of ids) {
    if (id !== prev && id !== BLANK_ID) out.push(id2phoneme[id] ?? "");
    prev = id;
  }
  return out.join("");
}

// Listens to `audioSource` (a Blob/File — e.g. straight out of a
// MediaRecorder — or any URL string) and returns the IPA phoneme string the
// model heard. Loads/warms the model on first call (can take a while — pass
// `onProgress` to show a download bar, same shape as core/tts.js's
// generateSpeechDataUrl).
export async function recognizePhonemes(audioSource, onProgress) {
  const { readAudio, processor, model, id2phoneme } = await loadASR(onProgress);
  const isBlob = typeof Blob !== "undefined" && audioSource instanceof Blob;
  const url = isBlob ? URL.createObjectURL(audioSource) : audioSource;
  try {
    const audio = await readAudio(url, 16000);
    const inputs = await processor(audio);
    const output = await model(inputs);
    return greedyCtcDecode(output.logits, id2phoneme);
  } finally {
    if (isBlob) URL.revokeObjectURL(url);
  }
}

// ---- scoring: character-level alignment between two IPA strings ----
//
// Why character-level (not "split on spaces then compare phoneme tokens"):
// eSpeak's phonemizer packs a word's phonemes together with no separator
// ("ˈɛlɪfənt"), while the ASR model's own tokenizer may or may not insert
// spaces between the phones it recognises — the two sides aren't guaranteed
// to tokenize identically. Comparing raw Unicode characters (via
// Array.from, so multi-byte IPA glyphs count as ONE unit each) sidesteps
// that mismatch entirely and is what several open-source pronunciation
// trainers effectively reduce to once symbol-level alignment is done. It's
// an approximation, not a certified phonetic scorer — good enough to rank
// "close" vs "way off" for a classroom pass/fail threshold.
//
// Stress (ˈ ˌ) and length (ː) marks are stripped from BOTH sides before
// comparing — the ASR model is far less reliable at placing these than at
// recognising the phoneme itself, so counting them would punish correct
// pronunciation for a mark the recognizer likely got right or wrong at
// random.
const DIACRITICS = /[ˈˌː]/g;
function normalizeIpa(s) {
  return String(s ?? "").replace(DIACRITICS, "").replace(/\s+/g, "").trim();
}

// Classic Levenshtein DP with backtrace, over Unicode code points (not
// UTF-16 code units — Array.from splits by code point, so no IPA glyph
// ever gets sliced in half). Returns the edit distance plus an alignment
// trace (kept for a future "which sound was wrong" UI; scorePronunciation
// only needs the distance today).
function levenshteinAlign(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const alignment = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      alignment.unshift({ op: "match", ch: a[i - 1] }); i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      alignment.unshift({ op: "sub", spoken: a[i - 1], expected: b[j - 1] }); i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.unshift({ op: "extra", spoken: a[i - 1] }); i--;
    } else {
      alignment.unshift({ op: "missing", expected: b[j - 1] }); j--;
    }
  }
  return { distance: dp[m][n], alignment };
}

// Compares `spokenIpa` (what recognizePhonemes heard) against `referenceIpa`
// (the target word's stored phonemes, from core/phonemize.js) and returns
// `{ score, alignment }`. score is 0-100 — 100 = identical phoneme strings,
// 0 = completely different. An empty reference (word never had phonemes
// generated) always scores 0 rather than throwing, so a caller can just
// compare against the pass threshold either way.
export function scorePronunciation(spokenIpa, referenceIpa) {
  const spoken = Array.from(normalizeIpa(spokenIpa));
  const reference = Array.from(normalizeIpa(referenceIpa));
  if (reference.length === 0) return { score: 0, alignment: [] };
  if (spoken.length === 0) return { score: 0, alignment: reference.map(ch => ({ op: "missing", expected: ch })) };
  const { distance, alignment } = levenshteinAlign(spoken, reference);
  const score = Math.round(Math.max(0, 1 - distance / reference.length) * 100);
  return { score, alignment };
}
