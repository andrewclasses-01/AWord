# GHI CHÚ — MAZE CHASE (game thứ 9)

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
