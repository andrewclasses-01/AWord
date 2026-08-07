// =============================================================
// Tiện ích chung dùng lại nhiều nơi.
// =============================================================

// Xáo trộn 1 mảng (thuật toán Fisher–Yates) — trả về mảng MỚI, không đổi mảng gốc.
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Đổi số giây thành dạng phút:giây (vd 74 -> "1:14")
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Tạo nhanh 1 thẻ HTML với class + nội dung
export function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

// Số thứ hạng tiếng Anh: 1 -> "1ST", 2 -> "2ND", 3 -> "3RD", 11 -> "11TH"...
export function ordinal(n) {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return n + "TH";
  const m = n % 10;
  return n + (m === 1 ? "ST" : m === 2 ? "ND" : m === 3 ? "RD" : "TH");
}

// Đổi mili-giây thành 2 phần hiển thị: phần TO "2:15." + phần nhỏ "1s"
// (ghép lại = "2:15.1s").
//
// Thầy chốt 7/8/2026: thời gian LUÔN ở dạng phút:giây, kể cả dưới 1 phút
// ("0:45.3s") — trước đây hàm này trả về tổng số giây thô ("135.4s"), đọc lâu
// mới ra là 2 phút 15 giây. Giây luôn 2 chữ số, phần lẻ 1 chữ số, vẫn CẮT chứ
// không làm tròn (một lượt 45,39s vẫn đọc là 45.3, không nhảy lên 45.4).
//
// ⚠️ Tính TOÀN BỘ bằng SỐ NGUYÊN mili-giây. Bản cũ đổi sang giây thực rồi lấy
// `Math.floor((s - whole) * 10)` — sai một chữ số ở rất nhiều mốc vì số thực
// không giữ đúng phần lẻ: 45300ms ra `(45.3 − 45) × 10 = 2,9999…` → cắt thành
// **2**, hiện "45.2s" thay vì "45.3s" (đo thật 7/8/2026, lỗi có từ trước).
export function fmtSecsParts(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0));
  const tenth = Math.floor(total / 100) % 10;
  const whole = Math.floor(total / 1000);
  const m = Math.floor(whole / 60);
  const sec = whole % 60;
  return { big: `${m}:${String(sec).padStart(2, "0")}.`, small: `${tenth}s` };
}

// Chép chữ vào clipboard, trả về true nếu chép được.
//
// BẪY (gặp thật 20/7/2026): navigator.clipboard.writeText() KHÔNG báo lỗi khi
// cửa sổ không được focus — nó treo lời hứa VÔ HẠN, nên chỗ gọi "await" mãi
// không chạy tiếp và người dùng không thấy thông báo nào. Vì vậy phải đặt hạn
// giờ, hết giờ thì quay về cách cũ (textarea + execCommand).
export async function copyText(text) {
  const viaClipboard = async () => {
    if (!navigator.clipboard || !window.isSecureContext) return false;
    const timeout = new Promise(resolve => setTimeout(() => resolve("timeout"), 1200));
    const result = await Promise.race([navigator.clipboard.writeText(text).then(() => "ok"), timeout]);
    return result === "ok";
  };
  try { if (await viaClipboard()) return true; } catch (e) { /* fall back below */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
    document.body.append(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}
