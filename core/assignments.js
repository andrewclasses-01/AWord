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
function snapshotOf(act) {
  return clean({
    id: act.id,
    schemaVersion: act.schemaVersion ?? 1,
    type: act.type,
    title: act.title || "",
    instruction: act.instruction || "",
    theme: act.theme || "classic",
    options: act.options || {},
    content: act.content || {}
  });
}

// ---- teacher side ----------------------------------------------------------

// Create a new assignment for `act`. Returns the stored assignment.
// `folderId` = a folder of the RESULTS root to file it under (null = top level).
export async function createAssignment(act, { title, deadline = null, endOptions = {}, folderId = null } = {}) {
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
    title: (title || "").trim() || `Assignment for ${act.title || "Untitled"}`,
    activityId: act.id || null,
    activityNum: typeof act.num === "number" ? act.num : null,
    activityType: act.type,
    activityTitle: act.title || "",
    activity: snapshotOf(act),
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

// Two assignments in one Results folder may not share a name (the teacher's
// rule, same as folders and acts in core/store.js).
export function assignmentNameTaken(all, { folderId, title, exceptCode }) {
  const wanted = String(title || "").trim().toLowerCase();
  return all.some(a => !a.trashed && (a.folderId ?? null) === (folderId ?? null) &&
    a.code !== exceptCode && String(a.title || "").trim().toLowerCase() === wanted);
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

// Hand in one play. Writes the public score row FIRST (that is what the student
// sees next); if the private teacher copy fails we still return normally rather
// than blocking a child on an error they cannot act on.
export async function submitResult({ code, studentName, score, total, timeMs, review }) {
  const [d, { collection, addDoc }] = await Promise.all([db(), fs()]);
  const name = String(studentName || "Player").trim().slice(0, 40) || "Player";
  const createdAt = now();
  const base = {
    name,
    score: Math.round(score) | 0,
    total: Math.round(total) | 0,
    timeMs: Math.round(timeMs) | 0,
    createdAt
  };

  const scoreRef = await addDoc(collection(d, "assignments", String(code), "scores"), base);

  try {
    // EXACTLY the keys the security rules allow — see the note at the top.
    await addDoc(collection(d, "results"), clean({
      assignmentId: String(code),
      studentName: name,
      score: base.score,
      total: base.total,
      timeMs: base.timeMs,
      review: review || [],
      createdAt
    }));
  } catch (e) {
    console.warn("AWord: the detailed result could not be saved:", e.message);
  }

  return { id: scoreRef.id, ...base };
}

// ---- shared helpers ---------------------------------------------------------

// The link a student opens. Works from any page of the app.
export function assignmentLink(code) {
  const dir = location.pathname.replace(/[^/]*$/, "");   // strip index.html / play.html
  return `${location.origin}${dir}play.html?g=${encodeURIComponent(code)}`;
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
