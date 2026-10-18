// =============================================================
// TRAIN RUSH — KÊNH BẮT TAY iPAD QUA FIRESTORE (Đợt 515, thầy 14/10/2026: Fight 1 màn "điều khiển bằng iPad như ROCKET RACE").
//
// CHÉP khuôn templates/rocket-race/rr-pad-signal.js (Đợt 511 — thầy đã thử iPad thật): lệnh (iPad chạm quả ⇒ "pop:<số>") + trạng thái
// (bố cục tàu, vị trí khinh khí cầu) đi WebRTC DataChannel (./3d/tr-padlink-1ax.js — Đợt 550, chép từ myGame, đừng sửa tay); kho chỉ để 2 máy
// tìm thấy nhau + đường dự phòng. Ở `users/{uid}/items` của thầy — không luật mới. Ba tài liệu, MỖI CÁI ĐÚNG MỘT NGƯỜI GHI:
//     trpad_host — máy chiếu ghi (sid, offer, c0/c1 = đội đang có iPad) · trpad_pad0 / trpad_pad1 — iPad đội đó ghi
// ⚠️ kind "trainrush-pad" PHẢI có trong APP_DATA_KINDS (core/store.js), không thì ăn mất số link ?a=.
// Bàn thử `?padsig=local` (cả trang game lẫn pad.html) ⇒ kênh cục bộ 2 tab cùng trình duyệt, không đăng nhập.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";
import { localSignal } from "./3d/tr-padlink-1ax.js";

export const TR_PAD_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";
export const TR_PAD_KIND = "trainrush-pad";
const DOC = { host: "trpad_host", pad0: "trpad_pad0", pad1: "trpad_pad1" };
const envelope = id => ({ id, kind: TR_PAD_KIND, root: "showdown", parentId: null, trashed: false });

async function uidOrThrow() {
  const user = await currentUser();
  if (!user) { const e = new Error("Sign in to AWord to link an iPad."); e.code = "aw/signed-out"; throw e; }
  return user.uid;
}

export function trPadSignal() {
  if (TR_PAD_LOCAL) return localSignal("trpad");
  return {
    async write(name, patch) {
      const id = DOC[name]; if (!id) throw new Error("bad pad doc " + name);
      const uid = await uidOrThrow();
      const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
      await setDoc(doc(d, `users/${uid}/items`, id), { ...envelope(id), ...patch }, { merge: true });
    },
    // cb(data | null). Đọc lỗi ⇒ cb(null) một lần (coi như "chưa có game"), không im lặng giả vờ còn nối.
    listen(name, cb) {
      let stop = null, dead = false;
      (async () => {
        try {
          const id = DOC[name]; const uid = await uidOrThrow();
          const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
          if (dead) return;
          stop = onSnapshot(doc(d, `users/${uid}/items`, id),
            snap => { if (!dead) cb(snap.exists() ? snap.data() : null); },
            err => { console.warn("Train Rush pad signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("Train Rush pad signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
    },
  };
}
