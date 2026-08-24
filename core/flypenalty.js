// =============================================================
// FLY PENALTY — "-N" BAY TỪ CHỖ SAI VÀO Ô ĐIỂM, TỚI NƠI MỚI TRỪ
// (Đợt 256, 24/8/2026 — thầy)
//
// Lời thầy: *"Khi có đội sai và bật trừ điểm sai trong mode Fight thì phải
// hiện số điểm trừ bay lên từ ô/chỗ sai bay vào ô điểm rồi mới trừ. Ví dụ
// như QUIZ trong khi Fight, khi có điểm sai thì không có gì bay lên cả mà số
// điểm tự trừ rất khó nhìn. Tôi cần cả các template có trừ điểm khác cũng
// vậy, tương tự các điểm sai từ các ô ANAGRAM bay ra đó"*.
//
// TRƯỚC ĐỢT NÀY: 11 template có trừ điểm, nhưng chỉ **Anagram** và **Type the
// answer** vẽ con số bay; 9 cái còn lại chỉ gọi `ui.setScore()` — con số trên
// bảng tự tụt, không ai nhìn kịp (Crossword/Unjumble có bay NGÔI SAO, không
// có số nên không nói được là trừ BAO NHIÊU).
//
// ⭐⭐ VÌ SAO NẰM Ở CORE (cùng lý lẽ với core/timecost.js, và đó là tiền lệ
// trực tiếp): Anagram sẵn có cả một bộ đồ nghề fly/pulse của riêng nó, còn
// Quiz thì KHÔNG CÓ GÌ — nó chỉ gọi `ui.setScore()`. Chép tay hiệu ứng này
// vào 9 template là 9 bản sao sẽ lệch nhau ngay lần chỉnh đầu tiên. Ở đây thì
// mỗi template opt-in bằng ĐÚNG MỘT DÒNG `ui.flyPenalty(...)`, và mọi luật
// khó (chỗ bay ra khi đang đấu, dọn xác lúc teardown, tab ẩn) chỉ có một chỗ.
//
// ⭐⭐⭐ HAI CHỖ BAY RA, VÀ ĐÓ LÀ LUẬT AN TOÀN CHỨ KHÔNG PHẢI TRANG TRÍ:
//   · SINGLE MODE  — bay ra từ ĐÚNG Ô SAI mà template đưa vào (`fromEl`).
//   · FIGHT MODE   — bay ra từ GIỮA KHUNG của bàn đó (thầy chốt 24/8/2026 sau
//     khi được hỏi thẳng). Bàn kia CÒN ĐANG LÀM: một số "-5" bay ra từ đúng ô
//     số 3 là nói với đội kia "ô 3 sai" — Quiz 4 lựa chọn bị loại một ô, và
//     **True/false 2 nút là lộ trọn đáp án**. Đó đúng là thứ luật "GIẤU ĐÁP ÁN
//     KHI VÒNG CÒN MỞ" (Đợt 129, core/HUONG DAN CORE.md) cấm.
//   ⛔⛔ Phép đổi chỗ bay ra đó nằm trong `core/engine.js` (xem `ui.flyPenalty`),
//   KHÔNG nằm trong template — cố ý: template chỉ nói "tôi sai ở ô này", còn
//   "trong trận thì được phép chỉ vào đâu" là câu hỏi của core. Để template tự
//   quyết là chờ ngày một template thứ 12 quên mất và hở bài trong im lặng.
//   ⭐ Anagram vốn đã vô tình đúng luật này từ Đợt 143: `flyLetterPenalty()` của
//   nó bay ra từ Ô ĐÁP ÁN ĐANG CHỜ (`.aw-anagram-rtile[data-pos=...]`) — cùng
//   một ô ở cả hai bàn — chứ không phải từ chữ cái bấm sai. Nên nó không lộ gì,
//   và nó là bằng chứng sống rằng "bay từ chỗ trung tính" vẫn đọc ra ngay.
//
// ⚠️⚠️ TỚI NƠI MỚI TRỪ — ĐÂY LÀ CẢ YÊU CẦU, KHÔNG PHẢI CHI TIẾT.
// `apply()` chỉ được gọi lúc con số HẠ CÁNH, và nó trả về tổng điểm MỚI. Nghĩa
// là template phải hoãn cả phép cộng dồn của nó lại (`penalty += pointsOff`
// nằm TRONG `apply`), chứ không phải trừ trước rồi vẽ một cái bay cho vui —
// làm thế thì đúng cái cảnh thầy đang tả: số tụt trước, hình bay sau.
// ⭐ NGƯỢC HẲN quy ước của `flyTimeCost`: điểm giờ chạy thì đếm lùi NGAY trong
// lúc bay (điểm đang RỜI KHỎI tổng); còn điểm phạt thì tổng đứng yên tới lúc
// con số cắm vào ô điểm. Hai nhịp khác nhau là cố ý, và đều là lời thầy.
//
// ⚠️ KHÔNG CÓ TIẾNG ĐỘNG NÀO Ở ĐÂY. Template đã kêu tiếng sai của chính nó
// ngay lúc bấm (quizSound.wrong()…); thêm một tiếng nữa lúc hạ cánh là hai
// tiếng cho một lỗi.
// =============================================================

import { el } from "./utils.js";

// Cùng nhịp với Anagram (PICKFLY_HOLD_MS / PICKFLY_FLIGHT_MS) để cả app chỉ có
// MỘT tốc độ bay. ⚠️ Tổng 920ms phải nằm gọn trong ROUND_HOLD_MS (2100ms) của
// core/fight.js: vòng đấu chỉ giữ màn hình chừng ấy sau khi chốt, con số bay
// lâu hơn sẽ hạ cánh xuống một câu đã bị thay mất.
const HOLD_MS = 320;      // đứng tại chỗ nở ra trước — cho cả lớp thấy nó RA TỪ ĐÂU
const FLIGHT_MS = 600;    // rồi mới bay vào ô điểm
const MIN_SIZE_PX = 42;   // thầy, Đợt 143: "nhỏ nhất cũng phải gần bằng size của 1 ô"

function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/**
 * Một lần trừ điểm: con số "-N" bay từ `fromEl` vào `toEl`, hạ cánh thì mới
 * thật sự trừ.
 *
 * @param {Element}  fromEl  chỗ con số bay RA — ô sai (single) hoặc giữa khung
 *                           (fight). core/engine.js đã chọn hộ, xem ui.flyPenalty.
 * @param {Element}  toEl    chỗ nó bay VÀO — ô điểm của bàn này (fight: con số
 *                           của đội trên dải trên).
 * @param {number}   points  trừ bao nhiêu điểm (> 0).
 * @param {Function} apply   () => áp dụng phép trừ VÀ trả về tổng điểm mới.
 *                           ⚠️ Gọi ĐÚNG MỘT LẦN, đúng lúc hạ cánh.
 * @param {Function} paint   v => ui.setScore(v) (hoặc painter riêng của template).
 * @param {Function} alive   () => ván này còn sống (chốt chặn teardown).
 * @param {Set}      nodes   các nút DOM đang bay, để teardown giữa chừng còn dọn.
 * @param {Set}      pending các hàm "hạ cánh ngay đi" đang chờ — ui.flushPenalties()
 *                           gọi hết chúng khi game kết thúc. ⚠️⚠️ ĐÂY LÀ THỨ GIỮ CHO
 *                           CÂU SAI CUỐI CÙNG KHÔNG BỊ MẤT ĐIỂM PHẠT: con số bay mất
 *                           920ms, mà nhiều template chốt sổ (`finish()`) chỉ sau
 *                           500-700ms ⇒ đọc điểm trước lúc nó hạ cánh là ghi vào kết
 *                           quả (và vào bài giao) một số điểm CAO HƠN thật. Trước Đợt
 *                           256 phép trừ là tức thì nên không có cửa này — thêm hoạt
 *                           ảnh là tự tay mở ra, nên phải tự tay bịt lại.
 *                           ⭐ Trong trận Fight thì KHÔNG cần: `ROUND_HOLD_MS` (2100ms,
 *                           core/fight.js) luôn dài hơn 920ms, nên mọi con số đã hạ
 *                           cánh xong từ lâu trước lúc `endMatch()` đọc bảng điểm.
 */
export function flyPenalty({ fromEl, toEl, points, apply, paint, alive, nodes, pending }) {
  if (!alive || !alive()) return;
  const n = Math.round(Number(points) || 0);
  // Cửa vào duy nhất, nên phải tự chặn "trừ 0 điểm": gọi apply() ở đây là ghi
  // một lần trừ rỗng vào sổ của template.
  if (n <= 0) return;

  // ⚠️⚠️ ĐIỂM VẪN PHẢI TRỪ KỂ CẢ KHI KHÔNG BAY ĐƯỢC. Phép trừ là TÍNH NĂNG, cú
  // bay chỉ là lời giải thích cho nó. Ô sai đã bị gỡ khỏi DOM (template vẽ lại
  // ngay), ô điểm đang ẩn, khung rộng 0 — bất cứ ca nào cũng phải rơi về đây,
  // không được im lặng nuốt mất điểm.
  const landNow = () => { const v = apply(); if (paint) paint(v); };
  if (!fromEl || !toEl) { landNow(); return; }
  const a = centerOf(fromEl), b = centerOf(toEl);
  if (!(a.w > 0) || !(b.w > 0)) { landNow(); return; }

  // Cỡ chữ đo từ CHÍNH chỗ bay ra (fight: cả khung, nên phải có trần) — bảng
  // 86" và cửa sổ soạn bài cách nhau vài lần, số cố định sẽ sai ở một trong hai.
  const size = Math.max(MIN_SIZE_PX, Math.min(a.w * 0.42, 96));
  const node = el("div", "aw-penalty-fly", "−" + n);   // U+2212 dấu trừ thật, không phải gạch nối
  node.style.left = a.x + "px";
  node.style.top = a.y + "px";
  node.style.fontSize = size + "px";
  document.body.append(node);
  nodes?.add(node);

  // Thu nhỏ về đúng cỡ chữ của ô điểm lúc tới nơi — cùng luật với mọi hiệu ứng
  // bay khác trong app (endScale = cỡ chữ đích / cỡ chữ đầu).
  const dstFont = parseFloat(getComputedStyle(toEl).fontSize) || size * 0.5;
  const endScale = Math.max(0.12, Math.min(1, dstFont / size));
  const dx = b.x - a.x, dy = b.y - a.y;
  const total = HOLD_MS + FLIGHT_MS;
  const holdFrac = HOLD_MS / total;

  const anim = node.animate([
    { transform: "translate(-50%,-50%) scale(.6)", opacity: 0, offset: 0 },
    { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: holdFrac * 0.5 },
    { transform: "translate(-50%,-50%) scale(1.06)", opacity: 1, offset: holdFrac },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 1, offset: 1 }
  ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });

  // ⚠️ `onfinish` KHÔNG BAO GIỜ nổ trong một tab/pane bị ẩn (bẫy đã ghi ở
  // core/HUONG DAN CORE.md — Chromium đóng băng cả animation lẫn rAF). Cái
  // `setTimeout` mới là thứ bảo đảm điểm CÓ BỊ TRỪ và nút DOM có được dọn.
  let done = false;
  const land = () => {
    if (done) return; done = true;
    node.remove(); nodes?.delete(node);
    pending?.delete(land);
    if (!alive()) return;      // ván đã bị vứt giữa đường — đừng ghi điểm cho một cái xác
    landNow();
    // Một nhịp nảy đỏ trên ô điểm: nó vừa bị lấy mất N điểm, và ở cuối lớp thì
    // một con số đổi giá trị KHÔNG phải là một chuyển động.
    try {
      toEl.classList.add("is-penalty-hit");
      setTimeout(() => toEl.classList.remove("is-penalty-hit"), 420);
    } catch { /* ô điểm đã đi mất */ }
  };
  anim.onfinish = land;
  setTimeout(land, total + 150);
  // ⚠️ Ghi tên vào sổ SAU cùng: `land` là idempotent (`done`), nên dù flush có gọi
  // ngay trong khung hình này thì cú `setTimeout` phía trên vẫn là một no-op.
  pending?.add(land);
}
