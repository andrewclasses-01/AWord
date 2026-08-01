# GHI CHU — Template WHACK-A-MOLE

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Sửa tiếp game này thì chỉ đụng `templates/whack-a-mole/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

Game whack-a-mole kiểu Wordwall, **đồ họa + âm thanh Wild West** lấy trực tiếp từ act mẫu Wordwall
(https://wordwall.net/resource/116864290/whack-a-mole). Tự chứa hoàn toàn trong thư mục này
(`./img`, `./sounds`). Thầy chốt: **2 chế độ (True/False + Quiz)**, **bản đầy đủ** (thùng gỗ + level +
đếm điểm), art Wild West (game giữ cảnh miền Tây CỐ ĐỊNH, không đổi theo theme).

## File
- `whack-a-mole.js` — module game (registerTemplate). Real-time bằng setTimeout (KHÔNG rAF cho việc
  bắt buộc; mọi mole có setTimeout tuyệt đối tự lặn/giải phóng).
- `whack-a-mole.css` — style, tiền tố `.aw-wam-`. Sizing bằng `cqw`.
- `sample-whack-a-mole.js` — dữ liệu mẫu, CHỨA CẢ 2 shape (statements + questions).
- `wam-sound.js` — 29 mp3 (pool + mute theo core/sound.js).
- `whack-a-mole-editor.js` — ĐẦY ĐỦ: nút chuyển chế độ (True/False | Quiz) + soạn statements /
  questions+answers, dán Excel, kéo sắp xếp, validate. Giữ CẢ 2 mảng content, Save ghi `options.mode`.
- `img/` 31 ảnh (thêm cactus/cactus2/cactus3/brokencargo), `sounds/` 29 mp3, `test.html`/`test.js`.

## Dữ liệu (options.mode chọn chế độ)
- **trueFalse**: `content.statements[{text, answer:bool}]`. Biển cố định "Hit moles that are: TRUE"
  (`options.target`). Đập chuột có `answer === target`.
- **quiz**: `content.questions[{question, answers:[{text,correct}]}]`. Biển hiện 1 câu hỏi = 1 "màn";
  chuột mang các đáp án của câu đó; đập đáp án ĐÚNG → xoay biển sang câu kế (LevelComplete → xoay →
  NextLevel). Hết câu thì vòng lại (xáo trộn).
- `options`: `timer:"none"` (engine tắt đồng hồ — game chạy đồng hồ RIÊNG ở `topbarMid` qua
  `inlineTimerBar`, giống Open the box, để thùng "time" cộng được giây), `gameSeconds` (mặc định 60),
  `speed` 1..10, `crates` on/off, `target`, `shuffleQuestions`.

## Cách chơi (đã build)
- Cảnh: nền `bg2` + biển (post + thicksignplank) + lưới **10 hố 3-4-3** (mỗi hố: mound + holeback +
  molewrap[cắt] chứa mole + holefront). Chuột 3 loại × ready/tapped/dizzy, chọn ngẫu nhiên.
- Spawn theo `speed` (gap + số chuột đồng thời). Chuột ngoi lên (transition transform), cầm bong bóng
  nội dung; không đập kịp → lặn (disappear, mất combo).
- Đập đúng → tia `whackzaps` + correct + điểm (combo ≥3 → thưởng + combo sound). Đập sai → wrong +
  trừ 1 điểm + reset combo. Quiz: đập đúng → xoay biển.
- **Thùng gỗ** (nếu bật, ~16%/lượt): time (+5s), loot (+5đ), power (x2 điểm 6s + glow), dizzy (bẫy −2đ).
- Đồng hồ đếm ngược (bar + tick 10s cuối, đỏ 5s cuối). Hết giờ → hoạt cảnh đếm điểm
  (pointscounting→counted) → `ui.finish` → celebrate + bảng tổng kết + Show answers + Leaderboard.

## Đã test (localhost:5510/templates/whack-a-mole/test.html, browser preview)
- True/False: đồng hồ 0:59→0:56 giảm đúng nhịp, bar 98%→93%; chuột ngoi kèm câu; đập → điểm 0→4, có tia.
- Quiz: biển "What does a seed need...?" → đập đáp án đúng → xoay sang "What is a young plant...?", điểm +1.
- Thùng "time" (đồng hồ vàng) ngoi lên OK.
- Kết thúc (ván 4s): tally → celebrate → bảng "TIME'S UP" Score 2/2, Time 5.4s + menu đủ 4 mục.
- Console 0 lỗi. (Bug đã sửa trong lúc build: TDZ `clockEl/fillEl` khai báo sau chỗ gọi; hố cao 0px
  do toàn con absolute → cho `height = s*1.35cqw`.)

## Đã bổ sung sau khi build lõi
- **Cactus backdrop**: bộ tile "whack" chỉ có bg2 (nền mờ). Từ `scenes/whack.json` của theme western
  thấy cảnh gốc phủ thêm cactus/cactus2/cactus3 (thư mục `balloon/`) — đã tải về + đặt 2 bên cảnh
  (`.aw-wam-decor` trong JS/CSS) cho ra chất Wild West. Núi/mesa vốn nằm MỜ trong bg2 (ImageQuality 0.08).
- **Editor đầy đủ** (2 chế độ) — đã test render + chuyển mode + Save ra dữ liệu đúng.

## VIỆC CÒN LẠI (chờ thầy CHỐT rồi làm cả cụm)
1. **Chờ thầy duyệt hình/cảm giác** (đặc biệt TOMKO): cỡ chuột/gò, nhịp spawn, cảm giác đập.
2. Thêm vào trang gom: `../../manifest.js` + `../../index.html` (link css) + `ALL_TEMPLATES` engine.
3. Bump version package.json + ghi GHI CHU DU AN gốc + commit/push origin main.

## ĐỀ XUẤT SỬA CORE (chưa tự sửa)
- (Chưa cần.) Engine đã đủ: `inlineTimerBar`, countDown auto-submit, `sounds.*`, `buildExtraOptions`,
  `optionsNeedRestart`. Đồng hồ tự chạy nên không đụng timer engine.

## LƯU Ý / ĐÁNH ĐỔI
- **Nền đơn giản hơn Wordwall**: bộ ảnh "whack" chỉ có `bg2` (gradient trơn) — dàn xương rồng/núi đá
  hoành tráng của Wordwall là lớp trang trí RIÊNG của theme (không nằm trong tile whack), nên mình
  không lấy. Nếu thầy muốn nền giàu hơn: lấy thêm ảnh theme western hoặc tự vẽ cactus/mesa.
- Game KHÔNG đổi màu theo theme (art Wild West cố định — thầy chốt).
