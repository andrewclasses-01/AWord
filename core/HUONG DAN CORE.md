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

## Luật số 1 — KHÔNG được sửa core/

Thư mục `core/` (bao gồm `app.css`, `engine.js`, `registry.js`, `layout.js`, `scoring.js`,
`leaderboard.js`, `confetti.js`, `sound.js`, `icons.js`, `utils.js`, `themes/`, `assets/`) là
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
├─ registry.js        ← sổ đăng ký template: registerTemplate(tpl) / getTemplate(type)
├─ layout.js          ← buildStage(themeName): dựng khung 16:9 + vùng chữ dưới khung
├─ scoring.js         ← computeResult(raw, seconds), rankCompare(a,b)
├─ leaderboard.js     ← lưu kết quả trên máy (localStorage), theo activityId
├─ confetti.js        ← confettiBurst(container) — hiệu ứng pháo giấy "Game complete"
├─ sound.js           ← sound.correct()/wrong()/fanfare()/toggle()/isMuted()
├─ icons.js           ← bộ icon SVG dùng chung (menu, prev, next, sound, fullscreen, check, cross,
│                        close, options, template, style, edit, assignment, print, playBig,
│                        markCheck, markCross)
├─ print.js           ← Print DÙNG CHUNG: popup chọn định dạng (Anagram/Crossword/Quiz/Unjumble) +
│                        luật khả dụng + render worksheet ra giấy (đọc template.toPrintItems)
├─ fit.js             ← autoFit() (co chữ theo dõi resize) + fitOnce() (co chữ 1 lần, cho ô nhỏ)
├─ numberstepper.js   ← makeNumberStepper() — ô số vuốt lên/xuống + nút ▲▼ (dùng trong panel Options)
├─ utils.js           ← shuffle, formatTime, el(), ordinal(), fmtSecsParts()
├─ themes/            ← classic.css, classroom.css, beach.css + manifest.js (danh sách + lazy-load).
│                        Mỗi theme định nghĩa cả biến hình dạng ô + chữ: --aw-tile-radius,
│                        --aw-tile-border-width/-color, --aw-tile-shadow, --aw-question-stroke-*,
│                        --aw-question-fill (Classic/Beach = mặc định phẳng; Classroom = viền dày
│                        + chữ trắng viền đen kiểu "hoạt hình bảng phấn")
└─ assets/            ← font (Baloo 2) + âm thanh (oh-my-god-meme.mp3), dùng chung, offline
```

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
| `ui.setNav({index, total, onPrev, onNext, nextLabel})` | Cập nhật thanh dưới "x of N" + 2 nút mũi tên. `onPrev`/`onNext` = `null` → nút mờ (không bấm được). `nextLabel` (HTML/SVG) thay icon mũi tên (dùng cho câu cuối = dấu ✓) |
| `ui.onSubmit(fn)` | Đăng ký hàm chạy khi người dùng bấm "Submit answers" trong menu |
| `ui.sound.correct()` / `.wrong()` / `.fanfare()` | Phát âm thanh (tự tôn trọng nút tắt tiếng) |
| `ui.toast(msg)` | Hiện thông báo nhỏ nổi ở đáy khung, tự biến mất |
| `ui.finish({correct, incorrect, total, perQuestion})` | **Báo game đã xong.** Engine tự lo: dừng đồng hồ, tính điểm, lưu leaderboard, chạy hiệu ứng "Game complete", hiện bảng tổng kết. `perQuestion` = mảng `{q: index, correct: true/false}` (dùng để chấm điểm và — nếu cần — chi tiết từng câu) |

Engine tự động lo (KHÔNG cần template làm): nút PLAY khổng lồ che game lúc đầu, đồng hồ, nút loa,
nút phóng to, menu (☰), pháo giấy khi hoàn thành, bảng tổng kết, bảng xếp hạng, khung 16:9, tên
game + hướng dẫn hiển thị dưới khung.

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
