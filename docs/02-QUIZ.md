# 02 — QUIZ

> Mô hình dữ liệu: **A (Quiz)** — 1 mục = 1 câu hỏi + nhiều đáp án, ≥1 đáp án đúng.
> Nguồn: tự tạo `wordwall.net/resource/116282831/aword-quiz-demo` (templateId=5).

## 1. Cách chơi (player)
- Chuỗi **câu hỏi trắc nghiệm**. Mỗi màn hiện câu hỏi + các ô đáp án.
- Người chơi **chạm đáp án đúng** để tiếp câu sau.
- Có **timer** (đếm lên/xuống), **lives** (mạng), **điểm**. Sai có thể mất mạng / được retry (tùy option).
- Kết thúc: hiện điểm, Show answers, ghi vào **Leaderboard** (điểm + thời gian).

## 2. Cấu trúc nội dung (Enter content)
URL editor: `wordwall.net/create/entercontent?templateId=5`

- **Activity Title**
- **+ Instruction** (tùy chọn)
- Danh sách **Question block**, mỗi câu:
  - **Question** (ô nhập câu hỏi) + 🎤 audio + 🖼️ ảnh; ↕ đổi thứ tự, ⧉ nhân bản, 🗑️ xóa.
  - **Answers**: A, B, C... mỗi đáp án gồm:
    - **Nút trạng thái đúng/sai**: ✕ đỏ (sai, mặc định) ↔ ✓ xanh (đúng). Bấm để toggle.
    - **Cho phép NHIỀU đáp án đúng** (mỗi đáp án là toggle độc lập, không phải radio).
    - Ô nhập text + 🎤 audio + 🖼️ ảnh.
    - Thanh định dạng: **B** (bold), x² (superscript), x₂ (subscript), Ω (chèn ký tự đặc biệt).
  - **+ Add more answers** (thêm đáp án).
- **+ Add a question** — giới hạn **min 1 – max 100 câu**.
- **Done** để lưu. **Generate With AI** tạo tự động.

### Mô hình JSON gợi ý cho AWord
```json
{
  "type": "quiz",
  "title": "AWORD QUIZ DEMO",
  "instruction": "",
  "questions": [
    {
      "question": "The opposite of \"hot\" is ...",
      "image": null, "audio": null,
      "answers": [
        { "text": "cold", "correct": true,  "image": null, "audio": null },
        { "text": "warm", "correct": false, "image": null, "audio": null }
      ]
    }
  ]
}
```

## 3. Options (tùy chỉnh khi chơi) — RẤT quan trọng cho AWord
| Nhóm | Lựa chọn |
|---|---|
| **TIMER** | None / Count up / Count down (m:s) |
| **RANDOM** | Shuffle question order · Shuffle answer order |
| **RETRIES** | Allow single retry after incorrect answer |
| **LIVES** | Slider: Unlimited → số mạng hữu hạn |
| **MARKING** | Automatically proceed after marking |
| **END OF GAME** | Show answers |
| **LETTERS ON ANSWERS** | A, B, C / None (hiện nhãn chữ trên đáp án) |
| — | Apply To This Activity + More |

→ Điểm số thường tính theo **số câu đúng** và **thời gian**; timer/lives/retry ảnh hưởng luật chơi. AWord nên cho cấu hình các option này per-activity.

## 4. Visual style
Themes: Classic, London, Classroom, Indigo, Beach, Video Game, Clouds, Corkboard... + FONTS.

## 5. Switch template (đổi game cùng dữ liệu Quiz)
Từ Quiz đổi sang: **Maze chase, Airplane, Anagram, Flying fruit** (+ Show all → tất cả game mô hình A + một số mô hình khác).
- Sang **Anagram**: dùng đáp án đúng làm "word", câu hỏi làm "clue".
- Sang **Maze chase / Airplane / Flying fruit / Whack-a-mole / Open the box...**: cùng {câu hỏi, đáp án, đáp án đúng}, chỉ khác cách render + luật chơi.
→ **Đây là trục xoay chính của AWord**: mô hình A phủ nhiều game nhất → làm engine Quiz trước, rồi các game khác chỉ là "skin + luật" đọc cùng data.

## 6. Thao tác trang activity
Preview · Play · Share · Edit Content · Print · Embed · Set Assignment · More · Leaderboard (Rank/Name/Score/Time).

## 7. Ghi chú build AWord
- Data chuẩn: `questions[]{ question, answers[]{text, correct} }`. Hỗ trợ nhiều đáp án đúng.
- Engine render: hiện câu hỏi + đáp án (xáo nếu bật), nhận click, chấm, cộng điểm, trừ mạng/timer.
- Cho phép ảnh/âm thanh ở cả câu hỏi lẫn đáp án (giai đoạn sau).
- Chính data này tái dùng cho Open the box (task 04) và nhiều game khác.
