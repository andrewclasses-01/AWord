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
export function addEntry(activityId, { name, score, total, timeMs, review = null }) {
  const entries = load(activityId);
  const entry = { id: `e${Date.now()}${Math.floor(Math.random() * 1000)}`,
                  name, score, total, timeMs, review, at: Date.now() };
  entries.push(entry);
  save(activityId, entries);
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
  const entries = load(activityId);
  const e = entries.find(x => x.id === entryId);
  if (e) { e.name = name; save(activityId, entries); }
}
