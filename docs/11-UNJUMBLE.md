# 11 — UNJUMBLE (nghiên cứu Wordwall)

Nguồn: **https://wordwall.net/resource/116872783/unjumble** — style **Whiteboard** (thầy chốt = "Classic"
cho AWord). Ghi lại toàn bộ dữ liệu thu thập ngày 1/8/2026 để dựng template `templates/unjumble/`.

## 1. Nguyên lý & cách chơi
- Giáo viên nhập một **danh sách CÂU** (mỗi dòng 1 câu đúng). Game **tách câu thành các TỪ** và **xáo trộn
  thứ tự từ**. Học sinh **kéo-thả các từ** để rearrange thành câu đúng.
- Hướng dẫn gốc: *"Drag and drop words to rearrange each sentence into its correct order."*
- Dấu câu **dính liền từ cuối** (ô "leave?" là một khối). Bố cục các từ **wrap nhiều dòng**, mỗi dòng có
  một **đường kẻ ngang** (whiteboard/notebook).
- Kéo 1 từ thả vào giữa 2 từ khác → **chèn + cả câu dồn lại** (insert + reflow), không phải swap.
- Act mẫu có **50 câu** thì tương lai với "will" (VD "the mechanic will fix my bike next week",
  "my mother will help my father next month"...).

## 2. Options (bản Wordwall)
| Nhóm | Giá trị |
|---|---|
| **Timer** | None / Count up (mặc định) / Count down (phút:giây) |
| **Marking** | Every word · **Every word with bonus for perfect** (mặc định) · On submit + ☐ Automatically proceed after marking |
| **Alignment** | **Left** (mặc định) / Centered |
| **Random** | ☑ Shuffle item order |
| **End of game** | ☑ Show answers |
- Menu trong game: **Submit answers / Start again / Resume / Play a different template** (khớp engine AWord).
- Ở "On submit": nav "x of N" lên trên, nút **Submit Answers** ở dưới; sai → các từ mờ xám + hiện đáp án đúng.

## 3. Mô hình dữ liệu (từ màn Edit Content)
- Bảng 2 cột: **Sentence** (bắt buộc, gõ nguyên câu đúng) | **Clue** (tùy chọn, + nút ảnh gợi ý).
- Mỗi dòng có: số thứ tự · 🎤 voice · 🖼️ image · ⇕ kéo sắp xếp · ⧉ duplicate · 🗑️ xóa.
- Suy ra shape AWord: `content.items[] = { sentence: "...", clue?: "..." }` (bản engine cũng chấp nhận
  layout "Unjumble-WithClues" có clue + ảnh, và "Unjumble-NoClues").

## 4. Đồ họa (theme Whiteboard)
Lưu tại `D:\APP AND DATA\AWord-data\Source\Graphic\UNJUMBLE\`:
- `whiteboardgrouped.jpg` (1188²) — bảng trắng khung đen + doodle góc (tia sét, "WW", sao, chó xanh, người
  que xanh lá, chữ tay "WORD WALL WHITE BOARD" = **branding Wordwall, KHÔNG dùng lại**).
- `correcttick.png` (tick **xanh** #2bc58a) · `incorrectcross.png` (X **đỏ** #e54860) · `greyspark.png` (tia sáng).
→ AWord **vẽ lại doodle bằng SVG** (generic, không branding); tick/X dùng SVG inline theo màu palette.

## 5. Bảng màu (Palette.json của theme)
- Mực chữ (Neutral): **#777777** · Nền ô (TilesBackground): **#f5f5f5**
- Đúng (green): **#00c77e / #2bc58a** · Sai (red): **#ea304c / #e54860**
- Bộ màu ô (nếu cần): đỏ #e54860 · lá #2bc58a · cam #ff8f33 · tím #c22ed6 · xanh #7091f5
- Font: theme dùng FontStack Id 18 (kiểu **viết tay nghiêng**) → AWord dùng stack hệ thống
  `Segoe Print / Bradley Hand / Comic Sans MS / Baloo 2`, `font-style: italic`.

## 6. Âm thanh (Audios.json của theme — bản đồ chính thức)
Nguồn `https://themes.cdn.wordwall.net/themesound/themes/whiteboard2/sounds-06-2024/`. Unjumble (Count up)
tải đúng **41 file**; bản đồ sự kiện→âm:
| Sự kiện | File | | Sự kiện | File |
|---|---|---|---|---|
| Intro (Play) | whiteboardintro | | Correct (1 từ đúng) | ChipMinor1..4 |
| TilePickup (nhấc từ) | whiteboardpickup1..8 | | FastCorrect (đúng liên tiếp) | ChipMinorFast1..4 |
| TileDrop (thả từ) | whiteboarddrop1..8 | | Incorrect (1 từ sai) | ChipFail1..4 |
| Perfect (cả câu đúng) | whiteboardchipmajor | | FastIncorrect (sai liên tiếp) | ChipFailFast1..4 |
| GameCompleted | whiteboardgamesuccessful | | TimesUp | whiteboardtimesup |
| Restart / Menu | whiteboardrestart / whiteboardmenu | | Leaderboard / RevealAnswers | whiteboardleaderboards / whiteboardreveal |
| BackgroundMusic | whiteboardbackgroundmusic1 | | ClockTick / Go (chỉ khi Count down) | whiteboardclocktick / whiteboardclockgo |
(Không dùng: TileFlip/TileAppear/Shuffle/Spinner/WheelTick/MazeChase... = của game khác cùng theme.)

## 7. Bố cục engine (Unjumble-*.json)
- `Unjumble-NoClues.json`: khối `Words` (LineBreaks=Distribute, wrap), mỗi từ là `Tile` + `Label`, có
  `Place` loại CursorSpace/DropSpace (khe chèn khi kéo).
- `Unjumble-WithClues.json`: thêm `Image` + `Label` clue phía trên hàng từ; ScoreProfile theo ảnh clue.
→ AWord dựng tương đương: clue trên đầu (nếu có) + hàng từ kéo-thả bên dưới.

## 8. Khác biệt AWord vs Wordwall (quyết định khi build)
- Kéo-thả: giữ **insert + reflow** thật (thầy chốt "giống hệt Wordwall"), pointer-event chạy chuột + cảm ứng.
- Đủ **3 chế độ chấm** (thầy chốt). "Perfect" = mọi lượt kéo đều đặt từ về đúng nhà.
- Xáo trộn dùng **derangement** (không từ nào đúng sẵn) để không bắt đầu nửa-xong.
- Doodle vẽ lại SVG (bỏ branding Wordwall). Look Whiteboard là mặc định riêng của Unjumble; đổi
  Basic/Classroom/Beach chỉ re-tint. Không sửa `core/`.
