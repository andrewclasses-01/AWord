# GHI CHÚ — TEMPLATE TYPE THE ANSWER

## TRẠNG THÁI: ✅ ĐÃ CHỐT, ĐÃ GỘP TRANG CHỦ + PUSH GITHUB (30/7/2026)

Gộp cùng đợt với Open the box (thầy yêu cầu "đưa lên live" để dùng trên máy khác) — chi tiết đầy đủ
của việc gộp (catalog.js/index.html/manifest.js/main.js + sửa hàm preview thẻ act đọc `content.items`)
xem `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` cùng ngày, không lặp lại ở đây. Đã commit + push
GitHub. **CHƯA tự bấm được** luồng đăng nhập Google + tạo/kéo-thả act thật trên trang chủ (Google chặn
tự động hoá) — thầy tự xem khi vào bản live.

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/03-TYPE-THE-ANSWER.md` (2 chế độ, luật chấm gõ, alternate answers, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `type-the-answer.js` — module game, `type: "type_the_answer"`, `scorable: true`.
   - `type-the-answer.css` — giao diện riêng, mọi class prefix `.aw-tta-`.
   - `sample-type-the-answer.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/type-the-answer/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện prompt/câu hỏi → học sinh GÕ đáp án. Chấm bằng so khớp chuẩn hóa với TẬP đáp án chấp nhận (`acceptedAnswers[]` — nhiều biến thể). Mặc định không phân biệt HOA/thường; trim khoảng trắng. LƯU câu trả lời HS gõ vào perQuestion (để sau này phúc khảo). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `type-the-answer.js`/`.css`/`sample-type-the-answer.js` tạo mới, `type: "type_the_answer"`.
- Cùng khuôn phân trang "1 câu tại 1 thời điểm" như Quiz, chỉ đổi vùng trả lời thành **ô nhập chữ + nút
  Submit** thay vì các ô lựa chọn. Gõ xong bấm Submit HOẶC Enter đều chấm ngay (single-shot như Quiz).
  Enter chỉ lắng nghe TRÊN CHÍNH ô input (không dùng phím tắt toàn cửa sổ như Quiz/Anagram) để không
  đụng hành vi gõ chữ/di chuyển con trỏ bình thường của `<input>`.
- **Luật chấm gõ** (`normalize()`): mặc định bỏ qua HOA/thường + bỏ dấu (dùng `.normalize("NFD")` tách
  dấu rồi xoá) + trim/rút gọn khoảng trắng; bật `options.strictCase`/`options.strictAccent` để chấm chặt
  hơn. So khớp với BẤT KỲ đáp án nào trong `item.acceptedAnswers[]` (đã test: gõ "GREEN" khớp "green",
  gõ "test" báo sai + hiện "Correct: seven" đúng theo `options.showAnswerWhenWrong`).
  Sai → viền ô đỏ (đổi màu Ở ĐÂY được phép vì đây là Ô NHẬP có trạng thái thật, khác luật "tile không
  đổi màu" vốn áp cho ô lựa chọn multiple-choice) + badge ✗ + dòng "Correct: …".
- `review[].yourText` lưu ĐÚNG chữ học sinh đã gõ (không phải chuẩn hoá) — phục vụ phúc khảo sau này
  (ghi chú trong docs/03 mục 7).
- **Test qua `test.html` (browser thật)**: gõ đúng (khác hoa/thường) → is-correct; gõ sai → is-wrong +
  reveal; Enter và nút Submit đều hoạt động (đã xác nhận bằng `dispatchEvent(KeyboardEvent Enter)` trên
  chính input đang focus); Submit answers giữa chừng → Score 1/6 đúng; Show answers hiện đủ 3 dạng
  (đúng/sai kèm đáp án đúng/No answer kèm đáp án đúng). 0 lỗi console. Grep bẫy transform+animation —
  sạch (chỉ `:active` translateY không phải centering).
- Chưa làm: **chế độ "Spelling test"** (docs mục 2, đọc từ bằng audio cho HS gõ chính tả) — MVP chỉ làm
  chế độ "Questions and answers" (`content.mode: "qa"`); Spelling cần thêm text-to-speech (có thể dùng
  `window.speechSynthesis` sẵn có của trình duyệt, chưa làm — không phải bug, để ngỏ nếu thầy cần).
  Cũng chưa làm **KEYBOARD LANGUAGE** (bàn phím ảo ký tự đặc biệt, docs mục 3) — bàn phím thật của máy/
  điện thoại HS đã đủ dùng cho tiếng Anh.

### 30/7/2026 — Content editor riêng (`type-the-answer-editor.js`)

Thầy yêu cầu tiếp tục xây Type the answer, việc đầu tiên: content editor (chưa có, giống Anagram trước
khi có `anagram-editor.js`) — "+ New activity"/"Edit content" trước đây chỉ hiện toast "coming soon".

1. **File mới**: `type-the-answer-editor.js` (`openTypeTheAnswerEditor`), theo ĐÚNG khuôn
   `templates/quiz/quiz-editor.js` (cùng chữ ký `(container, activity, {onSave, onCancel, header, footer})`,
   cùng scope đơn giản: chỉ Activity Title + danh sách câu hỏi; theme luôn Classic; mode luôn `"qa"`
   (Spelling test KHÔNG làm ở đây — vẫn để ngỏ như đã ghi ở trên).
2. **Mỗi hàng** = Question (bắt buộc) + **Answer** (đáp án chính, bắt buộc) + **"+ Add alternate answer"**
   (thêm đáp án chấp nhận khác, tối đa 5 alt, mỗi cái có ô riêng + nút × xoá) — khớp đúng mô hình
   `content.items[].{prompt, acceptedAnswers[]}` mà `type-the-answer.js` đang đọc, không cần chuyển đổi gì
   thêm. Có Add question (tối đa **30 câu**, đúng giới hạn Wordwall gốc ở docs/03), Duplicate/Remove.
3. **Dán Excel** (`onQuestionPaste`, giống Quiz/Anagram): cột 1 → Question, cột 2 → Answer chính, cột 3+ →
   alternate answers (tối đa 5), dán được từ CẢ ô Question lẫn ô Answer/Alt., điền từ hàng đang dán xuống.
4. **Tái dùng gần 100% class `.aw-ed-*` sẵn có** trong `core/app.css` (như Quiz/Anagram) — chỉ thêm
   khối nhỏ `.aw-tta-ed-*` (hàng đáp án + nhãn ANSWER/ALT.) vào `type-the-answer.css` của chính template
   này, KHÔNG đụng `core/`.
5. Đăng ký: `type-the-answer.js` thêm `edit: openTypeTheAnswerEditor` (import trực tiếp).
6. **Đã test qua trình duyệt thật** (`test.html` → nút Edit trong khung game, KHÔNG cần harness riêng vì
   nút Edit gọi thẳng `tpl.edit()` bất kể `catalog.js` đang để `built:false`):
   - Mở editor hiện đúng 6 câu mẫu, thêm/xoá alternate answer hoạt động đúng.
   - Duplicate/Remove câu hỏi đúng vị trí, không ảnh hưởng câu khác.
   - Dán Excel giả lập (`ClipboardEvent` 2 dòng, 3 cột) vào ô Question → đúng 2 câu mới, cột 3 thành
     alternate answer, banner xanh báo đúng "Pasted 2 question(s) from Excel."
   - Save khi xoá trống Title → đúng lỗi "Please enter an activity title."
   - Save hợp lệ → gọi `onSave`, bắt lỗi gọn "Could not save — please try again." (đúng vì `test.html`
     không đăng nhập Google nên `store.js` từ chối — giới hạn đã biết, không phải bug editor).
   - Cancel → quay lại y nguyên bản gốc (title/nội dung không bị ảnh hưởng bởi chỉnh sửa dở).
   - Chơi lại game sau khi thêm `edit` field vẫn bình thường (0 lỗi console suốt quá trình).
   - **Chưa test Save thành công thật** (cần thầy tự đăng nhập Google — máy build không tự động hoá
     được bước đó, xem mục 9 APP_MASTER.md).
7. **Core**: KHÔNG đụng gì (chỉ thêm file mới + vài dòng CSS trong `templates/type-the-answer/`).
8. **Chưa làm/còn để ngỏ**: 🎤/🖼️ voice+image trong editor (như Anagram, "để bàn sau"); bố cục dạng BẢNG
   giống ảnh Wordwall thật (Anagram đã đổi sang bảng Word|Clue — Type the answer vẫn ở dạng card đơn giản,
   có thể đổi theo nếu thầy muốn giống Anagram).

### 30/7/2026 (tiếp) — đổi bố cục Editor theo ảnh thầy gửi (Câu hỏi trái | Câu trả lời phải)

Thầy gửi ảnh chụp Google Sheets (2 cột: Question | Answer, nhiều dòng liền nhau cho 1 câu hỏi — dòng nào
cột Question để trống nghĩa là câu trả lời THÊM cho câu hỏi ngay phía trên) và yêu cầu sửa lại:

1. **Bố cục 2 cột**: ô Câu hỏi bên TRÁI (cao bằng cả cụm câu trả lời, giống ô "gộp" trong ảnh — dùng
   `<textarea>` + CSS Grid `align-items:stretch` để tự giãn theo chiều cao cột phải) — cột PHẢI xếp
   chồng từng ô Câu trả lời. Bỏ 2 nhãn "ANSWER"/"ALT." cũ (ảnh thầy không phân biệt, chỉ là 1 danh sách
   câu trả lời được chấp nhận, thứ tự trên-xuống, dòng đầu vẫn là đáp án chính dùng cho "Correct: …"/Print).
2. **"+ Add alternative answer" dời xuống NGAY DƯỚI ô câu trả lời cuối** (trong cùng cột phải, không còn
   là hàng riêng ngoài khối câu hỏi) — đã đo DOM xác nhận đúng là phần tử con cuối cùng của cột câu trả lời.
3. **Dán Excel đổi thuật toán hoàn toàn** theo đúng cấu trúc ảnh: cột TRÁI = câu hỏi, cột PHẢI = 1 câu trả
   lời/dòng; dòng có cột TRÁI RỖNG → câu trả lời đó được CỘNG THÊM vào câu hỏi ngay phía trên (không phải
   coi mỗi dòng là 1 câu hỏi riêng nữa). Dán được từ CẢ ô Câu hỏi lẫn bất kỳ ô Câu trả lời nào trong khối
   (đều fill từ đúng vị trí câu hỏi đó trở xuống, giống quy ước Quiz/Anagram).
4. **Tối đa 50 câu hỏi** (thầy yêu cầu, tăng từ 30).
5. **Đã test qua trình duyệt thật** (`test.html` → Edit, dùng `javascript_tool` đo DOM vì `computer`
   screenshot bị lỗi hiển thị pane phiên này — đã xác nhận số liệu/cấu trúc DOM trực tiếp thay vì đọc ảnh):
   - Bố cục: ô câu hỏi nằm bên trái + cao bằng đúng chiều cao cụm câu trả lời bên phải (câu có 2 đáp án
     "gray/grey" → khối cao 160px, câu có 1 đáp án → 106px, ô câu hỏi luôn khớp chiều cao khối).
   - Dán ĐÚNG ví dụ trong ảnh thầy gửi (2 câu hỏi, 5+3 đáp án) → ra đúng
     `{prompt:"What is one of the seasons?", acceptedAnswers:["Spring","Winter","Autumn","Fall","Summer"]}`
     và `{prompt:"How do you feel?", acceptedAnswers:["Hungry","Sad","Happy"]}` — khớp 100% ảnh gốc.
   - "+ Add alternative answer" bấm ra ô mới đúng vị trí NGAY DƯỚI câu trả lời cuối (đã đo `children` của
     cột câu trả lời: 5 hàng câu trả lời rồi mới tới nút, không lẫn lộn).
   - Đếm "2 / 50 questions" đúng giới hạn mới. 0 lỗi console suốt quá trình.
6. **Core**: KHÔNG đụng gì (chỉ sửa `type-the-answer-editor.js` + vài dòng CSS `.aw-tta-ed-*` trong
   `type-the-answer.css`, cả hai đều trong thư mục riêng của template).

### 30/7/2026 (tiếp) — Viết lại màn CHƠI theo góp ý chi tiết của thầy (⚠️ có đụng core)

Thầy góp ý chi tiết 7 điểm cho màn chơi (bố cục ô nhập/nút Submit, tích xanh/x đỏ bay về điểm, chế độ
Minus, bỏ Letters on answers, không phân biệt hoa/thường, Show answer when wrong hiện xanh lá + trượt
xuống, thêm bàn phím ảo). Đã hỏi thầy 1 câu trước khi code (vị trí nút bàn phím) vì có đụng core.

**1. Bố cục lại**: ô "Type your answer" cao hơn hẳn (chữ to hơn), rộng **80%** khung, nằm ngay dưới câu
hỏi; nút **Submit Answer** (đổi tên, mỏng hơn, rộng ~46%) nằm NGAY DƯỚI ô nhập (trước đây 2 thứ nằm
cùng hàng). Tự hiểu "gần sát câu hỏi" = kéo khối input+submit lên gần câu hỏi (bỏ `margin-top:auto` đẩy
xuống đáy khung như bản cũ) để nhường chỗ cho bàn phím phía dưới — thầy xem thử nếu ý muốn khác.

**2. Tích xanh/X đỏ bay về điểm**: đúng → tích xanh (`icons.check`, màu `#10b981` qua CSS `color`, KHÁC
`icons.markCheck` trắng-viền-đen mà Quiz/Anagram dùng cho dấu to) hiện ngay ngoài mép phải ô nhập, bay
vào số điểm + Pulse Counter (kỹ thuật y hệt `flyScoreGain`/`pulseScoreTo` của Anagram, viết lại bản đơn
giản riêng cho Type the answer, không dùng chung code). Sai → x đỏ (`icons.cross`) cùng chỗ:
- **Có tích "Minus points for wrong answers"**: bay về điểm và **trừ** (không xuống dưới 0).
- **Không tích**: mờ dần biến mất tại chỗ, điểm giữ nguyên.
- Đã đo thật qua trình duyệt: đúng → điểm 0→1 (Pulse); tắt Minus, sai → điểm giữ nguyên; bật Minus, sai
  → điểm 1→0 đúng.
- **Điểm hiển thị SỐNG (topbar) tách khỏi điểm TỔNG KẾT cuối ván**: panel "Score X/Y" cuối ván vẫn là số
  câu đúng thật/tổng số câu (không đổi theo Minus) — Minus chỉ ảnh hưởng con số đang chạy lúc chơi, KHÔNG
  đổi cách xếp hạng/leaderboard. Quyết định phạm vi này thầy chưa yêu cầu rõ, nói lại nếu muốn điểm cuối
  ván cũng trừ theo Minus.

**3. Bỏ "Letters on answers"** khỏi Options (không áp dụng cho game này).

**4. Không phân biệt hoa/thường**: bỏ hẳn `strictCase`/`strictAccent` (chưa từng có UI bật tắt, giờ xoá
luôn khỏi code + sample data cho gọn) — `normalize()` luôn bỏ dấu + về chữ thường.

**5. "Show answer when wrong"** giờ là Option thật (trước chỉ set qua data, không có UI): bật → sai thì
hiện đáp án đúng màu xanh lá NGAY TRÊN ô nhập, khối ô nhập+Submit **trượt xuống mượt** nhường chỗ — dùng
kỹ thuật CSS `grid-template-rows: 0fr → 1fr` (không đụng `transform`, đúng luật mục 3.5 CONG THUC MAU.md)
để khối bên dưới tự trôi xuống theo layout, không "giật" theo cách 1 lần đổi được DOM. **Bẫy thật đã bắt
được lúc test**: lúc đầu bọc việc mở khối trong `requestAnimationFrame` (tưởng cần né kiểu "tạo xong đổi
ngay" như các fly-tile khác) — nhưng ô này đã tồn tại từ `render()` trước đó (không phải mới tạo), nên
KHÔNG cần rAF; mà trong đúng môi trường xem trước phiên này `requestAnimationFrame` không bao giờ bắn
(đã đo trực tiếp: `rafFired:false` trong khi `setTimeout` vẫn chạy bình thường) → khối KHÔNG BAO GIỜ mở.
Đã sửa bỏ hẳn rAF, gọi thẳng `classList.add("is-open")` (ô cũ đã có sẵn từ trước, không cần đợi 1 khung
hình để trình duyệt "thấy" trạng thái đóng trước).
- ⚠️ **1 chỗ CHƯA tự mắt xác nhận được**: bản thân hiệu ứng trượt mượt (CSS transition) — môi trường xem
  trước phiên này báo `document.hidden:true`/"page is not compositing frames" (bẫy đã ghi trong
  APP_MASTER.md mục 9), nên dù đã xác nhận đúng class `is-open` được gắn + rule CSS đúng tồn tại trong
  stylesheet, `getComputedStyle` trả `grid-template-rows: 0px` hoài (không tính lại được vì tab không
  render) — không đo được ảnh chuyển động thật. Đây là kỹ thuật CSS chuẩn, được hỗ trợ tốt trên Chrome,
  tự tin đúng nhưng **thầy nên tự mở link xem hiệu ứng trượt xuống có mượt như ý không**.
- **Cũng thêm `setTimeout` dự phòng cho `pulseScoreTo`** (mục 2) vì lý do y hệt: `requestAnimationFrame`
  không bắn trong tab ẩn nên vòng đếm điểm chạy bằng rAF sẽ treo mãi — thêm `setTimeout` ép gán giá trị
  cuối cùng sau khi hết thời lượng dự kiến, giống mọi `element.animate()` khác trong app đã có sẵn quy
  tắc này. **Đây có thể là bẫy tiềm ẩn ở Anagram nữa** (nó cũng chỉ dùng rAF thuần cho `pulseScoreTo`) —
  con không tự sửa Anagram (khác phạm vi phiên này), chỉ ghi lại đây để thầy cân nhắc báo phiên Anagram
  sau nếu gặp trường hợp điểm không lên trong tab bị ẩn/nền.

**6. Bàn phím ảo QWERTY**: giữa khung (60% rộng) + khu SỐ bên trái (1-9, 0) + khu DẤU CÂU bên phải
(`, . ' - ? !`) + Space + Backspace (⌫). Bấm phím chèn đúng vị trí con trỏ trong ô nhập (không phải luôn
chèn cuối), giữ focus ô nhập (`tabIndex=-1` + chặn `mousedown` để không cướp focus). **Nút ẩn/hiện đặt
cạnh nút Menu** (thầy chọn khi được hỏi) — dùng cửa mở rộng mới `ui.kbdSlot`/`tpl.hasKeyboardToggle` của
engine. **Mặc định HIỆN mỗi khi mở act** (bấm Play/Start again), giữ trạng thái ẩn/hiện khi chuyển qua
lại giữa các câu hỏi trong CÙNG 1 ván. Đã test: bấm ẩn → bàn phím biến mất + đổi tên nút "Show keyboard";
chuyển câu → vẫn ẩn (đúng); Start again → tự hiện lại (đúng mặc định).

**Đã test qua trình duyệt thật** (gõ chữ bằng CHÍNH bàn phím ảo mới xây, không phải gõ tay): trả lời
đúng/sai nhiều câu, chế độ Minus bật/tắt, Options hiện đúng 2 mục mới + KHÔNG còn Letters on answers,
hoa/thường không phân biệt (gõ "GREY" vẫn đúng), Submit answers giữa chừng → Score 1/6 đúng (không bị
ảnh hưởng bởi Minus), Show answers hiện đủ 3 dạng, Start again reset điểm + bàn phím về mặc định. 0 lỗi
console suốt quá trình.

**Core bị đụng (đã báo thầy trước khi code, chỉ 2 điểm, đều CHỈ THÊM không đổi hành vi game khác)**:
- `core/engine.js`: (a) thêm cờ `tpl.hideLettersOption` — bỏ qua nhóm "Letters on answers" nếu template
  khai báo cờ này (Quiz/Anagram/... không khai báo nên không đổi gì); (b) thêm cờ `tpl.hasKeyboardToggle`
  → tạo `ui.kbdSlot` (1 `<span>` rỗng) đặt cạnh nút Menu, template tự vẽ nút riêng vào đó. **Bọc `menuBtn`
  trong 1 `<div class="aw-bottombar-left">`** để giữ đúng CSS `.aw-bottombar` (grid 3 cột dùng
  `:nth-child(1/2/3)` để căn nav ở giữa) — nếu chèn thẳng nút thứ 4 vào hàng sẽ phá vỡ chỉ số cột này.
- `core/app.css`: thêm rule `.aw-bottombar-left` (flex, giống `.aw-tools`) — không sửa rule nào có sẵn.
- `core/icons.js`: thêm icon `keyboard` (chỉ thêm, theo đúng khuôn các icon mic/image/dragHandle... mà
  Anagram đã thêm trước đây).
- Đã test lại `templates/quiz/test.html` sau khi sửa core — vẫn chạy bình thường, 0 lỗi.

### 31/7/2026 — Bàn phím TÔNG TỐI + phím Submit trong bàn phím (⚠️ LOCAL, CHƯA PUSH, chờ thầy duyệt)

Thầy gửi ảnh bàn phím tối kiểu điện thoại và yêu cầu đổi giao diện bàn phím ảo. CHỈ đụng 2 file của
template (`type-the-answer.js` + `.css`), KHÔNG đụng core.

1. **Đổi màu bàn phím sang tông tối, phím vuông** (`type-the-answer.css`): cả cụm bàn phím có nền tối
   `#2b2b2e` bo góc; phím nền xám `#48484b`, chữ trắng `#f4f4f5`, bo góc nhỏ (`0.7cqw`), có "gờ" tối
   `#202022` phía dưới cho ra dáng phím vật lý giống ảnh. Giữ nguyên số bên trái + ký tự bên phải, và
   phím ⌫ vẫn ở CUỐI HÀNG TRÊN CÙNG (thầy chốt khi được hỏi — không dời xuống hàng 3 như ảnh).
2. **Thêm phím Submit XANH trong bàn phím** (`type-the-answer.js` `buildKeyboard`): hàng dưới cùng giờ là
   Space (rộng) + **Submit** ngay bên phải, cùng phong cách phím khác nhưng màu xanh (`--aw-tile-fixed`).
   Bấm nó chấm điểm y hệt nút "Submit Answer" cũ (`submitAnswer(getInput().value)`); disable khi câu đã chấm.
3. **Ẩn/hiện nút "Submit Answer" ngoài theo bàn phím** (`syncSubmitVisibility()`): bàn phím ĐANG HIỆN →
   nút ngoài `display:none` (dùng phím Submit trong bàn phím); ẩn bàn phím → nút ngoài hiện lại (gõ bằng
   bàn phím thật vẫn cần nút bấm). Gọi trong `render()` (SAU khi `root.append(card)` — bẫy đã bắt: gọi
   trước lúc card chưa vào DOM thì `root.querySelector` không thấy nút → không ẩn được) và trong
   `kbdBtn.onclick`.
4. **Đã test qua trình duyệt thật** (`test.html`, chụp ảnh + đo DOM): nền/màu phím đúng
   (kbd `rgb(43,43,46)`, phím `rgb(72,72,75)`, chữ trắng, Submit `rgb(59,130,246)`); gõ "green" bằng bàn
   phím ảo → bấm phím Submit trong bàn phím → ô xanh is-correct + điểm lên 1; bật bàn phím thì nút ngoài
   ẩn (`display:none`), ẩn bàn phím thì nút ngoài hiện lại ("Submit Answer"). 0 lỗi console.
5. **Chưa push** — chờ thầy tự chơi duyệt. Nếu ưng: commit + push (nhớ `curl` kiểm chứng theo mục 9
   APP_MASTER). Điểm có thể tinh chỉnh thêm nếu thầy muốn phím vuông hơn nữa (hiện phím hơi bè ngang).

### 31/7/2026 (tiếp) — Bàn phím kiểu điện thoại: caps / numbers / nút "Andrew help" (⚠️ LOCAL, CHƯA PUSH)

Thầy gửi ảnh bàn phím mới (4 hàng, phím chức năng) + đặc tả nút trợ giúp "Andrew". Đã hỏi 3 câu chốt
phạm vi trước khi build (1 lần/cả ván · chép đúng vẫn tính điểm · nhãn luôn là "Andrew"). CHỈ đụng 2 file
template, KHÔNG đụng core.

**Bố cục mới (thay hẳn bàn phím cũ có cột số/ký tự 2 bên):** 4 hàng full-width —
`' q…p ⌫(đỏ)` / `caps a…l ?` / `numbers z…m . ,` / `Andrew  Space  Submit(xanh)`.

1. **caps** (`makeCapsKey`): bật/tắt nhập chữ HOA (glyph phím luôn HOA như ảnh; chỉ đổi CASE ký tự chèn
   vào ô — chấm điểm vẫn bỏ qua hoa/thường nên caps thuần trang trí). Bật → **chấm sáng tròn** góc phải
   phím + nền nâng sáng xanh-xám. Trong chế độ numbers thì caps **disabled** (mờ).
2. **numbers** (`makeNumbersKey`): đổi cả 3 hàng chữ sang **layout số/ký tự** (`KBD_N1/N2/N3`: hàng số
   1-0, rồi `- / : ; ( ) $ & @ "`, rồi `! + = * % # _ . ,`). Đang bật → chấm sáng + nền nâng. Bấm lại về
   chữ. Các phím này chèn ký tự nguyên trạng (`makeCharKey`, đã kiểm `&`/`"` không bị escape sai vì
   `el()` dùng `innerHTML` + `escapeHtml`).
3. **Andrew help** (`makeAndrewKey`/`useAndrew`): biến `andrewUsed` (1 lần cho **cả ván**) + `andrewGlowing`
   (từ lúc bấm tới lúc submit câu đó). Chưa dùng → **chấm sáng tròn** (còn lượt). Bấm → hiện đáp án đúng
   ở khối reveal, màu **hổ phách** kèm nhãn "Andrew ➜ …" (class `.is-andrew`), đồng thời phím Andrew
   **sáng vàng + hào quang nhấp nháy** (`@keyframes aw-tta-andrew-halo`). HS chép đáp án gõ vào → Submit
   (chép đúng **vẫn cộng điểm** như thường; sai vẫn sai). Ngay sau submit → phím Andrew **tối lại**
   (`is-used`, transition mượt) và **khóa cả ván** (câu sau vẫn is-used, mất chấm sáng). Rời câu chưa
   submit cũng coi như đã tiêu lượt (`goPrev/goNext` set `andrewGlowing=false`).
4. **Giữ nguyên đợt trước**: phím Submit xanh trong bàn phím + ẩn/hiện nút "Submit Answer" ngoài theo bàn phím.
5. **BẪY THẬT đã bắt + sửa (quan trọng)**: `rebuildKeyboard()` thay node bàn phím khi bấm caps/numbers/
   Andrew, nhưng hàm `measure` của `autoFit` (tạo trong `render()`) lại **đóng kín (closure) biến `kbd`
   node CŨ** → sau khi thay, node cũ rời DOM (`offsetHeight=0`) → autoFit tưởng vừa khung → KHÔNG thu nhỏ
   → khi bấm Andrew (reveal mở, bàn phím 4 hàng) thì **tràn: dòng đầu câu hỏi bị cắt trên + hàng Submit bị
   cắt dưới**. Sửa: `measure` đo `keyboardEl` (biến sống, cập nhật mỗi lần rebuild) thay vì `kbd`. Đo lại →
   khớp khung hoàn hảo.
6. **Đã test thật qua trình duyệt** (chụp ảnh + đo DOM): layout khớp ảnh; caps bật→"G", tắt→"r"; numbers
   ra đúng số/ký tự ("Gr5@"); Andrew: chấm sáng→bấm→hiện "Andrew ➜ went" + phím vàng rực→gõ "went"→Submit
   → ô xanh is-correct + điểm 0→1 + Andrew `is-used` tối + khóa; sang câu 2 Andrew vẫn is-used/disabled/
   mất chấm. Fit khớp khung (không còn cắt). 0 lỗi console suốt quá trình.
7. **Chưa push** — chờ thầy chơi duyệt. File đụng: `type-the-answer.js` + `type-the-answer.css` (template).

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — 2 thay đổi core ở trên đã LÀM rồi, không phải đề xuất chờ xử lý.)
