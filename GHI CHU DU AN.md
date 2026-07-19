# GHI CHÚ DỰ ÁN — AWord

Web game tiếng Anh (giống Wordwall), chơi trên trình duyệt, sẽ đẩy lên GitHub.
Mục tiêu: giáo viên tạo game + học sinh chơi + thu điểm để xếp hạng.

---

## Cách chạy thử trên máy
- Máy chưa cài Node. Bản hiện tại **chạy-ngay không cần build** bằng Python.
- Dùng **`python devserver.py 5510`** (KHÔNG `python -m http.server` trần — thiếu header chống cache,
  xem APP_MASTER mục 9). Công cụ preview cấu hình tên `aword` (trong `D:\OTHERS\CLAUDE\.claude\launch.json`)
  đã trỏ sang script này. Chạy tay: PowerShell tại `D:\APP AND DATA\PROJECT\AWord` → `python devserver.py`.
- **Trang chủ (trình quản lý kiểu Drive)**: `http://localhost:5510/`
- **Trang test riêng từng template**: `http://localhost:5510/templates/<ten-template>/test.html`

> **Cấu trúc thư mục đã được quy hoạch lại từ v0.3.0 để build nhiều template song song.**
> Xem `APP_MASTER.md` mục 4 để biết bản đồ thư mục mới nhất — đừng dựa vào đường dẫn file
> trong các mục lịch sử phiên bản CŨ hơn v0.3.0 bên dưới (src/, styles/ đã không còn tồn tại).

---

## Lịch sử phiên bản

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
