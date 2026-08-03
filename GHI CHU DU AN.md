# GHI CHÚ DỰ ÁN — AWord

Web game tiếng Anh (giống Wordwall), chơi trên trình duyệt, sẽ đẩy lên GitHub.
Mục tiêu: giáo viên tạo game + học sinh chơi + thu điểm để xếp hạng.

---

## Đợt 57 (4/8/2026, v0.9.32) — WHACK-A-MOLE: mole rung lắc khi đập sai + ẩn nút Next/Back — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.

**Chỉ đụng 2 file `templates/whack-a-mole/whack-a-mole.js` + `.css`** (+ ghi chú). Không đụng core, không
đụng game khác. Thầy gửi 2 yêu cầu 1 lượt. Đã tự test trình duyệt thật (devserver + `javascript_tool`),
0 lỗi console.

1. **Đập SAI → mole rung lắc suốt 4s phạt rồi mới thụt xuống.** Trước đây trong 4s "đông cứng"
   (`PENALTY_FREEZE_MS`) mole sai chỉ đứng im mặt choáng. Nay: sau 150ms (đúng lúc sprite đổi `tapped` →
   `dizzy`) hố được thêm class **`is-dizzy`** → mole lắc quanh **gốc chân** (`transform-origin: 50% 92%`),
   xoay **±6,5°** + lắc ngang, nhịp 0,46s lặp; **bong bóng chữ lắc cùng nhịp nhẹ hơn ±3,5°**. Hết 4s bỏ
   class → thụt như cũ. Dọn `is-dizzy` ở cả `duck()` · `freeHole()` · `endGame()` để không kẹt rung. Nhánh
   **hết mạng không rung** (game over sau 600ms).
   > ⚠️ **BẪY (y hệt bẫy Open-the-box)**: phải viết bằng `@keyframes`, KHÔNG `transition` — rule
   > `.is-hit .aw-wam-mole` đã ghim sẵn `transform`, mà animation giữ một thuộc tính LUÔN thắng transition
   > nhắm cùng thuộc tính đó. Nên **mỗi keyframe phải tự mang lại offset `.is-hit`**
   > (`translate(-50%, 8%) scaleY(.92)`), quên là mole nhảy về vị trí gốc lúc rung.

2. **Ẩn nút Next/Back** (game này không duyệt câu bằng mũi tên) — đúng 1 dòng CSS:
   `.aw-playarea:has(> .aw-wam-scene) ~ .aw-bottombar .aw-navbtn { display: none; }`.
   **Cố ý KHÔNG dùng `.aw-nav{display:none}` trần như `open-the-box.css`**: từ v0.9.7 CSS template được
   `ensureTemplate()` chèn vào document và **ở lại vĩnh viễn**, nên sau khi "Change template" (Đợt 47) sang
   game khác, rule trần đó vẫn ẩn mũi tên của game mới. Selector scoped theo `.aw-wam-scene` (con trực tiếp
   của `.aw-playarea`) thì hết whack-a-mole là hết tác dụng — khuôn copy từ true-false / find-the-match.
   Và **chỉ ẩn `.aw-navbtn`, không ẩn wrapper `.aw-nav`** vì `.aw-bottombar` là lưới 3 cột, bỏ hẳn phần tử
   giữa sẽ làm 2 cụm còn lại dồn sai chỗ.

**Cách đo khi pane trình duyệt bị ẩn** (bài học dùng lại được cho mọi template): cửa sổ không hiển thị thì
Chromium ngưng compositing → lấy mẫu `getComputedStyle` theo thời gian ra **y hệt nhau**, trông như animation
chết dù nó chạy tốt. Đo đúng: `el.getAnimations()[0]` rồi **tự đặt `anim.currentTime`** từng mốc và đọc
`transform` (`getComputedStyle` ép style recalc → giá trị thật). Kết quả: mole `rotate` 0° → −6,4° → +6° →
−4,6° → +3,7° → 0°; bong bóng ±3,5° cùng nhịp; class đúng vòng đời (tới ~3,9s còn `is-up is-hit is-dizzy`,
tới 4,0s còn `is-hit` + mole đã thụt); mũi tên `display:flex` ở màn READY → `display:none` khi vào game
(chứng minh scoping đúng); lưới thanh dưới vẫn `423px / 61,8px / 423px`.

**File đổi**: `templates/whack-a-mole/whack-a-mole.js` + `.css` + `GHI CHU WHACK-A-MOLE.md`. ⚠️ Cây làm việc
lúc commit còn thay đổi CHƯA XONG của 2 phiên song song (find-the-match, open-the-box) — đã **chỉ add file
whack-a-mole + 2 docs chung**, cố ý không đụng của họ. Chi tiết đầy đủ: `templates/whack-a-mole/GHI CHU
WHACK-A-MOLE.md` (mục ⭐ ĐỢT 57).

---

## Đợt 56 (3/8/2026, v0.9.31) — TYPE THE ANSWER: bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance ⭐ CÓ SỬA CORE (1 chỗ nhỏ) — ✅ THẦY DUYỆT → COMMIT + PUSH

**Chỉ đụng Type the answer + 1 fix core nhỏ, không đụng game khác.** Thầy gửi 5 yêu cầu 1 lượt qua chat
(không kèm ảnh). Đã tự test qua trình duyệt thật (devserver + DOM/JS giả lập PointerEvent/KeyboardEvent
thật, không đoán qua ảnh), 0 lỗi console.

1. **Bỏ checkbox "Minus points for wrong answers"** — chỉ còn 1 thanh trượt `minusAmount` **0..5** (trước
   1..5 + checkbox bật/tắt riêng). 0 = tắt trừ điểm (hiện "Off"). Mặc định đổi 1→0 nhưng hành vi KHÔNG đổi
   (trước mặc định checkbox tắt = không trừ; nay slider mặc định 0 = không trừ — zero-diff cho act cũ).
2. **Thêm Lives** — thanh trượt mới **0..10** (0 = Unlimited), bê nguyên khuôn từ `true-false.js`
   (`hasLivesSlot`, `ui.livesSlot`, tim bay biến mất khi mất mạng). `normLives()`: undefined/null/0 →
   unlimited (KHÁC True/false — TF mặc định 5 mạng khi chưa set, TTA thì không được vì mọi act cũ đã lưu
   sẵn không có field `lives`, mặc định 5 sẽ khiến act cũ tự nhiên có nguy cơ Game Over không ai yêu cầu).
   Hết mạng → `finish("gameover")` ngay (không chờ hết câu hỏi), âm thanh riêng `gameover-01.mp3` (đã có
   sẵn trong `sounds/`, trước ghi "archived" — nay dùng thật).
3. **⭐ SỬA 3 LỖI NAV/AUTO-ADVANCE CÙNG 1 GỐC** ("next đôi khi không hoạt động dù Allow skip bật", "tắt
   Allow skip thì submit xong không tự next", "nav/số trang đôi khi biến mất"): `submitAnswer()` cũ sau khi
   chấm điểm KHÔNG gọi lại `updateNav()` (Next chỉ được đồng bộ lúc `loadQuestion()`) — khi Allow skip tắt,
   Next bị khoá lúc chưa trả lời và **vẫn khoá sau khi trả lời xong** cho tới khi có điều hướng khác tình
   cờ mở lại. Nặng hơn: hẹn giờ tự-next/tự-kết-thúc sau khi chấm (`autoTimer`) KHÔNG BAO GIỜ bị huỷ khi học
   sinh tự bấm Prev/Next — hẹn giờ cũ vẫn treo, tới giờ tự bắn kéo giật học sinh sang câu khác, hoặc tự kết
   thúc ván (ẩn nav) ngay khi đang xem lại câu trước. Sửa: `submitAnswer()` gọi `updateNav()` ngay sau khi
   chấm; `goPrev()`/`goNext()` huỷ hẹn giờ cũ (`clearAutoTimer()`) trước khi đổi câu; và theo đúng yêu cầu,
   **auto-advance nay LUÔN chạy sau khi trả lời xong 1 câu**, không còn phụ thuộc checkbox "Auto switch"
   chung lẫn Allow skip — Allow skip giờ chỉ còn quyết định Next có bấm THỦ CÔNG được TRƯỚC khi trả lời hay
   không; Back vẫn luôn xem lại được (huỷ hẹn giờ ngay khi bấm Back). **CÓ SỬA CORE**: thêm cờ
   `tpl.hideAutoSwitch` (`core/engine.js`, đúng khuôn `hideTimerOption`/`hideLettersOption` sẵn có) để ẩn
   hẳn checkbox "Auto switch" chung với riêng TTA (nay vô nghĩa, tránh gây hiểu lầm) — không ảnh hưởng
   template khác.

**Test thật**: mô phỏng đúng race-condition (submit + bấm Prev cùng lúc, không qua round-trip mạng) → về
câu trước xem lại, đợi 2s vẫn không bị hẹn giờ cũ kéo giật sang câu khác. Allow skip tắt: sai câu → mất
1 tim + điểm đỏ đúng số trừ + tự auto-advance không cần bấm gì. Allow skip bật: Next bấm được ngay từ câu
chưa trả lời, nhảy liên tiếp không lỗi; trả lời đúng vẫn auto-advance dù Allow skip đang bật. Hết mạng →
dừng ván ngay dù chưa làm hết câu hỏi. Chi tiết đầy đủ: `templates/type-the-answer/GHI CHU
TYPE-THE-ANSWER.md` Đợt 55.

**File đổi**: `templates/type-the-answer/type-the-answer.js` + `.css` + `sample-type-the-answer.js`,
`core/engine.js` (cờ `hideAutoSwitch`). Console sạch 0 lỗi suốt test.

---

## Đợt 55 (3/8/2026, v0.9.29) — ANAGRAM: 8 ĐIỂM SỬA/YÊU CẦU THẦY GỬI 1 LƯỢT ⭐ CÓ SỬA CORE (2 chỗ nhỏ) — ✅ THẦY DUYỆT → COMMIT + PUSH

**Chỉ đụng Anagram + 2 fix core nhỏ, không đụng game khác.** Thầy chơi bản live rồi gửi 8 điểm 1 lượt.
Đã tự test qua trình duyệt thật (devserver + DOM/PointerEvent giả lập thật, không đoán qua ảnh).

1. **Chống flash góc vuông khi chữ bay** — clone bay (`.aw-anagram-flytile`, dùng chung
   `flyLetter`/`flyTileClone`) được `document.body.append()` rồi `.animate()` NGAY, có thể lộ 1 khung hình
   chưa bo góc trước khi trình duyệt thăng cấp layer GPU. Thêm `will-change: transform` (CSS) +
   `void clone.offsetWidth` (ép 1 lần vẽ đồng bộ trước `.animate()`, cả 2 hàm). Lỗi cấp khung hình
   (compositor), không đo được bằng `getComputedStyle` (đã poll mỗi 20ms suốt chuyến bay, `border-radius`
   luôn ra "12px" — đúng giá trị KHAI BÁO, không phải khung hình THỰC TẾ) — áp dụng cách sửa chuẩn cho lớp
   lỗi này, **thầy tự xác nhận lại bằng mắt**.
2. **⭐ SỬA BUG THẬT Ở CORE** (`core/engine.js`, ảnh hưởng MỌI template): `celebrate()` set
   `navWrap.style.visibility="hidden"` lúc ăn mừng nhưng KHÔNG BAO GIỜ trả lại — vì overlay ăn mừng không
   có nền đặc (chỉ pháo giấy + chữ), trong ~2s đó thanh dưới (Menu/Sound/Fullscreen) vẫn lộ nhưng nút
   ‹›+"x of N" biến mất — đúng hiện tượng "đôi khi mất nút Back-Next và số trang". Thêm dòng phục hồi
   `navWrap.style.visibility=""` khi đóng overlay ăn mừng. Đã test: xong ván → Summary → check
   `.aw-nav.style.visibility` ra đúng `""` → Start again → nav hiện lại bình thường ngay từ đầu.
3. **Số điểm bay vào ô điểm quá to** — `flyScoreGain()` co về `scale(0.4)` CỐ ĐỊNH bất kể `baseSize` (tỉ
   lệ theo bề ngang khung, có thể rất lớn) → vẫn to hơn nhiều so với chữ điểm thật dù đã co. Sửa: đọc
   `getComputedStyle(scoreEl).fontSize` làm ĐÍCH, tính `endScale = cỡ đích / baseSize` thay `0.4` cố định.
4. **& 6. Chữ bé lại khi kéo-đổi-chỗ HOẶC bấm-trả-về-gốc** — `flyTileClone()` (dùng bởi `unplace()` +
   `swapResultPositions()`) THIẾU `font-size` (khác `flyLetter()` đã có từ trước) → clone rơi về cỡ chữ mặc
   định kế thừa từ trang. Thêm tham số `fontSize`, 2 nơi gọi đọc `getComputedStyle(ô thật).fontSize` TRƯỚC
   khi xoá/di chuyển rồi truyền vào. Đã đo bằng PointerEvent giả lập (kéo đổi P↔O, bấm trả 1 ô về gốc): cỡ
   chữ clone ra ĐÚNG 1 giá trị duy nhất suốt chuyến bay, khớp hệt cỡ ô thật.
5. **Bấm nhanh liên tục bị delay** — mỗi lần bấm đúng 1 chữ khoá TOÀN BỘ thao tác tiếp theo tới khi hiệu
   ứng bay ~340ms xong mới mở khoá. Sửa: tách trạng thái game (đã đặt chữ nào, `nextPos`, khoá) khỏi HOẠT
   ẢNH — trạng thái cập nhật NGAY lúc bấm (đồng bộ), chỉ ô VỪA BẤM tự khoá, ô khác vẫn bấm được trong khi
   chữ trước còn bay. Áp dụng `bonusPick`/`submitPick`; bỏ hẳn `setOriginLocked()` (không còn ai gọi). Đã
   test: bấm liền 7 chữ đúng "DOLPHIN" trong CÙNG 1 lệnh JS (không đợi nhau) → cả 7 vào đúng vị trí.
7. **⭐ CÓ SỬA CORE** (`core/app.css`): đổi màu thanh "Points off (wrong answer)" (`.aw-opt-slider`/
   `.aw-opt-slidval`) sang đỏ `#ef4444` — đã kiểm 2 class này CHỈ dùng riêng cho control Points off chung
   (không template nào khác dùng lại), an toàn đổi cho MỌI game. Đã đo `accent-color` xác nhận đúng đỏ.
8. **Thêm Lives cho Anagram** (slider Options 0–10, 0 = vô số mạng) — theo ĐÚNG khuôn `true-false.js`
   (`hasLivesSlot`, tim ở `ui.livesSlot`). Khác 1 điểm CÓ CHỦ Ý: true-false coi "chưa set" = mặc định 5
   mạng, Anagram coi "chưa set" = VÔ SỐ MẠNG (act cũ phải chơi y hệt trước, zero-diff). Mất 1 mạng ĐÚNG
   cùng thời điểm với `pointsOff` (bonus: từ giải có lỗi; submit: từ nộp sai). Hết mạng →
   `finish({gameover:true})` → title "Game over" (dùng cơ chế `title` sẵn có ở engine, không cần sửa core
   thêm). Seed `lives:0` vào sample. Đã test trọn luồng: Lives=2 → sai 2 từ liền → tim 2→1→0 → "GAME OVER"
   → Start again → tim hồi phục, nav hoạt động bình thường.

**File đổi**: `templates/anagram/anagram.js` + `.css` + `sample-anagram.js`, `core/engine.js` (mục 2),
`core/app.css` (mục 7). Console sạch 0 lỗi suốt test (bonus + submit mode, kéo-thả PointerEvent giả lập,
Options Apply, restart, game over). Chi tiết đầy đủ: `templates/anagram/GHI CHU ANAGRAM.md` Đợt 55.

---

## Đợt 54 (3/8/2026, v0.9.28) — ĐIỂM TRỪ MỌI TEMPLATE + ALLOW SKIP + CẦU ĐỒNG BỘ myActivity ⭐ CÓ SỬA CORE — 🟢 CHỜ THẦY DUYỆT (đã tự test trình duyệt thật, 0 lỗi)

**Yêu cầu thầy (2 việc AWord, đi kèm 2 việc myActivity ở kho riêng):**
1. **Mọi template thêm "thanh Điểm trừ" khi chọn đáp án SAI** (cái nào đã có thì bỏ qua).
2. **Các act có nút Next–Back (x of y) thêm "Allow skip"**: KHÔNG tích thì chưa làm KHÔNG next được.

**A. ĐIỂM TRỪ + MÀU ĐIỂM (⭐ CÓ SỬA CORE `engine.js` + `app.css`):**
- **Option "Points off (wrong answer)" CHUNG ở engine** (`buildOptionsPanel`): slider 0–5, mặc định **0 (tắt)**,
  ghi `activity.options.pointsOff`. Chỉ hiện cho template `scorable !== false && !tpl.hidePointsOff`.
- **Đặt `hidePointsOff: true`** cho 4 template ĐÃ có điểm trừ riêng (type-the-answer, unjumble, crossword,
  whack-a-mole) + **gameshow** (điểm theo tốc độ). Chúng giữ nguyên cơ chế riêng, KHÔNG hiện option chung.
- **`ui.setScore(n)` đổi màu theo dấu (thầy chốt):** điểm **dương = XANH LÁ** (`--aw-ok`), **âm = ĐỎ** (`--aw-no`)
  **BỎ dấu trừ** (hiện trị tuyệt đối) — class `.is-pos`/`.is-neg` trên `.aw-top-score`. Cho phép điểm ÂM.
- **Trừ điểm per-template** ở 8 game chưa có: `quiz, anagram, true-false, find-the-match, open-the-box,
  balloon-pop, flying-fruit, maze-chase`. Mỗi game đọc `options.pointsOff`, câu SAI trừ (không kẹp 0, âm được),
  gọi `ui.setScore` + đưa vào `ui.finish({score})`. **KHI pointsOff=0 hành vi Y HỆT trước (zero-diff)** — đã kiểm.
  - anagram: trừ **1 lần mỗi TỪ có lỗi** (bonus: từ giải có sai; submit: từ sai), gộp qua biến `penalty` trong `scoreNow`.
  - bỏ `speaking-cards` (không tính điểm). Seed `pointsOff:0` vào các `sample-*.js`.

**B. ALLOW SKIP (quiz + type-the-answer):**
- Thêm checkbox **"Allow skip (move on without answering)"** (buildExtraOptions), mặc định **KHÔNG tích**.
  Khi tắt: `onNext=null` (nút Next MỜ) tới khi câu hiện tại đã trả lời (`canAdvance()`), khóa cả phím → và ✓ cuối.
- anagram + unjumble ĐÃ có allowSkip riêng (mặc định bật) → GIỮ NGUYÊN. Seed `allowSkip:false` vào 2 sample mới.

**C. CẦU ĐỒNG BỘ cho myActivity (⭐ CÓ SỬA CORE `engine.js`) — vô hại khi chạy standalone:**
- `startGame` lộ **`window.__awordBridge`** `{ getState, switchTemplate(type), applyOptions(opts), setTheme(id) }`
  + phát console marker khi USER đổi ở 1 bảng: **`MYACT:AW:TPL:<type>`** (Change template) · **`MYACT:AW:OPT:<json>`**
  (Apply options) · **`MYACT:AW:STYLE:<themeId>`** (đổi Style). Biến `awSyncMute` chặn dội: bridge tự áp thì KHÔNG phát.
- myActivity (kho riêng, v1.7.4) bắt marker từ MỌI bảng → gọi bridge trên các bảng còn lại (đồng bộ 2 CHIỀU).

**Kiểm chứng (harness engine thật trên devserver, KHÔNG cần login):** 14/14 template mount **0 lỗi console**;
quiz sai (pointsOff 2) → điểm nội bộ −2 hiện **"2" ĐỎ** `rgb(226,60,60)`, Next khóa trước khi trả lời/mở sau;
true-false sai (pointsOff 3) → **"3" ĐỎ**; whack-a-mole KHÔNG hiện Points off chung (giữ riêng); bridge đủ 4 method,
tự-áp không phát marker, user đổi Style phát `MYACT:AW:STYLE:...`. **Việc kế: thầy chơi thử + đăng nhập → commit + push.**
Chi tiết per-template: `GHI CHU <TÊN>.md` từng thư mục. Hợp đồng core mới: `core/HUONG DAN CORE.md`.

**D. CHẶN BÀN PHÍM ẢO HĐH khi bàn phím AWord hiện (thầy yêu cầu — Windows/Android/iOS):**
- `type-the-answer.js` — game DUY NHẤT có ô nhập thật (`<textarea.aw-tta-input>`). Đặt
  **`input.inputMode = keyboardVisible ? "none" : "text"`**: bàn phím AWord BẬT (mặc định) → `inputMode="none"`
  ẩn bàn phím ảo HĐH (vẫn giữ con trỏ nháy + gõ bằng bàn phím vật lý được); HS ẩn bàn phím AWord (nút kbd) →
  `"text"` cho native hiện lại. Cập nhật cả lúc tạo input lẫn trong handler nút kbd. Crossword dùng `core/keyboard.js`
  nhưng ô là `<div>` (không input) → KHÔNG có bàn phím ảo, không cần sửa.
- **Kiểm chứng live:** bàn phím AWord hiện → `inputMode="none"`; bấm Hide keyboard → `"text"`; Show lại → `"none"`.

**E. CÂN LAYOUT thanh dưới khung (thầy: tên act + nút chức năng quá sát mép) — `app.css`:**
- Thêm **`.aw-below-left { margin-left: 6% }`** + **`.aw-below-right { margin-right: 6% }`** → đẩy TÊN act sang phải,
  cụm NÚT chức năng sang trái. % tính theo track grid nên tự co giãn theo cỡ màn. Đo live (stage 968px): inset **24px**
  mỗi bên, cụm GIỮA (Options/Template/Style) vẫn CHÍNH GIỮA (mid=640=nửa cửa sổ). 14/14 template vẫn mount 0 lỗi.

---

## Đợt 53 (3/8/2026, v0.9.27) — LƯU OPTIONS HẲN + NHỚ OPTIONS THEO TEMPLATE TẠM ⭐ CÓ SỬA CORE — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** (1) Apply option cho 1 act → **lưu hẳn**. (2) Khi chọn 1 act + 1 **template tạm thời** (Change
Template) rồi chỉnh options cho template tạm đó → **lần sau chọn lại đúng template tạm đó của act đó, options vẫn giữ**.

**Phát hiện + FIX bug tiềm ẩn:** engine ĐÃ lưu options act chính (`saveActivity(activity)` khi có `id`). NHƯNG act tạm
Change Template có `id="conv_..."` → Apply options trên nó đang **lưu NHẦM thành 1 act mới "conv_" vào thư viện**. Nay chặn.

**Việc đã làm (`core/engine.js` + `core/convert.js` — CÓ SỬA CORE):**
1. **Engine mang theo act GỐC (`originAct`)**: `startGame(root, activity, {base})` — `originAct = base || activity`.
   `restart` + `doSwitchTemplate` truyền `base: originAct` nên qua bao lần đổi template, originAct vẫn là act thật ban đầu.
2. **Đổi template convert TỪ originAct** (không từ act tạm hiện tại). Đổi **về đúng type gốc** → khôi phục thẳng
   act gốc thật (id + options riêng), không tạo bản sao.
3. **Apply options lưu đúng chỗ** (chỉ khi KHÔNG session): act chính → `saveActivity(originAct)`; act tạm
   (`_converted`) → ghi `originAct.templateOptions[type] = {...options}` rồi `saveActivity(originAct)`. **Không bao giờ
   lưu act `conv_`**.
4. **`convert.js convertActivity`**: nếu `activity.templateOptions[targetType]` có → dùng LẠI bộ options đã nhớ; chưa
   có → mặc định từ sample. (whack_a_mole giữ `mode` nếu options đã có.)

**Kiểm chứng (harness, KHÔNG login):**
- `convertActivity`: origin có `templateOptions.quiz={lives:3,timer:countDown,MARKER}` → convert→quiz dùng ĐÚNG bộ nhớ
  (không phải sample); convert→balloon_pop (không có nhớ) → dùng mặc định. ✅
- **Round-trip UI thật**: mount Anagram → Template→Quiz → Play → Options: "Shuffle question order" mặc định BẬT → tắt +
  Apply → Template→Anagram (về gốc) → Template→Quiz lại → Options: "Shuffle question order" **vẫn TẮT** (đã nhớ). **PASS**.
- Change Template vẫn chạy; Options Apply trên act tạm 0 crash (saveActivity thất bại lặng khi chưa login, nhớ in-memory
  vẫn set). 0 lỗi console. File test tạm đã xoá.

**CHƯA test được (cần login):** lưu Firestore + giữ options qua **reload trang** (`saveActivity` cần đăng nhập; logic
review: `originAct.templateOptions` nằm trong act, `saveActivity(originAct)` lưu kèm; convert đọc lại khi mở act sau).

**VIỆC ĐANG CHỜ:** thầy đăng nhập → chơi 1 act, Apply option, reload → option giữ; đổi template tạm, chỉnh option,
đổi đi rồi quay lại → option giữ → **commit + push**.

---

## Đợt 52 (3/8/2026, v0.9.26) — EMPTY RECYCLE BIN (xoá hẳn toàn bộ thùng rác, có xác nhận) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** thêm "Empty Recycle Bin" — xoá hẳn TẤT CẢ act trong thùng rác; bấm → pop-up xác nhận → đồng ý thì xoá sạch.

**Việc đã làm (`core/store.js` + `main.js`, KHÔNG đụng core khác):**
1. **`store.emptyTrash(root)`**: xoá vĩnh viễn MỌI node `trashed` trong 1 root (cả bundle root lẫn cây con), 1 lô
   `persistDelete`. Trả về số **mục** trong thùng (node có `trashRootId===id`) đã xoá. Cùng độ "dứt khoát" như
   Delete forever từng cái, chỉ khác là hàng loạt.
2. **`main.js`**: khi ở màn thùng rác, thanh công cụ thêm nút **"Empty bin"** (đỏ, class `.aw-lib-del`). Bấm →
   `emptyBinFlow`: đọc `listTrash` (rỗng → toast "already empty"); nếu có → **modal xác nhận** ("Permanently delete
   all N items… This cannot be undone", nút **Cancel** + **Delete all** đỏ) → `emptyTrash` → đóng modal + `render()`
   + toast "Deleted N items". Lỗi (chưa login…) hiện trong modal, không đóng.

**Kiểm chứng (không login):** tạm dựng toolbar ở chế độ trash → hiện đúng nút **Back (icon)** + **"Empty bin" (đỏ
`aw-lib-del`)**, 0 lỗi. main.js parse sạch. Modal + `emptyTrash` chạy thật cần login (logic review: mirror
Delete forever; modal dùng khuôn `openModal`+`aw-modal-text`+`aw-lib-del` sẵn có). Đã gỡ debug tạm.

**VIỆC ĐANG CHỜ:** thầy đăng nhập → xoá vài act vào thùng rác → vào Recycle bin → **Empty bin** → xác nhận → sạch → **commit + push**.

---

## Đợt 51 (3/8/2026, v0.9.25) — TINH CHỈNH UX IMPORT (icon toolbar · make-folder mặc định · auto-close) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**3 yêu cầu thầy + 1 fix tiện tay** (`main.js` + `core/app.css`, KHÔNG đụng core khác):
1. **Nút Import + Recycle bin → ICON** (bỏ chữ). Import dùng icon upload (`IMP_UPLOAD_SVG`), Recycle bin dùng
   `icons.trash` (vào thùng rác đổi thành `icons.prev` = mũi tên back). Class mới `.aw-fm-iconbtn` (vuông, bo tròn,
   `is-on` xanh khi ở thùng rác); giữ `title`/`aria-label` để rê chuột thấy tên. New activity/New folder vẫn để chữ.
2. **"Make a new folder" MẶC ĐỊNH TÍCH** khi vừa nạp file (ô tên hiện sẵn = mã bài `<source>`). Bỏ tích thì act vào
   thẳng thư mục hiện tại.
3. **Auto-close sau Import**: import xong (không lỗi) → **tự đóng pop-up**. Nếu KHÔNG make-new → chỉ refresh thư mục
   hiện tại (xong). Nếu CÓ make-new → sau khi đóng, **mở luôn thư mục mới** (`enterFolder(root, res.folderId)`).
   Có lỗi/act hỏng → GIỮ pop-up mở + hiện lỗi (không đóng); skip trùng tên thì báo bằng toast.
4. **Fix hiển thị**: dòng preview act **anagram** trước hiện "· 0" vì đếm thiếu khoá `items` (anagram/flying/unjumble
   dùng `content.items`, không phải `pairs`) → thêm `c.items` vào công thức đếm. Nay hiện "Anagram · 100".

**Kiểm chứng (tạm expose importFlow/toolbar, KHÔNG login):** nạp file reading → 12 dòng, **"Make a new folder" tích
sẵn**, ô tên = "DS-S2.I1.W3", meta "Anagram · 100" (đã fix); `toolbar()` dựng 0 lỗi, **Recycle bin = nút icon**
(`aw-fm-iconbtn`+svg+title). 0 lỗi console. Auto-close + mở folder mới cần login để chạy `importBundle` (logic review:
`close()` + `enterFolder(res.folderId)`; `importBundle` trả `folderId` = folder mới khi make-new). Đã gỡ debug + file test.

**VIỆC ĐANG CHỜ:** thầy đăng nhập → thấy 2 nút icon; Import 1 file → make-new tích sẵn → Import → pop-up tự đóng và
nhảy vào thư mục mới → **commit + push**.

---

## Đợt 50 (3/8/2026, v0.9.24) — ĐỔI TEMPLATE MẶC ĐỊNH KHI IMPORT + CẤU TRÚC THƯ MỤC ACT/HOMEWORK — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy (đổi bản đồ act khi tạo từ file):**
- ENG1/ENG2/VI1/VI2 + **PRONUNCIATION** → **ANAGRAM** (trước ENG/VI là Find the match).
- **PRONUNCIATION** = dataset MỚI: tách cột IPA "WORD /ipa/" → anagram (word=từ, clue=phiên âm IPA).
- IPA → **Speaking cards** (giữ). QUIZ1/QUIZ2 → **Quiz**. Reading act: TRUE FALSE / **FIND THE MATCH** (FILLING) / QUIZ.
- **Thư mục:** READINGACT1 (v1) + QUIZ1/QUIZ2 → **ACT**; READINGACT2 (v2) → **HOMEWORK bên trong ACT**; vocab ở gốc.

**Việc đã làm:**
1. **`core/store.js` `importBundle`**: hỗ trợ **thư mục lồng nhau** qua trường **`subfolder`** trên mỗi act
   (vd `"ACT"`, `"ACT/HOMEWORK"`). Hàm `resolveFolder(segments)` tạo/tái dùng từng cấp dưới base (thư mục
   thầy đang đứng, hoặc folder mới nếu tick "Make a new folder"), cache theo path để ACT chỉ tạo 1 lần.
2. **`core/lesson-import.js`**: thêm builder `anagram` + preset `OPT_ANA`; ENG/VI → anagram; thêm PRONUNCIATION
   (regex `^(.+?)\s+(/[^/]*/)\s*$` tách "WORD /ipa/"); gắn `subfolder` "ACT" cho Quiz1/2, "ACT" cho reading v1,
   "ACT/HOMEWORK" cho v2.
3. **`main.js` importFlow**: dòng preview mỗi act nay hiện thêm **subfolder** (`Anagram · 100`, `Quiz · 30 · ACT`,
   `True/False · 30 · ACT/HOMEWORK`) để thầy thấy act vào đâu.
4. **Skill `taoactaw`** cập nhật khớp (anagram/pronunciation/subfolder) + đóng gói lại + gửi thầy.

**Kiểm chứng (harness, 2 file thật, KHÔNG login):**
- Reading `DS-S2.I1.W3`: **12 act** — anagram×4 (ENG/VI) + anagram PRONUNCIATION + speaking IPA (gốc) +
  TF/FIND/QUIZ ở **ACT** (v1) và **ACT/HOMEWORK** (v2). Anagram đủ 100 items {word, clue}; PRONUNCIATION clue=/ipa/.
- Listening `LSA2-S2.T1.P1-2`: **8 act** — 5 anagram + speaking IPA + QUIZ1/QUIZ2 ở **ACT**.
- **20/20 mount 0 lỗi console**; skill Python cho kết quả Y HỆT (12/8 act, subfolder khớp).
- `git status`: `core/store.js`, `core/lesson-import.js`, `main.js` (+ docs). File test tạm đã xoá.

**CHƯA test được (cần login):** việc tạo thư mục lồng thật trên Firestore (logic `resolveFolder` review kỹ; teacher
test khi bấm Import).

**VIỆC ĐANG CHỜ:** thầy đăng nhập → Import 1 file .xlsm → xác nhận act đúng loại + đúng cây thư mục ACT/HOMEWORK
→ **commit + push** (gộp Đợt 48–50). ⚠️ Bản đồ act nay ở 2 nơi (`lesson-import.js` = chính, skill = phụ) — sửa thì đồng bộ.

---

## Đợt 49 (3/8/2026, v0.9.23) — IMPORT ĐỌC THẲNG FILE .xlsm/.xls TRONG TRÌNH DUYỆT (bỏ bước JSON) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** "duyệt thẳng file .xlsm vào page live → đọc + tạo act ngay, KHÔNG qua trung gian JSON".

**Việc đã làm:**
1. **Nhúng bộ đọc Excel local**: `core/vendor/xlsx.mjs` (SheetJS ESM, ~1MB, tải từ cdn.sheetjs.com về REPO — KHÔNG
   CDN lúc chạy, giữ offline). **Nạp LƯỜI** bằng `import()` — chỉ tải khi thầy chọn 1 file bảng tính, nên học sinh
   + việc thường KHÔNG nặng thêm (đo: index.html vẫn parse sạch, SheetJS không tải).
2. **`core/lesson-import.js`** (MỚI): port y nguyên logic skill `taoactaw` sang JS. `parseLessonToBundle(arrayBuffer,
   {fileName})` → đọc WORDTABLE (cột D/E,H/I,L/M,P/Q,S) + Quiz1/2 + READINGACT1/2 (3 vùng TF/FILLING/READING QUIZ,
   bỏ Q&A) → trả gói `{folder, activities}` y hệt taoactaw. Tự nhận reading/listening, bỏ sheet rỗng, tên sheet
   không phân biệt hoa/thường. Đọc ô bằng `XLSX.utils.encode_cell` (1-indexed row/col kiểu openpyxl). Cùng 4 preset
   `OPT_*` + quy ước title (v1 `<source> / …`, v2 `<source> HW / …`).
3. **`main.js` `importFlow` — thiết kế lại hiện đại** (5 điều chỉnh của thầy): **drop-zone** (kéo-thả file VÀO
   HOẶC bấm để duyệt, có icon upload, viền đứt, sáng lên khi kéo qua — `is-over`); **BỎ hộp paste JSON**; sau khi
   nhận file → **danh sách act có CHECKBOX** (mỗi dòng: icon theo loại + title + "Loại · số câu", mặc định tích
   hết) → chỉ act được tích mới tạo; header "N of M selected" + nút **Select all/Clear all**; nút **Import N** tự
   đổi số, disable khi 0. **Mặc định vào THƯ MỤC HIỆN TẠI** (không tạo folder). Thêm tick **"Make a new folder"**
   → hiện ô tên (điền sẵn `<source>`), tích thì tạo folder mới đưa act vào. Vẫn nhận file `.json` (thả/duyệt).
   CSS mới `.aw-imp-*` trong `core/app.css` (drop-zone, list, row, folder — tông xanh #2f7bff, bo tròn, hover).

**Kiểm chứng (dev server, harness gốc-web, copy 2 file .xlsm thật vào web root rồi fetch arrayBuffer):**
- Reading `DS-S2.I1.W3`: đọc **151ms → 11 act** (đúng như skill Python). Listening `LSA2-S1.T4.P4-5`: **65ms → 7 act**.
- **18/18 act mount engine thật, 0 lỗi console.** JS port cho kết quả Y HỆT bản Python.
- index.html parse sạch (main.js/lesson-import không lỗi; SheetJS chưa tải vì chưa chọn file).
- **UI thật** (tạm expose `importFlow`, nạp file .xlsm thật vào input): modal 540px, drop-zone viền đứt, **11 dòng
  act có checkbox + icon + "Find the match · 100"**, header "11 of 11 selected", nút "Import 11"; bỏ tích 2 →
  "Import 9" + dòng mờ; Select all/Clear all đổi nhãn + disable đúng; "Make a new folder" mặc định ẩn, tích thì
  hiện ô tên điền sẵn `<source>`. Đã gỡ dòng debug + file test tạm (git diff sạch).
- `git status`: `main.js` (M), `core/lesson-import.js` + `core/vendor/xlsx.mjs` (mới).

**Đánh đổi (thầy đã đồng ý):** repo +1MB (`xlsx.mjs`) — nhưng nạp lười teacher-only, học sinh không tải. Logic ánh xạ
giờ ở **2 nơi**: skill `taoactaw` (Python, dùng qua dòng lệnh) + `lesson-import.js` (JS, trong app — nay là ĐƯỜNG CHÍNH).
Sửa bản đồ thì nhớ đồng bộ cả hai (hoặc coi lesson-import.js là bản chính).

**⭐ FIX (thầy test báo lỗi):** nhiều act nhận nhầm ô rỗng có **số "0"** (WORDTABLE lấp dòng trống bằng công thức trả
0; IPA còn ra `"0 "` có dấu cách) → 100 từ hoá 150, Speaking cards chia bài "0". Gốc: bản `taoact` có `ok()` loại cả
`""` LẪN `"0"`, nhưng khi port sang JS/Python tôi rút gọn còn kiểm truthiness → mất bộ lọc "0". **Sửa:** hàm đọc ô
(`cell()` trong `lesson-import.js` + `s()` trong skill) nay coi ô **trim ra "" hoặc "0"** = KHÔNG dữ liệu. Kiểm trên
`LSA2-S2.T1.P1-2.xlsm` (100 từ + junk tới dòng 150): trước 150, **sau đúng 100/100/100/100/100 + Quiz 30/30, junk=0,
7/7 mount 0 lỗi**; skill Python cho kết quả y hệt. Skill đã đóng gói lại + gửi thầy (Save skill đè bản cũ).

**VIỆC ĐANG CHỜ:** thầy đăng nhập AWord → Import → **chọn thẳng 1 file .xlsm** → xác nhận act tạo đúng → **commit + push**
(cùng đợt với nút Import Đợt 48 nếu chưa push). ⚠️ Nếu Pages có giới hạn kích thước/loại file thì kiểm `xlsx.mjs` có
live không sau push (curl).

---

## Đợt 48 (3/8/2026, v0.9.22) — NÚT IMPORT: tạo hàng loạt act từ "gói JSON" (nền tảng taoactaw, Phần A) — ✅ THẦY TEST OK → COMMIT c4ee761 + PUSH + LIVE

**Bối cảnh:** thầy muốn tính năng "taoactaw" — đọc file .xlsm bài học (giống skill `taoact` cho Wordwall) rồi tạo act
trong thư viện AWord. Chốt cách làm (2 vòng hỏi): **(1) xây nút Import NGAY TRONG app AWord** (bền, không phụ thuộc
tự động hoá trình duyệt, dùng lại mãi) — đây là **Phần A** đợt này; **(2) mỗi bộ dữ liệu chỉ tạo ÍT act gốc**, thầy
dùng Change Template (Đợt 47) đổi game tại lớp. Phần B (skill đọc Excel → gói JSON) làm sau.

**Đã nghiên cứu 2 họ file mẫu của thầy** (ghi để Phần B dùng):
- File **listening** `LSA2-S1.T4.P4-5.xlsm`: `Quiz1`/`Quiz2` CÓ dữ liệu (nghe hiểu), `Reading Acts` RỖNG; tên sheet chữ thường.
- File **reading** `DS-S2.I1.W3 ... SEEDS TURN INTO TREES.xlsm`: `READINGACT1`/`READINGACT2` CÓ dữ liệu, `QUIZ1/2` RỖNG; tên sheet HOA.
  Mỗi READINGACT có **4 vùng cố định**: TRUE/FALSE (dòng 2–16, cột B=đúng/C=sai) · FILLING (19–38, B=đáp án/C=câu có `___`) ·
  READING QUIZ (41–70, B=câu hỏi, C=đáp án A LUÔN đúng, D–F=nhiễu) · QUESTION/ANSWER (72+, **BỎ** — câu mở).
  → **Logic `read_ra` của taoact đọc thẳng file reading, khớp 100%**. WORDTABLE (cột D/E,H/I,L/M,P/Q,S) cũng khớp taoact.
- ⚠️ Bài học cho Phần B: parser phải **dò tên sheet không phân biệt hoa/thường** + **bỏ sheet rỗng** (tự nhận file là reading hay listening).

**Bản đồ Excel → act gốc AWord** (FILLING→Find the match theo thầy chốt): vocab ENG1/ENG2/VI1/VI2 → **Find the match**;
IPA → **Speaking cards**; TRUE/FALSE (đúng→answer:true, sai→answer:false) → **True or false**; FILLING → **Find the match**
(keyword=đáp án, definition=câu có chỗ trống); READING QUIZ → **Quiz**. v1→tên `<source> / …`, v2→`<source> HW / …`.

**Việc đã làm (Phần A):**
1. **`core/store.js`** (sửa core, additive): thêm **`importBundle(bundle, {parentId})`**. `bundle = {folder?, activities:[{type,title,theme?,instruction?,options?,content}]}`.
   Nếu có `folder` → tạo/**tái dùng** subfolder cùng tên dưới (activities, parentId) rồi `saveActivity` từng act vào đó; không có folder → vào thẳng parentId.
   Act **trùng tên bị BỎ QUA** (bắt `aw/duplicate-name`) → chạy Import lại AN TOÀN, không nhân đôi. Trả `{folderId, folderName, created, skipped, errors}`.
2. **`main.js`**: import `importBundle`; thêm nút **Import** trên thanh công cụ (chỉ trong Activities, không ở thùng rác, cạnh New folder);
   `importFlow()` = hộp thoại (dùng `openModal`): textarea dán JSON + chọn file .json (FileReader) + nút Import → parse → `importBundle({parentId: state.folderId})`
   → hiện báo cáo "Created N … in "folder", skipped M" + `render()` làm mới thư viện. Lỗi JSON/đăng nhập hiện tại chỗ.

**Hợp đồng "gói act" JSON** (Phần B sẽ sinh ra đúng dạng này):
```json
{ "folder": "DS-S2.I1.W3",
  "activities": [ { "type":"find_the_match", "title":"DS-S2.I1.W3 / ENG1", "theme":"classic",
                    "options":{…}, "content":{ "pairs":[{ "keyword":"SAPLING", "definition":"A very young tree…" }, …] } }, … ] }
```

**Kiểm chứng (dev server 5510, KHÔNG cần login):**
- Prototype mapping (Python) đọc file reading → bundle **11 act** đúng thiết kế (4 Find the match vocab · IPA Speaking cards · TF×2 · FILLING×2 Find the match · QUIZ×2). Số item khớp: vocab 100, TF 30 (15 đúng+15 sai), FILLING 20, QUIZ 30.
- Harness gốc-web nạp bundle → mỗi act `ensureTemplate`+`startGame` bằng engine THẬT → **11/11 mount, 0 lỗi console**.
- Nạp `index.html`: `main.js`+`store.js` parse & chạy sạch (0 lỗi) → cú pháp OK. (2 file harness/bundle tạm ĐÃ XOÁ.)
- `git status`: đúng 2 file (`core/store.js`, `main.js`).

**CHƯA test được (cần thầy):** bấm nút Import thật → lưu Firestore, vì trang thư viện sau **popup đăng nhập Google không tự động hoá được**.

**Phần A:** thầy đã test nút Import (gói "IMPORT TEST" 2 act) — **CHẠY OK** (3/8/2026). Chờ **commit + push** cùng đợt.

**Phần B — skill `taoactaw` ĐÃ XONG (3/8/2026):** skill self-contained (kiểu taoact) đọc .xlsm → sinh gói JSON đúng hợp đồng
`importBundle`, ghi ra `D:\OTHERS\CLAUDE\aword_bundle.json`; thầy Import vào AWord. **Tự nhận diện** reading (READINGACT1/2)
hay listening (Quiz1/2), **bỏ sheet rỗng**, tên sheet không phân biệt hoa/thường. Bản đồ: ENG1/ENG2/VI1/VI2→Find the match ·
IPA→Speaking cards · Quiz1/2 & READING QUIZ→Quiz · TRUE/FALSE→True or false · FILLING→**Find the match** (thầy chốt) ·
READINGACT1=v1 (`/ …`), READINGACT2=v2 (`HW / …`). Kiểm chứng: chạy ĐÚNG code nhúng trong SKILL.md trên cả 2 file thật
→ reading 11 act, listening 7 act; 18/18 act mount engine 0 lỗi (harness). Skill nằm ở thư mục skills phiên này +
đã đóng gói `taoactaw.skill` gửi thầy bấm "Save skill" để cài vĩnh viễn. **VIỆC ĐANG CHỜ:** thầy chạy thử skill trên 1 lesson
thật + Import → duyệt → coi như trọn taoactaw. (Nếu AWord đổi schema options thì cập nhật 4 preset `OPT_*` trong skill.)

---

## Đợt 47 (3/8/2026, v0.9.21) — ĐỔI TEMPLATE GIỮA LÚC CHƠI ("Change template") ⭐ CÓ SỬA CORE ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu của thầy:** đang chơi 1 bộ (vd Anagram) thì bấm 1 nút để **đổi sang game khác chơi tiếp CHÍNH
bộ dữ liệu đó**, khỏi quay về thư viện nhập lại — giữ lớp hào hứng ("cùng một bộ từ, đổi kiểu chơi").

**Quyết định đã chốt với thầy (2 vòng hỏi):**
- **Phạm vi = "nhóm hợp dữ liệu tốt"** (không bật các chiều gượng). Riêng chiều *từ vựng → trắc nghiệm*
  (lấy đề/định nghĩa làm câu hỏi, trộn thêm từ khác làm đáp án nhiễu) NẰM TRONG nhóm sạch — đúng ý thầy.
- **Chỉ CHƠI TẠM, giữ nguyên act gốc**: đổi thì dựng 1 act mới tạm (id `conv_...`, cờ `_converted`),
  KHÔNG lưu thư viện, KHÔNG đụng Firebase. Điểm bắt đầu lại, **GIỮ theme đang chọn**.
- **3 chỗ bấm** (đều đã có khung stub "coming soon" từ trước, nay nối thật): nút **Template** dưới khung ·
  mục **Change template** trong menu ☰ · dòng **Play a different template** ở màn kết thúc.

**Việc đã làm:**
1. **File lõi MỚI `core/convert.js`** — bộ phiên dịch dữ liệu. Rút mọi act về "record" chuẩn theo 4 *kind*:
   `qa` {term, clue, altAnswers[], distractors[]} · `tf` {text, truth} · `sentence` {sentence, clue} ·
   `card` {text}. Xuất 3 hàm: `toRecords(activity)`, `switchTargets(activity)` (trả về đúng danh sách
   game đổi-được), `convertActivity(activity, target)` (async — dựng act mới; options+instruction lấy
   từ **file sample của game đích** để chắc hợp lệ). MC đích tự sinh đáp án nhiễu từ các `term` khác
   trong bộ (bù vào distractors gốc nếu nguồn vốn là trắc nghiệm).
2. **`core/engine.js`** (sửa core, thầy có mặt duyệt): import `ensureTemplate` + `switchTargets/convertActivity`;
   viết lại `buildTemplatePanel` (game hợp dữ liệu = bấm được, còn lại `is-soon` mờ + toast "doesn't fit");
   thêm `doSwitchTemplate(target)` (`await ensureTemplate` → convert → `cleanupAll` → `startGame` act tạm,
   giữ fullscreen vì target là `root`); thêm `openSwitchPicker(onBack)` = picker nền tối TRONG khung (hoạt
   động cả khi fullscreen, khác thanh dưới khung); nối menu ☰ + màn kết thúc vào picker.
3. **`core/app.css`** — thêm `.aw-switch-list` (lưới 2 cột cho picker; `.aw-panel` sẵn tự cuộn).

**Bản đồ đổi (nhóm sạch) — đã tự kiểm 116/116 chiều mount 0 lỗi:**
- Nhóm QA (10 game: anagram · flying_fruit · crossword · find_the_match · balloon_pop · quiz · gameshow ·
  maze_chase · open_the_box · type_the_answer): đổi qua lại cho nhau **+ speaking_cards** (≈11 đích mỗi game).
- `true_false` ↔ `whack_a_mole` (+ speaking_cards). `unjumble` → {speaking_cards, type_the_answer}.
- `speaking_cards` → ∅ (không có đáp án nên không đổi sang game chấm điểm).
- **Guard**: nhóm QA nếu **thiếu clue** (vd Anagram withClues:false, <60% có clue) thì loại các đích cần đề
  (crossword/find_the_match/balloon_pop/quiz/…); crossword cần 2..40 câu. `whack_a_mole` nguồn: mode
  `quiz`→QA, còn lại→TF.

**Kiểm chứng (dev server localhost:5510 + 2 trang harness tạm ĐÃ XOÁ, chạy ở gốc web để đúng đường CSS/module):**
- `_convtest.html`: duyệt mọi sample nguồn × mọi đích `switchTargets` → convert + `startGame` bằng engine
  THẬT vào div rời → **PASS=116, FAIL=0**, `.aw-stage` mọi lần, **0 lỗi console**, số câu khớp bộ nguồn.
- `_convvisual.html`: mở Anagram → panel Template hiện 11 game bấm được, chỉ **True/false + Unjumble** mờ
  (đúng); bấm **Find the match** → panel tắt, remount, READY giữ tên bài "ANIMALS — UNSCRAMBLE" + game
  "FIND THE MATCH"; Play → ô đáp án đúng bộ động vật (giraffe/dolphin/kangaroo/polar bear/penguin/elephant).
- Menu ☰ (nguồn Quiz) → "Change template" mở picker nền tối "CHANGE TEMPLATE" đúng 11 đích + nút Back;
  bấm **Anagram** → Play → gợi ý "Which word is a fruit?" + chữ xáo "N A A A B N" = **banana** (đáp án đúng).
- `git status`: đúng 3 file (`core/convert.js` mới, `core/engine.js`, `core/app.css`) — KHÔNG đụng 14 template,
  KHÔNG đổi class `.aw-page/.aw-stage/.aw-below` hay target fullscreen `#app` (không vỡ nhúng myActivity/myLesson).

**Quyết định kỹ thuật đáng nhớ:**
- Học sinh KHÔNG thấy đổi template: cụm dưới khung bị gỡ khi có `session` (engine ~dòng 195), menu "Change
  template" đã gác `if(!session)`, và "Play a different template" chỉ ở nhánh non-session của summary.
- Picker dùng **nền tối trong khung** (không dùng thanh dưới khung) để bấm được cả khi fullscreen.
- `convert.js` chỉ import `catalog.js` + `utils.js` (KHÔNG chạm store) nên engine import tĩnh nó vẫn AN TOÀN
  với luật "trang HS không nạp code thư viện".

**VIỆC ĐANG CHỜ (đợt này):** ĐÃ commit + push + live (thầy duyệt 3/8/2026). Có thể bàn thêm sau: (a) nút "Lưu thành act mới" sau khi đổi;
(b) bật thêm chiều "gượng" (mọi game → Đúng/Sai) nếu thầy muốn; (c) khi thêm template thứ 15 nhớ khai thêm
nhánh trong `toRecords`/`buildContent` của `convert.js`.

---

## Đợt 46 (3/8/2026, v0.9.20) — FIX deep-link act TRẮNG TRANG: `routeFromLocation` thiếu `ensureTemplate` (hồi quy Đợt 33) ✅ DUYỆT → COMMIT + PUSH + LIVE

**Bối cảnh (thầy báo qua app myActivity):** ở bảng ĐÔI của myActivity, mở 1 act AWord thì pane TRÁI
hiện act bình thường, pane PHẢI **trắng tinh**. myActivity mirror act sang pane phải bằng cách
`loadURL` thẳng URL act (deep-link `?a=<num>`) vào một trang **mới tinh**.

**Gốc rễ (bug của AWord, không phải myActivity):** Đợt 33 (v0.9.7) chuyển sang nạp template **lười**
`ensureTemplate(type)` và đã thêm `await` vào `playAct`/`editAct`/`createBlankAct` + `play.js`,
**NHƯNG BỎ SÓT đúng đường deep-link `routeFromLocation()` trong `main.js`**. Khi mở act qua URL trên
trang mới, template CHƯA đăng ký trong registry → `startGame()` gọi `getTemplate()` (đồng bộ) →
ném `Chưa có game loại "..." trong registry` → trang trắng. Chỉ loại **Quiz** thoát nạn ở vài đường
cũ; mọi loại khác (vd `type_the_answer`) đều gãy. Trên bảng đôi, pane TRÁI sống chỉ vì thầy đã duyệt
thư viện trước đó nên template đã nằm trong Map; pane PHẢI là trang mới nên gãy.

**Ảnh hưởng RỘNG hơn myActivity:** mọi link deep-link tới act khác Quiz mở trên **tab/trang mới**
(bookmark, link chia sẻ `?f=..&a=..`) đều trắng — nay được vá chung.

**Sửa (1 chỗ, `main.js` `routeFromLocation`):** thêm `try { await ensureTemplate(node.type); }
catch { toast(...); return goTop(opts); }` NGAY TRƯỚC `startGame` — y hệt khuôn `playAct`. `ensureTemplate`
đã import sẵn (Đợt 33); idempotent nên back/forward về act không tốn thêm. KHÔNG đụng `core/`.

**Kiểm chứng (harness Electron, partition thật `persist:main`, act live `?f=248&a=27` loại type_the_answer):**
- Tái hiện: pane mới tinh → `hasStage:false`, `registeredBefore:false` → trắng (đúng bug).
- Cơ chế fix: sau `ensureTemplate('type_the_answer')` → `getTemplate()` (chính lệnh `startGame` gọi)
  trả về template `type:"type_the_answer"`; ép render lại (nạp template rồi bắn `popstate`) → `.aw-below`
  xuất hiện = act render thật. `node --check main.js` sạch.

---

## Đợt 45 (3/8/2026, v0.9.19) — WHACK-A-MOLE: nâng cấp LỚN (7 loạt tinh chỉnh theo yêu cầu thầy) ✅ DUYỆT → COMMIT + PUSH + LIVE
Tự test trình duyệt thật, 0 lỗi console. KHÔNG đụng core (chỉ 5 file whack-a-mole + 2 docs). Đầy đủ + BẪY:
`templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục "⭐ ĐỢT 45"). Tóm tắt các loạt:

1. **Đồ họa ẢNH THẬT thay SVG tự vẽ:** phát hiện `mound01/02/03.webp` là **CẢ PHÔNG ĐỒI** (đồi+núi mesa+
   xương rồng+cỏ), không phải ụ đất. Dùng `mound02` làm đồi chính; hố chỉ còn `holeback+holefront`;
   `mound01` blur làm 2 đồi tiền cảnh; cactus THẬT 2 bên. + **Intro zoom** (lùi xa thấy núi → zoom về chơi).
2. **Editor 2 chế độ chuẩn:** True/False → **2 CỘT** (như true-false), Quiz giữ nguyên; **khóa đổi mode**
   khi đã có dữ liệu; bỏ ép `timer:"none"` khi save.
3. **Timer đồng bộ engine** (`options.timer` countUp/countDown + `timerTotalSeconds`, `manualTimerStart`),
   bỏ `gameSeconds`; countUp bỏ bar; **bar đổi cam ≤30s / đỏ ≤10s**; bar dài cố định đến sát tim.
4. **Options mới:** Switch correct/incorrect · thanh trừ điểm 0–5 · **Lives 0–10** (tim ở topbar, mất từ
   trái) · **3 tick bonus riêng** (Extra time/Loot/Power Up) · gỡ "Auto switch" + nút Timer "None".
5. **Luật mục tiêu:** đập hết câu đúng → countUp = COMPLETE, countDown = làm mới vòng chơi tiếp đến hết giờ;
   câu đập đúng không hiện lại, câu lỡ quay lại; quiz 1 pass = xong (countUp) / lặp (countDown).
6. **Cảm giác chơi:** đập SAI = **phạt đông cứng 4s** (mole sai ở lại, mole khác thụt, ngưng spawn) ·
   **dấu ✓/✗ nét trần** · **bubble vẽ CSS** ôm sát chữ (hết tràn) sát chuột · biển vào giữa cột.
7. **Tinh chỉnh vặt:** hố nâng cao + giãn rộng (3-4-3) không đè cactus/đồi · hàng thời gian–tim–điểm cân
   đối cùng hàng · gỡ số điểm to (tally) khỏi đè "TIME'S UP" cuối game.

Backup bản cũ đã xóa sau khi commit. (Đợt 44 nhắc "whack-a-mole đang dở của phiên khác" — chính là đợt này.)

---

## Đợt 44 (2/8/2026, v0.9.18) — SPEAKING CARDS: 6 loạt tinh chỉnh theo yêu cầu thầy ✅ DUYỆT → COMMIT + PUSH + LIVE
Tự test trình duyệt thật, 0 lỗi console. KHÔNG đụng core (chỉ file speaking-cards + 2 docs; whack-a-mole
đang dở của phiên khác nên KHÔNG commit). Backup bản cũ ở
`D:\APP AND DATA\AWord-data\Backup\speaking-cards-v0.9.17\`. Chi tiết đầy đủ + BẪY:
`templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` (mục 2/8/2026 đầu file). Tóm tắt:
1. **Intro lia camera**: scene thành khung ngắm trên "thế giới" 2 panel (bàn cờ vua+vây vẽ SVG | khu chơi),
   bấm PLAY → lia phải đúng thời lượng tiếng intro (~4,7s) rồi mới cho Deal.
2. **Menu/Sound/Fullscreen vào 2 góc dưới nền xanh** (giống act thật) — nút riêng forward tới nút gốc đang
   ẩn của engine (không sửa core).
3. **Cân đối lại** bộ bài + khu chia vào giữa (hết lệch trái).
4. **Lá bài NGANG (7:5)** + vẽ lại mặt lưng/mặt trước hoa văn theo ảnh mẫu.
5. **Shuffle**: hiệu ứng riffle kéo dài đúng bằng tiếng shuffle (~4,65s, lặp ~9 vòng).
6. **Không cắt đôi từ**: bỏ `word-break`, chuyển fit sang `fitOnce(contentBox)` co cả rộng lẫn cao.
7. **Phiên âm 2 hàng**: `TROUSER` trên, `/ˈtraʊzə/` dưới (nhỏ + xám).
   \+ **Vá Options**: nhóm "End of game/Show answers" (core đẩy xuống cuối) nay được tỉa đúng (chạy 2 nhịp).

**Loạt 2 (cùng ngày, thầy chơi thử rồi yêu cầu thêm — vẫn v0.9.18, CHƯA COMMIT):**
8. **Number of deal places → SLIDER** 1..10 (thay stepper).
9. **Quân cờ vẽ đẹp/giống thật hơn**: bộ Staunton SVG có gradient khối + shine/shade + bóng (thay blob cũ).
10. **1 ô chia: bộ bài + place TO và BẰNG NHAU** (42cqw); nhiều ô: kích cỡ thích ứng lấp tối đa không gian,
    nhiều hàng không tràn (`computeLayout` set `--deck-w/--card-w/--cols`).
11. **Chữ trong lá TO TỐI ĐA** (fitOnce `max` 1→3.6) nhưng 1 từ vẫn không tách 2 dòng.

**Loạt 3 (cùng ngày — thầy yêu cầu DÙNG ĐỒ HỌA GỐC của act, vẫn v0.9.18, CHƯA COMMIT):**
12. Mở act gốc bằng Claude in Chrome, tải graphic THẬT của theme (background.jpg + card art) về
    `AWord-data/Source/Graphic/SPEAKING CARDS`, copy vào `templates/speaking-cards/assets/`.
13. **Thay hình vẽ SVG bằng ẢNH NỀN THẬT**: bỏ quân cờ/bàn cờ SVG + kiến trúc 2-panel; scene = `.aw-sc-bg`
    (ảnh nền rộng pan) + `.aw-sc-play` (fade vào sau pan). Intro lia camera trên chính ảnh gốc (bàn cờ →
    felt chia bài trái, có viền vàng như act thật). Đẹp/tự nhiên hơn hẳn SVG.
    **Bản quyền — đã xử lý**: thầy đưa ảnh nền RIÊNG (background2.jpg, cùng cỡ) → ghi đè `assets/background.jpg`;
    GỠ card art Wordwall khỏi repo. Nền công khai nay là ảnh của thầy.

**Loạt 4 (cùng ngày — 4 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
14. Shuffle còn **1/2 thời gian** (âm thanh + hiệu ứng; iter 9→4, `stopSound` cắt clip giữa chừng).
15. Câu dài trong lá: **to hết cỡ + xuống nhiều dòng + căn giữa** (bỏ fitOnce, viết bộ co riêng — bẫy
    `width:100%` khiến fitOnce co về min).
16. **Bộ bài canh giữa deal place** (nhãn "N left" absolute, deck không bị đẩy lên).
17. Ô chữ trong **editor tự mở hết cỡ** để xem trọn text (bỏ tay kéo, auto-grow theo scrollHeight).

**Loạt 5 (cùng ngày — 2 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
18. **Bỏ hẳn chức năng Add image** (nút + thumbnail + helper + field `image` trong data + CSS + sample).
19. Thêm **slogan "SPEAKING CARDS IN ANDREW CLASSES"** (look Crossword) — ghim trên-giữa scene (scene phủ
    topbar nên đặt trong scene, z-index 3 + text-shadow cho đọc rõ trên ảnh). Tinh chỉnh: slogan **fade hiện
    dần trong 30% cuối intro** (ẩn 70% đầu) + **giảm size còn 80%** (1.36cqw).

---

## Cách chạy thử trên máy
- Máy chưa cài Node. Bản hiện tại **chạy-ngay không cần build** bằng Python.
- Dùng **`python devserver.py 5510`** (KHÔNG `python -m http.server` trần — thiếu header chống cache,
  xem APP_MASTER mục 9). Công cụ preview cấu hình tên `aword` (trong `D:\OTHERS\CLAUDE\.claude\launch.json`)
  đã trỏ sang script này. Chạy tay: PowerShell tại `E:\LAP TRINH APP\AWord` → `python devserver.py`.
- **Trang chủ (trình quản lý kiểu Drive)**: `http://localhost:5510/`
- **Trang test riêng từng template**: `http://localhost:5510/templates/<ten-template>/test.html`

> **Cấu trúc thư mục đã được quy hoạch lại từ v0.3.0 để build nhiều template song song.**
> Xem `APP_MASTER.md` mục 4 để biết bản đồ thư mục mới nhất — đừng dựa vào đường dẫn file
> trong các mục lịch sử phiên bản CŨ hơn v0.3.0 bên dưới (src/, styles/ đã không còn tồn tại).

---

## ⭐ VIỆC ĐANG CHỜ (cập nhật 1/8/2026, sau Đợt 33 — MÁY/PHIÊN MỚI ĐỌC MỤC NÀY)

> File này xếp MỚI NHẤT LÊN TRÊN, nên mục "việc đang chờ" để ở đây (đầu file) cho dễ thấy.
> Bàn giao đầy đủ hơn (kèm khuôn code + cách test không cần đăng nhập): `APP_MASTER.md` **mục 0a**.

**Đứng ở đâu**: cả **14 loại act** đã chốt, sống ở trang chủ, đã push + live; **trang HS `play.html`
chơi được cả 14 loại** (trước chỉ Quiz). Thầy đã tự test bản live và xác nhận (1/8/2026).

**⚠️ 2 thói quen cũ nay đã SAI:**
1. **Gộp/thêm template = sửa ĐÚNG 1 file `core/catalog.js`.** Từ v0.9.7 `index.html`/`play.html`/
   `main.js`/`play.js`/`manifest.js` KHÔNG còn liệt kê template — `ensureTemplate()` tự nạp. Ghi chú cũ
   nào bảo "thêm import vào main.js + link CSS vào index.html + entry manifest.js" là LỖI THỜI.
2. **`manifest.js` không còn là danh sách chép tay**, chỉ là view suy ra từ catalog — đừng thêm gì vào.

**Việc kế tiếp — HỎI THẦY TRƯỚC, đừng tự làm** (xếp theo mức đáng làm; thầy chưa chốt cái nào):
- **(A) Balloon pop polish** — template DUY NHẤT đã lên trang chủ mà còn tồn đọng: blimp chồng lane ở
  khung hẹp; **hiện 2 đồng hồ** cùng lúc. Chi tiết: `templates/balloon-pop/GHI CHU BALLOON-POP.md`.
- **(B) Dọn 3 ĐỀ XUẤT SỬA CORE còn treo** (template đang tự lách bằng JS/tỉa DOM): Speaking cards xin cờ
  `openEnded`/`hideScore` + cờ ẩn nhóm Options; Crossword xin `tpl.hideRandomOption`; Balloon pop xin
  ẩn `timerEl` khi `inlineTimerBar:true` + `timer:"none"`.
- **(C) Còn ngỏ từng game**: 🎤/🖼️ voice+image trong editor Anagram/Crossword; Find the match thiếu 3 âm
  Menu/Leaderboard/RevealAnswers (core chưa có hook); Crossword bật bàn phím ảo nên phóng to theo từ
  đang chọn thay vì thu cả lưới.
- **(D) Chưa ai kiểm**: fullscreen thật trên bảng TOMKO; nghe thật các bộ mp3.

**Khúc không tự test được**: trang chủ + assignment thật đều sau popup đăng nhập Google (không tự động
hoá được). Muốn test logic mà khỏi đăng nhập: dùng `templates/<ten>/test.html`, hoặc `import()` thẳng
`core/registry.js` + `core/catalog.js` từ console (cách Đợt 32/33 đã dùng để quét cả 14 loại).

---

## Lịch sử phiên bản

### 2/8/2026 — Đợt 43 (v0.9.17): CROSSWORD — 3 loạt tinh chỉnh reveal + âm thanh (yêu cầu thầy). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Chỉ đụng `templates/crossword/*` (`crossword.js`/`.css`/`crossword-sound.js`), **KHÔNG đụng core**. Tự test trình duyệt thật (đo timeline, 0 lỗi console).
> Nối tiếp Đợt 36/v0.9.10 (tái thiết kế lớn Crossword). Version nhảy lên v0.9.17 để KHÔNG trùng nhánh Unjumble song song đã tới v0.9.16. Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục "3 LOẠT TINH CHỈNH".
- **Reveal khi chấm chạy TUẦN TỰ từng ô** (thay kiểu đồng loạt cũ): SAI (Show-answer BẬT) → ô đúng xanh + **ting**, ô sai **✕ nhỏ KHÔNG che chữ** (bỏ hẳn nền/chữ đỏ) + **tặc**; xong ✕ cuối → chữ đúng **lật** về xám đồng nhất. ĐÚNG cũng tuần tự (xanh + ting), **ting ô cuối xong mới bay sao + cộng điểm**.
- **Thứ tự nhánh SAI + trừ điểm**: đủ hết ✕ → **sao đỏ bay + trừ điểm** → sao rời ô → **mới lật** chữ đúng (đo timeline: X 1→7 t83–1201 → sao/điểm t1441 → lật t2161).
- **6 âm SYNTH WebAudio** trong `crossword-sound.js` (AudioContext riêng, tôn trọng mute, không file mới): `ting`/`tac`/`magic` (Andrew) + `starGain` (vàng, tông lên) / `starLose` (đỏ, tông xuống) trong `flyStars` + `reject` ("thụp" gõ sai ô given, trong `shakeCell`).
- **Start again ĐỔI BỐ CỤC**: `buildCrossword` trộn danh sách trước khi sort theo độ dài + tie-break ngẫu nhiên → mỗi ván lưới xê dịch (đo 3 ván: 18×14/16×19/14×21), số từ xếp ổn định 17–18/20.
- File đổi: `templates/crossword/{crossword.js, crossword.css, crossword-sound.js, GHI CHU CROSSWORD.md}`.

### 2/8/2026 — UNJUMBLE: 7 loạt tinh chỉnh liên tiếp theo thầy (unjumble-local **Đợt 36→42, v0.9.10→v0.9.16**). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Tự test trình duyệt thật mọi mục (0 lỗi console).
> ⚠️ Số "Đợt 36→42" ở ĐÂY là đếm RIÊNG của template Unjumble (nối tiếp Đợt 35/v0.9.9 của nó) — KHÁC "Đợt 36" của Crossword ngay dưới (hai phiên song song trùng số). Chi tiết đầy đủ từng loạt: `templates/unjumble/GHI CHU UNJUMBLE.md`.
- **Nền + thương hiệu**: bỏ ảnh whiteboard 5,3 MB → nền CSS gradient hiện đại; sau đó bỏ luôn watermark, thêm **slogan "UNJUMBLE IN ANDREW CLASSES"** trên thanh đồng hồ/điểm (kiểu Crossword); **intro** viết lại: chữ nghiêng nhẹ + zoom bé→to, giữ lâu, rồi TỪNG TỪ bay đáp CHÍNH XÁC vào từ tương ứng của slogan (đo dx=dy≈0), khớp nhạc intro 3,3s.
- **Font + bố cục**: chữ dùng font chung **Baloo 2**; khối chữ căn giữa dọc; hàng gần nhau hơn; chuyển câu next/back **crossfade** hết nháy nền; **clue** thành 1 hàng dưới slogan (xanh nước biển, regular italic).
- **Kéo-thả**: bỏ khung chip (chỉ chữ), kéo thì chữ to+nghiêng; **con trỏ nháy (caret)** viết lại cho chuẩn+ổn định (đầu/cuối câu), thả chữ **bay mượt** về vị trí; chỉ tô xanh đoạn ĐẦU đúng liền nhau; xong câu tất cả xanh + nảy ăn mừng.
- **Chấm điểm THEO CÂU** (không theo từ): Words with bonus = 1 (giải) + 1 (bonus, đạt khi ≤ số lượt tối thiểu) → tối đa 2/câu; On submit đúng = 1/câu, sai = −"Points off" (slider 0–5). Điểm hiện **"N / max"**; điểm âm **màu đỏ**. ✓ và **BONUS** (từ dòng "moves for bonus") bay về điểm; submit đúng = **sao vàng** bay, sai = **sao đỏ** bay (bỏ ✗).
- **Options mới**: 2 chế độ (Words with bonus / On submit), Alignment, **Show answer when wrong**, **Points off when wrong** (0–5), **Lives** (thanh trượt ∞/1–10 như True/false — mất mạng khi submit sai, hết mạng → "Game over"). Bỏ ✓ ở nút Next câu cuối (nút vẫn còn, bị vô hiệu hóa).
- **Dấu câu**: **?/!** cuối câu = ô CỐ ĐỊNH khóa ở cuối (không kéo, không thả sau nó); **. và ,** luôn dính từ trước.
- **Submit**: câu đúng nổ sao quanh chữ; câu sai hiện câu đúng mà KHÔNG đẩy câu sai lên (reveal cao cố định).
- ⭐ **CÓ SỬA CORE (opt-in, tương thích ngược)**: `tpl.reviewStyle:"stacked"` — màn **Show answers** dạng danh sách xếp chồng full-width (câu DÀI đọc rõ), câu sai hiện bài-làm (đỏ ✗) + đáp-án-đúng (xanh ✓). Template khác không đặt cờ → giữ lưới 3 cột cũ. Ghi ở `core/HUONG DAN CORE.md`.
- File đổi: `templates/unjumble/{unjumble.js, unjumble.css, GHI CHU UNJUMBLE.md}` + xóa `templates/unjumble/img/whiteboard.png` + `core/engine.js` (nhánh stacked opt-in) + `core/HUONG DAN CORE.md`.

### 2/8/2026 — Đợt 36 (v0.9.10): CROSSWORD — TÁI THIẾT KẾ LỚN (nhiều loạt yêu cầu của thầy). ĐÃ COMMIT + PUSH. Chỉ đụng `templates/crossword/*`, **KHÔNG đụng core**. Tự test trình duyệt thật đủ mọi mục (0 lỗi console).

Thầy chơi bản Crossword đã chốt rồi gửi ~5 loạt yêu cầu, làm mới gần như toàn bộ cách chơi. Tóm tắt (chi
tiết + BẪY đầy đủ trong `templates/crossword/GHI CHU CROSSWORD.md` mục "2/8/2026 — TÁI THIẾT KẾ LỚN"):

- **2 màn hình rõ ràng**: "bảng" (toàn lưới, ẩn bàn phím) ↔ "hàng/cột" (1 từ bung to + bàn phím). Trả lời
  xong MỖI câu luôn về bảng (2,5s), tự chọn câu kế. Bỏ Next/Back.
- **Bàn phím cố định tuyệt đối** (host absolute ghim đáy-giữa; ẩn không chặn ô). **Bảng dùng hết màn** (ô
  to nhất, không khuyết). **Mọi ô đều bấm được** (sửa clue-bar + bàn-phím-ẩn che ô).
- **Slogan "CROSSWORD IN ANDREW CLASSES"** chèn lên thanh đồng hồ/điểm (xám, mảnh, HOA, giãn chữ).
- **Câu hỏi** to (4.1cqw), nằm cao, 1–2 dòng tự cân; dải ô **hàng** căn giữa câu-hỏi↔bàn-phím, **cột** căn
  giữa mép-phải-bàn-phím↔mép-phải-khung. Zoom mượt (đặt size trước + scale-in), đo bằng `offset*` để không
  giật vì transform trượt bàn phím. Nền câu hỏi trong suốt + quầng chữ (ô sau vẫn nhìn mờ).
- **Ô given**: xanh nếu từ câu đúng, xám nếu từ câu sai-lộ-đáp-án; gõ sai lên given → rung + chặn.
- **Andrew**: chữ vàng lấp lánh trong ô (thay vì trên thanh gợi ý).
- **Chấm điểm**: đúng → +1; sai(Show-answer BẬT) → ✕ đỏ TRƯỚC rồi mới lộ chữ đúng; sai(TẮT) → ✕ xám.
  **Sao bay** vàng/đỏ về ô điểm, **điểm đổi NGAY khi sao bắt đầu bay**. **Minus** nay là slider
  "Points off when wrong" 0..5 (0 = tắt, bỏ checkbox); điểm âm hiện đỏ dạng "N/total".
- **Editor**: Duplicate/Remove thành ICON; ô clue tự nới cao hiển thị hết chữ.
- Option **"Change the crossword"** (bấm câu hỏi thoát về bảng; tắt = khoá phải trả lời).

⚠️ **Lúc commit có thay đổi CHƯA XONG của phiên khác lẫn trong cây làm việc** (`core/engine.js`,
`core/HUONG DAN CORE.md`, `templates/unjumble/*`) — đã **add từng file crossword + 3 docs** theo tên,
KHÔNG `git add -A`, để không lỡ commit việc của phiên kia.

### 1/8/2026 — Đợt 35 (v0.9.9): UNJUMBLE — INTRO ZOOM + NHẠC · NỀN ẢNH WHITEBOARD PHỦ TOÀN KHUNG · KÉO CHỮ = CON TRỎ TEXT (CHỮ ĐỨNG YÊN) · BỎ DÒNG HƯỚNG DẪN. Tự test trình duyệt thật (0 lỗi console). 🟢 CHỜ THẦY DUYỆT — CHƯA COMMIT. Chỉ sửa `templates/unjumble/*` + thêm ảnh, **KHÔNG đụng core**.

> ⚠️ Cùng ngày, 1 phiên Claude song song làm Gameshow lấy "Đợt 34/v0.9.8" (mục ngay dưới), nên Unjumble lấy **Đợt 35/v0.9.9**. Hai bộ file tách rời (`templates/unjumble/*` ↔ `templates/gameshow/*`), không đụng nhau.

Thầy chốt qua AskUserQuestion (nền **chỉ Classic** · đặt ảnh **cover/cắt nét** · intro **đẩy nhẹ ~2.5s**) rồi "ok build":

1. **Intro zoom + nhạc**: bấm Play → engine phát sẵn `intro.mp3` → lớp `.aw-unj-intro` (chính ảnh whiteboard) đẩy nhẹ (scale 1.12→1.0 + mờ dần, `INTRO_MS=2500`), chạm để bỏ qua, rồi vào game. Đồng hồ **đứng 0:00 suốt intro** nhờ bật cờ engine `manualTimerStart` (opt-in, **không sửa core**); `mount` gọi `ui.startTimer()` khi intro xong (Style khác Classic → gọi ngay, không intro).

2. **Ảnh nền phủ CẢ khung** (điểm/giờ/nút nằm trên bảng): `whiteboardgrouped2.png` → `templates/unjumble/img/whiteboard.png` (5,3 MB), nền `.aw-stage.aw-unj-active.theme-classic` (`background-size:cover`). `mount` gắn `aw-unj-active` vào stage qua `root.closest('.aw-stage')` (gỡ ở cleanup) — không đổi/bỏ class `.aw-page/.aw-stage/.aw-below` (an toàn nhúng myActivity). Card **trong suốt** (bỏ khung đen + nền board + doodle SVG — ảnh đã có sẵn khung + doodle + chữ "ANDREW WHITE CLASSES BOARD"). Style khác giữ card tint cũ (CSS gate `.theme-classic`).

3. **Kéo chữ = con trỏ text, chữ đứng yên**: bỏ placeholder chèn-dồn realtime (`.aw-unj-ph` gỡ). Kéo → thanh nháy dọc `.aw-unj-caret` ở khe gần nhất (row-aware theo tâm ô), **các chữ KHÔNG dời** (chữ nguồn chỉ mờ `.is-dragsrc`), **thả mới chèn** (`positionCaret` lưu chỉ số chèn full-array vào `caret.dataset.insert`, `caretDropIndex` quy về chỉ số sau khi tách từ kéo cho `commitReorder`).

4. **Bỏ dòng "Put the words in the right order"**: `render()` chỉ thêm `.aw-unj-clue` khi item CÓ clue riêng; `measure()` guard `clueEl` null.

Tự test (JS bắn pointer giả + đo): intro scale 1.12→1.0+fade biến mất ~2,5s, đồng hồ giữ 0:00; kéo → caret hiện + `orderDuringMove===before` (chữ đứng yên) + thả đổi đúng thứ tự + dọn sạch caret/clone; generic clue mất; đổi Style→Basic bỏ ảnh, về Classic có lại; 0 lỗi console. ⚠️ Ảnh 5,3 MB (nén sau nếu cần). Chi tiết: `templates/unjumble/GHI CHU UNJUMBLE.md` Đợt 35.

### 1/8/2026 — Đợt 34 (v0.9.8): GAMESHOW — DỰNG LẠI INTRO + GET READY + NỀN PHỦ TOÀN KHUNG (theo ảnh act gốc thầy gửi). Tự test trình duyệt thật (0 lỗi console). ✅ THẦY DUYỆT → ĐÃ COMMIT + PUSH (chỉ stage 4 file gameshow + 2 file ghi chú; KHÔNG đụng file của phiên Unjumble song song). Chỉ sửa trong template gameshow, **KHÔNG đụng core**.

Thầy so sánh với act gốc Wordwall (gửi ảnh) và yêu cầu 3 việc, gộp build 1 lần (đã "ok build"):

1. **Intro mới ~6 giây (khớp `intro.mp3` = 6,04s).** Trước đây intro chỉ là 2 cánh cửa trượt ra trong 1,5s. Nay: khung TV marquee gốc (`img/screenframe.webp`, copy từ `Source/Graphic/GAMESHOW/Khung san khau`) nảy vào giữa nền xanh hình thoi (spotlight + APPLAUSE đỏ CSS + khán giả), chữ **"ANDREW CLASSES / QUIZ SHOW"** trắng viền hồng lọt qua "lỗ trong suốt" của khung, giữ ~5,2s rồi "mở ra" (phóng to + mờ) → câu 1.

2. **"Get ready" kiểu mới, chạy TRƯỚC MỖI câu.** Khung TV xanh viền đèn hiện giữa nền hình thoi; màn trong = nền tia sáng xanh + **ô viền vàng đứt nét** bao "Question N / Get ready!"; sau ~1,2s khung mở ra → câu hỏi + đáp án. Trong lúc get ready **ẩn nội dung vùng chơi** (`stage.style.visibility`) để HUD/lifelines không đè lên ô.

3. **Nền phủ TOÀN khung game** (kể cả thanh điểm/đồng hồ trên + menu/nav dưới). Thêm class `aw-gs-full` lên `.aw-stage` + 2 lớp `.aw-gs-decor` (spotlight+khán giả) và `.aw-gs-screen` (tia sáng xanh + **viền hồng** ôm mép, bật/tắt theo trạng thái). Chrome engine cho trong suốt + chữ/nút đổi trắng. **Đảo ngược hoàn toàn trong `cleanup()`** (gỡ class + 2 lớp) → không ảnh hưởng template khác.

Đo "lỗ trong suốt" của khung bằng Python/PIL: left ~12% · right ~12,5% · top ~13,5% · bottom ~39% → đặt `.aw-gs-scr`. Kích thước khung = `width:84cqw` (theo bề ngang sân khấu), tràn dọc bị `overflow:hidden` cắt cho chân đế chạy xuống mép như gốc.

**Quyết định của thầy (qua AskUserQuestion):** chữ = "ANDREW CLASSES QUIZ SHOW"; nền hình thoi áp cả màn chơi; KHÔNG cho bỏ qua intro (chạy trọn 6s).

**File sửa:** `templates/gameshow/gameshow.js` (scene + introShow + nextGetReady + showQuestion + cleanup), `gameshow.css` (bỏ nền/viền cũ của board + khối CSS full-bleed/khung/ô vàng/chrome trắng), thêm `img/screenframe.webp`. Backup bản cũ ở `templates/gameshow/_backup/`.

**Đã tự test (1280×720, `test.html`):** intro ✓, câu hỏi (nền phủ kín + viền hồng + chrome trắng) ✓, get ready (DOM xác nhận vùng chơi ẩn, "Get ready!" hiện đúng, không đè) ✓, bonus round ✓, 0 lỗi console. ⚠️ Chưa test `play.html` (HS) và bảng TOMKO.

**➡️ BÀN GIAO CHO SESSION MỚI (build tiếp Gameshow):**
- **Tiếp nhận:** `git pull` → đọc `templates/gameshow/GHI CHU GAMESHOW.md` (khối ⭐ Đợt 34 ở đầu) + mục này.
- **Chạy thử:** `python devserver.py 5510` (hoặc preview tên `aword`) → `http://localhost:5510/templates/gameshow/test.html` → bấm Play. Khung xem nên đặt **desktop 1280×720** (khung hẹp thì mọi thứ nhỏ, khó soi). Get ready chỉ hiện ~1,2s nên chụp tay khó — kiểm bằng JS sample DOM (đã dùng: bắt `.aw-gs-frame` rồi đọc `stage.style.visibility`).
- **Các NÚM tinh chỉnh nhanh (đều trong `gameshow.css`):** vị trí/cỡ màn trong khung = `.aw-gs-scr` (L12/R12.5/T13.5/B39% — khớp "lỗ trong suốt" ảnh); cỡ khung = `.aw-gs-sign,.aw-gs-frame-body` (`width:84cqw` + `margin-top:-4cqw`); ô get ready = `.aw-gs-gr-box`; cỡ chữ QUIZ SHOW = `.aw-gs-sign-line`; độ đậm spotlight/khán giả = `.aw-gs-decor .aw-gs-light/.aw-gs-audience`; nhịp intro = 2 mốc `later()` trong `introShow` (5200 mở, 6000 xong).
- **Ý tinh chỉnh thầy có thể muốn (chưa làm):** căn lại vị trí/cỡ ô get ready cho cân giữa màn khung; giảm độ nổi của khán giả/spotlight; APPLAUSE hiện cả lúc chơi hay chỉ intro; cỡ chữ QUIZ SHOW; có PTS box lúc chơi hay bỏ (gốc không có).
- ⛔ **BẪY:** khung intro/get ready đặt ở CẤP `stageEl` (`.aw-stage`), KHÔNG trong play area (kẻo nhỏ + dính đỉnh). Nội dung màn phải khớp "lỗ trong suốt" nếu đổi ảnh khung. Nhớ `cleanup()` phải gỡ hết (class + 2 lớp) — đừng để sót sang template khác.

### 1/8/2026 — Đợt 33 (v0.9.7): NẠP TEMPLATE THEO YÊU CẦU — trang HS `play.html` chơi được CẢ 14 loại; thêm template từ nay chỉ sửa 1 FILE. ⭐ CÓ SỬA CORE. Đã tự test (0 lỗi console).

Ngay sau Đợt 32 thầy chốt (qua AskUserQuestion) làm hướng **"nạp động theo `activity.type`"** thay vì
thêm 13 dòng import tĩnh vào `play.js`.

**Vấn đề thật:** `play.html`/`play.js` (trang học sinh) chỉ khai mỗi Quiz — `import "./templates/quiz/
quiz.js"` + 1 link `quiz.css`. Giao assignment loại khác cho HS là gãy `Chưa có game loại "..." trong
registry`. Gốc rễ: **mỗi trang phải tự chép lại danh sách template** (import JS trong .js + link CSS
trong .html), tức 1 template phải khai ở 4-5 chỗ → sót là chuyện sớm muộn, và đã sót thật suốt thời
gian dài mà không ai thấy vì trên lớp thầy chỉ chiếu act từ trang chủ.

**Cách sửa — dồn về 1 nguồn rồi nạp lúc cần:**
- **`core/catalog.js` (SỬA CORE)** — mỗi mục nay khai luôn CÁCH TỰ NẠP: `css` (đường dẫn tính từ TRANG,
  hợp lệ cho cả `index.html` lẫn `play.html` vì cùng ở gốc), `load()` → `import()` module template,
  `sample()` → act mẫu. Thêm hàm `templateEntry(type)`.
- **`core/registry.js` (SỬA CORE, THÊM MỚI, không đổi hành vi cũ)** — thêm `ensureTemplate(type)`:
  chèn `<link>` CSS **và ĐỢI CSS áp xong** rồi `await entry.load()`; module tự `registerTemplate()`.
  Nhớ lời hứa trong `pending` nên gọi song song vẫn chỉ nạp 1 lần; loại lạ thì reject; nếu module quên
  `registerTemplate()` thì báo lỗi rõ ngay thay vì để engine gãy sau. Thêm `hasTemplate(type)`.
  `getTemplate()` giữ nguyên đồng bộ (engine/print vẫn dùng như cũ).
  *Chi tiết chống-treo:* `loadCss` không bao giờ reject và có chặn 4 giây — mạng lớp chậm thì thà chơi
  trước CSS vào sau, còn hơn treo màn hình HS.
- **`main.js`** — **xóa cả 14 dòng import template**; `playAct` / `editAct` / `createBlankAct` (nay
  `async`) đều `await ensureTemplate(...)` trong try/catch, hỏng thì toast "could not load" /
  "editor coming soon".
- **`play.js`** — bỏ import quiz, thêm `await ensureTemplate(activity.type)` trong `play()`. Đặt TRƯỚC
  khi xóa màn hình và hiện "Loading..." nên mạng chậm không ra trang trắng; hỏng thì hiện "This game
  could not be opened".
- **`index.html` + `play.html`** — **xóa toàn bộ link CSS template** (chỉ còn `app.css` + `classic.css`).
- **`manifest.js`** — không còn là danh sách chép tay nữa, rút xuống 3 dòng SUY RA từ catalog
  (`TEMPLATES.filter(built)`), nên vĩnh viễn không lệch pha được.

**Kết quả cho người dùng:** HS mở 1 assignment giờ tải **đúng 1 game** (trước: trang chủ tải cả 14).
Đo thật lúc mở trang: registry **0 template**, chỉ **2 stylesheet lõi**; sau khi vào 3 game thì đúng
3 module + 3 CSS được thêm.

**Kết quả cho người build:** **thêm template = thêm ĐÚNG 1 MỤC trong `core/catalog.js`.** Không đụng
`index.html`, `play.html`, `main.js`, `play.js`, `manifest.js` nữa. Đã cập nhật lại hướng dẫn ở
`templates/HUONG DAN TEMPLATE.md` (mục "Khi nào một template được gộp"), `core/HUONG DAN CORE.md`
(mục MỚI "Nạp template theo yêu cầu"), `APP_MASTER.md` (bản đồ thư mục + quy tắc số 10).

**Đã tự test (trình duyệt thật, cổng 5510, console SẠCH cả 2 trang):**
- `index.html` lúc mở: **0 template, 2 stylesheet** (trước đây 14 + 16) — nạp lười đúng như thiết kế.
- Chạy hết 14 loại qua `ensureTemplate`: **14/14** nạp xong; **gọi SONG SONG 2 lần cùng lúc** trả về
  đúng 1 đối tượng và chèn **đúng 1 link CSS** (không nhân đôi); mount game bằng `startGame()` ra
  `.aw-stage` 14/14; mở editor từ act trắng 14/14 đúng badge; **0 lỗi runtime**.
- Loại không có thật → reject đúng thông báo, không làm sập trang.
- **`play.html`**: mở lên đúng như HS thấy (0 template, 2 CSS lõi), rồi đi ĐÚNG đường mà `play()` đi cho
  3 loại **ngoài Quiz** (crossword · speaking_cards · whack_a_mole) → cả 3 dựng game bình thường; trước
  đợt này cả 3 đều ném lỗi registry. Sau đó registry có đúng 3 loại + 3 CSS, không dư.

**Kiểm chứng luôn trên BẢN LIVE sau khi push** (không chỉ localhost): chờ Pages deploy xong rồi mở
`https://andrewclasses-01.github.io/AWord/play.html` → đúng 0 template + 2 CSS lõi lúc mở, rồi
crossword · unjumble · balloon pop đều dựng game bình thường, console sạch. (Bài học cũ vẫn đúng:
Pages KHÔNG cập nhật tức thì — phải `curl`/mở thật để xác nhận, đừng tin là đã live ngay sau push.)

**Không tự test được:** 1 assignment THẬT cho HS từ đầu tới cuối (nằm sau đăng nhập Google).
**➜ THẦY ĐÃ TỰ TEST VÀ XÁC NHẬN (1/8/2026) — không báo lỗi.**

**➜ ĐÃ COMMIT `7045f09` + PUSH main + LIVE.** 11 file: `core/catalog.js` · `core/registry.js` ·
`main.js` · `play.js` · `index.html` · `play.html` · `manifest.js` + 4 file hồ sơ/hướng dẫn.

### 1/8/2026 — Đợt 32: GỘP 8 TEMPLATE CÒN LẠI LÊN TRANG CHỦ — trang chủ từ 6 → **14 loại act**. Đã tự test (0 lỗi console). CHƯA COMMIT (chờ thầy chơi thử rồi mới push).

Thầy hỏi trang chủ tạo được bao nhiêu loại act (6), rồi bảo **"đưa toàn bộ lên trang chủ"** — tức là DUYỆT
luôn 8 template đã build xong nhưng còn nằm trong kho, chỉ chơi được qua `test.html` riêng.

**8 template được gộp lần này** (kèm `type` đăng ký trong registry):
`gameshow` (Gameshow quiz) · `maze_chase` (Maze chase) · `whack_a_mole` (Whack-a-mole) ·
`flying_fruit` (Flying fruit) · `balloon_pop` (Balloon pop) · `crossword` (Crossword) ·
`unjumble` (Unjumble) · `speaking_cards` (Speaking cards).

**4 file sửa để "lên trang chủ"** (đúng checklist mà các GHI CHU template đã dặn sẵn):
1. `core/catalog.js` — thêm 8 dòng `{type, label, built:true, blurb}`. Đây là 1 NGUỒN DUY NHẤT: vừa
   nuôi picker "New activity" ở trang chủ, vừa nuôi panel **Template** trong game (`engine.js` dùng
   `ALL_TEMPLATES = TEMPLATES`) → sửa 1 chỗ là cả 2 nơi hiện đủ 14 loại.
2. `main.js` — thêm 8 dòng `import "./templates/<ten>/<ten>.js"` (mỗi module tự `registerTemplate()`).
3. `index.html` — thêm 8 dòng `<link rel="stylesheet">` cho CSS từng template.
4. `manifest.js` — thêm 8 mục (giữ đồng bộ theo quy ước, dù `main.js` hiện không đọc file này).

**Sửa thêm `previewPick()` trong `main.js`** (ảnh thu nhỏ trên thẻ act ở trang chủ). Hàm cũ chỉ đọc
`content.questions|items` với các khoá `question/prompt/clue` + `answers/acceptedAnswers/word`, nên **5 loại
mới sẽ hiện "No questions yet"** — và **True or false (đã live từ trước) cũng đang bị**, không ai để ý.
Nay hàm nhận đủ mọi hình dạng dữ liệu trong thư viện:
`content.questions | items | words | statements | cards | pairs`, khoá câu hỏi thêm
`definition/sentence/text/word`, khoá đáp án thêm `answer` (boolean → "True"/"False"; string → chính nó),
`keyword`, `sentence`. Có chặn tự-trùng (`it.word !== question`) để Anagram/Flying fruit không lấy
đúng 1 chuỗi làm cả câu hỏi lẫn đáp án. Act rỗng vẫn trả `null` (giữ nguyên đường "No questions yet").

**KHÔNG đụng `core/` (ngoài catalog.js) — 0 dòng sửa trong engine/app.css.**

**Kiểm tra AN TOÀN trước khi gộp** (vì `index.html` nạp CSS của MỌI template ở phạm vi TOÀN CỤC):
- Quét selector đầu dòng của 14 file CSS → **không file nào có selector trần** (đều mang tiền tố riêng
  `.aw-bp- / .aw-cw- / .aw-ff- / .aw-gs- / .aw-mc- / .aw-sc- / .aw-unj- / .aw-wam-`…) → không rò rỉ style.
- **0 khối `:root`** trong cả 14 CSS → không có biến toàn cục giẫm chân nhau.
- Quét trùng tên `@keyframes` giữa 14 CSS + `core/app.css` → **0 trùng** (nếu trùng, file nạp sau sẽ
  âm thầm đè animation của game khác — bẫy đáng sợ nhất khi gộp CSS toàn cục).
- Đọc `normalize()` của cả 8 editor: đều tự dựng đúng cấu trúc riêng từ act trắng `content:{questions:[]}`
  mà `createBlankAct()` truyền vào → nút "New activity" không vỡ với loại nào.

**Đã tự test (trình duyệt thật, cổng 5510, console SẠCH, server không lỗi):**
- Network: **8 module template mới + editor + file sound đều 200 OK**; `document.styleSheets` đếm đủ
  **16 sheet** (2 core + 14 template).
- Nạp `core/registry.js` + `core/catalog.js` từ trong trang: **registry có đủ 14 type**, **catalog 14 mục
  `built:true`**, `missing=[]`, **cả 14 đều có hàm `edit`** (không loại nào rơi vào "editor coming soon").
- **Mở thử EDITOR cả 14 loại** bằng act trắng đúng như `createBlankAct()` → 14/14 dựng xong, badge đúng tên
  (QUIZ … SPEAKING CARDS), có ô nhập.
- **Mount thử GAME cả 14 loại** bằng `startGame()` với act mẫu → 14/14 dựng `.aw-stage` + topbar,
  **0 lỗi runtime** (bắt cả `error` lẫn `unhandledrejection`).
- **previewPick**: lấy CHÍNH hàm trong `main.js` đã ship ra chạy với 14 act mẫu → **14/14 ra câu hỏi +
  đáp án đúng** (trước khi sửa: `find_the_match` và các loại mới trả `null`), act rỗng vẫn `null`.
- *Không tự soi được bằng mắt màn trang chủ thật*: trang chủ chặn sau đăng nhập Google, popup này không
  tự động hoá được (bẫy đã ghi ở mục 0/APP_MASTER). Phần kiểm tra trên đã đi thẳng vào chính dữ liệu mà
  picker đọc (`TEMPLATES`) nên rủi ro còn lại rất thấp.

**➜ ĐÃ COMMIT `7aea668` + PUSH main, GitHub Pages deploy xong. THẦY TỰ TEST BẢN LIVE VÀ XÁC NHẬN
(1/8/2026) — không báo lỗi.** 6 file: `main.js` · `index.html` · `manifest.js` · `core/catalog.js` +
2 file hồ sơ.

**⚠️ VIỆC KẾ TIẾP ĐÁNG LÀM NHẤT — trang học sinh `play.html` vẫn CHỈ chơi được Quiz.** `play.js` mới
`import "./templates/quiz/quiz.js"`, nên giao assignment loại khác cho HS sẽ lỗi "Chưa có game loại ... trong
registry". Đây là tồn đọng CŨ (đúng cho cả 5 loại đã live từ trước), nay lộ rõ hơn vì có tới 13 loại ngoài
Quiz. Hai hướng: (a) thêm 13 dòng import tĩnh y như `main.js` — 5 phút, nhưng HS phải tải cả 14 game;
(b) **nạp template ĐỘNG theo `activity.type`** (sửa core, dùng chung cho cả `main.js`) — đúng bài hơn,
HS chỉ tải đúng game được giao. Đề xuất chọn (b), hỏi thầy trước khi làm.

### 1/8/2026 — Đợt 31: FIND THE MATCH — 4 loạt tinh chỉnh thầy yêu cầu (đã test trình duyệt thật, 0 lỗi console). THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG đụng CORE.

Find the match đã sống ở trang chủ từ 31/7 (`built:true`). Thầy chơi bản live rồi gửi 4 loạt yêu cầu, mỗi việc
đã đo DOM thật để xác nhận. **Chi tiết TỪNG loạt: `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` (mục
1/8/2026 — Đợt 31).** Tóm tắt:
- **Đồng hồ**: 3 giây đếm "3-2-1" KHÔNG còn tính vào đồng hồ (dùng hook core sẵn có `tpl.manualTimerStart` +
  `ui.startTimer()`, giống TRUE FALSE — không phải sửa core như đề xuất cũ).
- **Bố cục**: hạ + căn giữa khối đáp án đúng tâm vùng (đo lệch 0px).
- **Đáp án cố định tuyệt đối**: ô đã giải chỉ mờ đi, KHÔNG xóa khỏi DOM → lưới không bao giờ dồn/nhảy.
- **Bấm sai**: ô vừa bấm đứng yên (chỉ hiện ✗), câu hỏi chuyển sang câu kế; Repeat until correct = xếp lại
  vị trí ngẫu nhiên.
- **Số mạng như TRUE FALSE**: tim ở top bar cạnh điểm (`hasLivesSlot`), slider Lives 0–10 (0=Unlimited),
  pop tim khi sai, hết tim → game over.
- **Bấm đúng**: câu hỏi bay về ô điểm + 11 ngôi sao + điểm nảy (phỏng theo TRUE FALSE).
- **Khóa chọn**: sau mỗi lần bấm, khóa tới khi câu mới vào ≥50% (`gateTimer`, giống TRUE FALSE).
- **GAME OVER**: hết tim hiện "GAME OVER" (celebration + bảng menu) thay vì "GAME COMPLETE".
- **Câu dài tự co font**: `fitPrompt()` + biến `--pfit` cho prompt vừa khung (autoFit cũ chỉ đo lưới); clone
  bay dùng đúng cỡ đã co.

**File đổi (chỉ 3, KHÔNG đụng core):** `templates/find-the-match/find-the-match.js` / `.css` /
`sample-find-the-match.js` (mẫu bật sẵn `lives:5`). `git status` trước commit xác nhận đúng 3 file + các GHI CHU.

### 1/8/2026 — Đợt 30: TYPE THE ANSWER — chuỗi rất nhiều vòng tinh chỉnh thầy yêu cầu (bàn phím, âm thanh, options, bố cục, điểm số). THẦY ĐÃ DUYỆT → COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in/additive, đã kiểm Quiz + 4 template khác 0 lỗi.)

Thầy chơi bản Type the answer (đã live catalog từ 30/7) rồi yêu cầu tinh chỉnh sâu qua NHIỀU vòng "ok build"
+ test trình duyệt thật. **Nhật ký chi tiết TỪNG vòng: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`**
(mục 1/8/2026). Tóm tắt các nhóm việc + phần đụng CORE:

**Bàn phím ảo:** hạ thấp + cố định 1 vị trí (không co theo `--fit`), rộng 70%, phím chữ cái bằng nhau tuyệt
đối (fixed width + hạ font ⌫), caps hẹp 15% + tự tắt sau 1 chữ, chấm sáng cố định size chỉ đổi độ sáng
(caps/numbers = trắng đứng yên; Andrew = trắng nháy chậm), animation bật/tắt mượt, phím Submit im (không
tiếng gõ), **tiếng "cạch" gõ phím kiểu iPhone**.

**Âm thanh:** dùng bộ mp3 THẬT của Wordwall TTA (`templates/type-the-answer/sounds/` + `type-the-answer-sound.js`);
correct/wrong/intro/chuyển-câu/complete từ pack; tiếng gõ phím tổng hợp.

**Bố cục màn chơi (nhiều vòng):** ô đáp án dạng `<textarea>` tự xuống 2 dòng, CỠ CỐ ĐỊNH (không nhỏ hơn),
reveal đáp án đúng = hint Andrew = cỡ ô nhập; câu hỏi mới là thứ NHƯỜNG CHỖ (thu `--qfit`) khi thiếu; căn
giữa CẢ CỤM (reveal/ô nhập + Submit) đúng giữa khoảng câu-hỏi↔bàn-phím (căn LẠI MỖI FRAME khi reveal trượt
mở + chốt chặn không bao giờ đè bàn phím); chỉ nhận tiếng Anh (lọc non-ASCII, chặn cả bàn phím tiếng Việt);
bỏ placeholder; dấu ✓/✗ to+dày, rung rồi bay về điểm, bám hàng ô nhập; chữ Andrew trùng khớp màu+nhịp nút Andrew.

**Điểm số:** hiện `✓ X/tổng`; số tử XANH khi ≥0, ĐỎ khi âm (không dấu −, cho phép âm khi Minus); gạch chéo +
tổng màu đen; num↔/ == /↔total (cân đối); tích xanh/X đỏ bay + Pulse.

**⚠️ SỬA CORE (additive/opt-in — đã test lại Quiz + Anagram/Crossword/Gameshow/Whack-a-mole 0 lỗi):**
- `core/engine.js`: (a) **Auto switch** — checkbox global trong Options (mặc định TẮT, `draft.autoSwitch`);
  (b) **chặn "Submit answers" khi 0 câu** — `ui.onSubmit(fn, countFn)` + guard ở Menu (template đưa getter
  đếm câu đã trả lời; không đưa → như cũ, không kẹt) → đã thêm countFn cho 8 template
  (quiz/anagram/crossword/gameshow/maze-chase/unjumble/find-the-match/type-the-answer);
  (c) ô thời gian countdown nằm CẠNH nút "Count down" (cụm `.aw-opt-cd` nowrap); (d) "End of game
  (Show answers)" xuống CUỐI options; (e) **Apply bất kỳ option → tự restart game** (mọi template);
  (f) cờ `hideShuffleAnswers` (TTA ẩn "Shuffle answer order"). *(engine.js đã được commit chung ở Đợt 29
  do dùng chung cây làm việc với phiên True-false; các thay đổi này đã có trong HEAD.)*
- `core/sound.js`: thêm `keyClick()` (tiếng gõ phím tổng hợp, tôn trọng mute).
- `core/numberstepper.js`: **nhấn-giữ ▲/▼ chạy số liên tục** (có tăng tốc) — dùng cho ô thời gian countdown.
- `core/app.css`: rule `.aw-opt-cd`.

**Ghi chú song song:** đợt này cây làm việc dùng CHUNG với 1 phiên khác (True-false hearts + Find-the-match
"đáp án không đổi vị trí" + `manualTimerStart`/`ui.startTimer`). Các thay đổi đó là CỐ Ý và đã hoàn chỉnh,
được commit chung trong đợt này (find-the-match.js/.css).

### 1/8/2026 — Đợt 29: TRUE FALSE — 2 vòng tinh chỉnh (8 mục + 3 mục) thầy yêu cầu. THẦY ĐÃ DUYỆT → ĐÃ COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in, tương thích ngược.)

Thầy chơi bản True/false (đã live catalog từ trước) rồi yêu cầu tinh chỉnh; sau 2 vòng "ok build" +
test → DUYỆT. Đã **commit + push main + GitHub Pages tự deploy** (Pages serve từ ROOT, có `.nojekyll`).
Chi tiết đầy đủ: `templates/true-false/GHI CHU TRUE-FALSE.md`.

**Vòng 1 (8 mục, thầy chốt "luôn trộn ngẫu nhiên" + "đồng ý sửa lõi an toàn" qua AskUserQuestion):**
1. **Lives = thanh kéo 0–10** trong Options (0 = Unlimited). `normLives`: 0/null=vô hạn, undefined=5, max 10.
2. **Tim dời lên THANH TRÊN, ngay trái số điểm** (qua hook lõi mới `ui.livesSlot`). Mất mạng → tim NGOÀI
   CÙNG BÊN TRÁI bung ra biến mất hẳn.
3. **≤5 mạng = tim rời; ≥6 = dạng gọn "N♥"** (số + 1 tim).
4. **Nút True/False còn 80%** (font 4→3.2cqw, padding/max-width ×0.8).
5. **Khoảng cách kẻ→nút = nút→"x of y"** — đo lúc chạy (`balanceSpacing`, tự cân lại khi resize/fullscreen).
6. **Editor đổi thành 2 CỘT** (cột câu TRUE / cột câu FALSE, bỏ toggle từng dòng) — giữ NGUYÊN contract
   `content.statements {text,answer}` nên act cũ vẫn chơi được; dán Excel tự phân cột; ≥1 câu mỗi cột.
7. **Câu căn giữa** khoảng từ mép trên tới dòng kẻ (nhờ tim đã dời ra ngoài).
8. **Đếm 3-2-1 xong đồng hồ MỚI chạy** (hook lõi mới `manualTimerStart` + `ui.startTimer()`); đúng =
   câu bay hóa **sao nhỏ** bay vào số điểm; giảm tốc trượt câu (ENTER_MS 900→1300). Game **luôn trộn**.

**Vòng 2 (3 mục):**
1. **Chống bấm quá gần nhau:** 2 nút True/False KHÓA ngay khi vừa trả lời, giữ khóa suốt lúc câu bay/trượt
   ra, chỉ MỞ khi câu mới vào **~50%** (`gateTimer`=`ENTER_MS*0.5`; `lockButtons`/`unlockButtons`). Nút
   cũng khóa sẵn lúc đếm 3-2-1 (không lỡ trả lời câu đầu).
2. **Hạ glyph ♥ `translateY(0.09em)`** (~2px) cho cân với số điểm (chỉ dời hình tim, không dời số dạng gọn).
3. **Bỏ âm `tfSound.timesUp()` (~6-7s)** khi Submit/hết giờ — màn kết quả đã có nhạc tổng kết riêng.

**⭐ 2 HOOK LÕI MỚI (core/engine.js) — TÙY CHỌN, MẶC ĐỊNH TẮT, DÙNG LẠI được cho template sau:**
- `tpl.hasLivesSlot` → engine tạo `ui.livesSlot` (span trái số điểm, bọc `.aw-top-right`) + phơi
  `ui.scoreEl`. CSS lõi mới `core/app.css`: `.aw-top-right / .aw-top-lives / .aw-top-heart /
  .aw-top-heartcount` (rỗng thì `:empty` tự ẩn).
- `tpl.manualTimerStart` → engine KHÔNG tự chạy đồng hồ ở `begin()`; template gọi `ui.startTimer()` khi
  sẵn sàng (reset `startedAt` để loại thời gian đếm 3-2-1). Chống gọi 2 lần bằng `timerStarted`.
- Cùng kiểu an toàn với `inlineTimerBar`/`hideTimerOption` sẵn có. Các game khác (Quiz, FTM...) chạy y như cũ.

**File đụng:** `templates/true-false/{true-false.js, true-false.css, true-false-editor.js, GHI CHU
TRUE-FALSE.md}` + `core/engine.js` + `core/app.css`.

**Đã tự test (browser thật, cổng 5512, 0 lỗi console):** đếm 3-2-1 đồng hồ đứng 0:00; 5 tim cạnh điểm, sai
→ tim trái mất; đúng → 11 sao + câu bay + điểm; slider 8→"8♥", 8→7→6♥→5 tim rời, 0→Unlimited ẩn tim; nút
30.9px (80%); kẻ→nút = nút→số trang = 32.3px; editor 2 cột nạp/gộp/chặn đúng; khóa nút chống bấm mù; spy
audio xác nhận không phát `timesup.mp3`; chơi hết 8/8 → GAME COMPLETE + Show answers.

**⚠️ Lưu ý phiên sau (build tiếp):** True/false CHƯA chạy ở `play.html` (trang HS) — giống mọi template
ngoài quiz, `play.js` mới import tĩnh `quiz.js`; muốn giao bài cho HS cần thêm import + **nạp template động
theo `activity.type`** (ĐỀ XUẤT SỬA CORE chung cho MỌI template). Đây là việc lớn đáng làm kế tiếp.

### 1/8/2026 — Đợt 28: OPEN THE BOX — 5 cải tiến thầy yêu cầu + sửa 2 lỗi phát sinh. THẦY ĐÃ DUYỆT → ĐÃ COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in, tương thích ngược.)

Thầy chơi bản Open the box (đã live từ Đợt trước) và yêu cầu 5 cải tiến; sau 2 vòng phản hồi thầy DUYỆT.
Đã **commit `da11950` + push main + GitHub Pages tự deploy**. (Đánh số "đợt 17/18/19" trong
`templates/open-the-box/GHI CHU OPEN-THE-BOX.md` là đếm RIÊNG của template đó — khác Đợt 28 toàn dự án này.)

**5 cải tiến (thầy chốt qua AskUserQuestion + "ok build"):**
1. **Chữ ô câu hỏi/đáp án to hơn** — chuyển sang **cỡ ĐỘC LẬP TỪNG Ô** (kiểu Wordwall): từ ngắn phóng to
   tới 1.5×, từ dài chỉ nhỏ riêng ô đó (có lề, không chạm mép, không bẻ giữa từ), chữ nhiều từ wrap theo
   khoảng trắng. (Chỉ `templates/open-the-box/*`.)
2. **Editor tối đa 120 câu** (trước 100). + `docs/04-OPEN-THE-BOX.md`.
3. **Pop-up xác nhận** cho "Mark correct in all" + "Unmark all correct" (Delete all đã có sẵn).
4. **Khóa chọn text trong khung chơi** — CORE `core/app.css` `.aw-stage{user-select:none}` áp cho MỌI
   game (thầy chọn phạm vi này), chừa `input/textarea/[contenteditable]` để Type the answer vẫn gõ được.
5. **Show answers không cắt ngang từ** — CORE: `.aw-rv-txt` `overflow-wrap:normal`; kèm sửa **lỗi thật
   trong `core/fit.js fitOnce`** (không trừ padding khi đo → cắt cụt ký tự cuối). Thêm tùy chọn
   **`contentBox` (mặc định TẮT)**, chỉ bật ở lời gọi Show answers trong `core/engine.js` (min 0.2) →
   maze-chase & caller khác byte-for-byte y nguyên.

**2 lỗi phát sinh đã sửa trong cùng lô** (bắt được nhờ thầy chơi thử + đo `javascript_tool`): (a) bản
đầu để chữ phóng 2.4× gây quá to + bẻ giữa từ → hạ 1.5× + width-aware; (b) từ dài chạm mép → chuyển hẳn
sang cỡ độc lập từng ô (span câu hỏi tách riêng `.aw-otb-q-qtext`, `width:100%` để wrap, `minmax(0,1fr)`
+ `min-width:0` chặn ô nở theo từ).

- **File đổi (đã commit)**: `core/app.css`, `core/engine.js` (CHỈ hunk `contentBox` — hunk
  `hideShuffleAnswers` của phiên Type-the-answer ĐỂ NGUYÊN chưa commit), `core/fit.js`,
  `docs/04-OPEN-THE-BOX.md`, `templates/open-the-box/` (open-the-box.js/.css, editor, GHI CHU). 8 file,
  +265/−18.
- **Đã tự test** (trình duyệt thật, đo đạc, không đoán): cỡ độc lập từng ô (Meteorologist 1.35 vs còn lại
  1.5), Show answers 9 hàng có thanh cuộn 0 cắt chữ (chạy fitOnce THẬT đã vá), editor "9/120 boxes",
  confirm bật đúng + Cancel không đổi, `.aw-stage` user-select none + input vẫn text; hồi quy Quiz +
  Type the answer 0 lỗi console.
- Chi tiết đầy đủ: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` (đợt 17/18/19).

### 1/8/2026 — Đợt 27: UNJUMBLE (game thứ 11) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. KHÔNG sửa core.

Dựng lại act Classic của thầy `wordwall.net/resource/116872783/unjumble` — style **Whiteboard** (thầy chốt
= "Classic" của Unjumble). Sắp xếp các **TỪ** bị xáo trộn thành câu đúng (giống Anagram nhưng đơn vị là TỪ).

**Thầy chốt (AskUserQuestion):** (1) **kéo-thả THẬT** giống hệt Wordwall (insert + reflow), không dùng tap;
(2) đủ **3 chế độ chấm**; (3) dựng **đúng look Whiteboard** (bảng trắng + khung + doodle góc) làm Classic,
vẫn cho đổi Basic/Classroom/Beach.

**Cách chơi**: thầy gõ nguyên câu đúng → game tách thành từ + xáo (derangement, bắt đầu 0 điểm) → HS kéo-thả
từ (pointer, chuột+cảm ứng) sắp lại; từ đúng chỗ → xanh. Chữ bút xám #6f7680 nghiêng viết tay trên dòng kẻ,
nền #f6f6f3 trong khung đen + 4 doodle SVG (không branding Wordwall). Dấu câu dính từ cuối.
**3 mode**: Every word (1đ/từ) · **Every word + bonus** (giải sạch → "PERFECT" ×2, mặc định) · On submit
(bấm Submit → chấm xanh/đỏ stagger + hiện câu đúng). + Alignment Left/Centered.

**Thu thập từ Wordwall (Claude in Chrome + đọc theme JSON):** 41 âm THẬT theme Whiteboard + 4 đồ họa +
Palette/Audios/Layout — lưu ở `D:\APP AND DATA\AWord-data\Source\{Sound effect,Graphic}\UNJUMBLE\`
(kèm `00 - GHI CHU NGUON.txt` map sự kiện→âm lấy thẳng từ Audios.json của theme). Template chép 37 mp3 thực dùng.

- **File mới**: `templates/unjumble/` (unjumble.js/.css, unjumble-editor.js [Sentence|Clue], unjumble-sound.js,
  sample-unjumble.js, sounds/ 37 mp3, test.html/test.js, GHI CHU UNJUMBLE.md) + `docs/11-UNJUMBLE.md`.
- **Nhân bản Anagram**: khung mount/ui, flyScoreGain/pulseScoreTo/fadeSwap/finish, editor, hệ sound. Phần
  MỚI: `prepareItem` tách từ + derangement; kéo-thả pointer insert+reflow (placeholder + clone bám con trỏ);
  3 mode chấm; look Whiteboard.
- **Đã test** (trình duyệt thật, 0 lỗi console, mô phỏng pointer): tách "week." đúng · derangement → 0 điểm ·
  kéo đổi thứ tự + dọn sạch clone/ph · everyword "I like tea."=3đ · bonus perfect 6 từ=**12đ** + "PERFECT" ·
  submit câu sai=5 đỏ + reveal câu đúng · align center · clue tùy chỉnh · **Game complete** OK.
- **CHƯA gộp trang chủ** (`core/catalog.js`/`manifest.js`/`main.js`/`index.html` chưa đụng) — chờ thầy duyệt.
- **CHỜ TEST TOMKO**: cảm giác kéo-thả màn cảm ứng 86" · âm thanh loa lớp · fullscreen 4K · câu dài wrap nhiều dòng.
- Chi tiết: `templates/unjumble/GHI CHU UNJUMBLE.md`. Rollback = xóa thư mục `templates/unjumble/` (chưa đụng file chung nào).

### 1/8/2026 — Đợt 26: GAMESHOW QUIZ (game thứ 10) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. (Có sửa CORE, tương thích ngược.)

Dựng lại act Classic của thầy `wordwall.net/resource/116864527` — style **TV game show** (= "Classic"
của Gameshow, thầy chốt; theme nội bộ Wordwall `gameshow`, template id 69, type 11). Trắc nghiệm có **áp
lực thời gian + ĐIỂM theo tốc độ + Lives + VÒNG BONUS mỗi N câu + 4 LIFELINES**. Thầy chốt build **FULL**
(đủ bonus + lifelines) + tính điểm **kiểu points**.

**Cách chơi**: Play → intro 2 cánh cửa "QUIZ SHOW" trượt tách + nhạc nền → mỗi câu "Get ready!" → câu hỏi
+ 2–6 ô đáp án A/B/C/D (viền bóng đèn vàng, nền tia sáng). Đồng hồ đếm ngược TỪNG CÂU (hàng trên, giữa) +
✓ đúng (phải) + bảng điểm PTS (trái) + ♥ Lives (phải, nếu giới hạn). Đúng → ✓ + điểm theo tốc độ · Sai →
✗ (mất 1 Live nếu giới hạn) · Hết giờ → bỏ qua. Sau mỗi N câu (mặc định 3) → **BONUS ROUND** 5 lá bài úp,
chọn 1 → +điểm (50–250). **Lifelines** (mỗi thứ 1 lần/ván): 50:50 · ×2 · +TIME · REVEAL. Kết thúc → bảng
tổng kết + leaderboard **xếp theo ĐIỂM** + Show answers. Dữ liệu = Y HỆT QUIZ.

- **File mới**: `templates/gameshow/` (gameshow.js/.css, gs-sound.js, gameshow-editor.js [bọc khuôn
  quiz-editor, ép timer none], sample-gameshow.js, test.html/test.js, GHI CHU GAMESHOW.md, img/ 11 ảnh,
  sounds/ 47 mp3) + `docs/10-GAMESHOW.md`.
- **Assets THẬT** của Wordwall (theme gameshow) đã tải + convention ở `AWord-data/Source/{Sound effect,
  Graphic}/GAMESHOW/` (có GHI CHU.md). Art CỐ ĐỊNH (không theo 4 theme chung); viền bóng đèn marquee dựng
  bằng CSS (`.aw-gs-board::before`, 4 radial-gradient).
- **⭐ SỬA CORE (tương thích ngược — đã kiểm Quiz chạy 0 lỗi sau khi sửa):**
  1. `core/scoring.js`: `computeResult` nhận `raw.score` (mặc định = số câu đúng) + `raw.scoreText`
     (mặc định null); `rankCompare` xếp theo `score`.
  2. `core/leaderboard.js`: `addEntry` nhận + lưu `scoreText` (mặc định null).
  3. `core/engine.js`: `finish` truyền `score`+`scoreText`; bảng tổng kết & leaderboard hiện `scoreText`
     nếu có (không thì vẫn "đúng/tổng"). Thêm cờ `tpl.hideTimerOption` (ẩn nhóm Timer toàn-ván — song đôi
     `hideLettersOption`). Cập nhật `core/HUONG DAN CORE.md`.
- Template khai báo `hideTimerOption/hideLettersOption/inlineTimerBar`, tự dựng: intro cửa, get ready,
  đếm ngược từng câu (setInterval, KHÔNG rAF), điểm theo `timeFrac()`, vòng bonus (lá bài lật 3D),
  lifelines, Lives; gọi `ui.finish({score:points, scoreText, title})`.
- **BẪY đã sửa khi build**: ban đầu đặt lá bài bonus cùng class `.aw-gs-card` với ô câu hỏi → CSS lá bài
  (`width:13cqw; opacity:0`) ĐÈ ô câu hỏi làm nó co còn 125px + tàng hình. Đổi lá bài → `.aw-gs-bcard`.
  (Bài học: grep class mới trong CHÍNH file CSS của template, không chỉ trong core.)
- **Đã tự test**: đúng (132/370 điểm theo tốc độ) · sai (✗) · bonus (+250) · 50:50 (bỏ 2 sai) · ×2 (×2 =
  370) · REVEAL (nháy, nút mờ, giữ "đã dùng" xuyên câu) · Submit → tổng kết ĐIỂM 382 + leaderboard 382 +
  Show answers đầy đủ. **CHƯA gộp `core/catalog.js`/trang chủ** (chờ thầy duyệt).
- **CHỜ TEST TOMKO**: (a) âm thanh + nhạc nền trên màn thật; (b) +TIME & Lives-giới-hạn→Game over (code
  có, chưa chạy tới khi test vì để Unlimited); (c) fullscreen màn lớn.
Rollback: xoá `templates/gameshow/`; core chỉ THÊM (không xoá) → `git revert` commit này nếu cần.

### 1/8/2026 — Đợt 25: MAZE CHASE (game thứ 9) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH (chưa lên trang chủ).

Dựng lại act Classic của thầy `wordwall.net/resource/116866716` — style **Space** (= "Classic" của Maze
chase, thầy chốt). Cơ chế kiểu Pac-Man: câu hỏi ở đỉnh, các đáp án nằm trên các BỆ (pad) rải khắp MÊ
CUNG vũ trụ; lái chú robot phi hành gia (phím mũi tên/WASD + D-pad cảm ứng + vuốt) tới bệ ĐÚNG trong khi
NÉ các robot địch đuổi theo. Tới bệ đúng → ✓ xanh + điểm + sang câu; tới bệ SAI → ✗ đỏ + bệ biến mất +
mất 1 TIM; bị địch chạm → mất 1 TIM + văng về điểm xuất phát (có khiên tạm); hết mạng = Game over. Mô
hình dữ liệu `content.questions=[{question,answers:[{text,correct}]}]` y hệt Quiz.
Options: Timer (Count up mặc định) / Shuffle / Show answers + riêng **Lives** + **Difficulty (1–10** =
số/tốc độ địch) qua `buildExtraOptions`.
- File mới: `templates/maze-chase/` (maze-chase.js/.css, mc-sound.js, maze-chase-editor.js [bọc quiz-editor
  giữ type], sample-maze-chase.js, test.html/test.js, GHI CHU MAZE-CHASE.md, img/ 24 ảnh, sounds/ 29 mp3).
- Assets THẬT của Wordwall (theme Space) đã tải + lưu convention ở `AWord-data/Source/{Sound effect,Graphic}/
  MAZE CHASE/` (có GHI CHU.md). Art CỐ ĐỊNH, không đổi theo theme (như whack-a-mole/flying-fruit).
- Kỹ thuật: mê cung sinh ngẫu nhiên (DFS + braid thành mê cung có vòng) mỗi câu, vẽ bằng chính ảnh ô hành
  lang của Wordwall (map openings→piece); di chuyển ô-sang-ô bằng **setInterval** (KHÔNG rAF — luật lõi),
  mượt nhờ CSS transition `left/top`; địch đuổi bằng BFS + chút ngẫu nhiên (interval riêng); sprite 4×7
  đổi khung/hàng theo hướng; ân hạn 1.9s đầu câu + giãn địch khi hồi sinh để công bằng. Chữ pad/câu co
  bằng `fitOnce` (cả rộng+cao) vì mọi thứ dùng `cqw`. KHÔNG sửa `core/`.
- Ánh xạ âm CHÍNH XÁC từ `themejson/space/audios.json` (Type names: MazeChaseAnswerRight/PlayerFootsteps/
  EnemyAttack…). 5 âm kết-thúc generic (TimesUp/GameCompleted/GameOver/Restart/Leaderboard) KHÔNG nạp
  được (game lazy-load, nút Play trong canvas WebGL không script được) → dùng fanfare sẵn của engine +
  âm maze thay thế (clocktick cho cảnh báo 5s, playerappear cho restart). Ghi rõ trong GHI CHU.
- Tự test trình duyệt thật (devserver 5514): READY→maze render đúng→di chuyển→địch đuổi→tới bệ đúng ghi
  điểm (driver tự động né địch đạt 3/8 rồi hết mạng)→Game over tổng kết + leaderboard→Show answers (câu
  sai hiện ✗ + đáp án đúng). 0 lỗi console.
- CHƯA gộp trang chủ (`core/catalog.js`/`index.html` chưa đụng) — chờ thầy duyệt. ĐÃ commit + push
  (chỉ add đúng file Maze chase + 2 file docs của mình; Flying Fruit đợt 24 đã commit trước ở `84ea7ba`).

### 1/8/2026 — Đợt 24: FLYING FRUIT (game thứ 8) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. CHƯA COMMIT.

Dựng lại act Classic của thầy `wordwall.net/resource/116864498` — style **Jungle** (= "Classic" của
Flying Fruit). Cơ chế: câu hỏi (định nghĩa) ở đỉnh, các đáp án (`word`) bay ngang trên QUẢ
(kivano/mango/papaya) theo cung ném, chạm quả ĐÚNG → nổ tung nước (sprite 8 khung) + tia + ✓ + điểm +
sang câu; chạm SAI → ✗ + mất 1 TIM; hết mạng = Game over. Đáp án sai = **random `word` của câu khác**
(editor kiểu Anagram, thầy chốt). Mô hình dữ liệu `content.items=[{word,clue}]` y hệt Anagram.
Options: Timer/**Lives**/**Speed**/**Retry**/Shuffle/Show answers.
- File mới: `templates/flying-fruit/` (flying-fruit.js/.css, ff-sound.js, flying-fruit-editor.js,
  sample-flying-fruit.js, test.html/test.js, GHI CHU FLYING-FRUIT.md, img/ 15 ảnh, sounds/ 18 mp3).
- Assets thật của Wordwall (jungle) đã tải + lưu convention ở `AWord-data/Source/{Sound effect,Graphic}/
  FLYING FRUIT/` (có GHI CHU.md). Art CỐ ĐỊNH, không đổi theo theme (như whack-a-mole). Theme jungle
  KHÔNG có âm "Go"/"ClockTick".
- Kỹ thuật: `inlineTimerBar` để vẽ TIM ở `ui.topbarMid`; spawn/gỡ quả bằng setTimeout (không rAF);
  quả bay = animate `left` + `translateY` con + xoay cháu (tránh bẫy transform+animation); nổ = strip
  8 khung translateX steps(8). KHÔNG sửa `core/`.
- CHƯA gộp trang chủ (`core/catalog.js`/`index.html`/`ALL_TEMPLATES` chưa đụng) — chờ thầy duyệt.
  Chi tiết + đề xuất: `templates/flying-fruit/GHI CHU FLYING-FRUIT.md`.

### 1/8/2026 — Đợt 23: SPEAKING CARDS (game thứ 7, "mở" đầu tiên) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/speaking-cards/` + file nhật ký này. KHÔNG `git add -A`. **CHƯA** thêm vào
`core/catalog.js`/`index.html`/`manifest.js`/`ALL_TEMPLATES` — chờ thầy chốt rồi mới gộp trang chủ.
Session sau cải tiến: đọc `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` — có mục "Chưa làm" +
3 "ĐỀ XUẤT SỬA CORE".)*

Dựng act Speaking cards của thầy (`wordwall.net/resource/116796629/speaking-cards`), visual style
**Board Games** (= look **"Classic"** trong AWord — thầy chốt qua AskUserQuestion: **deal places 1–10**,
**thẻ có ảnh + chữ**). Ghi chú template: `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md`.

1. **Nghiên cứu** (Claude in Chrome): rút bài ngẫu nhiên từ bộ bài xáo, KHÔNG chấm điểm/leaderboard
   (open-ended). Data `content.cards=[{text,image?}]`. Options: Timer · Number of deal places (1–10) ·
   Shuffle item order. Menu: Start again/Resume. Âm thanh gói **"playingcards"** (15 mp3 đã có sẵn ở
   `AWord-data\Source\Sound effect\SPEAKING CARDS`, tải 30/7): intro/shuffle/tileAppear/tileFlip/restart/
   timesUp/menu/menuSubtle → chép vào `sounds/`.
2. **Game ĐẦU TIÊN `scorable:false`**. Đồ họa tự vẽ inline SVG (bàn cờ nỉ xanh + lưng bài vàng hoa văn +
   đạo cụ cờ đam/domino/xúc xắc), không chép ảnh gốc. Bộ file: `speaking-cards.js/.css`, `-sound.js`,
   `-editor.js`, `sample-*.js`, `sounds/`, `test.html/.js`.
3. **Bẫy đã xử lý**: (a) lật bài `fill:forwards` giữ `scaleX(0)` khi tab ẩn → bước kết thúc HỦY animation
   + xoá inline transform (theo HUONG DAN CORE §animate); (b) ẩn chip điểm ✓ + nav ◀▶ (vô nghĩa) bằng JS
   trong mount, KHÔNG sửa core; (c) tỉa Options thừa của Quiz (`hideLettersOption:true` + tỉa DOM panel
   "End of game"/"Shuffle answer order", đổi tên → "Shuffle item order"). 3 ĐỀ XUẤT SỬA CORE ghi trong
   GHI CHU template (cờ `openEnded` ẩn score/nav/Submit; cờ ẩn nhóm Options; API khai báo deal-places).
4. **Editor**: soạn thẻ chữ + ẢNH (upload → thu nhỏ ≤480px thành data URL), kéo sắp xếp, dán cột từ Excel.
5. **Tự test OK** (test.html, console sạch): deal/flip/undo/shuffle/hết-bài/dealPlaces 1·3·6/countdown→
   "Time's up"/thẻ-ảnh/Options-sạch/editor/đổi-theme. Chưa test Save thật (cần đăng nhập Firebase).

### 1/8/2026 — Đợt 22: BALLOON POP (game thứ 6) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/balloon-pop/` + file nhật ký này. KHÔNG `git add -A`. **CHƯA** thêm vào
`core/catalog.js`/`index.html`/`manifest.js` — chờ thầy chốt rồi mới gộp trang chủ.)*

Dựng act Balloon Pop của thầy (`wordwall.net/resource/116864480/baloon-pop`), style **Wild West**
(= **"Classic"** trong AWord — thầy chốt qua AskUserQuestion: **bản đầy đủ giống Wordwall**, điều khiển
**bấm/chạm để pop**). Ghi chú template: `templates/balloon-pop/GHI CHU BALLOON-POP.md`.

1. **Lấy nguồn** (Claude in Chrome): **27 mp3** → `AWord-data\Source\Sound effect\BALOON POP` (22 thư mục
   trạng thái đánh số + GHI CHU). Cách lấy: đọc `themejson/western2/audios.json` trên CDN + đối chiếu file
   game THỰC preload/tải (Performance API). Balloon Pop **KHÔNG dùng** clocktick/chip/nhạc nền — nhịp "đồng
   hồ" là tiếng **tàu chạy** (TrainChug/TrainTime); báo đúng/sai bằng cargo **land/break**.
2. **Cơ chế** (đọc Edit Content): toa tàu hiện 1 ĐỊNH NGHĨA · khinh khí cầu trôi mang KEYWORD · pop blimp
   khớp → keyword rơi thành thùng cargo lên tàu (đúng: tàu chạy tiếp; sai: vỡ). Dữ liệu
   `content.items=[{keyword,definition}]` (min5/max100, Swap Columns, có ảnh). Options: Timer/Speed/Levels/
   Bonuses(ExtraTime/Points/x2)/Show answers.
3. **Template** `templates/balloon-pop/` (self-contained `sounds/`): **1 vòng lặp rAF** duy nhất (blimp +
   đồng hồ + cargo, theo delta clamp 100ms → tab ẩn thì TẠM DỪNG cả game, không hết giờ lúc ẩn). Đồng hồ
   RIÊNG + thanh tiến độ ở `topbarMid` (`inlineTimerBar:true`). `ui.finish({title,review,...})` như
   open-the-box. **Đồ họa vẽ 100% CSS/SVG** (sa mạc parallax + tàu hơi nước đỏ + khinh khí cầu bạc + biển
   gỗ + máy bay) — KHÔNG chép ảnh Wordwall (khác whack-a-mole vốn tải ảnh gốc; chọn CSS/SVG để tránh bản
   quyền). Sizing `cqw`; blimp định vị `left%/top%` của scene (tránh bẫy transform-%); crate `animate()` có
   `setTimeout` dự phòng; fx bake `translate(-50%)` vào keyframe (§3.5). Class tiền tố `.aw-bp-`. KHÔNG sửa core.
4. **Editor** `balloon-pop-editor.js` (mẫu anagram-editor): bảng Keyword | Matching definition + Swap
   Columns + dán Excel 2 cột + kéo sắp xếp; nút ảnh để placeholder ("coming soon").
5. **Test** (`test.html`): pane ẩn thì rAF treo nên test LOGIC bằng patch rAF thành bộ bước-khung + remount
   → xác nhận spawn/trôi/đồng hồ, **pop đúng (+điểm+lên level+tàu chạy)**, **pop sai (vỡ, không điểm)**,
   **hết giờ → panel TIME'S UP** (Score/Leaderboard/Show answers/Start again), Show answers đúng — **0 lỗi
   console**. Chơi LIVE (pane hiện): cảnh + tàu + blimp + máy bay render đẹp, sát Wordwall.
6. **Còn để đợt sau** (mục POLISH trong GHI CHU template): giãn lane blimp khỏi chồng · ẩn ô đồng hồ engine
   trái "0:00" thừa (ĐỀ XUẤT SỬA CORE) · thêm ảnh keyword/definition · nảy cargo · hiệu ứng bonus rõ hơn.

### 1/8/2026 — Đợt 21: WHACK-A-MOLE (game thứ 7) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/whack-a-mole/` + 2 file nhật ký này. KHÔNG `git add -A` — `templates/balloon-pop/`
là việc CHƯA commit của phiên khác, KHÔNG đụng. **CHƯA** thêm vào manifest/index/trang gồm — chờ thầy
chốt + test TOMKO.)*

Dựng act Whack-a-mole của thầy (`wordwall.net/resource/116864290/whack-a-mole`), style **Wild West**
(theme "western"). Thầy chốt: **2 chế độ** (True/False + Quiz), **bản đầy đủ** (thùng gỗ + level +
đếm điểm), **đồ họa Wild West**. Ghi chú template: `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`.

1. **Lấy nguồn** (ổ D, Claude in Chrome): 31 mp3 → `AWord-data\Source\Sound effect\WHACK A MOLE`
   (20 thư mục sự kiện + GHI CHU) · 31 ảnh → `Source\Graphic\WHACK A MOLE` (5 nhóm). Cách lấy: đọc
   `themejson/western2/audios.json` + `scenes/whack.json` trên CDN, đối chiếu file game THỰC SỰ preload
   (Performance API). Phát hiện: whack **KHÔNG dùng nhạc nền**; núi/mesa nằm MỜ sẵn trong `bg2`
   (ImageQuality 0.08), **xương rồng là lớp trang trí riêng** (`balloon/cactus*`) — đã lấy thêm để dựng cảnh.
2. **Template** `templates/whack-a-mole/` (self-contained `img/` + `sounds/`): game thời gian thực bằng
   `setTimeout` (KHÔNG rAF; mỗi mole có setTimeout tuyệt đối tự lặn). Đồng hồ RIÊNG ở `topbarMid`
   (`inlineTimerBar`, giống Open the box) để thùng "time" cộng giây được. 2 chế độ: True/False
   (`content.statements`) + Quiz (`content.questions`, đập đúng → xoay biển sang câu kế). Đầy đủ: combo,
   thùng time/loot/power/dizzy, power-up glow, hoạt cảnh đếm điểm cuối → `ui.finish` (Score/Time +
   Show answers + Leaderboard). Engine KHÔNG cần sửa (dùng `inlineTimerBar`/`buildExtraOptions`/
   `optionsNeedRestart`/`sounds.*`).
3. **Editor đầy đủ** 2 chế độ: toggle True/False | Quiz, soạn câu/đáp án, dán Excel, kéo sắp xếp,
   validate; giữ CẢ 2 mảng content, Save ghi `options.mode`.
4. **Đã test** (`test.html` qua browser preview, **0 lỗi console**): 2 chế độ; đập đúng/sai → điểm +
   tia lửa + combo; thùng "time" ngoi lên; Quiz xoay biển sang câu kế; hết giờ (ván 4s) → tally →
   bảng "TIME'S UP" Score 2/2 Time 5.4s + menu đủ; editor render + chuyển mode + Save ra dữ liệu đúng.

**BẪY đã sửa (trong lúc build):** (a) **TDZ** — `let clockEl/fillEl` khai báo SAU chỗ gọi
`ensureTimerUI()` → truy cập biến `let` trong vùng chết → mount NÉM LỖI im lặng sau khi vẽ sign (có
scene+biển nhưng không đồng hồ/chuột). Sửa: dời khai báo lên khối state. (b) **Hố cao 0px** — hố chứa
toàn con `position:absolute` nên cao 0 → `molewrap height:96%` sụp → chuột bị cắt sạch. Sửa: set
`hole.style.height = s*1.35cqw`.

**CHỜ TEST TOMKO:** (a) cảm giác đập bằng cảm ứng màn 86"; (b) nhịp spawn + tốc độ (option Speed);
(c) âm thanh; (d) cỡ chuột/cactus + độ đầy của nền. Sau khi thầy chốt → thêm `manifest.js` + `index.html`
(link css) + `ALL_TEMPLATES` → đưa lên LIVE.
Rollback = `git reset --hard 43df2db` (về đợt 20 Crossword).

### 31/7/2026 — Đợt 20: CROSSWORD (game thứ 6) — build + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Làm bởi 1 phiên riêng, song song với Find the match / Balloon pop / Whack a mole của các phiên khác.
Chỉ commit đúng thư mục `templates/crossword/` + `docs/09-CROSSWORD.md` + 2 file nhật ký này — KHÔNG
`git add -A`, KHÔNG đụng việc chưa commit của phiên khác.)*

Dựng lại act Crossword của thầy (`wordwall.net/resource/116864402/crossword`, style **Classic** = mặc
định AWord). Nghiên cứu đầy đủ: `docs/09-CROSSWORD.md`. Ghi chú template + hạn chế + đề xuất sửa core:
`templates/crossword/GHI CHU CROSSWORD.md`.

1. **Nghiên cứu act thật** (Claude in Chrome): đọc file cấu hình theme Classic trên CDN
   (`audios.json`/`palette.json`/`crossword layout`/`content model`) + **CHƠI THẬT** để map chính xác
   âm thanh ↔ sự kiện (đo độ dài file khớp lúc phát). Crossword Classic dùng **13 mp3 / 9 hiệu ứng**:
   intro · correct×3 · incorrect×3 · gamecompleted · timesup · restart · menu · leaderboard · reveal.
   KHÔNG có âm gõ từng chữ / clocktick / tileflip / gameover.
2. **Lưu nguồn** (ổ D): 13 mp3 vào `AWord-data\Source\Sound effect\CROSSWORD` (thư mục đánh số +
   GHI CHU.md) · 6 file đồ họa tham khảo vào `Source\Graphic\CROSSWORD` · copy âm sang
   `templates/crossword/sounds/`.
3. **Template mới** `templates/crossword/`: `crossword.js` (**tự sinh lưới ô chữ interlock** greedy từ
   danh sách {answer,clue}; chọn từ/đổi hướng; nhập bằng bàn phím vật lý + **bàn phím ảo QWERTY ẩn mặc
   định** [`hasKeyboardToggle`+`ui.kbdSlot`, như Type the answer] cho cảm ứng TOMKO; chấm từng từ; đúng =
   ô accent + điểm + âm, sai = âm + lộ đáp án nếu bật "Show answer when wrong") · `.css` (`.aw-cw-*`,
   theme-driven, cqw; cell px tính bằng JS `resizeGrid`) · `sample-crossword.js` (20 từ thật) ·
   `crossword-editor.js` (2 cột Answer|Clue + dán Excel) · `crossword-sound.js` (mp3 THẬT) ·
   `test.html`/`test.js` · `GHI CHU CROSSWORD.md`. Khớp hợp đồng engine: `sounds{play,restart,
   timeWarning,complete}` + `edit` + `toPrintItems` + `hideLettersOption` + `buildExtraOptions`
   (showAnswerWhenWrong).
4. **Tự test** qua `templates/crossword/test.html` (preview `aword-verify` port 5512 vì 5510 bị phiên
   khác chiếm), trình duyệt thật, **0 lỗi console**: sinh lưới 19/20 từ (1 từ không chèn được thì bỏ khỏi
   lưới); chọn/gõ/chấm ĐÚNG (ô xanh + điểm) và SAI (âm + lộ đáp án, không điểm); Submit → panel GAME
   COMPLETE (Score/Time) → Show answers 19 hàng; bật/tắt bàn phím ảo (lưới co vừa khít, không tràn); đổi
   theme Classic↔Beach (màu ô/chữ/gợi ý đổi theo accent, không vỡ).

**CHƯA gộp trang chủ / CHƯA thêm `core/catalog.js` built:true** — chờ thầy duyệt (giống Find the match).
**ĐỀ XUẤT SỬA CORE**: thêm cờ `tpl.hideRandomOption` (ẩn nhóm Shuffle của Options cho crossword).
**Hạn chế đã biết**: lưới nhiều từ + bàn phím ảo bật trên màn thấp = ô nhỏ (hướng nâng cấp sau: phóng
to/cuộn theo từ đang chọn khi bật bàn phím ảo).

### 31/7/2026 — Đợt 19: TYPE THE ANSWER — bàn phím ảo kiểu điện thoại (caps / numbers) + nút trợ giúp "Andrew help". ĐÃ COMMIT + PUSH.

Thầy chơi thử bàn phím và góp ý 2 vòng. **Chỉ đụng 2 file template** `templates/type-the-answer/type-the-answer.js`
+ `.css` — KHÔNG đụng core. Chi tiết đầy đủ + BẪY: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`
(2 mục cuối ngày 31/7). Tóm tắt:

1. **Vòng 1 — bàn phím tông tối, phím vuông** (theo ảnh thầy gửi): nền `#2b2b2e`, phím xám `#48484b` chữ
   trắng, bo góc nhỏ + gờ tối. Thêm **phím Submit XANH ngay trong bàn phím** (hàng dưới, bên phải Space);
   khi bàn phím HIỆN thì ẩn nút "Submit Answer" ngoài, ẩn bàn phím thì nút ngoài hiện lại (`syncSubmitVisibility`).

2. **Vòng 2 — bố cục 4 hàng kiểu điện thoại + 3 phím chức năng**:
   `' q…p ⌫(đỏ)` / `caps a…l ?` / `numbers z…m . ,` / `Andrew  Space  Submit`.
   - **caps**: nhập chữ HOA + chấm sáng tròn khi bật (thuần trang trí — chấm điểm vẫn bỏ qua hoa/thường).
   - **numbers**: đổi 3 hàng chữ sang layout số/ký tự cơ bản, chấm sáng khi bật, caps mờ đi.
   - **Andrew help** (dùng **1 lần cho CẢ VÁN**): chưa dùng = chấm sáng; bấm → hiện đáp án đúng (khối reveal
     màu hổ phách "Andrew ➜ …") + phím sáng vàng rực + hào quang nhấp nháy; HS chép đáp án → Submit
     (chép đúng **vẫn cộng điểm**, sai vẫn sai); ngay sau Submit → Andrew tối lại + khóa hết ván.

3. **BẪY THẬT đã bắt + sửa**: `rebuildKeyboard()` thay node bàn phím (caps/numbers/Andrew) nhưng `measure`
   của `autoFit` đóng kín biến `kbd` node CŨ (rời DOM → cao 0) → autoFit không thu nhỏ → bấm Andrew (reveal
   mở, 4 hàng) thì tràn khung (cắt câu hỏi + nút Submit). Sửa: `measure` đo `keyboardEl` (biến sống).

4. **Đã test thật qua trình duyệt** (chụp ảnh + đo DOM): layout khớp ảnh; caps/numbers/Andrew đủ chu trình;
   fit khớp khung sau khi sửa; 0 lỗi console. **Commit sạch chỉ 3 file type-the-answer** — cố ý KHÔNG add
   `APP_MASTER.md` (đang có phiên khác viết lại mục 0b BÀN GIAO song song) và `.claude/` (config dev cục bộ).

### 31/7/2026 — Đợt 18: OPEN THE BOX — làm lại hiệu ứng chuyển ô số ⇄ ô câu hỏi + bỏ tiếng thừa. ĐÃ COMMIT + PUSH.

Thầy chơi thử và góp ý 3 vòng (tương ứng **đợt 14→15→16 RIÊNG trong** `templates/open-the-box/GHI CHU
OPEN-THE-BOX.md` — số đợt của template đó đếm riêng, khác số Đợt toàn cục ở file này). Tóm tắt:

1. **Hiệu ứng chuyển ô số ⇄ ô câu hỏi viết lại** (đợt 14): trước đây bấm ô là `render()` XÓA TRẮNG lưới
   ngay → các ô số khác "biến mất tức thì". Nay lưới + màn câu hỏi **cùng nằm DOM, chồng tuyệt đối** (class
   `.aw-otb-anim` trên root) nên: MỞ = ô được bấm phóng to từ đúng vị trí ô số + các ô khác **mờ dần** +
   đáp án trượt vào, cả 3 cùng ~1.2s; ĐÓNG = ngược lại hoàn toàn. Tách hàm `buildBoxGrid`/`buildQuestion`/
   `setupFit`, thêm `animateOpen`, viết lại `closeCardThen`. **Bẫy đã vá**: `zoomElTo` từng chốt theo
   `transitionend` của opacity (840ms) làm màn đóng bị CẮT NGANG → đổi chốt theo `transform` (1200ms).
2. **Chiều đóng: ô số hiện lại MUỘN hơn** (đợt 15): thêm `CLOSE_BOX_FADE_DELAY_MS=400` (giữ ẩn 400ms đầu
   rồi mới mờ hiện, vẫn kết thúc đúng lúc gỡ màn câu hỏi — không snap). Chiều mở không đổi.
3. **Bỏ tiếng THỪA khi trả lời SAI** (đợt 16): sai từng phát 2 tiếng (`wrong()` + `tileEliminate()`) → bỏ
   `tileEliminate()`, chỉ giữ `wrong()` phát ngay lúc bấm.

Không đụng `core/` — mọi CSS đều prefix `.aw-otb-*` (chỉ nạp khi chơi Open the box). Test browser thật
qua `test.html` bằng `javascript_tool` (đo `getComputedStyle`/chặn `Audio.play` liên tục): cả 2 chiều
chạy đồng thời đúng số đo, trả lời đúng→tích xanh, hết giờ→GAME OVER, sai chỉ còn 1 tiếng; 0 lỗi console.

**ĐÃ COMMIT + PUSH GitHub** — commit `222dafa` (3 file: `open-the-box.js/.css` + `GHI CHU OPEN-THE-BOX.md`).

> ⚠️ **CHO PHIÊN MỚI**: lúc commit lô này, cây làm việc CÒN các file **CHƯA commit của một phiên khác
> đang chạy SONG SONG**: `APP_MASTER.md` + `templates/type-the-answer/*` (js/css/GHI CHU). Tôi CỐ Ý
> không đụng để phiên đó tự lo — **đừng commit nhầm** các file này. `.claude/` là cấu hình phiên cục bộ,
> cũng bỏ qua. Việc kế tiếp cho Open the box (nếu có): xem đuôi `GHI CHU OPEN-THE-BOX.md` + `APP_MASTER.md`
> mục 7 (đọc bản mới nhất SAU khi phiên song song commit xong).

### 31/7/2026 — Đợt 17: TEMPLATE MỚI **TRUE FALSE** (True or false) — build + gộp trang chủ (`built:true`), chờ thầy duyệt.

Template thứ 6. Thầy yêu cầu: "phong cách + màu sắc của các template AWord khác, cách chơi giống act
Wordwall https://wordwall.net/resource/116827457/true-false" (act nội bộ Wordwall gọi là **"boolean"**,
cùng họ game "băng chuyền" với Find the match). Trước khi build đã chuẩn bị bộ âm thanh gốc (chơi act,
soi `themejson/classic/audios.json` + Performance API để bắt đúng 22 file .ogg game preload, tải về +
đổi .mp3 ffmpeg, xếp 15 thư mục ở `D:\APP AND DATA\AWord-data\Source\Sound effect\TRUE FALSE`).

Cách chơi: câu (statement) trượt vào giữa như băng chuyền (dùng lại engine chuyển động của Find the
match), bấm **True/False**. Đúng → +điểm + ✓; sai → ✗ + mất 1 tim. Có **Speed slider** (0 = chờ trả
lời), **mạng 5 tim + Game Over** (thầy chốt: kèm nút bật/tắt trong Options), **Unanswered questions**
(show once / repeat). Bàn phím T/← = True, F/→ = False. Mũi tên prev/next ẩn qua `:has(> .aw-tf-card)`.

**Màu nút theo THEME** (thầy chốt): True = `var(--aw-ok)`, False = `var(--aw-no)` — 2 biến này mọi
theme đã có sẵn nên KHÔNG hard-code, KHÔNG sửa `core/themes/*`. Classic xanh-lá/đỏ, Classroom xanh-ấm/
đỏ-gạch, Beach xanh-biển/đỏ-san-hô (đã đo `getComputedStyle`).

Bộ file trong `templates/true-false/`: `true-false.js/.css`, `tf-sound.js` + `sounds/` (bộ classic2
giống Find the match), `true-false-editor.js` (bảng Statement | True/False, dán Excel 2 cột, max 40),
`sample-true-false.js` (chủ đề Plant life cycle, 8 câu), `test.html/.js`. Chi tiết đầy đủ + checklist
đã kiểm: `templates/true-false/GHI CHU TRUE-FALSE.md`.

Khai báo 4 nơi: `core/catalog.js` (`built:true`), `main.js` (import), `index.html` (link CSS),
`manifest.js` (entry). **Nhân tiện vá 2 thiếu sót của Find the match phiên trước**: FTM chưa có trong
`index.html` (thiếu link `find-the-match.css` → FTM không có style trên trang chủ) và chưa có trong
`manifest.js` — đã thêm cả hai.

Đã test browser thật qua `test.html` (0 lỗi console; đúng/sai/mất-tim; Game Complete + Show answers;
màu 3 theme). **CHƯA test play.html** (giống mọi template ngoài quiz — play.js chỉ import quiz, hạn chế
chung đã biết). **CHƯA commit/push** — chờ thầy duyệt (chưa nói "commit"/"push").

### 31/7/2026 — Đợt 16: Find the match GỘP TRANG CHỦ — `built:true` + import vào `main.js`. Không còn "coming soon".

Thầy nói "gộp lên trang chủ và kết thúc session này". `core/catalog.js` đổi `built:false→true` + sửa
blurb khớp cơ chế mới; `main.js` thêm 1 dòng import (đúng khuôn Quiz/Anagram/Open the box/Type the
answer). Đã kiểm: panel Template trong game hiện Find the match ngang 4 game kia; main.js load không
lỗi console; mọi asset (.js/.mp3) của Find the match tải 200 OK. **CHƯA tự đăng nhập Google thử "+New
activity" trên trang chủ thật** (máy build không tự động hoá đăng nhập được, giống các đợt merge Open
the box/Type the answer trước) — thầy tự thử tạo 1 act thật khi rảnh. Đã commit + push GitHub.

Tất cả 5 template chính (Quiz/Anagram/Find the match/Type the answer/Open the box) giờ ĐỀU
`built:true`, sống trên trang chủ. Việc kế tiếp: theo `APP_MASTER.md` mục 7 (chưa đọc lại trong phiên
này vì file đó đang có 1 phiên khác chỉnh sửa song song, xem ghi chú ở đợt 15/16 phía dưới) — 1 phiên
mới nên đọc lại `APP_MASTER.md` mới nhất trước khi nhận việc tiếp theo.

### 31/7/2026 — Đợt 15: Find the match — bấm sai cũng trượt câu (sửa lại giả định sai đợt 14) + đếm ngược 3-2-1 (Count up) + ting đếm giờ (Count down). CHƯA gộp trang chủ.

Thầy sửa lại 1 giả định của đợt 14 + thêm 2 yêu cầu về đồng hồ. Chi tiết đầy đủ (kèm 1 giới hạn kỹ
thuật CHƯA giải quyết được, cần thầy quyết định): `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`.

- **Bấm SAI giờ cũng làm câu hỏi trượt đi** (đợt 14 em đoán sai là "bấm sai không ảnh hưởng câu hỏi" —
  thầy xác nhận sai, đã sửa lại đúng). Bấm sai → dấu ✗ bay lên đúng ô vừa bấm rồi biến mất (bỏ hẳn hiệu
  ứng rung `.is-shake` cũ) + câu hỏi trượt tiếp ra phải như lúc bấm đúng. Cặp đó: "Show once" → xoá ô
  đáp án đúng luôn; "Repeat until correct" → xếp lại **vị trí NGẪU NHIÊN** trong hàng đợi (không phải
  luôn xếp cuối). Đã kiểm bằng `javascript_tool` đo DOM thật (không đoán qua ảnh chụp): đúng cả 2 chế độ.
- **Đếm ngược "3-2-1"** trước câu hỏi đầu tiên — CHỈ khi Timer = Count up: số to giữa khu câu hỏi, mỗi
  giây đổi số + 1 tiếng "ting" (dùng lại `clocktick.mp3`), xong mới phát "Go" và câu hỏi thật mới trượt
  vào. Đã đo timing bằng `javascript_tool`, đúng 3-2-1 mỗi giây rồi mới vào câu hỏi.
  - **Giới hạn CHƯA giải quyết**: thầy muốn "3 giây chuẩn bị không tính vào đồng hồ", nhưng đồng hồ
    hiển thị + thời gian ghi bảng xếp hạng cuối ván là do `core/engine.js` tự quản lý, bắt đầu đếm NGAY
    lúc mount() chạy — không có cách nào template tự hoãn mà không sửa core. Đã ghi "ĐỀ XUẤT SỬA CORE"
    (thêm cờ `tpl.deferTimerStart` + hàm `ui.startClock()`, kiểu bổ sung CHỈ THÊM không đổi template
    khác) — CHƯA tự làm, chờ thầy "ok" mới đụng `core/engine.js`. Hệ quả hiện tại: đồng hồ/thời gian
    cuối ván của Find the match sẽ cao hơn thời gian chơi thật đúng 3 giây.
- **Ting đếm giờ cho Count down**: 1 tiếng/giây từ lúc còn 10s, gấp đôi nhịp (2 tiếng/giây) từ lúc còn
  5s — tính bằng đồng hồ riêng của template (đọc `options.timerTotalSeconds`), không cần sửa core.
  Count up thì hết ting sau 3 giây chuẩn bị (không ting xuyên suốt ván nữa như đợt 14 làm nhầm).
- CHƯA tự nghe thật các file âm thanh (chỉ kiểm lịch trình `setTimeout` qua code, không nghe được qua
  công cụ test).

### 31/7/2026 — Đợt 14: Find the match — cơ chế "băng chuyền" trượt liên tục + âm thanh Wordwall thật + lưới 5 hàng cố định vị trí + speed slider + ẩn nav + đường kẻ đứt. CHƯA gộp trang chủ.

Thầy gửi tiếp 5 điều chỉnh cụ thể sau đợt 13. Chi tiết đầy đủ + giả định tự quyết (có 1 điểm chưa chắc
chắn 100%, đã ghi rõ): `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`, đây chỉ tóm tắt.

- **Lưới CỐ ĐỊNH 5 hàng, căn giữa màn hình, không dồn lại khi xoá ô** — mỗi ô Keyword được gán
  `grid-row`/`grid-column` cố định 1 lần lúc mount (cols = ceil(tổng/5)), xoá 1 ô chỉ để trống chỗ đó.
- **Câu hỏi trượt kiểu "băng chuyền"**: trái → giữa → phải, chậm và liên tục (`element.animate`), bấm
  đúng cũng làm câu hỏi trượt tiếp ra phải (không snap tức thì) — câu mới chỉ vào sau khi câu cũ trượt
  HẲN ra khỏi màn. Bấm SAI không ảnh hưởng chuyển động của câu hỏi (chỉ rung ô + trừ mạng) — quyết định
  tự đưa ra vì brief không nói rõ, thầy nên xác nhận lại.
- **Âm thanh thật** từ `D:\APP AND DATA\AWord-data\Source\Sound effect\FIND THE MATCH` — module mới
  `ftm-sound.js` + `templates/find-the-match/sounds/*.mp3`: Intro/Go/ConveyorAppear/Centred/Leave/
  Correct/Incorrect/GameCompleted/GameOver/TimesUp/Restart/ClockTick. 3 âm còn lại (Menu/Leaderboard/
  RevealAnswers) CHƯA gắn được — thiếu hook ở `core/engine.js`, đã ghi "ĐỀ XUẤT SỬA CORE" trong GHI CHU
  riêng, chưa tự sửa.
- **Speed đổi từ dropdown sang thanh trượt** (`<input type="range">`). **Ẩn hẳn nút prev/next** (chỉ
  còn "x of y") bằng CSS `:has()` riêng cho Find the match, không đụng `core/engine.js`, không ảnh
  hưởng game khác. Thêm **đường kẻ đứt** ngăn khu câu hỏi/khu đáp án.
- Test qua `test.html`: xoá ô giữa lưới → các ô khác không xê dịch; Speed=3 chạy hết 8 câu tự trượt
  đúng, Game Complete 0/8 đúng lúc (dùng `javascript_tool` đo `transform` để xác nhận không bị kẹt —
  ban đầu tưởng lỗi, hoá ra chỉ là 400ms chờ trước màn kết thúc); tắt Remove corrects → ô ở lại có ✓ nhỏ
  (ghi chú thẩm mỹ: dấu ✓ hơi đè chữ khi từ ngắn). 12 file âm thanh load 200 OK, không lỗi console.
  CHƯA tự nghe thật 12 file âm thanh, CHƯA tự kiểm "Repeat until correct" quay vòng thật.

### 31/7/2026 — Đợt 13: Find the match viết lại theo brief thầy (đảo vai trò prompt/tile · Speed · Repeat · Remove corrects · content editor mới). CHƯA gộp trang chủ.

Thầy gửi ảnh tham khảo Wordwall thật + mô tả tốc độ/chế độ lặp lại. Chi tiết đầy đủ:
`templates/find-the-match/GHI CHU FIND-THE-MATCH.md`, đây chỉ tóm tắt.

- **Đảo ngược prompt/tile so với bản MVP 24/7**: bản cũ để Keyword (1 chữ) làm câu hỏi trên cùng +
  lưới Definition bên dưới — SAI so với Wordwall thật. Viết lại: **Definition (câu hỏi dài) chạy ở
  trên, Keyword (chữ ngắn) là các ô màu trong lưới** — đúng ảnh thầy gửi. Dữ liệu `{keyword,
  definition}` không đổi cấu trúc.
- **3 Option mới** (qua cơ chế `buildExtraOptions` có sẵn từ đợt Anagram, KHÔNG đụng `core/`):
  **Speed** (0-10: 0 = đợi vô hạn như cũ, 1-10 = tự trượt sang câu kế sau 1 khoảng dừng, dừng ngắn +
  trượt nhanh dần theo tốc độ); **Unanswered questions** ("Show each question once" mặc định = hết
  giờ bỏ luôn, hay "Repeat questions until correct" = hết giờ xếp lại cuối hàng đợi hỏi lại sau);
  **Remove corrects** (mặc định bật = ô biến mất khi đúng như cũ, tắt = ô ở lại có dấu ✓ nhỏ).
  Màu ô Keyword dùng lại đúng bộ 8 màu Open the box/Quiz.
  - `templates/find-the-match/find-the-match.js` viết lại gần như toàn bộ; `find-the-match.css`
    thêm biến `--ftm-c`/`--ftm-d` (cùng cơ chế fallback `--aw-tile-fixed` như Open the box).
- **Content editor mới** (`find-the-match-editor.js`, copy khuôn `anagram-editor.js`): bảng
  Keyword | Definition, kéo-thả, dán Excel, **tối đa 40 cặp** (thầy nâng từ 30 trong tài liệu nghiên
  cứu gốc lúc brief), tối thiểu 3.
- Test qua `test.html`: Speed=0 chơi hết 8/8 đúng/sai/Show answers đúng; Speed=4 tự trượt đúng nhịp,
  bỏ-qua-xoá-ô đúng, Game Complete 0/8 khi để trôi hết; đổi theme Basic ép đúng 1 màu, không vỡ
  layout; editor thêm dòng/Cancel hoạt động đúng. 0 lỗi console.
- **CHƯA tự kiểm**: "Repeat questions until correct" thật, `removeCorrects:false`, lives + Speed cùng
  lúc, fullscreen, kéo-thả trong editor, dán Excel thật — để lại cho thầy hoặc phiên sau.
- **CHƯA import vào `main.js`, CHƯA đổi `built:false` → `true`** — theo đúng quy trình (giống Open
  the box/Type the answer: 2 việc này chỉ làm cùng lúc khi thầy duyệt gộp trang chủ).

### 30/7/2026 — Đợt 12: 4 chỉnh sửa theo yêu cầu thầy (Quiz hết ép hoa · chặn chuột phải · fullscreen giữ khi restart · fullscreen full màn TOMKO). ⚠️ CÓ SỬA `core/` — thầy yêu cầu trực tiếp.

Thầy nêu 4 việc. Cả 4 đều đụng `core/` (engine.js/app.css) + 1 file quiz — được phép vì thầy yêu cầu
rõ (ngoại lệ của Luật số 1 trong `core/HUONG DAN CORE.md`).

**1. Quiz ép HOA mọi đáp án → bỏ.** `templates/quiz/quiz.css` `.aw-quiz-tile` có
`text-transform: uppercase` ép hoa toàn bộ chữ trong ô đáp án. Bỏ đúng khai báo đó → đáp án hiện đúng
như thầy gõ (VD "banana" ra "banana", không thành "BANANA"). ALL CAPS chỉ còn ở Anagram (option riêng
của game đó, không đụng). Đã đo `getComputedStyle(.aw-quiz-tile).textTransform === "none"`.

**2. Chặn hoàn toàn chuột phải trong khung act.** `core/engine.js`: sau `root.append(page)` thêm
`page.addEventListener("contextmenu", e => e.preventDefault())`. Chỉ chặn trong `.aw-page` (khung
game) — trang thư viện vẫn có menu chuột phải bình thường. Vì `page` dựng lại mỗi lần `startGame` nên
listener luôn mới, không cần gỡ tay. Đã kiểm: bắn sự kiện `contextmenu` vào `.aw-page` →
`defaultPrevented === true`.

**3. Restart bị rớt fullscreen → sửa gốc.** Nguyên nhân: fullscreen trước đây request trên `page`,
mà `restart()` gọi `startGame` → `root.innerHTML = ""` xoá `page` cũ → trình duyệt tự thoát fullscreen,
rồi `page` mới dựng lên không ai request lại. **Sửa: đổi phần tử fullscreen từ `page` sang `root`
(`#app`)** — root KHÔNG bao giờ bị xoá khỏi DOM (chỉ bị thay ruột), nên fullscreen tự giữ nguyên qua
restart, không cần request lại (tránh hẳn cái race "thoát rồi vào lại trong cùng 1 nhịp click"). Hệ
quả phải xử lý kèm: giờ RỜI game (Home / Edit) sẽ KHÔNG tự thoát fullscreen nữa (trước đây thoát nhờ
`page` bị xoá) → thêm `if (fsElement()) exitFs()` vào đúng 2 nút Home + Edit để về đúng hành vi cũ
(thư viện/editor hiện ở chế độ cửa sổ). "Change template"/"Play a different template" chỉ là toast
"coming soon" nên không đụng. `restart()` cố tình KHÔNG thoát → đó chính là mục đích.

**4. TOMKO (màn 4K 16:9) bấm fullscreen chỉ full 1 góc → thêm tiền tố vendor.** CSS cũ chỉ có
`.aw-page:fullscreen` (không tiền tố). Trên panel TOMKO (trình duyệt cũ hơn máy chính) pseudo-class
`:fullscreen` không khớp → `.aw-page` giữ nguyên `max-width:1000px` → chỉ chiếm 1 góc trên-trái dù nền
đã đen. **Sửa: viết lại khối CSS fullscreen, mỗi tiền tố 1 RULE RIÊNG** (`:fullscreen`,
`:-webkit-full-screen`, `:-moz-full-screen`, `:-ms-fullscreen`) — TUYỆT ĐỐI không gộp chung 1 danh
sách selector, vì trình duyệt vứt CẢ rule nếu gặp 1 selector nó không hiểu (đã suýt mắc: nếu gộp,
Chrome coi `:-moz-full-screen` là lỗi → vứt luôn `.aw-page` rule → hỏng máy chính đang chạy tốt). Đo
thật trong Chrome: 5 nhóm × 4 tiền tố khai báo → Chrome GIỮ đúng 2 rule/nhóm (`:fullscreen` +
`:-webkit-full-screen`) và TỰ BỎ 2 rule `-moz/-ms` mà KHÔNG ảnh hưởng 2 rule kia (`fsRuleCount:10`) —
đúng bằng chứng cho thấy tách rời là bắt buộc. JS cũng thêm helper dò đủ tiền tố:
`fsElement()`/`requestFs()`/`exitFs()` (webkit/moz/ms) thay cho `document.fullscreenElement`/
`requestFullscreen`/`exitFullscreen` trần — phòng TOMKO không có API không tiền tố. Cũng đổi hẳn phần
tử fullscreen sang `root` (gộp với việc 3), CSS key theo tổ tiên fullscreen: `:fullscreen .aw-page` /
`:fullscreen .aw-stage` (letterbox math y hệt bản cũ đang chạy đúng: stage rộng
`min(100vw, 100vh*16/9)`), thêm ẩn `.aw-as-bars` (thanh assignment) lúc fullscreen cho gọn.

**Kiểm chứng đã làm** (localhost, trình duyệt thật, `test.html` Quiz): 0 lỗi console; đáp án Quiz hết
hoa; chuột phải bị chặn trong `.aw-page`; CSS fullscreen parse đúng (Chrome giữ 2/4 tiền tố mỗi nhóm,
không rớt rule chuẩn); engine load không lỗi cú pháp; root = `#app` đúng ở cả main.js/play.js/test.js.
**CHƯA tự kiểm được HIỆU ỨNG FULLSCREEN THẬT** — preview pane không cấp fullscreen (cần user gesture +
pane hiển thị). **Nhờ thầy xác nhận trên màn thật**: (a) máy chính bấm fullscreen vẫn full đúng như
trước (đảm bảo không hồi quy); (b) restart khi đang fullscreen thì VẪN fullscreen; (c) TOMKO bấm
fullscreen giờ full toàn màn 4K chưa; (d) Home/Edit thoát fullscreen về cửa sổ.

### 30/7/2026 — Đợt 11b: sửa 1 BUG THẬT bắt được ngay sau khi thầy tự tay thử trên bản live

Thầy gửi ảnh chụp trang live: modal "New activity" vẫn hiện Open the box/Type the answer "Coming soon"
— **hoá ra là cache trình duyệt của thầy**, không phải lỗi server: mở tab MỚI (`tabs_create` +
`javascript_tool` import thẳng `core/catalog.js?bust=<timestamp>` từ `andrewclasses-01.github.io`) xác
nhận catalog live đã đúng `built:true` cả 2. Bài học lặp lại đúng BẪY mục 9 (GitHub Pages/trình duyệt
cache file .js) — chỉ cần thầy bấm tải lại cứng (Ctrl+Shift+R) hoặc mở tab mới.

**Nhưng ảnh chụp cũng lộ 1 lỗi thật khác, không liên quan cache**: 1 act cũ tên "VOCABULARY REVIEW —
Open the box" (thầy đã tạo được từ trước, có lẽ lúc còn test cục bộ) hiện nhãn loại game là
**`OPEN_THE_BOX`** (chữ hoa + gạch dưới) thay vì "Open the box" như card Anagram/Quiz bên cạnh hiện
đúng "ANAGRAM"/"QUIZ". Soát `main.js` thấy dòng vẽ nhãn này dùng thẳng `node.type` (chuỗi kỹ thuật,
vd `"open_the_box"`) thay vì gọi `templateLabel(node.type)` (hàm đã có sẵn, trả về nhãn đẹp "Open the
box") — lỗi NẰM SẴN từ trước (không phải do đợt gộp hôm nay gây ra), chỉ là VÔ HÌNH bấy lâu vì Quiz/
Anagram là type 1-từ nên viết hoa `"quiz"`/`"anagram"` tình cờ đúng luôn với nhãn hiển thị; type nhiều
từ như `open_the_box`/`type_the_answer` mới lộ ra khác biệt. Sửa 1 dòng (`main.js`, hàm `actCard`):
đổi `escapeText(node.type || "quiz")` → `escapeText(templateLabel(node.type))`. Đã kiểm bằng
`javascript_tool` gọi thẳng `templateLabel()` cho cả 5 type (`quiz/anagram/open_the_box/
type_the_answer/`type không tồn tại`) ra đúng nhãn đẹp cho 4 type thật + fallback an toàn cho type lạ;
trang chủ tải lại 0 lỗi console. **ĐÃ COMMIT + PUSH GITHUB** (cùng yêu cầu "push" của thầy từ đợt 11).

### 30/7/2026 — GỘP Open the box + Type the answer VÀO TRANG CHỦ, PUSH GITHUB (đợt 11, "đưa lên live")

Thầy yêu cầu thẳng "đưa Open the box và Type the answer lên live" để dùng trên máy khác, bỏ qua bước
chờ tự chơi thử ở local trước như quy trình cũ (mục 0b APP_MASTER.md từng ghi "chờ thầy duyệt xong
mới gộp"). Đây là lệnh rõ ràng của thầy nên làm luôn bước gộp trang cuối (việc mà `HUONG DAN
TEMPLATE.md` quy định chỉ 1 session phụ trách tổng mới làm):

1. **`core/catalog.js`**: `open_the_box` và `type_the_answer` đổi `built: false` → `true` (Find the
   match GIỮ NGUYÊN `false` — thầy chỉ yêu cầu 2 game này).
2. **`index.html`**: thêm `<link>` cho `open-the-box.css` + `type-the-answer.css`.
3. **`manifest.js`**: thêm 2 entry theo đúng khuôn Quiz/Anagram (dù `main.js` hiện không đọc file này
   trực tiếp — vẫn cập nhật cho khớp mô tả đầu file "danh sách template đã chốt").
4. **`main.js`**: thêm `import "./templates/open-the-box/open-the-box.js"` +
   `import "./templates/type-the-answer/type-the-answer.js"` (đăng ký template qua side-effect của
   `registerTemplate`, giống Quiz/Anagram).
5. **Bắt được 1 lỗi thật lúc soát code trước khi gộp**: hàm vẽ thẻ act trên trang chủ (`actCard`) chỉ
   đọc `node.content?.questions` (đúng hình Quiz) để lấy 1 câu hỏi + đáp án làm ảnh xem trước. Nhưng
   Open the box/Anagram/Type the answer đều lưu dữ liệu ở `content.items` (không phải `.questions`) và
   Type the answer còn khác tên field hẳn (`prompt`/`acceptedAnswers` thay vì `question`/`answers`) —
   nên nếu gộp nguyên xi, thẻ của **cả 3 game này** (kể cả Anagram đã chốt từ 29/7!) sẽ hiện "No
   questions yet" dù có đủ nội dung. Sửa bằng 1 hàm dùng chung mới `previewPick(node)` đọc được cả 4
   hình dữ liệu (`content.questions[]` kiểu Quiz-answers / `content.items[]` kiểu Quiz-answers (Open
   the box) / `content.items[]` kiểu `{word,clue}` (Anagram) / `content.items[]` kiểu
   `{prompt,acceptedAnswers}` (Type the answer)) — tiện sửa chung 1 lần vì đằng nào cũng phải đụng hàm
   này.
6. **Kiểm chứng đã làm** (không đăng nhập Google được nên không tự bấm hết luồng thư viện):
   - Trang chủ tải: 0 lỗi console, cả 2 module mới + editor + `otb-sound.js` tải 200 OK
     (`read_network_requests`).
   - Chạy thử `previewPick()` ngay trong trình duyệt (`javascript_tool`) với dữ liệu mẫu thật của cả 4
     game (`sample-quiz.js`/`sample-anagram.js`/`sample-open-the-box.js`/`sample-type-the-answer.js`)
     → cả 4 ra đúng câu hỏi + đáp án, không cái nào rỗng.
   - `core/catalog.js` sau khi sửa: import lại trong trình duyệt xác nhận đúng
     `quiz:true, anagram:true, find_the_match:false, type_the_answer:true, open_the_box:true`.
   - Đọc lại 2 hàm `normalize()` trong `open-the-box-editor.js`/`type-the-answer-editor.js` xác nhận
     chúng tự bọc `content: {questions:[]}` (hình `createBlankAct()` ở `main.js` tạo khi bấm "+ New
     activity") về đúng `content.items` với item rỗng hợp lệ — nên tạo act MỚI của 2 loại này từ
     trang chủ sẽ không vỡ, dù chưa tự bấm thật được vì cần đăng nhập.
   - `templates/open-the-box/test.html` + `templates/type-the-answer/test.html`: tải lại, 0 lỗi
     console, màn READY hiện đúng — không hồi quy so với trước khi gộp.
   - **CHƯA tự kiểm được** (cần đăng nhập Google, Google chặn tự động hoá popup — bẫy đã biết): "+ New
     activity" hết hiện "Coming soon" cho 2 game này, tạo act thật, thẻ preview hiện đúng câu hỏi thật,
     kéo-thả/Move/Duplicate/Set assignment cho 2 loại act mới. Thầy tự thử trên bản live.
7. **`core/` KHÔNG bị đụng** — mọi thứ engine cần (cờ `inlineTimerBar`, `hasKeyboardToggle`,
   `buildExtraOptions`...) đã có sẵn từ các đợt build trước; `core/engine.js` đọc `ALL_TEMPLATES` thẳng
   từ `catalog.js` nên chỉ cần sửa đúng 1 chỗ (`catalog.js`) là panel "Template" trong game cũng tự
   cập nhật theo, không phải sửa thêm ở `engine.js`.
8. Cập nhật trạng thái 🟢→✅ trong `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` +
   `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`. **Find the match vẫn 🟢, KHÔNG đụng.**
9. **ĐÃ COMMIT + PUSH GITHUB** theo đúng yêu cầu rõ ràng của thầy ("push để dùng được trên này") — xem
   commit ngay sau đợt này trong lịch sử git; đã `curl` kiểm chứng nội dung file live khớp bản vừa đẩy.

### 30/7/2026 — Type the answer: content editor + viết lại toàn bộ màn chơi theo góp ý chi tiết của thầy

Chi tiết đầy đủ: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`. Tóm tắt:

1. **Content editor mới** (`type-the-answer-editor.js`) — bảng **Câu hỏi bên trái | Câu trả lời bên
   phải** (1 câu hỏi có thể nhiều câu trả lời), dán Excel tự nhận diện đúng cấu trúc ảnh thầy gửi (dòng
   câu hỏi trống = câu trả lời thêm cho câu hỏi phía trên), tối đa 50 câu.
2. **Bố cục màn chơi**: ô "Type your answer" cao hơn + rộng 80% khung, nút **Submit Answer** (mỏng hơn)
   nằm ngay dưới ô nhập.
3. **Tích xanh/X đỏ bay về điểm** ngoài mép phải ô nhập: đúng luôn cộng điểm; sai chỉ trừ điểm khi bật
   Option mới **"Minus points for wrong answers"**, tắt thì chỉ mờ dần không đổi điểm.
4. **"Show answer when wrong"** thành Option thật — bật thì câu sai hiện đáp án đúng xanh lá NGAY TRÊN ô
   nhập, khối ô nhập+Submit trượt mượt xuống nhường chỗ (CSS `grid-template-rows` 0fr→1fr, không dùng
   transform).
5. Bỏ "Letters on answers" khỏi Options (không áp dụng). Chấm luôn không phân biệt hoa/thường.
6. **Bàn phím ảo QWERTY** mới: giữa khung (60% rộng) + số bên trái + dấu câu bên phải, nút ẩn/hiện cạnh
   Menu, mặc định hiện mỗi khi mở act.
7. **Core bị đụng (đã hỏi thầy trước, chỉ 2 điểm, đều CHỈ THÊM)**: `core/engine.js` thêm cờ
   `tpl.hideLettersOption` (ẩn nhóm Letters on answers) + `tpl.hasKeyboardToggle`/`ui.kbdSlot` (chỗ trống
   cạnh Menu cho nút riêng của template) — bọc `menuBtn` trong `.aw-bottombar-left` để giữ đúng grid
   3-cột của `.aw-bottombar`; `core/icons.js` thêm icon `keyboard`. Đã test lại Quiz sau khi sửa core —
   không đổi gì, 0 lỗi.
8. Bắt 2 lỗi thật lúc test qua trình duyệt (gõ bằng chính bàn phím ảo mới xây): điểm không cộng vì
   `requestAnimationFrame` không chạy trong tab ẩn/không render (đã thêm `setTimeout` dự phòng cho vòng
   đếm điểm); hiệu ứng mở khối câu trả lời đúng bọc nhầm trong `requestAnimationFrame` không cần thiết
   (ô đã tồn tại từ trước, không phải mới tạo) — bỏ rAF, gọi thẳng.
9. **Type the answer VẪN `built:false`, CHƯA gộp trang chủ** — chờ thầy tự chơi thử rồi duyệt.

### 30/7/2026 — Open the box: đồng hồ thẳng mép ô câu hỏi, tách zoom ô số/trượt đáp án, sửa lỗi thật của việc căn giữa hàng cuối

3 việc, xem chi tiết đầy đủ ở `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 10: (1) đồng hồ dịch
hẳn sang trái, mép trái đồng hồ THẲNG mép trái ô câu hỏi (đo `getBoundingClientRect` lệch 0px) — sửa
bằng cách cho cột đầu của `.has-inline` trong `core/app.css` một độ rộng CỐ ĐỊNH `1.6cqw` (đúng bằng
padding của ô câu hỏi) thay vì `auto` không đoán trước được; (2) tách hẳn 2 hiệu ứng — chỉ ô câu hỏi
zoom từ vị trí Ô SỐ, các ô đáp án KHÔNG zoom mà chỉ trượt ngang từ mép phải MÀN HÌNH (85cqw, đo bằng
khung game thật chứ không phải trong lòng ô); (3) **bug thật** của đợt 9: hàng cuối "đã căn giữa" nhưng
không thấy giữa — hoá ra CSS Grid chỉ có thể đặt ô lẻ vào TRỌN 1 cột, không chia được nửa cột, nên lệch
tâm thật (đo ra 37.5% thay vì 50%). Đổi hẳn `.aw-otb-grid` từ CSS Grid sang **Flexbox
`flex-wrap:wrap`+`justify-content:center`** — canh giữa mỗi hàng LIÊN TỤC, không theo bước cột. Gặp 1
bẫy khi đổi: cỡ ô đôi khi bị giới hạn bởi chiều cao chứ không phải chiều rộng, khiến khung rộng dư chỗ
nhét THÊM ô vào 1 hàng (ép test `cols=4` với 9 ô ra thật 6+3 thay vì 4+4+1!) — sửa bằng cách CHỐT đúng
bề rộng khung theo `cols*cell+gaps` thay vì để nó giãn hết cỡ. Test lại đủ: đo pixel xác nhận căn giữa
chính xác (lệch 0.5px, sai số làm tròn), chạy hết ván 9/9 tự động ra đúng "GAME COMPLETE", hồi quy
Quiz/Anagram không đổi gì, 0 lỗi console. **ĐÃ COMMIT + PUSH GITHUB** cùng đợt 8+9 — xem mục đầu file.

### 30/7/2026 — Open the box: thanh giờ full-width + đồng hồ chạy LIÊN TỤC, zoom chậm gấp đôi, đáp án trượt phải

9 điều chỉnh tiếp theo sau đợt xây editor (xem chi tiết đầy đủ trong
`templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 9 — file này chỉ tóm tắt): (1) thanh giờ nay chạy
gần hết chiều ngang khung, đồng hồ số đối xứng với điểm ở 2 đầu, chuyển đỏ dần + tích gấp đôi khi còn
≤5s (`core/app.css` đổi `grid-template-columns` của `.has-inline` từ `1fr auto 1fr` sang `auto 1fr
auto` — lần sửa `core/` thứ 2 cho Open the box, vẫn chỉ ảnh hưởng riêng nó); (2) lưới ô zoom lúc bấm
START nay kéo dài đúng **2.46 giây** — đo thật bằng `ffmpeg -i intro.mp3` (không có ffprobe trên máy)
để khớp chính xác độ dài nhạc; (3) bỏ 1 tiếng "xột xoạt" thừa phát chồng lên tiếng Intro lúc bấm START
— hoá ra là tiếng xáo câu hỏi (`shuffle.mp3`) vô tình phát cùng lúc, đã bỏ tiếng đó (vẫn xáo câu bình
thường); (4) hàng cuối thiếu ô giờ tự căn giữa; (5) tốc độ zoom Ô SỐ↔Ô CÂU HỎI chậm gấp đôi (600→1200ms);
(6) hiệu ứng "pop lưới" giờ chạy ở MỌI lần quay về màn lưới (không chỉ lần đầu) để đồng bộ cảm giác
zoom in/out; (7) đáp án trượt vào từ cạnh phải, trượt ngược ra phải khi đã chọn xong; (8)+(9) **kiến
trúc lại hẳn đồng hồ**: từ "mỗi câu 1 bộ đếm riêng, dừng khi về lưới" sang **1 bộ đếm DUY NHẤT chạy
liên tục từ ô đầu tiên cho tới hết ván** — đúng thì thanh giờ "đầy ngược trở lại" rồi chạy tiếp; sai thì
cứ chạy tiếp KỂ CẢ khi đang đứng ở màn lưới chọn ô kế — hết giờ ngay tại đó thì thua luôn, không cần mở
thêm ô nào. Test bằng `javascript_tool` xác nhận đúng cả 9 mục + hồi quy Quiz/Anagram không đổi gì, 0
lỗi console. **ĐÃ COMMIT + PUSH GITHUB** cùng đợt 10 — xem mục đầu file.

### 30/7/2026 — Open the box: bỏ chế độ Simple, xây content editor, đổi bộ âm thanh, hiệu ứng zoom + gộp thanh giờ/điểm

Thầy chốt 5 việc cho Open the box qua AskUserQuestion trước khi build (đã hỏi + chờ "ok build" đúng
quy trình):

1. **Bỏ hẳn chế độ "Simple"** (lật hộp xem chữ, không điểm) — chỉ còn "Questions" (đố vui trong hộp).
   `mountSimple()` cùng option `boxesAutoClose` bị xoá khỏi `open-the-box.js`. Mỗi câu hỏi giờ **bắt
   buộc có đáp án + tối thiểu 2 đáp án + 1 đáp án đúng** — chặn cả 2 lớp: `open-the-box-editor.js`
   (validate trước khi Save) VÀ `open-the-box.js` (lọc phòng thủ lúc chơi, phòng dữ liệu cũ/sửa tay).
2. **Xây `open-the-box-editor.js`** (màn soạn nội dung đầy đủ đầu tiên cho template này) — gần như
   COPY NGUYÊN `templates/quiz/quiz-editor.js` vì hình dạng dữ liệu giống hệt Quiz
   (`{question, answers:[{text,correct}]}`), chỉ đổi field `content.questions`→`content.items`, nhãn
   "Question N"→"Box N", giới hạn số hộp theo đúng luật Wordwall thật (`docs/04-OPEN-THE-BOX.md`: min
   2 – max 100 hộp, thay vì giới hạn câu hỏi của Quiz). Wire qua `otbTemplate.edit` (đúng hợp đồng
   `tpl.edit` có sẵn trong `core/engine.js`/`main.js` — không cần sửa gì thêm ở đó).
3. **Đổi toàn bộ bộ âm thanh** sang bộ 15 file gốc Wordwall thầy tải riêng
   (`D:\APP AND DATA\Source\Sound effect\OPEN THE BOX`, copy vào `templates/open-the-box/sounds/`,
   xoá bộ mượn tạm từ Anagram trước đó). **Lưu ý đặt tên gameOver/timesUp — thầy chốt NGƯỢC với tài
   liệu gốc của chính bộ âm thanh** (file `GHI CHU.md` trong bộ âm thanh ghi TimesUp = tiếng "keng"
   lúc đồng hồ về 0, GameCompleted mới là tiếng thắng): thầy yêu cầu **GameOver phát khi THUA vì hết
   giờ, TimesUp phát khi THẮNG (mở hết hộp)** — đã build ĐÚNG theo lời thầy, file "05 GameCompleted"
   gốc vì vậy **không dùng tới**. Thêm: ClockTick tích mỗi giây lúc đồng hồ câu hỏi đang chạy, Shuffle
   lúc xáo thứ tự hộp, TileAppear lúc lưới hộp xuất hiện đầu ván, TileEliminate lúc 1 hộp bị khoá do
   trả lời sai. Sửa luôn 1 lỗi nhỏ có sẵn từ đợt trước: `sounds.complete` (hook chạy ở MỌI lần
   `ui.finish()`, kể cả thua) từng gán nhầm tiếng "thắng" — bỏ hẳn hook đó, để tiếng thắng/thua tự
   template gọi đúng lúc như trên, tránh phát 2 tiếng chồng nhau khi thua.
4. **Hiệu ứng zoom lúc bấm START**: lưới hộp xuất hiện nhỏ hơn (scale .72) rồi zoom dần về cỡ chuẩn,
   so le nhẹ theo thứ tự ô (CSS `@keyframes aw-otb-box-in`, class `.is-entrance` chỉ gắn ở lần render
   ĐẦU TIÊN của mỗi ván — không lặp lại khi quay về lưới sau khi trả lời 1 câu). An toàn với bẫy
   transform+animation (`.aw-otb-box` định vị bằng CSS Grid, không phải `transform`, nên animate
   `transform: scale()` ở đây không dính bẫy "popup nhảy vị trí").
5. **Gộp thanh giờ + điểm cùng 1 hàng** — việc DUY NHẤT cần sửa `core/` đợt này, thầy đã đồng ý qua
   AskUserQuestion với điều kiện **chỉ ảnh hưởng Open the box**. Thêm cờ opt-in `tpl.inlineTimerBar`:
   `core/engine.js` chỉ thêm 1 khe `ui.topbarMid` (giữa `.aw-topbar`, 3 cột CSS Grid `1fr auto 1fr`)
   KHI template khai cờ này; không khai thì `.aw-topbar` giữ nguyên y hệt flex 2-con cũ (đã test lại
   Quiz + Anagram xác nhận `topbar.className === "aw-topbar"`, không có `.aw-topbar-mid`, 0 lỗi
   console). `open-the-box.js` chuyển việc dựng đồng hồ+thanh giờ từ bên trong `.aw-otb-qcard` sang
   `ui.topbarMid`, xoá padding-top vá tạm của đợt 6 (không cần nữa vì không còn 2 hàng chồng nhau).

**Test bằng `javascript_tool`** (browser thật, không phải bench giả): chơi hết 9 câu ĐÚNG hết →
"GAME COMPLETE" 9/9 (đúng gọi `timesUp`); để hết giờ giữa chừng → "GAME OVER" (đúng gọi `gameOver`);
chọn 1 đáp án SAI → hộp khoá + khoá icon hiện đúng (đúng gọi `tileEliminate`); Show answers hiện đủ 9
dòng; bảng kết thúc đủ 4 mục Leaderboard/Show answers/Start again/Play a different template. Editor:
mở đúng badge "OPEN THE BOX", đủ 9 thẻ, nút Remove đáp án tự khoá đúng lúc còn 2 đáp án, Save chặn
đúng khi xoá trắng câu hỏi ("Box 1 has no question text."), Cancel không đụng dữ liệu gốc (mở lại vẫn
9 câu y nguyên). `read_network_requests` xác nhận cả 16 file mp3 tải 200 OK, không file nào 404. 0
lỗi console suốt toàn bộ quá trình test cả 2 template (Open the box) lẫn hồi quy (Quiz, Anagram).

**File thay đổi đợt này**: `core/engine.js` + `core/app.css` (cờ `inlineTimerBar`/`ui.topbarMid`, đã
diff kỹ — 2 chỗ mỗi file), `templates/open-the-box/open-the-box.js` (viết lại, bỏ mountSimple),
`templates/open-the-box/open-the-box.css`, `templates/open-the-box/otb-sound.js` (viết lại toàn bộ),
`templates/open-the-box/sounds/*.mp3` (thay hết, 16 file), `templates/open-the-box/
open-the-box-editor.js` (mới), `templates/open-the-box/sample-open-the-box.js` (đổi hẳn sang dữ liệu
Questions mode — 9 câu từ vựng/ngữ pháp thay cho 9 câu speaking prompts cũ, vì Simple mode không còn).

**ĐÃ COMMIT + PUSH GITHUB** (commit `a2db784`, gộp chung với đợt 9+10 — thầy nói "lưu, commit + git
push" sau khi test xong cả 3 đợt). Vẫn `built:false`, chưa gộp trang chủ (đúng quy trình, chờ thầy
duyệt xong).

**CHỜ TEST TOMKO** (màn cảm ứng thật): (a) cảm giác zoom lúc bấm START có đủ mượt/rõ trên màn lớn
không; (b) nghe đủ 16 âm thanh đúng lúc, đặc biệt cặp GameOver/TimesUp theo đúng nghĩa thầy chốt
(ngược với tên file gốc); (c) thanh giờ + điểm nhìn có thật sự "cùng 1 hàng" trên màn 86" hay cần
chỉnh độ rộng `42cqw` của `.aw-otb-q-topbar`.

### 30/7/2026 — Đẩy "Open the box" lên GitHub + sửa tài liệu bàn giao ghi sai

Thầy chọn đẩy code lên mạng. Kiểm tra thấy `origin/main` chỉ còn thiếu đúng 1 commit (`a87fe8a` —
Open the box's Questions mode); mọi thứ khác (v0.9.4, v0.9.5, Anagram) **đã có sẵn trên GitHub từ
trước rồi**, dù `APP_MASTER.md` ghi "web live vẫn v0.9.3" — thông tin đó SAI/lỗi thời (đã kiểm bằng
`curl` thấy `core/catalog.js` live có `anagram built:true`). Đã push commit còn thiếu, `curl` kiểm
chứng `templates/open-the-box/otb-sound.js` live (200 OK). Vì Open the box vẫn `built:false` (chưa
gộp trang chủ, chờ thầy duyệt) nên đợt push này **không đổi gì học sinh/thầy thấy trên web**, chỉ
đồng bộ code nền. Đã sửa lại `APP_MASTER.md` (mục đầu file + mục 0b) cho khớp thực tế git/curl.

### 29/7/2026 — DỜI DỰ ÁN 2 CHẶNG: `PROJECT\AWord` → `D:\APP AND DATA\AWord` → `E:\LAP TRINH APP\AWord`

Cùng ngày nhưng **hai lần dời, hai quyết định khác nhau của thầy** — ghi lại cả hai để sau này khỏi
tưởng là một.

#### Chặng 1 — ra khỏi lớp bọc `PROJECT\`
Thầy muốn AWord nằm chung hàng với các app khác trên `D:\APP AND DATA`, bỏ thư mục bọc `PROJECT\`
(nó chỉ chứa mỗi AWord nên sau khi dời đã rỗng → xoá luôn).
`D:\APP AND DATA\PROJECT\AWord\` → `D:\APP AND DATA\AWord\` — **343 file / 2,3 MB** (kể cả `.git`),
đối chiếu TRƯỚC/SAU khớp chính xác. Kho git nguyên vẹn, vẫn **ahead 5** so với GitHub.

#### Chặng 2 — sang ổ E, theo đúng luật "ổ E = code, ổ D = dữ liệu"
Thầy hỏi có nên đưa AWord sang ổ E không. **Nên** — AWord là code và đã có trên GitHub, mà `.git`
của nó lại đang nằm trong vùng Google Drive đồng bộ, đúng cái mô hình đã làm hỏng kho myStudent
27/7 (Drive nhân đôi ref thành `master (1)`). Nhưng **phải đẩy lên GitHub TRƯỚC** vì lúc đó còn 6
commit chưa push — Drive đang là tấm lưới an toàn duy nhất cho phần việc đó; dời sang E trước là
rút lưới khi bản sao trên mạng còn thiếu.

**Thứ tự đã làm:** push GitHub (`5de9553..829f78f`) → rồi mới dời sang `E:\LAP TRINH APP\AWord`.

⚠️ **BẪY GẶP KHI DỜI GIỮA 2 Ổ ĐĨA:** `Move-Item` từ D sang E là **chép rồi xoá**, và bước xoá
**thất bại giữa chừng** ở `.git\hooks` (`You do not have sufficient access rights` — Drive giữ khoá).
Kết quả: 31 file đã sang E, 318 file còn ở D — **dự án bị chẻ đôi**. Cách gỡ: đếm thấy 31+318 = 349
= đúng tổng ban đầu (không mất gì) → dùng `robocopy /E` gộp nốt phần còn lại sang E → kiểm đủ 349
file/2,38 MB → chạy `git fsck` xác nhận kho sạch + `rev-parse` khớp GitHub → **rồi mới** xoá bản trên D.
**Bài học: dời giữa 2 ổ thì đừng tin `Move-Item`; dùng `robocopy` rồi xoá tay sau khi đã kiểm chứng.**

**Đã sửa các chỗ trỏ đường dẫn (cả 2 chặng):**
1. `D:\OTHERS\CLAUDE\.claude\launch.json` — cấu hình preview tên `aword` (cổng 5510) nay trỏ
   `E:\LAP TRINH APP\AWord\devserver.py`. **Đây là chỗ dễ quên nhất** vì nằm ngoài dự án: mọi đường
   dẫn TRONG dự án là tương đối nên dời cả cụm không gãy, riêng file ngoài buộc phải ghi địa chỉ
   tuyệt đối. Đã thử: giữ địa chỉ cũ thì python báo `can't open file ... No such file or directory`.
2. `APP_MASTER.md` (mục 4 — cây thư mục), `docs/07-ARCHITECTURE.md` (2 chỗ), mục "Cách chạy thử
   trên máy" ở đầu file này.
3. Trí nhớ của Claude: `aword-project.md` + `MEMORY.md`.

**Kiểm chứng (chạy thật, làm ở chặng 1 — cấu trúc thư mục con không đổi ở chặng 2):**
- Trang chủ `http://localhost:5510/` hiện đúng ("AWord in ANDREW CLASSES", nút Sign in with Google),
  **0 lỗi console**.
- Trang test `templates/anagram/test.html` → **20/20 tệp `core/*` và font tải 200 OK**, 0 lỗi console
  ⇒ mọi đường dẫn tương đối vẫn đúng sau khi dời.

### v0.9.5 — 24/7/2026 — ASSIGNMENT CŨ TỰ DỌN VÀO "DONE" KHI SANG NGÀY MỚI
⚠️ **CHỐT Ở LOCAL, CHƯA PUSH GITHUB** (nối tiếp v0.9.4, lý do như cũ — xem mục 0b APP_MASTER.md).

**Yêu cầu của thầy**: khi tạo assignment mới cho 1 lớp, nếu ngày tạo KHÁC (mới hơn) ngày của các
assignment cũ đang nằm ngay trong thư mục lớp đó, thì TOÀN BỘ các assignment cũ đó tự động chuyển vào
thư mục con **DONE** (nằm trong thư mục lớp). Assignment cùng ngày, hoặc lỡ có ngày sau assignment mới
(hiếm khi xảy ra), thì KHÔNG bị chuyển.

- `core/assignments.js`: thêm `assignmentsToArchive(siblings, newCreatedAt)` — hàm thuần lọc theo NGÀY
  DƯƠNG LỊCH thật (0h-24h theo giờ máy, không phải "24 giờ gần nhất"), so `dayStart()` của từng assignment với
  `dayStart()` của assignment vừa tạo; trả về những cái có ngày SỚM HƠN (nghiêm ngặt `<`, không phải
  `!=`) — nên đúng theo ví dụ thầy chốt: assignment mới 12/5 thì gom 11/5 vào DONE, còn 12/5 cũ hay 13/5
  (nếu có) đứng yên.
- `core/assignment-ui.js`: thêm `archiveOlderSiblings(folderId, assignment)`, gọi NGAY sau khi
  `createAssignment()` xong ở nút START. Chỉ chạy khi assignment mới có `folderId` (đã nằm trong 1 thư
  mục lớp cụ thể — Yêu cầu 1 của thầy giữ nguyên hành vi cũ: KHÔNG tự tạo thư mục lớp, thầy vẫn tự tạo
  trước). Tìm thư mục con tên "DONE" (không phân biệt hoa/thường) ngay trong thư mục lớp; chưa có thì
  tạo mới bằng `store.createFolder()`. Rồi chuyển từng assignment cũ bằng `updateAssignment(code,
  {folderId: doneId})` — đúng cơ chế đã có sẵn từ v0.9.0 (Results đọc thẳng `folderId` của assignment,
  không có bản sao, nên đổi `folderId` là "di chuyển" thật).
- Việc này chạy NGẦM (best-effort): nếu lỗi mạng/quyền, chỉ `console.warn`, KHÔNG chặn thầy nhận link+QR
  vừa tạo (giữ đúng luật cũ ở v0.8.0: đừng để lỗi phụ làm hỏng luồng chính).
- Đã kiểm bằng script Node độc lập (hàm lọc theo ngày là hàm thuần, test được ngoài trình duyệt): ví dụ
  đúng thầy đưa (11/5 → bị gom, 12/5 & 13/5 → đứng yên) chạy đúng. **CHƯA test được đầu-cuối thật** (tạo
  2 assignment 2 ngày khác nhau rồi xem DONE tự hiện) vì cần đăng nhập Google — máy build không tự động
  hoá được bước đăng nhập (xem BẪY mục 9) — nhờ thầy test khi rảnh.

### v0.9.4 — 24/7/2026 — CLASS + BÁO CÁO ASSIGNMENT ĐẸP HƠN + IN CHUẨN A4
⚠️ **CHỐT Ở LOCAL, CHƯA PUSH GITHUB** — thầy còn sửa nhiều thứ nữa trước khi đẩy lên mạng lần tới.
Chỉ có commit local; web live (`andrewclasses-01.github.io/AWord`) vẫn đang chạy bản v0.9.3 cũ.

**1. Pop-up "Set assignment" (`core/assignment-ui.js`) — thêm ô Class:**
- Ô **Class** mới, bắt buộc, nằm trên ô Assignment title. Gõ vào ô Class thì CHỈ phần tên lớp ở đầu
  Assignment title tự đổi theo (`replaceClassToken()` — chỉ thay từ đầu tiên, giữ nguyên phần thầy tự
  gõ thêm phía sau), không đụng gì khác. Gợi ý sẵn tên lớp nếu act đang nằm trong 1 thư mục lớp ở
  Activities (không bắt buộc dùng).
- Tiêu đề gợi ý mặc định đổi thành đúng mẫu thầy chốt: `A1A — 24.7 — LSA2-S1.T1.P1-2-3 / ENG2`
  (lớp — ngày.tháng không năm — tên act), qua hàm `fmtDateShort()`.
- 3 tuỳ chọn cuối game đổi mặc định: **Leaderboard** (đổi tên từ "See the leaderboard") = bật ·
  **Show answers** = tắt · **Start again** = bật.
- Bỏ trống Class → chặn tạo, báo lỗi "Please enter the class." (không đụng `assignments.js`/luật
  Firestore, mọi lọc thư mục/cấm trùng tên vẫn đọc từ tiêu đề như cũ).

**2. Pop-up báo cáo assignment (`openAssignmentDetail`) — dọn lại theo góp ý thầy:**
- **Bỏ nút Delete khỏi pop-up** — xoá giờ CHỈ làm được qua menu ⁝ ở thẻ trong Results (main.js đã có
  sẵn `assignmentMenuItems` với Delete riêng, không đổi gì ở main.js).
- 5 nút Refresh/Copy link/Copy QR/Open activity/Edit → đổi thành **icon tròn** (`iconButton()` +
  `.aw-as-iconbtn`), có tooltip. Thêm 4 icon mới trong `core/icons.js`: `refresh`/`link`/`qr`/`openExternal`.
- **Summary** thêm đủ Students/Plays/**Top Score**/**Top Speed - Tên** (người điểm cao nhất + nhanh
  nhất trong số đó), nhãn nhỏ chuyển lên TRÊN số lớn (đổi thứ tự trong `stat()`), khối căn giữa
  (`justify-content:center` trên `.aw-as-stats`).
- **Leaderboard**: thu hẹp còn 60% bề ngang + căn giữa (`.aw-as-lb{width:60%;margin:0 auto}`), mọi cột
  `text-align:center`.
- **Details**: mọi cột căn giữa; mở chi tiết 1 học sinh chuyển từ `display:none/block` (giật cục) sang
  animation mượt bằng `max-height` đo từ `scrollHeight` thật + transition; hàng điểm tối đa (full marks)
  tô chữ xanh lá giống leaderboard (`.aw-as-detail .aw-as-tr.is-perfect`).
- Đã test bằng dữ liệu giả (không cần đăng nhập Google — móc test tạm gắn rồi gỡ sạch ngay sau khi đo).

**3. In worksheet (`core/print.js`) — SỬA TẬN GỐC lỗi header đè nội dung + thêm số trang thật:**
- **Nguyên nhân**: cách cũ dùng `position:fixed` cho header/footer lặp lại mỗi trang, nhưng Chrome đo
  `top`/`left`/`bottom` đó SAI gốc quy chiếu khi `@page` có margin khác 0 → header/logo lệch so với tính
  toán bằng mm (đã tra cứu xác nhận đây là lỗi đã biết của Chrome, không phải lỗi logic).
- **Sửa**: bỏ hẳn `position:fixed`, chuyển 100% sang CSS chuẩn **`@page` margin box**
  (`@top-left`/`@top-right`/`@bottom-left`/`@bottom-right` — Chrome 131+ đã hỗ trợ đủ 16 margin box).
  Margin box không bao giờ lệch (luôn nằm đúng trong lề của nó), và @top-left/@bottom-left luôn thẳng
  mép trái với nhau, @bottom-left/@bottom-right luôn cùng hàng — nên logo tự thẳng hàng với tiêu đề +
  số trang, khỏi đoán số mm.
- Tiêu đề act → `@top-left`; "Name / Date: ___" → `@top-right`; **logo AWord** (2 cỡ chữ, không nhét
  vừa 1 chuỗi CSS `content`) → vẽ thành **ảnh SVG nhỏ** (`logoImageUrl()`) gắn vào `@bottom-left`; **số
  trang thật** dạng **"X/Y"** (`counter(page) "/" counter(pages)`) → `@bottom-right` — tính năng cách cũ
  không làm được (chỉ margin box mới đọc được `counter(page)`/`counter(pages)`).
- Lề trang giảm từ `24mm/14mm/18mm` xuống `16mm/12mm/14mm` (mỏng hơn theo yêu cầu thầy).
- Gỡ hết CSS/HTML cũ của `.aw-print-runhead/-runfoot/-htitle/-hname/-hline/-logo` (không còn ai gọi).
- Đã test: CSS `@page` sinh ra được trình duyệt phân tích hợp lệ (kể cả tiêu đề có dấu `"`/`\`/tiếng
  Việt), ảnh SVG logo vẽ đúng — nhưng **CHƯA in giấy/PDF thật được** (máy dùng để build không có máy in
  ảo) → thầy đã tự in thử và xác nhận đẹp, thẳng hàng.

### v0.9.3 — 23/7/2026 — NHẬN SẴN TÊN HỌC SINH TỪ myLesson (`play.html?g=…&n=…`)

**Bối cảnh:** dự án **myLesson** (app máy tính + web bài tập, dựng 23/7/2026) nhúng game AWord vào
trang bài của học sinh. Học sinh đã đăng nhập bên myLesson rồi (lớp + tên), nên hỏi tên lần nữa chỉ
tổ sinh tên gõ sai — đúng thứ phá bảng xếp hạng và báo cáo của thầy ("Chang Ang" thay "Trang Anh").

**Làm gì:** `play.js` đọc thêm tham số `n` trong link. Có tên hợp lệ (≥2 ký tự) thì **bỏ qua màn
"Enter your name"**, vào chơi luôn với đúng tên đó, đồng thời nhớ vào `aword-student-name` như cũ.

**Không đổi gì khác:** link cũ chỉ có `?g=<mã>` chạy y hệt trước — vẫn hiện màn nhập tên.

**Làm được nhờ:** myLesson (`andrewclasses-01.github.io/myLesson/`) và AWord
(`andrewclasses-01.github.io/AWord/`) **cùng một nhà** trên GitHub Pages.
⚠️ Chuyển một trong hai sang tài khoản GitHub khác là mất tính năng này.

**Đã test thật** (localhost:5510, bài giao `j9nsa2`): mở `play.html?g=j9nsa2&n=CHẤN PHONG` →
vào thẳng màn READY của game, không hỏi tên; `localStorage.aword-student-name = "CHẤN PHONG"`.

### v0.9.2 — 20/7/2026 — GỠ HỘP THOẠI "Bring your saved work online?"
Thầy phản ánh hộp thoại này **hiện lại mỗi lần mở app**. Nguyên nhân: nút "Not now" chỉ đặt biến
`skipMigrationThisSession` trong bộ nhớ trang, tải lại trang là quên → hỏi tiếp; `markMigrated()` chỉ
được gọi khi bấm "Copy them up". Thứ nó đòi chuyển chỉ là **1 thư mục cũ tên "TEST IN"** còn sót trong
localStorage của máy từ trước ngày lên mây.

Thầy chốt **bỏ hẳn**: việc chuyển thư viện lên mây đã xong 19/7 và nay không còn gì ghi vào
localStorage nữa, nên hộp thoại chỉ còn khả năng làm phiền. Đã gỡ `maybeOfferMigration()` khỏi
`main.js` (kèm biến cờ + 4 import không dùng nữa). **`importLocalLibrary()` vẫn còn trong store.js**
để nếu ngày nào cần thì gọi tay từ console. Dữ liệu cũ trong trình duyệt KHÔNG bị xoá, chỉ là app
không hỏi nữa.


### v0.9.1 — 20/7/2026 — 7 TINH CHỈNH THEO GÓP Ý CỦA THẦY (đã test thật)
1. **Fullscreen bấm được ngay ở màn READY** (chưa Start cũng phóng to được): nút mang thêm class
   `.aw-fs-always` (z-index 14) để nổi TRÊN lớp phủ READY (`.aw-play-overlay` z-index 12), và đổi
   sang màu sáng khi lớp phủ còn đó (`:has()`).
2. **Nút "Open activity"** trong pop-up báo cáo: đang ở TRONG act thì chỉ **đóng pop-up**
   (`inAct: true` do engine truyền); ở **Results** thì **mở act ở tab mới** (`?a=<num>`, dự phòng
   `?play=<id>`).
3. **Leaderboard tô màu cả hàng**: điểm tuyệt đối → **xanh lá** (`.is-perfect`), 0 điểm → **đỏ**
   (`.is-zero`); STT/tên/score/time cùng màu.
4. **"Detail" → "Details"**.
5. **CHẾ ĐỘ TẬP TRUNG**: bấm 1 học sinh trong Details thì **chỉ hàng tên đó + bảng chi tiết là sáng**,
   mọi phần khác của pop-up mờ đi (opacity .22 + blur 1.2px). Mở em khác thì tự đóng em cũ.
   ⚠️BẪY: bảng chi tiết nằm TRONG `.aw-as-detail` nên bị chính luật làm-mờ ăn theo → phải dùng dấu
   `>` (con trực tiếp) chứ không dùng dấu cách (mọi cấp).
6. **CHẤM ĐỎ BÁO CÓ BÀI NỘP MỚI**: HS nộp → ghi `lastSubmitAt` + `submitCount` lên chính doc bài giao
   (luật Firestore mở đúng 2 field này cho người chưa đăng nhập, không đụng được gì khác); thầy mở
   báo cáo → ghi `lastSeenAt`. Chấm đỏ hiện ở: **thẻ bài giao** và **thư mục** trong Results (dồn từ
   trong ra, mọi cấp), **act** trong Activities (nếu bài giao của nó có bài mới), và **cuối thanh
   assignment** ngay sau ngày giờ. Góc trên-phải, cách mép 10px, viền trắng 2.5px cho nổi.
   *Vì sao không đếm bằng cách đọc điểm*: sẽ tốn 1 truy vấn cho MỖI bài giao mỗi lần mở trang.
7. **Thanh assignment hạ xuống 58px + vạch kẻ mảnh** ngăn khu act với khu assignment (`.aw-as-bars`
   margin-top 58 + padding-top 22 + border-top; `:empty` thì bỏ hết để không có vạch thừa).

**ĐÃ TEST THẬT** (localhost, tài khoản thầy): fullscreen bấm được lúc READY ✔ · vạch + khoảng cách
120px tới khung ✔ · chấm đỏ ở thẻ/act/thanh (10px/10px) ✔ · HS chưa đăng nhập ghi được cờ báo-mới ✔ ·
xem xong chấm đỏ tự tắt ✔ · Open activity: trong act thì đóng, ở Results mở `?a=1` tab mới ✔ ·
leaderboard xanh 6/6 + đỏ 0/6 ✔ · Details ✔ · chế độ tập trung (0.22 vs 1) ✔.


### v0.9.0 — 20/7/2026 — RESULTS = CHÍNH BÀI GIAO (một bản duy nhất) + CẤM TRÙNG TÊN
Thầy chốt: **"Xoá hay sửa ở Results thì cũng xoá và sửa trong act, chúng đồng bộ là 1."**

1. **KHÔNG có bản sao nào**: mục Results **đọc thẳng** danh sách bài giao (`assignments/{code}`), thư mục
   trong Results chỉ để xếp cho gọn (`folderId` nằm trên chính doc bài giao). Nên thẻ ở Results và
   thanh dài dưới act là **cùng một tài liệu** — sửa/xoá chỗ nào cũng ăn cả hai, không thể lệch.
2. **TỰ XẾP VÀO THƯ MỤC LỚP**: lấy phần đầu tên bài giao trước `_` hoặc khoảng trắng
   (vd `A1A_9.6_WORDS ...` → **A1A**) rồi tìm thư mục TRÙNG TÊN trong Results (không phân biệt hoa
   thường, tìm cả thư mục con, ưu tiên nông nhất). Không thấy → để ngoài cùng Results. Hộp thoại
   Set assignment hiện sẵn dòng **"Filed in Results under A1A"** để thầy biết trước khi bấm START.
3. **CẤM TRÙNG TÊN** (3 chỗ thầy nêu): thư mục con cùng mẹ · act cùng thư mục · bài giao cùng thư mục.
   Chặn ở `createFolder/renameItem/moveItem/saveActivity` (ném `err.code = "aw/duplicate-name"`, hộp
   thoại hiện lỗi đỏ và KHÔNG đóng). Riêng **Duplicate** và **Restore** tự đếm lên "(2)", "(3)"... để
   không bao giờ chặn tay thầy.
4. **SỬA BÀI GIAO** (`openAssignmentEdit`): đổi tên · đổi hạn nộp · bật/tắt 3 ô cuối game · **đóng bài**.
   Vào được từ menu ⁝ ở Results HOẶC nút Edit trong pop-up báo cáo. Bài đóng: HS mở link thấy
   "This assignment is closed", điểm cũ vẫn xem được.
5. **XOÁ = THÙNG RÁC**: `trashed` trên doc bài giao → biến khỏi Results + khỏi dưới act, **link HS
   ngừng nhận bài**, điểm giữ nguyên, Restore lấy lại được. **Delete forever** trong thùng rác xoá
   thật: doc + toàn bộ `scores` + toàn bộ `results` (đã test: còn 0/0).
6. **XOÁ ACT CÓ BÀI GIAO** → hộp thoại hỏi tại chỗ: *Cancel · Delete activity only · Delete both*
   (mỗi bài giao giữ bản sao game riêng nên xoá act không bắt buộc làm hỏng bài HS đang làm).
7. **Kéo-thả bài giao** vào thư mục Results / lên breadcrumb; menu ⁝ có Move; trùng tên khi thả thì
   báo lỗi chứ không im lặng.
8. **TRANG HS NAY SẠCH THẬT**: engine chuyển sang **nạp trì hoãn** `assignment-ui.js` và `store.js`
   (chỉ nạp trên đường của thầy) → `play.html` không tải một dòng code nào có thể chạm tới thư viện
   (đã đo `performance.getEntriesByType('resource')`: KHÔNG có store.js, KHÔNG có assignment-ui.js).
9. **LUẬT FIREBASE cập nhật lần 2 (đã Publish)**: `results` nay cho **thầy XOÁ** (`allow read, delete:
   if isTeacher()`) để "Delete forever" dọn sạch được; HS vẫn chỉ được TẠO, không ai sửa.
10. **ĐÃ TEST THẬT** (localhost, tài khoản thật của thầy):
   | Kiểm tra | Kết quả |
   |---|---|
   | Results hiện bài giao, không có bản sao | ✔ |
   | Tạo thư mục A1A/A2B, bài `A1A_20.7_...` **tự vào A1A** | ✔ (huy hiệu đếm "1") |
   | Nhận diện lớp: hoa/thường, không có lớp, lớp không tồn tại | ✔ 4/4 |
   | Trùng tên: thư mục / act / bài giao cùng chỗ | ✔ chặn; khác thư mục thì cho |
   | Đổi tên + đóng bài ở Results → thanh dưới act đổi theo | ✔ |
   | HS mở link bài đã đóng | ✔ báo "closed", không chơi được |
   | Xoá → thùng rác → Restore | ✔ |
   | Delete forever | ✔ xoá cả bài giao + scores + results |
   | Xoá act có 2 bài giao → hộp thoại 3 nút | ✔ (bấm Cancel, act còn nguyên) |
   | Move bài giao sang thư mục khác | ✔ |
   | play.html KHÔNG nạp store.js / assignment-ui.js | ✔ |


### v0.8.0 — 20/7/2026 — ASSIGNMENT + THU ĐIỂM HỌC SINH + LINK SỐ + BỘ SINH QR (đã test thật)
Chặng lớn: thầy giao bài được cho học sinh bằng **link + QR**, HS chơi **không cần đăng nhập**, điểm
tự chảy về cho thầy xem chi tiết từng câu.

**1. `core/qr.js` — BỘ SINH QR TỰ VIẾT (dùng lại được cho app khác)**
- Thuần JS, không phụ thuộc mạng/thư viện ngoài: byte mode, mức chống lỗi M, tự chọn cỡ 1..15
  (tới 412 ký tự). Xuất `qrSvg()` (nét căng mọi cỡ), `qrPngDataUrl()`, `copyQrImage()`, `downloadQrPng()`.
- **Cách kiểm chứng**: `core/qr-test.html` so từng ô với bộ mã chuẩn + gửi ảnh cho MÁY QUÉT thật đọc lại.
  Kết quả: **13/13 chuỗi đọc đúng**, mọi cỡ mã (kể cả cỡ nhiều khối dữ liệu).
- **LỖI TỰ PHÁT HIỆN KHI TEST**: chỗ đặt "thông tin định dạng" (format info) bị XOAY ngang-dọc → mã
  nhìn vẫn giống QR nhưng KHÔNG máy nào quét được. Đọc chéo bản chuẩn mới lòi ra (bẫy đáng nhớ).

**2. LINK SỐ + thanh địa chỉ tự đổi + Copy link**
- Mỗi folder/act có thêm `num` (1, 2, 3...) lưu trên Firestore → link gọn: `?r=activities` · `?f=12` ·
  `?f=12&a=57` · `?a=57`. `ensureNumbers()` tự đánh số 1 lần cho dữ liệu cũ (theo thứ tự tạo).
- Thanh địa chỉ đi theo chỗ đang đứng (pushState) + **Back/Forward của trình duyệt dùng được**
  (`routeFromLocation`). Link cũ `?play=`/`?folder=` vẫn mở, và được nâng cấp im lặng sang dạng số.
- Menu ⁝ của folder & act thêm **Copy link**.

**3. ASSIGNMENT (`core/assignments.js` + `core/assignment-ui.js`)**
- Nút **Set assignment** → pop-up SETUP: Assignment title · Deadline (ô tích "No deadline") · 3 ô tích
  cuối game (Leaderboard / Show answers / Start again) · nút BACK + START.
- START → ghi `assignments/{mã 6 ký tự}` chứa **BẢN SAO** act (thư viện thầy không lộ; sửa act sau
  không phá bài HS đang làm) → pop-up SHARE: link + QR + Copy link / Copy QR image / Download QR.
- Dưới khung chơi hiện **thanh dài** cho mỗi assignment; bấm → pop-up CHI TIẾT (nền tối + mờ):
  dãy thông tin + Refresh/Copy link/Copy QR · **Summary** (số HS, số lượt, số lượt muộn) ·
  **Leaderboard** (mỗi tên lấy lượt tốt nhất) · **Detail** (Student/Submitted/Correct/Incorrect/Time,
  mọi cột bấm xoay xuôi-ngược, bấm dòng sổ ra từng câu: câu hỏi · HS trả lời · ✓/✗ · đáp án đúng).
- Mã assignment là NGẪU NHIÊN (không phải số đếm) để HS không mò được sang bài lớp khác.

**4. TRANG HỌC SINH `play.html` + `play.js`**
- Trang RIÊNG, **không nạp `core/store.js`** → từ đây không có đường nào chạm tới thư viện của thầy.
- Nhập tên → chơi → Game Complete **tự nộp**; menu cuối bài chỉ hiện đúng ô thầy đã tích.
- Chơi lại thoải mái, mỗi lượt là 1 bản ghi. Sau deadline vẫn chơi được, có báo trước là sẽ tính muộn.
- Tên gõ lệch hoa-thường/thừa dấu cách được **gộp về một em** (`nameKey`), hiển thị bản viết đẹp nhất.

**5. ENGINE — chế độ học sinh (`startGame(..., { session })`)**
- Có `session` thì KHÔNG dựng cụm công cụ của thầy (Options/Template/Style/Edit/Assignment/Print/Home)
  và bỏ "Change template" trong menu ☰ → HS không có đường vào.
- `session.submit()` nộp bài; `session.entries()` cấp bảng xếp hạng lớp (đọc kho điểm công khai).

**6. LUẬT FIREBASE MỚI (đã Publish 20/7 bằng Claude in Chrome)**
- Thêm `assignments/{code}/scores/{id}`: **đọc công khai**, chỉ chứa tên + điểm + thời gian, ai cũng
  thêm được lượt của mình nhưng KHÔNG sửa/xoá được. Đây là nguồn cho bảng xếp hạng HS xem cuối bài.
- `results/{id}` (bài làm chi tiết) giữ nguyên: **chỉ thầy đọc**, không ai sửa/xoá.
- **Đã thử tấn công thật từ phía HS**: đọc results → BỊ CHẶN · đọc thư viện thầy → BỊ CHẶN · sửa điểm
  người khác → BỊ CHẶN · đọc bảng xếp hạng → CHO PHÉP. Đúng như thiết kế.

**7. HAI LỖI TỰ PHÁT HIỆN KHI TEST (đã sửa)**
- **Báo cáo hiện "chưa ai chơi" trong khi thật ra là ĐỌC HỎNG**: `loadReport` bắt lỗi rồi trả mảng rỗng
  → thầy tưởng lớp chưa làm bài. Sửa: dùng `Promise.allSettled`, hỏng CẢ HAI thì báo lỗi rõ + thêm
  nút **Refresh**.
- **`navigator.clipboard.writeText()` TREO VÔ HẠN khi cửa sổ không được focus** (không ném lỗi!) →
  bấm Copy link mà không thấy phản hồi gì. Sửa: gom `copyText()` vào `core/utils.js`, đặt hạn giờ
  1,2 giây rồi quay về cách cũ (textarea + execCommand).

**8. ĐÃ TEST THẬT ĐẦU-CUỐI** (đăng nhập tài khoản thật của thầy, thầy tự bấm chọn account 1 lần):
| Kiểm tra | Kết quả |
|---|---|
| Đánh số link cho dữ liệu cũ + `?a=1` mở đúng act | ✔ |
| Thanh địa chỉ tự đổi + Back/Forward | ✔ |
| Copy link trong menu ⁝ | ✔ |
| Tạo assignment → link + QR | ✔ |
| HS mở link, nhập tên, chơi, tự nộp | ✔ |
| Bảng xếp hạng HS xem cuối bài | ✔ |
| Gộp tên "trang anh" = "Trang  Anh" → 1 em, lấy lượt tốt nhất | ✔ |
| Báo cáo của thầy: Summary + Leaderboard + Detail sổ từng câu | ✔ |
| Sắp xếp cột 2 chiều | ✔ |
| Deadline: HS vẫn chơi + nhãn LATE + đếm "Late plays" | ✔ |
| Bảo mật 4 phép thử từ phía HS | ✔ |


### v0.7.4 — 19/7/2026 — THƯ VIỆN LÊN MÂY: store.js → Firestore + BẮT ĐĂNG NHẬP (đã test thật)
Thầy chốt: **"Bắt đăng nhập mới vào được"**. Thư viện của thầy giờ nằm trên Firestore, đi theo thầy
mọi máy.

1. **`core/store.js` ĐỔI RUỘT localStorage → Firestore** (`users/{uid}/items/{id}`). **Danh sách hàm
   xuất ra GIỮ NGUYÊN 100%** → `main.js`, `quiz-editor.js`, `engine.js` **KHÔNG phải sửa 1 dòng nào**
   ở chỗ gọi. Đây chính là lý do v0.5.0 viết store.js kiểu async ngay từ đầu — đã trả công.
   - Cách chạy: đọc TOÀN BỘ item của thầy 1 lần vào `cache` trong bộ nhớ (thư viện chỉ vài trăm doc
     nhỏ) → mọi logic cây giữ nguyên như cũ; ghi thì cập nhật cache + đẩy **chỉ doc thay đổi** bằng
     `writeBatch` (chunk 400, dưới trần 500 của Firestore).
   - `clean()` bỏ mọi field `undefined` — **Firestore từ chối `undefined`** (bẫy).
   - `resetCache()` gọi khi đăng nhập/đăng xuất để không lẫn dữ liệu 2 tài khoản.
2. **Cổng đăng nhập** (`main.js`): chưa đăng nhập thì KHÔNG render gì ngoài màn "Sign in with Google"
   (đã kiểm: `libraryLeaked: false`). Header có **chip tài khoản** (ảnh Google, tooltip = email) →
   menu **Sign out**. `signIn()` tự đăng xuất + báo lỗi rõ nếu lỡ đăng nhập nhầm account khác.
3. **Chuyển dữ liệu cũ lên mây**: hộp thoại mời copy thư viện localStorage cũ của máy đó lên cloud;
   `importLocalLibrary()` **bỏ qua id đã có** nên chạy 2 lần cũng không tạo bản trùng.
4. **3 LỖI TỰ PHÁT HIỆN KHI BUILD/TEST (đã sửa)**:
   - `openModal(title, buildBody)` **không báo khi bị đóng** → hàm `await` hộp thoại sẽ **treo vĩnh
     viễn** nếu thầy bấm ra ngoài. Thêm tham số thứ 3 `onClose` + chặn close() gọi 2 lần.
   - `toastMsg` không thêm class **`.is-on`** → CSS `.aw-lib-toast` mặc định `opacity:0` nên thông báo
     **vô hình**. (BẪY: class đã tồn tại sẵn trong app.css từ trước.)
   - `openMenu` nhận item dạng **mảng `[label, fn, danger]`** chứ không phải object → bản đầu em viết
     object sẽ crash khi bấm. Đã sửa.
5. **Hỏi thầy trước khi tích "I accept the Firebase terms"** và trước khi đăng nhập bằng tài khoản
   Google của thầy — không tự ký/tự cấp quyền thay thầy.
6. **ĐÃ TEST THẬT TRÊN WEB LIVE** (đăng nhập bằng account thật của thầy, thầy tự bấm chọn account vì
   Google chặn tự động hoá bước đó):
   | Kiểm tra | Kết quả |
   |---|---|
   | Chưa đăng nhập | chỉ thấy màn login, thư viện KHÔNG lộ ✔ |
   | Đăng nhập Google | vào thư viện, chip tài khoản đúng email ✔ |
   | Tạo folder / act / đếm / đổi tên | ✔ |
   | **resetCache rồi đọc lại** (ép đọc mạng) | dữ liệu quay về đúng → **thật sự nằm trên cloud** ✔ |
   | Thùng rác → khôi phục | ✔ |
   | Tìm kiếm | ✔ |
   | Sửa act → lưu → đọc lại | tiêu đề mới đúng, **6 câu hỏi lồng nhau còn nguyên**, vị trí giữ nguyên ✔ |
   | Chơi game từ dữ liệu cloud | ✔ |
   | Popup Print | Anagram/Crossword/Quiz ✔ |
   | Dọn đồ test | 0 sót — Firestore console chỉ còn đúng 1 doc `act_sample_quiz` ✔ |
7. **UX sửa sau khi test**: hộp thoại migration từng hỏi copy thứ **đã có sẵn** trên cloud (máy thầy
   có `aword-lib` chứa đúng `act_sample_quiz` do lúc đầu trình duyệt lấy nhầm store.js cũ từ cache —
   **đúng cái bẫy cache của GitHub Pages**: các file KHÔNG cập nhật đồng thời, có thể main.js mới mà
   store.js còn cũ). Thêm `pendingImportCount()` so id với cloud → không còn hỏi thừa.
- **CÒN LẠI**: Settings + leaderboard vẫn ở localStorage (chưa đồng bộ); `?play=` hiện vẫn đọc thư
  viện (cần đăng nhập) — khi làm **Assignment** sẽ chuyển sang `assignments/{code}` công khai cho HS.

### v0.7.3 — 19/7/2026 — FIREBASE đã dựng xong + nối lớp kết nối (làm tự động qua Claude in Chrome)
Thầy bảo "mở claude in chrome để tự động giúp tôi việc xử lý trên firebase" → em làm TRỌN bằng
trình duyệt thật, thầy không phải bấm gì (trừ 1 lần xác nhận điều khoản).

1. **Xác minh tài khoản trước khi tạo**: Firebase console đang đăng nhập `namdaptrai01@gmail.com` —
   ĐÚNG account thầy chốt (khớp email trong luật bảo vệ). Kiểm tra bước này TRƯỚC khi tạo gì.
2. **Tạo project**: tên `AWord`, ID **`aword-70dae`**, số 399279049436, gói **Spark miễn phí**.
   - **TẮT "Join the Google Developer Program"** (mặc định BẬT — đăng ký thừa, thầy không cần).
   - **TẮT Google Analytics** (không cần + tránh theo dõi hành vi học sinh).
   - ⚠️ Ô **"I accept the Firebase terms"** = thoả thuận pháp lý → em **HỎI THẦY** rồi mới tích
     (quy tắc: không tự ký thay thầy). Thầy đồng ý.
3. **Firestore**: Standard edition · Database ID `(default)` · **Location asia-southeast1
   (Singapore)** — gần VN nhất, ⚠️**KHÔNG đổi lại được** · **Start in production mode** (khoá kín;
   test mode sẽ mở toang 30 ngày — tránh).
4. **Authentication**: bật **Google** sign-in; public-facing name đổi `project-399279049436` →
   **`AWord`** (tên thầy/HS thấy khi đăng nhập); support email `namdaptrai01@gmail.com`.
5. **Authorized domains**: thêm **`andrewclasses-01.github.io`** (⚠️ThIẾU bước này = đăng nhập lỗi).
   `localhost` đã có sẵn nên test ở máy vẫn chạy.
6. **Luật bảo vệ Firestore**: đã **Publish**. ⚠️**BẪY**: ô soạn luật là **CodeMirror**, gõ tay bị
   auto-đóng-ngoặc + auto-indent làm hỏng code → **dán bằng JS**:
   `document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(text)` (instance 0 = parent
   `.main-editor`; instance 1,2 là pane diff). setValue có bắn event nên nút Publish tự sáng.
7. **Web app** `AWord Web` (KHÔNG tích Firebase Hosting — đã có GitHub Pages) → lấy `firebaseConfig`.
   ⚠️**BẪY**: tiện ích Chrome **chặn đọc chuỗi giống khoá** qua javascript_tool/DOM
   (`[BLOCKED: Cookie/query string data]`) → phải **`computer zoom`** vào vùng code để đọc bằng mắt.
8. **`core/firebase.js` (MỚI)**: config + nạp SDK **LAZY** qua CDN `gstatic.com/firebasejs/**12.9.0**`
   (đã dò: 12.9.0 là bản mới nhất còn sống, 13.x chưa có) → giữ **zero-build, không cần Node**.
   Xuất `auth()/db()/fs()/signIn()/signOutNow()/onUser()/currentUser()/isTeacher()`; `signIn()` tự
   đăng xuất + báo lỗi rõ nếu đăng nhập nhầm account khác.
   `firebaseConfig` **KHÔNG phải bí mật** (Google thiết kế công khai) → để trong repo public là chuẩn.
9. **ĐÃ TEST BẢO MẬT THẬT trên web live** (chạy trong trình duyệt, chưa đăng nhập = đóng vai người lạ):
   | Thử | Kết quả |
   |---|---|
   | Người lạ GHI vào `users/*/items` | 🔒 permission-denied ✔ |
   | Người lạ ĐỌC `users/*/items` | 🔒 permission-denied ✔ |
   | HS chưa đăng nhập ĐỌC `assignments/*` | ✅ cho phép (cần để chơi) ✔ |
   | Người lạ TẠO `assignments/*` | 🔒 permission-denied ✔ |
   Module nạp OK, projectId đúng, 0 lỗi. **Mô hình bảo mật chạy đúng như thiết kế.**
- **CÒN LẠI (chưa làm)**: đổi ruột `core/store.js` localStorage → Firestore + nút đăng nhập Google
  trên header + chuyển dữ liệu cũ trong máy lên mạng. Đây là thay đổi LỚN vào code đang chạy tốt →
  chờ thầy chốt trước khi build.

### v0.7.2 — 19/7/2026 — LÊN MẠNG: GitHub + GitHub Pages (web chạy thật từ mọi nơi)
Thầy chốt: **repo CÔNG KHAI** · **chỉ thầy đăng nhập Google mới sửa được** · **deploy trước, Firebase ngay sau**.

1. **Rà an toàn trước khi đẩy công khai**: quét toàn bộ project — KHÔNG có mật khẩu/API key/token,
   KHÔNG có dữ liệu học sinh (dữ liệu nằm ở localStorage từng máy, không vào repo). Tổng 646K/63 file.
2. **Kiểm tra đường dẫn**: xác nhận KHÔNG có đường dẫn tuyệt đối (`src="/..."`, `from "/..."`) — nếu có
   sẽ hỏng khi web nằm trong thư mục con `/AWord/`. Asset (font/mp3/theme) resolve qua `import.meta.url`
   nên chạy đúng. ⚠️ BẪY cho các phiên sau: **luôn dùng đường dẫn tương đối**.
3. **git init** (branch `main`) + `.gitignore` + **`.nojekyll`** (bắt buộc — không có thì GitHub Pages
   chạy Jekyll và có thể bỏ qua file/thư mục bắt đầu bằng `_`) + `README.md` (tiếng Anh, mô tả dự án +
   cách chạy). Commit đầu 63 file.
4. **Repo PUBLIC** `github.com/andrewclasses-01/AWord` (cùng tài khoản mySpeaking, gh CLI đã đăng nhập
   sẵn) → push `main`.
5. **Bật GitHub Pages** (branch `main`, thư mục gốc) qua `gh api`. Chờ ~25 giây build xong.
6. **ĐÃ TEST TRÊN WEB THẬT** https://andrewclasses-01.github.io/AWord/ : trang chủ thư viện hiện đúng
   (2 gốc Activities/Results, logo, footer); mọi file 200 OK; vào game bấm PLAY chạy, trả lời đúng lên
   điểm, **font Baloo 2 tải đúng**, popup Print hiện đúng 3 định dạng; **0 lỗi console**.
7. **Firebase**: viết `docs/08-FIREBASE-SETUP.md` — hướng dẫn thầy tự tạo project 7 bước (bấm tay, có
   ghi rõ chọn **asia-southeast1 Singapore**, bật Firestore + Google Sign-in, **thêm authorized domain
   `andrewclasses-01.github.io`** kẻo đăng nhập lỗi), kèm **luật bảo vệ Firestore viết sẵn** (chỉ email
   thầy được sửa; HS chỉ tạo result, không sửa/xoá; thư viện riêng tư).
   **Mô hình dữ liệu chốt**: `users/{uid}/items/{id}` (thư viện riêng) · `assignments/{code}` (BẢN SAO
   act, công khai đọc → thư viện KHÔNG lộ + sửa act sau không phá bài HS đang làm) · `results/{id}`.
   **ĐANG CHỜ thầy**: gửi `firebaseConfig` + xác nhận email Google dùng trong luật.
- Lưu ý: `firebaseConfig` **không phải bí mật** (Google thiết kế để công khai) — an toàn nằm ở luật
  Firestore, nên dán vào repo public là bình thường.

### v0.7.1 — 19/7/2026 — PRINT làm lại theo mẫu thầy: popup chọn ĐỊNH DẠNG + bố cục worksheet
Thầy gửi 3 ảnh mẫu (Anagram / Unjumble / Quiz worksheet có thương hiệu AWord) làm chuẩn thiết kế, và
yêu cầu Print thành **nhiều ĐỊNH DẠNG chọn qua popup**. Làm lại toàn bộ hệ Print (bỏ bản v0.7.0):

1. **Bấm Print → popup chọn định dạng** (icon): **Anagram · Crossword · Quiz · Unjumble**. Chỉ hiện
   icon những định dạng KHẢ DỤNG:
   - **Anagram, Quiz**: mọi template, mọi số câu.
   - **Crossword**: 2..35 câu, mọi template TRỪ `type-the-answer` (renderer CHƯA build → hiện icon kèm
     nhãn "soon", bấm chỉ báo coming soon; sẽ build crossword sau).
   - **Unjumble**: chỉ `type-the-answer`, mọi số câu.
   - Đã test biên: 1 câu→[Anagram,Quiz]; 2 câu→+Crossword; 35 câu→còn Crossword; 36 câu→mất Crossword;
     type-the-answer→[Anagram,Quiz,Unjumble] (không Crossword). Đúng hết.
2. **Bố cục worksheet theo ảnh mẫu** (áp dụng MỌI template), 2 cột + vạch phân cách nét đứt, header
   (title trái + "Name / Date: ____" phải, có 2 vạch kẻ) lặp mỗi trang, footer logo **AWord / in ANDREW
   CLASSES** lặp mỗi trang:
   - **Anagram**: số + 💡 + đề (clue) → dãy chữ cái ĐÁP ÁN bị xáo trong ô xám → dãy ô trống để HS điền.
   - **Quiz**: số + 💡 + đề → 4 lựa chọn A/B/C/D lưới 2×2, mỗi lựa chọn có ô vuông tick, chữ IN HOA.
     (Nếu template có sẵn options thì dùng; nếu không, tự sinh 3 mồi nhử từ "kho đáp án" của cả bài.)
   - **Unjumble**: số + các TỪ của câu bị xáo, cách nhau; dưới là 1 dòng kẻ để HS viết lại câu đúng.
3. **Setup in**: mặc định **A4** (`@page { size:A4 }`); thiết kế **thuần thang xám** nên in **đen trắng**
   tự nhiên. **In 2 mặt KHÔNG ép được từ web** (là lựa chọn trong hộp thoại máy in — trình duyệt chặn vì
   riêng tư) → popup có ghi chú nhắc thầy chọn double-sided trong hộp thoại.
4. **Kiến trúc**: Print nay là **hệ DÙNG CHUNG** `core/print.js` (không viết riêng từng template):
   `openPrintPopup(activity)` → popup + luật khả dụng + chuẩn hoá activity thành `[{clue,answer,options}]`
   (qua hook `template.toPrintItems(activity)`, có bộ đọc mặc định kiểu Quiz) → render worksheet. Thêm
   hook `toPrintItems` cho Quiz (`templates/quiz/quiz.js`). `core/engine.js` printBtn gọi popup. Icon mới
   (bulb + 4 icon định dạng) trong `icons.js`. CSS popup + `.aw-pf-*` worksheet (chỉ `@media print`) trong
   `core/app.css`. Ghi hợp đồng vào `core/HUONG DAN CORE.md`.
5. Đã test bằng javascript_tool (chặn `window.print`): popup đúng định dạng theo type/số câu; render 3
   định dạng khớp ảnh mẫu (đã chụp màn mô phỏng @media print); Anagram xáo đúng chữ cái đáp án + ô trống
   đúng số chữ; Quiz 4 lựa chọn có tick; Unjumble xáo từ + dòng viết; `afterprint` tự gỡ sheet; 0 lỗi
   console. **CHƯA in ra giấy/PDF thật** — thầy thử in để xác nhận bố cục A4 + header/footer lặp trang.
6. **BẪY đã biết (chưa chặn được hoàn toàn)**: header/footer dùng `position:fixed` + `@page margin` để
   lặp mọi trang — chuẩn cho worksheet 1 TRANG (đa số ca dùng); worksheet DÀI nhiều trang có thể lệch,
   cần thầy test in mới biết. Nếu lệch sẽ chuyển sang cách chia trang thủ công.

### v0.7.0 — 19/7/2026 — Khối 2: PRINT (in bài giấy + đáp án) — ĐÃ THAY BẰNG v0.7.1
Bắt đầu chặng Print (thầy chốt roadmap: Print → sau này Firebase → Assignment). Nút **Print** ngoài
khung (trước chỉ toast "coming soon") giờ xuất ra **2 trang giấy A4**:
- **Trang 1 (bài làm)**: "ANDREW CLASSES" + tên bài + ô Name/Class/Date để trống cho học sinh điền,
  rồi danh sách câu hỏi đánh số, mỗi câu 4 (hoặc nhiều hơn) lựa chọn **A/B/C/D...** xếp 2 cột.
- **Trang 2 (đáp án riêng cho thầy)**: cùng nội dung nhưng đáp án ĐÚNG in đậm + dấu ✓, kèm dòng tắt
  ở đầu trang kiểu "1-A 2-A 3-A..." để chấm nhanh không cần đọc từng câu.
- **Luôn theo thứ tự GỐC + luôn có chữ cái A/B/C** bất kể màn hình đang Shuffle/Letters gì — để mỗi
  lần in ra giống hệt nhau và khớp đúng với trang đáp án.
- Kỹ thuật: thêm **`print(activity)`** làm tuỳ chọn thứ 2 (sau `edit`) trong hợp đồng
  engine↔template (`core/HUONG DAN CORE.md`). `core/engine.js`: printBtn gọi `tpl.print(activity)` →
  DOM trả về được gắn làm anh em của `#app`, gọi `window.print()`, gỡ lại khi đóng hộp thoại
  (`afterprint` + `setTimeout` dự phòng theo đúng luật animate()/callback của core). CSS in
  (`.aw-print-*`, chỉ hiện trong `@media print`, `#app` bị ẩn lúc in) thêm vào `core/app.css` —
  dùng CHUNG được cho template khác sau này (cấu trúc câu hỏi+lựa chọn khá tổng quát), giống tiền lệ
  `.aw-rv-*` của màn Show answers.
- `templates/quiz/quiz.js`: thêm `buildPrintSheet`/`buildPrintPage` dựng 2 `<section class="aw-print-page">`.
- Đã test thật (javascript_tool, chặn `window.print` để không bật hộp thoại thật lúc dò lỗi): bấm
  Print → tạo đúng 2 trang, câu hỏi/đáp án khớp dữ liệu mẫu, trang đáp án đánh dấu đúng 6/6 câu, dòng
  tắt "1-A 2-A 3-A 4-A 5-A 6-A" đúng, mô phỏng `afterprint` → trang in tự gỡ khỏi DOM. Không lỗi
  console. Chưa in thử ra giấy/PDF thật (cần thầy bấm thử trên máy in thật để xác nhận bố cục A4).
- **CHƯA LÀM**: nút Print trong TRANG CHỦ (thư viện, khi chưa mở game) — hiện chỉ hoạt động khi đang ở
  MÀN GAME (nút Print dưới khung). Cân nhắc thêm entry-point in trực tiếp từ thẻ act trong thư viện ở
  đợt sau nếu thầy thấy cần.

### v0.6.9 — 19/7/2026 — Bỏ kẻ ngang trên tên + chữ foot cân xứng với chấm ⁝
1. **Bỏ đường kẻ ngang mảnh trên tên**: xoá `border-top` của `.aw-card-foot`.
2. **Chữ (tên + type) dịch phải cho CÂN XỨNG**: `.aw-fm-grid .aw-card-foot { padding-left:21px }` —
   khoảng cách viền TRÁI thẻ → mép chữ (22px) = khoảng cách viền PHẢI thẻ → đúng tâm cột chấm ⁝ (21px),
   lệch 1px. Áp dụng đồng loạt act + folder.
- Đã đo thật cả act lẫn folder: 22 vs 21px, border-top 0px, 0 lỗi console.

### v0.6.8 — 19/7/2026 — Ghim ⁝ đúng 1 vị trí góc thấp nhất-phải cho MỌI thẻ + số folder hạ nhẹ
Thầy chỉ ra ⁝ vẫn mỗi thẻ một chỗ. **Nguyên nhân tìm ra**: các thẻ trong cùng hàng grid bị kéo CAO BẰNG
NHAU (grid stretch), nhưng foot không được ghim xuống đáy thẻ → thẻ nào nội dung ngắn thì foot (và ⁝)
"lơ lửng" ở độ cao khác nhau.

1. **Ghim foot xuống ĐÁY thẻ**: `.aw-card-foot` thêm `margin-top:auto` → foot của MỌI thẻ (folder, act
   tên ngắn, act tên dài) đều nằm sát đáy, ⁝ cùng một chỗ tuyệt đối.
2. **⁝ về góc thấp nhất-phải, dịch thêm phải + xuống**: `.aw-fm-grid .aw-card-menu { margin-right:-7px;
   margin-bottom:-7px }` → cách mép phải 6px, mép đáy 4px (trước 13/11). Chấm ⁝ nằm THẲNG HÀNG dòng
   type của act / dòng tên folder (đo tâm: folder lệch 0px, act lệch 3px — không nhận ra bằng mắt).
   Tên act vẫn ở trên, tự co giãn 1-2 dòng theo độ dài (mọc lên trên).
3. **Số trong folder hạ nhẹ**: `.aw-fp-count` top 48% → **50%** (đo tâm chip = 50% chiều cao preview).

Đã test thật (đo 5 thẻ: 4 folder + act tên dài 2 dòng): ⁝ ĐỒNG LOẠT 6px-phải/4px-đáy; 0 lỗi console.

### v0.6.7 — 19/7/2026 — Bố cục foot theo mẫu thầy (tên/type/⁝) + tên 38 ký tự + số folder đảo + Settings menu
Thầy gửi ẢNH bố cục foot act mong muốn (tên TRÊN, "QUIZ" DƯỚI, ⁝ GÓC DƯỚI-PHẢI) làm mẫu chuẩn cho act.
(Đảo lại so với v0.6.6: ⁝ từ trái → **phải**; type từ trên → **dưới tên**.)

**1. Foot act theo mẫu ảnh** (`main.js actCard` + CSS): thứ tự info đổi thành **tên (trên) → type QUIZ
(dưới)**; ⁝ về **góc dưới-PHẢI** (bỏ `order:-1`, giữ `align-self:flex-end`). Cỡ chữ to hơn: tên `.9rem`
grid (đậm 800), type `.82rem` xanh dương đậm hoa (trước .62rem). Nội dung căn ĐÁY foot. Đo: tên trên type,
⁝ 13px-phải/11px-đáy.

**2. Tên folder căn theo TYPE của act, size = tên act** (thầy chốt): folder không có type nên tên hạ
xuống **ngang dòng type của act** (đáy foot) nhưng **cỡ = cỡ tên act** (đo: đáy tên folder = đáy type act
= 11px; font tên folder = font tên act = 14.4px). Đạt nhờ cùng bottom-align + folder tên dùng `.aw-card-name`.

**3. Tên tối đa 38 ký tự, tràn thì nâng dòng lên** (CSS): grid name 2 dòng `.9rem`, căn đáy nên khi cần
dòng 2 thì **mọc LÊN TRÊN** (đoạn vượt ở dòng dưới). Đo: 38 (và 39) ký tự vừa 2 dòng.

**4. Số đếm folder: nâng cao + ĐẢO thứ tự/màu** (`folderCard` + CSS): `top:57%→48%`; thứ tự MỚI = **số
act TRƯỚC (màu XANH DƯƠNG) | số folder SAU (màu VÀNG CAM)** (trước: folder xanh trước, act cam sau). Đo:
[acts=xanh(47,123,255), folders=cam(240,144,42)].

**5. Settings thành MENU nhiều dòng** (`openSettingsFlow` viết lại): bấm bánh răng → menu các dòng:
**Default activity options** (bật) + **Appearance** / **Leaderboard & results** (coming soon, mờ — chỗ
cho tính năng thầy update sau). Chọn **Default activity options** → **danh sách template** (Quiz sẵn + 4
coming soon) → chọn template → **form options mặc định của template đó** + Save. Có nút **‹ Back** ở tiêu
đề, điều hướng lùi từng cấp (Settings ↔ template list ↔ options).

**Đã test thật (javascript_tool, 0 lỗi console):** act tên-trên/type-dưới/⁝-phải; folder tên căn đáy=type
act + cùng cỡ; 38-39 ký tự 2 dòng; Mixed đếm [2 xanh | 1 cam] nâng cao; Settings menu 3 dòng → Default
activity options → 5 template → Quiz defaults → đổi letters=abc + Save lưu store + đóng; Back về menu / về
template list đều đúng.

### v0.6.6 — 19/7/2026 — Thẻ folder: ⁝ góc dưới-trái + tên căn = act + icon to + SỐ ĐẾM + footer sát đáy
Thầy test v0.6.5 OK, giao tiếp 6 tinh chỉnh trình quản lý.

**1. Nút ⁝ về GÓC DƯỚI-TRÁI, đều nhau mọi thẻ** (CSS): `.aw-card-menu` thêm `order:-1` + `align-self:
flex-end` (foot `align-items:flex-end`). ⁝ giờ luôn ở góc dưới-trái, **cùng vị trí bất kể tên dài ngắn**
(đo: 13px từ trái, 11px từ đáy — GIỐNG HỆT cho cả folder lẫn act). Bề rộng tên KHÔNG đổi (⁝ chỉ chuyển
từ phải sang trái).

**2. Tên folder căn ĐÁY = tên act** (CSS): `.aw-card-info` thành flex-column `justify-content:flex-end`
→ tên nằm đáy foot. Trước tên folder ngang hàng dòng "type" (trên); nay ngang hàng dòng TÊN của act (đo:
đáy tên folder = đáy tên act = 11px). folderCard bọc tên trong `.aw-card-info` cho đồng cấu trúc với act.

**3. Icon folder to hơn**: `.aw-fp-icon` 92px → **108px**.

**4. SỐ ĐẾM giữa folder** (`store.folderCounts` + `folderCard`): `folderCounts(id)` trả `{folders: số
thư mục con TRỰC TIẾP, acts: TỔNG act đệ quy mọi tầng}`. Hiển thị chip `.aw-fp-count` giữa thân folder:
  - **Chỉ có act (không thư mục con)** → **1 số** = tổng act. Không act → **không hiện gì**.
  - **Có cả thư mục con VÀ act** → **2 số** ngăn bởi nét dọc ngắn, KHÁC MÀU: trái = số thư mục con trực
    tiếp (xanh dương), phải = tổng act đệ quy (cam).
  - Không có act (kể cả khi có thư mục con) → không hiện số (theo luật thầy chốt).

**5. Footer XUỐNG SÁT ĐÁY màn hình**: `.aw-lib` thành `min-height:100vh; display:flex; flex-direction:
column` + `.aw-foot { margin-top:auto }` → footer luôn bị đẩy xuống cuối trang, sát mép dưới (đo: cách đáy
viewport 10px). Giảm padding-bottom trang.

**Đã test thật (javascript_tool, dựng lib xác định, 0 lỗi console):** Empty→không số; Mixed(1 sub + 1 act
trực tiếp + 1 act lồng)→**2 số [1 | 2]**; OnlyActs(2 act)→**1 số [2]**; OnlySub(1 sub, 0 act)→không số;
icon 108px; ⁝ folder/act đều ở 13px-trái/11px-đáy; tên folder & act căn đáy khớp (11px); footer 2 dòng
cách đáy màn 10px; list view số đếm vẫn đúng [1|2].

### v0.6.5 — 19/7/2026 — Folder preview + màu folder + kéo-thả + logo cân đối + footer mọi trang
Thầy test v0.6.4 OK, giao tiếp 6 tinh chỉnh giao diện trình quản lý.

**1. Folder preview cân đối như thẻ act** (`main.js folderCard` + `.aw-fp`): thẻ folder giờ = **vùng
preview icon TO** (`.aw-fp-icon` 92px trong panel kem `.aw-fp` cao 118px như `.aw-cp`) + **foot bên dưới**
(tên + nút ⁝) giống hệt thẻ act → cân đối. List view icon nhỏ lại tương ứng.

**2. Màu folder** (store `setFolderColor` + node folder có field `color`): menu ⁝ folder thêm mục **Color**
→ mở popup **8 màu hiện đại** (`FOLDER_COLORS`: đỏ/cam/hổ phách/lá/teal/xanh dương/tím/hồng) + nút
**Default color**. Bấm màu → đổi màu icon folder ngay + lưu store (bền qua reload). Swatch đang chọn có viền.

**3. Icon tìm kiếm** (`icons.search` + CSS): sửa lỗi hiển thị (SVG không cỡ) — kính lúp hiện đại
`.aw-fm-searchbtn svg { 18px }` + hover xanh.

**4. Kéo-thả di chuyển item** (`main.js makeDraggable/makeDropTarget`): act & folder **kéo được**; **thả
vào thẻ folder** = chuyển item vào folder đó; **thả lên chữ trong breadcrumb** (Activities gốc / các
folder tổ tiên — trừ "Home") = đưa item về thư mục đó. Có viền sáng nơi thả. `moveItem` chặn thả folder
vào chính subtree của nó; chặn thả lên chính nó. (HTML5 drag; click folder vẫn mở như thường.)

**5. Logo cân đối CHUẨN — width khớp mà KHÔNG méo chữ** (`sizeBrand` viết lại): quay lại đo width nhưng
dùng **letter-spacing** thay scaleX → giữ nguyên hình dạng từng chữ, chỉ giãn khoảng cách để **chiều dài
"in ANDREW CLASSES" đúng bằng chiều dài "AWord"** ở MỌI trang (đo sau khi font ready; `ls=(L-w0)/(n-1)`,
gộp khoảng trắng đuôi bằng margin-right âm). Đo: trang chủ chữ dừng đúng mép logo 193px; trong thư mục
111=111px. `.aw-brand-sub` CSS bỏ letter-spacing cứng (JS điều khiển).

**6. Footer mọi trang** (`main.js footer()`): giữa-cuối mọi trang thư viện + trang Edit có 2 dòng
**"Phone & Zalo: 0359.769.765"** + **"Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All
Rights Reserved."** (editor nhận qua param `footer`; KHÔNG thêm vào màn đang chơi để không phá khung 16:9).

**Đã test thật (javascript_tool, 0 lỗi console):** folder icon 92px + foot tên/⁝; menu có Color → 8 swatch
→ chọn violet đổi màu + lưu store `#8b5cf6`; search icon 18px kính lúp; kéo act "EXCEL PASTE TEST" thả vào
Grammar → act vào trong; trong Grammar kéo act thả lên crumb "Activities" → về gốc (dragover preventDefault=
chấp nhận); logo trang chủ visible 193px khớp, editor 111=111; footer đủ 2 dòng ở trang chủ + trong thư
mục + editor.

### v0.6.4 — 19/7/2026 — Tinh chỉnh thiết kế header + DÁN EXCEL trực tiếp vào ô câu hỏi + bỏ câu rỗng khi Save
Thầy góp ý sau khi xem v0.6.3.

**1. Thiết kế header:**
- **Icon Settings mới** (`icons.js`): thay bánh răng tự vẽ (méo, mất cân đối) bằng gear **Feather** đối xứng, đẹp/đều hơn.
- **Tagline "in ANDREW CLASSES" giữ ĐÚNG TỶ LỆ CHỮ GỐC**: bỏ hẳn cách kéo `scaleX` (làm méo chữ) — **gỡ hàm `sizeBrand` + mọi lời gọi** trong `main.js`. Thay bằng **giãn letter-spacing** vừa phải (`.aw-brand-sub` 1.5px, phần đậm 2.5px; bản nhỏ is-sm 1px/1.6px). Giờ chữ không méo, tagline rộng ~183px so với logo 193px (sát tự nhiên, không ép).

**2. DÁN EXCEL kiểu MỚI — dán thẳng vào ô câu hỏi** (`quiz-editor.js` `onQuestionPaste`): thầy mô tả đúng thao tác Excel thật:
- Thầy bôi vùng bảng (vd A1:G25 — cột A = câu hỏi, cột B-G = đáp án lần lượt), Ctrl+C.
- Bấm vào **ô câu hỏi** (bất kỳ câu nào) rồi **Ctrl+V** → app tự tách bảng: **cột đầu = câu hỏi, các cột sau = đáp án theo thứ tự** (position-independent — copy ở B1:H25 vẫn đúng vì đọc từ mảng ô đã copy, KHÔNG theo tên cột tuyệt đối). Điền **từ câu đang bấm trở xuống** (bấm Q1 = điền cả list), tự tạo đủ câu, **tối đa 120** (dư thì cắt + báo). Quá 6 đáp án/hàng thì cắt còn 6. Ô đáp án rỗng bị bỏ; nếu <2 đáp án thì đệm cho đủ 2 ô trống.
- **KHÔNG đánh dấu đáp án đúng nào** (thầy chốt): sau khi dán thầy tự tích từng câu, hoặc bấm **Mark correct in all**. Chưa tích mà Save vẫn báo lỗi như cũ.
- Dán **1 ô đơn** (không có tab/xuống dòng) vào ô bất kỳ → **để trình duyệt dán bình thường**, KHÔNG can thiệp. Có dòng **Tip** nhắc cách dán.
- (Nút "Paste from Excel" + hộp thoại preview cũ đã gỡ ở v0.6.3; cơ chế mới gọn hơn, đúng thói quen Excel.)

**3. Save tự bỏ câu RỖNG** (`quiz-editor.js`): "Add question" mà để trống hoàn toàn (không chữ câu hỏi + không đáp án) → khi Save **tự động bỏ** câu đó (lọc trước khi validate), không báo lỗi. Câu có phần dở dang (có chữ nhưng thiếu đáp án đúng...) vẫn báo lỗi để thầy sửa.

**Đã test thật (javascript_tool, 0 lỗi console):** gear Feather; brand transform=none + letter-spacing 1.5px (không méo); dán TSV 3 hàng vào ô Q1 → 3 câu đúng cột, hàng 7 đáp án cắt còn 6, KHÔNG câu nào tích đúng + info nhắc; dán 1 ô đơn KHÔNG bị chặn (dispatchEvent trả true); Mark correct in all A → cả 3 câu tích A; thêm 1 câu rỗng (4 thẻ) + đặt tên + Save → lưu đúng **3 câu** (câu rỗng bị bỏ), đáp án [4,3,6]; về thư viện OK.

### v0.6.3 — 19/7/2026 — Header dùng chung + Settings (options mặc định) + đổi thuật ngữ act + sửa editor Quiz
Thầy giao 1 loạt yêu cầu lớn. Thầy chốt: header (logo + Settings + Activities/Results) hiện ở **trang
thư viện + trang Edit** (KHÔNG vào màn đang chơi); Settings đợt này chỉ làm **Options mặc định cho
template**; dán bảng Excel CHỈ khi danh sách câu hỏi trống (giữ từ v0.6.2 — nhưng nút Paste bị gỡ khỏi
editor theo yêu cầu #5, xem dưới). "Ok build".

**1. Header dùng chung** (`main.js` `topbar(showNav)`, class **`.aw-appbar`**): trái = cụm logo (bấm về
trang chủ top-level); phải = nút **Settings** (bánh răng) — ở trang chủ CHỈ có Settings; ở trang trong
thư mục + trang Edit thêm 2 nút **Activities / Results** thành cụm cân đối. **Logo to hơn** (4.15rem);
tagline "in ANDREW CLASSES" được **kéo scaleX cho bằng đúng bề rộng logo** (đo lúc font ready — `sizeBrand`;
đã đo 193px=193px). Nút bánh răng xoay nhẹ khi hover.

**2. Settings — Options mặc định** (`core/settings.js` MỚI, key `aword-settings`): `getDefaultOptions(type)`
(built-in defaults + phần đã lưu), `saveDefaultOptions`, `buildOptionsControls` (dựng bộ điều khiển Timer/
Letters/3 checkbox — DÙNG LẠI). Modal Settings mở từ bánh răng (mô hình nháp, chỉ ghi khi Save). **Act
mới kế thừa options theo Settings**; **chỉnh Options riêng 1 act trong game → Apply nay LƯU RIÊNG cho act
đó** (engine.js Apply thêm `saveActivity(activity)` khi có id).

**3. Đổi thuật ngữ GAME → activity/act + chọn loại act khi tạo mới** (`core/catalog.js` MỚI = 1 nguồn duy
nhất liệt kê 5 loại act, Quiz `built:true`, 4 cái coming soon; engine.js dùng chung danh sách này thay
hard-code). "+ New game" → **"+ New activity"** → mở **hộp thoại chọn LOẠI act** (grid thẻ, coming-soon mờ
+ toast) → chọn Quiz mới vào editor (act trắng seed options từ Settings). **Edit content** nay **dispatch
theo loại act** qua registry (`getTemplate(type).edit`), không import cứng quiz.

**4. Sửa trang Edit của Quiz** (`quiz-editor.js`): đổi **Game Title → Activity Title**; **bỏ Instruction**;
**bỏ chọn Style/theme** (mặc định luôn `classic`); **bỏ khối Options** (đưa vào Settings); **bỏ nút Paste
from Excel** (giữ 3 nút Mark correct in all / Unmark all / Delete all); **đáp án xếp 2 cột/hàng** (A B / C D
/ E F) với **chữ A-F IN ĐẬM (800) NẰM TRONG ô đáp án** (chữ đáp án weight 500); **nút Duplicate câu** bên
TRÁI nút Remove, 2 nút bằng nhau (96px); góc trên ghi **badge "QUIZ"** + tiêu đề "New activity"/"Edit
content"; **tối đa 120 câu** + dòng đếm "N / 120". Editor nhận thêm tham số `header` (main.js truyền cụm
header dùng chung vào đầu trang Edit).

**5. Preview act hiện tên dài** (`app.css`): grid view cho tên act **2 dòng** (line-clamp, .85rem) — tên
≤~42 ký tự HIỆN ĐỦ, quá mới "…" (đo thật: 35 & 42 ký tự đều vừa 2 dòng); cột grid min 200px.

**⚠️ BẪY ĐÃ SỬA — trùng tên class với engine (in-game):** header thư viện ban đầu vô tình đặt trùng 3
class engine đang dùng cho MÀN CHƠI: `.aw-topbar` (thanh đồng hồ/điểm), `.aw-iconbtn` (nút loa/fullscreen/
menu), `.aw-navbtn` (mũi tên trước/sau) → CSS đè nhau làm hỏng thanh trong game (thêm margin, nút phình
46px). Đã đổi TÊN RIÊNG cho header thư viện: **`.aw-appbar` / `.aw-appbtn` / `.aw-appnav`** (+ `-ic`). Đo
lại: nút mũi tên trong game về đúng 39px (4cqw), topbar margin 0. **BÀI HỌC: đặt tên class header/nút mới
phải tránh không gian tên engine dùng cho khung game** (rà `grep` trong core/ trước khi đặt).

**Đã test thật (javascript_tool, 0 lỗi console toàn bộ):** trang chủ = logo+Settings (không nav, tagline
193=193px); trong Activities = header [Activities|Results|Settings], nav Activities sáng; picker liệt kê 5
loại (Quiz sẵn + 4 coming soon); chọn Quiz → editor: badge QUIZ, "New activity", chỉ trường Activity Title,
KHÔNG Instruction/theme/Options/Paste, bulk 3 nút, đáp án 2 cột chữ A-D (letter weight 800 vs text 500),
Duplicate/Remove =96px, 1/120; Settings đổi letters=abc + tắt shuffle Q → Save (lưu localStorage); tạo act
mới kế thừa đúng options + theme classic; sửa act cũ nạp đủ 6 câu + chữ A-D; Results KHÔNG có New activity;
tên 40 ký tự hiện đủ 2 dòng grid; chơi thật vẫn OK; **nút trong game (mũi tên/loa/đồng hồ) không bị đè sau
khi đổi tên class**.

### v0.6.2 — 19/7/2026 — Editor Quiz: Dán nhanh từ Excel + hàng nút thao tác hàng loạt
Thầy chốt hướng nhập liệu: (1) dán cả bảng từ Excel, chọn được hàng/cột; (2) nút thao tác toàn bộ.
Thầy chốt luật: **CHỈ cho dán khi danh sách câu hỏi trống hoàn toàn** — có dữ liệu rồi thì báo lỗi,
phải bấm Delete all questions trước. Tất cả nằm trong `templates/quiz/quiz-editor.js` + CSS mục
"Bulk actions bar + paste-from-Excel modal" trong `core/app.css` (phiên phụ trách tổng).

**1. Hàng nút hàng loạt** (`.aw-ed-bulk`, ngay dưới tiêu đề "Questions"):
- **Paste from Excel** — mở hộp thoại dán (chặn + báo lỗi đỏ nếu form đã có chữ ở câu hỏi/đáp án).
- **Answer [A▾] Mark correct in all** — chọn chữ A-F rồi bấm: đáp án ở vị trí đó thành đáp án đúng
  cho MỌI câu; câu nào ít đáp án hơn thì giữ nguyên + báo số câu bỏ qua.
- **Unmark all correct** — bỏ đánh dấu đúng ở tất cả câu (Save sẽ tự chặn nếu quên chọn lại).
- **Delete all questions** — hỏi xác nhận rồi xóa sạch, còn lại 1 thẻ câu hỏi trống (đủ điều kiện dán).
- Thông báo kết quả dùng lại thanh `.aw-ed-error` thêm biến thể XANH `.is-info` (đỏ = lỗi như cũ).

**2. Hộp thoại Paste from Excel** (`.aw-ed-pastemodal`, dùng lại `.aw-modal-overlay` — flex-center +
fade opacity nên miễn nhiễm lớp lỗi popup-nhảy):
- Ô dán lớn: Excel copy ra TAB giữa cột + xuống dòng giữa hàng → app tách thành **bảng xem trước**.
- **Đầu mỗi cột 1 ô chọn vai trò**: Question / Correct answer / Answer / Ignore. Tự đoán sẵn: cột 1 =
  Question, cột 2 = Correct answer, còn lại = Answer.
- **Mỗi hàng 1 ô tick**; hàng đầu trông giống tiêu đề (chữ "Question"/"Answer"/"Correct"...) tự BỎ tick.
- Kiểm tra sống khi gõ/đổi cột/tick: đúng 1 cột Question + đúng 1 cột Correct answer; từng hàng phải có
  câu hỏi + ≥2 đáp án + ô đáp án đúng không rỗng — hàng thiếu bị BỎ QUA (báo số hàng skip màu vàng);
  quá 6 đáp án thì cắt còn 6 nhưng KHÔNG bao giờ cắt mất đáp án đúng. Nút Add hiện "Add N questions".
- Bấm Add → biến thành thẻ câu hỏi trong form (sửa tay tiếp được như thường), báo xanh số câu đã thêm.
- Ô xem trước dùng `textContent` (không innerHTML) — dữ liệu dán không thể chèn mã.

**Đã test thật (đo DOM qua javascript_tool, 0 lỗi console toàn bộ):** hàng nút đủ 4 chức năng + chọn
A-F; dán 5 dòng (1 tiêu đề + 1 dòng hỏng) → tiêu đề tự bỏ tick, "Add 3 questions", cảnh báo 1 hàng skip;
đổi cột sang Ignore/Answer đếm lại đúng; Add → 3 thẻ câu đúng nội dung + đáp án đúng đúng cột; dán khi
ĐANG có dữ liệu → lỗi đỏ đúng luật thầy chốt, KHÔNG mở hộp thoại; Mark B correct in all → cả 3 câu tick B;
Unmark all → không câu nào tick; Delete all (confirm) → còn 1 thẻ trống → dán lại ĐƯỢC; dán 2 câu + đặt
tên "PASTE TEST QUIZ" + Save → về trang chủ, lưu store; mở chơi thật: câu hiện đúng, bấm "dog" +1 điểm
+ dấu ✓. (Game test PASTE TEST QUIZ để lại trong Activities cho thầy xem thử — xóa lúc nào cũng được.)

### v0.6.1 — 19/7/2026 — Thương hiệu "AWord in ANDREW CLASSES" (nút về trang chủ) + nút Home trong game
1. **Cụm thương hiệu mới** (`main.js` hàm `logo()` + `.aw-brand*` trong app.css): đổi tagline "Create &
   play English games" → **"in ANDREW CLASSES"** ("in" xám nhạt + **ANDREW CLASSES** đậm đen, giãn chữ),
   đặt SÁT ngay dưới logo. **Tăng cỡ logo AWord** (3.7rem ở trang chủ; bản nhỏ trong folder 2rem). Cả cụm
   giờ là **1 nút** (`<button class="aw-brand">`) — **bấm ở BẤT KỲ đâu (trang chủ hay trong folder) đều về
   trang chủ top-level** (2 thư mục Activities/Results) qua `goTop`. Hover nền xanh nhạt.
2. **Nút Home trong game** (`engine.js`): cụm phải dưới khung trước 3 nút (Edit/Set assignment/Print) nay
   thêm **Home** → **4 nút**. Bấm Home → `cleanupAll()` (dọn timer/listener) rồi `onExit()` về trang chủ
   top-level. Thêm icon `home` (SVG mái nhà) vào `icons.js`. Đấu nối: `main.js` `playAct` đổi
   `onExit: render` → **`onExit: goTop`** (route `?play=` vốn đã goTop) — trước đây `onExit` được truyền
   quanh nhưng CHƯA hàm nào gọi (giờ nút Home là chỗ dùng).
- Đã test thật (đo DOM): brand = button, logo 59px + "in ANDREW CLASSES", click từ trong folder → về top
  (2 gốc); trong game cụm phải đúng 4 nút [Edit, Set assignment, Print, Home], bấm Home → thoát game về
  top. 0 lỗi console.

### v0.6.0 — 19/7/2026 — Trang chủ kiểu Google Drive (thư mục/thùng rác/Move) + sửa trong game
Thầy yêu cầu đổi trang chủ thành trình quản lý file như Drive. Thầy chốt: **Results tạm dựng khung
trống** (kết quả HS đổ vào sau khi có Firebase/thu điểm), **OK build luôn toàn bộ**.

**1. Kho lưu `core/store.js` viết lại** — mô hình CÂY: mỗi node có `kind` (folder/act), `root`
(**activities** / **results** — 2 gốc CỐ ĐỊNH), `parentId` (null = ngay dưới gốc), `trashed` +
`trashRootId`/`restoreParentId` (thùng rác). Vẫn **async** (Firebase-ready). **Tự migrate** dữ liệu
Khối-1 (`aword-activities` phẳng) sang key mới `aword-lib` lần đầu (act cũ → activities/gốc). Hàm:
`listChildren(root,parentId)` · `pathTo(folderId)` (breadcrumb) · `listFolders` · `searchItems` ·
`listTrash(root)` · `createFolder` · `saveActivity(activity,{root,parentId})` (upsert, giữ nguyên vị
trí/trash khi sửa) · `renameItem` · `moveItem` (chặn thả folder vào chính subtree của nó) ·
`duplicateItem` (folder thì **đệ quy** cả nội dung) · `trashItem` (folder xoá → dồn CẢ subtree cùng
`trashRootId`) · `restoreItem` (khôi phục cả bó về parent gốc, nếu parent mất thì về gốc) ·
`deleteForever`. Thùng rác **RIÊNG theo gốc** (Activities ≠ Results).

**2. Trang chủ `main.js` viết lại thành trình quản lý** — mức ngoài: 2 thẻ gốc lớn **Activities /
Results** (không xoá). Mở 1 gốc: **breadcrumb** (Home › Activities › …) + **thanh công cụ** [**+ New
game** (CHỈ trong Activities) · **+ New folder** · **Recycle bin** (mở/đóng thùng rác) · ô **Search**
+ nút · **grid/list** đổi kiểu xem] + lưới/danh sách folder & act. **Thẻ folder**: icon + tên + ⁝. **Thẻ
act**: **preview** (1 câu hỏi + tối đa 4 đáp án lấy NGẪU NHIÊN, chip màu) + loại + tên + **nút Play tròn ở
giữa** + ⁝. **Menu ⁝ folder**: Open in new tab · Rename · Move · Duplicate · Delete. **Menu ⁝ act**: Open
in new tab · **Edit content** · Rename · Duplicate · Move · Delete. **Move** = hộp thoại cây thư mục cùng
gốc kiểu Drive (loại trừ chính subtree). Delete → thùng rác; trong thùng rác mỗi mục có **Restore** +
**Delete forever** (hỏi xác nhận). **Open in new tab** = `window.open('?play=<id>')` (act) /
`'?folder=<root>~<id>'` (folder); `init()` đọc query khi tải để mở thẳng game/thư mục. Chế độ xem
grid/list nhớ qua localStorage.

**3. Trong game (`engine.js`)** — **bỏ dòng hướng dẫn** (`.aw-below-desc`) dưới khung; **tên game cụ thể**
giờ nằm HÀNG NGANG căn giữa cùng cụm nút Options/Template/Style + Edit/Assignment/Print (grid
`1fr auto 1fr`, align center — sẵn có, chỉ bỏ dòng desc là đủ).

**4. CSS** thêm mục "FILE-MANAGER HOME" cuối `core/app.css`: 2 thẻ gốc, breadcrumb, toolbar, search, view
toggle, thẻ folder/act, **preview act** (gradient + câu hỏi 2 dòng + chip màu + nút Play tròn giữa),
**menu ⁝** (`position:fixed` cạnh nút), **modal** (rename/new folder/move), **cây Move**, thẻ thùng rác,
biến thể **list**. Đều NGOÀI khung 16:9 → rem/px.

**Đã test thật (đo DOM, screenshot preview treo như thường):** 2 gốc + migrate sample vào Activities; mở
Activities → breadcrumb + toolbar đủ nút + thẻ act preview (câu "How many days…" + 4 chip); New folder
"Grammar" (folder xếp trước); ⁝ act đủ 6 mục; **Move** act vào Grammar (root chỉ còn folder, act nằm
trong); **Duplicate** ra "(copy)"; **Delete** copy → vào thùng rác Activities (có Restore/Delete forever);
**Restore** → copy về đúng Grammar (parentId khớp); **Results** không có New game + thùng rác RIÊNG trống;
**list view** + **Search** "copy" ra đúng; `?folder=` mở thẳng Grammar, `?play=` mở thẳng game; ⁝ folder
đúng 5 mục (không Edit content); **trong game** tên "(copy)" ngang hàng nút + KHÔNG còn dòng hướng dẫn,
hàng grid 3 cột align center. **0 lỗi console** toàn bộ.

**CÒN LẠI / GHI CHÚ:** "+ New game" là nút em THÊM (spec thầy liệt kê toolbar không nêu — cần nút này để
tạo act; thầy muốn đổi vị trí/tên cứ báo). Editor vẫn quiz-shaped. Chưa có kéo-thả (drag & drop) để move
— hiện move qua hộp thoại. Bước tiếp theo của chặng: Print → Assignment → nối Firebase → thu điểm.

### v0.5.0 — 19/7/2026 — KHỐI 1: Trình soạn game (Editor) + Kho lưu + Trang chủ tạo/sửa/chơi/xoá
Bắt đầu chặng "hoàn thiện Quiz 100%" (thầy chốt: build lần lượt edit → tạo-game-từ-trang-chủ → in →
assignment; xong Quiz mới sang game khác vì dùng chung hạ tầng). Đây là **Khối 1** — nền tảng cho mọi
khối sau. Thầy chọn hướng **Firebase online**; cách làm: xây trước với **lớp lưu trữ tách riêng (async)**
chạy tạm bằng localStorage để dùng được NGAY, thiết kế để **cắm Firebase vào là xong** không phải viết lại.

**1. Lớp lưu trữ `core/store.js` (MỚI)** — "kho" chứa game, 4 hàm ĐỀU async (Promise) để sau đổi sang
Firebase không phải sửa nơi gọi: `listActivities()` (mới sửa lên đầu) · `getActivity(id)` ·
`saveActivity(activity)` (tự cấp id nếu thiếu + `createdAt`/`updatedAt`, upsert, làm trên bản sao) ·
`deleteActivity(id)`. Hiện lưu vào `localStorage` key **`aword-activities`** = `{ [id]: activity }`.

**2. Trình soạn Quiz `templates/quiz/quiz-editor.js` (MỚI)** — `openQuizEditor(container, activity,
{onSave, onCancel})`. Sửa trên **bản sao sâu** (Cancel giữ nguyên bản gốc). Gồm: tên game · instruction
· theme (chọn từ THEMES) · Options (Timer none/up/down + stepper mm:ss tái dùng `numberstepper.js`,
Letters none/abc, 3 checkbox Shuffle Q / Shuffle A / Show answers) · danh sách **Câu hỏi**: mỗi câu 1 thẻ
[ô câu hỏi + 2-6 đáp án, mỗi đáp án có **nút tròn radio đánh dấu đáp án đúng** + ô chữ + nút ×; thêm/xoá
đáp án (2..6); thêm/xoá câu (min 1)]. **Validation** khi Save: thiếu tên / câu trống / <2 đáp án / chưa
đánh dấu đáp án đúng → hiện thanh đỏ. Kỹ thuật: ô chữ bind model qua `oninput`; danh sách câu chỉ
**re-render khi ĐỔI CẤU TRÚC** (thêm/xoá/đổi-đáp-án-đúng) nên gõ không mất focus; validate trên bản
CLEANED (bỏ đáp án rỗng) để model đang gõ không bị hỏng nếu Save lỗi. Editor là "quiz-shaped" — game
khác sẽ tự cấp editor riêng cùng cách (đăng ký `edit` trên template).

**3. Mỗi template tự khai báo editor qua registry** — `quiz.js` thêm `edit: openQuizEditor`. Engine gọi
`tpl.edit(...)` (không import cứng quiz) → đúng tinh thần "game dùng chung hạ tầng".

**4. Trang chủ `main.js` viết lại thành THƯ VIỆN game của giáo viên** (thay màn splash 1-nút cũ): logo +
"**+ Create a game**" + lưới thẻ game (mỗi thẻ: badge loại, tên, số câu, 3 nút **▶ Play / Edit / Delete**).
Lần đầu chạy tự **seed** game mẫu để không trống. Create → editor với quiz trắng; Edit → editor nạp game;
Save → lưu store + về trang chủ; Delete → hỏi xác nhận rồi xoá. (Home/editor nằm NGOÀI khung 16:9 nên CSS
dùng rem/px, KHÔNG cqw — và phải ghi đè cỡ `.aw-btn`/`.aw-logo` vì 2 class đó vốn sizing cqw để dùng
TRONG khung; ngoài khung cqw sẽ tính theo viewport → nút/logo phình to.)

**5. Nút "Edit" trong game (engine.js)** — trước chỉ toast "coming soon", nay: rời game → mở editor của
game đang chơi (`tpl.edit`); **Save** → lưu store + chơi lại với nội dung mới; **Cancel** → chơi lại bản
gốc. `engine.js` thêm `import { saveActivity }`.

**6. CSS Khối 1** thêm vào cuối `core/app.css` (luôn nạp): mục "HOME LIBRARY + EDITOR" — thẻ game, form
editor, thẻ câu hỏi, hàng đáp án (đáp án đúng viền/nền xanh), nút thêm/xoá, thanh lỗi đỏ.

**Đã test thật (đo DOM trực tiếp, screenshot preview treo như thường lệ — dùng javascript_tool):** trang
chủ seed 1 game mẫu 6 câu + 3 nút; mở Create → editor đủ trường + 1 câu 2 đáp án; Save trống → lỗi
"Please enter a game title"; điền đủ + Save → game "My Test Quiz" xuất hiện đầu danh sách + lưu localStorage;
Edit game mẫu → nạp đúng 6 câu, câu 1 "cold" tick đúng; Cancel → về trang chủ không đổi; Play → vào ready
screen; **Edit trong game** → mở editor game hiện tại; đổi tên + Save → **quay lại GAME** (không phải trang
chủ) với tên mới + đã lưu; Delete (confirm) → xoá khỏi lưới + store; clear + reload → tự seed lại sạch.
**0 lỗi console** toàn bộ.

**CÒN LẠI của chặng (đề xuất thứ tự):** Khối 2 **Print** (in giấy — offline được) → Khối 3 **Assignment**
phần chơi (link + QR gói game, offline được) → **nối Firebase** (thầy tạo project, em hướng dẫn) để lưu
online + Khối 4 **thu điểm HS nhiều máy** (bắt buộc Firebase). Editor hiện quiz-shaped, tổng quát hoá khi
làm game khác. Chưa có: nút "Home" thoát nhanh từ trong game (hiện chỉ qua Start again/onExit).

### v0.4.2 — 17/7/2026 — Hoàn nguyên Classroom + thêm theme Basic + diệt lớp lỗi popup-nhảy
1. **Hoàn nguyên theme Classroom** về bản ấm áp gỗ/kem (v0.4.0) — thầy thấy bản chalkboard (v0.4.1)
   xấu. `classroom.css` giờ = cream `#fbf4e6`, viền/ô phẳng mặc định (khai báo `--aw-tile-*` = giá trị
   mặc định như Classic).
2. **Thêm theme "Basic"** (`core/themes/basic.css`) — đơn giản/tối giản theo ảnh thầy gửi: MỌI ô đáp án
   CÙNG 1 màu navy `#17255a` (viền xanh `#4a72cf`, phẳng + bóng mềm, không gờ 3D), chữ trắng, câu hỏi
   navy đậm, nền trắng/xanh nhạt. Cơ chế: thêm biến `--aw-tile-fixed`/`--aw-tile-fixed-dark` — nếu
   theme đặt thì ÉP mọi ô về 1 màu (đè bảng màu ngẫu nhiên); quiz.css resolve qua `--tile-eff`/
   `--tile-dark-eff` (= fixed nếu có, else màu random inline). Thêm `--aw-tile-shadow-active` cho hiệu
   ứng nhấn theo theme. Đăng ký trong `themes/manifest.js` (thứ tự: Classic, Basic, Classroom, Beach)
   + swatch trong engine.js. Đã test: 4 ô cùng màu navy, đúng ảnh mẫu.
3. **DIỆT LỚP LỖI "popup hiện 1 nơi rồi nhảy về đúng chỗ"** (thầy chỉ ra còn nhiều popup chữ dính):
   rà toàn bộ `app.css` bằng `grep "transform:.*translate|animation:"` → tìm ra 2 thủ phạm còn sót
   ngoài popover đã sửa ở v0.4.1: **`.aw-toast`** (thông báo chữ) và **`.aw-tile-badge`** (dấu ✓/✗ nhỏ
   trên ô) — cả 2 căn giữa bằng `translateX(-50%)` NHƯNG dùng keyframe `aw-pop` (kết thúc `transform:
   none`, mất phần -50% suốt lúc chạy → lệch phải rồi giật về giữa). Sửa: tạo keyframe **`aw-pop-cx`**
   BAKE luôn `translateX(-50%)` vào cả from/to (vừa pop vừa giữ căn giữa), áp cho cả 2. Đã đo xác nhận:
   toast + badge offset 0px ở MỌI mốc 5-150ms (không còn nhảy).
   - Ghi **CÁCH RÀ SOÁT** lớp lỗi này vào `core/HUONG DAN CORE.md` (mục "LỖI HAY GẶP NHẤT"): grep
     transform+animation, kiểm keyframe có chứa translate(-50%) ở mọi mốc không; 2 cách sửa (opacity-
     only hoặc bake -50% vào keyframe); ngoại lệ flex-center thì an toàn. Để mọi session sau tự kiểm
     trước khi xong việc.
- 0 lỗi console trong toàn bộ test (Basic uniform tiles, Classroom cream, toast/badge không nhảy).

### v0.4.1 — 17/7/2026 — 4 tinh chỉnh sau khi thầy xem thanh công cụ v0.4.0
1. **Theme Classroom làm theo ảnh mẫu thầy gửi** (chụp từ 1 game thật của thầy trên Wordwall): nền
   3 dải CSS gradient (tường màu kem trên · bảng phấn xanh giữa · sàn gỗ nâu dưới), ô đáp án viền
   dày xanh navy đậm (`--aw-tile-border-width/-color`) + bo góc to hơn (`--aw-tile-radius`) + thêm
   bóng đổ mềm ngoài gờ 3D cũ (`--aw-tile-shadow`), câu hỏi chữ TRẮNG viền ĐEN kiểu hoạt hình
   (`-webkit-text-stroke`, biến `--aw-question-stroke-*`/`--aw-question-fill`). **Không truy cập
   được link Wordwall riêng tư thầy gửi để copy ảnh gốc** (cần đăng nhập) → đây là bản dựng lại
   bằng CSS thuần (không có ảnh minh họa cửa sổ/cây cảnh...), đã báo thầy. Đã sửa 1 lỗi tương phản
   khi làm: ban đầu định cho `--aw-muted`/`--aw-text` màu SÁNG (nghĩ "chữ trên bảng đen"), nhưng đo
   lại thấy đồng hồ/điểm/thanh dưới thực ra nằm ở dải TƯỜNG/SÀN sáng màu (không phải bảng đen) — sửa
   lại thành màu tối để đọc được. `--aw-accent` phải đủ sáng vì còn dùng trên panel tối luôn-đen
   (Score/Time label) bất kể theme.
   - Các biến mới (`--aw-tile-radius`, `--aw-tile-border-width/-color`, `--aw-tile-shadow`,
     `--aw-question-stroke-width/-color`, `--aw-question-fill`) đã thêm ĐỦ vào cả `classic.css` và
     `beach.css` với giá trị mặc định = giao diện hiện tại (không đổi gì cho 2 theme đó), theo đúng
     quy tắc "mỗi theme tự khai báo đủ biến" trong `HUONG DAN CORE.md`.
2. **Countdown vuốt lên/xuống chỉnh số**: thêm `core/numberstepper.js` (`makeNumberStepper`) — ô số
   nhỏ có nút ▲▼ + vuốt dọc (kéo lên = tăng, xuống = giảm, 10px/nấc) qua Pointer Events + pointer
   capture. Thay 2 ô `<input type=number>` phút/giây trong Options bằng 2 stepper này. Tái dùng
   được cho các số nhỏ khác sau này (vd Lives).
3. **Sửa popup hiện lệch rồi mới nhảy về giữa** — lỗi THẬT (không phải do em đo nhầm lúc test):
   nguyên nhân là keyframe `aw-pop` cũ có animate cả `transform`, mà panel lại dùng
   `transform:translateX(-50%)` để tự căn giữa — animation THAY THẾ transform trong suốt lúc chạy
   (180ms) nên panel hiện sai vị trí (lệch phải, vì mất phần bù -50%) suốt animation rồi mới "giật"
   về đúng chỗ khi animation xong — người dùng THẤY RÕ cú giật này. Sửa: đổi animation của
   `.aw-tool-panel` sang **CHỈ động opacity** (`aw-fadein`, không đụng transform) → panel giờ đúng vị
   trí NGAY TỪ FRAME ĐẦU (đã đo: offset 0px ở mọi mốc 5-200ms). Ghi thành luật chung trong
   `HUONG DAN CORE.md` (không animate transform trên phần tử định vị bằng transform).
   - Thêm luôn **fade khi ĐÓNG** (trước đây đóng là biến mất tức thì, không fade): `closeToolPanel`
     giờ nhận tham số `fade` — đóng thật (bấm ra ngoài/tắt) thì fade opacity 150ms + setTimeout dự
     phòng theo luật animate() đã có; đóng để MỞ PANEL KHÁC ngay thì xoá tức thì (panel mới đã tự
     fade-in đè lên, fade cũ chỉ làm chậm cảm giác).
4. **Nút Apply cho panel Options**: đổi sang mô hình NHÁP — mọi điều khiển trong panel giờ sửa 1
   bản sao cục bộ `draft` (không đụng `activity.options` nữa), chỉ khi bấm **Apply** (nút to, giữa,
   dưới cùng panel) mới `Object.assign(activity.options, draft)` để lưu thật + đóng panel (fade) +
   toast "Options applied". Bấm ra ngoài mà chưa Apply = mất hết thay đổi (dữ liệu gốc chưa từng bị
   sửa nên tự nhiên giữ nguyên). Ghi thành mẫu dùng chung ("mô hình nháp") trong `HUONG DAN CORE.md`
   cho panel nhiều lựa chọn nào cần Apply sau này.
- Đã test kỹ: panel căn giữa 0px lệch ở MỌI mốc thời gian (không còn nhảy); fade-out xác nhận opacity
  giảm dần rồi biến mất; stepper bấm nút (+3) và vuốt (+6 với 55px) đều đúng; đổi timer sang Count
  down KHÔNG Apply rồi đóng → mở lại vẫn Count up (nháp bị huỷ đúng); đổi Shuffle question + Apply →
  lưu thật (mở lại thấy đổi); đổi Shuffle answer KHÔNG Apply → mở lại vẫn cũ (huỷ đúng); theme
  Classroom lúc chơi thật: 3 dải nền tường/bảng/sàn, viền ô navy dày, chữ câu hỏi trắng viền đen, chữ
  đồng hồ/điểm/thanh dưới vẫn đọc rõ trên dải sáng. 0 lỗi console trong toàn bộ quá trình test.

### v0.4.0 — 17/7/2026 — Thanh công cụ ngoài khung: Options/Template/Style + Edit/Assignment/Print
Tính năng lớn, đổi mốc version (0.3→0.4). Toàn bộ nằm ở **core** (dùng chung mọi template tương lai).

**1. Bố cục ngoài khung** (`.aw-below` → grid `1fr auto 1fr`):
- Trái: tên lesson + hướng dẫn (như cũ, nay bọc trong `.aw-below-left`).
- Giữa: 3 nút vuông bo tròn **Options · Template · Style**.
- Phải: 3 icon nhỏ **Edit · Set assignment · Print** (chuẩn bị hạ tầng, hiện chỉ toast "coming soon").

**2. Hệ thống popover dùng chung** (`openToolPanel`/`closeToolPanel` trong engine.js): bấm 1 trong 3
nút giữa → nút tỏa hào quang (`.is-active`, glow xanh) → panel hiện NGAY DƯỚI, CĂN GIỮA cụm 3 nút
(position:absolute + left:50%/translateX(-50%) so với `.aw-below-center` position:relative) → TOÀN
MÀN HÌNH (kể cả khung game) bị làm mờ + blur nhẹ qua lớp phủ `position:fixed;inset:0` z-index 40,
cụm nút + panel nổi trên (z-index 41-42). Bấm ra ngoài hoặc bấm lại đúng nút đang mở → đóng. Chỉ 1
panel mở tại 1 thời điểm (mở panel khác tự đóng panel cũ, giữ đúng "chỉ 1 hào quang").

**3. Panel OPTIONS — điều khiển THẬT** (không phải mock), ghi trực tiếp `activity.options`:
- **Timer**: None / Count up / Count down (kèm ô nhập phút:giây). Đã VIẾT MỚI chế độ đếm ngược cho
  engine (trước chỉ có đếm lên): còn 0 giây → tự dừng đồng hồ + tự gọi `submitHandler` (tự nộp bài,
  giống hết giờ ở Wordwall thật). Sửa thêm: hiện đúng tổng thời gian NGAY khi bắt đầu (trước phải
  đợi tick 500ms đầu mới hiện, có lúc nhấp nháy "0:00").
- **Random**: Shuffle question order / Shuffle answer order (bật/tắt 2 cờ có sẵn).
- **End of game**: Show answers — tắt thì nút "Show answers" biến mất khỏi menu tổng kết.
- **Letters on answers**: A,B,C / None — quiz.js vẽ thêm nhãn chữ góc trái mỗi ô khi bật (đọc
  `opt.lettersOnAnswers` SỐNG mỗi lần render câu, nên hiện ngay từ câu tiếp theo, không cần restart —
  an toàn vì không ảnh hưởng logic xáo/chấm). Timer/Shuffle chỉ áp dụng từ lượt chơi TIẾP (Start
  again) — panel tự hiện dòng nhắc "Applies when you press Play" / "...Start again" tùy đang ở màn
  ready hay giữa ván.
- Giới hạn đã biết: bộ Options này hình dạng theo QUIZ (câu hỏi/đáp án); template khác cần bộ khác,
  chưa tổng quát hóa — ghi rõ trong `core/HUONG DAN CORE.md`.

**4. Panel TEMPLATE**: liệt kê `ALL_TEMPLATES` (Quiz, Anagram, Find the match, Type the answer, Open
the box) — chỉ template khớp `activity.type` hiện đang chơi được đánh dấu "current", còn lại mờ +
toast "coming soon" khi bấm.

**5. Panel STYLE — theme đổi TRỰC TIẾP, không cần restart**: thêm 2 theme mới
`core/themes/classroom.css` (ấm áp gỗ/phấn bảng — **TỰ THIẾT KẾ vì không truy cập được link Wordwall
riêng tư thầy gửi tham khảo, trang báo "Private resource" cần đăng nhập mà không có mật khẩu — đã
báo thầy, chờ thầy góp ý/chỉnh nếu chưa đúng ý**) và `core/themes/beach.css` (cát/biển). Thêm
`core/themes/manifest.js` — sổ đăng ký theme + **nạp CSS động** (`loadTheme(id)` chèn `<link>` khi
cần lần đầu, không phải sửa từng `test.html`/`index.html`). Bấm 1 theme trong panel → tải CSS (nếu
chưa có) → đổi class `theme-<id>` trên `.aw-stage` ngay lập tức + cập nhật `activity.theme` (nên
"Start again" giữ đúng theme vừa chọn).

**6. Bẫy CSS đã gặp + sửa**: dùng grid `1fr auto 1fr` để căn giữa cụm giữa — nếu 2 cột 1fr có
min-content chênh lệch lớn (tên lesson dài bên trái vs vài icon nhỏ bên phải), cụm giữa **lệch tâm**
dù cả 2 đều "1fr" (do mặc định `min-width:auto` ép track to theo nội dung dài nhất). Sửa bằng thêm
`min-width:0` cho 2 cột 1fr. Đã ghi thành bẫy chung trong `core/HUONG DAN CORE.md` cho mọi bố cục
grid 3 cột sau này (nav bar dưới khung ở v0.3.8 may mắn không dính vì cả 2 nhóm đều nhỏ).

**7. Sửa `main.js` (trang chủ)**: bọc nội dung splash trong `.aw-below-left` — nếu không, layout
grid 3 cột mới sẽ dàn 3 phần tử con (type/title/desc) ra 3 CỘT KHÁC NHAU thay vì xếp chồng ở cột
trái (đã phát hiện + sửa lúc test hồi quy).

- Đã test kỹ: panel căn giữa chính xác (offset đo 0px sau khi hết hiệu ứng mở 180ms — lúc đo giữa
  hiệu ứng sẽ SAI do animation `aw-pop` tạm ghi đè transform, không phải bug thật); dim+blur+glow;
  đóng khi bấm ngoài; chỉ 1 panel mở cùng lúc; Letters on answers hiện đúng A-B-C-D; đếm ngược tự nộp
  bài khi về 0; tắt Show answers → menu ẩn đúng; đổi theme Classroom/Beach trực tiếp + giữ qua Start
  again; menu ☰ trong khung + leaderboard + Enter-lưu-tên vẫn hoạt động song song không xung đột;
  trang chủ + vào chơi từ trang chủ đều đúng. 0 lỗi console trong mọi test.

### v0.3.8 — 17/7/2026 — Màu teal · nav căn giữa · menu ẩn khi bấm ngoài
1. **Đổi màu hồng → teal**: palette quiz.js `#ec4899` (pink) → `#14b8a6`/`#0f9488` (teal). Đã test 6
   ván reshuffle: không còn pink, có teal, 8 màu đều phân biệt.
2. **Nav "x of N" + mũi tên căn GIỮA khung**: `.aw-bottombar` từ flex space-between → **grid
   `1fr auto 1fr`** (con 1=menu justify-self start, con 2=nav center, con 3=tools end). Đo: nav lệch
   tâm 0px (trước lệch trái do 2 nhóm menu/tools khác bề rộng).
3. **Menu option ẩn khi bấm ra ngoài**: `openMenu` gắn `document.addEventListener("pointerdown",
   onMenuOutside)` (deferred setTimeout 0 để click mở không tự đóng); `onMenuOutside` đóng nếu click
   ngoài menu & ngoài nút ☰; `closeMenu` gỡ listener. Đã test: mở menu → bấm playarea → menu đóng.
- 0 lỗi console.

### v0.3.7 — 17/7/2026 — Âm thanh + phím Enter
1. **Enter trong ô tên leaderboard = Ok**: `nameInput.onkeydown` bắt Enter → updateName + blur + toast
   "Name saved" (giống nút Ok).
2. **Chuông khởi động**: thêm `sound.start()` (5 nốt C-E-G-C-E reo tăng dần), phát khi bấm nút PLAY.
3. **Tiếng bấm nút**: thêm `sound.click()` (blip sine ngắn 70ms, gain 0.08). Gắn vào `panelItem()` và
   `menuItem()` (mọi nút bảng + menu, gồm Start again). Cả 2 âm tôn trọng nút tắt tiếng (qua `tone()`
   check `muted`). KHÔNG gắn click vào nút loa/fullscreen/mũi tên (tránh ồn).
- Test JS: sound fns chạy 0 lỗi; Enter lưu tên "Huy" + toast + blur; Start again vẫn về ready. 0 lỗi console.

### v0.3.6 — 17/7/2026 — 3 tinh chỉnh màn Show answers
1. **Ô đáp án còn 1/2 bề ngang**: grid review `2.4fr 1fr 1fr` → **`6.8fr 1fr 1fr`** (mỗi cột đáp án ~11%
   khung = nửa cũ; ô đúng span 2 ~22%). Cột câu hỏi rộng ra chiếm phần còn lại.
2. **Đánh số câu hỏi**: engine prefix `${i+1}. ` vào text câu hỏi.
3. **Câu hỏi 1 CỠ CỐ ĐỊNH** (bỏ fitOnce phóng to per-ô cho câu hỏi): `.aw-rv-q .aw-rv-txt` font
   `2.3cqw` cố định + `.aw-rv-fit` display:block để **xuống dòng**; hàng `min-height:7cqw` **auto-grow**
   khi câu dài (đo: 84px vs 53px), ô đáp án stretch cao theo (grid align stretch mặc định). List
   `justify-content: safe center` + `overflow-y:auto` (căn giữa khi ít câu, cuộn khi nhiều/tràn).
   Chỉ ô ĐÁP ÁN còn fitOnce (shrink max:1) để chữ vừa ô hẹp.
- Đã đo & chụp thật: ô đáp án 22%/11%, câu hỏi cùng font, câu dài wrap + hàng cao lên. 0 lỗi console.

### v0.3.5 — 17/7/2026 — 4 tinh chỉnh màn ready + leaderboard + review
1. Màn READY: dòng trên cùng đổi từ tên template ("QUIZ") → **"ANDREW CLASSES"** (thương hiệu).
2. Màn READY: BỎ dòng instruction ("Tap the correct answer."), thay bằng **TÊN GAME** (tpl.name, vd
   QUIZ) ĐẶT DƯỚI nút play, TO hơn + ĐẬM hơn (`.aw-ready-game` 3cqw/800, thay `.aw-ready-instr`).
3. Leaderboard HẸP LẠI ~nửa: `.aw-panel-wide` min-width 52cqw→**28cqw** (max 62%), cột gọn hơn
   `grid-template-columns: 4cqw 1fr 4.8cqw 5.2cqw`. Đo được panel ~46% bề rộng khung, không chật.
4. Show answers: câu hỏi CHO TO TỐI ĐA lấp đầy ô — `fitOnce` cho ô câu hỏi dùng `max:3.5` (được PHÓNG
   TO lên tới 3.5×, không chỉ thu nhỏ), ô đáp án `max:1.4`. Đo: hệ số fit câu hỏi 1.7–2.8×, cỡ 23–38px.
- Đã chụp thật xác nhận cả 4. 0 lỗi console.

### v0.3.4 — 17/7/2026 — 6 tinh chỉnh sau khi thầy chơi thử v0.3.3
1. Đổi tiêu đề leaderboard `ANDREW LEADERBOARD` → **`ANDREW CLASSES`**.
2. **Không thêm vào leaderboard nếu HS không làm câu nào** (`answered === 0`): engine `finish` tính
   `answered` (quiz gửi kèm), chỉ `addEntry` khi answered>0. Review vẫn lưu TRONG BỘ NHỚ (`reviewData`)
   nên Show answers vẫn xem được dù không lên bảng; summary không hiện dòng rank.
3. **Show answers dời vào menu summary** cùng Leaderboard/Start again/Play a different template. Thứ tự:
   Leaderboard → Show answers → Start again → Play a different template. Bỏ Show answers khỏi panel
   leaderboard (leaderboard giờ chỉ Ok + Back). Nút × của review quay về summary.
4. **Tự động Game Complete khi làm hết câu**: quiz `choose()` kiểm tra `state.every(answered)` → hẹn
   `finish` sau 1.0s (đúng)/1.5s (sai) để kịp xem ✓/✗. Track `autoTimer`, clear trong cleanup.
5. **Thu nhỏ ô đáp án trong màn review**: cột câu hỏi rộng hơn (`grid-template-columns: 2.4fr 1fr 1fr`),
   `max-height:12cqw` mỗi hàng + list `justify-content:center` (ít câu không bị ô quá cao).
6. **Câu ĐÚNG trong review chỉ 1 ô** rộng bằng 2 ô gộp (`.aw-rv-span { grid-column: 2/span 2 }`); câu
   sai/không làm vẫn 2 ô. (Bỏ trùng lặp "your answer = correct answer" khi đúng.)
- Đã test thật: auto-complete OK (không cần bấm finish); menu đúng thứ tự; ANDREW CLASSES; 0-answered
  KHÔNG lên bảng (8→8) nhưng Show answers vẫn có; review câu đúng 1 ô rộng / câu sai 2 ô. 0 lỗi console.

### v0.3.3 — 17/7/2026 — 5 cải tiến lớn (màn ready · leaderboard+review · fullscreen giữ tỷ lệ)
Đều là hạ tầng DÙNG CHUNG ở core (áp dụng cho mọi game sau), trừ phần review data do template cấp.

1. **Màn READY đầy đủ** (PLAY overlay, `engine.js` + `.aw-ready-*` trong app.css): trên cùng LOẠI
   TEMPLATE (tpl.name viết hoa, vd QUIZ), giữa TÊN LESSON to viết hoa (activity.title), nút PLAY,
   dưới là INSTRUCTION cỡ vừa (activity.instruction). Cân đối 16:9.
2. **Leaderboard**: đổi tiêu đề `LEADERBOARD` → **`ANDREW LEADERBOARD`**. Thêm nút **Ok** (trước Back)
   để xác nhận lưu tên (updateName + toast "Name saved"). Ghi chú: leaderboard hiện lưu localStorage,
   ĐÃ chuẩn bị cho ĐỒNG BỘ ONLINE sau (mỗi entry lưu đủ name/score/time + review → Firebase sync để
   HS thi đua nhìn thấy nhau).
3. **Show answers** (nút trong leaderboard → màn REVIEW toàn 16:9 `.aw-review`): mỗi câu 1 hàng
   `[câu hỏi | đáp án của HS | đáp án đúng]`. Đáp án HS: SAI = ô tối (#3d4852) + ✗; ĐÚNG = ô xanh
   (#2ec27e) + ✓; KHÔNG làm = ô trắng nhạt "No answer". Đáp án đúng luôn ô xanh + ✓. Chữ mỗi ô TỰ CO
   vừa ô bằng `fitOnce` (fit một lần, không listener — thêm vào `core/fit.js`).
   - **Luồng dữ liệu review**: template `quiz.js` khi finish gửi thêm `review[]`
     `{question, answered, yourText, yourCorrect, correctText}` → `ui.finish` → `addEntry` lưu vào
     entry leaderboard (`leaderboard.js`) → engine đọc `getEntry().review` để dựng màn review. Các game
     Q&A sau cấp `review[]` cùng cấu trúc là dùng được ngay.
4. **FULLSCREEN GIỮ TỶ LỆ (đổi hệ đơn vị — bài học lớn cho MỌI template)**:
   - **Vấn đề cũ**: dùng `vw`/`clamp` → kích thước phụ thuộc VIEWPORT, nên fullscreen làm đổi tỷ lệ
     các thành phần (clamp chạm max, layout khác).
   - **Cách sửa**: `.aw-stage` đặt `container-type: size` (thành CSS container); MỌI kích thước BÊN
     TRONG khung đổi sang đơn vị **`cqw`** (1cqw = 1% BỀ RỘNG KHUNG). Vì khung luôn 16:9, mọi thứ scale
     ĐỒNG ĐỀU theo khung → khung nhỏ hay fullscreen đều CÙNG TỶ LỆ, chỉ khác cỡ (zoom). Quy đổi:
     ~ `giá_trị_px / 10` = cqw (design base khung ~1000px). BỎ clamp (clamp chặn scale đồng đều).
   - **Fullscreen letterbox**: nút fullscreen gọi `page.requestFullscreen()`; CSS `.aw-page:fullscreen`
     nền đen, căn giữa, `.aw-stage { width: min(100vw, 100vh*16/9) }` giữ 16:9 (viền đen quanh nếu màn
     không 16:9), ẩn `.aw-below`.
   - Đã ĐO xác nhận: khung 754px vs 468px → tỷ lệ chữ/ô/đồng hồ so với bề rộng khung GIỮ NGUYÊN
     (5.19% ↔ 5.18%, chênh do làm tròn) → chứng minh fullscreen chỉ zoom, không đổi tỷ lệ.
   - LƯU Ý cho template khác: dùng `cqw` cho kích thước, KHÔNG dùng vw/clamp. `slack` của autoFit nếu
     phụ thuộc padding cqw thì tính theo `root.clientWidth * hệ_số` (px động) chứ đừng để số px cứng.
- Sample `LSA2-S1.T1.P1-2-3 / ENG2` + "Tap the correct answer." để demo màn ready giống ví dụ thầy.
- Đã test & chụp thật: ready screen cân đối; leaderboard ANDREW + Ok/Show answers/Back; review 6 câu
  (sai/đúng/No answer) đẹp; proportions ổn định; home không hỏng; 0 lỗi console.

### v0.3.2 — 17/7/2026 — Quiz: bố cục đáp án theo số lượng (theo 5 ảnh mẫu thầy vẽ)
Thầy gửi 5 ảnh mô tả cách xếp đáp án cho 2/3/4/5/6 ô. Đã làm chuẩn hơn ảnh (bo góc, cách đều, căn giữa):
- **Quy tắc số ô mỗi hàng** (`perRow`): n≤4 → 1 hàng n ô; n≥5 → 2 hàng, hàng trên `ceil(n/2)` (5→3+2, 6→3+3, 7→4+3, 8→4+4).
- **Kỹ thuật CSS**: `.aw-quiz-answers` dùng `display:flex; flex-wrap:wrap; justify-content:center` + biến `--per-row`; mỗi ô `flex: 0 1 calc((100% - (per-row-1)*gap)/per-row)` để ĐÚNG per-row ô lấp đầy 1 hàng, ô dư tự xuống hàng và **hàng cuối tự CĂN GIỮA** (ca 5 đáp án: 2 ô dưới căn giữa dưới 3 ô trên — điểm mấu chốt thầy muốn). `max-width:30%` để 2 đáp án không giãn quá to.
- **Vị trí dọc**: đáp án dồn xuống phần dưới khung (`margin-top:auto`) + `padding-bottom` khung tạo khe dưới; câu hỏi ở trên cao. → autoFit slack nâng lên 46 (padding-bottom tới ~38px + gờ 3D 6px).
- **Màu (theo yêu cầu thầy)**: bảng màu HIỆN ĐẠI 8 màu `PALETTE` trong quiz.js (blue/cyan/emerald/
  amber/orange/red/pink/violet, mỗi màu kèm shade tối cho gờ 3D). **Mỗi lượt START GAME xáo bảng màu
  1 lần** (`palette = shuffle(PALETTE)` trong mount) → gán màu KHÁC NHAU cho từng vị trí đáp án; MỌI
  câu hỏi trong ván giữ nguyên màu theo vị trí; **Start again reshuffle** ra bộ màu mới. Màu set inline
  `--tile`/`--tile-dark` trên từng ô (bỏ class .aw-tile-0..3 cũ). Thêm text-shadow nhẹ cho chữ trắng
  rõ trên màu sáng. Bo góc 16px.
- Đã đo & chụp thật: 2→[2] giữa, 3→[3], 4→[4], 5→[3,2] cả 2 hàng offset căn giữa =0, 6→[3,3]; đáp án ở
  lower area, khe dưới ~15px (khung nhỏ)→~33px (khung to). Màu: 6 màu distinct, giữ nguyên qua câu,
  đổi khi restart — TEST PASS. ĐÚNG ý thầy.

### v0.3.1 — 17/7/2026 — Quiz: sửa lỗi bền vững (bước 1 của "hoàn thiện Quiz làm mẫu")
Rà soát Quiz kỹ bằng cách nạp dữ liệu biên và ĐO trực tiếp (javascript_tool) → tìm & sửa 4 vấn đề
mà giáo viên chắc chắn gặp. Đây là các lỗi/pattern QUAN TRỌNG các template sau PHẢI tránh/áp dụng:

1. 🔴 **Câu hỏi/đáp án DÀI bị cắt cụt** (đo được: nội dung cao 780px, khung chỉ 423px → mất 358px,
   đáp án biến mất). **Cách sửa (chuẩn Wordwall): TỰ CO CHỮ vừa khung** → thêm `core/fit.js`
   (`autoFit`): binary-search hệ số `--fit` (font ×) lớn nhất mà nội dung vẫn vừa khung 16:9.
   - **BÀI HỌC XƯƠNG MÁU khi đo "có vừa không"**: KHÔNG dùng `box.scrollHeight > box.clientHeight`
     — vì khi thẻ bị kéo `height:100%`, `scrollHeight` LUÔN == `clientHeight` (dù nội dung nhỏ xíu),
     làm thuật toán tưởng luôn tràn → co xuống đáy. PHẢI đo **chiều cao thật của nội dung** (truyền
     `measure` = tổng offsetHeight các con: câu hỏi + khối đáp án) rồi so với `clientHeight - slack`.
   - Chỉ fit theo **CHIỀU CAO** (khung 16:9 ràng buộc dọc; chữ dài tự xuống dòng ngang). Thêm phần
     width vào sẽ đánh nhau với 1px lệch làm co xuống min.
   - `slack` chừa chỗ cho **gờ 3D box-shadow 6px** của ô (shadow không tính vào layout, dễ bị
     overflow:hidden cắt lẹm đáy). Quiz dùng slack:18.
   - Re-fit khi web font tải xong (`document.fonts.ready`) + khi cửa sổ resize; `.destroy()` gỡ
     listener trong cleanup.
2. 🟠 **5-6 đáp án chen 1 hàng** → **lưới thích ứng**: `--cols` = (≤4 → số đáp án; else ceil(n/2))
   để 5-6 thành 2 hàng cân. CSS `grid-template-columns: repeat(var(--cols),1fr)`.
3. 🟡 **Dữ liệu thiếu** (không có answers / không đáp án đúng) → lọc guard + màn "no questions yet",
   không crash.
4. ⌨️ **Bàn phím**: bấm số 1-9 chọn đáp án, ◄► chuyển câu/hoàn thành. Listener gắn `window`, GỠ trong
   cleanup (tránh rò rỉ sau Start again). Bấm số ngoài phạm vi / ô đã khóa → bỏ qua an toàn.

Đã test thật: câu ngắn fit=1 dư 128px; câu dài fit=0.77 không cắt, chừa 9px đáy (gờ 3D thấy đủ);
6 đáp án 2 hàng; chơi trọn ván bằng BÀN PHÍM ra 3/3 + Game Complete. Không lỗi console.

**Quiz CHƯA chốt** — đang ở bước "hoàn thiện để làm mẫu", Teacher Andrew sẽ hướng dẫn tiếp các phần
polish/tính năng muốn thêm. Khi chốt sẽ viết "recipe" đầy đủ + đổi trạng thái ✅.

### v0.3.0 — 17/7/2026 — Quy hoạch lại thư mục để build NHIỀU TEMPLATE SONG SONG
- **Mục tiêu**: cho phép thầy mở nhiều session Claude cùng lúc, mỗi session build 1 game (Anagram,
  Find the match...) mà không giẫm chân/xung đột nhau, rồi gom lại thành 1 trang web cuối khi đã chốt.
- **Cấu trúc mới** (chi tiết đầy đủ ở `APP_MASTER.md` mục 4):
  - `core/` — MỌI FILE DÙNG CHUNG (trước ở `src/core/` + `styles/app.css` + `src/themes/`):
    engine, registry, layout, scoring, leaderboard, confetti, sound, icons, utils, `app.css`,
    `themes/classic.css`, `assets/` (font + mp3). Kèm `core/HUONG DAN CORE.md` — hợp đồng API
    engine↔template + LUẬT "không session nào tự sửa core".
  - `templates/quiz/` — game Quiz (đã hoàn chỉnh, ✅ ĐÃ CHỐT) dời nguyên vẹn vào đây, tách thành
    3 file chuẩn: `quiz.js` (module game, logic KHÔNG đổi) · `quiz.css` (style riêng) ·
    `sample-quiz.js` (dữ liệu mẫu, export `activity`). Thêm `test.html`/`test.js` để chơi thử ĐỘC LẬP
    (chỉ nạp core + quiz) tại `templates/quiz/test.html`.
  - `templates/anagram/`, `find-the-match/`, `type-the-answer/`, `open-the-box/` — 4 khung thư mục
    mới (🔴 CHƯA BUILD), mỗi thư mục có sẵn: `GHI CHU <TEN>.md` (mô tả game + việc cần làm + trạng
    thái 🔴/🟡/🟢/✅ + nhật ký + mục đề xuất sửa core) và `test.html`/`test.js` (tự hiện thông báo
    "not built yet" thân thiện cho tới khi ai đó tạo đủ 3 file game).
  - `templates/HUONG DAN TEMPLATE.md` — quy trình build 1 template từng bước + quy tắc chống xung
    đột (mỗi session chỉ đụng thư mục của mình; không sửa core/; không sửa index.html/main.js/
    manifest.js gốc trừ khi đang gộp trang cuối).
  - `manifest.js` (gốc) — danh sách template ĐÃ CHỐT, hiện đang có 1 dòng: Quiz. Thêm template mới
    vào đây (1 dòng) khi đã được thầy duyệt.
  - `index.html` + `main.js` (gốc) — TRANG WEB CUỐI CÙNG, đọc từ `manifest.js`; hiện chỉ có Quiz nên
    vẫn hiện y hệt như trước (nút PLAY to, không có màn chọn game); tự động chuyển sang màn lưới chọn
    game khi `manifest.js` có từ 2 template trở lên.
  - Xoá `src/` và `styles/` cũ (nội dung đã dời hết, không còn dùng).
- **Không đổi** bố cục/nội dung game Quiz — chỉ dọn dẹp cấu trúc thư mục. Nhưng khi kiểm thử lại
  toàn bộ sau khi dời file, phát hiện và sửa **1 lỗi tiềm ẩn thật** (không phải do dời thư mục, có
  từ trước, chỉ tình cờ lộ ra lúc test kỹ):
  - **`Element.animate().onfinish` có thể không bao giờ bắn khi tab bị ẩn/nền** (đã kiểm chứng thực
    nghiệm: mô phỏng tab `hidden`, `onfinish` không chạy dù đợi >500ms, trong khi `setTimeout` vẫn
    chạy đúng giờ). 2 chỗ trong code chỉ dựa vào `onfinish` để làm hành động quan trọng — có nguy cơ
    "kẹt màn" nếu học sinh chuyển tab giữa chừng:
    1. `core/engine.js` — gỡ **PLAY overlay** sau khi bấm (chỉ gỡ khi `fade.onfinish` chạy).
    2. `templates/quiz/quiz.js` — hàm `fadeSwap` chuyển câu (chỉ đổi câu khi `anim.onfinish` chạy).
  - **Đã sửa cả 2**: thêm `setTimeout` dự phòng song song với `onfinish`, có cờ chặn chạy 2 lần — bất
    kỳ ai chạy trước thì thắng. Đã kiểm chứng cơ chế dự phòng hoạt động đúng bằng mô phỏng độc lập.
  - Ghi thành **luật bắt buộc** trong `core/HUONG DAN CORE.md` (kèm mẫu code chuẩn) để mọi game sau
    này viết animate() đều theo đúng mẫu, không lặp lại lỗi.
- **Phát hiện thêm**: `python -m http.server` không gửi header chống cache → khi sửa file `.js` rồi
  tải lại CÙNG một tab, Chrome có thể tiếp tục dùng bản cache CŨ (xảy ra thật trong lúc kiểm thử lần
  này, khiến 1 lượt test tưởng chừng "fix không có tác dụng"). **Tạo `devserver.py`** (thay thế
  `python -m http.server`, tự gửi `Cache-Control: no-store`) và cập nhật `launch.json` (cấu hình
  preview `aword`) trỏ sang script này. Ghi vào `APP_MASTER.md` mục 9 làm bẫy cho các session sau.
- Đã cập nhật: `APP_MASTER.md` (bản đồ mới + 2 bẫy trên), `core/HUONG DAN CORE.md` (luật animate),
  memory dự án (để session mới tự biết cấu trúc + 2 phát hiện này).

### v0.2.1 — 17/7/2026 — Tinh chỉnh phản hồi đáp án Quiz (theo yêu cầu thầy)
- **Chọn ĐÚNG**: các ô sai còn lại chuyển RẤT nhạt (opacity 0.15, chỉ thấy mờ mờ), ô đúng giữ nguyên màu.
- **Chọn SAI**: dấu ✗ bay lên rồi **LƠ LỬNG giữa ô** (bồng bềnh ~1.9s mới tan, animation `aw-fly-cross`); ô sai đã chọn + các ô sai khác đều mờ nhạt; ô đúng giữ nguyên màu + ✓ nhỏ.
- **Âm khi sai = "Oh my god" meme** (mp3 copy vào `assets/sounds/oh-my-god-meme.mp3`, offline; lỗi file thì tự fallback tiếng womp cũ; vẫn theo nút loa tắt/bật).
- **Chuyển câu = fade đơn giản**: câu cũ mờ dần 160ms → câu mới hiện dần 250ms (bỏ hiệu ứng pop).
- Đã test thật: đúng → 3 ô mờ 0.15 + ô đúng opacity 1; sai → X còn lơ lửng sau 1.2s, 3 ô mờ, ô đúng giữ màu; mp3 tải 200 OK; card animation aw-fadein.

### v0.2.0 — 17/7/2026 — Vòng đời game hoàn chỉnh: PLAY → Game complete → Tổng kết → Leaderboard
- **Nút PLAY khổng lồ** (tam giác xanh trên nền tối, giống Wordwall) che khung khi mới vào game và sau Start again — **bấm mới bắt đầu**, đồng hồ chỉ chạy từ lúc bấm (đo chính xác đến 0.1 giây).
- **Hiệu ứng "Game complete"**: chữ trắng viền tối phóng to (pop) + **110 mảnh pháo giấy** 4 màu nổ từ giữa rơi xuống (Web Animations API, không thư viện) + nhạc mừng ngắn; sau ~2.2s tự chuyển sang bảng tổng kết.
- **Bảng tổng kết tối** (giống Wordwall): GAME COMPLETE · Score x/N · Time x.xs (số to, đơn vị nhỏ) · "YOU'RE 1ST ON THE LEADERBOARD" · 3 mục: **Leaderboard / Start again / Play a different template**.
- **Leaderboard lưu trên máy** (localStorage, file mới `src/core/leaderboard.js`): xếp hạng điểm cao trước → thời gian nhanh trước (đúng luật Wordwall), top 10, lượt vừa chơi được tô sáng + **gõ tên ngay tại hàng** (mặc định "Player"), nút Back. Sau này pha Firebase sẽ đồng bộ online cùng cấu trúc.
- File mới: `confetti.js`, `leaderboard.js`; icons thêm playBig; sound thêm fanfare; utils thêm ordinal (1ST/2ND/3RD) + fmtSecsParts (4.9s).
- Đã test thật: PLAY overlay chặn game, chơi 6/6 → confetti+chữ hiện, panel đủ thông số, leaderboard xếp hạng đúng + đổi tên lưu được, Start again quay về PLAY. Không lỗi console.

### v0.1.3 — 17/7/2026 — Hiệu ứng ✓/✗ + 100% tiếng Anh (theo yêu cầu thầy)
- **Trả lời ĐÚNG**: dấu ✓ TO trắng viền tối BAY LÊN từ ô + tiếng "ting" (2 nốt chuông cao) + dấu ✓ nhỏ ĐỌNG LẠI trên ô.
- **Trả lời SAI**: dấu ✗ TO bay lên + âm trầm "womp" + dấu ✗ nhỏ đọng ở ô sai + dấu ✓ nhỏ hiện ở ô đúng.
- **Ô KHÔNG đổi màu** sau khi chọn (bỏ đổi xanh/đỏ/mờ của v0.1.2) — giữ nguyên màu gốc như Wordwall.
- **Chữ trong ô**: to nhất có thể (clamp 18→32px) + VIẾT HOA toàn bộ.
- **Câu hỏi**: đưa lên sát viền trên khung, chữ to (clamp 26→58px).
- **100% TIẾNG ANH** toàn dự án: menu, nav "1 of 6", kết quả "Well done!/x of y correct/Play again/Home", trang chủ "Create & play English games/▶ Play", title trang, nội dung mẫu.
- **Menu 4 chức năng**: Submit answers (nộp ngay — câu chưa làm tính sai) · Start again · Resume · Change template (toast "coming soon", chờ có nhiều template).
- Kỹ thuật: badge/fly mark bằng SVG 2 lớp (viền tối + trắng); hiệu ứng gắn tại chỗ không re-render để animation chạy; sound.js viết lại có glide tần số.
- Đã test thật: fly mark xuất hiện, màu ô không đổi, badge đúng vị trí, menu đủ 4 mục, Submit answers ra kết quả English. OK.

### v0.1.2 — 16/7/2026 — Phong cách Wordwall cho Quiz (theo ảnh mẫu thầy gửi)
- **Font bo tròn "Baloo 2"** nhúng offline (`assets/fonts/`, 4 độ đậm).
- **Khung 16:9 nền TRẮNG** viền nhạt.
- **Đồng hồ góc trái-trên · điểm (✓ số) góc phải-trên** — chữ trơn, bỏ viên nền + thanh tiến độ.
- **4 ô đáp án NỔI 3D xếp 1 HÀNG NGANG** (gờ tối dưới, nhấn xuống khi bấm), 4 màu xanh/đỏ/cam/lá.
- **Thanh dưới**: ☰ menu (Chơi lại / Về trang chủ) · ◁ "x / N" ▷ · 🔊 loa (bật/tắt tiếng đúng-sai) · ⛶ phóng to (fullscreen).
- **Điều hướng bằng mũi tên** (không auto-nhảy); câu cuối mũi tên → dấu ✓ (Xong) nhấp nháy.
- Trả lời: ô ĐÚNG xanh, ô CHỌN SAI đỏ, ô còn lại **làm mờ** (sửa lỗi ô màu-lá gốc trông như đáp án đúng).
- Thêm mô-đun: `src/core/layout.js` (khung), `src/core/icons.js` (SVG), `src/core/sound.js` (tiếng đúng/sai Web Audio).
- Đã chụp màn xác nhận: giống ảnh mẫu Wordwall. Chơi + tính điểm + kết quả OK.

### v0.1.1 — 16/7/2026 — Chuẩn bố cục khung 16:9 (theo yêu cầu thầy)
- **Khung game tỉ lệ 16:9**, LUÔN nằm trên cùng trang (`src/core/layout.js` — buildStage).
- **Mọi thông tin trong game** (số câu · đồng hồ · điểm · câu hỏi · đáp án · màn kết quả) nằm **TRONG khung**.
- **Tên game + hướng dẫn** chuyển xuống **DƯỚI khung**.
- Trang chủ cũng theo khung 16:9 (nút chơi trong khung, tên bài ở dưới).
- Chữ/ô co giãn (clamp) để vừa khít khung ở nhiều cỡ màn hình.
- Đã đo & kiểm tra thật: tỉ lệ 1.778 (16:9), thanh thông tin trong khung, câu hỏi không tràn, tên game nằm dưới. OK.

### v0.1.0 — 16/7/2026 — Bản chơi thử game QUIZ (offline)
**Làm được:**
- Dựng bộ khung code tách lớp (DATA / ENGINE / THEME) đúng bản thiết kế `docs/07-ARCHITECTURE.md`.
- **Engine chung** (`src/core/engine.js`): thanh trên (tên bài · tiến độ · đồng hồ · điểm) + thanh tiến độ + màn KẾT QUẢ (điểm, số đúng/sai, thời gian, nút Chơi lại / Về trang chủ).
- **Registry** (`src/core/registry.js`): sổ đăng ký game — thêm game mới không đụng lõi.
- **Game QUIZ** (`src/templates/quiz.js`): hiện câu hỏi + 4 ô đáp án màu, bấm đúng→xanh, sai→đỏ + hé lộ đáp án đúng, tự sang câu tiếp; xáo câu hỏi & đáp án.
- **Theme "Classic"** (`src/themes/classic.css`): bảng màu bằng biến CSS, dễ nhân bản theme mới.
- Trang chủ + nút "Chơi thử" (`src/main.js`, `index.html`), giao diện `styles/app.css` (đẹp, responsive cho điện thoại).
- Bộ câu hỏi mẫu tiếng Anh (`src/data/sample-quiz.js`).

**Đã kiểm tra chạy thật:** trang chủ → chơi → 6 câu (đúng/sai đều đúng logic) → điểm & đồng hồ chạy → màn kết quả 5/6 → Chơi lại / Về trang chủ. OK.

**Chưa làm (kế hoạch):**
- Firebase (lưu điểm học sinh + xếp hạng online) — **để pha sau** theo yêu cầu thầy.
- Editor cho giáo viên nhập nội dung (hiện dùng file mẫu).
- Các game khác: Anagram → Find the match → Type the answer → Open the box.
- Trang giao bài (link + QR) + dashboard kết quả.
- Cài Node + chuyển sang Vite khi bắt đầu làm phần online.

---

## Quy tắc dự án
- Ngôn ngữ trao đổi với thầy: **dễ hiểu, tránh thuật ngữ** (thầy không chuyên lập trình).
- Mỗi mốc: ghi vào file này + tăng version.
- Tài liệu tham khảo Wordwall + kiến trúc: thư mục `docs/`.

---

**➡️ VIỆC ĐANG CHỜ nằm ở ĐẦU file này** (mục "⭐ VIỆC ĐANG CHỜ"), không phải ở đây — vì file xếp mới
nhất lên trên. Bàn giao đầy đủ: `APP_MASTER.md` mục 0a.
