# GHI CHU — Template WHACK-A-MOLE

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (3/8/2026, **Đợt 45, v0.9.19** — nâng cấp LỚN
7 đợt tinh chỉnh theo yêu cầu thầy; thầy duyệt → commit + push + live). `built:true` trong
`core/catalog.js` từ Đợt 32.
> Sửa tiếp game này thì chỉ đụng `templates/whack-a-mole/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`. **KHÔNG đụng core.**

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
  `lives`(0=∞), `minusAmount`, `bonusTime/Loot/Power`, `shuffleQuestions`, `showAnswers`.

## BẪY (đã gặp trong đợt này)
- `.aw-top-timer` ẩn bằng `visibility:hidden` — `display:none` phá grid `has-inline` (topbarMid dồn về cột 0).
- `width:fit-content` cho bubble bị **hố bó** (offset parent = hố ~13cqw) → chữ hẹp; PHẢI `max-content`.
- `mound0x.webp` là PHÔNG ĐỒI, không phải ụ đất — đừng nhét vào từng hố.
- Đồi mờ tiền cảnh + cactus có z-index > hố cũ → phải tính vị trí (đẩy ra ngoài / xuống) để không đè hố z6.

## LƯU Ý / ĐÁNH ĐỔI
- Game KHÔNG đổi màu theo theme (art Wild West cố định — thầy chốt).
- Chưa test trang HS `play.html` (nạp template động) cho bản mới — engine giống nhau nên khả năng OK.
