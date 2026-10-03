// =============================================================
// AVATAR HỌC SINH — Đợt 448 (3/10/2026, thầy chốt mẫu "bóng avatar" của Podium)
//
// Ảnh đại diện của em CHỈ CÓ MỘT NGUỒN: kho web myLesson
//   https://andrewclasses.com/assets/avatar/<slug TÊN GỐC lớp>/<slug tên em>.jpg
// (thầy đổi ở dashboard → Thiết lập lớp, app myLesson nén 96px rồi đẩy lên). AWord chỉ ĐỌC.
//
// ⛔ LUẬT SLUG PHẢI Y HỆT myLesson (`avSlugLop`/`avSlugTen` trong myLesson Web `js/chung.js`,
//    cùng 4 nơi khác ghi ở đó) — sai một ký tự là ảnh 404 câm lặng:
//      bỏ dấu (đ→d) · LỚP bỏ mọi ký tự không phải chữ-số ("NEN TANG 4" → "nentang4")
//      · TÊN thay cụm ký tự lạ bằng "-" ("QUANG TÙNG" → "quang-tung").
//
// ⚠️ MÃ LỚP ≠ TÊN GỐC: AWord đi khắp nơi bằng mã lớp (`maLop`, "NNTNG4"), còn thư mục ảnh đặt
//    theo TÊN GỐC (`tenGoc`, "NEN TANG 4"). Bảng đổi lấy từ `lessonWeb/lop` qua
//    core/lop-dashboard.js — nạp LƯỜI bằng dynamic import, để file này (và
//    core/showdown-review.js, file được engine import TĨNH) vẫn sạch Firestore như luật 2.
//    Chưa có bảng ⇒ ô avatar hiện chữ tắt trước, bảng về thì gắn ảnh vào sau.
//
// Ảnh thiếu / em đặc biệt không có ảnh ⇒ thẻ <img> tự gỡ mình (onerror) ⇒ còn chữ tắt trên
// nền màu suy từ tên — y hệt cách myLesson `gaAvatar()` lùi.
// =============================================================

const BASE = "https://andrewclasses.com/assets/avatar/";

const labels = new Map();          // mã lớp chuẩn hoá → tên gốc
let loadP = null;
let loadFailed = false;

const normMa = s => String(s || "").replace(/\s+/g, "").toUpperCase();
function khongDau(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}
export function slugLop(s) { return khongDau(s).replace(/[^a-z0-9]/g, "") || "lop"; }
export function slugTen(s) { return khongDau(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "hs"; }

/** Ghi nhớ mã lớp → tên gốc (gọi được từ bất cứ ai vừa đọc danh sách lớp). */
export function rememberClassLabel(maLop, label) {
  if (!maLop || !label) return;
  labels.set(normMa(maLop), String(label));
  labels.set(normMa(label), String(label));
}

/** Nạp bảng mã lớp → tên gốc MỘT LẦN mỗi trang (lop-dashboard.js tự đệm lượt đọc). */
export function loadClassLabels() {
  if (!loadP) {
    loadP = import("./lop-dashboard.js")
      .then(m => m.dsLopDashboard())
      .then(({ lop }) => { (lop || []).forEach(c => rememberClassLabel(c.maLop, c.ten)); })
      .catch(e => {
        // Không đọc được (mất mạng, trang không có Firebase…) ⇒ lùi về chính mã lớp làm slug.
        console.warn("AWord: avatar class labels unavailable", e);
        loadFailed = true;
      });
  }
  return loadP;
}

function labelKnown(className) { return labels.has(normMa(className)); }

/** URL ảnh của một em, "" khi chưa đủ thông tin. */
export function avatarUrl(className, name) {
  if (!className || !String(name || "").trim()) return "";
  const lab = labels.get(normMa(className)) || (loadFailed ? className : "");
  if (!lab) return "";
  return BASE + slugLop(lab) + "/" + slugTen(name) + ".jpg";
}

/** Chữ tắt: chữ đầu của từ ĐẦU + từ CUỐI ("QUANG TÙNG" → "QT", "N.B.AN" → "NA"). */
export function avatarInitials(name) {
  const w = String(name || "").replace(/\./g, " ").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

function avatarBg(name) {
  let h = 0;
  for (const ch of String(name || "")) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 40) % 360} 68% 48%))`;
}

function attachImg(node, url) {
  if (!url || node.querySelector("img")) return;
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  img.decoding = "async";
  img.onerror = () => img.remove();
  img.src = url;
  node.append(img);
}

/**
 * Một ô avatar tròn: chữ tắt trên nền màu, ảnh phủ lên khi có.
 * ⚠️ Tên em đi vào bằng textContent — đây là chữ của học sinh.
 */
export function avatarNode(className, name, cls = "aw-av") {
  const node = document.createElement("span");
  node.className = cls;
  node.textContent = avatarInitials(name);
  node.style.setProperty("--av-bg", avatarBg(name));
  const url = avatarUrl(className, name);
  if (url) attachImg(node, url);
  else if (className && !labelKnown(className) && !loadFailed) {
    loadClassLabels().then(() => attachImg(node, avatarUrl(className, name)));
  }
  return node;
}
