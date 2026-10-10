# KIỂM TRA ĐẦU VÀO — BỘ ĐỀ LỚP 3–4 (Đợt 498, 10/10/2026)

Thầy giao 10/10/2026, "ok build" cùng ngày. Trang riêng `kiemtra2.html` + `kiemtra2.js` + `kiemtra2.css` (KHÔNG đụng `kiemtra.js` của bộ cũ).
Nhúng trong kiemtra.andrewclasses.com (bộ đề "B", 6 phần — `js/bai.js` BO_DE.B). Dashboard myLesson `js/ktdv-ql.js` BO_DE.B.

## 6 phần (act ở Courses / KIEM TRA DAU VAO / BO LOP 3-4, bài giao ở Results / KTDV)
| Phần | Bài giao | Kiểu | Câu | Giây/câu |
|---|---|---|---|---|
| P1 Chọn từ đúng (VI1) | x98bsj | quiz | 30 | 8 |
| P2 Gõ từ tiếng Anh (VI1) | xxdvu5 | type_the_answer | 30 | 15 / 20 (từ ≥ 6 chữ) |
| P3 A hay An (có hình) | g3wh9q | quiz | 20 | 6 |
| P4 Số ít, số nhiều (có hình) | p3xryn | type_the_answer | 20 | 15 |
| P5 Tạo câu | zwfvda | type_the_answer | 15 | 30–45 |
| P6 Trí nhớ nhanh (phim rồi Quiz) | ct632d | quiz | 10 | 10 |
Giờ theo tốc độ lớp NỀN TẢNG 4 (p90 bài về nhà lần đầu, đo 10/10/2026: Quiz VI1 5,2 s · TTA VI1 17,7 s · TTA ≈ 3,5 s + 0,6 s/chữ cái).

## Nội dung đọc từ act
`content.kiemTra = { bo, phan, loai, giay, de, dan[], viDu, thu[], phim? }` · Quiz: `questions[{question, answers[{text,correct}], hinh?, giay?}]` ·
TTA: `items[{prompt, acceptedAnswers, hinh?, so?, mot?, giay?}]`. Hình: `kiemtra2/hinh/<tên>.svg` (39 hình vẽ tay, 200×200).
Phim: `kiemtra2/phim/phim.js` (`taoPhim(container,{tu,onCanh,onXong})` ⇒ `{san,chay,dung,tiep,huy}`), 12 cảnh ~136 s, giọng thầy
(myVoice "kể chuyện" `0670723f`), Mom = giọng mô tả; nhạc "Wallpaper" Kevin MacLeod CC BY 4.0 (ghi công ở màn cuối). Thử: `kiemtra2/phim/thu.html`.
⛔ `ph.chay()` phải gọi NGAY trong cú bấm (tự đợi tải) — await trước đó ⇒ điện thoại chậm bị câm.

## Luật làm bài
Thanh giờ hiện cho em (cam khi còn 1/3) · hết giờ tự sang câu (TTA lấy chữ đang có) · không đúng/sai · không làm lại · không quay lại
câu trống · tải lại ⇒ đúng câu đó, mốc hết giờ theo giờ thật (localStorage `aword-kt2-<mã>-<ID>`) · phim: rời trang ⇒ tự dừng.
review[]: ms, giay, hetGio, chon (Quiz), hinh, roi/anMs/mat/matMs/dan/phim; review[0].kt: bo:'B', thuHet, hetGio, phim{ms,roi,anMs,taiLai,xong}, phienBan:3.

## Bàn thử
`scratch/kiemtra2-thu.html?g=thu&phan=1..6&n=Tên` (bài giả nhúng sẵn, không ghi kho; bài nộp ở `window.__KT_NOP`), launch `aword-dot498` 5498.
