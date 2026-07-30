# GHI CHÚ — TEMPLATE FIND THE MATCH

## TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT (31/7/2026, đợt 2 — bấm sai cũng trượt câu + đếm ngược 3-2-1 + ting đếm giờ, xem nhật ký dưới)

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/05-FIND-THE-MATCH.md` (cách chơi, options, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `find-the-match.js` — module game, `type: "find_the_match"`, `scorable: true`.
   - `find-the-match.css` — giao diện riêng, mọi class prefix `.aw-ftm-`.
   - `sample-find-the-match.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/find-the-match/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Dữ liệu là các cặp {keyword ↔ definition}. Màn hình hiện 1 prompt + nhiều lựa chọn; chạm lựa chọn khớp thì cặp đó bị loại; lặp đến hết. Có lives + speed (đáp án trôi). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `find-the-match.js`/`.css`/`sample-find-the-match.js` tạo mới, `type: "find_the_match"` (khớp
  `core/catalog.js`).
- **KHÁC Quiz/Anagram ở chỗ**: đây KHÔNG phải màn "1 câu tại 1 thời điểm" — cả bàn cờ ở lại màn hình.
  1 KEYWORD làm prompt trên cùng + LƯỚI mọi DEFINITION còn lại bên dưới (đáp án đúng + toàn bộ definition
  của các cặp khác làm nhiễu, không giới hạn vài lựa chọn). Chạm đúng → tile mờ dần rồi bị XOÁ khỏi DOM
  (lưới tự dồn lại), prompt đổi sang cặp chưa giải kế tiếp. Vì vậy KHÔNG dùng nút ◁▷ (prev/next luôn
  `null`) — thanh "x of N" dùng để BÁO TIẾN ĐỘ (số cặp đã ghép/tổng) chứ không phải phân trang.
- Chạm SAI: tile rung nhẹ (KHÔNG đổi màu, đúng luật), không bị loại, thử lại được. Có **LIVES tuỳ chọn**
  (`options.lives`, số hoặc `null`=không giới hạn) — tự vẽ hàng ♥ trong `root` (engine không có API hiển
  thị lives); hết mạng → tự kết thúc game sớm (đã test 3 mạng, chạm sai 3 lần → Game Complete 0/8 đúng).
- **Điểm = số cặp đã ghép được tới cuối ván** (không phạt nếu ghép đúng sau vài lần chạm sai — đây là
  game "tìm kiếm", khác Quiz/Anagram "1 phát ăn ngay"). `review[]`: `yourText`/`correctText` đều là
  definition đúng khi đã ghép xong, `null` nếu chưa ghép (hết giờ/hết mạng/Submit sớm).
- Phím số 1-9 chọn theo THỨ TỰ Ô CÒN HIỆN TRÊN LƯỚI (không phải theo cặp cố định, vì lưới dồn lại liên
  tục sau mỗi lần ghép đúng).
- **Test qua `test.html` (browser thật)**: ghép đúng → tile biến mất + prompt đổi + điểm +1; ghép sai →
  rung, không biến mất; ghép hết 8/8 tự Game Complete đúng điểm/thời gian; Show answers hiện đủ 8 dòng;
  bật thử `lives:3`, chạm sai 3 lần → tự kết thúc 0/8 đúng như thiết kế (đã trả `lives` mẫu về `null`
  sau khi test xong). 0 lỗi console suốt quá trình. Grep `transform:.*translate|animation:` trong CSS —
  chỉ có `.aw-ftm-tile.is-shake` (rung translateX) trên phần tử định vị bằng LƯỚI (không phải transform
  căn giữa) nên KHÔNG dính bẫy mục 3.5 của CONG THUC MAU.md.
- Chưa làm: "Speed" (đáp án trôi/tự động biến mất theo thời gian, docs mục 3) — MVP dùng "Wait for
  answer" (đợi vô hạn) mặc định của Wordwall, chưa làm speed tăng dần; không phải bug, là phạm vi để
  ngỏ nếu thầy cần sau.

### 30/7/2026 — viết lại theo brief thầy đưa (ảnh tham khảo + mô tả tốc độ/lặp lại)
- **ĐẢO NGƯỢC vai trò so với bản 24/7**: trước đây Keyword làm prompt + lưới Definition; giờ đúng
  Wordwall thật: **Definition (câu hỏi) chạy ở trên, Keyword (chữ ngắn) là các ô màu trong lưới**.
  Cấu trúc dữ liệu `{keyword, definition}` không đổi, chỉ đổi field nào hiển thị ở đâu.
- **Speed (0-10, Option mới)**: 0 = như cũ, đợi vô hạn. 1-10 = câu hỏi tự trượt sang câu tiếp theo sau
  1 khoảng dừng (dừng dài+trượt chậm ở 1, dừng ngắn+trượt nhanh ở 10) — con số mili-giây trong
  `pauseMsFor`/`moveMsFor` là ước lượng theo cảm giác, CHƯA đo theo Wordwall thật, thầy thử thấy
  nhanh/chậm quá thì báo để chỉnh.
- **Option mới "Unanswered questions"**: "Show each question once" (mặc định, hết giờ = bỏ luôn, xoá ô)
  vs "Repeat questions until correct" (hết giờ = xếp lại cuối hàng đợi, hỏi lại sau).
- **Option mới "Remove corrects"** (mặc định bật = ô biến mất như bản cũ; tắt = ô ở lại, mờ đi + có dấu
  ✓ nhỏ đọng lại `.aw-tile-badge`, không bấm được nữa).
- **Màu ô Keyword**: dùng lại đúng bộ 8 màu của Open the box/Quiz (PALETTE cố định theo vị trí trong
  `choiceOrder`, không đổi màu khi lưới dồn lại) — tôn trọng `--aw-tile-fixed` nếu theme (vd Basic) ép
  1 màu, giống hệt cơ chế Open the box.
- **Trượt câu hỏi**: `.aw-ftm-prompt` cố tình căn giữa bằng `margin:0 auto` (KHÔNG `left:50%+transform`)
  để `element.animate()` dùng `transform:translateX` an toàn (không đụng bẫy mục 3.5 CONG THUC MAU.md).
  Có `setTimeout` dự phòng cho `.animate()` theo đúng luật.
- **Content editor mới** (`find-the-match-editor.js`, gần như copy `anagram-editor.js`): bảng
  Keyword | Definition, kéo-thả đổi thứ tự, dán từ Excel, nhân bản/xoá dòng — **tối đa 40 cặp** (thầy
  chốt khi brief, cao hơn 30 trong tài liệu nghiên cứu gốc), tối thiểu 3.
- **Test qua `test.html` (browser thật)**: chơi bằng Speed=0 — ghép đúng/sai/hoàn thành 8/8 đều đúng,
  Show answers hiện đúng (question=definition, correctText=keyword). Chơi bằng Speed=4 — tự trượt câu
  đúng nhịp, ô bị bỏ qua biến mất, Game Complete 0/8 khi để trôi hết không bấm kịp. Đổi theme Basic —
  toàn bộ ô về 1 màu đúng như Quiz/Open the box, không vỡ layout. Editor: thêm dòng mới, Cancel hoạt
  động đúng. 0 lỗi console suốt quá trình.
- **CHƯA tự mắt kiểm tra** (thầy hoặc phiên sau nên thử thêm): "Repeat questions until correct" thật sự
  quay vòng đúng; `removeCorrects:false` (ô ở lại có dấu ✓); lives (`options.lives`) kết hợp với Speed;
  fullscreen trên khung 16:9; kéo-thả đổi thứ tự trong editor; dán 2 cột từ Excel thật.
- **CHƯA import vào `main.js` / CHƯA đổi `built:true`** — theo đúng quy trình (giống Open the box/Type
  the answer trước đó: 2 việc này chỉ làm CÙNG LÚC lúc thầy duyệt gộp trang chủ). Test qua
  `http://localhost:5510/templates/find-the-match/test.html`.

### 31/7/2026 — cơ chế "băng chuyền" (conveyor) + âm thanh thật + lưới 5 hàng cố định
Thầy gửi 5 yêu cầu điều chỉnh cụ thể. Tóm tắt từng việc:

1. **Lưới luôn 5 hàng, căn giữa, KHÔNG dồn lại khi 1 ô biến mất.** Số cột = `ceil(tổng số cặp / 5)`,
   tính 1 LẦN lúc mount (không đổi trong ván). Mỗi ô Keyword được gán CỐ ĐỊNH `grid-row`/`grid-column`
   ngay từ đầu (không dùng auto-placement) → xoá 1 ô chỉ để lại chỗ trống, các ô khác đứng nguyên. Lưới
   dùng cột/hàng kích thước CỐ ĐỊNH (không phải `1fr` giãn hết cỡ) + `justify-content/align-content:
   center` → luôn nằm giữa màn hình bất kể có bao nhiêu cặp (3-40). Đã test: xoá 1 ô giữa lưới, các ô
   khác (kể cả ô ở hàng dưới) không nhảy vị trí — đúng yêu cầu.
2. **Cơ chế "băng chuyền"**: câu hỏi (definition) trượt liên tục CHẬM từ mép trái → giữa màn → mép phải,
   dùng `element.animate({transform:translateX})` (3 giai đoạn: enter 900ms cố định → dừng/trôi tiếp
   theo Speed → nếu bấm đúng thì trượt tiếp từ VỊ TRÍ HIỆN TẠI ra hẳn mép phải, dùng kỹ thuật
   `commitStyles()+cancel()` rồi `.animate()` 1-keyframe để không bị giật khi ngắt animation giữa
   chừng). Câu tiếp theo CHỈ bắt đầu trượt vào sau khi câu cũ đã trượt HẲN ra khỏi màn hình. ~~Giả định
   tự quyết ban đầu: bấm SAI KHÔNG làm câu hỏi trượt đi~~ — **thầy đã xác nhận đoán này SAI (đợt 2 cùng
   ngày)**, xem mục "31/7/2026, đợt 2" bên dưới: bấm sai giờ CŨNG làm câu hỏi trượt đi.
3. **Âm thanh thật** từ `D:\APP AND DATA\AWord-data\Source\Sound effect\FIND THE MATCH` (module mới
   `ftm-sound.js`, file mp3 copy vào `templates/find-the-match/sounds/`): Intro (Play) · Go (lúc đồng hồ
   bắt đầu chạy) · ConveyorAppear (mỗi lần câu hỏi bắt đầu trượt vào) · ConveyorCentred (câu hỏi tới
   giữa) · ConveyorLeave (câu hỏi bắt đầu trôi ra, dù do bấm đúng hay do hết giờ) · Correct/Incorrect
   (pool 3 biến thể) · GameCompleted/GameOver/TimesUp (`finish(reason)` tự chọn đúng 1 trong 3 theo lý
   do kết thúc: xong hết = Completed, hết mạng = GameOver, hết giờ đếm ngược = TimesUp) · Restart ·
   ClockTick (mỗi giây, tự set `setInterval` riêng vì engine không có hook tick sẵn). **CHƯA gắn được**
   Menu/Leaderboard/RevealAnswers — không có hook nào ở `core/engine.js` cho 3 sự kiện này, file gốc để
   nguyên trong thư mục nguồn, chưa copy — cần "ĐỀ XUẤT SỬA CORE" nếu thầy muốn dùng.
4. **Speed đổi thành thanh trượt** (`<input type="range">`) thay vì dropdown, có nhãn số hiện luôn bên
   cạnh.
5. **Ẩn hẳn 2 nút mũi tên trước/sau** — chỉ còn "x of y". Làm bằng CSS `:has()` (
   `.aw-playarea:has(> .aw-ftm-card) ~ .aw-bottombar .aw-navbtn { display:none; }`) trong
   `find-the-match.css` — CHỈ áp dụng khi Find the match đang mở, không đụng `core/engine.js`, không
   ảnh hưởng nút mũi tên của Quiz/Anagram/... Đã kiểm bằng accessibility tree: 2 nút biến mất hoàn toàn
   (không chỉ ẩn mắt) khi Find the match chạy.
6. **Đường kẻ đứt** giữa khu câu hỏi và khu lưới đáp án (`.aw-ftm-divider`) — CSS đơn giản, không hiệu ứng.
- **Test qua `test.html`**: xoá ô đúng giữa lưới → các ô khác không xê dịch (đúng yêu cầu 1). Speed=3 →
  câu hỏi tự trượt hết band, ô bị bỏ lỡ biến mất đúng lúc, Game Complete 0/8 khi để trôi hết — dùng
  `javascript_tool` đo `transform` thực tế để xác nhận không bị kẹt (khung hình tưởng như "đứng yên" hoá
  ra chỉ là 400ms chờ trước khi hiện Game Complete, không phải lỗi). Bấm đúng → ô biến mất, câu hỏi
  trượt tiếp ra phải, câu mới trượt vào, các ô khác giữ nguyên vị trí. Tắt "Remove corrects" → ô ở lại,
  mờ nhẹ, có dấu ✓ nhỏ — **ghi chú thẩm mỹ**: dấu ✓ hơi đè lên chữ khi từ khoá ngắn (vd "R✓e"), có thể
  cần chỉnh vị trí dấu nếu thầy thấy chưa đẹp. Tất cả file .mp3 load 200 OK (kiểm qua Network), không lỗi
  console.
- **CHƯA tự kiểm**: nghe thật xem 12 file âm thanh có đúng ý (chỉ xem network status, không nghe được
  qua công cụ chụp ảnh); "Repeat questions until correct" có thật sự quay vòng đúng; layout ở N gần 40
  cặp (8 cột) trên màn hình thật/TOMKO; fullscreen.
- **CHƯA import vào `main.js`, CHƯA đổi `built:true`** — vẫn theo đúng quy trình, chờ thầy duyệt xong
  mới gộp trang chủ.

### 31/7/2026, đợt 2 — bấm sai cũng làm câu hỏi trượt đi + đếm ngược 3-2-1 + ting đếm giờ
Thầy gửi tiếp 3 điều chỉnh. Tóm tắt:

1. **Bấm SAI giờ cũng làm câu hỏi trượt đi luôn** (đổi hẳn so với đợt 1 hôm nay, lúc đó em tự đoán bấm
   sai không ảnh hưởng câu hỏi — **thầy xác nhận đoán đó SAI**, giờ đã sửa đúng ý thầy). Bấm sai → dấu ✗
   to bay lên trên ĐÚNG ô vừa bấm rồi biến mất sau ~0.9s (dùng lại đúng class `.aw-mark-fly.is-cross` +
   icon `markCross` chuẩn của dự án, giống Quiz) — KHÔNG rung nữa (bỏ hẳn `.is-shake`, thay bằng dấu ✗
   theo đúng yêu cầu). Đồng thời câu hỏi (không phải ô vừa bấm) trượt tiếp ra phải y hệt lúc bấm đúng.
   Cặp đó (câu hỏi + ô ĐÁP ÁN ĐÚNG của nó, không phải ô vừa bấm sai) coi như "trượt qua lượt này":
   - "Show each question once": coi như bỏ, xoá ô đáp án đúng của cặp đó (giống hệt xử lý hết giờ).
   - "Repeat questions until correct": xếp cặp đó vào **VỊ TRÍ NGẪU NHIÊN** trong hàng đợi còn lại (không
     phải luôn xếp cuối) — dùng chung 1 hàm `requeueRandom()` cho cả trường hợp bấm sai lẫn hết giờ.
   Đã kiểm bằng `javascript_tool` (đo DOM thật, không đoán qua ảnh): bấm sai → dấu ✗ hiện ngay, ~550ms
   sau câu hỏi đổi + ô đáp án đúng của cặp cũ biến mất (chế độ Show once); bật Repeat → bấm sai xong ô
   đó VẪN CÒN nguyên trong lưới (không bị xoá) — đúng như thiết kế.
2. **Đếm ngược "3-2-1" trước khi vào câu đầu tiên — CHỈ áp dụng khi Timer = Count up.** Số to hiện ngay
   giữa khu câu hỏi (`.aw-ftm-prompt.is-countdown`, cỡ chữ ~2.5 lần bình thường), mỗi giây đổi số + phát
   1 tiếng "ting" (dùng lại file `clocktick.mp3`), xong "1" thì 1 giây sau mới gọi âm "Go" rồi câu hỏi
   đầu tiên mới thật sự trượt vào. Đã đo bằng `javascript_tool` (theo dõi `textContent`/class của
   `.aw-ftm-prompt` theo mốc 400ms): đúng trình tự 3(1s)→2(1s)→1(1s)→câu hỏi thật, khớp thiết kế.
   - **GIỚI HẠN CHƯA GIẢI QUYẾT ĐƯỢC (cần thầy quyết định)**: thầy nói "3 giây chuẩn bị không tính vào
     đồng hồ" — nhưng đồng hồ hiển thị góc trên (và thời gian ghi vào bảng xếp hạng cuối ván) là do
     `core/engine.js` tự quản lý HOÀN TOÀN, bắt đầu đếm NGAY lúc `mount()` chạy — hiện KHÔNG có cách nào
     cho 1 template báo "khoan, đợi tôi xong phần chuẩn bị đã rồi hẵng tính giờ" mà không sửa `core/`.
     Em CHƯA tự sửa (đúng luật không đụng core). Hệ quả: đồng hồ + thời gian cuối ván của Find the match
     sẽ LUÔN cao hơn thời gian chơi thật đúng 3 giây (đã đo: bấm Play, tới lúc câu hỏi đầu hiện ra thì
     đồng hồ đã chạy tới đúng "0:03"). Nếu thầy muốn sửa cho đúng 100%, cần thêm 1 cờ tuỳ chọn mới ở
     `core/engine.js` kiểu `tpl.delayTimerStart` + hàm `ui.startClock()` (template tự gọi lúc hết chuẩn
     bị) — CHƯA làm, chờ thầy "ok" mới đụng `core/`.
3. **Ting đếm giờ cho Count down**: bắt đầu ting mỗi giây từ lúc còn 10 giây, tới lúc còn 5 giây thì ting
   nhịp gấp đôi (mỗi 0.5 giây) cho tới hết giờ — tính bằng đồng hồ RIÊNG của template (đọc thẳng
   `options.timerTotalSeconds`, không phụ thuộc biến nội bộ của `core/engine.js`) nên KHÔNG cần sửa
   core. Count up thì theo yêu cầu KHÔNG ting nữa suốt ván (chỉ ting trong 3 giây chuẩn bị ở trên).
   **CHƯA tự nghe kiểm** vì công cụ test không phát âm thanh nghe được, chỉ kiểm được lịch trình
   `setTimeout` đúng theo tính toán qua đọc code, chưa tự tai nghe nhịp có đúng cảm giác không.
- **CHƯA import vào `main.js`, CHƯA đổi `built:true`.**

## ĐỀ XUẤT SỬA CORE (nếu có)
Nếu thầy muốn dùng 3 âm thanh còn lại (Menu/Leaderboard/RevealAnswers, file đã có sẵn ở
`D:\APP AND DATA\AWord-data\Source\Sound effect\FIND THE MATCH`, chưa copy vào template): `core/
engine.js` hiện chưa có hook `tpl.sounds` cho lúc bấm nút Menu / mở Leaderboard / bấm Show answers (chỉ
có `play`/`restart`/`complete`/`timeWarning`) — cần thêm 3 hook mới nếu muốn mọi template có thể tự
chọn âm thanh riêng cho 3 việc này. CHƯA tự làm, chờ thầy quyết định có cần không.

**Đề xuất #2 (31/7 đợt 2)**: để "3 giây chuẩn bị 3-2-1 không tính vào đồng hồ" đúng 100% (cả đồng hồ
hiển thị lẫn thời gian ghi bảng xếp hạng cuối ván) — hiện `core/engine.js` bắt đầu đếm giờ NGAY lúc gọi
`tpl.mount()`, không có cách nào để template tự hoãn. Cần thêm (CHỈ THÊM, không đổi hành vi template
khác — giống cách làm `tpl.inlineTimerBar`/`tpl.hasKeyboardToggle` trước đây): cờ `tpl.deferTimerStart`
(template khai `true` thì `begin()` KHÔNG tự set `startedAt`/chạy `setInterval` ngay) + hàm mới
`ui.startClock()` (template tự gọi khi hết phần chuẩn bị). CHƯA tự làm, chờ thầy "ok" mới đụng `core/`.
