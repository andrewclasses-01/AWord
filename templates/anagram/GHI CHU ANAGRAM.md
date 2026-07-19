# GHI CHÚ — TEMPLATE ANAGRAM

## TRẠNG THÁI: 🔴 CHƯA BUILD

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/01-ANAGRAM.md` (cách chơi, options, JSON đề xuất — đã nghiên cứu từ Wordwall thật).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `anagram.js` — module game, `type: "anagram"`, `scorable: true`, đăng ký qua `registerTemplate`.
   - `anagram.css` — giao diện riêng, mọi class prefix `.aw-anagram-`.
   - `sample-anagram.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/anagram/test.html` (test.html + test.js ĐÃ CÓ SẴN, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI ở đầu file này (🔴 CHƯA BUILD → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện câu gợi ý (clue) + các chữ cái bị xáo của đáp án — người chơi kéo/bấm chữ cái về đúng vị trí để giải từ. Giải xong sang từ tiếp. Tham khảo phản hồi ✓/✗ + fade chuyển câu giống Quiz (`../quiz/quiz.js` là mẫu chuẩn).

## Nhật ký
(trống — ghi từng đợt làm việc vào đây, mới nhất lên trên)

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/; ghi đề xuất vào đây để session tổng xử lý)
