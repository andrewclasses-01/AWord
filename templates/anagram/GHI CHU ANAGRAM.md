# GHI CHÚ — TEMPLATE ANAGRAM

## TRẠNG THÁI: ✅ ĐÃ CHỐT — GẮN VÀO TRANG CHỦ (29/7/2026, thầy duyệt "tương đối rồi")

`core/catalog.js` đổi `built:true`, đăng ký trong `manifest.js` + `main.js` (`import "./templates/anagram/anagram.js"`) + CSS trong `index.html`. Anagram giờ **chơi được** từ trang chủ thật (act có sẵn trong thư viện / bài giao).
✅ **Content editor riêng đã xong (29/7/2026 tiếp)** — `templates/anagram/anagram-editor.js` (`openAnagramEditor`,
đăng ký qua `edit: openAnagramEditor` trong `anagram.js`) → "+ New activity → Anagram" và "Edit content" của
act có sẵn giờ dùng THẬT, không còn toast "coming soon". Xem nhật ký 29/7 mục "Content editor" bên dưới.

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/01-ANAGRAM.md` (cách chơi, options, JSON đề xuất — đã nghiên cứu từ Wordwall thật).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `anagram.js` — module game, `type: "anagram"`, `scorable: true`, đăng ký qua `registerTemplate`.
   - `anagram.css` — giao diện riêng, mọi class prefix `.aw-anagram-`.
   - `sample-anagram.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/anagram/test.html` (test.html + test.js ĐÃ CÓ SẴN, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI ở đầu file này (🔴 CHƯA BUILD → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện câu gợi ý (clue) + các chữ cái bị xáo của đáp án — người chơi kéo/bấm chữ cái về đúng vị trí để giải từ. Giải xong sang từ tiếp. Tham khảo phản hồi ✓/✗ + fade chuyển câu giống Quiz (`../quiz/quiz.js` là mẫu chuẩn).

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `anagram.js`/`anagram.css`/`sample-anagram.js` tạo mới, đăng ký `type:"anagram"`.
- **Cách chơi đã chọn** (đơn giản hoá so với Wordwall thật để MVP chắc chắn, không kéo-thả): clue trên
  cùng (hoặc "Unscramble the word" nếu không có clue) → hàng Ô TRỐNG (dashed) = độ dài từ đích, khoảng
  trắng của cụm nhiều từ giữ nguyên làm khe hở không cần điền → dưới là khay chữ cái đã xáo (bấm/gõ để
  đặt vào ô trống TRÁI NHẤT còn thiếu; bấm lại vào ô đã điền = trả chữ về khay, sắp xếp lại thoải mái
  trước khi điền hết). **Điền HẾT ô mới chấm điểm ngay** (giống Quiz — chọn 1 lần, không "Submit" riêng
  cho từng từ); đúng → ✓ bay + badge xanh; sai → ✗ bay + badge + dòng "Correct: <từ>" mờ dưới ô, rồi
  khoá lại (không sửa được nữa), người chơi bấm ▷ sang từ tiếp.
- Gõ phím chữ cái = đặt viên chữ khớp đầu tiên còn trống trong khay; Backspace = gỡ ô điền cuối cùng;
  ←/→ chuyển từ (giống Quiz).
- `toPrintItems`: `{clue, answer: word}` cho `core/print.js` (Anagram/Quiz đã hỗ trợ mọi template).
- Options áp dụng: `timer`, `shuffleQuestions`, `changeCase` (upper/lower/none — đổi CHỮ HIỂN THỊ, so
  sánh đúng/sai luôn không phân biệt hoa/thường). `showAnswers`/`lettersOnAnswers` không áp dụng (đúng
  giới hạn đã ghi trong CONG THUC MAU.md mục 5).
- **Test qua `test.html` (browser thật, không mô phỏng)**: chơi hết 6 từ mẫu (đúng "dolphin", sai cố ý
  "elephant" → xem đúng dòng "Correct: elephant"), Submit answers giữa chừng → panel Score 1/6 đúng →
  Show answers hiện đúng cả 3 dạng (đúng gộp xanh / sai tối+đáp án đúng bên cạnh / No answer+đáp án) →
  Start again → chơi lại → đổi theme Basic (tile ép màu navy đồng nhất qua `--aw-tile-fixed`, không vỡ
  layout). 0 lỗi console suốt quá trình.
- Chưa làm: kéo-thả chữ cái thật (Wordwall gốc hỗ trợ cả "Rearrange letters" tại chỗ) — dùng mô hình
  bấm/gõ vì chắc chắn + hoạt động tốt trên cảm ứng, đơn giản hơn cho MVP. Nếu thầy muốn kéo-thả thật,
  cần bàn thêm (không phải bug, là lựa chọn thiết kế).

### 24/7/2026 khuya — viết lại toàn bộ theo góp ý chi tiết của thầy (đã test qua trình duyệt thật)
Thầy chơi thử bản đầu rồi cho góp ý rất chi tiết → viết lại gần như toàn bộ cách chơi + giao diện.

**Đổi tên khái niệm** (theo đúng cách thầy gọi): "dãy chữ gốc"/"ô chữ gốc" = hàng chữ cái xáo trộn
(trước gọi "tray"), "dãy kết quả"/"ô kết quả" = hàng hình dạng từ đích (trước gọi "slots"). Class CSS
đổi theo: `.aw-anagram-origin`/`.aw-anagram-otile` và `.aw-anagram-result`/`.aw-anagram-rtile`.

**2 chế độ chơi mới, chọn trong Options → "Anagram mode"** (option mới `anagramMode: "bonus"|"submit"`):
- **Letters with bonus** (mặc định): bấm ĐÚNG chữ cái tiếp theo (theo thứ tự) — chữ bay mượt vào ô kết
  quả + đổi xanh dương (FLIP-clone animation, `flyLetter()`); bấm sai chữ → dấu ✗ nhỏ nổi ngay TRÊN ô
  chữ gốc vừa bấm + âm "tùng tùng" (`sound.buzz()`, mới thêm ở core/sound.js), không di chuyển. Xong cả
  từ mà KHÔNG sai lần nào → chữ "PERFECT" bay nhanh từ giữa khung vào đúng vị trí điểm số (top-right),
  điểm = **gấp đôi** số chữ cái; nếu có ít nhất 1 lần bấm sai → chỉ nổi dấu ✓ to, điểm = đúng bằng số
  chữ cái (không nhân đôi). Đã đo thật: từ "kangaroo" (8 chữ, có 1 lần sai) → +8 điểm; từ "polar bear"
  (9 chữ, không sai lần nào) → +18 điểm (tổng 8+18=26, đã xác nhận trên số điểm hiển thị thật).
- **On submit**: thêm nút **SUBMIT** dưới hàng chữ gốc. Bấm CHỮ BẤT KỲ (không cần đúng thứ tự) → bay
  vào ô kết quả trống tiếp theo (bấm lại ô kết quả đã điền → trả về hàng gốc, sắp xếp lại thoải mái).
  Bấm Submit → từng ô kết quả lần lượt hiện ✓/✗ theo đúng vị trí (cách nhau 260ms, kèm âm thanh riêng
  từng ô: đúng=`sound.tick()`, sai=`sound.buzz()`, cả 2 mới thêm) → cuối cùng nổi dấu to (✓ to nếu cả
  từ đúng, được 1 điểm; ✗ to nếu có ô sai, 0 điểm) + dòng "Correct: <từ>" hiện ra nếu sai. Đã test cả
  2 nhánh đúng/sai qua trình duyệt thật (từ "elephant" xếp sai → ✗ to + "Correct: elephant" + điểm vẫn
  0; từ "penguin" xếp đúng → ✓ to + điểm +1).

**Option mới khác**: `allCaps` (bật = luôn viết hoa ô chữ, tắt = giữ nguyên hoa/thường lúc soạn — thay
hẳn `changeCase` cũ, vẫn đọc `changeCase==="upper"` để không vỡ dữ liệu act cũ) · `allowSkip` (bật =
Next cho bỏ qua từ chưa xong, mặc định BẬT để giữ đúng hành vi tự do đi-lại của bản cũ; tắt = Next bị
khoá tới khi xong từ — đã đo thật: tắt allowSkip thì nút Next bị disable ngay khi từ chưa xong, bấm
xong mới mở lại).

**Giao diện**: ô chữ TĂNG CỠ — công thức `computeTileSize()` tính theo đúng số chữ cái của TỪNG từ để
hàng chữ gốc luôn chiếm ~90% bề ngang khung (kẹp trong khoảng 3.4–9.5cqw để từ quá ngắn/quá dài không vỡ
layout — đây là điểm CÓ CHỈNH so với đúng nghĩa đen "ít nhất 90%" thầy yêu cầu, xin thầy xem lại nếu
thấy từ ngắn (2-3 chữ) tile chưa đủ to). Ô chữ gốc LUÔN xám + chữ trắng (không đổi theo Style/theme, cố
định bằng `--aw-ana-origin-bg` cục bộ trong anagram.css, không đụng theme chung). Ô kết quả LUÔN xanh
dương khi điền (`--aw-ana-result-bg`). Hai hàng gộp trong 1 khối `.aw-anagram-group`, cách nhau 1cqw
(rất sát), đẩy lên cao hơn đáy khung một chút (`margin: auto 0 6.5cqw` thay vì tray cũ dính sát đáy).

**Bỏ HẲN bàn phím** (thầy chốt sau khi xem bản đầu): không còn `←/→` chuyển từ bằng phím nữa — CHỈ
chuột/chạm (bấm nút ‹ › ở thanh dưới khung). Đã gỡ toàn bộ `onKey`/`keydown` listener khỏi anagram.js,
đã bấm phím mũi tên thử trên trình duyệt thật để xác nhận không còn tác dụng.

**Score/Total ở chế độ "Letters with bonus"**: theo đúng ý thầy ("chỉ cần số điểm tổng số chữ cái,
không cần quan tâm số câu") — `total` gửi cho panel tổng kết ở chế độ NÀY đổi thành **tổng số chữ cái
của CẢ HOẠT ĐỘNG** (không phải số câu nữa, số câu vẫn giữ nguyên riêng cho nav "x of N"). Đã đo thật:
6 từ mẫu (elephant8+giraffe7+dolphin7+penguin7+kangaroo8+polarbear9=46 chữ) → panel hiện đúng "Score
16/46" sau khi chỉ hoàn thành 1 từ (kangaroo, hoàn hảo = 16 điểm). Chế độ "On submit" KHÔNG đổi (total
vẫn = số câu, vì mỗi câu đúng 1 điểm, không có khái niệm chữ cái).

**Cỡ ô tối đa 9.5cqw cho từ ngắn**: thầy xác nhận ổn, giữ nguyên như đã build.

~~(mục cũ về Score/Total nói "total luôn = số từ" — ĐÃ THAY bởi mục "Score/Total ở chế độ Letters with
bonus" phía trên: total ở chế độ bonus đổi thành tổng chữ cái, theo yêu cầu thầy 25/7.)~~

**⚠️ CÓ ĐỤNG CORE (ngoại lệ luật số 1, đã báo thầy trong hội thoại vì tính năng không thể làm nếu không
sửa)**:
- `core/engine.js` `buildOptionsPanel()`: thêm 1 "cửa mở rộng" — nếu template có hàm
  `buildExtraOptions({panel, draft, mkCheck, mkRadioChoice})` thì engine gọi nó để cho phép template
  tự thêm nhóm Options riêng (Anagram dùng để thêm "Anagram mode"/"All caps"/"Allow skip"). KHÔNG đổi
  hành vi các template khác (Quiz không có hàm này nên không bị ảnh hưởng). Cũng thêm hàm dùng chung
  `mkRadioChoice()` cạnh `mkCheck()` sẵn có.
- `core/sound.js`: thêm `sound.tick()` (tiếng "tách" nhẹ, dùng cho mỗi lần chọn đúng/mỗi ô đúng lúc
  soát bài) và `sound.buzz()` (tiếng "tùng tùng" trầm, dùng cho mỗi lần chọn sai/mỗi ô sai lúc soát
  bài) — KHÔNG đổi `sound.correct()`/`sound.wrong()` cũ, chỉ thêm 2 hàm mới, template khác không bị
  ảnh hưởng.

**Đã test qua trình duyệt thật (KHÔNG chỉ đọc code)**: cả 2 chế độ chơi hết nhiều từ (đúng/sai xen kẽ,
kể cả từ 2 tiếng "polar bear"), Options đổi mode/allCaps/allowSkip + Apply + Start again đều ăn, đổi
Style (Basic) không vỡ layout, Show answers hiện đúng dữ liệu, 0 lỗi console suốt quá trình.

**3 câu hỏi trên đã được thầy trả lời** (xem 3 mục ngay trên: cỡ tile OK giữ nguyên, Score/Total đổi
sang tính theo chữ cái, bỏ hẳn bàn phím) — đã sửa code khớp theo, test lại qua trình duyệt thật xong.

## ĐỀ XUẤT SỬA CORE (nếu có)
(Không còn mục treo — 3 thay đổi core ở dưới đã LÀM rồi, không phải đề xuất chờ xử lý.)

### 25/7/2026 — sửa 11 điểm góp ý vòng 2 (đã test qua trình duyệt thật, không chỉ đọc code)

**A. Chung + Letters with bonus**
1. **Hết nháy màn hình mỗi lần bấm** — lỗi do mỗi lần 1 chữ bay xong, code gọi `render()` xoá-vẽ-lại
   TOÀN BỘ card (kể cả câu hỏi), làm animation `aw-fadein` chạy lại → cả màn nháy. Sửa: các thao tác
   GIỮA CHỪNG 1 từ (1 chữ bay tới, kéo đổi chỗ, trả về gốc) giờ CHỈ vá trực tiếp đúng 2 ô liên quan
   (`patchTileUsed`/`patchResultFilled`/`patchResultSlotDisplay`...), KHÔNG gọi lại `render()` nữa.
   `render()` đầy đủ chỉ còn chạy 1 lần/từ (lúc bắt đầu từ mới hoặc lúc từ đó xong) — đã đo bằng
   MutationObserver: bấm hết 8 chữ 1 từ "elephant", card gốc chỉ bị thay thế đúng **1 lần** (lúc xong),
   không phải 8 lần như trước.
2. **Chữ PERFECT + 3.** dấu ✓ thường (giảm cỡ) dùng CHUNG 1 cơ chế mới `flyScoreGain()`: hiện tại chỗ
   ~550ms (giữ nguyên vị trí) → bay ~550ms về phía số điểm (mờ dần biểu tượng/PERFECT, hiện dần "+N")
   → khi "tới nơi" mới thật sự cộng điểm và số điểm tự đếm lên bằng hiệu ứng Pulse (`pulseScoreTo()`
   dùng `requestAnimationFrame`, số nhảy từ giá trị cũ lên giá trị mới trong 420ms + phóng to nhẹ rồi
   thu lại). PERFECT to gấp 1.5 lần cỡ cũ; dấu ✓ thường + dấu ✓/✗ to (cả 2 chế độ) còn 2/3 cỡ cũ (CSS
   `.aw-anagram-group .aw-mark-fly{width:34.7%}` — đã đo `getComputedStyle` ra đúng tỉ lệ 0.347).
   Đã đo điểm thật: từ "elephant" (8 chữ) không sai lần nào → +16 (đúng 8×2 PERFECT); từ "penguin"
   (7 chữ) có 1 lần bấm sai → +7 (đúng 7×1, không nhân đôi).
4. **Đổi mode = tự restart**: thêm hook `optionsNeedRestart(before, after)` — engine.js gọi ngay sau khi
   Apply, nếu template báo `true` thì tự `restart()` luôn (không cần thầy bấm "Start again" tay). Anagram
   trả `true` khi `anagramMode` đổi. Đã bấm thật: chọn "On submit" → Apply → game về thẳng màn READY.

**B. On submit**
1. **Kéo đổi chỗ 2 ô đã điền** (trước Submit): mỗi ô kết quả đã điền giờ nhận Pointer Events
   (mouse+chạm dùng chung) — kéo thật (di chuyển > 6px) thả lên ô khác = ĐỔI CHỖ 2 chữ; bấm không kéo
   (không di chuyển) = trả chữ về hàng gốc như cũ. Đã đo bằng PointerEvent giả lập: đổi P↔O đúng vị trí.
2. Dấu ✓/✗ to dùng CHUNG class với bonus mode nên tự động nhỏ theo (xem A.2/A.3).
3. **Nút Submit nâng cao + dòng đáp án đúng**: thêm `.aw-anagram-reveal` LUÔN có mặt (kể cả lúc chưa
   sai lần nào) với `min-height` cố định — nhờ vậy nút Submit KHÔNG bao giờ nhảy vị trí dù dòng đáp án
   có chữ hay không. Sai thì hiện thẳng TỪ ĐÚNG (không còn "Correct:"), màu xanh lá, viết hoa theo đúng
   option `allCaps` (đã đo: bật allCaps → hiện "POLAR BEAR"/"PENGUIN").
4. Submit ĐÚNG cả từ giờ cũng gọi `flyScoreGain("check", 1, ...)` — bay + Pulse Counter y hệt bonus mode
   (đã đo: điểm 0→1 khi submit đúng "dolphin").
5. **Mỗi chữ bấm vào (submit mode) đều có âm** — thêm `ui.sound.click()` trong `submitPick()` (trước đây
   không có âm nào khi đặt chữ ở chế độ này).
6. Soát bài (staggered reveal) đổi sang dấu ✓/✗ NHỎ MÀU (xanh lá/đỏ) tự vẽ riêng (`SMALL_CHECK_GREEN`/
   `SMALL_CROSS_RED`, khác hẳn dấu to trắng-viền-đen `icons.markCheck/markCross` vẫn dùng cho dấu to) +
   đổi âm ô đúng thành "ting" (chỉnh lại `sound.tick()` ở core/sound.js cho cao/sáng hơn, đúng nghĩa
   "ting"), ô sai vẫn `sound.buzz()`.
7. **Giữ màu gốc khi bay, chỉ đổi màu lúc Submit**: bỏ hẳn việc tô xanh dương ngay khi đặt chữ (chế độ
   submit) — ô kết quả giờ ở màu xám (`.is-filled` không có `.is-blue`) cho tới khi bấm Submit; lúc đó
   mới tô theo TỪNG VỊ TRÍ: đúng → `.is-blue` (xanh dương), sai → `.is-wrongbg` (xám nhạt hơn, biến CSS
   riêng `--aw-ana-wrong-bg`). ⚠️ Bắt được 1 lỗi thật lúc test: `render()` cuối (sau khi chấm xong) ban
   đầu QUÊN gán lại 2 class này (chỉ bonus mode có), làm màu/badge bị XOÁ MẤT ngay sau khi vừa tô —
   đã sửa `render()` tính `isRight` cho TỪNG ô khi `st.graded` rồi gắn đúng class + vẽ lại badge. Đã đo
   thật bằng cách đọc `className` từng ô sau khi Submit sai: đúng vị trí duy nhất (chữ "R" của
   "polar bear") ra `is-blue`, 8 ô còn lại ra `is-wrongbg`, mỗi ô đúng 1 badge — khớp 100% với đáp án.

Còn 1 lỗi khác bắt được khi test (không nằm trong 11 điểm thầy nêu, TỰ PHÁT HIỆN khi đo): sau khi 1 từ
xong ở chế độ bonus, biến khoá `busy` bị bỏ quên không trả về `false` trong nhánh "từ đã xong" →
nút Next bị khoá VĨNH VIỄN sau từ đầu tiên. Đã sửa (`busy = false` chạy trước khi rẽ nhánh
finalize/tiếp tục), đã bấm Next thật để xác nhận qua được từ tiếp theo.

**Core tiếp tục bị đụng (cộng dồn với đợt trước)**:
- `core/engine.js`: thêm hook `optionsNeedRestart` trong nút Apply (chỉ gọi nếu template có khai báo
  hàm này — Quiz không có nên không đổi hành vi).
- `core/sound.js`: chỉnh tần số `sound.tick()` cho giống "ting" hơn (không thêm hàm mới đợt này).

### 25/7/2026 (tiếp) — sửa 7 điểm góp ý vòng 3 (đã test qua trình duyệt thật)

1. **Hết nháy CẢ HÀNG chữ gốc mỗi lần bấm** — lỗi do `setOriginLocked()` gán `disabled` cho MỌI ô
   chưa dùng trong lúc 1 chữ đang bay (để chặn bấm chồng), và CSS cũ tô mờ (`opacity:.5`) MỌI ô
   `:disabled:not(.is-used)` → cả hàng cùng mờ đi rồi sáng lại. Bỏ hẳn `opacity:.5` khỏi rule đó
   (`anagram.css`), chỉ giữ `cursor:default`. Đã xem lại bằng screenshot đúng lúc 1 chữ đang bay: các
   ô còn lại giữ nguyên độ đậm bình thường.
2. **Hết nháy chỗ ô vừa bay đi** — lỗi thật: `patchTileUsed()` có dòng `tileEl.style.visibility = ""`
   (xoá `visibility:hidden` đã đặt lúc bắt đầu bay) NGAY LÚC gắn class `.is-used` (opacity chuyển
   1→0 trong 0.2s do CSS transition) → ô vừa ẩn bằng visibility bỗng "hiện lại rồi mới mờ dần" trong
   200ms = đúng hiện tượng nháy thầy thấy. Xoá hẳn dòng reset đó — ô giữ `visibility:hidden` VĨNH
   VIỄN (không cần hiện lại nữa vì đã dùng luôn), không còn xung đột với transition opacity.
3. **Submit hiện ĐÚNG/SAI lần lượt từng chữ** (trước đó hiện HẾT cùng lúc dù code stagger đã viết) —
   lỗi thật: `render()` gọi NGAY khi bấm Submit (`st.graded=true` rồi `render()`) vô tình đã tô màu
   ĐÚNG/SAI cho TẤT CẢ ô luôn vì điều kiện tô màu khi đó đang xét `st.graded` (đã true) — vòng lặp
   stagger sau đó chỉ "tô lại y hệt" nên không ai thấy hiệu ứng lần lượt. Sửa: tách riêng cờ mới
   `st.revealed` (chỉ true SAU KHI stagger xong) — điều kiện tô màu trong `render()` đổi sang xét
   `st.revealed` thay vì `st.graded`. Đã đo bằng cách đếm số dấu ✓/✗ xuất hiện mỗi 150ms sau khi bấm
   Submit (từ "dolphin", 7 chữ): 1 dấu lúc 155ms → 2 lúc 307ms → 3 lúc 604ms → ... → đủ 7 lúc 1652ms —
   đúng kiểu tăng dần, không phải nhảy thẳng lên 7.
4. **Hạ thấp dấu ✓/✗ nhỏ trong ô** — thêm `bottom: -0.8cqw` đè lên mặc định `bottom:0.4cqw` của core,
   dấu giờ treo thấp hơn dưới đáy ô thay vì đè lên gần giữa chữ.
5. **Tăng cỡ chữ trong ô gần tối đa** (ô giữ nguyên cỡ) — cả 2 loại ô (`aw-anagram-rtile`/`otile`) tăng
   hệ số nhân từ 0.46-0.5 lên 0.64 (so với cạnh ô).
6. **Nút Submit cố định vị trí dù câu hỏi 1 hay 2 dòng** — bắt được lỗi thật khi đo: hàm `measure()`
   cho autoFit dùng `offsetHeight` (KHÔNG tính margin), bỏ sót margin-dưới của khối 2 hàng chữ
   (6.5cqw), margin-trên dòng đáp án (0.9cqw), margin-trên nút Submit (1.4cqw) và padding-dưới thẻ
   (2.4cqw) → khi câu hỏi dài 2 dòng, autoFit co KHÔNG ĐỦ, nút Submit bị đẩy TRÀN RA NGOÀI khung (đã
   đo: âm 19px so với đáy khung!). Sửa: `measure()` cộng thêm 4 khoảng margin/padding đó (đọc bằng
   `getComputedStyle`). Đã đo lại: khoảng cách từ Submit tới đáy khung giờ giống hệt nhau (23.17px)
   dù câu hỏi 1 dòng ("A smart sea animal...") hay 2 dòng ("An animal from Australia...").
7. **Cả 2 chế độ dùng chung âm "ting" khi bấm chữ ở hàng gốc** — đổi `submitPick()` từ `ui.sound.click()`
   sang `ui.sound.tick()` (giống hệt bonus mode); `unplace()`/kéo-đổi-chỗ vẫn giữ `click()` riêng (không
   phải hành động "bấm chữ từ hàng gốc").

**Core**: KHÔNG đụng thêm gì ở đợt này (chỉ sửa trong `templates/anagram/*`).

### 25/7/2026 khuya (tiếp) — sửa 4 điểm góp ý vòng 4 (đã test qua trình duyệt thật bằng MutationObserver + đo pixel)

1. **HẾT HẲN nháy màn hình mọi lúc** (kể cả lúc PERFECT/dấu to/bấm Submit — vòng 3 mới chỉ hết nháy MỖI
   LẦN BẤM 1 CHỮ, còn 3 thời điểm này thầy vẫn thấy nháy): lý do y hệt — `finalizeBonusWord()` và
   `doSubmit()` vẫn còn gọi `render()` ở 3 chỗ (lúc từ hoàn thành ở bonus, lúc bấm Submit, lúc soát bài
   xong) dù MỌI thay đổi hiển thị ở các thời điểm đó ĐÃ được vá trực tiếp từ trước (ô đã tô màu, đã khoá,
   dòng đáp án là chỗ DUY NHẤT thật sự cần cập nhật). Bỏ hẳn cả 3 lần gọi `render()` này, thay bằng
   `updateNav()`/`updateSubmitButtonState()`/gán thẳng `revealSlotEl.textContent` (biến mới, giữ tham
   chiếu dòng đáp án như đã làm với `submitBtnEl`). Đã đo bằng `MutationObserver` đếm số lần thẻ
   `.aw-anagram-card` bị thay thế suốt TRỌN 1 từ (kể cả lúc hoàn thành/Submit/soát bài xong): **0 lần**
   ở cả 2 chế độ (trước đó ít nhất 1 lần/từ).
2. **Kéo đổi chỗ 2 chữ ở hàng kết quả (On submit) giờ bay mượt** — trước chỉ đổi text tức thì (snap).
   Thêm hàm dùng chung `flyTileClone()` (giống `flyLetter()` nhưng không đổi màu vì trước Submit màu
   luôn xám trung tính): cả 2 ô tạm trống, 2 bản sao chữ bay đổi chỗ cho nhau (~340ms), xong mới điền
   chữ thật vào 2 ô. Đã đo bằng PointerEvent giả lập: đổi chỗ P↔O đúng vị trí sau khi bay, không còn
   thẻ nào bị vẽ lại.
3. **Bấm (không kéo) 1 chữ ở hàng kết quả giờ bay mượt về đúng ô gốc** thay vì biến mất/hiện lại tức thì
   — dùng lại `flyTileClone()`: ô kết quả trống ngay (như đã "buông" chữ), bản sao bay về đúng vị trí
   ô gốc, ô gốc chỉ HIỆN LẠI đúng lúc bản sao "tới nơi". ⚠️ Bắt được 2 lỗi thật lúc test việc này:
   - Ô gốc bị bay về nhưng **không bao giờ hiện lại được** vì `patchOriginRestored()` không xoá
     `visibility:hidden` (đặt từ lúc bay ĐI, và vòng sửa nháy-màn-hình trước đó cố tình không xoá nó
     nữa cho trường hợp DÙNG VĨNH VIỄN — nhưng unplace() là trường hợp DÙNG LẠI ĐƯỢC, cần xoá). Đã thêm
     `tileEl.style.visibility = ""` đúng chỗ này (không đụng chỗ dùng vĩnh viễn).
   - Ô gốc phục hồi xong vẫn bị **khoá (disabled) mãi mãi**, bấm không phản ứng: do đọc biến `busy`
     NGAY TRƯỚC KHI nó được set về `false` (thứ tự code sai) → gán nhầm `disabled=true` vĩnh viễn. Đã
     sửa `patchOriginRestored()` luôn gán thẳng `disabled=false` (đúng ý định gọi hàm này — mọi chỗ gọi
     đều đang phục hồi 1 ô để DÙNG LẠI NGAY). Đã đo thật: phục hồi chữ "O" xong, `disabled=false`,
     `visibility="visible"`, bấm lại đặt được vào ô — hoạt động trở lại bình thường.
4. **Dấu ✓ to (On submit, từ đúng) bằng cỡ dấu ✗ to** — trước tính nhầm hệ số (`0.0367` thay vì
   `0.347`, lệch nhau đúng 10 lần — lỗi gõ số từ vòng 2). Sửa hệ số của nhánh "check" trong
   `flyScoreGain()` thành `0.347` (khớp CSS `width:34.7%` của dấu ✗ to trên CÙNG `.aw-anagram-group`).
   Đã đo trực tiếp lúc dấu đang hiện: tỉ lệ `fontSize / bề-ngang-group` = 0.347 — khớp CHÍNH XÁC với
   tỉ lệ đo được của dấu ✗ to (cũng 0.347).

**Core**: KHÔNG đụng thêm gì ở đợt này (chỉ sửa trong `templates/anagram/*`).

### 29/7/2026 — thay TOÀN BỘ âm thanh Anagram bằng file mp3 thật (Wordwall Classic theme), theo mô tả
sự kiện chi tiết của thầy. Trước đó mọi âm là tổng hợp (Web Audio oscillator) từ `core/sound.js` dùng
chung cho mọi template.

1. **Nguồn file**: thầy tự chơi thử Anagram thật trên wordwall.net (Classic theme), Claude bắt 28 file
   mp3 hiệu ứng của theme đó từ file JSON tài nguyên theme (`assets-38.json`), tải về
   `D:\APP AND DATA\SOURCE\Sound effect\`. 17/28 file được dùng cho Anagram, copy vào
   `templates/anagram/sounds/` (thư mục riêng của template, không đụng `core/assets/`).
   ⚠️ Đây là file gốc của Wordwall (sản phẩm trả phí) — chỉ dùng tham khảo/tạm thời, về lâu dài nên thay
   bằng âm tự làm hoặc nguồn CC0 nếu AWord phát hành chính thức, để tránh vướng bản quyền.
2. **File mới**: `templates/anagram/anagram-sound.js` — module âm thanh RIÊNG của Anagram (không đụng
   `core/sound.js`). Có `playFile()` (tôn trọng nút mute chung qua `core/sound.js`'s `isMuted()`) và
   `makePool()` (chọn ngẫu nhiên 1/3 file, không lặp lại file vừa phát ngay trước đó — tránh nghe robotic
   khi bấm nhanh liên tiếp).
3. **Sơ đồ sự kiện → file** (đúng theo yêu cầu của thầy):
   - Bấm chữ đúng (cả 2 chế độ, hàng gốc) → random `blocktiledrop1/2/3`
   - Bấm chữ sai (bonus mode tap trực tiếp; submit mode soát từng ô sai) → random `blockchipfail1/2/3`
   - Đổi vị trí chữ đã đặt (submit mode: bấm trả về / kéo đổi chỗ) → random `blocktilepickup1/2/3`
   - Đúng hết 1 từ (bonus mode, dù PERFECT hay có lỗi) → `blockchipmajor`
   - Submit: từng ô đúng lúc soát → `blockchipminorfast`; cả từ đúng → random `blockchipminor1/2/3`
   - Bấm Play → `blockgamesuccessful`; Restart (Start again / đổi mode) → `blockgamerestart`; Game
     complete → `blockgamesuccessful` (giống Play, đúng theo yêu cầu); còn 5 giây cuối (chế độ đếm
     ngược) → `blockgametimeout`
   - Submit sai cả từ: GIỮ NGUYÊN `ui.sound.wrong()` (âm "oh my god" cũ) — thầy không yêu cầu đổi.
4. **Có đụng core** (`core/engine.js`) — thêm hook **tuỳ chọn** `tpl.sounds = {play, restart,
   timeWarning, complete}` mà 1 template có thể tự khai báo, để override 4 thời điểm vòng đời do ENGINE
   điều khiển (bấm Play, Restart, còn 5s, Game complete — Anagram cần các thời điểm này nhưng chúng nằm
   trong `engine.js`, không phải trong `anagram.js`). Template KHÔNG khai báo `sounds` (vd Quiz) thì
   hành vi giữ NGUYÊN 100% như cũ (`tpl.sounds?.xxx` là `undefined`, engine tự dùng âm mặc định) — Quiz
   (đã ✅ CHỐT) không bị ảnh hưởng gì. Chi tiết 4 điểm sửa: `bigPlay.onclick`, `restart()`, vòng lặp
   timer (`remaining<=5` mới), `celebrate()`.
5. **Đã test qua trình duyệt thật** (không đọc code suông): chơi cả 2 chế độ, bắt đúng file mp3 phát ra
   ở TỪNG sự kiện (network request cho lần đầu, sau đó hook `HTMLMediaElement.prototype.play` vì trình
   duyệt không tải lại file đã cache) — khớp đúng bảng ở mục 3 cho 8/9 sự kiện chơi thật (Play/Restart/
   đúng/sai/đúng-hết-từ-bonus/Submit-từng-ô/Submit-cả-từ/Game-complete). Riêng "còn 5 giây cuối" CHƯA
   test trực tiếp bằng đồng hồ thật (tốn thời gian chờ) — chỉ soát lại code, cùng khuôn mẫu với hook
   `play` đã test đạt, tự tin đúng nhưng thầy nên tự xác nhận khi chỉnh Timer = Count down và chơi thật.

### 29/7/2026 (tiếp) — Content editor riêng cho Anagram, gắn nốt vào trang chủ

Thầy duyệt phần âm thanh "tương đối rồi", yêu cầu lưu lại + gắn vào trang chủ. Sau khi gắn xong mới lộ ra
1 lỗ hổng: Anagram CHƯA có màn soạn nội dung (không có `tpl.edit`) nên "+ New activity → Anagram" chỉ
hiện toast "coming soon", chưa tạo được bài mới từ UI. Việc này giờ đã xong:

1. **File mới**: `templates/anagram/anagram-editor.js` (`openAnagramEditor`) — theo ĐÚNG khuôn mẫu
   `templates/quiz/quiz-editor.js` (cùng chữ ký `(container, activity, {onSave, onCancel, header,
   footer})`, cùng SCOPE đơn giản hoá: chỉ sửa Activity Title + danh sách từ; theme luôn Classic; Options
   (timer/mode/allCaps...) vẫn ở Settings/panel Options trong game, KHÔNG sửa ở đây).
2. **Tái dùng 100% class `.aw-ed-*` sẵn có trong `core/app.css`** (hệ CSS soạn nội dung DÙNG CHUNG mọi
   template, Quiz đã chứng minh) — **không thêm 1 dòng CSS nào**, không đụng `core/`.
3. **Mỗi hàng = Word (bắt buộc) + Clue (tuỳ chọn, để trống thì lúc chơi tự hiện "Unscramble the word")**
   — khác Quiz (không có khái niệm "đáp án đúng" cần tick). Có: + Add word / Duplicate / Remove / Delete
   all words / đếm "N / 100 words" (giới hạn 100 theo đúng spec Wordwall gốc ở `docs/01-ANAGRAM.md`).
4. **Dán Excel** (`onWordPaste`, giống hệt cơ chế `onQuestionPaste` của Quiz): dán 1 vùng bảng đa dòng vào
   ô Word → cột 1 = word, cột 2 = clue, điền từ hàng đang bấm xuống, cắt ở 100 dòng.
5. Đăng ký: `anagram.js` thêm `edit: openAnagramEditor` (import trực tiếp, giống `quiz.js` làm với
   `edit: openQuizEditor`). **Không đụng `core/`, không đụng `main.js`/`index.html`** (route "+ New
   activity"/"Edit content" đã có sẵn từ hồi build Quiz, tự nhận `tpl.edit` qua registry — không cần sửa
   gì thêm ở main.js).
6. **Test bằng trang harness tạm** `_test-editor.html` (tự viết, gọi thẳng `openAnagramEditor` với
   `onSave`/`onCancel` giả để không cần đăng nhập Google) — **đã XOÁ sau khi test xong**, không phải file
   thật của dự án. Đã test qua trình duyệt thật:
   - Save khi chưa nhập Title → đúng lỗi "Please enter an activity title."
   - Dán Excel 3 dòng (word+clue) vào ô Word 1 → đúng 3 thẻ, đúng nội dung từng ô, banner xanh báo đúng
     số dòng đã dán.
   - Save hợp lệ → `onSave` nhận đúng object `{type:"anagram", schemaVersion, title, instruction,
     theme:"classic", options:{}, content:{items:[{word,clue}, ...]}}` — khớp CHÍNH XÁC cấu trúc
     `anagram.js`'s `mount()`/`toPrintItems()` đang đọc, chơi được ngay không cần chuyển đổi gì thêm.
   - Mở với dữ liệu có sẵn (`sample-anagram.js`) → đúng heading "Edit content" (thay vì "New activity"),
     6 từ mẫu hiện đúng cả word lẫn clue.
   - Duplicate/Remove hoạt động đúng (nhân bản đúng vị trí kế tiếp, xoá đúng thẻ, không ảnh hưởng thẻ khác).
   - 0 lỗi console suốt quá trình.
7. **Core**: KHÔNG đụng gì thêm ở đợt này (chỉ thêm file mới trong `templates/anagram/`).

### 29/7/2026 (tiếp) — Đổi bố cục Editor sang dạng BẢNG giống Wordwall thật (theo ảnh thầy gửi)

Thầy gửi ảnh chụp màn "Edit Content" thật của Wordwall (bảng Word|Clue, nút Swap Columns, mỗi hàng có
số thứ tự + 2 ô kề nhau + icon mic/ảnh/kéo-thả/nhân bản/xoá) và yêu cầu bố cục Anagram-editor giống vậy.
Đã làm lại HOÀN TOÀN phần hiển thị từng hàng (giữ nguyên phần khung trang — header/Title/tip/bulk bar
vẫn dùng chung `.aw-ed-*` của core như cũ):

1. **Bảng Word | Clue thật**: tiêu đề cột + nút **Swap Columns** (đổi giá trị Word↔Clue mọi hàng cùng
   lúc — dùng khi thầy dán nhầm thứ tự 2 cột). Mỗi hàng: số thứ tự · 1 khung liền có vạch dọc chia ô
   Word/ô Clue (giống ảnh) · cụm icon bên phải: 🎤 voice / 🖼️ ảnh (CHƯA làm — bấm vào chỉ hiện banner
   "coming soon", thầy nói để bàn sau) / ⇕ kéo-thả đổi vị trí / ⧉ nhân bản / 🗑️ xoá.
2. **5 icon MỚI thêm vào `core/icons.js`** (dùng chung, không thuộc riêng Anagram): `mic`, `image`,
   `dragHandle`, `duplicate`, `trash` — chỉ THÊM, không sửa/xoá icon nào có sẵn, không ảnh hưởng Quiz
   (đã test lại `templates/quiz/test.html` sau khi sửa, 0 lỗi).
3. **Kéo-thả đổi vị trí dùng ĐÚNG kiểu HTML5 Drag & Drop mà `main.js` đã dùng** cho việc kéo act/folder
   vào thư mục (draggable + dragstart/dragover/drop, class `is-dragging`/`is-dropok` kiểu) — không bịa
   cơ chế mới, giữ nhất quán codebase. Chỉ icon ⇕ mới `draggable=true` (không phải cả hàng), nên bấm/gõ
   chữ trong ô Word/Clue không bị ảnh hưởng. Thả nửa TRÊN 1 hàng = chèn TRƯỚC hàng đó, nửa DƯỚI = chèn
   SAU (có viền xanh báo trước khi thả).
4. **Dán Excel giờ nhận từ CẢ 2 ô** (Word hoặc Clue đều được, không cần nhớ đúng ô) — cột 1 luôn là Word,
   cột 2 luôn là Clue, giữ nguyên quy tắc điền từ hàng đang dán trở xuống như bản trước.
5. **CSS mới**: `templates/anagram/anagram.css` thêm khối `.aw-anagram-ed-*` (bảng/hàng/ô/icon) — CSS
   RIÊNG của Anagram (không đụng `core/app.css`), dùng px/rem bình thường (trang Editor nằm NGOÀI khung
   16:9 nên không dùng cqw, khác các class chơi game `.aw-anagram-*` khác trong cùng file).
6. **Đã test qua trình duyệt thật** (lại dùng trang harness tạm `_test-editor.html`, xoá sau khi xong):
   - Dán Excel 2 dòng vào Ô CLUE (không phải ô Word) → vẫn đúng cột 1→word, cột 2→clue, đúng từ hàng
     đang dán trở xuống, giữ nguyên các hàng trước.
   - Swap Columns → mọi hàng đổi đúng giá trị Word↔Clue, bấm lại swap về đúng như cũ.
   - Kéo-thả (giả lập DragEvent thật, không phải click thường) hàng 1 xuống dưới hàng 3 (thả nửa dưới)
     → đúng thứ tự mới; kéo lại lên đầu (thả nửa trên hàng đầu) → đúng về lại thứ tự ban đầu.
   - Save → dữ liệu ra đúng cấu trúc `content.items[].{word,clue}` như trước, giữ nguyên `id`/`options`
     khi sửa bài có sẵn.
   - 0 lỗi console suốt quá trình; `templates/quiz/test.html` vẫn chạy bình thường sau khi thêm icon mới.
7. **Core**: có thêm 5 icon SVG vào `core/icons.js` (mục 2 ở trên) — CHỈ THÊM, không sửa file khác trong
   `core/`.

### 29/7/2026 (tiếp) — 2 điều chỉnh nhỏ theo góp ý thầy

1. **Options Apply LUÔN Restart** — trước chỉ tự restart khi đổi `anagramMode` (bonus↔submit), đổi mục
   khác (timer/shuffle/allCaps/letters/allowSkip...) chỉ hiện toast "Options applied" và giữ nguyên ván
   đang chơi. Thầy muốn MỌI thay đổi Options đều restart ngay. Sửa `optionsNeedRestart()` trong
   `anagram.js` trả về `true` luôn (không còn so sánh `anagramMode` nữa) — 1 dòng, không đụng
   `core/engine.js` (hook đã có sẵn từ trước, chỉ đổi cách Anagram trả lời hook đó). Đã test: đổi lại 1
   mục KHÔNG liên quan mode (Allow skip) → Apply → về thẳng màn Ready ngay, không còn toast giữ nguyên
   ván cũ.
2. **Hạ thấp dấu ✓/✗ nhỏ ở chế độ On Submit cho khỏi đè chữ** — bắt được lỗi thật khi đo: rule cũ
   `.aw-anagram-rtile .aw-tile-badge { width:1.9cqw; bottom:-0.8cqw }` chỉ set `width`, để `height` tự
   suy ra từ `aspect-ratio:1` của core — nhưng đo bằng `getBoundingClientRect()` phát hiện height thực tế
   bị giãn ra **83px** (gần bằng CẢ chiều cao ô 81.6px) thay vì vuông theo width 18.34px, đẩy dấu ✓ hiện
   lên giữa ô (đè vào chữ) dù `bottom` đã âm. Nguyên nhân: `top` đang để `auto`, không đủ ràng buộc để
   trình duyệt tôn trọng `aspect-ratio` khi chỉ có `bottom` cố định trong ô cha đang canh giữa bằng flex.
   Sửa: **set `height` tường minh** bằng `width` (bỏ phụ thuộc `aspect-ratio` mập mờ) + tăng `bottom`
   xuống `-1.6cqw` (gấp đôi, hạ thấp thêm). Đã đo lại + chụp màn hình thật (chơi hết từ "dolphin" ở chế
   độ On submit): dấu ✓ nằm hẳn dưới từng ô chữ, không còn đè chữ nào.
