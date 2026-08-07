// =============================================================
// MISTAKES — dựng một ván CHƠI LẠI chỉ gồm những gì làm SAI hoặc BỎ TRỐNG.
//
// Thầy đặt hàng 7/8/2026 (Đợt 84). Bảng kết quả có thêm nút "Start with
// mistakes": bấm vào là về màn READY (nút PLAY to) của CÙNG game, tên game đổi
// thành "QUIZ WITH MISTAKES", và danh sách chơi chỉ còn các từ vừa sai.
//
// ⭐ CÁCH NỐI TỪ REVIEW VỀ TỪ GỐC — đọc kỹ chỗ này trước khi sửa:
// Mỗi hàng `review` mà template truyền vào `ui.finish()` nay mang thêm trường
// `src` = CHÍNH object phần tử nguồn (không phải bản sao, không phải chỉ số).
// Làm được vì mọi template đều bắt đầu bằng `[...(activity.content?.X || [])]`
// — sao chép NÔNG, nên phần tử trong danh sách chơi là cùng một object với
// phần tử trong `activity.content`. Nhờ vậy ở đây chỉ cần LỌC LẠI mảng gốc:
// câu hỏi giữ nguyên 4 đáp án, clue, acceptedAnswers… KHÔNG dựng lại gì cả.
//
// Đường còn lại (đã cân nhắc và BỎ): dò theo chữ, so `correctText`/`question`
// với `toRecords()` của convert.js. Không phải sửa template nào, nhưng hai từ
// trùng nhau là chọn nhầm, crossword rơi về `w.key`, running-team ghi
// `question` là "MINH ANH — 23" nên không khớp, và nội dung phải dựng lại qua
// record nên đáp án nhiễu bị sinh mới. Thầy chốt đi đường `src`.
//
// Template muốn có tính năng này phải khai 2 thứ (xem HUONG DAN CORE.md):
//   tpl.itemsKey  "questions" | "items" | "words" | "pairs" | "statements"
//   review[i].src  object nguồn của câu đó
// Không khai `itemsKey` -> engine không dựng nút, game đó không có tính năng
// (whack-a-mole cố ý không có: review của nó ghi MỌI hàng là sai nên "câu sai"
// không xác định được; speaking-cards không chấm điểm).
// =============================================================

// Số phần tử TỐI THIỂU để một ván còn chơi được. Mặc định 2 (thầy chốt: còn
// đúng 1 từ thì báo cần ít nhất 2). Vài game cần nhiều hơn vì luật chơi:
//   balloon_pop    5  — quả bóng phải có bạn để bay thành chùm
//   find_the_match 3  — mỗi câu cần ít nhất 2 ô nhiễu bên cạnh đáp án
//   crossword      2  — hai từ mới giao nhau được
// Con số lấy từ chính editor của các game đó (MIN_ITEMS), giữ cho khớp.
const MIN_ITEMS = { balloon_pop: 5, find_the_match: 3, crossword: 2 };

export function minItemsFor(type) {
  return MIN_ITEMS[type] || 2;
}

// Những phần tử nguồn ứng với câu SAI hoặc CHƯA LÀM, giữ NGUYÊN THỨ TỰ của
// mảng gốc (không theo thứ tự đã xáo lúc chơi).
//
// "Sai hoặc chưa làm" = `!row.yourCorrect` — một phép thử duy nhất phủ cả hai,
// đúng như thầy mô tả ("bị làm sai hoặc no answer").
export function pickMistakes(activity, tpl, review) {
  const key = tpl?.itemsKey;
  if (!key) return null;                       // game không khai -> không hỗ trợ
  const all = activity?.content?.[key];
  if (!Array.isArray(all) || !all.length) return null;

  const bad = new Set();
  for (const r of review || []) {
    if (r && r.src && !r.yourCorrect) bad.add(r.src);
  }
  if (!bad.size) return [];                    // làm đúng hết -> không còn gì để luyện
  // Lọc mảng GỐC (không map từ `bad`) nên thứ tự luôn theo bộ từ của thầy, và
  // một object lỡ xuất hiện 2 lần trong review cũng chỉ ra một phần tử.
  return all.filter(it => bad.has(it));
}

// Dựng act tạm để chơi lại. KHÔNG đụng act gốc, KHÔNG lưu thư viện.
//
// `base` = act vừa chơi xong (có thể chính nó đã là một act mistakes — chơi
// lại nhiều vòng thì cứ thu hẹp dần). `_mistakesBase` nhớ act để "Start again"
// quay về: luôn là act ĐẦY ĐỦ, không phải act mistakes trước đó.
export function buildMistakesActivity(base, tpl, review) {
  const kept = pickMistakes(base, tpl, review);
  if (!kept || !kept.length) return null;
  return {
    ...base,
    // id riêng mỗi ván: act tạm, không nằm trên thư viện. Tiền tố "mist_" đi
    // đúng đường mà "conv_" (đổi template) đã đi trong engine.js.
    id: "mist_" + base.type + "_" + Math.floor(Math.random() * 1e9),
    content: { ...(base.content || {}), [tpl.itemsKey]: kept },
    _mistakes: true,
    // Act ĐẦY ĐỦ để Start again trả về. Chơi vòng 3, vòng 4… vẫn trỏ về đúng
    // act đầu tiên chứ không phải vòng liền trước.
    _mistakesBase: base._mistakesBase || base
  };
}
