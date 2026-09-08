# GHI CHÚ — TEMPLATE TYPE THE ANSWER

## Đợt 310 (08/9/2026, thầy giao) — ⭐⭐⭐ **NẠP BẢNG TRA THẬT CHO LESSON 15 TỪ CÂU SAI CỦA HỌC SINH 3 KHOÁ (NTK6/7/8)**

Thầy: *"[3 link myresults Wordwall Lesson 15 của NTK6/NTK7/NTK8] Hãy lấy các câu sai ở các thư mục
trên để đưa vào các act trong lesson của AWord nhé."*

### Lấy dữ liệu — bóc từng trang kết quả Wordwall

6 trang kết quả (BT1 + BT2 × 3 khoá), kỹ thuật giống skill `checkkhoanentang`
(`tr.details-toggle` + `.js-detail-row-<hs>-<câu>` + đọc `.fa-xmark` để biết câu nào sai). Bấm
**All** (không chỉ Best) + bấm hết **Show more** để lấy TRỌN mọi lượt làm, không chỉ lượt tốt nhất.

⛔⛔ **BẪY GIỜ MỚI GẶP — RENDER TRỄ SAU KHI "SHOW MORE" ĐÃ ẨN.** Nút Show more biến mất
(`display:none`) đúng lúc yêu cầu tải trang cuối đã gửi đi, nhưng **bảng DOM chưa kịp chèn nốt các
hàng cuối** — đo ngay lúc đó ra `tr[class*="details-toggle"]` = 0 hoặc chỉ một phần (30/76 hàng),
trong khi đợi thêm vài giây rồi đo LẠI (không làm gì thêm, không click gì nữa) thì đủ hàng. 5/6 trang
đợt này đều dính bẫy ở lần đọc đầu; sửa bằng cách **tách hẳn thành lệnh JS thứ hai** sau một khoảng
chờ, không cố nhồi hết vào một lệnh `await Promise` dài — độ trễ thật sự nằm NGOÀI vòng đời của cú
gọi JS đó (khớp với `Bẫy: đo layout quá sớm` đã ghi trong trí nhớ, phiên bản mạng thay vì font).

⚠️ Có buổi bấm **Best → All** qua LABEL (không phải bấm thẳng input) buộc trang render lại đúng —
bấm lại `#filter_all` khi nó đã `checked=true` sẵn thì không kích hoạt lại việc tải dữ liệu.

### Lọc rác — bỏ chuỗi gõ-phím-bừa

Nhiều lượt là học sinh gõ lung tung (`"gc"`, `"r"`, `"ych"`, hoặc cả tràng phím bấm ngẫu nhiên dài
hàng trăm ký tự) — không phải câu trả lời thật. Bài Lesson 15 luôn có dạng "động từ **to** động từ"
hoặc "**not** …", nên luật lọc: **giữ dòng chỉ khi chuỗi có từ độc lập "to" hoặc "not"**. Lọc được
~90% rác mà không mất câu thật nào (đã soi tay).

### ⛔⛔ VÁ SAI LẦN ĐẦU — THUẬT TOÁN CHÍNH TẢ TỰ CHẾ SO SÁNH SAI TỪ ĐIỂN

Bản đầu tự đoán "đây là lỗi chính tả" bằng cách so từ em gõ với MỘT DANH SÁCH ĐỘNG TỪ CHUNG của cả
bài (`want, need, like, try, come,…`) qua khoảng cách Levenshtein. Hậu quả: **"want" bị chấm là lỗi
chính tả của "wait"** (lệch đúng 1 chữ cái) dù đây là **hai động từ khác nghĩa hoàn toàn** — 18/35
dòng của BT1 dính lỗi này. Bài học: KHÔNG so với một từ điển chung, phải so với **đúng đáp án của
CHÍNH câu đó**.

**Sửa đúng**: gọi thẳng `tta.bestMatch(go, acceptedAnswers)` — **chính hàm đang chạy trong game**
(Đợt 305/308) — để lấy vết so khớp thật (`sub`/`missing`/`extra`), rồi mới suy luận câu hướng dẫn từ
vết đó. ⭐ Không viết lại thuật toán so khớp lần hai — gọi thẳng module thật qua trình duyệt, tránh
hẳn nguy cơ bản Python và bản JS lệch nhau.

⚠️ Sau khi sửa vẫn còn một cụm từ sai: câu chữ cứng "**Động từ** '{tu}' chưa đúng nghĩa" — đúng với
BT1 (mỗi câu chỉ là một cụm động từ ngắn) nhưng **sai ngữ pháp với BT2** (dịch CẢ CÂU dài): ví dụ
`"he want to drive my car"` so với đáp án `"My brother wants to drive my car"` thì `bestMatch` canh
`sub=["he","My"]` — **chủ ngữ, không phải động từ** — câu cũ sẽ nói oan "Động từ 'he' chưa đúng
nghĩa". Bỏ hẳn chữ "Động từ" khỏi câu, dùng cách nói trung tính "Chữ '{tu}' chưa đúng…" cho an toàn
với cả hai dạng bài.

### Soạn câu hướng dẫn — 6 luật theo thứ tự ưu tiên (từ vết so khớp thật)

1. Thiếu "not" (đổi hẳn nghĩa khẳng định↔phủ định) — ưu tiên cao nhất.
2. Thừa ≥3 từ (viết cả câu thay vì đúng phần đề hỏi).
3. Có cặp thay thế (`sub`): **gần giống** (Levenshtein ≤2, từ dài ≥4 chữ) → "sai chính tả"; **khác
   hẳn** → "chưa đúng, xem lại nghĩa câu" (không gọi tên loại từ).
4. Thiếu "to" (thiếu chữ nối cụm động từ kết hợp).
5. Thiếu từ khác (not/to) — nói chung chung.
6. Thừa 1–2 từ.

⛔ Ba dòng có xoay vòng câu chữ (không lặp y hệt một mẫu) trong mỗi nhóm — đúng lời thầy dặn ở Đợt
305 "không phải lúc nào cũng nhá".

### Kiểm không rò rỉ đáp án (lại theo luật cũ của Đợt 305)

Quét tự động: so mỗi câu hướng dẫn với các từ CÒN THIẾU trong đáp án đúng gần nhất. Ra 4 "rò rỉ" —
soát tay cả 4: 3 câu chỉ nói "not" (từ chức năng đóng, đúng ngoại lệ đã chốt — dạy luật ngữ pháp,
không phải mách từ vựng) và 1 câu là chính chữ học sinh đã gõ (`"book'"` ↔ `"book"`, khác biệt chỉ
là dấu nháy — không phải rò rỉ thật). **0 rò rỉ thật.**

### Kết quả — đã ghi thẳng vào 2 act thật của Lesson 15

| Act | Số dòng bảng tra |
|---|---|
| `BT1. XAC DINH CUM DONG TU KET HOP TRONG CAU` (num 183) | **35 dòng** |
| `BT2. TAO CAU CO NHIEU DONG TU KET HOP` (num 184) | **87 dòng** |

Nguồn: 63 câu sai thật (sau lọc rác) gộp từ 3 khoá — **không dựng bài mẫu, không đoán**, mọi dòng đều
là chữ một học sinh thật đã gõ.

### Đường ghi dữ liệu (giống Đợt 306, thêm một bước GỌI HÀM THẬT giữa đường)

1. Chrome thật của thầy → `core/store.js` đọc `items` của 2 act.
2. Gửi `{đề, chữ_em_gõ, đáp_án}` lên **chính kho AWord** (`tools/…json`, xoá sau khi xong).
3. Trang AWord `fetch` file đó, **gọi thẳng `tta.bestMatch()`** để lấy vết so khớp thật.
4. Gửi kết quả phân tích VỀ máy qua `<form method=POST>` tới cầu nối `localhost` (form POST không bị
   luật mixed-content HTTPS→localhost chặn như `fetch`).
5. Python soạn câu hướng dẫn từ vết so khớp, đóng gói `content.goiY`, đẩy lại lên kho.
6. Trang AWord đọc gói đó, `saveActivity()` vào đúng 2 act, đọc lại lần nữa để đối chiếu.

### Đo thật
- Đọc lại từ Firestore sau khi ghi: BT1 35 dòng, BT2 87 dòng — khớp.
- Gọi trực tiếp `goiYTheoBang(act, item, "wants to drive")` trên act thật → đúng câu "Chữ 'wants' em
  viết sai chính tả rồi đấy nhé." — đúng thiết kế Đợt 309 (một bảng, khoá theo đề).

### VIỆC ĐANG CHỜ
- ⬜ Thầy mở Edit 2 act Lesson 15 trên live, xem qua bảng — câu nào chưa ưng thì sửa thẳng.
- ⬜ Còn 30 lesson khác của khoá nền tảng chưa có bảng tra nào — làm khi thầy có link kết quả tương
  tự cho lesson đó.

## Đợt 309 (08/9/2026, thầy giao) — ⭐⭐ **BẢNG TRA GỘP VỀ MỘT NÚT + POP-UP 4 CỘT CHO CẢ ACT**

Thầy: *"Hiện tôi đang thấy mỗi câu có 1 nút Hướng dẫn khi sai riêng. Liệu có thể gom hết vào 1 nút duy
nhất, bấm vào đó thì mở 1 pop-up lớn có 3 cột … Khi học sinh làm thì sẽ tự động scan khớp câu … có
được không và có nên không?"*

**Trả lời: nên.** Lỗi của học sinh phần lớn **lặp lại qua nhiều câu** — nhìn 8 lỗi thật của khoá NTK6
thì `foolball`, `finh`, `lisiten` gặp ở câu nào cũng được. Soạn lẻ từng câu là gõ lại một nội dung 30
lần.

### ⚠️ NHƯNG PHẢI CÓ CỘT THỨ TƯ — ĐỪNG BỎ

Một dòng dùng chung có thể **khớp nhầm câu**. Ca thật ngay trong Lesson 15: câu 1 đáp án là **want** to
play, câu 11 là **need** to use — dòng chung *"chứa `want` → đề hỏi CẦN"* đúng cho câu 11 nhưng **bậy
cho câu 1**. Nên bảng có **4 cột**: `Áp dụng cho` · `Kiểu khớp` · `Chữ học sinh gõ` · `Câu hướng dẫn`.
Mặc định `Áp dụng cho` = **Mọi câu** (đúng ý thầy), khoá vào một câu chỉ khi cần.

⭐ Một thứ che bớt rủi ro sẵn có: **hướng dẫn chỉ chạy khi câu ĐÃ bị chấm sai**, nên dòng "chứa want"
không bao giờ nhảy ra lúc em viết đúng `want to play`.

⭐⭐ **ĐÈN CẢNH BÁO** — thứ chặn đúng rủi ro còn lại: nếu một dòng khớp trúng **ĐÁP ÁN ĐÚNG** của câu
nào đó, ô đó hiện ngay *"⚠ khớp cả ĐÁP ÁN ĐÚNG của câu 1"*. Thầy sửa tại chỗ, không phải đợi học sinh
phát hiện.

### Đã làm

- **`type-the-answer.js`**: `goiYTheoBang(activity, it, typed)` — đọc `activity.content.goiY` (bảng của
  cả act). ⚠️ **Vẫn đọc `it.goiY` TRƯỚC** (bảng lẻ của Đợt 308) nên act nào lỡ lưu kiểu cũ vẫn chạy
  đúng, không phải di trú kho.
- Dòng khoá câu **neo bằng ĐỀ BÀI** (`de`), không phải số thứ tự — thầy xoá/chèn/đảo câu thì số thứ tự
  lệch hết, đề thì không. Đề bị sửa thì ô chọn giữ nguyên và hiện *"⚠ câu đã đổi đề"*, không âm thầm
  tụt về "Mọi câu".
- **`type-the-answer-editor.js`**: bỏ nút lẻ từng câu, thay bằng **một nút ở thanh trên cùng** (đếm số
  dòng, xanh lá khi đã soạn) mở **pop-up 4 cột** (dùng nền `.aw-modal*` sẵn có của core). Nút **⤓ Lấy
  câu sai thật của học sinh** nay **khoá sẵn dòng vào đúng câu em sai** — máy biết em sai ở câu nào.
- **Di trú tự động**: mở act kiểu Đợt 308 thì bảng lẻ được gom vào bảng chung kèm khoá câu, và khoá
  `goiY` trong từng câu bị xoá lúc Save. Đo thật: 1 dòng lẻ → 1 dòng chung có `de` đúng, `items` sạch.

### ⛔⛔ HAI THỨ ĐÃ CẮN TRONG ĐỢT NÀY

1. **BẪY TDZ, LẦN THỨ HAI** (lần đầu ở Đợt 305). `let nutBangTra` khai ở giữa file, mà
   `buildBulkBar()` chạy ĐỒNG BỘ lúc dựng trang lại gán vào nó ⇒ `ReferenceError: Cannot access
   'nutBangTra' before initialization`, ném ra từ giữa lúc dựng nên **nửa sau của màn soạn im lặng
   không hiện ra**. ⇒ Luật: biến mà hàm-chạy-lúc-dựng có đụng tới thì khai NGAY ĐẦU, trên mọi lời gọi.
2. **THAY MỘT KHỐI THEO MỐC ĐẦU–CUỐI ĐÃ NUỐT MẤT MỘT HÀM**. Đợt 308 chèn khối ⚙ vào giữa
   `questionCard()` và `answerRow()`; đợt này thay "từ khối ⚙ tới mục save" nên **xoá luôn
   `answerRow()`** — màn soạn chết ngay khi dựng câu đầu tiên (`answerRow is not defined`).
   ⇒ **Phép kiểm rẻ mà chắc, nên làm mỗi lần thay khối lớn**:
   `for f in $(git show HEAD:<file> | grep -o "^  function [a-zA-Z]*"); do grep -q ... || echo MAT; done`
   — so danh sách hàm của bản mới với bản trong kho, hàm nào biến mất mà không cố ý thì hiện ra ngay.

### ⚠️ Và một lần nữa: ẢNH CHỤP BÀN THỬ NÓI DỐI

Ảnh chụp pop-up trông **trong suốt**, chữ trang phía sau xuyên qua. Đo thật thì: overlay
`position:fixed; inset:0; z-index:300`, nền modal `rgb(255,255,255)`, `opacity:1`, và
`document.elementFromPoint()` ở giữa modal trả về **phần tử BÊN TRONG modal**. Tức là pop-up đục và
nằm trên thật — pane của phiên tự động không vẽ lớp phủ `position:fixed`, đúng cái bẫy đã ghi.
⛔ Đừng "sửa" CSS theo ảnh chụp.

### Đo thật — `scratch/dot308-bangtra.html` (đã cập nhật cho bảng gộp)

| Phép đo | Kết quả |
|---|---|
| 8 phép thử hàm dò | **8/8 ĐẠT**: dòng "Mọi câu" ăn ở câu 1 **và** ở câu khác · bỏ hoa-thường + dấu cách thừa · khớp Y HỆT · **dòng khoá câu chỉ ăn đúng câu đó và KHÔNG ăn ở câu khác** · ngoài bảng thì im · gõ rỗng thì im |
| Nút + pop-up | nhãn "⚙ Hướng dẫn khi sai — 3 dòng"; **0 nút lẻ còn sót** trong các thẻ câu; pop-up hiện đúng 3 dòng, cột Áp dụng cho đọc ra "Mọi câu" / "Câu 3 — Tôi cần dùng cái…" |
| Đèn cảnh báo | thêm dòng *chứa `want to play`* → hiện ngay **"⚠ khớp cả ĐÁP ÁN ĐÚNG của câu 1"** |
| Đóng + Save | nhãn nút cập nhật thành "4 dòng"; dữ liệu lưu đủ 4 dòng đúng `de`/`kieu`/`go`/`noi`; **không câu nào còn khoá `goiY` lẻ** |
| Di trú act kiểu cũ | 1 dòng lẻ → gom vào bảng chung, `de` = đề của chính câu đó |
| Lỗi | `window.__errs` rỗng ở lượt cuối · `node --input-type=module --check` sạch cả 2 file |

### VIỆC ĐANG CHỜ
- ⬜ Thầy mở Edit một act Type the answer trên live, bấm nút ⚙ và soạn thử vài dòng.
- ⬜ Nút **⤓ Lấy câu sai thật** vẫn chưa có nguyên liệu: chưa act Type the answer nào từng được giao bài.

## Đợt 308 (08/9/2026, thầy giao) — ⭐⭐⭐ **GỠ HẲN GỢI Ý TỰ ĐỘNG, THAY BẰNG BẢNG TRA CỦA THẦY (nút ⚙ trong Edit)**

### Vì sao gỡ — thầy bắt tại trận

Thầy chơi `BT1. XAC DINH CUM DONG TU KET HOP` (Lesson 15) và chụp 4 màn hình: bài này **đề là cả câu
tiếng Việt nhưng đáp án chỉ là CỤM ĐỘNG TỪ** ("Chúng tôi cố gắng nấu ăn" → `try to cook`). Em viết cả
câu `we are trying to cook`, máy đi bình luận **đuôi -ing của chữ "trying"** — tức là ngầm xác nhận
phần còn lại đúng, trong khi cái sai thật là **viết sai phạm vi**.

Chạy lại 4 ca đó trên chính hàm đang chạy:

| Em gõ | Đáp án | Máy đếm | Máy nói |
|---|---|---|---|
| we are **trying** to cook | try to cook | thừa 2, sai dạng 1 | *"trying sai sai nha, xem lại đang dùng thì gì"* |
| he **asks** to eat my pizza | ask to eat | thừa 3, sai dạng 1 | *"asks đang thừa cái gì đó ở cuối"* |
| she **wants** to bring my bag | want to bring | thừa 3, sai dạng 1 | *"wants đang thừa cái gì đó ở cuối"* |

**Gốc rễ**: luật cấp-từ (sai dạng · thêm/bớt s · chính tả · giới từ · bộ sáu) xét TRƯỚC và không hề
kiểm xem cả câu có lệch khung không; còn luật "thừa/thiếu từ" thì chỉ chạy khi KHÔNG có chữ nào sai
dạng — đúng lúc cần nhất thì nó im. ⚠️ Đo cả khoá: **19/52 bài là dạng "trích một phần"**
(TÌM/XÁC ĐỊNH trạng từ · động từ · cụm động từ · tính từ sở hữu…), nên đây là lỗi hệ thống.

### Thầy chốt hướng đi

Thầy: *"Tôi muốn thêm một nút cài đặt đặc biệt trong edit của từng act type the answer, trong đây ta
có thể chỉnh được với mỗi câu sai như thế nào thì câu hướng dẫn sẽ là gì … trường hợp nào lệch ra
ngoài phạm vi thì chỉ việc báo sai, tô đỏ (không kèm hướng dẫn) vẫn sẽ chấp nhận được."*

Em đã báo con số trước khi làm: trong 8 lỗi THẬT của khoá cũ thì 5 lỗi luật tự động nói đúng, nên bỏ
hẳn là mất lưới đỡ khi bảng tra còn trống. Hỏi lại, thầy chốt **"Bỏ hẳn — chỉ bảng tra của tôi"**.
⛔ **PHIÊN SAU ĐỪNG THÔNG MINH HOÁ LẠI.** Không có bảng tra thì im lặng, đúng ý thầy.

### Đã làm

**`type-the-answer.js`** — xoá `HINTS` (18 nhóm/50 câu của Đợt 305–306) và toàn bộ `hintFor` +
`sayHint` + `stemOf`/`isSOf`/`isIngOf`/`isEdOf`/`charDistance` + các bảng từ (ARTICLES, BE_FORMS,
AUX_FORMS, bộ sáu, FREQ_ADVERBS, PREPOSITIONS). **GIỮ NGUYÊN** phần tô 2 màu + vạch đỏ chỗ thiếu
(`bestMatch`/`alignWords`) — thầy chỉ bỏ phần ĐOÁN, không bỏ phần tô màu.
Thay bằng `goiYTheoBang(it, typed)`: dò `items[i].goiY` theo thứ tự, khớp trước thì dùng.

**Hình dạng dữ liệu** (nằm ngay trong từng câu của act):
```js
items[i].goiY = [ { go: "want to play foolball", kieu: "yhet" | "chua", noi: "…" }, … ]
```
⚠️ So bằng **chính `normalize()` của phép chấm điểm** (bỏ hoa-thường, bỏ dấu, gom khoảng trắng) — một
dòng bắt được cả `Want To Play Foolball` lẫn `want  to play foolball`, thầy khỏi gõ lại từng dấu cách.

**`type-the-answer-editor.js`** — nút **⚙ Hướng dẫn khi sai** dưới mỗi câu; nút xanh lá + đếm số dòng
nếu câu đó đã có bảng, nên nhìn là biết câu nào đã soạn. Mỗi dòng: `[gõ ĐÚNG Y HỆT / gõ có CHỨA]` +
chuỗi + câu hướng dẫn + nút ×. Kèm nút **⤓ Lấy câu sai thật của học sinh**: đọc mọi bài đã giao của
act (`listAssignmentsForAct` → `listResults`), gom những câu HS gõ SAI đúng ở câu này, xếp theo số lượt
và nạp sẵn vào bảng để thầy chỉ việc viết lời hướng dẫn.

⛔⛔ **BẪY SUÝT MẤT DỮ LIỆU**: `normalize()` của editor dựng lại từng câu từ số 0 (`{prompt,
acceptedAnswers}`), nên trường mới **phải được chép tay sang đó** — quên là `goiY` bay sạch ngay lần
Save đầu tiên, không báo gì cả. Đã chép + lọc rác lúc Save (bỏ dòng thiếu chuỗi hoặc thiếu lời).

### Nguyên liệu có sẵn — đã đo kho Wordwall khoá cũ

Thầy đưa link kết quả NTK6 Lesson 15. Bóc được thật (kỹ thuật lấy `tr.details-toggle` +
`.js-detail-row-<hs>-<câu>` như skill `checkkhoanentang`), nhưng **mỏng**: BT1 **47 lượt làm → 8 câu
sai**; BT2 **16 lượt → 1 câu sai**. Lý do: chính yêu cầu "đúng 100% mới nộp" khiến Wordwall chỉ giữ
lượt gần như hoàn hảo. 8 câu sai đó vẫn đáng giá (foolball · finh · like to song · want carry
backpack…) và ⭐ **không có ca nào là "viết cả câu"** — kiểu sai thầy gặp trên AWord là thói quen của
lứa mới. AWord thì lưu MỌI lượt nên kho sẽ dày nhanh hơn Wordwall.

### Đo thật — `scratch/dot308-bangtra.html` (dùng chính câu + chính lỗi thật của HS khoá NTK6)

| Phép đo | Kết quả |
|---|---|
| 8 phép thử hàm dò bảng | **8/8 ĐẠT**: khớp y hệt · khớp bất kể HOA/thường và dấu cách thừa · khớp CHỨA · dòng trên thắng dòng dưới · ngoài bảng thì IM LẶNG · câu không có bảng thì im · gõ rỗng thì im |
| Ván thật, gõ `want to play foolball` | hiện đúng câu của thầy + tô màu `want/to/play` xanh, `foolball` đỏ |
| Ván thật, câu KHÔNG có bảng, gõ `hunny` | **không một chữ hướng dẫn**, chỉ viền đỏ + hiện đáp án đúng |
| Editor | nút hiện "⚙ Hướng dẫn khi sai — 2 dòng / 1 dòng / (trống)"; thêm dòng → Save → dữ liệu lưu đủ 3 dòng đúng kiểu; câu không có bảng thì **không đẻ khoá `goiY` rỗng** |
| Lỗi | `window.__errs` rỗng · `node --input-type=module --check` sạch cả 2 file |

### VIỆC ĐANG CHỜ
- ⬜ Thầy mở Edit một act Type the answer trên live, thử nút ⚙ và soạn vài dòng.
- ⬜ Nút **⤓ Lấy câu sai thật** hiện chưa có gì để lấy: **chưa act Type the answer nào từng được giao
  bài** (đã quét: 30 bài giao, 0 bài TTA). Giao vài buổi là có nguyên liệu.
- ⬜ 8 câu sai thật của khoá NTK6 (Lesson 15 BT1) đang nằm trong ghi chú này — thầy muốn thì em nhập
  thẳng vào bảng tra của act đó.

## Đợt 307 (08/9/2026, thầy giao) — **THÊM Ô TÍCH "AUTO NEXT QUESTION", MẶC ĐỊNH TẮT** (lật lại quyết định 3/8/2026)

Thầy: *"options của type the answer cần có thêm tích «Auto next question» nữa. Mặc định là tắt."*

### ⚠️ Đây là LẬT LẠI một quyết định cũ — đã hỏi thầy trước khi build

Ngày **3/8/2026 (Đợt 55)** chính thầy chốt cho riêng game này: *auto-advance LUÔN chạy sau khi chấm
xong 1 câu, KHÔNG phụ thuộc ô tích nữa* — nên ô tích đã bị gỡ hẳn khỏi game này. Nay thầy chốt ngược.
Trước khi code em đã báo hậu quả và thầy chọn **"Đúng vậy — tắt hết, ok build"**:
**mọi act cũ, gồm 52 bài Type the answer của khoá NỀN TẢNG, từ nay KHÔNG tự chuyển câu nữa** cho tới
khi thầy tự bật từng bài. ⛔ Phiên sau đừng "sửa lại cho khớp ghi chú Đợt 55".

### Đã làm — chỉ `type-the-answer.js`, KHÔNG đụng core

- Khai `usesAutoSwitch: true`. Core **đã có sẵn** đúng ô tích này (`core/options-panel.js`, nhãn
  **"Auto next question"**, trường `options.autoSwitch`, **mặc định TẮT**, mã `autoNext`) — bật cho
  game nào khai dùng nó (Quiz · Anagram · Unjumble · Crossword đang dùng). Không phải viết ô tích mới.
- `autoNext()` đọc `opt.autoSwitch` **bằng HÀM, không phải hằng số chụp lúc mount**: panel Options sửa
  thẳng `activity.options` của ván đang chơi, chụp một lần thì thầy bật/tắt giữa ván sẽ không ăn.
- Rào **hai** chỗ tự chuyển câu: `submitAnswer()` và `roundTimeUp()` (hết giờ một câu). Câu hết giờ vẫn
  bị chấm SAI và khoá lại như cũ, chỉ khác là nằm yên chờ bấm Next.
- ⚠️ **KHÔNG rào hai nhánh KẾT THÚC** (`finish("complete")` khi mọi câu đã trả lời, và
  `finish("gameover")` khi hết tim). Game này CỐ Ý không có nút "xong/✓" ở câu cuối; rào nốt thì em
  làm hết bài xong ngồi đó, không có đường kết thúc ngoài Menu ▸ Submit answers.
- Fight mode không đổi một ly: nhánh `if (fightCtl) … return;` nằm TRƯỚC khối tự chuyển câu — trong
  trận vẫn do trọng tài đẩy cả hai bàn cùng lúc.
- Ô tích **không có trong `checkOrder`** nên tự xuống cuối khối công tắc (đúng luật Đợt 213b).

### Đo thật — `scratch/dot307-autonext.html` (3 câu, bàn thử mở game thật qua engine)

| Phép đo | Kết quả |
|---|---|
| Bảng Options | 5 ô tích: Shuffle questions · Show corrects · Show answers at end · **Auto next question (BỎ TRỐNG)** · Allow skip |
| Tắt (mặc định): trả lời câu 1, chờ 3 giây | **VẪN Ở CÂU 1**, ô nhập đã khoá, nút Next bấm được |
| Bật (`?auto=1`): trả lời câu 1, chờ 2 giây | tự sang **câu 2**, ô nhập mở lại — đúng nếp cũ |
| Tắt: làm hết 3 câu bằng tay | vẫn ra **"GAME COMPLETE"**, không bị kẹt |
| Lỗi | `window.__errs` rỗng cả 3 lượt · `node --input-type=module --check` sạch |

### VIỆC ĐANG CHỜ
- ⬜ Thầy mở một act Type the answer trên live: ô tích mới nằm ở bảng Options, mặc định tắt.
- ⬜ Nếu thầy muốn 52 bài của khoá nền tảng tự chuyển câu trở lại thì bật ô tích cho từng bài — hoặc
  bảo em ghi một lượt vào dữ liệu như đợt rà soát 306.

## Đợt 305 (08/9/2026, thầy giao) — ⭐⭐⭐ MÀN CHƠI: TÔ 2 MÀU TỪNG TỪ KHI TRẢ LỜI SAI + DÒNG GỢI Ý CHẠY OFFLINE — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

Thầy: *"khi chơi và submit 1 đáp án, nếu câu trả lời dài hơn 1 từ thì hiện màu xanh các từ đúng, hiện
màu đỏ các từ sai. Tôi làm vậy để trong trường hợp answer là cả câu dài, học sinh sẽ biết mình sai ở từ
nào trong câu. Nghiên cứu cả việc kết hợp AI online hoặc công cụ check câu nào đó để hiển thị gợi ý khi
sai cho học sinh."* — sau báo cáo nghiên cứu, thầy chốt qua AskUserQuestion: **2 màu** (xanh/đỏ) và
**gợi ý chạy offline**, ⛔ **KHÔNG dùng AI online**.

### Vì sao không AI online (chốt để đợt sau khỏi nghiên cứu lại)
| Hướng | Vì sao loại |
|---|---|
| Gọi thẳng AI từ trình duyệt | Khoá API nằm trong file web ai cũng đọc được, mà `play.html` **không bắt đăng nhập** ⇒ bất kỳ ai cũng xài chùa tới cạn tiền. |
| Máy chủ trung gian (Firebase Function) | Làm được, nhưng là **hạ tầng mới chưa từng có** trong dự án, tốn tiền theo lượt (1 lớp 30 em × 20 câu = 600 lượt/buổi), phải viết thêm chặn lạm dụng, và **chậm 0,5–3s** giữa ván đang tính giờ. |
| LanguageTool | Bản miễn phí ~20 lượt/phút/**IP** — cả lớp chung một wifi là chung một IP. Và nó **không biết đáp án của thầy** nên gợi ý lạc đề. |
| Model chạy trong trình duyệt | Đúng nếp nhà (app đã có Kokoro TTS, eSpeak, wav2vec2 240MB ở `core/speech-score.js`) nhưng model sửa câu nặng 300MB–1GB+, máy/iPad của HS không kham nổi. |

### Đã làm — `type-the-answer.js`

**Hàm thuần (ngoài `mount`, bàn thử gọi thẳng được):** `wordsOf` · `normWord` · `alignWords` ·
`charDistance` · `stemOf` · `bestMatch` · `hintFor`.
- `alignWords` = Levenshtein **có vết**, cùng khuôn `levenshteinAlign()` của `core/speech-score.js`
  (nơi nó so từng ÂM để chấm phát âm) — ở đây so từng TỪ, ra 4 loại: match · sub · extra · missing.
  ⚠️ CHƯA gom vào core vì luật cấm tự sửa core khi đang làm template; template thứ hai cần thì xuất
  hàm của `speech-score` ra dùng chung, **đừng đẻ bản thứ ba**.
- `normWord` mượn chính `normalize()` của phép chấm (bỏ hoa-thường + bỏ dấu) rồi bỏ dấu câu hai đầu —
  không thì dấu chấm cuối câu làm từ cuối **hiện đỏ oan**.
- `bestMatch` chọn **đáp án gần nhất** trong `acceptedAnswers[]`, không phải cái đầu tiên: em viết theo
  mẫu đáp án phụ mà so với mẫu chính thì cả câu đỏ.

**Trên màn hình:** lớp `.aw-tta-diff` vẽ lại chính câu em gõ bằng `<span>` màu, **đè đúng lên ô nhập**,
chữ ô thật thành trong suốt (`.is-diffed`). ⛔ Bên trong một `<textarea>` **không tô màu từng chữ được**
— đó là giới hạn của trình duyệt, không phải chuyện viết khéo hơn. Ô thật vẫn nằm nguyên trong bố cục
nên `blockEdges`/`autoGrow`/`flyMark` không đổi một ly. ⚠️ Lớp phủ phải ăn **y hệt** cỡ chữ/lề/viền/
`line-height` của ô nhập, lệch một thứ là ngắt dòng khác chỗ (đo thật: hai hộp trùng khít 910×140).

**Dòng gợi ý** `.aw-tta-hint` nằm **TRONG `revealWrap`** (dưới dòng đáp án đúng) — mọi phép căn giữa
của game đo cụm từ mép trên `revealWrap`, đặt ngoài là đè bàn phím. Thứ tự luật: sai thứ tự → thiếu
hẳn một viên gạch (be / trợ động từ / từ xác định) → sai bộ sáu → sai dạng từ → sai chính tả →
đếm từ thiếu/thừa.
⛔ **Gợi ý không được lộ đáp án**: mọi câu chỉ nhắc lại CHÍNH CHỮ EM GÕ hoặc nói số lượng/thứ tự. Bàn
thử có hẳn một phép quét tự động bắt rò rỉ (ngoại lệ duy nhất: câu mạo từ in cả ba "a / an / the" như
một thực đơn đóng).

### ⭐⭐⭐ BA THỨ BÀN THỬ BẮT ĐƯỢC (không phải suy đoán)

1. **BẪY TDZ — cắn thật.** `let lastDiffShown` thoạt đầu khai cạnh `showWordDiff()` ở dưới, mà
   `loadQuestion(0)` chạy **đồng bộ** lúc mount ⇒ `ReferenceError: Cannot access 'lastDiffShown' before
   initialization`, ném ra từ giữa `loadQuestion` nên nửa sau của việc dựng màn **im lặng không chạy**.
   Đúng cái bẫy `core/HUONG DAN CORE.md` đã ghi. Chuyển lên khai cùng chỗ các biến trạng thái.
2. **Thứ tự luật gợi ý sai.** "student" ↔ "students" lệch 1 chữ cái nên luật CHÍNH TẢ trúng trước và
   mắng em sai chính tả, trong khi em viết đúng từ chỉ sai DẠNG. Đảo: xét dạng từ TRƯỚC chính tả.
3. **Điện thoại hết chỗ — đo A/B mới thấy.** Viewport 375×812, câu trả lời 2 dòng + đang hiện đáp án 2
   dòng: khoảng trống giữa câu hỏi và bàn phím chỉ **98px** mà cụm đáp án đã cần **~102px** — tức **đã
   kín TRƯỚC KHI** có gợi ý (đo bản không gợi ý: cụm chạm câu hỏi 1px). Thêm dòng gợi ý ~18px vào thì
   phép căn giữa (vốn ưu tiên không đè bàn phím) đẩy cụm lên và **đè 18px vào câu hỏi**. Sửa bằng
   `dropHintIfNoRoom()`: đo ở mốc 800ms (hoạt cảnh mở đã xong, trước lúc tự chuyển câu 2600ms), còn chỗ
   thì giữ, hết chỗ thì **bỏ dòng gợi ý** — lúc đó đáp án đúng đang hiện ngay trên màn, giá trị hơn.
   Đo lại sau khi vá: điện thoại về đúng 1px như bản gốc, máy tính vẫn giữ gợi ý.

### Cái khác đã lo
- ⛔ **Fight**: lúc nộp trong trận `applyGradeVisuals` KHÔNG chạy (Đợt 170) nên màu không lộ sớm; thêm
  tầng chắn thứ hai trong CSS — `.aw-fight-board.is-concealed` che cả `.aw-tta-diff`, hai lớp `w-ok`/
  `w-bad` và dòng gợi ý. ⚠️ Luật che cũ (Đợt 217) đặt `color:transparent` ở khối cha, mà mấy `<span>`
  này khai màu RIÊNG nên **không thừa hưởng** — phải gọi tên thẳng, đo được đủ 4 thứ về trong suốt.
- Bấm **Back** xem lại câu sai thì màu + gợi ý hiện lại y như lúc nộp (`showWordDiff` gọi trong
  `loadQuestion`).
- Câu **ĐÚNG** không tô (đã có viền xanh + dấu ✓). Câu **một từ** không tô (đúng lời thầy) nhưng vẫn có
  gợi ý chính tả. Câu **hết giờ** (không gõ gì) không tô.
- Thời gian chờ trước khi tự chuyển câu: có màu/gợi ý để đọc thì cũng 2600ms như khi hiện đáp án, kể cả
  lúc thầy tắt "Show corrects".
- Cỡ chữ gợi ý có **sàn 12px** — `--tta-input-fs` đã chạm sàn 16px trên điện thoại, nhân 0,55 nữa ra
  ~9px thì vô dụng đúng trên cái máy hay dùng nhất.

### Bàn thử
`scratch/dot305-worddiff.html` — **PHẦN A 16/16 ĐẠT**: gọi THẲNG hàm thật của template (import module,
không chép logic sang bàn thử) cho 7 ca tô màu + 8 ca gợi ý + 1 phép quét rò rỉ đáp án. **PHẦN B** chạy
ván THẬT qua `core/engine.js`: bấm Play → gõ → Enter → đo DOM.
⚠️ Bàn thử có **bộ đếm lỗi riêng của trang** (`window.__errs`) vì khung đọc console của phiên tự động
**giữ lại lỗi của các lần tải trước** — suýt kết luận nhầm là bản vá TDZ chưa ăn.

| Phép đo (1280×900 nếu không ghi khác) | Kết quả |
|---|---|
| Câu sai 1 từ | 10 từ: 9 xanh `rgb(16,185,129)`, "student" đỏ `rgb(239,68,68)` có gạch chân |
| Lớp phủ vs ô thật | hộp trùng khít `[178,277,910,140]`, cùng `46.41px/62.65/7.378` |
| Chữ ô thật | `rgba(0,0,0,0)` (trong suốt) |
| Gợi ý | "Thiếu mất be rồi nhá — nhớ cho thầy: be + động từ đuôi -ing." |
| Bố cục | không đè bàn phím (cách 3px), không đè câu hỏi (1px) |
| Câu đúng | 0 từ tô màu, chữ ô về màu thường, không gợi ý |
| Câu một từ | 0 từ tô màu, vẫn có gợi ý chính tả |
| Back về câu sai | màu + gợi ý hiện lại đủ |
| 375×812 | gợi ý tự bỏ, màu vẫn còn, hết đè câu hỏi |
| Fight che bài | cả 4 thứ về `rgba(0,0,0,0)` |
| Lỗi | `window.__errs` rỗng ở mọi lượt · `node --input-type=module --check` sạch |

### ⭐⭐⭐ VÒNG 2 — GỢI Ý VIẾT BẰNG TIẾNG VIỆT, THEO HỆ THỐNG GỌI TÊN CỦA CHÍNH THẦY

Thầy xem bản tiếng Anh rồi chốt lại: *"Các hướng dẫn-gợi ý cần sử dụng tiếng Việt và sử dụng phong
cách, kiến thức, giọng văn của tôi · Các câu cần hướng dẫn chủ yếu là dạng dịch Việt sang Anh · Hãy
nghiên cứu các sub bài giảng … và các bài tập … để lấy kiến thức, style, vibe, giọng văn của tôi ·
Template Type the answer kèm hướng dẫn này chủ yếu phục vụ cho course - khóa nền tảng tiếng Anh."*

**Đã đọc để lấy nguyên liệu:** 31 file bài giảng `E:\1. BAI GIANG SACH NEN TANG\ALL BAI GIANG TEXT\`
(TAP 1–31, ~1,4 MB chữ) + 36 file bài tập `D:\11. KHOA NEN TANG TIENG ANH\RECOVERY WORDWALL\`
(LESSON 0–32).

⛔⛔ **ĐẾM THẬT trên 31 bài giảng — thầy gọi tên KHÁC sách giáo khoa, gợi ý phải theo THẦY:**

| Thầy nói | Số lần | Chỗ khác hay gọi |
|---|---|---|
| **"từ xác định"** (a / an / the) | 4 | "mạo từ" — thầy chỉ dùng đúng **1** lần trong cả khoá |
| **"động từ thường"** | 231 | (giống) |
| **"câu có động từ" / "câu không có động từ"** | 40 / 9 | câu thường / câu dùng to-be |
| **"câu nói có" / "câu nói không"** | 151 / 94 | câu khẳng định / phủ định |
| **"bộ sáu"** | 90 | đại từ nhân xưng |
| **"chủ ngữ / tân ngữ tương đồng"** | 9 / 10 | đại từ chủ ngữ / tân ngữ |
| **"trạng từ tần suất" · "đuôi ing" · "thêm s"** | 8 · 16 · 54 | — |

Giọng: kết câu bằng **"nhá / nhé / đấy"**, hay nói **"nhớ cho thầy"**. Dạng bài chính của khoá là
**DỊCH VIỆT → ANH** — câu mẫu lấy thẳng từ file bài tập thật ("Mẹ tôi đang làm một chiếc bánh" →
"My mother is making a cake", L27 BT3; "Nam thấy tôi" → "Nam sees me", L13 BT4).

**9 luật gợi ý** (xếp theo thứ tự ưu tiên, chỉ hiện MỘT câu):

| Ca | Câu gợi ý |
|---|---|
| Đủ từ, sai thứ tự | *Đủ từ rồi đấy, chỉ là xếp chưa đúng thứ tự thôi nhá.* |
| Thiếu `be`, câu có đuôi -ing | *Thiếu mất be rồi nhá — nhớ cho thầy: be + động từ đuôi -ing.* |
| Thiếu `be`, câu không có động từ | *Câu này không có động từ thường, thiếu mất be (am / is / are) nhá.* |
| Thiếu trợ động từ | *Thiếu trợ động từ rồi nhá (do / does / did).* |
| Thiếu từ xác định | *Thiếu từ xác định rồi nhá — a / an / the.* |
| Bộ sáu (I ↔ me) | *Chỗ “I” là bên BỊ tác động — dùng tân ngữ tương đồng nhá.* |
| Sai dạng | *Chữ “make” phải ở dạng đuôi -ing nhá.* · *… phải ở dạng quá khứ nhá.* · *… còn thiếu s ở cuối nhá.* · *… đang thừa s ở cuối rồi đấy.* |
| Sai chính tả | *Gần đúng rồi! Xem lại chính tả chữ “makking” nhá.* |
| Thiếu / thừa từ | *Còn thiếu một từ nữa nhá, đọc lại câu tiếng Việt xem đủ ý chưa.* · *Thừa một từ rồi đấy nhá.* |

⚠️ Luật nhận dạng đuôi có tính cả **gấp đôi phụ âm · bỏ e · y→i** (`isSOf`/`isIngOf`/`isEdOf`) đúng
như thầy dạy ở bài số nhiều, đuôi -ing và quá khứ đơn.

⛔ **Rào "gần đúng"** — bàn thử bắt được: gõ đại một chữ ("banana") cho câu "I have a car" thì trong
vệt so khớp CÓ một từ "a" bị thiếu, máy hồn nhiên mách *"thiếu từ xác định"* — vô nghĩa với em đang
lạc đề hoàn toàn. Nay 3 luật "thiếu viên gạch" chỉ chạy khi em đã dựng được **ít nhất nửa câu**.

⛔ **Luật chống lộ đáp án nới đúng một chỗ**: nhóm từ **CHỨC NĂNG ĐÓNG** (a/an/the · be · do/does/did)
được gọi tên đầy đủ vì đó là **dạy luật của khoá**, không phải mách đáp án; **từ nội dung** thì tuyệt
đối không. Bàn thử có phép quét tự động canh đúng ranh giới này.

### ⭐⭐ VÒNG 3 — KHO CÂU NHIỀU BIẾN THỂ + 2 LUẬT MỚI + VẠCH ĐỎ CHỖ THIẾU TỪ

Thầy: *"Không phải lúc nào cũng «nhá»"* và chọn thêm cả 3 việc (trạng từ tần suất · giới từ · dấu chỗ
trống màu đỏ). Thầy cũng yêu cầu **xem trước 50 câu** rồi tự sửa lời văn.

**1. Kho câu `HINTS`** — 20 nhóm, mỗi nhóm 1–4 câu, máy **bốc ngẫu nhiên** nên chơi lâu không nhàm và
đuôi câu không lặp lại một kiểu. `hintFor(m, pick)` nhận thêm tham số bốc câu để **bàn thử chạy tất
định** (luôn lấy câu đầu). ⛔ `HINTS` là **chữ của thầy** — phiên sau đừng "viết lại cho hay"; bản nháp
em soạn để thầy sửa nằm ở `GOI Y - 50 CAU (THAY SUA).md` cùng thư mục.
⭐ Bàn thử **so với CHÍNH kho câu** (`HINTS[k][0]`) chứ không chép chữ sang bàn thử ⇒ thầy sửa lời văn
thì bàn thử vẫn xanh, chỉ khi LUẬT bắn sai nhóm mới TRƯỢT.

**2. Luật mới — TRẠNG TỪ TẦN SUẤT ĐẶT SAI CHỖ** (Lesson 24). Dấu hiệu: **cùng một trạng từ vừa bị tính
là THỪA ở chỗ này vừa bị tính là THIẾU ở chỗ kia** ⇒ em có viết nó, chỉ đặt nhầm chỗ. ⚠️ Phải xét
**TRƯỚC** luật "sai thứ tự" chung: khi chỉ mỗi trạng từ đi lạc thì luật chung cũng trúng, mà nó chỉ nói
chung chung trong khi ở đây gọi đúng tên được bài 24.

**3. Luật mới — SAI GIỚI TỪ** (Lesson 25): hai bên đều nằm trong danh sách giới từ. ⚠️ Xét **trước**
luật chính tả — "in" ↔ "on" lệch đúng 1 chữ cái.

**4. Vạch đỏ chỗ thiếu từ** (`.aw-tta-w-gap`). Trước đó từ thiếu không vẽ gì, nên câu chỉ sai vì THIẾU
một từ thì **mọi chữ trên màn đều xanh mà vẫn báo sai** — em không hiểu hỏng ở đâu. Vẫn đúng "2 màu"
thầy chốt vì vạch cũng màu đỏ.
⚠️⚠️ Vạch làm dòng chữ **dài ra so với chữ thật trong ô**, nên lớp phủ có thể cần thêm một dòng mà ô
thật thì không ⇒ tràn ra đè bàn phím. `fitDiffHeight()` cho ô cao lên theo, và **phải dùng `min-height`
chứ không `height`**: `fitLayout()` gọi `autoGrow()` vốn gán thẳng `height` theo nội dung THẬT của ô
(đang trong suốt, ngắn hơn) — đặt `height` ở đây thì lần fit kế tiếp xoá sạch.

**Đo lại sau vòng 3** (bàn thử **26/26 ĐẠT**, có cả 2 luật mới; phép quét rò rỉ nay quét **mọi biến
thể** của mỗi nhóm chứ không chỉ câu đầu): ván thật máy tính 1280 — 1 vạch đỏ đúng chỗ thiếu `is`,
màu vạch `rgb(239,68,68)`, không đè bàn phím (41px), không đè câu hỏi. Điện thoại 375 — vẫn 1 vạch,
gợi ý vẫn giữ, cách bàn phím 3px, chạm câu hỏi 1px. `window.__errs` rỗng cả hai lượt.

### ⭐⭐⭐ VÒNG 4 — 50 CÂU THẦY ĐÃ SỬA, CHÉP Y NGUYÊN VÀO GAME

Thầy sửa xong cả 50 câu và gửi lại (08/9). Đã chép **y nguyên từng chữ** vào `HINTS`, không sửa lại
một dấu phẩy. Ba thay đổi về CẤU TRÚC mà lời văn của thầy kéo theo:

1. **Xưng “em” xuyên suốt** — thầy thêm vào gần hết các câu.
2. **Nhóm 7–11 cố ý NÓI MƠ HỒ ĐI**: *“còn thiếu thiếu gì đó”* · *“đang thừa cái gì đó ở cuối”* ·
   *“sai sai nha, em hãy xem lại đang dùng thì gì”* · *“Em nhìn xem “{tu}” nên ở dạng gì”*. Bản nháp
   của em nói thẳng "thiếu s" / "phải dạng quá khứ"; thầy đổi thành **gợi mở để em tự nghĩ**.
   ⛔ **ĐỪNG “sửa lại cho rõ ràng”** ở phiên sau — mơ hồ ở đây là CỐ Ý, đúng cách dạy của thầy.
3. **Bỏ hẳn con số** ("Còn thiếu từ em nhé" chứ không "thiếu 2 từ") ⇒ hai nhóm một-từ / nhiều-từ
   **gộp lại làm một** (`thieuTu` · `thuaTu`). Kho còn **18 nhóm / 50 câu**. `{n}` không còn chỗ nào
   dùng, `sayHint` vẫn đỡ được phòng khi thầy muốn nói số trở lại.

**Đo lại với chính chữ của thầy:** bàn thử **26/26 ĐẠT**. Câu dài nhất **81 ký tự**
(nhóm `thieuBe` câu 1) — đo trên **điện thoại 375×812 ván thật**: xuống **2 dòng**, VẪN GIỮ được
(không bị `dropHintIfNoRoom` cắt), cách bàn phím 3px, chạm câu hỏi 1px, `window.__errs` rỗng.

⚠️ Hai chỗ có dấu câu lạ, em **giữ nguyên** vì thầy viết vậy: câu 34 kết thúc `thế nào?.` và câu 45
kết thúc `Em xem lại nhé!.` — thừa một dấu chấm sau `?` / `!`. Thầy muốn bỏ thì nói một tiếng.

### VIỆC ĐANG CHỜ
- ⬜ Thầy dùng thật với lớp khoá nền tảng rồi cho biết câu gợi ý nào cần sửa lời.
- ⬜ Ca chưa có luật riêng: **thứ tự trong cụm danh từ có tính chất** (Lesson 7) · chia sai `be` theo chủ
  ngữ (is/are) · thiếu `to` trong cụm động từ kết hợp (Lesson 15). Thêm được, chỉ cần thầy gật.

## Đợt 304 (08/9/2026, thầy giao) — ⭐⭐ EDITOR: VIỀN Ô QUESTION ĐẬM HƠN · HAI CỘT (hỏi trái | đáp án phải) · Ô TỰ XUỐNG DÒNG CHO THẤY HẾT CHỮ

Thầy: *"Ô điền dòng Question có viền đậm hơn để nhìn rõ sự khác nhau với các ô answer · Dòng Question
ở cột bên trái, các dòng answer ở 1 cột bên phải cho dễ nhìn, dễ phân biệt · Khi chữ dài quá ô thì
tăng rộng ô ra và xuống dòng 2 ngay trong ô. Đảm bảo luôn quan sát được hết text."*

### ⛔⛔ GỐC RỄ VIỆC 2: KHỐI CSS `.aw-tta-ed-*` CHƯA BAO GIỜ TỒN TẠI

`type-the-answer-editor.js` gắn `.aw-tta-ed-block` · `-qtext` · `-acol` · `-arow` · `-atext` từ
**30/7/2026**, và chính ghi chú đợt đó khai *"chỉ thêm khối nhỏ `.aw-tta-ed-*` vào
`type-the-answer.css` của chính template này"*. Nhưng **trong file không hề có một luật nào** —
`grep -rn "aw-tta-ed" --include=*.css` toàn kho ra **0 dòng**, kiểm cả `_backup/dot273/` cũng trống.
Hậu quả suốt hơn một tháng: `.aw-tta-ed-block` là `<div>` trần ⇒ ô câu hỏi **nằm chồng LÊN TRÊN** cột
đáp án, đúng thứ thầy thấy. ⚠️ Bài học: **ghi chú nói "đã thêm CSS" không phải bằng chứng có CSS** —
class bên JS và luật bên CSS không có gì tự kiểm nhau, phải grep mới biết.

### Đã sửa

**`type-the-answer.css`** — thêm hẳn khối EDITOR còn thiếu (cuối file, có ghi chú cảnh báo ở trên):
- `.aw-tta-ed-block` = lưới **2 cột đều nhau** (`minmax(0,1fr)` ×2, gap 14px, `align-items:start`);
  dưới **760px** tự xếp chồng lại (hai cột 1fr trên điện thoại thì cột nào cũng hẹp quá).
- `.aw-tta-ed-qtext` viền **2,5px `#23303e`** + chữ đậm + nền `#f7f9fc` (ô đáp án giữ nguyên viền nhạt
  1,5px `#d7e0ec` của `.aw-ed-input` bên core) — lúc focus vẫn nhường màu xanh của core kẻo không biết
  con trỏ đang ở đâu.
- Cột đáp án `flex-direction:column`, nút `×` bám **mép trên** (`align-items:flex-start`) để ô đáp án
  nhiều dòng không đẩy nút xuống lửng lơ giữa ô.
- Cả 2 loại ô: `resize:none` · `overflow:hidden` · `overflow-wrap:anywhere` · `line-height:1.35`.

**`type-the-answer-editor.js`** — ô đáp án đổi từ `<input>` sang **`<textarea rows=1>`** (một `<input>`
không bao giờ xuống dòng: đáp án là cả câu thì chữ chạy ngang ra khỏi tầm mắt). Thêm:
- `autoGrow(ta)` — cao theo nội dung, khuôn của `templates/crossword/crossword-editor.js`.
- `noEnter(ta)` — Enter không chèn `\n`: mỗi ô giữ đúng MỘT dòng dữ liệu (và lúc chơi `\n` chỉ hiện
  ra như một dấu cách, lưu vào chỉ tổ làm phép so đáp án lệch).
- `growAll()` gọi ở **4 mốc**: ngay sau `container.append(page)` · khung hình kế (`rAF`) ·
  `document.fonts.ready` · và mỗi lần **cửa sổ đổi bề ngang**. Bộ nghe `resize` tự gỡ mình khi trang
  editor đã bị thay (`page.isConnected`), không rò bộ nhớ.

### ⭐⭐ MỘT LỖI ẨN BẮT ĐƯỢC KHI ĐO — `scrollHeight` KHÔNG TÍNH VIỀN

Bản `autoGrow` chép từ Crossword gán `height = scrollHeight + 2`. Nhưng `.aw-ed-input` (core) khai
`box-sizing:border-box`, mà `scrollHeight` tính **cả padding nhưng KHÔNG tính viền** ⇒ phần chữ hụt
đúng bằng viền trên + viền dưới. Đo thật ở bàn thử: ô câu hỏi (viền 2,5px) **hụt 2px** — dòng cuối bị
liếm mất chân chữ. Sửa: cộng `borderTop + borderBottom` khi `box-sizing` là `border-box` ⇒ hụt về
**0px ở mọi ô**. ⚠️ `templates/crossword/crossword-editor.js` còn nguyên bản cũ (viền mỏng nên gần như
không thấy) — **không đụng ở đợt này** vì không phải template của phiên; ai làm Crossword thì vá theo.

### Bàn thử + phép đo

`scratch/dot304-editor.html` (gitignore, không lên kho) — mở THẲNG `openTypeTheAnswerEditor` với 3 câu,
câu 2 cố ý mang câu hỏi rất dài + 2 đáp án rất dài. **Không cần đăng nhập Google.** Đo qua
`javascript_tool` trên trình duyệt thật, viewport 1280×900:

| Phép đo | Kết quả |
|---|---|
| Lưới | `346px 346px` — câu hỏi x=280, cột đáp án x=640, **cùng mép trên** |
| Viền | question **2,5px `rgb(35,48,62)`** · answer **1,5px `rgb(215,224,236)`** |
| Ô nhiều dòng | câu 3 dòng cao **133px**, đáp án 2 dòng cao **88px** |
| Hụt chữ (`scrollHeight − clientHeight`) | **0 ở TẤT CẢ ô** (trước khi vá viền: 2px ở ô câu hỏi) |
| Gõ chữ dài rồi xoá bớt | 45px → **88px** → về lại **45px** (ô co lại được, không kẹt cao) |
| Enter | bị chặn, giá trị không đổi |
| Dán Excel | dán `Q one⇥ans1⇥ans2 / Q two⇥only answer` từ ô câu 2 → ra đúng 3 thẻ, đáp án phụ đúng chỗ |
| Màn 375px (mobile) | lưới về **1 cột**, hụt chữ vẫn 0 |
| Save | trả về đúng `items` đã sửa |

`node --input-type=module --check` sạch. **0 lỗi console** suốt bàn thử.

⚠️ **Bẫy bàn thử đã cắn ngay trong đợt này**: lượt đo đầu ra `gridTemplateColumns: 0px`, ô rộng 28px —
vì pane trình duyệt của phiên đang **bị ẩn**, bề ngang gần như bằng 0. Và trong pane ẩn thì
`requestAnimationFrame` **đóng băng hoàn toàn** (luật đã ghi ở `APP_MASTER.md` mục 8) nên bản đầu tiên
đặt chiều cao trong `rAF` không bao giờ chạy ⇒ "ô không tự cao" là kết luận SAI của bàn thử hỏng.
Phải `resize_window` ép viewport thật rồi mới đo, và `growAll()` phải có nhánh **đồng bộ**, không chỉ rAF.

### VIỆC ĐANG CHỜ
- ⬜ Thầy mở bản live, vào **Edit content** của một act Type the answer thật, xem 3 điểm trên.
- ⬜ **Đợt sau (thầy đã chốt hướng qua AskUserQuestion 08/9)**: tô màu **2 màu** từng từ khi submit
  (xanh = đúng, đỏ = sai) + **gợi ý offline thông minh** khi trả lời sai (thiếu/thừa/sai thứ tự/sai
  chính tả/sai dạng động từ). ⛔ Thầy chốt **KHÔNG** dùng AI online cho HS.

## Đợt 97 (10/8/2026, v0.9.71) — 3 tinh chỉnh màn chơi: chống iOS Safari tự zoom ô nhập, đẩy xa dấu
tích/X, hiện đáp án đúng lâu hơn khi sai. KHÔNG đụng core (chỉ `type-the-answer.js` + `.css`). ✅ THẦY
DUYỆT → COMMIT `931ca20` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (đo DOM qua trình duyệt
thật trước khi commit, `node --check` sạch, 0 lỗi console; sau push `curl` xác nhận đủ `--tta-input-fs`
trong CSS + `size + 22` và `revealShown ? 2600` trong JS trên bản live).

Thầy tự mở act trên iPhone, báo qua chat 3 điều (không kèm ảnh):

1. **Zoom khi bấm vào ô nhập trên iPhone**: nguyên nhân — `.aw-tta-input` đặt cỡ chữ theo đơn vị `cqw`
   (% chiều rộng CONTAINER game, không phải viewport); trên màn điện thoại hẹp, container co lại kéo
   font tính ra dưới 16px → Safari tự động zoom cả trang khi input nhận focus (hành vi chuẩn của iOS,
   không phải bug JS — bất kỳ input nào dưới 16px đều bị vậy). Sửa: thêm 1 biến CSS
   `--tta-input-fs: max(16px, calc(3.9cqw * var(--fit)))` khai trong `.aw-tta-card`, gán CHUNG cho cả
   `.aw-tta-input` VÀ `.aw-tta-reveal-text` (thay vì chép số `3.52cqw` riêng ở 2 chỗ như cũ) — vừa giữ
   đúng bất biến "reveal = input" đã có từ đợt 1/8/2026, vừa đảm bảo 2 giá trị không bao giờ lệch nhau ở
   các lần sửa sau. Tăng từ 3.52cqw lên 3.9cqw (~+11%, thầy cũng muốn ô đáp án to hơn 1 chút) VÀ có sàn
   cứng 16px không bao giờ xuống dưới nữa. Đo qua trình duyệt thật (`test.html`, đổi viewport 377px kiểu
   mobile): input/reveal đều ra đúng **16px** (chạm sàn, hết nguy cơ zoom); ở viewport 1280px thì ra
   **37.7px** (to hơn bản cũ ~32.5px) — input/reveal luôn bằng nhau ở cả 2 kích thước, không phá bất biến.
2. **Đẩy dấu tích xanh/X đỏ ra xa mép phải ô nhập hơn một chút**: khoảng lùi trong `flyMark()` tăng từ
   `size + 6` lên `size + 22`. Đo DOM: khoảng cách thật từ mép phải hàng input (`.aw-tta-inputrow`) tới
   mép trái dấu tăng từ ~14px lên ~30.7px.
3. **Hiện đáp án đúng lâu hơn khi trả lời sai**: thời gian trước khi tự chuyển câu/kết thúc — trước đây
   1400ms (hoặc 1500ms nếu hết mạng) — nay là **2600ms**, nhưng CHỈ khi đang thật sự hiện đáp án đúng
   (`showAnswerWhenWrong` bật): thêm biến `revealShown` (tách ra từ điều kiện mở reveal đã có sẵn, dùng
   lại chỗ tính `delay` thay vì viết logic riêng) để nếu thầy tắt "Show answer when wrong" thì giữ nguyên
   nhịp nhanh cũ 1400/1500ms — không có gì để đọc thêm thì không cần chờ lâu hơn. Đo bằng bộ đếm thời
   gian thật chạy TRONG trang (không phải áng chừng bằng mắt): submit sai → prompt đổi sang câu kế tiếp
   sau **~2841ms**, khớp đúng 2600ms + ~240ms crossfade chữ câu hỏi.

**Test thật qua trình duyệt** (`test.html`, đo DOM qua `javascript_tool` — gán `.value` bằng
`Object.getOwnPropertyDescriptor` setter rồi dispatch `KeyboardEvent Enter`/`Event input`, giống kỹ thuật
các đợt trước; pane phiên này không composite nên không chụp được ảnh, chỉ đo số liệu DOM): cả 3 điểm
đúng số đo nêu trên; đúng → điểm lên bình thường (1/6); sai → reveal mở đúng đáp án; auto-advance vẫn
đúng luồng cũ (Lives/Andrew/Minus không bị ảnh hưởng, không đụng gì khác ngoài 3 điểm trên). `node --check
type-the-answer.js` sạch. 0 lỗi console.

File đụng: `type-the-answer.js`, `type-the-answer.css` (đều trong thư mục riêng của template, không đụng
core, không đụng editor/sound/sample).

## Đợt 90 (8/8/2026, v0.9.65) — SỬA: điểm trừ ("Points off per wrong") bị rơi mất khỏi bảng kết quả

Thầy quan sát bảng kết quả cuối game hiện số câu làm được (`correct`) chứ không phải điểm đã trừ. Đúng:
`finish()` tính `livePoints` (điểm đã trừ) và hiện đúng lúc đang chơi (ô điểm góc phải-trên), nhưng
**không truyền `score` vào `ui.finish()`** → `core/scoring.js` mặc định `score = correct` → bảng kết
quả + xếp hạng bỏ qua hoàn toàn slider "Points off per wrong".

⚠️ **Bẫy tự bắt được khi test:** vá tạm bằng `score: livePoints` tưởng xong, nhưng test trình duyệt thật
(6 câu, phạt −2/câu sai, câu cuối ĐÚNG) ra `Score 2/6` trong khi ô điểm sống hiện đúng `3/6` ngay sau đó —
vì `livePoints` chỉ cộng bên trong callback `land()` của animation bay điểm (~0,9–1,1s sau khi nộp: shake
430ms + fly 480ms), mà bộ đếm auto-finish câu CUỐI lại đúng 1000ms — animation thua cuộc đua trong pane
test. Sửa đúng: tính điểm trừ **ĐỒNG BỘ trong `finish()`** từ `state` (đã set synchronous trong
`submitAnswer`, không phụ thuộc animation): `score: correct - penalty * wrongGraded`.

Test thật: 5 đúng + 1 sai (phạt 2) → `Score 3/6`, khớp `Total: 5/6`. Không đụng core. Chi tiết chung:
`GHI CHU DU AN.md` Đợt 90. ✅ THẦY DUYỆT → COMMIT `be7cd55` + PUSH + LIVE.

## Đợt 55 (3/8/2026) — Bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance (⚠️ LOCAL)

Thầy yêu cầu 5 việc qua chat (không kèm ảnh). CHỈ đụng `type-the-answer.js` + `.css` +
`sample-type-the-answer.js`, và **1 chỗ ở core/engine.js** (thêm cờ ẩn tuỳ chọn kiểu
`hideTimerOption`/`hideLettersOption` đã có sẵn — cùng khuôn, không phá template khác).

**1. Bỏ checkbox "Minus points for wrong answers"** — nay CHỈ còn 1 thanh trượt
`draft.minusAmount` **0..5** (trước là 1..5 + checkbox riêng bật/tắt). 0 = tắt trừ điểm (hiện
"Off" thay vì "−0"); mặc định đổi từ `1` (kèm checkbox tắt) → `0` để KHÔNG đổi hành vi các
activity cũ (trước đây mặc định checkbox tắt = không trừ, nay slider mặc định 0 = không trừ,
y hệt). Xoá `setSliderEnabled`/`.is-disabled` (không còn checkbox để disable theo). `flyMark()`:
`penalty = clamp(opt.minusAmount, 0, 5)`, `wrongMinus = !correct && penalty>0` (thay
`opt.minusPoints===true`). Xoá field `minusPoints` khỏi sample.

**2. Thêm Lives** — thanh trượt mới **0..10** (0 = Unlimited), bê nguyên khuôn từ True/false
(`hasLivesSlot`, `ui.livesSlot`, hàm `renderLives()`/`loseLife()` — copy gần như nguyên xi từ
`true-false.js`, chỉ đổi tên biến cho khớp). `normLives()`: **undefined/null/0 → unlimited**
(khác True/false — TF mặc định 5 mạng khi undefined, nhưng TTA thì KHÔNG được vì mọi activity
cũ đã lưu sẵn không có field `lives`, nếu mặc định 5 thì activity cũ tự nhiên có nguy cơ
Game Over mà không ai yêu cầu — 1 bẫy suýt mắc, phát hiện lúc đọc lại `normLives` của TF).
Sai câu → `loseLife()` (rớt 1 tim, hoạt ảnh tim bay biến mất) → hết tim → `finish("gameover")`
ngay (không chờ hết toàn bộ câu hỏi), dùng sound `ttaSound.gameOver()` (file `gameover-01.mp3`
đã có sẵn trong sounds/ từ trước, ghi "archived" — nay dùng thật). `sounds.complete` ở top-level
đổi thành no-op, `finish(reason)` tự chọn `ttaSound.complete()`/`ttaSound.gameOver()` (giống
đúng khuôn `true-false.js`).

**3+4+5. Sửa 3 lỗi nav/auto-advance — CÙNG 1 NGUYÊN NHÂN GỐC** (đọc kỹ code trước khi sửa, không
đoán mò): `submitAnswer()` cũ sau khi chấm điểm **KHÔNG gọi lại `updateNav()`** — nút Next chỉ
được bật/tắt lúc `loadQuestion()`, nên khi Allow skip TẮT, Next bị khoá lúc câu chưa chấm và
**vẫn khoá luôn sau khi chấm xong** cho tới khi có điều hướng khác (Prev/Next) tình cờ gọi lại
`updateNav()` — đúng triệu chứng "next không hoạt động dù đã submit". Nặng hơn: `autoTimer`
(hẹn giờ auto-next/auto-finish sau khi chấm) **không bao giờ bị huỷ** khi học sinh tự bấm
Prev/Next điều hướng thủ công — hẹn giờ CŨ vẫn treo, tới giờ tự bắn `goNext()`/`finish()` dù học
sinh đã rời sang câu khác từ lâu → **kéo giật học sinh tới câu không mong muốn** (lỗi 4) hoặc
**tự kết thúc ván đấu ẩn thanh nav** khi đang xem lại câu trước (lỗi 3, do `finish()`→
`celebrate()` set `navWrap.style.visibility="hidden"`). Sửa:
  - `submitAnswer()` gọi `updateNav()` NGAY sau khi chấm (Next bật đúng lúc, không chờ điều hướng khác).
  - `goPrev()`/`goNext()` gọi `clearAutoTimer()` (hàm mới) TRƯỚC khi đổi câu — huỷ hẹn giờ cũ.
  - Theo đúng yêu cầu (lỗi 5): **auto-advance nay LUÔN chạy sau khi chấm xong 1 câu, KHÔNG còn
    phụ thuộc checkbox "Auto switch" chung** (`opt.autoSwitch`) **lẫn Allow skip** — Allow skip
    giờ CHỈ còn quyết định Next có bấm được THỦ CÔNG hay không TRƯỚC khi trả lời; sau khi trả lời,
    game luôn tự chuyển câu (Back vẫn luôn xem lại được, vì `clearAutoTimer()` huỷ ngay khi bấm
    Back — không còn bị hẹn giờ cũ kéo đi giữa chừng). Vì checkbox "Auto switch" chung (core)
    nay vô nghĩa với riêng template này, thêm cờ `tpl.hideAutoSwitch` vào core/engine.js (đúng
    khuôn `hideTimerOption`) và bật cho TTA — ẩn hẳn checkbox thay vì để "chết" gây hiểu lầm.

**Test thật qua trình duyệt** (`test.html`, đo DOM qua `javascript_tool` — pane phiên này không
chụp ảnh được, xem lý do ở các đợt trước): Options panel xác nhận hết checkbox Minus points +
hết nhóm Auto switch, còn slider Points-off ("Off" ở 0) + nhóm Lives ("Unlimited" ở 0). Set
Lives=2 + Points off=2, Allow skip TẮT: sai câu 1 ("test") → mất 1 tim (♥ còn 1), điểm hiện đỏ
"2" (đúng `aw-tta-score-neg`, = 0−2), auto-advance sang câu 2 (không cần bấm gì) — xác nhận lỗi
5 đã hết. Làm đúng câu 2 ("gray") rồi submit+bấm Prev NGAY TRONG CÙNG 1 lượt JS (không qua
round-trip mạng, mô phỏng đúng race điều kiện) → về câu 1 xem lại reveal "seven"; đợi 2s — VẪN ở
câu 1 (hẹn giờ auto-next cũ của câu 2 đã bị huỷ, không kéo giật sang câu 3) — xác nhận lỗi 3+4
đã hết. Next bấm được ngay tại câu 1 (đã chấm) dù Allow skip tắt — xác nhận lỗi 4 (nhánh
Allow-skip-tắt) đã hết. Bấm Next thủ công qua câu 2 rồi câu 3, làm sai câu 3 → hết tim → 0 tim
→ ~1.5s sau tự "GAME COMPLETE" (dừng ở 3/6 câu, không cần làm hết 6 câu) — xác nhận Lives hoạt
động đúng. Test riêng Allow skip BẬT: Next bật ngay từ câu 1 chưa trả lời, bấm Next liên tiếp 3
lần nhảy qua câu 2/3/4 không lỗi; làm đúng câu 4 → auto-advance sang câu 5 dù Allow skip đang
BẬT (đúng lỗi 5, không chỉ áp dụng khi Allow skip tắt). **0 lỗi console** suốt toàn bộ test.
File đụng: `type-the-answer.js`, `type-the-answer.css`, `sample-type-the-answer.js`,
`core/engine.js` (thêm cờ `hideAutoSwitch`, không đổi hành vi mọi template khác). **Chưa push.**

## Đợt 54 (3/8/2026, v0.9.28) — Allow skip + chặn bàn phím ảo HĐH
- **Allow skip:** đã có điểm trừ riêng (`minusPoints`/`minusAmount`) nên đặt `hidePointsOff:true` (ẩn option chung).
  Thêm checkbox **"Allow skip"** (buildExtraOptions, mặc định KHÔNG tích): `canAdvance()` = `allowSkip || state[index].graded`;
  `updateNav` cho `onNext=null` (nút Next mờ) + `goNext` chặn tới khi câu hiện tại đã chấm. Seed `allowSkip:false` vào sample.
- **Chặn bàn phím ảo HĐH:** `input.inputMode = keyboardVisible ? "none" : "text"` (đặt lúc tạo `<textarea.aw-tta-input>`
  + trong handler nút kbd). Bàn phím AWord BẬT (mặc định) → native HĐH TẮT (Windows/Android/iOS), vẫn gõ vật lý được;
  ẩn bàn phím AWord → native bật lại. Đây là game DUY NHẤT có input thật nên chỉ sửa ở đây.

## TRẠNG THÁI: ✅ ĐÃ CHỐT, ĐÃ GỘP TRANG CHỦ + PUSH GITHUB (30/7/2026)

Gộp cùng đợt với Open the box (thầy yêu cầu "đưa lên live" để dùng trên máy khác) — chi tiết đầy đủ
của việc gộp (catalog.js/index.html/manifest.js/main.js + sửa hàm preview thẻ act đọc `content.items`)
xem `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` cùng ngày, không lặp lại ở đây. Đã commit + push
GitHub. **CHƯA tự bấm được** luồng đăng nhập Google + tạo/kéo-thả act thật trên trang chủ (Google chặn
tự động hoá) — thầy tự xem khi vào bản live.

## Việc cần làm (cho session nhận template này)
1. Đọc `../HUONG DAN TEMPLATE.md` (quy trình + luật chống xung đột) và `../../core/HUONG DAN CORE.md` (API engine).
2. Đọc spec đầy đủ: `../../docs/03-TYPE-THE-ANSWER.md` (2 chế độ, luật chấm gõ, alternate answers, JSON đề xuất).
3. Tạo 3 file trong CHÍNH thư mục này:
   - `type-the-answer.js` — module game, `type: "type_the_answer"`, `scorable: true`.
   - `type-the-answer.css` — giao diện riêng, mọi class prefix `.aw-tta-`.
   - `sample-type-the-answer.js` — dữ liệu mẫu, `export const activity = {...}`.
4. Test tại: `http://localhost:5510/templates/type-the-answer/test.html` (có sẵn, không cần sửa).
5. Xong việc: ghi nhật ký + đổi TRẠNG THÁI (🔴 → 🟡 ĐANG BUILD → 🟢 CHỜ THẦY DUYỆT → ✅ ĐÃ CHỐT).

## Mô tả game (tóm tắt từ spec)
Hiện prompt/câu hỏi → học sinh GÕ đáp án. Chấm bằng so khớp chuẩn hóa với TẬP đáp án chấp nhận (`acceptedAnswers[]` — nhiều biến thể). Mặc định không phân biệt HOA/thường; trim khoảng trắng. LƯU câu trả lời HS gõ vào perQuestion (để sau này phúc khảo). Tham khảo Quiz (`../quiz/quiz.js`) làm mẫu chuẩn.

## Nhật ký

### 24/7/2026 — build xong theo `../CONG THUC MAU.md`
- `type-the-answer.js`/`.css`/`sample-type-the-answer.js` tạo mới, `type: "type_the_answer"`.
- Cùng khuôn phân trang "1 câu tại 1 thời điểm" như Quiz, chỉ đổi vùng trả lời thành **ô nhập chữ + nút
  Submit** thay vì các ô lựa chọn. Gõ xong bấm Submit HOẶC Enter đều chấm ngay (single-shot như Quiz).
  Enter chỉ lắng nghe TRÊN CHÍNH ô input (không dùng phím tắt toàn cửa sổ như Quiz/Anagram) để không
  đụng hành vi gõ chữ/di chuyển con trỏ bình thường của `<input>`.
- **Luật chấm gõ** (`normalize()`): mặc định bỏ qua HOA/thường + bỏ dấu (dùng `.normalize("NFD")` tách
  dấu rồi xoá) + trim/rút gọn khoảng trắng; bật `options.strictCase`/`options.strictAccent` để chấm chặt
  hơn. So khớp với BẤT KỲ đáp án nào trong `item.acceptedAnswers[]` (đã test: gõ "GREEN" khớp "green",
  gõ "test" báo sai + hiện "Correct: seven" đúng theo `options.showAnswerWhenWrong`).
  Sai → viền ô đỏ (đổi màu Ở ĐÂY được phép vì đây là Ô NHẬP có trạng thái thật, khác luật "tile không
  đổi màu" vốn áp cho ô lựa chọn multiple-choice) + badge ✗ + dòng "Correct: …".
- `review[].yourText` lưu ĐÚNG chữ học sinh đã gõ (không phải chuẩn hoá) — phục vụ phúc khảo sau này
  (ghi chú trong docs/03 mục 7).
- **Test qua `test.html` (browser thật)**: gõ đúng (khác hoa/thường) → is-correct; gõ sai → is-wrong +
  reveal; Enter và nút Submit đều hoạt động (đã xác nhận bằng `dispatchEvent(KeyboardEvent Enter)` trên
  chính input đang focus); Submit answers giữa chừng → Score 1/6 đúng; Show answers hiện đủ 3 dạng
  (đúng/sai kèm đáp án đúng/No answer kèm đáp án đúng). 0 lỗi console. Grep bẫy transform+animation —
  sạch (chỉ `:active` translateY không phải centering).
- Chưa làm: **chế độ "Spelling test"** (docs mục 2, đọc từ bằng audio cho HS gõ chính tả) — MVP chỉ làm
  chế độ "Questions and answers" (`content.mode: "qa"`); Spelling cần thêm text-to-speech (có thể dùng
  `window.speechSynthesis` sẵn có của trình duyệt, chưa làm — không phải bug, để ngỏ nếu thầy cần).
  Cũng chưa làm **KEYBOARD LANGUAGE** (bàn phím ảo ký tự đặc biệt, docs mục 3) — bàn phím thật của máy/
  điện thoại HS đã đủ dùng cho tiếng Anh.

### 30/7/2026 — Content editor riêng (`type-the-answer-editor.js`)

Thầy yêu cầu tiếp tục xây Type the answer, việc đầu tiên: content editor (chưa có, giống Anagram trước
khi có `anagram-editor.js`) — "+ New activity"/"Edit content" trước đây chỉ hiện toast "coming soon".

1. **File mới**: `type-the-answer-editor.js` (`openTypeTheAnswerEditor`), theo ĐÚNG khuôn
   `templates/quiz/quiz-editor.js` (cùng chữ ký `(container, activity, {onSave, onCancel, header, footer})`,
   cùng scope đơn giản: chỉ Activity Title + danh sách câu hỏi; theme luôn Classic; mode luôn `"qa"`
   (Spelling test KHÔNG làm ở đây — vẫn để ngỏ như đã ghi ở trên).
2. **Mỗi hàng** = Question (bắt buộc) + **Answer** (đáp án chính, bắt buộc) + **"+ Add alternate answer"**
   (thêm đáp án chấp nhận khác, tối đa 5 alt, mỗi cái có ô riêng + nút × xoá) — khớp đúng mô hình
   `content.items[].{prompt, acceptedAnswers[]}` mà `type-the-answer.js` đang đọc, không cần chuyển đổi gì
   thêm. Có Add question (tối đa **30 câu**, đúng giới hạn Wordwall gốc ở docs/03), Duplicate/Remove.
3. **Dán Excel** (`onQuestionPaste`, giống Quiz/Anagram): cột 1 → Question, cột 2 → Answer chính, cột 3+ →
   alternate answers (tối đa 5), dán được từ CẢ ô Question lẫn ô Answer/Alt., điền từ hàng đang dán xuống.
4. **Tái dùng gần 100% class `.aw-ed-*` sẵn có** trong `core/app.css` (như Quiz/Anagram) — chỉ thêm
   khối nhỏ `.aw-tta-ed-*` (hàng đáp án + nhãn ANSWER/ALT.) vào `type-the-answer.css` của chính template
   này, KHÔNG đụng `core/`.
5. Đăng ký: `type-the-answer.js` thêm `edit: openTypeTheAnswerEditor` (import trực tiếp).
6. **Đã test qua trình duyệt thật** (`test.html` → nút Edit trong khung game, KHÔNG cần harness riêng vì
   nút Edit gọi thẳng `tpl.edit()` bất kể `catalog.js` đang để `built:false`):
   - Mở editor hiện đúng 6 câu mẫu, thêm/xoá alternate answer hoạt động đúng.
   - Duplicate/Remove câu hỏi đúng vị trí, không ảnh hưởng câu khác.
   - Dán Excel giả lập (`ClipboardEvent` 2 dòng, 3 cột) vào ô Question → đúng 2 câu mới, cột 3 thành
     alternate answer, banner xanh báo đúng "Pasted 2 question(s) from Excel."
   - Save khi xoá trống Title → đúng lỗi "Please enter an activity title."
   - Save hợp lệ → gọi `onSave`, bắt lỗi gọn "Could not save — please try again." (đúng vì `test.html`
     không đăng nhập Google nên `store.js` từ chối — giới hạn đã biết, không phải bug editor).
   - Cancel → quay lại y nguyên bản gốc (title/nội dung không bị ảnh hưởng bởi chỉnh sửa dở).
   - Chơi lại game sau khi thêm `edit` field vẫn bình thường (0 lỗi console suốt quá trình).
   - **Chưa test Save thành công thật** (cần thầy tự đăng nhập Google — máy build không tự động hoá
     được bước đó, xem mục 9 APP_MASTER.md).
7. **Core**: KHÔNG đụng gì (chỉ thêm file mới + vài dòng CSS trong `templates/type-the-answer/`).
8. **Chưa làm/còn để ngỏ**: 🎤/🖼️ voice+image trong editor (như Anagram, "để bàn sau"); bố cục dạng BẢNG
   giống ảnh Wordwall thật (Anagram đã đổi sang bảng Word|Clue — Type the answer vẫn ở dạng card đơn giản,
   có thể đổi theo nếu thầy muốn giống Anagram).

### 30/7/2026 (tiếp) — đổi bố cục Editor theo ảnh thầy gửi (Câu hỏi trái | Câu trả lời phải)

Thầy gửi ảnh chụp Google Sheets (2 cột: Question | Answer, nhiều dòng liền nhau cho 1 câu hỏi — dòng nào
cột Question để trống nghĩa là câu trả lời THÊM cho câu hỏi ngay phía trên) và yêu cầu sửa lại:

1. **Bố cục 2 cột**: ô Câu hỏi bên TRÁI (cao bằng cả cụm câu trả lời, giống ô "gộp" trong ảnh — dùng
   `<textarea>` + CSS Grid `align-items:stretch` để tự giãn theo chiều cao cột phải) — cột PHẢI xếp
   chồng từng ô Câu trả lời. Bỏ 2 nhãn "ANSWER"/"ALT." cũ (ảnh thầy không phân biệt, chỉ là 1 danh sách
   câu trả lời được chấp nhận, thứ tự trên-xuống, dòng đầu vẫn là đáp án chính dùng cho "Correct: …"/Print).
2. **"+ Add alternative answer" dời xuống NGAY DƯỚI ô câu trả lời cuối** (trong cùng cột phải, không còn
   là hàng riêng ngoài khối câu hỏi) — đã đo DOM xác nhận đúng là phần tử con cuối cùng của cột câu trả lời.
3. **Dán Excel đổi thuật toán hoàn toàn** theo đúng cấu trúc ảnh: cột TRÁI = câu hỏi, cột PHẢI = 1 câu trả
   lời/dòng; dòng có cột TRÁI RỖNG → câu trả lời đó được CỘNG THÊM vào câu hỏi ngay phía trên (không phải
   coi mỗi dòng là 1 câu hỏi riêng nữa). Dán được từ CẢ ô Câu hỏi lẫn bất kỳ ô Câu trả lời nào trong khối
   (đều fill từ đúng vị trí câu hỏi đó trở xuống, giống quy ước Quiz/Anagram).
4. **Tối đa 50 câu hỏi** (thầy yêu cầu, tăng từ 30).
5. **Đã test qua trình duyệt thật** (`test.html` → Edit, dùng `javascript_tool` đo DOM vì `computer`
   screenshot bị lỗi hiển thị pane phiên này — đã xác nhận số liệu/cấu trúc DOM trực tiếp thay vì đọc ảnh):
   - Bố cục: ô câu hỏi nằm bên trái + cao bằng đúng chiều cao cụm câu trả lời bên phải (câu có 2 đáp án
     "gray/grey" → khối cao 160px, câu có 1 đáp án → 106px, ô câu hỏi luôn khớp chiều cao khối).
   - Dán ĐÚNG ví dụ trong ảnh thầy gửi (2 câu hỏi, 5+3 đáp án) → ra đúng
     `{prompt:"What is one of the seasons?", acceptedAnswers:["Spring","Winter","Autumn","Fall","Summer"]}`
     và `{prompt:"How do you feel?", acceptedAnswers:["Hungry","Sad","Happy"]}` — khớp 100% ảnh gốc.
   - "+ Add alternative answer" bấm ra ô mới đúng vị trí NGAY DƯỚI câu trả lời cuối (đã đo `children` của
     cột câu trả lời: 5 hàng câu trả lời rồi mới tới nút, không lẫn lộn).
   - Đếm "2 / 50 questions" đúng giới hạn mới. 0 lỗi console suốt quá trình.
6. **Core**: KHÔNG đụng gì (chỉ sửa `type-the-answer-editor.js` + vài dòng CSS `.aw-tta-ed-*` trong
   `type-the-answer.css`, cả hai đều trong thư mục riêng của template).

### 30/7/2026 (tiếp) — Viết lại màn CHƠI theo góp ý chi tiết của thầy (⚠️ có đụng core)

Thầy góp ý chi tiết 7 điểm cho màn chơi (bố cục ô nhập/nút Submit, tích xanh/x đỏ bay về điểm, chế độ
Minus, bỏ Letters on answers, không phân biệt hoa/thường, Show answer when wrong hiện xanh lá + trượt
xuống, thêm bàn phím ảo). Đã hỏi thầy 1 câu trước khi code (vị trí nút bàn phím) vì có đụng core.

**1. Bố cục lại**: ô "Type your answer" cao hơn hẳn (chữ to hơn), rộng **80%** khung, nằm ngay dưới câu
hỏi; nút **Submit Answer** (đổi tên, mỏng hơn, rộng ~46%) nằm NGAY DƯỚI ô nhập (trước đây 2 thứ nằm
cùng hàng). Tự hiểu "gần sát câu hỏi" = kéo khối input+submit lên gần câu hỏi (bỏ `margin-top:auto` đẩy
xuống đáy khung như bản cũ) để nhường chỗ cho bàn phím phía dưới — thầy xem thử nếu ý muốn khác.

**2. Tích xanh/X đỏ bay về điểm**: đúng → tích xanh (`icons.check`, màu `#10b981` qua CSS `color`, KHÁC
`icons.markCheck` trắng-viền-đen mà Quiz/Anagram dùng cho dấu to) hiện ngay ngoài mép phải ô nhập, bay
vào số điểm + Pulse Counter (kỹ thuật y hệt `flyScoreGain`/`pulseScoreTo` của Anagram, viết lại bản đơn
giản riêng cho Type the answer, không dùng chung code). Sai → x đỏ (`icons.cross`) cùng chỗ:
- **Có tích "Minus points for wrong answers"**: bay về điểm và **trừ** (không xuống dưới 0).
- **Không tích**: mờ dần biến mất tại chỗ, điểm giữ nguyên.
- Đã đo thật qua trình duyệt: đúng → điểm 0→1 (Pulse); tắt Minus, sai → điểm giữ nguyên; bật Minus, sai
  → điểm 1→0 đúng.
- **Điểm hiển thị SỐNG (topbar) tách khỏi điểm TỔNG KẾT cuối ván**: panel "Score X/Y" cuối ván vẫn là số
  câu đúng thật/tổng số câu (không đổi theo Minus) — Minus chỉ ảnh hưởng con số đang chạy lúc chơi, KHÔNG
  đổi cách xếp hạng/leaderboard. Quyết định phạm vi này thầy chưa yêu cầu rõ, nói lại nếu muốn điểm cuối
  ván cũng trừ theo Minus.

**3. Bỏ "Letters on answers"** khỏi Options (không áp dụng cho game này).

**4. Không phân biệt hoa/thường**: bỏ hẳn `strictCase`/`strictAccent` (chưa từng có UI bật tắt, giờ xoá
luôn khỏi code + sample data cho gọn) — `normalize()` luôn bỏ dấu + về chữ thường.

**5. "Show answer when wrong"** giờ là Option thật (trước chỉ set qua data, không có UI): bật → sai thì
hiện đáp án đúng màu xanh lá NGAY TRÊN ô nhập, khối ô nhập+Submit **trượt xuống mượt** nhường chỗ — dùng
kỹ thuật CSS `grid-template-rows: 0fr → 1fr` (không đụng `transform`, đúng luật mục 3.5 CONG THUC MAU.md)
để khối bên dưới tự trôi xuống theo layout, không "giật" theo cách 1 lần đổi được DOM. **Bẫy thật đã bắt
được lúc test**: lúc đầu bọc việc mở khối trong `requestAnimationFrame` (tưởng cần né kiểu "tạo xong đổi
ngay" như các fly-tile khác) — nhưng ô này đã tồn tại từ `render()` trước đó (không phải mới tạo), nên
KHÔNG cần rAF; mà trong đúng môi trường xem trước phiên này `requestAnimationFrame` không bao giờ bắn
(đã đo trực tiếp: `rafFired:false` trong khi `setTimeout` vẫn chạy bình thường) → khối KHÔNG BAO GIỜ mở.
Đã sửa bỏ hẳn rAF, gọi thẳng `classList.add("is-open")` (ô cũ đã có sẵn từ trước, không cần đợi 1 khung
hình để trình duyệt "thấy" trạng thái đóng trước).
- ⚠️ **1 chỗ CHƯA tự mắt xác nhận được**: bản thân hiệu ứng trượt mượt (CSS transition) — môi trường xem
  trước phiên này báo `document.hidden:true`/"page is not compositing frames" (bẫy đã ghi trong
  APP_MASTER.md mục 9), nên dù đã xác nhận đúng class `is-open` được gắn + rule CSS đúng tồn tại trong
  stylesheet, `getComputedStyle` trả `grid-template-rows: 0px` hoài (không tính lại được vì tab không
  render) — không đo được ảnh chuyển động thật. Đây là kỹ thuật CSS chuẩn, được hỗ trợ tốt trên Chrome,
  tự tin đúng nhưng **thầy nên tự mở link xem hiệu ứng trượt xuống có mượt như ý không**.
- **Cũng thêm `setTimeout` dự phòng cho `pulseScoreTo`** (mục 2) vì lý do y hệt: `requestAnimationFrame`
  không bắn trong tab ẩn nên vòng đếm điểm chạy bằng rAF sẽ treo mãi — thêm `setTimeout` ép gán giá trị
  cuối cùng sau khi hết thời lượng dự kiến, giống mọi `element.animate()` khác trong app đã có sẵn quy
  tắc này. **Đây có thể là bẫy tiềm ẩn ở Anagram nữa** (nó cũng chỉ dùng rAF thuần cho `pulseScoreTo`) —
  con không tự sửa Anagram (khác phạm vi phiên này), chỉ ghi lại đây để thầy cân nhắc báo phiên Anagram
  sau nếu gặp trường hợp điểm không lên trong tab bị ẩn/nền.

**6. Bàn phím ảo QWERTY**: giữa khung (60% rộng) + khu SỐ bên trái (1-9, 0) + khu DẤU CÂU bên phải
(`, . ' - ? !`) + Space + Backspace (⌫). Bấm phím chèn đúng vị trí con trỏ trong ô nhập (không phải luôn
chèn cuối), giữ focus ô nhập (`tabIndex=-1` + chặn `mousedown` để không cướp focus). **Nút ẩn/hiện đặt
cạnh nút Menu** (thầy chọn khi được hỏi) — dùng cửa mở rộng mới `ui.kbdSlot`/`tpl.hasKeyboardToggle` của
engine. **Mặc định HIỆN mỗi khi mở act** (bấm Play/Start again), giữ trạng thái ẩn/hiện khi chuyển qua
lại giữa các câu hỏi trong CÙNG 1 ván. Đã test: bấm ẩn → bàn phím biến mất + đổi tên nút "Show keyboard";
chuyển câu → vẫn ẩn (đúng); Start again → tự hiện lại (đúng mặc định).

**Đã test qua trình duyệt thật** (gõ chữ bằng CHÍNH bàn phím ảo mới xây, không phải gõ tay): trả lời
đúng/sai nhiều câu, chế độ Minus bật/tắt, Options hiện đúng 2 mục mới + KHÔNG còn Letters on answers,
hoa/thường không phân biệt (gõ "GREY" vẫn đúng), Submit answers giữa chừng → Score 1/6 đúng (không bị
ảnh hưởng bởi Minus), Show answers hiện đủ 3 dạng, Start again reset điểm + bàn phím về mặc định. 0 lỗi
console suốt quá trình.

**Core bị đụng (đã báo thầy trước khi code, chỉ 2 điểm, đều CHỈ THÊM không đổi hành vi game khác)**:
- `core/engine.js`: (a) thêm cờ `tpl.hideLettersOption` — bỏ qua nhóm "Letters on answers" nếu template
  khai báo cờ này (Quiz/Anagram/... không khai báo nên không đổi gì); (b) thêm cờ `tpl.hasKeyboardToggle`
  → tạo `ui.kbdSlot` (1 `<span>` rỗng) đặt cạnh nút Menu, template tự vẽ nút riêng vào đó. **Bọc `menuBtn`
  trong 1 `<div class="aw-bottombar-left">`** để giữ đúng CSS `.aw-bottombar` (grid 3 cột dùng
  `:nth-child(1/2/3)` để căn nav ở giữa) — nếu chèn thẳng nút thứ 4 vào hàng sẽ phá vỡ chỉ số cột này.
- `core/app.css`: thêm rule `.aw-bottombar-left` (flex, giống `.aw-tools`) — không sửa rule nào có sẵn.
- `core/icons.js`: thêm icon `keyboard` (chỉ thêm, theo đúng khuôn các icon mic/image/dragHandle... mà
  Anagram đã thêm trước đây).
- Đã test lại `templates/quiz/test.html` sau khi sửa core — vẫn chạy bình thường, 0 lỗi.

### 31/7/2026 — Bàn phím TÔNG TỐI + phím Submit trong bàn phím (⚠️ LOCAL, CHƯA PUSH, chờ thầy duyệt)

Thầy gửi ảnh bàn phím tối kiểu điện thoại và yêu cầu đổi giao diện bàn phím ảo. CHỈ đụng 2 file của
template (`type-the-answer.js` + `.css`), KHÔNG đụng core.

1. **Đổi màu bàn phím sang tông tối, phím vuông** (`type-the-answer.css`): cả cụm bàn phím có nền tối
   `#2b2b2e` bo góc; phím nền xám `#48484b`, chữ trắng `#f4f4f5`, bo góc nhỏ (`0.7cqw`), có "gờ" tối
   `#202022` phía dưới cho ra dáng phím vật lý giống ảnh. Giữ nguyên số bên trái + ký tự bên phải, và
   phím ⌫ vẫn ở CUỐI HÀNG TRÊN CÙNG (thầy chốt khi được hỏi — không dời xuống hàng 3 như ảnh).
2. **Thêm phím Submit XANH trong bàn phím** (`type-the-answer.js` `buildKeyboard`): hàng dưới cùng giờ là
   Space (rộng) + **Submit** ngay bên phải, cùng phong cách phím khác nhưng màu xanh (`--aw-tile-fixed`).
   Bấm nó chấm điểm y hệt nút "Submit Answer" cũ (`submitAnswer(getInput().value)`); disable khi câu đã chấm.
3. **Ẩn/hiện nút "Submit Answer" ngoài theo bàn phím** (`syncSubmitVisibility()`): bàn phím ĐANG HIỆN →
   nút ngoài `display:none` (dùng phím Submit trong bàn phím); ẩn bàn phím → nút ngoài hiện lại (gõ bằng
   bàn phím thật vẫn cần nút bấm). Gọi trong `render()` (SAU khi `root.append(card)` — bẫy đã bắt: gọi
   trước lúc card chưa vào DOM thì `root.querySelector` không thấy nút → không ẩn được) và trong
   `kbdBtn.onclick`.
4. **Đã test qua trình duyệt thật** (`test.html`, chụp ảnh + đo DOM): nền/màu phím đúng
   (kbd `rgb(43,43,46)`, phím `rgb(72,72,75)`, chữ trắng, Submit `rgb(59,130,246)`); gõ "green" bằng bàn
   phím ảo → bấm phím Submit trong bàn phím → ô xanh is-correct + điểm lên 1; bật bàn phím thì nút ngoài
   ẩn (`display:none`), ẩn bàn phím thì nút ngoài hiện lại ("Submit Answer"). 0 lỗi console.
5. **Chưa push** — chờ thầy tự chơi duyệt. Nếu ưng: commit + push (nhớ `curl` kiểm chứng theo mục 9
   APP_MASTER). Điểm có thể tinh chỉnh thêm nếu thầy muốn phím vuông hơn nữa (hiện phím hơi bè ngang).

### 31/7/2026 (tiếp) — Bàn phím kiểu điện thoại: caps / numbers / nút "Andrew help" (⚠️ LOCAL, CHƯA PUSH)

Thầy gửi ảnh bàn phím mới (4 hàng, phím chức năng) + đặc tả nút trợ giúp "Andrew". Đã hỏi 3 câu chốt
phạm vi trước khi build (1 lần/cả ván · chép đúng vẫn tính điểm · nhãn luôn là "Andrew"). CHỈ đụng 2 file
template, KHÔNG đụng core.

**Bố cục mới (thay hẳn bàn phím cũ có cột số/ký tự 2 bên):** 4 hàng full-width —
`' q…p ⌫(đỏ)` / `caps a…l ?` / `numbers z…m . ,` / `Andrew  Space  Submit(xanh)`.

1. **caps** (`makeCapsKey`): bật/tắt nhập chữ HOA (glyph phím luôn HOA như ảnh; chỉ đổi CASE ký tự chèn
   vào ô — chấm điểm vẫn bỏ qua hoa/thường nên caps thuần trang trí). Bật → **chấm sáng tròn** góc phải
   phím + nền nâng sáng xanh-xám. Trong chế độ numbers thì caps **disabled** (mờ).
2. **numbers** (`makeNumbersKey`): đổi cả 3 hàng chữ sang **layout số/ký tự** (`KBD_N1/N2/N3`: hàng số
   1-0, rồi `- / : ; ( ) $ & @ "`, rồi `! + = * % # _ . ,`). Đang bật → chấm sáng + nền nâng. Bấm lại về
   chữ. Các phím này chèn ký tự nguyên trạng (`makeCharKey`, đã kiểm `&`/`"` không bị escape sai vì
   `el()` dùng `innerHTML` + `escapeHtml`).
3. **Andrew help** (`makeAndrewKey`/`useAndrew`): biến `andrewUsed` (1 lần cho **cả ván**) + `andrewGlowing`
   (từ lúc bấm tới lúc submit câu đó). Chưa dùng → **chấm sáng tròn** (còn lượt). Bấm → hiện đáp án đúng
   ở khối reveal, màu **hổ phách** kèm nhãn "Andrew ➜ …" (class `.is-andrew`), đồng thời phím Andrew
   **sáng vàng + hào quang nhấp nháy** (`@keyframes aw-tta-andrew-halo`). HS chép đáp án gõ vào → Submit
   (chép đúng **vẫn cộng điểm** như thường; sai vẫn sai). Ngay sau submit → phím Andrew **tối lại**
   (`is-used`, transition mượt) và **khóa cả ván** (câu sau vẫn is-used, mất chấm sáng). Rời câu chưa
   submit cũng coi như đã tiêu lượt (`goPrev/goNext` set `andrewGlowing=false`).
4. **Giữ nguyên đợt trước**: phím Submit xanh trong bàn phím + ẩn/hiện nút "Submit Answer" ngoài theo bàn phím.
5. **BẪY THẬT đã bắt + sửa (quan trọng)**: `rebuildKeyboard()` thay node bàn phím khi bấm caps/numbers/
   Andrew, nhưng hàm `measure` của `autoFit` (tạo trong `render()`) lại **đóng kín (closure) biến `kbd`
   node CŨ** → sau khi thay, node cũ rời DOM (`offsetHeight=0`) → autoFit tưởng vừa khung → KHÔNG thu nhỏ
   → khi bấm Andrew (reveal mở, bàn phím 4 hàng) thì **tràn: dòng đầu câu hỏi bị cắt trên + hàng Submit bị
   cắt dưới**. Sửa: `measure` đo `keyboardEl` (biến sống, cập nhật mỗi lần rebuild) thay vì `kbd`. Đo lại →
   khớp khung hoàn hảo.
6. **Đã test thật qua trình duyệt** (chụp ảnh + đo DOM): layout khớp ảnh; caps bật→"G", tắt→"r"; numbers
   ra đúng số/ký tự ("Gr5@"); Andrew: chấm sáng→bấm→hiện "Andrew ➜ went" + phím vàng rực→gõ "went"→Submit
   → ô xanh is-correct + điểm 0→1 + Andrew `is-used` tối + khóa; sang câu 2 Andrew vẫn is-used/disabled/
   mất chấm. Fit khớp khung (không còn cắt). 0 lỗi console suốt quá trình.
7. **Chưa push** — chờ thầy chơi duyệt. File đụng: `type-the-answer.js` + `type-the-answer.css` (template).

### 1/8/2026 — 7 cải tiến bàn phím (⚠️ LOCAL, CHƯA PUSH, chờ thầy duyệt)

Thầy chốt "ok build" cho 7 yêu cầu về bàn phím. CHỈ đụng 2 file template
(`type-the-answer.js` + `type-the-answer.css`), **KHÔNG đụng core**.

**Thay đổi cấu trúc lớn (điểm 2 + 7) — refactor màn chơi:**
- Trước đây `render()` dựng lại TOÀN BỘ card (kể cả bàn phím) mỗi câu, và card
  `justify-content:center` nên mở reveal làm mọi thứ (kể cả bàn phím) dịch chuyển.
- Nay tách **`.aw-tta-stage`** (câu hỏi + reveal + ô nhập + Submit — vùng co giãn,
  dựng lại mỗi câu) đặt TRÊN **bàn phím dựng 1 lần, neo đáy, KHÔNG scale theo `--fit`**.
  Bàn phím = phần tử cố định; stage `flex:1` nuốt hết chỗ còn lại → reveal mở thì
  lớn lên TRONG stage (đẩy câu hỏi lên), thiếu nữa thì autoFit giảm `--fit` (chỉ
  co stage) → **bàn phím không bao giờ di chuyển**. Đã đo: mở Andrew, bàn phím
  top=293/bottom=490 y hệt trước và sau (điểm 2 ✓).
- Chuyển câu: `fadeSwap` giờ CHỈ fade `.aw-tta-stage`, không đụng node bàn phím →
  bàn phím giữ nguyên. Đã đo: gắn `dataset.marker` vào node bàn phím, bấm Next →
  marker CÒN NGUYÊN (cùng 1 node, không dựng lại) + vị trí không đổi (điểm 7 ✓).
  `syncKeyboardState()` cập nhật Submit/caps/numbers/Andrew TẠI CHỖ (không rebuild).

**Các điểm còn lại:**
1. **Bàn phím hạ thấp** + gap tới hàng chức năng còn 1/2: card `padding-bottom`
   2.4cqw→1.2cqw, bàn phím neo đáy. ✓
3. **Chiều ngang bàn phím còn 70%**: `.aw-tta-kbd { width:70% }` (canh giữa). Đo
   width 646px trên stage ~920px ≈ 70% ✓.
4. **Caps tự tắt sau 1 chữ**: `makeLetterKey` gõ xong nếu caps đang bật thì gọi
   `setCaps(false)` — cập nhật class TẠI CHỖ (không rebuild, không nháy) vì glyph
   phím luôn HOA sẵn, chỉ đổi case ký tự chèn + chấm sáng. Đo: caps ON→gõ "A"→
   caps tự off, input="A" ✓.
5. **Andrew nháy chậm**: halo `1s`→`2.6s`; dot-pulse `1.6s`→`2.6s` (dot-pulse giờ
   chỉ còn áp cho chấm Andrew "ready" vì chấm caps/numbers đã thành trắng đứng yên).
   Đo `animationDuration:2.6s` ✓.
6. **Chấm caps/numbers khi bật = trắng đứng yên**: thêm rule dot `background:#fff` +
   `animation:none` + `opacity:1`. Đo: caps/numbers ON → dotBg `rgb(255,255,255)`,
   animationName `none` ✓.

**Bỏ `var(--fit)` khỏi mọi kích thước bàn phím** (trước đây nhân `--fit`): đây là
điều kiện để bàn phím giữ đúng 1 kích thước/vị trí khi autoFit co chữ. Chỉ stage
(câu hỏi/ô nhập/Submit ngoài) còn scale theo `--fit`.

**Đã test thật qua trình duyệt** (`test.html`, đo DOM + chụp ảnh): 7/7 điểm đạt;
chấm đúng "seven"→ô is-correct + tích bay → điểm 0→1; caps/numbers/Andrew đúng
trạng thái; **0 lỗi console** suốt quá trình.

**Chưa push** — chờ thầy tự chơi duyệt. Nếu ưng: commit + push (kèm cả 2 đợt 31/7
đang treo local, nhớ `curl` kiểm chứng theo mục 9 APP_MASTER). File đụng:
`type-the-answer.js` + `type-the-answer.css` (đều trong thư mục template).

### 1/8/2026 (tiếp) — 3 tinh chỉnh bàn phím: Andrew trắng, chữ cái bằng nhau, caps -15% (⚠️ LOCAL)

Thầy chốt "ok build" cho 3 yêu cầu tiếp. CHỈ đụng `type-the-answer.js` + `.css`, KHÔNG đụng core.

1. **Nút Andrew (ready) chuyển tông trắng** như caps/numbers: nhãn `#ffe08a`→`#f4f4f5`;
   chấm tròn "ready" `#ffd54a`→**trắng** (đổi luôn màu cơ sở `.aw-tta-key-dot` vì giờ
   chỉ Andrew-ready còn dùng chấm nhấp nháy — caps/numbers đã là chấm trắng đứng yên).
   Tốc độ nháy chấm giảm còn 1/2: `aw-tta-dot-pulse` 2.6s→**5.2s**. (Halo vàng lúc Andrew
   ĐANG glowing giữ nguyên 2.6s — đó là highlight "đang trợ giúp", thầy không yêu cầu đổi.)
   Đo: labelColor rgb(244,244,245), dotBg rgb(255,255,255), animDuration 5.2s ✓.

2. **Mọi phím chữ cái BẰNG NHAU tuyệt đối (ngang + cao)**: thêm class `.aw-tta-key-letter`
   (JS gắn trong `makeLetterKey`) với `flex: 0 0 var(--tta-kw)` (5cqw cố định) → 26 chữ
   không còn co giãn, tất cả cùng 1 bề ngang. Chiều cao: nguyên nhân lệch là phím ⌫ font
   1.6cqw làm HÀNG 1 cao hơn (Q cao 43.3px vs A/Z 39.3px) → hạ font ⌫ về **1.35cqw** (bằng
   chữ cái) → mọi hàng cùng cao. Đo sau sửa: **cả 26 phím đúng 48.3px × 39.3px** (1 giá trị
   duy nhất cho cả width lẫn height) ✓. Các phím KHÔNG phải chữ cái (' ? . , ⌫ Space Submit)
   vẫn flex-grow để lấp đầy hàng — đây là các phím "co giãn" nuốt phần dư nên chữ cái giữ đều.

3. **caps hẹp đi 15% + kéo hàng A-L theo + `?` giãn bù**: caps/numbers/andrew nay có bề ngang
   CỐ ĐỊNH riêng (ghi đè `flex:1.8` của `.aw-tta-key-fn`): `--tta-caps-w: 8.83cqw`
   (=10.39cqw cũ × 0.85), `--tta-numbers-w: 11.3cqw` (≈cũ), `--tta-andrew-w: 12.7cqw` (≈cũ).
   Vì caps cố định hẹp hơn và các chữ A-L cố định nằm ngay sau nó, chúng **dịch trái theo caps**;
   `?` cuối hàng 2 là phím grow duy nhất nên **giãn ra bù** đúng phần trống. Đo: caps 100.6px→
   **85.3px (giảm 15.2%)**, numbers giữ 109px ✓.

**Đã test thật qua trình duyệt** (`test.html`, đo DOM + ảnh): 3/3 đạt; không hồi quy — caps tự
tắt sau 1 chữ vẫn đúng, numbers mode chuyển qua lại OK (26 phím chữ ↔ chế độ số), bàn phím vẫn
cố định vị trí, **0 lỗi console**. Bố cục nhìn giống bàn phím điện thoại thật hơn.

**Chưa push** — chờ thầy chơi duyệt (gộp chung mọi đợt local đang treo khi push). File đụng:
`type-the-answer.js` + `type-the-answer.css`.

### 1/8/2026 (tiếp) — 8+3 việc: điểm X/30, ô nhập, âm thanh thật, slider Minus... (⚠️ LOCAL)

Thầy chốt "ok build" cho 8 yêu cầu + bổ sung 3. Đụng 2 file template + **2 file core (nhỏ, chỉ THÊM)**
+ 1 file sound mới + copy mp3. Có hỏi thầy 1 câu (tiếng gõ phím) → thầy chọn **tự tổng hợp**.

**Âm thanh (điểm bổ sung 1 + yêu cầu 6):**
- Tạo `type-the-answer-sound.js` + copy bộ mp3 THẬT của Wordwall TTA (Classic) vào `./sounds/`
  (từ `D:\APP AND DATA\AWord-data\Source\Sound effect\TYPE THE ANSWER`). Theo pattern chuẩn
  (giống tf-sound.js/balloon-pop-sound.js). Nối: `sounds.play=intro`, `restart`, `complete=gamecompleted`;
  đúng→`correct` (pool 3), sai→`wrong` (pool incorrect 3), chuyển câu→`tileFlip` (pool 4).
- Bộ TTA **KHÔNG có file tiếng gõ phím** → thêm `sound.keyClick()` vào **core/sound.js** (tổng hợp
  "tock" kiểu iPhone, tôn trọng mute). Mọi phím bàn phím ảo gọi `ui.sound.keyClick()`. Đã đo network:
  intro-01.mp3 (Play) + correct-01.mp3 (đúng) nạp OK.

**Yêu cầu 1 — điểm ✓X/30:** template tự ghi `.aw-top-score` = `✓ điểm/tổng` (`showScore`/`pulseScoreTo`).
Tử số = điểm ĐANG CHẠY (bị Minus trừ), mẫu = tổng câu. Lề trái↔phải đã cân sẵn (topbar space-between
trong padding 2.2cqw đối xứng). Đo: "0/6"→"1/6". KHÔNG đụng core.

**Yêu cầu 2 — ô nhập thấp 40%:** padding dọc + line-height giảm; đo chiều cao 1 dòng **84px→47px (−44%)**.

**Yêu cầu 3 — đáp án dài 2 dòng:** đổi `<input>`→`<textarea>` + `autoGrow` (cao theo nội dung), Enter vẫn
chấm (chặn newline); autoFit thu chữ nếu vẫn tràn. Đo: 1 dòng 47px → chuỗi dài 83px (×1.77 ≈ 2 dòng).

**Yêu cầu 4 — Andrew chỉ hiện kết quả:** bỏ `::before "Andrew ➜"`. Đo: reveal="cold", ::before=none.

**Yêu cầu 5 — câu hỏi cao lên + ô đáp án giữa khoảng trống:** stage `justify-content:flex-start` (câu hỏi
neo trên) + thêm `.aw-tta-answer-slot` (flex:1, canh giữa) bọc khối đáp án → luôn giữa khoảng câu hỏi↔bàn
phím, cả khi mở đáp án đúng. (curArea vẫn trỏ AREA nội dung để autoFit đo đúng, không đo slot flex:1.)

**Yêu cầu 6 — tiếng gõ phím:** xem phần Âm thanh (keyClick tổng hợp).

**Yêu cầu 7 — slider Minus 1–5:** `buildExtraOptions` thêm slider "Points off per wrong" (1–5), **khóa khi
bỏ tích Minus** (mkCheck callback gọi setSliderEnabled). Sai (khi Minus bật) → dấu **"−N" đỏ bay vào điểm**
và trừ N (kẹp ≥0). Đo: tick Minus→slider mở khóa, kéo=3, sai→"−3" bay (is-penalty), điểm 1→0.

**Yêu cầu 8 — bỏ "Shuffle answer order":** thêm cờ `tpl.hideShuffleAnswers` trong **core/engine.js**
(bọc dòng đó). TTA khai cờ → mất; Quiz KHÔNG khai → vẫn còn (đã test lại Quiz: còn cả 2, 0 lỗi).

**Bổ sung 2 — chấm sáng cố định size, chỉ đổi độ sáng:** keyframe `aw-tta-dot-pulse` bỏ `transform:scale`,
chỉ còn opacity. Chấm caps/numbers/Andrew cùng 0.8cqw cố định.

**Bổ sung 3 — bấm caps/numbers chỉ hiện chấm, không đổi gì khác:** bỏ rule đổi nền `#5a6b86`. Đo: nền
caps bật=tắt=rgb(72,72,75) (y hệt phím thường), chỉ chấm hiện (solid, animation none).

**Test thật qua trình duyệt** (test.html, đo DOM + ảnh + network): 11/11 đạt; **0 lỗi console**; hồi quy
Quiz OK (còn đủ 2 shuffle, 0 lỗi). **Chưa push** — chờ thầy chơi duyệt (gộp mọi đợt local khi push).
File đụng: `type-the-answer.js`, `type-the-answer.css`, **core/sound.js**, **core/engine.js**,
`type-the-answer-sound.js` (mới) + `sounds/*.mp3` (mới).

### 1/8/2026 (tiếp) — 9 việc: options timer/order/restart, bố cục cố định, bàn phím animation (⚠️ LOCAL)

Thầy chốt "ok build" + xác nhận **#9 (Apply→restart) áp cho MỌI template**. Đụng 2 file template +
**3 file core** (numberstepper.js, engine.js, app.css) — đều báo trước.

**CORE (ảnh hưởng mọi game):**
- **#1a** ô thời gian countdown nằm CẠNH nút "Count down" (không xuống dòng): gom vào cụm
  `.aw-opt-cd` (inline-flex nowrap) trong `engine.js` + rule `.aw-opt-cd` app.css. Trước bị
  `.aw-opt-row{flex-wrap}` đẩy xuống dòng.
- **#1b** number stepper **nhấn-giữ-lặp** (`numberstepper.js`): pointerdown→bước ngay + sau 320ms
  lặp mỗi 55ms, có tăng tốc nhẹ (×2 sau 10 nhịp, ×3 sau 22). Giữ nguyên bấm/kéo cũ + keydown a11y.
  Đo: giữ 700ms → 00→07 rồi thả dừng.
- **#2** "End of game (Show answers)" xuống CUỐI options (sau extra options) — `engine.js`. Đo Quiz:
  thứ tự Timer/Random/Letters/**End of game**; TTA: Timer/Random/Type the answer/**End of game**.
- **#9** Apply BẤT KỲ option nào → **tự restart** (mọi template): `engine.js` Apply luôn gọi
  `restart()` khi đang chơi (bỏ hook `optionsNeedRestart`). Restart = về màn Play (giống "Start
  again"/Anagram cũ). Đã test Quiz không hồi quy (còn Shuffle answer + Letters, 0 lỗi).

**TEMPLATE TTA — refactor bố cục lớn (`type-the-answer.js` viết lại + `.css`):**
- **Kiến trúc mới:** shell dựng 1 lần: `.aw-tta-qarea` (cao CỐ ĐỊNH ~2 hàng) + `.aw-tta-answer-slot`
  (flex:1 canh giữa) chứa khối đáp án + bàn phím (luôn giữ chỗ). `loadQuestion()` cập nhật DOM TẠI
  CHỖ; chỉ CHỮ CÂU HỎI crossfade khi chuyển câu. Bỏ `autoFit`, dùng `fitOnce` × 2: `--qfit` (thu chữ
  câu hỏi cho vừa vùng 2 hàng), `--fit` (thu khối đáp án nếu tràn slot). Bàn phím KHÔNG dùng var nào
  → không đổi size/vị trí.
- **#5** nút Submit hết nháy khi chuyển câu: khối đáp án nay PERSISTENT (không dựng lại) → Submit không
  bị fade. Chỉ câu hỏi fade.
- **#6** cụm đáp án CỐ ĐỊNH vị trí: đo blockTop = **225 cho cả 6 câu** (1 hàng & 2 hàng như nhau; câu
  dài tự thu chữ qfit 0.95). Ẩn/hiện bàn phím: blockTop = **212 ở cả 3 trạng thái** (nút Submit ngoài
  nay dùng `visibility` giữ chỗ, không `display:none`, nên khối không đổi cao).
- **#7** bật/tắt bàn phím có animation: `.is-hidden` = opacity 0 + `translateY(14%) scale(.98)` +
  transition (KHÔNG `display:none` → giữ chỗ, khối không nhích). Đo: display vẫn flex khi ẩn, có
  transition opacity/transform.
- **#3** con trỏ nhập ngắn 30%: `line-height` ô nhập 1.15→**0.8** (con trỏ = chiều cao dòng). Dòng 2
  hơi sát (đã báo thầy, chấp nhận).
- **#4** Next/Back dùng `ui.sound.keyClick()` (giống bấm chữ), bỏ tileFlip.
- **#8** bỏ ✓ ở câu cuối: `updateNav` câu cuối `onNext:null` (Next disabled, không ✓). Auto-finish khi
  mọi câu đã chấm (đo: trả lời hết 6 → "GAME COMPLETE" tự hiện). Hoặc Menu→Submit answers.

**Test thật** (test.html + Quiz, đo DOM + ảnh): 9/9 đạt; **0 lỗi console**; Quiz không hồi quy.
**Chưa push** — chờ thầy chơi duyệt (gộp mọi đợt local khi push). File đụng: `type-the-answer.js`,
`type-the-answer.css`, **core/numberstepper.js**, **core/engine.js**, **core/app.css**.

### 1/8/2026 (tiếp) — 10 việc: Submit rỗng, cỡ ô nhập (BUG fitBlock), lọc tiếng Anh, điểm âm, Auto switch, chặn submit-0 (⚠️ LOCAL)

Thầy "ok build". Đụng 2 file template TTA + **core (engine.js, app.css)** + **9 file template khác** (chỉ thêm
1 dòng countFn cho #9). Lưu ý: phiên khác đang thêm `livesSlot` (true-false hearts) vào engine.js — thay
đổi của mình coexist, đã grep xác nhận còn nguyên.

- **#2 (quan trọng) — BUG gốc làm chữ bé:** `fitBlock` cũ dùng `fitOnce` (xét CẢ chiều rộng); khối đáp
  án rộng 100% → luôn bị coi "tràn ngang" → `--fit` tụt đáy **0.5** → chữ 15px + Submit 8px. Sửa `fitBlock`
  chỉ xét CHIỀU CAO (vòng lặp riêng) → `--fit`≈0.905, chữ **28px**, Submit **15px**. Đồng thời revert
  line-height 0.8→1.15 + padding về bản trước (caret về như cũ, theo thầy).
- **#1** Submit (ngoài + trong bàn phím) khóa khi ô rỗng: `syncSubmitEnabled()` (gọi ở input/insert/
  backspace/loadQuestion/rebuild). `submitAnswer` chặn chuỗi rỗng. Đo: rỗng→disabled, gõ→enabled.
- **#3** chỉ nhận tiếng Anh: `filterEnglish()` bỏ ký tự ngoài `\x20-\x7E` mỗi lần input + compositionend
  (bàn phím tiếng Việt máy). Đo: "Tiếng Việt hello đúng rồi"→"Ting Vit hello ng ri".
- **#4** bỏ tiếng phím khi Submit: `makeKey(...,silent)`; phím Submit silent (chỉ còn tiếng đúng/sai).
- **#5** dấu X bám hàng ô nhập: dấu là con tuyệt-đối của `.aw-tta-inputrow` (không lệch khi reveal đẩy ô).
  Đo: markInInputRow=true, cùng tâm dọc ô nhập.
- **#6 (CORE)** Auto switch: checkbox global ở engine (mặc định TẮT, `draft.autoSwitch`); TTA tự next sau
  khi chấm (`opt.autoSwitch` + chưa phải câu cuối). Đo: mặc định false; bật→sai câu 1→tự sang câu 2.
- **#7** dấu X/✓ TO+DÀY hơn (size max(34,h·0.72); CSS `stroke-width:3.6` đơn vị user, KHÔNG px kẻo mỏng đi)
  + **RUNG** (scale/rotate keyframe) rồi mới bay về điểm (re-parent sang body).
- **#8** điểm ÂM: bỏ kẹp `Math.max(0,...)`; `scoreHTML` hiện `abs` màu ĐỎ (`.aw-tta-neg`) khi âm, KHÔNG dấu
  −. Đo: sai với minus 3 khi điểm 0 → hiện "3" đỏ (=−3), auto-switch sang câu sau.
- **#9 (CORE) — chặn submit khi 0 câu (MỌI template, AN TOÀN):** ⚠️ ban đầu định chặn trong `ui.finish`
  nhưng phát hiện các template latch `finished=true` TRƯỚC khi gọi ui.finish → sẽ **KẸT**. Đổi sang chặn ở
  **cấp Menu**: `ui.onSubmit(fn, countFn)` — template đưa getter đếm câu đã trả lời; Menu "Submit answers"
  chặn (+toast) nếu `countFn()===0`, KHÔNG gọi finish (nên không latch → không kẹt). Template không đưa
  countFn → y như cũ (không hồi quy). Đã thêm countFn cho 9 template: quiz `chosen!==null`, true-false
  `answered`, anagram/unjumble `doneCheck`, find-the-match `solved||skipped`, maze-chase `correct||wrong`,
  crossword `wordState.done`, gameshow `chosen!==null`, TTA `graded`. Arcade (whack-a-mole/flying-fruit/
  speaking-cards) KHÔNG đưa (không map "câu"). Đo: TTA+Quiz chặn+**KHÔNG kẹt**+trả lời rồi submit thì
  hoàn thành; anagram/crossword/gameshow chặn không lỗi; whack-a-mole không bị chặn nhầm, 0 lỗi.
- **#10** chữ Andrew hiện ra VÀNG + LẤP LÁNH: reveal is-andrew dùng gradient vàng (background-clip:text,
  text-fill transparent) + `@keyframes aw-tta-andrew-shimmer` quét sáng + drop-shadow. Đo: animationName
  đúng, gradient, text-fill transparent.

**Test thật** (TTA + Quiz + anagram + crossword + gameshow + whack-a-mole, đo DOM): 10/10 đạt, #9 an toàn
mọi template, **0 lỗi console**. **Chưa push**. File đụng: `type-the-answer.js`+`.css`, **core/engine.js**
(Auto switch + onSubmit countFn + Menu guard, KHÔNG còn guard trong ui.finish), **core/app.css** (không đổi
đợt này — bỏ qua), + 8 template khác (mỗi file +1 dòng countFn): quiz, true-false, anagram, find-the-match,
maze-chase, crossword, unjumble, gameshow.

### 1/8/2026 (tiếp) — Đảo logic fit: ô đáp án CỐ ĐỊNH cỡ, câu hỏi nhường chỗ (⚠️ LOCAL)

Thầy "ok build". CHỈ đụng `type-the-answer.js` + `.css` (KHÔNG đụng core).

- **Bỏ placeholder** "Type your answer..." → `input.placeholder = ""` (chỉ còn con trỏ). Đo: placeholder rỗng.
- **Font + ô đáp án +10%**: input 3.2→**3.52cqw**, padding 0.55→0.62cqw. Đo: 28px→**34px**.
- **⭐ ĐẢO LOGIC FIT** (thay `fitBlock`+`fitPrompt` bằng **`fitLayout`**): khối đáp án nay **CỐ ĐỊNH cỡ**
  (input/reveal/Andrew đều 3.52cqw, KHÔNG dùng `--fit` để co → `--fit` luôn=1, là "sàn" không nhỏ hơn).
  `qArea` bỏ chiều cao cố định 11cqw → **content-sized**. Khi khối cần thêm dòng (dòng 2 ô nhập / reveal /
  Andrew), `fitLayout` **thu chữ CÂU HỎI** (`--qfit`) → qArea ngắn lại → slot cao lên → khối vừa. Tức câu
  hỏi bị đẩy lên + thu nhỏ, còn ô đáp án giữ nguyên cỡ.
  - **reveal (đáp án đúng) = input**: 2.2cqw → **3.52cqw** (đo bằng nhau: 34px = 34px).
  - **Andrew = input**: đo 34px = 34px.
  - Đo "không bao giờ bé hơn": gõ đáp án 2 dòng → input GIỮ 34px (không đổi), `--qfit` 1→0.998 (câu hỏi
    nhường đúng mức cần). Câu dài "mixing blue and yellow" → --qfit 0.9; mở reveal → 0.881.
- Bỏ import `fitOnce` (không dùng nữa).

**Test thật** (test.html, đo DOM): 3/3 đạt, **0 lỗi console**. **Chưa push**. File đụng: `type-the-answer.js`
+ `type-the-answer.css`.

### 1/8/2026 (tiếp) — Căn giữa ô đáp án/reveal + màu & cân đối điểm số (⚠️ LOCAL)

Thầy "ok build". CHỈ đụng `type-the-answer.js` + `.css` (KHÔNG đụng core).

**Căn giữa "phần tử tham chiếu" giữa câu hỏi ↔ bàn phím:**
- Phần tử tham chiếu = **reveal (đáp án đúng)/Andrew hint khi đang hiện, else ô nhập**.
- `centerBlock()`: dời cả khối (`translateY`) sao cho tâm phần tử tham chiếu = trung điểm giữa
  **mép dưới câu hỏi (promptEl.bottom)** và **mép trên bàn phím thật (keyboardEl.top)** — khi bàn phím
  ẩn cộng bù 14% (do translateY ẩn). `fitLayout` đảm bảo `2·max(trên,dưới của khối quanh tham chiếu) ≤ slot`
  (thu chữ câu hỏi --qfit nếu cần) để khối căn giữa KHÔNG tràn.
- ⛔ **BẪY**: ban đầu thêm `transition: transform` cho khối → **pane phiên này KHÔNG composite frames**
  (ảnh cũng lỗi cùng lý do) làm transition đóng băng ở giá trị đầu (transform=none) → tưởng code sai.
  Thực ra toán đúng. **Bỏ transition, căn tức thì** (cũng tránh khối trượt mỗi lần chuyển câu). Đo thật:
  không reveal → gapTop=gapBottom=59 (diff 0); reveal sai "seven" → 75=75; Andrew "gray" → 73=73.

**Màu + cân đối điểm số** (`scoreHTML`): số tử tách 3 span (num/sep/total), dùng flex-gap của
`.aw-top-score` nên **num↔/ == /↔total** (đo 6px=6px). Số tử **XANH LÁ khi ≥0, ĐỎ khi âm** (không dấu −);
**gạch chéo + tổng luôn màu chữ đậm (đen)**. Đo: dương rgb(16,185,129); âm rgb(239,68,68); sep/total
rgb(35,48,62). ✓ Bỏ class cũ `.aw-tta-neg`, thêm `.aw-tta-score-num/-pos/-neg/-sep/-total`.

**Test thật** (đo DOM; pane không chụp ảnh được phiên này): tất cả đạt, **0 lỗi console**. **Chưa push**.
File đụng: `type-the-answer.js` + `type-the-answer.css`.

### 1/8/2026 (tiếp) — FIX câu hỏi bị thu nhỏ bất thường khi có reveal/Andrew (⚠️ LOCAL)

Thầy báo lỗi: câu hỏi nhỏ bất thường khi sai/bấm Andrew (ảnh: câu hỏi ~17px, reveal ~34px). CHỈ đụng
`type-the-answer.js` + `.css`.

**Nguyên nhân (đo ra):** để căn giữa reveal, `fitLayout` cần `2·(khoảng-dưới-tâm-reveal) ≤ vùng`. Khoảng
dưới gồm cả **nút Submit ẩn `visibility:hidden` vẫn chiếm 44px** + `fitLayout` dùng `slot.clientHeight`
(thiếu ~9px margin bàn phím) → cần 274px nhưng chỉ có ~186px → câu hỏi ép xuống **qfit 0.4 (min), 17.8px**.

**Sửa:**
1. Nút Submit ngoài khi bàn phím hiện: `display:none` (KHÔNG `visibility:hidden`) → không chiếm 44px vô
   hình. Reference-centering vẫn giữ ô nhập/reveal đúng chỗ khi bật/tắt bàn phím nên không cần "giữ chỗ".
2. `fitLayout`/`centerBlock` tính **vùng thật** = `keyboardTopLayout() − promptEl.bottom` (mép bàn phím
   thật ↔ mép dưới câu hỏi), thay cho `slot.clientHeight`. Thêm helper `keyboardTopLayout()` (bù 14% khi
   bàn phím ẩn). Bật/tắt bàn phím nay gọi `fitLayout()` (vì display Submit đổi).

**Đo sau sửa:** fresh 40px (qfit 1); có reveal sai → **36.5px (qfit 0.905)**, Andrew → **38.2px** — hết
crush; reveal/Andrew vẫn căn giữa (56=56, 55=55). 0 lỗi console. **Chưa push**.

### 1/8/2026 (tiếp) — FIX TRIỆT ĐỂ: khối đáp án đè bàn phím + lệch tâm sau reveal (⚠️ LOCAL)

Thầy gửi 2 ảnh máy thật: khối đáp án ĐÈ lên bàn phím + reveal KHÔNG cân (trên ~75px, dưới ~53px) sau khi
sai/bấm Andrew. Máy build KHÔNG tái hiện được (pane không composite → transition nhảy thẳng trạng thái
cuối → mọi phép đo đều "đẹp"). CHỈ đụng `type-the-answer.js`.

**Nguyên nhân:** reveal mở bằng transition grid-rows 0.32s; lần refit DUY NHẤT (cờ `refitDone` once) có
thể chạy khi reveal đang mở dở (transitionend bắn sớm/bubble) → shift/qfit tính trên số đo sai → khối nằm
thấp đè phím, và cờ chặn không cho sửa lại nữa.

**Sửa 3 lớp (hàm `scheduleRevealRefit` dùng chung submitAnswer + useAndrew):**
1. `fitLayout()` gọi NGAY khi add is-open (bố cục gần đúng từ sớm).
2. Refit ở transitionend/400ms (như cũ, có cờ early).
3. **Refit CUỐI vô điều kiện ở 750ms** — transition chắc chắn xong, số đo đúng, không bị cờ chặn.
4. **Chốt chặn cứng trong `centerBlock`**: kẹp shift trong [minShift, maxShift] (PAD 3px) — dù số đo sai ở
   đâu, khối KHÔNG BAO GIỜ đè bàn phím / che câu hỏi; khối to hơn vùng → bám mép trên bàn phím.

**Đo sau sửa (chờ qua mốc 750ms):** sai → reveal "green" cân 56/58, block bottom 267 < kbd top 270 (không
đè), câu hỏi 34.7px; Andrew "seven" cân 53/57, không đè, câu hỏi 38.2px; câu thường cân 51/51. **Mô phỏng
đúng trạng thái lỗi** (ép translateY(60px) đè phím 27px) → lượt tính lại kéo về hết đè + cân. 0 lỗi console.
**Chưa push**.

### 1/8/2026 (tiếp) — Đổi cách căn: căn giữa CẢ CỤM theo ảnh chuẩn của thầy (⚠️ LOCAL)

Thầy gửi ảnh lỗi + **ảnh chuẩn mong muốn**. So sánh ra khác biệt bản chất: code đang căn giữa RIÊNG chữ
xanh/hint (đúng theo spec chữ nghĩa đợt trước) → cụm ô nhập bên dưới bị dồn sát bàn phím. Ảnh chuẩn cho
thấy ý thật: **căn giữa CẢ CỤM** (mép trên = reveal khi mở, else ô nhập; mép dưới = Submit ngoài khi bàn
phím ẩn, else ô nhập) — gap trên cụm = gap dưới cụm. CHỈ đụng `type-the-answer.js`.

- Thay `refElement()` bằng **`blockEdges()`** (mép nhìn thấy của cụm); `neededHeight` = cao cụm;
  `centerBlock` căn tâm cụm vào tâm vùng (câu hỏi ↔ bàn phím), clamp PAD 3px giữ nguyên (không bao giờ
  đè phím). Giữ nguyên `scheduleRevealRefit` 3 lớp (fit ngay / 400ms / 750ms chốt).
- **Đo sau sửa:** câu thường 28=28; sai (reveal "green") gap câu-hỏi→reveal-top = gap input-bottom→kbd
  = **3=3** (pane build nhỏ nên vùng chật — màn thật gap thoáng như ảnh chuẩn; câu hỏi GIỮ 40px không thu);
  Andrew "went" 27=27; mô phỏng trạng thái lỗi (ép đè phím 60px) → tự kéo về 27=27 không đè. 0 lỗi console.
  **Chưa push**.

### 1/8/2026 (tiếp) — Chữ Andrew trùng nút + hết frame tràn bàn phím giữa transition (⚠️ LOCAL)

Thầy yêu cầu 2 chỉnh nhẹ. CHỈ đụng `type-the-answer.js` + `.css`.

1. **Chữ Andrew trùng khớp nút Andrew**: bỏ shimmer quét 2s cũ; chữ dùng ĐÚNG gradient của nút
   (`180deg #ffe89a→#ffc531`) + keyframe `aw-tta-andrew-textglow` **2.6s ease-in-out** mirror đúng
   cường độ halo của nút (0.6/1.6cqw ↔ 1.4/3.2cqw, cùng #ffd54a/#ffe07a/amber). Đo: gradient
   GIỐNG HỆT (rgb 255,232,154→255,197,49), duration 2.6s=2.6s, easing ease-in-out=ease-in-out.
2. **Hết 1–2 frame chữ tràn xuống bàn phím** (câu hỏi dài, lúc reveal đang trượt mở): nguyên nhân —
   cụm cao dần trong 0.32s transition nhưng căn giữ chỉ chạy ở mốc rời rạc 0/400/750ms → giữa các mốc
   có frame cụm dài quá mà chưa được kéo lại. Sửa: `scheduleRevealRefit` thêm vòng **rAF căn lại
   (`centerBlock` có clamp) MỖI FRAME suốt 800ms** — mọi khung hình đều được kẹp trong vùng, rẻ (1
   transform/frame). (Pane build không composite nên rAF không chạy ở đây — trên máy thật chạy bình
   thường; các mốc 0/400/750 vẫn bảo đảm trạng thái cuối ở mọi môi trường.)

Đo: Andrew "cold" 27=27, sai "gray" 26=26, không đè, 0 lỗi console. **Chưa push**.

## ĐỀ XUẤT SỬA CORE (nếu có)
(trống — mọi thay đổi core ở trên đã LÀM rồi, không phải đề xuất chờ xử lý.)

### 1/8/2026 (tiếp) — Tách bàn phím ảo ra `core/keyboard.js` làm BÀN PHÍM CHUẨN cho toàn hệ thống (⚠️ ĐỤNG CORE, thầy đã "ok build")

Thầy yêu cầu lấy Y HỆT bàn phím của Type the answer (4 hàng, tông tối, caps/numbers/backspace/space/
Submit-trong-bàn-phím) làm bàn phím DÙNG CHUNG cho mọi act, rồi áp luôn cho Crossword.

- **File mới**: `core/keyboard.js` — `createKeyboard({sound, onChar, onBackspace, submit?, extraKey?})`
  trả về `{el, setHidden(bool), isHidden(), refresh()}`. Bê nguyên layout/màu/animation gốc, chỉ đổi
  tiền tố class `.aw-tta-kbd*`/`.aw-tta-key*` → `.aw-kbd*` (CSS chuyển sang `core/app.css`, cuối file).
  `submit`/`extraKey` là TÙY CHỌN — game không cần thì bỏ qua (không hiện phím đó).
- **`type-the-answer.js`**: xoá hẳn `buildKeyboard/rebuildKeyboard/syncKeyboardState/makeKey/
  makeCharKey/makeLetterKey/makeBackspaceKey/makeFnKey/makeCapsKey/makeNumbersKey/makeAndrewKey/
  setCaps` (nay nằm trong core) + 2 biến `capsOn/numbersMode` (core tự quản). Gọi
  `createKeyboard({sound: ui.sound, onChar, onBackspace, submit:{onClick,isDisabled}, extraKey:{label:
  "Andrew", className:"aw-tta-key-andrew", getState, isDisabled, onClick: useAndrew}})`. "Andrew help"
  VẪN LÀ CỦA RIÊNG TTA — chỉ là phím "extra" thứ 5 mà core chừa chỗ, màu vàng/hào quang vẫn ở
  `type-the-answer.css` (khớp `.aw-tta-key-andrew` + các lớp trạng thái is-ready/is-glowing/is-used mà
  core tự gắn). Mọi chỗ từng gọi `keyboardEl.querySelector(...)` để tự tay đổi class nay gọi
  `kbd.refresh()` (core tự đọc lại `submit.isDisabled()`/`extraKey.getState()`).
- **`crossword.js`**: bỏ hẳn `KBD_ROWS`/`buildKeyboard/letterKey/key` (3 hàng chữ cũ), dùng
  `createKeyboard({sound: ui.sound, onChar, onBackspace})` — KHÔNG có `submit` (crossword tự chấm ngay
  khi gõ đủ chữ, không cần nút Submit) và KHÔNG có `extraKey` (không có "Andrew help" ở đây).
  `onChar` CHỈ nhận chữ cái (`/^[a-zA-Z]$/`), bỏ qua Space/số/dấu câu — các phím đó vẫn HIỆN trên bàn
  phím (để đồng bộ nhìn với mọi game khác) nhưng bấm không làm gì (giống hệt bàn phím thật, phím
  `onKey` vốn cũng chỉ nhận `[a-zA-Z]`).
- **Tông màu**: bàn phím LUÔN tối (không đổi theo theme) — thầy chốt khi được hỏi, để đồng bộ toàn hệ
  thống thay vì đổi theo Classic/Beach như bản Crossword cũ.
- **Đã test qua trình duyệt** (`test.html` của cả 2 template, đo DOM qua `javascript_tool` vì pane
  phiên này không composite frames được — xem mục tương tự ở các đợt trước):
  - TTA: gõ "green" bằng bàn phím ảo mới → is-correct + điểm lên; bấm Andrew → reveal vàng "Andrew ready"
    → glowing → submit → "used" + khoá cả ván; caps/numbers vẫn hoạt động, Submit trong bàn phím vẫn
    khoá khi ô rỗng/đã chấm. 0 lỗi console.
  - Crossword: gõ "CARRY" bằng bàn phím ảo (giả lập `.click()` qua DOM vì click chuột thật bị lỗi toạ
    độ (0,0) trong pane phiên này) → ô tự điền + điểm lên + tự chuyển từ kế tiếp; gõ sai đủ 7 ký tự →
    tự lộ đáp án đúng ("CORRECT") + không cộng điểm + chuyển từ kế tiếp. Bàn phím hiện tông tối đúng
    như TTA. 0 lỗi console.
- File đụng: **core/keyboard.js** (mới), **core/app.css** (thêm CSS `.aw-kbd-*`, cuối file),
  **core/HUONG DAN CORE.md** (thêm mục lục), `type-the-answer.js`+`.css`, `crossword.js`+`.css`.

---

## Đợt 140 (13/8/2026) — BẢNG OPTIONS v2: tuỳ chọn riêng của template này chuyển sang lưới chung
✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Thầy yêu cầu thiết kế lại toàn bộ bảng Options (*"rất rối, khó nhìn, không thẳng
hàng"*); chi tiết đo đạc + 5 luật mới nằm ở `../../GHI CHU DU AN.md` Đợt 140 và
`../../core/HUONG DAN CORE.md` mục **"OPTIONS PANEL v2"**.

**Đổi ở template này**: `buildExtraOptions` viết lại bằng 4 hàm dựng chung engine truyền vào —
`mkCell` · `mkSeg` (thay hàng radio) · `mkSliderCell` (thanh trượt + chip giá trị 52px) ·
`addCheck` (đẩy ô tick vào khối switch dùng chung ở đáy panel).
**KHÔNG đổi**: tên trường trong `draft`/`activity.options`, khoảng giá trị, mặc định, hay bất kỳ hành
vi nào lúc chơi. Act cũ mở lên vẫn đúng y như trước.

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **400px → 274px**.
