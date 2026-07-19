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

// Đổi mili-giây thành 2 phần hiển thị kiểu Wordwall: "4." to + "9s" nhỏ
export function fmtSecsParts(ms) {
  const s = ms / 1000;
  const whole = Math.floor(s);
  const tenth = Math.floor((s - whole) * 10);
  return { big: `${whole}.`, small: `${tenth}s` };
}
