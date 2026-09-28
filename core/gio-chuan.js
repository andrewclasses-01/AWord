// ⭐⭐ Đợt 422 (28/09/2026, thầy chốt) — GIỜ CHUẨN: mốc giờ ghi lên kho KHÔNG phụ thuộc đồng hồ máy học sinh.
//
// Ca thật: máy của THANH PHƯƠNG (A1A) chạy CHẬM đúng 1 ngày 3 phút ⇒ mọi `createdAt` em ghi (scores · results ·
// practiceLog) lùi một ngày, dashboard myLesson vẽ bài 28/9 thành 27/9. Máy chủ Firestore ghi `createTime` đúng — so
// hai giờ trên cả kho (521 cặp em-lớp từ 14/9) chỉ em này lệch cả ngày; vài máy lệch vài phút (TRÍ CÔNG nhanh 25 phút).
//
// Cách làm: đo độ lệch MỘT lần mỗi lần mở trang bằng header `Date` của chính máy chủ AWord (HEAD cùng miền, chặn
// cache) rồi `gioChuan()` = Date.now() + lệch. Header `Date` chỉ chính xác tới giây ⇒ lệch dưới NGUONG_MS coi như 0:
// máy đúng giờ chạy y hệt đời cũ (mã lượt `hw<ms>` và `createdAt` của practiceLog vẫn khớp nhau từng mili-giây).
// Lần đo trước cất localStorage ⇒ trang mở ra đã có lệch ngay, không chờ mạng; đo xong thì thay bằng số mới.
//
// ⛔ CHỈ dùng cho MỐC GIỜ TUYỆT ĐỐI (ghi lên kho, so với hạn nộp). ĐỪNG dùng để đo THỜI LƯỢNG (timeMs, activeMs,
// nhịp, hạn sống nháp…): lệch có thể được áp vào GIỮA chừng (lần đầu đo) ⇒ hiệu hai mốc nhảy cả ngày.
const NGUONG_MS = 2 * 60 * 1000;
const KHOA = "lech-dong-ho";   // ⛔ cùng tên với bản chép myLesson web js/chung.js (khác miền ⇒ khác kho)
let lech = 0;
try {
  const c = Number(localStorage.getItem(KHOA));
  if (Number.isFinite(c) && Math.abs(c) >= NGUONG_MS) lech = c;
} catch (e) { /* chế độ riêng tư: bắt đầu từ 0, chờ đo */ }

export function gioChuan() { return Date.now() + lech; }
export function lechDongHo() { return lech; }

let _dangDo = null;
export function doLechDongHo() {
  if (_dangDo) return _dangDo;
  _dangDo = (async () => {
    for (let lan = 0; lan < 3; lan++) {
      if (lan) await new Promise(r => setTimeout(r, 1500 * lan));
      try {
        const t0 = Date.now();
        const r = await fetch(import.meta.url.split("?")[0] + "?dh=" + t0, { method: "HEAD", cache: "no-store" });
        const t1 = Date.now();
        const may = Date.parse(r.headers.get("date") || "");
        if (!Number.isFinite(may) || t1 - t0 > 10000) continue;   // không có header / mạng quá chậm để tin
        // Header cắt xuống giây ⇒ giờ thật nằm trong [may, may+1000) — lấy giữa; so với giữa lượt đi-về.
        const d = may + 500 - (t0 + t1) / 2;
        lech = Math.abs(d) >= NGUONG_MS ? Math.round(d) : 0;
        try { localStorage.setItem(KHOA, String(lech)); } catch (e) { /* không cất được: lần sau đo lại */ }
        return lech;
      } catch (e) { /* mất mạng: thử lại */ }
    }
    _dangDo = null;   // cho lần gọi sau (vd. có mạng lại) đo tiếp
    return lech;
  })();
  return _dangDo;
}
if (typeof window !== "undefined") {
  doLechDongHo();
  window.addEventListener("online", () => { doLechDongHo(); });
}
