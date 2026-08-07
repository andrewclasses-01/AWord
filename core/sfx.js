// =============================================================
// SFX — the shared mp3 sound-pack player for every template (Đợt 85, 7/8/2026).
//
// WHY THIS FILE EXISTS — the bug it fixes:
// every template used to carry its own copy of this block:
//
//     if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
//     a.currentTime = 0; a.play();
//
// The <audio> was therefore BORN at the very moment the sound was needed, so the
// FIRST time each effect fired it had to go and fetch the file first. Measured on
// the live site: first play 67–363 ms, every play after that 5–19 ms. That is
// exactly the "sounds lag until you've played a while / pressed Start again"
// the teacher reported — by then every file has been fetched once.
//
// The fix is not a different audio format (measured: the .ogg originals and our
// .mp3 copies have IDENTICAL leading silence, ±1 ms) — it is fetching EARLY.
// A pack calls prime() at module-import time, which `ensureTemplate()` runs
// BEFORE the READY screen is drawn, so by the time the teacher presses PLAY the
// files are already loaded. Measured after the change: 8 ms on first play.
//
// Measured limits behind the design (7/8/2026, Chrome on the teacher's machine):
//   · 200 primed <audio> elements alive at once → the OLDEST still plays in 11 ms
//     (readyState 4). No eviction, so packs may simply stay primed; no LRU needed.
//   · pre-decoding to Web Audio buffers instead would give 6.7 ms — 1.3 ms better
//     for 3.6–49 MB of RAM per pack. Not worth it; elements cost ~nothing.
//
// The public shape is deliberately the same as the old per-template helpers, so
// a template's own sound module keeps its exported object exactly as it was.
// =============================================================

import { sound as coreSound } from "./sound.js";

// How many files may be loading at the same time. A pack can hold 47 files
// (gameshow); firing all of them at once would fight the page's own assets for
// the connection on a slow classroom link. Four keeps the pipe busy without
// starving anything else.
const PRIME_CONCURRENCY = 4;

/**
 * Build a sound pack for one template.
 *
 * @param {string} moduleUrl  always `import.meta.url` — file URLs resolve
 *        relative to the CALLING module, so a pack works from any page depth
 *        (index.html, play.html, templates/<x>/test.html) and any host subpath.
 * @param {object} spec
 *        names: string[]  every file base name in ./sounds/ the template uses
 *        hot:   string[]  the ones to fetch FIRST (the effects that fire during
 *                         play — correct / wrong / tick). Optional.
 *        skip:  string[]  names NOT to prime (long background music: it is
 *                         streamed, not a snappy one-shot, and priming it would
 *                         hog the connection). Optional.
 *        dir:   string    sub-folder, default "sounds".
 */
export function createPack(moduleUrl, spec = {}) {
  const names = spec.names || [];
  const hot = spec.hot || [];
  const skip = new Set(spec.skip || []);
  const dir = spec.dir || "sounds";

  const urlFor = name => new URL(`./${dir}/${name}.mp3`, moduleUrl).href;
  const cache = new Map();

  function elFor(name) {
    let a = cache.get(name);
    if (!a) {
      a = new Audio(urlFor(name));
      a.preload = "auto";
      cache.set(name, a);
    }
    return a;
  }

  // Play one file. `volume` is optional — leaving it out keeps whatever volume
  // the element already had, exactly like the old per-template playFile().
  // Returns the element (some templates keep it to stop the sound early), or
  // null when muted / blocked.
  function play(name, volume) {
    if (coreSound.isMuted()) return null;
    try {
      const a = elFor(name);
      a.currentTime = 0;
      if (volume != null) a.volume = volume;
      a.play().catch(() => {});
      return a;
    } catch { return null; }
  }

  function stop(name) {
    try { const a = cache.get(name); if (a) { a.pause(); a.currentTime = 0; } } catch { /* ignore */ }
  }

  // True length of a file in ms, so a VISUAL effect can be timed to its sound.
  // After prime() the metadata is there, so the fallback is now a rare path.
  function durationMs(name, fallbackMs = 0) {
    try {
      const d = elFor(name).duration;
      return (isFinite(d) && d > 0) ? Math.round(d * 1000) : fallbackMs;
    } catch { return fallbackMs; }
  }

  // One random file out of a same-purpose group, never the same one twice in a
  // row — several correct answers in a row must not sound robotic. (This used to
  // be copy-pasted into all 14 template sound modules as `makePool`.)
  function pool(list, volume) {
    let last = -1;
    return function playOne() {
      let i = Math.floor(Math.random() * list.length);
      if (list.length > 1 && i === last) i = (i + 1) % list.length;
      last = i;
      return play(list[i], volume);
    };
  }

  // ---- the actual fix: fetch everything up front, a few files at a time ----
  let primed = false;
  function prime() {
    if (primed) return;
    primed = true;
    // hot names first, then the rest, minus anything the template asked to skip
    const queue = [...new Set([...hot, ...names])].filter(n => !skip.has(n));
    let next = 0;
    const startOne = () => {
      if (next >= queue.length) return;
      const name = queue[next++];
      let moved = false;
      const advance = () => { if (moved) return; moved = true; startOne(); };
      try {
        const a = elFor(name);
        if (a.readyState >= 4) return advance();
        a.addEventListener("canplaythrough", advance, { once: true });
        a.addEventListener("error", advance, { once: true });   // a missing file must not stall the queue
        // Belt and braces: a stalled request (or a tab that never fires media
        // events because it is hidden) must not park the queue forever.
        setTimeout(advance, 8000);
        a.load();
      } catch { advance(); }
    };
    for (let i = 0; i < PRIME_CONCURRENCY; i++) startOne();
  }

  const pack = { play, stop, pool, prime, durationMs, el: elFor, urlFor,

    // Diagnostics — lets a test page (or a future session) prove the pack really
    // was loaded BEFORE the teacher pressed PLAY, which is the whole point of
    // this file. readyState 4 = HAVE_ENOUGH_DATA = plays instantly.
    stats() {
      const wanted = [...new Set([...hot, ...names])].filter(n => !skip.has(n));
      let ready = 0;
      for (const n of wanted) { const a = cache.get(n); if (a && a.readyState >= 4) ready++; }
      return { total: wanted.length, built: cache.size, ready, primed };
    }
  };

  // Same idea as `window.__awordBridge` in engine.js: a handle for tests, inert
  // in normal play.
  if (typeof window !== "undefined") {
    (window.__awSfxPacks = window.__awSfxPacks || []).push(pack);
  }
  return pack;
}
