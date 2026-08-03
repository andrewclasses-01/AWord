# GHI CHÚ — TRUE FALSE (True or false)

**Trạng thái: ✅ ĐÃ BUILD + SỬA đợt 1 (8 mục) + SỬA đợt 2 (3 mục), 1/8/2026. CHỜ THẦY DUYỆT.**
Đã tự test kỹ trên browser thật (test.html, cổng 5512), 0 lỗi console. CHƯA commit/push.

## Đợt sửa 2 (1/8/2026) — 3 mục
1. **Chống bấm quá gần nhau:** 2 nút True/False bị KHÓA (`disabled`) ngay khi vừa trả lời, giữ khóa suốt lúc
   câu bay/trượt ra, chỉ MỞ khi câu mới đã vào **~50%** (`gateTimer` = `ENTER_MS*0.5`; `lockButtons`/
   `unlockButtons` trong startCycle + đầu `choose`). Nút cũng khóa sẵn lúc đếm 3-2-1 (renderShell tạo nút
   `disabled=true`) nên không lỡ trả lời câu đầu khi đang đếm. Đã test: khóa suốt bay, không trả lời "mù".
2. **Hạ tim cho cân số điểm:** glyph ♥ nằm lệch lên trong ô chữ → nhích xuống `translateY(0.09em)` (~2px)
   ở `.aw-top-heart` (core app.css). Chỉ dời glyph, KHÔNG dời số "N" của dạng gọn.
3. **Bỏ âm `timesUp` (~6-7s):** `finish()` KHÔNG còn gọi `tfSound.timesUp()` khi bấm Submit hay hết giờ
   (nhánh `reason==="timesup"` bỏ hẳn) — màn kết quả đã có nhạc tổng kết riêng của engine. Giữ nguyên
   gameOver / gameCompleted. Đã test spy audio: không phát `timesup.mp3`, các âm khác vẫn chạy.

Game "True or false" (nội bộ Wordwall gọi là **"boolean"**) — cùng họ game "băng chuyền" với Find the
match. Một CÂU (statement) trượt từ mép trái vào giữa màn; học sinh bấm **True / False** để nói câu đó
đúng hay sai.

## Cách chơi
- Câu trượt vào giữa theo cơ chế băng chuyền (`element.animate({transform:translateX})` trong
  `.aw-tf-track` overflow:hidden). **Tốc độ trượt vào đã GIẢM** (ENTER_MS 900→1300; đường cong crawl chậm
  hơn) theo yêu cầu thầy (1/8).
- **Speed slider (0–10)** trong Options: 0 = câu dừng ở giữa CHỜ trả lời (mặc định); >0 = câu trôi tiếp
  sang phải, trôi hết mà chưa trả lời = "timeout".
- 2 nút **True / False** cố định dưới vạch kẻ đứt — **cỡ đã giảm còn 80%** (font 4→3.2cqw, padding/max-width
  ×0.8) theo yêu cầu thầy (1/8).
- **Trả lời ĐÚNG (hiệu ứng mới 1/8):** cả CÂU bay về phía số điểm, trên đường vỡ thành ~11 **ngôi sao nhỏ**
  bay vào số điểm; số điểm +1 kèm nảy nhẹ. **Trả lời SAI:** ✗ + tiếng sai, mất 1 tim, câu trượt hết sang
  phải rồi câu kế trượt vào.
- **Khoảng cách (1/8):** đo lúc chạy để **kẻ→nút True/False = nút→số trang "x of y"** (nới lề dưới dòng kẻ;
  hàm `balanceSpacing`, tự cân lại khi resize/fullscreen). Đã đo: 32.3px = 32.3px.
- **Câu căn giữa (1/8):** tim đã dời ra thanh trên nên vùng câu cao tới sát mép trên → câu nằm chính giữa
  khoảng từ mép trên tới dòng kẻ.

## Mạng / TIM (đại tu 1/8)
- Tim nằm ở **THANH TRÊN, ngay bên trái số điểm** (không còn trong thẻ game) — qua hook lõi `ui.livesSlot`.
- **Thanh Lives 0–10** trong Options (accent đỏ): **0 = Unlimited** (không hiện tim); 1–10 = số tim.
  `normLives`: 0/null = vô hạn, undefined = mặc định 5, tối đa 10.
- Hiển thị: **≤5 mạng = từng trái tim rời; ≥6 mạng = dạng gọn "N♥"** (số + 1 tim). Mất mạng → **tim NGOÀI
  CÙNG BÊN TRÁI bung ra biến mất hẳn** (animation pop), rồi vẽ lại. Đã test: 8♥→7♥→6♥→(5 tim rời).
- Hết tim = Game Over.
- **Unanswered questions**: "Show once" = bỏ qua; "Repeat until answered" = xếp lại NGẪU NHIÊN. Timeout
  KHÔNG mất tim (chỉ bấm sai mới mất).

## Đồng hồ + đếm 3-2-1 (sửa lõi, 1/8)
- Count-up: có đếm ngược 3-2-1 (số to + ting) trước câu đầu. **Đồng hồ góc trên nay ĐỨNG YÊN 0:00 suốt lúc
  đếm 3-2-1, chỉ chạy khi đếm xong** — nhờ hook lõi mới `manualTimerStart` + `ui.startTimer()`. (Trước đây
  là giới hạn không làm được; nay đã xử lý.) Đã đo: clock giữ 0:00 tới khi hết "1" rồi mới chạy.
- Count-down: ting 1 lần/giây từ 10s, gấp đôi từ 5s.
- Bàn phím: **T / ←** = True, **F / →** = False. Mũi tên prev/next của engine bị ẩn (`:has`).

## ⚠️ ĐÃ SỬA LÕI CHUNG (core/engine.js + core/app.css) — thầy đã duyệt "sửa lõi an toàn"
Cả hai **tùy chọn, mặc định TẮT**, các game khác (Quiz, Find the match...) chạy y như cũ:
1. **`tpl.hasLivesSlot`** → engine tạo `ui.livesSlot` (span bên trái số điểm, bọc trong `.aw-top-right`) +
   phơi `ui.scoreEl`. CSS lõi mới: `.aw-top-right / .aw-top-lives / .aw-top-heart / .aw-top-heartcount`
   (tim rỗng thì `:empty` tự ẩn). True/false tự ghi tim vào slot này.
2. **`tpl.manualTimerStart`** → engine KHÔNG tự chạy đồng hồ ở `begin()`; template gọi `ui.startTimer()`
   khi sẵn sàng (reset `startedAt` để bỏ thời gian đếm 3-2-1 khỏi thời gian chơi). Có `timerStarted` chống
   gọi 2 lần.
Đây là kiểu mở rộng an toàn giống `inlineTimerBar` / `hideTimerOption` đã có sẵn trong engine.

## Màu nút theo THEME (giữ nguyên từ 31/7)
KHÔNG hard-code. Nút True = `var(--aw-ok)` / gờ `var(--aw-ok-d)`, False = `var(--aw-no)` / `var(--aw-no-d)`
— mọi theme tự có tông riêng (Classic xanh/đỏ, Classroom xanh ấm/đỏ gạch, Beach xanh biển/đỏ san hô).

## Editor 2 CỘT (đại tu 1/8) — `true-false-editor.js`
- BỎ dạng bảng 1 cột + nút gạt True/False từng dòng. Thay bằng **2 CỘT**: cột trái = câu TRUE, cột phải =
  câu FALSE (tiêu đề ✓ TRUE / ✗ FALSE). Mỗi dòng: số + ô nhập + nhân bản + xóa (BỎ kéo-thả vì game **luôn
  trộn ngẫu nhiên** nên thứ tự vô nghĩa).
- Lưu: gộp `[...true→answer:true, ...false→answer:false]` → **giữ NGUYÊN định dạng `content.statements`
  {text,answer}** nên act cũ vẫn mở/chơi được. Đã test round-trip đúng.
- Dán Excel: nếu khối có cột 2 True/False → tự phân câu về đúng cột; nếu 1 cột → điền vào cột đang dán.
- Giới hạn: tối đa 40 câu tổng, tối thiểu 3, và **≥1 câu mỗi cột** (chặn save + báo lỗi rõ). Đã test.

## Chơi luôn trộn ngẫu nhiên (1/8)
`order = shuffle(...)` mỗi lần chơi (bỏ nhánh theo `shuffleQuestions`) — thầy chốt: editor 2 cột không mang
thứ tự chơi, nên luôn trộn để HS không đoán được.

## Bộ file
- `true-false.js` — template (flags `hasLivesSlot`, `manualTimerStart`; `mount`, `toPrintItems`, `edit`,
  `buildExtraOptions` cho Speed + Lives slider + Unanswered). Prefix class `.aw-tf-*`.
- `true-false.css` — style riêng (nút 80%, băng chuyền, hiệu ứng bay/sao dùng px vì nằm NGOÀI stage, editor
  2 cột). Tim ở thanh trên dùng class LÕI `.aw-top-*`.
- `tf-sound.js` — âm thanh thật Wordwall (bộ classic2, giống Find the match).
- `true-false-editor.js` — editor 2 cột.
- `sample-true-false.js` — dữ liệu mẫu ("Plant life cycle", 8 câu: 6 true, 2 false).
- `test.html` / `test.js` — trang test riêng: `http://localhost:5510/templates/true-false/test.html`
  (hoặc 5512 khi verify song song).

## Đã kiểm (browser thật, 1/8/2026)
- 3-2-1 đồng hồ đứng 0:00, đếm xong mới chạy (đo từng mốc 300ms).
- 5 tim ở thanh trên cạnh điểm; bấm sai → 5→4 (tim trái mất). Bấm đúng → 11 sao + câu bay + điểm +1.
- Lives slider: 8 → "8♥" gọn; 8→7→6♥ rồi xuống 5 = 5 tim rời; 0 → "Unlimited", ẩn tim.
- Nút = 30.9px (80%). Khoảng cách kẻ→nút = nút→số trang = 32.3px.
- Editor 2 cột nạp mẫu đúng (6 true / 2 false); gộp lưu đúng contract; chặn save khi thiếu 1 cột.
- Chơi hết 8 câu → "GAME COMPLETE" + Score 8 + Show answers (hiện đủ câu + True/False) + Start again.
- 0 lỗi console suốt các bước.

## Chưa làm / lưu ý
- Chưa test trên play.html (trang HS) — giống các template khác, play.js hiện chỉ import tĩnh `quiz.js`;
  cần thêm import + nạp template động (ĐỀ XUẤT SỬA CORE chung cho MỌI template ngoài quiz) nếu muốn giao
  bài True/False cho HS.
- Save trong test.html báo "Please sign in" (đúng như mọi template — test.html không có đăng nhập); logic
  editor vẫn đã verify qua gọi trực tiếp.
- Nguồn âm thanh gốc: `D:\APP AND DATA\AWord-data\Source\Sound effect\TRUE FALSE`. Bản dùng trong app ở
  `./sounds/`.

## Thêm phạt điểm khi trả lời SAI (pointsOff) — 3/8/2026
- Thêm option `pointsOff` (0..5) trong `options`: mỗi lần trả lời SAI trừ đi `pointsOff` điểm (cho phép
  ÂM, KHÔNG kẹp về 0). Điểm hiển thị = số câu đúng − tổng phạt qua biến `penalty` + hàm `liveScore()`.
- Cập nhật đồng bộ cả ô điểm góc trên (`ui.setScore`) và ô đếm nav (`ui.setNav.index`); `ui.finish` báo
  `score: correct - penalty`. Khi `pointsOff===0`, `penalty` luôn 0 nên hành vi GIỐNG HỆT bản cũ. Đã seed
  `pointsOff: 0` vào sample-true-false.js.
