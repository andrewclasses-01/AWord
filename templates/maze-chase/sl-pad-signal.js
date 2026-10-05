// =============================================================
// STAR LOOT — KÊNH BẮT TAY iPAD QUA FIRESTORE (Đợt 480, thầy 05/10/2026).
//
// Thầy: "màn 86 inch quá khổng lồ, học sinh đứng sát màn không nhìn được toàn cảnh… điều khiển bằng iPad (2 iPad trong
// Fight), iPad chỉ mở D-pad, tín hiệu 1 chiều lên game". Chốt: WebRTC · giữ D-pad trên màn dự phòng · cả Single lẫn Fight.
//
// Phím bấm KHÔNG đi qua đây — chúng đi thẳng iPad → máy chiếu bằng WebRTC DataChannel (./3d/mc3d-padlink-2q.js, chép từ
// myGame). File này chỉ là cái `signal` mà đường nối cần để hai máy tìm thấy nhau (đổi offer/answer, 2–3 lượt ghi mỗi lần
// nối) + ĐƯỜNG DỰ PHÒNG (Wi-Fi chặn nối thẳng ⇒ iPad ghi phím vào kho, chậm hơn).
//
// Ở ĐÂU: `users/{uid}/items` — đúng một đường luật Firestore đã mở cho dữ liệu của thầy; cả máy chiếu lẫn iPad đăng nhập
// tài khoản thầy (như iPad câu hỏi Rocket Race, Đợt 368) ⇒ KHÔNG phải đăng luật mới, không phải bịa mã phòng công khai.
// Ba tài liệu, MỖI CÁI ĐÚNG MỘT NGƯỜI GHI (luật lõi: nhiều bên ghi ⇒ transaction — né bằng cách tách):
//     slpad_host  — máy chiếu ghi · slpad_pad0 — iPad đội A ghi · slpad_pad1 — iPad đội B ghi
// ⚠️ kind "starloot-pad" PHẢI có trong APP_DATA_KINDS (core/store.js), không thì ăn mất số link ?a=.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";
import { localSignal } from "./3d/mc3d-padlink-2q.js";

// Bàn thử: `?padsig=local` (trên CẢ trang game lẫn pad.html) ⇒ kênh cục bộ 2 tab cùng trình duyệt, không cần đăng nhập.
export const PAD_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";

export const PAD_KIND = "starloot-pad";
const DOC = { host: "slpad_host", pad0: "slpad_pad0", pad1: "slpad_pad1" };
// 5 trường mọi tài liệu trong users/{uid}/items mang; root:"showdown" ⇒ không lọt vào danh sách thư viện (như rr-link.js)
const envelope = id => ({ id, kind: PAD_KIND, root: "showdown", parentId: null, trashed: false });

async function uidOrThrow() {
  const user = await currentUser();
  if (!user) { const e = new Error("Sign in to AWord to link an iPad."); e.code = "aw/signed-out"; throw e; }
  return user.uid;
}

export function firestoreSignal() {
  if (PAD_LOCAL) return localSignal("awpad");
  return {
    async write(name, patch) {
      const id = DOC[name]; if (!id) throw new Error("bad pad doc " + name);
      const uid = await uidOrThrow();
      const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
      await setDoc(doc(d, `users/${uid}/items`, id), { ...envelope(id), ...patch }, { merge: true });
    },
    // cb(data | null). Đọc lỗi ⇒ cb(null) một lần (đường nối coi như "chưa có game"), không im lặng giả vờ còn nối.
    listen(name, cb) {
      let stop = null, dead = false;
      (async () => {
        try {
          const id = DOC[name]; const uid = await uidOrThrow();
          const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
          if (dead) return;
          stop = onSnapshot(doc(d, `users/${uid}/items`, id),
            snap => { if (!dead) cb(snap.exists() ? snap.data() : null); },
            err => { console.warn("STAR LOOT pad signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("STAR LOOT pad signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
    },
  };
}

// Trang pad trên iPad: luôn là bản LIVE (iPad không mở được localhost của máy soạn). ?padorigin=… để thử bản khác.
export function padUrl(team) {
  const o = new URLSearchParams(location.search).get("padorigin")
    || (/andrewclasses\.com$/.test(location.hostname) ? location.origin : "https://aword.andrewclasses.com");
  if (PAD_LOCAL) return `${location.origin}/pad.html?t=${team ? 1 : 0}&padsig=local`;
  return `${o.replace(/\/$/, "")}/pad.html?t=${team ? 1 : 0}`;
}
