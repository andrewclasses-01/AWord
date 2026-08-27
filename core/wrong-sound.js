// =============================================================
// WRONG-SOUND CHOICE (Đợt 274, 27/8/2026 — Đợt 275, 27/8/2026 mở rộng) — a
// teacher preference for the sound every template plays on a wrong
// click/pick/answer, letting the classroom hear a fun clip instead of each
// game's own built-in effect.
//
// ⛔⛔ NORMAL PLAY ONLY. An assignment/homework play (`session` truthy in
// core/engine.js's startGame()) NEVER hears these — it always keeps the
// template's own default wrong sound. `setAssignmentMode()` below is called
// once per startGame() so this file always knows which mode the current play
// is in — see the call site in core/engine.js.
//
// Every template's own `-sound.js` module still owns its real "wrong" effect
// — this file does not replace any of that, it just wraps it (`wrapWrong`)
// so the override can step in front of it.
//
// ⭐ Đợt 275 (thầy) — three things layered on top of Đợt 274's single fixed
// pick:
//   1. UPLOAD — the teacher can add their own clips, not just the 5 bundled
//      ones. Uploaded audio is stored as a Blob in IndexedDB (device-local,
//      like everything else in this file — no Firestore/Storage involved,
//      so it does NOT follow the teacher between machines, same scope as the
//      choice itself since Đợt 274).
//   2. RENAME / REMOVE — every entry except "Default" can be renamed or
//      removed, including the 5 bundled ones. Removing a bundled one is a
//      per-device soft-delete (an override list), never touches the mp3 file
//      itself — reversible only by clearing localStorage, which is fine: the
//      teacher asked for "delete", not "delete forever with no way back".
//   3. MIX — instead of one fixed pick, tick several entries; every wrong
//      answer then plays a random one of the ticked set (never a fixed
//      pattern the class could learn to predict).
//
// STORAGE SHAPE (all device-local):
//   localStorage["aword-wrongsound"]           — the active choice (JSON):
//     {mode:"default"} | {mode:"single", id} | {mode:"mix", ids:[...]}
//     (a bare string like "bruh" is the Đợt 274 legacy shape — migrated on
//     read, never written again)
//   localStorage["aword-wrongsound-overrides"] — { removed:[id,...], renamed:{id:label} }
//     — soft-delete + rename diffs against the 5 BUILTIN_SOUNDS below
//   localStorage["aword-wrongsound-custom"]    — [{id, label}, ...] metadata
//     for uploaded sounds; the audio bytes themselves live in IndexedDB
//     (db "aword-wrongsound-db", store "sounds", keyed by the same id)
// =============================================================

import { sound } from "./sound.js";

const CHOICE_KEY = "aword-wrongsound";
const OVERRIDES_KEY = "aword-wrongsound-overrides";
const CUSTOM_KEY = "aword-wrongsound-custom";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // generous for a short meme clip, guards against a giant pick by accident
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|oga|m4a|aac|webm|opus|flac)$/i;

// The 5 clips shipped with the app. Immutable definitions — a "delete" or
// "rename" of one of these is recorded as a DIFF (see overrides above), never
// mutates this list, so the app's own asset files are never touched.
const BUILTIN_SOUNDS = [
  { id: "bruh", label: "Bruh", file: "bruh" },
  { id: "error", label: "Error", file: "error" },
  { id: "faaah", label: "FAAAH", file: "faaah" },
  { id: "ohmygod", label: "Oh my god", file: "oh-my-god" },
  { id: "whatdadog", label: "What da dog doing", file: "what-da-dog-doing" }
];

// ----------------- tiny localStorage readers/writers -----------------
function readJson(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function readOverrides() {
  const o = readJson(OVERRIDES_KEY, null);
  return (o && typeof o === "object")
    ? { removed: Array.isArray(o.removed) ? o.removed : [], renamed: (o.renamed && typeof o.renamed === "object") ? o.renamed : {} }
    : { removed: [], renamed: {} };
}
function writeOverrides(o) { writeJson(OVERRIDES_KEY, o); }

function readCustomMeta() {
  const c = readJson(CUSTOM_KEY, []);
  return Array.isArray(c) ? c : [];
}
function writeCustomMeta(list) { writeJson(CUSTOM_KEY, list); }

// ----------------- the full, current list of selectable entries -----------------
// `kind`: "default" (the one un-removable/un-renamable row) | "builtin" | "custom"
export function getEntries() {
  const ov = readOverrides();
  const builtin = BUILTIN_SOUNDS
    .filter(s => !ov.removed.includes(s.id))
    .map(s => ({ id: s.id, label: ov.renamed[s.id] || s.label, kind: "builtin", file: s.file }));
  const custom = readCustomMeta().map(c => ({ id: c.id, label: c.label, kind: "custom" }));
  return [{ id: "default", label: "Default", kind: "default" }, ...builtin, ...custom];
}
function findEntry(id) { return getEntries().find(e => e.id === id) || null; }

// ----------------- audio: bundled files over HTTP, uploads via IndexedDB -----------------
function urlForBundled(file) {
  return new URL(`./assets/sounds/meme/${file}.mp3`, import.meta.url).href;
}

const DB_NAME = "aword-wrongsound-db";
const STORE = "sounds";
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: "id" }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDelete(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// id -> object URL, for uploaded clips already in memory. Loaded once at
// import time from IndexedDB (see loadCustomBlobs below) and kept in step by
// uploadSound()/removeSound() as the teacher adds or removes clips.
const customUrlCache = new Map();
async function loadCustomBlobs() {
  try {
    const rows = await idbGetAll();
    rows.forEach(r => { if (r && r.blob) customUrlCache.set(r.id, URL.createObjectURL(r.blob)); });
  } catch { /* IndexedDB unavailable — bundled clips still work, uploads just won't play */ }
}
loadCustomBlobs();

function urlForEntry(entry) {
  if (entry.kind === "builtin") return urlForBundled(entry.file);
  if (entry.kind === "custom") return customUrlCache.get(entry.id) || null;
  return null;
}

// One <audio> per entry id, built lazily and reused.
const els = new Map();
function elForEntry(entry) {
  let a = els.get(entry.id);
  if (a) return a;
  const url = urlForEntry(entry);
  if (!url) return null;
  a = new Audio(url);
  a.preload = "auto";
  els.set(entry.id, a);
  return a;
}
// Fetch the 5 bundled clips early (tiny files, ~120 KB total) so the first
// time a teacher picks one it plays instantly — same "prime early" lesson
// core/sfx.js documents. Uploaded clips need no priming: an object URL reads
// straight from the in-memory Blob, no network round trip at all.
BUILTIN_SOUNDS.forEach(s => elForEntry({ id: s.id, kind: "builtin", file: s.file }).load());

// ----------------- rename / remove / upload -----------------
export function renameSound(id, newLabel) {
  const label = (newLabel || "").trim();
  if (!label || id === "default") return;
  if (BUILTIN_SOUNDS.some(s => s.id === id)) {
    const ov = readOverrides();
    ov.renamed[id] = label;
    writeOverrides(ov);
    return;
  }
  const list = readCustomMeta();
  const row = list.find(c => c.id === id);
  if (row) { row.label = label; writeCustomMeta(list); }
}

// Drop `id` out of the active choice if it was part of it — called right
// after a removal so the app is never left pointing at a sound that no
// longer exists.
function pruneChoiceOf(id) {
  const choice = getWrongChoice();
  if (choice.mode === "single" && choice.id === id) setWrongChoice({ mode: "default" });
  else if (choice.mode === "mix") setWrongChoice({ mode: "mix", ids: choice.ids.filter(x => x !== id) });
}

export async function removeSound(id) {
  if (id === "default") return;
  if (BUILTIN_SOUNDS.some(s => s.id === id)) {
    const ov = readOverrides();
    if (!ov.removed.includes(id)) ov.removed.push(id);
    delete ov.renamed[id];
    writeOverrides(ov);
  } else {
    writeCustomMeta(readCustomMeta().filter(c => c.id !== id));
    try { await idbDelete(id); } catch { /* ignore */ }
    const url = customUrlCache.get(id);
    if (url) { URL.revokeObjectURL(url); customUrlCache.delete(id); }
  }
  els.delete(id);
  pruneChoiceOf(id);
}

function looksLikeAudio(file) {
  if (file.type && file.type.startsWith("audio/")) return true;
  if (!file.type && AUDIO_EXT_RE.test(file.name || "")) return true;
  return false;
}
function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return "custom-" + crypto.randomUUID();
  return "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// Add one uploaded clip. Throws (with a message fit to show the teacher
// directly) on a bad file; otherwise stores it and returns the new entry —
// the caller decides whether/how to select it.
export async function uploadSound(file) {
  if (!file) throw new Error("No file chosen.");
  if (!looksLikeAudio(file)) throw new Error("Please choose an audio file.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That file is too big (max 8 MB).");
  const id = genId();
  await idbPut(id, file);
  customUrlCache.set(id, URL.createObjectURL(file));
  const label = (file.name || "Sound").replace(/\.[^.]+$/, "").trim().slice(0, 40) || "Sound";
  const list = readCustomMeta();
  list.push({ id, label });
  writeCustomMeta(list);
  return { id, label, kind: "custom" };
}

// ----------------- the active choice -----------------
function readChoiceRaw() { try { return localStorage.getItem(CHOICE_KEY); } catch { return null; } }

export function getWrongChoice() {
  const raw = readChoiceRaw();
  if (!raw) return { mode: "default" };
  if (raw[0] !== "{") {   // Đợt 274 legacy shape: a bare id string
    return raw === "default" ? { mode: "default" } : { mode: "single", id: raw };
  }
  try {
    const c = JSON.parse(raw);
    if (c && c.mode === "mix" && Array.isArray(c.ids)) return { mode: "mix", ids: c.ids };
    if (c && c.mode === "single" && c.id) return { mode: "single", id: c.id };
  } catch { /* fall through to default */ }
  return { mode: "default" };
}
export function setWrongChoice(choice) { writeJson(CHOICE_KEY, choice); }

// Set once per startGame() (core/engine.js) — true for a pupil's assignment
// play, false for every other mode (Single, Showdown, Fight...).
let assignmentMode = false;
export function setAssignmentMode(on) { assignmentMode = !!on; }

// Play one entry's clip right now, ignoring assignment mode — used by the
// Settings screen so ticking/picking a choice previews it immediately.
export function previewSound(id) {
  const entry = findEntry(id);
  if (!entry || entry.kind === "default") return;
  const a = elForEntry(entry);
  if (!a) return;
  try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* ignore */ }
}

/**
 * What every template's wrong-effect wrapper calls. `fallback` is that
 * template's own effect (its mp3 pool play, or a synthesized tone) — called
 * unchanged whenever the override does not apply.
 */
export function playWrongEffect(fallback) {
  if (assignmentMode) return fallback();
  const choice = getWrongChoice();
  if (choice.mode === "default") return fallback();

  let entry;
  if (choice.mode === "mix") {
    const entries = getEntries();
    const ids = choice.ids.filter(id => entries.some(e => e.id === id));
    if (!ids.length) return fallback();
    // ⚠️ pick the random id in its OWN statement, outside .find()'s predicate —
    // a predicate re-runs once per element it checks, so `Math.random()` inside
    // it rerolls the target on every comparison instead of picking once. Bench
    // dot275 caught this: ~35% of "wrong" triggers silently fell back to the
    // game's own sound because the reroll never lined up with any entry.
    const pickedId = ids[Math.floor(Math.random() * ids.length)];
    entry = entries.find(e => e.id === pickedId);
  } else {
    entry = findEntry(choice.id);
  }
  if (!entry) return fallback();
  const a = elForEntry(entry);
  if (!a) return fallback();   // e.g. an uploaded clip whose IndexedDB read hasn't finished yet
  if (sound.isMuted()) return;
  try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* ignore */ }
}

// Thin wrapper so a template's `wrong: makePool([...])` one-liner becomes
// `wrong: wrapWrong(makePool([...]))` without changing shape.
export function wrapWrong(fallbackFn) {
  return (...args) => playWrongEffect(() => fallbackFn(...args));
}
