# GHI CHU — FLYING FRUIT (game thứ 8)

**Trạng thái: 🟢 ĐÃ BUILD + TỰ TEST (trình duyệt thật), CHỜ THẦY DUYỆT.** Chưa gộp trang chủ
(`core/catalog.js` chưa có, `built` chưa bật) — theo đúng quy trình, chờ thầy xem chạy thật rồi quyết.
Dựng lại act Classic của thầy: `wordwall.net/resource/116864498` — style **Jungle** (= "Classic" của
Flying Fruit trong AWord). Ngày build: 1/8/2026.

## Cách chơi
- Câu hỏi (định nghĩa/`clue`) hiện to ở ĐỈNH khung. Các đáp án (`word`) bay ngang màn hình theo hình
  **cung ném**, mỗi từ nằm trên 1 QUẢ (kivano/mango/papaya, xoay vòng + nghiêng nhẹ). Chạm quả mang
  từ ĐÚNG.
  - Đúng → quả nổ tung nước (sprite 8 khung, màu theo quả) + tia trắng + dấu ✓ + âm correct + **+1 điểm**
    + sang câu tiếp.
  - Sai → dấu ✗ + âm incorrect + **mất 1 TIM (mạng)**. Hết mạng → **Game over**.
- Đáp án SAI bay ngang = **random các `word` của câu KHÁC** (không cần thầy nhập distractor — giống ý
  thầy chốt "editor kiểu Anagram, câu trả lời là random các Word").
- Kết thúc: hết mạng (Game over) · hết giờ nếu bật Timer count-down (Time's up) · trả lời hết (Well done!).

## Mô hình dữ liệu = Y HỆT ANAGRAM
```
content.items = [{ word, clue }]   // word = đáp án đúng, clue = câu hỏi hiện trên đỉnh
```
Editor (`flying-fruit-editor.js`) đóng khuôn từ `anagram-editor.js`: title + bảng Word|Clue, kéo thả sắp
xếp, dán từ Excel (cột 1=word, cột 2=clue), Duplicate/Delete, "Delete all", nút Swap Columns,
🎤/🖼️ placeholder. Cần ≥ 2 đáp án (để có distractor).

## Options
- **Timer** (engine lo: none / count up / count down) · **Lives** (số mạng, mặc định 6) · **Speed**
  (tốc độ bay 1-10, mặc định 7) · **Retry after incorrect answer** (bật: sai vẫn ở câu cũ chơi tiếp;
  tắt [mặc định]: sai thì tính là trật rồi sang câu mới) · **Shuffle** · **Show answers**.
- Lives/Speed/Retry đọc 1 lần lúc mount → `optionsNeedRestart()` trả true (Apply = chơi lại áp dụng).

## Kỹ thuật (bám luật CORE)
- **`inlineTimerBar: true`** để lấy `ui.topbarMid` — vẽ hàng TIM (♥) ở giữa thanh trên. Đồng hồ (trái)
  do engine lo theo option Timer; điểm (phải) qua `ui.setScore`.
- **Spawn/gỡ quả bằng `setTimeout`, KHÔNG rAF** (tab ẩn không kẹt — mỗi quả có 1 setTimeout gỡ tuyệt đối,
  độc lập animation). Đường bay là CSS animation.
- **Tránh bẫy "transform + animation" nhảy vị trí**: quả di chuyển ngang bằng animate `left` (KHÔNG
  transform); cung dọc = `translateY` trên phần tử con; xoay quả = phần tử cháu — 3 tầng riêng, không
  đụng nhau. Quả căn tâm bằng **margin âm** (không transform) nên xoay không lệch. Các hiệu ứng nổi
  (boom/spark/mark) căn `translate(-50%,-50%)` TĨNH (boom) hoặc **bake luôn -50% vào mọi mốc keyframe**
  (spark/mark) — không dính bẫy.
- **Nổ sprite 8 khung**: box overflow hidden bọc 1 `img` strip rộng `800%`, animate `translateX(0 → -100%)`
  với `steps(8)` (dịch theo % kích thước strip → tuyến tính, tránh bẫy background-position % phi tuyến).
- `autoFit` co chữ câu hỏi dài; `escapeHtml` không cần (dùng `textContent`). Mọi cỡ trong khung = `cqw`.
- Art jungle CỐ ĐỊNH, KHÔNG đổi theo theme (như whack-a-mole). Assets tự chứa trong `./img` + `./sounds`,
  lấy từ Wordwall (xem `AWord-data/Source/.../FLYING FRUIT/GHI CHU.md`).

## Âm thanh (ff-sound.js)
18 file mp3 thật của theme jungle. Riêng game: FlyingFruitCorrect ×3 / Incorrect ×3. Chung: Intro/
Restart/Menu/TimesUp/GameCompleted/GameOver/Leaderboard/RevealAnswers. Nền sinh vật: Frog/Toucan/Monkey
(phát ngẫu nhiên 5-11s cho sống động). ⚠️ Theme jungle KHÔNG có "Go"/"ClockTick". Nhạc nền
(`music.mp3`) đã copy nhưng CHƯA cắm (Wordwall cũng không tự phát khi chơi thường).
- Âm thắng/thua/hết giờ do TEMPLATE tự phát trong `endGame()` (mỗi kết cục 1 âm khác nhau), nên hook
  `sounds.complete` để **no-op** (không để engine ép 1 âm cố định lúc celebration).

## Đã tự test (test.html, trình duyệt thật, 0 lỗi console)
Ready → Play → scene+nền+tim+clue+"x of N"+quả bay (ảnh load, 3 loại quả, chữ) · tap SAI → mất tim +
sang câu · tap ĐÚNG → nổ+tia+✓+điểm+ sang câu · hết mạng → "Game over" + bảng tổng kết (Score 1/12,
Time, leaderboard) · Show answers hiện đúng review từng câu · panel Options hiện Lives/Speed/Retry + Apply.

## ĐỀ XUẤT SỬA CORE
- (không bắt buộc) Hiện chưa cần sửa core. Nếu sau này nhiều game cần hiển thị "mạng/lives", có thể thêm
  1 API `ui.setLives(n, max)` vào engine thay cho mẹo tự vẽ tim trong `ui.topbarMid` — nhưng cách hiện
  tại chạy tốt, chưa cần.

## Việc để lại (chờ thầy)
- 🎤/🖼️ voice+image cho từng đáp án (Wordwall có layout flyingfruit-soundimage/textimage) — MVP hiện
  text-only, để bàn sau (giống Anagram/Crossword).
- Gộp trang chủ (`core/catalog.js` built:true + content editor dispatch + thêm vào `ALL_TEMPLATES` của
  engine) khi thầy chốt.
- Nhạc nền jungle (đã có file) nếu thầy muốn bật.
