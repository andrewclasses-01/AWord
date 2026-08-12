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

`play.html` (trang HS) gọi engine với thêm một `session`. Template KHÔNG cần biết gì về nó, nhưng
người sửa engine thì phải nhớ:

| Trường | Việc gì |
|---|---|
| `session.endOptions` | `{leaderboard, showAnswers, startAgain}` — thầy tích gì thì menu cuối game hiện nấy |
| `session.playerName` | tên HS đã nhập |
| `session.submit(r)` | nộp 1 lượt chơi (Promise) — engine gọi NGAY khi Game Complete |
| `session.entries()` | bảng xếp hạng lớp (Promise) cho màn Leaderboard |

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

## ⭐⭐ FIGHT MODE — HAI BÀN, MỘT TRẬN (`core/fight.js`, Đợt 124, 12/8/2026)

Nút **MODE** dưới khung lật act giữa SINGLE MODE và FIGHT MODE: 2 ván THẬT cạnh nhau, một dải
SCOREBOARD 1 · ĐỒNG HỒ · SCOREBOARD 2 ở trên, MỘT thanh công cụ dùng chung ở dưới.

**Chạy được là nhờ `startGame()` giữ mọi trạng thái trong closure** → gọi 2 lần vào 2 div là xong.
Mọi thứ vươn RA NGOÀI một ván mới là chỗ phải vá — nhớ danh sách này khi thêm bất cứ thứ gì dùng chung:

| Thứ vươn ra ngoài | Đã xử |
|---|---|
| `core/sfx.js` giữ 1 `<audio>`/file | thêm **giọng dự phòng** (tối đa 3/file, chỉ đẻ khi bận) — nếu không, 2 đội bấm cùng lúc chỉ nghe 1 tiếng |
| `document.querySelector(".aw-top-score")` | **CẤM** — quét cả trang thì bàn phải ghi điểm vào bàn trái. Dùng `ui.scoreEl`, hoặc `ctl.scoreTarget(side)` khi đấu |
| `window.__awordBridge` (1 chỗ ngồi) | chỉ bàn 0 ngồi |
| Giọng đọc | chỉ bàn 0 đọc (`ctl.speaks(side)`) |
| Nhạc lifecycle (`tpl.sounds.play/restart/timeWarning`) | engine chỉ phát ở bàn 0 |

**Hợp đồng cho template muốn tham gia** (opt-in — Anagram Đợt 124, Quiz thêm ở Đợt 125 làm thử
nghiệm; template cần khai sẵn `itemsKey`, xem cảnh báo dưới):
```js
itemsKey: "questions",                // BẮT BUỘC — fight.js đọc/ghi mảng item qua field này (xem dưới)
fightMode: true,                      // đây là thứ làm nút MODE hiện ra
// trong mount(): const f = activity._fight;  // { side, ctl } — không có = chơi đơn như thường
f.ctl.attach(side, { total, goToIndex(i), lock(on) })   // đăng ký bàn
f.ctl.wordDone(side, { index, earned, perfect })        // vừa giải xong 1 từ (hoặc 1 câu — earned/perfect
                                                         // là thông tin thêm, fight.js hiện KHÔNG đọc lại)
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

**Điểm THỦ CÔNG của thầy** (2 ô cạnh đồng hồ): chạm/vuốt lên +1, vuốt xuống −1; dương xanh dương, âm
đỏ **không có dấu trừ**. Tách hẳn khỏi điểm game và giữ ở **biến cấp module** trong `fight.js` ⇒ sống
qua Start again và đổi template, chỉ mất khi tải lại trang.

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
│                        markCheck, markCross)
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
- `tpl.hideLettersOption:true` — ẩn nhóm "Letters on answers" (game không có ô đáp án chữ cái).
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
