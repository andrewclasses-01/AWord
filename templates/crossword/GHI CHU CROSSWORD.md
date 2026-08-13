# GHI CHU — CROSSWORD

**TRẠNG THÁI: ✅ ĐÃ CHỐT + LIVE. TÁI THIẾT KẾ LỚN (Đợt 36/v0.9.10), rồi 🔧 3 LOẠT TINH CHỈNH REVEAL +
ÂM THANH (2/8/2026, Đợt 43 / v0.9.17), rồi 🔧 PHÂN TRANG TỚI 120 ANSWER (4/8/2026, Đợt 66 / v0.9.41) —
✅ COMMIT (`4d5b892`) + PUSH + LIVE, đã kiểm chứng lại trên bản live (xem mục đầu file).** Chỉ đụng
`templates/crossword/*` (crossword.js / .css / crossword-sound.js / crossword-editor.js), **KHÔNG đụng
core** (nav + slogan chèn bằng DOM vào `.aw-topbar`/`.aw-nav` của engine rồi hoàn tác ở cleanup). Tự test
trình duyệt thật đủ mọi mục (đo DOM/timeline, 0 lỗi console). ⚠️ Hiệu ứng trượt/bay bị ĐÓNG BĂNG trong
pane không-composite của Claude — đo bằng cách ghi timeline class qua `setInterval` (không nhìn được thì
đo số liệu); trên Chrome thật chạy mượt.

> Sửa tiếp game này thì chỉ đụng `templates/crossword/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

## 8/8/2026 — SỬA: điểm trừ ("Minus mode") bị rơi mất khỏi bảng kết quả (Đợt 90 dự án, v0.9.65) — ✅ THẦY DUYỆT → COMMIT `be7cd55` + PUSH + LIVE. KHÔNG đụng core.

Cùng lỗi tìm thấy ở Type the answer (xem `GHI CHU DU AN.md` Đợt 90 cho bối cảnh chung, thầy phát hiện ra ở
game đó trước). `finish()` tính đúng `livePoints` (điểm đã trừ, +1 đúng/−penalty sai, cộng dồn qua CẢ nhiều
trang) và hiện đúng lúc đang chơi, nhưng không truyền `score` vào `ui.finish()` → bảng kết quả + xếp hạng
mặc định `score = correct`, bỏ qua hoàn toàn "Points off when wrong".

**Sửa:** tính điểm trừ ĐỒNG BỘ ngay trong `finish()` từ `wordState` đã chấm (`s.correct`/`s.done`), KHÔNG
đọc `livePoints` — biến đó chỉ cập nhật bên trong `pushTimer` sau animation reveal-từng-ô (900–1900ms trễ),
và Type the answer đã lộ ra trường hợp animation thua cuộc đua với timer auto-finish; Crossword có biên độ
trễ lớn hơn nhiều nên rủi ro thấp hơn nhưng vẫn đổi cho an toàn tuyệt đối, không phụ thuộc số đo animation.
`score = minusOn ? correct - penalty * wrongDone : correct`.

Test thật (test.html, Points off = 2): chọn 1 từ đúng (MATTER) + 1 từ sai, "Submit answers" sớm (18/20 câu
còn lại chưa làm) → `Score -1/20`, `Total: 1/20` — khớp đúng công thức.

## 7/8/2026 — SỬA LỖI SNAP KHI GÕ PHÍM TRONG LÚC ANDREW ĐANG HIỆN CHỮ GỢI Ý (Đợt 67, v0.9.63) — ✅ THẦY DUYỆT → COMMIT `6b0dc5e` + PUSH + LIVE (`curl` xác nhận)

> Cùng họ lỗi vừa tìm/sửa ở Open the box (Đợt 26 của file GHI CHU riêng game đó — hai template đánh số đợt
> độc lập với nhau, xem GHI CHU DU AN.md Đợt 88 cho mốc chung toàn dự án): đổi CSS animation giữa chừng làm trình duyệt
> nhảy về giá trị mặc định thay vì tiếp mượt từ vị trí hiện tại. Chỉ sửa `crossword.js` (`refreshActiveCells()`).
> **KHÔNG đụng core.**

**Lỗi:** bấm phím "Andrew" hiện lần lượt (so le, `is-hintin` + `animation-delay` theo `--hd`, `fill-mode:both`)
các chữ gợi ý vàng vào từng ô còn trống trong từ đang chọn. Nhưng `refreshActiveCells()` — chạy lại ở MỌI lần
gõ phím (`typeLetter`/`backspace`) — mở đầu bằng `cell.className = "aw-cw-bigcell"`, xoá sạch class của MỌI ô
trong từ, kể cả những ô gợi ý chưa kịp hiện xong. Ngay chữ cái ĐẦU TIÊN gõ vào (rất bình thường, không phải ca
hiếm) làm mọi ô gợi ý khác lập tức mất `is-hintin` — không còn gì giữ trạng thái `opacity:0/scale(.35)` giữa
chừng nữa nên chúng nhảy thẳng lên hiện rõ hoàn toàn, TRƯỚC KHI trạng thái mới kịp tính lại.

**Sửa:** trước khi xoá `className`, ghi nhớ ô đó có đang `is-hintin` hay không; ở nhánh gán lại `is-hint`
(ô vẫn còn là gợi ý chưa điền), gắn lại `is-hintin` nếu trước đó đã có. Vì việc xoá rồi gắn lại diễn ra trong
CÙNG một tick đồng bộ (không có `getComputedStyle`/`offsetWidth` xen giữa để ép reflow — khác hẳn `shakeCell()`
ngay bên dưới, nơi cố ý ép reflow để animation phải chạy lại), trình duyệt gộp lại thành "không đổi gì" — ô nào
gợi ý đang so le giữa chừng thì tiếp tục mượt, ô nào đã hiện xong thì cứ đứng yên, không có ô nào bị nhảy.

**Tự test** (devserver `aword` :5510, đo DOM/computed style qua `javascript_tool`): bấm Andrew ở từ 4 ô →
cả 4 ô đều `is-hintin` + `is-hint`, `--hd` so le đúng 0/120/240/360ms. Gõ chữ ĐÚNG vào ô đầu ngay lập tức →
ô vừa điền mất hint (đúng, đã có chữ) nhưng **3 ô còn lại vẫn giữ nguyên `is-hintin:true` + `opacity` không hề
nhảy** (đo ở pane không chạy animation thật — animation kẹt ở giá trị "from" nên đây là kịch bản XẤU NHẤT,
và vẫn giữ nguyên không nhảy). 0 lỗi console. Trang chủ nạp lại đủ 0 lỗi (kiểm tra không hồi quy toàn hệ thống).

## 4/8/2026 — PHÂN TRANG TỚI 120 ANSWER (Đợt 66 / v0.9.41) — đọc mục này TRƯỚC mọi mục cũ bên dưới

Thầy hỏi vì sao Anagram chưa đổi Template sang Crossword được — hoá ra `core/convert.js` giới hạn Crossword
tối đa 40 từ. Thầy chốt nâng trần lên **120 answer**, tự động phân trang khi vượt 30/trang, và xác nhận
answer nhiều từ (space) vốn đã chạy đúng.

**Cơ chế phân trang** (`crossword.js` `mount()`): `PAGE_SIZE=30`, `PAGE_COUNT=ceil(n/30)`, chia ĐỀU các
trang (`perPage=ceil(n/PAGE_COUNT)`, vd 45→23+22) — cùng công thức `find-the-match.js` đã dùng. **Khác
Find the match ở chỗ cốt lõi**: mỗi trang KHÔNG chỉ là "tập con hiển thị" của 1 danh sách chung — mỗi trang
là **1 lưới ô chữ hoàn toàn riêng**, tự gọi `buildCrossword()` cho đúng tập từ của trang đó (crossword
không thể đan xen 120 từ vào 1 lưới duy nhất một cách hợp lý). `pageState[]` (mảng, 1 phần tử/trang) giữ
`{grid, clues, rows, cols, userGrid, cellStatus, wordState}` — các biến `let grid/clues/rows/cols/userGrid/
cellStatus/wordState` ở cấp `mount()` chỉ là "con trỏ" trỏ vào phần tử hiện tại của `pageState`, được gán
lại bởi `loadPage(p)`. Vì `userGrid`/`cellStatus`/`wordState` là các Map/mảng SỐNG (mutate tại chỗ, không
tạo mới mỗi lần đọc), tiến trình 1 trang KHÔNG mất khi game tự chuyển sang trang khác — `loadPage()` chỉ
trỏ lại, không xoá.

`buildGridDom()` (mới, tách ra từ đoạn dựng ô lưới cũ trong `mount()`) dựng lại toàn bộ `.aw-cw-cell` từ
`grid/rows/cols` hiện tại — gọi 1 lần lúc mount (qua `loadPage(0)`) và lại mỗi lần đổi trang. `endWord()`
đổi 3 dòng: hết từ mà TRANG hiện tại đã xong hết (`wordState.every(done)`) → còn trang sau thì
`loadPage(curPageIdx+1)`, hết trang cuối mới `finish()`. `finish()` viết lại để gộp `review`/`perQuestion`/
`correct`/`answered` từ **TẤT CẢ** `pageState[]` theo thứ tự trang (không chỉ trang đang hiện).

**Thanh dưới**: 1 trang (≤30 từ) — ẩn HẲN như cũ (`navWrap.style.visibility="hidden"`, không đổi gì hành
vi trước đây). >1 trang — thanh vẫn hiện nhưng CHỈ để hiện **"Page X / Y"** (`ui.setNav({label})`, không
`onPrev`/`onNext`) — mũi tên ‹› bị ẩn qua CSS scoped `crossword.css`:
`.aw-playarea:has(> .aw-cw-wrap) ~ .aw-bottombar .aw-navbtn{display:none}`, đúng kỹ thuật
`find-the-match.css` đã dùng (Đợt 62) để không rò sang game khác — trang KHÔNG lật tay được, chỉ tự
chuyển khi giải xong hết trang đó.

**1 lỗi thật bắt được lúc viết** (không phải thầy báo, tự phát hiện khi đọc lại code cũ): `selectWord(i)`
trước dùng `curWord = ((i % total) + total) % total` để bọc chỉ số — `total` giờ là TỔNG mọi trang, không
còn là số từ của 1 trang nữa. Sửa lại bọc theo `clues.length` (số từ của TRANG hiện tại). May mắn không lộ
triệu chứng thật (vì `i` truyền vào luôn nằm trong khoảng hợp lệ của trang), nhưng vẫn là lỗi logic cần
sửa cho đúng ý nghĩa biến.

**`core/convert.js`**: `switchTargets()` đổi `n>40` → `n>120` cho đích Crossword (dùng chung mọi nguồn
"qa": Anagram/Quiz/Flying fruit/...).

**`crossword-editor.js`**: `MAX_WORDS` 100→120, khớp trần chơi thật.

**Answer nhiều từ (space) — KHÔNG cần sửa gì**: `gridKey()` (có từ trước, dòng đầu file) đã
`.replace(/[^A-Z]/g, "")` — strip cả dấu cách trước khi dựng lưới, nên "sea horse" → "SEAHORSE" liền 8 ô,
không có ô trống ở giữa. Xác nhận lại bằng cách CHƠI THẬT (không chỉ đọc code): nhét "SEA HORSE" vào bộ
test, giải đúng, tính điểm bình thường.

**Đã tự test qua trình duyệt thật** (devserver + harness tạm `_test-pagination.html`/`_test-convert.html`,
đã xoá sau khi test xong — không phải file thật của dự án):
- Toàn bộ mốc số từ 0/1/2/30/31/45/60/61/90/91/120/150 (kể cả vượt trần 120) → đúng số trang ở MỌI mốc,
  vượt trần 120 vẫn chạy an toàn (chỉ Editor + convert.js chặn nhập/đổi từ trần 120, còn engine tự scale).
- 1 trang: nav ẩn hẳn — y hệt trước khi có tính năng này.
- **Chơi TRỌN 1 ván 2 trang thật** (n=31, gõ phím vật lý mô phỏng qua `KeyboardEvent`, không phải chỉ đọc
  DOM): trang 1 xong → tự chuyển "Page 2/2", điểm giữ nguyên "15/28" (không reset) → giải nốt trang 2 →
  "GAME COMPLETE", Score 28/28 — xác nhận `finish()` gộp đúng, không thiếu/lặp câu.
- Hồi quy: `crossword/test.html` (20 từ mẫu gốc, 1 trang) y hệt trước; `find-the-match/test.html` không bị
  ảnh hưởng (2 luật CSS mới của crossword.css không tải vào trang đó).
- `convert.js switchTargets()` gọi trực tiếp với n=0,1,2,40,41,119,120,121,150 → false/false/true×5/
  false/false, khớp chính xác biên 2..120.
- 0 lỗi console suốt toàn bộ quá trình.

**Đã lên live** (`4d5b892`) — kiểm chứng lại bằng cách import THẲNG module từ `andrewclasses-01.github.io/
AWord` (không phải bản local): n=31 → "Page 1/2" đúng, `switchTargets()` trả đúng 40→true/41→true/
120→true/121→false, giải thật 3 từ trên bản live → điểm cộng đúng, 0 lỗi console.

**Việc kế**: thầy thử tạo 1 bộ Anagram >40 từ (có clue) → Template → xác nhận Crossword sáng; soạn 1
Crossword >30 từ → xác nhận phân trang mượt trên TOMKO.

## 2/8/2026 — 3 LOẠT TINH CHỈNH REVEAL + ÂM THANH (Đợt 43 / v0.9.17) — đọc mục này TRƯỚC mục tái thiết kế

**Reveal khi chấm (thay cho kiểu cũ hiện đồng loạt + nền đỏ):**
- **Chấm SAI (Show-answer BẬT) chạy TUẦN TỰ từng ô** (~190ms/ô, `revealWrongSequence`): ô gõ ĐÚNG → xanh
  (`is-solved is-cellpop`) + âm **ting**; ô gõ SAI → **✕ nhỏ (0.42 ô, mảnh, mờ .74) KHÔNG che chữ** (bỏ
  hẳn nền/viền/chữ đỏ — `.is-xmark` giờ chỉ overlay `::after`, biglet giữ màu mặc định) + âm **tặc**.
  Xong ✕ cuối → chữ đúng **lật** (`is-flip`, rotateX) → cả hàng/cột về **xám đồng nhất** (`flipRevealWord`,
  cả ô xanh cũng thành xám). Bỏ tiếng "wrong" cả-câu ở nhánh này (per-cell thay thế); nhánh Show-answer
  TẮT vẫn giữ `wrong()` + trừ điểm ngay.
- **Chấm ĐÚNG cũng TUẦN TỰ** (`revealCorrectSequence`, ~165ms/ô): mỗi ô xanh + ting lần lượt, **ting ô CUỐI
  xong (+240ms) MỚI** cộng điểm + bay sao (trước cộng ngay). `endWord` giãn theo `lastTing`.
- **Thứ tự nhánh SAI + TRỪ ĐIỂM (minus>0)**: **đủ hết ✕ → sao đỏ bay + trừ điểm (lastMark+260) → sao rời
  ô (700ms) → mới lật** (`flipAt = lastMark+260+700`). Không minus thì lật ngay sau ✕ (lastMark+260). Đã đo
  timeline thật: X 1→7 (t83–1201) → sao+điểm (t1441) → lật xám (t2161).

**Âm thanh — tất cả SYNTH WebAudio trong `crossword-sound.js`** (AudioContext riêng, tôn trọng `isMuted`
của core, KHÔNG đụng core, không cần file mp3 mới):
- `ting` chuông cao ngắn (ô đúng) · `tac` blíp lỗi ngắn (ô sai) · `magic` chuỗi nốt lung linh (Andrew).
- `starGain` tông ĐI LÊN (sao vàng cộng điểm) · `starLose` tông ĐI XUỐNG (sao đỏ trừ điểm) — gắn trong
  `flyStars(kind)`. · `reject` "thụp" trầm (gõ chữ sai vào ô given, gắn trong `shakeCell` cùng hiệu ứng lắc).
- Andrew: khi bấm phát `magic()` 1 lần; chữ vàng vẫn hiện **lần lượt** (`is-hintin` + `--hd` 120ms/chữ).

**Start again ĐỔI BỐ CỤC** (`buildCrossword`): trộn (Fisher–Yates) danh sách TRƯỚC khi sort theo độ dài
(sort ổn định → từ dài vẫn neo lưới, nhưng thứ tự các từ CÙNG độ dài ngẫu nhiên) + **tie-break ngẫu
nhiên** khi 2 điểm giao nhau bằng nhau. Mỗi ván lưới xê dịch (đo 3 ván: 18×14 · 16×19 · 14×21), số từ xếp
ổn định 17–18/20 (greedy có thể rơt 1–2 từ khác nhau mỗi ván — thầy đã chấp nhận "đổi nhẹ").

⭐ BẪY đã tránh: `.is-xmark .aw-cw-biglet` phải `visibility:visible` (không thì mất chữ); reveal tuần tự
dùng `pushTimer` để `returnToBoard`/cleanup dọn sạch; đặt `flyStars` phát âm bên trong nên mọi nơi gọi đều
có tiếng; `blip` bọc try/catch (trình duyệt chặn audio không vỡ game).

## 2/8/2026 — TÁI THIẾT KẾ LỚN (Đợt 36 / v0.9.10) — thiết kế nền, đọc SAU mục trên

Thầy đặt tên: **"bảng crossword"** = toàn lưới, ẩn bàn phím · **"hàng"** = 1 từ ngang bung to + bàn phím ·
**"cột"** = 1 từ dọc bung to + bàn phím.

**Bố cục / màn hình**
- **Bàn phím CỐ ĐỊNH TUYỆT ĐỐI**: đặt trong host `.aw-cw-kbdhost` **position:absolute** ghim đáy-giữa
  (ngoài dòng chảy) → cỡ (cqw) + vị trí KHÔNG đổi dù chọn hàng/cột nào. `.aw-kbd:not(.is-hidden)` mới
  nhận chuột (bàn phím ẩn KHÔNG chặn ô lưới bên dưới — nếu để `.aw-kbd` auto trơn sẽ chặn hàng đáy).
- **Bảng dùng hết màn**: `.aw-cw-gridwrap` absolute top:1cqw/bottom:0.5cqw → lưới to nhất, căn giữa, KHÔNG
  khuyết ô. `resizeGrid` = min(rộng/cols, cao/rows).
- **Slogan "CROSSWORD IN ANDREW CLASSES"**: chèn 1 `div.aw-cw-slogan` vào `.aw-topbar` (absolute căn
  giữa; xám #9aa3af, font system-ui **weight 300**, letter-spacing 0.32em, HOA, ~1.7cqw). Ở bảng, ô clue
  để RỖNG.
- **Câu hỏi (clue)**: `.aw-cw-cluebar` absolute top, **height CỐ ĐỊNH 11cqw** (KHÔNG auto — auto làm
  autoFit tưởng luôn tràn → co hết cỡ), **align-items:flex-start** (câu hỏi nằm CAO). Chữ 4.1cqw × --fit;
  autoFit **slack=4** (bẫy: bản cũ để `slack: clientWidth*0.04` ≈ 35px khiến chữ bị co còn ~17–28px). 1
  dòng nếu ngắn, 2 dòng nếu dài, dài quá mới co. Nền TRONG SUỐT + **text-shadow quầng** (ô sau vẫn nhìn
  mờ, không đè trắng). `pointer-events:none` trừ khi `.is-active` (mở hàng/cột → bấm clue để thoát).
- **positionActive đo bằng `offset*`** (bỏ qua transform trượt bàn phím) → dải ô đúng vị trí NGAY frame
  đầu, không giật. `topBound` = **đáy CHỮ thật** (`clueBar.offsetTop + clueText.offsetTop +
  clueText.offsetHeight`) nên hàng luôn căn giữa câu-hỏi↔bàn-phím dù 1 hay 2 dòng.
  - **Hàng**: dải NGANG, căn giữa dải `[đáy chữ, đỉnh bàn phím]` (đo được trên/dưới ~ bằng nhau).
  - **Cột**: dải DỌC ở `[mép phải bàn phím, mép phải khung]`, trên nút loa (đo trái/phải ~ bằng nhau).
- **Vào mượt**: set size TRƯỚC khi `display:flex` + class `.is-pop` (scale .9→1) → không phóng to quá rồi co.

**Luồng chơi**
- Chọn từ ở bảng → bung to + hiện bàn phím. **Trả lời xong MỖI câu → luôn về bảng (2,5s) + ẩn bàn phím,
  tự chọn câu kế**. KHÔNG next/prev, KHÔNG tự nhảy câu.
- **Ẩn Next/Back** = `navWrap.style.visibility="hidden"` (KHÔNG `display:none` — thanh dưới là lưới 3 cột
  trái|nav|phải, bỏ hẳn nav sẽ dồn nút loa/fullscreen vào giữa). *(Bài học chung mọi template.)*
- Option **"Change the crossword"** (mặc định BẬT): mở hàng/cột rồi bấm câu hỏi để thoát; TẮT = khoá,
  buộc trả lời. `onCellClick` chỉ chạy ở bảng, chọn từ CHƯA xong đi qua ô.
- Con trỏ luôn bắt đầu **ô đầu (index 0)**, gõ cả từ trái→phải.

**Ô có sẵn (given từ câu chéo)**
- Từ câu ĐÚNG → **chữ xanh** (`.is-given-ok`, var(--aw-accent)); từ câu SAI đã lộ đáp án → **chữ xám**
  (`.is-given-bad`). Gõ **sai** chữ lên ô given → ô **rung** (`.is-shake`) + chặn con trỏ; gõ **đúng** chữ
  đó → đi tiếp.

**Andrew** (1 lần/ván, chỉ khi mở hàng/cột): hiện chữ đáp án **vàng lấp lánh** trong ô (`.is-hint`), HS
tự gõ; nút tối khi dùng xong. ⚠️ `isDisabled` của Andrew **KHÔNG được chứa `curWord<0`** — lúc dựng bàn
phím curWord=-1, nếu disabled thì core `keyboard.js` KHÔNG gắn onclick (mất luôn nút).

**Chấm điểm (mỗi câu 2,5s rồi về bảng)**
- Đúng → ô accent, **+1 điểm NGAY khi sao vàng bắt đầu bay** (điểm đổi trước, sao chỉ là hiệu ứng).
- Sai + **Show-answer BẬT** → **✕ đỏ trên các ô sai TRƯỚC** (`showWrongMarks`, `.is-xmark`), ~1s sau mới
  **lộ chữ đúng** (`.is-revealed` nền xám). Ô given đúng giữ nguyên.
- Sai + **Show-answer TẮT** → **✕ xám** (`.is-wrong`).
- **Minus**: slider **"Points off when wrong" 0..5** (0 = tắt, KHÔNG còn checkbox). Sai + minus>0 →
  **-điểm NGAY khi sao đỏ bắt đầu bay**. Tắt minus thì không có sao/không đổi điểm khi sai.
- Điểm `livePoints` hiện **"N/total"**: số XANH khi ≥0, ĐỎ khi <0 (không dấu trừ), có nảy — ghi thẳng vào
  `ui.scoreEl` (class `.aw-cw-score-*`, vì trang này không nạp CSS của Type-the-answer).
- **`flyStars(kind)`**: 12 sao bung quanh dải → bay về điểm; vàng (gain) / đỏ (lose). Gắn vào `<body>` (px
  cố định), tự dọn; cleanup cũng xoá `.aw-cw-star`.
- **Timers**: `pushTimer/clearTimers` quản chuỗi kết thúc (pha ✕→chữ đúng + về bảng); xoá ở
  returnToBoard/finish/cleanup.

**Editor**: nút **Duplicate/Remove = ICON** (`icons.duplicate`/`icons.trash`, Remove đỏ khi hover, class
`.aw-cw-ed-iconbtn`); ô **clue tự nới cao** (`autoGrow`, `resize:none; overflow:hidden`) hiển thị hết chữ
ngay từ đầu.

**Còn treo (khi thầy muốn)**: `tpl.hideRandomOption` (ẩn nhóm Shuffle vô nghĩa) vẫn chưa làm — cần sửa
core; 🎤/🖼️ voice+image cho từng clue trong editor.

Tạo ngày 31/7/2026. Dựng lại từ act mẫu Wordwall của thầy (style **Classic**):
https://wordwall.net/resource/116864402/crossword — nghiên cứu đầy đủ trong `docs/09-CROSSWORD.md`.

## File của template
- `crossword.js` — game: **tự sinh lưới ô chữ interlock** từ danh sách từ + render + nhập liệu + chấm.
- `crossword.css` — style `.aw-cw-*` (theme-driven, cqw để fullscreen giữ tỷ lệ; cell px do JS tính).
- `sample-crossword.js` — 20 cặp {answer, clue} thật của act mẫu.
- `crossword-editor.js` — editor 2 cột **Answer | Clue** (thêm/xóa/nhân bản/dán Excel).
- `crossword-sound.js` — âm mp3 THẬT lấy từ Wordwall Classic (xem dưới).
- `sounds/` — 13 file mp3 (bộ âm Classic).
- `test.html` / `test.js` — trang chạy thử riêng.

## Cách chơi (khớp Wordwall)
- Màn Ready → Play. Lưới tự sinh từ các answer (chèn nhau ở chữ chung).
- Bấm 1 ô/1 từ → từ đó sáng lên, **gợi ý hiện to ở thanh trên**, con trỏ vào ô trống đầu tiên.
  Bấm lại vào ô giao nhau → **đổi hướng** ngang/dọc.
- Gõ chữ (bàn phím vật lý HOẶC bàn phím ảo) → điền ô + tự nhảy ô. ~~Khi đủ chữ cả từ → tự chấm~~
  **(ĐỔI 1/8/2026)**: đủ chữ KHÔNG tự chấm — bấm phím **Submit** trên bàn phím ảo (hoặc **Enter**
  bàn phím thật) để chốt đáp án, khi đó mới chấm:
  - Đúng → ô chuyển **màu accent + chữ trắng**, +1 điểm, âm "correct", tự sang từ chưa giải kế tiếp.
  - Sai → âm "wrong". Nếu bật **Show answer when wrong** → tự điền đáp án đúng + khóa từ (tính là đã
    trả lời, KHÔNG cộng điểm). Nếu tắt → nháy đỏ rồi xóa chữ để gõ lại.
- Tự kết thúc khi mọi từ đã giải/đã lộ. Menu **Submit answers** hoặc **Count down** hết giờ → kết thúc
  sớm (từ chưa trả lời = sai). Panel kết quả + Leaderboard + Show answers (do engine lo).

## Bàn phím ảo
- **MẶC ĐỊNH ẨN** (giống Wordwall: lưới hiện đầy, gõ bằng bàn phím vật lý). Nút bật/tắt nằm cạnh nút
  Menu (dùng `hasKeyboardToggle` + `ui.kbdSlot` của engine, y như Type the answer).
- Bật lên (cho màn cảm ứng TOMKO): bàn phím QWERTY chữ + phím ⌫; lưới thu nhỏ chia chỗ với bàn phím.

## Âm thanh (mp3 THẬT từ Wordwall Classic — KHÔNG dùng tiếng tổng hợp core)
Bộ âm nằm ở `sounds/` (copy từ `D:\APP AND DATA\AWord-data\Source\Sound effect\CROSSWORD`). Đã xác nhận
bằng cách CHƠI THẬT act Wordwall + đo độ dài file (chi tiết trong GHI CHU.md thư mục Source):
- `intro` (blockgameintro1) — bấm Play.
- `correct-01/02/03` (blockchipminor1/2/3, random) — giải đúng 1 từ.
- `incorrect-01/02/03` (blockchipfail1/2/3, random) — trả lời sai 1 từ.
- `gamecompleted` (blockgamesuccessful) — kết thúc / Submit.
- `timesup` (blockgametimeout) — Count down hết giờ (gắn vào hook `timeWarning`).
- `restart` (blockgamerestart) — Start again.
- (`menu`/`leaderboard`/`revealanswers` có sẵn trong `sounds/` để đủ bộ, nhưng các màn đó do ENGINE lo
  nên template không tự phát — giữ để đối chiếu/đề phòng sau này.)

## Options
- **Timer** (None/Count up/Count down) — engine.
- **Show answers** cuối game — engine (màn review).
- **Show answer when wrong** — riêng template (qua `buildExtraOptions`).
- **Ẩn** nhóm "Letters on answers" (`hideLettersOption: true`) — ô chữ không có nhãn A/B/C.

## Hạn chế đã biết / việc có thể làm sau (hỏi thầy)
1. **Lưới nhiều từ + bàn phím ảo bật = ô nhỏ** trên màn thấp (vd 20 từ → lưới 16 hàng; khi bật bàn phím
   ảo trên viewport 720px, ô ~11px). Trên màn TOMKO 4K / cửa sổ to thì ô lớn theo cqw, đọc tốt. Hướng
   nâng cấp giống Wordwall: khi bật bàn phím ảo thì **phóng to & cuộn theo từ đang chọn** thay vì thu cả
   lưới. Chưa làm (MVP).
2. **Nhóm "Random" (Shuffle) trong Options vẫn hiện** dù ô chữ cố định (crossword bỏ qua 2 cờ này).
   Engine chưa có cờ `hideRandomOption`. → **ĐỀ XUẤT SỬA CORE**: thêm `tpl.hideRandomOption` (giống
   `hideLettersOption`) để ẩn nhóm Random cho crossword. Tạm thời để hiện, template không đọc 2 cờ đó.
3. Ở màn Show answers, từ được "lộ đáp án khi sai" hiện đúng chữ đã lộ ở cột "đáp án của em" (vì đã điền
   sẵn) — khớp cách Wordwall hiển thị (đánh dấu ✗). Nếu muốn hiện đúng chữ HS gõ trước khi lộ thì cần
   lưu thêm bản nháp — chưa làm.
4. Voice/Image cho từng clue (Wordwall có icon 🎤/🖼️) — chưa làm (giống Anagram để bàn sau).

## ĐỀ XUẤT SỬA CORE (chờ phụ trách tổng)
- Thêm cờ `tpl.hideRandomOption` trong `core/engine.js` (ẩn nhóm "Random" của Options panel) — dùng cho
  Crossword. Không tự sửa core theo luật số 1.

## 1/8/2026 — Đổi sang BÀN PHÍM CHUẨN dùng chung (`core/keyboard.js`)

Thầy yêu cầu lấy y hệt bàn phím của Type the answer (4 hàng, tông tối cố định, caps/numbers/backspace/
space) làm bàn phím CHUẨN cho toàn hệ thống, áp dụng luôn cho Crossword. Xem chi tiết đầy đủ (thiết kế
module, quyết định của thầy) ở `GHI CHU TYPE-THE-ANSWER.md` mục "ĐỀ XUẤT SỬA CORE" (đợt 1/8/2026).

- Bỏ hẳn bàn phím 3 hàng cũ (`KBD_ROWS`/`buildKeyboard/letterKey/key`, CSS `.aw-cw-kbd*`/`.aw-cw-key*`).
- Dùng `createKeyboard({sound: ui.sound, onChar, onBackspace})` — KHÔNG có `submit` (crossword tự chấm
  ngay khi đủ chữ, không cần nút Submit) và KHÔNG có `extraKey` ("Andrew help" là riêng của Type the
  answer). `onChar` chỉ nhận chữ cái A-Z, bỏ qua Space/số/dấu câu (các phím đó vẫn HIỆN cho đồng bộ
  nhìn với mọi game khác nhưng bấm không làm gì — giống bàn phím thật, `onKey` vốn cũng chỉ nhận
  `[a-zA-Z]`).
- **Đổi tông màu**: bàn phím nay LUÔN tối (không đổi theo theme Classic/Beach như trước) — thầy chốt
  để đồng bộ toàn hệ thống.
- Test qua `test.html` (gõ "CARRY" bằng bàn phím ảo giả lập qua DOM vì pane phiên này bị lỗi toạ độ
  chuột (0,0), không composite frames): ô tự điền + điểm lên + chuyển từ kế tiếp; gõ sai → tự lộ đáp án
  đúng + chuyển từ kế tiếp. 0 lỗi console.

### 1/8/2026 (tiếp) — Bàn phím ĐỦ BỘ như bản chuẩn: thêm phím Andrew + Submit, ĐỔI LUẬT CHẤM

Thầy gửi 2 ảnh so sánh (bàn phím crossword thiếu nút vs bàn phím chuẩn) và chốt qua AskUserQuestion:
- **Phím Andrew** (1 lần/ván): hiện đáp án TỪ ĐANG CHỌN màu vàng ở CUỐI THANH GỢI Ý (span mới
  `.aw-cw-clue-answer`, gradient + glow y hệt TTA, keyframes nhân bản tên `aw-cw-andrew-*` vì trang
  crossword không nạp CSS của TTA); HS tự gõ lại — chép đúng VẪN được điểm (y hệt TTA). Trạng thái
  ready → glowing → used do core gắn; glow TẮT khi từ đó được chấm HOẶC HS rời sang từ khác
  (`consumeAndrewGlow()` gọi ở selectWord/onCellClick/moveCursor-đổi-từ/gradeWord/finish).
- **Phím Submit** (xanh) = **ĐỔI LUẬT CHẤM CẢ GAME**: gõ đủ chữ KHÔNG tự nhận nữa (bỏ auto-grade
  trong `typeLetter`); Submit sáng lên khi từ điền đủ (`wordFilled()`), bấm mới chấm
  (`submitCurrentWord()` → `gradeWord()`). Bàn phím thật: phím **Enter = Submit** (thêm vào `onKey`);
  Enter khi từ chưa đủ chữ → không làm gì. Sau chấm/xoá chữ/chuyển từ đều `kbd.refresh()` để
  Submit/Andrew đúng trạng thái theo từ đang chọn.
- **Đã test qua trình duyệt thật** (server riêng 5511, đo DOM): 4 hàng đủ `' q…p ⌫ / caps… ? /
  numbers… . , / Andrew Space Submit`; gõ đủ "CARRY" → KHÔNG tự chấm (0 ô xanh) + Submit sáng → bấm
  Submit → 5 ô xanh + điểm 0→1 + Submit khoá lại; Andrew → glowing + "CORRECT" vàng trên thanh gợi ý
  → điền + Submit → glow tắt + phím tối "is-used" + khoá cả ván; từ điền SAI + Submit → lộ đáp án
  (6 ô xám) + không cộng điểm + tự sang từ kế; Enter vật lý = Submit (từ chưa đủ → không làm gì, đủ →
  chấm); 0 lỗi console. File đụng: `crossword.js` + `crossword.css` (KHÔNG đụng core).

## Đã tự test (qua test.html, trình duyệt thật, 0 lỗi console)
- Sinh lưới interlock 20 từ (19 đặt được, 1 không chèn được thì bỏ khỏi lưới) — OK.
- Chọn từ (bấm ô), đổi hướng ở ô giao — OK. Gõ vật lý + bàn phím ảo — OK.
- Chấm ĐÚNG (ô xanh + điểm + âm), chấm SAI + lộ đáp án (ô xám + không điểm + âm) — OK.
- Submit → panel GAME COMPLETE (Score/Time) → Show answers (19 hàng, đúng/sai/No answer) — OK.
- Bật/tắt bàn phím ảo (lưới co lại vừa khít, không tràn) — OK.
- Đổi theme (Classic ↔ Beach): màu ô/chữ/gợi ý đổi theo accent, không vỡ — OK.

---

## Đợt 140 (13/8/2026) — BẢNG OPTIONS v2: tuỳ chọn riêng của template này chuyển sang lưới chung
✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Thầy yêu cầu thiết kế lại toàn bộ bảng Options (*"rất rối, khó nhìn, không thẳng
hàng"*); chi tiết đo đạc + 5 luật mới nằm ở `../../GHI CHU DU AN.md` Đợt 140 và
`../../core/HUONG DAN CORE.md` mục **"OPTIONS PANEL v2"**.

**Đổi ở template này**: `buildExtraOptions` viết lại bằng 4 hàm dựng chung engine truyền vào —
`mkCell` · `mkSeg` (thay hàng radio) · `mkSliderCell` (thanh trượt + chip giá trị 52px) ·
`addCheck` (đẩy ô tick vào khối switch dùng chung ở đáy panel).
**KHÔNG đổi**: tên trường trong `draft`/`activity.options`, khoảng giá trị, mặc định, hay bất kỳ hành
vi nào lúc chơi. Act cũ mở lên vẫn đúng y như trước.

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **447px → 280px**.
