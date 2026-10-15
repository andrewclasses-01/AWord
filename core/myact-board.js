// =============================================================
// ⭐ Đợt 530 (thầy 15/10/2026): "các game 3D trên AWord chỉ được mở ở bảng 1, chặn các bảng khác để tối ưu hiệu năng".
//
// myActivity (v2.34.0) thêm token " myActivityCol/N" (N = bảng 1..5, trái ⇒ phải) vào User-Agent trang AWord của TỪNG bảng.
// Ở bảng 2..5 các game 3D (Rocket race Fight 3D · Train rush · Star loot · Racing words) KHÔNG dựng WebGL, không nạp xe / cảnh /
// shader — chỉ hiện khung báo `block3dMessage`. Lý do (đo Đợt 529): mỗi bảng là một trình duyệt riêng (kho riêng) ⇒ ở chế độ
// 2–5 bảng, bảng theo mở CÙNG game 3D ⇒ tải lại toàn bộ, dịch lại toàn bộ shader (tiến trình GPU dùng chung, dịch nối đuôi) và vẽ
// thêm cả cảnh mỗi khung ⇒ bảng 1 nạp chậm, khựng, rớt khung. Game 3D đã có sẵn 2 đội trong MỘT bảng nên bảng khác không cần.
// Ngoài myActivity (không có token) / bảng 1 ⇒ không đổi gì.
// =============================================================

export function myActBoard() {
  const m = /myActivityCol\/(\d+)/.exec((typeof navigator !== "undefined" && navigator.userAgent) || "");
  return m ? Number(m[1]) : 0;
}

// true = bảng này KHÔNG được chạy game 3D
export const block3dHere = () => myActBoard() > 1;

let cssDone = false;
function ensureCss() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement("style");
  s.textContent = `.aw-b3d{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:24px;text-align:center;
background:radial-gradient(120% 90% at 50% 40%,#16203a 0%,#070a12 70%);color:#e2e8f0;font-family:"Baloo 2",system-ui,sans-serif}
.aw-b3d b{display:block;font-size:clamp(20px,4.2vmin,44px);font-weight:800;letter-spacing:.02em;color:#fff}
.aw-b3d span{display:block;margin-top:.6em;font-size:clamp(13px,2.2vmin,22px);font-weight:600;color:#94a3b8}
.aw-b3d i{display:inline-grid;place-items:center;width:1.9em;height:1.9em;margin-bottom:.5em;border-radius:50%;font-style:normal;
font-size:clamp(22px,5vmin,52px);font-weight:800;color:#0b1220;background:#60a5fa;box-shadow:0 0 0 .18em rgba(96,165,250,.25)}`;
  document.head.append(s);
}

// Khung báo phủ `root` (root nên có position khác static — hàm tự đặt relative nếu đang static). Trả hàm gỡ.
export function block3dMessage(root, name = "This 3D game") {
  ensureCss();
  if (root && getComputedStyle(root).position === "static") root.style.position = "relative";
  if (root && !root.style.minHeight) root.style.minHeight = "60vh";
  const d = document.createElement("div");
  d.className = "aw-b3d";
  d.innerHTML = `<div><i>1</i><b></b><span>Other boards stay off so board 1 runs smoothly.</span></div>`;
  d.querySelector("b").textContent = `${name} plays on board 1`;
  root.append(d);
  console.log("MYACT:3D:BLOCKED");
  return () => d.remove();
}
