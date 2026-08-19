// =============================================================
// LEADERBOARD — stores results on THIS computer (localStorage).
// Ranking rule (same as Wordwall): higher score first,
// then faster time first.
// Later (Firebase phase) the same shape will sync online.
// =============================================================

const key = activityId => `aword-lb-${activityId}`;

function load(activityId) {
  try { return JSON.parse(localStorage.getItem(key(activityId))) || []; }
  catch { return []; }
}
function save(activityId, entries) {
  localStorage.setItem(key(activityId), JSON.stringify(entries.slice(0, 50)));
}

// Add one play result. Returns the new entry's id.
// `review` (optional) = per-question detail for the "Show answers" screen; stored
// with the entry so it can later sync (Firebase) and be shown for any student,
// letting a class compete and see each other's results.
// ⭐⭐ Đợt 197 (19/8/2026) — FOUR COLUMNS SHARE ONE localStorage.
//
// myActivity's 2-5 columns are the SAME ORIGIN in the SAME partition, so all of
// them read and write THIS key — and each is its own renderer PROCESS. The plain
// load → push → save this used to be was a classic lost update: two boards
// finishing in the same second both read the old list, both appended their own
// row, and the second write threw the first board's result away. Nothing looked
// wrong (each board had already shown its own score), so it could only ever
// surface as "a name missing from the board" — unfalsifiable in a busy lesson.
// Found beside the Showdown result split of Đợt 196; the same family of bug.
//
// The fix is merge-and-verify: never write a list built from a stale read, and
// never trust a write until it has been read back.
const MERGE_TRIES = 4;

/** Union by entry id, ours last. Order on screen is re-derived by getEntries. */
function mergeById(base, extra) {
  const out = [];
  const seen = new Set();
  [...base, ...extra].forEach(e => {
    if (!e || !e.id || seen.has(e.id)) return;
    seen.add(e.id);
    out.push(e);
  });
  return out;
}

export function addEntry(activityId, { name, score, total, timeMs, review = null, scoreText = null }) {
  // `scoreText` (optional) = a pre-formatted score string (e.g. Gameshow's points
  // "1250"); when present the leaderboard shows it verbatim instead of "score/total".
  // ⚠️ The id needs REAL randomness, not 3 digits: four boards can finish in the
  // same millisecond, and two rows sharing an id is exactly how a merge by id
  // loses one of them.
  const entry = { id: `e${Date.now()}${Math.floor(Math.random() * 1e6)}`,
                  name, score, total, timeMs, scoreText, review, at: Date.now() };
  for (let i = 0; i < MERGE_TRIES; i++) {
    // Re-read INSIDE the loop: another column may have written since the last go.
    save(activityId, mergeById(load(activityId), [entry]));
    // Read back. If our row survived, then whatever else happened afterwards
    // happened on top of a list that contained us — which is all we can promise
    // without a lock localStorage does not have.
    if (load(activityId).some(e => e.id === entry.id)) return entry.id;
  }
  console.warn("AWord: leaderboard write kept losing the race");
  return entry.id;
}

// Get one entry by id (used by the "Show answers" review screen).
export function getEntry(activityId, entryId) {
  return load(activityId).find(e => e.id === entryId) || null;
}

// All entries, best first (score desc, time asc)
export function getEntries(activityId) {
  return load(activityId).sort((a, b) => (b.score - a.score) || (a.timeMs - b.timeMs));
}

// Rank (1 = best) of one entry
export function getRank(activityId, entryId) {
  const i = getEntries(activityId).findIndex(e => e.id === entryId);
  return i < 0 ? null : i + 1;
}

// Rename an entry (used by the editable name box on the leaderboard)
export function updateName(activityId, entryId, name) {
  // ⚠️ Đợt 197 — re-read immediately before writing, same reason as addEntry:
  // typing a name on one column while another finishes its game would otherwise
  // write back a list that predates the other column's row.
  for (let i = 0; i < MERGE_TRIES; i++) {
    const entries = load(activityId);
    const e = entries.find(x => x.id === entryId);
    if (!e) return;
    e.name = name;
    save(activityId, entries);
    if (load(activityId).some(x => x.id === entryId && x.name === name)) return;
  }
}
