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
export async function createAssignment(act, { title, deadline = null, endOptions = {} } = {}) {
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
    ownerUid: user.uid,
    createdAt: now()
  });
  await setDoc(doc(d, "assignments", code), data);
  return data;
}

// Every assignment made from this act, newest first.
export async function listAssignmentsForAct(activityId) {
  if (!activityId) return [];
  const [d, { collection, query, where, getDocs }] = await Promise.all([db(), fs()]);
  // Sorted in JS on purpose: an orderBy here would need a composite index.
  const snap = await getDocs(query(collection(d, "assignments"), where("activityId", "==", activityId)));
  return snap.docs.map(s => s.data()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
