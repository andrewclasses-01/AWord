# GHI CHÚ — SPEED SORTING (type `group_sort`: Speed sorting · Group sort)

**Trạng thái: ⬜ Đợt 334 (16/9/2026) — thầy bấm tay live Đợt 329 rồi báo 3 lỗi băng chuyền, đã vá + lên live, CHƯA bấm
tay lại.** Băng nay bắt đầu TRỐNG rồi ô đầu trượt vào từ mép · băng LIỀN một dải (sinh ô theo nhu cầu, hết `BELT_SLOTS`)
· LUÔN trộn ngẫu nhiên mọi nhóm (bỏ qua ô Shuffle). Đợt 329 (14/9) thầy "ok tạm thế đã, cải tiến thêm sau". Phiên sau
quay lại thì đọc hết Đợt 327→334 trước, hỏi thầy đã thử tới đâu rồi mới làm tiếp, đừng coi là đã chốt. TOMKO/điện thoại
cảm ứng vẫn chưa đo lần nào.
Đợt 288 (03/9/2026) dựng lần đầu dưới tên "Group sort" cho khóa NỀN TẢNG TIẾNG ANH (Lesson 16 BT2 trên Wordwall
là *Speed sorting* 7 nhóm; Lesson 13 BT1 là *Group sort* kéo thả). Đợt 327 **đổi tên hiển thị thành "Speed sorting"**
và **làm lại chế độ băng chuyền** theo mockup thầy duyệt (artifact "AWord Speed Sorting"). Đợt 328: **☰ Menu dừng
hẳn băng chuyền · bỏ bóng 3D · ô chạy + ô nhóm đổi sang vuông/chữ nhật to hơn, đều nhau tuyệt đối** (kéo thả chính
xác hơn). ⛔ `type` và giá trị `options.mode` ("tap"/"drag") **KHÔNG đổi** — act/bài giao đã lưu mở đúng chế độ cũ,
không migration.

## Cách chơi

Dữ liệu: `content.groups = [tên…]` (2–8 nhóm) · `content.items = [{ text, group: tên }]` (tối đa 150).
Danh sách phẳng để "Start with mistakes" (`itemsKey: "items"`) và Show answers chạy đúng khuôn lõi.

**Chế độ BĂNG CHUYỀN** (`options.mode = "tap"`, mặc định — Speed sorting):
- Lane trên (30% thẻ) kẹp giữa hai vạch tick `.aw-gs-rail`, **cả lane lẫn rail tràn tới mép sân** (`margin: 0 -2.2u`
  bù đệm của `.aw-stage-inner`, Đợt 329 — không thì ô bị cắt ở một vạch trong sân, trông như bật ra chứ không trượt vào); ô câu `.aw-gs-bchip` **cùng một cỡ cố định, vuông**
  (Đợt 328: 13,5u × 13,5u — trước là chữ nhật dẹt 24,3×11,9u; **bỏ hẳn bóng đổ "3D"** `box-shadow: none`; Đợt 329:
  chữ **một cỡ cho cả ván = cỡ LỚN NHẤT mà mọi câu đều lọt khung**, `fitChipFont()` đo bằng ô dò `.is-probe` rồi ghi
  `--gs-chipfont: calc(K*var(--aw-u))`, clamp 6 dòng chỉ là lưới an toàn) trôi **trái → phải** liên tục (rAF, `chip.x` px layout → transform). **Đợt 334: lane bắt đầu TRỐNG** —
  `spawnChip(-chipW)` đặt ô đầu ngay ngoài mép trái rồi trượt vào; **không còn số ô cố định** (`BELT_SLOTS` bỏ): mỗi khung
  `loop()` xoá ô đã ra hẳn mép phải (`x > laneW`, item về hàng đợi) rồi hễ ô trái nhất đã lọt hẳn vào lane (`minX ≥ 0`)
  thì sinh ô kế tại `minX − chipW − gap` ⇒ băng liền một dải cách đều đúng một khe, tự lấp kín mọi bề rộng lane. ⛔ Trước
  đó `BELT_SLOTS = 5` để lại cụm 5 ô + lỗ ~3 ô chạy vòng vĩnh viễn (ô tái dùng luôn nhét sau đuôi cụm). **Thứ tự câu:
  LUÔN `shuffle()`** bất kể ô "Shuffle questions" (editor lưu theo cột nhóm — băng theo thứ tự đó là lộ đáp án); hàng
  đợi `queue` cạn thì trộn lại pool ⇒ vòng sau khác vòng trước; item đang trên băng đẩy về cuối hàng đợi. Màu xoay
  4 tile theme + tím riêng `--aw-gs-tile-4` (`--aw-tile-fixed` vẫn thắng).
- Dưới: ô nhóm `.aw-gs-pill` **vàng nhạt viền nét đứt, không màu theo nhóm, không số** (không lộ đáp án), Đợt 328
  đổi sang **kích thước cố định 16u × 9,4u đều nhau tuyệt đối** (trước co giãn theo độ dài tên — dễ kéo trượt vì
  mỗi ô một cỡ); chữ nằm trong `<span class="aw-gs-pilltext">` cắt tới 4 dòng, cả width/height nhân `var(--fit)`
  để `autoFit` vẫn co được. `flex-wrap` tự canh giữa (7 nhóm ⇒ 5+2 hàng), đệm trên 3,8u. `autoFit` đo qua
  `.aw-gs-pillrow`.
- **Chạm giữ BẤT KỲ ô nào**: ô ẩn (`.is-held`) nhưng **slot vẫn trôi theo băng**; bản sao `.aw-gs-dragclone.is-belt`
  bám con trỏ (trên body/fullscreen host, cỡ/bo góc/đệm/chữ chép bằng px vì ngoài stage không có `--aw-u`).
  move/up/cancel nghe trên **window** + `document.visibilitychange` (⛔ không dùng `blur`).
- **☰ Menu dừng hẳn băng chuyền** (Đợt 328): `gsPauseHandlers` module-level bắc cầu sang `tpl.onPause(paused)` —
  engine chỉ tự dừng animation qua WAAPI, rAF viết tay phải tự khai (đúng khuôn `maze-chase.js`/`gameshow.js`).
- Thả **đúng**: ✓ (`aw-mark-fly`, nhưng keyframes riêng `aw-gs-markstay` — **đứng tại chỗ rồi mờ**, không bay lên
  như `aw-fly` của lõi; Đợt 329, áp cả ✗) trên ô nhóm + sao bay về điểm + điểm +1 + **câu tiêu**, slot nhận câu mới từ mép trái.
  Thả **sai**: ✗ trên ô nhóm + tiếng sai + mất tim (nếu bật) + trừ điểm (`pointsOff` qua `ui.flyPenalty`) + **câu cũng
  tiêu, KHÔNG quay lại băng** (thầy chốt). Thả **ra ngoài**: clone bay về đúng chỗ slot đang trôi (đích đọc lại mỗi
  khung, bù tỉ lệ zoom fullscreen); slot đã trôi khỏi lane ⇒ ô bị gỡ + item lên ĐẦU hàng đợi (là ô kế vào từ mép trái), clone mờ đi.
- Hết câu ⇒ Game complete; hết tim ⇒ **Game over** (`title` truyền vào `ui.finish`); Time's up khi countDown hết.
  Show answers theo **thứ tự chơi**. `speed` 1–10 = tốc độ băng (`normSpeed`: 0/thiếu ⇒ 3); `lives` 0 = vô hạn
  (mặc định). Đếm 3-2-1 ở countUp (`manualTimerStart`), tim ở thanh trên (`hasLivesSlot`). Không còn phím 1–9.
**Chế độ GROUP SORT** (`options.mode = "drag"` — giống Group sort gốc, **không đổi từ Đợt 288**):
- Mọi câu là **chip** `.aw-gs-chip` trong hồ phía trên (xáo trộn); N **hộp nhóm** phía dưới. Kéo chip vào hộp (pointer
  events, clone `position:fixed`) — hoặc **chạm chip rồi chạm hộp** (`TAP_SLOP_PX` 7). Kéo giữa hộp / thả về hồ được.
- `dragCheck = "submit"` (mặc định): xếp xong chip cuối (hoặc Submit) là chấm cả bài — ✓/✗ từng chip, chip chưa xếp =
  sai; trừ điểm gộp; 1,3s sau ra bảng. `dragCheck = "instant"`: thả vào là chấm ngay — đúng khoá tại chỗ, sai rung +
  ✗ + mất tim + trừ điểm rồi chip về hồ sau 0,65s. Thanh dưới `x / N placed` cho tới khi chấm.

## Bộ file
`group-sort.js` (game, 2 mode) · `group-sort-editor.js` (editor N cột, badge SPEED SORTING) · `gs-shared.js` (hằng số +
normalizeGroups, module lá) · `group-sort.css` (`.aw-gs-*`; khối BELT MODE + DRAG MODE + editor) · `gs-sound.js` +
`sounds/` (bộ băng chuyền classic2 chép từ True-false; băng chuyền dùng `pickup`/correct/wrong/go/clocktick) ·
`sample-group-sort.js` (12 câu, 4 nhóm WHERE/WHEN/WHO/WHY, `speed: 3`) · `test.html` + `test.js`
(`?mode=drag`, `?check=instant`, `?speed=`, `?lives=`).
Catalog: `core/catalog.js` mục `group_sort` label "Speed sorting"; `core/tpl-files.js` không đổi (không thêm file).

## Editor
Một cột mỗi nhóm (cuộn ngang): ô tên nhóm (chấm màu) + nút xoá nhóm · các dòng câu (nhân bản/xoá) · + Add an item ·
cột cuối + Add group (tối đa 8). Dán Excel: 2 cột `câu ⇥ nhóm` tự chia (tạo nhóm mới nếu chưa có); 1 cột = điền
cột đang đứng. Validate: tiêu đề · 2–8 nhóm · tên nhóm không rỗng, không trùng · mỗi nhóm ≥1 câu · tổng ≤150.
Lưu ra `{groups, items}`; item của nhóm không còn tồn tại bị bỏ khi mở editor (báo trong normalize).

## Đã kiểm (dev server, test.html, 14/9/2026 — Đợt 327)
- Băng chạy sau 3-2-1, 4 ô nhóm 1 hàng; thả đúng → ✓ + sao + điểm 1, slot đổi câu; thả sai (`?lives=3`) → ✗, tim
  3→2, câu tiêu; thả ra ngoài → về băng, không mất câu. Chơi hết 12 → GAME COMPLETE 11/12, Show answers 12 hàng đúng
  thứ tự chơi (hàng 1 ✗ WHO / ✓ WHEN). `?lives=1` thả sai → GAME OVER. `?mode=drag` pool nguyên vẹn. Act 7 nhóm tiếng
  Việt chữ dài (mẫu Lesson 16 BT2) xếp 3+3+1, `--fit` 0.99, không tràn. Kéo **chuột thật** đúng/sai đều ăn. 0 lỗi console.
- ⛔ Bẫy đã vá ngay lúc thử: `autoFit` đo `pills.scrollHeight` của hộp `flex:1` (kéo giãn) ⇒ luôn "tràn" ⇒ co về 0.4 —
  ô nhóm tí hon; phải đo `.aw-gs-pillrow` không kéo giãn (đúng cảnh báo đầu `core/fit.js`).
- ⛔ Bẫy bàn thử: công cụ chuột của Browser pane lệch **1,11×** so với toạ độ trang; ô đang trôi nên phải chặn riêng
  `requestAnimationFrame` cho hàm `loop` mới bấm trúng. Bẫy Đợt 288 (sao bay `fill:"both"`) vẫn đúng.

## Đã kiểm (dev server, test.html, 14/9/2026 — Đợt 328)
- Ô chạy đo đúng 13,5u × 13,5u, `box-shadow: none`; đệm còn lại trong lane ~1,1u trên/dưới (không tràn/không bị
  `overflow:hidden` của `.aw-gs-lane` cắt). Ô nhóm đo đúng 16u × 9,4u mọi ô, `--fit` giữ 1 với bộ 7 nhóm tiếng Việt
  dài (5+2 hàng), không ô nào bị cắt chữ (`scrollHeight` so `clientHeight` của `.aw-gs-pilltext`).
- Mở ☰ Menu giữa ván (`?speed=1`): đo `transform` của mọi ô chạy 2 lần cách 900ms — **y hệt nhau tuyệt đối** (trước
  vá: vẫn trôi). Bấm Resume: băng chạy tiếp bình thường, không giật/nhảy vị trí. `.aw-stage-dim` xuất hiện/biến
  mất đúng nhịp mở/đóng Menu (⛔ lớp phủ đúng là `.aw-stage-dim`, KHÔNG phải `.aw-tool-dim` — tên khác, dùng cho
  việc khác trong engine.js).
  Kéo thả lại một câu đúng sau khi đổi cỡ ô — vẫn ăn điểm, nav "1 of 12" bình thường.
- Group sort (`?mode=drag`, `.aw-gs-chip`/`.aw-gs-box`) đo lại — không đổi hình, không dính CSS mới.

## Đã kiểm (dev server, test.html?speed=2, 16/9/2026 — Đợt 334)
- Máy ghi rAF đọc `transform` mọi ô từng khung: ô đầu tiên xuất hiện tại **x = −116 = −chipW** đúng lúc băng bắt đầu; 25
  ô sau đều xuất hiện lần đầu tại x ≈ −134 (ngoài mép). Suốt 44 giây (26 lượt sinh, > 2 vòng): **mọi khe = 134,6px**
  (chipW 116 + 16%), min = max; 7–8 ô sống lấp kín lane 856px. Thứ tự sinh xen nhóm, vòng 2 khác vòng 1.
- Chơi bằng `PointerEvent` giả lập: thả đúng ✓ + sao + ô tiêu · thả sai ✗ + ô tiêu · thả ra ngoài → về băng không mất
  câu · ☰ Menu đứng yên tuyệt đối 900ms rồi Resume chạy tiếp · hết 12 câu → GAME COMPLETE 11/12. 0 lỗi console.
- ⛔ Bẫy kho: `core.autocrlf=true`, file trên đĩa CRLF — Edit chèn dòng LF thành file trộn (git vẫn chuẩn hoá khi commit,
  nhưng nắn lại cả file về CRLF trước khi commit cho sạch).

## Chưa làm / ĐỀ XUẤT
- ⬜ Thầy bấm tay: máy soạn · TOMKO · điện thoại (cảm ứng chưa đo — `touch-action:none` + pointer capture như Unjumble).
- Fight mode, Showdown (`showdownMode`/`sdDeal`/`fightMode`) — chưa khai; game này ra đời cho bài giao khóa học.
- Giọng đọc từng câu (`voice`), chuyển đổi template (`core/convert.js`) sang/từ Quiz — chưa làm.
- Nhập từ file bài học Excel (`core/lesson-import.js`) — chưa có dạng sheet; hiện tạo bằng editor hoặc bundle JSON.
