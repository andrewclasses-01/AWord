// =============================================================
// WEREWOLF — what the game keeps between sessions (Đợt 373).
//
//  1. SEATING per class — the order the teacher dragged the cards into on the
//     Setup screen (their real classroom circle). Shared across machines:
//     Firestore users/{uid}/items/aw-werewolf, kind "werewolf" and no `root`,
//     exactly the pattern of core/settings.js's "aw-settings" doc — the only
//     path the published rules open is users/{uid}/items/{itemId}, and a doc
//     without `root` never shows in a library listing. "werewolf" is listed in
//     core/store.js APP_DATA_KINDS so it can never eat a ?f=/?a= link number.
//
//  2. MUSIC the teacher adds — mp3 files kept as Blobs in IndexedDB on THIS
//     device (same approach as core/wrong-sound.js uploads). A Firestore doc is
//     capped at 1 MB and AWord has no Storage bucket set up, so a song cannot
//     travel between machines this way; the iPad that plays the music is the
//     one that holds it.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";

const DOC_ID = "aw-werewolf";

async function docRef() {
  const user = await currentUser();
  if (!user) return null;
  const [d, { doc }] = await Promise.all([db(), fs()]);
  return doc(d, `users/${user.uid}/items`, DOC_ID);
}

// { seats: { <className>: [studentId, ...] } }  — never throws
export async function loadGameData() {
  try {
    const ref = await docRef();
    if (!ref) return { seats: {} };
    const { getDoc } = await fs();
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() || {}) : {};
    return { seats: (data.seats && typeof data.seats === "object") ? data.seats : {} };
  } catch { return { seats: {} }; }
}

// Fire-and-forget: the game already shows the new order, a failed write only
// means the next session starts from the previous seating.
export async function saveSeats(className, order) {
  try {
    const ref = await docRef();
    if (!ref || !className) return;
    const { setDoc } = await fs();
    await setDoc(ref, { id: DOC_ID, kind: "werewolf", seats: { [className]: order.map(String) } }, { merge: true });
  } catch { /* offline / denied */ }
}

// ---------------------------------------------------------------- music (IndexedDB)
const IDB = "aword-werewolf-music", STORE = "tracks";
function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no indexedDB"));
    const req = indexedDB.open(IDB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function tx(mode, fn) {
  return openDb().then(dbh => new Promise((resolve, reject) => {
    const t = dbh.transaction(STORE, mode), st = t.objectStore(STORE);
    const out = fn(st);
    t.oncomplete = () => { dbh.close(); resolve(out && out.result !== undefined ? out.result : out); };
    t.onerror = () => { dbh.close(); reject(t.error); };
  }));
}
// [{id, name, blob, addedAt}] oldest first — never throws
export async function listTracks() {
  try { const all = await tx("readonly", st => st.getAll()); return (all || []).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)); }
  catch { return []; }
}
export async function addTrack(file) {
  const rec = { id: "wwm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: String(file.name || "Track").replace(/\.[^.]+$/, ""), blob: file, addedAt: Date.now() };
  await tx("readwrite", st => st.put(rec));
  return rec;
}
export async function removeTrack(id) {
  try { await tx("readwrite", st => st.delete(id)); } catch { /* ignore */ }
}
