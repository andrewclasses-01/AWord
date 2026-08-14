# GHI CHÚ QUIZ

## Đợt 155 (14/8/2026) — ⭐ THAM GIA CHẾ ĐỘ MỚI **SHOWDOWN** (thêm ĐÚNG 1 DÒNG)

✅ **COMMIT `57677cf` + PUSH + LIVE** (14/8/2026). `quiz.js` chỉ thêm **`showdownMode: true`** — không một dòng nào khác.

Giống hệt lý do ở Anagram: engine đọc `ui.setNav({index})` và mảng `review` mà file này vốn đã có.
Chi tiết: `core/HUONG DAN CORE.md` mục **SHOWDOWN MODE**, `../../GHI CHU DU AN.md` Đợt 155.

⭐ **Quiz là bằng chứng ô tên thuộc về ENGINE, không phải mượn của Anagram**: Quiz **không khai**
`hasSloganSlot`, vậy mà dòng tên vẫn hiện đủ — engine tự dựng ô giữa khi Showdown bật.

🟢 Đo thật (localhost): vòng lượt đúng **1,2,3,1,2,3**; Show answers ra **4/6**, ba khối
`1✓1✗ · 1✓1✗ · 2✓0✗` cộng lại đúng 4; câu sai hiện cả hai dòng (`✗ beatiful` rồi `✓ beautiful`).
0 lỗi console.

---

## Đợt 146 (14/8/2026) — EDITOR CÓ TAB **PRACTICE | HOMEWORK**, SỬA ĐƯỢC CẢ 2 NỬA

✅ **THẦY DUYỆT** ("commit + push live", 14/8/2026) **→ COMMIT + PUSH + LIVE.** Chỉ sửa `quiz-editor.js`; **file game không đụng một dòng** (nó nhận act
đã được lõi bẹp sẵn xuống 1 nửa — hợp đồng ở `core/HUONG DAN CORE.md` mục "MỘT ACT MANG 2 NỬA").

Bài đọc hiểu nhập từ Excel nay là **MỘT act mang cả 2 nửa** (QUIZ1 = PRACTICE, QUIZ2 = HOMEWORK), thay vì 2 act rời có đuôi `" HW"`.
Editor mở ra ở **nửa act đang chơi**, có tabs `PRACTICE | HOMEWORK` ngay trên thanh bulk (đặt trên vì
tab đổi **danh sách mà mấy nút bulk tác động vào**).

- ⚠️ **Chỗ nguy hiểm**: trong editor, `sets` giữ **mọi nửa** còn `content[itemsKey]` chỉ là **chỗ nháp
  của tab đang mở**. Không tách ra thì mở tab HOMEWORK = ghi thẳng vào mảng mà cả app đọc như nửa
  practice ⇒ **mất sạch nửa practice**. Phải gọi **`foldEditedSet()` trước khi Save**.
- Đổi tab **KHÔNG đụng `options.contentSet`** — sửa nửa homework không được phép âm thầm khiến lớp sau
  mở act ra gặp đề homework.
- **Nắn cả HAI nửa** lúc normalize, không chỉ nửa đang mở: nếu không, bấm sang tab kia là bộ dựng hàng
  nhận đúng hình dạng file import để lại, và nửa rỗng sẽ mở ra không có hàng nào để gõ.
- Validate chạy trên **hàng đang thấy** rồi mới fold, để báo lỗi trỏ đúng thứ thầy nhìn thấy.
- 🟢 Test thật trong trình duyệt: tabs đúng, bấm sang HOMEWORK thấy đúng hàng của nửa kia, sửa rồi Save
  thì **mỗi nửa giữ đúng phần sửa của mình**, dạng lưu đúng (nửa đầu không bị nhân bản vào `sets`).
  Đối chứng: act **không có nửa 2** thì **0 tab** và Save ra `content` y như trước.


**TRẠNG THÁI: ✅ ĐÃ CHỐT + LIVE** (Quiz là template GỐC của dự án — công thức rút ra từ nó nằm ở
`../CONG THUC MAU.md`, nên trước nay Quiz không có file ghi chú riêng. File này mở từ 4/8/2026 để
các đợt sửa Quiz về sau có chỗ ghi, khỏi phải đọc ngược `../../GHI CHU DU AN.md`.)

**File của template:** `quiz.js` · `quiz.css` · `sample-quiz.js` · `quiz-editor.js` · `quiz-sound.js`
(+ `sounds/` 10 file mp3 pack Wordwall "Block" · `test.html`/`test.js` do engine tạo sẵn).

---

## ⭐ ĐỢT 139 (13/8/2026) — TIME COST (trừ điểm mỗi giây TRỐNG)

✅ **THẦY DUYỆT → COMMIT `c840baf` + PUSH + LIVE.** Chi tiết đầy đủ: `../../GHI CHU DU AN.md` Đợt 139.
Hợp đồng dùng chung: `../../core/HUONG DAN CORE.md` mục "TIME COST".

Quiz là template thứ 2 nhận tính năng này, và là **ca chứng minh giá trị của việc để hiệu ứng nằm ở
core**: Quiz vốn KHÔNG có hoạt cảnh điểm nào của riêng nó (chỉ gọi `ui.setScore`), vậy mà vẫn được
nguyên bộ "số đỏ bay vào đồng hồ + điểm chạy giảm" mà không phải viết một dòng hoạt cảnh nào.

**Quiz phải làm gì — đúng 5 chỗ:**
1. `timeCost: true` trong object template.
2. `scoreNow()` trừ thêm `ui.timeCostTotal()`.
3. `ui.setScoreProvider(scoreNow)` + `ui.setIdleGuard(...)` ngay sau `ui.onSubmit(...)`.
   Guard = `animating || ending || finished || fightLocked() || state[index].chosen !== null ||
   voicePlayer.isPlaying()`.
   ⚠️ **`chosen !== null`** là vế quan trọng nhất: câu đã trả lời thì không rút lại được, ngồi nhìn nó
   không phải là chần chừ. Đo thật: trả lời xong rồi để yên 4s+ → **không bị trừ đồng nào**.
4. `ui.noteActivity()` trong `choose()` (chọn đáp án = tiến triển của game này) **và trong `doSwap()`
   ngay sau `applyQuestion(i)`** — thiếu chỗ thứ hai thì câu mới vừa hiện đã bị trừ ngay, vì thời gian
   trống nợ từ câu trước vẫn còn nguyên.
5. `raw.score` ở `finish()`: điều kiện mở rộng thành `pointsOff || ui.timeCostTotal()` (2 thứ đều tắt
   thì `scoreNow()` = số câu đúng = đúng mặc định của `computeResult` ⇒ zero-diff).

**Đã đo**: đơn → -20/giây đúng nhịp, trả lời xong thì đứng im, bấm Next sang câu mới trừ lại ngay;
bảng tổng kết hiện **Score -169/6** (khoản trừ vào cả điểm xếp hạng + leaderboard).
**Đấu Quiz**: 2 đội bị trừ độc lập; ca "A trả lời rồi, vòng còn mở" → A đứng im còn **B vẫn bị trừ**,
đúng luật Đợt 128 (B vẫn đang chơi được và vẫn thắng vòng được).

---

## ⭐ ĐỢT 129 (12/8/2026) — GIẤU ✓/✗ TỚI KHI CẢ 2 ĐỘI XONG + NEXT/BACK ĐỒNG BỘ TỪNG KHUNG HÌNH

✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** Luật chung: `../../GHI CHU DU AN.md` Đợt 129 +
`../../core/HUONG DAN CORE.md` mục "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ".

**Lỗi Đợt 128 để lại**: đội trả lời sai trước được hiện "phản hồi sai như bình thường" — nhưng phản hồi
đó gồm **✓ đặt lên ô ĐÚNG** và **làm mờ mọi ô sai**. ⚠️ Riêng việc làm mờ đã đủ lộ: ô đúng là ô DUY
NHẤT còn sáng. Đội còn đang chọn chỉ việc nhìn sang bàn kia.

**Sửa**: trong fight, `choose()` **không vẽ gì cả** — không badge, không dấu bay, không làm mờ; chỉ để
`syncFightLock()` phủ xám. `revealFightMarks()` (khai qua `reveal` trong `ctl.attach`) vẽ tất cả khi
trọng tài báo vòng đã ngã ngũ. Bàn **chưa kịp trả lời cũng được gọi** → nó thấy ✓ nằm ở đâu (đúng ý
thầy: "cả 2 bên biết mình làm sai gì và đúng là đáp án nào"); `addBadges` với `chosen = null` tự lo
đúng việc đó (chỉ đánh ✓, không đánh ✗ vào đâu).
Điều kiện xám nay là `locked && (!answered || fightPendingReveal)` — bàn đã trả lời vẫn xám **trong lúc
còn giấu**, hết giấu thì bỏ xám để ✓/✗ của nó đọc rõ. `applyQuestion()` xoá cờ giấu khi sang câu mới
(ô đáp án dùng lại giữa các câu nên không xoá là câu sau bị xám oan).
**Âm thanh vẫn phát bình thường** — tiếng đúng/sai chỉ nói đội đó làm sao, không chỉ ra đáp án nào.

**Đo thật** (bàn 0 chọn sai trước, bàn 1 chọn đúng sau):
| | badge | dấu bay | ô mờ | xám | khoá |
|---|---|---|---|---|---|
| bàn 0 vừa SAI | **0** | **0** | **0** | có | có |
| bàn 1 lúc đó | 0 | 0 | 0 | **không** | **không** |
| bàn 0 sau khi bàn 1 xong | **2** (✗+✓) | 0 | 3 | hết | có |
| bàn 1 sau khi xong | **1** (✓) | 0 | 3 | hết | có |

**Next/Back đồng bộ**: `showQuestion()` nay báo `boardMoved` **TRƯỚC** hoạt cảnh (trước báo trong
`doSwap` = sau khi hoạt cảnh rời câu xong ⇒ bàn kia trễ ~130ms), và `jumpTo()` **bỏ kiểu cắt phụt**,
gọi thẳng `showQuestion()` với đúng chiều nên 2 bàn chạy CÙNG một hoạt cảnh. Đo: bấm Previous chỉ ở
bàn 0 → opacity 2 bàn trùng khít từng khung (`0.76/0.76 · 0.38/0.38 · 0.12/0.12 · 0.02/0.02 …`).

---

## ⭐ ĐỢT 128 (12/8/2026) — TRẢ LỜI NHANH MÀ SAI THÌ KHÔNG CƯỚP ĐƯỢC CÂU CỦA ĐỘI KIA

✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** Luật chung + phần trọng tài: `../../GHI CHU DU AN.md` Đợt 128
và `../../core/HUONG DAN CORE.md` mục "XONG TRƯỚC ≠ THẮNG".

Trước đây Quiz báo `wordDone(side, {index})` **không kèm đúng/sai**, nên trọng tài coi ai bấm trước là
thắng ⇒ bấm bừa thật nhanh là cướp mất câu. Nay báo **`{index, correct: st.correct === true}`** — chỉ
1 dòng ở `choose()`, phần luật nằm hết bên trọng tài.

Hệ quả trong lớp: đội bấm bừa trước mà sai thì **tự khoá mình lại** (kèm phản hồi sai bình thường: ô
sai mờ 15%, dấu ✗, ô đúng giữ màu), còn đội kia **không bị chặn, không bị đổi màu**, vẫn trả lời và
**vẫn ăn được câu đó**.

**Đo thật** (bấm bằng script để khống chế thời gian — mỗi lượt gọi công cụ tốn vài giây, dễ vượt mốc
chốt chặn 20s):

| Kịch bản | Đội làm trước | Đội kia | Điểm |
|---|---|---|---|
| A sai trước → B đúng sau | khoá, **KHÔNG xám**, giữ ✗ + 3 ô mờ | **không khoá, không xám, opacity 1, còn nguyên màu** | **0–1, B THẮNG** |
| A đúng trước | khoá, không xám | **khoá + xám** `.55`, ô `rgb(179,186,195)` | 1–0 |
| Cả hai cùng sai | khoá | khoá | 0–0, sang câu sau **2458ms** |

---

## ĐỢT 127 (12/8/2026) — ĐỘI XỬ LÝ MUỘN: HÀNG ĐÁP ÁN MẤT MÀU + MỜ ĐI NGAY

✅ **THẦY DUYỆT → COMMIT + PUSH + LIVE.** Chi tiết chung: `../../GHI CHU DU AN.md` Đợt 127.

Ngay khi đội kia trả lời xong, hàng đáp án của khung này mất màu + mờ đi, để cả lớp NHÌN là biết vòng
đã ngã ngũ chứ không phải bấm mới biết. Class `is-fightlost` trên `.aw-quiz-answers`, `opacity:.55`.

⚠️ **Điểm kỹ thuật đáng nhớ**: KHÔNG đè thẳng `background` của ô, mà đè **2 biến
`--tile-eff` / `--tile-dark-eff`**. Lý do: cả mặt ô (`background`) LẪN **cái vành 3D**
(`box-shadow`) đều đọc qua đúng 2 biến đó (xem `.aw-quiz-tile`), nên đè biến thì vành xám theo luôn;
đè `background` thì mặt ô xám mà vành vẫn còn màu cũ thò ra rất lộ. Đo thật lúc đang khoá: mặt ô từ hổ
phách `rgb(245,158,11)` → `rgb(179,186,195)`, **vành `rgb(152,160,170)`**, `opacity 0.55`, **0 lần
dựng lại thẻ card**.

Khung **TỰ trả lời xong thì KHÔNG mờ** (`locked && !answered`) — nó cũng bị khoá vì vòng đã xong, nhưng
nó đã chơi, giữ nguyên màu + dấu ✓/✗ của mình. `syncFightLock()` (có từ Đợt 125) nay lo cả class này;
`applyQuestion()` gọi lại nó ở cuối vì **các ô đáp án được DÙNG LẠI giữa các câu** (đó là thứ khiến
chuyển câu không nháy) — không gọi thì vòng thua sẽ để hàng đáp án xám sang cả câu sau.

Đợt này Quiz cũng nhận được **đổi template ngay giữa trận đấu** (phần core, xem nhật ký chung).

---

## ⭐⭐ ĐỢT 125 (12/8/2026) — QUIZ TRỞ THÀNH TEMPLATE THỨ HAI KHAI `fightMode` (THỬ NGHIỆM)

✅ **THẦY DUYỆT → COMMIT `0523bef` + PUSH + LIVE.** Chi tiết đầy đủ (kèm cả phần sửa core dùng chung cho mọi
template sau này, và tiếp tục ở Đợt 126 — chỉnh cỡ chữ + dời ô điểm tay): `../../GHI CHU DU AN.md`
Đợt 125 + 126. Đây chỉ tóm tắt phần RIÊNG của Quiz.

Sau Anagram (Đợt 124, template đầu tiên), thầy chốt **"áp dụng tạm cho Quiz"** để thử Fight mode ở
template thứ hai. `quiz.js` thêm `fightMode: true` + đọc `activity._fight` giống hệt khuôn Anagram,
nhưng **nhẹ hơn nhiều**: Quiz không có hoạt ảnh bay điểm riêng, `ui.setScore()` sẵn có đã được engine
tự chuyển tiếp vào `fight.ctl.onScore()` — không phải viết thêm dòng nào cho phần điểm.

- `choose(i)`: chặn thêm `fightLocked()`; sau khi chấm (đúng/sai đều tính — 1 lượt bấm là xong câu,
  không sửa lại được) gọi `fightCtl.wordDone(fightSide,{index})`.
- Auto "Game complete" khi trả lời hết bị tắt trong fight (`!fightCtl &&`) — trọng tài tự kết thúc
  trận qua `advanceRound()`/`endMatch()` của `core/fight.js`, gọi `finish()` cục bộ nữa sẽ đua với nó.
- `showQuestion()` (tự bấm ‹ ›) báo `fightCtl.boardMoved()`; hàm mới `jumpTo()` (trọng tài đẩy khung
  này đi vì khung kia vừa bấm) đổi câu ngay, không hoạt ảnh trượt — 2 đường tách riêng để không vòng
  lặp báo ngược nhau.
- Giọng đọc autoplay thêm điều kiện `fightCtl.speaks(fightSide)` — chỉ khung 0 đọc.
- **Đơn giản hoá cố ý, chưa làm**: 2 khung KHÔNG chia sẻ thứ tự xáo đáp án (như Anagram chia sẻ
  `_fightOrder` cho thứ tự chữ cái) — nếu bật `shuffleAnswers`, 2 khung có thể hiện đúng đáp án nhưng
  ở VỊ TRÍ khác nhau. Không ảnh hưởng ai thắng, chỉ là bố cục khác nhau; để tạm đúng tinh thần "thử
  nghiệm", bàn thêm sau nếu thầy muốn giống Anagram.

⚠️ **Điều kiện để làm được**: `core/fight.js` trước đó đọc cứng `activity.content.items` (chỉ đúng
Anagram) — phải tổng quát hoá sang `getTemplate(activity.type).itemsKey` (Quiz đã khai sẵn
`itemsKey:"questions"` từ lâu cho "Start with mistakes") thì Quiz mới nhận đúng mảng câu hỏi khi vào
Fight. Sửa 1 lần ở `fight.js`, không đụng gì thêm ở `quiz.js` cho phần này.

**Đã test qua trình duyệt thật** (`test.html`, không chỉ đọc code): Fight dựng đủ 2 khung cùng câu hỏi,
chọn đúng "beautiful" ở khung 0 → điểm 1-0, khung 1 khoá rồi cả 2 tự đồng bộ sang câu tiếp; thoát Fight
về Single không lỗi. 0 lỗi console.

---

## ⚠️ ĐỢT 112 (11/8/2026) — "ÂM HẾT GIỜ NỔ KHI CÒN NHIỀU THỜI GIAN": KHÔNG PHẢI LỖI CỦA QUIZ

> **KHÔNG SỬA FILE NÀO CỦA QUIZ** — ghi ở đây vì thầy phát hiện lúc test Quiz, phiên sau dễ đi soi
> `quiz-sound.js` rồi mất công vô ích. Bug nằm ở `core/engine.js`, chi tiết đầy đủ ở
> `../../GHI CHU DU AN.md` Đợt 112 + `../../core/HUONG DAN CORE.md` mục "BẪY ĐỒNG HỒ MA".

**Triệu chứng thầy gặp:** đang chơi ván đếm ngược, đồng hồ còn nhiều (đo được: **0:28** và **0:09**) mà
`blockgametimeout.mp3` vẫn nổ. Lives để **Unlimited**.

**⚠️ HAI CÁI BẪY CHẨN ĐOÁN, đừng vấp lại:**
1. `quiz-sound.js` dùng CHUNG `blockgametimeout.mp3` cho cả `timeWarning` (còn 5s) **lẫn** `gameOver`
   (hết Lives — Đợt 64 cố ý làm vậy vì pack "Block" không có file game-over riêng). Nhìn code là ra ngay
   giả thuyết "hết mạng nghe nhầm ra hết giờ" — **nghe rất hợp lý nhưng SAI**, vì thầy để Lives Unlimited.
2. Đường `timeWarning` trong `core/engine.js` (`remaining <= 5 && remaining > 0 && !timeWarned`) **hoàn
   toàn đúng**, soi mãi cũng không thấy lỗi — vì thủ phạm là một đồng hồ của **VÁN TRƯỚC** còn sống ngầm.

**Thủ phạm thật:** bấm **☰ Menu → "Start again"** để lại một `setInterval` "ma" của ván cũ (chi tiết ở
core). Nó đếm ngược trên đồng hồ VÔ HÌNH của ván đã chết, tới mốc "còn 5s" của chính nó thì kêu — trong
khi màn hình đang hiện đồng hồ của ván MỚI, còn nhiều thời gian. Đã vá ở `core/engine.js` (Đợt 112).

---

## ⭐ ĐỢT 65 (4/8/2026, v0.9.40) — HẾT "GÓC VUÔNG KHI CHẠM" TRÊN TOMKO — ✅ THẦY DUYỆT → COMMIT `72e1b5f` + PUSH + LIVE

> **Đã kiểm chứng trên bản live:** Quiz **16/16** phần tử bo góc = `rgba(0, 0, 0, 0)`, 0 lỗi console.

> ⭐ **CÓ SỬA CORE** (thầy đồng ý trước). **KHÔNG sửa file nào của Quiz** — Quiz hết lỗi nhờ luật gốc.

**Thầy báo:** chạm vào ô đáp án hoặc nút Next/Back thì đúng lúc nhấn hiện ra nền **góc vuông** thò ra
ngoài viền bo tròn. Open the box đã hết sau vài đợt chỉnh, nhưng **Quiz và nhiều template khác vẫn bị**.
Chỉ máy 3 (TOMKO) bị, máy 1 và 2 không; GPU/CPU chỉ chạy 1-2% nên không phải máy yếu.

**Nguyên nhân (đo trên chính máy 3):** mặc định của Chrome `-webkit-tap-highlight-color: rgba(0,0,0,0.18)`,
chỉ vẽ khi input là **CHẠM** và **không bám border-radius**. Máy 1/2 dùng chuột nên không bao giờ vẽ. Vì
sao Open the box đã hết: Đợt 21 (điểm 1) nó tự đặt `-webkit-tap-highlight-color: transparent` cho
`.aw-otb-box`/`.aw-otb-qtile` — nhưng chỉ chữa cho riêng nó, không lan sang Quiz. Chi tiết đầy đủ +
số đo: `core/HUONG DAN CORE.md` mục "MÀN CẢM ỨNG (TOMKO)".

**Đo Quiz cụ thể — trước khi sửa 16 phần tử dính:**
`.aw-quiz-tile` ×4 (r=15.46px) · `.aw-navbtn` ×2 (r=14.49px) · `.aw-iconbtn` ×4 (r=9.66px) ·
`.aw-toolbtn` ×3 (r=13px) · `.aw-toolbtn-sm` ×4 (r=11px) — tất cả đều `rgba(0, 0, 0, 0.18)`.
**Sau khi sửa: 16/16 = `rgba(0, 0, 0, 0)`, 0 lỗi console.**

**Đã sửa:** đúng 1 luật `html { -webkit-tap-highlight-color: transparent; }` trong `core/app.css`
(thuộc tính KẾ THỪA nên phủ cả app). Không đụng `quiz.js`/`quiz.css`.

**Nghiệm thu bằng tay (máy không tự chạm được):** mở
`http://localhost:5510/scratch/kiem-tra-cham-tay.html` trên TOMKO — cột trái cố ý bật lại lỗi, cột phải
là bản đã vá, hình dạng giống hệt nhau. Chạm giữ ngón vào từng ô để so.

---

## ⭐ ĐỢT 64 (4/8/2026, v0.9.39) — THÊM THANH LIVES 0–10 — ✅ COMMIT `f0b0830` + PUSH + LIVE

**Thầy yêu cầu:** kiểm tra Quiz đã có thanh Lives chưa, chưa có thì thêm, từ 0 đến 10.
**Kiểm tra:** Quiz **chưa hề có** (chỉ có dòng thừa `lives: null` trong `sample-quiz.js`, không ai đọc).

### Đã làm
1. `hasLivesSlot: true` → engine dựng sẵn ô tim bên trái ô điểm (`ui.livesSlot`). **Không phải sửa core**:
   ô này + CSS `.aw-top-heart/.aw-top-heartcount` đã có từ True/false.
2. `buildExtraOptions` thêm nhóm **Lives** — slider `0..10`, 0 hiện **"Unlimited"**
   (`.aw-quiz-livesrow / -livesslider / -livesval` trong `quiz.css`; đây là điều khiển NGOÀI khung 16:9
   nên dùng px/rem, KHÔNG dùng `cqw`).
3. `normLives(v)`: `0` / `null` / `undefined` → **vô số mạng**. Act Quiz cũ không có trường `lives` nên
   mặc định BẮT BUỘC là vô số mạng — mặc định 5 sẽ làm mọi bộ đề cũ bỗng "Game over" giữa chừng.
4. Trả lời SAI → `loseLife()`: tim TRÁI NHẤT phóng to rồi tan (`.animate()` + `setTimeout` dự phòng
   theo luật core), 1..5 mạng hiện tim rời, 6..10 hiện gọn `N♥`.
5. Hết mạng → cờ `ending`: khoá ô đáp án + `updateNav()` cho 2 mũi tên mờ, 1,5s sau `finish("gameover")`;
   `raw.title = "Game over"` nên màn ăn mừng + bảng tổng kết đổi chữ (cơ chế sẵn có của engine).
6. Âm cuối ván: `sounds.complete` của template để **rỗng**, `finish()` tự chọn — xong bài
   `blockgamesuccessful` (y như cũ), hết mạng `blockgametimeout`. Nếu không làm vậy thì hết mạng vẫn
   nổ fanfare mừng chiến thắng.

### ⚠️ BẪY (ghi lại kẻo đợt sau vấp)
- `ui.setNav({onNext})` được engine gắn **thẳng** `btn.onclick = handler` → truyền `finish` trần vào là
  hàm nhận **MouseEvent làm `reason`**. Phải bọc `() => finish("complete")` (cả nhánh phím `→`).
- Cờ `ending` phải chặn CẢ `choose`, `goPrev/goNext`, `onKey` — nếu chỉ khoá nút, phím `←/→` vẫn lọt.
- `cleanup()` phải xoá `ui.livesSlot.innerHTML` kẻo tim còn sót sang game sau.

### Tự kiểm trình duyệt thật (devserver 5599, đo DOM — pane không compositing nên screenshot timeout)
lives=3 sai 3 câu → 3→2→1→0 tim, khoá ô + 2 mũi tên disabled, hiện "Game over", tổng kết "GAME OVER
Score 0/6" · lives=2 y hệt · lives=8 → `8♥`, sai 1 → `7♥` · **act cũ không có `lives` → 0 tim, sai
hết 6 câu vẫn "Game complete"** (zero-diff) · lives=3 đúng hết → 3 tim nguyên, "Game complete" 6/6 ·
Menu "Submit answers" → "Game complete" · panel Options đủ 8 nhóm, Lives min 0 max 10, về 0 =
"Unlimited". **Console 0 lỗi ở mọi ca.**

### ✅ THẦY DUYỆT → COMMIT `f0b0830` + PUSH + LIVE (4/8/2026)
Push `d4fc9ff..f0b0830`. **`curl` lần đầu cả 3 file còn là bản CŨ**, poll lại 20s sau mới đủ dấu mốc
(`hasLivesSlot` · `aw-quiz-livesslider` · `gameOver`) — bẫy Pages quen thuộc, đừng tin lần curl đầu.
**Chạy lại trọn bộ kiểm tra TRÊN BẢN LIVE**: lives 3 → `♥♥♥→♥♥→♥→(trống)`, khoá ô + 2 mũi tên
disabled, "GAME OVER · Score 0/6" · act cũ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete" ·
lives 8 → `8♥`→`7♥` · đúng hết → 3 tim nguyên 6/6 · Submit answers → "Game complete" · Options đủ
8 nhóm, Lives 0..10 về 0 = "Unlimited" · **14/14 template mount 0 lỗi · console 0 lỗi**.
⚠️ `javascript_tool` cắt ở 30s → kịch bản test dài phải chẻ nhiều lượt (giữ helper trên `window`).

**Việc kế: thầy chơi thử trên TOMKO (chọn số mạng vừa tay); chỗ nào chưa vừa thì báo.**

---

## Lịch sử trước đó (tóm tắt, chi tiết ở `../../GHI CHU DU AN.md`)

- **Đợt 59 (3/8/2026, v0.9.34)** — 4 cải tiến: nav không còn biến mất lúc game-complete (⭐ sửa core:
  bỏ `navWrap.style.visibility="hidden"` trong `celebrate()`) + quiz huỷ `autoTimer` khi điều hướng tay ·
  không tách 1 từ đơn (`--tw` co riêng từng ô) · đáp án dài nhiều chữ thì ô cao AUTO, `--fit` co để không
  đè câu hỏi · chuyển câu TRƯỢT chữ, ô đáp án CỐ ĐỊNH (dựng card + tiles 1 lần rồi cập nhật tại chỗ).
- **Đợt 54 (3/8/2026)** — "Points off (wrong answer)" (option CHUNG của engine, quiz tự trừ trong
  `scoreNow()`) + **Allow skip** (mặc định TẮT: phải trả lời mới Next được).
- **Đợt 12 (30/7/2026)** — bỏ `text-transform:uppercase` ở `.aw-quiz-tile` (hết ép HOA đáp án; ALL CAPS
  chỉ còn ở Anagram).

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

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **605px → 344px**.
