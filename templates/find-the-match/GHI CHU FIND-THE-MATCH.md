# GHI CHÚ — TEMPLATE FIND THE MATCH

## TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT (24/7/2026)

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/05-FIND-THE-MATCH.md` (cách chơi, options, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `find-the-match.js` — module game, `type: "find_the_match"`, `scorable: true`.
   - `find-the-match.css` — giao diện riêng, mọi class prefix `.aw-ftm-`.
   - `sample-find-the-match.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/find-the-match/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Dữ liệu là các cặp {keyword ↔ definition}. Màn hình hiện 1 prompt + nhiều lựa chọn; chạm lựa chọn khớp thì cặp đó bị loại; lặp đến hết. Có lives + speed (đáp án trôi). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `find-the-match.js`/`.css`/`sample-find-the-match.js` tạo mới, `type: "find_the_match"` (khớp
  `core/catalog.js`).
- **KHÁC Quiz/Anagram ở chỗ**: đây KHÔNG phải màn "1 câu tại 1 thời điểm" — cả bàn cờ ở lại màn hình.
  1 KEYWORD làm prompt trên cùng + LƯỚI mọi DEFINITION còn lại bên dưới (đáp án đúng + toàn bộ definition
  của các cặp khác làm nhiễu, không giới hạn vài lựa chọn). Chạm đúng → tile mờ dần rồi bị XOÁ khỏi DOM
  (lưới tự dồn lại), prompt đổi sang cặp chưa giải kế tiếp. Vì vậy KHÔNG dùng nút ◁▷ (prev/next luôn
  `null`) — thanh "x of N" dùng để BÁO TIẾN ĐỘ (số cặp đã ghép/tổng) chứ không phải phân trang.
- Chạm SAI: tile rung nhẹ (KHÔNG đổi màu, đúng luật), không bị loại, thử lại được. Có **LIVES tuỳ chọn**
  (`options.lives`, số hoặc `null`=không giới hạn) — tự vẽ hàng ♥ trong `root` (engine không có API hiển
  thị lives); hết mạng → tự kết thúc game sớm (đã test 3 mạng, chạm sai 3 lần → Game Complete 0/8 đúng).
- **Điểm = số cặp đã ghép được tới cuối ván** (không phạt nếu ghép đúng sau vài lần chạm sai — đây là
  game "tìm kiếm", khác Quiz/Anagram "1 phát ăn ngay"). `review[]`: `yourText`/`correctText` đều là
  definition đúng khi đã ghép xong, `null` nếu chưa ghép (hết giờ/hết mạng/Submit sớm).
- Phím số 1-9 chọn theo THỨ TỰ Ô CÒN HIỆN TRÊN LƯỚI (không phải theo cặp cố định, vì lưới dồn lại liên
  tục sau mỗi lần ghép đúng).
- **Test qua `test.html` (browser thật)**: ghép đúng → tile biến mất + prompt đổi + điểm +1; ghép sai →
  rung, không biến mất; ghép hết 8/8 tự Game Complete đúng điểm/thời gian; Show answers hiện đủ 8 dòng;
  bật thử `lives:3`, chạm sai 3 lần → tự kết thúc 0/8 đúng như thiết kế (đã trả `lives` mẫu về `null`
  sau khi test xong). 0 lỗi console suốt quá trình. Grep `transform:.*translate|animation:` trong CSS —
  chỉ có `.aw-ftm-tile.is-shake` (rung translateX) trên phần tử định vị bằng LƯỚI (không phải transform
  căn giữa) nên KHÔNG dính bẫy mục 3.5 của CONG THUC MAU.md.
- Chưa làm: "Speed" (đáp án trôi/tự động biến mất theo thời gian, docs mục 3) — MVP dùng "Wait for
  answer" (đợi vô hạn) mặc định của Wordwall, chưa làm speed tăng dần; không phải bug, là phạm vi để
  ngỏ nếu thầy cần sau.

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — KHÔNG tự sửa core/)
