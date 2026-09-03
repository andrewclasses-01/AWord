# GHI CHÚ — GROUP SORT (Group sort · Speed sorting)

**Trạng thái: 🟢 CHỜ THẦY DUYỆT** — build Đợt 288 (03/9/2026) cho khóa NỀN TẢNG TIẾNG ANH
(Lesson 16 BT2 trên Wordwall là *Speed sorting* 7 nhóm; Lesson 13 BT1 là *Group sort* kéo thả).
Thầy chốt 03/9: build **cả hai chế độ** trong một template.

## Cách chơi

Dữ liệu: `content.groups = [tên…]` (2–8 nhóm) · `content.items = [{ text, group: tên }]` (tối đa 150).
Danh sách phẳng để "Start with mistakes" (`itemsKey: "items"`) và Show answers chạy đúng khuôn lõi.

**Chế độ TAP** (`options.mode = "tap"`, mặc định — giống Speed sorting):
- Câu trượt vào giữa theo băng chuyền của True-false (`ENTER_MS` 1300); dưới vạch kẻ là **N nút nhóm**
  (lưới 1–4 cột tuỳ số nhóm, màu lấy theo `--aw-tile-0..3` của theme, `--aw-tile-fixed` vẫn thắng).
- Chạm đúng: ✓ trên nút + **câu bay vào đúng nút nhóm** + sao bay về ô điểm, điểm +1.
  Chạm sai: ✗ + tiếng sai + mất 1 tim (nếu bật) + trừ điểm (`pointsOff`, bay "−N" qua `ui.flyPenalty`);
  câu trượt ra; bật **Repeat** thì quay lại ở vị trí ngẫu nhiên.
- `speed` 0–10 (0 = chờ), `lives` 0 = vô hạn (**mặc định vô hạn** — bài khóa học yêu cầu 100%, không phải
  "sống sót"), `repeatUntilCorrect`. Đếm 3-2-1 ở chế độ count-up (`manualTimerStart`), tim ở thanh trên
  (`hasLivesSlot`). Phím **1–9** = chọn nhóm. Mũi tên prev/next của engine bị ẩn (`:has`).
**Chế độ DRAG** (`options.mode = "drag"` — giống Group sort gốc):
- Mọi câu là **chip** trong hồ phía trên (xáo trộn); N **hộp nhóm** phía dưới. Kéo chip vào hộp (pointer
  events, clone `position:fixed` trên body/fullscreen host như Unjumble) — hoặc **chạm chip rồi chạm hộp**
  (`TAP_SLOP_PX` 7: di chuyển dưới 7px = chạm). Kéo từ hộp này sang hộp khác hoặc thả về hồ được.
- `dragCheck = "submit"` (mặc định): xếp xong chip cuối (hoặc bấm Submit trong menu) là chấm cả bài —
  chip đúng xanh ✓, sai đỏ ✗, chip chưa xếp = sai; trừ điểm gộp một lần; 1,3s sau ra bảng tổng kết.
- `dragCheck = "instant"`: thả vào là chấm ngay — đúng thì khoá chip tại chỗ, sao bay về điểm; sai thì
  rung + ✗ + mất tim + trừ điểm rồi chip nhảy về hồ sau 0,65s. Xếp đúng hết = Game complete; hết tim = Game over.
- Thanh dưới hiện `x / N placed` cho tới khi chấm.

## Bộ file
`group-sort.js` (game, 2 mode) · `group-sort-editor.js` (editor N cột) · `gs-shared.js` (hằng số + normalizeGroups,
module lá để game và editor không import vòng) · `group-sort.css` (`.aw-gs-*`) · `gs-sound.js` + `sounds/`
(bộ băng chuyền classic2 chép từ True-false) · `sample-group-sort.js` (12 câu, 4 nhóm WHERE/WHEN/WHO/WHY) ·
`test.html` + `test.js` (`?mode=drag`, `?check=instant`, `?speed=`, `?lives=`).
Catalog: `core/catalog.js` mục `group_sort`; `core/tpl-files.js` sinh lại bằng `python tools/sinh-preload.py --write`.

## Editor
Một cột mỗi nhóm (cuộn ngang): ô tên nhóm (chấm màu) + nút xoá nhóm · các dòng câu (nhân bản/xoá) · + Add an item ·
cột cuối + Add group (tối đa 8). Dán Excel: 2 cột `câu ⇥ nhóm` tự chia (tạo nhóm mới nếu chưa có); 1 cột = điền
cột đang đứng. Validate: tiêu đề · 2–8 nhóm · tên nhóm không rỗng, không trùng · mỗi nhóm ≥1 câu · tổng ≤150.
Lưu ra `{groups, items}`; item của nhóm không còn tồn tại bị bỏ khi mở editor (báo trong normalize).

## Đã kiểm (browser thật, test.html, 03/9/2026)
- Tap: 3-2-1 → câu trượt vào, 4 nút 2×2; chạm đúng (WHO) → ✓ + câu bay vào nút + điểm 1; chạm sai (WHERE) → ✗,
  điểm giữ nguyên, câu kế vào; phím `2` chọn được nhóm 2; chơi hết 12 câu → GAME COMPLETE 10/12, có nút
  **Start with mistakes**, Show answers hiện đủ 12 hàng (✗ nhóm đã chọn + ✓ nhóm đúng). 0 lỗi console.
- Bẫy đã vá ngay lúc thử: sao bay dùng `fill: "forwards"` thì trong quãng `delay` ngôi sao đứng ở góc (0,0)
  của trang — phải `fill: "both"`.
- Drag (`?mode=drag`): hồ 12 chip + 4 hộp; **kéo thật** bằng chuột "Why does she play football?" vào WHY → vào hộp,
  `1 / 12 placed`; **chạm chip rồi chạm hộp** cũng xếp được; xếp đủ 12 (1 cố ý sai) → tự chấm: 11 chip xanh ✓,
  1 đỏ ✗, điểm 11, GAME COMPLETE 11/12. `?check=instant&lives=3`: thả sai → chip đỏ rung + ✗, tim 3→2, chip
  về hồ; thả đúng → xanh ✓ khoá tại chỗ, điểm 1.
- Bảng Options hiện đủ Mode (Tap/Drag) · Speed · Lives · Unanswered · Checking + Points off/Time cost chung.
- Editor (`scratch/dot288-gs-editor.html`, gọi `openGsEditor` thật): 4 cột đúng mẫu, Save → `groups`/`items`
  y hệt mẫu (vòng tròn ✅).

## Chưa làm / ĐỀ XUẤT
- Fight mode, Showdown (`showdownMode`/`sdDeal`/`fightMode`) — chưa khai; game này ra đời cho bài giao khóa học.
- Giọng đọc từng câu (`voice`), chuyển đổi template (`core/convert.js`) sang/từ Quiz — chưa làm.
- Nhập từ file bài học Excel (`core/lesson-import.js`) — chưa có dạng sheet cho Group sort; hiện tạo bằng
  editor hoặc bundle JSON (`{type:"group_sort", content:{groups, items}}`).
