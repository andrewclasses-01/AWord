// =============================================================
// core/lam-tiep.js — ⭐⭐ Đợt 469 (thầy chốt 05/10/2026) — GIỮ LƯỢT DỞ, MỞ LẠI LÀM TIẾP
// =============================================================
// Đợt 468 bỏ ☰ (Start again) của em chưa đạt 100% ⇒ đường bỏ dở còn lại là TẢI LẠI TRANG / đóng tab.
// Thầy chọn cách mạnh nhất: lượt đang làm được NHỚ trên máy em; mở lại bài giao đó là làm TIẾP đúng
// câu đang dở (thứ tự câu, câu đã trả lời, điểm, mạng… y nguyên), và ĐỒNG HỒ TÍNH THEO GIỜ THẬT từ lúc
// bắt đầu lượt (đóng tab để nghĩ không được lợi gì).
//
// Ai ghi: play.js (trang học sinh) — engine đưa "trạng thái ván" của template qua `session.luuLamTiep`.
// Template nào biết lưu/khôi phục thì khai `ui.setLuuTrangThai(fn)` + đọc `ui.khoiPhuc` lúc mount
// (Quiz · Type the answer · Find the gap — 90% số lượt bài giao). Template khác: như cũ (tải lại = bỏ dở).
//
// ⛔⛔ MỘT LƯỢT = MỘT DÒNG ĐIỂM: lượt đang được giữ KHÔNG nộp dở lúc tải lại (play.js pagehide) và nháp của nó
// (mang `nhapId`) KHÔNG bị `sweepDrafts` (core/assignments.js) đẩy đi. Làm tiếp tới đích ⇒ nộp lượt hoàn chỉnh như
// thường + bỏ nháp; làm tiếp rồi Start again ⇒ nộp dở bằng ĐÚNG `nhapId` cũ. Hết hạn giữ (HAN_MS không đụng tới) hoặc
// đề đổi ⇒ thôi giữ, nháp được nộp dở như trước Đợt 469 — lượt bỏ hẳn vẫn hiện BỎ DỞ cho thầy.
//
// Hai kho localStorage:
//   aword-lam-tiep       { "<code>|<ma>": lượt }   — ghi khi trả lời xong một câu / tab ẩn / tải lại
//   aword-lam-tiep-song  { "<code>|<ma>": {tab, t} } — nhịp 2 s của tab ĐANG làm lượt đó: tab thứ hai mở
//                         cùng bài trong lúc tab kia còn sống thì KHÔNG làm tiếp (hai tab cùng một mã
//                         lượt là nộp hỏng) mà chơi lượt mới như thường.
// =============================================================

const KHOA = "aword-lam-tiep";
const KHOA_SONG = "aword-lam-tiep-song";
export const HAN_MS = 7 * 24 * 3600 * 1000;   // 7 ngày không đụng tới ⇒ bỏ lượt (nháp nộp dở như cũ)
const SONG_MS = 6000;
const TAB = Math.random().toString(36).slice(2, 10);

function doc(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
function ghi(k, m) { try { localStorage.setItem(k, JSON.stringify(m)); return true; } catch (e) { return false; } }
export const khoaLuot = (code, ma, ten) => String(code) + "|" + (ma ? String(ma) : "ten:" + String(ten || "").trim().toLowerCase());

// Lượt đang giữ của em ở bài này (null nếu không có / hết hạn).
export function docLuot(k) {
  const m = doc(KHOA), s = m[k];
  if (!s) return null;
  if (!(Date.now() - (s.luc || 0) < HAN_MS)) { delete m[k]; ghi(KHOA, m); return null; }
  return s;
}
export function ghiLuot(k, s) {
  const m = doc(KHOA);
  m[k] = Object.assign({}, s, { luc: Date.now() });
  // Dọn lượt hết hạn của bài khác luôn thể (kho không phình mãi).
  Object.keys(m).forEach(x => { if (!(Date.now() - (m[x].luc || 0) < HAN_MS)) delete m[x]; });
  return ghi(KHOA, m);
}
export function xoaLuot(k) {
  const m = doc(KHOA);
  if (m[k]) { delete m[k]; ghi(KHOA, m); }
  nhipSong(k, false);
}
// Mã lượt (`nhapId`) của mọi lượt còn được giữ — sweepDrafts không được nộp dở các lượt này.
export function maLuotDangGiu() {
  const m = doc(KHOA), t = Date.now(), out = new Set();
  Object.values(m).forEach(s => { if (s && s.nhapId && t - (s.luc || 0) < HAN_MS) out.add(s.nhapId); });
  return out;
}

// Nhịp sống của tab đang làm lượt `k` (bat=false: tab rời đi — tải lại là làm tiếp được NGAY).
export function nhipSong(k, bat = true) {
  const m = doc(KHOA_SONG);
  if (bat) m[k] = { tab: TAB, t: Date.now() };
  else if (m[k] && m[k].tab === TAB) delete m[k];
  else return;
  Object.keys(m).forEach(x => { if (Date.now() - (m[x].t || 0) > SONG_MS * 10) delete m[x]; });
  ghi(KHOA_SONG, m);
}
// Một tab KHÁC đang làm lượt này?
export function tabKhacDangLam(k) {
  const s = doc(KHOA_SONG)[k];
  return !!(s && s.tab !== TAB && Date.now() - (s.t || 0) < SONG_MS);
}

// Dấu vết của đề: thầy sửa act / đổi Options sau khi em làm dở ⇒ lượt cũ không khôi phục được nữa.
export function dauVet(activity) {
  let str = "";
  try { str = JSON.stringify([activity.type, activity.content, activity.options]); } catch (e) { str = String(Math.random()); }
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return activity.type + ":" + (h >>> 0).toString(36) + ":" + str.length;
}

// Template dùng: lượt khôi phục có khớp đề đang dựng không (độ dài + từng phần tử là chỉ số hợp lệ, không trùng).
export function thuTuHopLe(thuTu, n) {
  if (!Array.isArray(thuTu) || thuTu.length !== n) return false;
  const thay = new Set();
  return thuTu.every(i => Number.isInteger(i) && i >= 0 && i < n && !thay.has(i) && thay.add(i));
}
