# APP_MASTER — AWord

> **FILE ĐỌC ĐẦU TIÊN khi tiếp nhận dự án.** Đọc xong file này là đủ hiểu toàn bộ để build tiếp.
> Lịch sử chi tiết từng version: `GHI CHU DU AN.md`. Hợp đồng engine↔template + mọi luật kỹ thuật:
> `core/HUONG DAN CORE.md` (ĐỌC TRƯỚC KHI SỬA CODE). Nghiên cứu Wordwall + kiến trúc gốc: `docs/`.
> Cập nhật lần cuối: **1/8/2026 (Đợt 34, v0.9.8) — GAMESHOW: dựng lại INTRO 6s + GET READY mỗi câu + NỀN PHỦ TOÀN KHUNG (theo act gốc). ✅ THẦY DUYỆT → ĐÃ COMMIT + PUSH. KHÔNG đụng core. Chi tiết: `GHI CHU DU AN.md` Đợt 34. (Cùng ngày có phiên song song làm Unjumble = Đợt 35/v0.9.9, file tách rời.)**
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
   - Bản LIVE (dùng thật): **https://andrewclasses-01.github.io/AWord/** — deploy = `git push`, chờ ~1
     phút. ⚠️Sau khi push phải `curl` kiểm chứng file mới đã live rồi mới test (Pages cập nhật các file
     KHÔNG đồng thời — xem BẪY mục 9).
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

## 0a. ⭐⭐ BÀN GIAO MỚI NHẤT (chốt 1/8/2026 sau Đợt 33 — PHIÊN/MÁY MỚI ĐỌC MỤC NÀY TRƯỚC TIÊN)

> Mục "0b" bên dưới là bàn giao CŨ của phiên 31/7 — giữ lại vì có nhiều bài học kỹ thuật còn giá trị,
> nhưng **phần trạng thái game trong đó đã lỗi thời** (nó còn ghi Crossword/Flying fruit/Unjumble "chờ
> duyệt"). Trạng thái đúng là mục này.

### Đứng ở đâu rồi
**Cả 14 loại act đã ✅ CHỐT, sống ở trang chủ, đã push + live** — Quiz · Anagram · Find the match ·
Type the answer · Open the box · True or false · Gameshow quiz · Maze chase · Whack-a-mole ·
Flying fruit · Balloon pop · Crossword · Unjumble · Speaking cards. Mỗi loại có content editor riêng.
Thầy đã tự chạy thử bản live và xác nhận (1/8/2026).

**Trang học sinh `play.html` nay chơi được CẢ 14 loại** (trước chỉ Quiz — xem Đợt 33).

### ⚠️ 2 THÓI QUEN CŨ NAY ĐÃ SAI — đọc kỹ kẻo làm hỏng
1. **Gộp template = sửa ĐÚNG 1 FILE `core/catalog.js`.** Từ v0.9.7 (Đợt 33) `index.html`, `play.html`,
   `main.js`, `play.js`, `manifest.js` **không còn liệt kê template nào** — `ensureTemplate()` trong
   `core/registry.js` tự chèn CSS + import module lúc act được chơi/sửa. Mọi ghi chú cũ bảo "thêm import
   vào main.js + link CSS vào index.html + entry manifest.js" là **LỖI THỜI**, làm theo sẽ nạp thừa và
   phá mục đích (HS chỉ nên tải đúng 1 game).
2. **`manifest.js` không còn là danh sách chép tay** — nó chỉ là view suy ra từ catalog. Đừng thêm gì
   vào đó.

Khuôn 1 mục catalog (xem thêm `templates/HUONG DAN TEMPLATE.md`):
```js
{ type: "<ten_type>", label: "<Tên hiện ra>", built: true,
  blurb: "1 câu tả cho picker New activity.",
  css:    "templates/<ten>/<ten>.css",
  load:   () => import("../templates/<ten>/<ten>.js"),
  sample: () => import("../templates/<ten>/sample-<ten>.js") },
```

### Việc kế tiếp — HỎI THẦY TRƯỚC, đừng tự đoán
Xếp theo mức đáng làm (đánh giá của phiên Đợt 33, thầy chưa chốt cái nào):

- **(A) Balloon pop — polish**: đây là template DUY NHẤT lên trang chủ mà còn mục "Điểm cần POLISH" chưa
  làm: blimp có thể chồng lane ở khung hẹp; **hiện 2 đồng hồ** (đồng hồ riêng ở `topbarMid` + ô đồng hồ
  engine bên trái hiện "0:00" vì `options.timer:"none"`). Kèm 1 **ĐỀ XUẤT SỬA CORE** đã ghi sẵn: khi
  template có `inlineTimerBar:true` VÀ `options.timer==="none"` thì engine nên ẩn `timerEl`. Chi tiết:
  `templates/balloon-pop/GHI CHU BALLOON-POP.md`.
- **(B) Dọn 3 ĐỀ XUẤT SỬA CORE còn treo** (đều do template tự lách, ghi trong GHI CHU của chúng):
  Speaking cards xin cờ `openEnded`/`hideScore` (ẩn chip điểm + nav + "Submit answers" cho game
  `scorable:false`) và cờ ẩn nhóm Options thay vì tỉa DOM bằng tay; Crossword xin
  `tpl.hideRandomOption` (lưới cố định, nhóm Shuffle vô nghĩa); Balloon pop xin ẩn `timerEl` như (A).
- **(C) Việc còn ngỏ của từng game** (thầy chưa yêu cầu, đừng tự làm): 🎤/🖼️ voice+image trong editor
  của Anagram/Crossword; Find the match thiếu 3 âm Menu/Leaderboard/RevealAnswers (core chưa có hook);
  Crossword bật bàn phím ảo thì nên phóng to theo từ đang chọn thay vì thu cả lưới.
- **(D) Chưa ai test**: fullscreen thật trên bảng TOMKO; nghe thật các bộ mp3.

### Khúc KHÔNG tự test được — phải nhờ thầy
Trang chủ và assignment thật đều nằm sau **popup đăng nhập Google, không tự động hoá được**. Phiên mới
muốn kiểm tra logic mà không cần đăng nhập thì dùng `templates/<ten>/test.html`, hoặc `import()` thẳng
`core/registry.js` + `core/catalog.js` từ console trang đang mở (cách Đợt 32/33 đã dùng để test cả 14
loại: `ensureTemplate` → `startGame` vào 1 div rời → đếm `.aw-stage`).

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
