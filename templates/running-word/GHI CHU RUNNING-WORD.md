# GHI CHU RUNNING WORD (RUNNINGW)

> **TRẠNG THÁI (7/8/2026): ✅ THẦY DUYỆT — Đợt 11 PHẦN 3 (mục 8l-3, v0.9.61). KHÔNG ĐỤNG LOGIC CORE. ĐÃ COMMIT `ac67836` + PUSH + LIVE (đã chạy lại trên chính bản live: khung nghỉ 1,5238 · 4 bước co 1,15/1,08/0,93/0,87 · ca của thầy tỷ lệ 2,019 kẹp về 16:9 dải 76px/bên, hàng 7,54 > chữ 5,82 hết đè · 0 lỗi console).**
> Thầy nghiệm thu phần resize: *"việc resize ok"*, chỉ còn **phím Andrew ngắn hơn và phím Space dài hơn** so với
> bàn phím chuẩn thầy gửi ảnh. ⭐ **KHÔNG PHẢI do việc hôm nay** — đã chứng minh bằng đo: (a) tạm `git stash`
> quay về bản HEAD trước mọi thay đổi hôm nay → tỷ lệ y hệt (**Andrew 2,12 / Space 7,93** so với 1 phím chữ);
> (b) 4 bước co bàn phím **không đổi một tỉ lệ nào** (`transform: scale()` co cả hàng như một khối — đo ở 4 mốc
> đều ra đúng cùng bộ số). **Gốc:** `.aw-rw-key-andrew` để **10,6cqw** trong khi bản chuẩn dùng chung —
> `.aw-tta-key-andrew` (Type the answer) và `.aw-cw-key-andrew` (Crossword) — đều **12,7cqw**; Running word là
> template DUY NHẤT lệch, từ ngày dựng. Vì Andrew là phím **cố định bề ngang** duy nhất của hàng cuối còn Space
> và Submit thì co giãn, nên 2,1cqw thiếu đó **chảy thẳng vào phím Space** — đúng hiện tượng thầy thấy.
> **Sửa: 10,6cqw → 12,7cqw.** Đo lại: Andrew **2,54** và Andrew/numbers **1,124** — **khớp CHÍNH XÁC bản chuẩn**,
> và giữ nguyên ở cả 4 bước fullscreen. Space còn lệch **1,6%** (7,619 so với 7,496) vì khung game này cố ý để
> lề hai bên hẹp hơn (1,6cqw) nên bàn phím rộng hơn chuẩn một chút — cỡ **6px trên khung 968px**, và đây là lựa
> chọn thiết kế cũ của chính thầy, em không đụng. Hồi quy **16/16 mount, 0 lỗi console**. Chi tiết: mục **8l-3**.
>
> **TRẠNG THÁI (7/8/2026): ✅ THẦY DUYỆT — Đợt 11 PHẦN 2 (mục 8l-2, v0.9.61). KHÔNG ĐỤNG LOGIC CORE. ĐÃ COMMIT `ac67836` + PUSH + LIVE (đã chạy lại trên chính bản live: khung nghỉ 1,5238 · 4 bước co 1,15/1,08/0,93/0,87 · ca của thầy tỷ lệ 2,019 kẹp về 16:9 dải 76px/bên, hàng 7,54 > chữ 5,82 hết đè · 0 lỗi console).**
> Thầy chơi thử bản 16:10,5 rồi gửi ảnh **3 dòng từ ĐÈ CHỒNG lên nhau khi fullscreen** trên cửa sổ 1920×950,
> yêu cầu "phải có những giới hạn cần thiết... đảm bảo khi fullscreen và resize theo các dạng màn hình khác
> nhau". **Gốc lỗi:** fullscreen (zoom) cố ý KHÔNG kẹp dải nên khung lấy đúng tỷ lệ màn; mà mọi cỡ trong game
> đo theo **bề NGANG**, nên màn càng bè thì bàn phím (23cqw) + đồng hồ (5,81cqw) **giữ nguyên** trong khi chiều
> cao khung sụp — và `.aw-rw-boards` là `flex:1` duy nhất nên **gánh toàn bộ**. Đo được: 16:9 hàng 5,61 (bắt
> đầu đè) · 2,02 hàng **3,35** (đúng ảnh thầy) · 2,37 hàng **0,92** (nát). **Cách sửa thầy chọn (2 câu hỏi):
> "co trước, kẹp sau" + "ưu tiên chữ đọc được".** (1) **4 bước co bàn phím** theo `@container stage
> (aspect-ratio > …)` — bàn phím nhường chỗ, **chữ KHÔNG hề bị co**, giữ nguyên 5,6cqw ở mọi tỷ lệ; dùng
> `transform: scale()` (giữ đúng mọi tỉ lệ core vẽ) + `margin-bottom` của boards theo công thức
> `N×(scale−1)+0,4cqw` với **N = 20cqw** (đo `offsetHeight`, KHÔNG phải `getBoundingClientRect`) để biến thay
> đổi HÌNH thành chỗ THẬT trong bố cục. (2) **Chốt chặn 16:9**: `max-width: calc(100dvh*16/9)` trong zoom →
> màn bè hơn 16:9 mới kẹp dải. Kết quả đo: **iPad 4:3 và khung nghỉ 16:10,5 KHÔNG ĐỔI MỘT LY** (scale 1,15 /
> margin 3,39 / hàng 7,01 — y hệt bản thầy duyệt sáng nay); ảnh của thầy (2,02) nay khung 16:9, dải **~115px
> mỗi bên trên màn 1920 (6% bề ngang)**, hàng **7,54** dư **1,72** — hết đè. ⭐ **2 BẪY tự bắt được**: khối
> `@container` phải nằm **CUỐI FILE** (container query KHÔNG cộng thêm độ ưu tiên → luật gốc bên dưới thắng,
> im lặng vô hiệu hoá cả tính năng); và **ngưỡng không được đặt ĐÚNG vào tỷ lệ khung đang nghỉ** (16/10,5 làm
> bước 1 tự kích hoạt ở khung nghỉ do làm tròn pixel) → đổi sang 16/10,4. Chi tiết: mục **8l-2** dưới.
>
> **TRẠNG THÁI (7/8/2026): ✅ THẦY DUYỆT — Đợt 11 PHẦN 1 (mục 8l, v0.9.61). KHÔNG ĐỤNG LOGIC CORE. ĐÃ COMMIT `ac67836` + PUSH + LIVE (đã chạy lại trên chính bản live: khung nghỉ 1,5238 · 4 bước co 1,15/1,08/0,93/0,87 · ca của thầy tỷ lệ 2,019 kẹp về 16:9 dải 76px/bên, hàng 7,54 > chữ 5,82 hết đè · 0 lỗi console).**
> Thầy chốt: **khung mặc định đổi 4:3 → 16:10,5**, giữ nguyên cách fullscreen. Chỉ **1 file**
> (`running-word.css`), **2 luật CSS đổi giá trị** + ghi chú. Running word là **app làm mẫu** cho loạt cải
> tiến kích cỡ màn hình sắp tới của cả 16 template. (1) `.aw-stage.act-running_word` đổi
> `aspect-ratio: 4/3` → **`16 / 10.5`** (= 32/21; khung cao **65,625cqw**, giữa 16:9 = 56,25 và 4:3 = 75);
> 4 luật letterbox `:fullscreen` đổi theo cho khớp — **cách fullscreen KHÔNG đổi** (template này dùng
> `useZoomFullscreen`, đo lại vẫn phủ kín đúng 1280×720 = cả viewport, `document.fullscreenElement` vẫn
> `null`, `.aw-below` vẫn ẩn, thoát ra về đúng 1,5238). (2) ⭐ **BẮT ĐƯỢC 1 LỖI THẬT do khung ngắn lại**:
> `.aw-rw-input` không khai `line-height` nên lấy chiều cao theo **metrics font Baloo 2 (~1,6em)** → hộp cao
> **9,29cqw** trong khi hàng chỉ còn **7,01cqw** (thời 4:3 hàng 10,13cqw nên lọt, không ai thấy) → hàng có
> `overflow:hidden` **cắt mất gạch chân ô nhập**. Khai `line-height: 1.04` (bằng đúng `.aw-rw-row-body`) →
> hộp còn **6,21cqw**, nằm gọn trong hàng, và **chữ hết nhảy cỡ lúc submit** (trước: ô nhập 9,29 → chữ chốt
> 5,81; nay cả hai đều 5,81). Đo phần "ăn mực" thật của chữ hoa bằng canvas: **3,62cqw trong hộp 5,81cqw →
> dư 2,19cqw, không cắt nét**. Chi tiết + bảng số đo trước/sau: mục **8l** dưới.
> ⬜ **Cần thầy nghiệm thu máy thật** (xem mục 8l cuối) — nhất là số hàng từ nhìn có còn đủ thoáng không.
>
> **TRẠNG THÁI (7/8/2026): ✅ THẦY DUYỆT — Đợt 10 (mục 8k, v0.9.55) ĐÃ COMMIT (`0b629b3`) + PUSH + LIVE.** 5 nhóm thay đổi thầy gửi 1 lượt
> (thầy đã chọn: PASS thay ô tích bằng thanh 0–5; nút swap chỉ đổi nhãn+danh sách từ). Chỉ 3 file template
> (`running-word.js`, `.css`, `rw-print.js`), **KHÔNG đụng core**. (1) **PASS 0–5/đội** thay ô tích (state
> `passLeft`, nút hiện số còn lại, hết=mờ, chỉ sáng đúng lượt). (2) **Tiêu đề PART A/PART B** thay tên đội
> (cập nhật động trong `paintBoard`). (3) **2 bảng SONG SONG**: bỏ `topIndexOf(t)` → `sharedTop()` chung cho
> cả 2 bảng, khóa theo từ đội-đang-tới-lượt; đội chờ hiện đúng số đó dạng ô trống hoặc chữ xanh (đo `topA===topB`
> mọi bước). (4) **In thêm SET X** cả 3 tờ (`printRunningSheets(...,setIndex+1)`). (5a) **Bỏ 3-2-1**, bắt đầu
> bằng **Submit lượt đầu** (`startMatch()` gọi từ `submit()` khi còn "prep"; thêm `canType()`; xoá
> `beginCountdown`). (5b) Trước trận, nút giữa = **SWAP** (đổi nhãn+danh sách từ 2 bên, `current` gán object mới
> tránh mutate set đã lưu, cờ `partFlip`; màu/đồng hồ giữ theo bên); lúc chơi vẫn là Tạm dừng/Chạy tiếp. (5c)
> **In chữ to phủ trang**: bỏ dòng tiêu đề №/WORD/TURN + "Explainer", `HEADING_MM` 16→12, `fs` 0.62→0.78×rowH,
> giữ ô TURN + CHECK 2 cột. Tự test devserver (:5510, đo DOM, 0 lỗi console); hồi quy Type-the-answer + Crossword
> vẫn 16:9, 0 rò `.aw-rw-*`. ✅ **THẦY DUYỆT → commit `0b629b3` + push + LIVE** (poll bản live: đủ marker
> `sharedTop`/`doSwapParts`/`passLeft`, hết `beginCountdown`). ⬜ Còn chờ thầy nghiệm thu máy thật
> (chọn-gõ-submit; nút swap; 2 bảng song song; in giấy A4 chữ to + SET X). Chi tiết đầy đủ: mục **8k** dưới.
>
> **TRẠNG THÁI (6/8/2026): 🟢 THẦY DUYỆT — Đợt 9 (mục 8j) ✅ ĐÃ COMMIT (`123c439`) + PUSH.** 3 điều
> chỉnh thầy gửi 1 lượt, tự test devserver 0 lỗi console. (1) Thu nhỏ board (`margin-bottom`
> 3.4cqw) để bàn phím +15% không đè ô nhập — đo hở 13px trên khung 4:3 968px; (2) Dời PASS khỏi cạnh
> bàn phím LÊN hàng đồng hồ: mỗi đội 1 nút PASS vuông ở MÉP NGOÀI (A trái, B phải), chỉ sáng đúng lượt
> đội mình; đồng hồ ngắn lại căn giữa mỗi nửa; nút Play/Pause KÉO DÀI ngang (11cqw) — cả hàng
> `[PASS a][đồng hồ a][Play/Pause][đồng hồ b][PASS b]` đối xứng (đo: passA/passB cách mép đều 13px,
> Play/Pause đúng tâm strip); bỏ hẳn `positionPass()`/`kbdRO` (PASS nay nằm trong grid, không còn định
> vị tuyệt đối theo bàn phím). (3) Bảng MENU kết thúc thêm dòng **thời gian còn thừa** dưới điểm mỗi
> đội (đo: A "0:00" / B "0:08" + nhãn "time left"). **KHÔNG sửa core** (chỉ 2 file template). Hồi quy
> Type-the-answer + Crossword: vẫn 16:9, bàn phím `transform:none` (không rò scale 1.15), 0 rò class.
> ⬜ **Cần thầy nghiệm thu máy thật:** hàng PASS+đồng hồ+Play/Pause có cân đối vừa mắt; nút PASS mép
> ngoài có vừa tầm tay trọng tài; bàn phím to có còn đè gì không.
>
> **TRẠNG THÁI (5/8/2026): 🟢 THẦY DUYỆT — Đợt 8 (mục 8i) ✅ ĐÃ COMMIT (`9f333ab`) + PUSH + LIVE**
> (poll bản live `andrewclasses-01.github.io/AWord` qua bẫy cache Pages: lần 1 còn file cũ, lần 2 đã
> đủ marker `renderSummary`/`topIndexOf`/`positionPass` + engine.js có `tpl.renderSummary`) — 7 cải
> tiến hiển thị + gameplay thầy
> gửi 1 lượt: (1) bảng MENU kết thúc gọn còn 2 nửa "tên đội / điểm X/total" vàng + Start again (bỏ
> Time, Leaderboard, Show answers, Play a different template, dòng "you're Nth"); (2) bàn phím to
> thêm 15% giữ nguyên tỷ lệ; (3) 2 đồng hồ chạm sát mép trên; (4) PASS thành nút VUÔNG ghim giữa
> khoảng trống trái bàn phím, Play/Pause đứng giữa 2 đồng hồ; (5) ĐẢO CHIỀU danh sách — từ mới lên
> TRÊN CÙNG, từ cũ tụt xuống; (6) từ càng cũ càng nhỏ + mờ dần (tier0/1/2 = 1 · .82/.7 · .66/.5);
> (7) game chỉ chốt điểm khi 2 đội BẰNG số lượt submit (đội đi trước hết từ vẫn phải chờ đội kia
> gõ nốt lượt chót). ⭐ **CÓ SỬA CORE 1 chỗ** (hook opt-in `tpl.renderSummary`, zero-diff 14 game
> khác — xem mục 6 + 8i). Đã tự test devserver: **0 lỗi console**, đo khớp mọi con số, hồi quy
> Type-the-answer + Crossword vẫn 16:9 / bàn phím không phóng / touch-action auto. **Chưa commit đợt
> này — chờ thầy duyệt.**
> Đợt 7 (mục 8h, gốc lỗi TEAM B + in 1 cột + khoá zoom chạm đúp) **✅ ĐÃ COMMIT (`6ff2da6`) + PUSH +
> LIVE (`4115e89`)**.
> Đợt 6 (mục 8g, ZOOM lấp kín bỏ khoá 4:3) **✅ ĐÃ COMMIT (`1304bf4`) + PUSH + LIVE**.
> Đợt 5 (mục 8f, nút Fullscreen ghim góc + vá phòng ngừa cửa sổ 3 dòng) **✅ ĐÃ COMMIT (`fc54dcd`) +
> PUSH + LIVE**, thầy đã xác nhận ổn.
> Đợt 4 dưới đây **✅ ĐÃ COMMIT (`2fb19c7`) + PUSH + LIVE** — đổi Fullscreen thật sang ZOOM CSS (chỉ
> RUNNINGW; sau khi thầy tự chơi thật trên iPad và báo Fullscreen API thật bị Chrome tự thoát khi
> vuốt/mất sau 3-2-1/hiện popup "stay fullscreen?"). **CÓ SỬA CORE** (cờ opt-in
> `tpl.useZoomFullscreen`, zero-diff cho 14 game khác — xem mục 8e). Đã kiểm chứng **TRÊN BẢN
> LIVE** (`andrewclasses-01.github.io/AWord`, poll qua bẫy cache Pages — lần 1-2 còn file cũ, lần 3
> mới đủ marker mới): RunningW live bấm Fullscreen → `aw-zoomed` bật, khung 4:3, `document.
> fullscreenElement` vẫn `null` (không gọi API thật); Quiz live bấm Fullscreen → vẫn gọi
> `requestFullscreen()` thật như cũ (đo bằng cách tráo hàm tạm thời) — 0 lỗi console cả 2.
> Đợt 1-3 dưới đây **✅ ĐÃ COMMIT (`a40809e`) + PUSH + LIVE** — 3 đợt sửa lớn liên tiếp trong
> cùng ngày, gộp chung 1 commit sau khi thầy nói "ok build":
> **Đợt 1** (mục 8b, v0.9.43) = 8 điểm tối ưu iPad. **Đợt 2** (mục 8c, v0.9.44) = 15 điểm làm lại
> giao diện trận đấu. **Đợt 3** (mục 8d, v0.9.45) = 8 điểm tinh chỉnh sau khi thầy chơi thử (nút
> Play/Pause nhạy + vuông bo tròn, slogan về hàng nút Menu + đổi màu, sửa icon loa↔fullscreen đè
> nhau, chữ trong ô tự co không "…", đồng hồ thấp hơn, **bảng CHỈ 3 ô — input luôn ở đáy, đẩy lên khi
> đảo lượt**, sửa màn GAME COMPLETE bị kẹt). Đợt 3 **KHÔNG đụng core** (chỉ 2 file template). **⭐ CÓ
> SỬA CORE** vẫn là 1 dòng của Đợt 2 (`core/engine.js`, thầy duyệt — xem mục 8c). Đã chạy lại trọn
> bộ kiểm tra **TRÊN BẢN LIVE** (`andrewclasses-01.github.io/AWord`, poll qua bẫy cache Pages) — 0
> lỗi console; hồi quy Type the answer live vẫn 16:9.
> ⬜ **Còn chờ thầy nghiệm thu những việc máy không thay được**: xem khung 4:3 + đồng hồ + bảng
> 70/30 + 3-ô trên TOMKO thật, bật thử fullscreen thật trên iPad, **in thử 3 tờ A4 giấy thật**.
> Đọc kèm: `../HUONG DAN TEMPLATE.md`, `../CONG THUC MAU.md`, `../../core/HUONG DAN CORE.md`.

---

## 1. Game này là gì

Trò **RUNNING WORD** thầy vốn chơi bằng **giấy + Excel + đồng hồ cờ vua thật**:

- Mỗi đội cầm 1 tờ danh sách từ riêng (PART A / PART B). Thầy cầm tờ thứ 3 (CHECK) để soi.
- **Explainer** của đội giải thích từ số 1 (không được nói ra từ đó), **Typer** gõ chữ.
- Gõ đúng → thầy xác nhận → **bấm đồng hồ cờ vua** → tới lượt đội kia.
- Đội nào **hết giờ trước là thua**; nếu hết từ thì đội nào **còn nhiều thời gian hơn** thắng.

Template này thay cả 4 thứ cùng lúc:

| Trước | Nay |
|---|---|
| Đồng hồ cờ vua vật lý | 2 mặt đồng hồ trong khung, tự đảo khi gõ đúng |
| Gõ vào sheet `RUNNING` của WORD GAMES.xlsx trên iPad | 2 cột ô nhập trong game, tự chấm |
| In 3 tab từ sheet `RunningW` | Nút **Print 3 sheets** ở màn setup (`rw-print.js`) |
| Tự chia 2 danh sách bằng tay trong Excel | `buildSets()` trong `rw-sets.js` |

## 2. ⭐ LUẬT QUAN TRỌNG NHẤT: TỪ SẮP TỚI KHÔNG BAO GIỜ ĐƯỢC HIỆN LÊN MÀN HÌNH

Typer đang đứng ngay trước màn hình. Nên:

- Dòng chưa chơi **chỉ hiện SỐ THỨ TỰ**, không hiện chữ.
- **Màn setup cũng KHÔNG hiện danh sách** — chỉ hiện con số (bao nhiêu từ, chia mấy + mấy, trùng
  mấy từ). Muốn xem từ thì **in ra giấy**.
- Dòng **PASS** hiện `—`, KHÔNG lộ từ (từ đó có thể đang nằm trong danh sách đội kia — xem mục 3,
  bình thường có ~15 từ trùng — lộ ra là tặng không cho đối thủ).
- Dòng gõ ĐÚNG mới hiện chữ (màu xanh lá). Chỗ này **có rò rỉ nhẹ** đúng như bản Excel cũ vẫn rò
  (đội kia nhìn thấy từ vừa gõ). Giữ nguyên vì thầy yêu cầu "gõ đúng thì chữ đổi xanh lá", và
  explainer đội kia vẫn phải diễn giải lại.

## 3. ⭐ THUẬT TOÁN CHIA TỪ — v2 (5/8/2026, thay hẳn v1)

**Thầy đổi luật** (bản v1 — chia ngẫu nhiên phủ trọn pool, đo từ `IEL-S15.T3.P4.xlsm` — vẫn ghi lại
bên dưới mục 3b để nhớ gốc tích, nhưng KHÔNG còn là luật đang chạy):

```
CAPACITY = 50   -- mỗi Part TỐI ĐA 50 từ, không còn thanh "Words per team" để chỉnh

n ≤ CAPACITY  -> 2 đội chơi ĐÚNG CÙNG một danh sách (cả pool), mỗi bên tự xáo thứ tự riêng
n > CAPACITY  -> Part A = 50 từ ĐẦU theo đúng thứ tự thầy nhập (1..50)
                 Part B = 50 từ CUỐI theo đúng thứ tự thầy nhập (n-49..n)
                 (n=70 -> A=1-50, B=21-70, trùng 30 từ ở giữa; n≥100 -> 2 danh sách rời hẳn)
```

Vị trí trong danh sách (không phải bốc ngẫu nhiên) quyết định ai được từ nào — thầy tự sắp thứ tự
từ trong pool để kiểm soát việc chia. `buildSets(pool)` trong `rw-sets.js` cài đúng vậy (không còn
nhận tham số thứ 2 nữa).

**Vẫn giữ nguyên từ v1** (thầy xác nhận giữ, 5/8/2026): từ TRÙNG (dù là cả pool khi n≤50, hay đúng
đoạn giữa khi n>50) vẫn phải **lệch vị trí ≥ 6 dòng** giữa 2 danh sách sau khi xáo (`MIN_SHARED_GAP`,
hàm `separateShared()` không đổi) — để đội B không gõ trúng từ vừa nghe đội A tả 20 giây trước.

### 3b. Bản gốc v1 (để nhớ gốc tích, không còn chạy)

Đo `IEL-S15.T3.P4.xlsm` sheet `RunningW` ngày 4/8/2026: pool 85 · PART A=50 · PART B=50 ·
A∪B=85 (phủ trọn) · A∩B=15=50+50−85 (trùng ít nhất có thể) — tức KHÔNG PHẢI "xáo pool rồi bốc 50
hai lần" (kiểu đó trùng ~29 từ và bỏ sót cả chục từ). Luật v1 dùng 1 tham số `wordsPerTeam` (Options)
để chọn k rồi chia ngẫu nhiên phủ trọn pool. Luật v2 ở trên bỏ tham số này, thay bằng vị trí cố định.

## 4. Cấu trúc dữ liệu

```js
{
  type: "running_word",
  content: {
    words: ["CYLINDER", "LUXURIOUS", ...],      // pool dùng chung, không clue, không đáp án
    printSets: [ { a:[...], b:[...] }, ... ]     // tối đa 3 bộ đã lưu (Firestore-safe)
  },
  options: {
    timer: "none",              // BẮT BUỘC — game tự chạy 2 đồng hồ
    teamAName, teamBName,
    clockSeconds: 300,           // mỗi đội — chọn qua thanh trượt bậc thang (mục 11), vẫn là 1 số giây thường
    incrementSeconds: 0,         // thưởng kiểu Fischer mỗi từ đúng
    allowPass: true, passPenaltySeconds: 10,
    andrewUses: 1,               // MỖI ĐỘI — nay 1..5, không còn 0 (Off)
    warnSeconds: 15
  }
  // "wordsPerTeam" ĐÃ BỎ (5/8/2026) — chia từ nay 100% tự động theo tổng số từ, xem mục 3.
}
```

⚠️ `printSets` là **mảng các MAP**, mỗi map có 2 field mảng — Firestore cho phép. Tuyệt đối
không đổi thành mảng-lồng-mảng (`[[...],[...]]`), Firestore từ chối thẳng.

## 5. File trong thư mục

| File | Việc |
|---|---|
| `running-word.js` | template chính: setup → 3-2-1 → trận đấu → kết quả |
| `running-word.css` | style (`.aw-rw-*`); có cả phần `@media print` cho 3 tờ giấy |
| `running-word-editor.js` | soạn pool — **1 ô textarea, mỗi dòng 1 từ** (dán thẳng cột Excel) |
| `rw-sets.js` | `buildSets()` + đọc/ghi bộ đã lưu + thống kê |
| `rw-print.js` | dựng 3 trang A4 rồi `window.print()` |
| `rw-sound.js` | âm thanh synth Web Audio (clack đồng hồ, chuông, tick dồn) |
| `sample-running-word.js` | 40 từ thật của bài IEL-S15.T3.P4 |

## 6. Vì sao KHÔNG đụng core (và 2 chỗ được phép đụng)

- **Đồng hồ**: `tpl.hideTimerOption` + `options.timer:"none"` → đồng hồ toàn ván của engine tắt
  hẳn, 2 đồng hồ là của riêng template.
- **Nút Andrew**: dùng khe `extraKey` **đã có sẵn** trong `core/keyboard.js` (Type the answer mở
  đường từ 1/8/2026) — không thêm API mới.
- **In**: `core/print.js` là bộ in DÙNG CHUNG 4 định dạng, quy về `{clue, answer, options}` — hình
  dạng game này không dùng được. Thêm định dạng thứ 5 vào đó = sửa file core mọi template dùng
  chung → **cấm**. Nên 3 tờ dựng ở `rw-print.js` và in từ **màn setup của chính game**. Vẫn xài
  chùa được hạ tầng của core: gắn 1 `div.aw-print-sheet` cạnh `#app` thì `core/app.css` đã lo sẵn
  việc ẩn trên màn hình / hiện khi in / ẩn `#app`.
- **Ẩn 2 mũi tên Back-Next**: scope qua `.aw-playarea:has(> .aw-rw-card) ~ ...` đúng khuôn
  whack-a-mole. TUYỆT ĐỐI không dùng luật trần `.aw-navbtn{display:none}` — CSS template ở lại
  document vĩnh viễn, sẽ giết mũi tên của mọi game mở sau đó (đã cắn thật ở open-the-box, Đợt 61).

**4 chỗ core được phép sửa (thầy duyệt trước):**

1. `core/catalog.js` — thêm đúng 1 mục (đây là cổng tích hợp chính thức của mọi template).
2. `core/lesson-import.js` — thêm `runningWord()` + 1 nhánh: có `WORDTABLE` thì tự sinh act
   `<mã bài> / RUNNING WORD` dùng nguyên cột D (chính là pool 85 từ mà sheet `RunningW` vẫn lấy).
3. `core/engine.js` (5/8/2026) — thêm đúng 1 dòng `stage.classList.add(\`act-${activity.type}\`)`
   ngay sau khi dựng khung, cho MỌI activity (không riêng RUNNINGW). Thuần cộng thêm, không đọc bởi
   CSS template nào khác — cho phép RUNNINGW tự đè khung 4:3 + ẩn 3 nút Assignment/Template/Print
   **ngay từ màn READY**, việc mà `:has(.aw-rw-card)` không làm được vì markup đó chỉ có sau khi
   mount() chạy. Xem mục 8c.
4. `core/engine.js` (5/8/2026) — cờ opt-in `tpl.useZoomFullscreen`: nút Fullscreen đổi hẳn cơ chế
   sang `root.classList.toggle("aw-zoomed")` (CSS thuần, không gọi Fullscreen API thật) thay vì
   `requestFs/exitFs`. Zero-diff cho 14 game kia (không đặt cờ = y hệt code cũ). Xem mục 8e.
5. `core/engine.js` (5/8/2026, Đợt 8) — hook opt-in `tpl.renderSummary(panel, {result, restart,
   panelItem, session})` trong `showSummary()`: nếu template khai hàm này thì engine chỉ dựng tiêu đề
   panel rồi giao TOÀN BỘ phần thân (stats + dòng rank + hàng nút) cho template tự vẽ, `return` sớm.
   Không khai = giữ nguyên panel mặc định từng byte. Cùng khuôn với `tpl.reviewStyle==="stacked"` đã
   có sẵn (customize `showReview`). RUNNINGW dùng để vẽ bảng 2 đội "tên/điểm X/total" vàng, chỉ chừa
   Start again. Xem mục 8i.

**CHƯA làm (cố ý):** `core/convert.js` chưa có nhánh cho `running_word`, nên game này chưa tham
gia "Change template". Muốn có thì thêm 1 nhánh `toRecords()` + 1 nhánh `buildContent()` — xem
`core/HUONG DAN CORE.md`. Chưa làm vì thầy chọn hướng nhập tự động, và convert vào đây sẽ mất sạch
clue (game này không cần clue nên chiều ngược lại vô hại, chiều xuôi thì mất dữ liệu).

## 7. ⭐ BẪY ĐÃ CẮN THẬT KHI BUILD (4/8/2026)

**(1) Phím Andrew chết cứng — lỗi thật, bắt được bằng cách bấm thử trong trình duyệt.**
`fnKey()` trong `core/keyboard.js` gắn `onclick` **CHỈ KHI phím không disabled lúc DỰNG**:

```js
if (disabled) b.disabled = true;
else if (onClick) b.onclick = ...;
```

và `refresh()` sau đó **chỉ đổi `.disabled`, KHÔNG gắn lại handler**. Bản đầu tôi dựng bàn phím
ngay trong `mount()` — lúc đó game còn ở màn setup, `phase === "setup"` nên `isDisabled()` trả
`true` → phím Andrew sinh ra không có handler, về sau mở khoá mà bấm mãi không ăn.

✅ **ĐÃ VÁ TẬN GỐC Ở CORE (thầy chốt, 4/8/2026)** — `fnKey()` nay luôn gắn handler, `disabled` một
mình quyết định. Lúc vá mới lòi ra **Crossword đã từng dính đúng bẫy này** và phải né bằng tay
(`isDisabled` có điều kiện thừa `curWord >= 0` kèm ghi chú "must NOT be disabled at build time").
Chi tiết + số đo: `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM".
→ Template này **vẫn giữ** việc dựng bàn phím ở `startMatch()`: không còn vì bắt buộc, mà vì màn
setup chẳng có gì để gõ — và như vậy game chạy đúng cả trên bản core cũ.

**(2) Bẫy TDZ `let` — đã tránh trước khi chạy.** `refereeBar()` được gọi TRONG vòng lặp dựng 2
đồng hồ và nó gán vào `refUI`; nếu để `let refUI = null;` ở dưới thì đúng lúc gán biến còn trong
vùng chết → `ReferenceError`. Đã khai `refUI` TRƯỚC vòng lặp. (Đúng bẫy `GHI CHU WHACK-A-MOLE`
Đợt 63 ghi lại — khai báo *hàm* thì hoisted, khai báo `let` thì không.)

**(3) Không nhét `__poolSize` vào `activity.options`.** `buildExtraOptions` chỉ nhận `draft`
(= bản sao options) nên rất dễ nhét số lượng từ vào đó cho tiện — nhưng Apply sẽ `saveActivity`
nguyên cái draft lên Firestore, đẻ rác vĩnh viễn. Dùng biến `poolSizeHint` ở cấp module thay thế
(mỗi lúc chỉ có 1 game được mount nên luôn đúng act).

**(4) Ngân sách chiều cao SAI — bàn phím nuốt sạch 2 cột. Lỗi thật, chỉ lộ ra khi CHỤP ẢNH.**
Tôi tính theo khung 16:9 = 56.25cqw, nhưng **vùng chơi chỉ cao 45.67cqw** (thanh trên + thanh dưới
ăn ~10.6cqw), và bàn phím core ở cỡ gốc chiếm **20.3cqw** chứ không phải ~17.5 như ước lượng:

```
đồng hồ 12.57 + bàn phím 20.30 = 32.9 / 45.67  ->  2 cột còn 9.87cqw = 1.04 DÒNG
```

Tức toàn bộ ý nghĩa của màn hình bị đẩy ra ngoài. **Sửa:** thu đồng hồ (12.57→9.62), thu dòng, thu
bàn phím (20.30→15.35). Muốn thu bàn phím thì phải đè lên class của `core/keyboard.js` — nên **MỌI
luật đó đều scope dưới `.aw-rw-card`**. Luật trần `.aw-kbd-key{...}` sẽ thu nhỏ luôn bàn phím của
**Type the answer và Crossword** suốt phiên, vì CSS template chèn 1 lần và không bao giờ gỡ.
Đo lại: **5 dòng hiện trọn mỗi đội, 0 chồng lấn, 0 tràn.**
→ Bài học: **đừng suy chiều cao từ 56.25cqw — hãy ĐO `.aw-playarea`.**

**(5) Đo giờ trong lúc test đừng hoảng.** Đồng hồ **vẫn chạy giữa 2 lần gọi công cụ**: đo được
"60s → 38s" trong khi script chỉ mất 2s là bình thường (20s kia là thời gian thật trôi qua giữa 2
lệnh), không phải lỗi tính giờ.

## 8. Đã tự test những gì (trình duyệt thật, `test.html`, 0 lỗi console)

Vì màn hình **cố ý không hiện từ**, không script nào đọc trộm được đáp án → test theo kiểu hộp đen:
dựng act pool nhỏ đã biết rồi **dò từng từ** (mỗi lần dò sai cũng chính là 1 ca kiểm thử đường sai).

| Ca | Kết quả đo |
|---|---|
| Chia từ (pool 40, 25/đội) | `25 + 25`, trùng **10** = 2·25−40 ✓, phủ **ALL** ✓ |
| Vào trận | 3-2-1 chạy xong, 2 đồng hồ `1:00`, đội A sáng, ô nhập nằm ở dòng 1 cột A ✓ |
| **Không lộ từ** | quét toàn bộ `.aw-rw-row-body` → **rỗng hoàn toàn** ✓ |
| Gõ SAI (5 lần) | đều bị từ chối, ô viền đỏ, **không nhảy dòng**, đồng hồ vẫn chạy ✓ |
| Gõ ĐÚNG | dòng xanh hiện chữ, **đảo đồng hồ** (A dừng 0:38, B chạy), điểm `1–0`, nav đổi sang BLUES ✓ |
| Andrew | hiện từ vàng đúng dòng đang gõ, phím glow + khoá; gõ lại từ đó → ăn điểm; **đội kia vẫn còn 1 lượt** ✓ |
| PASS | dòng thành `—` (**không lộ từ** ✓), đồng hồ `5:00 → 4:55` đúng −5s, đảo lượt, điểm không đổi ✓ |
| UNDO | huỷ đúng nước vừa rồi, trả lại lượt + trả lại `5:00`, nút tự mờ đi ✓ |
| PAUSE | đồng hồ đứng im 1,4s, khoá Submit; bấm lại thì chạy tiếp ✓ |
| Hết danh sách | `REDS WINS` · "REDS finished the whole list" · bảng 3 words vs 2 words · engine ăn mừng + bảng tổng kết ✓ |
| `allowPass:false` | nút PASS không được dựng ✓ |
| Hết giờ | cảnh báo bật **đúng mốc 0:15**, đếm tới 0:00 hết **đúng 30s**, `BLUES WINS` · "REDS ran out of time", đồng hồ A đỏ `is-dead` ✓ |
| Editor | dán cột Excel + tab + dòng trống → đếm đúng, dedupe/sort chạy, Save **tự loại bộ in đã lỗi thời** (2 bộ chứa từ đã xoá → giữ 0) ✓ |
| In | 3 trang · 50 dòng/tờ · ô tick có · tờ CHECK ghép **đúng cặp A/B theo dòng** ✓ |
| Cỡ in mọi pool thật | 20/40/60/85/100 từ đều **lọt 1 trang**, chữ **9.9–10.5pt** ✓ |
| 4 theme | chữ theo `var(--aw-text)` của theme, tương phản tốt cả 4 (độ sáng nền .96–1.0) ✓ |
| Tap-highlight (TOMKO) | **142/142** phần tử bấm được = `rgba(0,0,0,0)` — thừa hưởng bản vá core v0.9.40, file này **KHÔNG khai lại** ✓ |
| Bố cục | đồng hồ 9.62 + cột 19.40 + bàn phím 15.35 = 44.35 / 45.67cqw · **5 dòng trọn mỗi đội** · 0 chồng lấn ✓ |
| Import `.xlsm` thật | bundle 8 → **9 act**, `IEL-S15.T3.P4 / RUNNING WORD` đúng **85 từ**, giữ `WASH DOWN`/`BRING IN`/`LARGE-SCALE`/`SKIN-SCRAPER`, 114ms ✓ |
| Hồi quy | **15/15 template** mount + có editor, **0 lỗi console** ✓ |

⚠️ **Bẫy của chính khâu TEST:** đừng khôi phục `window.print` ngay sau khi gọi `printRunningSheets()`
— hàm này hẹn `window.print()` sau 60ms, khôi phục sớm là bung hộp thoại In THẬT và **treo cứng
renderer** (đã dính, phải mở tab mới). Trong test hãy giữ bản stub ít nhất 300ms.

## 8b. ⭐ ĐỢT 2 (5/8/2026) — TỐI ƯU IPAD: 8 điểm thầy gửi 1 lượt

Không đụng core. Chỉ 5 file: `running-word.js`, `running-word.css`, `rw-sets.js`, `rw-print.js`,
`sample-running-word.js`.

1. **Khung 4:3 thay 16:9** — RIÊNG game này (iPad màn hình gần 4:3, khung 16:9 cũ để trống 2 bên).
   Kỹ thuật: `.aw-stage:has(.aw-rw-card) { aspect-ratio: 4/3 }` + bản fullscreen riêng cùng công
   thức — **không sửa `core/app.css`**, `:has()` cho phép 1 template tự đè luật khung dùng chung lúc
   chạy, 14 game kia (đã tinh chỉnh cho 16:9) không hề bị đụng tới. Đo trên devserver: stage
   968×726px, tỉ lệ đúng 1.333.
2. **2 đồng hồ lên sát mép trên** — ẩn hẳn thanh trên gốc của engine (đồng hồ tổng + tỉ số A-B, nay
   dư thừa vì đã có 2 đồng hồ đội), 2 đồng hồ đội chiếm luôn vị trí đó (`.aw-stage-inner:has(.aw-rw-
   card) .aw-topbar{display:none}`, luôn luôn, không riêng fullscreen). Mỗi khối đồng hồ CHỈ còn TÊN
   ĐỘI (nhỏ) + THỜI GIAN (to hơn, 3.6→4.4cqw) — bỏ hẳn dòng "words" (số từ vẫn đếm ngầm để tính
   thắng thua + màn kết quả, chỉ không hiện ở đây nữa). Đo: đồng hồ cách mép trên 5.8px trên khung
   968px.
3. **Fullscreen sạch chữ** — bật fullscreen thì ẩn HẾT (Menu · mũi tên Back/Next · nhãn "TEAM A ·
   word N of M" · nút Sound), CHỈ chừa icon Fullscreen (không phải chữ) ở góc để bấm thoát. Bàn cờ
   riêng của game (đồng hồ, dải trọng tài PASS/PAUSE/UNDO, bàn phím) không đụng — chỉ ẩn khung
   CHUNG của engine. 4 biến thể `:fullscreen`/`:-webkit-full-screen`/`:-moz-full-screen`/
   `:-ms-fullscreen` đều viết riêng (đúng luật core: gộp chung 1 dòng thì trình duyệt không hiểu 1
   cái là bỏ CẢ dòng). ⚠️ **Chưa tự bấm fullscreen thật được** (Fullscreen API cần cử chỉ người dùng
   thật, click giả lập của công cụ không tính) — cần thầy bấm thử trên TOMKO/iPad thật.
4. **Bỏ văn bản hướng dẫn** — bỏ dòng phụ đề "Two teams · one chess clock…", dòng ghi chú "This
   split is new…"/"Playing the saved split…", dòng tóm tắt cấu hình dưới nút START MATCH. Giữ lại
   các con số cần thiết (tên đội, đồng hồ, bảng "40 words in pool · 40+40 · shared · pool covered").
5. **Chia từ theo VỊ TRÍ, tối đa 50/bên** — xem mục 3 (đã viết lại). Bỏ hẳn thanh "Words per team".
   Vẫn giữ luật lệch ≥6 dòng cho từ trùng (thầy xác nhận giữ).
6+7. **Tờ in tối ưu** — heading thu nhỏ hẳn (`HEADING_MM` 25→16: tag 7mm→4.6mm, subtitle
   3.4mm→2.6mm, margin/border mỏng lại) để nhường mm cho bảng từ; **bỏ hẳn trần `ROW_MAX_MM`**
   (trước neo 7.4mm dù còn dư trang) — nay dòng LUÔN cao hết mức trang cho phép; tỉ lệ cỡ chữ/dòng
   tăng 0.50→0.62 (chữ áp sát gạch phân cách hơn); gạch phân cách dòng mỏng lại 0.25mm→0.12mm. Đo
   thật (gọi `printRunningSheets` trực tiếp, có "tem" `window.print`): pool 50 từ → 2 cột, dòng
   10.12mm/cỡ chữ 6.27mm (~17.8pt) — gần gấp đôi cỡ chữ cũ (~10.5pt). ⚠️ **Danh sách RẤT ngắn (dưới
   chục từ) sẽ ra chữ RẤT to** (đúng ý "luôn lấp kín trang", nhưng là hệ quả cần thầy biết trước) —
   trò này trong thực tế luôn là danh sách vài chục từ nên không phải ca thật gặp, chỉ ghi chú lại.
8. **Luôn in A4, 1 trang 1 tờ** — vốn ĐÃ đúng từ đầu (cơ chế 2 cột tự chảy khi >~49 từ để giữ chữ to
   mà vẫn lọt 1 trang) — chỉ cần xác nhận vẫn đúng với luật in mới, đã đo OK.
9. **Tờ CHECK: đánh số riêng cho cả 2 nửa** — trước dùng CHUNG 1 cột №; nay mỗi đội có cột № RIÊNG
   (`№ TEAM A № TEAM B`, 4 cột thay vì 3) — vì 2 danh sách không phải cặp khớp theo hàng, đọc dọc
   từng đội cần số riêng.
10. **Andrew help 1..5** — bỏ nấc 0 (Off), thanh trượt nay kéo từ 1 đến 5, không còn hiện "Off".
11. **Thanh "Time each team" kiểu BẬC THANG** — 10 nấc cố định 0:30→5:00 (cách 30s) + **nấc 0 =
    Custom** hiện ra 2 ô số Min/Sec riêng. Mở lại Options sau khi lưu 1 giá trị KHÔNG khớp nấc nào
    (vd giá trị cũ từ thanh trượt liên tục trước đây, hoặc số Custom vừa gõ) → tự nhận ra và mở ngay
    ở Custom với đúng số phút giây đó, không mất dữ liệu act cũ. ⭐ **1 lỗi thật bắt được lúc tự test
    trong trình duyệt**: kéo sang nấc Custom rồi lại tự nhảy về nấc cũ — do hàm vẽ lại đọc lại vị trí
    thanh trượt TỪ giá trị đã lưu (`draft.clockSeconds`) thay vì tin vị trí người dùng vừa kéo, mà lúc
    vừa vào Custom giá trị đó chưa đổi nên tính ngược lại đúng nấc cũ. Sửa: tách hẳn "vẽ lại toàn bộ
    lúc mở panel" khỏi "chỉ đổi 2 nửa hiện/ẩn lúc kéo" — vị trí thanh trượt chỉ do chính thao tác kéo
    quyết định, không bao giờ bị tính ngược lại. Đo lại: kéo nấc 3 → "1:30"; kéo nấc 0 → hiện đúng
    Min/Sec (prefill từ giá trị TRƯỚC đó), thanh trượt đứng yên ở 0; gõ 2 phút 15 giây → Apply → mở
    lại Options → đúng lại ở Custom, "2" / "15".
12. **Bonus 0-15s** — đã đúng sẵn từ trước, không cần sửa.

### Tự test đã chạy (trình duyệt thật qua devserver, không phải đọc code suông)

- Khung: tỉ lệ đo được đúng 4:3 (1.333), thanh trên gốc `display:none`, đồng hồ cách mép trên 5.8px.
- Chia từ: gọi thẳng `buildSets()` — pool 30 (≤50) → 2 đội **giống hệt nội dung**, thứ tự khác nhau;
  pool 70 → A đúng 1-50, B đúng 21-70, trùng đúng 30; pool 120 → trùng 0 (rời hẳn) — khớp 100% công
  thức mới.
- Chơi thật: bấm nút Andrew hiện đúng từ, gõ đúng từ đó → dòng xanh, đồng hồ đảo, điểm cập nhật,
  turn label đổi đội — 0 lỗi console suốt.
- Options: mở panel → đúng đủ 4 nhóm còn lại (Teams/Chess clock/Round chỉ còn Andrew/Pass), kéo
  thanh Time each team qua đủ các nấc + Custom, Apply → Play lại → bảng facts hiện đúng "2:15" đã
  lưu; mở lại Options → đúng lại ở Custom "2"/"15" (round-trip không mất dữ liệu).
- In: gọi thẳng `printRunningSheets()` (có tem `window.print`) với pool 50/30 — ra đúng 3 trang,
  PART A 50 dòng, PART B 30 dòng, CHECK 50 dòng có **4 cột** `№ TEAM A № TEAM B`, cỡ chữ/dòng đúng
  công thức mới, tự chuyển 2 cột đúng lúc.
- Editor + hồi quy: mở Edit không lỗi; toàn bộ trên chạy **0 lỗi console**.

⚠️ **3 việc máy không tự kiểm được, cần thầy** (Fullscreen API cần cử chỉ người thật; hình dạng
khung + cỡ chữ trên giấy cần mắt thật): xem khung 4:3 + đồng hồ trên TOMKO thật; bấm thử fullscreen
thật trên iPad (Chrome) xem có sạch chữ như ý không, nút thoát có dễ bấm không; in thử 3 tờ A4 giấy
thật xem chữ có thật sự to/lấp kín như mong muốn không.

## 8c. ⭐ ĐỢT 3 (5/8/2026) — LÀM LẠI GIAO DIỆN TRẬN ĐẤU THEO BẢN VẼ THẦY GỬI

Thầy gửi ảnh bàn phím + 15 điểm 1 lượt để làm lại màn chơi. **CÓ SỬA CORE 1 dòng** (mục 6, thầy
duyệt trước) — mọi thứ khác chỉ trong `templates/running-word/`.

1. **`.act-running_word`** — `core/engine.js` gắn class này vào `.aw-stage` ngay khi dựng khung
   (mọi activity, không riêng game này), TRƯỚC CẢ màn READY. RUNNINGW dùng class này thay hẳn
   `:has(.aw-rw-card)` cho khung 4:3 + ẩn 3 nút — nay đúng "ngay từ khi mở app" thật sự, đo được:
   `stage.className` đã có `act-running_word` và tỉ lệ 4:3 **trước khi bấm PLAY**.
2. **Ẩn Assignment/Template/Print từ đầu** — 3 nút này không dùng cho 1 trận 2 đội đang chạy trực
   tiếp (Print có sẵn ngay trong màn setup của game). Ẩn qua class ở mục 1, không đụng JS dựng nút
   của engine.
3. **Nút Fullscreen ghim cố định góc phải dưới** (`position:absolute`, mọi màn hình: setup/prep/
   trận đấu/kết quả, fullscreen hay không) — tách hẳn khỏi dòng chảy flex của thanh dưới.
4. **Bàn phím về ĐÚNG size gốc của core** — bỏ hẳn khối đè `--kbd-kw`/`--kbd-caps-w`/... đã làm ở
   Đợt 1 (khi đó thu nhỏ để vừa khung 16:9); nay khung 4:3 + đã bỏ thanh trên + bảng chỉ còn 3 dòng
   nên dư chỗ, không cần thu nữa. Đo: `--kbd-kw` đọc ra đúng `5cqw` (giá trị mặc định của core, y hệt
   Type the answer/Crossword).
5. **Một ô điền chữ thật to, chỉ hiện 3 dòng** — `.aw-rw-rows` chuyển sang `display:flex;flex-
   direction:column`, mỗi `.aw-rw-row` ăn đúng `flex-basis:33.334%` CHIỀU CAO CỦA CHÍNH KHUNG CUỘN
   (không phải cỡ chữ cố định đoán mò) — nên dù chiều cao thật của khung thay đổi theo layout, luôn
   ra ĐÚNG 3 dòng hiện, dòng 4 trở đi phải cuộn. Đo thật: khung cuộn cao 205.25px, 1 dòng 66.98px →
   205.25/66.98 = **đúng 3.00**. Cỡ chữ đo được 34.27px (~26pt) — không còn ép cứng theo cqw đoán
   trước, mà tự nhiên lớn ra nhờ dòng cao hơn.
6. **Bảng 70/30 tự giãn có animation khi đảo lượt** — `.aw-rw-boards` đổi từ `grid` sang `flex`,
   mỗi `.aw-rw-board` có `flex:1 1 0%` + `transition: flex-grow .45s`; đội đang đến lượt
   `flex-grow:7`, đội chờ `flex-grow:3`, KHÔNG lượt nào (màn "prep", xem mục 8) thì cả hai
   `flex-grow` mặc định bằng nhau = 50/50. Chọn `flex-grow` thay vì animate `grid-template-columns`
   vì grid không animate mượt đều trên mọi trình duyệt, flex thì có. Đo thật: chọn đội A → sau
   450ms width đo được 396.8px / 171.2px = **69.9% / 30.1%** (khít 7:3).
7. **Chữ trong bảng luôn căn giữa** — `.aw-rw-row-body` + `.aw-rw-input` + `.aw-rw-reveal`
   (Andrew) đều `text-align:center` (trước đó body/input để mặc định trái, reveal để phải).
8. **Bỏ "TEAM X · word N of M"** dưới bàn phím, thay bằng **slogan "RUNNING WORD IN ANDREW CLASSES"**
   — cùng kiểu chữ mảnh/thưa/xám như Crossword và Speaking cards (`.aw-rw-slogan`, đặt ở đáy khung
   thay vì đỉnh như 2 game kia). `paintNav()` nay luôn gọi `ui.setNav({label:""})`.
9. **Bỏ tên đội khỏi đồng hồ, đồng hồ đẩy lên sát mép trên** — mỗi `.aw-rw-clock` giờ chỉ còn
   `.aw-rw-clock-time`, hộp thu ngắn theo chiều cao (bỏ dòng tên) nhưng cỡ chữ đồng hồ TĂNG
   (4.4cqw → 4.8cqw) vì có thêm chỗ.
10. **Tên đội dời ra giữa bảng gõ từ** — `.aw-rw-rowhead` đổi `justify-content` từ
    `space-between` sang `center`, chỉ còn 1 span tên đội (bỏ span "N words").
11. **Số từ còn lại ra giữa bảng, phía dưới, chỉ 1 số** — thêm `.aw-rw-remaining` (footer riêng,
    NGOÀI vùng cuộn `.aw-rw-rows` nên không bị cuộn mất), tính `list.length − idx[t]` (còn lại,
    không phải đã xong), không còn chữ "words".
12. **Bỏ nút ẩn/hiện bàn phím** — xoá hẳn `hasKeyboardToggle`, `keyboardVisible`, nút trong
    `ui.kbdSlot`; bàn phím dựng ngay khi vào "prep" (màn trận đấu vừa hiện), luôn hiện.
13. **SET có DELETE + đồng bộ máy khác** — nút "DELETE SET" hiện trên MỌI slot đã lưu (không chỉ
    slot đang chọn); bấm → `confirm()` → xoá → `saveActivity()` — **CÙNG một đường lưu** với nút
    Save, nên tự động đồng bộ qua Firestore tới máy/iPad khác giống hệt việc lưu bình thường, không
    cần hạ tầng mới. ⭐ **Sửa luôn 1 kiểu lưu trữ có thể gây lỗi thật** khi có DELETE: bản cũ
    `saveCurrentSet()` NÉN mảng `printSets` bằng `.filter(...)` trước khi lưu — xoá SET 1 khỏi
    `[A,B,C]` từng làm B tụt xuống vị trí 1, C tụt xuống vị trí 2 sau khi tải lại (đổi số SET âm
    thầm). Đổi `readSets()`/lưu sang **theo đúng vị trí** (mảng có thể chứa `null` = ô trống, không
    còn bị nén) — slot i luôn là SET i+1, xoá 1 ô không đụng 2 ô kia. `running-word-editor.js` cũng
    phải sửa theo (đọc `readSets()` giờ có thể trả `null` xen giữa).
    **Shuffle new split khoá lại** khi slot đang chọn đã lưu (`disabled = !dirty`) — phải bấm
    DELETE SET trước mới xáo lại được, để tờ đã in không bao giờ âm thầm lệch với game.
14. **Nút PASS lộ từ màu đen** — bỏ luật "không bao giờ lộ từ" CHỈ riêng cho trường hợp PASS (đúng
    yêu cầu thầy — đội kia có thể thấy từ vừa bị bỏ qua); `.aw-rw-row.is-passed .aw-rw-row-body`
    đổi từ `var(--aw-muted)` (mờ, hiện "—") sang `var(--rw-ink)` (đậm, hiện chữ thật).
15. **Nút Play/Pause to giữa 2 đồng hồ, thay hẳn Pause+Undo cũ** — `.aw-rw-playpause` hình tròn,
    icon Play khi chưa chạy (kể cả đang "prep" chờ bấm), icon Pause khi đang chạy, mờ đi
    (`:disabled`) khi chưa chọn đội (prep) hoặc đã hết ván. Bấm lúc "prep" (đã chọn đội) → chạy
    3-2-1 rồi vào trận; bấm lúc đang chơi → tạm dừng/chạy tiếp. **Nút Undo bị bỏ hẳn** (cùng
    `snapshot()`/`doUndo()`/`undoSnap` — dọn sạch, không còn dùng). Lúc tạm dừng: 2 bảng gõ + bàn
    phím mờ xuống 40% (`.is-dimmed`, `:has()` bắt luôn bàn phím), nhưng nút Play/Pause GIỮ NGUYÊN
    độ sáng để luôn có chỗ bấm chạy tiếp — đo thật: `opacity` 2 bảng và bàn phím đều về đúng `0.4`
    sau khi tạm dừng, quay lại `1`/`.6` sau khi bấm tiếp.

### ⭐ Luồng trận đấu ĐỔI HẲN: thêm màn "prep" giữa START MATCH và 3-2-1

Trước: bấm START MATCH → 3-2-1 luôn. Nay: bấm START MATCH → vào **"prep"** (`phase` mới, giữa
`"setup"` và `"countdown"`) — hiện đủ 2 bảng NGANG NHAU (`turn = null`, chưa đội nào được chọn),
đồng hồ đứng yên. Trọng tài **chạm vào 1 bảng** để chọn đội đi trước (bảng đó giãn ra 70%, nút
Play/Pause mở khoá) — chạm bảng kia để đổi ý bất cứ lúc nào trước khi bấm Play. Bấm nút Play mới
chạy 3-2-1 rồi vào "play" (đồng hồ bắt đầu chạy, gõ được). `paintBoard()` tính độ giãn theo
`showSplit = phase is "prep"/"countdown"/"play"` — cùng 1 công thức xuyên suốt 3 giai đoạn, không
phải viết riêng cho từng giai đoạn.

### Tự test đã chạy (trình duyệt thật qua devserver, sau cả 2 đợt sửa)

- Khung + nút ẩn: `stage.className` đã có `act-running_word` VÀ tỉ lệ đo được đúng 4:3 **trước khi
  bấm PLAY** (còn ở màn READY); nút Template/Set assignment/Print `display:none` cùng lúc; nút
  Fullscreen `position:absolute` sẵn từ đầu. Hồi quy: mở `type-the-answer/test.html` — vẫn
  `act-type_the_answer`, tỉ lệ đúng 16:9, 0 lỗi console (đúng cam kết core chỉ CỘNG THÊM).
- Prep: bấm START MATCH → 2 bảng đúng bằng nhau (cả 2 `is-pickable`, không bảng nào `is-active`),
  bàn phím đã dựng, Play/Pause `disabled=true`. Chạm bảng A → `is-active`/nút mở khoá ngay; đo sau
  450ms width 396.8px/171.2px = đúng 70/30.
- Chơi thật: bấm Play → 3-2-1 → trận chạy (đồng hồ đếm ngược đúng), 3 dòng hiện đúng
  (205.25/66.98=3.00), cỡ chữ 34.27px; bấm PASS → từ hiện màu ink thật (không còn "—"), đổi lượt
  đúng; bấm Play/Pause giữa trận → cả 2 bảng + bàn phím `opacity=0.4`, bấm lại → về bình thường; gõ
  đúng từ Andrew tiết lộ → điểm cộng, remaining giảm 40→39, đổi lượt — **0 lỗi console** suốt.
- SET delete: dựng 1 act giả có SET 1 đã lưu sẵn → Shuffle tự khoá đúng tooltip, đúng 1 nút DELETE
  SET hiện (chỉ ở slot đã lưu); bấm xoá (chưa đăng nhập) → lỗi được bắt gọn bằng toast/`console.warn`,
  không crash — cùng hành vi với nút Save khi chưa đăng nhập (nhất quán).

⚠️ **Vẫn còn 3 việc chỉ thầy làm được** (không đổi so với Đợt 1): xem khung + đồng hồ + bảng 70/30
trên TOMKO thật; bấm fullscreen thật trên iPad (Fullscreen API cần cử chỉ người dùng thật); in thử
giấy A4 thật.

## 8d. ⭐ ĐỢT 3 (5/8/2026, v0.9.45) — 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ. KHÔNG ĐỤNG CORE.

Thầy chơi bản Đợt 2 rồi gửi ảnh + 8 điểm. Chỉ 2 file: `running-word.js`, `running-word.css`.

1. **Nút Play/Pause nhạy + hình vuông bo tròn.** ⭐ **Bắt được lỗi thật gây "lúc bấm được lúc
   không"**: `paintClocks()` chạy mỗi 100ms (mỗi nhịp đồng hồ) và **gán lại `innerHTML` của nút mỗi
   lần** → thẻ `<svg>` con bị thay mới 10 lần/giây; một cú chạm mà `pointerdown` rơi vào SVG cũ còn
   `pointerup` rơi vào SVG mới thì **trình duyệt không phát sự kiện `click`** → mất cú bấm. Vá 2 lớp:
   (a) chỉ đổi `innerHTML` **khi icon THỰC SỰ đổi** (lưu `refUI._icon`), (b) `svg { pointer-events:
   none }` để cú chạm luôn rơi vào NÚT chứ không vào SVG con. Đo: bấm 4 lần liên tiếp play→pause→
   play→pause đều đổi icon+class đúng, không lần nào kẹt. Hình: tròn → **vuông bo tròn** (`border-
   radius:1.4cqw`), thu còn 5.4cqw.
2. **Slogan về hàng nút Menu + đổi màu nhìn được.** Bản Đợt 2 slogan là `div` position:absolute đáy
   khung → **đè lên bàn phím** (ảnh thầy gửi), lại màu xám nhạt trên nền trắng khó thấy. Nay bỏ hẳn
   div đó, **đưa slogan vào NHÃN NAV** (`ui.setNav({label:SLOGAN})`) — nằm giữa thanh dưới, **cùng
   hàng nút Menu**, 2 mũi tên 2 bên đã ẩn (`visibility:hidden`) nên chỉ còn slogan ở giữa; màu
   `var(--aw-muted)` (xám đậm, rõ trên nền trắng). Style thin/spaced/uppercase kiểu Crossword. Đo:
   nhãn hiện đúng "RUNNING WORD IN ANDREW CLASSES", màu rgb(107,122,144), nằm ở dải nút Menu.
3. **Icon loa ↔ fullscreen hết đè nhau.** Nguyên nhân: Đợt 2 ghim `.aw-fs-always { position:
   absolute; right/bottom }` → nút fullscreen tách khỏi dòng chảy và đúng chỗ nút loa (cũng ở góc
   phải thanh dưới) → 2 cái chồng. Vá: **bỏ hẳn cái ghim** — fullscreen nằm tự nhiên trong cụm
   `.aw-tools` (loa + fullscreen) vốn LUÔN ở góc phải-dưới thanh dưới ở mọi trạng thái, nên vẫn
   "luôn góc phải dưới" như thầy muốn mà không đè. Đo: fs [495-515] vs loa [472-493] — tách hẳn.
4. **Chữ trong ô tự co, hết "…" (và mọi ô cùng cỡ).** Mỗi bảng có biến `--rw-fit`: hàm `fitBoard()`
   dùng 1 span PROBE đo bề rộng thật của từ ở cỡ gốc (5.6cqw), so với bề rộng cột hiện có; lấy tỉ lệ
   để **từ RỘNG NHẤT trong 3 ô vừa khít**, rồi mọi ô/ô-nhập/reveal nhân cùng `--rw-fit` → 3 chữ luôn
   CÙNG cỡ, không cái nào bị cắt "…" (đã bỏ luôn `text-overflow:ellipsis`). Chạy lại mỗi lần vẽ +
   theo `ResizeObserver` nên co giãn mượt suốt lúc bảng phình 70%↔30%. Đo bảng hẹp 30% (142px):
   fit=0.711, cả LUXURIOUS/INSCRIBE/REINFORCE cùng 20px, **0 chữ bị cắt**.
5. **Đồng hồ thấp hơn.** `.aw-rw-clocks` đổi `align-items: stretch → center` (trước bị kéo cao bằng
   cột giữa play+pass → thừa khoảng trắng trong hộp), + padding dọc hộp về ~0.15cqw. Đo hộp đồng hồ
   nay cao 28px (trước cao gần gấp đôi).
6. **⭐ Bảng CHỈ 3 Ô — input LUÔN ở đáy, đẩy lên khi đảo lượt** (yêu cầu lớn nhất). Bỏ hẳn kiểu cuộn
   cả danh sách. Mỗi bảng nay là **cửa sổ cố định 3 dòng** (`.aw-rw-rows` overflow hidden), toàn bộ
   từ nằm trên 1 `.aw-rw-track` được **trượt bằng `translateY`** (JS `applyTrack`) sao cho dòng "đáy"
   rơi vào 1/3 dưới. Dòng đáy = ô nhập khi tới lượt mình (`bottomIndexOf` = idx), hoặc từ vừa xong
   khi đang chờ (= idx−1). 2 dòng trên là 2 từ trước. Đảo lượt → track trượt lên 1 dòng (transition
   .35s) = hiệu ứng "đẩy lên". Đo đúng kịch bản thầy tả: gõ từ 5 → hiện 3-4-5 (5 là ô nhập ở đáy);
   submit → chờ, bảng vẫn 3-4-5 (5=done ở đáy); tới lượt lại → **đẩy lên thành 4-5-6**, ô nhập là 6.
   Số dòng đo chính xác 3.00 (viewport 205px ÷ dòng 51px×... = 3). ⭐ Số từ CÒN LẠI ở chân bảng vẫn
   giữ (Đợt 2). Bỏ hàm `keepInView` cũ.
7. **⭐ Sửa màn GAME COMPLETE bị kẹt (thầy báo hết giờ thì không bấm gì được).** Nguyên nhân đo được:
   bảng kết quả riêng `.aw-rw-result` để **z-index 45**, còn bảng tổng kết của engine (`.aw-backdrop`
   chứa GAME COMPLETE) chỉ **z-index 13** → bảng kết quả CHE MẤT bảng tổng kết, thầy thấy màn kết quả
   không nút bấm còn bảng thật thì nằm dưới. Vá: khi tới lúc gọi `ui.finish()` (sau 2.6s ngắm bảng
   kết quả) thì **gỡ hẳn `.aw-rw-result`** → bảng GAME COMPLETE hiện lên trên cùng, bấm được. Đo:
   sau khi hết ván, `.aw-rw-result` đã biến mất, `.aw-panel` "TEAM A WINS" hiện với 4 nút
   (Leaderboard / Show answers / Start again / Play a different template), `elementFromPoint` giữa
   panel trả về chính panel (không bị chặn); bấm "Start again" → về màn READY đúng.
8. **Bàn phím giữ đúng size gốc** (đã làm ở Đợt 2, xác nhận lại không bị 4:3 làm méo): `--kbd-kw`
   vẫn `5cqw` như Type the answer.

**Bài học đo đạc (dùng lại được):** khi kiểm tra "đội nào đang active" bằng script, ĐỪNG viết
`className.includes('is-a')` — chuỗi `is-active` CHỨA `is-a` nên luôn khớp nhầm. Dùng
`classList.contains('is-active')` + kiểm `is-a`/`is-b` riêng.

**Tự test devserver (trình duyệt thật, 0 lỗi console suốt):** khung vẫn 4:3; play/pause vuông bo
tròn + toggle 4 lần đều đúng; slogan ở hàng Menu màu xám rõ; loa/fullscreen tách hẳn; cửa sổ 3 ô
đúng kịch bản gõ-5 → đẩy-lên-6; bảng hẹp 30% co chữ cùng cỡ 0 cắt; đồng hồ thấp 28px; hết ván →
GAME COMPLETE hiện + bấm được + Start again về READY.

⚠️ **Vẫn 3 việc chỉ thầy làm được** (không đổi): TOMKO thật, fullscreen iPad thật, in giấy A4 thật.

## 8e. ⭐ ĐỢT 4 (5/8/2026) — ĐỔI FULLSCREEN THẬT SANG "ZOOM CSS" (chỉ RUNNINGW). CÓ SỬA CORE.

Thầy tự chơi thật trên iPad (Chrome, iPad M1 12.9") sau khi bấm Fullscreen thật (Đợt 2/3 vẫn dùng
Fullscreen API thật) và báo **4 vấn đề đều là hành vi của chính Fullscreen API trên iPad Chrome**,
không sửa được bằng JS:

1. Chrome tự vẽ 1 nút X to góc trên để thoát — không tắt được.
2. Chỉ nhẹ tay vuốt xuống là **mất fullscreen** — cực kỳ dễ xảy ra khi trẻ chạm gần mép trên (đúng
   chỗ 2 đồng hồ đứng), làm gián đoạn ván đấu.
3. **Mất fullscreen ngay sau màn 3-2-1** — trải nghiệm tệ, vào trận là đã văng ra ngoài.
4. Chrome tự bật popup "Do you want to stay in fullscreen?" giữa chừng — chặn thao tác.

Thầy so sánh với chính Wordwall (ảnh chụp `wordwall.net` trên cùng iPad): nút "fullscreen" của
Wordwall **không hề gọi Fullscreen API thật** — thanh tab + thanh địa chỉ Chrome vẫn còn nguyên,
Wordwall chỉ phóng nội dung game lấp đầy viewport bằng CSS. Đổi lại: **tuyệt đối ổn định** (không
cử chỉ hệ thống nào can thiệp được), đánh đổi là không che được thanh trình duyệt.

**Quyết định (thầy chốt sau khi được hỏi phạm vi):** làm theo kiểu Wordwall, nhưng **CHỈ áp dụng
cho RUNNINGW trước** — 14 game kia giữ nguyên Fullscreen API thật, chưa đổi. "Khi nào ổn định và
chuẩn ta sẽ chỉnh các app khác sau."

**Cơ chế mới — cờ `tpl.useZoomFullscreen` (core/engine.js):**
- `setZoomed(root, fsBtn, on)` (hàm module-level mới): toggle class `aw-zoomed` trên `root` (chính
  là phần tử Fullscreen thật vẫn nhắm tới — nên mọi lý luận "root ổn định qua Start again" áp dụng
  y hệt) + class `is-zoomed` trên `fsBtn` (để CSS tô sáng nút, thay cho việc real fullscreen có sẵn
  banner của Chrome làm dấu hiệu "đang bật") + khoá cuộn trang nền
  (`document.documentElement.style.overflow="hidden"`, vì zoom không có top-layer promotion như
  Fullscreen thật nên trang phía sau lý thuyết vẫn cuộn được).
- `fsBtn.onclick`: `tpl.useZoomFullscreen` → gọi `setZoomed`; không có cờ → y hệt code cũ
  (`requestFs`/`exitFs`). **Zero-diff cho 14 game không đặt cờ.**
- `exitAnyFullscreen()` (hàm mới, thay cho `if (fsElement()) exitFs()` lặp lại 2 chỗ): gỡ CẢ 2 kiểu
  fullscreen — dùng ở `homeBtn`/`editBtn` (rời game vẫn phải thoát fullscreen dù là fullscreen thật
  hay zoom).
- `fsBtn` mới dựng mỗi lần `startGame()` chạy lại (Start again giữ `root` nhưng xoá `innerHTML`) nên
  đọc lại `root.classList.contains("aw-zoomed")` lúc tạo nút để đồng bộ class `is-zoomed` — khớp
  hành vi cũ "Start again giữ nguyên fullscreen".

**CSS — toàn bộ nằm trong `running-word.css`, KHÔNG đụng `core/app.css`:** 1 khối mới ngay dưới
khối `:fullscreen` cũ, cùng hình dạng (`.aw-zoomed` thay `:fullscreen`, double-guard bằng
`:has(.aw-stage.act-running_word)` dù cờ JS đã đảm bảo class chỉ bật cho game này) — `root` được
`position:fixed;inset:0;z-index:9000` (không có top-layer thật nên phải tự ghim), `.aw-page` lấp
100%/100%, `.aw-stage` giữ đúng công thức 4:3 letterbox cũ (`min(100vw, 100dvh*4/3)`, có dự phòng
`vh` cho trình duyệt chưa hiểu `dvh`), ẩn `.aw-below`/`.aw-as-bars`/nav/toolbar y hệt fullscreen
thật. Nút Fullscreen tô sáng màu accent khi `is-zoomed` (dấu hiệu duy nhất báo "đang zoom, bấm lại
để thoát" — vì không còn banner nào của trình duyệt làm việc đó nữa).

**Tự test (devserver, DOM thật, không giả lập cử chỉ hệ thống được):**
- Bấm nút Fullscreen trên `running-word/test.html` → `#app` có class `aw-zoomed`, `document.
  fullscreenElement` vẫn `null` (xác nhận **không hề gọi** Fullscreen API thật), tỉ lệ khung đo
  được đúng 4:3 (960×720 = 1.333), nền `rgb(11,11,13)`, `.aw-below` `display:none`, `document.
  documentElement.style.overflow` = `"hidden"`.
- Bấm lại → gỡ sạch cả 2 class + trả lại `overflow`.
- Bấm Home lúc đang zoom → `exitAnyFullscreen()` gỡ đúng, `#app` về `className=""`.
- Hồi quy: `quiz/test.html` bấm Fullscreen → **có gọi** `Element.prototype.requestFullscreen` thật
  (đo bằng cách tráo hàm tạm thời), KHÔNG có class `aw-zoomed`/`is-zoomed` nào xuất hiện — đúng
  "zero-diff", 14 game khác không đổi gì. `type-the-answer/test.html` mount 0 lỗi console.

⚠️ **Máy không tự vuốt màn hình / không tự bấm nút cần cử chỉ người dùng thật được**, nên 4 điều
thầy báo (banner X, vuốt-mất, mất-sau-3-2-1, popup "stay fullscreen") chỉ có thể xác nhận ĐÃ HẾT
bằng cách thầy tự chơi lại trên chính iPad đó. Về lý thuyết cả 4 đều hết vì không còn lời gọi
Fullscreen API thật nào nữa trong đường này — nhưng "lý thuyết" khác "thầy cầm iPad chơi thật".

## 8f. Đợt 5 (5/8/2026) — NÚT FULLSCREEN GHIM GÓC + ĐIỀU TRA LỖI CỬA SỔ 3 DÒNG CỦA TEAM B

Thầy chơi bản zoom mới (Đợt 4) và gửi 2 việc: (1) nút Fullscreen cần dọn về góc dưới-phải, nhỏ, trong
suốt, thật kín đáo; (2) ảnh chụp cho thấy bảng TEAM B lúc đang chơi không hiện đủ 3 dòng như TEAM A.

**1. Nút Fullscreen ghim góc (`running-word.css`).** Trước đó nút nằm TRONG cụm `.aw-tools` (theo
dòng chảy flex, cạnh Sound) — đủ dùng ở trạng thái thường nhưng trong `.aw-zoomed` nó trôi lệch, to,
có nền sáng, khá nổi. Nay khi `.aw-zoomed` bật: `position:absolute;right/bottom:0.8cqw` ghim vào
ĐÚNG góc của `.aw-stage` (mượn `.aw-stage-inner` — core — vốn đã `position:absolute;inset:0` làm nơi
neo), thu còn 2.2cqw, nền trong suốt, `opacity:.45` lúc nghỉ (chạm/hover lên `.85`). Chỉ scope trong
`.aw-zoomed .aw-stage.act-running_word .aw-fs-always` — trạng thái thường (không zoom) giữ nguyên vị
trí cũ trong `.aw-tools` cạnh Sound, vì ghim tuyệt đối ở ĐÓ từng đụng độ với icon Sound (Đợt 3d mục
3) — nay không đụng vì trong `.aw-zoomed` Sound đã bị ẩn hẳn (`.aw-tools .aw-iconbtn:not(.aw-fs-
always){display:none}`), không còn nguy cơ chồng. Đo (đã vá lỗi đo — xem mục "bẫy đo đạc" dưới): góc
nút cách 2 cạnh stage đúng ~11px, kích thước 30×30px (khớp 2.2cqw ở khung ~1360px rộng), nền
`rgba(0,0,0,0)`, `opacity` đúng `0.45` sau khi ép hoạt ảnh xong.

**2. Điều tra lỗi "TEAM B không hiện đủ 3 dòng" — ĐÃ VÁ 1 NGUYÊN NHÂN THẬT, KHÔNG TÁI HIỆN ĐƯỢC
NGUYÊN VĂN LỖI THẦY BÁO.** Đọc lại toàn bộ cơ chế cửa sổ 3-dòng (`measureRow`/`applyTrack`/
`bottomIndexOf`/`paintBoard`) và lái 1 trận thật qua devserver (đóng vai trọng tài, bấm PASS liên
tục 16 lượt liền — không dừng giữa chừng để tránh đồng hồ tự trôi thật giữa các lệnh, một bẫy đã
cắn khi test lần đầu khiến TEAM B hết giờ oan) rồi soi DOM từng bước một:

- 4 lượt ĐẦU trận: đúng là chỉ hiện 1-2 dòng (chưa đủ 2 từ trước đó để lấp 2 ô trên) — đây là **hành
  vi ĐÚNG THIẾT KẾ**, không phải lỗi (2 dòng trên vốn nghĩa là "2 từ mới xong", đầu trận chưa có).
- Từ lượt 5 trở đi (12 lượt liên tiếp sau đó, kiểm cả 2 đội mỗi lượt): **luôn đúng 3 dòng, dòng
  đang gõ luôn ở ĐÁY** — không tái hiện được kiểu lỗi trong ảnh thầy gửi (dòng đang gõ ở TRÊN, 2 dòng
  CHƯA CHƠI ở dưới — đúng chiều NGƯỢC với chủ đích, đáng lẽ đây là bất khả thi theo code hiện tại vì
  `bottomIndexOf` luôn trả chỉ số hiện tại/lớn nhất khi đến lượt, không bao giờ trả chỉ số bé hơn 2
  dòng phía sau).
- ⭐ **Vẫn tìm ra 1 điểm chưa chắc chắn thật sự trong code, đã vá phòng ngừa**: `measureRow()` (đo
  chiều cao 1 dòng = 1/3 chiều cao khung cuộn) trước đây CHỈ chạy lúc `buildRows()` (1 lần lúc vào
  trận) và trong callback của `ResizeObserver` (chỉ khi khung board đổi KÍCH THƯỚC thật) — **không hề
  chạy lại trong `paintBoard()`** mỗi lượt. Vì mỗi lần đảo lượt bảng 70/30 CŨNG đổi kích thước (nên
  `ResizeObserver` thường bắt kịp), nhưng đây là 2 cơ chế ASYNC riêng nhau, không đảm bảo thứ tự — có
  khả năng thật (dù không ép được trên môi trường tự test) là `paintBoard()` chạy trước khi
  `ResizeObserver` kịp đo lại, dùng `--rw-rowh` CŨ một nhịp, khiến cửa sổ trông hụt dòng đúng lúc đảo
  lượt. Đã vá: gọi `measureRow(t)` NGAY ĐẦU mỗi `paintBoard()`, không còn phụ thuộc thời điểm của
  `ResizeObserver` nữa — rẻ (chỉ đọc `clientHeight`), không đổi hành vi khi kích thước thật sự không
  đổi.

⚠️ **Trung thực về giới hạn phần điều tra này**: đã KHÔNG tái hiện được đúng hình ảnh lỗi thầy chụp
(current ở trên + 2 dòng tương lai ở dưới) trong 16 lượt kiểm liên tục — bản vá ở trên là ứng viên
HỢP LÝ NHẤT tìm được qua đọc code, không phải "đã bắt tận tay". **Cần thầy chơi lại bản này** — nếu
còn thấy lại y hệt kiểu lỗi cũ, xin gửi thêm: đúng lúc nào xảy ra (ngay khi đảo lượt hay xảy ra rồi ở
yên?), có tự hết sau ~1 giây không, và nếu tiện — quay màn hình vài giây quanh lúc đảo lượt (ảnh tĩnh
rất khó phân biệt "current ở đáy" hay "current ở đỉnh" khi 2 dòng future cũng chỉ hiện mỗi con số).

**⭐ Bẫy đo đạc mới (dùng lại được cho mọi lần sau đo trong công cụ này):** phiên bản trình duyệt
dùng để tự test KHÔNG compositing (pane ẩn) — mọi CSS `transition`/animation bị ĐÓNG BĂNG ở giá trị
TRƯỚC lúc đổi (không tiến được, khác hẳn cắn thật lúc pane hiện thì animation vẫn chạy chỉ đơn giản
không thấy được, ở ĐÂY animation không hề tiến chút nào). `getComputedStyle` do đó đọc ra giá trị CŨ
mãi mãi cho MỌI thuộc tính có `transition` (bắt gặp với `flex-grow` của bảng 70/30 VÀ `opacity` của
nút Fullscreen). Cách đo đúng: `el.getAnimations().forEach(a => a.finish())` — SCOPE ĐÚNG PHẦN TỬ
đang đo, KHÔNG gọi `document.querySelectorAll('*').forEach(...)` trên toàn trang (đã thử, ép luôn cả
animation "PLAY overlay fade-out" khiến trang tự rebuild về màn READY ngoài ý muốn — phải tải lại
trang làm sạch).

## 8g. Đợt 6 (5/8/2026) — ZOOM LẤP KÍN MÀN HÌNH, BỎ KHOÁ 4:3

Thầy chơi bản ghim-góc (Đợt 5), báo 2 điểm đó ổn, gửi thêm 1 việc mới: trên Chrome iPad, chế độ zoom
hiện 2 dải đen 2 bên trái-phải (đúng ảnh thầy gửi lúc báo lỗi TEAM B — cùng 1 tấm, lần này thầy chỉ
ra chi tiết dải đen). Yêu cầu: lấp kín toàn màn hình, tự chỉnh theo MỌI trình duyệt/kích thước, kể cả
khi trình duyệt thay đổi/cập nhật trong tương lai — không được hard-code theo 1 hình dạng máy cụ thể.

**Nguyên nhân**: công thức letterbox cũ (`width: min(100vw, calc(100dvh * 4/3)); height:auto`) COPY
Y HỆT công thức của khung REST (khung 4:3 lúc chưa zoom, xem mục 8b — chọn 4:3 vì "màn iPad gần 4:3")
sang cho cả lúc zoom — ép cứng tỉ lệ 4:3 dù màn zoom không có lý do gì phải giữ đúng tỉ lệ đó. Viewport
THẬT của Chrome trên iPad (sau khi trừ thanh tab/địa chỉ) không khớp đúng 4:3 tuyệt đối → hụt theo 1
chiều → dải đen bù vào chiều kia.

**Sửa**: bỏ hẳn công thức `min(...)` ép tỉ lệ, thay bằng `width:100%; height:100%` — tức khung LUÔN
khít đúng `.aw-page` (đã là `100%` của khung zoom cố định `.aw-zoomed`, tức là ĐÚNG BẰNG viewport
thật). Cho CẢ width VÀ height cùng là giá trị tường minh cũng tự triệt tiêu luôn luật
`aspect-ratio:4/3` ở trên (luật CSS: `aspect-ratio` chỉ dùng để SUY RA chiều còn thiếu — có đủ cả 2
chiều rồi thì không còn gì để suy). **Không có con số px/vw/vh cứng nào trong luật mới** — thuần
`%`, nên trình duyệt tự tính lại `100%` mỗi khi viewport đổi (xoay ngang/dọc, thanh trình duyệt
ẩn/hiện, đổi trình duyệt, đổi máy, phiên bản Chrome sau này đổi cách tính `dvh`...) mà KHÔNG cần sửa
code lần nào nữa — đúng yêu cầu "tự điều chỉnh khi trình duyệt thay đổi trong tương lai". Khung REST
(chưa zoom) không đụng, vẫn giữ nguyên 4:3 như trước (chỉ 1 dòng CSS đổi, scope `.aw-zoomed
.aw-stage.act-running_word`).

**Tự test (devserver, viewport CỐ Ý không phải 4:3 để ép lộ dải đen nếu còn)**: dựng cửa sổ
1366×900 (tỉ lệ 1.518, khác hẳn 4:3=1.333 — trước đây chắc chắn ra dải đen ở công thức cũ) → bấm
Fullscreen → đo `stage.getBoundingClientRect()` = **đúng 1366×900, khít 100% appRect cả 4 cạnh, 0
khoảng hở** (trước: sẽ ra ~1200×900 kèm ~83px dải đen mỗi bên theo công thức cũ). Bấm lại → về khung
REST vẫn đúng tỉ lệ 4:3 968×726 như cũ (968/726=1.333) — xác nhận khung nghỉ không bị đụng. 0 lỗi
console.

⚠️ **Đánh đổi đã biết, thầy nên biết trước**: bỏ khoá 4:3 nghĩa là hình dạng khung lúc zoom sẽ theo
ĐÚNG hình dạng thật của viewport máy đang dùng (có thể hơi khác 4:3 một chút tuỳ máy/trình duyệt) —
mọi cỡ chữ/khoảng cách trong game vẫn dùng `cqw` (tỷ lệ theo BỀ RỘNG khung) nên không vỡ layout,
nhưng NẾU máy nào có tỉ lệ lệch rất xa 4:3 (ví dụ màn siêu rộng) thì bố cục có thể trông hơi kéo giãn
theo chiều đó — đổi lại luôn LẤP KÍN, không còn dải đen. Đây đúng là điều thầy yêu cầu (ưu tiên lấp
kín + tự thích ứng hơn giữ đúng hình chữ nhật 4:3 hoàn hảo).

## 8h. ⭐ Đợt 7 (5/8/2026) — TÌM RA GỐC LỖI TEAM B TRÊN iPAD (đã tái hiện được!) + IN 1 CỘT + KHOÁ ZOOM CHẠM ĐÚP

Thầy gửi 3 việc. Việc số 1 là lỗi đã đuổi theo suốt 2 đợt (8f không tìm ra) — **đợt này bắt được tận
tay, tái hiện được bằng script, và vá đúng gốc.**

### 1. ⭐⭐ LỖI TEAM B — NGUYÊN NHÂN THẬT: WebKit TỰ CUỘN để lộ con trỏ nhập

**Triệu chứng:** đội ĐANG ĐẾN LƯỢT hiện từ đang gõ ở **TRÊN CÙNG** với 2 dòng CHƯA CHƠI bên dưới,
đáng lẽ phải ở **ĐÁY** với 2 từ vừa xong ở trên. Đội kia luôn đúng. Chỉ trên iPad Chrome, Windows
không bao giờ bị.

**Cách lần ra:** đo hình học trên chính ảnh thầy chụp — độ lệch là **ĐÚNG 2 DÒNG**, tức đúng bằng
khoảng cách từ ô đáy (khe 2) lên ô đỉnh (khe 0). Con số "đúng 2 dòng" đó không thể là ngẫu nhiên, và
nó chỉ thẳng tới một hành vi có tên: **"cuộn để lộ phần tử, canh vào ĐẦU khung cuộn"**.

**Nguyên nhân:** cửa sổ 3 dòng (`.aw-rw-rows`) chứa ô `<input>` DUY NHẤT của trận. WebKit (nhân của
mọi trình duyệt trên iPad, kể cả Chrome) lộ ô nhập đang focus / con trỏ đang chạy bằng cách **CUỘN
khung cuộn gần nhất** — và `overflow:hidden` **VẪN LÀ một khung cuộn**: `hidden` chỉ chặn NGÓN TAY
cuộn, còn trình duyệt và `scrollTop` vẫn chạy thoải mái. WebKit canh ô nhập vào ĐẦU khung → kéo dòng
hiện tại từ khe đáy lên khe đỉnh = lệch đúng 2 dòng. Blink (Chrome trên Windows) không làm cú "lộ"
này → cùng một dòng code mà máy tính bàn trông hoàn hảo.
→ Cũng giải thích luôn **vì sao chỉ 1 đội bị**: chỉ đội đang đến lượt mới giữ ô nhập.
→ `focus({preventScroll:true})` (đã có sẵn trong `focusInput` từ trước) **KHÔNG đủ**: nó chỉ chặn
đúng cú focus, không chặn `setSelectionRange` lẫn cú lộ-con-trỏ sau MỖI phím gõ.

**Bản vá (không đi bắt từng API):** gắn `scroll` listener lên mỗi cửa sổ, hễ bị cuộn là **bật ngay
về 0**. Bất kể thứ gì cuộn nó — focus, đặt vị trí con trỏ, gõ phím, hay một hành vi mới của trình
duyệt đời sau — đều bị vô hiệu; vị trí track do MÌNH `applyTrack()` quyết định, không ai khác.

**⭐ Đã TÁI HIỆN ĐƯỢC lỗi trong trình duyệt (điều Đợt 8f không làm được):**
```
scrollHeight = 3817  vs  clientHeight = 294   → khung "overflow:hidden" VẪN cuộn được (tiền đề của lỗi)
gán scrollTop = 196px (= đúng 2 dòng, mô phỏng WebKit canh vào đầu khung):
   • đo NGAY lúc đó   → ["4:CUR", "5:FUT", "6:FUT"]   ← ĐÚNG Y HỆT ẢNH THẦY CHỤP
   • sau khi guard chạy → ["2:PASS", "3:PASS", "4:CUR"] ✓ đúng, scrollTop về 0
```

### 2. Bỏ nốt phép đo pixel của cửa sổ 3 dòng (dọn sạch mầm lỗi còn lại)

Nhân tiện bỏ luôn `measureRow()`/`b.rowH`/`--rw-rowh` (bản game): trước đây JS đo `clientHeight`
(số nguyên, làm tròn), chia 3, rồi trượt track theo px — tức một con số trong JS phải luôn khớp với
layout CSS qua 2 đường bất đồng bộ. Nay: track cao **đúng bằng cửa sổ** (`height:100%`), mỗi dòng
**đúng `calc(100%/3)`** của track, và cú trượt viết bằng chính đơn vị đó:
`translateY(calc(N * 100% / 3))`. Phần trăm của `translateY` tính theo chiều cao của CHÍNH track, nên
trình duyệt tự tính lại mỗi lần layout — **không còn gì để đo, để nhớ, hay để lệch pha**. Xoay iPad,
thanh trình duyệt ẩn/hiện, đổi tỉ lệ khung, trình duyệt đời sau — cửa sổ vẫn đúng 3 dòng.
Đo xác nhận: track 293.594px = đúng chiều cao cửa sổ; mỗi dòng 97.859px = đúng 1/3.

⭐ **Tác dụng phụ TỐT, ngoài dự tính:** `ResizeObserver` trước đây gọi `applyTrack(t,false)` (ép
`transition:none`) mỗi lần bảng đổi 70/30 — mà bảng đổi 70/30 CHÍNH LÀ lúc đảo lượt → **hiệu ứng
"đẩy lên" .35s thầy yêu cầu ở Đợt 8d thực ra đã bị giết, track nhảy cóc chứ không trượt**. Nay
`ResizeObserver` chỉ còn lo co chữ (`fitBoard`), nên hiệu ứng trượt chạy thật đúng như thiết kế
(đo được: sau 40ms track đang ở giữa đường, sau 500ms mới tới đích).

### 3. In: PART A / PART B luôn 1 CỘT (+ vá 1 lỗi tràn trang chưa ai để ý)

Thầy chốt: PART A và PART B là **một cột chạy dọc** (50 từ = 50 hàng 1 cột); **chỉ tờ CHECK của GV**
mới 2 cột (cột trái = 50 từ PART A, cột phải = 50 từ PART B — vốn đã đúng sẵn). Bỏ hẳn nhánh "chảy 2
cột khi dòng ngắn hơn 5.2mm" trong `metrics()` của `rw-print.js`.

⚠️ **Bỏ nhánh đó vá luôn 1 lỗi thật nó đang che:** tờ CHECK gọi CÙNG hàm `metrics()` và nhận về chiều
cao dòng tính cho **2 cột** (10.12mm với 50 từ) trong khi nó vẽ **1 cột** → 50 × 10.12 = **506mm trên
trang 253mm → tờ CHECK âm thầm tràn sang tờ giấy thứ 4**. Nay cả 3 tờ đều 253mm khít 1 trang.

Đo thật (gọi thẳng `printRunningSheets`, có tem `window.print` giữ ≥300ms đúng luật ở mục 8):
| Pool | Dòng | Cỡ chữ | 2 cột? | Tổng cao |
|---|---|---|---|---|
| 20 từ | 12.65mm | **22.2pt** | không | 253mm ✓ 1 trang |
| 30 từ | 8.43mm | **14.8pt** | không | 253mm ✓ 1 trang |
| 50 từ | 5.06mm | **8.9pt** | không | 253mm ✓ 1 trang |

Đúng 3 trang; PART A/B đầu bảng 3 cột (`№ WORD TURN`), CHECK đầu bảng 4 cột (`№ TEAM A № TEAM B`).
Sàn `ROW_MIN_MM` hạ 5.2→4.2mm: với trần 50 từ/đội thì không bao giờ chạm tới, chỉ để pool tự chế quá
khổ tràn sang trang 2 thay vì co chữ tới mức không đọc nổi.

### 4. Khoá zoom khi chạm đúp

`touch-action: manipulation` trên khung game + trên gốc `.aw-zoomed`. Trình duyệt hiểu là vùng này
không có cử chỉ chạm-đúp nào phải chờ → cú chạm thứ hai được giao thẳng như một cú chạm thường thay
vì bị nuốt vào thao tác phóng to. Game này dính nặng nhất vì **hai người gõ bàn phím ảo liên tục sinh
ra "chạm đúp" suốt mà chẳng ai định phóng to bao giờ**; đổi lại còn được bỏ luôn độ trễ ~300ms mà
trình duyệt vốn giữ để chờ cử chỉ đó, nên phím ăn nhạy hơn. **Cố ý KHÔNG dùng `touch-action:none`**:
làm vậy giết luôn phóng-to-2-ngón, thứ không ai bấm nhầm và nên để lại làm lối thoát.
⚠️ Điểm này **máy không tự nghiệm thu được** (phóng to khi chạm đúp là hành vi của thiết bị cảm ứng
thật) — chỉ xác nhận được rằng luật CSS đã áp đúng (`manipulation` ở cả 2 chế độ) và không rò sang
game khác (Type the answer / Crossword vẫn `auto`).

### Tự test đã chạy (devserver, trình duyệt thật, 0 lỗi console)

- **Tái hiện + vá lỗi iPad**: xem khối đo ở mục 1 trên.
- **10 lượt đảo liên tiếp, đo sau khi hoạt ảnh .35s kết thúc**: cả 2 đội, mọi lượt — **đúng 3 dòng,
  dòng đang gõ luôn ở khe đáy, `scrollTop` luôn 0. 0 bất thường.**
- **In**: bảng số liệu ở mục 3.
- **Zoom**: vẫn lấp kín đúng viewport (1366px), không dải đen (Đợt 6 không bị phá).
- **Hồi quy**: Type the answer + Crossword vẫn `act-*` đúng, tỉ lệ 16:9, `touch-action:auto` (luật mới
  không rò), 0 lỗi console. Không có class `.aw-rw-*` nào lọt sang game khác.

⚠️ **Bẫy đo đạc mới:** đo cửa sổ 3 dòng NGAY sau khi bấm (40ms) sẽ thấy "chỉ 2 dòng" và tưởng là lỗi
— thật ra track đang trượt giữa chừng (hoạt ảnh .35s, nay đã chạy thật, xem mục 2). Phải đợi >400ms
mới đo. Lần đầu tôi tưởng mình vừa gây hồi quy chính vì bẫy này.

## 8i. ⭐ Đợt 8 (5/8/2026) — 7 CẢI TIẾN HIỂN THỊ + GAMEPLAY THẦY GỬI 1 LƯỢT. CÓ SỬA CORE 1 HOOK.

Thầy gửi 6 điểm hiển thị + 1 điểm gameplay. 3 file template (`running-word.js/.css`) + **1 hook opt-in
trong `core/engine.js`** (mục 6.5). Đã tự test bằng cách dựng act nhỏ (pool 6–8 từ đã biết) qua
`engine.startGame` rồi lái đen (dò từng từ trong pool để gõ đúng) — cùng kiểu hộp đen ở Đợt 1.

**1. Bảng MENU kết thúc — làm lại hẳn (CÓ SỬA CORE).** Thầy muốn panel "GAME COMPLETE" (bảng tối do
engine dựng) chỉ còn: tiêu đề + 2 nửa trái/phải, mỗi nửa = TÊN ĐỘI (dòng trên) + ĐIỂM `X/total`
(dòng dưới, to hơn tên, **chữ vàng**) + nút **Start again**. BỎ hẳn: khối Time, nút Leaderboard, nút
Show answers, nút Play a different template, dòng "YOU'RE Nth ON THE LEADERBOARD".
   - Cơ chế: thêm hook `tpl.renderSummary` vào `showSummary()` của core (mục 6.5) — engine dựng tiêu
     đề rồi giao thân panel cho template, `return` sớm. Zero-diff cho 14 game khác (không khai hook).
   - Template: `rwTemplate.renderSummary()` đọc `rwEndData` (biến cấp module, set ngay trước
     `ui.finish()` trong `endMatch`) — chứa tên đội, số từ đúng mỗi đội, tổng từ mỗi đội, winner. Vẽ
     `.aw-rw-sum` (2 `.aw-rw-sum-half`) + 1 nút `Start again` nối thẳng vào `restart` do core truyền
     vào. Vì panel nằm trong backdrop NGOÀI `.aw-rw-card`, biến `--rw-a/--rw-b` không tới được → màu
     đội dùng literal `#3b82f6/#f59e0b`.
   - **Vẫn giữ**: confetti + lưu leaderboard nội bộ (game vẫn `scorable`, `ui.finish` chạy như cũ) —
     chỉ ẩn phần HIỂN THỊ, không bỏ lưu. Điểm hiện `won/total` mỗi đội (vd 8/8), không phải tổng.
   - Đo: head "REDS WINS"; 2 nửa REDS 8/8 (winner) + BLUES 8/8; màu điểm `rgb(255,207,51)` (vàng);
     `menuItems=["Start again"]` DUY NHẤT; `hasTimeStat=false`, `hasRankLine=false`. Start again →
     về màn READY, panel biến mất, stage vẫn `act-running_word`.

**2. Bàn phím to thêm 15% giữ nguyên tỷ lệ.** Dùng `transform: scale(1.15)` trên `.aw-rw-card .aw-kbd`
   — 1 dòng, scale ĐỀU nên mọi tỉ lệ (phím, khe, font, bo góc, "lip") y hệt core, chỉ to lên 15%,
   không cần chồng từng biến `--kbd-*`/font/padding (né hẳn rủi ro lệch tỉ lệ). `transform-origin`
   core đã đặt `bottom center` nên nó nở LÊN từ đáy, vẫn canh giữa; 70%×1.15=80.5% vẫn lọt khung.
   Đo: `transform=matrix(1.15,...)`; hồi quy Type-the-answer/Crossword `transform:none` (không rò).

**3. Đồng hồ chạm sát mép trên.** Bỏ padding TRÊN: `.aw-rw-card` `padding: 0 0 0.2cqw`, stage-inner
   `padding: 0 1.6cqw 0.4cqw`. Đo: `.aw-rw-clocks` cách đỉnh stage-inner **0px**.

**4. PASS thành nút VUÔNG bên trái bàn phím; Play/Pause giữa 2 đồng hồ.** Tách PASS khỏi
   `refereeBar()` (cụm giữa 2 đồng hồ nay CHỈ còn Play/Pause → tự canh giữa, "cân bằng giữa 2 ô đồng
   hồ"). PASS `position:absolute` trong `.aw-rw-match`, `transform:translate(-50%,-50%)`, hình vuông
   6.2cqw. `positionPass()` đo rect thật của bàn phím + match rồi đặt `left`= giữa khoảng trống trái
   (`(kbd.left−match.left)/2`), `top`= giữa chiều cao bàn phím — nên ĐÚNG dù bàn phím đã scale 1.15
   (getBoundingClientRect trả rect ĐÃ scale). ⚠️ **Bẫy thật bắt được lúc test:** ban đầu chỉ dựa
   `ResizeObserver(kbd.el)` để gọi `positionPass` → trong pane không compositing RO **không bắn**
   (giao RO gắn với vòng render), PASS nằm nguyên góc (0,0). Vá: gọi `positionPass()` THẲNG (đồng bộ)
   cuối `enterPrep()` — `getBoundingClientRect` tự ép layout nên chắc chắn đặt đúng ngay từ paint đầu;
   vẫn giữ RO cho lúc xoay/đổi cỡ về sau. Đo: PASS centerX=45.6 = đúng nửa khoảng trống trái (gutter
   91.2), centerY khớp tâm bàn phím, mép phải PASS 75.5 < mép trái bàn phím 91.2 (không đè). Bấm PASS
   thật: đổi lượt A→B, remaining 6→5, từ hiện "FOXTROT" (ink thật), đồng hồ −5s.

**5+6. ĐẢO CHIỀU danh sách + từ cũ nhỏ & mờ dần.** Trước: ô nhập ở ĐÁY, từ cũ ở trên. Nay: từ đang
   gõ (mới nhất) ở TRÊN CÙNG, các từ đã xong tụt xuống dưới, càng cũ càng NHỎ + MỜ.
   - Xếp lại DOM đảo ngược: `buildRows()` append rows vào track theo thứ tự GIẢM (word N ở đỉnh, word 1
     ở đáy). `rowEls` VẪN đánh số theo từ (rowEls[i]↔word i) cho mọi logic — chỉ đảo phần hiển thị.
   - `bottomIndexOf`→`topIndexOf` (từ ở ĐỈNH cửa sổ). `applyTrack` công thức mới:
     `shift = −((N−1) − top)` rồi `translateY(calc(shift*100%/3))`. Đo pool 6, đầu trận: DOM
     `[6,5,4,3,2,1]`, track `translateY(-166.667%)` (=−5 dòng), từ "1" (đang gõ) ở đỉnh cửa sổ (top=0px).
   - `paintBoard` gắn `tier0/1/2` = `top−i` cho 3 dòng nhìn thấy; ngoài cửa sổ không có class → bị
     `overflow:hidden` cắt. CSS: `tier0`{scale 1, opacity 1} · `tier1`{.82, .7} · `tier2`{.66, .5};
     font body/input nhân `var(--rw-tier)`. Có `transition:opacity .3s` cho mượt lúc tụt xuống.
   - Đo (đã `getAnimations().finish()` để né bẫy transition đóng băng của pane): REDS đang chờ hiện
     3 dòng — từ 3 (mới nhất) tier0 opacity 1 font 54px; từ 2 tier1 opacity .7 font 44.36px; từ 1
     tier2 opacity .5 font 35.70px. Đúng tỉ lệ 1 · .82 · .66.

**7. Game chỉ chốt khi 2 đội BẰNG số lượt submit.** Thêm `moves{a,b}` (đếm nước KẾT THÚC LƯỢT = gõ
   đúng HOẶC pass; gõ sai không tính, vẫn lượt mình), `listDone`, `finisher`. Gộp đuôi submit()/doPass()
   vào `endTurn(t)`: ghi đội ĐẦU TIÊN hết list (giữ nhãn kết quả), rồi **chỉ `endMatch("list")` khi
   `moves.a===moves.b`** — chưa bằng thì `swapTurn` cho đội kia gõ nốt lượt chót. Hết GIỜ vẫn kết
   thúc ngay (chess-clock, không đụng). Đo: pool 6, REDS đi trước; chuỗi A,B,...,A#6 (REDS hết list),
   game KHÔNG dừng, đảo sang B#6 rồi mới chốt → `moves A=6 B=6`, "REDS finished the list — more time
   left decides". Đúng ý thầy "A submit đầu thì B phải được submit lần cuối mới chốt".

### Tự test devserver (trình duyệt thật qua `aword` :5510, 0 lỗi console suốt)
- Khung 4:3 (ratio 1.333) + `act-running_word` từ màn READY; card padding-top 0.
- #2 bàn phím matrix(1.15); #3 đồng hồ 0px tới đỉnh; #4 PASS 45.6/tâm-bàn-phím vuông 60px không đè,
  Play/Pause centerX = 467.5 = đúng nửa match 935; #5/#6 đảo chiều + tier khớp số; #7 A=B=6.
- Bảng menu: chỉ 2 nửa + Start again; Start again → READY.
- Hồi quy: Type-the-answer + Crossword vẫn 16:9, bàn phím KHÔNG scale 1.15, `touch-action:auto`,
  không class `.aw-rw-*`/`act-running_word` nào rò; 0 lỗi console.

⚠️ **Máy KHÔNG tự nghiệm thu được (cần mắt thầy trên máy thật):** cảm giác bàn phím to hơn 15% khi
gõ 2 người trên TOMKO/iPad; nút PASS vuông ở lề trái có vừa tầm tay trọng tài không; nhìn danh sách
ĐẢO CHIỀU (từ mới trên, cũ mờ dần) có tự nhiên không; đồng hồ chạm sát mép trên có bị màn hình cắt
góc bo không; bảng menu 2 đội trên màn thật. Fullscreen thật / chạm-đúp / in giấy vẫn như các đợt trước.

## 8j. ⏳ Đợt 9 (6/8/2026) — DỜI PASS LÊN HÀNG ĐỒNG HỒ + THU BOARD + THỜI GIAN Ở BẢNG KẾT QUẢ. KHÔNG ĐỤNG CORE.

Thầy gửi 3 điều chỉnh 1 lượt sau khi chơi bản Đợt 8. Chỉ 2 file template (`running-word.js`,
`running-word.css`). Đã tự test devserver (`aword` :5510, trình duyệt thật, 0 lỗi console).

1. **Bàn phím +15% (Đợt 8) đè lên ô nhập → thu board xuống.** `.aw-rw-boards` thêm `margin-bottom:
   3.4cqw`. Lý do gốc: bàn phím to lên bằng `transform: scale(1.15)` với `transform-origin: bottom
   center` — mà `transform` KHÔNG reflow layout, nên bàn phím nở LÊN ~15% chiều cao (đo: cao thật
   192px → scale 221px → tràn lên ~29px trên đỉnh hộp layout của nó) đè lên đáy board. Thêm
   `margin-bottom` vừa đẩy bàn phím xuống vừa thu board nhỏ lại. Đo trên khung 4:3 968px: đáy board
   449, đỉnh-thật bàn phím 462 → **hở 13px** (bản chưa sửa: chồng lên nhau). Cỡ chữ board nhỏ đi
   không đáng kể (board mất ~10px chiều cao). ⭐ Ô nhập THỰC RA nằm ở ĐỈNH cửa sổ (đảo chiều từ Đợt 8),
   nên bản vá này chủ yếu dọn phần bàn phím ăn vào các dòng DƯỚI của board — hở 13px an toàn cho cả
   phần trên.
2. **Dời PASS khỏi cạnh bàn phím, đưa LÊN hàng đồng hồ — 2 nút, 1 mỗi đội.** Trước: 1 nút PASS
   `position:absolute` ghim cạnh trái bàn phím, đặt chỗ bằng `positionPass()` đo rect bàn phím. Nay:
   hàng đồng hồ thành **grid 5 cột** `auto 1fr auto 1fr auto` chứa
   `[PASS a][đồng hồ a][Play/Pause][đồng hồ b][PASS b]`:
   - **PASS mỗi đội** = nút vuông 5cqw, đội A `justify-self:start` (ghim MÉP TRÁI), đội B
     `justify-self:end` (ghim MÉP PHẢI) — cùng padding 1.4cqw với `.aw-rw-boards` nên **thẳng cạnh
     ngoài của board**. Mỗi PASS **chỉ sáng đúng lượt đội mình** (`paintClocks`: `disabled` trừ khi
     `phase==="play" && !paused && turn===t`) — vừa hợp lý (chỉ được bỏ từ CỦA MÌNH) vừa là chỉ báo
     lượt trực quan. Click gọi `doPass()` (đã dùng `turn`, có guard `if (turn===t)`).
   - **Đồng hồ ngắn lại**: padding ngang `1.2cqw→0.9cqw`, `justify-self:center` để hug chữ số và
     **căn giữa mỗi nửa** (thẳng cột team). Đo center: đồng hồ A 403 ≈ tâm nửa trái 398; đồng hồ B
     862 ≈ tâm nửa phải 866.
   - **Play/Pause kéo dài ngang**: `5.4cqw vuông → 11cqw × 5cqw` (pill), nằm cột giữa auto giữa 2 cột
     1fr → **đúng tâm strip** (đo center 632.5 = tâm strip). SVG giữ 2.5cqw + `pointer-events:none`
     (giữ bản vá "sometimes works" Đợt 8d).
   - Bỏ HẲN `positionPass()` + `kbdRO` (ResizeObserver bàn phím) + field `refUI.passBtn` — PASS nay
     nằm trong dòng chảy grid, không còn đo/định vị tuyệt đối theo bàn phím ⇒ **xoá một mảng mã dễ
     lỗi** (RO không bắn trong pane không compositing từng là bẫy Đợt 8i mục 4). `refereeBar()` nay
     chỉ dựng Play/Pause. Có `.aw-rw-passgap` (div rỗng 5cqw, `is-b` thêm `justify-self:end`) giữ cân
     bằng 5 cột khi Options tắt PASS.
   - Đo hàng: passA [178–227] mép trái (cách strip-left 13px), passB [1038–1087] mép phải (cách
     strip-right 13px) — **đối xứng**; tất cả `cy=45` (cùng 1 hàng ngang).
3. **Bảng MENU kết thúc thêm THỜI GIAN CÒN THỪA.** `renderSummary` mỗi nửa nay có thêm
   `.aw-rw-sum-timewrap` = `.aw-rw-sum-time` (giờ còn lại, `fmtClock`) + nhãn `.aw-rw-sum-timelab`
   "time left", dưới dòng điểm vàng. `endMatch` nhét `timeA: clock.a, timeB: clock.b` vào `rwEndData`
   (biến cấp module). Đo bản test (hết giờ): TEAM A "0:00" / TEAM B (winner) "0:08", đúng đồng hồ lúc
   kết thúc.

### Tự test devserver (trình duyệt thật, 0 lỗi console)
- Hàng đồng hồ 5 cột đối xứng (số đo ở mục 2); bàn phím hở 13px không đè (mục 1); bảng menu 2 đội có
  thời gian thừa + nhãn, chỉ nút Start again (mục 3).
- Hồi quy: `type-the-answer` + `crossword` vẫn `act-*` đúng, tỉ lệ **16:9** (1.778), bàn phím
  `transform:none` (KHÔNG rò scale 1.15), 0 class `.aw-rw-*` rò sang, 0 lỗi console.

⚠️ **Máy KHÔNG tự nghiệm thu được (cần mắt thầy máy thật):** hàng PASS+đồng hồ+Play/Pause có cân đối
đẹp trên TOMKO/iPad; nút PASS ở mép ngoài có vừa tầm tay trọng tài 2 bên; bàn phím to có còn đè gì
khi 2 em gõ thật; đồng hồ ngắn lại có còn đủ rõ số.

## 8k. ⭐ Đợt 10 (7/8/2026, v0.9.55) — 5 NHÓM THAY ĐỔI THẦY GỬI 1 LƯỢT. KHÔNG ĐỤNG CORE.

Thầy chốt 2 điểm trước khi build: (a) PASS **thay** ô tích cũ bằng thanh 0–5; (b) nút swap **chỉ** đổi
nhãn + danh sách từ (màu/đồng hồ giữ theo bên). Chỉ 3 file: `running-word.js`, `.css`, `rw-print.js`.

1. **PASS 0–5 mỗi đội (thay ô tích).** `buildExtraOptions`: bỏ `mkCheck("Allow PASS")`, thêm
   `slider("Passes per team","passUses",0,5,1,3, v=>v?`${v}×`:"Off")`. `cfg.passUses` (clamp 0–5, mặc định 3),
   `cfg.allowPass = cfg.passUses > 0` (giữ tên cũ cho `makePass`/`doPass` đọc y như trước). State
   `passLeft{a,b}` giống `andrewLeft`. `makePass` dựng nút = `<span PASS>` + `<span số-còn-lại>`; `passEls[t]`
   nay là `{btn,num,_n}`. `doPass` chặn `passLeft[t]<=0` rồi `passLeft[t]--`. `paintClocks` bật nút chỉ khi
   `phase play && !paused && turn===t && passLeft[t]>0`, cập nhật số **chỉ khi đổi** (tránh bẫy pointer straddle
   như Play/Pause). Đo (thanh=2): pass trừ 2→1→0, nút chỉ sáng đúng lượt, về 0 khoá, bấm không ăn.
2. **PART A / PART B thay tên đội.** rowhead dựng span rỗng, lưu `boardEls[t].headName`; `paintBoard` gán
   `headName.textContent = partLabel(t)`. `partLetter(t)=(partFlip?other(t):t).toUpperCase()`. Tên đội tùy chỉnh
   chỉ còn ở `renderSummary`/`showResult`.
3. **⭐ 2 bảng SONG SONG.** Thay `topIndexOf(t)` (mỗi đội cuộn theo tiến độ riêng) bằng **`sharedTop()`** dùng
   CHUNG: `turn && (play|prep) ? idx[turn] : max(idx.a,idx.b)`, clamp `[0,len-1]`. `applyTrack`/`fitBoard`/
   `paintBoard` đều gọi `sharedTop()`. `idx.a` và `idx.b` luôn lockstep (luật `moves.a===moves.b`) nên số chung
   luôn hợp lệ trên 2 danh sách BẰNG độ dài. `isInput` = `i===idx[t] && turn===t && (play || (prep&&turn))` (giữ
   ô nhập cả khi paused vì phase vẫn "play"). Kết quả: đội tới lượt gõ ở đỉnh, đội chờ hiện đúng số đó = **ô
   trống chờ nhập** (chưa gõ) hoặc **chữ xanh** (đã xong). Đo suốt ván: `topA===topB` mọi bước (1,1→2,2→3,3).
4. **In thêm SET X.** `printRunningSheets(activity,set,names,setNo)` (thêm `setNo`), call site truyền
   `setIndex+1`. Cả 3 tờ dùng `setTag="SET X"` làm subtitle. Đo: PART A/B/CHECK đều "SET 3".
5. **Đổi cách bắt đầu:**
   - **(5.1)** `submit()`: bỏ chặn `phase!=="play"`; nếu `starting = phase==="prep" && turn` thì gọi
     `startMatch()` (khởi động đồng hồ) rồi xử lý từ như thường. Thêm `canType()=(play||(prep&&turn))&&!paused`
     dùng ở `focusInput`/`insertChar`/`backspace`/keyboard `submit.isDisabled`. board.onclick chọn đội + focus,
     đổi đội thì xoá input đang gõ dở. **Xoá hẳn `beginCountdown()` + phase "countdown"** (mọi nơi tham chiếu:
     `sharedTop`, `paintBoard showSplit` gỡ "countdown"). Đo: chọn A → gõ → submit → đồng hồ A chạy; submit lượt
     đầu kể cả SAI vẫn khởi động đồng hồ (đúng "bấm submit → đồng hồ chạy").
   - **(5.2)** `onPlayPauseClick`: prep → `doSwapParts()`, play → `togglePause()`. `doSwapParts` (chỉ prep):
     `current = {a:current.b, b:current.a}` (**object MỚI** — không mutate `sets[setIndex]` vì `current` có thể là
     ref của set đã lưu), `partFlip=!partFlip`, xoá input, `buildRows()` + `paintAll()`. `paintClocks` đổi nút:
     prep→icon `SVG_SWAP` + class `is-swap` (màu slate), play→pause/play. Đo: swap → header lật A↔B (và lật lại),
     chơi sau swap 0 desync.
   - **(5.3)** `rw-print.js`: `listPage`/`checkPage` bỏ hàng `is-head`; `listPage` bỏ extra "Explainer"
     (`heading(...,null)`); subtitle = SET X. `HEADING_MM` 16→12 (đòi lại ~3mm của hàng tiêu đề đã bỏ), `metrics`
     `fs` 0.62→**0.78×rowH**. Giữ ô TURN + `is-check` 2 cột. Đo (4 từ): rowH 64,25mm / fs 50,12mm (phủ kín);
     50 từ ≈ 5,14mm / ~11,4pt (to hơn 1-cột cũ 8,9pt), tổng 257mm ≤ 257mm ROWS_MM → **vẫn 1 trang**, CHECK không
     tràn tờ 4.

**CSS:** thêm `.aw-rw-playpause.is-swap` (nền slate #64748b); `.aw-rw-passbtn` thành flex cột + 2 span
`.aw-rw-passbtn-lab`/`-n`. `SVG_SWAP` (2 mũi tên) thêm cạnh `SVG_PLAY`/`SVG_PAUSE`.

**Tự test devserver (`aword` :5510, trình duyệt thật, đo DOM — pane không compositing nên KHÔNG chụp ảnh được,
đo bằng JS):** Options có "Passes per team", nhóm Pass hết ô tích; prep header PART A/B, nút swap enabled title
"Swap PART A / PART B"; chọn A → gõ SAI → submit → đồng hồ A chạy + nút swap→pause; Andrew lộ từ → gõ đúng →
đảo lượt B, topA=topB=1, A done/B input; pass 2→1→0 chuẩn + khoá; swap lật header A↔B + chơi tiếp 0 desync; in
3 tờ SET 3, 0 hàng is-head, 0 "Explainer", fs 0.78×. Hồi quy Type-the-answer + Crossword vẫn 16:9 (1.778),
0 rò `.aw-rw-*`, 0 lỗi console (chỉ 404 favicon). `renderSummary` (gọi trực tiếp) vẫn 2 nửa + "time left" +
Start again.

⚠️ **Máy KHÔNG tự nghiệm thu được (cần mắt thầy máy thật):** cảm giác chọn-bảng-gõ-submit để bắt đầu có mượt
không; nút swap trước trận có dễ hiểu không; nhìn 2 bảng chạy song song có tự nhiên (đội chờ hiện ô trống) không;
**in thử giấy A4** cỡ chữ to mới (50 từ ~11,4pt 1 cột) + nhãn SET X có ổn không.

## 8l. ⭐ Đợt 11 (7/8/2026, v0.9.61) — KHUNG MẶC ĐỊNH 4:3 → 16:10,5. KHÔNG ĐỤNG CORE.

### Thầy yêu cầu gì

> "Các cải tiến đều liên quan đến kích cỡ màn hình và việc fullscreen của các template. Trước tiên, ta cùng
> build 1 app làm mẫu là RUNNING WORD trước. Hãy chuyển kích cỡ mặc định thành tỷ lệ 16:10,5, giữ nguyên
> cách fullscreen như hiện tại."

Nên đây là **app làm mẫu**: cách làm ở đây sẽ dùng lại cho 15 template còn lại.

### 1. Đổi tỷ lệ khung — 2 dòng, nhưng phải hiểu nó lấy chiều cao từ đâu

Lịch sử tỷ lệ của riêng template này: **16:9** (mặc định app) → **4:3** (5/8/2026, vì chơi đứng trên iPad)
→ **16:10,5** (nay). Quy ra chiều cao khung tính theo bề ngang:

| tỷ lệ | chiều cao khung |
|---|---|
| 16 / 9 | 56,25cqw |
| **16 / 10.5** | **65,625cqw**  (= 32/21) |
| 4 / 3 | 75cqw |

Viết `16 / 10.5` thay vì `32 / 21` cho khớp cách thầy nói; CSS nhận số thập phân trong tỷ lệ.

Sửa đúng 5 luật, tất cả đã có sẵn từ trước, chỉ thay con số:

```css
.aw-stage.act-running_word { aspect-ratio: 16 / 10.5; }          /* trước: 4 / 3 */
:fullscreen        .aw-stage.act-running_word { width: min(100vw, calc(100vh * 16 / 10.5)); … }
:-webkit-full-screen … :-moz-full-screen … :-ms-fullscreen …     /* 3 dòng vendor y hệt */
```

⚠️ **4 luật `:fullscreen` là CODE CHẾT với template này** — nó dùng `tpl.useZoomFullscreen`, tức fullscreen
đi đường `.aw-zoomed` (đặt `width/height:100%`, vô hiệu hoá luôn `aspect-ratio`). Vẫn sửa cho khớp để lỡ sau
này tắt cờ đó thì khung không đổi hình. **Cách fullscreen giữ nguyên 100% như thầy dặn.**

### 2. ⭐ Khung ngắn lại 9,38cqw — và toàn bộ 9,38cqw đó rơi vào bảng từ

Chỉ `.aw-rw-boards` là `flex:1`, nên **mọi cqw khung mất đi đều trừ vào bảng từ, không trừ chỗ nào khác**.
Đo thật trên devserver :5510 (`test.html`, khung 968px), so trước/sau:

| | 4:3 (cũ) | 16:10,5 (mới) | chênh |
|---|---|---|---|
| khung | 75cqw | **65,625cqw** | −9,375 |
| vùng chơi | 69,01 | **59,63** | −9,38 |
| hàng đồng hồ | 5,81 | **5,81** | 0 |
| **bảng từ** | 38,81 | **29,43** | **−9,38** |
| cửa sổ 3 hàng | 30,40 | **21,03** | −9,37 |
| **1 hàng từ** | 10,13 | **7,01** | **−3,12** |
| hộp chữ của từ | 5,81 | **5,81** | 0 |
| bàn phím | 22,88 | **22,88** | 0 |
| hở bảng↔bàn phím | 1,31 | **1,31** | 0 |

→ Hàng còn **7,01cqw** cho chữ cao **5,81cqw**: vẫn lọt, dư **1,2cqw**. Đây là **con số hết trước tiên** nếu
sau này khung còn ngắn nữa — lúc đó phải lấy bớt cqw của bàn phím/đồng hồ trả lại cho bảng.

### 3. ⭐ LỖI THẬT bắt được nhờ đo (không phải suy đoán): ô nhập bị cắt gạch chân

`.aw-rw-input` **không khai `line-height`**. Thẻ `<input>` không khai thì lấy chiều cao theo **metrics của
chính font** — Baloo 2 có hộp dòng tự nhiên ~**1,6em** → ô nhập cao **9,29cqw** trong khi chữ thật chỉ
**5,81cqw**, và trong khi từ đã chốt bên cạnh (`.aw-rw-row-body`, **có** khai `line-height:1.04`) chỉ cao
5,81cqw. Thời 4:3 hàng cao 10,13cqw nên 9,29 vẫn lọt → **lỗi nằm im suốt từ đầu**. Sang 16:10,5 hàng còn
7,01cqw → ô nhập **tràn 2,28cqw**, mà hàng có `overflow:hidden` → **cắt mất gạch chân**.

Sửa: khai `line-height: 1.04` cho `.aw-rw-input`, đúng bằng `.aw-rw-row-body`. Kết quả đo lại:

- ô nhập **9,29 → 6,21cqw**, nằm gọn trong hàng 7,01 (dư 0,79).
- **Hết nhảy cỡ lúc submit**: trước đây chữ đang gõ ở hộp 9,29cqw, submit xong nhảy về hộp 5,81cqw; nay cả
  hai đều **5,81cqw**.
- **Chữ KHÔNG bị cắt nét** — đo phần ăn mực thật của "WORKSHOP" bằng `canvas.measureText`
  (`actualBoundingBoxAscent+Descent`): **3,62cqw**, nằm trong hộp nội dung **5,81cqw** → dư **2,19cqw**.
  (`scrollHeight > clientHeight` của thẻ input ở đây là **báo động giả**: đó là phần đệm trên/dưới rỗng của
  font, không phải nét chữ.)

⭐ **Luật rút ra cho 15 template còn lại khi đổi tỷ lệ:** đây chính là cái bẫy `core/HUONG DAN CORE.md` đã ghi
("luôn khai `line-height` cho chữ ở hàng cao cố định") — **rút ngắn khung sẽ làm lộ MỌI phần tử quên khai
`line-height`**, vì chúng đang âm thầm chiếm cao gấp ~1,6 lần cỡ chữ. Trước khi đổi tỷ lệ template nào, nên
quét trước các phần tử chữ nằm trong hàng cao cố định mà thiếu `line-height`.

### 4. Đã tự test những gì (devserver :5510, đo DOM, 0 lỗi console)

- **Khung**: `aspect-ratio` tính ra đúng `16 / 10.5`, đo 968×635px, tỷ lệ **1,5238** = đúng 16/10,5;
  chiều cao **65,625cqw** khớp lý thuyết tuyệt đối.
- **Màn SETUP**: nội dung 27,91cqw + 4 khoảng hở ≈ 33,9cqw trong 59,4cqw → **không tràn**
  (`scrollHeight === clientHeight`), nút START MATCH còn cách đáy khung 18,86cqw.
- **Màn TRẬN ĐẤU**: bảng số đo ở mục 2; `.aw-rw-card` **không tràn** (scrollH = clientH = 59,61).
- **Ô nhập**: gõ "WORKSHOP" → hộp 6,21cqw nằm trong hàng 7,01cqw, ăn mực 3,62cqw (mục 3).
- **Bảng kết quả cuối trận** (ép `clockSeconds:4` cho đồng hồ chạy hết): panel cao **31,51cqw**, nằm từ
  17,06 → 48,57 trong khung 65,63 → **lọt thoải mái, không phải cuộn**; đúng 1 nút "Start again" như thiết kế.
  ⚠️ phải `panel.style.animation="none"` trước khi đo (bẫy Đợt 83: pane preview đóng băng giữa cú pop).
- **FULLSCREEN (thầy dặn giữ nguyên)**: bấm nút → `.aw-zoomed` bật, `document.fullscreenElement` vẫn `null`
  (đúng: KHÔNG dùng API thật), khung phủ **đúng 1280×720 = cả viewport**, `.aw-below` `display:none`, card
  không tràn; bấm lại → `.aw-zoomed` mất, khung về **1,5238**. **Hành vi y hệt trước.**
- **HỒI QUY 16/16 template** (chạy từ trang gốc `/index.html` để đường dẫn CSS tương đối giải đúng):
  **16/16 mount, 0 lỗi console**, tỷ lệ đúng như mong đợi — 14 game vẫn **16:9 (1,7778)**, running_word
  **16:10,5 (1,5238)**, running_team **vẫn 4:3 (1,3333)**, không rò sang nhau.
- CSS vẫn parse đủ **173 luật** sau khi sửa ghi chú (kiểm bằng `cssRules`).

⚠️ **BẪY BÀN THỬ (ghi lại kẻo lần sau mất công):** chạy vòng quét 16 template từ trang
`templates/running-word/test.html` cho kết quả **SAI** — `catalog.js` khai `css` bằng đường dẫn **tương đối
theo TÀI LIỆU**, nên từ trang test nó xin
`/templates/running-word/templates/running-team/running-team.css` → **404**, sheet rỗng, running_team đo ra
16:9 và trông như một lỗi thật. Vòng quét nhiều template **phải chạy từ trang gốc `/index.html`**.

### 5. Việc cần thầy nghiệm thu máy thật

- Nhìn bằng mắt: **hàng từ ngắn lại còn thoáng không** (7,01cqw/hàng thay vì 10,13) — đây là chỗ chịu toàn
  bộ phần khung bị cắt.
- Khung 16:10,5 lúc **chưa fullscreen** trên màn lớp có vừa mắt hơn 4:3 không.
- Fullscreen (zoom) đáng lẽ **không đổi gì** — thầy xác nhận giúp.
- Nếu thầy thấy bảng từ bị chật, em có thể lấy bớt chiều cao của **bàn phím (22,88cqw)** trả lại cho bảng —
  nhưng đó là thay đổi riêng, cần thầy chốt.

## 8l-2. ⭐ Đợt 11 PHẦN 2 (7/8/2026, v0.9.61) — GIỚI HẠN CHO FULLSCREEN + MỌI CỠ MÀN. KHÔNG ĐỤNG CORE.

### Thầy báo gì

Thầy chơi bản 16:10,5 xong: *"Về size RUNNING WORD khi là mặc định thì ok rồi, nhưng tôi muốn chỉnh thêm một
chút khi là fullscreen. Phải có những giới hạn cần thiết nào đó và những thay đổi đi cùng cần thiết để đảm bảo
khi fullscreen và resize theo kích cỡ các dạng màn hình khác nhau, không gặp hiện tượng như ảnh này."* — kèm
ảnh chụp cửa sổ 1920×950 với **3 dòng từ THHGG / PUMICE / CIVILISATION đè chồng lên nhau**.

### 1. Gốc lỗi (đo, không đoán)

Fullscreen ở template này đi đường **zoom** (`.aw-zoomed`, `width/height:100%`) và **cố ý không kẹp dải** —
quyết định 5/8/2026 để iPad không phí pixel. Hệ quả: **khung lấy đúng tỷ lệ màn hình thật**. Nhưng mọi cỡ
trong game đo bằng `cqw` = phần trăm **bề NGANG** khung. Nên màn càng bè:

- bàn phím **giữ nguyên 23cqw**, đồng hồ **giữ nguyên 5,81cqw**;
- chiều cao khung sụp xuống;
- `.aw-rw-boards` là phần tử `flex:1` **duy nhất** → **gánh trọn phần thiếu**.

Đo trong panel zoom, chiều cao 1 hàng từ so với 5,82cqw mà chính con chữ cần:

| màn | tỷ lệ | cao 1 hàng | kết quả |
|---|---|---|---|
| 1024×768 iPad 4:3 | 1,33 | 11,92 | ✅ |
| 1440×900 laptop 16:10 | 1,60 | 7,72 | ✅ |
| 1920×1080 TV 16:9 | 1,78 | **5,61** | ⚠️ bắt đầu đè |
| **1920×950 (ảnh của thầy)** | **2,02** | **3,35** | ❌ đè nhau |
| 2560×1080 ultrawide | 2,37 | **0,92** | ❌ nát |

### 2. Thầy chốt hướng (hỏi bằng AskUserQuestion, 2 câu)

1. **"Kết hợp: co trước, kẹp sau"** — màn bè vừa (tới 16:9) thì tự co, dùng trọn màn hình; bè hơn mới kẹp dải.
2. **"Ưu tiên chữ đọc được"** — bàn phím là thứ phải nhường, không phải con chữ.

### 3. Nửa thứ nhất — 4 BƯỚC CO BÀN PHÍM (`@container`)

`.aw-stage` vốn đã là `container-type: size` tên `stage` (core), nên hỏi được **tỷ lệ khung** trực tiếp:

```css
@container stage (aspect-ratio > 16/10.4) { … scale(1.08); margin-bottom: 2cqw;    }
@container stage (aspect-ratio > 16/10)   { … scale(1);    margin-bottom: 0.4cqw;  }
@container stage (aspect-ratio > 16/9.5)  { … scale(0.93); margin-bottom: -1cqw;   }
@container stage (aspect-ratio > 16/9.2)  { … scale(0.87); margin-bottom: -2.2cqw; }
```

⭐ **Chữ KHÔNG bị đụng tới** — vẫn 5,6cqw ở mọi tỷ lệ, đúng ý "ưu tiên chữ".

**Vì sao `transform: scale()` + `margin-bottom` chứ không chép lại ~18 số đo bàn phím của core:** scale giữ
**đúng từng tỉ lệ core vẽ** (phím, khe, cỡ chữ, bo góc, bóng "gờ") — cùng lý do đợt +15% ngày 5/8 đã chọn cách
này. Nhưng scale **chỉ ăn phần HÌNH**: hộp bố cục của bàn phím vẫn đứng nguyên ở chiều cao tự nhiên **N**, nên
tự nó không nhả một ly nào cho bảng từ. `margin-bottom` của boards mới là thứ đổi phần hình thành **chỗ thật**:

```
margin-bottom = N × (scale − 1) + 0,4cqw       N = 20cqw
```

⚠️ **N phải đo bằng `.aw-kbd.offsetHeight`** (bỏ qua transform), **KHÔNG dùng `getBoundingClientRect()`** —
cái sau trả về **23cqw** vì đã nhân scale 1,15 rồi; lấy nhầm là sai toàn bộ 4 con số margin.
Thử lại công thức ở scale 1,15 ra **đúng 3,4cqw** — chính là con số file này đang dùng, tức **ở tỷ lệ thiết kế
và mọi tỷ lệ CAO hơn, không bước nào khớp, không có gì đổi**.
Ở scale < 1 margin thành **ÂM** — đó chính là điểm mấu chốt: bàn phím co lại để trống phần **TRÊN** hộp bố cục
của nó (core neo `transform-origin: bottom center`), margin âm giao đúng khoảng trống đó cho bảng từ.

### 4. Nửa thứ hai — CHỐT CHẶN 16:9

4 bước trên không thể gánh mãi: ở 2,02 khung chỉ còn cao 49,5cqw, ở 2,37 còn 42,2cqw — không cỡ bàn phím nào
cứu nổi. Nên thêm vào luật zoom:

```css
max-width: calc(100vh * 16 / 9);      /* dự phòng cho trình duyệt chưa biết dvh */
max-width: calc(100dvh * 16 / 9);
```

`.aw-page` vốn đã `display:flex; align-items:center; justify-content:center` nên khung tự căn giữa, phần thừa
thành 2 dải nền tối `#0b0b0d` của chính `.aw-zoomed`.

⭐ **Chọn 16:9 chứ không phải 16:10,5 (tỷ lệ thiết kế)** vì: ở mốc 16:9, **mọi thiết bị thật của thầy — iPad
4:3, laptop 16:10, TV 16:9 — đều KHÔNG có dải nào**, giữ trọn từng pixel y như trước. Chỉ màn thật sự bè hơn
16:9 mới thấy dải, mà ở đó lựa chọn còn lại là chữ đè nhau. Trên màn 1920×950 của thầy, dải chỉ
**~115px mỗi bên = 6% bề ngang**.

### 5. Số đo sau khi sửa (devserver, 0 lỗi console)

**Đổi cỡ CỬA SỔ THẬT** (vì chốt chặn dựa vào `dvh` thật):

| màn | tỷ lệ | dải/bên | scale bàn phím | cao 1 hàng | dư | |
|---|---|---|---|---|---|---|
| 1024×768 iPad | 1,333 | **0** | **1,15** | **11,92** | 6,09 | **y hệt trước** |
| khung nghỉ 16:10,5 | 1,524 | — | **1,15** | **7,01** | 1,20 | **y hệt bản đã duyệt** |
| 1280×800 laptop | 1,600 | 0 | 1,08 | 8,15 | 2,33 | ✅ |
| 1280×720 TV 16:9 | 1,778 | 0 | 0,87 | 7,47 | 1,64 | ✅ |
| **1280×634 (ảnh thầy)** | **2,019** | **76px** | 0,87 | **7,54** | 1,72 | ✅ **hết đè** |
| 1280×540 ultrawide | 2,370 | 160px | 0,87 | 7,43 | 1,60 | ✅ |

**Quét mịn 4 bước** (panel 1200px, chỉ test phần co): 1,50 → scale 1,15 hàng 9,19 · 1,55 → 1,08 hàng 8,93 ·
1,60 → 1,08 hàng 8,27 · 1,62 → 1,00 hàng 8,52 · 1,70 → 0,93 hàng 8,04 · 1,75 → 0,87 hàng 7,89 · 1,78 → 0,87
hàng 7,58. **Phần dư luôn nằm trong 1,76–3,36cqw** — chưa bao giờ đè, và luôn RỘNG HƠN khung nghỉ (1,2).

**Khoảng hở bảng ↔ bàn phím** (kiểm margin âm không làm đè): 1,36 / 1,33 / 1,27 / **1,25cqw** ở 4 bước —
ổn định, không bước nào đè, bàn phím luôn nằm trong khung.

**Hồi quy**: 16/16 template mount, **0 lỗi console**, tỷ lệ đúng (14 game 16:9, running_word 16:10,5,
running_team 4:3), và **không template nào khác dính transform bàn phím** (`keyboardsInOtherTemplates` rỗng).

### 6. ⭐ HAI BẪY TỰ BẮT ĐƯỢC — quan trọng cho 15 template còn lại

**(a) Khối `@container` PHẢI nằm CUỐI FILE.** Container query **không cộng thêm độ ưu tiên** (specificity)
nào cả. Ban đầu em đặt 4 khối ngay sau phần FRAME ở đầu file, trong khi 2 luật gốc
(`.aw-rw-card .aw-kbd { transform: scale(1.15) }` ở ~dòng 900 và `.aw-rw-boards { margin-bottom: 3.4cqw }` ở
~dòng 540) nằm **phía dưới** → cùng specificity thì **luật dưới thắng** → **toàn bộ tính năng im lặng không
chạy**: 0 lỗi console, `@container` vẫn "khớp" khi thử bằng probe, mà màn hình không đổi gì. Chỉ lộ ra khi đo
thấy "bàn phím không bao giờ co".

**(b) ĐỪNG đặt ngưỡng ĐÚNG vào tỷ lệ mà khung đang nghỉ.** Ngưỡng đầu để `> 16/10.5` — đúng bằng tỷ lệ khung
nghỉ — thì nó **tự kích hoạt ngay ở khung nghỉ**: chiều cao khung suy ra từ bề ngang qua `aspect-ratio`, rơi
vào pixel lẻ, tỷ lệ đo được nhỉnh hơn phân số đúng một chút → `>` khớp. Đo được: khung nghỉ ra scale **1,08 /
margin 2cqw** thay vì 1,15 / 3,4cqw đã duyệt, **không một dòng lỗi nào**. Đổi ngưỡng sang **16/10,4** (1,5385)
cho cách xa hẳn 1,5238.

### 7. Việc cần thầy nghiệm thu máy thật

- Fullscreen trên **iPad** phải **y hệt trước** (không dải, bàn phím to như cũ) — đây là điều em đo được nhưng
  chỉ thầy xác nhận được bằng mắt trên máy thật.
- Fullscreen trên **màn lớp / cửa sổ máy tính**: 3 dòng từ hết đè chưa; **bàn phím nhỏ đi** (ở 16:9 còn ~76%
  cỡ cũ) có còn dễ bấm cho học sinh không — đây là chỗ đánh đổi trực tiếp của lựa chọn "ưu tiên chữ".
- Dải hai bên chỉ xuất hiện khi màn bè hơn 16:9; thầy xem có chấp nhận được không.

## 8l-3. ⭐ Đợt 11 PHẦN 3 (7/8/2026, v0.9.61) — PHÍM ANDREW VỀ ĐÚNG BỀ NGANG CHUẨN. KHÔNG ĐỤNG CORE.

### Thầy báo gì

> "Đã test, việc resize ok, chỉ có một vấn đề là bàn phím có sự thay đổi nhẹ: phím Andrew bị ngắn đi và phím
> cách bị dài ra. Hãy chỉnh để bàn phím giữ nguyên như bản chuẩn trong ảnh tôi gửi."

### 1. ⭐ Việc đầu tiên: chứng minh nó KHÔNG do thay đổi hôm nay

Thầy mô tả là "có sự thay đổi", nên phải kiểm chứ không được đoán. Hai phép đo:

**(a) Quay hẳn về bản cũ.** `git stash push -- templates/running-word/running-word.css` (chỉ mình file CSS,
giữ nguyên 3 file nhật ký), nạp lại trang, đo — bản HEAD **trước mọi thay đổi hôm nay** cho **đúng cùng bộ số**:

| | bản CŨ (HEAD, 4:3) | bản MỚI trước khi sửa |
|---|---|---|
| Andrew / 1 phím chữ | **2,120** | **2,120** |
| Space / 1 phím chữ | **7,927** | **7,927** |
| Submit / 1 phím chữ | **2,907** | **2,907** |
| Andrew / phím numbers | **0,938** | **0,938** |

→ **Giống hệt tới 3 chữ số thập phân.** Rồi `git stash pop` lấy lại thay đổi.

**(b) 4 bước co bàn phím không đổi tỉ lệ.** Đo ở 4 mốc tỷ lệ (1,50 · 1,60 · 1,70 · 1,78) — Andrew/chữ,
Space/chữ, Submit/chữ **đứng yên tuyệt đối** ở mọi mốc. Đúng bản chất `transform: scale()`: nó phóng/thu **cả
hàng như một khối ảnh**, không hề tính lại việc chia bề ngang giữa các phím.

**Kết luận: lệch này có từ ngày dựng Running word, hôm nay thầy mới nhìn cạnh bản chuẩn nên phát hiện ra.**

### 2. Gốc lỗi

```
templates/type-the-answer/type-the-answer.css:208   .aw-tta-key-andrew { flex: 0 0 12.7cqw; }
templates/crossword/crossword.css:384               .aw-cw-key-andrew  { flex: 0 0 12.7cqw; }
templates/running-word/running-word.css:859         .aw-rw-key-andrew  { flex: 0 0 10.6cqw; }   <-- lech
```

Bản chuẩn dùng chung là **12,7cqw**; Running word là template **DUY NHẤT** để 10,6cqw.

⭐ **Vì sao thiếu ở Andrew lại làm SPACE DÀI RA:** hàng cuối là `[Andrew][Space][Submit]`, trong đó **Andrew là
phím duy nhất có bề ngang CỐ ĐỊNH**, còn Space và Submit **co giãn (flex)** chia nhau phần còn lại. Andrew hụt
2,1cqw thì đúng 2,1cqw đó **chảy thẳng sang Space và Submit** theo tỉ lệ flex của chúng. Nên một con số sai
biểu hiện thành **hai** phím trông khác đi — đúng như thầy tả.

### 3. Sửa + đo lại

`.aw-rw-key-andrew { flex: 0 0 10.6cqw; }` → **`12.7cqw`**.

| | bản chuẩn (Type the answer) | Running word sau sửa | |
|---|---|---|---|
| Andrew / 1 phím chữ | 2,540 | **2,540** | ✅ khớp chính xác |
| Andrew / phím numbers | 1,124 | **1,124** | ✅ khớp chính xác |
| Space / 1 phím chữ | 7,496 | 7,619 | lệch 1,6% |
| Submit / 1 phím chữ | 2,749 | 2,794 | lệch 1,6% |

Giữ nguyên bộ số này ở **cả 4 bước co fullscreen**.

**Về 1,6% còn lại của Space/Submit** — KHÔNG phải lỗi, và cố ý không sửa: game này để lề hai bên khung hẹp hơn
(`.aw-stage.act-running_word .aw-stage-inner { padding: 0 1.6cqw … }`, thầy chốt 5/8 để bảng từ rộng thêm) nên
thẻ game rộng hơn → bàn phím (`width:70%` của thẻ) rộng hơn chuẩn ~1,6% → phần dư chia cho 2 phím co giãn.
Quy ra pixel: **~6px trên khung 968px**. Muốn khớp tuyệt đối thì phải đặt bề ngang bàn phím bằng một con số
"thần bí" tính ngược từ lề của core — sẽ gãy ngay khi core đổi lề. Không đáng.

### 4. Hồi quy

**16/16 template mount, 0 lỗi console**, tỷ lệ khung đúng (14 game 16:9 · running_word 16:10,5 · running_team
4:3). Sửa nằm trong class `.aw-rw-key-andrew` nên không thể rò sang Type the answer / Crossword.

## 8m. Đợt 87 (7/8/2026, v0.9.62) — TEMPLATE NÀY THÔI KHAI KHUNG: TIÊU CHUẨN LÊN CORE

Cái bắt đầu ở đây như một ngoại lệ của một game nay là **tiêu chuẩn của cả hệ thống**: `16 / 10.5` là
**mặc định của `core/app.css`**, cả 16/16 game dùng chung. Nên **5 luật khung của file này đã bị XOÁ**:

- `.aw-stage.act-running_word { aspect-ratio: 16 / 10.5 }` — **trùng khít** luật core, thừa.
- 4 luật letterbox `:fullscreen ... { width: min(100vw, calc(100vh * 16 / 10.5)) }` — nay **MÂU THUẪN**
  với core mới (core bảo *phủ kín, kẹp ở 16:9*, 4 luật này ghim lại 16:10,5) và vì **specific hơn** nên
  **chúng sẽ thắng**. Chúng chưa từng chạy ngày nào (template khai `useZoomFullscreen`, `:fullscreen`
  không bao giờ khớp) — nhưng để một mâu thuẫn nằm chờ sau một cái cờ đúng là loại bẫy làm mất cả phiên
  sau này, nên xoá hẳn thay vì "để đó cho an toàn".

**KHÔNG đụng gì khác**: zoom fullscreen, 4 bậc co giãn cuối file, phím Andrew 12,7cqw đều nguyên vẹn.
Đo lại sau khi đổi, khớp đúng bản thầy đã duyệt ở Đợt 86: bàn phím **1,15** · boards margin **3,4cqw** ·
hàng từ **7,02cqw** · `.aw-kbd`.offsetHeight **19,98cqw** (N = 20) · Andrew **14,6cqw = 12,7 × 1,15**
(⚠️ `getBoundingClientRect` trả kích thước **ĐÃ nhân scale** — CSS vẫn đúng 12,7cqw). Không bậc nào khớp
ở khung nghỉ, đúng thiết kế. Chi tiết: `GHI CHU DU AN.md` Đợt 87.

## 9. VIỆC ĐANG CHỜ

- [x] ~~**Đợt 11 (7/8/2026, v0.9.61)**~~ — ✅ THẦY DUYỆT + COMMIT + PUSH + LIVE. Phần 1 khung 16:10,5 (mục 8l) +
      phần 2 giới hạn fullscreen/đa màn hình (mục 8l-2) + phần 3 phím Andrew về 12,7cqw (mục 8l-3).
- [x] ~~Commit + push + `curl` kiểm bản live (đợt 1)~~ — XONG 4/8/2026, commit **`7d721a7`**.
- [x] ~~Đợt 2 + Đợt 3 (5/8/2026, v0.9.44 + v0.9.45)~~ — thầy duyệt, commit **`a40809e`** + push + live.
- [x] ~~Đợt 4 (5/8/2026) — zoom fullscreen (mục 8e)~~ — commit **`2fb19c7`** + push + kiểm live XONG.
- [x] ~~Đợt 5 (5/8/2026) — nút Fullscreen ghim góc + vá phòng ngừa cửa sổ 3 dòng (mục 8f)~~ — commit
      **`fc54dcd`** + push + live. Nút Fullscreen: thầy xác nhận ổn. ⚠️ **Phần "vá phòng ngừa cửa sổ
      3 dòng" thì KHÔNG trúng** — thầy chơi lại vẫn thấy y hệt lỗi cũ; gốc thật mãi Đợt 7 mới tìm ra
      (mục 8h). Ghi lại để nhớ: bản vá đó đã được ghi rõ ngay từ đầu là "ứng viên hợp lý nhất tìm
      được, chưa bắt tận tay" — và đúng là chưa trúng thật.
- [x] ~~Đợt 6 (5/8/2026) — ZOOM lấp kín màn hình, bỏ khoá 4:3 (mục 8g)~~ — commit **`1304bf4`** +
      push + kiểm live XONG.
- [x] ~~Đợt 7 (5/8/2026) — gốc lỗi TEAM B + in 1 cột + khoá zoom chạm đúp (mục 8h)~~ — thầy duyệt,
      commit **`6ff2da6`** + push + live (**`4115e89`**).
- [x] ~~Đợt 8 (5/8/2026) — 7 cải tiến hiển thị + gameplay (mục 8i)~~ — thầy duyệt, commit **`9f333ab`**
      + push + kiểm live XONG. ⭐ Có sửa CORE 1 hook `tpl.renderSummary` (mục 6.5), zero-diff 14 game khác.
- [x] ~~Đợt 9 (6/8/2026) — dời PASS lên hàng đồng hồ + thu board + thời gian ở bảng kết quả (mục
      8j)~~ — thầy duyệt, commit **`123c439`** + push (`510ff9f..123c439`), **KHÔNG đụng core**.
      ⬜ Còn chờ thầy nghiệm thu máy thật: hàng PASS/đồng hồ/Play-Pause cân đối vừa mắt; PASS mép ngoài
      vừa tay trọng tài; bàn phím to không đè; kiểm bản LIVE sau khi Pages build.
- [x] ~~**⭐ Đợt 10 (7/8/2026, v0.9.55) — 5 nhóm thay đổi (mục 8k): PASS 0–5, PART A/B, 2 bảng song song,
      bắt đầu bằng Submit + nút SWAP, in chữ to + SET X. KHÔNG đụng core.**~~ — thầy duyệt, commit
      **`0b629b3`** + push (`a426a6c..0b629b3`) + LIVE (build ~27s). ⬜ Còn chờ thầy nghiệm thu máy thật:
      chọn-gõ-submit; nút swap; 2 bảng song song; in giấy A4 chữ to + SET X.
- [ ] **⭐ Thầy nghiệm thu Đợt 8 trên máy thật:** bàn phím to +15% khi 2 em gõ; nút PASS vuông lề trái
      có vừa tay trọng tài; danh sách ĐẢO CHIỀU (mới trên, cũ mờ) nhìn có tự nhiên; đồng hồ chạm mép
      trên có bị bo góc cắt; bảng menu 2 đội "tên/điểm vàng" trên màn thật.
- [ ] **⭐ Thầy chơi lại trên iPad xác nhận lỗi TEAM B đã HẾT HẲN** — lần này nguyên nhân đã bắt tận
      tay và **tái hiện được bằng script** (xem khối đo ở mục 8h), khác hẳn 2 lần đoán trước; vẫn cần
      mắt thầy trên máy thật để chốt.
- [ ] **Thầy chạm đúp thử trên iPad** — xác nhận không còn phóng to (máy không tự nghiệm thu được cử
      chỉ chạm của thiết bị thật).
- [ ] **Thầy xem lại trên chính iPad đã chụp ảnh dải đen** — xác nhận hết dải đen 2 bên, khung lấp
      kín đúng ý; kiểm luôn khung REST (chưa zoom) vẫn đúng 4:3 như trước (không đổi).
- [ ] **Thầy xem khung 4:3 + 2 đồng hồ trên TOMKO thật** — có vừa mắt hơn 16:9 cũ không.
- [ ] **In thử 3 tờ ra giấy A4 thật** — nay PART A/B là **1 CỘT** (50 từ → 8.9pt · 30 từ → 14.8pt ·
      20 từ → 22.2pt), tờ CHECK 2 cột và **hết tràn sang tờ thứ 4**. Cần thầy xác nhận trên giấy
      thật: cỡ chữ 1 cột với 50 từ có còn đọc thoải mái khi đứng cầm tờ giấy không (đây là đánh đổi
      của việc bỏ 2 cột — chữ nhỏ hơn hẳn bản 2 cột cũ ~17.8pt), gạch phân cách mỏng có còn rõ không,
      ô TURN đủ to để tick không.
- [ ] Cân nhắc sau: cho `running_word` vào `core/convert.js` để đổi qua lại với các act từ vựng.
- [ ] Cân nhắc sau: chế độ 1 đội để giao bài `play.html` cho HS tự luyện.

## 10. ĐỀ XUẤT SỬA CORE

1. ✅ **ĐÃ LÀM (thầy chốt 4/8/2026)** — `core/keyboard.js` `fnKey()` nay **luôn gắn `onclick`**, để
   `disabled` một mình lo việc chặn (`extraKeyEl()` cũng thôi truyền `null`). Xoá hẳn cái bẫy im
   lặng ở mục 7.1 cho MỌI template về sau. Chi tiết + số đo hồi quy:
   `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM".
2. ⬜ **`core/print.js` — hook `tpl.printFormats`** để template tự khai định dạng in riêng, thì nút
   Print chung dưới khung mới in được 3 tờ của game này (giờ phải in từ màn setup).
