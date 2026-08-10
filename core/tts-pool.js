// =============================================================
// TTS POOL — a set of core/tts-worker.js Workers, each holding its own
// Kokoro model instance, sharing one job queue.
//
// Pool size is DEVICE-AWARE, and the reason is an inconvenient result
// measured for real (10/8/2026, NVIDIA Lovelace GPU, kokoro-js@1.2.1):
// running several WebGPU instances in parallel is SLOWER than one, not
// faster — 8 words through 1 lane averaged 1.9s/word, through 2 lanes
// 2.6s/word, through 4 lanes 4.6s/word. One physical GPU shares its
// command queue across every context that opens on it, so N parallel
// WebGPU contexts mostly buys N-way shader-compile + driver contention,
// not N-way throughput. So: webgpu → pool size 1 (core/tts.js's
// webgpu-first pick already gets the real win here, ~8.6x over wasm on
// its own — see its comment — parallelism on top of THAT is a net loss).
//
// wasm, by contrast, is genuinely CPU-bound with no shared device to
// contend over — multiple Workers each on their own core should scale
// close to linearly. That path is NOT re-measured here (this machine has
// a GPU, so it never falls back) — sized by hardwareConcurrency on
// established CPU-parallelism grounds, not a fresh benchmark; worth a
// real measurement on a GPU-less machine if one's available later.
//
// Deciding this needs to know which device the workers will land on
// BEFORE creating any of them (spinning up N and discovering the mismatch
// after they've all loaded would waste the very time this exists to
// save) — probed cheaply on the calling thread via requestAdapter(),
// which doesn't load the model, just asks "is there a GPU here at all".
// A worker's own webgpu→wasm fallback (core/tts.js) can still differ in
// theory (e.g. a WebGPU op this graph needs is missing on some driver),
// but device availability itself is a machine-level fact, not a
// per-instance coin flip, so this is a reliable-enough predictor.
// =============================================================

export async function recommendedPoolSize() {
  if (typeof navigator !== "undefined" && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return 1;
    } catch { /* fall through to the wasm sizing below */ }
  }
  const n = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
  return Math.max(2, Math.min(8, n));
}

// Created fresh per batch and terminated when the batch ends (matches the
// rest of the app's "load once per use" idiom, and frees whatever RAM/GPU
// memory `size` model instances hold the moment a batch is done, rather
// than letting it linger across an entire teacher session).
export async function createPool(size) {
  const n = size || await recommendedPoolSize();
  const workers = Array.from({ length: n }, () => new Worker(new URL("./tts-worker.js", import.meta.url), { type: "module" }));
  const idle = workers.slice();
  const queue = [];
  const inFlight = new Map();   // Worker -> {resolve, reject}
  let nextId = 0;

  workers.forEach(w => {
    w.onmessage = e => {
      const { id, ok, dataUrl, error, code } = e.data;
      const job = inFlight.get(w);
      inFlight.delete(w);
      idle.push(w);
      if (job) {
        if (ok) job.resolve(dataUrl);
        else { const err = new Error(error); if (code) err.code = code; job.reject(err); }
      }
      pump();
    };
    w.onerror = e => {
      const job = inFlight.get(w);
      inFlight.delete(w);
      idle.push(w);
      if (job) job.reject(new Error(e.message || "TTS worker crashed."));
      pump();
    };
  });

  function pump() {
    while (idle.length && queue.length) {
      const w = idle.pop();
      const job = queue.shift();
      inFlight.set(w, job);
      w.postMessage({ id: job.id, text: job.text, voiceId: job.voiceId });
    }
  }

  function run(text, voiceId) {
    return new Promise((resolve, reject) => {
      queue.push({ id: nextId++, text, voiceId, resolve, reject });
      pump();
    });
  }

  function terminate() { workers.forEach(w => w.terminate()); }

  return { run, terminate, size: n };
}
