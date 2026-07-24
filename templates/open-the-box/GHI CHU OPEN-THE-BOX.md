# GHI CHÚ — TEMPLATE OPEN THE BOX

## TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT (24/7/2026)

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

### 24/7/2026 — build xong, GIẢI ĐƯỢC bài toán "engine luôn chạy finish→leaderboard" mà KHÔNG sửa core/
- `open-the-box.js`/`.css`/`sample-open-the-box.js` tạo mới, `type: "open_the_box"`, **`scorable: false`**.
- **Cách giải quyết lưu ý ở đầu file này**: template này **KHÔNG BAO GIỜ gọi `ui.finish()`** — vì thế
  không bao giờ kích hoạt celebration/"Game complete"/leaderboard (đúng bản chất game mở, không có
  "kết thúc"). Cũng **KHÔNG đăng ký `ui.onSubmit()`** → menu "Submit answers" tự trở thành vô hại
  (`submitHandler?.()` trong engine.js đã tự bọc optional-chaining sẵn). `options.timer: "none"` trong
  dữ liệu mẫu → engine KHÔNG chạy đồng hồ (đọc code engine.js xác nhận: timer chỉ start khi
  `timerMode() !== "none"`), nên không cần tự `stopTimer()`. Hoàn toàn không đụng `core/`.
- **Giao diện**: lưới hộp đánh số 1..N (CSS Grid, không phải Flex-transform-center) → bấm hộp LẬT 3D
  (CSS `transform:rotateY` trên chính khối hộp, KHÔNG phải để định vị-căn-giữa → không dính bẫy mục 3.5
  của CONG THUC MAU.md dù có dùng transform). Mặt sau hiện nội dung: **mode "simple"** = 1 dòng prompt;
  **mode "questions"** = câu hỏi + danh sách đáp án, đáp án đúng có dấu ✓ xanh (đã test cả 2 mode).
- `options.boxesAutoClose` (true = chỉ 1 hộp mở tại 1 thời điểm, mở hộp mới tự đóng hộp cũ; false/mặc
  định = nhiều hộp mở đồng thời, bấm lại 1 hộp đang mở để đóng riêng nó) — đã test cả 2 chế độ, đúng
  như mô tả docs mục 3 "BOXES: Leave open / Automatically close".
- Điểm/thanh tiến độ (`ui.setScore`/`ui.setNav`) được **DÙNG LẠI làm bộ đếm "đã mở bao nhiêu hộp"**
  (không phải điểm thật — engine chưa có UI riêng cho game không điểm) — số đếm này KHÔNG giảm khi đóng
  lại 1 hộp đã từng mở (đúng ý "tiến độ đã khám phá", không phải "đang mở").
- **Test qua `test.html` (browser thật)**: mở/đóng hộp mượt, mở nhiều hộp cùng lúc, bật thử
  `boxesAutoClose:true` → chỉ 1 hộp mở tại 1 thời điểm (đã trả về `false` sau khi test); thử mode
  "questions" với 1 câu hỏi có 2 đáp án → hiện đúng ✓ xanh cho đáp án đúng (đã trả về mode "simple" +
  9 prompt nói mẫu sau khi test). 0 lỗi console suốt quá trình. Không có Timer/Lives/Marking hiện trên
  màn hình — đúng docs mục 3 ("Không có Timer/Lives/Marking vì không chấm điểm").
- Chưa làm: **ROWS** riêng (docs có cả cột lẫn hàng, mới làm `options.columns`; số hàng luôn tự tính
  theo CSS Grid auto-flow) — không phải bug, chỉ chưa tách riêng điều khiển hàng vì Grid tự chia đều đã
  đủ đẹp cho hầu hết trường hợp. **END OF GAME: Show answers** (docs mục 3) không áp dụng được vì
  template không có khái niệm "kết thúc" (không gọi finish) — bỏ qua có chủ đích, không phải thiếu sót.

## ĐỀ XUẤT SỬA CORE (nếu có)
Nếu sau này AWord có NHIỀU game mở (open-ended) khác (Speaking cards, Flash cards, Spin the wheel...),
nên cân nhắc thêm 1 nhánh UI trong `core/engine.js` đọc cờ `scorable:false` để: (a) ẩn hẳn icon
✓+số ở topbar thay vì các template phải tự "mượn" nó làm bộ đếm tiến độ như file này đang làm, (b) có
thể thêm 1 nút "Reset boxes"/"Close all" chuẩn trong thanh dưới khung thay vì chỉ có "Start again" (vốn
dựng lại toàn bộ activity, hơi nặng cho nhu cầu "đóng hết hộp lại" đơn giản). Chưa cấp thiết — 4/4 game
hiện tại vẫn chạy tốt với engine như hiện có, ghi lại để cân nhắc khi có thêm game mở thứ 2.
