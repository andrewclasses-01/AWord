# 06 — CƠ CHẾ KẾT QUẢ + XẾP HẠNG (mấu chốt của AWord)

> Đây là phần QUAN TRỌNG NHẤT: cách Wordwall thu dữ liệu chơi của học sinh, chấm, xếp hạng.
> AWord PHẢI tái hiện luồng này (với backend riêng vì GitHub Pages tĩnh).

## 1. Hai kênh thu kết quả

### A. Leaderboard (bảng xếp hạng trong game — realtime, top 10)
- Nằm ngay dưới mỗi activity **scored**.
- Cột: **Rank | Name | Score | Time** (top 10).
- Mặc định **private**; bấm **Share** để công khai (ai chơi cũng lên bảng).
- Mỗi lượt chơi xong → người chơi nhập tên → điểm + thời gian đẩy lên bảng.
- Game **open-ended** (Open the box, Speaking cards...) KHÔNG có leaderboard.

### B. Assignment + My Results (giao bài, thu bài bản, có item-analysis)
Luồng đầy đủ cho lớp học ↓

## 2. Luồng Assignment (giao bài cho học sinh)

**Bước 1 — Giáo viên bấm "Set Assignment"** → dialog **Assignment setup**:
| Trường | Giá trị |
|---|---|
| **Results title** | Tên bộ kết quả (mặc định "Result NNNN for '...'") |
| **Registration** | **Enter name** (bắt nhập tên trước khi chơi) / **Anonymous** (không cần tên) / **Google Classroom** |
| **Deadline** | None / chọn giờ + ngày (DD/MM/YYYY) |
| **End of game** | Show answers · Leaderboard · Start again (cho chơi lại) |

**Bước 2 — Bấm "Start"** → "Assignment set / All done":
- **Link cho học sinh**: `https://wordwall.net/play/{resourceId}/{v}/{assignmentId}` + nút **Copy**.
- Chia sẻ: Pinterest · Facebook · **Google Classroom** · **Email** · **Embed** (`</>`) · **QR code**.
- "An entry has been added to **My Results**".

**Bước 3 — Học sinh** mở link → (nhập tên nếu Enter name) → chơi → khi xong, kết quả tự đẩy về assignment.

## 3. My Results (dashboard kết quả của giáo viên)

### Trang danh sách (`wordwall.net/myresults`)
- Tổ chức theo **thư mục** (vd thầy đang có: "1. CAC LOP CHINH" 244 kết quả, "2. KHOA NEN TANG TIENG ANH" 377, "3. KHOA NEN TANG HOA HOC" 40, "KIEM TRA DAU VAO" 8).
- Mỗi assignment hiện: tên, 👤 số học sinh đã nộp, ngày tạo, deadline.
- New folder · Recycle Bin · Search.

### Trang chi tiết 1 assignment (`wordwall.net/result/a/{id}`)
Thanh meta: ASSIGNMENT · loại game · ngày · deadline · 👤số · lọc **All / Best / First** · link play.

**Ba khối dữ liệu:**
1. **Summary** — tổng quan ("No students have finished..." khi trống).
2. **Results by student** — bảng xếp hạng:
   | Student | Correct | Incorrect | Time |
   - Sort by: **Submission / Name / Correct + Time** → *Correct+Time chính là tiêu chí xếp hạng*.
3. **Results by question** — phân tích câu hỏi (item analysis):
   | Question | Correct | Incorrect |
   - Mỗi câu mở rộng (▸) xem chi tiết ai đúng/sai.
   - Sort by Number / Correct / Incorrect.

**Bộ lọc lượt chơi**: **All** (mọi lượt) / **Best** (lượt tốt nhất mỗi HS) / **First** (lượt đầu) → xử lý HS chơi nhiều lần.

Ngoài ra: **Shareable results link** (chia sẻ bảng kết quả), **Open Activity**, **More**.

## 4. Mô hình dữ liệu kết quả cho AWord

```json
// 1 assignment
{
  "assignmentId": "690...",
  "activityId": "116283114",
  "activityType": "find_the_match",
  "title": "Result 1148 for 'Untitled2307'",
  "registration": "enter_name",   // enter_name | anonymous
  "deadline": null,
  "options": { "showAnswers": true, "leaderboard": false, "startAgain": true },
  "createdAt": "2026-07-16T22:59:00"
}

// 1 lượt nộp của học sinh
{
  "assignmentId": "690...",
  "studentName": "Trang Anh",
  "correct": 3,
  "incorrect": 1,
  "timeSeconds": 47,
  "perQuestion": [
    { "q": 0, "correct": true },
    { "q": 1, "correct": false }
  ],
  "submittedAt": "2026-07-16T23:05:12",
  "attempt": 1
}
```

Xếp hạng: sort theo `correct` DESC, rồi `timeSeconds` ASC (đúng như "Correct + Time").
Item analysis: group `perQuestion` theo câu, đếm correct/incorrect.

## 5. Kiến trúc gợi ý cho AWord (web tĩnh GitHub Pages)

GitHub Pages **không có backend** → cần dịch vụ lưu ngoài. 3 phương án:

| Phương án | Ưu | Nhược |
|---|---|---|
| **Firebase (Firestore/RTDB)** | Realtime leaderboard, miễn phí, dễ nhúng JS thuần, bảo mật bằng rules | Phụ thuộc Google, cần cấu hình rules |
| **Google Apps Script Web App → Sheets** | Hợp gu thầy (đang dùng Excel/Sheets), dữ liệu về thẳng Sheet | Không realtime mạnh, cần deploy script, giới hạn quota |
| **Supabase** | Postgres + API sẵn, realtime | Thêm 1 dịch vụ mới phải học |

**Luồng AWord tương ứng:**
1. Giáo viên tạo activity (JSON) → lưu (repo hoặc store).
2. Tạo **assignment**: sinh `assignmentId`, cấu hình registration/deadline → ra **link play + QR**.
3. Học sinh mở link → nhập tên → chơi (engine chấm client-side) → khi xong **POST kết quả** {name, correct, incorrect, time, perQuestion} lên store.
4. Dashboard giáo viên đọc store → **Results by student** (xếp hạng) + **Results by question** + **leaderboard realtime**.

**Lưu ý bảo mật/PII**: link play công khai ai có link cũng chơi được; tên HS tự nhập → cần chống spam/trùng tên; cân nhắc mã lớp.

## 6. Việc cần chốt khi bắt đầu code AWord
- Chọn backend lưu kết quả (Firebase / Apps Script+Sheets / Supabase).
- Chuẩn JSON activity + JSON result (mục 4).
- Danh sách template làm trước (đề xuất: Quiz → Anagram → Find the match → Type the answer → Open the box).
- Cờ `scorable` mỗi template (Open the box = false).
