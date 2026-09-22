// =============================================================
// ROCKET RACE — TWO-DEVICE LINK (Đợt 368, thầy 22/9/2026).
//
// WHAT IT IS
//   A Fight match normally lives on ONE screen: the race on top, the question
//   line above two answer boards. Thầy asked for it to be split across two
//   devices in the classroom:
//     · MÁY CHƠI (the TOMKO panel) — race + both teams' answer tiles, NO
//       question. This is the device the class touches.
//     · MÁY NGUỒN (an iPad) — the questions ONLY, the screen halved, one half
//       per team ("các câu hỏi có thể giống hoặc khác nhau tùy mode").
//   This module is the wire between them. Nothing else in the game knows it
//   exists: the referee, the scoring and the race all still run on MÁY CHƠI
//   exactly as they do today.
//
// ⭐ WHY IT IS ONE-WAY
//   MÁY NGUỒN never plays, never scores, never decides a round — it is a second
//   SCREEN, not a second player. So there is no shared state to agree on and no
//   race to arbitrate: MÁY CHƠI writes what is on stage, MÁY NGUỒN draws it.
//   That is what keeps this cheap (≈ one write per question — a 20-question
//   match costs ~22 writes and ~22 reads) and what keeps it from ever being
//   able to corrupt a match.
//
// ⭐⭐ WHY TWO DOCUMENTS AND NOT ONE
//   `core/HUONG DAN CORE.md`: "Nhiều bên cùng ghi một tài liệu ⇒ GIAO DỊCH
//   (runTransaction)". Two documents, each with exactly ONE writer, sidesteps
//   that rule instead of paying for it — the same call `sd_session` makes
//   ("một người viết, KHÔNG transaction"):
//     · rr_link  — MÁY CHƠI writes, MÁY NGUỒN listens (what question is up)
//     · rr_view  — MÁY NGUỒN writes, MÁY CHƠI listens (the iPad is alive)
//   Neither device ever writes the other's document, so there is no contention
//   to resolve and no half-written state to normalise.
//
// ⭐⭐⭐ WHY `rr_view` EXISTS AT ALL (the "cả lớp đứng hình" guard)
//   Hiding the question on MÁY CHƠI is only safe while MÁY NGUỒN is actually
//   showing it. iPad asleep, wifi dropped, battery dead — and the question is
//   now on NO screen, in the middle of a lesson. So MÁY NGUỒN beats every
//   VIEWER_BEAT_MS, and MÁY CHƠI puts its own question line back the moment
//   that beat goes stale (see VIEWER_STALE_MS). `KE HOACH ROCKET-RACE.md`
//   already flagged this exact risk for chặng 3: "wifi lớp rớt 5 giây là tên
//   lửa đứng hình trước cả lớp (phải vẽ trạng thái mất sóng)".
//
// WHERE IT LIVES
//   `users/{uid}/items` — the ONE path the published Firestore rules open for
//   the teacher's own data. Both devices sign in as the teacher, so no new
//   rules had to be published and no public room code had to be invented. This
//   is the same reasoning `core/showdown-setup.js` writes out at length for
//   `sd_session`, and the same reason `core/classes.js` lives there too.
//   ⚠️ Both `kind`s below MUST also be listed in `APP_DATA_KINDS`
//   (core/store.js) or they eat a ?a= link number — that file says so itself.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";

const LINK_DOC = "rr_link";     // MÁY CHƠI → MÁY NGUỒN
const VIEW_DOC = "rr_view";     // MÁY NGUỒN → MÁY CHƠI

export const LINK_KIND = "rocketrace-link";
export const VIEW_KIND = "rocketrace-view";

// How often MÁY NGUỒN says "I am still showing this", and how long MÁY CHƠI
// waits before deciding it is not. The gap is deliberately wide (2 beats + a
// margin): a phone that misses ONE beat to a slow network has not gone away,
// and putting the question line back costs the class a visible re-layout.
export const VIEWER_BEAT_MS = 20000;
export const VIEWER_STALE_MS = 55000;

// The 5 fields every document in `users/{uid}/items` carries. `root:"showdown"`
// keeps it out of every library listing (they filter on `n.root === root`, and
// ROOTS never names an app-data root — core/store.js).
function envelope(id, kind) {
  return { id, kind, root: "showdown", parentId: null, trashed: false };
}

async function requireUid() {
  // Copied, deliberately, from core/showdown-setup.js — the project's rule is
  // that a template folder does not reach across into another module's privates.
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to link two devices.");
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

// A match's own id. MÁY NGUỒN throws away anything that is not the match it is
// currently showing, so a stale packet from a match that has already been
// restarted (Start again / Apply both rebuild the frame) can never paint over
// the new one.
export function mintMatchId() {
  return "rrm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ---- read side: tolerant, because a half-written or older-build document must
// never break the screen that is drawing it (core rule) ----
function normStage(raw) {
  // ⭐ Đợt 368d — the question NUMBER is per side, not one number for the match
  // (thầy, 22/9/2026: "hiển thị số câu của 2 bên cũng độc lập … mỗi cái hiện ở
  // 1 bên khung"). Even under the current referee — where both boards sit on the
  // same round — the two totals can genuinely differ (In turns deals 81 questions
  // as 41/40), so one shared "n / N" was already capable of lying.
  const side = i => ({
    text: String(raw?.["q" + i] ?? ""),
    voiceOnly: !!raw?.["vo" + i],
    num: Number(raw?.["qn" + i]) || 0,       // 1-based; 0 = not reported yet
    total: Number(raw?.["qt" + i]) || 0,
    team: {
      name: String(raw?.["t" + i + "name"] ?? ("TEAM " + (i + 1))),
      color: String(raw?.["t" + i + "color"] ?? "")
    }
  });
  return {
    matchId: String(raw?.matchId ?? ""),
    actTitle: String(raw?.actTitle ?? ""),
    phase: raw?.phase === "ready" || raw?.phase === "over" ? raw.phase : "playing",
    round: Number(raw?.round) || 0,
    same: !!raw?.same,
    clockMs: Number(raw?.clockMs) || 0,
    sides: [side(0), side(1)],
    at: Number(raw?.at) || 0
  };
}

/**
 * MÁY CHƠI: publish what is on stage right now.
 * ⚠️ FLAT FIELDS (q0/q1/t0name/…), not a nested object — same call `sd_session`
 * made and for the same reason: a patch that changes one thing writes one
 * field, and `merge:true` leaves the rest of the document alone. Firestore's
 * `update()` does NOT merge deeply (core rule), so a nested `sides:[…]` would
 * have to be rewritten whole on every question.
 */
export async function publishStage(patch) {
  const uid = await requireUid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, LINK_DOC),
    clean({ ...envelope(LINK_DOC, LINK_KIND), ...patch, at: Date.now() }),
    { merge: true });
}

/**
 * Thầy leaves two-device mode, or the match ends: drop the document so an iPad
 * opened later never reads a match that finished this morning. Same reasoning
 * as `clearSession()`.
 */
export async function clearStage() {
  const uid = await requireUid();
  const [d, { doc, deleteDoc }] = await Promise.all([db(), fs()]);
  await deleteDoc(doc(d, `users/${uid}/items`, LINK_DOC));
}

/**
 * MÁY NGUỒN listens. `onChange(null)` means there is no match being broadcast
 * (document deleted, or never written) — the caller draws its waiting screen.
 * `onError()` fires when the read itself failed: the caller must SAY SO on
 * screen rather than keep drawing a question that may be three rounds old
 * ("CẤM nhớ lại một lần đọc THẤT BẠI … phải NÓI RA", core rule).
 * Returns the unsubscribe function, same shape as `subscribeSession()`.
 */
export function subscribeStage(onChange, onError) {
  let stop = null, dead = false;
  (async () => {
    try {
      const uid = await requireUid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${uid}/items`, LINK_DOC),
        snap => { if (!dead) onChange(snap.exists() ? normStage(snap.data()) : null); },
        err => { if (!dead && onError) onError(err); });
    } catch (e) {
      if (!dead && onError) onError(e);
    }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch { /* already gone */ } } };
}

/** MÁY NGUỒN: "I am awake and showing round N of this match." */
export async function touchViewer(info = {}) {
  const uid = await requireUid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, VIEW_DOC),
    clean({ ...envelope(VIEW_DOC, VIEW_KIND),
            matchId: String(info.matchId || ""), round: Number(info.round) || 0,
            at: Date.now() }),
    { merge: true });
}

/**
 * MÁY CHƠI listens for the beat. The callback gets the raw age in ms — the
 * caller decides what counts as gone, because only it knows whether it is
 * currently relying on the other screen.
 */
export function subscribeViewer(onBeat) {
  let stop = null, dead = false;
  (async () => {
    try {
      const uid = await requireUid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${uid}/items`, VIEW_DOC),
        snap => { if (!dead) onBeat(snap.exists() ? (Number(snap.data()?.at) || 0) : 0); },
        () => { /* network/permission — the staleness clock alone decides */ });
    } catch { /* signed out: nothing to hear */ }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch { /* already gone */ } } };
}
