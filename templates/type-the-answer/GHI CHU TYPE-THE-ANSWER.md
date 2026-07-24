# GHI CHÚ — TEMPLATE TYPE THE ANSWER

## TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT (24/7/2026)

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/03-TYPE-THE-ANSWER.md` (2 chế độ, luật chấm gõ, alternate answers, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `type-the-answer.js` — module game, `type: "type_the_answer"`, `scorable: true`.
   - `type-the-answer.css` — giao diện riêng, mọi class prefix `.aw-tta-`.
   - `sample-type-the-answer.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/type-the-answer/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện prompt/câu hỏi → học sinh GÕ đáp án. Chấm bằng so khớp chuẩn hóa với TẬP đáp án chấp nhận (`acceptedAnswers[]` — nhiều biến thể). Mặc định không phân biệt HOA/thường; trim khoảng trắng. LƯU câu trả lời HS gõ vào perQuestion (để sau này phúc khảo). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `type-the-answer.js`/`.css`/`sample-type-the-answer.js` tạo mới, `type: "type_the_answer"`.
- Cùng khuôn phân trang "1 câu tại 1 thời điểm" như Quiz, chỉ đổi vùng trả lời thành **ô nhập chữ + nút
  Submit** thay vì các ô lựa chọn. Gõ xong bấm Submit HOẶC Enter đều chấm ngay (single-shot như Quiz).
  Enter chỉ lắng nghe TRÊN CHÍNH ô input (không dùng phím tắt toàn cửa sổ như Quiz/Anagram) để không
  đụng hành vi gõ chữ/di chuyển con trỏ bình thường của `<input>`.
- **Luật chấm gõ** (`normalize()`): mặc định bỏ qua HOA/thường + bỏ dấu (dùng `.normalize("NFD")` tách
  dấu rồi xoá) + trim/rút gọn khoảng trắng; bật `options.strictCase`/`options.strictAccent` để chấm chặt
  hơn. So khớp với BẤT KỲ đáp án nào trong `item.acceptedAnswers[]` (đã test: gõ "GREEN" khớp "green",
  gõ "test" báo sai + hiện "Correct: seven" đúng theo `options.showAnswerWhenWrong`).
  Sai → viền ô đỏ (đổi màu Ở ĐÂY được phép vì đây là Ô NHẬP có trạng thái thật, khác luật "tile không
  đổi màu" vốn áp cho ô lựa chọn multiple-choice) + badge ✗ + dòng "Correct: …".
- `review[].yourText` lưu ĐÚNG chữ học sinh đã gõ (không phải chuẩn hoá) — phục vụ phúc khảo sau này
  (ghi chú trong docs/03 mục 7).
- **Test qua `test.html` (browser thật)**: gõ đúng (khác hoa/thường) → is-correct; gõ sai → is-wrong +
  reveal; Enter và nút Submit đều hoạt động (đã xác nhận bằng `dispatchEvent(KeyboardEvent Enter)` trên
  chính input đang focus); Submit answers giữa chừng → Score 1/6 đúng; Show answers hiện đủ 3 dạng
  (đúng/sai kèm đáp án đúng/No answer kèm đáp án đúng). 0 lỗi console. Grep bẫy transform+animation —
  sạch (chỉ `:active` translateY không phải centering).
- Chưa làm: **chế độ "Spelling test"** (docs mục 2, đọc từ bằng audio cho HS gõ chính tả) — MVP chỉ làm
  chế độ "Questions and answers" (`content.mode: "qa"`); Spelling cần thêm text-to-speech (có thể dùng
  `window.speechSynthesis` sẵn có của trình duyệt, chưa làm — không phải bug, để ngỏ nếu thầy cần).
  Cũng chưa làm **KEYBOARD LANGUAGE** (bàn phím ảo ký tự đặc biệt, docs mục 3) — bàn phím thật của máy/
  điện thoại HS đã đủ dùng cho tiếng Anh.

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/)
