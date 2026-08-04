# GHI CHU — Template WHACK-A-MOLE

**TRẠNG THÁI: 🟢 ĐỢT 63 (v0.9.38) CHỜ THẦY DUYỆT** — 5 điều chỉnh thầy gửi 1 lượt, đã tự test trình duyệt
thật, 0 lỗi console, KHÔNG đụng core. Trước đó ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE (4/8/2026, **Đợt 61, v0.9.36** — nay nhận được act
chuyển từ mọi game QA, sửa ở `core/convert.js`, không đụng file của template này; trước đó **Đợt 57,
v0.9.32** — 2 tinh chỉnh thầy yêu cầu). `built:true` trong `core/catalog.js` từ Đợt 32.
> Sửa tiếp game này thì chỉ đụng `templates/whack-a-mole/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`. **KHÔNG đụng core.**

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
  `lives`(0=∞), `minusAmount`, **`punishSeconds`**(0–10s đông cứng sau khi đập sai, thiếu field = 4s),
  `bonusTime/Loot/Power`, `shuffleQuestions`, `showAnswers`.

## BẪY (đã gặp trong đợt này)
- `.aw-top-timer` ẩn bằng `visibility:hidden` — `display:none` phá grid `has-inline` (topbarMid dồn về cột 0).
- `width:fit-content` cho bubble bị **hố bó** (offset parent = hố ~13cqw) → chữ hẹp; PHẢI `max-content`.
- `mound0x.webp` là PHÔNG ĐỒI, không phải ụ đất — đừng nhét vào từng hố.
- Đồi mờ tiền cảnh + cactus có z-index > hố cũ → phải tính vị trí (đẩy ra ngoài / xuống) để không đè hố z6.

## LƯU Ý / ĐÁNH ĐỔI
- Game KHÔNG đổi màu theo theme (art Wild West cố định — thầy chốt).
- Chưa test trang HS `play.html` (nạp template động) cho bản mới — engine giống nhau nên khả năng OK.
