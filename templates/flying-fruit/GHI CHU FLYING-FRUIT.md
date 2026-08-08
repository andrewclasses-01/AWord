# GHI CHU — FLYING FRUIT (game thứ 8)

**Đợt 91 dự án (8/8/2026, v0.9.65) — nối `onPause` cho MENU PAUSE toàn hệ thống. ✅ THẦY DUYỆT → COMMIT
`be7cd55` + PUSH + LIVE.**
Chỉ đụng `flying-fruit.js`: thêm `pauseGame`/`resumeGame` + bridge module `ffPauseHandlers` + `onPause`.
Quả đang bay đứng yên tự động (animation CSS bị core pause chung), riêng lịch SPAWN quả mới
(`spawnTimer`, một chuỗi `setTimeout` đệ quy) phải tự dừng tay: huỷ lịch hẹn hiện tại lúc Menu mở (không
spawn gì thêm), hẹn lại TỪ ĐẦU (gap ngẫu nhiên mới, không giữ đúng phần dư) lúc đóng — cùng mẫu với
Whack-a-mole. `ambientTimer` (hiệu ứng nền trang trí) cố ý không đụng. Chi tiết cơ chế chung:
`core/HUONG DAN CORE.md` mục "MENU PAUSE", `GHI CHU DU AN.md` Đợt 91.

**Trạng thái: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Sửa tiếp game này thì chỉ đụng `templates/flying-fruit/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.
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
- Nhạc nền jungle (đã có `sounds/music.mp3`) nếu thầy muốn bật.

### ➡️ GỘP TRANG CHỦ — checklist chính xác cho session sau (khi thầy chốt)
Làm ĐÚNG 4 chỗ này (đối chiếu cách `anagram` đã làm), rồi `curl` kiểm chứng bản live:
1. **`core/catalog.js`** (~dòng 10): thêm 1 mục
   `{ type: "flying_fruit", label: "Flying fruit", built: true, ... }` (chép khuôn mục `anagram`).
2. **`main.js`** (~dòng 44): thêm `import "./templates/flying-fruit/flying-fruit.js";`
   — dòng import này đăng ký cả template LẪN content editor (`edit: openFlyingFruitEditor`).
3. **`manifest.js`**: thêm mục `{ type:"flying_fruit", load: ()=>import("./templates/flying-fruit/flying-fruit.js"),
   sample: ()=>import("./templates/flying-fruit/sample-flying-fruit.js") }`.
4. **`index.html`**: thêm `<link rel="stylesheet" href="templates/flying-fruit/flying-fruit.css" />`.
- Kiểm thêm `ALL_TEMPLATES` trong `core/engine.js` (panel Template) — nếu có danh sách hard-code thì thêm
  `flying_fruit` để hiện "current" thay vì "coming soon".
- Sau khi push: `curl` bản live kiểm `catalog.js` + `index.html` đã có flying-fruit (Pages cập nhật file
  KHÔNG đồng thời — xem APP_MASTER mục 9).

## Chặng bổ sung — Points off (trừ điểm khi tap sai) — 3/8/2026
- Thêm option `pointsOff` (0..5): mỗi lần chạm quả SAI thì trừ `pointsOff` khỏi biến `score` (KHÔNG chặn về 0, cho phép âm), rồi `ui.setScore(score)`. Khi `pointsOff===0` hành vi y hệt bản cũ (có bọc `if (pointsOff)` nên không gọi thừa setScore).
- `ui.finish` giờ báo thêm `score` (điểm đã trừ) và giữ `correct/incorrect` tính từ số câu đúng thật (correctCount) để không bị âm. Seed mặc định `pointsOff: 0` trong sample. Chỉ sửa file trong `templates/flying-fruit/`.

## Chặng bổ sung — sửa lỗi snap góc xoay khi tap SAI (v0.9.63) — 7/8/2026 — ✅ THẦY DUYỆT → COMMIT `6b0dc5e` + PUSH + LIVE (`curl` xác nhận) — mốc chung toàn dự án: xem GHI CHU DU AN.md Đợt 88/89
- Cùng họ lỗi vừa tìm/sửa ở Open the box + Crossword: đổi CSS animation giữa chừng làm trình duyệt
  nhảy về giá trị mặc định thay vì tiếp mượt từ vị trí hiện tại. Chỉ sửa `flying-fruit.js` (`onTap()`) +
  `flying-fruit.css` (keyframe `aw-ff-shake`). **KHÔNG đụng core.**
- **Lỗi:** quả bay liên tục lắc nhẹ qua lại (`aw-ff-wobble`, xoay ±`--spin` độ, mặc định 6°). Chạm SAI thêm
  class `is-wrong` để đổi sang animation "rung" (`aw-ff-shake`) — animation này viết cứng `0%,100% { transform:
  rotate(0)... }`, mà một CSS animation MỚI luôn khởi động từ đúng khung hình `0%` của chính nó bất kể góc
  xoay thực tế đang ở đâu, nên quả nhảy phắt về đúng 0° (mất tới ±6°) rồi mới bắt đầu rung — lặp lại ở MỌI lần
  chạm sai (không phải ca hiếm), tuy góc lệch nhỏ nên không quá gắt mắt như 2 ca kia.
- Chỉ thấy được khi bật option **"Retry after incorrect answer"** — mặc định TẮT thì chạm sai gọi `advance()`
  ngay lập tức, xoá quả khỏi DOM trong CÙNG tick trước khi animation kịp vẽ khung hình nào, nên với cấu hình
  mặc định lỗi này vô hình; bật retry thì quả ở lại đủ 320ms và lỗi hiện rõ.
- **Sửa:** ngay trước khi gắn `is-wrong`, đọc góc xoay THỰC TẾ từ `getComputedStyle(...).transform` (qua
  `DOMMatrixReadOnly` + `Math.atan2`), ghi vào biến CSS `--wrong-from`; khung `0%` của `aw-ff-shake` đọc biến
  đó thay vì `rotate(0)` cứng. Trường hợp không có gì để đọc (`--wrong-from` chưa set) vẫn mặc định `0deg` —
  y hệt hành vi cũ.
- **Tự test** (devserver `aword` :5510, ép `activity.options.retry = true` để bắt kịp cửa sổ 320ms, đo qua
  `javascript_tool`): quả đang ở `matrix(0.990268, -0.139173, ...)` (góc xoay thật ≈ **−8.00°**) → chạm sai →
  `--wrong-from` đọc lại đúng **"−8.00deg"** — khớp chính xác, không còn ép về 0. 0 lỗi console.
