// =============================================================
// ASSIGNMENTS — giving an act to students, and collecting what they score.
//
// THREE places in Firestore, each with a different audience:
//
//   assignments/{code}              PUBLIC READ. Holds a SNAPSHOT of the act, so
//                                   the teacher's library stays private and later
//                                   edits never disturb students mid-play.
//   assignments/{code}/scores/{id}  PUBLIC READ. Name + score + time only — this
//                                   is what the in-game leaderboard shows students.
//   results/{id}                    TEACHER READ ONLY. The full submission,
//                                   including every answer the student gave.
//
// So a student can see the class ranking but can never pull up a classmate's
// answers. The rules that enforce this are in docs/08-FIREBASE-SETUP.md.
//
// The `results` document keys are FIXED BY THE SECURITY RULES
// (assignmentId, studentName, score, total, timeMs, review, createdAt) — adding
// a key here without updating the published rules makes every submission fail.
// =============================================================

import { db, fs, currentUser } from "./firebase.js";
// Đợt 211 — the migration stamp travels WITH the snapshot; see snapshotOf().
// A leaf module of its own, so this costs the student page nothing and cannot
// reach the teacher's library — the ⛔ import boundary at the top of
// core/engine.js stays intact.
import { OPT_VER } from "./options-migrate.js";

// No 0/O/1/I/l — teachers read these codes aloud and type them on phones.
const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LENGTH = 6;

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function now() { return Date.now(); }

// Firestore rejects `undefined` (same trap as store.js).
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

// The playable part of an act — deliberately WITHOUT the library fields
// (parentId, trashed, num...) so nothing about the teacher's folders leaks.
// `optionsOverride` (Đợt C, 15/8/2026) — the HOMEWORK options the teacher set
// on the "Set assignment" form, kept apart from the PRACTICE/HOMEWORK content
// switch. When omitted, falls back to the act's own options (every caller
// before Đợt C, and student-side reads that never pass one).
//
// ⭐⭐ Đợt 211 (20/8/2026) — `optVer` IS PART OF THE SNAPSHOT NOW.
// It is the Đợt 143 stamp that says "these penalties are already on the 0..100
// scale". Leaving it out made every assignment look like a pre-Đợt-143 act to
// core/options-migrate.js, which runs again on the pupil's machine
// (core/engine.js line ~285) — so a homework "Points off 30" was converted a
// SECOND time and reached the child as 100. Measured before the fix: 30 -> 100.
// ⚠️ Stamped with the CURRENT version rather than copied from `act.optVer`:
// the options being frozen here have just come out of today's Options panel,
// so they are on today's scale by construction — even when the act itself is
// an old record that store.js has not re-saved yet.
// ⚠️ Assignments given out BEFORE this đợt are NOT touched. Some of them are
// older than Đợt 143 and their values genuinely still need converting; stamping
// them now would freeze a 0..5 penalty as if it were 0..100.
function snapshotOf(act, optionsOverride) {
  return clean({
    id: act.id,
    schemaVersion: act.schemaVersion ?? 1,
    optVer: OPT_VER,
    type: act.type,
    title: act.title || "",
    instruction: act.instruction || "",
    theme: act.theme || "classic",
    options: optionsOverride || act.options || {},
    content: act.content || {}
  });
}

// ---- teacher side ----------------------------------------------------------

// Create a new assignment for `act`. Returns the stored assignment.
// `folderId` = a folder of the RESULTS root to file it under (null = top level).
// ⭐⭐ Đợt 250 — `sourceAct`: THE ACT THIS ASSIGNMENT BELONGS TO, when `act` is
// not that act. The Set assignment form can now hand a class the same content
// as a DIFFERENT game (a Quiz given out as Balloon pop), and the only way to
// build that is core/convert.js's `convertActivity()`, which returns a THROWAWAY
// act: `id: "conv_…"`, no `num`, `_converted: true`.
// ⛔ Storing that act's identity would quietly cut the assignment loose from the
// library: `listAssignmentsForAct(activityId)` is what draws the strip of
// assignments under an act, and it matches on `activityId` alone — a "conv_…"
// id matches nothing, for ever. So identity (id · num · title) comes from
// `sourceAct` while the PLAYABLE part (type + snapshot) comes from `act`.
// Omitted ⇒ the two are the same object, which is every pre-Đợt-250 call.
export async function createAssignment(act, { title, deadline = null, endOptions = {}, folderId = null, options = null, sourceAct = null } = {}) {
  const idAct = sourceAct || act;
  const user = await currentUser();
  if (!user) { const e = new Error("Please sign in first."); e.code = "aw/signed-out"; throw e; }
  const [d, { doc, getDoc, setDoc }] = await Promise.all([db(), fs()]);

  // Collisions are vanishingly unlikely (31^6), but a used code would overwrite
  // a live assignment, so check before writing.
  let code = makeCode();
  for (let tries = 0; tries < 5; tries++) {
    if (!(await getDoc(doc(d, "assignments", code))).exists()) break;
    code = makeCode();
  }

  const data = clean({
    code,
    title: (title || "").trim() || `Assignment for ${idAct.title || "Untitled"}`,
    activityId: idAct.id || null,
    activityNum: typeof idAct.num === "number" ? idAct.num : null,
    // ⚠️ TYPE comes from `act`, not `idAct` — this is what the pupil's machine
    // mounts (play.js does ensureTemplate(activity.type)), and the report header
    // names. The identity above and the game below deliberately disagree when
    // the teacher assigned the act as another template (Đợt 250).
    activityType: act.type,
    activityTitle: idAct.title || "",
    // `options` (Đợt C) — the options CHOSEN on the Set assignment form, not
    // `act.options`: a snapshot must freeze what the teacher actually picked
    // for this assignment, never silently drift if the act is tuned later.
    activity: snapshotOf(act, options),
    deadline: deadline ?? null,          // ms since epoch, or null for no deadline
    endOptions: {
      leaderboard: endOptions.leaderboard !== false,
      showAnswers: endOptions.showAnswers !== false,
      startAgain: endOptions.startAgain !== false
    },
    // Where it sits in the RESULTS tree. There is no second copy anywhere: the
    // strip under the act and the card in Results both read THIS document.
    folderId: folderId ?? null,
    closed: false,                       // true = link still opens, but says "closed"
    trashed: false,                      // true = in the Results recycle bin
    trashedAt: null,
    ownerUid: user.uid,
    createdAt: now()
  });
  await setDoc(doc(d, "assignments", code), data);
  return data;
}

// Every assignment made from this act, newest first (bin excluded by default).
export async function listAssignmentsForAct(activityId, { includeTrashed = false } = {}) {
  if (!activityId) return [];
  const [d, { collection, query, where, getDocs }] = await Promise.all([db(), fs()]);
  // Sorted in JS on purpose: an orderBy here would need a composite index.
  const snap = await getDocs(query(collection(d, "assignments"), where("activityId", "==", activityId)));
  return snap.docs.map(s => s.data())
    .filter(a => includeTrashed || !a.trashed)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Everything the teacher has ever given out. The Results pages work from this
// one list, so nothing can drift out of step with the strips under the acts.
export async function listAllAssignments({ includeTrashed = false } = {}) {
  const user = await currentUser();
  if (!user) { const e = new Error("Please sign in first."); e.code = "aw/signed-out"; throw e; }
  const [d, { collection, query, where, getDocs }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(query(collection(d, "assignments"), where("ownerUid", "==", user.uid)));
  return snap.docs.map(s => s.data())
    .filter(a => includeTrashed || !a.trashed)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Change a few fields (title / deadline / endOptions / folderId / closed).
export async function updateAssignment(code, patch) {
  const [d, { doc, updateDoc }] = await Promise.all([db(), fs()]);
  await updateDoc(doc(d, "assignments", String(code)), clean(patch));
}

// Delete = send to the Results recycle bin. While it is in the bin the student
// link stops working (play.js checks `trashed`), but every score is still there,
// so an accidental delete costs nothing.
export async function trashAssignment(code) {
  await updateAssignment(code, { trashed: true, trashedAt: now() });
}

export async function restoreAssignment(code) {
  await updateAssignment(code, { trashed: false, trashedAt: null });
}

// Empty-the-bin: really remove the assignment, its public scores and the
// detailed results. (Deleting `results` needs the teacher-only delete rule
// published on 20/7/2026 — see docs/08-FIREBASE-SETUP.md.)
export async function deleteAssignmentForever(code) {
  const [d, sdk] = await Promise.all([db(), fs()]);
  const { doc, collection, query, where, getDocs, deleteDoc, writeBatch } = sdk;

  const removeAll = async docs => {
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(d);
      docs.slice(i, i + 400).forEach(s => batch.delete(s.ref));
      await batch.commit();
    }
  };

  const scores = await getDocs(collection(d, "assignments", String(code), "scores"));
  await removeAll(scores.docs);
  const results = await getDocs(query(collection(d, "results"), where("assignmentId", "==", String(code))));
  await removeAll(results.docs);
  await deleteDoc(doc(d, "assignments", String(code)));
}

// ---- filing a new assignment under its CLASS folder ------------------------
// The teacher names lessons like "A1A_9.6_WORDS DS-S2.I1.W2 / ENG1", so the
// first word (up to the first "_" or space) is the class: A1A. If a folder of
// exactly that name exists in Results, the assignment goes there by itself.
export function classTokenOf(title) {
  return String(title || "").trim().split(/[\s_]+/)[0] || "";
}

// `folders` = the live folders of the results root (from store.listFolders).
// Returns a folder id, or null for the top level of Results.
export function classFolderFor(title, folders) {
  const token = classTokenOf(title).toLowerCase();
  if (!token) return null;
  const hits = folders.filter(f => String(f.name || "").trim().toLowerCase() === token);
  if (!hits.length) return null;
  // If the same class name exists at two depths, prefer the shallowest one.
  const depthOf = f => { let d = 0, n = f; const byId = new Map(folders.map(x => [x.id, x]));
    while (n && n.parentId) { d++; n = byId.get(n.parentId); } return d; };
  return hits.sort((a, b) => depthOf(a) - depthOf(b))[0].id;
}

// ---- "new results" dots ----------------------------------------------------
// An assignment has something new when a student has handed in since the last
// time the teacher opened its report.
export function hasNewResults(a) {
  return !!a && (a.lastSubmitAt || 0) > (a.lastSeenAt || 0);
}

// Called when the report is opened — that IS "the teacher has seen it".
export async function markAssignmentSeen(code) {
  try { await updateAssignment(code, { lastSeenAt: now() }); } catch (e) { /* a dot is not worth an error */ }
}

// Two assignments in one Results folder may not share a name (the teacher's
// rule, same as folders and acts in core/store.js).
export function assignmentNameTaken(all, { folderId, title, exceptCode }) {
  const wanted = String(title || "").trim().toLowerCase();
  return all.some(a => !a.trashed && (a.folderId ?? null) === (folderId ?? null) &&
    a.code !== exceptCode && String(a.title || "").trim().toLowerCase() === wanted);
}

// ---- filing OLDER assignments of a class into DONE when a new day starts --
// Called right after a new assignment is created in a class folder: any
// SIBLING assignment (same folder) made on an EARLIER calendar day than the
// new one gets tucked into a "DONE" subfolder, so the class folder only shows
// the current day's work. Same-day siblings, or ones somehow dated LATER than
// the new assignment, are left exactly where they are (the teacher's rule).
function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function assignmentsToArchive(siblings, newCreatedAt) {
  const cutoff = dayStart(newCreatedAt);
  return siblings.filter(a => dayStart(a.createdAt) < cutoff);
}

// Full submissions (teacher only — the rules refuse this for everyone else).
export async function listResults(code) {
  const [d, { collection, query, where, getDocs }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(query(collection(d, "results"), where("assignmentId", "==", code)));
  return snap.docs.map(s => ({ id: s.id, ...s.data() }));
}

// ---- student side (NO sign-in) ---------------------------------------------

export async function getAssignment(code) {
  if (!code) return null;
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, "assignments", String(code)));
  return snap.exists() ? snap.data() : null;
}

// Name + score + time of everyone who played — the public leaderboard feed.
export async function listScores(code) {
  const [d, { collection, getDocs }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(collection(d, "assignments", String(code), "scores"));
  return snap.docs.map(s => ({ id: s.id, ...s.data() }));
}

// =============================================================
// HANDING IN — Đợt 246 (23/8/2026, thầy): "cơ chế chắc chắn tuyệt đối".
//
// The old submitResult() was one addDoc + two swallowed catches: on classroom
// wifi a play could half-land (public score without the teacher copy), silently
// vanish, or — if anyone naively retried — land TWICE. The machinery below
// replaces it. Three ideas, each load-bearing:
//
//   1. ONE ATTEMPT = ONE FIXED ID, minted the moment the game ends
//      (`queueAttempt`). Both documents are written with `setDoc` under that
//      id, so re-sending the same attempt can never create a second row.
//
//   2. THE OUTBOX (localStorage) — the attempt is stored BEFORE the first try,
//      so a tab killed mid-send still owes the play, and `flushOutbox()` (run
//      whenever play.html opens) quietly delivers it later. Same shape as the
//      Showdown outbox of Đợt 196, for the same reason.
//
//   3. "DELIVERED" MEANS THE SERVER SAID SO — for BOTH documents. sendAttempt
//      resolves {ok:true} only when the public score row AND the teacher's
//      detailed copy are each confirmed. The UI (engine's SUBMIT HOMEWORK
//      button) is required to show success only on that {ok:true} — never on
//      hope. The ambiguous case (we timed out but the write may have landed)
//      is tracked per document via `mayExist*`:
//        · scores  → readable by anyone, so the next try simply LOOKS first;
//        · results → students cannot read it, but its rule is create-only
//          (`allow update: if false`), so re-creating an id that already
//          exists comes back permission-denied — and with `mayExistResult`
//          set, that exact error IS the confirmation. A permission-denied on
//          a FIRST try (nothing can exist yet) stays what it looks like: a
//          hard rules failure, reported as {ok:false, hard:true}.
//
// Nothing here needs a rules change — measured against the published rules in
// docs/08-FIREBASE-SETUP.md (scores: create for anyone, public read; results:
// create for anyone, create-only; doc ids unconstrained in both).
// =============================================================

const OUTBOX_KEY = "aword-hw-outbox";
let memOutbox = null;   // fallback when localStorage is unavailable (private mode / quota)

function readOutbox() {
  if (memOutbox) return memOutbox;
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]") || []; }
  catch (e) { return []; }
}
function writeOutbox(list) {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list)); memOutbox = null; }
  catch (e) { memOutbox = list; }   // keep it at least for this page's lifetime
}
function saveOutboxEntry(entry) {
  const rest = readOutbox().filter(e => e.attemptId !== entry.attemptId);
  writeOutbox([...rest, entry]);
}
function dropOutboxEntry(entry) {
  writeOutbox(readOutbox().filter(e => e.attemptId !== entry.attemptId));
}

// Freeze one finished play into an outbox entry. Everything about the attempt —
// id, name, numbers, review, createdAt — is decided HERE, once; every send and
// re-send afterwards only reads it. `createdAt` doubles as the teacher-side
// de-duplication key (loadReport merges results and scores on name+createdAt).
export function queueAttempt({ code, studentName, score, total, timeMs, review }) {
  // Collapse runs of spaces too (play.js does the same at the name screen) so
  // the stored spelling always matches what nameKey() groups by.
  const name = String(studentName || "Player").trim().replace(/\s+/g, " ").slice(0, 40) || "Player";
  const createdAt = now();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)),
    b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  const entry = {
    attemptId: `hw${createdAt}x${rand}`,
    code: String(code),
    name,
    score: Math.round(score) | 0,
    total: Math.round(total) | 0,
    timeMs: Math.round(timeMs) | 0,
    review: clean(review || []),
    createdAt,
    scoreOk: false, resultOk: false,
    mayExistScore: false, mayExistResult: false
  };
  saveOutboxEntry(entry);
  return entry;
}

// The Firestore SDK does not time out on its own — on dead wifi a write just
// hangs (it queues). This race is what turns "hanging" into a decision the UI
// can act on. The underlying write may still land later; that is exactly what
// the `mayExist*` flags are for.
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "aw/timeout" })), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

const isDenied = e => e && e.code === "permission-denied";

/**
 * Deliver one attempt. Resolves {ok:true} only when BOTH documents are
 * confirmed on the server; {ok:false} after the tries run out; {ok:false,
 * hard:true} when the rules rejected a first-time write (retrying cannot fix
 * that). NEVER throws, and never double-writes: see the header above.
 */
export async function sendAttempt(entry, { tries = 3, tryTimeoutMs = 6000 } = {}) {
  let d, sdk;
  try { [d, sdk] = await Promise.all([db(), fs()]); }
  catch (e) { return { ok: false }; }
  const { doc, getDoc, setDoc, updateDoc, increment } = sdk;

  const scoreRef = doc(d, "assignments", entry.code, "scores", entry.attemptId);
  const resultRef = doc(d, "results", entry.attemptId);
  // EXACTLY the keys the security rules allow, in both documents.
  const scoreData = {
    name: entry.name, score: entry.score, total: entry.total,
    timeMs: entry.timeMs, createdAt: entry.createdAt
  };
  const resultData = clean({
    assignmentId: entry.code, studentName: entry.name,
    score: entry.score, total: entry.total, timeMs: entry.timeMs,
    review: entry.review || [], createdAt: entry.createdAt
  });

  for (let round = 0; round < tries; round++) {
    if (round) await new Promise(r => setTimeout(r, 700 * round));   // breathe between tries

    if (!entry.scoreOk) {
      try {
        // An earlier try may have landed without telling us — LOOK before writing
        // (scores are publicly readable, so this is the cheap, certain check).
        if (entry.mayExistScore && (await withTimeout(getDoc(scoreRef), tryTimeoutMs)).exists()) {
          entry.scoreOk = true;
        } else {
          await withTimeout(setDoc(scoreRef, scoreData), tryTimeoutMs);
          entry.scoreOk = true;
        }
      } catch (e) {
        if (isDenied(e)) {
          // create-on-existing is an UPDATE, which students may not do — so with
          // an ambiguous earlier try this denial means "already there".
          if (entry.mayExistScore) entry.scoreOk = true;
          else { saveOutboxEntry(entry); return { ok: false, hard: true }; }
        } else entry.mayExistScore = true;
      }
      saveOutboxEntry(entry);
    }

    if (!entry.resultOk) {
      try {
        await withTimeout(setDoc(resultRef, resultData), tryTimeoutMs);
        entry.resultOk = true;
      } catch (e) {
        if (isDenied(e)) {
          if (entry.mayExistResult) entry.resultOk = true;   // create-only rule: denied = it exists
          else { saveOutboxEntry(entry); return { ok: false, hard: true }; }
        } else entry.mayExistResult = true;
      }
      saveOutboxEntry(entry);
    }

    if (entry.scoreOk && entry.resultOk) {
      dropOutboxEntry(entry);
      // The "new results" dot — best-effort, same as always (worst case someone
      // fakes a dot; see docs/08-FIREBASE-SETUP.md).
      try {
        await updateDoc(doc(d, "assignments", entry.code), {
          lastSubmitAt: entry.createdAt, submitCount: increment(1)
        });
      } catch (e) { /* a dot is not worth an error */ }
      return { ok: true };
    }
  }
  return { ok: false };
}

// Deliver whatever previous visits still owe — run on every play.html load,
// in the background, never blocking anything. Sequential on purpose: these are
// leftovers on a possibly-bad connection, not a race.
export async function flushOutbox() {
  for (const entry of readOutbox()) {
    try { await sendAttempt(entry, { tries: 2, tryTimeoutMs: 8000 }); }
    catch (e) { /* still owed — the outbox keeps it */ }
  }
}

// ---- shared helpers ---------------------------------------------------------

// "Bộ từ vựng 3" -> "bo-tu-vung-3". Used only to make links self-explanatory
// when another app (myLink) reads the URL to name a shortcut — the code alone
// is what actually opens the assignment; the slug is decoration.
function slugify(text) {
  return String(text || "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

// The link a student opens. Works from any page of the app.
// `title`, when given, adds a readable slug after the code — 404.html reads
// past it and redirects to the real play.html?g= link, so old plain links
// (no slug) still work exactly as before.
export function assignmentLink(code, title) {
  const dir = location.pathname.replace(/[^/]*$/, "");   // strip index.html / play.html
  const slug = slugify(title);
  const tail = slug ? `g/${encodeURIComponent(code)}/${slug}` : `g/${encodeURIComponent(code)}`;
  return `${location.origin}${dir}${tail}`;
}

export function isLate(assignment, when = now()) {
  return !!(assignment?.deadline && when > assignment.deadline);
}

// "trang anh", "Trang  Anh" and "TRANG ANH" are all the same student.
export function nameKey(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Of several spellings of one name, show the nicest-looking one: prefer the
// version with capital letters, then the longest.
export function prettiestName(names) {
  return names.slice().sort((a, b) => {
    const capsA = (a.match(/[A-ZÀ-Ỹ]/g) || []).length, capsB = (b.match(/[A-ZÀ-Ỹ]/g) || []).length;
    if (capsA !== capsB) return capsB - capsA;
    return b.length - a.length;
  })[0] || "";
}

// Rank: more correct first, then faster (the teacher's rule).
export function rankCompare(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return (a.timeMs || 0) - (b.timeMs || 0);
}
