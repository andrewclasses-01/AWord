# GHI CHÚ — SPEED SORTING (type `group_sort`: Speed sorting · Group sort)

**Trạng thái: ⬜ Đợt 327 (14/9/2026) — thầy "ok build" sau 6 vòng mockup, ĐÃ đưa vào code, CHỜ THẦY BẤM TAY.**
Đợt 288 (03/9/2026) dựng lần đầu dưới tên "Group sort" cho khóa NỀN TẢNG TIẾNG ANH (Lesson 16 BT2 trên Wordwall
là *Speed sorting* 7 nhóm; Lesson 13 BT1 là *Group sort* kéo thả). Đợt 327 **đổi tên hiển thị thành "Speed sorting"**
và **làm lại chế độ băng chuyền** theo mockup thầy duyệt (artifact "AWord Speed Sorting"). ⛔ `type` và giá trị
`options.mode` ("tap"/"drag") **KHÔNG đổi** — act/bài giao đã lưu mở đúng chế độ cũ, không migration.

## Cách chơi

Dữ liệu: `content.groups = [tên…]` (2–8 nhóm) · `content.items = [{ text, group: tên }]` (tối đa 150).
Danh sách phẳng để "Start with mistakes" (`itemsKey: "items"`) và Show answers chạy đúng khuôn lõi.

**Chế độ BĂNG CHUYỀN** (`options.mode = "tap"`, mặc định — Speed sorting):
- Lane trên (30% thẻ) kẹp giữa hai vạch tick `.aw-gs-rail`; ô câu `.aw-gs-bchip` **cùng một cỡ cố định**
  (24,3u × 11,9u, chữ 2u, cắt 3 dòng) trôi **trái → phải** liên tục (rAF, `chip.x` px layout → transform). 5 ô sống
  cùng lúc (`BELT_SLOTS`); ô ra khỏi mép phải vào lại từ mép trái mang câu kế (không lặp câu đang hiện trên băng).
  Màu xoay 4 tile theme + tím riêng `--aw-gs-tile-4` (`--aw-tile-fixed` vẫn thắng).
- Dưới: ô nhóm `.aw-gs-pill` **vàng nhạt viền nét đứt, không màu theo nhóm, không số** (không lộ đáp án), xếp
  `flex-wrap` tự canh giữa (7 nhóm ⇒ 3+3+1 / 4+3 tuỳ độ dài tên), đệm trên 3,8u. `autoFit` đo qua `.aw-gs-pillrow`.
- **Chạm giữ BẤT KỲ ô nào**: ô ẩn (`.is-held`) nhưng **slot vẫn trôi theo băng**; bản sao `.aw-gs-dragclone.is-belt`
  bám con trỏ (trên body/fullscreen host, cỡ/bo góc/đệm/chữ chép bằng px vì ngoài stage không có `--aw-u`).
  move/up/cancel nghe trên **window** + `document.visibilitychange` (⛔ không dùng `blur`).
- Thả **đúng**: ✓ (`aw-mark-fly`) trên ô nhóm + sao bay về điểm + điểm +1 + **câu tiêu**, slot nhận câu mới từ mép trái.
  Thả **sai**: ✗ trên ô nhóm + tiếng sai + mất tim (nếu bật) + trừ điểm (`pointsOff` qua `ui.flyPenalty`) + **câu cũng
  tiêu, KHÔNG quay lại băng** (thầy chốt). Thả **ra ngoài**: clone bay về đúng chỗ slot đang trôi (đích đọc lại mỗi
  khung, bù tỉ lệ zoom fullscreen); slot đã trôi khỏi lane ⇒ vào lại từ mép trái, clone mờ đi.
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

## Chưa làm / ĐỀ XUẤT
- ⬜ Thầy bấm tay: máy soạn · TOMKO · điện thoại (cảm ứng chưa đo — `touch-action:none` + pointer capture như Unjumble).
- Fight mode, Showdown (`showdownMode`/`sdDeal`/`fightMode`) — chưa khai; game này ra đời cho bài giao khóa học.
- Giọng đọc từng câu (`voice`), chuyển đổi template (`core/convert.js`) sang/từ Quiz — chưa làm.
- Nhập từ file bài học Excel (`core/lesson-import.js`) — chưa có dạng sheet; hiện tạo bằng editor hoặc bundle JSON.
