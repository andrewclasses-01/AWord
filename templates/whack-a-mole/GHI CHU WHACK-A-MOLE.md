# GHI CHU — Template WHACK-A-MOLE

**Đợt 99 dự án (10/8/2026, v0.9.73) — THANH "PHẠT" (đỏ, không số) hiện ở hàng nút Menu/Sound khi đập sai
bị đông cứng. 🟡 CHỜ THẦY DUYỆT (đã test kỹ qua trình duyệt thật, 0 lỗi console, CHƯA commit/push).**
Chỉ đụng `whack-a-mole.js` + `.css`, KHÔNG đụng core. Thầy yêu cầu: khi đập sai bị "đông cứng"
(Punishment), thêm 1 thanh thời gian ngang hàng với nút Menu/Sound (đáy khung), giữa màn hình, dài ~65%
bề ngang, cỡ bằng thanh giờ có sẵn (`.aw-wam-timerbar`) nhưng phần chạy màu đỏ, không số; chạy hết thời
gian phạt thì tự ẩn, chỉ hiện đúng lúc đang chờ do phạt.

**Vị trí:** gắn thẳng vào `.aw-bottombar` của core lúc mount (không sửa core) — con **thứ 4**, append
SAU CÙNG nên `:nth-child(1/2/3)` core vẫn đúng nhắm Menu/nav/Sound; `position:absolute` không tham gia
CSS Grid track nên không phá lưới `1fr auto 1fr`. `.aw-bottombar` đã sẵn `position:relative` từ đoạn
`chrome.forEach` (nổi topbar/bottombar lên trên cảnh full-bleed) → containing block là toàn bottombar, mà
`cqw` bên trong vẫn đọc theo `.aw-stage` gốc, nên `width:65cqw` + `left:50%; translateX(-50%)` ra đúng
65% bề ngang KHUNG GAME, tâm đúng tâm khung. Đo thật: tâm ngang thanh = tâm khung (632,5px = 632,5px);
tâm dọc = tâm nút Menu = tâm nút Sound (615,48px cả 3); bề ngang 627,9/968px = 64,9%; cao 14,48px =
ĐÚNG BẰNG `.aw-wam-timerbar`.

**Hành vi:** `startPunishBar(freezeMs)` gọi ngay lúc `frozen = true` trong nhánh đập sai (còn mạng) của
`onWhack()` — set full rồi ép reflow (`void punishFill.offsetWidth`) trước khi đổi
`transition: width {freezeMs}ms linear; width:0%` (khuôn ép-reflow-trước-transition đã dùng nhiều chỗ
khác trong file). `stopPunishBar()` gọi ở 3 chỗ: hết hạn tự nhiên (callback `h.freeT`, đúng lúc
`frozen = false`), đầu `endGame()` (phòng ván kết thúc giữa lúc đang phạt), `cleanup()` (gỡ phần tử khỏi
bottombar lúc unmount). `freezeMs = 0` (Punishment "Off") thì bỏ qua (guard `ms <= 0`).

**⚠️ Bẫy đo GẶP LẠI (giống hệt bẫy "pane bị ẩn" đã ghi ở Đợt 57, nhưng lần này là CSS Transition chứ
không phải `@keyframes`):** pane trình duyệt bị ẩn lúc test → transition ĐÓNG BĂNG thật, `getComputedStyle`
suốt 4 giây ra `opacity:"0"`/`width` không đổi, y hệt lỗi thật. Đo đúng bằng `el.getAnimations()[0]` +
tự set `currentTime` — áp dụng được cho CẢ CSS Transition, không riêng animation: xác nhận `opacity`
150ms chạy đúng 0→1, `width` 4000ms (đúng `punishSeconds=4` mặc định) nội suy tuyến tính 627,9→470,9→
313,9→157,0→0px ở 0/25/50/75/100% — đúng thiết kế. Test thật qua `test.html`, dispatch thẳng
`PointerEvent("pointerdown")` vào đúng mole mang phát biểu sai (khỏi chờ may rủi): đập sai → thanh hiện
đúng lúc/cỡ/vị trí; đập đúng → không hiện; hết 4s → tự ẩn (`is-on` mất lúc ~4,34s). 0 lỗi console.
Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 99.

**VIỆC ĐANG CHỜ:** thầy tự chơi thử trên trình duyệt THẬT (không bị che pane) xác nhận mắt thường thanh
chạy mượt + đúng ý, rồi mới commit + push.

**Đợt 91 dự án (8/8/2026, v0.9.65) — nối `onPause` cho MENU PAUSE toàn hệ thống. ✅ THẦY DUYỆT → COMMIT
`be7cd55` + PUSH + LIVE.**
Chỉ đụng `whack-a-mole.js`: tách `tickClock()` ra khỏi `startClock()`, thêm `pauseGame`/`resumeGame` +
bridge module `wamPauseHandlers` + `onPause`. Bấm ☰ Menu giờ dừng đúng đồng hồ ván (dịch `endAt`, không
hết giờ oan khi thầy đang xem menu) VÀ ngừng spawn mole mới (huỷ `spawnTimer`, hẹn lại từ đầu lúc đóng —
không giữ đúng phần dư của gap ngẫu nhiên, không đáng công). Timer riêng của TỪNG ô/mole đang lên
(duck/free, nằm trong `timers` Set dùng chung) CỐ Ý không dừng — chấp nhận trôi nhẹ. Chi tiết cơ chế
chung: `core/HUONG DAN CORE.md` mục "MENU PAUSE", `GHI CHU DU AN.md` Đợt 91.

**TRẠNG THÁI: 🟢 ĐỢT 64 (6/8/2026, v0.9.52) CHỜ THẦY DUYỆT** — 4 yêu cầu thầy gửi 1 lượt (Speed 10 gấp
đôi · Punishment tối đa 30s · bấm mole HAY bubble đều tính · bubble đỏ + chui theo mole khi đập sai).
Đã tự test trên devserver (không phải đọc code suông), 0 lỗi console, KHÔNG đụng core. Trước đó ✅ ĐỢT 63
(v0.9.38) THẦY DUYỆT → COMMIT `16586a6` + PUSH + LIVE — 5 điều chỉnh thầy gửi 1
lượt, đã chạy lại trọn bộ đo TRÊN BẢN LIVE, 0 lỗi console, KHÔNG đụng core. Trước đó ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE (4/8/2026, **Đợt 61, v0.9.36** — nay nhận được act
chuyển từ mọi game QA, sửa ở `core/convert.js`, không đụng file của template này; trước đó **Đợt 57,
v0.9.32** — 2 tinh chỉnh thầy yêu cầu). `built:true` trong `core/catalog.js` từ Đợt 32.
> Sửa tiếp game này thì chỉ đụng `templates/whack-a-mole/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`. **KHÔNG đụng core.**

## ⭐ ĐỢT 64 (6/8/2026, v0.9.52) — SPEED GẤP ĐÔI Ở MỨC 10 · PUNISHMENT TỐI ĐA 30S · BẤM BUBBLE CŨNG TÍNH · BUBBLE ĐỎ + CHUI THEO MOLE

Chỉ đụng 2 file của template (`whack-a-mole.js` · `.css`). **KHÔNG đụng core.** Tự test trên devserver
(`templates/whack-a-mole/test.html`, MutationObserver đo thời gian thật + đọc thẳng `cssRules` để tránh
bẫy đọc `getComputedStyle` giữa lúc transition đang chạy — xem bẫy ghi dưới). 0 lỗi console.

**1. Speed 10 nhanh gấp đôi, Speed 1 giữ nguyên, 2–9 vẫn trải đều tuyến tính.** Công thức `pace=(speed−1)/9`
KHÔNG đổi (đã là "chia đều" từ trước) — chỉ đổi 2 điểm neo đầu-cuối nội suy: đích ở speed 10 giảm còn
đúng MỘT NỬA giá trị cũ (`spawnBase` 340→**170ms**, `upDuration` 900→**450ms**); speed 1 vẫn 2400ms/4200ms.
`maxConcurrent` (1+pace×7, trần 8/10 hố) không đổi — số mole cùng lúc không phải thứ thầy yêu cầu đổi.
Đo thật (MutationObserver bắt `classList` đổi `is-up`, speed=10): **22 mẫu thời gian mole đứng trên mặt
đất trung bình 451ms** (đích thiết kế 450ms, sai số đo do polling ~1-2ms) — so với 900ms cũ = **đúng gấp
đôi**. Khoảng cách giữa các lần spawn đo được (27 mẫu) trung bình 340ms (dải 84–566ms, phản ánh cả lúc
`maxConcurrent` đầy phải chờ thêm tick) — thấp hơn hẳn dải cũ (~240–740ms).

**2. Punishment tối đa 10s → 30s.** Đổi đúng 1 hằng `MAX_PUNISH = 10 → 30`; slider Options + kẹp
`freezeMs` đều đọc từ hằng này nên tự theo. Đo: `input.aw-wam-slider.is-punish` sau khi mở Options ra
đúng `min="0" max="30"`, kéo tới 30 hiện nhãn "30s". Mặc định vẫn 4s (act cũ không có field này không đổi
hành vi).

**3. Bấm vào mole HAY bubble đều tính là đập.** Trước chỉ `molewrap` (mole/crate) có
`pointerdown → onWhack`. Nay `bubble` cũng gắn thẳng listener y hệt, và CSS thêm
`.aw-wam-hole.is-up .aw-wam-bubble { pointer-events: auto; }` (bubble mặc định `pointer-events:none` để
không chặn nền phía sau khi ẩn) — chỉ bật khi mole đang lên (is-up), nên **không ăn vào ô của crate**
(crate không có bubble, không set is-up). Đo: dispatch `pointerdown` thẳng vào phần tử `.aw-wam-bubble`
của 1 mole đang `is-up` → hố nhận `is-hit` ngay (kể cả khi câu trả lời sai còn ra thêm `is-wrong`, xem
mục 4) — xác nhận bubble bấm được y hệt mole, không bấm trùng 2 lần (2 phần tử DOM tách biệt).

**4. Đập SAI → bubble của CHÍNH mole đó đỏ suốt thời gian phạt, rồi nhỏ lại + chui xuống theo mole.**
- **Đỏ khi phạt:** thêm class `is-wrong` vào hố ngay lúc trúng sai (`onWhack`, trước cả khi kiểm tra hết
  mạng hay chưa, nên game-over cũng đỏ) — KHÔNG phụ thuộc ngưỡng "wobble" 400ms như `is-dizzy` (dizzy chỉ
  bật khi phạt ≥400ms để không rung vô nghĩa với phạt siêu ngắn, nhưng bubble đỏ luôn hiện dù phạt 0.1s).
  CSS `.aw-wam-hole.is-wrong .aw-wam-bubble` đổi `background`/`border-color`; `.aw-wam-bubble-text` đổi
  màu chữ đỏ đậm; tail `::before`/`::after` cũng đổi theo (khớp cả biến thể `-b` vì cùng mang class gốc
  `aw-wam-bubble`). Dọn `is-wrong` ở **cả 4 chỗ** dọn `is-dizzy` cũ (nhánh hết-phạt trong `onWhack` ·
  `duck()` · `freeHole()` · `endGame()`) — đúng khuôn phòng ngừa đã ghi từ Đợt 57, không bao giờ kẹt đỏ.
- **Nhỏ lại + chui theo mole:** trạng thái ẩn mặc định của `.aw-wam-bubble` trước chỉ `scale(.6)` tại chỗ
  (không di chuyển); nay thêm `translateY(45%)` xuống dưới + thu nhỏ hơn (`scale(.45)`), cùng nới
  `transition` từ `.22s` lên `.3s cubic-bezier(.22,.9,.3,1)` — khớp gần đúng với `transition` `.26s` của
  chính mole — nên khi `is-up` bị gỡ (duck), cả hai cùng lún xuống một nhịp, đọc như bubble "chui theo".
- **⚠️ Bẫy đo:** `background: linear-gradient(...)` là thuộc tính RỜI RẠC (không nội suy mượt được) nên
  Chrome đổi gần như NGAY LẬP TỨC sang giá trị đích; còn `border-color` (đã thêm vào danh sách
  `transition`) là màu thật nên nội suy mượt trong `.25s`. Đọc `getComputedStyle` NGAY trong cùng tick
  đồng bộ với lúc thêm class `is-wrong` bắt được `background` đã đổi nhưng `border-top-color` vẫn còn màu
  nâu cũ — **không phải lỗi**, chỉ vì transition chưa kịp chạy khung hình nào. Đo đúng: hoặc đợi vài trăm
  ms rồi đọc `getComputedStyle`, hoặc đọc thẳng `cssRules` khai báo trong stylesheet (không dính transition).
  Đã xác nhận cả 2 cách: rule `.is-wrong .aw-wam-bubble` khai đúng `background`+`border-color` đích, và
  rule `.is-up .aw-wam-bubble` khai đúng `translateY(0) scale(1)` (đối lập với hidden `translateY(45%)
  scale(.45)`) — script đo giống hệt bẫy `el.getAnimations()` đã ghi ở Đợt 57, chỉ khác đây là
  `transition` (CSS Transitions) chứ không phải `@keyframes` (CSS Animations).

## ⭐ ĐỢT 63 (4/8/2026, v0.9.38) — 5 ĐIỀU CHỈNH THẦY GỬI 1 LƯỢT

Chỉ đụng 3 file của template (`whack-a-mole.js` · `.css` · `sample-whack-a-mole.js`). **KHÔNG đụng core.**
Nhật ký đầy đủ kèm mọi con số đo: `GHI CHU DU AN.md` Đợt 63. Tóm tắt + BẪY để đời:

**1. Bảng luôn giữa cột + cột không bị thanh giờ đè.** Cột nay `top:50%; translate(-50%,-50%); height:15cqw`
(trước `top:0; height:18cqw`) → tự lấy TÂM BẢNG làm tâm với mọi chiều cao bảng; bảng bỏ `margin-top`, sign
`top:6%→14%`. Đo: lệch tâm **0,0px**, đỉnh cột cách thanh giờ 15,8px (trước ĐÈ THẬT: cột 49,5px vs thanh 58,2px).

> ⭐ **LỖI THẬT nằm dưới đáy chuyện "bảng nằm thấp"**: `autoFit` được gọi với `root` (CẢ VÙNG CHƠI ~428px)
> làm hộp đo thay vì cái bảng (~103px), **và** `.aw-wam-sign-question` không dùng `var(--fit)` → `--fit`
> chưa từng có tác dụng kể từ ngày viết. Câu hỏi 262 ký tự làm **bảng phình 376,7px**, thòng 242px dưới đáy cột.
> Nay đo theo chiều cao THIẾT KẾ của ván (`offsetWidth × 150/474` − padding) qua hộp giả `plankFitBox()`,
> và CSS dùng `calc(2.2cqw * var(--fit,1))`. **Ai sửa template khác nhớ soi lại: `--fit` chỉ có tác dụng khi
> CSS THỰC SỰ tiêu thụ biến đó, và hộp đo phải là hộp bị giới hạn thật.**

> ⚠️ **BẪY TDZ**: `updateSign()` được gọi Ở TRÊN chỗ khai báo trong `mount()`, nên `const plankFitBox = {...}`
> đặt cạnh `updateSign` là `ReferenceError` (còn trong temporal dead zone). Phải dùng **hàm** (được hoisted).
> Test trình duyệt bắt được — đọc code suông không thấy.

**2. Thang Speed trải đều.** `pace=(speed−1)/9`; nhịp spawn `2400→340ms`, mole đứng `4200→900ms`, số mole
cùng lúc `1→8`. Đo: mức 1 = 1 mole/4,5s (1 con, đứng 4,2s) · mức 5 = 1/2,0s · mức 10 = 1/0,5s.
⚠️ Mức 5 nay CHẬM HƠN mức 5 cũ — nhịp cũ tương đương mức 7–8.

**3. Bubble `bottom: 62% → 80%`.** Trước đuôi bubble cắm 20,1px vào mặt mole. Cách đo dùng lại được: **quét
alpha** sprite (`mole01ready.webp` 225×231 → 25,5% trên cùng trong suốt) mới ra mực vẽ thật. Sau: khe hở
3,3 / 6,6 / 9,9px theo 3 cỡ hố.

**4. Hết ván điểm hiện TRÊN BẢNG.** Bỏ hẳn `.aw-wam-tally` (số khổng lồ giữa sa mạc + CSS của nó); `endGame()`
dọn bảng, thêm `is-score` rồi đặt "SCORE" + số (`.aw-wam-sign-score`). Số ĐỌNG LẠI (bảng ở cao, Summary
mờ đục tự che). Đo: ván 6s ăn 16 điểm → bảng hiện `SCORE 16` khớp ô điểm engine.

**5. Option `punishSeconds` (0–10s, mặc định 4, slider XANH LÁ).** Thay hằng `PENALTY_FREEZE_MS` cũ; nhãn
"Punishment (pause after a wrong hit)". Dưới 400ms bỏ "WAIT…" + rung lắc. Đo: 0s→362ms (không rung) ·
2s→2499ms · 8s→8098ms. **Act cũ không có field này ⇒ vẫn 4s y như trước.**

## ⭐ ĐỢT 61 (4/8/2026, v0.9.36) — NAY NHẬN ĐƯỢC ACT TỪ MỌI GAME QA (Anagram/Quiz/... → Whack-a-mole)

> **KHÔNG sửa file nào của template này** — ghi lại ở đây vì hành vi của game thay đổi. Sửa nằm ở
> `core/convert.js` (Đợt 61, xem `GHI CHU DU AN.md` mục (3)+(4) và `core/HUONG DAN CORE.md`).

Thầy yêu cầu cho phép đổi template **Anagram → Whack-a-mole** và **Quiz → Whack-a-mole**. Kiểm chứng thì
ra là 2 mục này **vốn đã hiện sáng bấm được từ trước** (whack_a_mole nằm sẵn trong `QA_TARGETS` của
`convert.js`) — nhưng **bấm vào là game trắng**, báo `This activity has no quiz questions yet.` /
`no statements yet.`

**Gốc lỗi (đáng nhớ cho mọi người sửa game này):** Whack-a-mole là template DUY NHẤT có **2 hình dạng nội
dung chọn bằng OPTION** — `options.mode === "quiz"` đọc `content.questions`, `"trueFalse"` đọc
`content.statements`. `convertActivity` dựng đúng `questions`, nhưng chỉ đặt mode `if (!options.mode)`,
trong khi options của act chuyển đổi được copy từ **`sample-whack-a-mole.js` vốn mang sẵn
`mode:"trueFalse"`** → điều kiện không bao giờ đúng → act mang câu hỏi trắc nghiệm mà tự khai true/false.
Nay `convert.js` **luôn ép** `options.mode` theo `kind` của bộ nguồn.

**Cách một act QA thành ván Whack-a-mole** (hàm `buildMc` trong `convert.js`): mỗi câu = đề/định nghĩa +
**đáp án đúng của chính câu đó** + trộn thêm đáp án lấy từ **các câu khác** trong bộ (ưu tiên đáp án nhiễu
gốc nếu nguồn vốn là trắc nghiệm, thiếu thì bù bằng đáp án đúng của câu khác), rồi xáo thứ tự.

**Đo thật:** Anagram → Whack 6 câu (câu 1 "A huge grey animal with a long trunk." + elephant ĐÚNG /
polar bear / penguin / dolphin) · Quiz → Whack 6 câu (giữ nguyên bộ nhiễu gốc warm/wet/dry) ·
Find the match → Whack 8 câu — cả 3 đều `mode:"quiz"`, scene dựng OK, 0 lỗi console.
**True/false → Whack vẫn ra `mode:"trueFalse"` như cũ, không hồi quy.**

⚠️ Nếu sau này sửa `sample-whack-a-mole.js` hay editor, **đừng bỏ `options.mode`** — nó là thứ duy nhất
cho engine/convert biết game đang ở dạng nội dung nào.

## ⭐ ĐỢT 57 (4/8/2026, v0.9.32) — MOLE RUNG LẮC KHI ĐẬP SAI + ẨN NÚT NEXT/BACK

Thầy gửi 2 yêu cầu 1 lượt. Chỉ đụng **2 file** `whack-a-mole.js` + `whack-a-mole.css`. **KHÔNG đụng core**,
không đụng game khác. Đã tự test trên trình duyệt thật (devserver + `javascript_tool`), **0 lỗi console**.

### 1. Đập SAI → mole rung lắc suốt 4s phạt rồi mới thụt xuống
Trước đây trong 4s "đông cứng" (`PENALTY_FREEZE_MS`) mole sai chỉ đứng im mặt choáng rồi thụt — thầy muốn
nó **rung rung lắc lắc** cho sinh động, hết 4s mới chui xuống.

- **JS** (`onWhack`, nhánh sai, chỉ khi CÒN mạng): sau **150ms** (đúng lúc sprite đổi `tapped` → `dizzy`)
  thêm class **`is-dizzy`** vào hố; khi hết `PENALTY_FREEZE_MS` thì `remove("is-dizzy","is-up")` → mole
  thụt như cũ. Dọn `is-dizzy` ở **cả 3 chỗ** `duck()` · `freeHole()` · `endGame()` để không bao giờ kẹt rung.
  Nhánh **hết mạng KHÔNG rung** (game over sau 600ms, rung thành thừa).
- **CSS**: `.aw-wam-hole.is-dizzy .aw-wam-mole` chạy `@keyframes aw-wam-dizzyshake` (0,46s, `infinite`),
  `transform-origin: 50% 92%` → lắc quanh **gốc chân** như người say, xoay **±6,5°** + lắc ngang
  (−47,5% ↔ −52,5%). Bong bóng chữ lắc **cùng nhịp nhưng nhẹ hơn** (`aw-wam-dizzybubble`, ±3,5°) cho ăn khớp.

> ⚠️ **BẪY (giống hệt bẫy Open-the-box)**: PHẢI viết bằng `@keyframes`, KHÔNG dùng `transition`. Rule
> `.aw-wam-hole.is-hit .aw-wam-mole` đã **ghim sẵn `transform`**, mà theo luật CSS một `animation` đang giữ
> một thuộc tính LUÔN thắng `transition` nhắm cùng thuộc tính đó. Hệ quả: **mỗi keyframe phải tự mang lại
> offset của `.is-hit`** — `translate(-50%, 8%) scaleY(.92)` — nếu quên, mole sẽ nhảy về vị trí gốc lúc rung.

### 2. Ẩn nút Next / Back (không cần cho game này)
Thêm **đúng 1 dòng** CSS:
```css
.aw-playarea:has(> .aw-wam-scene) ~ .aw-bottombar .aw-navbtn { display: none; }
```
- **Cố ý KHÔNG dùng `.aw-nav { display:none }` trần như open-the-box.css**: từ v0.9.7 CSS template được
  `ensureTemplate()` chèn vào document và **Ở LẠI VĨNH VIỄN**; sau khi "Change template" (Đợt 47) sang game
  khác, rule trần đó vẫn ẩn mũi tên của game mới. Selector scoped theo `.aw-wam-scene` (con TRỰC TIẾP của
  `.aw-playarea`) nên hết whack-a-mole là hết tác dụng. Khuôn này copy từ true-false / find-the-match.
- **Chỉ ẩn `.aw-navbtn`, KHÔNG ẩn wrapper `.aw-nav`**: `.aw-bottombar` là lưới 3 cột, bỏ hẳn phần tử giữa
  sẽ làm 2 cụm còn lại dồn sai chỗ (bẫy đã ghi ở open-the-box).

### Cách tự kiểm (pane trình duyệt bị ẩn → **animation bị đóng băng**, không đo trực tiếp được)
Bẫy throttle: cửa sổ không hiển thị thì Chromium ngưng compositing, `getComputedStyle` lấy mẫu theo thời
gian ra **y hệt nhau** trông như animation chết. Cách đo đúng: lấy `el.getAnimations()[0]` rồi **tự đặt
`anim.currentTime`** từng mốc và đọc `transform` — `getComputedStyle` ép style recalc nên ra giá trị thật.
Kết quả đo: mole `rotate` 0° → −6,4° → +6° → −4,6° → +3,7° → 0° kèm lắc ngang; bong bóng ±3,5° cùng nhịp;
class đúng vòng đời (`is-up is-hit is-dizzy` tới ~3,9s, tới 4,0s còn `is-hit` + mole đã thụt); nút mũi tên
`display:flex` ở màn READY (chưa có scene) → `display:none` khi vào game (chứng minh scoping chạy đúng);
lưới thanh dưới vẫn `423px / 61,8px / 423px`.

Game whack-a-mole kiểu Wordwall, **đồ họa + âm thanh Wild West** THẬT lấy từ act mẫu Wordwall
(https://wordwall.net/resource/116864290/whack-a-mole). Tự chứa hoàn toàn (`./img`, `./sounds`).
**2 chế độ (True/False + Quiz)**, art Wild West CỐ ĐỊNH (không đổi theo theme).

## ⭐ ĐỢT 45 (v0.9.19) — NÂNG CẤP LỚN (7 đợt tinh chỉnh, đã test trình duyệt thật 0 lỗi)

### Đồ họa / cảnh (dùng ẢNH THẬT của Wordwall, KHÔNG vẽ SVG)
- **Phát hiện chốt:** `mound01/02/03.webp` KHÔNG phải ụ đất — chúng là **CẢ PHÔNG ĐỒI** (đồi + núi mesa +
  xương rồng + cỏ, mỗi ảnh 1 biến thể). Bản build cũ nhét sai `mound` vào TỪNG hố → hỏng. Nay:
  - `HILL_IMG = "mound02.webp"` = đồi chính (núi mesa hồng + tai thỏ baked sẵn), `.aw-wam-hill` wide.
  - Hố = CHỈ `holeback` + `holefront` (bỏ mound khỏi hố).
  - `FRONT_HILL_IMG = "mound01.webp"` = 2 đồi mờ tiền cảnh 2 góc dưới (CSS `blur(3px)`), đẩy ra
    `left/right:-35%` để KHÔNG đè hố. Sky = `bg2.webp`.
- **Cactus THẬT** (`.aw-wam-decor`): `cactus.webp` (saguaro phải, to+hạ thấp `right:-11% bottom:8%
  width:18cqw` — gốc tuck sau đồi phải), `cactus2.webp` (trái, to+cao `left:-10% bottom:12% width:17cqw`).
  Cả 2 đẩy 1 phần RA NGOÀI khung để hố hàng 2 (x14/x86) không bị đè.
- **Intro zoom** (`.aw-wam-world` transform, `is-intro` scale .86 → 1, origin 50% 72%): vào game lùi xa
  thấy núi → zoom về khung chơi ~2,2s rồi mới startClock + spawn.
- **Biển** (`.aw-wam-sign`): nhỏ + rộng-ngang-thấp-dọc (aspect 474/150), **cột chạy suốt, board `margin-top`
  tụt xuống GIỮA cột** (post ló trên+dưới). Ở dưới thanh giờ (top 6%). z-index 3 (DƯỚI hố/bubble z6).
- **Bubble = VẼ CSS** (cream + viền nâu + đuôi ::before/::after), `width:max-content` + `max-width:21cqw`
  → ÔM SÁT chữ, KHÔNG BAO GIỜ tràn (đo 0/220 lượt). `-b` = đuôi phải. Sát chuột (bottom 62%).
- **Dấu ✓/✗** (`.aw-wam-mark`): nét trần (SVG stroke + viền trắng), KHÔNG nền tròn. Xanh đúng / đỏ sai.

### Logic / luật chơi
- **Timer đọc từ engine** (`options.timer` = `countUp`|`countDown`, `options.timerTotalSeconds`), KHÔNG còn
  `gameSeconds` cố định. `manualTimerStart:true` + KHÔNG gọi `ui.startTimer()` → engine timer KHÔNG chạy
  (ẩn `.aw-top-timer` bằng `visibility:hidden`, đừng `display:none` kẻo vỡ grid `has-inline`). Mình tự vẽ
  bar riêng ở `topbarMid`. **Bar đổi màu: cam ≤30s, đỏ ≤10s.** Bar dài cố định từ đồng hồ đến sát tim #5,
  khe bar↔tim = khe giữa 2 tim (tim rộng cố định `startLives*2.8-0.5` cqw, `justify-content:flex-end`).
- **Mục tiêu (objective):** trueFalse: các câu đúng (TRUE, hoặc FALSE nếu switch) = "cần đập". Đập đúng =
  xóa vĩnh viễn (không hiện lại); lỡ (lặn) = quay lại pool; câu sai = mồi nhử spawn vô hạn.
  - **countUp:** dọn hết câu cần → COMPLETE. **countDown:** dọn hết → LÀM MỚI VÒNG, chơi tiếp đến hết giờ
    (KHÔNG complete sớm). Quiz tương tự: countUp hết câu → complete; countDown → lặp lại.
- **Đập sai = phạt "đông cứng" 4s** (`PENALTY_FREEZE_MS`, cờ `frozen`): mole sai ở lại (dizzy), MỌI mole
  khác thụt, `spawnTick` ngưng cho tới hết 4s.
- **Lives** (`options.lives` 0–10, 0=Unlimited): tim vẽ ở `topbarMid` (KHÔNG dùng `hasLivesSlot` vì đã có
  `inlineTimerBar` chiếm chỗ), MẤT TỪ TRÁI (pop `firstChild`, phần còn lại luôn sát điểm). Hết tim → Game over.
- **Penalty** (`options.minusAmount` 0–5, 0=off): đập sai trừ điểm.
- **Bonus 3 tick riêng:** `bonusTime` (chỉ countDown) / `bonusLoot` / `bonusPower`. Bỏ crate "dizzy".
- **Switch** (`options.switchAnswers`): biển → "FALSE", đập FALSE mới được điểm.
- **Tally cuối game:** gỡ số điểm to ngay khi `ui.finish()` mở dialog (khỏi đè "TIME'S UP"/điểm).

### Options panel (`buildExtraOptions`, dùng `mkCheck`)
Answers(Switch) · Speed(1–10) · Lives(0–10) · Points off per wrong(0–5) · Bonus crates(3 tick). **Gỡ DOM**
nhóm "Auto switch" + nút Timer "None" (chỉ còn Count up / Count down; none→countDown). KHÔNG có radio mode
ở đây (mode chọn trong editor).

### Editor (`whack-a-mole-editor.js`)
- **True/False = 2 CỘT** (TRUE | FALSE, class `.aw-wam-tf-*` copy từ true-false vào whack-a-mole.css vì
  true-false.css KHÔNG nạp khi chơi game này). Quiz = card giống quiz.
- **Khóa đổi mode** khi đã có dữ liệu (`updateModeLock`): nút mode kia disabled + nhắc "Delete all to switch".
- Save gộp 2 cột → `content.statements`, KHÔNG ép `timer:"none"` nữa (giữ lựa chọn Timer của thầy).

## Dữ liệu / options (xem `sample-whack-a-mole.js`)
- **trueFalse**: `content.statements[{text, answer:bool}]`. **quiz**: `content.questions[{question,
  answers:[{text,correct}]}]`. `options.mode` chọn chế độ.
- `options`: `mode`, `timer`(countUp/countDown), `timerTotalSeconds`, `switchAnswers`, `speed`,
  `lives`(0=∞), `minusAmount`, **`punishSeconds`**(0–30s đông cứng sau khi đập sai, thiếu field = 4s;
  nâng trần 10→30 ở Đợt 64), `bonusTime/Loot/Power`, `shuffleQuestions`, `showAnswers`.

## BẪY (đã gặp trong đợt này)
- `.aw-top-timer` ẩn bằng `visibility:hidden` — `display:none` phá grid `has-inline` (topbarMid dồn về cột 0).
- `width:fit-content` cho bubble bị **hố bó** (offset parent = hố ~13cqw) → chữ hẹp; PHẢI `max-content`.
- `mound0x.webp` là PHÔNG ĐỒI, không phải ụ đất — đừng nhét vào từng hố.
- Đồi mờ tiền cảnh + cactus có z-index > hố cũ → phải tính vị trí (đẩy ra ngoài / xuống) để không đè hố z6.

## LƯU Ý / ĐÁNH ĐỔI
- Game KHÔNG đổi màu theo theme (art Wild West cố định — thầy chốt).
- Chưa test trang HS `play.html` (nạp template động) cho bản mới — engine giống nhau nên khả năng OK.
