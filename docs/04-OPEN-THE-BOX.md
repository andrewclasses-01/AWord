# 04 — OPEN THE BOX

> Mô hình dữ liệu: **A (Quiz)** hoặc **danh sách đơn** — render dạng lưới hộp bí mật.
> **Đặc biệt: template MỞ (open-ended) — KHÔNG sinh điểm/leaderboard.**
> Nguồn: tự tạo `wordwall.net/resource/116283011/untitled2306` (templateId=30).

## 1. Cách chơi (player)
- Màn hình hiện **lưới các hộp đánh số** (đóng).
- Người chơi/giáo viên **chạm từng hộp** để mở, **hiện nội dung bên trong** (một prompt, hoặc một câu hỏi+đáp án).
- Không tính điểm — dùng cho **hoạt động lớp học** (bốc câu hỏi nói, phần thưởng, ôn tập ngẫu nhiên).
- Hộp có thể **để mở** hoặc **tự đóng lại** sau khi xem.

## 2. Cấu trúc nội dung (Enter content)
URL editor: `wordwall.net/create/entercontent?templateId=30`

Hai chế độ (radio):
- **Simple boxes** — mỗi hộp = **1 ô nội dung** (text + 🎤 audio + 🖼️ ảnh). Chỉ để lộ nội dung.
- **Boxes with questions** — mỗi hộp = **Question + Answers (a, b...)**, đáp án **Optional**, có toggle đúng/sai (giống Quiz). Có thể chỉ có câu hỏi (không đáp án).

Giới hạn: **min 2 – max 100 hộp**. Nút **Done**.

### Mô hình JSON gợi ý cho AWord
```json
{
  "type": "open_the_box",
  "mode": "simple",            // "simple" | "questions"
  "title": "...",
  "items": [
    { "text": "Tell me about your family.", "image": null, "audio": null }
  ]
}
// mode "questions": item = { question, answers[]{text, correct} } như Quiz
```

## 3. Options
| Nhóm | Lựa chọn |
|---|---|
| **RANDOM** | Shuffle item order |
| **COLUMNS** | Slider Auto → N (số cột lưới hộp) |
| **ROWS** | Slider Auto → N (số hàng) |
| **END OF GAME** | Show answers |
| **BOXES** | Leave open / Automatically close (hộp để mở hay tự đóng) |

→ Không có Timer/Lives/Marking vì **không chấm điểm**.

## 4. Leaderboard — KHÔNG CÓ
> "Open the box is an open-ended template. It does not generate scores for a leaderboard."

**Bài học lớn cho AWord**: phân loại template thành 2 nhóm:
- **Scored (có điểm → xếp hạng)**: Quiz, Anagram, Type the answer, Find the match, Maze chase, Gameshow quiz, Whack-a-mole...
- **Open-ended (không điểm)**: Open the box, Speaking cards, Flash cards, Spin the wheel, Word magnets, Watch and memorize...

→ Cơ chế thu dữ liệu học sinh + leaderboard của AWord chỉ áp cho nhóm Scored. Engine cần cờ `scorable: true/false` cho mỗi template.

## 5. Visual style
Classroom, London, Beach, Summer, Video Game, Clouds, Corkboard, Magic Library... + FONTS.

## 6. Switch template
Cùng dữ liệu quiz/list → đổi sang các game nhóm A (Quiz, Maze chase...) hoặc list (Spin the wheel, Random wheel...).

## 7. Ghi chú build AWord
- Render lưới hộp (cấu hình cols/rows, mặc định Auto tính theo số item).
- Hộp bấm → animation mở → hiện nội dung. Tùy option đóng lại hay để mở.
- Đây là "wrapper hiển thị" → có thể tái dùng chung engine dữ liệu với Quiz nhưng tắt phần chấm điểm.
- Hữu ích cho lớp học của thầy: bốc prompt nói ngẫu nhiên, không cần điểm.
