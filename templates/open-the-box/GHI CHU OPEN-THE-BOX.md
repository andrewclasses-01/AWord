# GHI CHÚ — TEMPLATE OPEN THE BOX

## TRẠNG THÁI: 🔴 CHƯA BUILD

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/04-OPEN-THE-BOX.md` (2 chế độ Simple/Questions, options cols/rows, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `open-the-box.js` — module game, `type: "open_the_box"`, **`scorable: false`** (game MỞ — KHÔNG chấm điểm, không leaderboard; xem lưu ý dưới).
   - `open-the-box.css` — giao diện riêng, mọi class prefix `.aw-otb-`.
   - `sample-open-the-box.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/open-the-box/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Lưới hộp đánh số (đóng). Chạm hộp → mở, hiện nội dung (prompt hoặc câu hỏi). Dùng cho hoạt động lớp (bốc câu nói, ôn ngẫu nhiên). Option: hộp để mở / tự đóng, số cột/hàng.

## ⚠️ Lưu ý riêng: game open-ended đầu tiên
Engine hiện tại LUÔN chạy vòng finish → celebration → leaderboard (thiết kế cho game scorable). Template này KHÔNG có điểm — khi build cần kiểm tra engine đối xử `scorable:false` thế nào; nếu engine cần thêm nhánh open-ended (bỏ celebration/leaderboard, nút kết thúc riêng), **KHÔNG tự sửa core/** — ghi đề xuất chi tiết vào mục dưới để session tổng xử lý.

## Nhật ký
(trống)

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/)
