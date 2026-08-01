# GHI CHU — SPEAKING CARDS

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Mục "Khi thầy DUYỆT mới làm" ở CUỐI file đã LÀM XONG rồi, nhưng cách làm nay khác: từ v0.9.7 gộp
> template = thêm ĐÚNG 1 mục trong `core/catalog.js`, KHÔNG đụng `manifest.js`/`index.html`/`main.js`.

Game "mở" (open-ended) đầu tiên của AWord: rút bài ngẫu nhiên để HS luyện NÓI. **Không chấm điểm,
không thắng/thua, không leaderboard** (`scorable: false`). Look "Board Games" của Wordwall = look
**Classic** của game này trong AWord (thầy chốt 1/8/2026), giống cách Balloon pop lấy Wild West.

Nguồn nghiên cứu: act thật `wordwall.net/resource/116796629/speaking-cards`, visual style **Board Games**.

## Cách chơi
- Bộ bài úp mặt (lưng vàng hoa văn) bên trái, trên nền bàn cờ nỉ xanh + đạo cụ (bàn cờ đam, domino, xúc xắc).
- Bấm bộ bài **hoặc** nút **Deal** → lá trên cùng bay ra ô chia bài rồi **lật** hiện prompt để HS nói.
- **Shuffle** xáo lại bộ bài (gộp cả lá đã bỏ) · **Undo** hoàn lại lần chia trước.
- **Number of deal places (1–10)**: bày nhiều lá cùng lúc (lưới); mỗi Deal quay vòng qua từng ô,
  lấp đầy rồi thay lá cũ nhất.
- Hết bài → Deal/deck mờ đi, phải Shuffle. Nếu bật **Count down**, hết giờ → banner "Time's up!".
- Bàn phím: Enter/Space/D = Deal, S = Shuffle, U/Backspace = Undo.

## Bộ file
```
speaking-cards.js          module game (mount + buildExtraOptions + edit + toPrintItems)
speaking-cards.css         style, tiền tố .aw-sc-  (+ editor .aw-sc-ed-)
sample-speaking-cards.js   dữ liệu mẫu (12 thẻ, 1 thẻ có ảnh)
speaking-cards-sound.js    map 8 nhóm âm thanh -> file trong ./sounds/
speaking-cards-editor.js   form soạn thẻ (chữ + ảnh upload, kéo sắp xếp, dán Excel)
sounds/                    15 mp3 gói "playingcards" (chép từ Source, xem bên dưới)
test.html / test.js        trang chạy thử độc lập
```

## Dữ liệu (data model)
```js
content.cards = [{ text, image? }]     // image = data: URL (ảnh upload đã thu nhỏ ≤480px)
options = { timer, timerTotalSeconds, shuffleQuestions, dealPlaces }
```
- `shuffleQuestions` dùng chung cờ chuẩn của engine (hiện nhãn "Shuffle item order").
- `dealPlaces` 1–10; đổi giá trị → `optionsNeedRestart` cho restart để bày lại.

## Âm thanh (đã map, tải từ đúng act — gói "playingcards")
Nguồn gốc + ghi chú: `D:\APP AND DATA\AWord-data\Source\Sound effect\SPEAKING CARDS\GHI CHU.md`.
intro · shuffle · tileAppear(×3) · tileFlip(×6) · restart · timesUp · menu · menuSubtle.
`sounds.restart`/`sounds.timeWarning` được engine tự gọi; còn lại template tự phát.

## Bẫy đã xử lý
- **animate() bị kẹt khi tab ẩn**: lúc lật bài, `fill:forwards` giữ `scaleX(0)` → thẻ vô hình.
  Đã sửa theo HUONG DAN CORE §animate: bước kết thúc **hủy animation + xoá inline transform** để
  thẻ luôn nghỉ ở trạng thái gốc (`transform:none`) dù onfinish không bắn. (Phát hiện khi test trong
  Browser pane ẩn — pane ẩn thì rendering dừng, animation đứng yên.)
- **Score/nav vô nghĩa**: game không điểm, nhưng engine luôn dựng chip điểm ✓ + nav ◀▶. mount() ẩn
  `.aw-top-score` + `.aw-nav` (visibility:hidden, khôi phục ở cleanup). KHÔNG sửa core.
- **Options thừa của Quiz**: panel Options mặc định có "Shuffle answer order", "Show answers",
  "Letters on answers" — vô nghĩa ở đây. Đã bật cờ có sẵn `hideLettersOption:true` (bỏ Letters), và
  trong `buildExtraOptions` **tỉa** nhóm "End of game" + ô "Shuffle answer order", đổi tên
  "Shuffle question order" → "Shuffle item order". Tỉa bọc trong try/catch (chỉ mỹ quan, không vỡ nếu
  core đổi). Kết quả panel: Timer · Shuffle item order · Number of deal places.
- **Thẻ có ảnh**: chữ co bằng autoFit trong vùng riêng `.aw-sc-cardtextwrap` (không tính phần ảnh).

## Đã test (test.html, 1/8/2026)
Deal/flip · deckCount giảm · Undo khôi phục đúng · Shuffle · hết bài khoá Deal · dealPlaces 1/3/6 lưới
đúng · Count down 3s → "Time's up" + khoá Deal · thẻ ảnh render · Options panel sạch + stepper 1–10 ·
Editor (12 dòng, badge, thumbnail, Cancel về game) · đổi theme Classroom không vỡ · **console sạch lỗi**.

## Chưa làm / để bản sau
- Nút "Submit answers" trong menu ☰ (engine dựng cứng) vô nghĩa ở game mở — bấm sẽ kết thúc lượt như
  hết giờ. Chấp nhận tạm.
- Save thật cần đăng nhập Firebase (test.html chưa có auth) — đã test tới bước validate, chưa test ghi.

## ĐỀ XUẤT SỬA CORE (không tự sửa — chờ session tổng)
1. Thêm cờ template kiểu `openEnded`/`hideScore` để engine tự **ẩn chip điểm + nav + mục "Submit
   answers"** cho game `scorable:false`, thay vì template phải tự ẩn bằng JS.
2. Thêm cờ ẩn nhóm Options theo template (vd `hideShuffleAnswers`, `hideShowAnswers`) để không phải
   tỉa DOM panel bằng tay trong `buildExtraOptions`.
3. Cho phép template khai báo option riêng "Number of deal places" qua API thay vì tự dựng stepper.

## Khi thầy DUYỆT (✅ ĐÃ CHỐT) mới làm — gộp vào trang cuối
- Thêm dòng vào `../../manifest.js` (type `speaking_cards`).
- Thêm `<link ... speaking-cards.css>` vào `index.html` gốc.
- Thêm vào `../../core/catalog.js` (built:true) để hiện ở picker "New activity".
- Thêm `speaking_cards` vào danh sách `ALL_TEMPLATES` trong `core/engine.js` (panel Template).
