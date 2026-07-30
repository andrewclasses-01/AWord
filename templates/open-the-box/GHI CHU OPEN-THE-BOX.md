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

### 29/7/2026 (đợt 7) — bảng kết thúc chuyển sang dùng CHUNG hệ thống ui.finish() với Quiz/Anagram
Thầy chốt hướng "sửa core/ ngay" (đã hỏi qua AskUserQuestion vì lúc đó có 1 phiên khác đang sửa
`core/icons.js` — rủi ro đã được thầy chấp nhận). Đây là thay đổi KIẾN TRÚC lớn nhất từ trước tới giờ
của Open the box: bỏ hẳn bảng Game Over tự dựng (đợt 5/6), chuyển sang gọi thẳng `ui.finish()` — CHÍNH
cơ chế Quiz/Anagram dùng — nên có NGAY LẬP TỨC, không cần viết lại: Leaderboard (màn riêng, xếp hạng cục
bộ), Show answers (màn riêng, so đáp án), Start again (remount sạch), Play a different template, cùng
Score/Time y hệt Quiz.

**Sửa `core/engine.js` (rất nhỏ, đã diff kỹ trước khi lưu — chỉ 4 chỗ)**: thêm biến dùng chung
`endTitle` (mặc định `"Game complete"`), `finish(raw)` đọc `raw.title` gán vào đó, `celebrate()` và
`showSummary()` đọc `endTitle` thay vì chữ hard-code cứng trước đây. **Mọi template khác không truyền
`title` thì hành vi y nguyên 100% như cũ** (Quiz/Anagram/Find the match/Type the answer đều không đổi).
Dùng 1 biến dùng chung (không phải tham số hàm) để khi bấm "Back" từ Leaderboard/Show answers quay lại
Summary vẫn giữ đúng tiêu đề gốc, không bị trả về "Game complete" giữa chừng.

**Sửa `open-the-box.js`**:
- Thêm hàm `finishRound(title)`: tự dựng `perQuestion[]`/`review[]` đúng khuôn CONG THUC MAU
  (`{question, answered, yourText, yourCorrect, correctText}`) từ `boxState[]` (mảng "unplayed"/
  "correct"/"locked") rồi gọi `ui.finish({..., title})`.
  - Ô đã **đúng** → `answered:true, yourCorrect:true`.
  - Ô đang **khoá** (mới sai, chưa gỡ khoá) → `answered:true, yourCorrect:false`, `yourText` lấy từ
    mảng MỚI THÊM `lastWrongText[]` (ghi lại đáp án sai gần nhất mỗi ô, phục vụ đúng màn Show answers).
  - Ô **chưa chơi** (kể cả ô từng sai nhưng đã được gỡ khoá lại) → `answered:false`. Đây là 1 sự
    ĐƠN GIẢN HOÁ có chủ đích: game này cho chơi lại nhiều lần/ô (khác Quiz chỉ 1 lần/câu) nên không thể
    ánh xạ hoàn hảo — ghi rõ trong code, không phải thiếu sót.
- Hết giờ (`gameOver()`) → sau khi zoom về lưới + rung + nổ → `finishRound("Game over")`.
- Mở hết TOÀN BỘ ô đúng trước khi hết giờ (thắng) → `finishRound("Game complete")` — đây LẦN ĐẦU TIÊN
  có "màn thắng" đầy đủ (trước đó đợt 5/6 chỉ có `ui.toast("All boxes opened!")` sơ sài).
- **Xoá hẳn** ~90 dòng code cũ: `showGameOverPanel()`, `statBlock()`, `resetGame()`, cùng 4 import
  không cần nữa (`addEntry/getEntries/getRank/updateName` từ `core/leaderboard.js`,
  `fmtSecsParts/ordinal` từ `core/utils.js`) — TOÀN BỘ việc lưu điểm/xếp hạng/tính thời gian giờ do
  chính `core/engine.js` lo (kể cả "Time" — không cần tự theo dõi `gameStartedAt` nữa, xem mục sửa sai
  bên dưới).
- Thêm `sounds: { restart: otbSound.restart, complete: otbSound.allSolved }` vào template — đúng cơ chế
  hook có sẵn `tpl.sounds` mà Anagram cũng dùng (không cần sửa `core/` gì thêm cho việc này).

**⚠️ SỬA SAI 1 nhận định của đợt 6**: đợt 6 từng "sửa lỗi" đồng hồ "Time" bằng cách dời mốc bắt đầu tính
giờ từ lúc mount() sang lúc mở ô đầu tiên, với lý do "mount() chạy ngay khi trang tải, trước cả khi bấm
PLAY". **Lý do đó SAI** — đọc kỹ `core/engine.js` xác nhận `tpl.mount()` chỉ chạy bên trong `begin()`,
mà `begin()` CHỈ được gọi khi bấm nút PLAY (`bigPlay.onclick`), giống hệt lúc engine tự đặt mốc
`startedAt` của chính nó. Vụ "Time tính sai" của đợt 6 nhiều khả năng chỉ là dữ liệu test bị nhiễu từ
các lần chạy trước (nhiều lần quên xoá `localStorage` giữa các lượt test). Dù vậy hướng sửa của đợt 6
(tính giờ từ lúc mở ô đầu) không sai/không hại gì — nhưng từ đợt 7 trở đi việc này KHÔNG CÒN QUAN TRỌNG
vì `core/engine.js` tự tính "Time" đúng chuẩn (từ lúc PLAY) cho mọi template kể cả Open the box, không
cần `open-the-box.js` tự làm nữa.

**Test bằng `javascript_tool`** (tự động click PLAY → mở ô → chọn đáp án, có ca cố tình để hết giờ và
ca tự động trả lời đúng hết cả 6 câu liên tiếp):
- Hết giờ (0/6, chưa trả lời gì) → bảng đúng **"GAME OVER"**, Score 0/6, Time đúng (~5.5s = 4s đếm
  ngược + hiệu ứng), đủ 4 nút Leaderboard/Show answers/Start again/Play a different template.
  - Show answers: hiện đúng cả 6 câu, "No answer" (đúng vì answered:false) + đáp án đúng tô xanh.
  - Leaderboard: bảng RỖNG (đúng, vì `answered=0` — luật có sẵn của engine "không lưu điểm nếu không
    trả lời câu nào", giống Quiz, không phải lỗi).
  - Start again: remount sạch, về đúng màn READY.
- Trả lời đúng cả 6/6 trước khi hết giờ (thắng) → bảng đúng **"GAME COMPLETE"** (khác "GAME OVER" — xác
  nhận `title` hoạt động đúng cho cả 2 chiều), Score 6/6.
- Chế độ Simple (không liên quan) test lại vẫn nguyên vẹn, không hỏng gì. 0 lỗi console suốt toàn bộ.

**File thay đổi đợt này**: `core/engine.js` (4 chỗ, đã diff xác nhận sạch), `templates/open-the-box/
open-the-box.js` (viết lại phần kết thúc ván), `templates/open-the-box/otb-sound.js` (mới, đợt 6),
`templates/open-the-box/sounds/*.mp3` (12 file copy từ Anagram, đợt 6).

**CHƯA LÀM / có thể hỏi thêm nếu thầy cần**: màn "Show answers" không phản ánh được LỊCH SỬ đầy đủ nếu
1 ô bị sai nhiều lần trước khi cuối cùng đúng (chỉ nhớ được lần sai GẦN NHẤT) — chấp nhận được vì đã ghi
rõ lý do trong code, chưa thấy cần thiết phải làm phức tạp hơn.

### 29/7/2026 (đợt 6) — thuật ngữ Ô SỐ/Ô CÂU HỎI, nút góc phải, zoom chậm cả 2 chiều, thanh giờ cao hơn, âm thanh Anagram
Thầy chốt tên gọi: **Ô SỐ** = ô trong lưới chưa mở (số), **Ô CÂU HỎI** = ô đã zoom to hiện câu hỏi+đáp
án — dùng 2 tên này cho nhất quán từ đây. Yêu cầu đợt này:
1. **Nút âm thanh + fullscreen về lại góc phải** (đợt 5 lỡ làm dồn vào giữa khi ẩn thanh Prev/Next).
   Nguyên nhân: `.aw-bottombar` của `core/engine.js` là CSS Grid `1fr auto 1fr` với 3 item auto-đặt theo
   thứ tự DOM; ẩn item giữa (`.aw-nav`) bằng `display:none` khiến nó bị loại khỏi auto-placement
   HOÀN TOÀN → item thứ 3 (nút loa+fullscreen) tự trượt vào cột GIỮA còn trống thay vì ở lại cột 3. Sửa
   bằng 1 dòng CSS ép `.aw-bottombar > .aw-tools { grid-column: 3; }` (vẫn không đụng core/).
2. **Tốc độ zoom CHẬM HƠN NỮA cả 2 chiều** (Ô SỐ→Ô CÂU HỎI và ngược lại) — gộp thành 2 hằng số dùng
   chung `ZOOM_TRANSFORM_MS=600`/`ZOOM_OPACITY_MS=420` (trước là 380/300ms) để 2 chiều luôn khớp tốc độ.
3. **Zoom mượt khi ĐÓNG Ô CÂU HỎI sau khi trả lời** (không chỉ lúc hết giờ như đợt 5) — trước đó bấm xong
   đáp án là "nhảy" thẳng về lưới không hiệu ứng. Refactor thêm hàm dùng chung `closeCardThen(afterFn)`
   (zoom Ô CÂU HỎI co lại đúng vị trí Ô SỐ gốc rồi mới gọi `afterFn`) — dùng ở CẢ 2 chỗ: `answer()` (sau
   khi chọn đáp án) và `gameOver()` (hết giờ), thay vì trước đây chỉ `gameOver()` có zoom.
4. **Thanh giờ dời lên ngang tầm điểm số + ô câu hỏi/đáp án cao hơn**: giảm hẳn `padding-top` của
   `.aw-otb-qcard` (1.4cqw→0.2cqw) và `margin-bottom` của `.aw-otb-q-topbar` (2.2cqw→0.9cqw) để thanh
   giờ nằm sát dưới thanh "✓ N" của engine (không thể chèn thẳng vào ĐÚNG hàng đó vì đó là chrome cố định
   của `core/engine.js`, đây là cách xích lại gần nhất mà không sửa core); phần cao dôi ra tự động chảy
   vào `.aw-otb-q-body` (đã có `flex:1 1 auto`) nên ô câu hỏi/đáp án tự cao hơn, không cần sửa gì thêm.
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA (nghiêm trọng)**: sau khi giảm padding, chữ trong Ô CÂU HỎI/đáp án tự nhiên
     BÉ TÍ HẲN ĐI dù câu ngắn — đo bằng `javascript_tool` (`getComputedStyle(card).getPropertyValue(
     '--fit')`) phát hiện `autoFit` luôn co về mức TỐI THIỂU 0.4 bất kể chữ dài hay ngắn. 2 lỗi cộng
     dồn:
     (a) `.aw-otb-q-question`/`.aw-otb-qtile` là flex/grid item không có `min-height:0` → mặc định
         `min-height:auto` khiến `scrollHeight` LUÔN BẰNG `clientHeight` của chính nó (nó tự "phình" vừa
         đủ chứ không bao giờ thật sự "tràn") → `measure()` của `autoFit` không đo được độ tràn thật.
         Sửa: thêm `min-height:0` cho `.aw-otb-q-question`, `.aw-otb-qtile`, `.aw-otb-q-answers`.
     (b) Ngay cả sau khi sửa (a), vẫn co về 0.4 — do tham số `slack` (khoảng an toàn autoFit chừa cho
         phần không đo được, vd bóng đổ/padding-bottom) đang tính `root.clientWidth*0.045`, một hằng số
         GIẮN VỚI padding CŨ (dày hơn) — sau khi giảm padding thật, phần dư thực tế nhỏ hơn slack yêu
         cầu → autoFit tưởng nhầm là tràn dù chữ vừa khít. Giảm hệ số xuống `*0.02` (khớp đúng lượng
         padding/bóng đổ còn lại thật) là hết co nhầm — đã đo lại `--fit` trả về đúng `1` cho câu ngắn.
     **Bài học: sau MỌI lần đổi padding/margin quanh vùng có autoFit, phải ĐO LẠI `--fit` bằng
     `javascript_tool` (không chỉ nhìn ảnh chụp) để chắc autoFit không âm thầm co sai** — nhìn ảnh chụp
     lúc đầu chỉ thấy "chữ hơi bé", không biết là do BUG hay do chữ dài thật.
5. **Âm thanh giống Anagram**: đã copy 12 file mp3 thật từ `templates/anagram/sounds/` sang
   `templates/open-the-box/sounds/` (KHÔNG cross-import — mỗi template giữ bản riêng, đúng quy ước tự
   chứa) + viết `otb-sound.js` phỏng đúng cấu trúc `anagram-sound.js` (pool ngẫu nhiên không lặp lại
   liên tiếp, tôn trọng nút tắt tiếng chung). Gán: mở Ô SỐ → `blocktilepickup*`; đúng → `blockchipminor*`;
   sai → `blockchipfail*`; hết giờ → `blockgametimeout`; Play again → `blockgamerestart`; mở hết toàn bộ
   Ô trước khi hết giờ → `blockgamesuccessful`.
- **Test bằng `javascript_tool`** xác nhận: nút loa/fullscreen về đúng góc phải; zoom mở/đóng đều mượt
  (~450-600ms, đo `getComputedStyle().transform` liên tục xác nhận scale/opacity đổi dần, không nhảy
  cứng) CẢ lúc trả lời xong lẫn lúc hết giờ; `--fit` trả về đúng `1` cho câu ngắn (không còn co nhầm).
  0 lỗi console suốt quá trình.
- **CHƯA LÀM — cần thầy quyết trước khi code** (xem câu hỏi trong hội thoại): bảng Game Over/Game
  Complete hợp nhất kiểu Quiz/Anagram (Leaderboard/Show answers/Start again/Play a different template).

### 29/7/2026 (đợt 5) — icon tích/khóa, ẩn nút Prev/Next, hiệu ứng zoom mượt, bảng Game Over đủ thông tin
Thầy test đợt 4 xong, yêu cầu thêm 1 loạt tinh chỉnh giao diện + hiệu ứng:
1. **Bỏ số trang + nút Next/Previous** dưới khung — game này bấm Ô BẤT KỲ chứ không phải chuỗi câu tuần
   tự nên thanh đó vô nghĩa. Không có API nào từ `ui` để ẩn thanh đó (thanh `.aw-nav` là chrome CỐ ĐỊNH
   của `core/engine.js`, không có cờ bật/tắt) — thay vì sửa `core/`, thêm 1 dòng CSS `.aw-nav{display:
   none}` NGAY TRONG `open-the-box.css`. Đây KHÔNG phải sửa core (không đụng file core nào) — chỉ vì
   trang chơi Open the box CHỈ nạp đúng CSS của chính nó nên rule này không ảnh hưởng game khác.
2. **Dấu tích ô đúng: trắng→xanh lá, to hơn**. Lý do dấu tích cũ không đổi màu được dù đã set CSS
   `color:#22c55e`: `icons.markCheck` của `core/icons.js` có màu **HARD-CODE cứng trong SVG** (`stroke=
   "#ffffff"`), không dùng `currentColor` nên CSS `color` không có tác dụng — icon đó vốn thiết kế để
   bay lên trên NỀN CÓ MÀU (Quiz), không phải để đổi màu tùy ý. Giải pháp: viết 1 SVG dấu tích RIÊNG
   (`ICON_CHECK_GREEN`, `stroke="currentColor"`) ngay trong `open-the-box.js` — KHÔNG thêm icon mới vào
   `core/icons.js` (đúng luật không sửa core).
3. **Ô sai: trắng đen + hình khóa (cùng vị trí/cỡ dấu tích)**. Hiểu đúng ý thầy: ô trả lời SAI giờ cũng
   **LẬT MỞ** (giống ô đúng) thay vì đóng lại như đợt 3 — hiện câu hỏi (xám) + khóa xám ở đúng vị trí
   thấp mà dấu tích dùng. Thêm `ICON_LOCK` (SVG khóa tự viết, `currentColor`). "Trắng đen" làm bằng
   `filter: grayscale(1)` lên cả mặt sau ô — rẻ hơn nhiều so với tính riêng bản xám cho từng theme.
4. **Hiệu ứng ZOOM mượt khi mở/đóng ô** — đây là việc nặng nhất đợt này:
   - Mở ô: `zoomCardFrom()` — trước khi `render()` xoá lưới, `openBox()` đo `getBoundingClientRect()`
     CHÍNH XÁC của ô vừa bấm (lưu `lastBoxRect`, toạ độ TƯƠNG ĐỐI so với `root`). Màn câu hỏi build xong
     thì "nhảy" tức thì về đúng vị trí/kích cỡ ô đó (transform scale+translate) rồi animate MƯỢT về
     `scale(1) translate(0)` — cảm giác ô "phình to" thành màn hỏi.
   - Hết giờ: `zoomCardTo()` — làm NGƯỢC LẠI (từ full màn thu nhỏ về đúng vị trí ô cũ) TRƯỚC KHI đổi
     sang lưới ô + rung + nổ + bảng Game Over (đúng thứ tự thầy yêu cầu: "zoom về bảng rồi mới rung").
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA**: `zoomCardTo()` bản đầu KHÔNG chạy mượt — nhảy thẳng gần như tức thì
     (đo bằng `javascript_tool` theo dõi `getComputedStyle(...).transform` mỗi 40ms mới phát hiện ra,
     nhìn ảnh chụp không thấy vì animation quá nhanh). Nguyên nhân: thiếu bước ÉP VẼ LẠI
     (`void card.offsetWidth`) giữa lúc đặt giá trị BAN ĐẦU và lúc BẬT transition + đổi sang giá trị
     ĐÍCH — trình duyệt gộp 2 lần đổi CSS làm một, không animate. `zoomCardFrom()` đã làm ĐÚNG bước ép vẽ
     lại này ngay từ đầu (đó là lý do nó chạy mượt ngay lần đầu); `zoomCardTo()` copy thiếu bước đó, đã
     sửa lại đúng cùng khuôn. **Bài học: mọi hàm animate bằng transform từ JS trong app này PHẢI ép vẽ
     lại (`void el.offsetWidth`) giữa bước "đặt giá trị đầu" và bước "bật transition + đổi giá trị
     cuối" — nếu chỉ dựa vào `requestAnimationFrame` là CHƯA CHẮC đủ (đã thấy chạy sai thật với rAF).**
   - Các ô đáp án xuất hiện so le nhẹ (`animation-delay` theo thứ tự) qua keyframe `aw-otb-qtile-in`
     (phóng to dần từ 80% + mờ dần vào) — dùng CSS `animation` thuần (không phải `element.animate()`
     nên không cần setTimeout dự phòng riêng, hiệu ứng chỉ trang trí không quyết định luồng chơi).
5. **Bảng Game Over đủ thông tin như Leaderboard**: gộp Score + Time + hạng + BẢNG XẾP HẠNG cục bộ
   (top 10, `core/leaderboard.js` — tiện ích dùng chung, KHÔNG phải core-internal, an toàn để `import`
   thẳng) + Ô NHẬP TÊN sửa được cho lượt này (y hệt UX bảng Leaderboard của Quiz) + nút Play again — tất
   cả trong 1 bảng (Open the box không có "Show answers" nên không cần tách 2 màn như Quiz).
   - **BẪY THẬT ĐÃ GẶP VÀ SỬA**: "Time" ban đầu tính SAI — đo từ lúc `gameStartedAt = Date.now()` đặt
     NGAY LÚC MOUNT, nhưng `mount()` chạy NGAY khi trang tải xong (đằng sau màn PLAY, TRƯỚC khi thầy bấm
     PLAY) → "Time" cộng luôn cả thời gian thầy đứng nhìn màn PLAY, sai hoàn toàn ý nghĩa "thời gian
     chơi". Sửa: dời mốc bắt đầu tính giờ sang **lúc mở Ô ĐẦU TIÊN** (trong `openBox()`), reset về
     `null` mỗi khi "Play again".
- **Test bằng `javascript_tool`** (đo trực tiếp DOM/`getComputedStyle` theo mốc thời gian thay vì chỉ
  chụp ảnh — animation quá nhanh để chụp đúng khung hình): xác nhận zoom-in mượt (~380ms, transform về
  đúng `none`, dọn sạch inline style); sau khi sửa, zoom-out cũng mượt (~280ms, scale giảm dần 1→0.23,
  opacity giảm dần 1→0.15) RỒI MỚI rung (`shaking:6`) RỒI MỚI nổ (`exploding:6`) RỒI MỚI hiện bảng — đúng
  thứ tự thầy yêu cầu; bảng Game Over hiện đúng Score/Time (đã tính đúng từ lúc mở ô đầu, vd "4.4s" khớp
  đúng tổng 3s đếm ngược + ~1.5s hiệu ứng)/hạng/bảng xếp hạng/tên sửa được. Kiểm tra trực quan qua
  screenshot: dấu tích xanh lá to hơn đúng; ô sai xám trắng đen + khóa cùng vị trí/cỡ dấu tích đúng; số
  lẻ đáp án (3 câu) ô cuối tự giãn hết hàng đúng. 0 lỗi console suốt toàn bộ quá trình test.
- Dữ liệu mẫu **ĐANG TIẾP TỤC để tạm ở chế độ Questions** (giống cảnh báo đợt 4) — sẽ trả về 9 câu
  Speaking prompts SAU KHI thầy xác nhận xong toàn bộ các đợt tinh chỉnh này.

### 29/7/2026 (đợt 4) — bố cục màn hỏi đổi sang TRÁI/PHẢI theo ảnh Wordwall thật thầy gửi
Thầy tự test đợt 3 (xác nhận cơ chế đúng-sai-khoá-GameOver chạy tốt), nhưng gửi thêm 1 ảnh chụp màn hỏi
thật của Wordwall và yêu cầu đổi GIAO DIỆN màn hỏi cho giống: **câu hỏi là 1 Ô LỚN bên TRÁI, 4 đáp án xếp
lưới 2×2 bên PHẢI** (khác hẳn bố cục "câu hỏi trên — đáp án dưới" mà `quiz.js` gốc của app dùng — ảnh
thầy gửi là chụp từ Wordwall thật, không phải Quiz của app), kèm **đồng hồ số "0:10" + thanh giờ nằm
CHUNG 1 hàng ở trên cùng**.
- **`open-the-box.js`**: viết lại `renderQuestion()` — thêm hàng `.aw-otb-q-topbar` (đồng hồ số tự chế +
  thanh giờ, KHÔNG dùng đồng hồ có sẵn của `core/engine.js` vì đồng hồ đó chỉ hỗ trợ 1 kiểu đếm cố định
  cho cả ván, không có API cho template tự set chữ, mà cơ chế "reset khi đúng / chạy tiếp khi sai" của
  đợt này cần logic riêng — xem lý do đầy đủ ở đợt 3). Đồng hồ số chạy bằng `setInterval` 250ms chỉ để
  CẬP NHẬT CHỮ (trang trí), việc "hết giờ" thật vẫn do đúng 1 `setTimeout` như đợt 3 quyết định (không
  đổi độ chính xác). Answers giờ là **CSS Grid 2 cột cố định** (thay flex-wrap nhiều cột theo số lượng) —
  số lẻ (3 hoặc 5 đáp án) thì ô cuối tự giãn hết hàng (`grid-column:1/-1`) cho khỏi trống nửa hàng.
- **`open-the-box.css`**: `.aw-otb-q-body` là flex-row chứa `.aw-otb-q-question` (giờ LÀ 1 tile tô đặc
  màu xanh, không còn chỉ là chữ trần) bên trái + `.aw-otb-q-answers` (grid 2 cột) bên phải; chữ đáp án
  ban đầu neo góc dưới-trái (thử theo cảm giác), thầy chưa góp ý nhưng tự so ảnh thấy lệch — đã sửa lại
  **căn giữa cả ô** (giống ảnh mẫu) ngay trong đợt này, không cần thầy báo thêm.
- **Test qua `test.html`** (dữ liệu mẫu tạm Questions mode 6 câu — ĐANG ĐỂ TẠM Ở CHẾ ĐỘ NÀY, xem cảnh báo
  dưới): xác nhận bố cục đúng ảnh mẫu (đồng hồ+thanh giờ 1 hàng trên, câu hỏi trái, 2×2 đáp án phải, chữ
  đáp án căn giữa), test lại trả lời đúng vẫn cộng điểm + hộp giữ mở đúng như đợt 3 (không hỏng cơ chế
  cũ khi đổi giao diện). 0 lỗi console.
- ⚠️ **CẢNH BÁO cho phiên sau / cuối buổi**: `sample-open-the-box.js` **ĐANG TẠM ở chế độ Questions**
  (6 câu vocab) để thầy test trực tiếp qua link cũ mà không cần đổi gì — **PHẢI trả lại đúng 9 câu
  Speaking prompts (Simple mode) SAU KHI thầy xác nhận xong**, đừng quên (bài học từ lần thầy report
  "chưa thấy câu hỏi" — do session trước lỡ trả về Simple mode ngay sau khi tự test xong, thầy F5 vào
  đúng lúc đó nên không thấy gì).

### 29/7/2026 (đợt 3) — Questions mode viết lại HOÀN TOÀN: quiz-in-a-box + đồng hồ sống còn + Game Over
Thầy yêu cầu tính năng LỚN, đổi hẳn bản chất chế độ "Questions": trước đây bấm hộp chỉ LẬT xem câu hỏi +
đáp án (không tương tác); nay bấm hộp phải hiện MÀN CHỌN ĐÁP ÁN kiểu Quiz thật + 1 đồng hồ đếm lùi DÙNG
CHUNG cho cả ván (không phải mỗi câu 1 đồng hồ riêng như Quiz). Đã hỏi thầy 4 câu qua AskUserQuestion để
chốt đúng luật trước khi code (đồng hồ chạy khi nào / màn Game Over ra sao / có điểm không / ô sau khi
trả lời ra sao) — thầy trả lời rất chi tiết, tóm tắt luật đã code đúng 100% theo mô tả của thầy:
- Đồng hồ **CHỈ chạy khi đang có 1 câu hỏi mở** (đứng yên lúc đang nhìn lưới ô chọn câu tiếp).
- Đúng → **điểm +1, đồng hồ RESET về đủ giây** (số giây cấu hình ở Options, mặc định 15s), ô đó
  **giữ nguyên mở vĩnh viễn** (hiện câu hỏi + đáp án đúng), thêm **dấu tích xanh nhỏ đặt THẤP** dưới đáy ô
  (không đè lên chữ câu hỏi — làm đúng yêu cầu bằng CSS `position:absolute; bottom:...`).
- Sai → **đồng hồ KHÔNG reset, tiếp tục chạy tiếp** từ mức đang có sang câu kế; ô đó **đóng lại, khoá
  tạm** (không bấm mở lại được, hiện xám mờ) **cho đến khi có 1 ô KHÁC được trả lời đúng** (mọi ô đang bị
  khoá cùng lúc đó thì MỞ LẠI HẾT, không phải riêng ô vừa sai) — đã đọc kỹ câu trả lời của thầy để suy ra
  quy tắc "khoá theo NHÓM, mở theo đợt đúng kế tiếp" này (thầy không nói rõ 1-ô-hay-nhiều-ô, tự suy luận
  hợp lý nhất từ câu "không được chọn lại ô vừa sai cho đến khi có 1 ô đúng khác").
- Hết giờ (đồng hồ về 0, luôn xảy ra khi đang mở 1 câu) → **GAME OVER**: quay lại lưới ô → RUNG toàn bộ ô
  → NỔ tung từng ô (so le nhẹ) → bảng kết thúc **giống hệt bố cục "Game complete" của Quiz** (thầy gửi
  ảnh) nhưng đổi chữ thành **"GAME OVER"**, có Score + nút **Play again** (reset lại từ đầu, không thoát
  ra ngoài game).
- Trả lời đúng có **đếm điểm** (hiện ở góc trên phải, dùng lại `ui.setScore`).

**Quyết định kiến trúc quan trọng — KHÔNG gọi `ui.finish()`**: dù giờ Questions mode CÓ điểm + CÓ kết
thúc (khác hẳn lý do gốc "template không có finish" ở đầu file này), vẫn KHÔNG dùng `ui.finish()` của
engine vì 2 lý do: (1) dòng chữ "GAME COMPLETE" ở `core/engine.js` dòng ~591 đang **hard-code cứng**,
không có cách đổi thành "GAME OVER" mà không sửa `core/` (luật số 1 — KHÔNG session template nào tự sửa
core, và **lúc code đợt này có 1 phiên Claude KHÁC đang sửa `core/engine.js` cùng lúc thật** — đã hỏi
thầy xác nhận trước, xem `APP_MASTER.md`); (2) `ui.finish()` kéo theo TOÀN BỘ luồng nộp bài/leaderboard/
assignment của engine — không hợp với 1 mini-game "thua thì Play again" mang tính giải trí lớp học. Giải
pháp: **tự dựng bảng Game Over** bằng cách TÁI DÙNG các class CSS chung có sẵn trong `core/app.css`
(`.aw-backdrop`/`.aw-panel`/`.aw-panel-head`/`.aw-sum-stats`/`.aw-panel-items`/`.aw-panel-item` — đây là
class DÙNG CHUNG toàn app, không phải riêng Quiz, nên dùng thoải mái không tính là "sửa core"), y hệt
cách `core/engine.js` tự dựng bảng "GAME COMPLETE" — chỉ đổi chữ tiêu đề + nút. Không đụng 1 dòng nào
trong `core/`.
- **Màn chọn đáp án** cũng KHÔNG dùng lại `.aw-quiz-*` của `quiz.js` (class đó chỉ có trong `quiz.css`,
  mà trang chơi Open the box chỉ nạp CSS của chính nó — xem `test.html` — nên `.aw-quiz-tile` sẽ KHÔNG có
  style gì nếu dùng nhầm). Đã tự viết bộ class riêng `.aw-otb-q*` PHỎNG THEO đúng cấu trúc/hành vi của
  `quiz.js` (câu hỏi to trên cùng, ô đáp án 3D tô màu, dấu ✓/✗ bay lên dùng lại `.aw-mark-fly`/
  `.aw-tile-badge` — 2 class NÀY thật sự dùng chung trong `core/app.css`, an toàn khi tái dùng).
- **Đồng hồ = 1 thanh CSS `transition: width Xs linear`** (không phải vòng lặp `setInterval`) — mượt và
  nhẹ. Bắt sự kiện "hết giờ" bằng `setTimeout` cùng thời lượng (KHÔNG dùng `transitionend`) — đúng tinh
  thần "phải có phương án dự phòng khi tab ẩn" mà `CONG THUC MAU.md` yêu cầu cho `element.animate()`.
  Giây còn lại khi trả lời sớm được tính bằng `performance.now()` chứ không đoán từ CSS, để chuyển đúng
  số giây còn dư sang câu kế (trường hợp sai) hoặc reset đủ (trường hợp đúng).
- **Option mới**: "Question time" (giây, stepper 3–59, mặc định 15) qua `buildExtraOptions` — engine gọi
  hàm này sẵn có, không cần sửa `core/` (đúng cơ chế mở rộng Options đã có từ đợt Anagram).
- **Không đổi** `mode:"simple"` — vẫn y nguyên hành vi lật-xem cũ, KHÔNG điểm KHÔNG hẹn giờ (tách hẳn
  thành hàm `mountSimple` riêng, hàm `mountQuestions` mới hoàn toàn lo phần tương tác trên).
- **Test qua `test.html`** (dữ liệu mẫu tạm 6 câu, đã trả về 9 câu Speaking gốc sau khi xong): xác nhận
  đúng cả 5 luật ở trên bằng browser thật — trả lời đúng giữ mở + tích xanh thấp, trả lời sai khoá xám +
  quay lưới, trả lời đúng Ô KHÁC thì ô đang khoá tự mở lại, hết giờ tự rung→nổ→bảng GAME OVER đúng
  Score/6 + Play again, đổi Style→Basic thì cả lưới ô VÀ 3-4 ô đáp án đều tự đồng nhất về navy đúng luật
  theme (dùng lại đúng chuỗi `var(--aw-tile-fixed, var(--otb-c,...)))` như quiz.js). `grep
  "transform:.*translate|animation:"` xác nhận không dính bẫy mục 3.5 (phần tử duy nhất định vị bằng
  transform — dấu tích xanh thấp — không có animation riêng). 0 lỗi console suốt quá trình.
- **Chưa làm / có thể hỏi thêm sau nếu thầy cần**: chưa có màn "thắng" riêng khi mở hết TẤT CẢ ô đúng
  trước khi hết giờ (hiện chỉ `ui.toast("All boxes opened!")` nhẹ nhàng — thầy không yêu cầu màn thắng
  nên chưa tự vẽ thêm, tránh làm dư việc); `options.boxesAutoClose` không áp dụng cho Questions mode nữa
  (chỉ còn ý nghĩa ở Simple mode).

### 29/7/2026 (đợt 2) — đổi sang nền TÔ ĐẶC màu kiểu ô đáp án Quiz (thầy gửi thêm ảnh 40 ô + ảnh Quiz)
- Sau đợt 1 (trắng + viền màu, xem log dưới), thầy gửi thêm 1 ảnh 40 ô THẬT (tô đặc màu, không viền
  trắng) + 1 ảnh CHÍNH Quiz của app (để chỉ rõ "nền ô" mong muốn = giống hệt ô đáp án Quiz).
- **`open-the-box.js`**: đổi `PALETTE` từ 5 màu tự chọn sang **ĐÚNG 8 màu của `quiz.js`** (blue/cyan/
  emerald/amber/orange/red/teal/violet) — đồng bộ màu thương hiệu 100% với Quiz, xoay theo cột như cũ.
  Thêm `--num-size` tính TỪ CỠ Ô THẬT (`size * 0.46`, đơn vị px) thay vì cqw cố định theo bề rộng khung —
  lý do: cỡ ô giờ thay đổi theo số lượng hộp (đợt 1), nếu số vẫn cqw cố định thì lưới ít hộp (ô to) số sẽ
  nhỏ xíu, lưới nhiều hộp (ô nhỏ) số sẽ tràn — phải tính theo cỡ Ô THẬT mới đúng ý "to hết mức cân đối".
- **`open-the-box.css`**: `.aw-otb-face-front` đổi hẳn sang mẫu y hệt `.aw-quiz-tile` — nền TÔ ĐẶC màu
  (`background: var(--tile-eff)`) + bóng đổ "lip" đáy 3D (`var(--aw-tile-shadow, ...)`) + chữ trắng đậm,
  bỏ viền trắng + góc gấp giấy của đợt 1 (ảnh mới không có góc gấp). Vẫn giữ chuỗi fallback
  `var(--aw-tile-fixed, var(--otb-c,...))` nên theme Basic vẫn ép 1 màu đúng như trước.
- **Test qua `test.html`**: 9 ô + thử tạm 40 ô — khớp gần như y hệt ảnh 40 ô thầy gửi, số 2 chữ số vẫn
  to rõ không tràn; trả sample về 9 câu gốc sau khi test. 0 lỗi console.
- **CHƯA làm** (việc lớn thầy yêu cầu thêm, đang hỏi thầy rõ phạm vi trước khi code — xem mục "ĐỀ XUẤT
  SỬA CORE" và phần hỏi thầy bên dưới): bấm mở 1 ô → hiện màn CHỌN ĐÁP ÁN kiểu Quiz (câu hỏi + A-D) thay
  vì chỉ hiện chữ; 1 thanh thời gian CHUNG chạy lùi suốt ván (không phải mỗi câu 1 đồng hồ riêng như
  Quiz) — đúng thì reset về đầy, sai thì tiếp tục chạy, về 0 thì Game Over. Đây là thay đổi LỚN: hiện
  Open the box CHỦ ĐÍCH không điểm/không kết thúc (`scorable:false`, không gọi `ui.finish()`) — nếu làm
  đúng ý thầy thì chế độ "Questions" sẽ CẦN điểm + màn kết thúc, khác hẳn thiết kế gốc. Phải thầy chốt
  rõ hành vi rồi mới code (đúng quy tắc "tính năng lớn: nghiên cứu + báo trước, chờ ok build").

### 29/7/2026 (đợt 1) — sửa hình dạng ô theo ảnh mẫu thật của Wordwall (thầy gửi ảnh 50 ô)
- Thầy gửi ảnh chụp màn Open the box thật (wordwall.net): 50 ô hình VUÔNG, viền màu xoay theo cột
  (cam→vàng→xanh lá→xanh dương→tím→lặp lại), góc dưới-phải có nếp gấp giấy nhỏ, luôn canh giữa khung.
- **`open-the-box.js`**: thêm `bestFit(w,h,gap,n)` — tự tìm số cột/kích cỡ ô để N ô VUÔNG lấp đầy vùng
  lưới lớn nhất có thể (bài toán 2D mà CSS Grid thuần không tự giải được vì bề rộng cột và chiều cao
  hàng độc lập nhau). Gọi lại mỗi lần `render()` + qua `ResizeObserver` gắn vào `root` (bắt cả lúc bật
  fullscreen). Thêm `PALETTE` 5 màu (cam/vàng/xanh lá/xanh dương/tím — CÙNG mã màu quiz.js đã dùng cho
  bộ 8 màu của nó, giữ đồng bộ màu thương hiệu) + `colorBoxes()` gán màu viền theo `(cột % 5)`.
- **`open-the-box.css`**: `.aw-otb-grid` đổi sang `repeat(var(--cols), var(--cell))` (2 biến JS tính ra)
  thay `auto-fill/minmax` cũ; mặt trước ô đổi nền trắng + viền màu (`--otb-c`/`--otb-d` set trong JS) qua
  chuỗi fallback `var(--aw-tile-fixed, var(--otb-c, ...))` — **giống hệt cách quiz.js đã làm** nên theme
  Basic (ép mọi ô 1 màu) vẫn ăn đúng, đã test đổi Style→Basic xác nhận toàn bộ viền về navy đồng nhất.
  Thêm góc gấp giấy nhỏ (`::after` tam giác xám nhạt góc dưới-phải).
- **Test qua `test.html` (browser thật)**: 9 ô mẫu đúng như ảnh (5+4, canh giữa); đổi tạm dữ liệu mẫu
  lên 50 ô để so ảnh — ra ĐÚNG bố cục 10×5 giống ảnh thầy gửi, màu lặp đúng chu kỳ 5 cột, không tràn
  khung; bấm mở ô lật 3D + hiện nội dung bình thường; đổi Style Classic→Basic màu viền tự đồng nhất;
  0 lỗi console. Đã trả sample về đúng 9 câu speaking prompts ban đầu sau khi test xong.
- Chưa đổi: cách khoanh vùng lưới (topbar/nav) — thầy chỉ yêu cầu sửa HÌNH DẠNG Ô, chưa đụng phần khác.

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
