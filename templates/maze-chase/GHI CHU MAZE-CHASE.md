## ⭐ Đợt 480 (05/10/2026) — iPAD LÀM D-PAD. Lõi nay là myGame **2q** (`3d/mc3d-2q.*`). Đường nối: `3d/mc3d-padlink-2q.js` (WebRTC, chép) + `sl-pad-signal.js` (Firestore bắt tay, của AWord) + trang `../../pad.html`. Nút Tablet ⇒ QR. Bàn thử không đăng nhập: `test.html?padsig=local&fight=1` + `/pad.html?t=0&padsig=local` (tab khác). Chi tiết + checklist iPad thật: `GHI CHU DU AN.md` Đợt 480.

## ⛔⛔ Đợt 450 (03/10/2026) — BẢN 2D ĐÃ GỠ HẲN (không còn đường lùi). Máy không có WebGL chỉ thấy một dòng báo. Mục Đợt 91 trở về trước là lịch sử bản 2D.

# GHI CHÚ — MAZE CHASE (game thứ 9)

## ⭐⭐ Đợt 447 (02/10/2026) — MAZE CHASE NAY LÀ **STAR LOOT 3D**. ĐỌC MỤC NÀY TRƯỚC.

- `maze-chase.js` = STAR LOOT (đăng ký `maze_chase`). Phần dưới mục này (Đợt 91 trở về trước) nói về bản **2D**, nay ở `maze-chase-2d.js` — chỉ còn là ĐƯỜNG LÙI (máy không WebGL / 3D nạp lỗi) và cho editor · sample · in ấn.
- `3d/` + `am-thanh/` là BẢN CHÉP từ kho myGame (`E:\LAP TRINH APP\myGame\maze-chase`, mẫu `2n`) — ⛔ KHÔNG sửa tay. Sửa STAR LOOT: làm bản mới ở myGame (bản mới = tên mới) → thầy OK → sửa `BAN`/`CORE` trong `tools/chep-star-loot.py` nếu tên lõi đổi → chạy `python tools/chep-star-loot.py` (tự đổi import three về `../../rocket-race/vendor/three`, chép đúng 46 file tiếng trong `LIB`, ghi `3d/NGUON.json` = mã commit myGame) → đổi `CSS_3D` + đường `import("./3d/mc3d-XX.js")` trong `maze-chase.js` cho khớp.
- STAR LOOT phủ TRỌN TRANG (`.aw-sl-host` trên `<body>`, z-index 1000; `html.aw-sl-on` khoá cuộn). Hàng nút là của STAR LOOT nhưng đi qua `ui.host` của engine: Thư mục = act thật cùng thư mục · Options Apply / Mode ⇒ `activity.options.starLoot` + lưu act · Menu (ở màn START / kết quả) = Library + Change template; Menu giữa ván = Paused + 2 nút đó.
- Học sinh: KHÔNG giao bài được (`noAssignment`). Không `ui.finish` ⇒ không bảng xếp hạng engine; kết quả + Show answers là màn của STAR LOOT.
- Bàn thử: `scratch/dot447-sl.html` (`?src=anagram` = act từ vựng đổi template · `?fight=1`). Browser pane KHÔNG vẽ WebGL/overlay — chụp bằng BrowserWindow offscreen trong Electron (xem GHI CHU DU AN Đợt 447). Lái tay: `window.__mc` (start · step · state · setFight · press · destroy).

**Đợt 91 dự án (8/8/2026, v0.9.65) — nối `onPause` cho MENU PAUSE toàn hệ thống. ✅ THẦY DUYỆT → COMMIT
`be7cd55` + PUSH + LIVE.**
Chỉ đụng `maze-chase.js`: thêm `pauseGame`/`resumeGame` + bridge module `mazePauseHandlers` + `onPause`.
Đơn giản nhất trong 7 game đã nối — `moveTimer`/`enemyTimer` là nhịp di chuyển cố định (không đếm ngược
gì), nên chỉ cần `clearInterval` lúc dừng / `setInterval` lại y hệt lúc mở, có nhớ đúng cái nào ĐANG chạy
tại thời điểm dừng (enemyTimer cố ý null trong lúc khoá câu hỏi giữa 2 câu — không hồi sinh nhầm). Tự test
trình duyệt thật: đo toạ độ `--r/--c` của enemy — đứng yên tuyệt đối suốt lúc Menu mở, di chuyển lại đúng
khi đóng, đồng hồ chung (`ui.startTimer`) chạy lại đúng nhịp thời gian thực (37s→40s sau đúng 3s). Chi
tiết cơ chế chung: `core/HUONG DAN CORE.md` mục "MENU PAUSE", `GHI CHU DU AN.md` Đợt 91.

**TRẠNG THÁI: ✅ ĐÃ CHỐT — SỐNG Ở TRANG CHỦ + LIVE** (1/8/2026, Đợt 32; thầy duyệt gộp cả 8 template
tồn kho một lượt, rồi tự test và xác nhận). Đã `built:true` trong `core/catalog.js`, commit + push,
GitHub Pages đã deploy. Chơi thử riêng vẫn được: `test.html`.
> Sửa tiếp game này thì chỉ đụng `templates/maze-chase/*`; **đừng thêm import/link CSS ở
> `index.html`/`main.js`** — từ v0.9.7 template được nạp tự động qua `ensureTemplate()`.

Dựng lại act Classic của thầy: <https://wordwall.net/resource/116866716/maze-chase> — Visual style
**Space** (theme nội bộ Wordwall tên `space`, template id `49`). Thầy chốt: **style Space này = "Classic"
của Maze chase trong AWord** (game giữ look Space CỐ ĐỊNH, không đổi theo 4 theme AWord — giống
whack-a-mole/flying-fruit).

## 1. Cách chơi (Wordwall gốc → bản AWord)

- Câu hỏi (Quiz model: 1 câu + nhiều đáp án, đúng 1) hiện ở BĂNG trên đỉnh + dãy TIM (lives) bên phải.
- Các đáp án nằm trên các **BỆ (pad)** — bệ công nghệ khung cam màn hình tím — rải khắp **MÊ CUNG** vũ trụ.
- Người chơi lái **chú robot phi hành gia trắng** dọc hành lang mê cung tới bệ mình cho là ĐÚNG, trong
  khi **NÉ các robot địch** (đỏ/xanh) đang đuổi theo trong mê cung.
  - Tới bệ ĐÚNG → bệ sáng ✓ xanh + `MazeChaseAnswerRight` + điểm +1 + (900ms sau) sang câu mới.
  - Tới bệ SAI → bệ hiện ✗ đỏ + `MazeChaseAnswerIncorrect`, bệ **bị loại** (mờ đi), **mất 1 TIM**, tiếp
    tục tìm bệ đúng.
  - Địch chạm người chơi → `PlayerDamage`+`Eject`, **mất 1 TIM**, văng về điểm xuất phát, có **khiên tạm**
    (~1.4s nhấp nháy) + địch bị đẩy về góc xa.
  - **Hết TIM** (mặc định 5) → Game over → engine dựng panel tổng kết (Score/Time/Leaderboard/Show
    answers/Start again). Làm HẾT câu đúng → Game complete (fanfare).
- **Điều khiển**: phím mũi tên / WASD · **D-pad cảm ứng** góc dưới-phải (cho màn chạm TOMKO) · **vuốt**
  trên mê cung. Kiểu Pac-Man: người chơi trượt liên tục theo hướng, cua được **đệm** (buffered) tới khi
  gặp hành lang mở.

## 2. Options (khớp Wordwall)

Wordwall có: Timer (None/Count up[mặc định]/Count down) · **Lives** (mặc định 5) · **Difficulty**
(mặc định 10) · Shuffle question order. Bản AWord:
- Timer/Shuffle/Show answers: dùng panel Options CHUNG của engine.
- **Lives** + **Difficulty (1–10)**: thêm qua `buildExtraOptions` (số bước ▲▼). Difficulty quyết định
  **số địch** (≤3→1, ≤6→2, ≤8→3, else 4) + **tốc độ địch** (`enemyStepMs = max(230, 400 − diff*14)`).
  Người chơi luôn nhanh hơn địch (bước 160ms) nên né được.

## 3. Kỹ thuật (điểm mấu chốt)

- **Mê cung**: sinh ngẫu nhiên MỖI câu bằng DFS (spanning tree) rồi **braid** (mở thêm 1 tường ở mọi
  ngõ cụt) → mê cung có VÒNG, hợp cho rượt đuổi + tránh ngõ cụt DỌC (bộ ảnh Wordwall không có nắp bịt
  dọc). Openings (U/D/L/R) → chọn ảnh ô hành lang (`maze-cross/path-ud/corner-ul/tjunction-udl/...`).
- **Di chuyển**: ô-sang-ô bằng `setInterval` (STEP_MS 160ms) — **KHÔNG rAF** (luật lõi: tab ẩn đóng băng
  rAF). Mượt nhờ CSS `transition: left/top`. Địch: `setInterval` riêng (enemyStepMs), mỗi bước **BFS**
  một ô về phía người chơi + 22% ngẫu nhiên.
- **Sprite** (spritesheet 4 cột × 7 hàng): `background-position` theo `--f` (khung) + `--row` (hàng =
  hướng: 2=xuống 3=lên 4=phải 5=trái, 0=đứng, 1=trúng đòn, 6=tia sét). Địch: cycle 4 khung hàng 0 +
  lật ngang khi đi trái.
- **Công bằng**: `GRACE_MS 1900` sau mỗi lần (re)spawn — địch di chuyển nhưng KHÔNG gây damage, cho người
  chơi kịp định hướng; khi bị chạm thì địch bị đưa về góc xa.
- **Chữ co**: `fitOnce(box, txt)` (cả rộng+cao) cho băng câu hỏi + chữ trên pad. Dùng ĐƯỢC 1 lần (không
  cần theo dõi resize) vì mọi thứ dùng **cqw** → fullscreen co ĐỀU, tỷ lệ fit giữ nguyên. (Trước dùng
  `autoFit` chỉ co theo CHIỀU CAO nên chữ dài như "Neptune" bị cắt — đã sửa.)
- **KHÔNG sửa `core/`**. Editor nội dung = **bọc `quiz-editor.js`** (cùng data model) rồi ép lại
  `type="maze_chase"` khi save + đổi badge "MAZE CHASE".

## 4. Âm thanh — ánh xạ CHÍNH XÁC + phần thiếu

Lấy từ `themejson/space/audios.json` (mỗi "Type" gắn đúng 1 sự kiện) đối chiếu file `.ogg` game THỰC SỰ
preload (Performance API). Tải `.ogg`→`.mp3` (ffmpeg). Chi tiết + danh sách: `AWord-data/Source/Sound
effect/MAZE CHASE/GHI CHU.md`. Có ĐỦ mọi âm ĐẶC TRƯNG của maze (footsteps ×5, answer/right/incorrect,
enemy appear/attack/passive, player appear/damage/death/eject/teleport, tile/map appear/eliminate,
clocktick, menu/menusubtle/reveal + ambience comet/jellyfish/ufo).
- **5 âm generic KHÔNG lấy được**: TimesUp / GameCompleted / GameOver / Restart / Leaderboard. Lý do:
  game lazy-load các âm này chỉ khi TỚI trạng thái đó, mà nút Play nằm trong **canvas WebGL** (screenshot
  đơ, không script bấm được để chơi tới cuối); URL không-băm thì 404. → Dùng **fanfare sẵn của engine**
  cho "complete", `clocktick` cho cảnh báo 5 giây cuối, `playerappear` cho "Start again". (Giống
  whack-a-mole từng bỏ ngỏ Menu/MenuSubtle — không phá trải nghiệm.)
- Ambience (comet/jellyfish/ufo) đã copy vào repo nhưng CHƯA nối vòng lặp nền (để tránh rối tiếng) —
  sẵn dùng nếu sau này muốn thêm nhạc nền vũ trụ.

## 5. Việc còn có thể làm (khi thầy muốn)

- Lấy nốt 5 âm generic (nếu thầy chơi act trên máy thầy để chúng nạp, hoặc bắt qua tài khoản Pro).
- Nhạc nền vũ trụ (spacebackgroundmusic1/2) + ambience loop.
- 🖼️ ảnh cho đáp án trong editor (giống các game khác còn nợ).
- Gộp trang chủ: thêm `{type:"maze_chase",label:"Maze chase",built:true,...}` vào `core/catalog.js` +
  `<link>` css vào `index.html` (CHỈ khi thầy duyệt — xem `HUONG DAN TEMPLATE.md`).

## 6. ĐỀ XUẤT SỬA CORE

- (nhẹ) Panel Options có nhóm **Shuffle answers/Letters** không hợp Maze chase — đã ẩn Letters
  (`hideLettersOption:true`). Không cần sửa core thêm.

## Đợt bổ sung — Trừ điểm khi chọn SAI (pointsOff)

- Thêm tuỳ chọn `pointsOff` (0–5, mặc định 0): mỗi lần chạy vào bệ đáp án SAI thì trừ `pointsOff` khỏi
  điểm sống (cho phép âm, KHÔNG chặn về 0). Va vào ĐỊCH vẫn chỉ mất TIM, KHÔNG trừ điểm.
- Cài trong `maze-chase.js` (biến `penalty`): điểm hiển thị = số câu đúng − `penalty`; `ui.finish` báo
  `score: correct - penalty`. Khi `pointsOff=0` mọi thứ y hệt cũ (không gọi setScore thừa ở nhánh sai).
  Đã thêm `pointsOff: 0` vào `sample-maze-chase.js`.

---

## Đợt 140 (13/8/2026) — BẢNG OPTIONS v2: tuỳ chọn riêng của template này chuyển sang lưới chung
✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Thầy yêu cầu thiết kế lại toàn bộ bảng Options (*"rất rối, khó nhìn, không thẳng
hàng"*); chi tiết đo đạc + 5 luật mới nằm ở `../../GHI CHU DU AN.md` Đợt 140 và
`../../core/HUONG DAN CORE.md` mục **"OPTIONS PANEL v2"**.

**Đổi ở template này**: `buildExtraOptions` viết lại bằng 4 hàm dựng chung engine truyền vào —
`mkCell` · `mkSeg` (thay hàng radio) · `mkSliderCell` (thanh trượt + chip giá trị 52px) ·
`addCheck` (đẩy ô tick vào khối switch dùng chung ở đáy panel).
**KHÔNG đổi**: tên trường trong `draft`/`activity.options`, khoảng giá trị, mặc định, hay bất kỳ hành
vi nào lúc chơi. Act cũ mở lên vẫn đúng y như trước.

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **562px → 333px**.
