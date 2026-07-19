# 03 — TYPE THE ANSWER

> Mô hình dữ liệu: **A/prompt** — 1 mục = prompt/câu hỏi + đáp án GÕ (nhiều đáp án chấp nhận).
> Nguồn: tự tạo `wordwall.net/resource/116282921/untitled2305` (templateId=89).

## 1. Cách chơi (player)
- Mỗi màn hiện **1 câu hỏi/prompt** (có thể kèm ảnh/âm thanh).
- Người chơi **gõ đáp án** vào ô nhập rồi xác nhận.
- Hệ thống **so khớp** với (các) đáp án đúng đã cấu hình → đúng/sai.
- Có timer, có thể hiện đáp án khi sai. Kết thúc: điểm + Leaderboard (điểm, thời gian).

## 2. Cấu trúc nội dung (Enter content)
URL editor: `wordwall.net/create/entercontent?templateId=89`

- **Activity Title**, **+ Instruction**.
- Hai chế độ (radio):
  - **Questions and answers** — hỏi → gõ đáp án.
  - **Spelling test** — dạng đánh vần (đọc/hiện từ, HS gõ chính tả).
- Item block:
  - **Question** (+ 🎤 audio, 🖼️ ảnh).
  - **Answer** (đáp án chính).
  - **+ Add alternate answer** → thêm **nhiều đáp án được chấp nhận** (mỗi cái có ô riêng + nút xóa). Dùng cho biến thể chính tả/từ đồng nghĩa.
  - ↕ đổi thứ tự, ⧉ nhân bản, 🗑️ xóa item.
- **+ Add a question** — giới hạn **min 1 – max 30** (thấp hơn Quiz).
- Editor **AUTO SAVING** (tự lưu). Nút **Done**.

### Mô hình JSON gợi ý cho AWord
```json
{
  "type": "type_the_answer",
  "mode": "qa",              // "qa" | "spelling"
  "title": "...",
  "items": [
    {
      "prompt": "What is the past tense of \"go\"?",
      "image": null, "audio": null,
      "acceptedAnswers": ["went"]     // mảng — nhiều đáp án đúng
    }
  ]
}
```

## 3. Options — CỰC KỲ quan trọng cho AWord (logic chấm gõ)
| Nhóm | Lựa chọn |
|---|---|
| **TIMER** | None / Count up / Count down |
| **Chấm** | **Strictly mark letter cases** (phân biệt HOA/thường) · **Strictly mark letter accents** (phân biệt dấu) · **Show answer when wrong** |
| **END OF GAME** | Show answers |
| **RANDOM** | Shuffle item order |
| **KEYBOARD LANGUAGE** | Dropdown (English...) — bàn phím ảo cho ký tự đặc biệt |

→ **Luật chấm gõ mặc định**: bỏ qua HOA/thường + bỏ qua dấu, so khớp với **tập đáp án chấp nhận**. AWord cần copy logic này: `normalize(input) ∈ normalize(acceptedAnswers)` với normalize tùy 2 cờ trên. Trim khoảng trắng.

## 4. Visual style
Themes: Classic, Classroom, Azure, Wooden desk, Whiteboard, Beach, Summer, Detective + FONTS.

## 5. Switch template
Đổi sang: **Flash cards, Anagram, Hangman, Spell the word** (mô hình word/prompt).
- answer = "word", question = "prompt/clue" → tái dùng cho các game từ đơn.

## 6. Ghi chú build AWord
- Ô nhập text + nút submit; so khớp chuẩn hóa với `acceptedAnswers`.
- 2 cờ chuẩn hóa: caseSensitive, accentSensitive.
- Chế độ Spelling test: phát audio/hiện từ mờ → HS gõ lại.
- Đây là game "chấm tự do gõ" → khi thu kết quả HS cần lưu cả **câu trả lời gõ** để phúc khảo (giống cơ chế TYPE THE ANSWER trong skill checkkhoanentang của thầy).
