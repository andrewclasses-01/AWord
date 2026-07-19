# 01 — ANAGRAM

> Mô hình dữ liệu: **C (Word)** — 1 mục = 1 từ/cụm + gợi ý (clue) tùy chọn.
> Nguồn: `wordwall.net/resource/116282109/anagram` (Example Activities).

## 1. Cách chơi (player)
- Màn chơi hiện **1 câu gợi ý (clue)** ở nền + các **ô chữ cái bị xáo** của đáp án.
- Người chơi **kéo từng chữ cái** vào đúng vị trí (hoặc gõ) để ghép lại thành từ/cụm đúng.
- Giải xong 1 từ → chuyển từ tiếp theo. Có **timer** (đếm lên/xuống) và **chấm điểm**.
- Kết thúc: hiện điểm, có thể **Show answers**, và ghi tên vào **Leaderboard** (điểm + thời gian).

## 2. Cấu trúc nội dung (Edit Content)
URL editor: `wordwall.net/create/editcontent?guid=<GUID>`

Trường dữ liệu:
- **Activity Title** (tên hoạt động).
- **+ Instruction** — dòng hướng dẫn tùy chọn hiển thị cho người chơi.
- Chế độ: **Without clues** / **With clues** (radio). "With clues" → có cột gợi ý.
- Bảng item, mỗi hàng:
  | Cột | Ý nghĩa |
  |---|---|
  | **Word** | Từ/cụm đáp án cần giải (vd TROUSER, PREFER, COMPETITION) |
  | **Clue** | Câu định nghĩa gợi ý (vd "This means to like one thing more than another.") |
- Mỗi hàng có: 🎤 **thêm audio/giọng đọc**, 🖼️ **thêm ảnh**, ↕ **kéo đổi thứ tự**, ⧉ **nhân bản**, 🗑️ **xóa**.
- Nút **Swap Columns** (đổi vị trí 2 cột Word/Clue).
- **+ Add a new word** để thêm hàng. Giới hạn: **min 1 – max 100 item**.
- Nút **Done** để lưu.
- Nút **Generate With AI** (tạo nội dung tự động) + **history** (lịch sử phiên bản).

### Mô hình JSON gợi ý cho AWord
```json
{
  "type": "anagram",
  "title": "ANAGRAM",
  "instruction": "",
  "withClues": true,
  "items": [
    { "word": "PREFER", "clue": "This means to like one thing more than another.", "image": null, "audio": null }
  ]
}
```

## 3. Options (tùy chỉnh khi chơi)
| Nhóm | Lựa chọn |
|---|---|
| **TIMER** | None / Count up / Count down (đặt phút:giây) |
| **MARKING** (chấm) | Every letter / Every letter with bonus for perfect / On submit; + "Automatically proceed after marking" |
| **CHANGE CASE** | Don't change / All uppercase / All lowercase |
| **LAYOUT** | Letters start above word / Rearrange letters |
| **RANDOM** | Shuffle item order (xáo thứ tự từ) |
| **END OF GAME** | Show answers (hiện đáp án cuối bài) |
| — | "Apply To This Activity" + "More" (thêm option) |

## 4. Visual style (giao diện)
Chọn theme: Classic, London, Classroom, Beach, Video Game, Underwater, Primary, Summer... + **FONTS** (dropdown, mặc định "abc 123").
→ Cùng 1 nội dung, đổi da giao diện. AWord nên tách **theme** khỏi **nội dung + luật chơi**.

## 5. Switch template (đổi game cùng dữ liệu)
Từ Anagram có thể đổi sang: **Balloon pop, Quiz, Gameshow quiz, Maze chase** (+ "Show all").
- Vì dữ liệu là {word, clue}, khi sang Quiz/Gameshow/Maze chase → **clue thành câu hỏi, word thành đáp án đúng**, các word khác làm nhiễu.
- Sang Balloon pop → ghép word ↔ clue.
→ **Bài học AWord**: chuẩn hóa dữ liệu {prompt, answer} để 1 bộ nội dung tái dùng nhiều template.

## 6. Thao tác trên trang activity
Preview · Play · **Share** (công khai/link/nhúng) · **Edit Content** · **Print** · **Embed** (`</>`) · **Set Assignment** · **More** · **Leaderboard** (Rank/Name/Score/Time top 10, mặc định private, Share để công khai).

## 7. Ghi chú build AWord
- Engine Anagram: nhận mảng `items`, với mỗi item render clue + xáo ký tự `word` → drag/drop về đúng vị trí, chấm theo ký tự đúng.
- Xáo ký tự client-side; cần chống trùng vị trí gốc.
- Hỗ trợ chữ hoa/thường + ẩn khoảng trắng cho cụm nhiều từ.
- Tách theme (CSS skin) khỏi engine.
