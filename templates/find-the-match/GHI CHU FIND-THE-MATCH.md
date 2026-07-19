# GHI CHÚ — TEMPLATE FIND THE MATCH

## TRẠNG THÁI: 🔴 CHƯA BUILD

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/05-FIND-THE-MATCH.md` (cách chơi, options, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `find-the-match.js` — module game, `type: "find_the_match"`, `scorable: true`.
   - `find-the-match.css` — giao diện riêng, mọi class prefix `.aw-ftm-`.
   - `sample-find-the-match.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/find-the-match/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Dữ liệu là các cặp {keyword ↔ definition}. Màn hình hiện 1 prompt + nhiều lựa chọn; chạm lựa chọn khớp thì cặp đó bị loại; lặp đến hết. Có lives + speed (đáp án trôi). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký
(trống)

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/)
