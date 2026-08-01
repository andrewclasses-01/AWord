# GHI CHU — GAMESHOW QUIZ (game thứ 10)

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy.
> Sửa tiếp game này thì chỉ đụng `templates/gameshow/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

Dựng lại act Classic của thầy: https://wordwall.net/resource/116864527/gameshow — Visual style
**TV game show** = "Classic" của Gameshow trong AWord (theme nội bộ Wordwall `gameshow`, template id 69,
type 11).

## 1. Cách chơi (giống Wordwall)

- Màn READY (engine dựng) → bấm Play → **Intro**: 2 cánh cửa "QUIZ SHOW" trượt tách ra + nhạc nền chạy.
- Mỗi câu: **"Question N / Get ready!"** → câu hỏi CHỮ TO + 2–6 ô đáp án A/B/C/D (viền bóng đèn vàng,
  nền tia sáng xanh). Thanh **đếm ngược từng câu** ở hàng trên (giữa) + **✓ số câu đúng** (phải).
  Bảng **điểm (PTS)** góc trái trong khung; **♥ Lives** góc phải (chỉ khi bật giới hạn mạng).
  * Đúng → ✓ bay + **điểm theo TỐC ĐỘ** (nhanh = nhiều điểm) + số điểm chạy lên · Sai → ✗ + (mất 1 Live
    nếu có giới hạn) · Hết giờ → tự tính như bỏ qua.
- **Sau mỗi N câu (Questions before a bonus round, mặc định 3) → VÒNG BONUS**: nền hồng + "BONUS ROUND"
  + 5 lá bài úp "?"; chọn 1 → lật → **+điểm** (50/100/150/200/250).
- **4 LIFELINES** (mỗi thứ dùng 1 lần/ván, bật/tắt trong Options): **50:50** (bỏ 2 đáp án sai) ·
  **×2** (nhân đôi điểm câu kế) · **+TIME** (thêm 10s) · **REVEAL** (nháy đáp án đúng).
- Kết thúc (hết câu = thắng / hết Lives = Game over) → bảng tổng kết **xếp theo ĐIỂM** + leaderboard
  (hiện điểm, không phải "đúng/tổng") + Show answers.

## 2. Dữ liệu = Y HỆT QUIZ

`content.questions[].answers[{text, correct}]`, đúng-1-đáp-án. Editor `gameshow-editor.js` là bản
sao editor Quiz (badge "GAMESHOW", ép `options.timer="none"` vì game tự quản đếm ngược từng câu).
Dán Excel, Mark correct in all, Duplicate... đầy đủ như Quiz.

## 3. Options (qua `buildExtraOptions`, KHÔNG cần sửa engine thêm)

- **Time per question** (giây, 0 = không giới hạn) — `options.gsSeconds` (mặc định 20)
- **Lives** (0 = Unlimited) — `options.lives`
- **Questions before a bonus round** (0 = tắt) — `options.bonusEvery` (mặc định 3)
- **Lifelines** (4 ô tích) — `options.lifelines = {fifty,x2,time,cheat}`
- + Shuffle question/answer order · Show answers (chung của engine)
- Nhóm **Timer** (toàn ván) và **Letters on answers** được ẨN (dùng cờ `hideTimerOption`/`hideLettersOption`).

## 4. Nghệ thuật & âm thanh (THẬT, từ Wordwall)

- Look TV game show **cố định** (không theo 4 theme chung — như maze-chase/flying-fruit). Viền bóng đèn
  marquee dựng bằng CSS (`.aw-gs-board::before`, 4 radial-gradient); cửa intro/bonus + khán giả + đèn
  sân khấu dùng ảnh thật trong `./img/`. Nền câu hỏi = `starburst.webp`.
- 47 âm thật trong `./sounds/` (map sự kiện→âm ở `gs-sound.js`); nhạc nền `music.mp3` loop volume thấp.
  Nguồn gốc + convention: `AWord-data/Source/{Sound effect,Graphic}/GAMESHOW/GHI CHU.md`.

## 5. ⭐ ĐÃ SỬA CORE (phụ trách tổng, TƯƠNG THÍCH NGƯỢC — đã kiểm Quiz không đổi)

Gameshow cần **điểm kiểu points** (khác "số câu đúng") và **đếm ngược từng câu**. 3 thay đổi core, tất
cả mặc-định-giữ-nguyên-hành-vi-cũ:

1. `core/scoring.js` — `computeResult` nhận thêm `raw.score` (→ `result.score`, mặc định = số câu đúng)
   và `raw.scoreText` (→ chuỗi điểm định dạng sẵn, mặc định null). `rankCompare` xếp theo `score`
   (= số câu đúng với game cũ nên không đổi).
2. `core/leaderboard.js` — `addEntry` nhận thêm `scoreText` (mặc định null), lưu vào entry.
3. `core/engine.js` — `finish` truyền `score: result.score` + `scoreText` xuống leaderboard; bảng tổng
   kết + hàng leaderboard hiện `scoreText` nếu có (không thì vẫn "đúng/tổng" như cũ). Thêm cờ template
   `hideTimerOption` (ẩn nhóm Timer toàn-ván trong panel Options — song đôi với `hideLettersOption`).

Template khai báo `hideTimerOption:true`, `hideLettersOption:true`, `inlineTimerBar:true` (mượn ô
`ui.topbarMid` cho thanh đếm ngược), và gọi `ui.finish({score, scoreText, ...})`.

## 6. Đã tự test (trình duyệt thật, devserver 5511, 0 lỗi console)

READY → intro cửa mở → get ready → câu hỏi (4 & 3 đáp án, layout tự chỉnh) → **trả lời đúng** (✓ +
132/370 điểm theo tốc độ) → **trả lời sai** (✗) → **vòng bonus** (chọn lá → +250) → **50:50** (bỏ 2 sai) →
**×2** (điểm ×2 = 370) → **REVEAL** (nháy đáp án, nút mờ sau khi dùng, lifeline giữ "đã dùng" xuyên câu) →
Submit → **bảng tổng kết hiện ĐIỂM 382** + "1st on leaderboard" → **Leaderboard hiện 382** (không phải
382/10) → **Show answers** (đủ câu/đáp án bạn/đáp án đúng). Quiz vẫn chạy đúng (0 lỗi) sau khi sửa core.

## 7. Việc còn có thể làm sau (thầy chưa yêu cầu)

- Chưa tự kiểm trực quan: **+TIME** (logic +10s đơn giản) · **Lives giới hạn → Game over** (đã có code
  `loseLife→finishGame(false)`, chưa chạy tới màn 0 mạng khi test vì để Unlimited).
- Âm thanh chỉ nghe được trên máy thật (session build không nghe) — cần thầy xác nhận trên TOMKO.
- Style panel đổi theme không ảnh hưởng look (art cố định) — giống các game art-thật khác, không phải lỗi.
- 🎤/🖼️ voice+image cho câu hỏi/đáp án (để bàn sau, như Quiz/Anagram).
- Print: đã có `toPrintItems` (định dạng Quiz) — chưa in giấy thật để xác nhận.

## 8. Rollback

Các file MỚI đều trong `templates/gameshow/`. Core chỉ thêm (không xoá) — muốn lùi core: `git revert`
đúng commit. Chi tiết nhật ký: `GHI CHU DU AN.md` đợt 26.
