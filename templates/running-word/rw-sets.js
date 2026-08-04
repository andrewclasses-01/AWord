// =============================================================
// RUNNING WORD — building a PAIR of team word lists from one shared pool.
//
// This file reproduces (and then tightens) the split Teacher Andrew has been
// making by hand in the `RunningW` sheet of a lesson .xlsm. Measured from the
// real file IEL-S15.T3.P4.xlsm on 4/8/2026:
//
//     pool (WORDTABLE col D) = 85 words
//     PART A = 50 · PART B = 50
//     A ∪ B  = 85  -> EVERY word of the pool is used, none is dropped
//     A ∩ B  = 15  = 50 + 50 − 85  -> the SMALLEST overlap those sizes allow
//
// So the rule is NOT "shuffle the pool and take 50 twice" (that would repeat
// ~29 words and silently drop a dozen others). It is: cover the whole pool,
// and share only the words you are forced to share. buildSets() below does
// exactly that, plus one thing the spreadsheet could not do —
//
//   SHARED WORDS ARE PUSHED APART. A word on both lists must sit at least
//   MIN_SHARED_GAP rows apart, so team B doesn't type a word 20 seconds after
//   hearing team A's explainer describe it. In the real sheet this happened to
//   work out; here it is guaranteed.
//
// Sizes:
//   k >= n        -> both teams get the whole pool, independently shuffled
//   2k >  n       -> full coverage, overlap = 2k − n  (the normal classroom case)
//   2k <= n       -> the two lists are completely DISJOINT (a big pool, short round)
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

// How many words each team should get, given the pool and the teacher's
// setting. 0 / missing / oversized -> the whole pool for each team.
export function normWordsPerTeam(value, poolSize) {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return poolSize;
  return Math.max(1, Math.min(poolSize, Math.round(v)));
}

// Build one { a, b } pair of lists. Pure — pass the pool in, get arrays out.
export function buildSets(pool, wordsPerTeam) {
  const n = pool.length;
  if (n === 0) return { a: [], b: [] };
  const k = normWordsPerTeam(wordsPerTeam, n);

  let a, b;
  if (2 * k <= n) {
    // Enough words that the teams need share nothing at all.
    const s = shuffle(pool);
    a = shuffle(s.slice(0, k));
    b = shuffle(s.slice(k, 2 * k));
  } else {
    // Cover the pool exactly once, sharing only the forced remainder.
    const overlap = 2 * k - n;          // words that must appear on BOTH lists
    const exclusive = n - k;             // words unique to each list
    const s = shuffle(pool);
    const shared = s.slice(0, overlap);
    const onlyA = s.slice(overlap, overlap + exclusive);
    const onlyB = s.slice(overlap + exclusive);
    a = shuffle([...shared, ...onlyA]);
    b = shuffle([...shared, ...onlyB]);
    b = separateShared(a, b, shared);
  }
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
// array, which Firestore rejects). Re-reading is defensive because the act may
// have been edited (words removed) since the set was saved.
export function readSets(activity) {
  const raw = activity?.content?.printSets;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(s => ({
      a: Array.isArray(s?.a) ? s.a.map(cleanWord).filter(Boolean) : [],
      b: Array.isArray(s?.b) ? s.b.map(cleanWord).filter(Boolean) : []
    }))
    .filter(s => s.a.length && s.b.length)
    .slice(0, MAX_SETS);
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
