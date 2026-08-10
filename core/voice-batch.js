// =============================================================
// VOICE BATCH — "generate a clip for every item in a list", shared by
// every bulk-TTS flow: the Excel-import voice panel (main.js) AND the
// Anagram editor's "Generate all voices" popover (both switched to this
// 10/8/2026 — previously the editor kept its own inline sequential copy,
// but that's exactly the code this parallel version needs to replace
// everywhere to be worth building).
//
// Runs `pool.size` items concurrently via core/tts-pool.js's Worker pool
// (each Worker holds its OWN Kokoro instance, webgpu-first — see
// core/tts.js) instead of one at a time on the main thread. A teacher's
// "hundreds of words" batch that used to take ~5.3s/word sequentially on
// wasm now runs `pool.size` words at once, each already ~8.6x faster on
// its own from the webgpu switch — the two wins compound.
// =============================================================

import { saveVoiceClip } from "./voice-clips.js";
import { createPool, recommendedPoolSize } from "./tts-pool.js";

// `items`: objects with a `.clue`/`.voice`/`.voiceId`/`.hideText` shape
// (matches templates/anagram content.items). `textFor(item)` returns the
// string to speak. `onProgress(done, failed, total)` fires after every
// item (order is whichever lane finishes next, not list order). `isCancelled()`
// is polled between items ON EACH LANE — a soft-cancel: whatever's already
// in flight on a lane always finishes (no cancellation hook into a
// generate() call already running), so a cancel can still land up to
// `pool.size` more words after the click, same idea as the old one-at-a-
// time soft-cancel just N-wide.
//
// Mutates each generated item in place (`voice`/`voiceId`/`hideText`) and
// returns { done, failed, signedOut } — the caller decides what "signed
// out" or a partial run means for its own UI/persistence.
export async function generateVoicesBatch(items, voiceId, { textFor, onProgress, isCancelled }) {
  // Don't spin up more Workers (each loading its own ~86MB model) than
  // there are items to hand them — a 2-word regenerate on a wasm fallback
  // machine shouldn't launch a full 8-worker pool.
  const laneCount = Math.max(1, Math.min(await recommendedPoolSize(), items.length || 1));
  const pool = await createPool(laneCount);
  let done = 0, failed = 0, signedOut = false;
  let cursor = 0;

  async function lane() {
    while (cursor < items.length) {
      if (signedOut || (isCancelled && isCancelled())) return;
      const it = items[cursor++];
      const text = textFor(it);
      try {
        const dataUrl = await pool.run(text, voiceId);
        const id = await saveVoiceClip({ id: it.voice || undefined, text, voiceId, audioDataUrl: dataUrl });
        it.voice = id; it.voiceId = voiceId; it.hideText = true;
        done++;
      } catch (e) {
        if (e && e.code === "aw/signed-out") { signedOut = true; return; }
        failed++;
      }
      onProgress && onProgress(done, failed, items.length);
    }
  }

  // `pool.size` lanes, each pulling the next unclaimed item off the shared
  // cursor — bounds real concurrency to the pool's own worker count and
  // lets isCancelled/signedOut take effect between EVERY item on EVERY
  // lane, not just once.
  await Promise.all(Array.from({ length: pool.size }, lane));
  pool.terminate();
  return { done, failed, signedOut };
}
