# 07 — KIẾN TRÚC AWord

> Bản thiết kế nền cho web game tiếng Anh **AWord** — deploy GitHub Pages, backend **Firebase**.
> Đọc kèm: `00-OVERVIEW.md` (mô hình dữ liệu) + `06-RESULTS-AND-RANKING.md` (cơ chế điểm).
> Trạng thái: bản thiết kế v0.1 — có vài mục cần thầy chốt (mục 12).

---

## 1. Tech stack (đề xuất)

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Host | **GitHub Pages** (repo tĩnh) | Miễn phí, thầy yêu cầu, không cần server |
| Ngôn ngữ | **HTML + CSS + JavaScript (ES Modules)** | Đơn giản, không cần build phức tạp, dễ Claude bảo trì |
| Build | **Vite** (tùy chọn, nên có) | Bundle Firebase SDK, dev server, tối ưu; vẫn xuất ra tĩnh cho Pages |
| Backend dữ liệu | **Firebase** — Firestore + Auth | Realtime leaderboard, lưu kết quả, miễn phí (Spark plan) |
| Auth giáo viên | **Firebase Auth (Google Sign-In)** | Thầy đăng nhập Google sẵn, chỉ giáo viên mới tạo/sửa |
| Auth học sinh | **Không cần / Anonymous** | HS chỉ mở link + nhập tên, giống Wordwall |

> **Firebase web config là công khai theo thiết kế** (apiKey chỉ định danh project, không phải bí mật). Bảo mật thật nằm ở **Firestore Security Rules** (mục 7.3), không phải giấu key.

---

## 2. Nguyên tắc thiết kế lõi (rút từ Wordwall)

1. **Tách 3 lớp**: `DATA` (nội dung JSON) ⟂ `ENGINE/RULES` (luật chơi từng template) ⟂ `THEME` (giao diện). Một bộ data chạy nhiều template; một template đổi nhiều theme.
2. **Template registry**: mỗi game là một module tuân theo cùng một *interface* (mục 5). Thêm game = thêm 1 module, không sửa lõi.
3. **Mô hình dữ liệu dùng chung**: chuẩn hóa về `{prompt, answer}` / `{question, answers[]}` / `{keyword, definition}` để **Switch template** như Wordwall.
4. **Cờ `scorable`**: game có điểm (Quiz, Anagram, Find the match, Type the answer) vs open-ended (Open the box). Chỉ game scorable mới thu kết quả + leaderboard.
5. **2 vai trò tách bạch**: Teacher app (tạo/sửa/giao bài/dashboard) và Student player (mở link chơi + nộp điểm).

---

## 3. Cấu trúc thư mục repo (đề xuất)

```
AWord/                       (repo GitHub)
├─ index.html                # trang chủ / vào Teacher app
├─ play.html                 # trang Student player (mở bằng link assignment)
├─ dashboard.html            # trang xem kết quả (Teacher)
├─ src/
│  ├─ core/
│  │  ├─ registry.js         # đăng ký template
│  │  ├─ engine.js           # vòng đời game chung (load data → render → chấm → kết thúc)
│  │  ├─ scoring.js          # tính điểm, thời gian, xếp hạng
│  │  └─ schema.js           # định nghĩa + validate JSON activity/result
│  ├─ templates/
│  │  ├─ quiz.js             # làm TRƯỚC (phủ nhiều game)
│  │  ├─ anagram.js
│  │  ├─ findthematch.js
│  │  ├─ typetheanswer.js
│  │  └─ openthebox.js
│  ├─ themes/
│  │  ├─ classic.css
│  │  └─ ...                 # mỗi theme 1 file, chỉ CSS/biến màu
│  ├─ teacher/
│  │  ├─ editor.js           # editor nhập nội dung (bảng như Wordwall)
│  │  ├─ assign.js           # tạo assignment → sinh link + QR
│  │  └─ dashboard.js        # Results by student + by question + leaderboard
│  ├─ student/
│  │  └─ player.js           # nhập tên → chơi → POST kết quả
│  └─ firebase/
│     ├─ config.js           # firebaseConfig (công khai)
│     └─ db.js               # hàm đọc/ghi Firestore
├─ assets/                   # ảnh, âm thanh, icon, thư viện QR
└─ docs/                     # tài liệu (thư mục hiện tại)
```

---

## 4. Chuẩn dữ liệu (JSON schema)

### 4.1 Activity (một hoạt động/game)
```json
{
  "id": "act_abc123",
  "schemaVersion": 1,
  "type": "quiz",                 // quiz | anagram | find_the_match | type_the_answer | open_the_box
  "title": "Unit 3 Vocabulary",
  "instruction": "",
  "theme": "classic",
  "options": { "timer": "countUp", "shuffleItems": true, "lives": null },
  "content": { /* tùy type — xem các file 01..05 */ },
  "ownerUid": "teacher-uid",
  "createdAt": 0, "updatedAt": 0
}
```
> `content` theo từng template đã mô hình hóa trong `01-ANAGRAM.md` … `05-FIND-THE-MATCH.md`.
> Chuẩn nội bộ nên quy về **`items[]`** với các trường chung `{prompt, answer, answers[], keyword, definition, image, audio}` để dễ Switch template.

### 4.2 Assignment (một lần giao bài)
```json
{
  "id": "asg_x1",
  "activityId": "act_abc123",
  "activityType": "quiz",
  "title": "Result 1 for Unit 3",
  "registration": "enter_name",   // enter_name | anonymous
  "deadline": null,
  "options": { "showAnswers": true, "leaderboard": true, "startAgain": true },
  "ownerUid": "teacher-uid",
  "createdAt": 0
}
```

### 4.3 Result (một lượt nộp của học sinh)
```json
{
  "assignmentId": "asg_x1",
  "studentName": "Trang Anh",
  "correct": 8, "incorrect": 2, "total": 10,
  "score": 8, "timeSeconds": 74,
  "perQuestion": [ { "q": 0, "correct": true }, { "q": 1, "correct": false } ],
  "attempt": 1,
  "submittedAt": 0
}
```

---

## 5. Engine + interface template

Mỗi template là 1 module export object theo interface chung:

```js
// src/templates/quiz.js
export default {
  type: "quiz",
  scorable: true,
  validate(content) { /* kiểm tra dữ liệu hợp lệ */ },
  mount(root, activity, callbacks) {
    // render UI vào `root`, gắn sự kiện
    // gọi callbacks.onProgress({correct, incorrect, perQuestion})
    // gọi callbacks.onFinish({correct, incorrect, timeSeconds, perQuestion})
  },
  unmount() {}
}
```

`engine.js` điều phối: nạp activity → chọn template từ `registry` → `mount` → nhận `onFinish` → nếu `scorable` thì đẩy `scoring.js` → ghi Firestore (nếu đang trong assignment).

**Switch template**: vì data chuẩn hóa, đổi `type` → engine dùng template khác đọc cùng `items[]`.

---

## 6. Luồng người dùng

**Giáo viên**
1. `index.html` → đăng nhập Google (Firebase Auth).
2. Editor: chọn template → nhập nội dung (bảng) → lưu Activity vào Firestore.
3. Assign: cấu hình registration/deadline → tạo Assignment → app sinh **link `play.html?a=asg_x1`** + **QR code** (thư viện QR client-side).
4. Dashboard: chọn assignment → xem Results by student (xếp hạng) + Results by question + leaderboard realtime.

**Học sinh**
1. Mở link `play.html?a=asg_x1` (hoặc quét QR).
2. Nhập tên (nếu enter_name).
3. Chơi (engine chấm client-side).
4. Kết thúc → POST Result lên Firestore → hiện điểm + leaderboard + (tùy) chơi lại.

---

## 7. Firebase

### 7.1 Collections (Firestore)
```
activities/{activityId}     ← giáo viên tạo/sửa; công khai đọc (để player nạp)
assignments/{assignmentId}  ← giáo viên tạo; công khai đọc (player cần)
results/{resultId}          ← học sinh tạo (create-only); chỉ giáo viên chủ đọc
```
> Leaderboard = query `results` theo `assignmentId`, sort `score desc, timeSeconds asc`, limit 10 (realtime bằng `onSnapshot`).

### 7.2 Auth
- Giáo viên: Firebase Auth **Google Sign-In**. `ownerUid` gắn vào activity/assignment.
- Học sinh: không đăng nhập (hoặc `signInAnonymously`) — chỉ được **tạo** result.

### 7.3 Security Rules (bản phác — CỰC KỲ quan trọng)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    match /activities/{id} {
      allow read: if true;                                  // player nạp được
      allow create, update, delete: if request.auth != null
        && request.auth.uid == request.resource.data.ownerUid;
    }

    match /assignments/{id} {
      allow read: if true;
      allow create, update, delete: if request.auth != null
        && request.auth.uid == request.resource.data.ownerUid;
    }

    match /results/{id} {
      allow create: if true;                                // HS nộp điểm (create-only)
      allow read: if request.auth != null;                  // chỉ GV đăng nhập đọc
      allow update, delete: if false;                       // không ai sửa/xóa điểm
    }
  }
}
```
> Sau nâng cấp: chặn spam bằng App Check / giới hạn field, validate schema trong rules.

---

## 8. Xếp hạng + Leaderboard
- **Điểm**: mặc định = số câu đúng (`correct`). Có thể thêm bonus thời gian.
- **Thứ hạng**: sort `correct DESC, timeSeconds ASC` (đúng "Correct + Time" của Wordwall).
- **Lọc lượt**: All / Best / First (khi 1 HS chơi nhiều lần) — xử lý ở dashboard bằng group theo `studentName`.
- **Realtime**: `onSnapshot` trên query results → leaderboard tự cập nhật khi có HS nộp.

---

## 9. Triển khai
- Repo public trên GitHub → bật **GitHub Pages** (branch `main`, thư mục gốc hoặc `/docs`... — sẽ chốt).
- Nếu dùng Vite: `npm run build` → deploy thư mục `dist` (dùng GitHub Actions hoặc branch `gh-pages`).
- Firebase: tạo project, bật Firestore + Auth (Google), dán `firebaseConfig` vào `src/firebase/config.js`, publish Security Rules.

---

## 10. Roadmap build (đề xuất theo phase)

| Phase | Nội dung | Kết quả |
|---|---|---|
| **P0** | Khởi tạo repo + Firebase project + Pages | Trang trống deploy được |
| **P1** | Engine + registry + template **QUIZ** + 1 theme + player chơi local (chưa lưu) | Chơi được Quiz offline |
| **P2** | Firebase: lưu Activity, tạo Assignment, link + QR, player POST Result | Giao bài + thu điểm |
| **P3** | Dashboard: Results by student + by question + leaderboard realtime | Xếp hạng hoàn chỉnh |
| **P4** | Thêm template: Anagram → Find the match → Type the answer → Open the box | Đủ 5 game thầy hay dùng |
| **P5** | Switch template, thêm theme, ảnh/âm thanh, Google Classroom, in ấn | Ngang Wordwall bản gọn |

---

## 11. Đối chiếu Wordwall ↔ AWord (checklist tính năng)
- [x] Pick template → Enter content → Play (3 bước)
- [x] Editor bảng nội dung (min/max item, thêm ảnh/âm thanh)
- [x] Options: timer, shuffle, lives, marking, show answers
- [x] Visual style (theme) tách rời
- [x] Switch template (cùng data)
- [x] Set Assignment → link + QR + share
- [x] Leaderboard realtime (game scored)
- [x] My Results: by student + by question + lọc All/Best/First
- [x] Cờ scorable (open-ended không điểm)

---

## 12. Quyết định (đã chốt 16/7/2026)
1. **Build tool: Vite** ✅ (dev server + bundle Firebase + hot-reload; build ra `dist` deploy Pages).
2. **Firebase project**: Claude sẽ **viết hướng dẫn tạo từng bước** khi tới P0 (tạo project mới cho AWord + bật Firestore/Auth Google + lấy config). ✅
3. **Vị trí code**: ngay trong `D:\APP AND DATA\PROJECT\AWord` (cùng chỗ docs).
4. Còn để mở (chốt khi tới P0): tên repo GitHub + tài khoản + public/private.

## 13. P0 sẽ làm gì (khi thầy nói "ok build")
- `npm create vite` trong `D:\APP AND DATA\PROJECT\AWord` (chọn vanilla + ES modules).
- Dựng khung thư mục `src/` theo mục 3, tạo `registry.js` + `engine.js` rỗng.
- 3 trang: `index.html` (teacher), `play.html` (student), `dashboard.html`.
- Viết `docs/08-FIREBASE-SETUP.md` — hướng dẫn thầy tạo Firebase project.
- Cài `firebase` qua npm, tạo `src/firebase/config.js` (chờ thầy dán config).
- Deploy thử trang trống lên GitHub Pages.
> Theo quy tắc: chờ thầy nói **"ok build"** mới bắt đầu code P0.
