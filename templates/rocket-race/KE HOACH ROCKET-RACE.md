# KẾ HOẠCH TEMPLATE MỚI — ROCKET RACE (đua tên lửa)

Ngày lập: 20/9/2026. Trạng thái: ✅ **thầy chốt cùng ngày (chặng 1+2 · luật A · emoji) → ĐÃ BUILD chặng 1+2, xem `GHI CHU ROCKET-RACE.md`**. Chặng 3 (LIVE điện thoại) vẫn là kế hoạch.
Nguồn cảm hứng: ảnh Blastroom "BlastRace" (6 tên lửa Liam/Mia/Noah/Aria/Leo/Zoe đua tới vạch đích ca-rô).

---

## 1. Blastroom chơi thế nào (đã tra) và AWord đang có gì

**Blastroom BlastRace**: học sinh quét mã, chơi trên ĐIỆN THOẠI RIÊNG, mỗi em một tên lửa; trả lời
đúng thì tên lửa bay tới; trả lời đúng liên tiếp (streak) được thưởng; có "power-up gây hỗn loạn";
màn chiếu của thầy hiện bảng đua cập nhật tức thì; tối đa 50 em. Họ còn có "board modes" = chơi
trên 1 màn hình chung, không cần điện thoại.

**AWord hôm nay** (đã mổ code, chi tiết mục 7):
- KHÔNG có kiểu "nhiều điện thoại cùng đua trên 1 màn chiếu". Mọi lượt chơi là (a) 1 em một mình
  qua link/QR, hoặc (b) 1 màn hình chung của thầy, đội thay phiên (Showdown / Fight).
- Đã có sẵn nhiều thứ dùng lại được: khung 16:10,5 + zoom fullscreen của core, bộ điểm/leaderboard/
  bài giao, Options panel tự dựng, bộ nhớ lỗi "Start with mistakes", âm thanh `createPack`, ảnh nền
  vũ trụ + hành tinh của Maze chase, cách vẽ phương tiện bằng SVG trong JS của Balloon pop.

⇒ Kế hoạch chia 3 CHẶNG. **Chặng 1 là cái template thật sự** — xong là chơi được ngay ở lớp và
giao bài về nhà. Chặng 2–3 là mở rộng, làm sau nếu thầy muốn.

---

## 2. CHẶNG 1 — "Rocket race" chơi MỘT NGƯỜI đua với 3–5 tên lửa máy (đề xuất build trước)

### 2.1 Cách chơi (nhìn từ mắt học sinh)
1. Bấm PLAY → đếm 3-2-1 → 4–6 tên lửa xếp hàng bên trái, vạch đích ca-rô bên phải. Tên lửa của em
   có tên em (hoặc "YOU"), sáng hơn, luôn ở làn giữa. Các tên lửa máy có tên + mặt thú (🐱🐶🦊🐼🐸).
2. Nền sao trôi từ phải sang trái (2 lớp, lớp gần trôi nhanh hơn) ⇒ cảm giác đang bay.
3. Phía dưới khung: câu hỏi + 2–4 ô đáp án (giống Quiz). Em chạm đáp án:
   - **Đúng** → tên lửa PHỤT LỬA, lao tới 1 nấc, tiếng "whoosh", ✓ bay về ô điểm. Đúng 3 câu liên
     tiếp → lửa dài gấp đôi + chữ "TURBO!" + điểm thưởng combo (+1, +2… tối đa +5, giống Whack-a-mole).
   - **Sai** → động cơ KHỰNG (khói, tên lửa rung, tụt nhẹ), mất 1 tim (nếu bật tim), trừ điểm bay "−N"
     (nếu bật), streak về 0; ô sai mờ đi, đáp án đúng KHÔNG lộ; câu đó được xếp lại cuối hàng để hỏi
     lại (đúng luật "hỏi lại tới khi đúng" như Maze chase).
4. Tên lửa máy chạy đều theo tốc độ "Rival speed" (chậm/vừa/nhanh) và **hơi níu dây** (em dẫn xa thì
   máy nhanh lên chút, em tụt xa thì máy chậm chút) để cuộc đua luôn sát nút nhưng ai giỏi vẫn thắng.
5. **Về đích** khi tên lửa em đi hết N nấc (N = số câu của đề). Màn kết: hạng (🥇🥈🥉…), pháo giấy
   nếu về nhất, rồi bảng Score / Time / Leaderboard / Show answers của core như mọi game khác.
   Hết tim → "Game over". Hết giờ (Timer của core) → "Time's up".
6. **Power-up** (tuỳ chọn, bật/tắt trong Options): thỉnh thoảng một hộp ⭐ hiện trong làn của em;
   trả lời ĐÚNG câu kế là nhặt được, dùng tự động: 🛡 Khiên (miễn khựng 1 lần sai) · 🚀 Turbo (nấc kế
   bay nhanh gấp đôi, đẹp mắt) · ☄ Sao băng (tên lửa máy đang dẫn đầu bị chậm 2 giây).
   Power-up KHÔNG cho tiến thêm nấc ⇒ điểm vẫn = số câu đúng (xem 2.3).

### 2.2 Vẫn học tiếng Anh như các template khác
- Nội dung = **đúng bộ câu hỏi Quiz** (`content.questions` = câu hỏi + 2–4 đáp án, 1 đúng). Nhờ vậy:
  mọi act Quiz/Gameshow/Maze chase đang có bấm "Change template" là thành Rocket race ngay; editor
  dùng lại `quiz-editor.js` như Maze chase (chỉ ~26 dòng bọc), Import .xlsm/Courses không phải sửa.
- Câu hỏi luôn hiện to, rõ, chữ Việt `line-height ≥ 1.35`; tên lửa bay KHÔNG che câu hỏi.
- "Start with mistakes", "Show answers", báo cáo bài giao, kho lỗi — tất cả chạy qua core như cũ.
- Giao bài về nhà được (không `noAssignment`): em làm ở nhà vẫn có đối thủ là tên lửa máy.

### 2.3 Luật điểm (đề xuất chặt chẽ, cần thầy chốt — xem câu hỏi cuối file)
- **Phương án A (đề xuất)**: tiến độ = SỐ CÂU ĐÚNG. Mỗi câu đúng = 1 nấc, không hơn không kém.
  Streak/power-up chỉ cho điểm thưởng + hiệu ứng, không cho nấc. ⇒ Điểm nộp lên bài giao = số câu
  đúng / số câu đề, đúng luật `items` của Đợt 294. Trung thực, thầy đọc bảng điểm hiểu ngay.
- **Phương án B**: streak làm tên lửa "dồn tốc" đi 2 nấc ⇒ hấp dẫn hơn nhưng em trả lời 15/20 đúng
  vẫn có thể về đích ⇒ điểm không còn = số câu đúng. Không khuyên dùng cho bài giao.

### 2.4 Options (khai cờ, core tự dựng panel — không tự vẽ DOM panel)
| Ô | Giá trị | Ghi chú |
|---|---|---|
| Timer | core sẵn (None / Count up / Count down) | |
| Lives | 0–10, **0 = Unlimited** | khuôn true-false/TTA, act cũ "chưa set" = ∞ |
| Points off for wrong | core `pointsOff` | trừ điểm bay `ui.flyPenalty` |
| Shuffle answers | core, khai `usesShuffleAnswers` | |
| Rivals | 3 · 4 · 5 tên lửa máy | mặc định 4 |
| Rival speed | Slow · Normal · Fast | mặc định Normal |
| Power-ups | bật/tắt | mặc định bật |
| Question time | 0 = Untimed, 5–60 s | hết giờ 1 câu = tính sai (giống Gameshow) |

### 2.5 Hình & tiếng (tự vẽ, không dính bản quyền)
- **Tên lửa**: 1 hình SVG inline trong JS (khuôn Balloon pop), tô màu theo làn bằng biến CSS; phi
  công = emoji thú (rẻ, dễ thương, đổi sau được). Lửa đuôi = 2 lớp SVG nhấp nháy bằng CSS animation.
- **Nền**: gradient tối + 2 lớp sao vẽ bằng `box-shadow` (không ảnh), trôi bằng CSS animation; 2–3
  hành tinh `.webp` **CHÉP** từ `maze-chase/img` sang `rocket-race/img` (luật: không import chéo
  template, chép file là cách các template khác vẫn làm).
- **Vạch đích** ca-rô CSS; **minimap** thanh mảnh trên đỉnh hiện chấm 6 tên lửa (phòng khi màn nhỏ).
- **Tiếng**: `templates/rocket-race/sounds/` chép các file cần từ pack Balloon pop (`gamecompleted`,
  `gameover`, `timesup`, `restart`, `leaderboard`, `ting-01/02`, `planeflyby`) + Maze chase
  (`comet`, `ufo`, `teleport`, `correct`, `incorrect`, `clocktick`) — thiếu tiếng phụt lửa/khựng máy
  thì tổng hợp bằng Web Audio qua `coreSound.context()` (khuôn Running team), KHÔNG `new Audio()`.

### 2.6 Bố cục trong khung 16:10,5 (đơn vị `--aw-u`, ⛔ cấm cqw/vw)
- Trên (≈8%): minimap + tim (khe `hasLivesSlot` của core) + đồng hồ core.
- Giữa (≈52%): đường đua 4–6 làn.
- Dưới (≈40%): câu hỏi + lưới đáp án 2×2 (hoặc 1 hàng nếu 2 đáp án).
- ⚠️ **Điện thoại 375×246 px** (khung tràn viền Đợt 258): đường đua co thành dải mỏng (tên lửa nhỏ,
  chỉ 1 hàng minimap to hơn), câu hỏi chiếm phần lớn. Cần một bậc `@container` đặt CUỐI file CSS.
  Đây là chỗ khó nhất về giao diện — sẽ đo thật 3 mốc theo bẫy "đo layout quá sớm".

### 2.7 Kỹ thuật (cho phiên Claude sẽ build — tóm tắt hợp đồng đã mổ)
- Thư mục `templates/rocket-race/`: `rocket-race.js` (registerTemplate, `type:"rocket_race"`,
  class `.aw-rr-*`), `rocket-race.css`, `rocket-race-editor.js` (bọc quiz-editor), `rr-sound.js`,
  `sample-rocket-race.js`, `img/`, `sounds/`, `GHI CHU ROCKET-RACE.md`.
- Đăng ký = **1 dòng** trong `core/catalog.js` + icon `fmtRace` trong `TEMPLATE_ICON` (2 dòng đó chỉ
  thêm khi thầy CHỐT ✅); thêm 1 nhánh `toRecords()`/`buildContent()` kind `qa` trong `core/convert.js`
  để "Change template" hiểu (ghi ĐỀ XUẤT SỬA CORE, chờ duyệt). Sau đó chạy
  `python tools/sinh-preload.py --write` + commit `core/tpl-files.js`.
- Vòng lặp thời gian thực: **`setInterval` 50 ms tính theo delta có kẹp 100 ms** (khuôn Maze chase +
  Balloon pop), ⛔ không rAF cho gameplay (tab ẩn đóng băng). Vị trí tên lửa = `left` theo biến CSS,
  mượt bằng `transition`. Mọi `element.animate()` kèm `setTimeout` dự phòng + cờ `done`.
- Cờ khai: `itemsKey:"questions"`, `hasLivesSlot:true` (⛔ không khai kèm `inlineTimerBar`),
  `usesShuffleAnswers:true`, `preloadImages` cho ảnh dựng bằng JS, `onPause` dừng interval + nhạc
  (bridge cấp module, reset `null` trong cleanup), `cleanup()` dòng đầu bật cờ `dead`.
- Kết thúc: `ui.flushPenalties()` dòng đầu `finish()`; gọi `ui.finish({correct, incorrect,
  total (số LƯỢT), items (số CÂU), perQuestion, review (đủ 6 trường + src), answered, score, title})`;
  `renderSummary` riêng để chèn dòng "🥇 1st place!" phía trên bảng chuẩn (khuôn Running team).
- Ước lượng: ~1.400–1.800 dòng js+css (cỡ Balloon pop → Whack-a-mole). Chia 4 mốc kiểm được bằng
  mắt: (1) cảnh đua tĩnh + tên lửa + nền trôi · (2) hỏi–đáp + tiến nấc + máy chạy + về đích ·
  (3) streak/power-up/tiếng · (4) điện thoại + 4 theme + fullscreen + bài giao thật.

---

## 3. CHẶNG 2 — chơi CẢ LỚP trên màn chiếu (không cần điện thoại) — làm sau chặng 1
- Options thêm "Mode: Solo · Teams". Teams = 2–6 tên lửa là ĐỘI của lớp (tên đội gõ tay, hoặc chia
  từ sổ lớp Settings → Classes như Showdown). Đến lượt đội nào thì tên đội sáng lên, thầy gọi 1 em
  trả lời (quay vòng theo sổ lớp như Running team). Đúng → tên lửa đội đó tiến; sai → khựng.
- Không cần Firestore, không cần mạng — đúng kiểu "board mode" của Blastroom.
- Có thể bật thêm `showdownMode` (mỗi trình duyệt/cột myActivity một đội) nhưng phải thoả 3 điều
  kiện + `setRoundTimeout`/`roundDone`; và Fight (2 khung cạnh nhau, mỗi khung 1 đội đua với máy —
  đội nào về đích trước thắng) chỉ cần `fightMode` + `keepItemOrder`. Chốt sau khi chặng 1 chạy.

## 4. CHẶNG 3 — LIVE: mỗi em một điện thoại, màn chiếu hiện cả lớp đua (giống Blastroom thật)
- Là hạ tầng mới, KHÔNG thuộc template: 1 nhánh luật Firestore mới
  `assignments/{code}/race/{playerId}` (đọc công khai, ghi giới hạn khoá) + `core/race.js` (điện
  thoại ghi 1 lần/câu) + trang `race.html` cho máy chiếu (thầy đăng nhập, 1 `onSnapshot` duy nhất).
- Luật cứng về hạn mức: **chỉ MÀN CHIẾU nghe, điện thoại chỉ GHI** (30 em × 20 câu = 600 lượt đọc/ván;
  nếu điện thoại cũng nghe thì ×30 = 18.000 lượt đọc/ván).
- Rủi ro: wifi lớp rớt 5 giây là tên lửa đứng hình trước cả lớp (phải vẽ trạng thái "mất sóng");
  cửa ghi công khai có thể bị spam nếu lộ mã; trùng tên (khoá theo `browserId`, hiện "Tên (2)").
- Tên lửa trên máy chiếu = tên em gõ ở màn READY (hoặc `&n=` từ myLesson). Sổ lớp không có ảnh/avatar.
- Cần thầy quyết riêng, sau khi chặng 1 + 2 đã chơi thật.

---

## 5. Xung đột / phát hiện ngoài lề khi mổ code (báo thầy, không tự sửa)
1. `balloon-pop` **chưa nối `onPause`** (Đợt 91 bỏ sót): mở ☰ Menu giữa ván, đồng hồ + khinh khí cầu
   vẫn chạy sau lớp mờ. 4 game hành động kia đã vá. Đề nghị vá riêng một đợt nhỏ.
2. `running-team.js:140` câu `noAssignment` ghi "a two-team classroom game" — chép nhầm từ Running
   word (Running team không có đội). Chỉ là chữ, sửa 1 dòng khi tiện.
3. `docs/08-FIREBASE-SETUP.md` + `APP_MASTER.md` còn ghi gói **Spark**; thực tế đã lên **Blaze 28/8**.
   Tài liệu lạc hậu, nên sửa để phiên sau không tính hạn mức sai.
4. Race (chặng 2–3) là **chế độ thứ ba** bên cạnh Showdown/Fight — cả hai đều giành dòng giữa
   topbar; phải khai loại trừ ngay từ đầu, không thì lặp lỗi cũ.

## 6. Câu hỏi thầy cần chốt trước khi build
1. Build chặng 1 (đua với máy, chơi một mình + giao bài) trước? Hay muốn chặng 2/3 ngay?
2. Luật điểm A (tiến độ = số câu đúng) hay B (streak cho dồn nấc)?
3. Tên: "Rocket race"? Phi công = emoji thú có được không, hay vẽ mặt SVG riêng?
4. "ok build" → mới bắt đầu code, theo 4 mốc ở 2.7.

## 7. Nguồn đã đọc
`core/HUONG DAN CORE.md` (hợp đồng registerTemplate, ui.finish, luật khung/cqw/cleanup) ·
`templates/CONG THUC MAU.md` · `templates/HUONG DAN TEMPLATE.md` · `core/catalog.js` ·
`templates/{maze-chase,balloon-pop,flying-fruit,whack-a-mole,running-team}` (js+css+GHI CHU) ·
`core/{showdown*,fight,assignments,leaderboard,classes}.js` · `play.js` · blastroom.net.
