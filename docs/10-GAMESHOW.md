# 10 — GAMESHOW QUIZ (nghiên cứu Wordwall)

Nguồn: act Pro của thầy https://wordwall.net/resource/116864527/gameshow · theme nội bộ **`gameshow`**
(template id **69**, type **11**) · Visual style **TV game show** = "Classic" trong AWord.
Khai thác 1/8/2026 bằng Claude in Chrome (đọc `themejson/gameshow/*` + Performance API + chơi thử).

## Gameplay

Trắc nghiệm có **áp lực thời gian + điểm + mạng + vòng thưởng + quyền trợ giúp** (mô tả gốc trong game:
*"A multiple choice quiz with time pressure, lifelines and a bonus round."*).

1. **Intro**: bấm Play → nhạc game-show + 2 cánh cửa "The … QUIZ SHOW" trượt tách ra (đèn marquee).
2. Mỗi câu: **"Question N / Get ready!"** → câu hỏi CHỮ TO sát đỉnh + **2–6 ô đáp án** (A/B/C/D…, viền
   bóng đèn vàng, nền tia sáng xanh navy). Đồng hồ đếm ngược góc trái + thanh bar; **✓ đếm câu đúng**
   góc phải.
3. Trả lời **đúng** → ✓ + điểm (theo tốc độ) · **sai** → ✗ (mất 1 Live nếu giới hạn) · **hết giờ** → bỏ qua.
4. **Sau mỗi N câu (mặc định 3) → VÒNG BONUS**: "BONUS ROUND" + 5 lá bài úp; chọn 1 → nhận thưởng
   (điểm / quyền trợ giúp). (Đã quan sát thật: 1 lá lật ra "+50 Points".)
5. **Lifelines**: 50:50 · x2 Score · Extra Time · Cheat.
6. Kết thúc: fanfare thắng (hết câu) / thua (hết Lives) → bảng tổng kết + leaderboard.

## Mô hình dữ liệu (content model — LẤY THẬT)

**Y HỆT QUIZ** (nhóm dữ liệu "A" trong `00-OVERVIEW.md`):
```json
{ "templateId": 69, "type": 11,
  "content": { "questions": [
    { "question": { "text": "…" },
      "answers": [ { "isCorrect": true, "text": "…" }, { "isCorrect": false, "text": "…" } ],
      "requiredNumberOfAnswers": 1 }
  ]}}
```
→ AWord dùng lại editor + shape của Quiz (`content.questions[].answers[{text,correct}]`).

## Options (đọc từ trang cấu hình)

| Option | Ý nghĩa |
|---|---|
| **Timer** | None / Count down m:s — **tính PER-QUESTION** (mỗi câu, KHÁC engine AWord vốn tính toàn ván) |
| **Lives** | Unlimited hoặc số |
| **Questions before a bonus round** | số câu giữa 2 vòng bonus (mặc định 3) |
| **Lifelines** | 4 ô tích: 50:50 · x2 Score · Extra Time · Cheat |
| **Random** | Shuffle question order · Shuffle answer order |
| **End of game** | Show answers |

## Âm thanh (map sự kiện → file, từ `themejson/gameshow/audios.json`)

Game QUIZ preload **47 file** (`themesound/gameshow/…`). Trường "Type" trong audios.json ghi rõ sự kiện:
Intro · GameshowQuizStart(mở cửa) · GameshowGetReady · GameshowQuizQuestionAppear · GameshowQuizChooseAnswer ·
Correct(chipminor×3) · Perfect(chipmajor×3) · Incorrect(chipfail×3) · PointsIncreasing/Decreasing(loop mp3) ·
ClockTick · TimesUp · GameshowBonusStart · TileAppear · GameshowBonusPick · GameshowBonusFlip(tileflip×4) ·
GameshowBonusMove×3 · GameshowQuizBonusReveal×5 · GameshowUseLifeline · GameshowQuiz5050 · GameshowQuizX2 ·
GameshowQuizExtraTime · GameshowQuizCheat · GameCompleted · GameOver · Leaderboard · RevealAnswers · Restart ·
Menu · MenuSubtle · Music(backgroundmusic). Chi tiết + tên file:
`AWord-data/Source/Sound effect/GAMESHOW/GHI CHU.md`.

## Đồ họa (từ `themeimage/1080p/gameshow/…`)

Khung sân khấu (backgroundsection, screenframewithfloorstrip, stagelight L/R, audienceheads) · nền câu hỏi
(bluestarbg, bluestar) · bảng điểm marquee (scoresign = khung viền BÓNG ĐÈN VÀNG) · cửa (introdoor L/R
"QUIZ SHOW", bonusdoor L/R) · dấu (correcttick, incorrectcross). Bảng màu (palette.json): bóng đèn
**#fff222**, hồng **#d60363**, xanh đúng **#00bc2c**, đỏ sai rgb(234,49,86). Chi tiết:
`AWord-data/Source/Graphic/GAMESHOW/GHI CHU.md`.

## Khác biệt so với Quiz (vì sao là template riêng, không phải "skin")

Vòng bonus · lifelines · điểm-theo-tốc-độ · lives · đếm-ngược-từng-câu — engine AWord chưa có sẵn, đều
do template tự dựng trong khung chơi (xem `templates/gameshow/`), + 1 nâng cấp core tương thích-ngược cho
điểm points (xem `GHI CHU GAMESHOW.md` mục 5).
