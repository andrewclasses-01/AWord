# GHI CHU RUNNING WORD (RUNNINGW)

> **TRẠNG THÁI (5/8/2026): 🟢 CHỜ THẦY DUYỆT** — 3 đợt sửa lớn liên tiếp trong cùng ngày (tất cả
> đang gộp chờ duyệt, CHƯA commit/push):
> **Đợt 1** (mục 8b, v0.9.43) = 8 điểm tối ưu iPad. **Đợt 2** (mục 8c, v0.9.44) = 15 điểm làm lại
> giao diện trận đấu. **Đợt 3** (mục 8d, v0.9.45) = 8 điểm tinh chỉnh sau khi thầy chơi thử (nút
> Play/Pause nhạy + vuông bo tròn, slogan về hàng nút Menu + đổi màu, sửa icon loa↔fullscreen đè
> nhau, chữ trong ô tự co không "…", đồng hồ thấp hơn, **bảng CHỈ 3 ô — input luôn ở đáy, đẩy lên khi
> đảo lượt**, sửa màn GAME COMPLETE bị kẹt). Đợt 3 **KHÔNG đụng core** (chỉ 2 file template). **⭐ CÓ
> SỬA CORE** vẫn là 1 dòng của Đợt 2 (`core/engine.js`, thầy duyệt — xem mục 8c). Tự test kỹ trên
> devserver cả 3 đợt.
> ⬜ **Còn chờ thầy nghiệm thu những việc máy không thay được**: xem khung 4:3 + đồng hồ + bảng
> 70/30 + 3-ô trên TOMKO thật, bật thử fullscreen thật trên iPad, **in thử 3 tờ A4 giấy thật**.
> Đọc kèm: `../HUONG DAN TEMPLATE.md`, `../CONG THUC MAU.md`, `../../core/HUONG DAN CORE.md`.

---

## 1. Game này là gì

Trò **RUNNING WORD** thầy vốn chơi bằng **giấy + Excel + đồng hồ cờ vua thật**:

- Mỗi đội cầm 1 tờ danh sách từ riêng (PART A / PART B). Thầy cầm tờ thứ 3 (CHECK) để soi.
- **Explainer** của đội giải thích từ số 1 (không được nói ra từ đó), **Typer** gõ chữ.
- Gõ đúng → thầy xác nhận → **bấm đồng hồ cờ vua** → tới lượt đội kia.
- Đội nào **hết giờ trước là thua**; nếu hết từ thì đội nào **còn nhiều thời gian hơn** thắng.

Template này thay cả 4 thứ cùng lúc:

| Trước | Nay |
|---|---|
| Đồng hồ cờ vua vật lý | 2 mặt đồng hồ trong khung, tự đảo khi gõ đúng |
| Gõ vào sheet `RUNNING` của WORD GAMES.xlsx trên iPad | 2 cột ô nhập trong game, tự chấm |
| In 3 tab từ sheet `RunningW` | Nút **Print 3 sheets** ở màn setup (`rw-print.js`) |
| Tự chia 2 danh sách bằng tay trong Excel | `buildSets()` trong `rw-sets.js` |

## 2. ⭐ LUẬT QUAN TRỌNG NHẤT: TỪ SẮP TỚI KHÔNG BAO GIỜ ĐƯỢC HIỆN LÊN MÀN HÌNH

Typer đang đứng ngay trước màn hình. Nên:

- Dòng chưa chơi **chỉ hiện SỐ THỨ TỰ**, không hiện chữ.
- **Màn setup cũng KHÔNG hiện danh sách** — chỉ hiện con số (bao nhiêu từ, chia mấy + mấy, trùng
  mấy từ). Muốn xem từ thì **in ra giấy**.
- Dòng **PASS** hiện `—`, KHÔNG lộ từ (từ đó có thể đang nằm trong danh sách đội kia — xem mục 3,
  bình thường có ~15 từ trùng — lộ ra là tặng không cho đối thủ).
- Dòng gõ ĐÚNG mới hiện chữ (màu xanh lá). Chỗ này **có rò rỉ nhẹ** đúng như bản Excel cũ vẫn rò
  (đội kia nhìn thấy từ vừa gõ). Giữ nguyên vì thầy yêu cầu "gõ đúng thì chữ đổi xanh lá", và
  explainer đội kia vẫn phải diễn giải lại.

## 3. ⭐ THUẬT TOÁN CHIA TỪ — v2 (5/8/2026, thay hẳn v1)

**Thầy đổi luật** (bản v1 — chia ngẫu nhiên phủ trọn pool, đo từ `IEL-S15.T3.P4.xlsm` — vẫn ghi lại
bên dưới mục 3b để nhớ gốc tích, nhưng KHÔNG còn là luật đang chạy):

```
CAPACITY = 50   -- mỗi Part TỐI ĐA 50 từ, không còn thanh "Words per team" để chỉnh

n ≤ CAPACITY  -> 2 đội chơi ĐÚNG CÙNG một danh sách (cả pool), mỗi bên tự xáo thứ tự riêng
n > CAPACITY  -> Part A = 50 từ ĐẦU theo đúng thứ tự thầy nhập (1..50)
                 Part B = 50 từ CUỐI theo đúng thứ tự thầy nhập (n-49..n)
                 (n=70 -> A=1-50, B=21-70, trùng 30 từ ở giữa; n≥100 -> 2 danh sách rời hẳn)
```

Vị trí trong danh sách (không phải bốc ngẫu nhiên) quyết định ai được từ nào — thầy tự sắp thứ tự
từ trong pool để kiểm soát việc chia. `buildSets(pool)` trong `rw-sets.js` cài đúng vậy (không còn
nhận tham số thứ 2 nữa).

**Vẫn giữ nguyên từ v1** (thầy xác nhận giữ, 5/8/2026): từ TRÙNG (dù là cả pool khi n≤50, hay đúng
đoạn giữa khi n>50) vẫn phải **lệch vị trí ≥ 6 dòng** giữa 2 danh sách sau khi xáo (`MIN_SHARED_GAP`,
hàm `separateShared()` không đổi) — để đội B không gõ trúng từ vừa nghe đội A tả 20 giây trước.

### 3b. Bản gốc v1 (để nhớ gốc tích, không còn chạy)

Đo `IEL-S15.T3.P4.xlsm` sheet `RunningW` ngày 4/8/2026: pool 85 · PART A=50 · PART B=50 ·
A∪B=85 (phủ trọn) · A∩B=15=50+50−85 (trùng ít nhất có thể) — tức KHÔNG PHẢI "xáo pool rồi bốc 50
hai lần" (kiểu đó trùng ~29 từ và bỏ sót cả chục từ). Luật v1 dùng 1 tham số `wordsPerTeam` (Options)
để chọn k rồi chia ngẫu nhiên phủ trọn pool. Luật v2 ở trên bỏ tham số này, thay bằng vị trí cố định.

## 4. Cấu trúc dữ liệu

```js
{
  type: "running_word",
  content: {
    words: ["CYLINDER", "LUXURIOUS", ...],      // pool dùng chung, không clue, không đáp án
    printSets: [ { a:[...], b:[...] }, ... ]     // tối đa 3 bộ đã lưu (Firestore-safe)
  },
  options: {
    timer: "none",              // BẮT BUỘC — game tự chạy 2 đồng hồ
    teamAName, teamBName,
    clockSeconds: 300,           // mỗi đội — chọn qua thanh trượt bậc thang (mục 11), vẫn là 1 số giây thường
    incrementSeconds: 0,         // thưởng kiểu Fischer mỗi từ đúng
    allowPass: true, passPenaltySeconds: 10,
    andrewUses: 1,               // MỖI ĐỘI — nay 1..5, không còn 0 (Off)
    warnSeconds: 15
  }
  // "wordsPerTeam" ĐÃ BỎ (5/8/2026) — chia từ nay 100% tự động theo tổng số từ, xem mục 3.
}
```

⚠️ `printSets` là **mảng các MAP**, mỗi map có 2 field mảng — Firestore cho phép. Tuyệt đối
không đổi thành mảng-lồng-mảng (`[[...],[...]]`), Firestore từ chối thẳng.

## 5. File trong thư mục

| File | Việc |
|---|---|
| `running-word.js` | template chính: setup → 3-2-1 → trận đấu → kết quả |
| `running-word.css` | style (`.aw-rw-*`); có cả phần `@media print` cho 3 tờ giấy |
| `running-word-editor.js` | soạn pool — **1 ô textarea, mỗi dòng 1 từ** (dán thẳng cột Excel) |
| `rw-sets.js` | `buildSets()` + đọc/ghi bộ đã lưu + thống kê |
| `rw-print.js` | dựng 3 trang A4 rồi `window.print()` |
| `rw-sound.js` | âm thanh synth Web Audio (clack đồng hồ, chuông, tick dồn) |
| `sample-running-word.js` | 40 từ thật của bài IEL-S15.T3.P4 |

## 6. Vì sao KHÔNG đụng core (và 2 chỗ được phép đụng)

- **Đồng hồ**: `tpl.hideTimerOption` + `options.timer:"none"` → đồng hồ toàn ván của engine tắt
  hẳn, 2 đồng hồ là của riêng template.
- **Nút Andrew**: dùng khe `extraKey` **đã có sẵn** trong `core/keyboard.js` (Type the answer mở
  đường từ 1/8/2026) — không thêm API mới.
- **In**: `core/print.js` là bộ in DÙNG CHUNG 4 định dạng, quy về `{clue, answer, options}` — hình
  dạng game này không dùng được. Thêm định dạng thứ 5 vào đó = sửa file core mọi template dùng
  chung → **cấm**. Nên 3 tờ dựng ở `rw-print.js` và in từ **màn setup của chính game**. Vẫn xài
  chùa được hạ tầng của core: gắn 1 `div.aw-print-sheet` cạnh `#app` thì `core/app.css` đã lo sẵn
  việc ẩn trên màn hình / hiện khi in / ẩn `#app`.
- **Ẩn 2 mũi tên Back-Next**: scope qua `.aw-playarea:has(> .aw-rw-card) ~ ...` đúng khuôn
  whack-a-mole. TUYỆT ĐỐI không dùng luật trần `.aw-navbtn{display:none}` — CSS template ở lại
  document vĩnh viễn, sẽ giết mũi tên của mọi game mở sau đó (đã cắn thật ở open-the-box, Đợt 61).

**3 chỗ core được phép sửa (thầy duyệt trước):**

1. `core/catalog.js` — thêm đúng 1 mục (đây là cổng tích hợp chính thức của mọi template).
2. `core/lesson-import.js` — thêm `runningWord()` + 1 nhánh: có `WORDTABLE` thì tự sinh act
   `<mã bài> / RUNNING WORD` dùng nguyên cột D (chính là pool 85 từ mà sheet `RunningW` vẫn lấy).
3. `core/engine.js` (5/8/2026) — thêm đúng 1 dòng `stage.classList.add(\`act-${activity.type}\`)`
   ngay sau khi dựng khung, cho MỌI activity (không riêng RUNNINGW). Thuần cộng thêm, không đọc bởi
   CSS template nào khác — cho phép RUNNINGW tự đè khung 4:3 + ẩn 3 nút Assignment/Template/Print
   **ngay từ màn READY**, việc mà `:has(.aw-rw-card)` không làm được vì markup đó chỉ có sau khi
   mount() chạy. Xem mục 8c.

**CHƯA làm (cố ý):** `core/convert.js` chưa có nhánh cho `running_word`, nên game này chưa tham
gia "Change template". Muốn có thì thêm 1 nhánh `toRecords()` + 1 nhánh `buildContent()` — xem
`core/HUONG DAN CORE.md`. Chưa làm vì thầy chọn hướng nhập tự động, và convert vào đây sẽ mất sạch
clue (game này không cần clue nên chiều ngược lại vô hại, chiều xuôi thì mất dữ liệu).

## 7. ⭐ BẪY ĐÃ CẮN THẬT KHI BUILD (4/8/2026)

**(1) Phím Andrew chết cứng — lỗi thật, bắt được bằng cách bấm thử trong trình duyệt.**
`fnKey()` trong `core/keyboard.js` gắn `onclick` **CHỈ KHI phím không disabled lúc DỰNG**:

```js
if (disabled) b.disabled = true;
else if (onClick) b.onclick = ...;
```

và `refresh()` sau đó **chỉ đổi `.disabled`, KHÔNG gắn lại handler**. Bản đầu tôi dựng bàn phím
ngay trong `mount()` — lúc đó game còn ở màn setup, `phase === "setup"` nên `isDisabled()` trả
`true` → phím Andrew sinh ra không có handler, về sau mở khoá mà bấm mãi không ăn.

✅ **ĐÃ VÁ TẬN GỐC Ở CORE (thầy chốt, 4/8/2026)** — `fnKey()` nay luôn gắn handler, `disabled` một
mình quyết định. Lúc vá mới lòi ra **Crossword đã từng dính đúng bẫy này** và phải né bằng tay
(`isDisabled` có điều kiện thừa `curWord >= 0` kèm ghi chú "must NOT be disabled at build time").
Chi tiết + số đo: `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM".
→ Template này **vẫn giữ** việc dựng bàn phím ở `startMatch()`: không còn vì bắt buộc, mà vì màn
setup chẳng có gì để gõ — và như vậy game chạy đúng cả trên bản core cũ.

**(2) Bẫy TDZ `let` — đã tránh trước khi chạy.** `refereeBar()` được gọi TRONG vòng lặp dựng 2
đồng hồ và nó gán vào `refUI`; nếu để `let refUI = null;` ở dưới thì đúng lúc gán biến còn trong
vùng chết → `ReferenceError`. Đã khai `refUI` TRƯỚC vòng lặp. (Đúng bẫy `GHI CHU WHACK-A-MOLE`
Đợt 63 ghi lại — khai báo *hàm* thì hoisted, khai báo `let` thì không.)

**(3) Không nhét `__poolSize` vào `activity.options`.** `buildExtraOptions` chỉ nhận `draft`
(= bản sao options) nên rất dễ nhét số lượng từ vào đó cho tiện — nhưng Apply sẽ `saveActivity`
nguyên cái draft lên Firestore, đẻ rác vĩnh viễn. Dùng biến `poolSizeHint` ở cấp module thay thế
(mỗi lúc chỉ có 1 game được mount nên luôn đúng act).

**(4) Ngân sách chiều cao SAI — bàn phím nuốt sạch 2 cột. Lỗi thật, chỉ lộ ra khi CHỤP ẢNH.**
Tôi tính theo khung 16:9 = 56.25cqw, nhưng **vùng chơi chỉ cao 45.67cqw** (thanh trên + thanh dưới
ăn ~10.6cqw), và bàn phím core ở cỡ gốc chiếm **20.3cqw** chứ không phải ~17.5 như ước lượng:

```
đồng hồ 12.57 + bàn phím 20.30 = 32.9 / 45.67  ->  2 cột còn 9.87cqw = 1.04 DÒNG
```

Tức toàn bộ ý nghĩa của màn hình bị đẩy ra ngoài. **Sửa:** thu đồng hồ (12.57→9.62), thu dòng, thu
bàn phím (20.30→15.35). Muốn thu bàn phím thì phải đè lên class của `core/keyboard.js` — nên **MỌI
luật đó đều scope dưới `.aw-rw-card`**. Luật trần `.aw-kbd-key{...}` sẽ thu nhỏ luôn bàn phím của
**Type the answer và Crossword** suốt phiên, vì CSS template chèn 1 lần và không bao giờ gỡ.
Đo lại: **5 dòng hiện trọn mỗi đội, 0 chồng lấn, 0 tràn.**
→ Bài học: **đừng suy chiều cao từ 56.25cqw — hãy ĐO `.aw-playarea`.**

**(5) Đo giờ trong lúc test đừng hoảng.** Đồng hồ **vẫn chạy giữa 2 lần gọi công cụ**: đo được
"60s → 38s" trong khi script chỉ mất 2s là bình thường (20s kia là thời gian thật trôi qua giữa 2
lệnh), không phải lỗi tính giờ.

## 8. Đã tự test những gì (trình duyệt thật, `test.html`, 0 lỗi console)

Vì màn hình **cố ý không hiện từ**, không script nào đọc trộm được đáp án → test theo kiểu hộp đen:
dựng act pool nhỏ đã biết rồi **dò từng từ** (mỗi lần dò sai cũng chính là 1 ca kiểm thử đường sai).

| Ca | Kết quả đo |
|---|---|
| Chia từ (pool 40, 25/đội) | `25 + 25`, trùng **10** = 2·25−40 ✓, phủ **ALL** ✓ |
| Vào trận | 3-2-1 chạy xong, 2 đồng hồ `1:00`, đội A sáng, ô nhập nằm ở dòng 1 cột A ✓ |
| **Không lộ từ** | quét toàn bộ `.aw-rw-row-body` → **rỗng hoàn toàn** ✓ |
| Gõ SAI (5 lần) | đều bị từ chối, ô viền đỏ, **không nhảy dòng**, đồng hồ vẫn chạy ✓ |
| Gõ ĐÚNG | dòng xanh hiện chữ, **đảo đồng hồ** (A dừng 0:38, B chạy), điểm `1–0`, nav đổi sang BLUES ✓ |
| Andrew | hiện từ vàng đúng dòng đang gõ, phím glow + khoá; gõ lại từ đó → ăn điểm; **đội kia vẫn còn 1 lượt** ✓ |
| PASS | dòng thành `—` (**không lộ từ** ✓), đồng hồ `5:00 → 4:55` đúng −5s, đảo lượt, điểm không đổi ✓ |
| UNDO | huỷ đúng nước vừa rồi, trả lại lượt + trả lại `5:00`, nút tự mờ đi ✓ |
| PAUSE | đồng hồ đứng im 1,4s, khoá Submit; bấm lại thì chạy tiếp ✓ |
| Hết danh sách | `REDS WINS` · "REDS finished the whole list" · bảng 3 words vs 2 words · engine ăn mừng + bảng tổng kết ✓ |
| `allowPass:false` | nút PASS không được dựng ✓ |
| Hết giờ | cảnh báo bật **đúng mốc 0:15**, đếm tới 0:00 hết **đúng 30s**, `BLUES WINS` · "REDS ran out of time", đồng hồ A đỏ `is-dead` ✓ |
| Editor | dán cột Excel + tab + dòng trống → đếm đúng, dedupe/sort chạy, Save **tự loại bộ in đã lỗi thời** (2 bộ chứa từ đã xoá → giữ 0) ✓ |
| In | 3 trang · 50 dòng/tờ · ô tick có · tờ CHECK ghép **đúng cặp A/B theo dòng** ✓ |
| Cỡ in mọi pool thật | 20/40/60/85/100 từ đều **lọt 1 trang**, chữ **9.9–10.5pt** ✓ |
| 4 theme | chữ theo `var(--aw-text)` của theme, tương phản tốt cả 4 (độ sáng nền .96–1.0) ✓ |
| Tap-highlight (TOMKO) | **142/142** phần tử bấm được = `rgba(0,0,0,0)` — thừa hưởng bản vá core v0.9.40, file này **KHÔNG khai lại** ✓ |
| Bố cục | đồng hồ 9.62 + cột 19.40 + bàn phím 15.35 = 44.35 / 45.67cqw · **5 dòng trọn mỗi đội** · 0 chồng lấn ✓ |
| Import `.xlsm` thật | bundle 8 → **9 act**, `IEL-S15.T3.P4 / RUNNING WORD` đúng **85 từ**, giữ `WASH DOWN`/`BRING IN`/`LARGE-SCALE`/`SKIN-SCRAPER`, 114ms ✓ |
| Hồi quy | **15/15 template** mount + có editor, **0 lỗi console** ✓ |

⚠️ **Bẫy của chính khâu TEST:** đừng khôi phục `window.print` ngay sau khi gọi `printRunningSheets()`
— hàm này hẹn `window.print()` sau 60ms, khôi phục sớm là bung hộp thoại In THẬT và **treo cứng
renderer** (đã dính, phải mở tab mới). Trong test hãy giữ bản stub ít nhất 300ms.

## 8b. ⭐ ĐỢT 2 (5/8/2026) — TỐI ƯU IPAD: 8 điểm thầy gửi 1 lượt

Không đụng core. Chỉ 5 file: `running-word.js`, `running-word.css`, `rw-sets.js`, `rw-print.js`,
`sample-running-word.js`.

1. **Khung 4:3 thay 16:9** — RIÊNG game này (iPad màn hình gần 4:3, khung 16:9 cũ để trống 2 bên).
   Kỹ thuật: `.aw-stage:has(.aw-rw-card) { aspect-ratio: 4/3 }` + bản fullscreen riêng cùng công
   thức — **không sửa `core/app.css`**, `:has()` cho phép 1 template tự đè luật khung dùng chung lúc
   chạy, 14 game kia (đã tinh chỉnh cho 16:9) không hề bị đụng tới. Đo trên devserver: stage
   968×726px, tỉ lệ đúng 1.333.
2. **2 đồng hồ lên sát mép trên** — ẩn hẳn thanh trên gốc của engine (đồng hồ tổng + tỉ số A-B, nay
   dư thừa vì đã có 2 đồng hồ đội), 2 đồng hồ đội chiếm luôn vị trí đó (`.aw-stage-inner:has(.aw-rw-
   card) .aw-topbar{display:none}`, luôn luôn, không riêng fullscreen). Mỗi khối đồng hồ CHỈ còn TÊN
   ĐỘI (nhỏ) + THỜI GIAN (to hơn, 3.6→4.4cqw) — bỏ hẳn dòng "words" (số từ vẫn đếm ngầm để tính
   thắng thua + màn kết quả, chỉ không hiện ở đây nữa). Đo: đồng hồ cách mép trên 5.8px trên khung
   968px.
3. **Fullscreen sạch chữ** — bật fullscreen thì ẩn HẾT (Menu · mũi tên Back/Next · nhãn "TEAM A ·
   word N of M" · nút Sound), CHỈ chừa icon Fullscreen (không phải chữ) ở góc để bấm thoát. Bàn cờ
   riêng của game (đồng hồ, dải trọng tài PASS/PAUSE/UNDO, bàn phím) không đụng — chỉ ẩn khung
   CHUNG của engine. 4 biến thể `:fullscreen`/`:-webkit-full-screen`/`:-moz-full-screen`/
   `:-ms-fullscreen` đều viết riêng (đúng luật core: gộp chung 1 dòng thì trình duyệt không hiểu 1
   cái là bỏ CẢ dòng). ⚠️ **Chưa tự bấm fullscreen thật được** (Fullscreen API cần cử chỉ người dùng
   thật, click giả lập của công cụ không tính) — cần thầy bấm thử trên TOMKO/iPad thật.
4. **Bỏ văn bản hướng dẫn** — bỏ dòng phụ đề "Two teams · one chess clock…", dòng ghi chú "This
   split is new…"/"Playing the saved split…", dòng tóm tắt cấu hình dưới nút START MATCH. Giữ lại
   các con số cần thiết (tên đội, đồng hồ, bảng "40 words in pool · 40+40 · shared · pool covered").
5. **Chia từ theo VỊ TRÍ, tối đa 50/bên** — xem mục 3 (đã viết lại). Bỏ hẳn thanh "Words per team".
   Vẫn giữ luật lệch ≥6 dòng cho từ trùng (thầy xác nhận giữ).
6+7. **Tờ in tối ưu** — heading thu nhỏ hẳn (`HEADING_MM` 25→16: tag 7mm→4.6mm, subtitle
   3.4mm→2.6mm, margin/border mỏng lại) để nhường mm cho bảng từ; **bỏ hẳn trần `ROW_MAX_MM`**
   (trước neo 7.4mm dù còn dư trang) — nay dòng LUÔN cao hết mức trang cho phép; tỉ lệ cỡ chữ/dòng
   tăng 0.50→0.62 (chữ áp sát gạch phân cách hơn); gạch phân cách dòng mỏng lại 0.25mm→0.12mm. Đo
   thật (gọi `printRunningSheets` trực tiếp, có "tem" `window.print`): pool 50 từ → 2 cột, dòng
   10.12mm/cỡ chữ 6.27mm (~17.8pt) — gần gấp đôi cỡ chữ cũ (~10.5pt). ⚠️ **Danh sách RẤT ngắn (dưới
   chục từ) sẽ ra chữ RẤT to** (đúng ý "luôn lấp kín trang", nhưng là hệ quả cần thầy biết trước) —
   trò này trong thực tế luôn là danh sách vài chục từ nên không phải ca thật gặp, chỉ ghi chú lại.
8. **Luôn in A4, 1 trang 1 tờ** — vốn ĐÃ đúng từ đầu (cơ chế 2 cột tự chảy khi >~49 từ để giữ chữ to
   mà vẫn lọt 1 trang) — chỉ cần xác nhận vẫn đúng với luật in mới, đã đo OK.
9. **Tờ CHECK: đánh số riêng cho cả 2 nửa** — trước dùng CHUNG 1 cột №; nay mỗi đội có cột № RIÊNG
   (`№ TEAM A № TEAM B`, 4 cột thay vì 3) — vì 2 danh sách không phải cặp khớp theo hàng, đọc dọc
   từng đội cần số riêng.
10. **Andrew help 1..5** — bỏ nấc 0 (Off), thanh trượt nay kéo từ 1 đến 5, không còn hiện "Off".
11. **Thanh "Time each team" kiểu BẬC THANG** — 10 nấc cố định 0:30→5:00 (cách 30s) + **nấc 0 =
    Custom** hiện ra 2 ô số Min/Sec riêng. Mở lại Options sau khi lưu 1 giá trị KHÔNG khớp nấc nào
    (vd giá trị cũ từ thanh trượt liên tục trước đây, hoặc số Custom vừa gõ) → tự nhận ra và mở ngay
    ở Custom với đúng số phút giây đó, không mất dữ liệu act cũ. ⭐ **1 lỗi thật bắt được lúc tự test
    trong trình duyệt**: kéo sang nấc Custom rồi lại tự nhảy về nấc cũ — do hàm vẽ lại đọc lại vị trí
    thanh trượt TỪ giá trị đã lưu (`draft.clockSeconds`) thay vì tin vị trí người dùng vừa kéo, mà lúc
    vừa vào Custom giá trị đó chưa đổi nên tính ngược lại đúng nấc cũ. Sửa: tách hẳn "vẽ lại toàn bộ
    lúc mở panel" khỏi "chỉ đổi 2 nửa hiện/ẩn lúc kéo" — vị trí thanh trượt chỉ do chính thao tác kéo
    quyết định, không bao giờ bị tính ngược lại. Đo lại: kéo nấc 3 → "1:30"; kéo nấc 0 → hiện đúng
    Min/Sec (prefill từ giá trị TRƯỚC đó), thanh trượt đứng yên ở 0; gõ 2 phút 15 giây → Apply → mở
    lại Options → đúng lại ở Custom, "2" / "15".
12. **Bonus 0-15s** — đã đúng sẵn từ trước, không cần sửa.

### Tự test đã chạy (trình duyệt thật qua devserver, không phải đọc code suông)

- Khung: tỉ lệ đo được đúng 4:3 (1.333), thanh trên gốc `display:none`, đồng hồ cách mép trên 5.8px.
- Chia từ: gọi thẳng `buildSets()` — pool 30 (≤50) → 2 đội **giống hệt nội dung**, thứ tự khác nhau;
  pool 70 → A đúng 1-50, B đúng 21-70, trùng đúng 30; pool 120 → trùng 0 (rời hẳn) — khớp 100% công
  thức mới.
- Chơi thật: bấm nút Andrew hiện đúng từ, gõ đúng từ đó → dòng xanh, đồng hồ đảo, điểm cập nhật,
  turn label đổi đội — 0 lỗi console suốt.
- Options: mở panel → đúng đủ 4 nhóm còn lại (Teams/Chess clock/Round chỉ còn Andrew/Pass), kéo
  thanh Time each team qua đủ các nấc + Custom, Apply → Play lại → bảng facts hiện đúng "2:15" đã
  lưu; mở lại Options → đúng lại ở Custom "2"/"15" (round-trip không mất dữ liệu).
- In: gọi thẳng `printRunningSheets()` (có tem `window.print`) với pool 50/30 — ra đúng 3 trang,
  PART A 50 dòng, PART B 30 dòng, CHECK 50 dòng có **4 cột** `№ TEAM A № TEAM B`, cỡ chữ/dòng đúng
  công thức mới, tự chuyển 2 cột đúng lúc.
- Editor + hồi quy: mở Edit không lỗi; toàn bộ trên chạy **0 lỗi console**.

⚠️ **3 việc máy không tự kiểm được, cần thầy** (Fullscreen API cần cử chỉ người thật; hình dạng
khung + cỡ chữ trên giấy cần mắt thật): xem khung 4:3 + đồng hồ trên TOMKO thật; bấm thử fullscreen
thật trên iPad (Chrome) xem có sạch chữ như ý không, nút thoát có dễ bấm không; in thử 3 tờ A4 giấy
thật xem chữ có thật sự to/lấp kín như mong muốn không.

## 8c. ⭐ ĐỢT 3 (5/8/2026) — LÀM LẠI GIAO DIỆN TRẬN ĐẤU THEO BẢN VẼ THẦY GỬI

Thầy gửi ảnh bàn phím + 15 điểm 1 lượt để làm lại màn chơi. **CÓ SỬA CORE 1 dòng** (mục 6, thầy
duyệt trước) — mọi thứ khác chỉ trong `templates/running-word/`.

1. **`.act-running_word`** — `core/engine.js` gắn class này vào `.aw-stage` ngay khi dựng khung
   (mọi activity, không riêng game này), TRƯỚC CẢ màn READY. RUNNINGW dùng class này thay hẳn
   `:has(.aw-rw-card)` cho khung 4:3 + ẩn 3 nút — nay đúng "ngay từ khi mở app" thật sự, đo được:
   `stage.className` đã có `act-running_word` và tỉ lệ 4:3 **trước khi bấm PLAY**.
2. **Ẩn Assignment/Template/Print từ đầu** — 3 nút này không dùng cho 1 trận 2 đội đang chạy trực
   tiếp (Print có sẵn ngay trong màn setup của game). Ẩn qua class ở mục 1, không đụng JS dựng nút
   của engine.
3. **Nút Fullscreen ghim cố định góc phải dưới** (`position:absolute`, mọi màn hình: setup/prep/
   trận đấu/kết quả, fullscreen hay không) — tách hẳn khỏi dòng chảy flex của thanh dưới.
4. **Bàn phím về ĐÚNG size gốc của core** — bỏ hẳn khối đè `--kbd-kw`/`--kbd-caps-w`/... đã làm ở
   Đợt 1 (khi đó thu nhỏ để vừa khung 16:9); nay khung 4:3 + đã bỏ thanh trên + bảng chỉ còn 3 dòng
   nên dư chỗ, không cần thu nữa. Đo: `--kbd-kw` đọc ra đúng `5cqw` (giá trị mặc định của core, y hệt
   Type the answer/Crossword).
5. **Một ô điền chữ thật to, chỉ hiện 3 dòng** — `.aw-rw-rows` chuyển sang `display:flex;flex-
   direction:column`, mỗi `.aw-rw-row` ăn đúng `flex-basis:33.334%` CHIỀU CAO CỦA CHÍNH KHUNG CUỘN
   (không phải cỡ chữ cố định đoán mò) — nên dù chiều cao thật của khung thay đổi theo layout, luôn
   ra ĐÚNG 3 dòng hiện, dòng 4 trở đi phải cuộn. Đo thật: khung cuộn cao 205.25px, 1 dòng 66.98px →
   205.25/66.98 = **đúng 3.00**. Cỡ chữ đo được 34.27px (~26pt) — không còn ép cứng theo cqw đoán
   trước, mà tự nhiên lớn ra nhờ dòng cao hơn.
6. **Bảng 70/30 tự giãn có animation khi đảo lượt** — `.aw-rw-boards` đổi từ `grid` sang `flex`,
   mỗi `.aw-rw-board` có `flex:1 1 0%` + `transition: flex-grow .45s`; đội đang đến lượt
   `flex-grow:7`, đội chờ `flex-grow:3`, KHÔNG lượt nào (màn "prep", xem mục 8) thì cả hai
   `flex-grow` mặc định bằng nhau = 50/50. Chọn `flex-grow` thay vì animate `grid-template-columns`
   vì grid không animate mượt đều trên mọi trình duyệt, flex thì có. Đo thật: chọn đội A → sau
   450ms width đo được 396.8px / 171.2px = **69.9% / 30.1%** (khít 7:3).
7. **Chữ trong bảng luôn căn giữa** — `.aw-rw-row-body` + `.aw-rw-input` + `.aw-rw-reveal`
   (Andrew) đều `text-align:center` (trước đó body/input để mặc định trái, reveal để phải).
8. **Bỏ "TEAM X · word N of M"** dưới bàn phím, thay bằng **slogan "RUNNING WORD IN ANDREW CLASSES"**
   — cùng kiểu chữ mảnh/thưa/xám như Crossword và Speaking cards (`.aw-rw-slogan`, đặt ở đáy khung
   thay vì đỉnh như 2 game kia). `paintNav()` nay luôn gọi `ui.setNav({label:""})`.
9. **Bỏ tên đội khỏi đồng hồ, đồng hồ đẩy lên sát mép trên** — mỗi `.aw-rw-clock` giờ chỉ còn
   `.aw-rw-clock-time`, hộp thu ngắn theo chiều cao (bỏ dòng tên) nhưng cỡ chữ đồng hồ TĂNG
   (4.4cqw → 4.8cqw) vì có thêm chỗ.
10. **Tên đội dời ra giữa bảng gõ từ** — `.aw-rw-rowhead` đổi `justify-content` từ
    `space-between` sang `center`, chỉ còn 1 span tên đội (bỏ span "N words").
11. **Số từ còn lại ra giữa bảng, phía dưới, chỉ 1 số** — thêm `.aw-rw-remaining` (footer riêng,
    NGOÀI vùng cuộn `.aw-rw-rows` nên không bị cuộn mất), tính `list.length − idx[t]` (còn lại,
    không phải đã xong), không còn chữ "words".
12. **Bỏ nút ẩn/hiện bàn phím** — xoá hẳn `hasKeyboardToggle`, `keyboardVisible`, nút trong
    `ui.kbdSlot`; bàn phím dựng ngay khi vào "prep" (màn trận đấu vừa hiện), luôn hiện.
13. **SET có DELETE + đồng bộ máy khác** — nút "DELETE SET" hiện trên MỌI slot đã lưu (không chỉ
    slot đang chọn); bấm → `confirm()` → xoá → `saveActivity()` — **CÙNG một đường lưu** với nút
    Save, nên tự động đồng bộ qua Firestore tới máy/iPad khác giống hệt việc lưu bình thường, không
    cần hạ tầng mới. ⭐ **Sửa luôn 1 kiểu lưu trữ có thể gây lỗi thật** khi có DELETE: bản cũ
    `saveCurrentSet()` NÉN mảng `printSets` bằng `.filter(...)` trước khi lưu — xoá SET 1 khỏi
    `[A,B,C]` từng làm B tụt xuống vị trí 1, C tụt xuống vị trí 2 sau khi tải lại (đổi số SET âm
    thầm). Đổi `readSets()`/lưu sang **theo đúng vị trí** (mảng có thể chứa `null` = ô trống, không
    còn bị nén) — slot i luôn là SET i+1, xoá 1 ô không đụng 2 ô kia. `running-word-editor.js` cũng
    phải sửa theo (đọc `readSets()` giờ có thể trả `null` xen giữa).
    **Shuffle new split khoá lại** khi slot đang chọn đã lưu (`disabled = !dirty`) — phải bấm
    DELETE SET trước mới xáo lại được, để tờ đã in không bao giờ âm thầm lệch với game.
14. **Nút PASS lộ từ màu đen** — bỏ luật "không bao giờ lộ từ" CHỈ riêng cho trường hợp PASS (đúng
    yêu cầu thầy — đội kia có thể thấy từ vừa bị bỏ qua); `.aw-rw-row.is-passed .aw-rw-row-body`
    đổi từ `var(--aw-muted)` (mờ, hiện "—") sang `var(--rw-ink)` (đậm, hiện chữ thật).
15. **Nút Play/Pause to giữa 2 đồng hồ, thay hẳn Pause+Undo cũ** — `.aw-rw-playpause` hình tròn,
    icon Play khi chưa chạy (kể cả đang "prep" chờ bấm), icon Pause khi đang chạy, mờ đi
    (`:disabled`) khi chưa chọn đội (prep) hoặc đã hết ván. Bấm lúc "prep" (đã chọn đội) → chạy
    3-2-1 rồi vào trận; bấm lúc đang chơi → tạm dừng/chạy tiếp. **Nút Undo bị bỏ hẳn** (cùng
    `snapshot()`/`doUndo()`/`undoSnap` — dọn sạch, không còn dùng). Lúc tạm dừng: 2 bảng gõ + bàn
    phím mờ xuống 40% (`.is-dimmed`, `:has()` bắt luôn bàn phím), nhưng nút Play/Pause GIỮ NGUYÊN
    độ sáng để luôn có chỗ bấm chạy tiếp — đo thật: `opacity` 2 bảng và bàn phím đều về đúng `0.4`
    sau khi tạm dừng, quay lại `1`/`.6` sau khi bấm tiếp.

### ⭐ Luồng trận đấu ĐỔI HẲN: thêm màn "prep" giữa START MATCH và 3-2-1

Trước: bấm START MATCH → 3-2-1 luôn. Nay: bấm START MATCH → vào **"prep"** (`phase` mới, giữa
`"setup"` và `"countdown"`) — hiện đủ 2 bảng NGANG NHAU (`turn = null`, chưa đội nào được chọn),
đồng hồ đứng yên. Trọng tài **chạm vào 1 bảng** để chọn đội đi trước (bảng đó giãn ra 70%, nút
Play/Pause mở khoá) — chạm bảng kia để đổi ý bất cứ lúc nào trước khi bấm Play. Bấm nút Play mới
chạy 3-2-1 rồi vào "play" (đồng hồ bắt đầu chạy, gõ được). `paintBoard()` tính độ giãn theo
`showSplit = phase is "prep"/"countdown"/"play"` — cùng 1 công thức xuyên suốt 3 giai đoạn, không
phải viết riêng cho từng giai đoạn.

### Tự test đã chạy (trình duyệt thật qua devserver, sau cả 2 đợt sửa)

- Khung + nút ẩn: `stage.className` đã có `act-running_word` VÀ tỉ lệ đo được đúng 4:3 **trước khi
  bấm PLAY** (còn ở màn READY); nút Template/Set assignment/Print `display:none` cùng lúc; nút
  Fullscreen `position:absolute` sẵn từ đầu. Hồi quy: mở `type-the-answer/test.html` — vẫn
  `act-type_the_answer`, tỉ lệ đúng 16:9, 0 lỗi console (đúng cam kết core chỉ CỘNG THÊM).
- Prep: bấm START MATCH → 2 bảng đúng bằng nhau (cả 2 `is-pickable`, không bảng nào `is-active`),
  bàn phím đã dựng, Play/Pause `disabled=true`. Chạm bảng A → `is-active`/nút mở khoá ngay; đo sau
  450ms width 396.8px/171.2px = đúng 70/30.
- Chơi thật: bấm Play → 3-2-1 → trận chạy (đồng hồ đếm ngược đúng), 3 dòng hiện đúng
  (205.25/66.98=3.00), cỡ chữ 34.27px; bấm PASS → từ hiện màu ink thật (không còn "—"), đổi lượt
  đúng; bấm Play/Pause giữa trận → cả 2 bảng + bàn phím `opacity=0.4`, bấm lại → về bình thường; gõ
  đúng từ Andrew tiết lộ → điểm cộng, remaining giảm 40→39, đổi lượt — **0 lỗi console** suốt.
- SET delete: dựng 1 act giả có SET 1 đã lưu sẵn → Shuffle tự khoá đúng tooltip, đúng 1 nút DELETE
  SET hiện (chỉ ở slot đã lưu); bấm xoá (chưa đăng nhập) → lỗi được bắt gọn bằng toast/`console.warn`,
  không crash — cùng hành vi với nút Save khi chưa đăng nhập (nhất quán).

⚠️ **Vẫn còn 3 việc chỉ thầy làm được** (không đổi so với Đợt 1): xem khung + đồng hồ + bảng 70/30
trên TOMKO thật; bấm fullscreen thật trên iPad (Fullscreen API cần cử chỉ người dùng thật); in thử
giấy A4 thật.

## 8d. ⭐ ĐỢT 3 (5/8/2026, v0.9.45) — 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ. KHÔNG ĐỤNG CORE.

Thầy chơi bản Đợt 2 rồi gửi ảnh + 8 điểm. Chỉ 2 file: `running-word.js`, `running-word.css`.

1. **Nút Play/Pause nhạy + hình vuông bo tròn.** ⭐ **Bắt được lỗi thật gây "lúc bấm được lúc
   không"**: `paintClocks()` chạy mỗi 100ms (mỗi nhịp đồng hồ) và **gán lại `innerHTML` của nút mỗi
   lần** → thẻ `<svg>` con bị thay mới 10 lần/giây; một cú chạm mà `pointerdown` rơi vào SVG cũ còn
   `pointerup` rơi vào SVG mới thì **trình duyệt không phát sự kiện `click`** → mất cú bấm. Vá 2 lớp:
   (a) chỉ đổi `innerHTML` **khi icon THỰC SỰ đổi** (lưu `refUI._icon`), (b) `svg { pointer-events:
   none }` để cú chạm luôn rơi vào NÚT chứ không vào SVG con. Đo: bấm 4 lần liên tiếp play→pause→
   play→pause đều đổi icon+class đúng, không lần nào kẹt. Hình: tròn → **vuông bo tròn** (`border-
   radius:1.4cqw`), thu còn 5.4cqw.
2. **Slogan về hàng nút Menu + đổi màu nhìn được.** Bản Đợt 2 slogan là `div` position:absolute đáy
   khung → **đè lên bàn phím** (ảnh thầy gửi), lại màu xám nhạt trên nền trắng khó thấy. Nay bỏ hẳn
   div đó, **đưa slogan vào NHÃN NAV** (`ui.setNav({label:SLOGAN})`) — nằm giữa thanh dưới, **cùng
   hàng nút Menu**, 2 mũi tên 2 bên đã ẩn (`visibility:hidden`) nên chỉ còn slogan ở giữa; màu
   `var(--aw-muted)` (xám đậm, rõ trên nền trắng). Style thin/spaced/uppercase kiểu Crossword. Đo:
   nhãn hiện đúng "RUNNING WORD IN ANDREW CLASSES", màu rgb(107,122,144), nằm ở dải nút Menu.
3. **Icon loa ↔ fullscreen hết đè nhau.** Nguyên nhân: Đợt 2 ghim `.aw-fs-always { position:
   absolute; right/bottom }` → nút fullscreen tách khỏi dòng chảy và đúng chỗ nút loa (cũng ở góc
   phải thanh dưới) → 2 cái chồng. Vá: **bỏ hẳn cái ghim** — fullscreen nằm tự nhiên trong cụm
   `.aw-tools` (loa + fullscreen) vốn LUÔN ở góc phải-dưới thanh dưới ở mọi trạng thái, nên vẫn
   "luôn góc phải dưới" như thầy muốn mà không đè. Đo: fs [495-515] vs loa [472-493] — tách hẳn.
4. **Chữ trong ô tự co, hết "…" (và mọi ô cùng cỡ).** Mỗi bảng có biến `--rw-fit`: hàm `fitBoard()`
   dùng 1 span PROBE đo bề rộng thật của từ ở cỡ gốc (5.6cqw), so với bề rộng cột hiện có; lấy tỉ lệ
   để **từ RỘNG NHẤT trong 3 ô vừa khít**, rồi mọi ô/ô-nhập/reveal nhân cùng `--rw-fit` → 3 chữ luôn
   CÙNG cỡ, không cái nào bị cắt "…" (đã bỏ luôn `text-overflow:ellipsis`). Chạy lại mỗi lần vẽ +
   theo `ResizeObserver` nên co giãn mượt suốt lúc bảng phình 70%↔30%. Đo bảng hẹp 30% (142px):
   fit=0.711, cả LUXURIOUS/INSCRIBE/REINFORCE cùng 20px, **0 chữ bị cắt**.
5. **Đồng hồ thấp hơn.** `.aw-rw-clocks` đổi `align-items: stretch → center` (trước bị kéo cao bằng
   cột giữa play+pass → thừa khoảng trắng trong hộp), + padding dọc hộp về ~0.15cqw. Đo hộp đồng hồ
   nay cao 28px (trước cao gần gấp đôi).
6. **⭐ Bảng CHỈ 3 Ô — input LUÔN ở đáy, đẩy lên khi đảo lượt** (yêu cầu lớn nhất). Bỏ hẳn kiểu cuộn
   cả danh sách. Mỗi bảng nay là **cửa sổ cố định 3 dòng** (`.aw-rw-rows` overflow hidden), toàn bộ
   từ nằm trên 1 `.aw-rw-track` được **trượt bằng `translateY`** (JS `applyTrack`) sao cho dòng "đáy"
   rơi vào 1/3 dưới. Dòng đáy = ô nhập khi tới lượt mình (`bottomIndexOf` = idx), hoặc từ vừa xong
   khi đang chờ (= idx−1). 2 dòng trên là 2 từ trước. Đảo lượt → track trượt lên 1 dòng (transition
   .35s) = hiệu ứng "đẩy lên". Đo đúng kịch bản thầy tả: gõ từ 5 → hiện 3-4-5 (5 là ô nhập ở đáy);
   submit → chờ, bảng vẫn 3-4-5 (5=done ở đáy); tới lượt lại → **đẩy lên thành 4-5-6**, ô nhập là 6.
   Số dòng đo chính xác 3.00 (viewport 205px ÷ dòng 51px×... = 3). ⭐ Số từ CÒN LẠI ở chân bảng vẫn
   giữ (Đợt 2). Bỏ hàm `keepInView` cũ.
7. **⭐ Sửa màn GAME COMPLETE bị kẹt (thầy báo hết giờ thì không bấm gì được).** Nguyên nhân đo được:
   bảng kết quả riêng `.aw-rw-result` để **z-index 45**, còn bảng tổng kết của engine (`.aw-backdrop`
   chứa GAME COMPLETE) chỉ **z-index 13** → bảng kết quả CHE MẤT bảng tổng kết, thầy thấy màn kết quả
   không nút bấm còn bảng thật thì nằm dưới. Vá: khi tới lúc gọi `ui.finish()` (sau 2.6s ngắm bảng
   kết quả) thì **gỡ hẳn `.aw-rw-result`** → bảng GAME COMPLETE hiện lên trên cùng, bấm được. Đo:
   sau khi hết ván, `.aw-rw-result` đã biến mất, `.aw-panel` "TEAM A WINS" hiện với 4 nút
   (Leaderboard / Show answers / Start again / Play a different template), `elementFromPoint` giữa
   panel trả về chính panel (không bị chặn); bấm "Start again" → về màn READY đúng.
8. **Bàn phím giữ đúng size gốc** (đã làm ở Đợt 2, xác nhận lại không bị 4:3 làm méo): `--kbd-kw`
   vẫn `5cqw` như Type the answer.

**Bài học đo đạc (dùng lại được):** khi kiểm tra "đội nào đang active" bằng script, ĐỪNG viết
`className.includes('is-a')` — chuỗi `is-active` CHỨA `is-a` nên luôn khớp nhầm. Dùng
`classList.contains('is-active')` + kiểm `is-a`/`is-b` riêng.

**Tự test devserver (trình duyệt thật, 0 lỗi console suốt):** khung vẫn 4:3; play/pause vuông bo
tròn + toggle 4 lần đều đúng; slogan ở hàng Menu màu xám rõ; loa/fullscreen tách hẳn; cửa sổ 3 ô
đúng kịch bản gõ-5 → đẩy-lên-6; bảng hẹp 30% co chữ cùng cỡ 0 cắt; đồng hồ thấp 28px; hết ván →
GAME COMPLETE hiện + bấm được + Start again về READY.

⚠️ **Vẫn 3 việc chỉ thầy làm được** (không đổi): TOMKO thật, fullscreen iPad thật, in giấy A4 thật.

## 9. VIỆC ĐANG CHỜ

- [x] ~~Commit + push + `curl` kiểm bản live (đợt 1)~~ — XONG 4/8/2026, commit **`7d721a7`**.
- [ ] **Đợt 2 + Đợt 3 (5/8/2026, v0.9.44 + v0.9.45) — thầy duyệt rồi mới commit + push (gộp cả 3 đợt).**
- [ ] **Thầy xem khung 4:3 + 2 đồng hồ trên TOMKO thật** — có vừa mắt hơn 16:9 cũ không.
- [ ] **Thầy bấm thử Fullscreen thật trên iPad/TOMKO** — có sạch chữ như ý không, nút thoát (icon góc)
      có dễ thấy/dễ bấm không (máy không tự bấm fullscreen được — cần cử chỉ người dùng thật).
- [ ] **In thử 3 tờ ra giấy A4 thật** — chữ có thật sự to/lấp kín trang như ý không (nay không còn
      trần 7.4mm, danh sách 50 từ tính ra ~17.8pt — máy mới TÍNH được, chưa cầm được tờ giấy), gạch
      phân cách mỏng có còn rõ không, ô TURN đủ to để tick không.
- [ ] Cân nhắc sau: cho `running_word` vào `core/convert.js` để đổi qua lại với các act từ vựng.
- [ ] Cân nhắc sau: chế độ 1 đội để giao bài `play.html` cho HS tự luyện.

## 10. ĐỀ XUẤT SỬA CORE

1. ✅ **ĐÃ LÀM (thầy chốt 4/8/2026)** — `core/keyboard.js` `fnKey()` nay **luôn gắn `onclick`**, để
   `disabled` một mình lo việc chặn (`extraKeyEl()` cũng thôi truyền `null`). Xoá hẳn cái bẫy im
   lặng ở mục 7.1 cho MỌI template về sau. Chi tiết + số đo hồi quy:
   `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM".
2. ⬜ **`core/print.js` — hook `tpl.printFormats`** để template tự khai định dạng in riêng, thì nút
   Print chung dưới khung mới in được 3 tờ của game này (giờ phải in từ màn setup).
