# GHI CHÚ — TEMPLATE TYPE THE ANSWER

## Đợt 97 (10/8/2026, v0.9.71) — 3 tinh chỉnh màn chơi: chống iOS Safari tự zoom ô nhập, đẩy xa dấu
tích/X, hiện đáp án đúng lâu hơn khi sai. KHÔNG đụng core (chỉ `type-the-answer.js` + `.css`). ✅ THẦY
DUYỆT → COMMIT + PUSH (đo DOM qua trình duyệt thật trước khi commit, `node --check` sạch, 0 lỗi console
— xem hash + xác nhận LIVE ở cuối mục này).

Thầy tự mở act trên iPhone, báo qua chat 3 điều (không kèm ảnh):

1. **Zoom khi bấm vào ô nhập trên iPhone**: nguyên nhân — `.aw-tta-input` đặt cỡ chữ theo đơn vị `cqw`
   (% chiều rộng CONTAINER game, không phải viewport); trên màn điện thoại hẹp, container co lại kéo
   font tính ra dưới 16px → Safari tự động zoom cả trang khi input nhận focus (hành vi chuẩn của iOS,
   không phải bug JS — bất kỳ input nào dưới 16px đều bị vậy). Sửa: thêm 1 biến CSS
   `--tta-input-fs: max(16px, calc(3.9cqw * var(--fit)))` khai trong `.aw-tta-card`, gán CHUNG cho cả
   `.aw-tta-input` VÀ `.aw-tta-reveal-text` (thay vì chép số `3.52cqw` riêng ở 2 chỗ như cũ) — vừa giữ
   đúng bất biến "reveal = input" đã có từ đợt 1/8/2026, vừa đảm bảo 2 giá trị không bao giờ lệch nhau ở
   các lần sửa sau. Tăng từ 3.52cqw lên 3.9cqw (~+11%, thầy cũng muốn ô đáp án to hơn 1 chút) VÀ có sàn
   cứng 16px không bao giờ xuống dưới nữa. Đo qua trình duyệt thật (`test.html`, đổi viewport 377px kiểu
   mobile): input/reveal đều ra đúng **16px** (chạm sàn, hết nguy cơ zoom); ở viewport 1280px thì ra
   **37.7px** (to hơn bản cũ ~32.5px) — input/reveal luôn bằng nhau ở cả 2 kích thước, không phá bất biến.
2. **Đẩy dấu tích xanh/X đỏ ra xa mép phải ô nhập hơn một chút**: khoảng lùi trong `flyMark()` tăng từ
   `size + 6` lên `size + 22`. Đo DOM: khoảng cách thật từ mép phải hàng input (`.aw-tta-inputrow`) tới
   mép trái dấu tăng từ ~14px lên ~30.7px.
3. **Hiện đáp án đúng lâu hơn khi trả lời sai**: thời gian trước khi tự chuyển câu/kết thúc — trước đây
   1400ms (hoặc 1500ms nếu hết mạng) — nay là **2600ms**, nhưng CHỈ khi đang thật sự hiện đáp án đúng
   (`showAnswerWhenWrong` bật): thêm biến `revealShown` (tách ra từ điều kiện mở reveal đã có sẵn, dùng
   lại chỗ tính `delay` thay vì viết logic riêng) để nếu thầy tắt "Show answer when wrong" thì giữ nguyên
   nhịp nhanh cũ 1400/1500ms — không có gì để đọc thêm thì không cần chờ lâu hơn. Đo bằng bộ đếm thời
   gian thật chạy TRONG trang (không phải áng chừng bằng mắt): submit sai → prompt đổi sang câu kế tiếp
   sau **~2841ms**, khớp đúng 2600ms + ~240ms crossfade chữ câu hỏi.

**Test thật qua trình duyệt** (`test.html`, đo DOM qua `javascript_tool` — gán `.value` bằng
`Object.getOwnPropertyDescriptor` setter rồi dispatch `KeyboardEvent Enter`/`Event input`, giống kỹ thuật
các đợt trước; pane phiên này không composite nên không chụp được ảnh, chỉ đo số liệu DOM): cả 3 điểm
đúng số đo nêu trên; đúng → điểm lên bình thường (1/6); sai → reveal mở đúng đáp án; auto-advance vẫn
đúng luồng cũ (Lives/Andrew/Minus không bị ảnh hưởng, không đụng gì khác ngoài 3 điểm trên). `node --check
type-the-answer.js` sạch. 0 lỗi console.

File đụng: `type-the-answer.js`, `type-the-answer.css` (đều trong thư mục riêng của template, không đụng
core, không đụng editor/sound/sample).

## Đợt 90 (8/8/2026, v0.9.65) — SỬA: điểm trừ ("Points off per wrong") bị rơi mất khỏi bảng kết quả

Thầy quan sát bảng kết quả cuối game hiện số câu làm được (`correct`) chứ không phải điểm đã trừ. Đúng:
`finish()` tính `livePoints` (điểm đã trừ) và hiện đúng lúc đang chơi (ô điểm góc phải-trên), nhưng
**không truyền `score` vào `ui.finish()`** → `core/scoring.js` mặc định `score = correct` → bảng kết
quả + xếp hạng bỏ qua hoàn toàn slider "Points off per wrong".

⚠️ **Bẫy tự bắt được khi test:** vá tạm bằng `score: livePoints` tưởng xong, nhưng test trình duyệt thật
(6 câu, phạt −2/câu sai, câu cuối ĐÚNG) ra `Score 2/6` trong khi ô điểm sống hiện đúng `3/6` ngay sau đó —
vì `livePoints` chỉ cộng bên trong callback `land()` của animation bay điểm (~0,9–1,1s sau khi nộp: shake
430ms + fly 480ms), mà bộ đếm auto-finish câu CUỐI lại đúng 1000ms — animation thua cuộc đua trong pane
test. Sửa đúng: tính điểm trừ **ĐỒNG BỘ trong `finish()`** từ `state` (đã set synchronous trong
`submitAnswer`, không phụ thuộc animation): `score: correct - penalty * wrongGraded`.

Test thật: 5 đúng + 1 sai (phạt 2) → `Score 3/6`, khớp `Total: 5/6`. Không đụng core. Chi tiết chung:
`GHI CHU DU AN.md` Đợt 90. ✅ THẦY DUYỆT → COMMIT `be7cd55` + PUSH + LIVE.

## Đợt 55 (3/8/2026) — Bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance (⚠️ LOCAL)

Thầy yêu cầu 5 việc qua chat (không kèm ảnh). CHỈ đụng `type-the-answer.js` + `.css` +
`sample-type-the-answer.js`, và **1 chỗ ở core/engine.js** (thêm cờ ẩn tuỳ chọn kiểu
`hideTimerOption`/`hideLettersOption` đã có sẵn — cùng khuôn, không phá template khác).

**1. Bỏ checkbox "Minus points for wrong answers"** — nay CHỈ còn 1 thanh trượt
`draft.minusAmount` **0..5** (trước là 1..5 + checkbox riêng bật/tắt). 0 = tắt trừ điểm (hiện
"Off" thay vì "−0"); mặc định đổi từ `1` (kèm checkbox tắt) → `0` để KHÔNG đổi hành vi các
activity cũ (trước đây mặc định checkbox tắt = không trừ, nay slider mặc định 0 = không trừ,
y hệt). Xoá `setSliderEnabled`/`.is-disabled` (không còn checkbox để disable theo). `flyMark()`:
`penalty = clamp(opt.minusAmount, 0, 5)`, `wrongMinus = !correct && penalty>0` (thay
`opt.minusPoints===true`). Xoá field `minusPoints` khỏi sample.

**2. Thêm Lives** — thanh trượt mới **0..10** (0 = Unlimited), bê nguyên khuôn từ True/false
(`hasLivesSlot`, `ui.livesSlot`, hàm `renderLives()`/`loseLife()` — copy gần như nguyên xi từ
`true-false.js`, chỉ đổi tên biến cho khớp). `normLives()`: **undefined/null/0 → unlimited**
(khác True/false — TF mặc định 5 mạng khi undefined, nhưng TTA thì KHÔNG được vì mọi activity
cũ đã lưu sẵn không có field `lives`, nếu mặc định 5 thì activity cũ tự nhiên có nguy cơ
Game Over mà không ai yêu cầu — 1 bẫy suýt mắc, phát hiện lúc đọc lại `normLives` của TF).
Sai câu → `loseLife()` (rớt 1 tim, hoạt ảnh tim bay biến mất) → hết tim → `finish("gameover")`
ngay (không chờ hết toàn bộ câu hỏi), dùng sound `ttaSound.gameOver()` (file `gameover-01.mp3`
đã có sẵn trong sounds/ từ trước, ghi "archived" — nay dùng thật). `sounds.complete` ở top-level
đổi thành no-op, `finish(reason)` tự chọn `ttaSound.complete()`/`ttaSound.gameOver()` (giống
đúng khuôn `true-false.js`).

**3+4+5. Sửa 3 lỗi nav/auto-advance — CÙNG 1 NGUYÊN NHÂN GỐC** (đọc kỹ code trước khi sửa, không
đoán mò): `submitAnswer()` cũ sau khi chấm điểm **KHÔNG gọi lại `updateNav()`** — nút Next chỉ
được bật/tắt lúc `loadQuestion()`, nên khi Allow skip TẮT, Next bị khoá lúc câu chưa chấm và
**vẫn khoá luôn sau khi chấm xong** cho tới khi có điều hướng khác (Prev/Next) tình cờ gọi lại
`updateNav()` — đúng triệu chứng "next không hoạt động dù đã submit". Nặng hơn: `autoTimer`
(hẹn giờ auto-next/auto-finish sau khi chấm) **không bao giờ bị huỷ** khi học sinh tự bấm
Prev/Next điều hướng thủ công — hẹn giờ CŨ vẫn treo, tới giờ tự bắn `goNext()`/`finish()` dù học
sinh đã rời sang câu khác từ lâu → **kéo giật học sinh tới câu không mong muốn** (lỗi 4) hoặc
**tự kết thúc ván đấu ẩn thanh nav** khi đang xem lại câu trước (lỗi 3, do `finish()`→
`celebrate()` set `navWrap.style.visibility="hidden"`). Sửa:
  - `submitAnswer()` gọi `updateNav()` NGAY sau khi chấm (Next bật đúng lúc, không chờ điều hướng khác).
  - `goPrev()`/`goNext()` gọi `clearAutoTimer()` (hàm mới) TRƯỚC khi đổi câu — huỷ hẹn giờ cũ.
  - Theo đúng yêu cầu (lỗi 5): **auto-advance nay LUÔN chạy sau khi chấm xong 1 câu, KHÔNG còn
    phụ thuộc checkbox "Auto switch" chung** (`opt.autoSwitch`) **lẫn Allow skip** — Allow skip
    giờ CHỈ còn quyết định Next có bấm được THỦ CÔNG hay không TRƯỚC khi trả lời; sau khi trả lời,
    game luôn tự chuyển câu (Back vẫn luôn xem lại được, vì `clearAutoTimer()` huỷ ngay khi bấm
    Back — không còn bị hẹn giờ cũ kéo đi giữa chừng). Vì checkbox "Auto switch" chung (core)
    nay vô nghĩa với riêng template này, thêm cờ `tpl.hideAutoSwitch` vào core/engine.js (đúng
    khuôn `hideTimerOption`) và bật cho TTA — ẩn hẳn checkbox thay vì để "chết" gây hiểu lầm.

**Test thật qua trình duyệt** (`test.html`, đo DOM qua `javascript_tool` — pane phiên này không
chụp ảnh được, xem lý do ở các đợt trước): Options panel xác nhận hết checkbox Minus points +
hết nhóm Auto switch, còn slider Points-off ("Off" ở 0) + nhóm Lives ("Unlimited" ở 0). Set
Lives=2 + Points off=2, Allow skip TẮT: sai câu 1 ("test") → mất 1 tim (♥ còn 1), điểm hiện đỏ
"2" (đúng `aw-tta-score-neg`, = 0−2), auto-advance sang câu 2 (không cần bấm gì) — xác nhận lỗi
5 đã hết. Làm đúng câu 2 ("gray") rồi submit+bấm Prev NGAY TRONG CÙNG 1 lượt JS (không qua
round-trip mạng, mô phỏng đúng race điều kiện) → về câu 1 xem lại reveal "seven"; đợi 2s — VẪN ở
câu 1 (hẹn giờ auto-next cũ của câu 2 đã bị huỷ, không kéo giật sang câu 3) — xác nhận lỗi 3+4
đã hết. Next bấm được ngay tại câu 1 (đã chấm) dù Allow skip tắt — xác nhận lỗi 4 (nhánh
Allow-skip-tắt) đã hết. Bấm Next thủ công qua câu 2 rồi câu 3, làm sai câu 3 → hết tim → 0 tim
→ ~1.5s sau tự "GAME COMPLETE" (dừng ở 3/6 câu, không cần làm hết 6 câu) — xác nhận Lives hoạt
động đúng. Test riêng Allow skip BẬT: Next bật ngay từ câu 1 chưa trả lời, bấm Next liên tiếp 3
lần nhảy qua câu 2/3/4 không lỗi; làm đúng câu 4 → auto-advance sang câu 5 dù Allow skip đang
BẬT (đúng lỗi 5, không chỉ áp dụng khi Allow skip tắt). **0 lỗi console** suốt toàn bộ test.
File đụng: `type-the-answer.js`, `type-the-answer.css`, `sample-type-the-answer.js`,
`core/engine.js` (thêm cờ `hideAutoSwitch`, không đổi hành vi mọi template khác). **Chưa push.**

## Đợt 54 (3/8/2026, v0.9.28) — Allow skip + chặn bàn phím ảo HĐH
- **Allow skip:** đã có điểm trừ riêng (`minusPoints`/`minusAmount`) nên đặt `hidePointsOff:true` (ẩn option chung).
  Thêm checkbox **"Allow skip"** (buildExtraOptions, mặc định KHÔNG tích): `canAdvance()` = `allowSkip || state[index].graded`;
  `updateNav` cho `onNext=null` (nút Next mờ) + `goNext` chặn tới khi câu hiện tại đã chấm. Seed `allowSkip:false` vào sample.
- **Chặn bàn phím ảo HĐH:** `input.inputMode = keyboardVisible ? "none" : "text"` (đặt lúc tạo `<textarea.aw-tta-input>`
  + trong handler nút kbd). Bàn phím AWord BẬT (mặc định) → native HĐH TẮT (Windows/Android/iOS), vẫn gõ vật lý được;
  ẩn bàn phím AWord → native bật lại. Đây là game DUY NHẤT có input thật nên chỉ sửa ở đây.

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

### 1/8/2026 — 7 cải tiến bàn phím (⚠️ LOCAL, CHƯA PUSH, chờ thầy duyệt)

Thầy chốt "ok build" cho 7 yêu cầu về bàn phím. CHỈ đụng 2 file template
(`type-the-answer.js` + `type-the-answer.css`), **KHÔNG đụng core**.

**Thay đổi cấu trúc lớn (điểm 2 + 7) — refactor màn chơi:**
- Trước đây `render()` dựng lại TOÀN BỘ card (kể cả bàn phím) mỗi câu, và card
  `justify-content:center` nên mở reveal làm mọi thứ (kể cả bàn phím) dịch chuyển.
- Nay tách **`.aw-tta-stage`** (câu hỏi + reveal + ô nhập + Submit — vùng co giãn,
  dựng lại mỗi câu) đặt TRÊN **bàn phím dựng 1 lần, neo đáy, KHÔNG scale theo `--fit`**.
  Bàn phím = phần tử cố định; stage `flex:1` nuốt hết chỗ còn lại → reveal mở thì
  lớn lên TRONG stage (đẩy câu hỏi lên), thiếu nữa thì autoFit giảm `--fit` (chỉ
  co stage) → **bàn phím không bao giờ di chuyển**. Đã đo: mở Andrew, bàn phím
  top=293/bottom=490 y hệt trước và sau (điểm 2 ✓).
- Chuyển câu: `fadeSwap` giờ CHỈ fade `.aw-tta-stage`, không đụng node bàn phím →
  bàn phím giữ nguyên. Đã đo: gắn `dataset.marker` vào node bàn phím, bấm Next →
  marker CÒN NGUYÊN (cùng 1 node, không dựng lại) + vị trí không đổi (điểm 7 ✓).
  `syncKeyboardState()` cập nhật Submit/caps/numbers/Andrew TẠI CHỖ (không rebuild).

**Các điểm còn lại:**
1. **Bàn phím hạ thấp** + gap tới hàng chức năng còn 1/2: card `padding-bottom`
   2.4cqw→1.2cqw, bàn phím neo đáy. ✓
3. **Chiều ngang bàn phím còn 70%**: `.aw-tta-kbd { width:70% }` (canh giữa). Đo
   width 646px trên stage ~920px ≈ 70% ✓.
4. **Caps tự tắt sau 1 chữ**: `makeLetterKey` gõ xong nếu caps đang bật thì gọi
   `setCaps(false)` — cập nhật class TẠI CHỖ (không rebuild, không nháy) vì glyph
   phím luôn HOA sẵn, chỉ đổi case ký tự chèn + chấm sáng. Đo: caps ON→gõ "A"→
   caps tự off, input="A" ✓.
5. **Andrew nháy chậm**: halo `1s`→`2.6s`; dot-pulse `1.6s`→`2.6s` (dot-pulse giờ
   chỉ còn áp cho chấm Andrew "ready" vì chấm caps/numbers đã thành trắng đứng yên).
   Đo `animationDuration:2.6s` ✓.
6. **Chấm caps/numbers khi bật = trắng đứng yên**: thêm rule dot `background:#fff` +
   `animation:none` + `opacity:1`. Đo: caps/numbers ON → dotBg `rgb(255,255,255)`,
   animationName `none` ✓.

**Bỏ `var(--fit)` khỏi mọi kích thước bàn phím** (trước đây nhân `--fit`): đây là
điều kiện để bàn phím giữ đúng 1 kích thước/vị trí khi autoFit co chữ. Chỉ stage
(câu hỏi/ô nhập/Submit ngoài) còn scale theo `--fit`.

**Đã test thật qua trình duyệt** (`test.html`, đo DOM + chụp ảnh): 7/7 điểm đạt;
chấm đúng "seven"→ô is-correct + tích bay → điểm 0→1; caps/numbers/Andrew đúng
trạng thái; **0 lỗi console** suốt quá trình.

**Chưa push** — chờ thầy tự chơi duyệt. Nếu ưng: commit + push (kèm cả 2 đợt 31/7
đang treo local, nhớ `curl` kiểm chứng theo mục 9 APP_MASTER). File đụng:
`type-the-answer.js` + `type-the-answer.css` (đều trong thư mục template).

### 1/8/2026 (tiếp) — 3 tinh chỉnh bàn phím: Andrew trắng, chữ cái bằng nhau, caps -15% (⚠️ LOCAL)

Thầy chốt "ok build" cho 3 yêu cầu tiếp. CHỈ đụng `type-the-answer.js` + `.css`, KHÔNG đụng core.

1. **Nút Andrew (ready) chuyển tông trắng** như caps/numbers: nhãn `#ffe08a`→`#f4f4f5`;
   chấm tròn "ready" `#ffd54a`→**trắng** (đổi luôn màu cơ sở `.aw-tta-key-dot` vì giờ
   chỉ Andrew-ready còn dùng chấm nhấp nháy — caps/numbers đã là chấm trắng đứng yên).
   Tốc độ nháy chấm giảm còn 1/2: `aw-tta-dot-pulse` 2.6s→**5.2s**. (Halo vàng lúc Andrew
   ĐANG glowing giữ nguyên 2.6s — đó là highlight "đang trợ giúp", thầy không yêu cầu đổi.)
   Đo: labelColor rgb(244,244,245), dotBg rgb(255,255,255), animDuration 5.2s ✓.

2. **Mọi phím chữ cái BẰNG NHAU tuyệt đối (ngang + cao)**: thêm class `.aw-tta-key-letter`
   (JS gắn trong `makeLetterKey`) với `flex: 0 0 var(--tta-kw)` (5cqw cố định) → 26 chữ
   không còn co giãn, tất cả cùng 1 bề ngang. Chiều cao: nguyên nhân lệch là phím ⌫ font
   1.6cqw làm HÀNG 1 cao hơn (Q cao 43.3px vs A/Z 39.3px) → hạ font ⌫ về **1.35cqw** (bằng
   chữ cái) → mọi hàng cùng cao. Đo sau sửa: **cả 26 phím đúng 48.3px × 39.3px** (1 giá trị
   duy nhất cho cả width lẫn height) ✓. Các phím KHÔNG phải chữ cái (' ? . , ⌫ Space Submit)
   vẫn flex-grow để lấp đầy hàng — đây là các phím "co giãn" nuốt phần dư nên chữ cái giữ đều.

3. **caps hẹp đi 15% + kéo hàng A-L theo + `?` giãn bù**: caps/numbers/andrew nay có bề ngang
   CỐ ĐỊNH riêng (ghi đè `flex:1.8` của `.aw-tta-key-fn`): `--tta-caps-w: 8.83cqw`
   (=10.39cqw cũ × 0.85), `--tta-numbers-w: 11.3cqw` (≈cũ), `--tta-andrew-w: 12.7cqw` (≈cũ).
   Vì caps cố định hẹp hơn và các chữ A-L cố định nằm ngay sau nó, chúng **dịch trái theo caps**;
   `?` cuối hàng 2 là phím grow duy nhất nên **giãn ra bù** đúng phần trống. Đo: caps 100.6px→
   **85.3px (giảm 15.2%)**, numbers giữ 109px ✓.

**Đã test thật qua trình duyệt** (`test.html`, đo DOM + ảnh): 3/3 đạt; không hồi quy — caps tự
tắt sau 1 chữ vẫn đúng, numbers mode chuyển qua lại OK (26 phím chữ ↔ chế độ số), bàn phím vẫn
cố định vị trí, **0 lỗi console**. Bố cục nhìn giống bàn phím điện thoại thật hơn.

**Chưa push** — chờ thầy chơi duyệt (gộp chung mọi đợt local đang treo khi push). File đụng:
`type-the-answer.js` + `type-the-answer.css`.

### 1/8/2026 (tiếp) — 8+3 việc: điểm X/30, ô nhập, âm thanh thật, slider Minus... (⚠️ LOCAL)

Thầy chốt "ok build" cho 8 yêu cầu + bổ sung 3. Đụng 2 file template + **2 file core (nhỏ, chỉ THÊM)**
+ 1 file sound mới + copy mp3. Có hỏi thầy 1 câu (tiếng gõ phím) → thầy chọn **tự tổng hợp**.

**Âm thanh (điểm bổ sung 1 + yêu cầu 6):**
- Tạo `type-the-answer-sound.js` + copy bộ mp3 THẬT của Wordwall TTA (Classic) vào `./sounds/`
  (từ `D:\APP AND DATA\AWord-data\Source\Sound effect\TYPE THE ANSWER`). Theo pattern chuẩn
  (giống tf-sound.js/balloon-pop-sound.js). Nối: `sounds.play=intro`, `restart`, `complete=gamecompleted`;
  đúng→`correct` (pool 3), sai→`wrong` (pool incorrect 3), chuyển câu→`tileFlip` (pool 4).
- Bộ TTA **KHÔNG có file tiếng gõ phím** → thêm `sound.keyClick()` vào **core/sound.js** (tổng hợp
  "tock" kiểu iPhone, tôn trọng mute). Mọi phím bàn phím ảo gọi `ui.sound.keyClick()`. Đã đo network:
  intro-01.mp3 (Play) + correct-01.mp3 (đúng) nạp OK.

**Yêu cầu 1 — điểm ✓X/30:** template tự ghi `.aw-top-score` = `✓ điểm/tổng` (`showScore`/`pulseScoreTo`).
Tử số = điểm ĐANG CHẠY (bị Minus trừ), mẫu = tổng câu. Lề trái↔phải đã cân sẵn (topbar space-between
trong padding 2.2cqw đối xứng). Đo: "0/6"→"1/6". KHÔNG đụng core.

**Yêu cầu 2 — ô nhập thấp 40%:** padding dọc + line-height giảm; đo chiều cao 1 dòng **84px→47px (−44%)**.

**Yêu cầu 3 — đáp án dài 2 dòng:** đổi `<input>`→`<textarea>` + `autoGrow` (cao theo nội dung), Enter vẫn
chấm (chặn newline); autoFit thu chữ nếu vẫn tràn. Đo: 1 dòng 47px → chuỗi dài 83px (×1.77 ≈ 2 dòng).

**Yêu cầu 4 — Andrew chỉ hiện kết quả:** bỏ `::before "Andrew ➜"`. Đo: reveal="cold", ::before=none.

**Yêu cầu 5 — câu hỏi cao lên + ô đáp án giữa khoảng trống:** stage `justify-content:flex-start` (câu hỏi
neo trên) + thêm `.aw-tta-answer-slot` (flex:1, canh giữa) bọc khối đáp án → luôn giữa khoảng câu hỏi↔bàn
phím, cả khi mở đáp án đúng. (curArea vẫn trỏ AREA nội dung để autoFit đo đúng, không đo slot flex:1.)

**Yêu cầu 6 — tiếng gõ phím:** xem phần Âm thanh (keyClick tổng hợp).

**Yêu cầu 7 — slider Minus 1–5:** `buildExtraOptions` thêm slider "Points off per wrong" (1–5), **khóa khi
bỏ tích Minus** (mkCheck callback gọi setSliderEnabled). Sai (khi Minus bật) → dấu **"−N" đỏ bay vào điểm**
và trừ N (kẹp ≥0). Đo: tick Minus→slider mở khóa, kéo=3, sai→"−3" bay (is-penalty), điểm 1→0.

**Yêu cầu 8 — bỏ "Shuffle answer order":** thêm cờ `tpl.hideShuffleAnswers` trong **core/engine.js**
(bọc dòng đó). TTA khai cờ → mất; Quiz KHÔNG khai → vẫn còn (đã test lại Quiz: còn cả 2, 0 lỗi).

**Bổ sung 2 — chấm sáng cố định size, chỉ đổi độ sáng:** keyframe `aw-tta-dot-pulse` bỏ `transform:scale`,
chỉ còn opacity. Chấm caps/numbers/Andrew cùng 0.8cqw cố định.

**Bổ sung 3 — bấm caps/numbers chỉ hiện chấm, không đổi gì khác:** bỏ rule đổi nền `#5a6b86`. Đo: nền
caps bật=tắt=rgb(72,72,75) (y hệt phím thường), chỉ chấm hiện (solid, animation none).

**Test thật qua trình duyệt** (test.html, đo DOM + ảnh + network): 11/11 đạt; **0 lỗi console**; hồi quy
Quiz OK (còn đủ 2 shuffle, 0 lỗi). **Chưa push** — chờ thầy chơi duyệt (gộp mọi đợt local khi push).
File đụng: `type-the-answer.js`, `type-the-answer.css`, **core/sound.js**, **core/engine.js**,
`type-the-answer-sound.js` (mới) + `sounds/*.mp3` (mới).

### 1/8/2026 (tiếp) — 9 việc: options timer/order/restart, bố cục cố định, bàn phím animation (⚠️ LOCAL)

Thầy chốt "ok build" + xác nhận **#9 (Apply→restart) áp cho MỌI template**. Đụng 2 file template +
**3 file core** (numberstepper.js, engine.js, app.css) — đều báo trước.

**CORE (ảnh hưởng mọi game):**
- **#1a** ô thời gian countdown nằm CẠNH nút "Count down" (không xuống dòng): gom vào cụm
  `.aw-opt-cd` (inline-flex nowrap) trong `engine.js` + rule `.aw-opt-cd` app.css. Trước bị
  `.aw-opt-row{flex-wrap}` đẩy xuống dòng.
- **#1b** number stepper **nhấn-giữ-lặp** (`numberstepper.js`): pointerdown→bước ngay + sau 320ms
  lặp mỗi 55ms, có tăng tốc nhẹ (×2 sau 10 nhịp, ×3 sau 22). Giữ nguyên bấm/kéo cũ + keydown a11y.
  Đo: giữ 700ms → 00→07 rồi thả dừng.
- **#2** "End of game (Show answers)" xuống CUỐI options (sau extra options) — `engine.js`. Đo Quiz:
  thứ tự Timer/Random/Letters/**End of game**; TTA: Timer/Random/Type the answer/**End of game**.
- **#9** Apply BẤT KỲ option nào → **tự restart** (mọi template): `engine.js` Apply luôn gọi
  `restart()` khi đang chơi (bỏ hook `optionsNeedRestart`). Restart = về màn Play (giống "Start
  again"/Anagram cũ). Đã test Quiz không hồi quy (còn Shuffle answer + Letters, 0 lỗi).

**TEMPLATE TTA — refactor bố cục lớn (`type-the-answer.js` viết lại + `.css`):**
- **Kiến trúc mới:** shell dựng 1 lần: `.aw-tta-qarea` (cao CỐ ĐỊNH ~2 hàng) + `.aw-tta-answer-slot`
  (flex:1 canh giữa) chứa khối đáp án + bàn phím (luôn giữ chỗ). `loadQuestion()` cập nhật DOM TẠI
  CHỖ; chỉ CHỮ CÂU HỎI crossfade khi chuyển câu. Bỏ `autoFit`, dùng `fitOnce` × 2: `--qfit` (thu chữ
  câu hỏi cho vừa vùng 2 hàng), `--fit` (thu khối đáp án nếu tràn slot). Bàn phím KHÔNG dùng var nào
  → không đổi size/vị trí.
- **#5** nút Submit hết nháy khi chuyển câu: khối đáp án nay PERSISTENT (không dựng lại) → Submit không
  bị fade. Chỉ câu hỏi fade.
- **#6** cụm đáp án CỐ ĐỊNH vị trí: đo blockTop = **225 cho cả 6 câu** (1 hàng & 2 hàng như nhau; câu
  dài tự thu chữ qfit 0.95). Ẩn/hiện bàn phím: blockTop = **212 ở cả 3 trạng thái** (nút Submit ngoài
  nay dùng `visibility` giữ chỗ, không `display:none`, nên khối không đổi cao).
- **#7** bật/tắt bàn phím có animation: `.is-hidden` = opacity 0 + `translateY(14%) scale(.98)` +
  transition (KHÔNG `display:none` → giữ chỗ, khối không nhích). Đo: display vẫn flex khi ẩn, có
  transition opacity/transform.
- **#3** con trỏ nhập ngắn 30%: `line-height` ô nhập 1.15→**0.8** (con trỏ = chiều cao dòng). Dòng 2
  hơi sát (đã báo thầy, chấp nhận).
- **#4** Next/Back dùng `ui.sound.keyClick()` (giống bấm chữ), bỏ tileFlip.
- **#8** bỏ ✓ ở câu cuối: `updateNav` câu cuối `onNext:null` (Next disabled, không ✓). Auto-finish khi
  mọi câu đã chấm (đo: trả lời hết 6 → "GAME COMPLETE" tự hiện). Hoặc Menu→Submit answers.

**Test thật** (test.html + Quiz, đo DOM + ảnh): 9/9 đạt; **0 lỗi console**; Quiz không hồi quy.
**Chưa push** — chờ thầy chơi duyệt (gộp mọi đợt local khi push). File đụng: `type-the-answer.js`,
`type-the-answer.css`, **core/numberstepper.js**, **core/engine.js**, **core/app.css**.

### 1/8/2026 (tiếp) — 10 việc: Submit rỗng, cỡ ô nhập (BUG fitBlock), lọc tiếng Anh, điểm âm, Auto switch, chặn submit-0 (⚠️ LOCAL)

Thầy "ok build". Đụng 2 file template TTA + **core (engine.js, app.css)** + **9 file template khác** (chỉ thêm
1 dòng countFn cho #9). Lưu ý: phiên khác đang thêm `livesSlot` (true-false hearts) vào engine.js — thay
đổi của mình coexist, đã grep xác nhận còn nguyên.

- **#2 (quan trọng) — BUG gốc làm chữ bé:** `fitBlock` cũ dùng `fitOnce` (xét CẢ chiều rộng); khối đáp
  án rộng 100% → luôn bị coi "tràn ngang" → `--fit` tụt đáy **0.5** → chữ 15px + Submit 8px. Sửa `fitBlock`
  chỉ xét CHIỀU CAO (vòng lặp riêng) → `--fit`≈0.905, chữ **28px**, Submit **15px**. Đồng thời revert
  line-height 0.8→1.15 + padding về bản trước (caret về như cũ, theo thầy).
- **#1** Submit (ngoài + trong bàn phím) khóa khi ô rỗng: `syncSubmitEnabled()` (gọi ở input/insert/
  backspace/loadQuestion/rebuild). `submitAnswer` chặn chuỗi rỗng. Đo: rỗng→disabled, gõ→enabled.
- **#3** chỉ nhận tiếng Anh: `filterEnglish()` bỏ ký tự ngoài `\x20-\x7E` mỗi lần input + compositionend
  (bàn phím tiếng Việt máy). Đo: "Tiếng Việt hello đúng rồi"→"Ting Vit hello ng ri".
- **#4** bỏ tiếng phím khi Submit: `makeKey(...,silent)`; phím Submit silent (chỉ còn tiếng đúng/sai).
- **#5** dấu X bám hàng ô nhập: dấu là con tuyệt-đối của `.aw-tta-inputrow` (không lệch khi reveal đẩy ô).
  Đo: markInInputRow=true, cùng tâm dọc ô nhập.
- **#6 (CORE)** Auto switch: checkbox global ở engine (mặc định TẮT, `draft.autoSwitch`); TTA tự next sau
  khi chấm (`opt.autoSwitch` + chưa phải câu cuối). Đo: mặc định false; bật→sai câu 1→tự sang câu 2.
- **#7** dấu X/✓ TO+DÀY hơn (size max(34,h·0.72); CSS `stroke-width:3.6` đơn vị user, KHÔNG px kẻo mỏng đi)
  + **RUNG** (scale/rotate keyframe) rồi mới bay về điểm (re-parent sang body).
- **#8** điểm ÂM: bỏ kẹp `Math.max(0,...)`; `scoreHTML` hiện `abs` màu ĐỎ (`.aw-tta-neg`) khi âm, KHÔNG dấu
  −. Đo: sai với minus 3 khi điểm 0 → hiện "3" đỏ (=−3), auto-switch sang câu sau.
- **#9 (CORE) — chặn submit khi 0 câu (MỌI template, AN TOÀN):** ⚠️ ban đầu định chặn trong `ui.finish`
  nhưng phát hiện các template latch `finished=true` TRƯỚC khi gọi ui.finish → sẽ **KẸT**. Đổi sang chặn ở
  **cấp Menu**: `ui.onSubmit(fn, countFn)` — template đưa getter đếm câu đã trả lời; Menu "Submit answers"
  chặn (+toast) nếu `countFn()===0`, KHÔNG gọi finish (nên không latch → không kẹt). Template không đưa
  countFn → y như cũ (không hồi quy). Đã thêm countFn cho 9 template: quiz `chosen!==null`, true-false
  `answered`, anagram/unjumble `doneCheck`, find-the-match `solved||skipped`, maze-chase `correct||wrong`,
  crossword `wordState.done`, gameshow `chosen!==null`, TTA `graded`. Arcade (whack-a-mole/flying-fruit/
  speaking-cards) KHÔNG đưa (không map "câu"). Đo: TTA+Quiz chặn+**KHÔNG kẹt**+trả lời rồi submit thì
  hoàn thành; anagram/crossword/gameshow chặn không lỗi; whack-a-mole không bị chặn nhầm, 0 lỗi.
- **#10** chữ Andrew hiện ra VÀNG + LẤP LÁNH: reveal is-andrew dùng gradient vàng (background-clip:text,
  text-fill transparent) + `@keyframes aw-tta-andrew-shimmer` quét sáng + drop-shadow. Đo: animationName
  đúng, gradient, text-fill transparent.

**Test thật** (TTA + Quiz + anagram + crossword + gameshow + whack-a-mole, đo DOM): 10/10 đạt, #9 an toàn
mọi template, **0 lỗi console**. **Chưa push**. File đụng: `type-the-answer.js`+`.css`, **core/engine.js**
(Auto switch + onSubmit countFn + Menu guard, KHÔNG còn guard trong ui.finish), **core/app.css** (không đổi
đợt này — bỏ qua), + 8 template khác (mỗi file +1 dòng countFn): quiz, true-false, anagram, find-the-match,
maze-chase, crossword, unjumble, gameshow.

### 1/8/2026 (tiếp) — Đảo logic fit: ô đáp án CỐ ĐỊNH cỡ, câu hỏi nhường chỗ (⚠️ LOCAL)

Thầy "ok build". CHỈ đụng `type-the-answer.js` + `.css` (KHÔNG đụng core).

- **Bỏ placeholder** "Type your answer..." → `input.placeholder = ""` (chỉ còn con trỏ). Đo: placeholder rỗng.
- **Font + ô đáp án +10%**: input 3.2→**3.52cqw**, padding 0.55→0.62cqw. Đo: 28px→**34px**.
- **⭐ ĐẢO LOGIC FIT** (thay `fitBlock`+`fitPrompt` bằng **`fitLayout`**): khối đáp án nay **CỐ ĐỊNH cỡ**
  (input/reveal/Andrew đều 3.52cqw, KHÔNG dùng `--fit` để co → `--fit` luôn=1, là "sàn" không nhỏ hơn).
  `qArea` bỏ chiều cao cố định 11cqw → **content-sized**. Khi khối cần thêm dòng (dòng 2 ô nhập / reveal /
  Andrew), `fitLayout` **thu chữ CÂU HỎI** (`--qfit`) → qArea ngắn lại → slot cao lên → khối vừa. Tức câu
  hỏi bị đẩy lên + thu nhỏ, còn ô đáp án giữ nguyên cỡ.
  - **reveal (đáp án đúng) = input**: 2.2cqw → **3.52cqw** (đo bằng nhau: 34px = 34px).
  - **Andrew = input**: đo 34px = 34px.
  - Đo "không bao giờ bé hơn": gõ đáp án 2 dòng → input GIỮ 34px (không đổi), `--qfit` 1→0.998 (câu hỏi
    nhường đúng mức cần). Câu dài "mixing blue and yellow" → --qfit 0.9; mở reveal → 0.881.
- Bỏ import `fitOnce` (không dùng nữa).

**Test thật** (test.html, đo DOM): 3/3 đạt, **0 lỗi console**. **Chưa push**. File đụng: `type-the-answer.js`
+ `type-the-answer.css`.

### 1/8/2026 (tiếp) — Căn giữa ô đáp án/reveal + màu & cân đối điểm số (⚠️ LOCAL)

Thầy "ok build". CHỈ đụng `type-the-answer.js` + `.css` (KHÔNG đụng core).

**Căn giữa "phần tử tham chiếu" giữa câu hỏi ↔ bàn phím:**
- Phần tử tham chiếu = **reveal (đáp án đúng)/Andrew hint khi đang hiện, else ô nhập**.
- `centerBlock()`: dời cả khối (`translateY`) sao cho tâm phần tử tham chiếu = trung điểm giữa
  **mép dưới câu hỏi (promptEl.bottom)** và **mép trên bàn phím thật (keyboardEl.top)** — khi bàn phím
  ẩn cộng bù 14% (do translateY ẩn). `fitLayout` đảm bảo `2·max(trên,dưới của khối quanh tham chiếu) ≤ slot`
  (thu chữ câu hỏi --qfit nếu cần) để khối căn giữa KHÔNG tràn.
- ⛔ **BẪY**: ban đầu thêm `transition: transform` cho khối → **pane phiên này KHÔNG composite frames**
  (ảnh cũng lỗi cùng lý do) làm transition đóng băng ở giá trị đầu (transform=none) → tưởng code sai.
  Thực ra toán đúng. **Bỏ transition, căn tức thì** (cũng tránh khối trượt mỗi lần chuyển câu). Đo thật:
  không reveal → gapTop=gapBottom=59 (diff 0); reveal sai "seven" → 75=75; Andrew "gray" → 73=73.

**Màu + cân đối điểm số** (`scoreHTML`): số tử tách 3 span (num/sep/total), dùng flex-gap của
`.aw-top-score` nên **num↔/ == /↔total** (đo 6px=6px). Số tử **XANH LÁ khi ≥0, ĐỎ khi âm** (không dấu −);
**gạch chéo + tổng luôn màu chữ đậm (đen)**. Đo: dương rgb(16,185,129); âm rgb(239,68,68); sep/total
rgb(35,48,62). ✓ Bỏ class cũ `.aw-tta-neg`, thêm `.aw-tta-score-num/-pos/-neg/-sep/-total`.

**Test thật** (đo DOM; pane không chụp ảnh được phiên này): tất cả đạt, **0 lỗi console**. **Chưa push**.
File đụng: `type-the-answer.js` + `type-the-answer.css`.

### 1/8/2026 (tiếp) — FIX câu hỏi bị thu nhỏ bất thường khi có reveal/Andrew (⚠️ LOCAL)

Thầy báo lỗi: câu hỏi nhỏ bất thường khi sai/bấm Andrew (ảnh: câu hỏi ~17px, reveal ~34px). CHỈ đụng
`type-the-answer.js` + `.css`.

**Nguyên nhân (đo ra):** để căn giữa reveal, `fitLayout` cần `2·(khoảng-dưới-tâm-reveal) ≤ vùng`. Khoảng
dưới gồm cả **nút Submit ẩn `visibility:hidden` vẫn chiếm 44px** + `fitLayout` dùng `slot.clientHeight`
(thiếu ~9px margin bàn phím) → cần 274px nhưng chỉ có ~186px → câu hỏi ép xuống **qfit 0.4 (min), 17.8px**.

**Sửa:**
1. Nút Submit ngoài khi bàn phím hiện: `display:none` (KHÔNG `visibility:hidden`) → không chiếm 44px vô
   hình. Reference-centering vẫn giữ ô nhập/reveal đúng chỗ khi bật/tắt bàn phím nên không cần "giữ chỗ".
2. `fitLayout`/`centerBlock` tính **vùng thật** = `keyboardTopLayout() − promptEl.bottom` (mép bàn phím
   thật ↔ mép dưới câu hỏi), thay cho `slot.clientHeight`. Thêm helper `keyboardTopLayout()` (bù 14% khi
   bàn phím ẩn). Bật/tắt bàn phím nay gọi `fitLayout()` (vì display Submit đổi).

**Đo sau sửa:** fresh 40px (qfit 1); có reveal sai → **36.5px (qfit 0.905)**, Andrew → **38.2px** — hết
crush; reveal/Andrew vẫn căn giữa (56=56, 55=55). 0 lỗi console. **Chưa push**.

### 1/8/2026 (tiếp) — FIX TRIỆT ĐỂ: khối đáp án đè bàn phím + lệch tâm sau reveal (⚠️ LOCAL)

Thầy gửi 2 ảnh máy thật: khối đáp án ĐÈ lên bàn phím + reveal KHÔNG cân (trên ~75px, dưới ~53px) sau khi
sai/bấm Andrew. Máy build KHÔNG tái hiện được (pane không composite → transition nhảy thẳng trạng thái
cuối → mọi phép đo đều "đẹp"). CHỈ đụng `type-the-answer.js`.

**Nguyên nhân:** reveal mở bằng transition grid-rows 0.32s; lần refit DUY NHẤT (cờ `refitDone` once) có
thể chạy khi reveal đang mở dở (transitionend bắn sớm/bubble) → shift/qfit tính trên số đo sai → khối nằm
thấp đè phím, và cờ chặn không cho sửa lại nữa.

**Sửa 3 lớp (hàm `scheduleRevealRefit` dùng chung submitAnswer + useAndrew):**
1. `fitLayout()` gọi NGAY khi add is-open (bố cục gần đúng từ sớm).
2. Refit ở transitionend/400ms (như cũ, có cờ early).
3. **Refit CUỐI vô điều kiện ở 750ms** — transition chắc chắn xong, số đo đúng, không bị cờ chặn.
4. **Chốt chặn cứng trong `centerBlock`**: kẹp shift trong [minShift, maxShift] (PAD 3px) — dù số đo sai ở
   đâu, khối KHÔNG BAO GIỜ đè bàn phím / che câu hỏi; khối to hơn vùng → bám mép trên bàn phím.

**Đo sau sửa (chờ qua mốc 750ms):** sai → reveal "green" cân 56/58, block bottom 267 < kbd top 270 (không
đè), câu hỏi 34.7px; Andrew "seven" cân 53/57, không đè, câu hỏi 38.2px; câu thường cân 51/51. **Mô phỏng
đúng trạng thái lỗi** (ép translateY(60px) đè phím 27px) → lượt tính lại kéo về hết đè + cân. 0 lỗi console.
**Chưa push**.

### 1/8/2026 (tiếp) — Đổi cách căn: căn giữa CẢ CỤM theo ảnh chuẩn của thầy (⚠️ LOCAL)

Thầy gửi ảnh lỗi + **ảnh chuẩn mong muốn**. So sánh ra khác biệt bản chất: code đang căn giữa RIÊNG chữ
xanh/hint (đúng theo spec chữ nghĩa đợt trước) → cụm ô nhập bên dưới bị dồn sát bàn phím. Ảnh chuẩn cho
thấy ý thật: **căn giữa CẢ CỤM** (mép trên = reveal khi mở, else ô nhập; mép dưới = Submit ngoài khi bàn
phím ẩn, else ô nhập) — gap trên cụm = gap dưới cụm. CHỈ đụng `type-the-answer.js`.

- Thay `refElement()` bằng **`blockEdges()`** (mép nhìn thấy của cụm); `neededHeight` = cao cụm;
  `centerBlock` căn tâm cụm vào tâm vùng (câu hỏi ↔ bàn phím), clamp PAD 3px giữ nguyên (không bao giờ
  đè phím). Giữ nguyên `scheduleRevealRefit` 3 lớp (fit ngay / 400ms / 750ms chốt).
- **Đo sau sửa:** câu thường 28=28; sai (reveal "green") gap câu-hỏi→reveal-top = gap input-bottom→kbd
  = **3=3** (pane build nhỏ nên vùng chật — màn thật gap thoáng như ảnh chuẩn; câu hỏi GIỮ 40px không thu);
  Andrew "went" 27=27; mô phỏng trạng thái lỗi (ép đè phím 60px) → tự kéo về 27=27 không đè. 0 lỗi console.
  **Chưa push**.

### 1/8/2026 (tiếp) — Chữ Andrew trùng nút + hết frame tràn bàn phím giữa transition (⚠️ LOCAL)

Thầy yêu cầu 2 chỉnh nhẹ. CHỈ đụng `type-the-answer.js` + `.css`.

1. **Chữ Andrew trùng khớp nút Andrew**: bỏ shimmer quét 2s cũ; chữ dùng ĐÚNG gradient của nút
   (`180deg #ffe89a→#ffc531`) + keyframe `aw-tta-andrew-textglow` **2.6s ease-in-out** mirror đúng
   cường độ halo của nút (0.6/1.6cqw ↔ 1.4/3.2cqw, cùng #ffd54a/#ffe07a/amber). Đo: gradient
   GIỐNG HỆT (rgb 255,232,154→255,197,49), duration 2.6s=2.6s, easing ease-in-out=ease-in-out.
2. **Hết 1–2 frame chữ tràn xuống bàn phím** (câu hỏi dài, lúc reveal đang trượt mở): nguyên nhân —
   cụm cao dần trong 0.32s transition nhưng căn giữ chỉ chạy ở mốc rời rạc 0/400/750ms → giữa các mốc
   có frame cụm dài quá mà chưa được kéo lại. Sửa: `scheduleRevealRefit` thêm vòng **rAF căn lại
   (`centerBlock` có clamp) MỖI FRAME suốt 800ms** — mọi khung hình đều được kẹp trong vùng, rẻ (1
   transform/frame). (Pane build không composite nên rAF không chạy ở đây — trên máy thật chạy bình
   thường; các mốc 0/400/750 vẫn bảo đảm trạng thái cuối ở mọi môi trường.)

Đo: Andrew "cold" 27=27, sai "gray" 26=26, không đè, 0 lỗi console. **Chưa push**.

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — mọi thay đổi core ở trên đã LÀM rồi, không phải đề xuất chờ xử lý.)

### 1/8/2026 (tiếp) — Tách bàn phím ảo ra `core/keyboard.js` làm BÀN PHÍM CHUẨN cho toàn hệ thống (⚠️ ĐỤNG CORE, thầy đã "ok build")

Thầy yêu cầu lấy Y HỆT bàn phím của Type the answer (4 hàng, tông tối, caps/numbers/backspace/space/
Submit-trong-bàn-phím) làm bàn phím DÙNG CHUNG cho mọi act, rồi áp luôn cho Crossword.

- **File mới**: `core/keyboard.js` — `createKeyboard({sound, onChar, onBackspace, submit?, extraKey?})`
  trả về `{el, setHidden(bool), isHidden(), refresh()}`. Bê nguyên layout/màu/animation gốc, chỉ đổi
  tiền tố class `.aw-tta-kbd*`/`.aw-tta-key*` → `.aw-kbd*` (CSS chuyển sang `core/app.css`, cuối file).
  `submit`/`extraKey` là TÙY CHỌN — game không cần thì bỏ qua (không hiện phím đó).
- **`type-the-answer.js`**: xoá hẳn `buildKeyboard/rebuildKeyboard/syncKeyboardState/makeKey/
  makeCharKey/makeLetterKey/makeBackspaceKey/makeFnKey/makeCapsKey/makeNumbersKey/makeAndrewKey/
  setCaps` (nay nằm trong core) + 2 biến `capsOn/numbersMode` (core tự quản). Gọi
  `createKeyboard({sound: ui.sound, onChar, onBackspace, submit:{onClick,isDisabled}, extraKey:{label:
  "Andrew", className:"aw-tta-key-andrew", getState, isDisabled, onClick: useAndrew}})`. "Andrew help"
  VẪN LÀ CỦA RIÊNG TTA — chỉ là phím "extra" thứ 5 mà core chừa chỗ, màu vàng/hào quang vẫn ở
  `type-the-answer.css` (khớp `.aw-tta-key-andrew` + các lớp trạng thái is-ready/is-glowing/is-used mà
  core tự gắn). Mọi chỗ từng gọi `keyboardEl.querySelector(...)` để tự tay đổi class nay gọi
  `kbd.refresh()` (core tự đọc lại `submit.isDisabled()`/`extraKey.getState()`).
- **`crossword.js`**: bỏ hẳn `KBD_ROWS`/`buildKeyboard/letterKey/key` (3 hàng chữ cũ), dùng
  `createKeyboard({sound: ui.sound, onChar, onBackspace})` — KHÔNG có `submit` (crossword tự chấm ngay
  khi gõ đủ chữ, không cần nút Submit) và KHÔNG có `extraKey` (không có "Andrew help" ở đây).
  `onChar` CHỈ nhận chữ cái (`/^[a-zA-Z]$/`), bỏ qua Space/số/dấu câu — các phím đó vẫn HIỆN trên bàn
  phím (để đồng bộ nhìn với mọi game khác) nhưng bấm không làm gì (giống hệt bàn phím thật, phím
  `onKey` vốn cũng chỉ nhận `[a-zA-Z]`).
- **Tông màu**: bàn phím LUÔN tối (không đổi theo theme) — thầy chốt khi được hỏi, để đồng bộ toàn hệ
  thống thay vì đổi theo Classic/Beach như bản Crossword cũ.
- **Đã test qua trình duyệt** (`test.html` của cả 2 template, đo DOM qua `javascript_tool` vì pane
  phiên này không composite frames được — xem mục tương tự ở các đợt trước):
  - TTA: gõ "green" bằng bàn phím ảo mới → is-correct + điểm lên; bấm Andrew → reveal vàng "Andrew ready"
    → glowing → submit → "used" + khoá cả ván; caps/numbers vẫn hoạt động, Submit trong bàn phím vẫn
    khoá khi ô rỗng/đã chấm. 0 lỗi console.
  - Crossword: gõ "CARRY" bằng bàn phím ảo (giả lập `.click()` qua DOM vì click chuột thật bị lỗi toạ
    độ (0,0) trong pane phiên này) → ô tự điền + điểm lên + tự chuyển từ kế tiếp; gõ sai đủ 7 ký tự →
    tự lộ đáp án đúng ("CORRECT") + không cộng điểm + chuyển từ kế tiếp. Bàn phím hiện tông tối đúng
    như TTA. 0 lỗi console.
- File đụng: **core/keyboard.js** (mới), **core/app.css** (thêm CSS `.aw-kbd-*`, cuối file),
  **core/HUONG DAN CORE.md** (thêm mục lục), `type-the-answer.js`+`.css`, `crossword.js`+`.css`.
