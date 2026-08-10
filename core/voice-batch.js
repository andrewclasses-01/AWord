// =============================================================
// VOICE BATCH — sequential "generate a clip for every item in a list"
// loop, shared by any bulk-TTS flow (currently: the Excel-import voice
// panel in main.js; templates/anagram/anagram-editor.js's own "Generate
// all voices" popover keeps its inline copy since it predates this file
// and is already shipped/tested — no need to touch it just for DRY-ness).
//
// Runs ONE clip at a time on purpose: core/tts.js's Kokoro model is a
// lazy module-scoped singleton, so back-to-back calls only pay its
// ~86MB load once — parallelizing would not make this faster, only
// harder to show accurate progress for.
// =============================================================

import { generateSpeechDataUrl } from "./tts.js";
import { saveVoiceClip } from "./voice-clips.js";

// `items`: objects with a `.clue`/`.voice`/`.voiceId`/`.hideText` shape
// (matches templates/anagram content.items). `textFor(item)` returns the
// string to speak. `onProgress(done, failed, total)` fires after every
// item. `isCancelled()` is polled BETWEEN items — a soft-cancel, same as
// the Anagram editor's: an in-flight generateSpeechDataUrl call always
// finishes (kokoro-js has no cancellation hook).
//
// Mutates each generated item in place (`voice`/`voiceId`/`hideText`) and
// returns { done, failed, signedOut } — the caller decides what "signed
// out" or a partial run means for its own UI/persistence.
export async function generateVoicesSequential(items, voiceId, { textFor, onProgress, isCancelled }) {
  let done = 0, failed = 0, signedOut = false;
  for (const it of items) {
    if (isCancelled && isCancelled()) break;
    const text = textFor(it);
    try {
      const dataUrl = await generateSpeechDataUrl(text, voiceId, () => {});
      const id = await saveVoiceClip({ id: it.voice || undefined, text, voiceId, audioDataUrl: dataUrl });
      it.voice = id; it.voiceId = voiceId; it.hideText = true;
      done++;
    } catch (e) {
      if (e && e.code === "aw/signed-out") { signedOut = true; break; }
      failed++;
    }
    onProgress && onProgress(done, failed, items.length);
  }
  return { done, failed, signedOut };
}
