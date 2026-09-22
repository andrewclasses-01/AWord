# GHI CHÚ — ROCKET RACE (đua tên lửa)

🆕 **Đợt 368 + 368b (22/9/2026) — FIGHT TRÊN HAI MÁY: câu hỏi sang iPad, máy chơi giữ đường đua + ô đáp án.**
✅ **COMMIT + PUSH `0b5e4f1` + LIVE** (7/7 mã băm SHA-256 khớp sau 220 s; `source.html` trên bản live mở ra đúng
màn "Sign in to link this screen", 0 lỗi console). Thầy đã duyệt gộp luôn sửa core `core/store.js`.
Xem **mục 20** (+ **20b** cho iPad 12.9" ngang) và checklist ⬜ **thầy bấm tay 7 bước** — đường mạng hai máy
vẫn CHƯA chạy lần nào vì Claude không đăng nhập được tài khoản thầy.

Trạng thái: ✅ Đợt 350 `f55aa2d` · ✅ Đợt 351 `cb95795` (Fight) COMMIT + PUSH · 🟢 **Đợt 353 + 354 (Fight: tỉ lệ 32:7 + 16:7, phi công vào cửa sổ, lửa bám thân, ☰/‹ › lên dải chung; ẩn điểm, số mũi tàu, lùi tàu khi Points off, Lives = tàu nát dần → nổ) ✅ COMMIT + PUSH `f5fd42e`; **Đợt 355** (câu hỏi 1 dòng trên cùng, đua 32:5.75 không minimap, bàn 16:5 nền màu tàu, chip xuống dưới, dải điểm xuống dưới bàn + đồng hồ vào dải nút, ĐƯỜNG ĐUA CO GIÃN để câu cuối tàu chạm đích) — xem mục 10 + 11 + 12.
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

## 4. SỬA CORE (Đợt 350, thầy đã duyệt, đã commit `f55aa2d`)
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
- Showdown: chưa khai (`showdownMode`) — cần chốt chỗ đặt dòng tên HS trên cảnh đua toàn khung (cùng lý do
  Maze chase / Flying fruit chưa bật). Fight ĐÃ có từ Đợt 351 (mục 9).
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

## 9. FIGHT (Đợt 351, 20/9/2026 — thầy: "50% không gian nửa trên dành cho toàn bộ race, nửa dưới chia làm 2 cho 2 đội")
Thầy chốt qua AskUserQuestion: vào bằng **nút MODE** · luật câu hỏi **giống Quiz/Fight** (cùng câu, ai đúng trước ăn) ·
sai = **mất câu, không làm lại, phạt theo Options** · ok build.

**Cách làm**: dùng ĐÚNG trọng tài `core/fight.js` (Time delay · Speed bonus · Fight content · Miss wait · In turns…),
chỉ thêm cho core MỘT kiểu bố cục: template khai `fightLayout: "shared-top"` ⇒ `fight.js` dựng thêm
`.aw-fight-shared` (rộng bằng cả trận, tỷ lệ 32:10.5 = đúng chiều cao hai bàn 16:10.5 đứng cạnh nhau) NẰM GIỮA dải
điểm và hàng 2 bàn, trao cho template qua `ctl.sharedRoot()`. Template khác không khai gì thì khung y hệt cũ.
- **Vùng chung**: `ensureFightScene(ctl)` (cấp module) dựng cảnh đua MỘT lần cho mỗi trận (so `host` với lần trước;
  `restartMatch` dựng khung mới ⇒ cảnh mới, tên lửa về vạch xuất phát). 2 tên lửa cố định: TEAM 1 🐱 xanh (bàn trái),
  TEAM 2 🦊 đỏ (bàn phải). `--aw-u` của vùng này do template tự đo bằng `ResizeObserver` (core/unit.js chỉ đặt cho
  `.aw-stage`).
- **Bàn** (`.aw-rr-stage.is-fightboard`): chỉ chip đội + câu hỏi + ô đáp án, chữ to hơn solo. Không tim, không hộp,
  không Question time (Options trong trận không dựng các ô riêng — `inFight`), không tên lửa máy.
- **Nối trọng tài y như Quiz**: `attach(side, {total, goToIndex, lock, reveal, review, toggleVoiceRemote, syncVoice})`;
  chạm ô → `wordDone(side, {index, correct})`; ✓/✗ GIẤU tới `reveal()` (tên lửa bay chỉ nói "đúng", không nói ô nào —
  như tiếng); bàn bị khoá/chờ lộ ⇒ `.aw-rr-answers.is-fightlost` xám; `.aw-fight-board.is-concealed` mờ hàng ô.
  Đúng → tên lửa đội đó +1 nấc (N nấc = N câu); sai → khựng, câu MẤT (trọng tài chuyển vòng); về đích trước → huy
  chương + banner "TEAM 1 FINISHED!" (trận vẫn chạy tới hết câu; kết quả trận do bảng của trọng tài quyết).
- Đếm 3-2-1 chạy ở CẢ hai bàn (khoá ô), nhưng banner + tiếng + drone động cơ chỉ ở bàn 0 (`ctl.speaks`).
- Pause: bridge `rrPauseHandlers` nay là **Set** (trận có 2 mount cùng lúc, bản cũ 1 biến bị bàn 1 đè).

**Sửa core (đề xuất đã áp, chờ thầy duyệt commit)**: `core/fight.js` (+`sharedLayout`, `sharedEl`, `ctl.sharedRoot()`,
~12 dòng) · `core/app.css` (`.aw-fight-shared` + luật fullscreen `.is-fs.is-shared-top` chia cao theo 32:21).

**Đã tự kiểm (bàn thử test.html, 1280×900, 0 lỗi mới)**: MODE → Fight → Start fight: khung có vùng chung 1241×407 +
2 bàn 613×403 (bằng nhau); PLAY bàn 0 kéo bàn 1; cả 2 bàn cùng câu; bàn 0 đúng → tên lửa 1 `--x` 5→13,1, điểm dải 1–0,
bàn 1 xám (`is-fightlost`); sau ROUND_HOLD cả 2 sang câu 2; bàn 1 sai → khựng, bàn 0 đúng → 2–0; chơi hết → bảng
"TEAM LEFT WINS 10—0", Show answers 2 cột 20 dòng; Start again → tên lửa về 5, điểm 0–0; Options trong trận chỉ còn
Time delay/Speed bonus/Fight content/Miss wait/Points off/Shuffle/Show answers.
⬜ Chưa kiểm: fullscreen trận (cần cử chỉ tay), TOMKO hai đội chạm cùng lúc, In turns (2 bộ câu khác nhau — code đi
đường chung của trọng tài, chưa bấm), ☰ Menu pause giữa trận.

## 10. FIGHT — TỈ LỆ & BỐ CỤC LẠI (Đợt 353, 20/9/2026 tối — thầy: "Quiz dài, Rocket race vuông-cao; chỉnh về tỉ lệ + bố cục của Rocket race")
Thảo luận trước, build sau. Thầy chốt qua AskUserQuestion: **đua 32:7 + bàn 16:7** (cả hai đều 2/3 của Đợt 351) ·
minimap **giữ, thu nhỏ** · đua **trên** 2 bàn · ☰/‹ ›/🔊 lên dải nút chung **chỉ Rocket race** · "tối đa 3 đội" =
muốn **Fight 3 bàn sau này** (ghi VIỆC ĐANG CHỜ, đợt riêng).

**Vì sao đổi**: bức 32:21 cũ trên màn 16:9 fullscreen bị KHOÁ THEO CHIỀU CAO → cả trận chỉ rộng 1432/1920 px, hai bên
thừa 244 px đen, mỗi bàn 708 px (Quiz được 945); vùng đua 470 px cao mà chỉ có 2 làn nằm ngang (tên lửa 160×70) — 2/3 là
trời trống. Bức 32:14 mới: đua 1880×411, bàn 930×411 (đo thật 941×413 ở viewport 1920×1080 với `.is-fs`), hàng nút đáy
ở 1024 < 1080 — kín bề ngang, bàn to bằng Quiz, đua cao ĐÚNG BẰNG bàn.

**Đã sửa (5 file)**:
- `core/fight.js` — đọc `tpl.fightFrame = { sharedH, boardH, boardTools }`: ghi `--aw-fsh`/`--aw-fbh` lên `.aw-fight`;
  `boardTools: "shared"` ⇒ DỜI (không chép) `.aw-bottombar-left` (☰) + `.aw-nav` (‹ n of N ›) + `.aw-tools` (🔊) của
  BÀN 0 vào `.aw-fight-boardtools` đứng đầu `.aw-below-center` (trước Options/Mode) — cùng khuôn "ONE TOOLBAR: move
  the node" sẵn có; mọi handler/gate của engine (`paintNavGate`, `syncNavGates`, relay pause) vẫn chạy trên đúng node.
  Thêm lớp `is-boardtools-shared`.
- `core/engine.js` — `ui.hostFightWaitBar(host)`: template NHẬN NUÔI node thanh Time delay (`.aw-waitbar`) vào ổ của
  mình; `placeWaitBar()` bỏ qua phép đo hình học hàng nút khi đã nhận nuôi. LÝ DO: `.aw-rr-stage` là `absolute inset:0`
  phủ kín cả khung (kể cả hàng nút dưới) ⇒ **từ Đợt 351 trận Rocket race KHÔNG có thanh Time delay nào nhìn thấy** —
  lỗi ngầm phát hiện trong khi soi "cụm next-back". Đây cũng là điều kiện để dời ☰/‹ › đi được an toàn (placeWaitBar đo
  chính các node đó).
- `core/app.css` — `.aw-fight-shared { aspect-ratio: 32 / var(--aw-fsh, 10.5) }`; `.aw-fight.is-shared-top .aw-fight-board
  .aw-stage { --ti-le: calc(var(--aw-fbh,10.5) / 16 * 100%) }` (KHÔNG đụng con số ⛔ 65.625% gốc); nắp fullscreen
  `max-width: … * 32 / (var(--aw-fsh,10.5) + var(--aw-fbh,10.5))`; `.aw-fight-boardtools` (tự đặt `--aw-u: 9px` vì nút
  engine đo bằng u mà ngoài `.aw-stage` không có u; 4u = 36px = bằng `.aw-toolbtn`); `.is-boardtools-shared … .aw-bottombar
  { visibility: hidden }`; `.aw-waitbar.is-hosted` (relative, rộng 100%). Template không khai `fightFrame` ⇒ mọi số về
  10.5 = y hệt Đợt 351; Quiz Fight đo lại: tỉ lệ bàn 1.519, thanh đáy visible, không có `.aw-fight-boardtools` ✓.
- `templates/rocket-race/rocket-race.js` — khai `fightFrame: { sharedH: 7, boardH: 7, boardTools: "shared" }`;
  `buildRocketEl` bọc lửa + thân + phi công vào **`.aw-rr-craft`**; mount Fight thêm `.aw-rr-waitslot` cuối panel +
  `ui.hostFightWaitBar(slot)` (kiểm `typeof` — core cũ thì thanh nằm chỗ cũ); `--per-row` = 4 khi Fight và 4 đáp án
  (2–3 → n, 5–6 → 3), Solo/Teams giữ 2×2.
- `templates/rocket-race/rocket-race.css` — bob/shake/lunge dời từ `.aw-rr-body` sang `.aw-rr-craft`, xoá bob riêng của
  `.aw-rr-pilot`; khối `.aw-rr-shared` cắt lại cho 21.875u (minimap 1u/1.5u, track 3.4u/17u = 2 làn 8.5u, mặt trời 12u,
  hành tinh to ẩn, banner 5/6.5/4.5u); bàn `.is-fightboard` cho 43.75u (chip 4.4u, câu 9–14u, chữ 3.8u, ô 3.2u, ổ chờ 1.2u).

**Hai lỗi thầy nhìn thấy, đo được gốc**:
1. *Phi công lọt ngoài cửa sổ*: tâm emoji lệch tâm cửa sổ đúng (+½ rộng, +½ cao) = 13/10 px trên tên lửa 128 px.
   Gốc: keyframe `aw-rr-bob` ghi `transform: translateY(…)` lên `.aw-rr-pilot` ⇒ ĐÈ MẤT `translate(-50%,-50%)` canh giữa.
   Không phải sai toạ độ (51%/50% đúng tâm `<circle cx=82 cy=35>` của viewBox 160×70).
2. *Lửa đứng yên*: bob/shake/lunge chỉ gắn `.aw-rr-body`, `.aw-rr-flame` là phần tử ANH EM nên thân bay lửa đứng.
   Một khung bọc `.aw-rr-craft` chữa cả hai; ăn cho cả Solo/Teams (đo solo: 5 tên lửa dx −0.2 / dy 0.0 px).

**Đã tự kiểm (bàn thử test.html, 0 lỗi console)**: MODE → Fight → Start → PLAY: vùng chung 701×153 (32:7 ✓), bàn 346×153
(16:7 ✓, cao bằng vùng chung), `--aw-fsh/--aw-fbh` = 7/7, dải nút = [☰][‹ 1 of 10 ›][🔊] | [Options][Mode]; tâm phi
công (93.5, 115.1) vs cửa sổ (93.7, 115.1); bàn 0 đúng → 1–0, tên lửa `--x` 5→13.1, `is-boost`, craft có `aw-rr-bob`,
lửa `aw-rr-flick` nằm TRONG craft; Options → Time delay 2.8s → Apply (dựng lại trận) → PLAY → đúng: thanh `.aw-waitbar
.is-hosted.is-on` rộng 330 px = trọn panel ở đáy CẢ HAI bàn, fill cạn dần (trước đợt này: bị che, không thấy); 3 đáp án
→ 1 hàng 3, 4 đáp án → 1 hàng 4. Giả lập fullscreen 1920×1080 (thêm `.is-fs` tay): đua 1900×416, bàn 941×413 ×2, đáy
1024. Quiz Fight hồi quy không đổi. Solo Rocket race: 2×2 giữ nguyên, phi công đúng tâm.
⬜ Chưa kiểm: fullscreen thật (cần cử chỉ), TOMKO, ☰ Menu từ dải chung (popup vẫn hiện ở góc dưới-trái BÀN 0 vì engine
append vào `inner` của bàn — chấp nhận được, thầy xem có muốn dời không), ‹ › từ dải chung khi giữa vòng.

## 11. FIGHT — KHÔNG ĐIỂM, SỐ MŨI TÀU, LÙI TÀU, MẠNG = TÀU NÁT → NỔ (Đợt 354, 20/9/2026 tối, ngay sau Đợt 353)
Thầy: (1) "bỏ phần điểm bên trên, không tính điểm nữa vì đã tính vị trí của tàu rồi. Nếu sai mà bị trừ point thì lùi lại
tàu"; (2) "bỏ chữ Team 1/2 ở mũi tàu, chỉ cần số 1 hoặc 2 vào trong mũi tàu"; (3) "thêm Lives vào Options, sau mỗi life
trừ thì tàu nát đi một tí, hết thì nổ tung".

**Cách làm**
- (1) `fightFrame.noScore: true` → core thêm lớp `is-noscore`, CSS `visibility:hidden` 2 số điểm (giữ hình học dải: đồng
  hồ, pick/miss bar, đích bay "+N" đều nguyên chỗ). Trọng tài VẪN tính điểm ngầm — quyết thắng/thua và bảng cuối trận
  (bảng cuối vẫn in số, chưa đụng). Points off trong trận: không bay "−N" về ô điểm (đã ẩn) nữa mà áp phạt ngay
  (`penalty += N; ui.setScore`), tàu **lùi N nấc** (`retreatRocket`, chặn ở vạch xuất phát) + bong bóng `.aw-rr-neg` "−N"
  bay lên từ tàu. Lưu ý: điểm trọng tài có thể âm, đường đua thì không — trọng tài mới là người xử thắng/thua.
- (2) `.aw-rr-shared .aw-rr-tag { display:none }`; `ensureFightScene` gắn `.aw-rr-num` (i+1) vào `.aw-rr-craft`, đặt ở
  87.5 % bề ngang (giữa mũi `<path class="aw-rr-nose">` 128→158/160), chữ trắng 900 có bóng.
- (3) `buildExtraOptions(inFight)` nay trả về Ô **Lives** (chỉ ô đó); `livesLeft = normLives(opt.lives)` cả trong trận;
  chip đội có `♥` theo số mạng (`.aw-rr-turnlives`; hearts của top bar bị ẩn trong trận). Sai → `fightLoseLife()`:
  `paintDamage()` chọn 1 trong 3 mức theo tỉ lệ mạng đã mất (`ceil(3·lost/L)`: 1 mạng = nổ luôn, 3 mạng = mỗi mạng một
  mức, 10 mạng = 3–4 mạng một mức) → lớp `is-dmg-1/2/3`: 3 vết nứt `<path class="aw-rr-crack">` thêm vào ROCKET_SVG (ẩn
  mặc định, hiện dần), thân xỉn/tối dần (filter), cánh mờ, cửa sổ nứt (`stroke-dasharray`), lửa yếu, cột khói
  `.aw-rr-dmgsmoke` rỉ ra liên tục (to/đen dần). Hết mạng → `explodeRocket()`: `is-exploding` (craft phình sáng rồi xoay
  tắt .9 s) + 💥 `.aw-rr-boom` + 6 cụm khói + banner "TEAM n IS DOWN!" + `rrSound.lose()`, sau đó `is-wreck` (xác xám
  nghiêng, bốc khói mãi); bàn khoá (`exploded`, `choose()` từ chối), ô xám; rồi gọi **`fightCtl.forfeit(side)`**.
- **Core `fight.js` thêm `ctl.forfeit(side)`** (Đợt 354): `forfeited[side]=true`, kết trận sau ROUND_HOLD_MS; `showResult`
  cho ĐỘI KIA thắng bất kể điểm (đội nổ tung không thể thắng nhờ điểm). ⚠️ Lỗi tự tạo bắt được ở bàn thử: bản đầu dùng
  `later(endMatch)` — đó là Ô HẸN GIỜ VÒNG duy nhất, và `wordDone(correct:false)` (template gọi ngay sau trong cùng cú bấm)
  gắn lại nó cho Miss wait của đội kia ⇒ bảng kết quả không bao giờ hiện. Sửa: `setTimeout` riêng, `endMatch` tự chặn
  `matchOver/torndown`.

**Đã tự kiểm (bàn thử, 0 lỗi console)**: dải trên chỉ còn đồng hồ (2 số `visibility:hidden`, lớp `is-noscore`); mũi tàu
"1"/"2", thẻ TEAM ẩn; Options trận có ô Lives (∞ mặc định). Lives 2 + Points off 1: đúng → x 5→13.1; sai → x về 5.00,
"−1" bay, chip ♥♥→♥, `is-dmg-2` (2 vết nứt opacity .9, filter saturate(.6) brightness(.8), khói `aw-rr-leak`); đội kia
đúng → vòng mới; sai lần 2 → 💥 + "TEAM 1 IS DOWN!" → `is-wreck`. Lives 1 + Points off 2: sai 1 phát → nổ → 2,1 s sau bảng
**"TEAM RIGHT WINS" −2 — 0** (đội phải `is-top`). Solo không đổi (vết nứt ẩn, không số mũi).
⬜ Chưa kiểm: TOMKO; nhiều mạng (5–10) xem 3 mức lên đúng nhịp; Speed bonus bật thì "+N" bay về ô điểm ẩn (vô hại) nhưng
điểm trọng tài ≠ vị trí tàu — thầy cân nhắc tắt Speed bonus khi chơi Rocket race; bảng cuối trận vẫn in số điểm.

## 12. FIGHT — CÂU HỎI 1 DÒNG, ĐUA NGẮN, BÀN 16:5 MÀU TÀU, ĐƯỜNG ĐUA CO GIÃN (Đợt 355, 20/9/2026 tối, 9 ý thầy)
1. Bỏ minimap (`.aw-rr-shared .aw-rr-minimap { display:none }`; `r.dot` vẫn được ghi, vô hại).
2. Số mũi tàu nhỏ hơn: tên lửa 11u, số `11u × .12` (Đợt 354 là 13u × .19).
3. Vùng đua ngắn hơn: shared **32:5.75** (17.97u) = thanh câu hỏi 4u + track 12u (2 làn 6u, tàu 4.8u cao) — Đợt 353 là 32:7.
4. **Câu cuối tàu phải chạm đích** — `fightTrackLength(scene, remaining) = max(1, leader.p + remaining)`; `remaining` = số
   vòng CHƯA xử sau nước đi này (`N − fightIndex − (resolved ? 1 : 0)`); `fightRepaint()` gán `r.L` cho CẢ HAI tàu và vẽ lại
   (cảnh dùng chung nên gọi từ bàn nào cũng được), gọi ở `goToIndex` (vòng mới), `onCorrect`, `onWrong` (kể cả lùi). Khi
   `remaining === 0` mọi tàu có `p ≥ L` → `crossedLine` (hoà thì cả hai cùng chạm). Hệ quả đẹp: vòng nào không ai đúng thì
   vạch đích tự tiến lại gần cả hai tàu. Đo: 10 câu, mỗi bàn thắng 5 vòng xen kẽ → x: 13.1/5 → 14/14 → 23/14 → … →
   72.5/59 → **86/86** đúng câu 10, cả hai `is-done`, bảng "IT'S A DRAW 5—5". Solo/Teams giữ `L = N` cũ.
5. Chữ TEAM X xuống hàng dưới các ô: panel Fight = `[answersEl, turnChip]` (+ ổ Time delay); chip 3.4u.
6+8. Bỏ hẳn câu hỏi khỏi 2 bàn; **một dòng câu hỏi trên cùng** của vùng chung: `ensureFightScene` dựng `.aw-rr-qbar` (4u,
   2 nửa `.aw-rr-qhalf`); mỗi bàn `replaceChildren(qBox)` vào nửa của mình (mọi logic voice/`fitText` giữ nguyên vì vẫn là
   chính `qBox`); `syncQbar()` sau mỗi `showQuestion`: hai nửa cùng chữ → `is-same` (nửa phải ẩn, nửa trái trải hết) — Fight
   content = Different thì hiện 2 nửa. `white-space: nowrap` + `fitText` co chữ để đúng 1 dòng.
7. Bỏ dải đồng hồ trên đầu: core `fightFrame.topStrip: "below"` → `fight.js` xếp `[shared, boards, top, controls]`, lớp
   `is-topbelow` (app.css: `.aw-fight-score` cao 0 để dải chỉ còn băng ~10px giữ thanh Pick time / Miss wait dưới mỗi bàn;
   `.aw-fight { padding-top: 6px }`); `clockBox` (đồng hồ trận) được DỜI vào `.aw-fight-boardtools` sau nút 🔊 (18px). Dải nút
   nay: [☰][‹ n of N ›][🔊][00:00] | [Options][Mode]. Template khác không khai → thứ tự cũ (Quiz Fight đo lại: `top, boards,
   controls`, đồng hồ ở giữa dải, điểm visible).
9. Nền bàn = màu tàu: `.aw-rr-stage.is-fightboard { background: linear-gradient(color-mix(var(--rc) 72% #000) → 45%) }`,
   đường lùi `var(--rd)` cho trình duyệt không có `color-mix`; `--rc/--rd` đã được `buildFight` đặt lên stage từ Đợt 351.
   Bàn **16:5** (`boardH: 5`) — bàn chỉ còn ô + chip nên 16:7 làm ô thành cột dọc.
Bức cả trận nay 32:10.75 (≈ Quiz 32:10.5). ⬜ Chưa kiểm: TOMKO, Fight content = Different (2 nửa câu hỏi), câu hỏi rất dài.

## 13. FIGHT — MÀN START: thông tin act lên vùng chơi, bàn chỉ còn icon + tên đội + ▶ (Đợt 356, 20/9/2026 tối)
Thầy gửi ảnh: bìa READY (engine dựng cho khung 16:10.5) bị cắt chữ "ROCKET RACE" trong bàn 16:5, vùng chung trống.
Chốt: "để thông tin (slogan, tên act, template…) ở vùng chơi, ở 2 ô đội chỉ để 1 nút Start ở chính giữa và tên team + icon".
- Core `fight.js`: `fightFrame.readyShared: true` + `fightFrame.teams: [{name, icon, color}]` — sau `startGame` hai bàn, chép
  chữ `.aw-ready-type/.aw-ready-title/.aw-ready-game` của bàn 0 vào `.aw-fight-readyinfo` đặt trong vùng chung (template
  `host.innerHTML = ""` lúc mount ở PLAY nên tự biến mất); mỗi bàn được `prepend` dòng `.aw-fight-readyteam` (icon tròn màu
  đội + tên) vào `.aw-ready-center`; lớp `is-readyshared` (app.css ẩn 3 dòng chữ trong bàn). Template khai `teams` từ
  `FIGHT_TEAMS` (🐱 TEAM 1 xanh · 🦊 TEAM 2 đỏ).
- Lỗi tự tạo bắt ngay: `info.append(...)` trả `undefined` ⇒ `.textContent` ném TypeError, bị `engine.js` nuốt thành
  `[warn] fight mode failed to load` (không phải console.error!) — MODE → Fight bấm không vào trận, không lỗi đỏ. Sửa: tạo
  node trước rồi append. Bài học: kiểm `read_console_messages` cả mức warn khi "bấm không ăn".
- Đo bàn thử: READY = vùng chung "ANDREW CLASSES / SPACE RACE / ROCKET RACE", bàn = "🐱 TEAM 1" + ▶; PLAY → readyinfo mất,
  2 tên lửa + qbar hiện, 0 lỗi.

## 14. Căn lại chip đội + vạch đích (Đợt 357, 20/9/2026 tối — chỉ rocket-race.css)
Thầy gửi 2 ảnh: "TEAM X - tim hơi lệch lên", "thanh về đích lệch thấp". Gốc: (a) ổ Time delay 1,2u nằm trong luồng dưới chip
đẩy chip lên khỏi giữa dải dưới ô; (b) track 5,2u→17,2u ±1u vạch đích = 4,2u→18,2u, tràn đáy (17,97u) mà hở trên (qbar 4u).
Sửa: ổ Time delay `position:absolute` ghim đáy (bottom −.8u, cao .6u, thanh 100 %), panel bottom 1,1u gap .9u ⇒ chip đúng giữa
(đo: chipMid 97,9 vs bandMid 98,3 px); track 5,5u→16,5u, vạch đích ±.5u = 5u→17u ⇒ tâm 77,1 vs tâm dải 77,0 px; tim
`line-height:1; top:.08em` ⇒ tâm tim/chữ/huy hiệu 241,4/240,9/240,9 px.

## 15. Phi công nằm hẳn trong cửa sổ + lắc lư; bỏ đường kẻ làn (Đợt 358, 20/9/2026 tối)
- `.aw-rr-pilot` nay là HÌNH TRÒN CẮT (`width:17.5%` bề ngang tàu, `aspect-ratio:1`, `border-radius:50%`, `overflow:hidden`) đặt
  đúng tâm cửa sổ (51,25 % / 50 % — `<circle cx=82 cy=35 r=16>` của viewBox 160×70); emoji nằm trong `<span class="aw-rr-face">`
  và tự lắc (`aw-rr-jiggle` 1,3 s: dịch ±7 %, xoay ±8°, lệch pha theo `--wob`) trong khi cả craft nhấp nhô ⇒ "tàu có độ xóc".
  Cỡ chữ hạ .155 → .13 (solo) / .125 (fight, phone). Đo: vòng phi công 15,7 px nằm trọn trong cửa sổ 18 px, `inside: true`.
- Bỏ `.aw-rr-lane::after` (đường kẻ mờ từ tàu tới đích) ở mọi chế độ.

## 16. Phi công chỉ nhấp lên xuống; khói trắng mờ sau lửa (Đợt 359, 20/9/2026 tối)
- `aw-rr-jiggle` nay chỉ `translateY(±9 %)`, không xoay/không dịch ngang.
- `.aw-rr-exhaust` (trong craft, `right:116 %`, 16 % bề ngang tàu, z-index dưới lửa) chứa 3 `.aw-rr-exhaust-puff` trắng mờ
  (radial-gradient .55 → 0, blur .6px) chạy `aw-rr-exhaust` 1,35 s lệch pha −.45 s/−.9 s: sinh ở đầu lửa, trôi ra sau
  (−170 %), phình ×2,4, tan dần; nhanh hơn (.9 s) khi boost/turbo; tắt khi stall/nổ/xác. Chỉ chạy khi `is-flying`.
- Đo solo: 3 puff `aw-rr-exhaust`, opacity đang chạy .20/.09/.42, face transform chỉ Y. Ở vạch xuất phát khói bị mép trái
  khung cắt một phần (tàu ở x=5 %) — chấp nhận được.

## 17. "Trong fight chưa thấy" khói + nhấp (Đợt 360, 20/9/2026 tối)
Live đã khớp code (5/5 file so hash bỏ CRLF) ⇒ không phải cache. Đo trong Fight: tàu chỉ rộng 77 px (11u của 701 px) nên
puff 16 % = 12 px mờ .55, phi công nhấp ±9 % của ô 12 px ≈ ±1 px — có chạy nhưng mắt không thấy; và ở vạch xuất phát
(x = 5 %) đuôi lửa đã chạm mép trái khung (`overflow:hidden`) nên khói sinh ra ngoài màn. Sửa (chỉ CSS): puff 26 %, đậm .7,
blur 1px, trôi −150 %, scale 2,2; phi công nhấp ±20 %; **`.aw-rr-shared .aw-rr-lanes { left: 7% }`** — làn đua lùi vào 7 %
để sau lửa có chỗ (tàu về đích ở 87 % track, cờ 93 %). Đo: tàu ở 82 px, lửa 65 px, khói 55–76 px — hiện trọn. Bài học: hiệu
ứng viết bằng % của tàu phải đo trên khung NHỎ NHẤT (Fight), không chỉ Solo.

## 18. Phi công nhấp theo vật lý của chính tàu mình (Đợt 361, 20/9/2026 tối)
Thầy: "thật ít, thật nhẹ và phù hợp vật lý với di chuyển riêng của từng tàu". Bỏ đồng hồ riêng 1,3 s ±20 %: `aw-rr-jiggle` nay
**cùng chu kỳ 2,6 s và cùng gốc pha `--wob` với `aw-rr-bob` của thân**, trễ +.35 s (quán tính), biên độ ±6 %; boost → mặt bị ép
lùi −14 % đúng .6 s của `aw-rr-lunge` (`aw-rr-facepush`); stall/hit → mặt rung `aw-rr-facerattle` đúng 3/4 nhịp .3 s của
`aw-rr-shake`. Đo 5 tàu solo: thân `aw-rr-bob 2.6s delay −6.23s` ↔ mặt `aw-rr-jiggle 2.6s delay −5.88s` (mỗi tàu một pha riêng).

## 20. FIGHT TRÊN HAI MÁY — câu hỏi sang iPad (Đợt 368, 22/9/2026)

Thầy: *"Ngoài màn hình chính hiển thị trò chơi… bây giờ tôi muốn kết nối với 1 ipad. Máy tomko sẽ không hiển thị
câu hỏi nữa mà chỉ hiển thị race và khung chọn kết quả của 2 đội. Ipad sẽ là nơi hiển thị câu hỏi… chia đôi màn
hình, mỗi bên hiển thị câu hỏi cho 1 đội."* Thầy chốt qua AskUserQuestion: **iPad đăng nhập Google của thầy**
(⇒ KHÔNG phải đăng luật Firestore mới) · iPad hiện **chữ câu hỏi là chính + tên/màu đội + số câu + đồng hồ** ·
**tiếng đọc vẫn phát ở máy chơi** (giữ nguyên luật `ctl.speaks`, không có ca vang đôi) · **chỉ Rocket race trước**.

### Vì sao rẻ hơn tưởng
Từ Đợt 355 câu hỏi ĐÃ tách khỏi ô đáp án: nó nằm ở thanh chung `.aw-rr-qbar` (2 nửa, tự gộp khi cùng chữ), ô đáp
án nằm trong bàn. Nên "máy chơi bỏ câu hỏi" = ẩn một thanh, và "iPad hiện câu hỏi" = vẽ lại đúng 2 nửa ấy.
Không đụng `core/fight.js` một dòng nào.

### Một chiều, hai tài liệu, mỗi tài liệu một người ghi
iPad **không chơi, không tính điểm, không quyết vòng** — nó là MÀN HÌNH, không phải người chơi thứ ba. Nên không
có trạng thái chung phải tranh chấp, và luật *"nhiều bên cùng ghi một tài liệu ⇒ GIAO DỊCH"* được **né** chứ không
phải trả giá: hai tài liệu, mỗi cái đúng MỘT người ghi (đúng nếp `sd_session`: "một người viết, KHÔNG transaction").
- `rr_link` — máy chơi GHI, iPad NGHE: `{matchId, actTitle, phase, round, total, same, clockMs, q0/q1, vo0/vo1, t0name/t0color, t1name/t1color, at}` (trường PHẲNG — `update()` của Firestore không gộp sâu).
- `rr_view` — iPad GHI nhịp tim, máy chơi NGHE.
Cả hai nằm trong `users/{uid}/items` (đường DUY NHẤT luật hiện hành mở cho dữ liệu của thầy). Giá: **1 lượt ghi mỗi
câu** (20 câu ≈ 22 ghi + 22 đọc) + nhịp tim iPad 20 s.

### ⭐ Cái giữ cho lớp không đứng hình
Ẩn câu hỏi ở máy chơi **chỉ an toàn khi iPad đang thật sự hiện nó**. iPad ngủ / rớt wifi / hết pin ⇒ câu hỏi không
còn trên MÀN NÀO, giữa giờ dạy. Nên: iPad đập nhịp mỗi `VIEWER_BEAT_MS` (20 s), máy chơi **tự hiện lại thanh câu
hỏi** khi nhịp quá `VIEWER_STALE_MS` (55 s ≈ 2 nhịp + biên). Mặc định lúc mount là **hiện** (`paintLink(false)`) —
không bao giờ ẩn vì hy vọng. Đây đúng rủi ro `KE HOACH` mục 4 đã ghi cho chặng 3 ("wifi lớp rớt 5 giây…").

### Bàn 0 làm chủ đường ghi
Một trận là HAI mount trong MỘT trang, cả hai đều gọi `showQuestion()` cho cùng vòng. Hai người ghi một tài liệu
chính là ca cần transaction. Nên bàn 1 chỉ thả chữ của nó vào ô cấp module (`rrLinkText[side]`), **bàn 0 ghi**, sau
một cửa sổ gom 80 ms (`advanceRound` lặp hai bàn đồng bộ nên hai lượt cách nhau đúng một tick). Bàn 0 mở link,
bàn 0 đóng (`rrLinkStop` trong cleanup, có `clearStage()` để iPad ngày mai không đọc phải trận hôm nay).

### Đồng hồ: chở MỐC, không chở từng giây
Gói mang `clockMs` = trận đã chạy bao lâu; iPad chỉnh theo rồi **tự đếm tiếp**. 0 lượt ghi thêm, và không phụ thuộc
giờ hệ thống hai máy khớp nhau (chỉ phụ thuộc thời lượng trôi — cả hai đo như nhau).
⛔ **KHÔNG đưa thanh Time delay / Miss wait lên iPad**: chúng chạy 0,1–3 s mà mạng trễ 0,2–0,5 s ⇒ thanh trên iPad
luôn sai. Đó là một phép đo tự nói dối, thà không vẽ.

### File
MỚI `rr-link.js` (tầng dây, 2 doc + `mintMatchId`) · MỚI `source.html` + `source.js` ở gốc `web/` (trang màn nguồn,
độc lập, KHÔNG nạp engine/template) · `rocket-race.js` (+ô tích Options trong trận, `paintLink`, `reportLink`,
`goAt`, dọn trong cleanup) · `rocket-race.css` (`.aw-rr-qbar.is-remote` ẩn, `.aw-rr-shared.is-noq` cho đường đua
2u→16u) · `core/store.js` **(SỬA CORE — xem ĐỀ XUẤT cuối file)** · `core/tpl-files.js` sinh lại bằng
`python tools/sinh-preload.py --write`.

### Ba lỗi tự bắt được ở bàn thử (không đoán, đo bằng số)
1. **Chữ iPad co còn 41 %** (72 px → 29 px trong hộp cao 617 px). Gốc: khối chữ là flex item không có bề rộng của
   riêng nó ⇒ KHÔNG xuống dòng ⇒ `fitOnce` thấy `scrollWidth` khổng lồ, tưởng tràn. Chữa: `width: 100%`.
2. **Rồi chạm SÀN 25 %** (18 px). Gốc: `fitOnce` so `scrollWidth` của chữ với `clientWidth` của HỘP — mà
   `clientWidth` **gồm cả padding** — trừ 1–2 px slack. Chữ rộng đúng bằng hộp thì LUÔN bị đọc là tràn. Chữa:
   hộp có padding ngang (`.aw-rr-q` của chính template vẫn làm vậy — **padding ở đây là chịu lực, không phải trang trí**).
3. **Tràn 4 px với tiếng Việt** (dấu dưới bị cắt): `slack` 2 → 10. Đo lại: câu Việt dài `clipped:false`, fit .92/66 px.

### Đã tự kiểm bằng máy (bàn thử + trang thật localhost, 0 lỗi/0 warn console)
- iPad **ngang 1024×768**: câu thường fit 1 = **72 px**; câu rất dài tự co **47 px** (cao 548/617); câu Việt có dấu
  **66 px**, không cắt. **Dọc 768×1024**: 64/72 px, không cuộn ngang.
- **Hai đội cùng câu** ⇒ nửa phải + nhãn đội ẩn, chữ **92 px** trải hết màn (đúng nết `is-same` của thanh trong game).
- Chưa đăng nhập ⇒ màn "Sign in to link this screen" (đúng trạng thái, không trắng trang).
- Máy chơi: ô **Question screen** hiện trong Options CỦA TRẬN (cạnh Lives), không hiện ngoài trận.
- Giả lập iPad đã nối (gắn tay `is-remote`+`is-noq`): thanh câu hỏi `display:none`, đường đua **138,2 → 175,8 px**
  (+27 %), top 2u cao 14u, **tâm đường đua 113,0 vs tâm dải 112,8 px** (lệch 0,2 px).
- ⭐ **Phép thử an toàn**: BẬT ô tích mà KHÔNG có iPad và KHÔNG đăng nhập Firebase ⇒ trận chạy y như thường
  (2 tên lửa, 6 ô, câu hỏi VẪN HIỆN), `is-remote`/`is-noq` đều false, console sạch — `publishStage` bị từ chối và
  `.catch()` nuốt đúng chỗ. Lớp không bao giờ mất câu hỏi vì bật nhầm một ô tích.

### ⬜ Chưa kiểm — THẦY PHẢI BẤM TAY (Claude không đăng nhập được tài khoản thầy)
Toàn bộ **đường mạng thật** chưa chạy lần nào. Các bước thầy làm:
1. Máy chơi: mở act Rocket race → MODE → Fight → Options → tích **Question screen** → Apply.
2. iPad: mở `…/source.html` → **Sign in** bằng đúng Gmail của thầy → thấy "Waiting for the game".
3. Máy chơi bấm PLAY: trong ~20 s thanh câu hỏi ở máy chơi phải **biến mất** và câu phải hiện trên iPad.
4. Chuyển câu vài lượt: iPad đổi theo, số "n / N" và đồng hồ chạy đúng.
5. Fight content = **Different**: iPad phải hiện **2 nửa khác nhau**; = Same ⇒ gộp 1 dòng to.
6. **Tắt wifi iPad** ~1 phút: iPad hiện `⚠ OFFLINE`, và máy chơi **tự hiện lại** thanh câu hỏi. Bật lại ⇒ tự về.
7. Hết trận / Start again: iPad quay lại "Waiting for the game" (không giữ câu cũ).
⬜ Chưa kiểm thêm: TOMKO thật, Safari iPad (popup đăng nhập có thể bị chặn ⇒ phải bấm nút, đã làm đúng cử chỉ tay),
câu chỉ có tiếng (iPad hiện 🔊 — thầy chọn phát tiếng ở máy chơi nên đây chỉ là dấu hiệu), In turns.

### 20b. Chỉnh riêng cho iPad Pro 12.9" M1 NẰM NGANG (thầy: *"ở ipad tôi luôn sử dụng chiều ngang trên ipad M1 12.9 inch"*)
Khổ thật: **1366×1024 điểm CSS**, tỉ lệ 4:3 (DPR 2). Bố cục vốn đã đúng tỉ lệ (bàn thử 1024×768 cũng 4:3,
mọi cỡ viết theo `--u` = 1 % bề rộng nên chỉ phóng to 33 %), nhưng khổ lớn làm lộ 3 việc:
1. ⭐ **Chữ nay NỞ được, không chỉ co.** `fitOnce` mặc định `max:1` ⇒ câu ngắn ("Mars") giữ nguyên 96 px
   và chỉ lấp **15 %** hộp cao 824 px — bé tí trên màn to nhất phòng. Nâng `max: 2.2`. Đo: câu ngắn
   **96 → 210 px**, câu chung một dòng **172 → 211 px**; câu dài (63 px) và câu Việt (86 px) **không đổi
   một px** vì chúng vốn đã bị chặn bởi CHIỀU CAO ⇒ nâng trần là an toàn tuyệt đối.
2. ⛔ **Dấu tiếng Việt lại bị cắt ở khổ lớn** (`clipped:true`, fs 88 px) dù `slack:10` đã sạch ở khổ 1024
   (fs 66 px). Gốc: phần dấu vượt khỏi line box **tỉ lệ theo cỡ chữ**, nên một con số px CỐ ĐỊNH không
   thể đúng cho mọi màn. Chữa: `slack = 2 × u` (27 px ở 1366, 20 px ở 1024). Đo lại: `clipped:false`, fill 95 %.
3. ⛔ **`contentBox:true` là cái bẫy trông có vẻ gọn**: nó trừ padding khỏi bề rộng đem so, mà khối chữ lại
   `width:100%` của đúng content box ấy ⇒ triệt tiêu nhau, **cả 5 câu thử tụt về sàn 24 px**. Đã bỏ.
- ⭐ **Giữ màn hình không tự tắt** (`navigator.wakeLock`, iPadOS ≥ 16.4): màn này là ĐỒ ĐẠC, cả trận không
  ai chạm ⇒ iPad tự khoá sau ~2 phút và tắt giữa câu hỏi. Lock bị nhả khi trang ẩn ⇒ lấy lại ở `visibilitychange`.
- ⭐ **`touch-action: manipulation`**: iOS Safari **bỏ qua `user-scalable=no` từ iOS 10**, nên chỉ có luật này
  mới thật sự chặn cú chạm hai lần làm phóng to màn giữa giờ dạy.
- 💡 Khuyên thầy **"Add to Home Screen"** trên iPad: trang đã khai `apple-mobile-web-app-capable` nên mở từ
  màn hình chính sẽ chạy TOÀN MÀN HÌNH, không còn thanh địa chỉ Safari ăn mất ~60 px.
- **Chia TRÁI/PHẢI (không phải trên/dưới) là cố ý**: tính ra chia trên/dưới cho chữ to hơn chút (152 vs 140 px)
  nhưng trái/phải **ánh xạ đúng vị trí hai đội trên máy chơi** (đội 1 trái, đội 2 phải) — em nhìn đúng nửa của mình.
- ⚠️ **BẪY THƯỚC ĐO đã suýt cắn**: ảnh chụp bàn thử cho thấy trang chỉ chiếm góc trên-trái, trông như lỗi bố
  cục — nhưng `elementFromPoint(1360,1018)` trả về `.rrs-half` và `.rrs` đo được đúng 1366×1024. **Ảnh mới là
  thứ nói dối** (pane thu nhỏ khung 1366 vào 800), số đo DOM đúng. Suýt đi sửa một lỗi không tồn tại.
- Đo cuối ở 1366×1024, hai nửa: chia đều **683/684**, trái 129 px + phải 210 px, `clipped:false` cả hai,
  không cuộn ngang/dọc, console sạch.

### 20c. Ô tích bị thầy nhìn không ra → thành DẢI RIÊNG (Đợt 368c, 22/9/2026)
Thầy gửi ảnh bảng Options của trận kèm: *"Tôi có thấy nút bấm gì khác cũ đâu"* — trong khi ô **Question
screen** nằm ngay trên chính ảnh đó, góc dưới phải, chưa tích.
**Gốc**: nó được dựng bằng `addCheck`, nên rơi vào hàng ô tích cùng **Shuffle questions · Shuffle answers ·
Show answers at end** — cả hàng đó đều là chuyện XÁO TRỘN/HIỂN THỊ CUỐI VÁN, nên mắt xếp nó vào nhóm ấy rồi
lướt qua. Cộng thêm cái tên "Question screen" tự nó không nói được dùng để làm gì.
**Sửa**: `mkCell({ label: "Question screen", sub: "show questions on an iPad", wide: true })` + `mkSeg`
hai nấc **Off | On iPad** ⇒ một DẢI TRỌN CHIỀU NGANG nằm ngay dưới LIVES, trên TIME DELAY, có nhãn phụ nói
rõ công dụng. Hàng ô tích trở lại đúng 3 ô cũ.
**Bài học**: một tính năng mới đặt lẫn vào một nhóm CÓ SẴN thì thừa hưởng luôn ý nghĩa của nhóm đó — người
dùng không đọc từng ô, họ đọc CỤM. Ô tích mới giữa ba ô tích cũ là một ô tích vô hình.
Đo: `.aw-optc-wide` ✓, nhãn "Question screenshow questions on an iPad" ✓, bấm **On iPad** → `is-on` ✓,
Apply → dựng lại trận → PLAY: 2 tên lửa, 8 ô, câu hỏi VẪN HIỆN (chưa có iPad), console sạch.

### 20d. Số câu mỗi đội một số, nằm DƯỚI khung của đội đó (Đợt 368d, 22/9/2026)
Thầy: *"Khi fight content … là Different, thì 2 ô hiển thị câu hỏi trên ipad sẽ độc lập… Hiển thị số câu
của 2 bên cũng độc lập trong trường hợp này, mỗi cái hiện ở 1 bên khung (để ở dưới)."*

**⚠️ Phần "độc lập" của LUẬT CHƠI: thầy chốt KHÔNG sửa** — *"Tùy vào time delay như các act khác"*.
Đã tra trọng tài trước khi hỏi, và đây là điều cần biết cho phiên sau:
- `lockLoser()` (`core/fight.js:637`) **chỉ true ở đúng nấc Time delay = 0,1s**. Ở nấc đó đội chậm bị
  KHOÁ ngay khi đội kia trả lời đúng ⇒ mất câu. Từ **0,2s trở lên và ở ∞** thì đội chậm **KHÔNG bị khoá,
  giữ nguyên câu và chơi tiếp tới khi tự xong** — tức là nửa yêu cầu của thầy VỐN ĐÃ CÓ, chỉ là thanh
  Time delay trong ảnh thầy gửi đang để 0,1s.
- Nửa còn lại ("đội 1 sang câu mới NGAY, không chờ") thì **chưa có và không làm**: trọng tài quản một
  `roundIndex` CHUNG, `advanceRound()` chuyển CẢ HAI bàn cùng lúc; hai bàn chỉ khác NỘI DUNG câu
  (`actFor(side)` trả orderA/orderB khi `fightContent==="different"`), không khác CHỈ SỐ. Muốn độc lập
  thật phải bỏ khái niệm vòng chung trong `core/fight.js` ⇒ đổi luôn luật thắng thua (Time delay /
  Speed bonus / Miss wait thành vô nghĩa). Thầy đã cân nhắc và **giữ nguyên**.

**Đã làm — chỉ phần hiển thị**: số câu nay **LUÔN** nằm dưới mỗi nửa (thầy chọn "luôn để dưới mỗi khung",
kể cả khi Same words), bỏ hẳn số chung trên thanh đầu. Thanh đầu còn tên act + đồng hồ trận.
- Gói mang `qn0/qt0` và `qn1/qt1` thay cho một cặp `round/total` chung. ⚠️ Không thừa dù hai bàn hiện luôn
  cùng vòng: **In turns chia 81 câu thành 41/40**, nên một con số chung vốn đã có thể nói sai.
- Mỗi bàn tự khai chỗ đứng của MÌNH trong chồng câu của MÌNH (`reportLink`: `rrLinkNum[fightSide]`,
  `rrLinkTotal[fightSide] = N`); bàn chưa khai thì để **trống**, không in "1 / 0".
- 🐞 **Lỗi tự bắt**: bỏ `#rrs-count` khỏi HTML nhưng `waitingForGame()` còn một dòng `els.count.textContent`
  ⇒ TypeError NGAY khi iPad quay về màn chờ (hết trận / Start again) — tức đúng lúc không ai đang nhìn máy
  chơi để thấy. Bắt bằng grep tham chiếu cũ sau khi đổi DOM, không phải bằng mắt.
- Đo 1366×1024: `3 / 20` tâm x=341 (giữa nửa trái), `5 / 20` tâm x=1025 (giữa nửa phải), cùng y=956, không
  cắt chữ, console sạch. `is-same` ⇒ số vẫn hiện, căn giữa màn (x=683). Một bên chưa khai ⇒ để trống ✓.
- Máy chơi với **Fight content = Different**: hai nửa thanh câu hỏi ra hai câu khác nhau ✓ ("Our galaxy is
  called the …" vs "The Sun is a …"), 2 tên lửa, 7 ô, console sạch.

### 20e. Tàu sát mép lúc xuất phát · mũi tàu chạm vạch là thắng · nút mở màn nguồn (Đợt 368e+f, 22/9/2026)
Thầy 3 ý: *"khi khởi động, đưa con tàu về sát mép màn hình hơn, chỉ đủ nhìn thấy đuôi lửa và một chút xíu
khói"* · *"ở vị trí kết thúc race, chỉ cần mũi tàu chạm vạch là thắng luôn"* · *"thêm 1 nút (only icon) vào
cạnh nút cài đặt … để dùng trên ipad khi cần, có thể dùng cho các act khác trong tương lai nữa"*.

**(1) Vạch xuất phát.** `TRACK_START` 5 → **3**, và **BỎ `.aw-rr-shared .aw-rr-lanes { left: 7% }`** —
tức đảo lại đúng thứ Đợt 360 đã thêm (hồi đó lùi làn vào để khói có chỗ; nay thầy muốn ngược lại và khói
trôi khỏi mép TRÁI chính là cái "chút xíu" thầy cần). Đo Fight trước/sau: tàu 11,65u → **3u**; lửa bắt đầu
8,94u → **0,28u**; khói 7,91u → **−0,74u** (thò ra ngoài, bị cắt một phần — đúng ý). Solo: tàu 3u, lửa
−0,15u, khói −1,42u.

**(2) Mũi tàu chạm vạch.** ⚠️ Gốc của việc mũi VƯỢT vạch **3,78u**: `--x` định vị **MÉP TRÁI** của tàu, mà
vạch đích lại được đặt bằng một con số CHÉP TAY khác (`finishEl.style.left = TRACK_END + 7`). Hai con số
cho cùng một chỗ ⇒ sai là đương nhiên.
Sửa bằng cách **suy ra thay vì chép**: bề rộng tàu nay là **một nguồn duy nhất** `--rw` (trên `.aw-rr-track`),
thân tàu + phi công + số mũi + vạch đích đều đọc nó; vạch đích đứng ở `calc((var(--track-end) + var(--rw)) * 1%)`
= đúng một thân tàu sau mép trái = **đúng chỗ mũi tàu dừng**. JS chỉ còn ghi `--track-end` (= `TRACK_END`, nay **82**).
⚠️ `--lanes` phải chuyển từ `.aw-rr-lanes` lên **`.aw-rr-track`**: vạch đích là ANH EM của khối làn, không
phải con, nên nó không kế thừa được từ chỗ cũ.
Đo: **Fight mũi 93,00u vs tâm vạch 93,00u (lệch 0,00)** · **Solo mũi 94,92u vs vạch 94,91u (lệch 0,01)** —
hai chế độ tàu rộng khác nhau (11u/13u) mà vẫn tự khớp, vì cùng đọc `--rw`.
⚠️ Bỏ `lanes left: 7%` còn một lợi ích kín: 1 % của làn nay **bằng đúng 1u**, nên phép tính vạch đích ở trên
mới cộng được `%` với `u` mà không sai.

**(3) Nút mở màn nguồn** (`main.js`, KHÔNG thuộc `core/`): icon-only cạnh nút Settings ở thanh trên, dùng
`icons.follow` (hình máy tính bảng), mở thẳng `source.html` **cùng tab** (Safari iPad có thể nuốt popup;
một cú điều hướng thì không bao giờ hỏng im lặng như popup bị chặn). ⚠️ Cố ý **không gắn với Rocket race**:
`source.html` không chứa act cũng không chứa luật chơi — nó chỉ vẽ thứ được gửi tới — nên template khác sau
này biết gửi là dùng lại được ngay.
⚠️ Chưa kiểm được trên trang thật vì thanh nút chỉ dựng SAU khi đăng nhập (Claude không đăng nhập được).
Đã kiểm bằng cách dựng đúng cấu trúc `.aw-appbar-right` với CSS thật: nút **46×46 px bằng đúng nút Settings**,
cách 10 px, icon SVG vào đúng chỗ.

### ĐỀ XUẤT SỬA CORE (chờ thầy duyệt trước khi commit)
`core/store.js` — `APP_DATA_KINDS` thêm **3 chuỗi**, không đổi một dòng logic nào:
`"rocketrace-link"`, `"rocketrace-view"` (hai doc mới ở trên) và **`"showdown-session"`**.
Vì sao BẮT BUỘC: chính file đó cảnh báo *"⚠️ ADD ANY FUTURE `kind` OF APP DATA HERE. Forgetting costs a silently
eaten link number and, worse, a `?a=57` that resolves to a settings document."* Tài liệu không có trong Set này sẽ
được `ensureNumbers()` cấp số link và `?a=N` có thể trỏ trúng nó.
⚠️ `"showdown-session"` **đang thiếu từ Đợt 269** — đúng cái bẫy lời cảnh báo mô tả; vá luôn vì cùng một dòng.

## 19. Phi công: chỉ lên xuống, biên độ 1/5 (Đợt 362, 20/9/2026 tối, mọi mode)
Bỏ `aw-rr-facepush` (ép lùi ngang khi boost); `aw-rr-jiggle` ±1,2 % (1/5 của ±6 %); `aw-rr-facerattle` khi khựng/va chỉ dọc
±1,2 %. Chu kỳ/pha vẫn bám thân tàu (Đợt 361). Đo: keyframes chỉ còn `translateY`, không `translateX`.
