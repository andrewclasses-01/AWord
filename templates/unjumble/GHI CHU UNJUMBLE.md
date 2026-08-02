# GHI CHU — UNJUMBLE (game thứ 11)

**Trạng thái: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy. Chơi thử riêng vẫn được: `templates/unjumble/test.html`.

## ⭐ Đợt 42 (2/8/2026, v0.9.16) — 6 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật, đo DOM, console sạch):
1. **Clue: màu xanh nước biển hiện đại + Regular Italic** (bỏ Bold): `.aw-unj-clue` color `#1799c9`,
   `font-weight:400`, `font-style:italic`. (đo: rgb(23,153,201), weight 400, italic.)
2. **Điểm hiện "N / max"** như template khác: thêm `showScore(val)` in `${✓} ${val} <span.aw-unj-smax>/ max</span>`
   (max = bonus 2×số câu, submit 1×số câu); dùng ở render + pulseScoreTo (thay `ui.setScore`/`markScoreSign`).
   (đo: bonus 1 câu → "0 / 2".)
3. **Thanh trượt Lives như TRUE FALSE**: bật `hasLivesSlot:true` + `normLives` (0/∞, 1–10); slider trong
   Options (mặc định ∞); `renderLives()` tim ở topbar trái điểm; `loseLife()` (tim nảy mất). **Mất 1 mạng
   khi SUBMIT SAI**; hết mạng → `finish("gameover")` (tiêu đề "Game over"). (đo: lives=3 → 3 tim; lives=1 sai
   → "Game over".) ⚠️ Bonus mode không có sự kiện "sai" nên tim không giảm (chủ yếu dùng cho On submit).
4. **Intro: nghiêng nhẹ + zoom (bé→to) rồi mới bay**: `runIntro` phase1 zoom `scale .42→1` KÈM `rotate(-4°)`
   (nghiêng lúc zoom+hold); phase1b `straighten` (−4°→0°, 160ms) để bay đáp CHÍNH XÁC; rồi phase2 mỗi từ bay
   về slogan. (đo: lúc hold có nghiêng; cuối bay dx=0, dy≈0/−1px.)
5. **Submit sai: câu đúng KHÔNG đẩy câu sai lên**: `.aw-unj-reveal` đổi `min-height`→**height cố định**
   (`4.2cqw`) + `flex:0 0 auto` + `nowrap` → luôn chiếm chỗ, rỗng hay đầy cùng chiều cao. (đo: board top
   174→174 khi reveal hiện.)
6. **Submit sai: bỏ ✗ lớn, thay bằng SAO ĐỎ nhỏ quanh câu bay về điểm**: `flyStarsToScore(boardEl, fn, red)`
   (thêm `STAR_RED_SVG`); wrong dùng sao đỏ (−pointsOff), không còn `flyToScore(✗)`. (đo: 12 sao đỏ, 0 ✗ lớn,
   điểm −1 đỏ.)
> File đổi: `templates/unjumble/{unjumble.js,unjumble.css}` (KHÔNG đụng core). Bỏ `markScoreSign` (gộp vào
> showScore). Console sạch. ⚠️ điểm/hiệu ứng bay trễ ~1–1,8s; cần khung xem hiển thị mới thấy hoạt ảnh.

## ⭐ Đợt 41 (2/8/2026, v0.9.15) — 5 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật, đo DOM, console sạch):
1. **Intro nhỏ hơn + giữ lâu + bay nhanh + từng từ đáp ĐÚNG vị trí slogan**: title 16→**12cqw**, sub 5.4→
   **4.2cqw** (vừa màn). `runIntro` viết lại: `ZOOM_MS=460` phóng to, GIỮ tới `FLY_AT=INTRO−520`, rồi
   `FLY_MS=520` mỗi TỪ (span riêng `.aw-unj-introw`) bay về đúng span slogan (`.aw-unj-slogw`) — tính `dx,dy,
   scale` từ rect. Slogan cũng tách 4 span-từ. (đo lúc cuối bay: 4 từ tâm TRÙNG KHÍT slogan, dx=dy=0.)
2. **Bonus: "moves for bonus" → "BONUS" bay về điểm**: `finalizeLiveWord` chụp rect movesEl TRƯỚC khi
   `updateBonusMoves` xóa nó (⚠️ `commitReorder` gọi updateBonusMoves SAU afterDrop nên không set text
   trực tiếp được — phải chụp rect), rồi `flyToScore(rect,"BONUS",1,…)`. `flyToScore` nay nhận cả ELEMENT
   lẫn RECT. (đo: chip "BONUS" bay, điểm banked **2**.)
3. **Submit đúng: sao quanh CẢ CÂU bay về điểm rồi +1 (bỏ ✓)**: thêm `flyStarsToScore(boardEl,…)` — 12 sao
   vàng bung quanh board rồi bay vào điểm, +1. Bỏ ✓ bay + bỏ sao-từng-từ lúc chấm. (đo: 12 sao, điểm +1.)
4. **?/! cuối câu = ô CỐ ĐỊNH khóa ở cuối**: `prepareItem` tách `/[?!]+$/` thành `it.fixed`; `words`/`order`
   KHÔNG chứa nó. renderBoard vẽ ô `.is-fixed.is-locked` cuối (không data-slot), xanh khi giải xong.
   `positionCaret` loại ô fixed khỏi khe → KHÔNG thả được sau ?/!. (đo: "how...story?" → 6 từ + ô "?" khóa
   cuối; kéo vượt phải chỉ tới trước "?"; giải xong "?" hóa xanh.)
5. **. và , luôn dính từ trước khi kéo**: giữ nguyên (tách whitespace → "tea." là 1 ô). ⭐ CHỈ ?/! tách rời.
   (đo: "I like tea." → ô "tea." nguyên khối, không có ô fixed.)
> File đổi: `templates/unjumble/{unjumble.js,unjumble.css}` (KHÔNG đụng core lần này). Bỏ `starBurst` (thay
> bằng `flyStarsToScore`). `sentenceText`/review nay nối `it.fixed` vào cuối câu. Console sạch.
> ⚠️ Điểm cộng/trừ qua flight trễ ~1,2–1,8s; hoạt ảnh cần khung xem hiển thị mới chạy.

## ⭐ Đợt 40 (2/8/2026, v0.9.14) — 11 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · ⭐ CÓ SỬA CORE (opt-in)
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật, đo DOM, console sạch):
1. **Bỏ hẳn watermark "Andrew Classes"** trong nền (xóa `.aw-unj-card::before`).
2. **Thêm slogan "UNJUMBLE IN ANDREW CLASSES"** trên thanh đồng hồ/điểm — sao chép y style Crossword
   (`.aw-unj-slogan`: xám mảnh, spaced uppercase, 1.7cqw, absolute center trong topbar).
3. **Clue xuống dưới slogan**: chuyển clue từ topbar về **ĐẦU card** (`.aw-unj-clue`, 1 hàng, `fitOneLine`
   co font nếu dài). Card flex: clue (đầu) · board (giữa, margin auto) · moves/submit (đáy).
4. **"moves for bonus" xuống vị trí nút SUBMIT** (đáy card) + **màu XANH LÁ** (#1faa6b). Là flex child của
   card nên tự ẩn cùng words lúc intro.
5. **Căn chỉnh**: clue trên · từ giữa · moves/submit dưới — cân đối.
6. **Intro: KHÔNG hiện thành phần câu hỏi nào** (words+clue+moves ẩn theo card `visibility:hidden`; slogan
   `opacity:0`). Tất cả hiện khi intro xong. (đo: giữa intro slogan op 0, card hidden, clue/moves ẩn.)
7. **Intro bàn giao slogan**: chữ "UNJUMBLE / in ANDREW CLASSES" ở frame cuối **thu nhỏ + bay lên vị trí
   slogan** (tính `dx,dy` từ rect slogan), rồi **slogan hiện ra** (fade). ⚠️ Cancel animation slogan trong
   `finishIntro` kẻo skip giữa chừng bị WAAPI fill giữ opacity 0. (đo: sau intro slogan opacity = 1.)
8. **Bỏ dấu ✗ nhỏ trên từng từ sai** (gỡ `.aw-unj-xmark` + `XMARK_SVG`).
9. **Submit sai: dấu ✗ LỚN thu nhỏ + bay về điểm** (dùng `flyToScore(boardEl, icons.markCross, −pointsOff)`).
   Submit đúng: ✓ bay về điểm (+1). (đo: q1 đúng +1, q2 sai −3 → tổng −2.)
10. **Điểm ÂM màu ĐỎ**: `markScoreSign()` bật class `.aw-top-score.aw-unj-neg{color:#e23b45}` (gọi trong
    pulseScoreTo + render). Số "+/-" khi bay cũng đỏ nếu âm (`.afg-num.is-neg`). (đo: −2 màu rgb(226,59,69).)
11. **Show answers TO, ĐỌC ĐƯỢC (theo ảnh)**: ⭐ **SỬA CORE (opt-in)** — thêm `tpl.reviewStyle:"stacked"`;
    `engine.showReview` render danh sách xếp chồng: mỗi câu số·câu·✓/✗ full-width (2.5cqw), câu sai hiện
    dòng bài-làm (đỏ ✗) + dòng đáp-án-đúng (xanh ✓). Tương thích ngược (không cờ = lưới 3 cột cũ). CSS ở
    `unjumble.css` (`.aw-rv-slist/.aw-rv-sitem/.aw-rv-sline`). Ghi ở `core/HUONG DAN CORE.md`. (đo: 2 item,
    câu 1 "I like tea." xanh ✓; câu 2 bài-làm sai đỏ ✗ + "We are here." xanh ✓; chữ 24px.)
> File đổi: `templates/unjumble/{unjumble.js,unjumble.css}` + **`core/engine.js`** (nhánh stacked opt-in) +
> `core/HUONG DAN CORE.md`. Console sạch. Bỏ `showBigMark`/`layoutTopbar`/`topClueEl` (không còn dùng).
> ⚠️ Điểm cộng/trừ qua flight có trễ ~1,2–1,8s; hoạt ảnh cần khung xem hiển thị mới chạy.

## ⭐ Đợt 39 (2/8/2026, v0.9.13) — 8 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật, đo DOM, console sạch):
1. **"N moves for bonus" ẩn trong lúc intro**, chỉ hiện khi chữ xuất hiện: cờ `introActive` (bật trước
   render, tắt ở `finishIntro` rồi `updateBonusMoves`). (đo: giữa intro = rỗng; sau intro = "5 moves for bonus".)
2. **Dấu ✓ khi câu đúng BAY vào điểm**: `finalizeLiveWord` gọi `flyToScore(boardEl, icons.markCheck, 1, …)`
   (thay `showBigMark`+pulse cũ). Gộp `flyScoreGain`→`flyToScore(startEl, iconHtml, points, applyFn)`.
3. **Câu đạt bonus: chữ bonus cũng bay vào điểm**: sau ✓, `setTimeout 300ms` bay tiếp chip **"BONUS"** (+1)
   vào điểm. (đo: giải "I like tea" 1 lượt=tối thiểu → điểm banked **2**.)
4. **Slider "Points off when wrong" (0–5)** trong Options (mkCheck sẵn, slider tự dựng `input[range]`; mặc
   định **1**). mount đọc `pointsOff`; submit sai trừ `pointsOff` điểm. (đo: pointsOff=2, câu sai → điểm −2.)
5. **Watermark "Andrew Classes" hết bị nút SUBMIT đè**: dời từ góc DƯỚI-phải lên **TRÊN-phải** (`top:2.4cqw`,
   `transform-origin:top right`), size 5,6→5cqw. Submit ở đáy giữa nên không còn chạm.
6. **Tính điểm THEO CÂU (không theo từ)**: bonus = 1 (giải) + 1 (bonus) → perfect **2**, thường **1**; submit
   đúng cả câu = **1**, sai = **−pointsOff**. `finish` maxScore: bonus 2×số câu, submit 1×số câu. (đo: submit
   đúng 1 câu → +1; sai → −pointsOff.) ⚠️ submit có phạt nên tổng điểm có thể ÂM (đúng ý "điểm trừ").
7. **Submit sai: mỗi chữ sai có ✗ ĐỎ nhỏ trên đầu chữ** (`.aw-unj-xmark`, `XMARK_SVG`, đặt trên đỉnh ô).
   (đo: câu sai 2 chữ → 2 dấu ✗.)
8. **Clue (câu gợi ý trong editor) hiện 1 hàng trên TOPBAR** cùng hàng đồng hồ/điểm: `.aw-unj-topclue` tuyệt
   đối căn giữa; `layoutTopbar()` đo đồng hồ/điểm + dòng moves rồi **tự co font** để clue LUÔN 1 hàng, không
   chạm. Bỏ clue khỏi card. (đo: clue ngắn 23px căn giữa; clue cực dài tự co ~6–9px vẫn 1 hàng, không chạm.)
> ⭐ Thanh trên nay: đồng hồ (trái) · **moves** (sát sau đồng hồ, tuyệt đối) · **clue** (giữa, tuyệt đối) ·
> điểm (phải). `topbarEl` set `position:relative`; KHÔNG bật `inlineTimerBar` (giữ đồng hồ). Dọn cleanup gỡ
> cả `movesEl`+`topClueEl`.
> File đổi: `unjumble.js`, `unjumble.css` (chỉ trong `templates/unjumble/`). KHÔNG đụng core. Console sạch.
> ⚠️ Hoạt ảnh (bay ✓/BONUS, sao, nảy, intro) + đếm điểm dùng WAAPI/rAF → khung xem PHẢI hiển thị mới thấy
>   chạy; điểm cộng qua flight có độ trễ ~1,2–1,8s (bay xong mới cộng).

## ⭐ Đợt 38 (2/8/2026, v0.9.12) — 6 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật, đo DOM, console sạch):
1. **Intro chữ 2 dòng**: `runIntro` tạo cụm `.aw-unj-intro-text` gồm `.aw-unj-intro-title` "UNJUMBLE" (16cqw,
   to) + `.aw-unj-intro-sub` "in ANDREW CLASSES" (5,4cqw). Cụm nghiêng `rotate(-4deg)` (nghệ thuật). (đo:
   title 155px, sub 52px, matrix xoay -4°.)
2. **Bỏ nền + viền intro**: `.aw-unj-intro { background:none }` (trước là `var(--unj-bg)` che đồng hồ/điểm/
   nút lúc chạy). Nay chỉ còn CHỮ zoom, không che gì. (đo: backgroundImage=none, backgroundColor trong suốt.)
3. **Hàng gần nhau hơn**: `.aw-unj-board --unj-row` 10,5cqw → **8,4cqw** (cơ chế caret vẫn dùng rowH động nên
   chuẩn). (đo: chiều cao ô 101→81px, khoảng cách hàng 81px.)
4. **Submit đúng → chữ xanh + nổ sao**: `doSubmit` gọi `starBurst(t)` khi ô đúng (vòng 6 sao vàng bung ra +
   mờ dần, WAAPI, cỡ theo ô). (đo: đặt 2 chữ đúng rồi submit → 6 sao xuất hiện quanh ô đúng, 2 xanh/6 sai.)
5. **Option "Show answer when wrong"**: thêm `mkCheck` trong `buildExtraOptions` (mặc định BẬT). mount đọc
   `showAnswerWhenWrong`; `render`+`doSubmit` chỉ đổ câu đúng vào `.aw-unj-reveal` khi BẬT + submit sai.
   (đo: BẬT→hiện "My mechanic will fix the bike next week."; TẮT→reveal rỗng.)
6. **Nút Next câu cuối: bỏ ✓, giữ nút nhưng vô hiệu hóa**: `updateNav` đổi `onNext:(!isLast&&canAdvance)?goNext:null`
   + `nextLabel:null` (trước là `isLast?finish:goNext` + `isLast?icons.check`). Nộp bài qua "Submit answers"/
   auto-finish khi xong hết. (đo: câu "2 of 2" → nút Next `disabled=true`, KHÔNG phải icon ✓.)
> File đổi: `unjumble.js`, `unjumble.css` (chỉ trong `templates/unjumble/`). KHÔNG đụng core. Console sạch.
> ⚠️ Sao/nảy/đếm điểm/intro là hoạt ảnh → khung xem PHẢI hiển thị mới thấy chạy (headless thì hình đứng).

## ⭐ Đợt 37 (2/8/2026, v0.9.11) — 9 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu tiếp (đã build + tự test trình duyệt thật bằng script điều khiển kéo-thả, đo DOM, console sạch):
1. **Căn giữa khối chữ theo chiều dọc**: `.aw-unj-board` đổi `margin: auto 0 3cqw` → `auto 0` (đo: tâm khối
   lệch tâm màn 2px).
2. **Watermark "Andrew Classes" không bị cắt "An"**: nguyên nhân chữ 8cqw (~77px) tràn mép trái khung
   (`overflow:hidden`). Giảm còn **5,6cqw** (~54px), `right:4cqw`, `bottom:3cqw`, `rotate(-4deg)` (đo:
   bề rộng chữ 439px, mép trái 624px — thừa chỗ trong khung 178→1102).
3. **Bỏ khung nền chip của chữ**: xóa hết rule chip Classic → chữ trong suốt (chỉ còn hover mờ của rule
   gốc). Khi kéo, clone **KHÔNG có hộp** (`.aw-unj-drag` bỏ `background/border-radius/box-shadow`), phóng
   to **scale(1.14) + nghiêng rotate(-4deg)** + `text-shadow` cho dễ đọc trên nền.
4. **Intro zoom-từ-xa khớp nhạc**: `INTRO_MS=3272` (đo `intro.mp3`=3,27s). `runIntro` viết lại: overlay =
   gradient + chữ **ANDREW CLASSES** (cursive) căn giữa, animate `scale 0.28→1` + mờ→rõ→mờ (zoom từ xa vào,
   chữ nhỏ→to); **ẩn card (words) trong lúc intro** để chỉ thấy nền+chữ, hiện lại khi xong. Chạm để bỏ qua.
5. **Chuyển câu next/back KHÔNG nháy nền**: bỏ `fadeSwap` (fade cũ về 0 rồi mới render mới → lộ nền trần).
   Thay bằng **crossfade**: `render("cross")` giữ card cũ, đè card mới (position:absolute inset:0), card mới
   fade-in (CSS `aw-fadein`) đè lúc card cũ fade-out → không có khung hình nào lộ nền trần. `root` set
   `position:relative` để 2 card đè nhau. (đo: sau nav chỉ còn 1 card, sạch.)
6. **Chỉ tô xanh đoạn ĐẦU đúng liền nhau**: `renderBoard` bonus dùng `greenPrefix(order)` (đếm run
   `order[i]===i` từ đầu); chữ đúng-vị-trí-nhưng-sau-1-chữ-sai **KHÔNG** xanh. (đo thật: thứ tự `0,1,5,3,2,6,4`
   → chỉ slot 0,1 xanh, slot 3 đúng vị trí nhưng KHÔNG xanh ✓). Âm "correct" chỉ kêu khi prefix dài thêm.
7. **Xong câu: tất cả xanh + nảy ăn mừng**: khi giải xong prefix=n nên tất cả xanh; thêm `celebrateBounce()`
   (sóng nảy trái→phải từng chữ, WAAPI). Áp cả submit-đúng-hết.
8. **Dòng "N moves for bonus" ở thanh trên** (giữa đồng hồ↔điểm), **cỡ chữ to hơn** (3cqw vs 2.2cqw), màu
   amber `#e0850f`. Chèn `.aw-unj-moves` vào `.aw-topbar` bằng DOM (KHÔNG bật `inlineTimerBar` vì nó co cột
   đồng hồ về 0 → mất đồng hồ). `= minMoves − moveCount`, giảm mỗi lượt kéo đổi thứ tự, `:empty{display:none}`
   nên tự ẩn khi về 0 / xong câu / mode submit. (đo: 4→3→2, ẩn khi xong.)
9. **Thả chữ bay mượt về chỗ nhận (caret)**: `flyCloneToLanded` — sau khi thả, commit + renderBoard, rồi
   cho clone bay (WAAPI left/top/width + scale/rotate về 1/0) tới đúng ô vừa đáp xuống (ẩn ô thật trong lúc
   bay `DROP_FLY_MS=190ms`). Nếu drop làm XONG câu thì bỏ qua bay (nhường hiệu ứng ăn mừng).
10. **Caret nhạy + ổn định hơn, nhất là đầu/cuối câu**: `positionCaret` viết lại — **loại ô nguồn** khỏi phép
    tính (caret lưu THẲNG chỉ số chèn của mảng-đã-tách, bỏ khâu "full−1" hay lỗi); chọn hàng theo Y với dung sai
    nửa hàng (hết rung nhảy hàng do sub-pixel); `caretDropIndex` chỉ đọc `dataset.insert`. (đo: far-left→insert 0,
    far-right→insert cuối, đúng & ổn định mỗi lần.)
> File đổi: `unjumble.js`, `unjumble.css` (chỉ trong `templates/unjumble/`). KHÔNG đụng core. Console sạch.
> ⚠️ Hiệu ứng đếm điểm/bay dùng rAF nên khi khung xem ẩn (headless) không chạy hình — chỉ là môi trường test.
⏳ CHỜ TEST TOMKO: cảm giác caret + bay-về-chỗ + intro 3,3s + crossfade trên màn cảm ứng 4K.

## ⭐ Đợt 36 (2/8/2026, v0.9.10) — 5 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
Thầy yêu cầu (đã build + tự test trình duyệt thật, 0 lỗi console):
1. **Bỏ hẳn nền ảnh cũ (whiteboard.png 5,3 MB) → nền CSS mới, hiện đại**: gradient sáng nhẹ + 2 vệt màu
   mờ (xanh dương góc trên-phải, xanh lá góc dưới-trái) + watermark **"Andrew Classes"** chữ viết tay
   nghiêng, rất mờ (opacity .07) nép góc dưới-phải. Bỏ dòng kẻ + doodle (gọn, hiện đại). Card trong suốt.
   Nền đặt trên `.aw-stage.aw-unj-active.theme-classic` qua biến `--unj-bg` (intro dùng lại đúng biến này).
   ⚠️ File `img/whiteboard.png` KHÔNG còn được dùng (để lại, chưa xóa — thầy tự quyết).
2. **Font chữ = font chung AWord (Baloo 2)**: `.aw-unj-wtile` + `.aw-unj-reveal` đổi `font-family:inherit`
   (bỏ stack chữ viết tay Segoe Print…, bỏ italic). Từ nay là chip trắng bo tròn mờ nổi nhẹ (chỉ Classic).
   Riêng watermark "Andrew Classes" vẫn dùng font viết tay (yêu cầu thầy).
3. **Con trỏ nháy (caret) chuẩn hơn**: viết lại `positionCaret` — CHỌN ĐÚNG HÀNG theo Y trước, rồi đặt
   vạch vào **CHÍNH GIỮA KHE gần con trỏ nhất** (đo thật: lệch 0px ngay tại khe; bản cũ chọn từ gần nhất
   theo khoảng cách 2 chiều nên đặt vạch ở MÉP từ, lệch tới ~50-60px và hay nhảy nhầm hàng). Phần lệch
   ~nửa từ chỉ còn khi trỏ vào GIỮA một từ (không có khe ở đó) — bản chất chèn từ, không tránh được khi
   giữ "chữ đứng yên".
4. **Options còn 2 chế độ**: bỏ "Every word". Còn **"Words with bonus"** (mặc định) + **"On submit"**.
   ⭐ **Chấm điểm bonus ĐỔI HẲN sang tính theo SỐ LƯỢT KÉO**: mỗi câu có `minMoves = n − LIS(scramble)`
   (số lượt kéo ÍT NHẤT có thể giải — dùng dãy con tăng dài nhất; các từ ngoài dãy này mỗi từ tốn đúng 1
   lượt). Đếm `moveCount` = số lượt kéo LÀM ĐỔI thứ tự. Giải xong câu: `moveCount ≤ minMoves` → **PERFECT**
   bay ra + **2 điểm**/câu; nhiều hơn → **tích ✓ lớn + 1 điểm**/câu. Điểm chỉ cộng KHI XONG CẢ CÂU (không
   còn cộng từng-từ). `finish()` báo điểm trên thang tối đa: bonus = 2×số câu, submit = 1×số từ (giữ cũ).
   "On submit" giữ nguyên cách chơi/chấm cũ (1 điểm/từ đúng).
5. **Bỏ tích ✓ nhỏ mỗi từ**: từ đúng đã xanh, sai (submit) đã đỏ → bỏ hẳn badge nhỏ (`markBadge` +
   2 hằng SVG + CSS `.aw-unj-badge` đã xóa). Vẫn giữ tích ✓ LỚN + PERFECT + hiện câu đúng (submit).

Đã tự test (script điều khiển kéo-thả thật trong trình duyệt, đo DOM — KHÔNG đoán):
- Giải bằng ĐÚNG minMoves → sorted=true, PERFECT hiện, điểm banked = **2**. Giải thừa lượt (5 > minMoves 4)
  → PERFECT không hiện, tích ✓ lớn hiện, điểm banked = **1**. ✓
- Caret: lệch **0px** tại mọi khe; chọn ĐÚNG hàng (kể cả trỏ ở đầu/cuối hàng 2). ✓
- Font `.aw-unj-wtile` = "Baloo 2", fontStyle normal, weight 700; chip trắng .78 bo 1.4cqw. ✓
- Nền: `background-image:none` cho board (hết kẻ), stage = gradient (hết ảnh), watermark opacity .07. ✓
- Options: đúng 2 lựa chọn "Words with bonus" + "On submit". Không còn badge nhỏ nào. ✓
⚠️ Điểm chạy bằng `requestAnimationFrame` nên khi khung xem ẩn (headless) hiệu ứng đếm đứng ở 0 — đây là
   hiện tượng môi trường test, KHÔNG phải lỗi (bấm chuyển câu điểm hiện đúng vì lúc đó ghi thẳng).
⏳ CHỜ TEST TOMKO: cảm giác caret khi trỏ giữa từ; nghe âm; fullscreen 4K; câu dài nhiều dòng.
> File đổi: `unjumble.js`, `unjumble.css` (chỉ trong `templates/unjumble/`). KHÔNG đụng core.

## ⭐ Đợt 35 (1/8/2026, v0.9.9) — 4 chỉnh theo yêu cầu thầy · 🟢 CHỜ THẦY DUYỆT, CHƯA COMMIT · KHÔNG SỬA CORE
> ⚠️ Số đợt: "Đợt 34/v0.9.8" đã bị 1 phiên song song dùng cho **Gameshow** (cùng ngày), nên Unjumble lấy **Đợt 35/v0.9.9**.
Thầy chốt qua AskUserQuestion: nền **chỉ Classic**, đặt ảnh **cover (cắt cho nét)**, intro **đẩy nhẹ ~2.5s**.
1. **Intro zoom + nhạc**: bấm Play → engine phát sẵn `intro.mp3` → lớp phủ `.aw-unj-intro` (chính ảnh
   whiteboard) **đẩy nhẹ** (scale 1.12→1.0 + mờ dần) trong `INTRO_MS=2500`, chạm để bỏ qua, rồi mới vào
   game. Đồng hồ **đứng 0:00 suốt intro** nhờ bật cờ engine `manualTimerStart` (opt-in, KHÔNG sửa core);
   `mount` gọi `ui.startTimer()` khi intro xong (Style khác Classic thì gọi ngay, không intro).
2. **Ảnh làm nền CẢ khung**: `whiteboardgrouped2.png` → copy vào `templates/unjumble/img/whiteboard.png`
   (5,3 MB), đặt làm nền `.aw-stage.aw-unj-active.theme-classic` (`background-size:cover`). `mount` gắn class
   `aw-unj-active` vào stage qua `root.closest('.aw-stage')` (gỡ ở cleanup) — KHÔNG đổi/bỏ class
   `.aw-page/.aw-stage/.aw-below`, an toàn phần nhúng myActivity. Card thành **trong suốt** (bỏ khung đen +
   nền board + doodle SVG) vì ảnh đã có sẵn khung + doodle + chữ "ANDREW WHITE CLASSES BOARD". Điểm/giờ/nút
   nằm đè lên ảnh. Các Style khác (Basic/Classroom/Beach) **giữ nguyên** card tint cũ (CSS gate `.theme-classic`).
3. **Kéo chữ = con trỏ text, chữ đứng yên**: bỏ cơ chế placeholder chèn-dồn realtime (`.aw-unj-ph` gỡ).
   Nay kéo → hiện **thanh nháy dọc** `.aw-unj-caret` ở khe gần nhất (row-aware theo tâm ô), **các chữ KHÔNG
   dời** (chữ nguồn chỉ mờ `.is-dragsrc`), **thả mới chèn** (`positionCaret` lưu chỉ số chèn full-array vào
   `caret.dataset.insert`; `caretDropIndex` quy về chỉ số sau khi tách từ kéo cho `commitReorder`).
4. **Bỏ dòng "Put the words in the right order"**: `render()` chỉ thêm `.aw-unj-clue` khi item CÓ clue
   riêng của thầy (bỏ nhánh generic); `measure()` guard `clueEl` null.
Tự test trình duyệt thật (0 lỗi console): intro scale 1.12→1.0+fade, biến mất ~2.5s, đồng hồ giữ 0:00; kéo →
caret hiện + chữ đứng yên (đo `orderDuringMove === before`) + thả đổi đúng thứ tự + dọn sạch caret/clone;
generic clue mất; đổi Style→Basic bỏ ảnh whiteboard, về Classic có lại.
⚠️ Ảnh 5,3 MB (nền tải 1 lần) — nếu muốn nhẹ hơn sau này có thể nén/resize.
⏳ CHỜ TEST TOMKO: cảm giác caret + kéo trên màn cảm ứng; intro trên 4K; phần bị cover cắt ở mép trên/dưới.
> Sửa tiếp game này thì chỉ đụng `templates/unjumble/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

Dựng lại act Classic của thầy: **https://wordwall.net/resource/116872783/unjumble**, style **Whiteboard**
(thầy chốt Whiteboard = "Classic" cho AWord). Nghiên cứu đầy đủ: `docs/11-UNJUMBLE.md`.

## Cách chơi
Thầy gõ nguyên **câu đúng**; game tách câu thành **các TỪ** và **xáo trộn thứ tự từ** (derangement —
không từ nào ở sẵn đúng chỗ, bắt đầu 0 điểm). Học sinh **kéo-thả từ** để sắp lại thành câu đúng
(kéo thật, chèn vào giữa + cả câu dồn lại — đúng như Wordwall). Từ vào đúng chỗ → **xanh lá**.

Dấu câu dính liền từ cuối ("week." là 1 từ). Chữ = **bút xám #6f7680 nghiêng viết tay** trên **dòng kẻ**;
nền bảng #f6f6f3 trong **khung viền đen** + **doodle góc** (tia sét/sao/chó/người que — vẽ SVG, KHÔNG branding).

## 3 chế độ chấm (Options → Marking) — thầy chốt đủ 3
- **Every word** (`everyword`): chấm từng từ khi vào đúng chỗ (xanh); **1 điểm/từ**.
- **Every word + bonus** (`bonus`, MẶC ĐỊNH): như trên, nhưng nếu giải cả câu mà **mọi lượt kéo đều đặt
  từ vào ĐÚNG nhà** (không lỡ tay) → hiện **"PERFECT"** bay vào điểm + **NHÂN ĐÔI** điểm câu đó.
- **On submit** (`submit`): kéo tự do rồi bấm **Submit** → chấm từng vị trí xanh/đỏ lần lượt (stagger) +
  hiện **câu đúng** nếu có từ sai; 1 điểm/từ đúng.
Thêm option **Alignment** (Left/Centered) căn chữ. Timer/Shuffle/Show answers do engine lo.

## File
| File | Vai trò |
|---|---|
| `unjumble.js` | game: `prepareItem` (tách từ + derangement), kéo-thả pointer (chuột+cảm ứng) chèn+reflow, 3 mode, `flyScoreGain`/`pulseScoreTo`/`fadeSwap`/`finish` (nhân bản Anagram) |
| `unjumble.css` | look Whiteboard (prefix `.aw-unj-`) + doodle + dòng kẻ + editor CSS; theme tint cho Basic/Classroom/Beach |
| `unjumble-editor.js` | editor **Sentence \| Clue** (dán Excel, Swap, Duplicate, kéo sắp xếp) — nhận cả key cũ word/text |
| `unjumble-sound.js` + `sounds/` | 37 mp3 THẬT theme Whiteboard (pickup×8/drop×8/correct×4/fastcorrect×4/incorrect×4/fastincorrect×4/perfect/intro/restart/timesup/gamecompleted) |
| `sample-unjumble.js` | 6 câu mẫu (thì tương lai với "will") |
| `test.html` + `test.js` | trang chơi thử |

## Âm thanh
Bản đồ sự kiện→âm lấy thẳng từ **Audios.json** của theme (không đoán). Nguồn gốc + đủ 41 file
(kèm menu/leaderboard/reveal/nhạc nền) lưu ở `D:\APP AND DATA\AWord-data\Source\Sound effect\UNJUMBLE\`
(+ đồ họa ở `...\Graphic\UNJUMBLE\`). Template chỉ chép 37 file thực dùng.
`tpl.sounds` nối engine: play=intro, restart=restart, timeWarning=timesup, complete=gamecompleted.

## Đã tự test (trình duyệt thật, 0 lỗi console)
- Tách câu đúng ("week." giữ dấu chấm), derangement → **bắt đầu 0 điểm** (đã sửa: bản đầu lọt 5/8 từ đúng sẵn).
- Kéo-thả: hiện placeholder + clone bám con trỏ, thả → đổi thứ tự, **dọn sạch clone/placeholder** (không sót).
- **everyword**: giải "I like tea." → 3 điểm; **bonus perfect**: giải sạch 6 từ → **12 điểm** (×2) + "PERFECT" bay.
- **submit**: submit câu sai → 5 từ đỏ + badge X + **hiện câu đúng** + 0 điểm.
- Căn giữa (align:center) OK, clue tùy chỉnh hiện OK, **Game complete** (ui.finish) chạy OK.
- Style Whiteboard: nền #f6f6f3, khung đen 9px, chữ italic Segoe Print, 4 doodle, dòng kẻ — đúng.

## Đánh đổi / LƯU Ý
- **Kéo-thả insert+reflow**: khi chèn 1 từ, các từ khác đổi vị trí (đúng bản chất Wordwall). Từ đã xanh có
  thể bị đẩy lệch nếu kéo từ khác — học sinh xây câu trái→phải là mượt nhất. **KHÔNG khóa cứng** từng từ đúng
  (khóa + reflow xung khắc chỉ số); cả bàn chỉ khóa khi giải xong.
- **"Perfect" nghĩa là**: mọi lượt kéo đều đưa từ về đúng nhà (giải trái→phải là đạt). Kéo lung tung xong mới
  đúng = không perfect (đúng ý "bonus for perfect").
- **Font viết tay** dùng stack hệ thống `Segoe Print/Bradley Hand/Comic Sans MS/Baloo 2` (offline, có sẵn trên
  Windows TOMKO). Nếu muốn chuẩn 1 font riêng → nhúng woff2 sau.
- Look Whiteboard là **mặc định RIÊNG của Unjumble** (không sửa `core/themes`); đổi Basic/Classroom/Beach chỉ
  re-tint nền/khung/mực + ẩn doodle. Không đụng `core/`.

## ĐỀ XUẤT SỬA CORE (chưa làm — chỉ ghi lại)
- Không cần. Chỉ dùng cờ có sẵn (`ui.finish`, `buildExtraOptions`, `tpl.sounds`, `optionsNeedRestart`).
- (Tùy chọn tương lai) engine có thể expose 1 âm "TimesUp" riêng khi hết giờ đếm ngược — hiện dùng tạm cho
  `timeWarning` (5s cuối).

## CHỜ TEST TOMKO
(a) Cảm giác **kéo-thả trên màn cảm ứng 86"** (nhấc/chèn/dồn có mượt, có hụt tay không).
(b) **Âm thanh** thật (pickup/drop/correct/perfect...) trên loa lớp.
(c) Fullscreen giữ tỷ lệ trên màn 4K.
(d) Câu dài nhiều từ (wrap nhiều dòng) có tràn khung không.
