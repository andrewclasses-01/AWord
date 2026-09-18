// =============================================================
// FIND THE GAP — the listening file. Two jobs:
//
//  1. loadAudio(url, onProgress) -> Promise<blobUrl>
//     Downloads the WHOLE mp3 ONCE (before PLAY, through tpl.prepare) and
//     hands back a blob: URL. Every seek is then in-memory — measured 18/9/2026
//     (web/scratch/ftg-seek-test.html): 1 ms per jump on any network once the
//     file is local, versus ~1–1.8 s per jump on a weak 3G link when the
//     <audio> streams straight from the URL. Kept in Cache Storage for a day
//     (same idea as core/voice-clips.js's clip cache) so a class that replays
//     the lesson the next day does not download it again.
//
//  2. createSegmentPlayer(blobUrl) -> { play(start, end), stop(), pause(),
//     resume(), isPlaying(), onState(fn), destroy() }
//     ONE <audio> element that plays [start, end) and stops itself. The stop
//     is polled every 25 ms (timeupdate alone fires only ~4×/s, which would let
//     the next speaker's first word leak through on short lines).
//
// ⚠️ The engine's ☰ pause only reaches mp3 packs registered in
// window.__awSfxPacks and WAAPI animations — NOT a bare <audio>. The template
// bridges pause/resume through tpl.onPause (see find-the-gap.js).
// =============================================================

const CACHE_NAME = "aword-ftg-audio-v1";
const CACHE_TTL_MS = 24 * 3600 * 1000;
const inflight = new Map();   // url -> Promise<blobUrl>   (memoised, failures forgotten)
const blobUrls = new Map();   // url -> blob: URL already created in this page

async function fromCache(url) {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(url);
    if (!res) return null;
    const saved = Number(res.headers.get("x-aword-saved") || 0);
    if (!saved || Date.now() - saved > CACHE_TTL_MS) { cache.delete(url).catch(() => {}); return null; }
    return await res.blob();
  } catch (e) { return null; }
}

async function toCache(url, blob) {
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(blob, { headers: { "Content-Type": "audio/mpeg", "x-aword-saved": String(Date.now()) } }));
  } catch (e) { /* quota / private mode — playing still works from memory */ }
}

// Download with a progress callback ({ loaded, total }) — streams the body
// when the browser lets us, falls back to one blob() otherwise.
async function download(url, onProgress) {
  const res = await fetch(url, { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const total = Number(res.headers.get("Content-Length") || 0);
  if (!res.body || !res.body.getReader) {
    const b = await res.blob();
    onProgress && onProgress({ loaded: b.size, total: b.size });
    return b;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.byteLength;
    onProgress && onProgress({ loaded, total });
  }
  return new Blob(chunks, { type: res.headers.get("Content-Type") || "audio/mpeg" });
}

export function loadAudio(url, onProgress) {
  if (!url) return Promise.reject(new Error("no audio"));
  if (blobUrls.has(url)) { onProgress && onProgress({ loaded: 1, total: 1 }); return Promise.resolve(blobUrls.get(url)); }
  if (inflight.has(url)) return inflight.get(url);
  const p = (async () => {
    let blob = await fromCache(url);
    if (blob) onProgress && onProgress({ loaded: blob.size, total: blob.size });
    else { blob = await download(url, onProgress); toCache(url, blob); }
    const bu = URL.createObjectURL(blob);
    blobUrls.set(url, bu);
    return bu;
  })();
  // a failed download must NOT be remembered — the next attempt (Start again,
  // or the game's own on-demand load) gets a fresh try
  p.catch(() => { inflight.delete(url); });
  inflight.set(url, p);
  return p;
}

export function hasAudio(url) { return blobUrls.has(url); }

export function createSegmentPlayer(src) {
  const a = new Audio();
  a.preload = "auto";
  a.src = src;
  let endAt = 0, timer = null, playing = false, paused = false, gen = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(playing); } catch (e) { /* listener's problem */ } });
  const setPlaying = v => { if (playing === v) return; playing = v; emit(); };
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function arm() {
    clearTimer();
    timer = setInterval(() => {
      if (paused) return;
      if (a.ended || a.currentTime >= endAt - 0.02) { a.pause(); clearTimer(); setPlaying(false); }
    }, 25);
  }
  return {
    // Play [start, end). Resolves when playback has STARTED (or failed).
    async play(start, end) {
      const my = ++gen;
      paused = false;
      endAt = Math.max(Number(end) || 0, (Number(start) || 0) + 0.3);
      try {
        a.pause();
        a.currentTime = Math.max(0, Number(start) || 0);
        await a.play();
        if (my !== gen) return false;
        setPlaying(true);
        arm();
        return true;
      } catch (e) {
        if (my === gen) setPlaying(false);
        return false;
      }
    },
    stop() { gen++; paused = false; clearTimer(); try { a.pause(); } catch (e) { /* no-op */ } setPlaying(false); },
    // ☰ Menu pause: hold the position, keep `playing` true so the UI still
    // shows the segment as in progress, and resume where we left off.
    pause() { if (!playing || paused) return; paused = true; try { a.pause(); } catch (e) { /* no-op */ } },
    resume() { if (!playing || !paused) return; paused = false; a.play().catch(() => { clearTimer(); setPlaying(false); }); },
    isPlaying() { return playing; },
    isPaused() { return paused; },
    onState(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() { gen++; clearTimer(); try { a.pause(); a.src = ""; a.load(); } catch (e) { /* no-op */ } listeners.clear(); playing = false; }
  };
}
