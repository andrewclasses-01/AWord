// =============================================================
// ROCKET RACE — KÊNH BẮT TAY iPAD "GAME CONTROLLER" QUA FIRESTORE (Đợt 511, thầy 13/10/2026).
//
// Thầy: "bấm vào nút ipad ở game sẽ hiện tùy chọn, làm nơi đọc câu hỏi hay tham gia game · tham gia game thì sẽ chuyển toàn bộ phần bắn
// tên lửa và tránh vào ipad" · "không muốn quét QR — bấm nút iPad trên trang chủ AWord là mở ra chọn team luôn; tất cả cùng đăng nhập kho
// AWord (Firebase) như nhau từ đầu". Thiết kế + thử ở myGame mẫu 9 (4755fe1).
//
// Khuôn y STAR LOOT `templates/maze-chase/sl-pad-signal.js` (Đợt 480 — thầy đã thử iPad thật): lệnh + trạng thái đi WebRTC DataChannel
// (./rr-padlink.js); kho chỉ để 2 máy tìm thấy nhau + đường dự phòng (Wi-Fi chặn nối thẳng ⇒ lệnh vẫn đi, trạng thái thì không).
// Ở `users/{uid}/items` của thầy — không luật mới, không mã phòng công khai. Ba tài liệu, MỖI CÁI ĐÚNG MỘT NGƯỜI GHI:
//     rrpad_host — máy chiếu ghi (sid, offer, c0/c1 = đội đang có iPad) · rrpad_pad0 / rrpad_pad1 — iPad đội đó ghi
// ⚠️ kind "rocketrace-pad" PHẢI có trong APP_DATA_KINDS (core/store.js), không thì ăn mất số link ?a=.
// Bàn thử `?padsig=local` (cả trang game lẫn pad.html) ⇒ kênh cục bộ 2 tab cùng trình duyệt, không đăng nhập.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";
import { localSignal } from "./rr-padlink.js";

export const RR_PAD_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";
export const RR_PAD_KIND = "rocketrace-pad";
const DOC = { host: "rrpad_host", pad0: "rrpad_pad0", pad1: "rrpad_pad1" };
const envelope = id => ({ id, kind: RR_PAD_KIND, root: "showdown", parentId: null, trashed: false });

async function uidOrThrow() {
  const user = await currentUser();
  if (!user) { const e = new Error("Sign in to AWord to link an iPad."); e.code = "aw/signed-out"; throw e; }
  return user.uid;
}

export function rrPadSignal() {
  if (RR_PAD_LOCAL) return localSignal("rrpad");
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
            err => { console.warn("Rocket Race pad signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("Rocket Race pad signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
    },
  };
}
