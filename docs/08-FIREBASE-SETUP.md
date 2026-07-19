# 08 — FIREBASE (✅ ĐÃ LÀM XONG 19/7/2026)

> ## ✅ TRẠNG THÁI: XONG — thầy KHÔNG phải làm gì nữa
>
> Toàn bộ 6 bước dưới đây **đã được làm tự động qua Claude in Chrome** ngày 19/7/2026, trên tài
> khoản `namdaptrai01@gmail.com`. Giữ lại phần hướng dẫn bên dưới để tra cứu / làm lại nếu cần.
>
> | Mục | Giá trị thật |
> |---|---|
> | Project name | **AWord** |
> | Project ID | **aword-70dae** |
> | Project number | 399279049436 |
> | Gói | **Spark (miễn phí $0)** |
> | Firestore | Bật, **asia-southeast1 (Singapore)**, production mode |
> | Đăng nhập | **Google** bật, public name `AWord`, support email `namdaptrai01@gmail.com` |
> | Authorized domains | `localhost`, `andrewclasses-01.github.io`, + 2 domain mặc định |
> | Luật bảo vệ | **Đã Publish** (bản 19/7 22:05) |
> | Web app | `AWord Web` — config đã nằm trong `core/firebase.js` |
> | Google Analytics | TẮT (không cần, tránh theo dõi học sinh) |
>
> **ĐÃ KIỂM TRA THẬT trên web live** (https://andrewclasses-01.github.io/AWord/): người lạ
> KHÔNG đọc/ghi được thư viện · KHÔNG tạo được bài giao giả · học sinh ĐỌC được bài giao để chơi.
> Xem nhật ký `GHI CHU DU AN.md` v0.7.3.

---

> **Dành cho Teacher Andrew** — viết theo kiểu bấm-theo-từng-bước, không cần biết lập trình.
> Mục đích: để dữ liệu (thư mục, act, kết quả, assignment, bảng xếp hạng) **nằm trên mạng**,
> mở máy nào cũng thấy — thay vì nằm riêng trong từng máy như hiện nay.
>
> Web đã chạy tại: **https://andrewclasses-01.github.io/AWord/**
> Thầy làm xong các bước dưới thì **gửi lại cho em phần ở BƯỚC 5**, em nối nốt phần code.

---

## Tại sao cần bước này

Hiện tại thư viện của thầy được lưu **trong chính trình duyệt của từng máy**. Nghĩa là:

- Máy ở nhà tạo 10 act → ra trung tâm mở web sẽ thấy **trống trơn**.
- Xoá lịch sử trình duyệt → **mất hết**.

Firebase là "kho dữ liệu trên mạng" của Google (miễn phí ở mức chúng ta dùng). Nối vào rồi:

- Thầy đăng nhập Google ở bất kỳ máy nào → thấy đúng thư viện của mình.
- Học sinh mở link chơi → điểm bay thẳng về cho thầy xem, xếp hạng tự động.

**Miễn phí tới mức nào?** Gói Spark (free) cho 50.000 lượt đọc + 20.000 lượt ghi **mỗi ngày**.
Một trung tâm như của thầy dùng chưa tới 1% con số đó. Không cần nhập thẻ ngân hàng.

---

## BƯỚC 1 — Tạo project Firebase

1. Mở **https://console.firebase.google.com** → đăng nhập bằng **`namdaptrai01@gmail.com`**
   (thầy đã chốt dùng account này — cùng account với dự án mySpeaking).
   ⚠️ Nếu trình duyệt đang đăng nhập sẵn account khác thì nhớ **đổi account** trước, kẻo project
   bị tạo nhầm chỗ. Luật bảo vệ ở BƯỚC 6 đã ghi sẵn đúng email này.
2. Bấm **Create a project** (hoặc **Thêm dự án**).
3. Tên project: gõ **AWord** → **Continue**.
4. Màn hình "Google Analytics": **TẮT** nút gạt (không cần cho việc này) → **Create project**.
5. Chờ khoảng 30 giây → **Continue**.

---

## BƯỚC 2 — Bật kho dữ liệu (Firestore)

1. Menu trái → **Build** → **Firestore Database**.
2. Bấm **Create database**.
3. **Location** (chọn kỹ, KHÔNG đổi lại được): chọn **asia-southeast1 (Singapore)**
   — gần Việt Nam nhất nên chạy nhanh nhất.
4. Chọn **Start in production mode** (chế độ khoá — đúng ý ta, lát nữa mở đúng phần cần thiết).
5. Bấm **Create** → chờ khoảng 1 phút.

---

## BƯỚC 3 — Bật đăng nhập Google

1. Menu trái → **Build** → **Authentication** → bấm **Get started**.
2. Tab **Sign-in method** → trong danh sách bấm **Google**.
3. Gạt nút **Enable** sang bật.
4. **Project public-facing name**: để nguyên hoặc gõ `AWord`.
5. **Project support email**: chọn email của thầy trong danh sách xổ xuống.
6. Bấm **Save**.

---

## BƯỚC 4 — Cho phép web của thầy được đăng nhập

Nếu bỏ qua bước này, bấm đăng nhập trên web sẽ báo lỗi.

1. Vẫn ở **Authentication** → tab **Settings** → mục **Authorized domains**.
2. Bấm **Add domain**, gõ đúng dòng này rồi **Add**:

   ```
   andrewclasses-01.github.io
   ```

3. Kiểm tra trong danh sách đã có sẵn `localhost` (để em test ở máy). Nếu chưa có thì thêm luôn.

---

## BƯỚC 5 — Lấy "chìa khoá" gửi cho em ⭐

1. Bấm **biểu tượng bánh răng** (góc trên trái, cạnh chữ "Project Overview") → **Project settings**.
2. Kéo xuống cuối trang, mục **Your apps** → bấm biểu tượng **`</>`** (Web).
3. **App nickname**: gõ `AWord Web` → **KHÔNG** tích ô "Firebase Hosting" → bấm **Register app**.
4. Màn hình tiếp theo hiện một đoạn chữ giống hệt bên dưới. **Copy TOÀN BỘ đoạn đó gửi cho em**:

   ```js
   const firebaseConfig = {
     apiKey: "AIza........",
     authDomain: "aword-xxxxx.firebaseapp.com",
     projectId: "aword-xxxxx",
     storageBucket: "aword-xxxxx.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

> **Đoạn này KHÔNG phải mật khẩu** — Google thiết kế để công khai, nó chỉ là "địa chỉ" project.
> Ai chặn được người lạ? Là **luật bảo vệ ở BƯỚC 6**, không phải giấu đoạn chữ này.
> (Vì vậy dán nó vào code công khai trên GitHub là hoàn toàn bình thường và an toàn.)

---

## BƯỚC 6 — Dán luật bảo vệ (quan trọng nhất)

Đây là thứ chặn người lạ xoá thư viện của thầy.

1. Menu trái → **Build** → **Firestore Database** → tab **Rules**.
2. **Xoá sạch** nội dung đang có, **dán nguyên** đoạn dưới đây vào.
3. Bấm **Publish**.

✅ Email `namdaptrai01@gmail.com` đã điền sẵn — thầy **không phải sửa gì**, cứ dán rồi Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Ai là "thầy" — chỉ đúng 1 email này mới được tạo/sửa/xoá
    function isTeacher() {
      return request.auth != null
          && request.auth.token.email == 'namdaptrai01@gmail.com'
          && request.auth.token.email_verified == true;
    }

    // THƯ VIỆN của thầy (thư mục + act): RIÊNG TƯ, chỉ thầy đọc & ghi
    match /users/{uid}/items/{itemId} {
      allow read, write: if isTeacher() && request.auth.uid == uid;
    }

    // BÀI GIAO cho học sinh: ai có link cũng ĐỌC được (để chơi), chỉ thầy tạo/sửa
    match /assignments/{code} {
      allow read: if true;
      allow create, update, delete: if isTeacher();
    }

    // KẾT QUẢ học sinh nộp: chỉ được TẠO MỚI, không ai sửa/xoá được điểm
    match /results/{resultId} {
      allow read: if isTeacher();
      allow create: if request.resource.data.keys().hasOnly(
                        ['assignmentId','studentName','score','total','timeMs','review','createdAt'])
                    && request.resource.data.studentName is string
                    && request.resource.data.studentName.size() <= 40
                    && request.resource.data.score is int
                    && request.resource.data.total is int;
      allow update, delete: if false;
    }
  }
}
```

**Đoạn luật này nghĩa là gì (tiếng Việt):**

| Ai | Làm được gì |
|---|---|
| **Thầy** (đăng nhập đúng email trên) | Toàn quyền: tạo/sửa/xoá thư mục, act, bài giao; xem mọi kết quả |
| **Học sinh** (không đăng nhập) | Chỉ mở được bài giao qua link + nộp điểm 1 lần. **Không** xem được thư viện, **không** sửa/xoá được gì, **không** xem được điểm bạn khác |
| **Người lạ** | Không làm được gì cả |

---

## BƯỚC 7 — Bảng xếp hạng cần 1 "chỉ mục"

Firestore cần chỉ mục để sắp xếp bảng xếp hạng (điểm cao trước, nhanh hơn thắng).

Bước này **em làm được sau**, thầy chưa cần đụng. Khi chạy lần đầu Firestore sẽ tự hiện một
đường link trong màn hình lỗi — bấm vào là nó tự tạo. Em sẽ hướng dẫn lúc đó.

---

## Xong rồi thì gửi em

Gửi lại em **1 thứ duy nhất**: đoạn `firebaseConfig` ở **BƯỚC 5**.

(Email đã chốt là `namdaptrai01@gmail.com`, em điền sẵn trong luật rồi.)

Em sẽ nối vào code, giữ nguyên giao diện thầy đang dùng — chỉ khác là dữ liệu chạy lên mạng.

---

## Cách dữ liệu sẽ được sắp xếp (em ghi để nhớ, thầy không cần đọc)

```
users/{uid}/items/{itemId}    ← thư viện riêng của thầy: folder + act
                                 (đúng hình dạng node của core/store.js hiện nay:
                                  kind, root, parentId, trashed, title/name, content...)

assignments/{code}            ← bài giao cho HS. CÔNG KHAI đọc.
                                 Chứa BẢN SAO act tại thời điểm giao (snapshot) nên
                                 thư viện của thầy KHÔNG bị lộ, và sửa act sau này
                                 không làm sai lệch bài HS đang làm dở.

results/{resultId}            ← mỗi lượt HS nộp 1 doc: assignmentId, studentName,
                                 score, total, timeMs, review, createdAt
```

**Vì sao tách `assignments` ra khỏi thư viện?** Để thư viện của thầy luôn riêng tư — HS chỉ
nhìn thấy đúng bài được giao, không thấy gì khác. Đây cũng là cách Wordwall làm.

**Đổi code chỗ nào?** Chỉ thay *ruột* của `core/store.js` (từ localStorage → Firestore).
Mọi nơi gọi nó (`main.js`, editor, engine) **không phải sửa** vì store.js đã viết sẵn kiểu
async từ đầu — xem `APP_MASTER.md` mục 4.
