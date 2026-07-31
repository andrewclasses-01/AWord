# GHI CHÚ — TRUE FALSE (True or false)

**Trạng thái: ✅ ĐÃ BUILD + gộp trang chủ (`built:true`), CHỜ THẦY DUYỆT.** (31/7/2026)

Game "True or false" (nội bộ Wordwall gọi là **"boolean"**) — cùng họ game "băng chuyền" với Find the
match. Một CÂU (statement) trượt từ mép trái vào giữa màn; học sinh bấm **True / False** để nói câu đó
đúng hay sai. Xây theo yêu cầu thầy: "phong cách + màu sắc của các template AWord khác, cách chơi giống
act Wordwall https://wordwall.net/resource/116827457/true-false".

## Cách chơi
- Câu trượt vào giữa theo cơ chế băng chuyền (dùng lại y hệt engine chuyển động của Find the match:
  `element.animate({transform:translateX})` trong `.aw-tf-track` overflow:hidden).
- **Speed slider (0–10)** trong panel Options: 0 = câu dừng ở giữa CHỜ trả lời (mặc định, đúng như act
  Wordwall khi chơi thường); >0 = câu tiếp tục trôi sang phải, trôi hết mà chưa trả lời = "timeout".
- 2 nút **True / False** cố định dưới vạch kẻ đứt — KHÔNG biến mất, mọi câu đều dùng chung 2 nút này.
- Trả lời đúng → +1 điểm + tiếng "correct" + ✓ bay lên. Sai → tiếng "incorrect" + ✗, **mất 1 tim** (nếu
  bật mạng). Sau đó câu trượt hết sang phải, câu kế trượt vào.
- **Mạng (tim ♥)**: `options.lives` (số, mặc định **5**); hết tim = Game Over. `null` = không có mạng
  (chơi tới khi hết câu / hết giờ). Panel Options có nút **bật/tắt** mạng (thầy chốt 31/7).
- **Unanswered questions** (chỉ có tác dụng khi Speed>0 hoặc trả lời sai): "Show once" = bỏ qua câu đó;
  "Repeat until answered" = xếp lại câu vào hàng đợi ở vị trí NGẪU NHIÊN để quay lại sau. Timeout KHÔNG
  mất tim (chỉ bấm sai mới mất) — giống Find the match.
- Timer: count-up có đếm ngược 3-2-1 trước câu đầu (kèm ting); count-down ting 1 lần/giây từ 10s, gấp
  đôi từ 5s — y hệt Find the match (kể cả giới hạn: đồng hồ engine chưa có hook để dừng lúc đếm 3-2-1).
- Bàn phím: **T / ←** = True, **F / →** = False. Mũi tên prev/next của engine bị ẩn (câu chỉ tiến, không
  lùi) qua `:has(> .aw-tf-card)` — không đụng core.

## Màu nút theo THEME (thầy chốt 31/7)
KHÔNG hard-code xanh/đỏ. Nút True = `var(--aw-ok)` / gờ tối `var(--aw-ok-d)`, False = `var(--aw-no)` /
`var(--aw-no-d)` — 3 biến này MỌI theme trong `core/themes/*` đều đã định nghĩa sẵn, nên mỗi theme tự có
tông riêng (đã đo bằng browser):
- Classic: True `#33a24a` (xanh lá) · False `#e23c3c` (đỏ)
- Classroom: True `#2f6b4f` (xanh ấm) · False `#b23a2a` (đỏ gạch)
- Beach: True `#17a37e` (xanh biển) · False `#e2593c` (đỏ san hô)
Nhờ vậy KHÔNG phải sửa `core/themes/*` (đúng luật số 1). Hình dạng ô (radius/border/shadow) cũng lấy từ
biến theme `--aw-tile-*`.

## Bộ file
- `true-false.js` — template (type `true_false`, scorable, `mount`, `toPrintItems`, `edit`,
  `buildExtraOptions` cho Speed + Lives + Unanswered). Prefix class CSS `.aw-tf-*`.
- `true-false.css` — style riêng (nút, băng chuyền, editor). Chỉ dùng `.aw-tf-*`, không đụng class engine.
- `tf-sound.js` — âm thanh thật Wordwall (bộ classic2, GIỐNG Find the match). File mp3 trong `sounds/`.
- `true-false-editor.js` — editor "Statement | True/False" (nút gạt 2 khúc mỗi dòng), dán Excel 2 cột
  (cột 1 = câu, cột 2 = TRUE/FALSE), kéo-thả sắp xếp, tối đa 40 câu (min 3).
- `sample-true-false.js` — dữ liệu mẫu (chủ đề "Plant life cycle", 8 câu).
- `test.html` / `test.js` — trang test riêng: `http://localhost:5510/templates/true-false/test.html`.

## Nguồn âm thanh
Tải trực tiếp từ CDN Wordwall (theme Classic, gói `classic2`) qua act mẫu, đổi .ogg→.mp3 bằng ffmpeg.
Bản gốc + GHI CHU: `D:\APP AND DATA\AWord-data\Source\Sound effect\TRUE FALSE`. True/False dùng ĐÚNG bộ
15 trạng thái như Find the match (cùng họ băng chuyền). Bản copy phẳng dùng trong app ở `./sounds/`
(mỗi template tự chứa, không import chéo). Chưa nối Menu/Leaderboard/RevealAnswers (engine chưa có hook).

## Đã kiểm (browser thật qua test.html, 31/7/2026)
- Màn READY + Play + đếm 3-2-1 OK.
- Trả lời đúng → điểm +1 + câu kế trượt vào; trả lời sai → mất 1 tim (đo DOM: tim cuối `is-lost`).
- 0 lỗi console.
- Màu True/False đổi đúng theo cả 3 theme (đo `getComputedStyle`).
- Mũi tên prev/next ẩn (`display:none`), card nằm đúng `.aw-playarea`.
- Game Complete panel (Score/Time/leaderboard) + **Show answers** hiện đúng câu + đáp án HS + đáp án đúng
  (`review[]` đúng hình dạng hợp đồng engine).

## Chưa làm / ĐỀ XUẤT SỬA CORE
- Chưa test trên play.html (trang HS) — giống Find the match/các template khác, play.js hiện chỉ import
  tĩnh `quiz.js`; engine chưa nạp template động theo `activity.type`. Nếu thầy muốn giao bài True/False
  cho HS chơi ở play.html thì cần thêm import vào play.js + link CSS vào play.html (hoặc để core nạp
  động — ĐỀ XUẤT SỬA CORE chung cho MỌI template ngoài quiz).
- Đồng hồ engine chưa dừng được lúc đếm 3-2-1 (giới hạn chung, đã có trong Find the match).
