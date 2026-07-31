# 09 — CROSSWORD (nghiên cứu Wordwall)

Nghiên cứu act mẫu của thầy, style **Classic**:
https://wordwall.net/resource/116864402/crossword  (templateId **11**, themeId **1** = Classic).
Thu thập 31/7/2026 bằng cách mở act thật (Claude in Chrome) + đọc file cấu hình theme trên CDN + CHƠI
THẬT để xác nhận từng âm thanh/hiệu ứng.

## 1. Bản chất & mô hình dữ liệu

Crossword = **danh sách cặp {answer, clue}**. Grid ô chữ được **tự sinh** (các từ chèn nhau ở chữ
chung) — giáo viên KHÔNG tự xếp lưới. Đây là "mô hình dữ liệu #? = pairs" giống Match up: mỗi cặp gồm
`primary` = **đáp án (từ điền vào ô)**, `secondary` = **gợi ý (định nghĩa)**.

JSON nội dung gốc (Wordwall `content-models/.../*.json`, type 7):
```json
{ "templateId": 11, "type": 7,
  "content": { "pairs": [
    { "primary": { "text": "CORRECT", "image": null, "sound": null },
      "secondary": { "text": "This describes something that is right and has no mistake in it.", ... } },
    ... 20 cặp ...
  ] } }
```
20 từ trong act mẫu: CORRECT, COMPETITION, STRANGE, FRONT, BAR, NEAR, PUSH, DROP, THROW, DESCRIBE,
MATTER, CARRY, PULL, INTEREST, BEHIND, BREAK, SEASON, ACROSS, FALL, CHANGE.

## 2. Cách chơi (quan sát trực tiếp)

- Màn Ready (nền tối): tiêu đề "Crossword" + tên lesson to + Preview/Play + hướng dẫn
  "Use the clues to solve the crossword. Tap on a word and type in the answer." + loa + fullscreen.
- Vào chơi: đồng hồ trái, "✓ N" phải, chữ giữa "Pick a word". Lưới ô chữ (ô trắng viền xám, ô đầu
  mỗi từ có SỐ nhỏ ở góc).
- **Bấm 1 từ** → chữ giữa đổi "Type the letters", **gợi ý hiện TO đè lên lưới**, hàng của từ đó sáng,
  ô đầu có viền xanh (con trỏ).
- **Gõ chữ** (không có âm gõ từng chữ). Đủ chữ cả từ → tự chấm:
  - Đúng: cả từ chuyển **ô màu xanh accent + chữ trắng**, điểm +1, âm "correct". Về "Pick a word".
  - Sai: âm "incorrect"; với option **Show answer when wrong** bật (mặc định) → tự điền đáp án đúng
    vào ô (điểm KHÔNG tăng).
- Menu (nút 3 gạch): **Submit answers / Start again / Resume / Play a different template**.
- Kết thúc (Submit hoặc giải hết): Wordwall xen 1 hộp "How did today's activity go?" (tính năng tài
  khoản Wordwall, KHÔNG thuộc game) → panel **GAME COMPLETE** (Score X/N, Time, "YOU'RE 1ST ON THE
  LEADERBOARD") → **Leaderboard / Show answers / Start again / Play a different template**.
- **Show answers**: mỗi hàng = số + gợi ý + đáp án dạng ô chữ (đúng = ô xanh + ✓; sai = ô xám + ✗;
  bỏ trống = ô xanh đáp án + "No answer").
- **Leaderboard**: "ENTER YOUR NAME / You're 1st on the leaderboard" + bàn phím ảo (Skip/123/Enter).

→ Toàn bộ khung này TRÙNG với engine AWord (ready/menu/panel/leaderboard/review) nên tận dụng được hết.

## 3. Options (đầy đủ)

- **TIMER**: None / Count up / Count down (phút:giây).
- **Strictly mark letter accents**: bắt buộc khớp dấu (tiếng Anh → bỏ qua ở AWord).
- **Show answer when wrong**: gõ sai thì tự hiện đáp án đúng.
- **END OF GAME → Show answers**.
- **KEYBOARD LANGUAGE**: Auto + nhiều ngôn ngữ (bố cục bàn phím ảo). AWord dùng QWERTY tiếng Anh.
- KHÔNG có Shuffle / Letters-on-answers (lưới cố định).

## 4. Cách EDIT (Edit Content)

Giao diện: tiêu đề "Edit content", nút "Generate With AI", badge Crossword. **Activity Title** +
"+ Instruction". Bảng 2 cột **Answer | Clue** (nút **Swap Columns**); mỗi hàng: số + ô Answer + ô Clue
+ 🎤 (thu âm/âm cho clue) + 🖼️ (ảnh cho clue) + ▲▼ đổi chỗ / nhân bản / xóa.

## 5. Theme Classic — màu & hình

- Bảng màu ô (`themejson/classic/palette.json`, nhóm "Default"): `#229fec #d11f31 #fe7606 #218748
  #cc5dda #2035cf #3dbd85 #e73c04 #8333e6`. Thực tế ô đã giải trong Crossword dùng **1 màu accent xanh
  `#229fec`**, chữ TRẮNG, font RedditSansMedium (AWord dùng Baloo 2). Ô trống = nền trắng, viền xám.
- Ô = `blocksquare.webp` (bo góc) + bóng `squaretile-shadow.webp`; dấu `correcttick.png` (✓ trắng viền
  xám) / `incorrectcross.png` (✗); `contentsound.png` = icon loa cho clue có âm.
  → Đồ họa RẤT đơn giản, AWord vẽ lại bằng CSS + icon SVG có sẵn (không cần các file này; đã lưu tham
  khảo ở `D:\APP AND DATA\AWord-data\Source\Graphic\CROSSWORD`).

## 6. Âm thanh Classic (CDN + XÁC NHẬN BẰNG CHƠI THẬT)

Nguồn: `themejson/classic/audios.json` (danh sách CHUNG mọi game). Crossword **preload đúng 13 file /
9 hiệu ứng** → đó là bộ nó dùng. Đã nghe/đo khớp khi chơi (chi tiết bảng trong
`D:\APP AND DATA\AWord-data\Source\Sound effect\CROSSWORD\GHI CHU.md`):

| Sự kiện | File (audios.json Type) | Nghe khi |
|---|---|---|
| Intro | blockgameintro1 | bấm Play |
| Correct (×3 random) | blockchipminor1/2/3 | giải đúng 1 từ |
| Incorrect (×3 random) | blockchipfail1/2/3 | trả lời sai 1 từ |
| GameCompleted | blockgamesuccessful | Submit / giải hết |
| TimesUp | blockgametimeout | Count down về 0 |
| Restart | blockgamerestart | Start again |
| Menu | blockgamemenu | mở menu |
| Leaderboard | blockgameleaderboard | mở leaderboard |
| RevealAnswers | blockgamereveal | Show answers |

KHÔNG dùng: âm gõ từng chữ, ClockTick, TileFlip/Appear/Pickup, GameOver(unsuccessful), Shuffle.

## 7. Cách AWord dựng lại (template `templates/crossword/`)

Xem `templates/crossword/GHI CHU CROSSWORD.md`. Tóm tắt: tự sinh lưới interlock (greedy, từ dài trước,
mỗi từ sau tìm chỗ chèn tốt nhất), render CSS grid, nhập bằng bàn phím vật lý + bàn phím ảo (ẩn mặc
định, bật cho cảm ứng), chấm từng từ, dùng mp3 Classic thật, khớp hợp đồng engine (ui.setScore/setNav/
finish + sounds{play,restart,timeWarning,complete} + edit + toPrintItems + hideLettersOption +
hasKeyboardToggle + buildExtraOptions[showAnswerWhenWrong]). Style thầy chọn (Classic) = mặc định AWord.
