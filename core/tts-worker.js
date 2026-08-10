// =============================================================
// TTS WORKER — one Kokoro model instance living entirely inside its own
// Web Worker (own JS realm, own module cache), so core/tts-pool.js can run
// several of these side by side for real parallel generation. Each worker
// does its OWN webgpu→wasm fallback (see core/tts.js's loadTTS()) — there
// is no cross-worker device negotiation, every worker just tries the best
// device it can get independently.
//
// Protocol: postMessage({id, text, voiceId}) in, one
// postMessage({id, ok:true, dataUrl}) or {id, ok:false, error, code} out.
// =============================================================

import { generateSpeechDataUrl } from "./tts.js";

self.onmessage = async e => {
  const { id, text, voiceId } = e.data;
  try {
    const dataUrl = await generateSpeechDataUrl(text, voiceId, () => {});
    self.postMessage({ id, ok: true, dataUrl });
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err && err.message) || String(err), code: err && err.code });
  }
};
