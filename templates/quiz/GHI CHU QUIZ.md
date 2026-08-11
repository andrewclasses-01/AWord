# GHI CHÚ QUIZ

**TRẠNG THÁI: ✅ ĐÃ CHỐT + LIVE** (Quiz là template GỐC của dự án — công thức rút ra từ nó nằm ở
`../CONG THUC MAU.md`, nên trước nay Quiz không có file ghi chú riêng. File này mở từ 4/8/2026 để
các đợt sửa Quiz về sau có chỗ ghi, khỏi phải đọc ngược `../../GHI CHU DU AN.md`.)

**File của template:** `quiz.js` · `quiz.css` · `sample-quiz.js` · `quiz-editor.js` · `quiz-sound.js`
(+ `sounds/` 10 file mp3 pack Wordwall "Block" · `test.html`/`test.js` do engine tạo sẵn).

---

## ⚠️ ĐỢT 112 (11/8/2026) — "ÂM HẾT GIỜ NỔ KHI CÒN NHIỀU THỜI GIAN": KHÔNG PHẢI LỖI CỦA QUIZ

> **KHÔNG SỬA FILE NÀO CỦA QUIZ** — ghi ở đây vì thầy phát hiện lúc test Quiz, phiên sau dễ đi soi
> `quiz-sound.js` rồi mất công vô ích. Bug nằm ở `core/engine.js`, chi tiết đầy đủ ở
> `../../GHI CHU DU AN.md` Đợt 112 + `../../core/HUONG DAN CORE.md` mục "BẪY ĐỒNG HỒ MA".

**Triệu chứng thầy gặp:** đang chơi ván đếm ngược, đồng hồ còn nhiều (đo được: **0:28** và **0:09**) mà
`blockgametimeout.mp3` vẫn nổ. Lives để **Unlimited**.

**⚠️ HAI CÁI BẪY CHẨN ĐOÁN, đừng vấp lại:**
1. `quiz-sound.js` dùng CHUNG `blockgametimeout.mp3` cho cả `timeWarning` (còn 5s) **lẫn** `gameOver`
   (hết Lives — Đợt 64 cố ý làm vậy vì pack "Block" không có file game-over riêng). Nhìn code là ra ngay
   giả thuyết "hết mạng nghe nhầm ra hết giờ" — **nghe rất hợp lý nhưng SAI**, vì thầy để Lives Unlimited.
2. Đường `timeWarning` trong `core/engine.js` (`remaining <= 5 && remaining > 0 && !timeWarned`) **hoàn
   toàn đúng**, soi mãi cũng không thấy lỗi — vì thủ phạm là một đồng hồ của **VÁN TRƯỚC** còn sống ngầm.

**Thủ phạm thật:** bấm **☰ Menu → "Start again"** để lại một `setInterval` "ma" của ván cũ (chi tiết ở
core). Nó đếm ngược trên đồng hồ VÔ HÌNH của ván đã chết, tới mốc "còn 5s" của chính nó thì kêu — trong
khi màn hình đang hiện đồng hồ của ván MỚI, còn nhiều thời gian. Đã vá ở `core/engine.js` (Đợt 112).

---

## ⭐ ĐỢT 65 (4/8/2026, v0.9.40) — HẾT "GÓC VUÔNG KHI CHẠM" TRÊN TOMKO — ✅ THẦY DUYỆT → COMMIT `72e1b5f` + PUSH + LIVE

> **Đã kiểm chứng trên bản live:** Quiz **16/16** phần tử bo góc = `rgba(0, 0, 0, 0)`, 0 lỗi console.

> ⭐ **CÓ SỬA CORE** (thầy đồng ý trước). **KHÔNG sửa file nào của Quiz** — Quiz hết lỗi nhờ luật gốc.

**Thầy báo:** chạm vào ô đáp án hoặc nút Next/Back thì đúng lúc nhấn hiện ra nền **góc vuông** thò ra
ngoài viền bo tròn. Open the box đã hết sau vài đợt chỉnh, nhưng **Quiz và nhiều template khác vẫn bị**.
Chỉ máy 3 (TOMKO) bị, máy 1 và 2 không; GPU/CPU chỉ chạy 1-2% nên không phải máy yếu.

**Nguyên nhân (đo trên chính máy 3):** mặc định của Chrome `-webkit-tap-highlight-color: rgba(0,0,0,0.18)`,
chỉ vẽ khi input là **CHẠM** và **không bám border-radius**. Máy 1/2 dùng chuột nên không bao giờ vẽ. Vì
sao Open the box đã hết: Đợt 21 (điểm 1) nó tự đặt `-webkit-tap-highlight-color: transparent` cho
`.aw-otb-box`/`.aw-otb-qtile` — nhưng chỉ chữa cho riêng nó, không lan sang Quiz. Chi tiết đầy đủ +
số đo: `core/HUONG DAN CORE.md` mục "MÀN CẢM ỨNG (TOMKO)".

**Đo Quiz cụ thể — trước khi sửa 16 phần tử dính:**
`.aw-quiz-tile` ×4 (r=15.46px) · `.aw-navbtn` ×2 (r=14.49px) · `.aw-iconbtn` ×4 (r=9.66px) ·
`.aw-toolbtn` ×3 (r=13px) · `.aw-toolbtn-sm` ×4 (r=11px) — tất cả đều `rgba(0, 0, 0, 0.18)`.
**Sau khi sửa: 16/16 = `rgba(0, 0, 0, 0)`, 0 lỗi console.**

**Đã sửa:** đúng 1 luật `html { -webkit-tap-highlight-color: transparent; }` trong `core/app.css`
(thuộc tính KẾ THỪA nên phủ cả app). Không đụng `quiz.js`/`quiz.css`.

**Nghiệm thu bằng tay (máy không tự chạm được):** mở
`http://localhost:5510/scratch/kiem-tra-cham-tay.html` trên TOMKO — cột trái cố ý bật lại lỗi, cột phải
là bản đã vá, hình dạng giống hệt nhau. Chạm giữ ngón vào từng ô để so.

---

## ⭐ ĐỢT 64 (4/8/2026, v0.9.39) — THÊM THANH LIVES 0–10 — ✅ COMMIT `f0b0830` + PUSH + LIVE

**Thầy yêu cầu:** kiểm tra Quiz đã có thanh Lives chưa, chưa có thì thêm, từ 0 đến 10.
**Kiểm tra:** Quiz **chưa hề có** (chỉ có dòng thừa `lives: null` trong `sample-quiz.js`, không ai đọc).

### Đã làm
1. `hasLivesSlot: true` → engine dựng sẵn ô tim bên trái ô điểm (`ui.livesSlot`). **Không phải sửa core**:
   ô này + CSS `.aw-top-heart/.aw-top-heartcount` đã có từ True/false.
2. `buildExtraOptions` thêm nhóm **Lives** — slider `0..10`, 0 hiện **"Unlimited"**
   (`.aw-quiz-livesrow / -livesslider / -livesval` trong `quiz.css`; đây là điều khiển NGOÀI khung 16:9
   nên dùng px/rem, KHÔNG dùng `cqw`).
3. `normLives(v)`: `0` / `null` / `undefined` → **vô số mạng**. Act Quiz cũ không có trường `lives` nên
   mặc định BẮT BUỘC là vô số mạng — mặc định 5 sẽ làm mọi bộ đề cũ bỗng "Game over" giữa chừng.
4. Trả lời SAI → `loseLife()`: tim TRÁI NHẤT phóng to rồi tan (`.animate()` + `setTimeout` dự phòng
   theo luật core), 1..5 mạng hiện tim rời, 6..10 hiện gọn `N♥`.
5. Hết mạng → cờ `ending`: khoá ô đáp án + `updateNav()` cho 2 mũi tên mờ, 1,5s sau `finish("gameover")`;
   `raw.title = "Game over"` nên màn ăn mừng + bảng tổng kết đổi chữ (cơ chế sẵn có của engine).
6. Âm cuối ván: `sounds.complete` của template để **rỗng**, `finish()` tự chọn — xong bài
   `blockgamesuccessful` (y như cũ), hết mạng `blockgametimeout`. Nếu không làm vậy thì hết mạng vẫn
   nổ fanfare mừng chiến thắng.

### ⚠️ BẪY (ghi lại kẻo đợt sau vấp)
- `ui.setNav({onNext})` được engine gắn **thẳng** `btn.onclick = handler` → truyền `finish` trần vào là
  hàm nhận **MouseEvent làm `reason`**. Phải bọc `() => finish("complete")` (cả nhánh phím `→`).
- Cờ `ending` phải chặn CẢ `choose`, `goPrev/goNext`, `onKey` — nếu chỉ khoá nút, phím `←/→` vẫn lọt.
- `cleanup()` phải xoá `ui.livesSlot.innerHTML` kẻo tim còn sót sang game sau.

### Tự kiểm trình duyệt thật (devserver 5599, đo DOM — pane không compositing nên screenshot timeout)
lives=3 sai 3 câu → 3→2→1→0 tim, khoá ô + 2 mũi tên disabled, hiện "Game over", tổng kết "GAME OVER
Score 0/6" · lives=2 y hệt · lives=8 → `8♥`, sai 1 → `7♥` · **act cũ không có `lives` → 0 tim, sai
hết 6 câu vẫn "Game complete"** (zero-diff) · lives=3 đúng hết → 3 tim nguyên, "Game complete" 6/6 ·
Menu "Submit answers" → "Game complete" · panel Options đủ 8 nhóm, Lives min 0 max 10, về 0 =
"Unlimited". **Console 0 lỗi ở mọi ca.**

### ✅ THẦY DUYỆT → COMMIT `f0b0830` + PUSH + LIVE (4/8/2026)
Push `d4fc9ff..f0b0830`. **`curl` lần đầu cả 3 file còn là bản CŨ**, poll lại 20s sau mới đủ dấu mốc
(`hasLivesSlot` · `aw-quiz-livesslider` · `gameOver`) — bẫy Pages quen thuộc, đừng tin lần curl đầu.
**Chạy lại trọn bộ kiểm tra TRÊN BẢN LIVE**: lives 3 → `♥♥♥→♥♥→♥→(trống)`, khoá ô + 2 mũi tên
disabled, "GAME OVER · Score 0/6" · act cũ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete" ·
lives 8 → `8♥`→`7♥` · đúng hết → 3 tim nguyên 6/6 · Submit answers → "Game complete" · Options đủ
8 nhóm, Lives 0..10 về 0 = "Unlimited" · **14/14 template mount 0 lỗi · console 0 lỗi**.
⚠️ `javascript_tool` cắt ở 30s → kịch bản test dài phải chẻ nhiều lượt (giữ helper trên `window`).

**Việc kế: thầy chơi thử trên TOMKO (chọn số mạng vừa tay); chỗ nào chưa vừa thì báo.**

---

## Lịch sử trước đó (tóm tắt, chi tiết ở `../../GHI CHU DU AN.md`)

- **Đợt 59 (3/8/2026, v0.9.34)** — 4 cải tiến: nav không còn biến mất lúc game-complete (⭐ sửa core:
  bỏ `navWrap.style.visibility="hidden"` trong `celebrate()`) + quiz huỷ `autoTimer` khi điều hướng tay ·
  không tách 1 từ đơn (`--tw` co riêng từng ô) · đáp án dài nhiều chữ thì ô cao AUTO, `--fit` co để không
  đè câu hỏi · chuyển câu TRƯỢT chữ, ô đáp án CỐ ĐỊNH (dựng card + tiles 1 lần rồi cập nhật tại chỗ).
- **Đợt 54 (3/8/2026)** — "Points off (wrong answer)" (option CHUNG của engine, quiz tự trừ trong
  `scoreNow()`) + **Allow skip** (mặc định TẮT: phải trả lời mới Next được).
- **Đợt 12 (30/7/2026)** — bỏ `text-transform:uppercase` ở `.aw-quiz-tile` (hết ép HOA đáp án; ALL CAPS
  chỉ còn ở Anagram).
