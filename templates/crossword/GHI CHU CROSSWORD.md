# GHI CHU — CROSSWORD

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Sửa tiếp game này thì chỉ đụng `templates/crossword/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

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
- Gõ chữ (bàn phím vật lý HOẶC bàn phím ảo) → điền ô + tự nhảy ô. ~~Khi đủ chữ cả từ → tự chấm~~
  **(ĐỔI 1/8/2026)**: đủ chữ KHÔNG tự chấm — bấm phím **Submit** trên bàn phím ảo (hoặc **Enter**
  bàn phím thật) để chốt đáp án, khi đó mới chấm:
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

## 1/8/2026 — Đổi sang BÀN PHÍM CHUẨN dùng chung (`core/keyboard.js`)

Thầy yêu cầu lấy y hệt bàn phím của Type the answer (4 hàng, tông tối cố định, caps/numbers/backspace/
space) làm bàn phím CHUẨN cho toàn hệ thống, áp dụng luôn cho Crossword. Xem chi tiết đầy đủ (thiết kế
module, quyết định của thầy) ở `GHI CHU TYPE-THE-ANSWER.md` mục "ĐỀ XUẤT SỬA CORE" (đợt 1/8/2026).

- Bỏ hẳn bàn phím 3 hàng cũ (`KBD_ROWS`/`buildKeyboard/letterKey/key`, CSS `.aw-cw-kbd*`/`.aw-cw-key*`).
- Dùng `createKeyboard({sound: ui.sound, onChar, onBackspace})` — KHÔNG có `submit` (crossword tự chấm
  ngay khi đủ chữ, không cần nút Submit) và KHÔNG có `extraKey` ("Andrew help" là riêng của Type the
  answer). `onChar` chỉ nhận chữ cái A-Z, bỏ qua Space/số/dấu câu (các phím đó vẫn HIỆN cho đồng bộ
  nhìn với mọi game khác nhưng bấm không làm gì — giống bàn phím thật, `onKey` vốn cũng chỉ nhận
  `[a-zA-Z]`).
- **Đổi tông màu**: bàn phím nay LUÔN tối (không đổi theo theme Classic/Beach như trước) — thầy chốt
  để đồng bộ toàn hệ thống.
- Test qua `test.html` (gõ "CARRY" bằng bàn phím ảo giả lập qua DOM vì pane phiên này bị lỗi toạ độ
  chuột (0,0), không composite frames): ô tự điền + điểm lên + chuyển từ kế tiếp; gõ sai → tự lộ đáp án
  đúng + chuyển từ kế tiếp. 0 lỗi console.

### 1/8/2026 (tiếp) — Bàn phím ĐỦ BỘ như bản chuẩn: thêm phím Andrew + Submit, ĐỔI LUẬT CHẤM

Thầy gửi 2 ảnh so sánh (bàn phím crossword thiếu nút vs bàn phím chuẩn) và chốt qua AskUserQuestion:
- **Phím Andrew** (1 lần/ván): hiện đáp án TỪ ĐANG CHỌN màu vàng ở CUỐI THANH GỢI Ý (span mới
  `.aw-cw-clue-answer`, gradient + glow y hệt TTA, keyframes nhân bản tên `aw-cw-andrew-*` vì trang
  crossword không nạp CSS của TTA); HS tự gõ lại — chép đúng VẪN được điểm (y hệt TTA). Trạng thái
  ready → glowing → used do core gắn; glow TẮT khi từ đó được chấm HOẶC HS rời sang từ khác
  (`consumeAndrewGlow()` gọi ở selectWord/onCellClick/moveCursor-đổi-từ/gradeWord/finish).
- **Phím Submit** (xanh) = **ĐỔI LUẬT CHẤM CẢ GAME**: gõ đủ chữ KHÔNG tự nhận nữa (bỏ auto-grade
  trong `typeLetter`); Submit sáng lên khi từ điền đủ (`wordFilled()`), bấm mới chấm
  (`submitCurrentWord()` → `gradeWord()`). Bàn phím thật: phím **Enter = Submit** (thêm vào `onKey`);
  Enter khi từ chưa đủ chữ → không làm gì. Sau chấm/xoá chữ/chuyển từ đều `kbd.refresh()` để
  Submit/Andrew đúng trạng thái theo từ đang chọn.
- **Đã test qua trình duyệt thật** (server riêng 5511, đo DOM): 4 hàng đủ `' q…p ⌫ / caps… ? /
  numbers… . , / Andrew Space Submit`; gõ đủ "CARRY" → KHÔNG tự chấm (0 ô xanh) + Submit sáng → bấm
  Submit → 5 ô xanh + điểm 0→1 + Submit khoá lại; Andrew → glowing + "CORRECT" vàng trên thanh gợi ý
  → điền + Submit → glow tắt + phím tối "is-used" + khoá cả ván; từ điền SAI + Submit → lộ đáp án
  (6 ô xám) + không cộng điểm + tự sang từ kế; Enter vật lý = Submit (từ chưa đủ → không làm gì, đủ →
  chấm); 0 lỗi console. File đụng: `crossword.js` + `crossword.css` (KHÔNG đụng core).

## Đã tự test (qua test.html, trình duyệt thật, 0 lỗi console)
- Sinh lưới interlock 20 từ (19 đặt được, 1 không chèn được thì bỏ khỏi lưới) — OK.
- Chọn từ (bấm ô), đổi hướng ở ô giao — OK. Gõ vật lý + bàn phím ảo — OK.
- Chấm ĐÚNG (ô xanh + điểm + âm), chấm SAI + lộ đáp án (ô xám + không điểm + âm) — OK.
- Submit → panel GAME COMPLETE (Score/Time) → Show answers (19 hàng, đúng/sai/No answer) — OK.
- Bật/tắt bàn phím ảo (lưới co lại vừa khít, không tràn) — OK.
- Đổi theme (Classic ↔ Beach): màu ô/chữ/gợi ý đổi theo accent, không vỡ — OK.
