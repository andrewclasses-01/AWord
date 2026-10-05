# SỔ TAY TỐI ƯU TỐC ĐỘ WEB — hệ sinh thái Andrew Classes

> Rút từ phiên 05/10/2026 (AWord Đợt 479 → 485). Thầy: *"AWord tải lâu trên iPad"* → sau 7 đợt: trang chủ
> hết màn chờ **>30 s → 3,7 s**, mở thư mục **3,2 s → 0,1 s**. Dùng lại cho mọi web khác trong hệ sinh thái
> (andrewclasses.com / myLesson Web, kiemtra, myDocument, nentangtienganh…). Công cụ ở `tools/toc-do/` (xem cuối file).

## 0. Bài học lớn nhất — đo trên MÁY THẬT trước, đừng đoán

- **Chrome giả lập iPad KHÔNG bắt được lỗi của Safari.** Chrome headless (CPU chậm 4–6×, mạng 4G) ra 1,7–3,9 s, iPad thật
  5,3 s rồi >30 s. Cùng cỡ màn/CPU nhưng KHÁC NHÂN trình duyệt (WebKit) và khác DỮ LIỆU (Claude không đăng nhập được tài khoản thầy).
- **Đo xong phần MÃ phải đo cả phần DỮ LIỆU.** 3 đợt đầu làm mã nhẹ đi (1 MB → 0,4 MB) nhưng thầy vẫn thấy lâu; thủ phạm
  thật là Firestore: thư viện kéo cả kho **33 MB** trước khi vẽ, mở thư mục kéo **3,9 MB** bài giao chỉ để vẽ chấm đỏ.
- **Hosting gần như không quan trọng.** GitHub Pages, Firebase Hosting đều phát từ Fastly Singapore — đo ngang nhau
  (kiemtra Chặng 8). Đổi host chỉ đáng khi cần GIẤU mã nguồn hoặc tự đặt Cache-Control.

## 1. Quy trình 5 bước

1. **Đo trên máy thật bằng `?do=1`** (AWord: `core/do-tai.js`). Bảng hiện ngay trên màn: DNS/TLS/chờ trang · FCP/LCP ·
   ⭐ hết màn chờ · ⭐ hết "Loading" · số file / KB / từ cache · TẢI TRÙNG · 10 file chậm nhất · khựng · lỗi · lịch sử 8 lần.
   Thầy mở 2 lần, chụp/dán bảng. Web khác: chép `do-tai.js` + đoạn bộ nạp ở đầu `<head>` (index.html/play.html AWord), đổi
   selector màn chờ (`.aw-boot`) và chữ chờ ("Loading") cho đúng web đó.
2. **Đọc bảng — tách 3 loại chậm:**
   | Dấu hiệu trong bảng | Loại | Hướng xử lý |
   |---|---|---|
   | "chờ trang" lớn (>500 ms) | máy chủ/mạng | hiếm khi do mình; thử lại lúc khác |
   | TẢI TRÙNG > 0, cùng file ×2–3 | mã nạp sai cách | §2.1 |
   | FCP muộn, "tải" ~1 MB+, JS nhiều | mã nặng | §2.2 thu gọn mã |
   | FCP sớm nhưng ⭐ hết màn chờ muộn / màn chờ còn sau 30 s / ảnh `lh3…` (avatar) tải rất muộn | **chờ DỮ LIỆU** | §2.3 |
   | thao tác SAU khi vào trang chậm (mở thư mục…) | đọc dữ liệu lặp lại | §2.4 |
3. **Tái hiện trên máy tính bằng NHÂN SAFARI:** Playwright WebKit + máy chủ giả GitHub Pages có băng thông dùng chung
   (`tools/toc-do/may-chu-cham.mjs` 3000 kbps, trễ 50 ms) + `do-trinh-duyet.mjs`. Dữ liệu Firestore: đo kho thật bằng khoá quản
   trị CHỈ ĐỌC (`do-kho.js`), hoặc Firestore GIẢ trong bộ nhớ (`firestore-gia.js`) để chạy đúng trang thật đã đăng nhập.
4. **Sửa — rồi so bản cũ/bản mới trên cùng bàn thử** (bảng số trước/sau ghi vào GHI CHU), kèm phép thử ĐÚNG ĐẮN (lỗi console,
   số nút, so ảnh từng điểm ảnh `anh.mjs`, chơi thử `choi.mjs`, kịch bản dữ liệu Node).
5. **Đưa lên → kiểm live → thầy đo lại `?do=1`.**

## 2. Các thủ phạm đã gặp + cách chữa

### 2.1 Safari tải mỗi file JS 3 lần (Đợt 481)
`<link rel="modulepreload">` + `fetch(link.href)` "làm nóng" (mẹo cho Chrome của Đợt 285c) ⇒ **WebKit không gộp** fetch() với
modulepreload/import đang bay ⇒ 3 lượt tải mỗi file (iPad: engine.js ×3, 156 lượt JS). Thí nghiệm `tn.mjs`: modulepreload + import
= 1 lần trên WebKit ✅; thêm fetch() = 3 lần ❌; Chrome cả hai 1 lần. **Chữa:** chỉ chạy mẹo Chromium khi `navigator.userAgentData`
(chỉ Chromium có; mọi trình duyệt trên iPad/iPhone là WebKit). ⇒ kiểm web khác: `grep -n "fetch(.*href" *.html`.

### 2.2 Mã nặng vì chú thích — thu gọn khi xuất bản (Đợt 482)
Mã nhiều chú thích tiếng Việt: JS+CSS trang chủ AWord 837 KB nén → **219 KB** khi minify. Cách làm KHÔNG đổi quy trình viết mã:
- `tools/xuat-ban.mjs`: esbuild `transform` minify TỪNG file (không gộp, không đổi đường dẫn, không đặt format/target ⇒ không đổi tên
  biến cấp cao nhất), bỏ qua vendor/ *.min.js tools/ docs/ scratch/; lỗi ⇒ giữ bản gốc; ghi `build.json` {sha, nguon{file: băm nguồn}}.
- `.github/workflows/xuat-ban.yml` + **Settings › Pages › Source = GitHub Actions** (tài khoản chủ repo andrewclasses-01;
  `gh` máy MSI là andrewclasses-code KHÔNG có quyền admin — đổi qua trình duyệt đã đăng nhập).
- ⛔ Sau khi bật: **kiểm live = `python tools/kiem-live.py`** (so build.json với HEAD) — băm .js/.css live khác repo là ĐÚNG.
- Trước khi bật cho web mới: so bản gốc ↔ thu gọn bằng `so-loi.mjs` (lỗi/số nút), `choi.mjs` (bấm thử), `anh.mjs` (so ảnh 0 px).
  AWord: 27/27 trang, 21/21 game, 19/19 ảnh khớp trên cả Chrome lẫn WebKit.
- Rà trước khi minify: `grep` `.toString()` đọc mã, `fn.name`/`constructor.name`, `eval`, `document.currentScript`.

### 2.3 Trang chờ đọc CẢ KHO Firestore trước khi vẽ (Đợt 483 + 484)
AWord `store.js readAll()` = `getDocs(users/{uid}/items)` TOÀN BỘ (547 doc ≈ 33 MB) rồi mới bỏ màn chờ. Đo kho bằng `do-kho.js`
(theo kind, theo trường, doc to nhất). Hai cục lớn KHÔNG cần lúc mở:
- **Dữ liệu có chỗ đọc riêng** (sổ cái Showdown 12,8 MB — `showdown-history.js` tự `getDoc`): loại khỏi truy vấn bằng
  `where("kind", "not-in", [...])` (≤10 giá trị; ⚠️ loại cả doc THIẾU trường ⇒ mọi doc phải có `kind`). Thử truy vấn trên máy chủ
  thật bằng REST `runQuery` (khoá quản trị, chỉ đọc) TRƯỚC khi sửa mã.
- **Trường to chỉ cần khi mở đúng mục** (bảng goiY TTA 13,4 MB): tách ra doc riêng `gy_<id>` khi GHI (một chốt `persist`), để dấu
  `goiYTach`; NẠP lại ở các chốt đọc một mục (getItem/getActivity/startGame/createAssignment/duplicate). Không bao giờ tự xoá doc
  tách khi lưu (chỉ xoá vĩnh viễn mới xoá kèm). Thứ tự: đưa MÃ đọc được cả 2 dạng lên trước → sao lưu kho → di trú bằng khoá quản
  trị (ghi doc mới trước, sửa doc cũ sau, điều kiện `currentDocument.updateTime`) → kiểm sâu so với sao lưu.
  ⚠️ So doc REST phải **bỏ thứ tự khoá map** (`kiem-484.js` chuẩn hoá) — `JSON.stringify` thô báo "lệch" oan cả 52/52.
Kết quả: lượt đọc đầu 33 MB → **7,1 MB**; màn chờ >30 s → 3,7 s.

### 2.4 Mỗi thao tác lại đọc lại một tập lớn (Đợt 485)
Mở thư mục ⇒ `listAllAssignments()` 147 bài giao ≈ 3,9 MB (98 % ảnh chụp act trong từng bài) chỉ để vẽ CHẤM ĐỎ, và CHỜ xong mới vẽ thẻ.
**Chữa:** vẽ ngay từ cái đã có; tập phụ tải NGẦM rồi vá giao diện (`capNhatChamDo`); nhớ 30 s; **tự tải lại khi chính trang vừa GHI**
(bộ đếm `soLanGhiBaiGiao()` tăng trong mọi hàm ghi) ⇒ không bao giờ hiện dữ liệu cũ sau thao tác của thầy. Thẻ act: 3,2 s → 0,1 s.

## 3. Bẫy của chính công cụ đo (đã cắn)
- **Playwright WebKit trên Windows KHÔNG có cache HTTP** — số "mở lại" của WebKit ở bàn thử là vô nghĩa (cache phải đo trên iPad).
- **`page.route()` (Playwright) tắt cache HTTP** ở mọi trình duyệt — chặn ghi Firestore bằng nghe `request` thay vì route khi đo cache.
- Bàn đo trong `do-tai.js`: màn chờ có thể còn trong DOM nhưng ẨN ⇒ tính "hết" bằng `getClientRects().length === 0`.
- Bảng `?do=1`: file khác miền không có Timing-Allow-Origin ⇒ KB = 0 / "?" (Firestore, gstatic) — nhìn thời điểm "xong lúc", không nhìn KB.
- Nhiều phiên chung working copy ⇒ `git log` NGAY trước khi đặt số đợt (Đợt 480 từng bị 2 phiên dùng trùng).
- Bash heredoc nuốt `\` ⇒ script có đường dẫn Windows phải viết bằng Write tool rồi chạy file.

## 4. Áp dụng cho web khác — danh sách kiểm nhanh
1. Chép `core/do-tai.js` + bộ nạp `?do=1`; nhờ thầy đo trên iPad/điện thoại thật (2 lần).
2. `grep` mẹo làm nóng `fetch(...href)` / preload trùng ⇒ §2.1.
3. Đo KB mã: có chú thích dày ⇒ bật xuất bản thu gọn §2.2 (chép `tools/xuat-ban.mjs`, `tools/kiem-live.py`, workflow; đổi
   `LIVE` trong kiem-live.py + tên miền).
4. Liệt kê MỌI lượt đọc Firestore trước khi vẽ lần đầu và ở mỗi thao tác chính: đọc cả collection? kéo trường to không cần? đọc lại
   mỗi lần? ⇒ §2.3 / §2.4. Đo kích thước bằng `do-kho.js` (đổi đường collection).
5. Ghi bảng trước/sau vào GHI CHU của web đó; nhờ thầy đo lại.

## 5. Công cụ `tools/toc-do/` (chạy trong thư mục tạm có `npm i playwright pngjs pixelmatch@5 esbuild`; `npx playwright install webkit`)
| File | Dùng để |
|---|---|
| `may-chu-cham.mjs <thư mục> <cổng> [kbps] [trễ]` | máy chủ giả GitHub Pages (max-age 600 + ETag + gzip), băng thông DÙNG CHUNG, đếm byte; `/__log`, `/__reset` |
| `do-trinh-duyet.mjs <gốc> [webkit,chrome] [đường,…]` | đo "dùng được" (hết màn chờ + hết Loading) lần đầu/mở lại, số lượt, KB, TẢI TRÙNG |
| `do-ipad.mjs <url> [cpu] [lần] [wifi\|4g]` | Chrome headless CDP giả lập iPad (CPU chậm, mạng chậm), chặn GHI Firestore |
| `tn.mjs` | thí nghiệm WebKit/Chrome: modulepreload / fetch() / import có tải trùng không |
| `so-loi.mjs` · `choi.mjs` · `anh.mjs` | so bản gốc (cổng 7706) ↔ bản thu gọn (7707): lỗi + số nút · bấm thử 21 game · so ảnh từng điểm |
| `thumuc.mjs` · `results.mjs` | đo mở thư mục / vẽ lại Results trên trang thư viện thật + Firestore giả (Đợt 485) |
| `firestore-gia.js` · `thu-tach-goiy.mjs` | Firestore giả trong bộ nhớ (thay `core/firebase.js` ở bản chép) + 13 kịch bản Node cho tách goiY |
| `do-kho.js` | CHỈ ĐỌC: kích thước kho `users/{uid}/items` theo kind / trường / doc to nhất (khoá quản trị) |
| `di-tru-484.js` · `kiem-484.js` | mẫu DI TRÚ dữ liệu an toàn (`--thu` / `--sao-luu` / `--lam` / `--hoan`) + kiểm sâu so sao lưu |
Khoá quản trị: `%LOCALAPPDATA%\AndrewClasses\firebase-admin.json` (chép bằng `D:\APP AND DATA\_KHOA\CAI KHOA FIREBASE.bat`) — KHÔNG đưa lên git.
