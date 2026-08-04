# GHI CHU RUNNING WORD (RUNNINGW)

> **TRẠNG THÁI: ✅ ĐÃ COMMIT (`7d721a7`) + PUSH + LIVE** (4/8/2026) — đã chạy lại trọn bộ kiểm tra
> TRÊN CHÍNH BẢN LIVE (`andrewclasses-01.github.io/AWord/templates/running-word/test.html`):
> 15/15 template mount, chia từ đúng công thức, chơi trọn 1 ván ra kết quả đúng, 0 lỗi console.
> ⬜ **Còn chờ thầy nghiệm thu 2 việc máy không thay được**: chơi trên TOMKO (cỡ chữ + đồng hồ nhìn
> từ cuối lớp) và **in thử 3 tờ A4 giấy thật** (50 dòng lọt 1 trang? ô TURN đủ to để tick?).
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

## 3. ⭐ THUẬT TOÁN CHIA TỪ — đo từ file thật của thầy

Đo `IEL-S15.T3.P4.xlsm` sheet `RunningW` ngày 4/8/2026:

```
pool (WORDTABLE cột D) = 85 từ
PART A = 50 · PART B = 50
A ∪ B = ĐÚNG 85   -> phủ TRỌN pool, không sót từ nào
A ∩ B = ĐÚNG 15   = 50 + 50 − 85 -> số từ trùng ÍT NHẤT có thể
```

Tức là **KHÔNG PHẢI** "xáo pool rồi bốc 50 hai lần" (kiểu đó trùng ~29 từ và bỏ sót cả chục từ).
Luật thật là: **phủ hết pool, chỉ chia sẻ đúng số từ buộc phải chia sẻ**. `buildSets()` cài đúng vậy:

- `2k ≤ n` → 2 danh sách **rời hẳn nhau**
- `2k > n` → phủ trọn pool, trùng `2k − n` từ (ca lớp học bình thường)

**Thêm 1 ràng buộc mà Excel không làm được:** từ TRÙNG phải **lệch vị trí ≥ 6 dòng** giữa 2 danh
sách (`MIN_SHARED_GAP`) — nếu không đội B gõ đúng cái từ vừa nghe explainer đội A tả 20 giây trước.
Hàm `separateShared()` hoán đổi có giới hạn vòng lặp, không bao giờ quay vô tận.

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
    clockSeconds: 300,           // mỗi đội
    incrementSeconds: 0,         // thưởng kiểu Fischer mỗi từ đúng
    wordsPerTeam: 0,             // 0 = cả pool cho mỗi đội
    allowPass: true, passPenaltySeconds: 10,
    andrewUses: 1,               // MỖI ĐỘI
    warnSeconds: 15
  }
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

**2 chỗ core được phép sửa (thầy duyệt trước ngày 4/8/2026):**

1. `core/catalog.js` — thêm đúng 1 mục (đây là cổng tích hợp chính thức của mọi template).
2. `core/lesson-import.js` — thêm `runningWord()` + 1 nhánh: có `WORDTABLE` thì tự sinh act
   `<mã bài> / RUNNING WORD` dùng nguyên cột D (chính là pool 85 từ mà sheet `RunningW` vẫn lấy).

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

## 9. VIỆC ĐANG CHỜ

- [x] ~~Commit + push + `curl` kiểm bản live~~ — XONG 4/8/2026, commit **`7d721a7`**. Bẫy quen tái
      diễn đúng như ghi chú cũ: **lần `curl` đầu Pages còn trả file CŨ, lần 2 mới đủ 6 file.** Đã chạy
      lại trọn bộ kiểm tra trên chính bản live (mở thẳng test.html trên Pages, không phải local).
- [ ] **Thầy chơi thử trên TOMKO** — nhất là cỡ chữ ô nhập và 2 mặt đồng hồ nhìn từ cuối lớp.
- [ ] **In thử 3 tờ ra giấy A4 thật** — kiểm 50 dòng có lọt đúng 1 trang không, ô TURN đủ to để tick.
      Máy mới chỉ TÍNH được chiều cao trang (85 từ → 2 cột, dòng 7,4mm, chữ 10,5pt, cần 210/269mm),
      chưa cầm được tờ giấy.
- [ ] Cân nhắc sau: cho `running_word` vào `core/convert.js` để đổi qua lại với các act từ vựng.
- [ ] Cân nhắc sau: chế độ 1 đội để giao bài `play.html` cho HS tự luyện.

## 10. ĐỀ XUẤT SỬA CORE

1. ✅ **ĐÃ LÀM (thầy chốt 4/8/2026)** — `core/keyboard.js` `fnKey()` nay **luôn gắn `onclick`**, để
   `disabled` một mình lo việc chặn (`extraKeyEl()` cũng thôi truyền `null`). Xoá hẳn cái bẫy im
   lặng ở mục 7.1 cho MỌI template về sau. Chi tiết + số đo hồi quy:
   `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM".
2. ⬜ **`core/print.js` — hook `tpl.printFormats`** để template tự khai định dạng in riêng, thì nút
   Print chung dưới khung mới in được 3 tờ của game này (giờ phải in từ màn setup).
