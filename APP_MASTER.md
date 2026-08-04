# APP_MASTER — AWord

> **FILE ĐỌC ĐẦU TIÊN khi tiếp nhận dự án.** Đọc xong file này là đủ hiểu toàn bộ để build tiếp.
> Lịch sử chi tiết từng version: `GHI CHU DU AN.md`. Hợp đồng engine↔template + mọi luật kỹ thuật:
> `core/HUONG DAN CORE.md` (ĐỌC TRƯỚC KHI SỬA CODE). Nghiên cứu Wordwall + kiến trúc gốc: `docs/`.
> Cập nhật lần cuối: **5/8/2026 (Đợt 70, v0.9.45) — RUNNING WORD: 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ ĐỢT 2 (nút Play/Pause nhạy + vuông bo tròn; slogan về hàng nút Menu + đổi màu xám nhìn rõ; sửa icon loa↔fullscreen đè nhau; chữ trong ô tự co theo bề rộng, hết "…", 3 ô cùng cỡ; đồng hồ hạ thấp bỏ khoảng thừa; ⭐ bảng CHỈ 3 ô — ô nhập LUÔN ở đáy, 2 từ trước ở trên, đảo lượt thì đẩy lên bằng translateY; ⭐ sửa màn GAME COMPLETE bị kẹt). KHÔNG ĐỤNG CORE đợt này (chỉ 2 file `running-word.js/.css`; 1 dòng core `act-<type>` là của Đợt 69 vẫn đang gộp chờ). 🟢 CHỜ THẦY DUYỆT — tự test devserver 0 lỗi console: ⭐ **2 lỗi thật bắt được** — (1) play/pause "lúc bấm được lúc không" do `paintClocks()` gán lại `innerHTML` nút mỗi 100ms → SVG con bị thay giữa pointerdown/up làm mất click; vá = chỉ đổi icon khi thực sự đổi + `svg{pointer-events:none}`; (2) hết ván "không bấm được gì" do bảng kết quả riêng z-index 45 CHE bảng GAME COMPLETE của engine z-index 13; vá = gỡ bảng kết quả khi gọi `ui.finish()`. Đo: cửa sổ 3 ô đúng kịch bản gõ-từ-5→hiện 3-4-5→submit→đảo→đẩy lên 4-5-6; bảng hẹp 30%(142px) co chữ cùng 20px 0 cắt; play/pause toggle 4 lần đúng; slogan ở hàng Menu màu rgb(107,122,144); loa[472-493]/fs[495-515] tách hẳn; đồng hồ cao 28px; hết ván → `.aw-panel` "TEAM A WINS" 4 nút, elementFromPoint không bị chặn, Start again→READY. Chi tiết: `GHI CHU DU AN.md` Đợt 70 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8d. **Việc kế: 3 việc máy không tự kiểm được — TOMKO thật, fullscreen iPad thật, in A4 thật** → duyệt → commit + push (gộp Đợt 68+69+70).**
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
