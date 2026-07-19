# APP_MASTER — AWord

> **FILE ĐỌC ĐẦU TIÊN khi tiếp nhận dự án.** Đọc xong file này là đủ hiểu toàn bộ để build tiếp.
> Lịch sử chi tiết từng version: `GHI CHU DU AN.md`. Hợp đồng engine↔template + mọi luật kỹ thuật:
> `core/HUONG DAN CORE.md` (ĐỌC TRƯỚC KHI SỬA CODE). Nghiên cứu Wordwall + kiến trúc gốc: `docs/`.
> Cập nhật lần cuối: **20/7/2026 — v0.7.4 (CHỐT CHẶNG, bàn giao cho phiên mới).**
>
> 🌐 **WEB ĐÃ LIVE: https://andrewclasses-01.github.io/AWord/**
> Repo: `github.com/andrewclasses-01/AWord` (PUBLIC, branch `main`, Pages từ thư mục gốc).
> 🔥 **FIREBASE XONG + THƯ VIỆN ĐÃ LÊN MÂY (v0.7.4)**: project **`aword-70dae`** (account
> `namdaptrai01@gmail.com`, gói Spark miễn phí) — Firestore Singapore + đăng nhập Google + luật bảo vệ.
> **Web BẮT ĐĂNG NHẬP** mới vào được; thư viện nằm ở `users/{uid}/items` nên đi theo thầy mọi máy.
> Đã test thật đầu-cuối trên web live (tạo/sửa/xoá/thùng rác/tìm/chơi/in + ép đọc lại từ mạng).
> Chi tiết: `docs/08-FIREBASE-SETUP.md`. ⏳ CÒN: Settings/leaderboard vẫn local; `?play=` cần đăng nhập
> (sẽ chuyển sang `assignments/{code}` công khai khi làm Assignment).

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

4. **TRẠNG THÁI CHỐT (20/7/2026) — ĐÃ XONG TRỌN 3 VIỆC LỚN:**
   - ✅ **Khối 1 — Quiz + thư viện kiểu Drive** (v0.5.0→v0.6.9): editor (dán thẳng bảng Excel), thư mục
     con/màu/kéo-thả/thùng rác/tìm kiếm, header + Settings, bố cục thẻ theo ảnh mẫu thầy.
   - ✅ **Khối 2 — PRINT** (v0.7.1): bấm Print → popup chọn ĐỊNH DẠNG (Anagram/Crossword/Quiz/Unjumble,
     chỉ hiện cái khả dụng theo type + số câu) → worksheet A4 thang xám theo ảnh mẫu. Hệ dùng chung
     `core/print.js`. **Crossword mới là nút "soon", CHƯA có renderer.** Chưa in thử giấy/PDF thật.
   - ✅ **LÊN MẠNG + FIREBASE** (v0.7.2→v0.7.4): repo public + GitHub Pages; project Firebase
     `aword-70dae`; **thư viện chạy trên Firestore** `users/{uid}/items`, **bắt đăng nhập Google**
     (chỉ `namdaptrai01@gmail.com`); đã test thật đầu-cuối trên web live + kiểm tra bảo mật (người lạ
     không đọc/ghi được gì).

   **➡️ VIỆC KẾ TIẾP = Khối 3 — ASSIGNMENT (link + QR cho học sinh).** Đây là mắt xích còn thiếu để
   thầy giao bài: hiện link `?play=` vẫn đòi đăng nhập nên **CHƯA gửi cho HS được**. Cần làm:
   tạo doc `assignments/{code}` chứa **BẢN SAO** act (đọc công khai — luật Firestore đã cho phép sẵn) +
   trang chơi cho HS **không cần đăng nhập** (nhập tên → chơi → nộp) + sinh link & mã QR.
   Sau đó là Khối 4 — thu điểm/leaderboard online (`results/{id}`, luật đã sẵn sàng). Xem ROADMAP mục 7.

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

### Quiz — 🟢 GẦN HOÀN THIỆN, thầy đã test OK nhiều vòng, CHƯA chính thức "chốt"
Quiz là **GAME MẪU VÀNG** — làm thật kỹ để rút phong cách/kinh nghiệm/lỗi-cần-tránh cho 4 game còn
lại. Thầy vừa test OK (17/7) và kết thúc phiên. **Bước còn thiếu**: thầy chưa nói "chốt Quiz", nên
CHƯA viết bộ "recipe/công thức mẫu" tổng kết (việc pending — xem ROADMAP). Phiên sau nên hỏi thầy:
chốt Quiz + viết recipe rồi qua Anagram, hay còn chỉnh Quiz.

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

### 4 game khác — 🔴 CHƯA BUILD
Anagram / Find the match / Type the answer / Open the box — đã có khung thư mục + file hướng dẫn +
trang test rỗng (hiện "not built yet"). Session mới nhận việc là làm được ngay.

### Chưa có: editor giáo viên, Firebase/online, đẩy GitHub.

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
D:\APP AND DATA\PROJECT\AWord\
├─ APP_MASTER.md              ← file này (đọc đầu tiên)
├─ GHI CHU DU AN.md           ← nhật ký version (mỗi đợt sửa PHẢI ghi + tăng version)
├─ devserver.py               ← server chạy thử (gửi Cache-Control:no-store — mục 9)
├─ index.html + main.js + manifest.js  ← TRANG CHỦ kiểu DRIVE (main.js: 2 gốc Activities/Results, thư
│                             mục con, thùng rác, Move, Search, grid/list, ⁝ menu, mở-tab-mới ?play/?folder;
│                             manifest.js = danh sách template đã chốt, hiện main.js không dùng tới)
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
│  ├─ firebase.js            ← (v0.7.3) KẾT NỐI Firebase: config project `aword-70dae` + nạp SDK LAZY qua
│  │                             CDN 12.9.0 (zero-build) + auth()/db()/fs()/signIn()/signOutNow()/
│  │                             onUser()/currentUser()/isTeacher(). Config CÔNG KHAI là bình thường.
│  ├─ catalog.js              ← (v0.6.3) 1 NGUỒN DUY NHẤT liệt kê loại act (Quiz built + 4 coming soon);
│  │                             main.js (picker) + engine.js (panel Template) dùng chung
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
10. Template chỉ thêm vào `manifest.js`/`index.html` khi ĐÃ CHỐT (thầy duyệt).
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
6. **Chốt Quiz + viết "recipe/công thức mẫu"** khi thầy hài lòng → khuôn cho 4 game còn lại.
7. **Build 4 template còn lại**: Anagram → Find the match → Type the answer → Open the box.
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

## 9. Bẫy & lưu ý kỹ thuật (tóm tắt — ĐẦY ĐỦ trong `core/HUONG DAN CORE.md`)

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
