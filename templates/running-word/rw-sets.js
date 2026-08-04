// =============================================================
// RUNNING WORD — building a PAIR of team word lists from one shared pool.
//
// Teacher's rule (5/8/2026, replaces the earlier random-overlap version): each
// team's list holds AT MOST CAPACITY (50) words, and WHICH words go where is
// decided by POSITION in the pool, not by random draw —
//
//   pool.length <= CAPACITY  -> both teams get the SAME words (the whole
//                                pool), each side independently shuffled.
//   pool.length >  CAPACITY  -> Part A = the first CAPACITY words as entered
//                                (1..50). Part B = the last CAPACITY words as
//                                entered (n-49..n). A 70-word pool gives A
//                                words 1-50 and B words 21-70 — 30 shared,
//                                sitting in the middle of the teacher's list.
//                                A pool of 100+ words leaves the middle
//                                stretch on NEITHER list.
//
// The one thing kept from the old design: SHARED WORDS ARE STILL PUSHED
// APART on list B, at least MIN_SHARED_GAP rows from their position on list
// A — so team B doesn't type a word moments after hearing team A's explainer
// describe the very same one. Whichever words end up shared (the whole pool
// when n<=CAPACITY, the middle stretch when n>CAPACITY), separateShared()
// below runs on them exactly as before.
// =============================================================

import { shuffle } from "../../core/utils.js";

export const MIN_SHARED_GAP = 6;    // rows a shared word must be apart on the two lists
const SEPARATION_TRIES = 200;       // bounded — never spin on impossible input

// Tidy one raw word cell: collapse inner whitespace, drop the surrounding junk.
// Case is preserved as typed; grading and printing decide their own casing.
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

export const CAPACITY = 50;    // the most words either team's list may hold

// Build one { a, b } pair of lists. Pure — pass the pool in, get arrays out.
export function buildSets(pool) {
  const n = pool.length;
  if (n === 0) return { a: [], b: [] };

  if (n <= CAPACITY) {
    // Small pool: both teams play the exact same words. Each side is its own
    // independent shuffle, so the two orders never match by construction.
    let a = shuffle(pool);
    let b = shuffle(pool);
    b = separateShared(a, b, pool);
    return { a, b };
  }

  // Big pool: position decides membership, not a random draw. A = the first
  // CAPACITY words as the teacher entered them, B = the last CAPACITY words.
  const onlyA = pool.slice(0, CAPACITY);
  const onlyB = pool.slice(n - CAPACITY);
  const shared = pool.slice(n - CAPACITY, CAPACITY);   // [] once n >= 2*CAPACITY
  let a = shuffle(onlyA);
  let b = shuffle(onlyB);
  b = separateShared(a, b, shared);
  return { a, b };
}

// Re-position the shared words on list B so none of them sits within
// MIN_SHARED_GAP rows of its position on list A. Works by swapping the
// offending word with another B slot that is BOTH far enough from its own
// partner on A and far enough for the word being moved. Bounded, and returns
// the best it managed if the constraint is impossible (very small pools).
function separateShared(a, b, shared) {
  if (!shared.length) return b;
  const key = w => w.toUpperCase();
  const sharedKeys = new Set(shared.map(key));
  const posA = new Map();
  a.forEach((w, i) => posA.set(key(w), i));

  const out = b.slice();
  const tooClose = (w, i) => {
    const pa = posA.get(key(w));
    return pa != null && Math.abs(pa - i) < MIN_SHARED_GAP;
  };

  for (let tries = 0; tries < SEPARATION_TRIES; tries++) {
    const bad = out.findIndex((w, i) => sharedKeys.has(key(w)) && tooClose(w, i));
    if (bad === -1) break;                     // every shared word is far enough away
    const word = out[bad];
    // Look for a partner slot that fixes BOTH words at once.
    let swapped = false;
    const order = shuffle(out.map((_, i) => i));
    for (const j of order) {
      if (j === bad) continue;
      if (tooClose(word, j)) continue;          // moving there wouldn't help
      if (tooClose(out[j], bad)) continue;      // ...and would break the other word
      out[bad] = out[j]; out[j] = word;
      swapped = true;
      break;
    }
    if (!swapped) break;                        // nothing legal left — keep what we have
  }
  return out;
}

// A saved set is stored as plain string arrays on the activity (Firestore-safe:
// an array of MAPS whose fields are arrays — never an array directly inside an
// array, which Firestore rejects; Firestore is fine with `null` array entries).
//
// POSITIONAL (5/8/2026): index i is always SLOT i+1, on screen and in storage.
// An earlier version FILTERED out empty slots before returning them, which
// silently compacted the array — deleting SET 1 out of a saved [1,2,3] would
// shift SET 2 into SET 1's position on reload. A hole is now `null` and stays
// exactly where it is; only the caller (running-word.js) ever removes one.
// Re-reading is still defensive because the act may have been edited (words
// removed) since the set was saved.
export function readSets(activity) {
  const raw = activity?.content?.printSets;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_SETS).map(s => {
    if (!s || !Array.isArray(s.a) || !Array.isArray(s.b)) return null;
    const a = s.a.map(cleanWord).filter(Boolean);
    const b = s.b.map(cleanWord).filter(Boolean);
    return (a.length && b.length) ? { a, b } : null;
  });
}

export const MAX_SETS = 3;

// Facts about a pair of lists — shown in the setup screen so the teacher can
// see at a glance that the split really did cover everything.
export function setStats(set, pool) {
  const key = w => String(w).toUpperCase();
  const ka = new Set(set.a.map(key));
  const kb = new Set(set.b.map(key));
  const union = new Set([...ka, ...kb]);
  let overlap = 0;
  ka.forEach(w => { if (kb.has(w)) overlap++; });
  return {
    perTeam: set.a.length,
    overlap,
    covered: union.size,
    poolSize: pool.length,
    full: union.size >= pool.length
  };
}
