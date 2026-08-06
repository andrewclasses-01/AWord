# GHI CHU RUNNING TEAM (RUNNINGT)

> **TRẠNG THÁI (6/8/2026, v0.9.53): 🟢 CHỜ THẦY DUYỆT — build xong trọn 3 chặng trong 1 phiên,
> chưa commit.** Template thứ 16. Đã tự test trình duyệt thật qua devserver
> (`templates/running-team/test.html`), **0 lỗi console** suốt cả phiên. Đã kiểm đủ **4 cửa kết thúc**,
> chế độ **Unlimited**, **hồi quy 3 game khác không rò CSS**, và **cả 2 chiều đổi template**.
> ⭐ **CÓ SỬA CORE** — nhưng KHÔNG phải cho bản thân game (game này 0 hook mới); phần sửa core là để
> làm tính năng **Classes** mà thầy đặt hàng kèm. Chi tiết mục 7.
> ⬜ **Còn chờ thầy nghiệm thu tay:** tạo lớp thật trong Settings (cần đăng nhập Google — máy không tự
> làm được), chơi thử trên TOMKO/iPad, **in thử tờ giấy A4 thật**.
>
> Đọc kèm: `../HUONG DAN TEMPLATE.md`, `../CONG THUC MAU.md`, `../../core/HUONG DAN CORE.md`.

---

## 1. Game này là gì

Trò chạy tiếp sức cả lớp, chơi quanh **MỘT tờ giấy** được chuyền tay:

- Màn hình gọi **`MINH ANH — 23`** (tên em + số thứ tự). **Không bao giờ hiện từ.**
- Em Minh Anh đang cầm tờ giấy, dò dòng số 23, **đọc to từ đó**.
- Trên màn hình có **6 ô, mỗi ô 1 từ**, trong đó **5 ô là từ trông giống từ đúng nhất**. Một em khác
  phải nghe kỹ và chọn đúng ô.
- Chọn đúng → hiện ✓ → màn **READY** → **3 – 2 – 1** → câu mới, tên mới. Tờ giấy chuyền sang em vừa
  được gọi tên. Đó là chữ "running" trong tên trò.

**Bản chất sư phạm: đây là trò PHÂN BIỆT MẶT CHỮ / chính tả, không phải trò nghĩa.** Đó là lý do dữ
liệu chỉ cần một danh sách từ trần — không clue, không nghĩa, không soạn đáp án.

**Hai đồng hồ + hàng tim:**

| Sự kiện | Kết quả |
|---|---|
| Hết tim | **THUA** (Game over ngay) |
| Đồng hồ chính về 0 mà còn tim | **THẮNG** — cả lớp thắng |
| Hết sạch từ trong pool | **THẮNG** |
| Chọn SAI | −1 tim, hiện đáp án đúng ~1,4s rồi sang câu mới |
| Hết giờ MỘT CÂU | −1 tim, sang câu mới (bỏ luôn từ đó) |
| Tim = 0 (**Unlimited**) | Không bao giờ over; sai thì ô mờ đi và **chọn lại** |

⚠️ **Đồng hồ chính chạy XUYÊN QUA màn READY/3-2-1** (thầy chốt: nó là giới hạn của cả ván, không phải
của từng câu). Đo thật: 10:00 → 9:57 trong lúc đếm ngược. Thanh giờ mỗi câu thì **chỉ chạy khi câu
đang hiện**, đầy lại mỗi câu.

## 2. ⭐ LUẬT QUAN TRỌNG NHẤT: TỪ SẮP TỚI KHÔNG ĐƯỢC HIỆN Ở PHẦN ĐỀ BÀI

Đề bài **chỉ có TÊN + SỐ**. Nếu ô đáp án cũng hiện số thứ tự thì trò chơi chết ngay: học sinh chỉ việc
dò số khớp với đề, không cần nghe bạn đọc. **Thầy đã chốt: 6 ô CHỈ CÓ CHỮ, không có số.** (Tôi đã hỏi
lại đúng điểm này trước khi build vì câu mô tả ban đầu có thể hiểu 2 cách.)

## 3. ⭐ THUẬT TOÁN CHỌN 5 TỪ NHIỄU — trái tim của game

Toàn bộ độ khó nằm ở chỗ 5 ô sai giống từ đúng đến mức nào. Sáu từ vô can = trò "nghe từ, bấm từ",
không phải trò chơi. `similarity(a, b)` trong `rt-sets.js` chấm mọi từ còn lại trong pool bằng **4 tín
hiệu**, trọng số theo mức thực sự gây nhầm khi nhìn lướt qua từ cuối lớp:

```
0.55 × khoảng cách sửa (Levenshtein, chuẩn hoá theo độ dài)   ← xương sống
0.20 × trùng túi chữ cái không kể thứ tự                       ← bắt các cặp gần đảo chữ (TRIAL/TRAIL)
0.15 × cùng chữ cái ĐẦU                                        ← mắt nhìn vào đó trước tiên
0.10 × độ dài xấp xỉ                                           ← từ cùng bề ngang hay bị lẫn
```

Khoá so sánh bỏ dấu, bỏ mọi ký tự không phải chữ/số, viết HOA — nên `SKIN-SCRAPER` và `skin scraper`
cùng một hình dạng (pool thật có gạch nối và từ 2 chữ).

**Đo thật trên pool IELTS 40 từ:**

| Từ đúng | 5 ô nhiễu máy chọn |
|---|---|
| SCRAPE | **SCARCE** · SKIN-SCRAPER · INSCRIBE · STRIGIL · SANITARY |
| OUTLAW | **OUTBREAK** · OBEDIENCE · BATHE · FATTY · PUMICE |
| CLEANSE | **CLEANLINESS** · CYLINDER · CARBONATE · CIVILISATION · PLAGUE |
| STIR | STRIGIL · SANITARY · SCARCE · SODIUM · SKIN-SCRAPER |
| TRIAL *(pool dựng riêng)* | **TRIBAL · TRAIL** · TRIPLE · QUILT · RATIO |

⚠️ **Giới hạn đã biết, không phải lỗi:** pool càng ít liên quan về mặt chữ thì 2–3 ô nhiễu cuối càng
yếu (xem hàng CLEANSE). Máy chỉ chọn được từ **tốt nhất đang có trong pool**. Muốn khó thì pool nên
gom từ trông giống nhau.

**Hoà điểm thì bốc NGẪU NHIÊN** (không lấy theo thứ tự mảng): pool hay có vài từ điểm bằng nhau y hệt,
lấy theo thứ tự mảng sẽ ra **cùng một bộ 6 ô mọi lần chơi lại** và lớp sẽ nhớ hình dạng đáp án thay vì
đọc nó. Trên mức hoà thì xếp hạng chặt — đúng là 5 từ khó nhất.

## 4. Cấu trúc dữ liệu

```js
{
  type: "running_team",
  content: {
    words: ["CYLINDER", "LUXURIOUS", ...],     // pool trần, không clue, không đáp án
    gameSets: [ {...}, null, null ]             // tối đa 3 bộ đã lưu, THEO VỊ TRÍ
  },
  options: {
    timer: "none",              // BẮT BUỘC — game tự chạy 2 đồng hồ
    mainSeconds: 600,            // đồng hồ chính cả ván (Options nhập theo PHÚT)
    questionSeconds: 15,         // thanh giờ mỗi câu
    lives: 3                     // 0 = Unlimited (giống hệt Find the match)
  }
}
```

**Một "GAME SET" = tờ giấy của một buổi**: thứ tự đánh số đã in **VÀ** danh sách em có mặt hôm đó. Hai
thứ này phải lưu **thành cặp** — thầy tắt app giữa buổi vẫn phải in lại được **đúng tờ giấy lớp đang
cầm**. Hình dạng lưu:

```js
{ order: [...],            // mảng chuỗi — chính là cách đánh số trên giấy
  classId: "...", className: "A1C",
  studentIds: [...], studentNames: [...] }    // 2 mảng SONG SONG, đều là chuỗi
```

⚠️ **Vì sao 2 mảng song song mà không phải mảng các map `{id,name}`**: Firestore cấm **mảng lồng
mảng**. Cả 2 hình dạng đều hợp lệ hôm nay, nhưng mảng chuỗi song song là hình dạng **không thể nào**
vướng luật đó khi cấu trúc lớn dần. `gameSets` lưu **THEO VỊ TRÍ** (chỉ số i luôn là SET i+1, chỗ
trống là `null`) — đúng bài học của RunningW: mảng tự **dồn lại** sẽ đánh số lại các SET khác sau lưng
thầy.

**Luật SET đã lưu thì khoá Shuffle** (kế thừa RunningW): muốn xáo số mới phải **xoá SET trước**. Đây
là hàng rào để tờ giấy đã phát không bao giờ âm thầm lệch với máy.

## 5. File trong thư mục

| File | Việc |
|---|---|
| `running-team.js` | template chính: setup → READY → 3-2-1 → câu hỏi → kết thúc |
| `running-team.css` | style (`.aw-rt-*`); có cả `@media print` cho tờ giấy |
| `running-team-editor.js` | soạn pool — 1 ô textarea, mỗi dòng 1 từ (dán thẳng cột Excel) |
| `rt-sets.js` | thuật toán chọn từ nhiễu + đọc/ghi GAME SET |
| `rt-print.js` | dựng 1 tờ A4 số + từ rồi `window.print()` |
| `rt-sound.js` | âm thanh synth Web Audio |
| `sample-running-team.js` | 40 từ IELTS thật + **1 GAME SET demo** (xem mục 8) |

## 6. ⭐⭐ BẪY CORE ĐÃ TRÁNH ĐƯỢC (quan trọng cho MỌI template sau)

### `inlineTimerBar` và `hasLivesSlot` LOẠI TRỪ NHAU — khai cả 2 là hỏng IM LẶNG

Game này cần **thanh giờ mỗi câu VÀ hàng tim VÀ đồng hồ chính** trên cùng một hàng. Core có sẵn đúng 2
cờ cho 2 thứ đầu, nhưng `core/engine.js` (~dòng 175) chọn **một trong hai**:

```js
const livesSlot = tpl.hasLivesSlot ? el("span", "aw-top-lives") : null;
if (topbarMid) topbar.append(timerEl, topbarMid, scoreEl);   // ← livesSlot bị BỎ RƠI
else if (livesSlot) { ... }
```

Ngay trong core có ghi chú *"A template never sets BOTH this and inlineTimerBar"*. Template nào khai cả
2 sẽ **được tạo phần tử tim rồi không bao giờ được gắn vào DOM** — vô hình, **0 lỗi console**, đúng
loại bẫy im lặng mà dự án đã cắn nhiều lần.

→ **Lối thoát KHÔNG cần sửa core:** làm y RunningW — **ẩn hẳn thanh trên của engine** rồi tự vẽ hàng
của mình:

```css
.aw-stage.act-running_team .aw-topbar { display: none; }
```

Hàng tự vẽ: `[đồng hồ chính] [♥♥♥] [══ thanh giờ câu ══] [✓ điểm nhỏ]`. Đo thật: cao **4,19cqw**.

### Các thứ khác đều dùng đồ CÓ SẴN, 0 hook mới

| Cần | Dùng lại |
|---|---|
| Khung 4:3 + fullscreen kiểu zoom | `useZoomFullscreen` + class `act-running_team` (RunningW mở đường 5/8) |
| Tắt đồng hồ toàn ván | `hideTimerOption` + `options.timer:"none"` |
| Bảng kết thúc riêng | hook `renderSummary` (RunningW mở đường) |
| Tim 0=Unlimited, 1..10 | copy nguyên ngữ nghĩa + slider của Find the match |
| Co chữ ô dài | `core/fit.js` `fitOnce(..., {contentBox:true})` |

## 7. ⭐ PHẦN CÓ SỬA CORE — là do tính năng CLASSES, không phải do game

Thầy đặt hàng **Settings → Classes** (danh sách lớp + học sinh, lưu bền, dùng chung cho các act sau).

**Quyết định kiến trúc đáng nhớ nhất: lưu lớp học vào chính `users/{uid}/items`, không tạo collection
mới.** Luật bảo vệ Firestore hiện chỉ mở đúng 1 đường:

```
match /users/{uid}/items/{itemId} { allow read, write: if isTeacher() ... }
```

Tạo `users/{uid}/classes/...` sẽ **bị Firestore từ chối** cho tới khi có người vào Firebase Console sửa
luật bằng tay — thêm một việc tay, trên một máy có thể không phải máy đang chạy code, và nếu quên thì
lỗi quyền im lặng. Lưu lớp như một `kind` mới trong `items` thì **không phải đụng Console lần nào**.

Lớp học vô hình với thư viện vì mọi hàm liệt kê trong `store.js` (`listChildren` · `listFolders` ·
`searchItems` · `listTrash`) đều lọc `n.root === root`, và không node lớp nào mang root
`activities`/`results`.

⚠️ **`ROOTS` trong `store.js` CỐ Ý KHÔNG thêm `"classes"`.** Tôi suýt thêm. Mảng đó điều khiển **các ô
trên TRANG CHỦ** (`main.js` `renderTop()` `ROOTS.forEach(...)`) — thêm vào là trang chủ mọc ô "Classes"
thứ ba, sai hẳn ý thầy (Classes thuộc Settings).

**4 chỗ core đã sửa:**

1. `core/classes.js` — **file mới**: CRUD lớp + học sinh.
2. `core/store.js` — 2 dòng phòng vệ: `ensureNumbers()` và `getByNum()` **bỏ qua `kind === "class"`**.
   Không có thì mỗi lớp học sẽ **ăn mất một số link**, và `?a=57` có thể trỏ trúng một lớp học.
3. `main.js` — hàng **Classes** trong Settings + 2 màn quản lý; và gọi `resetClassesCache()` ở chỗ đăng
   nhập/đăng xuất (cache riêng, không dọn thì dữ liệu 2 tài khoản lẫn nhau).
4. `core/app.css` — đúng 4 dòng `.aw-set-addrow` (hàng "tên lớp + Create").

Cộng 3 chỗ tích hợp thường lệ: `catalog.js` (1 mục), `lesson-import.js` (1 nhánh), `convert.js` (2
nhánh + 1 guard).

**ID học sinh phải sống sót qua lần sửa danh sách.** `mergeStudents()` giữ nguyên ID của em nào tên
không đổi (so khớp không phân biệt hoa thường), chỉ cấp ID mới cho tên mới — vì GAME SET đã lưu gọi tên
các em **theo ID**. Hai em trùng tên thì mỗi ID cũ chỉ được tái dùng **đúng 1 lần**. Đã đo.

## 8. Vì sao `sample-running-team.js` CÓ sẵn 1 GAME SET (khác RunningW)

RunningW cố ý **không** ship `printSets` để sample không mang theo bản chia cũ. Ở đây thì ngược lại:
một ván Running team **không thể bắt đầu nếu chưa có danh sách lớp**, mà lớp nằm sau popup đăng nhập
Google. Không nhét sẵn 1 set thì `test.html` — trang dùng để build và test hồi quy, không bao giờ đăng
nhập — sẽ vào được màn setup rồi **tắc ở đó**. Set demo tên lớp là `DEMO`, nhìn là biết.

## 9. Đã tự test những gì (trình duyệt thật, devserver :5510, 0 lỗi console)

**Khung + hồi quy**
- Stage mang `act-running_team`, tỉ lệ đo được **1.333** (4:3). Topbar engine `display:none`.
- 3 nút Assignment/Template/Print ẩn ngay từ màn READY; mũi tên Back/Next `visibility:hidden`; slogan
  **RUNNING TEAM IN ANDREW CLASSES** nằm giữa thanh dưới (đúng chỗ RunningW đặt).
- ⭐ **Vùng chơi cao 69.01cqw** (khung 4:3), **KHÔNG phải 45.67cqw** của khung 16:9. Card khớp đúng
  vùng chơi, **tràn = 0**. Hàng trên 4.19cqw, bàn chơi 64.82cqw, lưới ô **3 cột × 2 hàng**.
- Chữ dài nhất (`CIVILISATION`, `SKIN-SCRAPER`, `LARGE-SCALE`) **không ô nào bị cắt**; tên dài
  `NGUYEN THI MINH ANH` vẫn vừa.
- ⭐ **Hồi quy rò CSS — làm 2 lần, lần 2 mới đáng tin.**
  *Lần 1 (yếu):* từ trang `running-team/test.html` gọi `ensureTemplate()` mở Type the answer ·
  Crossword · Quiz → cả 3 vẫn 16:9, 0 phần tử `.aw-rt-*`. **Nhưng phép đo này có tật**: `catalog.js`
  khai đường dẫn CSS **tương đối với TRANG**, nên từ trang con nó tìm
  `/templates/running-team/templates/quiz/quiz.css` → **404**, tức 3 game kia chạy **thiếu CSS riêng**
  (chính là 3 lỗi 404 thấy trong console — do cách test, không phải lỗi code).
  *Lần 2 (chặt):* mở thẳng `type-the-answer/test.html` (CSS riêng nạp đủ), chơi, rồi **bơm
  `running-team.css` vào giữa chừng** đúng như `ensureTemplate` làm thật, đo trước/sau:
  tỉ lệ `1.778` · topbar `flex` · mũi tên `visible,visible` · **cả 7 nút công cụ `flex`** · cỡ chữ phím
  bàn phím `13.041px` · `touch-action: auto` — **KHÔNG một thuộc tính nào đổi**. Rò rỉ = 0.

**Luồng chơi**
- READY → 3 → 2 → 1 → câu hỏi, đúng thứ tự. Đồng hồ chính 10:00 → **9:57** trong lúc đếm ngược (đúng
  luật thầy).
- Đề bài `MINH ANH — 13`; 6 ô dealt ra: **SANITARY · SCARCE · STIR · STRIGIL · SODIUM · SCRAPE**
  (đáp án SODIUM) — 5 ô nhiễu đều là từ S.
- Số câu ra **ngẫu nhiên KHÔNG lặp**: pool 6 từ cho ra `5,6,4,1,3,2` (6/6 duy nhất).
- Tên chạy **vòng tròn**: AN → BINH → AN → BINH.

**4 cửa kết thúc (đo đủ)**
| Ca | Kết quả đo |
|---|---|
| Sai 2 lần, tim 2 | tim `2/2 → 1/2 → 0/2`, rồi **GAME OVER** — "The last life was lost." |
| Chơi đúng hết pool 6 từ | **CLASS WINS** — "Every word on the sheet was won.", điểm 6/6 |
| Đồng hồ chính 30s cạn | **CLASS WINS** — "The round timer ran out with hearts to spare." (đo 29,4s) |
| Bảng kết thúc | chỉ còn đúng **1 nút "Start again"** |

**Unlimited (tim = 0)**
- Sai 2 ô liên tiếp: 2 ô mờ + khoá, **vẫn nguyên câu đó**, `lives = INF`, chọn đúng sau đó vẫn tính
  điểm.
- Hết giờ 1 câu ở chế độ này: **sang câu mới** (5 → 2), game **không kết thúc**.

**In**
- 20 từ → **1 cột**, dòng 12,55mm, chữ 7,28mm (~20,6pt). 50 từ → **2 cột**, dòng 10,04mm, chữ 5,82mm
  (~16,5pt). Đánh số đúng 1..n. Tờ in `display:none` trên màn hình, **tự gỡ khỏi DOM sau khi in**.
- `box-sizing: border-box` (kiểm rồi) nên viền dưới mỗi dòng **không cộng dồn**.

**Đổi template (cả 2 chiều)**
- Quiz (6 câu, có clue) → danh sách đích **có `running_team`**; act tạo ra có 6 từ, `gameSets: []`,
  options đúng từ sample, id `conv_`, `_converted: true`, và **mount được** (nút START khoá kèm chú
  thích "Pick a class and deal a numbering first" — đúng thiết kế).
- Running team → chỉ đổi được sang **anagram · flying_fruit · speaking_cards** (3 đích không cần clue)
  — đúng, vì pool không có clue.
- Pool 5 từ → **không** hiện `running_team` (sàn 6 từ hoạt động), Quiz 5 câu cũng vậy.

## 9b. 🐞 LỖI THẬT TỰ BẮT ĐƯỢC SAU KHI ĐÃ COMMIT LẦN 1 (vá ngay, cùng ngày)

Rà lại luật core sau khi push mới thấy: `core/HUONG DAN CORE.md` ghi **"TUYỆT ĐỐI không `saveActivity`
act có id bắt đầu `conv_`"** (act TẠM do Change template dựng ra) — vì lưu nó là **đẻ rác vĩnh viễn
trong thư viện**: một act ma không thuộc thư mục nào và không có đường quay về.

`saveCurrentSet()` và `confirmDeleteSet()` của tôi gọi thẳng `saveActivity(activity)` **không kiểm tra
gì**. Kịch bản dính lỗi có thật: thầy đang chơi 1 act Quiz → bấm **Change template → Running team** →
màn setup hiện ra → chọn lớp → bấm **Save as SET 1** ⇒ ghi một act `conv_running_team_...` lên
Firestore.

**Đã vá:** thêm `isTempAct()` (kiểm `_converted === true` **hoặc** id bắt đầu `"conv_"` — 2 lớp, vì
`convert.js` đặt cả hai) chặn ở đầu **cả 2** hàm, kèm toast giải thích thay vì im lặng.

**Đo lại sau khi vá** (dựng đúng act `conv_running_team_123456`, `_converted:true`, rồi bấm DELETE SET):
hộp thoại confirm **không còn hiện**, `saveActivity` **0 lần được gọi**, toast ra đúng chữ
*"This is a temporary activity — open the real one to edit its sets"*.

→ Bài học cho template sau: **hễ template nào tự gọi `saveActivity` thì phải tự chặn act `conv_`** —
core không chặn hộ.

## 10. ⚠️ BẪY GẶP KHI TỰ TEST (ghi lại cho phiên sau)

1. **Hàng tim đo bằng `textContent` là SAI.** Tim đã mất chỉ đổi *class* `is-out` chứ không biến mất,
   nên `textContent` luôn là `"♥♥♥"`. Phải đếm `.aw-rt-heart:not(.is-out)`.
2. **Cache module ES che mất thay đổi.** Tôi nạp `convert.js?v=<time>` để lấy bản mới, nhưng bên trong
   nó `import "./catalog.js"` **không kèm tham số** → dính bản catalog CŨ đã nạp trước đó trong cùng
   trang → `running_team` biến mất khỏi danh sách đích và options ra rỗng. **Không phải lỗi code.**
   Tải lại trang sạch là đúng hết. → Nghi ngờ kết quả đo lạ thì **tải lại trang trước khi sửa code**.
3. **Đồng hồ vẫn chạy giữa 2 lần gọi công cụ** (bẫy RunningW đã ghi): câu hỏi tự hết giờ và nhảy sang
   câu khác giữa 2 lệnh là bình thường, không phải lỗi.
4. **Layout in không đo được từ màn hình.** Mọi luật in nằm trong `@media print` nên trên màn hình
   chúng **không áp dụng** — đo DOM lúc đó là đo nhầm layout. Đây là lý do mục 11 nói phải in giấy thật.

## 11. VIỆC ĐANG CHỜ

- [ ] **⭐ Thầy tạo lớp thật trong Settings → Classes** rồi báo kết quả. Máy **không tự làm được** khúc
      này: popup đăng nhập Google không tự động hoá được, nên đường ghi Firestore của `core/classes.js`
      **chưa từng chạy thật**. Đây là rủi ro còn lại lớn nhất của đợt này.
- [ ] **⭐ In thử tờ A4 thật.** 50 từ → 2 cột ~16,5pt. Cần thầy xác nhận: đứng cầm tờ giấy dò số có
      nhanh không, 2 cột có làm rối việc dò số không (nếu rối thì hạ `TWO_COL_FROM` trong `rt-print.js`
      cho ra 1 cột luôn).
- [ ] Chơi thử trên **TOMKO / iPad**: khung 4:3, nút Fullscreen kiểu zoom, 6 ô có đủ to để em cuối lớp
      đọc không.
- [ ] Cân nhắc: **chế độ ĐÔI** (2 đội) — thầy nói làm sau. Chỗ lắp vào đã tính sẵn: thêm
      `options.mode: "single" | "double"`, chia `roster` làm 2 và cho `renderSummary` vẽ 2 nửa như
      RunningW. Cố ý **chưa** ship option chết trong dữ liệu.
- [ ] Cân nhắc: cho `running_word` vào `convert.js` (tới nay vẫn chưa có) — nay `running_team` đã có
      nhánh mẫu để copy.

## 12. ĐỀ XUẤT SỬA CORE

1. ⬜ **`core/engine.js` — cho `inlineTimerBar` và `hasLivesSlot` sống chung.** Sửa nhánh
   `if (topbarMid)` để nó cũng gắn `livesSlot` (bọc phải như nhánh `else if`). Hiện tại khai cả 2 là
   hỏng im lặng — xem mục 6. Running team **không cần** bản vá này (nó tự vẽ hàng trên), nhưng bẫy vẫn
   nằm đó chờ template sau. Sửa xong nên ghi vào `core/HUONG DAN CORE.md`.
2. ⬜ **`core/lesson-import.js` còn rác `wordsPerTeam: 0` trong `OPT_RW`** — RunningW đã bỏ tham số này
   từ 5/8/2026 (mục 4 GHI CHU RUNNING-WORD), nhưng import vẫn ghi nó lên Firestore cho mọi act RUNNING
   WORD sinh từ file bài học. Vô hại nhưng là rác vĩnh viễn. Không tự sửa vì ngoài phạm vi đợt này.
