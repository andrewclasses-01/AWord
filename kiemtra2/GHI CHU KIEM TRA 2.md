# KIỂM TRA ĐẦU VÀO — BỘ ĐỀ LỚP 3–4 (Đợt 498, 10/10/2026)

Thầy giao 10/10/2026, "ok build" cùng ngày. Trang riêng `kiemtra2.html` + `kiemtra2.js` + `kiemtra2.css` (KHÔNG đụng `kiemtra.js` của bộ cũ).
Nhúng trong kiemtra.andrewclasses.com (bộ đề "B", 6 phần — `js/bai.js` BO_DE.B). Dashboard myLesson `js/ktdv-ql.js` BO_DE.B.

## 6 phần (act ở Courses / KIEM TRA DAU VAO / BO LOP 3-4, bài giao ở Results / KTDV)
| Phần | Bài giao | Kiểu | Câu | Giây/câu |
|---|---|---|---|---|
| P1 Chọn từ đúng (VI1) | x98bsj | quiz | 30 | 8 |
| P2 Gõ từ tiếng Anh (VI1) | xxdvu5 | type_the_answer | 30 | 15 / 20 (từ ≥ 6 chữ) |
| P3 A hay An (có hình) | g3wh9q | quiz | 30 (từ 11/10) | 7 |
| P4 Số ít, số nhiều (có hình) | p3xryn | type_the_answer | 30 (từ 11/10) | 15 |
| P5 Tạo câu | zwfvda | type_the_answer | 20 (từ 11/10) | 30–45 |
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

## ⭐ Đợt 510 (13/10/2026) — BỘ ĐỀ C (B1): 7 phần ngữ pháp + PHẦN NGHE (thầy "ok build" theo bản nháp v2)
Act ở Courses / KIEM TRA DAU VAO / BO B1 / BO 1 (`?f=561`, act #562–569), bài giao ở Results / KTDV:
| Phần | Mã bài giao | Kiểu | Số câu | Giây/câu |
|---|---|---|---|---|
| C1 Thì động từ | fqdmhq | type_the_answer | 25 | 20 |
| C2 Câu điều kiện | dyabv6 | type_the_answer | 10 | 20 |
| C3 Câu bị động | 6tu6ek | type_the_answer | 10 | 45 |
| C4 So/too/either/neither | kfxhr5 | type_the_answer | 10 | 20 |
| C5 Mệnh đề quan hệ | hrg835 | type_the_answer | 10 | 50 |
| C6 Câu tường thuật | qhrw3f | type_the_answer | 10 | 50 |
| C7 Dịch câu | x4mwdz | type_the_answer | 15 | 60 |
| C8 Nghe (PET 2) | egs7pp | quiz, `loai:'nghe'` | 25 (7+6+6+6) | 10–25 |
- Ngữ pháp: lấy từ đề giấy `A2 to B1 ENTRANCE.docx`; đáp án bung từ mẫu `{a|b}` / `[x]` (nguồn: scratchpad phiên 4731ce42 `b1/noidung-b1.js`). Chấm = `kiemtra-cham.js` như cũ.
- NGHE: `kiemTra.doan[]` (4 PART) · file `kiemtra2/nghe/p1..p4.mp3` (64 kbps mono: P1 = PET 2 Test 4 Part 1, P2 = Test 1 Part 2, P3/P4 = Test 3 Part 3/4 cắt từ LSB1-S2.T3.P3-4 tại 113,6/114,2 s) + 21 tranh `p1-<câu><A|B|C>.webp` (cắt từ PET 2.pdf).
  Mỗi PART: nút BẮT ĐẦU NGHE ⇒ nghe 2 lần (nghỉ 5 s, lần 2 tự phát) ⇒ 3 s ⇒ câu hỏi của PART đó. Không tua/dừng/nghe lại; trình duyệt tự dừng ⇒ nút NGHE TIẾP; tải lại ⇒ nghe tiếp từ chỗ cũ (`s.nghe[d].t`).
  Part 3 hiện PHIẾU TRỐNG trong lúc nghe (đề xuất trong bản nháp, thầy chưa phản đối). Ghi `review[0].kt.nghe{d:{lan,xong,roi,anMs,taiLai,ms}}`, mỗi hàng `doan`.
- `kt.bo` nay lấy từ act (trước ghi cứng "B"). Câu dài > 40 / > 70 ký tự chữ nhỏ dần (`k2-de-vua` / `k2-de-dai`).
- Bàn thử: `scratch/kiemtra3-thu.html?g=thu&phan=1..8&n=Tên[&nhanh=8]` (nhanh = phát nhanh 8 lần, CHỈ bàn thử) · launch `aword-dot510` cổng 5510.
