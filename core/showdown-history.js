// =============================================================
// SHOWDOWN — THE DURABLE RESULT HISTORY (Đợt 197, 19/8/2026)
//
// Thầy: *"Cần cơ chế lưu dữ liệu bền kể cả khi tắt máy: mỗi lần có kết quả các
// team là lưu bền dữ liệu kết quả và gán cho 1 lần thi đấu của cả lớp… Mỗi lớp
// lưu tối đa 5 cột, khi tạo cột số 6 thì cột đầu tiên sẽ bị xóa."*
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
//                 nothing is wiped by Reset teams. It answers "how did 5B do in
//                 its last five matches?", and it has to survive the computer
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
// ONE DOCUMENT PER CLASS
// ---------------------------------------------------------------------------
//   `users/{uid}/items/sd_hist_<classId>`, kind "showdown-history"
//   { classId, className, matches: [ match, … ] }   (at most MAX_MATCHES)
//
// Per CLASS, not one document for everything: a match carries every question of
// every pupil, and Firestore's hard limit is 1MB per document. Five matches of
// one class fit with room to spare (measured shapes: ~150 bytes a row, 18 pupils
// × 10 rows ≈ 27KB a match); every class in one document would not.
// It lives in `users/{uid}/items` for the reason core/classes.js gives at
// length: the published Firestore rules open exactly that one path, so a new
// collection would be DENIED until somebody edited them in the console by hand.
//
// ⚠️ EVERY WRITE IS A TRANSACTION. Four columns finish seconds apart and all
// four write into the SAME match of the same document; a read-modify-write would
// lose whichever landed second — the exact bug Đợt 196 spent a day on, and the
// reason this file was written with transactions from its first line rather than
// "for later".
// =============================================================

import { db, fs, currentUser } from "./firebase.js";
import { SOLO_TEAM_ID } from "./showdown.js";

// Thầy's own number: "Mỗi lớp lưu tối đa 5 cột, khi tạo cột số 6 thì cột đầu
// tiên sẽ bị xóa." It is also how many columns the Recently results screen draws.
export const MAX_MATCHES = 5;
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

const cut = s => String(s || "").slice(0, TEXT_CAP);
const docIdFor = classId => `sd_hist_${String(classId || "").replace(/[^A-Za-z0-9_-]/g, "")}`;

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
    at: Number(m?.at) || 0,
    updatedAt: Number(m?.updatedAt) || 0,
    teams
  };
}

function normDoc(raw, classId) {
  return {
    kind: "showdown-history", root: "showdown", parentId: null, trashed: false,
    classId: String(raw?.classId || classId || ""),
    className: String(raw?.className || "").trim(),
    matches: (Array.isArray(raw?.matches) ? raw.matches : []).map(normMatch).filter(m => m.matchId),
    updatedAt: Number(raw?.updatedAt) || 0
  };
}

/**
 * Keep the document under the budget by dropping the per-question DETAIL of the
 * OLDEST matches first — never a whole match, and never a pupil.
 * The podium (name · team · right · wrong · time · %) is computed from fields
 * that stay, so an old match keeps its board and loses only the ability to be
 * opened up. That is the right thing to lose: five matches back, "who won" is
 * still wanted and "what did AN answer to question 7" is not.
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
// WRITE
// ---------------------------------------------------------------
/**
 * File ONE team's finished result into the class's ledger.
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
  classId, className, tableId, roundKey, playNo, actName = "",
  teamId, teamName, students
}) {
  if (!classId || !teamId) return false;
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, docIdFor(classId));
  const id = matchIdOf(tableId, roundKey, playNo);
  const now = Date.now();
  const entry = {
    teamId: String(teamId),
    // A solo pick names its team after the class (applySolo), which is right on
    // its own board and wrong on a ledger row, where "A1B" as a team name beside
    // "A1B" as the class reads as a mistake. Say what it is.
    teamName: String(teamId) === SOLO_TEAM_ID ? "Whole class" : (String(teamName || "").trim() || "Team"),
    at: now,
    students: (students || []).map(normStudent).filter(s => s.name)
  };
  await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const node = normDoc(snap.exists() ? snap.data() : {}, classId);
    node.className = String(className || node.className || "");
    let m = node.matches.find(x => x.matchId === id);
    if (!m) {
      m = normMatch({ matchId: id, tableId, roundKey, playNo, actName, at: now });
      node.matches.push(m);
      // Thầy's rule, applied on CREATION rather than on write: five columns, and
      // the sixth pushes the first out. Sorted by `at` rather than by array
      // order, because two columns creating two matches in the same second may
      // append in either order.
      node.matches.sort((a, b) => (a.at || 0) - (b.at || 0));
      while (node.matches.length > MAX_MATCHES) node.matches.shift();
    }
    // A team may only ever have ONE row in a match — a board that finished, was
    // restarted and finished again inside the same play number replaces itself.
    m.teams[entry.teamId] = entry;
    m.updatedAt = now;
    if (!m.actName && actName) m.actName = cut(actName);
    node.updatedAt = now;
    tx.set(ref, clean(fitToBudget(node)));
  });
  return true;
}

// ---------------------------------------------------------------
// READ
// ---------------------------------------------------------------
/**
 * A class's matches, NEWEST FIRST — which is the order the five columns are
 * drawn in, so the most recent match is the one under the teacher's hand.
 * Always read fresh: the whole point of the screen that calls this is that
 * something has happened since it was last looked at.
 */
export async function loadMatches(classId) {
  if (!classId) return [];
  const uid = await requireUid();
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, docIdFor(classId)));
  const node = normDoc(snap.exists() ? snap.data() : {}, classId);
  // ⚠️ THE STORED INDEX IS THE TIE-BREAK, and it is not decoration. `at` is a
  // millisecond clock, and two matches really can share one: four boards filing
  // in the same tick during a fast replay, and every one of the six matches this
  // was first tested with. A plain `b.at - a.at` leaves ties in their stored
  // order — which is oldest-FIRST — so on a tie the board drew the five columns
  // backwards and the newest match sat on the right. Measured, not reasoned:
  // the grid caught it (scratch/sd197-panel.html, "cột mới nhất đứng đầu").
  return node.matches
    .map((m, i) => ({ m, i }))
    .sort((a, b) => ((b.m.at || 0) - (a.m.at || 0)) || (b.i - a.i))
    .map(x => x.m)
    .slice(0, MAX_MATCHES);
}

/** Throw a class's whole ledger away. Only the teacher's own Clear asks for this. */
export async function wipeMatches(classId) {
  if (!classId) return;
  const uid = await requireUid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, docIdFor(classId)), {
    kind: "showdown-history", root: "showdown", parentId: null, trashed: false,
    classId: String(classId), className: "", matches: [], updatedAt: Date.now()
  });
}
