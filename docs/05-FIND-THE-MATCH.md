# 05 — FIND THE MATCH

> Mô hình dữ liệu: **B (Match)** — 1 mục = cặp Keyword ↔ Matching Definition.
> Nguồn: tự tạo `wordwall.net/resource/116283114/untitled2307` (templateId=46).

## 1. Cách chơi (player)
- Màn hình hiện một **prompt (keyword hoặc definition)** + một loạt **lựa chọn** của cột kia.
- Người chơi **chạm lựa chọn khớp** → cặp đúng **bị loại khỏi màn hình**.
- Lặp lại đến khi **hết tất cả** đáp án. Có timer, lives, tốc độ (Speed).
- Game **có chấm điểm** → ghi vào **Leaderboard** (điểm + thời gian).

## 2. Cấu trúc nội dung (Enter content)
URL editor: `wordwall.net/create/entercontent?templateId=46`

- **Activity Title**, **+ Instruction**.
- Hai cột: **Keyword** | **Matching Definition** + nút **Swap Columns**.
  - Keyword: text + 🖼️ ảnh (không có audio).
  - Matching Definition: text + 🎤 audio + 🖼️ ảnh.
- Rows: ↕ đổi thứ tự, ⧉ nhân bản, 🗑️ xóa.
- **+ Add an item** — giới hạn **min 3 – max 30** (cần ≥3 để có nhiễu).
- **Done**.

### Mô hình JSON gợi ý cho AWord
```json
{
  "type": "find_the_match",
  "title": "...",
  "pairs": [
    { "keyword": "Apple",  "definition": "a fruit",     "image": null, "audio": null },
    { "keyword": "Carrot", "definition": "a vegetable", "image": null, "audio": null },
    { "keyword": "Rose",   "definition": "a flower",    "image": null, "audio": null }
  ]
}
```
→ **Cấu trúc {keyword, definition} này DÙNG CHUNG** cho Match up, Matching pairs, Balloon pop, Flash cards, Flip tiles, Pair or No Pair.

## 3. Options
| Nhóm | Lựa chọn |
|---|---|
| **TIMER** | None / Count up / Count down |
| **LIVES** | Slider (mặc định 5) |
| **SPEED** | Slider: **Wait for answer** (đợi, không áp lực) → nhanh dần (đáp án trôi, gây áp lực thời gian) |
| **RANDOM** | Shuffle item order |
| **END OF GAME** | Show answers |
| **ANSWERS** | **Correct answers are removed** (đáp án đúng bị loại khỏi màn) |

## 4. Leaderboard — CÓ (game scored)
Có bảng Rank/Name/Score/Time như Quiz/Anagram.

## 5. Visual style
Classic, London, Classroom, Summer, Underwater, Clouds, Video Game, Azure... + FONTS.

## 6. Switch template
Đổi sang: **Match up, Crossword, Quiz, Gameshow quiz** (+ Show all).
- Sang **Quiz/Gameshow**: definition thành câu hỏi, keyword thành đáp án đúng, các keyword khác làm nhiễu.
- Sang **Match up / Matching pairs**: ghép cặp keyword ↔ definition.
- Sang **Crossword**: keyword thành từ, definition thành gợi ý ô chữ.

## 7. Ghi chú build AWord
- Engine: render 1 prompt + tập lựa chọn (gồm đáp án đúng + nhiễu lấy từ các cặp khác), nhận click, loại cặp đúng, cộng điểm/trừ mạng.
- Speed = tốc độ trôi lựa chọn (0 = đứng yên đợi).
- Cùng data {keyword, definition} tái dùng cho toàn bộ nhóm game Match của AWord.
