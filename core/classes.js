// =============================================================
// CLASSES — the teacher's class rolls (a class name + its students).
//
// This is PERSISTENT, app-wide data, not activity content: Running team deals
// its turns out to real pupils by name, and later activities will want the same
// roll. It is edited from Settings -> Classes, never from inside an act.
//
//   listClasses()                  -> [{id, name, students:[{id,name}]}], A-Z
//   getClass(id)
//   createClass(name)
//   renameClass(id, name)
//   setStudents(id, students)      -> students given as [{id?, name}]
//   deleteClass(id)                -> gone for good (classes have no trash)
//   parseStudentNames(text)        -> names out of a pasted Excel column
//   mergeStudents(oldList, names)  -> keeps the ID of a pupil whose name is unchanged
//
// ---------------------------------------------------------------------------
// WHY THIS LIVES IN `users/{uid}/items` ALONGSIDE FOLDERS AND ACTS
// ---------------------------------------------------------------------------
// The Firestore security rules (docs/08-FIREBASE-SETUP.md) open exactly one
// document path for the teacher's own data:
//
//     match /users/{uid}/items/{itemId} { allow read, write: if isTeacher() ... }
//
// A brand-new collection (`users/{uid}/classes/...`) would be DENIED until
// somebody edits the rules in the Firebase console by hand — one more manual
// step, on a machine that may not be the one running this code, and a silent
// permission error if it is forgotten. Storing a class as one more `kind` of
// item inside `items` needs no console change at all.
//
// It stays invisible to the library because every listing function in store.js
// (listChildren · listFolders · searchItems · listTrash) filters on
// `n.root === root`, and no class node ever carries root "activities" or
// "results". Note that `ROOTS` in store.js is deliberately NOT extended: that
// array drives the two cards on the HOME PAGE (main.js renderTop), so adding
// "classes" there would grow a third library tile — classes belong in Settings.
//
// Two defensive edits in store.js keep the link-number system clear of these
// nodes (`ensureNumbers` skips them, `getByNum` never returns one) — a class is
// not a linkable thing, and a class answering to ?a=57 would be a real bug.
//
// The cache here is separate from store.js's. That is safe because the two
// never write the same document: class ids all start "cls_", and classes are
// the only nodes with kind "class". Classes carry no `num`, so they can never
// collide with the link-number counter store.js maintains.
// =============================================================

import { db, fs, currentUser } from "./firebase.js";

export const CLASSES_ROOT = "classes";
export const MAX_STUDENTS = 60;      // a guard, not a target (real classes ~10-25)

function now() { return Date.now(); }
function newId(prefix) {
  return prefix + "_" + now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ---- Firestore plumbing (mirrors core/store.js; same collection, own cache) --
let cache = null;      // { [id]: classNode }
let cacheUid = null;

export function resetClassesCache() { cache = null; cacheUid = null; }

async function requireUid() {
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to use your classes.");
    err.code = "aw/signed-out";
    throw err;
  }
  return user.uid;
}

function itemsPath(uid) { return `users/${uid}/items`; }

// Firestore rejects `undefined`, so drop those keys before writing.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out;
  }
  return value;
}

async function readAll() {
  const uid = await requireUid();
  if (cache && cacheUid === uid) return cache;
  const [d, { collection, getDocs, query, where }] = await Promise.all([db(), fs()]);
  // Only the class documents — the library can be hundreds of acts and none of
  // them are wanted here.
  const snap = await getDocs(query(collection(d, itemsPath(uid)), where("kind", "==", "class")));
  const map = {};
  snap.forEach(s => { map[s.id] = normalize({ ...s.data(), id: s.id }); });
  cache = map; cacheUid = uid;
  return cache;
}

async function persist(node) {
  const uid = await requireUid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, itemsPath(uid), node.id), clean(node));
}

async function persistDelete(id) {
  const uid = await requireUid();
  const [d, { doc, deleteDoc }] = await Promise.all([db(), fs()]);
  await deleteDoc(doc(d, itemsPath(uid), id));
}

// ---- shape -----------------------------------------------------------------
// Tolerant on read: a roll saved by an older build (or hand-edited) may hold
// bare strings instead of {id,name} objects, and must not break the app.
function normalize(node) {
  const students = Array.isArray(node.students) ? node.students : [];
  return {
    ...node,
    kind: "class",
    root: CLASSES_ROOT,
    parentId: null,
    name: String(node.name || "").trim(),
    students: students
      .map(s => (typeof s === "string" ? { id: newId("st"), name: s } : s))
      // ⭐ Đợt 191 — `gender` is the THIRD field a pupil may carry, and the first
      // added since this shape was written. It exists for Showdown's shuffle,
      // which the teacher asked to spread boys and girls evenly (18/8/2026); it is
      // set by hand in Settings › Classes and is always optional.
      // ⚠️ Only "m" / "f" / "" are ever stored. This function is the ONE gate on to
      // Firestore for a roll, so any other value is normalised away here rather
      // than left for each reader to second-guess. A roll saved before this đợt
      // simply carries "" everywhere and behaves exactly as it always did.
      .map(s => ({
        id: String(s?.id || newId("st")),
        name: String(s?.name || "").trim(),
        gender: (s?.gender === "m" || s?.gender === "f") ? s.gender : ""
      }))
      .filter(s => s.name)
      .slice(0, MAX_STUDENTS),
    trashed: false
  };
}

function byName(a, b) {
  return String(a.name).localeCompare(String(b.name), "en", { numeric: true, sensitivity: "base" });
}

function duplicateNameError(name) {
  const err = new Error(`A class named "${name}" already exists.`);
  err.code = "aw/duplicate-name";
  return err;
}

// Same rule the library uses: two classes may not share a name.
function nameTaken(map, name, exceptId) {
  const key = String(name).trim().toLowerCase();
  return Object.values(map).some(c =>
    c.id !== exceptId && String(c.name).trim().toLowerCase() === key);
}

// ---- reads -----------------------------------------------------------------
export async function listClasses() {
  return Object.values(await readAll()).sort(byName);
}

export async function getClass(id) {
  return (await readAll())[id] || null;
}

// ---- writes ----------------------------------------------------------------
export async function createClass(name) {
  const map = await readAll();
  const wanted = String(name || "").trim();
  if (!wanted) throw new Error("Please enter a class name.");
  if (nameTaken(map, wanted)) throw duplicateNameError(wanted);

  const node = normalize({
    id: newId("cls"),
    name: wanted,
    students: [],
    createdAt: now(),
    updatedAt: now()
  });
  map[node.id] = node;
  await persist(node);
  return node;
}

export async function renameClass(id, name) {
  const map = await readAll();
  const node = map[id];
  if (!node) throw new Error("That class no longer exists.");
  const wanted = String(name || "").trim();
  if (!wanted) throw new Error("Please enter a class name.");
  if (nameTaken(map, wanted, id)) throw duplicateNameError(wanted);

  const next = normalize({ ...node, name: wanted, updatedAt: now() });
  map[id] = next;
  await persist(next);
  return next;
}

export async function setStudents(id, students) {
  const map = await readAll();
  const node = map[id];
  if (!node) throw new Error("That class no longer exists.");

  const next = normalize({ ...node, students, updatedAt: now() });
  map[id] = next;
  await persist(next);
  return next;
}

export async function deleteClass(id) {
  const map = await readAll();
  if (!map[id]) return;
  delete map[id];
  await persistDelete(id);
}

// ---- helpers for the editing UI --------------------------------------------
// One name per line, but a row pasted from Excel arrives tab-separated and a
// hand-typed list often uses commas — accept all three, same as the Running
// word pool box.
export function parseStudentNames(text) {
  return String(text || "")
    .split(/[\r\n\t]+|,(?=\s)/)
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, MAX_STUDENTS);
}

// Turn a fresh list of NAMES into {id,name} records, keeping the existing id of
// anyone whose name is unchanged. Ids have to survive an edit: a saved Running
// team roster names its pupils by id, so re-generating them would orphan a
// roster the teacher had already printed against. Two pupils really can share a
// name, so each old id is reused at most once.
// ⭐ Đợt 191 — `genders` (optional) is a name -> "m"/"f" map from the editor's
// chip grid, keyed the same lowercased way the id pool is. It is passed in rather
// than read off `oldList` because the teacher may have RENAMED a pupil in the
// same edit, and the chips follow the text on screen, not the saved roll.
// A pupil whose name is not in the map keeps whatever the old roll said, so
// saving a class without ever touching the chips cannot wipe the genders.
export function mergeStudents(oldList, names, genders) {
  const pool = new Map();          // lowercased name -> queue of surviving ids
  const wasGender = new Map();     // lowercased name -> gender on the saved roll
  (oldList || []).forEach(s => {
    const key = String(s?.name || "").trim().toLowerCase();
    if (!key || !s?.id) return;
    if (!pool.has(key)) pool.set(key, []);
    pool.get(key).push(s.id);
    if (s.gender && !wasGender.has(key)) wasGender.set(key, s.gender);
  });
  return names.map(name => {
    const key = name.trim().toLowerCase();
    const queue = pool.get(key);
    const id = queue && queue.length ? queue.shift() : newId("st");
    const g = genders && genders.has(key) ? genders.get(key) : (wasGender.get(key) || "");
    return { id, name, gender: g === "m" || g === "f" ? g : "" };
  });
}
