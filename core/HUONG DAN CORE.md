# HƯỚNG DẪN CORE — luật chơi chung cho mọi session

> Đọc file này TRƯỚC khi build bất kỳ template nào. Đây là "hợp đồng" giữa **core** (lõi dùng chung)
> và **template** (từng game riêng, vd Quiz, Anagram...).

## ⚠️ ONLINE từ v0.7.4 — thư viện nằm trên Firestore, phải ĐĂNG NHẬP

`core/store.js` không còn lưu vào máy nữa: thư viện của thầy ở **`users/{uid}/items/{id}`** trên
Firestore (project `aword-70dae`). Điều này ảnh hưởng tới mọi người build sau:

- **Mọi hàm của store.js chỉ chạy khi ĐÃ đăng nhập.** Gọi lúc chưa đăng nhập sẽ ném lỗi có
  `err.code === "aw/signed-out"` — hãy bắt và mời đăng nhập, đừng để crash.
- **API xuất ra KHÔNG đổi** so với bản localStorage (vẫn async y hệt) → code cũ gọi store không phải
  sửa. Giữ nguyên nguyên tắc này khi thêm hàm mới: **luôn async**.
- **Firestore từ chối `undefined`** — store.js có `clean()` lọc trước khi ghi. Nếu bạn ghi thẳng
  Firestore ở chỗ khác, nhớ lọc tương tự.
- `core/firebase.js` nạp SDK **lazy qua CDN** (pin `12.9.0`) để giữ zero-build — xuất
  `auth()/db()/fs()/signIn()/signOutNow()/onUser()/currentUser()/isTeacher()`.
- Hướng dẫn + luật bảo vệ Firestore: `docs/08-FIREBASE-SETUP.md`.

## ⚠️ CHẾ ĐỘ HỌC SINH từ v0.8.0 — `startGame(root, activity, { session })`
### (viết lại Đợt 246, 23/8/2026 — PRACTICE/SUBMIT + gửi bài chắc chắn)

`play.html` (trang HS) gọi engine với thêm một `session`. Template KHÔNG cần biết gì về nó, nhưng
người sửa engine thì phải nhớ:

| Trường | Việc gì |
|---|---|
| `session.endOptions` | `{showAnswers}` — Ô TÍCH DUY NHẤT còn lại trên form Set assignment (Đợt 246). `leaderboard`/`startAgain` vẫn nằm trong document (giữ khuôn) nhưng **không ai đọc nữa** — hai màn cuối game tự có leaderboard/Start again theo thiết kế |
| `session.playerName` | tên HS (myLesson truyền qua `&n=`, hoặc gõ tay ở màn tên) |
| `session.className` | lớp (`&lop=`) — màn READY hiện "TÊN • LỚP" |
| `session.submit(r)` | BẮT ĐẦU gửi 1 lượt → `Promise<{ok:boolean}>`, **không bao giờ reject**. Đợt 246: engine chỉ gọi ở chế độ **SUBMIT**, NGAY khi Game Complete (gửi ngầm) |
| `session.retrySubmit()` | gửi lại **CÙNG lượt đó** (cùng id cố định ⇒ không bao giờ đẻ dòng trùng) |
| `session.attemptId()` | mã lượt — in trên bảng "HÃY CHỤP LẠI MÀN HÌNH" |
| `session.meta` | `{assignmentTitle, code}` — cũng cho bảng đó |
| `session.entries()` | bảng xếp hạng lớp (Promise) — **TẤT CẢ** học sinh, lượt tốt nhất mỗi em |

⭐⭐⭐ **Đợt 246 — HAI CHẾ ĐỘ (`hwMode`, chọn lại MỖI lượt trên màn READY):**
- **PRACTICE** (nút tạ vàng, trái): không gửi gì, dữ liệu chỉ trong trang. Menu cuối: Show answers
  (nếu tích) · Start again · **Start with mistakes** (chỗ DUY NHẤT học sinh được luyện lỗi —
  `mistakesAvailable()` mở khi `hwMode === "practice"`). Ván `_mistakes` trong chế độ HS chỉ có
  nút PRACTICE — nộp một ván cụt là nộp bài sai.
- **SUBMIT** (icon play cũ, phải): `finish()` gửi ngầm ngay. Màn cuối là **BẢNG ĐÔI**
  (`showHomeworkEnd`): trái leaderboard tự hiện (chữ tự co/nở 0.28–2× — fit theo CHIỀU CAO **và**
  điều kiện "không tên nào bị …"; ⛔ đừng thay bằng `fitOnce` của core/fit.js — nó đo cả bề ngang
  mà bảng grid luôn lấp đầy bề ngang nên bị ép xuống đáy 0.28; ⛔ đo tên bằng rect SỐ THỰC của span
  `.aw-lb-nametext`, KHÔNG dùng `scrollWidth` — số nguyên và không thấy tràn nửa pixel), phải =
  điểm + nút **SUBMIT HOMEWORK** + Show answers (nếu tích) + Start again.
- ⛔⛔ **CÚ BAY VÀO LEADERBOARD KHÔNG BAO GIỜ CHẠY TRÊN HY VỌNG** — chỉ sau khi
  `{ok:true}` từ `core/assignments.js` (CẢ dòng điểm công khai LẪN bài chi tiết đều được server
  xác nhận). Lỗi ⇒ màn tiếng Việt: GỬI LẠI BÀI TẬP / CHỤP ẢNH MÀN HÌNH (hướng dẫn + bảng chụp).
- Cơ chế gửi chắc chắn (id cố định + outbox localStorage + retry + luật create-only làm bằng chứng
  "đã tới nơi") nằm TRỌN trong `core/assignments.js` (`queueAttempt`/`sendAttempt`/`flushOutbox`) —
  đọc header của nó trước khi sửa. `play.js` flush outbox mỗi lần mở trang.

Có `session` thì engine **không dựng** cụm công cụ của thầy (Options/Template/Style/Edit/Assignment/
Print/Home) và bỏ "Change template" — đây là hàng rào để HS không lọt vào công cụ soạn bài.

## ⚠️ v0.9.0 — HAI LUẬT MỚI KHI SỬA CORE

**(1) KHÔNG được trùng tên** (thầy chốt): thư mục con trong cùng một thư mục · act trong cùng một
thư mục · bài giao trong cùng một thư mục Results. `core/store.js` ném `err.code === "aw/duplicate-name"`
— chỗ gọi phải BẮT và hiện lỗi cho thầy sửa, đừng để hộp thoại đóng im lặng. Hành động máy tự làm
(Duplicate, Restore) thì đếm lên "(2)" thay vì báo lỗi.

**(2) Trang học sinh không được nạp code chạm tới thư viện.** `core/engine.js` nạp **trì hoãn**
(`await import(...)`) cả `assignment-ui.js` lẫn `store.js`, chỉ trên đường của thầy. Nếu bạn thêm
`import` tĩnh của store/assignment-ui vào engine (hoặc vào file engine kéo theo), `play.html` sẽ tải
chúng và lời hứa đó vỡ. Kiểm nhanh: mở play.html rồi chạy
`performance.getEntriesByType('resource').map(r => r.name)` — không được thấy `store.js`.

## ⚠️⚠️ FONT TIẾNG VIỆT — `unicode-range` là BẮT BUỘC, không phải trang trí (v0.9.50)

Font chung **Baloo 2** nay khai **8 khối `@font-face`** trong `core/app.css`: 4 khối trỏ file **latin**
(`baloo-2-400/600/700/800.woff2`, font tĩnh) + 4 khối trỏ file **tiếng Việt** (`baloo-2-vi.woff2`, MỘT
file biến thiên dùng chung cả 4 độ đậm). Trước v0.9.50 chỉ có 4 khối latin, và **102/178 chữ cái tiếng
Việt bị mượn glyph của Segoe UI** → một từ hiện bằng hai font ("ĐƯỜNG" = Segoe `Đ Ư Ờ` + Baloo `N G`).

**Ba luật phải giữ — sai một cái là tiếng Việt hỏng lại, im lặng, không lỗi console:**

1. **MỌI khối latin phải có `unicode-range`.** Khối không khai là **nhận toàn bộ Unicode**; Chrome tin
   lời khai chứ không tin cmap thật, nên nó chọn face latin cho chữ ă/đ/ơ/ư, thấy không có glyph, rồi
   **nhảy thẳng sang FAMILY kế tiếp** mà không ngó khối tiếng Việt (đo được: file VN **chưa từng được
   tải**). Thêm một độ đậm mới mà quên `unicode-range` = hỏng ngay.
2. **KHÔNG gộp 4 khối tiếng Việt thành 1 khối `font-weight: 400 800`.** Trông gọn hơn (cùng 1 file) nhưng
   đặt một DẢI độ đậm cạnh 4 khối latin khai giá trị ĐƠN làm Chrome thôi ghép family: face vẫn `loaded`,
   `unicode-range` vẫn đúng, mà **không ký tự nào dùng nó**. Phải tách đúng 4 khối, mỗi khối 1 độ đậm —
   đúng hình dạng Google Fonts tự phục vụ.
3. **Đừng đổi 4 file latin sang bản khác** mà không đo lại chỉ số dọc. File VN được chọn vì chỉ số dọc
   **trùng khít** file tĩnh (unitsPerEm 1000 · typoAscender 1078 · typoDescender −524 · winAscent 1050 ·
   winDescent 524) → chữ Việt cùng baseline, không xô lệch bố cục. Lệch chỉ số = lệch dòng toàn app.

**Bẫy khi tự kiểm:** `canvas.measureText` **không kích hoạt tải font**. Face chưa dùng tới luôn báo
`unloaded`, nên đo bề rộng sẽ kết luận "vẫn mượn font" **oan**. Phải đặt chữ Việt thật vào DOM (hoặc gọi
`FontFace.load()`) rồi mới đo.

## ⚠️⚠️ `line-height` CHO CHỮ VIỆT — tối thiểu 1.35 ở mọi ô hiển thị nội dung (v0.9.51)

Baloo 2 có dòng tự nhiên **1,602em** (ascent 1,078 + descent 0,524). Chữ Việt cao hơn chữ Anh nhiều:
ink của **Ẳ = 1,063em**, của **Ạ = 0,234em** dưới baseline; chữ Anh HOA chỉ 0,70em.

**Luật: mọi phần tử hiển thị NỘI DUNG của thầy (câu hỏi · clue · prompt · ô đáp án · thẻ · tiêu đề act)
phải có `line-height` ≥ 1.35.** Lý do chính **không phải** chống xén mà là **chống chồng dòng**: khoảng
cách baseline–baseline phải ≥ `1,063 + 0,234 = 1,297em`, nếu không thì dấu của dòng dưới **đâm vào**
phần thò xuống của dòng trên — xảy ra ở MỌI template, dù có khung cắt hay không. Các ô chỉ hiện
**số/biểu tượng** (đồng hồ, tim, bộ đếm, mũi tên, logo) thì **giữ nguyên**, nâng chỉ xô lệch bố cục.

**Phần dư 0,111em:** ngay ở 1.35, ink của Ẳ vẫn vượt hộp dòng 0,111em. Chỉ thành lỗi khi chữ nằm **sát
mép một khung `overflow:hidden`** — khi đó bù bằng `padding`, **đừng** đẩy `line-height` lên 1,57 (khối
chữ cao thêm ~40%, `autoFit` sẽ co chữ thấy rõ). ⚠️ Với chữ **căn giữa** trong khung flex, `padding`
chỉ ăn **một nửa** giá trị (hộp to ra thì phép căn giữa kéo ngược lại `P/2`) — xem `.aw-tta-prompt`
(0.24em, căn giữa) so với `.aw-quiz-question` (0.14em, căn trên).

### ⚠️⚠️ BẪY ĐO ĐẠC — `Range.getBoundingClientRect()` KHÔNG phải hộp dòng

Nó trả về **hộp FONT**: mép trên = `baseline − fontAscent`, KHÔNG phải mép trên hộp dòng. Ai tưởng nhầm
sẽ cộng thừa một lần `half-leading = (line-height − 1,602em)/2` — số này **luôn âm** khi `line-height`
< 1,60 → báo "bị xén" **gấp đôi sự thật** và dựng ra cả những chỗ xén không có thật (đã cắn: 2/5 chỗ
trong bản khảo sát đầu là dương tính giả).

```
inkTop = rangeTop + fontAscent − ink(Ẳ)          // ĐÚNG
inkBot = rangeBottom − fontDescent + ink(Ạ)
```

Và **đo ink của Ẳ/Ạ bằng đúng font + đúng độ đậm của chính phần tử đó** (`ctx.font = computedStyle`),
đừng dùng một hằng số chung — mỗi độ đậm cho ra một con số khác.

⚠️ **Running word cố ý KHÔNG áp luật này** (4 luật `line-height` thấp còn nguyên): game đọc–gõ từ tiếng
Anh, cửa sổ 3 dòng dựa trên `calc(100%/3)` + `translateY` rất nhạy, và đo cho thấy không xén. Muốn dùng
nó với từ tiếng Việt thì phải đo lại cửa sổ 3 dòng trước.

## ⚠️⚠️ MÀN CẢM ỨNG (TOMKO) — tap highlight của Chrome, đã vá TOÀN APP ở `app.css` (v0.9.40)

**Triệu chứng thầy báo (4/8/2026, CHỈ máy 3):** chạm vào ô đáp án hay nút Next/Back (đều bo góc mềm)
thì đúng khoảnh khắc nhấn hiện ra một mảng nền **GÓC VUÔNG** thò ra ngoài viền bo tròn, rất xấu. Có ở
cả Chrome lẫn myActivity; máy 1 và máy 2 không bao giờ thấy.

**Nguyên nhân:** giá trị MẶC ĐỊNH của Chrome `-webkit-tap-highlight-color: rgba(0,0,0,0.18)` — lớp phủ
đen mờ Blink vẽ khi nhận input **CHẠM**, và hình dạng lớp phủ này **KHÔNG bám border-radius**. Máy 1/2
điều khiển bằng **CHUỘT** nên lớp phủ này không bao giờ được vẽ → lỗi trông như "chỉ máy 3 bị" trong khi
thực chất là mặc định của CSS. **Không liên quan GPU/driver** (đo tải chỉ 1-2%), cũng **không phải phản
hồi chạm của Windows** (máy này `ContactVisualization = 0`, tức đang tắt).

**Đã vá:** đúng **1 luật ở gốc** trong `core/app.css`:
```css
html { -webkit-tap-highlight-color: transparent; }
```
Thuộc tính này **KẾ THỪA**, nên khai một lần ở gốc là phủ mọi trang (khung game, thanh dưới, cụm công cụ
dưới khung, editor, trang chủ, modal, popup in) và **mọi template về sau** — không phải nhớ thêm luật cho
từng game. Phản hồi khi nhấn KHÔNG mất, vì mọi nút vốn đã có `:active` riêng.

**Đo thật 4/8/2026 (14/14 template, trình duyệt thật trên chính máy 3):**
- Trước: mỗi game 12 phần tử dùng chung mang `rgba(0,0,0,0.18)` (`.aw-navbtn` ×2 · `.aw-iconbtn` ×4 ·
  `.aw-toolbtn` ×3 · `.aw-toolbtn-sm` ×4) cộng ô riêng của game — Crossword nặng nhất **143** (92 ô chữ
  + 40 phím + 11 nút chung), Type the answer **53** (cả bàn phím ảo `core/keyboard.js`), Quiz **16**.
- Sau: **392/392 phần tử bo góc bấm được = `rgba(0, 0, 0, 0)` · 0 phần tử còn dính · 0 lỗi console.**
- Chỉ Open the box và Maze chase vốn đã sạch — đúng 2 file DUY NHẤT tự đặt sẵn thuộc tính này. Chính sự
  trùng khớp đó chốt được nguyên nhân.
- Editor vẫn gõ/bôi chọn chữ bình thường (`userSelect: auto` trên ô nhập) — bản vá KHÔNG đụng
  `user-select`.

> ⚠️ **LUẬT CHO MỌI TEMPLATE VỀ SAU:** ĐỪNG chép lại luật này vào CSS template nữa (Open the box và
> Maze chase còn giữ bản của mình chỉ vì lý do lịch sử, vô hại). Đã có ở gốc rồi. Và **tuyệt đối không**
> đặt `-webkit-tap-highlight-color` về một màu khác trong template — làm vậy là bật lại lỗi cho đúng
> game đó.

## ⚠️ BẪY BÀN PHÍM — phím dựng lúc disabled từng CHẾT VĨNH VIỄN (đã VÁ 4/8/2026, v0.9.42)

**Triệu chứng:** một phím chức năng của `core/keyboard.js` (caps · numbers · phím `extraKey` riêng của
template, điển hình là **"Andrew"**) hiện ra bình thường, hết mờ đúng lúc, nhưng **bấm mãi không ăn** —
không lỗi console, không dấu vết gì.

**Nguyên nhân:** `fnKey()` trước đây gắn `onclick` **CHỈ KHI phím không disabled lúc DỰNG**:

```js
if (disabled) b.disabled = true;
else if (onClick) b.onclick = ...;      // ← phím sinh ra lúc disabled thì KHÔNG có dòng này
```

mà `refresh()` về sau **chỉ đổi `.disabled`**, không bao giờ gắn bù handler. Nên phím nào sinh ra ở
trạng thái disabled là chết hẳn cả phiên. `extraKeyEl()` còn làm nặng thêm: nó truyền thẳng `null`
làm `onClick` khi đang disabled.

**Đã cắn 2 lần:**
- **Crossword** (trước đó): tác giả phải bẻ cong `isDisabled` thành `(curWord >= 0 && ...)` chỉ để
  phím không bị disabled lúc dựng — có ghi chú "must NOT be disabled at build time" ngay trong code.
- **Running word** (4/8/2026): dựng bàn phím ở màn setup trước trận (`phase === "setup"`) → phím
  Andrew chết suốt ván. Chỉ lộ ra khi BẤM THỬ THẬT trong trình duyệt.

**Bản vá:** `fnKey()` **luôn gắn handler**, còn `disabled` một mình quyết định bấm được hay không
(`<button disabled>` không bao giờ phát sự kiện click, nên gắn sẵn là an toàn tuyệt đối); `extraKeyEl()`
thôi truyền `null`. Đo lại: dựng lúc disabled → bấm **0 lần ăn**; `refresh()` mở khoá → bấm **ăn ngay**
(trước đây vẫn 0). Hồi quy Type the answer · Crossword · Running word đều bình thường, 0 lỗi console.

→ **Từ nay template được tự do dựng bàn phím ở bất kỳ trạng thái nào**, kể cả khi mọi phím đang khoá.

## ⭐⭐ ÂM THANH — NẠP TRƯỚC cả pack, đừng tạo `<audio>` lúc cần phát (Đợt 85, 7/8/2026)

**Triệu chứng thầy báo:** gần như MỌI hiệu ứng âm thanh đều trễ so với hình; chơi được một lúc,
hoặc bấm Start again, thì mới khớp.

**Nguyên nhân:** cả 14 template đều chép chung một khuôn, tạo `<audio>` **đúng lúc cần phát**:

```js
if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
a.currentTime = 0; a.play();
```

Nên LẦN ĐẦU của mỗi tên file phải **đi mạng lấy file rồi mới kêu**. Đo trên bản live:
**lần đầu 67–363ms, các lần sau 5–19ms**. Một game có 10–47 file → cả lượt chơi đầu tiên lệch tiếng,
tới khi mỗi file đã kêu một lần thì hết. Khớp chính xác điều thầy mô tả.

**KHÔNG phải do định dạng.** Đã đo 8 cặp `.ogg` gốc của Wordwall ↔ `.mp3` của AWord: khoảng lặng đầu
file **chênh 0ms** (Chrome tự cắt phần đệm mã hoá của MP3 nhờ header LAME), chi phí giải mã ngang nhau.
Wordwall khớp tiếng là nhờ nó **nạp trước**, không phải nhờ ogg. Đừng tốn công đổi sang ogg/wav.

**Cách làm đúng — `core/sfx.js`:**

```js
import { createPack } from "../../core/sfx.js";

const pack = createPack(import.meta.url, {
  names: [...],        // MỌI file template này phát
  hot:   [...],        // các tiếng nổ ra TRONG lúc chơi — xếp hàng tải trước
  skip:  ["music"]     // nhạc nền dài: phát kiểu stream, đừng kéo trước cho nghẽn đường
});
const playFile = pack.play;   // (name, volume?)
const makePool = pack.pool;   // (names, volume?) — chọn ngẫu nhiên, không lặp lại liền
pack.prime();                 // ⭐ ĐÂY là bản vá
```

`prime()` chạy ngay lúc module được **import**, mà `ensureTemplate()` import module **trước khi** màn
READY được vẽ → tới lúc thầy bấm PLAY thì file đã nằm sẵn. **Đo sau khi vá: 8ms cho lần đầu** (so với
67,5ms). Nạp 4 file một lúc (`PRIME_CONCURRENCY`) để pack 47 file không giành hết đường truyền lớp học.

**Số đo chống lại các phương án khác** (đừng làm lại từ đầu):
- Giải mã sẵn ra AudioBuffer của Web Audio: **6,7ms** — nhanh hơn 1,3ms nhưng tốn **3,6–49MB RAM** mỗi
  pack (gameshow 47 file = 49,3MB nếu giải mã hết). Không đáng.
- Sợ nhiều `<audio>` sống cùng lúc bị Chrome thu hồi: đã đo **200 element** cùng lúc, cái CŨ NHẤT vẫn
  phát trong **11ms**, `readyState 4`. Không cần cơ chế LRU.

**Luật cho template về sau:**
1. **KHÔNG tự viết `new Audio()`/`audioFor`/`makePool` nữa** — dùng `createPack`. Ngoại lệ duy nhất
   hiện có là nhạc nền lặp của Gameshow (một element riêng, cố ý stream).
2. **Khai đủ `names`.** Thiếu tên nào thì đúng tiếng đó lại trễ như cũ — và **im lặng**, vì nó vẫn kêu.
   File nằm trong `./sounds/` nhưng template không dùng thì **đừng khai** (khỏi tải phí).
3. **Template tự tổng hợp tiếng bằng Web Audio** (crossword, running word, running team) phải dùng
   **`coreSound.context()`**, đừng `new AudioContext()` riêng: context mới toanh làm tiếng ĐẦU TIÊN trễ
   ~37ms (đo: 48ms so với 10,7ms) vì phải khởi động thiết bị âm thanh.
4. `core/sound.js` tự gọi **`warmup()`** ở cú chạm/gõ phím ĐẦU TIÊN trên trang (nghe ở pha capture) —
   dựng + resume context, đẩy 1 mẫu câm cho thiết bị chạy. Không phải gọi tay, và **đừng gỡ** cái hook đó.
5. Kiểm nhanh xem pack đã sẵn sàng chưa: `window.__awSfxPacks.map(p => p.stats())` →
   `{total, built, ready, primed}`; `ready === total` là đủ.
6. **Đợt 122**: `prime()` nay **trả về Promise** và pack có thêm `whenPrimed()`; `core/sfx.js` xuất
   `whenAllPacksPrimed()` để engine **giữ nút PLAY** tới khi tiếng sẵn sàng. Trước đó prime() chạy
   ngầm nên ai bấm PLAY thật nhanh trong giây đầu **vẫn** hụt tiếng lần đầu — Đợt 85 mới chỉ tải sớm,
   chưa chặn. Đo thật (Gameshow, 46 file, localhost): PLAY hiện đúng lúc **861ms** = đúng lúc pack báo
   `ready === total`. Template không phải sửa gì: 17 nơi đều gọi trần `pack.prime();`.

⚠️ **File mp3 của pack đã được nén lại ở LAME VBR `-q:a 6`** (Đợt 85): 10,25MB → **6,42MB (nhỏ hơn 37%)**,
độ dài và khoảng lặng đầu file giữ nguyên. Thêm file mới thì nén cùng mức cho đồng bộ.
⚠️ **ĐỪNG ghép file theo ĐỘ DÀI.** Bản đầu của đợt này định lấy lại `.ogg` gốc để đỡ một đời nén, ghép
ogg↔mp3 bằng cách so độ dài — kết quả **57 file bị thay bằng âm thanh KHÁC hẳn cùng độ dài** (chỉ
GAMESHOW và MAZE CHASE có ogg gốc, vậy mà anagram/whack-a-mole cũng "khớp"). Độ dài không phải danh tính.

## ⭐⭐ GIỌNG ĐỌC TTS — LUÔN nén MP3 trước khi lưu, và 3 bẫy (Đợt 121, 12/8/2026)

`core/tts.js`'s `generateSpeechDataUrl()` nay trả **`data:audio/mpeg`** (MP3 48 kb/s mono) chứ không
còn WAV. Nén ngay trong hàm đó nên **mọi nơi gọi đều được hưởng, không phải sửa gì**; nơi phát chỉ gán
chuỗi vào `<audio>.src` nên **clip WAV cũ vẫn phát bình thường**. Lý do: Kokoro trả PCM 32-bit float
768 kb/s, mà mỗi clip là 1 document Firestore lưu base64 (+33%) ⇒ ~186KB/từ, trong khi gói Spark chỉ
có 1 GiB. Nén xong đo thật: **giảm 14,8–15,7 lần**, tốn thêm ~110ms/từ.

⚠️ **BẪY 1 — `generateSpeechDataUrl` CHẠY CẢ TRONG WEB WORKER** (`core/tts-worker.js`, đường sinh hàng
loạt của `core/voice-batch.js`). Worker **KHÔNG có `AudioContext`**. Mọi cách xử lý âm thanh kiểu
`decodeAudioData` / `OfflineAudioContext` / `MediaRecorder` sẽ **chết ở đường hàng loạt trong khi đường
1-từ vẫn chạy ngon** — bug chỉ lộ khi import cả bộ từ. Kokoro đã trả sẵn
`RawAudio {audio: Float32Array, sampling_rate: 24000}` → xử lý thẳng từ đó.

⚠️ **BẪY 2 — `decodeAudioData` TỰ RESAMPLE lên tần số thiết bị.** Cùng một file 24kHz, đo qua
`AudioContext` ra **48000 Hz**: gấp đôi số mẫu, không thêm một chút chất lượng nào. Đừng cho âm thanh
đi qua Web Audio chỉ để "đọc mẫu ra".

⚠️ **BẪY 3 — ĐỪNG "tối ưu" MP3 sang Opus.** Opus nhỏ hơn ~3x nữa và Chrome có sẵn WebCodecs (không cần
thư viện), nhưng **Safari chỉ phát được Opus từ iOS 18.4 (3/2025)** → HS dùng iPad đời cũ sẽ **câm
tiếng**, đúng loại bug mà máy build Chrome/Windows mù hoàn toàn (cùng họ với bẫy
`-webkit-tap-highlight-color`). MP3 chạy mọi trình duyệt, mọi đời máy. Đây là quyết định CÓ CHỦ Ý —
và **✅ ĐÃ NGHIỆM THU: thầy tự test iPhone + iPad + Windows, nghe tốt cả ba** (12/8/2026). Không bàn lại.

Ghi chú: MP3 chèn ~55ms im lặng ở đầu clip (đo: 1,025s → 1,08s). Vô hại với giọng đọc từ đơn, nhưng
nhớ nếu sau này dùng TTS cho thứ cần khớp thời điểm chính xác.

## ⭐⭐ PRESS() — KÍCH HOẠT NGAY LÚC CHẠM (`core/press.js`, Đợt 175, 17/8/2026)

**LUẬT: mọi bề mặt CHƠI (ô đáp án, hộp, ô chữ, phím ảo, nút loa, PLAY, Submit) phải gắn qua
`press(el, handler)` — CẤM quay lại `el.onclick` cho bề mặt chơi.** Lý do sống còn (màn hồng ngoại
TOMKO): `click` chỉ sinh từ con trỏ CHÍNH (cú chạm thứ hai khi đa điểm bị vứt trắng — gốc lỗi bất
công Fight thầy báo 17/8/2026) và chỉ bắn khi NHẤC TAY (màn hồng ngoại nhận nhấc tay chậm).

`press()` bắn handler ngay tại `pointerdown`, mỗi ngón một pointer độc lập (thứ tự chạm = thứ tự kích
hoạt), và tự lo 4 việc: nuốt `click` sinh kèm (chống đúp — nhận diện bằng `isTrusted`/`detail`,
KHÔNG dùng đồng hồ) · vẫn chạy với `el.click()` lập trình (fight relay PLAY, myActivity, test-bench)
và Enter/Space bàn phím cứng · chặn chạm dội <90ms cùng phần tử (`BOUNCE_MS`) · tôn trọng `disabled`
(kiểm tay — đừng tin trình duyệt chặn hộ pointer trên nút disabled).

**5 điều PHẢI biết khi dùng:**
1. Handler nhận PointerEvent (hoặc MouseEvent ở 2 nhánh fallback). **Nút loa nằm TRONG ô bấm phải gọi
   `e.stopPropagation()`** y như thời click — chạy đúng ở tầng pointerdown.
2. **CẤM preventDefault pointerdown** (trong press lẫn trong handler): Chromium sẽ bỏ `:active`
   (mất phản hồi nhấn) và bỏ chuỗi mouse-compat mà `keyboard.js` dựa vào để giữ focus.
3. Gỡ kích hoạt = `el.disabled = true` (xem gameshow.js teardown). KHÔNG có cơ chế gỡ listener —
   phần tử chơi vốn bị vứt/dựng lại theo vòng đời game.
4. **Phần tử cần PHÂN BIỆT chạm với kéo/vuốt thì KHÔNG dùng press()**: thẻ chữ Unjumble, vuốt Maze
   chase, ô điểm tay Fight (chạm +1 / vuốt −1) — chúng tự lo pointer + `touch-action:none` riêng.
5. ⚠️ **Chrome giáo viên (toolbar Options/Template/Style/Mode, ☰ Menu, ‹ ›, panel item, màn setup)
   CỐ Ý còn là click — ĐỪNG "tiện tay" chuyển.** 4 listener đóng-khi-bấm-ra-ngoài (engine.js ×2,
   running-word, running-team) nghe `pointerdown` và được vũ trang qua `setTimeout(0)` sau cú click
   MỞ: đổi nút mở sang press là mở-đóng trong CÙNG nhịp, bảng tự sập ngay. Muốn chuyển thì phải làm
   lại cơ chế vũ trang đó trước (vd. vũ trang ở pointerup, hoặc lọc `e.target` nằm trong panel).

`touch-action: manipulation` đã áp ở `.aw-stage` + `.aw-fight` (app.css) — template mới KHÔNG cần tự
khai lại, trừ khi cần `none` cho cử chỉ kéo riêng.

## ⭐⭐ PLAY MODE — MƯỢN TEMPLATE KHÁC MỘT LÚC (RUNNING · IPA, Đợt 190, 18/8/2026)

Nút **MODE** nay có 5 ô: Single · Fight · Showdown · **RUNNING** · **IPA**. Hai ô mới KHÁC hẳn Fight và
Showdown ở chỗ chúng **không phải luật chơi mới** — chúng là một act từ vựng được **template khác mượn
tạm**, còn act trong thư viện thì y nguyên.

| | Fight / Showdown | RUNNING / IPA |
|---|---|---|
| act đang chơi | vẫn act đó | **bản chuyển đổi tạm** (`conv_…`) |
| bật bằng | cờ trên template (`fightMode`…) | **NỘI DUNG act có đi tới đó được không** |
| đường ra | `exitFight()` / bỏ pick | `doSwitchTemplate(originAct.type)` |

**Máy móc bên dưới CHÍNH LÀ Change template** — `convertActivity(originAct, …)` rồi `startGame` với
`base: originAct`. Thứ duy nhất thêm vào là dấu **`activity._mode`** (`"running"` | `"ipa"`), và engine
đọc nó thành `playMode` rồi đóng lên stage một class `mode-<x>`.

⚠️⚠️ **`_mode` KHÔNG PHẢI TRANG TRÍ — nó là TRÍ NHỚ.** Một act đã chuyển đổi không tự nói được VÌ SAO nó
bị chuyển. Không có dấu này thì: nút MODE không sáng, bảng chọn không biết đang ở đâu để ẩn ô đó, và
`.mode-ipa` không tồn tại nên nút Template không giấu được.

⚠️⚠️ **`|| playMode` TRONG ĐIỀU KIỆN DỰNG NÚT MODE LÀ ĐƯỜNG RA DUY NHẤT.** Running word và Speaking cards
không khai `fightMode` cũng không khai `showdownMode`. Điều kiện cũ (`canFight || canShowdown`) sẽ **không
dựng nút** ngay khi vừa vào chế độ ⇒ chế độ thành **căn phòng không cửa**, chỉ thoát được bằng tải lại
trang. Thêm chế độ thứ ba sau này thì đây là dòng phải kiểm TRƯỚC.

⛔⛔ **CẤM HIỆN HÀNG BỘ GỢI Ý (`makeContentSwitch`) TRONG PLAY MODE — cắn thật ở Đợt 190.**
Trong 2 chế độ này hàng ENG1/ENG2/VI1/VI2 **không đổi được gì** (RUNNING bỏ hết clue, IPA luôn dựng thẻ từ
bộ phiên âm). Tệ hơn: bấm một bộ rồi Apply chạy `applySubActSelection()`, mà cú dựng lại của nó đi qua
`doSwitchTemplate()` — **không kèm `style` cũng không kèm `_mode`** ⇒ bộ thẻ âm thầm quay về định nghĩa
tiếng Anh, nút Template hiện lại, nút MODE thôi sáng. **Luật chung suy ra: mọi thứ dựng lại act trong một
play mode đều phải mang theo CẢ `style` LẪN `_mode`, hoặc phải bị chặn từ đầu.**

⚠️ **`convertActivity(act, type, { style })`** — `style: "ipa"` là cách DUY NHẤT bảo Speaking cards in
`WORD /ipa/` thay vì clue. Đường Change template thường **không** truyền `style` và giữ nguyên hành vi cũ
(thẻ mang định nghĩa — thứ giàu ý để nói).

⚠️ **Cổng vào đo NỘI DUNG, hai lớp.** `switchList()` lo mức tối thiểu của từng game (Running team ≥6 từ,
Running word ≥2); rồi mode kiểm thêm **≥80% mục ngắn ≤`WORD_POOL_MAX_LEN` (24)**. Thiếu lớp thứ hai thì act
QUIZ đọc-hiểu cũng mời chơi RUNNING, mà "đáp án" của nó là cả câu. **Chỉ siết ở mode** — danh sách của nút
Template giữ nguyên, vì thu hẹp nó là đổi hành vi thầy đang dùng.

⭐ **`ui.saveTarget()` — TEMPLATE LƯU VÀO ACT NÀO.** Trả về `originAct`: chính nó khi không có chuyển đổi,
act thư viện đứng sau khi có. Running word/team lưu "bộ số đã in" qua đây nên **không cần biết mình đang ở
chế độ nào**. Hai luật đi kèm:
1. Ghi vào **CẢ HAI** đối tượng (bản gốc để lên Firestore, bản trên màn hình để `readSets(activity)` đọc lại).
2. **`convertActivity` phải mang bộ số ĐI VÀO** (`printSets`/`gameSets`), nếu không vòng chỉ chạy một
   chiều: lưu xong, thoát, quay lại thấy ô trống trong khi bộ số nằm yên trên act không ai đọc.

## ⭐⭐ ĐỌC FILE BÀI HỌC — DÒ THEO HÌNH DẠNG, KHÔNG THEO TÊN SHEET (`core/lesson-import.js`, Đợt 190)

Đo trên **121 file bài học thật** của thầy: tên sheet và chữ cái cột **không phải là thứ tin được**.
`WORDTABLE` chỉ đúng ở 53 file (65 file gọi đúng bảng đó là `CROSSWORD`); chỉ 80/200 sheet quiz bắt đầu ở
cột A; ba phần của Reading acts không nằm ở dòng cố định. Mọi ca hỏng đều **im lặng**.

Ba bộ dò, đều là hàm thuần nhận một `grid` (mảng dòng × cột chuỗi):
| Cần tìm | Luật |
|---|---|
| bảng từ vựng | bộ ba cột **`/ipa/` · TỪ · gợi ý**; tên bộ đọc từ NGÔN NGỮ của gợi ý (Anh → ENG1/ENG2, Việt → VI1/VI2) |
| cột quiz | **các cột CÓ CHỮ theo thứ tự** — cột đánh số và cột trống tự rụng |
| phần reading | cắt theo **DÒNG TRỐNG** → bỏ dòng tiêu đề → nhận dạng theo hình dạng (≥4 cột = trắc nghiệm · 2 cột đầu là CÂU = đúng/sai · 2 cột đầu là TỪ = điền từ) |

⚠️⚠️ **`gridOf()` PHẢI GIỮ DÒNG TRỐNG.** `grid[i]` LÀ dòng `i+1` của sheet, và có hai chỗ dựa vào đúng điều
đó cùng lúc. Nén dòng trống cho gọn là làm chúng trượt khỏi nhau — đọc nhầm phần mà act vẫn trông đầy đủ.
(Đã tự cắn ngay lúc viết Đợt 190.)

⚠️ **Khúc ĐẦU TIÊN của mỗi loại thắng.** 2 file có khúc thứ tư đọc y như khúc đúng/sai; không có luật này
thì nó thay mất khúc thật.

⚠️ Sheet biết chắc không phải bảng từ vựng (`QUIZ*`, `READINGACT*`, `RUNNING*`, `PARAGRAPH`, `CUT`,
`FILL*`, `SLIDE*`, `VIDEO`, `CHART*`, `LOGIC*`, `TRANSLATION*`) bị loại trước — vừa không bao giờ thắng
được cuộc dò, vừa đỡ đọc thừa mỗi lần import.

## ⭐⭐ FIGHT MODE — HAI BÀN, MỘT TRẬN (`core/fight.js`, Đợt 124, 12/8/2026)

Nút **MODE** dưới khung lật act giữa SINGLE MODE và FIGHT MODE: 2 ván THẬT cạnh nhau, một dải
SCOREBOARD 1 · ĐỒNG HỒ · SCOREBOARD 2 ở trên, MỘT thanh công cụ dùng chung ở dưới.

⭐⭐ **TRẬN ĐẤU CẦM ACT THẬT, KHÔNG CẦM BẢN ĐÃ RESOLVE (Đợt 181, 17/8/2026).**
`engine.js` trao cho `startFight()` **`libAct`** — act thư viện, còn nguyên `variants`/`contentSets` —
và **`fight.js` tự `resolveActivity()` MỘT lần** để dựng 2 bàn. Hai tên, cấm đổi chỗ:
| tên trong `fight.js` | là gì | dùng cho |
|---|---|---|
| `playAct` | bản đã resolve (1 bộ gợi ý / 1 nửa được nướng cứng) | thứ 2 bàn CHƠI (`actFor`, `srcItems`) |
| `activity` | act thư viện | thứ Options GHI VÀO, và thứ `saveActivity()` LƯU |

Trước Đợt 181 trận nhận thẳng bản đã resolve, và hậu quả **im lặng** (đo được, không lỗi nào nổ):
- Options trong trận **không có** hàng act con — không ENG1/ENG2/VI1/VI2, không PRACTICE/HOMEWORK — vì
  act trong tay 2 bàn không còn biết mình có act con; hàng TEXT|VOICE thì vẫn hiện mà **rỗng ruột**;
- options riêng từng act con (Đợt 147) không chạy trong trận (`viewKeyOf` luôn ra null);
- Apply trong trận **lưu đè act thật bằng bản đã bị tước 3 bộ gợi ý kia**.

⭐ Vì một bàn KHÔNG BAO GIỜ tự trả lời được "act con thuộc về act nào", `core/engine.js` có
**`subActOwner()`** — một định nghĩa duy nhất cho "act của chính ván này" = `libAct` khi chơi đơn,
**`fight.ctl.matchAct()`** khi đang đấu. `subActSource()`, `applySubActSelection()` và `viewAct` của
panel Options đều đi qua nó. Thêm chế độ mới sau này thì **liệt kê hết các câu engine hỏi `libAct`** rồi
tự trả lời "trong chế độ đó, ai là `libAct`" — đó chính là chỗ Đợt 181 hụt.
⚠️ Act **đã convert** trong trận: đổi act con phải đi qua `applySubActSelection()` (ghi lựa chọn lên act
GỐC rồi convert lại), vì nội dung act convert đã nướng cứng một bộ gợi ý — chỉ "lưu là VI1" thì hàng nút
nhảy còn game đứng yên.

**Chạy được là nhờ `startGame()` giữ mọi trạng thái trong closure** → gọi 2 lần vào 2 div là xong.
Mọi thứ vươn RA NGOÀI một ván mới là chỗ phải vá — nhớ danh sách này khi thêm bất cứ thứ gì dùng chung:

| Thứ vươn ra ngoài | Đã xử |
|---|---|
| `core/sfx.js` giữ 1 `<audio>`/file | thêm **giọng dự phòng** (tối đa 3/file, chỉ đẻ khi bận) — nếu không, 2 đội bấm cùng lúc chỉ nghe 1 tiếng |
| `document.querySelector(".aw-top-score")` | **CẤM** — quét cả trang thì bàn phải ghi điểm vào bàn trái. Dùng `ui.scoreEl`, hoặc `ctl.scoreTarget(side)` khi đấu |
| `window.__awordBridge` (1 chỗ ngồi) | chỉ bàn 0 ngồi |
| Giọng đọc | chỉ bàn 0 đọc (`ctl.speaks(side)`) |
| Nhạc lifecycle (`tpl.sounds.play/restart/timeWarning`) | engine chỉ phát ở bàn 0 |

**AI ĐANG BẬT IN TURNS (Đợt 202)**: **Type the answer** — 1/17, thầy chốt thử một game trước.

**AI ĐANG BẬT FIGHT (cập nhật Đợt 186)**: Anagram · Quiz · Type the answer · True/false · **Open the box**
· **Find the match** · **Crossword** — 7/17.

⭐⭐ **HAI KIỂU VÒNG (Đợt 183) — `tpl.fightPick`.** Ngoài vòng thường (trọng tài đi 0,1,2…), `fight.js`
có **vòng LƯỢT CHỌN** cho game mà chính lớp chọn câu kế tiếp:
| | `fightPick` không khai | `"wait"` (Open the box) | `"lock"` (Crossword) |
|---|---|---|---|
| ai quyết câu | trọng tài | **đội tới lượt chọn** | **đội tới lượt chọn** |
| bàn chưa tới lượt | — | **mờ 50%**, bấm không ăn | như trái |
| mở câu | trọng tài đẩy | đội chọn ô N ⇒ trọng tài mở ô N **cả 2 bàn** | như trái |
| đúng trước | khoá đội kia | ăn điểm + **reset đồng hồ cả 2 bàn**, vòng **vẫn chờ** đội kia | **khoá** đội kia ngay |
| đúng sau | tuỳ option | **không có điểm** | (không còn cơ hội) |
| chọn tiếp | — | đội xong **SAU mà SAI** chọn tiếp, không đảo lượt | đội bị khoá (= coi như sai) chọn tiếp |
API: `ctl.boardPicked(side, i)`; `attach` nhận thêm `setPickTurn(mine)` · `backToBoard()` · `resetClock()`.
⚠️ **Template CẤM tự mở ô**: chỉ BÁO cú chạm, trọng tài mới mở — bằng không hai bàn lệch câu ngay lần
chạm đầu bị rơi, và mỗi bàn nhìn riêng vẫn "đúng".

⭐⭐ **IN TURNS — MỘT BỘ CÂU CHIA CHO HAI ĐỘI (Đợt 202, 19/8/2026, thầy).** Ô tích **xanh lá** trong
Options của trận (`fightTurns`, mặc định TẮT). Bật lên: bộ câu được **chia bài luân phiên** cho 2 bàn
— `pool.forEach((it,i) => dealt[i%2].push(it))` — nên 81 câu ra **41/40**, không câu nào ở cả hai
bên, và câu lẻ **vẫn được chơi** (trận chạy tới nửa DÀI).
- ⛔ **KHÔNG phải "chơi lần lượt"** dù tên nó vậy. Thầy chốt hai bàn vẫn chạy **ĐỒNG THỜI**, ai xong
  câu CỦA MÌNH trước thì thắng vòng ⇒ **không có kiểu vòng thứ ba** trong `fight.js`: vẫn vòng
  thường, chỉ khác là chỉ số `i` của hai bàn trỏ tới hai câu khác nhau.
- ⭐ **Chia LUÂN PHIÊN chứ đừng cắt đôi**: shuffle TẮT thì act thường viết dễ → khó, cắt đôi là một
  đội ăn trọn phần dễ.
- **BA cổng chắn**: `turnsTpl = tpl.fightTurns && !pickMode && srcItems.length >= 2` (pool 1 câu chia
  ra là một bàn RỖNG), rồi `turnsMode = turnsTpl && fo.fightTurns === true`. `turnsTpl` cũng là thứ
  quyết định có DỰNG ô tích hay không ⇒ điều khiển và hành vi không thể nói khác nhau.
- **5 luật đua bị bịt kín** khi bật: `tieMs` ghim `TIE_WINDOW_MS` · `waitBarMs = 0` ·
  `speedBonus = 0` · `lockLoser() = false` · `lateScores() = true` · `shareLetters = false`. Lý do
  không phải gọn gàng: hai bàn cầm HAI câu khác nhau, khoá đội chậm là cướp câu **của chính nó**.
  Panel xám cả 5 ô cho khớp (`syncTurns()`), **không ẩn** — luật Đợt 188.
- ⭐ **Bàn vừa trả lời HIỆN ✓/✗ NGAY** (`boards[side].reveal()` ngay trong `wordDone`). Luật "giấu
  đáp án khi vòng còn mở" sinh ra để chống chép bài — mà bàn kia đang hiện câu KHÁC.
- ⚠️ **Bàn HẾT câu (pool lẻ)**: `advanceRound()` đánh `roundDone[i] = true` + `lock(true)` cho nó,
  kẻo vòng cuối ngồi chờ đủ 20s `LATE_LIMIT_MS` cho một đội không còn gì để trả lời.
- ⚠️⚠️ **"2 bộ options độc lập" được làm bằng cách KHÔNG LÀM GÌ**: `syncTurns()` chỉ chạm KHOÁ, không
  bao giờ chạm GIÁ TRỊ (luật Đợt 188), nên bỏ tích là 5 con số cũ trở lại nguyên vẹn. Đừng thêm kho
  lưu thứ hai, và đừng zero hoá gì cả.
- **Mở cho template mới = thêm ĐÚNG 1 dòng** `fightTurns: true` vào template đó. Hiện **chỉ Type the
  answer** (thầy: "tạm thời áp dụng với duy nhất type the answer để tôi thử nghiệm trước").
- ⚠️ **Giọng đọc chưa xử**: template tự phát clip (TTA `voicePlayer`) mà bật In turns thì 2 bàn phát
  2 clip khác nhau cùng lúc — cùng họ với tồn đọng "Different words chưa có voice riêng từng bàn".

⚠️ **SAU `Apply` TRONG TRẬN PHẢI BẤM PLAY MỚI ĐO ĐƯỢC BÀN** (bài học Đợt 202, mất một vòng debug):
`fight.ctl.applyOptions()` → `restartMatch()` dựng lại trận, và **trận mới nằm ở màn PLAY** — chưa
mount template nào, nên `getTemplate(...).mount` chưa bị gọi và mọi phép đo trên bàn đều ra rỗng.

⛔⛔⛔ **BẪY LỚN NHẤT CỦA THANH TRƯỢT — `preventDefault` TRÊN `pointerdown` KHÔNG CẤM ĐƯỢC NGÓN TAY
(Đợt 216, 20/8/2026).** Đọc mục này TRƯỚC hai mục Đợt 188/213 ngay dưới, vì suốt ba đợt liền cả hai
mục đó **chỉ đúng với con chuột**.
- 🐞 Thầy báo: *"khi chạm vào các thanh trượt bằng màn cảm ứng tomko, chạm vào vị trí nào thì thanh
  trượt về ngay chỗ đó chứ không nhảy 1 nấc như khi click chuột"*. Nghĩa là **toàn bộ cử chỉ ±1 nấc của
  Đợt 213 chưa bao giờ chạy trên màn cảm ứng** — thứ duy nhất thầy dùng khi dạy.
- ⛔⛔ **VÌ SAO**: theo đặc tả Pointer Events, huỷ `pointerdown` chỉ chặn **chuỗi sự kiện CHUỘT tương
  thích** — hành vi mặc định của một cú CHẠM **không huỷ được ở đó** (đó là việc của `touch-action` và
  của `touchstart`). Chromium lại điều khiển việc kéo `<input type=range>` bằng cảm ứng ở **tầng touch**,
  nên nó vẫn nhảy nút tới ngón tay như thường. Máy build ở đây **không máy nào có màn cảm ứng**, mà chuột
  thì đi đúng đường huỷ được ⇒ ba đợt không ai thấy.
- ⭐⭐ **CÁCH CHẶN: KHOÁ Ở GIÁ TRỊ, KHÔNG KHOÁ Ở SỰ KIỆN.** `guardValue` giữ số mà thanh đang có lúc ngón
  chạm xuống **ngoài nút tròn**; `s.oninput` thấy chốt còn cắm thì **đặt trả lại ngay trong chính sự kiện
  đó** (đồng bộ ⇒ không khung hình trung gian nào được vẽ, mắt không thấy gì nhấp nháy). Cách này không
  phụ thuộc vào việc trình duyệt hiểu `preventDefault` ra sao, và **không cướp mất cuộn panel** như huỷ
  `touchstart` sẽ làm.
- ⚠️⚠️ **PHẢI `setPointerCapture`**, nếu không chốt có ngày **kẹt vĩnh viễn**: nhấc tay lệch ra ngoài
  thanh thì `pointerup` bay tới phần tử khác, chốt không ai gỡ, và thanh đó **chết với mọi cú chạm sau**
  cho tới khi panel dựng lại. Kèm `lostpointercapture` làm đường thoát cuối.
- ⚠️ **Vùng "nắm nút" 14px vẫn giao thẳng cho trình duyệt** (nửa nút + 4px) — nên chạm trong vùng đó trên
  màn cảm ứng vẫn nhích nút tới ngón một hai nấc. Đó là ĐÚNG: đó là cú "nắm nút để kéo".
- 🧪 **Đo được, và có đối chứng ngược**: bàn thử nạp **cả hai module thật** (bản `HEAD` và bản mới) rồi
  dựng lại đúng trình tự Chromium sinh ra khi chạm (pointerdown → native đổi value + bắn `input` →
  pointerup). **Bản cũ 4/16 · bản mới 16/16.** Bốn ca bản cũ đạt đúng là bốn ca **không đi qua tầng
  touch** (2 ca chuột, 1 ca nắm nút, 1 ca kịch trần).

⭐⭐ **THANH TRƯỢT: CHẠM = 1 NẤC, CHẠM ĐÚP = LÙI 1 NẤC (Đợt 188, 18/8/2026, thầy).** Kiểu mặc định của
trình duyệt ("bấm đâu nút nhảy tới đó") đã BỎ: trên màn 86" cảm ứng một cú quệt tay là thanh 0..100 nhảy
tới bất cứ đâu. Luật mới, áp cho **MỌI thanh trong app**:
| Thao tác | Kết quả |
|---|---|
| chạm thân thanh, PHÍA PHẢI nút | **+1 nấc** |
| chạm thân thanh, PHÍA TRÁI nút | **−1 nấc** |
| chạm đúng NÚT TRÒN rồi kéo | y hệt trước giờ (đường "kéo nhiều") |
| kéo từ thân thanh | không làm gì |
| kịch trần / kịch đáy | đứng lại |
⭐ **`grep '"range"'` cả kho trả về ĐÚNG 1 DÒNG** — `mkSliderCell` trong `core/options-panel.js`. Mọi
thanh ở Options, Settings và cả 17 template đi qua đó, nên **không template nào phải sửa gì**. Cùng thói
quen với `makeHStepper` (chạm = ±1, kéo = nhiều) ⇒ app chỉ còn MỘT cách nhích một con số.
- ⛔ **CHẠM ĐÚP ĐÃ BỎ HẲN (Đợt 213, thầy: "bỏ hẳn")** — bảng trên đã sửa lại cho đúng luật đang chạy.
  Không còn cửa sổ 320ms nào, dấu của cú chạm do **phía** quyết định, đọc **lúc ngón ĐẶT xuống**.
- ⚠️ Bấm trúng nút tròn thì **KHÔNG** `preventDefault` (giao thẳng cho trình duyệt); bấm chỗ khác thì
  `preventDefault` **ngay ở `pointerdown`**, trước khi cú nhảy kịp xảy ra. Nó nuốt luôn focus ⇒ phải
  `focus()` bằng tay.
- ⚠️ **Số lẻ phải snap về lưới bước rồi `toFixed`** theo số thập phân của chính `step`, không cộng trần:
  `0.1+0.1+…` ra `0.30000000000000004`.

⭐ **Ô KHÔNG DÙNG ĐƯỢC THÌ MẤT MÀU, KHÔNG ẨN — `.is-locked` (Đợt 188, thầy).** Ẩn (`display:none`) làm
bảng **nhảy bố cục ngay dưới ngón tay** đang kéo một thanh khác, và xoá luôn dấu hiệu cho biết điều khiển
đó tồn tại. `.aw-optc.is-locked` / `.aw-check.is-locked` = mờ 40% + `pointer-events:none`.
- ⚠️⚠️ **`pointer-events:none` MỚI CHỈ CHẶN NGÓN TAY.** Ô vẫn trong thứ tự Tab và phím mũi tên vẫn đổi số
  trên một thanh đang xám. **Bắt buộc kèm `disabled`** cho mọi `input`/`button` bên trong (xem
  `setLocked()` trong `core/fight.js`). Kiểm bằng 2 đường: `elementFromPoint` phải **rơi xuyên** xuống cha,
  và `.disabled === true`.
- ⭐ **Khoá một ô thì ĐỪNG đổi giá trị bên dưới nó.** Bản đầu ép `fightSpeedBonus = 0` khi ô chết ⇒ **âm
  thầm xoá con số thầy đã đặt**. Cái quyết định thật phải là phép kiểm lúc CHẠY (`speedBonusApplies()`),
  còn giá trị thì giữ nguyên để sống lại y như cũ khi ô mở lại.

⭐ **`.aw-optc-stack` — hai ô phải nằm CÙNG MỘT CỘT.** ⚠️⚠️ **PHẢI KÈM `grid-row: span 2`** (lỗi
thật, thầy bắt trên ảnh chụp ở Đợt 189): khối này là MỘT ô lưới nhưng cao bằng HAI, nên thiếu span thì nó
kéo cao cả hàng ⇒ ô bên cạnh hở một mảng chết (đo: **62px** dưới "Round rule") và ô kế tiếp bị đẩy xuống
hàng sau. ⛔ **Đừng chữa bằng `grid-auto-flow: dense`** — nó được phép đảo thứ tự ô ở bảng Options của cả
17 template. ⭐ **Bài học đo**: thêm một ô cao bất thường vào lưới thì phải quét lỗ hổng của **CẢ HAI cột**,
không chỉ kiểm cái ô mình vừa thêm. Lưới Options chảy theo HÀNG nên 2 ô nối nhau luôn
nằm cạnh nhau. Khối này chiếm đúng 1 ô lưới và xếp con chồng dọc (dùng cho Time delay + Speed bonus, vì ô
trên quyết định ô dưới có tác dụng hay không). ⚠️ Dùng `row-gap`: con của nó **không còn là con trực tiếp**
của `.aw-opt-grid` nên luật `> * { margin-bottom }` không với tới.

⛔ **KHÔNG CÒN FULLSCREEN Ở FIGHT VÀ SHOWDOWN (Đợt 188, thầy: "bỏ hẳn, không còn đường nào").** Nút chung
của trận (Đợt 124) và nút trong khung đều **không được gắn vào DOM** ở 2 chế độ đó; chế độ đơn giữ nguyên.
Nút vẫn được TẠO vì `setZoomed()` và handler giữ tham chiếu. **`fight.ctl.toggleFullscreen()` GIỮ NGUYÊN**
— nó vẫn là thứ giữ lớp `.is-fs` đúng khi trình duyệt vào toàn màn hình bằng F11.

⭐⭐ **TIME DELAY — CỬA SỔ HOÀ NAY LÀ MỘT THANH KÉO (Đợt 187, 18/8/2026).** `TIE_WINDOW_MS = 100` của
Đợt 133 nay chỉ còn là MẶC ĐỊNH; option thật là **`fightTieWindow`**, đơn vị GIÂY, **`0` = ∞** (đúng quy
ước "0 = unlimited" của Lives/Find the match).

⭐⭐ **CẬP NHẬT ĐỢT 216 (20/8/2026) — TRẦN LÊN 10s, VÀ ∞ NAY LÀ ∞ THẬT.**
Thầy: *"gốc từ 0,1 đến 3s chuyển thành từ 0,1 đến 10s (vẫn giữ nấc không giới hạn ở cuối cùng)"* và
*"nâng nấc đó lên không giới hạn, cứ chờ mãi thôi cho đến khi câu đó được hoàn thành"*.
- ⚠️⚠️ **THANH KÉO NAY CHẠY TRÊN CHỈ SỐ, KHÔNG PHẢI GIÂY** (`min 1 · max 45 · step 1`). Bắt buộc phải thế:
  thang giá trị **không đều** — `DELAY_STEPS` = 0,1…3,0 bước **0,1** (30 nấc) rồi 3,5…10,0 bước **0,5**
  (14 nấc), tổng **44 nấc + 1 nấc ∞ = 45**; mà `<input type=range>` chỉ có đúng MỘT `step`.
  Thang đều 0,1 tới 10 sẽ là **100 nấc**, mà từ Đợt 213 chạm cạnh nút chỉ đi **1 nấc** ⇒ đi từ 1s tới 8s
  là bảy chục cú chạm. Thang không đều làm cú chạm đi **một phần mười ở vùng dưới, nửa giây ở vùng trên**.
- ⚠️⚠️ **TRẦN NẰM Ở HAI NƠI.** `fightOptionsFrom()` cũng chặn (`snapDelay`) — quên chỗ đó thì thầy kéo lên
  7s, lưu được, mở lại thấy **về 3s trong im lặng**. Mọi giá trị cũ 0,1…3,0 đều còn nguyên trên thang nên
  **không act nào phải di trú** (đo: 30/30 giữ nguyên).
- ⚠️⚠️ **`tieWindowMsOf()` TRẢ `Infinity` Ở NẤC ∞** — và **cấm** đưa số đó cho `setTimeout`: đặc tả kẹp
  delay không hữu hạn về **0**, tức ∞ sẽ thành nấc NHANH NHẤT của cả thanh. `wordDone()` **không đặt đồng
  hồ nào** ở ∞; vòng đóng bằng SỰ KIỆN (bàn kia báo xong, đúng hay sai đều được).
- ⚠️⚠️ **Ở ∞ PHẢI CÓ AI ĐÓ CÒN CHƠI ĐỂ MÀ CHỜ.** Bàn kia có thể **đã trả lời SAI** trước đó (khoá bàn
  nhưng KHÔNG đặt `pendingWinner`); cửa sổ hữu hạn thì chờ hụt vài giây rồi thôi, còn ∞ thì **treo cứng**.
  Có nhánh `tieUnlimited && roundDone[other]` chốt ngay tại chỗ — đừng gỡ.
- ⛔ **LƯỚI AN TOÀN 20s KHÔNG PHỦ CA NÀY** (thầy biết và chốt vậy): đội bỏ đi giữa chừng ở nấc ∞ thì vòng
  chờ mãi, đường ra là **Menu ▸ Start again** của thầy.

| `fightTieWindow` | luật vòng | Speed bonus | thanh chờ |
|---|---|---|---|
| `0.1` (mặc định) | y hệt trước Đợt 187 | **ẩn + ép 0** | không |
| `0.2` … `10.0` | đội sau đúng trong cửa sổ **cũng ăn điểm game** | hiện, **1–100** | chạy đúng độ dài đó |
| `0` (∞) | chờ tới khi **bàn kia làm xong câu đó** (không có hạn) | hiện, 1–100 | **đứng đầy + thở + hào quang** (`.is-forever`) |
- ⭐ **Chỉ đội xong TRƯỚC ăn Speed bonus** — `finalizeTie(sideA, sideB)` nay chỉ trao cho `sideA`. Phát cho
  cả hai (bản cũ) làm chính cái thanh bonus ấy **không thưởng gì cả** khi cửa sổ dài ra.
- ⭐ **Ở ∞, `lockLoser()` và `lateScores()` bị ÉP** (lock / không giữ điểm) và panel **làm nhạt** 2 nút
  "Round rule" + "Slower team keeps points" — ở mức đó chúng không bao giờ chạy tới, để lại là **nút chết**
  (luật opt-in Đợt 143). ⚠️ **Đợt 216 đổi LÝ DO mà giữ nguyên KẾT LUẬN**: trước là "chờ 5s rồi khoá nên
  không ai finish muộn được"; nay là "vòng chỉ có một người thắng khi **cả hai bàn đã xong**, nên không
  còn kẻ thua để khoá và không còn cú finish muộn nào để tính điểm". Đọc kỹ trước khi "sửa cho đúng".
- ⛔ **3 game `fightPick` bị NIÊM PHONG khỏi TIME DELAY** (`tieMs` ghim về `TIE_WINDOW_MS`, panel không dựng
  ô đó, Speed bonus giữ nấc "Off" ở 0) — thầy chốt "open the box không cần… crossword không cần". Find the
  match **có** nhận, vì nó đi vòng THƯỜNG (không khai `fightPick`), nên `!pickMode` là phép thử duy nhất.
- Thang Speed bonus 0–20 → **1–100** và **không còn "Off"**. Act cũ lưu `0` **không** bị ghi đè lúc nạp; chỉ
  khi bonus với tới được thì panel mới sửa thành `DEFAULT_SPEED_BONUS` (5).

⭐ **THANH CHỜ — API mới `ctl.registerWaitBar(side, fn)`** (cùng khuôn `registerCleanup`). `core/fight.js`
giữ ĐỒNG HỒ, `core/engine.js` giữ PIXEL: chỉ bàn mới biết nút Menu / bàn phím / ‹ › của nó nằm đâu.
`fn(ms)` chạy một thanh cạn dần trong `ms`; `fn(0)` tắt. Hiện trên **CẢ HAI** bàn, và **chỉ** ở vòng thường
với cửa sổ ≥ `WAIT_BAR_MIN_MS` (200ms).
- ⭐⭐ **Đợt 216 — TRẠNG THÁI THỨ BA: `fn(Infinity)`.** Thanh **đứng đầy**, không đếm ngược gì, và mọi
  chuyển động giao hết cho CSS (`.aw-waitbar.is-forever` → thở `aw-waitbreathe` · hào quang `aw-waitglow` ·
  vệt sáng chạy `aw-waitshine`). Thầy: *"đứng đấy, thở nhẹ, nền sáng lấp lánh hào quang nhấp nháy chậm"*.
  ⚠️ `runWaitBar()` phải **return TRƯỚC dòng `transition`**: `"width " + Infinity + "ms"` là chuỗi vô nghĩa,
  Chrome bỏ cả khai báo, rồi dòng `width = "0%"` ngay sau đó **áp dụng không có transition** ⇒ nấc ∞ sẽ
  hiện một thanh **rỗng tức thì**, đúng ngược nghĩa của nó.
  ⚠️ **Hào quang đặt trên hộp NGOÀI, vệt sáng đặt bên TRONG**: `.aw-waitbar` có `overflow:hidden` nên sẽ
  cắt cụt quầng sáng nếu vẽ lên con; box-shadow của CHÍNH nó thì không bị chính overflow của nó cắt.
- ⚠️⚠️ **"TRỐNG KHU ĐÓ" = ĐO CẢ CHỖ NGỒI `navWrap`, KHÔNG PHẢI CHỈ ĐO NÚT ‹ ›.** Find the match và Crossword
  **ẩn 2 mũi tên nhưng GIỮ nhãn** ("Page 1 / 2") — đo mỗi `navPrev.offsetWidth` cho ra thanh 788px **vẽ
  xuyên qua chữ đó**. Đo cả wrapper: 316px, dừng trước nhãn 13px.
- ⚠️ Thanh là con thứ TƯ của `.aw-bottombar` nhưng `position:absolute` ⇒ không chiếm track, 3 luật
  `:nth-child(1/2/3)` giữ nav đúng tâm vẫn trỏ đúng 3 phần tử cũ. `.aw-bottombar` nay `position:relative`
  (an toàn: `z-index:auto` **không** đẻ stacking context — không lặp bẫy Đợt 130).
- ⚠️ Đo bằng `offset*`, KHÔNG `getBoundingClientRect` — offsets bỏ qua transform nên thanh đúng chỗ ngay
  khung hình đầu kể cả khi bàn phím đang trượt.

⭐ **`inlineTimerBar` TRONG TRẬN — ĐỒNG HỒ RIÊNG CỦA TEMPLATE PHẢI HIỆN (Đợt 187).** Luật ẩn cả `.aw-topbar`
của Đợt 124 giấu luôn đồng hồ từng-ô mà chỉ template mới có (Open the box; sau này Balloon pop · Gameshow ·
Whack-a-mole). `core/app.css` nay trả lại chiều cao cho `.aw-topbar.has-inline` rồi giấu lại **từng anh em
một** bằng `visibility` — ô điểm **phải** ở lại DOM (`ui.setScore` ghi vào nó, Anagram đọc ngược lại) — và
**co track lưới của chúng về 0**, kẻo ô điểm tàng hình vẫn chiếm ~10% hàng và đẩy thanh lệch tâm.

⚠️ **`applyPickTurn()` PHẢI CHẠY LẠI MỖI KHI ĐỔI MÀN, KHÔNG CHỈ KHI `setPickTurn()` (bài học Đợt 187).**
`boardPicked()` báo "giờ không ai đang chọn" cho CẢ HAI bàn **TRƯỚC KHI** mở ô, nên một template chỉ toggle
lớp mờ trong `setPickTurn` sẽ để **cả hai bàn mờ 50% suốt vòng đấu** — trên nền trắng nhìn đúng như một lớp
màng trắng phủ cả trận (thầy báo thật ở Crossword). Chỗ đúng là hàm đổi màn của chính template
(`activate()` của Crossword), vì `curWord` luôn được gán ngay trước nó.

⚠️⚠️ **BẪY LẶP BA LẦN LIÊN TIẾP (Đợt 182 · 184 · 185) — TEMPLATE TỰ XÁO/TỰ NGẪU NHIÊN.** True/false
`shuffle(order)`, Find the match `shuffle(choiceOrder)`, Crossword `Math.random()` trong `buildCrossword()`
— cả ba đều **vô điều kiện**, và cả ba đều làm hai bàn ôm **hai nội dung khác nhau sau cùng một số vòng**,
không lỗi, không dấu hiệu. **Trước khi bật cờ cho template thứ 8: grep `shuffle(` và `Math.random(` trong
file đó, mỗi chỗ phải hỏi "trong trận thì ai xáo?"** — câu trả lời luôn là: trận đã chốt thứ tự rồi.

⚠️ **Template tự vẽ ô điểm riêng thì KHÔNG có điểm trong trận** (Crossword, Đợt 185): engine chỉ chuyển
tiếp sang `fight.ctl.onScore()` khi template gọi **`ui.setScore()`**. Game nào tự sơn `ui.scoreEl` (hoặc
dùng `ui.setScorePainter`) phải tự gọi `fightCtl.onScore(side, điểm)` ở đúng chỗ nó tính điểm.
⚠️ **Bài học Đợt 182, kiểm TRƯỚC KHI bật cờ cho template thứ 5**: template nào **tự xáo thứ tự câu của
riêng nó** (True/false gọi `shuffle()` vô điều kiện) thì trong trận **mỗi bàn xáo một kiểu** ⇒ cùng một
số vòng lại là hai câu khác nhau ở hai bàn, mà nhìn riêng từng bàn thì bàn nào cũng bình thường. Trong
Fight phải dùng thẳng thứ tự `core/fight.js` đã chốt (`shuffleQuestions` bị trận ép `false`, mảng item
là chung). Cùng họ: game **ít lựa chọn** (True/false chỉ có 2 nút) thì **một dấu ✗ là lộ trọn đáp án** —
giấu dấu tới `reveal()` là bắt buộc, không phải trang trí.

### ⛔ `noAssignment` — TEMPLATE KHÔNG GIAO ĐƯỢC LÀM BÀI TẬP (Đợt 245, 23/8/2026)

```js
noAssignment: "Câu giải thích cho thầy đọc.",   // opt-in; KHÔNG khai = giao được như thường
```

**Giá trị là một CÂU, không phải `true`.** Lý do CHÍNH LÀ cờ — nếu để boolean thì engine phải giữ
thêm một bảng tra "type nào thì in câu nào", và cái ngày hai danh sách đó lệch nhau là ngày nút mờ
với lý do của template khác.

`core/engine.js` đọc cờ này ở **đúng một chỗ**: nút `Set assignment` dưới khung. Có cờ thì nút
**mờ đi + tooltip nêu lý do**, chạm vào **hiện toast** và **không mở form**.

⚠️ **MỜ, KHÔNG ẩn, và VẪN BẤM ĐƯỢC** (`.aw-toolbtn.is-dim` trong `core/app.css` cố ý **không** đặt
`pointer-events: none`). Đây là bài học Đợt 220 do chính thầy nêu về dải "Questions each": một điều
khiển nằm xám mà *"không có gì trên màn nói vì sao"* thì đọc như **app hỏng**, không phải như một
lựa chọn. Cú chạm là thứ TRẢ LỜI.

⛔ **CỔNG CHẶN CHỈ Ở NÚT ĐÓ.** Trang học sinh, `play.html`, `core/assignments.js` và Results **không**
hỏi câu này — nên **bài giao đã ra trước khi cờ được khai vẫn mở, vẫn chơi, vẫn thu điểm**. Cố ý:
chặn ngược lại là làm hỏng bài tập của những lớp đang làm dở.

**Hôm nay có 3 template khai cờ, và mỗi cái hỏng theo một kiểu khác nhau:**

| template | vì sao | gỡ chặn cần gì |
|---|---|---|
| `speaking_cards` | `scorable:false`, **không bao giờ gọi `ui.finish()`** — mà `ui.finish()` là đường **duy nhất** tới `session.submit()`. HS chơi xong đóng tab: **không một kết quả nào** về tới thầy, báo cáo vẫn ghi "No student has played this assignment yet". | xoá 1 dòng |
| `running_word` | `renderSummary` **thay cả bảng cuối game** và **không đọc `session`** — HS không thấy xác nhận nộp bài, cả bảng đôi SUBMIT (Đợt 246) lẫn ô tích Show answers **vô tác dụng**. Vả lại là game 2 đội chung một bàn phím. | xoá 1 dòng **VÀ** dạy `renderSummary` tôn trọng `session` |
| `running_team` | y hệt `running_word` | như trên |

⛔⛔ **VÁ NỬA VỜI CHO 2 GAME RUNNING CÒN TỆ HƠN KHÔNG VÁ**: chỉ xoá dòng `noAssignment` thì điểm vẫn
về, vẫn **trông bình thường** trong Results, trong khi cả lớp không hề nhận được xác nhận nào. Một
đường hỏng mà không ai nhìn thấy là hỏng khó chữa nhất.

⚠️ **Sắp viết template thứ 18?** Hỏi trước khi khai cờ: *"nó có gọi `ui.finish()` không, và bảng cuối
game của nó có đọc `session` không?"* Hai câu đó quyết định template có làm bài tập được hay không —
`scorable` **không** trả lời thay được (Gameshow `scorable:true` nhưng chấm theo tốc độ, vẫn giao
được; xem mục "báo cáo Result" của Đợt 245 trong `GHI CHU DU AN.md`).

---

**Hợp đồng cho template muốn tham gia** (opt-in — Anagram Đợt 124, Quiz thêm ở Đợt 125 làm thử
nghiệm; template cần khai sẵn `itemsKey`, xem cảnh báo dưới):
```js
itemsKey: "questions",                // BẮT BUỘC — fight.js đọc/ghi mảng item qua field này (xem dưới)
fightMode: true,                      // đây là thứ làm nút MODE hiện ra
// trong mount(): const f = activity._fight;  // { side, ctl } — không có = chơi đơn như thường
f.ctl.attach(side, { total, goToIndex(i), lock(on) })   // đăng ký bàn
f.ctl.wordDone(side, { index, correct })                 // bàn này đã XONG với từ/câu đó
    // ⚠️ `correct:false` = xong nhưng SAI. XONG TRƯỚC ≠ THẮNG (Đợt 128) — xem mục dưới.
    // Không gửi cờ = coi như ĐÚNG (dành cho template mà từ chỉ có thể kết thúc đúng).
f.ctl.toggleFullscreen()                                 // phóng to CẢ TRẬN (xem mục FULLSCREEN dưới)
// và trong đối tượng trả cho ctl.attach():
reveal()                                                 // ⭐ vòng đã ngã ngũ: được phép lộ ✓/✗ (Đợt 129)
f.ctl.isLocked(side)                                    // chặn thao tác khi đã thua vòng
f.ctl.shareLetters · f.ctl.speaks(side)                 // giữ công bằng + không đọc chồng
f.ctl.boardMoved(side, index)                           // thầy bấm ‹ › ở bàn này
```
⚠️ **`fight.js` KHÔNG còn đọc cứng `activity.content.items`** (đúng lỗi Đợt 124 chỉ hợp Anagram) — nay
tra `getTemplate(activity.type).itemsKey` để biết mảng item nằm ở field nào (Quiz là `"questions"`).
Template mới tham gia Fight chỉ cần đã khai `itemsKey` đúng (mọi template có tính năng "Start with
mistakes" đều đã khai sẵn) — không phải sửa gì thêm ở `fight.js`.
⚠️ **Điểm KHÔNG cần hoạt ảnh bay riêng vẫn tự động vào scoreboard** — nếu template chỉ gọi
`ui.setScore(n)` như bình thường (không tự vẽ hiệu ứng bay số như Anagram), engine đã tự chuyển tiếp
vào `fight.ctl.onScore()` cho template đó rồi (xem `ui.setScore` trong `core/engine.js`) — KHÔNG cần
đọc `ctl.scoreTarget(side)` trừ khi template tự vẽ hoạt ảnh bay điểm ra ngoài khung.

**Ô điểm ở ĐÂU** (thầy chốt 12/8/2026, bản cuối): **KHÔNG có ô điểm trong khung khi đấu** — mỗi đội
chỉ có MỘT con số, nằm **chính giữa phía trên khung của mình**, và điểm bay thẳng từ trong game ra
tới đó (`ctl.scoreTarget(side)`). Dải trên là lưới **2 nửa khớp đúng 2 khung** + cụm giữa
`[điểm thủ công] ĐỒNG HỒ [điểm thủ công]` neo tuyệt đối ở tâm.
⚠️ Topbar trong khung để **`visibility:hidden; height:0`**, KHÔNG `display:none`: template vẫn ghi
vào ô điểm ẩn đó và Anagram còn **đọc ngược lại** để đếm số — bỏ hẳn là vỡ vòng đếm.
⚠️ Dải trên **không được có padding ngang riêng**, nếu không mỗi nửa hẹp hơn khung bên dưới và số
điểm lệch tâm (đo: 13px).
⚠️ Ẩn tên act / cụm Edit-Assignment-Print-Home cũng phải bằng **`visibility`**: thanh dưới là lưới
`1fr auto 1fr`, `display:none` làm cụm nút rơi về cột 1 (dạt trái) thay vì nằm giữa.

⚠️⚠️ **"ĐỘI CHẬM KHÔNG GIỮ ĐIỂM" GHIM VÀO **TỔNG ĐẦU VÒNG**, KHÔNG PHẢI TỔNG LÚC ĐÓNG BĂNG (vá Đợt 183).**
Bản cũ ghim vào giá trị đọc được **lúc đóng băng** — chỉ đúng cho template trả điểm MUỘN (Anagram bay số
1,76s). Template gọi `ui.setScore()` **ngay** (Open the box, **Quiz**) thì điểm đã nằm trong tổng trước khi
freeze chạy ⇒ **đội chậm giữ luôn điểm vừa bị từ chối**. Và mốc phải chụp trong **không gian TỔNG**
(`game + bonus + freezeAdj`): chụp `game+bonus` thô thì lần đóng băng **thứ hai** trong trận **trả lại** số
điểm vòng trước đã huỷ — đội chỉ được lợi nên không ai kêu, màn hình không có gì để nhìn ra. Xem
`roundBase`/`snapRoundBase()` trong `core/fight.js`.

**Điểm THỦ CÔNG của thầy** (2 ô cạnh đồng hồ): chạm/vuốt lên +1, vuốt xuống −1; dương xanh dương, âm
đỏ **không có dấu trừ**. Tách hẳn khỏi điểm game và giữ ở **biến cấp module** trong `fight.js` ⇒ sống
qua Start again và đổi template, chỉ mất khi tải lại trang.
⚠️ **Đợt 136**: số ở đây là **text thuần bằng Baloo 2** (weight 800, tabular-nums, `clamp(23px,4.4vw,
35px)`). Bản 7 nét của Đợt 134 **đã xoá hẳn** (quá mảnh, thầy không đọc được từ xa). Nếu sau này chỉnh
cỡ số, nhớ `line-height` phải giữ **≤1.1**: ô cao 44px trừ viền còn 41px, mà `.aw-fight-handnum` có
`overflow:hidden` nên số cao hơn thế là **bị cắt ngang, không có cảnh báo nào**.

⚠️⚠️ **BẪY `%` TRÊN `<button>` — "62%" không phải 62% (Đợt 136, đo mới ra).**
`<button>` mang **`padding: 1px 6px` mặc định của trình duyệt**. Đặt `svg{width:62%;height:62%}` trong
`.aw-toolbtn` 44×44 thì % tính trên hộp NỘI DUNG (30×40) chứ không phải trên nút ⇒ hình chỉ **18,6px =
42% nút**, và vì padding ngang ≠ dọc nên hộp svg còn **méo (18,6×24,8)**, hình vẽ nằm lệch trong slot.
→ **Luật: nút icon phải khai `padding: 0` thì phần trăm mới có nghĩa.** Áp dụng cho mọi nút icon mới.

**Một bên bấm PLAY là bên kia chạy theo** — `bigPlay.onclick` gọi `ctl.playPressed(side)`, trọng tài
bấm hộ nút PLAY của bàn kia. Bắt buộc phải vậy: mỗi ván có đồng hồ RIÊNG, khởi động lệch nhau là
đồng hồ chung (đọc bàn 0) nói giờ của một đội cho cả hai.

⚠️⚠️ **BA BẪY BẮT BUỘC BIẾT — cả ba đã cắn thật ở Đợt 124:**
1. **Điểm của template TỚI MUỘN.** Anagram trả điểm **1.760ms** sau khi giải xong (chờ 420 + bay 920
   + đếm 420). Bất cứ phép tính nào của trọng tài dựa trên "điểm hiện tại" ngay lúc `wordDone` đều
   sai. Cách đúng: **đóng băng** con số rồi huỷ phần đang bay tới (xem `frozenAt`/`holdFreeze`), và
   giữ `ROUND_HOLD_MS` **dài hơn** hoạt cảnh điểm của template (nay 2100ms).
2. **Mọi đường `startGame()` gọi lại PHẢI mang theo `fight`** — `restart()`, `replayCurrent()`,
   `doSwitchTemplate()`. Thiếu là bàn đó **âm thầm biến thành act đơn lẻ NẰM TRONG trận đấu**: mọc
   thanh công cụ riêng, ô điểm riêng, thôi báo cáo lên scoreboard. Hiện cả 3 đường đều đi qua
   `ctl.restartMatch()`.
3. **Mỗi bàn chơi một BẢN SAO của act** (thứ tự từ chốt cứng để 2 bàn khớp nhau), nên
   `Object.assign(activity.options, draft)` của Apply **chỉ ghi vào bản sao**. Options phải đi qua
   `ctl.applyOptions()` để ghi vào act THẬT rồi dựng lại cả trận.
4. ⭐ **KHÔNG hàm dọn dẹp nào được phép NÉM LỖI.** `teardown()` chạy trên đường **ĐI VÀO** một lần
   dựng lại, và nó nói chuyện với những ván đang bị tháo dở. Một `ReferenceError` ở đó (thật: biến
   `topbar` còn sót trong `cleanup()` của Anagram sau khi bỏ slogan) làm **trận không bao giờ được
   dựng lại — màn hình đứng nguyên, không một dấu hiệu nào cho thầy**. Nay `teardown()` bọc
   `try/catch` và `lock()` của template thoát ngay khi `dead`.

⚠️⚠️ **BẪY THỨ 5 (Đợt 127): `lock()` TUYỆT ĐỐI KHÔNG ĐƯỢC VẼ LẠI (re-render).**
`lock(on)` bị gọi đúng vào giây phút đội kia vừa xong từ. Nếu template hưởng ứng bằng cách dựng lại
thẻ bài của mình thì animation vào-màn (fade-in/pop) **chạy lại** ⇒ khung bên THUA **nháy 1 nhịp**
trước mặt cả lớp (thầy báo thật; gốc: `anagram.js` gọi `render()` trong `lock()`). Đúng cách: chỉ vá
tại chỗ những gì đang có trên màn — `disabled` + **một class CSS**, để MÀU/ĐỘ MỜ nằm hết trong CSS.
Cả 2 template hiện có đều làm vậy qua một hàm tên `syncFightLock()` (xem `anagram.js`/`quiz.js`).
**Cách đo lại khi nghi có nháy** (tái dùng được): `MutationObserver` trên playarea của khung THUA,
đếm số lần thẻ bài bị THAY THẾ **kèm dấu thời gian** — bắt buộc phải có mốc thời gian, vì lần vẽ lại
HỢP LỆ lúc sang từ mới rơi vào đúng `+ROUND_HOLD_MS` và rất dễ bị đọc nhầm thành cái nháy.

⭐⭐ **XONG TRƯỚC ≠ THẮNG (Đợt 128) — luật trung tâm của vòng đấu.**
Ban đầu ai báo `wordDone` trước là thắng vòng, bất kể đúng sai ⇒ **bấm bừa thật nhanh là cướp được từ**
của đội kia. Luật đúng:
- Xong mà **SAI** → chỉ kết thúc lượt CỦA CHÍNH BÀN ĐÓ: nó bị khoá lại (giữ nguyên phản hồi sai quen
  thuộc của template), nhưng **vòng vẫn MỞ** — bàn kia **không bị khoá, không bị đổi màu**, chơi tiếp
  bình thường và **vẫn thắng được vòng đó**.
- Chỉ xong **ĐÚNG** mới đặt `roundWinner`, mới ăn thưởng tốc độ, mới khoá bàn kia.
- Mấu chốt: **`roundDone[2]`** ("bàn này đã có lượt chưa") là khái niệm KHÁC **`roundWinner`** ("vòng đã
  có ai thắng chưa"). Gộp 2 thứ này làm một chính là gốc của luật sai ban đầu.
- Template **phải báo cả ca SAI** (`correct:false`), đừng im lặng: im lặng thì trọng tài không biết bàn
  đó đã xong, nên vòng không thể đóng lại sớm khi cả hai đã có lượt mà phải chờ hết chốt chặn 20 giây
  (`LATE_LIMIT_MS`) — đúng lỗi Anagram "On submit" mắc phải trước Đợt 128.
- Template mà một từ **chỉ có thể kết thúc ĐÚNG** (Anagram bonus: phải bấm chữ theo thứ tự, bấm sai bị
  từ chối) thì khỏi gửi cờ — mặc định là đúng. Sai ở đó chỉ mất hệ số nhân, không mất vòng.

⭐⭐ **GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ (Đợt 129) — `reveal()`.**
Bàn nào xong trong khi bàn kia **vẫn đang làm** thì **tuyệt đối không được vẽ thứ gì chỉ ra đáp án**:
không ✓, không ✗, không làm mờ ô sai, không tô màu từng vị trí, không in từ đúng. Chỉ **đổi màu xám**
(`is-fightlost`). Bằng không đội còn lại chỉ việc nhìn sang bàn kia mà chép.
⚠️ Cẩn thận với những thứ *tưởng* vô hại: **làm mờ hết ô sai cũng chính là chỉ ra ô đúng** (nó là ô
duy nhất còn sáng) — đó là ca đã lọt ở Đợt 128.
Trọng tài gọi **`reveal()` trên CẢ HAI bàn** đúng lúc vòng ngã ngũ (`revealBoards()`, thêm ở
`advanceRound`/`endMatch` làm lưới an toàn). Bàn **chưa kịp chơi cũng được gọi** — nó cần biết đáp án.
Template không khai `reveal` thì không sao (chạy y như cũ).
⚠️ Hoạt cảnh lộ kết quả trong trận nên **lộ HẾT CÙNG LÚC**, đừng chạy lần lượt: bản lần lượt của
Anagram tốn `n×260+300` ≈ 2,4s, **dài hơn `ROUND_HOLD_MS` (2100ms)** nên vòng sang từ mới khi hoạt
cảnh còn đang chạy; và trong một trận đấu thì 2 bàn lộ cùng một khoảnh khắc mới công bằng.
⚠️ **Âm thanh KHÔNG cần giấu**: tiếng đúng/sai chỉ nói đội đó làm thế nào, không chỉ ra đáp án nào.

⚠️ **NEXT/BACK PHẢI ĐỒNG BỘ TỪNG KHUNG HÌNH (Đợt 129).** Báo `boardMoved` **TRƯỚC KHI** bắt đầu hoạt
cảnh, đừng báo trong callback lúc nó chạy xong — báo muộn thì bàn kia khởi động chậm **130-160ms**,
nhìn rõ bằng mắt. Và đường "bị trọng tài đẩy đi" (`goToIndex`) phải chạy **ĐÚNG hàm/hoạt cảnh** mà
đường "tự bấm" chạy, nếu không một bên trượt còn một bên cắt phụt. Echo báo ngược vô hại: trọng tài bỏ
qua `boardMoved` trùng chỉ số.

⭐ **FULLSCREEN LÀ CỦA TRẬN, KHÔNG PHẢI CỦA BÀN (Đợt 129).**
Nút Fullscreen dùng chung **không được** gọi `fsBtn.click()` của engine: engine mỗi bàn khởi động với
`root = boardEls[i]`, tức **div của riêng bàn đó**, nên phóng to sẽ chỉ thấy MỘT khung — bàn kia, dải
điểm và chính hàng nút đều nằm ngoài màn hình. Phải đi qua **`ctl.toggleFullscreen()`**, thứ duy nhất
nắm phần tử chứa cả trận.
⚠️ Bố cục fullscreen của trận dùng **class `.is-fs` do JS bật** (nghe `fullscreenchange`), KHÔNG dùng
`:fullscreen`: (a) CSS single-mode sẵn có `:fullscreen .aw-page{width:100vw;height:100vh}` +
`:fullscreen .aw-below{display:none}` sẽ thổi từng khung con ra full màn hình và **xoá luôn thanh công
cụ** — cần selector mạnh hơn để đè; (b) mỗi biến thể tiền tố phải viết thành luật RIÊNG nên đường
`:fullscreen` tốn ~20 luật gần trùng.
⚠️ 2 khung 16:10,5 nằm ngang là bố cục rất "bè" ⇒ chống tràn dọc bằng cách **giới hạn BỀ NGANG** hàng
khung (suy từ chiều cao còn lại), cùng thủ pháp `max-width: calc(100vh*16/9)` single mode đã dùng.

⚠️ **"Quá chậm" — đội thua phải THẤY ngay** (Đợt 127): khi bị `lock`, template nên làm ô đáp án của
mình **mất màu + mờ** (`.is-fightlost`, `opacity:.55`) để cả lớp nhìn là biết, thay vì bấm mãi không
ăn. Nhưng **khung TỰ giải xong thì KHÔNG mờ** — nó cũng bị khoá vì vòng đã ngã ngũ, nhưng nó thắng:
điều kiện đúng là `locked && !wordDone`, không phải `locked` trần.
Mẹo cho template có ô màu qua BIẾN CSS (Quiz): đè **biến màu** (`--tile-eff`/`--tile-dark-eff`) chứ
đừng đè `background` — vành 3D `box-shadow` cũng đọc qua biến đó nên mới xám theo, không thò màu cũ.

⭐ **ĐỔI TEMPLATE GIỮA TRẬN — ĐƯỢC PHÉP từ Đợt 127** (trước đó từ chối thẳng vì mới có 1 template):
- Việc đổi thuộc về **TRẬN**, không thuộc cái bàn có thanh công cụ: `doSwitchTemplate()` convert xong
  thì giao act cho **`ctl.restartMatch(next)`** dựng lại CẢ TRẬN — 2 bàn cùng đổi, chung thứ tự câu,
  chung bảng điểm. Một bàn tự đổi riêng = 2 game khác nhau nằm trong cùng 1 trận.
- **Chỉ template khai `fightMode` mới được nhận trận**; không khai → toast từ chối, trận giữ nguyên
  (lý do cũ vẫn đúng: nó vẫn CHẠY được, mà "trông như trận đấu nhưng không có luật" tệ hơn từ chối).
  Kiểm **sau** `ensureTemplate()` vì `tpl.fightMode` nằm trên module = **nguồn sự thật duy nhất**;
  chép cờ sang `core/catalog.js` thì thành 2 nơi phải giữ đồng bộ, còn nạp trước cả 17 module chỉ để
  vẽ panel thì phá đúng cái lazy-load mà catalog sinh ra để làm.
- ⚠️ **Convert CHỒNG convert làm rơi rụng nội dung** (Anagram→Quiz phải BỊA đáp án nhiễu; Quiz→Anagram
  chỉ giữ lại đáp án đúng). Vì vậy `startFight(root, act, { onExit, base })` nhận `base` = act GỐC và
  mang nó qua **mọi** lần dựng lại (`restartMatch`), rồi **`ctl.sourceActivity()`** trả về act gốc đó
  cho mọi lần convert — đúng luật `base`/`originAct` mà `startGame` vẫn theo. `exitFight()` cũng phải
  mang `base` về single, nếu không act ĐÃ CONVERT sẽ thành "gốc" cho mọi lần đổi sau.
  Lý do thứ hai: mỗi bàn chỉ giữ **BẢN SAO đông cứng** của act (thứ tự cố định, `shuffleQuestions:false`)
  — convert từ bản sao đó là kế thừa luôn cả 2 thứ đó.
⚠️ `core/fight.js` **nạp trì hoãn** (`await import`) từ nút MODE, và MODE chỉ dựng khi `!session` —
trang học sinh không bao giờ tải nó, và engine không phải import tĩnh một module import ngược lại nó.

**Bấm MODE nay phải xác nhận (Đợt 125)**: `core/engine.js`'s `modeBtn.onclick` không còn đổi mode
ngay — nó mở 1 popover Yes/Cancel ngay cạnh nút (`openToolPanel` — cùng cơ chế Options/Template/Style,
không đẻ cơ chế mới), chỉ bấm xác nhận mới thật gọi `startFight()`/`fight.ctl.exitFight()`. Việc này
nằm ở `engine.js` chung, template không cần biết/sửa gì.

**Dải điểm/đồng hồ trên cùng không còn nhãn chữ** (Đợt 125): "TEAM 1"/"TEAM 2"/"TIME" đã bỏ hẳn — mọi
khối trên dải nay đúng **1 dòng** (điểm đội, đồng hồ, ô điểm tay), cùng cỡ chữ với điểm đội/đồng hồ
nên tự thẳng hàng, không cần chỉnh tay. Đồng hồ hiện **"00:45"** (2 số mỗi bên, không phải "0:45" như
chip đơn) — `tickTimer()` gửi SỐ GIÂY THÔ cho `fight.ctl.onTimer()`, `fight.js` tự pad. `.aw-fight-hand`
dùng `width` CỐ ĐỊNH (không phải `min-width`) để 2 ô điểm tay hai bên đồng hồ luôn bằng nhau bất kể số
chữ số — đây chính là điều giữ đồng hồ (và dấu `:`) luôn đúng tâm dải dù điểm tay lệch số.

## ⭐⭐⭐ ĐIỂM PHẠT PHẢI BAY — `ui.flyPenalty()` (Đợt 256, thầy 24/8/2026)

Thầy: *"phải hiện số điểm trừ bay lên từ ô/chỗ sai bay vào ô điểm RỒI MỚI TRỪ… hiện tại không có gì
bay lên cả mà số điểm tự trừ rất khó nhìn"*. **Ở cuối một lớp học, một con số đổi giá trị KHÔNG phải
là một chuyển động** — đó là cả lý do của mục này.

**Template opt-in bằng ĐÚNG MỘT DÒNG** (`core/flypenalty.js` giữ hiệu ứng, `core/engine.js` giữ dây):
```js
ui.flyPenalty(wrongEl, points, () => { penalty += points; return scoreNow(); });
```

| | |
|---|---|
| `wrongEl` | ô/chỗ vừa sai. `null` = không có ô nào (hết giờ) ⇒ rơi về giữa khung |
| `points` | mức phạt (>0). `0` là **no-op** — hàm tự chặn, không gọi callback |
| callback | ⚠️ **áp phép trừ VÀ trả về TỔNG ĐIỂM MỚI**; chỉ chạy **lúc con số hạ cánh**, đúng MỘT lần |

⛔⛔ **PHÉP TRỪ PHẢI NẰM TRONG CALLBACK.** Trừ trước rồi vẽ một cú bay cho vui thì vẫn đúng cái cảnh
thầy đang tả — số tụt trước, hình bay sau. Nhịp này **ngược hẳn `flyTimeCost`** (điểm giờ chạy đếm
lùi NGAY trong lúc bay, vì điểm đang RỜI KHỎI tổng); cả hai đều là lời thầy, đừng "thống nhất" lại.

⛔⛔⛔ **TRONG TRẬN FIGHT, CHỖ BAY RA BỊ ÉP VỀ GIỮA KHUNG — LUẬT AN TOÀN, KHÔNG PHẢI THẨM MỸ.**
Bàn kia còn đang làm; một con số "−5" bay ra từ đúng ô số 3 là nói với đội kia *"ô 3 sai"*. Quiz 4
lựa chọn bị loại một ô; **True/false chỉ có 2 nút nên là lộ TRỌN đáp án**. Đúng thứ mục **"GIẤU ĐÁP
ÁN KHI VÒNG CÒN MỞ" (Đợt 129)** ngay trên cấm.
- Phép ép nằm ở **`ui.flyPenalty` trong `core/engine.js`**, KHÔNG ở template — template chỉ biết "tôi
  sai ở ô này", còn "trong trận thì được chỉ vào đâu" là câu hỏi của core. Để template tự nhớ là chờ
  ngày template thứ 12 quên mất và hở bài trong im lặng.
- ⭐ Anagram vốn đã vô tình đúng luật này từ Đợt 143: `flyLetterPenalty()` bay ra từ **ô đáp án đang
  chờ** (cùng một ô ở cả hai bàn), không phải từ chữ cái bấm sai.
- ⚠️ Thầy đã được hỏi thẳng ca này (24/8/2026) và chốt **"bay ngay, nhưng từ GIỮA khung"** — tức
  KHÔNG hoãn cú bay tới lúc lộ đáp án, chỉ đổi chỗ bay ra. Đường "bay từ ô sai, chấp nhận hở bài" đã
  được nêu và **bị loại**.

⚠️⚠️ **GỌI `ui.flushPenalties()` Ở DÒNG ĐẦU `finish()`** — hoặc bất cứ chỗ nào template ĐỌC điểm để
ghi vào kết quả. Con số bay **920ms**, mà nhiều template chốt sổ chỉ **500–700ms** sau câu sai cuối
⇒ thiếu dòng này là câu sai CUỐI biến mất khỏi bảng kết quả, khỏi Show answers, và khỏi **điểm nộp
của bài giao**. Hoạt ảnh mở ra cái cửa đó, nên hoạt ảnh phải tự đóng lại.
- ⭐ Trong trận Fight thì KHÔNG cần: `ROUND_HOLD_MS` (2100ms) luôn dài hơn 920ms.
- ⚠️ `cleanupAll()` **quên** sổ chờ chứ không gọi nó — ván đã bị vứt, ghi điểm cho nó là ghi vào một
  cái xác (bẫy Đợt 114).

⚠️ **Template không có sổ `penalty` cộng dồn thì phải CỘNG BÙ.** Quiz đếm thẳng số câu sai trong
`state`, mà `st.correct = false` đã ghi từ lúc bấm — không hoãn được phép trừ bằng cách hoãn một phép
cộng. Nó giữ `pendingPenalty` và `scoreNow()` cộng lại chừng ấy điểm cho tới lúc hạ cánh.
⛔⛔ **BIẾN ĐÓ PHẢI KHAI Ở ĐẦU `mount()`, KHÔNG PHẢI CẠNH `scoreNow()`** — `scoreNow()` là function
declaration (được hoist) và được gọi **từ trước** chỗ nó được viết ra (`ui.setScore(scoreNow())` lúc
dựng bàn) ⇒ khai `let` cạnh nó là **`ReferenceError` TDZ ngay khi mở game**, và trên màn thầy nó hiện
ra đúng như *"game không lên"*. Đã cắn thật trong chính Đợt 256, cùng họ với bẫy TDZ Đợt 192.

⚠️ **Một cú bay, MỘT CHỦ NỢ.** Crossword và Unjumble vốn đã bắn chùm sao đỏ có kèm callback trừ điểm;
khi thêm con số thì quyền trừ chuyển sang **con số**, callback của chùm sao hạ xuống thành "vẽ lại
điểm hiện hành". Để cả hai cùng trừ là trừ hai lần. Cùng lý do, Type the answer có cờ
`fightPenaltyFlown` để `flyMark()` không trừ lần nữa lúc lộ đáp án.

⚠️ **Không có tiếng động nào ở đây** — template đã kêu tiếng sai của nó ngay lúc bấm; thêm một tiếng
lúc hạ cánh là hai tiếng cho một lỗi.

**Ai đang dùng (11/17 — mọi template có trừ điểm):** Quiz · True/false · Find the match · Open the box
· Crossword · Anagram · Type the answer · Balloon pop · Flying fruit · Maze chase · Unjumble.

**Bàn thử:** `scratch/dot256-penalty.html` (Quiz, Single + Fight, **24/24**) ·
`scratch/dot256-smoke.html` (mount cả 11 template + bấm sai thật ở 4 game).

---

## ⭐⭐ SHOWDOWN MODE — MỖI TRÌNH DUYỆT MỘT ĐỘI, MỖI CÂU MỘT HỌC SINH (`core/showdown.js`, Đợt 155, 14/8/2026)

Nút **SHOWDOWN** dưới khung (giữa Style và MODE) mở bảng chia đội. **KHÔNG phải biến thể của Fight**:
vẫn **một bàn duy nhất**, chỉ thêm "câu này của em nào". Fight chia MÀN HÌNH; Showdown chia LỚP.

**Ý tưởng gốc của thầy:** bảng đội dùng chung trên mây, còn **mỗi trình duyệt tick đúng MỘT đội** rồi
chơi vòng tròn trong đội đó. Mục đích là **myActivity chia 2-4 cột**: cột 1 đội 1, cột 2 đội 2… mấy
đội cùng đua một act, mỗi cột một vòng lượt riêng.

```
┌──────────────────────────────┐
│  0:12      Nguyễn Ngọc Ẳnh   ✓3│   <- dòng giữa topbar = TÊN EM ĐANG TỚI LƯỢT
│           (khung game)        │
└──────────────────────────────┘
   Options · Template · Style · SHOWDOWN · MODE
```

### Hai tầng dữ liệu — đừng trộn

| Tầng | Ở đâu | Vì sao |
|---|---|---|
| **Bảng đội** (chung, đồng bộ mọi máy) | Firestore `users/{uid}/items/sd_main`, `kind:"showdown"` | thầy chốt "một danh sách chung" |
| **Đội của trình duyệt này** | **`sessionStorage`** khoá `aword-showdown-pick` | xem 2 bẫy dưới |
| **Bảng KẾT QUẢ** (chung, Đợt 177) | Firestore `users/{uid}/items/sd_results`, `kind:"showdown-results"` | xem mục "Bảng kết quả chung" |

⚠️⚠️ **HAI CHỖ LƯU TƯỞNG LÀ HIỂN NHIÊN, CẢ HAI ĐỀU SAI VÀ SAI TRONG IM LẶNG:**
1. **`localStorage`** — 4 cột myActivity là 4 `WebContentsView` **cùng origin, cùng partition** ⇒
   **chung một `localStorage`**. Cả 4 cột đọc ra cùng một đội = đúng cái ngược lại với mục đích.
2. **`activity.options`** — `window.__awordBridge` **CỐ Ý nhân bản** `applyOptions` từ cột 0 sang các
   cột khác. Chọn đội ở cột 0 là kéo theo 3 cột kia.

`sessionStorage` là kho **duy nhất** riêng theo từng tab/WebContentsView. Giá phải trả (thầy chấp
nhận): tắt hẳn trình duyệt là phải tick lại đội — bảng đội vẫn nguyên trên Firestore.

### Ba file, và vì sao phải là ba (Đợt 177 tách file thứ ba)

- **`core/showdown.js` — THUẦN, KHÔNG MỘT DÒNG `import`**: `sessionStorage` + luật chia lượt
  (`memberAt`) + đóng dấu review (`stampReview`) + **gom nhóm & xếp hạng** (`groupByMember`,
  `rankBlocks`) + `fmtRoundMs`/`pctBand`. Toàn bộ là **dữ liệu vào — dữ liệu ra**.
- **`core/showdown-review.js` — THUẦN DOM** (Đợt 177): cả màn Show answers của Showdown (title
  3 cử chỉ, danh sách, bảng xếp hạng hình phễu). Không Firestore, không thư viện — thứ cần mạng đi
  vào bằng **callback `loadTeams` do engine truyền**.
- **`core/showdown-setup.js`**: Firestore + bảng Showdown + bảng kết quả. **CHỈ `await import`** từ
  nút SHOWDOWN (và từ `finish()` lúc đẩy kết quả).
  ⚠️ Đừng gộp lại: gộp là kéo Firestore vào `play.html`, phá luật 2 của v0.9.0.

⚠️ Hai file đầu được `core/engine.js` import **TĨNH**. Thêm bất cứ `import` nào chạm Firestore hay
thư viện vào chúng là làm hỏng trang học sinh — và hỏng **im lặng** ở máy đã có cache.

### Bảng kết quả chung — mỗi đội xong là tự đồng bộ (Đợt 177)

Thầy chốt 17/8/2026: *"khi hoàn thành game của 1 đội, kết quả đội đó tự đồng bộ vào kết quả các đội và
sẵn sàng cho các đội khác đọc."*

- **ĐẨY**: `core/engine.js` `finish()` gọi `saveTeamResult()` (bắn-rồi-quên). Bỏ qua đúng 2 trường hợp
  y như leaderboard: không ai trả lời câu nào, và ván "Start with mistakes".
- **ĐỌC**: Show answers gọi `loadTeamResults(roundKey)` — chỉ khi thầy chạm vào title.

⚠️⚠️ **KHOÁ ĐỐI CHIẾU LÀ `originAct.id`, KHÔNG PHẢI `activity.id`.** `core/convert.js` đóng dấu act đã
"Change template" bằng id **NGẪU NHIÊN** (`conv_quiz_5817…`) ⇒ hai cột cùng đổi sang Quiz sẽ tự đẻ hai
khoá khác nhau và **không đời nào thấy kết quả của nhau**, mà trên màn hình không có gì giải thích.
`showdownRoundKey()` trong engine trả `originAct?.id || activity.id`.

⚠️⚠️ **LỆNH GHI PHẢI LÀ `setDoc(..., {merge:true})` MỘT KHOÁ MAP, KHÔNG ĐƯỢC đọc-sửa-ghi.** Hai cột kết
thúc cách nhau vài giây sẽ cùng đọc tài liệu, cùng thêm đội mình, và lệnh ghi sau **xoá sạch đội của
lệnh trước** — mà mỗi màn vẫn hiện kết quả của chính nó rất đúng, nên không ai phát hiện.
🟢 Đã dựng lưới `scratch/showdown-sync-test.html` bắn 3 lệnh ghi song song để chứng minh, **và đối
chứng ngược** bằng `?break=1` (bỏ merge ⇒ chỉ còn 1 đội sống sót).

⚠️ Mảng `students` bị **thay nguyên** chứ không trộn (đúng luật Firestore) — cần đúng như vậy để một
đội chơi lại không để sót nửa đội hình cũ nằm dưới.

⚠️ **Reset teams xoá cả hai bảng**: `wipeSetup()` gọi luôn `wipeResults()`. Không thì `splitIntoTeams()`
cấp lại đúng các id `sdt_1`… và kết quả hôm qua sẽ đội lốt đội hình hôm nay.

### Title của Show answers LÀ MỘT NÚT (Đợt 177)

`SHOWDOWN A1C • TEAM 3` — chữ **SHOWDOWN** mang 3 cử chỉ, XANH LÁ luôn có nghĩa "đang xem cái này":

| Cử chỉ | Việc |
|---|---|
| Chạm 1 lần | đổi giữa **đội này** và **cả lớp**; "TEAM 3" thu vào "A1C" rồi số HS đẩy ra (`scaleX`, `transform-origin:left`) |
| Chạm 2 lần | đọc lại bảng kết quả: spinner → "UPDATED" → tự mờ |
| Nhấn giữ | **bảng xếp hạng hình phễu**, title chuyển vàng lấp lánh |

⚠️ **KHÔNG dùng `press()` và KHÔNG dùng `onclick`/`ondblclick` ở đây.** `press()` bắn ngay lúc chạm —
đúng cho bề mặt chơi, sai ở đây (một cú chạm chưa được quyết định khi chưa biết nó có phải nửa đầu của
cú chạm đúp hay không). Còn `click` thì chính `core/press.js` đã chép lại lý do không tin được trên màn
hồng ngoại. File tự nghe thẳng luồng pointer, **`setPointerCapture`** để ngón trượt ra ngoài vẫn báo lúc
nhấc, và **nuốt** cú `click` tương thích sinh ra sau đó.

⚠️ Số HS ở chế độ cả lớp là **số em ĐÃ CÓ DỮ LIỆU**, không phải sĩ số lớp — đội chưa chơi xong thì chưa
có mặt trên bảng (thầy: *"vì có thể có đội chưa xong"*).

⚠️ Node `kind:"showdown"` nằm chung `items` với class roll **vì luật Firestore chỉ mở đúng một đường**
(xem `core/classes.js`). Kèm theo: `core/store.js` có `APP_DATA_KINDS = {class, showdown}` —
**thêm bất kỳ `kind` dữ liệu-ứng-dụng nào về sau PHẢI khai vào đó**, không thì nó ăn mất một số link
và một `?a=57` trả về document cài đặt.

### ⭐⭐⭐ BẢNG KẾT QUẢ BẢN ĐỢT 207 (20/8/2026) — ĐỌC MỤC NÀY TRƯỚC KHI SỬA PHỄU

Bảy luật dưới đây **ghi đè** mô tả cũ ở hai mục Đợt 177/180 ngay trên.

**(a) ⛔⛔ % LÀ `pctOf()` TRONG `core/showdown.js` — CHIA CHO TỔNG SỐ CÂU ĐƯỢC CHIA.**
Đợt 176 chia cho `attempted` và **giấu hẳn %** khi em đó chưa làm câu nào (thầy khi ấy: *"không tính %
cho các câu chưa làm"*). Đợt 207 thầy chốt ngược: *"Mọi tên đều được tính %, kể cả 0%… Các câu không
làm hoặc không làm kịp vẫn được tính vào % đầy đủ."* **Đừng "khôi phục" mẫu số cũ — nó không phải lỗi.**
- MỘT hàm, BA màn: phễu · danh sách từng câu · Recent results. Trước đó phép tính này có **hai bản**.
- `right + wrong === total` vốn đúng sẵn ⇒ `% = ✓/(✓+✗)`, khớp hai số in cạnh nó. Thứ tự đọc là
  **`5 ✓ 5 ✗ 50%`**, % đứng CUỐI.
- Hệ quả đã biết và chấp nhận: **trận cũ trong sổ cái xem lại ra % khác trước**.

**(b) ⭐ MỘT CÁI TÊN KHÔNG BAO GIỜ ĐƯỢC CẮT — `fitPodiumNames(root, sel)`.**
Co cỡ chữ trước (sàn **62%**), hết chỗ mới `shortenName`, tên đầy đủ ở `title`.
- ⚠️ **GỌI SAU KHI ĐÃ APPEND** — nó ĐO, mà cây rời không có bề rộng nào để đo.
- ⚠️ **`min-width: 0` trên chính ô tên là thứ chịu lực.** Thiếu nó phần tử flex không chịu hẹp,
  `scrollWidth > clientWidth` **không bao giờ đúng**, và hàm kết luận mọi tên đều vừa — hỏng **im lặng**.
- ⚠️ Chạy lại một lượt ở `document.fonts.ready`: font chưa nạp là bề rộng khác (Đợt 153).
- ⛔ **Cấm `requestAnimationFrame`** trong đó — cột myActivity chạy nền là rAF treo.
- Cột preview của Recent results gọi **chính hàm này** với `sel = ".aw-sd-mini-name"`.
- ⚠️ `shortenName` đã **chuyển sang `core/showdown.js`** (Đợt 207) để bảng kết quả dùng được;
  `showdown-setup.js` re-export nó dưới tên cũ, đừng khai bản thứ hai.

**(c) SỐ THỨ TỰ NAY NẰM TRONG Ô, và đó là một ĐÁNH ĐỔI thầy đã chọn.**
Số cũ treo ngoài ô, bám mép trái đang hẹp dần — **chính đường chéo ấy làm phễu ra hình phễu**. Nay số
thẳng hàng trong ô (3 hạng đầu là **icon huy chương mang sẵn số 1/2/3**, `icons.medal1..3`), phễu chỉ
còn dựa vào mép ô. Đã báo trước khi làm; **không phải chỗ sót để dọn dẹp**.
⚠️ Số trong huy chương vẽ bằng `<path>`, **không `<text>`** — `<text>` đổi bề ngang theo font đang có
và sẽ lệch khỏi tâm mặt huy chương ở cỡ nhỏ.

**(c-bis) ⭐⭐ Đợt 208 — TÊN 3 BẠN ĐẦU VÀNG LẤP LÁNH, VÀ SPARKLE BÁM QUANH TÊN.**
Dải vàng chạy ngang chữ (`background-clip: text` + `color: transparent`) và hào quang thở.
- ⛔⛔ **HÀO QUANG LÀ `text-shadow`, KHÔNG BAO GIỜ `filter`** — Đợt 198 đã phải gỡ đúng thứ đó ra khỏi
  dòng chữ ngay dưới nó: `filter` đẻ stacking context. `text-shadow` **vẫn vẽ** khi chữ trong suốt, vì
  bóng đổ theo HÌNH DẠNG chữ chứ không theo màu chữ.
- ⛔⛔ **Đợt 210 — KHÔNG CÒN GÌ CHẠY TRÊN CHỮ, VÀ ĐÓ LÀ LỆNH CỦA THẦY.** Lịch sử ba đợt của một hiệu
  ứng, giữ lại vì nó dạy hai bài khác nhau:
  1. Đợt 208 cho dải sáng chạy ngang chữ (dải HỮU HẠN + `background-position` theo %) → **khựng cuối
     mỗi vòng**, vì `background-position` theo % KHÔNG dịch ảnh đi ngần ấy % — nó căn điểm X% của ảnh
     vào điểm X% của hộp, nên khung cuối không trùng khung đầu.
  2. Đợt 209 chữa đúng kỹ thuật: `repeating-linear-gradient` chạy ngang, dịch đúng MỘT chu kỳ bằng đơn
     vị độ dài → liền mạch thật.
  3. **Đợt 210 thầy xoá cả hai**: *"rất xấu… không có gì chạy ở bên trên tên cả."* Mượt cỡ nào cũng
     vẫn là thứ đang bị chê. Nay chữ **vàng ĐẶC** + hào quang **thở** từ nền chữ: `text-shadow` **hai
     lớp mỗi khung** (lõi hẹp sáng + quầng rộng mờ — một lớp đơn đọc ra là chữ nhòe, không phải chữ
     phát sáng), nhịp `ease-in-out` 0→50→100 đối xứng nên không có mối nối theo cấu trúc.
  ⛔ **Đừng đưa gradient/sheen nào quay lại `.aw-sd-pod-name.is-top`.**
  **HAI LUẬT CHUNG rút ra:** (a) hoạt cảnh lặp vô hạn thì khung cuối phải LÀ khung đầu — kiểm bằng con
  số, đừng kiểm bằng mắt; (b) **chữa cho mượt một hiệu ứng đang bị chê là chữa sai đề** — hỏi lại xem
  thứ bị chê là lỗi kỹ thuật hay bản thân ý tưởng.
- ⚠️ **Sparkle phải nằm trong bọc `.aw-sd-pod-nm`, KHÔNG nằm trong `.aw-sd-pod-name`** — ô tên mang
  `overflow:hidden` (chính nó làm cho tên quá dài đo được), nên sparkle đặt bên trong bị cắt đúng ở
  cái mép nó cần đứng lên.
- Cả ba đều VÀNG (thầy chốt), kể cả ô bạc và ô đồng.

**(d) ⭐⭐ HAI Ô TÍCH CHIA ĐỘI + HAI SỐ ĐẾM (`renderReviewPodium(..., { picks })`).**
⭐ Đợt 208 đổi hình: **chấm tròn đặc mờ**, bấm ra **dấu ✓ to dày xanh dương đứng một mình**, không khung.
⚠️ **Nút giữ nguyên 4.8cqw** — chấm chỉ là con của nó. Thu nút xuống bằng cái chấm là để lại đích bấm
to bằng móng tay trên cái bảng người ta chạm từ khoảng cách một cánh tay.
Thầy dùng bảng kết quả để **chia đội cho hoạt động sau**: tích trái/phải, đếm hai bên.
- **`picks` là Map do MÀN HÌNH truyền vào**, không phải bộ vẽ tự giữ. Bảng bị dựng lại mỗi lần đổi
  phạm vi và **mỗi lần một đội khác nộp kết quả** (listener Đợt 196) — Map nằm trong bộ vẽ là công chia
  đội bay mất giữa chừng. Không truyền `picks` thì không dựng ô tích.
- ⚠️ **Ô không được chọn ẩn bằng `visibility`, KHÔNG `display:none`/gỡ node** — nó phải giữ chỗ, nếu
  không ô tên nhảy ngang ngay dưới ngón tay.
- ⚠️ **Ô tích là con của HÀNG**, nên nó bám mép ô và **hẹp dần theo phễu, cố ý KHÔNG thẳng hàng** (thầy
  chốt). Đừng "căn cho thẳng".
- ⚠️⚠️ **Đợt 208 — VỊ TRÍ HAI SỐ ĐẾM DO `placePodiumCounts()` ĐO, KHÔNG PHẢI CSS GHIM.** Ngang tâm
  **ô HS thứ 4** (`offsetTop`, nên không trôi khi cuộn — đúng nghĩa "khi chưa cuộn" thầy nói), và chính
  giữa mép trong khung ↔ dấu tích của hàng đó, **mép phải đã trừ thanh cuộn**
  (`offsetWidth − clientWidth`). ⛔ **Đừng ghim lại bằng `top`/`left`/`right` trong CSS**: số đo cứng của
  Đợt 207 chính là lý do số bên phải nằm dưới thanh cuộn — nó không thể biết hình dạng cái phễu, mà cái
  phễu đúng là thứ nó phải tránh. CSS chỉ còn giữ phép `translate` căn tâm, để đổi cỡ chữ (1 chữ số →
  2 chữ số) không đẩy số lệch khỏi tâm đã đo.
  🐞 Bẫy đại số đã cắn: `left`/`right` là **khoảng cách TỪ MÉP**, không phải toạ độ — viết
  `right = mép − sb − đích` thay vì `mép − đích` là lệch **đúng bằng bề rộng thanh cuộn**.
- Hai số **hiện cùng lúc** (bên kia hiện `0`) và **đứng yên khi cuộn**: chúng là anh em của khung cuộn
  `.aw-sd-pod`, không phải con của nó — đó là lý do bộ vẽ trả về **`.aw-sd-podwrap`**, không trả
  `.aw-sd-pod`. ⚠️ **Ai xoá bảng theo selector phải biết CẢ HAI tên.**
- ⭐⭐ **Đợt 209 — TÍCH HẾT THÌ HAI SỐ CHUYỂN XANH LÁ + SPARKLE VÀNG** (`.aw-sd-podwrap.is-all`).
  ⚠️ **So với sĩ số TRÊN BẢNG (`ranked.length`), KHÔNG phải sổ lớp**: phạm vi ĐỘI chỉ có một đội, phạm
  vi LỚP chỉ có những em đã xong — so với sổ lớp là đèn không bao giờ sáng ở phạm vi đội.
  ⚠️ Xanh `#16a34a` là **xanh "đúng rồi" sẵn có** (dải cao nhất của `pctBand`), đừng đẻ màu xanh thứ tư.
  ⚠️ Sao phải `animation-play-state: paused` khi chưa dùng tới — chạy dưới một lớp `opacity:0` là ngốn
  một lần vẽ lại mỗi khung hình suốt cả buổi học.

**(e) ⭐⭐ FULLSCREEN CỦA MÀN SHOW ANSWERS — `container-type` LÀ THỨ CHỊU LỰC.**
Nút ở góc dưới trái, nhắm vào **chính `.aw-review`**, KHÔNG phải `root` (ngược luật Đợt 12 — ở đây mục
đích là bỏ hết chrome đi).
- ⚠️ `.aw-review` phải mang **`container-type: size`** — nhưng **CHỈ Ở `.is-fs`**. Mọi cỡ trên màn này
  là `cqw`, container thường là `.aw-stage`, mà **stage không to ra khi con nó fullscreen** ⇒ không có
  nó thì bảng phủ kín tường mà chữ vẫn bé bằng lúc trong khung.
  ⛔⛔ **ĐỪNG KHAI THƯỜNG TRỰC — đã cắn thật ngay trong Đợt 207.** Cỡ của một query container là **HỘP
  NỘI DUNG**, mà `.aw-review` có lề `2.4cqw`: khai thường trực là đổi mọi `cqw` từ "1% bề ngang stage"
  (968px) sang "1% bề ngang stage TRỪ LỀ" (920px) ⇒ **chữ Show answers của CẢ 17 template nhỏ đi 4,8%**
  (23,18 → 22,07px), **im lặng, và mọi lưới vẫn xanh**.
  ⛔ **LUẬT RỘNG HƠN:** thêm `container-type` vào một phần tử **CÓ LỀ** là đổi ý nghĩa của mọi `cqw`
  bên trong nó. Trước khi khai, hỏi: *hộp nội dung của tôi có bằng container hiện tại của đám con
  không?* Không bằng thì mọi cỡ bên trong vừa đổi hết.
- ⚠️ Lề của chính `.aw-review` phải khai lại bằng `vh/vw` trong `.is-fs` — **không gì tự truy vấn
  chính nó**.
- ⚠️ **Mọi đường ra phải dọn**: `dispose()` gỡ `fullscreenchange` và thoát fullscreen. Esc và việc màn
  bị gỡ **không phải cú click** — teardown viết trong `onclick` là bỏ sót hai đường (ghost-clock 131).
- ⚠️⚠️ **Trong myActivity chia cột, fullscreen chỉ phủ kín CỘT đó** (WebContentsView). Đã báo thầy.
- ⚠️ `requestFullscreen` đòi **cử chỉ người dùng thật** — `.click()` lập trình bị từ chối, nên bàn thử
  chỉ nghiệm được **đường lùi** (bị từ chối thì màn hình vẫn nguyên vẹn, không kẹt, không lỗi).

**(f) RECENT RESULTS: CŨ NHẤT BÊN TRÁI** (đảo Đợt 197).
⚠️ **Đảo LÚC VẼ, KHÔNG đảo trong `loadMatches`** — hàm đó còn `slice(0, MAX_MATCHES)` và lát đó phải
giữ **`MAX_MATCHES` trận MỚI NHẤT** (10 từ Đợt 224, was 5); đảo trong đó là sổ cái lặng lẽ hiện trận
tháng trước. Luật phá hoà khi hai trận trùng mili-giây (lỗi thật của Đợt 197) phải giữ nguyên.
⭐ Đợt 224 — màn vẽ (`openRecent` trong `core/showdown-setup.js`) đổi sang **2 tầng × 5 cột**
(`grid-template-rows: repeat(2, minmax(0, 1fr))`); thứ tự cũ→trái/mới→phải ở trên KHÔNG đổi gì, grid
tự chảy row-major nên tầng 1 rồi tầng 2 vẫn đúng thứ tự đó.
⛔⛔ **BẪY ĐÃ CẮN KHI DỰNG**: `grid-template-rows: repeat(2, 1fr)` KHÔNG PHẢI
`repeat(2, minmax(0, 1fr))` — `1fr` trần là `minmax(auto, 1fr)`, nên một cột có nội dung hơi cao sẽ
đẩy CẢ LƯỚI cao hơn khung `.aw-sd-recent` được cấp: đo được `.aw-sd-rec-cols` tràn 11px dù mắt nhìn
không lộ gì và `.aw-sd-recent` (khung ngoài) báo 0 tràn — đúng họ với bẫy `min-height:0` ở flex, một
cấp lên grid. `minmax(0, 1fr)` là vé để một cột thật sự được PHÉP co lại bằng đúng phần được chia.

**(g) Ô QUESTIONS ở màn chọn lớp — `left` LÀ CỦA ĐỘI ÍT NGƯỜI NHẤT.**
`each = q ÷ đội ĐÔNG nhất` (đúng phép chia `applyBalance` của engine — đổi nó là đổi luật chơi);
`left = q − each × đội ÍT NGƯỜI nhất` (thầy: *"số câu hỏi tối đa bị bỏ lại"*). Bản cũ đo `left` ở đội
ĐÔNG nhất, tức `q mod biggest`, nên nó **không thể lớn hơn sĩ số đội đông nhất** — 18 em/4 đội/95 câu
báo "0 left" trong khi hai đội 4 em mỗi đội vứt 19 câu.
⚠️ Cỡ đội lấy từ **`targetSizes()`**, không nhẩm `ceil(n/teams)`: lớp đông hơn `MAX_PER_TEAM × số đội`
thì hai cách ra hai số khác nhau và ô sẽ hiện con số lớp không bao giờ thấy. **1 đội là ngoại lệ** —
solo là cả lớp, cap không áp.
Đèn xanh `.is-best` = số đội hiện tại bỏ lại ít nhất trong **2..MAX_TEAMS** (⛔ 1 đội không dự thi,
thầy chốt); **hoà thì mọi phương án hoà đều sáng**.

**(g-bis) ⭐ Đợt 208 — Ô TEAMS CŨNG SÁNG XANH khi lớp chia đều được vào ngần ấy đội.**
⚠️ "Chia hết" = **`targetSizes()` trả về mọi đội BẰNG NHAU**, không phải `n % teams === 0` — hai cách
chỉ trùng khi chưa có gì bị `MAX_PER_TEAM` chặn. ⛔ Từ **2 đội** trở lên (một đội thì cả lớp là đội đó,
luôn "đều", đèn lúc nào cũng sáng thì không nói gì cả).
⚠️ `paintTeamsBest()` gọi **từ trong `paintQuest()`** — hai ô trả lời cùng một câu hỏi, lệch một nhịp là
đọc ra như lỗi. Và nó là **`function` có tên**, không phải arrow (bẫy TDZ Đợt 192).

**(g-ter) ⭐⭐ Đợt 208 — NÚT RESET Ở MÀN CHỌN LỚP MANG HAI NGHĨA.**
Thanh chân vẫn nằm dưới lớp Recent results, nên một nút phải thuộc về **thứ đang được NHÌN**: đang mở
Recent results thì Reset **xoá sổ cái** của lớp đó (`wipeMatches`, viết từ Đợt 197 và tới đây mới có
nút); đóng nó đi thì Reset trở lại nghĩa cũ (gọi mọi HS về từ sổ lớp).
⛔ **Xoá sổ cái KHÔNG hoàn tác được** — sổ lớp lúc nào cũng lấy lại được từ Settings, còn sổ cái là bản
duy nhất của 5 trận đã đánh. Câu hỏi phải nói ra điều đó.
⚠️⚠️ **`.aw-sd-confirm` phải nằm TRÊN mọi lớp của panel** — nó từng là `z-index: 5` trong khi
`.aw-sd-recent` là 6 và `.aw-sd-rec-detail` là 7, tức câu hỏi sẽ nằm **dưới chính thứ nó đang hỏi về**.
Nay là **9**. Thêm lớp mới vào panel này thì phải kiểm lại con số đó.

**(h) HAI DÒNG RESTART ẨN SAU NHẤN GIỮ "SHOW ANSWERS" — ⛔ MỌI MODE, TRỪ ASSIGNMENT (Đợt 243).**
Bảng cuối game dùng chung cho cả 17 template. Từ Đợt 243, **cả** "Start again" **lẫn** "Start with
mistakes" bị ẩn, và chìa khoá là cú nhấn giữ trên **"Show answers"** — một hàm duy nhất,
`lockBehindHold()` trong closure `startGame()` (`core/engine.js`, ngay dưới `showSummary()`).
*Thay thế Đợt 207, vốn chỉ ẩn "Start with mistakes", mở bằng "Start again", và chỉ trong Showdown.*

⛔ **ASSIGNMENT KHÔNG ĐI QUA ĐÂY.** Chế độ học sinh dựng dòng ở nhánh `if (session)` từ ô tích
`session.endOptions` của thầy, và có luồng luyện tập/nộp bài riêng — đừng gọi `lockBehindHold()` ở đó.

⚠️ **CHỈ KHOÁ KHI DÒNG "SHOW ANSWERS" CÓ MẶT.** Nó là chìa khoá duy nhất; ẩn hai dòng restart mà
không có nó = bảng cụt đường (act tắt `showAnswers`, hoặc template không ghi `reviewData`). Không có
chìa thì không khoá gì. ⛔ **Đừng lùi về Leaderboard làm chìa khoá thay thế** — Showdown ẩn luôn dòng
đó (Đợt 208), đường cụt quay lại ngay.

⚠️ Phải **xoá `onclick`** mà `panelItem` gắn trước khi treo `tapOrHold` (nó tự nuốt cú `click` thật —
hai thứ cùng sống là hành động chạy hai lần). Ẩn bằng class + **`disabled`**: hàng cao 0 vẫn bấm
được bằng bàn phím. `overflow:hidden` bắt buộc (bẫy Đợt 137).

⚠️ **Không nhớ trạng thái**: mỗi `showSummary()` dựng dòng mới nên Back về là khoá lại. Đó là mục
đích, không phải sót.

⚠️ **`tapOrHold({holdClass})`** (`core/press.js`, opt-in từ Đợt 243) đeo class suốt cú giữ và gỡ ở
**cả 4 đường ra** (đủ giờ · nhấc tay sớm · trượt ngón · `pointercancel`/`lostpointercapture`). CSS
`.aw-panel-item.is-holding` chạy **420ms** — con số này **PHẢI** luôn bằng `HOLD_MS` của `press.js`,
vì hoạt cảnh chạy hết chính là lời hứa cú giữ đã ăn.

⛔ **BẪY KHI VIẾT BENCH ĐO CÁI NÀY**: tab chạy nền thì đồng hồ hoạt cảnh của trình duyệt đứng im,
mọi `transition` kẹt ở `currentTime 0`, nên dòng vừa mở khoá đo ra **cao 0px** dù CSS đúng hoàn toàn.
Gọi `document.getAnimations().forEach(a => a.finish())` **trước khi đo**.

**(i) TÊN ACT TRÊN ĐẦU BẢNG SHOW ANSWERS — và cách thu nhỏ nó cho vừa (Đợt 244).**
`mountShowdownReview({ actName })` — engine tính bằng `sdBoardName()` (trong closure `startGame()`),
đúng công thức `formatActDisplayName()` mà sổ cái dùng, nên bảng cả lớp đọc lúc hết giờ và tấm thẻ
Recent results **không thể gọi một ván bằng hai tên**. `""` = giữ nguyên chữ "SHOWDOWN" cũ.

⛔⛔ **ĐỪNG ĐO "CHỮ CÓ VỪA KHÔNG" BẰNG `scrollWidth > clientWidth` TRONG MỘT HÀNG FLEX.** Đo thật,
mất hai vòng sửa mới ra:
* lúc chữ còn tràn, flexbox **ghim** `clientWidth` đúng bằng chỗ trống; ngay khi vừa, `clientWidth`
  quay ra **bám theo chữ** — hai vế của phép so thôi không còn là hai đại lượng khác nhau;
* `letter-spacing` ở đây là **`0,2cqw` — độ dài CỐ ĐỊNH, không phải `em`**, nên bề rộng cần =
  `glyph × tỉ_lệ + 122px`, không phải bội số thẳng của tỉ lệ. Tìm nhị phân đo sai một bước là không
  tự sửa lại được ở bước sau.

**Cách đúng — để trình duyệt đo cả hai số:**
```js
el.style.flex = "1 1 0";  const room  = el.getBoundingClientRect().width;  // chỗ trống còn lại
el.style.flex = "0 0 auto"; /* rồi đổi cỡ chữ và đọc */                    // chỗ chữ muốn có
```
⚠️ Và phải đo lại mỗi khi **bất cứ thứ gì khác trên cùng hàng** đổi bề rộng. Trên hàng này thủ phạm
là con quay tải (`.aw-sd-ttl-status`): nó hiện ra *sau* lần đo đầu, ăn ~28px, và tên thò ra ngoài 4px
suốt 3 giây. `showSpinner`/`showUpdated`/`clearStatus` đều phải gọi lại hàm fit.

⛔ **Khi viết bench đếm "mấy dòng": đừng so chiều cao hộp với `font-size`.** Cỡ chữ đã thu nhỏ nhưng
chiều cao hộp vẫn theo `line-height` của **dòng cha**, nên phép so đó báo "2 dòng" cho một dòng hoàn
toàn bình thường. Đếm hộp dòng thật: `Range.getClientRects().length`.

**(j) THANH PHÂN LOẠI — BA TRẠNG THÁI, KHÔNG PHẢI HAI (Đợt 241 + 244).**
`buildClassifyBar()` giữ `settled` (mờ sau Apply) · `dirty` (đã kéo thật ⇒ nút Apply hiện lại) ·
`awoke` (Đợt 244 — mới chạm dậy, chưa làm gì). Chạm suông rồi bấm ra ngoài thì **ngủ lại**; đã kéo
thật thì **giữ sáng** — không giật mất thanh dưới tay thầy.
⚠️ Người nghe cú bấm ngoài nằm trên `document` ở **pha CAPTURE** (bảng có thể đang chạy trong phần tử
toàn màn hình, và thứ bị bấm có thể `stopPropagation`).
⚠️ Nó **tự gỡ mình** khi thấy thanh không còn trong trang: hàm chỉ trả về cái node, **không có
`dispose()`** cho người gọi quên — mà listener trên `document` sống lâu hơn màn hình sinh ra nó chính
là con-ma Đợt 131.

### Hợp đồng cho template (opt-in — Đợt 178: 8/17 template)

```js
showdownMode: true,     // HẾT — NẾU 3 điều kiện dưới đây đã đúng sẵn.
```

Engine lấy mọi thứ từ những gì template **đã** làm sẵn:
- **Câu nào của ai** ← `ui.setNav({index})` (và/hoặc `ui.itemChanging(index0)`).
- **Ai đúng ai sai** ← mảng `review` template đã dựng ở `finish()`.
- Luật chia lượt nằm ở **`memberAt(members, index0)`** — vòng tròn, quay lại từ đầu khi hết đội.
  ⚠️ **Chỉ MỘT luật này**: bảng Show answers cũng gọi lại chính nó để gom câu theo em, chứ không tự
  tính `i % n` lần nữa. Hai bản là hai thứ tự do trôi khỏi nhau.

#### ⚠️⚠️ BA ĐIỀU KIỆN — KIỂM ĐỦ 3 RỒI HÃY BẬT CỜ (Đợt 178)

**(1) `index` phải là VỊ TRÍ CỦA CÂU TRONG MẢNG `review`** — không phải "lượt thứ mấy", càng không
phải điểm số. `stampReview` đóng dấu **theo vị trí mảng**: `review[i]` thuộc về `memberAt(members, i)`.
- Nói "vị trí trong `review`" chứ không nói "lượt thứ mấy" là có chủ ý: game cho hỏi lại câu cũ
  (`repeatUntilCorrect`) thì **câu quay về đúng em đã sở hữu nó**, và đó cũng là cách duy nhất còn
  khớp được với Show answers (một câu có đúng MỘT hàng, dù hỏi mấy lần).
- 🔴 **Đã cắn thật**: `true-false.js` gửi `index: liveScore()` và `open-the-box.js` gửi
  `index: score` — **ĐIỂM SỐ**, không ai để ý vì trước Đợt 178 chưa thứ gì đọc nó như một vị trí.
  Đo được: bật Showdown lên, mỗi câu SAI làm tên nhảy về em số 1 (điểm âm bị `Math.max(0,…)` kẹp),
  rồi câu sau mới nhảy lại — 10 lần đổi tên cho 8 lượt. Nếu template cần hiện thứ khác trên thanh nav
  thì dùng **`label`** (engine ưu tiên `label` khi có), còn `index` để yên cho lượt chơi.
- ⚠️ `index` cũng nuôi **đồng hồ TỪNG LƯỢT** (`roundBegin(index - 1)`), nên sai `index` là sai luôn
  cả giờ của học sinh.

**(2) `review` phải theo ĐÚNG THỨ TỰ CHƠI.** Game cho học sinh **tự chọn câu** (Crossword bấm ô nào
cũng được, Open the box mở hộp nào cũng được) thì `review` xuất theo thứ tự lưới/hộp, **không phải
thứ tự chơi** ⇒ `stampReview` sẽ gắn tên vào những hàng mà em đó chưa từng thấy. Sửa được, nhưng phải
viết lại `finish()` cho xuất một hàng cho mỗi LẦN MỞ CÂU — không phải chuyện bật một cái cờ.

**(3) PHẢI CÓ CHỖ TRỐNG CHO CÁI TÊN, và phải NHÌN mới biết.** Tên là `.aw-top-centre.is-showdown`,
`position:absolute`, thụt 22% hai bên trên `.aw-topbar`, cỡ **3.6cqw**. Game vẽ tràn khung (kiểu
arcade) thường đã chiếm sẵn dải đó bằng câu hỏi / băng / tim của chính nó.
- 🔴 Đợt 178 gặp cả **ba** kiểu hỏng ở đây, và **mọi phép đo tự động đều báo ĐẠT** (node có thật, có
  kích thước, `visibility:visible`):
  - **Bị che**: Balloon pop vẽ lớp khinh khí cầu ĐÈ lên. Bắt bằng `elementFromPoint` ngay tâm chữ —
    trả về `.aw-bp-blimps`. Đã vá chung ở core bằng `z-index: 6` cho `.aw-top-centre.is-showdown`
    (trên nền game, dưới mọi lớp phủ của engine — xem chú thích trong `app.css`).
  - **Chìm màu**: Gameshow có màn hình studio TỐI, mà mực mặc định là `--aw-fg` gần đen ⇒ gần như
    tàng hình. Template nền tối **phải tự khai màu** cho `.aw-stage.act-<type> .aw-top-showdown`.
  - **Hết chỗ**: Flying fruit (câu hỏi chiếm dải trên, nền rừng tối) và Maze chase (băng câu hỏi +
    tim) — **CHƯA BẬT**, vì đặt tên vào đó là in đè lên chính nội dung game. Cần thầy chốt chỗ đặt
    (engine đã có sẵn đường đưa tên xuống `.aw-navstack` dưới khung khi bật đồng hồ lượt).
- ⚠️ Template tự treo caption vào `.aw-topbar` (KHÔNG qua `ui.sloganSlot`) thì caption đó là **anh em
  ruột** của `.aw-top-centre`, nên luật ẩn sẵn của engine không với tới ⇒ phải tự ẩn bằng
  **`.aw-topbar.is-showdown > .aw-<x>-slogan { display: none; }`** (Speaking và Unjumble đã làm).

#### Bảng hiện trạng 17 template (Đợt 178)

| Đang BẬT (8) | Vì sao chưa bật (9) |
|---|---|
| Quiz · Anagram · Type the answer (từ Đợt 155) | **Flying fruit · Maze chase** — plumbing ĐÚNG, chỉ thiếu chỗ đặt tên (xem điều kiện 3) |
| **Balloon pop** (`z-index` core) | **Crossword · Find the match · Open the box** — học sinh tự chọn thứ tự câu / hỏi lại được ⇒ vi phạm điều kiện 2 |
| **Gameshow** (+ màu chữ riêng) | **Whack-a-mole** — nhiều chuột cùng lúc, `review` KHÔNG ghi kết quả gì (mọi hàng `answered:false`) |
| **Speaking · Unjumble** (+ ẩn slogan riêng) | **Running word · Running team** — đã có cơ chế chia đội/xoay lượt RIÊNG; Running team còn xoay vòng theo đúng sổ lớp, chồng thêm là hai vòng mâu thuẫn |
| **True/false** (đổi `index` từ điểm sang hàng) | **Speaking cards** — không chấm điểm, không có đáp án đúng |

⚠️ **Showdown và Fight LOẠI TRỪ NHAU** — cả hai cùng định nghĩa "câu này của ai" và cùng giành dòng
giữa topbar. Vào Fight thì `clearPick()`; `showdownPick` có `!fight` trong điều kiện.

### ⭐⭐ DÒNG TÊN: VỊ TRÍ ĐỘC LẬP + ĐỔI ĐÚNG NHỊP CÂU HỎI (Đợt 159)

**(a) Vị trí.** `.aw-top-centre.is-showdown` **ra khỏi dòng chảy** (`position:absolute`, chèn 22% hai
bên trong `.aw-topbar` đã `position:relative`). Là con flex, nó bị căn giữa **phần còn lại** giữa đồng
hồ và điểm, nên `0:09 → 0:10` là tên **dịch theo** (thầy báo 15/8/2026). Đo sau khi sửa: bơm đồng hồ
thành `00:00:00`, tâm chữ **lệch 0px**.
⚠️ **Chỉ Showdown**. Slogan của template vẫn in-flow: nó là chữ dài, nhạt, *nên* nhường chỗ; còn đây là
một cái tên ngắn không được phép nhúc nhích. Đã đo template thường: `position: static`, y như cũ.
⚠️ Dùng `left/right` chứ **không** `transform: translateX(-50%)` — giữ thói quen của hợp đồng xếp lớp
popup (dù `.aw-topbar` nằm trong stage, không phải tổ tiên của `.aw-below-center`).

**(b) `ui.itemChanging(index0, {outMs, inMs})` — HOOK MỚI CỦA HỢP ĐỒNG, tuỳ chọn.**
Template gọi **TRƯỚC** khi bắt đầu ẩn item cũ, kèm **đúng hai con số animation của chính nó**:
```js
ui.itemChanging?.(i, { outMs: 130, inMs: 190 });   // quiz.js, ngay đầu showQuestion()
```
Vì sao cần: `ui.setNav` được gọi **ở GIỮA** hai nhịp (Quiz: ẩn 130ms → swap → hiện 190ms; setNav ở
swap), nên tên chạy theo setNav luôn **trễ một nhịp**. Có hook thì tên rơi cùng khung hình với câu hỏi.
- ⚠️ `index0` **đếm từ 0**, khác `setNav` đếm từ 1.
- ⚠️ Engine giữ `sdNameIndex`: ai tới trước thì sở hữu index đó. Thiếu nó, `setNav` sẽ **dập chữ mới vào
  giữa lúc đang rơi**.
- Template **không gọi cũng chạy y như cũ** (đổi tên tức thì ở setNav) — thuần bổ sung.
- Hiện có: `quiz.js` (130/190) · `anagram.js` (160/190). Đo mẫu: t=140ms tên cũ mờ 0.20 ở y=+31 trong
  khi thẻ bài 0.01 → t=188 tên mới y=−29 → t=334 cả hai về 1.0.

⚠️ **DÒNG GIỮA TOPBAR NAY CÓ HAI NODE** (`.aw-top-centre` bọc `.aw-top-slogan` + `.aw-top-showdown`),
CSS ẩn cái không dùng. **Ẩn chứ KHÔNG ghi đè**: `anagram.js` viết lại `ui.sloganSlot.textContent`
**mỗi lần `render()`**, nên tên HS nhét chung node đó sẽ bị xoá lúc sang từ mới — âm thầm, và chỉ ở
đúng một game có slogan. Ai thêm thứ thứ ba vào ô giữa: giữ đúng khuôn "mỗi thứ một node".

### ⛔⛔ BẪY CHỮ VIỆT ĐÃ CẮN THẬT Ở ĐỢT NÀY — ĐỌC TRƯỚC KHI ĐẶT CHỮ TO VÀO KHUNG CÓ CLIP

**(a) Đỉnh chữ Ẳ bị XÉN 5px** ở dòng tên học sinh — chữ TO NHẤT màn hình. `line-height: 1.35` đã
đúng luật, nhưng phần tử **cao ĐÚNG BẰNG hộp dòng của nó** và mang `overflow:hidden`, mà ở 1.35 ink
của Ẳ **vẫn thò lên trên hộp dòng 0,111em** (phần dư mục `line-height` phía trên đã cảnh báo).
**Mọi phép kiểm rẻ tiền đều BÁO SẠCH**: không tràn cuộn, không ellipsis, không thò ngoài topbar.
**Chỉ công thức ink bắt được** — và phải dùng đúng công thức ở mục "BẪY ĐO ĐẠC" phía trên.

**(b) Chữa bằng `padding` một mình lại làm TOPBAR PHÌNH 47px → 66px**, đẩy play area xuống 24px:
`.aw-topbar` **tự co theo nội dung**, con cao lên là hàng cao lên, và game bên dưới mất 24px chiều
cao **chỉ trong Showdown**. → Cách đúng: **`padding` + `margin` âm bù đúng bằng nó**. Hộp clip (thứ
`overflow` cắt theo) vẫn to ra, còn chỗ chiếm trong dòng chảy **y nguyên**, và chữ **không dịch một
pixel** vì padding đối xứng trên khung flex căn giữa.

> **LUẬT RÚT RA (dùng cho mọi chỗ sau này):**
> 1. Chữ Việt + `overflow:hidden` + hộp cao bằng hộp dòng ⇒ **PHẢI đo ink**, đừng tin `line-height`.
> 2. Bù ink bằng `padding` thì **ĐO LẠI CHIỀU CAO CỦA CHA NGAY SAU ĐÓ**, và bù `margin` âm.
> 3. Ink thò ra **chỉ thành lỗi khi sát mép một khung CÓ CLIP**. 3 phần tử khác trong bảng kết quả
>    cũng ink âm nhưng không `overflow:hidden` ⇒ vô hại. Đừng vá bừa cả loạt.
> 4. Kiểm chồng dòng phải **đối chứng cả trục X**: lần đo đầu báo "đâm dòng trên" là **dương tính
>    giả** — "phần tử trước" hoá ra là ô SỐ nằm **cạnh**, không phải trên.

### ⭐⭐ BẢNG SHOWDOWN BẢN ĐỢT 159 — ĐỌC MỤC NÀY THAY CHO MỤC "BA MÀN" BÊN DƯỚI

Mục "BA MÀN" ngay sau đây là bản Đợt 156; phần **cỡ bảng, số đội, màn C và luật ẩn đội** trong đó
**đã bị thay**. Giữ lại vì mọi luật khác (hai tầng dữ liệu, claim, TTL, `prompt()`) vẫn đúng nguyên.

| | Đợt 156-157 | **Đợt 159 (hiện hành)** |
|---|---|---|
| Số đội | 2–8 | **1–5** (`MIN_TEAMS`/`MAX_TEAMS`) |
| Màn | A · B · **C đang chạy** | A · B (**C xoá hẳn**) |
| Single mode / Reset | nút ở màn C | **2 icon ở hàng tiêu đề**, cả hai **hỏi xác nhận** |
| Nút Back ở màn B | có | **bỏ** — đường về màn A là Reset |
| Đội máy khác giành | **ẩn** | **hiện mờ + `pointer-events:none`** |
| Panel | 660 × 410 | **860 × 560** |

**⭐ MỘT ĐỘI = CẢ LỚP, VÀ KHÔNG CHẠM FIRESTORE.** `teamCount === 1` là một chế độ thật: màn A hiện
**READY** thay cho Next, pick lấy **tên lớp** làm tên đội và mang id hằng **`SOLO_TEAM_ID`**
(`sd_solo`, cố ý không phải `sdt_N`). Không `saveSetup`, không claim, không `onSnapshot`.
⚠️ **Vẫn phải `releaseMyClaim()`** khi vào chế độ này — đó là dọn claim của chế độ TRƯỚC.
⚠️ Và vì không có gì trên mây, mở lại bảng phải lấy **lớp + danh sách từ chính pick** (`ctx.currentTeam`),
không thì bảng hiện "— choose a class —" đè lên một chế độ đang chạy.

**⭐⭐ SỐ ĐO (bản 159b — thầy sửa tiếp ngay trong ngày sau khi nhìn bản dựng):**
- **Bề rộng = đúng bằng `.aw-below`** (khung app), truyền vào qua **`--sd-panel-w`**.
  ⚠️⚠️ **PHẢI là custom property, KHÔNG được `style.width`**: `swapContents` **xoá `style.width`** giữa
  chừng để đo cỡ tự nhiên và xoá lại lúc tháo lớp ⇒ inline width biến mất ngay lần mở đè bảng khác.
- ⚠️ **CỘT KHÔNG ĐƯỢC KHAI BỀ RỘNG** — `flex: 1 1 0`, chia nhau phần đang có. Bề rộng cứng (bản trước:
  5 × 156 = 820) gặp panel bị `94vw` kẹp lại là **tràn ngang**, đúng cái ảnh thầy chụp.
- **Hai bố cục** (`.is-side` ≤3 đội / `.is-top` ≥4 đội) và **thân bảng khác nhau** (`--sd-body-h`):
  470px cho side (cột chứa 10) · 400px cho top (cột chứa 4–5).
- **Sức chứa mỗi đội = `Math.ceil(sĩ số / số đội)`** (`capPerTeam()`), không tra bảng: lớp 20 ra đúng
  10/7/5/4 như thầy tính, lớp khác cũng chia đều.
- ⚠️ **Ô chờ ở bố cục dọc phải 2 CỘT chữ** (`grid 1fr 1fr`, rộng **360px**): xếp 1 cột thì 20 em
  **cuộn 325px**; và ở 336px thì tên dài nhất **mất 2px vào dấu …** — luật là không bao giờ cắt tên.
- ⚠️ **Ô tên trong CỘT nén hơn ô trong ô chờ** (`padding 5/10`, gap 3): ở cỡ của ô chờ, cột 10 ô
  **tràn 32px** (đo được).
- Đo lại cả 4 ca (2 · 3 · 5 đội · và 2 đội khi cả lớp còn chờ): **0 cuộn ngang, 0 cuộn dọc, 0 tên bị
  cắt, cả panel cũng không cuộn**.

**⭐ HÀNG DƯỚI LÀ TOÀN BỘ PHẦN KHUNG CÒN LẠI** (159b): `[Single][Reset][Random/Flyback]` — **SHOWDOWN**
— `[Ready]`. Không còn hàng tiêu đề phía trên, không còn câu hướng dẫn.
**Random ↔ Flyback dùng CHUNG một chỗ ngồi**: còn em ở ô chờ thì là Random (xáo Fisher-Yates rồi chia
vòng tròn **từ đội ít người nhất**), hết em thì thành Flyback (có xác nhận).
⚠️ Khi bay hàng loạt, **ô thật phải ẩn tới lúc bóng bay tới** — 20 ô cùng lúc mà không ẩn thì nhìn như
bảng bị nhân đôi. Và ô bay nằm **ngoài** lớp có `--sd-chip-fs` ⇒ **chép cỡ chữ sang tay**.

### ⭐ BA MÀN CỦA BẢNG SHOWDOWN, VÀ LUẬT GIÀNH ĐỘI (Đợt 156 — xem bảng đối chiếu ngay trên)

Bảng nay có **ba màn**, và **một khung cỡ CỐ ĐỊNH** cho cả ba (panel 660px, `.aw-sd-body` min-height 410px —
thầy chốt "size các bảng đều to bằng nhau dù nội dung ít hơn"). ⚠️ **BỀ RỘNG PHẢI Ở ĐÚNG MỘT NƠI — TRÊN PANEL.** Đợt 157 sửa hai lỗi cùng họ: `.aw-tool-panel.is-sd`
chỉ khai `width` nên bị `max-width: min(94vw,580px)` của luật gốc **kẹp lại trong im lặng**; và thân
bảng từng khai bề rộng CỨNG song song với panel — panel hẹp hơn (nó bị kẹp theo màn hình) là thân
tràn ra rồi `overflow-x:hidden` **xén mất điều khiển bên phải**. Khai `width` + `max-width` trên
PANEL, thân `width:100%`.

**Đừng dọn về `auto`**: popover tự
đổi cỡ giữa các bước ngay dưới tay thầy chính là thứ luật này sinh ra để tránh.
  **A SETUP** chọn lớp + số đội (2 ô to), sửa được danh sách HS (xoá / thêm tay) → NEXT
  **B BUILD** pool ô tên trên cùng · team là cột dọc · chạm tên team = chọn cột nhận · chạm ô tên =
             **bay** vào cột · nút ✓ = đội màn hình này chơi → READY
  **C ĐANG CHẠY** Single mode / Reset team

⚠️ **KHÔNG dùng `prompt()`** để nhập tên: nó bị chặn trong WebContentsView của myActivity và sẽ
hỏng **im lặng** đúng chỗ thầy hay dùng. Ô nhập tại chỗ, như hiện nay.

⚠️ **Hàng TEXT|VOICE KHÔNG còn trong bảng này** (Đợt 156, thầy chốt bảng chỉ có lớp + số đội). Nội
dung chọn ở Options, và **Apply của Options giữ nguyên Showdown** vì nó kết thúc bằng
`replayCurrent()` → vào lại `startGame()` → đọc lại pick. Ai dời Apply khỏi `replayCurrent()` là
phá đúng hành vi thầy yêu cầu.

⭐ **GIÀNH ĐỘI** — "1 trình duyệt 1 đội" nay được **cưỡng chế bằng dữ liệu chung**, không dựa vào trí
nhớ: `claims: { [teamId]: {by, at} }` trong `sd_main`, `by` = `browserId()` (cũng
`sessionStorage`). Đội đã bị giành **không hiện** ở trình duyệt khác. Bảng đọc mới toàn khi mở **và**
theo dõi `onSnapshot` suốt lúc mở, nên giành/nhả đội thấy ngay hai chiều.
⚠️ **CLAIM PHẢI HẾT HẠN** (`CLAIM_TTL_MS` = 12 giờ): id nằm ở `sessionStorage` nên **đóng hẳn trình
duyệt là không ai nhả được nữa** — không có hạn thì đội đó chết vĩnh viễn.

⚠️ ~~**Ẩn nút MODE khi đã setup đội.**~~ **HẾT HIỆU LỰC TỪ ĐỢT 158** — không còn nút MODE riêng để mà
ẩn. Xem mục "MỘT NÚT CHO BA CHẾ ĐỘ" ngay dưới.

### ⭐⭐ MỘT NÚT CHO BA CHẾ ĐỘ — BẢNG CHỌN (Đợt 158, 14/8/2026)

Thầy chốt: gộp **SINGLE · FIGHT · SHOWDOWN** vào **một nút** (`icons.modes`), "tránh việc quá nhiều
nút bấm". Hàng dưới khung nay là **Options · Template · Style · MODE**.

```
MODE ──► BẢNG CHỌN (ô icon, KHÔNG CHỮ — 2 ô = 348×162, 3 ô = 508×162)
          ├─ ô Single   ──► hỏi lại ──► về 1 khung
          ├─ ô Fight    ──► hỏi lại ──► startFight()
          └─ ô Showdown ──► bảng đội 3 màn   (trong trận: hỏi lại → thoát trận → bảng tự mở)
```

**Luật hiển thị ô** (thầy chốt): đang ở chế độ nào thì **không hiện ô đó**… **TRỪ Showdown**: khi
Showdown đang chạy, ô Showdown **vẫn hiện, viền xanh lá** (`.is-cur`) và chạm vào là **đường DUY NHẤT**
vào lại màn C (Reset team). ⛔ Bỏ ngoại lệ này là **Reset team thành không có cửa nào tới**.

⚠️ **`openToolPanel()` KHÔNG đổi được ruột bảng đang mở**: gọi nó với đúng nút đang mở là nó **ĐÓNG**
(cử chỉ "bấm lại nút đang mở"). Dùng **`switchToolPanel(buildContent)`** — cùng nút, swap ruột. Và
`mountPanelContent`/`capPanelHeight` **nhận diện bảng BẰNG DANH TÍNH HÀM**, nên builder phải là **hàm
đặt tên**, không được là closure sinh mới mỗi lần gọi (`panel => build(panel, "fight")`) — nó sẽ
**không bao giờ khớp** và bảng mất bề rộng của mình trong im lặng.

⚠️ **Trong trận, ô Showdown KHÔNG được mở thẳng bảng đội.** Xếp đủ 20 em, bấm READY, `replayCurrent()`
dựng lại bàn **vẫn trong trận**, mà trong trận `showdownPick` bị bỏ qua (`!fight`) ⇒ **công xếp đội
bay sạch, không một lời báo**. Phải thoát trận TRƯỚC; bắc cầu qua cú dựng lại bằng cờ **cấp module**
`openShowdownOnMount` (đọc-xong-xoá-ngay, chỉ bắn đúng một lần cho lần mount kế tiếp).

⛔⛔ **MỌI ĐƯỜNG KẾT THÚC SHOWDOWN PHẢI GỌI `releaseMyClaim()`** (hàm xuất của `showdown-setup.js` từ
Đợt 158). Trước đó hàm nhả đội nằm kín trong bảng, nên 2 đường không đi qua bảng (vào Fight từ
Showdown; "Single mode" ở bảng chọn) chỉ xoá pick ở máy này mà **để nguyên claim** ⇒ đội đó **biến mất
khỏi mọi màn hình khác tới 12 giờ**. Máy gây lỗi nhìn hoàn toàn bình thường — hỏng ở chỗ khác, nên
đừng trông chờ tự thấy.

⚠️ **BẢNG NÀY KHÔNG ĐƯỢC KHAI BỀ RỘNG.** Bản đầu cho nó dùng chung `.is-sd` (660px, "to bằng bảng
đội") và thầy bác ngay: *"pop-up nhỏ vừa đủ nhìn thôi"*. Bảng đội to vì phải chứa **20 ô tên**; bảng
này chỉ có 2-3 icon. Nay ô cố định **148×132**, icon **76px**, panel tự ôm lấy ô bằng `width:
max-content` sẵn có của `.aw-tool-panel`.

⚠️ **Icon phóng to phải khai lại `stroke-width`** (và hai số đi kèm nhau): icon vẽ cho nút 22px mang
`2.1`; phóng lên là thành slab (ở bản 193px đầu tiên: **17px**). Nay `.aw-mp-icon svg` = 76px +
`stroke-width: 1.5`. Đổi cỡ ô thì **phải chỉnh lại độ dày nét**.

### ⭐ TEST ĐƯỜNG FIRESTORE **KHÔNG CẦN ĐĂNG NHẬP** — dựng lại bộ giả (Đợt 156)

Mọi thứ của Showdown (và Classes, và store) đều nằm sau đăng nhập Google, mà popup đó **không tự động
hoá được** — nên nhiều đợt trước phải để trống mảng này và ghi "chờ thầy tự thử". Cách gỡ:
**import map** trỏ 2 module cần đăng nhập sang bản giả. Thư mục `scratch/` **đã gitignore** nên bộ này
KHÔNG đi theo repo — phiên/máy sau phải **tạo lại 3 file** (mất ~5 phút, rất đáng):

```
scratch/showdown-test.html   <script type="importmap">{"imports":{
                               "/core/firebase.js":"/scratch/fake-firebase.js",
                               "/core/classes.js" :"/scratch/fake-classes.js"}}</script>
                             rồi import core/engine.js + 1 template + sample như test.html thường
scratch/fake-firebase.js     xuất currentUser/db/fs; `fs()` trả doc/getDoc/setDoc/onSnapshot chạy trên
                             một object trong RAM; xuất `globalThis.__fakeFs` để test tự gieo dữ liệu.
                             ⭐ THÊM `delayMs` cho getDoc — xem dưới.
scratch/fake-classes.js      xuất `listClasses()` trả lớp giả. Đặt TÊN TIẾNG VIỆT CÓ DẤU (Ẳ, Ạ) và ít
                             nhất một lớp ĐỦ 20 HS: đó là ca bắt lỗi xén dấu và ca bố cục xấu nhất.
```

⚠️⚠️ **BẮT BUỘC có núm `delayMs` và BẮT BUỘC thử với nó.** Backend giả trả lời trong vài mili-giây,
nên nó **BÁO ĐẠT OAN** cho mọi lỗi phụ thuộc thời gian. Lỗi `panel.isConnected` ở mục ngay dưới đây
**chỉ lộ ra khi đặt `delayMs = 900`** — với Firestore thật trên mạng lớp học thì nó xảy ra thường
xuyên. Test xong đường "nhanh" thì **luôn chạy lại một lượt ở 900ms**.

### ⛔⛔ `panel.isConnected` LÀ PHÉP THỬ SAI CHO PANEL CÔNG CỤ (Đợt 156 — cắn thật)

`core/engine.js` mở panel công cụ theo **HAI đường**:
- mở nguội ⇒ `panel` chính là `.aw-tool-panel`;
- mở khi **đang có panel khác** ⇒ nó **cross-fade** (`swapContents`), và `panel` là một lớp tạm
  `.aw-swap-in` bị **XOÁ ở `SWAP_MS + 40` = 300ms**, sau khi con của nó đã được chuyển vào hộp thật.

⇒ `panel` thành rác **trong khi giao diện nó dựng ra vẫn sống trên màn hình**. Mọi `await` dài hơn
300ms quay lại sẽ thấy "đã đóng", bỏ ngang, **để lại 'Loading…' vĩnh viễn**.
**300ms là con số bình thường của một lượt Firestore trên mạng lớp học** — mà backend giả ở máy trả
lời trong vài mili-giây nên **phép thử sẽ BÁO ĐẠT OAN**. Bắt được bằng cách cho backend giả chậm
900ms; đo mốc: `t=150ms` lớp swap còn, `t=320ms` **đã bị xoá** mà `body.isConnected` vẫn true.

> 👉 **LUẬT: kiểm "panel còn sống không" bằng phần tử mà swap CHUYỂN ĐI (một node con mình tự tạo),
> KHÔNG phải `panel` được truyền vào.** Và đóng popover bằng cách chạm ra ngoài chạy **hoàn toàn
> trong engine**, không gọi ngược về builder — nên thứ gì cần dọn (listener, interval) phải **tự phát
> hiện mình đã rời DOM** (`MutationObserver` trên `.aw-below-center`). Đã đo: một lần đóng để lại
> **1 listener Firestore sống**, mỗi lần mở-đóng thêm một cái.

⭐ **ĐỢT 158 — CẮN LẠI Ở CHỖ THỨ HAI, TRONG CHÍNH `core/engine.js`.** `buildShowdownPanelHost` vẫn
kiểm `panel.isConnected` (Đợt 156 chỉ chữa bên trong `showdown-setup.js`). Nó **sống sót được tới giờ
chỉ vì may**: hồi đó nút SHOWDOWN thường được bấm khi **chưa có bảng nào mở** (đường nguội, `panel`
đúng là bảng thật). Đợt 158 biến swap thành đường **BÌNH THƯỜNG** (bảng chọn luôn swap sang bảng đội)
⇒ chỉ cần mạng chậm là kẹt 'Loading…'. Chữa: kiểm `loading.isConnected`, và **dựng vào
`loading.parentNode`** — sau khi swap tháo lớp, cha đó mới là hộp thật, chứ `panel` thì không.
Kèm theo `if (toolPanelEl === panel)` cũng sai cùng kiểu (bỏ qua việc tính lại chiều cao trên đúng
đường mới) → đổi thành `toolPanelEl.contains(host)`.

> 👉 **Đo lại được trong 10 giây, dùng cho mọi builder có `await`:** bấm Options (mở nguội) rồi bấm
> Template (swap), giữ tham chiếu tới `.aw-swap-in` và một con của nó. Đã đo Đợt 158:
> `t=60ms` lớp còn + con còn · `t=360ms` **lớp `isConnected:false`** trong khi **con vẫn true** và cha
> của con đã là `.aw-tool-panel`. Đó là toàn bộ nội dung của luật này, hiện ra bằng số.

### Gom code dùng chung (đừng đẻ bản thứ hai)
- **`buildContentSwitchRow()`** (`core/options-panel.js`) — hàng `TEXT|VOICE` + bộ con. ⚠️ **Đợt 156
  đã BỎ hàng này khỏi bảng Showdown** (thầy chốt bảng chỉ có lớp + số đội), nên panel Options lại là
  nơi gọi duy nhất; hàm vẫn tách riêng vì nó là trọn một ý ~90 dòng, không phải vì đang dùng chung.
- **`applySubActSelection()`** (`core/engine.js`) — nhánh act ĐÃ ĐỔI TEMPLATE (ghi lựa chọn lên act
  GỐC rồi dựng lại bản chuyển đổi). ⚠️ Cũng chỉ còn Apply của Options gọi, vì lý do trên.
- **`makeContentSwitch()` / `seedSelectors()`** — một câu trả lời duy nhất cho "act này có act con
  nào, đang sáng cái nào". Hai nơi tự suy ra sẽ có ngày sáng hai nút khác nhau cho cùng một act.


### ⭐⭐ MỘT ACT MANG CẢ CHỮ LẪN GIỌNG — `voiceView()` (Đợt 123, 12/8/2026)

Trước đây mỗi bộ từ có HAI act (`ENG1` chơi bằng chữ · `ENG1 VOICE` chơi bằng giọng) tuy nội dung chữ
y hệt nhau. Nay **một act mang cả hai**, và `activity.options.contentMode` chọn cách chơi hôm nay:

| Giá trị | Chữ | Nút loa | Tự đọc |
|---|---|---|---|
| `"text"` | hiện | nhỏ, cạnh chữ | **không** |
| `"voice"` | ẩn | to, giữa khung | có |
| **không khai** (AUTO) | theo `hideText` từng từ | theo `hideText` | có |

> ⚠️ **TEMPLATE TUYỆT ĐỐI KHÔNG ĐỌC THẲNG `item.hideText` NỮA.** Phải đi qua
> **`voiceView(activity, item)`** của `core/voice-playback.js` — trả `{hasVoice, hideText, autoPlay}`.
> Quên là game đó **lờ đi công tắc của thầy trong im lặng**: chữ vẫn ẩn khi thầy chọn Text, hoặc
> tiếng vẫn tự phát trong giờ luyện đọc. Khuôn chuẩn nằm ở khối USAGE đầu `voice-playback.js`;
> 13 template hiện có đều theo đúng khuôn đó, kể cả Anagram (vốn có bản phát riêng).

- Nhóm **Content** ở ĐẦU panel Options do `core/engine.js` dựng, **chỉ hiện khi act có clip thật**
  (`hasAnyVoice`). Template không phải khai gì.
- **AUTO phải giữ nguyên mãi mãi**: hàng trăm act cũ mang `hideText:true`; ép mặc định "text" là
  phơi hết gợi ý mà giáo viên đang cố giấu. Panel *hiện* nút gần đúng cho act cũ nhưng **không ghi**
  giá trị cho tới khi thầy tự bấm.
- Mode `"text"` **bỏ luôn bước nạp trước giọng** ở `prepareBeforePlay` (act 100 từ ≈ 1,2MB) — nút loa
  nhỏ vẫn bấm được, clip đó tải lẻ lúc bấm.
- `core/convert.js` **chép `contentMode` sang act tạm** khi Đổi template. Bỏ dòng đó là act đang chơi
  mode Text nhảy sang game khác rồi tự nhiên giấu chữ + đọc oang oang (options của act tạm vốn lấy từ
  sample của game ĐÍCH, không biết gì về act này).
- **Ngoại lệ cố ý: `templates/speaking/speaking.js` không theo luật này** — nút loa ở đó đọc từ mẫu
  cho HS bắt chước, chữ bắt buộc phải hiện; nó có option riêng `playReference`.

### ⭐⭐ MỘT ACT MANG NHIỀU BỘ GỢI Ý — `core/content-view.js` (Đợt 145, 14/8/2026)

Đợt 123 gộp **chữ + giọng** vào 1 act. Đợt 145 gộp tiếp **các BỘ GỢI Ý**: `ENG1 · ENG2 · VI1 · VI2`
của cùng một danh sách từ nay là **một act `WORDS`** (cột D/H/L/P của `WORDTABLE` chứa y hệt một từ,
đo 100/100 dòng — chỉ khác gợi ý).

| Khoá | Ở đâu | Nghĩa |
|---|---|---|
| `content.variants` | act | các bộ gợi ý, theo thứ tự hiện trong Options |
| `content.voiceVariants` | act | bộ được phép có clip (chỉ ENG — giọng Kokoro đọc sai tiếng Việt/IPA) |
| `items[i].clues` | từng từ | `{eng1,eng2,vi1,vi2}` |
| `items[i].voices` | từng từ | `{eng1:{voice,voiceId}, …}` |
| `items[i].clue` | từng từ | **bản sao** của bộ mặc định, cho mọi chỗ đọc `.clue` (thẻ thư viện, bản in) |
| `options.contentVariant` | options | bộ của nửa **TEXT** |
| `options.voiceVariant` | options | bộ của nửa **VOICE** |

**`resolveActivity(act)`** bẹp act đã lưu xuống act 1-gợi-ý bình thường. **Template không biết gì cả** —
0/17 file game phải sửa.

> ⛔⛔ **HAI TÍNH CHẤT PHẢI GIỮ, PHÁ LÀ HỎNG NGẦM:**
> 1. **Không có `variants` ⇒ trả về ĐÚNG object đã nhận** (không copy). Đây là thứ khiến cả thư viện cũ
>    zero-diff. Đổi thành "luôn copy" là mọi act cũ bỗng chạy trên bản sao.
> 2. **Chạy 2 lần = 1 lần** (bản đã bẹp bị xoá `variants`). `core/fight.js` xẻ 1 act ra 2 bàn phải
>    **dùng chung ĐÚNG object item** rồi gọi `startGame()` cho từng bàn — mà `startGame()` bẹp lần nữa.
>    Mất tính chất 2 thì mỗi bàn ôm một bản copy và "same letters" trôi khỏi nhau **trong im lặng**.

> ⚠️⚠️ **`libAct` KHÁC `activity` trong `core/engine.js`.** `libAct` = act của thư viện (còn đủ mọi bộ);
> `activity` = bản đã bẹp để chơi. **Mọi đường GHI dùng `libAct`**: Edit · Set assignment · lưu Options
> đã Apply · mọi lần vào lại `startGame()`. Ghi nhầm bản đã bẹp = **lưu đè act mất 3/4 nội dung, không
> một lời cảnh báo**. Hai bản **dùng chung object `options`** (spread chép tham chiếu) nên nút Apply vẫn
> ghi trúng act thật.

> ⛔ **BẨY THẬT (cắn ngay trong đợt tạo ra nó)**: thứ gì được **tính sẵn vào `content`** thì phải tính
> lại trong **`begin()`**, KHÔNG phải một lần ở `startGame()`. Lý do: Apply ở màn READY (chưa bấm Play)
> **cố ý không restart** — nó đóng panel và hứa "có hiệu lực khi bấm Play". Mọi option khác đọc thẳng
> `activity.options` nên lời hứa đó đúng miễn phí; bộ gợi ý thì đã **nướng cứng vào `content`**, nên
> chọn VI1 → Apply → Play vẫn ra ENG1. Đã vá bằng cách bẹp lại trong `begin()`.

- Panel Options: **một hàng, hai nửa** — trái `TEXT|VOICE`, phải là các con của nửa đang chọn, nửa kia
  ẩn. **Mỗi nửa nhớ lựa chọn riêng.** Dựng ở `core/options-panel.js`, dữ liệu do `engine.js` truyền vào
  qua `contentSwitch` (`variants` · `voiceVariants` · `labelOf` · lựa chọn hiện tại).
- **Dưới 2 bộ thì KHÔNG hiện nửa phải** — một lựa chọn không phải là lựa chọn (luật opt-in Đợt 143).
- `core/convert.js` **bẹp trong `toRecords()`**: đang chơi VI1 mà Đổi template thì game mới vẫn VI1.
- Editor chỉ sửa **bộ đang chơi**, và **phải mang 3 bộ kia đi cùng object của hàng** — `normalize()` kiểu
  cũ (dựng lại hàng từ 5 khoá cố định) sẽ **xoá sạch chúng ngay lần Save đầu**.

### ⭐⭐ MỘT ACT MANG 2 NỬA — PRACTICE / HOMEWORK (Đợt 146, 14/8/2026)

Trục **THỨ HAI**, độc lập với bộ gợi ý ở mục trên. Mọi bài đọc hiểu trong file bài học có **2 bản diễn
đạt lại của nhau** (`QUIZ1`↔`QUIZ2`, `READINGACT1`↔`READINGACT2`); nay là **một act mang cả hai nửa**.

| Khoá | Nghĩa |
|---|---|
| `content.contentSets` | `["practice","homework"]`, thứ tự hiện trong Options |
| `content.itemsKey` | mảng nào chứa nội dung: `questions` · `statements` · `pairs` |
| `content.sets` | **CHỈ các nửa SAU nửa đầu** |
| `content[itemsKey]` | nửa ĐẦU — vừa là mirror mọi chỗ cũ vẫn đọc, vừa là **bản duy nhất** của nó |
| `options.contentSet` | nửa đang chơi |

> ⛔ **NỬA ĐẦU KHÔNG ĐƯỢC CHÉP VÀO `sets`.** Lưu 2 chỗ = ghi 30 câu hỏi lên Firestore **hai lần** (JSON
> không có khái niệm "cùng một mảng"), rồi 2 bản đó phải tự tay giữ khớp mãi mãi. `itemsOfSet()` có
> đường lùi về mirror nên nửa đầu vẫn đọc được qua cùng một lời gọi.

> ⚠️⚠️ **DẠNG LƯU ≠ DẠNG ĐANG SỬA.** Trong editor, `sets` giữ **MỌI nửa** và `content[itemsKey]` chỉ là
> **chỗ nháp của tab đang mở**. Không tách ra thì mở tab HOMEWORK = ghi câu hỏi homework thẳng vào mảng
> mà cả app đọc như nửa practice ⇒ **mất sạch nửa practice**. `expandSetsForEditing()` đi một chiều,
> **`foldEditedSet()` đi chiều ngược lại và PHẢI gọi trước khi Save**.

- Hàng `PRACTICE | HOMEWORK` là **phần tử đầu tiên** của panel Options, trên hàng Text/Voice.
  **Dưới 2 nửa thì không hiện** (luật opt-in Đợt 143).
- Đổi tab trong editor **KHÔNG đụng `options.contentSet`** — sửa nửa homework không được phép âm thầm
  khiến lớp sau mở act ra gặp đề homework.
- Tabs do **lõi dựng** (`makeSetTabs`), hợp đồng là 2 hàm gọi ngược **`read()` / `load(items)`**, vì mô
  hình trên màn của 3 editor khác nhau (true/false giữ **2 cột chuỗi**, phải quy đổi cả 2 chiều).
- ⚠️ Editor phải **nắn CẢ HAI nửa** lúc normalize, không chỉ nửa đang mở — nếu không, bấm sang tab kia
  là bộ dựng hàng nhận đúng hình dạng file import để lại, và một nửa rỗng mở ra **không có hàng nào để gõ**.
- ⚠️ `true-false-editor.js` từng **dựng lại `content` từ đầu lúc Save** — kiểu đó làm nửa homework biến
  mất im lặng ngay lần Save đầu. Mọi editor phải giữ lại `content` của bản nháp rồi chỉ ghi đè phần nội dung.
- Đường này **trao thẳng mảng đã lưu** (không copy), nên 2 bàn Fight dùng chung đúng object item.

### ⭐⭐ MỖI LỰA CHỌN MỘT BỘ OPTIONS RIÊNG (Đợt 147, 14/8/2026)

Thầy chốt: chọn bộ gợi ý nào / nửa nào thì **cả bảng Options nhảy theo cái đó và lưu độc lập**.
Act `WORDS` có **6 bộ** (TEXT ×4 + VOICE ×2), act `QUIZ`/reading có **2 bộ**.

| Khoá | Nghĩa |
|---|---|
| `act.options` | bộ ĐANG CHẠY. **Ngoài `content-view.js` không chỗ nào phải đổi** — engine, 17 template, Đổi template, bản chụp bài giao vẫn đọc đúng khoá này |
| `act.viewOptions[key]` | bộ đã lưu của từng lựa chọn |
| `key` | `"practice"` · `"text:eng1"` · `"voice:eng2"` · `"practice\|text:eng1"`; **null** cho act không có bộ gợi ý lẫn nửa |

> ⛔ **`contentMode`/`contentVariant`/`voiceVariant`/`contentSet` KHÔNG BAO GIỜ nằm trong bộ của một
> view** (`VIEW_SELECTOR_KEYS`) — chúng định danh chính cái view; nhét vào là view tự trỏ vào chính nó.
> **`optVer` cũng không bao giờ bị bỏ** (`VIEW_ACT_KEYS`): mất con dấu quy đổi của Đợt 143 là lần nạp
> sau quy đổi lại giá trị đã đúng thang — **-5 → -100 → -2000**.

- Bấm đổi lựa chọn ⇒ **dựng lại toàn bộ thân panel**. Bản nháp giữ **theo từng view** (`pending`), nên
  đổi qua đổi lại trong một lần mở không mất thứ vừa gõ; bấm ra ngoài không Apply thì mất TẤT CẢ.
- Apply ghi **mọi view đã đụng tới**, và **XOÁ** khỏi `act.options` những khoá bộ mới không có (view lấy
  từ Settings có thể thiếu khoá mà view cũ có; giữ lại là để một thiết lập **không gì trên màn giải
  thích được**). ⚠️ Phải **sửa `act.options` TẠI CHỖ, không gán mới** — `libAct`, act "chơi lại lỗi
  sai" và 2 bàn đấu giữ **cùng một object**.
- View chưa từng vào thì lấy **mặc định trong Settings** (`getDefaultOptions`), nạp sẵn lúc mở panel để
  cú bấm không phải chờ.
- `snapshotOf` **không chép `viewOptions`** — bài đã giao nhận đúng bộ đang chạy lúc giao. Đúng ý muốn.

### ⛔⛔ MUỐN MỘT Ô CỦA LƯỚI CO CHO TỚI KHI BIẾN MẤT: KHOẢNG CÁCH PHẢI THUỘC VỀ **Ô**, KHÔNG PHẢI **LƯỚI** (Đợt 148 — cắn thật, ngay sau Đợt 147)

Vá xong Đợt 147, thầy vẫn thấy **hai nhịp**: *"khối trên hạ xuống một chút nhưng vẫn còn chút khoảng
trống nữa. Sau đó lại hạ xuống một nhịp ngắn nữa hết khoảng trống thừa đó."*

**Đo**: co ruột về 0 ⇒ lưới **235px**; bỏ hẳn ô khỏi bố cục ⇒ **227px**. 8–9px đó là **`row-gap`**.
`gap` là thuộc tính **của LƯỚI**, nên **không animation nào đặt trên Ô xoá được nó** — nó chỉ mất đúng
lúc cả hàng mất, tức lúc `display:none` chạy. Đó chính là nhịp hai.
⚠️ **`margin-bottom` ÂM trên ô KHÔNG chữa được** (đo thật: 235 → 235 — track vốn đã kẹp sàn ở 0).

**Cách chữa**: `row-gap: 0` trên `.aw-opt-grid`, mỗi ô mang `margin-bottom: 9px`, lưới mang
`margin-bottom: -9px` bù hàng cuối. Ô nay **co khoảng cách của chính nó cùng lúc với chiều cao**.
Đo trước/sau: **mở 281px cả hai cách** (0 panel nào xê dịch), **đóng còn 227px** — bằng đúng cách cũ.
⚠️ Đổi kiểu này thì nhớ **cộng bù cho mọi phần tử có margin riêng** trong lưới (`.aw-optc-sep`).

### ⭐⭐⭐ ACT ĐÃ ĐỔI TEMPLATE **KHÔNG CÒN ACT CON** — HỎI ACT GỐC, VÀ ĐỔI ACT CON PHẢI **CHUYỂN ĐỔI LẠI** (Đợt 154)

`core/convert.js` gọi **`resolveActivity()` TRƯỚC khi chuyển đổi**, nên act tạm ("Change template")
**đã bị bẹp xuống một bộ gợi ý**: không `variants`, không nửa nào. Hậu quả cũ: mở Options trên
template khác là **mất sạch hàng TEXT-VOICE và danh sách act con** (thầy báo 14/8/2026). Anagram thoát
chỉ vì act `WORDS` **vốn là act anagram** nên chơi Anagram là chơi chính act gốc.

- **MỘT nguồn sự thật**: `subActSource()` trong `core/engine.js` — act đang chơi nếu nó còn
  `variants`/`contentSets`, ngược lại là **`originAct`** khi act đang chơi là bản `_converted`.
  Panel Options, nhãn màn START và nhánh dựng-lại ở Apply **đều đi qua đúng hàm này**.
- ⛔ **CHỈ act `_converted`, và KHÔNG BAO GIỜ act `_mistakes`**: act "Start with mistakes" cũng là bản
  bẹp không còn variants và cũng chạy kèm `base`, nên thiếu chặn là Apply **dựng lại act gốc và ném
  mất mấy từ lớp đang ôn**.
- ⭐⭐ **Act con KHÔNG phải một option bình thường.** Mọi option khác được đọc lúc chơi ⇒ ghi vào
  `activity.options` là đủ. Act con thì **nội dung (chữ VÀ clip giọng) đã nướng cứng lúc chuyển đổi**
  ⇒ phải ghi lựa chọn lên **act gốc** (thứ `convert.js` đọc) rồi **`doSwitchTemplate(activity.type)`**
  để dựng lại. Lưu suông = **hàng nút nhúc nhích mà game không đổi**, tệ hơn không cho chọn.
- **So bằng `viewKeyOf`, đừng so từng khoá**: Apply không đụng act con thì không phải dựng lại, và
  lần Apply đầu (chưa có khoá nào, act đang ở bộ mặc định) không bị tính là đổi. Act thường ⇒
  `viewKeyOf` null cả hai vế ⇒ nhánh này **không bao giờ chạy** (zero-diff cho toàn thư viện cũ).
- **Nhãn act con trên màn START** (`subActLabel`) ghép **nửa** rồi **bộ gợi ý**, đúng thứ tự hai hàng
  trong Options. ⚠️ Phải **dựng lại được** (`refreshReadyTitle`) vì **Apply ở màn READY cố ý không
  restart** — act con đổi ngay khi chữ đó đang trên màn hình (cùng họ bẫy Đợt 145).

### ⭐⭐⭐ HỘP ĐANG ĐỔI KÍCH THƯỚC: **CẢ HAI LỚP SWAP PHẢI LÀ ẢNH TĨNH**, VÀ LỚP MỚI PHẢI **PHỦ KÍN** (Đợt 153 — cắn thật)

Thầy: *"Options↔Templates rất mượt, nhưng sang **Styles** và **Fight** thì cuối animation có một
**frame thừa của một pop-up khác nảy nhanh ra**."* Đúng hai cái đó vì `.aw-tool-panel` là
`width:max-content`, mà **Options và Template cùng bị ghim 560px** (`is-opts`/`is-tpl`) ⇒ chỉ hai cú
kia mới thật sự **đổi bề rộng**. Từ Đợt 152 bề rộng chạy animation, và **hai lớp swap bị bề rộng đó
dàn lại từng khung hình** — đo được, 21 mốc, Options→Style: nội dung CŨ cao **340→372→389→453→487**
(lưới 2 cột sập thành 1 cột, nhảy bậc = "nảy"), và **tới 201px nội dung cũ hở nguyên độ mờ 1** dưới
panel mới cho tới khi hộp khép hết. Chiều ngược lại (và Options→Template) không lộ **chỉ vì** nội dung
mới cao hơn hộp nên **phủ kín từ khung đầu**.

**BA điều bắt buộc, áp cho mọi hiệu ứng đổi-nội-dung-kèm-đổi-kích-thước về sau:**
1. **Lớp CŨ = ảnh chụp**. Ghim `width` = bề rộng hộp lúc bắt đầu (JS), CSS **không được** `right:0`.
   Hộp hẹp lại thì **CẮT** nó (`overflow:hidden`), tuyệt đối không dàn lại.
2. **Lớp MỚI = bố cục ĐÍCH ngay khung hình đầu**. Ghim `width` = bề rộng trong lúc nghỉ. Thứ thầy
   đang nhìn hiện dần phải **đứng yên**; cái hộp mới là thứ chuyển động.
3. **Lớp MỚI phải PHỦ KÍN hộp suốt cú chuyển** — `min-height` chạy **cùng đường cong, cùng thời
   lượng** với chiều cao hộp. Không thì cú **thu nhỏ** phơi nguyên nội dung cũ ở phần dư.
   (Không mâu thuẫn Đợt 151: lớp cũ **vẫn không mờ đi**, chỉ là nền đục của lớp mới nay che tới đáy.)
- Phép nghiệm thu: tái tạo tĩnh ~20 mốc, mỗi mốc gán tay `width/height/min-height` rồi đo **bố cục
  con của từng lớp**. ĐẠT = **đúng 1 bố cục** cho lớp cũ, **đúng 1 bố cục** cho lớp mới,
  **phần hở ≤ 0 ở mọi mốc**, và **ghim khớp chỗ yên vị 0.00px**.

### ⛔⛔ ĐO ĐÍCH PHẢI ĐO DƯỚI **LUẬT `overflow` LÚC NGHỈ** (Đợt 153 — 15px, họ hàng với Đợt 152)

Đo trong lúc `.aw-swapbox` đang bật là đo dưới `overflow:hidden` ⇒ panel nào **cao quá `maxHeight`**
(Options trong **fight mode**) cho bề rộng trong **thừa đúng 15px** vì không trừ thanh cuộn lúc nghỉ.
- **Cách đo đúng**: **gỡ `.aw-swapbox`** rồi mới đo — và **phải giấu lớp cũ** (`display:none`) trong
  lúc đó: nó absolute nên không có phiếu về kích thước, nhưng khi `overflow-y:auto` được trả lại thì
  nó **đẻ ra thanh cuộn ảo**. Tất cả chạy đồng bộ, không khung hình nào bị vẽ ⇒ không lóe.
- Đo thật trong fight mode: ghim **505 = 505** (đo kiểu cũ ra 520 ⇒ tụt 15px ở cuối).

### ⛔⛔ SỐ ĐO CHỈ ĐÚNG KHI THỨ ĐƯỢC ĐO ĐÃ **ỔN ĐỊNH** — FONT NẠP MUỘN LÀ CÚ NHẢY CUỐI ANIMATION (Đợt 153)

Dòng chữ của popover MODE là **chữ đầu tiên của cả app dùng Baloo 2 weight 400**; mọi `@font-face`
đều `font-display: swap`, nên trang vừa mở thì weight đó **chưa nạp** đúng lúc cú swap bắt đầu ⇒
`max-width: 30ch` tính theo **font dự phòng** ⇒ ghim panel **260px** trong khi sự thật là **267.36px**
⇒ **nhảy 7.36px đúng lúc gỡ ghim**. `swapContents` **không thể** tự chống: nó đo đúng sự thật của
khung hình đó, sự thật đổi sau lưng nó.
- **Chữa (đã làm)**: `core/engine.js` gọi `document.fonts.load()` cho **cả 4 weight** ngay khi engine
  nạp. Kiểm: `document.fonts.check('400 13px "Baloo 2"')` phải `true` trước khi thầy bấm được.
- **LUẬT**: thứ gì tham gia **đo kích thước panel** (font, ảnh, nội dung nạp sau) phải ổn định số đo
  **TRƯỚC** khi mở được panel. Thêm chữ vào panel bằng một weight/size mới ⇒ **thêm vào danh sách
  hâm nóng**.
- ⚠️ Cùng họ: **đừng đo khi `@keyframes` entrance còn chạy**. `aw-pop-cx` bắt đầu ở `scale(.9)`, nên
  bấm công cụ thứ hai trong 220ms đầu là mọi `getBoundingClientRect` **bị scale 0.9**. `swapContents`
  nay `finish()` **chỉ các `CSSAnimation`** trước khi đo — `finish()` một **transition** đang chạy là
  quăng cái hộp thẳng tới đích của lượt trước.

### ⛔⛔ CHÚ THÍCH CSS HỎNG **NUỐT RULE ĐỨNG SAU, KHÔNG BÁO LỖI** (Đợt 152 — cắn thật)

Chú thích Đợt 151 viết **thiếu `/*` mở** (chữ trần + `*/` lạc). CSS không văng lỗi — nó phục hồi bằng
cách đọc đoạn rác **liền với selector kế tiếp** thành một selector hỏng ⇒ **cả rule `.aw-swapbox` bị
vứt**: mất `overflow:hidden` lúc swap (⇒ thanh cuộn dọc 15px hiện, cộng 15px vào phép đo kích thước
đích) và mất **toàn bộ transition** (⇒ mọi cú đổi panel nhảy phựt — thầy báo "giật lung tung").
- **Luật**: sửa chú thích CSS xong PHẢI quét cân bằng `/*`/`*/` cả file (script python 10 dòng, xem
  GHI CHU Đợt 152). Nạn nhân là rule **đứng sau chú thích**, có thể chẳng liên quan chỗ vừa sửa.
- 🔎 Manh mối đã dẫn tới nó: đo đích lệch **ĐÚNG 15.00px** — tròn bất thường ⇒ scrollbar; truy
  `getComputedStyle(...).overflow` ra `"hidden auto"` (rule !important "đang có" mà không áp) +
  `offsetWidth − clientWidth = 15`.

### ⭐⭐ SWAP KÍCH THƯỚC HỘP: ĐO **ĐÍCH THẬT** BẰNG THẢ-NEO-TẠM, VÀ LỚP CŨ PHẢI `padding:inherit` (Đợt 152)

Hai lỗi hình học chỉ phát tác khi hộp swap CÓ PADDING (panel: 14/20/16 — bodyHost padding 0 nên phần
trong Options không dính):
1. **Đừng đo lớp trong rồi gán cho hộp** — chiều cao lớp trong THIẾU padding của hộp (app border-box)
  ⇒ ghim thiếu 30px, cuối cú bung. **Đo đích thật**: gỡ `height`/`width` inline → đo hộp (nó tự về
  kích thước sẽ yên vị dưới đúng padding/width-class/max-height; lớp cũ absolute không có phiếu) →
  ghim lại. Chạy đồng bộ trước khung hình đầu ⇒ không lóe. Ghim + transition **cả width** để
  Options↔Style trượt.
2. **Lớp cũ absolute `top:0;left:0` neo vào PADDING BOX** — thiếu `padding:inherit` là nội dung cũ
  nhảy chéo lên-trái đúng bằng padding của hộp ngay khung hình đầu.
- Panel neo đáy ⇒ khi hộp đổi chiều cao, nội dung (cả cũ lẫn mới) **cùng trượt với mép trên** — đó là
  cú trượt đồng bộ, không phải lỗi; phép nghiệm đúng là "cũ và mới dịch CÙNG một lượng".

### ⛔⛔ CLASS TIỆN ÍCH DÙNG CHUNG **CẤM KHAI `position`** (Đợt 151 — cắn thật, panel rơi khỏi neo)

`.aw-swapbox` từng khai `position:relative` (cho lớp cũ absolute có chỗ neo). Nó nằm **sau**
`.aw-tool-panel` trong file, cùng độ ưu tiên ⇒ khi gắn lên panel lúc đổi công cụ, nó **đè mất
`position:absolute`** — panel rơi khỏi neo, rớt vào dòng chảy flex của hàng nút (đo:
panel `(95,93)→(334,495)`, nút Options `x=278→26`), hết swap lại bật về. Thầy: *"hàng tùy chỉnh nhảy
sang bên trái, pop-up nhảy xuống dưới ở bên phải, sau đó mới nhảy về vị trí chuẩn."*
- **Luật**: class tiện ích gắn-tháo động **không được khai `position`** — mỗi đích tự lo chỗ neo của
  mình (panel vốn `absolute`; `.aw-opt-bodyhost` mang `position:relative` thường trực).
- Loại lỗi này **chỉ lộ đúng khung hình animation chạy** — tự test kiểu "đo sau khi yên vị" không bắt
  được; phải **lấy mẫu trong lúc chuyển** (interval 40ms đọc `getComputedStyle(...).position` + toạ độ).

### ⭐⭐ DISSOLVE TRÊN NỀN ĐỤC, KHÔNG CROSS-FADE HAI CHIỀU (Đợt 151)

Cross-fade hai chiều (cũ mờ đi `1→0` + mới hiện `0→1`) làm tổng độ phủ **tụt giữa chừng** (~75% ở điểm
giữa) ⇒ cả phần nội dung **giống hệt nhau** cũng hụt sáng một nhịp — chính là "hơi nháy nhẹ" khi
eng1→eng2. Cách đúng: lớp cũ nằm DƯỚI **đứng nguyên độ mờ 1**, chỉ lớp mới mờ dần vào Ở TRÊN
(`z-index:1`, mang nền của panel). Điểm ảnh giống nhau: `c·a + c·(1−a) = c` — **không đổi giữa chừng**;
chỉ chỗ khác mới dissolve; lớp cũ gỡ khi đã bị phủ kín. Phép nghiệm: `out.opacity` phải `=1` ở **mọi
mẫu** trong cú chuyển.

### ⛔⛔ HỘP SẼ BỊ GHIM CHIỀU CAO THÌ PHẢI LÀ BFC THƯỜNG TRỰC (Đợt 150 — cắn thật, 9px "trừ nút Apply")

Thầy (Chrome thật): *"Toàn bộ nội dung nâng cao lên vài pixel (trừ nút APPLY) rồi mới hạ xuống."*
Đo tĩnh: ghim chiều cao vào `bodyHost` ⇒ `panelTop 93.2 → 84.2` (nâng đúng **9px**). Gốc: lưới options
kết thúc bằng `margin-bottom:-9px` (khoản bù Đợt 148); lúc nghỉ margin âm **thấm xuyên qua đáy** div
trần (margin collapse), **ghim chiều cao là hết thấm** ⇒ panel neo đáy cao thêm 9px, cả khối nâng lên.
- **Chữa**: `display:flow-root` **thường trực** cho hộp ĐÓ **và cả 2 lớp swap** (lớp đang vào là thứ
  được đo lấy chiều cao đích — phải ôm margin y hệt thân đã yên vị, không thì cú tháo lớp lệch 9px).
- **Luật**: hộp nào tham gia animation ghim-chiều-cao thì trạng thái margin-collapse của nó **không
  được đổi theo hiệu ứng**. Đo nghiệm: 3 mốc (nghỉ / ghim / gỡ) phải cho cùng một `panelTop`.

### ⭐⭐ ĐIỀU KHIỂN ĐỔI HÌNH THÌ CHO NÓ **THỞ**, ĐỪNG DỰNG LẠI (Đợt 150)

Nửa phải của hàng Content đổi giữa `ENG1|ENG2|VI1|VI2` (TEXT) và `ENG1|ENG2` (VOICE). Bản cũ xoá trắng
+ dựng `mkSeg` mới ⇒ đổi hình trong 1 khung hình. Nay: **một cụm mang đủ mọi bộ** (`.aw-seg-anim`,
dựng một lần); nút rời nửa đang chọn co `flex-grow 1→0` + `padding→0` + `margin-left:-2px` (nuốt đúng
gap của nó, về tròn **0px**), nút ở lại nở ra choán chỗ cùng đường cong; thumb nhận `--n`/`--i` của
số nút **đang hiện**, bề rộng vào chung transition.
- **Vì sao flex chứ không grid**: track `1fr` của grid **không animate được**, `flex-grow` thì có.
- Dưới 2 bộ ⇒ cả nửa mờ dần (`.is-empty`), không hiện 1 nút chết (luật opt-in Đợt 143).
- Nút gone: `pointer-events:none` **và** chặn trong onclick (2 lớp, thói quen từ Đợt 137).

### ⛔⛔ ĐỪNG DỰNG LẠI CHÍNH CÁI ĐIỀU KHIỂN VỪA ĐƯỢC BẤM (Đợt 149 — cắn thật)

Đợt 147 dựng lại **cả thân panel** khi đổi view; hàng công tắc Content nằm trong đó. Kết quả: **nút thầy
vừa chạm bị mờ đi, bị xoá, rồi hiện lại thành nút KHÁC** — con trượt nhảy về chỗ mới, cả hàng chớp.
Thầy tả: *"tất cả các cú chuyển từ text-voice và các con của chúng đều rất giật"*.

**Phép đo bắt ra lỗi** (và cũng là phép nghiệm thu, lật được 2 chiều):
```js
const before = panel.querySelector('.aw-opt-content');
/* bấm đổi lựa chọn */
before === panel.querySelector('.aw-opt-content')   // false = ĐANG BỊ LỖI
```

- **Luật**: cái điều khiển gây ra thay đổi phải **ở NGOÀI vùng bị dựng lại**. Panel Options nay có
  `.aw-opt-switches` (dựng MỘT LẦN, đứng yên) và `.aw-opt-bodyhost` (phần duy nhất được thay).
- ⚠️ **Bẫy đi kèm — phải xử cùng lúc**: điều khiển không bao giờ được dựng lại thì nó **ghi mãi vào bản
  nháp ĐẦU TIÊN**, trong khi mỗi lần đổi view sinh bản nháp MỚI. Lựa chọn phải ghi vào một **object
  BỀN** (`selState`), trộn vào bản nháp hiện hành **lúc Apply** — làm ở Apply còn lo được ca act có
  công tắc Text/Voice nhưng không có bộ gợi ý (cú bấm không đổi view key ⇒ `onViewChange` không chạy).
- `buildOptionsBody` nhận `switchHost` · `renderSwitches` · `selectors`; Settings không truyền gì nên
  chạy y như cũ.

### ⭐⭐ ĐỔI NỘI DUNG MỘT HỘP CHO MƯỢT — `swapContents()` (Đợt 148, sửa lại ở Đợt 149)

⭐ **Phải là CROSS-FADE thật, không phải mờ-đi-rồi-hiện-lại.** Bản Đợt 148 dọn rỗng hộp trước rồi mới
dựng nội dung mới ⇒ có một khoảnh khắc **trong hộp không có gì**, đọc thành cú xóc dù ngắn tới đâu.
Nay nội dung cũ được nhấc khỏi dòng chảy (`position:absolute`, `pointer-events:none`) để nội dung mới
vào chỗ ngay, hai lớp **mờ xuyên qua nhau** trong lúc hộp chạy tới chiều cao mới.
⚠️ Bộ đo `is-compact-opts` phải **NGHỈ trong lúc chuyển**: nó đo lại panel mỗi lần panel đổi kích
thước, mà chiều cao đang chạy thì đổi mỗi khung hình — mỗi lượt lại ép tính lại bố cục, không thu được
gì hữu ích từ một cái hộp đang bay.

Ghim chiều cao cũ → mờ đi → dựng nội dung mới → chạy tới chiều cao mới trong lúc hiện dần. Dùng cho
**đổi panel công cụ** (Options → Template/Style/Mode) và **đổi lựa chọn trong Options**.
- ⭐ Đổi panel nay **GIỮ NGUYÊN cái hộp và biến hình nó**. `openToolPanel` trước đây **huỷ panel cũ rồi
  dựng panel mới** ⇒ cả khung nháy một cái (thầy báo).
- ⛔ **KHÔNG dùng `requestAnimationFrame`** trong loại hiệu ứng này: tab ẩn/chạy nền không bao giờ gọi
  nó và hộp **kẹt vĩnh viễn ở chiều cao cũ**. Dùng `setTimeout` — cùng lý do `closeToolPanel()` đã phải
  có timeout dự phòng.
- Phải có **thẻ chống chồng lượt** (`swapToken`): bấm 2 công cụ liên tiếp thì lượt cũ không được gỡ
  ghim chiều cao của lượt mới.
- 🔎 **Bẫy ĐO** (dính thật): pane test bị ẩn ⇒ **mọi thuộc tính đang có transition bị kẹt ở giá trị
  ĐẦU**, đọc `getComputedStyle` ra số vô nghĩa. Phải **tắt hẳn transition** (`transition:none
  !important`) rồi mới đo bố cục cuối.

### ⛔⛔ ACCORDION `max-height`: `display:none` PHẢI RƠI **SAU** TRANSITION (Đợt 147 — cắn thật)

Thầy báo *"chuyển từ On submit về Letters with bonus thì animation bị khựng 1 nhịp"*. Đo bằng
`MutationObserver`: **3 thao tác rơi cùng MỘT khung hình (+0,9ms)** — `display:none` lên ô, thêm
`is-closed`, `max-height:0`. Ô **biến mất trong 1 khung hình**, rồi **cái hộp RỖNG** mới trượt 280ms.

- **ĐÓNG**: ruột **ở lại trong khung suốt cú trượt**, chỉ bỏ ra sau (`setTimeout` = thời gian
  transition + 1 khung hình). Mắt bám theo chính nội dung trôi lên dưới `overflow:hidden`.
- **MỞ**: **hiện ruột TRƯỚC rồi mới đo `scrollHeight`**, kẻo hộp trượt tới chiều cao của lưới rỗng.
- Cùng họ với bẫy Đợt 137 trên **đúng accordion này** (`overflow:hidden`): lần đó sai **thuộc tính**,
  lần này sai **thời điểm**. Sắp viết accordion mới thì đọc cả hai.
- 🔎 **Mẹo đo khi pane test bị ẩn**: transition/rAF chết hẳn, nhưng **`MutationObserver` vẫn chạy
  chuẩn** — đo được **thứ tự và mốc thời gian** của các thao tác DOM, đủ để chứng minh loại lỗi này.

### ⭐ BỘ ĐỆM CLIP GIỌNG — 3 TẦNG, HẠN 1 NGÀY (Đợt 122, 12/8/2026)

`getVoiceClip()` của `core/voice-clips.js` nay đi qua **RAM → Cache Storage (`aword-voice-v1`) →
Firestore**. Sửa ở đúng một chỗ này nên **cả `core/voice-playback.js` (14 template) lẫn bản riêng của
`templates/anagram/anagram.js` đều hưởng, 0 dòng sửa ở template**. Đo thật: clip đã đệm trả về trong
**2ms, 0 lượt gọi Firestore**.

⚠️⚠️ **VÌ SAO PHẢI CÓ HẠN, VÀ VÌ SAO LÀ 1 NGÀY (thầy chốt)**: bấm **"Regenerate"** giọng thì cả 3
đường ghi (`anagram-editor.js`, `speaking-editor.js`, `voice-batch.js`) đều **dùng lại ĐÚNG ID CŨ** —
nội dung đổi mà tên không đổi. Cache vĩnh viễn theo id ⇒ máy học sinh phát mãi bản cũ còn máy thầy
nghe bản mới: loại lỗi cực khó truy. Hạn 1 ngày = trong buổi học chơi lại bao nhiêu lần cũng tức thì,
mà sửa giọng hôm nay thì mai HS đã nghe bản mới. **Chỉ được bỏ hạn này nếu sau này đổi sang "mỗi lần
tạo lại đẻ id mới"** (khi đó phải tính chuyện bài ĐÃ GIAO còn trỏ id cũ).

`saveVoiceClip()` / `deleteVoiceClip()` tự gọi `forgetVoiceClip(id)` để dọn cả 2 tầng **ngay tại máy
thầy** — không thì nghe thử lại trong editor vẫn ra giọng vừa bị thay.

### ⭐⭐ LUẬT CHUNG — MEDIA SINH RA TRONG TRÌNH DUYỆT PHẢI NÉN TRƯỚC KHI LƯU
Rút ra từ đợt này, áp cho **mọi loại media về sau** (âm thanh, ảnh, video ngắn), ở AWord lẫn app khác:
1. **Thư viện AI/Web API hay trả định dạng THÔ** vì nó tiện cho xử lý, không phải để phát: Kokoro trả
   PCM 32-bit float (768 kb/s), canvas trả `toDataURL()` PNG không nén ảnh chụp. **Mặc định là lãng phí
   — luôn kiểm định dạng đầu ra trước khi đem lưu.**
2. **Nén ngay tại HÀM SINH RA nó, không phải ở nơi gọi.** Sửa 1 chỗ (`generateSpeechDataUrl`) là cả 4
   đường gọi + mọi template được hưởng, 0 call-site phải đổi.
3. **Đổi định dạng phải tương thích ngược miễn phí**: dữ liệu cũ vẫn phải dùng được. Ở đây được là nhờ
   nơi phát chỉ gán chuỗi vào `<audio>.src` — MIME nằm trong chính data URL. Thiết kế mới nên giữ tính
   chất đó (ảnh: `<img>.src`; đừng đi đường nào phải "biết trước định dạng").
4. **Luôn có nhánh dự phòng**: nén lỗi thì `console.warn` + trả bản thô, đừng để mất hẳn dữ liệu.
5. **Chọn định dạng theo MÁY YẾU NHẤT của học sinh, không theo máy build.** Cứ có 2 lựa chọn "nhỏ hơn
   nhưng mới" và "to hơn nhưng chạy mọi nơi" thì **chọn cái chạy mọi nơi** — trừ khi đã test máy thật.
6. **Đo bằng bitrate/tỷ lệ, đừng đo bằng kích thước tuyệt đối.** Clip dài thì file to là đúng; muốn biết
   nén có chạy không thì lấy `bytes×8÷thời-lượng` rồi so với bitrate đã khai.
7. **Nhớ trần lưu trữ của nơi chứa**: Firestore = **1 MiB/document** và base64 phình **+33%**; batch bị
   chặn theo **DUNG LƯỢNG ~10 MiB** chứ không chỉ 500 thao tác. Media nặng thì tách document riêng
   (kiểu `voiceClips/{id}`) và thao tác từng cái, đừng gộp lô lớn.

⚠️ **KHI XOÁ AUDIO HÀNG LOẠT**: một item mang voice qua 3 khoá đi liền nhau `voice` / `voiceId` /
`hideText`. **TUYỆT ĐỐI KHÔNG đụng `phonemes`** — đó là chuỗi IPA template **Speaking** dùng để chấm
phát âm, không phải audio. Và phải **duyệt đệ quy `content`**, đừng liệt kê tên mảng theo template
(17 template đặt tên khác nhau: items / questions / words / cards / rounds.bonus.prompts…). Công cụ
đã viết sẵn: `tools-voice-cleanup.html` (gốc repo, không link từ đâu).

## ⭐⭐ TIME EACH ROUND — ĐỒNG HỒ CỦA TỪNG HỌC SINH (Đợt 174, 17/8/2026)

Đồng hồ THỨ HAI, đo **một lượt của một em**, khác hẳn Timer (đo cả ván).
**CHỈ CHẠY KHI ĐANG SHOWDOWN** — ngoài Showdown không có khái niệm "lượt của ai", nên ô này thậm chí
không được dựng trong bảng Options (`buildOptionsBody(..., { showdown })`, `core/options-panel.js`).

**2 khoá options**: `roundTimer` = `"none" | "countUp" | "countDown"` · `roundSeconds` (3..599, mặc định 20).

**Chia việc — GIỐNG HỆT Time cost, cố ý**: ENGINE giữ đồng hồ + thanh thời gian + sổ ghi thời gian;
TEMPLATE giữ định nghĩa "em ấy xong lượt" và "hết giờ thì mất gì" (chỉ template mới biết thế nào là một
câu trả lời). Ba API, đều no-op khi tắt nên template nối một lần rồi thôi:

| API | Ai gọi | Nghĩa |
|---|---|---|
| `ui.roundDone()` | template | "lượt của em này xong" → đồng hồ ĐÓNG BĂNG ở số đó; số đó là thời gian in trong Show answers, và là thứ chặn đếm ngược nổ trên một câu đã trả lời |
| `ui.setRoundTimeout(fn)` | template (1 lần lúc mount) | engine gọi `fn()` đúng lúc đếm ngược về 0 mà lượt còn mở |
| `ui.roundTimerMode()` | template | `"none"/"countUp"/"countDown"` nếu cần biết |

**Engine tự lo** (không template nào phải biết):
- Mở lượt mới **tại `ui.setNav({index})`** — KHÔNG phải `ui.itemChanging` (cái đó chạy sớm 130ms, lúc câu
  cũ mới bắt đầu mờ đi; tính giờ từ đó là tính tiền cả đoạn hoạt cảnh). Gọi lại cùng index là no-op, nên
  template cứ gọi `setNav` thoải mái như xưa.
- **Cộng dồn theo ITEM, không theo lượt xem**: quay lại câu cũ bằng ‹ thì thời gian cộng thêm, không
  reset — số in ra là "câu này đã ngốn bao lâu".
- **Đóng băng khi ☰ Menu hoặc bảng công cụ đang mở** (không thì đếm ngược nổ sau lưng bảng Options).
- Ghi `r.roundMs` vào từng dòng `review` lúc `finish()` (cùng chỗ, cùng kiểu với `stampReview`).

**Chỗ đứng khi bật** (174b, thầy chốt sau khi xem bản đầu): **Count down** gom `[số giây][thanh][điểm]`
vào **CHÍNH hàng topbar** (`.aw-roundrow`, `flex:1 1 auto`, đúng dáng `.aw-wam-topbar`) — đừng cho thanh
một hàng riêng, vừa ra như khung thừa vừa ăn mất chiều cao của game. **Count up** không có thanh nên số
giây vẫn ở ô giữa tuyệt đối (Đợt 159). Cả hai kiểu: tên học sinh xuống trên cụm ‹ ›, đồng hồ tổng xuống
cạnh ☰ Menu (sau nút bàn phím nếu template có).

⭐ **Đợt 176 — 3 điều chỉnh hiển thị (thầy 17/8/2026), kèm 3 bẫy:**
- **Tên học sinh NỔI giữa khoảng trống** dưới game: `.aw-navstack > .aw-top-showdown` là `absolute;
  bottom:100%`, `placeShowdownName()` (engine) đo phần tử `button/textarea/input/.aw-kbd` THẤP NHẤT
  trong playarea rồi canh tên vào chính giữa tới mép ‹ › — mỗi 250ms + mỗi lần sang câu.
  ⚠️ Canh ngang bằng `left:0; right:0`, **CẤM `translateX(-50%)`** — animation tên rơi
  (`paintShowdownName`) animate `transform`, sẽ đè chết transform nền.
  ⚠️ `.aw-stage-inner:has(.aw-navstack) > .aw-playarea { margin-bottom:5.4cqw }` là **SÀN chống đè**:
  tên rời luồng thì playarea cao thêm, bàn phím TTA từng tụt xuống nằm SAU tên (đo: 17px). Đừng giảm
  số này nếu chưa đo lại TTA.
- **Đồng hồ lượt có phần lẻ giây** `30,18` (`roundPaintClock`, span `.aw-round-dec` cỡ nhỏ), ticker
  50ms; count down bỏ `ceil` (hiện số thật, `0,00` = thanh cạn). **Đồng hồ TỔNG giữ `formatTime`
  m:ss như cũ — thầy chốt.**
- **Show answers**: thời gian dùng `fmtRoundMs` cùng dạng lẻ giây — ⚠️ tính từ **ms NGUYÊN**
  (`m%1000/10`), float giây từng biến 400ms thành `,39`; hàm trả MARKUP (chỉ numeric) nên chỉ đổ vào
  sink innerHTML tin cậy. Kèm **% câu đúng / số câu ĐÃ LÀM** (`attempted=0` thì ẨN, không phải 0%
  đỏ), dải màu qua `pctBand()`: ≤60 đỏ · 61-72 vàng · 73-84 cam · 85-94 xanh dương · ≥95 xanh lá;
  màu nằm hết trong CSS (`.aw-sd-rv-pct.is-p0..p4`), thời gian tổng của em màu xanh dương
  (`.aw-sd-rv-time`).

⚠️⚠️ **`roundTimer` là option CẤU TRÚC — engine đọc MỘT LẦN lúc mount.** Nó quyết định chỗ ĐỨNG của 3
thứ vừa kể. Vì thế Apply ở **màn READY** — nơi luật chung là
"không restart, options ăn khi bấm Play" — **phải restart** cho riêng option này (`replayCurrent()`), xem
`applyBtn.onclick` trong `core/engine.js`. Bỏ nhánh đó đi là bấm Play xong **không có đồng hồ lượt nào
cả** mà màn hình không nói gì. (Chỉ MODE mới cần; đổi số giây thì `roundTotal()` đọc sống.)

⚠️ **"Hết giờ = sai" mỗi template một dáng, đừng chép máy móc** (đã cài cho 3 template có Showdown):
- **Quiz**: `st.timedOut`, khoá ô, vẽ đáp án đúng qua chính `addBadges` (không ghim ✗ lên ô nào vì em
  không chọn gì), trừ điểm, mất tim, **ĐỨNG YÊN chờ thầy bấm ▷** trừ khi bật Auto next (thầy chốt).
- **Type the answer**: chấm sai + mở đáp án + trừ + mất tim, rồi **tự sang câu** — game này XƯA NAY tự đi
  tiếp mỗi khi một câu được chấm (không có ô Auto next), bắt riêng ca hết giờ đứng lại mới là lệch.
- **Anagram**: HAI HỌ CHẤM ĐIỂM ⇒ hai nhánh. "On submit" = coi như nộp sai (`pointsOff`, lộ đáp án).
  "Letters with bonus/minus" = **không có gì để chấm sai**: từ đó đơn giản **không được điểm nào**
  (`st.points` giữ 0) + mất tim; **KHÔNG trừ thêm** vì bonusMinus đã trừ từng cú chạm sai rồi (luật cấm
  trừ 2 lần, Đợt 143).
- Cả 3 đều thêm cờ `timedOut` RIÊNG chứ không mượn giá trị sẵn có: ở Anagram "xong" nghĩa là
  `correct === true`, mượn là thành **giải đúng**; ở Quiz `chosen` là **chỉ số ô**, nhét `-1` vào là
  review in ra `undefined`.

⚠️ Dòng review của câu hết giờ để `answered:false` (in "No answer") **nhưng vẫn tính là sai** khi cộng
điểm — hai thứ đó đọc từ 2 khoá khác nhau, đừng gộp.

⚠️ **BẪY BỐ CỤC ĐÃ CẮN NGAY ĐỢT NÀY (ảnh chụp bắt được, số đo thì không)**: `.aw-topbar` là
`justify-content: space-between`. Rút đồng hồ ra khỏi hàng thì **ô điểm còn lại một mình và bị đẩy sang
TRÁI** — mọi phép đo đều "đạt" (phần tử có, hiện, đúng chữ), chỉ có ảnh mới thấy số nằm sai bên. Vá bằng
`.aw-topbar.aw-timer-external:not(.has-inline) { justify-content: flex-end }`.

## ⚠️ BẪY CSS (v0.9.1) — làm mờ "mọi thứ trừ một vùng"

Muốn làm nổi 1 vùng và làm mờ phần còn lại thì luật làm-mờ phải dùng **con trực tiếp `>`**, không
dùng dấu cách (mọi cấp) — nếu không, chính nội dung BÊN TRONG vùng được giữ sáng cũng khớp luật và bị
mờ theo (đã dính ở bảng chi tiết trong pop-up báo cáo). Cách nhanh để kiểm: `getComputedStyle` phần tử
bên trong vùng sáng, phải ra `opacity: 1`.

## ⭐⭐ TIÊU CHUẨN KHUNG HÌNH & FULLSCREEN CỦA TOÀN HỆ THỐNG AWORD (thầy chốt 7/8/2026, Đợt 86)

> **ĐÂY LÀ TIÊU CHUẨN CHUNG. Mọi template làm mới, và mọi template cũ khi được chuyển đổi, phải theo mục này.**
> Bản mẫu tham chiếu đã build + đo đầy đủ: `templates/running-word/` (xem `GHI CHU RUNNING-WORD.md` mục
> 8l / 8l-2 / 8l-3).
>
> ⭐⭐ **TỪ Đợt 87 (7/8/2026) TIÊU CHUẨN NÀY LÀ MẶC ĐỊNH CỦA CORE — cả 16/16 template đang chạy nó.**
> Hai mục 1 và 2 dưới đây **đã nằm sẵn trong `core/app.css`**, nên **template mới KHÔNG phải khai lại gì**.
> Chỉ mục 3 (co giãn theo bậc) là việc riêng của từng template, và chỉ cần khi game có khối điều khiển
> cao cố định. ⚠️ **Đừng chép lại luật khung/fullscreen vào CSS template** — bản sao sẽ specific hơn
> core và âm thầm thắng, đúng cái bẫy Đợt 87 phải đi dọn ở Running word.

### 1. Cỡ mặc định: **16 : 10,5** — ĐÃ Ở TRONG CORE

```css
.aw-stage { aspect-ratio: 16 / 10.5; }     /* core/app.css — KHÔNG khai lại trong template */
```

- Bằng **32/21**; khung cao **65,625cqw** tính theo bề ngang. Mốc so sánh: 16:9 = 56,25cqw · 4:3 = 75cqw.
- Viết `16 / 10.5` (CSS nhận số thập phân trong tỷ lệ) cho khớp cách gọi của thầy.
- Game nào **thật sự** cần hình khác thì đè qua class **`.act-<type>`** mà `core/engine.js` tự đóng lên
  `.aw-stage` từ `activity.type`, **ngay lúc dựng khung** — trước cả màn READY, nên khung đúng tỷ lệ từ
  nét vẽ ĐẦU TIÊN. Đừng dùng `:has(.aw-<x>-card)`: cách đó chỉ ăn sau khi `mount()` đã dựng markup, khung
  sẽ nhảy hình một nhịp. Tính tới nay **không game nào cần** — cả 16 dùng mặc định.

> ⚠️ **CÓ APP NGOÀI ĐANG ĐỌC KHAI BÁO NÀY — đừng bỏ dòng `aspect-ratio` đi (7/8/2026).**
> App **myActivity** (`E:\LAP TRINH APP\myActivity`, bản v1.7.5) mở act AWord trong khung cột của nó và
> phải lấp khung cho vừa cột. Trước đây nó **ép cứng 16:9** nên Đợt 86/87 đổi sang 16:10,5 là nó hiện sai
> ngay. Nay nó **không tự đoán nữa mà đi hỏi**: đọc `getComputedStyle('.aw-stage').aspectRatio` rồi tự
> tính bề rộng khung theo tỷ lệ đọc được (biến `--myact-aw-ar`) — nên đổi chuẩn khung ở đây, kể cả đè
> `.act-<type>` riêng cho 1 game, myActivity **tự bám theo, không phải sửa gì**.
> **Hệ quả:** nếu sau này core dựng khung bằng cách khác (đặt `height` tường minh, JS tính px, `fit.js`…)
> mà **bỏ khai báo `aspect-ratio`** trên `.aw-stage`, myActivity sẽ âm thầm rơi về mặc định 16:10,5 ghi
> cứng trong CSS của nó và **hiện sai mà không báo lỗi**. Đổi kiểu đó thì phải sửa `AWORD_CSS`/`AWORD_JS`
> trong `myActivity/src/renderer/js/wordwall.js` cùng đợt. Fullscreen (mục 2) và `.aw-zoomed` cũng được
> myActivity chép lại đúng luật — đổi luật ở đây thì chép lại bên đó.

### 2. Fullscreen: phủ kín màn hình, **có CHỐT CHẶN 16:9** — ĐÃ Ở TRONG CORE

- Cơ chế fullscreen giữ nguyên như từng game đang dùng: **API thật** (14 game, CSS ở `core/app.css`) hoặc
  **`useZoomFullscreen`** (Running word/team, CSS ở file template — xem mục riêng bên dưới). Nguyên tắc
  chung cho cả hai: **dùng trọn màn hình thật, không kẹp dải** — trừ khi vượt chốt chặn.
- **Chốt chặn: khung KHÔNG BAO GIỜ được bè hơn 16:9.** Trong khối CSS của chế độ phủ kín:

```css
width: 100%; height: 100%;
flex-shrink: 0;                       /* ⚠️ HÀNG RÀO, xem bẫy 5 — không phải trang trí */
max-width: calc(100vh * 16 / 9);      /* dòng dự phòng cho trình duyệt chưa biết dvh */
max-width: calc(100dvh * 16 / 9);
```

  Phần thừa thành 2 dải nền tối hai bên (khung tự căn giữa nhờ `.aw-page` đã `display:flex; center`).
- **Vì sao mốc 16:9 chứ không phải 16:10,5:** ở mốc này **mọi thiết bị thật của thầy — iPad 4:3, laptop
  16:10, TV 16:9 — đều KHÔNG có dải nào**, giữ trọn từng pixel. Chỉ cửa sổ trình duyệt nhiều thanh công cụ
  hoặc màn siêu bè mới thấy dải, mà ở đó lựa chọn còn lại là **chữ đè lên nhau**. Đo thật: màn 1920×950 →
  dải chỉ **~115px mỗi bên = 6% bề ngang**.

### 3. Co giãn thành phần khi khung bè hơn tỷ lệ thiết kế

**Vì sao BẮT BUỘC phải có:** mọi cỡ trong game đo bằng `cqw` = phần trăm **bề NGANG** khung. Màn càng bè
thì các khối cao **cố định theo bề ngang** (bàn phím, đồng hồ, thanh tiêu đề…) **giữ nguyên kích thước**
trong khi **chiều cao khung sụp xuống** — và toàn bộ phần thiếu dồn hết vào phần tử `flex:1` duy nhất.
Ở Running word, đo được 1 hàng từ tụt **11,92 → 5,61 → 3,35 → 0,92cqw** khi tỷ lệ đi từ 1,33 → 1,78 → 2,02
→ 2,37, trong khi con chữ luôn cần 5,82cqw ⇒ **ba dòng chồng lên nhau**.

**LUẬT THẦY CHỐT — "co trước, kẹp sau" + "ưu tiên chữ đọc được":**

1. **Chữ (nội dung bài học) KHÔNG BAO GIỜ bị co** để nhường chỗ. Thứ phải nhường là **khối điều khiển**:
   bàn phím, đồng hồ, thanh trạng thái…
2. Co theo **bậc** bằng container query trên chính khung — `.aw-stage` đã sẵn `container-type: size`,
   `container-name: stage` (core), nên hỏi được tỷ lệ khung trực tiếp:

```css
@container stage (aspect-ratio > 16/10.4) { … }   /* bậc 1 */
@container stage (aspect-ratio > 16/10)   { … }   /* bậc 2 */
@container stage (aspect-ratio > 16/9.5)  { … }   /* bậc 3 */
@container stage (aspect-ratio > 16/9.2)  { … }   /* bậc 4 — tới sát chốt chặn 16:9 */
```

3. Ở tỷ lệ thiết kế và **mọi tỷ lệ CAO hơn** (iPad 4:3, khung nghỉ 16:10,5, laptop 16:10 dọc hơn…)
   **không bậc nào khớp ⇒ không đổi một ly nào**. Đây là điều kiện bắt buộc: bản đã duyệt phải giữ nguyên.

**Cách co một khối mà KHÔNG chép lại số đo của core** (dùng cho bàn phím `core/keyboard.js`):

```css
.aw-<x>-card .aw-kbd { transform: scale(S); }              /* phần HÌNH */
.aw-<x>-boards       { margin-bottom: calc(N*(S-1) + 0.4cqw); }   /* phần BỐ CỤC */
```

- `transform: scale()` giữ **đúng từng tỉ lệ core vẽ** (phím, khe, cỡ chữ, bo góc, bóng gờ) — không có
  nguy cơ lệch khi core đổi số đo, và **không hề đụng tới việc chia bề ngang giữa các phím**.
- Nhưng scale **chỉ ăn phần HÌNH**: hộp bố cục vẫn đứng nguyên ở chiều cao tự nhiên **N**, nên tự nó
  **không nhả một ly nào** cho phần tử `flex:1`. `margin-bottom` của khối phía trên mới biến nó thành chỗ
  thật. Khi `S < 1`, margin thành **ÂM** — đúng chủ đích: khối co lại để trống phần TRÊN hộp bố cục của nó
  (core neo `transform-origin: bottom center`), margin âm giao đúng khoảng trống đó cho nội dung.
- ⚠️ **N phải đo bằng `.aw-kbd.offsetHeight`** (bỏ qua transform). **KHÔNG dùng `getBoundingClientRect()`**
  — nó trả về kích thước ĐÃ nhân scale. Với bàn phím core hiện nay **N = 20cqw** (bản `getBoundingClientRect`
  ra 23cqw vì đang scale 1,15). Thử lại công thức ở `S = 1.15` phải ra đúng con số margin mà game đang dùng.

### 4. ⚠️⚠️ NĂM BẪY BẮT BUỘC BIẾT TRƯỚC KHI ÁP CHO TEMPLATE KHÁC

1. **Khối `@container` PHẢI đặt CUỐI FILE CSS.** Container query **không cộng thêm specificity** nào cả.
   Đặt ở đầu file trong khi các luật gốc (`transform`, `margin-bottom`) nằm bên dưới ⇒ **luật dưới thắng,
   cả tính năng im lặng không chạy**: 0 lỗi console, thử `@container` bằng probe vẫn báo "khớp", mà màn hình
   không đổi gì. Chỉ lộ ra khi đo thấy "khối không bao giờ co".
2. **ĐỪNG đặt ngưỡng ĐÚNG vào tỷ lệ mà khung đang nghỉ.** Để bậc 1 là `> 16/10.5` — đúng bằng tỷ lệ nghỉ —
   thì nó **tự kích hoạt ngay ở khung nghỉ**: chiều cao suy ra từ bề ngang qua `aspect-ratio`, rơi vào pixel
   lẻ, tỷ lệ đo được nhỉnh hơn phân số đúng ⇒ `>` khớp. Đo được: khung nghỉ ra scale 1,08 thay vì 1,15 đã
   duyệt, **không một dòng lỗi**. Vì vậy bậc 1 dùng **16/10,4**.
3. **Rút ngắn khung sẽ LÀM LỘ MỌI phần tử chữ quên khai `line-height`** — chúng đang âm thầm chiếm cao gấp
   **~1,6 lần** cỡ chữ (metrics tự nhiên của Baloo 2), nhất là thẻ `<input>`. Ở Running word, ô nhập cao
   **9,29cqw** trong khi chữ chỉ 5,81cqw; thời 4:3 hàng cao 10,13cqw nên lọt, sang 16:10,5 hàng còn 7,01cqw
   ⇒ tràn 2,28cqw và `overflow:hidden` **cắt mất gạch chân**. **Trước khi đổi tỷ lệ template nào, quét trước
   các phần tử chữ nằm trong hàng cao cố định mà thiếu `line-height`.** (Xem thêm mục `line-height` cho chữ
   Việt phía trên: tối thiểu **1.35** cho chữ hiển thị nội dung bài học; các ô chữ HOA tiếng Anh cỡ lớn như
   ô nhập của Running word thì khai bằng đúng phần tử chữ nằm cạnh nó để hai bên không nhảy cỡ.)
4. **Vòng quét nhiều template phải chạy từ trang gốc `/index.html`.** `core/catalog.js` khai `css` bằng đường
   dẫn **tương đối theo TÀI LIỆU**; chạy từ `templates/<x>/test.html` sẽ xin
   `/templates/<x>/templates/<y>/<y>.css` → **404**, sheet rỗng, và template `<y>` đo ra tỷ lệ sai —
   **trông y hệt một lỗi thật của dự án**.
5. **`width: 100%` ở chế độ phủ kín chỉ là một LỜI ĐỀ NGHỊ — phải kèm `flex-shrink: 0`** (Đợt 87).
   `.aw-page` là **flex ROW** và khung là một flex item: anh em nào còn hiện trong `.aw-page`
   (`.aw-below`, `.aw-as-bars`, hay bất cứ thứ gì thêm sau này) cũng cướp bề ngang, và `flex-shrink: 1`
   mặc định **lặng lẽ nhường**. Đo thật khi để sót `.aw-as-bars`: khung **sụp 1280px → 688px**, game chỉ
   nhỏ đi, **0 lỗi console, không dấu vết**. Luật letterbox CŨ giấu kín cả lớp lỗi này vì nó luôn xin
   **ít** bề ngang hơn khung cha có. `flex-shrink: 0` **không đá nhau với `max-width`** — chốt chặn 16:9
   vẫn thắng.

### 4b. Quét nhanh khi đổi tỷ lệ một template — 2 bẫy ĐO

- **`.aw-playarea` RỖNG cho tới khi bấm PLAY.** Đo bố cục trước cú bấm thì mọi phép đo trả về "0 tràn"
  cho MỌI game — trông y hệt kết quả đẹp. Luôn bấm `.aw-play-overlay button` trước, và luôn cho bàn đo
  một **ca kiểm chứng** (ép tỷ lệ vô lý như 6.0 rồi kiểm nó CÓ báo tràn) để chứng minh bàn đo biết phản ứng.
  ⚠️ **Từ Đợt 216 phải chờ thêm `START_GUARD_MS` (500ms)** sau cú bấm đó: tấm che nay còn nuốt cú chạm
  nửa giây nữa, nên bàn thử nào bấm PLAY rồi chạm ngay vào bàn chơi sẽ thấy cú chạm **rơi vào tấm che**.
- **Đo chế độ phủ kín thì div bọc của bàn thử không được có bề ngang cố định** — một `width:1000px` sót
  lại làm khung đo ra 1000px thay vì phủ kín, trông y hệt lỗi sản phẩm.

### 5. Bề ngang phím "Andrew" — **12,7cqw**, dùng chung

`.aw-tta-key-andrew` (Type the answer) · `.aw-cw-key-andrew` (Crossword) · `.aw-rw-key-andrew`
(Running word, đã sửa 7/8/2026 từ 10,6cqw) — **đều 12,7cqw**. Template nào mọc thêm phím Andrew thì dùng
đúng số này. ⚠️ Andrew là phím **cố định bề ngang** duy nhất của hàng cuối, còn Space/Submit **co giãn**
chia nhau phần còn lại — nên đặt sai bề ngang Andrew sẽ biểu hiện thành **HAI** phím trông khác đi
(Andrew ngắn + Space dài), rất dễ đổ oan cho một thay đổi khác.

## ⚠️ FULLSCREEN (đợt 12, 30/7/2026) — nhắm vào `root`, KHÔNG phải `page`

`fsBtn` request fullscreen trên **`root` (`#app`)**, không phải `.aw-page`. Lý do: `restart()` gọi
`startGame` → `root.innerHTML = ""` xoá `page` cũ; nếu fullscreen nằm trên `page` thì restart tự rớt
fullscreen. Nhắm vào `root` (không bao giờ bị xoá) thì restart giữ nguyên fullscreen. Hệ quả: lối RỜI
game (Home/Edit) phải TỰ gọi `exitFs()` để về cửa sổ (trước đây thoát nhờ `page` bị xoá). CSS letterbox
key theo tổ tiên fullscreen: `:fullscreen .aw-page` / `:fullscreen .aw-stage`.

**Tiền tố vendor**: mỗi tiền tố (`:fullscreen` / `:-webkit-full-screen` / `:-moz-full-screen` /
`:-ms-fullscreen`) phải là 1 RULE RIÊNG — KHÔNG gộp chung danh sách selector, vì trình duyệt vứt CẢ
rule nếu gặp 1 selector lạ (Chrome vứt luôn rule chuẩn nếu chung với `:-moz-full-screen`). JS dùng
helper `fsElement()`/`requestFs()`/`exitFs()` dò đủ tiền tố (panel TOMKO cũ thiếu API không tiền tố →
từng chỉ full 1 góc màn 4K).

### ⚠️ Fullscreen API THẬT không ổn định trên iPad Chrome — cờ `tpl.useZoomFullscreen` (5/8/2026)

Đo thật (Running word, iPad M1 12.9", Chrome): `requestFullscreen()` thật trên iPad Chrome có **4 tật
không sửa được bằng JS** vì thuộc lớp cử chỉ/heuristic riêng của trình duyệt: (1) Chrome tự vẽ nút X
to góc trên không tắt được, (2) chỉ vuốt xuống nhẹ gần mép trên là tự thoát fullscreen — chết người
với game chạm tay trẻ em, (3) tự thoát ngay sau 1 đoạn hoạt ảnh/thao tác (đo được: ngay sau màn 3-2-1
của Running word), (4) tự bật popup "leave/stay fullscreen?" giữa chừng.

**Lối thoát đã cài (opt-in, KHÔNG đổi hành vi mặc định):** template khai `useZoomFullscreen: true`
trong `registerTemplate({...})` → nút Fullscreen của engine đổi cơ chế sang
`root.classList.toggle("aw-zoomed")` (CSS thuần, **không hề gọi** Fullscreen API thật) thay vì
`requestFs()`/`exitFs()` — xem hàm `setZoomed()` + `exitAnyFullscreen()` trong `engine.js`. Không
đặt cờ = code chạy y hệt trước (zero-diff, đã đo lại Quiz/Type the answer). Đánh đổi: trình duyệt
không còn tự che thanh tab/địa chỉ (không có top-layer thật) — game phải TỰ `position:fixed` root
+ khoá cuộn trang nền, và **template tự viết CSS cho `.aw-zoomed`** trong file CSS riêng của nó
(mirror đúng hình dạng khối `:fullscreen` sẵn có, xem `templates/running-word/running-word.css`
làm mẫu) — core KHÔNG có CSS chung cho `.aw-zoomed` (chỉ 1 game dùng tính tới 5/8/2026). Muốn dùng
cho template khác: chỉ cần đặt cờ + copy khối CSS mẫu, đổi `.act-<type>` cho đúng game.

## ⚠️⚠️ BẪY TOPBAR — `inlineTimerBar` và `hasLivesSlot` LOẠI TRỪ NHAU (phát hiện 6/8/2026, Đợt 78)

Template khai **CẢ HAI** cờ này sẽ bị **hỏng im lặng**: phần tử tim được TẠO ra rồi **không bao giờ
được gắn vào DOM** — không hiện, **0 lỗi console**, không dấu vết. Thủ phạm là nhánh dựng topbar trong
`core/engine.js`:

```js
const livesSlot = tpl.hasLivesSlot ? el("span", "aw-top-lives") : null;
if (topbarMid) topbar.append(timerEl, topbarMid, scoreEl);   // ← livesSlot BỊ BỎ RƠI
else if (livesSlot) { ...topRight... }
```

Ghi chú ngay trong core đã nói *"A template never sets BOTH"* — nhưng đó là một **giả định**, không
phải hàng rào: không có cảnh báo nào nếu ai đó khai cả 2.

**Cách né KHÔNG cần sửa core** (Running word và Running team đều dùng): **ẩn hẳn topbar của engine rồi
tự vẽ hàng trạng thái của mình** trong khung game —

```css
.aw-stage.act-<type> .aw-topbar { display: none; }
```

Cách này còn cho phép để **bao nhiêu thứ tuỳ ý** trên hàng đó (Running team để 4: đồng hồ chính · tim ·
thanh giờ mỗi câu · điểm nhỏ) thay vì bị bó vào 2 khe core dựng sẵn.

**⬜ ĐỀ XUẤT chưa làm**: sửa nhánh `if (topbarMid)` để nó cũng gắn `livesSlot` (bọc phải giống nhánh
`else if`), xoá hẳn cái bẫy. Ghi ở `templates/running-team/GHI CHU RUNNING-TEAM.md` mục 12.

## LỚP HỌC (Settings → Classes) — `core/classes.js` (6/8/2026, v0.9.53)

Danh sách lớp + học sinh là **dữ liệu bền cấp app**, không phải nội dung của act: act nào gọi tên học
sinh (Running team, và các act sau) đều đọc từ đây. Sửa ở **Settings → Classes**, không sửa trong act.

**Node**: `{ id, kind:"class", root:"classes", parentId:null, name, students:[{id,name}] }` — nằm
**CHUNG collection `users/{uid}/items`** với thư mục và act.

⚠️ **Vì sao chung chỗ chứ không tạo collection riêng**: luật bảo vệ Firestore chỉ mở đúng
`match /users/{uid}/items/{itemId}`. Một collection mới (`users/{uid}/classes/...`) sẽ **bị từ chối**
tới khi có người vào Firebase Console sửa luật bằng tay. Chung chỗ thì **không phải đụng Console**.
Lớp vô hình với thư viện vì mọi hàm liệt kê (`listChildren`/`listFolders`/`searchItems`/`listTrash`)
đều lọc `n.root === root`.

⚠️ **KHÔNG thêm `"classes"` vào `ROOTS`.** Mảng đó điều khiển **các ô TRANG CHỦ** (`main.js`
`renderTop()` chạy `ROOTS.forEach`), thêm vào là mọc ô thư viện thứ ba.

⚠️ **`ensureNumbers()` và `getByNum()` trong `store.js` phải BỎ QUA `kind === "class"`.** Lớp học không
phải thứ link tới được; thiếu bộ lọc thì mỗi lớp **ăn mất một số link** và `?a=57` có thể trỏ trúng một
lớp học.

⚠️ **`core/classes.js` có CACHE RIÊNG** → chỗ nào gọi `resetCache()` của store (đăng nhập/đăng xuất)
phải gọi kèm **`resetClassesCache()`**, không thì dữ liệu 2 tài khoản lẫn nhau.

⚠️ **ID học sinh phải sống sót qua lần sửa danh sách** — `mergeStudents()` giữ ID của em nào tên không
đổi, vì dữ liệu đã lưu của act (vd GAME SET của Running team) gọi tên các em **theo ID**.

⚠️ **Template nạp `core/classes.js` phải dùng `await import(...)` (ĐỘNG), không import tĩnh** — file
này chạm tầng thư viện, mà luật "trang học sinh không nạp code thư viện" cấm kéo nó vào `play.html`.

## Luật số 1 — KHÔNG được sửa core/

Thư mục `core/` (bao gồm `app.css`, `engine.js`, `registry.js`, `layout.js`, `scoring.js`,
`leaderboard.js`, `confetti.js`, `sound.js`, `icons.js`, `utils.js`, `keyboard.js`, `themes/`, `assets/`) là
**dùng CHUNG cho mọi template**. Nhiều session có thể đang build nhiều game cùng lúc — nếu một
session sửa core, các session khác đang test template của họ sẽ vỡ ngay lập tức mà không biết vì sao.

- Nếu template của bạn cần một tính năng core chưa có (ví dụ: một loại animation mới, một API mới cho
  engine...), **KHÔNG tự thêm vào core/**. Hãy ghi đề xuất vào mục "ĐỀ XUẤT SỬA CORE" ở cuối file
  `GHI CHU <TÊN TEMPLATE>.md` của template đó. Người phụ trách tổng (session gốc / Teacher Andrew) sẽ
  xem xét và cập nhật core cho tất cả cùng lúc.
- Ngoại lệ: sửa lỗi (bug) rõ ràng trong core do chính bạn phát hiện khi test template — vẫn nên báo
  trước qua ghi chú thay vì tự sửa, trừ khi Teacher Andrew đã đồng ý cho sửa trực tiếp trong phiên đó.

## Cấu trúc core/

```
core/
├─ app.css          ← giao diện DÙNG CHUNG: khung 16:9, thanh trên/dưới, menu, panel tối,
│                       leaderboard, PLAY overlay, hiệu ứng ✓/✗, nút bấm, animation dùng chung
├─ engine.js         ← điều phối vòng đời game (xem mục "API engine ↔ template" bên dưới)
├─ registry.js        ← sổ đăng ký template: registerTemplate(tpl) / getTemplate(type) /
│                        hasTemplate(type) / ensureTemplate(type) — xem mục "Nạp template theo yêu cầu"
├─ catalog.js         ← 1 NGUỒN DUY NHẤT liệt kê loại act + cách tự nạp (css/load/sample)
├─ layout.js          ← buildStage(themeName): dựng khung 16:9 + vùng chữ dưới khung
├─ scoring.js         ← computeResult(raw, seconds), rankCompare(a,b)
├─ leaderboard.js     ← lưu kết quả trên máy (localStorage), theo activityId
├─ confetti.js        ← confettiBurst(container) — hiệu ứng pháo giấy "Game complete"
├─ sound.js           ← sound.correct()/wrong()/fanfare()/toggle()/isMuted() + AudioContext
│                        DÙNG CHUNG: context() và warmup() (xem mục "ÂM THANH"); pauseContext()/
│                        resumeContext() cho Menu pause (xem mục "MENU PAUSE")
├─ sfx.js             ← createPack(import.meta.url, {names, hot, skip}) — kho mp3 dùng chung
│                        cho MỌI template: play/pool/stop/durationMs/el/prime/stats/pauseActive/
│                        resumeActive/dropPaused (dropPaused = bỏ chỗ đang tạm dừng KHÔNG phát nốt,
│                        dùng khi ván bị vứt — xem mục "MENU PAUSE" điểm 3).
│                        ⭐ prime() NẠP TRƯỚC cả pack — xem mục "ÂM THANH" bên dưới
├─ icons.js           ← bộ icon SVG dùng chung (menu, prev, next, sound, fullscreen, check, cross,
│                        close, options, template, style, edit, assignment, print, playBig,
│                        markCheck, markCross, trophy, spinner)
├─ showdown.js        ← LUẬT của Showdown, THUẦN (không một dòng import): pick trong sessionStorage,
│                        memberAt/stampReview, groupByMember/rankBlocks, fmtRoundMs/pctBand
├─ showdown-review.js ← màn Show answers của Showdown (Đợt 177): title 3 cử chỉ, danh sách theo em,
│                        bảng xếp hạng hình phễu. DOM thuần — mạng đi vào qua callback loadTeams
├─ showdown-setup.js  ← Firestore của Showdown: bảng đội (sd_main) + bảng kết quả (sd_results).
│                        CHỈ được nạp bằng await import
├─ print.js           ← Print DÙNG CHUNG: popup chọn định dạng (Anagram/Crossword/Quiz/Unjumble) +
│                        luật khả dụng + render worksheet ra giấy (đọc template.toPrintItems)
├─ fit.js             ← autoFit() (co chữ theo dõi resize) + fitOnce() (co chữ 1 lần, cho ô nhỏ)
├─ numberstepper.js   ← makeNumberStepper() — ô số vuốt lên/xuống + nút ▲▼ (dùng trong panel Options)
├─ keyboard.js        ← createKeyboard({sound,onChar,onBackspace,submit?,extraKey?}) — BÀN PHÍM ẢO
│                        CHUẨN dùng chung cho mọi template cần gõ chữ (tông tối cố định, 4 hàng kiểu
│                        điện thoại: '/chữ/⌫, caps/chữ/?, numbers/chữ/.,, [extra?]/Space/[Submit?]).
│                        Tách ra từ Type the answer (1/8/2026); Crossword và Running word dùng lại.
│                        `submit` và `extraKey` là TÙY CHỌN — không cần thì bỏ qua.
│                        ⭐ 4/8/2026: phím dựng lúc ĐANG disabled nay VẪN được gắn handler
│                        (xem mục "BẪY BÀN PHÍM" bên dưới).
├─ utils.js           ← shuffle, formatTime, el(), ordinal(), fmtSecsParts()
├─ themes/            ← classic.css, classroom.css, beach.css + manifest.js (danh sách + lazy-load).
│                        Mỗi theme định nghĩa cả biến hình dạng ô + chữ: --aw-tile-radius,
│                        --aw-tile-border-width/-color, --aw-tile-shadow, --aw-question-stroke-*,
│                        --aw-question-fill (Classic/Beach = mặc định phẳng; Classroom = viền dày
│                        + chữ trắng viền đen kiểu "hoạt hình bảng phấn")
└─ assets/            ← font (Baloo 2) + âm thanh (oh-my-god-meme.mp3), dùng chung, offline
```

## Nạp template theo yêu cầu — `ensureTemplate(type)` (v0.9.7)

Trang KHÔNG `import` sẵn template nữa. Trước khi chơi hoặc sửa một act, gọi:

```js
import { ensureTemplate } from "./core/registry.js";

await ensureTemplate(activity.type);   // chèn CSS + import module (module tự registerTemplate)
startGame(app, activity, { ... });     // engine dùng getTemplate() đồng bộ, lúc này đã chắc chắn có
```

- Nguồn dữ liệu là `core/catalog.js`: mỗi loại khai `css` (đường dẫn tính từ TRANG, vì `index.html`
  và `play.html` đều nằm ở gốc) + `load()` + `sample()`.
- Hàm **đợi CSS áp xong** rồi mới trả về — nếu không, game sẽ hiện 1 nháy chưa có style. Có chặn
  4 giây: mạng lớp chậm thì thà chơi trước, CSS vào sau, còn hơn treo màn hình.
- Mỗi loại chỉ nạp 1 lần; gọi song song nhiều lần vẫn an toàn (nhớ lời hứa trong `pending`).
- Loại không có trong catalog → **reject**, gọi bên ngoài phải try/catch (main.js hiện toast
  "could not load" / "editor coming soon").
- `getTemplate()` vẫn ĐỒNG BỘ và vẫn ném lỗi nếu chưa nạp — engine/print dùng nó là đúng, vì lúc đó
  trang đã `await ensureTemplate` rồi.

Lý do đổi: trước đây mỗi trang phải tự khai danh sách template (import JS + link CSS trong HTML).
`play.html` chỉ khai mỗi Quiz nên **HS không chơi được bài giao thuộc 13 loại còn lại** — lỗi âm thầm
suốt một thời gian dài. Nay chỉ còn 1 danh sách, và HS mở 1 bài chỉ tải đúng 1 game.

## Đổi template giữa lúc chơi — `core/convert.js` (v0.9.21)

Thầy có thể đang chơi 1 act rồi **đổi sang loại game khác chơi tiếp CHÍNH bộ nội dung đó** (nút
**Template** dưới khung · **Change template** trong menu ☰ · **Play a different template** ở màn kết
thúc). Việc này KHÔNG lưu gì: engine dựng 1 act TẠM (id `conv_...`, cờ `_converted`) rồi `startGame`
lại — act gốc trong thư viện nguyên vẹn.

`core/convert.js` là bộ phiên dịch dữ liệu (chỉ import `catalog.js` + `utils.js`, **KHÔNG chạm store**
nên engine import tĩnh vẫn an toàn với luật "trang HS không nạp code thư viện"). Xuất 3 hàm:

- `toRecords(activity)` → `{ kind, records }`. Rút act về "record" chuẩn theo 4 *kind*:
  `qa` `{term, clue, altAnswers[], distractors[]}` · `tf` `{text, truth}` · `sentence` `{sentence, clue}` ·
  `card` `{text}`.
- `switchTargets(activity)` → `[{type,label}]`: các loại đổi-được từ act hiện tại (đã bỏ chính nó, chỉ
  game `built`). Engine dùng nó để bật/mờ mục trong panel Template và dựng picker.
- `convertActivity(activity, targetType)` → **async**, trả về act mới. options+instruction lấy từ **file
  sample của game đích** (chắc hợp lệ); giữ `theme` của act nguồn; MC đích tự sinh đáp án nhiễu từ các
  `term` khác trong bộ.

**Phạm vi "nhóm hợp dữ liệu tốt" (thầy chốt 3/8/2026):** nhóm QA (anagram · flying_fruit · crossword ·
find_the_match · balloon_pop · quiz · gameshow · maze_chase · open_the_box · type_the_answer, và
whack_a_mole *mode quiz*) đổi qua lại cho nhau **+ speaking_cards**; `true_false` ↔ `whack_a_mole`
(*mode trueFalse*) + speaking_cards; `unjumble` → {speaking_cards, type_the_answer}; `speaking_cards`
không đổi được (thiếu đáp án). Guard: đích cần đề (`NEED_CLUE`) bị loại nếu bộ nguồn <60% có clue;
crossword cần 2..40 câu.

> ⭐ **THÊM TEMPLATE THỨ 15** thì ngoài `core/catalog.js` (1 dòng để chơi/sửa được), nếu muốn nó tham
> gia đổi template thì thêm **1 nhánh trong `toRecords()` + 1 nhánh trong `buildContent()`** của
> `convert.js` (và, nếu là "kind" mới, khai target list). Không thêm thì game vẫn chạy bình thường, chỉ
> là không hiện trong danh sách đổi.

### ⭐ Danh sách game đổi-được LUÔN tính từ act GỐC — `switchList()` (v0.9.36)

Act tạm (`conv_...`) chỉ **MƯỢN** nội dung của act gốc. Vì convert là quá trình **MẤT dữ liệu**, hỏi act
tạm "đổi được sang gì" cho ra danh sách nghèo dần sau mỗi lần đổi — tức là **tự khoá mất tính năng**.
Đo thật 4/8/2026: act gốc Quiz → đổi tạm sang **Speaking cards** (không có đáp án) →
`switchTargets(actTạm)` trả về **0 game** ⇒ panel Template khoá sạch, thầy kẹt trong game tạm.

→ `engine.js` có hàm **`switchList()`**: luôn `switchTargets(originAct)`, thêm lại chính loại của act gốc
(lối quay về act thật) rồi bỏ loại đang chơi. **Mọi chỗ liệt kê game đổi-được PHẢI dùng `switchList()`,
KHÔNG gọi thẳng `switchTargets(activity)`** — hiện là `buildTemplatePanel` (panel Template dưới khung) và
`openSwitchPicker` (menu ☰ · "Play a different template" ở màn kết thúc). `doSwitchTemplate` vốn đã
convert từ `originAct` từ v0.9.27, nay danh sách khớp với hành vi đó.

### ⚠️ Whack-a-mole: `options.mode` PHẢI bám theo nội dung khi convert (v0.9.36)

Whack-a-mole là template DUY NHẤT có 2 hình dạng nội dung chọn bằng **option**: `mode:"quiz"` đọc
`content.questions`, `mode:"trueFalse"` đọc `content.statements`. Trong `convert.js` mode được **ép**
theo `kind` của bộ nguồn, KHÔNG chỉ đặt-nếu-chưa-có — vì options được copy từ sample của game đích (và
sample whack vốn mang sẵn `mode:"trueFalse"`), nên điều kiện `if (!options.mode)` cũ không bao giờ đúng:
mọi act QA (Anagram, Quiz, Find the match...) chuyển sang Whack đều mang `questions` mà tự khai true/false
→ game trắng, báo "This activity has no statements yet." **Template thứ 15 nào cũng chọn hình dạng nội
dung bằng option thì phải ép tương tự.**

### Lưu options + act GỐC (`base`/`originAct`) — v0.9.27

`startGame(root, activity, { base })` nhận thêm `base` = **act GỐC** trong thư viện đứng sau lượt chơi.
`originAct = base || activity`. `restart` và `doSwitchTemplate` LUÔN truyền `base: originAct`, nên qua bao
nhiêu lần Đổi template thì `originAct` vẫn là act thật ban đầu (act tạm `conv_` KHÔNG bao giờ thành base).

- **Đổi template convert TỪ `originAct`** (không từ act tạm hiện tại). Đổi **về đúng `originAct.type`** →
  chơi thẳng `originAct` (khôi phục act thật + options riêng), không tạo bản sao.
- **Apply options** (buildOptionsPanel, chỉ khi `!session`): act chính → `saveActivity(originAct)`; act tạm
  (`activity._converted`) → ghi `originAct.templateOptions[activity.type] = {...options}` rồi
  `saveActivity(originAct)`. **TUYỆT ĐỐI không `saveActivity` act có id bắt đầu `"conv_"`** (kẻo rác thư viện).
- **`convertActivity`** ưu tiên `activity.templateOptions[targetType]` (options đã nhớ) trước sample defaults.
  → Nhờ vậy đổi 1 act sang template tạm, chỉnh options, lần sau chọn lại template đó của act đó vẫn giữ options.
- `templateOptions` là 1 field thường trên act (Firestore-safe qua `clean()`); lưu kèm khi `saveActivity`.

## ⭐⭐⭐ BÀI GIAO — HỢP ĐỒNG ĐẦY ĐỦ (Đợt 245 → 257, mới nhất 24/8/2026)

> ### ⭐⭐ LUẬT THỨ 9 (Đợt 257) — TRANG NHÚNG BÁO "EM VỪA NỘP XONG" CHO TRANG MẸ
> `play.js` bắn **`postMessage({ type: "AWORD:NOP", code, name })`** lên `window.parent` để
> myLesson web tự làm mới leaderboard của đúng act. Bốn chốt, cả bốn đều là điều kiện chứ không
> phải trang trí:
> - ⛔ **chỉ khi `kq.ok`** — server đã xác nhận đủ HAI document. Nộp treo mà báo là bảng bên kia
>   làm mới vô ích, và tệ hơn: nó nói dối rằng bài đã vào.
> - ⛔ **chỉ khi đang nhúng** (`window.parent !== window`). Mở tab thường thì không bắn gì.
> - ⭐ **trả lại NGUYÊN promise gốc** (`baoNopChoTrangMe` chỉ *bọc* `sendAttempt`) ⇒ đường nộp và
>   đường nộp lại không đổi một li nào. Tin báo là **người đứng nghe**, không phải một mắt xích.
> - `target: "*"` là an toàn ở ĐÂY vì payload toàn thứ **vốn đã công khai** (mã bài + tên trên bảng
>   điểm) — và **trang mẹ mới là bên phải lọc theo origin**. Đừng bê quy ước này sang một payload
>   có dữ liệu riêng tư.
>
> ⛔ **`AWORD:NOP` là CỬA THỨ SÁU cho myLesson — đừng đổi tên nó, đừng đổi khoá `code`/`name`.**
> Cặp chặt **myLesson web v1.13.0**; revert lẻ một bên là hỏng bên kia.



**Đọc mục này TRƯỚC khi sửa bất cứ thứ gì trong `core/assignment-ui.js` hoặc `core/assignments.js`.**
Khu bài giao vừa đi 6 đợt liên tiếp và đã có 4 chỗ "sửa cho gọn" là hỏng ngay.

### 1. `createAssignment(act, { title, deadline, endOptions, folderId, options, sourceAct })`

| tham số | ai quyết |
|---|---|
| `act` | act **được CHƠI** — quyết `activityType` và ảnh chụp `activity` |
| `sourceAct` | act **trong THƯ VIỆN** — quyết `activityId` · `activityNum` · `activityTitle` |

⛔⛔ **Hai cái đó CỐ Ý khác nhau khi thầy giao act dưới dạng game khác** (Đợt 250).
`convertActivity()` trả về act dùng một lần: `id: "conv_…"`, không có `num`, `_converted: true`.
Lưu id đó xuống `activityId` là bài giao **mất liên kết vĩnh viễn** với act trong thư viện, vì
`listAssignmentsForAct(activityId)` — thứ vẽ ra thanh bài giao dưới act — khớp theo đúng trường đó.
Không truyền `sourceAct` ⇒ hai cái là một, tức mọi lời gọi có trước Đợt 250.

### 1b. CỬA CHO myLesson (Đợt 252) — `giaoBai` + marker ASSIGN

`window.__awordBridge.giaoBai(lop, { tieuDe })` mở form Set assignment của act đang mở.

⛔⛔ **Nó mở trên `originAct`, KHÔNG phải `libAct`.** Hai cái chỉ khác nhau sau một cú **Change
template**: khi đó `libAct` là bản chuyển đổi `conv_…`. Đưa bản đó vào form thì form thấy
*"template đã đúng rồi"*, không gắn `sourceAct`, và bài giao rơi thẳng vào cái bẫy ở mục 1 —
**mất liên kết vĩnh viễn với act trong thư viện**. Muốn giao bằng game khác thì **chọn trong ô
template của chính form**, đừng đổi template ở ngoài rồi mới gọi vào.

`onCreated(assignment, { bo, boTen, mauType, mauTen })` — tham số **thứ hai** (Đợt 252) mang tên
đọc được của bộ nghĩa và template, vì tài liệu đã lưu không có chúng: `activityType` là mã máy,
còn bộ nghĩa **biến mất hẳn** sau `convertActivity` (gỡ sạch `variants`). ⇒ Phải tính **trong
form, trên act GỐC đã đeo selector**, trước lúc chuyển đổi.

Marker: `MYACT:AW:ASSIGN:{"code","title","bo","boTen","mauType","mauTen"}` — bắn ở CẢ hai đường
(myLesson gọi vào, và thầy tự bấm nút Set assignment). ⛔ **Đừng đổi tên marker, đừng bỏ 2 khoá
cũ `code`/`title`** — myLesson đang đọc đúng chúng.

**⭐ Đợt 255 — ĐUÔI TEMPLATE + `dataset.tpl`.** Tiêu đề bài giao tự động kết thúc bằng
" — <TPL viết tắt>" (bảng `TPL_SHORT`, export `tplShortName`/`datDuoiTemplate`); đổi template
trong form là đuôi đổi theo; thầy sửa tay mất đuôi thì tôn trọng. **Đuôi hiện hành ghi vào
`titleInput.dataset.tpl`** — myLesson (`capNhatTenBaiGiao`) đọc nó để nối lại đuôi khi bơm phần
đầu tiêu đề. ⛔ Đừng bỏ dataset.tpl, đừng đổi khuôn " — " của đuôi — hai bên đang bắt tay đúng
khuôn đó. Ô Show answers nằm ở hàng `.aw-as-titlehead` (cạnh nhãn Assignment title); `cbAnswers`
vẫn cùng scope với đường START như cũ.

**⭐ Đợt 254 — `?giao=…&khung=1` (CHẾ ĐỘ NHÚNG) + marker `MYACT:AW:GIAO:DONG`.** Có `&khung=`
thì `body` mang thêm `aw-khung-mode`: pop-up GỐC (mở lúc `modalStack` RỖNG — form Set assignment,
màn QR sau START) được `openModal` đánh dấu `.aw-as-goc` **ngay lúc mở** và CSS vẽ nó PHẲNG TRÀN
MÉP (ẩn cả `.aw-as-head` — vỏ myLesson vẽ đầu đề thay); picker xếp chồng vẫn là thẻ nổi. Khi
pop-up gốc ĐÓNG mà sau `setTimeout(0)` stack vẫn rỗng thì bắn `MYACT:AW:GIAO:DONG` — myLesson
nghe để đóng pop-up bên đó. ⛔ Ba thứ đừng "dọn": (1) `setTimeout(0)` — đường START đóng form rồi
mở màn QR trong CÙNG một lượt, bắn sớm là myLesson nuốt mất màn QR; (2) đánh dấu lúc MỞ chứ đừng
suy lúc đóng — lúc đóng stack đã splice; (3) lề 22px của `.aw-as-modal` trong khung mode là mốc
căn hàng với khối tiêu đề bên myLesson (`.aw-card.giao`), đổi là đổi CẶP. Không `&khung=` ⇒ y hệt
Đợt 253.

⛔ **Hai bài giao TRÙNG TÊN trong cùng một thư mục bị TỪ CHỐI** (`assignmentNameTaken`). Bàn thử
tạo nhiều bài liên tiếp phải đặt tên khác nhau, không thì bài sau lặng lẽ không ra đời và phép
chờ marker treo tới hết giờ — trông hệt như code hỏng.

### 2. BA LUẬT KHI GIAO ACT DƯỚI DẠNG GAME KHÁC (Đợt 250)

1. ⛔ **Chọn bộ nghĩa TRƯỚC, `convertActivity()` SAU.** `toRecords()` gọi `resolveActivity()` để ép
   phẳng act tích hợp xuống ĐÚNG bộ nghĩa đang chọn (luật Đợt 145). Làm ngược lại thì lớp chọn VI1
   **nhận về ENG1, im lặng, không lỗi**. Trong `openAssignmentSetup` việc chuyển đổi vì thế nằm ở
   **lúc bấm START**, không phải lúc bấm chọn template.
2. ⛔ **Giữ act GỐC nguyên vẹn suốt form.** Act đã chuyển đổi không còn `content.variants` — đưa nó
   cho bảng Options là hàng ENG1/ENG2/VI1 trống trơn. `buildOptionsControls` luôn nhận `act` gốc.
3. ⛔ **Đổi template ⇒ dựng LẠI options** từ `getDefaultOptions(typeMới, "homework")`, chỉ bê sang 4
   khoá selector (`splitViewOptions().selectors`). Thầy chốt 24/8: cùng một tên ô ở hai game không
   phải cùng một con số.

⚠️ `tpl.noAssignment` (Đợt 245) là **một CÂU, không phải boolean** — 3 template không giao được
(`speaking_cards` không gọi `ui.finish()`; `running_word`/`running_team` báo cáo theo ĐỘI). Bảng chọn
template làm mờ chúng và hiện chính câu đó làm lý do. ⛔ Muốn gỡ chặn thì phải sửa `renderSummary`
của chúng TRƯỚC.

### 3. `templatePicker` — ô hai tầng trong bảng Options (Đợt 250)

`buildOptionsControls(tpl, draft, { kind, act, templatePicker })` →
`buildOptionsBody(host, { …, templatePicker })` → `buildContentSwitchRow(swHost, { …, templatePicker })`.

```js
templatePicker = { label(): string, icon(): htmlString, onPick(): void }   // caller giữ pop-up + trạng thái
```

- **CHỈ form Set assignment truyền.** Bảng Options trong game · Settings · Showdown để `null` và ra
  **y hệt** hàng cũ (cao 46px, không có ô hai tầng). Bàn thử `dot250-assign.html` có phép **chặn hồi
  quy đo tận nơi** cho việc này — đừng gỡ.
- ⚠️ Có picker thì `has-variants` bị **ép bật** kể cả act không có bộ nghĩa: class đó là thứ đẻ ra
  **cột thứ hai** của hàng, không có cột thì nút template không có chỗ đứng (ô mang `is-tplonly`).
- ⛔ `is-wide` (thu cột thứ hai về 0) bị **chặn** khi có picker — nếu không, act một bộ nghĩa sẽ giấu
  mất đúng cái nút thầy mở form ra để bấm.

### 4. `openModal` xếp chồng được — CHỈ pop-up TRÊN CÙNG nghe Escape (Đợt 250)

`modalStack` trong `core/assignment-ui.js`. Trước đó mọi modal cùng nghe `keydown` trên `document`,
nên **một cú Escape đóng cả pop-up lẫn form bên dưới**. Câu chú thích cũ "One modal at a time" mô tả
một thói quen, chưa bao giờ là một cơ chế. ⚠️ Thêm pop-up lồng nhau ở đâu trong file này cũng dùng
`openModal` như thường — stack tự lo.

### 5. KHÔNG CÓ CHỮ THỪA TRÊN FORM (thầy chốt 24/8, Đợt 250)

Thầy: *"Bỏ tất cả các dòng hướng dẫn, tôi hoàn toàn không cần 1 dòng hướng dẫn nào cả."*
Đã bỏ: dòng deadline LATE · "Filed in Results under…" · nhãn "At the end of the game…" · nhãn
"Options" (nay là tên trên viền khối `.aw-as-block2`) · nhãn "Status" · "Closing keeps every score…" ·
"Students open this link…" ở màn QR.
⛔ **GIỮ** câu trong `confirmTrashAssignment` — đó là **câu hỏi** của hộp xác nhận xoá, không phải lời
khuyên; hộp xoá không chữ là một cái bẫy.
⚠️ Việc **tính** thư mục Results vẫn còn (START cần `folderId`, phép kiểm trùng tên cần
`allAssignments`) — chỉ có **dòng chữ** báo điều đó là bị bỏ. Đừng xoá nốt phần tính.

### 6. `optVer` — cả hai đường tạo và sửa đều phải đóng dấu (Đợt 245)

`snapshotOf()` đóng dấu ở đường CREATE; form Edit **quy đổi TRƯỚC rồi mới đóng dấu** (`migrateActivityOptions`
→ `"activity.optVer": OPT_VER`). ⛔ Đóng dấu không quy đổi = **hạ cấp âm thầm** ("Points off 3" của
thang cũ đóng băng thành "3 trên 100", tức gần như Off).

### 7. Ô tích cuối game — CHỈ CÒN "Show answers" (Đợt 246)

Trang học sinh chỉ đọc `session.endOptions`. `leaderboard`/`startAgain` vẫn được **ghi cứng `true`**
xuống document để mọi bản ghi giữ đủ 3 khoá — đừng "dọn" chúng đi, sẽ có nơi gặp một document thiếu
hình dạng.

### 8. ⛔⛔ BẪY LỀ 10px — HAI Ô LỆCH NHAU 5px (Đợt 251, thầy bắt bằng mắt)

`.aw-set-opts .aw-opt-switch { margin-bottom: 10px }` (khung Settings/bài giao) **THẮNG**
`.aw-opt-content .aw-opt-switch { margin-bottom: 0 }` — cùng độ đặc hiệu `0,2,0` nên cái viết SAU
thắng. Hàng là lưới `align-items: center`: ô trái cao 60 **+ lề 10 = 70** chiếm trọn hàng và dính
mép trên, ô phải cao 60 được căn giữa trong hàng 70 ⇒ **tụt xuống đúng 5px**.

⚠️ **Lỗi có từ TRƯỚC Đợt 250 nhưng vô hình**: hồi đó ô phải chỉ cao 30px — một con chip nhỏ trôi
giữa hàng, không lệch so với cái gì cả. Nâng nó lên 60px là lộ ra ngay.
Vá bằng `.aw-opt-content.has-tpl .aw-opt-switch { margin-bottom: 0 }` (đặc hiệu `0,3,0`, thắng bất
kể thứ tự, và chỉ chạm `.has-tpl` nên game/Settings giữ nguyên).

📌 **Bài học chung**: hai quy tắc CSS cùng độ đặc hiệu thì **thứ tự trong file quyết định** — file
này 6800+ dòng, "quy tắc của tôi ở trên kia" không có nghĩa là nó thắng. Khi hai hộp phải thẳng
hàng, **đo cả mép trên VÀ mép dưới** (`getBoundingClientRect`), đừng chỉ so chiều cao: hai hộp cùng
cao 60 vẫn có thể lệch nhau 5px. Bàn thử `dot250-assign.html` nay đo đúng hai mép đó ở cả hai chế độ.

## API engine ↔ template (bắt buộc mọi template tuân theo)

Mỗi template là 1 file JS, tự đăng ký khi được import:

```js
import { registerTemplate } from "../../core/registry.js";

registerTemplate({
  type: "quiz",            // khớp với activity.type trong dữ liệu mẫu
  scorable: true,           // false = game "mở" không điểm/leaderboard (vd Open the box)
  name: "Quiz",             // tên hiển thị (tiếng Anh)

  mount(root, activity, ui) {
    // Vẽ game vào `root` (một <div> engine đã tạo sẵn, đã có position:relative để bạn
    // gắn hiệu ứng bay .aw-mark-fly / .aw-tile-badge nếu cần).
    // `activity` = dữ liệu game (title, instruction, theme, options, content).
    // `ui` = cầu nối để nói chuyện với engine — xem bảng dưới.
    return cleanupFn;       // hàm dọn dẹp khi thoát/chơi lại (huỷ timer riêng nếu có, v.v.)
  }
});
```

`ui` cung cấp:

| Hàm | Việc gì |
|---|---|
| `ui.setScore(n)` | Cập nhật số điểm góc phải-trên (biểu tượng ✓ + số) |
| `ui.setNav({index, total, onPrev, onNext, nextLabel, label})` | Cập nhật thanh dưới "x of N" + 2 nút mũi tên. `onPrev`/`onNext` = `null` → nút mờ (không bấm được). `nextLabel` (HTML/SVG) thay icon mũi tên (dùng cho câu cuối = dấu ✓). **`label`** (v0.9.37, 4/8/2026) thay HẲN chữ "x of N" bằng chuỗi của template — vd Find the match hiện `"Page 1 / 2"`, hoặc `""` để thanh dưới TRỐNG. Không truyền = y hệt cũ (tương thích ngược tuyệt đối, đã đo lại 6 game) |

> ⚠️ **Đợt 59 (3/8/2026) — `celebrate()` KHÔNG còn ẩn nav lúc game-complete.** Trước đây engine chạy
> `navWrap.style.visibility="hidden"` suốt ~2.2s màn pháo hoa; vì overlay confetti trong suốt nên thầy
> thấy nav "đôi khi biến mất" (rõ nhất ở quiz TẠM ngắn tự kết thúc khi trả lời hết). Nay bỏ hẳn toggle
> đó — bảng Summary mờ đục sau pháo hoa vẫn tự che cả thanh dưới. Ảnh hưởng MỌI template (nav hiển thị
> trong lúc pháo hoa thay vì ẩn) — lành tính. Nếu template nào cần auto-finish mà KHÔNG muốn kết thúc lúc
> người chơi còn điều hướng, hãy huỷ hẹn giờ auto-finish trong hàm prev/next của mình (xem Quiz `clearAutoTimer`
> + Type-the-answer Đợt 56).
| `ui.onSubmit(fn)` | Đăng ký hàm chạy khi người dùng bấm "Submit answers" trong menu |
| `ui.sound.correct()` / `.wrong()` / `.fanfare()` | Phát âm thanh (tự tôn trọng nút tắt tiếng) |
| `ui.toast(msg)` | Hiện thông báo nhỏ nổi ở đáy khung, tự biến mất |
| `ui.finish({correct, incorrect, total, perQuestion})` | **Báo game đã xong.** Engine tự lo: dừng đồng hồ, tính điểm, lưu leaderboard, chạy hiệu ứng "Game complete", hiện bảng tổng kết. `perQuestion` = mảng `{q: index, correct: true/false}` (dùng để chấm điểm và — nếu cần — chi tiết từng câu) |

Engine tự động lo (KHÔNG cần template làm): nút PLAY khổng lồ che game lúc đầu, đồng hồ, nút loa,
nút phóng to, menu (☰), pháo giấy khi hoàn thành, bảng tổng kết, bảng xếp hạng, khung 16:9, tên
game + hướng dẫn hiển thị dưới khung.

### ⭐ CHUẨN BỊ TRƯỚC KHI CHƠI — `tpl.prepare(activity, onProgress)` (Đợt 108, 11/8/2026)

Template nào **thật sự không chạy được** cho tới khi một thứ nặng nạp xong thì khai thêm:

```js
prepare(activity, onProgress) {
  return somePromise;      // engine chỉ cần biết "xong hay chưa"
}
```

Engine gọi hàm này **ngay khi act mở ra** (lúc màn hình READY hiện, trước khi ai bấm gì), rồi:
**ẨN nút PLAY** → hiện **thanh % đứng đúng chỗ nút PLAY** (`.aw-ready-prep`) → promise xong mới hiện
lại PLAY. `onProgress({percent, text})`: `percent` 0-100 kéo thanh, `text` thay dòng chú thích — cả 2
đều không bắt buộc, và engine cố ý KHÔNG biết gì về "mô hình"/"tải" (template tự quy đổi).

- **Đẻ ra cho SPEAKING**: mô hình chấm phát âm ~240MB, nếu để tải sau khi bấm PLAY thì học sinh ngồi
  trước cái nút mic chưa chấm được gì (thầy yêu cầu 11/8/2026).
- **Tương thích ngược tuyệt đối**: template KHÔNG khai `prepare` thì không vào nhánh này, PLAY hiện
  ngay như xưa nay (đã đo lại thật Quiz + Anagram ở Đợt 108).
- **prepare() LỖI vẫn hiện PLAY** — không được để act chết cứng sau 1 thanh % không bao giờ đầy.
  Template phải tự lo đường lùi (SPEAKING quay về nạp mô hình ở lần ghi âm đầu tiên).
- ⚠️ Chạy **mỗi lần dựng lại màn READY** (kể cả "Start again"), nên hàm nạp của template **phải nhớ
  kết quả** (`_asrP` trong `core/speech-score.js`) — không thì tải lại từ đầu mỗi ván. Đo thật Đợt 108:
  lần đầu **23,5 giây**, lần dựng lại **55 mili giây**.
- ⚠️ Đừng nhớ một promise **ĐÃ HỎNG**: mất mạng 1 giây mà cache luôn kết quả hỏng thì cả tab đó vĩnh
  viễn không nạp lại được (đã vá trong `loadASR` bằng `_asrP.catch(() => { _asrP = null; })`).

### ⭐⭐ CHỐT 0,5 GIÂY SAU KHI BẤM START — `START_GUARD_MS` (Đợt 216, 20/8/2026)

Thầy: *"ngay khi start đã bấm được ngay nội dung rồi nên một số pha vừa bấm start xong bấm nhầm ngay
nội dung bên dưới"*. Hai thứ cộng lại làm việc đó **không thể tránh** được bằng tay:
`press()` bắn ngay tại **pointerdown** (Đợt 175), nên START ăn từ lúc ngón CHẠM XUỐNG; mà handler cũ
tắt `pointer-events` của tấm che ở **câu lệnh ngay sau đó**, còn `begin()` mount game ở câu kế tiếp.
Đo trên bản cũ: ô đáp án **sống sau 31ms**.
- ⭐ **KHÔNG DỰNG PHẦN TỬ MỚI**: `.aw-play-overlay` vốn `inset:0` phủ đúng khung, nên chỉ cần **đừng tắt
  `pointer-events`** là đã có sẵn tấm chắn đúng cỡ, đúng lớp. Nó vẫn mờ đi đúng 260ms như cũ, chỉ là
  **mờ rồi mà vẫn nuốt cú chạm** cho tới khi hết chốt.
- ⚠️⚠️ **MỘT ĐỒNG HỒ, KHÔNG PHẢI HAI.** Cặp cũ (`fade.onfinish` + dự phòng 350ms) có lý do chính đáng là
  tab ẩn có thể nuốt sự kiện animation — chính vì thế việc gỡ tấm che nay treo **HẲN vào `setTimeout`**
  và **không bao giờ vào animation**: để `onfinish` ở đó là game hở ra ở mốc 260ms, chốt coi như không có.
- ⚠️ `playStarted` là biến MỚI, thay cho phép hỏi `!playOverlay.isConnected` ở Options ▸ Apply. Hai câu
  hỏi ("đã bấm PLAY chưa" và "tấm che còn trong DOM không") **trước giờ là một, từ đợt này thì không**.
- 🧪 Đo (`document.elementFromPoint` giữa vùng chơi, lấy mẫu 25ms, có đối chứng bản `HEAD`):
  **cũ 31ms → mới 522/541/543ms** trên quiz · anagram · true-false. 0 lỗi console, tấm che được dọn sạch.
- ⚠️ **500ms là số CHỌN**, không phải số tròn tiện tay: màn READY mờ hết trong 260ms, nên mọi con số ≤ đó
  là **không còn chốt nào** sau khi mắt đã thấy game. Thầy chọn 0,5s giữa 0,3 / 0,5 / 0,8 / 1,0.

### ⭐⭐ TẠM DỪNG NAY CÓ **LÝ DO**, VÀ LAN SANG BÀN KIA (Đợt 217, 20/8/2026)

Thầy giao hai câu, hoá ra là một việc: *"Khi Fight, 1 bên bấm nút menu thì bên còn lại cũng tạm
dừng game cùng"* và *"Trong mọi chế độ, bấm bất cứ nút tùy chỉnh nào mà hiện pop-up thì game đều
tạm dừng như khi bấm menu (fight thì dừng cho cả 2)"*.

`enterMenuPause()/exitMenuPause()` tách làm hai tầng:
| Hàm | Việc |
|---|---|
| `freezePlay()` / `thawPlay()` | THÂN: đồng hồ · `AudioContext` · mọi mp3 đang phát · mọi animation trong sân · `tpl.onPause` |
| `enterPause(reason, {dim})` / `exitPause(reason)` | TẬP LÝ DO + tấm che sân + chuyển tiếp sang bàn kia |

Ba lý do đang dùng: **`"menu"`** (☰) · **`"panel"`** (Options/Template/Style/MODE) · **`"relay"`**
(bàn kia gửi sang) · **`"stolen"`** (bị giành mất đội, xem dưới).

- ⛔⛔ **PHẢI LÀ TẬP, KHÔNG ĐƯỢC LÀ CỜ.** Mở Options rồi bấm ☰ Menu rồi đóng Menu — với một cờ thì
  chính cú đóng đó **thả đồng hồ chạy lại trong lúc bảng Options vẫn che kín màn**. Đồng hồ chỉ
  được chạy lại khi lý do CUỐI CÙNG rời đi. (Đã đo: nhóm C của `scratch/dot217-pause.html`.)
- ⛔⛔ **CHỈ `"menu"` VÀ `"panel"` MỚI CHUYỂN TIẾP.** `"relay"` là do bàn kia gửi; chuyển tiếp nó
  ngược lại là hai bàn gọi qua gọi lại vô tận.
- ⚠️ **`dim` ĐI THEO NGUỒN, không tự quyết.** ☰ Menu chỉ tối MỘT bàn ⇒ bàn kia phải tự đắp tấm che.
  Bảng công cụ đã phủ tối cả khung nhìn bằng `.aw-tool-dim` ⇒ bàn kia đắp thêm nữa là **nửa màn
  hình bên đó tối hơn hẳn nửa bên này**, trông y như lỗi hiển thị. API:
  `fight.ctl.setPaused(side, on, dim)` + `fight.ctl.registerPause(side, fn)` (cùng khuôn
  `registerWaitBar`: trọng tài giữ luật, engine giữ pixel).
- ⚠️ `exitPause("panel")` đặt **SAU** dòng `if (!dim && !panel) return;` trong `closeToolPanel` —
  `openToolPanel` gọi `closeToolPanel(false)` để dọn dẹp lúc chưa có bảng nào, và nếu gỡ lý do ở
  trên dòng đó thì mỗi lần mở bảng là một nhịp thả-rồi-khoá đồng hồ.

### ⭐⭐ CHE DẤU VẾT TRẢ LỜI KHI FIGHT — `.aw-fight-board.is-concealed` (Đợt 217)

Thầy: *"nếu bật delay, đội xong trước hiện tích đúng/sai và tính điểm xong phải có phương án ẩn ngay
câu trả lời (VD quiz thì nhạt màu hơn các ô đáp án, Anagram thì không hiện chữ trong ô nữa…)"*.
Cửa sổ chờ nay tới **10 giây** (Đợt 216) — mười giây đội kia được liếc sang bàn bên, thứ mà cửa sổ
0,1s của Đợt 133 chưa bao giờ cho đủ thời gian.

- ⭐⭐ **MỘT LỚP CSS, KHÔNG PHẢI MỘT HỢP ĐỒNG MỚI.** `core/fight.js` gắn `.is-concealed` lên **vỏ bàn**
  của mình (`boardEls[side]`); *cái gì* là "dấu vết trả lời" thì **template tự khai** bằng vài dòng
  CSS. Thêm một hàm `conceal()` vào `ctl.attach` sẽ bắt bảy template sửa JS, và template nào quên là
  **im lặng hở bài** — đúng thứ luật tự-chọn-tham-gia của Đợt 143 sinh ra để chặn.
- ⚠️ **CHỦ NGỮ CỦA SELECTOR PHẢI LÀ CLASS CỦA TEMPLATE**, không phải class lõi: CSS template không
  bao giờ bị gỡ khỏi trang, nên `.is-concealed .aw-something` trần sẽ đi tô cả game khác.
- ⚠️ **CHỈ CHE, KHÔNG DỜI.** Cấm đụng `display`/`width`/`transform`/bố cục: bàn kia đang chơi ngay
  cạnh, một cú nhảy bố cục ở nửa màn hình này đập vào mắt còn to hơn chính đáp án bị lộ. Anagram vì
  thế dùng `color: transparent` chứ không `visibility`.
- ⚠️ **CHỈ TỪ 0,2s TRỞ LÊN** (thầy chốt): `conceal()` tự kiểm `waitBarMs >= WAIT_BAR_MIN_MS`. Ở 0,1s
  vòng đóng gần như tức thì, che rồi hiện lại chỉ là một cú nháy. **In turns tự miễn nhiễm** mà không
  cần điều kiện riêng (nó ghim cửa sổ về 0,1s, và hai bàn vốn cầm hai câu KHÁC nhau).
- ⚠️ Đặt ngay sau `roundDone[side] = true` trong `wordDone()` — điểm DUY NHẤT mọi kiểu kết thúc của
  một bàn đều đi qua.
- ⭐⭐ **Đợt 219 ĐỔI TUỔI THỌ CỦA LỚP CHE.** Trước: `revealBoards()` gỡ che ngay lúc vòng chốt. Nay:
  che **sống tới tận lúc SANG CÂU** (`advanceRound`, đặt trên cùng nên phủ cả vòng thường lẫn pick
  mode) hoặc **HẾT TRẬN** (`endMatch`). Thầy: *"đội làm trước cũng không cần hiện lại, chuyển thẳng
  sang câu sau cùng với đội chậm luôn"* — bản cũ để bàn nhanh **sáng bài rồi phơi ra suốt nhịp giữ
  2,1 giây**, mà với Anagram thì đó là cả từ, viết sẵn, nằm cạnh bàn đội kia.
  ⚠️ `revealBoards()` vẫn gọi `reveal()` như cũ — bàn vẫn ghi ✓/✗ vào DOM, chỉ là lớp che đang phủ
  lên; sang câu là `render()` vẽ lại từ đầu nên không có trạng thái nào phải gỡ.
  ⚠️ **Kèm theo đó, `boardMoved()` (thầy bấm ‹ ›) nay cũng phải `unconcealAll()`** — nó không đi qua
  `revealBoards()`, nên trước Đợt 219 nó **chưa bao giờ** gỡ che; lớp che sống lâu hơn thì lỗ đó cắn
  thật: sang câu mới với chữ vẫn tàng hình.
- ⛔⛔⛔ **`color: transparent` KHÔNG XOÁ ĐƯỢC `text-shadow` — bẫy Đợt 219, cắn thật ở Anagram.**
  Bóng chữ được vẽ theo **đúng hình chữ** và **độc lập với `color`**, nên "chữ trong suốt" vẫn để lại
  một chữ xám nhoè nằm nguyên chỗ cũ — trên tấm 86 inch là **đọc được**. Che bằng `color` mà quên
  `text-shadow` là **che một nửa**. Cùng họ: `-webkit-text-stroke`, `background-image` hình chữ,
  `::after { content }`, và mọi **ảnh SVG** (Anagram phải tắt riêng `.aw-anagram-revealmark` — dấu
  ✓/✗ to trong ô chỉ ra từng vị trí nào đúng, gần như là cả đáp án).
  ⭐ Bản sao bay (`.aw-anagram-flytile`) nằm ở `document.body`, **ngoài vỏ bàn**, nên lớp che không
  với tới — đã kiểm: chữ bay chỉ tồn tại TRƯỚC khi từ hoàn tất, mà `wordDone()` chỉ được báo SAU khi
  ô cuối đã điền, nên không có ca nào hở.
- 5 template đã khai (đo được cả 5 selector đều trúng phần tử thật): quiz `.aw-quiz-answers` ·
  anagram `.aw-anagram-rtile/-otile/-reveal` · type-the-answer `.aw-tta-answer-area` ·
  true-false `.aw-tf-buttons` · find-the-match `.aw-ftm-grid`. Crossword và Open the box **không cần**
  (chúng là `fightPick`, vốn bị niêm phong khỏi Time delay).

### ⭐⭐ SHOWDOWN — GIÀNH LẠI ĐỘI CỦA MÁY KHÁC, VÀ MÁY BỊ GIÀNH PHẢI DỪNG (Đợt 217)

- ⭐ **`releaseTeamClaim(teamId)`** — hàm ghi DUY NHẤT trong `core/showdown-setup.js` dám đụng hàng của
  trình duyệt khác. Nó xoá một **chỗ đặt gạch**, không xoá dữ liệu; trước đợt này chỗ đặt gạch chỉ mất
  theo **TTL 12 giờ**, nên một máy tắt giữa buổi khoá cứng đội đó tới sáng hôm sau.
- ⛔ **HAI BƯỚC, KHÔNG PHẢI MỘT**: dấu ✗ chỉ **nhả** đội ra, thầy bấm dấu tích mới **lấy**. Đúng câu
  thầy viết, và một cú chạm nhầm chỉ nhả ra chứ không kéo cả máy sang đội khác.
- ⚠️⚠️ **`.aw-sd-col.is-taken` THÔI DÙNG `opacity` VÀ `pointer-events:none` TRÊN CẢ CỘT.** `opacity`
  nhân xuống cả cây con và **không có đường lùi** — nhãn "Picked ✓" sẽ mờ theo, dấu ✗ cũng mờ theo.
  Nay độ mờ đắp lên `.aw-sd-colname` + `.aw-sd-colmembers`; cột vẫn trơ vì từng điều khiển đã
  `disabled` sẵn và cột bị lấy không được gắn `onclick`.
- ⚠️ Nhãn **"Picked ✓"** nằm TRONG cột, ghim đáy bằng `margin-top:auto` — `top:100%` (dưới mép ngoài
  thật) sẽ bị `.aw-sd-cols` cắt cụt hoặc đè lên hàng nút chân bảng.
- ⚠️⚠️ **MÁY BỊ GIÀNH: ĐIỀU KIỆN LÀ "CÓ NGƯỜI KHÁC ĐANG GIỮ", KHÔNG PHẢI "KHÔNG CÒN AI GIỮ".** Ranh
  giới này quyết định tính năng dùng được hay không: chỗ đặt gạch **không có** có thể chỉ nghĩa là hết
  TTL, là mạng lớp rớt, là bảng chưa từng publish — dừng ván giữa giờ vì mấy thứ đó tệ hơn hẳn cái nó
  chữa. `c.by !== me` mới là bằng chứng dương tính. (Có đối chứng ngược trong bench.)
- ⚠️ Bộ nghe **nhập ĐỘNG** `core/showdown-setup.js` từ `core/engine.js` và chỉ khi `sdCanPublish` —
  trang học sinh tuyệt đối không được tải file chạm Firestore (luật 2 của v0.9.0). Gỡ trong
  `cleanupAll()` cùng chỗ với `stopShowdownReview()`.
- ⛔ **Tấm chặn `.aw-sd-stolen` KHÔNG CÓ NÚT ĐÓNG** — thầy giao *"buộc dừng game, không cho tiếp tục"*.
  Nút duy nhất MỞ bảng Showdown chứ không gỡ tấm chặn; đường ra hợp lệ là chọn đội rồi Ready (Ready
  dựng lại ván nên tấm chặn tự mất). Nó phủ `inner` chứ **không** phủ hàng nút dưới khung — nút MODE
  phải còn bấm được, nếu không thì "chọn team để chơi lại" thành ngõ cụt. Lý do dừng mang tên riêng
  `"stolen"` để cú đóng bảng công cụ không thả đồng hồ chạy sau lưng nó.

### ⛔⛔⛔ SHOWDOWN — HAI CHỖ LÀM "RESET KHÔNG SẠCH" (Đợt 217)

Thầy: *"reset đội trong showdown vẫn chưa sạch, đôi khi reset rồi vẫn không build team được vì một số
bạn bị lưu giữ trong đội khác mà không thể xếp đội mới được"*. Hai lỗi khác nhau, cùng một triệu chứng.

1. ⛔⛔ **`roster = saved` trong `boot()` — GỐC RỄ, và trông rất vô hại.** Một dòng đặt danh sách lớp
   thành ĐÚNG những người đang nằm trong một cột nào đó. Hệ quả: ai **không** ở cột nào thì **không
   còn tồn tại trên màn hình** — không có trong hồ bơi để kéo vào, không có trong cột nào để nhấc ra.
   Ba đường sinh ra ca này, không đường nào hiếm: nhấc một bạn khỏi cột rồi đóng bảng · lớp được thêm
   học sinh sau khi đã chia đội · bảng cũ dựng lúc lớp còn thiếu người. **Nay GỘP** (`saved` đi trước
   vì thứ tự cột là thứ tự thầy đã sắp; danh sách hôm nay chỉ gộp khi `rosterClass === classId`).
2. ⛔ **`pool = []` trong `boot()`** — một giả định ("ai cũng đã được xếp rồi") thay cho một phép tính.
   Nay `pool = roster − những-người-đã-ở-cột`, đúng phép mà `toBuild()` (nhánh `keepIt`) vẫn dùng.
3. ⚠️ **TIẾNG VỌNG CỦA CHÍNH CÚ RESET.** `wipeSetup()` ghi một bảng RỖNG lên Firestore, và
   `subscribeSetup` của **chính màn vừa reset** nghe thấy nó vài trăm ms sau — lúc đó ta đã dựng xong
   bộ cột mới. Bộ nghe cũ không phân biệt "người khác reset" với "tiếng vọng của mình", nên nó **đè
   `setup.teams` về rỗng** rồi bắn ta ngược về màn chọn lớp với hồ bơi trống. Một CUỘC ĐUA — nên chỉ
   thỉnh thoảng cắn, đúng chữ *"đôi khi"* của thầy. Chốt bằng `justWipedUntil` (cửa sổ 8 giây, **có
   hạn** chứ không phải cờ bật mãi, nếu không một cú reset THẬT từ máy khác ngay sau đó sẽ bị nuốt).

### ⚠️⚠️ TÊN TRONG PHỄU KẾT QUẢ — `fitPodiumNames` KHÔNG ĐƯỢC ÂM THẦM BỎ CUỘC (Đợt 217)

Thuật toán *"thu nhỏ → viết tắt → không bao giờ cắt"* của Đợt 207 **đúng** (đo: 0/12 tên bị cắt ở cả ba
bề ngang). Thứ sai là **lúc nào nó được gọi**:

| Ca | Trước Đợt 217 |
|---|---|
| Gọi lúc bảng đang ẩn (chưa có bề ngang) | **3/12 tên bị cắt, font nguyên cỡ** ← đúng ảnh thầy gửi |
| Fit lúc rộng rồi khung hẹp lại | **1/12 bị cắt** |

- ⛔ Cả bảng vẽ bằng `cqw` ⇒ vùng chứa rộng 0 thì cỡ chữ tính ra **0** ⇒ `if (!base) return` **bỏ cuộc
  trong im lặng**. Nay `pass()` trả lời "có đo được không", và người gọi **thử lại**.
- ⛔⛔ **`ResizeObserver` KHÔNG ĐỦ MỘT MÌNH — nó ngủ cùng vòng dựng khung hình.** Đo tại chỗ: pane ẩn
  ⇒ **0 lần bắn, kể cả lần bắn đầu lúc bắt đầu quan sát**. Cùng họ với bẫy rAF. `setTimeout` thì vẫn
  chạy đúng nhịp ở chính hoàn cảnh đó, nên vòng thử lại **4 lần có đáy** (60/180/500/1200ms, tự dừng
  khi đo được hoặc khi bảng rời khỏi trang) là thứ duy nhất với tới được ca "dựng lúc còn ẩn".
- ⚠️ RO chỉ nghe **BỀ NGANG**: `pass()` đổi cỡ chữ ⇒ đổi chiều cao bảng ⇒ nghe cả hai chiều là vòng
  lặp tự nuôi. Và gọi lại `fitPodiumNames` trên cùng một gốc thì phải **ngắt** observer cũ
  (`root.__awFitRO`), không thì mỗi lần vẽ lại bảng là chồng thêm một observer sống mãi.
- ⭐ **Lưới cuối**: viết tắt rồi mà vẫn tràn thì đi tiếp xuống `NAME_HARD_MIN_RATIO` (0.40).
  `NAME_MIN_RATIO` là mức *"thà viết tắt còn hơn nhỏ thêm"*, **không phải** *"thà cắt còn hơn nhỏ thêm"*
  — mà trước đợt này nó bị dùng như cả hai.
- ⭐ Đáy phễu nới **46% → 52%** (thầy: *"giãn rộng hơn các ô ra một chút"*).

### ⭐⭐ CỔNG CHỜ NAY LÀ CỦA LÕI — NẠP TRƯỚC MỌI THỨ RỒI MỚI CHO BẤM PLAY (Đợt 122, 12/8/2026)

Thầy yêu cầu: *"chuẩn bị trước toàn bộ những gì cần thiết trước khi bấm START để chơi mượt, không trễ
dù chơi với tốc độ rất cao."* Cùng thanh % và nút PLAY của Đợt 108, nhưng nay engine chờ **4 việc song
song** cho **mọi template**, không riêng SPEAKING:

| # | Việc | Ai lo | Template phải khai gì |
|---|---|---|---|
| 1 | **Giọng đọc** từng từ | `collectVoiceIds()` + `preloadVoiceClips()` của `core/voice-clips.js` | không |
| 2 | **Âm thanh** mp3 | `whenAllPacksPrimed()` của `core/sfx.js` | không |
| 3 | **Ảnh nền** khai trong CSS | `cssImageUrls()` của `core/registry.js` (tự quét `url(...)`) | không |
| 3b | **Ảnh template tự dựng bằng JS** | `preloadImages` | **CÓ — xem dưới** |
| 4 | Việc riêng của template | `tpl.prepare` (hợp đồng Đợt 108, không đổi) | chỉ khi cần |

**`tpl.preloadImages`** = mảng URL tuyệt đối, khai ở cấp module rồi `.map(imgUrl)`. **Chỉ khai ảnh mà
JS tự dựng** (`el("img").src = ...`, `style.backgroundImage = ...`) — ảnh nằm trong file CSS của
template thì engine đã tự quét, khai lại chỉ tổ trùng. Hiện có 5 template khai: `flying-fruit` (14),
`whack-a-mole` (20), `maze-chase` (19), `gameshow` (5), `speaking-cards` (1 — ảnh nằm ở `./assets/`
chứ không phải `./img/`, quét CSS không thấy).

**Ba luật an toàn — đừng gỡ:**
- Thanh % chỉ hiện **sau 250ms**. Mọi thứ đã có cache thì PLAY ra ngay, không nháy thanh chớp tắt.
  (Đo thật: ván thứ 2 trở đi mở PLAY trong **21–26ms**, không hề thấy thanh.)
- Quá **12 giây** là mở PLAY, phần còn thiếu tải tiếp ở nền. Mạng lớp học chết không được khoá cứng
  nút chơi. (Đo thật với `prepare` treo vĩnh viễn: PLAY hiện ở **12,03 giây**.)
- **Mọi bước không bao giờ reject.** Thiếu tiếng còn hơn không chơi được.

⚠️ **Trọng số thanh %**: `prepare` của template = 12, giọng = 3, tiếng = 1, ảnh = 1 (chỉ tính bước
thực sự có việc). Nên với SPEAKING thì mô hình 240MB chiếm gần hết thanh — đúng ý đồ. Chữ chú thích
lấy theo báo cáo mới nhất, nên chữ của template (cụ thể hơn) sẽ đè lên chữ chung.

⚠️ **BẪY ĐÃ DÍNH LÚC BUILD — `CSSStyleRule.cssRules` LÀ "TRUTHY"**. Bản đầu của `collectUrls()` viết
`if (rule.cssRules) { đào tiếp; continue; }` để nhảy vào `@media`. Từ khi Chrome có **CSS Nesting**,
một luật CSS **thường** cũng có `.cssRules` (rỗng nhưng vẫn truthy) ⇒ hàm `continue` qua **sạch** mọi
luật và trả về danh sách rỗng — **im lặng, không lỗi gì**, chỉ là chẳng ảnh nào được nạp trước. Phải
xét **`.length`** và **không được `continue`** (luật lồng vẫn có khai báo của chính nó).

⚠️ Quét CSS đọc thẳng `document.styleSheets` nên **chỉ chạy khi CSS đã áp xong** — đó là lý do
`ensureTemplate()` phải `await loadCss()` trước. Khớp sheet theo href đầy đủ **và** theo tên file, vì
trang `templates/<x>/test.html` khai `<link>` bằng đường dẫn tương đối của riêng nó.

### Điểm tuỳ biến (points) — `ui.finish({score, scoreText})` (thêm ở Gameshow, 1/8/2026)

Mặc định điểm để xếp hạng = **số câu đúng** (`result.correct`) và bảng tổng kết/leaderboard hiện
"đúng/tổng". Nếu game của bạn tính điểm KHÁC (vd Gameshow: điểm theo tốc độ + thưởng bonus), truyền
thêm trong `ui.finish`:
- `score` (số): điểm số dùng để XẾP HẠNG (leaderboard đã sort theo `score` rồi thời gian).
- `scoreText` (chuỗi, vd `"1250"`): khi có, bảng tổng kết + hàng leaderboard hiện NGUYÊN chuỗi này
  thay cho "đúng/tổng".
Không truyền 2 trường này → hành vi y hệt cũ (score = số câu đúng). Cài đặt ở `core/scoring.js`
(`computeResult`/`rankCompare`), `core/leaderboard.js` (`addEntry` lưu `scoreText`), `core/engine.js`
(hiển thị). **Tương thích ngược tuyệt đối** — mọi game cũ không đổi.

### BẢNG TỔNG KẾT — Score / Total / Time hiện cái gì (Đợt 83, 7/8/2026)

Bảng tổng kết mặc định (`showSummary` trong `engine.js`) nay có **3 dòng số**:

| Dòng | Nội dung | Nguồn |
|---|---|---|
| **Score** (to) | `result.score` / `result.total` | điểm ĐÃ trừ phạt — đúng số leaderboard xếp hạng |
| **Time** (to) | `m:ss.d` + `"s"` | `fmtSecsParts(result.timeMs)` |
| **`Total: 9/10`** (nhỏ, xám, giữa) | `result.correct` / `result.total` | số câu đúng thuần, `.aw-sum-total` |

Hàng **Total chỉ hiện khi `score !== correct`** — tức khi điểm phạt thật sự kéo điểm lệch khỏi số câu
đúng. `pointsOff = 0` (mặc định mọi act) thì 2 số bằng nhau và hàng đó chỉ in lại phân số phía trên → ẩn.
`.aw-sum-stats` giữ `margin-bottom` GỐC, hàng Total tự kéo lên bằng `margin-top` âm — nhờ vậy ván không có
hàng Total giãn dòng y hệt trước Đợt 83.

⚠️ **`score` ≠ `correct`.** Trước Đợt 83 ô Score hiện `correct/total` (số câu ĐÚNG) trong khi leaderboard
xếp hạng theo `score` (đã trừ) → bật *Points off* là **2 chỗ nói 2 số khác nhau**. Nay cả hai đều đọc
`result.score`. Template **không** có điểm trừ thì không truyền `score`, `scoring.js` mặc định
`score = correct` → hiện y hệt cũ.

⚠️ **ĐỪNG truyền `scoreText` chỉ để khoe điểm đã trừ.** `scoreText` mang nghĩa **"điểm của tôi ở THANG
RIÊNG"** nên engine in số **TRƠ TRỌI, bỏ mẫu số**. Chỉ dùng khi mẫu số thật sự vô nghĩa (Gameshow: 1250
điểm tốc độ / 10 câu = vô lý). Quiz từng truyền `scoreText = String(pts)` khi bật Points off và **đã phải
gỡ ở Đợt 83** vì nó biến "4/10" thành "4". Điểm vẫn trên thang `total` → chỉ truyền `score`.

- Điểm ÂM ở bảng tổng kết: **giữ dấu trừ** + tô đỏ (class `is-neg` trên `.aw-sum-value`). Khác luật ô điểm
  lúc chơi (`ui.setScore`: bỏ dấu, chỉ dùng màu) — chỗ đó hẹp, chỉ vừa một con số; panel thì rộng.
- Template khai `tpl.renderSummary` (Running word, Running team) **không đi qua** thân bảng này → mọi điều
  trên KHÔNG áp dụng, template tự chịu trách nhiệm hiển thị.

### Thời gian hiển thị — `fmtSecsParts(ms)` (Đợt 83)

Trả `{ big: "2:15.", small: "4s" }`, ghép lại `"2:15.4s"`. **LUÔN có phần phút**, kể cả dưới 1 phút
(`"0:45.3s"`); giây 2 chữ số; phần lẻ 1 chữ số và **cắt** chứ không làm tròn. Dùng ở 3 nơi: ô Time bảng
tổng kết + cột Time của leaderboard local + của leaderboard online (học sinh).

⚠️ **Tính bằng SỐ NGUYÊN mili-giây.** Bản trước đổi sang giây thực rồi `Math.floor((s − whole) * 10)` —
số thực không giữ đúng phần lẻ nên **45300ms ra "45.2s"**, 59900ms ra "59.8s". Công thức đúng:
`tenth = Math.floor(ms/100) % 10`. Bẫy này áp cho **mọi** chỗ cắt phần lẻ của thời gian.

3 hàm định dạng giờ KHÁC trong app **vốn đã** đúng m:ss, đừng nhầm lẫn: `formatTime` (`utils.js`, đồng hồ
lúc chơi), `fmtClock` (Running word/team, đồng hồ đội), `fmtDuration` (`assignment-ui.js`, báo cáo thầy).

### START WITH MISTAKES — chơi lại đúng những từ vừa sai (Đợt 84, 7/8/2026)

Bảng kết quả có nút **"Start with mistakes"** ngay dưới "Start again": về màn READY của CÙNG game, tên
game thành **"QUIZ WITH MISTAKES"**, danh sách chỉ còn từ **sai hoặc bỏ trống**. Cài đặt ở
`core/mistakes.js` + `core/engine.js`. Về bộ đầy đủ: reload trang · đổi template rồi chọn lại ·
**Start again**.

**Template muốn có tính năng này phải khai ĐÚNG 2 THỨ:**

```js
  itemsKey: "questions",              // 1) tên mảng trong activity.content
  ...
  review.push({ ..., src: q })        // 2) object NGUỒN của câu đó
```

⭐ **Vì sao `src` là object chứ không phải chỉ số:** mọi template đều mở đầu bằng
`[...(activity.content?.X || [])]` — sao chép **NÔNG**, nên phần tử trong danh sách chơi **chính là
object** trong `activity.content`. Core chỉ việc `content[itemsKey].filter(it => bad.has(it))`, tức **lọc
lại mảng gốc** — câu hỏi giữ nguyên 4 đáp án/clue/acceptedAnswers, **không dựng lại gì**, và xáo câu hay
xáo đáp án cũng không ảnh hưởng.

⚠️ **Nếu template `.map()` ra object MỚI trước khi chơi thì phải LUỒN `src` qua bước đó.** Có 6 template
như vậy: quiz · gameshow · open-the-box (xáo đáp án) · anagram · unjumble (`prepareItem`) · balloon-pop
(chuẩn hoá). **Crossword luồn qua HAI bước** (`buildCrossword` map lần 1, rồi map lần 2 ra object đã đặt
vào lưới). Quên luồn = `r.src` là `undefined` → không câu nào lọt qua bộ lọc → nút không bao giờ hiện, mà
**0 lỗi console** (bẫy im lặng, y như bẫy `inlineTimerBar`+`hasLivesSlot` của Đợt 78).

- **"Sai hoặc chưa làm"** gói trong một phép thử: `!row.yourCorrect`.
- **Ngưỡng tối thiểu** khai ở bảng `MIN_ITEMS` trong `mistakes.js`, lấy đúng số từ editor của game:
  balloon-pop **5** · find-the-match **3** · crossword **2** · còn lại **2**. Thiếu thì toast đúng con số,
  ở nguyên bảng kết quả.
- **Không khai `itemsKey`** → engine không dựng nút, zero-diff. Đang cố ý bỏ: **whack-a-mole** (review ghi
  MỌI hàng `yourCorrect:false` — trò arcade, không xác định được câu sai; muốn có phải sửa lõi ghi điểm của
  chính nó), **speaking-cards** (`scorable:false`), **running-word/team** (`renderSummary` riêng).
- **Ván mistakes KHÔNG ghi leaderboard** và ẩn dòng hạng (`activity._mistakes`).
- Act tạm mang id **`mist_...`** + cờ `_mistakes` + `_mistakesBase` (act ĐẦY ĐỦ để Start again quay về —
  chơi bao nhiêu vòng vẫn trỏ về act đầu tiên).

⚠️ **`restart()` và `replayCurrent()` KHÁC NHAU, đừng dùng lẫn:**
- `restart()` = nút **Start again** → luôn về **bộ đầy đủ** (`_mistakesBase`).
- `replayCurrent()` = chơi lại **đúng cái đang có** (giữ bộ mistakes) → dùng cho **Options → Apply** và cho
  `__awordBridge.applyOptions` của myActivity. Trước khi tách, Apply gọi `restart()` nên thầy chỉ nhích cái
  đồng hồ là bộ từ đang luyện biến mất.

⚠️ **Act `mist_` là act TẠM, đừng để lọt vào thư viện.** Chỗ Apply trong `buildOptionsPanel` phải chặn
**cả hai** tiền tố `/^(conv|mist)_/` và quy options về act mẹ. Bản đầu chỉ chặn `"conv_"` → một act 3 từ
suýt bị lưu đè vào thư viện của thầy.

⚠️ **Ngữ nghĩa riêng của vài game:** True/false · maze-chase · open-the-box **hỏi lại câu sai đến khi
đúng**, nên chơi hết bài với tim vô hạn là **không còn câu sai nào** → nút không hiện. Chỉ khi hết tim/hết
giờ mới còn câu dang dở. Balloon-pop coi **mọi từ chưa lên tới đều là chưa làm** (`yourCorrect: i <
levelIndex`) nên ván mistakes gồm cả từ chưa từng xuất hiện.

### ⭐⭐ LUẬT OPT-IN CHO Ô OPTIONS DÙNG CHUNG (Đợt 143, 13/8/2026)

**Một ô Options dùng chung chỉ được HIỆN khi template KHAI BÁO là mình có đọc nó.**
Không khai = không hiện. Đây là luật, không phải quy ước.

Vì sao đổi: trước Đợt 143 cơ chế là **opt-OUT** — panel dựng ô cho mọi template, template nào không
muốn thì gắn cờ `hideXxx`. Đo lại cả 17 game thì cơ chế ấy **đã mục đúng như kiểu mục của opt-out**:

| Ô | Được dựng ở | Thật sự có game đọc | Chết ở |
|---|---|---|---|
| `autoSwitch` ("Auto next question") | 13 game | **0** | 13 |
| `shuffleAnswers` ("Shuffle answers") | 12 game | 3 | 9 |
| `lettersOnAnswers` ("Letters on answers") | 7 game | 2 | 5 |

**Lý do chọn opt-in, viết ra để đừng ai đảo ngược lại:** quên một cờ opt-OUT thì app **ship ra một nút
CHẾT** — thầy tích vào, không có gì xảy ra, không lỗi console, không dấu hiệu nào trên màn hình, và
chuyện đó sống được nhiều đợt. Quên một cờ opt-IN thì app **thiếu một ô thầy nhìn phát ra ngay**.
Hai kiểu hỏng không ngang nhau: **chọn kiểu hỏng nhìn thấy được.**

| Cờ opt-in | Ô nó bật | Game đang khai |
|---|---|---|
| `tpl.usesShuffleAnswers` | "Shuffle answers" | quiz · open-the-box · gameshow |
| `tpl.usesAutoSwitch` | "Auto next question" | quiz · anagram · unjumble · crossword |

⚠️ **Khai cờ là ký hợp đồng phải ĐỌC option đó thật.** `usesAutoSwitch` được giữ lại (thầy: "vẫn cần
tới nó trong tương lai") **kèm điều kiện là nối dây thật** — 4 game trên đều tự sang câu sau khi câu
hiện tại đã có kết quả. Đừng khai cờ cho game thứ 5 mà không viết phần xử lý.

⚠️ **Template thứ 18 khi thêm**: mặc định là **không có** hai ô trên. Muốn có thì khai — và viết code đọc.

### Cờ template ẩn nhóm Options không hợp lệ

- `tpl.reviewStyle:"stacked"` — (thêm 2/8/2026 cho Unjumble) đổi màn **Show answers** từ lưới 3 cột
  (câu hỏi | bài làm | đáp án) sang **danh sách xếp chồng**: mỗi câu 1–2 dòng FULL-WIDTH (số · câu · ✓/✗),
  câu sai hiện dòng bài-làm (đỏ ✗) rồi dòng đáp-án-đúng (xanh ✓). Dùng cho game câu DÀI (câu 3 cột bị co
  nhỏ tí xíu). Tương thích ngược tuyệt đối: template không đặt cờ giữ nguyên lưới 3 cột cũ. CSS của kiểu
  này nằm ở template (`.aw-rv-slist/.aw-rv-sitem/.aw-rv-sline`, xem `templates/unjumble/unjumble.css`).
- `tpl.renderSummary(panel, {result, restart, panelItem, session})` — (thêm 5/8/2026 cho Running word)
  hook opt-in trong `showSummary()`: nếu template khai hàm này, engine chỉ dựng TIÊU ĐỀ panel rồi giao
  toàn bộ phần thân (stats + dòng rank + hàng nút) cho template tự vẽ, `return` sớm. Không khai = giữ
  nguyên panel mặc định từng byte (zero-diff). Dùng khi cần bảng kết thúc hình dạng KHÁC HẲN (Running
  word: 2 nửa "tên đội / điểm X/total" vàng, chỉ chừa Start again). Template nhận sẵn `restart` +
  `panelItem(label, fn)` từ core; dữ liệu riêng thì tự stash ở biến cấp module trước khi gọi `ui.finish`
  (mount chỉ 1 act 1 lúc). CSS bảng nằm ở template — LƯU Ý panel ở backdrop NGOÀI khung `.aw-<tpl>-card`
  nên biến CSS `--*` scope theo card KHÔNG tới; dùng màu literal. Mẫu: `templates/running-word/running-word.js`.
- ⛔ `tpl.hideLettersOption` — **KHÔNG CÒN** (Đợt 143). Cả tuỳ chọn "Letters on answers" đã bị xoá
  khỏi app; Quiz + Open the box (2 game từng đọc nó) nay cố định "None".
- `tpl.hideTimerOption:true` — ẩn nhóm "Timer" (toàn ván) khi game TỰ QUẢN đồng hồ (vd Gameshow đếm
  ngược TỪNG CÂU; nếu để engine chạy đồng hồ toàn ván sẽ đá nhau). Nhớ đặt `options.timer="none"` cho
  game đó (sample + editor) để engine không dựng đồng hồ toàn ván. Có thể mượn `ui.topbarMid` (bật
  `tpl.inlineTimerBar:true`) để vẽ thanh đếm ngược riêng của game trên cùng hàng với điểm.
- `tpl.hidePointsOff:true` — (v0.9.28) ẩn nhóm **"Points off (wrong answer)"** CHUNG. Đặt cho game ĐÃ có
  điểm trừ RIÊNG (type-the-answer, unjumble, crossword, whack-a-mole) hoặc game điểm không theo mô hình
  "trừ mỗi câu sai" (gameshow — điểm theo tốc độ). Xem mục "Điểm trừ CHUNG" bên dưới.

## ⭐⭐ MENU PAUSE — mở ☰ Menu là TẠM DỪNG CẢ GAME (v0.9.65, Đợt 91, 8/8/2026)

Thầy chốt: bấm nút **☰ Menu** (góc dưới-trái TRONG khung game, KHÁC với 3 nút Options/Template/Style
NGOÀI khung) phải làm nền khung tối đi + nhoè nhẹ VÀ tạm dừng thật sự cả game (đồng hồ, âm thanh, mọi
chuyển động) — không chỉ che bằng hình. Đóng menu (bấm "Resume" hoặc bấm ra ngoài) thì mọi thứ chạy tiếp
đúng chỗ đã dừng, không nhảy cóc thời gian.

### 0. ⚠️⚠️ BẪY XẾP LỚP: ĐỪNG BỌC THANH CÔNG CỤ / PANEL VÀO PHẦN TỬ CÓ `transform` (Đợt 130)

`z-index` của bộ ba này là một hệ thống **PHẲNG, tính ở GỐC tài liệu**:
`.aw-tool-dim` **40** (con của `<body>`) · `.aw-below-center` **41** · `.aw-tool-panel` **42**.
Tấm che nằm dưới cụm nút và panel — nhờ đó vẫn bấm được chúng khi panel đang mở.

⚠️ Bọc cụm nút/panel vào một phần tử có **`transform`** (hoặc `filter`, `opacity < 1`,
`backdrop-filter`, `will-change`, `contain:paint`…) là **ĐẺ RA STACKING CONTEXT MỚI** ⇒ z-index 41/42
bị **nhốt bên trong** hộp đó; hộp cha thường là `z-index:auto` (xếp ngang mức 0) nên **tấm che 40 leo
lên TRÊN panel**. Panel vẫn VẼ ra bình thường (nhìn thấy rõ) nhưng **mọi cú chạm rơi vào tấm che**, mà
tấm che có `onclick = đóng panel` ⇒ **"bấm gì cũng không ăn, panel tự đóng"**.

Đã cắn thật ở Đợt 129→130: `.aw-fight-bottom` canh giữa dọc bằng `top:50%; transform:translateY(-50%)`.
Cách canh giữa AN TOÀN: phủ kín (`left/right/top/bottom: 0`) rồi `display:flex; align-items:center`.
**Cách soi nhanh khi nghi ngờ**: `document.elementFromPoint(tâm panel)` — ra `aw-tool-dim` là dính bẫy
này, ra phần tử trong panel là lành.

### 0-BIS. ⚠️⚠️ BẪY ANH EM: ACCORDION `max-height` THIẾU `overflow:hidden` = TẤM BẪY VÔ HÌNH ĂN CHUỘT (Đợt 137)

Cùng họ stacking-context với bẫy 0 ở trên — **bẫy thứ HAI cắn dự án trong 4 ngày**, nên đọc luôn cả 2.

Khuôn "đóng/mở mượt" hay dùng trong app này (`.aw-as-answers`, `.aw-anagram-pencontent`…):
```css
.khoi { max-height: 0; opacity: 0; transition: max-height .28s …, opacity .2s ease; }
.khoi.is-open { opacity: 1; }
```
Thiếu `overflow: hidden` là **HỎNG NGẦM**, và hỏng theo kiểu khó ngờ nhất:
1. `max-height:0` chỉ ép chiều cao **CÁI HỘP** về 0. **Ruột bên trong vẫn nằm nguyên vị trí cũ và vẫn
   ăn chuột** — mắt không thấy chỉ vì `opacity:0`.
2. Mà **`opacity` < 1 ĐẺ RA STACKING CONTEXT** ⇒ khối "đã ẩn" được vẽ ở **lớp TRÊN** nội dung thường
   của phần tử anh em ngay dưới nó (nội dung thường vẽ ở bước sớm hơn trong thứ tự vẽ CSS).

⇒ Kết quả: **một bản sao vô hình của nút/thanh trượt nằm đè khít lên nút/thanh trượt THẬT**, nuốt sạch
mọi cú bấm/kéo. Người dùng chỉ thấy "kéo không ăn", không có lỗi console, không có gì đỏ.

Đã cắn thật ở Đợt 134→137 (Anagram Options): thanh **Points off** và cả thanh **Lives** chết trong 3
tổ hợp mode khác nhau. Tệ hơn: cú kéo **vẫn ăn — nhưng ăn vào thanh TÀNG HÌNH**, tức âm thầm đổi một
cài đặt khác mà giáo viên không biết.

**LUẬT**: hễ dùng `max-height` để đóng/mở thì **`overflow: hidden` là BẮT BUỘC**, không phải tuỳ chọn.
Nên kèm luôn `pointer-events: none` (và `auto` ở `.is-open`) làm chốt chặn lớp 2 — miễn phí, và cứu
được cả trường hợp sau này ai đó đổi bố cục làm `overflow` mất tác dụng.

**Cách soi nhanh** (dùng chung với bẫy 0): `document.elementFromPoint()` tại **vài điểm dọc** phần tử
rồi so với chính phần tử đó — không trùng là có kẻ nằm đè. Nhanh và chắc hơn mọi suy luận đọc CSS.
**Mẹo đối chứng rẻ**: tiêm 1 thẻ `<style>` phủ `!important` để **tạm gỡ bản vá ngay trong trình duyệt**
rồi lặp lại đúng thao tác — chứng minh được "trước sai / sau đúng" mà không phải revert hay build lại.

### 1. `.aw-stage-dim` — CHỈ tối khung game, KHÁC `.aw-tool-dim`

`.aw-tool-dim` (Options/Template/Style) làm tối **toàn màn hình** kể cả thanh dưới khung (title +
Options/Template/Style + Edit/Assignment/Print). `.aw-stage-dim` (Menu) thì **CHỈ tối phần trong
`.aw-stage-inner`** (topbar + playarea + bottombar) — thanh dưới khung **CỐ Ý giữ nguyên độ sáng** (thầy
chốt: menu + tên bài + cụm nút vẫn phải đọc được/bấm được trong lúc game tạm dừng). Cài đặt:
`inner.append(stageDim)` trong `enterMenuPause()` (`core/engine.js`), z-index **7** (dưới `.aw-menu` z-index
8, để popup không bị chính lớp tối của nó che). Bấm ra ngoài đóng menu vẫn dùng `pointerdown` như cũ. Độ
đậm khớp Y HỆT `.aw-tool-dim` (`rgba(18,23,32,.5)` + `blur(3px)`) — thầy chốt sau khi thấy bản đầu
(`rgba(...,.32)` + `blur(2px)`) quá nhạt, không nhận ra trên máy thật dù `getComputedStyle` đo đúng.

⚠️⚠️ **BẪY THẬT ĐÃ CẮN (8/8/2026, v0.9.66) — thứ tự bắt buộc: PAUSE animation trước, TẠO `stageDim` sau.**
Bản đầu viết `stageDim = el(...); inner.append(stageDim); ...; stage.getAnimations({subtree:true})...` —
tưởng vô hại vì chỉ là đổi thứ tự vài dòng, nhưng **`stageDim` VỪA được thêm vào `stage` đã tự động bắt đầu
chạy animation `aw-fadein` của chính nó** (khai trong CSS, không cần JS gọi gì thêm), nên câu lệnh
`getAnimations({subtree:true})` ngay sau đó **BẮT LUÔN animation NÀY** (nó đang `playState:"running"`, vừa
mới bắt đầu) và `.pause()` nó **NGAY LẬP TỨC** — đóng băng chính lớp dim ở khung hình ĐẦU TIÊN (`opacity`
gần bằng 0). Hậu quả: đồng hồ dừng đúng (mọi thứ khác vẫn work), nhưng **dim/blur hoàn toàn vô hình** —
mà `getComputedStyle(dim)` vẫn báo `background`/`backdrop-filter` ĐÚNG giá trị đã khai (vì CSS rule không
sai, animation runtime mới sai) → dễ kết luận nhầm "chắc do quá nhạt" thay vì lỗi thật (đã tự đo `opacity`
riêng mới lộ ra `"0"`). **Sửa: gọi `stage.getAnimations()` + `.pause()` các animation TRƯỚC khi tạo/append
`stageDim`**, để dim's animation không bao giờ lọt vào danh sách bị bắt tạm dừng.
→ **LUẬT CHUNG cho bất kỳ overlay/animation MỚI nào thêm vào TRONG `.aw-stage` sau này**: nếu overlay đó tự
có animation vào-màn (CSS `animation` hay `element.animate()` gọi ngay lúc tạo), và có chỗ khác trong code
đang "bắt hết animation đang chạy trong stage" (như `enterMenuPause`), PHẢI tạo/append overlay đó SAU khi
đã bắt xong danh sách, không phải trước.

### 2. Những gì TỰ ĐỘNG dừng — không cần đụng gì ở template

`enterMenuPause()`/`exitMenuPause()` (`core/engine.js`) tự lo 4 việc, áp dụng cho **MỌI** template kể cả
game build sau này, không cần khai gì thêm:
1. **Đồng hồ chung của engine** (`ui.startTimer`) — `pauseClockForMenu()`/`resumeClockForMenu()` dịch
   `startedAt` tới bằng đúng thời gian đã tạm dừng, nên đồng hồ tiếp đúng số cũ chứ không nhảy.
2. **AudioContext dùng chung** (`core/sound.js` `context()`, dùng bởi crossword/running-word/running-team
   để tổng hợp tiếng) — `sound.pauseContext()`/`resumeContext()` gọi `ctx.suspend()/.resume()`.
> ⚠️ **Đóng Menu có HAI NGHĨA — Đợt 113 (11/8/2026).** `exitMenuPause()` chạy cho cả 2 tình huống:
> "Resume / bấm ra ngoài" (chơi tiếp) **và** `cleanupAll()` (Start again / Home / Change template — ván
> bị VỨT BỎ). Trước Đợt 113 nó xử lý y như nhau, nên bỏ ván cũng "khôi phục": âm mp3 đang tạm dừng của
> ván sắp chết được phát lại **chồng lên nhạc intro của ván mới** (đo thật: `blockgamerestart` +
> `blockgameintro1` cùng lúc). Nay đọc cờ `torndown`: bỏ ván thì `p.dropPaused()` (tua về 0 rồi quên đi)
> thay cho `p.resumeActive()`, đồng thời **không** chạy lại `pausedAnimations` và **không** gọi
> `tpl.onPause(false)` (cleanup() của template dọn ngay sau đó — đánh thức timer/nhạc lên trước chỉ tạo
> tiếng "bụp", không được lợi gì; đã xác nhận `gameshow.js cleanup()` tự gọi `musicStop()`).
> ⭐ **Ngoại lệ DUY NHẤT: `sound.resumeContext()` vẫn chạy trong CẢ HAI trường hợp** — AudioContext dùng
> chung sống lâu hơn ván chơi, để nó suspended thì ván SAU sẽ **câm tiếng tổng hợp** (Crossword /
> Running word / Running team).
>
3. **Mọi pack mp3** (`core/sfx.js createPack`, TẤT CẢ template) — mỗi pack có `pauseActive()`/
   `resumeActive()` MỚI: tạm dừng đúng những `<audio>` đang thật sự phát (kể cả nhạc nền loop), nhớ lại để
   phát tiếp đúng chỗ; phần tử đã dừng/xong từ trước không bị đụng. Engine gọi qua registry toàn cục
   `window.__awSfxPacks`.
4. **Mọi animation CSS/WAAPI đang chạy TRONG khung** — `stage.getAnimations({subtree:true})`, lọc
   `playState==="running"`, `.pause()` rồi nhớ lại để `.play()` khi đóng menu. Cái này che được cả
   `element.animate()` (bay điểm, shake, fade...) LẪN CSS `transition`/`@keyframes` (kể cả thanh đếm giờ
   riêng của Open the box, vốn là 1 CSS `transition` chạy `totalDur` giây).

⚠️ **Giới hạn đã biết của bước 4**: nếu một hiệu ứng dùng `element.animate()` + `setTimeout` dự phòng
(luật bắt buộc ở mục "Luật bắt buộc khi dùng `element.animate()`" phía trên) thì PAUSE animation không
dừng được cái `setTimeout` đó — nó vẫn đếm theo giờ thực và có thể bắn ĐÚNG LÚC animation đang bị đóng
băng. Chỉ ảnh hưởng tới đúng khung hình đang bay dở tại thời điểm bấm Menu (hiếm, vô hại về mặt điểm số/
dữ liệu — chỉ lệch hình một nhịp), KHÔNG sửa vì phải sửa mọi `setTimeout` lẻ tẻ trong toàn app.

### 3. `tpl.onPause(paused)` — hook TÙY CHỌN cho timer/nhạc RIÊNG của template

Game có `setInterval`/spawn timer riêng (KHÔNG đi qua đồng hồ chung ở mục 2.1) phải tự lo lấy — engine gọi
`tpl.onPause(true)` NGAY SAU 4 bước trên lúc mở Menu, và `tpl.onPause(false)` NGAY TRƯỚC KHI bỏ dim lúc
đóng — không khai hàm này thì template không đổi gì (an toàn tuyệt đối, giống mọi cờ opt-in khác).

**Bẫy scope**: các biến timer luôn nằm trong closure của `mount()` (mỗi lượt chơi một bộ mới), mà
`onPause` là hàm cấp TEMPLATE (không có closure đó). Cách chuẩn — DÙNG CHUNG Ở CẢ 7 GAME ĐÃ LÀM — là một
biến **module-level bridge** (giống hệt kiểu `rwEndData`/`rtEndData` đã dùng cho `renderSummary`, vì
"AWord chỉ mount 1 activity tại 1 thời điểm"):

```js
let xxPauseHandlers = null;   // module-level, NGOÀI registerTemplate({...})

const xxTemplate = {
  ...
  mount(root, activity, ui) {
    ...
    function pauseGame() { /* dừng timer/nhạc riêng của game này */ }
    function resumeGame() { /* chạy lại đúng chỗ */ }
    xxPauseHandlers = { pause: pauseGame, resume: resumeGame };
    return function cleanup() {
      xxPauseHandlers = null;   // BẮT BUỘC — kẻo lượt chơi sau đọc nhầm handler cũ đã cleanup
      ...
    };
  },
  onPause(paused) {
    if (!xxPauseHandlers) return;
    if (paused) xxPauseHandlers.pause(); else xxPauseHandlers.resume();
  }
};
```

**3 kiểu `pauseGame`/`resumeGame` đã dùng, chọn đúng kiểu theo cách timer của bạn tính giờ:**

1. **Đồng hồ đếm tới hạn tuyệt đối** (`deadline = performance.now() + N`, kiểu Gameshow `qDeadline`, Open
   the box `endAt`-tương-đương): `clearInterval` + ghi `pausedAt = performance.now()`; lúc resume
   `deadline += performance.now() - pausedAt` rồi `setInterval` lại — dịch hạn tới đúng bằng thời gian đã
   dừng. Xem `gameshow.js` (`tickCountdown`/`pauseGame`/`resumeGame`) và `whack-a-mole.js` (`tickClock`).
2. **Đồng hồ tính theo DELTA mỗi tick** (`now - last`, `last` reset mỗi lần chạy, kiểu Running team
   `mainTimer`/`qTimer`): KHÔNG cần dịch gì — `clearInterval` xong `setInterval` lại (hàm start tự bắt
   `last = performance.now()` mới) là đủ, vì số còn lại (`mainLeft`/`qLeft`) đứng yên suốt lúc dừng. Xem
   `running-team.js`. Maze chase (`moveTimer`/`enemyTimer`) còn đơn giản hơn nữa — không đếm ngược gì cả,
   chỉ là nhịp di chuyển cố định, nên `clearInterval`/`setInterval` lại y hệt, không cần biến `last`.
3. **Game ĐÃ SẴN có cờ pause riêng** (Running word: nút Pause/Resume của trọng tài, phím Esc,
   `togglePause()`): đừng viết cơ chế mới — gọi lại ĐÚNG state machine đó, chỉ thêm cờ `pausedByMenu` để
   phân biệt "Menu tự dừng" với "trọng tài tự dừng", tránh Menu đóng lại vô tình MỞ KHOÁ ván trọng tài đang
   cố ý tạm dừng tay. Xem `running-word.js` (`menuPause`/`menuResume`).

**Spawn timer kiểu `setTimeout` đệ quy** (KHÔNG đếm tới hạn, chỉ tự hẹn giờ lần kế): đừng cố giữ đúng thời
gian còn lại của lần hẹn dở — chỉ cần HUỶ lịch hẹn hiện tại lúc dừng (không cho spawn thêm gì trong lúc
dừng) rồi HẸN LẠI TỪ ĐẦU (gap ngẫu nhiên mới) lúc mở lại. Xem `whack-a-mole.js` (mole `spawnTimer`) và
`flying-fruit.js` (`spawnTimer`) — cả hai đều theo mẫu `if (spawnTimer) clearTimer(spawnTimer); ...
scheduleSpawn();`. Đủ để "không spawn gì trong lúc dừng", không đáng công theo dõi phần trăm gap còn lại.

⚠️ **Nhớ đặt bridge var = `null` trong `cleanup()`** (mọi mẫu trên đều làm) — thiếu bước này thì lượt chơi
MỚI (sau restart/đổi template) không có `mount()` chạy lại kịp lúc Menu mở ra giữa màn hình READY sẽ gọi
nhầm handler của lượt chơi TRƯỚC đã dọn dẹp (dù hiếm khi xảy ra vì Menu chỉ hiện khi đang chơi).

**7 game đã nối `onPause`** (game thứ 8 trở đi vẫn CHẠY ĐÚNG mà không cần hook này — chỉ là timer riêng
của nó tiếp tục chạy ẩn sau lớp tối, một khoảng lệch nhỏ không ảnh hưởng điểm/dữ liệu): Gameshow (đếm
ngược mỗi câu + nhạc nền `musicPause/musicResume` mới thêm ở `gs-sound.js`), Whack-a-mole (đồng hồ ván +
spawn mole), Maze chase (di chuyển người chơi + enemy), Open the box (đồng hồ mỗi câu — gọi lại
`runCountdown(timeLeft)` y hệt đường "refill rồi đợi ô tiếp theo" có sẵn), Running word (đồng hồ cờ vua,
tái dùng cơ chế Pause trọng tài), Running team (2 đồng hồ chính + mỗi câu), Flying fruit (spawn hoa quả).
**CHƯA nối** (game "lượt-một", không có vòng lặp thời gian thực riêng ngoài đồng hồ chung — Quiz, Anagram,
Find the match, Type the answer, True/false, Crossword, Unjumble, Balloon pop, Speaking cards): đã đúng
mà không cần hook, vì đồng hồ chung ở mục 2.1 đã đủ. Whack-a-mole KHÔNG có thêm gì cần dừng ngoài 2 cái
trên (mỗi ô/mole riêng tự hết hạn bằng timer trong `timers` Set dùng chung, chấp nhận trôi nhẹ).

### 4. ⚠️⚠️ BẪY "ĐỒNG HỒ MA" — dọn ván xong mà `closeMenu()` HỒI SINH đồng hồ (đã VÁ Đợt 112, 11/8/2026)

**Bẫy này do chính Menu pause ở trên đẻ ra, và nó ÂM THẦM suốt 3 ngày** (từ Đợt 91 đến Đợt 112) — thầy chỉ
phát hiện vì nghe tiếng "hết giờ" nổ giữa ván trong khi đồng hồ còn 0:28.

Cơ chế: `cleanupAll()` gọi `closeMenu()` → `exitMenuPause()` → `resumeClockForMenu()` → hàm này **tạo
`setInterval` MỚI**. Bản cũ chạy `stopTimer()` TRƯỚC `closeMenu()`, nên cái interval vừa sinh ra sau đó
**không ai tắt nữa**: ván đã chết nhưng đồng hồ của nó vẫn tick 500ms/lần vĩnh viễn, ghi vào `timerEl` của
DOM đã tháo (nên VÔ HÌNH — đó là lý do bug sống lâu vậy mà không ai thấy).

Chỉ đúng **một** đường kích hoạt: **☰ Menu → "Start again"** — vì nút đó nằm BÊN TRONG menu nên cơ chế
"bấm ra ngoài thì đóng menu" (`onMenuOutside`, nghe `pointerdown`) không kịp đóng menu trước. Mọi lối khác
(Options→Apply, Change template, Submit answers, nút Home) đều đã `closeMenu()` từ trước nên vô hại.

Hậu quả đo được (Quiz, đếm ngược 20s, Lives=Unlimited, restart ở giây 3,6):
| Mốc | Bản LỖI | Bản ĐÃ VÁ |
|---|---|---|
| ngay sau "Start again" | **1** đồng hồ ma còn sống | **0** |
| giây 16,1 (đồng hồ hiện **0:09**) | 🔊 `blockgametimeout` — **âm hết giờ GIẢ** | im lặng |
| giây 19,4 (đồng hồ hiện 0:05) | 🔊 `blockgametimeout` (thật) | 🔊 (thật) |
| giây 21,1 | 🔊 `blockgamesuccessful` — **fanfare GIẢ** | im lặng |
| bảng xếp hạng | **0 → 1 dòng ma** (`0/6, 20.2s`) | **0 dòng** |

Tầng nặng nhất: đồng hồ ma chạm 0 thì gọi `submitHandler?.()` → **ván cũ TỰ NỘP BÀI**. Ở chế độ giáo viên
là 1 dòng rác trong bảng xếp hạng (còn có cửa `answered > 0` chặn bớt); ở **chế độ học sinh (`session`)**
thì `ui.finish()` gọi thẳng `session.submit()` **không có cửa nào chặn** → đẩy một bài nộp GIẢ lên
Firestore trong khi em học sinh vẫn đang chơi ván mới. Mỗi lần bấm "Start again" lại chồng thêm 1 đồng hồ ma.

**Đã vá bằng 2 lớp** (`core/engine.js`, cố ý làm cả hai):
```js
let torndown = false;                       // cạnh `pausedClockAt`
function resumeClockForMenu() {
  ...
  if (torndown) return;                     // lớp 1: ván đang bị dọn thì CẤM dựng lại đồng hồ
  if (timerStarted && timerMode() !== "none") timerId = setInterval(tickTimer, 500);
}
function cleanupAll() { torndown = true; closeMenu(); stopTimer(); ... }   // lớp 2: đổi thứ tự
```

**LUẬT RÚT RA cho mọi lần sửa core sau này:** bất cứ hàm nào tạo `setInterval`/`setTimeout` mà **có thể bị
gọi từ trong đường dọn dẹp** (`cleanupAll` gọi `closeMenu` gọi `exitMenuPause`…) đều phải có cờ chặn kiểu
`torndown`. Đừng tin vào thứ tự lệnh trong `cleanupAll` — một hàm dọn dẹp gọi một hàm "khôi phục trạng
thái" là chuyện rất bình thường và rất dễ tái diễn.

### ⭐⭐ Đợt 114 — CHỐT `torndown` Ở 2 CHỖ NỮA, và LUẬT VIẾT `cleanup()` CHO MỌI TEMPLATE

Đợt 112 mới bịt 1 trong 3 cửa. Hai cửa còn lại (đã vá):

| Chỗ | Vì sao lọt |
|---|---|
| `startTimerNow()` | Template khai `manualTimerStart` gọi `ui.startTimer()` từ timer RIÊNG của nó (Unjumble: hết intro, 3,3s sau PLAY). Rời game trong khoảng đó → ván chết vẫn dựng được đồng hồ. **Đo thật:** bấm Home ở giây 1, giây 13,4 nghe `timesup.mp3` khi đang ở THƯ VIỆN. |
| `ui.finish()` | ⭐ **Chốt giá trị nhất của toàn dự án.** Nhiều template hẹn hoạt cảnh kết thúc bằng `setTimeout` TRẦN (0,3-2,9s) rồi gọi `finish()`; rời game trong khoảng đó = **1 dòng điểm ma vào bảng xếp hạng**, hoặc **`session.submit()` giả lên Firestore** ở chế độ học sinh. Một chốt này che cho CẢ 17 template và mọi template viết sau. |

**⚠️⚠️ LUẬT BẮT BUỘC KHI VIẾT `cleanup()` CHO TEMPLATE MỚI** (rút từ 9 template phải vá lại):

1. **Dòng ĐẦU TIÊN của `cleanup()` phải bật một cờ "mount đã chết"** — quy ước dự án đặt tên là `dead`.
   Không có cờ này thì mọi chốt `if (...) return` bạn viết trong callback đều **vô hiệu**, vì không ai bật.
2. **⚠️ Cờ "ván đã KẾT THÚC" ≠ cờ "mount đã CHẾT". PHẢI là 2 biến riêng.** Suýt hỏng thật ở Đợt 114:
   Whack-a-mole và Balloon pop có sẵn `ended`, nhưng `ended` được bật **NGAY TRƯỚC** màn đếm điểm cuối ván
   — dùng nó làm chốt sẽ **chặn luôn đường kết thúc bình thường**, game không bao giờ ra bảng tổng kết.
   `dead` chỉ được gán ĐÚNG MỘT LẦN, trong `cleanup()` (dễ kiểm: `grep -n "dead\s*=" file.js` phải ra 2
   dòng — 1 khai báo, 1 trong cleanup).
3. **Mọi `setTimeout` phải đi qua helper gom timer** (`later()` + một `Set`, xem `flying-fruit.js`,
   `whack-a-mole.js`, `running-team.js`). Bẫy thực tế: 3 game ĐÃ CÓ helper nhưng đúng những timer ở
   **đường kết thúc** lại viết trần — mà đó là chỗ nguy hiểm nhất vì nó dẫn thẳng tới `ui.finish()`.
4. **Vòng lặp `requestAnimationFrame` phải dừng bằng cờ `dead`**, không chỉ bằng cờ nội bộ của nó.
5. **`document.querySelector(".aw-top-score")` là TRUY VẤN SỐNG** — trên ván đã chết nó KHÔNG trả về
   `null` mà trúng đúng ô điểm của ván MỚI. Anagram / Unjumble / Type the answer từng ghi điểm ván cũ đè
   lên ván mới vì vậy. Hàm nào truy vấn kiểu này phải kiểm `dead` ở dòng đầu.
6. **Sau mỗi `await`, kiểm lại `dead` trước khi đụng vào bất cứ thứ gì** — promise không huỷ được.
   Nặng nhất từng gặp: `speaking.js` `await getUserMedia` — rời game lúc Chrome đang hỏi quyền thì
   **micro BẬT khi không còn game nào chạy**. Có tài nguyên phần cứng thì phải trả lại ngay
   (`stream.getTracks().forEach(t => t.stop())`).

**Mẹo tự kiểm cả 17 template một lượt** (dùng lại được): bọc `tpl.mount` để tráo `ui.finish` thành bản
đếm số lần gọi, đồng thời đếm listener `resize` và timer theo stack; rồi với mỗi game: chơi → làm 1 hành
động sinh hoạt cảnh → **bỏ ván sau ~120ms** → chờ 3,2s → tất cả các số phải bằng **0**. ⚠️ Nếu chỉ bỏ ván
lúc "yên tĩnh" thì 16/17 game trông sạch — lỗi chỉ lộ khi cắt ngang đúng hoạt cảnh cuối.

**Cách tự kiểm nhanh** (dùng lại được cho mọi nghi ngờ rò timer): đếm số `setInterval` do CHÍNH
`core/engine.js` tạo, lọc theo stack — sau khi rời ván phải về 0.
```js
window.__eng = new Set();
const si = window.setInterval, ci = window.clearInterval;
window.setInterval = function (fn, ms) {
  const id = si.apply(this, arguments);
  if (/core\/engine\.js/.test(new Error().stack || "")) window.__eng.add(id);
  return id;
};
window.clearInterval = function (id) { window.__eng.delete(id); return ci.apply(this, arguments); };
// đang chơi -> 1 · sau ☰ Menu > "Start again" -> PHẢI 0 · chơi ván mới -> 1 (không phải 2)
```

### Điểm trừ CHUNG "Points off" + màu điểm theo dấu (v0.9.28)

- **Option chung `activity.options.pointsOff`** (slider 0–5, mặc định **0 = tắt**) do `buildOptionsPanel`
  trong `engine.js` dựng, chỉ hiện khi `tpl.scorable !== false && !tpl.hidePointsOff`. Engine KHÔNG tự trừ
  điểm — **mỗi template phải TỰ đọc `options.pointsOff` và trừ** ở nhánh câu SAI (mẫu: `templates/quiz/quiz.js`
  `scoreNow()` = đúng − pointsOff×số-câu-sai). **BẮT BUỘC**: khi `pointsOff===0` phải zero-diff (trừ 0 = không
  đổi gì) để không phá hành vi cũ. Điểm ĐƯỢC PHÉP âm (không kẹp 0). Đưa điểm đã trừ vào `ui.finish({score})`.
- **`ui.setScore(n)` tô màu theo DẤU** (thầy chốt): dương = **XANH LÁ** (`--aw-ok`), âm = **ĐỎ** (`--aw-no`)
  **VÀ GIỮ dấu trừ** (từ 11/8/2026 — trước đó hiện `Math.abs`, bỏ hẳn dấu, chỉ đổi màu; thầy yêu cầu đổi
  lại vì chip trong game và bảng tổng kết cuối ván (`statBlock`, vốn CHƯA BAO GIỜ bỏ dấu) khi đó đọc khác
  nhau). Class `.is-pos`/`.is-neg` trên `.aw-top-score` (CSS trong `app.css`). Áp cho MỌI game — game cũ
  không trừ điểm vẫn dương nên vẫn xanh, không đổi gì.
  ⚠️ **Template nào tự dựng chip điểm riêng (không gọi `ui.setScore`)** — vd Type the answer/Crossword hiện
  dạng "✓ N/total" (`scoreHTML()`/`showScore()` riêng, đọc `.aw-top-score` trực tiếp) — **PHẢI tự áp dụng
  đúng luật này** (không `Math.abs`, số âm giữ dấu, class `-neg` tô đỏ) chứ engine không tự lo được cho
  chip tự dựng. Anagram/Unjumble đã đúng luật này từ trước (chưa từng `Math.abs`).
- ⚠️⚠️ **BẪY "SỐ ĐỔI MÀ MÀU KHÔNG ĐỔI" — bắt buộc đọc nếu viết hiệu ứng ĐẾM ĐIỂM (count-up/pulse)**
  (lỗi thật, thầy bắt được 11/8/2026 ở Anagram): SỐ và MÀU do CÙNG một hàm sơn ra (`ui.setScore`, hoặc
  `showScore()`/`scoreHTML()` riêng của template). Vòng lặp đếm điểm nào tự ghi thẳng
  `scoreEl.innerHTML = ...` mỗi khung sẽ **vẽ số MỚI nhưng để lại màu CŨ** — điểm rơi từ dương xuống âm
  hiện số âm mà vẫn XANH, tới tận lúc có ai đó gọi lại hàm sơn (ở Anagram là `render()`, chỉ chạy khi
  ĐỔI TỪ) mới đỏ. **LUẬT: mọi khung của vòng đếm phải đi qua đúng hàm sơn đó** (`ui.setScore(val)` hoặc
  `showScore(val)` của template), TUYỆT ĐỐI không ghi `innerHTML` tay trong vòng lặp. Làm đúng thì màu tự
  lật đúng ngay khung số đi qua mốc 0. Đã đúng: `anagram.js`/`unjumble.js` (`pulseScoreTo` → hàm sơn),
  `type-the-answer.js` (`pulseScoreTo` → `scoreHTML(val)` tính lại class mỗi khung).
- **Allow skip**: game có nút Next–Back tay (quiz/type-the-answer/anagram/unjumble) đọc `options.allowSkip`
  để gate `onNext` (chưa trả lời + tắt skip → `onNext=null` = nút mờ). quiz/type-the-answer mặc định TẮT
  (phải trả lời mới đi tiếp); anagram/unjumble mặc định BẬT (lịch sử). Checkbox đặt trong `buildExtraOptions`.

### ⭐⭐ TIME COST — trừ điểm mỗi CHU KỲ **TRỐNG** (Đợt 139 · thuật toán đổi ở Đợt 187 · rời Timer ở Đợt 214)

Thanh **Time cost** (0–100, 0 = Off) + ô **ngưỡng trống 1–5s** trong Options. Cứ mỗi giây học sinh
**không làm gì** (quá ngưỡng) là tổng điểm bị trừ chừng đó, kèm một số **`-N` đỏ bay từ ô điểm vào
đồng hồ** và **vòng đếm giảm điểm**. KHÔNG có âm thanh (thầy chốt: nó nổ mỗi giây, cả tiết học).

⭐⭐ **Đợt 214 (20/8/2026, thầy) — TIME COST KHÔNG CÒN PHỤ THUỘC Ô TIMER.** Trước đợt này
`timeCostPer()` trả **0** khi `timerMode()==="none"` ⇒ Timer=None là một **công tắc tắt NGẦM**: panel
vẫn cho kéo Time cost lên (đo trên thư viện thật: act lưu `timeCost:58` + `timer:"none"` — thầy đứng
lớp nhìn thời gian trôi mà không trừ đồng nào, trên MỌI máy vì dữ liệu act dùng chung, không số -N nào
bay). Thầy chốt: **thanh trượt tự quyết** — đã đặt là trừ, bất kể chế độ đồng hồ. Hai chỗ sửa:
`timeCostPer()` bỏ vế timer, và `startIdleWatch()` gọi **ngoài** nhánh `timerMode()!=="none"` trong
`startTimerNow()` (nó tự no-op khi thanh Off nên game không dùng vẫn không cấp phát gì).
⚠️ **Hiệu ứng khi KHÔNG có đồng hồ nhìn thấy**: phần tử ẩn bằng `visibility:hidden` vẫn đo ra rect
đầy đủ, nên guard `b.w > 0` cũ sẽ cho số -N **bay vào khoảng trống vô hình**. `flyTimeCost` nay kiểm
thêm `visibility !== "hidden"` của đích: đích ẩn (Single + Timer=None) ⇒ -N **đậu trên ô điểm rồi tan
tại chỗ** (cùng nhịp giữ, co nhẹ về .8); trong Fight đồng hồ dải giữa luôn hiện (đứng ở 00:00) nên vẫn
bay như thường.

**Đây KHÔNG phải thuế theo đồng hồ** — thầy đổi ý ngay trong phiên đầu: chỉ giây TRỐNG mới tính.
"Bấm chữ trước cách chữ sau 0,9s" ⇒ không mất gì.

**Chia việc (y hệt khuôn `pointsOff` ở trên)**: engine sở hữu đồng hồ + bộ đếm + hiệu ứng
(`core/engine.js` + `core/timecost.js`); **template sở hữu con số điểm** và tự trừ. Engine không bao
giờ tự bịa ra một điểm số của riêng nó.

Template tham gia bằng **1 cờ + 4 dòng**:
```js
timeCost: true,                       // thiếu cờ này thì thanh trượt KHÔNG hiện (15 game kia sạch trơn)
// trong mount():
scoreNow() { ...; return base - penalty - ui.timeCostTotal(); }   // (1) trừ ở ĐÚNG 1 nơi
ui.setScoreProvider(scoreNow);        // (2) vòng đếm giảm chạy tới con số THẬT, không tự làm toán
ui.setIdleGuard(() => ...);           // (3) true = HS KHÔNG THỂ thao tác lúc này ⇒ đừng tính trống
ui.noteActivity();                    // (4) gọi khi HS có TIẾN TRIỂN thật
ui.finish({ score: ... - ui.timeCostTotal() });                   // đưa vào điểm xếp hạng
```

⚠️ **`noteActivity()` chỉ dành cho TIẾN TRIỂN, không phải cho "có chạm"** — thầy chốt: chạm sai/bị từ
chối **không** reset. Ở mode "Letters with bonus" chạm sai không mất gì, nên nếu nó cũng reset thì HS
chỉ việc đập tay liên tục là vô hiệu hoá cả tính năng. Engine cố ý **KHÔNG** tự nghe
`pointerdown`/`keydown` toàn trang vì đúng lý do đó (và vì bàn tay đặt lên màn cảm ứng sẽ tự đánh thức).

⚠️ **`setIdleGuard` bắt buộc phải phủ "từ/câu ĐÃ XONG"**, không chỉ cờ animation của template. Anagram
giải xong một từ còn ~1,8–2,4s hoạt cảnh mà `busy` KHÔNG bật — thiếu vế `doneCheck` là mỗi từ tự ăn 2
nhịp trừ oan. Guard cũng phải phủ: đang phát giọng đọc, và (engine tự lo) ☰ Menu / panel đang mở.
Guard kẹt ON chỉ có nghĩa "không trừ" — hỏng về phía an toàn.

**Cách đếm**: `setInterval(idleTick, 100)` **chỉ sinh ra khi Time cost > 0**, cộng dồn `idleMs += dt`,
**vứt bỏ** dt của quãng bị guard (không dồn trả sau), rồi trừ khi `idleMs >= ngưỡng × (n+1)` bằng
`while` (tab bị bóp xung nhịp trả về dt vài giây một lần).
⭐⭐ **Đợt 187 (18/8/2026, thầy) — Ô "Idle" LÀ CẢ CHU KỲ, không phải chỉ ân huệ trước lần trừ ĐẦU.**
Công thức cũ `ngưỡng + n×1000` chỉ mua được lần trừ đầu, sau đó tính **mỗi GIÂY** ⇒ Idle 3s trừ ở
3s, 4s, 5s… Thầy chốt: "cứ mỗi 3s không thao tác thì mới trừ điểm 1 lần… 9s không thao tác thì trừ 3
lần điểm" ⇒ 3s, 6s, 9s. Đối chứng ngược đo thật (timeCost=10, Idle=3s): **9 giây ngồi im — code cũ
−70, code mới −30**. Hàm đổi tên `chargeIdleSecond` → `chargeIdlePeriod`, và chữ dưới thanh Options
đổi theo ô Idle ("per idle second" / "per idle 3s") — **tiền phạt nay nhẹ đi N lần ở mức Idle N**, nên
cái nhãn đó là thứ DUY NHẤT nói cho thầy biết chu kỳ đang là bao nhiêu.
⚠️ **Bẫy khi tự kiểm**: `flyTimeCost` đếm số bằng `requestAnimationFrame` ⇒ pane test bị ẩn thì **ô
điểm không vẽ lại**, nhìn y như "không trừ gì". Đo ở **Fight** mới thấy: số đội trên dải do
`paintScore()` ghi thẳng `textContent`, không qua rAF.
⚠️ Nó là **đồng hồ THỨ HAI** bên cạnh đồng hồ 500ms ⇒ phải chịu đúng kỷ luật Đợt 112/131: nó được dọn
trong **`stopTimer()`**, thứ mà mọi đường tháo ván đều đi qua. Node `-N` sống trên `document.body` nên
`cleanupAll()` phải quét `costNodes`.

⚠️⚠️ **FIGHT MODE — bẫy TRỪ 2 LẦN (lỗi thật, đo được: -40/giây khi thanh đặt 20).**
`scoreNow()` của template **đã** trừ time cost, mà `ui.setScore()` lại chuyển tiếp con số đó vào
`fight.ctl.onScore()`. Nếu trọng tài lưu thẳng con số ấy thì khoản trừ nằm trong `game[side]` **và**
trong `cost[side]` ⇒ trừ đôi. Luật: **`game[side]` phải là điểm CHƯA tính đồng hồ**
(`onScore` cộng ngược `+ cost[side]`), đồng hồ chỉ được áp đúng một chỗ là `totalOf()`.
Và time cost phải đi **kênh riêng `ctl.onTimeCost(side, total)`**, không đi qua `onScore`: đội đang bị
đóng băng (luật "đội chậm không được điểm") có mọi báo cáo điểm bị `holdFreeze()` huỷ **vĩnh viễn**,
sẽ nuốt luôn khoản trừ. `totalOf = game + bonus + freezeAdj − cost` (trừ NGOÀI phần bị ghim).

**Bố cục Options**: từ Đợt 140 Time cost chỉ là **một ô bình thường của lưới 2 cột** (`.aw-optc`),
ghép cạnh ô hẹp nào đứng bên nó. Template tự dựng points-off riêng (Anagram) nhận hàm dựng ô qua
`buildExtraOptions({ timeCostCell })` và tự đặt chỗ; template không dùng thì panel tự ghép (Quiz).

#### Đợt 143 — Time cost nay có ở **13 game**, và vì sao KHÔNG phải 17
Bật thêm 11 game: True/false · Find the match · Type the answer · Open the box · Maze chase ·
Whack-a-mole · Flying fruit · Balloon pop · Crossword · Unjumble · Speaking (Anagram + Quiz có từ Đợt 139).
**4 game KHÔNG có, mỗi game một lý do thật:**
- **Gameshow** — chấm điểm theo TỐC ĐỘ, có đồng hồ riêng từng câu (thầy chốt loại).
- **Speaking cards** — `scorable:false`, không có điểm nào để trừ.
- **Running team · Running word** — ⚠️ **KHÔNG THỂ**, không phải quên: cả hai đặt `hideTimerOption` +
  `options.timer:"none"` vì mỗi game **tự chạy 2 đồng hồ riêng**. (Hồi Đợt 143 còn thêm lý do kỹ thuật
  `timeCostPer()` trả 0 khi timer none — **Đợt 214 đã gỡ ràng buộc đó**, nên nay trở ngại chỉ còn là
  thiết kế: hai game này chưa từng nối `scoreNow`/`noteActivity`/idle guard với engine. Muốn có thì
  đi đủ 4 điểm nối bên dưới, không phải chỉ gắn cờ.)

#### ⚠️ Bật Time cost là **4 điểm nối**, không phải 1 cờ
1. `timeCost: true`
2. `ui.setScoreProvider(scoreNow)` — engine hỏi "điểm THẬT bây giờ là bao nhiêu".
3. `ui.setIdleGuard(fn)` — `true` = **học sinh KHÔNG THỂ thao tác lúc này**, cấm tính tiền.
4. `ui.noteActivity()` ở **mọi** điểm tiến độ.
Và **trừ `ui.timeCostTotal()` ở ĐÚNG MỘT chỗ** — cái chỗ duy nhất game quyết định điểm là bao nhiêu.
Trừ ở nhiều chỗ, hoặc trừ thẳng vào biến `score` của game, thì **lần vẽ điểm thường tiếp theo xoá sạch
khoản trừ** (và nếu trừ vào `score` thì hỏng cả tổng của chính game).

⭐ **`ui.setScorePainter(fn)` (MỚI, Đợt 143)** — game **tự vẽ ô điểm** thì phải khai. Crossword và
Type the answer ghi thẳng `"7 / 20"` vào `.aw-top-score` (tự tô màu theo dấu) chứ không gọi
`ui.setScore`; không khai thì vòng đếm giảm của Time cost **thay cả ô điểm bằng một con số trần** rồi
để nguyên như thế — đúng họ với bẫy "số đổi mà màu không đổi" ở trên, chỉ to tiếng hơn.

#### "Tiến độ" là gì thì MỖI GAME MỘT KHÁC — phần này phải nghĩ, không chép được
| Game | Cái gì reset đồng hồ trống | Vì sao |
|---|---|---|
| Crossword · Type the answer | **gõ từng chữ cái** | chấm mãi tới lúc Submit; đợi đến đó là tính tiền cả lúc HS đang làm bài |
| Maze chase | **bẻ lái** | không có nút trả lời — HS *lái* tới ô đáp án |
| Speaking | **chạm micro**, và **cấm tính tiền suốt lúc đang thu âm** | lúc HS làm việc nặng nhất mà engine không nhìn thấy gì |
| Unjumble | **nhấc một từ lên** | mode "On submit" không chấm gì cho tới khi bấm Submit |
| Balloon pop · Flying fruit · Whack-a-mole | **mỗi cú chạm, trúng hay trượt** | đi săn đáp án đúng không phải là ngồi không |

⚠️ **Chạm SAI vẫn phải reset** (luật Đợt 139, áp cho mọi game mới): chỉ reset khi đúng thì một tràng
đoán sai thành thà tính tiền — hoá ra đo may rủi chứ không đo sự chú ý.

### ⭐⭐ THANH KÉO: TỰ VẼ, ĐỪNG GIAO CHO `accent-color` (Đợt 143b, 13/8/2026)

**Cả app chỉ có ĐÚNG MỘT thanh kéo: `.aw-optc-slider`, do `core/options-panel.js` dựng.** (30 luật CSS
thanh kéo rải ở 10 file template đã xoá ở đợt này — không JS nào gán chúng từ Đợt 140.) Muốn đổi dáng
thanh kéo ở "mọi nơi" thì sửa đúng một chỗ: khối SLIDER trong `core/app.css`.

⚠️ **KHÔNG dùng `accent-color` một mình cho thanh kéo.** Nó nghĩa là **để trình duyệt vẽ cả cái thanh**,
mà **Chrome TỰ SUY màu phần chưa tô từ màu accent** theo luật riêng của nó. Đo trên panel thật (Đợt 143b):

| accent | nền phần chưa tô mà Chrome vẽ ra |
|---|---|
| đỏ `#ef4444` | xám nhạt |
| hổ phách `#f5a623` | **gần ĐEN** |
| xanh lá `#16a34a` | **gần ĐEN** |

Cùng một panel, cùng một markup, ba cái thanh trông khác nhau — và không có dòng CSS nào của mình gây ra.
**Cách đúng**: `appearance: none` (lấy quyền vẽ khỏi trình duyệt) + tự vẽ `::-webkit-slider-runnable-track`
bằng **một gradient** làm cả hai nửa, với 2 biến:
- `--aw-slider-accent` — màu (các lớp `.is-amber/.is-blue/.is-green` chỉ đổi biến này)
- `--aw-slider-fill` — phần trăm đã tô, do `mkSliderCell()` cập nhật mỗi lần giá trị đổi
Firefox có `::-moz-range-progress` nên ở đó track để phẳng, progress mang màu.
⚠️ Đặt `appearance:none` rồi thì **`accent-color` vô tác dụng** — đừng "khôi phục" nó, chỉ mang sự lệch
quay lại trên engine nào còn nghe.
⚠️ `appearance:none` cũng làm trình duyệt vẽ **khung chữ nhật đen** khi control có focus ⇒ phải tự cho
vòng focus lên **núm** (`:focus-visible::-webkit-slider-thumb`).
⚠️ **Không đọc được style của pseudo `::-webkit-slider-*` bằng `getComputedStyle`** (Chrome trả
`none`/`transparent`). Muốn nghiệm thì **NHÌN** — xem mục dưới.

---

### ⛔ `transform-origin` LÀ VỊ TRÍ, KHÔNG PHẢI TRANG TRÍ (cắn thật, Đợt 143 → vá 143b)

Đợt 143 thêm `transform-origin: bottom left` cho dấu tick của checkbox, ý là để nó "vẽ ra từ góc ô".
Nhưng `left`/`top` đặt một hộp **CHƯA XOAY**, rồi phép `rotate()` mới quay quanh cái origin được cho —
nên **đổi origin là đổi CHỖ ĐỨNG của hình sau khi xoay**. Dấu tick trôi xuống dưới-trái, một nửa nằm
ngoài ô xanh, trên màn hình đọc ra thành **cái nêm trắng khoét mất góc ô** chứ không còn là ✓. **Đã lên
live** trước khi ai nhận ra.

⚠️ **Vì sao phép kiểm của Đợt 143 KHÔNG bắt được**: nó đo `opacity` và `scale` — **cả hai đều đúng**.
Cái sai là **VỊ TRÍ**. Luật rút ra, áp cho mọi thứ dính `transform`:
- Đổi `transform-origin` / thêm `translate` vào một phần tử đã `rotate`/`scale` = **đổi vị trí**. Phải
  **NHÌN**, không nghiệm bằng số.
- Cần nhìn mà pane preview không compositing (`screenshot` báo "not displayed") thì **mở Chrome thật**
  (`mcp__claude-in-chrome__*`) rồi chụp — đó là cách Đợt 143b bắt được lỗi này.
- Muốn chụp cho rõ chi tiết nhỏ: `panel.style.transform = "scale(2.2)"` + `transformOrigin: "top left"`
  rồi chụp bình thường (phóng bằng `zoom` của công cụ hay `body.zoom` đều cho ảnh sai/nhoè).

---

### ⭐⭐ MỘT NHÀ DỰNG PANEL OPTIONS — `core/options-panel.js` (Đợt 143, 13/8/2026)

**Thân bảng Options do ĐÚNG MỘT hàm dựng: `buildOptionsBody(host, {tpl, draft, contentSwitch, fight})`.**
Hai nơi gọi nó:

| Nơi gọi | Phần nó tự lo |
|---|---|
| `core/engine.js` — panel trong game | draft · nút Apply · fight mode · ghi vào thư viện của thầy |
| `core/settings.js` — "Default activity options" | draft · Save vào localStorage (chỉ áp cho act MỚI) |

Vì sao gộp: trước Đợt 143, Settings có **form RIÊNG hình dạng quiz** — 1 `<select>` Timer, 1 `<select>`
Letters, 3 checkbox — **dùng cho cả 17 game**. Thầy đặt mặc định ở một giao diện rồi vào game gặp một
giao diện hoàn toàn khác, và **mọi option riêng của template (Anagram mode, Lives, Bonus x, Speed,
Punishment, Time cost…) không có đường nào đặt mặc định**. Hai giao diện **không thể giữ giống nhau
bằng kỷ luật** — chúng trôi khỏi nhau ngay lần ai đó thêm một option.

⚠️ **LUẬT CŨ VẪN NGUYÊN GIÁ TRỊ (Đợt 140): TEMPLATE KHÔNG BAO GIỜ THAO TÁC DOM CỦA PANEL.** Template
khai cờ, panel dựng. Hai template từng tự cắt DOM panel (whack-a-mole · speaking-cards) và cả hai
**hỏng im lặng** ngay khi markup đổi.
Từ Đợt 143 **cả 17 template đều dựng cùng một loại ô** (`mkCell`/`mkSeg`/`mkSliderCell`/`addCheck`) —
running-word là template cuối cùng chuyển sang, nên **cầu nối legacy `.aw-opt-group` của Đợt 140 đã
được gỡ** cùng toàn bộ CSS `.aw-opt-group/-label/-row/-slider/-slidval/-time/-cd/-hint/-2up/-cell/-idle`.
Thêm template mới mà lại append markup cũ thì **nay không còn gì đỡ nữa**.

**Thang điểm dùng chung**: `POINTS_MAX = 100`, `POINTS_STEP = 1` xuất từ file này. Template có
points-off riêng **import 2 hằng đó**, đừng chép số — chép là thanh trượt với chỗ đọc giá trị trôi khỏi nhau.

---

### ⭐⭐ ĐỔI THANG MỘT OPTION ĐÃ LƯU — `core/options-migrate.js` (Đợt 143)

Đổi ý nghĩa một con số **đã nằm trong act của thầy** là việc nguy hiểm nhất trong đợt này. Hai bẫy,
cả hai đều **im lặng**:

**1. Nhân hai lần.** Nhân lúc nạp thì lần nạp sau nhân tiếp: `-5 → -100 → -2000`. Chặn bằng
`act.optVer` — mỗi act quy đổi **đúng một lần trong đời**.
⚠️ **MỌI đường thoát sớm vẫn phải ĐÓNG DẤU.** Act chưa có `options` mà bỏ qua không đóng dấu thì hôm
sau thầy đặt một giá trị **MỚI theo thang mới**, lần nạp kế tiếp sẽ "quy đổi" nó như đồ cũ.

**2. Một ý nghĩa, HAI TÊN FIELD.** "Points off" ghi vào `pointsOff` ở phần lớn game, nhưng ghi vào
`minusAmount` ở **Crossword · Type the answer · Whack-a-mole** — trong khi **nhãn trên màn hình giống
hệt nhau**. Bản quy đổi chỉ đụng `pointsOff` sẽ để 3 game đó nhẹ đi 20 lần, không báo gì cả.
👉 Trước khi đổi thang bất cứ option nào: **grep theo GIÁ TRỊ và theo mọi TÊN FIELD, đừng tin cái nhãn.**

Cũng phải quy đổi `act.templateOptions[type]` (options nhớ theo từng template) — **theo type của CHÍNH
nó**, không theo type của act; nếu không thì cả một bộ giá trị thứ hai kẹt ở thang cũ, vô hình cho tới
lúc thầy đổi template.

Gọi ở **2 chỗ** (cả hai đều idempotent): `store.js` `readAll()` — cửa duy nhất mọi act thư viện đi qua,
nên bản quy đổi được lưu lại ở lần save kế tiếp; và `engine.js` `startGame()` — act mẫu, bundle import,
bản `conv_`/`mist_` **không bao giờ đi qua thư viện**.

---

### ⛔ BẪY: HAI `function` TRÙNG TÊN TRONG CÙNG MỘT SCOPE (cắn thật, Đợt 143)

Thêm `function scoreNow()` vào `crossword.js` mà **cuối file đã có một `function scoreNow()` khác**
(hàm chết, không ai gọi). JavaScript **không báo gì cả** — hai *function declaration* cùng tên thì
**cái khai SAU lặng lẽ thắng**. Kết quả: Crossword thành game duy nhất trong 13 game đưa cho engine
con số **chưa trừ Time cost**. Không lỗi console, không dấu hiệu nào trên màn hình.

**Bắt được bằng cách nào**: không phải bằng mắt, mà bằng cách **đo giá trị `setScoreProvider` thực sự
trả về** cho từng game (ép `ui.timeCostTotal()` trả 35 rồi xem provider có ra `-35` không) — 12 game
đúng, Crossword ra `0`.

**Luật rút ra:**
- Thêm một hàm vào file template dài (nhiều file ở đây trên 2000 dòng): **grep tên hàm đó trước khi khai**.
- Kiểm một thứ được "nối dây" thì phải đo **giá trị nó thật sự trả về**, đừng chỉ kiểm là mình có gọi
  hàm đăng ký hay không. Ở đây `setScoreProvider` **đã được gọi đúng** — cái sai nằm ở hàm nó truyền vào.
- Lệnh quét cả bộ (chạy lại sau mỗi đợt đụng nhiều template):
  ```
  grep -oE "^\s*function [A-Za-z_$][\w$]*" templates/*/*.js | sort | uniq -d
  ```

---

### ⭐⭐ OPTIONS PANEL v2 — MỘT LƯỚI, MỘT KHUÔN HÀNG (Đợt 140, 13/8/2026)

Thầy: *"bảng options rất rối, khó nhìn, không thẳng hàng, không ngăn nắp và không thẩm mỹ."*
Đo trước khi sửa (Anagram, mode "Bonus and minus", 1280×720) — **đây là bằng chứng, không phải cảm nhận**:

| Triệu chứng | Số đo |
|---|---|
| Mép trái | **4 đường**: nhãn 15 · slider 17 · checkbox 19 · radio 20 |
| 3 thanh trượt "giống nhau" | dài **212 / 208 / 220** px ⇒ 3 chip giá trị bắt đầu 3 chỗ |
| Bộ chỉnh số ▲▼ | **cao 69px** nằm trong hàng cao **12px**, ở 2 chỗ |
| Bề ngang bỏ phí | 6/9 hàng phí **30–76%** |
| Chiều cao | **667px** > **645px** chỗ cho phép ⇒ `.is-compact-opts` nén nhãn còn 9.5px |

**Cách chữa là CẤU TRÚC**: mỗi tuỳ chọn = **1 ô** của lưới 2 cột (`.aw-opt-grid`), mỗi ô đúng 2 phần
(dòng nhãn `.aw-optc-lab` · dòng điều khiển `.aw-optc-ctl`). Thẳng hàng đến từ **lưới**, không đến từ
việc từng điều khiển tình cờ chịu xếp bằng nhau.

**Kết quả đo lại cả 17 template** (cùng phép đo): trung bình **−36%** chiều cao · **0/17 phải cuộn** ·
**0/17 phải nén chữ** · fight mode Anagram (chỉ 471px chỗ trống) không cuộn ở cả 3 mode.

#### 4 hàm dựng engine truyền cho template

```js
buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck,
                    el, mkCheck, mkRadioChoice, timeCostCell })   // 4 tên cũ vẫn còn
```

| Hàm | Trả về / việc |
|---|---|
| `mkCell({label, sub, wide})` | `{cell, lab, ctl}` — ô trống để tự nhét điều khiển vào `ctl`. `wide:true` = chiếm cả 2 cột |
| `mkSeg([{value,label,title}], current, onPick)` | Segmented control thay cho một hàng radio |
| `mkSliderCell({label, sub, min, max, step, value, tone, fmt, offAt, onInput, wide})` | Cả ô: thanh trượt + chip giá trị. `tone`: `""`(đỏ)/`amber`/`blue`. `offAt` = giá trị nghĩa là "tắt" (chip xám) |
| `addCheck(label, checked, onChange, {title})` | Đẩy 1 ô tick vào **khối switch dùng chung** ở đáy panel |

`panel` bây giờ **chính là lưới**. Template cũ `append` `.aw-opt-group` vào đó vẫn chạy y như trước —
luật cầu tương thích `.aw-opt-grid > .aw-opt-group { grid-column: 1/-1 }` trong `app.css` cho nó
chiếm cả 2 cột. Giữ luật đó **chừng nào còn template chưa chuyển** (hiện còn **running-word**).

#### 5 luật BẮT BUỘC

1. ⛔ **TEMPLATE KHÔNG BAO GIỜ ĐƯỢC THAO TÁC LÊN DOM CỦA PANEL.** Muốn ẩn/đổi thứ do engine dựng thì
   **khai cờ**, engine sẽ không dựng ra ngay từ đầu. Cờ hiện có: `hideTimerOption` · `hideTimerNone`
   (mới) · `hideLettersOption` · `hideAutoSwitch` · `hideShuffleAnswers` · `hideShowAnswers` (mới) ·
   `hidePointsOff` · `shuffleLabel` (mới).
   ⚠️ Cờ `noAssignment` (Đợt 245) KHÔNG thuộc nhóm này — nó không ẩn thứ gì trong panel,
   mà chặn **nút Set assignment** ngoài khung. Xem mục riêng của nó ở trên.
   ⚠️ Còn `hideEndShowAnswers` (Đợt 245) **KHÔNG phải cờ template** mà là tuỳ chọn của
   **người gọi** `buildOptionsBody`: ô "Show answers at end" có nghĩa hay không phụ thuộc
   AI đang dựng bảng (form bài giao hay Options của act), không phụ thuộc đang là game nào.
   **Vì sao thành luật**: Đợt 140 phát hiện 2 template đang cắt DOM thật —
   `whack-a-mole.js` xoá nhóm có nhãn khớp `/auto switch/i` và xoá `input[name="aw-timer"][value=none]`;
   `speaking-cards.js` xoá nhóm nhãn `"End of game"`, xoá `.aw-opt-choice` chứa chữ "answer", và sửa
   **text node** để đổi tên "Shuffle question order". Cả 5 việc đó **hỏng IM LẶNG** ngay khi markup đổi
   (không lỗi console, chỉ là tuỳ chọn thầy đã bỏ bỗng hiện lại). speaking-cards còn phải gọi `prune()`
   **hai lần** (một lần ngay, một lần trong `requestAnimationFrame`) vì engine append "End of game"
   SAU khi hook của nó chạy — dấu hiệu rõ nhất cho thấy cách làm đó sai từ gốc.
2. **Chip giá trị rộng CỐ ĐỊNH 52px** (`.aw-optc-chip`, `flex: 0 0 52px`, canh phải). Đây chính là
   thứ làm các chip thành MỘT CỘT. Cho một ô cái chip rộng hơn (vd để in chữ "Unlimited" 84px) là
   **thanh trượt ô đó ngắn lại và cột gãy** → dùng `∞` / `Off`, đừng nới chip.
3. **`<input type=range>` phải có `margin: 0`.** Mặc định trình duyệt cho nó margin 2px — đúng một
   trong 4 mép trái lệch đo được ở trên.
4. **Đừng nhét thêm điều khiển vào dòng ĐIỀU KHIỂN của ô slider.** Đo thật lúc dựng bản vẽ: đặt ô
   "sau mấy giây" của Time cost cạnh thanh trượt làm thanh đó còn **78px** (các thanh khác 176) và
   đẩy chip lệch cột **160px**. Thứ phụ thì cho lên **dòng NHÃN** (`.aw-optc-lab .aw-hstep`
   `margin-left:auto`) — đó là cách Time cost đang làm.
5. **Ô ẩn theo mode thì `display:none`, đừng chỉ `max-height:0`.** Xem lại bài học Đợt 137 ở mục
   accordion: một khối "ẩn" mà vẫn được bố trí sẽ **ăn chuột**. Anagram gói 3 ô điểm phạt vào **một**
   wrapper có `overflow:hidden` để animate chiều cao, còn từng ô bên trong thì `display:none` —
   hai lớp bảo vệ, và lưới ngoài không bao giờ thấy một hàng mở dở.

⚠️ **Đo panel phải TẮT ANIMATION trước.** `.aw-tool-panel` mở bằng `aw-pop-cx` (scale .94→1); đo ngay
sau khi bấm sẽ bắt trúng khung giữa chừng — Đợt 140 đo ra 504×410 trong khi số thật là 560×456 (đúng
0,9 lần). Tiêm `*{transition:none!important;animation:none!important}` rồi mới đo.

⚠️ **`.aw-tool-panel.is-opts`** (chỉ panel Options) có **bề ngang khai sẵn 560px**. Hai cột `1fr`
không có bề ngang nội tại, nên dưới `width:max-content` của vỏ panel, lưới tự co còn **422px** (186px
mỗi cột — không đủ cho segmented 3 lựa chọn). Đừng gỡ dòng đó.

### Cầu đồng bộ myActivity — `window.__awordBridge` + marker (v0.9.28)

Khi chạy NHÚNG trong myActivity (2–4 bảng), pane 0 đổi Template/Options/Style phải lan sang bảng khác.
`engine.js startGame` lộ (vô hại lúc standalone):
- **`window.__awordBridge = { getState(), switchTemplate(type), applyOptions(opts), setTheme(id) }`** — các
  setter chạy đúng luồng nội bộ (doSwitchTemplate/restart/loadTheme) NHƯNG có cờ `awSyncMute` nên KHÔNG phát
  marker (chống dội).
- Phát **`console.log("MYACT:AW:<TAG>:<payload>")`** khi USER đổi: `TPL:<type>` (Change template) ·
  `OPT:<json options>` (Apply) · `STYLE:<themeId>` (đổi Style). myActivity bắt marker → gọi bridge trên bảng khác.
> ⚠️ Đừng đổi tên marker/method nếu không sửa cả `myActivity/src/renderer/js/browser.js` (`mirrorAwordState`).

### Chặn bàn phím ảo HĐH khi dùng bàn phím AWord (v0.9.28)

Template nào có **ô nhập THẬT** (`<input>`/`<textarea>`/contenteditable) đi kèm bàn phím `core/keyboard.js`
PHẢI đặt **`el.inputMode = "none"`** khi bàn phím AWord đang hiện → ẩn bàn phím ảo HĐH (Windows/Android/iOS),
KHÔNG chặn con trỏ nháy hay bàn phím vật lý; đổi lại `"text"` khi HS ẩn bàn phím AWord. Mẫu: `type-the-answer.js`
(theo cờ `keyboardVisible`). Crossword không cần vì ô là `<div>` (không input) → không phát sinh bàn phím ảo.

### PRINT — hệ thống in DÙNG CHUNG ở `core/print.js` (v0.7.1)

Print KHÔNG còn viết riêng cho từng template. Nút **Print** ngoài khung gọi `openPrintPopup(activity)`
(`core/print.js`) → hiện **popup chọn ĐỊNH DẠNG in**: Anagram / Crossword / Quiz / Unjumble. Định dạng
nào KHẢ DỤNG mới hiện icon (luật khả dụng theo `activity.type` + số câu):

- **Anagram** & **Quiz**: mọi template, mọi số câu.
- **Crossword**: 2..35 câu, mọi template TRỪ `type-the-answer` (renderer CHƯA build → hiện icon nhưng
  bấm chỉ báo "coming soon").
- **Unjumble**: chỉ `type-the-answer`, mọi số câu.

`core/print.js` chuẩn hoá activity thành danh sách item `{clue, answer, options}` rồi render định dạng
đã chọn ra 1 `.aw-print-sheet` (gắn làm anh em `#app`, `window.print()`, gỡ khi `afterprint` + setTimeout
dự phòng). Bản in **thuần thang xám** (in đen trắng đẹp), mặc định **A4** qua `@page` trong
`core/app.css`. In 2 mặt là lựa chọn trong hộp thoại máy in — web KHÔNG tự đặt được (popup có ghi chú).

**Hook cho template — `toPrintItems(activity)`** (tuỳ chọn, như `edit`): trả về mảng
`[{clue, answer, options?}]` để print biết cách đọc dữ liệu game của bạn. `clue` = đề/định nghĩa hiện
cho HS (Anagram/Quiz), `answer` = từ/câu đích (Anagram xáo chữ cái; Unjumble xáo từ), `options` = danh
sách lựa chọn nếu game có sẵn (Quiz). Không có hook → print dùng bộ đọc mặc định kiểu Quiz
(`content.questions[].answers[]`). Xem `templates/quiz/quiz.js` `toPrintItems` làm mẫu.

**Style in** (`.aw-print-*` + `.aw-pf-*`, chỉ trong `@media print`; popup chọn định dạng `.aw-print-pop-*`
hiện trên màn hình) nằm trong `core/app.css` — DÙNG CHUNG cho mọi template, không viết CSS in riêng.
Header (title + Name/Date) và footer (logo AWord) là `position:fixed` để LẶP trên mọi trang giấy; body
2 cột (`column-count`) có vạch phân cách nét đứt. Thêm định dạng in mới = thêm renderer + icon trong
`print.js`/`icons.js` (không đụng template).

### ⚠️⚠️ CSS của template Ở LẠI DOCUMENT VĨNH VIỄN — cấm luật TRẦN nhắm vào class của core

Từ v0.9.7, `ensureTemplate()` chèn stylesheet của template **MỘT LẦN và KHÔNG BAO GIỜ gỡ**. Nên một luật
trần kiểu `.aw-nav { display:none }` trong CSS template sẽ tiếp tục tác động lên **MỌI game mở sau đó**
trong cùng phiên. Đã cắn thật 2 lần:
- Open the box từng có `.aw-nav{display:none}` trần → **mở Open the box 1 lần là mất nút Back/Next ở mọi
  game còn lại tới khi tải lại trang** (đo 4/8/2026, sửa ở Đợt 61).
- Whack-a-mole (Đợt 57) đã tránh sẵn bẫy này và ghi chú trong CSS của nó.

→ **Khuôn chuẩn**: scope theo phần tử gốc của chính game đó, đang sống trong `.aw-playarea`:
```css
.aw-playarea:has(> .aw-<viet-tat>-<goc>) ~ .aw-bottombar .aw-navbtn { display: none; }
```
Ưu tiên ẩn `.aw-navbtn` (giữ `.aw-nav` để lưới 3 cột thanh dưới không vỡ); nếu buộc phải ẩn cả `.aw-nav`
thì nhớ ghim lại `.aw-tools { grid-column: 3 }` **cũng scope y hệt** (xem `open-the-box.css`).

## Class dùng chung sẵn có (dùng lại thay vì tự tạo mới)

Những class này **đã có style trong `core/app.css`** — nếu template của bạn cần hiệu ứng tương tự
(dấu ✓/✗ bay, khối chữ mờ dần, nút bấm chuẩn...), hãy dùng lại thay vì viết CSS riêng trùng lặp:

- `.aw-mark-fly` (+ `.is-cross` cho dấu sai lơ lửng lâu hơn) — dấu ✓/✗ to bay lên từ 1 phần tử
  `position: relative`.
- `.aw-tile-badge` — dấu ✓/✗ nhỏ đọng lại trên 1 phần tử.
- `.aw-btn`, `.aw-btn-primary`, `.aw-btn-big` — nút bấm chuẩn.
- `aw-fadein` (keyframe) — hiệu ứng fade đơn giản, dùng cho chuyển màn.

## Quy tắc đặt tên class riêng của template

Mọi class CSS của template PHẢI có tiền tố riêng để không đụng độ với template khác hay với core:
`.aw-<type>-...` (vd Quiz dùng `.aw-quiz-*`, Anagram nên dùng `.aw-anagram-*`). Xem chi tiết trong
`../templates/HUONG DAN TEMPLATE.md`.

## ⚠️ Luật bắt buộc khi dùng `element.animate()`

Đã kiểm chứng thực nghiệm: nếu tab trình duyệt bị ẩn/nền (`document.visibilityState === "hidden"` —
vd học sinh chuyển sang tab khác giữa chừng), `Element.animate().onfinish` **có thể không bao giờ
bắn**. Nhưng `setTimeout` vẫn chạy bình thường trong tình huống đó.

→ **Mọi chỗ dùng `.animate()` để rồi làm gì đó khi xong (xoá phần tử, chuyển màn, gỡ overlay...)
PHẢI có thêm một `setTimeout` dự phòng gọi cùng hành động đó**, có cờ chặn gọi 2 lần. Mẫu chuẩn
(xem `core/engine.js` phần PLAY overlay, hoặc `templates/quiz/quiz.js` hàm `fadeSwap`):

```js
let done = false;
const run = () => { if (done) return; done = true; /* hành động thật sự */ };
const anim = el.animate([...], { duration: 200 });
anim.onfinish = run;
setTimeout(run, 260);   // dự phòng: lớn hơn duration một chút, phòng tab bị ẩn/trì hoãn
```

Thiếu bước này → game có thể bị "kẹt" vĩnh viễn ở màn chuyển tiếp nếu học sinh lỡ chuyển tab.

## ⭐⭐ BẪY "SNAP KHỰC MỘT CÁI" — đổi animation giữa chừng làm phần tử nhảy về giá trị mặc định (Đợt 26, 7/8/2026)

Tìm ra + sửa ở 3 template cùng ngày (Open the box, Crossword, Flying fruit) sau khi thầy báo "ô số fade
không mượt, xuất hiện/biến mất khực một cái" — cùng MỘT cơ chế lỗi, khác biểu hiện. **Đọc mục này TRƯỚC khi
viết bất kỳ hiệu ứng entrance/exit/fade/pop nào có thể bị một thao tác của người chơi ngắt giữa chừng.**

**Cơ chế:** một CSS `@keyframes` **animation** (khác `transition`) LUÔN khởi động lại từ đúng khung hình `from`
(hay `0%`) của chính nó mỗi khi nó được (tái) áp dụng — không quan tâm phần tử đang ở giá trị nào lúc đó. Kèm
theo đó, nếu class đang giữ animation bị GỠ mà không có animation/rule nào khác giữ chỗ, phần tử **nhảy tức
thì** về giá trị mặc định thô (thường `opacity:1`, không transform) — dù đang ở giữa animation-delay (giữ
`opacity:0` nhờ `fill-mode:both`) hay giữa chừng chuyển động. Bình thường không ai để ý vì animation luôn được
để chạy hết tự nhiên — lỗi chỉ lộ ra khi **JS chủ động đổi/gỡ class đó ĐANG LÚC animation còn chạy dở**, mà
việc này rất dễ xảy ra bất cứ khi nào input KHÔNG bị khoá trong lúc hiệu ứng đang chạy (một cú chạm sớm, một
lượt gõ phím, một lần bấm tiếp theo thật nhanh).

**3 ca thật đã tìm + sửa** (xem chi tiết số đo ở `GHI CHU OPEN-THE-BOX.md` / `GHI CHU CROSSWORD.md` /
`GHI CHU FLYING-FRUIT.md` mục Đợt 26 của từng file):
- **Open the box** — chạm 1 ô lúc lưới còn đang nảy vào (`is-entrance`, so le tới 2,46s): gỡ class ngay lập
  tức làm mọi ô khác (kể cả ô chưa kịp hiện) nhảy về `opacity:1` trước khi fade ra mới bắt đầu.
- **Open the box** (ca 2) — chạm ô mới thật nhanh trong lúc lưới đang fade-in lại sau khi đóng câu hỏi trước
  (tính năng cố ý "mở khoá sớm ở 80%"): keyframe fade-out mới viết cứng `from{opacity:1}` ép lưới (thực tế
  đang ~0,7) nhảy sáng lên rồi mới mờ đi.
- **Crossword** — gõ chữ ĐẦU TIÊN ngay sau khi bấm "Andrew help": hàm vẽ lại (`refreshActiveCells()`) chạy ở
  MỌI lần gõ phím, xoá sạch class của mọi ô trong từ kể cả ô gợi ý chưa kịp hiện xong theo hiệu ứng so le.
- **Flying fruit** — chạm SAI đổi animation "lắc" sang animation "rung"; animation rung viết cứng góc bắt
  đầu 0°, quả đang lắc dở (tới ±6°) nhảy phắt về thẳng trước khi rung. Chỉ lộ khi bật option "Retry after
  incorrect answer" — mặc định tắt thì quả bị xoá khỏi DOM ngay trong cùng tick nên không kịp thấy.

**Cách phòng khi viết template MỚI — 2 lựa chọn, chọn 1 theo tình huống:**

**(A) Nếu dùng CSS `@keyframes` qua `classList.add/remove/toggle`** (cách hầu hết template cũ trong app này
làm cho hiệu ứng entrance/exit/pop/fade so le nhiều phần tử — rẻ, 1 rule cho cả nhóm): TRƯỚC khi gỡ/đổi class
đang giữ animation, nếu có khả năng animation đó CHƯA chạy xong (không bị khoá input, hoặc có khoá nhưng mở
sớm như kiểu "80%"), hãy đọc giá trị SỐNG THỰC TẾ của phần tử bằng `getComputedStyle(el).opacity` /
`.transform` NGAY LÚC ĐÓ, rồi một trong hai:
  - **Ghim làm inline style** trước khi gỡ class (gỡ class lúc đó chỉ là thao tác vô hình) — dùng khi phần tử
    sắp bị animation MỚI khác cấp (vd container) điều khiển tiếp, như Open the box ca 1 (ghim từng ô, rồi
    animation fade cấp LƯỚI nhân với giá trị đã ghim).
  - **Đưa vào biến CSS rồi cho khung `from`/`0%` của animation MỚI đọc biến đó** thay vì viết cứng số — dùng
    khi CHÍNH phần tử đó sẽ chạy tiếp animation mới, như Open the box ca 2 (`--otb-fade-from`) và Flying fruit
    (`--wrong-from`). Xem `open-the-box.js` hàm `animateOpen()` hoặc `flying-fruit.js` hàm `onTap()` làm mẫu.
  - Nếu class bị gỡ rồi GẮN LẠI (không đổi tên animation) trong CÙNG một tick đồng bộ — không có
    `getComputedStyle`/`offsetWidth`/paint xen giữa để ép reflow — trình duyệt gộp lại thành "không đổi gì"
    và animation cứ tiếp tục mượt, không cần đọc/ghim gì cả (mẫu: `crossword.js` `refreshActiveCells()`).
    Ngược lại, nếu MUỐN animation chạy lại từ đầu (vd `shakeCell()` cùng file), phải CHỦ ĐỘNG ép reflow
    (`void el.offsetWidth`) giữa lúc gỡ và gắn lại — không ép thì trình duyệt cũng gộp lại, không restart.

**(B) Nếu dùng Web Animations API (`el.animate()`)** — cách AN TOÀN HƠN theo mặc định cho hiệu ứng của MỘT
phần tử đơn lẻ có thể bị ngắt giữa chừng bởi thao tác tiếp theo (kéo-thả, trượt prompt, bay chữ...), vì mỗi
lời gọi tự mang khung hình riêng, không phụ thuộc stylesheet `from`. Nhưng vẫn phải tự tay nối tiếp cho mượt:
trước khi gọi `.animate()` MỚI đè lên animation CŨ trên cùng phần tử, gọi `oldAnim.commitStyles()` (ghi giá
trị đang animate vào inline style) rồi `oldAnim.cancel()` — xem `true-false.js`/`find-the-match.js` hàm
`haltPromptAnim()` làm mẫu chuẩn đã kiểm chứng. Thiếu bước `commitStyles()` thì `.cancel()` một mình vẫn làm
phần tử nhảy về giá trị TRƯỚC animation (không phải giá trị đang animate dở) — cùng họ lỗi (A) ở trên, chỉ
khác API.

**Khi nào KHÔNG cần lo:** nếu input bị khoá HẲN (disabled/pointer-events:none) suốt từ lúc animation bắt đầu
tới lúc nó tự chạy xong tự nhiên, không có đường nào để người chơi ngắt giữa chừng — không phải sửa gì (xem
`speaking-cards.js` `doShuffle()` khoá bằng cờ `busy`, hoặc `running-team.js` khoá bằng cờ `locked` suốt màn
đếm ngược). Cũng không cần lo nếu animation-đến-animation dùng CHUNG khung hình `from`/`to` với trạng thái
nghỉ của phần tử (vd `is-shake` của Running word: `0%,100%` trùng khớp transform nghỉ, nên bị ngắt giữa chừng
chỉ cắt ngắn dao động chứ không tạo trạng thái lạ mắt nào).

## Theme (bảng màu)

Mọi theme là 1 file CSS trong `core/themes/`, định nghĩa biến `--aw-*` trên class `.theme-<tên>`
(xem `classic.css` làm mẫu). Engine tự gắn `theme-<tên>` vào khung dựa trên `activity.theme`.
Template KHÔNG được hard-code màu — luôn dùng biến theme (`var(--aw-text)`, `var(--aw-tile-0)`...)
để đổi giao diện không phải sửa code game.

**Đăng ký theme mới**: thêm 1 dòng vào `core/themes/manifest.js` (mảng `THEMES`) — CSS được
**nạp động** (lazy-load qua `loadTheme(id)`) khi người dùng chọn ở panel Style, KHÔNG cần thêm
`<link>` vào từng `test.html`/`index.html`. Hiện có 3 theme: `classic`, `classroom`, `beach`.

## Thanh công cụ NGOÀI khung (dưới `.aw-stage`, trong `.aw-below`) — v0.4.0

Mỗi lần `startGame()` chạy, engine tự dựng 1 thanh 3 cột dưới khung (bố cục grid `1fr auto 1fr`,
xem `core/engine.js`):

- **Trái** (`.aw-below-left`) — tên lesson + hướng dẫn.
- **Giữa** (`.aw-below-center`) — 3 nút vuông bo tròn **Options / Template / Style**. Bấm 1 nút:
  nút đó "tỏa hào quang" (`.is-active`), 1 panel hiện NGAY DƯỚI, CĂN GIỮA cụm 3 nút
  (`.aw-tool-panel`, định vị bằng `position:absolute; left:50%; transform:translateX(-50%)` so
  với `.aw-below-center` — cha PHẢI có `position:relative`), toàn màn hình (kể cả khung game) bị
  làm mờ + blur nhẹ (`.aw-tool-dim`, `position:fixed;inset:0`). Bấm ra ngoài (hoặc bấm đúng nút đang
  mở) đóng panel. Chỉ 1 panel mở tại 1 thời điểm.
  - **Options**: điều khiển THẬT, ghi trực tiếp vào `activity.options` (Timer none/up/down+mm:ss,
    Shuffle question/answer order, Show answers cuối game, Letters on answers A-B-C). Timer/Shuffle
    áp dụng cho lượt chơi TIẾP (Start again); Letters on answers áp dụng ngay từ câu tiếp theo
    (không cần restart) vì không ảnh hưởng logic chấm. **Bộ tùy chọn này hiện được thiết kế THEO
    HÌNH DẠNG DỮ LIỆU CỦA QUIZ** (câu hỏi/đáp án) — template khác (Anagram...) có thể cần bộ tùy
    chọn khác; đây là giới hạn đã biết, chưa tổng quát hóa theo template.
  - **Template**: liệt kê `ALL_TEMPLATES` (hard-code trong engine.js) — chỉ game đã build (khớp
    `activity.type`) hiện "current", còn lại mờ + toast "coming soon". Cập nhật danh sách này khi có
    template mới build xong.
  - **Style**: liệt kê theme từ `THEMES` manifest, bấm đổi **NGAY LẬP TỨC** (không cần restart) —
    gọi `loadTheme(id)` rồi swap class `theme-<id>` trên `.aw-stage`; `activity.theme` được cập nhật
    nên "Start again" giữ đúng theme đã chọn.
- **Phải** (`.aw-below-right`) — 3 icon nhỏ **Edit / Set assignment / Print**, hiện tại chỉ là
  toast "coming soon" (chuẩn bị hạ tầng cho các tính năng sẽ làm sau — editor, giao bài, in).

### ⛔ THANH CÔNG CỤ DƯỚI KHUNG ACT — TRẠNG THÁI THẬT (cập nhật Đợt 228)

> Ba đoạn mô tả ngay bên trên là của thời đầu dự án và **đã lạc hậu**. Hình dạng thật hôm nay:

| Cụm | Nút | Cử chỉ |
|---|---|---|
| GIỮA `.aw-below-center` | **Options** | **chạm** = bảng Options · **NHẤN GIỮ 420ms** = popup *"Edit content?"* (Đợt 194) |
| | **Mode** | **chạm** = picker Fight · Showdown · Running · IPA (Đợt 158 + 190 + 191) · **NHẤN GIỮ** = popup *"Go home?"* (Đợt 195). Chỗ không có mode nào thì nút **được dựng thẳng thành nút Home** (`title="Home"`) — **nút này KHÔNG BAO GIỜ được vắng mặt nữa** |
| PHẢI `.aw-below-right` | **Set assignment · Print** | chạm thường. **KHÔNG còn Edit** (Đợt 194) và **KHÔNG còn Home** (Đợt 195). Cả cụm bị `visibility:hidden` trong trận Fight |

⭐⭐ **Đợt 228 — KHÔNG CÒN NÚT "TEMPLATE" HAY "STYLE" RIÊNG NGOÀI THANH NÀY NỮA.** Cả hai dọn vào
BÊN TRONG popup Options, trên nút "current template" nằm cạnh Apply (`.aw-opt-tplbtn`,
`core/engine.js`'s `buildOptionsPanel`): **chạm** = mở bảng chọn game NGAY TRONG Options (swap
`bodyHost`, không phải panel riêng) · **NHẤN GIỮ** = mở Style, cũng swap vào `bodyHost`. Chỗ không
đổi được template (IPA mode / Running word / Running team, cờ `templateSwitchAvailable`) thì nút
này **được dựng thẳng thành nút Style** (chạm thường, không có gì để giữ) — vẫn đúng bảo đảm cũ
"Style không bao giờ biến mất ở bất kỳ chế độ nào", chỉ dời chỗ đứng.

**BA LUẬT BẮT BUỘC BIẾT TRƯỚC KHI ĐỤNG VÀO THANH NÀY (và nút template bên trong Options):**

1. ⛔ **Ẩn nút Options bằng CSS `[title="Options"]` là ẩn CẢ Edit content theo.** Chưa stylesheet nào
   làm vậy; ai định ẩn thì phải biết hậu quả. (Bẫy `[title="Template"]` của 3 stylesheet cũ —
   `app.css .mode-ipa` · `running-word.css` · `running-team.css` — đã hết tồn tại từ Đợt 228: không
   còn nút toolbar nào mang title đó để ẩn nhầm nữa, cả 3 chỗ đã dọn sạch dòng CSS chết đó.)
   ⚠️ Nút "current template" MỚI (bên trong Options) không dùng cơ chế `openToolPanelFor`/tool-panel
   riêng nên KHÔNG ẩn được qua `[title="…"]` kiểu này nữa — nó chỉ tồn tại/biến mất theo đúng 1 điều
   kiện duy nhất: `templateSwitchAvailable` bên trong `buildOptionsPanel`. Đổi hành vi ẩn/hiện của nó
   thì sửa NGAY tại điều kiện đó, đừng đi tìm một rule CSS không còn ở đâu cả.

2. ⛔ **Builder panel phải là `function` CÓ TÊN khai một lần, cấm arrow tạo mới mỗi lần gọi.**
   `mountPanelContent()` và `capPanelHeight()` nhận diện panel **BẰNG DANH TÍNH HÀM**
   (`buildContent === buildOptionsPanel`) để gắn class chiều rộng (`is-opts`, `is-sd`) và bật
   `is-compact-opts`. Một closure mới mỗi lần sẽ **lặng lẽ không bao giờ khớp** — popup nhỏ có thể bị
   kéo rộng bằng cả lưới Options mà không ai hiểu vì sao. (`is-tpl` đã xoá ở Đợt 228 cùng với panel
   Template độc lập — không còn `buildContent` nào khác cần phân biệt khỏi `buildOptionsPanel` ở tầng
   `.aw-tool-panel` nữa; bên trong MỘT panel Options, việc chọn thân nào hiện — options thường / bảng
   chọn template / Style — là việc của `bodyView` + `swapContents(bodyHost, …)`, không đụng gì tới
   `mountPanelContent()`/`is-opts` cả.)

3. ⛔ **Nút mang hai việc THUỘC THANH NGOÀI thì phải `openToolPanelFor()`, KHÔNG được
   `openToolPanel()`.** Gọi `openToolPanel` với chính nút đang sáng thì nó **ĐÓNG** panel — đó là cử
   chỉ "bấm lại nút đang mở". Nhấn giữ lúc panel kia đang mở sẽ chỉ tắt panel chứ không hiện panel thứ
   hai. Đợt 192 đã cắn. ⚠️ Nút "current template" bên TRONG Options (Đợt 228) là một câu chuyện khác —
   nó không mở/đóng `.aw-tool-panel` nào cả, chỉ swap thân của panel Options đang mở sẵn, nên tự viết
   `showBody(view)` với dòng chặn `if (bodyView === view) return;` ở đầu, không có sẵn hàm chung nào
   lo hộ việc này ở tầng trong.

4. ⛔ **Cử chỉ KHÔNG được tự ý rời ván đang chạy.** Nhấn giữ chỉ MỞ CÂU HỎI; phải bấm xác nhận mới rời
   game. Và phần lớn cử chỉ chỉ dành cho **single mode** — `canEditNow()` trong `engine.js` là mẫu:
   nó hỏi `!session && !fight && !showdownPick && !playMode` **ngay lúc ngón tay nhấc lên**, chứ không
   quyết một lần lúc dựng nút.

5. ⛔ **Thứ gì GHI vào thư viện thì hỏi act SỞ HỮU, đừng hỏi act đang chiếm màn hình.** Luật này đã
   phải viết ra ba lần (Đợt 145 → 181 → 194). Trong `core/engine.js` có **đúng một** hình dạng để hỏi,
   dùng chung cho Options ▸ Apply và cho Edit content:
   ```js
   const realAct = activity._mistakes ? (activity._mistakesBase || originAct) : libAct;
   const target  = realAct._converted ? originAct : realAct;   // conv_… / mist_… không bao giờ được lưu
   ```
   Bỏ qua nó thì `saveActivity` **đẻ một act rác ra gốc thư viện** còn act thật không đổi một chữ —
   im lặng tuyệt đối. Đó đúng là lỗi nút Edit đã mang suốt từ khi có "Change template".

6. ⛔ **Nút nào MANG THÊM VIỆC thì nút đó không được phép VẮNG MẶT.** Trước khi treo một tính năng
   lên cuối một cử chỉ, hỏi đúng một câu: *"nút này có bao giờ không được dựng không?"* `modeBtn` từng
   là `null` trong im lặng khi act không có mode nào để chọn (**5/17 template** không khai `fightMode`
   lẫn `showdownMode`: maze chase · whack-a-mole · speaking cards · hai game Running), và menu ☰ trong
   game không có đường ra ⇒ treo Home lên đó là để act thành **căn phòng không cửa**. Cách vá chuẩn của
   dự án, đã dùng hai lần (Đợt 192 và Đợt 195): chỗ không có việc chính thì **dựng thẳng nút thành việc
   phụ**, đổi luôn icon và `title`.

7. ⛔ **Đường ra khỏi một TRẬN không được đi bằng `cleanupAll()` của một bàn.** Một trận là **hai**
   engine; `cleanupAll` chỉ thuộc closure của bàn gọi nó, nên đồng hồ 500ms của bàn kia sẽ tiếp tục
   chạy sau lưng thư viện — ghost-clock Đợt 131, thiệt hại **nghe thấy chứ không nhìn thấy**. Chỉ
   `fight.ctl` mới nắm cleanup của cả hai bàn: `exitFight()` (về bàn đơn) hoặc `exitToLibrary()`
   (thẳng ra thư viện, Đợt 195).

### ⛔⛔ HỢP ĐỒNG XẾP LỚP CỦA HỆ POPUP — bẫy ĐẮT NHẤT, đã cắn **2 lần trong 2 ngày, ở 2 dự án**

> **Luật một câu: KHÔNG được đặt `transform` (hay 8 họ hàng của nó) lên `.aw-below`, hay lên BẤT KỲ
> tổ tiên nào của `.aw-below-center`.** Kể cả từ app khác nhúng AWord vào và bơm CSS từ bên ngoài.

Hệ popup dùng một hệ z-index **PHẲNG, tính ở GỐC tài liệu** — 3 con số này chỉ so được với nhau khi
cả 3 cùng nằm ở gốc:

| Phần tử | z-index | Nằm ở đâu |
|---|---|---|
| `.aw-tool-dim` (tấm che tối cả màn) | **40** | con **TRỰC TIẾP của `body`** |
| `.aw-below-center` (cụm nút công cụ) | **41** | trong `.aw-below` |
| `.aw-tool-panel` (panel Options/Template/Style/MODE) | **42** | append vào `.aw-below-center` |

Bọc 41 + 42 vào một phần tử **đẻ ra STACKING CONTEXT** mà phần tử đó lại `z-index:auto` ⇒ cả 41 lẫn
42 bị **nhốt** vào trong, hộp đó xếp ở mức 0 tại gốc ⇒ **tấm che (40) leo lên TRÊN cả panel lẫn cụm
nút**.

**9 thuộc tính đẻ stacking context** (thuộc lòng): `transform` · `filter` · `backdrop-filter` ·
`opacity` < 1 · `perspective` · `mix-blend-mode` · `isolation` · `will-change` · `contain`.

**⚠️ Vì sao lớp lỗi này khó đọc ra**: panel **VẪN ĐƯỢC VẼ RA** — người dùng nhìn thấy nó (chỉ hơi mờ
đi vì nằm dưới lớp che + blur) nên báo lỗi sẽ là *"panel hiện ra nhưng bấm không được gì"* hoặc
*"panel bị che"*, chứ không ai nghĩ tới xếp lớp. Tệ hơn: tấm che có `onclick = đóng panel`, nên chạm
vào panel là **panel tự đóng** — rất giống triệu chứng "panel hỏng"/"nút hỏng".

**Cách bắt trong 5 giây** (đừng đọc code suông, sẽ không thấy):
```js
const p = document.querySelector('.aw-tool-panel'), r = p.getBoundingClientRect();
document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
// ra `aw-tool-dim`  => DÍNH BẪY.   ra ruột panel (vd `aw-opt-label`) => bình thường.
```
Rồi **đối chứng ngược**: tiêm `transform:none` cho phần tử nghi ngờ, đo lại; bật lại, đo lại. Lật
đúng 2 chiều mới được kết luận.

**⚠️ Khi tự dò, phải tìm stacking context NGOÀI CÙNG (gần `body` nhất), KHÔNG phải cái gần panel
nhất.** `.aw-below-center` có z 41 ≥ 40 nên nhìn riêng nó thì **lúc nào cũng tưởng an toàn**, trong
khi con số 41 đó đã bị `.aw-below` bên ngoài nhốt lại và hoàn toàn vô nghĩa. Đây là chỗ viết sai
nhiều nhất khi làm công cụ tự kiểm.

**2 lần đã cắn**:
1. **AWord Đợt 130 (12/8/2026)** — gộp hàng nút vào hàng ô điểm Fight Mode, căn giữa bằng
   `transform: translateY(-50%)` trên `.aw-fight-bottom .aw-below`. Chữa: bỏ `transform`, phủ kín
   hàng rồi căn giữa bằng flex (`inset:0` + `align-items:center`). Cảnh báo đã ghi tại chỗ trong
   `core/app.css`.
2. **myActivity v1.9.2 → lộ ra ở v2.0.0 (13/8/2026)** — app nhúng bơm
   `@media(...){.aw-below{transform:scale(...)}}` để thu nhỏ hàng dưới khi chia 2–5 cột. Hỏng **mọi
   panel ở mọi chế độ nhiều cột**. Chữa: xoá hẳn (xem mục dưới) + dựng lưới an toàn chạy thật.

**⚠️⚠️ BÀI HỌC LỚN NHẤT — vì sao lần 2 vẫn xảy ra dù lần 1 đã ghi cảnh báo**: cảnh báo lần 1 nằm
trong `core/app.css` của AWord, còn người gây lỗi lần 2 đang ngồi ở **DỰ ÁN KHÁC** (myActivity) và
không có lý do gì để mở file đó ra đọc. **Ghi chú không bảo vệ được ranh giới giữa 2 dự án — chỉ có
code chạy thật mới bảo vệ được.** Vì vậy myActivity nay mang sẵn một **lưới an toàn** trong CSS/JS mà
nó bơm vào AWord (`guardToolPanel()` trong `wordwall.js`): chỉ chạy khi có panel mở, tự tìm stacking
context ngoài cùng, **tự vá** (nâng tổ tiên đó lên trên tấm che, GIỮ nguyên `transform` của người ta)
và bắn `MYACT:AW:SCTRAP:<class>|<lý do>` ra console. **Thấy dòng đó trong log nghĩa là có người vừa
đặt lại thứ cấm — lưới chỉ đỡ tạm, phải vào sửa tận gốc.**

**⚠️ ĐỪNG tự thu nhỏ `.aw-below` từ bên ngoài.** AWord **đã tự co thật theo viewport** rồi (Đợt 132):
`.aw-toolbtn` dùng `width: clamp(30px, 5.5vw, 44px)` (sàn 30px là **cỡ chạm tối thiểu có chủ đích**,
không phải số đẹp) và `.aw-below-title` dùng `font-size: clamp(13px, 3.6vw, 24px)`. Đo thật ở
960/640/480/384px: **tràn ngang 0px, khoảng cách giữa các cột luôn +10px, không bao giờ đè nhau**.
Thêm một tầng thu nhỏ nữa ở ngoài là **2 cơ chế đánh nhau** — và cơ chế ngoài còn yếu hơn: nó chỉ co
bằng HÌNH ẢNH, trong khi việc chữ bị cắt (`ellipsis`) được quyết định ở bước **BỐ CỤC**, xảy ra
TRƯỚC khi thu nhỏ hình ảnh, nên `scale(0.55)` vẫn cắt đúng ngần ấy chữ, chỉ là cắt ở cỡ nhỏ hơn.

**Luật rút ra dùng cho MỌI APP SAU NÀY** (không riêng AWord):
1. Hệ `z-index` nhiều tầng chỉ đúng khi **mọi phần tử trong hệ cùng nằm trong MỘT stacking context**.
   Đã thiết kế một hệ như vậy thì phải **ghi rõ ra** và coi nó là **hợp đồng**, không phải chi tiết vặt.
2. Trước khi thêm `transform`/`filter`/`opacity` để "căn giữa" hay "thu nhỏ", tự hỏi: **bên trong
   phần tử này có thứ gì cần nổi lên trên một tấm phủ toàn màn không?** Nếu có → đổi cách làm
   (flex/grid để căn giữa; `clamp()`/thay đổi kích thước thật để thu nhỏ).
3. **Overlay toàn màn (`position:fixed; inset:0`) nên là con TRỰC TIẾP của `body`** — và mọi thứ cần
   nổi trên nó cũng vậy, hoặc phải nằm trong một tổ tiên có z-index cao hơn overlay.
4. App **nhúng** app khác (bơm CSS/JS vào trang khách) thì mọi luật bố cục của app khách đều có thể
   bị đè — **mỗi bố cục MỚI của app khách phải được rà lại**, và nên cài **lưới kiểm tra chạy thật**
   thay vì tin vào ghi chú (xem `myActivity/BAN GIAO.md` bẫy 8b + 8c).
5. Lỗi loại này **chỉ lộ ra khi ĐO** (`elementFromPoint`, `getComputedStyle`), đọc code suông không
   thấy. Và **luôn làm đối chứng ngược** trước khi kết luận đã tìm đúng thủ phạm.

**Bẫy khi dùng CSS Grid `1fr auto 1fr` để căn giữa 1 cụm**: nếu 2 cột `1fr` hai bên có nội dung
với **min-content khác nhau nhiều** (vd 1 bên là tiêu đề dài, bên kia là vài icon nhỏ), cụm giữa sẽ
**lệch tâm** dù cả hai đều "1fr" — vì mặc định `min-width:auto` của grid item buộc track phải to ít
nhất bằng nội dung dài nhất. Luôn thêm `min-width: 0` cho 2 cột 1fr khi 1 bên có thể chứa text dài
(kèm `overflow:hidden` + `text-overflow:ellipsis` trên phần tử con để không vỡ layout). Áp dụng
tương tự nếu bạn tự thêm bố cục grid 3 cột nào khác trong template.

**Trang chủ (`main.js`) dùng `buildStage()` trực tiếp** (không qua `startGame()`) để vẽ màn splash
"▶ Play" — nó PHẢI bọc nội dung của mình trong 1 `<div class="aw-below-left">` trước khi append vào
`below`, nếu không nội dung sẽ bị grid 3 cột dàn ra sai cột (đã từng vỡ, xem `GHI CHU DU AN.md` v0.4.0).

### ⚠️⚠️ LỖI HAY GẶP NHẤT: popup "hiện 1 nơi rồi nhảy về vị trí đúng"

**Triệu chứng**: một phần tử nổi (popover, toast/thông báo chữ, dấu ✓/✗ nhỏ, panel...) khi xuất hiện
lóe lên ở SAI vị trí (thường lệch sang phải/xuống dưới) rồi mới "giật" về đúng chỗ.

**Nguyên nhân DUY NHẤT của lớp lỗi này**: phần tử được ĐỊNH VỊ bằng `transform` (điển hình
`left:50%; transform:translateX(-50%)` để căn giữa ngang, hoặc `top:50%;transform:translateY(-50%)`),
NHƯNG lại gán 1 `animation`/keyframe cũng ĐỘNG VÀO `transform` (vd keyframe kết thúc ở `transform:none`
hoặc `transform: scale(1)` — KHÔNG chứa phần `translateX(-50%)`). Trong suốt thời gian animation chạy,
giá trị `transform` từ keyframe THAY THẾ hoàn toàn giá trị định vị → phần tử mất phần bù -50% → lệch;
khi animation xong mới trả về `transform` gốc → "giật" về giữa. Người dùng thấy rõ cú giật này.

**2 cách sửa** (chọn 1):
1. Animation **CHỈ động `opacity`** (như `aw-fadein`) — đơn giản nhất, phần `transform` định vị giữ
   nguyên suốt. Dùng cho popover panel lớn (xem `.aw-tool-panel`).
2. Nếu vẫn muốn hiệu ứng "pop" (phóng to/trượt nhẹ): dùng keyframe **BAKE luôn phần định vị vào MỌI
   mốc keyframe** — xem `@keyframes aw-pop-cx` (giữ `translateX(-50%)` ở cả from lẫn to) dùng cho
   `.aw-toast` và `.aw-tile-badge`; hoặc `aw-fly`/`aw-fly-cross` (bake `translate(-50%,...)` cho dấu
   ✓/✗ bay). TUYỆT ĐỐI không dùng keyframe dùng chung (`aw-pop`, `aw-gc-pop`) — chúng kết thúc ở
   `transform:none`/`scale()` không có phần -50%.

**CÁCH RÀ SOÁT trước khi xong việc** (làm mỗi khi thêm phần tử nổi mới): tìm mọi phần tử vừa định vị
bằng transform vừa có animation, kiểm từng cái:
```
grep -nE "transform:.*translate|animation:" <file.css>
```
Với mỗi phần tử có `transform: translate...(-50%...)` → xem `animation:` của nó dùng keyframe nào →
mở keyframe đó → NẾU keyframe có động `transform` mà KHÔNG chứa `translate...(-50%)` ở mọi mốc → LỖI,
phải sửa theo 1 trong 2 cách trên. (Ngoại lệ an toàn: phần tử căn giữa bằng **flexbox**
`align-items/justify-content:center` — như `.aw-panel`, `.aw-gc-text` — thì animation scale/transform
KHÔNG gây lỗi, vì flex mới là thứ định vị, không phải transform.)

Đã gặp & sửa lớp lỗi này 2 đợt: v0.4.0 (popover Options/Template/Style), v0.4.1 (toast + tile-badge).

### Fade-out khi đóng: instant vs animate — tùy tình huống

Khi ĐÓNG 1 phần tử nổi (popover, panel...), cân nhắc 2 kiểu:
- **Đóng thật sự** (bấm ra ngoài, bấm nút đang mở để tắt) → nên **fade opacity** (`animate()` +
  `setTimeout` dự phòng theo luật animate() ở trên) rồi mới xoá khỏi DOM, cho mượt.
- **Đóng để MỞ CÁI KHÁC ngay lập tức** (vd chuyển từ panel Options sang panel Template) → nên
  **xoá NGAY LẬP TỨC, không fade** — vì panel mới đã tự fade-in đè lên, fade-out cái cũ chỉ làm
  chậm cảm giác chuyển đổi mà người dùng không kịp thấy. Xem `closeToolPanel(fade)` trong
  `core/engine.js` làm mẫu (tham số `fade` true/false tùy tình huống gọi).

### Panel có nhiều lựa chọn cần "Apply" — dùng mô hình NHÁP (draft)

Khi 1 panel có NHIỀU điều khiển (radio/checkbox/số...) và cần nút **Apply** riêng để xác nhận (thay
vì mỗi lựa chọn tự lưu ngay khi bấm): copy dữ liệu hiện tại ra 1 biến `draft` cục bộ
(`const draft = { ...activity.options }`), MỌI điều khiển trong panel chỉ sửa `draft`, KHÔNG đụng
vào dữ liệu gốc. Chỉ khi bấm **Apply** mới `Object.assign(activity.options, draft)` để ghi thật.
Bấm ra ngoài (không Apply) = huỷ nháp, dữ liệu gốc giữ nguyên vì chưa từng bị sửa. Xem
`buildOptionsPanel` trong `core/engine.js` làm mẫu.

### Bộ điều khiển số vuốt lên/xuống — `core/numberstepper.js`

Có sẵn `makeNumberStepper(value, min, max, onChange)` — trả về `{ el, get, set }`: 1 ô số nhỏ với
nút ▲/▼ VÀ vuốt dọc (kéo lên = tăng, kéo xuống = giảm) để chỉnh nhanh trên cảm ứng. Dùng cho ô
phút/giây của Timer trong panel Options; dùng lại được cho các số nhỏ khác sau này (vd số mạng/Lives).

---

## ⭐⭐⭐ LUẬT RÚT RA TỪ ĐỢT 196 · 197 · 198 (19/8/2026) — DỮ LIỆU CHIA SẺ, CHUYỂN ĐỘNG, ĐO ĐẠC

Ba đợt liền nhau, tất cả đều bắt đầu từ MỘT lỗi thầy báo: 4 bảng Showdown, lớp A1B 18 em, ba bảng
khớp nhau ở 13 em còn bảng thứ tư ngồi riêng với 5 em. Những luật dưới đây là thứ đắt nhất rút ra
được — đọc TRƯỚC khi viết bất cứ thứ gì đi qua mạng, có chuyển động, hoặc cần đo.

### A. DỮ LIỆU ĐI QUA MẠNG

1. **Thứ gì đi qua mạng thì phải có đường HOÀ HỢP, không được chỉ 1 lần ghi + 1 lần đọc.**
   Khuôn mẫu chuẩn của dự án nay là: **nghe trực tiếp (`onSnapshot`) + hộp thư gửi lại**. Xem
   `subscribeResults` / `flushPendingResult` trong `core/showdown-setup.js`.
2. **CẤM nhớ lại một lần đọc THẤT BẠI.** Không biết thì để `null` và **NÓI RA** trên màn hình; đừng
   lấp bằng dữ liệu của chính mình. Lấp là cách một bảng hỏng trông y hệt một bảng đã xong.
3. **CẤM lấy dữ liệu phạm vi HẸP vẽ cho phạm vi RỘNG.** `classBlocks || teamBlocks` từng khiến 5 em
   của một đội đứng dưới tên cả lớp — không ai phát hiện được bằng mắt.
4. **Bộ lọc im lặng là bộ lọc nguy hiểm.** Lọc gì thì phải **đếm được và nói được** cái vừa bị lọc
   (xem `splitResults` trả về cả `otherActs`).
5. **Ghi lên mây thì đừng mang theo nhiều hơn thứ mình định đổi.** Muốn thêm một khoá thì ghi một
   khoá (`writeMyClaim`); ghi cả tài liệu là ký tên vào những thứ mình không biết đã đổi.
   Nhiều bên cùng ghi một tài liệu ⇒ **GIAO DỊCH** (`runTransaction`), không đọc-sửa-ghi.
6. ⚠️ **Firestore `update()` KHÔNG gộp sâu** — mỗi khoá tầng trên cùng thay hẳn giá trị cũ. Muốn gộp
   sâu phải `set` + `merge`, hoặc đường dẫn có dấu chấm. (Xoá một khoá con thì `update` với cả map
   là ĐÚNG; `set+merge` sẽ không bao giờ xoá được.)
7. **Trước khi thay một hàm ghi bằng hàm ghi hẹp hơn, hỏi: hàm cũ còn làm việc gì khác không?**
   `applyReady` là chỗ **DUY NHẤT** đẩy bảng đội lên mây — suýt mất hẳn tính năng chia sẻ vì chuyện này.
8. **Hết chỗ thì giảm chất lượng, đừng để hỏng.** `fitToBudget` bỏ chi tiết từng câu của trận cũ nhất
   chứ không để Firestore từ chối cả kết quả lớp vừa chơi xong.
9. **Đổi ý nghĩa của giá trị trả về thì phải soát MỌI người đọc nó.** `false` của bridge từng chỉ là
   "không làm gì"; myActivity thêm dấu ✗ vào là nó bỗng thành "hỏng", và báo oan.

### B. CHUYỂN ĐỘNG

10. ⭐ **Một `transition` được KHAI không có nghĩa là nó CHẠY.** Nếu phần tử bị **dựng lại** mỗi lần
    đổi trạng thái thì nó chưa bao giờ chạy lần nào — phần tử vừa sinh ra bắt đầu ngay ở giá trị
    cuối, **không có gì để chuyển động từ đó**. Muốn mượt thì **đổi class trên node đang sống**
    (`paintColStates` so với `paintCols`). `.aw-sd-col` đã khai transition từ Đợt 159 mà tới Đợt 198
    mới thật sự chạy được lần đầu.
11. **Mọi listener/animation phải có `dispose()` và phải được gọi từ MỌI đường ra** (✕ · Start again ·
    Home · Change template · vào trận). Đây là ghost-clock Đợt 131 mặc áo khác.
12. **Hiệu ứng nào GIẤU phần tử đi thì phải có hẹn giờ dự phòng BỎ GIẤU.** Mất một hiệu ứng là chuyện
    nhỏ; để cả danh sách lớp nằm im `visibility:hidden` là hỏng buổi dạy. (Cộng dồn với luật
    `element.animate()` đã có ở trên: cột myActivity chạy nền thì rAF đóng băng, `onfinish` không tới.)
13. **Muốn một vật bay qua nhiều chặng thì dùng MỘT bóng và chỉ đổi `transform`** — chặng sau nối tiếp
    từ đúng chỗ chặng trước dừng, không có mối nối. Chặng chờ phải `fill: "forwards"`.
    Dựng lại DOM ở **khe giữa hai chặng**, lúc không ai nhìn thấy (xem `flyOutAndBack`).
14. **Nhịp (stagger) phải CHẶN TRẦN, không phải cộng dồn theo số phần tử** — 25 em × 26ms là hai phần
    ba giây chỉ để hiện xong một danh sách.

### C. BỐ CỤC & ĐO ĐẠC

15. **Căn giữa trong flex là chuyện của `flex-grow`, KHÔNG phải `text-align`.** Chỗ nào có bề ngang ép
    cứng thì phải chỉ định đứa nào nuốt phần thừa, kẻo nó dồn hết về một mép (bộ đếm số đội: 18px
    thừa dồn phải ⇒ `+` lệch 17px và số lệch tâm 8px).
16. **Một stylesheet đo bằng `cqw` chỉ dùng lại được khi có container CÙNG CỠ.** Bảng kết quả thật vẽ
    tên học sinh ra ~5px khi nhét vào cột 200px. Không cùng cỡ thì làm bản thu nhỏ riêng bằng `px`,
    và ghi rõ vì sao có hai bản.
17. **ĐO Ở TRẠNG THÁI ĐÃ Ở YÊN.** Khung hình đang tải không phải thứ người dùng nhìn thấy — đo bộ đếm
    lúc màn còn "Loading…" ra 135 thay vì 150.
18. **So bề ngang con với `clientWidth` của cha, không phải `getBoundingClientRect()`** (cha có viền).
19. **Luật chia/xếp phải viết thành hàm THUẦN, EXPORT, và quét TOÀN BỘ miền giá trị.** Nó đúng với 18
    em mà lệch với 23 em, và không ai phát hiện ra cho tới khi đứng lớp
    (`outwardIn`/`targetSizes`/`planDeal`, quét ~3.200 tổ hợp).
20. **Cắt dữ liệu để chơi thì cắt trên BẢN SAO**, và cắt ở **mọi chỗ act được giải lại** — `begin()`
    giải lại act từ thư viện, thiếu lần gọi thứ hai là phép cắt biến mất đúng lúc bấm Play.

### D. BẪY CỦA CHÍNH LƯỚI THỬ (báo HỎNG oan — đã cắn 5 lần)

21. `goto()` giữ **lớp màn CŨ trong DOM 360ms** để chạy animation ⇒ truy vấn lúc đó trả về phần tử
    của **cả hai màn**. Luôn đọc lớp **cuối cùng**, luôn đợi **> 360ms**.
22. ⚠️⚠️ **Khung Browser bị ẩn ⇒ Chromium ĐÓNG BĂNG animation**, `getBoundingClientRect` trả giá trị
    giữa chừng (đo ra 908×410 thay vì 936×423 = đúng `scale(.97)`). **Ép animation chạy xong trước
    khi đọc**: `root.getAnimations().forEach(a => a.finish())`.
23. **Phép hỏi "thứ này đã biến mất chưa" phải hỏi về KHAI BÁO, đừng hỏi về chuỗi ký tự** — một ghi
    chú tử tế luôn nhắc tên thứ vừa bỏ đi.
24. **Bộ giả (fake) phải khớp hành vi THẬT.** Bộ Firestore giả từng gộp sâu ở `update()` và báo HỎNG
    oan cho một đoạn code thật ra đúng.
