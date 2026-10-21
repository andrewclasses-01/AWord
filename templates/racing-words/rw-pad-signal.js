// =============================================================
// RACING WORDS — KÊNH BẮT TAY iPAD QUA FIRESTORE (Đợt 527, thầy 15/10/2026 — "iPad thật làm luôn").
// Y hệt STAR LOOT (sl-pad-signal.js, Đợt 480): lái / câu hỏi đi thẳng iPad ↔ máy chiếu bằng WebRTC (./3d/sr3d-padlink-3e.js, chép myGame);
// file này chỉ là `signal` để hai máy tìm nhau + đường dự phòng. Ba tài liệu, MỖI CÁI MỘT NGƯỜI GHI:
//     rwpad_host — máy chiếu · rwpad_pad0 — iPad TEAM 1 · rwpad_pad1 — iPad TEAM 2 · rwpad_pad2 — iPad DRONE (⭐ Đợt 553)
// ⚠️ kind "racingwords-pad" PHẢI có trong APP_DATA_KINDS (core/store.js).
// =============================================================
import { db, fs, currentUser } from "../../core/firebase.js";
import { localSignal } from "./3d/sr3d-padlink-5j.js";   // ⭐ Đợt 570: 5j (+ phím fly)   // ⭐ Đợt 554: 5e (4 chỗ)   // ⭐ Đợt 553: 5a (3 chỗ) · Đợt 538: 4f · Đợt 534: 3y (khoá c/r mới)

export const PAD_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";   // bàn thử: kênh cục bộ 2 tab
export const PAD_KIND = "racingwords-pad";
const DOC = { host: "rwpad_host", pad0: "rwpad_pad0", pad1: "rwpad_pad1", pad2: "rwpad_pad2", pad3: "rwpad_pad3" };   // Đợt 554: + pad3 = DRONE 2   // Đợt 553: + pad2 = DRONE
const envelope = id => ({ id, kind: PAD_KIND, root: "showdown", parentId: null, trashed: false });

async function uidOrThrow() {
  const user = await currentUser();
  if (!user) { const e = new Error("Sign in to AWord to link an iPad."); e.code = "aw/signed-out"; throw e; }
  return user.uid;
}

export function rwPadSignal() {
  if (PAD_LOCAL) return localSignal("awrwpad");
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
          stop = onSnapshot(doc(d, `users/${uid}/items`, id),
            snap => { if (!dead) cb(snap.exists() ? snap.data() : null); },
            err => { console.warn("RACING WORDS pad signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("RACING WORDS pad signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
    },
  };
}

// trang iPad = pad.html của AWord (tự đổi màn theo ipad_now); iPad không mở được localhost ⇒ luôn bản LIVE, ?padorigin=… để thử bản khác
export function padUrl(team) {
  const o = new URLSearchParams(location.search).get("padorigin")
    || (/andrewclasses\.com$/.test(location.hostname) ? location.origin : "https://aword.andrewclasses.com");
  const t = team === 3 ? 3 : team === 2 ? 2 : team ? 1 : 0;   // Đợt 553: t=2 = iPad DRONE · Đợt 554: t=3 = iPad DRONE 2
  if (PAD_LOCAL) return `${location.origin}/pad.html?t=${t}&padsig=local`;
  return `${o.replace(/\/$/, "")}/pad.html?t=${t}`;
}
