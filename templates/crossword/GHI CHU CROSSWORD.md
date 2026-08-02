# GHI CHU — CROSSWORD

**TRẠNG THÁI: ✅ ĐÃ CHỐT + LIVE, rồi 🔧 TÁI THIẾT KẾ LỚN (2/8/2026, Đợt 36 / v0.9.10) theo nhiều loạt
yêu cầu của thầy — ĐÃ COMMIT + PUSH.** Chỉ đụng `templates/crossword/*` (crossword.js / .css /
crossword-editor.js), **KHÔNG đụng core** (nav + slogan chèn bằng DOM vào `.aw-topbar`/`.aw-nav` của
engine rồi hoàn tác ở cleanup). Tự test trình duyệt thật đủ mọi mục (đo DOM, 0 lỗi console). ⚠️ Hiệu ứng
trượt/bay bị ĐÓNG BĂNG trong pane không-composite của Claude — đo bằng cách ép `transition:none` +
`setTimeout` fallback; trên Chrome thật chạy mượt.

> Sửa tiếp game này thì chỉ đụng `templates/crossword/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

## 2/8/2026 — TÁI THIẾT KẾ LỚN (Đợt 36 / v0.9.10) — thiết kế HIỆN HÀNH, đọc mục này trước

Thầy đặt tên: **"bảng crossword"** = toàn lưới, ẩn bàn phím · **"hàng"** = 1 từ ngang bung to + bàn phím ·
**"cột"** = 1 từ dọc bung to + bàn phím.

**Bố cục / màn hình**
- **Bàn phím CỐ ĐỊNH TUYỆT ĐỐI**: đặt trong host `.aw-cw-kbdhost` **position:absolute** ghim đáy-giữa
  (ngoài dòng chảy) → cỡ (cqw) + vị trí KHÔNG đổi dù chọn hàng/cột nào. `.aw-kbd:not(.is-hidden)` mới
  nhận chuột (bàn phím ẩn KHÔNG chặn ô lưới bên dưới — nếu để `.aw-kbd` auto trơn sẽ chặn hàng đáy).
- **Bảng dùng hết màn**: `.aw-cw-gridwrap` absolute top:1cqw/bottom:0.5cqw → lưới to nhất, căn giữa, KHÔNG
  khuyết ô. `resizeGrid` = min(rộng/cols, cao/rows).
- **Slogan "CROSSWORD IN ANDREW CLASSES"**: chèn 1 `div.aw-cw-slogan` vào `.aw-topbar` (absolute căn
  giữa; xám #9aa3af, font system-ui **weight 300**, letter-spacing 0.32em, HOA, ~1.7cqw). Ở bảng, ô clue
  để RỖNG.
- **Câu hỏi (clue)**: `.aw-cw-cluebar` absolute top, **height CỐ ĐỊNH 11cqw** (KHÔNG auto — auto làm
  autoFit tưởng luôn tràn → co hết cỡ), **align-items:flex-start** (câu hỏi nằm CAO). Chữ 4.1cqw × --fit;
  autoFit **slack=4** (bẫy: bản cũ để `slack: clientWidth*0.04` ≈ 35px khiến chữ bị co còn ~17–28px). 1
  dòng nếu ngắn, 2 dòng nếu dài, dài quá mới co. Nền TRONG SUỐT + **text-shadow quầng** (ô sau vẫn nhìn
  mờ, không đè trắng). `pointer-events:none` trừ khi `.is-active` (mở hàng/cột → bấm clue để thoát).
- **positionActive đo bằng `offset*`** (bỏ qua transform trượt bàn phím) → dải ô đúng vị trí NGAY frame
  đầu, không giật. `topBound` = **đáy CHỮ thật** (`clueBar.offsetTop + clueText.offsetTop +
  clueText.offsetHeight`) nên hàng luôn căn giữa câu-hỏi↔bàn-phím dù 1 hay 2 dòng.
  - **Hàng**: dải NGANG, căn giữa dải `[đáy chữ, đỉnh bàn phím]` (đo được trên/dưới ~ bằng nhau).
  - **Cột**: dải DỌC ở `[mép phải bàn phím, mép phải khung]`, trên nút loa (đo trái/phải ~ bằng nhau).
- **Vào mượt**: set size TRƯỚC khi `display:flex` + class `.is-pop` (scale .9→1) → không phóng to quá rồi co.

**Luồng chơi**
- Chọn từ ở bảng → bung to + hiện bàn phím. **Trả lời xong MỖI câu → luôn về bảng (2,5s) + ẩn bàn phím,
  tự chọn câu kế**. KHÔNG next/prev, KHÔNG tự nhảy câu.
- **Ẩn Next/Back** = `navWrap.style.visibility="hidden"` (KHÔNG `display:none` — thanh dưới là lưới 3 cột
  trái|nav|phải, bỏ hẳn nav sẽ dồn nút loa/fullscreen vào giữa). *(Bài học chung mọi template.)*
- Option **"Change the crossword"** (mặc định BẬT): mở hàng/cột rồi bấm câu hỏi để thoát; TẮT = khoá,
  buộc trả lời. `onCellClick` chỉ chạy ở bảng, chọn từ CHƯA xong đi qua ô.
- Con trỏ luôn bắt đầu **ô đầu (index 0)**, gõ cả từ trái→phải.

**Ô có sẵn (given từ câu chéo)**
- Từ câu ĐÚNG → **chữ xanh** (`.is-given-ok`, var(--aw-accent)); từ câu SAI đã lộ đáp án → **chữ xám**
  (`.is-given-bad`). Gõ **sai** chữ lên ô given → ô **rung** (`.is-shake`) + chặn con trỏ; gõ **đúng** chữ
  đó → đi tiếp.

**Andrew** (1 lần/ván, chỉ khi mở hàng/cột): hiện chữ đáp án **vàng lấp lánh** trong ô (`.is-hint`), HS
tự gõ; nút tối khi dùng xong. ⚠️ `isDisabled` của Andrew **KHÔNG được chứa `curWord<0`** — lúc dựng bàn
phím curWord=-1, nếu disabled thì core `keyboard.js` KHÔNG gắn onclick (mất luôn nút).

**Chấm điểm (mỗi câu 2,5s rồi về bảng)**
- Đúng → ô accent, **+1 điểm NGAY khi sao vàng bắt đầu bay** (điểm đổi trước, sao chỉ là hiệu ứng).
- Sai + **Show-answer BẬT** → **✕ đỏ trên các ô sai TRƯỚC** (`showWrongMarks`, `.is-xmark`), ~1s sau mới
  **lộ chữ đúng** (`.is-revealed` nền xám). Ô given đúng giữ nguyên.
- Sai + **Show-answer TẮT** → **✕ xám** (`.is-wrong`).
- **Minus**: slider **"Points off when wrong" 0..5** (0 = tắt, KHÔNG còn checkbox). Sai + minus>0 →
  **-điểm NGAY khi sao đỏ bắt đầu bay**. Tắt minus thì không có sao/không đổi điểm khi sai.
- Điểm `livePoints` hiện **"N/total"**: số XANH khi ≥0, ĐỎ khi <0 (không dấu trừ), có nảy — ghi thẳng vào
  `ui.scoreEl` (class `.aw-cw-score-*`, vì trang này không nạp CSS của Type-the-answer).
- **`flyStars(kind)`**: 12 sao bung quanh dải → bay về điểm; vàng (gain) / đỏ (lose). Gắn vào `<body>` (px
  cố định), tự dọn; cleanup cũng xoá `.aw-cw-star`.
- **Timers**: `pushTimer/clearTimers` quản chuỗi kết thúc (pha ✕→chữ đúng + về bảng); xoá ở
  returnToBoard/finish/cleanup.

**Editor**: nút **Duplicate/Remove = ICON** (`icons.duplicate`/`icons.trash`, Remove đỏ khi hover, class
`.aw-cw-ed-iconbtn`); ô **clue tự nới cao** (`autoGrow`, `resize:none; overflow:hidden`) hiển thị hết chữ
ngay từ đầu.

**Còn treo (khi thầy muốn)**: `tpl.hideRandomOption` (ẩn nhóm Shuffle vô nghĩa) vẫn chưa làm — cần sửa
core; 🎤/🖼️ voice+image cho từng clue trong editor.

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
