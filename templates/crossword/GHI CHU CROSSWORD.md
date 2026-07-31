# GHI CHU — CROSSWORD

**TRẠNG THÁI: 🟢 ĐÃ BUILD + TỰ TEST QUA test.html — CHỜ THẦY DUYỆT** (chưa gộp trang chủ,
chưa thêm vào `core/catalog.js`, giống cách Find the match đang chờ duyệt).

Tạo ngày 31/7/2026. Dựng lại từ act mẫu Wordwall của thầy (style **Classic**):
https://wordwall.net/resource/116864402/crossword — nghiên cứu đầy đủ trong `docs/09-CROSSWORD.md`.

## File của template
- `crossword.js` — game: **tự sinh lưới ô chữ interlock** từ danh sách từ + render + nhập liệu + chấm.
- `crossword.css` — style `.aw-cw-*` (theme-driven, cqw để fullscreen giữ tỷ lệ; cell px do JS tính).
- `sample-crossword.js` — 20 cặp {answer, clue} thật của act mẫu.
- `crossword-editor.js` — editor 2 cột **Answer | Clue** (thêm/xóa/nhân bản/dán Excel).
- `crossword-sound.js` — âm mp3 THẬT lấy từ Wordwall Classic (xem dưới).
- `sounds/` — 13 file mp3 (bộ âm Classic).
- `test.html` / `test.js` — trang chạy thử riêng.

## Cách chơi (khớp Wordwall)
- Màn Ready → Play. Lưới tự sinh từ các answer (chèn nhau ở chữ chung).
- Bấm 1 ô/1 từ → từ đó sáng lên, **gợi ý hiện to ở thanh trên**, con trỏ vào ô trống đầu tiên.
  Bấm lại vào ô giao nhau → **đổi hướng** ngang/dọc.
- Gõ chữ (bàn phím vật lý HOẶC bàn phím ảo) → điền ô + tự nhảy ô. Khi đủ chữ cả từ → **tự chấm**:
  - Đúng → ô chuyển **màu accent + chữ trắng**, +1 điểm, âm "correct", tự sang từ chưa giải kế tiếp.
  - Sai → âm "wrong". Nếu bật **Show answer when wrong** → tự điền đáp án đúng + khóa từ (tính là đã
    trả lời, KHÔNG cộng điểm). Nếu tắt → nháy đỏ rồi xóa chữ để gõ lại.
- Tự kết thúc khi mọi từ đã giải/đã lộ. Menu **Submit answers** hoặc **Count down** hết giờ → kết thúc
  sớm (từ chưa trả lời = sai). Panel kết quả + Leaderboard + Show answers (do engine lo).

## Bàn phím ảo
- **MẶC ĐỊNH ẨN** (giống Wordwall: lưới hiện đầy, gõ bằng bàn phím vật lý). Nút bật/tắt nằm cạnh nút
  Menu (dùng `hasKeyboardToggle` + `ui.kbdSlot` của engine, y như Type the answer).
- Bật lên (cho màn cảm ứng TOMKO): bàn phím QWERTY chữ + phím ⌫; lưới thu nhỏ chia chỗ với bàn phím.

## Âm thanh (mp3 THẬT từ Wordwall Classic — KHÔNG dùng tiếng tổng hợp core)
Bộ âm nằm ở `sounds/` (copy từ `D:\APP AND DATA\AWord-data\Source\Sound effect\CROSSWORD`). Đã xác nhận
bằng cách CHƠI THẬT act Wordwall + đo độ dài file (chi tiết trong GHI CHU.md thư mục Source):
- `intro` (blockgameintro1) — bấm Play.
- `correct-01/02/03` (blockchipminor1/2/3, random) — giải đúng 1 từ.
- `incorrect-01/02/03` (blockchipfail1/2/3, random) — trả lời sai 1 từ.
- `gamecompleted` (blockgamesuccessful) — kết thúc / Submit.
- `timesup` (blockgametimeout) — Count down hết giờ (gắn vào hook `timeWarning`).
- `restart` (blockgamerestart) — Start again.
- (`menu`/`leaderboard`/`revealanswers` có sẵn trong `sounds/` để đủ bộ, nhưng các màn đó do ENGINE lo
  nên template không tự phát — giữ để đối chiếu/đề phòng sau này.)

## Options
- **Timer** (None/Count up/Count down) — engine.
- **Show answers** cuối game — engine (màn review).
- **Show answer when wrong** — riêng template (qua `buildExtraOptions`).
- **Ẩn** nhóm "Letters on answers" (`hideLettersOption: true`) — ô chữ không có nhãn A/B/C.

## Hạn chế đã biết / việc có thể làm sau (hỏi thầy)
1. **Lưới nhiều từ + bàn phím ảo bật = ô nhỏ** trên màn thấp (vd 20 từ → lưới 16 hàng; khi bật bàn phím
   ảo trên viewport 720px, ô ~11px). Trên màn TOMKO 4K / cửa sổ to thì ô lớn theo cqw, đọc tốt. Hướng
   nâng cấp giống Wordwall: khi bật bàn phím ảo thì **phóng to & cuộn theo từ đang chọn** thay vì thu cả
   lưới. Chưa làm (MVP).
2. **Nhóm "Random" (Shuffle) trong Options vẫn hiện** dù ô chữ cố định (crossword bỏ qua 2 cờ này).
   Engine chưa có cờ `hideRandomOption`. → **ĐỀ XUẤT SỬA CORE**: thêm `tpl.hideRandomOption` (giống
   `hideLettersOption`) để ẩn nhóm Random cho crossword. Tạm thời để hiện, template không đọc 2 cờ đó.
3. Ở màn Show answers, từ được "lộ đáp án khi sai" hiện đúng chữ đã lộ ở cột "đáp án của em" (vì đã điền
   sẵn) — khớp cách Wordwall hiển thị (đánh dấu ✗). Nếu muốn hiện đúng chữ HS gõ trước khi lộ thì cần
   lưu thêm bản nháp — chưa làm.
4. Voice/Image cho từng clue (Wordwall có icon 🎤/🖼️) — chưa làm (giống Anagram để bàn sau).

## ĐỀ XUẤT SỬA CORE (chờ phụ trách tổng)
- Thêm cờ `tpl.hideRandomOption` trong `core/engine.js` (ẩn nhóm "Random" của Options panel) — dùng cho
  Crossword. Không tự sửa core theo luật số 1.

## Đã tự test (qua test.html, trình duyệt thật, 0 lỗi console)
- Sinh lưới interlock 20 từ (19 đặt được, 1 không chèn được thì bỏ khỏi lưới) — OK.
- Chọn từ (bấm ô), đổi hướng ở ô giao — OK. Gõ vật lý + bàn phím ảo — OK.
- Chấm ĐÚNG (ô xanh + điểm + âm), chấm SAI + lộ đáp án (ô xám + không điểm + âm) — OK.
- Submit → panel GAME COMPLETE (Score/Time) → Show answers (19 hàng, đúng/sai/No answer) — OK.
- Bật/tắt bàn phím ảo (lưới co lại vừa khít, không tràn) — OK.
- Đổi theme (Classic ↔ Beach): màu ô/chữ/gợi ý đổi theo accent, không vỡ — OK.
