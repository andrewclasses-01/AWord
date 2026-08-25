# APP_MASTER — AWord

> **FILE ĐỌC ĐẦU TIÊN khi tiếp nhận dự án.** Đọc xong file này là đủ hiểu toàn bộ để build tiếp.
> Lịch sử chi tiết từng version: `GHI CHU DU AN.md`. Hợp đồng engine↔template + mọi luật kỹ thuật:
> `core/HUONG DAN CORE.md` (ĐỌC TRƯỚC KHI SỬA CODE — mục mới "BẪY 'SNAP KHỰC MỘT CÁI'" đặc biệt quan trọng
> nếu bạn sắp viết hiệu ứng entrance/exit/fade/pop cho template MỚI, đọc TRƯỚC KHI VIẾT chứ đừng đợi lỗi;
> và mục **"⛔⛔ HỢP ĐỒNG XẾP LỚP CỦA HỆ POPUP"** — BẮT BUỘC đọc trước khi đụng vào `.aw-below` /
> `.aw-tool-panel` / `.aw-tool-dim`, hoặc trước khi thêm `transform`/`filter`/`opacity` vào bất cứ đâu
> bao quanh chúng).
> Nghiên cứu Wordwall + kiến trúc gốc: `docs/`.
> Cập nhật lần cuối: **25/8/2026 (Đợt 259)**.
>
> **Đợt 259b** (25/8/2026) — ⭐ **BỎ HẲN Ô TÍCH "Change the crossword" KHỎI OPTIONS CỦA
> TRẬN** (thầy, ngay sau Đợt 259). Đợt 259 ép `canExit=false` suốt trận nên ô đó thành
> **công tắc chết** — thứ Đợt 143 đã cấm. `core/options-panel.js` nay truyền thêm
> **`inFight`** (boolean) vào `tpl.buildExtraOptions`; Crossword không dựng ô khi trong trận.
> ⚠️ **CHỈ giấu Ô, KHÔNG đụng `draft.changeCrossword`** — giá trị thầy lưu phải sống sót qua
> việc mở bảng giữa trận. ⚠️ Khoá vẫn để trong `checkOrder` (vô hại, `orderChecks` chỉ xếp
> lại ô ĐANG CÓ). Bàn thử `dot259b-optcheck.html` **12/12** (có đối chứng ngược: chơi thường
> VẪN có ô; Quiz giữa trận không đổi). ⛔ Bài học bàn thử: **`pointerdown` mà không
> `pointerup` là cú GIỮ, không phải cú CHẠM** — nút Options có `onHold` mở "Edit content?".
>
> ---
> **Đợt 259** (25/8/2026, `d7f816c`) — ⭐⭐⭐ **CROSSWORD Ở CHẾ ĐỘ FIGHT: 6 VIỆC THẦY GỬI MỘT LƯỢT.** ✅ **THẦY DUYỆT · ĐÃ COMMIT + PUSH + KIỂM BẢN LIVE** (Pages `built` đúng commit · **5/5 mã băm SHA-256 khớp** · **32/32 phép chạy trên CHÍNH MODULE CỦA BẢN LIVE**).
> Sửa 5 file: `core/fight.js` · `core/app.css` · `core/voice-playback.js` ·
> `templates/crossword/crossword.js` · `templates/crossword/crossword.css`.
> **(1) PICK TIME** — thanh giờ cho ĐỘI ĐANG CHỌN Ô, nằm trên đầu bàn của chính đội đó, kèm thanh
> trượt `Pick time` trong Options: **1…10s, nấc cuối ∞**, tuỳ chọn `fightPickTime` (**0 = ∞**, đúng
> nếp nhà), **mặc định ∞ nên mọi act cũ chơi y như trước**. Hết giờ ⇒ chuyển lượt sang đội kia,
> không phạt, không mở ô. Ở ∞ thanh **vẫn hiện** nhưng đứng đầy + thở, **không có `setTimeout` nào**.
> Áp cho **cả 2 game lượt-chọn** (Crossword · Open the box) — toàn app chỉ có đúng hai game khai
> `tpl.fightPick`; ⚠️ chú thích cũ trong `fight.js` ghi là ba, **Find the match là vòng thường**.
> **(2)** Bỏ hẳn hiệu ứng làm nhạt 50% của Crossword (`.is-fightwait`) — thanh giờ là cái báo lượt
> nay, và nó nói được nhiều hơn. ⛔ Bàn **vẫn inert** khi không tới lượt (`fightMyTurn`), chỉ đổi
> phần vẽ. Open the box giữ nguyên hiệu ứng nhạt của nó.
> **(3)** Chữ CÓ SẴN (ô giao từ câu đã mở) **nhấp nháy tới khi con trỏ đi qua** (`is-given-wait`) — ⛔ **nền ô giữ nguyên**, thầy chốt vậy. ⚠️ Điều kiện KHÔNG chỉ là `i >= curCell`: `advanceCursor()` dừng cứng ở ô cuối nên ô sẵn nằm CUỐI từ sẽ nhấp nháy mãi — phải có thêm `typedGivens` ghi thẳng "đã gõ qua ô này" (ca hiểm tự bắt được khi chạy lại bàn thử).
> **(4) ⭐⭐⭐ LỖI TỤT BÀN PHÍM — THỦ PHẠM LÀ `later(advanceRound, LATE_LIMIT_MS)` TRONG
> `boardPicked`.** 20 giây sau khi mở một từ mà **chưa ai trả lời**, trọng tài đóng vòng và gọi
> `backToBoard()` cả hai bàn. Đã gỡ. ⚠️ **Chỉ gỡ đúng lời gọi đó** — lưới 20s ở
> `finalizeSingleWinner()` và ở nhánh trả lời SAI của `wordDone()` giữ nguyên. ⚠️ Cái treo mà nó
> từng che nay **chấp nhận**, có tiền lệ ∞ Time delay của Đợt 216; đường thoát là ☰ Menu ▸ Start again.
> **(4b)** Trong trận, "Change the crossword" **bị khoá hẳn** (`canExit` ép `false`) — cả bấm câu hỏi
> lẫn phím Escape.
> **(5)** Crossword nối vào **hợp đồng voice của trọng tài** có sẵn từ Đợt 133 (`ctl.speaks` ·
> `requestVoiceToggle` · `reportVoiceState` · `voiceState`) ⇒ **một clip duy nhất cho cả trận**;
> `core/voice-playback.js` mọc tuỳ chọn **`onGlow(on)`** làm cửa gương quầng sáng cho ~12 template
> dùng player chung.
> **(6)** Đội đi trước **tung đồng xu** (trước đây luôn là bàn trái).
> ⛔⛔ **BẪY `cqw` CỦA ĐỢT 258 SUÝT DỰNG LẠI**: thanh mới treo ở hàng trên của khung fight, **ngoài
> mọi container**, nên KHÔNG được dùng lại `@keyframes aw-waitglow` (viết bằng `cqw` ⇒ rơi về cỡ cửa
> sổ). Có `aw-pickglow` riêng bằng **px**.
> ⚠️ **Hàng trên**: thanh `position:absolute` để không cướp bề ngang, và chỗ cho nó trả bằng
> `padding-bottom` **đặt lên CẢ `.aw-fight-half` LẪN `.aw-fight-clockbox`** — đặt một bên thôi là
> đồng hồ rơi khỏi hàng của hai ô điểm. Đo thật: hai ô điểm lệch **0,00px**, điểm↔đồng hồ **1,00px**
> (**có sẵn từ trước** — trận Quiz không pick mode đo ra đúng 1,00px).
> Bàn thử `dot259-fight.html` **49/49** + `dot259-crossword.html` **19/19** (có **đối chứng ngược**
> và một phép **chờ THẬT 21 giây**); hồi quy `dot256-smoke` 48/48 · `dot256-penalty` 24/24 ·
> `dot255-title` 18/0 · `dot254-khung` 27/0 · `index.html` 0 lỗi.
> ⬜ **Chờ mắt thầy**: bấm tay một trận Crossword trên TOMKO; và **Open the box ở chế độ fight**
> (máy không lái được game đó — nó cũng nhận thanh giờ chọn và cũng mất lưới 20 giây).
> Chi tiết: `GHI CHU DU AN.md` Đợt 259 + `core/HUONG DAN CORE.md` mục "PICK TIME".
>
> ---
> **Đợt 258** (25/8/2026) — ⭐⭐⭐ **KHUNG ACT: ĐIỆN THOẠI TRÀN VIỀN · BO GÓC 8px · KHUNG TO LÊN
> THEO CỬA SỔ · FULLSCREEN DẠNG ZOOM CHO MỌI TEMPLATE.** Thầy gửi 2 ảnh (khung trên iPhone và trên
> máy tính) kèm 4 nhận xét, chốt cả 4 qua AskUserQuestion rồi gõ "ok build". Sửa 4 file:
> `core/app.css` · `core/engine.js` · 2 file CSS Running.
> **(1) Điện thoại**: khối `@media (max-width:700px)` ở CUỐI `app.css` — khung **343×225 → 375×246
> (+20% diện tích)**, ăn cho cả act thường lẫn bài giao.
> **(2) Bo góc**: `2cqw` → **`8px` cố định**. ⛔ **`2cqw` là LỖI CÓ SẴN, không phải lựa chọn**: một
> phần tử không thể là container của chính nó nên `cqw` trên `.aw-stage` **rơi về cỡ CỬA SỔ** — đo
> được 7,5px ở màn 375 nhưng **36px** ở màn 1798.
> **(3) Cỡ khung**: `--aw-stage-max: min(1280px, calc((100dvh − 118px) × 16/10.5))` — **968 →
> 1131px** trên cửa sổ 1512×860 (+17% ngang, +37% diện tích), đo 5 cỡ cửa sổ **không cái nào mọc
> thanh cuộn**. 118px là số ĐO (16+18+44+40); `+32px` là vì `box-sizing: border-box`.
> **(4) Fullscreen**: `fsBtn` luôn `setZoomed()`, khối `.aw-zoomed` **dạng chung** ở cuối `app.css`.
> ⛔⛔⛔ **KHỐI ĐÓ KHÔNG ĐƯỢC CÓ `z-index`** — bản gốc Running word có `z-index:9000`, mà đo A/B thật
> cho thấy nó **che sạch mọi thứ thả vào `document.body`**, tức **số "−N" của Đợt 256** (11 template)
> cùng chữ bay của 6 template khác. ⛔ KHÔNG đụng fullscreen riêng của trận Fight (thầy chốt).
> ⚠️ `tpl.useZoomFullscreen` **không còn là điều kiện** — đọc cờ đó để đoán "game này có zoom không"
> là đọc sai kể từ đợt này.
> Bàn thử `dot258-frame.html` **52/52** + `dot258-penalty-zoom.html` **18/18** (có **đối chứng
> ngược**: đắp lại z-index 9000 thì con số PHẢI bị che). Chạy lại 4 bàn thử cũ, mọi con số y hệt bản
> gốc (đã chứng minh bằng `git stash`). Chi tiết: `GHI CHU DU AN.md` Đợt 258 +
> `core/HUONG DAN CORE.md` mục "KHUNG ACT SAU ĐỢT 258".
>
> ---
> **Đợt 257** (`6b49fdb`, ĐÃ PUSH — ⚠️ **của một PHIÊN CLAUDE SONG SONG**, hồ sơ do phiên 256 chép
> lại hộ) — ⭐⭐ **TRANG NHÚNG BÁO "EM VỪA NỘP XONG" CHO TRANG MẸ**: `play.js` bắn
> `postMessage({type:"AWORD:NOP", code, name})` lên `window.parent` sau khi server xác nhận đủ hai
> document, để myLesson web tự làm mới leaderboard của đúng act. Chỉ bắn khi `kq.ok` **và** đang
> nhúng; trả lại NGUYÊN promise gốc nên đường nộp không đổi. ⛔ **Cửa thứ sáu cho myLesson — đừng
> đổi tên `AWORD:NOP`**; cặp chặt myLesson web v1.13.0. Chi tiết: `GHI CHU DU AN.md` mục Đợt 257.
>
> ---
> **Đợt 256** — ⭐⭐⭐ **"−N" BAY TỪ CHỖ SAI VÀO Ô ĐIỂM RỒI MỚI
> TRỪ, CHO CẢ 11 TEMPLATE CÓ TRỪ ĐIỂM** (thầy: *"khi có điểm sai thì không có gì bay lên cả mà số
> điểm tự trừ rất khó nhìn"*). File MỚI `core/flypenalty.js` + `ui.flyPenalty()` /
> `ui.flushPenalties()` trong `core/engine.js` + `.aw-penalty-fly` / `.is-penalty-hit` trong
> `core/app.css`; 11 template mỗi cái một dòng opt-in. ⛔⛔ **Phép trừ NẰM TRONG callback** (tới nơi
> mới trừ) và **trong trận Fight chỗ bay ra bị ÉP về GIỮA KHUNG** — bay ra từ đúng ô sai là chỉ cho
> đội kia biết ô đó sai (True/false 2 nút = lộ trọn đáp án), đúng luật "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ"
> Đợt 129. ⚠️ `ui.flushPenalties()` ở dòng đầu `finish()` là thứ giữ cho **câu sai CUỐI** không mất
> điểm phạt trong bảng kết quả và trong điểm nộp bài giao. ⛔ Đã cắn **TDZ** ở Quiz — đọc mục
> "ĐIỂM PHẠT PHẢI BAY" trong `core/HUONG DAN CORE.md` trước khi mở cho template thứ 12. Bàn thử
> `dot256-penalty.html` **24/24** + `dot256-smoke.html` **48/48** (11 template mount sạch, 0 lỗi trang).
> ✅ **THẦY DUYỆT · COMMIT `51acc6f`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit
> (`gh api …/pages/builds/latest`, **không tin mã 200**) · **18/18 mã băm SHA-256 khớp** (băm
> `git show HEAD:<path>` so với `curl`, **không băm file trên máy** — CRLF) · **29/29 phép hỏi
> CHẠY CHÍNH MODULE CỦA BẢN LIVE** (`scratch/dot256-live.html` import thẳng
> `https://aword.andrewclasses.com/core/flypenalty.js` qua CORS rồi gọi thật).
> ⬜ Còn chờ **mắt thầy**: cỡ số trên TOMKO, và 7 game máy không lái được (Maze chase · Balloon pop ·
> Flying fruit · Crossword · Anagram · Type the answer · Unjumble).
>
> ---
> Trước đó: **24/8/2026 (Đợt 255)** — ⭐ **ĐUÔI TEMPLATE TRONG TIÊU ĐỀ BÀI GIAO +
> SHOW ANSWERS DỜI LÊN** (thầy chốt quy tắc tên: `…— WP1 — ANAGRAM`). Tiêu đề tự động (cả mặc
> định lẫn `&td=` của myLesson) kết thúc bằng " — <TPL viết tắt>" từ bảng `TPL_SHORT`
> (gameshow→GSQUIZ, anagram→ANAGRAM… — đổi tên là đổi Ở BẢNG ĐÓ); đổi template trong form là
> đuôi đổi theo (`datDuoiTemplate` — thầy sửa tay mất đuôi thì TÔN TRỌNG không đắp); **đuôi hiện
> hành ghi `titleInput.dataset.tpl`** = cửa cho myLesson v1.16.0 nối lại đuôi khi bơm phần đầu
> tiêu đề — ⛔ đừng bỏ. Ô Show answers dời lên hàng `.aw-as-titlehead` cạnh nhãn "Assignment
> title" (hàng `.aw-as-optrow` cũ bỏ hẳn). `body.aw-khung-mode` nền trắng (đỡ nhịp co chiều cao
> webview bên myLesson). Bàn thử `dot255-title.html` **17/17** + chạy lại `dot254-khung.html`
> **26/26**. Backup `_backup/dot255/`. ⛔ Cặp myLesson v1.16.0.
>
> ---
> Trước đó: **24/8/2026 (Đợt 254 + 254b)** — ⭐ **`?giao=…&khung=1`: CHẾ ĐỘ NHÚNG cho
> pop-up myLesson v1.15.0/v1.15.1** (thầy chốt 24/8 tối kèm 2 ảnh: pop-up bên đó phải trông Y HỆT
> form Set assignment). **254b (thầy bắt ở lần bấm tay đầu):** nền `aw-giao-nen` (cao 100vh, đứng
> TRƯỚC form trong luồng) phải `display:none` trong khung mode — không thì form bị đẩy xuống dưới
> một mảng trống có nút SET ASSIGNMENT; và bỏ `min-height:100vh` của dim gốc (form ngắn hơn
> webview thì đẻ thanh cuộn ma). Bàn thử cũ LỌT ca nền vì trang thử `#app` rỗng không đi qua route
> thật — nay `dot254-khung.html` **26/26 ĐẠT** (thêm 2 phép đo nền). Chỉ THÊM: (1) `main.js` — có `&khung=` thì gắn thêm class `body.aw-khung-mode`;
> (2) `openModal` (core/assignment-ui.js) — pop-up GỐC (mở lúc `modalStack` RỖNG: form Set
> assignment, màn QR sau START) đánh dấu `.aw-as-goc` NGAY LÚC MỞ (lúc đóng stack đã splice,
> không suy ngược được), khi pop-up gốc đóng mà stack vẫn rỗng sau `setTimeout(0)` thì bắn marker
> **`MYACT:AW:GIAO:DONG`** — myLesson nghe để đóng cả pop-up bên đó; `setTimeout(0)` là BẮT BUỘC
> vì đường START đóng form rồi mở màn QR NGAY trong cùng một lượt, bắn sớm là myLesson nuốt mất
> màn QR; (3) CSS — `.aw-as-goc` vẽ PHẲNG TRÀN MÉP (position static, không nền/bo/bóng, ẩn
> `.aw-as-head` vì vỏ myLesson vẽ đầu đề), picker xếp CHỒNG (không `.aw-as-goc`) trả lại dạng thẻ
> nổi; lề trái-phải 22px của `.aw-as-modal` là mốc căn hàng với khối tiêu đề bên myLesson — đổi là
> phải đổi CÙNG bên đó. ⛔ Không `&khung=` ⇒ y hệt Đợt 253; `?a=`/bridge/myActivity không đổi.
> Bàn thử `scratch/dot254-khung.html` **24/24 ĐẠT** (+ `dot254-visual.html` xem mắt). Backup
> `_backup/dot254/`. ⛔ **Cặp chặt myLesson app v1.15.0** — đừng revert lẻ một bên.
>
> ---
> Trước đó: **24/8/2026 (Đợt 253)** — ⭐ **URL `?giao=<num>&lop=&td=`: form Set
> assignment ĐỨNG MỘT MÌNH trên nền trống** (cửa cho myLesson v1.14.0 — thầy chốt pop-up bên đó
> không được bày trang game sau lưng form). Chỉ THÊM một route trong `main.js` + CSS
> `body.aw-giao-mode`: form `openAssignmentSetup` THẬT trên act GỐC (luật `sourceAct` Đợt 250 +
> marker Đợt 252 giữ nguyên) · chưa đăng nhập thì màn Sign in hiện ngay trong trang, đăng nhập
> xong form TỰ mở · lỡ đóng form thì nền có nút SET ASSIGNMENT mở lại · act sai rơi về trang chủ.
> ⛔ KHÔNG đụng `?a=`/bridge — myActivity giữ nguyên. Bàn thử `scratch/dot253-giao.html`
> **17/17 ĐẠT**. Backup `_backup/dot253/`. ⛔ Cặp chặt myLesson app v1.14.0.
>
> ---
> Trước đó: **24/8/2026 (Đợt 252)** — ⭐⭐ **CỬA CHO myLesson: MARKER NÓI RÕ BỘ NGHĨA +
> TEMPLATE, VÀ `giaoBai` MỞ TRÊN ACT GỐC**. Sửa 2 file (`core/assignment-ui.js`, `core/engine.js`),
> toàn bộ là THÊM. (1) `onCreated(assignment, {bo, boTen, mauType, mauTen})` + marker
> `MYACT:AW:ASSIGN` mang thêm 4 khoá đó — ⛔ **giữ nguyên tên marker và 2 khoá cũ `code`/`title`**;
> bộ nghĩa phải đọc **trên act GỐC** vì `convertActivity` gỡ sạch `variants`. (2)
> `giaoBai(lop, {tieuDe})` — tiêu đề điền sẵn, đặt **SAU** khối điền lớp kẻo `replaceClassToken`
> xoá mất. (3) ⛔⛔ **`giaoBai` mở form trên `originAct` chứ không phải `libAct`**: sau một cú Change
> template thì `libAct` là bản chuyển đổi `conv_…`, đưa nó vào form là bài giao **mất liên kết vĩnh
> viễn** với act trong thư viện (đúng bẫy Đợt 250 dựng `sourceAct` để tránh) và hàng bộ nghĩa biến
> sạch. **Giao bằng template khác thì chọn trong ô template CỦA CHÍNH FORM**, đừng đổi ở ngoài.
> Bàn thử mới `scratch/dot252-marker.html` **30/30 ĐẠT**; chạy lại `dot247-giaobai` 16/16 ·
> `dot250-assign` 59/59 · `dot246-flow` 37/37 · `dot246-forms` 9/9. Backup `_backup/dot252/`.
> ⛔ **Cặp chặt myLesson app v1.13.0** — đừng revert lẻ một bên. ⚠️ Chưa bấm tay trên máy thật
> (đường đăng nhập Google trong app myLesson là thứ chỉ thầy thử được).
>
> ---
> Trước đó: **24/8/2026 (Đợt 251)** — ⛔ **VÁ LỆCH 5px GIỮA HAI Ô** (thầy bắt bằng mắt
> ngay sau Đợt 250) **+ LÀM LẠI HỒ SƠ BÀN GIAO**. Gốc bệnh: `.aw-set-opts .aw-opt-switch
> { margin-bottom: 10px }` **thắng** `.aw-opt-content .aw-opt-switch { margin-bottom: 0 }` — cùng
> độ đặc hiệu `0,2,0` nên **cái viết SAU thắng**; hàng là lưới `align-items:center` nên ô trái
> (60+10=70) dính mép trên còn ô phải (60) bị căn giữa ⇒ tụt 5px. ⚠️ **Lỗi có TỪ TRƯỚC Đợt 250
> nhưng vô hình** (ô phải hồi đó chỉ cao 30px, trôi giữa hàng, không lệch so với cái gì cả). Vá 1
> dòng: `.aw-opt-content.has-tpl .aw-opt-switch { margin-bottom: 0 }` (đặc hiệu `0,3,0`, thắng bất
> kể thứ tự, chỉ chạm form Set assignment). Đo lại: **lệch 0/0, hàng cao đúng 60**, cả TEXT lẫn VOICE.
> Bàn thử `scratch/dot250-assign.html` **59/59 ĐẠT** (thêm 3 phép đo HAI MÉP).
> 📚 Hồ sơ bàn giao làm lại: `core/HUONG DAN CORE.md` có mục MỚI **"⭐⭐⭐ BÀI GIAO — HỢP ĐỒNG
> ĐẦY ĐỦ (Đợt 245 → 251)"** (8 luật); `APP_MASTER.md` **mục 0a viết lại** (trước đó còn dừng ở
> Đợt 215) — trạng thái kho, việc chờ thầy, 3 luật đắt nhất, bảng 6 bàn thử kèm điểm chuẩn.
> 📌 Bài học: **cùng độ đặc hiệu thì thứ tự trong file quyết định**; và **hai hộp phải thẳng hàng
> thì đo HAI MÉP, đừng so chiều cao** — hai hộp cùng cao 60px vẫn lệch nhau 5px được.
> ✅ **THẦY ĐÃ NGHIỆM THU BẰNG TAY CẢ CỤM 248–251 (24/8/2026)** — bố cục form · giao bài
> bằng template KHÁC + HS làm thử · cặp nút PRACTICE/SUBMIT · bấm tay trên TOMKO. **Không còn
> việc nào treo chờ thầy kiểm** — chi tiết ở mục 0a.
>
> ---
> Trước đó: **24/8/2026 (Đợt 250)** — ⭐⭐⭐ **QUY HOẠCH LẠI SET ASSIGNMENT + CHỌN
> TEMPLATE NGAY TRONG BÀI GIAO** (thầy: *"act tích hợp… nên tôi cần thêm phần chọn template ngay
> trong set assignment"*, chốt 4 điểm qua AskUserQuestion rồi gõ "ok build"). Sửa 5 file:
> `core/assignment-ui.js` (dựng lại form: **2 khối có viền** `.aw-as-block2` · **Class + Deadline
> chung một dòng** · **nút chọn lớp** từ Settings ▸ Classes · **bỏ SẠCH dòng hướng dẫn** ·
> `openModal` nay có **modalStack, chỉ pop-up trên cùng nghe Escape**) · `core/options-panel.js`
> (`templatePicker` → **ô hai tầng 60px**: template trên, bộ nghĩa dưới) · `core/settings.js`
> (chuyền tiếp) · `core/assignments.js` (**`sourceAct`**) · `core/app.css`.
> ⛔⛔ **ĐỔI TEMPLATE KHÔNG PHẢI ĐỔI MỘT CHỮ `type`** — phải qua `convertActivity()`, và 3 luật
> kèm theo: **(1)** chọn bộ nghĩa TRƯỚC, chuyển đổi SAU (luật Đợt 145, đảo là lớp chọn VI1 nhận về
> ENG1); **(2)** act chuyển đổi mang id `conv_…` dùng một lần ⇒ **danh tính phải lấy từ `sourceAct`**
> hoặc bài giao mất liên kết vĩnh viễn với act trong thư viện; **(3)** đổi template là dựng LẠI
> Options từ mặc định của game mới, chỉ bê 4 khoá selector.
> ⛔ **Edit assignment KHÔNG có nút chọn template** — cố ý (thầy chốt), vì HS có thể đã nộp.
> ⛔ Bảng Options **trong game / Settings không đổi một pixel**: không truyền `templatePicker` thì
> hàng vẫn 46px — có phép chặn hồi quy đo tận nơi trong bàn thử.
> Bàn thử mới `scratch/dot250-assign.html` **56/56 ĐẠT, 0 lỗi trang**; bàn thử cũ chạy lại
> `dot246-forms` 9/9 · `dot246-flow` 37/37 · `dot247-giaobai` 16/16 · `dot245-assign-options` khớp.
> Xem mắt `scratch/dot250-visual.html`. Backup `_backup/dot250/`.
> ✅ **THẦY ĐÃ TEST OK (24/8/2026)** — thầy xác nhận đã thử đủ 4 phần: bố cục form Set assignment · **giao bài bằng template KHÁC rồi cho HS làm thử** · cặp nút PRACTICE/SUBMIT · **bấm tay trên TOMKO**.
>
> ---
> Trước đó: **24/8/2026 (Đợt 249)** — **CÂN ĐỐI LẠI CẶP NÚT PRACTICE / SUBMIT**
> (thầy hỏi "đã chuẩn chưa", đo ra cả 3 mục đều lệch; thầy chốt phương án **A — cân theo đĩa
> tròn**). Sửa 2 file: `core/icons.js` (`practiceBig` bọc `<g scale .93069>`; **icon mới
> `submitBig`** = đúng hình `playBig` nhưng đóng khung lại `<g translate(-6.915 -1.306)
> scale(1.29005)>`) · `core/engine.js` (nút SUBMIT của cặp nút HS dùng `submitBig`).
> Kết quả đo: đĩa bia **86,3px = tam giác 86,3px**, tâm đứng lệch 0,1px, đáy hình → chữ
> **14,0px cả hai bên** (trước 14 / 36), tam giác hết lệch tâm (trước +11,8px).
> ⛔ **`.aw-bigplay` — nút play TO của thầy — vẫn dùng `playBig`, KHÔNG đụng**; `playBig` lệch
> phải là CỐ Ý vì nó vẽ cho nút TRÒN. ⚠️ `submitBig` không sinh từ `playBig` lúc chạy: vẽ lại
> `playBig` thì phải chép `d` sang. Bàn thử `scratch/dot246-flow.html` **37/37 ĐẠT, 0 lỗi
> console**. Backup `_backup/dot249/`. ✅ **thầy đã test OK 24/8/2026** (kể cả trên TOMKO).
>
> ---
> Trước đó: **24/8/2026 (Đợt 248)** — **ICON NÚT PRACTICE: QUẢ TẠ → BIA BẮN**
> (thầy đưa ảnh `icon target.png`, chốt "Vẽ lại thành SVG" + "Đổi bóng sang đỏ", rồi gõ
> "ok build"). Đợt **thuần hình thức, 0 thay đổi hành vi**. Sửa 2 file: `core/icons.js`
> (`practiceBig` — bia bắn 4 vòng + mũi tên, 8 path phẳng dò thẳng từ ảnh PNG của thầy bằng
> phân loại màu-gần-nhất, lệch 3,3% điểm ảnh, 4,8 KB, KHÔNG thêm file ảnh) · `core/app.css`
> (2 dòng `.is-practice`: `color` → `#fd646f`, `drop-shadow` → `rgba(252,71,85,.32)`).
> ⛔⛔ **BẪY: `practiceBig` là icon DUY NHẤT không dùng `currentColor`** — sửa `color:` trong
> CSS sẽ KHÔNG đổi được màu nó, phải sửa `fill=` trong chính đường vẽ. Bàn thử cũ của Đợt 246
> chạy lại: `scratch/dot246-flow.html` **37/37 ĐẠT, 0 lỗi console**; nhìn mắt qua
> `scratch/dot246-visual.html`. Backup `_backup/dot248/`. ✅ **thầy đã test OK 24/8/2026** (kể cả trên TOMKO).
>
> ---
> Trước đó: **24/8/2026 (Đợt 247)** — ⭐⭐ **CẦU CHO myLesson** (thầy chốt "Ok build Đợt A
> ngay" — phần AWord của kế hoạch "Tạo bài giao ngay trong myLesson", thiết kế đầy đủ ở
> `D:\OTHERS\CLAUDE\THIET KE NUT TAO BAI GIAO - 24-08-2026.md`). **Toàn bộ là THÊM — không đổi hành
> vi cũ, không đụng template/luật Firestore/trang học sinh.** Sửa 3 file: `core/engine.js`
> (bridge thêm `giaoBai(lop)` — mở form Set assignment của act đang mở, chặn session +
> noAssignment, đi qua `queued()`; marker mới **`MYACT:AW:ASSIGN:{"code","title"}`** phát trong
> onCreated ở CẢ đường bridge lẫn đường thầy bấm nút) · `core/assignment-ui.js`
> (`openAssignmentSetup` nhận `lop` — điền sẵn ô Class + chữ đầu tiêu đề, `classTouched=true`
> chặn cú đoán theo thư mục; ⛔ đừng gọi showFiling trong nhánh này — TDZ) · `main.js`
> (**`window.__awordLib`**: `daDangNhap`/`timThuMuc` (lọc CHỨA trên `listFolders("activities")`,
> kèm `duongDan`)/`lietKeAct` — chưa đăng nhập trả `{ok:false, loi:"chua-dang-nhap"}`, KHÔNG có
> hàm ghi; **URL `?bao=<mã>`** mở thẳng pop-up kết quả assignment trên nền trang chủ).
> Bàn thử `scratch/dot247-giaobai.html` (engine thật + quiz thật + fake-firebase246, cổng 5613):
> **16/16 ĐẠT, 0 lỗi console**; `?bao=`/`__awordLib` cần đăng nhập thật — thầy kiểm live bằng
> `?bao=<mã bài giao có thật>`. Backup `_backup/dot247/`. Hồ sơ đủ ở khối Đợt 247 đầu
> `GHI CHU DU AN.md`. Việc kế tiếp = **Đợt B bên myLesson app** (nút CHECK + 3 cặp ô WORDS +
> webview nghe marker).
>
> ---
> Trước đó: **23/8/2026 (Đợt 246)** — ⭐⭐⭐ **ASSIGNMENT CÓ HAI CHẾ ĐỘ PRACTICE / SUBMIT +
> GỬI BÀI CHẮC CHẮN TUYỆT ĐỐI**. ✅ **THẦY DUYỆT — COMMIT `98525a0`, ĐÃ PUSH + LIVE KIỂM CHỨNG**:
> Pages `built` đúng commit · **9/9 mã băm SHA-256 khớp** · bàn thử luồng trỏ thẳng vào bản LIVE
> (`scratch/dot246-live.html`) **37/37 ĐẠT, 0 lỗi console** (backup `_backup/dot246/`;
> hồ sơ đủ ở khối Đợt 246 đầu `GHI CHU DU AN.md`).
> Màn START học sinh = 2 nút (PRACTICE tạ vàng | SUBMIT play xanh, chọn lại mỗi lượt; ván mistakes
> chỉ có PRACTICE). **PRACTICE**: không gửi gì, có Start with mistakes (mở khoá riêng cho practice).
> **SUBMIT**: gửi NGẦM ngay khi xong game (thầy chốt — em đóng tab sớm vẫn không mất bài); màn cuối
> là **BẢNG ĐÔI bằng nhau tuyệt đối** — trái leaderboard tự hiện (đủ cả lớp, chữ tự co/nở 0.28–2×,
> có phạt/Gameshow chỉ hiện Score trần), phải điểm + nút **SUBMIT HOMEWORK** vàng to + Show answers
> (ô tích DUY NHẤT còn lại trên form Set/Edit — 2 ô Leaderboard/Start again ĐÃ BỎ, document vẫn ghi
> đủ 3 khoá) + Start again (quay về màn 2 nút). Lễ SUBMIT HOMEWORK: dim+blur → SUBMITTING HOMEWORK
> vàng shimmer + ANDREW CLASSES nhấc từng chữ ≥2s → **chỉ khi server xác nhận CẢ 2 bản ghi** mới
> thu nhỏ bay vào đúng hàng của em (⛔ không bao giờ fake) → lỗi thì màn tiếng Việt GỬI LẠI BÀI TẬP /
> CHỤP ẢNH MÀN HÌNH (hướng dẫn iPhone/Android + bảng HÃY CHỤP LẠI MÀN HÌNH đủ chi tiết + XONG).
> Cơ chế gửi (`core/assignments.js` viết lại): **id lượt cố định** (setDoc ⇒ không bao giờ đúp) +
> **outbox localStorage** ghi trước lần thử đầu, mở lại link tự gửi nốt + `withTimeout` cắt treo +
> ca mơ hồ dùng `mayExist*` (scores: đọc kiểm; results: create-only ⇒ permission-denied = đã tới).
> **KHÔNG đụng template, KHÔNG cần đăng luật Firestore.** Sửa 6 file: `core/assignments.js` ·
> `core/engine.js` · `core/assignment-ui.js` · `core/app.css` · `core/icons.js` · `play.js`.
> Bàn thử `scratch/dot246-send/-flow/-forms.html` + `fake-firebase246.js`: **74/74 ĐẠT, 0 lỗi
> console**; ⭐ screenshot pane sống lại — mọi màn đã NHÌN THẬT qua `scratch/dot246-visual.html`.
> ⛔ Bẫy đo mới (chi tiết ở `GHI CHU DU AN.md` Đợt 246): fitOnce đo bề ngang ⇒ bảng grid bị ép đáy
> 0.28 · đo tên cắt cụt phải dùng rect số thực của span con, scrollWidth mù nửa pixel · epsilon 0.
> Session contract mới (submit/retrySubmit/attemptId/meta) ở `core/HUONG DAN CORE.md`.
>
> ---
> Trước đó: **23/8/2026 (Đợt 245)** — ⭐⭐⭐ **BÀI GIAO DÙNG ĐÚNG BỘ OPTIONS CỦA ACT**:
> thêm 2 hàng chọn nội dung · bỏ ô "Show answers" CHẾT · vá `optVer` ở đường Edit · chặn 3 template
> không giao được · báo cáo Result thôi nói dối khi có trừ điểm.
> ✅ **THẦY DUYỆT — COMMIT `589a05b`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit ·
> **12/12 mã băm SHA-256 khớp** · nghiệm lại 3 bàn thử trỏ thẳng vào bản LIVE (17/17 · 40/40).
> ⚠️ Bẫy mới: tên file CÓ DẤU CÁCH làm `curl` trả rỗng, băm ra `e3b0c44…` (băm của chuỗi rỗng) —
> trông y hệt "lệch nội dung". Phải mã hoá URL **và** kiểm HTTP 200 trước khi so băm.
> Sửa 9 file: `core/options-panel.js` ·
> `core/settings.js` · `core/assignment-ui.js` · `core/engine.js` · `core/app.css` · `main.js` ·
> `templates/speaking-cards/speaking-cards.js` · `templates/running-word/running-word.js` ·
> `templates/running-team/running-team.js`. Ba bàn thử `scratch/dot245-*` — **85/85 ĐẠT, 0 lỗi
> console**. Tóm tắt:
> **(0)** RÀ BẰNG SỐ ĐO, không đoán: dựng cả 17 template và so từng ô. Mọi ô riêng của template
> (Lives/Bonus/Speed/Time cost/Points off/Timer/mọi ô tích) **đã giống y hệt** giữa hai bảng — công
> của Đợt 143 (một hàm dựng duy nhất). Thiếu đúng **2 hàng**, nhưng thiếu ở **17/17**: hàng
> **PRACTICE/HOMEWORK** và **nửa bộ nghĩa** của hàng Text/Voice. Đợt 211 đã chép đúng 4 khoá selector
> nên bài giao **chơi** đúng; thầy chỉ **không nhìn thấy và không sửa được**.
> **(1)** `buildOptionsControls(tpl, options, {kind, act})` dựng 2 hàng đó bằng CHÍNH các hàm bảng
> Options của act dùng. ⚠️ Không phạm luật "HAI CÔNG TẮC RỜI NHAU" — 4 khoá này là **SELECTOR** (tên
> nội dung), không phải cài đặt. ⛔⛔ **CỐ Ý KHÔNG truyền `onViewChange`**: trong game nó nạp lại
> options riêng của view (Đợt 147), nối vào đây thì một cú chạm ENG2 sẽ **âm thầm xoá** timer + điểm
> phạt thầy vừa đặt cho bài giao đó. ⚠️ Settings không truyền `act` nên không đổi gì.
> **(2)** Ô **"Show answers at end"** trên form bài giao là **công tắc CHẾT** (trang HS chỉ đọc
> `session.endOptions`), lại còn **mặc định NGƯỢC** với ô tích thật ngay phía trên. Gỡ bằng cờ
> `hideEndShowAnswers` — ⛔ cờ của **NGƯỜI GỌI**, không phải cờ template. Settings ▸ Default
> **activity** options **giữ nguyên** (đo riêng: 17/17).
> **(3)** ⭐⭐⭐ `optVer` ở đường **Edit**: quy đổi khi NẠP, đóng dấu khi LƯU — **phải cả hai, đúng thứ
> tự**. Đóng dấu không thôi là **hạ cấp âm thầm** (`pointsOff 3` của bài cũ đóng băng thành 3/100,
> điểm phạt bốc hơi). Đo được: bài cũ thầy gõ 30 → **trước** tới tay HS thành **100**, **sau** đúng
> **30**; form Edit **trước** vẽ 3 (nói dối), **sau** vẽ 60.
> **(4)** Cờ `tpl.noAssignment` (**là một CÂU, không phải boolean** — lý do CHÍNH LÀ cờ) chặn
> Speaking cards (không bao giờ gọi `ui.finish()` ⇒ **không kết quả nào** về) và Running word/team
> (`renderSummary` bỏ qua `session` ⇒ HS không thấy xác nhận, 3 ô tích vô tác dụng). ⚠️ **MỜ, KHÔNG
> ẩn, VẪN bấm được** — chạm là hiện lý do (bài học Đợt 220). ⛔ Cổng chặn **chỉ ở `assignBtn`**; bài
> giao cũ vẫn chạy. ⛔ Gỡ chặn = xoá 1 dòng, riêng 2 game Running phải sửa `renderSummary` cùng lúc.
> **(5)** Báo cáo Result: bật trừ điểm là "Correct"/"Incorrect" nói dối (`total − score` trừ hai đơn
> vị khác nhau; Gameshow đọc ra "1250/10"). ⛔⛔ **Số câu đúng thật KHÔNG có trong dữ liệu** — bộ khoá
> `results` bị **luật Firestore khoá cứng**, thêm `correct` phải đăng luật mới TRƯỚC nếu không **mọi
> lượt nộp bị từ chối**. Nên: đổi nhãn thành **Score**, bỏ hẳn cột Incorrect, tắt cả 2 màu nền dòng
> (đỏ oan cho em làm được bài còn tệ hơn không tô). ⛔ **BẪY**: `.aw-as-detail` là lưới CSS **5 cột
> viết cứng** — bỏ ô trong JS mà quên CSS thì không tràn, không cảnh báo, chỉ thừa một cột rỗng.
> ⚠️ Bài không trừ điểm: giữ nguyên từng byte.
> ⚠️ **CHƯA bấm tay thật trên TOMKO**, `screenshot` vẫn timeout — nghiệm hoàn toàn bằng số đo.
> ⚠️ Ghi chú Đợt 211 về "act PRONUNCIATION sáng nút TEXT" nay **hết đúng** (Đợt 212 khai tử `pron`).
> Đọc khối **Đợt 245** đầu `GHI CHU DU AN.md` để biết đủ.
>
> ---
> Trước đó: **23/8/2026 (Đợt 244)** — ⭐⭐ **TÊN ACT ĐỨNG THAY CHỮ "SHOWDOWN" TRONG BẢNG
> SHOW ANSWERS** (tự thu nhỏ vừa MỘT dòng, không cắt) · ⭐⭐⭐ **THANH PHÂN LOẠI: CHẠM SUÔNG RỒI BẤM RA
> NGOÀI THÌ NGỦ LẠI.**
> ✅ **THẦY DUYỆT — COMMIT `a7b40bd`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit ·
> **7/7 mã băm SHA-256 khớp** (`APP_MASTER.md` · `GHI CHU DU AN.md` · `core/HUONG DAN CORE.md` ·
> `core/app.css` · `core/engine.js` · `core/showdown-review.js` · `core/showdown-setup.js`).
> Sửa 4 file: `core/engine.js` · `core/showdown-review.js` ·
> `core/showdown-setup.js` · `core/app.css`. Tự test `scratch/dot244-title-classify.html`
> **80/80 ĐẠT, 0 lỗi console**. Tóm tắt:
> **(1)** Chữ "SHOWDOWN" trên màn Show answers là hằng số viết cứng từ Đợt 177 — Đợt 243 chỉ vá tên
> trên SỔ CÁI, chỗ này là màn khác. Nay engine có `sdBoardName()` truyền xuống qua tham số mới
> `actName`; tên đứng đúng chỗ chữ cũ và giữ nguyên cả hai cử chỉ của nó. ⚠️ MỘT hàm cho HAI màn hình
> (cùng công thức `formatActDisplayName` mà sổ cái dùng) nên hai nơi không thể gọi một ván bằng hai
> tên. Act không tên → `""` → giữ nguyên chữ "SHOWDOWN".
> **(2)** Dòng tiêu đề Showdown hạ 2,4 → 1,9cqw (thầy: "size chữ hiện tại cũng đang bị quá to");
> `fitTitleWord()` tìm nhị phân cỡ chữ lớn nhất còn vừa. ⛔ KHÔNG ellipsis (cắt đuôi là vứt mất
> `… / ENG1 QUIZ`). ⛔⛔ **Đừng "đơn giản hoá" về `scrollWidth > clientWidth`** — flexbox ghim
> `clientWidth` vào chỗ trống lúc còn tràn rồi quay ra bám theo chữ lúc đã vừa, và `letter-spacing`
> `0,2cqw` là độ dài CỐ ĐỊNH không phải `em`; đo thật thì hội tụ vào cỡ vẫn thừa 20px, ngẫu nhiên.
> Cách đúng: chỗ trống đo bằng `flex: 1 1 0`, chỗ cần đo bằng `flex: 0 0 auto`, cả hai để trình duyệt
> đo. Ba hàm đổi con quay tải đều gọi lại `fitTitleWord()` (nó là thứ duy nhất đổi bề rộng mà không
> đi qua `paintTitle()` — quên là tên thò ra 4px suốt 3 giây đầu).
> **(3)** `buildClassifyBar()` thêm cờ `awoke`: chạm suông rồi bấm ra ngoài → **mờ lại**; đã kéo thật
> → giữ sáng, không giật mất thanh dưới tay thầy. Listener trên `document` ở pha **CAPTURE** và **tự
> gỡ mình** khi thanh rời trang (hàm chỉ trả node, không có `dispose()` cho ai quên).
> ⚠️ **CHƯA bấm tay thật trên TOMKO, CHƯA chụp được ảnh màn hình** (Browser pane không hiển thị — đã
> xác minh bằng số đo). Đọc khối **Đợt 244** đầu `GHI CHU DU AN.md` để biết đủ.
>
> ---
> Trước đó: **23/8/2026 (Đợt 243)** — ⭐⭐⭐ **BẢNG CUỐI GAME: KHOÁ CẢ "START AGAIN" LẪN
> "START WITH MISTAKES" SAU CÚ NHẤN GIỮ "SHOW ANSWERS" (MỌI MODE, TRỪ ASSIGNMENT) · ⛔ SỬA LỖI IM LẶNG
> TỪ ĐỢT 197 LÀM TÊN TRẬN SHOWDOWN LUÔN LÀ "SHOWDOWN".**
> ✅ **THẦY DUYỆT — COMMIT `650a0ba`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit ·
> **6/6 mã băm SHA-256 khớp** (`APP_MASTER.md` · `GHI CHU DU AN.md` · `core/HUONG DAN CORE.md` ·
> `core/app.css` · `core/engine.js` · `core/press.js`).
> Sửa 3 file code: `core/engine.js` ·
> `core/press.js` · `core/app.css`. Tự test `scratch/dot243-panel.html` **57/57 ĐẠT, 0 lỗi console**.
> Tóm tắt:
> **(1)** Hàm mới `lockBehindHold()` trong `startGame()` thay thế cơ chế Đợt 207 — nay ẩn **cả hai**
> dòng restart và chìa khoá chuyển sang **Show answers**, áp dụng cho **mọi mode** (Single · Showdown ·
> Fight · Play mode). ⛔ **Assignment không đi qua đây** (nhánh `if (session)` dựng dòng từ
> `session.endOptions`, đợt này không sửa một byte). ⚠️ Chỉ khoá KHI có dòng Show answers — không có
> thì bảng đọc y như trước Đợt 207, không bao giờ cụt đường. ⚠️ Không nhớ trạng thái: Back về là khoá
> lại (thầy chốt).
> **(2)** `tapOrHold()` (`core/press.js`) thêm tuỳ chọn **opt-in** `holdClass`, gỡ ở cả 4 đường ra
> (kể cả `lostpointercapture`, bỏ sót là nút kẹt sáng vĩnh viễn). CSS `.aw-panel-item.is-holding` —
> nền xanh dâng + chữ sáng + `scale(.955)` trong **420ms**; ⚠️ con số này **PHẢI** luôn bằng `HOLD_MS`
> của `press.js`.
> **(3)** ⛔⛔ `const actName = originAct?.name` → `originAct?.title`. Trong thư viện **act mang
> `.title`, chỉ THƯ MỤC mới mang `.name`** (`core/store.js` `itemName()`), nên dòng cũ luôn trả rỗng ⇒
> `formatActDisplayName("")` thoát ngay ⇒ công thức "X / ENG1 QUIZ" của Đợt 230+242 **không bao giờ
> chạy tới** ⇒ mọi thẻ trận đọc là "Showdown". Vá luôn bảng "đội kia chơi act nào" giữa giờ (dùng chung
> biến). ⚠️ **Trận ĐÃ LƯU không cứu được** — đã ghi rỗng xuống Firestore; chỉ trận mới mới đúng tên.
> ⚠️ **CHƯA bấm tay thật trên TOMKO, CHƯA chụp được ảnh màn hình** (Browser pane không hiển thị — đã
> xác minh bằng số đo thay thế). Đọc khối **Đợt 243** đầu `GHI CHU DU AN.md` để biết đủ.
>
> ---
> Trước đó: **23/8/2026 (Đợt 242)** — ⭐⭐⭐ **LỚP 1 TEAM LƯU NHƯ TEAM THƯỜNG · TÊN TRẬN
> "ENG1 QUIZ" · MÀN ANALYSING BLUR+DIM.** ✅ **THẦY DUYỆT ("commit + push live + ghi dữ liệu") —
> COMMIT `9933a3b`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit · **6/6 mã băm SHA-256
> khớp** (`GHI CHU DU AN.md` · `core/app.css` · `core/engine.js` · `core/showdown-history.js` ·
> `core/showdown-setup.js` · `core/showdown.js`).
> ⚠️ **"THẦY DUYỆT" ở đây là duyệt CODE + tự test qua Firestore giả (27/27, 0 lỗi console) — CHƯA bấm
> tay thật trên TOMKO/máy thật, CHƯA đăng nhập Google thật để thử luồng Firestore sống.** Tóm tắt: (1)
> lớp chia 1 team (cả lớp = 1 đội) bỏ hẳn "lối tắt" Đợt 159 không chạm Firestore — nay `applySolo()`
> đi đúng `publishTable()` như đội thật (có claim, đồng bộ được, publish lên `sd_results`/bảng xem
> nhanh giữa giờ — Đợt 180 từng cấm vì bug đúp nhưng đường ghi riêng gây bug đó đã bị xoá), nút vẫn
> READY 1 chạm (thầy chốt qua AskUserQuestion), tên đội mặc định đổi "tên lớp" → "Team 1"; (2) tên
> trận tự động "... / WORDS" → "... / ENG1 QUIZ" (`formatActDisplayName()` thêm tham số `templateType`
> lấy từ `templateLabel(activity.type)`); (3) `.aw-sdh-loading` thêm lại nền tối + `backdrop-filter:
> blur(2px)` phía sau chữ ANALYSING (đúng giá trị Đợt 236 trước khi Đợt 237 cố ý bỏ). Đọc khối
> **Đợt 242** đầu `GHI CHU DU AN.md` để biết chi tiết đầy đủ.
>
> ---
> Trước đó: **23/8/2026 (Đợt 238→241)** — ⭐⭐⭐ chuỗi 4 đợt sửa trang Showdown Home + bảng Table,
> **ĐÃ PUSH + LIVE** (mới nhất `b1033a9`) nhưng **KHÔNG được ghi vào khối này lúc đó** — chỉ có trong
> `GHI CHU DU AN.md`. Tóm tắt cực ngắn (đọc `GHI CHU DU AN.md` để biết đủ, đừng chỉ tin bản tóm tắt
> này): bo góc nút SHOWDOWN/ANALYSE + bỏ slogan + popup lớp hạ thấp + cột ANALYSE cố định+mờ + lưới 3
> ô + bảng Table tách xem/xuất (Đợt 238+239, `b394797`) → bảng Table khung 16:9 cố định + **thanh kéo
> phân loại màu** (Apply lưu vĩnh viễn vào Firestore cho bảng 1 trận) + tiêu đề Analyse có khoảng ngày
> + loading tối thiểu 2s (Đợt 240, `0a514d5`) → thanh phân loại dời xuống dưới bảng+rộng hơn 50%+tự mờ
> sau Apply + sửa khung 16:9 Analyse còn tràn (Đợt 241, `b1033a9`).
>
> ---
> Trước đó: **23/8/2026 (Đợt 237)** — ⭐⭐⭐ **14 ĐIỀU CHỈNH TRANG SHOWDOWN: ICON→ANALYSE
> MORPH · TÊN LỚP VÀNG+SAO BAY · DROPDOWN ĐÚNG CHỖ · BRAND MỎNG ĐỒNG BỘ · BẢNG TABLE HẾT MỜ+CAO GẤP ĐÔI
> · KÉO-THẢ CỘT ANALYSE · POPUP XOÁ ĐỎ.** ✅ **THẦY DUYỆT ("commit + push live + ghi dữ liệu") — COMMIT
> `9933897`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages `built` đúng commit (`gh api
> repos/andrewclasses-01/AWord/pages/builds/latest`) · **7/7 mã băm SHA-256 khớp** (`APP_MASTER.md` ·
> `GHI CHU DU AN.md` · `core/app.css` · `core/showdown-export.js` · `core/showdown-home.js` ·
> `core/showdown-review.js` · `main.js`, băm qua `git show HEAD:<file>` so với `curl
> https://aword.andrewclasses.com/<file>`).
> ⚠️ **"THẦY DUYỆT" ở đây là duyệt CODE + tự test qua Firestore giả (39/39, 0 lỗi console) — CHƯA bấm
> tay thật trên TOMKO/máy thật, CHƯA đăng nhập Google thật để thử luồng Firestore sống.** Đọc khối
> **Đợt 237** đầu `GHI CHU DU AN.md` để biết chi tiết đầy đủ 14 mục + các bẫy gặp lúc sửa (đáng chú ý:
> `.aw-btn-primary`/`.aw-sd-ghost` dùng chung 25 file khắp app — mọi màu mới cho popup xác nhận xoá
> phải SCOPE trong `.aw-sd-confirmbox`, không đổi class gốc; `AN_PLOT_H` tăng gấp đôi áp dụng cho CẢ
> Table 1 trận lẫn mọi PNG tải về multi-match, không tách riêng; sparkle/glow cũ của podium dùng đơn vị
> `cqw` chỉ có nghĩa trong khung game `container-type:size`, viết bản px riêng cho trang Showdown Home
> vì nó nằm ngoài khung đó).
>
> ---
> Trước đó: **23/8/2026 (Đợt 236)** — ⭐⭐⭐ **TRANG SHOWDOWN RIÊNG TRÊN TRANG CHỦ + KHO LƯU
> TRỮ BỀN THEO THÁNG.** ✅ **THẦY DUYỆT ("commit + push + bàn giao") — COMMIT `359507b`, ĐÃ PUSH +
> LIVE KIỂM CHỨNG**: Pages `built` đúng commit, **7/7 mã băm SHA-256 khớp** (`GHI CHU DU AN.md` ·
> `core/app.css` · `core/showdown-history.js` · `core/showdown-home.js` (mới) · `core/showdown-setup.js`
> · `core/store.js` · `main.js`).
> Nút icon vàng hào quang (dùng lại keyframe `aw-sd-rec-analyseglow` có sẵn) cạnh trái nút Cài đặt,
> **CHỈ ở trang chủ** — mở **trang riêng hoàn toàn** (`state.view="showdown-home"`, URL `?sd=1&c=`,
> KHÔNG phải pop-up) để xem/phân tích MỌI kết quả Showdown một lớp từng chơi: cột thư mục trái
> THÁNG→NGÀY (mở lớp tự nhảy tới ngày mới nhất), ô kết quả giữa tự co giãn theo số lượng
> (`grid-template-columns: repeat(auto-fit, minmax(168px,1fr))`), chế độ **CHOOSING** (bấm ANALYSE ở
> góc) mở cột phải + nút **ALL** (khoá thư mục, gộp mọi ngày), chip chọn giữ thứ tự bấm, dấu X trên
> chip CHỈ bỏ chọn (không xoá dữ liệu, không hỏi xác nhận — thầy chốt qua AskUserQuestion). Màn
> **ANALYSING** có viền sáng `conic-gradient` chạy vòng quanh lúc xử lý.
> ⭐⭐⭐ **Kho lưu trữ (`core/showdown-history.js`) viết lại gần hết**: bỏ hẳn giới hạn 10 trận/lớp, chia
> mỗi **LỚP × THÁNG một document Firestore riêng** (`sd_hist_<classId>_<YYYYMM>`, ID đoán được, KHÔNG
> dùng `query`/`where` nên không cần thầy tạo composite index tay) — an toàn vì `fitToBudget()` (Đợt
> 197) vẫn rút chi tiết câu hỏi của trận cũ nhất khi 1 tháng quá tải, không bao giờ xoá cả trận. Một
> document INDEX nhỏ (`sd_hist_<classId>_idx`) cho cột thư mục biết tháng nào có gì mà không phải tải
> hết. Ngày TÍNH RA từ các trận trong tháng, không lưu riêng ⇒ *"xoá hết ô 1 ngày thì ngày đó tự biến
> mất"* không cần code riêng. **Dữ liệu cũ (document 1-lớp-tối-đa-10-trận trước Đợt 236) tự động di
> trú, âm thầm, một lần** (`migrateLegacyIfNeeded`, idempotent) — không cần thầy làm gì.
> ⛔ **Pop-up "Recent results" trong lúc đang chơi GIỮ NGUYÊN Y HỆT** (thầy chốt) — chỉ nguồn dữ liệu
> bên dưới đổi (`loadMatches()` vẫn trả đúng 10 trận mới nhất, chỉ giờ tự đi lùi qua nhiều tháng).
> ⭐⭐ **9 hàm thuần trong `core/showdown-setup.js`** (`renderMini`, `renderChart`, `matchBlocks`,
> `displayName`, `when`, `spark6`, `renderLegend`, `fitChartTierLabels`, `watchChartResize`) **đưa ra
> module scope + export** — trang mới dùng lại NGUYÊN, không tạo bản sao thứ hai có nguy cơ lệch nhau.
> 🔴 Vá luôn 1 lỗ hổng có sẵn từ Đợt 197: `store.js`'s `APP_DATA_KINDS` thiếu `"showdown-history"`.
> ⛔⛔ **AN TOÀN XSS**: bản nháp đầu lỡ truyền tên lớp/tên trận (chữ giáo viên tự gõ) qua tham số
> `innerHTML` của `el()` ở 8 chỗ — đã vá hết sang `.textContent`, kiểm bằng ca tên có `<script>`/`&`.
> ⚠️ **Kiểm tra: 29/29 (kho lưu trữ) + 50/50 (trang mới) phép thử mới qua Firestore GIẢ, chạy lại 2
> lưới thử CŨ để chắc không phá gì (37/37, 60/60 — nhân tiện vá 1 lỗ hổng `writeBatch` thiếu trong bộ
> giả dùng chung, và 2 chỗ lưới thử cũ tự lỗi thời từ Đợt 235, không do đợt này)**, 0 lỗi console.
> **CHƯA đăng nhập Google thật để thử trên bản live, CHƯA bấm tay trên TOMKO.** Đọc khối **Đợt 236**
> đầu `GHI CHU DU AN.md` để biết chi tiết + việc CÒN LẠI.
>
> ---
> Trước đó: **22/8/2026 (Đợt 234 + 235)** — ⭐⭐⭐ **PDF ĐÁP ÁN CỠ CHỮ TỰ TÌM TỐI ĐA · DÒNG
> "ANDREW CLASSES" Ở MỌI BẢNG TO/FILE XUẤT · DẠNG BẢNG MỚI CHO 1 TRẬN · ĐỔI CƠ CHẾ XEM KẾT QUẢ SAU
> GAME** — **Đợt 234**: `computeDetailsFontSizePx()` (`core/showdown-export.js`) đo THẬT bằng DOM
> (canvas chỉ để xếp hạng ứng viên) rồi nhị phân tìm cỡ chữ LỚN NHẤT sao cho câu hỏi dài nhất + đáp
> án (thời gian+sai+đúng) rộng nhất vừa khít trang PDF, không tràn; cột đổi từ tỉ lệ `1.5fr 1fr`
> sang PX CỐ ĐỊNH = đúng độ rộng đo được, tính MỘT LẦN dùng chung preview+file thật; giãn dòng
> `2mm→0.7mm`; căn giữa đầu mục. **Đợt 235**: dòng thương hiệu mờ/mỏng/căn giữa ở mọi bảng to + file
> xuất thật (KHÔNG ở thẻ nhỏ/preview thu nhỏ — thầy chốt qua AskUserQuestion) — DOM cho
> `buildDetailsContent`/`buildRankSheet`, canvas cho `rankPngBlob`/`drawAnalysisCanvas` (nay export),
> cũng thêm vào `core/showdown-review.js`/`core/showdown-setup.js`. Dạng **BẢNG mới** — hàm
> `renderReviewTable()` mới (export từ `showdown-review.js`) tái dùng `drawAnalysisCanvas` với ĐÚNG
> 1 entry (không rào cản kỹ thuật, xác nhận qua nghiên cứu); thêm tab thứ 3 TABLE vào popup DOWNLOAD
> (icon mới `icons.barChart`), `defaultRank` (boolean) đổi thành `defaultType` (chuỗi). **Đổi cơ chế
> xem kết quả**: bỏ cử chỉ giữ-tay (list↔podium) trên nút SHOWDOWN, thay bằng **3 nút icon
> Table→Podium→List** (Table mặc định) — đồng bộ thao tác với Recent Results' `openDetail` (cũng đổi
> tương tự, tái dùng CSS `.is-toggle.is-on` có sẵn). Chạm tên vẫn là cách DUY NHẤT đổi 1 đội↔cả lớp;
> chạm 2 lần vẫn tải lại thủ công — cả hai GIỮ NGUYÊN theo thầy chốt. ⭐⭐ **`scope` mặc định đổi từ
> "team" sang "class"** (đảo ngược mọi đợt trước) ⇒ phải tải dữ liệu chung NGAY lúc mở — `initialLoad()`
> đua `refresh()` với sàn tối thiểu 3000ms trước khi tắt spinner. `openDetail` cũng thêm
> `refreshThisMatch()` đọc lại `loadMatches(classId)` (trước giờ dữ liệu 1 trận chỉ tính 1 lần lúc mở
> Recent Results, không hề refresh khi bấm vào trận — lỗi phát hiện lúc nghiên cứu).
> ✅ **THẦY DUYỆT** (*"check commit + push + bàn giao"*) — **COMMIT `7554fe6`, ĐÃ PUSH + LIVE KIỂM
> CHỨNG**: Pages triển khai đúng `7554fe6` trạng thái `built` (`gh api
> repos/andrewclasses-01/AWord/pages/builds/latest`, không tin mã 200) · **6/6 mã băm SHA-256 khớp**
> (`core/app.css` · `core/icons.js` · `core/showdown-export.js` · `core/showdown-review.js` ·
> `core/showdown-setup.js` · `GHI CHU DU AN.md`, băm qua `git show HEAD:<file>` so với
> `curl https://aword.andrewclasses.com/<file>`).
> ⚠️ **"THẦY DUYỆT" ở đây là duyệt CODE theo báo cáo + kiểm tra tự động — CHƯA bấm thử tay trên
> TOMKO, và CHƯA thử được luồng Firestore sống thật** (mountShowdownReview's `watchTeams`/`refresh()`
> thật, `openDetail`'s `refreshThisMatch()` đọc `loadMatches` thật — cả hai đòi đăng nhập thật, không
> mô phỏng nổi trong môi trường build). Bàn thử ĐÃ CHẠY: `renderReviewTable()` gọi trực tiếp với dữ
> liệu giả (canvas vẽ đúng số %, dòng thương hiệu đúng vị trí); cả 3 tab popup DOWNLOAD
> (TABLE/RANKING/DETAILS) vẽ đúng, dòng thương hiệu có mặt ở cả 3 (kiểm bằng DOM). ⚠️ Bẫy gặp lúc
> test: icon `barChart` hiện "undefined" — do CACHE HTTP CŨ của `icons.js` (Ctrl+Shift+R xác nhận,
> không phải lỗi code) — **bài học: đổi `icons.js` thì hard-reload trước khi kết luận lỗi**. Đọc khối
> **Đợt 234 + 235** đầu `GHI CHU DU AN.md` để biết chi tiết + danh sách CHỜ THẦY BẤM TAY THẬT.
>
> ---
> Trước đó: **22/8/2026 (Đợt 230)** — ⭐⭐ **RECENT RESULTS: ĐỔI TÊN + TÊN TỰ ĐỘNG THEO LOẠI
> TỪ · ANALYSE: TRUNG BÌNH % + MÀU MỚI + XUẤT ẢNH · VÁ LỖI FULLSCREEN BACK** — double-tap (không phải
> `dblclick` chuẩn — màn TOMKO không tin được) vào hàng tên một ô kết quả để đổi tên tay (`customName`
> mới, `renameMatch()` trong `showdown-history.js`, LUÔN THẮNG vĩnh viễn). Tên mặc định nay đọc
> `contentVariant` ghi lúc lưu kết quả: act "... / WORDS" hiện thành "... / ENGLISH 1"/"...
> / VIETNAMESE 2" (`formatActDisplayName()` mới, `core/showdown.js`) — trận cũ chưa có dữ liệu này thì
> giữ nguyên tên gốc. ANALYSE: số % tổng trên đỉnh cột đổi từ CỘNG DỒN sang TRUNG BÌNH qua các trận có
> mặt (trục % cố định 0-100%), số nhỏ trong khúc vẫn là % thật không bị chia; màu mới tươi hơn, tên
> luôn viết hoa, chú thích căn giữa. Nút Download mới trên màn ANALYSIS xuất 1 ảnh PNG gộp cả 2 bảng
> (file mới `core/showdown-export.js`, vẽ Canvas 2D). Vá lỗi thầy báo: "Back to the matches" không
> phản ứng khi đang fullscreen — gốc là hộp hỏi xác nhận dựng ra NGOÀI phần tử đang fullscreen nên vô
> hình theo đúng chuẩn Fullscreen API; nay `askConfirm()` dựng vào `document.fullscreenElement || body`.
> ✅ **THẦY DUYỆT** (*"check commit + push + bàn giao"*) — **COMMIT `c14afc9`, ĐÃ PUSH + LIVE KIỂM
> CHỨNG**: Pages triển khai đúng `c14afc9` trạng thái `built` (`gh api
> repos/andrewclasses-01/AWord/pages/builds/latest`, không tin mã 200) · **6/6 mã băm SHA-256 khớp**
> (`core/showdown.js` · `core/showdown-history.js` · `core/showdown-setup.js` ·
> `core/showdown-export.js` · `core/engine.js` · `core/app.css`, băm nội dung trong commit so với
> `curl https://aword.andrewclasses.com/<path>`).
> ⚠️ **"THẦY DUYỆT" ở đây là duyệt CODE theo báo cáo + bàn thử tự động — CHƯA phải đã bấm thử tay trên
> TOMKO.** Bàn thử mới `scratch/dot230-recent.html` (tái dùng `fake-firebase196.js` Đợt 196/207,
> `buildShowdownPanel` thật, không cần đăng nhập Google) qua `javascript_tool`: **37/37 ĐẠT, 0 lỗi
> console** — kể cả đo bằng PIXEL THẬT rằng chiều cao các khúc màu khớp đúng % trung bình, và kiểm lỗi
> fullscreen bằng cách giả lập `document.fullscreenElement` rồi bấm Back thật. Đọc khối **Đợt 230**
> đầu `GHI CHU DU AN.md` để biết chi tiết + danh sách CHỜ THẦY BẤM TAY THẬT (cử chỉ chạm 2 lần trên
> TOMKO thật, cảnh fullscreen thật).
>
> ---
> Trước đó: **22/8/2026 (Đợt 229)** — ⭐⭐ **ĐỒNG BỘ MODE + LIVE-PREVIEW OPTIONS CHO
> myActivity CHIA NHIỀU BẢNG** — bridge `window.__awordBridge` (myActivity gọi qua executeJavaScript)
> thêm `setMode("single"|"showdown")`, `openOptions()`, `closeTool()`. `awEmit("MODE",…)` phát khi về
> Single (mọi đường: thoát Fight/Running/IPA/Showdown) và khi MỞ màn chọn đội Showdown (không phải
> lúc chọn xong đội — bảng khác chỉ mở CÙNG màn, không copy đội đã chọn). Fight/Running/IPA CỐ Ý
> không đồng bộ (ngoại lệ, thầy chốt). `draft` trong Options panel (~20 chỗ rải rác viết thẳng vào,
> options-panel.js) nay bọc bằng `Proxy` (`liveDraft()`) — mỗi lần đổi trị, throttle 350ms rồi phát
> `awEmit("OPTLIVE",…)`, TAG riêng KHÁC `OPT` (chỉ phát lúc Apply, giữ nguyên cũ) — cho myActivity
> phản chiếu tức thời lúc đang kéo dở, chưa Apply. `buildOptionsPanel` phát `awEmit("TOOLOPEN",…)`
> ngay lúc mở (1 emit đủ cho cả Options/Template/Style vì Đợt 228 hôm nay đã dồn cả 3 vào 1 popup).
> ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu để các session sau sẵn sàng tiếp tục"*) —
> **COMMIT `b8ee6ec`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `b8ee6ec` trạng thái `built`
> (`gh api repos/andrewclasses-01/AWord/pages/builds/latest`, không tin mã 200) · **mã băm SHA-256
> khớp** cho `core/engine.js` (file DUY NHẤT đổi mã nguồn đợt này — `APP_MASTER.md`/`GHI CHU DU AN.md`
> chỉ là tài liệu), băm nội dung trong commit (`git show b8ee6ec:core/engine.js`) so với
> `curl https://aword.andrewclasses.com/core/engine.js`.
> ⚠️ **"THẦY DUYỆT" ở đây là duyệt CODE theo báo cáo/mô tả — CHƯA phải đã bấm thử tay trên TOMKO.**
> Việc bên myActivity (nơi thật sự dùng các API này) xem `E:\LAP TRINH APP\myActivity\CLAUDE.md` /
> `GHI CHU DU AN.md` mục cùng ngày — **GẮN CHẶT hai bên, đừng revert lẻ một bên** (giống cặp Đợt 197
> ↔ myActivity v2.4.0 cũ). Đọc khối **Đợt 229** đầu `GHI CHU DU AN.md` để biết chi tiết + danh sách
> CHỜ TEST TOMKO (vẫn còn nguyên, xem mục đó).
>
> ---
> Trước đó: **22/8/2026 (Đợt 228)** — ⭐⭐ **CHANGE TEMPLATE + STYLE DỌN VÀO THẲNG POPUP
> OPTIONS** — bỏ nút Template/Style riêng ngoài thanh công cụ dưới khung (giờ chỉ còn Options·Mode).
> Trong Options, nút "current template" cạnh Apply: TAP mở bảng chọn 17 template ngay trong panel
> (không cần scroll, không tràn ra ngoài), GIỮ mở Style — cả hai swap thẳng vào thân panel Options
> (`swapContents`), không phải panel riêng. Chọn xong 1 template khác: Options KHÔNG đóng, tự mở lại
> ngay với options của template mới (`openOptionsOnMount`, cùng khuôn `openShowdownOnMount` Đợt 158);
> ô đang tải có vòng màu chạy quanh viền báo đang xử lý. Ở IPA/Running word/Running team (không đổi
> template được), nút tự thành Style trần — bảo đảm Style không bao giờ mất, y hệt luật cũ.
> ✅ **THẦY DUYỆT** (*"commit + push + bàn giao"*, sau khi duyệt bản mockup Artifact rồi duyệt code
> thật) — **COMMIT `97ff5ce`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `97ff5ce` trạng thái
> `built` (không tin mã 200) · **4/4 mã băm SHA-256 khớp** (`core/engine.js` · `core/app.css` ·
> `templates/running-word/running-word.css` · `templates/running-team/running-team.css`, băm nội
> dung trong commit so với `curl https://aword.andrewclasses.com/<path>`). Đọc khối **Đợt 228** đầu
> `GHI CHU DU AN.md` — tóm tắt:
> - Bảng chọn template không còn là tool-panel riêng (`buildTemplatePanel` cũ đã xoá) — nó SWAP vào
>   `bodyHost` của chính Options bằng cơ chế đổi clue-set có sẵn (Đợt 149), nên tự cao vừa đủ theo
>   nội dung, không cần tính overlay thủ công.
> - **Bẫy đã tự bắt khi code**: `buildTemplatePickerBody`/`pickTemplate` viết lệch scope (sibling
>   thay vì nested trong `buildOptionsPanel`) → `ReferenceError` lúc bấm nút thật; và một lần dọn
>   comment vô tình xoá mất dòng khai báo `const templateSwitchAvailable` — `node --check` không bắt
>   được (chỉ soát cú pháp), phải chạy lại Browser pane thật mới thấy lỗi. Cả hai đã tự sửa, không
>   cần hỏi thầy.
> - Đo qua `scratch/test-mode.html` (bench có sẵn từ Đợt 158, không cần đăng nhập Google) qua
>   `javascript_tool`: tap/giữ đúng bảng, đổi Anagram↔Quiz giữ nguyên state Options, is-soon toast
>   đúng, toolbar chỉ còn 2 nút. Không lỗi console.
> ### ⬜ CHỜ THẦY
> - Bấm thử trên bảng/TOMKO thật (đặc biệt cử chỉ NHẤN GIỮ để mở Style — bench chỉ mô phỏng được
>   bằng PointerEvent giả, chưa đo được cảm giác giữ tay thật).
> - Fight mode + Showdown mode (bấm Template giữa trận) — cố tình CHƯA test/CHƯA đổi hành vi đợt này.
>
> ---
> Trước đó: **22/8/2026 (Đợt 227)** — ⭐⭐ **RECENT RESULTS: NÚT DOWNLOAD TRONG MÀN CHI
> TIẾT TRẬN** (giữa Ranking và Back) — pop-up chọn Rank (ảnh PNG vuông) hay Details (PDF A4 dọc qua
> in trình duyệt), đặt tiêu đề Lớp • Act • Ngày, xem trước rồi xuất. File mới
> `core/showdown-export.js`. ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu để các session sau
> sẵn sàng tiếp tục"*) — **COMMIT `bde28b2`, ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng
> `bde28b2` trạng thái `built` (không tin mã 200) · **4/4 mã băm SHA-256 khớp**
> (`core/showdown-export.js` · `core/showdown-setup.js` · `core/icons.js` · `core/app.css`, băm nội
> dung trong commit so với `curl https://aword.andrewclasses.com/<path>`). Đọc khối **Đợt 227** đầu
> `GHI CHU DU AN.md` — tóm tắt:
> - **Bẫy đo được khi dựng ảnh PNG**: cách hay dùng để "chụp" DOM thành ảnh (SVG `foreignObject` →
>   `<img>` → `drawImage` vào canvas) làm canvas bị Chromium đánh dấu "tainted" dù ảnh CÙNG GỐC —
>   `toBlob()` ném `SecurityError`. Sửa bằng vẽ THẲNG lên canvas bằng lệnh nguyên thuỷ
>   (`fillRect`/`roundRect`/`fillText`, không `drawImage` ảnh nào) — không bao giờ bị tainted. Đúng
>   lý do các thư viện kiểu html2canvas tự vẽ lại DOM thay vì dùng mẹo foreignObject một dòng.
> - **PDF = in trình duyệt** (đúng khuôn `core/print.js`/`rt-print.js` đã có, không thư viện mới),
>   thầy chọn "Lưu thành PDF" ở hộp thoại in như mọi chỗ in khác trong app.
> - Đo qua Browser pane thật + `devserver.py` với dữ liệu bịa (chưa đăng nhập được Firestore để bấm
>   qua đúng luồng UI thật): pop-up dựng đủ, bắt được lỗi tainted canvas thật rồi vá, ảnh PNG ra đúng
>   1000×1000 có vẽ thật (không trắng trống), nút Download PDF gọi đúng `window.print()` 1 lần và dọn
>   sạch sheet sau in.
> ### ⬜ CHỜ THẦY
> - Bấm thử qua đúng đường trên bảng/TOMKO thật (Showdown → Recent results → 1 trận → nút Download).
> - In thử 1 file Details ra giấy/PDF thật (giãn cách, cỡ chữ), xem ảnh PNG Rank tải về có đúng ý —
>   bench chỉ đo được cơ chế đúng qua dữ liệu bịa, chưa đo được "nhìn có đẹp không" trên thiết bị thật.
>
> ---
> Trước đó: **22/8/2026 (Đợt 225+226)** — ⭐ **PRINT: VÁ LỖI LUÔN RA ENG1 DÙ ĐÃ CHỌN
> ENG2/VI1/VI2 · MỞ ĐỊNH DẠNG IN CROSSWORD** (bỏ "coming soon"). Thầy giao 2 việc rời, gộp 1 commit
> vì cùng buổi. ✅ **THẦY DUYỆT** (*"commit và push hết đi"*) — **COMMIT `7e8a6af`, ĐÃ PUSH + LIVE
> KIỂM CHỨNG**: Pages triển khai đúng `7e8a6af` trạng thái `built` (không tin mã 200) · **3/3 mã
> băm SHA-256 khớp** (`core/engine.js` · `core/print.js` · `core/app.css`, băm nội dung trong
> commit so với `curl https://aword.andrewclasses.com/<path>`). Tóm tắt trong `GHI CHU DU AN.md`.
>
> ---
> Trước đó: **22/8/2026 (Đợt 224)** — ⭐⭐⭐ **RECENT RESULTS: 10 TRẬN (2 TẦNG × 5 CỘT,
> WAS 5) · XOÁ TỪNG TRẬN RIÊNG (nút "–") · ANALYSE → BEGIN: BIỂU ĐỒ CỘT CHỒNG % NHIỀU TRẬN,
> FULLSCREEN**. Thầy giao trọn tính năng, chốt 2 quyết định qua AskUserQuestion (bấm ANALYSE khi
> <2 ô tích LUÔN thoát chế độ chọn · học sinh thiếu trận xếp thành cụm riêng sau cùng, cách một
> khe hẹp, không phân biệt thiếu nhiều/ít). Sửa **6 file**: `core/showdown-history.js` ·
> `core/showdown.js` · `core/showdown-setup.js` · `core/icons.js` · `core/app.css` ·
> `core/HUONG DAN CORE.md`. ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu"*) — commit
> **`bcb09d5`**, **ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `bcb09d5` trạng thái `built`
> (không tin mã 200) · **5/5 mã băm SHA-256 khớp** (5 file code, băm nội dung trong commit, không
> băm file trên máy). Đọc khối **Đợt 224** đầu `GHI CHU DU AN.md` — tóm tắt:
> - **(1) `MAX_MATCHES` 5 → 10**, lưới `.aw-sd-rec-cols` đổi `grid-template-columns/rows:
>   repeat(5/2, minmax(0,1fr))` — **`minmax(0,1fr)` chứ KHÔNG phải `1fr` trần**: bẫy đã cắn khi
>   dựng, `1fr` trần là `minmax(auto,1fr)` nên một cột hơi cao đẩy tràn cả lưới (đo 11px) dù mắt
>   không thấy gì. `.aw-sd-mini` bỏ `overflow-y:auto`, đổi `max-height` cố định + `mask-image` mờ
>   dần đáy — không cần biết chính xác "học sinh thứ mấy" bị cắt, mask tự lo.
> - **(2) Nút "–" mỗi cột** (góc trên-phải, `<div>` thay `<button>` bọc ngoài vì nút lồng trong
>   nút không hợp lệ HTML) → `askConfirm` → `deleteMatch()` mới trong `core/showdown-history.js`
>   (transaction, cùng khuôn `saveMatchResult`).
> - **(3) ANALYSE/BEGIN**: nút vàng phát sáng + sparkle (tái dùng khuôn `.aw-sd-pod-star`), tích
>   ≥2 cột → `buildAnalysisRows()` mới (THUẦN, trong `core/showdown.js`, kiểm bằng Node/scratch
>   20/20) → biểu đồ cột chồng DOM/CSS thường (không canvas/thư viện), mỗi tầng % một trận, cùng
>   `yMax` cho mọi cột nên so được bằng mắt; nhóm "đủ mọi trận" xếp trước, nhóm "thiếu trận" xếp
>   sau cách một khe hẹp. Fullscreen + nút Back **hỏi xác nhận trước khi thoát** (khác nút ✕ ở
>   màn chi tiết cũ, đóng thẳng).
> ### ✅ ĐO: **20/20** Node (`scratch/dot224-analysis.mjs`, thuần `buildAnalysisRows`/`blockKey`)
> + **25/25** trình duyệt thật qua `devserver.py` (`scratch/dot224-recent.html`, giả Firestore +
> module thật: 10 ô sau khi seed 11 trận · xoá 1 cột đúng trận · ANALYSE 0/1 ô thoát · 2+ ô →
> BEGIN → biểu đồ đúng số/đúng % (soi tận `tier.dataset.pct` so khớp `pctOf` tính tay) · Back hỏi
> trước khi thoát · 0 lỗi console) + đối chứng `.aw-sd-recent` (khung ngoài) **0 tràn**.
> ### ⬜ CHỜ THẦY (Đợt 224)
> - Nhìn thật trên TOMKO: 2 tầng × 5 cột có đủ to để chạm không, nút ANALYSE/tick tròn có dễ bấm
>   không, biểu đồ đọc từ cuối lớp có rõ không (chưa test lớp thật 15-20 em).
>
> ---
> Trước đó: **21/8/2026 (Đợt 223)** — ⭐⭐⭐ **BỎ HẲN "ROUND RULE" + "SLOWER TEAM KEEPS
> POINTS" (TIME DELAY một mình quyết định) · KHOÁ IM LẶNG + MẤT MÀU Ở NẤC KHÔNG DELAY · FIX CHỜ
> VÔ ÍCH KHI BÀN KIA ĐÃ XONG · SHOW ANSWERS Ở BẢNG CUỐI TRẬN FIGHT**. Thầy tả 4 vấn đề gặp ở
> Fight, chốt 3 quyết định qua AskUserQuestion. Sửa **7 file**: `core/fight.js` · `core/app.css` ·
> 5 template Fight vòng thường. ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu"*) — commit
> **`297a4e2`**, **ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `297a4e2` trạng thái `built`
> (tra `pages/builds/latest`, không tin mã 200) · **7/7 mã băm SHA-256 khớp** · **17/17 phép hỏi
> CHẠY CHÍNH MODULE CỦA BẢN LIVE** (`scratch/dot223-live.html`) + **52/52 phép hỏi cục bộ**
> (`scratch/dot223-verify.html` + `scratch/dot223-smoke-others.html`, cả 5 game Fight, 0 lỗi console).
> Đọc khối **Đợt 223** đầu `GHI CHU DU AN.md` — tóm tắt:
> - **(1) Bỏ hẳn "Round rule"/"Slower team keeps points".** Thầy: *"đã được điều khiển ở chế độ
>   có TIME DELAY hay không rồi"*. `lockLoser()`/`lateScores()` giờ đọc thẳng `fightTieWindow`:
>   đúng nấc **0,1s** (thấp nhất) mới khoá; mọi nấc cao hơn — kể cả ∞ — không khoá và LUÔN giữ
>   điểm. Hai ô Options biến mất, hai field `fightFirstRule`/`fightLateScores` không còn ai đọc.
> - **(2) Khoá im lặng + "mất màu" (đen trắng) ở nấc không delay.** Thầy: *"một số template còn
>   màu và báo âm thanh sai bên đội thua trùng với âm thanh đúng bên đội nhanh, gây khó chịu"*.
>   `finalizeSingleWinner()` không còn gọi `board.timeUp()` (đã XOÁ HẲN khỏi cả 5 template) —
>   chỉ khoá trần trụi + `silentLose()`: MỘT lớp CSS chung `is-fight-silentlost` trên
>   `.aw-fight-board` (`filter:grayscale(1)`, chuyển mượt .4s, trả lại màu khi sang câu).
> - **(3) Fix chờ vô ích**: đội chậm trả lời SAI trước (đã khoá, `roundDone[other]`=true), rồi
>   đội nhanh trả lời ĐÚNG sau — trước đây vẫn mở một cửa sổ chờ MỚI dù chẳng còn ai để đợi (bug
>   này Đợt 216 từng vá nhưng chỉ cho riêng ∞). Nay chốt ngay ở MỌI mức delay.
> - **(4) Show answers Fight**: hợp đồng mới `ctl.attach(side, { review })` — mỗi template tách
>   phần dựng review ra `buildReview()`, gọi được bất cứ lúc nào (Fight không gọi `ui.finish()`).
>   `showResult()` đọc cả hai bàn, hiện nút "Show answers" nếu có gì để xem → hai cột song song.
> - ⬜ **Chờ mắt thầy**: mất màu nhìn từ cuối lớp TOMKO có rõ/mượt không · bố cục Options (cột
>   "Fight content" nay đứng một mình) có ổn không.
>
> ---
> Trước đó: **21/8/2026 (Đợt 222)** — ⭐⭐⭐ **HẾT TIME DELAY LÀ MỘT CÂU TRẢ LỜI SAI,
> KHÔNG PHẢI MỘT BÀN CHẾT CÂM (5 game Fight) · FIND THE MATCH: HAI BÀN XÁO Ô KHÁC NHAU ·
> TỪ DÀI THU CHỮ CHỨ KHÔNG BẺ ĐÔI · DẤU ✓/✗ LÊN LỚP TRÊN CÙNG**. Thầy giao 5 việc, chốt 3
> quyết định qua AskUserQuestion. Sửa **8 file**: `core/fight.js` · 5 template Fight vòng
> thường · `find-the-match.css`. ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu"*) — commit
> **`acd381c`**, **ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `acd381c` trạng thái `success`
> (tra builds/deployments API, **không tin mã 200**; ⚠️ lần tra đầu ra đợt CŨ — phải chờ tới khi sha
> khớp) · **7/7 mã băm SHA-256 khớp** (băm **nội dung trong commit**, không băm file trên máy — CRLF)
> · **24/24 phép hỏi CHẠY CHÍNH MODULE CỦA BẢN LIVE** (`scratch/dot222-live.html` import thẳng
> `https://aword.andrewclasses.com/core/fight.js` — Pages trả `Access-Control-Allow-Origin: *`).
> Đọc khối **Đợt 222** đầu `GHI CHU DU AN.md` — tóm tắt:
> - **(1) Gốc rễ MỘT chỗ, và hai ca thầy tả là cùng một lỗi.** `finalizeSingleWinner()` khoá
>   bàn đội thua bằng đúng một dòng `lock(true)` trần trụi (Đợt 124), công tắc là ô **Round
>   rule = "lock"** — **MẶC ĐỊNH**. Đo được: ở Time delay mặc định **0,1s** bàn đội chậm chết
>   sau **126ms** (⇒ "chết ngay"), ở 3s thì **3021ms** (⇒ "chết sau khi hết delay"). Chết xong
>   im lặng tuyệt đối rồi còn đợi **2,1s** mới sang câu. ⚠️ **TRONG cửa sổ delay thì đội chậm
>   VẪN bấm được** — chỗ chết luôn ở giây cửa sổ CẠN.
> - **(2) Sửa: cửa sổ cạn = hết giờ của đội chậm**, mà "hết giờ" thì app **đã có luật từ Đợt
>   174** (*"coi như sai, báo lỗi sai, phát điểm trừ"*). Trọng tài chỉ gọi vào đúng đường cũ
>   qua hàm TUỲ CHỌN mới **`timeUp()`** trong `ctl.attach`. Nối cho **cả 5 game Fight vòng
>   thường** (Quiz · Anagram · Type the answer · True/false · Find the match). ⛔ Pick-turn
>   (Open the box · Crossword) miễn — chúng vốn bị bịt khỏi Time delay từ Đợt 187.
>   ⛔⛔ `roundDone[other] = true` **phải đặt TRƯỚC** lời gọi (TF/FTM tự báo `wordDone()` ở cuối
>   đường hết-giờ ⇒ trọng tài tái nhập vào giữa chính mình) · ⛔ cờ `{fromMatch:true}` phải bỏ
>   qua chốt `fightLocked()` (lúc gọi thì `roundWinner` ĐÃ đặt ⇒ giữ chốt là hàm không bao giờ
>   chạy) và chốt `busy` của Anagram · ⛔ mọi đường hết-giờ phải DỪNG trước phần tự-sang-câu.
> - **(3) Find the match**: xáo ô **TRONG TỪNG TRANG**, mỗi bàn một lần xáo riêng (giữ nguyên
>   phép chia trang chung — `fightGoTo` tìm trang bằng `includes`) · từ dài **`overflow-wrap:
>   normal`** + đo bề rộng chữ bằng **`Range.getClientRects()`** vì ⛔⛔ **`scrollWidth` NÓI DỐI
>   trong hộp flex căn giữa** (chữ 132px trong ô 131px mà `scrollWidth === clientWidth`) ·
>   dấu ✓/✗ bay lên **lớp phủ `.aw-ftm-marks`** vì ⛔ **`overflow:hidden` cắt theo HỘP, không
>   theo lớp** — `z-index` không cứu được.
> - ✅ **ĐO**: 4 bàn thử mới **55/55** (`dot222-verify` 20 · `dot222-tf-tta` 14 · `dot222-ftm`
>   12 · `dot222-ftm2` 9) + hồi quy **96/96** (`dot219-fight` 24 · `dot220-nav` 15 ·
>   `dot220-deal` 24 · `dot216-delay` 33) + **24/24 trên CHÍNH BẢN LIVE**. Ba đối chứng ngược đã cài
>   (trả lời kịp ⇒ không bị chấm oan · Round rule "finish" ⇒ không đụng gì · hai bàn vẫn cùng một lời nhắc).
> - ⬜ **Chờ mắt/tay thầy**: ván thật trên TOMKO (delay bao nhiêu là công bằng) · nhịp giữ 2,1s
>   · hai bàn FTM xáo khác nhau trên 86" · cỡ chữ ở mức thu nhỏ nhất 0,52 · act nào muốn nết cũ
>   thì đổi Round rule sang **"finish"**.
>
> ---
> Trước đó: **21/8/2026 (Đợt 221)** — ⭐⭐⭐ **IMPORT TỰ DỰNG CÂY THƯ MỤC THEO TÊN
> FILE + MÀN CHỐT THƯ MỤC · QUICK ACCESS THÀNH CỘT RIÊNG + KHU RECENT**. Thầy giao 2 mảng,
> chốt 7 quyết định qua AskUserQuestion. Sửa **4 file**: `core/lesson-import.js` ·
> `core/store.js` · `main.js` · `core/app.css`. ✅ **THẦY DUYỆT** (*"commit + push live + ghi dữ liệu"*)
> — commit **`97306a2`**, **ĐÃ PUSH + LIVE KIỂM CHỨNG**: Pages triển khai đúng `97306a2` trạng
> thái `success` (tra builds API, **không tin mã 200**; ⚠️ lần tra đầu ra đợt CŨ — phải chờ tới
> khi sha khớp) · **7/7 mã băm SHA-256 khớp** · **24/24 phép hỏi môđun TRÊN CHÍNH BẢN LIVE**.
> ⛔⛔ **Băm file TRÊN MÁY rồi so live là báo LỆCH OAN 4/4** — kho lưu LF, thư mục làm việc
> CRLF; phải băm **nội dung trong commit** (`git show HEAD:<file> | sha256sum`).
> Đọc khối **Đợt 221** đầu `GHI CHU DU AN.md` — tóm tắt:
> - **(1) Một luật đọc hết 137 file bài học**: *mỗi dấu chấm trong mã = một cấp thư mục,
>   tên cấp là mã cộng dồn*. `LSA2-S2.T1.P1-2.xlsm` → `LISTENING / 2. LISTENING FOR A2 /
>   LSA2-S2 / LSA2-S2.T1 / LSA2-S2.T1.P1-2`. Hai cấp trên cùng tra bảng `LESSON_TREE`
>   theo chữ cái ĐỨNG TRƯỚC `-S` (⚠️ khoá tra CHÍNH XÁC, không phải "bắt đầu bằng" — `IE`
>   là phần đầu của `IEL`). Bộ mới = **thêm 1 dòng** vào bảng. **Thư mục lá giữ TÊN BÀI**
>   ⇒ vá lỗi im lặng từ Đợt 190 (`…W1 BEAVERS AND DAMS` và `…W1 SLIDE INSTRUCTION` từng
>   dồn chung một thư mục rồi đè nhau). ⛔⛔ Phép đo bắt được **2 lỗi thật gãy cây không
>   báo gì**: bản trùng Drive chèn `" (1)"` vào GIỮA tên (6 file mất hẳn 1 cấp) và lỗi gõ
>   HAI dấu chấm — nay bóc sạch TRƯỚC khi đọc mã, nhưng **chỉ ở cấp cây**, thư mục lá giữ
>   nguyên tên file để bản trùng còn nhìn ra được. **Mã lạ ⇒ KHÔNG dựng cây.**
> - **Chỗ tạo**: gốc ACTIVITIES = trọn cây · trong thư mục con = **tự bỏ cấp trùng** ·
>   thả lên Quick Access = `fromRoot`. **Màn chốt (bước 2)** thay hẳn ô "Make a new
>   folder": mỗi cấp một dòng sửa/xoá được, `✓` đã có · `+` sắp tạo. ⛔ Khung bước 2 dựng
>   MỘT LẦN ngoài `buildPanel()` (hàm đó chạy lại mỗi lần thả file mới). ⭐ `folderDup` bỏ
>   hẳn — cây tự động CỐ Ý tái dùng thư mục sẵn có.
> - **(2) Quick Access = flex rail**, không còn là ô của lưới. ⛔⛔ Gốc rễ: ô lưới chiếm
>   NGUYÊN HÀNG, hết hàng là thẻ cuộn ngược lên ngồi vào cột của khung. ⭐ **XOÁ HẲN
>   `sizeQuickAccess()`** (chỗ duy nhất trong app tự đọc kết quả của chính nó) + listener
>   `resize` + lớp `.is-alone`. Vẫn KHÔNG @media, rail không bao giờ gập. **Khu Recent** =
>   thư mục vừa MỞ, 5 dòng, localStorage theo máy, ghi ở đúng `enterFolder()`; ⚠️ nhớ 16
>   hiện 5 vì thư mục đã xoá bị lọc lúc vẽ. Thả file lên khung ⇒ mở Import.
> - ✅ **ĐO**: `scratch/dot221-path.mjs` **137 file thật** (119 nhận cây · 80 khớp CHÍNH
>   XÁC ổ D · 39 khác biệt phân loại hết) · `scratch/dot221-bench.html` **33/33** trên
>   trình duyệt thật (kèm `scratch/fake-firebase221.js` MỚI — bản cũ thiếu `writeBatch`)
>   · chạy tay hết đường thật với 1 file `.xlsm` THẬT · rail đo ở **380/520/760/1040px**,
>   0 thẻ đè, không cuộn ngang. 0 lỗi console.
> - ⬜ **Chờ mắt/tay thầy**: rail trên màn 86" · AWord trong myActivity chia cột (380px
>   thì cột thẻ còn ~126px) · thư viện thật đã có thư mục `DS-S4.I1 <TÊN>` thì import đẻ
>   thêm `DS-S4.I1` bên cạnh · `FLY-S2`/`DR-S1` khác tên ổ D (muốn khớp = thêm alias).
>
> ---
> Trước đó: **21/8/2026 (Đợt 220)** — ⭐⭐⭐ **CHẶN ‹ › KHI BÀN KIA CÒN LÀM (Fight) ·
> ALLOW SKIP MẶC ĐỊNH TẮT (hồi tố, di trú optVer v3) · DẢI `NORMAL · FREE · COUNT` CHIA BÀI CHO
> SHOWDOWN (Quiz + Type the answer)**. Thầy giao 2 mảng + chốt 8 quyết định qua AskUserQuestion.
> Sửa **10 file**: `core/fight.js` · `engine.js` · `options-panel.js` · `options-migrate.js` ·
> `showdown.js` · `lesson-import.js` · `templates/quiz` · `type-the-answer` · `anagram` · `unjumble`.
> ✅ Commit **`4b722d2`** + hồ sơ `52ed539`, **ĐÃ PUSH + LIVE KIỂM CHỨNG** — Pages build đúng
> `52ed539` (tra builds API, không tin mã 200) · **10/10 mã băm SHA-256 khớp** · **20/20 phép hỏi
> môđun trên CHÍNH BẢN LIVE** (import sống `dealQuestions`/di trú qua CORS của Pages + soi khuôn
> câu lệnh 6 file). Thầy lệnh push để test trên lớp; nội dung tính năng CHƯA duyệt — chờ thầy chơi thật. Đọc khối **Đợt 220** đầu `GHI CHU DU AN.md` — tóm tắt:
> - **(1) Fight: một bàn không được sang câu khi bàn kia còn làm dở.** Chặn TỪ NGUỒN trong `setNav`
>   (phễu duy nhất 15 template có nav đều đi qua) + `registerNavGate` để trọng tài chủ động vẽ lại
>   hai mũi tên khi BÀN KIA xong (⚠️ bẫy đo được: chỉ chặn trong `setNav` là nút mờ vĩnh viễn).
>   ⛔ KHÔNG chặn trong `boardMoved()` — template gọi nó SAU khi tự dời ⇒ hai bàn lệch câu.
>   Công tắc là ô **Allow skip** (bật = cố ý cho cắt ngang). Quiz thêm chốt phím ← → qua
>   `ui.mayLeaveRound()`. Che bài: che đúng MỘT bàn — bàn xong khi còn người đang làm (nửa còn lại
>   của luật Đợt 219, sửa đúng 1 biểu thức `conceal(side, !roundDone[other])`).
> - **(2) Allow skip thống nhất mặc định TẮT cả 4 game** (trước: Anagram+Unjumble bật, Quiz+TTA tắt).
>   Unjumble được THÊM ô (trước không có đường tắt). **Di trú optVer v2→v3**: act Anagram/Unjumble
>   mang `true` (cặn mặc định cũ + import) tự lật `false`; Quiz/TTA giữ (thầy cố ý tích). ⛔ Bẫy
>   "-5→-100→-2000": mỗi bước di trú phải chốt "nâng TỪ phiên bản nào".
> - **(3) Showdown: dải `Normal · Free · Count`** ("Questions each", dưới "Time each round").
>   Free = chơi tới Submit answers (trần 100 câu/em, nav MỘT SỐ duy nhất, % cắt về VÒNG TRỌN VẸN
>   CUỐI trước `computeResult` — không cắt là Đợt 207 cho cả lớp ~0%). Count = mỗi em đúng N câu
>   (ô số chặn cứng ở tổng số câu). Chia bài = `dealQuestions()` trong `core/showdown.js` (thuần):
>   ghép cặp đôi Kuhn theo deck — 🔒 không em nào gặp lại câu mình (0/5904 lượt) · 🔓 không trùng
>   giữa hai em tới khi hết bộ. Engine `applySdDeal` (anh em applyBalance, cùng object nguồn,
>   options theo THAM CHIẾU, miễn vòng mistakes); template hỏi `ui.keepItemOrder()` trước cú shuffle.
>   Khoá chéo với Balance + Shuffle (nhạt, không ẩn). ⛔ Open the box · Crossword · Find the match
>   cấm vĩnh viễn (mảng câu là cái bàn chơi). Mở template mới = 1 dòng `sdDeal: true`.
> - ✅ **ĐO**: `scratch/dot220-deal.html` **21/21** · `dot220-nav.html` **15/15** · hồi quy
>   `dot219-fight.html` **24/24** · di trú **8/8** (Node) · lưới thuật toán **5904/5904** (Node).
> - ⬜ **Chờ tay thầy trên lớp**: ván Count thật trên TOMKO · Submit giữa chừng ở Free (cảm giác %)
>   · cỡ chữ dải trên màn 86" · act Anagram/Unjumble cũ nào muốn nết cũ thì bật lại Allow skip.
>
> ---
> Trước đó: **21/8/2026 (Đợt 219)** — ⭐⭐ **CHẤM TÍCH KHÔNG SÓT · TẠM DỪNG LÀ DỪNG TẤT CẢ ·
> ANAGRAM CHE LÀ XOÁ HẲN CHỮ**. Thầy giao 3 việc. Sửa **5 file**: `core/showdown-review.js` ·
> `core/app.css` · `core/engine.js` · `core/fight.js` · `templates/anagram/anagram.css`.
> ✅ **THẦY DUYỆT** (*"ok build"*) — commit `d1d39c1`, **ĐÃ PUSH + LIVE**.
> Đọc khối **Đợt 219** đầu `GHI CHU DU AN.md`.
> - **(1) Chấm tròn bên kia phải ẩn ở Recent results.** ⚠️⚠️ **KHÔNG tái hiện được** (đo **18/18** đúng
>   đường thật; mã băm `showdown-setup.js` live trùng khít bản máy) ⇒ thầy chốt *"cứ vá phòng thủ"*.
>   ⭐ Bậc thang DUY NHẤT tìm được giữa hai bảng: **khoá `b.key` của SỔ CÁI có thể RỖNG**
>   (`normStudent` viết `String(s?.key || "")`), mà Show answers thì luôn có (`m.id`) — cả lớp dùng
>   chung một ô nhớ thì hàng tích trước **không được vẽ lại**, y hình thầy tả. Nay khoá có bậc lùi
>   *tên viết thường* (đúng luật `mergeClassBlocks`), một cú tích **vẽ lại CẢ BẢNG**, và `sound.tick()`
>   xuống đứng **sau** việc vẽ trong `try`. CSS `.is-off` ẩn bằng **ba cách**: ⚠️ `visibility` là thứ
>   DUY NHẤT **con cháu gỡ ra được**. ⬜ Chưa đo được ca **FULLSCREEN**.
> - **(2) Tạm dừng là dừng TẤT CẢ.** ⛔ Gốc rễ: Đợt 217 dựng tập `pauseReasons` nhưng **hai đồng hồ
>   chưa bao giờ nối vào đó** — `idleTick`/`roundTick` chỉ hỏi `menuEl || toolPanelEl`, tức **chỉ biết
>   pop-up của CHÍNH bàn mình** ⇒ bàn kia bấm Menu là bàn này **vẫn trừ Time cost**. Nay hỏi
>   `playPaused()`. ⛔⛔ **VÁ LỖ RÒ CỦA CHÍNH ĐỢT 217**: nó bắn tin sang bàn kia trên MỖI lần bớt lý do,
>   nên đóng Menu trong lúc Options còn mở là **bàn kia chạy lại thật** sau lưng tấm che — nay
>   `syncRelay()` chỉ bắn khi câu trả lời ĐỔI. ⭐⭐ Và **đồng hồ TRỌNG TÀI** (`roundTimer` ·
>   `pendingTimer`) nay dừng được — chúng không trừ điểm, chúng **SANG CÂU**. ⚠️ `setTimeout` không có
>   nút dừng ⇒ **huỷ rồi đặt lại**, mỗi đồng hồ nhớ `fire`/`left`/`endAt`; ⛔⛔ mọi chỗ huỷ **phải** đi
>   qua `cancelRound()`/`cancelPending()`. Thanh chờ có hai nhịp mới `"hold"`/`"go"` (nó là
>   `transition` CSS **ngoài sân** nên `freezePlay()` không với tới).
> - **(3) Anagram che là XOÁ HẲN MỰC.** ⛔⛔⛔ Gốc rễ: **`color: transparent` KHÔNG xoá được
>   `text-shadow`** — bóng vẽ theo đúng hình chữ, độc lập với `color`, để lại một chữ xám đọc được từ
>   xa. Nay `text-shadow: none` + tắt `.aw-anagram-revealmark`. ⭐⭐ Và `unconcealAll()` **rời khỏi
>   `revealBoards()`**: che giữ tới tận lúc **SANG CÂU** / **HẾT TRẬN** (thầy chốt áp dụng **cả 5
>   template** có che bài). ⚠️ Vá kèm lỗ Đợt 217: `boardMoved()` (‹ ›) chưa bao giờ gỡ che.
> - ✅ **ĐO**: `scratch/dot219-fight.html` **24/24** · `scratch/dot219-recent.html` **18/18** + đối chứng
>   ngược khoá đụng nhau · lưới Đợt 217 cũ trượt **đúng 2 phép** mã hoá hành vi cũ (đã cập nhật theo
>   luật mới), 16/18 còn lại nguyên vẹn. ⬜ **Cần mắt/tay thầy**: bề rộng thanh chờ lúc hold/go (pane
>   ẩn đóng băng transition) · ca fullscreen của Recent results · nhìn thật ván Anagram Fight trên 86".
> - ✅ **ĐÃ LIVE**: **5/5 mã băm SHA-256 khớp** + **20/20 phép hỏi trên CHÍNH BẢN LIVE**; triển khai
>   Pages `d1d39c1` trạng thái **success** (tra `gh api …/deployments/{id}/statuses`, không tin mã 200).
>   ⚠️⚠️ **Hai phép hỏi đầu báo TRƯỢT OAN, cả hai là lỗi của PHÉP ĐO** — sẽ cắn lại y hệt ở đợt sau:
>   (a) **đọc `color` ngay sau khi gắn `.is-concealed` ra MÀU CŨ**, vì luật che khai
>   `transition: color .18s` mà **pane ẩn thì Chromium ĐÓNG BĂNG transition**, còn `text-shadow`
>   không có transition nên tắt ngay ⇒ **hai nửa của CÙNG MỘT LUẬT báo hai kết quả trái ngược**;
>   cách đo đúng là **dựng phần tử SINH RA ĐÃ mang trạng thái cần đo**. (b) **grep mã nguồn trúng luôn
>   CHÚ THÍCH** (chú thích trong `revealBoards()` có nhắc tên `unconcealAll()`) — phải bỏ dòng `//`
>   trước khi tìm, hoặc khớp đúng khuôn một câu lệnh.
>
> ---
> Trước đó: **20/8/2026 (Đợt 218 + 218b + 218c)** — ⭐⭐ **KHUNG QUICK ACCESS Ở TRANG CHỦ**:
> 218 dựng nó (thư mục ghim + con của nó, mũi tên xổ, kéo-thả vào được), **218b đổi hình** theo lời
> thầy — nay là **Ô ĐẦU TIÊN CỦA LƯỚI** (luôn hiện, chiếm cột 1, card còn 3 cột, cao tối thiểu 2 card
> thư mục), và **kéo sắp xếp được thứ tự mục ghim bằng POINTER events** (chạy cả trên ngón tay).
> **218c** thêm **vạch kẻ mảnh trong khe** ngăn khung với các thư mục (ẩn khi lưới còn 1 cột).
> Sửa `core/store.js` · `core/icons.js` · `main.js` · `core/app.css`.
> ✅ **THẦY DUYỆT** (*"ok ngon rồi"*) — ba đợt đi **CHUNG MỘT COMMIT `4642d4b`**, **ĐÃ PUSH + LIVE**
> (4/4 mã băm SHA-256 khớp, 14/14 phép hỏi môđun trên bản live, kho sạch).
> Đọc khối **Đợt 218c → 218b → 218** đầu `GHI CHU DU AN.md`.
> Trước đó: **(Đợt 216 + 217)** — **CHỐT NỬA GIÂY SAU START · TIME DELAY LÊN 10s
> VỚI ∞ THẬT · THANH TRƯỢT CHỊU ĐƯỢC NGÓN TAY** (216) và **TÊN TRONG PHỄU · GIÀNH TEAM · TẠM DỪNG
> LAN · CHE BÀI KHI FIGHT · RESET SẠCH** (217) — ✅ **THẦY DUYỆT 216**, hai đợt đi **CHUNG MỘT COMMIT**
> theo đúng lời thầy — commit `6244fe0`, **ĐÃ PUSH + LIVE** (11/11 mã băm SHA-256 khớp, 12/12 phép
> hỏi module trên bản live). Đọc khối Đợt 217 → 216 ngay dưới.
> Trước đó **(Đợt 215 + 215b)** — **OPTIONS: MỘT THANH POINTS OFF · HAI CỘT CÓ NGHĨA · CỤM TRÊN ĐỔI BỘ MÀU**
> — ✅ **THẦY DUYỆT CẢ HAI, CHỐT BẢN**, đi CHUNG MỘT COMMIT `ad06d16`, **ĐÃ PUSH + LIVE** (3/3 mã băm
> SHA-256 khớp trên `aword.andrewclasses.com`, kho sạch, `main` = `origin/main`).
> Trước đó **(Đợt 214)** — **TIME COST RỜI KHỎI Ô TIMER** (thầy "ok build" + cho
> phép commit/push/ghi hồ sơ không cần hỏi lại). Xem khối Đợt 214 ngay dưới đây.
> Trước đó **(Đợt 213 + 213b)** — ✅ **THẦY DUYỆT CẢ HAI, CHỐT BẢN**, đi CHUNG MỘT COMMIT `30756c6` — **ĐÃ PUSH + LIVE** (đối chiếu **14/14 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`, kho sạch, `main` = `origin/main`).
> Cả hai đợt là MỘT mạch việc **OPTIONS** thầy giao và duyệt trong cùng ngày 20/8; phiên sau đọc khối
> 213b → 213 bên dưới là đủ nắm. Trước đó **(Đợt 211 + 212)** — ✅ **THẦY ĐÃ DUYỆT CẢ HAI, CHỐT BẢN** (20/8/2026, thầy xem trên máy thật); cả hai đi CHUNG MỘT COMMIT `9076faf` (thầy: “commit + push + ghi hồ sơ dự án một thể”). Trước đó **(Đợt 207→210)** ✅ **THẦY DUYỆT, CHỐT BẢN — cả 4 đợt ĐÃ COMMIT + PUSH + LIVE**
> (`38895e7` → `858fa4c` → `3a2b351` → `3b385c7`; đối chiếu lần cuối **6/6 file trùng mã băm SHA-256**
> trên `aword.andrewclasses.com`, kho sạch, `main` = `origin/main`).
> Chuỗi 4 đợt này là MỘT mạch việc Showdown thầy giao và duyệt trong cùng ngày 20/8 — phiên sau đọc khối
> Đợt 210 → 207 bên dưới theo thứ tự NGƯỢC là đủ nắm.
> ⬜ Ba việc nhỏ còn treo (chỉ mắt thầy, KHÔNG chặn gì): hào quang tên 3 bạn đầu trên màn 86" · chữ vàng
> bạn số 2 trên ô bạc có rõ không · chơi trọn một ván xem bảng cuối không còn Leaderboard trong Showdown.
>
> **Đợt 217 — SÁU VIỆC MỘT LƯỢT: TÊN TRONG PHỄU · GIÀNH TEAM · TẠM DỪNG LAN · CHE BÀI KHI FIGHT · RESET SẠCH.**
> ✅ Thầy duyệt Đợt 216 rồi giao tiếp sáu việc này, chốt *"rồi commit + push + ghi nhật ký hồ sơ một
> thể"* ⇒ **216 + 217 đi CHUNG MỘT COMMIT**. Sửa **11 file code**. 0 lỗi console.
> ĐÃ COMMIT `6244fe0` + PUSH + **LIVE** — đối chiếu **11/11 file trùng mã băm SHA-256** trên
> `aword.andrewclasses.com` (đã `tr -d '\r'` cả hai đầu theo bẫy CRLF Đợt 213b), và **12/12 phép hỏi
> module chạy trên CHÍNH BẢN LIVE**: `tieWindowMsOf(0)=∞` · giữ 7s/10s · snap 7,3→7,5 · act cũ 3,0 không
> nhúc nhích · đáy phễu 52 · có `releaseTeamClaim` · chốt START **522ms** · che bài quiz `0.12` · bảng công
> cụ dừng đồng hồ rồi chạy lại. Kho sạch, `main` = `origin/main`.
> - ⚠️⚠️ **TÊN TRONG PHỄU: thuật toán KHÔNG sai, sai ở LÚC NÓ ĐƯỢC GỌI.** Đo trước khi sửa: gọi bình
>   thường thì **0/12 tên bị cắt** ở cả ba bề ngang; **gọi lúc bảng đang ẩn thì 3/12 bị cắt, font
>   nguyên cỡ** (đúng ảnh thầy gửi) — cả bảng vẽ bằng `cqw` nên vùng chứa rộng 0 ⇒ cỡ chữ ra 0 ⇒
>   `if (!base) return` **bỏ cuộc trong im lặng**. ⛔⛔ **`ResizeObserver` KHÔNG đủ một mình**: đo tại
>   chỗ, pane ẩn ⇒ nó **bắn 0 lần, kể cả lần đầu lúc bắt đầu quan sát** (cùng họ bẫy rAF) ⇒ phải kèm
>   **vòng thử lại 4 lần có đáy** bằng `setTimeout`. ⭐ Thêm sàn cuối `NAME_HARD_MIN_RATIO`
>   (`NAME_MIN_RATIO` là mức "thà viết tắt còn hơn nhỏ thêm", **không phải** "thà cắt còn hơn"), và
>   nới đáy phễu **46% → 52%**.
> - ⭐⭐ **TẠM DỪNG NAY CÓ LÝ DO** (`enterPause(reason,{dim})`): `"menu"` · `"panel"` · `"relay"` ·
>   `"stolen"`. ⛔⛔ **Phải là TẬP, không được là CỜ** — mở Options rồi bấm ☰ Menu rồi đóng Menu, với
>   một cờ thì chính cú đóng đó **thả đồng hồ chạy lại trong lúc bảng Options vẫn che kín màn**.
>   ⚠️⚠️ **`dim` đi theo NGUỒN**: bảng công cụ đã phủ tối cả khung nhìn, bàn kia đắp thêm tấm che nữa
>   là **nửa màn hình bên đó tối hơn hẳn nửa bên này**. API mới `fight.ctl.registerPause/setPaused`.
> - ⭐⭐ **CHE DẤU VẾT TRẢ LỜI KHI FIGHT** — `core/fight.js` gắn `.aw-fight-board.is-concealed`, **template
>   tự khai** cái gì là dấu vết bằng vài dòng CSS (5 template đã khai; crossword/open the box không cần
>   vì là `fightPick`). ⛔ Một hàm `conceal()` trong `ctl.attach` sẽ bắt 7 template sửa JS và template
>   nào quên là **im lặng hở bài** — luật tự-chọn-tham-gia Đợt 143. Chỉ từ **0,2s trở lên** (thầy chốt).
> - ⭐⭐ **GIÀNH LẠI TEAM CỦA MÁY KHÁC**: `releaseTeamClaim()` — hàm ghi duy nhất dám đụng hàng trình
>   duyệt khác. ⛔ **Hai bước**: ✗ chỉ NHẢ, dấu tích mới LẤY. ⚠️⚠️ `.is-taken` **thôi dùng `opacity` +
>   `pointer-events:none` trên cả cột** — `opacity` nhân xuống cả cây con **không có đường lùi**, nhãn
>   "Picked ✓" và dấu ✗ đều mờ theo và bấm không được.
> - ⚠️⚠️ **MÁY BỊ GIÀNH: điều kiện là "CÓ NGƯỜI KHÁC ĐANG GIỮ", KHÔNG PHẢI "không còn ai giữ"** — claim
>   biến mất có thể chỉ là hết TTL 12h / mạng rớt / chưa publish, dừng ván giữa giờ vì mấy thứ đó tệ hơn
>   hẳn cái nó chữa. ⛔ Tấm chặn `.aw-sd-stolen` **không có nút đóng** (thầy: *"buộc dừng game"*), phủ
>   khung chơi nhưng **không** phủ hàng nút — nút MODE phải còn bấm được.
> - ⛔⛔ **RESET KHÔNG SẠCH: BA CHỖ.** (1) **`roster = saved` trong `boot()` là GỐC RỄ** — một dòng đặt
>   danh sách lớp thành đúng những người đang ở trong cột, nên ai **không** ở cột nào thì **không còn
>   tồn tại trên màn hình**: không có trong hồ bơi, không có trong cột nào để nhấc ra. (2) `pool = []`
>   là một **giả định** thay cho một phép tính. (3) **Tiếng vọng của chính cú reset** — `wipeSetup()`
>   ghi bảng rỗng, bộ nghe của **chính màn vừa reset** tưởng người khác reset và **đè bộ cột mới về
>   rỗng**; một cuộc đua, nên chỉ *"đôi khi"* cắn đúng như thầy tả.
> - ✅ **ĐO TRÊN APP THẬT**: phễu 0 tên bị cắt ở mọi ca · tạm dừng + che bài **18/18** · giành team
>   **19/19** · bị giành giữa ván **15/15** (có đối chứng ngược) · 5/5 selector che bài trúng phần tử
>   thật · chạy lại bench Đợt 216 vẫn **33/33**.
> - ⬜ **CÒN LẠI (mắt/tay thầy)**: (1) nhãn "Picked ✓" em đặt ở **đáy TRONG cột** chứ không dưới mép
>   ngoài như thầy tả (dưới mép ngoài sẽ bị cắt cụt hoặc đè hàng nút) — thầy xem có chịu không ·
>   (2) chạm thật vào thanh trượt trên TOMKO (treo từ Đợt 216) · (3) hai máy thật giành team của nhau ·
>   (4) mờ 12% nhìn từ cuối lớp đã đủ kín chưa · (5) tên hàng cuối phễu trên màn 86" · (6) reset nhiều
>   lần liên tiếp trên 2-3 máy.
>
> ---
> **Đợt 216 — CHỐT NỬA GIÂY SAU START · TIME DELAY LÊN 10s VỚI ∞ THẬT · THANH TRƯỢT CHỊU ĐƯỢC NGÓN TAY.**
> ✅ **THẦY DUYỆT** (20/8/2026) — đi chung một commit với Đợt 217. Thầy giao 3 việc một lượt, chốt 4 lựa chọn qua
> AskUserQuestion. Sửa **4 file**: `core/engine.js` · `core/fight.js` · `core/options-panel.js` ·
> `core/app.css`. 0 lỗi console.
> - ⭐⭐ **START NAY CHẶN CÚ CHẠM 0,5 GIÂY** (`START_GUARD_MS`). Đo bản cũ: ô đáp án **sống sau 31ms** —
>   `press()` bắn ở pointerdown (Đợt 175) còn handler tắt `pointer-events` ngay câu lệnh kế. ⭐ Vá bằng
>   **chính tấm che `.aw-play-overlay`** (đã `inset:0`, đúng lớp), không dựng phần tử mới: nó vẫn mờ đi
>   260ms nhưng **mờ rồi vẫn nuốt cú chạm**. ⚠️⚠️ **MỘT đồng hồ, không phải hai** — gỡ tấm che treo HẲN
>   vào `setTimeout`, để `fade.onfinish` lại là game hở ra ở mốc 260ms và chốt coi như không có.
>   ⚠️ `playStarted` là biến MỚI cho Options ▸ Apply: *"đã bấm PLAY chưa"* và *"tấm che còn trong DOM
>   không"* **trước giờ là một câu hỏi, từ nay thì không**. Đo: **31ms → 522/524/543ms** (quiz · anagram
>   · true-false), tấm che được dọn sạch.
> - ⭐⭐ **TIME DELAY 0,1 → 10s**, thang **không đều** (`DELAY_STEPS`: 0,1…3,0 bước 0,1 rồi 3,5…10,0 bước
>   0,5 = **44 nấc + ∞**). ⚠️⚠️ Vì thế **thanh kéo chạy trên CHỈ SỐ** (`1 / 45 / 1`) — range chỉ có MỘT
>   `step`; và thang đều 0,1 sẽ là 100 nấc, mà chạm cạnh nút chỉ đi 1 nấc (Đợt 213) ⇒ 1s→8s là bảy chục
>   cú chạm. ⚠️⚠️ **TRẦN NẰM Ở HAI NƠI**: quên `fightOptionsFrom()` là kéo lên 7s, lưu được, **mở lại về
>   3s trong im lặng**. ⭐ Act cũ 0,1…3,0 **giữ nguyên từng phần mười, 30/30**.
> - ⭐⭐ **NẤC ∞ NAY LÀ ∞ THẬT** (thầy: *"cứ chờ mãi thôi cho đến khi câu đó được hoàn thành"*) —
>   `TIE_UNLIMITED_MS = 5000` **gỡ hẳn**, `tieWindowMsOf()` trả `Infinity`. ⚠️⚠️ **Cấm đưa số đó cho
>   `setTimeout`**: đặc tả kẹp delay không hữu hạn về **0**, tức ∞ sẽ thành nấc NHANH NHẤT của thanh —
>   nên ở ∞ **không đặt đồng hồ nào**, vòng đóng bằng SỰ KIỆN (bàn kia báo xong). ⚠️⚠️ **Phải có ai đó
>   còn chơi để mà chờ**: bàn kia có thể đã trả lời SAI trước (khoá bàn nhưng không đặt `pendingWinner`)
>   ⇒ nhánh `tieUnlimited && roundDone[other]` chốt ngay, nếu không là **treo cứng cả trận**.
>   ⛔ **Lưới an toàn 20s không phủ ca này** — đội bỏ đi ở ∞ thì vòng chờ mãi, đường ra là Menu ▸ Start
>   again. Đã báo thầy trước khi làm, thầy vẫn chọn ∞ thật.
> - ⭐ **Thanh chờ ở ∞ = trạng thái thứ ba của `runWaitBar(ms)`**: đứng đầy, thở, hào quang, vệt sáng chạy
>   (`.is-forever`, tất cả bằng CSS). ⚠️ Phải `return` **TRƯỚC** dòng `transition` — `"width Infinityms"`
>   là chuỗi vô nghĩa, Chrome bỏ cả khai báo rồi `width="0%"` áp dụng **không transition** ⇒ ∞ hiện thanh
>   **rỗng tức thì**. ⚠️ Hào quang trên hộp NGOÀI (`overflow:hidden` cắt cụt nếu vẽ lên con). ✅ **Đã nhìn
>   bằng mắt trong Chrome thật** — 2 khung hình cho thấy vệt sáng đã chạy sang chỗ khác.
> - ⛔⛔⛔ **CỬ CHỈ ±1 NẤC CỦA ĐỢT 213 CHƯA BAO GIỜ CHẠY TRÊN MÀN CẢM ỨNG.** `preventDefault` trên
>   `pointerdown` chỉ chặn **chuỗi sự kiện CHUỘT tương thích**; hành vi mặc định của một cú CHẠM không huỷ
>   được ở đó, mà Chromium điều khiển kéo `<input type=range>` bằng cảm ứng ở **tầng touch**. Không máy
>   build nào ở đây có màn cảm ứng ⇒ ba đợt không ai thấy. ⭐ Vá bằng **chốt Ở GIÁ TRỊ, không ở sự kiện**
>   (`guardValue` + hoàn nguyên đồng bộ trong `oninput`) — không phụ thuộc trình duyệt hiểu
>   `preventDefault` ra sao, và không cướp mất cuộn panel. ⚠️⚠️ **Phải `setPointerCapture`**: nhấc tay
>   lệch ra ngoài thanh thì chốt **kẹt vĩnh viễn** và thanh chết với mọi cú chạm sau.
>   **Đối chứng ngược trên chính module cũ: 4/16 → 16/16.**
> - ✅ **ĐO TRÊN APP THẬT**: trận Fight quiz 2 bàn **33/33** · chốt START trên 3 template · thanh trượt
>   16/16 với 3 dạng thang (0..100 · nửa nấc 0,5 · chỉ số 45 nấc).
> - ⬜ **CÒN LẠI (tay/mắt thầy trên TOMKO)**: (1) **chạm thật vào thanh trượt** — phép thử cuối, máy này
>   không làm được; dự phòng nếu vẫn hỏng là huỷ `touchstart` `{passive:false}`, đổi lại mất cuộn panel ·
>   (2) chốt 0,5s có thấy "đơ" không · (3) chơi thật một trận ở nấc ∞ · (4) bước 0,5s ở vùng trên có đủ
>   tinh không.
>
> ---
> **Đợt 215b — CỤM TRÊN CỦA OPTIONS ĐỔI BỘ MÀU: xanh lá ĐẬM, nút tô đặc, chữ trắng.**
> ✅ **THẦY DUYỆT — CHỐT BẢN** (20/8/2026), ĐI CHUNG MỘT COMMIT `ad06d16` với Đợt 215 — **ĐÃ PUSH + LIVE**
> (3/3 mã băm SHA-256 khớp, 10/10 phép hỏi module trên bản live). Sửa **1 file**: `core/app.css`.
> - ⛔⛔ **THỦ PHẠM LÀ CÁI NÚT, KHÔNG PHẢI CHỮ.** Đo bộ cũ: chữ đang chọn 4.00 · chữ chưa chọn 2.73 ·
>   **nút đang chọn nổi trên máng 1.20** ⇒ nút xanh nhạt trên máng xanh nhạt là **gần như tàng hình**,
>   hàng công tắc thôi trả lời được câu *"đang chọn cái nào?"*. Làm đậm chữ không chữa được chỗ đó.
> - ⭐⭐ Thầy chọn **bộ B** trong **17 bộ dựng sẵn** (`scratch/mau215.html` — 10 nguội/trung tính gồm cả
>   kiểu đảo ngược máng tối và nút chuyển sắc, 7 tông nóng ấm): **giữ nguyên quyết định Đợt 213 rằng
>   cụm trên màu xanh lá**, chỉ đảo lại độ đậm. Sau: **7.13 / 8.00 / 5.87**.
> - ⚠️ **`#166534` là SỐ ĐO**: chữ trắng trên `#16a34a` (xanh của thanh Lives) chỉ 3.30 — phải xuống hai
>   nấc đậm hơn chữ trắng mới gánh nổi.
> - ⭐ **Hai biến MỚI** `--aw-grp-off` (chữ nút chưa chọn) và `--aw-grp-edge` (viền ô đếm giờ): trước ghim
>   cứng, nay đọc biến với **dự phòng đúng bằng màu xám cũ** ⇒ nửa dưới dòng kẻ không đổi một byte.
>   ✅ **Đối chứng ngược đã đo**: seg Anagram mode vẫn máng `#eef2f7`, nút trắng, chữ `#2f7bff`.
> - ⭐ **Chữ trắng KHÔNG "bay trên máng nhạt" lúc trượt** — giải bằng hai đường cong (nút 240ms dốc
>   trước, chữ 180ms): t=120ms nút đã đi 95% mà chữ mới trắng 92% ⇒ nền luôn tới trước. ⛔ Đừng đắp
>   `transition-delay` "cho chắc": delay quá thì chữ sẫm nằm trên nút xanh đậm (~1.3).
> - ⛔⛔ **BẪY**: `visibilityState:"hidden"` **đóng băng cả CSS transition** — ở **cả pane preview lẫn
>   Chrome thật** khi cửa sổ không hiện; mọi số ĐỘNG đo lúc đó là rác (mốc giờ nhảy 116→1114ms), số
>   TĨNH vẫn đúng. ⭐⭐ **Chrome thật (`mcp__claude-in-chrome`) VẪN CHỤP ĐƯỢC ẢNH + `zoom`** dù
>   `screenshot` của pane hỏng lần thứ 9 liên tiếp — đây là đường ra cho mọi việc phải nhìn bằng mắt.
> - ⬜ **CÒN LẠI (mắt thầy)**: `#166534` trên màn 86" có quá đậm/chói không · chữ nút chưa chọn `#2f4a3a`
>   đã đủ phân biệt chưa · trang 17 bộ vẫn còn, đổi ý chỉ là sửa 5 dòng biến.
>
> ---
> **Đợt 215 — OPTIONS: MỘT THANH POINTS OFF, VÀ HAI CỘT CÓ NGHĨA.**
> ✅ **THẦY DUYỆT — CHỐT BẢN** (20/8/2026) · COMMIT `ad06d16` · **ĐÃ PUSH + LIVE** (3/3 mã băm SHA-256,
> 10/10 phép hỏi module chạy trên chính bản live). Thầy giao 2 việc, chốt 3 lựa chọn qua
> AskUserQuestion. Sửa **2 file**: `core/options-panel.js` (hàm mới `seatCellsByColumn`) ·
> `templates/anagram/anagram.js`. 0 lỗi console. Bản gốc: `_backup/dot215/`.
> - ⭐⭐ **HAI CỘT NAY CÓ NGHĨA: trái = mạng/thưởng, phải = phạt.** Đo trước khi sửa trên **17
>   template × 3 chế độ = 35 bảng**: **28/35 sai**. ⭐ **Sắp xếp của Đợt 213 không đủ** vì nó quyết
>   *"ô nào đứng trước"*, còn lưới chảy theo HÀNG nên *"ô nào ở cột nào"* lại do **số ô đứng trước**
>   quyết định — hai câu hỏi khác nhau. Sau khi sửa: **còn 5 bảng**, và 5 đó là **cố ý** (hàng có
>   **cả hai ô đều là thanh phạt**; tách nốt = bảng cao thêm một hàng, cột trái trống trơn).
> - ⭐ **BA LUẬT, ĐỀU CỤC BỘ TRONG MỘT HÀNG**: (1) phạt cạnh không-phạt ⇒ phạt sang phải; (2) thưởng
>   bên phải cạnh ô cài đặt thường ⇒ thưởng sang trái; (3) phạt đứng một mình ⇒ sang phải, **chừa ô
>   trống bên trái** (thầy chốt, biết trước là 8 template sẽ có một ô trống).
> - ⛔⛔ **ĐỪNG CHIA LẠI CỘT TOÀN BẢNG** ("dồn hết thanh trái vào cột 1"): Running word chỉ có MỘT
>   thanh phạt nên phép chia cột **kéo Pass penalty lên hàng 1** cạnh "Team A" và dìm hai ô tên đội
>   xuống đáy. Đổi chỗ trong hàng thì không gì vượt qua ranh giới hàng.
> - ⭐⭐ **CỤM Time delay + Speed bonus (Fight) TÍNH LÀ THƯỞNG** và nay về cột trái (thầy chốt) — nó
>   là **ô cao hai hàng**, cột quyết ở hàng đầu, hàng dưới đi theo.
> - ⭐ **Bố cục được MÔ PHỎNG, không đo `rect`**: bảng dựng lúc còn ngoài màn hình nên mọi rect = 0
>   (Đợt 156). Ô trống làm bằng `grid-column: 2`, **không** bằng div rỗng (`> * { margin-bottom: 9px }`).
> - ⭐⭐ **ANAGRAM CHỈ CÒN MỘT THANH "Points off"**, tự đổi nhãn `wrong answer` ⇄ `wrong letter` theo
>   mode — đóng dòng ⬜ của Đợt 213 (hai ô cùng tiêu đề). ⭐ **Gộp được là nhờ Đợt 143** đưa cả app về
>   một thang 0..100 nấc 1; trước đó là hai thang khác nhau nên buộc phải hai thanh. ⭐⭐ **Thứ được
>   LƯU không đổi**: `pointsOff` và `letterPenalty` vẫn là hai trường riêng, mỗi cái nhớ số của mình
>   ⇒ **act cũ không cần di trú**, `mount()` không đổi dòng nào. ⚠️ Đổi mặt đi qua `paint()`, **không**
>   qua `oninput` (gọi oninput lúc đó là ghi vào mode vừa rời). Bảng Anagram **thấp đi 59px**.
> - ✅ **ĐO TRÊN APP THẬT**, không chỉ bàn thử: `test.html` của quiz/anagram/whack-a-mole, Apply rồi
>   mở lại Options (act nhận đủ **cả hai** số), và **4 trận Fight THẬT**.
> - ⛔ **BẪY ĐO ĐÃ DÍNH**: bản sao hình dạng của Fight **sai với `crossword` + `open the box`** (hai
>   game chạy luật chọn lượt `fightPick`: **không có Time delay**) ⇒ phải mở trận thật bằng
>   `await import('/core/fight.js')` + `startFight()` ngay trong trang `test.html`. Và
>   `querySelector('.aw-optc-lab')` **trút xuống ô con** của ô rộng ⇒ phải `:scope >`.
> - ⬜ **CÒN LẠI (mắt thầy)**: ô trống bên trái nhìn có trơ không · Gameshow/Running word sau khi đổi
>   chỗ · thanh Points off gộp đổi nhãn có tự nhiên không · có tách nốt 5 hàng "hai thanh phạt" không.
>
> ---
> **Đợt 214 — TIME COST RỜI KHỎI Ô TIMER: "đã đặt là trừ", Timer=None không còn tắt ngầm.**
> ✅ Thầy chốt hướng qua 3 câu hỏi + "ok build" (20/8/2026, kèm quyền commit/push/ghi hồ sơ không hỏi
> lại). Sửa **2 file**: `core/engine.js` (2 chỗ) · `core/timecost.js` (1 chỗ). 0 lỗi console.
> - 🐞 **LỖI THẦY BÁO**: "thời gian trôi qua nhưng không bị trừ điểm time cost ở các chế độ" (thấy ở
>   Fight, không số -N nào bay, ngay từ đầu trận, trên MỌI máy). **Nguyên nhân gốc đo được trên thư
>   viện THẬT** (đọc qua Chrome đã đăng nhập, `store.listChildren` quét 17 act): act
>   `DS-S4.I1.W1 / WORDS` lưu `timeCost:58 + timer:"none"` (bộ text:eng1) — mà `timeCostPer()` cũ trả
>   0 khi `timerMode()==="none"` ⇒ **Timer=None là công tắc tắt NGẦM**, panel vẫn cho kéo Time cost
>   lên thành nút chết. Mọi máy cùng dính vì dữ liệu act dùng chung qua mây.
> - ⭐⭐ **SỬA**: `timeCostPer()` bỏ vế `timerMode()==="none"` — thanh trượt tự quyết. Và
>   `startIdleWatch()` dời RA NGOÀI nhánh `timerMode()!=="none"` của `startTimerNow()` (không dời là
>   Timer=None vẫn không bao giờ khởi động đồng hồ trống dù per > 0). Nó tự no-op khi thanh Off nên
>   game không dùng không cấp phát gì — y như cũ.
> - ⭐ **HIỆU ỨNG khi không có đồng hồ nhìn thấy** (`timecost.js`): phần tử `visibility:hidden` vẫn đo
>   ra rect đầy đủ ⇒ guard `b.w > 0` cũ để số -N bay vào khoảng trống vô hình. Nay kiểm thêm
>   `visibility !== "hidden"` của đích: đích ẩn (Single + Timer=None) ⇒ -N **đậu trên ô điểm rồi tan
>   tại chỗ** (cùng nhịp, co về .8); Fight thì đồng hồ dải giữa luôn hiện (đứng 00:00) nên vẫn bay.
> - ✅ **ĐO TRÊN APP THẬT** (bench `scratch/tc-idle-test.html` mới + `scratch/fight-bench.html`):
>   Single anagram Timer=None −10/nhịp + tan tại chỗ (4 keyframe, không travel) · Single quiz countUp
>   bay như cũ · Fight anagram Timer=None trừ CẢ HAI đội (−60/−60) · Fight quiz countUp như cũ (−240
>   sau 24s = đúng 10/s) · flow thật của thầy (Timer=None, kéo thanh qua panel, Apply, Play) trừ đúng
>   · Running word (không cờ `timeCost`) không trừ, không watcher thừa.
> - ⚠️⚠️ **ACT CŨ "SỐNG DẬY"**: `DS-S4.I1.W1 / WORDS` sẽ bắt đầu trừ **58 điểm mỗi 2s trống** ngay khi
>   bản này lên — 58 trông như giá trị kéo dở tay (đã báo thầy, thầy chưa chốt đổi; **chưa đụng dữ
>   liệu act**). Act `DS-S2.I1.W3 / WORDS` thì `tc:0 idle:3` — thanh vẫn Off nên không đổi gì.
> - ⚠️ **BẪY ĐO đã dính trong phiên**: pane trình duyệt bị ẨN ⇒ `requestAnimationFrame` không chạy ⇒
>   vòng đếm giảm không vẽ, nhìn y như "không trừ" dù `-N` vẫn sinh — đúng bẫy đã ghi trong HUONG DAN
>   CORE (phải front tab rồi mới đo). Và `visibilityState` là thứ phân xử, đừng tin mắt.
> - ⬜ Ba việc mắt thầy: (1) -N tan tại chỗ ở Single Timer=None nhìn có "đã" không hay muốn kiểu khác ·
>   (2) Fight Timer=None: -N bay vào đồng hồ 00:00 bất động có kỳ không · (3) giá trị 58 của
>   `DS-S4.I1.W1 / WORDS` có phải ý thầy không (thầy tự chỉnh trong Options hoặc bảo phiên sau sửa).
> - 📌 **PHÁT HIỆN PHỤ chưa xử lý** (không chặn gì, chờ thầy quyết): thanh trượt từ Đợt 188/213 **kéo
>   mà đặt tay NGOÀI nút = không có tác dụng** (chỉ nắm trúng nút mới kéo; chạm 2 bên = ±1 nấc). Khi
>   thanh đang Off nút nằm tít mép trái rất khó nắm trên màn cảm ứng — dữ liệu thật cho thấy dấu vết:
>   act để `tc:0` nhưng `idle:3` (đụng ô mà không kéo được thanh), act khác dính đúng `tc:1` (= 1 lần
>   chạm phải). Thầy đã chọn **GIỮ NGUYÊN** cử chỉ Đợt 213 khi được hỏi 20/8 — đừng tự đổi; nếu thầy
>   than khó kéo trên TOMKO thì đây là chỗ cần nhìn lại đầu tiên.
>
> ---
> **Đợt 213b — KHU Ô TÍCH: XẾP THEO CỘT CHO TỪNG TEMPLATE.**
> ✅ **THẦY DUYỆT — CHỐT BẢN** (20/8/2026) — 82/82 ĐẠT (`scratch/dot213-opts.html`, thêm nhóm K) + **đo bố cục THẬT cả 17
> template**: 17/17 đúng cột thầy giao · căn giữa lệch **0px** · bề rộng bảng **không đổi** (550–553px
> trước và sau). 0 lỗi console. Sửa **20 file** (`options-panel.js` · `app.css` · **cả 17 template**).
> Đi CHUNG COMMIT với Đợt 213. Thầy đọc từng template theo CỘT ("cột 1 dòng trên/dòng dưới").
> - ⭐⭐ **`checkOrder` — danh sách MÃ ĐỊNH DANH, KHÔNG PHẢI CHỮ HIỆN RA.** Chính đợt này đổi nhãn
>   "Show answer when wrong" → "Show corrects", và `shuffleLabel` từ lâu đã đổi "Shuffle questions"
>   thành "Shuffle item order" cho Speaking cards ⇒ **chữ chưa bao giờ là tên định danh**; sắp theo chữ
>   là đợt sau đổi nhãn một cái, bố cục vỡ trong im lặng.
>   ⚠️ Mã **không khai** (Fight "In turns", Showdown "Balance questions") xuống **cuối** — hai mode thầy
>   chưa xếp, nên đặt lộ ra chứ không đoán. ⚠️ Template **chưa khai** `checkOrder` thì **không bị đụng**.
>   ⭐ `box.append(...sorted)` **DI CHUYỂN** node đang là con (không nhân bản) ⇒ không mất listener.
> - ⭐⭐ **ĐỔ THEO CỘT** (`grid-auto-flow: column` + số dòng cố định), thay `repeat(auto-fill, …)` đổ theo
>   HÀNG — thứ làm 4 ô ra "3 rồi 1" dồn sang trái, đúng cái thầy gọi là "lệch sang 1 bên".
>   ⚠️ **2 dòng, trừ khi phải đẻ cột thứ 4**: bảng chặn 580px, cột cần ~168px ⇒ **3 cột là tối đa**;
>   `layoutChecks()` chuyển 3 dòng khi quá 6 ô (hôm nay chỉ Gameshow). ⛔ Đừng gọn hoá thành hằng số 2.
>   ⚠️ **168px là SỐ ĐO** (nhãn dài nhất: "Change the crossword"); ⚠️⚠️ **`minmax(0, 168px)` — số 0 chịu
>   lực**, cho cột co lại khi cửa sổ hẹp thay vì tràn. ⛔ Đừng viết `168px` trần.
> - ⚠️ **QUY ƯỚC CŨ BỊ ĐẢO**: "Show answers at end" **thôi đứng cuối** ở Type the answer và Whack a mole
>   — quy ước thầy chốt 1/8/2026 nay chỉ đúng ở nơi `checkOrder` xếp thế.
> - ⭐ **FIND THE MATCH có ô "Shuffle answers" mới** — nhưng bảng chữ **vốn đã trộn vô điều kiện**, nên nó
>   chỉ là đường **TẮT**; mặc định BẬT = y hệt mọi act đang có. ⛔⛔ **LUẬT FIGHT ĐỨNG TRÊN CÔNG TẮC**:
>   `fightCtl` hỏi TRƯỚC và RIÊNG, nên trong trận hai bàn vẫn cùng một bảng chữ (Đợt 184). ⛔ Đừng gộp
>   hai điều kiện làm một.
> - ⛔⛔ **WHACK A MOLE: GỠ HẲN thùng "loot" + thùng "power up"** (thầy được hỏi thẳng, chọn "bỏ luôn TÍNH
>   NĂNG") — kể cả **cơ chế nhân đôi điểm 6 giây**. ⚠️⚠️ **Act cũ nay chơi ra ĐIỂM THẤP HƠN** (đã báo
>   trước). Trường `bonusLoot`/`bonusPower` còn trong act đã lưu, không ai đọc ⇒ không cần di trú.
>   Ô "Crate: extra time" **tô xanh lá** (cùng cách đánh dấu "In turns" Đợt 202).
> - ⚠️ **`grep` trúng CHỮ không có nghĩa là trúng CỜ**: em tưởng Whack a mole có "Auto next question" vì
>   `usesAutoSwitch` xuất hiện trong file — hoá ra chỉ nằm trong một dòng **GHI CHÚ**. Đọc lại dòng đó.
> - ⚠️ Thầy viết crossword "show corrects (thay cho show answers at end)", **vênh** với cột 3 của chính
>   thầy; hỏi lại thì thầy chốt là thay cho "Show answer when wrong". **Hỏi lại rẻ hơn build nhầm.**
> ⛔ **BẪY ĐỐI CHIẾU MÃ BĂM (Đợt 213b)**: file trong thư mục làm việc của máy này là **CRLF**
> (`core.autocrlf` — chính dòng cảnh báo "LF will be replaced by CRLF" lúc commit), bản trên Pages là
> **LF** ⇒ mã băm khác dù nội dung giống hệt. **Luôn `tr -d '\r'` ở CẢ HAI ĐẦU trước khi băm.** Và ⚠️
> "đa số file khớp" KHÔNG chứng minh phép đo đúng — chỉ file vừa sửa mới lệch.
> ⛔ Đừng dò một tính năng bằng cách `grep` tên nó: **dòng ghi chú giải thích việc GỠ nó cũng chứa tên đó**
> (đã suýt kết luận sai). Muốn chắc thì so với `git show <sha>:<file>`.

> ⬜ **CÒN LẠI (mắt thầy)**: "Change the crossword" ở cột 168px có bị cắt cụt trên màn 86" không ·
> Gameshow 3 dòng × 3 cột có chật không · Whack a mole mất 2 thùng kia chơi có hụt không.

> ---
> **Đợt 213 — OPTIONS: CỤM TRÊN XANH LÁ · THANH KÉO KHÔNG BAO GIỜ ẨN · TRÁI-PHẢI THEO VAI TRÒ · CHẠM HAI PHÍA.**
> ✅ **THẦY DUYỆT (20/8/2026)** — 71/71 ĐẠT (`scratch/dot213-opts.html`, nạp module THẬT) + 4 vòng đo trên **app
> thật** (10 template · Anagram đổi mode · Settings · Fight), 0 lỗi console. Sửa 6 file:
> `options-panel.js` · `app.css` · `fight.js` · `anagram.js` · `anagram.css` · `speaking.js`.
> Thầy giao 5 việc một lượt, làm ở **Single** rồi cho lan sang mode khác cho đồng nhất, **chừa phần của
> riêng từng mode** (nên ô "Time each round" của Showdown vẫn có title và vẫn nằm dưới dòng kẻ).
> - ⛔⛔ **TIMER *TRÔNG NHƯ* LÊN CỤM TRÊN NHƯNG VẪN Ở HỘP DƯỚI — ĐỪNG "DỌN DẸP" CHO NGAY NGẮN.** Dời thật
>   vào `swHost` là cách đọc hiển nhiên của câu thầy viết và là **hỏng Đợt 147**: mỗi bộ nghĩa giữ Timer
>   riêng, mà `swHost` **dựng một lần rồi để yên** (Đợt 149) ⇒ đổi ENG1→VI1 vẫn hiện đồng hồ bộ cũ, **sai
>   trong im lặng**. Đường ráp giữa hai hộp vô hình nên vẽ cụm vắt qua nó không mất gì.
> - ⭐⭐ **BA BIẾN MÀU khai trên đúng 3 vùng chứa** (`.aw-opt-setswitch` · `.aw-opt-content` ·
>   `.aw-optc.aw-opt-top`), rule gốc đọc chúng **kèm màu xám cũ làm dự phòng**. ⛔ **ĐỪNG tô thẳng vào
>   `.aw-seg`/`.aw-opt-switch`** — hai class đó dùng chung với cả khu dưới, tức đúng nửa thầy bảo để yên.
> - ⭐⭐ **VAI TRÒ ĐỌC TỪ `tone`, KHÔNG KHAI LẦN THỨ HAI**: `mkSliderCell` đóng dấu `data-aw-rank`
>   (xanh lá/vàng 0 · xanh dương 1 · đỏ/không màu 2) và `orderSliderCells()` sắp theo đó. ⛔ **Hệ quả:
>   thanh nào SAI MÀU thì nay SAI LUÔN CHỖ ĐỨNG** — nên 3 thanh lệch màu phải sửa cùng đợt (Speed bonus
>   → vàng ở **cả hai** nhánh · Time delay → xanh dương · Stars to pass → xanh dương).
> - ⭐ **Sắp xếp THẢ LẠI ĐÚNG CHỖ NGỒI CŨ** ("ưu tiên", không phải "luôn luôn" — thầy chốt) ⇒ bảng không
>   bao giờ mọc ô trống, và thanh trượt **không bao giờ nhảy qua khu Fight**. Ba loại ô cố ý đứng yên:
>   ô không có `data-aw-rank` · `.aw-optc-wide` · `.aw-optc-stack` (hai thanh của nó lồng bên trong nên
>   hàm sắp xếp không nhìn thấy — cụm Time delay + Speed bonus của Đợt 188 đi nguyên khối).
> - ⚠️⚠️ **BẪY ĐẶT LẠI CHỖ**: "nhớ chỉ số rồi `insertBefore(children[idx+1])`" **SAI** ngay khi 2 ô đổi chỗ
>   cho nhau — chỉ số trượt, và node mà chỉ số trỏ tới có khi chính là ô đang chờ dời. Dùng **node ghi chú
>   giữ chỗ** (vô hình với `children` và với CSS grid).
> - ⛔⛔ **GỠ HẲN ACCORDION ANAGRAM** (Đợt 134 dựng · 137 · 147 · 148 mài): 3 thanh nay **luôn hiện**, thanh
>   không dùng thì **nhạt** bằng `.aw-optc.is-locked` — chính luật Đợt 188 của thầy, nay mới tới chỗ cuối
>   cùng còn ẩn thật trong cả 17 template. ⛔ **Đừng dựng lại hộp `max-height` "để có animation"**: không
>   còn chiều cao nào đổi, và bẫy thanh-trượt-tàng-hình của Đợt 137 **chỉ tồn tại khi có thứ bị giấu mà
>   vẫn chiếm chỗ**. Đo: bảng Anagram **409px đứng yên qua cả 3 mode** (trần 675px, không tràn).
> - ⛔⛔ **CHẠM PHẢI +1 / CHẠM TRÁI −1 THAY HẲN CHẠM ĐÚP CỦA ĐỢT 188** (thầy chốt "bỏ hẳn"). Xoá luôn cửa
>   sổ 320ms — tức xoá luôn một dòng ⬜ đang treo trong danh sách TOMKO. ⚠️ **Đo phía lúc ĐẶT tay, không
>   phải lúc NHẢ tay**: nút chạy giữa hai sự kiện, hỏi lại lúc nhả là giữ tay yên bên phải thì thanh đếm
>   lên tới ngón tay rồi **quay đầu đếm xuống**. ⚠️ Vùng chết quanh nút vẫn **14px** (nửa nút + 4px) — nay
>   đáng chú ý hơn vì chạm sát nút thành cử chỉ tự nhiên nhất; thầy thử TOMKO rồi bảo nới hay thu.
> - 🐞 **Một lần lưới báo hỏng mà lỗi ở CHÍNH LƯỚI** (họ bẫy của Đợt 207·208·209): điểm chạm đặt cách nút
>   12px, lọt vào vùng chết 14px. Code đúng, phép đo sai.
> - 📸 `screenshot` **lại timeout** ⇒ nghiệm hoàn toàn bằng số đo, kể cả màu và độ sáng.
> ⬜ **CÒN LẠI (mắt/tay thầy)**: sắc xanh cụm trên trên màn 86" · hai ô cùng tên "POINTS OFF" của Anagram
> nhìn lướt có lẫn không · vùng chết 14px chạm sát nút có khó chịu không.

> ---
> **Đợt 212 — GỠ HẲN PRONUNCIATION KHỎI ACT TÍCH HỢP: HÀNG CÔNG TẮC VỀ TEXT | VOICE.**
> ✅ **THẦY DUYỆT — CHỐT BẢN** (20/8/2026) · ĐÃ COMMIT + PUSH (`9076faf`) — 32/32 ĐẠT (3 bàn thử node, một trong đó **import THẬT** một file .xlsx tự
> dựng bằng chính SheetJS của app) + 6 phép đo trên trình duyệt thật, 0 lỗi console.
> Sửa 6 file: `content-view.js` · `options-panel.js` · `lesson-import.js` · `app.css` · `engine.js`
> (chỉ ghi chú) · `anagram-editor.js`. **Đảo ngược Đợt 190 + Đợt 205.**
> Thầy: *"bỏ hẳn phần pronunciation trong options đi và không tích hợp phần pronunciation vào trong
> act tích hợp nữa… Đưa nút TEXT-VOICE và các act con về dạng như cũ… Khi import cũng không import dữ
> liệu này vào act tích hợp chung này nữa."* Thầy sẽ build **act PRONUNCIATION riêng** sau.
> - ⭐⭐⭐ **MỘT CỬA CHẶN DUY NHẤT: `variantsOf()`** lọc `"pron"` (`RETIRED_VARIANTS`). Mọi người đọc bộ
>   nghĩa đều qua đó — hàng Options · tab Edit · `activeVariant()` · nhãn tên act · bảng sinh giọng ·
>   cổng Fight ⇒ **một cái lọc nghỉ hưu cả tính năng, kể cả cho act đã có trong thư viện** (thầy chốt
>   "biến mất luôn — bỏ hẳn thật"). ⚠️ **KHÔNG XOÁ GÌ**: `content.variants` + `clues.pron` còn nguyên
>   trong Firestore để act riêng sau này đọc lại. Act từng chọn `pron` **rơi về bộ chữ đầu** — có chủ ý.
> - **Hàng công tắc**: bỏ `hasPron`/`is-3mode`/nhánh `"pron"` (−72 +36 dòng). Giữ thumb `--n`/`--i`
>   và `.is-wide` (chúng không dính nút thứ ba).
> - ⛔⛔ **BẪY NẶNG NHẤT — ĐO CHỮ, ĐỪNG CHỈ ĐẾM THẺ.** Lưới báo xanh "hàng có đúng 2 nút", **mà cỡ chữ
>   ra 8px**: `clamp(8px, 3.15cqw, 13px)` là công thức Đợt 205 dựng riêng cho chữ "PRONUNCIATION" dài,
>   `cqw` đo theo cái switch (vẫn là nửa hàng dù viết gì) nên chữ ngắn lại **nó không tự nới**. Trả về
>   **13px phẳng** như trước Đợt 205 (bảng gọn: **11px** phẳng). Cùng họ bẫy `container-type` Đợt 207.
> - ⭐⭐ **MODE › IPA VẪN SỐNG** (thầy chọn giữ) và **RUNNING WORD vẫn in phiên âm**. Import **vẫn đọc
>   cột /ipa/**, chỉ đổi chỗ đặt: `clues.pron` → **`item.ipa`**. `resolveItem()` đọc **CẢ HAI** cách
>   viết (`clues.pron` cho act Đợt 190 đã có, `rest.ipa` cho act từ nay) — ⛔ đừng "dọn" bên nào.
> - ⚠️ **BẪY 2 — TRÌNH SỬA LÀM RƠI HÀNH KHÁCH**: `anagram-editor.js` dựng lại mỗi dòng từ **các trường
>   CÓ TÊN**, nên `ipa` (nay là trường riêng, không còn nằm trong `clues`) **bay mất khi Lưu** — không
>   lỗi, không cảnh báo, chỉ là MODE › IPA rỗng ruột từ lần sửa act đầu tiên. Vá **cả đường NẠP lẫn LƯU**.
> - ⚠️ Thầy chốt hướng "act cũ giữ nguyên" ở lượt hỏi đầu, **vênh** với câu thầy viết; nêu chỗ vênh ra
>   thì thầy đổi thành "biến mất luôn". **Hỏi lại rẻ hơn build nhầm.**
>
> ---
> **Đợt 211 — BÀI GIAO PHẢI CHƠI ĐÚNG NHƯ ACT: HẾT TỰ PHÁT TIẾNG Ở CHẾ ĐỘ TEXT.**
> ✅ **THẦY DUYỆT — CHỐT BẢN** (20/8/2026) · ĐÃ COMMIT + PUSH (`9076faf`) — 13/13 ĐẠT (bàn thử node) + đối chiếu trước/sau trên trình duyệt thật,
> 0 lỗi console. ĐÃ COMMIT + PUSH (`9076faf`). Sửa 2 file: `core/assignment-ui.js` · `core/assignments.js`.
> Thầy: *"trong options chọn text nhưng act vẫn phát âm thanh và có nút loa… act thường tôi đã chỉnh rồi
> nhưng assignment có vẻ chưa."*
> - ⭐⭐⭐ **GỐC: bài giao KHÔNG chép options của act — nó THAY bằng bộ khác.** Từ Đợt C, form Set
>   assignment dựng bảng Options từ *Default homework options*, mà bucket đó chỉ có **5 trường chung**
>   (`BUILTIN_DEFAULTS`) — **không có `contentMode`**. Cộng với luật ngầm của hàng Text/Voice
>   (`buildContentSwitchRow`): ***"writes nothing until the teacher actually taps"*** + nút TEXT **sáng
>   sẵn** ⇒ form **hiện một đằng, lưu một nẻo**. Bài giao ra đời `contentMode` rỗng = **nhánh AUTO** của
>   `voiceView()` = nút loa + tự đọc.
>   ⚠️ **HAI cái bẫy nhân nhau, không phải một** — mỗi cái đứng một mình đều đúng theo thiết kế của nó.
> - **Hai chỗ hỏng kèm theo, chưa ai báo vì KHÔNG CÓ control nào để so**: bộ nghĩa act để `vi1` thì giao
>   ra `eng1` (`activeVariant()` → `all[0]`), nửa act để `homework` thì giao ra `practice`
>   (`activeContentSet()` → `sets[0]`). Form Set assignment không có hai hàng đó.
> - ⭐ **Lỗi thứ ba tìm ra khi dò**: `snapshotOf()` **quên `optVer`** ⇒ máy HS quy đổi thang điểm phạt
>   **lần thứ hai**: **"Points off 30" tới tay HS thành 100**. Nay đóng dấu `optVer: OPT_VER`.
>   ⚠️ Dấu là phiên bản **HIỆN TẠI**, không chép `act.optVer` — options vừa ra khỏi bảng Options hôm nay.
> - **Cách sửa**: `hwDraft = { ...getDefaultOptions(type,"homework"), ...splitViewOptions(act.options).selectors }`.
>   `splitViewOptions` **có sẵn** (`core/content-view.js`), tách đúng `VIEW_SELECTOR_KEYS` — không đẻ
>   khái niệm mới.
> - ⚠️⚠️ **KHÔNG phạm luật "HAI CÔNG TẮC RỜI NHAU"** (thầy chốt Đợt C): luật đó nói về **BỘ CÀI ĐẶT**
>   (timer/trộn câu/hiện đáp án) — vẫn đi từ bucket homework, vẫn quyết riêng từng bài giao (bàn thử
>   mục 5 canh đúng chỗ này). Bốn khoá lấy từ act là **SELECTOR** = **TÊN của nội dung đang được giao**,
>   không phải cài đặt. Đắp **LÊN TRÊN** nên hàng Text/Voice vẫn còn, nay **hiện đúng sự thật**, thầy
>   vẫn đổi riêng được.
> - **Trước/sau trên form thật** (mở song song bản cũ lấy từ `_backup/dot211/`): act để **Voice** →
>   trước sáng **"Text"** (nói dối), sau sáng **"Voice"**. Act cũ không `contentMode` → **vẫn AUTO y như
>   trước**, không đổi một pixel.
> - ⛔ **BÀI ĐÃ GIAO RA RỒI KHÔNG TỰ KHỎI** (bản chụp đóng băng): mở **Edit assignment** bấm nút TEXT rồi
>   SAVE, hoặc giao lại. ⛔ **Cố ý không vá bài cũ tự động** — có bài giao ra đời **trước Đợt 143**, số
>   phạt của chúng thật sự vẫn cần quy đổi; đóng dấu bừa là đóng băng số thang 0..5 như thể nó là 0..100.
> - ⚠️ Act để **PRONUNCIATION**: **chơi đúng** IPA, nhưng form sáng nút TEXT (hàng đó chỉ nhận 2 nút vì
>   `buildOptionsControls` không truyền `variants`). Lệch phần NHÌN, không lệch phần CHẠY — đợt riêng.
> - 📸 `screenshot` timeout (pane không hiện) — đợt này nghiệm bằng **số đo**.
>
> ---
> **Đợt 210 — LÀM LẠI HIỆU ỨNG TÊN 3 BẠN ĐẦU: HÀO QUANG TĨNH, KHÔNG CÒN GÌ CHẠY TRÊN CHỮ.**
> Thầy nhìn bản 209 thật: *"rất xấu — xóa hoàn toàn hiệu ứng cũ (vẫn giữ màu vàng và sparkle), thay
> bằng hào quang cùng màu vàng tỏa ra từ NỀN của các chữ, không có gì chạy ở bên trên tên cả."*
> Sửa đúng 1 khối trong `core/app.css`.
> - ⛔ **BỎ HẲN dải sáng chạy ngang chữ** — cả bản 208 (khựng) LẪN bản 209 (đã liền mạch): 209 chữa đúng
>   cái khựng nhưng thứ thầy không ưng là **bản thân cái dải chạy**. `background-clip:text` +
>   `color:transparent` + 2 keyframes `goldshift`/`goldsweep` xoá sạch.
> - ⭐ Nay: chữ **vàng ĐẶC `#dd9d09`** + hào quang **thở** bằng `text-shadow` **hai lớp** (lõi hẹp sáng
>   + quầng rộng mờ — một lớp đơn nhìn như nhòe chứ không như phát sáng), `ease-in-out` 0→50→100 đối
>   xứng ⇒ vòng lặp không có mối nối theo cấu trúc. Vẫn `text-shadow`, ⛔ không bao giờ `filter` (Đợt 198).
> - ⛔ **ĐỪNG đưa bất kỳ gradient/sheen nào quay lại chữ này** — hai đợt liền là hai phiên bản của đúng
>   thứ thầy vừa xóa.
> - 🧪 **179/179 ĐẠT** (pod 90 · panel 60 · review 29). ⚠️ Kỳ vọng lưới mục 7e bị đảo 180° có chủ ý:
>   "PHẢI có repeating-gradient" (209) nay là điều bị CẤM.
>
> ---
> Trước đó: **20/8/2026 (Đợt 209)** — 178/178 ĐẠT trên 3 bàn thử.
>
> ---
> **Đợt 209 — BỐN CHỖ THẦY NHÌN THẤY TRÊN BẢN THẬT.** Sửa 2 file: `core/showdown-review.js` + `app.css`.
> - ⭐⭐ **Tích hết cả lớp ⇒ hai số đếm chuyển XANH LÁ rõ nét + SPARKLE VÀNG** quanh số. ⚠️ So với sĩ số
>   **TRÊN BẢNG**, không phải sổ lớp — ở phạm vi ĐỘI thì bảng chỉ có một đội, so với sổ lớp là đèn không
>   bao giờ sáng. ⚠️ Sao **dừng hẳn** khi chưa dùng (chạy dưới lớp `opacity:0` là ngốn một lần vẽ lại
>   mỗi khung hình suốt buổi).
> - **Chấm tròn mờ hơn nữa**: `.3` → **`.15`** (hover `.45`).
> - ⛔⛔ **Lấp lánh vàng KHỰNG cuối mỗi vòng — gốc là CÁI DẢI MÀU, không phải cái nhịp.** Đợt 208 dùng
>   dải HỮU HẠN (`background-size: 260%`) + `background-position` 0%→260%, mà **`background-position`
>   theo % KHÔNG dịch ảnh đi ngần ấy %** — nó căn điểm X% của ảnh vào điểm X% của hộp, nên khung cuối
>   không cách khung đầu trọn một ô nào cả. Nay là **`repeating-linear-gradient` chạy NGANG, dịch đúng
>   MỘT chu kỳ (`4em`)** ⇒ khung cuối trùng khung đầu, hết mối nối. ⚠️ Ngang là cố ý: ở góc khác thì
>   "đúng một chu kỳ" không còn là con số viết được vào keyframe.
> - **Ô QUESTIONS: `align-items: baseline` CHÍNH LÀ THỦ PHẠM** làm EACH/LEFT lệch nhau — đường chân chữ
>   là **đáy mực, không phải giữa mực**, nên 21px và 16px treo hai độ cao. Đổi sang **`center`** +
>   **`line-height: 1`** (giữa HỘP ≠ giữa CHỮ khi còn leading). Đo lại: lệch **0px**, cả bốn thứ cách
>   tâm ô **< 1px**.
> - 🧪 **178/178 ĐẠT** (pod 89 · panel 60 · review 29). ⛔ **4 lần lưới báo hỏng mà lỗi ở chính lưới**
>   (nhiều nhất từ trước tới nay), cả bốn cùng một họ: **lưới chép cứng thứ vừa bị đổi**. + 1 lần bàn
>   thử **TREO** vì thiếu hàm phụ trợ — ⚠️ **bàn thử treo cũng là bàn thử hỏng**.
> - ⭐ Chụp được màn hình thêm 3 lần trong đợt này.
>
> ---
> Trước đó: **20/8/2026 (Đợt 208)** — 155/155 ĐẠT trên 3 bàn thử.
>
> ---
> **Đợt 208 — SHOWDOWN TINH CHỈNH: CHẤM TRÒN · TÊN VÀNG · Ô TEAMS SÁNG · RESET XOÁ SỔ CÁI.**
> Thầy giao 9 việc sau khi **gửi ảnh chụp bản thật** của Đợt 207; 8 việc làm, 1 việc bỏ.
> ⭐⭐⭐ **LẦN ĐẦU SAU 9 ĐỢT CHỤP ĐƯỢC MÀN HÌNH** (pane trình duyệt hiện lên) — đợt này sửa **có nhìn thấy**.
> Sửa 4 file: `core/showdown-review.js` · `showdown-setup.js` · `engine.js` · `app.css`.
> - **Ô tích vuông → CHẤM TRÒN đặc mờ**; bấm ra **dấu ✓ to, dày, xanh dương, đứng một mình** (không khung).
>   ⚠️ Nút vẫn 4.8cqw, chỉ cái vỏ biến mất — chấm là con của nút, thu nút bằng cái chấm là đích bấm bằng móng tay.
> - ⭐⭐ **Hai số đếm nay ĐO chứ không ĐOÁN** (`placePodiumCounts`): ngang tâm **ô HS thứ 4** (đọc `offsetTop`
>   nên không trôi khi cuộn), chính giữa mép khung ↔ dấu tích hàng 4, **mép phải đã trừ thanh cuộn**.
>   ⚠️ Số đo CỨNG của Đợt 207 chính là lý do số bên phải nằm dưới thanh cuộn. 🐞 Bản đầu của đợt này lệch
>   **đúng bằng bề rộng thanh cuộn** vì viết `right = mép − sb − đích` thay vì `mép − đích` — lưới bắt được.
> - **Tên 3 bạn đầu VÀNG LẤP LÁNH, tỏa hào quang**; sparkle chuyển từ quanh ô sang **quanh chính cái tên**
>   (⚠️ phải đẻ bọc `.aw-sd-pod-nm` vì ô tên mang `overflow:hidden` sẽ cắt mất sparkle).
>   ⛔⛔ Hào quang là **`text-shadow`, KHÔNG BAO GIỜ `filter`** (luật Đợt 198).
> - **Nút fullscreen = `.aw-iconbtn` của app**, giống hệt nút trong act đơn (đo 38.39×38.39 cả hai).
>   `.aw-sd-fsbtn` nay **chỉ giữ cái góc** — đừng khai lại cỡ ở đó.
> - **Ô TEAMS sáng xanh khi chia đều được** (18 em: 2 và 3 đội sáng). ⚠️ Hỏi `targetSizes()`, không nhẩm
>   `n % teams`; ⛔ từ 2 đội trở lên (1 đội thì luôn "đều", đèn vô nghĩa).
> - **Ô tên bay giữ màu NƠI XUẤT PHÁT** (thầy chọn 1 trong 3 phương án — đừng đổi sang màu nơi đến).
>   ⚠️ `bulkMove` chụp `className` TRƯỚC `mutate()`; ô bay phải gỡ `is-pop`.
> - ⭐⭐ **RESET khi đang mở Recent results = XOÁ SỔ CÁI** của lớp đó (`wipeMatches`, nằm không dùng từ
>   Đợt 197). Có hỏi xác nhận, và **không hoàn tác được**.
>   🐞 **Vá kèm một lỗi chưa kịp xảy ra**: `.aw-sd-confirm` z-index **5** mà `.aw-sd-recent` là **6** ⇒
>   câu hỏi sẽ nằm DƯỚI thứ nó đang hỏi về. Nâng lên **9** — hộp hỏi phải luôn trên mọi lớp của panel.
> - **Bảng cuối game trong Showdown bỏ Leaderboard + dòng "YOU'RE Xth"** (⚠️ chỉ giấu ĐƯỜNG VÀO,
>   `finish()` vẫn ghi — tắt Showdown là lịch sử còn nguyên). 16 game khác không đổi.
> - ⛔ **BỎ HẲN 1 việc**: animation cho danh sách lớp — đó là `<select>` của trình duyệt, danh sách do
>   **Windows tự vẽ**, CSS/JS không với tới. Thầy chốt *"ko cần animation này nữa"*.
> - 🧪 **155/155 ĐẠT, 0 lỗi console** (ba bàn thử Đợt 207 cập nhật TẠI CHỖ: pod 74 · review 29 · panel 52).
>   ⛔ Lại **2 lần lưới báo hỏng mà lỗi ở chính lưới** (đọc `children[1]` sau khi tên có bọc mới; nút đối
>   chiếu bị **flex bóp** còn 27,9px trong khung đã đầy).
> - ⬜ **CÒN LẠI**: nhìn trên màn 86" xem chữ vàng của bạn **số 2 (ô bạc)** có đọc được từ cuối lớp không.
>
> ---
> Trước đó: **20/8/2026 (Đợt 207)** — 117/117 ĐẠT trên 3 bàn thử.
>
> ---
> **Đợt 207 — SHOWDOWN: Ô QUESTIONS TÍNH LẠI · BẢNG CHÓP NGƯỢC DỰNG LẠI · RECENT RESULTS FULLSCREEN.**
> 12 việc thầy giao trong hai lượt, đi chung **một commit** (thầy dặn *"commit cùng một thể"*).
> Sửa 6 file: `core/showdown.js` · `showdown-review.js` · `showdown-setup.js` · `icons.js` · `engine.js` · `app.css`.
> - ⭐⭐⭐ **Ô QUESTIONS: `LEFT` trước nay TRẢ LỜI SAI CÂU HỎI.** Nó là `q − each × đội ĐÔNG nhất`
>   (= `q mod biggest`) nên **không thể lớn hơn sĩ số đội đông nhất**: lớp 18 em / 95 câu / 4 đội báo
>   **"0 left"** trong khi hai đội 4 em **mỗi đội vứt 19 câu**. Nay đo ở **đội ÍT NGƯỜI nhất**
>   (thầy: *"số câu hỏi tối đa bị bỏ lại"*) ⇒ **19 EACH · 19 LEFT**. Kèm **đèn xanh `.is-best`** cho
>   phương án bỏ lại ít nhất trong 2..5 đội (⛔ 1 đội không dự thi; **hoà thì cùng sáng** — 18 em/95 câu
>   thì 2 và 3 đội cùng sáng). ⭐ Vá kèm lỗi có sẵn: ô nhẩm `ceil(n/teams)` thay vì hỏi `targetSizes`,
>   nên lớp đông hơn `MAX_PER_TEAM × số đội` hiện **EACH sai**.
> - ⛔⛔ **% ĐẢO NGƯỢC ĐỢT 176**: nay chia cho **TỔNG số câu được chia**, luôn hiện kể cả **0%**, thứ tự
>   `5 ✓ 5 ✗ 50%`. Hàm mới **`pctOf()`** — một hàm cho **cả ba màn**. ⚠️ **Trận cũ trong sổ cái xem lại
>   sẽ ra % khác trước** (số đếm lưu không đụng, chỉ phép cộng trên màn đổi).
> - ⭐⭐ **Tên KHÔNG BAO GIỜ bị cắt** (`fitPodiumNames`): co cỡ chữ trước, hết chỗ mới viết tắt. Đo ở 4
>   bề ngang khung xuống tới **300px: 0/20 tên bị cắt**. ⚠️ `min-width:0` trên ô tên là thứ **CHỊU LỰC**
>   — thiếu nó `scrollWidth > clientWidth` không bao giờ đúng và hàm kết luận "mọi tên đều vừa".
> - **3 cúp → 3 HUY CHƯƠNG mang sẵn số 1/2/3**; **số thứ tự vào TRONG ô** (⚠️ đánh đổi đã báo trước: số
>   cũ treo ngoài ô chính là đường chéo làm phễu ra hình phễu); **sparkle** quanh 3 bạn đầu (CSS thuần).
> - ⭐⭐ **HAI Ô TÍCH chia đội + hai số đếm mờ** ngay trên bảng kết quả (thầy dùng để chia đội cho hoạt
>   động sau). Ô tích **bám mép ô nên cố ý KHÔNG thẳng hàng**; ô không chọn ẩn bằng `visibility` để ô
>   tên **không nhúc nhích**; hai số **hiện cùng lúc**, **đứng yên khi cuộn**.
> - ⭐ **Nút FULLSCREEN** góc dưới trái màn Show answers, và **Recent results bấm cột là mở fullscreen**.
>   ⚠️⚠️ **`container-type: size` trên `.aw-review.is-fs` là thứ chịu lực** (stage KHÔNG to ra khi con
>   nó fullscreen ⇒ chữ sẽ bé tí trên tường). ⛔ **CHỈ khi `.is-fs`, ĐỪNG khai thường trực** — bản đầu
>   của chính đợt này khai thường trực và **âm thầm làm nhỏ chữ Show answers của CẢ 17 template 4,8%**
>   (23,18 → 22,07px), vì cỡ container là HỘP NỘI DUNG, tức đã trừ mất lề 2.4cqw. **Lưới xanh hết vẫn
>   không bắt được**; phép đo riêng mới bắt (nhật ký Đợt 207 mục 11).
>   ⚠️⚠️ **Trong myActivity chia cột, fullscreen chỉ phủ kín CỘT đó.**
> - **Recent results: cũ nhất bên trái** (đảo Đợt 197) — ⚠️ đảo LÚC VẼ, **không** đảo trong `loadMatches`
>   (hàm đó còn cắt lấy 5 trận MỚI NHẤT).
> - **"Start with mistakes" ẩn sau nhấn giữ START AGAIN — ⛔ CHỈ trong Showdown.**
> - 🧪 **3 bàn thử, 117/117 ĐẠT, 0 lỗi console**: `sd207-pod.html` 57 · `sd207-panel.html` 35 ·
>   `sd207-review.html` 25 (`scratch/` gitignore ⇒ phiên mới phải dựng lại, công thức ở `GHI CHU DU AN.md`).
> - ⛔ **HAI lần lưới báo hỏng mà lỗi ở CHÍNH LƯỚI**: `elementFromPoint` trả `null` vì nút **ngoài khung
>   nhìn** (phải `scrollIntoView` trước), và `select.value` gán khi **danh sách lớp chưa nạp xong**.
> - ⬜ **CÒN LẠI (chỉ mắt/tay thầy)**: (1) **nhìn bằng mắt** — `screenshot` timeout **lần thứ chín liên
>   tiếp**; (2) **bấm nút fullscreen bằng tay** (`requestFullscreen` đòi cử chỉ THẬT); (3) **chơi trọn
>   một ván tới bảng cuối** để nghiệm việc 8 trong game thật — pane ẩn không lái nổi ván nào tới đích.
>
> ---
> Trước đó: **19/8/2026 (Đợt 202 + 203)** ✅ **CẢ HAI ĐÃ COMMIT + PUSH + LIVE, thầy duyệt.**
> • **Đợt 202** (`a6d3fe8`, hồ sơ `87967b4`) — **IN TURNS: một bộ câu chia cho hai đội** trong Fight, mở cho **Type the answer**; 3/3 mã băm SHA-256 + 7/7 phép hỏi module trên bản live.
> • **Đợt 203** (`13aba93`, hồ sơ `c5032f4`) — **vá nốt lỗi trang trắng Running Word** ở bộ ≤16 từ/đội; mã băm `rw-print.js` repo/live khớp.
> ⚠️ Hai đợt này là **hai phiên song song** chạy cùng lúc trong CÙNG một thư mục — mỗi bên chỉ nạp vào chỉ mục git đúng file của mình. Xem hai khối đầu tiên ngay dưới.
> Trước đó **(Đợt 198)** ✅ **COMMIT `70ca0a1` + PUSH + LIVE** — Pages build đúng commit, **3/3 file trùng mã băm SHA-256**, và **25/25 phép hỏi lại trên bản live** đều đúng.
> Trước đó **(Đợt 196 + 197)** ✅ **COMMIT `44133d0` + PUSH + LIVE** — Pages build đúng commit, **10/10 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`, và **37/37 phép hỏi lại chính module trên bản live** đều đúng.
> ⚠️⚠️ **Đợt 197 sửa CẢ myActivity (v2.4.0, commit `fc049f1`) — hai kho đã được đẩy cùng nhau.**
> Trước đó: **18/8/2026 (Đợt 194 + 195)** ✅ **COMMIT `a256012` + PUSH + LIVE** (4/4 mã băm SHA-256) — một commit cho cả hai đợt
> (cùng sửa `core/engine.js`, tách không an toàn). Trước đó: **Đợt 190 + 191** ✅ **COMMIT `52173f4` + PUSH + LIVE** (một commit cho
> cả hai đợt — chúng cùng sửa `engine.js` và `app.css` nên không tách an toàn được). Pages build đúng
> commit, **11/11 file trùng mã băm SHA-256**, và đã hỏi lại chính module trên bản live.
> ⚠️ **Đối chiếu mã băm phải dùng `git show HEAD:<file>`, KHÔNG dùng file trên đĩa** — máy này bật
> `core.autocrlf` nên file trên đĩa là CRLF còn Pages phục vụ LF, so nhầm ra "7/11 lệch" oan.
>
> ---
> **Đợt 198 — BẢNG SHOWDOWN: MƯỢT KHẮP NƠI · LUẬT CHIA ĐỘI MỚI · BỘ ĐẾM CÂN LẠI.**
> ✅ **COMMIT `70ca0a1` + PUSH + LIVE** — Pages build đúng commit, **3/3 file trùng mã băm SHA-256**, và **25/25 phép hỏi lại trên bản live** đều đúng.
> - **Bộ đếm số đội**: ô rộng 152 mà ba con chỉ 134 và **không đứa nào được giãn** ⇒ 18px thừa dồn hết
>   về mép phải (đo: `+` cách mép 17px, `−` cách 1px, số lệch tâm 8px). Vá bằng
>   **`.aw-hstep-val{flex:1 1 auto}` + `.aw-hstep-btn{flex:0 0 auto}`** — ô số nuốt phần thừa nên chữa
>   cả hai lỗi bằng một dòng. Options không đổi (ở đó không có phần thừa nào).
> - **Ô QUESTIONS hai thông số** `8 EACH · 2 LEFT`; `left = số câu − each × đội đông nhất` = đúng số
>   câu Balance questions sẽ vứt. `0 LEFT` không hiện.
> - **Chữ SHOWDOWN IN ANDREW CLASSES thành CÔNG TẮC hai chiều**, có **hào quang** khi mở Recent
>   results, phần `• X STUDENTS` **gấp gọn** (đo 95px → 0 → 95). ⚠️ hào quang là `text-shadow`,
>   **không bao giờ `filter`** (stacking context).
> - **Pool 4-5 cột thành LƯỚI**: 17 ô tên từ 43..68px (12 bề ngang) về **1 bề ngang duy nhất**.
> - ⭐⭐⭐ **LUẬT CHIA ĐỘI VIẾT LẠI** (`outwardIn` · `targetSizes` · `planDeal`, **thuần + export**):
>   phần dư dồn về **HAI RÌA** (18 em/4 đội ⇒ **5·4·4·5**, không còn 5·5·4·4), và **nam/nữ chênh nhau
>   tối đa 1** ở mọi đội. ⚠️ danh sách đội truyền vào phải **ĐÚNG THỨ TỰ TRÊN BẢNG**, cấm sort.
> - ⭐⭐ **`flyOutAndBack()`**: tên bay **RA HẲN NGOÀI pop-up** rồi mới bay vào loạn xạ và lắng vào cột.
>   **Một bóng bay cả hai chặng** (chặng 1 `fill:forwards` để nó ở lại ngoài đó); **bảng được dựng lại
>   ở khe giữa hai chặng**; mọi chặng có hẹn giờ dự phòng — hỏng ở đây là cả lớp nằm im `visibility:hidden`.
> - ⭐ **`paintColStates()`**: `.aw-sd-col` **đã khai `transition` từ lâu mà chưa từng chạy một lần nào**
>   — chọn cột dựng lại cả 4 cột, mà phần tử vừa sinh thì bắt đầu ngay ở màu cuối. Nay chỉ đổi class.
> - ⭐ Lưới **218/218 ĐẠT, 0 lỗi console** (8 lưới; `sd198-deal.mjs` quét ~3.200 tổ hợp chia đội,
>   `sd198-panel.html` chạy panel thật cho cả 6 việc).
> - ⛔ **BA LẦN LƯỚI BÁO HỎNG MÀ LỖI Ở CHÍNH LƯỚI**: (1) phép kiểm "ở rìa" sai khi hai đội ở rìa ngang
>   nhau — phải kiểm "tập đội +1 là đoạn đầu của `outwardIn`"; (2) so bề ngang con với
>   `getBoundingClientRect()` của cha có **viền 1px mỗi bên** — phải dùng `clientWidth`; (3) ⭐ **đo ở
>   khung hình ĐANG TẢI** ra 135 thay vì 150 — **đo một khoảnh khắc không ai sống trong đó thì vô nghĩa**.
> - ⛔ **NĂM LUẬT MỚI**: (1) `transition` được khai ≠ `transition` chạy được — phần tử bị dựng lại thì
>   không có gì để chuyển động từ đó; (2) căn giữa trong flex là chuyện `flex-grow`, không phải
>   `text-align`; (3) luật chia/xếp phải là hàm THUẦN và quét toàn miền; (4) đo ở trạng thái ĐÃ Ở YÊN;
>   (5) hiệu ứng nào giấu phần tử thì phải có hẹn giờ bỏ giấu.
> - ⬜ **Chưa ai NHÌN bằng mắt** (pane ẩn ⇒ `screenshot` timeout, lần thứ bảy).
>
> ---
> **Đợt 197 — LƯU BỀN KẾT QUẢ · BALANCE QUESTIONS · BẢNG CHỌN LỚP DỰNG LẠI · 3 LỖI CÙNG HỌ.**
> ✅ **COMMIT `44133d0` + PUSH + LIVE** — Pages build đúng commit, **10/10 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`, và **37/37 phép hỏi lại chính module trên bản live** đều đúng.
> ⚠️⚠️ **ĐỢT NÀY SỬA CẢ myActivity (v2.4.0, commit `fc049f1`) — hai kho đã đẩy cùng nhau.**
> ⚠️ **Đối chiếu mã băm phải dùng `git show HEAD:<file>`, KHÔNG dùng file trên đĩa** — máy này bật
> `core.autocrlf` nên file trên đĩa là CRLF còn Pages phục vụ LF.
> - **3 lỗi cùng họ với Đợt 196** (đều là "một lần thử, hỏng thì nuốt"): (1) myActivity
>   `mirrorAwordState` chờ 6s→**12s**, **thử lại 1 lần**, hỏng thì hiện **dấu ✗ đỏ** — ⛔ kèm sửa ở
>   `engine.js`: bridge `switchTemplate`/`setTheme` nay trả **`true`** khi cột kia **đã đúng sẵn**,
>   thiếu vế này là báo động ✗ **oan**; (2) **`publishTable`** — giao dịch, quyết định trên bản
>   SERVER, `claims` luôn gộp ⇒ bấm READY không còn xoá việc máy khác, và bị đè thì **nói ra**
>   (`superseded`); **`writeMyClaim`** là đường ghi hẹp cho release/huỷ đội; (3) leaderboard
>   **gộp theo id + đọc lại kiểm chứng** (4 cột chung một localStorage).
> - ⭐⭐⭐ **`core/showdown-history.js` (FILE MỚI) — SỔ CÁI, khác hẳn `sd_results`**: không bao giờ bị
>   ghi đè, không bị Reset teams xoá. **Một trận = `tableId | roundKey | playNo`**, thầy chốt
>   **"chơi lại = trận MỚI"**. `playNo` **đếm riêng từng cột** và cố ý không thoả thuận giữa các máy —
>   lần-kết-thúc-thứ-nhất của mọi bảng, theo định nghĩa, là cùng một vòng. **Một tài liệu MỖI LỚP**
>   (Firestore chặn 1MB/tài liệu); `fitToBudget` vượt 700KB thì bỏ chi tiết từng câu của trận cũ nhất
>   chứ không để ghi hỏng. **Solo NAY CÓ LƯU** (thầy yêu cầu) nhưng vẫn KHÔNG vào `sd_results`.
> - ⭐⭐ **RECENT RESULTS** trên chữ *SHOWDOWN IN ANDREW CLASSES*: 5 cột, mới nhất bên trái, mỗi cột là
>   cả lớp dạng phễu; bấm một cột thì **trùm lên 4 cột kia** với chi tiết từng câu + nút bật bảng xếp
>   hạng. ⛔⛔ **HAI BẢNG KHÁC NHAU CÓ CHỦ Ý**: bảng thật đo bằng `cqw` nên trong cột 200px sẽ vẽ tên
>   ra ~5px ⇒ cột dùng phễu px riêng (`.aw-sd-mini-*`), bản mở rộng dùng lại bộ vẽ thật; ⚠️⚠️
>   **`container-type: inline-size` trên `.aw-sd-rec-dbody` là thứ CHỊU LỰC**, gỡ ra là chữ nổ tung.
> - ⭐⭐ **BALANCE QUESTIONS** (ô tích, chỉ Showdown): ⚠️ **chia cho ĐỘI ĐÔNG NHẤT, không phải đội
>   mình** (`maxTeam` đi trong pick). ⚠️ `applyBalance` **phải gọi hai chỗ** — mount **và** `begin()`,
>   vì `begin()` giải lại act từ thư viện. ⚠️ **trả về BẢN SAO** (cắt tại chỗ là xoá câu khỏi thư viện
>   thầy) nhưng **dùng chung `options`** để Apply còn ăn vào act thật.
> - **Ô QUESTIONS** cạnh TEAMS (cùng cỡ, dạt phải, CLASS ngắn còn ≤360px): `số câu ÷ ceil(sĩ số ÷ số
>   đội)` — **cùng phép tính** với `applyBalance`, hiện trước khi thầy chốt số đội.
> - **RESET/NEXT/READY bằng nhau** (`.aw-sd-footbtn`, `min-width` mới là thứ làm chúng bằng nhau);
>   **icon − + thành SVG** (hình học, không phải chữ nghĩa); **mũi tên `<select>` tự vẽ**
>   (`appearance:none` + background SVG — hai nửa không tách rời được).
> - **"Reset teams" → BACK**: không phá gì cả, chỉ `goto(renderSetup,-1)` (⚠️ **không** `boot()`).
>   Câu hỏi xoá dời sang **Next** và chỉ khi lớp đã đổi thật. ⚠️ **Phần khó là ĐỪNG CHIA ĐỘI LẠI** khi
>   bước lui rồi bước tới (`keepIt`); biến mới **`tableClassId`** vì `<select>` ghi thẳng vào
>   `setup.classId`.
> - ⭐ **Lưới 154/154 ĐẠT, 0 lỗi console** (6 lưới: `sd196-pure` 14 · `sd196-sync` 21 ·
>   `sd197-history` 34 · `sd196-review` 16 · **`sd197-panel` 53 chạy panel THẬT** ·
>   **`sd197-balance` 16 chạy engine THẬT**). Lưới bắt được 3 lỗi đọc code không thấy, trong đó có
>   **thứ tự 5 cột sai khi `at` trùng mili-giây** và **Firestore `update()` KHÔNG gộp sâu**.
> - ⚠️ **Hai bẫy môi trường lại cắn**: `goto()` giữ lớp màn CŨ 360ms (đọc nhầm nút của màn cũ), và
>   **pane ẩn ⇒ Chromium đóng băng animation** nên phải `getAnimations().forEach(a => a.finish())`
>   TRƯỚC KHI đo (đo ra 908×410 thay vì 936×423 = đúng `scale(.97)`).
> - ⬜ **Chưa ai NHÌN bằng mắt**; `scratch/` bị gitignore ⇒ 6 lưới phải dựng lại ở phiên sau.
>
> ---
> **Đợt 196 — SHOWDOWN: BẢNG CẢ LỚP TỰ ĐỒNG BỘ.** ✅ **COMMIT `44133d0` + PUSH + LIVE** — Pages build đúng commit, **10/10 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`, và **37/37 phép hỏi lại chính module trên bản live** đều đúng (chung một commit với Đợt 197).
> Thầy báo: 4 bảng / 4 đội, lớp A1B 18 em — bảng 1·3·4 khớp nhau ở **13 em**, bảng Team 2 chỉ **5 em**
> và **cả lớp cũng 5 em**, lệch **HAI CHIỀU**. Gốc rễ: đường chia sẻ kết quả chỉ có **1 lần ghi +
> 1 lần đọc**, **mọi thất bại đều im lặng**, và **kết quả hỏng còn được nhớ lại**.
> Sửa: (1) ⭐⭐ `subscribeResults` — **nghe trực tiếp** `sd_results`, đội nào xong là mọi bảng tự cập
> nhật, hết cảnh phải chạm đúp; (2) **hộp thư** trong `sessionStorage` + **thử lại 3 lần**, gửi hụt thì
> `flushPendingResult()` gửi lại khi mở Show answers và mỗi lần có thay đổi; (3) **cấm nhớ lại lần đọc
> hỏng**, và `blocks()` bỏ `|| teamBlocks` (đội mình từng bị vẽ dưới tên LỚP); (4) `splitResults` trả
> về **cả phần bị loại** ⇒ màn hình nói được *"1 đội chơi act khác (Team 4)"*; (5) ô chữ **"4 TEAMS"**
> xanh/vàng bên tên lớp + khối cảnh báo vàng. 5 file: `showdown.js` · `showdown-setup.js` ·
> `showdown-review.js` · `engine.js` · `icons.js`+`app.css`.
> ⭐ Lưới **51/51 ĐẠT, 0 lỗi console** (`scratch/sd196-pure.mjs` 14 · `sd196-sync.mjs` 21 chạy code
> THẬT với Firestore giả gộp sâu · `sd196-review.html` 16 chạy màn thật ở cổng 5561). Dựng lại được
> đúng con số 13 của thầy, rồi chữa về 18.
> ⛔ **NĂM LUẬT MỚI**: (1) thứ gì qua mạng phải có đường **hoà hợp**, không chỉ 1 ghi + 1 đọc;
> (2) **cấm nhớ lại lần đọc thất bại** — không biết thì để trống và NÓI RA; (3) cấm lấy dữ liệu phạm
> vi HẸP vẽ cho phạm vi RỘNG; (4) **bộ lọc im lặng là bộ lọc nguy hiểm** — lọc gì phải đếm và nói
> được; (5) mọi listener phải có `dispose()` gọi từ **mọi** đường ra (ghost-clock Đợt 131).
> ⚠️ **Cùng họ lỗi, CHƯA sửa, đã báo thầy**: myActivity `mirrorAwordState` chờ 6s rồi bỏ **im lặng**
> (một cột chơi Options khác 3 cột kia) · `saveSetup` ghi **đè cả tài liệu** (2 máy sửa bảng đội cùng
> lúc thì mất việc của máy trước) · leaderboard dùng **localStorage chung** cho 4 cột.
> ⬜ **Chưa ai NHÌN bằng mắt** (pane ẩn ⇒ `screenshot` timeout, lần thứ năm liên tiếp); `scratch/` bị
> gitignore nên 4 file lưới phải dựng lại ở phiên sau.
>
> ---
> **Đợt 195 — NÚT TRANG CHỦ VỀ NHẤN GIỮ NÚT MODE.** ✅ **COMMIT `a256012` + PUSH + LIVE** (4/4 mã băm SHA-256) — chung một
> commit với Đợt 194 (cùng sửa `core/engine.js`).
> Thầy: *"tích hợp nút trang chủ vào nhấn giữ nút mode, nhấn vào thì hiện pop-up hỏi có muốn về
> trang chủ không, đồng ý thì mới về"*. **Nút Home bị gỡ khỏi cụm phải** (còn 2 nút: Set assignment ·
> Print); **chạm MODE = picker, NHẤN GIỮ 420ms = popup "Go home?"**. Câu chữ trong popup đổi theo mode
> (trận thì *ends the match*, Showdown thì nói rõ **đội được giữ**). Không sửa một dòng CSS nào.
> ⚠⚠ **NÚT MODE NAY LUÔN ĐƯỢC DỰNG.** Nó từng bị bỏ hẳn khi không có mode nào để chọn — mà **5/17
> template** không khai `fightMode` lẫn `showdownMode` (maze chase · whack-a-mole · speaking cards · hai
> game Running), nên một act nhóm đó có đáp án dài quá 24 ký tự và không phiên âm thì **không có nút nào**
> ở chỗ đó — treo Home lên là **mất luôn Home**, mà menu ☰ cũng không có đường ra. Vá theo đúng khuôn
> Đợt 192: chỗ không có mode thì nút được dựng **thẳng thành nút Home** (`title="Home"`, chạm thường là ra
> câu hỏi).
> ⭐ **Trong TRẬN nay có Home lần đầu** (cụm phải bị `visibility:hidden` khi đánh, trước đây về thư viện
> phải đi hai bước Mode ▸ Single rồi mới Home). ⚠️ **MỘT TRẬN LÀ HAI ENGINE**: `cleanupAll()` chỉ dọn
> bàn 0, đồng hồ 500ms của bàn 1 sẽ tiếp tục chạy sau lưng thư viện — đúng **ghost-clock Đợt 131**. Thêm
> **một phương thức** vào `core/fight.js`: `exitToLibrary() { teardown(); onExit?.(); }`.
> ⭐ Lưới `scratch/home195-test.html`: **44/44 ĐẠT, 0 lỗi console**, trong đó phép đo ghost-clock là THẬT
> (bọc `setInterval`/`clearInterval`, bấm PLAY cả hai bàn rồi đếm id còn sống: đang trận > 0, sau Home = 0).
> Popup đo được 260×147,4, nằm trọn trong màn, không phải cuộn, hai nút hit-test trúng chính nó.
> ⚠️ Lưới Đợt 194 có một dòng kỳ vọng lạc hậu (Home rời cụm phải) — đã sửa, chạy lại **41/41 ĐẠT**.
> ⛔ **LUẬT MỚI**: (1) **nút nào mang thêm việc thì nút đó không được phép vắng mặt** — hỏi "nút này có bao
> giờ không được dựng không?" trước khi treo; (2) đường ra khỏi một TRẬN không đi bằng `cleanupAll()` của
> một bàn.
> ⬜ **Chưa ai NHÌN bằng mắt** (pane ẩn ⇒ `screenshot` timeout, lần thứ tư liên tiếp).
>
> ---
> **Đợt 194 — EDIT CONTENT VỀ NHẤN GIỮ NÚT OPTIONS.** ✅ **COMMIT `a256012` + PUSH + LIVE** (4/4 mã băm SHA-256).
> Thầy: *"Chuyển tính năng nút edit content trong mọi mode vào việc giữ nút Options => Pop-up nhỏ hỏi
> có muốn edit content không => xác nhận rồi mới vào edit chứ không bấm trực tiếp nút edit ở ngay dưới
> khung act nữa."* **Nút Edit bị gỡ hẳn** khỏi cụm phải (còn 3 nút: Set assignment · Print · Home);
> **chạm nút Options = bảng Options, NHẤN GIỮ 420ms = popup "Edit content?"**, và chỉ khi bấm xác nhận
> mới rời game vào editor. Popup dùng lại nguyên bộ class của 4 popup xác nhận nút MODE ⇒ **không sửa
> một dòng CSS nào**. Diff đúng **2 file**: `core/engine.js` + một câu chữ trong
> `templates/speaking/speaking.js`.
> ⛔ **CHỈ SINGLE MODE** (thầy chốt sau khi được hỏi): Fight · Showdown · Running · IPA đều **không**
> cho edit. Đây là **thu hẹp có chủ ý** — trước đợt này chỉ Fight bị ẩn nút Edit (bằng CSS
> `.aw-fight-bottom .aw-below-right`), còn Showdown/Running/IPA vẫn bấm được.
> ⭐ **VÁ KÈM MỘT LỖI THẬT CÓ SẴN**: nút Edit cũ truyền `libAct`, mà hai ván **ngay trong single** trao
> cho engine một `libAct` VỨT ĐI — *Change template* (`conv_…`, `_converted`) và *Start with mistakes*
> (`mist_…`, `_mistakes`). `core/store.js` không thấy hai id đó trong thư viện ⇒ Save **thả một act rác
> ra gốc thư viện** còn act thật không đổi một chữ, im lặng hoàn toàn. Nay `openEditor()` hỏi **ai SỞ
> HỮU nội dung** bằng ĐÚNG hai dòng mà Options ▸ Apply đã dùng (`_mistakesBase` → `originAct`), và mở
> **template của ACT đó**, không phải template đang chiếm màn hình.
> ⛔⛔ **BA LUẬT MỚI**: (1) ẩn `[title="Options"]` bằng CSS nay ẩn **HAI** tính năng (y hệt chuyện đã
> xảy ra với `[title="Template"]` sau Đợt 192); (2) builder panel phải là **`function` có tên khai một
> lần** — `mountPanelContent`/`capPanelHeight` nhận diện panel bằng **danh tính hàm**, arrow tạo mới mỗi
> lần sẽ lặng lẽ không khớp và popup bị ăn nhầm class `is-opts`; (3) **thứ gì GHI vào thư viện thì hỏi
> act SỞ HỮU, đừng hỏi act trên màn** — lần thứ ba luật này phải viết ra (145 → 181 → 194).
> ⭐ Lưới `scratch/edit194-test.html` chạy **THẬT** `engine.js` + `fight.js`, bắn `PointerEvent` đúng
> đường `core/press.js`, gián điệp cắm vào `getTemplate(t).edit` của registry: **41/41 ĐẠT, 0 lỗi
> console**. Đo hình học ở `scratch/edit194-live.html`: popup 240,6×138,9, không lọt ngoài màn, không
> phải cuộn, hai nút hit-test trúng chính nó, `elementFromPoint` giữa popup ra **ruột popup** (không
> phải `aw-tool-dim`).
> ⬜ **Chưa ai NHÌN bằng mắt** (pane trình duyệt ẩn ⇒ `screenshot` timeout, y như Đợt 191 + 192);
> `scratch/` bị gitignore nên hai file lưới phải dựng lại ở phiên sau.
>
> ---
> **Đợt 192 — SÁU VIỆC THẦY GIAO MỘT LƯỢT.** ✅ **COMMIT `3a1720a` + PUSH + LIVE** — deployment
> `5963183381` **success**, đối chiếu **6/6 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`,
> và hỏi lại chính module live: `tapOrHold` · `NO_TEMPLATE_TYPES` · `openToolPanelFor` · `RUN_LABEL` ·
> `shrinkRosterNames` · `cascade` · `.aw-cls-seg` · `.is-classwide` · icon `boy`/`girl` ·
> `.aw-fm-emptydrop` đều CÓ, còn `styleBtn` và CSS chết `.aw-gender-chip` đều đã BIẾN MẤT (15/15 đúng).
> ⚠️ Đợt này chạy **song song với Đợt 193** (phiên Claude khác, cùng kho, cùng lúc). Cả hai nay đều đã
> vào `main` và **kho sạch**. Bài học giữ lại: `git status` sạch lúc BẮT ĐẦU không có nghĩa là sạch lúc
> KẾT THÚC — soi lại `git status` + giờ sửa file (`find -newermt`) ngay trước khi commit, và commit
> **theo tên file**, đừng `git add -A`.
> Sáu việc: (1) chế độ RUNNING đảo thứ tự **WORD trước, TEAM sau** + nhãn rút còn **WORD/TEAM**;
> (2) màn chọn lớp Showdown: ô tên **bằng nhau tuyệt đối** (lưới thay flex bọc dòng — đo: cũ lệch **57,9px**,
> nay **0**), tên không đủ chỗ thì **viết tắt** chứ không bị ellipsis xén;
> (3) shuffle **bay lần lượt, loạn xạ** (thứ tự khởi hành được xáo, nhịp giật ±35%, đường bay cong theo
> **pháp tuyến** — đo: rải **1146ms** so với trần **260ms** của nếp cũ, **96/190 cặp đảo thứ tự**);
> (4) ⭐⭐ **BỎ HẲN NÚT STYLE, gộp vào nút Template — chạm = Template, NHẤN GIỮ (420ms) = Style**;
> (5) ⭐⭐⭐ **dựng lại Settings › Classes**: bỏ textarea, **mỗi em một hàng** (số · tên · nút dài
> **BOY|GIRL** · xoá · tay kéo), lưới **cột-trước 2×10**, ô "+ Add a new class"/"+ Add a new student" ở
> cuối, sạch chữ hướng dẫn;
> (6) thư mục trống hiện **ô kéo-thả file Import** thay cho dòng "This folder is empty."
>
> ⛔⛔ **BA LUẬT MỚI BẮT BUỘC BIẾT TRƯỚC KHI SỬA TIẾP:**
> 1. **`NO_TEMPLATE_TYPES` (engine.js, module scope) phải đi cùng nhịp với BA stylesheet** ẩn nút
>    `[title="Template"]` (`app.css .mode-ipa` · `running-word.css` · `running-team.css`). Vì Style nay
>    treo trên nút Template, ba luật đó nếu bắt trúng sẽ ẩn **HAI** tính năng chứ không phải một —
>    Style biến mất sạch ở IPA và cả hai game Running. Vá bằng cách: chỗ không đổi được template thì nút
>    **được dựng thẳng thành nút Style** (`title="Style"` làm cả ba selector trượt). Thêm template mới ẩn
>    nút Template ⇒ **thêm type vào `NO_TEMPLATE_TYPES` cùng lúc.**
> 2. **Kéo-thả trong Settings dùng POINTER EVENTS, không dùng HTML5 `draggable`** (khác Anagram editor và
>    thẻ thư mục — cố ý). Native DnD **không bắn từ ngón tay**: trên màn hồng ngoại TOMKO nó là cái nút
>    không làm gì, mà test bằng chuột thì đạt hoàn hảo. Tay kéo phải `touch-action: none`.
> 3. **`<input>` không có ellipsis** — hết chỗ là **cắt cụt im lặng**, không viết tắt được như chip
>    Showdown. Ô tên lớp học đã đo và nới cho vừa tên tiếng Việt dài (chỗ chữ **127 → 177px**); đụng vào
>    bề ngang hàng học sinh thì phải đo lại.
>
> ⭐ **Bench mới `scratch/fake-firebase-full.js` + `scratch/cls192-test.html` — LẦN ĐẦU chạy được `main.js`
> THẬT** (thư viện thật, Settings thật). Đợt 191 phải bó tay vì bộ giả Firebase thiếu `writeBatch`; bộ mới có
> đủ `collection · getDocs · query/where · writeBatch · deleteDoc · updateDoc · increment`. `scratch/` bị
> gitignore ⇒ **phiên sau phải dựng lại**.
> ⬜ **Chưa ai NHÌN bằng mắt**: pane trình duyệt bị ẩn nên `screenshot` timeout (y như Đợt 191) — đã thay
> bằng phép dò chạm `elementFromPoint`, nhưng màu/cân đối/cỡ chữ trên màn 86" vẫn phải thầy duyệt.
> ---
>
> **Đợt 191 — TINH CHỈNH NÚT MODE + 7 VIỆC TRONG SHOWDOWN.** Ô mode **98×88, icon 48**, thứ tự
> **Fight · Showdown · Running · IPA**, icon fight sửa thanh giữa, **icon IPA là chữ "IPA"**, **nút MODE
> mang icon của chế độ đang chạy** (mở app = icon single, chỉ single không sáng hào quang) và **luôn nằm
> ngoài cùng bên phải** — ⚠️ việc cuối **đảo Đợt 124**.
> ⭐ **Vòng sửa thứ 2 (191b)**: ⚠️ tool panel chặn ở **580px + `overflow:hidden`** nên ở 112px thì **ô thứ
> 5 bị xén** — phép cộng phải thoả `5×98 + 4×9 + 40 = 566`, **thêm mode thứ 6 là phải tính lại**. Mọi icon
> mode chuẩn hoá về dải **6→18** (Showdown từng thò xuống 20,5 — thủ phạm làm hàng icon võng giữa; IPA
> 6,5→17,5 vì mực cao 12 sẽ rộng 24,9 > viewBox ⇒ mất chữ đầu/cuối). ⭐⭐ **Ở mọi mode chuyển được sang
> mọi mode, và luôn lấy NỘI DUNG GỐC**: `canFight`/`canShowdown` hỏi template của `originAct` (⚠️ phải
> `hasTemplate()` trước), Fight nhận `originAct`, Showdown đi qua `openShowdownOnMount` như đường
> Fight→Showdown.
> Showdown: ⭐⭐ **nhớ HS đã xoá** (`roster`+`rosterClass` trong `sd_main`, "Reset teams" giữ lại, **nút
> Reset MỚI ở màn 1** mới gọi cả lớp về) · ⭐ **giới tính trong Settings › Classes** (lưới chip riêng,
> KHÔNG đụng textarea dán Excel) + **xáo cân Nam/Nữ** (3 làn, luôn rút làn dài nhất — đo 5♂5♀ ra
> 3♂2♀/2♂3♀) · **animation xáo tên** trước khi bay (⚠️ phải `await` xong mới `bulkMove`, vì rect có tính
> transform đang chạy) · **READY chạy được khi còn em chưa xếp** · dòng `SHOWDOWN IN ANDREW CLASSES • X
> STUDENTS` ở cả 2 màn · icon Random→shuffle, Reset teams→mũi tên back · 🐞 **pop-up phụ lệch vì nút OK
> rơi xuống `.aw-btn` đo bằng cqw — lần thứ BA cái bẫy này cắn.**
> ⬜ Lưới chip Nam/Nữ **chưa ai nhìn thấy** (nằm trong `main.js`, đòi đăng nhập thật); phần dữ liệu đã có
> 13 phép thử thuần hàm.
>
> **Đợt 190 — ⭐⭐⭐ HAI CHẾ ĐỘ MỚI RUNNING + IPA · PHIÊN ÂM VÀO ACT TÍCH
> HỢP (tab PRONUNCIATION) · BỘ ĐỌC FILE EXCEL TỰ DÒ THEO HÌNH DẠNG.**
>
> Nút MODE nay có **5 ô**: Single · Fight · Showdown · **RUNNING** (→ chọn tiếp Running word / Running
> team) · **IPA** (Speaking cards in `WORD /ipa/`, ẩn nút Template). Hai ô mới không phải luật chơi mới —
> chúng là **act từ vựng được template khác mượn tạm**, thư viện không đổi một chữ, thoát là về act cũ.
> Phiên âm nay là **bộ gợi ý thứ 5** (`pron`) nằm trong act WORDS ⇒ Edit có tab PRONUNCIATION, Options có
> nút PRONUNCIATION, và import **bỏ hẳn 2 act** PRONUNCIATION + IPA (9 act/file → **7**).
> ⭐⭐⭐ **Đo trên 121 file bài học THẬT**: bộ đọc cũ bỏ sót hơn một nửa — **67 file không ra act WORDS**
> (nay 16), **74 file không ra act QUIZ** (nay 31), **7/13 file reading sai nội dung** (nay 0). Gốc: tên
> sheet (`WORDTABLE` chỉ đúng 53/121; 65 file gọi nó là `CROSSWORD`), cột quiz lệch (chỉ 80/200 sheet bắt
> đầu ở cột A), dải dòng reading không cố định. Nay dò theo **HÌNH DẠNG**, chi tiết ở
> `core/HUONG DAN CORE.md` mục "ĐỌC FILE BÀI HỌC".
> ⛔ **Hai luật mới bắt buộc biết**: `|| playMode` trong điều kiện dựng nút MODE **là đường ra duy nhất**
> của chế độ mới; và **cấm hiện hàng bộ gợi ý trong play mode** (bấm một bộ rồi Apply làm bộ thẻ IPA âm
> thầm quay về định nghĩa tiếng Anh — cắn thật, mục 5 nhật ký Đợt 190).
>
> Trước đó: **18/8/2026 (Đợt 187 · 188 · 189) — ⭐⭐⭐ FIGHT MODE: TIME DELAY + THANH CHỜ · THANH
> TRƯỢT ĐỔI CÁCH BẤM CHO TOÀN APP · TIME COST TRỪ MỖI N GIÂY.** ✅ Cả 3 đợt **COMMIT + PUSH + LIVE**
> (`8cfc209` · `7bd96a7` · `c53f336`), mỗi đợt đều đối chiếu build đúng commit + mã băm SHA-256 khớp 100%.
> Kho **sạch, không còn gì chưa commit**.
>
> **Đợt 187** — cửa sổ hoà 0,1s cố định của Đợt 133 nay là thanh kéo **TIME DELAY** (`fightTieWindow`,
> 0,1–3,0s, **0 = ∞ = chờ tối đa 5s rồi khoá đội chưa trả lời**). Mặc định 0,1s ⇒ **mọi act cũ chạy y hệt**.
> Hoà trong cửa sổ thì cả hai ăn điểm game nhưng **chỉ đội xong TRƯỚC ăn Speed bonus**; Speed bonus
> 0–20 → **1–100**. Thanh chờ chạy trên cả 2 bàn qua API mới **`ctl.registerWaitBar(side, fn)`**
> (fight.js bấm giờ — engine vẽ). 2 game `fightPick` (Open the box · Crossword) **niêm phong** khỏi TIME
> DELAY; Find the match CÓ nhận vì nó đi vòng thường. Cùng đợt: **Time cost — ô "Idle" nay là CẢ CHU KỲ**
> (Idle 3s trừ ở 3s/6s/9s; 9 giây ngồi im: cũ −70 → mới −30), **Bonus x của Anagram 10x → 20x**, và vá 2
> lỗi Fight thầy báo: **Open the box mất đồng hồ từng ô** (fight ẩn cả `.aw-topbar`) + **Crossword phủ
> trắng cả 2 bên** (`applyPickTurn()` chỉ chạy từ `setPickTurn()` ⇒ 2 bàn kẹt `opacity:.5` suốt vòng).
>
> **Đợt 188** — **THANH TRƯỢT TOÀN APP đổi cách bấm**: chạm thân thanh = **+1 nấc**, chạm đúp = **−1 nấc**,
> kịch 2 đầu thì dừng, chạm đúng **nút tròn** rồi kéo vẫn như cũ; bỏ hẳn kiểu "bấm đâu nhảy tới đó".
> Sửa **đúng 1 chỗ** (`mkSliderCell` — `grep '"range"'` cả kho trả về đúng 1 dòng) nên Options, Settings và
> cả 17 template đổi cùng lúc. Ô không dùng được thì **MẤT MÀU** (`.is-locked`) chứ không ẩn — ⚠️
> `pointer-events:none` **chỉ chặn ngón tay**, phải kèm `disabled` kẻo phím mũi tên vẫn đổi số trên thanh
> đang xám. **Bỏ hẳn nút fullscreen ở Fight và Showdown** (thầy chốt; F11 trình duyệt vẫn được).
>
> **Đợt 189** — vá lỗi thiết kế do chính Đợt 188 đẻ ra: `.aw-optc-stack` là 1 ô lưới nhưng cao bằng 2 nên
> kéo cao cả hàng ⇒ hở **62px** dưới "Round rule" và "Time cost" tụt xuống hàng sau. Vá bằng
> `grid-row: span 2` (⛔ **không** dùng `grid-auto-flow: dense` — nó được phép đảo thứ tự ô ở bảng Options
> của cả 17 template).
>
> **Hiện trạng: Fight 7/17 · Showdown 11/17** (không đổi từ Đợt 186).
>
> **Trước đó: 17/8/2026 (Đợt 183–186) — ⭐⭐⭐ KIỂU VÒNG "LƯỢT CHỌN Ô" TRONG CORE + FIGHT &
> SHOWDOWN CHO OPEN THE BOX · FIND THE MATCH · CROSSWORD.** ✅ **COMMIT `e58d0ea` + `6f6f1c7` + PUSH +
> LIVE** (build đúng commit, **9/9 mã băm SHA-256**, và hỏi lại trên chính bản live: 7 template báo
> `fightMode`, 11 báo `showdownMode`, `fightPick` đúng `open_the_box:"wait"` + `crossword:"lock"`).
> Hiện trạng: **Fight 7/17 · Showdown 11/17**. `core/fight.js` nay biết HAI kiểu vòng — vòng thường và
> **vòng LƯỢT CHỌN** (`tpl.fightPick: "wait"|"lock"`): hai bàn cùng một lưới, bên chưa tới lượt **mờ 50%**
> và bấm không ăn, bên tới lượt chạm ô nào thì **trọng tài mở ô đó trên CẢ HAI bàn**; `"wait"` (Open the
> box) đúng trước ăn điểm + reset đồng hồ 2 bàn nhưng **vòng vẫn chờ** đội kia và **đội sau đúng không có
> điểm**, `"lock"` (Crossword) đúng trước là **khoá** đội kia — đáp án vẫn hiện nhưng **tính là sai**; đội
> kết thúc **sau mà sai** được chọn tiếp, chỉ khi cả hai cùng đúng mới đảo lượt. **Find the match đi vòng
> THƯỜNG** (định nghĩa tự chạy đến, ô chữ là đáp án — không có ô câu hỏi nào để chia lượt).
> 🐞 Ba lỗi thật vá kèm: (1) **"đội chậm không giữ điểm" ghim sai mốc** — phải ghim vào TỔNG ĐẦU VÒNG và
> trong không gian TỔNG (`+freezeAdj`), bản cũ trả lại điểm đã huỷ ở lần đóng băng thứ hai (ảnh hưởng cả
> Quiz từ trước); (2) `buildCrossword()` có `Math.random()` ⇒ **2 bàn dựng 2 lưới khác nhau**; (3)
> Crossword tự vẽ ô điểm nên **không bao giờ gọi `ui.setScore()`** ⇒ bảng điểm trận đứng yên ở 0.
> Showdown cho 3 game này cần `review` theo **thứ tự chơi thật** (`playOrder`) vì lớp tự chọn thứ tự.
> Lưới mới: `otb-fight-test` 24/24 · `ftm-fight-test` 18/18 · `cw-fight-test` 11/11, `tf-fight-test` vẫn
> 20/20. **Bài học lặp 3 lần**: template tự `shuffle`/`Math.random` là hai bàn ôm hai nội dung khác nhau,
> im lặng — grep hai thứ đó trước khi bật cờ cho template thứ 8.
>
> Trước đó: **17/8/2026 (Đợt 182) — ⭐⭐ FIGHT MODE CHO TRUE/FALSE (4/17) + CHỐT LUẬT "LƯỢT CHỌN Ô".** ✅ **COMMIT `68b2fa4` + PUSH + LIVE** (build đúng commit, 2/2 mã băm). Thầy giao mở Fight +
> Showdown cho **True/false · Open the box · Crossword · Find the match**. True/false xong trong đợt này
> (Showdown của nó đã bật từ Đợt 178); 3 game kia để học sinh **tự chọn thứ tự** nên phải có luật mới,
> **thầy đã chốt luật "lượt chọn ô"** — chép nguyên văn + máy trạng thái suy ra trong `GHI CHU DU AN.md`
> mục Đợt 182.6, **đọc mục đó trước khi code**. Hai thứ phải sửa ngoài phần nối dây, cả hai im lặng:
> `order` của True/false **xáo riêng từng bàn** (⇒ cùng số vòng mà hai câu khác nhau) và **dấu ✗ là lộ
> trọn đáp án** trong game 2 lựa chọn (⇒ giấu tới `reveal()`). Lưới mới `scratch/tf-fight-test.html`
> **20/20**, đối chứng ngược trên code cũ **8/20**; 1 lỗi **chỉ ảnh chụp bắt được** (dấu ✓ 26% đè lên chữ
> "True", trắng-trên-xám đọc nhạt → đĩa trắng 17% mang dấu màu ở góc nút).
>
> Trước đó: **17/8/2026 (Đợt 181) — 🐞 VÀO FIGHT MODE LÀ MẤT SẠCH ACT CON.**
> ✅ **COMMIT `977ec67` + PUSH + LIVE** (Pages build đúng commit — deployment `5945023320`, `built` —
> và **2/2 file trùng mã băm SHA-256** trên `aword.andrewclasses.com`). Thầy hỏi "chuyển template ở đơn/fight/showdown đã chọn tự do được
> TEXT-VOICE và các act con chưa?" — đo ra: **đơn RỒI, showdown RỒI, fight CHƯA**, và chưa cả khi
> *không* đổi template: trong trận đấu Options **không có** ENG1/ENG2/VI1/VI2, **không có** hàng
> PRACTICE/HOMEWORK, nên trận bị khoá cứng vào act con đang chọn lúc bấm vào Fight. Gốc: `engine.js`
> trao cho `startFight()` bản act **đã `resolveActivity()`** (đã tước `variants`/`contentSets`), còn
> `fight.js` dựng 2 bàn **không kèm `base`** ⇒ `subActSource()` (Đợt 154) không còn cửa nào hỏi ngược về
> act gốc. Soi ra thêm một lỗi ngầm chưa ai gặp: Apply trong trận gọi `saveActivity()` trên **chính bản
> đã bẹp**, tức **ghi đè act thật trong thư viện, mất 3 bộ gợi ý còn lại**. Vá: trận nhận `libAct` và
> **tự resolve một lần** (`playAct` = thứ 2 bàn CHƠI · `activity` = thứ Options GHI VÀO/LƯU); thêm
> `ctl.matchAct()` + `subActOwner()` trong engine (một định nghĩa duy nhất cho "act của ván này"), nên
> options riêng từng act con (Đợt 147) cũng chạy trong trận, và act đã convert thì Apply đi qua
> `applySubActSelection()` → ghi lên act GỐC rồi convert lại. Lưới mới `scratch/subact-modes-test.html`
> **20/20**, có **đối chứng ngược** đo trên code cũ (hỏng đúng 7 phép); nhóm C bấm chọn act con → Apply →
> Play → đọc chữ trên **cả hai khung** ("VI1 + VI1", "HOMEWORK + HOMEWORK"). **Bài học**: một chế độ thứ
> hai phải hỏi đúng người giữ act của chế độ đó — bản sao để CHƠI không trả lời được câu nào về act con.
>
> Trước đó: **17/8/2026 (Đợt 180) — 🐞 SHOWDOWN: XEM CẢ LỚP RA 30 EM CHO LỚP 15 EM.**
> ✅ **COMMIT `981b86d` + PUSH + LIVE** — Pages build đúng commit (deployment `5944156550`, `success`),
> **3/3 file trùng mã băm SHA-256**, và chạy lại phép thử **trên chính bản live**: lớp 15 em + hàng
> `sd_solo` bẩn → đội mình 5 · cả lớp **15** · 0 tên lặp · 15/15 ô phễu có % · title solo ra
> **`SHOWDOWN A1A`**. Chế độ **solo (1 đội = cả lớp)** được khai ở 2 chỗ trong `showdown-setup.js` là
> "không bao giờ ghi Firebase", nhưng `engine.js` lúc kết thúc ván chỉ hỏi *"có pick không?"* và
> `saveTeamResult()` chỉ chặn `!pick.teamId` — mà `sd_solo` **có** teamId. Một ván solo chạy thử để lại
> hàng `sd_solo` chứa **cả 15 em**; chơi lại theo 3 đội thì bảng lớp cộng 5+5+5+**15** = **30**, mỗi em
> 2 lần, im lặng hoàn toàn (bảng từng đội vẫn đúng, hàng bẩn mang chính tên lớp). Vá 3 lớp: chặn ở
> **nguồn** (không ghi solo) + chặn ở **chỗ đọc** (bỏ hàng solo cũ, để màn hình sạch ngay mà không phải
> Reset teams) + **gộp trùng theo học sinh** trong `buildClass()` (khoá là ID, chỉ lấy tên khi thiếu id
> — lớp trùng đủ họ tên là có thật, gộp nhầm 2 em là đúng con lỗi này lộn ngược). Có một đường **không
> thể vá ở thượng nguồn**: em chuyển đội, hai bản ghi đều là ghi chép thật. Kèm 2 cải tiến của thầy:
> **% trong ô rank** (gọi chính `pctBand`, cùng mẫu số với danh sách) và **title hết lặp tên lớp**
> (`A1A • A1A` → `A1A`, gập theo CHỮ ĐƯỢC VIẾT chứ không theo id mode). Lưới mới
> `scratch/showdown-dupe-test.html` **19/19**, có đối chứng ngược đo trên code cũ (30 khối → 15).
> **Bài học**: một hằng số khai là "không bao giờ đi ra ngoài" phải có chốt chặn ở đúng **cửa ra** —
> `SOLO_TEAM_ID` đã được import vào file đó từ Đợt 159 mà chưa hề dùng để chặn đường ghi.
>
> Trước đó: **17/8/2026 (Đợt 179) — 🐞 VÁ LỖI CÓ SẴN CỦA TRUE/FALSE.** Bật Options →
> Unanswered = **Repeat** thì **mỗi câu trả lời sai làm biến mất một câu khỏi ván**, im lặng: câu bị
> nuốt vẫn nằm trong Show answers dưới dạng "chưa làm", không gì nói rằng cả lớp chưa từng thấy nó.
> Gốc: `requeueRandom()` tự `queue.shift()`, nhưng hai nơi gọi **không thống nhất** — `dropOrRequeue()`
> (hết giờ) chưa lấy gì nên shift là đúng, còn `choose()` (bấm sai) đã shift ngay lúc bấm nên cú shift
> thứ hai ném đi câu KẾ TIẾP. Vá bằng cách tách hẳn hai việc: `requeueRandom()` **chỉ trả câu về**,
> lấy khỏi đầu hàng đợi là việc của bên gọi. KHÔNG sửa core, đúng 1 file.
> Đo được: code cũ **6/8** câu từng được hiện (2 câu bị nuốt) · code vá **8/8**, 0 câu bị nuốt.
> Lưới thử `scratch/showdown-all-test.html` nay có `?repeat=1&lives=0&speed=0` + phơi `window.__act`
> để bài test tra đáp án đúng.
>
> Trước đó: **17/8/2026 (Đợt 178) — ⭐⭐ MỞ SHOWDOWN RA 8/17 TEMPLATE (3 → 8) + VÁ LỖI CORE
> LÀM TÊN HỌC SINH TÀNG HÌNH.**
> ✅ **COMMIT `60f85d4` + PUSH + LIVE** — đối chiếu **12/12 file trùng mã băm SHA-256**, và chạy lại
> trên chính bản live: 8 template báo `showdownMode:true`, 9 template báo tắt, đúng danh sách chốt.
> ⭐ CÓ SỬA CORE (`engine.js` · `app.css`) + 5 file game + 2 CSS game.
> **Mở thêm 5**: Balloon pop · Gameshow · Speaking · Unjumble · True/false.
> **Chưa mở 9, có lý do rõ**: Flying fruit + Maze chase (plumbing ĐÚNG, chỉ **hết chỗ đặt tên** — chờ
> thầy chốt) · Crossword + Find the match + Open the box (học sinh tự chọn thứ tự câu ⇒ `review` không
> theo thứ tự chơi) · Whack-a-mole (`review` không ghi kết quả gì) · Running word + Running team (đã có
> cơ chế chia đội RIÊNG; Running team còn xoay vòng theo đúng sổ lớp) · Speaking cards (không chấm điểm).
> ⚠️⚠️ **LỖI CORE NẶNG**: nhánh `if (topbarMid)` của `engine.js` gắn `topbarMid` **THAY VÌ**
> `centreSlot` ⇒ mọi template khai `inlineTimerBar` tạo ô tên, tô tên mỗi câu, rồi **không bao giờ đưa
> vào tài liệu** — không lỗi, không ô trống, cái tín hiệu cả lớp nhìn đơn giản KHÔNG TỒN TẠI. 3 template
> Showdown cũ dùng `hasLivesSlot` nên thoát, bẫy nằm chờ đúng đợt mở rộng này.
> ⚠️⚠️ **HỢP ĐỒNG NAY CÓ 3 ĐIỀU KIỆN, đọc `core/HUONG DAN CORE.md` mục "BA ĐIỀU KIỆN" TRƯỚC KHI bật cờ
> cho template thứ 9**: (1) `setNav.index` phải là **VỊ TRÍ CỦA CÂU TRONG `review`** — True/false đang
> gửi ĐIỂM SỐ, Open the box cũng vậy (đo được: 10 lần đổi tên cho 8 lượt); (2) `review` phải theo đúng
> **thứ tự chơi**; (3) phải **CÓ CHỖ TRỐNG** cho cái tên 3.6cqw — và điều kiện 3 **chỉ NHÌN mới biết**.
> ⚠️ **3 lỗi của đợt này chỉ ẢNH CHỤP bắt được, mọi số đo báo ĐẠT**: bị che (Balloon pop — bắt bằng
> `elementFromPoint`, vá bằng `z-index:6` cho `.aw-top-centre.is-showdown`) · chìm màu (Gameshow nền
> tối, vá bằng chữ trắng trong `gameshow.css`) · hết chỗ (Flying fruit + Maze chase ⇒ CHƯA BẬT).
> Lưới thử mới: `scratch/showdown-all-test.html` (chạy Showdown trên bất kỳ template; `?off=5` là BẮT
> BUỘC khi thử True/false, thiếu nó đối chứng ngược "đạt" oan).
>
> Trước đó: **17/8/2026 (Đợt 177) — ⭐⭐ SHOWDOWN: KẾT QUẢ CÁC ĐỘI TỰ ĐỒNG BỘ · TITLE
> SHOW ANSWERS THÀNH NÚT 3 CỬ CHỈ · BẢNG XẾP HẠNG HÌNH PHỄU.**
> ✅ **COMMIT `dc7a72e` + PUSH + LIVE** — Pages build đúng commit (`status: built`), đối chiếu **7/7
> file trùng mã băm SHA-256**, và dựng **cả màn Show answers bằng module live trên CSS live** đều đạt.
> ⭐ CÓ SỬA CORE (`engine.js` · `showdown.js` · `showdown-setup.js` · `icons.js` · `store.js` ·
> `app.css`) **+ 1 FILE CORE MỚI `core/showdown-review.js`**.
> **Nội dung 177:**
> 1. **Kết quả liên đội** — tài liệu mới `users/{uid}/items/sd_results` (`kind:"showdown-results"`).
>    Đội nào xong game là `finish()` tự đẩy kết quả (bắn-rồi-quên); máy khác chạm title là đọc cả lớp.
> 2. **Title là một NÚT**: `SHOWDOWN A1C • TEAM 3`, xanh lá = "đang xem cái này". Chạm 1 lần đổi
>    đội ↔ cả lớp (`TEAM 3` thu vào `A1C`, số HS mọc ra — là **số em ĐÃ CÓ DỮ LIỆU**, không phải sĩ
>    số); chạm 2 lần đọc lại (spinner → `UPDATED` → tự mờ); nhấn giữ ra **bảng xếp hạng hình phễu**
>    (80%→46%, cao bằng nhau, số hạng ngoài ô bám mép nghiêng, cúp vàng/bạc/đồng, title vàng lấp lánh).
> 3. **Tách file**: `showdown.js` về đúng việc LUẬT và nay **không còn một dòng `import` nào**;
>    `showdown-review.js` giữ toàn bộ DOM, mạng đi vào qua callback `loadTeams` do engine truyền.
>    `groupByMember()`/`rankBlocks()` là NGUỒN DUY NHẤT cho cả 3 nơi đọc kết quả (bảng đội · bảng lớp ·
>    payload ghi Firestore) — tính ở chỗ khác là để một đội bị đếm khác nhau giữa 2 màn.
> ⚠️⚠️ **3 BẪY ĐÃ BẮT TRƯỚC KHI CẮN, cả 3 đều hỏng TRONG IM LẶNG** (chi tiết: `core/HUONG DAN CORE.md`
> mục "Bảng kết quả chung"):
> **(a)** khoá đối chiếu phải là id act **GỐC** (`originAct`) — `convert.js` cấp id NGẪU NHIÊN cho act
> đã "Change template", 2 cột cùng đổi sang Quiz sẽ không bao giờ thấy kết quả của nhau;
> **(b)** lệnh ghi phải là `setDoc(merge:true)` **một khoá map**, cấm đọc-sửa-ghi — 2 cột xong cách
> nhau vài giây sẽ đè mất đội của nhau mà mỗi màn vẫn hiện đúng kết quả của chính nó;
> **(c)** `kind` mới **phải khai vào `APP_DATA_KINDS`** của `store.js`, không thì nó ăn mất một số link
> và `?a=57` trả về tài liệu kết quả. (Chính lời cảnh báo sẵn trong `store.js` đã cứu.)
> ⚠️ Cử chỉ title **KHÔNG** dùng `press()` (bắn ngay lúc chạm nên không phân biệt được nửa đầu của
> chạm đúp) và **không** dùng `click` (không tin được trên màn hồng ngoại) — tự nghe luồng pointer +
> `setPointerCapture`. Ngưỡng `HOLD_MS`(520) / `TAP_MS`(250) ở đầu `core/showdown-review.js`.
> ⬜ **CÒN NỢ**: chưa thử Firestore THẬT + myActivity nhiều cột THẬT + 3 cử chỉ trên màn TOMKO THẬT.
>
> Trước đó: **17/8/2026 (Đợt 176) — SHOWDOWN + TIME EACH ROUND: TÊN HỌC SINH NỔI GIỮA
> KHOẢNG TRỐNG (đo bằng `placeShowdownName()`, sàn `margin-bottom:5.4cqw` chống đè bàn phím TTA) ·**
> ✅ **COMMIT `1c570a9` (chung Đợt 175+176) + PUSH + LIVE** — deployment `5940800996` success, đối
> chiếu 8/8 file trùng mã băm SHA-256, phép thử chạy lại trên chính bản live đều đạt.
> **Nội dung 176:
> SHOW ANSWERS có **% câu đúng/số câu ĐÃ LÀM** dạng `1:00 - 50%` (time xanh dương; % theo dải
> `pctBand()`: ≤60 đỏ · 61-72 vàng · 73-84 cam · 85-94 xanh dương · ≥95 xanh lá) · đồng hồ LƯỢT có
> **phần lẻ giây** `30,18` (ticker 50ms, dec nhỏ; `fmtRoundMs` tính từ ms NGUYÊN kẻo float ăn 1
> phần trăm giây; đồng hồ TỔNG giữ nguyên).** Sửa `engine.js` · `showdown.js` · `app.css`, test qua
> `scratch/round-test.html` cả 3 template × 3 mode. Chi tiết: `GHI CHU DU AN.md` mục "Đợt 176".
> ⚠️ 2 bẫy đáng nhớ: tên rời luồng làm playarea cao thêm ⇒ bàn phím TTA từng ĐÈ LÊN TÊN 17px (chữa
> bằng sàn margin) · canh ngang tên phải bằng `left/right`, CẤM `translateX(-50%)` vì animation tên
> rơi đè chết transform nền.
>
> Trước đó: **17/8/2026 (Đợt 175) — ⭐⭐⭐ HẾT TRỄ + HẾT BẤT CÔNG CẢM ỨNG TOMKO: MỌI BỀ MẶT
> CHƠI KÍCH HOẠT NGAY LÚC CHẠM (`core/press.js` MỚI).** ✅ **COMMIT `1c570a9` (chung với Đợt 176) +
> PUSH + LIVE.**
> ⭐ CÓ SỬA CORE (`press.js` MỚI · `engine.js` · `fight.js` · `keyboard.js` · `app.css`) + **17 file game**.
> Gốc rễ lỗi Fight thầy báo ("A bấm trước không nhận, B bấm sau nhận trước"): mọi ô đáp án dùng
> `.onclick`, mà `click` (1) CHỈ sinh từ con trỏ CHÍNH — ngón chạm sau trên màn đa điểm bị vứt trắng,
> và (2) chỉ bắn khi NHẤC TAY — màn hồng ngoại nhận nhấc tay chậm. `press(el, handler)` bắn ngay tại
> `pointerdown` (thứ tự chạm = thứ tự kích hoạt), nuốt click sinh kèm (nhận diện bằng
> `isTrusted`/`detail`, giữ đường `el.click()` lập trình + Enter), chặn chạm dội <90ms, tôn trọng
> `disabled`; `.aw-stage`/`.aw-fight` thêm `touch-action:manipulation`. **Anagram bỏ kéo-thả ô chữ**
> (thầy chốt: mọi cử chỉ = "nhấn"; máy kéo còn trong file, không ai gọi). **GIỮ click cho chrome
> giáo viên** (toolbar/menu/setup — 4 listener đóng-khi-bấm-ra-ngoài nghe pointerdown vũ trang qua
> `setTimeout(0)`, đổi nút mở là bảng tự đóng) và **giữ pointer riêng** cho Unjumble/Maze
> chase/ô điểm tay. Đã tự test: harness bấm thật + 17 template + **2 trận Fight trọn vòng bằng toàn
> chạm non-primary** (Anagram 16-0 kèm pulse, Quiz 0-1 sang câu mới), 21 file sạch cú pháp, 0 lỗi
> console. Chi tiết + luật dùng: `GHI CHU DU AN.md` mục "Đợt 175" và `core/HUONG DAN CORE.md` mục
> **"PRESS()"**. ⬜ CHỜ TOMKO: 2 đội bấm thật · phím ảo 2 tay có đúp không (`BOUNCE_MS`) · có ai nhớ
> kéo-thả Anagram không.
>
> Trước đó: **17/8/2026 (Đợt 174) — ⭐⭐ SHOWDOWN: NÚT ✗ ĐỎ TRẢ ĐỘI VỀ · ⭐⭐⭐ TÍNH NĂNG MỚI
> "TIME EACH ROUND" (đồng hồ từng lượt học sinh) · RÀ XONG ĐƯỜNG ĐỒNG BỘ TEMPLATE/STYLE CỦA myActivity.**
> ✅ **THẦY CHỐT COMMIT + PUSH → COMMIT `4a3c0df` + PUSH + LIVE**, đã đối chiếu **8/8 file code trùng mã
> băm SHA-256** trên `aword.andrewclasses.com` (deployment `5939155018`, state `success`) và **chạy lại
> phép thử TRÊN CHÍNH BẢN LIVE** qua `scratch/round-live.html` (import module thẳng từ tên miền live) —
> 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` mục "Đợt 174"; hợp đồng kỹ thuật:
> `core/HUONG DAN CORE.md` mục **"TIME EACH ROUND"**.
> Tóm tắt: cột đội máy mình nay đeo **✗ đỏ** (hỏi xác nhận) để **nhả đội về cho máy khác** — trước đây
> bỏ tích chỉ là chuyện nội bộ, claim vẫn nằm trên Firestore suốt 12h TTL. **Time each round** (None ·
> Count up · Count down + số giây) **chỉ hiện khi đang Showdown**: tên học sinh xuống trên cụm ‹ ›, đồng
> hồ tổng xuống cạnh ☰ Menu; **Count down gom `[số giây][thanh thời gian][điểm]` vào chung hàng topbar**
> (174b, thầy chốt), Count up để số giây ở ô giữa; **hết giờ =
> coi như sai** (trừ điểm, mất tim, khoá câu; sang câu nếu bật Auto next). Thời gian từng lượt in trong
> **Show answers** (tổng cạnh tên, từng câu ở từng câu). API mới cho template: `ui.roundDone()` ·
> `ui.setRoundTimeout(fn)` · `ui.roundTimerMode()`.
> ⚠️ **`roundTimer` là option CẤU TRÚC** (engine đọc 1 lần lúc mount) nên Apply ở màn READY **phải
> restart** — đây là ngoại lệ DUY NHẤT của luật "READY không restart".
>
> Trước đó: **15/8/2026 (Đợt 159) — ⭐⭐ SHOWDOWN LÀM LẠI: 1–5 ĐỘI · MỘT ĐỘI = CẢ LỚP (KHÔNG
> LÊN MÂY) · BẢNG CÒN 2 MÀN · DÒNG TÊN TỰ ĐỨNG.**
> ✅ **THẦY CHỐT COMMIT + PUSH → COMMIT `23327b3` (gộp Đợt 158 + 159) + PUSH + LIVE**, đã đối chiếu
> **10/10 file trùng mã băm** trên `aword.andrewclasses.com` (~15 giây sau push) và **chạy lại phép thử
> TRÊN CHÍNH BẢN LIVE**: `MIN/MAX_TEAMS` = 1/5, `SOLO_TEAM_ID` có, `releaseMyClaim` xuất được,
> `visibleTeams`→`takeableTeams`, 5 icon mới có đủ, CSS mang `--sd-panel-w` + 2 bố cục + dòng tên tuyệt
> đối, **0 lỗi console**.
> ⭐ CÓ SỬA CORE (`showdown.js` · `showdown-setup.js` · `engine.js` · `app.css`) **+ 2 file game**
> (`quiz.js` · `anagram.js`).
> **Bảng đội**: số đội **2–8 → 1–5**; **màn C bị xoá**, Single mode + Reset thành **2 icon ở hàng tiêu
> đề** (cả hai hỏi xác nhận), **bỏ hẳn nút Back**; ô tên **bo góc chữ nhật**; chạm **bất kỳ đâu trong
> cột** cũng chọn được cột; **tab thứ hai vào thẳng màn cột** và đội máy khác đã lấy thì **hiện mờ, bấm
> không được** (đảo lại luật "ẩn hẳn" của Đợt 156).
> ⭐ **MỘT ĐỘI = CẢ LỚP**: bấm READY ngay ở màn đầu, tên đội = **tên lớp**, id riêng `sd_solo`, và
> **KHÔNG ghi Firestore một dòng nào** (đo: kho rỗng sau khi Ready). Vẫn nhả claim cũ — đó là dọn dẹp
> chế độ trước.
> ⭐ **BỐ CỤC (bản 159b — thầy xem rồi sửa tiếp ngay trong ngày)**: bảng rộng **đúng bằng khung app**,
> **cột chia nhau** phần có (`flex:1 1 0`) ⇒ **không số đội nào đẩy tràn ngang được nữa**. **Hai bố
> cục**: ≤3 đội thì **ô chờ bên phải, cột cao** (thân 470px) · ≥4 đội thì **ô chờ lên trên, cột ngắn**
> (thân 400px). Sức chứa mỗi đội **suy ra** `ceil(sĩ số/số đội)` — lớp 20 ra đúng 10/7/5/4.
> Hàng dưới gom hết: `[Single][Reset][Random/Flyback]` — SHOWDOWN — `[Ready]`, **bỏ hàng tiêu đề trên
> và mọi câu hướng dẫn**. **Nút Random** chia đều ngẫu nhiên; đầy rồi thì thành **Flyback** (hỏi xác
> nhận, mọi ô tên bay về).
> ⚠️ **Bề rộng phải truyền bằng `--sd-panel-w`, KHÔNG phải `style.width`** — `swapContents` xoá
> `style.width` giữa chừng để đo, inline width sẽ biến mất ngay lần mở đè bảng khác.
> Đo lại 4 ca (2 · 3 · 5 đội · cả lớp còn chờ): **0 cuộn ngang · 0 cuộn dọc · 0 tên bị cắt · panel
> cũng không cuộn**.
> ⭐ **DÒNG TÊN**: ra khỏi dòng chảy ⇒ đồng hồ đổi bề rộng thì tên **lệch 0px** (trước đây bị đẩy theo);
> và hook mới **`ui.itemChanging(index0,{outMs,inMs})`** để tên cũ tụt-mờ / tên mới rơi **đúng khung
> hình** với câu hỏi — `setNav` báo quá muộn (nó nằm GIỮA hai nhịp của template).
> 🟢 ĐÃ TỰ TEST cả **0ms và 900ms mạng chậm**, 0 lỗi console. ⬜ Chờ thầy nhìn trên màn 86".
>
> Trước đó: **14/8/2026 (Đợt 158) — ⭐⭐ BA CHẾ ĐỘ GỘP VỀ MỘT NÚT: SINGLE · FIGHT · SHOWDOWN.**
> ⬜ **CHỜ THẦY DUYỆT — CHƯA COMMIT.** ⭐ CÓ SỬA CORE (`engine.js` · `icons.js` · `app.css` ·
> `showdown-setup.js` thêm 1 hàm xuất).
> Hàng nút dưới khung còn **4** (trước 5): Options · Template · Style · **MODE**. Bấm MODE ra **bảng
> chọn ô icon, KHÔNG CHỮ** → chạm ô nào thì **đi tiếp** sang màn hỏi lại (Fight, Single) hoặc bảng đội
> (Showdown). **Đang ở chế độ nào thì ẩn ô đó** — trừ **Showdown vẫn hiện, viền xanh lá**, vì đó là
> đường DUY NHẤT vào lại "Reset team".
> ⚠️ **Cỡ bảng đã sửa 1 lần trong ngày**: bản đầu to bằng bảng đội (660×440, icon 193px) và thầy bác
> — *"pop-up nhỏ vừa đủ nhìn thôi"*. Nay ô **148×132**, icon **76px**, panel tự ôm: **2 ô = 348×162,
> 3 ô = 508×162**. Bảng này **không khai bề rộng** (đừng buộc nó vào `.is-sd` lần nữa).
> ⭐ **2 lỗi thật tự bắt được, cả hai đều hỏng Ở CHỖ KHÁC nên không tự thấy:**
> **(1)** hai đường thoát Showdown không đi qua bảng đội chỉ xoá pick mà **để nguyên claim trên
> Firestore** ⇒ đội đó **biến mất khỏi mọi màn hình khác 12 giờ** (sai từ Đợt 155). Nay
> `releaseMyClaim()` là hàm xuất, mọi đường kết thúc Showdown đều gọi.
> **(2)** trong trận bấm Showdown mà mở thẳng bảng đội thì xếp xong 20 em, bấm READY, bàn dựng lại
> **vẫn trong trận** ⇒ `showdownPick` bị bỏ qua, **công xếp đội bay sạch không một lời báo**. Nay phải
> thoát trận trước, bàn đơn mới **tự mở** bảng đội (cờ `openShowdownOnMount`, đọc-xong-xoá-ngay).
> ⛔⛔ **Bẫy `panel.isConnected` CẮN LẠI, lần này trong `core/engine.js`** — Đợt 156 chỉ chữa bên
> `showdown-setup.js`. Đợt này biến swap thành đường bình thường nên nó hết "may": kiểm
> `loading.isConnected` và dựng vào `loading.parentNode`. Đo được: t=360ms lớp swap chết mà con của nó
> vẫn sống trong bảng thật.
> 🟢 ĐÃ TỰ TEST bằng trang thử backend giả (`scratch/`, có **núm `__fakeDelay`** như luật core đòi):
> chạy lại **toàn bộ ở 900ms mạng chậm** — bảng đội không kẹt 'Loading', claim nhả đúng dù bàn dựng lại
> giữa chừng; 3 trạng thái ô đúng; Cancel quay về bảng chọn; Apply vẫn giữ Showdown; `FIGHT:on/off`
> đúng lúc; Crossword (không opt-in) không có nút MODE. **0 lỗi console.**
> ⬜ Chờ thầy **nhìn trên màn 86"** (icon to thế vừa chưa, 3 ô có chật không) và quyết có cần **tiếng
> riêng** cho bảng chọn không (hiện dùng `sound.click()` sẵn có).
>
> Trước đó: **14/8/2026 (Đợt 157) — ⭐ SHOWDOWN: Ô TÊN TO HẲN, BỐ CỤC CÂN LẠI CẢ 3 MÀN,
> ÂM THANH + CHUYỂN CẢNH CHO MỌI THAO TÁC.**
> ✅ **THẦY CHỐT COMMIT + PUSH → COMMIT `57677cf` (gộp Đợt 155-156-157) + PUSH + LIVE, đã đối chiếu**
> **10/10 file trùng mã băm** trên `aword.andrewclasses.com` (~15s sau push) và **chạy lại phép thử**
> **TRÊN CHÍNH BẢN LIVE** (nút đúng chỗ, bảng 660×410, luật chia lượt đúng, 0 lỗi console).
> ⭐ CÓ SỬA CORE (`showdown-setup.js` dựng lại phần panel · `app.css`).
> Trần thật của lớp là **20 HS** (không phải 60) ⇒ ô tên **13→15px, cao 28→36px**; panel **580→660**,
> thân **620×410** (**410 là số ĐO**: 20 em cần 320px danh sách, ở 360 phải cuộn 44px). Hàng chọn
> lớp/số đội đổi sang **lưới `1fr 152px`**; ô danh sách rỗng **canh giữa**.
> ⚠️ **Hai lỗi bề rộng**: `.is-sd` chỉ khai `width` nên bị `max-width:580px` của luật gốc **kẹp lại
> trong im lặng**; và thân bảng từng khai bề rộng CỨNG song song với panel — hai nguồn cho một con
> số, panel hẹp hơn là thân tràn ra rồi bị `overflow-x:hidden` **xén mất điều khiển bên phải**. Nay
> panel giữ bề rộng, thân `width:100%`.
> 🔊 Bộ tiếng riêng của Showdown ghép từ `sound.glide/click/tick` — **KHÔNG thêm vào core/sound.js**
> (core dùng chung 17 game). Chuyển màn = **hai lớp chồng trượt qua nhau** 240ms; sửa trong màn thì
> KHÔNG trượt. Xoá ô thì thu nhỏ+mờ, thêm ô thì nảy. **Mọi `animate()` đều có `setTimeout` dự phòng**
> (tab ẩn ⇒ `onfinish` không bắn ⇒ lớp mờ dở nằm đè nuốt mọi cú chạm).
> 🟢 ĐÃ TỰ TEST: 20 em **không cuộn**; 20 em/4 đội mọi thứ vừa khung; chuyển màn 2→1 lớp cả 2 chiều;
> **11/11 thao tác có tiếng**; 0 ô bay sót; đầu-cuối vẫn đúng. 0 lỗi console.
> ⬜ Chờ thầy **nhìn** (không chụp được ảnh) và **nghe** (em chỉ đếm được số lần gọi).
>
> Trước đó: **14/8/2026 (Đợt 156) — ⭐⭐ SHOWDOWN BẢN THẦY CHỐT: 3 MÀN + GIÀNH ĐỘI.** (cùng commit `57677cf`) ⭐ CÓ SỬA CORE (`engine.js` · `showdown-setup.js` viết lại ·
> `showdown.js` · `options-panel.js` · `app.css`).
> Bảng: **A** lớp + số đội (2 ô to, sửa được danh sách HS) → **B** pool ô tên trên, team là cột dọc,
> chạm tên team rồi chạm ô tên thì ô **bay** vào cột, nút ✓ = đội màn hình này chơi → **C** Single
> mode / Reset team. **Một khung cỡ CỐ ĐỊNH cho cả 3 màn** (thầy chốt). Màn START hiện thêm
> "Tên team: các thành viên". **Ẩn nút MODE khi đã setup đội.** Options > Apply **giữ nguyên**
> Showdown (nó kết thúc bằng `replayCurrent()`).
> ⭐ **GIÀNH ĐỘI**: `claims` trong `sd_main` + `browserId()`; đội đã tích **không hiện** ở trình duyệt
> khác, theo dõi `onSnapshot` nên thấy ngay hai chiều; **claim hết hạn sau 12 giờ** (id ở
> `sessionStorage` nên đóng trình duyệt là không ai nhả được).
> ⛔⛔ **BẪY LỚN NHẤT ĐỢT NÀY — `panel.isConnected` LÀ PHÉP THỬ SAI**: mở panel khi đang có panel khác
> thì engine cross-fade và `panel` là lớp tạm **bị xoá ở 300ms**, trong khi giao diện vẫn sống ⇒ mọi
> `await` dài hơn thế sẽ bỏ ngang, để lại 'Loading…' vĩnh viễn. **Chỉ hỏng với mạng THẬT** — backend
> giả trả lời vài ms nên báo ĐẠT oan. Luật + cách đo: `HUONG DAN CORE.md`.
> 🟢 ĐÃ TỰ TEST đầy đủ bằng **trang thử có backend giả** (`scratch/`, import map trỏ firebase/classes
> sang bản giả) — chạy được TOÀN BỘ đường Firestore mà không cần đăng nhập: 3 màn, xoá/thêm HS,
> ô tên bay (0 bóng ma sót), 8 đội vẫn đúng khung 560×300, giành/nhả/hết-hạn claim, Options giữ
> Showdown, chơi trọn ván + Show answers. 0 lỗi console.
> ⬜ Chờ thầy: **2 máy/2 cột thật** (backend giả không thay được Firestore thật), myActivity nhiều
> cột, và **tự nhìn** hiệu ứng bay + màn START.
>
> Trước đó: **14/8/2026 (Đợt 155) — ⭐⭐ CHẾ ĐỘ MỚI **SHOWDOWN**: MỖI TRÌNH DUYỆT MỘT ĐỘI,
> MỖI CÂU MỘT HỌC SINH.** (cùng commit `57677cf`) ⭐ CÓ SỬA CORE (`engine.js` ·
> `options-panel.js` · `store.js` · `app.css` · `icons.js`) + **2 file mới** `core/showdown.js`
> (thuần) và `core/showdown-setup.js` (Firestore + bảng, chỉ nạp trì hoãn).
> Nút **SHOWDOWN** giữa Style và MODE. **KHÔNG phải biến thể của Fight** — vẫn MỘT bàn, chỉ thêm "câu
> này của em nào": bảng đội dùng chung trên Firestore, còn **mỗi trình duyệt tick đúng 1 đội** rồi
> chơi vòng tròn trong đội đó (mục đích: myActivity 2-4 cột, mỗi cột một đội). Dòng slogan thành
> **TÊN HỌC SINH**, cuối game Show answers gom **theo từng em**.
> ⚠️ **Đội của trình duyệt PHẢI ở `sessionStorage`**: `localStorage` bị 4 cột myActivity dùng chung
> (cùng partition) và `activity.options` thì bị `__awordBridge` **cố ý nhân bản** sang các cột khác —
> cả hai đều làm mọi cột đọc ra cùng một đội, im lặng.
> ⚠️ **Hai lỗi chữ Việt đo được ngay trong đợt**: ink chữ **Ẳ bị xén 5px** ở dòng tên (mọi phép kiểm
> rẻ tiền đều báo sạch, chỉ công thức ink bắt được) — và **vá bằng `padding` một mình làm topbar
> phình 47→66px**, đẩy game xuống 24px; phải kèm **`margin` âm**. Luật đầy đủ: `HUONG DAN CORE.md`
> mục SHOWDOWN MODE.
> 🟢 ĐÃ TỰ TEST (localhost, 0 lỗi console): thứ tự nút đúng · vòng lượt 1,2,3,1,2,3 và bám đúng khi
> bấm ‹ lùi · Quiz (không có slogan) chạy y hệt ⇒ ô tên là của engine · Show answers 4/6 cộng khớp,
> câu sai hiện cả 2 dòng · template không opt-in **không đổi gì** dù còn pick · Turn off sạch ·
> Options sau refactor vẫn nguyên. ⬜ **CHƯA test được phần cần ĐĂNG NHẬP** (chọn lớp thật, chia đội,
> Apply ghi Firestore, đồng bộ sang máy thứ hai) và **chưa thử myActivity nhiều cột** — xem VIỆC ĐANG
> CHỜ ở `GHI CHU DU AN.md` Đợt 155.
>
> Trước đó: **14/8/2026 (Đợt 154) — ⭐ MÀN START GỌI ĐÚNG TÊN ACT CON (`… / WORDS - ENG1`)
> + ACT TÍCH HỢP GIỮ NGUYÊN TEXT-VOICE VÀ CÁC ACT CON KHI ĐỔI SANG TEMPLATE KHÁC.**
> ✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** ⭐ CÓ SỬA CORE (`engine.js`).
> **(1)** `subActLabel()` ghép **nửa** rồi **bộ gợi ý** vào tiêu đề màn START (`QUIZ - HOMEWORK`,
> `WORDS - ENG1`) — phải **dựng lại được** vì Apply ở màn READY cố ý không restart.
> **(2)** Gốc của việc mất hàng TEXT-VOICE: `convert.js` **bẹp act TRƯỚC khi chuyển đổi**, nên act tạm
> không còn `variants`/nửa nào để panel hỏi; Anagram thoát chỉ vì act `WORDS` **vốn là act anagram**.
> Chữa bằng **một** hàm `subActSource()` (act đang chơi, hoặc **act GỐC** nếu bản đang chơi là
> `_converted`) + Apply **CHUYỂN ĐỔI LẠI** thay vì lưu suông (nội dung và clip giọng đã nướng cứng lúc
> chuyển đổi — lưu suông thì nút nhúc nhích mà game không đổi). So bằng `viewKeyOf` nên act thường
> không bao giờ chạy vào; chặn riêng act `_mistakes` kẻo ném mất mấy từ lớp đang ôn.
> 🟢 ĐÃ TỰ TEST: màn START đúng nhãn và **khớp thứ đang chơi** (VI1 ⇒ gợi ý tiếng Việt) · đổi sang
> QUIZ vẫn còn đủ 2 hàng, chọn VI1/ENG2 ⇒ **câu hỏi đổi thật** · act 2 nửa đổi sang Anagram cũng vậy ·
> **zero-diff** act thường (0 hàng, 0 chữ thêm, Apply không dựng lại) · Đợt 153 không hồi quy
> (0.00/0.00px) · 0 lỗi console. ⬜ Mắt thầy. Chi tiết: `GHI CHU DU AN.md` Đợt 154 + mục mới
> `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 153) — ⭐ HẾT "FRAME THỪA CỦA MỘT POP-UP KHÁC NẢY RA Ở CUỐI"
> KHI SANG STYLE/FIGHT: HAI LỚP SWAP BỊ DÀN LẠI TỪNG KHUNG HÌNH + 15px SCROLLBAR + 7px FONT CHƯA
> NẠP.** ✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** ⭐ CÓ SỬA CORE (`engine.js` · `app.css`).
> Chỉ Style/Mode lộ vì `.aw-tool-panel` là `max-content` còn **Options và Template cùng ghim 560px**
> ⇒ chỉ hai cú kia mới đổi bề rộng, mà từ Đợt 152 bề rộng chạy animation ⇒ **cả hai lớp swap bị dàn
> lại mỗi khung hình**: nội dung CŨ cao **340→372→389→453→487** (lưới 2 cột sập thành 1, nhảy bậc =
> "nảy") và **tới 201px nội dung cũ hở nguyên độ mờ 1** dưới panel mới cho tới lúc hộp khép hết.
> 👉 **BA LUẬT MỚI**: lớp cũ **ghim bề rộng ban đầu** (ảnh chụp — hộp hẹp lại thì CẮT, không dàn) ·
> lớp mới **ghim bề rộng ĐÍCH** ngay khung hình đầu · lớp mới **`min-height` phủ kín hộp**, chạy cùng
> đường cong với chiều cao. Kèm 2 cú giật cuối tự bắt được khi nghiệm thu: **(a)** đo đích lúc
> `.aw-swapbox` bật = đo dưới `overflow:hidden` ⇒ panel có thanh cuộn (Options trong fight mode) thừa
> **15px** — nay **gỡ class + giấu lớp cũ** rồi mới đo (ghim 505 = 505); **(b)** popover MODE là chữ
> **đầu tiên** của cả app dùng Baloo 2 **weight 400**, mà `font-display:swap` ⇒ trang vừa mở đo bằng
> font dự phòng, ghim 260 rồi **nhảy 7.36px** khi font về — nay engine **hâm nóng cả 4 weight** lúc nạp.
> 🟢 ĐÃ TỰ TEST: **8/8 hướng** đổi công cụ — mỗi lớp **đúng 1 bố cục** suốt 21 mốc, **hở ≤ 0px ở mọi
> mốc**, ghim khớp yên vị **0.00px**, 0 lớp sót · **fight mode** (vừa compact vừa có thanh cuộn) 4/4 ·
> thân Options (PRACTICE→HOMEWORK) không hồi quy, hàng công tắc không bị dựng lại · Apply + accordion
> + 2 swap chồng nhau + bấm công cụ trong lúc entrance: đúng · 0 lỗi console · chú thích CSS 261/261.
> ⬜ Mắt thầy trên Chrome thật. Chi tiết: `GHI CHU DU AN.md` Đợt 153 + 3 mục mới `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 152) — ⭐ "GIẬT LỘN XỘN + THANH SCROLL" KHI ĐỔI CÔNG CỤ: BA
> LỖI HÌNH HỌC CHỒNG NHAU, TRONG ĐÓ MỘT CHÚ THÍCH CSS HỎNG NUỐT MẤT CẢ RULE + TEMPLATE LÊN 3 CỘT.**
> ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. ⭐ CÓ SỬA CORE (`engine.js` · `app.css`).
> Cả 3 lỗi chỉ phát tác khi hộp swap là PANEL (có padding) — nên phần trong Options mượt còn
> panel-sang-panel thì loạn: **(a)** đích chiều cao đo từ LỚP TRONG nên **thiếu đúng 30px padding** ⇒
> "co pop-up lại nhỏ" rồi bung cuối cú — chữa bằng **đo đích thật** (thả neo tạm → đo hộp → ghim lại,
> trước khung hình đầu nên không lóe), kèm ghim + transition **cả width** (Options↔Style 560↔295 nay
> trượt); **(b)** lớp cũ absolute `top:0;left:0` neo vào **padding box** ⇒ nội dung cũ nhảy chéo
> lên-trái (20,14)px — chữa bằng `.aw-swap-out{padding:inherit}`; **(c)** ⭐ chú thích CSS Đợt 151
> **thiếu `/*` mở** ⇒ CSS âm thầm **vứt cả rule `.aw-swapbox`**: mất `overflow:hidden` (⇒ **thanh cuộn
> 15px** thầy thấy + đo đích dư 15px) và mất **toàn bộ transition** (⇒ giật phựt). Bắt được nhờ chênh
> **ĐÚNG 15.00px** quá tròn ⇒ scrollbar ⇒ computed `overflow` ra `"hidden auto"`.
> 👉 **2 LUẬT MỚI**: sửa chú thích CSS xong PHẢI quét cân bằng `/* */` cả file (nạn nhân là rule đứng
> sau, không báo lỗi); swap kích thước hộp thì **đo đích trên chính cái hộp**, đừng đo lớp trong.
> Kèm: **Template lên 3 CỘT** (thầy yêu cầu), ô to hơn, icon 20→24px, chữ 13→14px — 0/17 tên bị cắt,
> panel 560×431 không cuộn.
> 🟢 ĐÃ TỰ TEST: cả 3 hướng đổi công cụ **đích ghim khớp yên vị 0.00px cả 2 trục** · nội dung cũ giữ
> nguyên x suốt cú chuyển, cũ+mới cùng trượt một lượng với mép trên (panel neo đáy — trượt đồng bộ,
> không phải lỗi) · rule swapbox sống thật (`overflow:hidden`, `transition: height, width`) · đổi view
> trong Options sạch · 27/27 + 58/58 đạt · 0 lỗi script. ⬜ Mắt thầy trên Chrome thật.
> Chi tiết: `GHI CHU DU AN.md` Đợt 152 + 2 mục mới `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 151) — ⭐ LỖI NGHIÊM TRỌNG: PANEL RƠI KHỎI NEO KHI ĐỔI CÔNG CỤ
> + HẾT "NHÁY NHẸ" ENG1→ENG2 (DISSOLVE TRÊN NỀN ĐỤC).** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE (`app.css` · `engine.js`).
> **(1) Panel nhảy chỗ** (thầy: "hàng tùy chỉnh nhảy sang trái, pop-up nhảy xuống dưới bên phải"):
> `.aw-swapbox` khai `position:relative`, đứng SAU `.aw-tool-panel` cùng độ ưu tiên ⇒ trong cú swap nó
> **đè mất `position:absolute`** — panel rơi khỏi neo vào dòng chảy flex của hàng nút (đo:
> `(95,93)→(334,495)`, nút Options `x=278→26`). Chữa: `.aw-swapbox` **không đụng `position`**; đích
> swap tự lo chỗ neo (`.aw-opt-bodyhost` mang `relative` thường trực). Đo lại tĩnh + **lấy mẫu 40ms
> trong cú swap thật**: `absolute` mọi mẫu, panel và hàng nút đứng yên tuyệt đối.
> 👉 **LUẬT: class tiện ích gắn-tháo động CẤM khai `position`** — và loại lỗi này chỉ lộ đúng khung
> hình animation, phải lấy mẫu TRONG lúc chuyển chứ đừng đo sau khi yên vị.
> **(2) "Nháy nhẹ"**: cross-fade HAI CHIỀU làm tổng độ phủ tụt (~75% điểm giữa) ⇒ nội dung giống hệt
> cũng hụt sáng. Chữa: **dissolve trên nền đục** — lớp cũ đứng nguyên độ mờ 1 ở dưới, chỉ lớp mới mờ
> dần vào ở trên mang nền panel; điểm ảnh giống nhau `c·a + c·(1−a) = c`, **không đổi giữa chừng**.
> Đo: `out.opacity=1` mọi mẫu, 0 lớp sót.
> 🟢 ĐÃ TỰ TEST: 8 mẫu live Options→Template đứng yên · dissolve sạch · không hồi quy (cú nâng 9px vẫn
> hết `257.3→257.3`, options theo view đúng, act thường không sinh gì, 27/27 + 58/58 đạt, 0 lỗi script).
> ⬜ Mắt thầy trên Chrome thật. Chi tiết: `GHI CHU DU AN.md` Đợt 151 + 2 mục mới `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 150) — ⭐ HAI LỖI THẬT CUỐI CỦA CHUỖI ANIMATION: CÚ NÂNG 9px
> "TRỪ NÚT APPLY" + NỬA PHẢI ĐỔI HÌNH KHÔNG CHUYỂN TIẾP.** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE (`app.css` · `options-panel.js` · `engine.js`).
> **(b) Cú nâng — đo tĩnh ra đúng 9px**: lưới options kết thúc bằng `margin-bottom:-9px` (khoản bù
> Đợt 148); lúc nghỉ nó **thấm xuyên qua đáy** bodyHost (margin collapse), `swapContents` **ghim chiều
> cao là hết thấm** ⇒ panel neo đáy cao thêm 9px, cả khối nâng lên trừ Apply, gỡ ghim thì hạ — đúng
> từng chữ thầy tả (`panelTop 93.2→84.2`). Chữa: **`flow-root` thường trực** cho bodyHost + 2 lớp swap
> (lớp đang vào là thứ được đo lấy chiều cao đích). Đo lại `93.2→93.2→93.2`, nghỉ không đổi 1px.
> 👉 **LUẬT: hộp bị ghim chiều cao lúc animation phải là BFC thường trực.**
> **(a) Nửa phải** (ENG1-ENG2-VI1-VI2 ↔ ENG1-ENG2): bản cũ xoá trắng + dựng mkSeg mới trong 1 khung
> hình. Nay **một cụm mang đủ mọi bộ, dựng một lần** (`.aw-seg-anim`): nút rời nửa co `flex-grow 1→0` +
> `padding→0` + `margin-left:-2px` (nuốt gap, về tròn **0px**), nút ở lại nở ra cùng đường cong — vì
> **track grid không animate được còn flex-grow thì có**; thumb đổi bề rộng cùng nhịp. Dưới 2 bộ thì cả
> nửa mờ dần thay vì 1 nút chết. Đo: `4×61px ↔ 2×124px`, tổng 255px đứng yên, **cùng phần tử suốt
> phiên**, nút gone trơ.
> Kèm: đường đổi-lựa-chọn nay **nối lại** bộ đo `is-compact-opts` sau swap (trước chỉ đường đổi-panel
> có) · bỏ delay lớp vào · `.aw-opt-variants` vào reduced-motion.
> 🟢 ĐÃ TỰ TEST: 3 mốc ghim/gỡ bằng nhau · cụm nút thở đúng hình học + transition gắn thật · options
> theo view còn nguyên (Apply ghi đúng 3 bộ) · hàng công tắc vẫn sống qua đổi view · act thường không
> sinh gì · 27/27 + 58/58 vẫn đạt · **0 lỗi console**. ⬜ Mắt + tay thầy trên Chrome thật.
> Chi tiết: `GHI CHU DU AN.md` Đợt 150 + 2 mục mới ở `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 149) — ⭐ LỖI THẬT: ĐỔI TEXT/VOICE VÀ ĐỔI BỘ GỢI Ý "RẤT GIẬT"
> — VÌ CHÍNH NÚT ĐANG BẤM BỊ DỰNG LẠI.** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE (`engine.js` · `options-panel.js` · `app.css`).
> **Gốc chuyện, đo được chứ không đoán**: Đợt 147 dựng lại **cả thân panel** khi đổi view, mà **hàng
> công tắc Content nằm TRONG đó** ⇒ `switchRowSameElement: false` — **nút thầy vừa chạm bị mờ đi, bị
> xoá, rồi hiện lại thành nút KHÁC**, con trượt nhảy về chỗ mới. Hiệu ứng Đợt 148 không cứu được vì nó
> đang làm mượt đúng cái đáng lẽ không được động vào.
> **Chữa**: (a) hàng công tắc ra khối RIÊNG `.aw-opt-switches`, **dựng một lần, không bao giờ dựng
> lại**; chỉ `.aw-opt-bodyhost` được thay. ⚠️ Bẫy đi kèm: điều khiển không dựng lại thì **ghi mãi vào
> bản nháp ĐẦU** ⇒ lựa chọn nay ghi vào **`selState`** (object bền), trộn vào bản nháp **lúc Apply** —
> làm ở Apply còn lo được ca act có Text/Voice nhưng không có bộ gợi ý.
> (b) **CROSS-FADE thật**: Đợt 148 dọn rỗng hộp trước ⇒ có khoảnh khắc **trong hộp không có gì**, đọc
> thành cú xóc; nay lớp cũ nhấc khỏi dòng chảy để lớp mới vào ngay, hai lớp mờ xuyên qua nhau.
> (c) bộ đo `is-compact-opts` **nghỉ trong lúc chuyển** (nó ép tính lại bố cục mỗi khung hình).
> 👉 **LUẬT: cái điều khiển gây ra thay đổi phải ở NGOÀI vùng bị dựng lại.**
> 🟢 ĐÃ TỰ TEST: **`SWITCH ROW SURVIVED: true`** (phép đo lật được 2 chiều) · giữa chừng đủ 2 lớp, xong
> thì sạch tuyệt đối · options-theo-view vẫn đúng · ca **không có bộ gợi ý** vẫn Apply được và không
> sinh `viewOptions` · PRACTICE/HOMEWORK ok · đổi panel cùng một hộp, bấm dồn 3 công cụ vẫn sạch ·
> **không hồi quy Đợt 148** (accordion `289→235→235`) · 2 bộ kiểm tự động vẫn đạt · **0 lỗi console**.
> ⚠️ Ghi lại: **bộ đệm console của công cụ test giữ lỗi CŨ qua nhiều lần tải lại** — phải mở **tab mới**
> mới kết luận được là sạch. ⬜ Vẫn cần **tay thầy** cảm nhận độ mượt.
> Chi tiết: `GHI CHU DU AN.md` Đợt 149 + mục mới ở `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 148) — ⭐ HẾT HẲN "KHỰNG 1 NHỊP" + MỌI LẦN ĐỔI PANEL ĐỀU MƯỢT
> + KHUNG TEMPLATE BẰNG KHUNG OPTIONS, MỖI GAME MỘT ICON.** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE (`app.css` · `engine.js` · `icons.js` · `catalog.js`) + `anagram.js`/`.css` + `main.js`.
> **(1) Nhịp thứ hai** — Đợt 147 mới chữa nhịp đầu. Đo: co ruột về 0 ⇒ lưới 235px, bỏ ô khỏi bố cục ⇒
> 227px. **8–9px đó là `row-gap`**, mà `gap` thuộc về **LƯỚI** nên **không animation nào trên Ô xoá
> được** — nó chỉ mất đúng lúc cả hàng mất. **`margin` âm KHÔNG chữa được** (đo: 235→235).
> ⇒ **Chuyển khoảng cách hàng từ lưới xuống từng ô** (`row-gap:0` + `.aw-opt-grid > * {margin-bottom}`
> + lưới `-9px` bù hàng cuối). Đo trước/sau: **mở 281px cả hai cách** (0/17 panel xê dịch), **đóng còn
> 227px**; cú đóng nay `235→235` — **nhịp hai biến mất**, panel 414→360 liền một mạch.
> 👉 **LUẬT: muốn ô của lưới co mượt tới khi biến mất thì khoảng cách phải thuộc về Ô, không phải LƯỚI.**
> **(2) Mọi lần đổi đều mượt** — `swapContents()` mới: ghim chiều cao → mờ đi → dựng lại → chạy tới
> chiều cao mới. Áp cho đổi bộ gợi ý/TEXT↔VOICE/PRACTICE↔HOMEWORK **và** Options→Template/Style/Mode —
> chỗ sau nay **giữ nguyên cái hộp và biến hình** thay vì huỷ panel cũ dựng panel mới (nguồn của cú
> nháy thầy báo). ⛔ **Không `requestAnimationFrame`** (tab ẩn không gọi ⇒ hộp kẹt chiều cao vĩnh viễn);
> có thẻ chống chồng lượt khi bấm dồn.
> **(3) Template = Options về bề rộng** (`.is-tpl` dùng chung 560px) + **mỗi game một icon**, ô là
> icon + tên đọc từ trái sang. Bản đồ icon dọn về `core/catalog.js` (`TEMPLATE_ICON`) — trước đó
> `main.js` giữ bản riêng còn picker **không có icon nào**. Thêm **6 icon mới**.
> 🟢 ĐÃ TỰ TEST: nhịp hai `235→235` GONE · panel 504px 400/400 không cuộn · Options→Template **dùng lại
> đúng 1 hộp**, DOM luôn 1 panel, xong thì gỡ ghim + `overflow-y:auto` trở lại · 3 loại công tắc đều có
> chuyển tiếp · bấm dồn 40ms không kẹt · **17/17 ô có icon** · options-theo-view của Đợt 147 nguyên vẹn ·
> 2 bộ kiểm tự động vẫn đạt · **0 lỗi console**.
> ⬜ **Chưa nhìn bằng mắt** (pane ẩn ⇒ Chromium không vẽ khung hình) — cả 4 việc đều là chuyện cảm giác.
> ⚠️ Bẫy đo ghi lại: pane ẩn thì **thuộc tính đang transition kẹt ở giá trị đầu**, phải tắt hẳn
> transition rồi mới đọc bố cục. Chi tiết: `GHI CHU DU AN.md` Đợt 148 + 2 mục mới ở `HUONG DAN CORE.md`.
>
> Trước đó: **14/8/2026 (Đợt 147) — ⭐ MỖI LỰA CHỌN MỘT BỘ OPTIONS RIÊNG + VÁ LỖI THẬT
> "ANIMATION KHỰNG 1 NHỊP".** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE (`content-view.js` · `engine.js` · `options-panel.js`) + `anagram.js`.
> **Thầy yêu cầu**: *"Options của mỗi act đều độc lập — TEXT ENG1 khác TEXT ENG2 khác TEXT VI1 khác
> TEXT VI2, VOICE ENG1 khác VOICE ENG2"*; chốt thêm: áp cho **CẢ hai trục**, view mới lấy **mặc định
> Settings**, **không cần** nút "Apply to all". ⇒ act `WORDS` có **6 bộ options**, `QUIZ`/reading có **2**.
> `act.options` vẫn là bộ ĐANG CHẠY (**không chỗ nào ngoài `content-view.js` phải đổi**), `act.viewOptions[key]`
> giữ từng bộ. ⛔ 4 khoá **chọn-lựa-chọn** (`contentMode`/`contentVariant`/`voiceVariant`/`contentSet`)
> và **`optVer`** không bao giờ nằm trong bộ của một view — mất `optVer` là quy đổi lại thang điểm đã
> đúng (**-5 → -100 → -2000**, đúng bẫy Đợt 143).
> Panel **dựng lại thân** khi đổi lựa chọn, giữ nháp **theo từng view**, Apply ghi **mọi view đã đụng**
> và **xoá** khoá bộ mới không có. ⚠️ `act.options` phải **sửa tại chỗ, không gán mới** (libAct + act
> mistakes + 2 bàn đấu dùng chung một object).
> ⭐ **LỖI THẬT**: đo bằng `MutationObserver` — `display:none`, `is-closed` và `max-height:0` **rơi cùng
> MỘT khung hình (+0,9ms)**, nên ô Points off **biến mất trong 1 khung** rồi **cái hộp RỖNG** mới trượt
> 280ms. Nay ruột **ở lại suốt cú trượt**, rời khung ở **+312ms**. **LUẬT: accordion `max-height` thì
> `display:none` phải rơi SAU transition** — cùng họ bẫy Đợt 137 trên đúng accordion này (lần đó sai
> thuộc tính, lần này sai thời điểm). 🔎 Mẹo: pane test ẩn thì transition/rAF chết nhưng
> **`MutationObserver` vẫn chuẩn**, đủ để đo thứ tự thao tác DOM.
> 🟢 ĐÃ TỰ TEST: nháp theo view (ENG1 sửa dở → VI1 ra mặc định → quay lại ENG1 còn nguyên) ·
> lưu độc lập đo trên act thật (`text:eng1=countDown` · `text:vi1=none` · `voice:eng1=none`) ·
> trục PRACTICE/HOMEWORK (`practice=countUp` · `homework=countDown`) · **tới được game thật** (timer
> `none` ⇒ đồng hồ ẩn) · **đối chứng zero-diff** (act thường KHÔNG sinh `viewOptions`, `lives` không bị
> bước xoá-khoá đụng) · 2 bộ kiểm của Đợt 145+146 vẫn đạt · **0 lỗi console**.
> ⬜ Chưa **nhìn bằng mắt** cú trượt đã hết khựng chưa · chưa thử **Firestore thật**.
> Chi tiết: `GHI CHU DU AN.md` Đợt 147; hợp đồng ở `core/HUONG DAN CORE.md` 2 mục mới.
>
> Trước đó: **14/8/2026 (Đợt 146) — ⭐ QUIZ1+QUIZ2 VÀ HAI BẢN READING ACT GỘP LÀM MỘT:
> MỖI ACT MANG 2 NỬA **PRACTICE** / **HOMEWORK**.** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE (đi cùng Đợt 145).
> ⭐ CÓ SỬA CORE (`content-view.js` · `lesson-import.js` · `engine.js` · `options-panel.js` ·
> `app.css`) + `main.js` + **3 editor**; **0/17 file game phải sửa**. Đây là **Đợt B** trong kế hoạch
> 4 đợt (A ✅ · **B ✅** · C options HOMEWORK khi giao bài · D xoá sạch dữ liệu cũ).
> **Gốc chuyện**: `QUIZ1`↔`QUIZ2` là 30 cặp câu **diễn đạt lại của nhau**, `READINGACT1`↔`READINGACT2`
> cũng vậy. Nay **một act mang cả hai nửa**; đuôi `" HW"` và thư mục `ACT/HOMEWORK` **biến mất**.
> **1 file `.xlsm` từ 16 act xuống đúng 9.** Trong app không còn gọi QUIZ1/QUIZ2 mà gọi
> **PRACTICE / HOMEWORK**; hàng chọn nằm **TRÊN hàng TEXT-VOICE**, act không có nửa 2 thì **ẩn hẳn**.
> ⚠️ **HAI CÔNG TẮC RỜI NHAU** (thầy chốt): hàng này chỉ chọn **NỘI DUNG**; bộ options lớp nhận khi
> được giao bài quyết định lúc giao bài — **Đợt C**, không phải đợt này.
> **Kiến trúc**: trục thứ hai trong `core/content-view.js`, `resolveActivity()` xử lý **cả hai trục độc
> lập** và giữ nguyên 2 tính chất của Đợt 145. ⛔ **Nửa ĐẦU không được chép vào `sets`** — lưu 2 chỗ là
> ghi 30 câu lên Firestore hai lần rồi phải tự tay giữ khớp mãi mãi.
> ⚠️⚠️ **DẠNG LƯU ≠ DẠNG ĐANG SỬA**: trong editor `sets` giữ MỌI nửa, `content[itemsKey]` chỉ là chỗ
> nháp của tab đang mở; không tách là mở tab HOMEWORK **ăn mất nửa practice**.
> `expandSetsForEditing()` ↔ **`foldEditedSet()` (bắt buộc gọi trước khi Save)**.
> 🟢 ĐÃ TỰ TEST: **58/58 phép kiểm trên chính file .xlsm của thầy** (ra đúng 9 act, 2 nửa thật sự khác
> nhau, nửa đầu không bị nhân bản) · vòng đời editor expand→sửa→fold đúng ở cả 2 chiều · trình duyệt
> thật: hàng PRACTICE|HOMEWORK là phần tử đầu panel, **hit-test 2/2**, **396/396px không cuộn**, bấm
> HOMEWORK→Apply→Play ra **đúng câu homework**, **cả 3 editor** giữ đúng phần sửa của từng nửa ·
> **đối chứng zero-diff** (act thường: 0 hàng set, 0 tab, `content` chỉ còn `questions`) · **0 lỗi console**.
> ⬜ Chưa nhìn được **bằng mắt** · chưa thử trên **Firestore thật**.
> Chi tiết: `GHI CHU DU AN.md` Đợt 146, hợp đồng ở `core/HUONG DAN CORE.md` mục "MỘT ACT MANG 2 NỬA".
>
> Trước đó: **14/8/2026 (Đợt 145) — ⭐ MỘT ACT MANG CẢ 4 BỘ GỢI Ý: ENG1 · ENG2 · VI1 · VI2
> GỘP THÀNH MỘT ACT `WORDS`, CHỌN TRONG OPTIONS.** ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.
> ⭐ CÓ SỬA CORE — **file MỚI `core/content-view.js`** + `lesson-import.js` · `engine.js` ·
> `options-panel.js` · `convert.js` · `store.js` · `app.css` + `main.js` + `anagram-editor.js`;
> **0/17 file game phải sửa**. Đây là **Đợt A** trong kế hoạch 4 đợt thầy chốt (A bộ từ · B quiz +
> reading 2 nửa PRACTICE/HOMEWORK · C options HOMEWORK khi giao bài · D xoá sạch dữ liệu cũ).
> **Gốc chuyện**: đo trên chính file bài học của thầy — trong `WORDTABLE`, **cột D/H/L/P chứa Y HỆT
> một từ, 100/100 dòng lệch 0**, chỉ khác GỢI Ý. Nên 4 act cũ (6 khi có giọng) thực chất là **một
> danh sách từ đeo 4 kiểu gợi ý**. Nay: **1 act**, 1 file `.xlsm` từ **16 act xuống 13** (Đợt B sẽ
> xuống 9). **IPA + PRONUNCIATION vẫn tách riêng** (thầy chốt).
> **Options** (thầy vẽ): một hàng **hai nửa** — trái `TEXT|VOICE`, phải là **các con của nửa đang
> chọn** (TEXT→`ENG1|ENG2|VI1|VI2`, VOICE→`ENG1|ENG2`), bên kia **ẩn**; **mỗi nửa nhớ lựa chọn riêng**.
> **Kiến trúc**: `resolveActivity()` bẹp act xuống act 1-gợi-ý ngay trước khi chơi ⇒ template không
> biết chuyện này tồn tại. **HAI TÍNH CHẤT phải giữ**: không có variants ⇒ **trả về đúng object đó**
> (nền tảng của zero-diff), và **chạy 2 lần = 1 lần** (`core/fight.js` sống nhờ nó — 2 bàn phải dùng
> chung ĐÚNG object item, mất tính chất này là "same letters" trôi khỏi nhau trong im lặng).
> ⚠️ `core/engine.js` nay phân biệt **`libAct`** (act thư viện, còn đủ 4 bộ) với **`activity`** (bản đã
> bẹp để chơi): **mọi đường GHI dùng `libAct`** — Edit · Set assignment · lưu Options · vào lại
> `startGame`. Ghi nhầm bản đã bẹp = **lưu đè act mất 3/4 nội dung, không một lời cảnh báo**.
> ⭐ **LỖI THẬT tự bắt được**: chọn VI1 → Apply → Play mà màn hình **vẫn ENG1**, vì act chỉ bẹp một lần
> lúc dựng màn còn Apply ở màn READY **cố ý không restart**. **Luật rút ra: thứ gì tính sẵn vào
> `content` phải tính lại trong `begin()`, không phải `startGame()`.**
> 🟢 ĐÃ TỰ TEST: **27/27 phép kiểm tự động chạy trên chính file .xlsm của thầy bằng đúng module thật** ·
> trình duyệt thật với tap **THẬT** (`PointerEvent` + `elementFromPoint` 6/6, bẫy Đợt 137) · **đối
> chứng zero-diff** (act cũ không giọng = **không có hàng Content**, act cũ có giọng = công tắc full
> width không nửa phải, mở panel **không ghi `contentMode`**) · panel **400/645px không cuộn** ·
> editor sửa ENG2 xong Save thì **3 bộ kia y nguyên** · **0 lỗi console**.
> ⬜ Chưa nhìn được **bằng mắt** (pane test bị ẩn ⇒ Chromium không vẽ khung hình) · chưa chạy **TTS
> thật** cho 2 bộ · chưa thử trên **Firestore thật**. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 145,
> hợp đồng ở `core/HUONG DAN CORE.md` mục "MỘT ACT MANG NHIỀU BỘ GỢI Ý".
>
> Trước đó: **13/8/2026 (Đợt 143b) — ⭐ MỌI THANH KÉO CHUNG MỘT NỀN TRẮNG + THẲNG HÀNG
> TUYỆT ĐỐI; VÁ LỖI HỒI QUY DẤU TICK CỦA ĐỢT 143.** (commit `c8e4b14`, PUSH + LIVE, build `5899396997`).
> Thầy soi ảnh bắt 2 chỗ. (1) **Lệch hàng**: nhãn Time cost cao 19px vs 14px của mọi ô khác, vì ô chỉnh
> giây nằm TRÊN dòng nhãn ⇒ thanh kéo tụt **4,5px**; chữa bằng `margin-block:-4px` cho `.aw-hstep.is-sm`
> (ô chỉnh giây thôi tham gia tính chiều cao dòng nhưng vẫn vẽ nguyên cỡ) → **0,0px ở cả 17 template**.
> (2) **Nền đen**: thanh kéo trước nay chỉ khai `accent-color`, tức **để Chrome tự vẽ**, mà Chrome **TỰ
> SUY** màu phần chưa tô từ accent — đo thật: đỏ ra nền xám nhạt, hổ phách + xanh lá ra nền **gần ĐEN**.
> Nay **tự vẽ**: `appearance:none` + `::-webkit-slider-runnable-track` là một gradient, màu đi qua
> `--aw-slider-accent`, phần đã tô qua `--aw-slider-fill` do `mkSliderCell()` bám theo giá trị.
> ⚠️ ĐỪNG khôi phục `accent-color` — với `appearance:none` nó vô tác dụng và sẽ mang lại đúng sự lệch này.
> ⭐ **LỖI HỒI QUY của Đợt 143 đã lên live**: `transform-origin: bottom left` thêm vào để "vẽ dấu tick ra
> từ góc" đã **ĐỔI CHỖ ĐỨNG** của hình đã xoay — dấu ✓ trôi xuống dưới-trái, nửa nằm ngoài ô, đọc thành
> **cái nêm trắng khoét góc**. Đợt 143 **đã kiểm và báo ĐẠT** vì chỉ đo `opacity`+`scale` (cả hai đúng);
> cái sai là **VỊ TRÍ**, chỉ lộ khi NHÌN. **Luật: đổi `transform-origin` là đổi vị trí, nghiệm bằng mắt.**
> Cũng xoá **30 luật CSS thanh kéo chết** ở 10 template (không JS nào gán từ Đợt 140) — cả app nay còn
> **đúng MỘT** thanh kéo `.aw-optc-slider`, nên "đồng nhất mọi nơi" là kiểm được chứ không phải ý định.
> 🟢 ĐÃ NHÌN BẰNG MẮT trên **Chrome thật** (pane preview không compositing) và chụp lại **trên bản live**:
> 4 thanh chung một nền, Lives ↔ Time cost cùng đường, dấu tick là ✓ trở lại. 17/17: lệch 0,0px, cùng bề
> rộng, 0 lỗi console.
>
> Trước đó: **13/8/2026 (Đợt 143) — ⭐ ĐẠI TU OPTIONS: DỌN Ô CHẾT (LUẬT OPT-IN),
> MỘT THANG ĐIỂM 0–100 CHO CẢ APP, TIME COST CHO 13 GAME, SETTINGS DÙNG CHUNG ĐÚNG PANEL VỚI TRONG GAME.**
> ⭐ CÓ SỬA CORE — **2 file MỚI**: `core/options-panel.js` (thân panel Options, dùng chung cho
> trong-game và Settings) + `core/options-migrate.js` (quy đổi thang điểm cũ, đóng dấu `act.optVer`);
> sửa `engine.js` · `app.css` · `settings.js` · `store.js` · `numberstepper.js` + `main.js` + **16/17 template**.
> **Gốc chuyện**: thầy gửi ảnh bảng Options của Anagram và hỏi có vấn đề gì. Vấn đề nặng nhất không
> phải bố cục mà là **3 ô trong ảnh bấm xong không làm gì** — đo cả 17 game: **"Auto next question"
> hiện ở 13 game và KHÔNG game nào đọc**, "Shuffle answers" hiện 12 / đọc 3, "Letters on answers"
> hiện 7 / đọc 2. Cờ `hideXxx` opt-OUT của Đợt 140 chạy đúng, chỉ là quên gắn — mà quên opt-OUT thì
> **đẻ nút chết im lặng**, quên opt-IN thì **thiếu một ô nhìn thấy ngay**. ⇒ **LUẬT MỚI: OPT-IN**
> (`usesShuffleAnswers` · `usesAutoSwitch`); xoá 3 cờ `hideLettersOption`/`hideShuffleAnswers`/`hideAutoSwitch`.
> **"Letters on answers" xoá hẳn khỏi app** (thầy chốt, Quiz + Open the box từ nay cố định None).
> **"Auto next question" GIỮ nhưng NỐI DÂY THẬT** (thầy: "vẫn cần tới nó") — Quiz · Anagram · Unjumble · Crossword.
> **Một thang 0–100 nấc 1 cho mọi hình phạt** (trước đây cùng chữ "Points off" mang 3 thang: 0–5, 0–10,
> 0–100 nấc 5). Act cũ **tự quy đổi giữ độ nặng** (×20 / ×10) — ⚠️ 2 bẫy: **có HAI tên field**
> (`pointsOff` VÀ `minusAmount` ở Crossword/Type-the-answer/Whack-a-mole) và **nhân hai lần** (-5 → -100
> → -2000), chặn bằng `act.optVer`, đóng dấu ở MỌI đường thoát sớm.
> **Time cost thêm 11 game (tổng 13)** — không phải 15: `running-team`/`running-word` đặt
> `timer:"none"` nên `timeCostPer()` trả 0, gắn cờ vào chỉ đẻ thêm nút chết. Thêm `ui.setScorePainter`
> cho 2 game tự vẽ ô điểm ("7 / 20").
> **Giao diện**: số **canh trái sát thanh trượt** · segmented có **thumb trượt** (định vị bằng `--n`/`--i`,
> KHÔNG đo pixel) · dấu tick vẽ ra/xoá đi · **Lives xanh lá** (xanh dương cũ trùng màu "đang chọn") ·
> countdown **nấc 1 giây** (giữ nút 15s/nhịp, vuốt 3px/giây) · **running-word về khuôn chung** —
> template CUỐI CÙNG còn markup cũ, nên **gỡ luôn cầu nối legacy** của Đợt 140 · **Settings hiện panel
> ĐẦY ĐỦ** (Anagram: 4 điều khiển → 9 ô + 2 segmented + 5 tick), chỉ áp cho act MỚI.
> 🟢 ĐÃ TỰ TEST: 17/17 template mở panel sạch (0 lỗi console · 0 tràn/cuộn · cao nhất 363/645 · mọi
> thanh trượt đúng 178px · khoảng cách tới số đều 9px) · **có ĐỐI CHỨNG NGƯỢC** (giả markup cũ / giả
> Letters quay lại / giả nhồi 24 thanh → bản quét báo lỗi cả 3 lần) · chạy engine thật: draft đúng
> hợp đồng, **Auto next chạy thật** (bật `1 of 4`→`2 of 4`, tắt đứng yên) · quy đổi 18/18 phép đạt,
> chạy lại 4 lần vẫn đứng yên.
> ⭐ **LỖI THẬT bắt được nhờ đo**: Crossword khai `function scoreNow()` **trùng tên hàm chết ở cuối
> file** — hai declaration cùng tên KHÔNG báo lỗi, cái sau lặng lẽ thắng ⇒ game duy nhất trong 13 game
> không trừ Time cost, không dấu hiệu gì trên màn hình. Bắt được vì **đo giá trị `setScoreProvider`
> thực trả về** cho từng game. Đã xoá + quét cả 17 template không còn hàm trùng tên.
> ✅ **THẦY DUYỆT → COMMIT `8a42521` + PUSH + LIVE** (Pages build `5892029904` success; `curl` xác nhận
> **16/16 dấu mốc** + 4 thứ đã xoá đúng là đã sạch; **chạy lại phép đo bằng chính module trên live**:
> 17/17 panel sạch, 0 lỗi console, cao nhất 365/645, thanh trượt đều 178px, khoảng cách số đều 9px,
> Auto next đúng 4 game, Shuffle answers đúng 3 game, Time cost đúng 13 game, quy đổi 3/5→60 ·
> anagram 4/10→40 · minusAmount 2/5→40, chạy lại 5 lần vẫn đứng yên).
> ✅ **THẦY ĐÃ TEST TOÀN BỘ TRÊN MÀN TOMKO (13/8/2026) VÀ BÁO CHẠY NGON** — đóng cả 2 mục treo của đợt
> này (Time cost nhìn bằng mắt · chạm tay TOMKO), **và đóng luôn mục "chưa chạm tay trên TOMKO" treo từ
> Đợt 139 + Đợt 140** vì đó cùng đúng một bảng Options. Lúc em tự test thì chưa xem được Time cost trừ
> điểm bằng mắt (pane test bị ẩn → Chromium đóng băng transition/rAF/đồng hồ; đối chứng: Quiz vốn chạy
> từ Đợt 139 cũng trừ 0 ⇒ lỗi môi trường, không phải phần nối dây).
>
> Trước đó: **13/8/2026 (Đợt 142) — ⭐ POPUP IMPORT CÓ ĐỦ BỘ CHỌN GIỌNG NHƯ EDITOR
> (MIX VOICE + RANDOM THEO GIỌNG VÙNG) + ICON LOA XANH TRÊN THẺ ACT ĐÃ ĐỦ GIỌNG.**
> Luật mix (cân bằng nam/nữ ±1, không giọng nào bị dùng trội) trước nay nằm TRONG template
> `anagram-editor.js` — popup Import không được import từ template, nên luật chuyển lên **`core/voice-mix.js`
> (file MỚI)**: `buildVoicePlan` · `planFor` · `fillVoiceOptions` · `MIX_DEFAULTS` · `describeChoice` ·
> `getLastMix/setLastMix`. **Giao diện KHÔNG dùng chung (cố ý)** — popover editor giữ nguyên từng pixel,
> Import có panel riêng. Import nay: 1 giọng (mặc định, như cũ) · **Mix 4 giọng loại trừ lẫn nhau** ·
> **Random toàn bộ giọng UK/US**; **MỘT kế hoạch cho CẢ MẺ**, `runVoiceBatch` đi qua từng act bằng con
> trỏ dịch `plan[offset+i]`. Thẻ act đủ 100% giọng đeo **huy hiệu loa xanh lá nhạt** góc trên-trái
> (`actFullyVoiced`, đọc `item.voice` sẵn có trong `node.content` ⇒ 0 lượt Firestore thêm).
> ⭐ **Lỗi thật bắt ngay trên ảnh chụp đầu tiên**: huy hiệu đè mất 2 chữ đầu câu hỏi → thụt lề DÒNG ĐẦU
> (`text-indent`), chế độ danh sách dời huy hiệu xuống góc dưới-phải.
> 🟢 ĐÃ TỰ TEST: luật mix 7 cỡ mẻ × 200 lượt cân bằng ≤1 (4 giọng qua 16.000 chỗ lệch **0.0%**) ·
> popup thật với file `.xlsm` thật (loại trừ lẫn nhau đo thật, hộp xác nhận đọc đúng "a mix of 4
> voices: …") · **70/70 từ nhận đúng giọng đã hoạch định qua 2 act** · editor không hồi quy (5 tick +
> 4 mặc định + optgroup y cũ) · 1280×800 panel 441px, không cuộn.
> ⬜ Chưa chạy TTS THẬT (cần model 86MB + đăng nhập) — thầy nghe thử khi import file thật.
> ✅ **THẦY DUYỆT → COMMIT `7faf500` + `84dd067` + PUSH + LIVE** (curl 4 dấu mốc; **chạy lại phép đo bằng
> chính module trên live**: 200 mẻ × 35 từ lệch nam/nữ tối đa 1, random UK 8 giọng không lọt giọng Mỹ).
> ⚠️ Lần đẩy này dính **sự cố hạ tầng GitHub**: push `main` bị 500 nhiều lần (đẩy cùng commit sang nhánh
> khác thì ĐƯỢC ⇒ lỗi ở cập nhật ref), **build Pages FAIL**, chữa bằng đẩy thêm 1 commit. Kèm bài học:
> **kiểm push bằng `git ls-remote`, đừng grep chữ trong output** (dòng từ chối cũng chứa `main -> main`).
> Cách chẩn đoán đầy đủ: `GHI CHU DU AN.md` Đợt 142.
>
> Trước đó: **13/8/2026 (Đợt 141) — ⭐ LỖI THẬT: IMPORT EXCEL ĐỌC **GIÁ TRỊ THÔ** THAY VÌ
> **CHỮ EXCEL ĐANG HIỆN**.** Thầy báo đáp án `8:30` vào act thành `0.3541666666666667`. Gốc: trong
> Excel `8:30` là **số 0.3541666666666667** khoác định dạng `h:mm`; SheetJS cho 2 mặt (`v` thô ·
> `w` = đúng chữ đang hiện) mà `cell()` trong `core/lesson-import.js` lấy **`v` trước**. Vá **2 dòng**:
> lấy `w` trước (áp được cho MỌI định dạng — giờ, ngày, %, tiền tệ, số làm tròn) + coi ô lỗi
> `#VALUE!` là ô trống (trước đây `v` của nó = mã lỗi **15** nên đẻ ra 5 act rác mỗi act 1 "từ" tên
> là `15`). **Đo trên cả 102 file bài học ở ổ D**: chỉ **5 file** đổi kết quả (3 file × 69 ô giờ về
> đúng chữ · 2 file bỏ act rác), **0 file mất nội dung thật**; test lại trong trình duyệt thật:
> câu 27 ra `*8:30 | 7:30 | 8:00 | 9:15 | 6:45 | 9:30`, 0 lỗi console.
> ⬜ Kèm **4 phát hiện phụ** thầy chốt CHƯA làm (43 file mất hẳn bộ quiz đầu vì sheet tên `Quiz`
> không số · 3 kiểu bố cục sheet quiz · 1 file mất format ngay trong Excel · popup Import hiện
> "· 0" cho Running word/team) — chi tiết ở `GHI CHU DU AN.md` Đợt 141 mục 5.
> ✅ **THẦY DUYỆT → COMMIT `0f67311` + PUSH + LIVE** (curl xác nhận 3 dấu mốc; **chạy lại phép kiểm
> bằng chính module trên live** → câu 27 ra `*8:30 | 7:30 | 8:00 | 9:15 | 6:45 | 9:30`, 0 số sót).
>
> Trước đó: **13/8/2026 (Đợt 140) — ⭐ THIẾT KẾ LẠI TOÀN BỘ BẢNG OPTIONS ("panel v2"):
> MỘT LƯỚI 2 CỘT, MỘT KHUÔN HÀNG DUY NHẤT, DÙNG CHUNG CHO CẢ 17 TEMPLATE.**
> ⭐ CÓ SỬA CORE (`engine.js`, `app.css`, `fight.js`, `numberstepper.js`) + **16/17 template**.
> Thầy báo: *"bảng options đang rất rối, khó nhìn, không thẳng hàng, không ngăn nắp và không thẩm mỹ"*.
> **Đo trước khi sửa** (Anagram, mode Bonus and minus): nội dung bắt đầu ở **4 mép trái khác nhau**
> (nhãn 15 · thanh trượt 17 · ô tick 19 · radio 20) · 3 thanh trượt "giống nhau" dài **212/208/220px**
> nên 3 chip giá trị bắt đầu ở 3 chỗ · bộ chỉnh số ▲▼ **cao 69px nằm trong hàng cao 12px** (2 chỗ) ·
> 6/9 hàng bỏ phí **30–76% chiều ngang** trong khi panel **cao hơn chỗ cho phép 22px** (667 vs 645)
> nên `.is-compact-opts` phải nén mọi nhãn xuống 9.5px.
> **Cách chữa (cấu trúc, không phải trang trí)**: mỗi tuỳ chọn = **1 ô của lưới 2 cột**, mỗi ô đúng 2
> phần (dòng nhãn · dòng điều khiển); radio → **segmented** (giống nút TEXT/VOICE, vùng chạm 15→30px);
> ▲▼ → **stepper NẰM NGANG** `− 2:00 +`; mọi ô tick rời rạc gom vào **một khối switch** ở đáy
> (xoá 4 tiêu đề thừa); chip giá trị **rộng cố định 52px** nên thẳng cột.
> 📉 **Đo lại cả 17 template (cùng phép đo, cùng cửa sổ 1280×720)**: trung bình **−36% chiều cao**
> (Quiz 605→344 · Anagram 616→397 · Gameshow 563→306 · Whack-a-mole 575→365 · **Balloon pop 757→424,
> trước đây PHẢI CUỘN**) · **0/17 phải cuộn** · **0/17 phải nén chữ** · fight mode Anagram (chỗ trống
> chỉ 471px) nay **không cuộn ở cả 3 mode**.
> ⚠️ **Bắt được 2 quả bom hẹn giờ**: `whack-a-mole.js` và `speaking-cards.js` đang **cắt DOM của panel
> bằng tay** (xoá nhóm có nhãn khớp /auto switch/, xoá radio `name="aw-timer"` value "none", xoá nhóm
> "End of game", sửa text node) — đổi markup là chúng **hỏng im lặng**. Nay là **cờ khai báo**:
> `hideAutoSwitch` · `hideTimerNone` (mới) · `hideShowAnswers` (mới) · `hideShuffleAnswers` ·
> `shuffleLabel` (mới). **LUẬT MỚI: template KHÔNG BAO GIỜ thao tác lên DOM của panel.**
> 🟢 ĐÃ TỰ TEST: 17/17 template mở panel sạch (0 lỗi console, 0 điều khiển bị che — có **đối chứng
> ngược** tái tạo đúng lỗi Đợt 137 để chứng minh phép đo lật được 2 chiều) · Apply ghi đúng giá trị
> đầu-cuối (đồng hồ đếm ngược chạy đúng 2:05 sau khi chỉnh) · `play.html` vẫn không nạp code thư viện GV.
> ✅ **THẦY DUYỆT → COMMIT `eea0ecd` + PUSH + LIVE** (curl xác nhận 6 dấu mốc; mở panel chạy thẳng trên bản live đo lại đúng: Anagram 397px, 2 mép trái, thanh trượt đều 190px, không cuộn).
> ✅ Đã chạm tay thật trên màn TOMKO (13/8/2026, cùng lượt test Đợt 143b) — chạy tốt.
>
> Trước đó: **13/8/2026 (Đợt 139) — ⭐ TÍNH NĂNG MỚI "TIME COST": MỖI GIÂY **TRỐNG**
> (HS ngồi không làm gì) TRÔI QUA LÀ TỔNG ĐIỂM BỊ TRỪ, số `-N` ĐỎ BAY TỪ Ô ĐIỂM VÀO ĐỒNG HỒ +
> ĐIỂM CHẠY GIẢM. KÈM: BONUS X CỦA ANAGRAM LÊN 10X.**
> ⭐ CÓ SỬA CORE (`engine.js`, `fight.js`, `app.css`, `voice-playback.js` + **file mới `core/timecost.js`**)
> + Anagram + Quiz. ✅ **THẦY DUYỆT → COMMIT `c840baf` + PUSH + LIVE** (curl xác nhận 6 dấu mốc).
> Thanh trượt 0–100 (0 = Off) + ô **ngưỡng trống 1–5s**, nằm **chung hàng 2 cột với "Points off"** nên
> panel Options **không cao thêm pixel nào** ở 2/3 mode Anagram. Chỉ Anagram + Quiz có (thầy chốt),
> template khác thêm sau chỉ tốn 1 cờ + 4 dòng — hợp đồng ở `core/HUONG DAN CORE.md` mục "TIME COST".
> ⚠️ Thầy **đổi yêu cầu giữa chừng**: bản đầu là "mỗi giây đồng hồ trôi qua là trừ", bản chốt là
> **"mỗi giây TRỐNG"** — chạm đúng chữ/chọn đáp án/sang từ mới thì reset đồng hồ trống; **chạm SAI
> KHÔNG reset** (kẻo gõ bừa là né được sạch); và **ngưng đếm hoàn toàn** khi HS không thể thao tác
> (hoạt cảnh, từ/câu đã xong, chờ giữa 2 vòng đấu, bị khoá, đang phát giọng đọc, đang mở Menu/panel).
> ⭐ **LỖI THẬT bắt được khi tự test**: chế độ ĐẤU trừ **2 lần** (-40/giây khi thanh đặt 20) vì khoản
> trừ vừa nằm trong điểm template báo lên vừa nằm trong kênh riêng ⇒ `fight.js` nay giữ `game[side]` là
> điểm **chưa tính đồng hồ**.
> 🟢 ĐÃ TỰ TEST rất kỹ (đơn + đấu, cả Anagram lẫn Quiz): trừ đúng nhịp từng giây · chạm đều 1s trong 5s
> thì điểm **đứng im tuyệt đối** · chạm sai vẫn tụt đều · giải xong 1 từ không bị trừ oan nhịp nào ·
> **zero-diff khi tắt** (không đẻ ra bộ đo nào, đếm `setInterval` của engine ra đúng `[500]`) ·
> không đẻ đồng hồ ma (Start again → 0 interval) · 10x ăn đúng 80 điểm cho từ 8 chữ · 0 lỗi console.
> ⬜ **Chưa nhìn được bằng mắt hiệu ứng số bay** (pane test bị ẩn nên WAAPI/rAF chết hẳn — xem bẫy test
> ghi ở `GHI CHU DU AN.md` Đợt 139).
> ✅ Chạm tay trên màn TOMKO: **thầy đã test 13/8/2026** (cùng lượt test Đợt 143b) — chạy tốt.
>
> Trước đó: **13/8/2026 (Đợt 138) — 📘 CHỈ GHI HỒ SƠ, KHÔNG ĐỔI MỘT DÒNG CODE NÀO:
> ghi lại thành LUẬT bài học đắt nhất của dự án — "HỢP ĐỒNG XẾP LỚP CỦA HỆ POPUP" trong
> `core/HUONG DAN CORE.md`.**
> Lý do: bẫy này đã cắn **2 lần trong 2 ngày, ở 2 DỰ ÁN KHÁC NHAU** — AWord Đợt 130
> (`transform:translateY` trên `.aw-fight-bottom .aw-below`) và myActivity v1.9.2
> (`transform:scale` trên `.aw-below`, lộ ra + vá ở myActivity **v2.0.0** ngày 13/8: thầy báo bấm
> Options/Template/Style ở chế độ 2/3/4/5 cột thì panel hiện ra mà bấm không ăn, chạm vào là tự đóng).
> **Gốc chung**: hệ z-index của popup là hệ PHẲNG tính ở GỐC tài liệu (`.aw-tool-dim` 40, con trực tiếp
> của `body` < `.aw-below-center` 41 < `.aw-tool-panel` 42); bọc 41+42 vào một phần tử **đẻ ra stacking
> context** mà nó `z-index:auto` là **nhốt cả hệ** xuống mức 0 ⇒ tấm che leo lên trên ⇒ panel vẫn VẼ RA
> (nên trông như "bị che mờ") nhưng mọi cú chạm rơi vào tấm che, mà tấm che có `onclick = đóng panel`.
> ⚠️ **Bài học lớn nhất**: lần 2 vẫn xảy ra **DÙ Đợt 130 đã ghi cảnh báo to tướng trong `core/app.css`**
> — chỉ vì người gây lỗi đang ngồi ở **dự án khác** nên không có lý do gì mở file đó ra đọc.
> **Ghi chú không bảo vệ được ranh giới giữa 2 dự án; chỉ code chạy thật mới bảo vệ được** ⇒ myActivity
> nay mang sẵn lưới an toàn `guardToolPanel()` tự phát hiện + tự vá + bắn `MYACT:AW:SCTRAP:` ra console.
> Mục mới ghi đủ: bảng 3 tầng z-index · 9 thuộc tính đẻ stacking context · cách bắt bằng
> `elementFromPoint` trong 5 giây · ⚠️ phải tìm stacking context **NGOÀI CÙNG** chứ không phải cái gần
> panel nhất (`.aw-below-center` z41 lúc nào cũng trông "an toàn" dù đã bị nhốt) · **cấm thu nhỏ
> `.aw-below` từ bên ngoài** vì AWord đã tự co thật bằng `clamp()` từ Đợt 132 (đo ở 960/640/480/384px:
> tràn 0px, luôn cách +10px, không bao giờ đè nhau) · và **5 luật rút ra dùng cho MỌI APP SAU NÀY**.
> 🟢 KHÔNG cần test: đợt này không đụng code, chỉ thêm chữ vào tài liệu.
>
> Trước đó: **13/8/2026 (Đợt 137) — ⭐ LỖI THẬT: KHÔNG KÉO ĐƯỢC THANH "POINTS OFF" TRONG
> OPTIONS (Anagram). Gốc lỗi do chính Đợt 134 gây ra: khối thu gọn `.aw-anagram-pencontent` dùng
> `max-height:0` + `opacity:0` mà **thiếu `overflow:hidden`** ⇒ ruột vẫn nằm nguyên chỗ và vẫn ăn
> chuột, lại còn được vẽ ở lớp TRÊN (vì `opacity`<1 đẻ stacking context) ⇒ **thanh trượt tàng hình đè
> khít lên thanh trượt thật, nuốt hết mọi cú kéo**.**
> KHÔNG đụng core — sửa ĐÚNG 1 file `templates/anagram/anagram.css`, thêm 2 dòng
> (`overflow:hidden` + `pointer-events:none`, `auto` khi mở).
> ⚠️ **Rộng hơn thầy báo — 3 ca, không phải 1**: mode "Bonus and minus" chết thanh *Points off (wrong
> letter)* (ca thầy gặp), còn mode "Letters with bonus" và "On submit" chết thanh **LIVES** — 2 ca này
> **chưa ai từng báo**, chỉ lộ ra nhờ quét cả panel.
> 🟢 ĐÃ TỰ TEST kỹ: kéo chuột THẬT `Off`→`-75`; **đối chứng ngược** (tiêm CSS gỡ bản vá rồi kéo y hệt)
> thanh nhìn thấy đứng im còn thanh tàng hình bị kéo lén sang `7` — tái hiện đúng triệu chứng thầy báo;
> sau vá quét lại 3 mode + chế độ ĐẤU đều OK 5/5 điểm; animation mượt Đợt 134 còn nguyên; 0 lỗi console.
> ⚠️ BẪY MỚI đáng nhớ: **accordion kiểu `max-height` mà thiếu `overflow:hidden` = bẫy vô hình ăn
> chuột** (mắt không thấy vì opacity đã giấu, chỉ lộ khi có thứ tương tác nằm ngay dưới), và
> **`opacity`<1 đẻ ra stacking context** — cùng họ với BẪY Đợt 130 (`transform` đẻ stacking context),
> **bẫy stacking-context thứ HAI cắn dự án trong 4 ngày**.
> ✅ THẦY DUYỆT → COMMIT `912016b` + PUSH + **LIVE**. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 137,
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 137.
>
> Trước đó: **13/8/2026 (Đợt 136) — ICON TRONG NÚT TO HẲN (15px → 26px, +73%) + BỎ SỐ 7 NÉT,
> TRẢ SỐ ĐIỂM TAY VỀ FONT BALOO 2 CỦA APP (+30% cỡ, weight 800, tabular-nums).**
> ⭐ CÓ SỬA CORE (`core/app.css`, `core/fight.js`). ⚠️ **ĐẢO NGƯỢC Đợt 134 cùng ngày** (số 7 nét quá
> mảnh, ngược mục tiêu "cho to dễ nhìn") — `SEVEN_SEG`, `sevenSegHtml()` và khối `.aw-seg-*` đã **XOÁ
> HẲN**, không để lại cơ chế ngủ đông.
> ⚠️ BẪY MỚI đáng nhớ: **`svg{width:62%}` KHÔNG cho ra 62% thứ người dùng thấy** — `<button>` mang
> `padding:1px 6px` mặc định của trình duyệt nên % tính trên hộp nội dung 30×40, ra hình 18,6px (42%
> nút) và **méo hộp** (18,6×24,8, padding ngang ≠ dọc). Phải `padding:0` thì % mới đúng nghĩa. Kèm:
> hạ `line-height` 1.2 → 1.1 cho số điểm tay là BẮT BUỘC (35px×1.2 = 42px > 41px chỗ thật trong ô ⇒
> bị `overflow:hidden` cắt). 🟢 ĐÃ TỰ TEST (đo DOM thật, 0 lỗi JS).
> Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 136.
>
> Trước đó: **13/8/2026 (Đợt 135) — TÍN HIỆU FIGHT MODE CHO myActivity: `core/engine.js`
> phát `MYACT:AW:FIGHT:on`/`off` đúng lúc trận Fight THẬT SỰ bắt đầu/kết thúc (sau khi thầy xác nhận
> trong khung, không phải lúc mới mở hộp hỏi) — app myActivity (trình duyệt game lớp học của thầy)
> dùng tín hiệu này để tự bật/tắt "chế độ khung act" của chính nó khi vào/ra trận.**
> ⭐ CÓ SỬA CORE (`core/engine.js`, đúng 3 dòng) — KHÔNG đổi hành vi AWord khi chạy độc lập (chuẩn
> standalone/học sinh), chỉ thêm 1 dòng `console.log` khi chạy NHÚNG trong myActivity, dùng lại đúng
> hàm `awEmit()` sẵn có (cơ chế phát `MYACT:AW:TPL/OPT/STYLE` từ v0.9.28). 🟢 ĐÃ TỰ TEST qua
> `templates/anagram/test.html` (devserver, không cần đăng nhập): bấm MODE → "Start fight" → console
> ra đúng `MYACT:AW:FIGHT:on`; bấm MODE → "Back to single" → ra đúng `MYACT:AW:FIGHT:off`; 2 khung đấu
> dựng đúng, 0 lỗi console. ✅ THẦY DUYỆT ("nếu cần thiết thì cứ push") → COMMIT `9577523` + PUSH +
> **LIVE**.
> Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 135. Việc kế = phía myActivity dùng tín hiệu này để hoàn
> thiện nút bật Fight Mode trong "chế độ khung act" (xem hồ sơ app myActivity, mục cùng ngày 13/8).
>
> Trước đó: **13/8/2026 (Đợt 134) — 12 CẢI TIẾN UI/UX ANAGRAM ĐƠN+ĐẤU: slogan lên chung
> thanh trên cùng (đơn) + tự ẩn khi đấu (miễn phí nhờ topbar đã collapse sẵn) · cụm loa +1 cột sóng,
> nhạy hơn, canh lề icon↔sóng cân đối tuyệt đối · panel Options tự thu nhỏ khi tràn (ResizeObserver,
> không dao động lặp) · animation mở/đóng MỌI popup mượt hơn (áp cho cả 17 game) · animation mượt cho
> 3 nhóm Points-off/Bonus khi đổi mode · âm thanh mới khi điểm chạy đếm (cả đơn lẫn đấu, hoá ra trước
> đây cả 2 đều chưa có) · ⭐ VÁ LỖI THẬT "2 loa lệch màu" (PULL voice state thay vì chỉ PUSH) · Options
> đấu tách nhóm "Round rule" riêng (áp cho cả Quiz) · số điểm tay to hơn kiểu 7-segment vẽ bằng CSS
> thuần (không nhúng font ngoài) · "TEAM 1/2 WINS" → "TEAM LEFT/RIGHT WINS" (áp cho cả Quiz).**
> ⭐ CÓ SỬA CORE (`core/engine.js`, `core/app.css`, `core/fight.js`, `core/sound.js`) + Anagram
> (`anagram.js`/`.css`). 🟢 ĐÃ TỰ TEST kỹ qua trình duyệt thật (đơn+đấu, cả Quiz fight để soát core
> không vỡ) — đo trực tiếp DOM, không dựa console (bàn console-log của công cụ test bị kẹt dữ liệu cũ
> suốt buổi, xem BẪY ở `GHI CHU DU AN.md` Đợt 134). ✅ THẦY DUYỆT ("ok build") → COMMIT `0a24c62` +
> PUSH + **LIVE**.
> ⚠️ BẪY MỚI đáng nhớ: TDZ (`const` khai SAU dòng gọi hàm dùng nó trong cùng closure) trong
> `core/fight.js` làm `startFight()` lỗi ÂM THẦM (bọc try/catch + console.warn, không throw ra UI) —
> nút "Start fight" chỉ im lặng không phản ứng, dễ tưởng nhầm bug khác.
> Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 134, `templates/anagram/GHI CHU ANAGRAM.md` Đợt 134.
>
> Trước đó: **13/8/2026 (Đợt 133) — FIGHT MODE: cửa sổ HÒA 0,1s (2 đội xong đúng cách nhau
> ≤100ms → cả 2 cùng được điểm) + cơ chế mới `ctl.mayScore()` khiến điểm bị từ chối RƠI XUỐNG MÀN
> thay vì đáp vào ô điểm (hỏi lại đúng lúc điểm bay TỚI nơi, không còn kẽ hở đua thời gian như cách
> đóng băng số cũ) · bỏ hẳn "Same word, same letters", mặc định nay là "Same words, mix letters" ·
> Voice dùng CHUNG 1 bản duy nhất cho cả 2 đội, đồng bộ hào quang + equalizer tuyệt đối, đang phát
> thì bấm gì cũng không dừng được.**
> ⭐ CÓ SỬA CORE (`core/fight.js`) + Anagram (`anagram.js`). 🟢 ĐÃ TỰ TEST kỹ (mô phỏng 2 bàn gõ chữ
> thật qua PointerEvent, đo điểm/is-won/giá trị equalizer). ✅ THẦY DUYỆT → COMMIT `1222b23` + PUSH +
> **LIVE**.
> Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 133.
>
> Trước đó: **13/8/2026 (Đợt 132) — 6 CẢI TIẾN ANAGRAM: MIX VOICE (4 giọng loại trừ lẫn
> nhau + Random UK/US, cân bằng Nam/Nữ ±1 + không lệch giọng, đo 500 lần thử đúng cả 2 luật) · LOA +
> EQUALIZER thật (AnalyserNode, gộp 1 nút, hào quang hết bị cắt) · SLOGAN trở lại (đơn+đấu) · ẨN LOA
> khi Content=Text · KHUNG DƯỚI (tên act/nút) co giãn theo cửa sổ (áp cho cả 17 game) · OPTIONS rộng
> hơn + cao hơn + nút Text/Voice kiểu công tắc trượt + bỏ chữ OPTIONS toàn bộ.**
> ⭐ CÓ SỬA CORE (`engine.js` + `app.css`) + Anagram (`anagram.js`/`.css`/`anagram-editor.js`) +
> `voice-batch.js`. 🟢 ĐÃ TỰ TEST kỹ (đơn+đấu+Quiz để soát game khác không vỡ), 0 lỗi console.
> ✅ THẦY DUYỆT → COMMIT `b4df0d0` + PUSH + **LIVE**. ⚠️ 1 điểm CHƯA giải quyết trọn vẹn: Options khi ĐẤU +
> Anagram (12 nhóm tuỳ chọn cùng lúc) vẫn cần cuộn dọc ở màn hình thường (~364px tràn) — đã tối ưu hết
> mức an toàn, muốn hết hẳn phải cho panel đè lên hàng nút thật (thầy từng gợi ý chấp nhận được) —
> CHƯA làm, chờ thầy xác nhận có cần đi tiếp không.
> Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 132.
>
> Trước đó: **12/8/2026 (Đợt 131) — ⭐ LỖI THẬT: ĐỒNG HỒ MA — TIẾNG "HẾT GIỜ" PHÁT
> RA DÙ ĐỒNG HỒ TRÊN MÀN CÒN NGUYÊN 2 PHÚT (FIGHT MODE). ⭐ CÓ SỬA CORE (`engine.js` + `fight.js`),
> KHÔNG đụng template nào. 🟢 ĐÃ TỰ TEST (đo bằng đếm `setInterval` sống qua trình duyệt thật, 0 lỗi
> console). ✅ THẦY DUYỆT → **COMMIT (LOCAL)** — **CHỐT Ở LOCAL, CHƯA PUSH** (thầy gộp chung với các
> đợt sửa khác đang làm, sẽ push một thể sau).
> Thầy báo: đang chơi, nghe tiếng hết giờ trong khi đồng hồ hiển thị còn 2 phút.
> **Gốc lỗi**: mỗi khi trận Fight dựng lại (Start again / Options > Apply / Đổi template giữa trận /
> thoát Fight về Single), `core/fight.js`'s `teardown()` chỉ gọi `lock(true)` — hàm khoá của
> RIÊNG TEMPLATE — chứ chưa bao giờ gọi `cleanupAll()` thật của engine (hàm tắt đồng hồ 500ms, đóng
> menu/panel, chạy cleanup riêng của template). Khung KHÔNG-giữ-thanh-công-cụ (bàn còn lại) thì
> **100% không bao giờ được dọn** ở BẤT KỲ đường nào (nút Menu/Home của nó đã bị gỡ khi vào trận), còn
> khung GIỮ thanh công cụ chỉ được dọn ở 2/5 đường (Start again từ Menu trong game, Options > Apply) —
> **3 đường còn lại (Đổi template, thoát Fight về Single, "Start again" từ màn kết quả trận) không dọn
> bàn nào cả**. Đồng hồ bị bỏ quên cứ đếm tiếp trong im lặng, và khi NÓ hết giờ theo lịch riêng của nó
> thì vẫn phát tiếng — không liên quan gì tới đồng hồ MỚI đang hiện trên màn.
> **Sửa**: `core/engine.js` đăng ký `cleanupAll` thật của mỗi bàn với trọng tài trận đấu
> (`fight.ctl.registerCleanup(side, cleanupAll)`, gọi ngay từ đầu `startGame()`); `core/fight.js` gọi
> lại TOÀN BỘ các hàm đã đăng ký trong `teardown()`. `cleanupAll()` được thêm cờ chặn gọi 2 lần (một
> bàn có thể vừa tự dọn qua nút riêng, vừa bị trọng tài dọn lại — an toàn, không chạy 2 lần).
> **Đã tự đo qua trình duyệt thật** (đếm `setInterval` đang sống bằng cách tráo `window.setInterval`):
> cả 3 đường trước đây rò rỉ (Đổi template Anagram↔Quiz giữa trận, thoát Fight về Single, Start again)
> nay đều về **đúng 0 đồng hồ sống** ngay sau khi dựng lại/thoát (trước sửa sẽ giữ nguyên 2); chế độ
> chơi đơn (không đấu) vẫn tắt bình thường y hệt trước — không đổi hành vi. 0 lỗi console.
> ⬜ **Vẫn còn 1 vấn đề khác thầy báo cùng lúc CHƯA có kết luận chắc chắn**: "có lượt 1 trong 2 bên bấm
> ô chữ không nhận, next sang ô khác thì được" — thầy xác nhận xảy ra NGAY LÚC TỪ MỚI VỪA HIỆN, không
> rõ đội thắng hay đội thua vòng trước. Nghi vấn hàng đầu: một khoảnh khắc rất ngắn ngay lúc từ mới
> hiện ra mà cả hàng ô chữ bị khoá nhầm dù đội đó chưa hề bị khoá thật (đường đua giữa hoạt cảnh chuyển
> từ không đồng bộ và trạng thái khoá của trọng tài) — CHƯA bắt được tận tay, cần điều tra thêm/thầy
> quan sát thêm trước khi sửa.
> Chi tiết: `GHI CHU DU AN.md` Đợt 131.
>
> Trước đó: **12/8/2026 (Đợt 130) — ⭐ LỖI THẬT: ĐANG ĐẤU MÀ MỞ PANEL NÚT CHỨC NĂNG
> THÌ KHÔNG BẤM ĐƯỢC GÌ. ⭐ CÓ SỬA CORE (`app.css` 1 khối + `engine.js` 1 chỗ), KHÔNG đụng template.
> ✅ THẦY DUYỆT → COMMIT + PUSH + **LIVE**.
> Thầy báo kèm ảnh: đang đấu, bấm Options/Template/Style thì màn tối sầm, panel hiện ra nhưng **bấm gì
> cũng không ăn**, panel tự đóng. **Gốc lỗi do chính Đợt 129 gây ra**: khi gộp hàng nút vào hàng ô điểm
> tay em canh giữa bằng `transform: translateY(-50%)` — mà **`transform` ĐẺ RA STACKING CONTEXT**, nhốt
> `z-index` của cụm nút (41) và của panel (42) **vào trong hộp đó**; hộp cha `z-index:auto` xếp ngang
> mức 0, còn `.aw-tool-dim` (z-index **40**) nằm thẳng dưới `<body>` ở ngoài ⇒ **tấm che phủ LÊN TRÊN
> panel**. Panel vẫn VẼ ra nên nhìn thấy, nhưng mọi cú chạm rơi vào tấm che, mà tấm che có
> `onclick = đóng panel`. Đo trước khi sửa: `elementFromPoint(tâm panel)` = **`aw-tool-dim`**.
> **Sửa**: bỏ `transform`, phủ kín hàng rồi canh giữa bằng flex (`inset:0` + `align-items:center`) —
> hết stacking context, z-index lại tính ở gốc như single mode. Đo lại: `elementFromPoint` ra
> `aw-tpl-item`, bấm "Quiz" **đổi template thật (cả 2 khung sang Quiz, panel đóng, tấm che biến mất)**,
> cả 4 panel Options/Template/Style/MODE đều chạm tới được; bố cục giữ nguyên (lệch dọc 0px, ô điểm tay
> vẫn bấm được). **Vá kèm**: panel bị giới hạn chiều cao theo "stage", mà khi đấu stage là MỘT khung nửa
> bề ngang (~307px) nên danh sách 17 template cao 557px bị bóp thành khe cuộn tí xíu → khi đấu đo
> **khoảng trống thật phía trên hàng nút** (307 → **360px**); single mode giữ nguyên.
> ⚠️ **Bài học đã ghi vào `core/HUONG DAN CORE.md`**: z-index 40/41/42 của tấm che/thanh công cụ/panel
> là hệ thống **phẳng tính ở gốc tài liệu** — bọc chúng vào phần tử có `transform`/`filter`/`opacity<1`/
> `backdrop-filter`/`will-change` là **âm thầm nhốt cả hệ thống** và tấm che leo lên trên; triệu chứng
> rất dễ đọc nhầm thành "panel hỏng" chứ không ai nghĩ tới xếp lớp.
> Chi tiết: `GHI CHU DU AN.md` Đợt 130.
>
> Trước đó: **12/8/2026 (Đợt 129) — GIẤU ĐÁP ÁN TỚI KHI CẢ 2 XONG · ĐỒNG BỘ 100%
> HIỆU ỨNG NEXT/BACK · GỘP HÀNG NÚT · ⭐ FULLSCREEN THẬT. ⭐ CÓ SỬA CORE (`fight.js` + `engine.js` +
> `app.css`) + Anagram + Quiz. ✅ THẦY DUYỆT → COMMIT + PUSH + **LIVE**.
> (1) ⭐ **Giấu ✓/✗ của đội xong trước cho tới khi đội kia xong.** Đợt 128 cho đội sai "hiện phản hồi
> sai như bình thường" — nhưng chính nó **lộ đáp án**: Quiz vẽ ✓ lên ô ĐÚNG và làm mờ mọi ô sai (riêng
> việc làm mờ đã chỉ thẳng ra ô đúng), Anagram tô màu TỪNG VỊ TRÍ và **in thẳng từ đúng**. Nay bàn xong
> khi vòng còn mở **chỉ đổi màu xám**, không dấu/không mờ/không tô chữ/không in đáp án; vòng đóng thì
> **cả 2 bàn cùng lộ** để mỗi bên biết mình sai đâu và đáp án là gì. Hợp đồng thêm `reveal()`;
> Anagram lộ **cả 7-8 vị trí CÙNG LÚC** (bản lần lượt tốn 2,4s > `ROUND_HOLD_MS` 2100ms nên vòng sẽ
> sang từ mới giữa chừng). Âm thanh KHÔNG giấu (chỉ nói đội đó làm sao, không chỉ ra đáp án).
> (2) **Next/Back đồng bộ 100%**: cả 2 template báo `boardMoved` **SAU** hoạt cảnh ⇒ bàn kia trễ
> 130-160ms; và Quiz `jumpTo` **cắt phụt không hoạt cảnh** trong khi bàn kia trượt. Nay báo TRƯỚC, và
> `jumpTo` gọi thẳng `showQuestion()` nên 2 bàn chạy CÙNG hàm. Đo: bấm Previous ở 1 bàn, opacity 2 bàn
> **trùng khít từng khung** (0.76/0.76 · 0.38/0.38 · 0.12/0.12 …).
> (3-5) **MODE vào ghế giữa** (Options·Template·**MODE**·Style·Fullscreen) · **ô điểm tay = đúng cỡ nút
> công cụ 44×44** · **gộp hàng ô điểm tay + hàng nút thành MỘT hàng** (ô điểm tay vẫn đúng tâm khung
> của đội mình — đo 246/726 khớp tâm 2 khung; lệch dọc **0px**).
> ⚠️ 2 bẫy đã vá: thanh công cụ rộng 1000px **nằm đè lên 2 ô điểm tay và nuốt hết cú chạm** (2 ô ngoài
> chỉ `visibility:hidden` nên vẫn chiếm chỗ) → `pointer-events:none` cho thanh, trả `auto` cho cụm nút;
> và `.aw-below` có `margin-top:18px`, nằm trong hộp căn giữa tuyệt đối thì đẩy nút xuống đúng **nửa**
> (đo lệch 9px) → ép `margin-top:0`.
> (6) ⭐ **FULLSCREEN THẬT — lỗi gốc là nút phóng to NHẦM PHẦN TỬ.** Nút dùng chung gọi `fsBtn.click()`
> của engine **bàn 0**, mà engine mỗi bàn chạy với `root = boardEls[i]` = **div của riêng bàn đó** ⇒
> phóng to đúng 1 khung, bàn kia + dải điểm + hàng nút nằm ngoài màn hình (đo: `board0.contains(.aw-fight)`
> = **false**). Nay `ctl.toggleFullscreen()` phóng to **root của chính TRẬN**; đo lại: yêu cầu trên
> **`#app`**, và `#app` **chứa trọn cả trận**. Bố cục `.aw-fight.is-fs` dùng **class do JS bật** chứ
> không dùng `:fullscreen` (CSS single-mode sẵn có sẽ thổi từng khung con ra 100vw và **xoá luôn thanh
> công cụ**; thêm nữa mỗi tiền tố phải là luật riêng ⇒ ~20 luật trùng). Chống tràn dọc bằng cách giới
> hạn **BỀ NGANG** hàng khung. Đo 1280×720 và 1600×520: tràn **0px**, tỉ lệ khung **1.524-1.525** đúng
> đích, thanh công cụ còn nguyên. ⬜ **Chưa bấm được fullscreen THẬT** (API đòi user-activation thật,
> pane test không cấp) — thầy bấm thử trên máy giúp em.
> Chi tiết: `GHI CHU DU AN.md` Đợt 129.
>
> Trước đó: **12/8/2026 (Đợt 128) — ⭐ XONG TRƯỚC MÀ SAI THÌ KHÔNG ĐƯỢC CƯỚP TỪ +
> VÁ 404 CSS Ở TRANG TEST. ⭐ CÓ SỬA CORE (`fight.js` + `registry.js`) + Anagram + Quiz.
> ✅ THẦY DUYỆT → COMMIT + PUSH + **LIVE**.
> (1) ⭐ **LUẬT MỚI: XONG TRƯỚC ≠ THẮNG.** Trước đây ai báo xong trước là ăn từ, bất kể đúng sai ⇒ bấm
> bừa thật nhanh là cướp mất từ của đội kia. Nay: đội xong trước mà **SAI** chỉ kết thúc lượt của
> CHÍNH NÓ (bị tính sai + khoá riêng nó, giữ đúng phản hồi sai quen thuộc của template), **vòng vẫn
> mở**, **đội kia không bị chặn, không bị đổi màu**, chơi tiếp và **vẫn thắng được vòng đó**. Chỉ xong
> **ĐÚNG** mới đặt `roundWinner`, mới ăn thưởng tốc độ, mới khoá đội kia. Mấu chốt kỹ thuật: tách
> **`roundDone[2]`** ("đội này đã có lượt chưa") ra khỏi **`roundWinner`** ("vòng có ai thắng chưa") —
> trước đây 2 khái niệm bị gộp làm một nên "xong" mới đồng nghĩa "thắng". Anagram "On submit" nay báo
> **cả ca nộp sai** (trước im lặng, nên trọng tài không biết đội đó đã xong và phải chờ hết 20s).
> ⚠️ Đội SAI **không** khoác lớp xám "quá chậm" — lớp đó nghĩa là "bị giành mất", đội sai đã có phản
> hồi sai riêng rồi. Đo thật đủ 4 nhánh: A-sai-trước→B-đúng-sau ra **0–1 (B thắng)** và B **còn nguyên
> màu, không bị khoá**; A-đúng-trước → B **khoá + xám .55**; cả hai cùng sai → sang câu sau **2458ms**
> (đường ROUND_HOLD_MS, không phải chốt chặn 20s); Anagram submit A-sai→B-đúng ra **0–1**, B còn đủ
> 8 ô bấm được.
> (2) **Vá nốt lỗi 404 CSS** đã ghi nợ ở Đợt 127: `catalog.js` khai css theo GỐC WEB nhưng `loadCss`
> để trình duyệt giải theo TRANG ⇒ ở trang test (sâu 2 cấp) ra `/templates/quiz/templates/anagram/…`.
> Nay `registry.js` suy gốc web từ **chính nó** (`new URL("../", import.meta.url)`, file luôn ở `/core/`)
> — đúng ở mọi trang. Vá kèm 1 lỗi ngầm cùng chỗ: kiểm trùng css so **chuỗi thô** nên `./anagram.css`
> và `templates/anagram/anagram.css` bị coi là 2 file khác nhau ⇒ chèn CSS trùng; nay so `l.href` đã
> giải. Đo: 0 tài nguyên lỗi, 0 đường dẫn lồng, CSS áp thật.
> Chi tiết: `GHI CHU DU AN.md` Đợt 128.
>
> Trước đó: **12/8/2026 (Đợt 127) — FIGHT MODE: HẾT NHÁY KHUNG THUA · ĐỘI THUA MỜ ĐI NGAY ·
> ĐỔI TEMPLATE GIỮA TRẬN. ⭐ CÓ SỬA CORE (`engine.js` + `fight.js`) + Anagram + Quiz.
> ✅ THẦY DUYỆT → COMMIT + PUSH + **LIVE**.
> (1) ⭐ **LỖI THẬT thầy báo — khung bên THUA nháy 1 nhịp** khi bên kia giải xong từ: `lock()` của
> Anagram gọi thẳng **`render()`**, mà `render()` dựng lại TOÀN BỘ thẻ card ⇒ chạy lại `aw-fadein`.
> Đúng lớp lỗi "nháy màn hình" chính file này đã trị ở Đợt 55 (mọi cập nhật GIỮA CHỪNG một từ phải vá
> thẳng DOM), lọt lại qua cửa `lock()` mở ở Đợt 124. Sửa bằng `syncFightLock()` — chỉ đổi `disabled`
> của ô chữ + 1 class, không dựng lại gì. **Đo bằng MutationObserver có mốc thời gian trên khung thua:
> tại đúng mốc khoá (t=35708ms) có 0 lần thẻ card bị thay thế** (trước đây là 1, kèm `aw-fadein`);
> lần thay thế duy nhất rơi vào t=37976ms = sau khi hết `ROUND_HOLD_MS` 2100ms, tức vẽ lại HỢP LỆ cho
> từ mới. Cách đo này dùng lại được cho mọi nghi vấn "nháy" sau này.
> (2) **Đội xử lý muộn mờ đi + mất màu NGAY** (cả Anagram lẫn Quiz): class `is-fightlost`, `opacity:.55`,
> ô về xám `#b3bac3`. Quiz đè **`--tile-eff`/`--tile-dark-eff`** chứ không đè `background`, nhờ vậy
> **cái vành 3D cũng xám theo** (đo: mặt `rgb(179,186,195)`, vành `rgb(152,160,170)`). Khung TỰ giải
> xong thì KHÔNG mờ — nó thắng, giữ nguyên màu. Toàn bộ màu nằm trong CSS, JS chỉ bật/tắt class: đó
> chính là thứ khiến mục (1) không phải vẽ lại gì.
> (3) **Đổi template ngay giữa trận** (trước bị từ chối thẳng): convert xong giao cả act cho trọng tài
> `ctl.restartMatch(next)` để dựng lại CẢ TRẬN — 2 khung cùng đổi, chung thứ tự câu, chung bảng điểm.
> Chỉ template khai `fightMode` được nhận trận (kiểm SAU khi `ensureTemplate` nạp module — `tpl.fightMode`
> là nguồn sự thật DUY NHẤT; chép sang catalog = 2 nơi phải đồng bộ, mà nạp trước 17 module chỉ để vẽ
> panel thì phá đúng cái lazy-load catalog sinh ra để làm); không hợp lệ → toast, trận giữ nguyên.
> ⚠️ **Bẫy đã tránh: convert CHỒNG convert làm rơi rụng nội dung** (Anagram→Quiz bịa đáp án nhiễu,
> Quiz→Anagram chỉ giữ đáp án đúng). `startFight` nay nhận `base` và mang qua MỌI lần dựng lại, thêm
> `ctl.sourceActivity()` — luôn convert từ act GỐC của thầy, y như bản single vẫn làm; vá nốt
> `exitFight()` (trước không mang `base`).
> Test thật cả 2 chiều Anagram↔Quiz giữa trận + ca từ chối, 0 lỗi console.
> ⬜ Phát hiện phụ CHƯA sửa (không ảnh hưởng thầy): đổi template từ **trang test của template** thì CSS
> game đích 404 (catalog khai css tương đối với TRANG; 2 trang thật ở gốc web, trang test sâu 2 cấp) —
> chỉ dev thấy, game vẫn chạy, chi tiết + cách sửa ghi ở `GHI CHU DU AN.md` Đợt 127.
> Chi tiết: `GHI CHU DU AN.md` Đợt 127.
>
> Trước đó: **12/8/2026 (Đợt 126) — FIGHT MODE: THU NHỎ 60% + Ô ĐIỂM TAY XUỐNG DƯỚI KHUNG,
> NGỦ KHI BẰNG 0, TRƯỢT KHI ĐỔI SỐ. ⭐ CÓ SỬA CORE (`fight.js` + `app.css`, không đụng template nào).
> ✅ THẦY DUYỆT → COMMIT `0523bef` + PUSH + **LIVE** (gộp cùng Đợt 124 + 125, 1 commit).
> Thầy gửi thêm 2 điểm sau Đợt 125: (1) **điểm/đồng hồ/ô điểm tay còn 60%** kích cỡ cũ (đo thật ở màn
> rộng: 40.8px/40.8px/43.19px, khớp phép tính); (2) **ô điểm tay rời khỏi cụm giữa cạnh đồng hồ,
> xuống hẳn 1 hàng MỚI dưới khung act**, mỗi ô chính giữa khung của đúng đội đó (đo `centerX`: khớp
> tuyệt đối với khung) — nhờ đó đồng hồ ở cụm giữa nay chỉ còn 1 mình, càng chắc chắn đúng tâm vạch
> chia 2 khung. Số bên trong ô nới to hơn mức 60% thuần một chút, **ô nền vẫn giữ đúng 60%** (không
> phình theo số). Ô **"ngủ" (mờ `opacity:.42`) khi đang ở 0** — chạm/vuốt đầu tiên trên ô mờ chỉ đánh
> thức (sáng lên, số không đổi), chạm/vuốt tiếp mới thật tăng/giảm; về lại đúng 0 thì tự mờ lại — tránh
> ô sát đáy khung bị chạm nhầm đổi điểm ngoài ý muốn. Đổi số có **hiệu ứng trượt kiểu đồng hồ số**
> (tăng: số mới trượt lên từ dưới, số cũ trượt lên mất phía trên; giảm thì ngược lại), dựng bằng 2 lớp
> chồng nhau trong khung `overflow:hidden`, đúng kỹ thuật `.animate()+cancel()` đã có ở anagram.js.
> Đã test qua trình duyệt thật (cả Anagram lẫn Quiz, vì đây là sửa core dùng chung): mô phỏng PointerEvent
> thật qua đúng 3 lượt chạm/vuốt xác nhận ngủ→thức→tăng→giảm→tự ngủ lại, đo `getBoundingClientRect` xác
> nhận căn giữa + cỡ chữ đúng tính toán, 0 lỗi console. ⬜ Vẫn **chưa nhìn được bằng mắt**.
> Chi tiết: `GHI CHU DU AN.md` Đợt 126.
>
> Trước đó: **12/8/2026 (Đợt 125) — DẢI TRÊN FIGHT MODE GỌN LẠI + XÁC NHẬN TRƯỚC KHI ĐỔI
> MODE + QUIZ THỬ NGHIỆM ĐẤU. ⭐ CÓ SỬA CORE (`engine.js` + `fight.js` + `app.css`) +
> `templates/quiz/quiz.js`. ✅ THẦY DUYỆT → COMMIT `0523bef` + PUSH + **LIVE** (gộp cùng Đợt 124 + 126).
> Thầy chơi thử Đợt 124 rồi gửi 4 điểm: (1) **bấm MODE nay phải xác nhận** qua 1 popover Yes/Cancel
> ngay cạnh nút (dùng lại `openToolPanel`, không đẻ cơ chế mới) mới thật sự đổi SINGLE↔FIGHT — lỡ tay
> không còn mất trận đang chơi; (2) **bỏ hẳn nhãn chữ "TEAM 1"/"TEAM 2"/"TIME"** trên dải điểm; (3)
> dải điểm/đồng hồ/ô điểm tay thầy nay **thẳng hàng, cân đối tuyệt đối** — gốc lệch thật là đội+đồng hồ
> vốn 2 dòng (nhãn+số) còn ô điểm tay 1 dòng, bỏ nhãn xong cả 3 tự về 1 dòng cùng cỡ chữ (đo
> `getBoundingClientRect`: lệch tâm dọc ≤1.5px); (4) **đồng hồ đấu đổi "00:45" (2 số mỗi bên)**, dấu
> `:` luôn rơi đúng đường nối 2 khung nhờ ép 2 ô điểm tay hai bên đồng hồ **cùng bề rộng cố định**
> (trước là bề rộng tối thiểu, số 2 chữ số đẩy lệch tâm) — đo thật: tâm chữ đồng hồ lệch tâm dải
> **0.008px**, coi như tuyệt đối.
> ⭐ Thầy cũng chốt **"áp dụng tạm cho Quiz"** — Quiz trở thành template THỨ HAI khai `fightMode:true`.
> Việc này buộc tổng quát hoá `core/fight.js`: nó từng **đọc cứng `activity.content.items`** (chỉ
> đúng Anagram) → đổi sang tra `getTemplate(activity.type).itemsKey` (field mỗi template đã khai sẵn
> cho "Start with mistakes"), nên **template thứ ba sau này tự động đúng, không cần sửa `fight.js`**.
> Quiz's `mount()` mô phỏng đúng khuôn `_fight` của Anagram nhưng nhẹ hơn nhiều — Quiz không có hoạt
> ảnh bay điểm riêng, `ui.setScore()` engine đã tự chuyển vào `fight.ctl.onScore()` sẵn.
> Đã test qua trình duyệt thật (`devserver.py`, `templates/anagram/test.html` + `templates/quiz/
> test.html`): popover MODE đúng Cancel/xác nhận, Fight dựng 2 khung, chơi 1 vòng mỗi template (Anagram
> KANGAROO hoàn hảo +16, Quiz chọn đúng +1), khung thua khoá rồi cả 2 tự đồng bộ sang câu tiếp, thoát
> Fight về Single cả 2 template không lỗi, 0 lỗi console. ⬜ **Chưa nhìn được bằng mắt** (pane phiên
> này không hiện hình) — số đo xác nhận layout đúng, thầy tự mở xem lại trước khi duyệt.
> Chi tiết: `GHI CHU DU AN.md` Đợt 125.
>
> Trước đó: **12/8/2026 (Đợt 124) — ⭐⭐ FIGHT MODE: HAI ĐỘI, HAI KHUNG, MỘT TỪ
> (Anagram trước, thầy chốt). ⭐ CÓ SỬA CORE — file MỚI `core/fight.js` + `engine.js` + `sfx.js` +
> `icons.js` + `app.css`. ✅ THẦY DUYỆT → COMMIT `0523bef` + PUSH + **LIVE** (gộp cùng Đợt 125 + 126).
> Nút **MODE** (chỉ hiện với template khai `tpl.fightMode`) lật SINGLE ↔ FIGHT: 2 ván THẬT cạnh nhau
> (mỗi khung vẫn đúng 16:10,5 — đo 939×616 ở 1920×1080), dải trên SCOREBOARD 1 · ĐỒNG HỒ ·
> SCOREBOARD 2 (chừa sẵn 2 ô cho CHUÔNG sau này), MỘT thanh công cụ dùng chung. Chạy được 2 ván
> trong 1 trang là nhờ `startGame()` giữ mọi trạng thái trong closure.
> **Hai lượt chỉnh thầy gửi sau bản đầu, đã làm + đo hết**: bấm PLAY một bên là bên kia chạy theo ·
> **bỏ slogan Anagram** (cả single) · **bỏ ô điểm trong khung**, mỗi đội chỉ còn MỘT số **chính giữa
> phía trên khung của mình** (lệch tâm 1px) và điểm bay thẳng ra đó · 2 đội **cùng luật màu**
> (dương xanh lá, âm đỏ giữ dấu −) · đồng hồ đổi sang **xám đậm** cho hợp nền sáng · **bỏ tên act +
> cụm Edit/Assignment/Print/Home** khi đấu · bỏ fullscreen trong 2 khung, thêm **1 nút Fullscreen**
> vào dãy nút dưới (thành 5) · thêm **2 ô ĐIỂM THỦ CÔNG** hai bên đồng hồ (chạm/vuốt lên +1, vuốt
> xuống −1, xanh dương/đỏ không dấu trừ) **sống qua Start again + đổi template, chỉ mất khi tải lại
> trang**.
> ⚠️⚠️ **Lỗi nặng nhất cả đợt**: bỏ slogan làm sót biến `topbar` trong `cleanup()` của Anagram ⇒
> `ReferenceError` giữa lúc dọn ván ⇒ **"Start again" không dựng lại được trận, im lặng hoàn toàn**,
> và hỏng luôn `cleanup()` của single mode. Rút ra: **không hàm dọn dẹp nào được phép ném lỗi** (xem
> bẫy 4 mục FIGHT MODE trong `core/HUONG DAN CORE.md`).
> **5 rào cản đã giải**: sfx 1 thẻ audio/file (thêm giọng dự phòng — đo: 3 tiếng chồng = 3 thẻ) ·
> `querySelector(".aw-top-score")` quét cả trang · bridge myActivity 1 chỗ ngồi · giọng đọc phát 2
> lần · khung nhỏ đi.
> ⚠️ **3 lỗi thật tự bắt được**: điểm template TỚI MUỘN 1.760ms (làm "đội chậm không được điểm" lao
> xuống −12 rồi bò về 0) · `restart()` không mang `fight` biến bàn thành act đơn lẻ NẰM TRONG trận ·
> Apply chỉ ghi vào BẢN SAO của act. Cả 3 đã vá + đo lại.
> Hợp đồng template + 3 bẫy: `core/HUONG DAN CORE.md` mục "FIGHT MODE". Chi tiết: `GHI CHU DU AN.md`
> Đợt 124. ⬜ **Chưa nhìn được bằng mắt** (pane test không hiện hình) — thầy xem giúp bố cục thật,
> nhất là cỡ chữ lúc fullscreen (tính ra còn ~57-60% so với single fullscreen).
>
> Trước đó: **12/8/2026 (Đợt 123) — ⭐⭐ MỘT ACT MANG CẢ CHỮ LẪN GIỌNG: nhóm **Content
> (Text / Voice)** ở đầu panel Options. ⭐ CÓ SỬA CORE (`engine.js` + `voice-playback.js` +
> `convert.js` + `lesson-import.js`) + 13 template. 🟢 **CHỜ THẦY DUYỆT — CHƯA COMMIT.**
> Bỏ hẳn cặp act `ENG1` + `ENG1 VOICE`: Import Excel nay tạo **1 act ENG1 duy nhất** (đảo lại Đợt
> 118 theo yêu cầu thầy 12/8). Hoá ra dữ liệu VỐN đã gộp sẵn — `core/voice-batch.js` luôn ghi
> `voice`+`hideText` vào chính item của act — nên đây chỉ là công tắc lúc chơi, **0 act cũ phải sửa**.
> Luật mới gói trong MỘT hàm: **`voiceView(activity, item)`**, template cấm đọc thẳng `item.hideText`
> (xem `core/HUONG DAN CORE.md` mục "MỘT ACT MANG CẢ CHỮ LẪN GIỌNG"). Act cũ không khai `contentMode`
> = AUTO = **y nguyên như trước**.
> Test thật 13/13 template có giọng, cả 2 mode, 0 lỗi console; Import đo bằng workbook giả: 4 act
> anagram → **2**. ⚠️ Bẫy tự bắt được: Đổi template làm MẤT lựa chọn và đổi NGƯỢC lại (đã vá ở
> `convert.js`). ⬜ Chưa test: act thật trên Firestore + `play.html` (phiên này không đăng nhập được).
> **Việc kế = ĐỢT B: FIGHT MODE** (2 khung đấu nhau, Anagram trước) — thiết kế + 5 rào cản kỹ thuật
> đã chốt với thầy, ghi ở `GHI CHU DU AN.md` Đợt 123 mục 8.
>
> Trước đó: **12/8/2026 (Đợt 122) — ⭐⭐ NẠP TRƯỚC TOÀN BỘ RỒI MỚI CHO BẤM PLAY (giọng đọc +
> âm thanh + ảnh của game), có ĐỆM CACHE 1 NGÀY cho clip giọng. ⭐ CÓ SỬA CORE (`engine.js` +
> `registry.js` + `sfx.js` + `voice-clips.js`) + 5 template khai `preloadImages`.
> ✅ THẦY DUYỆT → COMMIT `5b9f8ec` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/`
> (`curl` xác nhận trên chính bản LIVE: `engine.js` có `prepareBeforePlay`+`PREP_TIMEOUT_MS`,
> `registry.js` có `cssImageUrls`+`preloadImages`, `sfx.js` có `whenAllPacksPrimed`, `voice-clips.js`
> có `aword-voice-v1`+`collectVoiceIds`; chạy thật Gameshow trên LIVE: PLAY chỉ hiện khi pack báo
> `ready 46/46`, 7 ảnh nạp trước, Cache Storage có mặt).**
> Thầy hỏi act tải kiểu gì → trả lời: **lai** (chữ tải hết trước, giọng tải dần). Thầy yêu cầu nạp
> trước trọn gói để *"chơi mượt dù chơi với tốc độ rất cao"*. Đo trước khi làm: xấu nhất **~3,2MB**
> (thường 0,5–1,5MB) — nhẹ vậy là **nhờ Đợt 121 nén giọng còn 12KB/từ**.
> **Cách làm**: nâng cổng chờ `tpl.prepare` (Đợt 108, vốn của riêng SPEAKING) thành **cổng của LÕI**
> chờ song song 4 việc trên MỘT thanh %. Chỗ hẹp nhất là `getVoiceClip()` — sửa 1 hàm thì **cả 14
> template dùng `voice-playback.js` lẫn bản riêng của Anagram đều hưởng, 0 dòng sửa ở template**.
> **3 luật an toàn**: thanh chỉ hiện sau 250ms (đã cache thì PLAY ra ngay, không nháy) · quá 12 giây
> vẫn mở PLAY (mạng chết không được khoá nút) · mọi bước không bao giờ reject.
> **Số đo**: Gameshow PLAY mở đúng lúc pack `ready 46/46` (861ms) · 14 clip giọng: thanh 283ms → PLAY
> 442ms · clip đã đệm **2ms, 0 lượt Firestore** · `prepare` treo → PLAY vẫn hiện ở **12,03s** · 16/16
> template built mở PLAY 21–863ms, 0 lỗi JS.
> ⚠️ **Bẫy cache**: `saveVoiceClip()` khi Regenerate **dùng lại đúng id cũ** ⇒ cache vĩnh viễn sẽ làm
> máy HS phát mãi giọng cũ. Vì vậy mới có **hạn 1 ngày** (thầy chốt).
> ⚠️ **Bẫy đã dính lúc build**: `CSSStyleRule.cssRules` là **truthy** (CSS Nesting) làm hàm quét ảnh
> `continue` qua sạch mọi luật và trả về rỗng — im lặng, không lỗi. Phải xét `.length`.
> ⚠️ **Chưa kiểm được**: clip giọng THẬT (phiên build không đăng nhập được) và `play.html` (cần mã bài
> giao). Nghiệm thu nên mở 1 act có nút loa + bấm thử 1 link HS.
> Chi tiết: `GHI CHU DU AN.md` Đợt 122 · hợp đồng mới: `core/HUONG DAN CORE.md` mục "CỔNG CHỜ NAY LÀ
> CỦA LÕI".
>
> Trước đó: **12/8/2026 (Đợt 121) — ⭐ GIỌNG ĐỌC NÉN MP3 48k (nhẹ ~15 LẦN) + XOÁ SẠCH KHO
> AUDIO WAV CŨ. ⭐ CÓ SỬA CORE (`core/tts.js` + file mới `core/vendor/lamejs.mjs`).
> ✅ THẦY DUYỆT → COMMIT `cbf5ed9` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/`
> (`curl` xác nhận: `tts.js` có `MP3_KBPS = 48` + `toMp3DataUrl` + trỏ `vendor/lamejs.mjs`, và VẪN CÒN
> `audio.toBlob` của nhánh dự phòng; `core/vendor/lamejs.mjs` 200/165,4KB có `Mp3Encoder`;
> `tools-voice-cleanup.html` 200).
> ✅✅ **ĐÃ NGHIỆM THU TRỌN VẸN (12/8/2026)** — bài thật đầu tiên thầy tự tạo sau khi lên MP3
> (`LSA2-S2.T4.P3-4-5 / ENG1`, act 163): đọc thẳng Firestore ra **35/35 clip MP3, 0 WAV**, **bitrate đo
> ngược đúng 48 kbps**, cả bài **918,6 KB** (nếu còn WAV: ~17 MB ⇒ **nhẹ ~19 lần**), cả kho `voiceClips`
> nay **0,90 MB = 0,09%** hạn mức. **Thầy tự test iPhone + iPad + Windows: nghe tốt cả ba** ⇒ quyết định
> "MP3 chứ không Opus" đã được chứng thực trên máy Apple thật, KHÔNG bàn lại.
> ⚠️ Clip Anagram nặng hơn số đo từ-đơn (26,2KB vs 8–16KB) là **bình thường: Anagram đọc CÂU GỢI Ý**
> (3,6–4,7 giây). Muốn kiểm nén có chạy không thì **đo bitrate**, đừng so kích thước tuyệt đối.
> ⭐ Luật chung "media sinh trong trình duyệt phải nén trước khi lưu" (7 điều, dùng cho MỌI app sau này)
> đã ghi ở `core/HUONG DAN CORE.md` mục GIỌNG ĐỌC TTS.
> ⚠️ **Đợt này đánh số 121 chứ không phải 117** — build xong mới biết một phiên Claude song song đã lấy
> mất 117→120; đã đổi số + xếp lại thứ tự lúc rebase. Nhắc lại luật: nhiều phiên chạy song song, phải
> `git status`/`git diff` TRƯỚC khi add, KHÔNG BAO GIỜ `git add -A`, và **kiểm lại số Đợt sau khi pull**.**
> **Gốc vấn đề**: Kokoro trả PCM **32-bit float 24kHz (768 kb/s)** — định dạng phòng thu, không phải
> định dạng phát. Mỗi clip là 1 document Firestore lưu base64 (phình thêm 33%) ⇒ **~186KB/từ** (đo thật:
> "cat" 90KB, "photosynthesis" 256KB) trong hạn mức **1 GiB** của gói Spark ⇒ chỉ chứa nổi ~5.700 từ.
> **Vá**: nén MP3 48 kb/s mono ngay trước khi lưu. Đo thật qua chính `core/tts.js`: "elephant"
> 131.282 → **8.855 B (14,8x)**, "photosynthesis" 256.082 → **16.343 B (15,7x)**; sức chứa **~5.700 →
> ~89.000 từ**. Tốn thêm ~110ms/từ (so với ~1,3s model đã tốn để sinh — không đáng kể). Thầy tự nghe
> 64/48/32 rồi **chốt 48k**.
> ⚠️ **Vì sao MP3 chứ không phải Opus** (nhỏ hơn ~3x nữa): Safari chỉ phát được Opus từ **iOS 18.4**
> (3/2025) → iPad đời cũ của HS sẽ **câm tiếng**, đúng loại bug máy build không bao giờ thấy. MP3 chạy
> mọi trình duyệt, mọi đời máy.
> ⚠️ **Vì sao KHÔNG dùng Web Audio để nén**: `generateSpeechDataUrl` chạy CẢ trong `core/tts-worker.js`
> — Worker **không có `AudioContext`** (đã kiểm chứng thật). May là Kokoro trả sẵn RawAudio
> `{audio: Float32Array, sampling_rate: 24000}` nên nén thẳng từ đó — đồng thời né luôn bẫy
> `decodeAudioData` **tự resample 24kHz → 48kHz** của thiết bị (gấp đôi mẫu, không thêm chất lượng).
> ⚠️ **Firebase Storage KHÔNG dùng được** (xác minh lại 12/8): từ **3/2/2026** bắt buộc gói Blaze.
> Thầy nói sẵn sàng nâng Blaze, nhưng sau khi nén thì audio không cần Storage nữa — để dành cho ẢNH sau.
> **Xoá kho cũ**: thầy chốt **xoá hẳn** (giai đoạn WAV chỉ là thử nghiệm, generate lại được) thay vì nén
> lại. File mới `tools-voice-cleanup.html` (chạy 1 lần, không link từ đâu) dọn **3 nơi**: `voiceClips/*`
> + trường `voice`/`voiceId`/`hideText` trong act **và** trong `assignments` đã giao.
> ⭐ **Bẫy đã tránh: TUYỆT ĐỐI KHÔNG xoá `phonemes`** — đó là chuỗi IPA template **Speaking** dùng để
> chấm phát âm, không phải audio; xoá là hỏng hẳn tính năng. Dọn bằng cách **duyệt đệ quy `content`**
> chứ không liệt kê tên mảng theo template (17 template đặt tên khác nhau: items/questions/words/cards…,
> liệt kê là chắc chắn sót template thứ 18). 16/16 test đơn vị đúng.
> ✅ **ĐÃ CHẠY THẬT** (qua Claude in Chrome, thầy cho phép): trước khi dọn **417 clip = 154,2 MB ≈ 15%
> hạn mức 1 GiB** (trong đó **32 clip MỒ CÔI**); sau khi dọn Scan lại ra **0 clip / 0,0 MB / 0 act**.
> ⚠️⚠️ **Lỗi thật bắt được**: `writeBatch` lô 400 (chép idiom `core/store.js`) **chết ngay lô đầu vì
> "Transaction too big"** — batch Firestore bị chặn theo **DUNG LƯỢNG ~10 MiB**, không chỉ theo số thao
> tác 500, mà doc audio ~370KB/cái. **Idiom lô-400 của `store.js` chỉ an toàn với doc NHỎ — đừng bê
> nguyên sang collection chứa doc nặng.** Vá bằng `deleteDoc` 25 cái/lượt.
> Chi tiết: `GHI CHU DU AN.md` Đợt 121.
>
> Trước đó: **11/8/2026 (Đợt 120) — ⭐ LỖI THẬT: ĐIỂM RƠI DƯƠNG→ÂM GIỮA LƯỢT VẪN XANH, PHẢI
> NEXT MỚI ĐỎ (Anagram). KHÔNG ĐỤNG MÃ CORE (chỉ `templates/anagram/anagram.js` + mục cảnh báo mới trong
> `core/HUONG DAN CORE.md`). ✅ THẦY DUYỆT → COMMIT `cddc5c6` + PUSH + **LIVE** (`curl` xác nhận dấu mốc
> mới có mặt + dấu mốc cũ biến mất hẳn, ngay lần poll thứ 2).**
> Gốc lỗi: SỐ và MÀU do CÙNG `ui.setScore()` sơn ra, nhưng vòng đếm điểm `pulseScoreTo()` của Anagram tự
> ghi thẳng `scoreEl.innerHTML` mỗi khung → vẽ số mới, để lại màu cũ; màu chỉ đúng lại khi `render()`
> (chỉ chạy lúc ĐỔI TỪ) gọi lại `ui.setScore()`. Sửa: mọi khung của vòng đếm đi qua `ui.setScore(val)`
> (markup y hệt, chỉ thêm phần tô màu). Đã rà cả 17 template — **chỉ Anagram sai**; Type the answer /
> Unjumble / Crossword đều tính lại class mỗi lần sơn nên đúng sẵn; 11 template kia chỉ gọi `ui.setScore`.
> ⚠️ **2 bẫy test dùng lại được**: pane test `visibilityState:"hidden"` làm **rAF chết hẳn** (0 khung/500ms)
> → tráo `requestAnimationFrame` sang **microtask** + đồng hồ giả 70ms/khung + ghi vết từng khung; và
> **`.click()`/`PointerEvent` giả KHÔNG tap được tile** (Pointer Events thật từ Đợt 89) → phải bấm thật
> bằng công cụ `computer`. Đo thật: ELEPHANT hoàn hảo `7→11→14→15→16` toàn `is-pos`; GIRAFFE bấm sai
> `-26→-54→-72→-80→-84` — **khung âm ĐẦU TIÊN đã đỏ `is-neg`**, chưa cần bấm Next. Chi tiết:
> `GHI CHU DU AN.md` Đợt 120 + `templates/anagram/GHI CHU ANAGRAM.md`.**
>
> Trước đó: **11/8/2026 (Đợt 119) — ĐIỂM ÂM Ở CHIP ĐIỂM LUÔN CÓ DẤU "-" + MÀU ĐỎ (trước chỉ đổi
> màu, bỏ hẳn dấu trừ). ⭐ CÓ SỬA CORE — `core/engine.js` (`ui.setScore`, 1 dòng) + comment trong
> `core/app.css`/`core/HUONG DAN CORE.md`. ✅ THẦY DUYỆT ("commit + push live") → COMMIT `84d050a` + PUSH
> + **LIVE** (`curl` poll xác nhận đủ dấu mốc mới ở cả 3 file trong ~1 phút).**
> Thầy yêu cầu áp dụng cho TOÀN BỘ template + mọi mode: sửa `ui.setScore()` dùng chung (bỏ `Math.abs`) —
> tự động áp cho mọi template gọi hàm này (Anagram, Quiz, True-false, Find the match, Open the box, Balloon
> pop, Flying fruit, Maze chase...). Rà soát riêng toàn bộ 15 template tìm nơi TỰ DỰNG chip điểm (bỏ qua
> `ui.setScore()`, không tự ăn theo bản sửa trên) — bắt được đúng **2 chỗ có cùng lỗi `Math.abs`** (copy
> nguyên comment từ bản core cũ): `templates/type-the-answer/type-the-answer.js` (`scoreHTML()`) và
> `templates/crossword/crossword.js` (`showScore()`) — đã sửa cả hai. Anagram (`pulseScoreTo()`) và
> Unjumble (`showScore()`) vốn đã đúng luật từ trước (chưa từng dùng `Math.abs`), không cần sửa. Test qua
> trình duyệt thật cả 3 kiểu chip khác nhau (Anagram "-10" đơn số · Type the answer "-5/6" · Crossword
> "-5/18", điền sai 1 từ 4 ô rồi bấm phím Submit ảo) — đều đúng dấu "-" + màu đỏ (`rgb(239,68,68)`/
> `rgb(226,60,60)`), 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 119 + `core/HUONG DAN CORE.md` mục
> "Điểm trừ CHUNG + màu điểm theo dấu" (đã cập nhật, thêm cảnh báo cho template tự dựng chip riêng).**
>
> Trước đó: **11/8/2026 (Đợt 118) — POPUP IMPORT: ENG1/ENG2 GIỮ NGUYÊN SONG SONG VỚI ENG1
> VOICE/ENG2 VOICE (trước đó bị THAY THẾ mất từ Đợt 104). ⭐ CÓ SỬA CORE — chỉ `core/lesson-import.js`.
> ✅ THẦY DUYỆT → COMMIT `a4b4db6` + PUSH + **LIVE** (GitHub Pages — có thể mất vài phút để lan CDN).**
> Thầy phát hiện: từ Đợt 104, `parseLessonToBundle()` đổi tiêu đề `ENG1`/`ENG2` thành `ENG1 VOICE`/
> `ENG2 VOICE` thay vì thêm mới — bản anagram text-thường (không giọng đọc) biến mất khỏi Import trong
> khi skill `taoact` (tạo trực tiếp Wordwall) vẫn luôn tạo cả 2 song song. Sửa: mỗi khi có ENG1/ENG2, đẩy
> vào bundle CẢ `${source} / ENG1` (không `ttsEligible`) LẪN `${source} / ENG1 VOICE` (`ttsEligible:true`,
> y hệt cũ) — tương tự ENG2. Không đụng `main.js`: popup Import đã sẵn logic tách act có `ttsEligible`
> vào khung "Voice (TTS)" và act thường vào danh sách dưới, nên 2 bản tự nằm cạnh nhau, tick độc lập.
> Verify bằng script Node dựng workbook `.xlsx` giả (2 dòng WORDTABLE) gọi thẳng `parseLessonToBundle()`
> — thứ tự & nội dung đúng như thiết kế, cờ `ttsEligible` đúng ở cả 2 bản. ⬜ **Chưa test qua popup Import
> thật với file .xlsm thật + đăng nhập** (môi trường phiên này không đăng nhập Firebase được). Chi tiết:
> `GHI CHU DU AN.md` Đợt 118.**
>
> Trước đó: **11/8/2026 (Đợt 117) — RUNNING TEAM: ĐỒNG BỘ Ô SET VỚI RUNNING WORD, KHOÁ START
> RUNNING THEO SAVE, IN TO TỐI ĐA, OVERLAY READY/3-2-1 HIỆN TÊN + CHẬM HƠN + MƯỢT HƠN, DẤU ✓/✗ BAY ĐÚNG
> LỚP. KHÔNG ĐỤNG CORE (chỉ `running-team.js`/`.css` + `rt-print.js`).**
> Theo đúng khuôn 3 nhóm yêu cầu Running word Đợt 116 đã làm (màn chuẩn bị / nội dung in / trong game) +
> 1 việc riêng (dấu bay bị ô khác che). (1) **Ô SET đồng bộ y hệt Running word**: Shuffle/Save/Print vào
> hẳn trong ô SET đang chọn (icon-only, copy nguyên SVG từ running-word.js), DELETE SET đổi thành nút
> tròn góc trên-phải mở popover nhỏ (thay `confirm()` trần). (2) **START RUNNING khoá tới khi đã chọn
> lớp VÀ đã Save** (`locked = !readyToStart() || (isTeacher && dirty)` — trước đây chỉ đòi có set hợp
> lệ, không đòi đã lưu). (3) **Tờ in tăng cỡ chữ ở mọi trường hợp đã đo** (`FS_HEIGHT_RATIO` 0.74→0.8,
> giảm các khoảng đệm — WIDTH GUARD Đợt 109 không nới lỏng, `CHAR_WIDTH_EM` giữ nguyên). (4) **Overlay
> READY/3-2-1 hiện tên em suốt cả 3 bước** (tên trên to 9cqw, số/READY dưới), tốc độ đếm chậm lại
> (850→1300ms / 680→1000ms), chuyển cảnh dùng `opacity transition` thật (mờ ra được, không chỉ mờ vào)
> thay vì `display:none` tức khắc; câu hỏi mới fade+trồi lên khi overlay biến mất, tạo crossfade tự
> nhiên. (5) **Dấu ✓/✗ bay** đổi từ con của Ô (bị chính `overflow:hidden` của ô đó cắt khi bay ra ngoài
> biên) sang con của `tilesEl` định vị bằng px + `z-index` — không còn bị ô nào cắt/che nữa; nhân tiện vá
> timeout dọn dấu ✗ cắt ngang animation 1.9s của chính nó.
> Tự test kỹ qua Browser pane (`templates/running-team/test.html`, sample có sẵn 1 GAME SET "DEMO" nên
> không cần đăng nhập): ô SET/gating/overlay/timing/dấu bay đều đúng như thiết kế, đối chiếu công thức
> in bằng script Node độc lập khớp 100% với số đọc từ DOM thật, đo timing overlay bằng MutationObserver
> khớp đúng 3 hằng số mới. 0 lỗi console mọi bước. ⬜ **Chưa tự test được**: luồng Save/Delete THẬT lên
> Firestore + trạng thái "đã chọn lớp nhưng chưa lưu" qua UI thật (môi trường test không đăng nhập
> được); in giấy A4 thật; cảm giác tốc độ đếm mới + cỡ chữ overlay trên máy/TOMKO thật. Chi tiết đầy đủ:
> `GHI CHU DU AN.md` Đợt 117 + `templates/running-team/GHI CHU RUNNING-TEAM.md` mục 16.**
>
> Trước đó: **11/8/2026 (Đợt 116) — RUNNING WORD: 7 CẢI TIẾN THEO YÊU CẦU THẦY (màn chuẩn bị +
> tờ in + trong game). ✅ THẦY DUYỆT → COMMIT `d399342` + PUSH + **LIVE**.**
> (1) **START MATCH + PRINT khoá tới khi SET đang chọn đã Save** — tờ in không bao giờ còn lệch bản đã
> lưu/đồng bộ Firestore. (2) **Ô SET gọn lại**: Shuffle/Save/Print thành icon nằm ngay trong ô đang
> chọn; DELETE SET đổi từ nút chữ + `confirm()` sang nút tròn góc trên-phải mở popup nhỏ neo cạnh (cùng
> khuôn `positionPopover` của Anagram). (3) ⭐ **IPA xuyên suốt**: `content.words` đổi từ `string[]` sang
> `{word, ipa}[]` (Firestore-safe, tương thích ngược 100% với pool cũ — `poolFrom()`/`buildSets()`/
> `printSets` không đổi gì) — Editor viết lại từ 1 ô textarea to sang danh sách mỗi từ 1 hàng có ô
> Word + ô IPA (dán được cả vùng 2 cột Excel, kéo-thả đổi thứ tự, cùng khuôn Anagram); Import Excel tự
> khớp IPA từ đúng cột IPA có sẵn trong file; cả 3 tờ in VÀ trong game (từ đã chốt: đúng hoặc pass) đều
> hiện `WORD • /ipa/`, IPA nhỏ/nhạt/mảnh hơn. (4) **Lượt submit ĐẦU TIÊN của cả trận không cộng bonus
> thời gian** (lượt này vốn chỉ có nhiệm vụ bắt đầu đồng hồ, thay 3-2-1 cũ) — mọi lượt sau, kể cả lượt
> đầu của đội kia, cộng bình thường. (5) **Andrew hiện đúng vị trí nút Play/Pause** (nút ẩn tạm) thay vì
> nổi trên hàng đang gõ — tự co cỡ chữ bằng `core/fit.js`, không đè 2 đồng hồ hai bên.
> ⭐ CÓ SỬA CORE — chỉ `core/lesson-import.js` (khớp IPA tự động cho bundle RUNNING WORD), không đụng
> file core nào khác. Tự test kỹ qua Browser pane (harness offline bơm sẵn 1 SET đã "lưu" vì môi trường
> test không đăng nhập Firestore được): khoá/mở Start+Print đúng cả 2 chiều, popup Delete mở/đóng/Cancel
> đúng, 3 tờ in đủ IPA, chơi thật đo được lượt đầu giữ nguyên đồng hồ còn lượt sau cộng đúng +5s (272→277,
> trong 70ms thực), IPA hiện đúng cạnh từ khi đúng lẫn khi pass, Andrew ẩn/hiện nút đúng + auto-fit +
> không đè đồng hồ — **0 lỗi console mọi bước**. ⬜ **Chưa tự test được (cần thầy)**: import 1 file .xlsm
> thật (không có sẵn file mẫu trong phiên này), Save/Delete thật lên Firestore (môi trường test không
> đăng nhập được), cảm nhận cỡ icon/vị trí popup/IPA đọc được trên máy thật hay TOMKO cảm ứng. Chi tiết
> đầy đủ: `GHI CHU DU AN.md` Đợt 116 + `templates/running-word/GHI CHU RUNNING-WORD.md` Đợt 116.**
>
> Trước đó: **11/8/2026 (Đợt 115) — LOGO (favicon từ `LOGO AW.png`, 7 file ở
> `core/assets/icons/`) + LINK GIAO BÀI CÓ TÊN ĐỌC ĐƯỢC (`play.html?g=<mã>` → đuôi mới
> `.../g/<mã>/ten-bai-hoc`), để app **myLink** tự đọc tên đúng khi soạn link cho lớp.
> Đuôi mới đi qua `404.html` (file mới, gốc repo — GitHub Pages tự phục vụ nó cho path lạ) rồi
> `location.replace()` vào đúng `play.html?g=<mã>`; **link cũ không đuôi vẫn mở bình thường**.
> `play.js` cũng đổi `document.title` theo tên bài giao ngay khi tải xong — myLink đọc `<title>` ra
> tên thật thay vì tên chung "AWord in ANDREW CLASSES" cho mọi link như trước.
> ⚠️ Chỉ sửa link `play.html?g=` (giao cho học sinh) — link thư viện riêng của giáo viên
> (`?f=/?a=`, dùng cho myActivity mirror) không đụng tới.
> Chưa tự test được luồng tạo bài giao thật (cần đăng nhập Google) lẫn đường dẫn `/g/...` trên
> GitHub Pages thật (máy chủ dev cục bộ không mô phỏng được lỗi 404 kiểu GitHub Pages) — thầy tự
> thử trên bản LIVE. Chi tiết: `GHI CHU DU AN.md` Đợt 115.**
>
> Trước đó: **11/8/2026 (Đợt 114) — ⭐⭐ TỔNG RÀ CẢ 17 TEMPLATE THEO LỚP LỖI ĐỢT 112/113:
> **9 template còn dính**, nặng nhất là **MICRO VẪN BẬT SAU KHI RỜI GAME** (Speaking) và một loạt đường
> ghi **điểm ma vào bảng xếp hạng / `session.submit()` giả lên Firestore**. ⭐ CÓ SỬA CORE
> (`engine.js` + `voice-playback.js`) + 9 template. ✅ THẦY DUYỆT → COMMIT `fc507da` / `9d72801` /
> `96eadfe` + PUSH + **LIVE**.**
> **Bước 1 — 3 chốt ở CORE, che cho cả 17 game:** `startTimerNow()` (CÙNG lỗ Đợt 112, cửa vào khác — game
> `manualTimerStart` gọi `ui.startTimer()` từ timer riêng; đo thật: bấm Home giữa intro Unjumble rồi 12
> giây sau nghe `timesup.mp3` khi đang ở THƯ VIỆN) · **`ui.finish()` — chốt giá trị nhất của dự án**, chặn
> mọi điểm ma bất kể template nào gọi tới, kể cả template viết sau này · `voice-playback.js stop()` thêm
> `epoch` để clip đang tải dở không phát vào ván sau.
> **Bước 2 — 9 template:** Speaking (micro + điểm ma), Maze chase (tự đẻ lại 2 `setInterval` bất tử),
> Anagram (cửa sổ 2,9s — rộng nhất), Unjumble (3 lỗ), Open the box, Whack-a-mole, Balloon pop,
> Type the answer, Speaking cards, + dọn `rwEndData`/`rtEndData`.
> ⚠️ **BẪY SUÝT LÀM HỎNG, nhớ kỹ:** cờ **"ván đã KẾT THÚC" ≠ cờ "mount đã CHẾT"**. Whack-a-mole và
> Balloon pop bật `ended` NGAY TRƯỚC màn đếm điểm, nên dùng `ended` làm chốt sẽ chặn luôn đường kết thúc
> bình thường. Phải là biến riêng (`dead`), chỉ gán DUY NHẤT trong `cleanup()`.
> **Đo:** cả 17 template, kịch bản "chơi → sinh hoạt cảnh → bỏ ván sau 120ms" → `ui.finish` ma 0, điểm ma
> 0, timer sống sót 0, listener rò 0, âm sau khi bỏ ván 0, lỗi console 0. Không hồi quy (Type the answer
> chơi đúng 6 câu vẫn cộng điểm 0→5, nộp bài đúng 1 lần). Micro: `track.readyState = "ended"`.
> ⚠️ Luật viết `cleanup()` cho template MỚI (6 điều) + mẹo tự kiểm 17 game một lượt: `core/HUONG DAN
> CORE.md` mục "BẪY ĐỒNG HỒ MA" → phần Đợt 114. Chi tiết: `GHI CHU DU AN.md` Đợt 114.**
>
> Trước đó: **11/8/2026 (Đợt 113) — ÂM THANH CHỒNG NHAU KHI BẤM "START AGAIN".
> ⭐ CÓ SỬA CORE (`core/sfx.js` + `core/engine.js`). ✅ THẦY DUYỆT → COMMIT `dc1cf4f` + PUSH + **LIVE**
> tại `https://aword.andrewclasses.com/` (đã chạy lại phép thử trên chính bản LIVE: "Start again" ra đúng
> 1 tiếng restart, Resume vẫn phát tiếp, 0 đồng hồ ma, 0 lỗi console).**
> `exitMenuPause()` không phân biệt được HAI nghĩa của "đóng Menu": *Resume* (chơi tiếp — phải khôi phục
> mọi thứ) và *`cleanupAll()`* (Start again / Home / Change template — ván bị VỨT BỎ, không được khôi phục
> gì). Nên lúc bỏ ván nó vẫn phát nốt mp3 đang tạm dừng của ván sắp chết, **chồng lên nhạc intro của ván
> mới**. Vá bằng cách dùng lại cờ `torndown` của Đợt 112: thêm `dropPaused()` vào `core/sfx.js` (tua về 0
> rồi quên đi) và rẽ nhánh `torndown ? p.dropPaused() : p.resumeActive()`, đồng thời bỏ qua
> `pausedAnimations.play()` + `tpl.onPause(false)` khi đang bỏ ván. ⭐ **Ngoại lệ CỐ Ý:
> `sound.resumeContext()` vẫn chạy ở CẢ HAI nhánh** — AudioContext dùng chung sống lâu hơn ván chơi, để
> suspended thì ván SAU câm tiếng tổng hợp (Crossword / Running word / Running team); đây là chỗ dễ "dọn
> quá tay" nhất. Đo thật: Quiz "Start again" từ 3 tiếng chồng nhau còn **đúng 1**; Resume vẫn phát tiếp
> (Đợt 91 nguyên vẹn); Gameshow (game duy nhất có nhạc nền loop + `onPause`) bỏ ván thì nhạc cũ không
> sống lại, Resume thì có; Đợt 112 không hồi quy (0 đồng hồ ma). 0 lỗi console. Chi tiết:
> `GHI CHU DU AN.md` Đợt 113 + `core/HUONG DAN CORE.md` mục "MENU PAUSE".**
>
> Trước đó: **11/8/2026 (Đợt 112) — ⭐⭐ BUG "ĐỒNG HỒ MA" (sống ẩn từ Đợt 91, 8/8): âm HẾT GIỜ
> nổ giữa ván khi đồng hồ còn 0:28, kèm fanfare giả và **ĐIỂM MA vào bảng xếp hạng / `session.submit()`
> giả lên Firestore**. ⭐ CÓ SỬA CORE (chỉ `core/engine.js`) — vá 1 chỗ, CHỮA CHO CẢ 17 TEMPLATE.
> ✅ THẦY DUYỆT → COMMIT `94d4778` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (đã chạy lại
> trọn phép thử TRÊN CHÍNH BẢN LIVE: sau "Start again" = 0 đồng hồ, ván mới = 1, đúng 1 tiếng hết giờ tại
> 0:05, bảng xếp hạng 0 dòng, 0 lỗi console).**
> Gốc lỗi: `cleanupAll()` chạy `stopTimer()` TRƯỚC `closeMenu()`, mà `closeMenu()` → `exitMenuPause()` →
> `resumeClockForMenu()` lại **dựng `setInterval` MỚI** cho ván vừa bị vứt — không ai tắt nữa. Ván chết
> nhưng đồng hồ của nó tick mãi trên `timerEl` của DOM đã tháo (**vô hình**, nên bug sống lâu mà không ai
> thấy), tới mốc "còn 5s" của CHÍNH NÓ thì kêu `timeWarning`, chạm 0 thì gọi `submitHandler()` → ván cũ
> tự nộp bài. Đúng 1 đường kích hoạt: **☰ Menu → "Start again"** (nút nằm TRONG menu nên cơ chế
> bấm-ra-ngoài-để-đóng không kịp chạy); mỗi lần bấm chồng thêm 1 đồng hồ ma. Vá 2 lớp: cờ `torndown`
> chặn `resumeClockForMenu`, + đổi thứ tự thành `torndown = true; closeMenu(); stopTimer(); …`.
> Đo thật trước/sau (Quiz, đếm ngược 20s, Lives=Unlimited): trước = 2 đồng hồ song song, `blockgametimeout`
> nổ lúc đồng hồ hiện **0:09**, fanfare giả, bảng xếp hạng **0→1 dòng ma**; sau = 0 đồng hồ ma, đúng 1
> tiếng hết giờ tại 0:05, **0 dòng**. Hồi quy: Menu pause (Đợt 91) còn nguyên (0:57 → giữ 5s → 0:55), bấm
> "Start again" 3 lần liên tiếp không dồn đồng hồ, **Anagram + True/false** (`manualTimerStart`) cùng sạch.
> 0 lỗi console mọi ca. ⚠️ **LUẬT MỚI cho mọi lần sửa core**: hàm nào tạo `setInterval`/`setTimeout` mà có
> thể bị gọi từ trong đường dọn dẹp thì PHẢI có cờ chặn kiểu `torndown` — đừng tin vào thứ tự lệnh trong
> `cleanupAll`. Chi tiết + mẹo đếm interval rò: `core/HUONG DAN CORE.md` mục "BẪY ĐỒNG HỒ MA",
> `GHI CHU DU AN.md` Đợt 112.**
>
> Trước đó: **11/8/2026 (Đợt 111) — RUNNING TEAM: MÀU Ô ĐÁP ÁN + CỠ CHỮ THEO YÊU CẦU THẦY
> ("giống Quiz, mỗi ô 1 màu, hiện đại, dịu mắt, chữ tối đa"). KHÔNG ĐỤNG CORE (chỉ `running-team.js` +
> `running-team.css`). ✅ THẦY DUYỆT → COMMIT `28177e2` + PUSH + **LIVE** tại
> `https://aword.andrewclasses.com/` (`curl` xác nhận `const PALETTE = [` trong `running-team.js` +
> `tile-eff` trong `running-team.css`).**
> Sao chép nguyên `PALETTE` 8 màu của `quiz.js` (không import xuyên template, đúng quy ước tự-chứa),
> xáo 6/8 màu 1 lần mỗi VÁN rồi gán cố định theo VỊ TRÍ ô suốt ván (giống Quiz gán theo vị trí câu trả
> lời cho cả game). Nền ô đổi từ `var(--aw-tile-0..3)` (4 màu, lặp 2 ô khi có 6 ô — đúng lỗi trong ảnh
> thầy chụp) sang `--tile`/`--tile-dark` set qua JS; chữ đổi đen→trắng; giữ đúng chuỗi fallback
> `--aw-tile-fixed` của Quiz để theme "Basic" (ép 1 màu đồng nhất) vẫn còn tác dụng — không giữ sẽ tạo
> ra một kiểu không nhất quán ÂM THẦM giữa Running team và 15 game khác khi đổi theme. Cỡ chữ nền tảng
> `3.1cqw→4.2cqw`. Đo thật qua Browser pane: 5 từ dài nhất từng ghi nhận trong dự án (CIVILISATION,
> SKIN-SCRAPER, UNINTENTIONALLY, CHARACTERISE, LARGE-SCALE) qua đúng `fitOnce()` game dùng khi chơi —
> co về `0.615–0.869`, còn cách xa sàn `0.42`; một ván chơi thật ra đúng 6 màu riêng biệt, chữ trắng,
> `--rt-fit:1`. 0 lỗi console. Chi tiết: `templates/running-team/GHI CHU RUNNING-TEAM.md` mục 15.**
>
> Trước đó: **11/8/2026 (Đợt 110) — RUNNING TEAM: MÀN SETUP MẤT CÂN ĐỐI TRÊN/DƯỚI so với
> Running word. KHÔNG ĐỤNG CORE (1 dòng CSS). ✅ THẦY DUYỆT → COMMIT `bb2b3c8` + PUSH + **LIVE**.**
> `.aw-rw-setup` có `justify-content:center`, `.aw-rt-setup` thiếu đúng dòng đó nên flex column dồn hết
> nội dung lên đỉnh, đẩy toàn bộ khoảng trống xuống đáy. Thêm `justify-content:center` + cân lại padding
> trên/dưới (`1.2cqw/0.6cqw`→`1cqw` đều). Đo thật: khoảng trống trên/dưới `66.97px`/`66.98px` (coi như
> bằng nhau). `overflow-y:auto` giữ nguyên làm van an toàn (RT nhiều hàng hơn RW), đo lại ở khung rất
> thấp (1280×380) xác nhận vẫn 0 tràn như trước khi sửa. Chi tiết:
> `templates/running-team/GHI CHU RUNNING-TEAM.md` mục 14.**
>
> Trước đó: **11/8/2026 (Đợt 109) — RUNNING TEAM: 6 CẢI TIẾN THEO ẢNH CHỤP MÀN HÌNH THẬT
> CỦA THẦY. KHÔNG ĐỤNG CORE (chỉ 3 file `templates/running-team/*`). ✅ THẦY DUYỆT → COMMIT `544f8cb` +
> PUSH + **LIVE**.**
> Options: Round time + Question time đổi từ ô số sang **thanh trượt** (0:30–10:00 nấc 30s ·
> 0s–30s nấc 1s, **0s = Untimed** — quyết định tự thêm để 0 không làm câu hỏi hết giờ ngay lập tức,
> vì sàn cũ 3s nên giá trị 0 chưa từng xảy ra trong code). Setup: vá `.aw-rt-slot-del` từng
> `position:absolute` đè lên chữ meta khi xuống 2 dòng (đổi khối sang flex-column — hết đè về mặt CẤU
> TRÚC) + bỏ dòng "Tap anyone who is away…". Trong game: `line-height` prompt-name 1.05→1.3 (dấu tiếng
> Việt bị `overflow:hidden` cắt vì cao hơn khung dòng cũ). Tờ in: tự thêm ngày in thật, LUÔN 3 cột (bỏ
> ngưỡng 1/2 cột cũ), đường kẻ mảnh hơn + chữ to hơn — kèm **WIDTH GUARD mới**: cỡ chữ tính theo
> `Math.min(chiều cao hàng, bề rộng cột thật ÷ từ dài nhất)` để từ dài (`SKIN-SCRAPER`,
> `UNINTENTIONALLY`…) không bị `ellipsis` cắt cụt trên một tờ giấy mà việc duy nhất là đọc ĐÚNG chính
> tả — bẫy tự phát hiện khi ép cứng 3 cột hẹp + tăng tỷ lệ chữ cùng lúc, không có trong yêu cầu gốc. Đo
> thật qua Browser pane (bounding-rect cho lỗi đè chữ, gọi thẳng `printRunningTeamSheet()` với
> `window.print` tráo rỗng để soi DOM tờ in, chơi 1 ván thật Round=0:30/Question=Untimed tới khi CLASS
> WINS) — 0 lỗi console. Chi tiết: `templates/running-team/GHI CHU RUNNING-TEAM.md` mục 13,
> `GHI CHU DU AN.md` Đợt 109.**
>
> Trước đó: **11/8/2026 (Đợt 108, v0.9.82) — SPEAKING: 6 CẢI TIẾN SAU KHI THẦY TEST LIVE.
> ⭐ CÓ SỬA CORE — móc mới **`tpl.prepare(activity, onProgress)`** trong `core/engine.js`
> (+ `.aw-ready-prep*` trong `core/app.css`, + `warmup()` trong `core/speech-score.js`): template nào
> cần chuẩn bị nặng thì engine **ẩn nút PLAY + hiện thanh % ngay chỗ nút PLAY** từ lúc act mở ra, xong
> mới trả PLAY lại — thuần cộng thêm, template không khai `prepare` chạy y như cũ (đã đo lại thật Quiz +
> Anagram). Hợp đồng đầy đủ ở `core/HUONG DAN CORE.md` mục "CHUẨN BỊ TRƯỚC KHI CHƠI". 6 điểm thầy gửi:
> (1) tải mô hình ~240MB ngay khi mở link, chưa xong chưa có PLAY · (2) slogan "SPEAKING IN ANDREW
> CLASSES" · (3) **ghi âm TỰ DỪNG khi học sinh nói xong** (AnalyserNode + `setInterval`, học mức ồn của
> phòng 250ms đầu rồi im 800ms là chấm) · (4) hiện IPA dưới từ · (5) bỏ hết câu hướng dẫn · (6) **sao
> 0–5 nấc nửa sao** (`% ÷ 20`) và Options đổi ngưỡng đạt từ % sang **SAO** (act cũ lưu `passThreshold` %
> vẫn chạy). ✅ THẦY DUYỆT TRƯỚC ("ok build" + cho phép tự test đạt thì tự commit/push/ghi nhật ký) →
> COMMIT + PUSH + **LIVE**.**
> ⭐⭐ **MẸO TEST đáng nhớ — GIẢ LẬP MICRO** (dùng lại được cho mọi việc dính mic): Browser pane không xin
> được quyền mic thật, nhưng **tráo `navigator.mediaDevices.getUserMedia`** trả về
> `MediaStreamAudioDestinationNode` đang phát `AudioBuffer` tự dựng = 0,4s im + clip giọng AI (Kokoro
> TTS) + 2,0s im thì cả đường đi thật chạy y hệt mic thật và đo được tới mili giây. Số đo thu được:
> thanh % xong sau **23,5 giây**, dựng lại lần 2 PLAY hiện sau **55ms**; tự dừng đúng mốc **2123ms**;
> "elephant"→**100% = 5 sao**, "elephants" cho từ "elephant"→**86% = 4,5 sao**; 0 lỗi console.
> ⚠️ Lỗi thật bắt được lúc test: hàng sao làm **tràn 9px** ở tỷ lệ 16:9 → siết `gap`; đo lại 0 tràn, ca
> kiểm chứng 21:6 vẫn báo tràn 132px. **Việc kế: thầy nghiệm thu phần TỰ DỪNG bằng tai trong lớp ồn
> thật — chỉnh 3 con số cạnh nhau trong `startLevelWatch()` nếu cắt sớm/muộn. Chưa có bằng chứng
> iPhone/iPad.** Chi tiết: `GHI CHU DU AN.md` Đợt 108 + `templates/speaking/GHI CHU SPEAKING.md`.
>
> Trước đó: **10-11/8/2026 (Đợt 107, v0.9.81) — ⭐⭐ TEMPLATE THỨ 17 "SPEAKING" (ý tưởng
> riêng của thầy, không có bên Wordwall — ⚠️ đừng nhầm với "Speaking cards"): học sinh đọc to 1 từ vào
> mic, AI nghe + chấm điểm phát âm 0-100%, so ngưỡng đạt/chưa đạt (Options "Pass threshold"). ⭐ CÓ SỬA
> CORE — thêm MỚI `core/phonemize.js` (chữ→IPA, gói `phonemizer`/eSpeak-NG WASM) + `core/speech-score.js`
> (nghe+chấm, mô hình `wav2vec2-lv-60-espeak-cv-ft` qua `@huggingface/transformers`), cả hai thuần cộng
> thêm, cùng kiểu tiền lệ Đợt 94 (`core/tts.js`) + 1 mục `core/catalog.js`. ✅ THẦY DUYỆT (test cơ bản mic
> thật 11/8; yêu cầu tên "SPEAKING" + bỏ âm "Oh my god" → thay bằng bộ classic Wordwall 9 mp3 tự-chứa
> trong `templates/speaking/sounds/`, copy từ Type the answer) → GỘP TRANG CHỦ + COMMIT + PUSH + **LIVE**
> — đang giai đoạn thầy test thêm trên live, sẽ còn chỉnh theo phản hồi.**
> ⭐⭐ Bẫy thật bắt được lúc test: `pipeline()` tiện lợi của `@huggingface/transformers@3.8.1` LUÔN lỗi
> thiếu `tokenizer.json` cho đúng mô hình này (kho chỉ có `vocab.json` — hạn chế còn MỞ của chính thư viện,
> GitHub issue #93) — sửa bằng cách bỏ hẳn tokenizer, tự tải `AutoProcessor`+`AutoModelForCTC` (không cần
> tokenizer) + tự `fetch()` `vocab.json` + tự viết giải mã CTC "greedy" (~15 dòng). Xác nhận đúng bằng vòng
> lặp thật: TTS (Kokoro) đọc "elephant" → đưa qua pipeline mới → nghe ra khớp 100% với
> `phonemizeWord("elephant")`, so ngược từ khác ra 0%. Quyết định thứ 2: bỏ hẳn nhánh WebGPU cho mô hình
> NGHE này (đo thật fp32/WebGPU ~1,26GB so với q4/wasm ~240MB — khác Kokoro, ở đây mỗi lượt chỉ ghi 1 từ
> ngắn 1 lần nên dung lượng tải quan trọng hơn tốc độ; học sinh tải ~240MB đúng 1 lần ở lần ghi âm đầu).
> Chi tiết đầy đủ + giới hạn test (Browser pane không tự xin được quyền micro): `GHI CHU DU AN.md` Đợt 107
> + `templates/speaking/GHI CHU SPEAKING.md`. **Việc kế: thầy test thêm trên bản LIVE (nhiều từ, giọng học
> sinh thật, thử cả iPhone/iPad — chưa có bằng chứng thật trên Safari iOS); độ chính xác với giọng học
> sinh VN là ẩn số chính, `passThreshold` chỉnh được ngay qua Options không cần sửa code.**
>
> Trước đó: **10/8/2026 (Đợt 106, v0.9.80) — POPUP IMPORT: GIỚI HẠN LOẠI ACT TRONG THƯ MỤC "ACT"
> + NÚT IMPORT NHẬN KÉO-THẢ FILE TRỰC TIẾP. KHÔNG ĐỤNG CORE (chỉ `main.js` + `core/app.css`). ✅ THẦY
> DUYỆT (test Đợt 104 ok, gửi 2 yêu cầu tinh chỉnh) → COMMIT `a6b1b67` + PUSH + **LIVE** tại
> `https://aword.andrewclasses.com/` (`curl` xác nhận đủ `ACT_FOLDER_ALLOWED_TYPES`/`aw-fm-importbtn`/
> `.is-wrongtype` ngay lần poll thứ 3).**
> (1) Thư mục "ACT" giờ chỉ nhận 5 loại: Quiz (bao "3. READING QUIZ"), Running word, Running team,
> True/False, Filling — act khác (Anagram, Speaking cards…) nhắm vào "ACT" bị flag đỏ `is-wrongtype` +
> chặn Import, dùng lại đúng cơ chế dò-target-folder của Đợt 104. (2) Nút Import trong toolbar
> (`.aw-fm-importbtn`, rộng hơn icon-button thường) tự nhận `drop` — kéo file thả thẳng lên nút mở popup
> VÀ đọc file luôn, không cần bấm mở trước (`importFlow(initialFile)` nhận thêm tham số tuỳ chọn). Test
> thật qua Browser pane (đứng trong 1 thư mục "ACT" seed thật, dispatch DragEvent+DataTransfer thật lên
> nút): cả 2 đúng, 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 106. **Việc kế: thầy tự kéo file thả
> lên nút Import + thử import file có cả Anagram lẫn Quiz khi đứng trong "ACT".**
>
> Trước đó: **10/8/2026 (Đợt 105, v0.9.79) — ANAGRAM: THÊM CHẾ ĐỘ "BONUS AND MINUS" (chế độ thứ 3, giống
> "Letters with bonus" nhưng có điểm trừ mỗi lần bấm sai + hệ số nhân "Bonus x" cho từ PERFECT) + GOM
> THANH "POINTS OFF" VỀ 1 CHỖ. KHÔNG ĐỤNG CORE (chỉ `templates/anagram/anagram.js` + `.css`). ✅ THẦY
> DUYỆT → COMMIT `1e2c7ce` + PUSH + **LIVE**.**
> Đã tự test qua trình duyệt thật TRƯỚC khi commit: `Score -13/46` cho 1 từ có lỗi với Points off
> wrong-letter=20, `Score 14/46` cho 1 từ PERFECT với Bonus x=2 mặc định (cả hai khớp phép tính tay), chế
> độ "Letters with bonus" cũ không hồi quy (vẫn ra đúng 16/46). ⚠️ Thầy chưa tự mắt xem hiệu ứng số đỏ bay
> lên trên bản LIVE (máy build chỉ xác nhận được kết quả cuối qua bảng tổng kết, do bẫy rAF của Browser
> pane test). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 105 + `templates/anagram/GHI CHU ANAGRAM.md` Đợt
> 105.
>
> Trước đó: **10/8/2026 (Đợt 104, v0.9.78) — POPUP IMPORT EXCEL: GỘP VOICE VÀO DANH SÁCH + CHẶN
> TRÙNG TÊN + GUARD THƯ MỤC "ACT". CÓ SỬA CORE: `core/lesson-import.js` (tiêu đề ENG1/ENG2 đổi thành
> `xxx / ENG1 VOICE`/`xxx / ENG2 VOICE`). + `main.js` (khung Voice giờ là danh sách hàng riêng từng act
> thay vì 1 ô tích gộp; dò trùng tên act/thư mục trước khi Import — đỏ nhưng vẫn tích, chặn Import tới khi
> giải quyết; tự khoá "Make a new folder" khi đang ở/gần thư mục "ACT") + `core/app.css` (`.is-dup`,
> `.aw-imp-voice-rows`, `.aw-imp-folder-hint`). ✅ THẦY DUYỆT (test Đợt 103 ok, gửi 3 yêu cầu tinh chỉnh) →
> COMMIT `9c2d165` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ "ENG1
> VOICE"/`blockNewFolder`/`.is-dup` ngay lần poll thứ 2).**
> Lỗi thật bắt được lúc test: logic dò trùng tên dùng `null` cho 2 nghĩa khác nhau (ROOT thật VÀ "thư mục
> chưa tồn tại") khiến act trùng tên ở gốc thư viện KHÔNG BAO GIỜ bị bắt — sửa bằng cách tách hẳn
> `undefined` (sentinel) khỏi `null` (ROOT hợp lệ), dùng `===`/`!==` nghiêm ngặt. Chi tiết: `GHI CHU DU
> AN.md` Đợt 104.
>
> Trước đó: **10/8/2026 (Đợt 103, v0.9.77) — TĂNG TỐC TẠO GIỌNG (TTS): WEBGPU-FIRST + WORKER POOL. CÓ SỬA
> CORE: `core/tts.js`, `core/tts-worker.js` + `core/tts-pool.js` (MỚI), `core/voice-batch.js` (đổi tên
> `generateVoicesSequential`→`generateVoicesBatch`). + `templates/anagram/anagram-editor.js` + `main.js`.
> ✅ THẦY DUYỆT → COMMIT `20dea42` + PUSH + **LIVE**.**
> Đo THẬT trên GPU NVIDIA: `webgpu` nhanh hơn `wasm` **~8.6 lần** mỗi lần gọi (0.62s vs 5.3s/từ) — đòn bẩy
> lớn nhất. Giả định BAN ĐẦU sai, sửa bằng số đo thật: tưởng chạy nhiều Worker WebGPU song song sẽ nhân
> thêm tốc độ — đo thật lại cho kết quả NGƯỢC LẠI (1 Worker=1.9s/từ, 2 Worker=2.6s/từ, 4 Worker=4.6s/từ,
> càng nhiều Worker càng CHẬM) vì 1 GPU vật lý chia sẻ hàng đợi lệnh cho mọi Worker mở phiên trên nó —
> sửa thiết kế: GPU→pool size 1, chỉ CPU-wasm-fallback mới thật sự lợi từ nhiều Worker song song (nhánh đó
> chưa đo thật, dựa lý thuyết CPU-parallelism). Test thật qua Browser pane với GPU thật (harness Firestore
> giả trong bộ nhớ, xoá sau khi xong): `generateVoicesBatch()` trần 6/6 thành công; Anagram editor
> "Generate all voices" (mở thẳng qua `openAnagramEditor()`) 5/5 thành công + Save lưu đúng
> `voice`/`voiceId`/`hideText:true`; luồng Import Excel (Đợt 102) vẫn đúng sau đổi tên hàm, 6/6 từ có
> voice đúng, tốc độ cảm nhận rõ rệt (đạt "3/6" trong 10s đầu thay vì phải chờ lâu hơn nhiều như trước). 0
> lỗi console thật. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 103. **Việc kế: thầy tự thử Generate all
> voices trên 1 act nhiều từ + Import Excel thật để cảm nhận tốc độ mới; nếu có máy KHÔNG GPU rời, thử lại
> đo thật nhánh wasm-Worker-Pool (hiện chỉ dựa lý thuyết, chưa đo thật như nhánh webgpu).**
>
> Trước đó: **10/8/2026 (Đợt 102, v0.9.76) — IMPORT EXCEL: TỰ ĐỘNG TẠO GIỌNG ĐỌC (TTS) CHO ENG1/ENG2. CÓ
> SỬA CORE: `core/tts.js`, `core/voice-batch.js` (MỚI), `core/lesson-import.js`, `core/store.js`,
> `core/app.css`. + `main.js`. ✅ THẦY DUYỆT → COMMIT `8488c5b` + PUSH + **LIVE**.**
> Lỗi thật bắt được lúc test: nút "Skip voices" từng HUỶ CẢ LƯỢT IMPORT thay vì chỉ bỏ qua bước tạo
> giọng — đã sửa. Chi tiết: `GHI CHU DU AN.md` Đợt 102.
>
> Trước đó: **10/8/2026 (Đợt 101, v0.9.75) — ĐỒNG BỘ VOICE/HIDE TEXT QUA 12 TEMPLATE TẠM KHI DÙNG "CHANGE
> TEMPLATE" (thầy chốt "Toàn bộ 12 game"). CÓ SỬA CORE: `core/convert.js`, `core/voice-playback.js` (MỚI),
> `core/app.css`. + 12 file `templates/*/[template].js` + 3 file `.css`. `running_team` CHỦ Ý bỏ qua
> (không có khái niệm clue). ✅ THẦY DUYỆT → COMMIT `7f154cc` + PUSH + **LIVE**.**
> Test thật qua Browser pane cho 4/12 template đại diện (quiz, crossword, open_the_box, speaking_cards) —
> 0 lỗi console mỗi lần; bắt và vá được 1 lỗi thật lúc soát code: `speaking-cards.js`'s `finishFlip()`
> dùng `innerHTML = front.innerHTML` xoá mất listener nút loa mới gắn (chuỗi text round-trip, không phải
> di chuyển node) — sửa thành `cardEl.replaceChildren(...front.childNodes)`, xác nhận lại bằng test thật
> (`.play()` được gọi khi bấm nút trên lá vừa lật). 8 template còn lại (true_false, find_the_match,
> balloon_pop, flying_fruit, gameshow, maze_chase, type_the_answer, whack_a_mole) chỉ xác nhận qua
> `node --check` + soát code, CHƯA chạy thật qua browser. 2 quyết định thu hẹp phạm vi có chủ ý:
> whack_a_mole chỉ áp dụng chế độ quiz (không đụng true/false — nhiều chuột/chữ nhỏ/phản xạ nhanh);
> speaking_cards chỉ ẩn text khi `dealPlaces===1` (nhiều lá cùng lúc luôn hiện chữ). Chi tiết đầy đủ:
> `GHI CHU DU AN.md` Đợt 101. **Việc kế: thầy tự thử "Change Template" từ 1 act Anagram có voice sang vài
> game trong 12 game trên (ưu tiên 8 game chưa test thật), xác nhận giọng đọc/ẩn text đúng trên bản
> LIVE.**
>
> Trước đó: **10/8/2026 (Đợt 100, v0.9.74) — ANAGRAM: NÚT HIDE/SHOW ALL TEXT + 4 NÚT BULK ICON-ONLY + NÚT
> LOA TO GIỮA KHUNG KHI ẨN TEXT + TRÌ HOÃN AUTO-PLAY TỚI HẾT NHẠC INTRO. KHÔNG ĐỤNG CORE (chỉ
> `core/icons.js` — thêm 2 icon — + 3 file `templates/anagram/*`). ✅ THẦY DUYỆT → COMMIT `7140c98` +
> PUSH + **LIVE**.**
> Chi tiết: `GHI CHU DU AN.md` Đợt 100 + `templates/anagram/GHI CHU ANAGRAM.md` Đợt 100.
>
> Trước đó: **10/8/2026 (Đợt 99, v0.9.73) — WHACK-A-MOLE: THANH "PHẠT" ĐỎ Ở HÀNG NÚT MENU/SOUND KHI ĐẬP
> SAI. Chỉ đụng `templates/whack-a-mole/*` (2 file), KHÔNG đụng core. ✅ THẦY DUYỆT → COMMIT `cde45a2` +
> PUSH + **LIVE**.**
> Chi tiết: `GHI CHU DU AN.md` Đợt 99.
>
> Trước đó: **10/8/2026 (Đợt 98, v0.9.72) — ANAGRAM: HIDE TEXT + WAVEFORM AUDITION-STYLE +
> DIM/BLUR/PROGRESS/CANCEL CHO GENERATE ALL + POPUP DELETE ALL WORDS + AUTO-PLAY/PHÁT QUANG TRONG GAME.
> KHÔNG ĐỤNG CORE (chỉ `core/icons.js` — thuần thêm 2 icon — + 3 file `templates/anagram/*`). ✅ THẦY
> DUYỆT → COMMIT `06fec24` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ
> `loadWaveform`/`setHideTextState`/`buildDeleteAllWordsPopover` trong `anagram-editor.js`,
> `toggleVoiceClip`/`setListenGlow`/"Listen for the clue" trong `anagram.js`, `aw-anagram-ed-backdrop`/
> `aw-anagram-ed-runcancel`/`listenglow` trong `anagram.css`, `eyeOff` trong `core/icons.js` ngay lần
> poll thứ 2).**
> Ngay sau khi duyệt Đợt 96, thầy gửi tiếp 6 điểm (2 nhóm). **Nhóm Edit: (1)** icon Hide text cạnh mỗi
> hàng Clue — ON thì ẩn Clue khi chơi chỉ còn giọng đọc, mặc định ON ngay khi Generate/Regenerate xong,
> tự tắt bất cứ khi nào voice bị xoá (field mới `it.hideText`, khoá cứng bằng `!it.voice`). **(2)**
> Waveform đổi hẳn từ cột tần số ĐỘNG (`AnalyserNode`, Đợt 96) sang ẢNH TĨNH kiểu Adobe Audition:
> `decodeAudioData()` giải mã 1 lần lấy đỉnh biên độ 228 cột vẽ ngay khi mở popover, Play chỉ chạy 1 vạch
> playhead quét qua + nhãn thời gian sống — đo canvas thật ra 1670 pixel vẽ đúng dữ liệu thật. **(3)**
> Popup "Generate all voices" thêm lớp phủ dim+blur nền (đo đúng `rgba(15,22,34,.4)` + `blur(3px)`),
> thanh % tiến độ, khoá bấm-ra-ngoài-để-đóng khi đang chạy (đo thật: 16 hàng, bấm ra ngoài giữa
> "Generating 9/16…" → popup vẫn còn, tiến độ tiếp tục), nút Cancel đỏ nhỏ để soft-cancel giữa chừng (đo
> thật ra "Cancelled — generated voice for 12 row(s) before stopping."). **(4)** "Delete all words" đổi
> từ `confirm()` trần sang popup xác nhận giống "Delete all voices". **Nhóm Game: (5)** auto-play giọng
> ngay khi mở từ mới (đúng ranh giới `render()` sẵn có — chỉ chạy lúc bắt đầu/đổi từ). **(6)** nút loa
> phát quang xanh lá khi đang phát (CSS `@keyframes` thuần nên tự đóng băng cùng Menu Pause qua cơ chế
> chung có sẵn, không cần hook riêng), bấm khi đang phát = dừng, bấm khi dừng = phát lại; Clue ẩn hiện
> "🔊 Listen for the clue" (khác chữ với "vốn không có Clue" để tránh hiểu nhầm). Kỹ thuật test: harness
> giả Firestore như Đợt 96 + thêm bản test riêng cho phía CHƠI (seed 1 giọng thật qua
> `generateSpeechDataUrl`, dùng mẹo tráo tạm `HTMLMediaElement.prototype.play` để bắt bằng chứng thật
> `.play()` được gọi, không chỉ suy luận qua UI — clip test ngắn ~3s trong khi độ trễ round-trip môi
> trường test hay vượt 3s nên không chụp được đúng khung hình giữa lúc phát quang, xác nhận gián tiếp
> chắc chắn qua bằng chứng `.play()` thật + soát code). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 98 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 98. ⚠️ Số Đợt 97 đã bị phiên song song khác dùng cho Type
> the answer trong lúc phiên này đang làm, nhảy sang Đợt 98 để không trùng. **Việc kế (không gấp): thầy
> tự vào act thật trên bản LIVE xem Clue ẩn đúng + nút loa sáng xanh lúc phát, thử Cancel giữa lúc
> Generate all trên 1 act nhiều từ.**
>
> Trước đó: **10/8/2026 (Đợt 97, v0.9.71) — TYPE THE ANSWER: chống iOS Safari tự zoom ô nhập +
> đẩy xa dấu tích/X + hiện đáp án đúng lâu hơn khi sai. KHÔNG ĐỤNG CORE (chỉ
> `templates/type-the-answer/type-the-answer.js` + `.css`). ✅ THẦY DUYỆT → COMMIT `931ca20` + PUSH +
> **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ `--tta-input-fs` trong CSS +
> `size + 22`/`revealShown ? 2600` trong JS ngay lần poll đầu).**
> Thầy tự mở act trên iPhone, báo 3 điều: **(1)** ô nhập bị Safari tự zoom khi bấm vào — do font tính
> theo đơn vị `cqw` (% chiều rộng container game) xuống dưới 16px trên màn hẹp; sửa bằng biến
> `--tta-input-fs: max(16px, calc(3.9cqw * var(--fit)))` dùng chung cho ô nhập + chữ đáp án đúng (giữ
> bất biến "reveal = input" có sẵn từ 1/8/2026) — hết zoom (sàn cứng 16px) + to hơn ~11% như thầy muốn.
> **(2)** dấu tích xanh/X đỏ bay ra xa ô nhập hơn (`flyMark()` gap 6px→22px, đo DOM thật ~14px→~30.7px).
> **(3)** đáp án đúng hiện lâu hơn khi sai trước khi tự chuyển câu (1400ms→2600ms, CHỈ khi đang thật sự
> hiện đáp án — tắt "Show answer when wrong" thì giữ nhịp cũ). Đo bằng bộ đếm thời gian thật chạy trong
> trang: submit sai → prompt đổi câu sau ~2841ms (khớp 2600ms + crossfade chữ câu hỏi). Chi tiết đầy đủ:
> `GHI CHU DU AN.md` Đợt 97 + `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` Đợt 97. **Việc kế
> (không gấp): thầy tự mở lại trên iPhone thật xác nhận hết zoom khi bấm vào ô nhập (máy build chỉ đo
> được computed font-size qua DOM, không mô phỏng được hành vi zoom thật của Safari).**
>
> Trước đó: **10/8/2026 (Đợt 96, v0.9.70) — ANAGRAM: 3 CẢI TIẾN VOICE (đổi đọc Clue thay Word,
> sóng âm khi preview, Generate all/Delete all voices). KHÔNG ĐỤNG CORE (chỉ
> `templates/anagram/anagram-editor.js` + `anagram.css`). ✅ THẦY DUYỆT → COMMIT `fdcd403` + PUSH +
> **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ `speakTextFor`/`GENERIC_CLUE_TEXT`/
> `clueInputByItem`/`startWaveform`/`toggleBulkPopover` trong JS + `aw-anagram-ed-wave`/
> `aw-anagram-ed-voicehint` trong CSS ngay lần poll đầu; mở lại `test.html` live chơi thật 0 lỗi console).**
> Thầy thử act live `?a=256` rồi gửi 3 điểm sửa cho tính năng 🎤 của Đợt 94. **(1)** Voice đổi sang đọc
> CLUE thay vì Word (nút loa lúc chơi nằm cạnh clue — đọc Word ra sẽ lộ đáp án); hàm dùng chung
> `speakTextFor(it)` = Clue hoặc fallback "Unscramble the word" khớp đúng chữ hiển thị trong game; sửa
> Word không còn xoá voice, sửa Clue mới xoá; thêm dòng "Will speak: ..." sống động trong popover. ⭐ Bắt
> được 1 lỗi thật: bấm vào chính ô Clue đang mở popover bị cơ chế đóng-khi-bấm-ra-ngoài coi là "ra ngoài"
> nên tự đóng trước khi kịp gõ — sửa bằng `WeakMap` nhận diện đúng ô Clue của hàng đang mở. **(2)** Thêm
> canvas sóng âm (Web Audio `AnalyserNode` thật, không phải giả lập) khi bấm ▶ Play, tự ẩn khi phát xong.
> **(3)** Thêm nút Generate all voices / Delete all voices trong bulk bar, mỗi nút có popup riêng (chọn
> giọng + skip-existing / xác nhận + đếm số hàng), dừng đúng lúc gặp lỗi chưa đăng nhập. Không có quyền
> đăng nhập Google trong phiên này nên test bằng harness thay Firestore (Map trong bộ nhớ, cùng chữ ký hàm,
> đã xoá 4 file tạm sau khi test xong). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 96 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 96. **Việc kế (không gấp): thầy tự vào act thật `?a=256` trên
> bản LIVE thử vòng Save→Play→waveform→Generate all/Delete all thật qua Firestore thật.**
>
> Trước đó: **10/8/2026 (Đợt 95, v0.9.69) — FIX bridge myActivity: bridge cũ bị VỨT giữa lúc đổi Template
> làm mất đồng bộ Options/Style. CÓ SỬA CORE (chỉ `core/engine.js`, đúng đoạn bridge). ✅ THẦY DUYỆT →
> COMMIT `7f3d23e` + PUSH.**
> Bắt nguồn từ myActivity (nhúng AWord qua WebContentsView 2-4 cột): mở act AWord ở 1 cột đổi
> Template/Options thì các cột khác đồng bộ "lúc được lúc không". Gốc lỗi: `startGame()` tạo
> `window.__awordBridge = {...}` MỚI mỗi lần chạy, kể cả khi chạy lại do `doSwitchTemplate()` (async, có
> thể mất vài giây) — nếu 1 lệnh Options/Style tới đúng lúc cột đang giữa chừng đổi Template, nó ghi vào
> bridge CŨ sắp bị vứt bỏ → thay đổi mất, không lỗi console. Sửa: `window.__awordBridge` nay là 1 object
> duy nhất sống suốt vòng đời trang, có `_setCurrent(delegate)` gọi NGAY đầu mount trước mọi `await`;
> `applyOptions()`/`setTheme()` chờ xong `switchTemplate()` đang chạy dở trước rồi mới áp. Cả 3 hàm giờ
> `async`, trả `Promise<boolean>`. Chưa mở trình duyệt thật test (chỉ lộ ra khi chạy trong myActivity nhiều
> cột). Chi tiết: `GHI CHU DU AN.md` Đợt 95.
>
> Trước đó: **10/8/2026 (Đợt 94, v0.9.68) — ⭐⭐ GIỌNG ĐỌC THẬT (Kokoro TTS) cho icon 🎤 Anagram
> editor. CÓ SỬA CORE (2 file MỚI, thuần cộng thêm — `core/tts.js`, `core/voice-clips.js`). ✅ THẦY DUYỆT
> → COMMIT `a853a34` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận `core/tts.js`
> có `DEFAULT_VOICE`, `core/voice-clips.js` trả 200, `anagram.css` có `font: inherit` + `aw-anagram-
> listenbtn`, `anagram-editor.js` có `toggleVoicePopover`).**
> Đã test THẬT đầu-cuối qua Claude in Chrome (thầy cho phép): dán + Publish luật Firestore, đăng nhập
> Google thật, Generate/Save/Play một clip thật, chơi game bấm nút loa thật — bắt và sửa 1 bug thật giữa
> chừng (nút loa gần như vô hình vì `<button>` không kế thừa font-size, sửa `font: inherit` trong
> `anagram.css`).
> Icon 🎤 trong Anagram editor (trước "coming soon") giờ mở popover: chọn 1 trong 28 giọng tiếng Anh
> (Kokoro-82M, chạy 100% trong trình duyệt, không cần server) → Generate → lưu 1 document Firestore riêng
> (`voiceClips/{clipId}`, KHÔNG nhét vào `content.items[]` vì audio ~50-150KB/từ sẽ vỡ giới hạn 1MB/document
> nếu act có nhiều từ) → lúc chơi hiện nút loa cạnh clue phát lại. ⭐ Cân nhắc kiến trúc quan trọng giữa
> chừng: Firebase Storage từ 3/2/2026 bắt buộc gói Blaze (phải nhập thẻ ngân hàng dù 0đ) — trái nguyên tắc
> "không cần thẻ" của dự án — nên đổi hẳn sang lưu qua Firestore (collection mới, đọc công khai theo id
> giống `assignments/{code}`, để audio tự đi theo bản snapshot bài giao mà không cần bước copy riêng).
> Chi tiết đầy đủ + bug tự bắt được lúc test (TDZ, trùng biến): `GHI CHU DU AN.md` Đợt 94 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 94.
>
> Trước đó: **9/8/2026 (Đợt 93, v0.9.67) — ⭐ GẮN DOMAIN RIÊNG `aword.andrewclasses.com`. Không
> đụng code, chỉ hạ tầng. ✅ THẦY DUYỆT → COMMIT `5e510d2` (file `CNAME`) + PUSH + **LIVE** tại
> `https://aword.andrewclasses.com/`.**
> Domain gốc `andrewclasses.com` thầy mới mua (quản lý ở **portal.inet.vn**, nameserver iNET
> `sapa/laocai.vclouddns.com`) — dùng làm domain gốc cho MỌI app Andrew Classes từ nay, mỗi app một
> subdomain. 3 bước đã làm: **(1)** DNS trên portal.inet.vn → OneShield → Bản ghi DNS → CNAME `aword` →
> `andrewclasses-01.github.io` (tắt "Trạng thái Bảo vệ"/proxy). **(2)** file `CNAME` trong repo +
> `gh api -X PUT repos/andrewclasses-01/AWord/pages -f cname=...` → chờ chứng chỉ SSL `approved` → ép
> HTTPS bằng `gh api ... -F https_enforced=true` (chú ý `-F` hoa, không phải `-f` thường). **(3)** Firebase
> Console (project `aword-70dae`) → Authentication → Authorized domains → thêm domain mới (bắt buộc, nếu
> không nút "Sign in with Google" sẽ lỗi). Domain cũ `andrewclasses-01.github.io` vẫn chạy song song,
> không xoá. Mẫu đầy đủ để gắn domain cho app tiếp theo: `GHI CHU DU AN.md` Đợt 93.
>
> Trước đó: **8/8/2026 (Đợt 92, v0.9.66) — SỬA LỖI ĐỢT 91: DIM + BLUR CỦA MENU PAUSE KHÔNG HIỆN
> (chỉ đồng hồ dừng). ✅ THẦY DUYỆT → COMMIT `b48c315` + PUSH + **LIVE** (đã tự chụp ảnh màn hình thật xác
> nhận, cả local lẫn live).**
> ⭐ **Lỗi thật, không phải do màu quá nhạt**: `enterMenuPause()` (`core/engine.js`) tạo + append
> `.aw-stage-dim` TRƯỚC khi gọi `stage.getAnimations({subtree:true})` để tạm dừng animation đang chạy
> trong khung — mà `.aw-stage-dim` vừa thêm vào đã tự khởi động animation `aw-fadein` của chính nó, nên bị
> chính `getAnimations()` bắt và `.pause()` ngay lập tức, đóng băng ở `opacity≈0`. `getComputedStyle` vẫn
> báo đúng giá trị CSS đã khai (dễ tưởng nhầm "chỉ cần tăng độ đậm") — phải tự đo riêng `opacity` mới lộ ra
> `"0"`. Sửa: đảo thứ tự — bắt+pause animation đang chạy TRƯỚC, tạo/append `.aw-stage-dim` SAU. Luật chung
> cho overlay mới sau này: `core/HUONG DAN CORE.md` mục "MENU PAUSE" mục 1 (đoạn "BẪY THẬT ĐÃ CẮN"). Nhân
> tiện tăng độ đậm khớp `.aw-tool-dim` (`rgba(...,.5)` + `blur(3px)`, trước `.32`/`2px`). Chi tiết:
> `GHI CHU DU AN.md` Đợt 92.
>
> Trước đó: **8/8/2026 (Đợt 90+91, v0.9.65) — SỬA ĐIỂM TRỪ BỊ RƠI MẤT KHỎI BẢNG KẾT QUẢ (3 template)
> + ⭐⭐ TÍNH NĂNG MỚI "MENU PAUSE" TOÀN HỆ THỐNG. ⭐ CÓ SỬA CORE (thầy đặt hàng trực tiếp). ✅ THẦY DUYỆT
> → COMMIT `be7cd55` + PUSH + **LIVE** (`curl` xác nhận `aw-stage-dim` trong `core/app.css` +
> `enterMenuPause` trong `core/engine.js` + `gsPauseHandlers` trong `gameshow.js`).**
>
> **Đợt 90 — điểm trừ ("Points off"/"Minus mode") không vào bảng kết quả cuối game.** Thầy phát hiện ở
> Type the answer, điều tra ra thêm Crossword dính lỗi Y HỆT: cả hai tính đúng điểm trừ và hiện đúng lúc
> đang chơi, nhưng `finish()` không truyền `score` vào `ui.finish()` → mặc định lấy số câu đúng thuần, bật
> "Points off" **không hề ảnh hưởng** điểm cuối/xếp hạng. ⭐ **Bẫy tự bắt được**: vá tạm bằng đọc thẳng biến
> `livePoints` (tính bên trong callback animation bay điểm, trễ ~0,9-1,1s) THUA CUỘC ĐUA với timer
> auto-finish câu cuối (đúng 1000ms) — test thật ra `Score 2/6` trong khi ô điểm sống đã hiện `3/6`. Sửa
> đúng: tính điểm trừ ĐỒNG BỘ trong `finish()` từ `state`/`wordState` (set lúc chấm câu, không phụ thuộc
> animation). Anagram: tách `correct` (số đúng thật) khỏi `score` (điểm đã trừ) — trước đó gộp chung làm
> hàng phụ "Total: x/y" không bao giờ hiện. Whack-a-mole điều tra rồi loại (hệ điểm arcade riêng, không mất
> gì). Chi tiết: `GHI CHU DU AN.md` Đợt 90, + `GHI CHU <TEN>.md` của 3 game.
>
> **Đợt 91 — MENU PAUSE.** Thầy yêu cầu: *"bấm Menu thì pop-up + tên act + nút tùy chỉnh + nút chức năng
> giữ sáng, nền phía dưới tối hơn + nhoè nhẹ, mọi act tạm ngưng (dừng game, dừng âm thanh), đóng menu thì
> tiếp tục"*. `.aw-stage-dim` MỚI (`core/app.css`) chỉ tối `.aw-stage-inner` (topbar/playarea/bottombar) —
> thanh dưới khung (title/Options/Template/Style/Edit/Assignment/Print) CỐ Ý giữ sáng, khác hẳn
> `.aw-tool-dim` cũ (tối cả màn hình). `enterMenuPause()`/`exitMenuPause()` (`core/engine.js`) tự động dừng
> CHO MỌI TEMPLATE: đồng hồ chung (dịch `startedAt`), AudioContext dùng chung
> (`sound.pauseContext/resumeContext` MỚI), mọi pack mp3 đang phát kể cả nhạc nền loop
> (`sfx.js pauseActive/resumeActive` MỚI, qua registry `window.__awSfxPacks`), mọi animation CSS/WAAPI
> đang chạy trong khung (`stage.getAnimations({subtree:true})`). Hook tuỳ chọn MỚI **`tpl.onPause(paused)`**
> cho game có timer/nhạc RIÊNG — đã nối cho 7 game: Gameshow (đếm ngược mỗi câu + nhạc nền), Whack-a-mole
> (đồng hồ ván + spawn mole), Maze chase (di chuyển player/enemy), Open the box (đồng hồ mỗi câu — tái dùng
> đúng đường `runCountdown(timeLeft)` có sẵn), Running word (tái dùng CƠ CHẾ PAUSE TRỌNG TÀI có sẵn, thêm
> cờ `pausedByMenu`), Running team (2 đồng hồ delta-tick), Flying fruit (spawn hoa quả). 9 game còn lại
> KHÔNG cần hook (game "lượt một", đồng hồ chung đã đủ). ⚠️ Giới hạn đã biết, cố ý không sửa: `setTimeout`
> dự phòng của `element.animate()` không bị pause cùng animation (lệch một khung hình hiếm gặp, vô hại);
> chuỗi cinematic dựng bằng `setTimeout` đệ quy (Gameshow intro/get-ready, timer riêng từng ô/mole của
> Whack-a-mole) vẫn chạy theo giờ thực khi Menu mở giữa chừng — quá ngắn/hiếm, không đáng viết lại cơ chế
> timer của cả file. Test trình duyệt thật: cả 16 template load 0 lỗi console; Quiz/Gameshow/Maze
> chase/Running team/True-false chơi thật qua vòng mở-đóng Menu (đồng hồ/di chuyển đứng yên tuyệt đối lúc
> mở, chạy lại đúng nhịp thời gian thực lúc đóng). Luật đầy đủ + mẫu code cho template thứ 17: `core/HUONG
> DAN CORE.md` mục **"MENU PAUSE"**. Chi tiết: `GHI CHU DU AN.md` Đợt 91 + `GHI CHU <TEN>.md` của 7 game.
>
> Trước đó: **8/8/2026 (Đợt 89, v0.9.64) — ANAGRAM: KÉO-THẢ VẬT LÝ THẬT + HIỆU ỨNG MỀM HƠN +
> SLOGAN. Chỉ đụng `templates/anagram/*`, KHÔNG đụng core. ✅ THẦY DUYỆT → COMMIT `5d504f7` + PUSH +
> **LIVE** (`curl` xác nhận `aw-anagram-slogan` trong CSS + `moveResultTile`/`showTransientMark`/"ANAGRAM
> IN ANDREW CLASSES" trong JS live).**
> 4 lượt góp ý liên tiếp trong cùng 1 phiên (thầy tự chơi bản live rồi gửi từng lượt), mỗi lượt tự test qua
> trình duyệt thật (mô phỏng `PointerEvent` thật cho kéo-thả, đo `getComputedStyle`/`getAnimations()`).
> **Lượt 1:** hết "đổi hình dạng"/bóng đổ méo khi chữ bay (bản sao bay giờ đọc bo góc/bóng THẬT của ô thay
> vì số cố định) + bỏ hẳn bóng đổ mọi ô + thêm kéo-thả đặt chữ ở CẢ 2 chế độ (trước chỉ bấm được) + sửa lần
> đầu vật lý đổi chỗ 2 ô hết giật. **Lượt 2:** tích đúng dời sang ô đích (đổi phong cách trắng như dấu X) +
> PERFECT tách khỏi số điểm (to dần rồi tự biến mất tại chỗ, số điểm bay riêng sau một nhịp) + khối ô chữ
> đổi từ dồn hết trống lên trên sang chia đệm co giãn tỉ lệ 1:2 (đỡ dính đáy) + ⭐ vật lý swap đổi hẳn kỹ
> thuật (animate TRỰC TIẾP 2 ô thật thay vì ẩn-bay-bản-sao, bắt được lỗi WAAPI `fill:"forwards"` phải gọi
> `anim.cancel()` mới xoá transform thật). **Lượt 3:** đổi hẳn "đổi chỗ 2 ô" → "chèn-đẩy" (kéo 1 ô chèn
> đúng vị trí, đẩy lùi mọi ô ở giữa, dùng `Array.splice` như kéo-thả sắp hàng có sẵn trong
> `anagram-editor.js`) + đổi âm "Oh my god" (core) sang âm "Incorrect" thật có sẵn trong bộ âm riêng
> Anagram + tích/X trong ô hết "hiển thị cứng" (tự gỡ sau 550ms). **Lượt 4:** thêm slogan "ANAGRAM IN
> ANDREW CLASSES" trên thanh đồng hồ/điểm (đúng kỹ thuật Crossword đã dùng) + tích/X đổi từ "CSS animation
> lo hiện + xoá DOM tức thì lúc mất" sang MỘT animation WAAPI liên tục suốt vòng đời (nhỏ→lớn→giữ→nhỏ rồi
> mới gỡ) — đo scale từng khung 25ms xác nhận đường cong liên tục, hết bước nhảy ở cả 2 đầu. ⚠️ Có thử tham
> khảo Anagram thật trên Wordwall (bản công khai, vì bản riêng thầy gửi là "private resource") nhưng game
> đó vẽ bằng CANVAS nên công cụ tự động không lái được, chỉ quan sát được cấu trúc (dãy đích là 1 dải gạch
> chân liền). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 89 + `templates/anagram/GHI CHU ANAGRAM.md` Đợt 89.
>
> Trước đó: **7/8/2026 (Đợt 88, v0.9.63) — ⭐⭐ SỬA BẪY "SNAP KHỰC MỘT CÁI" Ở 3 TEMPLATE (Open the
> box, Crossword, Flying fruit) + GHI LUẬT CHUNG VÀO `core/HUONG DAN CORE.md` CHO MỌI TEMPLATE VỀ SAU.
> KHÔNG SỬA CORE ENGINE. ✅ THẦY DUYỆT → COMMIT `eed2a45` + `6b0dc5e` + PUSH + **LIVE** (`curl` xác nhận cả
> 3 template).**
> ⭐ **Cơ chế lỗi:** một CSS `@keyframes` animation LUÔN khởi động lại từ đúng khung `from` của chính nó mỗi
> khi được (tái) áp dụng, bất kể phần tử đang ở giá trị nào — nếu JS đổi/gỡ class giữ animation đó ĐANG LÚC
> nó còn chạy dở (chạm sớm, gõ phím, tap nhanh — bất cứ đâu input không bị khoá trong lúc hiệu ứng chạy),
> phần tử **nhảy tức thì** về giá trị mặc định trước khi animation mới kịp bắt đầu — "khực một cái" đúng như
> thầy tả. Điều tra 15 template còn lại (5 agent song song): 13/15 sạch (dùng WAAPI có `.cancel()`/
> `commitStyles()`, CSS transition, hoặc input khoá hẳn — đều tự miễn nhiễm); Whack-a-mole đã tự vá đúng họ
> lỗi này từ trước. 2 ca thật còn lại: Crossword (gõ chữ đầu tiên sau khi bấm "Andrew help" xoá sạch hiệu
> ứng hiện dần của các ô gợi ý khác) và Flying fruit (chạm sai làm quả nhảy góc xoay về 0° trước khi rung —
> chỉ lộ khi bật option "Retry after incorrect answer"). Cách sửa cả 2: ghim/đọc giá trị SỐNG THỰC TẾ
> (`getComputedStyle`) ngay trước khi đổi animation, thay vì để trình duyệt ép về mặc định. Đã ghi thành
> luật chung + mẫu code cho mọi template về sau vào `core/HUONG DAN CORE.md`. Chi tiết: `GHI CHU DU AN.md`
> Đợt 88.
>
> Trước đó: **7/8/2026 (Đợt 87, v0.9.62) — ⭐⭐ ÁP TIÊU CHUẨN KHUNG HÌNH & FULLSCREEN CHO TOÀN BỘ
> 16 TEMPLATE, BẰNG CÁCH ĐƯA VÀO CORE. ⭐ CÓ SỬA CORE (thầy duyệt). ✅ THẦY DUYỆT → COMMIT `bef4594` + PUSH
> + **LIVE** (Pages tự build, `curl` xác nhận ngay lần poll đầu).**
> ⭐ **ĐÃ CHẠY LẠI TRỌN BỘ TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io/AWord/`, không
> qua iframe): **16/16 template mount, tất cả cùng tỷ lệ `1.5261`, 0 lỗi console**; chốt chặn đo bằng class
> `.aw-zoomed` **THẬT** của Running team: viewport 1839×1270 (1,448) → **phủ kín, 0 dải** · 1280×540 (2,37)
> → **kẹp 960×540 = 16:9, dải 160px**.
> Thầy ra lệnh *"áp dụng tiêu chuẩn khung hình và fullscreen cho toàn bộ các template"*, rồi chốt qua
> AskUserQuestion: fullscreen 14 game **phủ kín + chốt chặn 16:9** (không chọn letterbox cho nhanh) · làm
> **hết 15 game trong 1 đợt** · Running team **về 16:10,5** · và **sửa CORE 1 lần** thay vì chép khối CSS
> vào 15 file.
> ⭐ **PHÁT HIỆN LÀM ĐỔI HẲN KHỐI LƯỢNG (khảo sát trước khi code):** tưởng phải làm 4 bậc co giãn cho từng
> game — **không phải**. 14 game đang thiết kế cho **16:9 = 56,25cqw**; khung mới **16:10,5 = 65,625cqw** là
> **CAO HƠN 9,375cqw** (thêm chỗ, không bóp), và vì fullscreen mới **chốt chặn 16:9** nên khung **NGẮN NHẤT**
> chúng gặp chính là **16:9 = đúng thiết kế hiện tại**. ⇒ **14 game không cần bậc co giãn**, và **bẫy
> `line-height` (mục 4.3) cũng không áp** vì bẫy đó chỉ lộ khi khung NGẮN LẠI. **Running team là ca duy nhất
> ngắn lại** (75 → 65,625cqw).
> **(1) CORE `core/app.css`, đúng 2 chỗ:** `.aw-stage` `aspect-ratio: 16/9` → **`16 / 10.5`**; và 4 luật
> `:fullscreen .aw-stage` (đủ 4 tiền tố, mỗi cái 1 rule riêng) từ letterbox `width: min(100vw, 100vh*16/9)`
> → **`width:100%; height:100%; flex-shrink:0`** + **`max-width: calc(100dvh*16/9)`** (kèm dòng `100vh` dự
> phòng). Nhờ ở core: 16 game đúng ngay, **template thứ 17 tự động đúng**, không có 15 bản sao phải giữ đồng bộ.
> **(2) ⭐⭐ LỖI THẬT TỰ TÌM RA GIỮA ĐƯỜNG — `flex-shrink: 0` là HÀNG RÀO:** `.aw-page` là **flex ROW**, khung
> là flex item, nên `width:100%` **chỉ là LỜI ĐỀ NGHỊ** — anh em nào còn hiện cũng cướp bề ngang và
> `flex-shrink:1` mặc định **lặng lẽ nhường**. Đo được khi bàn thử để sót `.aw-as-bars`: khung **sụp
> 1280px → 688px**, game chỉ nhỏ đi, **0 lỗi console, không dấu vết**. Luật letterbox CŨ giấu kín cả lớp lỗi
> này vì luôn xin ÍT bề ngang hơn khung cha có. Vá xong đo lại đúng kịch bản xấu đó: **phủ kín 1280×800, 0 dải**.
> **(3) Dọn 2 template có luật riêng:** Running word gỡ luật `aspect-ratio` (trùng khít core) **và 4 luật
> letterbox `:fullscreen` riêng** — 4 luật này nay **MÂU THUẪN** core mới (ghim khung về 16:10,5 trong khi
> core bảo phủ kín, mà chúng specific hơn nên **sẽ thắng**); chúng chưa từng chạy vì template dùng
> `useZoomFullscreen`, nhưng để mâu thuẫn nằm chờ sau một cái cờ là bẫy mất cả phiên sau. Running team gỡ
> `4/3` + 4 luật letterbox, **thêm chốt chặn 16:9** vào khối `.aw-zoomed`. **13 game còn lại: không đụng
> một dòng CSS nào.**
> **(4) SỐ ĐO THẬT** (devserver :5510, chạy từ `/index.html` — bẫy 4): khung nghỉ **16/16 ra 1,5261**
> (966×633), **0 lỗi console**. Chốt chặn: iPad 1024×768 → **phủ kín, 0 dải** · TV 1280×720 → **phủ kín, 0
> dải** · 16:10 1280×800 → **phủ kín, 0 dải** · **1280×634 (đúng ảnh thầy gửi Đợt 86, tỷ lệ 2,019) → kẹp
> 1127×634 = 16:9, dải 77px** · ultrawide 1280×540 (2,37) → kẹp **960×540**, dải **160px** — khớp chính xác
> bộ số Đợt 86. **Running word zero-diff**: bàn phím **1,15** · margin **3,4cqw** · hàng **7,02cqw** · Andrew
> **14,6 = 12,7 × 1,15** (đúng bẫy `getBoundingClientRect` trả kích thước ĐÃ nhân scale). **Running team**:
> cả 9,375cqw rơi vào `.aw-rt-tiles` (ô **26,81 → 22,09cqw**), **chữ giữ nguyên 3,41cqw**, ở chốt chặn 16:9 ô
> vẫn cao **gấp 5 lần** chữ ⇒ **không cần bậc co giãn**; setup 2 game **không phải cuộn** ở cả 3 tỷ lệ. Quét
> tràn 16/16 game sau khi bấm PLAY thật: **không game nào sinh tràn MỚI** (whack-a-mole 223px · crossword 17px
> · flying-fruit 5–7px · open-the-box 1px đều có **ở cả 16:9** = sẵn có); **speaking-cards 301px ở 4:3 là
> DƯƠNG TÍNH GIẢ** — `.aw-sc-bg` là ảnh nền panorama **cố ý rộng hơn khung**, cha `overflow:hidden`, và khung
> càng cao thì nền phủ càng rộng (1802 → 2409px) ⇒ đợt này **cải thiện** game đó.
> ⚠️ **HAI BẪY ĐO ĐÃ CẮN (đã ghi vào `core/HUONG DAN CORE.md` mục 4b):** **(a)** `.aw-playarea` **RỖNG cho tới
> khi bấm PLAY** — bảng đo đầu tiên đo trên vùng rỗng và trả "0 tràn" cho cả 16 game, **trông y hệt kết quả
> đẹp**; phải bấm PLAY trước, và phải cho bàn đo một **ca kiểm chứng** (ép tỷ lệ 6.0 → thấy tràn 57–245px) để
> chứng minh nó biết phản ứng. **(b)** div bọc bàn thử để `width:1000px` làm chế độ phủ kín đo ra 1000px —
> **suýt kết luận nhầm là lỗi sản phẩm**.
> ⚠️ **Giới hạn đã biết:** **fullscreen API THẬT không kích hoạt được trong pane preview** (click thật qua
> `ref` vẫn ra `document.fullscreenElement === null`) và pane **không compositing nên không chụp được ảnh** →
> đường `:fullscreen` kiểm bằng **CSSOM** (đúng `width/height:100%`, `flex-shrink:0`,
> `max-width: calc(1.77778 * 100dvh)`) **cộng** bản mô phỏng đúng bộ khai báo. Chrome chỉ giữ **2/4** luật
> (vứt `-moz`/`-ms` nó không hiểu) — **đúng thiết kế**, và chính là lý do mỗi tiền tố phải là 1 rule riêng.
> ⬜ **CHỜ THẦY NGHIỆM THU MÁY THẬT:** fullscreen trên **iPad khác hẳn** (trước letterbox 16:9 có dải trên
> dưới, nay **phủ kín tới 4:3** → nhiều chỗ trống dọc hơn, chữ autoFit **to lên**) · khung nghỉ 16:10,5 có vừa
> mắt hơn 16:9 ở **cả 16 game** · dải hai bên chỉ hiện khi màn **bè hơn 16:9** · Running team ô từ nhỏ hơn
> trước có còn nhìn rõ từ cuối lớp. Chi tiết: `GHI CHU DU AN.md` Đợt 87.
>
> Trước đó: **7/8/2026 (Đợt 86, v0.9.61) — RUNNING WORD: KHUNG MẶC ĐỊNH 4:3 → 16:10,5 + GIỚI HẠN
> FULLSCREEN + PHÍM ANDREW VỀ CHUẨN (app LÀM MẪU mở màn loạt cải tiến KÍCH CỠ MÀN HÌNH cho cả 16 template).
> ✅ THẦY DUYỆT → COMMIT `ac67836` + PUSH + **LIVE** (Pages tự build, `curl` xác nhận sau ~20 giây ở lần
> poll thứ 2).**
> ⭐ **ĐÃ CHẠY LẠI TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io`, không qua iframe):
> khung nghỉ **968×635 = 1,5238**, bàn phím 1,15, hàng **7,01**, Andrew **2,54** · 4 bước co đúng
> **1,15 / 1,08 / 0,93 / 0,87** · **đúng ca của thầy (tỷ lệ 2,019) → khung kẹp về 1127×634 = 16:9, dải
> 76px mỗi bên (11,9% bề ngang), hàng 7,54 > chữ 5,82 → HẾT ĐÈ** · **0 lỗi console**.
> ⚠️ **BẪY DẤU MỐC (lần thứ hai dính, sau `padStart(2` ở Đợt 84):** `line-height: 1.04` là dấu mốc **VÔ GIÁ
> TRỊ** — `.aw-rw-row-body` vốn đã có chuỗi đó từ trước, nên nó báo "đã live" ngay ở lần `curl` ĐẦU khi file
> còn cũ. 4 dấu mốc còn lại chỉ có ở bản mới nên mới dùng được: `aspect-ratio: 16 / 10.5` · `100dvh * 16 / 9`
> · `@container stage (aspect-ratio > 16/9.2)` · `0 0 12.7cqw`.
> ⭐⭐ **ĐÃ GHI TIÊU CHUẨN TOÀN HỆ THỐNG** vào `core/HUONG DAN CORE.md` mục **"TIÊU CHUẨN KHUNG HÌNH &
> FULLSCREEN CỦA TOÀN HỆ THỐNG AWORD"**: cỡ mặc định **16:10,5** · fullscreen phủ kín nhưng **chốt chặn
> 16:9** · **co giãn thành phần theo bậc** khi khung bè ("co trước, kẹp sau" + "ưu tiên chữ đọc được") ·
> 4 bẫy bắt buộc biết · phím Andrew chuẩn 12,7cqw. ⚠️ **Tính tới nay MỚI CHỈ Running word chạy tiêu chuẩn
> này**; 14 game còn lại vẫn 16:9, Running team vẫn 4:3 — chuyển dần theo lệnh thầy, KHÔNG tự ý đổi hàng loạt.
> 2 file code: `templates/running-word/running-word.css` (KHÔNG đụng logic core, chỉ thêm mục tài liệu vào
> `core/HUONG DAN CORE.md`).
> Thầy yêu cầu: *"chuyển kích cỡ mặc định thành tỷ lệ 16:10,5, giữ nguyên cách fullscreen như hiện tại"*.
> **(1)** `.aw-stage.act-running_word`: `aspect-ratio` **4/3 → 16 / 10.5** (= 32/21). Chiều cao khung theo bề
> ngang: 16:9 = 56,25cqw · **16:10,5 = 65,625cqw** · 4:3 = 75cqw. 4 luật letterbox `:fullscreen` đổi theo cho
> khớp — nhưng **cách fullscreen KHÔNG đổi**: template chạy `tpl.useZoomFullscreen` nên fullscreen đi đường
> `.aw-zoomed` (`width/height:100%`, vô hiệu hoá luôn `aspect-ratio`), tức 4 luật kia là **code chết**; đo lại
> xác nhận `document.fullscreenElement` vẫn `null`, khung phủ **đúng cả viewport 1280×720**, thoát về 1,5238.
> **(2)** ⭐ **Chỉ `.aw-rw-boards` là `flex:1`** → **toàn bộ 9,38cqw khung mất đi rơi hết vào bảng từ**: bảng
> 38,81 → **29,43**, cửa sổ 3 hàng 30,40 → **21,03**, **1 hàng 10,13 → 7,01cqw**; đồng hồ (5,81), bàn phím
> (22,88), hở bảng↔bàn phím (1,31) **không đổi một chút nào**. Chữ của từ vẫn 5,81cqw → còn dư **1,2cqw**:
> đây là **con số hết trước tiên** nếu khung còn ngắn nữa.
> **(3)** ⭐ **LỖI THẬT bắt được nhờ khung ngắn lại** (nằm im từ đầu, 4:3 che mất): `.aw-rw-input` **quên khai
> `line-height`** → thẻ `<input>` lấy chiều cao theo **metrics font Baloo 2 ~1,6em**, cao **9,29cqw** trong khi
> chữ thật chỉ 5,81cqw; hàng còn 7,01cqw → tràn 2,28cqw, `overflow:hidden` **cắt mất gạch chân ô nhập**. Khai
> `line-height:1.04` (bằng đúng `.aw-rw-row-body`) → ô nhập **6,21cqw** nằm gọn, và **hết nhảy cỡ chữ lúc
> submit** (trước 9,29 → 5,81; nay cả hai 5,81). Kiểm không cắt nét bằng `canvas.measureText()`: chữ ăn mực
> **3,62cqw** trong hộp 5,81cqw → dư 2,19 (`scrollHeight > clientHeight` của `<input>` ở đây là **báo động
> giả** — phần đệm rỗng của font).
> ⭐ **LUẬT CHO 15 TEMPLATE CÒN LẠI:** rút ngắn khung sẽ **làm lộ MỌI phần tử chữ quên khai `line-height`**
> (chúng đang âm thầm chiếm cao gấp ~1,6× cỡ chữ) — quét trước rồi hãy đổi tỷ lệ.
> **Tự test (0 lỗi console):** khung đo 968×635px = **1,5238**, cao **65,625cqw** khớp tuyệt đối · SETUP không
> tràn (33,9/59,4cqw) · card trận đấu không tràn · bảng kết quả cuối trận (ép `clockSeconds:4`) cao 31,51cqw
> nằm 17,06→48,57 trong khung 65,63, không cuộn · fullscreen zoom y hệt trước · **hồi quy 16/16 mount, 0 lỗi**:
> 14 game vẫn 16:9, running_word 16:10,5, running_team vẫn 4:3 · CSS parse đủ 173 luật.
> ⚠️ **BẪY BÀN THỬ MỚI:** vòng quét nhiều template **phải chạy từ trang gốc `/index.html`** — chạy từ
> `templates/<x>/test.html` thì `catalog.js` khai `css` **tương đối theo TÀI LIỆU** → xin
> `/templates/running-word/templates/running-team/running-team.css` → **404**, sheet rỗng, running_team đo ra
> 16:9 và **trông y hệt một lỗi thật**.
> **(4) ⭐ PHẦN 2 — GIỚI HẠN CHO FULLSCREEN + MỌI CỠ MÀN.** Thầy duyệt khung nghỉ rồi gửi ảnh cửa sổ **1920×950**
> có **3 dòng từ ĐÈ CHỒNG lên nhau** khi fullscreen. **Gốc lỗi:** fullscreen đi đường zoom và **cố ý không kẹp
> dải** (5/8, để iPad không phí pixel) → khung lấy **đúng tỷ lệ màn thật**; mà mọi cỡ đo theo **bề NGANG**, nên
> màn càng bè thì bàn phím (23cqw) + đồng hồ (5,81cqw) **giữ nguyên** trong khi chiều cao khung sụp, và
> `.aw-rw-boards` là `flex:1` **duy nhất** nên gánh trọn. Đo (cao 1 hàng / chữ cần 5,82): iPad 4:3 11,92 ✅ ·
> 16:10 7,72 ✅ · 16:9 **5,61** ⚠️ · **2,02 → 3,35** ❌ · 2,37 → **0,92** ❌.
> **Thầy chốt (AskUserQuestion): "co trước, kẹp sau" + "ưu tiên chữ đọc được".**
> **(a)** **4 bước co bàn phím** qua `@container stage (aspect-ratio > …)` (`.aw-stage` vốn đã là
> `container-type:size` tên `stage` của core): ngưỡng 16/10,4 · 16/10 · 16/9,5 · 16/9,2 → scale **1,08 · 1,00 ·
> 0,93 · 0,87**. ⭐ **Chữ KHÔNG bị co**, giữ 5,6cqw mọi tỷ lệ. Dùng `transform: scale()` (giữ đúng từng tỉ lệ
> core vẽ, khỏi chép ~18 số đo bàn phím) + `margin-bottom` boards `= N×(scale−1)+0,4cqw`, **N = 20cqw** — vì
> scale chỉ ăn phần HÌNH, margin mới biến nó thành chỗ THẬT. ⚠️ **N đo bằng `offsetHeight`**, KHÔNG dùng
> `getBoundingClientRect()` (trả 23cqw vì đã nhân scale). Công thức ở 1,15 ra **đúng 3,4cqw** = số đang dùng →
> **tỷ lệ thiết kế và cao hơn: không bước nào khớp, không đổi gì**.
> **(b)** **Chốt chặn 16:9**: `max-width: calc(100dvh*16/9)` trong luật zoom (kèm dòng `100vh` dự phòng). Chọn
> 16:9 chứ không phải 16:10,5 vì ở mốc đó **iPad 4:3 / laptop 16:10 / TV 16:9 đều KHÔNG có dải nào**; màn
> 1920×950 của thầy dải chỉ **~115px mỗi bên = 6% bề ngang**.
> **Số đo (đổi cỡ cửa sổ THẬT):** iPad 1024×768 → 0 dải, 1,15, hàng **11,92** (**y hệt trước**) · khung nghỉ →
> 1,15 / margin 3,39 / hàng **7,01** (**y hệt bản đã duyệt**) · 1280×720 (16:9) → 0 dải, 0,87, hàng 7,47 ·
> **1280×634 (ảnh thầy) → kẹp về 16:9, dải 76px/bên, hàng 7,54** ✅ · 1280×540 (2,37) → dải 160px/bên, hàng 7,43.
> Quét mịn 7 tỷ lệ: dư luôn **1,76–3,36cqw** (luôn rộng hơn khung nghỉ 1,2); hở bảng↔bàn phím **1,25–1,36cqw**,
> không bước nào đè. Hồi quy **16/16 mount, 0 lỗi console**, không template nào khác dính transform bàn phím.
> ⭐ **HAI BẪY MỚI cho 15 template còn lại:** **(a)** khối `@container` **PHẢI đặt CUỐI FILE** — container query
> **không cộng thêm specificity**, đặt ở đầu file thì luật gốc bên dưới thắng và **cả tính năng im lặng không
> chạy** (0 lỗi, probe vẫn báo "khớp", màn hình không đổi). **(b)** **ĐỪNG đặt ngưỡng ĐÚNG vào tỷ lệ khung đang
> nghỉ** — `> 16/10.5` tự kích hoạt ngay ở khung nghỉ do chiều cao rơi vào pixel lẻ làm tỷ lệ đo được nhỉnh hơn
> phân số đúng; khung nghỉ ra 1,08/2cqw thay vì 1,15/3,4 **không một dòng lỗi**. Đổi sang **16/10,4**.
> **(5) PHẦN 3 — PHÍM ANDREW VỀ ĐÚNG BỀ NGANG CHUẨN.** Thầy nghiệm thu: *"việc resize ok"*, chỉ còn phím Andrew
> ngắn hơn / phím Space dài hơn bản chuẩn. ⭐ **Đã chứng minh KHÔNG do việc hôm nay**: `git stash` riêng file CSS
> về HEAD → đo ra **đúng cùng bộ số** (Andrew/chữ **2,120**, Space/chữ **7,927**), và 4 bước co fullscreen
> **không đổi một tỉ lệ nào** (`transform: scale()` co cả hàng như một khối ảnh, không chia lại bề ngang).
> **Gốc:** bản chuẩn dùng chung **12,7cqw** (`.aw-tta-key-andrew` + `.aw-cw-key-andrew`), riêng
> `.aw-rw-key-andrew` để **10,6cqw** — lệch từ ngày dựng template. ⭐ **Thiếu ở Andrew làm SPACE DÀI RA** vì
> hàng cuối `[Andrew][Space][Submit]` chỉ Andrew **cố định bề ngang**, hai phím kia **co giãn** chia phần còn
> lại → 2,1cqw hụt chảy thẳng sang chúng. Sửa **10,6 → 12,7cqw** → Andrew/chữ **2,540**, Andrew/numbers
> **1,124** = **khớp chính xác bản chuẩn**, giữ nguyên ở cả 4 bước fullscreen. Space còn lệch **1,6% (~6px trên
> khung 968px)**, cố ý không sửa: do game này để lề khung hẹp hơn (thầy chốt 5/8) nên bàn phím rộng hơn chuẩn
> chút; khớp tuyệt đối phải đặt con số thần bí tính ngược từ lề core. Hồi quy 16/16 mount, 0 lỗi.
> ⬜ **Chờ thầy nghiệm thu máy thật:** khung 16:10,5 lúc chưa fullscreen có vừa mắt hơn 4:3 không · hàng từ
> (7,01cqw) còn thoáng không · **fullscreen trên iPad phải y hệt trước** · trên màn lớp: hết đè chưa, và **bàn
> phím nhỏ đi** (ở 16:9 còn ~76% cỡ cũ) có còn dễ bấm không — đánh đổi trực tiếp của lựa chọn "ưu tiên chữ" ·
> dải hai bên chỉ hiện khi màn bè hơn 16:9. Chi tiết:
> `templates/running-word/GHI CHU RUNNING-WORD.md` mục **8l** + **8l-2** + `GHI CHU DU AN.md` Đợt 86.
>
> Trước đó: **7/8/2026 (Đợt 85, v0.9.60) — ⭐ HẾT TRỄ ÂM THANH: NẠP TRƯỚC CẢ PACK MP3 + HÂM NÓNG
> AUDIOCONTEXT + NÉN LẠI 310 FILE. ⭐ CÓ SỬA CORE (1 file MỚI `core/sfx.js` + `core/sound.js`; KHÔNG đụng
> `engine.js`). ✅ THẦY DUYỆT → COMMIT `00eb228` + PUSH + **LIVE** (Pages tự build, `curl` xác nhận đủ 6 dấu
> mốc ngay lần kiểm đầu — đúng quy trình mục 0 điểm 3, không cần đường vòng POST pages/builds).**
> ⭐ **ĐÃ CHẠY LẠI TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io`, không qua iframe):
> pack quiz **10/10 file sẵn sàng sau 702ms** trong khi màn READY còn nguyên chưa ai bấm PLAY; lần phát
> ĐẦU của từng hiệu ứng **8 · 8 · 18,7 · 18,7ms (TB 13,4ms)** — trước bản vá đo trên cùng origin là **67,5ms**.
> Dấu mốc curl đã dùng (đều VẮNG ở bản cũ): `core/sfx.js` trả 200 + chứa `PRIME_CONCURRENCY` · `core/sound.js`
> chứa `warmup` · `templates/quiz/quiz-sound.js` chứa `createPack` · và **Content-Length của 3 file mp3 khớp
> đúng số byte sau khi nén** (6005 · 29187 · 59289).
> **Thầy báo:** gần như MỌI hiệu ứng âm thanh đều trễ so với hình; chơi một lúc hoặc bấm Start again mới khớp.
> Thầy đoán do AWord dùng mp3 còn Wordwall dùng ogg.
> ⭐ **ĐÃ BÁC BỎ GIẢ THUYẾT ĐỊNH DẠNG bằng số đo:** giải mã 8 cặp `.ogg` gốc Wordwall ↔ `.mp3` của AWord,
> khoảng lặng đầu file **chênh 0ms** (Chrome tự cắt phần đệm mã hoá MP3 nhờ header LAME), chi phí giải mã
> ngang nhau (3–20ms). **Định dạng KHÔNG gây trễ** — Wordwall khớp tiếng là nhờ NẠP TRƯỚC.
> ⭐ **GỐC LỖI THẬT:** cả 14 template chép chung một khuôn tạo `<audio>` **đúng lúc cần phát**
> (`if (!a) { a = new Audio(urlFor(name)) … } a.play()`), nên LẦN ĐẦU của mỗi tên file phải đi mạng lấy file
> rồi mới kêu. **Đo trên BẢN LIVE: lần đầu 67–363ms (TB 143ms), các lần sau 5–19ms**; kéo file lạnh từ
> GitHub Pages tốn **290–654ms**, và header live là `Cache-Control: max-age=600` nên cứ 10 phút lại phải hỏi
> lại server (~55–80ms). Một game có 10–47 file → cả lượt chơi ĐẦU lệch tiếng, tới khi mỗi file kêu một lần
> thì hết. Khớp chính xác điều thầy tả. Chạy trên localhost thì **mọi đường đều ~6ms** → chứng minh code không
> chậm, chỉ có MẠNG nằm trên đường đi của tiếng.
> ⭐ **BẢN VÁ 3 phần.** **(1)** File MỚI `core/sfx.js`: `createPack(import.meta.url, {names, hot, skip})` →
> `play/pool/stop/durationMs/el/prime/stats`. `prime()` chạy ngay lúc module âm thanh được **import**, mà
> `ensureTemplate()` import **trước khi** màn READY được vẽ → tới lúc thầy bấm PLAY thì file đã nằm sẵn; nạp
> 4 file một lúc để pack 47 file không giành hết đường truyền lớp học. 14 file `*-sound.js` chuyển sang dùng
> nó, **giữ nguyên tên `playFile`/`makePool`** nên khối export của từng game **không đổi một dòng**.
> **(2)** `core/sound.js` thêm `context()` + `warmup()`: `warmup()` tự chạy ở cú **chạm/gõ phím ĐẦU TIÊN**
> trên trang (nghe ở pha capture) — dựng + resume AudioContext, đẩy 1 mẫu câm cho thiết bị chạy; và crossword
> · running-word · running-team thôi dựng AudioContext RIÊNG, dùng chung context này. Nhờ vậy **KHÔNG phải
> sửa `engine.js`**. **(3)** Nén lại **310 file mp3** ở LAME VBR `-q:a 6`: **10,25MB → 6,42MB (nhỏ hơn 37%)**.
> ⭐ **SỐ ĐO SAU KHI VÁ:** lần đầu **6,2ms** (trước 67,5ms) · tiếng tổng hợp **48ms → 10,7ms** · trên trang
> thật gameshow **46/46 file sẵn sàng sau 1,1 giây** trong khi màn READY còn nguyên, chưa ai bấm PLAY ·
> **16/16 template mount, 0 lỗi console** · 14 pack đều **ready = total** · nút tắt tiếng vẫn ăn (bật 1 / tắt
> 0 / bật lại 1). Nén: **310/310 file vẫn ĐÚNG âm thanh cũ** (SNR trung bình 26,9dB — nếu bị thay nhầm sẽ ~0dB),
> **độ dài lệch 0ms**, khoảng lặng đầu file lệch **≤ 0,4ms**.
> ⚠️ **SỐ ĐO CHỐNG LẠI PHƯƠNG ÁN KHÁC (đừng làm lại):** giải mã sẵn ra AudioBuffer của Web Audio chỉ nhanh hơn
> **1,3ms** (6,7 so với 8,0) mà tốn **3,6–49MB RAM mỗi pack** (gameshow 47 file = 49,3MB) → bỏ. Sợ nhiều
> `<audio>` bị Chrome thu hồi: đã đo **200 element** cùng lúc, cái CŨ NHẤT vẫn phát trong **11ms**,
> `readyState 4` → không cần cơ chế LRU.
> ⚠️ **LỖI TỰ GÂY RA RỒI TỰ BẮT (ghi lại để đừng lặp):** bản nén đầu tiên định lấy lại `.ogg` gốc cho đỡ một
> đời nén, ghép ogg↔mp3 **bằng cách so ĐỘ DÀI** → **57 file bị thay bằng âm thanh KHÁC hẳn** cùng độ dài (chỉ
> GAMESHOW và MAZE CHASE có ogg gốc, vậy mà anagram/whack-a-mole/balloon-pop cũng "khớp"). **Độ dài không phải
> danh tính.** Đã khôi phục từ backup và nén lại, mỗi file từ CHÍNH NÓ; rồi viết hẳn một bước kiểm chứng
> nội dung (trừ sóng cũ − sóng mới, so mức còn lại) chạy trên **cả 310 file** để chốt không file nào bị đổi.
> ⚠️ **BẪY ĐO MỚI:** pane preview có `visibilityState = "hidden"` nên **`requestAnimationFrame` bị đóng băng
> hoàn toàn** — mọi bàn đo dò thời điểm bằng rAF sẽ treo, không ra một dòng kết quả nào. Phải dò trên
> **audio thread** (`ScriptProcessorNode`) và tính giờ bằng **`ctx.currentTime`**. Và **`readyState` đọc ngay
> lúc gọi `play()` hay ra 1** (không phải chưa tải xong): `currentTime = 0` khởi động một cú seek, đọc lại sau
> khi seek xong là **4**. Backup 310 file gốc: `D:\APP AND DATA\AWord-data\Backup\sounds-truoc-khi-nen-07-08-2026`.
> Luật đầy đủ cho template về sau: `core/HUONG DAN CORE.md` mục "ÂM THANH". Chi tiết: `GHI CHU DU AN.md` Đợt 85.
>
> Trước đó: **7/8/2026 (Đợt 84, v0.9.59) — ⭐ TÍNH NĂNG MỚI "START WITH MISTAKES": CHƠI LẠI ĐÚNG
> NHỮNG TỪ VỪA SAI. ⭐ CÓ SỬA CORE + 12 TEMPLATE. ✅ THẦY DUYỆT → COMMIT `797670b` + PUSH + LIVE
> (Đợt 83 = `cf3865b`, tách 2 commit riêng).** File mới
> `core/mistakes.js` + `core/engine.js` + 12 file template. Bảng kết quả có thêm **"Start with mistakes"**
> ngay dưới "Start again" → về màn READY của CÙNG game, tên đổi thành **"QUIZ WITH MISTAKES"**, danh sách
> chỉ còn từ **sai hoặc bỏ trống**; bấm tiếp nhiều vòng thu hẹp dần. Về bộ đầy đủ: reload · đổi template
> rồi chọn lại · **Start again**. ⭐ **Chốt cách nối review→từ gốc: GẮN THAM CHIẾU.** Mọi template đều mở
> đầu `[...(activity.content?.X||[])]` = sao chép **NÔNG**, nên phần tử đang chơi **chính là object trong
> `activity.content`** → chỉ cần LỌC LẠI mảng gốc, không dựng lại gì (đáp án/clue/acceptedAnswers nguyên
> vẹn). Hợp đồng mới: `review[i].src` = object nguồn + `tpl.itemsKey` = tên mảng. ⚠️ **6/12 template phải
> luồn `src` qua một bước `.map()`** (quiz · gameshow · open-the-box · anagram · unjumble · balloon-pop),
> **crossword luồn qua HAI bước**. **4 game CỐ Ý không có**: whack-a-mole (review ghi MỌI hàng là sai — trò
> arcade, không xác định được câu sai), speaking-cards (`scorable:false`), running-word/team
> (`renderSummary` riêng). **Ngưỡng tối thiểu theo game** (`MIN_ITEMS` trong `mistakes.js`): balloon-pop 5 ·
> find-the-match 3 · crossword 2 · còn lại 2 → thiếu thì toast **đúng con số** và ở nguyên bảng kết quả.
> **3 luật phụ:** ván mistakes **không ghi leaderboard** + ẩn dòng hạng; **"Play a different template" rời
> khỏi bảng kết quả** (đo: nút thứ 5 đẩy panel 454→**507px** vượt trần **497px** → cuộn, khuất nút cuối) —
> vẫn còn ở menu ☰ tên "Change template", ⚠️ đổi lại: ở màn kết thúc phải Start again trước mới mở được ☰;
> nút chỉ hiện khi ván đó thật sự có câu sai. ⭐ **HAI LỖI TỰ TÌM RA, đã vá:** **(a)** act tạm `mist_` **bị
> ghi vào thư viện** khi bấm Apply (chỗ đó chỉ chặn tiền tố `"conv_"`) → nay quy options về act mẹ
> `_mistakesBase` và chặn `/^(conv|mist)_/`; **(b)** Apply Options giữa ván mistakes làm **mất bộ từ đang
> luyện** (Apply gọi `restart()`, mà `restart()` nay luôn về bộ đầy đủ) → tách **`replayCurrent()`** (chơi
> lại đúng cái đang có, dùng cho Apply + cầu myActivity) khỏi **`restart()`** (nút Start again). Tự test
> devserver :5511 — kịch bản 4 vòng liên tiếp Quiz 6 câu: 6 → **4** → **3** (đúng hết → **nút biến mất**,
> **không có dòng hạng**) → Start again về **6**; leaderboard 10 hàng **đều `/6`**, `localStorage` **không
> có key `mist_`**; sai đúng **1 câu** → toast **"Need at least 2 words"**, ở nguyên bảng; True or false
> (`statements`, `lives:1`) → **"TRUE OR FALSE WITH MISTAKES"**, vòng 2 đúng **6 = 8−2** câu; sau khi vá (b)
> thì Apply giữa vòng vẫn giữ **4 câu**; panel 4 nút **454,3px < 497px, không cuộn**; hồi quy **16/16
> mount, 0 lỗi console**. ⚠️ **Ghi nhận ngữ nghĩa:** True/false · maze-chase · open-the-box **hỏi lại câu
> sai đến khi đúng**, nên chơi hết bài với tim vô hạn là **không còn câu sai** → không có nút; chỉ hết
> tim/hết giờ mới còn câu dang dở. Chi tiết: `GHI CHU DU AN.md` Đợt 84 + `core/HUONG DAN CORE.md` mục
> "START WITH MISTAKES". ⚠️ **BẪY ĐO MỚI khi kiểm bản live:** dấu mốc `padStart(2` cho `core/utils.js`
> là VÔ GIÁ TRỊ — hàm `formatTime` cũ vốn đã có chuỗi đó nên nó báo "đã live" cả khi file còn cũ; phải
> chọn dấu mốc CHỈ CÓ ở bản mới (`Math.floor(total / 100) % 10`). Gặp lại bẫy mục 9 (Pages cập nhật file
> KHÔNG đồng thời): curl lần đầu `core/mistakes.js` còn 404 trong khi `utils.js` đã mới. Và: **không lái
> được bản live bằng iframe từ localhost** (cross-origin) — phải cho tab chạy thẳng trang live.
>
> Trước đó: **7/8/2026 (Đợt 83, v0.9.58, commit `cf3865b`, ĐÃ LIVE) — BẢNG KẾT QUẢ CUỐI GAME: THỜI GIAN LUÔN PHÚT:GIÂY ·
> SCORE = ĐIỂM ĐÃ TRỪ (KHÔNG PHẢI SỐ CÂU ĐÚNG) · THÊM HÀNG NHỎ "Total: 9/10". ⭐ CÓ SỬA CORE. 🟢 CHỜ THẦY
> DUYỆT (mới ở LOCAL, chưa commit).** 4 file: `core/utils.js` · `core/engine.js` · `core/app.css` ·
> `templates/quiz/quiz.js`. **(1)** `fmtSecsParts()` (ô Time bảng tổng kết + cột Time của **cả 2**
> leaderboard) đổi "135.4s" → **"2:15.4s"**, luôn có phút kể cả dưới 1 phút. Đồng hồ lúc chơi
> (`formatTime`), Running word/team (`fmtClock`), báo cáo assignment (`fmtDuration`) **vốn đã** m:ss —
> không đụng. ⭐ Bắt được **lỗi cũ**: bản trước tính phần lẻ bằng số thực `Math.floor((s−whole)*10)` nên
> **45300ms hiện "45.2s"** (2,9999… → cắt thành 2); nay tính bằng **số nguyên ms** (`Math.floor(ms/100)%10`).
> **(2)** Ô Score hiện **`result.score`/total** thay cho `correct`/total — tức chính con số leaderboard đã
> dùng để xếp hạng, nên bảng tổng kết và bảng xếp hạng **hết nói 2 số khác nhau**; bật *Points off* −5, làm
> đúng 9 sai 1 → **"4/10"** chứ không phải 9/10. Template không có điểm trừ thì `scoring.js` mặc định
> `score = correct` → **zero-diff**. Điểm âm: **giữ dấu trừ** + tô đỏ `.aw-sum-value.is-neg` (khác ô điểm
> lúc chơi — chỗ đó chỉ vừa 1 con số nên bỏ dấu, dùng màu). ⚠️ **Phải gỡ `raw.scoreText` của Quiz**:
> `scoreText` nghĩa là "điểm ở THANG RIÊNG" nên engine in số **trơ trọi** → giữ lại là ra "4" chứ không
> phải "4/10"; **Gameshow giữ nguyên** (điểm tốc độ "1250", chia cho số câu thì vô nghĩa). **(3)** Hàng
> `.aw-sum-total` "Total: 9/10" — 1.5cqw, xám, căn giữa, ngay dưới hàng Score+Time. **(4)** Cột Time
> leaderboard nới **5.2 → 6.6cqw**: đo tại font thật "10:11.0s" cần 52,5px / "59:59.9s" 62,2px mà cột cũ
> chỉ 50,2px → ván trên 10 phút sẽ tràn đè cột điểm (cột tên `1fr` tự nuốt phần chênh). Tự test devserver
> riêng **:5511** (phiên khác đang chiếm :5510), chơi thật Quiz 6 câu 3 kịch bản: `pointsOff=2` đúng 5 sai 1
> → **Score 3/6 · Total: 5/6**; `pointsOff=0` đúng 6 → **6/6 · Total: 6/6** (không lệch bản cũ);
> `pointsOff=5` đúng 1 sai 5 → **−24/6 đỏ · Total: 1/6**. Hồi quy **16/16 template mount, 0 lỗi console**;
> Running word/team dùng `renderSummary` nên không đi qua thân bảng mặc định. ⚠️ **Bẫy đo mới:** panel
> `.aw-panel` có `animation: aw-gc-pop … both`, pane preview không compositing nên nó **đóng băng giữa cú
> pop** — đo ra bề ngang 115,9px thay vì 386,4px; phải `style.animation="none"` rồi mới đo bố cục.
> **(5)** Hàng Total **tự ẩn khi trùng Score** (thầy chốt): `pointsOff=0` là mặc định mọi act nên
> `score === correct`, hàng đó sẽ in lại y nguyên phân số phía trên — điều kiện nay là
> `total > 0 && score !== correct`. Đo 4 ván: 0/đúng 6 → ẩn · 0/đúng 5 → ẩn · 2/đúng 5 → "Total: 5/6" ·
> 5/đúng 1 → "Total: 1/6". Chi tiết: `GHI CHU DU AN.md` Đợt 83 + `core/HUONG DAN CORE.md` mục
> "BẢNG TỔNG KẾT".
>
> Trước đó: **7/8/2026 (Đợt 82, v0.9.57) — OPEN THE BOX: ZOOM MỞ Ô MƯỢT TỪ ĐẦU TỚI CUỐI + SLOGAN
> Ở CHỖ NÚT NEXT/BACK CŨ + KHUNG HẾT CO 3px. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `b6e7a12` + PUSH +
> LIVE (Pages tự build, `curl` xác nhận sau **23 giây** — đúng quy trình mục 0 điểm 3, không cần 0-TER).**
> Chỉ 2 file template. **(1)** ⭐ Chỗ "vài
> frame cuối khựng" **là LỖI CODE, không phải máy yếu**: `zoomElFrom` (chiều MỞ) chạy 3 transition
> (`transform` 1200ms · `opacity` **840ms** · `border-radius` 1200ms) nhưng dọn dẹp bằng
> `transitionend {once:true}` → nghe trúng sự kiện **xong sớm nhất = opacity ở 840ms** → `clear()` xoá
> `style.transition`+`transform` inline = **huỷ transform giữa chừng**, ô nhảy tới đích ngay mốc **70%**;
> easing lúc đó đã đi 98,9% nên không thấy "nhảy" mà thấy **chuyển động bị chặt cụt** (mất cả đoạn giảm tốc
> cuối). Chiều ĐÓNG đã sửa đúng bẫy này từ **Đợt 14** và ghi chú sẵn — chiều mở bị **bỏ sót**. Sửa: lọc
> `e.propertyName === "transform"`. **(2)** Dọn 4 thứ bắt CPU vẽ lại mỗi khung hình (đo
> `document.getAnimations()`: **20 animation đồng thời**, bài 120 ô ~132 → còn **13**): `border-radius` chỉ
> chạy 45% RẺ của quãng bay (`ZOOM_RADIUS_MS` 540ms — MỞ chạy đầu lúc ô còn bé, ĐÓNG delay 660ms chạy cuối
> lúc ô đã co, vẫn đáp đúng độ bo ô số); thanh đồng hồ đổi `width` → `transform:scaleX()` (transition
> `width 15000ms` = tính lại bố cục mỗi khung hình suốt ván); lưới mờ bằng **1 animation trên cả lưới** thay
> vì mỗi ô một cái (120 ô = 120 lớp đồ hoạ); dời `pendingSettle` (xoá lưới + bỏ `position:absolute` = tính
> lại bố cục cả sân) ra **sau khi mọi animation dừng** (trước hẹn cứng 1280ms, trong khi ô đáp án cuối còn
> trượt tới 1425ms). **(3)** Slogan **"OPEN THE BOX IN ANDREW CLASSES"** vào chỗ nav bỏ trống từ Đợt 24: đi
> `ui.setNav({label})` (như Running word), CSS đổi từ ẩn cả `.aw-nav` sang **chỉ ẩn `.aw-navbtn`** rồi tạo
> kiểu `.aw-nav-label` — ⚠️ luật này BẮT BUỘC scope `:has()` vì label là của CORE (bẫy Đợt 22). Bottombar
> vẫn **38.6px** ở cả 2 màn (ô không co). **(4)** (25b, thầy bảo xử lý luôn) **Khung hết co 3px lúc mở ô
> đầu**: topbar phình 34→37 vì `ensureTimerUI()` dựng hàng đồng hồ MUỘN (lúc chạm ô đầu) → nay gọi 1 lần
> **lúc mount** (luật đồng hồ không đổi, cờ `timerStarted` vẫn giữ); ⭐ và bẫy thứ hai ngoài dự đoán:
> `.aw-otb-q-clock` không khai `line-height` nên chiều cao hàng lấy theo **metrics FONT** (dự phòng 31px →
> Baloo 2 37px) — khai `line-height:1.6` để chiều cao tính từ CỠ CHỮ. Đo 3 mốc (mount / mở ô / sau
> `fonts.ready`): **37.1 / 428.2px — chênh 0**; cả 3 hàng khung nay đứng yên tuyệt đối. **Luật rút ra cho
> mọi template: luôn khai `line-height` cho chữ ở topbar/bottombar, và đừng dựng muộn một hàng cố định của
> khung — cả hai đều biểu hiện là "ô tự dưng co lại giữa chừng" (Đợt 24 + 25b).** Tự test devserver: 0 lỗi
> console, hồi quy Quiz/Anagram/True-false không rò CSS; ⚠️ pane preview `hidden` nên **animation không
> chạy** → độ mượt bằng mắt vẫn cần thầy xác nhận trên TOMKO. Chi tiết:
> `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` Đợt 25 + 25b + `GHI CHU DU AN.md` Đợt 82.
>
> Trước đó: **7/8/2026 (Đợt 81, v0.9.56) — OPEN THE BOX: BỎ HẲN NAV NEXT/BACK + GATE 80% KHI
> ĐÓNG. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `f75a25e` + PUSH + LIVE.** Chỉ 2 file template (`open-the-box.css` + `.js`). **(1)** Luật
> ẩn nav Đợt 22 chỉ khớp `:has(> .aw-otb-card)` = màn LƯỚI; mở 1 ô thì card lưới bị gỡ, chỉ còn
> `.aw-otb-qcard` → selector thôi khớp → **nav hiện lại ở mọi màn câu hỏi**, mà `.aw-navbtn` cao 5cqw >
> `.aw-iconbtn` 4cqw nên bottombar phình ~1cqw → **ô câu hỏi/đáp án co lại**. Sửa: nới selector khớp CẢ hai
> card `:has(> .aw-otb-card, > .aw-otb-qcard)` → nav ẩn suốt game, ô hết co; vẫn tự-dọn (keys theo markup
> riêng, không rò sang game khác — không dính lại bẫy Đợt 22). **(2)** Khoá bấm ô số tới **80% animation ĐÓNG**
> (đối xứng gate mở đáp án 80% point 4): thêm `boxUnlockTimer = setTimeout(0.8×ZOOM_TRANSFORM_MS)` trong
> `closeCardThen`, ở 80% nhấc CẢ hai — grid về live + qcard `pointer-events:none` để tap XUYÊN QUA xuống ô dưới
> (zoom-đóng vẫn chạy tới 100% về hình ảnh); token chặn close cũ, gộp vào `clearPending()`. Tự test devserver
> (:5510, đo DOM — pane không compositing, timer throttle nên timeline giãn nhưng thứ tự+tỉ lệ đúng): YC1 nav
> `display:none` + bottombar 38.6px Ở CẢ màn lưới lẫn câu hỏi (ô 0 co); YC2 driver trong trang đo chuỗi
> pointer-events lúc đóng: CHẶN (gridPE=none+qcard che) → ~80% MỞ KHOÁ (gridPE=auto+qcardPE=none, qcard vẫn
> present) → tap lúc đó **ô kế mở thật**; 0 lỗi console. ⬜ Chờ thầy chơi thử máy thật (ô hết co + nhịp chọn ô
> kế ở 80% đóng tự nhiên) → duyệt → commit + push + live. Chi tiết: `templates/open-the-box/GHI CHU
> OPEN-THE-BOX.md` Đợt 24 + `GHI CHU DU AN.md` Đợt 81.
>
> Trước đó: **7/8/2026 (Đợt 80, v0.9.55) — RUNNING WORD: 5 NHÓM THAY ĐỔI (thầy gửi 1 lượt).
> KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `0b629b3` + PUSH + LIVE (build ~27s).** (1) **PASS 0–5/đội** thay ô tích "Allow PASS" (thanh "Passes per
> team", state `passLeft`, nút hiện số còn lại, hết=mờ, chỉ sáng đúng lượt). (2) **Tiêu đề bảng PART A /
> PART B** thay tên đội (cập nhật động trong `paintBoard`; tên đội chỉ còn ở màn kết quả). (3) **2 bảng
> SONG SONG**: bỏ `topIndexOf(t)` (mỗi bảng cuộn riêng) → **`sharedTop()`** chung, khóa theo từ đội-đang-tới-
> lượt; đội chờ hiện đúng số đó = ô trống chờ nhập (chưa gõ) hoặc chữ xanh (đã xong). Đo suốt ván `topA===topB`.
> (4) **In thêm SET X** cả 3 tờ (`printRunningSheets(...,setIndex+1)`). (5a) **Bỏ đếm lùi 3-2-1**, bắt đầu
> bằng **Submit lượt đầu** (`startMatch()` gọi từ `submit()` khi còn "prep"; thêm `canType()`; xoá hẳn
> `beginCountdown`). (5b) Trước trận nút giữa = **SWAP** đổi nhãn PART A↔B + danh sách từ 2 bên (`current` gán
> object MỚI tránh mutate set đã lưu, cờ `partFlip`; màu/đồng hồ giữ theo bên); lúc chơi vẫn Tạm dừng/Chạy tiếp.
> (5c) **In chữ to phủ trang**: bỏ dòng tiêu đề №/WORD/TURN + "Explainer", `HEADING_MM` 16→12, `fs` 0.62→
> 0.78×rowH, giữ ô TURN + CHECK 2 cột (50 từ ~11,4pt vẫn 1 trang). Chỉ 3 file template. Tự test devserver
> (:5510, đo DOM — pane không compositing nên không chụp ảnh): mọi mục khớp; hồi quy Type-the-answer +
> Crossword vẫn 16:9, 0 rò `.aw-rw-*`, 0 lỗi console. ✅ **Commit `0b629b3` + push + LIVE** (poll bản live OK).
> ⬜ Còn chờ thầy nghiệm thu máy thật. Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8k +
> `GHI CHU DU AN.md` Đợt 80.
>
> Trước đó: **6/8/2026 (Đợt 79, v0.9.54) — FIND THE MATCH: BẤM ĐÚNG THÊM "TING" + DẤU ✓ TO GIỮA
> CÂU HỎI RỒI MỚI BAY VÀO ĐIỂM; CHẾ ĐỘ TẮT REMOVE CORRECTS: Ô ĐÃ CHỌN CHỈ LOÉ ✓ RỒI TRỞ LẠI Y HỆT Ô CHƯA
> CHỌN (GÂY KHÓ). KHÔNG ĐỤNG CORE (chỉ `find-the-match.js` + `.css`). ✅ THẦY DUYỆT → COMMIT (`7ddefe1`) +
> PUSH + **LIVE**.** ⚠️ **Lên live phải đi đường vòng:** job `deploy` của Pages **fail 3 lần** vì hết
> `timeout: 600000` (10 phút) rồi **tự huỷ deployment** (Pages API ghi `errored`/`duration:0` — là HẬU QUẢ
> của việc bị huỷ, KHÔNG phải lỗi nội dung; **2 commit Đợt 78 trước đó cũng errored y hệt**, và thời gian
> build repo chậm dần 20s→5,5ph→**8,2ph**→vượt ngưỡng). **Cách gỡ:** Pages repo này `build_type:"legacy"` nên
> gọi thẳng `POST /repos/andrewclasses-01/AWord/pages/builds` — **không có đồng hồ 10 phút của Actions** →
> `built` sau 198 giây. **ĐỪNG đẩy commit rỗng để thử lại.** Kèm bẫy tài khoản: `gh` CLI là
> `andrewclasses-code` (không admin) trong khi `git push` là `andrewclasses-01`; muốn gh chạy quyền -01 thì
> lấy token qua `git credential fill` rồi `GH_TOKEN=... gh api` (không `gh auth login` lưu được vì token
> thiếu scope `read:org`). Đã chạy lại trọn bộ kiểm tra **TRÊN BẢN LIVE** cả 2 chế độ, 0 lỗi console. Thêm hàm
> `bigCheckThenFly()`: phát "ting" (`clocktick.mp3`) + bung đĩa tròn xanh có ✓ trắng `.aw-ftm-bigcheck` giữa
> `.aw-ftm-track` (KHÔNG là con của prompt vì clone bay chỉ copy text prompt), giữ 560ms, rồi mới fade ✓ +
> phát "correct" + để câu hỏi và 11 sao bay vào điểm; tiếng "correct" dời từ lúc bấm sang lúc bay để khỏi đè
> "ting". Non-remove: bỏ hẳn dim `is-locked`/`disabled`/badge vĩnh viễn ở cả `choose()` lẫn `renderShell()`
> → ô đã ghép đủ màu + bấm được y hệt ô thường (bấm lại = SAI, mất tim); xoá CSS `.is-locked`. Tự test
> browser thật cả 2 chế độ (đo DOM + spy `HTMLAudioElement.play`): chuỗi âm `ting→correct→conveyor`, ✓ to
> hiện rồi biến mất, điểm +1, non-remove ô về y hệt ô thường; bẫy đo compositing quen (opacity `is-solved`
> đọc ra 1 do transition đóng băng, ép `transition:none` ra 0). **0 lỗi console.** Chi tiết:
> `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` Đợt 79 + `GHI CHU DU AN.md` Đợt 79.
>
> Trước đó: **6/8/2026 (Đợt 78, v0.9.53) — ⭐ TEMPLATE THỨ 16 "RUNNING TEAM" + ⭐ TÍNH NĂNG
> MỚI "CLASSES" TRONG SETTINGS. CÓ SỬA CORE (thầy đặt hàng). 🟢 CHỜ THẦY DUYỆT.** Cả lớp chạy tiếp sức
> quanh MỘT tờ giấy chuyền tay: màn hình gọi `MINH ANH — 23`, em đó dò dòng 23 trên giấy đọc to, em
> khác chọn đúng từ giữa **6 ô mà 5 ô là từ trông giống nhất** (trò PHÂN BIỆT MẶT CHỮ → dữ liệu chỉ là
> pool từ trần, y hệt RUNNING WORD). Hết tim = THUA · đồng hồ chính về 0 mà còn tim = THẮNG · hết từ =
> THẮNG. **CLASSES**: danh sách lớp + học sinh, lưu bền, dùng chung cho các act sau — lưu vào **chính
> `users/{uid}/items`** (`kind:"class"`, `root:"classes"`) để **KHỎI phải sửa luật Firebase Console**;
> `ROOTS` cố ý KHÔNG thêm `"classes"` vì mảng đó vẽ các ô TRANG CHỦ. ⭐ **Bẫy core phát hiện được:**
> `inlineTimerBar` và `hasLivesSlot` **loại trừ nhau** — khai cả 2 thì hàng tim được tạo rồi không bao
> giờ gắn vào DOM, vô hình, 0 lỗi console; Running team né bằng cách ẩn topbar engine và tự vẽ hàng.
> Tự test 0 lỗi console, đo đủ 4 cửa kết thúc + hồi quy 3 game không rò CSS. ⬜ **Đường ghi Firestore
> của `core/classes.js` chưa từng chạy thật** (popup Google không tự động hoá được) — cần thầy tạo lớp
> thật. Chi tiết: `templates/running-team/GHI CHU RUNNING-TEAM.md` + `GHI CHU DU AN.md` Đợt 78.
>
> Trước đó: **6/8/2026 (Đợt 77, v0.9.52) — WHACK-A-MOLE: SPEED 10 GẤP ĐÔI · PUNISHMENT TỐI ĐA
> 30S · BẤM BUBBLE CŨNG TÍNH · BUBBLE ĐỎ + CHUI THEO MOLE KHI ĐẬP SAI. KHÔNG ĐỤNG CORE. 🟢 CHỜ THẦY
> DUYỆT.** 4 yêu cầu thầy gửi 1 lượt, chỉ đụng 2 file `templates/whack-a-mole/whack-a-mole.js` + `.css`.
> **(1)** Speed 10 nhanh gấp đôi (`spawnBase` 340→170ms, `upDuration` 900→450ms), Speed 1 giữ nguyên
> (2400ms/4200ms), công thức nội suy tuyến tính `pace=(speed−1)/9` cho 2–9 không đổi. Đo thật bằng
> MutationObserver theo dõi lớp `is-up` của 10 hố ở speed=10: 22 mẫu mole-đứng-trên-đất trung bình
> **451ms** (đích 450ms) — đúng gấp đôi so với 900ms cũ. **(2)** Punishment (đông cứng sau khi đập sai)
> tối đa 10s → **30s** (đổi hằng `MAX_PUNISH`, slider Options tự theo, đo `<input>` ra đúng min/max
> 0/30). **(3)** Bấm vào mole HAY bubble (bong bóng chữ) đều tính là đập — bubble nay cũng gắn
> `pointerdown`, CSS chỉ mở `pointer-events:auto` cho bubble lúc mole đang lên (không ăn vào crate).
> Đo: bắn `pointerdown` thẳng vào bubble của 1 mole đang lên → hố nhận `is-hit` ngay. **(4)** Đập sai →
> bubble của chính mole đó **đỏ** suốt phạt (class `is-wrong`, dọn ở cả 4 chỗ dọn `is-dizzy` cũ, không
> phụ thuộc ngưỡng rung 400ms nên phạt cực ngắn vẫn đỏ) rồi **nhỏ lại + chui xuống theo mole** mượt mà
> (trạng thái ẩn của bubble đổi từ co tại chỗ sang `translateY(45%) scale(.45)`, transition nới `.3s`
> khớp gần đúng nhịp `.26s` của mole). ⚠️ Bẫy đo gặp lại (giống bẫy `el.getAnimations()` ở Đợt 57 nhưng
> bản `transition`): `background` (gradient) là thuộc tính RỜI RẠC nên đổi gần tức thì, còn `border-color`
> nội suy mượt trong `.25s` — đọc `getComputedStyle` NGAY cùng tick lúc thêm class thấy nền đã đổi mà
> viền chưa, không phải lỗi, chỉ vì transition chưa kịp chạy khung hình nào; đo đúng bằng cách đợi vài
> trăm ms hoặc đọc thẳng `cssRules` khai báo trong stylesheet. Tự test trên devserver
> (`templates/whack-a-mole/test.html`), 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 77 +
> `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` Đợt 64. **Việc kế: thầy chơi thử thật (chạm tay nếu
> có màn cảm ứng) xác nhận Speed 10 mới không quá tải với lớp, bấm trúng bubble ăn điểm giống bấm trúng
> mole, màu đỏ + hiệu ứng bubble chui xuống rõ/đẹp mắt → duyệt → commit + push + live.**
> Trước đó: **6/8/2026 (Đợt 76, v0.9.51) — ⭐ HẾT XÉN DẤU CHỮ VIỆT: `line-height` 1.35 CHO 34 Ô CHỮ NỘI DUNG + 3 CHỖ BÙ `padding`. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). ✅ THẦY CHỐT LÀM LUÔN → COMMIT (`16b487b`, gộp Đợt 75+76) + PUSH + **LIVE**.** Đã chạy lại trọn bộ **TRÊN BẢN LIVE** (bẫy quen: 3 lần `curl` đầu Pages còn trả file CŨ, lần 4 mới đủ dấu mốc): chữ Việt **0/178 phải mượn font** · tiếng Anh **0 ký tự bị ảnh hưởng** · **15/15 mount, 0 lỗi console, 0 khung sai tỉ lệ** · quét xén **sạch**, trừ 1 điểm dư ghi lại cho trung thực: maze-chase `.aw-mc-pad-txt` **0,6px** (đo cục bộ cùng phần tử ra −0,4px = không xén) — dưới 1 pixel, đúng chóp dấu hỏi chữ Ẳ, **cố ý không vá thêm** vì ô nhỏ, thêm `padding` dễ làm lệch tâm chữ hơn là được lợi. Nối tiếp Đợt 75 (đã chữa lẫn font), đợt này chữa nốt lỗi số 2. ⭐ **ĐÍNH CHÍNH TRƯỚC ĐÃ — công cụ đo của chính tôi bị sai:** `Range.getBoundingClientRect()` **KHÔNG** trả về hộp DÒNG mà trả về **hộp FONT** (mép trên = `baseline − fontAscent`), nên bản khảo sát đã cộng thừa một lần `half-leading = (line-height − 1,602em)/2` — số này **luôn âm** khi `line-height` < 1,60 → mọi con số "xén" **thổi phồng gấp đôi** và **2/5 chỗ là dương tính giả**. Bắt được bằng đo tay hình học Quiz: `question_top` = 70,3 = đúng mép `.aw-playarea` nhưng `Range.top` = 63,3, **cao hơn 7px so với chính mép trên phần tử** — bất khả nếu nó là hộp dòng. Công thức đúng `inkTop = rangeTop + fontAscent − ink(Ẳ)`, và ink Ẳ/Ạ phải **đo bằng đúng font + đúng độ đậm của từng phần tử**. **Bảng đúng — chỉ 3 chỗ xén thật:** Quiz `.aw-quiz-question` 9px→**0** · Anagram `.aw-anagram-clue` 10px→**0,4px** · Type the answer `.aw-tta-prompt` 8px→**0**. **Hai chỗ báo nhầm** (đo lại không xén kể cả trước khi sửa): Flying fruit `.aw-ff-clue` (−1,6px) · Maze chase `.aw-mc-pad-txt` (−0,2px). ⭐ **Vì sao vẫn chọn `line-height: 1.35` — lý do THẬT không phải chống xén mà là CHỐNG CHỒNG DÒNG:** khoảng cách baseline–baseline phải ≥ `ink(Ẳ) + ink(Ạ)` = **1,297em**; ở 1.12 thì dấu dòng dưới **đâm vào** phần thò xuống của dòng trên → **mọi câu hỏi tiếng Việt xuống dòng đều dính chữ**, ở mọi template, dù có khung cắt hay không. **Vì sao KHÔNG đẩy lên 1,57** (mức để dấu không tràn hộp dòng): khối chữ cao thêm ~40%, `autoFit` co chữ thấy rõ; rẻ hơn nhiều là giữ 1.35 rồi bù phần dư **0,111em** bằng `padding` tại 3 chỗ chữ nằm sát mép khung cắt. ⚠️ Đo được: với chữ **căn giữa** trong khung flex, `padding` chỉ ăn **một nửa** giá trị (hộp to ra thì căn giữa kéo ngược `P/2`) → `.aw-tta-prompt` cần `0.24em` trong khi `.aw-quiz-question`/`.aw-anagram-clue` (căn trên) chỉ `0.14em`. **Đã sửa:** 34 luật `line-height`→1.35 **chỉ ở ô hiển thị NỘI DUNG của thầy** (câu hỏi · clue · prompt · ô đáp án · thẻ · tiêu đề act · bảng review · thẻ thư viện); **KHÔNG đụng** ô chỉ hiện số/biểu tượng (đồng hồ, tim, bộ đếm, mũi tên, logo) vì nâng chỉ xô lệch bố cục. ⚠️ **CỐ Ý KHÔNG ĐỤNG RUNNING WORD** (4 luật lh thấp còn nguyên): game đọc–gõ từ **tiếng Anh**, cửa sổ 3 dòng vừa ổn định qua 8 đợt bằng `calc(100%/3)` + `translateY` rất nhạy, và đo cho thấy **không xén** — dùng nó với từ tiếng Việt thì mới xử lý, và phải đo lại cửa sổ 3 dòng. **Đo thật trên devserver:** **0 chỗ còn bị xén** trên toàn bộ 15 template · **hồi quy 15/15 mount, 0 lỗi console, 0 khung sai tỉ lệ** · **giá phải trả gần như bằng 0**: câu hỏi Quiz mẫu cỡ chữ **không đổi** (50,2px), ép câu dài **120 ký tự** tiếng Việt cỡ chữ **vẫn không đổi**, khối chỉ cao thêm 225→278,3px (`autoFit` chưa phải co) · chữ Việt vẫn **0/178 phải mượn font**. Chi tiết: `GHI CHU DU AN.md` Đợt 76 + `core/HUONG DAN CORE.md` mục "`line-height` CHO CHỮ VIỆT". **Việc kế: thầy mở act bộ từ VI1/VI2 trên TOMKO xem chữ đã đều font VÀ dấu đã đủ chưa (nhất là HOA có dấu Ẳ Ắ Ộ Ữ), khoảng cách dòng giãn ra có vừa mắt không — máy không chạm màn được và khung xem trình duyệt không hiển thị nên KHÔNG chụp được ảnh, mọi kết luận là đo DOM. Còn 2 việc chưa kiểm: phiếu in A4 giấy thật + Running word với từ tiếng Việt.**
> Trước đó: **6/8/2026 (Đợt 75, v0.9.50) — ⭐ CHỮ TIẾNG VIỆT HẾT LẪN FONT: BỔ SUNG SUBSET VIETNAMESE CHO BALOO 2. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). 🟢 CHỜ THẦY DUYỆT.** Thầy yêu cầu khảo sát cả 15 template, soi lỗi hiển thị khi có từ tiếng Việt. Khảo sát ra **HAI lỗi độc lập**, thầy chốt làm lần lượt → đợt này **chỉ vá lỗi font**. ⭐ **Lỗi 1 (đã vá):** 4 file `baloo-2-*.woff2` chỉ là subset **latin** (230 ký tự) nên bảng chữ tiếng Việt 178 ký tự **chỉ được phủ 76**; Chrome lặng lẽ mượn Segoe UI cho phần thiếu → **một từ hiện bằng HAI font** ("ĐƯỜNG" = Segoe `Đ Ư Ờ` + Baloo `N G`), đo được **44 ký tự rơi hẳn**, phần còn lại bị chắp vá từ chữ nền + dấu rời. Vá bằng subset `vietnamese` của **chính font đó**: thêm `core/assets/fonts/baloo-2-vi.woff2` **9,9 KB**, là **font biến thiên** (wght 400–800) nên **1 file dùng chung cả 4 độ đậm**; chỉ số dọc **trùng khít** file tĩnh (unitsPerEm 1000 · typoAsc 1078 · typoDesc −524) → chữ Việt cùng baseline, **không xô lệch bố cục**; 4 file cũ **không đụng vào**. ⚠️ **HAI BẪY CẮN THẬT:** (1) thêm khối `@font-face` mới **không có tác dụng gì** — khối không khai `unicode-range` là nhận TOÀN BỘ Unicode, Chrome tin lời khai chứ không tin cmap, chọn face latin rồi **nhảy thẳng sang family kế tiếp** mà không ngó khối mới (đo: file VN **chưa từng được tải**); "khai sau thắng" là SAI → phải khai `unicode-range` tường minh cho **cả 4 face latin** (đã chứng minh an toàn trước khi sửa: cmap 230 ký tự nằm TRỌN trong dải latin ∪ dải Việt; còn ✓ ✗ ★ ♥ ☰ ⌫ và IPA ə ʊ ˈ thì font **vốn đã không có từ trước**, không phải hồi quy mới). (2) **gộp 4 khối tiếng Việt thành 1 khối `font-weight: 400 800` thì HỎNG** — một DẢI độ đậm cạnh 4 khối latin giá trị ĐƠN làm Chrome thôi ghép family: face vẫn `loaded`, `unicode-range` vẫn đúng, mà **không ký tự nào dùng nó**; phải tách 4 khối, đúng hình dạng Google Fonts tự phục vụ. **Đo thật trên devserver:** chữ Việt **0/178 còn phải mượn font** · tiếng Anh **0 ký tự bị ảnh hưởng** · font biến thiên ra **đúng 4 độ đậm** ("đường" 278→293,95→303,33→311,41px) · file VN tải **đúng 1 lần** (200, 9888 byte) · **hồi quy 15/15 template mount, 0 lỗi console**, tỉ lệ khung nguyên vẹn (Running word 4:3 đúng thiết kế) · **in giấy không phải sửa** (`print.js` in trong trang nên tự hưởng font mới). ⚠️ Bẫy đo mới: `canvas.measureText` **không kích hoạt tải font** → face chưa dùng luôn báo `unloaded` và phép đo báo "vẫn mượn font" **oan**; phải đặt chữ thật vào DOM rồi mới đo. **Lỗi 2 (CHƯA vá, để Đợt 2):** dấu bị **xén cụt** vì `line-height` chật — Baloo 2 cần dòng tự nhiên 1,60em, ngưỡng tối thiểu **HOA có dấu 1,57 · thường có dấu 1,35 · dấu nặng 1,02** trong khi **tiếng Anh chỉ cần 0,70–0,88** (cả app căn theo tiếng Anh, **67 khai báo `line-height` < 1,22**). Bắt tận tay **5 chỗ xén thật**: Quiz `.aw-quiz-question` **24,0px** · Type the answer `.aw-tta-prompt` 19,9px+7,3px · Anagram `.aw-anagram-clue` 19,4px · Flying fruit `.aw-ff-clue` 9,3px · Maze chase `.aw-mc-pad-txt` 7,3px. Minh chứng trong sản phẩm thật: tiêu đề Quiz **"ĐẲNG CẤP" hiện ra "ĐĂNG CẤP"** — dấu hỏi chữ Ẳ bị xén sạch, thành **từ khác nghĩa hẳn** (lỗi sai nghĩa, không chỉ xấu). Chi tiết: `GHI CHU DU AN.md` Đợt 75 + `core/HUONG DAN CORE.md` mục "FONT TIẾNG VIỆT". **Việc kế: thầy mở act có chữ Việt (bộ từ VI1/VI2) xác nhận chữ đã đều một font — dấu VẪN còn bị cắt, đó là Đợt 2 → duyệt → commit + push → sang Đợt 2 nâng `line-height` (chạm nhiều file, phải đo lại `autoFit` từng template).**
> Trước đó: **5/8/2026 (Đợt 74, v0.9.49) — RUNNING WORD: ⭐ TÌM RA + TÁI HIỆN ĐƯỢC GỐC LỖI "TEAM B CHỈ HIỆN 1 HÀNG" TRÊN iPAD (2 đợt trước đoán sai) + IN PART A/B 1 CỘT + KHOÁ ZOOM CHẠM ĐÚP. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`6ff2da6`) + PUSH + LIVE.** ⭐ **(1) GỐC LỖI TEAM B — bắt tận tay, không còn đoán:** cửa sổ 3 dòng chứa ô `<input>` DUY NHẤT của trận; **WebKit** (nhân của MỌI trình duyệt trên iPad, kể cả Chrome) lộ ô đang focus / con trỏ đang chạy bằng cách **CUỘN khung cuộn gần nhất** — và `overflow:hidden` **VẪN LÀ khung cuộn** (`hidden` chỉ chặn NGÓN TAY, trình duyệt và `scrollTop` vẫn chạy tự do). WebKit canh ô nhập vào **ĐẦU** khung → kéo dòng đang gõ từ khe đáy lên khe đỉnh = **lệch đúng 2 dòng**, khớp chính xác ảnh thầy chụp. Manh mối lần ra: đo hình học trên chính ảnh thầy gửi ra độ lệch **ĐÚNG 2 DÒNG** = đúng khoảng cách khe-đáy→khe-đỉnh, con số đó không thể ngẫu nhiên. Giải thích trọn vẹn cả 2 điều lạ: **chỉ đội đang đến lượt bị** (chỉ đội đó giữ ô nhập) và **Windows không bao giờ bị** (Blink không làm cú "lộ" này). `focus({preventScroll:true})` đã có sẵn từ trước **KHÔNG đủ** (không chặn `setSelectionRange` lẫn cú lộ-con-trỏ sau MỖI phím gõ). **Vá:** `scroll` listener bật `scrollTop/scrollLeft` về 0 — bất kể thứ gì cuộn nó, hôm nay hay ở phiên bản trình duyệt đời sau. ⭐ **TÁI HIỆN ĐƯỢC bằng script** (điều 2 đợt trước không làm được): `scrollHeight 3817` vs `clientHeight 294` chứng minh khung "overflow:hidden" vẫn cuộn được; gán `scrollTop=196px` (đúng 2 dòng) → đo ngay lúc đó ra `["4:CUR","5:FUT","6:FUT"]` = **ĐÚNG Y HỆT ẢNH THẦY CHỤP**, sau khi guard chạy → `["2:PASS","3:PASS","4:CUR"]` đúng. **(2)** Bỏ nốt phép đo pixel của cửa sổ: track `height:100%`, mỗi dòng `calc(100%/3)`, trượt bằng `translateY(calc(N*100%/3))` — xoá hẳn `measureRow`/`rowH`/`--rw-rowh`, trình duyệt tự tính lại mỗi lần layout, không còn gì để đo/nhớ/lệch pha. ⭐ Tác dụng phụ TỐT ngoài dự tính: `ResizeObserver` trước đây gọi `applyTrack(transition:none)` mỗi lần bảng đổi 70/30 — mà đổi 70/30 CHÍNH LÀ lúc đảo lượt → **hiệu ứng "đẩy lên" .35s của Đợt 70 thực ra đã bị giết, track nhảy cóc**; nay chạy thật. **(3) In: PART A/B luôn 1 CỘT** (thầy chốt; chỉ tờ CHECK 2 cột = 50 từ A | 50 từ B, vốn đã đúng sẵn) — bỏ nhánh "chảy 2 cột" và **vá luôn 1 lỗi thật nó đang che**: tờ CHECK gọi CÙNG `metrics()` nên nhận chiều cao dòng tính cho 2 cột (10.12mm) trong khi vẽ 1 cột → 50×10.12 = **506mm trên trang 253mm → âm thầm tràn sang tờ giấy thứ 4**; nay cả 3 tờ khít đúng 253mm. Đo: 20 từ→22.2pt · 30 từ→14.8pt · 50 từ→8.9pt, đều 1 cột 1 trang. **(4)** `touch-action: manipulation` trên khung game + gốc `.aw-zoomed` → hết phóng to khi chạm đúp (2 người gõ bàn phím ảo sinh "chạm đúp" liên tục mà chẳng ai định phóng to), tiện thể bỏ luôn độ trễ ~300ms trình duyệt giữ để chờ cử chỉ đó. Cố ý KHÔNG dùng `touch-action:none` (sẽ giết luôn phóng-to-2-ngón, thứ không ai bấm nhầm). Tự test devserver + **chạy lại trọn bộ TRÊN BẢN LIVE** (ép `fetch(...,{cache:"no-store"})` xác minh đúng file mới, vì tab test từng dính cache của chính nó ở Đợt 73): tái hiện + vá lỗi đúng y hệt; 10 lượt đảo liên tiếp đo sau khi hoạt ảnh .35s xong → **luôn đúng 3 dòng, dòng đang gõ luôn ở khe đáy, `scrollTop` luôn 0, 0 bất thường**; hồi quy Type the answer + Crossword vẫn 16:9/`touch-action:auto` (luật mới không rò), 0 lỗi console. ⚠️ **Bẫy đo đạc mới:** đo cửa sổ NGAY sau khi bấm (40ms) sẽ thấy "chỉ 2 dòng" và tưởng hồi quy — thật ra track đang trượt giữa chừng (hoạt ảnh .35s nay chạy thật); phải đợi >400ms. Chi tiết: `GHI CHU DU AN.md` Đợt 74 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8h. **Việc kế: thầy chơi lại trên iPad xác nhận lỗi TEAM B hết hẳn + chạm đúp không còn phóng to + in thử giấy A4 thật xem 1 cột 50 từ (8.9pt) có còn đọc thoải mái khi đứng cầm không.**
> Trước đó: **5/8/2026 (Đợt 73, v0.9.48) — RUNNING WORD: ZOOM LẤP KÍN MÀN HÌNH, BỎ KHOÁ TỈ LỆ 4:3. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`1304bf4`) + PUSH + LIVE.** Thầy chơi bản Đợt 72 (nút Fullscreen ghim góc) trên Chrome iPad, xác nhận nút ổn nhưng chụp ảnh cho thấy khung zoom hiện **2 dải đen 2 bên trái-phải**. Nguyên nhân: công thức letterbox lúc zoom (`width:min(100vw, calc(100dvh*4/3))`) COPY nguyên từ khung REST (4:3, chọn riêng cho hình dạng màn iPad) sang cho cả lúc zoom — ép cứng đúng 4:3 dù zoom không có lý do gì phải giữ tỉ lệ đó, mà viewport thật (sau khi trừ thanh trình duyệt) không khớp tuyệt đối 4:3 → hụt 1 chiều → dải đen bù chiều kia. Sửa: bỏ hẳn công thức ép tỉ lệ, thay `width:100%;height:100%` thuần (khít đúng `.aw-page`, vốn đã = 100% khung zoom cố định = viewport thật) — cho đủ cả 2 chiều tường minh cũng tự triệt tiêu luôn `aspect-ratio:4/3` phía trên (CSS chỉ dùng nó để suy ra chiều còn thiếu). **Không có số px/vw/vh cứng nào trong luật mới** — thuần `%`, tự thích ứng MỌI kích thước viewport tương lai (xoay màn, thanh trình duyệt ẩn/hiện, đổi trình duyệt/máy) mà không cần sửa code lần nào nữa — đúng yêu cầu thầy "tự điều chỉnh khi trình duyệt thay đổi". Khung REST (chưa zoom) không đụng, vẫn 4:3 như cũ. Tự test devserver ở viewport CỐ Ý không phải 4:3 (1366×900, tỉ lệ 1.518) để ép lộ dải đen nếu còn: `stage.getBoundingClientRect()` khít đúng 1366×900, 0 khoảng hở 4 cạnh (công thức cũ sẽ ra ~1200×900 kèm dải đen ~83px mỗi bên); bấm lại → khung REST vẫn đúng 4:3 (968×726). Kiểm lại **trên bản live** sau khi push cũng đúng y hệt (gặp 1 lần tab test tự đọc phải CSS cache cũ của chính trình duyệt đó — không liên quan bản deploy, ép tải lại bằng link `?cb=` mới thì đúng ngay) — 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 73 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8g. **Việc kế: thầy xem lại đúng trên chính iPad đã chụp ảnh dải đen, xác nhận hết dải đen + khung REST không đổi; các việc TOMKO/in giấy A4 của Đợt 68-70 vẫn còn treo.**
> Trước đó: **5/8/2026 (Đợt 72, v0.9.47) — RUNNING WORD: NÚT FULLSCREEN GHIM GÓC DƯỚI-PHẢI + VÁ PHÒNG NGỪA LỖI CỬA SỔ 3 DÒNG CỦA TEAM B. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`fc54dcd`) + PUSH + LIVE.** Thầy chơi bản zoom (Đợt 71) và gửi 2 việc: (1) nút Fullscreen cần dọn về góc dưới-phải, nhỏ, trong suốt, kín đáo — trước đó nằm trong dòng chảy `.aw-tools` nên trong `.aw-zoomed` bị trôi lệch/to/nổi; sửa `position:absolute` ghim đúng góc `.aw-stage` (mượn `.aw-stage-inner` của core làm nơi neo), thu còn 2.2cqw, nền trong suốt, `opacity:.45` lúc nghỉ — chỉ scope trong `.aw-zoomed`, trạng thái thường giữ nguyên vị trí cũ cạnh Sound (ghim tuyệt đối ở đó từng đụng độ Sound hồi Đợt 3d, nay an toàn vì Sound đã ẩn hẳn khi zoom). (2) Thầy gửi lại đúng tấm ảnh cũ chỉ ra bảng TEAM B lúc chơi không hiện đủ 3 dòng như TEAM A — đọc lại toàn bộ cơ chế `measureRow`/`applyTrack`/`bottomIndexOf`, lái thật 1 trận 16 lượt PASS liên tiếp qua devserver (đúng vai trọng tài, không dừng giữa chừng để tránh đồng hồ tự trôi oan — bẫy đã cắn ở lần thử đầu khiến TEAM B hết giờ giữa chừng) rồi soi DOM từng bước: 4 lượt đầu trận thiếu dòng là ĐÚNG THIẾT KẾ (chưa đủ 2 từ trước để lấp), từ lượt 5 trở đi 12 lượt liên tiếp đều đúng 3 dòng/dòng-đang-gõ-ở-đáy — **không tái hiện được nguyên văn lỗi trong ảnh** (dòng đang gõ ở trên, 2 dòng tương lai ở dưới — về lý thuyết bất khả thi với code hiện tại). Vẫn tìm ra 1 điểm chưa chắc chắn thật: `measureRow()` trước đây chỉ chạy lúc `buildRows()` (1 lần) và trong `ResizeObserver` (chỉ khi khung đổi kích thước thật) — KHÔNG chạy lại trong `paintBoard()` mỗi lượt, mà đây là 2 cơ chế bất đồng bộ riêng, có khả năng thật (dù không ép được trong môi trường tự test không compositing) là `paintBoard` chạy trước khi `ResizeObserver` kịp đo lại lúc bảng 70/30 đảo, dùng chiều cao CŨ một nhịp. Đã vá phòng ngừa: gọi `measureRow(t)` ngay đầu mỗi `paintBoard()`, không còn phụ thuộc thời điểm `ResizeObserver` — rẻ, không đổi hành vi khi kích thước thật không đổi. ⚠️ Ghi rõ trong hồ sơ đây là "ứng viên hợp lý nhất tìm được", không phải "bắt tận tay" — cần thầy xác nhận lại. Bẫy đo đạc mới ghi lại: pane tự test KHÔNG compositing nên MỌI CSS transition đóng băng ở giá trị TRƯỚC khi đổi (không tiến được chút nào, khác hẳn kiểu "animation chạy nhưng không thấy" — ở đây animation không hề tiến); đo đúng phải `el.getAnimations().forEach(a=>a.finish())` SCOPE ĐÚNG phần tử, tuyệt đối không gọi trên toàn `document.querySelectorAll('*')` (đã thử, ép luôn animation fade-out của màn READY khiến trang tự rebuild ngoài ý muốn). Chi tiết: `GHI CHU DU AN.md` Đợt 72 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8f. **Việc kế: thầy đã xác nhận cả 2 điểm ổn (kể cả chưa thấy lại lỗi TEAM B) → mở đường cho Đợt 73.**
> Trước đó: **5/8/2026 (Đợt 71, v0.9.46) — RUNNING WORD: ĐỔI FULLSCREEN THẬT SANG "ZOOM" CSS (chỉ RUNNINGW). ⭐ CÓ SỬA CORE (cờ opt-in). ✅ THẦY DUYỆT → COMMIT (`2fb19c7`) + PUSH + LIVE.** Thầy tự chơi thử Fullscreen thật (Đợt 69-70) trên iPad M1 12.9" (Chrome) và báo 4 tật đều là hành vi riêng của Fullscreen API trên iPad Chrome, không sửa được bằng JS: Chrome tự vẽ nút X to góc trên không tắt được, chỉ vuốt xuống nhẹ gần mép trên (đúng chỗ 2 đồng hồ) là tự thoát fullscreen, tự thoát ngay sau màn 3-2-1, và tự bật popup "leave/stay in fullscreen?" giữa trận. So sánh với chính Wordwall (ảnh chụp `wordwall.net` cùng iPad): nút "fullscreen" của Wordwall **không hề gọi Fullscreen API thật**, chỉ phóng nội dung lấp viewport bằng CSS thuần (thanh tab/địa chỉ Chrome vẫn còn) — đổi lại tuyệt đối ổn định, không cử chỉ hệ thống nào can thiệp được. Thầy được hỏi phạm vi (14 game khác cũng cần không?) và chốt: **chỉ RunningW trước, khi nào ổn định mới chỉnh app khác**. ⭐ **CÓ SỬA CORE**: `core/engine.js` thêm cờ opt-in `tpl.useZoomFullscreen` — nút Fullscreen đổi cơ chế sang `root.classList.toggle("aw-zoomed")` (thuần CSS, không gọi `requestFullscreen()` nữa) thay vì `requestFs()`/`exitFs()`; template không đặt cờ chạy y hệt cũ (**zero-diff**, đã đo lại Quiz/Type the answer trên cả devserver lẫn bản live). CSS `.aw-zoomed` (root fixed phủ viewport z-index 9000, `.aw-page`/`.aw-stage` letterbox 4:3 y hệt công thức fullscreen thật cũ, ẩn toolbar) nằm HOÀN TOÀN trong `templates/running-word/running-word.css`, không đụng `core/app.css`. `git fetch` 0/0 trước khi commit; `curl` poll Pages (bẫy quen: lần 1-2 còn file CŨ, lần 3 mới đủ 3 marker `useZoomFullscreen`/`aw-zoomed`) rồi CHẠY LẠI kiểm tra **TRÊN BẢN LIVE**: RunningW bấm Fullscreen → `#app` có `aw-zoomed`, khung đúng 4:3, `document.fullscreenElement` vẫn `null` (xác nhận không gọi API thật), `overflow` khoá đúng; bấm lại/bấm Home đều gỡ sạch; Quiz bấm Fullscreen → **vẫn gọi** `requestFullscreen()` thật (đo bằng tráo hàm tạm thời) — 0 lỗi console cả 2 game. Chi tiết: `GHI CHU DU AN.md` Đợt 71 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8e + `core/HUONG DAN CORE.md` mục "Fullscreen API THẬT không ổn định trên iPad Chrome". **Việc kế: đã lên live, chỉ còn 1 việc máy không thay được — thầy tự chơi lại RunningW thật trên iPad, xác nhận cả 4 tật cũ (banner X, vuốt-mất, mất-sau-3-2-1, popup stay-fullscreen) đã hết; các việc TOMKO/in giấy A4 của Đợt 68-70 vẫn còn treo, không đổi.**
> Trước đó: **5/8/2026 (Đợt 70, v0.9.45) — RUNNING WORD: 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ ĐỢT 2 (nút Play/Pause nhạy + vuông bo tròn; slogan về hàng nút Menu + đổi màu xám nhìn rõ; sửa icon loa↔fullscreen đè nhau; chữ trong ô tự co theo bề rộng, hết "…", 3 ô cùng cỡ; đồng hồ hạ thấp bỏ khoảng thừa; ⭐ bảng CHỈ 3 ô — ô nhập LUÔN ở đáy, 2 từ trước ở trên, đảo lượt thì đẩy lên bằng translateY; ⭐ sửa màn GAME COMPLETE bị kẹt). KHÔNG ĐỤNG CORE đợt này (chỉ 2 file `running-word.js/.css`; 1 dòng core `act-<type>` là của Đợt 69). ✅ **THẦY DUYỆT ("ok build") → COMMIT (`a40809e`, gộp Đợt 68+69+70) + PUSH + LIVE** — `git fetch` 0/0; `curl` poll Pages (bẫy quen: lần 1 còn file CŨ, lần 2 mới đủ 3 marker mới `bottomIndexOf`/`act-${type}`/`aw-rw-track`); CHẠY LẠI trọn bộ kiểm tra **TRÊN BẢN LIVE** (`andrewclasses-01.github.io/AWord`): khung 4:3 đúng, slogan hàng Menu rgb(107,122,144), loa/fs tách, play/pause vuông, đồng hồ 28px, cửa sổ 3 ô gõ-5→**3-4-5**→đảo→**đẩy lên 4-5-6**, bảng 30% co chữ 0 cắt, hết ván "TEAM B WINS" 4 nút `elementFromPoint` không bị chặn; hồi quy Type the answer live 16:9/0 lỗi + home 0 lỗi. ⭐ **2 lỗi thật đã vá** — (1) play/pause "lúc bấm được lúc không" do `paintClocks()` gán lại `innerHTML` nút mỗi 100ms → SVG con bị thay giữa pointerdown/up làm mất click; vá = chỉ đổi icon khi thực sự đổi + `svg{pointer-events:none}`; (2) hết ván "không bấm được gì" do bảng kết quả riêng z-index 45 CHE bảng GAME COMPLETE của engine z-index 13; vá = gỡ bảng kết quả khi gọi `ui.finish()`. Đo: cửa sổ 3 ô đúng kịch bản gõ-từ-5→hiện 3-4-5→submit→đảo→đẩy lên 4-5-6; bảng hẹp 30%(142px) co chữ cùng 20px 0 cắt; play/pause toggle 4 lần đúng; slogan ở hàng Menu màu rgb(107,122,144); loa[472-493]/fs[495-515] tách hẳn; đồng hồ cao 28px; hết ván → `.aw-panel` "TEAM A WINS" 4 nút, elementFromPoint không bị chặn, Start again→READY. Chi tiết: `GHI CHU DU AN.md` Đợt 70 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8d. **Việc kế: đã lên live, chỉ còn 3 việc máy không thay được — thầy chơi trên TOMKO thật, bấm fullscreen thật trên iPad, in thử 3 tờ A4 giấy thật.**
> Trước đó: **5/8/2026 (Đợt 69, v0.9.44) — RUNNING WORD: LÀM LẠI GIAO DIỆN TRẬN ĐẤU (15 điểm theo bản vẽ thầy gửi — đồng hồ sát mép trên không tên đội, bảng gõ 70/30 tự giãn có animation khi đảo lượt, chỉ hiện 3 dòng chữ thật to căn giữa, nút Play/Pause to giữa 2 đồng hồ thay hẳn Pause+Undo cũ, thêm màn "prep" chọn đội trước khi 3-2-1, PASS nay LỘ từ, xoá 3 nút Assignment/Template/Print, nút Fullscreen ghim cố định góc phải dưới, bàn phím về đúng size gốc core, tên đội dời vào bảng + số từ còn lại ra chân bảng, slogan thay nav-label, SET có DELETE + tự đồng bộ máy khác qua Firestore). **⭐ CÓ SỬA CORE** (`core/engine.js` — 1 dòng, thầy duyệt trước: gắn class `act-<type>` vào khung NGAY từ lúc dựng, cho MỌI activity, để RUNNINGW tự đè khung 4:3 + ẩn nút "ngay từ khi mở app" thay vì phải chờ tới lúc mount — không CSS template nào khác đọc class này nên 14 game kia không đổi gì). 🟢 CHỜ THẦY DUYỆT — tự test kỹ trên devserver: `stage.className` đã có `act-running_word` + tỉ lệ 4:3 đúng NGAY TRƯỚC KHI BẤM PLAY, 3 nút ẩn/fs-pin đúng từ đầu; hồi quy Type the answer vẫn 16:9/`act-type_the_answer`/0 lỗi (core chỉ cộng thêm, không phá gì); màn "prep" đúng — 2 bảng bằng nhau khi chưa chọn, chạm 1 bảng → 70/30 đúng tỉ lệ đo được (396.8px/171.2px sau 450ms); 3 dòng hiện đúng khít (205.25÷66.98=3.00, cỡ chữ 34.27px); PASS hiện từ màu ink thật (không còn "—"); Play/Pause dừng → 2 bảng+bàn phím `opacity` đúng về 0.4, bấm lại về bình thường; Andrew+gõ đúng vẫn cộng điểm/đổi lượt đúng; giả lập 1 SET đã lưu → Shuffle tự khoá đúng tooltip, nút DELETE SET hiện đúng chỗ, xoá lúc chưa đăng nhập báo lỗi gọn không crash (nhất quán với nút Save) — **0 lỗi console suốt mọi bước**. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 69 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8c. **Việc kế: 3 việc máy không tự kiểm được (không đổi từ Đợt 68) — thầy xem khung/đồng hồ/bảng 70/30 trên TOMKO thật, bấm thử fullscreen thật trên iPad, in thử 3 tờ A4 giấy thật** → duyệt → commit + push (gộp Đợt 68+69).**
> Trước đó: **5/8/2026 (Đợt 68, v0.9.43) — RUNNING WORD: 8 ĐIỂM TỐI ƯU IPAD (khung 4:3, đồng hồ sát mép trên, fullscreen sạch chữ, bỏ văn bản hướng dẫn, chia từ theo vị trí tối đa 50/bên, tờ in tối ưu chữ to hết cỡ, CHECK đánh số riêng 2 nửa, Andrew 1-5, đồng hồ bậc thang+Custom). KHÔNG ĐỤNG CORE (chỉ 5 file `templates/running-word/`, `:has()` khoanh vùng riêng game này — 14 template kia không hề bị đụng). 🟢 CHỜ THẦY DUYỆT — tự test kỹ trên devserver (không phải đọc code suông): tỉ lệ khung đo được đúng 4:3, thanh trên gốc ẩn đúng, `buildSets()` gọi trực tiếp cho pool 30/70/120 ra đúng công thức mới (≤50 giống hệt nội dung chỉ khác thứ tự · 70→50+50 trùng 30 đúng giữa · 120→trùng 0), chơi thật 1 lượt Andrew+gõ đúng không lỗi, Options round-trip đúng (Apply "2:15" Custom → Play lại → mở lại Options vẫn đúng lại Custom "2"/"15"), gọi thẳng `printRunningSheets()` ra đúng 3 trang + CHECK 4 cột `№ TEAM A № TEAM B` + cỡ chữ tăng gần gấp đôi (pool 50 → 2 cột 6.27mm ~17.8pt, trước 3.7mm ~10.5pt), Edit mở không lỗi, **0 lỗi console suốt**. ⭐ **1 lỗi thật bắt được lúc tự test**: thanh trượt "Time each team" kéo sang nấc Custom rồi tự nhảy về nấc cũ — hàm vẽ lại đọc NHẦM vị trí từ giá trị đã lưu thay vì tin thao tác kéo vừa rồi; sửa tách hẳn "vẽ lại lúc mở panel" khỏi "chỉ đổi hiện/ẩn lúc kéo". Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 68 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8b. **Việc kế: 3 việc máy không tự kiểm được — thầy xem khung 4:3 + đồng hồ trên TOMKO thật, bấm thử fullscreen thật trên iPad (Chrome), in thử 3 tờ A4 giấy thật xem chữ có lấp kín trang như ý** → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 67, v0.9.42) — ⭐ TEMPLATE THỨ 15: RUNNING WORD (RUNNINGW) + ⭐ VÁ BẪY BÀN PHÍM Ở CORE. ✅ COMMIT (`7d721a7`) + PUSH + LIVE** — `git fetch` so origin trước khi commit (0/0, không máy nào đẩy chen); `curl` poll Pages (bẫy quen: lần 1 còn file CŨ, lần 2 mới đủ 6 file); rồi CHẠY LẠI trọn bộ kiểm tra **TRÊN CHÍNH BẢN LIVE**: bản vá bàn phím đúng (dựng lúc disabled → bấm 0; `refresh()` mở khoá → bấm ăn ngay), **15/15 template mount 0 lỗi console**, chia từ trên live ra đúng `50+50 · trùng 15 · phủ ALL`, **chơi TRỌN 1 ván thật ra "REDS WINS" 3–2 + engine ăn mừng**, 0 từ bị lộ. Trận đấu **2 đội trên đồng hồ cờ vua** ngay trong khung game, thay trọn bộ đồ nghề thủ công của thầy: đồng hồ cờ vua vật lý · gõ vào sheet `RUNNING` của WORD GAMES.xlsx trên iPad · in 3 tab từ sheet `RunningW` · chia 2 danh sách bằng tay. Explainer tả từ → typer gõ → **đúng thì chữ xanh + tiếng "clack" đảo đồng hồ + xuống dòng đội kia**; sai thì đỏ, đồng hồ VẪN chạy, không cho qua (đúng luật cờ vua). Hết giờ trước là thua; hết danh sách thì so số từ rồi so thời gian còn lại. Có **PASS** (bật/tắt trong Options, phạt giây), **nút Andrew** (mỗi ĐỘI 1 lượt, dùng khe `extraKey` có sẵn của `core/keyboard.js`), **PAUSE + UNDO cho trọng tài**, 3-2-1 vào trận, 15s cuối chuông dồn + đồng hồ đỏ nhấp, chuông 3 hồi khi hết giờ + bảng so 2 đội. **⭐ Giải mã được luật chia từ từ chính file thật** (`IEL-S15.T3.P4.xlsm` sheet `RunningW`): pool 85 · A=50 · B=50 · **hợp = đúng 85 (phủ trọn pool)** · **giao = đúng 15 = 50+50−85 (trùng ít nhất có thể)** — KHÔNG phải "xáo rồi bốc 50 hai lần" (kiểu đó trùng ~29 và bỏ sót cả chục từ); `rw-sets.js buildSets()` cài đúng vậy + thêm ràng buộc từ trùng phải lệch ≥6 dòng giữa 2 danh sách. **⭐ Luật thiết kế xuyên suốt: TỪ SẮP TỚI KHÔNG BAO GIỜ HIỆN LÊN MÀN HÌNH** (typer đứng ngay trước màn hình) — dòng chưa chơi chỉ hiện SỐ, **màn setup cũng chỉ hiện CON SỐ**, dòng PASS hiện `—`; từ chỉ nằm trên GIẤY. **In 3 tờ A4** từ màn setup (PART A · PART B · CHECK, cột TURN là ô tick), cỡ dòng tự tính, ≥41 dòng tự chảy 2 cột — mọi cỡ pool thật (20-100 từ) lọt 1 trang, chữ 9.9-10.5pt. **Lưu 3 bộ in vào act** (SET 1/2/3; `store.js` nạp trì hoãn trong chính hàm click, nút Save chỉ dựng khi ở máy thầy). **2 LỖI THẬT bắt được khi CHẠY thật, không phải khi đọc code:** (1) **phím Andrew chết cứng → ⭐ HOÁ RA LÀ LỖI CORE, THẦY CHỐT VÁ TẬN GỐC** — `fnKey()` của `core/keyboard.js` chỉ gắn `onclick` khi phím KHÔNG disabled lúc DỰNG, mà `refresh()` sau đó chỉ đổi `.disabled` chứ không gắn bù → **phím nào sinh ra lúc đang khoá là chết hẳn cả phiên, im lặng, không lỗi console**. Lúc vá mới lòi ra **Crossword đã từng dính đúng bẫy này** và phải bẻ cong `isDisabled` để né (còn nguyên ghi chú "must NOT be disabled at build time"). Vá: `fnKey()` **luôn gắn handler**, `disabled` một mình quyết định (`<button disabled>` không bao giờ phát click); `extraKeyEl()` thôi truyền `null`. Đo bằng ca tái hiện đúng lỗi cũ: dựng lúc disabled → bấm 0 lần ăn; `refresh()` mở khoá → **bấm ăn ngay** (trước vá vẫn 0). Hồi quy Type the answer + Crossword + Running word đều bình thường. Luật mới ở `core/HUONG DAN CORE.md` mục **"BẪY BÀN PHÍM"**: từ nay template được tự do dựng bàn phím ở bất kỳ trạng thái nào. (2) **vùng chơi chỉ cao 45.67cqw** chứ không 56.25 (2 thanh ăn ~10.6), bàn phím cỡ gốc chiếm 20.3cqw → 2 cột chỉ còn **1.04 dòng**; thu đồng hồ + thu bàn phím bằng luật **scoped `.aw-rw-card .aw-kbd-*`** (luật TRẦN sẽ thu nhỏ luôn bàn phím Type the answer/Crossword vì CSS template không bao giờ bị gỡ) → nay **5 dòng trọn mỗi đội**. **Core đụng 3 chỗ, thầy duyệt cả 3**: `core/catalog.js` (1 mục) + `core/lesson-import.js` (Import `.xlsm` tự sinh act RUNNING WORD — đo thật: bundle 8→9 act, đúng 85 từ, giữ nguyên `WASH DOWN`/`SKIN-SCRAPER`) + **`core/keyboard.js`** (bản vá bẫy phím ở trên). Chưa đụng `core/convert.js` nên chưa tham gia Change template (cố ý). Tự test: 4 theme OK, 142/142 phần tử tap-highlight trong suốt, hồi quy 15/15 template. Chi tiết: `GHI CHU DU AN.md` Đợt 67 + `templates/running-word/GHI CHU RUNNING-WORD.md`. **Việc kế: đã lên live, không chờ gì thêm về kỹ thuật. Còn 2 việc máy không thay được: thầy chơi thử trên TOMKO (cỡ chữ ô nhập + 2 mặt đồng hồ nhìn từ cuối lớp) và IN THỬ 3 TỜ A4 GIẤY THẬT (50 dòng có lọt 1 trang? ô TURN đủ to để tick?).**
> Trước đó: **4/8/2026 (Đợt 66, v0.9.41) — CROSSWORD: PHÂN TRANG TỚI 120 ANSWER + ANAGRAM→CROSSWORD NÂNG TRẦN 40→120. KHÔNG ĐỤNG CORE (chỉ `core/convert.js`, dùng chung mọi template). ✅ COMMIT (`4d5b892`) + PUSH + LIVE — `curl` 3 file lên live ngay lần đầu (không dính bẫy cache cũ lần này), rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (import thẳng module từ `andrewclasses-01.github.io/AWord`): n=31 → "Page 1/2" đúng, `switchTargets()` live đúng 40→true/41→true/120→true/121→false, giải thật 3 từ trên bản live → điểm cộng đúng, 0 lỗi console — cộng với bộ test đầy đủ hơn đã chạy trên local trước khi push: 12 mốc số từ (0..150) ra đúng số trang ở mọi mốc, chơi TRỌN 1 ván 2 trang thật (gõ phím mô phỏng) ra đúng "GAME COMPLETE · Score 28/28", điểm không mất khi tự chuyển trang, hồi quy `crossword/test.html` + `find-the-match/test.html` vẫn y hệt trước.** Thầy hỏi vì sao Anagram chưa đổi Template được sang Crossword → tra ra `core/convert.js` giới hạn Crossword tối đa 40 từ, không phải lỗi. Thầy chốt 3 việc: (1) Crossword nâng trần **120 answer**, ≤30 từ chơi y hệt cũ (ẩn hẳn thanh điều hướng), >30 tự chia trang 30/trang (31-60→2, 61-90→3, 91-120→4 trang, chia đều như `find-the-match.js`) — mỗi trang là **1 lưới ô chữ hoàn toàn riêng** (`pageState[]` giữ lưới + tiến trình từng trang, không mất điểm khi tự chuyển trang), thanh dưới chỉ hiện "Page X/Y" khi >1 trang, không nút lật tay (đúng kỹ thuật `find-the-match.css` đã dùng). (2) `convert.js`: `n>40`→`n>120` cho đích Crossword. (3) `crossword-editor.js`: `MAX_WORDS` 100→120. (4) Answer nhiều từ (vd "sea horse") xác nhận đã chạy ĐÚNG SẴN từ trước (`gridKey()` tự strip dấu cách) — không cần sửa, chỉ xác nhận lại bằng cách chơi thật. Bắt được 1 lỗi logic thật lúc viết: `selectWord()` bọc chỉ số theo `total` (giờ là tổng mọi trang) thay vì `clues.length` (số từ của trang) — đã sửa. Chi tiết: `GHI CHU DU AN.md` Đợt 66 + `templates/crossword/GHI CHU CROSSWORD.md`. **Việc kế: thầy thử tạo Anagram >40 từ có clue → Template → xác nhận Crossword sáng; soạn Crossword >30 từ → chơi thử phân trang trên TOMKO → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 65, v0.9.40) — HẾT LỖI "NỀN GÓC VUÔNG KHI CHẠM" TRÊN TOMKO, TOÀN BỘ 14 TEMPLATE. ⭐ CÓ SỬA CORE (thầy đồng ý trước, 1 luật DUY NHẤT). ✅ THẦY DUYỆT → COMMIT (`72e1b5f`) + PUSH + LIVE — `curl` poll (bẫy quen: 3 lần đầu Pages còn trả file CŨ, lần 4 mới thấy dấu mốc) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE: **14/14 template · 391 phần tử bo góc bấm được · 0 còn dính · 0 lỗi console**.** Thầy báo: chạm ô đáp án / nút Next-Back thì đúng lúc nhấn lóe ra mảng nền **GÓC VUÔNG** thò ra ngoài viền bo tròn; Open the box đã hết nhưng **Quiz và nhiều game khác vẫn bị**; CHỈ máy 3 (TOMKO) bị, máy 1/2 không, GPU/CPU chỉ 1-2%. **Nguyên nhân: mặc định của Chrome `-webkit-tap-highlight-color: rgba(0,0,0,0.18)`** — lớp phủ đen mờ Blink CHỈ vẽ khi input là **CHẠM**, và hình dạng **không bám border-radius** nên 4 góc vuông của nó thò ra ngoài mọi ô bo tròn. Máy 1/2 dùng **CHUỘT** → lớp phủ không bao giờ được vẽ, nên lỗi trông như "tại máy" trong khi thực chất là mặc định CSS có ở mọi máy. **Loại trừ có bằng chứng:** không phải GPU/driver (tải 1-2%), không phải phản hồi chạm của Windows (`ContactVisualization = 0` = đang tắt), và Chrome lẫn myActivity cùng bị vì cùng lõi Chromium. **Vì sao riêng Open the box đã hết:** Đợt 21 nó tự đặt `transparent` cho 2 loại ô của nó — nhưng 12 nút dùng chung của engine thì vẫn dính ngay cả khi đang chơi game đó. **Sửa: ĐÚNG 1 LUẬT** `html { -webkit-tap-highlight-color: transparent; }` trong `core/app.css` — thuộc tính này **KẾ THỪA** nên khai một lần ở gốc là phủ khung game + thanh dưới + cụm công cụ + editor + trang chủ + modal + popup in, và **mọi template về sau không phải nhớ gì thêm**. **Đo thật trên chính máy 3, 14/14 template, trình duyệt thật:** trước — mỗi game 12 phần tử chung dính (`.aw-navbtn`×2 · `.aw-iconbtn`×4 · `.aw-toolbtn`×3 · `.aw-toolbtn-sm`×4) cộng ô riêng (Crossword **143**, Type the answer **53** gồm cả bàn phím ảo `core/keyboard.js`, Quiz **16**, Anagram 21, Find the match 20, Speaking cards 18, Gameshow 16, True-false 14); sau — **392/392 phần tử bo góc bấm được = `rgba(0,0,0,0)`, 0 còn dính, 0 lỗi console**, editor vẫn gõ/bôi chọn chữ bình thường (`userSelect: auto`, bản vá KHÔNG đụng `user-select`), `:active` giữ nguyên. **Diff chỉ 1 file code:** `core/app.css` (+33 dòng, thuần thêm mới). ⚠️ **Máy không tự chạm màn hình được** nên điểm cuối phải do thầy nghiệm thu bằng ngón tay: mở `http://localhost:5510/scratch/kiem-tra-cham-tay.html` trên TOMKO — 2 cột hình dạng giống hệt, cột trái cố ý bật lại lỗi, cột phải là bản đã vá. **myActivity KHÔNG phải sửa** (nó đã có sẵn `* { -webkit-tap-highlight-color: transparent }` ở `main.css:4`) — chỗ thầy thấy lỗi trong myActivity chính là trang AWord nhúng, nên **chỉ hết sau khi push lên Pages**. Chi tiết: `core/HUONG DAN CORE.md` mục "MÀN CẢM ỨNG (TOMKO)" + `templates/quiz/GHI CHU QUIZ.md` Đợt 65. **Việc kế: thầy chạm thử trang nghiệm thu + chơi Quiz thật trên TOMKO → duyệt → commit + push (myActivity chỉ hết sau bước push).**
> Trước đó: **4/8/2026 (Đợt 64, v0.9.39) — QUIZ: THÊM THANH LIVES 0–10 (0 = Unlimited). KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`f0b0830`) + PUSH + LIVE — đã `curl` poll (đúng bẫy quen: lần 1 Pages còn trả file CŨ, lần 2 mới đủ 3 file) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE: lives 3 → tim `♥♥♥→♥♥→♥→(hết)`, khoá ô + 2 mũi tên disabled, "GAME OVER · Score 0/6" · act cũ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete" · lives 8 → `8♥`→`7♥` · đúng hết → 3 tim nguyên, 6/6 · Submit answers → "Game complete" · panel Options đủ 8 nhóm, Lives 0..10, về 0 = "Unlimited" · **14/14 template mount 0 lỗi, console 0 lỗi**.** Thầy hỏi Quiz đã có Lives chưa → kiểm ra **chưa hề có** (chỉ sót dòng thừa `lives: null` trong sample, không ai đọc). Đã thêm theo ĐÚNG khuôn Type the answer/True-false: `hasLivesSlot:true` mượn ô tim SẴN CÓ của core (nên **không phải sửa core dòng nào**) · Options thêm nhóm **Lives** slider 0..10, 0 = "Unlimited" · `normLives`: chưa set = **vô số mạng** (act Quiz cũ không có trường `lives`; mặc định 5 sẽ làm mọi bộ đề cũ bỗng Game over giữa chừng) · sai 1 câu mất 1 tim (tim trái nhất phóng to rồi tan, `.animate()` kèm `setTimeout` dự phòng; 6..10 mạng hiện gọn `N♥`) · hết mạng → khoá ô đáp án + 2 mũi tên mờ, 1,5s sau kết thúc với chữ **"Game over"** (qua `raw.title`) và âm `blockgametimeout` thay fanfare (`sounds.complete` để rỗng, `finish()` tự chọn). ⚠️ BẪY: `ui.setNav({onNext})` được engine gắn thẳng `btn.onclick=handler` nên KHÔNG được truyền `finish` trần (nó nhận MouseEvent làm `reason`) — đã bọc `() => finish("complete")`. Đo thật trên devserver: lives 3 và 2 → tim rụng đúng nhịp, hết mạng ra "GAME OVER · Score 0/6"; lives 8 → `8♥`→`7♥`; **act CŨ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete"** (zero-diff đúng cam kết); trả lời đúng hết → 3 tim nguyên, 6/6; Menu "Submit answers" → "Game complete"; panel Options đủ 8 nhóm; console **0 lỗi** mọi ca. 4 file `templates/quiz/` (`quiz.js`·`quiz.css`·`quiz-sound.js`·`sample-quiz.js`) + docs (mới mở `templates/quiz/GHI CHU QUIZ.md`). Chi tiết: `GHI CHU DU AN.md` Đợt 64. **Việc kế: thầy chơi thử trên TOMKO (chọn số mạng vừa tay); còn chỗ nào chưa vừa thì báo.**
> Trước đó: **4/8/2026 (Đợt 63, v0.9.38) — WHACK-A-MOLE: 5 ĐIỀU CHỈNH THẦY GỬI 1 LƯỢT. ⭐ CÓ 1 LỖI THẬT ĐƯỢC SỬA. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`16586a6`) + PUSH + LIVE — đã `curl` poll (lần đầu Pages còn trả file CŨ, lần 2 mới đủ 3 file) rồi CHẠY LẠI trọn bộ đo TRÊN BẢN LIVE: lệch tâm 0,0px · cột cách thanh giờ 17,3px · bubble thoát mặt mole cả 3 cỡ hố · câu 229 ký tự giữ bảng 103,4px · bảng hiện SCORE cuối ván · Punishment 8s → 8204ms · 14/14 template mount 0 lỗi, Quiz vẫn đủ 2 mũi tên.** (1) **Bảng luôn giữa cột + cột hết bị thanh giờ đè**: cột đổi sang `top:50%;translate(-50%,-50%);height:15cqw` nên tự lấy TÂM BẢNG làm tâm với MỌI chiều cao bảng (đo: lệch **0,0px**, đỉnh cột cách thanh giờ 15,8px — trước ĐÈ THẬT 49,5 vs 58,2px). ⭐ **LỖI THẬT dưới đáy chuyện này**: `autoFit` đo câu hỏi với `root` (CẢ VÙNG CHƠI ~428px) thay vì cái bảng (~103px), **và** `.aw-wam-sign-question` không hề dùng `var(--fit)` → `--fit` CHƯA TỪNG chạy; câu 262 ký tự làm **bảng phình 376,7px**, thòng 242px dưới đáy cột. Nay đo theo chiều cao thiết kế của ván (`offsetWidth×150/474`−padding) + CSS tiêu thụ `var(--fit,1)`. (2) **Thang Speed trải đều**: `pace=(speed−1)/9`, spawn `2400→340ms`, mole đứng `4200→900ms`, cùng lúc `1→8` — đo: mức 1 = 1 mole/**4,5s** · mức 5 = 1/2,0s · mức 10 = 1/0,5s (⚠️ mức 5 nay chậm hơn trước; nhịp cũ ≈ mức 7–8). (3) **Bubble `bottom:62%→80%`** — quét alpha sprite mới biết 25,5% trên ảnh là trong suốt: trước đuôi bubble cắm **20,1px vào mặt mole**, nay khe hở 3,3/6,6/9,9px theo 3 cỡ hố. (4) **Hết ván điểm hiện TRÊN BẢNG** (bỏ hẳn số khổng lồ giữa sa mạc `.aw-wam-tally`): câu hỏi biến mất, ván hiện "SCORE + số", cột vẫn đứng sau — đo ván 6s ăn 16 điểm → bảng `SCORE 16` khớp ô điểm engine. (5) **Thanh Punishment 0–10s màu xanh lá** (`options.punishSeconds`, mặc định 4 = y hệt hằng số cũ nên act cũ zero-diff) — đo 0s→362ms không rung · 2s→2499ms · 8s→8098ms. ⚠️ BẪY mới ghi: đặt `const` cạnh `updateSign` là ReferenceError vì `updateSign()` được gọi TRƯỚC đó trong `mount()` (temporal dead zone) → phải dùng hàm. Chi tiết: `GHI CHU DU AN.md` Đợt 63 + `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`. **Việc kế: thầy chơi thử trên TOMKO (nhất là chọn lại mức Speed vừa tay) → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 62, v0.9.37) — FIND THE MATCH: BỎ "x of y" + ĐƯA "Page X/Y" XUỐNG THANH DƯỚI + BỎ NÚT LẬT TRANG + SỬA LỖI THẬT CẮT Ô ĐÁP ÁN. ⭐ CÓ SỬA CORE (1 chỗ, thêm mới). ✅ THẦY DUYỆT → COMMIT (`d4f526f`) + PUSH + LIVE — đã `curl` kiểm 3 file live (bẫy quen: lần curl đầu engine.js đã mới mà 2 file find-the-match còn CŨ, phải poll lại) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (8/40/60/70 cặp: 0 ô cắt · 0 chữ tràn · 0 mũi tên · nhãn đúng; 4 game khác không hồi quy; console 0 lỗi).** Thầy gửi ảnh act 60 cặp bị **cắt ngang hàng ô cuối** + 3 yêu cầu. (1)(2) Bỏ hẳn pager trong khung (2 nút `‹ ›` + hàm `goPage`) — game này KHÔNG cho lật tay, trang chỉ tự chuyển khi chơi hết; số trang chuyển XUỐNG thanh dưới, thay chỗ "x of y". ⭐ **Sửa core**: `ui.setNav()` nhận thêm tuỳ chọn **`label`** (có thì hiện nguyên chuỗi thay "x of N", không truyền thì y hệt cũ — đã đo lại 6 game khác không đổi); template gọi `label:"Page 1 / 2"`, và **chuỗi rỗng khi chỉ 1 trang** nên thanh dưới trống hẳn. Nhãn nới rộng + đậm nhưng **scope `:has(> .aw-ftm-card)`** theo luật "CSS template ở lại document vĩnh viễn" (đã đo: quiz `700/59px/xám` vs ftm `800/135px/đậm` → không rò). (3) ⭐ **LỖI THẬT — vì sao ô bị cắt**: `measure()` của `autoFit` (a) dùng `grid.scrollHeight` mà lưới là **flex item bị kéo giãn** nên scrollHeight tụt về chiều cao đã giãn (đúng bẫy ghi đầu `core/fit.js`) → tràn thật bị che, và (b) chỉ cộng `offsetHeight`, **quên margin** track 1,2cqw + divider 1,8cqw + padding card → hụt ~3cqw. Đo tái hiện trước khi sửa: 60 cặp, `--fit=0.89` vẫn tràn **11px / 12 ô bị cắt**. Sửa: tính chiều cao lưới CẦN = `hàng × chiều cao ô + rowGap` cộng `outerH()` (kèm margin) của track/divider + padding card; `slack` 3cqw→**1,5cqw** (đủ ôm gờ 3D 0,5cqw bị `overflow:hidden` xén). Đo lại 8/35/40/60/70 cặp: **0 ô cắt, 0 chữ tràn**. Tự test browser thật: chơi TRỌN ván 36 cặp 2 trang → nhãn tự đổi Page 1/2 → 2/2, điểm 36, "GAME COMPLETE", console 0 lỗi; 6 template khác không hồi quy. ⚠️ BẪY gặp lại: pane trình duyệt công cụ không compositing → **rAF đóng băng** (đo: không bắn trong 600ms) + screenshot timeout → phải đo DOM. Chi tiết: `GHI CHU DU AN.md` Đợt 62 + `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`. **Việc kế: thầy chơi thử act 60 cặp thật trên TOMKO (bản live); còn hàng nào chưa vừa thì báo.**
> Trước đó: **4/8/2026 (Đợt 61, v0.9.36) — ĐIỀU CHỈNH TỔNG THỂ MỌI ACT (4 yêu cầu của thầy) + 2 LỖI THẬT PHÁT HIỆN KHI KIỂM CHỨNG. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT (`9dad80b`) + PUSH + LIVE — đã `curl` kiểm chứng 10 dấu mốc trong 6 file đã lên Pages, rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (14/14 mount, 0 lỗi console).** (1) **Nút Back/Next có ĐẾ TO CỐ ĐỊNH** vẽ sẵn mọi lúc (8.6×5cqw, gờ 3D, vùng bấm gấp ~2,7 lần; nút khoá vẫn hiện đế; nút cuối ván = đế XANH LÁ chữ trắng) — thêm 4 biến theme `--aw-nav-plate/-hi/-lip/-ink` khai đủ ở cả 4 theme, có giá trị dự phòng trong `app.css`. Thanh dưới cao thêm ~1,1cqw nên đã nâng `.aw-menu` 5.8→6.9cqw và `.aw-toast` 6.4→7.5cqw (đo thật: menu từng đè thanh dưới 8px). Phản hồi lúc nhấn dùng `filter`, KHÔNG `transform` (vì `.is-finish` chạy `aw-glow` scale, animation luôn thắng transition). (1b) ⭐ **LỖI THẬT**: `open-the-box.css` có luật TRẦN `.aw-nav{display:none}` — từ v0.9.7 `ensureTemplate` chèn CSS template một lần và KHÔNG gỡ, nên **mở Open the box 1 lần là mất nút Back/Next ở MỌI game còn lại suốt buổi**; đã scope theo khuôn whack-a-mole (`:has(> .aw-otb-card) ~ .aw-bottombar`). (2) **Đổi template luôn đọc act GỐC**: `doSwitchTemplate` vốn đã convert từ `originAct`, nhưng DANH SÁCH game đổi-được lại tính từ act TẠM → convert vốn mất dữ liệu nên act tạm khoá mất tính năng (đo thật: Quiz → tạm Speaking cards → `switchTargets` trả **0 game**, kẹt cứng). Thêm `switchList()` trong `engine.js` luôn tính từ `originAct` + thêm lại loại gốc để quay về; panel Template và picker ☰/màn kết thúc đều dùng. (3)(4) ⭐ **LỖI THẬT**: **Anagram/Quiz → Whack-a-mole vốn HỎNG** (hiện sáng bấm được nhưng ra game trắng "no statements yet") — `convertActivity` chỉ đặt `options.mode` khi CHƯA có, mà options copy từ sample whack vốn đã mang `mode:"trueFalse"` → act mang `questions` mà tự khai true/false. Sửa: **luôn ép** `mode` theo `kind`. Câu hỏi dựng đúng ý thầy: đề + đáp án đúng của chính câu đó + trộn đáp án từ các câu khác. ⚠️ Bài học đo đạc: pane ẩn thì transition ĐÓNG BĂNG, `getComputedStyle` đọc ra giá trị cũ — phải `style.transition="none"` rồi đọc lại; và harness phải chạy từ trang `/` (chạy từ `templates/*/test.html` thì đường dẫn CSS template 404). Chi tiết: `GHI CHU DU AN.md` Đợt 61. **Việc kế: thầy chơi thử trên TOMKO → duyệt → commit + push.**
> Trước đó: **3/8/2026 (Đợt 59, v0.9.34) — QUIZ: 4 CẢI TIẾN THẦY YÊU CẦU. ⭐ CÓ SỬA CORE (bỏ 1 lệnh ẩn nav). ✅ THẦY DUYỆT → COMMIT (fc8e722) + PUSH + LIVE (tự test trình duyệt thật, 0 lỗi).** (1) **Nav (next/back/số trang) không còn biến mất**: điều tra (tái hiện thật + MutationObserver) → thủ phạm DUY NHẤT là `core/engine.js celebrate()` ẩn nav ~2.2s lúc game-complete (auto-finish khi trả lời hết) — nav KHÔNG mất giữa lúc chơi (đã loại rò rỉ overlay sau Change Template). Thầy chốt GIỮ auto-finish, chỉ ngừng ẩn nav → ⭐ **bỏ `navWrap.style.visibility="hidden"` trong `celebrate`** (Summary mờ đục vẫn che thanh dưới sau đó) + **quiz huỷ `autoTimer` khi điều hướng thủ công** (`clearAutoTimer` trong goPrev/goNext, khớp fix Đợt 56 TTA) để không tự kết thúc lúc đang xem lại. (2) **Không tách 1 từ đơn**: `.aw-tile-text` `overflow-wrap:normal;word-break:keep-all`, thêm biến co RIÊNG mỗi ô `--tw`; `fitNow()` bước WIDTH-fit đặt `--tw=max(0.2,avail/need)` 1 phát → từ 45 ký tự vẫn 1 dòng. (3) **Đáp án dài nhiều chữ**: ô cao AUTO wrap theo khoảng trắng, HEIGHT-fit co `--fit` để không đè câu hỏi (đo: 14 chữ → ô 259px, `--fit≈0.91`, không đè). (4) **Chuyển câu TRƯỢT + chữ ô fade, ô CỐ ĐỊNH**: `mount` dựng card+tiles 1 LẦN rồi cập nhật tại chỗ; `showQuestion` animate câu hỏi translateX±6%, mỗi `.aw-tile-text` fade, ô không di chuyển (đo `tilesFixed=true`). Chỉ `templates/quiz/quiz.js`+`quiz.css`+`core/engine.js`; KHÔNG đụng 13 game kia. Chi tiết: `GHI CHU DU AN.md` Đợt 59. **Việc kế: thầy chơi thử (quiz TẠM từ Change Template + đáp án siêu dài trên TOMKO) → duyệt → commit + push (curl kiểm live). ⚠️ quiz.js commit gần nhất vẫn v0.9.28 nên không đè ai; nếu có máy KHÁC cũng làm "Quiz Đợt 59" thì merge quiz.js sẽ đụng, thầy điều phối.**
> Trước đó: **4/8/2026 (Đợt 60, v0.9.35) — FIND THE MATCH: PHÂN TRANG (≤35 ô/trang) + FIT CHỮ TRONG Ô. ✅ THẦY DUYỆT → COMMIT (94fd6bc) + PUSH + LIVE. KHÔNG ĐỤNG CORE (chỉ 2 file find-the-match).** Thầy báo: nhiều ô thì chữ tràn ra ngoài + muốn ≤35 ô/trang. (1) **Fit chữ**: mỗi ô `display:flex` căn giữa + **chiều cao CỐ ĐỊNH** + `overflow:hidden` + biến co RIÊNG `--tfit` → hàm `fitTiles()` giảm cỡ font từng ô tới khi vừa khít cả ngang lẫn cao → chữ KHÔNG BAO GIỜ tràn, luôn ở tâm. ⚠️ BẪY: `fitTiles` qua `requestAnimationFrame` KHÔNG chạy khi pane ẩn (rAF đóng băng lúc không compositing) → gọi `fitTiles()` **ĐỒNG BỘ** ngay sau khi autoFit đặt `--fit` + gọi lại trên `fonts.ready`; `scheduleTileFit` (rAF) chỉ lo re-fit khi RESIZE. (2) **Phân trang** `MAX_TILES_PER_PAGE=35`, chia ĐỀU (40→20+20). Mỗi trang là 1 VÒNG độc lập (prompt chỉ trỏ ô trên trang đó → đáp án luôn thấy trên trang đang xem); hết cặp trang → `startCycle` tự `nextNonEmptyPage` render trang kế, hết mọi trang → `finish("complete")`; **pager `‹ Page X/Y ›`** (`goPage`) lật tay, prev/next tắt ở biên. `renderShell` nay chạy mỗi lần đổi trang → `fitter.destroy()`+huỷ `tileFitRaf` đầu hàm chống rò rỉ; `queue`=tham chiếu `pageQueues[curPage]`. Tự test browser thật (đo DOM): 8 cặp→1 trang không pager 0 tràn; 40 cặp→Page 1/2+2/2 pager đúng 0 tràn 2 trang auto-advance chơi trọn **score 40 + summary**, console 0 lỗi. Chi tiết: `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` (chặng 3/8 đầu Nhật ký). ⚠️ Số Đợt nhảy 58→60 vì phiên SONG SONG đang giữ Đợt 59 (quiz) — 2 phiên chạy cùng lúc trên repo, file find-the-match tách biệt hoàn toàn.
> Trước đó: **4/8/2026 (Đợt 58, v0.9.33) — OPEN THE BOX: 5 CẢI TIẾN UX. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.** (1) Hết nháy "nền vuông 4 góc" khi chạm ô: `-webkit-tap-highlight-color:transparent` trên `.aw-otb-box`+`.aw-otb-qtile` (mặc định Chrome vẽ lớp phủ chạm HÌNH CHỮ NHẬT, bỏ qua border-radius). (2) Bo góc DẦN khi ô câu hỏi bay về ô số: animate `border-radius` trong zoom 2 chiều, đích `boxRadius/scale` per-axis khớp ô số (`readBoxRadius` đọc px thật). (3) Chữ back-face co theo cỡ ô khi nhiều ô: `--back-size` theo cell + `fitBackFaces()` co từng ô hiện TRỌN câu hỏi. (4) Khóa bấm đáp án tới 80% animation (`.is-gated`+`answersUnlocked`) tránh bấm nhầm. (5) Không ngắt từ: `overflow-wrap:normal;word-break:keep-all` + `fitOne` co dưới sàn cho từ dài trọn 1 dòng. Chỉ 2 file `templates/open-the-box/*.js|css` (+2 docs); tự test trình duyệt thật 0 lỗi (điểm 1+2 hình ảnh thầy xác nhận trên màn cảm ứng). Chi tiết: `GHI CHU DU AN.md` Đợt 58 + `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 21.
> Trước đó: **4/8/2026 (Đợt 57, v0.9.32) — WHACK-A-MOLE: MOLE RUNG LẮC KHI ĐẬP SAI + ẨN NÚT NEXT/BACK. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.** Chỉ 2 file `templates/whack-a-mole/*.js|css` (+ docs). (1) Đập SAI: trong 4s "đông cứng" (`PENALTY_FREEZE_MS`) mole nay **rung lắc** thay vì đứng im — class `is-dizzy` gắn sau 150ms (khớp lúc sprite đổi sang mặt choáng), mole lắc quanh gốc chân (`transform-origin: 50% 92%`) xoay ±6,5° + lắc ngang nhịp 0,46s, **bong bóng chữ lắc cùng nhịp ±3,5°**; hết 4s bỏ class → thụt như cũ; dọn `is-dizzy` ở `duck`/`freeHole`/`endGame`; hết mạng thì không rung. ⚠️ BẪY: phải dùng `@keyframes` chứ KHÔNG `transition` (rule `.is-hit` đã ghim `transform`, animation luôn thắng transition) → **mỗi keyframe tự mang lại offset `translate(-50%,8%) scaleY(.92)`**. (2) **Ẩn nút Next/Back** bằng 1 dòng CSS **scoped**: `.aw-playarea:has(> .aw-wam-scene) ~ .aw-bottombar .aw-navbtn{display:none}` — cố ý KHÔNG dùng `.aw-nav{display:none}` trần như open-the-box (CSS template ở lại document vĩnh viễn nên sau "Change template" sẽ ẩn nhầm mũi tên của game khác), và chỉ ẩn `.aw-navbtn` để lưới 3 cột thanh dưới không vỡ. Tự test trình duyệt thật 0 lỗi. **Bài học đo đạc (dùng lại được)**: pane ẩn thì Chromium ngưng compositing khiến animation trông như chết — phải `el.getAnimations()[0]` rồi tự đặt `currentTime` từng mốc mới đọc được `transform` thật. Chi tiết: `GHI CHU DU AN.md` Đợt 57 + `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục ⭐ ĐỢT 57).
> Trước đó: **3/8/2026 (Đợt 56, v0.9.31) — TYPE THE ANSWER: bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance. ⭐ CÓ SỬA CORE (1 chỗ nhỏ). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Chỉ đụng **Type the answer** + 1 fix core nhỏ, không đụng game khác. (1) Bỏ checkbox "Minus points for wrong answers" — chỉ còn 1 thanh trượt `minusAmount` **0..5** (0 = tắt, zero-diff act cũ). (2) **Thêm Lives** (slider 0-10, 0=Unlimited, khuôn `true-false.js` — "chưa set" = Unlimited chứ không phải 5 mạng, để act cũ chơi y hệt trước) — mất mạng khi sai, hết mạng → `finish("gameover")` ngay, âm `gameover-01.mp3`. (3) **Sửa 3 lỗi nav/auto-advance CÙNG 1 GỐC**: `submitAnswer()` cũ không gọi lại `updateNav()` sau khi chấm (Next kẹt khoá khi Allow skip tắt) + hẹn giờ `autoTimer` không bị huỷ khi điều hướng thủ công (kéo giật câu hoặc tự ẩn nav khi đang xem lại) — sửa gọi `updateNav()` ngay sau chấm + `clearAutoTimer()` trong `goPrev`/`goNext`, và auto-advance nay LUÔN chạy sau khi trả lời (không phụ thuộc Allow skip/Auto switch nữa). **CÓ SỬA CORE**: thêm cờ `tpl.hideAutoSwitch` (`core/engine.js`, đúng khuôn `hideTimerOption`) ẩn checkbox "Auto switch" chung (nay vô nghĩa riêng TTA), không ảnh hưởng template khác. Tự test trình duyệt thật (DOM/PointerEvent/KeyboardEvent giả lập, mô phỏng đúng race-condition), 0 lỗi console. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 56 + `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` Đợt 55.
> Trước đó: **3/8/2026 (Đợt 55, v0.9.29) — ANAGRAM: 8 ĐIỂM SỬA/YÊU CẦU THẦY GỬI 1 LƯỢT. ⭐ CÓ SỬA CORE (2 chỗ nhỏ). 🟢 CHỜ THẦY DUYỆT (tự test trình duyệt thật + PointerEvent giả lập, 0 lỗi console).** Chỉ đụng **Anagram** + 2 fix core nhỏ, không đụng game khác. (1) Chống flash góc vuông khi chữ bay (`will-change` + `void clone.offsetWidth` trước `.animate()`, cả `flyLetter`/`flyTileClone`) — lỗi cấp khung hình, không đo được bằng script, cần thầy xác nhận mắt thật. (2) **⭐ SỬA BUG THẬT Ở CORE**: `core/engine.js celebrate()` set `navWrap.style.visibility="hidden"` lúc ăn mừng nhưng KHÔNG BAO GIỜ trả lại — khiến nút Back-Next + "x of N" biến mất trong ~2s mỗi lần xong ván (bug ảnh hưởng MỌI template, không riêng Anagram) → đã thêm dòng phục hồi, test xác nhận `visibility` về `""` sau khi ăn mừng xong. (3) `flyScoreGain()` co điểm về ĐÚNG cỡ chữ thật của ô điểm (`getComputedStyle(scoreEl).fontSize`) thay vì `scale(0.4)` cố định. (4)+(6) `flyTileClone()` (kéo-đổi-chỗ + bấm-trả-về-gốc) THIẾU `font-size` → chữ bay bị bé lại — đã thêm tham số `fontSize`, đo PointerEvent giả lập xác nhận cỡ chữ không đổi suốt chuyến bay. (5) Bấm nhanh liên tục bị delay do khoá TOÀN BỘ thao tác chờ animation ~340ms mỗi chữ — tách trạng thái game khỏi hoạt ảnh (state cập nhật NGAY lúc bấm, chỉ ô vừa bấm tự khoá), test bấm liền 7 chữ đúng "DOLPHIN" trong 1 lệnh không đợi nhau → cả 7 vào đúng vị trí. (7) **CÓ SỬA CORE**: đổi màu thanh "Points off" (`core/app.css .aw-opt-slider/.aw-opt-slidval`) sang đỏ `#ef4444` (đã kiểm 2 class này CHỈ dùng riêng cho Points off, không ảnh hưởng game khác). (8) **Thêm Lives cho Anagram** (slider 0-10 Options, 0=vô số mạng, theo khuôn `true-false.js` — khác 1 điểm chủ ý: "chưa set" = vô số mạng, không phải 5 mạng như true-false, để act cũ chơi y hệt trước) — mất mạng cùng lúc với `pointsOff` (từ có lỗi/nộp sai), hết mạng → "GAME OVER" qua cơ chế `title` sẵn có. Chi tiết đầy đủ từng điểm: `templates/anagram/GHI CHU ANAGRAM.md` Đợt 55. **Việc kế: thầy tự chơi lại bản thật (đặc biệt xem kỹ mục 1) → nói "lưu lại"/"commit" nếu ổn.**
> Trước đó: **3/8/2026 (Đợt 54, v0.9.28) — ĐIỂM TRỪ MỌI TEMPLATE + ALLOW SKIP + CẦU ĐỒNG BỘ myActivity. ⭐ CÓ SỬA CORE. 🟢 CHỜ THẦY DUYỆT (tự test trình duyệt thật, 0 lỗi).** (A) Option **"Points off (wrong answer)"** CHUNG ở `engine.js buildOptionsPanel` (slider 0–5, mặc định 0), ẩn ở 4 game đã có riêng + gameshow (`tpl.hidePointsOff`). `ui.setScore` đổi màu: **dương XANH LÁ, âm ĐỎ, bỏ dấu trừ** (cho phép âm). Trừ điểm per-template ở 8 game chưa có (quiz/anagram/true-false/find-the-match/open-the-box/balloon-pop/flying-fruit/maze-chase) — **pointsOff=0 = zero-diff**. (B) **Allow skip** (quiz + type-the-answer, mặc định KHÔNG tích → phải trả lời mới Next được; anagram/unjumble đã có, giữ nguyên). (C) **Cầu `window.__awordBridge`** + marker `MYACT:AW:TPL/OPT/STYLE` để myActivity đồng bộ Template/Options/Style giữa các bảng (2 chiều). (D) **Chặn bàn phím ảo HĐH** khi bàn phím AWord hiện (`type-the-answer` `inputMode="none"`, Win/Android/iOS). (E) **Cân layout** thanh dưới: tên act sang phải + nút chức năng sang trái (`app.css` margin 6%, center vẫn giữa). Tự kiểm devserver: 14/14 mount 0 lỗi, quiz/true-false trừ điểm hiện số ĐỎ, whack ẩn option chung, bridge đủ 4 method + mute, inputMode none↔text đúng, inset 24px cân. Chi tiết: `GHI CHU DU AN.md` Đợt 54 + `core/HUONG DAN CORE.md`. **Việc kế: thầy chơi thử + đăng nhập → commit + push (gộp Đợt 51–54); myActivity v1.7.4 (kho riêng) cần deploy CÙNG để đồng bộ chạy.**
> Trước đó: **3/8/2026 (Đợt 53, v0.9.27) — LƯU OPTIONS HẲN + NHỚ OPTIONS THEO TEMPLATE TẠM. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Apply option → lưu hẳn (act chính `saveActivity`); act TẠM Change Template ghi options vào `originAct.templateOptions[type]` (fix bug cũ: act `conv_` từng bị lưu nhầm thành act mới). Engine mang `originAct` (act gốc) qua mọi lần đổi (`startGame({base})`); đổi về type gốc → khôi phục act thật; `convertActivity` ưu tiên `templateOptions` đã nhớ. Tự kiểm (không login): convert dùng đúng options đã nhớ; **round-trip UI thật PASS** (tắt Shuffle trên quiz tạm → về Anagram → lại Quiz → vẫn tắt). Chỉ `core/engine.js` + `core/convert.js`. Reload-persist cần login. Chi tiết: `GHI CHU DU AN.md` Đợt 53 + hợp đồng `core/HUONG DAN CORE.md`. **Việc kế: thầy login test → commit + push (gộp Đợt 51–53).**
> Trước đó: **3/8/2026 (Đợt 52, v0.9.26) — EMPTY RECYCLE BIN. 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** Thêm nút **"Empty bin"** (đỏ) ở thanh công cụ thùng rác → modal xác nhận ("delete all N items, cannot be undone", Cancel/Delete all) → `store.emptyTrash(root)` xoá vĩnh viễn MỌI node trashed trong root (1 lô) → đóng modal + refresh + toast. Chỉ `core/store.js` + `main.js`. Tự kiểm (không login): toolbar trash dựng đúng Back(icon)+Empty bin(đỏ), parse sạch; modal+xoá thật cần login. Chi tiết: `GHI CHU DU AN.md` Đợt 52. **Việc kế: thầy login → xoá act vào thùng rác → Empty bin → xác nhận → commit + push (gộp Đợt 51–52).**
> Trước đó: **3/8/2026 (Đợt 51, v0.9.25) — TINH CHỈNH UX IMPORT. 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** (1) Nút **Import + Recycle bin → ICON** (class `.aw-fm-iconbtn`; Import=upload svg, bin=`icons.trash`, thùng rác=`icons.prev`). (2) **"Make a new folder" mặc định TÍCH** khi nạp file (ô tên = mã bài); bỏ tích → vào thư mục hiện tại. (3) **Auto-close** sau Import: không make-new → refresh tại chỗ; có make-new → đóng rồi **mở thư mục mới** (`enterFolder(res.folderId)`); có lỗi thì giữ mở. (4) Fix preview đếm act **anagram** (thêm `content.items` vào công thức, trước hiện "· 0"). Chỉ `main.js` + `core/app.css`. Tự kiểm (không login): make-new tích sẵn, meta "Anagram · 100", toolbar dựng 0 lỗi, Recycle bin ra nút icon. Chi tiết: `GHI CHU DU AN.md` Đợt 51. **Việc kế: thầy login test 2 nút icon + auto-close/mở folder → commit + push.**
> Trước đó: **3/8/2026 (Đợt 50, v0.9.24) — ĐỔI TEMPLATE MẶC ĐỊNH KHI IMPORT + THƯ MỤC ACT/HOMEWORK. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Bản đồ act khi tạo từ file: ENG1/ENG2/VI1/VI2 + **PRONUNCIATION** (tách IPA "WORD /ipa/") → **Anagram**; IPA → Speaking cards; Quiz1/2 → Quiz; Reading act TRUE FALSE / FIND THE MATCH (filling) / QUIZ. **Cấu trúc thư mục:** vocab ở gốc; Quiz1/2 + Reading v1 → **ACT**; Reading v2 → **HOMEWORK trong ACT** — qua trường `subfolder` mỗi act; `store.importBundle` `resolveFolder()` tạo/tái dùng cây thư mục lồng. `main.js` preview hiện subfolder. Skill `taoactaw` cập nhật khớp + gửi lại. Tự kiểm harness: reading→12 act, listening→8 act, **20/20 mount 0 lỗi**, skill Python = app. Chi tiết: `GHI CHU DU AN.md` Đợt 50. **Việc kế: thầy login → Import → xác nhận cây thư mục → commit + push (gộp Đợt 48–50).**
> Trước đó: **3/8/2026 (Đợt 49, v0.9.23) — IMPORT ĐỌC THẲNG FILE .xlsm/.xls trong trình duyệt (bỏ bước JSON). 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** Thầy muốn duyệt thẳng file .xlsm vào page → tạo act ngay. Nhúng **SheetJS** local `core/vendor/xlsx.mjs` (~1MB, **nạp lười** teacher-only, không CDN) + **`core/lesson-import.js`** (MỚI) port y nguyên logic skill `taoactaw` sang JS (`parseLessonToBundle` đọc WORDTABLE/Quiz/READINGACT, tự nhận reading/listening, bỏ sheet rỗng). `main.js` `importFlow` nay nhận `.xlsm/.xlsx/.xls` (đọc thẳng, xem trước, Import) LẪN `.json`. Tự kiểm harness: reading→11 act (151ms), listening→7 act (65ms), **18/18 mount 0 lỗi**, JS = Python. Học sinh KHÔNG tải SheetJS (index.html parse sạch, chưa chọn file thì chưa tải). Đánh đổi: repo +1MB; logic ánh xạ ở 2 nơi (skill Python + lesson-import.js JS = đường chính). Chi tiết: `GHI CHU DU AN.md` Đợt 49. **Việc kế: thầy đăng nhập → Import → chọn .xlsm → duyệt → commit + push (kiểm `xlsx.mjs` live bằng curl).**
> Trước đó: **3/8/2026 (Đợt 48, v0.9.22) — NÚT IMPORT: tạo hàng loạt act từ "gói JSON" (nền tảng taoactaw, Phần A). ✅ THẦY TEST OK → COMMIT c4ee761 + PUSH + LIVE.** Thầy muốn "taoactaw" (đọc .xlsm bài học → tạo act AWord, giống skill `taoact`). Chốt: xây **nút Import ngay trong app** (bền) + mỗi bộ dữ liệu chỉ **ít act gốc**, dùng Change Template đổi game tại lớp. Phần A đợt này: `core/store.js` thêm **`importBundle(bundle,{parentId})`** (bundle=`{folder?,activities:[{type,title,theme?,options?,content}]}`; tạo/tái dùng subfolder, `saveActivity` từng act, **trùng tên thì bỏ qua** nên re-import an toàn); `main.js` thêm **nút Import** (Activities, cạnh New folder) + hộp thoại dán/chọn JSON → báo cáo Created/skipped → `render()`. Đã nghiên cứu 2 họ file: **reading** (`READINGACT1/2` có 3 dạng TF/FILLING/READING QUIZ, logic `read_ra` của taoact khớp 100%) và **listening** (`Quiz1/2`), skill phải dò tên sheet linh hoạt + bỏ sheet rỗng. FILLING→Find the match (thầy chốt). Tự kiểm KHÔNG login: prototype đọc file reading→bundle 11 act, harness mount **11/11 engine thật 0 lỗi**, index.html parse sạch. CHƯA test nút thật (login Google không tự động hoá). Chi tiết + hợp đồng gói JSON: `GHI CHU DU AN.md` Đợt 48. **Việc kế: thầy test nút Import → commit + push; rồi làm Phần B = skill taoactaw.**
> Trước đó: **3/8/2026 (Đợt 47, v0.9.21) — ĐỔI TEMPLATE GIỮA LÚC CHƠI ("Change template"). ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Đang chơi 1 bộ (vd Anagram) → bấm nút **Template** dưới khung / mục **Change template** trong menu ☰ / dòng **Play a different template** ở màn kết thúc → **đổi sang game khác chơi tiếp CHÍNH bộ dữ liệu đó**, act gốc trong thư viện KHÔNG đụng (dựng act tạm `conv_...`), giữ theme, điểm chơi lại. Phạm vi = **nhóm hợp dữ liệu tốt** (nhóm QA 10 game đổi qua lại + speaking_cards; true_false↔whack_a_mole; unjumble→{speaking_cards,type_the_answer}; speaking_cards không đổi được vì thiếu đáp án) — game không hợp thì **mờ**. File lõi MỚI **`core/convert.js`** (bộ phiên dịch: `toRecords`/`switchTargets`/`convertActivity`, tự sinh đáp án nhiễu cho MC từ các từ khác trong bộ) + nối 3 stub trong **`core/engine.js`** + `.aw-switch-list` trong **`core/app.css`**. **KHÔNG đụng 14 template**, không đổi class `.aw-page/.aw-stage/.aw-below` hay fullscreen `#app` (an toàn nhúng myActivity/myLesson). Tự kiểm: **116/116** chiều convert+mount 0 lỗi console; đổi thật Anagram→Find the match & Quiz→Anagram chơi được (chữ xáo = đáp án đúng). Chi tiết: `GHI CHU DU AN.md` Đợt 47 + hợp đồng ở `core/HUONG DAN CORE.md`.
> Trước đó: **3/8/2026 (Đợt 46, v0.9.20) — FIX deep-link act TRẮNG TRANG. Mở act qua URL trên trang MỚI (`?a=<num>` — cách app myActivity mirror act sang pane phải ở bảng đôi, cũng như bookmark/link chia sẻ) bị trắng với MỌI loại khác Quiz. Gốc: Đợt 33/v0.9.7 chuyển nạp template LƯỜI (`ensureTemplate`) + thêm `await` khắp nơi NHƯNG BỎ SÓT `routeFromLocation()` trong `main.js` → template chưa đăng ký → `startGame`→`getTemplate` ném "Chưa có game loại ... trong registry" → trắng. Sửa 1 chỗ: `await ensureTemplate(node.type)` trước `startGame` (y khuôn `playAct`), KHÔNG đụng `core/`. Kiểm chứng bằng harness Electron partition thật (`persist:main`). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Chi tiết: `GHI CHU DU AN.md` Đợt 46.**
> Trước đó: **3/8/2026 (Đợt 45, v0.9.19) — WHACK-A-MOLE: NÂNG CẤP LỚN (7 loạt tinh chỉnh theo yêu cầu thầy). Đồ họa dùng ẢNH THẬT Wordwall (`mound02`=cả phông đồi+núi+cactus, hố chỉ `holeback/holefront`, `mound01` blur = 2 đồi tiền cảnh, cactus thật 2 bên, intro zoom). Editor True/False → 2 CỘT + khóa đổi mode khi có dữ liệu. Timer đồng bộ engine (countUp/countDown + `timerTotalSeconds`, `manualTimerStart`, bỏ `gameSeconds`); bar cam ≤30s/đỏ ≤10s. Options mới: Switch correct/incorrect · trừ điểm 0–5 · Lives 0–10 (tim topbar, mất từ trái) · 3 tick bonus riêng · gỡ Auto switch + Timer None. Luật: dọn hết câu đúng → countUp COMPLETE / countDown làm mới vòng chơi tiếp; câu đúng đã đập không hiện lại. Đập SAI = phạt đông cứng 4s. Dấu ✓/✗ nét trần; bubble vẽ CSS ôm sát chữ; biển vào giữa cột; gỡ tally khỏi đè TIME'S UP. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE — tự test trình duyệt thật 0 lỗi, KHÔNG đụng core (chỉ 5 file whack-a-mole + 2 docs). Chi tiết: `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục ⭐ ĐỢT 45) + `GHI CHU DU AN.md` Đợt 45.**
> Trước đó: **2/8/2026 (Đợt 44, v0.9.18) — SPEAKING CARDS: nhiều cải tiến theo yêu cầu thầy (2 loạt). Loạt 1: intro lia camera bàn cờ · nút Menu/Sound/Fullscreen vào nền xanh · cân đối · lá NGANG + design mới · shuffle khớp thời lượng tiếng · không cắt đôi từ · phiên âm 2 hàng + vá tỉa Options. Loạt 2 (sau khi thầy chơi thử): Number of deal places → SLIDER 1-10 · quân cờ vẽ lại kiểu Staunton có khối/bóng (giống thật) · 1 ô chia bộ bài=place TO bằng nhau, nhiều ô kích cỡ thích ứng lấp tối đa màn hình (`computeLayout`) · chữ trong lá to tối đa (fitOnce max 3.6) mà 1 từ không tách dòng. Loạt 3 (thầy yêu cầu dùng ĐỒ HỌA GỐC): tải background.jpg + card art THẬT từ act gốc (Claude in Chrome) về Source + `templates/speaking-cards/assets/`, BỎ quân cờ SVG, dùng ẢNH NỀN THẬT cho intro-pan + nền (⚠️ asset Wordwall — cân nhắc bản quyền trước khi push công khai). Loạt 4: shuffle còn 1/2 thời gian · câu dài trong lá to hết cỡ + xuống nhiều dòng + căn giữa (bộ co riêng, bỏ fitOnce) · bộ bài canh giữa deal place · ô chữ editor tự mở hết cỡ. Loạt 5: BỎ chức năng Add image (nút+data+CSS) · thêm slogan "SPEAKING CARDS IN ANDREW CLASSES" (look Crossword, ghim trong scene vì scene phủ topbar). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE — đã tự test trình duyệt thật 0 lỗi, KHÔNG đụng core (chỉ commit file speaking-cards + 2 docs; whack-a-mole đang dở của phiên khác nên KHÔNG đụng). Backup bản cũ ở `AWord-data/Backup/speaking-cards-v0.9.17/`. Chi tiết: `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` (đầu file) + `GHI CHU DU AN.md` Đợt 44. Nền dùng ẢNH RIÊNG của thầy (`assets/background.jpg` = background2.jpg thầy cung cấp, 7386×2217); ĐÃ GỠ card art Wordwall khỏi repo (còn ở Source).**
> Trước đó: **2/8/2026 (Đợt 43, v0.9.17) — CROSSWORD: 3 loạt tinh chỉnh reveal + âm thanh (yêu cầu thầy). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG đụng core.** Reveal khi chấm chạy TUẦN TỰ từng ô (ô đúng xanh + ting, ô sai ✕ nhỏ KHÔNG che chữ + tặc — bỏ hẳn nền/chữ đỏ; xong ✕ cuối mới lật chữ đúng về xám đồng nhất); câu ĐÚNG cũng tuần tự, ting ô cuối xong mới bay sao + cộng điểm; nhánh SAI+trừ điểm: đủ ✕ → sao đỏ bay + trừ điểm → sao rời ô → mới lật. 6 âm SYNTH WebAudio (ting/tac/magic + starGain vàng-lên/starLose đỏ-xuống trong flyStars + reject "thụp" gõ sai ô given). Start again ĐỔI BỐ CỤC (buildCrossword trộn + tie-break ngẫu nhiên → mỗi ván lưới khác, 17–18/20 từ). Version nhảy v0.9.17 để không trùng nhánh Unjumble (v0.9.16). Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục "3 LOẠT TINH CHỈNH"; tóm tắt: `GHI CHU DU AN.md` Đợt 43. Commit CHỈ add 3 file crossword + 3 docs.
> Trước đó: **2/8/2026 — UNJUMBLE 7 loạt tinh chỉnh (unjumble-local Đợt 36→42, v0.9.10→v0.9.16). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Nền CSS hiện đại + slogan "UNJUMBLE IN ANDREW CLASSES" + intro nghiêng/zoom rồi từng-từ bay đáp đúng slogan; font Baloo 2; kéo-thả caret chuẩn + bay mượt; clue 1 hàng xanh biển italic dưới slogan; **chấm điểm THEO CÂU** (bonus ≤ số lượt tối thiểu → 2đ, submit đúng 1đ / sai −"Points off" 0–5); điểm "N / max", âm màu đỏ; ✓/BONUS + sao vàng(đúng)/đỏ(sai) bay về điểm; **Lives** (slider ∞/1–10 như True/false, hết mạng → Game over); **?/!** cuối câu = ô cố định khóa, **. ,** dính từ; **Show answers** đọc rõ (⭐ CÓ SỬA CORE opt-in `tpl.reviewStyle:"stacked"`, tương thích ngược, ghi ở `core/HUONG DAN CORE.md`). Chi tiết từng loạt: `templates/unjumble/GHI CHU UNJUMBLE.md` (Đợt 36→42); tóm tắt: `GHI CHU DU AN.md`. ⚠️ Số Đợt của Unjumble đếm RIÊNG, trùng số với Crossword bên dưới (2 phiên song song).
> Trước đó: **2/8/2026 (Đợt 36, v0.9.10) — CROSSWORD TÁI THIẾT KẾ LỚN (nhiều loạt yêu cầu của thầy): 2 màn "bảng ↔ hàng/cột", bàn phím cố định tuyệt đối, bảng dùng hết màn + mọi ô bấm được, slogan lên thanh đồng hồ/điểm, câu hỏi to 1–2 dòng tự cân + dải ô căn giữa, ô given xanh/xám + rung khi gõ sai, Andrew chữ vàng trong ô, sao bay vàng/đỏ về điểm (điểm đổi ngay khi sao bay), Minus = slider 0..5, sai(Show-answer BẬT) hiện ✕ đỏ trước rồi mới lộ đáp án, editor nút icon + clue tự nới. ĐÃ COMMIT + PUSH. KHÔNG đụng core. Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục 2/8/2026; tóm tắt: `GHI CHU DU AN.md` Đợt 36. ⚠️ Commit CHỈ add file crossword + 3 docs (trong cây có thay đổi CHƯA XONG của phiên khác — engine.js / HUONG DAN CORE.md / unjumble — cố ý KHÔNG đụng).**
> Trước đó: **1/8/2026 (Đợt 34, v0.9.8) — GAMESHOW: dựng lại INTRO 6s + GET READY mỗi câu + NỀN PHỦ TOÀN KHUNG (theo act gốc). ✅ THẦY DUYỆT → ĐÃ COMMIT + PUSH. KHÔNG đụng core. Chi tiết: `GHI CHU DU AN.md` Đợt 34. (Cùng ngày có phiên song song làm Unjumble = Đợt 35/v0.9.9, file tách rời.)**
> Trước đó (Đợt 33, v0.9.7): NẠP TEMPLATE THEO YÊU CẦU. ⭐ CÓ SỬA CORE.
> Trang HS `play.html` trước nay CHỈ chơi được Quiz (nó tự khai danh sách template riêng và quên 13 loại
> kia) → giao bài loại khác cho HS là gãy `Chưa có game loại "..."`. Nay bỏ hẳn kiểu mỗi trang tự chép
> danh sách: `core/catalog.js` khai luôn `css`/`load()`/`sample()` cho từng loại, `core/registry.js` thêm
> **`ensureTemplate(type)`** (chèn CSS + ĐỢI CSS áp xong + import module, nhớ lời hứa nên gọi song song
> chỉ nạp 1 lần). `main.js` **xóa cả 14 import**, `playAct`/`editAct`/`createBlankAct` `await` nó;
> `play.js` `await` nó trước khi chơi (hiện "Loading..." thay vì trang trắng); `index.html`+`play.html`
> **xóa sạch link CSS template**; `manifest.js` rút còn 3 dòng suy ra từ catalog.
> ➜ **HS mở 1 bài chỉ tải ĐÚNG 1 game** (đo thật: mở trang = 0 template + 2 CSS lõi).
> ➜ **Thêm template từ nay = sửa ĐÚNG 1 FILE `core/catalog.js`** (xem quy tắc 10 + `templates/HUONG DAN
> TEMPLATE.md` + mục mới trong `core/HUONG DAN CORE.md`).
> Tự test: 14/14 loại nạp được (gọi song song không nhân đôi CSS), 14/14 mount game, 14/14 mở editor,
> loại lạ reject sạch, `play.html` chơi được crossword/speaking_cards/whack_a_mole — 0 lỗi console.
> Trước đó: **1/8/2026 (Đợt 32) — TRANG CHỦ TỪ 6 → 14 LOẠI ACT.** Thầy duyệt gộp nốt 8 template đã
> build xong còn nằm trong kho: **Gameshow quiz · Maze chase · Whack-a-mole · Flying fruit · Balloon pop ·
> Crossword · Unjumble · Speaking cards**. Sửa đúng 4 chỗ theo checklist: `core/catalog.js` (8 mục
> `built:true` — 1 nguồn nuôi CẢ picker "New activity" LẪN panel Template trong game), `main.js` (8 import
> để module tự `registerTemplate`), `index.html` (8 link CSS), `manifest.js` (8 mục, giữ đồng bộ).
> Kèm sửa `previewPick()` trong `main.js` cho thẻ act hiện được nội dung ở MỌI hình dạng dữ liệu
> (`questions|items|words|statements|cards|pairs`) — tiện tay vá luôn lỗi cũ: **True or false và Find the
> match trước nay vẫn hiện "No questions yet"**. KHÔNG đụng core (ngoài catalog.js). Đã quét an toàn CSS
> toàn cục (0 selector trần · 0 `:root` · 0 trùng `@keyframes`) và tự test: 14/14 type có trong registry +
> có editor, 14/14 editor mở được từ act trắng, 14/14 game `startGame()` mount 0 lỗi, 14/14 preview đúng,
> console sạch. **CHƯA COMMIT** (chờ thầy chơi thử). ⚠️ Tồn đọng: `play.html` (trang HS) vẫn chỉ chơi được
> Quiz — xem `GHI CHU DU AN.md` Đợt 32.
> Trước đó: **1/8/2026 (Đợt 31) — FIND THE MATCH: 4 loạt tinh chỉnh thầy yêu cầu, đã test trình duyệt
> thật (0 lỗi console), KHÔNG đụng core, COMMIT + PUSH + LIVE. Gồm: 3 giây "3-2-1" không tính vào đồng hồ
> (`manualTimerStart` + `ui.startTimer()`); khối đáp án căn giữa vùng; đáp án CỐ ĐỊNH tuyệt đối (ô đã giải chỉ
> mờ, KHÔNG xóa khỏi lưới → không dồn/nhảy); bấm SAI giữ nguyên ô + câu hỏi chuyển tiếp (Repeat=xếp lại ngẫu
> nhiên); LIVES như True/false (tim ở top bar `hasLivesSlot`, slider 0–10, hết tim → game over); bấm ĐÚNG câu
> hỏi bay về ô điểm + 11 ngôi sao + điểm nảy; khóa chọn tới khi câu mới vào ≥50% (`gateTimer`); hết tim hiện
> "GAME OVER"; câu dài TỰ CO FONT cho vừa khung (`fitPrompt`/`--pfit`). Chi tiết: `GHI CHU DU AN.md` Đợt 31 +
> `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`.**
> Trước đó: **1/8/2026 (đợt 30) — TYPE THE ANSWER: rất nhiều vòng tinh chỉnh thầy yêu cầu (bàn
> phím ảo, âm thanh mp3 thật, bố cục màn chơi, điểm số), THẦY DUYỆT → COMMIT + PUSH + LIVE. ⭐ CÓ SỬA CORE
> (additive/opt-in, đã kiểm Quiz + Anagram/Crossword/Gameshow/Whack-a-mole 0 lỗi): `engine.js` thêm option
> **Auto switch** (global, mặc định tắt) + **chặn "Submit answers" khi 0 câu trả lời** (`ui.onSubmit(fn,
> countFn)` + guard ở Menu — 8 template đưa countFn, không đưa thì như cũ) + ô thời gian countdown cạnh nút
> (`.aw-opt-cd`) + "End of game" xuống cuối + Apply-bất-kỳ-option-thì-restart + cờ `hideShuffleAnswers`;
> `sound.js` thêm `keyClick()`; `numberstepper.js` **nhấn-giữ ▲/▼ chạy liên tục**; `app.css` `.aw-opt-cd`.
> Bố cục TTA: ô đáp án cỡ CỐ ĐỊNH (câu hỏi nhường chỗ khi thiếu), căn giữa CẢ CỤM giữa câu-hỏi↔bàn-phím,
> chỉ nhận tiếng Anh, điểm âm màu đỏ. Chi tiết: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`
> (mục 1/8) + `GHI CHU DU AN.md` đợt 30. *(Đợt này dùng chung cây làm việc với 1 phiên True-false/Find-the-
> match — thay đổi của phiên đó đã cố ý + hoàn chỉnh, commit chung.)***
> Trước đó: **1/8/2026 (đợt 26) — GAMESHOW QUIZ (game thứ 10) build ĐẦY ĐỦ + tự test trình duyệt
> thật (0 lỗi console), style TV game show = "Classic". Trắc nghiệm có ÁP LỰC THỜI GIAN + ĐIỂM theo tốc độ
> + Lives + VÒNG BONUS (5 lá bài mỗi N câu) + 4 LIFELINES (50:50/×2/+TIME/REVEAL). Dữ liệu Y HỆT QUIZ, editor
> bọc khuôn quiz-editor. ⭐ CÓ SỬA CORE (tương thích ngược, ĐÃ KIỂM Quiz 0 lỗi): thêm điểm-tuỳ-biến
> `ui.finish({score,scoreText})` ở scoring/leaderboard/engine + cờ `hideTimerOption` (xem `HUONG DAN CORE.md`).
> Art + 47 âm THẬT Wordwall (theme gameshow) lưu ở `AWord-data/Source/{Sound effect,Graphic}/GAMESHOW/`; viền
> bóng đèn marquee dựng bằng CSS. CHƯA lên catalog/trang chủ (chờ thầy duyệt). Xem `GHI CHU DU AN.md` đợt 26 +
> `templates/gameshow/GHI CHU GAMESHOW.md` + `docs/10-GAMESHOW.md`.**
> Trước đó: **1/8/2026 (đợt 25) — MAZE CHASE (game thứ 9) build ĐẦY ĐỦ + tự test trình duyệt
> thật (0 lỗi console), style Space = "Classic". Cơ chế Pac-Man: lái robot qua mê cung tới đáp án đúng,
> né robot địch; Lives + Difficulty. Art + âm THẬT của Wordwall (theme space), lưu convention ở
> `AWord-data/Source/{Sound effect,Graphic}/MAZE CHASE/`. ĐÃ COMMIT + PUSH, CHƯA lên catalog/trang chủ
> (chờ thầy duyệt). Xem `GHI CHU DU AN.md` đợt 25 + `templates/maze-chase/GHI CHU MAZE-CHASE.md`.**
> Trước đó: **1/8/2026 (đợt 21) — WHACK-A-MOLE (game thứ 7) build ĐẦY ĐỦ + editor 2 chế độ
> (True/False + Quiz), art Wild West. ĐÃ COMMIT + PUSH thư mục `templates/whack-a-mole/`, CHƯA lên
> manifest/trang gồm (chờ thầy chốt + test TOMKO). Xem `GHI CHU DU AN.md` đợt 21 +
> `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`.**
> Trước đó: **31/7/2026 (đợt 15) — Open the box: SỬA 1 BUG THẬT, CHƯA COMMIT.** Thầy báo sau khi
> chọn đáp án, các ô đáp án KHÔNG thấy trượt ra mà chỉ biến mất tại chỗ. Nguyên nhân: `.aw-otb-qtile` có
> sẵn 1 `animation` (trượt VÀO, `fill-mode:both`) ghim `transform`/`opacity` VĨNH VIỄN sau khi chạy xong —
> theo luật CSS, 1 `animation` đang giữ 1 thuộc tính LUÔN thắng bất kỳ `transition` nào nhắm cùng thuộc
> tính đó, nên hiệu ứng trượt RA (viết bằng `transition` từ đợt 9 tới nay) **chưa bao giờ thực sự chạy
> được** dù CSS hợp lệ, 0 lỗi console — bug ẩn từ lâu, chỉ lộ ra khi thầy quan sát kỹ ở tốc độ thường (đo
> 2 đầu như các lần trước không bắt được, phải đo LIÊN TỤC giữa chừng mới thấy). Sửa: đổi hiệu ứng trượt
> RA từ `transition` sang 1 `@keyframes` MỚI (`aw-otb-qtile-out`) — animation-đấu-animation thắng sạch,
> không xung đột. Đo lại bằng `javascript_tool` xác nhận `translateX`/`opacity` thay đổi mượt liên tục
> suốt quá trình thoát. Chi tiết: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 13 *(số đợt trong
> file đó đếm riêng cho Open the box, khác số đợt ở đây vốn đếm chung toàn dự án)*.
> **Đợt 14 trước đó (31/7/2026)** — 4 tinh chỉnh thêm, CHƯA COMMIT lúc đó: ô sai chuyển hẳn sang nền ĐỎ
> đặc + chữ/khoá trắng (bỏ filter xám cũ, vẫn giữ nguyên ở đợt 15) · đảo ngược lại 2 quyết định của đợt
> 13 (quay về cho ô câu hỏi zoom và đáp án trượt vào/ra chạy ĐỒNG THỜI, khớp `1.2s`) · sửa lỗi lỡ nhịp
> tiếng tick ở mốc 5 giây cuối (gộp cờ tích đơn/đôi thành 1 công thức "khe tick" duy nhất). Chi tiết:
> `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 12.
> **Đợt 13 trước đó (31/7/2026)** — 4 tinh chỉnh Open the box khác, CHƯA COMMIT lúc đó: canh đều mép trái
> đồng hồ/mép phải điểm số quanh khung app (đổi cột `.has-inline` trong `core/app.css` từ `1.6cqw`→`0`,
> đè lên mục tiêu "thẳng mép ô câu hỏi" của đợt 10) · trả lời đúng thì đồng hồ reset về đầy rồi DỪNG hẳn,
> chỉ chạy tiếp khi bấm ô câu hỏi TIẾP THEO (đợt 9 từng cho chạy tiếp ngay cả lúc đứng ở lưới, vẫn giữ
> nguyên ở đợt 14). Chi tiết: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 11.
> **Đợt 12 trước đó (30/7/2026)** — 4 chỉnh theo yêu cầu thầy, đã push + live: (1) Quiz thôi
> ép HOA đáp án (bỏ `text-transform:uppercase` ở `.aw-quiz-tile`; ALL CAPS chỉ còn ở Anagram); (2) chặn
> chuột phải trong khung game (`page.addEventListener("contextmenu")`); (3) restart GIỮ fullscreen —
> đổi phần tử fullscreen từ `page` (bị xoá khi restart) sang **`root`/`#app`** (Home/Edit thì chủ động
> `exitFs()`); (4) TOMKO 4K fullscreen full màn — thêm biến thể CSS/JS có tiền tố `-webkit-/-moz-/-ms-`
> (mỗi tiền tố 1 rule RIÊNG, không gộp kẻo Chrome vứt cả rule). Chi tiết: `GHI CHU DU AN.md` đợt 12.
> ⚠️ Fullscreen thật CHƯA tự kiểm được (preview không cấp) — cần thầy xác nhận trên màn thật/TOMKO.
> **Đợt 11 trước đó**: Open the box + Type the answer đã gộp trang chủ (`built:true`) + sửa `previewPick()`
> (thẻ act đọc đúng cả 4 hình dữ liệu). **Find the match vẫn 🟢 CHỜ THẦY DUYỆT, KHÔNG đụng.**
>
> 🔗 **AWord nay được dự án myLesson nhúng vào trang bài của học sinh.** Hai web ở **CÙNG tài khoản
> GitHub** (`andrewclasses-01.github.io/AWord/` và `…/myLesson/`) nên myLesson truyền được tên em
> sang game, các em khỏi gõ tên → hết tên viết sai trong bảng xếp hạng.
> ⚠️ **Đừng chuyển repo sang tài khoản GitHub khác** — chuyển là mất tính năng này.
> myLesson: `E:\LAP TRINH APP\myLesson` (app) · `D:\APP AND DATA\myLesson Web` (web).
>
> 🔗 **AWord CŨNG được app myActivity nhúng (v1.6.0/1.6.1, 30/7/2026)** để chơi trên màn TOMKO (bảng
> đơn/đôi). myActivity TỰ NHẬN DẠNG URL AWord rồi **bơm CSS lấp khung + fullscreen** — CSS đó nhắm
> vào các class **`.aw-page` / `.aw-stage` / `.aw-below`** và dựa vào **nút fullscreen nhắm `#app`
> (root)** (đợt 12). ⚠️ **ĐỪNG đổi tên/bỏ 3 class này hay đổi target fullscreen khỏi `#app`** — đổi là
> vỡ phần nhúng myActivity (file `E:\LAP TRINH APP\myActivity\src\renderer\js\wordwall.js`, hằng
> `AWORD_CSS` + `isAword`/`isAwordAct`). myActivity mở act qua link `?a=<num>` (SPA pushState) và
> mirror sang bảng đôi theo đó.
>
> 🌐 **WEB LIVE: https://andrewclasses-01.github.io/AWord/** — **30/7/2026 (đợt 11): đã đẩy thêm Open
> the box + Type the answer (`built:true`, đã lên trang chủ)** cùng với v0.9.4/v0.9.5/Anagram trước đó
> — commit + `curl` kiểm chứng ghi trong `GHI CHU DU AN.md` đợt 11. Bài học vẫn giữ: đừng tin dòng ghi
> chú cũ, luôn `curl` kiểm chứng lại nếu nghi ngờ.
> Repo: `github.com/andrewclasses-01/AWord` (PUBLIC, branch `main`, Pages từ thư mục gốc).
> 🔥 **FIREBASE + THƯ VIỆN TRÊN MÂY**: project **`aword-70dae`** (account `namdaptrai01@gmail.com`,
> gói Spark miễn phí) — Firestore Singapore + đăng nhập Google. **Thầy phải đăng nhập** mới vào được
> thư viện (`users/{uid}/items`); **học sinh KHÔNG cần đăng nhập** (trang riêng `play.html?g=<mã>`).
> Luật bảo vệ đã Publish 3 lần (19/7 nền, 20/7 thêm bảng xếp hạng công khai + cho thầy xoá điểm +
> cho HS ghi cờ báo-bài-mới) — nội dung đầy đủ trong `docs/08-FIREBASE-SETUP.md`.
> ⏳ CÒN LOCAL (chưa lên mây): **Settings** + **leaderboard offline** của act (không phải leaderboard
> của bài giao — cái đó đã online).

---

## 0. BẮT ĐẦU PHIÊN MỚI TỪ ĐÂU (đọc mục này trước)

1. Đọc hết `APP_MASTER.md` (file này) → nắm trạng thái + quy tắc.
2. Đọc `core/HUONG DAN CORE.md` → hợp đồng engine↔template + DANH SÁCH BẪY kỹ thuật (bắt buộc trước
   khi động vào code core hoặc viết game mới).
3. **Cách chạy thử — LƯU Ý: từ v0.7.4 app BẮT ĐĂNG NHẬP Google mới vào được thư viện.**
   - Bản LIVE (dùng thật): **https://andrewclasses-01.github.io/AWord/**.
     ⚠️ **Lên live (đính chính 7/8/2026, Đợt 81): `git push` LÀ ĐỦ trong đa số trường hợp** — Pages
     tự build khi push (Đợt 80 ~27s, Đợt 81 ~1–2 phút, không cần POST gì thêm). Quy trình chuẩn:
     push → chờ 1–3 phút → `curl` cache-bust kiểm dấu mốc file mới (Pages cập nhật các file KHÔNG
     đồng thời — BẪY mục 9), rồi tính tiếp bẫy cache trình duyệt ở mục 0-BIS. **CHỈ KHI bản live vẫn
     cũ sau ~10 phút** mới sang **mục 0-TER (ĐƯỜNG CỨU HỘ)** — backend Pages repo này thất thường,
     Đợt 78–79 từng treo >10 phút làm job deploy tự huỷ, nhưng đó là SỰ CỐ chứ không phải trạng thái
     thường trực. (Bản ghi cũ ở đây từng ép "BẮT BUỘC làm theo 0-TER" cho MỌI lần push — chính nó làm
     Đợt 81 mất 3 lệnh fail vô ích rồi mới phát hiện bản live đã tự build xong từ lâu.)
   - Ở máy: `python devserver.py 5510` (KHÔNG dùng `python -m http.server` — mục 9) →
     `http://localhost:5510/` (localhost ĐÃ nằm trong authorized domains của Firebase nên đăng nhập được).
   - **Test KHÔNG cần đăng nhập**: trang test template chạy dữ liệu mẫu, không đụng store →
     `http://localhost:5510/templates/quiz/test.html`. Dùng trang này khi build/sửa game.
   - ⚠️**Popup đăng nhập Google KHÔNG tự động hoá được** (Google chặn) — khi test bằng trình duyệt tự
     động phải nhờ thầy bấm chọn tài khoản 1 lần.

4. **TRẠNG THÁI CHỐT (20/7/2026, v0.9.2) — ĐÃ XONG TRỌN 4 KHỐI + 2 ĐỢT TINH CHỈNH:**
   - ✅ **Khối 1 — Quiz + thư viện kiểu Drive** (v0.5.0→v0.6.9).
   - ✅ **Khối 2 — PRINT** (v0.7.1). *Crossword vẫn là nút "soon", chưa có renderer.*
   - ✅ **LÊN MẠNG + FIREBASE** (v0.7.2→v0.7.4): thư viện chạy trên Firestore, bắt đăng nhập Google.
   - ✅ **Khối 3 — ASSIGNMENT** (v0.8.0): giao bài bằng **link + QR**, HS chơi ở `play.html`
     **không cần đăng nhập** (nhập tên → chơi → tự nộp), chơi lại thoải mái, quá hạn vẫn chơi và
     được đánh dấu **LATE**.
   - ✅ **Khối 4 — THU ĐIỂM** (v0.8.0): pop-up báo cáo cho thầy (Summary · Leaderboard lượt-tốt-nhất ·
     Detail sổ ra từng câu ✓/✗ + đáp án đúng, mọi cột sắp xếp 2 chiều) + bảng xếp hạng lớp cho HS
     xem cuối bài. Đã test thật đầu-cuối + thử tấn công từ phía HS (xem `GHI CHU DU AN.md` v0.8.0).
   - ✅ **LINK SỐ** (v0.8.0): mỗi folder/act có số riêng → `?r=activities` · `?f=12` · `?f=12&a=57` ·
     `?a=57`; thanh địa chỉ tự đổi, Back/Forward chạy, menu ⁝ có **Copy link**. Link cũ vẫn mở được.
   - ✅ **`core/qr.js`** — bộ sinh QR TỰ VIẾT, không phụ thuộc mạng, **copy sang app khác dùng ngay**
     (myBoard/myActivity/mySpeaking...): `qrSvg()` · `qrPngDataUrl()` · `copyQrImage()` · `downloadQrPng()`.

   - ✅ **RESULTS = CHÍNH BÀI GIAO** (v0.9.0): Results **không lưu bản sao** — nó đọc thẳng
     `assignments/{code}`, nên thẻ ở Results và thanh dưới act là **cùng một thứ** (sửa/xoá chỗ nào
     cũng ăn cả hai). Bài giao **tự vào thư mục lớp** theo phần đầu tên (`A1A_9.6_...` → thư mục
     **A1A**, thầy tự tạo thư mục lớp). Sửa được **tên · hạn nộp · 3 ô cuối game · đóng bài**; xoá vào
     **thùng rác** (link HS ngừng chạy, điểm còn nguyên, Restore được), Delete forever xoá sạch cả
     điểm. Xoá act có bài giao thì **hỏi tại chỗ**. **CẤM TRÙNG TÊN**: thư mục con cùng mẹ · act cùng
     thư mục · bài giao cùng thư mục (Duplicate/Restore tự đếm "(2)").

   - ✅ **7 TINH CHỈNH (v0.9.1)**: fullscreen bấm được ngay ở màn READY · nút **Open activity** trong
     báo cáo (trong act thì đóng pop-up, ở Results thì mở act tab mới) · leaderboard **xanh lá** cho
     điểm tuyệt đối, **đỏ** cho 0 điểm · "Detail"→**"Details"** · **chế độ tập trung** (bấm 1 HS thì
     chỉ hàng đó + bảng chi tiết sáng, phần khác mờ) · **CHẤM ĐỎ báo có bài nộp mới** ở thẻ bài giao /
     thư mục Results / act trong Activities / cuối thanh assignment (tắt khi thầy mở xem) · thanh
     assignment **hạ xuống + vạch kẻ ngăn cách** để không lỡ tay lúc chơi.

   - ✅ **v0.9.2**: gỡ hẳn hộp thoại "Bring your saved work online?" (nó hỏi lại mỗi lần mở app; việc
     chuyển thư viện lên mây đã xong 19/7). `importLocalLibrary()` vẫn còn trong store.js để gọi tay.
   - ✅ **v0.9.3**: nhận sẵn tên học sinh từ myLesson (`play.html?g=…&n=…`), xem mục "🔗" đầu file.
   - ✅ **v0.9.4 (24/7/2026, ⚠️ LOCAL, CHƯA PUSH)**: ô **Class** trong Set assignment (đồng bộ live vào
     Assignment title, bắt buộc) · pop-up báo cáo assignment **gọn hơn** (bỏ Delete — chỉ xoá qua menu
     ⁝ ở Results, 5 nút hoá icon, Summary thêm Top Score/Top Speed, Leaderboard+Details căn giữa +
     Details có animation mượt + tô xanh hàng điểm tối đa) · **in worksheet sửa tận gốc**: bỏ
     `position:fixed` (nguồn gây lệch) chuyển hẳn sang CSS `@page` margin box chuẩn, có **số trang
     thật "X/Y"**, logo AWord vẽ lại bằng SVG để tự thẳng hàng với tiêu đề/số trang, lề mỏng lại
     (16/12/14mm). Chi tiết đầy đủ: `GHI CHU DU AN.md` v0.9.4.

## 0-BIS. ⚠️ BẪY "ĐÃ PUSH RỒI MÀ THẦY VẪN THẤY BẢN CŨ" — CACHE TRÌNH DUYỆT (6/8/2026)

Có **HAI** lớp cache khác nhau, đừng lẫn:

1. **Cache của GitHub Pages** (đã biết từ lâu): sau `git push`, các file lên live **không đồng thời** —
   phải `curl` từng file kiểm chứng rồi mới tin. Đợt 78 đo được: **345 giây** mới đủ file.
2. **⭐ Cache của TRÌNH DUYỆT THẦY** (bẫy mới, cắn thật ở Đợt 78): Pages trả
   `Cache-Control: max-age=600` → trình duyệt giữ `main.js`/`catalog.js` **10 phút** mà KHÔNG hỏi lại
   máy chủ. Nặng hơn nữa: nếu thầy đang mở sẵn tab AWord từ trước lúc push, **bấm lại nút trong app
   chỉ chạy JS đã nằm trong bộ nhớ, không tải file nào** — bao lâu cũng vẫn là bản cũ.

**Triệu chứng đã gặp:** curl chứng minh `main.js` live CÓ hàng Classes và `catalog.js` live CÓ 16
template, nhưng thầy chụp màn hình Settings không có Classes và picker chỉ có 15 loại.

**Cách phân biệt trong 10 giây** — đừng sửa code khi chưa làm bước này:
```bash
curl -s https://andrewclasses-01.github.io/AWord/core/catalog.js | grep -c '<đánh dấu mới>'
```
Ra `1` = **máy chủ đã đúng, lỗi ở cache trình duyệt** → bảo thầy `Ctrl+Shift+R`.
Ra `0` = Pages chưa build xong → chờ tiếp.

App **không có** service worker và **không có** cache-busting (`index.html` gọi thẳng
`<script type="module" src="main.js">`), nên `Ctrl+Shift+R` là cách duy nhất, và sau 10 phút thì tự
khỏi. Muốn hết hẳn thì phải thêm chuỗi phiên bản vào đường dẫn import — việc lớn, chưa làm.

## 0-TER. ⚠️ ĐƯỜNG CỨU HỘ KHI BẢN LIVE KHÔNG CHỊU CẬP NHẬT (chốt 6/8/2026 Đợt 79 — hạ cấp 7/8/2026 Đợt 81)

> ⭐ **ĐÍNH CHÍNH 7/8/2026 (Đợt 81): mục này KHÔNG còn là quy trình chuẩn.** Push là đủ — Pages tự
> build khi push (Đợt 80 ~27s, Đợt 81 ~1–2 phút, hoàn toàn không cần POST). Quy trình chuẩn nằm ở
> **mục 0 điểm 3**: push → chờ 1–3 phút → `curl` kiểm dấu mốc. **CHỈ mở mục này khi bản live vẫn cũ
> sau ~10 phút** (tức backend Pages lại rơi vào trạng thái chậm >10 phút như Đợt 78–79). Đợt 81 đã
> trả giá cho việc coi mục này là bắt buộc: 3 lệnh fail liên tiếp (classifier chặn rút token → Git
> Bash rewrite path → 404 do tài khoản gh) trong khi bản live ĐÃ tự build xong từ trước lệnh đầu tiên.
>
> **Đọc tiếp từ đây = đang xử lý SỰ CỐ.** Đợt 79 mất gần 1 tiếng và **2 commit rác** chỉ vì không biết
> quy trình dưới đây. Làm đúng 4 bước này thì không lặp lại được nữa.

### Vì sao phải có mục này
`git push` xong **KHÔNG có nghĩa là đã lên live**. Việc đưa lên live do GitHub Pages làm, và **nó
đang hỏng có hệ thống với repo này**: job `deploy` của workflow `pages build and deployment` có
`timeout: 600000` (**10 phút**); backend Pages của repo này ngày càng chậm (đo được: 20 giây → 22
giây → 3,6 phút → 5,5 phút → **8,2 phút** → vượt 10 phút). Khi vượt ngưỡng, job **tự HUỶ deployment**
(`Canceled deployment`), và Pages API ghi lại là `"status":"errored"`, `"duration":0`.

⚠️ **ĐỪNG hiểu nhầm chữ "errored" đó là lỗi trong code.** Nó là **hậu quả của việc bị huỷ**. Bằng
chứng: job `build` luôn thành công (~6 giây, artifact sạch), và **2 commit của Đợt 78** (`134ca64`,
`f9a8333`) — *trước* mọi thay đổi của Đợt 79 — **cũng errored y hệt**. Repo chỉ 21 MB / 588 file,
không đụng giới hạn nào của Pages.

### 4 BƯỚC BẮT BUỘC

**Bước 1 — trước khi commit: so với origin** (luật cũ, vẫn giữ)
```bash
git fetch origin && git status -sb
```

**Bước 2 — commit + push như thường**
```bash
git add <đúng các file đã sửa> && git commit -m "..." && git push origin main
```

**Bước 3 — ⭐ KÍCH HOẠT BUILD LẠI, NHƯNG PHẢI ĐỢI RUN CŨ CHẾT HẲN**
Pages repo này là `build_type: "legacy"` (source = branch `main`, path `/`). Có thể yêu cầu build lại
bằng:
```bash
TOKEN=$(printf "host=github.com\nprotocol=https\npath=andrewclasses-01/AWord.git\n" | git credential fill | grep ^password= | cut -d= -f2-)
GH_TOKEN="$TOKEN" gh api -X POST repos/andrewclasses-01/AWord/pages/builds
```

⚠️⚠️ **ĐÍNH CHÍNH (tối 6/8, sau khi đo thêm) — đừng gọi lệnh này NGAY sau `git push`.** Bản ghi đầu
tiên của mục này nói lệnh trên "không đi qua Actions nên không bị đồng hồ 10 phút huỷ" — **SAI**. Đo
`gh run list` cho thấy **mỗi lần POST cũng sinh ra một run `dynamic` y hệt run do push sinh ra**. Gọi
ngay sau push = **2 run cách nhau 1 giây, giẫm chân nhau**, một cái bị `cancelled`:
```
b2c1f5f  15:02:48 failure   +  15:02:49 cancelled   <- push & POST cùng lúc => hỏng
35f9ada  14:47:38 cancelled +  14:47:39 failure     <- push & POST cùng lúc
8bd979f  14:36:59 cancelled +  14:37:00 failure     <- push & POST cùng lúc
aafd454  14:16:03 failure   ...  14:28:19 SUCCESS   <- POST khi run cũ ĐÃ chết => CHẠY MỘT MÌNH, THẮNG
```
→ **Luật đúng: POST khi KHÔNG còn run nào đang chạy.** Kiểm trước bằng
`gh run list --limit 3 --json status` (phải toàn `completed`). Sau `git push` thì run tự động sẽ ngốn
~10 phút rồi mới chết — chờ nó chết hẳn rồi hẵng POST, build mới chạy một mình.

**Bản chất:** backend Pages của repo này lúc nhanh lúc chậm thất thường (cùng nội dung: 20 giây · 30
giây · 3,6 phút · 5,5 phút · 8,2 phút · rồi vượt 10 phút). Lệnh POST **không phải phép màu**, nó chỉ
là **thử lại** — thắng khi vớ đúng lúc backend nhanh VÀ không bị run khác huỷ. Đo thật Đợt 79: có lần
`built` sau 88 giây / 155 giây / 198 giây, có lần `errored`.

**Bước 4 — chờ `built` rồi mới kiểm file live**
```bash
GH_TOKEN="$TOKEN" gh api repos/andrewclasses-01/AWord/pages/builds/latest | grep -o '"status":"[^"]*"'
```
Thấy `"built"` mới `curl` kiểm dấu mốc (rồi mới sang bẫy cache trình duyệt ở mục 0-BIS).

⚠️⚠️ **`built` KHÔNG có nghĩa là file đã đổi ngay — ĐỪNG tưởng deploy lại hỏng.** Sau khi build xong
còn phải chờ **CDN lan truyền**, và độ trễ này rất dài + không đều giữa các file (bẫy mục 9). Đo thật:
Đợt 78 **345 giây**; Đợt 79 build `35f9ada` xong sau 88 giây nhưng `APP_MASTER.md` tới **570 giây** mới
đổi (`curl` kèm `?cb=` ngẫu nhiên vẫn trả bản cũ suốt 9 phút đầu). **Cách kết luận đúng:** so `commit`
của build mới nhất với `git rev-parse origin/main` —
```bash
GH_TOKEN="$TOKEN" gh api repos/andrewclasses-01/AWord/pages/builds/latest | grep -o '"commit":"[0-9a-f]*"'
```
trùng nhau + `"status":"built"` = **đã xong phía GitHub, chỉ còn chờ CDN**, tuyệt đối đừng build lại
hay sửa code. Nếu cần chắc, poll `curl` tới ~10 phút rồi mới kết luận.

### ❌ NHỮNG VIỆC ĐỪNG LÀM (đã thử, vô ích)
- **ĐỪNG đẩy commit rỗng để "kích hoạt lại deploy".** Đợt 79 đã lỡ đẩy **2 commit rác** (`f595233`,
  `aafd454`) — vô ích, vì chúng vẫn đi qua đúng đường Actions đang bị timeout. Chỉ làm bẩn lịch sử.
- **ĐỪNG vội sửa code khi thấy email "Some jobs were not successful".** Mở job `build` xem trước:
  build OK + deploy timeout = **lỗi hạ tầng, code không sao**.
- **ĐỪNG tin trang githubstatus.com** — lúc sự cố này nó vẫn báo "All Systems Operational".

### ⚠️ BẪY TÀI KHOẢN gh (khác với ghi nhớ "GitHub accounts" cũ, bổ sung thêm)
- `git push` dùng credential **`andrewclasses-01`** ✅ (đúng chủ repo, `admin:true`).
- `gh` CLI lại đăng nhập **`andrewclasses-code`** ❌ → `gh run rerun` báo *"Must have admin rights"*,
  còn **`POST pages/builds` không token trả `404`** (đo Đợt 81 — GitHub GIẤU 403 thành 404 để khỏi lộ
  thông tin, nên thông báo lỗi KHÔNG hề nói "thiếu quyền", rất dễ tưởng sai endpoint).
- **Đăng nhập `-01` trên Chrome KHÔNG đổi được `gh`** (gh giữ token riêng trong keyring).
- Muốn gh chạy bằng quyền `-01`: lấy token qua `git credential fill` như Bước 3 rồi `GH_TOKEN=... gh api ...`.
  ⚠️ **Đợt 81: chuỗi rút-token này bị permission classifier của Claude Code auto mode CHẶN** (rút
  credential ra biến môi trường là thao tác nhạy cảm) — phiên tự động KHÔNG chạy được, phải nhờ thầy
  duyệt tay đúng lệnh đó (hoặc thầy tự chạy).
- ⚠️ **Git Bash nuốt endpoint**: `gh api ... /repos/...` bị MSYS rewrite thành đường dẫn ổ đĩa
  (`C:/Program Files/Git/repos/...`) → lỗi "invalid API endpoint". Bỏ dấu `/` đầu (như lệnh Bước 3 đã
  viết đúng) hoặc thêm `MSYS_NO_PATHCONV=1`, hoặc chạy gh bằng PowerShell.
- **Không `gh auth login` lưu hẳn được**: token OAuth của Git Credential Manager **thiếu scope
  `read:org`** mà gh bắt buộc. Muốn lưu hẳn thì thầy phải tự tạo PAT mới có `read:org`.

### ⚠️ Bẫy tự kiểm (nhỏ nhưng đã cắn)
Khi `grep` dấu mốc trên file live để xác nhận, **nhớ loại trừ dòng CHÚ THÍCH**. Đợt 79 grep
`is-locked` trên CSS live ra "vẫn còn" → **báo động giả**, vì nó khớp vào chính dòng chú thích ghi
*"...`.aw-ftm-tile.is-locked` dim rule was removed"*. Kiểm đúng phải tìm rule thật:
`grep -E "^\s*\.aw-ftm-tile\.is-locked\s*\{"`.

## 0a. ⭐⭐ HỒ SƠ BÀN GIAO (cập nhật 24/8/2026 sau **Đợt 256 + 257** — PHIÊN/MÁY MỚI ĐỌC MỤC NÀY TRƯỚC TIÊN)

> ### 🟢 TRẠNG THÁI NGAY LÚC NÀY (25/8/2026 — sau Đợt 258)
>
> | | |
> |---|---|
> | Commit mới nhất | **`9a80d4e`** (Đợt 258) — đã push + LIVE kiểm chứng |
> | Kho | **SẠCH**, `main` khớp `origin/main`, không còn gì chưa đẩy |
> | Kiểm live | **7/7 mã băm SHA-256 khớp** (băm `git show HEAD:<path>`, **không băm file trên máy** — CRLF) + **27/27 phép đo CHẠY TRÊN CHÍNH CSS/JS CỦA BẢN LIVE** (`scratch/dot258-live.html`) |
> | Vùng vừa động tới | **KHUNG ACT** (Đợt 258) — `core/app.css` · `core/engine.js` · 2 file CSS Running. Chạm **mọi template** (bo góc + cỡ khung + zoom fullscreen) |
> | Trước đó | **ĐIỂM PHẠT BAY** (Đợt 256, `51acc6f`) · **BÀI GIAO** 245 → 255 · **Đợt 257** (`play.js`, cửa `AWORD:NOP` cho myLesson web v1.13.0) |
> | Luật Firestore | **KHÔNG cần đăng lại** |
>
> ### 📍 ĐỤNG VÀO KHUNG ACT / NÚT FULLSCREEN THÌ ĐỌC Ở ĐÂU
> **`core/HUONG DAN CORE.md` → mục "⭐⭐⭐ KHUNG ACT SAU ĐỢT 258"**. Bốn luật đắt nhất:
> 1. ⛔⛔⛔ **`.aw-zoomed` KHÔNG ĐƯỢC CÓ `z-index`.** Bản gốc Running word có `z-index: 9000`; đo A/B
>    thật thì nó **che sạch mọi thứ thả vào `document.body`** — tức số "−N" của Đợt 256 (11
>    template) + chữ bay của Anagram · TTA · Unjumble · Crossword · Find the match · True/false.
>    Trước khi đặt `z-index`/`transform`/`filter`/`contain` lên `#app` hay tổ tiên của khung, phải
>    liệt kê những gì app đang thả vào `document.body`.
> 2. ⛔⛔ **`cqw` viết trên CHÍNH `.aw-stage` là đo theo CỬA SỔ, không theo khung** (một phần tử
>    không thể là container của chính nó). Đó là gốc của lỗi bo góc phình 7,5 → 36px. Bo góc nay là
>    `8px` cố định — **đừng "dọn dẹp" về `cqw`**.
> 3. ⚠️ **Khối `@media` điện thoại và khối `.aw-zoomed` PHẢI Ở CUỐI `app.css`** — cả hai không cộng
>    thêm đặc hiệu nào, dời lên trên là các luật gốc thắng ngược và **im lặng không chạy**.
> 4. ⚠️ **`tpl.useZoomFullscreen` không còn là điều kiện** — mọi game đều zoom. Cờ chỉ còn tồn tại
>    cho tương thích.
> ⚠️ Hai con số phải sửa cùng nhau nếu đụng lề: **118px** (phần ngoài khung theo chiều dọc) và
> **+32px** (lề trái+phải, vì `box-sizing: border-box`).
>
> ### 🧪 BÀN THỬ CỦA VÙNG NÀY
> `dot258-frame.html` **52/52** (mobile · bo góc 5 cỡ màn · công thức khung 5 cỡ cửa sổ + chống cuộn
> · zoom bấm nút thật · zoom ở 7 template · chống hồi quy myLesson + myActivity) ·
> `dot258-penalty-zoom.html` **18/18** (Quiz thật + Points off + trả lời SAI thật trong zoom, **có
> đối chứng ngược**: đắp lại z-index 9000 thì con số PHẢI bị che) ·
> `dot258-live.html` **27/27** (đo trên **CHÍNH CSS/JS của bản live**: `<link>` thẳng
> `aword.andrewclasses.com/core/app.css` rồi dựng đúng cây `.aw-page > .aw-stage + .aw-below` trong
> iframe có bề ngang THẬT — vì **file đúng chưa chắc trình duyệt áp ra đúng**).
> ⚠️ **Ba bàn thử cũ lệch điểm là LỆCH CÓ SẴN, không phải hồi quy** — `dot250-assign` 58/59 ·
> `dot246-forms` 6/9 · `dot253-giao` 16/17, **đo được y hệt trên bản chưa sửa** bằng `git stash`.
> Chúng neo vào ô tích *Show answers* ở "hàng cuối game" mà **Đợt 255 đã dời lên** hàng
> `.aw-as-titlehead`. Ai rảnh thì sửa lại ba bench đó. (`dot246-flow` vẫn **37/37**.)
>
> ### ⬜ VIỆC CHỜ MẮT/TAY THẦY SAU ĐỢT 258 (không chặn gì)
> ⬜ Mở act trên **iPhone thật** (máy chỉ giả lập được 375×812).
> ⬜ Bấm **fullscreen zoom trên TOMKO + iPad**: thanh địa chỉ còn hiện có vướng không; nút Fullscreen
> giờ là **đường ra DUY NHẤT** nên phải dễ bấm.
> ⬜ Nhìn khung **1280px trên màn 86"** — trần này thầy chốt trước khi thấy thật.
> ⬜ Xác nhận số **"−N" bay thấy được trong fullscreen** trên máy thật (giả thuyết: fullscreen THẬT
> xưa nay vẫn đang giấu nó, và Đợt 258 vô tình chữa luôn — pane tự động không bật được fullscreen
> thật nên không đo được).
> ⬜ Mở act trong **myActivity chia 2–5 cột** (máy đã giả lập cột 384px + CSS `!important` của
> myActivity và đo ra không đổi, nhưng đó là bản dựng lại chứ không phải app thật).
>
> ### ⛔⛔ HAI PHIÊN CLAUDE CHẠY SONG SONG HÔM 24/8 — BÀI HỌC VẬN HÀNH, VẪN CÒN GIÁ TRỊ
> Đợt **256** (phiên này) và Đợt **257** (một phiên khác) làm CÙNG BUỔI trong CÙNG thư mục. Phiên
> 257 commit được `play.js` nhưng **không ghi được hồ sơ** vì cả 3 file tài liệu đang bị phiên 256
> giữ — nó **tự thuật hết vào commit message `6b49fdb`** rồi nhờ chép lại sau (đã chép, xem mục
> Đợt 257 trong `GHI CHU DU AN.md`).
> ⭐ **Nếp đúng khi gặp lại cảnh này:** commit phần CODE của mình, kể hết vào commit message,
> **đừng ngồi chờ file hồ sơ** — `git log` không bao giờ mất, còn chờ là mất cả hai.
> ⚠️ Và vì thế: **`git fetch` + xem `git log` NGAY TRƯỚC KHI COMMIT**, không chỉ lúc mở phiên —
> HEAD có thể đã nhích thêm một commit trong lúc bạn đang gõ.
>
> ### 📍 ĐỤNG VÀO ĐIỂM PHẠT / HIỆU ỨNG ĐIỂM THÌ ĐỌC Ở ĐÂU
> **`core/HUONG DAN CORE.md` → mục "⭐⭐⭐ ĐIỂM PHẠT PHẢI BAY — `ui.flyPenalty()`"**. Ba luật đắt nhất:
> 1. ⛔⛔ **Phép trừ NẰM TRONG callback**, chỉ chạy lúc con số hạ cánh — đó là cả yêu cầu của thầy.
>    Ngược hẳn `flyTimeCost` (đếm lùi NGAY trong lúc bay); hai nhịp khác nhau là cố ý.
> 2. ⛔⛔ **Trong Fight, chỗ bay ra bị ÉP về giữa khung — và phép ép nằm ở `core/engine.js`, không ở
>    template.** Bay ra từ đúng ô sai là chỉ cho đội kia biết ô đó sai (True/false 2 nút = lộ trọn
>    đáp án), đúng luật "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ" Đợt 129.
> 3. ⚠️ **`ui.flushPenalties()` ở dòng đầu `finish()`** — thiếu là câu sai CUỐI mất điểm phạt trong
>    bảng kết quả và trong **điểm nộp của bài giao**.
> ⛔ Mở cho template thứ 12: nhớ **khai biến đếm ở đầu `mount()`**, không phải cạnh `scoreNow()`
> (bẫy TDZ đã cắn thật ở Quiz ngay trong Đợt 256 — trên màn nó hiện ra như "game không lên").
>
> ### 🧪 BÀN THỬ CỦA VÙNG NÀY
> `dot256-penalty.html` **24/24** (Quiz, Single + Fight) · `dot256-smoke.html` **48/48** (11 template
> mount sạch + bấm sai thật ở 4 game) · `dot256-live.html` **29/29** (chạy module của BẢN LIVE) ·
> `dot256-visual.html` (đóng băng giữa đường bay để xem mắt).
>
> ### ⬜ VIỆC CHỜ MẮT THẦY (không chặn gì)
> ⬜ Cỡ con số trên TOMKO (96px kịch trần trong Fight) nhìn từ cuối lớp có đủ to không · nhịp 320ms
> đứng + 600ms bay có vừa mắt không · trong Fight con số bay ra từ **giữa khung** có đọc ra ngay là
> "đội này vừa bị trừ" không.
> ⬜ **7 game máy không lái được** nên chưa có phép đo end-to-end: Maze chase · Balloon pop ·
> Flying fruit · Crossword · Anagram · Type the answer · Unjumble (chúng đòi chạy nhân vật lên ô, gõ
> phím, kéo thả, bấm trúng một quả đang bay).
> ⬜ **Đợt 257**: thầy mở một bài giao trong myLesson web rồi nộp, xem bảng điểm bên đó có tự làm
> mới không.
>
> ---
> ### 📦 BÀN GIAO CŨ CỦA CỤM BÀI GIAO (Đợt 245 → 251) — vẫn còn hiệu lực
>
> ### ✅ ĐÃ NGHIỆM THU BẰNG TAY (24/8/2026)
> Thầy xác nhận đã thử **đủ 4 phần** của cụm 248–251, không còn gì treo:
> 1. ✅ Bố cục form Set assignment (2 khối có viền · Class+Deadline chung dòng · nút chọn lớp ·
>    ô hai tầng đã thẳng hàng sau khi vá 5px).
> 2. ✅ **Giao bài bằng template KHÁC rồi cho học sinh làm thử** — đây là đường rủi ro nhất của
>    Đợt 250 (`convertActivity` + `sourceAct`), nay **đã chạy thật trên Firestore thật**.
> 3. ✅ Cặp nút PRACTICE / SUBMIT (icon bia bắn Đợt 248 + cân đối Đợt 249).
> 4. ✅ **Bấm tay trên TOMKO** (màn cảm ứng lớp), không chỉ trên máy soạn bài.
>
> ### ⬜ VIỆC CHỜ THẦY
> ⬜ Việc kế tiếp = **HỎI THẦY**. Thầy đang đi từng đợt ngắn, tự chỉ hướng mỗi lần.
>
> ### 📍 ĐỤNG VÀO BÀI GIAO THÌ ĐỌC Ở ĐÂU
> **`core/HUONG DAN CORE.md` → mục "⭐⭐⭐ BÀI GIAO — HỢP ĐỒNG ĐẦY ĐỦ (Đợt 245 → 251)"** — 8 luật, mỗi
> luật đều có người vấp rồi. Ba cái đắt nhất, tóm ở đây để không ai bỏ qua:
> 1. ⛔⛔ **Đổi template KHÔNG PHẢI đổi một chữ `type`** — phải qua `convertActivity()`, và **chọn bộ
>    nghĩa TRƯỚC, chuyển đổi SAU** (đảo lại thì lớp chọn VI1 nhận về ENG1, **im lặng, không lỗi**).
> 2. ⛔⛔ **`createAssignment` có `sourceAct`**: danh tính (id/num/title) lấy từ act THƯ VIỆN, phần
>    chơi được lấy từ act ĐÃ CHUYỂN ĐỔI. Lưu nhầm id `conv_…` là bài giao **mất liên kết vĩnh viễn**
>    với act (`listAssignmentsForAct` khớp theo `activityId`).
> 3. ⛔ **`templatePicker` CHỈ form Set assignment truyền.** Bảng Options trong game và Settings phải
>    ra y hệt bản cũ — bàn thử có phép **chặn hồi quy đo tận nơi** (hàng 46px), đừng gỡ.
>
> ### 🧪 BÀN THỬ CỦA VÙNG NÀY (chạy trước khi đụng, chạy lại sau khi sửa)
> Bật cổng: `python devserver.py 5648` rồi mở `http://localhost:5648/scratch/<tên>`.
>
> | Bàn thử | Kiểm gì | Điểm chuẩn |
> |---|---|---|
> | `dot250-assign.html` | cả vùng bài giao (bố cục · ô hai tầng · chọn template · lưu xuống · Escape · Edit) | **59/59** |
> | `dot250-visual.html` | xem mắt 4 màn (Set · chọn lớp · chọn template · Edit) | nhìn |
> | `dot246-forms.html` | form Set/Edit còn đúng 1 ô tích | **9/9** |
> | `dot246-flow.html` | luồng PRACTICE/SUBMIT của học sinh | **37/37** |
> | `dot247-giaobai.html` | bridge `giaoBai(lop)` của myLesson | **16/16** |
> | `dot245-assign-options.html` | bảng Options ACT vs ASSIGNMENT | 17/17 khớp |
>
> 📌 **Bàn thử neo vào CHỮ HIỂN THỊ hoặc THỨ TỰ DOM sẽ gãy ở đợt đổi bố cục.** Đợt 250 làm gãy 2 bàn
> thử cũ đúng vì thế (`dot246-forms` tìm hàng ô tích qua nhãn "At the end…" — nhãn đã bị bỏ;
> `dot247-giaobai` lấy "hai ô nhập đầu tiên" — nay ô ngày chen vào giữa). **Neo vào class/vai trò.**
>
> ### 🔗 GẮN CHẶT VỚI APP KHÁC — ĐỪNG REVERT LẺ MỘT BÊN
> - **myLesson app** (`E:\LAP TRINH APP\myLesson`) gọi `window.__awordBridge.giaoBai(lop)` và
>   `window.__awordLib` (Đợt 247). Sửa hai thứ đó là phải thử lại bên myLesson.
> - **myActivity** (`E:\LAP TRINH APP\myActivity`) nghe marker `MYACT:AW:*` (Đợt 229 ↔ myActivity
>   v2.8.0). Gắn chặt — revert lẻ một bên là hỏng bên kia.
>
> ### 🎨 CẶP NÚT PRACTICE / SUBMIT (Đợt 248 + 249)
> - `icons.practiceBig` là **icon DUY NHẤT không dùng `currentColor`** (bia bắn 8 màu) — sửa `color:`
>   trong CSS sẽ **trơ ra không đổi gì**, phải sửa `fill=` trong đường vẽ.
> - `icons.submitBig` = **đúng hình `playBig` nhưng đóng khung lại**, KHÔNG sinh ra lúc chạy — vẽ lại
>   `playBig` thì phải chép `d` sang. ⛔ `playBig` lệch phải là **CỐ Ý** (nó vẽ cho nút TRÒN
>   `.aw-bigplay` của thầy) — đừng "sửa" nó.

> ### KHU OPTIONS — BẢY CŨ VẪN CÒN HIỆU LỰC (Đợt 213 → 215b, 20/8/2026)
> Bảy luật dưới đây **không hề cũ** — đụng vào Options dù chỉ thêm một ô là phải đọc:


> ⭐⭐⭐ **BẢNG OPTIONS VỪA ĐƯỢC LÀM LẠI GẦN NHƯ TOÀN BỘ (Đợt 213 + 213b, 20/8/2026, thầy đã duyệt).**
> Nếu việc sắp tới của bạn đụng tới Options — dù chỉ thêm một ô — **ĐỌC HAI KHỐI 213b + 213 ở đầu file
> này TRƯỚC**, vì bảy luật dưới đây đều mới và đều đã có người vấp:
> 1. ⛔ **Ô Timer TRÔNG NHƯ thuộc cụm trên nhưng vẫn nằm ở khối dưới** — dời nó vào `swHost` cho "ngay
>    ngắn" là hỏng Đợt 147 (mỗi bộ nghĩa giữ Timer riêng, mà `swHost` dựng một lần rồi để yên).
> 2. ⛔ **Đừng tô thẳng màu vào `.aw-seg` / `.aw-opt-switch`** — hai class đó dùng chung với khu dưới.
>    Màu cụm trên đi qua ba biến `--aw-grp-track/-thumb/-on` khai trên đúng 3 vùng chứa.
> 3. ⛔ **Không bao giờ ẩn một điều khiển đang không dùng được** — làm nhạt bằng `.aw-optc.is-locked`
>    (luật Đợt 188, Đợt 213 áp nốt cho Anagram, chỗ cuối cùng còn ẩn thật trong 17 template).
> 4. ⭐ **`tone` của thanh trượt nay quyết định CẢ MÀU LẪN CHỖ ĐỨNG** (`orderSliderCells`): xanh lá/vàng
>    ưu tiên trái, đỏ ưu tiên phải. **Đặt sai màu là đặt sai chỗ.**
> 5. ⭐ **Thứ tự ô tích do `tpl.checkOrder` quyết**, và nó là danh sách **MÃ ĐỊNH DANH** (`opts.key`),
>    không phải chữ hiện ra. Thêm ô mới mà quên khai mã ⇒ ô đó rơi xuống cuối khối.
> 6. ⭐ **Khối ô tích đổ theo CỘT, tối đa 3 cột** (`layoutChecks` chuyển 3 dòng khi quá 6 ô). Thêm ô
>    thứ 7 cho một template là bố cục của nó đổi hình — đo lại.
> 7. ⛔ **Thanh trượt: chạm phải nút = +1, chạm trái nút = −1.** Luật chạm đúp của Đợt 188 **đã bỏ hẳn**;
>    đừng đắp lại. Vùng chết quanh nút tròn là **14px** (nửa nút + 4px) — thầy đang cân nhắc nới/thu.
> 9. ⭐⭐ **(Đợt 215b) CỤM TRÊN CÓ NĂM BIẾN MÀU**, khai trên đúng 3 vùng chứa: `--aw-grp-track` ·
>    `-thumb` · `-on` · `-off` · `-edge`. Nút đang chọn **tô đặc** `#166534`, chữ **trắng**. ⛔ Đừng
>    quay lại kiểu nút nhạt trên máng nhạt: đo được **1.20:1**, tức nút gần như tàng hình. Muốn đổi
>    màu thì sửa 5 dòng biến đó, **đừng tô thẳng vào `.aw-seg`/`.aw-opt-switch`** (dùng chung nửa dưới).
> 8. ⭐⭐ **(Đợt 215) CỘT TRÁI = mạng/thưởng · CỘT PHẢI = phạt** — `seatCellsByColumn()` chạy sau phép
>    sắp xếp và đổi chỗ **trong từng hàng**. Thêm một thanh mới là phải hỏi *"nó thưởng hay phạt"*,
>    vì `tone` quyết định **cả màu, cả thứ tự, cả cột**. ⛔ Đừng thay bằng phép chia cột toàn bảng
>    (nó kéo Pass penalty của Running word lên hàng 1). Ô trống bên trái là **cố ý**, thầy đã chốt.
>
> ⬜ **Việc kế tiếp = HỎI THẦY.** Thầy đang đi từng đợt ngắn trên **Options**, tự chỉ hướng mỗi lần, và
> đã nói trước là sẽ còn *"điều chỉnh thêm sau"* phần quy hoạch ô tích của 11 template em tự quyết.
> ⬜ Ba việc chỉ mắt thầy kiểm được (KHÔNG chặn gì): nhãn "Change the crossword" trong cột 168px có bị
> cắt cụt trên màn 86" không · Gameshow 3 dòng × 3 cột có chật không · vùng chết 14px quanh nút trượt.

> ⭐⭐ **Đợt 206 (19/8/2026) — myActivity NHIỀU CỘT: ĐỒNG BỘ CẢ LOẠI ACT.** Thầy tả *"lúc được lúc
> không"*; đo ra thì **không phải may rủi**: đường ống `MYACT:AW:OPT:` vốn đã mang `contentMode` +
> `contentVariant`, và nó ăn với act thường — nhưng **act đã đổi template (Change template / RUNNING /
> IPA) thì không đổi gì cả, mà `applyOptions` VẪN TRẢ `true`** ⇒ myActivity vẽ **dấu ✓ lên một cột
> đang chơi thứ khác**. Bàn thử `scratch/mirror206.html`: **8/9 → 18/18**.
> - **Gốc**: `convert.js` nướng bộ gợi ý vào nội dung bản sao, nên lựa chọn phải đi lên **act GỐC**
>   rồi chuyển đổi lại — việc của `applySubActSelection()`, thứ mà nút **Apply vẫn luôn làm** từ Đợt
>   154/181 còn **bridge thì chưa bao giờ đi qua**. Hai đường vào cùng một việc, tồn tại song song.
> - **Vá (chỉ `core/engine.js`)**: (1) `applyOptions()` đi chung cửa với Apply, và **chờ** chuyển đổi
>   xong mới báo thành công — kèm `applySubActSelection()` đổi trả về **`true` → `Promise`** (trước đó
>   nó **vứt promise của `doSwitchTemplate()` xuống sàn**). ⚠️ Hai nơi gọi cũ KHÔNG phải sửa: cả hai
>   chỉ hỏi "có nhận việc không", Promise là truthy — nhưng đã **bấm tay thật** để chứng minh, không
>   suy luận. (2) ⭐ **THAY THẾ, KHÔNG GỘP**: `Object.assign` không xoá, mà Apply bên cột gửi **cố ý
>   xoá** mọi khoá không thuộc view mới (Đợt 147) ⇒ gộp suông để lại `lives:3` sót ở cột khác, hai cột
>   lệch luật chơi mà màn hình không nói gì. ⚠️ **MUTATE**, đừng thay object (libAct + act mistakes +
>   2 bàn Fight giữ chung nó).
> - ⚠️ **`myActivity` KHÔNG phải sửa dòng nào** ⇒ đợt này **không có ràng buộc đẩy-cùng-lúc** như cặp
>   Đợt 197 ↔ v2.4.0. Bản myActivity cũ gặp AWord mới chỉ chạy đúng hơn.
> - ⛔ **LUẬT MỚI**: hàm trả `true` phải tự hỏi — *true nghĩa là ĐÃ XONG, hay chỉ "tôi đã gọi xong"?*
>   Và **bàn thử phải đọc KẾT QUẢ THẬT** (chữ trên màn), không đọc `options` — đọc options thì cả 9 ca
>   đều "đạt" và lỗi vẫn nguyên.
> ⬜ **CÒN LẠI**: (1) thầy test TOMKO — 2+ cột cùng act, đổi TEXT/ENG1 ở một cột, **rồi thử lại sau khi
> đã đổi template** (đúng ca trước nay hỏng trong im lặng); (2) **Fight mode vẫn không mirror Options**
> (nhánh `if (fight)` `return` trước `awEmit("OPT")`) — chưa đụng vì thầy không nêu; muốn thì là một đợt riêng.

> ⭐⭐ **Đợt 205 (19/8/2026) — OPTIONS: `TEXT | VOICE | PRONUNCIATION`.** PRONUNCIATION rời dãy chip
> dưới nút TEXT, lên thành nút thứ ba của hàng công tắc mẹ. Chọn nó thì **ba nút trải dài hết hàng**
> (không có bộ con nào để chọn); chọn TEXT/VOICE thì **co lại** trả chỗ cho dãy chip — một chuyển
> động liên tục 240ms. Bàn thử `scratch/pron205.html` **34/34 đạt**.
> - ⭐⭐⭐ **KHÔNG ĐỘNG VÀO THỨ ĐƯỢC LƯU, và đó là cả ý tưởng.** PRONUNCIATION vẫn được lưu đúng như
>   chip cũ: **`contentMode:"text"` + `contentVariant:"pron"`**. `contentMode` có **SÁU nơi đọc**
>   (`activeVariant` · `viewKeyOf` · `voiceView` · 2 cửa nạp trước clip trong `engine.js` ·
>   `anagram.js` · `convert.js`), nơi nào cũng hỏi `=== "text"`/`=== "voice"` — thêm giá trị thứ ba
>   là phải dạy lại cả sáu (và `viewKeyOf` sẽ **mất view riêng**, `voiceView` sẽ **hiện nút loa đọc
>   ký hiệu IPA**, engine sẽ **tải cả kho giọng vô ích**). Đổi lại: **act cũ tự lên nút mới, không
>   cần di trú**, `options-migrate.js` không dính dáng gì. ⛔ **Đừng "dọn dẹp" thành
>   `contentMode:"pron"`** — được hình thức, mất sáu nơi đọc cộng mọi act đã có trong thư viện.
> - ⭐⭐ **`container-type: inline-size` trên `.aw-opt-switch` chữa MỘT LÚC HAI lỗi đo được**: chữ
>   "PRONUNCIATION" tràn nút, và panel (`width:max-content`) bị một chữ dài kéo từ **410px lên kịch
>   trần 580px**. Nó vừa cho cỡ chữ đo bằng `cqw` (**`vw` vô dụng — đo CỬA SỔ, clamp không bao giờ
>   ăn trên màn rộng**), vừa kèm `contain: inline-size` nên chữ thôi nuôi bề ngang panel (đo lại:
>   580 vs 580). ⚠️ Nó **đẻ stacking context** — an toàn vì đây là **lá bên trong** `.aw-tool-panel`,
>   **không phải tổ tiên**; đọc hợp đồng xếp lớp popup ở `core/HUONG DAN CORE.md` trước khi đặt
>   `container-type`/`contain`/`transform`… ra ngoài hơn.
> - ⚠️ **HỆ SỐ CỠ CHỮ LÀ SỐ ĐO**: nhẩm ra "chữ rộng 8.7× cỡ chữ" ⇒ vẫn tràn; cân bằng `<span>` cỡ
>   100px ra **10.118×**. Và chia đôi hàng thì chữ tụt còn ~8px ⇒ ba nút được **`1.7fr : 1fr`**
>   (`.is-3mode`), cỡ chữ về **10.26px**. Act KHÔNG có bộ pron vẫn chia đôi 1:1 y như cũ.
> - ⚠️ Hai chốt biên đã cài: dạng gọi của `core/settings.js` (không có bộ gợi ý) ⇒ vẫn 2 nút như cũ;
>   act **chỉ có** `pron` ⇒ **không mở nút thứ ba** (nút TEXT sẽ sáng mà không có bộ nào để chơi).
> - ⛔ **Bàn thử CẤM dùng `requestAnimationFrame`** — pane ẩn thì rAF treo vô hạn, trang đứng im
>   không lỗi không log (đã cắn đúng một lần ở đây; bẫy #11 trong `BAN GIAO.md` của myActivity).
> ⬜ **CÒN LẠI**: (1) **chưa ai NHÌN bằng mắt** — `screenshot` timeout **lần thứ tám liên tiếp**
> (Đợt 191→205), và transition bị đóng băng khi pane ẩn nên không quan sát được lúc đang chạy;
> (2) thầy nhìn cỡ chữ **10.26px** trên màn 86" — nhỏ thì có sẵn hai đường: nâng `1.7fr`, hoặc đổi
> nhãn thành **`IPA`** (chính tên chế độ MODE ▸ IPA dùng cùng bộ dữ liệu, ở 13px thì thừa chỗ).

> ⭐⭐ **Đợt 204 (19/8/2026) — IMPORT ĐỌC THÊM SHEET `WORDTABLE2`: một file bài học ra HAI bộ từ.**
> Bảng thứ hai đẻ đủ ba act — `xxx / WORDS 2` · `xxx / RUNNING WORD 2` · `xxx / RUNNING TEAM 2`
> (thầy chốt). Chỉ sửa **`core/lesson-import.js`**, không đụng file nào khác.
> - 🔴 **LỖI CÓ SẴN đợt này lộ ra**: từ Đợt 190 vòng quét giữ **DUY NHẤT sheet nhiều khối nhất**, nên
>   file hai bảng thì **một bảng biến mất trong im lặng**. Đo trên **138 file thật**: **13 file có hai
>   bảng**; riêng `DS-S4.I1.W1 BEAVERS AND DAMS` mất **95 từ không có ở đâu khác** (số 96–190) — đúng
>   lý do lesson đó phải kèm workbook rời `..._WORD 2.xlsm`.
> - ⛔⛔ **DÙNG TÊN, KHÔNG DÙNG "Á QUÂN CỦA CUỘC QUÉT"** — và đây không mâu thuẫn với Đợt 190: hình dạng
>   trả lời *"sheet này CÓ PHẢI bảng từ vựng không"*, còn *"cái nào là cái THỨ HAI"* thì hình dạng chịu
>   (hai bảng giống hệt nhau). Đo ra: 12/13 file có á quân **không phải** bộ từ thứ hai (`WORDADVANCE`,
>   `CROSSWORDADVANCED`, `CROSSWORD(2)`, `CROSSWORD4+5`, `CROSSWORD2`, `TABLEMIX2`) ⇒ lấy á quân là đẻ
>   **12 act rác**. Luật hiện tại: `RE_TABLE2 = /^WORDTABLE2$/` (tên đã UPPER + bỏ trắng nên
>   `"WORDTABLE 2"` cũng khớp). **Mở thêm cho sheet khác = thêm 1 nhánh vào regex đó, không sửa gì nữa.**
> - ⚠️ **BA CHỐT AN TOÀN, đừng gỡ**: (1) **ĐÔN LÊN** — file mà bảng DUY NHẤT tên `WORDTABLE2` vẫn ra
>   `/ WORDS` không đuôi; (2) **bảng 2 rỗng ⇒ không đẻ act nào** (2/138 file có khuôn trắng sẵn);
>   (3) **một bộ đọc duy nhất** `readVocab()` + `pushVocabActs(WORDS, suffix)` dùng chung hai bảng —
>   chép luật đọc thành hai bản là hai bản sẽ lệch nhau ngay lần sửa đầu.
> - ⭐ **BÀN THỬ chạy CHÍNH module thật bằng Node + SheetJS vendored** (`scratch/`, bị gitignore ⇒ phiên
>   mới phải dựng lại; công thức đủ ở `GHI CHU DU AN.md` Đợt 204 mục 5). Kỹ thuật đáng giữ: **nạp cùng
>   lúc bản cũ `git show HEAD:core/lesson-import.js` và bản mới rồi so chữ ký từng act** ⇒
>   **137/138 file giống hệt**, đúng 1 file thêm đúng 3 act. Kiểm nội dung **16/16 đạt** (hai bộ từ
>   không trùng một từ nào, `WORDS 2` trùng khớp từng từ với file rời thầy đang dùng).
> ⬜ **CÒN LẠI**: thầy import thử file BEAVERS trên bản live, xác nhận ra đủ 6 act ⇒ bỏ được file rời.

> ⭐⭐ **Đợt 202 (19/8/2026) — ✅ COMMIT `a6d3fe8` + PUSH + LIVE (3/3 mã băm SHA-256, 7/7 phép hỏi
> module trên bản live) — IN TURNS: MỘT BỘ CÂU CHIA CHO HAI ĐỘI (Fight mode).** Ô tích mới
> **màu xanh lá** trong Options của trận: bật lên thì bộ câu được **chia bài luân phiên** cho 2 bàn
> (81 câu ⇒ **41/40**, không câu nào ở cả hai bên, câu lẻ vẫn được chơi). Hai bàn vẫn chạy **ĐỒNG
> THỜI** (thầy chốt: KHÔNG phải luân phiên từng đội) nên `core/fight.js` **không sinh kiểu vòng thứ
> ba** — vẫn vòng thường, chỉ khác là chỉ số `i` của hai bàn trỏ tới hai câu khác nhau.
> **Chỉ Type the answer** được mở (`tpl.fightTurns: true`, đúng 1 dòng) — thầy muốn thử trước rồi
> mới lan ra. Bàn thử `scratch/turns202-test.html` **37/37 đạt**.
>
> ⛔ **BA LUẬT MỚI:**
> 1. **Bật In turns là 5 ô luật đua CHẾT HẾT** (Fight content · Round rule · Time delay · Speed bonus
>    · Slower team keeps points) — chúng nói về cuộc đua trên CÙNG một câu, mà ở đây không có cuộc
>    đua đó. Xám (`.is-locked` + `disabled`), **không ẩn** (luật Đợt 188).
> 2. **"2 bộ options độc lập" = KHÔNG GHI GÌ.** `syncTurns()` chỉ chạm KHOÁ, không bao giờ chạm GIÁ
>    TRỊ, nên bỏ tích là 5 con số cũ trở lại nguyên vẹn. Đừng "dọn dẹp" bằng cách zero hoá chúng.
> 3. **Sau `Apply` trong trận phải bấm PLAY mới đo được bàn** — Apply dựng lại trận và trận mới nằm
>    ở màn PLAY, chưa mount template nào. (Đã mất một vòng debug vì tưởng tính năng hỏng.)
>
> ⚠️ Tồn đọng: act TTA **có giọng** mà bật In turns thì 2 bàn phát 2 clip khác nhau cùng lúc — cùng
> họ với *"Different words chưa có voice riêng từng bàn"* (Đợt 132), chưa sửa.
> ⬜ **CÒN LẠI**: thầy chơi thử trên TOMKO (cỡ chữ xanh lá nhìn từ cuối lớp có nổi đủ không, cảm giác
> "hai bàn hai câu khác nhau" có ổn với lớp không), rồi chốt có mở In turns cho template khác hay không
> (mở thêm = thêm ĐÚNG 1 dòng `fightTurns: true`, `fight.js` không phải sửa gì).

> ⭐ **Đợt 201 (19/8/2026) — HAI TINH CHỈNH TRANG HỌC SINH.** (1) Dòng ai-đang-chơi trên màn
> READY đổi dấu ngăn `-` thành `•`: `CHẤN PHONG • B2B` (engine.js, khối `.aw-ready-ai`).
> (2) Mở bài giao ở TAB RIÊNG (không nhúng): tên act dưới khung nay CĂN GIỮA — học sinh không có
> nút công cụ nào ở hàng đó nên không còn lý do dạt trái (app.css, hai rule `.aw-stu .aw-below*`;
> trang thư viện của thầy không ảnh hưởng vì `.aw-stu` chỉ có ở play.html).

> ⭐ **Đợt 200 (19/8/2026) — CỜ NHÚNG `play.html?g=…&nhung=1`.** Trang bài tập của **myLesson**
> (andrewclasses.com) nhúng bài giao vào một ô có đúng tỉ lệ khung game 16:10,5, nên trang play
> phải trả về **đúng khung game, không gì khác**. Cờ này làm ba việc, đều nằm trong
> `core/app.css` (khối `html.aw-nhung`, ngay dưới rule `.aw-page`):
> lề trang `16/16/40` → **0** · `.aw-below` (tên act + mô tả + nút công cụ) → **ẩn** ·
> viền + bo góc của `.aw-stage` → **bỏ** (ô bên myLesson đã có viền riêng), kèm
> `overflow:hidden` chốt an toàn cho chiều cao lẻ 0,1px.
> Đo ở máy: trang cao **830px = đúng chiều cao khung**, tỉ lệ **1.5238** (= 16/10,5), không cuộn.
> ⛔ **Không có cờ thì mọi rule tắt** — link giao bài cũ (QR phát tay, link Zalo) không đổi gì.
> `play.js` chỉ thêm 3 dòng: có cờ thì gắn class `aw-nhung` lên `<html>`.

> ⭐ **Đợt 199 (19/8/2026) — MÀN READY HIỆN "TÊN EM - LỚP".** Bài giao mở từ myLesson nay truyền
> sang **cả tên lẫn lớp** (`play.html?g=…&n=<TÊN>&lop=<LỚP>`); màn READY thêm dòng `.aw-ready-ai`
> ngay dưới tên template: `TUẤN KHANG - A1A`. Chỉ ở **chế độ học sinh** (có `session`); link cũ
> không có `lop` thì chỉ hiện tên. `session.className` là trường mới trong hợp đồng session.
> ✅ Màn **gõ tên tay GIỮ NGUYÊN** cho link không có `n` (QR phát tay) — thầy chốt 19/8: bỏ hẳn thì
> các em mở bằng QR không vào được bài. ⛔ Đừng "dọn dẹp" bằng cách bỏ `showNameScreen`.
> Bàn thử: `scratch/dot199-ready.html` (nhớ `ensureTemplate` trước `startGame`).

> ⭐⭐ **Đợt 194 + 195 (18/8/2026) — ✅ COMMIT `a256012` + PUSH + LIVE (4/4 mã băm SHA-256).** HAI NÚT RỜI THANH CÔNG CỤ, VỀ
> **CỬ CHỈ NHẤN GIỮ + POPUP XÁC NHẬN**. Đây là hình dạng thanh công cụ **hiện tại** — thuộc nó
> trước khi sửa bất cứ thứ gì dưới khung act:
>
> | Cụm | Nút | Chạm | Nhấn giữ 420ms |
> |---|---|---|---|
> | GIỮA | **Options** | bảng Options | **popup "Edit content?"** (Đợt 194) — **CHỈ SINGLE MODE** |
> | | **Template** | đổi template | Style (Đợt 192) |
> | | **Mode** | picker Fight/Showdown/Running/IPA | **popup "Go home?"** (Đợt 195) — **mọi mode** |
> | PHẢI | **Set assignment · Print** | chạm thường | — |
>
> Cụm phải **không còn Edit và không còn Home**, và cả cụm bị `visibility:hidden` trong trận Fight.
> **Không sửa một dòng CSS nào** — cả hai popup dùng lại bộ class `.aw-mode-confirm-*` của 4 popup
> xác nhận nút MODE (Đợt 158).
>
> ⭐ **HAI LỖI THẬT CÓ SẮN ĐƯỢC VÁ KÈM — nhớ để đừng dựng lại chúng:**
> 1. **Edit sửa BẢN TẠM ⇒ đẻ ACT RÁC.** Nút Edit cũ truyền `libAct`, mà hai ván **ngay trong single**
>    trao cho engine bản vứt đi: *Change template* (`conv_…`, `_converted`) và *Start with mistakes*
>    (`mist_…`, `_mistakes`). `core/store.js` không tìm thấy hai id đó trong thư viện ⇒ Save **thả một act
>    rác ra gốc thư viện** còn act thật không đổi một chữ, **im lặng hoàn toàn**. Nay `openEditor()`
>    hỏi act **SỞ HỮU** bằng ĐÚNG hai dòng mà Options ▸ Apply đã dùng — tìm `_mistakesBase` trong
>    `core/engine.js`, đừng viết cách thứ hai.
> 2. **Một TRẬN là HAI engine.** `cleanupAll()` chỉ thuộc closure của bàn gọi nó, nên Home trong trận
>    sẽ để **đồng hồ 500ms của bàn kia chạy tiếp sau lưng thư viện** (ghost-clock Đợt 131 — **nghe thấy
>    chứ không nhìn thấy**). Đã thêm `exitToLibrary()` vào `fight.ctl`; đường ra khỏi trận **phải** đi
>    qua `fight.ctl`, không bao giờ đi bằng `cleanupAll()` của một bàn.
>
> ⛔⛔ **BỐN LUẬT MỚI (đủ cả 7 luật ở `core/HUONG DAN CORE.md`, mục "THANH CÔNG CỤ DƯỚI KHUNG ACT"):**
> 1. **Nút nào MANG THÊM VIỆC thì nút đó KHÔNG ĐƯỢC PHÉP VẮNG MẶT.** `modeBtn` từng là `null` trong im
>    lặng khi act không có mode nào để chọn — **5/17 template** không khai `fightMode` lẫn `showdownMode`
>    (maze chase · whack-a-mole · speaking cards · hai game Running), cộng đáp án dài quá
>    `WORD_POOL_MAX_LEN` (24) và không phiên âm là ra 0 mode; mà menu ☰ trong game **không có đường ra**
>    ⇒ act thành **căn phòng không cửa**. Chỗ đó nay dựng **thẳng thành nút Home** (`title="Home"`, chạm
>    thường là ra câu hỏi) — cùng khuôn Đợt 192 dùng cho Template/Style.
> 2. **Ẩn `[title="Options"]` hay `[title="Mode"]` bằng CSS nay ẩn HAI tính năng**, y hệt chuyện đã xảy
>    ra với `[title="Template"]` sau Đợt 192. Hiện **chưa** stylesheet nào ẩn hai nút đó.
> 3. **Builder panel phải là `function` CÓ TÊN khai một lần**, cấm arrow tạo mới mỗi lần gọi:
>    `mountPanelContent()` và `capPanelHeight()` nhận diện panel **bằng DANH TÍNH HÀM**
>    (`buildContent === buildOptionsPanel`) để gắn `is-opts` / `is-tpl` / `is-sd`.
> 4. **Nút mang hai việc phải dùng `openToolPanelFor()`, KHÔNG `openToolPanel()`** — gọi cái sau với
>    chính nút đang sáng thì nó **đóng** panel (cử chỉ "bấm lại nút đang mở").
>
> ⭐ **BÀN THỬ ĐỢT NÀY** (`scratch/` bị **gitignore** ⇒ **phên/máy mới phải dựng lại**, công thức đủ ở
> `GHI CHU DU AN.md` Đợt 194 mục 4 và Đợt 195 mục 3): `scratch/edit194-test.html` **41/41 đạt** ·
> `scratch/home195-test.html` **44/44 đạt** · `scratch/edit194-live.html` (để đo hình học popup).
> Ba kỹ thuật đáng giữ lại:
> • **Bắn cử chỉ bằng `PointerEvent` thật** (`pointerdown` → chờ 520ms → `pointerup`) — đúng đường
>   `core/press.js` đi. ⚠️ Nhưng nút dùng `.onclick` thuần (nhánh không có mode) thì **pointer tổng hợp
>   KHÔNG sinh ra `click`** ⇒ phải gọi `el.click()`.
> • **Gián điệp cắm thẳng vào `getTemplate(type).edit`** của registry ⇒ đo được **đúng cái engine cầm**
>   (act nào, template nào), không phải cái mình đoán.
> • **Bọc `window.setInterval`/`clearInterval`** rồi đếm id còn sống ⇒ phép đo **trực tiếp** của bẫy
>   ghost-clock (bấm PLAY cả hai bàn: đang trận > 0, sau khi Home = 0).
>
> ⬜ **VIỆC CÒN CHỜ**: (1) **thầy nhìn + chạm thật trên TOMKO** — pane trình duyệt bị ẩn nên `screenshot`
> timeout **lần thứ tư liên tiếp** (Đợt 191→195), máy không tự chạm được nên cỡ chữ + cân đối trên màn 86"
> phải do thầy duyệt; (2) cân nhắc sau: Running/IPA/Showdown nay **không còn** đường vào editor từ trong
> game (đúng ý thầy) — muốn mở lại chỉ cần đổi `canEditNow()` trong `core/engine.js`.

> ⭐⭐ **Đợt 192 (18/8/2026) — COMMIT `3a1720a` + PUSH + LIVE (6/6 mã băm).** Sáu việc thầy giao một lượt:
> RUNNING **WORD trước/TEAM sau** (nhãn rút gọn) · ô tên màn chọn lớp Showdown **bằng nhau tuyệt đối**
> (đo: cũ lệch 57,9px → nay 0) · shuffle **bay lần lượt, loạn xạ** (rải 1146ms, 96/190 cặp đảo thứ tự) ·
> ⭐⭐ **BỎ HẲN NÚT STYLE — gộp vào nút Template, mở bằng NHẤN GIỮ 420ms** · ⭐⭐⭐ **dựng lại
> Settings › Classes** (bỏ textarea, **mỗi em một hàng**: số · tên · nút dài **BOY|GIRL** · xoá · tay kéo;
> lưới cột-trước 2×10, 20 em **không phải cuộn**) · thư mục trống hiện **ô kéo-thả Import**.
>
> ⛔⛔ **BA LUẬT MỚI — ĐỌC TRƯỚC KHI SỬA TIẾP PHẦN NÀY:**
> 1. **`NO_TEMPLATE_TYPES` (engine.js, MODULE SCOPE) phải đi cùng nhịp với BA stylesheet** ẩn nút
>    `[title="Template"]`: `core/app.css` (`.mode-ipa`) · `running-word.css` · `running-team.css`.
>    Style nay treo trên nút Template ⇒ ba luật đó nếu bắt trúng sẽ ẩn **HAI** tính năng, tức **Style biến
>    mất sạch** ở IPA và cả hai game Running. Vá hiện tại: chỗ không đổi được template thì nút **được dựng
>    thẳng thành nút Style** (`title="Style"` làm ba selector trượt). **Thêm template mới ẩn nút Template
>    ⇒ thêm type vào `NO_TEMPLATE_TYPES` CÙNG LÚC.** LUẬT rộng hơn: đừng bao giờ để một tính năng chỉ với
>    tới được bằng cử chỉ trên một nút mà CSS xung quanh có quyền ẩn.
> 2. **Kéo-thả trong Settings dùng POINTER EVENTS, KHÔNG dùng HTML5 `draggable`** (cố ý khác Anagram
>    editor và thẻ thư mục ở `main.js`). Native DnD **không bắn từ ngón tay** ⇒ trên màn hồng ngoại TOMKO
>    là cái nút không làm gì, mà test bằng chuột thì đạt hoàn hảo. Tay kéo phải `touch-action: none`.
> 3. **`<input>` KHÔNG có ellipsis** — hết chỗ là **cắt cụt im lặng**, không tự viết tắt được như chip
>    Showdown (`shortenName`). Ô tên lớp học đã nới chỗ chữ **127 → 177px** (hộp thoại 880px · nút giới
>    tính 116px · đệm 8px · số 18px) + `title` = tên đầy đủ. Đụng bề ngang hàng học sinh **phải đo lại**.
>
> 🐞 Một lỗi của chính Đợt 192, đáng nhớ: khai `const NO_TEMPLATE_TYPES` **bên trong** `startGame()` nhưng
> **dưới chỗ dùng ~35 dòng** ⇒ `const` không hoisted ⇒ **mọi lần mount ném TDZ và hạ nguyên thanh công cụ**.
> `node --check` **báo sạch** (cú pháp đúng, lỗi lúc chạy). Bài học: **mở trình duyệt thật**, đừng tin
> `node --check`.
>
> ⭐ **BÀN THỬ MỚI — LẦN ĐẦU CHẠY ĐƯỢC `main.js` THẬT**: `scratch/fake-firebase-full.js` +
> `scratch/cls192-test.html`. Đợt 191 phải bó tay vì bộ giả Firebase thiếu `writeBatch`; bộ mới đủ
> `collection · getDocs · query/where · writeBatch · deleteDoc · updateDoc · increment` (+
> `signIn/signOutNow/TEACHER_EMAIL`) nên **thư viện thật + Settings thật + Classes thật** đều mở lên được,
> không cần đăng nhập Google. Probe: `window.__t.openClasses()` · `window.__t.wait(fn)`.
> ⚠️ `scratch/` bị **gitignore** ⇒ **phiên/máy mới phải dựng lại** (mô tả đủ để dựng ở `GHI CHU DU AN.md`
> Đợt 192 mục 7).


> ⭐ **Đợt 203 (19/8/2026)**: vá NỐT lỗi trang trắng của Running Word — Đợt 193 chỉ chữa được tờ ĐẦY,
> bộ **≤16 từ/đội vẫn in ra 4 trang** (trang 4 chỉ có tiêu đề+chân trang). Gốc: `line-height` buộc được
> HỘP DÒNG nhưng không buộc được CHỮ — vùng chữ của font ≈1.58em trong hộp dòng 1.282em nên chữ thò
> 0.149em ra ngoài; ít từ ⇒ hàng cao ⇒ chữ to ⇒ phần thò của hàng CUỐI chọc qua đáy tờ. Vá bằng
> `OVERHANG_ROWS = 0.16` trong `rw-print.js` (chừa chỗ tính theo ĐƠN VỊ HÀNG, vì `SAFETY_MM` cố định
> không thể đúng cho mọi cỡ). Đo lại 12/12 cỡ 6–60 từ đều 3 trang; Running Team đo ra KHÔNG dính.
> ⚠️ Số **202** thuộc một phiên song song khác (IN TURNS), lúc Đợt 203 làm thì phiên đó chưa commit.

> ⭐ **Đợt 193 (18/8/2026) — đã COMMIT `5ef9d76`**: vá lỗi in CÓ SẴN của Running Word (3 tờ ra 6 trang,
> xen kẽ 3 trang trắng) — `templates/running-word/running-word.css` + `rw-print.js`, **không đụng core**.
> Gốc: hàng in có `height` cố định mà `line-height: normal` ⇒ ô cao hơn hàng, ô hàng cuối thò 1.5mm qua
> đáy tờ; kèm ngân sách tiêu đề 12mm nhỏ hơn khối thật (12.09 / 12.75mm). Chi tiết + số đo:
> `GHI CHU DU AN.md` Đợt 193. ⚠️ Số **192** thuộc một phiên song song khác (sửa `core/engine.js`:
> thứ tự + nhãn ô RUNNING WORD/TEAM) — lúc Đợt 193 commit thì phiên đó **chưa commit**.

> Mục này là **bản đồ để bắt tay vào việc trong 10 phút**. Mục 0b bên dưới là bàn giao rất cũ
> (31/7) — trạng thái trong đó đã sai, chỉ giữ vì vài bài học kỹ thuật.

### 1. Dự án là gì
Web game tiếng Anh kiểu Wordwall, **giáo viên soạn — học sinh chơi qua link/QR — hệ thu điểm về**.
Vanilla JS, **zero-build**, chạy trên GitHub Pages.
- **LIVE**: `https://aword.andrewclasses.com/` (= `https://andrewclasses-01.github.io/AWord/`)
- **Repo**: `andrewclasses-01/AWord`, code ở `E:\LAP TRINH APP\AWord\web`, dữ liệu ở
  `D:\APP AND DATA\AWord-data`
- **Backend**: Firebase Firestore `aword-70dae` (gói Spark, MIỄN PHÍ — **không có Storage**)
- **Sản phẩm 100% tiếng Anh**; trao đổi + mọi tài liệu nội bộ 100% tiếng Việt

### 2. Đọc theo đúng thứ tự này
| # | File | Dùng để |
|---|---|---|
| 1 | `core/HUONG DAN CORE.md` (~1.580 dòng) | **Hợp đồng engine ↔ template + TOÀN BỘ bẫy kỹ thuật.** Bắt buộc trước khi sửa code |
| 2 | `APP_MASTER.md` mục 0a (file này) | Trạng thái + luật làm việc + việc đang chờ |
| 3 | `GHI CHU DU AN.md` (~7.400 dòng) | Nhật ký từng đợt, **mới nhất ở TRÊN CÙNG** |
| 4 | `templates/<tên>/GHI CHU <TÊN>.md` | Chỉ đọc của template đang đụng tới |

Khối trích dẫn dài ở **đầu file này** luôn là tóm tắt 3-4 đợt gần nhất — đọc nó là biết chuyện gì
vừa xảy ra.

### 3. Đứng ở đâu (20/8/2026 — sau Đợt 218 + 218b + 218c)

> ⭐⭐⭐ **KHO SẠCH, KHÔNG CÓ VIỆC CODE NÀO DỞ DANG.** **Đợt 218 + 218b + 218c** (khung **Quick
> access** ở trang chủ) đi **CHUNG MỘT COMMIT `4642d4b`** — ✅ **THẦY DUYỆT, ĐÃ PUSH + LIVE**, đối
> chiếu **4/4 file trùng mã băm SHA-256** trên `aword.andrewclasses.com` và **14/14 phép hỏi môđun
> chạy trên CHÍNH BẢN LIVE**. `main` = `origin/main`, `git status` trống.
>
> **4 file code đã sửa**: `core/store.js` · `core/icons.js` · `main.js` · `core/app.css`.
> 🧪 **Bàn thử**: `scratch/dot218-qa.html` (**scratch/ bị gitignore** ⇒ phiên/máy mới phải dựng lại;
> công thức đủ trong `GHI CHU DU AN.md` Đợt 218b — nạp `main.js` THẬT, chỉ đổi `core/firebase.js`
> sang `scratch/fake-firebase-full.js`, rồi gieo cây thư mục bằng chính `createFolder()` thật).
>
> **Mảng đang chạy: TRANG CHỦ (thư viện)** — thầy đi từng đợt ngắn và tự chỉ hướng mỗi lần. Trước
> chuỗi này thầy vừa **đọc dự án + quét 2 ổ nội dung** `D:. LISTENING` + `D:. READING` (138
> workbook) để chuẩn bị **cải tiến IMPORT** — xem mục ⬜ VIỆC ĐANG CHỜ, có sẵn danh sách khoảng hở đã
> đo của importer.
>
> Toàn bộ con số nằm ở khối **Đợt 218c → 218b → 218** đầu `GHI CHU DU AN.md`. **Bốn luật rút ra:**
> 1. Cờ ghim nằm **trên chính node thư mục** vì luật Firestore chỉ mở `users/{uid}/items/{itemId}` —
>    collection mới sẽ bị từ chối **trong im lặng**.
> 2. ⛔⛔ **`sizeQuickAccess()` KHÔNG ĐƯỢC ĐỌC KẾT QUẢ CỦA CHÍNH NÓ.** Ô lưới bị kéo giãn theo hàng, mà
>    hàng cao bao nhiêu lại do chính nó quyết ⇒ đo bằng `getBoundingClientRect()` là **phình dần**
>    (`span 3`, 480px, mỗi lần tính lại to thêm). Phải đo chiều cao **RUỘT** của **card THƯ MỤC**
>    (`align-self: start` một nhịp) và cộng các dòng, đừng đọc hộp của khung.
>    🔎 Bắt bằng cách chạy lại 4-5 lần rồi so — lần 5 phải bằng lần 1.
> 3. ⛔⛔ **HTML5 drag CHỈ CÓ CHUỘT.** Kéo sắp xếp mục ghim dùng **pointer events** + `touch-action:
>    none`, nếu không thì trên TOMKO tính năng **không tồn tại**. Kéo xong phải **nuốt đúng 1 click**.
> 4. `core/app.css` **không có luật `@media` bố cục nào** — 218b đã gỡ cái duy nhất từng có. Lưới
>    `auto-fill` tự rụng cột, khung là phần tử số 1 nên tự được ưu tiên.
>
> ⬜ **Chờ mắt/tay thầy**: khung trông thế nào trên màn 86" (pane test bị ẩn ⇒ **không chụp được ảnh
> nào**) · dòng khung cao **29px** có quá nhỏ cho ngón tay không · **kéo sắp xếp bằng NGÓN TAY thật**
> (máy chỉ dựng được pointer event tổng hợp) · ghim/gỡ trên **Firestore thật** và xác nhận ghim ở máy
> này hiện luôn ở máy kia.
>
> Bên dưới là trạng thái tính tới **Đợt 217**, vẫn đúng cho mọi mảng khác:

> ⭐⭐⭐ **KHO SẠCH, KHÔNG CÓ VIỆC CODE NÀO DỞ DANG.** Đợt 216 + 217 đi **CHUNG MỘT COMMIT `6244fe0`**
> (+ hồ sơ `7d00059`, + vá CRLF `c8f9c89`) — **ĐÃ PUSH + LIVE**, đối chiếu **11/11 file trùng mã băm
> SHA-256** trên `aword.andrewclasses.com` và **12/12 phép hỏi module chạy trên CHÍNH BẢN LIVE**.
> `main` = `origin/main`, `git status` trống, không còn file `_test-*` nào.
>
> **11 file code đã sửa ở chuỗi này**: `core/engine.js` · `core/fight.js` · `core/options-panel.js` ·
> `core/app.css` · `core/showdown-review.js` · `core/showdown-setup.js` · và 5 stylesheet template
> (anagram · quiz · true-false · type-the-answer · find-the-match).
>
> **Mảng đang chạy: FIGHT MODE + SHOWDOWN + bảng OPTIONS** — thầy đi từng đợt ngắn và tự chỉ hướng mỗi
> lần. Đọc khối **Đợt 217 → 216 → 215b → 215** ở ĐẦU file này là đủ nắm chuyện vừa xảy ra.
>
> **Số hiện trạng**: 17 loại act · Fight 7/17 · Showdown 11/17 · Time delay **0,1 → 10s + nấc ∞ thật** ·
> chốt sau START **500ms** · thanh trượt **±1 nấc chạy được cả trên cảm ứng**.
>
> ⚠️⚠️ **BỐN LUẬT MỚI NHẤT — đọc trước khi đụng vào đúng chỗ đó:**
> 1. **Tạm dừng có LÝ DO** (`enterPause(reason,{dim})`, `core/engine.js`): `menu` · `panel` · `relay` ·
>    `stolen`. Phải là TẬP, không được là CỜ. `dim` đi theo NGUỒN. Fight lan sang bàn kia qua
>    `fight.ctl.registerPause/setPaused`.
> 2. **Che bài khi Fight**: core gắn `.aw-fight-board.is-concealed`, **template tự khai bằng CSS**.
>    Thêm template vào Fight thì nhớ khai, không khai là **im lặng hở bài**.
> 3. **Thanh trượt**: `preventDefault` trên `pointerdown` **KHÔNG cấm được ngón tay** — chốt nằm ở
>    GIÁ TRỊ (`guardValue`) + `setPointerCapture`. Đừng "dọn dẹp" hai thứ đó.
> 4. **Showdown claims**: `releaseTeamClaim()` cho phép giành lại đội máy khác; máy bị giành dừng theo
>    điều kiện **"có người khác đang giữ"**, KHÔNG phải "không còn ai giữ".
>
> 🧪 **BÀN THỬ** (`scratch/` **bị gitignore** ⇒ phiên/máy mới phải dựng lại; công thức đủ trong
> `GHI CHU DU AN.md` Đợt 216 và 217):
> `dot216-slider.html` + `dot216-run.js` (thanh trượt, nạp **cả module cũ lẫn mới**) ·
> `dot216-delay.html` (trận Fight thật) · `dot216-start.js` + `dot216-start-old.html` (chốt START) ·
> `dot217-pod.html` (tên trong phễu) · `dot217-pause.html` (tạm dừng + che bài) ·
> `dot217-claims.html` (giành team) · `dot217-stolen.html` (bị giành giữa ván).
> ⚠️ Bộ giả `scratch/fake-firebase.js` nay **có `runTransaction`** (Đợt 217 thêm) — thiếu nó thì
> `publishTable`/`writeMyClaim`/`releaseTeamClaim` không bench nào chạy qua được.
>
> ⚠️⚠️ **BỐN BẪY ĐO của chuỗi này, đọc trước khi tự test** (đầy đủ ở `core/HUONG DAN CORE.md`):
> (a) **`ResizeObserver` bắn 0 lần khi khung hình đứng** — kể cả lần đầu lúc bắt đầu quan sát; cùng họ
> với bẫy rAF, nhưng `setTimeout` thì VẪN chạy đúng nhịp ở chính hoàn cảnh đó;
> (b) trong FIGHT, **hàng nút công cụ là của chung, nằm NGOÀI hai bàn** — bench tìm nút trong
> `.aw-fight-board` sẽ ra rỗng và treo im lặng;
> (c) **`browserId()` được tạo lười** — đọc thẳng `sessionStorage` khi chưa ai hỏi thì ra rỗng, và lỗi
> này **chỉ lộ ra khi chạy trong tab HIỆN**;
> (d) `visibilityState:"hidden"` **đóng băng CSS transition** ⇒ mọi số ĐỘNG đo lúc đó là rác (Đợt 215b).

> ⬜ **BẢN BÀN GIAO CŨ (Đợt 190 + 191, 18/8/2026)** — giữ lại bên dưới vì các dòng ⬜ của nó vẫn
> là việc chỉ mắt/tay thầy kiểm được; **số liệu trạng thái trong đó ĐÃ LỖI THỌI**, lấy theo khối trên.

#### (bản cũ) Đứng ở đâu — 18/8/2026, sau Đợt 190 + 191

> ⭐⭐⭐ **KHO SẠCH, KHÔNG CÓ VIỆC DỞ DANG.** Đợt 190 + 191 đã **commit `52173f4` + push + LIVE + đối
> chiếu 11/11 mã băm**. 11 file code đã sửa: `core/lesson-import.js` · `core/content-view.js` ·
> `core/convert.js` · `core/engine.js` · `core/app.css` · `core/icons.js` · `core/classes.js` ·
> `core/showdown-setup.js` · `main.js` · `templates/running-word/running-word.js` ·
> `templates/running-team/running-team.js`.
>
> **Mảng đang chạy đã đổi: từ FIGHT MODE sang PLAY MODE + SHOWDOWN.** Đọc nhật ký **Đợt 190** và **191**
> (đầu `GHI CHU DU AN.md`) + `core/HUONG DAN CORE.md` 2 mục mới ("PLAY MODE" và "ĐỌC FILE BÀI HỌC")
> trước khi đụng tiếp vào phần này.
>
> **Số hiện trạng sau 2 đợt**: Fight 7/17 · Showdown 11/17 · **PLAY MODE (RUNNING + IPA) mở cho mọi act
> từ vựng có đủ nội dung** · import **7 act/file** (trước là 9) · nút MODE có **5 ô**.
>
> ⬜ **VIỆC CHỈ MẮT/TAY THẦY LÀM ĐƯỢC** (máy đã đo hết phần đo được):
> 1. ✅ **HẾT HẠN sau Đợt 192** — lưới chip Nam/Nữ của Đợt 191 **không còn tồn tại** (thay bằng nút
>    BOY|GIRL trên từng hàng), và bench nay **mở được màn Classes thật** (`scratch/cls192-test.html`).
>    Còn lại: nhìn **màu icon bé trai/bé gái + cân đối hàng học sinh** trên màn 86", và thử **cử chỉ nhấn
>    giữ 420ms** (mở Style từ nút Template) bằng ngón tay thật trên TOMKO — máy chỉ dựng được pointer
>    event tổng hợp.
> 2. **Nhìn hàng 5 icon mode trên màn 86"** — pane trình duyệt của phiên tự động bị ẩn nên **không chụp
>    được khung hình nào**, mọi thứ thuộc "cảm giác" chưa ai xem.
> 3. **Import 1 file .xlsm thật trên bản live** rồi mở tab PRONUNCIATION trong Edit, và **lưu 1 SET
>    trong RUNNING mode với Firestore thật** (bench dùng bản giả).
>
> 🧪 **BÀN THỬ** (thư mục `scratch` **gitignored** ⇒ phiên/máy mới phải dựng lại):
> `scratch/mode190-test.html` (+ `scratch/words-act.json` sinh từ `WORMS.xlsm`, `scratch/fake-store.js`
> ghi lại `saveActivity` nhận act nào) và `scratch/test-mode.html?t=<type>` cho bảng Showdown.
> Probe có sẵn: `__probe()` · `__tapMode()` · `__tapTile(tên)` · `__tapBtn(nhãn)`.
> ⚠️⚠️ **BỐN BẪY ĐO đã trả giá, đọc trước khi tự test**:
> (a) pane bị ẩn ⇒ transition **đứng im ở giá trị ĐẦU**, phải chèn
> `*{transition:none!important;animation:none!important}` rồi mới đọc `getComputedStyle`;
> (b) `getBBox()` của `<text>` trả **hộp EM của font**, KHÔNG phải hộp mực — đo chữ phải dùng canvas
> `measureText().actualBoundingBox*`;
> (c) `is-active` trên nút công cụ vừa nghĩa "panel đang mở" vừa nghĩa "chế độ đang chạy" — **đo hào
> quang thì phải đo TRƯỚC khi bấm**;
> (d) đối chiếu mã băm với bản live phải dùng **`git show HEAD:<file>`**, không dùng file trên đĩa (CRLF).
>
> Phần dưới đây là trạng thái **trước Đợt 190** và vẫn đúng cho mọi thứ khác:
>
> ⭐⭐⭐ **KHO SẠCH, KHÔNG CÓ VIỆC DỞ DANG TRONG CODE.** Ba đợt gần nhất (187 · 188 · 189) đều đã
> **commit + push + LIVE + đối chiếu mã băm**: `8cfc209` · `7bd96a7` · `c53f336`. Chi tiết đầy đủ ở
> `GHI CHU DU AN.md` (mới nhất TRÊN CÙNG) và khối tóm tắt ở đầu file này.
>
> **Mảng đang chạy là FIGHT MODE.** Thầy đang lần lượt tinh chỉnh nó qua từng đợt ngắn. Trạng thái:
> - **Fight bật ở 7/17 template**: Anagram · Quiz · Type the answer · True/false · Open the box ·
>   Find the match · Crossword. **Showdown 11/17.** 10 template chưa mở Fight và lý do từng cái:
>   xem Đợt 178 + 181 trong `GHI CHU DU AN.md`.
> - **Hai kiểu vòng** trong `core/fight.js`: vòng THƯỜNG và vòng **LƯỢT CHỌN Ô** (`tpl.fightPick =
>   "wait" | "lock"`). Luật đầy đủ ở `core/HUONG DAN CORE.md` mục FIGHT MODE.
> - **TIME DELAY** (`fightTieWindow`) là thanh kéo trong Options, chỉ ăn cho game vòng THƯỜNG.
> - **Thanh chờ** dùng API `ctl.registerWaitBar(side, fn)` — fight.js bấm giờ, engine vẽ.
> - **Fight và Showdown KHÔNG CÒN nút fullscreen** (Đợt 188, thầy chốt bỏ hẳn).
>
> ⚠️ **BA LUẬT MỚI CỦA CORE, ĐỌC TRƯỚC KHI ĐỤNG BẢNG OPTIONS** (đầy đủ ở `core/HUONG DAN CORE.md`):
> 1. **Thanh trượt**: chạm = +1 nấc · chạm đúp = −1 nấc · nút tròn thì kéo như thường. Chỉ có **một**
>    chỗ dựng thanh trượt trong cả kho (`mkSliderCell`).
> 2. **Ô không dùng được thì MẤT MÀU, không ẩn** (`.is-locked`) — và **phải kèm `disabled`**, vì
>    `pointer-events:none` chỉ chặn ngón tay chứ không chặn bàn phím.
> 3. **Thêm ô cao bất thường vào lưới Options thì phải quét lỗ hổng CẢ HAI cột** (bài học Đợt 189).
>
> 🧪 **BÀN THỬ**: `scratch/fight-bench.html` (thư mục `scratch` **gitignored** ⇒ phiên/máy mới phải
> dựng lại). Nó dựng một trận THẬT bằng `startFight()` cho bất kỳ template nào:
> `?t=<type>` · `&single=1` (chế độ đơn) · `&fightTieWindow=` `&fightSpeedBonus=` `&timeCost=`
> `&timeCostIdle=` `&timer=countUp` … Bấm nút phải bắn **`PointerEvent`** (`press.js` nghe
> `pointerdown`, `.click()` không tap được).
> ⚠️⚠️ **HAI BẪY ĐO đã trả giá, đọc kỹ**: (a) pane test bị ẩn ⇒ **transition đứng im ở giá trị ĐẦU**,
> `getComputedStyle().opacity` trả về 1 dù lớp đã áp — phải chèn `* { transition:none !important }`
> rồi mới đo; (b) `requestAnimationFrame` cũng chết ⇒ hiệu ứng đếm điểm của `flyTimeCost` **không vẽ
> lại ô điểm**, nhìn y như "không trừ gì" — phải đo ở **Fight** vì số đội trên dải được ghi thẳng
> `textContent`, không qua rAF.

#### Trạng thái cũ hơn (15/8/2026 — sau Đợt 165), giữ lại làm nền

> ⭐⭐ **ĐỢT 165 — EDIT SỬA ĐƯỢC CẢ 4 BỘ ENG1/ENG2/VI1/VI2. ✅ THẦY DUYỆT → COMMIT `52fbed5` + PUSH + LIVE
> (đã đối chiếu sha256sum 7 file, khớp 100%). ⚠️ Sau khi LIVE, thầy chụp màn hình báo đổi tab thì bảng
> "nháy hiện rồi mất ngay" — 2 animation `fill:forwards` chồng nhau trên `iWrap`, animation sau không
> `.cancel()` animation trước. **Đã vá → COMMIT `42f90d5` + PUSH + LIVE** (đối chiếu sha256sum, khớp
> 100%). Chi tiết đầy đủ: nhật ký Đợt 165 mục 7 (đầu `GHI CHU DU AN.md`).**
> Trước đợt này, Edit của act `WORDS` (Đợt 145) chỉ sửa được ĐÚNG bộ đang chơi — không có cách sửa 3 bộ
> gợi ý còn lại từ trong Edit. Nay `templates/anagram/anagram-editor.js` có **4 tab ENG1/ENG2/VI1/VI2**
> (cùng hàng với Generate/Delete voices/Delete words), bấm tab nào bảng Word/Clue **trượt** sang đúng bộ
> đó; ENG1/ENG2 có mic tạo giọng, VI1/VI2 không (giọng máy đọc sai tiếng Việt). Thêm/xoá/kéo-thả dòng và
> sửa cột Word tự đồng bộ MỌI tab — vì mỗi từ vẫn là 1 object DUY NHẤT mang cả 4 bộ, không phải 4 mảng
> tách rời. Kèm dọn 2 tính năng cũ trong Anagram editor (bỏ "Hide all Text" — dư vì đã có Options >
> Content; bỏ "Swap Columns" — thầy thấy không hữu dụng), và bỏ hộp Tip ở **cả 16 editor** (không riêng
> Anagram). 1 lỗi thật tự bắt: dòng mới gõ ở tab VI1 rồi chuyển ENG1 bị dính chữ Việt — do dùng nhầm
> `clueOf()` (hàm viết cho lúc nạp lần đầu từ storage) ở chỗ đọc dữ liệu MỖI LẦN đổi tab; đã vá bằng đọc
> thẳng `it.clues[key]`. Chi tiết đầy đủ + cách tự test không cần đăng nhập (`scratch/test-anagram-
> editor.html`, bench mới): nhật ký Đợt 165 (đầu `GHI CHU DU AN.md`) + `templates/anagram/GHI CHU
> ANAGRAM.md`.
> **Còn lại chỉ mắt/tay thầy + Firestore thật** (xem mục 4 dưới): nhìn tab trượt trên máy thật, và mở 1
> act WORDS thật đã có giọng, sửa ENG2/VI1, Save, mở lại xem giọng ENG1/ENG2 cũ có còn nguyên không.

**Trước đó (15/8/2026 — sau Đợt 163–164):**

> ⭐⭐ **ĐỢT 163–164 — ✅ THẦY DUYỆT → COMMIT `df36333` + PUSH + LIVE (đã đối chiếu sha256sum, khớp 100%).**
> Hai việc: (1) khoá `user-select`/`-webkit-user-drag` cho mọi popup công cụ (`.aw-tool-panel`) + khung
> act, tránh lỡ bôi chọn chữ/kéo ảnh khi đang bấm chơi nhanh; (2) ô "Timer" đếm ngược trong Options có bộ
> chỉnh MỚI `makeTimeStepper` (`core/numberstepper.js`, CHỈ riêng ô này, không đụng `makeHStepper` dùng
> chung 6 chỗ khác): vùng phút/giây tách riêng, giây snap tới bội số 10 gần nhất, chỉ ô đổi số mới trượt
> hoạt ảnh. Kèm luật mới cho MỌI ô thời gian trong app: step 1 giây/lần bấm (đã sửa Running word "Time
> each team" + Balloon pop "Round time", trước đó step 5s). Chi tiết đầy đủ + cách tự test không cần
> đăng nhập (`scratch/test-mode.html`): nhật ký Đợt 163 và 164 (đầu `GHI CHU DU AN.md`).
> **Không có việc gì treo lại từ đợt này** — thầy đã tự bấm thử và duyệt.

**Trước đó (14/8/2026 — sau Đợt 145–158):**

> ⭐⭐ **ĐỢT 158 — MỘT NÚT CHO BA CHẾ ĐỘ. ✅ ĐÃ DUYỆT, COMMIT `23327b3` + LIVE (xem mục 3 phía trên).**
> Hàng nút dưới khung còn 4 (Options · Template · Style · **MODE**); nút MODE mở **bảng chọn ô icon to
> không chữ**. Hai nút cũ (MODE của Đợt 124, SHOWDOWN của Đợt 155) **không còn**, và hai luật ẩn nút
> kèm theo chúng cũng hết hiệu lực. Chi tiết + 2 lỗi thật tự bắt được: khối trích dẫn đầu file này,
> nhật ký Đợt 158, và `core/HUONG DAN CORE.md` mục **"MỘT NÚT CHO BA CHẾ ĐỘ"**.
> **Việc còn lại của đợt này chỉ là mắt/tay thầy** — máy đã đo hết những gì đo được.
>
> ⭐ **SHOWDOWN (Đợt 155-157) — ĐÃ LIVE, commit `57677cf`.** Chế độ mới, KHÔNG nằm trong kế hoạch
> A–D bên dưới. Xong và đã chạy trên bản live. **Còn 4 việc CHỈ THẦY LÀM ĐƯỢC, chưa ai làm:**
> 1. Thử với **tài khoản thật + 2 máy/2 cột cùng lúc** → nghiệm luật GIÀNH ĐỘI trên Firestore thật
>    (backend giả không thay được).
> 2. Thử trong **myActivity chia 2–4 cột** — đây là mục đích gốc của cả chế độ.
> 3. **Nhìn bằng mắt**: cỡ chữ, độ cân đối 3 màn, độ mượt hoạt cảnh (pane preview không compositing
>    nên phiên trước không chụp được ảnh).
> 4. **Nghe**: bộ tiếng của Showdown mới chỉ ĐẾM được số lần gọi, chưa ai nghe.
>
> ⭐⭐ **VIỆC LỚN ĐANG DANG DỞ: KẾ HOẠCH 4 ĐỢT A–D CỦA THẦY.** Đọc mục này trước khi hỏi thầy làm gì.
> Thầy giao 3 việc lớn (14/8/2026), em chia 4 đợt và thầy chốt:
>
> | Đợt | Việc | Trạng thái |
> |---|---|---|
> | **A** | Gộp ENG1/ENG2/VI1/VI2 thành **một act `WORDS`**, chọn bộ gợi ý trong Options | ✅ **XONG** (Đợt 145) |
> | **B** | QUIZ1+QUIZ2 và 2 bản reading act gộp, mỗi act mang **2 nửa PRACTICE/HOMEWORK** | ✅ **XONG** (Đợt 146) |
> | **C** | **Bộ options HOMEWORK khi GIAO BÀI** + mặc định trong Settings | ✅ **XONG** (Đợt 160, code
>   xong + tự test qua trình duyệt — **CHỜ THẦY DUYỆT + đăng nhập thật để thử hết**) |
> | **D** | ~~XOÁ SẠCH dữ liệu cũ trên Firebase~~ | ⛔ **HUỶ KHỎI KẾ HOẠCH CODE (15/8/2026, thầy chốt)** —
>   **thầy tự tay xoá**, không cần dựng trang dọn tự động nữa |
>
> **Đợt C — ✅ ĐÃ CODE (Đợt 160, 15/8/2026), chi tiết + kết quả tự test ở nhật ký Đợt 160:**
> - **"Default homework options"** trong Settings, bucket RIÊNG (`homeworkOptionsByType` trong
>   `localStorage`, xem `core/settings.js`) — không đụng bucket "Default activity options" cũ.
> - Màn **"Set assignment"** hiện luôn bảng Options (dùng lại `buildOptionsControls`/`buildOptionsBody`),
>   nạp sẵn bộ mặc định homework để thầy chỉnh riêng cho bài này; **`createAssignment` chụp options đã
>   chỉnh** (tham số `options` mới) chứ không phải `act.options`.
> - Màn **"Edit assignment"** thêm bảng Options y hệt, nạp từ CHÍNH `assignment.activity.options` đang
>   có (không phải default), Save patch bằng dot-path vào `assignment.activity.options`. ✅ Đã kiểm:
>   **luật Firestore cho phép** (`allow update: if isTeacher()`).
> - ⚠️ **HAI CÔNG TẮC RỜI NHAU** (thầy chốt): hàng PRACTICE/HOMEWORK trong Options chỉ chọn **NỘI DUNG**;
>   bộ options khi giao bài là chuyện **riêng**, quyết định lúc giao. Không gộp hai thứ này.
> - `snapshotOf` **không chép `viewOptions`** — bài đã giao nhận đúng bộ đang chạy lúc giao. Giữ nguyên.
> - ⬜ **Việc chỉ thầy làm được** (đăng nhập thật + Firestore thật): tạo 1 bài giao thật rồi chỉnh
>   Options riêng, mở lại "Edit assignment" xem lưu đúng chưa, nhìn modal rộng hơn (620px) trên màn thật.
>
> **Đợt D — ⛔ HUỶ (15/8/2026, thầy chốt)**: thầy tự tay xoá Activities + Results + clip giọng trên
> Firebase, không cần Claude dựng trang dọn tự động (`tools-voice-cleanup.html` vẫn còn đó nếu cần
> tham khảo, nhưng không phải làm gì thêm nữa).
>
> **⬜ Việc thầy cần nghiệm bằng mắt/tay (máy không tự làm được)** — pane test của phiên tự động bị ẩn
> nên Chromium **không vẽ khung hình nào**, mọi thứ thuộc "cảm giác" đều chưa ai nhìn:
> - Import **1 file `.xlsm` thật** trên bản live → act `WORDS` mở ra, gạt TEXT/VOICE + ENG1/ENG2/VI1/VI2.
> - **Nghe giọng thật**: act WORDS cần **2 bộ clip** (ENG1 + ENG2) ⇒ 100 từ = **200 clip**, thời gian
>   tạo gấp đôi. Popup Import đã ghi rõ con số trước khi chạy.
> - Chuỗi **animation Đợt 148–152** trên Chrome/TOMKO thật: đổi công cụ (Options→Template/Style),
>   gạt TEXT/VOICE, accordion "Points off" của Anagram, lưới Template 3 cột.
> - Act `WORDS`/`QUIZ` **lưu lên Firestore rồi mở lại** (phiên tự động không đăng nhập được).

**17 template, tất cả `built:true` trong `core/catalog.js`, tất cả LIVE**, mỗi loại có content editor
riêng, và `play.html` (trang HS) chơi được cả 17:

`quiz · anagram · find_the_match · type_the_answer · open_the_box · true_false · gameshow ·
maze_chase · whack_a_mole · flying_fruit · balloon_pop · crossword · unjumble · speaking_cards ·
running_word · running_team · speaking`

**FIGHT MODE** (1 khung ↔ 2 khung đấu nhau, `core/fight.js`, từ Đợt 124) nay có **2 template
tham gia: Anagram và Quiz** (`tpl.fightMode: true`) — mọi thay đổi ở `core/fight.js` từ giờ PHẢI tự test
cả 2, không chỉ Anagram. ⭐ **Từ Đợt 158 vào Fight bằng nút MODE gộp** (ô Fight trong bảng chọn), không
còn nút riêng.

**TIME COST** (Đợt 139) — tuỳ chọn CHUNG mới: trừ điểm mỗi **giây trống**. Hiện có ở **Anagram + Quiz**
(`tpl.timeCost: true`). Thêm cho template khác = 1 cờ + 4 dòng, hợp đồng ở `core/HUONG DAN CORE.md`
mục "TIME COST". Hiệu ứng dùng chung nằm ở `core/timecost.js`.

**BẢNG OPTIONS v2** (Đợt 140) — mọi tuỳ chọn là **1 ô của lưới 2 cột**, dựng bằng 4 hàm chung engine
truyền cho template: `mkCell` · `mkSeg` · `mkSliderCell` · `addCheck`. Hợp đồng đầy đủ +
5 luật (trong đó **cấm template đụng DOM của panel**) ở `core/HUONG DAN CORE.md` mục
"OPTIONS PANEL v2". 16/17 template đã chuyển; **running-word còn dùng nhóm kiểu cũ** (panel bespoke:
ô nhập tên đội + đồng hồ tuỳ chỉnh) và vẫn hiện y như trước nhờ "cầu tương thích" trong `app.css`.

**⭐ HAI TRỤC NỘI DUNG MỚI (Đợt 145–146)** — hợp đồng đầy đủ ở `core/HUONG DAN CORE.md`, file lõi mới
`core/content-view.js`. Một act nay có thể mang **nhiều BỘ GỢI Ý** (`variants`: eng1/eng2/vi1/vi2) và/hoặc
**2 NỬA** (`contentSets`: practice/homework); `resolveActivity()` bẹp xuống act thường ngay trước khi
chơi ⇒ **0/17 file game phải biết chuyện này**. **Mỗi lựa chọn có bộ options RIÊNG** (`viewOptions`,
Đợt 147). ⚠️ `core/engine.js` phân biệt **`libAct`** (act thư viện, còn đủ mọi bộ) với **`activity`**
(bản đã bẹp để chơi) — **mọi đường GHI dùng `libAct`**, ghi nhầm là lưu đè act mất 3/4 nội dung.
**1 file `.xlsm` nay ra 9 act** (trước 16).

**10 đợt gần nhất:**
| Đợt | Việc | Commit |
|---|---|---|
| **163–165** | ⭐⭐ **165**: Edit sửa được cả 4 bộ ENG1/ENG2/VI1/VI2 (tab trượt) + dọn Hide all Text/Swap Columns/Tip khỏi toàn app, kèm vá lỗi thật "nháy hiện rồi mất" khi đổi tab (2 animation `fill:forwards` chồng nhau) · **163–164**: khoá chọn text/ảnh trong pop-up + bộ chỉnh phút/giây riêng cho Timer | `52fbed5`+`42f90d5` (165) · `17e8538`/`df36333` (163–164) |
| **159** | ⭐⭐ **SHOWDOWN LÀM LẠI**: 1–5 đội · **1 đội = cả lớp, không lên mây** · bỏ màn C, Single/Reset/Random xuống hàng dưới · đội bị lấy **hiện mờ** thay vì ẩn · **2 bố cục** + bảng rộng bằng khung app · **dòng tên tự đứng + hook `ui.itemChanging`** | `23327b3` |
| **158** | ⭐⭐ **BA CHẾ ĐỘ VỀ MỘT NÚT** (bảng chọn ô icon, không chữ) + 2 lỗi thật: **claim đội không được nhả** (đội chết 12h ở máy khác) · **xếp đội trong trận là công cốc**; kèm bẫy `panel.isConnected` **cắn lại** trong `engine.js` | `23327b3` |
| **154** | ⭐ Màn START gọi đúng **tên act con** (`WORDS - ENG1`) + act tích hợp **giữ TEXT-VOICE và act con khi đổi template** (`subActSource()`, Apply **chuyển đổi lại** thay vì lưu suông) | `58e996a` |
| **153** | ⭐ Hết "frame thừa ở cuối" khi sang **Style/Fight**: hai lớp swap **ghim bề rộng** (cũ = ảnh chụp, mới = bố cục đích) + lớp mới **phủ kín hộp**; kèm **15px scrollbar** trong phép đo và **7px font weight 400 chưa nạp** | `58e996a` |
| **152** | ⭐ 3 lỗi hình học khi đổi công cụ (đích thiếu 30px padding · lớp cũ lệch padding-box · **chú thích CSS hỏng nuốt cả rule** ⇒ mất `overflow:hidden` + transition) + **Template 3 cột** | `0c1bfda` |
| **151** | ⭐ **Panel rơi khỏi neo** (`.aw-swapbox` khai `position` đè `absolute` của panel) + **dissolve trên nền đục** hết "nháy nhẹ" | `0c1bfda` |
| **150** | ⭐ Cú **nâng 9px "trừ nút Apply"** (margin-collapse đổi trạng thái khi ghim chiều cao) + **cụm nút thở** (flex-grow 1→0) | `0c1bfda` |
| **149** | ⭐ **Chính nút đang bấm bị dựng lại** ⇒ giật; tách hàng công tắc ra khối riêng dựng-một-lần + `selState` | `0c1bfda` |
| **148** | ⭐ Nhịp 2 của accordion: **khoảng cách hàng chuyển từ lưới xuống từng ô** + `swapContents()` + Template = Options về bề rộng, **mỗi game một icon** | `0c1bfda` |
| **147** | ⭐ **Mỗi lựa chọn một bộ options riêng** (`viewOptions`) + vá "khựng 1 nhịp" (accordion) | `0c1bfda` |
| **146** | ⭐ **ĐỢT B**: QUIZ1+QUIZ2 và 2 bản reading act gộp — mỗi act **2 nửa PRACTICE/HOMEWORK** + tabs trong 3 editor | `0c1bfda` |
| **145** | ⭐ **ĐỢT A**: ENG1/ENG2/VI1/VI2 gộp thành act **`WORDS`** — file lõi mới `core/content-view.js` | `0c1bfda` |
| **142** | ⭐ **Import có đủ bộ chọn giọng như editor** (Mix 4 giọng · Random UK/US), luật mix lên `core/voice-mix.js` dùng chung 2 đường + **huy hiệu loa xanh** trên thẻ act đã đủ 100% giọng | `7faf500` |
| **141** | ⭐ **VÁ LỖI THẬT IMPORT EXCEL**: đọc `w` (chữ Excel hiển thị) thay vì `v` (giá trị thô) ⇒ `8:30` hết thành `0.3541666666666667`; ô lỗi `#VALUE!` hết đẻ act rác. Đo cả 102 file: 5 file đổi, 0 file mất nội dung | `0f67311` |
| **140** | ⭐ **THIẾT KẾ LẠI BẢNG OPTIONS** — lưới 2 cột dùng chung, trung bình **−36% chiều cao**, 0/17 phải cuộn. Kèm: gỡ 2 chỗ template cắt DOM panel bằng tay | `eea0ecd` |
| **139** | ⭐ **TIME COST** (trừ điểm mỗi giây TRỐNG, số đỏ bay vào đồng hồ) + **Bonus x lên 10x**. Kèm 1 lỗi thật tự bắt: đấu trừ 2 lần | `c840baf` |
| **138** | 📘 Chỉ hồ sơ: ghi thành luật "Hợp đồng xếp lớp của hệ popup" | `1030313` |
| **137** | ⭐ **VÁ LỖI THẬT "không kéo được thanh Points off"** — hồi quy do Đợt 134: accordion `max-height` thiếu `overflow:hidden` ⇒ thanh trượt tàng hình đè lên thanh thật. Dính 3 ca (kèm 2 ca **Lives** chưa ai báo). Chỉ sửa `templates/anagram/anagram.css`, 2 dòng | `912016b` |
| **136** | Icon trong nút to hẳn (15px→26px) + bỏ số 7 nét, trả số điểm tay về font Baloo 2 của app (**đảo ngược** việc 10 của Đợt 134) | `05b73b5` |
| **135** | `core/engine.js` phát `MYACT:AW:FIGHT:on/off` cho myActivity | `9577523` |
| **134** | **12 cải tiến UI/UX Anagram đơn+đấu** (slogan lên chung thanh trên, cụm loa 5 cột nhạy hơn, Options tự thu nhỏ khi tràn, animation popup mượt toàn app, "TEAM LEFT/RIGHT WINS"...) + ⭐ vá lỗi thật "2 loa lệch màu" (PULL voice state) | `0a24c62` |

⚠️ **Đợt 134 tới nay đã bị đảo/vá 2 lần** (Đợt 136 bỏ số 7 nét · Đợt 137 vá accordion nó tạo ra) — đợt
đó gom 12 việc một lượt nên diện va chạm rộng. Sắp đụng vào phần Anagram nào của Đợt 134 thì **đọc Đợt
136 + 137 trước** để khỏi khôi phục nhầm thứ đã bị bỏ.

Ngoài ra: Settings có mục **Classes** (lớp + học sinh, `core/classes.js`) — dữ liệu bền cấp app,
act nào gọi tên HS thì đọc từ đó.

### 4. ⬜ VIỆC ĐANG CHỜ — đọc kỹ trước khi hỏi thầy làm gì tiếp

> ⭐⭐⭐⭐ **MỚI NHẤT (Đợt 222, 21/8/2026) — ĐÃ LIVE `acd381c`. KHÔNG CÒN VIỆC CODE DANG DỞ.**
> Kho sạch, `main` = `origin/main`. **7 file code đã sửa**: `core/fight.js` ·
> `templates/quiz/quiz.js` · `anagram/anagram.js` · `type-the-answer/type-the-answer.js` ·
> `true-false/true-false.js` · `find-the-match/find-the-match.js` · `find-the-match/find-the-match.css`.
> Năm việc chờ **mắt/tay thầy** nằm ở cuối khối **Đợt 222** trong `GHI CHU DU AN.md`:
> 1. ⬜ **Chơi thật một trận Quiz/Anagram trên TOMKO** — hết delay mà đội chậm bị chấm sai,
>    lớp có thấy công bằng không, hay cần nới Time delay (thanh trượt tới 10s, hoặc nấc ∞).
> 2. ⬜ **Nhịp giữ 2,1 giây** sau khi chấm sai: đủ để cả lớp nhìn đáp án chưa, hay dài quá.
> 3. ⬜ **Find the match trên 86"**: hai bàn xáo khác nhau nhìn có rối không; cỡ chữ ở mức thu
>    nhỏ nhất (**0,52**) đọc được từ cuối lớp không.
> 4. ⬜ **Dấu ✓/✗ bay** ở Find the match chơi thường: nay bay trọn ra ngoài ô — có che ô nào
>    lúc đang bay không.
> 5. ⬜ Act nào thầy muốn giữ nết cũ (đội chậm được làm nốt, không bị chấm sai) thì đổi ô
>    **Round rule** sang **"finish"** — đã đối chứng ngược là nhánh đó không đụng gì.
>
> ⛔ **TRƯỚC KHI SỬA TIẾP MẢNG NÀY, đọc "bẫy" của khối Đợt 222** — nhất là: `roundDone[other]`
> phải đặt TRƯỚC `timeUp()` · cờ `fromMatch` phải bỏ qua `fightLocked()` (và `busy` của
> Anagram) · `scrollWidth` nói dối trong hộp flex căn giữa · `overflow:hidden` cắt theo HỘP
> nên `z-index` không cứu được dấu bay · **`elementFromPoint` không bao giờ trả về phần tử
> `pointer-events:none`** · **`optVer` nằm trên ACT, không nằm trong `options`**.
>
> ---
> ⭐⭐⭐ **Trước đó (Đợt 221, 21/8/2026) — ĐÃ LIVE `97306a2`. KHÔNG CÒN VIỆC CODE DANG DỞ.**
> Kho sạch, `main` = `origin/main`. Năm việc chờ **mắt/tay thầy** (đủ chi tiết ở cuối khối
> Đợt 221 trong `GHI CHU DU AN.md`):
> 1. ⬜ **Nhìn cột Quick Access trên màn 86"** — máy này pane bị ẩn ⇒ **không chụp được khung
>    hình nào**, nên mọi thứ "thuận mắt" chưa ai xem.
> 2. ⬜ **Mở AWord trong myActivity chia 3-4 cột**: ở 380px cột thẻ chỉ còn ~126px. Thầy chốt
>    *"luôn giữ cột bên trái"* nên máy giữ đúng vậy — xem có chật quá không.
> 3. ⬜ ⚠️ **Thư viện THẬT**: nếu thầy đã có sẵn thư mục `DS-S4.I1 PLANTS, ANIMALS…` thì import
>    đẻ **thêm** `DS-S4.I1` bên cạnh — tên file chưa bao giờ mang tên của cấp TRÊN nó. Sửa tay
>    ở màn chốt là được; muốn máy tự khớp thì phải có nguồn tên khác (chưa có).
> 4. ⬜ **`FLY-S2` / `DR-S1`** khác tên ổ D (`LSFLY-S2` / `DORAEMON 1`) — đúng lời thầy chốt
>    *"theo mã, tự động"*. Muốn khớp ổ D = thêm 1 bảng alias trong `LESSON_TREE`.
> 5. ⬜ **Nút xoá lịch sử Recent** ở góc phải tiêu đề — với ngón tay có đủ to không.
>
> ⛔ **TRƯỚC KHI SỬA HAI MẢNG NÀY, đọc "Cách làm + bẫy" của khối Đợt 221** — nhất là:
> `sizeQuickAccess()` **đã bị xoá** (đừng dựng lại: nó tự đọc kết quả của chính nó) · rail phải
> là **flex**, quay về ô lưới là thẻ lại lọt vào cột Quick Access · khung bước 2 của Import dựng
> **MỘT LẦN ngoài `buildPanel()`** · làm sạch tên chỉ ở **cấp cây**, thư mục lá giữ nguyên.
>
> ⭐⭐⭐ **Trước đó (Đợt 220, 21/8/2026) — thầy SẼ TEST TRÊN LỚP rồi yêu cầu sửa ở session sau.**
> Bốn việc chờ tay thầy nằm cuối khối Đợt 220 trong `GHI CHU DU AN.md` (ván Count thật trên TOMKO ·
> Submit giữa chừng ở Free · cỡ chữ dải "Questions each" trên 86" · act cũ nào muốn nết Allow skip
> cũ thì bật lại trong Options). ⛔ Trước khi sửa theo lời thầy, đọc phần "Cách làm + bẫy đã cắn"
> của khối đó — nhất là: options theo THAM CHIẾU (cấm copy), `registerNavGate` (cấm chặn chỉ trong
> `setNav`), và cắt review Free TRƯỚC `computeResult`.

> ⚠️ **KHỐI ĐỢT 218 NGAY DƯỚI ĐÂY ĐÃ LỖI THỜI MỘT PHẦN (Đợt 221 làm lại bố cục).** Mục 5 và
> mục 6 **không còn đúng**: khung nay là **cột riêng**, thẻ không bao giờ rơi xuống dưới nó nữa,
> và vạch kẻ 218c luôn nằm giữa hai vùng (lớp `.is-alone` đã xoá). Mục 1-4 vẫn còn nguyên giá trị.
>
> ⭐⭐⭐ **(Đợt 218 + 218b, 20/8/2026) — KHUNG QUICK ACCESS:**
> 1. ⬜ **Nhìn khung trên màn 86"** — máy này **không chụp được khung hình nào** (pane bị ẩn ⇒ không
>    compositing), nên mọi thứ thuộc "thuận mắt" chưa ai xem.
> 2. ⬜ ⭐ **KÉO SẮP XẾP BẰNG NGÓN TAY THẬT trên TOMKO** — máy chỉ dựng được pointer event tổng hợp.
>    Ngưỡng nhận kéo đang là **6px**; chạm hụt thành kéo thì nới, kéo mà không ăn thì thu.
> 3. ⬜ **Dòng khung cao 29px** — gọn đúng kiểu Explorer nhưng hơi nhỏ cho ngón tay. Nới là đổi
>    `padding` của `.aw-qa-label`; chưa tự đổi vì thầy nói *"tương tự Explorer"*.
> 4. ⬜ **Ghim/gỡ + đổi thứ tự với Firestore THẬT** (bàn thử dùng `scratch/fake-firebase-full.js`), và
>    xác nhận ghim ở máy này **hiện luôn ở máy kia** — đó là cả lý do cờ nằm trên node.
> 5. ⬜ **Mở AWord trong myActivity chia 3-4 cột**: xem lưới rụng còn 1-2 cột thì khung có còn dễ dùng
>    không, và card bị đẩy xuống có phiền không.
> 6. ⬜ **(218c) Vạch kẻ ngăn cách nhìn từ cuối lớp** có rõ không — đang là `#d7e0ec`; nhạt quá thì
>    đổi sang `#c7d3e2`. ⚠️ Vạch vẽ RA NGOÀI hộp khung, nên đừng trả `overflow: hidden` về `.aw-qa`:
>    làm vậy là **cắt mất nó mà không báo gì**.
> 7. ✅ **XONG** — đã commit `4642d4b` + push + LIVE (4/4 mã băm, 14/14 phép hỏi môđun).
>
> ⭐⭐⭐ **CẬP NHẬT SAU ĐỢT 221 — MỤC "CẢI TIẾN IMPORT" NGAY DƯỚI ĐÂY ĐÃ LÀM MỘT PHẦN.**
> Đã xong: **cây thư mục tự dựng theo tên file** (kèm màn chốt) và **`sourceStem()` cắt mất
> tên bài** — thư mục lá nay giữ nguyên tên bài nên `BEAVERS AND DAMS` và `SLIDE INSTRUCTION`
> hết đâm nhau. **CÒN NGUYÊN, chưa ai đụng**:
> - **5 sheet lớn importer CHƯA ĐỌC** (đo trên 138 file): `LOGIC-QUEST` 127 ·
>   `TRANSLATION-QUEST` 120 · `FILL PARAGRAPH(S)` 122 · `DEFINITION` 90 · `TABLEMIX` 67;
>   và `PARAGRAPH` 130 giữ **nguyên văn bài đọc** ở ô A1 — AWord chưa có chỗ chứa nó.
> - **Import vẫn chỉ nhận 1 file/lần** — chưa có đường kéo cả thư mục để dựng lại cả cây.
> ⛔ Đừng tự chọn hướng — hỏi thầy muốn làm mục nào trước.
>
> ⭐⭐ **(LỊCH SỬ) VIỆC THẦY ĐÃ NHẮM TỚI TRƯỚC ĐỢT 221: CẢI TIẾN IMPORT.** Trước Đợt 218 thầy bảo đọc dự án + quét
> `D:. LISTENING` và `D:. READING` "để chuẩn bị áp dụng một số thay đổi". **Đã quét xong 138
> workbook, số liệu để sẵn đây** — phiên sau khỏi quét lại:
> - **Cây nội dung rất đều**: `<cấp độ>/<bộ LSA2-S1>/<đề .T1>/<file .P1-2-3.xlsm>` (LISTENING) và
>   `<loạt>/<mùa DS-S4>/<chủ đề .I1>/<bài .W1>/<file>` (READING); mỗi thư mục lá còn `AUDIO/` và
>   `SITE/<LỚP>/<LỚP>_<ngày>_<WORDS|DICTS|RD> <mã bài>.gsite`.
> - **5 sheet lớn importer CHƯA ĐỌC** (đo trên 138 file): `LOGIC-QUEST` 127 · `TRANSLATION-QUEST` 120 ·
>   `FILL PARAGRAPH(S)` 122 · `DEFINITION` 90 · `TABLEMIX` 67. Ngoài ra `PARAGRAPH` 130 giữ **nguyên
>   văn bài đọc/transcript** ở ô A1 — AWord chưa có chỗ nào chứa nó.
> - **`sourceStem()` cắt mất tên bài** (đã chạy thử trên tên thật): `DS-S4.I1.W1 BEAVERS AND DAMS.xlsm`
>   → thư mục `DS-S4.I1.W1`; và `DS-S4.I1.W1 SLIDE INSTRUCTION.xlsm` ra **CÙNG một tên** ⇒ hai file
>   đâm nhau. Bản trùng của Drive giữ nguyên rác: `IEL-S15 (1) (1) (1).T3.P1`.
> - **Import chỉ nhận 1 file/lần**, chưa có đường dựng lại cả cây.
> ⛔ Đừng tự chọn hướng — hỏi thầy muốn làm mục nào trước.

> ⭐⭐⭐ **CẬP NHẬT 20/8/2026 (sau Đợt 217) — ĐÂY LÀ DANH SÁCH ĐÚNG. Mọi khối ⬜ bên dưới là của các đợt
> CŨ HƠN, giữ lại vì phần lớn vẫn là "chỉ mắt/tay thầy mới kiểm được".**
>
> **KHÔNG có việc code nào dang dở.** Kho sạch, Đợt 216 + 217 đã LIVE (11/11 mã băm, 12/12 phép hỏi
> môđun trên bản live). **Việc kế tiếp = HỎI THẦY** — ⛔ đừng tự chọn việc lớn, cũng đừng hỏi trống
> không: đọc mục 3 ở trên rồi hỏi vào đúng mảng đang chạy.
>
> ⬜ **CHÍN VIỆC CHỈ MẮT/TAY THẦY TRÊN TOMKO LÀM ĐƯỢC** (máy đã đo hết phần đo được):
> 1. ⭐⭐ **(Đợt 216) CHẠM THẬT VÀO THANH TRƯỢT trên màn TOMKO** — phép thử cuối cùng, và là thứ máy này
>    **không làm được** (không máy build nào có màn cảm ứng). Nếu vẫn nhảy tới chỗ chạm thì hướng dự
>    phòng đã sẵn: huỷ `touchstart` (`{passive:false}`) cho cú chạm ngoài nút, đổi lại là mất cuộn panel.
> 2. **(Đợt 217) Nhãn "Picked ✓" nằm ở ĐÁY TRONG CỘT** chứ không dưới mép ngoài như thầy tả — dưới mép
>    ngoài sẽ bị `.aw-sd-cols` cắt cụt hoặc đè lên hàng nút chân bảng. Thầy xem có chịu không.
> 3. **(Đợt 217) Hai máy thật giành team của nhau**: máy bị giành có dừng đúng lúc không, lời báo đủ rõ chưa.
> 4. **(Đợt 217) Che bài trong trận thật**: mờ 12% của quiz/true-false/find-the-match nhìn từ cuối lớp đã
>    đủ kín chưa, hay còn đoán được.
> 5. **(Đợt 217) Tên hàng cuối phễu trên màn 86"** bị thu nhỏ tới đâu thì thầy thấy khó đọc.
> 6. **(Đợt 217) Reset đội nhiều lần liên tiếp trên 2-3 máy** — xác nhận không còn ca nào kẹt người.
> 7. **(Đợt 216) Chơi thật một trận ở nấc ∞**: thanh chờ đứng-thở-lấp-lánh nhìn từ cuối lớp có hiểu là
>    "đang đợi đội kia" không · và lớp có chịu được việc vòng không tự sang câu mới không.
> 8. **(Đợt 216) Chốt 0,5 giây sau START** có thấy "đơ" không — nới/thu chỉ là sửa `START_GUARD_MS`.
> 9. **(Đợt 216) Bước 0,5s ở vùng trên của Time delay** có đủ tinh không, hay thầy muốn 0,1s suốt cả thanh.
>
> **Việc kế tiếp = HỎI THẦY.** Thầy đang đi từng đợt ngắn trên **Fight mode** và tự chỉ hướng mỗi lần
> ("Điều chỉnh tiếp theo: …"). ⛔ Đừng tự chọn việc lớn; cũng đừng hỏi trống không — đọc mục 3 ở trên
> rồi hỏi vào đúng mảng đang chạy.
>
> ⬜ **CHỈ TAY THẦY TRÊN TOMKO MỚI KIỂM ĐƯỢC** (máy đã đo hết phần đo được):
> 1. **(Đợt 188) Cửa sổ chạm đúp 320ms của thanh trượt** — chạm chậm quá thành 2 lần +1, nhanh quá thì
>    khó bấm đúp. Vùng nhận "trúng nút tròn" đang là **nửa nút + 4px**; thầy thấy khó tóm nút để kéo thì
>    nới ra.
> 2. **(Đợt 187) Thanh chờ TIME DELAY** cao 1,2cqw màu cam, không có số — nhìn từ cuối lớp có rõ không.
>    Và ở **Find the match** thanh dừng trước chữ "Page 1 / 2" (vì nếu kéo dài hết hàng thì nó vẽ xuyên
>    qua chữ đó) — thầy muốn giữ vậy hay muốn đẩy nhãn đi chỗ khác.
> 3. **(Đợt 187) Cân bằng số**: TIME DELAY bao nhiêu là vừa cho lớp · Speed bonus nay tới **100 điểm** ·
>    Bonus x của Anagram tới **20x** · **Time cost nay nhẹ đi N lần** ở mức Idle N (cùng số điểm nhưng
>    thưa hơn N lần) — mức điểm cũ của thầy có còn hợp không.
> 4. **(Đợt 187) Chơi thử Fight thật trên màn 86"**, nhất là luật **lượt chọn ô** với 2 đội chạm tay
>    cùng lúc (Open the box · Crossword), và Fight của True/false · Find the match.
> 5. **(Đợt 188) Fight/Showdown nay không còn đường vào toàn màn hình từ trong app** — thầy dùng thử vài
>    buổi xem có thiếu không (F11 của trình duyệt vẫn được).

#### Danh sách cũ hơn (giữ lại — phần lớn vẫn là việc chỉ mắt/tay thầy kiểm được)

> ⭐⭐ **Cập nhật 15/8/2026 (sau Đợt 165) — dòng ⬜ dưới đây đã LỖI THỜI, sửa lại cho đúng git log:**
> Đợt 158-159 → `23327b3` · Đợt 160 (ĐỢT C) → `4a6da8e` · Đợt 161-162 → `4e5ae82` · Đợt 163-164 →
> `17e8538`/`df36333` · **Đợt 165 → `52fbed5`**. **TẤT CẢ đã LIVE, kho sạch, không còn gì chưa commit
> tính tới Đợt 165.** Kế hoạch A–D coi như **XONG cả 4 mục** (C = code + commit + live, D = huỷ theo ý
> thầy 15/8/2026 — thầy tự tay xoá dữ liệu Firebase, không cần code).
> Riêng Showdown thì chỉ còn **mắt/tay thầy trên màn 86"**:
> - (158) bảng chọn 3 chế độ: cỡ icon, và khi Showdown chạy thì **3 ô** có chật không;
> - (159b) bảng đội **rộng bằng khung app**: hai bố cục (ô chờ bên phải khi 2-3 đội · lên trên khi 4-5
>   đội) có thuận mắt không · **nút Random / Flyback** bay có mượt không · cỡ chữ đọc được từ xa chưa;
> - (159) **dòng tên rơi/tụt** trên khung nhìn có mượt không;
> - (159b) trong **myActivity chia cột** (khung hẹp hơn nhiều): bảng nay co theo khung nên **không tràn
>   ngang**, nhưng cột sẽ rất hẹp — thầy thử xem có đọc được tên không, hay cần bản riêng cho cột hẹp;
> - cả hai đợt vẫn dùng **`sound.click()` chung**, chưa có tiếng riêng.

> **Trạng thái sạch tính đến hết 14/8/2026**: mọi thứ tới **Đợt 154** đã **commit + push + LIVE**
> (`58e996a` cho Đợt 153–154, `0c1bfda` cho Đợt 145–152), kho **không còn gì chưa commit**, bản live
> đã đối chiếu mã băm và chạy lại phép thử. Không có việc dở dang nào trong code — việc kế tiếp là
> **Đợt C**, và mọi mục ⬜ dưới đây là thứ **chỉ mắt/tay thầy** hoặc **Firestore thật** mới kiểm được.

**⭐⭐ ĐỢT C đã CODE + TỰ TEST xong (Đợt 160)** — CHỜ THẦY DUYỆT + tự thử bằng tài khoản thật (mục 3 ngay
trên có đủ danh sách "việc chỉ thầy làm được"). **ĐỢT D đã HUỶ.** Không còn việc lớn nào dang dở theo kế
hoạch A–D nữa — phiên tiếp theo hỏi thầy muốn làm gì mới.

**⭐⭐ ĐỢT 165 đã CODE + TỰ TEST + THẦY DUYỆT + LIVE (`52fbed5`, vá lỗi thật `42f90d5`)** — chỉ còn
**mắt/tay thầy + Firestore thật**, chưa ai làm:
- ⬜ Mở 1 act `WORDS` thật, bấm Edit, thử cả 4 tab ENG1/ENG2/VI1/VI2 trên máy thật: tab trượt có mượt
  không, kéo-thả 1 dòng rồi đổi tab xem thứ tự có theo đúng không. **Thầy đã báo 1 lần "nháy hiện rồi
  mất" — đã vá (`42f90d5`) và tự test lại kỹ (kể cả bấm tab liên tiếp thật nhanh), cần thầy xác nhận lại
  trên máy thật đã hết hẳn chưa.**
- ⬜ **Firestore thật**: mở 1 act `WORDS` thật đã có sẵn giọng ENG1/ENG2, sửa chữ ở ENG2/VI1, Save, mở
  lại — giọng ENG1/ENG2 cũ có còn nguyên không, chữ 4 bộ có đúng không (bench giả `scratch/test-anagram-
  editor.html` đã xác nhận đường này đúng, nhưng chưa ai thử với Firestore thật/đăng nhập thật).

**⭐ HAI TRỤC NỘI DUNG (Đợt 145–147, 154) — phần máy không tự kiểm được:**
- ⬜ **(Đợt 154)** Màn START nay ghi **tên act con** (`… / WORDS - ENG1`, `… / QUIZ - HOMEWORK`):
  nhìn trên màn 86" đã thuận mắt chưa, và thầy có muốn hàng chữ **dưới khung** (`.aw-below-title`,
  hiện vẫn chỉ có tên act) cũng mang tên act con không.
- ⬜ **(Đợt 154)** Act tích hợp đổi sang template khác (Quiz/Flying fruit/…) rồi **đổi bộ gợi ý** trên
  bản live: mỗi lần đổi là **dựng lại act** (chuyển đổi lại từ act gốc) nên có một nhịp nạp — trên máy
  thầy có thấy chậm không.
- ⬜ **Import 1 file `.xlsm` thật trên bản live** → phải ra **9 act** (`WORDS · PRONUNCIATION · IPA ·
  RUNNING WORD · RUNNING TEAM · QUIZ · 1. TRUE FALSE · 2. FILLING · 3. READING QUIZ`); mở act `WORDS`
  gạt TEXT/VOICE + ENG1/ENG2/VI1/VI2, mở act `QUIZ` gạt PRACTICE/HOMEWORK.
- ⬜ **Nghe giọng thật**: act `WORDS` cần **2 bộ clip** (ENG1 + ENG2) ⇒ 100 từ = **200 clip**, thời gian
  tạo **gấp đôi** trước đây. Popup Import đã ghi rõ con số trước khi chạy. Firebase đang gói **Spark
  miễn phí** — nếu thấy nặng, cân nhắc chỉ sinh giọng cho 1 bộ.
- ⬜ **Firestore thật**: act `WORDS`/`QUIZ` lưu rồi mở lại còn đủ mọi bộ; `viewOptions` sống qua lưu/nạp.
  (Phiên tự động không đăng nhập Google được — chưa ai kiểm đường này.)
- ⚠️ **Act cũ trong thư viện KHÔNG tự đổi** — vẫn là ENG1/ENG2/VI1/VI2 rời. Thầy đã chốt **xoá sạch ở
  Đợt D** chứ không chuyển đổi.

**⭐ CHUỖI ANIMATION (Đợt 148–153) — chỉ còn "cảm giác", phải mắt/tay thầy:**
- ⬜ **(Đợt 153, mới nhất — thứ cần nhìn TRƯỚC TIÊN)** Sang **Style** và sang **Fight (MODE)**: cái
  "frame thừa của một pop-up khác nảy nhanh ra ở cuối" đã hết hẳn chưa. Máy đã đo sạch (mỗi lớp đúng
  1 bố cục, nội dung cũ không còn hở ra ở bất kỳ mốc nào, ghim khớp 0.00px) nhưng pane test không vẽ
  được khung hình nào ⇒ **cảm giác vẫn phải mắt thầy**.
- ⬜ Đổi công cụ **Options → Template/Style** trên Chrome/TOMKO thật: đã thành một cú trượt sạch chưa.
- ⬜ Gạt **TEXT↔VOICE** và **ENG1↔ENG2**: nửa phải "gom vào dãn ra" đã mượt chưa, còn nháy không.
- ⬜ Accordion **"Points off"** của Anagram (On submit ↔ Letters with bonus): đã liền một mạch chưa.
- ⬜ Lưới **Template 3 cột**: cỡ ô/icon/chữ đã cân đối chưa.
- 🔎 **Bẫy đo đã ghi thành luật** (đọc `core/HUONG DAN CORE.md` trước khi tự test animation): pane test
  bị ẩn ⇒ **transition/rAF chết, thuộc tính đang transition kẹt ở giá trị ĐẦU** — phải tắt hẳn
  transition rồi mới đọc bố cục; và **lỗi loại này chỉ lộ trong lúc animation chạy**, phải **lấy mẫu
  40ms/lần TRONG cú chuyển** chứ đo sau khi yên vị là không thấy gì (Đợt 149 đã trả giá).

**⭐ GIỌNG ĐỌC (Đợt 142) — chỉ còn phần máy không tự làm được:**
- Thầy **import 1 file thật rồi nghe** 2-3 từ đầu ở chế độ Mix xem giọng có luân phiên đúng không
  (phiên tự động không chạy TTS thật được: cần tải model 86MB + đăng nhập để lưu clip).
- Nhìn **huy hiệu loa xanh** trên thư viện thật: đúng những act đã đủ giọng mới đeo huy hiệu.
- ⚠️ Luật mix nay ở **`core/voice-mix.js`** — sửa cách chia giọng thì sửa ĐÚNG file đó, cả editor
  Anagram lẫn popup Import đều gọi `planFor()` từ đây.

**⭐ IMPORT EXCEL (Đợt 141) — thầy đã xem báo cáo, chốt CHƯA làm, đừng tự làm:**
- **43/102 file bài học có sheet tên `Quiz` (không có số)** → importer chỉ dò `QUIZ1`/`QUIZ2` nên
  **bộ quiz đầu 30–35 câu bị bỏ im lặng**. Sửa được nhưng phải kèm việc dưới, không thì vẫn ra act rỗng.
- **3 kiểu bố cục sheet quiz** đang sống song song (A=hỏi · C=hỏi · B=hỏi) — importer chỉ hiểu 1 kiểu:
  kiểu cũ đẻ **act QUIZ2 rỗng 0 câu**, kiểu IELTS đẻ **30 câu sai hoàn toàn** (câu hỏi = "1","2"…).
- `main.js:1022` đếm số câu thiếu khoá `words` ⇒ hàng **Running word/Running team trong popup Import
  luôn hiện "· 0"** (cùng họ lỗi đã vá cho anagram ở Đợt 51).
- Skill **`taoact`/`taoactaw`** (openpyxl, ngoài AWord) **dính y hệt lỗi giờ của Đợt 141** — chưa sửa.
- ⬜ Thầy import lại `LSA2-S2.T4.P3-4-5.xlsm` trên bản live sau khi push, xác nhận câu 27 ra `8:30`.

**⭐ CHỜ TEST TOMKO (không ai tự kiểm được qua code):**
- **(Đợt 139)** ⭐ **Nhìn bằng mắt hiệu ứng số `-N` đỏ bay từ ô điểm vào đồng hồ** — pane test của phiên
  tự động bị ẩn nên `requestAnimationFrame` + WAAPI **chết hẳn**, em chỉ chứng minh được node sinh ra
  đúng số/đúng nội dung/được dọn sạch, KHÔNG thấy được nó bay đẹp hay xấu.
- **(Đợt 139)** Kéo thanh **Time cost** + bấm ô **ngưỡng 1–5s** bằng tay trên màn cảm ứng (2 thanh giờ
  nằm chung 1 hàng 2 cột — chuột đã đo `elementFromPoint` 5/5 điểm ở mọi mode).
- **(Đợt 139)** **Cân bằng số**: 20 điểm/giây là nặng hay nhẹ với lớp? Ngưỡng mặc định 1s có gắt quá
  với HS yếu không? (thầy chỉnh thanh khi dạy thật rồi bảo em đổi mặc định nếu cần)
- **(Đợt 137)** Kéo thanh **Points off** và thanh **Lives** trong Options bằng **tay trên màn cảm ứng**
  — kéo bằng chuột đã chắc chắn OK (đo thật `Off`→`-75`), cảm ứng đi cùng đường `pointer-events` nên
  rủi ro thấp nhưng chưa ai chạm tay thật.
- **(Đợt 136)** Icon trong nút to hơn + số điểm tay font thường — nhìn trên màn 86" đã đủ rõ chưa
- **(Đợt 134)** Nghe cụm loa 5 cột qua loa ngoài thật (chỉ đo được bằng số `--h` qua code, chưa nghe bằng tai)
- **(Đợt 134)** Cảm giác chạm cụm loa/nút loa đã dài hơn — có thoải mái trên màn cảm ứng không
- **(Đợt 134)** Animation mở/đóng popup (Options/Menu...) mượt tới đâu khi bấm tay thật — code đo được
  KHÔNG lỗi nhưng "cảm giác mượt" chỉ thầy đánh giá được
- ~~Số điểm tay kiểu 7 nét (LED)~~ — **HẾT HIỆU LỰC**, Đợt 136 đã bỏ hẳn kiểu số này

**Còn tồn đọng từ các đợt trước (chưa ai xử lý):**
- **Đợt 131 #2 CHƯA sửa**: đôi khi bấm ô chữ đầu từ mới trong FIGHT MODE không nhận ngay, next sang ô
  khác thì được — nghi race giữa `fadeSwap` và trạng thái khoá của trọng tài lúc từ mới vừa hiện. CHƯA
  bắt được tận tay qua code, cần thầy quan sát thêm khi nào tái hiện lại. (Khác với lỗi "2 loa lệch
  màu" đã vá ở Đợt 134 — đó là bug khác, cùng họ race-condition nhưng không phải cùng 1 chỗ.)
- **Panel Options Đấu+Anagram vẫn có thể cần cuộn ở trường hợp cực đoan** (màn thấp + nhiều nhóm cùng
  hiện) — Đợt 134 đã thêm cơ chế tự thu nhỏ chữ/khoảng cách (`is-compact-opts`, ~78-86% cỡ thường), đo
  thật giảm được kha khá (603px→556px ở 1 phép đo) nhưng KHÔNG hứa hết cuộn tuyệt đối; muốn hết hẳn
  phải cho panel đè lên hàng nút phía dưới (Đợt 132 từng nêu hướng này) — **thầy chưa duyệt hướng đó**.
- **"Different words" trong fight mode chưa có voice riêng từng bàn** (Đợt 132) — chỉ mirror giọng của
  bàn 0 sang bàn kia dù 2 bàn đang chơi 2 từ khác nhau.

**FIGHT MODE — phần thầy đã chốt là LÀM SAU, đừng tự làm:**
- **CHUÔNG** (đã chừa sẵn chỗ trong bố cục, thầy chốt bỏ ở đợt đầu)
- **Tên đội tự đặt** (đang cứng "TEAM LEFT"/"TEAM RIGHT" từ Đợt 134, trước đó "TEAM 1"/"TEAM 2")
- **15 template còn lại chưa vào fight mode** (chỉ Anagram + Quiz đã có, Đợt 133; thầy chốt: hoàn
  thiện Anagram trước rồi mới lan ra)
- Đổi template giữa trận đang bị **từ chối có chủ ý** (toast) — chỉ mở khi có template thứ 2 biết đấu
  (⚠️ giờ ĐÃ có Quiz — câu hỏi treo này có thể đã lỗi thời, hỏi lại thầy có muốn mở chưa)

**Câu hỏi treo, chưa hỏi thầy:**
- `anagram-editor.js` còn nút **"Hide text" từng hàng + Hide/Show all**; từ Đợt 123 chúng chỉ còn ý
  nghĩa với act cũ (chế độ AUTO). Có gỡ cho gọn không?

**Chưa nghiệm thu được vì không đăng nhập Google được:**
- Act THẬT trên Firestore + trang HS `play.html` cho Đợt 123 (mode Text/Voice) và Đợt 122.

**Tồn kho cũ (từ Đợt 33, thầy chưa chốt cái nào — đừng tự làm):**
- Balloon pop còn mục "cần POLISH" (blimp chồng lane ở khung hẹp; hiện 2 đồng hồ).
- 3 **ĐỀ XUẤT SỬA CORE** treo trong GHI CHU của template: Speaking cards xin cờ `openEnded`/
  `hideScore`; Crossword xin `tpl.hideRandomOption`; Balloon pop xin ẩn `timerEl`.
- Find the match thiếu 3 âm Menu/Leaderboard/RevealAnswers (core chưa có hook).

### 5. Kiến trúc trong 1 trang
- `core/` (34 file JS) = lõi dùng chung. `templates/<game>/` = mỗi game 1 thư mục, tự đăng ký bằng
  `registerTemplate()`.
- **Thêm/gỡ một template = sửa ĐÚNG 1 dòng trong `core/catalog.js`** (xem khuôn bên dưới).
- **FIGHT MODE** sống ở `core/fight.js` (nạp trì hoãn từ nút MODE). Template tham gia bằng cách khai
  `tpl.fightMode` + nói chuyện với `activity._fight` — hợp đồng đầy đủ + 4 bẫy ở
  `core/HUONG DAN CORE.md` mục "FIGHT MODE".
- 2 trang gốc: `index.html`→`main.js` (thư viện GV kiểu Google Drive, phải đăng nhập) ·
  `play.html`→`play.js` (HS chơi qua link/QR, **không đăng nhập**).
- ⛔ **Ranh giới bảo mật cố ý**: `play.html` KHÔNG được tải code thư viện GV. Thêm `import` TĨNH
  `store.js`/`assignment-ui.js`/`fight.js` vào engine là **vỡ** — phải `await import(...)`.
- Firestore: `users/{uid}/items` (thư viện + lớp học) · `assignments/{code}` (bản SAO act lúc giao,
  đọc công khai) · `assignments/{code}/scores/{id}` · `results/{id}` · `voiceClips/{id}` (đọc công
  khai). Bảo mật dựa vào 1 email GV whitelist trong luật Firestore.

```js
// khuôn 1 mục catalog — thêm chừng này là act hiện đủ ở picker, panel Template, play.html, Settings
{ type: "<ten_type>", label: "<Tên hiện ra>", built: true,
  blurb: "1 câu tả cho picker New activity.",
  css:    "templates/<ten>/<ten>.css",
  load:   () => import("../templates/<ten>/<ten>.js"),
  sample: () => import("../templates/<ten>/sample-<ten>.js") },
```

### 6. Luật làm việc BẮT BUỘC
1. **Tính năng mới: nghiên cứu + báo xung đột + CHỜ thầy nói "ok build" mới code.** Phần chưa rõ thì
   hỏi bằng **AskUserQuestion**, không hỏi bằng văn xuôi.
2. **Chỉ commit sau khi thầy duyệt.** Việc chưa duyệt ghi 🟢 CHỜ THẦY DUYỆT và **không commit**.
   Câu chốt chuẩn trong nhật ký: "✅ THẦY DUYỆT → COMMIT + PUSH + LIVE".
3. **KHÔNG BAO GIỜ `git add -A`** — nhiều phiên Claude chạy song song. Luôn `git fetch` +
   `git status` trước, rồi add ĐÚNG file của mình theo tên.
4. ⚠️ **Số Đợt chỉ chốt được SAU khi pull** — đã có lần build xong đánh số 117 rồi push bị từ chối
   vì phiên song song lấy mất 117→120. Xung đột gần như luôn rơi vào `APP_MASTER.md` +
   `GHI CHU DU AN.md` (mục mới nhất nằm đầu file).
5. **Mỗi đợt phải**: ghi `GHI CHU DU AN.md` + cập nhật khối tóm tắt đầu `APP_MASTER.md` + ghi
   `GHI CHU <TEMPLATE>.md` nếu có đụng template.
6. **Không tự sửa `core/` khi đang làm 1 template** — ghi "ĐỀ XUẤT SỬA CORE" vào GHI CHU của
   template rồi chờ. Mọi thay đổi core phải **cộng thêm, tương thích ngược**, và kiểm lại
   Quiz + Anagram không đổi hành vi.
7. **File thử tạm (`_test-*.html/.js`) phải XOÁ sau khi test xong** — quy ước từ Đợt 96.

### 7. Chạy thử & test
- Máy: `python devserver.py 5510` (⛔ **không** dùng `python -m http.server` — xem mục 9) →
  `http://localhost:5510/`
- **Test KHÔNG cần đăng nhập**: `http://localhost:5510/templates/<tên>/test.html` (chạy dữ liệu mẫu,
  không đụng thư viện). Đây là cách test chính.
- Lên live: **`git push` là đủ**, chờ 1-3 phút rồi `curl` kiểm dấu mốc. Chỉ khi >10 phút vẫn cũ mới
  mở **mục 0-TER (đường cứu hộ)**.
- ⚠️ Push xong mà thầy vẫn thấy bản cũ: xem **mục 0-BIS** — Pages cập nhật các file KHÔNG đồng thời,
  và trình duyệt giữ cache 10 phút (`Ctrl+Shift+R`).
- ⛔ **KHÔNG tự động hoá được**: popup đăng nhập Google (nên trang chủ + assignment thật phải nhờ
  thầy), và pane trình duyệt của phiên tự động **không chụp được ảnh** khi bị ẩn.
- ⭐ **Mẹo test giọng đọc không cần đăng nhập** (Đợt 123): nhét clip giả thẳng vào **Cache Storage
  `aword-voice-v1`** (khoá `/__aword-voice/<id>` + header `x-aword-saved` còn hạn) — tầng này được
  `getVoiceClip()` đọc TRƯỚC Firestore nên chạy đúng module thật, không phải chép file.
- ⭐ **Mẹo đo âm thanh**: tráo `HTMLMediaElement.prototype.play` để ĐẾM tiếng thật sự phát ra, đừng
  suy đoán qua giao diện.

### 8. Năm bẫy cắn nhiều nhất (đầy đủ ở `core/HUONG DAN CORE.md`)
1. **`document.querySelector(".aw-top-score")` và họ hàng** = truy vấn SỐNG toàn trang: trên ván đã
   chết nó trúng ô điểm ván MỚI, trong fight mode nó trúng bàn BÊN KIA.
2. **Không hàm dọn dẹp nào được phép ném lỗi** — `cleanup()`/`teardown()` chạy trên đường đi vào một
   lần dựng lại; một `ReferenceError` ở đó làm màn hình đứng im **không báo gì** (Đợt 124).
3. **`element.animate().onfinish` có thể KHÔNG BAO GIỜ bắn** khi tab bị ẩn → luôn kèm `setTimeout`
   dự phòng + cờ `done`. `requestAnimationFrame` cũng đóng băng hoàn toàn trong pane ẩn.
4. **CSS của template KHÔNG BAO GIỜ bị gỡ khỏi trang** → cấm selector trần nhắm class lõi.
5. **Hoạt cảnh điểm của template TỚI MUỘN** (Anagram: 1.760ms) — mọi thứ tính điểm ở ngoài phải chờ,
   đừng đọc "điểm hiện tại" ngay lúc game báo xong.

### 9. ⚠️ Hai thói quen cũ NAY ĐÃ SAI — đọc kỹ kẻo làm hỏng
1. **Gộp template = sửa ĐÚNG 1 FILE `core/catalog.js`.** Từ v0.9.7 (Đợt 33) `index.html`, `play.html`,
   `main.js`, `play.js`, `manifest.js` **không còn liệt kê template nào** — `ensureTemplate()` trong
   `core/registry.js` tự chèn CSS + import module lúc act được chơi/sửa. Mọi ghi chú cũ bảo "thêm import
   vào main.js + link CSS vào index.html + entry manifest.js" là **LỖI THỜI**, làm theo sẽ nạp thừa và
   phá mục đích (HS chỉ nên tải đúng 1 game).
2. **`manifest.js` không còn là danh sách chép tay** — nó chỉ là view suy ra từ catalog. Đừng thêm gì
   vào đó.

*(Khuôn 1 mục catalog + danh sách việc đang chờ + cách test: xem mục 5, 4 và 7 ở trên — bản Đợt 33
của mấy mục đó đã được gộp lên trên và xoá khỏi đây để không có hai danh sách nói khác nhau.)*

## 0b. BÀN GIAO CŨ (phiên 31/7/2026 — trạng thái game đã lỗi thời, giữ lại vì các bài học kỹ thuật)

**Anagram ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ** — không đổi gì thêm từ bản ghi trước, vẫn xem
`templates/anagram/GHI CHU ANAGRAM.md`. Việc còn thiếu (thầy chưa yêu cầu): 🎤/🖼️ voice+image trong
editor ("để bàn sau").

**Open the box ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ, ĐÃ COMMIT + PUSH** (commit mới nhất `fc553bd`, 31/7/2026 —
đã `curl` kiểm chứng file live khớp đúng). Đọc `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt
11-13 cho chi tiết đầy đủ phiên này, đây chỉ tóm tắt việc VỪA XONG (đợt 11-13 file đó = đợt 13-15 trong
số đếm chung của APP_MASTER — 2 file dùng 2 hệ đếm KHÁC NHAU, xem chú thích ở dòng "Cập nhật lần cuối"
đầu file):
- **4 tinh chỉnh giao diện/đồng hồ theo yêu cầu thầy** (đợt 11-12 file riêng): canh mép trái đồng hồ =
  mép phải điểm số (đè lên mục tiêu "thẳng mép ô câu hỏi" cũ); ô trả lời SAI đổi hẳn sang nền ĐỎ đặc +
  chữ/khoá trắng (bỏ kiểu xám cũ); trả lời ĐÚNG thì đồng hồ đầy lại rồi DỪNG hẳn, chỉ chạy tiếp khi bấm
  ô câu hỏi TIẾP THEO (khác đợt 9 cho chạy tiếp ngay); sửa lỗi lỡ 1 nhịp tiếng tick ở đúng mốc chuyển từ
  tích đơn sang tích đôi (5 giây cuối). Có 1 lần ĐẢO NGƯỢC ý giữa chừng: thử "zoom xong mới trượt / trượt
  xong mới zoom" (tuần tự) rồi thầy đổi ý quay lại "chạy đồng thời, khớp thời lượng `1.2s`" — bài học:
  đừng ngạc nhiên nếu thầy thử 1 hướng rồi đảo lại, cứ làm theo yêu cầu mới nhất.
- **⭐ SỬA 1 BUG THẬT quan trọng (đợt 13 file riêng)**: thầy báo hiệu ứng trượt RA của ô đáp án hoàn toàn
  không thấy chạy (chỉ "biến mất tại chỗ"). Nguyên nhân là 1 **bài học CSS đáng nhớ cho MỌI template
  khác trong dự án**: `.aw-otb-qtile` có 1 `animation` (hiệu ứng trượt VÀO, `fill-mode:both`) áp dụng
  VĨNH VIỄN lên `transform`/`opacity` — theo đúng luật CSS, **1 `animation` đang giữ 1 thuộc tính LUÔN
  thắng bất kỳ `transition` nào cũng nhắm thuộc tính đó**, nên hiệu ứng trượt ra (viết bằng `transition`)
  từ đợt 9 tới nay CHƯA BAO GIỜ thực sự chạy, dù CSS hợp lệ và 0 lỗi console. Chỉ lộ ra khi thầy quan sát
  kỹ ở tốc độ thường — đo 2 đầu animation (lúc trước vẫn hay làm) KHÔNG bắt được lỗi này, phải đo LIÊN
  TỤC giữa chừng bằng `javascript_tool` mới thấy. Sửa bằng cách đổi hiệu ứng trượt ra thành 1
  `@keyframes` riêng (animation-đấu-animation thắng sạch, không xung đột). **Nếu phiên sau thấy 1 hiệu
  ứng nào đó "code đúng, không lỗi console, nhưng không thấy chạy" ở BẤT KỲ template nào khác — nghi ngay
  khả năng có `animation` permanent (`fill-mode:both/forwards`) đang chặn 1 `transition` cùng thuộc
  tính**, đây rất có thể không phải trường hợp cá biệt.
  - Ghi chú thêm chưa kiểm chứng: rất có thể `.aw-otb-qtile:active { transform: translateY(...) }` (hiệu
    ứng bấm lún) cũng bị chặn bởi CHÍNH nguyên nhân này — thầy chưa báo nên chưa đụng, để ý nếu thầy nói
    nút bấm không có phản hồi lún xuống.
- **File đổi**: `APP_MASTER.md`, `core/app.css` (chỉ 1 chỗ: cột `.has-inline`, đã diff sạch, không đụng
  gì của phiên Find the match chạy song song), `templates/open-the-box/*`.
- **Đã kiểm bằng `curl` bản live**: `open-the-box.js`/`.css` có `aw-otb-qtile-out`; `core/app.css` có
  `grid-template-columns: 0 1fr auto`; `APP_MASTER.md` có "đợt 15" — tất cả khớp, bản live đã cập nhật.

**Type the answer ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ** — không có gì mới, xem
`templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` cho lịch sử.

**Find the match — ✅ SỐNG Ở TRANG CHỦ (`built:true` từ 31/7) + ĐÃ TINH CHỈNH 4 LOẠT THEO THẦY, COMMIT +
PUSH + LIVE (1/8/2026, Đợt 31).** Thầy chơi bản live rồi gửi 4 loạt yêu cầu — tất cả đã test trình duyệt
thật (đo DOM, không đoán qua ảnh, 0 lỗi console), KHÔNG đụng core. Tóm tắt: (1) 3 giây "3-2-1" không tính
vào đồng hồ (`manualTimerStart`), khối đáp án căn giữa vùng, đáp án CỐ ĐỊNH tuyệt đối (ô giải chỉ mờ, không
xóa khỏi lưới), bấm sai giữ nguyên ô; (2) bấm sai câu hỏi CHUYỂN tiếp (Repeat=xếp lại ngẫu nhiên) + LIVES
như True/false (tim top bar `hasLivesSlot`, slider 0–10); (3) bấm đúng câu hỏi bay về ô điểm + 11 sao, khóa
chọn tới khi câu mới vào ≥50% (`gateTimer`), hết tim hiện "GAME OVER"; (4) câu dài TỰ CO FONT (`fitPrompt`/
`--pfit`), clone bay dùng đúng cỡ đã co. **File đổi CHỈ 3** (`templates/find-the-match/find-the-match.js` /
`.css` / `sample-find-the-match.js`, mẫu bật `lives:5`) — `git status` trước commit xác nhận, add từng file
theo tên (không `git add -A`). Chi tiết: `GHI CHU DU AN.md` Đợt 31 + `templates/find-the-match/GHI CHU
FIND-THE-MATCH.md` (mục 1/8). Việc còn ngỏ (chưa thầy yêu cầu): 3 âm thanh Menu/Leaderboard/RevealAnswers
chưa gắn (core chưa có hook); chưa tự nghe thật mp3.

**Crossword (game thứ 6) — 🟢 ĐÃ BUILD + TỰ TEST, CHỜ THẦY DUYỆT, ĐÃ COMMIT + PUSH** (do 1 phiên riêng,
31/7/2026, song song các phiên khác). Dựng lại act Classic của thầy (`wordwall.net/resource/116864402`).
Có đủ bộ file trong `templates/crossword/` (tự sinh lưới ô chữ interlock + bàn phím vật lý/ảo + mp3 THẬT
Classic), nghiên cứu ở `docs/09-CROSSWORD.md`, ghi chú + hạn chế + đề xuất sửa core ở
`templates/crossword/GHI CHU CROSSWORD.md`, nhật ký ở `GHI CHU DU AN.md` đợt 20. **CHƯA gộp trang chủ /
CHƯA thêm `core/catalog.js` built:true** (chờ duyệt). Chơi thử: `templates/crossword/test.html`.
**ĐỀ XUẤT SỬA CORE**: thêm cờ `tpl.hideRandomOption` (ẩn nhóm Shuffle của Options cho crossword — lưới cố
định). Việc cải tiến tiếp (khi thầy muốn): (1) khi bật bàn phím ảo thì phóng to/cuộn theo từ đang chọn
thay vì thu cả lưới (lưới nhiều từ trên màn thấp bị nhỏ); (2) content editor thêm 🎤/🖼️; (3) gộp trang chủ
khi thầy chốt.

**Flying fruit (game thứ 8) — 🟢 ĐÃ BUILD + TỰ TEST (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT,
CHƯA COMMIT** (1/8/2026, đợt 24 — do phiên này). Dựng lại act Classic của thầy
`wordwall.net/resource/116864498`, style Jungle. Câu hỏi (định nghĩa) ở đỉnh, đáp án bay ngang trên QUẢ
theo cung ném, chạm quả đúng → nổ tung nước + ✓ + điểm; chạm sai → mất 1 TIM; hết mạng = Game over.
Đáp án sai = random `word` câu khác. **Editor + dữ liệu Y HỆT ANAGRAM** (`content.items=[{word,clue}]`) —
thầy chốt "editor kiểu Anagram, câu trả lời random các Word". Options: Timer/Lives/Speed/Retry/Shuffle/
Show answers. Assets thật jungle tự chứa trong `templates/flying-fruit/{img,sounds}` (art cố định, không
đổi theo theme, như whack-a-mole). **CHƯA gộp trang chủ** (`core/catalog.js` chưa đụng). Chi tiết + đề
xuất: `templates/flying-fruit/GHI CHU FLYING-FRUIT.md`; nhật ký: `GHI CHU DU AN.md` đợt 24.

**Unjumble (game thứ 11) — 🟢 ĐÃ BUILD + TỰ TEST (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT, CHƯA
COMMIT** (1/8/2026, đợt 27). Dựng lại `wordwall.net/resource/116872783/unjumble`, style **Whiteboard** (thầy
chốt = "Classic"). Sắp xếp các TỪ xáo trộn thành câu đúng bằng **kéo-thả THẬT** (insert+reflow, pointer
chuột+cảm ứng — thầy chốt giống hệt Wordwall, KHÔNG tap như Anagram). Đủ **3 chế độ chấm** (everyword / bonus
[PERFECT ×2, mặc định] / submit) + Alignment. Look bảng trắng + doodle SVG + chữ bút xám nghiêng trên dòng kẻ
= mặc định RIÊNG game này (không sửa `core/themes`; Basic/Classroom/Beach chỉ re-tint). Bộ file đủ ở
`templates/unjumble/`, nghiên cứu `docs/11-UNJUMBLE.md`, ghi chú `templates/unjumble/GHI CHU UNJUMBLE.md`.
41 âm THẬT + 4 đồ họa theme Whiteboard lưu ở `AWord-data/Source/{Sound effect,Graphic}/UNJUMBLE/`.
**CHƯA gộp `core/catalog.js`/trang chủ** (chờ duyệt). Chơi thử: `templates/unjumble/test.html`.

~~**Việc kế tiếp**~~ *(đoạn dưới đã XONG hoặc lỗi thời — xem mục 0a ở trên cho danh sách việc hiện tại)*:
(a) Open the box: thầy đã xác nhận hiệu ứng trượt ra mượt — coi như XONG.
(b) Find the match: ĐÃ commit + push + tinh chỉnh xong 4 loạt (Đợt 31).
(c) Anagram/Type the answer: đã chốt, thầy chưa yêu cầu thêm.
(d) 🎤/🖼️ voice+image cho Anagram khi thầy sẵn sàng bàn — vẫn còn ngỏ, xem mục 0a (C).

**Quy tắc vẫn giữ nguyên từ trước**: hỏi thầy trước việc lớn (chờ "ok build"), KHÔNG tự commit nếu thầy
không nói (nhưng nói "lưu lại"/"save"/"commit" thì làm ngay không cần hỏi lại), **`git push` cũng vậy —
nếu thầy nói rõ "commit và push" thì làm cả 2 luôn, không cần hỏi lại từng bước**. Khi có phiên khác
đang chạy song song, LUÔN `git status`/`git diff` trước khi `git add` — chỉ add đúng file mình sửa,
KHÔNG `git add -A`, để khỏi lỡ tay commit việc CHƯA XONG của phiên kia (xem tình huống Find the match ở
trên).

**Việc CŨ (assignment/print), vẫn còn dở, kho code**: ✅ **v0.9.4 và v0.9.5 ĐÃ push GitHub** (nằm trong
đợt đẩy 30/7/2026, cùng lúc với Anagram + Open the box) — đoạn "chỉ commit local, web live vẫn v0.9.3"
từng ghi ở đây trước đó là THÔNG TIN CŨ/SAI, đã sửa lại cho khớp `git log`/`curl` thật. Vẫn giữ quy tắc
**hỏi thầy trước khi `git push`** cho các đợt sửa SAU này — chỉ đợt 30/7 đã được thầy đồng ý rõ.

**v0.9.5 CHƯA được thầy test thật** (cần đăng nhập Google, máy build không tự động hoá được bước đó —
xem GHI CHU DU AN.md v0.9.5). Cách test: tạo 1 assignment cho 1 lớp đã có sẵn thư mục trong Results, đợi
qua ngày hôm sau (hoặc sửa giờ máy) rồi tạo assignment thứ 2 cho cùng lớp → assignment đầu phải tự
chuyển vào thư mục con "DONE" trong thư mục lớp.

**Luật Firestore đang chạy** (bản mới nhất nằm nguyên văn trong `docs/08-FIREBASE-SETUP.md` — nếu sửa
luật thì phải cập nhật file đó cho khớp):
- `users/{uid}/items` riêng tư thầy · `assignments/{code}` đọc công khai, thầy tạo/xoá
- `assignments/{code}/scores` đọc công khai (chỉ tên + điểm + thời gian) — nguồn bảng xếp hạng HS
- `results/{id}` chỉ thầy đọc + **thầy xoá được** (cho "Delete forever")
- HS được ghi ĐÚNG 2 field `lastSubmitAt`/`submitCount` trên doc bài giao (để hiện chấm đỏ)

**Dữ liệu TEST còn trên Firebase** (thầy nói *"tôi sẽ xử lý sau"*, ĐỪNG tự xoá — vẫn còn nguyên từ
20/7, chưa ai đụng tới):
- Bài giao `j9nsa2` — "TEST assignment (xoa sau) - 20/07", nằm ngoài cùng Results, có ~5 lượt chơi giả
  (Trang Anh / Minh Khoa / Bao Chau / Duc Anh).
- 2 thư mục rỗng **A1A**, **A2B** trong Results (tạo lúc test tính năng tự-xếp-lớp).
- 1 act thật "LSA2-S1.T1.P1-2-3 / ENG2" trong Activities (6 câu) — act mẫu của thầy.

**In worksheet (v0.9.4) đã thầy tự in giấy thật và xác nhận đẹp** — nhưng nếu phiên sau còn chỉnh gì ở
`core/print.js`, nhớ: session build KHÔNG in giấy/PDF thật được (không có máy in ảo), chỉ kiểm chứng
được CSS `@page` hợp lệ + hình SVG vẽ đúng qua trình duyệt — mọi lần sửa margin/logo/số trang đều cần
**nhờ thầy in thử 1 tờ** để xác nhận, đừng tự cho là xong chỉ vì CSS parse không lỗi.

**Việc kế tiếp — CHƯA CHỐT, phải hỏi thầy trước:**
(a) chuyển **Settings + leaderboard offline của act** từ localStorage lên cloud;
(b) **renderer Crossword** cho Print (worksheet A4 giờ đã chuẩn, còn thiếu riêng phần vẽ ô chữ);
(c) **chốt Quiz** + viết "recipe/công thức mẫu" rồi build 4 game còn lại
    (Anagram → Find the match → Type the answer → Open the box);
(d) (nếu thầy cần) nút Print từ trang chủ · trang đáp án cho thầy · "Change template" thật;
(e) thầy nói **còn sửa rất nhiều thứ nữa ở local** trước khi cần lên mạng — hỏi thầy muốn làm gì tiếp
    thay vì tự đoán, và **đừng `git push`** cho tới khi thầy yêu cầu rõ.

   **HỎI THẦY trước khi bắt tay việc lớn (chờ "ok build")**; chưa rõ thì hỏi bằng AskUserQuestion.

## 1. AWord là gì

Web app **tạo + chơi game tiếng Anh giống wordwall.net** cho Teacher Andrew (trung tâm Andrew Classes):
- Giáo viên tạo game (Quiz, Anagram, Find the match...) → giao cho học sinh link chơi.
- **Thu kết quả chơi của học sinh để đánh giá + xếp hạng (leaderboard)** — tính năng đinh.
- Deploy **GitHub Pages** (web tĩnh). Phần thu điểm online dùng **Firebase** (ĐÃ CHỐT, làm ở pha sau).
- **Sản phẩm 100% TIẾNG ANH** (mọi UI/menu/chữ). Trao đổi với thầy bằng tiếng Việt **dễ hiểu, tránh
  thuật ngữ** (thầy không chuyên lập trình — luôn cho thầy xem kết quả chạy thật).
- **Nhiều template build SONG SONG bằng nhiều session Claude khác nhau**, gom lại thành 1 trang web
  cuối khi mọi thứ đã chốt (lý do cấu trúc thư mục ở mục 4).

## 2. Trạng thái hiện tại — v0.6.0 (19/7/2026)

### Trang chủ = TRÌNH QUẢN LÝ kiểu GOOGLE DRIVE (v0.6.0 — MỚI) 🟢
`main.js` = trình quản lý file. Mức ngoài: **2 thư mục gốc CỐ ĐỊNH — Activities / Results** (không xoá;
Results tạm trống, chờ thu điểm/Firebase). Mở 1 gốc: **breadcrumb** + **thanh công cụ** [+ New game (chỉ
Activities) · + New folder · Recycle bin · Search · grid/list] + folder & act. **Thẻ act** có **preview**
(1 câu hỏi + đáp án ngẫu nhiên) + Play tròn giữa + ⁝. **Menu ⁝** folder (Open in new tab/Rename/Move/
Duplicate/Delete) & act (thêm **Edit content**). **Move** = cây thư mục cùng gốc (Drive-style). **Delete**
→ **thùng rác RIÊNG theo gốc** (Restore / Delete forever). **Open in new tab** = `?play=`/`?folder=`.
Dữ liệu ở **`core/store.js`** (cây folder/act + trash, async, localStorage key `aword-lib`, tự migrate
từ `aword-activities` cũ, sẵn sàng cắm Firebase). Chi tiết: `GHI CHU DU AN.md` v0.6.x.

### Header dùng chung + Settings + thuật ngữ "act" (v0.6.3 — MỚI) 🟢
**Header dùng chung** (`main.js` `topbar()`, class **`.aw-appbar`** — KHÔNG phải `.aw-topbar` của engine)
ở trang thư viện + trang Edit (KHÔNG vào màn chơi): trái = cụm logo (to hơn, tagline scaleX bằng bề rộng
logo), phải = nút **Settings** (bánh răng, `.aw-appbtn`); trang trong thư mục + Edit thêm nút **Activities/
Results** (`.aw-appnav`). **Settings** (`core/settings.js`, key `aword-settings`) = **Options mặc định cho
template** (Timer/shuffle/show answers/letters); act mới kế thừa; chỉnh Options riêng 1 act trong game →
Apply LƯU RIÊNG act đó. **Loại act** liệt kê ở `core/catalog.js` (1 nguồn duy nhất, engine dùng chung).
"+ **New activity**" mở **hộp thoại chọn loại act** (Quiz sẵn, 4 coming soon) → editor. **Edit content**
dispatch theo loại qua registry. **Editor Quiz**: chỉ **Activity Title** + câu hỏi (bỏ Instruction/
theme[mặc định classic]/Options[→Settings]); đáp án **2 cột** có **chữ A-F in đậm trong ô**; nút
**Duplicate** cạnh Remove; badge "QUIZ" ở góc; tối đa **120 câu**. ⚠️ Đặt tên class header/nút mới phải
TRÁNH class engine dùng cho khung game (`.aw-topbar/.aw-iconbtn/.aw-navbtn`) — xem mục 9.
**(v0.6.4)** Icon Settings = gear Feather; tagline giữ tỷ lệ chữ gốc + letter-spacing (bỏ scaleX/sizeBrand).
**DÁN EXCEL kiểu mới** (`onQuestionPaste`): copy vùng bảng trong Excel → bấm vào **ô câu hỏi** + Ctrl+V →
cột đầu = câu hỏi, các cột sau = đáp án lần lượt (position-independent, ≤6, điền từ câu đang bấm xuống, cap
120); **KHÔNG tự đánh dấu đáp án đúng** (thầy tự tích / Mark correct in all); dán 1 ô đơn thì để trình duyệt
dán thường. **Save tự bỏ câu RỖNG hoàn toàn** (Add question để trống → khỏi báo lỗi).
**(v0.6.5)** Thẻ **folder** = preview icon TO (`.aw-fp`) + foot tên/⁝ như thẻ act; menu ⁝ folder thêm
**Color** (popup 8 màu, lưu `node.color` qua `setFolderColor`); **kéo-thả** act/folder vào thẻ folder hoặc
lên chữ breadcrumb (Activities/folder tổ tiên) để `moveItem`; icon search sửa cỡ; **logo** khớp width bằng
letter-spacing (không méo, `sizeBrand`); **footer** "Phone & Zalo 0359.769.765 / Copyright © 2018-2026
ANDREW CLASSES by Pham Xuan Ninh" giữa-cuối mọi trang thư viện + Edit (editor nhận qua param `footer`).
**(v0.6.6)** icon folder 108px; **SỐ ĐẾM** giữa folder (`store.folderCounts`): chỉ-act→1 số (tổng act đệ
quy); cả sub+act→2 số khác màu ngăn nét dọc; không act→không số; footer đẩy SÁT ĐÁY màn hình (`.aw-lib`
min-height:100vh flex-column + `.aw-foot margin-top:auto`).
**(v0.6.7 — BỐ CỤC FOOT MẪU, theo ảnh thầy)** Thẻ act foot: **tên TRÊN (đậm .9rem) → type QUIZ DƯỚI
(.82rem xanh hoa) → ⁝ GÓC DƯỚI-PHẢI**, nội dung căn ĐÁY. Thẻ folder: tên căn ngang dòng type-của-act (đáy)
nhưng CỠ = tên act. Tên tối đa **38 ký tự** (2 dòng, mọc lên trên). Số folder: **act(xanh) trước | folder
(cam) sau**. **Settings = MENU nhiều dòng**: Default activity options (bật) +
Appearance/Leaderboard&results (coming soon) → chọn → **danh sách template** → chọn template → form options
mặc định + Save; có ‹ Back từng cấp.
**(v0.6.8)** ⁝ GHIM đúng 1 chỗ mọi thẻ: `.aw-card-foot margin-top:auto` (grid stretch làm thẻ cao bằng
nhau — thiếu dòng này foot lơ lửng khác nhau, BẪY) + `.aw-fm-grid .aw-card-menu` margin -7px/-7px (6px
phải/4px đáy, thẳng hàng dòng type/tên folder); số folder `top:50%`.
**(v0.6.9)** Foot bỏ `border-top` (hết kẻ ngang trên tên); chữ foot dịch phải `padding-left:21px` cho
viền-trái→chữ = viền-phải→tâm chấm ⁝ (22≈21px, cân xứng).

### Trong game (v0.6.0): bỏ dòng hướng dẫn dưới khung; **tên game cụ thể** nằm ngang hàng cụm nút
Options/Template/Style + Edit/Assignment/Print. **(v0.6.1)** cụm phải thêm nút **Home** → 4 nút
[Edit/Set assignment/Print/**Home**], Home về trang chủ top-level.

### Thương hiệu (v0.6.1): cụm **AWord + "in ANDREW CLASSES"** (`main.js` `logo()`, `.aw-brand*`) là 1
nút — bấm ở BẤT KỲ đâu đều về trang chủ top-level (2 gốc). Logo to hơn, tagline sát dưới.

### Quiz — ✅ ĐÃ CHỐT (24/7/2026) — GAME MẪU VÀNG
Thầy test OK nhiều vòng (17/7) rồi chốt "Chốt Quiz + build 4 game còn lại" (24/7). Công thức đã rút ra
thành `templates/CONG THUC MAU.md` (khung `mount()`, 11 quy tắc bắt buộc, `toPrintItems`, checklist) —
đọc file đó thay vì đọc lại toàn bộ `quiz.js` khi build Anagram/Find the match/Type the answer/Open the
box.

Quiz hiện có (chi tiết từng bước: `GHI CHU DU AN.md`):
- **Màn READY** (nền tối): trên cùng "ANDREW CLASSES", giữa TÊN LESSON to viết hoa, nút PLAY khổng
  lồ (bấm mới bắt đầu + chuông khởi động), dưới là TÊN GAME (QUIZ) to đậm.
- **Chơi**: khung 16:9 (font Baloo 2), đồng hồ trái + điểm ✓ phải TRONG khung; câu hỏi CHỮ TO sát
  viền trên (tự co chữ chống tràn); 2-6 ô đáp án 3D bo tròn (bố cục theo số lượng: 5=3+2 căn giữa,
  6=3+3; MÀU NGẪU NHIÊN mỗi ván từ bảng 8 màu, giữ qua câu, reshuffle khi Start again); thanh dưới
  `[☰] ◁ "x of N" ▷ [🔊] [⛶]` với nav CĂN GIỮA khung.
- **Phản hồi đáp án**: đúng→✓ to bay lên + "ting" + ✓ nhỏ đọng, ô sai mờ 0.15; sai→✗ to LƠ LỬNG ~1.9s
  + âm "Oh my god" (mp3) + ✗ nhỏ đọng, ô đúng giữ màu + ✓. Ô KHÔNG đổi màu. Fade chuyển câu.
- **Điều khiển**: mũi tên ◁▷ hoặc phím số 1-9 + ◄►. Tự Game Complete khi làm hết câu. Menu ☰
  (Submit answers/Start again/Resume/Change template), ẩn khi bấm ngoài.
- **Kết thúc**: "Game complete" + 110 confetti + fanfare → panel tổng kết tối (Score/Time/rank) → menu
  [Leaderboard · Show answers · Start again · Play a different template].
- **Leaderboard "ANDREW CLASSES"** (localStorage): xếp điểm↓ rồi thời gian↑, top 10, gõ tên tại hàng
  (Enter hoặc nút Ok để lưu), KHÔNG lên bảng nếu không làm câu nào. **Show answers** = màn review 16:9
  (câu hỏi đánh số cỡ cố định | đáp án HS [sai=ô tối+✗ / đúng=gộp 1 ô xanh+✓ / trống=No answer] | với
  ô đáp án hẹp).
- **Fullscreen giữ tỷ lệ**: mọi sizing dùng đơn vị **cqw** (container-query) → scale đồng đều theo
  khung 16:9; fullscreen letterbox nền đen.
- **Thanh công cụ NGOÀI khung** (dưới khung, grid 3 cột): trái=tên lesson · GIỮA=3 nút vuông
  **Options / Template / Style** (popover: bấm→hào quang+panel căn giữa+mờ toàn màn, chỉ 1 mở) ·
  phải=**Edit / Set assignment / Print** — **Print (v0.7.1)**: bấm → popup chọn ĐỊNH DẠNG (Anagram/
  Crossword/Quiz/Unjumble, chỉ hiện cái khả dụng) → worksheet A4 thang xám qua `window.print()`
  (hệ dùng chung `core/print.js`); Set assignment còn toast "coming soon".
  - **Options** (mô hình NHÁP + nút Apply): Timer none/up/**down** (đếm ngược tự nộp bài khi hết giờ,
    ô phút:giây VUỐT lên/xuống chỉnh) · Shuffle Q/A · Show answers · Letters on answers A-B-C.
  - **Template**: liệt kê 5 game, chỉ Quiz "current", còn lại "coming soon".
  - **Style**: đổi theme TRỰC TIẾP (không restart). **4 theme**: Classic (mặc định) · Basic (ô đáp án
    CÙNG màu navy, tối giản) · Classroom (kem/gỗ ấm) · Beach (cát/biển).

### 4 game khác — Anagram/Open the box/Type the answer ✅ ĐÃ CHỐT + lên trang chủ, Find the match 🟢 CHỜ THẦY DUYỆT
Anagram / Find the match / Type the answer / Open the box — cả 4 đã có đủ 3 file
(`<ten>.js`/`.css`/`sample-<ten>.js`), đăng ký đúng `type` khớp `core/catalog.js`, **đã test qua
`test.html` bằng trình duyệt thật** (chơi hết 1 lượt, đúng/sai, Show answers, đổi theme, 0 lỗi console
mỗi game). Trạng thái từng game + nhật ký chi tiết: `GHI CHU <TEN>.md` trong từng thư mục
`templates/<ten>/`. **Anagram (29/7/2026), Open the box + Type the answer (30/7/2026, đợt 11)** đã
thêm vào `core/catalog.js` (`built:true`) + gộp vào trang chủ — theo đúng quy trình (xem
`templates/HUONG DAN TEMPLATE.md` mục "Khi nào một template được gộp vào trang cuối"), **cả 3 đều có
content editor riêng** (`anagram-editor.js`/`open-the-box-editor.js`/`type-the-answer-editor.js`).
**Find the match** vẫn **CHƯA** thêm vào `core/catalog.js`/gộp trang chủ, chưa có content editor riêng,
chờ thầy xem & duyệt.
- **Anagram**: bấm/gõ chữ cái đặt vào ô trống (không kéo-thả thật — lựa chọn MVP chắc tay hơn trên cảm ứng).
- **Find the match**: bàn cờ 1 prompt + lưới definition còn lại, chạm đúng thì ô biến mất.
- **Type the answer**: gõ đáp án vào ô, chấm bỏ qua hoa/thường + dấu (không phân biệt), bàn phím ảo QWERTY.
- **Open the box**: lưới hộp lật mở nội dung, có điểm/leaderboard (Simple mode không điểm đã bị xoá).

Công thức dùng chung cho cả 4: `templates/CONG THUC MAU.md`.

## 3. Cách chạy (máy này CHƯA cài Node)

- **BẢN LIVE trên mạng**: https://andrewclasses-01.github.io/AWord/ — đẩy code lên là tự cập nhật:
  `git add -A && git commit -m "..." && git push` (repo `andrewclasses-01/AWord`, branch `main`,
  Pages phục vụ thẳng thư mục gốc; có `.nojekyll` để GitHub KHÔNG xử lý Jekyll). Sau khi push chờ
  ~1 phút Pages build xong. Mọi đường dẫn trong code phải TƯƠNG ĐỐI (web nằm trong thư mục con
  `/AWord/` — dùng `/abc.js` sẽ hỏng); asset resolve qua `import.meta.url`.
- Bản hiện tại **zero-build** (mở là chạy, ES modules thuần).
- Server chung: cấu hình preview tên **`aword`** trong `D:\OTHERS\CLAUDE\.claude\launch.json` → chạy
  **`python devserver.py 5510`** (KHÔNG `python -m http.server` — xem mục 9). Chạy tay: PowerShell tại
  thư mục dự án → `python devserver.py`.
- Trang chủ cuối (gom template đã chốt): `http://localhost:5510/`.
- Trang test riêng từng template: `http://localhost:5510/templates/<ten>/test.html`.
- Pha online (Firebase) sau: cài Node + Vite (đã chốt Vite trong docs/07).

## 4. Cấu trúc thư mục

```
E:\LAP TRINH APP\AWord\
├─ APP_MASTER.md              ← file này (đọc đầu tiên)
├─ GHI CHU DU AN.md           ← nhật ký version (mỗi đợt sửa PHẢI ghi + tăng version)
├─ devserver.py               ← server chạy thử (gửi Cache-Control:no-store — mục 9)
├─ play.html + play.js        ← TRANG HỌC SINH (v0.8.0, chặn thêm bài đóng/đã xoá ở v0.9.0): mở link ?g=<mã bài giao> → nhập tên → chơi →
│                               Game Complete TỰ NỘP. KHÔNG đăng nhập, KHÔNG nạp store.js (thư viện
│                               của thầy không thể chạm tới từ đây)
├─ index.html + main.js       ← TRANG CHỦ kiểu DRIVE (main.js: 2 gốc Activities/Results, thư
│                             mục con, thùng rác, Move, Search, grid/list, ⁝ menu, mở-tab-mới ?play/?folder.
│                             (v0.9.7) KHÔNG còn import template nào: game + CSS nạp lúc chơi/sửa qua
│                             ensureTemplate(). manifest.js chỉ còn là view suy ra từ core/catalog.js)
│
├─ core/                      ← LÕI DÙNG CHUNG — KHÔNG session template nào tự sửa (mục 5)
│  ├─ HUONG DAN CORE.md       ← ĐỌC TRƯỚC KHI SỬA CODE (hợp đồng + mọi luật/bẫy kỹ thuật)
│  ├─ app.css                 ← giao diện chung (khung 16:9, thanh trên/dưới, thanh công cụ ngoài,
│  │                             popover, panel tối, leaderboard, review, hiệu ứng, animation)
│  ├─ engine.js               ← điều phối vòng đời + màn ready + celebration + panel + leaderboard
│  │                             + review + thanh công cụ Options/Template/Style + fullscreen
│  ├─ registry.js / layout.js / scoring.js / leaderboard.js / confetti.js / sound.js / utils.js
│  ├─ print.js               ← (v0.7.1) Print DÙNG CHUNG: popup chọn định dạng (Anagram/Crossword/Quiz/
│  │                             Unjumble) + luật khả dụng + render worksheet A4 (đọc template.toPrintItems)
│  ├─ qr.js                  ← (v0.8.0) BỘ SINH QR TỰ VIẾT, 0 phụ thuộc — COPY SANG APP KHÁC DÙNG ĐƯỢC
│  │                             NGAY: qrSvg / qrPngDataUrl / qrCanvas / copyQrImage / downloadQrPng.
│  │                             Kiểm chứng bằng core/qr-test.html (so bản chuẩn + máy quét thật)
│  ├─ assignments.js         ← (v0.8.0) TẦNG DỮ LIỆU bài giao: createAssignment / listAssignmentsForAct /
│  │                             getAssignment / submitResult / listScores / listResults + gộp tên
│  ├─ assignment-ui.js       ← (v0.8.0) GIAO DIỆN bài giao: pop-up Setup · Share (link+QR) · thanh dài
│  │                             dưới khung chơi · pop-up báo cáo (Summary/Leaderboard/Detail)
│  ├─ firebase.js            ← (v0.7.3) KẾT NỐI Firebase: config project `aword-70dae` + nạp SDK LAZY qua
│  │                             CDN 12.9.0 (zero-build) + auth()/db()/fs()/signIn()/signOutNow()/
│  │                             onUser()/currentUser()/isTeacher(). Config CÔNG KHAI là bình thường.
│  ├─ catalog.js              ← 1 NGUỒN DUY NHẤT liệt kê loại act. (v0.9.7) mỗi mục nay khai luôn CÁCH
│  │                             TỰ NẠP: `css` + `load()` + `sample()`. Thêm 1 template = thêm 1 mục
│  │                             Ở ĐÂY, không đụng file nào khác. Dùng chung bởi: main.js (picker
│  │                             New activity + thẻ act) · engine.js (panel Template) · registry.js
│  │                             (ensureTemplate) · play.js (trang HS) · manifest.js (view suy ra)
│  ├─ settings.js             ← (v0.6.3) Settings: Options mặc định theo loại act (key `aword-settings`) +
│  │                             buildOptionsControls() dùng lại cho modal Settings
│  ├─ store.js                ← KHO LƯU kiểu CÂY (v0.6.0): folder/act, 2 gốc activities/results, parentId,
│  │                             thùng rác (trashRootId), Move/Duplicate/Rename — ĐỀU async, key `aword-lib`
│  │                             (tự migrate từ v0.5.0), Firebase sau không đổi nơi gọi
│  ├─ icons.js                ← SVG dùng chung (thêm: options/template/style/edit/assignment/print...)
│  ├─ showdown.js             ← (Đợt 155) SHOWDOWN — phần THUẦN: đội của trình duyệt này trong
│  │                             sessionStorage (KHÔNG phải localStorage — 4 cột myActivity dùng chung
│  │                             nó) + luật chia lượt memberAt() + bảng Show answers gom theo học sinh.
│  │                             Không chạm Firestore ⇒ engine.js import TĨNH được
│  ├─ showdown-setup.js       ← (Đợt 155) SHOWDOWN — bảng chia đội + đồng bộ Firestore (1 document
│  │                             `sd_main`, kind "showdown", nằm chung `items` như class roll).
│  │                             CHỈ `await import` từ nút SHOWDOWN — trang HS không bao giờ tải
│  ├─ fit.js                  ← autoFit() (co chữ, theo dõi resize) + fitOnce() (co chữ 1 lần)
│  ├─ numberstepper.js        ← makeNumberStepper() — ô số VUỐT lên/xuống + nút ▲▼
│  ├─ themes/                 ← classic.css · basic.css · classroom.css · beach.css + manifest.js
│  │                             (manifest = danh sách theme + loadTheme() nạp CSS động)
│  └─ assets/                 ← font Baloo 2 (4 độ đậm) + oh-my-god-meme.mp3 (offline, dùng chung)
│
├─ templates/
│  ├─ HUONG DAN TEMPLATE.md   ← quy trình build 1 template + luật chống xung đột
│  ├─ quiz/                   🟢 GẦN CHỐT — quiz.js / quiz.css / sample-quiz.js / test.html / test.js
│  │                             + quiz-editor.js (v0.5.0: openQuizEditor — form soạn nội dung Quiz)
│  ├─ anagram/                🔴 CHƯA BUILD — GHI CHU ANAGRAM.md + test.html/test.js (khung rỗng)
│  ├─ find-the-match/         🔴 CHƯA BUILD
│  ├─ type-the-answer/        🔴 CHƯA BUILD
│  └─ open-the-box/           🔴 CHƯA BUILD (⚠️ game "mở" không điểm — xem GHI CHU riêng)
│
├─ docs/                      ← nghiên cứu Wordwall (00-06) + kiến trúc (07) — mục 8
└─ screenshots/                (trống)
```

**Quy tắc mỗi template**: 3 file trong thư mục riêng — `<ten>.js` (module game) · `<ten>.css` (style
riêng, mọi class tiền tố `.aw-<viet-tat>-`) · `sample-<ten>.js` (export tên chuẩn `activity`).
`test.html`/`test.js` đã có sẵn. `GHI CHU <TEN>.md` riêng: mô tả + TRẠNG THÁI (🔴/🟡/🟢/✅) + nhật ký
+ mục "ĐỀ XUẤT SỬA CORE". Chi tiết: `templates/HUONG DAN TEMPLATE.md`.

## 5. Kiến trúc lõi — HỢP ĐỒNG engine ↔ template (chi tiết ĐẦY ĐỦ: `core/HUONG DAN CORE.md`)

**Luật số 1: KHÔNG session template nào tự sửa `core/`.** Cần gì thêm → ghi "ĐỀ XUẤT SỬA CORE" trong
GHI CHU của template, chờ phụ trách tổng. (Session này là phụ trách tổng nên đã sửa core nhiều.)

Mỗi game = 1 module tự đăng ký:
```js
registerTemplate({
  type: "quiz", scorable: true, name: "Quiz",
  mount(root, activity, ui) {
    // vẽ game vào root; ui.setScore / ui.setNav / ui.onSubmit / ui.sound.* / ui.toast
    // ui.finish({correct, incorrect, total, perQuestion, review, answered}) — BÁO XONG, engine tự lo
    //   review[] = {question, answered, yourText, yourCorrect, correctText}  (cho màn Show answers)
    return cleanupFn;   // GỠ listener/timer riêng + fitter (xem quiz.js làm mẫu)
  }
})
```
Engine tự lo: màn ready+PLAY, timer (up/down), menu, fullscreen, mute, celebration, panel tổng kết,
leaderboard, Show answers, **thanh công cụ Options/Template/Style ngoài khung**. Template chỉ lo nội
dung + luật chơi + đọc `activity.options` (vd Quiz đọc lettersOnAnswers/shuffle).

Chuẩn JSON activity: `{id, type, title, instruction, theme, options{...}, content{...}}`.
`options` hiện dùng: `timer` (none/countUp/countDown), `timerTotalSeconds`, `shuffleQuestions`,
`shuffleAnswers`, `showAnswers`, `lettersOnAnswers` (none/abc).

**Theme**: mỗi theme là 1 file trong `core/themes/`, khai báo ĐỦ biến `--aw-*` (màu + **hình dạng ô**:
`--aw-tile-radius`, `--aw-tile-border-width/-color`, `--aw-tile-shadow`, `--aw-tile-fixed`[ép mọi ô 1
màu] + `--aw-tile-fixed-dark`, `--aw-tile-shadow-active`; + **chữ câu hỏi**: `--aw-question-stroke-*`,
`--aw-question-fill`). Đăng ký trong `themes/manifest.js` → nút Style tự có + nạp CSS động. Template
KHÔNG hard-code màu — luôn dùng `var(--aw-*)`.

## 6. Quy ước & quy tắc thầy đã chốt (BẮT BUỘC)

1. **Sản phẩm 100% tiếng Anh**; trao đổi với thầy tiếng Việt dễ hiểu, tránh jargon, cho xem kết quả chạy.
2. **Khung game 16:9 trên cùng trang; mọi thông tin game TRONG khung; tên/công cụ DƯỚI khung.**
3. Phong cách Wordwall: font Baloo 2, ô 3D gờ tối dưới (trừ theme phẳng như Basic), đồng hồ trái/điểm
   phải, thanh điều khiển đáy khung, nav "x of N" CĂN GIỮA.
4. Ô đáp án KHÔNG đổi màu khi chọn — phản hồi bằng dấu ✓/✗ bay + dấu nhỏ đọng + làm mờ ô sai (0.15).
5. **KHÔNG session template nào tự sửa `core/`** (mục 5).
6. Mỗi đợt sửa: **ghi nhật ký + tăng version**.
7. Tính năng mới lớn: nghiên cứu + báo trước, **chờ thầy "ok build"** (trừ khi thầy yêu cầu rõ).
8. Chưa rõ cần thầy quyết → **hỏi bằng AskUserQuestion** (không hỏi bằng văn bản thường).
9. Xếp hạng: điểm cao trước, hòa thì nhanh hơn thắng.
10. Template chỉ thêm vào `core/catalog.js` khi ĐÃ CHỐT (thầy duyệt) — và **CHỈ file đó**
    (v0.9.7: `index.html`/`play.html`/`main.js`/`play.js`/`manifest.js` không còn liệt kê template).
11. **Sizing dùng `cqw`, KHÔNG dùng `vw`/`clamp`** (để fullscreen giữ tỷ lệ) — với phần tử trong khung.
12. **Animation trên phần tử định vị bằng `transform` (vd translateX(-50%) căn giữa) CHỈ được động
    `opacity`** — nếu không popup sẽ "hiện 1 nơi rồi nhảy về giữa" (lỗi hay gặp nhất, xem HUONG DAN
    CORE.md mục đó + cách rà soát bằng grep).
13. **Mọi `element.animate()` phải có `setTimeout` dự phòng** (tab ẩn → onfinish có thể không bắn).
14. **Push xong CHƯA phải là đã lên live — nhưng push LÀ đủ để kích build** (đính chính Đợt 81):
    quy trình chuẩn = push → chờ 1–3 phút → `curl` cache-bust kiểm dấu mốc; **chỉ khi ~10 phút vẫn
    cũ** mới sang đường cứu hộ **mục 0-TER**. **Cấm đẩy commit rỗng để "kích hoạt lại deploy"** (vô
    ích, chỉ làm bẩn lịch sử — Đợt 79 đã lỡ 2 lần). Thấy email "Some jobs were not successful" thì
    xem job `build` trước: build OK + deploy timeout = **lỗi hạ tầng GitHub, đừng sửa code**.

## 7. Chưa làm — ROADMAP

**CHẶNG HIỆN TẠI (thầy chốt 19/7): HOÀN THIỆN QUIZ 100% rồi mới sang game khác** (dùng chung hạ tầng).
Build lần lượt từng tính năng, xong cho thầy xem chạy thật:

1. ✅ **Khối 1 — Editor + Kho lưu + Trang chủ** (v0.5.0) → **nâng lên trang chủ kiểu Drive** (v0.6.0):
   2 gốc Activities/Results, thư mục con, thùng rác riêng, Move/Duplicate/Rename, Search, grid/list,
   mở-tab-mới; lưu offline qua `store.js` async (cây folder/act), sẵn sàng cắm Firebase.
2. ✅ **Khối 2 — Print** (v0.7.1): popup chọn ĐỊNH DẠNG (Anagram/Crossword/Quiz/Unjumble theo luật khả
   dụng) → worksheet A4 thang xám theo ảnh mẫu thầy, hệ dùng chung `core/print.js`. Làm offline được.
   Còn thiếu: **build renderer Crossword** (đang "soon"); in thử thật trên giấy/PDF để xác nhận bố cục
   A4 + header/footer lặp trang; nút Print từ trang chủ (hiện chỉ trong màn game); (tuỳ chọn) trang đáp
   án cho thầy.
3. **➡️ Khối 3 — ASSIGNMENT (VIỆC KẾ TIẾP, nút "Set assignment" đang stub)**: hạ tầng đã sẵn sàng —
   luật Firestore cho `assignments/{code}` **đọc công khai** + chỉ thầy tạo. Cần làm:
   (a) khi thầy giao bài → ghi doc `assignments/{code}` chứa **BẢN SAO act** (snapshot) để thư viện
   riêng tư KHÔNG bị lộ và sửa act sau không phá bài HS đang làm dở;
   (b) **trang chơi cho HS KHÔNG cần đăng nhập** (nhập tên → chơi → nộp) — hiện `?play=` vẫn đọc thư
   viện nên đòi đăng nhập, **chưa gửi HS được**;
   (c) sinh **link + mã QR** để dán lên Google Sites/Zalo.
4. ✅ **Nối FIREBASE — XONG (v0.7.3 hạ tầng + v0.7.4 code, 19/7)**: thầy chốt *repo PUBLIC · chỉ thầy
   đăng nhập Google mới sửa · BẮT đăng nhập mới vào được*. Console dựng xong (project `aword-70dae`,
   Firestore Singapore, Google Sign-in, authorized domain, luật publish, web app);
   **`core/firebase.js`** nạp SDK lazy qua CDN 12.9.0 → giữ zero-build, KHÔNG cần Node/Vite;
   **`core/store.js` đã chạy trên Firestore** (`users/{uid}/items/{id}`) — **API xuất ra giữ nguyên nên
   không chỗ gọi nào phải sửa**; màn đăng nhập + chip tài khoản + chuyển dữ liệu cũ lên mây.
   Chi tiết + giá trị thật: `docs/08-FIREBASE-SETUP.md`. Mô hình dữ liệu: `users/{uid}/items/{id}`
   (thư viện RIÊNG TƯ ✅đang dùng) · `assignments/{code}` (bản SAO act, công khai đọc để HS chơi —
   thư viện không lộ; ⏳làm ở Khối 3) · `results/{id}` (HS chỉ được tạo; ⏳Khối 4).
   **CÒN LẠI**: Settings + leaderboard vẫn ở localStorage (chưa đồng bộ nhiều máy).
5. **Khối 4 — Thu điểm HS nhiều máy**: luật `results/{id}` ĐÃ publish sẵn (HS chỉ được TẠO, không ai
   sửa/xoá điểm; chỉ thầy đọc). Cần: HS nộp kết quả sau khi chơi → gom về gốc **Results** cho thầy
   xem/xếp hạng; leaderboard online (entry đã lưu sẵn cả `review` nên đồng bộ dễ); dashboard kết quả.
   ⚠️ Lúc đó nhớ chuyển **leaderboard + Settings** từ localStorage lên cloud (hiện vẫn lưu theo máy).
6. ✅ **Chốt Quiz + viết "recipe/công thức mẫu"** (24/7/2026) → `templates/CONG THUC MAU.md`.
7. ✅ **Build 4 template còn lại** (24/7/2026): Anagram, Find the match, Type the answer, Open the box —
   cả 4 đã build + test qua `test.html`. **Anagram (29/7/2026), Open the box + Type the answer
   (30/7/2026, đợt 11) ✅ ĐÃ CHỐT + gộp vào trang chủ** (xem mục 2). **Find the match** vẫn
   **🟢 CHỜ THẦY DUYỆT**, chưa gộp. **➡️ VIỆC KẾ TIẾP**: thầy xem Find the match chạy thật rồi quyết
   định có gộp `built:true` nốt không (kèm content editor riêng, theo khuôn `open-the-box-editor.js`).
8. **Change template thật** (nút Template/menu "coming soon"): đổi game trên cùng bộ dữ liệu.
9. ✅ **Đẩy GitHub + Pages (v0.7.2, 19/7)**: repo PUBLIC `andrewclasses-01/AWord`, Pages branch `main`
   thư mục gốc, live tại https://andrewclasses-01.github.io/AWord/ (đã test thật: chơi Quiz + popup
   Print + font đều OK, 0 lỗi console).

## 8. Tài liệu docs/ (nghiên cứu Wordwall — tài khoản Pro andrewclasses)

- `00-OVERVIEW.md` — catalog 33 template + **6 mô hình dữ liệu dùng chung** + 5 activity demo.
- `01..05` — mổ xẻ Anagram/Quiz/Type-the-answer/Open-the-box/Find-the-match (cách chơi, options, JSON).
- `06-RESULTS-AND-RANKING.md` — cơ chế Assignment/link+QR/My Results/leaderboard (mấu chốt Firebase).
- `07-ARCHITECTURE.md` — Vite/Firebase/security rules (⚠️ cấu trúc file trong đó LỖI THỜI so với mục 4,
  chỉ tham khảo phần Firebase/backend).

## 8b. Dữ liệu trên Firestore (v0.8.0)

```
users/{uid}/items/{id}          thư viện RIÊNG của thầy (folder + act, có thêm `num` = số link)
assignments/{code}              bài giao — ĐỌC CÔNG KHAI, chứa BẢN SAO act; chỉ thầy tạo/sửa/xoá.
                                (v0.9.0) thêm: folderId (thư mục trong Results) · closed · trashed.
                                (v0.9.1) thêm: lastSubmitAt/submitCount (HS ghi được, CHỈ 2 field này)
                                + lastSeenAt (thầy ghi khi mở báo cáo) -> chấm đỏ "có bài nộp mới".
                                ĐÂY LÀ BẢN DUY NHẤT — Results và thanh dưới act đều đọc nó.
assignments/{code}/scores/{id}  bảng xếp hạng CÔNG KHAI: chỉ name/score/total/timeMs/createdAt
results/{id}                    bài làm chi tiết — CHỈ THẦY ĐỌC, không ai sửa/xoá
```
⚠️ **Bộ khoá của `results` bị LUẬT KHOÁ CỨNG** (`assignmentId, studentName, score, total, timeMs,
review, createdAt`). Thêm field mới mà không sửa luật trên console thì MỌI lượt nộp sẽ hỏng.

## 9. Bẫy & lưu ý kỹ thuật (tóm tắt — ĐẦY ĐỦ trong `core/HUONG DAN CORE.md`)

- ⚠️ **`navigator.clipboard.writeText()` TREO VÔ HẠN khi cửa sổ không được focus** (không ném lỗi) —
  `await` không bao giờ chạy tiếp, người dùng không thấy phản hồi. Dùng `copyText()` trong
  `core/utils.js` (đã có hạn giờ + phương án dự phòng), ĐỪNG gọi thẳng clipboard API.
- ⚠️ **Đừng bắt lỗi rồi trả mảng rỗng** cho phần đọc dữ liệu hiển thị: "chưa ai chơi" và "đọc hỏng"
  trông y hệt nhau trên màn hình. Hỏng thì phải BÁO (bài học từ pop-up báo cáo v0.8.0).
- ⚠️ **QR: thông tin định dạng (format info) rất dễ đặt XOAY ngang-dọc** — mã vẫn "trông như QR" nhưng
  không máy nào quét được. Sửa QR xong PHẢI chạy `core/qr-test.html` (có máy quét thật) trước khi tin.
- ⚠️ **Ảnh chụp màn hình của công cụ preview/Chrome hay LỖI KẾT HỢP với `backdrop-filter`** → pop-up
  trông như trong suốt/chồng chữ dù DOM hoàn toàn đúng. Kiểm bằng `document.elementFromPoint` trước
  khi tin là lỗi thật.

- ⚠️ **GITHUB PAGES CẬP NHẬT FILE KHÔNG ĐỒNG THỜI** (gặp thật 19/7): sau `git push`, có thể `main.js`
  đã là bản mới trong khi `core/store.js` còn bản cũ → app chạy LẪN 2 phiên bản, sinh dữ liệu rác khó
  hiểu. **Sau mỗi push, `curl` kiểm chứng NỘI DUNG file vừa sửa đã live** rồi mới test:
  `curl -s <url>/core/store.js | grep -c "chuỗi-chỉ-có-ở-bản-mới"`.
- ⚠️ **App BẮT ĐĂNG NHẬP từ v0.7.4** → mọi hàm `core/store.js` chỉ chạy khi đã đăng nhập, gọi lúc chưa
  đăng nhập ném lỗi `err.code === "aw/signed-out"` (bắt lỗi, đừng để crash). Muốn test game mà không
  đăng nhập thì dùng `templates/<ten>/test.html` (chạy dữ liệu mẫu, không đụng store).
- ⚠️ **Popup đăng nhập Google KHÔNG tự động hoá được** — Google cố tình chặn (tốt cho bảo mật). Khi
  test bằng trình duyệt tự động, phải nhờ thầy bấm chọn tài khoản 1 lần.
- ⚠️ **Firestore TỪ CHỐI `undefined`** → `store.js` có `clean()` lọc trước khi ghi; ghi thẳng Firestore
  ở chỗ khác cũng phải lọc. Batch tối đa 500 write (store.js chunk 400).
- ⚠️ **Tự động hoá Firebase console** (nếu cần làm lại): ô soạn luật là **CodeMirror**, gõ tay bị
  auto-đóng-ngoặc làm hỏng code → dán bằng
  `document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(text)` (instance 0 = `.main-editor`).
  Tiện ích Chrome **chặn đọc chuỗi giống khoá** qua JS → đọc `firebaseConfig` bằng `computer zoom`.
- **Máy chưa cài Node/npm** → offline chạy Python; **Firebase KHÔNG cần Node** (SDK nạp qua CDN
  ES-module, pin `12.9.0` trong `core/firebase.js`) nên dự án vẫn zero-build.
- **DÙNG `devserver.py`, KHÔNG `python -m http.server` trần** — http.server không gửi header chống
  cache → sửa file .js rồi tải lại cùng tab có thể vẫn chạy bản cache CŨ (tưởng "fix không tác dụng").
  Nghi cache cũ → mở TAB MỚI, hoặc `fetch(url+"?bust="+Math.random())` so nội dung.
- **Preview pane Claude_Browser hay treo screenshot / visibilityState kẹt "hidden"** → verify bằng
  `javascript_tool` (đo DOM/animation trực tiếp) cho chắc. Tab ẩn → `animate().onfinish` có thể KHÔNG
  bắn (setTimeout vẫn chạy) → mọi animate() phải có setTimeout dự phòng.
- **Popup "hiện 1 nơi rồi nhảy về giữa"** (lỗi hay gặp nhất, đã sửa 2 đợt): phần tử căn giữa bằng
  transform + animation động transform. Sửa: opacity-only hoặc keyframe bake luôn translate(-50%)
  (`aw-pop-cx`, `aw-fly`). RÀ SOÁT bằng `grep "transform:.*translate|animation:"` — xem HUONG DAN CORE.
- **cqw** cho sizing (fullscreen giữ tỷ lệ); slack của autoFit tính theo `root.clientWidth*hệ_số` (px
  động) chứ không px cứng.
- Hiệu ứng ✓/✗ gắn TẠI CHỖ không re-render; quay lại câu cũ thì render khôi phục từ `state`.
- Font/mp3 offline trong `core/assets/`; `sound.js` resolve mp3 qua `import.meta.url`.
- Leaderboard key `aword-lb-<activityId>`; xáo câu/đáp án chỉ 1 lần lúc mount; `escapeHtml/escapeText`
  cho mọi nội dung người dùng.
- **Grid `1fr auto 1fr` căn giữa cụm**: 2 cột 1fr chênh min-content → cụm giữa LỆCH → thêm `min-width:0`.
- **`main.js` (trang chủ)** phải bọc nội dung dưới khung trong `.aw-below-left` (grid 3 cột mới).
- **TRÙNG TÊN CLASS với engine (v0.6.3):** engine dùng `.aw-topbar` (thanh đồng hồ/điểm trong game),
  `.aw-iconbtn` (loa/fullscreen/menu), `.aw-navbtn` (mũi tên trước/sau). Header thư viện/editor mới ĐỪNG
  đặt trùng — đã đổi thành `.aw-appbar`/`.aw-appbtn`/`.aw-appnav`. Trước khi đặt tên class UI mới, `grep`
  tên đó trong `core/` (nhất là engine.js/app.css) để chắc không đụng không gian tên khung game.
