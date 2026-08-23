// =============================================================
// SHOWDOWN — THE DURABLE RESULT HISTORY (Đợt 197, 19/8/2026 · resharded Đợt 236)
//
// Thầy: *"Cần cơ chế lưu dữ liệu bền kể cả khi tắt máy: mỗi lần có kết quả các
// team là lưu bền dữ liệu kết quả và gán cho 1 lần thi đấu của cả lớp… Mỗi lớp
// lưu tối đa 5 cột, khi tạo cột số 6 thì cột đầu tiên sẽ bị xóa."* (Đợt 197)
//
// ⭐⭐⭐ Đợt 236 (22/8/2026, thầy) — "giữ MÃI MÃI, để phân tích theo lộ trình dài,
// không còn giới hạn 10 trận." The eviction rule above is GONE for the ledger
// itself; MAX_MATCHES now means only "how many the in-game quick popup shows"
// (see loadMatches' own note) — the new full-page SHOWDOWN home
// (core/showdown-home.js) reads the whole thing.
//
// ---------------------------------------------------------------------------
// HOW THIS DIFFERS FROM `sd_results` (core/showdown-setup.js)
// ---------------------------------------------------------------------------
// They look alike and they are not the same thing at all, so read this before
// touching either:
//
//   `sd_results`  ONE row per team, for the play happening RIGHT NOW. It is a
//                 LIVE BOARD: overwritten every play, wiped by Reset teams, and
//                 watched by every column so the class board fills itself in as
//                 teams finish (Đợt 196). It answers "who has finished?".
//   this file     A LEDGER. Nothing here is ever overwritten by a later play and
//                 nothing is wiped by Reset teams. It answers "how did 5B do
//                 across the whole term?", and it has to survive the computer
//                 being switched off — which is the whole reason it is on
//                 Firestore and not in any kind of browser storage.
//
// ---------------------------------------------------------------------------
// WHAT COUNTS AS **ONE MATCH** (thầy chốt 19/8/2026: "chơi lại = trận MỚI")
// ---------------------------------------------------------------------------
// A match is `tableId | roundKey | playNo`:
//   tableId   which division of the class this is (minted by the setup panel
//             when the teacher presses Next; see normalize() in
//             core/showdown-setup.js). A new division is a new match, always.
//   roundKey  which act. Changing act is a new match.
//   playNo    HOW MANY TIMES THIS COLUMN HAS FINISHED that table+act. Playing
//             the same act again makes a new column, which is what thầy chose
//             over "the replay updates the same column".
//
// ⚠️⚠️ WHY `playNo` IS COUNTED PER COLUMN AND NOT AGREED BETWEEN THEM.
// Four boards on four machines finish at four different moments; there is no
// moment at which they could agree "this is round 2" without one of them being
// in charge, and nothing in Showdown is in charge. But they do not need to
// agree: each column counts its OWN finishes of this table+act, and board 1's
// first finish and board 3's first finish are, by construction, the same round —
// they both started when the teacher pressed Ready on that table. So the four
// first-plays land in match #1 and a board that plays again lands in match #2,
// alone, which is an honest record of what happened.
//
// The counter lives in `sessionStorage` — per column, exactly like the pick and
// the outbox, and for the same reason (core/showdown.js's header explains at
// length why nothing about Showdown may be per-ORIGIN).
//
// ---------------------------------------------------------------------------
// ⭐⭐⭐ Đợt 236 — ONE DOCUMENT PER CLASS PER MONTH, PLUS A TINY INDEX
// ---------------------------------------------------------------------------
// "Forever" and "one document" cannot both be true — Firestore hard-refuses a
// document over 1MB, and a class played every lesson for years would get there.
// So the ledger is now split by CALENDAR MONTH, the same month the day-folder
// screen groups by (thầy's own answer, 22/8/2026), which keeps the split an
// invisible engine detail rather than a second thing to explain on screen:
//
//   `users/{uid}/items/sd_hist_<classId>_<YYYYMM>`, kind "showdown-history"
//   { classId, className, yyyymm, matches: [ match, … ] }
//
//   `users/{uid}/items/sd_hist_<classId>_idx`, kind "showdown-history-index"
//   { classId, className, months: { "<YYYYMM>": { count, lastAt }, … },
//     legacyMigrated }
//
// The index is what the day-folder rail reads to know WHICH months have
// anything at all, without fetching every month's full document — a class run
// for years might have fifty of those, and the folder list needs only their
// names and roughly how full they are. Only a month the teacher actually OPENS
// gets its full document fetched (loadMonth).
//
// ⚠️ NO FIRESTORE QUERY ANYWHERE IN THIS FILE, ON PURPOSE. A `where()` across
// classId+kind would need a composite index the teacher would have to create by
// hand in the Firebase console (docs/08-FIREBASE-SETUP.md never asked for one);
// every document id here is instead DERIVED (class + month), so every read is a
// plain `getDoc` by a name the caller already knows how to build. Same posture
// as every other file in Showdown's storage layer.
// ⚠️ Per-month sizing still leans on fitToBudget (below): even a month's worth
// of matches can carry more per-question detail than fits under 1MB in a very
// busy class, so the SAME graceful degrade (oldest matches in the month lose
// their row detail first, never a whole match) still applies, per document.
//
// It lives in `users/{uid}/items` for the reason core/classes.js gives at
// length: the published Firestore rules open exactly that one path, so a new
// collection would be DENIED until somebody edited them in the console by hand.
//
// ⚠️ EVERY WRITE TO A MONTH DOCUMENT IS A TRANSACTION. Four columns finish
// seconds apart and all four write into the SAME match of the same document; a
// read-modify-write would lose whichever landed second — the exact bug Đợt 196
// spent a day on. The INDEX doc (count/lastAt only, never a source of truth for
// any match's content) is updated with a plain merge write after — losing a race
// on it costs a slightly stale count for one screen paint, never a match.
//
// ---------------------------------------------------------------------------
// ⭐⭐⭐ Đợt 236 — MIGRATING THE OLD SINGLE-DOCUMENT LEDGER
// ---------------------------------------------------------------------------
// Every class already has up to 10 matches sitting in the old, un-sharded
// `sd_hist_<classId>` document (Đợt 197's shape). migrateLegacyIfNeeded() folds
// them into their proper month documents the first time this file is asked for
// that class's data in a session, then stamps the old document `migrated:true`
// so it is never re-read as a source again (its matches are left in place,
// inert — deleting them buys nothing and risks losing the only copy if the
// migration write partially failed on a bad connection).
// =============================================================

import { db, fs, currentUser } from "./firebase.js";
import { SOLO_TEAM_ID } from "./showdown.js";

// ⭐ How many matches the IN-GAME quick popup shows (core/showdown-setup.js's
// openRecent, opened by tapping "SHOWDOWN IN ANDREW CLASSES" mid-lesson).
// Đợt 236 — this no longer bounds how much is KEPT (see the header); it only
// bounds loadMatches()'s own answer, which is deliberately left small: that
// popup is a quick glance during a lesson, not the analysis screen.
export const MAX_MATCHES = 10;
// Same cap as the live board's, and deliberately the same constant value: a
// pupil's row must not say one thing on the live class board and another in the
// history of the very same play.
const TEXT_CAP = 180;
// A guard, not a target. Firestore refuses a document over 1MB outright — and it
// refuses it at the moment of writing, i.e. it would throw away a real result
// the class had just played. Well under the limit we start dropping the per
// question DETAIL of the oldest matches (their podiums survive), so the ledger
// degrades gracefully instead of failing shut.
const SIZE_BUDGET = 700 * 1024;
// How many months loadMatches() will walk back through hunting for MAX_MATCHES
// worth of rows. A class this quiet has nothing worth paging further for — the
// quick popup would rather say "not much here" than make the teacher wait on a
// chain of empty reads.
const MONTH_WALK_CAP = 8;

const cut = s => String(s || "").slice(0, TEXT_CAP);
const safeId = s => String(s || "").replace(/[^A-Za-z0-9_-]/g, "");
const docIdFor = classId => `sd_hist_${safeId(classId)}`;               // legacy, migration source only
const monthDocId = (classId, yyyymm) => `sd_hist_${safeId(classId)}_${safeId(yyyymm)}`;
const indexDocId = classId => `sd_hist_${safeId(classId)}_idx`;

/** "202608" for a given ms timestamp — the shard key, and the UI's month key. */
export function yyyymmOf(ms) {
  const d = new Date(Number(ms) || 0);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}
/** "20260822" — the UI's day key, one calendar day in the teacher's own clock. */
export function dayKeyOf(ms) {
  const d = new Date(Number(ms) || 0);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

async function requireUid() {
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to keep results.");
    err.code = "aw/signed-out";
    throw err;
  }
  return user.uid;
}

// Firestore rejects `undefined`, so drop those keys before writing.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

// ---------------------------------------------------------------
// SHAPE — tolerant on read, exact on write
// ---------------------------------------------------------------
function normStudent(s) {
  return {
    key: String(s?.key || ""),
    name: String(s?.name || "").trim(),
    ord: Number(s?.ord) || 0,
    total: Number(s?.total) || 0,
    attempted: Number(s?.attempted) || 0,
    right: Number(s?.right) || 0,
    wrong: Number(s?.wrong) || 0,
    hasTime: !!s?.hasTime,
    ms: Math.round(Number(s?.ms) || 0),
    rows: (Array.isArray(s?.rows) ? s.rows : []).map(r => ({
      n: Number(r?.n) || 0,
      question: cut(r?.question), yourText: cut(r?.yourText), correctText: cut(r?.correctText),
      answered: !!r?.answered, correct: !!r?.correct,
      roundMs: typeof r?.roundMs === "number" ? Math.round(r.roundMs) : null
    }))
  };
}

function normMatch(m) {
  const teams = {};
  const raw = (m && typeof m.teams === "object" && m.teams) || {};
  for (const [teamId, t] of Object.entries(raw)) {
    if (!t || typeof t !== "object") continue;
    teams[teamId] = {
      teamId: String(t.teamId || teamId),
      teamName: String(t.teamName || "").trim() || "Team",
      at: Number(t.at) || 0,
      students: (Array.isArray(t.students) ? t.students : []).map(normStudent).filter(s => s.name)
    };
  }
  return {
    matchId: String(m?.matchId || ""),
    tableId: String(m?.tableId || ""),
    roundKey: String(m?.roundKey || ""),
    playNo: Number(m?.playNo) || 1,
    actName: cut(m?.actName),
    // Đợt 230 — the clue set (eng1/eng2/vi1/vi2) that was live when this result
    // was saved, so the ledger can show "ENGLISH 1" instead of the act's own
    // shared "WORDS" name (core/showdown.js's formatActDisplayName). Empty for
    // any match filed before this đợt, or for an act that has no clue sets.
    contentVariant: cut(m?.contentVariant),
    // Đợt 230 — the teacher's own rename, typed by hand (double-tap the name in
    // Recent results). Once set it OVERRIDES the formatted display name forever
    // for this match — never re-derived, never overwritten by a later write to
    // the same match (saveMatchResult only ever fills `actName`/`contentVariant`
    // when they are still empty; it never touches this field at all).
    customName: cut(m?.customName),
    // ⭐⭐ Đợt 240 (thầy) — the Table view's classify-bar thresholds, once the
    // teacher presses Apply: `{hi, lo}`, both 0-100, hi > lo (core/showdown.js's
    // classifyColor). `null` means "never classified" — the Table board then
    // falls back to its own default colour, not to DEFAULT_CLASSIFY silently
    // applied on the teacher's behalf. Kept null rather than omitted so a
    // written record always answers "was this ever classified?" without a
    // caller having to distinguish "key absent" from "key explicitly cleared".
    classify: (m && m.classify && typeof m.classify === "object"
      && Number.isFinite(Number(m.classify.hi)) && Number.isFinite(Number(m.classify.lo)))
      ? { hi: Math.max(0, Math.min(100, Number(m.classify.hi))), lo: Math.max(0, Math.min(100, Number(m.classify.lo))) }
      : null,
    at: Number(m?.at) || 0,
    updatedAt: Number(m?.updatedAt) || 0,
    rowsDropped: !!m?.rowsDropped,
    teams
  };
}

function normMonthDoc(raw, classId, yyyymm) {
  return {
    kind: "showdown-history", root: "showdown", parentId: null, trashed: false,
    classId: String(raw?.classId || classId || ""),
    className: String(raw?.className || "").trim(),
    yyyymm: String(raw?.yyyymm || yyyymm || ""),
    matches: (Array.isArray(raw?.matches) ? raw.matches : []).map(normMatch).filter(m => m.matchId),
    updatedAt: Number(raw?.updatedAt) || 0
  };
}

// Tolerant reader for the OLD, pre-Đợt-236 single document — migration only.
function normLegacyDoc(raw, classId) {
  return {
    classId: String(raw?.classId || classId || ""),
    className: String(raw?.className || "").trim(),
    matches: (Array.isArray(raw?.matches) ? raw.matches : []).map(normMatch).filter(m => m.matchId),
    migrated: !!raw?.migrated
  };
}

function normIndexDoc(raw, classId) {
  const months = {};
  const rawMonths = (raw && typeof raw.months === "object" && raw.months) || {};
  for (const [k, v] of Object.entries(rawMonths)) {
    if (!v || typeof v !== "object") continue;
    months[k] = { count: Math.max(0, Number(v.count) || 0), lastAt: Number(v.lastAt) || 0 };
  }
  return {
    kind: "showdown-history-index", root: "showdown", parentId: null, trashed: false,
    classId: String(raw?.classId || classId || ""),
    className: String(raw?.className || "").trim(),
    months,
    legacyMigrated: !!raw?.legacyMigrated,
    updatedAt: Number(raw?.updatedAt) || 0
  };
}

/**
 * Keep a month's document under the budget by dropping the per-question DETAIL
 * of the OLDEST matches IN THAT MONTH first — never a whole match, and never a
 * pupil. The podium (name · team · right · wrong · time · %) is computed from
 * fields that stay, so an old match keeps its board and loses only the ability
 * to be opened up. That is the right thing to lose: a busy month's earliest
 * games, "who won" is still wanted and "what did AN answer to question 7" is
 * not.
 */
function fitToBudget(node) {
  const size = () => JSON.stringify(node).length;
  if (size() <= SIZE_BUDGET) return node;
  const oldestFirst = node.matches.slice().sort((a, b) => (a.at || 0) - (b.at || 0));
  for (const m of oldestFirst) {
    let stripped = false;
    Object.values(m.teams).forEach(t => t.students.forEach(s => {
      if (s.rows.length) { s.rows = []; stripped = true; }
    }));
    if (stripped) {
      m.rowsDropped = true;
      if (size() <= SIZE_BUDGET) return node;
    }
  }
  return node;
}

// ---------------------------------------------------------------
// WHICH MATCH THIS PLAY BELONGS TO
// ---------------------------------------------------------------
// The per-column counter. `{ "<tableId>|<roundKey>": <finishes so far> }`.
const PLAY_KEY = "aword-showdown-playno";

function readCounters() {
  try { return JSON.parse(sessionStorage.getItem(PLAY_KEY) || "{}") || {}; }
  catch { return {}; }
}

/**
 * The play number to stamp on the result THIS COLUMN is about to publish, and
 * bump the counter as we go: the next finish of the same table+act is a new
 * match (thầy: "chơi lại = trận MỚI").
 * ⚠️ Called exactly ONCE per finished play, by core/engine.js. Calling it twice
 * would put a replay in match #3 with nothing in match #2.
 */
export function nextPlayNo(tableId, roundKey) {
  const k = `${String(tableId || "")}|${String(roundKey || "")}`;
  const all = readCounters();
  const n = (Number(all[k]) || 0) + 1;
  all[k] = n;
  try { sessionStorage.setItem(PLAY_KEY, JSON.stringify(all)); } catch { /* storage disabled */ }
  return n;
}

export function matchIdOf(tableId, roundKey, playNo) {
  return `${String(tableId || "t")}|${String(roundKey || "a")}|${Number(playNo) || 1}`;
}

// ---------------------------------------------------------------
// INDEX — the small doc the folder rail reads
// ---------------------------------------------------------------
async function readIndexDoc(classId) {
  const uid = await requireUid();
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, indexDocId(classId)));
  return normIndexDoc(snap.exists() ? snap.data() : {}, classId);
}

/**
 * Merge one month's fresh {count, lastAt} into the index. A plain merge write
 * (no transaction): losing a race here just means the folder rail shows a
 * slightly stale count for one repaint — never a wrong MATCH, since matches
 * live only in the month document this never touches.
 */
async function bumpIndex(classId, className, yyyymm, count, lastAt) {
  try {
    const uid = await requireUid();
    const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
    await setDoc(doc(d, `users/${uid}/items`, indexDocId(classId)), clean({
      kind: "showdown-history-index", root: "showdown", parentId: null, trashed: false,
      classId: String(classId), className: String(className || ""),
      months: { [yyyymm]: { count, lastAt } },
      updatedAt: Date.now()
    }), { merge: true });
  } catch (e) {
    // Best-effort: the folder rail will simply be a beat behind until the next
    // successful save touches this month again. Never worth failing the match
    // save over — see saveMatchResult's own note on what that moment is.
    console.warn("AWord: could not update the Showdown month index", e);
  }
}

/** Drop a month key from the index entirely — its last tile was just deleted. */
async function dropIndexMonth(classId, yyyymm) {
  const uid = await requireUid();
  const [d, { doc, getDoc, setDoc }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, indexDocId(classId));
  const snap = await getDoc(ref);
  const node = normIndexDoc(snap.exists() ? snap.data() : {}, classId);
  if (!(yyyymm in node.months)) return;
  delete node.months[yyyymm];
  node.updatedAt = Date.now();
  await setDoc(ref, clean(node));   // full overwrite, not merge: merge cannot remove a key
}

// ---------------------------------------------------------------
// WRITE — one team's finished result
// ---------------------------------------------------------------
/**
 * File ONE team's finished result into the class's ledger, in THIS MONTH's
 * document.
 *
 * Never throws for an ordinary reason (signed out, offline): the caller is the
 * engine's `finish()`, which is a moment when the class is watching a
 * celebration, and a ledger is not worth interrupting it for. It returns false
 * instead, and the caller's own outbox is what tries again.
 *
 * ⚠️ A SOLO play files here TOO (thầy, 19/8/2026: "cả lớp chỉ có 1 đội vẫn lưu
 * và ghi bền dữ liệu"). That is deliberately NOT true of the live `sd_results`
 * board, which still refuses solo rows — see saveTeamResult's own long note on
 * what a stale `sd_solo` row did to a class of 15. The difference is safe
 * because a match here is keyed by tableId, so a solo play and a four-team play
 * can never land in the same column and double anybody.
 */
export async function saveMatchResult({
  classId, className, tableId, roundKey, playNo, actName = "", contentVariant = "",
  teamId, teamName, students
}) {
  if (!classId || !teamId) return false;
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const now = Date.now();
  const yyyymm = yyyymmOf(now);
  const ref = doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm));
  const id = matchIdOf(tableId, roundKey, playNo);
  const entry = {
    teamId: String(teamId),
    // A solo pick names its team after the class (applySolo), which is right on
    // its own board and wrong on a ledger row, where "A1B" as a team name beside
    // "A1B" as the class reads as a mistake. Say what it is.
    teamName: String(teamId) === SOLO_TEAM_ID ? "Whole class" : (String(teamName || "").trim() || "Team"),
    at: now,
    students: (students || []).map(normStudent).filter(s => s.name)
  };
  let result = null;
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const node = normMonthDoc(snap.exists() ? snap.data() : {}, classId, yyyymm);
    node.className = String(className || node.className || "");
    let m = node.matches.find(x => x.matchId === id);
    if (!m) {
      m = normMatch({ matchId: id, tableId, roundKey, playNo, actName, contentVariant, at: now });
      node.matches.push(m);
      // ⭐ Đợt 236 — NO EVICTION HERE ANY MORE (see file header: "giữ mãi mãi").
      // Sharding by month is what keeps any one document small; this month's
      // own matches simply accumulate, oldest ones losing row detail first via
      // fitToBudget() below if the month was an unusually busy one.
      node.matches.sort((a, b) => (a.at || 0) - (b.at || 0));
    }
    // A team may only ever have ONE row in a match — a board that finished, was
    // restarted and finished again inside the same play number replaces itself.
    m.teams[entry.teamId] = entry;
    m.updatedAt = now;
    if (!m.actName && actName) m.actName = cut(actName);
    if (!m.contentVariant && contentVariant) m.contentVariant = cut(contentVariant);
    node.updatedAt = now;
    tx.set(ref, clean(fitToBudget(node)));
    result = { count: node.matches.length, lastAt: Math.max(now, ...node.matches.map(x => x.at || 0)) };
  });
  if (result) await bumpIndex(classId, className, yyyymm, result.count, result.lastAt);
  return true;
}

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 236 — MIGRATE THE OLD SINGLE-DOCUMENT LEDGER, ONCE PER SESSION
// ---------------------------------------------------------------
// Every read path below calls this first. It is a no-op after the first real
// hit for a class (tracked in-memory, so a second call in the same page life
// costs nothing) and a no-op forever once the legacy document is stamped.
const migratedThisSession = new Set();

async function mergeLegacyMatchesIntoMonth(classId, className, yyyymm, matches) {
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm));
  let result = null;
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const node = normMonthDoc(snap.exists() ? snap.data() : {}, classId, yyyymm);
    node.className = String(className || node.className || "");
    let changed = false;
    matches.forEach(m => {
      if (node.matches.some(x => x.matchId === m.matchId)) return;   // already migrated, or already live
      node.matches.push(m);
      changed = true;
    });
    if (changed) {
      node.matches.sort((a, b) => (a.at || 0) - (b.at || 0));
      node.updatedAt = Date.now();
      tx.set(ref, clean(fitToBudget(node)));
    }
    result = { count: node.matches.length, lastAt: node.matches.reduce((a, x) => Math.max(a, x.at || 0), 0) };
  });
  return result;
}

async function migrateLegacyIfNeeded(classId) {
  if (!classId || migratedThisSession.has(classId)) return;
  // Marked BEFORE the work, not after: a signed-out/offline miss must not
  // retry-storm every single read this file does for the rest of the session.
  // A genuine failure gets a fresh attempt on the next page load regardless.
  migratedThisSession.add(classId);
  try {
    const uid = await requireUid();
    const [d, { doc, getDoc, setDoc }] = await Promise.all([db(), fs()]);
    const legacyRef = doc(d, `users/${uid}/items`, docIdFor(classId));
    const snap = await getDoc(legacyRef);
    if (!snap.exists()) return;
    const legacy = normLegacyDoc(snap.data(), classId);
    if (legacy.migrated) return;
    if (!legacy.matches.length) {
      await setDoc(legacyRef, { migrated: true }, { merge: true });
      return;
    }
    const byMonth = new Map();
    legacy.matches.forEach(m => {
      const mm = yyyymmOf(m.at);
      if (!byMonth.has(mm)) byMonth.set(mm, []);
      byMonth.get(mm).push(m);
    });
    for (const [mm, matches] of byMonth) {
      const r = await mergeLegacyMatchesIntoMonth(classId, legacy.className, mm, matches);
      if (r) await bumpIndex(classId, legacy.className, mm, r.count, r.lastAt);
    }
    await setDoc(legacyRef, { migrated: true }, { merge: true });
  } catch (e) {
    console.warn("AWord: could not migrate the old Showdown ledger", e);
  }
}

// ---------------------------------------------------------------
// READ
// ---------------------------------------------------------------
async function readMonthDoc(classId, yyyymm) {
  const uid = await requireUid();
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm)));
  return normMonthDoc(snap.exists() ? snap.data() : {}, classId, yyyymm);
}

/**
 * The same NEWEST-FIRST tie-break `loadMatches`/`loadMonth` always used: `at`
 * is a millisecond clock and two matches really can share one (four boards
 * filing in the same tick), so the stored array order — oldest-first within one
 * document — breaks the tie. `i` must come from the match's position WITHIN ITS
 * OWN month document; matches from different months never share a millisecond,
 * so that is the only place a tie can ever occur.
 */
function newestFirst(entries) {
  return entries
    .map((m, i) => ({ m, i }))
    .sort((a, b) => ((b.m.at || 0) - (a.m.at || 0)) || (b.i - a.i))
    .map(x => x.m);
}

/**
 * ⭐⭐⭐ Đợt 236 — every month this class has anything in, newest first. What the
 * new SHOWDOWN home page's folder rail is built from — cheap on purpose (one
 * small document), so opening the page never has to fetch a class's whole
 * multi-year ledger just to draw the list of months.
 */
export async function loadMonthIndex(classId) {
  if (!classId) return { className: "", months: [] };
  await migrateLegacyIfNeeded(classId);
  const idx = await readIndexDoc(classId);
  const months = Object.entries(idx.months)
    .map(([key, v]) => ({ key, count: v.count, lastAt: v.lastAt }))
    .sort((a, b) => b.key.localeCompare(a.key));
  return { className: idx.className, months };
}

/**
 * One month's matches, newest first, each tagged `_yyyymm` so a caller can
 * delete/rename it without having to re-derive which shard it lives in.
 */
export async function loadMonth(classId, yyyymm) {
  if (!classId || !yyyymm) return [];
  await migrateLegacyIfNeeded(classId);
  const node = await readMonthDoc(classId, yyyymm);
  return newestFirst(node.matches).map(m => ({ ...m, _yyyymm: yyyymm }));
}

/**
 * A class's matches, NEWEST FIRST — which is the order the in-game popup's
 * columns are drawn in, so the most recent match is the one under the
 * teacher's hand. Always read fresh: the whole point of the screen that calls
 * this is that something has happened since it was last looked at.
 *
 * ⭐ Đợt 236 — sourced from the sharded months now, but the SIGNATURE, the
 * order and the MAX_MATCHES cap are all unchanged: the in-game quick popup
 * (core/showdown-setup.js's openRecent) keeps behaving exactly as it always
 * has (thầy's own instruction — the durable, unbounded ledger lives behind the
 * new home page, not here). Walks back at most MONTH_WALK_CAP months hunting
 * for MAX_MATCHES worth of rows; a class that quiet has nothing more to show
 * regardless.
 */
export async function loadMatches(classId) {
  if (!classId) return [];
  await migrateLegacyIfNeeded(classId);
  const idx = await readIndexDoc(classId);
  const monthKeys = Object.keys(idx.months).sort().reverse();
  const acc = [];
  for (let i = 0; i < monthKeys.length && i < MONTH_WALK_CAP && acc.length < MAX_MATCHES; i++) {
    const node = await readMonthDoc(classId, monthKeys[i]);
    node.matches.forEach((m, j) => acc.push({ m, i: j, month: monthKeys[i] }));
  }
  return acc
    .sort((a, b) => ((b.m.at || 0) - (a.m.at || 0)) || (b.i - a.i))
    .slice(0, MAX_MATCHES)
    .map(x => ({ ...x.m, _yyyymm: x.month }));
}

/** Throw a class's WHOLE ledger away — every month, and the index with it. */
export async function wipeMatches(classId) {
  if (!classId) return;
  const uid = await requireUid();
  const [d, sdk] = await Promise.all([db(), fs()]);
  const { doc, getDoc, setDoc, deleteDoc, writeBatch } = sdk;
  const idxRef = doc(d, `users/${uid}/items`, indexDocId(classId));
  const idxSnap = await getDoc(idxRef);
  const idx = normIndexDoc(idxSnap.exists() ? idxSnap.data() : {}, classId);
  const monthKeys = Object.keys(idx.months);
  // ⭐ Đợt 236 — batched, not one transaction: this can touch a class's whole
  // multi-year history (many month documents) and a single transaction has its
  // own read/write-set limits. Nothing here races a live game the way
  // saveMatchResult's per-match write does — Reset ledger and a lesson in
  // progress are not something the teacher does at the same moment.
  if (monthKeys.length) {
    for (let i = 0; i < monthKeys.length; i += 400) {
      const batch = writeBatch(d);
      monthKeys.slice(i, i + 400).forEach(mm => batch.delete(doc(d, `users/${uid}/items`, monthDocId(classId, mm))));
      await batch.commit();
    }
  }
  await setDoc(idxRef, {
    kind: "showdown-history-index", root: "showdown", parentId: null, trashed: false,
    classId: String(classId), className: "", months: {}, updatedAt: Date.now()
  });
  // The legacy document is not a source of truth once migrated (or once there
  // was never anything in it) — but wiping it too means a class reset today
  // does not resurrect five old matches from before this đợt on some future
  // migration bug. Harmless either way; cheap to be sure.
  await deleteDoc(doc(d, `users/${uid}/items`, docIdFor(classId))).catch(() => {});
}

/**
 * ⭐⭐ Đợt 224 — DROP ONE MATCH, NOT THE WHOLE LEDGER.
 * ⭐ Đợt 236 — now scoped to the month the match lives in (every caller already
 * has that from `_yyyymm` on the match it loaded — see loadMatches/loadMonth).
 * If that was the LAST match in the month, the month is dropped from the index
 * too, so an empty day-folder (and now an empty month-folder) never lingers on
 * screen — see core/showdown-home.js's own note on why days need no bookkeeping
 * of their own at all: they are derived from whatever matches remain.
 *
 * ⚠️ SAME TRANSACTION SHAPE AS `saveMatchResult()` — read the doc inside the
 * transaction, edit, write back. A plain get-then-set here would race a column
 * that finishes a NEW match in the same second the teacher deletes an old one,
 * and the loser's write would vanish with no symptom on either screen.
 *
 * Returns false when there was nothing to delete (doc missing, or that match
 * already gone) — never throws for that, only for signed-out/offline, same as
 * every other write in this file.
 */
export async function deleteMatch(classId, yyyymm, matchId) {
  if (!classId || !yyyymm || !matchId) return false;
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm));
  let found = false, className = "", count = 0, lastAt = 0;
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const node = normMonthDoc(snap.data(), classId, yyyymm);
    const before = node.matches.length;
    node.matches = node.matches.filter(m => m.matchId !== matchId);
    found = node.matches.length !== before;
    if (!found) return;             // nothing changed — do not bump updatedAt for no reason
    node.updatedAt = Date.now();
    tx.set(ref, clean(node));
    className = node.className;
    count = node.matches.length;
    lastAt = node.matches.reduce((a, x) => Math.max(a, x.at || 0), 0);
  });
  if (!found) return false;
  if (count === 0) await dropIndexMonth(classId, yyyymm);
  else await bumpIndex(classId, className, yyyymm, count, lastAt);
  return true;
}

/**
 * ⭐⭐ Đợt 230 — RENAME ONE MATCH BY HAND.
 * ⭐ Đợt 236 — scoped to the month the match lives in, same reason as deleteMatch.
 * Double-tap the name in Recent results / the SHOWDOWN home page. Overwrites
 * `customName`, which then wins over the formatted display name FOREVER for
 * this match (see `normMatch`'s own note) — typing a blank name clears it back
 * to the formatted/raw name rather than storing an empty override.
 */
export async function renameMatch(classId, yyyymm, matchId, customName) {
  if (!classId || !yyyymm || !matchId) return false;
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm));
  let found = false;
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const node = normMonthDoc(snap.data(), classId, yyyymm);
    const m = node.matches.find(x => x.matchId === matchId);
    if (!m) return;
    m.customName = cut(customName);
    found = true;
    node.updatedAt = Date.now();
    tx.set(ref, clean(node));
  });
  return found;
}

/**
 * ⭐⭐ Đợt 240 (thầy) — SAVE THE TABLE VIEW'S CLASSIFY-BAR THRESHOLDS.
 * Same shape as renameMatch() right above (its own copy-paste template) —
 * scoped to the one month the match lives in, a transaction so a concurrent
 * write from another tab can never clobber this one.
 * @param {{hi:number, lo:number}|null} classify  `null` clears it back to
 *   "never classified" (core/showdown-history.js's normMatch treats a
 *   missing/invalid value the same way, so passing null here is really just
 *   being explicit about it).
 */
export async function setMatchClassify(classId, yyyymm, matchId, classify) {
  if (!classId || !yyyymm || !matchId) return false;
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, monthDocId(classId, yyyymm));
  let found = false;
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const node = normMonthDoc(snap.data(), classId, yyyymm);
    const m = node.matches.find(x => x.matchId === matchId);
    if (!m) return;
    m.classify = (classify && Number.isFinite(Number(classify.hi)) && Number.isFinite(Number(classify.lo)))
      ? { hi: Math.max(0, Math.min(100, Number(classify.hi))), lo: Math.max(0, Math.min(100, Number(classify.lo))) }
      : null;
    found = true;
    node.updatedAt = Date.now();
    tx.set(ref, clean(node));
  });
  return found;
}
