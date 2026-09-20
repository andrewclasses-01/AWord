# GHI CHÚ — ROCKET RACE (đua tên lửa)

Trạng thái: 🟢 **CHỜ THẦY DUYỆT** (build xong 20/9/2026, Đợt 350 — số đợt chốt lại sau `git pull`).
Kế hoạch gốc + lý do từng quyết định: `KE HOACH ROCKET-RACE.md` cùng thư mục. Thầy đã chốt 20/9:
build **chặng 1 + chặng 2 cùng lúc** · luật điểm **A** (mỗi câu đúng = 1 nấc, không hơn) · tên
"Rocket race" · phi công **emoji thú**.

## 1. Game là gì (nói cho người không chuyên)
- Nội dung = bộ câu hỏi **Quiz** (câu hỏi + 2–6 đáp án, 1 đúng). Mọi act Quiz / Gameshow / Maze chase
  đang có bấm **Change template** là thành Rocket race ngay; editor dùng lại editor Quiz.
- **Solo** (mặc định, và là chế độ DUY NHẤT khi HS mở link bài giao): tên lửa "YOU" đua với 3–5 tên
  lửa máy (Mia, Leo, Zoe…). Trả lời đúng → tên lửa phụt lửa tiến **1 nấc** (N nấc = N câu của đề).
  Sai → khựng máy (rung + khói), mất 1 tim (nếu bật), "−N" bay (nếu bật Points off), câu đó xếp
  cuối hàng để hỏi lại. Đúng 3 câu liên tiếp → **TURBO** (lửa xanh, sao trôi nhanh, tên lửa máy chậm
  lại 4,5 s). Power-up: hộp ⭐ hiện trong làn sau 3 câu đúng rồi mỗi 4 câu; câu đúng kế nhặt được:
  🛡 khiên (miễn khựng + không mất tim 1 lần, **vẫn trừ điểm nếu bật Points off**) · 🚀 turbo ·
  ☄ sao băng (tên lửa máy dẫn đầu bị đẩy lùi 0,6 nấc + đứng 1,6 s). Về đích → banner "1ST PLACE!"
  + tiêu đề bảng kết quả "🥇 1st place!"; hết tim → "Game over".
- **Teams** (chỉ màn hình thầy — HS mở link luôn là Solo): tên lửa = đội (2–6). Màn TEAMS trước
  khi đua: sửa tên đội, chọn lớp (Settings → Classes) để chia HS vào đội và gọi tên từng lượt.
  Câu hỏi chia vòng tròn cho các đội (đội nào có bao nhiêu câu thì đường đua dài bấy nhiêu nấc).
  Đúng → đội đó tiến; sai → khựng, câu đó MẤT (không hỏi lại). Hết câu của mọi đội → xếp hạng:
  đội về đích trước thắng, chưa về thì so % đường đã đi. Tiêu đề bảng: "🏆 <đội> wins!".
- Điểm nộp lên = **số câu đúng / số câu đề** (`ui.finish({items: N})` Đợt 294); `total` của bảng
  tổng kết = số LƯỢT (câu hỏi lại tính thêm 1 lượt) — cùng nết Open the box / True-false.

## 2. Options (Options panel, core dựng — template chỉ khai)
| Ô | Giá trị | Mặc định |
|---|---|---|
| Lives | 0–10, 0 = ∞ | 0 |
| Mode | Solo · Teams | Solo |
| Rivals (solo) | 3–5 | 4 |
| Teams (teams mode) | 2–6 | 2 |
| Rival speed | Slow 10 s · Normal 7 s · Fast 5 s mỗi nấc | Normal |
| Question time | 0 = ∞, 1–60 s; hết giờ = tính sai | 0 |
| Power-ups (ô tick) | bật/tắt (chỉ Solo) | bật |
| Timer / Shuffle / Shuffle answers / Show answers / Points off | của core | |

Tên lửa máy có "níu dây": em dẫn trước càng xa thì máy càng cố (tới +45 %), em tụt càng xa thì máy
càng lười (tới −45 %) — cuộc đua luôn sát nút nhưng ai trả lời đều tay vẫn thắng. Mỗi tên lửa máy
có "tính cách" ±14 % để không chạy thành hàng.

## 3. Cấu trúc file
`rocket-race.js` (registerTemplate `type:"rocket_race"`, class `.aw-rr-*`) · `rocket-race.css` ·
`rocket-race-editor.js` (bọc quiz-editor, đóng dấu type lại) · `rr-sound.js` (100 % Web Audio
synth, không mp3, có tiếng nền động cơ `hum`) · `sample-rocket-race.js` · `img/` (3 hành tinh CHÉP
từ maze-chase — luật không import chéo template) · `test.html` + `test.js`.

Cờ khai: `itemsKey:"questions"` · `hasLivesSlot` · `manualTimerStart` (đồng hồ core chạy lúc GO) ·
`usesShuffleAnswers` · `preloadImages` · `checkOrder` · `onPause` (bridge cấp module
`rrPauseHandlers`, dừng interval + tiếng nền, dịch hạn `qDeadline`/`turboUntil`/`stunUntil`).
Vòng lặp: **`setInterval` 50 ms, delta kẹp 100 ms** — không rAF (tab ẩn chỉ làm cuộc đua chậm lại).

## 4. ĐỀ XUẤT SỬA CORE — đã sửa TẠM trong cây làm việc, thầy duyệt rồi mới commit
Tất cả đều là **thêm 1 dòng theo đúng khuôn Maze chase**, không đổi nhánh nào đang chạy:
1. `core/catalog.js` — 1 mục `rocket_race` (dòng đăng ký hợp lệ theo luật) + `TEMPLATE_ICON.rocket_race: "fmtRace"`.
2. `core/convert.js` — `"rocket_race"` vào `QA_TARGETS` + `NEED_CLUE`; thêm `case "rocket_race"` cạnh
   `maze_chase` ở cả `toRecords()` lẫn `buildContent()` ⇒ Change template hai chiều.
3. `core/assignment-ui.js` — `TPL_SHORT.rocket_race: "ROCKET"` (đuôi tiêu đề bài giao).
4. `core/tpl-files.js` + khối AW-PRELOAD — sinh lại bằng `python tools/sinh-preload.py --write`
   (index/play.html KHỚP, chỉ tpl-files.js đổi).

## 5. Đã tự kiểm bằng máy (bàn thử `test.html`, viewport 1280×860 + 375×812, 0 lỗi console)
- Solo: sai → `is-stall` + 2 khói + ô mờ + điểm 0 + câu quay lại cuối hàng; đúng → `--x` 5 → 13,1
  (= 81/10 nấc) + điểm 1 + puff. Chuỗi đúng 3 → banner TURBO!; hộp 🚀 rồi ☄ hiện đúng nhịp, nhặt
  đúng (METEOR đẩy lùi tên lửa dẫn đầu). Về đích 🥇, bảng "🥇 1ST PLACE!" Score 10/11 (1 lượt sai).
- Lives 2 → 2 lần sai: tim 2→1→0, bảng "GAME OVER", Score 1/10, Show answers 10 dòng đúng chữ.
- Question time 3 s: thanh đếm, banner "TIME'S UP", ô khoá, sang câu kế, điểm 0.
- Teams 3 đội: màn TEAMS (4/3/3 câu), đổi tên "Blue Sharks", chip lượt "🐸Blue Sharks → 🐯Team 2 →
  🐼Team 3", nav "1 of 4 / 1 of 3", đội sai mất câu, kết thúc "🏆 TEAM 3 WINS!" Score 9/10. Ô chọn
  lớp trong bàn thử báo "Sign in to use your classes" (đúng: chưa đăng nhập).
- ☰ Menu: tên lửa máy đứng yên suốt lúc mở (x không đổi 1,5 s), đóng lại chạy tiếp.
- Điện thoại 375×246: đường đua thành dải 71 px, ô đáp án 118×116 px, chữ câu 13,5 px, chữ đáp án
  11,25 px, không tràn khung (đáy panel 242/246). Tên tên lửa máy ẨN trên điện thoại (6 px không đọc
  được), chỉ giữ tag "YOU" to hơn.
- `ensureTemplate("rocket_race")` qua registry + tpl-files nạp được (đường HS mở bài giao sẽ đi).

## 6. Chưa kiểm / chờ mắt thầy (⬜)
- ⬜ Trang thật: New activity → Rocket race → sửa nội dung → chơi; Change template từ 1 act Quiz.
- ⬜ 4 theme (game khoá nhìn vũ trụ như Maze chase, chỉ bảng kết quả theo theme) + fullscreen zoom.
- ⬜ Teams + chọn lớp thật (cần đăng nhập) → tên HS hiện ở chip lượt.
- ⬜ Giao bài thật cho 1 em: điểm nộp = đúng/N, dấu perfect khi đúng hết dù có lượt sai.
- ⬜ TOMKO / iPad: chạm ô đáp án (dùng `press()`), tiếng synth trên Safari.
- ⬜ Cảm giác tốc độ Normal 7 s/nấc có vừa với lớp không — chỉnh `RIVAL_SECS` ở đầu file.

## 7. Chưa làm (có chủ ý)
- Fight / Showdown: chưa khai (`fightMode`/`showdownMode`) — cần chốt chỗ đặt dòng tên HS trên
  cảnh đua toàn khung (cùng lý do Maze chase / Flying fruit chưa bật). Ghi ở kế hoạch chặng 2.
- Chặng 3 LIVE nhiều điện thoại: hạ tầng riêng (`assignments/{code}/race/*` + `race.html`), xem
  `KE HOACH ROCKET-RACE.md` mục 4 — chờ thầy quyết.
- Time cost: không khai (câu hỏi đã có Question time riêng).

## 8. Bẫy đã cắn trong khi build (để phiên sau khỏi lặp)
- **TDZ**: `let setupEl…` khai cạnh `renderSetup()` nhưng `renderSetup()` được gọi TRƯỚC dòng đó
  ⇒ `ReferenceError` im lặng trên màn TEAMS, 0 lỗi lúc `node --check`. Đã dời lên đầu state.
- Turbo tự bật lại SAU khi về đích: `endSolo()` đặt `turboUntil = 0` rồi `onCorrect()` mới kiểm
  streak ⇒ thêm `if (mover.done) return` ngay sau `fireRocket()`; ở Teams thì phải chuyển lượt
  TRƯỚC khi return (đội về đích xong game vẫn tiếp).
- Bàn thử: `press()` bắn handler ở `pointerdown` VÀ ở `click` không tin cậy — driver mô phỏng
  chỉ nên `el.click()`, đừng bắn cả hai kẻo handler chạy 2 lần (đã có `locked` chặn nhưng đừng dựa).
