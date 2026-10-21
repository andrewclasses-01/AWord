// =============================================================
// RACING WORDS — KÊNH BẮT TAY cho TRANG THỬ ẨN (Đợt 562, 21/10/2026 — XE BAY ROADSTER myGame 5j; dựng lại theo Đợt 552).
// Y hệt rw-pad-signal.js nhưng TÀI LIỆU RIÊNG (rwlab_*) ⇒ trang thử không đụng phiên iPad của game thật. Cùng kind "racingwords-pad".
// Chỉ lab/racing-xebay.html + lab/racing-xebay-pad.html dùng.
// =============================================================
import { db, fs, currentUser } from "../../core/firebase.js";
const KIND = "racingwords-pad";
const DOC = { host: "rwlab_host", pad0: "rwlab_pad0", pad1: "rwlab_pad1", pad2: "rwlab_pad2", pad3: "rwlab_pad3" };
const envelope = id => ({ id, kind: KIND, root: "showdown", parentId: null, trashed: false });
async function uidOrThrow() {
  const user = await currentUser();
  if (!user) { const e = new Error("Sign in to AWord first."); e.code = "aw/signed-out"; throw e; }
  return user.uid;
}
export function labSignal() {
  return {
    async write(name, patch) {
      const id = DOC[name]; if (!id) throw new Error("bad pad doc " + name);
      const uid = await uidOrThrow();
      const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
      await setDoc(doc(d, `users/${uid}/items`, id), { ...envelope(id), ...patch }, { merge: true });
    },
    listen(name, cb) {
      let stop = null, dead = false;
      (async () => {
        try {
          const id = DOC[name]; const uid = await uidOrThrow();
          const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
          if (dead) return;
          stop = onSnapshot(doc(d, `users/${uid}/items`, id), snap => { if (!dead) cb(snap.exists() ? snap.data() : null); },
            err => { console.warn("RW lab signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("RW lab signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* */ } } };
    },
  };
}
export const labPadUrl = t => `${location.origin}/lab/racing-xebay-pad.html?t=${t}`;
