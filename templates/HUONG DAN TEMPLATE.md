# HƯỚNG DẪN TEMPLATE — build song song nhiều game không xung đột

> Dành cho mọi session được giao build MỘT template cụ thể (Quiz, Anagram, Find the match...).
> Đọc file này + `../core/HUONG DAN CORE.md` TRƯỚC KHI viết code.

## Vì sao cấu trúc này tồn tại

Teacher Andrew có thể mở **nhiều session Claude cùng lúc**, mỗi session build một game khác nhau
(vd session A làm Anagram, session B làm Find the match, session C làm Type the answer). Để không
ai giẫm chân ai:

- Mỗi template có **1 thư mục riêng** trong `templates/<ten-template>/` — bạn chỉ tạo/sửa file
  TRONG thư mục được giao, không đụng thư mục template khác.
- Mọi template dùng chung `core/` nhưng **KHÔNG được sửa core/** (xem luật số 1 trong
  `../core/HUONG DAN CORE.md`).
- Mỗi template có **trang test riêng** (`test.html`) — chạy độc lập, không phụ thuộc các template
  khác, không đụng vào `index.html`/`main.js` ở gốc dự án (đó là trang gom cuối cùng, chỉ động vào
  khi Teacher Andrew đã CHỐT template).

## Quy trình build 1 template (từng bước)

1. **Xác định bạn được giao template nào.** Teacher Andrew sẽ nói rõ tên (vd "làm anagram").
2. Vào `templates/<ten-template>/`, đọc file `GHI CHU <TEN TEMPLATE>.md` — có sẵn: mô tả game,
   danh sách file cần tạo, trạng thái hiện tại.
3. Đọc tài liệu nghiên cứu tương ứng trong `../docs/0X-<TEN>.md` (đã nghiên cứu kỹ từ Wordwall thật:
   cách chơi, options, cấu trúc dữ liệu JSON đề xuất).
4. **Xem `templates/quiz/` làm mẫu chuẩn** (game đầu tiên đã hoàn chỉnh, thầy đã duyệt) — cấu trúc
   3 file `<ten>.js` / `<ten>.css` / `sample-<ten>.js` nên theo đúng khuôn này.
5. Tạo 3 file trong CHÍNH thư mục của bạn (không tạo ở nơi khác):
   - `<ten-template>.js` — module game, `registerTemplate({type, scorable, name, mount})`.
   - `<ten-template>.css` — style riêng, MỌI class phải có tiền tố `.aw-<ten-viet-tat>-`
     (vd Quiz dùng `aw-quiz-`, Find the match nên dùng `aw-ftm-`) để không đụng CSS của template khác
     khi sau này gộp chung vào 1 trang.
   - `sample-<ten-template>.js` — dữ liệu mẫu, luôn export đúng tên: `export const activity = {...}`.
6. Test bằng `test.html` **đã có sẵn** trong thư mục (không cần tạo, không cần sửa) — chỉ cần chạy
   server chung (xem mục "Chạy thử" bên dưới) rồi mở đúng đường dẫn của template mình.
7. Khi xong hoặc tạm dừng: **ghi lại vào `GHI CHU <TEN TEMPLATE>.md`** của chính template đó — nhật ký
   việc đã làm + đổi dòng TRẠNG THÁI ở đầu file.
8. Nếu cần một thứ mà core chưa hỗ trợ → viết vào mục "ĐỀ XUẤT SỬA CORE" trong file ghi chú của
   template đó, KHÔNG tự sửa `core/`.

## Trạng thái chuẩn (dùng thống nhất ở mọi GHI CHU <template>.md)

- 🔴 **CHƯA BUILD** — chỉ có khung test.html/test.js, chưa có file game thật.
- 🟡 **ĐANG BUILD** — đang viết dở trong phiên làm việc.
- 🟢 **CHỜ THẦY DUYỆT** — đã chơi thử được, đang chờ Teacher Andrew xem và góp ý.
- ✅ **ĐÃ CHỐT** — Teacher Andrew đã duyệt xong. Chỉ khi ở trạng thái này mới được thêm vào
  `../manifest.js` để xuất hiện trên trang gom cuối (`index.html`).

## Chạy thử (mỗi template độc lập)

Server chung phục vụ TOÀN BỘ thư mục dự án (không cần chạy riêng cho từng template):

```
python -m http.server 5510
```
(hoặc dùng cấu hình preview có sẵn tên `aword` — xem `../APP_MASTER.md` mục "Cách chạy").

Sau đó mỗi session mở đúng trang test của template mình, ví dụ:
- `http://localhost:5510/templates/quiz/test.html`
- `http://localhost:5510/templates/anagram/test.html`
- `http://localhost:5510/templates/find-the-match/test.html`

Nhiều template có thể mở test.html cùng lúc trên nhiều tab/session mà không ảnh hưởng nhau, vì mỗi
trang test chỉ nạp core + đúng 1 template.

## Khi nào một template được gộp vào trang cuối

Trang cuối (`index.html` + `main.js` + `manifest.js` ở gốc dự án) là nơi **gom các template đã
CHỐT** lại thành 1 web hoàn chỉnh. Việc này CHỈ làm khi:
1. Template đã ở trạng thái ✅ ĐÃ CHỐT (Teacher Andrew duyệt).
2. Thêm 1 dòng vào `../manifest.js` (theo mẫu comment sẵn trong file).
3. Thêm 1 dòng `<link rel="stylesheet" href="templates/<ten>/<ten>.css">` vào `index.html` gốc.

Không ai tự ý sửa `index.html`/`main.js`/`manifest.js` ở gốc khi đang build dở 1 template — việc gộp
trang cuối nên do 1 session phụ trách tổng thực hiện, tránh 2 session cùng sửa 1 file gây xung đột.
