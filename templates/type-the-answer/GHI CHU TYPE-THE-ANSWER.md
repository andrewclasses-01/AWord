# GHI CHÚ — TEMPLATE TYPE THE ANSWER

## TRẠNG THÁI: 🔴 CHƯA BUILD

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
(trống)

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/)
