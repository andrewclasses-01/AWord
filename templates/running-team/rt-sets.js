// =============================================================
// RUNNING TEAM — the word pool, the printed numbering, and the five decoys.
//
// THE GAME IN ONE LINE: the screen names a pupil and a NUMBER; that pupil reads
// word №23 off the shared paper list; somebody else has to spot that same word
// among SIX on screen. So the whole difficulty of this game lives in one place —
// how alike the five wrong words look. Six unrelated words is a game of "hear a
// word, tap the word", which is no game at all. Six words that share letters is
// a real test of spelling and of listening carefully.
//
// WHAT IS EXPORTED
//   poolFrom(activity)              -> the de-duplicated word pool, in entry order
//   buildOrder(pool)                -> one shuffled ordering = the printed numbering
//   pickDistractors(word, pool, n)  -> the n most look-alike words in the pool
//   readSets / MAX_SETS / setStats  -> the saved game sets (see below)
//
// A SAVED "SET" is one round's paper: the numbering that was printed AND the
// class roll that was on the floor that day. Both must persist together — the
// teacher may close the app mid-lesson and has to be able to reprint the very
// sheet the class is holding. Stored on the activity as `content.gameSets`,
// positional (index i is always SET i+1, a hole is null) exactly like Running
// word's printSets, and for the same reason: an array that quietly COMPACTS
// itself renumbers the other slots behind the teacher's back.
//
// ⚠️ FIRESTORE SHAPE. Every field of a saved set is a string or an ARRAY OF
// STRINGS — never an array of arrays, and deliberately no nested objects. The
// roll is kept as two parallel arrays (`studentIds` / `studentNames`) rather
// than one array of {id,name} maps. Both shapes are legal, but parallel string
// arrays are the shape that cannot possibly trip the "arrays may not contain
// arrays" rule as this grows, and they read straight back into the game.
// =============================================================

import { shuffle } from "../../core/utils.js";

export const TILES = 6;              // answers on screen, always exactly six
export const MIN_POOL = TILES;       // six tiles need six distinct words
export const MAX_SETS = 3;           // saved sets kept on one activity

// Tidy one raw word cell: collapse inner whitespace, drop the surrounding junk.
// Case is preserved as typed; the tiles and the printed sheet decide their own.
export function cleanWord(w) {
  return String(w ?? "").replace(/\s+/g, " ").trim();
}

// The de-duplicated pool, in the order the teacher entered it.
export function poolFrom(activity) {
  const raw = activity?.content?.words || [];
  const seen = new Set();
  const out = [];
  raw.forEach(w => {
    const s = cleanWord(typeof w === "string" ? w : w?.word);
    if (!s) return;
    const key = s.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  });
  return out;
}

// One shuffled ordering of the pool. This IS the printed numbering: position 0
// is №1 on the paper. Questions are then drawn at random from it, so the numbers
// called out jump around the sheet instead of walking down it.
export function buildOrder(pool) {
  return shuffle(pool);
}

// ---------------------------------------------------------------------------
// LOOK-ALIKE SCORING
// ---------------------------------------------------------------------------
// Comparison key: letters and digits only, upper-cased, so SKIN-SCRAPER and
// "skin scraper" score as the same shape (the real pools contain hyphens and
// two-word entries).
function key(s) {
  return String(s ?? "")
    .normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

// Standard two-row Levenshtein. Pools are ~100 words of ~10 letters, so this
// runs a few thousand cell updates per question — far too small to optimise.
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const swap = prev; prev = cur; cur = swap;
  }
  return prev[b.length];
}

// How much of the SMALLER word's letter bag is present in the other's, ignoring
// order — this is what catches near-anagrams (TRIAL / TRAIL) that edit distance
// alone rates as merely middling.
function letterOverlap(a, b) {
  const bag = new Map();
  for (const ch of a) bag.set(ch, (bag.get(ch) || 0) + 1);
  let shared = 0;
  for (const ch of b) {
    const left = bag.get(ch) || 0;
    if (left > 0) { bag.set(ch, left - 1); shared++; }
  }
  return shared / Math.max(1, Math.max(a.length, b.length));
}

// 0 = nothing alike, 1 = identical. Four signals, weighted by how strongly each
// one actually makes a word hard to tell apart at a glance across a classroom:
//   edit distance  — the backbone: how many single-letter fixes apart they are
//   letter overlap — same letters in a different order (near-anagrams)
//   first letter   — the eye lands there first, so a shared one costs real time
//   similar length — words of the same width are the ones that get confused
// Identical keys score 0: a word is never its own decoy.
export function similarity(a, b) {
  const A = key(a), B = key(b);
  if (!A || !B || A === B) return 0;
  const maxLen = Math.max(A.length, B.length);
  const editSim = 1 - editDistance(A, B) / maxLen;
  const overlap = letterOverlap(A, B);
  const firstSame = A[0] === B[0] ? 1 : 0;
  const lenSim = 1 - Math.min(1, Math.abs(A.length - B.length) / maxLen);
  return 0.55 * editSim + 0.20 * overlap + 0.15 * firstSame + 0.10 * lenSim;
}

// The `n` words in `pool` that look most like `word`.
//
// Ties are broken RANDOMLY, not by pool order. A pool often holds several words
// scoring exactly alike against the target (same length, one letter out), and
// taking them in array order would deal the same six tiles every single round —
// the class would start recognising the shape of the answer rather than reading
// it. Above the ties, the ranking is strict: these really are the hardest
// available decoys, which is what the teacher asked for.
export function pickDistractors(word, pool, n = TILES - 1) {
  const target = key(word);
  const scored = pool
    .filter(w => key(w) !== target)
    .map(w => ({ w, s: similarity(word, w), r: Math.random() }));
  scored.sort((x, y) => (y.s - x.s) || (x.r - y.r));
  return scored.slice(0, n).map(x => x.w);
}

// One question's six tiles, already shuffled: the answer plus its decoys.
export function buildTiles(word, pool) {
  return shuffle([word, ...pickDistractors(word, pool)]);
}

// ---------------------------------------------------------------------------
// SAVED SETS
// ---------------------------------------------------------------------------
// Positional: index i is SET i+1 for the life of the activity, a hole is null.
export function readSets(activity) {
  const raw = activity?.content?.gameSets;
  const out = new Array(MAX_SETS).fill(null);
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < MAX_SETS; i++) {
    const s = raw[i];
    if (!s || !Array.isArray(s.order) || !s.order.length) continue;
    const names = Array.isArray(s.studentNames) ? s.studentNames.map(String) : [];
    const ids = Array.isArray(s.studentIds) ? s.studentIds.map(String) : [];
    out[i] = {
      order: s.order.map(String),
      classId: String(s.classId || ""),
      className: String(s.className || ""),
      studentIds: names.map((_, k) => ids[k] || `st_${k}`),
      studentNames: names
    };
  }
  return out;
}

// Turn a live roster ([{id,name}]) + ordering into the stored shape.
export function makeSet(order, className, classId, roster) {
  return {
    order: order.map(String),
    classId: String(classId || ""),
    className: String(className || ""),
    studentIds: roster.map(s => String(s.id)),
    studentNames: roster.map(s => String(s.name))
  };
}

// The stored shape back into a live roster.
export function rosterOf(set) {
  if (!set) return [];
  return set.studentNames.map((name, i) => ({ id: set.studentIds[i] || `st_${i}`, name }));
}

// A saved set can name a word the teacher has since deleted from the pool. Such
// a set can no longer be dealt, so the game must be able to spot it rather than
// fail halfway through a lesson.
export function setFitsPool(set, pool) {
  if (!set) return false;
  const keys = new Set(pool.map(w => w.toUpperCase()));
  return set.order.every(w => keys.has(String(w).toUpperCase()));
}

export function setStats(set, pool) {
  return {
    words: set ? set.order.length : 0,
    pupils: set ? set.studentNames.length : 0,
    className: set ? set.className : "",
    fits: setFitsPool(set, pool)
  };
}
